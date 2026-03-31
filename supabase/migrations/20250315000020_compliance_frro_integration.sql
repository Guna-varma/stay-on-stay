-- StayOnStay: Compliance & FRRO Integration
-- Extends guests table for passport/visa tracking and adds analytics RPCs

-- =============================================================================
-- 1. EXTEND GUESTS TABLE FOR FRRO COMPLIANCE
-- =============================================================================
ALTER TABLE public.guests
  ADD COLUMN IF NOT EXISTS nationality TEXT,
  ADD COLUMN IF NOT EXISTS passport_number TEXT,
  ADD COLUMN IF NOT EXISTS visa_type TEXT,
  ADD COLUMN IF NOT EXISTS visa_expiry_date DATE,
  ADD COLUMN IF NOT EXISTS frro_registration_date DATE,
  ADD COLUMN IF NOT EXISTS frro_status TEXT DEFAULT 'pending' 
    CHECK (frro_status IN ('pending', 'registered', 'rejected'));

CREATE INDEX IF NOT EXISTS idx_guests_visa_expiry ON public.guests(visa_expiry_date);
CREATE INDEX IF NOT EXISTS idx_guests_frro_status ON public.guests(frro_status);
CREATE INDEX IF NOT EXISTS idx_guests_nationality ON public.guests(nationality);

-- =============================================================================
-- 2. ANALYTICS RPC: EXPIRING VISAS
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_expiring_visas(
  p_days_threshold INT DEFAULT 30,
  p_hotel_id UUID DEFAULT NULL
)
RETURNS TABLE(
  guest_id UUID,
  guest_name TEXT,
  nationality TEXT,
  passport_number TEXT,
  visa_type TEXT,
  visa_expiry_date DATE,
  days_until_expiry INT,
  frro_status TEXT,
  hotel_name TEXT,
  booking_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.id as guest_id,
    CONCAT(g.first_name, ' ', g.last_name) as guest_name,
    g.nationality,
    g.passport_number,
    g.visa_type,
    g.visa_expiry_date,
    (g.visa_expiry_date - CURRENT_DATE)::INT as days_until_expiry,
    g.frro_status,
    h.name as hotel_name,
    b.id as booking_id
  FROM public.guests g
  INNER JOIN public.bookings b ON b.guest_id = g.id
  INNER JOIN public.hotels h ON h.id = b.hotel_id
  WHERE g.visa_expiry_date IS NOT NULL
    AND g.visa_expiry_date - CURRENT_DATE <= p_days_threshold
    AND g.visa_expiry_date >= CURRENT_DATE
    AND (p_hotel_id IS NULL OR b.hotel_id = p_hotel_id)
    AND g.deleted_at IS NULL
  ORDER BY g.visa_expiry_date ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_expiring_visas(INT, UUID) TO authenticated;

-- =============================================================================
-- 3. ANALYTICS RPC: HOTEL QUALITY SCORES
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_hotel_quality_scores()
RETURNS TABLE(
  hotel_id UUID,
  hotel_name TEXT,
  quality_score NUMERIC,
  total_bookings BIGINT,
  incident_count BIGINT,
  success_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH hotel_stats AS (
    SELECT 
      h.id as hotel_id,
      h.name as hotel_name,
      COUNT(DISTINCT b.id) as total_bookings,
      COUNT(DISTINCT CASE WHEN b.status IN ('confirmed', 'checked_in', 'checked_out') THEN b.id END) as successful_bookings,
      COUNT(DISTINCT i.id) as incident_count
    FROM public.hotels h
    LEFT JOIN public.bookings b ON b.hotel_id = h.id AND b.deleted_at IS NULL
    LEFT JOIN public.incidents i ON i.title LIKE '%' || h.name || '%' AND i.status != 'resolved'
    WHERE h.deleted_at IS NULL
    GROUP BY h.id, h.name
  )
  SELECT 
    hs.hotel_id,
    hs.hotel_name,
    ROUND(
      GREATEST(0, 100 - (hs.incident_count * 5) + 
      CASE 
        WHEN hs.total_bookings > 0 
        THEN (hs.successful_bookings::NUMERIC / hs.total_bookings * 10)
        ELSE 0 
      END), 0
    ) as quality_score,
    hs.total_bookings,
    hs.incident_count,
    CASE 
      WHEN hs.total_bookings > 0 
      THEN ROUND((hs.successful_bookings::NUMERIC / hs.total_bookings) * 100, 1)
      ELSE 0 
    END as success_rate
  FROM hotel_stats hs
  ORDER BY quality_score DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_hotel_quality_scores() TO authenticated;

-- =============================================================================
-- 4. ADD IP ADDRESS TO AUDIT LOGS (if not exists)
-- =============================================================================
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS ip_address TEXT,
  ADD COLUMN IF NOT EXISTS user_email TEXT,
  ADD COLUMN IF NOT EXISTS user_role TEXT,
  ADD COLUMN IF NOT EXISTS details TEXT;

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);

-- =============================================================================
-- 5. EXTEND INCIDENTS WITH HOTEL REFERENCE
-- =============================================================================
ALTER TABLE public.incidents
  ADD COLUMN IF NOT EXISTS hotel_id UUID REFERENCES public.hotels(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_incidents_hotel_id ON public.incidents(hotel_id);

-- =============================================================================
-- 6. UPDATE RLS POLICIES FOR OWNER/MANAGER ACCESS
-- =============================================================================

-- Guests: owners/managers can view guests with bookings at their hotels
DROP POLICY IF EXISTS "guests_owner_manager_view" ON public.guests;
CREATE POLICY "guests_owner_manager_view"
ON public.guests FOR SELECT
TO authenticated
USING (
  current_user_is_admin()
  OR EXISTS (
    SELECT 1 FROM public.bookings b
    INNER JOIN public.hotels h ON h.id = b.hotel_id
    WHERE b.guest_id = guests.id
      AND (h.owner_id = auth.uid() OR current_user_is_assigned_manager(h.id))
  )
);

-- Audit logs: owners/managers can view logs for their hotels
DROP POLICY IF EXISTS "audit_logs_admin_all" ON public.audit_logs;
CREATE POLICY "audit_logs_admin_all"
ON public.audit_logs FOR ALL
TO authenticated
USING (current_user_is_admin())
WITH CHECK (current_user_is_admin());

DROP POLICY IF EXISTS "audit_logs_owner_view" ON public.audit_logs;
CREATE POLICY "audit_logs_owner_view"
ON public.audit_logs FOR SELECT
TO authenticated
USING (
  current_user_is_owner()
  OR current_user_is_assigned_manager_any_hotel()
);

-- Incidents: owners/managers can view and create for their hotels
DROP POLICY IF EXISTS "incidents_owner_manager_view" ON public.incidents;
CREATE POLICY "incidents_owner_manager_view"
ON public.incidents FOR SELECT
TO authenticated
USING (
  current_user_is_admin()
  OR hotel_id IS NULL
  OR EXISTS (
    SELECT 1 FROM public.hotels h
    WHERE h.id = incidents.hotel_id
      AND (h.owner_id = auth.uid() OR current_user_is_assigned_manager(h.id))
  )
);

DROP POLICY IF EXISTS "incidents_owner_manager_create" ON public.incidents;
CREATE POLICY "incidents_owner_manager_create"
ON public.incidents FOR INSERT
TO authenticated
WITH CHECK (
  current_user_is_admin()
  OR current_user_is_owner()
  OR current_user_is_assigned_manager_any_hotel()
);

DROP POLICY IF EXISTS "incidents_owner_manager_update" ON public.incidents;
CREATE POLICY "incidents_owner_manager_update"
ON public.incidents FOR UPDATE
TO authenticated
USING (
  current_user_is_admin()
  OR (
    hotel_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.hotels h
      WHERE h.id = incidents.hotel_id
        AND (h.owner_id = auth.uid() OR current_user_is_assigned_manager(h.id))
    )
  )
);
