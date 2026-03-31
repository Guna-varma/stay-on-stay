-- Public catalog RLS (anon + authenticated can browse active hotels / room types / rooms)
-- count_available_rooms: SECURITY DEFINER so availability RPC counts correctly without exposing raw rows
-- stripe_webhook_events: RLS + admin read for reconciliation

-- =============================================================================
-- 1) Availability count RPC (invoker RLS blocked anon from reading rooms/bookings)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.count_available_rooms(
  p_room_type_id uuid,
  p_check_in_date date,
  p_check_out_date date
)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(COUNT(*)::int, 0)
  FROM public.rooms r
  WHERE r.room_type_id = p_room_type_id
    AND r.deleted_at IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.room_id = r.id
        AND b.status IN ('confirmed', 'checked_in')
        AND b.stay_period && daterange(p_check_in_date, p_check_out_date, '[)')
    );
$$;

COMMENT ON FUNCTION public.count_available_rooms IS
  'SECURITY DEFINER: counts inventory without requiring public SELECT on rooms/bookings. Half-open [check_in, check_out).';

GRANT EXECUTE ON FUNCTION public.count_available_rooms(uuid, date, date) TO anon, authenticated, service_role;

-- =============================================================================
-- 2) Hotels: public catalog read
-- =============================================================================
DROP POLICY IF EXISTS "hotels_public_catalog_select" ON public.hotels;
CREATE POLICY "hotels_public_catalog_select"
  ON public.hotels FOR SELECT
  TO anon, authenticated
  USING (deleted_at IS NULL);

-- =============================================================================
-- 3) Room types: public catalog read
-- =============================================================================
DROP POLICY IF EXISTS "room_types_public_catalog_select" ON public.room_types;
CREATE POLICY "room_types_public_catalog_select"
  ON public.room_types FOR SELECT
  TO anon, authenticated
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.hotels h
      WHERE h.id = room_types.hotel_id AND h.deleted_at IS NULL
    )
  );

-- =============================================================================
-- 4) Rooms: public read for inventory display (no sensitive columns beyond listing)
-- =============================================================================
DROP POLICY IF EXISTS "rooms_public_catalog_select" ON public.rooms;
CREATE POLICY "rooms_public_catalog_select"
  ON public.rooms FOR SELECT
  TO anon, authenticated
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.hotels h
      WHERE h.id = rooms.hotel_id AND h.deleted_at IS NULL
    )
  );

-- =============================================================================
-- 5) Stripe webhook events: lock down + admin reconciliation
-- =============================================================================
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stripe_webhook_events_admin_select" ON public.stripe_webhook_events;
CREATE POLICY "stripe_webhook_events_admin_select"
  ON public.stripe_webhook_events FOR SELECT
  USING (public.current_user_is_admin());

-- Service role bypasses RLS for inserts from Edge Functions

-- =============================================================================
-- 6) Duplicate guest booking guard (used by create-checkout-session Edge Function)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.guest_has_overlapping_booking(
  p_room_type_id uuid,
  p_check_in_date date,
  p_check_out_date date,
  p_guest_email text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.bookings b
    JOIN public.rooms r ON r.id = b.room_id
    JOIN public.guests g ON g.id = b.guest_id
    WHERE r.room_type_id = p_room_type_id
      AND r.deleted_at IS NULL
      AND b.status IN ('confirmed', 'checked_in')
      AND b.stay_period && daterange(p_check_in_date, p_check_out_date, '[)')
      AND lower(trim(coalesce(g.email, ''))) = lower(trim(coalesce(p_guest_email, '')))
  );
$$;

COMMENT ON FUNCTION public.guest_has_overlapping_booking IS
  'True if a guest email already has a blocking booking for this room type and date range.';

GRANT EXECUTE ON FUNCTION public.guest_has_overlapping_booking(uuid, date, date, text) TO service_role;
