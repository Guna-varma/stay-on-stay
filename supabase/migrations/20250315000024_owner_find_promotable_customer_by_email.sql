-- StayOnStay: owner helper to find a promotable customer by exact email

CREATE OR REPLACE FUNCTION public.owner_find_promotable_customer_by_email(
  target_hotel_id UUID,
  target_email TEXT
)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  IF target_hotel_id IS NULL OR target_email IS NULL OR btrim(target_email) = '' THEN
    RAISE EXCEPTION 'target_hotel_id and target_email are required' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.hotels h
    WHERE h.id = target_hotel_id
      AND h.owner_id = auth.uid()
      AND h.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'You can only manage staff for your own active hotel' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT p.id, p.email, p.created_at
  FROM public.profiles p
  WHERE p.deleted_at IS NULL
    AND p.role = 'customer'
    AND lower(COALESCE(p.email, '')) = lower(btrim(target_email))
    AND NOT EXISTS (
      SELECT 1
      FROM public.hotel_staff hs
      WHERE hs.user_id = p.id
        AND hs.role = 'manager'
        AND hs.deleted_at IS NULL
    )
  ORDER BY p.created_at DESC
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.owner_find_promotable_customer_by_email(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.owner_find_promotable_customer_by_email(UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION public.owner_find_promotable_customer_by_email(UUID, TEXT) IS
  'Owner-only helper to find one customer by exact email who is eligible for manager promotion.';

