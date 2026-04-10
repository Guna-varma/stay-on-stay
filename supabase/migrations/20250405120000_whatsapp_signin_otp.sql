-- WhatsApp OTP for sign-in (existing users with phone in user_contacts).
-- Edge Functions use service role; RLS blocks direct client access.

CREATE TABLE IF NOT EXISTS public.whatsapp_signin_otp (
  phone_e164 text PRIMARY KEY,
  code_hash text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_signin_otp_expires ON public.whatsapp_signin_otp (expires_at);

ALTER TABLE public.whatsapp_signin_otp ENABLE ROW LEVEL SECURITY;

-- Match user_contacts (country_code + phone_number) to full E.164 digits (no +).
CREATE OR REPLACE FUNCTION public.find_user_id_by_phone_e164(p_e164 text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT uc.user_id
  FROM public.user_contacts uc
  WHERE uc.contact_type = 'phone'
    AND (
      regexp_replace(trim(coalesce(uc.country_code, '')), '^\++', '')
      || regexp_replace(trim(coalesce(uc.phone_number, '')), '^0+', '')
    ) = regexp_replace(trim(p_e164), '^\++', '')
  ORDER BY uc.created_at DESC
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.find_user_id_by_phone_e164(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_user_id_by_phone_e164(text) TO service_role;
