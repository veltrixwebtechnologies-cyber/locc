-- Repair order creation failing with SQLSTATE 42725:
-- function public.get_shop_status(uuid) is not unique.
--
-- The original three-argument function has defaults for its final two args,
-- while a one-argument overload also exists. PostgreSQL therefore cannot
-- resolve calls such as get_shop_status(seller_id). Rename the implementation
-- and expose explicit-arity wrappers without defaults. Existing callers keep
-- their one-, two-, and three-argument behavior.

BEGIN;

DO $$
BEGIN
  IF to_regprocedure('public.get_shop_status_impl(uuid,timestamptz,text)') IS NULL THEN
    IF to_regprocedure('public.get_shop_status(uuid,timestamptz,text)') IS NULL THEN
      RAISE EXCEPTION 'Cannot repair get_shop_status overload: expected three-argument implementation is missing';
    END IF;

    ALTER FUNCTION public.get_shop_status(uuid, timestamptz, text)
      RENAME TO get_shop_status_impl;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_shop_status(
  _seller_id uuid,
  _at timestamptz,
  _tz text
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT public.get_shop_status_impl(_seller_id, _at, _tz);
$$;

CREATE OR REPLACE FUNCTION public.get_shop_status(
  _seller_id uuid,
  _at timestamptz
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT public.get_shop_status(_seller_id, _at, 'Asia/Kolkata'::text);
$$;

CREATE OR REPLACE FUNCTION public.get_shop_status(_seller_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT public.get_shop_status(_seller_id, now(), 'Asia/Kolkata'::text);
$$;

REVOKE ALL ON FUNCTION public.get_shop_status_impl(uuid, timestamptz, text)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_shop_status(uuid, timestamptz, text)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_shop_status(uuid, timestamptz)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_shop_status(uuid)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_shop_status(uuid, timestamptz, text)
  TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_shop_status(uuid, timestamptz)
  TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_shop_status(uuid)
  TO anon, authenticated, service_role;

COMMENT ON FUNCTION public.get_shop_status(uuid, timestamptz, text) IS
  'Explicit three-argument facade for the shop availability implementation; intentionally has no default arguments to avoid overload ambiguity.';

COMMIT;
