-- Allow both Owner and Manager to operate hotel ops flows (transport, checkout, room availability)
-- while preserving hotel-level isolation.

CREATE OR REPLACE FUNCTION public.current_user_can_operate_ops_hotel(p_hotel_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    -- Manager assigned to this hotel
    SELECT 1
    FROM public.hotel_staff hs
    INNER JOIN public.profiles p ON p.id = hs.user_id
    WHERE hs.user_id = auth.uid()
      AND hs.hotel_id = p_hotel_id
      AND hs.role = 'manager'
      AND hs.deleted_at IS NULL
      AND p.deleted_at IS NULL
      AND COALESCE(p.is_active, TRUE) = TRUE
      AND p.role = 'manager'
  )
  OR EXISTS (
    -- Owner of this hotel
    SELECT 1
    FROM public.hotels h
    INNER JOIN public.profiles p ON p.id = h.owner_id
    WHERE h.id = p_hotel_id
      AND h.owner_id = auth.uid()
      AND h.deleted_at IS NULL
      AND p.deleted_at IS NULL
      AND COALESCE(p.is_active, TRUE) = TRUE
      AND p.role = 'owner'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.current_user_can_operate_ops_hotel(UUID) TO authenticated;

