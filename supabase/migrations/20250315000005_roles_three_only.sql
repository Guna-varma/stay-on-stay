-- StayOnStay: Reduce to 3 roles only — Customer, Owner, Manager (receptionist + senior merged)
-- Run after existing migrations. Migrates existing data then enforces new checks.

-- =============================================================================
-- 1. Migrate existing profile roles to the 3-role model
-- =============================================================================
UPDATE public.profiles SET role = 'manager' WHERE role IN ('receptionist', 'senior_receptionist');
UPDATE public.profiles SET role = 'owner' WHERE role = 'admin';

-- =============================================================================
-- 2. Profiles: only customer, owner, manager
-- =============================================================================
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('customer', 'owner', 'manager'));

-- =============================================================================
-- 3. Hotel staff: single role "manager" (receptionist merged into manager)
-- =============================================================================
UPDATE public.hotel_staff SET role = 'manager' WHERE role = 'receptionist';

ALTER TABLE public.hotel_staff DROP CONSTRAINT IF EXISTS hotel_staff_role_check;
ALTER TABLE public.hotel_staff ADD CONSTRAINT hotel_staff_role_check
  CHECK (role IN ('manager'));

COMMENT ON TABLE public.profiles IS 'User profiles. Roles: customer (default), owner, manager.';
COMMENT ON TABLE public.hotel_staff IS 'Staff assigned to a hotel; role is manager (reception + front-desk).';

-- =============================================================================
-- 4. Remove admin-only RLS policies (no admin role anymore)
-- =============================================================================
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin_only" ON public.profiles;
DROP POLICY IF EXISTS "hotels_admin_all" ON public.hotels;
DROP POLICY IF EXISTS "hotel_staff_admin_all" ON public.hotel_staff;

-- Scale schema (004) admin policies
DROP POLICY IF EXISTS "user_contacts_admin_select" ON public.user_contacts;
DROP POLICY IF EXISTS "room_types_admin_all" ON public.room_types;
DROP POLICY IF EXISTS "rooms_admin_all" ON public.rooms;
DROP POLICY IF EXISTS "guests_admin_delete" ON public.guests;
DROP POLICY IF EXISTS "bookings_admin_all" ON public.bookings;
DROP POLICY IF EXISTS "payments_admin_all" ON public.payments;
DROP POLICY IF EXISTS "checkins_admin_all" ON public.checkins;
DROP POLICY IF EXISTS "checkouts_admin_all" ON public.checkouts;
DROP POLICY IF EXISTS "notifications_admin_select" ON public.notifications;
DROP POLICY IF EXISTS "audit_logs_admin_select" ON public.audit_logs;
