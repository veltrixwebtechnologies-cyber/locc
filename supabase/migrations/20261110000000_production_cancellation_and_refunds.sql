-- ==============================================================================
-- LocalShore Production-Ready Order Cancellation, Refund & Inventory Engine
-- Migration: 20261110000000_production_cancellation_and_refunds.sql
-- ==============================================================================

BEGIN;

-- 1. Ensure public.orders has required workflow & cancellation tracking columns
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS cancellation_reason text,
  ADD COLUMN IF NOT EXISTS cancellation_initiator text,
  ADD COLUMN IF NOT EXISTS cancellation_fee numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS return_status text,
  ADD COLUMN IF NOT EXISTS return_initiated_at timestamptz,
  ADD COLUMN IF NOT EXISTS return_completed_at timestamptz;

-- 2. Ensure public.order_items has item-level status for partial cancellations
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'returned')),
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancellation_reason text,
  ADD COLUMN IF NOT EXISTS refund_amount numeric(10,2) NOT NULL DEFAULT 0;

-- 3. Order Cancellations Table (Central authoritative record of cancellations)
CREATE TABLE IF NOT EXISTS public.order_cancellations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  initiator_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  initiator_role text NOT NULL CHECK (initiator_role IN ('customer', 'seller', 'rider', 'admin', 'system')),
  reason_code text NOT NULL,
  reason_text text,
  order_stage_at_cancellation text NOT NULL,
  cancellation_fee numeric(10,2) NOT NULL DEFAULT 0,
  refund_amount numeric(10,2) NOT NULL DEFAULT 0,
  is_partial boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('requested', 'under_review', 'completed', 'rejected')),
  override_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  override_reason text,
  idempotency_key text UNIQUE,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_cancellations_order_id ON public.order_cancellations(order_id);
CREATE INDEX IF NOT EXISTS idx_order_cancellations_initiator ON public.order_cancellations(initiator_role, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_cancellations_status ON public.order_cancellations(status);

-- 4. Order Events Table (Append-only audit history of lifecycle & transitions)
CREATE TABLE IF NOT EXISTS public.order_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_role text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_events_order_id ON public.order_events(order_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_events_type ON public.order_events(event_type);

-- 5. Inventory Reservations Table (Authoritative reservation and stock release)
CREATE TABLE IF NOT EXISTS public.inventory_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity > 0),
  status text NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved', 'released', 'consumed')),
  reserved_at timestamptz NOT NULL DEFAULT now(),
  released_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT uq_order_product_reservation UNIQUE (order_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_reservations_order ON public.inventory_reservations(order_id);
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_product ON public.inventory_reservations(product_id, status);

-- 6. Inventory Movements Audit Table (Ledger of all stock changes)
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  delta integer NOT NULL,
  reason text NOT NULL,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_role text NOT NULL,
  balance_after integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_product ON public.inventory_movements(product_id, created_at DESC);

-- 7. Ensure Refunds Table Exists with Full Lifecycle Columns
CREATE TABLE IF NOT EXISTS public.refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  cancellation_id uuid REFERENCES public.order_cancellations(id) ON DELETE SET NULL,
  payment_attempt_id uuid REFERENCES public.payment_attempts(id) ON DELETE RESTRICT,
  seller_id uuid REFERENCES public.sellers(id) ON DELETE RESTRICT,
  store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL,
  requested_by uuid REFERENCES auth.users(id) ON DELETE RESTRICT,
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'INR' CHECK (currency = 'INR'),
  reason_code text NOT NULL,
  reason text,
  decision_reason text,
  status text NOT NULL DEFAULT 'requested' CHECK (status IN (
    'requested', 'reviewing', 'approved', 'processing', 'refunded', 'partially_refunded', 'failed', 'rejected', 'cancelled'
  )),
  payment_method text NOT NULL DEFAULT 'card' CHECK (payment_method IN ('upi', 'card', 'cod', 'wallet', 'demo')),
  execution_method text NOT NULL DEFAULT 'gateway' CHECK (execution_method IN ('gateway', 'manual', 'wallet')),
  gateway_provider text DEFAULT 'razorpay',
  gateway_refund_id text UNIQUE,
  manual_reference text,
  idempotency_key text,
  failure_reason text,
  retry_count integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  requested_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  processed_at timestamptz,
  failed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure cancellation_id and retry_count columns exist if refunds table was created earlier
ALTER TABLE public.refunds
  ADD COLUMN IF NOT EXISTS cancellation_id uuid REFERENCES public.order_cancellations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS retry_count integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_refunds_order_id ON public.refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON public.refunds(status, requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_refunds_gateway_id ON public.refunds(gateway_refund_id);

-- 8. Order Cancellation Policies Table (Configurable rules)
CREATE TABLE IF NOT EXISTS public.order_cancellation_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL UNIQUE,
  allow_customer_cancellation boolean NOT NULL DEFAULT true,
  max_cancellation_stage text NOT NULL DEFAULT 'preparing',
  fee_type text NOT NULL DEFAULT 'none' CHECK (fee_type IN ('none', 'flat', 'percentage')),
  fee_value numeric(10,2) NOT NULL DEFAULT 0,
  rider_compensation_on_arrival numeric(10,2) NOT NULL DEFAULT 30.00,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed default policies
INSERT INTO public.order_cancellation_policies (category, max_cancellation_stage, fee_type, fee_value)
VALUES
  ('default', 'rider_at_shop', 'none', 0),
  ('fresh', 'preparing', 'percentage', 20.00),
  ('bakery', 'preparing', 'percentage', 25.00),
  ('restaurants', 'preparing', 'percentage', 30.00),
  ('groceries', 'rider_at_shop', 'none', 0),
  ('fashion', 'rider_at_shop', 'none', 0)
ON CONFLICT (category) DO NOTHING;

-- 9. Enable RLS
ALTER TABLE public.order_cancellations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_cancellation_policies ENABLE ROW LEVEL SECURITY;

-- Customer can read own order cancellations & refunds
DROP POLICY IF EXISTS "Customers view own cancellations" ON public.order_cancellations;
CREATE POLICY "Customers view own cancellations" ON public.order_cancellations
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_cancellations.order_id AND o.user_id = auth.uid())
    OR initiator_id = auth.uid()
  );

DROP POLICY IF EXISTS "Customers view own refunds" ON public.refunds;
CREATE POLICY "Customers view own refunds" ON public.refunds
  FOR SELECT TO authenticated
  USING (
    requested_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.orders o WHERE o.id = refunds.order_id AND o.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Anyone read active cancellation policies" ON public.order_cancellation_policies;
CREATE POLICY "Anyone read active cancellation policies" ON public.order_cancellation_policies
  FOR SELECT TO authenticated USING (is_active = true);

-- Admins & Sellers permissions
GRANT SELECT ON public.order_cancellations TO authenticated;
GRANT SELECT ON public.refunds TO authenticated;
GRANT SELECT ON public.order_events TO authenticated;
GRANT SELECT ON public.order_cancellation_policies TO authenticated;

-- ==============================================================================
-- 10. RPC: EVALUATE CANCELLATION ELIGIBILITY
-- Authoritative, server-side rule engine determining if an order can be cancelled.
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.evaluate_cancellation_eligibility(
  _order_id uuid,
  _initiator_role text DEFAULT 'customer'
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_assignment public.delivery_assignments%ROWTYPE;
  v_role text := lower(COALESCE(_initiator_role, 'customer'));
  v_status text;
  v_eligible boolean := false;
  v_reason_code text := 'OK';
  v_reason text := 'Order is eligible for cancellation';
  v_cancellation_fee numeric(10,2) := 0;
  v_refundable_amount numeric(10,2) := 0;
  v_requires_review boolean := false;
  v_allowed_actions jsonb := '[]'::jsonb;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = _order_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('eligible', false, 'code', 'ORDER_NOT_FOUND', 'reason', 'Order not found');
  END IF;

  v_status := v_order.status::text;

  -- 1. Already terminal states
  IF v_status IN ('cancelled', 'cancelled_by_vendor') THEN
    RETURN jsonb_build_object(
      'eligible', false,
      'code', 'ALREADY_CANCELLED',
      'reason', 'This order has already been cancelled',
      'cancellationFee', 0,
      'estimatedRefund', 0,
      'allowedActions', '[]'::jsonb
    );
  END IF;

  IF v_status = 'delivered' THEN
    RETURN jsonb_build_object(
      'eligible', false,
      'code', 'ORDER_DELIVERED',
      'reason', 'Order has already been delivered. Please use return or customer dispute workflow.',
      'cancellationFee', 0,
      'estimatedRefund', 0,
      'allowedActions', jsonb_build_array('initiate_return', 'contact_support')
    );
  END IF;

  -- Fetch active assignment if present
  SELECT * INTO v_assignment
  FROM public.delivery_assignments
  WHERE order_id = v_order.id
    AND status::text NOT IN ('cancelled', 'rejected', 'expired')
  ORDER BY created_at DESC LIMIT 1;

  -- 2. ADMIN ROLE: Admin has global override capability
  IF v_role = 'admin' THEN
    RETURN jsonb_build_object(
      'eligible', true,
      'code', 'ADMIN_OVERRIDE_AVAILABLE',
      'reason', 'Administrator override cancellation allowed with audit log',
      'cancellationFee', 0,
      'estimatedRefund', CASE WHEN v_order.payment_status = 'paid' THEN v_order.total ELSE 0 END,
      'requiresReview', false,
      'allowedActions', jsonb_build_array('admin_cancel', 'admin_override_cancel', 'force_refund')
    );
  END IF;

  -- 3. SELLER ROLE
  IF v_role = 'seller' THEN
    IF v_status IN ('picked_up', 'out_for_delivery') THEN
      RETURN jsonb_build_object(
        'eligible', false,
        'code', 'IN_TRANSIT_SELLER_RESTRICTED',
        'reason', 'Order has already been picked up by the delivery partner. Contact delivery support for return-to-seller.',
        'cancellationFee', 0,
        'estimatedRefund', 0,
        'allowedActions', jsonb_build_array('request_return_to_seller', 'contact_support')
      );
    ELSE
      RETURN jsonb_build_object(
        'eligible', true,
        'code', 'SELLER_CANCEL_ALLOWED',
        'reason', 'Seller can cancel with mandatory reason (Out of stock, Shop closed, Operational issue). Full customer refund will be issued.',
        'cancellationFee', 0,
        'estimatedRefund', CASE WHEN v_order.payment_status = 'paid' THEN v_order.total ELSE 0 END,
        'requiresReview', false,
        'allowedActions', jsonb_build_array('seller_cancel', 'partial_item_cancel')
      );
    END IF;
  END IF;

  -- 4. DELIVERY PARTNER (RIDER) ROLE
  IF v_role = 'rider' THEN
    IF v_assignment.id IS NULL THEN
      RETURN jsonb_build_object('eligible', false, 'code', 'NO_ACTIVE_ASSIGNMENT', 'reason', 'No active delivery assignment found for this order');
    END IF;

    IF v_assignment.status::text IN ('picked_up', 'out_for_delivery') THEN
      RETURN jsonb_build_object(
        'eligible', false,
        'code', 'RIDER_ALREADY_PICKED_UP',
        'reason', 'Package is in rider custody. Rider cannot cancel order; must initiate return-to-seller workflow.',
        'cancellationFee', 0,
        'estimatedRefund', 0,
        'allowedActions', jsonb_build_array('initiate_return_to_seller', 'report_delivery_issue')
      );
    ELSE
      RETURN jsonb_build_object(
        'eligible', true,
        'code', 'RIDER_REASSIGNMENT_AVAILABLE',
        'reason', 'Rider can reject or release assignment. Order will be queued for reassignment to another partner without cancelling customer order.',
        'cancellationFee', 0,
        'estimatedRefund', 0,
        'allowedActions', jsonb_build_array('release_assignment', 'report_breakdown')
      );
    END IF;
  END IF;

  -- 5. CUSTOMER ROLE (Default)
  IF v_status IN ('picked_up', 'out_for_delivery') OR v_assignment.status::text IN ('picked_up', 'out_for_delivery') THEN
    RETURN jsonb_build_object(
      'eligible', false,
      'code', 'ORDER_OUT_FOR_DELIVERY',
      'reason', 'Your order is already on its way and cannot be cancelled directly. You can reject the order at doorstep or contact support.',
      'cancellationFee', 0,
      'estimatedRefund', 0,
      'allowedActions', jsonb_build_array('contact_support', 'reject_at_doorstep')
    );
  END IF;

  IF v_status IN ('new', 'placed', 'accepted', 'vendor_accepted') THEN
    v_eligible := true;
    v_reason_code := 'FREE_CANCELLATION_ALLOWED';
    v_reason := 'Cancellation is free before shop starts preparation';
    v_cancellation_fee := 0;
    v_refundable_amount := CASE WHEN v_order.payment_status = 'paid' THEN v_order.total ELSE 0 END;
    v_allowed_actions := jsonb_build_array('cancel_order');
  ELSIF v_status IN ('preparing', 'packed') THEN
    v_eligible := true;
    v_reason_code := 'PREPARATION_CONDITIONAL_CANCEL';
    v_reason := 'Shop is already preparing your order. A cancellation fee may apply depending on item category.';
    -- Nominal fee for prepared perishable items
    v_cancellation_fee := ROUND(LEAST(v_order.total * 0.15, 50.00), 2);
    v_refundable_amount := GREATEST(0, CASE WHEN v_order.payment_status = 'paid' THEN v_order.total - v_cancellation_fee ELSE 0 END);
    v_allowed_actions := jsonb_build_array('cancel_order');
  ELSIF v_status IN ('ready_for_pickup', 'assigned', 'delivery_partner_assigned', 'rider_assigned', 'rider_accepted', 'rider_at_shop') THEN
    v_eligible := true;
    v_reason_code := 'DISPATCHED_CONDITIONAL_CANCEL';
    IF v_assignment.status::text IN ('reached_vendor', 'rider_at_shop') THEN
      v_reason := 'Delivery partner has reached the store. A nominal dispatch compensation fee applies.';
      v_cancellation_fee := 30.00;
    ELSE
      v_reason := 'Delivery partner has been assigned. You may cancel before pickup.';
      v_cancellation_fee := 15.00;
    END IF;
    v_refundable_amount := GREATEST(0, CASE WHEN v_order.payment_status = 'paid' THEN v_order.total - v_cancellation_fee ELSE 0 END);
    v_allowed_actions := jsonb_build_array('cancel_order');
  ELSE
    v_eligible := false;
    v_reason_code := 'STATUS_RESTRICTED';
    v_reason := 'Order cannot be cancelled in status: ' || v_status;
  END IF;

  RETURN jsonb_build_object(
    'eligible', v_eligible,
    'code', v_reason_code,
    'reason', v_reason,
    'cancellationFee', v_cancellation_fee,
    'estimatedRefund', v_refundable_amount,
    'requiresReview', v_requires_review,
    'allowedActions', v_allowed_actions
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.evaluate_cancellation_eligibility(uuid, text) TO authenticated;

-- ==============================================================================
-- 11. RPC: ATOMIC ORDER CANCELLATION WORKFLOW
-- Complete authoritative state machine with row-level locking, inventory release,
-- delivery assignment revocation, fee deduction, and refund registration.
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.cancel_order_workflow(
  _order_id uuid,
  _initiator_role text DEFAULT 'customer',
  _reason_code text DEFAULT 'CUSTOMER_REQUEST',
  _reason_text text DEFAULT NULL,
  _idempotency_key text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_cancellation public.order_cancellations%ROWTYPE;
  v_eligibility jsonb;
  v_role text := lower(COALESCE(_initiator_role, 'customer'));
  v_fee numeric(10,2) := 0;
  v_refund_amt numeric(10,2) := 0;
  v_released_item record;
  v_stock_curr integer;
  v_partner_id uuid;
  v_refund_row public.refunds%ROWTYPE;
  v_payment_attempt public.payment_attempts%ROWTYPE;
BEGIN
  -- 1. Idempotency Check
  IF _idempotency_key IS NOT NULL AND btrim(_idempotency_key) <> '' THEN
    SELECT * INTO v_cancellation
    FROM public.order_cancellations
    WHERE idempotency_key = btrim(_idempotency_key);
    IF FOUND THEN
      RETURN jsonb_build_object(
        'success', true,
        'cancellation_id', v_cancellation.id,
        'status', v_cancellation.status,
        'refund_amount', v_cancellation.refund_amount,
        'cancellation_fee', v_cancellation.cancellation_fee,
        'idempotent_replay', true
      );
    END IF;
  END IF;

  -- 2. Lock Order Row Exclusively
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = _order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found' USING ERRCODE = 'P0002';
  END IF;

  -- 3. Authorization Check
  IF v_role = 'customer' AND auth.uid() IS NOT NULL AND v_order.user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: You can only cancel your own orders' USING ERRCODE = '42501';
  END IF;

  -- 4. Evaluate Eligibility
  v_eligibility := public.evaluate_cancellation_eligibility(_order_id, v_role);
  IF (v_eligibility->>'eligible')::boolean IS NOT TRUE THEN
    RAISE EXCEPTION '%', COALESCE(v_eligibility->>'reason', 'Order is not eligible for cancellation')
      USING ERRCODE = 'P0001';
  END IF;

  v_fee := COALESCE((v_eligibility->>'cancellationFee')::numeric, 0);
  v_refund_amt := COALESCE((v_eligibility->>'estimatedRefund')::numeric, 0);

  -- 5. Update Order Status
  UPDATE public.orders
  SET status = (CASE WHEN v_role = 'seller' THEN 'cancelled_by_vendor' ELSE 'cancelled' END)::public.order_status,
      cancellation_reason = COALESCE(_reason_text, _reason_code),
      cancellation_initiator = v_role,
      cancellation_fee = v_fee,
      cancelled_at = now(),
      updated_at = now()
  WHERE id = v_order.id;

  -- 6. Insert Order Cancellation Record
  INSERT INTO public.order_cancellations (
    order_id, initiator_id, initiator_role, reason_code, reason_text,
    order_stage_at_cancellation, cancellation_fee, refund_amount,
    status, idempotency_key, metadata
  ) VALUES (
    v_order.id, auth.uid(), v_role, _reason_code, _reason_text,
    v_order.status::text, v_fee, v_refund_amt,
    'completed', _idempotency_key,
    jsonb_build_object('eligibility', v_eligibility)
  )
  RETURNING * INTO v_cancellation;

  -- 7. Revoke & Free Active Delivery Assignment
  FOR v_partner_id IN
    UPDATE public.delivery_assignments
    SET status = 'cancelled', updated_at = now()
    WHERE order_id = v_order.id
      AND status::text IN ('pending', 'requested', 'accepted', 'navigating_to_vendor', 'reached_vendor')
    RETURNING partner_id
  LOOP
    -- Reset partner to online if they have no other concurrent active jobs
    UPDATE public.delivery_partners
    SET availability = 'online', updated_at = now()
    WHERE id = v_partner_id
      AND NOT EXISTS (
        SELECT 1 FROM public.delivery_assignments active
        WHERE active.partner_id = v_partner_id
          AND active.id <> v_order.id
          AND active.status::text IN ('accepted', 'navigating_to_vendor', 'reached_vendor', 'picked_up', 'out_for_delivery')
      );
  END LOOP;

  -- 8. Transactional Inventory Release (Prevent Double Release)
  -- Update reservation status atomically
  UPDATE public.inventory_reservations
  SET status = 'released', released_at = now()
  WHERE order_id = v_order.id AND status = 'reserved';

  -- Restore stock on products
  FOR v_released_item IN
    SELECT oi.product_id, oi.qty
    FROM public.order_items oi
    WHERE oi.order_id = v_order.id
  LOOP
    IF v_released_item.product_id IS NOT NULL THEN
      -- Lock product row exclusively to prevent race conditions with ongoing purchases
      SELECT stock INTO v_stock_curr
      FROM public.products
      WHERE id = v_released_item.product_id
      FOR UPDATE;

      IF FOUND THEN
        UPDATE public.products
        SET stock = stock + v_released_item.qty, updated_at = now()
        WHERE id = v_released_item.product_id;

        -- Record inventory ledger entry
        INSERT INTO public.inventory_movements (
          product_id, order_id, delta, reason, actor_id, actor_role, balance_after
        ) VALUES (
          v_released_item.product_id, v_order.id, v_released_item.qty,
          'ORDER_CANCELLED_' || UPPER(v_role), auth.uid(), v_role,
          v_stock_curr + v_released_item.qty
        );
      END IF;
    END IF;
  END LOOP;

  -- 9. Register Refund if Prepaid & Captured
  IF v_refund_amt > 0 AND v_order.payment_status = 'paid' THEN
    SELECT * INTO v_payment_attempt
    FROM public.payment_attempts
    WHERE order_id = v_order.id AND status = 'captured'
    ORDER BY updated_at DESC LIMIT 1;

    INSERT INTO public.refunds (
      order_id, cancellation_id, payment_attempt_id, seller_id, store_id,
      requested_by, amount, currency, reason_code, reason, status,
      payment_method, execution_method, gateway_provider, idempotency_key
    ) VALUES (
      v_order.id, v_cancellation.id, v_payment_attempt.id, v_order.seller_id, v_order.store_id,
      COALESCE(auth.uid(), v_order.user_id), v_refund_amt, 'INR', _reason_code,
      COALESCE(_reason_text, 'Order cancelled by ' || v_role),
      'approved', -- Ready for gateway refund dispatch
      COALESCE(v_order.payment_method, 'card'),
      CASE WHEN LOWER(v_order.payment_method) = 'cod' THEN 'manual' ELSE 'gateway' END,
      COALESCE(v_payment_attempt.provider, 'razorpay'),
      COALESCE(_idempotency_key, gen_random_uuid()::text)
    )
    RETURNING * INTO v_refund_row;
  END IF;

  -- 10. Record Order Lifecycle Event
  INSERT INTO public.order_events (
    order_id, event_type, actor_id, actor_role, payload
  ) VALUES (
    v_order.id,
    'ORDER_CANCELLED',
    auth.uid(),
    v_role,
    jsonb_build_object(
      'cancellation_id', v_cancellation.id,
      'reason_code', _reason_code,
      'cancellation_fee', v_fee,
      'refund_amount', v_refund_amt,
      'refund_id', v_refund_row.id
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order.id,
    'status', 'cancelled',
    'cancellation_id', v_cancellation.id,
    'refund_id', v_refund_row.id,
    'cancellation_fee', v_fee,
    'refund_amount', v_refund_amt
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_order_workflow(uuid, text, text, text, text) TO authenticated;

-- ==============================================================================
-- 12. RPC: PARTIAL ORDER ITEM CANCELLATION
-- Allows cancelling specific items from an order and recalculating totals & refund.
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.cancel_order_item_workflow(
  _order_id uuid,
  _order_item_id uuid,
  _reason text DEFAULT 'Item unavailable'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_item public.order_items%ROWTYPE;
  v_refund_amt numeric(10,2) := 0;
  v_new_subtotal numeric(10,2) := 0;
  v_new_total numeric(10,2) := 0;
  v_active_items_count integer;
  v_stock_curr integer;
BEGIN
  -- Lock order and item
  SELECT * INTO v_order FROM public.orders WHERE id = _order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;

  SELECT * INTO v_item FROM public.order_items WHERE id = _order_item_id AND order_id = _order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order item not found'; END IF;

  IF v_item.status = 'cancelled' THEN
    RAISE EXCEPTION 'Item is already cancelled';
  END IF;

  IF v_order.status::text IN ('picked_up', 'out_for_delivery', 'delivered', 'cancelled') THEN
    RAISE EXCEPTION 'Cannot cancel individual item at current order stage: %', v_order.status;
  END IF;

  -- 1. Mark item as cancelled
  v_refund_amt := v_item.line_total;
  UPDATE public.order_items
  SET status = 'cancelled',
      cancelled_at = now(),
      cancellation_reason = _reason,
      refund_amount = v_refund_amt
  WHERE id = v_item.id;

  -- 2. Restore item stock
  IF v_item.product_id IS NOT NULL THEN
    SELECT stock INTO v_stock_curr FROM public.products WHERE id = v_item.product_id FOR UPDATE;
    IF FOUND THEN
      UPDATE public.products SET stock = stock + v_item.qty WHERE id = v_item.product_id;
      INSERT INTO public.inventory_movements (
        product_id, order_id, delta, reason, actor_id, actor_role, balance_after
      ) VALUES (
        v_item.product_id, v_order.id, v_item.qty,
        'PARTIAL_ITEM_CANCELLED', auth.uid(), 'seller', v_stock_curr + v_item.qty
      );
    END IF;
  END IF;

  -- 3. Check remaining active items
  SELECT COUNT(*), COALESCE(SUM(line_total), 0)
  INTO v_active_items_count, v_new_subtotal
  FROM public.order_items
  WHERE order_id = v_order.id AND status = 'active';

  IF v_active_items_count = 0 THEN
    -- All items are now cancelled; cancel whole order
    RETURN public.cancel_order_workflow(
      _order_id, 'seller', 'ALL_ITEMS_CANCELLED', _reason, gen_random_uuid()::text
    );
  END IF;

  -- 4. Recalculate totals
  v_new_total := v_new_subtotal + v_order.shipping_fee;
  UPDATE public.orders
  SET subtotal = v_new_subtotal,
      total = v_new_total,
      updated_at = now()
  WHERE id = v_order.id;

  -- 5. Issue partial refund if prepaid
  IF v_order.payment_status = 'paid' AND v_refund_amt > 0 THEN
    INSERT INTO public.refunds (
      order_id, requested_by, seller_id, store_id, amount, currency,
      reason_code, reason, status, payment_method, execution_method,
      gateway_provider, idempotency_key
    ) VALUES (
      v_order.id, COALESCE(auth.uid(), v_order.user_id), v_order.seller_id, v_order.store_id,
      v_refund_amt, 'INR', 'PARTIAL_ITEM_CANCELLATION', _reason,
      'approved', COALESCE(v_order.payment_method, 'card'), 'gateway', 'razorpay',
      gen_random_uuid()::text
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order.id,
    'cancelled_item_id', v_item.id,
    'refund_amount', v_refund_amt,
    'new_total', v_new_total,
    'active_items_remaining', v_active_items_count
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_order_item_workflow(uuid, uuid, text) TO authenticated;

-- ==============================================================================
-- 13. RPC: RIDER ABANDON / REASSIGNMENT WORKFLOW
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.rider_reject_assignment_workflow(
  _assignment_id uuid,
  _reason text DEFAULT 'Rider emergency or vehicle breakdown'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_assignment public.delivery_assignments%ROWTYPE;
  v_order public.orders%ROWTYPE;
BEGIN
  SELECT * INTO v_assignment
  FROM public.delivery_assignments
  WHERE id = _assignment_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Assignment not found'; END IF;

  SELECT * INTO v_order
  FROM public.orders
  WHERE id = v_assignment.order_id
  FOR UPDATE;

  -- If order was already picked up, rider cannot reject without return workflow
  IF v_assignment.status::text IN ('picked_up', 'out_for_delivery') THEN
    RAISE EXCEPTION 'Order has already been picked up. Please initiate Return-to-Seller instead.';
  END IF;

  -- Mark assignment as rejected
  UPDATE public.delivery_assignments
  SET status = 'rejected', updated_at = now()
  WHERE id = _assignment_id;

  -- Set rider to online
  UPDATE public.delivery_partners
  SET availability = 'online', updated_at = now()
  WHERE id = v_assignment.partner_id;

  -- Record event
  INSERT INTO public.order_events (order_id, event_type, actor_id, actor_role, payload)
  VALUES (
    v_order.id,
    'RIDER_ASSIGNMENT_REJECTED',
    auth.uid(),
    'rider',
    jsonb_build_object('assignment_id', _assignment_id, 'reason', _reason)
  );

  -- Requeue order for next available delivery partner (unless cancelled)
  IF v_order.status::text NOT IN ('cancelled', 'cancelled_by_vendor', 'delivered') THEN
    UPDATE public.orders
    SET status = 'ready_for_pickup'::public.order_status, updated_at = now()
    WHERE id = v_order.id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'assignment_id', _assignment_id,
    'order_id', v_order.id,
    'status', 'reassigned'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.rider_reject_assignment_workflow(uuid, text) TO authenticated;

-- ==============================================================================
-- 14. RPC: ADMIN OVERRIDE CANCELLATION
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.admin_override_cancellation_workflow(
  _order_id uuid,
  _audit_reason text,
  _issue_full_refund boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_refund_amt numeric(10,2) := 0;
  v_cancellation public.order_cancellations%ROWTYPE;
BEGIN
  IF NULLIF(btrim(_audit_reason), '') IS NULL THEN
    RAISE EXCEPTION 'A mandatory audit reason is required for administrator override';
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = _order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;

  IF _issue_full_refund AND v_order.payment_status = 'paid' THEN
    v_refund_amt := v_order.total;
  END IF;

  UPDATE public.orders
  SET status = 'cancelled'::public.order_status,
      cancellation_reason = 'ADMIN_OVERRIDE: ' || _audit_reason,
      cancellation_initiator = 'admin',
      cancelled_at = now(),
      updated_at = now()
  WHERE id = v_order.id;

  INSERT INTO public.order_cancellations (
    order_id, initiator_id, initiator_role, reason_code, reason_text,
    order_stage_at_cancellation, cancellation_fee, refund_amount,
    status, override_by, override_reason, metadata
  ) VALUES (
    v_order.id, auth.uid(), 'admin', 'ADMIN_EXCEPTIONAL_OVERRIDE', _audit_reason,
    v_order.status::text, 0, v_refund_amt, 'completed', auth.uid(), _audit_reason,
    jsonb_build_object('admin_id', auth.uid(), 'override_timestamp', now())
  )
  RETURNING * INTO v_cancellation;

  -- Create approved refund record if applicable
  IF v_refund_amt > 0 THEN
    INSERT INTO public.refunds (
      order_id, cancellation_id, requested_by, approved_by, seller_id, store_id,
      amount, currency, reason_code, reason, status, payment_method, execution_method,
      gateway_provider, idempotency_key, approved_at
    ) VALUES (
      v_order.id, v_cancellation.id, auth.uid(), auth.uid(), v_order.seller_id, v_order.store_id,
      v_refund_amt, 'INR', 'ADMIN_OVERRIDE', _audit_reason,
      'approved', COALESCE(v_order.payment_method, 'card'), 'gateway', 'razorpay',
      gen_random_uuid()::text, now()
    );
  END IF;

  INSERT INTO public.order_events (order_id, event_type, actor_id, actor_role, payload)
  VALUES (
    v_order.id, 'ADMIN_OVERRIDE_CANCELLATION', auth.uid(), 'admin',
    jsonb_build_object('audit_reason', _audit_reason, 'refund_amount', v_refund_amt)
  );

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order.id,
    'status', 'cancelled',
    'audit_reason', _audit_reason,
    'refund_amount', v_refund_amt
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_override_cancellation_workflow(uuid, text, boolean) TO authenticated;

COMMIT;
NOTIFY pgrst, 'reload schema';

