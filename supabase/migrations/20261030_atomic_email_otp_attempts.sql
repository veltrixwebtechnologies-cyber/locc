-- Atomically consume an email OTP attempt so concurrent guesses cannot bypass
-- the server-side attempt limit.
CREATE OR REPLACE FUNCTION public.consume_email_otp_attempt(
  p_id uuid,
  p_max_attempts integer DEFAULT 5
)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.email_otps
  SET attempts = attempts + 1
  WHERE id = p_id
    AND attempts < p_max_attempts
  RETURNING attempts;
$$;

REVOKE ALL ON FUNCTION public.consume_email_otp_attempt(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_email_otp_attempt(uuid, integer) TO service_role;
