-- LocalShore Delivery ETA & Lifecycle Events Schema Extension
-- Adds durable tracking for order lifecycle events, ETA predictions, model versioning, and calibration.

-- 1. Order Lifecycle Events Table
CREATE TABLE IF NOT EXISTS public.order_lifecycle_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_order_lifecycle_events_order_id ON public.order_lifecycle_events(order_id);
CREATE INDEX IF NOT EXISTS idx_order_lifecycle_events_type ON public.order_lifecycle_events(order_id, event_type);

-- 2. Order ETA Predictions Table
CREATE TABLE IF NOT EXISTS public.order_eta_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    model_version TEXT NOT NULL,
    routing_source TEXT NOT NULL,
    earliest_mins INTEGER NOT NULL,
    target_mins INTEGER NOT NULL,
    latest_mins INTEGER NOT NULL,
    road_distance_km NUMERIC(6,2),
    store_ready_mins NUMERIC(5,1),
    rider_ready_mins NUMERIC(5,1),
    transit_mins NUMERIC(5,1),
    phase_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
    predicted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    actual_delivered_at TIMESTAMPTZ,
    error_seconds INTEGER
);

CREATE INDEX IF NOT EXISTS idx_order_eta_predictions_order_id ON public.order_eta_predictions(order_id);
CREATE INDEX IF NOT EXISTS idx_order_eta_predictions_predicted_at ON public.order_eta_predictions(predicted_at DESC);

-- 3. Row Level Security (RLS)
ALTER TABLE public.order_lifecycle_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_eta_predictions ENABLE ROW LEVEL SECURITY;

-- Customer can view lifecycle events and predictions for their own orders (orders.user_id)
DROP POLICY IF EXISTS "Customers view lifecycle events for their orders" ON public.order_lifecycle_events;
CREATE POLICY "Customers view lifecycle events for their orders"
    ON public.order_lifecycle_events
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_lifecycle_events.order_id
            AND orders.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Customers view predictions for their orders" ON public.order_eta_predictions;
CREATE POLICY "Customers view predictions for their orders"
    ON public.order_eta_predictions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_eta_predictions.order_id
            AND orders.user_id = auth.uid()
        )
    );

-- Sellers can view and insert events for their shop orders
DROP POLICY IF EXISTS "Sellers view lifecycle events for their orders" ON public.order_lifecycle_events;
CREATE POLICY "Sellers view lifecycle events for their orders"
    ON public.order_lifecycle_events
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_lifecycle_events.order_id
            AND orders.seller_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Sellers record events for their orders" ON public.order_lifecycle_events;
CREATE POLICY "Sellers record events for their orders"
    ON public.order_lifecycle_events
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_lifecycle_events.order_id
            AND orders.seller_id = auth.uid()
        )
    );

-- Delivery partners can view and record events for assigned tasks
DROP POLICY IF EXISTS "Riders view lifecycle events for assigned orders" ON public.order_lifecycle_events;
CREATE POLICY "Riders view lifecycle events for assigned orders"
    ON public.order_lifecycle_events
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.delivery_assignments
            WHERE delivery_assignments.order_id = order_lifecycle_events.order_id
            AND delivery_assignments.partner_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Riders record events for assigned orders" ON public.order_lifecycle_events;
CREATE POLICY "Riders record events for assigned orders"
    ON public.order_lifecycle_events
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.delivery_assignments
            WHERE delivery_assignments.order_id = order_lifecycle_events.order_id
            AND delivery_assignments.partner_id = auth.uid()
        )
    );

-- Service role full access
DROP POLICY IF EXISTS "Service role full access to order lifecycle" ON public.order_lifecycle_events;
CREATE POLICY "Service role full access to order lifecycle"
    ON public.order_lifecycle_events
    TO service_role
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access to order eta predictions" ON public.order_eta_predictions;
CREATE POLICY "Service role full access to order eta predictions"
    ON public.order_eta_predictions
    TO service_role
    USING (true)
    WITH CHECK (true);
