-- Customer Care protected-chat visibility flags.
-- The support RPCs select these columns, so keep this migration in the shopper
-- deployment tree as well as the SellerHub tree.
ALTER TABLE public.ticket_messages
  ADD COLUMN IF NOT EXISTS visible_to_customer boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS visible_to_vendor boolean NOT NULL DEFAULT true;

UPDATE public.ticket_messages
SET visible_to_customer = COALESCE(visible_to_customer, true),
    visible_to_vendor = COALESCE(visible_to_vendor, true)
WHERE visible_to_customer IS NULL OR visible_to_vendor IS NULL;
