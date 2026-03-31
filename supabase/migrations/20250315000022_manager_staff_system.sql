-- StayOnStay: Manager/Receptionist Dashboard & Staff Management System
-- Production-grade schema with performance optimization

-- =============================================================================
-- 1. STAFF MANAGEMENT TABLES
-- =============================================================================

-- Staff designation types
CREATE TYPE staff_designation AS ENUM (
  'room_service',
  'cleaning',
  'cook',
  'driver',
  'translator',
  'housekeeping',
  'maintenance'
);

-- Staff task types
CREATE TYPE task_type AS ENUM (
  'room_cleaning',
  'room_service',
  'driver',
  'translator',
  'cooking',
  'maintenance',
  'housekeeping'
);

-- Task status
CREATE TYPE task_status AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'cancelled'
);

-- Staff table (non-login users, mobile-based)
CREATE TABLE public.staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  mobile_number TEXT NOT NULL UNIQUE,
  designation staff_designation NOT NULL,
  hotel_id UUID REFERENCES public.hotels(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  
  -- Driver-specific fields
  car_name TEXT,
  car_number TEXT,
  seating_capacity INTEGER,
  
  -- Translator-specific fields
  languages TEXT[], -- Array of languages
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  -- Constraints
  CHECK (
    CASE 
      WHEN designation IN ('room_service', 'cleaning', 'cook', 'housekeeping', 'maintenance') 
      THEN hotel_id IS NOT NULL
      ELSE TRUE
    END
  ),
  CHECK (
    CASE 
      WHEN designation = 'driver' 
      THEN car_name IS NOT NULL AND car_number IS NOT NULL AND seating_capacity IS NOT NULL
      ELSE TRUE
    END
  ),
  CHECK (
    CASE 
      WHEN designation = 'translator' 
      THEN languages IS NOT NULL AND array_length(languages, 1) > 0
      ELSE TRUE
    END
  )
);

-- Tasks table (staff assignments)
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type task_type NOT NULL,
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  assigned_staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  status task_status DEFAULT 'pending',
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  description TEXT,
  notes TEXT,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Service requests (from guests)
CREATE TABLE public.service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  type task_type NOT NULL,
  description TEXT NOT NULL,
  status task_status DEFAULT 'pending',
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- =============================================================================
-- 2. PERFORMANCE INDEXES
-- =============================================================================

-- Staff indexes
CREATE INDEX idx_staff_mobile ON public.staff(mobile_number) WHERE deleted_at IS NULL;
CREATE INDEX idx_staff_hotel_designation ON public.staff(hotel_id, designation) WHERE deleted_at IS NULL AND is_active = true;
CREATE INDEX idx_staff_designation ON public.staff(designation) WHERE deleted_at IS NULL AND is_active = true;
CREATE INDEX idx_staff_active ON public.staff(is_active) WHERE deleted_at IS NULL;

-- Tasks indexes
CREATE INDEX idx_tasks_hotel_status ON public.tasks(hotel_id, status, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_staff_status ON public.tasks(assigned_staff_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_room ON public.tasks(room_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_type_status ON public.tasks(type, status, hotel_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_created_at ON public.tasks(created_at DESC) WHERE deleted_at IS NULL;

-- Service requests indexes
CREATE INDEX idx_service_requests_booking ON public.service_requests(booking_id, status);
CREATE INDEX idx_service_requests_room ON public.service_requests(room_id, status);
CREATE INDEX idx_service_requests_status ON public.service_requests(status, created_at DESC);

-- =============================================================================
-- 3. HELPER FUNCTIONS FOR RBAC
-- =============================================================================

-- Check if current user is manager of specific hotel
CREATE OR REPLACE FUNCTION public.current_user_is_manager_of_hotel(p_hotel_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.hotel_staff
    WHERE user_id = auth.uid()
      AND hotel_id = p_hotel_id
      AND role = 'manager'
      AND deleted_at IS NULL
  );
END;
$$;

-- Check if current user is receptionist
CREATE OR REPLACE FUNCTION public.current_user_is_receptionist()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'receptionist'
  );
END;
$$;

-- =============================================================================
-- 4. RLS POLICIES FOR STAFF TABLE
-- =============================================================================

ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "staff_admin_all"
ON public.staff FOR ALL
TO authenticated
USING (current_user_is_admin())
WITH CHECK (current_user_is_admin());

-- Owner can manage staff for their hotels
CREATE POLICY "staff_owner_view"
ON public.staff FOR SELECT
TO authenticated
USING (
  current_user_is_owner()
  AND (hotel_id IN (
    SELECT id FROM public.hotels WHERE owner_id = auth.uid()
  ) OR hotel_id IS NULL)
);

CREATE POLICY "staff_owner_manage"
ON public.staff FOR ALL
TO authenticated
USING (
  current_user_is_owner()
  AND (hotel_id IN (
    SELECT id FROM public.hotels WHERE owner_id = auth.uid()
  ) OR hotel_id IS NULL)
)
WITH CHECK (
  current_user_is_owner()
  AND (hotel_id IN (
    SELECT id FROM public.hotels WHERE owner_id = auth.uid()
  ) OR hotel_id IS NULL)
);

-- Manager can view/manage staff for their assigned hotel
CREATE POLICY "staff_manager_view"
ON public.staff FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.hotel_staff
    WHERE user_id = auth.uid()
      AND hotel_id = staff.hotel_id
      AND role = 'manager'
      AND deleted_at IS NULL
  )
);

CREATE POLICY "staff_manager_manage"
ON public.staff FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.hotel_staff
    WHERE user_id = auth.uid()
      AND hotel_id = staff.hotel_id
      AND role = 'manager'
      AND deleted_at IS NULL
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.hotel_staff
    WHERE user_id = auth.uid()
      AND hotel_id = staff.hotel_id
      AND role = 'manager'
      AND deleted_at IS NULL
  )
);

-- =============================================================================
-- 5. RLS POLICIES FOR TASKS TABLE
-- =============================================================================

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "tasks_admin_all"
ON public.tasks FOR ALL
TO authenticated
USING (current_user_is_admin())
WITH CHECK (current_user_is_admin());

-- Owner can manage tasks for their hotels
CREATE POLICY "tasks_owner_all"
ON public.tasks FOR ALL
TO authenticated
USING (
  current_user_is_owner()
  AND hotel_id IN (SELECT id FROM public.hotels WHERE owner_id = auth.uid())
)
WITH CHECK (
  current_user_is_owner()
  AND hotel_id IN (SELECT id FROM public.hotels WHERE owner_id = auth.uid())
);

-- Manager can manage tasks for their assigned hotel
CREATE POLICY "tasks_manager_all"
ON public.tasks FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.hotel_staff
    WHERE user_id = auth.uid()
      AND hotel_id = tasks.hotel_id
      AND role = 'manager'
      AND deleted_at IS NULL
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.hotel_staff
    WHERE user_id = auth.uid()
      AND hotel_id = tasks.hotel_id
      AND role = 'manager'
      AND deleted_at IS NULL
  )
);

-- =============================================================================
-- 6. RLS POLICIES FOR SERVICE REQUESTS
-- =============================================================================

ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

-- Guests can view and create their own service requests
CREATE POLICY "service_requests_guest_view"
ON public.service_requests FOR SELECT
TO authenticated
USING (
  booking_id IN (
    SELECT id FROM public.bookings WHERE booker_id = auth.uid()
  )
);

CREATE POLICY "service_requests_guest_create"
ON public.service_requests FOR INSERT
TO authenticated
WITH CHECK (
  booking_id IN (
    SELECT id FROM public.bookings WHERE booker_id = auth.uid()
  )
);

-- Staff can view service requests for their hotel
CREATE POLICY "service_requests_staff_view"
ON public.service_requests FOR SELECT
TO authenticated
USING (
  current_user_is_admin()
  OR current_user_is_owner()
  OR current_user_is_assigned_manager_any_hotel()
);

CREATE POLICY "service_requests_staff_update"
ON public.service_requests FOR UPDATE
TO authenticated
USING (
  current_user_is_admin()
  OR current_user_is_owner()
  OR current_user_is_assigned_manager_any_hotel()
);

-- =============================================================================
-- 7. OPTIMIZED RPCS FOR MANAGER DASHBOARD
-- =============================================================================

-- Get dashboard stats for manager (< 50ms target)
CREATE OR REPLACE FUNCTION public.get_manager_dashboard_stats(p_hotel_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  result JSONB;
  v_total_rooms INTEGER;
  v_available_rooms INTEGER;
  v_occupied_rooms INTEGER;
  v_cleaning_rooms INTEGER;
  v_today_checkins INTEGER;
  v_today_checkouts INTEGER;
  v_active_bookings INTEGER;
  v_pending_tasks INTEGER;
BEGIN
  -- All counts in parallel using single query where possible
  SELECT 
    COUNT(*) FILTER (WHERE deleted_at IS NULL),
    COUNT(*) FILTER (WHERE status = 'available' AND deleted_at IS NULL),
    COUNT(*) FILTER (WHERE status = 'occupied' AND deleted_at IS NULL),
    COUNT(*) FILTER (WHERE status = 'cleaning' AND deleted_at IS NULL)
  INTO v_total_rooms, v_available_rooms, v_occupied_rooms, v_cleaning_rooms
  FROM public.rooms
  WHERE hotel_id = p_hotel_id;

  -- Today's check-ins and check-outs
  SELECT 
    COUNT(*) FILTER (WHERE check_in_date = CURRENT_DATE),
    COUNT(*) FILTER (WHERE check_out_date = CURRENT_DATE)
  INTO v_today_checkins, v_today_checkouts
  FROM public.bookings
  WHERE hotel_id = p_hotel_id
    AND status IN ('confirmed', 'checked_in')
    AND deleted_at IS NULL;

  -- Active bookings
  SELECT COUNT(*)
  INTO v_active_bookings
  FROM public.bookings
  WHERE hotel_id = p_hotel_id
    AND status IN ('confirmed', 'checked_in')
    AND deleted_at IS NULL;

  -- Pending tasks
  SELECT COUNT(*)
  INTO v_pending_tasks
  FROM public.tasks
  WHERE hotel_id = p_hotel_id
    AND status = 'pending'
    AND deleted_at IS NULL;

  result := jsonb_build_object(
    'total_rooms', v_total_rooms,
    'available_rooms', v_available_rooms,
    'occupied_rooms', v_occupied_rooms,
    'cleaning_rooms', v_cleaning_rooms,
    'today_checkins', v_today_checkins,
    'today_checkouts', v_today_checkouts,
    'active_bookings', v_active_bookings,
    'pending_tasks', v_pending_tasks
  );

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_manager_dashboard_stats(UUID) TO authenticated;

-- Get available staff by designation and hotel
CREATE OR REPLACE FUNCTION public.get_available_staff(
  p_hotel_id UUID,
  p_designation staff_designation DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  name TEXT,
  mobile_number TEXT,
  designation staff_designation,
  car_name TEXT,
  car_number TEXT,
  seating_capacity INTEGER,
  languages TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.name,
    s.mobile_number,
    s.designation,
    s.car_name,
    s.car_number,
    s.seating_capacity,
    s.languages
  FROM public.staff s
  WHERE s.deleted_at IS NULL
    AND s.is_active = true
    AND (
      s.hotel_id = p_hotel_id 
      OR s.hotel_id IS NULL
    )
    AND (p_designation IS NULL OR s.designation = p_designation)
  ORDER BY s.name;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_available_staff(UUID, staff_designation) TO authenticated;

-- =============================================================================
-- 8. TRIGGERS FOR UPDATED_AT
-- =============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER staff_updated_at BEFORE UPDATE ON public.staff
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER service_requests_updated_at BEFORE UPDATE ON public.service_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 9. ANALYZE TABLES FOR QUERY PLANNER
-- =============================================================================

ANALYZE public.staff;
ANALYZE public.tasks;
ANALYZE public.service_requests;
