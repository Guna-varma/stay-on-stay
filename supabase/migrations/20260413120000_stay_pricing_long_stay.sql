-- Long-stay nightly overrides (weekly / monthly) + booking pricing audit + RPC update

-- =============================================================================
-- 1) Room types: optional per-night rates for 7+ nights and 28+ nights
-- =============================================================================
ALTER TABLE public.room_types
  ADD COLUMN IF NOT EXISTS weekly_nightly_rate NUMERIC;

ALTER TABLE public.room_types
  ADD COLUMN IF NOT EXISTS monthly_nightly_rate NUMERIC;

COMMENT ON COLUMN public.room_types.weekly_nightly_rate IS
  'Optional lower per-night rate when stay is 7+ nights. If set, replaces catalog final_price for the whole stay.';
COMMENT ON COLUMN public.room_types.monthly_nightly_rate IS
  'Optional per-night rate when stay is 28+ nights. Takes precedence over weekly_nightly_rate when both apply.';

-- =============================================================================
-- 2) Bookings: tier + list (rack) subtotal + optional reception negotiation
-- =============================================================================
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS pricing_tier TEXT;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS list_price_subtotal NUMERIC;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS negotiated_discount_type TEXT;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS negotiated_discount_value NUMERIC NOT NULL DEFAULT 0;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS negotiated_note TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bookings_pricing_tier_check'
  ) THEN
    ALTER TABLE public.bookings
      ADD CONSTRAINT bookings_pricing_tier_check
      CHECK (pricing_tier IS NULL OR pricing_tier IN ('standard', 'weekly', 'monthly'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bookings_negotiated_discount_type_check'
  ) THEN
    ALTER TABLE public.bookings
      ADD CONSTRAINT bookings_negotiated_discount_type_check
      CHECK (
        negotiated_discount_type IS NULL
        OR negotiated_discount_type IN ('none', 'percentage', 'flat')
      );
  END IF;
END $$;

-- =============================================================================
-- 3) Replace assign_room_and_create_booking (extended for Stripe + manual audit)
-- =============================================================================
DROP FUNCTION IF EXISTS public.assign_room_and_create_booking(
  uuid, date, date, uuid, text, text, text, text, text, text, numeric, text, numeric, text, text
);

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
  p_hotel_name_snap text,
  p_list_price_subtotal numeric DEFAULT NULL,
  p_pricing_tier text DEFAULT NULL,
  p_negotiated_discount_type text DEFAULT NULL,
  p_negotiated_discount_value numeric DEFAULT NULL,
  p_negotiated_note text DEFAULT NULL
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
  v_neg_type text;
  v_neg_val numeric;
BEGIN
  IF p_check_out_date <= p_check_in_date THEN
    RAISE EXCEPTION 'invalid_date_range';
  END IF;

  v_new_range := daterange(p_check_in_date, p_check_out_date, '[)');

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

  v_neg_type := nullif(trim(p_negotiated_discount_type), '');
  v_neg_val := coalesce(p_negotiated_discount_value, 0);

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
    hotel_name_snapshot,
    pricing_tier,
    list_price_subtotal,
    negotiated_discount_type,
    negotiated_discount_value,
    negotiated_note
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
    nullif(trim(p_hotel_name_snap), ''),
    nullif(trim(p_pricing_tier), ''),
    p_list_price_subtotal,
    v_neg_type,
    v_neg_val,
    nullif(trim(p_negotiated_note), '')
  )
  RETURNING id INTO v_booking_id;

  RETURN v_booking_id;
END;
$$;

COMMENT ON FUNCTION public.assign_room_and_create_booking IS
  'Creates guest, locks room (SKIP LOCKED), inserts confirmed booking. p_price_per_night_snap = effective nightly charged. Optional list/tier for long-stay audit; optional negotiated_* for staff bookings.';

REVOKE ALL ON FUNCTION public.assign_room_and_create_booking(
  uuid, date, date, uuid, text, text, text, text, text, text, numeric, text, numeric, text, text,
  numeric, text, text, numeric, text
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.assign_room_and_create_booking(
  uuid, date, date, uuid, text, text, text, text, text, text, numeric, text, numeric, text, text,
  numeric, text, text, numeric, text
) TO service_role;

-- =============================================================================
-- 4) Public catalog RPC: expose long-stay fields on room types
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_public_hotel_catalog()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT COALESCE(jsonb_agg(hotel_data), '[]'::jsonb) INTO result
  FROM (
    SELECT
      h.id,
      h.name,
      h.description,
      h.address,
      h.city,
      h.country,
      h.image_url,
      COALESCE((
        SELECT jsonb_agg(hi.image_url ORDER BY hi.sort_order)
        FROM public.hotel_images hi
        WHERE hi.hotel_id = h.id
      ), '[]'::jsonb) AS cover_images,
      COALESCE((
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', rt.id,
            'hotel_id', rt.hotel_id,
            'name', rt.name,
            'description', rt.description,
            'max_guests', rt.max_guests,
            'base_price', rt.base_price,
            'discount_type', rt.discount_type,
            'discount_value', rt.discount_value,
            'final_price', rt.final_price,
            'weekly_nightly_rate', rt.weekly_nightly_rate,
            'monthly_nightly_rate', rt.monthly_nightly_rate,
            'images', COALESCE((
              SELECT jsonb_agg(rti.image_url ORDER BY rti.sort_order)
              FROM public.room_type_images rti
              WHERE rti.room_type_id = rt.id
            ), '[]'::jsonb),
            'rooms', COALESCE((
              SELECT jsonb_agg(r.room_number ORDER BY r.room_number)
              FROM public.rooms r
              WHERE r.room_type_id = rt.id AND r.deleted_at IS NULL
            ), '[]'::jsonb)
          ) ORDER BY rt.created_at
        )
        FROM public.room_types rt
        WHERE rt.hotel_id = h.id AND rt.deleted_at IS NULL
      ), '[]'::jsonb) AS room_types,
      COALESCE((
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', a.id,
            'name', a.name,
            'icon', a.icon
          )
        )
        FROM public.hotel_amenities ha
        INNER JOIN public.amenities a ON a.id = ha.amenity_id
        WHERE ha.hotel_id = h.id
      ), '[]'::jsonb) AS amenities,
      COALESCE((
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', l.id,
            'name', l.name,
            'google_maps_url', l.google_maps_url,
            'latitude', l.latitude,
            'longitude', l.longitude
          )
        )
        FROM public.landmarks l
        WHERE l.hotel_id = h.id
      ), '[]'::jsonb) AS landmarks
    FROM public.hotels h
    WHERE h.deleted_at IS NULL
    ORDER BY h.created_at DESC
  ) hotel_data;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_hotel_catalog() TO anon, authenticated;
