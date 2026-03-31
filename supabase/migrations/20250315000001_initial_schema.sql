-- StayOnStay: Initial schema for RBAC and hospitality
-- Run this migration first. Then run 20250315000002_rls.sql

-- =============================================================================
-- PROFILES (extends auth.users; role is the source of truth for RBAC)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'owner', 'manager')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'User profiles. Roles: customer (default), owner, manager only.';

-- =============================================================================
-- HOTELS (owner_id links to profiles)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.hotels IS 'Hotels; owner_id must be a profile with role owner (enforced by app/RLS).';

-- =============================================================================
-- HOTEL_STAFF (managers and receptionists belong to a specific hotel)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.hotel_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('manager')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(hotel_id, user_id)
);

COMMENT ON TABLE public.hotel_staff IS 'Staff assigned to a hotel; single role manager (reception + front-desk).';

-- =============================================================================
-- AUTO-CREATE PROFILE ON AUTH USER SIGNUP (default role = customer)
-- Security: runs as definer so it can insert into public.profiles from auth event.
-- =============================================================================
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

-- Trigger on auth.users: creates profile with role=customer for every new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS 'Trigger: insert profiles row with role=customer when auth.users row is created.';
