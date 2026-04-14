-- StayOnStay: production-grade admin user lifecycle management
-- Adds active/inactive state to profiles, admin user listing, and an active-user RLS gate.

-- =============================================================================
-- 1. PROFILE LIFECYCLE COLUMNS + INDEXES
-- =============================================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deactivated_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS deactivation_reason TEXT;

UPDATE public.profiles
SET is_active = true
WHERE is_active IS NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_role_active_created
  ON public.profiles(role, is_active, created_at DESC, id DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_active_created
  ON public.profiles(is_active, created_at DESC, id DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_email_lookup
  ON public.profiles((LOWER(BTRIM(email))))
  WHERE deleted_at IS NULL;

-- =============================================================================
-- 2. HELPER FUNCTIONS
-- =============================================================================
CREATE OR REPLACE FUNCTION public.current_user_is_active()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.deleted_at IS NULL
      AND COALESCE(p.is_active, true)
  )
$$;

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
    AND p.deleted_at IS NULL
    AND COALESCE(p.is_active, true)
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

REVOKE ALL ON FUNCTION public.current_user_is_active() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_user_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_user_is_admin() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.current_user_is_active() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_is_admin() TO authenticated;

COMMENT ON FUNCTION public.current_user_is_active() IS
  'Returns true only when the current authenticated profile exists, is not soft-deleted, and is active.';

-- =============================================================================
-- 3. ACTIVE-USER GATE FOR RLS TABLES
-- =============================================================================
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'hotels',
    'hotel_staff',
    'user_contacts',
    'room_types',
    'rooms',
    'guests',
    'guest_contacts',
    'bookings',
    'payments',
    'checkins',
    'checkouts',
    'notifications',
    'audit_logs',
    'room_type_images',
    'hotel_images',
    'expense_categories',
    'expenses',
    'amenities',
    'hotel_amenities',
    'landmarks',
    'stripe_webhook_events',
    'staff',
    'tasks',
    'service_requests',
    'incidents',
    'fraud_alerts',
    'compliance_records',
    'platform_settings',
    'customer_notifications'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS active_user_gate ON public.%I', tbl);
    EXECUTE format(
      'CREATE POLICY active_user_gate ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING (public.current_user_is_active()) WITH CHECK (public.current_user_is_active())',
      tbl
    );
  END LOOP;
END $$;

-- =============================================================================
-- 4. ADMIN LISTING RPC
-- =============================================================================
CREATE OR REPLACE FUNCTION public.admin_list_users(
  search_text TEXT DEFAULT NULL,
  filter_role TEXT DEFAULT NULL,
  filter_active BOOLEAN DEFAULT NULL,
  cursor_created_at TIMESTAMPTZ DEFAULT NULL,
  cursor_id UUID DEFAULT NULL,
  page_size INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  role TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  deactivated_at TIMESTAMPTZ,
  deactivated_by UUID,
  deactivation_reason TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_search TEXT := NULLIF(BTRIM(search_text), '');
  normalized_role TEXT := NULLIF(LOWER(BTRIM(filter_role)), '');
  effective_limit INTEGER := LEAST(GREATEST(COALESCE(page_size, 50), 1), 100);
BEGIN
  IF NOT public.current_user_is_admin() THEN
    RAISE EXCEPTION 'Only active admins can list users' USING ERRCODE = '42501';
  END IF;

  IF normalized_role IS NOT NULL AND normalized_role NOT IN ('customer', 'owner', 'manager', 'admin') THEN
    RAISE EXCEPTION 'Invalid role filter' USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    p.avatar_url,
    p.role,
    COALESCE(p.is_active, true) AS is_active,
    p.created_at,
    p.updated_at,
    p.deactivated_at,
    p.deactivated_by,
    p.deactivation_reason
  FROM public.profiles p
  WHERE p.deleted_at IS NULL
    AND (
      normalized_role IS NULL
      OR p.role = normalized_role
    )
    AND (
      filter_active IS NULL
      OR COALESCE(p.is_active, true) = filter_active
    )
    AND (
      normalized_search IS NULL
      OR COALESCE(p.email, '') ILIKE '%' || normalized_search || '%'
      OR COALESCE(p.first_name, '') ILIKE '%' || normalized_search || '%'
      OR COALESCE(p.last_name, '') ILIKE '%' || normalized_search || '%'
      OR LOWER(BTRIM(COALESCE(p.email, ''))) = LOWER(normalized_search)
    )
    AND (
      cursor_created_at IS NULL
      OR cursor_id IS NULL
      OR (p.created_at, p.id) < (cursor_created_at, cursor_id)
    )
  ORDER BY p.created_at DESC, p.id DESC
  LIMIT effective_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_users(TEXT, TEXT, BOOLEAN, TIMESTAMPTZ, UUID, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_users(TEXT, TEXT, BOOLEAN, TIMESTAMPTZ, UUID, INTEGER) TO authenticated;

COMMENT ON FUNCTION public.admin_list_users(TEXT, TEXT, BOOLEAN, TIMESTAMPTZ, UUID, INTEGER) IS
  'Active-admin-only keyset-paginated user listing for the Admin Users screen.';
