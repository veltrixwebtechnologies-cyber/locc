-- The notification system now uses recipient_user_id. Older installations
-- still retain user_id, which must be nullable for admin/seller notifications.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notifications'
      AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.notifications
      ALTER COLUMN user_id DROP NOT NULL;
  END IF;
END;
$$;
