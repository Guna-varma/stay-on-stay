-- Hotfix: rpc_get_room_availability return type mismatch
-- Error:
-- 42804: Returned type timestamp without time zone does not match expected type timestamp with time zone in column 8.
--
-- Root cause:
-- `room_availability_v.next_check_in_at` is `timestamp` (without time zone),
-- but RPC signature expects `timestamptz`.
--
-- Important:
-- Postgres does not allow changing an existing view column type via CREATE OR REPLACE VIEW.
-- So we keep the view as-is and cast in the RPC output instead.

CREATE OR REPLACE FUNCTION public.rpc_get_room_availability(
  p_hotel_id UUID
)
RETURNS TABLE(
  room_id UUID,
  room_no TEXT,
  occupancy_status TEXT,
  housekeeping_status TEXT,
  effective_room_state TEXT,
  unavailable_reason TEXT,
  estimated_available_at TIMESTAMPTZ,
  next_check_in_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.current_user_can_operate_ops_hotel(p_hotel_id) THEN
    RAISE EXCEPTION 'Not authorized for this hotel';
  END IF;

  RETURN QUERY
  SELECT
    rav.room_id,
    rav.room_no,
    rav.occupancy_status,
    rav.housekeeping_status,
    rav.effective_room_state,
    rav.unavailable_reason,
    rav.estimated_available_at::timestamptz,
    (rav.next_check_in_at AT TIME ZONE 'UTC')::timestamptz
  FROM public.room_availability_v rav
  WHERE rav.property_id = p_hotel_id
  ORDER BY rav.room_no;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_get_room_availability(UUID) TO authenticated;
