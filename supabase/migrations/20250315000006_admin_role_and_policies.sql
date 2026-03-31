-- StayOnStay: Re-add admin role; set mgunavarma@gmail.com as admin; restore admin RLS
-- Run after 005. Enables admin dashboard and role-based redirect.

-- =============================================================================
-- 1. Profiles: add 'admin' to allowed roles
-- =============================================================================
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('customer', 'owner', 'manager', 'admin'));

-- =============================================================================
-- 2. Set mgunavarma@gmail.com as admin (existing or future signups)
-- =============================================================================
UPDATE public.profiles SET role = 'admin' WHERE LOWER(TRIM(email)) = 'mgunavarma@gmail.com';

-- =============================================================================
-- 3. Trigger: new user with this email gets admin, others get customer
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT := 'customer';
BEGIN
  IF LOWER(TRIM(NEW.email)) = 'mgunavarma@gmail.com' THEN
    user_role := 'admin';
  END IF;
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, user_role);
  RETURN NEW;
END;
$$;

-- =============================================================================
-- 4. Restore admin RLS policies (profiles, hotels, hotel_staff)
-- =============================================================================
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
CREATE POLICY "profiles_select_admin"
  ON public.profiles FOR SELECT
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

DROP POLICY IF EXISTS "profiles_update_admin_only" ON public.profiles;
CREATE POLICY "profiles_update_admin_only"
  ON public.profiles FOR UPDATE
  USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    AND id <> auth.uid()
  )
  WITH CHECK (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    AND id <> auth.uid()
  );

DROP POLICY IF EXISTS "hotels_admin_all" ON public.hotels;
CREATE POLICY "hotels_admin_all"
  ON public.hotels FOR ALL
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

DROP POLICY IF EXISTS "hotel_staff_admin_all" ON public.hotel_staff;
CREATE POLICY "hotel_staff_admin_all"
  ON public.hotel_staff FOR ALL
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

-- =============================================================================
-- 5. Restore admin RLS for scale tables (if they exist)
-- =============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_contacts') THEN
    EXECUTE 'DROP POLICY IF EXISTS "user_contacts_admin_select" ON public.user_contacts';
    EXECUTE 'CREATE POLICY "user_contacts_admin_select" ON public.user_contacts FOR SELECT USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = ''admin''))';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'room_types') THEN
    EXECUTE 'DROP POLICY IF EXISTS "room_types_admin_all" ON public.room_types';
    EXECUTE 'CREATE POLICY "room_types_admin_all" ON public.room_types FOR ALL USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = ''admin'')) WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE role = ''admin''))';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'rooms') THEN
    EXECUTE 'DROP POLICY IF EXISTS "rooms_admin_all" ON public.rooms';
    EXECUTE 'CREATE POLICY "rooms_admin_all" ON public.rooms FOR ALL USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = ''admin'')) WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE role = ''admin''))';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'guests') THEN
    EXECUTE 'DROP POLICY IF EXISTS "guests_admin_delete" ON public.guests';
    EXECUTE 'CREATE POLICY "guests_admin_delete" ON public.guests FOR DELETE USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = ''admin''))';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'bookings') THEN
    EXECUTE 'DROP POLICY IF EXISTS "bookings_admin_all" ON public.bookings';
    EXECUTE 'CREATE POLICY "bookings_admin_all" ON public.bookings FOR ALL USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = ''admin'')) WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE role = ''admin''))';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payments') THEN
    EXECUTE 'DROP POLICY IF EXISTS "payments_admin_all" ON public.payments';
    EXECUTE 'CREATE POLICY "payments_admin_all" ON public.payments FOR ALL USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = ''admin'')) WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE role = ''admin''))';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'checkins') THEN
    EXECUTE 'DROP POLICY IF EXISTS "checkins_admin_all" ON public.checkins';
    EXECUTE 'CREATE POLICY "checkins_admin_all" ON public.checkins FOR ALL USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = ''admin'')) WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE role = ''admin''))';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'checkouts') THEN
    EXECUTE 'DROP POLICY IF EXISTS "checkouts_admin_all" ON public.checkouts';
    EXECUTE 'CREATE POLICY "checkouts_admin_all" ON public.checkouts FOR ALL USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = ''admin'')) WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE role = ''admin''))';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
    EXECUTE 'DROP POLICY IF EXISTS "notifications_admin_select" ON public.notifications';
    EXECUTE 'CREATE POLICY "notifications_admin_select" ON public.notifications FOR SELECT USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = ''admin''))';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'audit_logs') THEN
    EXECUTE 'DROP POLICY IF EXISTS "audit_logs_admin_select" ON public.audit_logs';
    EXECUTE 'CREATE POLICY "audit_logs_admin_select" ON public.audit_logs FOR SELECT USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = ''admin''))';
  END IF;
END $$;
