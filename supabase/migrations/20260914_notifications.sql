-- Durable notification outbox for customer, seller, and admin audiences.
-- Order/support triggers write these rows in the same transaction as the
-- business event, so a successful event cannot silently lose its notification.

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  audience text NOT NULL CHECK (audience IN ('customer', 'seller', 'admin')),
  seller_id uuid,
  order_id uuid,
  support_ticket_id uuid,
  title text NOT NULL,
  body text NOT NULL,
  kind text NOT NULL DEFAULT 'info',
  link text,
  event_key text NOT NULL UNIQUE,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Upgrade the original customer-only notifications table in place. These
-- statements are intentionally idempotent so the migration is safe to rerun.
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS recipient_user_id uuid,
  ADD COLUMN IF NOT EXISTS audience text,
  ADD COLUMN IF NOT EXISTS seller_id uuid,
  ADD COLUMN IF NOT EXISTS order_id uuid,
  ADD COLUMN IF NOT EXISTS support_ticket_id uuid,
  ADD COLUMN IF NOT EXISTS event_key text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notifications'
      AND column_name = 'user_id'
  ) THEN
    UPDATE public.notifications
    SET
      recipient_user_id = COALESCE(recipient_user_id, user_id),
      audience = COALESCE(audience, 'customer'),
      event_key = COALESCE(event_key, 'legacy:' || id::text)
    WHERE recipient_user_id IS NULL
       OR audience IS NULL
       OR event_key IS NULL;
  ELSE
    UPDATE public.notifications
    SET
      audience = COALESCE(audience, 'customer'),
      event_key = COALESCE(event_key, 'legacy:' || id::text)
    WHERE audience IS NULL
       OR event_key IS NULL;
  END IF;
END;
$$;

-- The legacy user_id column was required, but new seller/admin rows do not
-- have a customer user_id. Keep it for backward compatibility and allow NULL.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notifications'
      AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.notifications ALTER COLUMN user_id DROP NOT NULL;
  END IF;
END;
$$;

ALTER TABLE public.notifications
  ALTER COLUMN audience SET NOT NULL,
  ALTER COLUMN event_key SET NOT NULL,
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS notifications_event_key_unique
  ON public.notifications (event_key);

CREATE INDEX IF NOT EXISTS notifications_recipient_created_idx
  ON public.notifications (recipient_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_seller_created_idx
  ON public.notifications (seller_id, created_at DESC)
  WHERE audience = 'seller';
CREATE INDEX IF NOT EXISTS notifications_audience_created_idx
  ON public.notifications (audience, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users read own notifications" ON public.notifications;
CREATE POLICY "users read own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (audience = 'customer' AND recipient_user_id = auth.uid());

DROP POLICY IF EXISTS "users mark own notifications read" ON public.notifications;
CREATE POLICY "users mark own notifications read"
  ON public.notifications FOR UPDATE TO authenticated
  USING (audience = 'customer' AND recipient_user_id = auth.uid())
  WITH CHECK (audience = 'customer' AND recipient_user_id = auth.uid());

-- Seller/admin dashboards should use authenticated app_metadata claims. The
-- seller claim prevents one seller from reading another seller's queue.
DROP POLICY IF EXISTS "admins read admin notifications" ON public.notifications;
CREATE POLICY "admins read admin notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' AND audience = 'admin');

DROP POLICY IF EXISTS "sellers read seller notifications" ON public.notifications;
CREATE POLICY "sellers read seller notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('seller', 'vendor')
    AND audience = 'seller'
    AND seller_id = NULLIF(auth.jwt() -> 'app_metadata' ->> 'seller_id', '')::uuid
  );

DROP POLICY IF EXISTS "admins mark admin notifications read" ON public.notifications;
CREATE POLICY "admins mark admin notifications read"
  ON public.notifications FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' AND audience = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' AND audience = 'admin');

DROP POLICY IF EXISTS "sellers mark seller notifications read" ON public.notifications;
CREATE POLICY "sellers mark seller notifications read"
  ON public.notifications FOR UPDATE TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('seller', 'vendor')
    AND audience = 'seller'
    AND seller_id = NULLIF(auth.jwt() -> 'app_metadata' ->> 'seller_id', '')::uuid
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('seller', 'vendor')
    AND audience = 'seller'
    AND seller_id = NULLIF(auth.jwt() -> 'app_metadata' ->> 'seller_id', '')::uuid
  );

CREATE OR REPLACE FUNCTION public.create_order_notifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  order_key text := COALESCE(to_jsonb(NEW)->>'id', 'unknown');
  order_number text := COALESCE(to_jsonb(NEW)->>'order_number', order_key);
  seller_key uuid := NULLIF(to_jsonb(NEW)->>'seller_id', '')::uuid;
  customer_key uuid := NULLIF(to_jsonb(NEW)->>'user_id', '')::uuid;
  next_status text := COALESCE(to_jsonb(NEW)->>'status', 'new');
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications
      (recipient_user_id, audience, seller_id, order_id, title, body, kind, link, event_key)
    VALUES
      (customer_key, 'customer', seller_key, NEW.id,
       'Order placed', 'Your order #' || order_number || ' was placed successfully.', 'order', '/orders',
       'order:' || order_key || ':created:customer'),
      (NULL, 'seller', seller_key, NEW.id,
       'New order received', 'New order #' || order_number || ' is waiting for your confirmation.', 'order', '/orders',
       'order:' || order_key || ':created:seller'),
      (NULL, 'admin', seller_key, NEW.id,
       'New order created', 'Order #' || order_number || ' was created.', 'order', '/orders',
       'order:' || order_key || ':created:admin')
    ON CONFLICT (event_key) DO NOTHING;
  ELSIF TG_OP = 'UPDATE' AND COALESCE(to_jsonb(OLD)->>'status', '') IS DISTINCT FROM next_status THEN
    INSERT INTO public.notifications
      (recipient_user_id, audience, seller_id, order_id, title, body, kind, link, event_key)
    VALUES
      (customer_key, 'customer', seller_key, NEW.id,
       'Order status updated', 'Order #' || order_number || ' is now ' || replace(next_status, '_', ' ') || '.', 'order', '/order/' || order_key,
       'order:' || order_key || ':status:' || next_status || ':customer'),
      (NULL, 'seller', seller_key, NEW.id,
       'Order status changed', 'Order #' || order_number || ' is now ' || replace(next_status, '_', ' ') || '.', 'order', '/orders',
       'order:' || order_key || ':status:' || next_status || ':seller'),
      (NULL, 'admin', seller_key, NEW.id,
       'Order status changed', 'Order #' || order_number || ' is now ' || replace(next_status, '_', ' ') || '.', 'order', '/orders',
       'order:' || order_key || ':status:' || next_status || ':admin')
    ON CONFLICT (event_key) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_notification_trigger ON public.orders;
CREATE TRIGGER orders_notification_trigger
  AFTER INSERT OR UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.create_order_notifications();

CREATE OR REPLACE FUNCTION public.create_support_notifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ticket_key text := COALESCE(to_jsonb(NEW)->>'id', 'unknown');
  ticket_order uuid := NULLIF(to_jsonb(NEW)->>'order_id', '')::uuid;
  ticket_user uuid := NULLIF(to_jsonb(NEW)->>'user_id', '')::uuid;
  ticket_subject text := COALESCE(to_jsonb(NEW)->>'subject', 'Customer support request');
  ticket_seller uuid;
BEGIN
  IF ticket_order IS NOT NULL THEN
    SELECT NULLIF(to_jsonb(o)->>'seller_id', '')::uuid INTO ticket_seller
    FROM public.orders o WHERE o.id = ticket_order;
  END IF;

  INSERT INTO public.notifications
    (recipient_user_id, audience, seller_id, order_id, support_ticket_id, title, body, kind, link, event_key)
  VALUES
    (ticket_user, 'customer', ticket_seller, ticket_order, NEW.id,
     'Support request received', 'We received your request: ' || ticket_subject, 'support', '/support',
     'support:' || ticket_key || ':customer'),
    (NULL, 'admin', ticket_seller, ticket_order, NEW.id,
     'New support request', ticket_subject, 'support', '/support',
     'support:' || ticket_key || ':admin'),
    (NULL, 'seller', ticket_seller, ticket_order, NEW.id,
     'Customer support request', ticket_subject, 'support', '/support',
     'support:' || ticket_key || ':seller')
  ON CONFLICT (event_key) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS support_ticket_notification_trigger ON public.support_tickets;
CREATE TRIGGER support_ticket_notification_trigger
  AFTER INSERT ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.create_support_notifications();

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;
