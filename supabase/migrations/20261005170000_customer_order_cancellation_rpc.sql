-- Customer cancellation must be an atomic, owner-checked workflow operation.
-- The shopper client must not update orders or delivery assignments directly.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS cancellation_reason text,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

DO $$
BEGIN
  IF to_regclass('public.delivery_assignments') IS NULL
     OR to_regclass('public.delivery_partners') IS NULL
     OR to_regtype('public.order_status') IS NULL THEN
    RAISE EXCEPTION 'Customer cancellation requires the delivery assignment and order workflow schema';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.customer_cancel_order(
  _order_id uuid,
  _reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_reason text := NULLIF(btrim(_reason), '');
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sign in to cancel this order' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_order
  FROM public.orders
  WHERE id = _order_id
    AND user_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found for this account' USING ERRCODE = 'P0002';
  END IF;

  IF v_order.status::text NOT IN (
    'new', 'accepted', 'vendor_accepted', 'preparing', 'packed', 'ready_for_pickup'
  ) THEN
    RAISE EXCEPTION 'Order cannot be cancelled from status %', v_order.status
      USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.orders
  SET status = 'cancelled'::public.order_status,
      cancellation_reason = v_reason,
      cancelled_at = now(),
      updated_at = now()
  WHERE id = v_order.id;

  -- Release an outstanding offer if the order had already entered dispatch.
  WITH released AS (
    UPDATE public.delivery_assignments
    SET status = 'cancelled', updated_at = now()
    WHERE order_id = v_order.id
      AND status::text IN (
        'pending', 'requested', 'accepted', 'navigating_to_vendor', 'reached_vendor'
      )
    RETURNING partner_id
  )
  UPDATE public.delivery_partners partner
  SET availability = 'online', updated_at = now()
  WHERE partner.id IN (SELECT partner_id FROM released)
    AND partner.availability = 'busy'
    AND NOT EXISTS (
      SELECT 1
      FROM public.delivery_assignments active
      WHERE active.partner_id = partner.id
        AND active.status::text IN (
          'accepted', 'navigating_to_vendor', 'reached_vendor', 'picked_up', 'out_for_delivery'
        )
    );

  RETURN jsonb_build_object(
    'id', v_order.id,
    'status', 'cancelled',
    'cancellation_reason', v_reason,
    'cancelled_at', now()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.customer_cancel_order(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.customer_cancel_order(uuid, text) TO authenticated;
NOTIFY pgrst, 'reload schema';
