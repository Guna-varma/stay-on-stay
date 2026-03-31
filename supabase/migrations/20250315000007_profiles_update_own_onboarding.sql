-- StayOnStay: Let users update their own profile (name, avatar) for onboarding; cannot change role.
-- Run after 006. Required for first-time user "Complete your profile" (Name + Mobile).

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
  );

COMMENT ON POLICY "profiles_update_own" ON public.profiles IS 'Users can update own profile (e.g. first_name, last_name) but not role.';
