-- Email OTP for custom password reset (Edge Functions + SMTP).
-- RLS: no policies; only service_role bypasses RLS.

CREATE TABLE IF NOT EXISTS public.email_password_reset_otp (
  email text PRIMARY KEY,
  code_hash text NOT NULL,
  digits smallint NOT NULL DEFAULT 6 CHECK (digits >= 4 AND digits <= 8),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_password_reset_otp_expires ON public.email_password_reset_otp (expires_at);

ALTER TABLE public.email_password_reset_otp ENABLE ROW LEVEL SECURITY;

-- Resolve canonical auth email (service_role only).
CREATE OR REPLACE FUNCTION public.lookup_password_reset_email(p_email text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT u.email::text
  FROM auth.users u
  WHERE u.email IS NOT NULL
    AND lower(u.email::text) = lower(trim(p_email))
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.lookup_password_reset_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_password_reset_email(text) TO service_role;
