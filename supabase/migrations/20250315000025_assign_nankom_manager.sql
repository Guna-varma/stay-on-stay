-- StayOnStay: assign known user as manager for Nankom hotel
-- Target user: stayonstay.guest@gmail.com
-- Target hotel: Nankom

DO $$
DECLARE
  v_user_id UUID;
  v_hotel_id UUID;
BEGIN
  SELECT p.id
  INTO v_user_id
  FROM public.profiles p
  WHERE LOWER(TRIM(COALESCE(p.email, ''))) = 'stayonstay.guest@gmail.com'
    AND p.deleted_at IS NULL
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'User stayonstay.guest@gmail.com not found; skipping manager assignment.';
    RETURN;
  END IF;

  SELECT h.id
  INTO v_hotel_id
  FROM public.hotels h
  WHERE LOWER(TRIM(COALESCE(h.name, ''))) = 'nankom'
    AND h.deleted_at IS NULL
  ORDER BY h.created_at DESC
  LIMIT 1;

  IF v_hotel_id IS NULL THEN
    RAISE NOTICE 'Hotel Nankom not found; skipping manager assignment.';
    RETURN;
  END IF;

  INSERT INTO public.hotel_staff (hotel_id, user_id, role, deleted_at, deleted_by)
  VALUES (v_hotel_id, v_user_id, 'manager', NULL, NULL)
  ON CONFLICT (hotel_id, user_id)
  DO UPDATE SET
    role = 'manager',
    deleted_at = NULL,
    deleted_by = NULL;

  UPDATE public.profiles
  SET role = 'manager'
  WHERE id = v_user_id
    AND deleted_at IS NULL;

  RAISE NOTICE 'Assigned stayonstay.guest@gmail.com as manager for Nankom hotel.';
END $$;

