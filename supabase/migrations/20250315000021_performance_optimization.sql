-- StayOnStay: Performance Optimization for Public Hotel Catalog
-- Creates an optimized RPC to fetch all hotel data in a single query

-- =============================================================================
-- 1. CREATE OPTIMIZED PUBLIC HOTEL CATALOG RPC
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
  -- Single optimized query that fetches everything with proper joins
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
      -- Cover images as array
      COALESCE((
        SELECT jsonb_agg(hi.image_url ORDER BY hi.sort_order)
        FROM public.hotel_images hi
        WHERE hi.hotel_id = h.id
      ), '[]'::jsonb) as cover_images,
      -- Room types with images and rooms
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
      ), '[]'::jsonb) as room_types,
      -- Amenities
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
      ), '[]'::jsonb) as amenities,
      -- Landmarks
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
      ), '[]'::jsonb) as landmarks
    FROM public.hotels h
    WHERE h.deleted_at IS NULL
    ORDER BY h.created_at DESC
  ) hotel_data;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_hotel_catalog() TO anon, authenticated;

COMMENT ON FUNCTION public.get_public_hotel_catalog() IS 
  'Optimized RPC that returns complete hotel catalog with room types, images, amenities, and landmarks in a single query. Target: <100ms.';

-- =============================================================================
-- 2. ADD MISSING INDEXES FOR QUERY PERFORMANCE
-- =============================================================================

-- Index for user_contacts phone lookup
CREATE INDEX IF NOT EXISTS idx_user_contacts_user_type 
  ON public.user_contacts(user_id, contact_type);

-- Index for room availability queries
CREATE INDEX IF NOT EXISTS idx_rooms_hotel_type_status 
  ON public.rooms(hotel_id, room_type_id, status) WHERE deleted_at IS NULL;

-- Index for hotel images
CREATE INDEX IF NOT EXISTS idx_hotel_images_hotel_sort 
  ON public.hotel_images(hotel_id, sort_order);

-- Index for room type images
CREATE INDEX IF NOT EXISTS idx_room_type_images_type_sort 
  ON public.room_type_images(room_type_id, sort_order);

-- Index for hotel amenities join
CREATE INDEX IF NOT EXISTS idx_hotel_amenities_hotel 
  ON public.hotel_amenities(hotel_id);

-- Index for landmarks
CREATE INDEX IF NOT EXISTS idx_landmarks_hotel 
  ON public.landmarks(hotel_id);

-- Index for bookings by booker (customer dashboard)
CREATE INDEX IF NOT EXISTS idx_bookings_booker_created 
  ON public.bookings(booker_id, created_at DESC) WHERE deleted_at IS NULL;

-- =============================================================================
-- 3. ANALYZE TABLES FOR QUERY PLANNER
-- =============================================================================

ANALYZE public.hotels;
ANALYZE public.room_types;
ANALYZE public.rooms;
ANALYZE public.hotel_images;
ANALYZE public.room_type_images;
ANALYZE public.amenities;
ANALYZE public.hotel_amenities;
ANALYZE public.landmarks;
ANALYZE public.bookings;
ANALYZE public.user_contacts;
ANALYZE public.profiles;
