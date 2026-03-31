-- StayOnStay: Owner/Manager hotel-room operational model
-- 1) Manager can belong to only one active hotel
-- 2) Manager has full room + room_type access for assigned hotel
-- 3) Hotel image URL support for compressed uploads

ALTER TABLE public.hotels
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Enforce: one active manager assignment per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_hotel_staff_manager_one_hotel
  ON public.hotel_staff(user_id)
  WHERE role = 'manager' AND deleted_at IS NULL;

-- Manager full access to room_types for assigned hotel
DROP POLICY IF EXISTS "room_types_staff_select" ON public.room_types;
CREATE POLICY "room_types_staff_all"
  ON public.room_types
  FOR ALL
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.hotel_staff hs
      WHERE hs.hotel_id = room_types.hotel_id
        AND hs.user_id = auth.uid()
        AND hs.role = 'manager'
        AND hs.deleted_at IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.hotel_staff hs
      WHERE hs.hotel_id = room_types.hotel_id
        AND hs.user_id = auth.uid()
        AND hs.role = 'manager'
        AND hs.deleted_at IS NULL
    )
  );

-- Manager full access to rooms for assigned hotel
DROP POLICY IF EXISTS "rooms_staff_select" ON public.rooms;
CREATE POLICY "rooms_staff_all"
  ON public.rooms
  FOR ALL
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.hotel_staff hs
      WHERE hs.hotel_id = rooms.hotel_id
        AND hs.user_id = auth.uid()
        AND hs.role = 'manager'
        AND hs.deleted_at IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.hotel_staff hs
      WHERE hs.hotel_id = rooms.hotel_id
        AND hs.user_id = auth.uid()
        AND hs.role = 'manager'
        AND hs.deleted_at IS NULL
    )
  );

-- Manager can update assigned hotel details (but cannot create/delete hotels)
CREATE POLICY "hotels_manager_update"
  ON public.hotels
  FOR UPDATE
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.hotel_staff hs
      WHERE hs.hotel_id = hotels.id
        AND hs.user_id = auth.uid()
        AND hs.role = 'manager'
        AND hs.deleted_at IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.hotel_staff hs
      WHERE hs.hotel_id = hotels.id
        AND hs.user_id = auth.uid()
        AND hs.role = 'manager'
        AND hs.deleted_at IS NULL
    )
  );
