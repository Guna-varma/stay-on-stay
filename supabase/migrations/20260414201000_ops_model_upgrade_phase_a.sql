-- StayOnStay Ops Model Upgrade (phased, existing-schema extension)
-- Phase A/B foundation: checkout queue + room availability + operational RPCs.

-- =============================================================================
-- 1) ROOMS / BOOKINGS OPERATIONAL EXTENSIONS
-- =============================================================================

ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS occupancy_status TEXT
    CHECK (occupancy_status IN ('available', 'booked', 'occupied', 'checkout_due', 'cleaning', 'blocked')),
  ADD COLUMN IF NOT EXISTS housekeeping_status TEXT
    CHECK (housekeeping_status IN ('clean', 'dirty', 'inspecting', 'out_of_order')),
  ADD COLUMN IF NOT EXISTS current_booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS next_available_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS status_note TEXT;

UPDATE public.rooms
SET
  occupancy_status = CASE
    WHEN status = 'available' THEN 'available'
    WHEN status = 'occupied' THEN 'occupied'
    WHEN status = 'cleaning' THEN 'cleaning'
    WHEN status = 'maintenance' THEN 'blocked'
    ELSE 'available'
  END,
  housekeeping_status = CASE
    WHEN status = 'cleaning' THEN 'dirty'
    WHEN status = 'maintenance' THEN 'out_of_order'
    ELSE 'clean'
  END
WHERE occupancy_status IS NULL OR housekeeping_status IS NULL;

ALTER TABLE public.rooms
  ALTER COLUMN occupancy_status SET DEFAULT 'available',
  ALTER COLUMN housekeeping_status SET DEFAULT 'clean';

UPDATE public.rooms
SET
  occupancy_status = COALESCE(occupancy_status, 'available'),
  housekeeping_status = COALESCE(housekeeping_status, 'clean')
WHERE occupancy_status IS NULL OR housekeeping_status IS NULL;

ALTER TABLE public.rooms
  ALTER COLUMN occupancy_status SET NOT NULL,
  ALTER COLUMN housekeeping_status SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_rooms_hotel_occupancy_status
  ON public.rooms(hotel_id, occupancy_status);

CREATE INDEX IF NOT EXISTS idx_rooms_hotel_next_available_at
  ON public.rooms(hotel_id, next_available_at);

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS actual_check_in_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS actual_check_out_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS balance_due NUMERIC(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES public.profiles(id);

CREATE INDEX IF NOT EXISTS idx_bookings_hotel_status_dates
  ON public.bookings(hotel_id, status, check_in_date, check_out_date);

CREATE INDEX IF NOT EXISTS idx_bookings_deleted_at
  ON public.bookings(deleted_at);

-- =============================================================================
-- 2) ROOM BLOCKS (NON-BOOKING UNAVAILABILITY)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.current_user_can_operate_ops_hotel(p_hotel_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.hotel_staff hs
    INNER JOIN public.profiles p ON p.id = hs.user_id
    WHERE hs.user_id = auth.uid()
      AND hs.hotel_id = p_hotel_id
      AND hs.role = 'manager'
      AND hs.deleted_at IS NULL
      AND p.deleted_at IS NULL
      AND p.role = 'manager'
  );
END;
$$;

CREATE TABLE IF NOT EXISTS public.room_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  block_type TEXT NOT NULL
    CHECK (block_type IN ('maintenance', 'deep_clean', 'pest_control', 'vip_hold', 'manual_block')),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  reason TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT room_blocks_time_valid CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_room_blocks_property_active
  ON public.room_blocks(property_id, active, starts_at, ends_at);

CREATE INDEX IF NOT EXISTS idx_room_blocks_room_active
  ON public.room_blocks(room_id, active, ends_at);

ALTER TABLE public.room_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "room_blocks_manager_all" ON public.room_blocks;
CREATE POLICY "room_blocks_manager_all"
  ON public.room_blocks FOR ALL
  TO authenticated
  USING (public.current_user_can_operate_ops_hotel(property_id))
  WITH CHECK (public.current_user_can_operate_ops_hotel(property_id));

-- =============================================================================
-- 3) READ MODELS
-- =============================================================================

CREATE OR REPLACE VIEW public.room_availability_v AS
WITH active_blocks AS (
  SELECT
    rb.room_id,
    rb.block_type,
    rb.ends_at,
    rb.reason,
    ROW_NUMBER() OVER (PARTITION BY rb.room_id ORDER BY rb.ends_at DESC) AS rn
  FROM public.room_blocks rb
  WHERE rb.active = TRUE
    AND rb.starts_at <= now()
    AND rb.ends_at > now()
),
open_cleaning AS (
  SELECT
    t.room_id,
    MIN(COALESCE(t.scheduled_at, t.created_at + INTERVAL '45 minutes')) AS cleaning_eta
  FROM public.tasks t
  WHERE t.deleted_at IS NULL
    AND t.type IN ('room_cleaning', 'housekeeping')
    AND t.status IN ('pending', 'in_progress')
    AND t.room_id IS NOT NULL
  GROUP BY t.room_id
),
next_booking AS (
  SELECT
    b.room_id,
    MIN(b.check_in_date::timestamp) AS next_check_in_at
  FROM public.bookings b
  WHERE b.deleted_at IS NULL
    AND b.status IN ('confirmed', 'checked_in')
    AND b.check_in_date >= CURRENT_DATE
  GROUP BY b.room_id
)
SELECT
  r.id AS room_id,
  r.hotel_id AS property_id,
  r.room_number AS room_no,
  r.status AS legacy_status,
  r.occupancy_status,
  r.housekeeping_status,
  r.current_booking_id,
  ab.block_type,
  ab.reason AS block_reason,
  nb.next_check_in_at,
  oc.cleaning_eta,
  CASE
    WHEN ab.room_id IS NOT NULL THEN 'blocked'
    WHEN r.occupancy_status = 'blocked' THEN 'blocked'
    WHEN r.occupancy_status = 'cleaning' THEN 'cleaning'
    WHEN r.occupancy_status = 'occupied' THEN 'occupied'
    WHEN r.occupancy_status = 'checkout_due' THEN 'checkout_due'
    WHEN r.occupancy_status = 'booked' THEN 'booked'
    ELSE 'available'
  END AS effective_room_state,
  CASE
    WHEN ab.room_id IS NOT NULL THEN ab.ends_at
    WHEN r.occupancy_status IN ('blocked') THEN COALESCE(r.next_available_at, oc.cleaning_eta, nb.next_check_in_at)
    WHEN r.occupancy_status IN ('occupied', 'checkout_due') THEN COALESCE(r.next_available_at, nb.next_check_in_at)
    WHEN r.occupancy_status = 'cleaning' THEN COALESCE(oc.cleaning_eta, r.next_available_at)
    ELSE COALESCE(r.next_available_at, now())
  END AS estimated_available_at,
  CASE
    WHEN ab.room_id IS NOT NULL THEN COALESCE(ab.reason, initcap(replace(ab.block_type, '_', ' ')))
    WHEN r.occupancy_status = 'blocked' THEN COALESCE(r.status_note, 'Room blocked')
    WHEN r.occupancy_status = 'cleaning' THEN 'Cleaning in progress'
    WHEN r.occupancy_status = 'occupied' THEN 'Occupied'
    WHEN r.occupancy_status = 'checkout_due' THEN 'Checkout due'
    WHEN r.occupancy_status = 'booked' THEN 'Booked'
    ELSE 'Available'
  END AS unavailable_reason
FROM public.rooms r
LEFT JOIN active_blocks ab ON ab.room_id = r.id AND ab.rn = 1
LEFT JOIN open_cleaning oc ON oc.room_id = r.id
LEFT JOIN next_booking nb ON nb.room_id = r.id
WHERE r.deleted_at IS NULL;

CREATE OR REPLACE VIEW public.checkout_queue_v AS
WITH open_room_tasks AS (
  SELECT
    t.booking_id,
    COUNT(*) FILTER (WHERE t.status IN ('pending', 'in_progress')) AS unresolved_tasks
  FROM public.tasks t
  WHERE t.deleted_at IS NULL
    AND t.booking_id IS NOT NULL
  GROUP BY t.booking_id
),
active_block_rooms AS (
  SELECT DISTINCT rb.room_id
  FROM public.room_blocks rb
  WHERE rb.active = TRUE
    AND rb.starts_at <= now()
    AND rb.ends_at > now()
)
SELECT
  b.id AS booking_id,
  b.hotel_id AS property_id,
  b.guest_id,
  COALESCE(NULLIF(TRIM(CONCAT_WS(' ', g.first_name, g.last_name)), ''), 'Guest') AS guest_name,
  b.room_id,
  r.room_number AS room_no,
  b.check_out_date AS scheduled_checkout_date,
  COALESCE(b.balance_due, 0) AS balance_due,
  (COALESCE(b.balance_due, 0) <= 0
    AND COALESCE(ort.unresolved_tasks, 0) = 0
    AND abr.room_id IS NULL) AS checkout_ready,
  ARRAY_REMOVE(ARRAY[
    CASE WHEN COALESCE(b.balance_due, 0) > 0 THEN 'Pending balance' END,
    CASE WHEN COALESCE(ort.unresolved_tasks, 0) > 0 THEN 'Open operational tasks' END,
    CASE WHEN abr.room_id IS NOT NULL THEN 'Room has an active operational block' END
  ], NULL) AS blockers,
  CASE
    WHEN r.housekeeping_status = 'inspecting' THEN 'inspection'
    ELSE 'cleaning'
  END AS next_room_state,
  rav.estimated_available_at
FROM public.bookings b
INNER JOIN public.rooms r ON r.id = b.room_id
LEFT JOIN public.guests g ON g.id = b.guest_id
LEFT JOIN open_room_tasks ort ON ort.booking_id = b.id
LEFT JOIN active_block_rooms abr ON abr.room_id = b.room_id
LEFT JOIN public.room_availability_v rav ON rav.room_id = b.room_id
WHERE b.deleted_at IS NULL
  AND b.status IN ('confirmed', 'checked_in');

-- =============================================================================
-- 4) OPERATIONAL RPCS
-- =============================================================================

CREATE OR REPLACE FUNCTION public.rpc_get_checkout_queue(
  p_hotel_id UUID,
  p_target_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  booking_id UUID,
  guest_name TEXT,
  room_no TEXT,
  scheduled_checkout_date DATE,
  balance_due NUMERIC,
  checkout_ready BOOLEAN,
  blockers TEXT[],
  next_room_state TEXT,
  estimated_available_at TIMESTAMPTZ
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
    cq.booking_id,
    cq.guest_name,
    cq.room_no,
    cq.scheduled_checkout_date,
    cq.balance_due,
    cq.checkout_ready,
    cq.blockers,
    cq.next_room_state,
    cq.estimated_available_at
  FROM public.checkout_queue_v cq
  WHERE cq.property_id = p_hotel_id
    AND cq.scheduled_checkout_date = p_target_date
  ORDER BY cq.scheduled_checkout_date ASC, cq.guest_name ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_get_checkout_preview(
  p_booking_id UUID
)
RETURNS TABLE(
  booking_id UUID,
  hotel_id UUID,
  guest_name TEXT,
  room_no TEXT,
  status TEXT,
  scheduled_checkout_date DATE,
  balance_due NUMERIC,
  blockers TEXT[],
  checkout_ready BOOLEAN,
  next_room_state TEXT,
  estimated_available_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hotel_id UUID;
BEGIN
  SELECT b.hotel_id INTO v_hotel_id
  FROM public.bookings b
  WHERE b.id = p_booking_id;

  IF v_hotel_id IS NULL THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  IF NOT public.current_user_can_operate_ops_hotel(v_hotel_id) THEN
    RAISE EXCEPTION 'Not authorized for this hotel';
  END IF;

  RETURN QUERY
  SELECT
    cq.booking_id,
    cq.property_id AS hotel_id,
    cq.guest_name,
    cq.room_no,
    b.status,
    cq.scheduled_checkout_date,
    cq.balance_due,
    cq.blockers,
    cq.checkout_ready,
    cq.next_room_state,
    cq.estimated_available_at
  FROM public.checkout_queue_v cq
  INNER JOIN public.bookings b ON b.id = cq.booking_id
  WHERE cq.booking_id = p_booking_id;
END;
$$;

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
    rav.estimated_available_at,
    rav.next_check_in_at
  FROM public.room_availability_v rav
  WHERE rav.property_id = p_hotel_id
  ORDER BY rav.room_no;
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_process_checkout(
  p_booking_id UUID,
  p_payment_received NUMERIC DEFAULT 0,
  p_mark_room_dirty BOOLEAN DEFAULT TRUE,
  p_notes TEXT DEFAULT NULL
)
RETURNS TABLE(
  processed BOOLEAN,
  result_type TEXT,
  booking_id UUID,
  room_id UUID,
  room_no TEXT,
  booking_status TEXT,
  room_state TEXT,
  task_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking public.bookings%ROWTYPE;
  v_room public.rooms%ROWTYPE;
  v_hotel_id UUID;
  v_balance_after NUMERIC;
  v_task_id UUID;
BEGIN
  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id
    AND deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  v_hotel_id := v_booking.hotel_id;

  IF NOT public.current_user_can_operate_ops_hotel(v_hotel_id) THEN
    RAISE EXCEPTION 'Not authorized for this hotel';
  END IF;

  SELECT * INTO v_room
  FROM public.rooms
  WHERE id = v_booking.room_id
    AND deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Room not found';
  END IF;

  IF v_booking.status = 'checked_out' THEN
    RETURN QUERY
    SELECT
      FALSE,
      'already_checked_out'::TEXT,
      v_booking.id,
      v_room.id,
      v_room.room_number,
      v_booking.status,
      v_room.occupancy_status,
      NULL::UUID;
    RETURN;
  END IF;

  IF v_booking.status NOT IN ('checked_in', 'confirmed') THEN
    RAISE EXCEPTION 'Only checked-in or confirmed bookings can be checked out';
  END IF;

  v_balance_after := GREATEST(COALESCE(v_booking.balance_due, 0) - COALESCE(p_payment_received, 0), 0);
  IF v_balance_after > 0 THEN
    RAISE EXCEPTION 'Pending balance must be settled before checkout';
  END IF;

  UPDATE public.bookings
  SET
    status = 'checked_out',
    actual_check_out_at = COALESCE(actual_check_out_at, now()),
    balance_due = v_balance_after,
    frontdesk_notes = COALESCE(NULLIF(TRIM(p_notes), ''), frontdesk_notes)
  WHERE id = v_booking.id
  RETURNING * INTO v_booking;

  UPDATE public.rooms
  SET
    current_booking_id = NULL,
    occupancy_status = CASE WHEN p_mark_room_dirty THEN 'cleaning' ELSE 'available' END,
    housekeeping_status = CASE WHEN p_mark_room_dirty THEN 'dirty' ELSE 'inspecting' END,
    next_available_at = CASE WHEN p_mark_room_dirty THEN now() + INTERVAL '45 minutes' ELSE now() END,
    status_note = CASE WHEN p_mark_room_dirty THEN 'Checkout completed: cleaning required' ELSE 'Checkout completed: inspection required' END,
    status = CASE WHEN p_mark_room_dirty THEN 'cleaning' ELSE 'available' END
  WHERE id = v_room.id
  RETURNING * INTO v_room;

  INSERT INTO public.tasks (
    type,
    room_id,
    hotel_id,
    booking_id,
    status,
    priority,
    description,
    notes,
    scheduled_at,
    created_by
  )
  VALUES (
    'room_cleaning',
    v_room.id,
    v_hotel_id,
    v_booking.id,
    'pending',
    'high',
    'Post checkout turnover',
    COALESCE(NULLIF(TRIM(p_notes), ''), 'Auto-created by checkout processing'),
    now(),
    auth.uid()
  )
  RETURNING id INTO v_task_id;

  INSERT INTO public.audit_logs (user_id, action, entity, entity_id, details)
  VALUES (
    auth.uid(),
    'BOOKING_CHECKED_OUT',
    'booking',
    v_booking.id,
    COALESCE(NULLIF(TRIM(p_notes), ''), 'Checkout processed via rpc_process_checkout')
  );

  RETURN QUERY
  SELECT
    TRUE,
    'processed'::TEXT,
    v_booking.id,
    v_room.id,
    v_room.room_number,
    v_booking.status,
    v_room.occupancy_status,
    v_task_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_assign_task(
  p_task_id UUID,
  p_staff_id UUID
)
RETURNS TABLE(
  task_id UUID,
  assigned_staff_id UUID,
  task_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_task public.tasks%ROWTYPE;
  v_staff public.staff%ROWTYPE;
BEGIN
  SELECT * INTO v_task
  FROM public.tasks
  WHERE id = p_task_id
    AND deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task not found';
  END IF;

  IF NOT public.current_user_can_operate_ops_hotel(v_task.hotel_id) THEN
    RAISE EXCEPTION 'Not authorized for this hotel';
  END IF;

  SELECT * INTO v_staff
  FROM public.staff
  WHERE id = p_staff_id
    AND deleted_at IS NULL
    AND is_active = TRUE
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Staff member not found or inactive';
  END IF;

  IF v_staff.hotel_id <> v_task.hotel_id THEN
    RAISE EXCEPTION 'Staff member does not belong to this hotel';
  END IF;

  UPDATE public.tasks
  SET
    assigned_staff_id = p_staff_id,
    status = status
  WHERE id = p_task_id
  RETURNING id, assigned_staff_id, status::TEXT INTO v_task.id, v_task.assigned_staff_id, v_task.status;

  RETURN QUERY SELECT v_task.id, v_task.assigned_staff_id, v_task.status::TEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_update_task_status(
  p_task_id UUID,
  p_status TEXT,
  p_note TEXT DEFAULT NULL
)
RETURNS TABLE(
  task_id UUID,
  task_status TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_task public.tasks%ROWTYPE;
  v_new_status public.task_status;
BEGIN
  v_new_status := p_status::public.task_status;

  SELECT * INTO v_task
  FROM public.tasks
  WHERE id = p_task_id
    AND deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task not found';
  END IF;

  IF NOT public.current_user_can_operate_ops_hotel(v_task.hotel_id) THEN
    RAISE EXCEPTION 'Not authorized for this hotel';
  END IF;

  UPDATE public.tasks
  SET
    status = v_new_status,
    started_at = CASE
      WHEN v_new_status = 'in_progress' AND started_at IS NULL THEN now()
      ELSE started_at
    END,
    completed_at = CASE
      WHEN v_new_status = 'completed' THEN now()
      WHEN v_new_status <> 'completed' THEN NULL
      ELSE completed_at
    END,
    notes = CASE
      WHEN NULLIF(TRIM(COALESCE(p_note, '')), '') IS NULL THEN notes
      ELSE COALESCE(notes, '') || CASE WHEN notes IS NULL OR notes = '' THEN '' ELSE E'\n' END || TRIM(p_note)
    END
  WHERE id = p_task_id
  RETURNING id, status::TEXT, started_at, completed_at
  INTO v_task.id, v_task.status, v_task.started_at, v_task.completed_at;

  RETURN QUERY SELECT v_task.id, v_task.status::TEXT, v_task.started_at, v_task.completed_at;
END;
$$;

-- =============================================================================
-- 5) EXECUTE GRANTS
-- =============================================================================

GRANT EXECUTE ON FUNCTION public.rpc_get_checkout_queue(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_checkout_preview(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_room_availability(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_process_checkout(UUID, NUMERIC, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_assign_task(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_update_task_status(UUID, TEXT, TEXT) TO authenticated;
