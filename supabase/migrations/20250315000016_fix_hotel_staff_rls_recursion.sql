-- Fix 42P17: infinite recursion in policy for relation "hotel_staff"
--
-- Cause: policy "hotel_staff_select_same_hotel" used EXISTS (SELECT ... FROM hotel_staff ...).
-- Evaluating RLS on hotel_staff inside a policy on hotel_staff re-enters the same policies
-- and PostgreSQL detects infinite recursion.
--
-- Fix: move the existence check into a SECURITY DEFINER function so the inner SELECT does not
-- re-apply RLS on hotel_staff (still only returns boolean; no data leak of other rows).

CREATE OR REPLACE FUNCTION public.user_has_active_hotel_staff_assignment(p_hotel_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.hotel_staff hs
    WHERE hs.hotel_id = p_hotel_id
      AND hs.user_id = p_user_id
      AND hs.deleted_at IS NULL
  );
$$;

COMMENT ON FUNCTION public.user_has_active_hotel_staff_assignment(uuid, uuid) IS
  'True if user has an active hotel_staff row for this hotel; used by RLS to avoid self-referential hotel_staff policies.';

REVOKE ALL ON FUNCTION public.user_has_active_hotel_staff_assignment(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_has_active_hotel_staff_assignment(uuid, uuid) TO authenticated, anon;

DROP POLICY IF EXISTS "hotel_staff_select_same_hotel" ON public.hotel_staff;
CREATE POLICY "hotel_staff_select_same_hotel"
  ON public.hotel_staff FOR SELECT
  USING (
    deleted_at IS NULL
    AND public.user_has_active_hotel_staff_assignment(hotel_staff.hotel_id, auth.uid())
  );
