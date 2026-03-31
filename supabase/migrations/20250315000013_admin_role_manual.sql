-- StayOnStay: Remove hardcoded email-based admin assignment
-- Run after 20250315000012_storage_hotel_images.sql.
-- This keeps the admin role and RLS policies, but makes the default
-- onboarding behavior simple: every new auth user starts as 'customer'.
-- Admins are assigned manually via the app (Admin → Users) or direct SQL.

-- 1) Restore handle_new_user to always insert role = 'customer'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'customer');
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS
  'Trigger: insert profiles row with role=customer when auth.users row is created. Admins are assigned manually.';

