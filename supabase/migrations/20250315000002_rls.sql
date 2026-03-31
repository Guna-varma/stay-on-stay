-- StayOnStay: Row Level Security (RLS) for profiles, hotels, hotel_staff
-- Run after 20250315000001_initial_schema.sql
-- Security: Never trust client-side roles; all checks use auth.uid() and server-side data.

-- =============================================================================
-- PROFILES
-- =============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile only
CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Admin can read all profiles (for user management UI)
CREATE POLICY "profiles_select_admin"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

-- Only admin can update other users' profiles (e.g. role); users cannot update their own role
CREATE POLICY "profiles_update_admin_only"
  ON public.profiles
  FOR UPDATE
  USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    AND id <> auth.uid()
  )
  WITH CHECK (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    AND id <> auth.uid()
  );

-- No INSERT/DELETE by app users; inserts happen via trigger, deletes via auth cascade if needed

-- =============================================================================
-- HOTELS
-- =============================================================================
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;

-- Owners can do everything on their own hotels
CREATE POLICY "hotels_owner_all"
  ON public.hotels
  FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Admin has full access
CREATE POLICY "hotels_admin_all"
  ON public.hotels
  FOR ALL
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

-- Staff (manager/receptionist) can read hotels they belong to
CREATE POLICY "hotels_staff_select"
  ON public.hotels
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.hotel_staff hs
      WHERE hs.hotel_id = hotels.id AND hs.user_id = auth.uid()
    )
  );

-- =============================================================================
-- HOTEL_STAFF
-- =============================================================================
ALTER TABLE public.hotel_staff ENABLE ROW LEVEL SECURITY;

-- Staff can read their own assignments
CREATE POLICY "hotel_staff_select_own"
  ON public.hotel_staff
  FOR SELECT
  USING (user_id = auth.uid());

-- Hotel owners can manage staff for their hotels
CREATE POLICY "hotel_staff_owner_manage"
  ON public.hotel_staff
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.hotels h
      WHERE h.id = hotel_staff.hotel_id AND h.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.hotels h
      WHERE h.id = hotel_staff.hotel_id AND h.owner_id = auth.uid()
    )
  );

-- Admin has full access
CREATE POLICY "hotel_staff_admin_all"
  ON public.hotel_staff
  FOR ALL
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

-- Staff can read other staff for the same hotel (for team context)
CREATE POLICY "hotel_staff_select_same_hotel"
  ON public.hotel_staff
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.hotel_staff hs
      WHERE hs.hotel_id = hotel_staff.hotel_id AND hs.user_id = auth.uid()
    )
  );
