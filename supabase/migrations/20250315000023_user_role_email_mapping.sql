-- StayOnStay: Explicit email -> role mapping
-- Requested mapping:
--   stayonstay.guest@gmail.com  -> manager (receptionist equivalent)
--   mgunavarma5959@gmail.com    -> owner
--   gunavarma.website@gmail.com -> admin
--   mgunavarma@gmail.com        -> customer

-- Ensure role constraint allows all required roles.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('customer', 'owner', 'manager', 'admin'));

-- Update existing users by email (case-insensitive).
UPDATE public.profiles
SET role = 'manager'
WHERE LOWER(TRIM(email)) = 'stayonstay.guest@gmail.com'
  AND deleted_at IS NULL;

UPDATE public.profiles
SET role = 'owner'
WHERE LOWER(TRIM(email)) = 'mgunavarma5959@gmail.com'
  AND deleted_at IS NULL;

UPDATE public.profiles
SET role = 'admin'
WHERE LOWER(TRIM(email)) = 'gunavarma.website@gmail.com'
  AND deleted_at IS NULL;

UPDATE public.profiles
SET role = 'customer'
WHERE LOWER(TRIM(email)) = 'mgunavarma@gmail.com'
  AND deleted_at IS NULL;

-- Keep signup behavior aligned: only gunavarma.website@gmail.com auto-gets admin.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT := 'customer';
BEGIN
  IF LOWER(TRIM(NEW.email)) = 'gunavarma.website@gmail.com' THEN
    user_role := 'admin';
  END IF;

  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, user_role);

  RETURN NEW;
END;
$$;
