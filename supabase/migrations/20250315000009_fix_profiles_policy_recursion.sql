-- StayOnStay: Fix infinite recursion in profiles RLS policies
-- Run after 20250315000008_soft_delete_and_historical_data.sql

-- -----------------------------------------------------------------------------
-- 1) Helper functions (SECURITY DEFINER) to avoid self-referencing profiles in
--    profiles policies. These execute with definer privileges and do not recurse
--    through profiles RLS.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.role
  FROM public.profiles p
  WHERE p.id = auth.uid()
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.current_user_role() = 'admin', false)
$$;

REVOKE ALL ON FUNCTION public.current_user_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_user_is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_is_admin() TO authenticated;

-- -----------------------------------------------------------------------------
-- 2) Recreate profiles policies without recursive subqueries
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id AND deleted_at IS NULL);

DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
CREATE POLICY "profiles_select_admin"
  ON public.profiles
  FOR SELECT
  USING (public.current_user_is_admin() AND deleted_at IS NULL);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id AND deleted_at IS NULL)
  WITH CHECK (
    auth.uid() = id
    AND role = public.current_user_role()
  );

DROP POLICY IF EXISTS "profiles_update_admin_only" ON public.profiles;
CREATE POLICY "profiles_update_admin_only"
  ON public.profiles
  FOR UPDATE
  USING (public.current_user_is_admin() AND id <> auth.uid())
  WITH CHECK (public.current_user_is_admin() AND id <> auth.uid());

COMMENT ON FUNCTION public.current_user_role() IS
  'Returns current user role from profiles using SECURITY DEFINER to avoid RLS recursion.';
COMMENT ON FUNCTION public.current_user_is_admin() IS
  'Returns true if current authenticated user has admin role (non-deleted profile).';
