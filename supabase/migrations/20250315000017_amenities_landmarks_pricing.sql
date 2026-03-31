-- StayOnStay: Amenities, Landmarks, and Discount Pricing
-- Run after 20250315000016_fix_hotel_staff_rls_recursion.sql

-- =============================================================================
-- 1) Global amenities catalog
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.amenities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT amenities_name_unique UNIQUE (name)
);

ALTER TABLE public.amenities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "amenities_public_select" ON public.amenities;
CREATE POLICY "amenities_public_select"
  ON public.amenities FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "amenities_admin_insert" ON public.amenities;
CREATE POLICY "amenities_admin_insert"
  ON public.amenities FOR INSERT
  TO authenticated
  WITH CHECK (public.current_user_is_admin() OR public.current_user_role() IN ('owner', 'admin'));

DROP POLICY IF EXISTS "amenities_admin_update" ON public.amenities;
CREATE POLICY "amenities_admin_update"
  ON public.amenities FOR UPDATE
  TO authenticated
  USING (public.current_user_is_admin());

DROP POLICY IF EXISTS "amenities_admin_delete" ON public.amenities;
CREATE POLICY "amenities_admin_delete"
  ON public.amenities FOR DELETE
  TO authenticated
  USING (public.current_user_is_admin());

-- Seed 20 default amenities
INSERT INTO public.amenities (name, icon) VALUES
  ('WiFi', 'wifi'),
  ('Air Conditioning', 'snowflake'),
  ('TV', 'tv'),
  ('Parking', 'car'),
  ('Swimming Pool', 'waves'),
  ('Gym', 'dumbbell'),
  ('Restaurant', 'utensils'),
  ('Room Service', 'concierge-bell'),
  ('Laundry', 'shirt'),
  ('Power Backup', 'zap'),
  ('CCTV', 'camera'),
  ('Elevator', 'arrow-up-down'),
  ('Hot Water', 'flame'),
  ('Housekeeping', 'sparkles'),
  ('Breakfast Included', 'coffee'),
  ('Airport Shuttle', 'plane'),
  ('Pet Friendly', 'paw-print'),
  ('Wheelchair Accessible', 'accessibility'),
  ('Mini Bar', 'wine'),
  ('Balcony', 'sun')
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- 2) Hotel-amenities join table (many-to-many)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.hotel_amenities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  amenity_id UUID NOT NULL REFERENCES public.amenities(id) ON DELETE CASCADE,
  CONSTRAINT hotel_amenities_unique UNIQUE (hotel_id, amenity_id)
);

ALTER TABLE public.hotel_amenities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hotel_amenities_public_select" ON public.hotel_amenities;
CREATE POLICY "hotel_amenities_public_select"
  ON public.hotel_amenities FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "hotel_amenities_owner_admin_insert" ON public.hotel_amenities;
CREATE POLICY "hotel_amenities_owner_admin_insert"
  ON public.hotel_amenities FOR INSERT
  TO authenticated
  WITH CHECK (
    public.current_user_is_admin()
    OR EXISTS (
      SELECT 1 FROM public.hotels h
      WHERE h.id = hotel_amenities.hotel_id
        AND h.owner_id = auth.uid()
        AND h.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "hotel_amenities_owner_admin_delete" ON public.hotel_amenities;
CREATE POLICY "hotel_amenities_owner_admin_delete"
  ON public.hotel_amenities FOR DELETE
  TO authenticated
  USING (
    public.current_user_is_admin()
    OR EXISTS (
      SELECT 1 FROM public.hotels h
      WHERE h.id = hotel_amenities.hotel_id
        AND h.owner_id = auth.uid()
        AND h.deleted_at IS NULL
    )
  );

-- =============================================================================
-- 3) Landmarks per hotel
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.landmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  google_maps_url TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.landmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "landmarks_public_select" ON public.landmarks;
CREATE POLICY "landmarks_public_select"
  ON public.landmarks FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "landmarks_owner_admin_insert" ON public.landmarks;
CREATE POLICY "landmarks_owner_admin_insert"
  ON public.landmarks FOR INSERT
  TO authenticated
  WITH CHECK (
    public.current_user_is_admin()
    OR EXISTS (
      SELECT 1 FROM public.hotels h
      WHERE h.id = landmarks.hotel_id
        AND h.owner_id = auth.uid()
        AND h.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "landmarks_owner_admin_update" ON public.landmarks;
CREATE POLICY "landmarks_owner_admin_update"
  ON public.landmarks FOR UPDATE
  TO authenticated
  USING (
    public.current_user_is_admin()
    OR EXISTS (
      SELECT 1 FROM public.hotels h
      WHERE h.id = landmarks.hotel_id
        AND h.owner_id = auth.uid()
        AND h.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "landmarks_owner_admin_delete" ON public.landmarks;
CREATE POLICY "landmarks_owner_admin_delete"
  ON public.landmarks FOR DELETE
  TO authenticated
  USING (
    public.current_user_is_admin()
    OR EXISTS (
      SELECT 1 FROM public.hotels h
      WHERE h.id = landmarks.hotel_id
        AND h.owner_id = auth.uid()
        AND h.deleted_at IS NULL
    )
  );

-- =============================================================================
-- 4) Discount pricing on room_types
-- =============================================================================
ALTER TABLE public.room_types
  ADD COLUMN IF NOT EXISTS discount_type TEXT NOT NULL DEFAULT 'none'
    CHECK (discount_type IN ('none', 'percentage', 'flat'));

ALTER TABLE public.room_types
  ADD COLUMN IF NOT EXISTS discount_value NUMERIC NOT NULL DEFAULT 0;

-- Generated column for final price (always consistent)
-- NOTE: Postgres requires DROP + ADD for generated columns if they don't exist yet.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'room_types'
      AND column_name = 'final_price'
  ) THEN
    ALTER TABLE public.room_types
      ADD COLUMN final_price NUMERIC GENERATED ALWAYS AS (
        CASE
          WHEN discount_type = 'percentage' AND base_price IS NOT NULL
            THEN GREATEST(0, base_price - (base_price * discount_value / 100))
          WHEN discount_type = 'flat' AND base_price IS NOT NULL
            THEN GREATEST(0, base_price - discount_value)
          ELSE COALESCE(base_price, 0)
        END
      ) STORED;
  END IF;
END $$;

-- =============================================================================
-- 5) Indexes for performance
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_hotel_amenities_hotel ON public.hotel_amenities(hotel_id);
CREATE INDEX IF NOT EXISTS idx_hotel_amenities_amenity ON public.hotel_amenities(amenity_id);
CREATE INDEX IF NOT EXISTS idx_landmarks_hotel ON public.landmarks(hotel_id);
