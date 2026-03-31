-- StayOnStay: Owner-driven customer<->manager role assignment via secure RPC
-- Run after 20250315000010_owner_manager_hotel_room_access.sql

-- -----------------------------------------------------------------------------
-- 1) Owner-scoped listing helpers
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.owner_list_promotable_customers(
  target_hotel_id UUID,
  search_email TEXT DEFAULT NULL
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
    AND (
      search_email IS NULL
      OR btrim(search_email) = ''
      OR COALESCE(p.email, '') ILIKE '%' || btrim(search_email) || '%'
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.hotel_staff hs
      WHERE hs.user_id = p.id
        AND hs.role = 'manager'
        AND hs.deleted_at IS NULL
    )
  ORDER BY p.created_at DESC
  LIMIT 100;
END;
$$;

CREATE OR REPLACE FUNCTION public.owner_list_managers(
  target_hotel_id UUID,
  search_email TEXT DEFAULT NULL
)
RETURNS TABLE (
  assignment_id UUID,
  user_id UUID,
  email TEXT,
  hotel_id UUID,
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

  IF NOT EXISTS (
    SELECT 1
    FROM public.hotels h
    WHERE h.id = target_hotel_id
      AND h.owner_id = auth.uid()
      AND h.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'You can only view staff for your own active hotel' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT hs.id, hs.user_id, p.email, hs.hotel_id, hs.created_at
  FROM public.hotel_staff hs
  JOIN public.profiles p ON p.id = hs.user_id
  WHERE hs.hotel_id = target_hotel_id
    AND hs.role = 'manager'
    AND hs.deleted_at IS NULL
    AND p.deleted_at IS NULL
    AND (
      search_email IS NULL
      OR btrim(search_email) = ''
      OR COALESCE(p.email, '') ILIKE '%' || btrim(search_email) || '%'
    )
  ORDER BY hs.created_at DESC;
END;
$$;

-- -----------------------------------------------------------------------------
-- 2) Transactional owner promote/demote operations
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.owner_assign_manager(
  target_user_id UUID,
  target_hotel_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_role TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  IF target_user_id IS NULL OR target_hotel_id IS NULL THEN
    RAISE EXCEPTION 'target_user_id and target_hotel_id are required' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.hotels h
    WHERE h.id = target_hotel_id
      AND h.owner_id = auth.uid()
      AND h.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'You can only assign managers to your own active hotel' USING ERRCODE = '42501';
  END IF;

  SELECT p.role
  INTO target_role
  FROM public.profiles p
  WHERE p.id = target_user_id
    AND p.deleted_at IS NULL;

  IF target_role IS NULL THEN
    RAISE EXCEPTION 'Target user not found' USING ERRCODE = 'P0002';
  END IF;

  IF target_role <> 'customer' THEN
    RAISE EXCEPTION 'Only customers can be promoted by owner' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.hotel_staff hs
    WHERE hs.user_id = target_user_id
      AND hs.role = 'manager'
      AND hs.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'User is already an active manager' USING ERRCODE = '23505';
  END IF;

  INSERT INTO public.hotel_staff (hotel_id, user_id, role, deleted_at, deleted_by)
  VALUES (target_hotel_id, target_user_id, 'manager', NULL, NULL)
  ON CONFLICT (hotel_id, user_id)
  DO UPDATE SET
    role = 'manager',
    deleted_at = NULL,
    deleted_by = NULL;

  UPDATE public.profiles
  SET role = 'manager'
  WHERE id = target_user_id
    AND deleted_at IS NULL;

  RETURN jsonb_build_object(
    'ok', true,
    'user_id', target_user_id,
    'hotel_id', target_hotel_id,
    'role', 'manager'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.owner_revoke_manager(
  target_user_id UUID,
  target_hotel_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  IF target_user_id IS NULL OR target_hotel_id IS NULL THEN
    RAISE EXCEPTION 'target_user_id and target_hotel_id are required' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.hotels h
    WHERE h.id = target_hotel_id
      AND h.owner_id = auth.uid()
      AND h.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'You can only remove managers from your own active hotel' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.hotel_staff hs
    WHERE hs.hotel_id = target_hotel_id
      AND hs.user_id = target_user_id
      AND hs.role = 'manager'
      AND hs.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Active manager assignment not found for this hotel' USING ERRCODE = 'P0002';
  END IF;

  UPDATE public.hotel_staff
  SET deleted_at = now(),
      deleted_by = auth.uid()
  WHERE hotel_id = target_hotel_id
    AND user_id = target_user_id
    AND role = 'manager'
    AND deleted_at IS NULL;

  IF NOT EXISTS (
    SELECT 1
    FROM public.hotel_staff hs
    WHERE hs.user_id = target_user_id
      AND hs.role = 'manager'
      AND hs.deleted_at IS NULL
  ) THEN
    UPDATE public.profiles
    SET role = 'customer'
    WHERE id = target_user_id
      AND role = 'manager'
      AND deleted_at IS NULL;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'user_id', target_user_id,
    'hotel_id', target_hotel_id,
    'role', 'customer'
  );
END;
$$;

-- -----------------------------------------------------------------------------
-- 3) Grants
-- -----------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.owner_list_promotable_customers(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.owner_list_managers(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.owner_assign_manager(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.owner_revoke_manager(UUID, UUID) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.owner_list_promotable_customers(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.owner_list_managers(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.owner_assign_manager(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.owner_revoke_manager(UUID, UUID) TO authenticated;

COMMENT ON FUNCTION public.owner_assign_manager(UUID, UUID) IS
  'Owner-only transactional promotion: customer -> manager and hotel_staff activation for owned hotel.';
COMMENT ON FUNCTION public.owner_revoke_manager(UUID, UUID) IS
  'Owner-only transactional demotion: soft-delete manager assignment and set role to customer when no active manager assignments remain.';
