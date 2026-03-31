-- StayOnStay: Room-type images, Stripe columns, webhook idempotency, race-safe booking RPC
-- Run after 20250315000013_admin_role_manual.sql

-- =============================================================================
-- 1) Room type images (gallery per category)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.room_type_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_type_id UUID NOT NULL REFERENCES public.room_types(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_room_type_images_room_type_id ON public.room_type_images(room_type_id);

ALTER TABLE public.room_type_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "room_type_images_owner_all" ON public.room_type_images;
CREATE POLICY "room_type_images_owner_all"
  ON public.room_type_images FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.room_types rt
      JOIN public.hotels h ON h.id = rt.hotel_id
      WHERE rt.id = room_type_images.room_type_id
        AND h.owner_id = auth.uid()
        AND rt.deleted_at IS NULL
        AND h.deleted_at IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.room_types rt
      JOIN public.hotels h ON h.id = rt.hotel_id
      WHERE rt.id = room_type_images.room_type_id
        AND h.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "room_type_images_admin_all" ON public.room_type_images;
CREATE POLICY "room_type_images_admin_all"
  ON public.room_type_images FOR ALL
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

DROP POLICY IF EXISTS "room_type_images_public_read" ON public.room_type_images;
CREATE POLICY "room_type_images_public_read"
  ON public.room_type_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.room_types rt
      JOIN public.hotels h ON h.id = rt.hotel_id
      WHERE rt.id = room_type_images.room_type_id
        AND h.deleted_at IS NULL
        AND rt.deleted_at IS NULL
    )
  );

-- =============================================================================
-- 2) Bookings: Stripe + price snapshots (historical accuracy)
-- =============================================================================
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS price_per_night_snapshot NUMERIC,
  ADD COLUMN IF NOT EXISTS room_type_name_snapshot TEXT,
  ADD COLUMN IF NOT EXISTS hotel_name_snapshot TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_stripe_checkout_session_id
  ON public.bookings(stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;

-- =============================================================================
-- 3) Stripe webhook idempotency
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  payload JSONB
);

COMMENT ON TABLE public.stripe_webhook_events IS 'Stripe event id dedupe; written only from Edge Function (service role).';

-- =============================================================================
-- 4) Availability count (half-open [check_in, check_out) vs booking stay_period)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.count_available_rooms(
  p_room_type_id uuid,
  p_check_in_date date,
  p_check_out_date date
)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY INVOKER
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
  'Counts physical rooms of a type with no overlapping confirmed/checked_in booking; half-open [check_in, check_out).';

GRANT EXECUTE ON FUNCTION public.count_available_rooms(uuid, date, date) TO anon, authenticated, service_role;

-- =============================================================================
-- 5) Race-safe assign room + create booking (FOR UPDATE SKIP LOCKED)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.assign_room_and_create_booking(
  p_room_type_id uuid,
  p_check_in_date date,
  p_check_out_date date,
  p_booker_id uuid,
  p_guest_first_name text,
  p_guest_last_name text,
  p_guest_email text,
  p_guest_phone text,
  p_stripe_checkout_session_id text,
  p_stripe_payment_intent_id text,
  p_total_price numeric,
  p_currency text,
  p_price_per_night_snap numeric,
  p_room_type_name_snap text,
  p_hotel_name_snap text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing uuid;
  v_guest_id uuid;
  v_room_id uuid;
  v_hotel_id uuid;
  v_booking_id uuid;
  v_new_range daterange;
BEGIN
  IF p_check_out_date <= p_check_in_date THEN
    RAISE EXCEPTION 'invalid_date_range';
  END IF;

  v_new_range := daterange(p_check_in_date, p_check_out_date, '[)');

  -- Idempotency: same Stripe session → return existing booking
  IF p_stripe_checkout_session_id IS NOT NULL AND length(trim(p_stripe_checkout_session_id)) > 0 THEN
    SELECT b.id INTO v_existing
    FROM public.bookings b
    WHERE b.stripe_checkout_session_id = p_stripe_checkout_session_id
    LIMIT 1;
    IF v_existing IS NOT NULL THEN
      RETURN v_existing;
    END IF;
  END IF;

  INSERT INTO public.guests (first_name, last_name, email)
  VALUES (
    nullif(trim(p_guest_first_name), ''),
    nullif(trim(p_guest_last_name), ''),
    nullif(trim(p_guest_email), '')
  )
  RETURNING id INTO v_guest_id;

  IF p_guest_phone IS NOT NULL AND length(trim(p_guest_phone)) > 0 THEN
    INSERT INTO public.guest_contacts (guest_id, contact_type, phone_number)
    VALUES (v_guest_id, 'phone', trim(p_guest_phone));
  END IF;

  -- Lock one available room row; SKIP LOCKED lets concurrent txs skip rows already locked.
  SELECT r.id INTO v_room_id
  FROM public.rooms r
  WHERE r.room_type_id = p_room_type_id
    AND r.deleted_at IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.room_id = r.id
        AND b.status IN ('confirmed', 'checked_in')
        AND b.stay_period && v_new_range
    )
  ORDER BY r.created_at, r.id
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF v_room_id IS NULL THEN
    RAISE EXCEPTION 'no_room_available' USING ERRCODE = 'P0001';
  END IF;

  SELECT r.hotel_id INTO v_hotel_id FROM public.rooms r WHERE r.id = v_room_id;

  INSERT INTO public.bookings (
    hotel_id,
    room_id,
    guest_id,
    booker_id,
    check_in_date,
    check_out_date,
    status,
    total_price,
    stripe_checkout_session_id,
    stripe_payment_intent_id,
    currency,
    price_per_night_snapshot,
    room_type_name_snapshot,
    hotel_name_snapshot
  )
  VALUES (
    v_hotel_id,
    v_room_id,
    v_guest_id,
    p_booker_id,
    p_check_in_date,
    p_check_out_date,
    'confirmed',
    p_total_price,
    nullif(trim(p_stripe_checkout_session_id), ''),
    nullif(trim(p_stripe_payment_intent_id), ''),
    coalesce(nullif(trim(p_currency), ''), 'INR'),
    p_price_per_night_snap,
    nullif(trim(p_room_type_name_snap), ''),
    nullif(trim(p_hotel_name_snap), '')
  )
  RETURNING id INTO v_booking_id;

  RETURN v_booking_id;
END;
$$;

COMMENT ON FUNCTION public.assign_room_and_create_booking IS
  'Single transaction: create guest, lock one room with FOR UPDATE SKIP LOCKED, insert confirmed booking. Aligns with EXCLUDE constraint on stay_period.';

REVOKE ALL ON FUNCTION public.assign_room_and_create_booking(
  uuid, date, date, uuid, text, text, text, text, text, text, numeric, text, numeric, text, text
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.assign_room_and_create_booking(
  uuid, date, date, uuid, text, text, text, text, text, text, numeric, text, numeric, text, text
) TO service_role;

-- =============================================================================
-- 6) Storage: admins can upload to hotel-images (for onboarding hotels for any owner)
-- =============================================================================
DROP POLICY IF EXISTS "hotel_images_admin_all" ON storage.objects;
CREATE POLICY "hotel_images_admin_all"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'hotel-images'
    AND public.current_user_is_admin()
  )
  WITH CHECK (
    bucket_id = 'hotel-images'
    AND public.current_user_is_admin()
  );
