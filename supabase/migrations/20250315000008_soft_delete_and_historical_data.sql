-- StayOnStay: Soft delete + historical data preservation for SaaS-grade auditability
-- Run after 20250315000007_profiles_update_own_onboarding.sql

-- =============================================================================
-- 1) Add soft-delete columns to master tables (history-safe)
-- =============================================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES public.profiles(id);

ALTER TABLE public.hotels
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES public.profiles(id);

ALTER TABLE public.hotel_staff
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES public.profiles(id);

ALTER TABLE public.room_types
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES public.profiles(id);

ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES public.profiles(id);

ALTER TABLE public.guests
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES public.profiles(id);

CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON public.profiles(deleted_at);
CREATE INDEX IF NOT EXISTS idx_hotels_deleted_at ON public.hotels(deleted_at);
CREATE INDEX IF NOT EXISTS idx_hotel_staff_deleted_at ON public.hotel_staff(deleted_at);
CREATE INDEX IF NOT EXISTS idx_room_types_deleted_at ON public.room_types(deleted_at);
CREATE INDEX IF NOT EXISTS idx_rooms_deleted_at ON public.rooms(deleted_at);
CREATE INDEX IF NOT EXISTS idx_guests_deleted_at ON public.guests(deleted_at);

-- =============================================================================
-- 2) Prevent hard deletes (preserve audit trail and historical references)
-- =============================================================================
DROP POLICY IF EXISTS "guests_admin_delete" ON public.guests;
-- No DELETE policies on soft-delete tables means hard delete is denied by RLS.

-- =============================================================================
-- 3) Profiles RLS: hide archived profiles from normal reads
-- =============================================================================
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id AND deleted_at IS NULL);

DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
CREATE POLICY "profiles_select_admin"
  ON public.profiles
  FOR SELECT
  USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin' AND deleted_at IS NULL)
    AND deleted_at IS NULL
  );

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id AND deleted_at IS NULL)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
  );

DROP POLICY IF EXISTS "profiles_update_admin_only" ON public.profiles;
CREATE POLICY "profiles_update_admin_only"
  ON public.profiles
  FOR UPDATE
  USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin' AND deleted_at IS NULL)
    AND id <> auth.uid()
  )
  WITH CHECK (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin' AND deleted_at IS NULL)
    AND id <> auth.uid()
  );

-- =============================================================================
-- 4) Hotels RLS: active-only by default; INSERT/SELECT/UPDATE only
-- =============================================================================
DROP POLICY IF EXISTS "hotels_owner_all" ON public.hotels;
DROP POLICY IF EXISTS "hotels_admin_all" ON public.hotels;
DROP POLICY IF EXISTS "hotels_staff_select" ON public.hotels;

CREATE POLICY "hotels_owner_select"
  ON public.hotels FOR SELECT
  USING (auth.uid() = owner_id AND deleted_at IS NULL);

CREATE POLICY "hotels_owner_insert"
  ON public.hotels FOR INSERT
  WITH CHECK (auth.uid() = owner_id AND deleted_at IS NULL);

CREATE POLICY "hotels_owner_update"
  ON public.hotels FOR UPDATE
  USING (auth.uid() = owner_id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "hotels_admin_select"
  ON public.hotels FOR SELECT
  USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin' AND deleted_at IS NULL)
    AND deleted_at IS NULL
  );

CREATE POLICY "hotels_admin_insert"
  ON public.hotels FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin' AND deleted_at IS NULL)
    AND deleted_at IS NULL
  );

CREATE POLICY "hotels_admin_update"
  ON public.hotels FOR UPDATE
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin' AND deleted_at IS NULL))
  WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin' AND deleted_at IS NULL));

CREATE POLICY "hotels_staff_select"
  ON public.hotels FOR SELECT
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.hotel_staff hs
      WHERE hs.hotel_id = hotels.id
        AND hs.user_id = auth.uid()
        AND hs.deleted_at IS NULL
    )
  );

-- =============================================================================
-- 5) Hotel staff RLS: active-only by default; no hard delete
-- =============================================================================
DROP POLICY IF EXISTS "hotel_staff_select_own" ON public.hotel_staff;
DROP POLICY IF EXISTS "hotel_staff_owner_manage" ON public.hotel_staff;
DROP POLICY IF EXISTS "hotel_staff_admin_all" ON public.hotel_staff;
DROP POLICY IF EXISTS "hotel_staff_select_same_hotel" ON public.hotel_staff;

CREATE POLICY "hotel_staff_select_own"
  ON public.hotel_staff FOR SELECT
  USING (user_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "hotel_staff_owner_insert"
  ON public.hotel_staff FOR INSERT
  WITH CHECK (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.hotels h
      WHERE h.id = hotel_staff.hotel_id
        AND h.owner_id = auth.uid()
        AND h.deleted_at IS NULL
    )
  );

CREATE POLICY "hotel_staff_owner_update"
  ON public.hotel_staff FOR UPDATE
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.hotels h
      WHERE h.id = hotel_staff.hotel_id
        AND h.owner_id = auth.uid()
        AND h.deleted_at IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.hotels h
      WHERE h.id = hotel_staff.hotel_id
        AND h.owner_id = auth.uid()
    )
  );

CREATE POLICY "hotel_staff_admin_select"
  ON public.hotel_staff FOR SELECT
  USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin' AND deleted_at IS NULL)
    AND deleted_at IS NULL
  );

CREATE POLICY "hotel_staff_admin_insert"
  ON public.hotel_staff FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin' AND deleted_at IS NULL)
    AND deleted_at IS NULL
  );

CREATE POLICY "hotel_staff_admin_update"
  ON public.hotel_staff FOR UPDATE
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin' AND deleted_at IS NULL))
  WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin' AND deleted_at IS NULL));

CREATE POLICY "hotel_staff_select_same_hotel"
  ON public.hotel_staff FOR SELECT
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.hotel_staff hs
      WHERE hs.hotel_id = hotel_staff.hotel_id
        AND hs.user_id = auth.uid()
        AND hs.deleted_at IS NULL
    )
  );

-- =============================================================================
-- 6) Room types RLS: active-only by default; no hard delete
-- =============================================================================
DROP POLICY IF EXISTS "room_types_owner_all" ON public.room_types;
DROP POLICY IF EXISTS "room_types_staff_select" ON public.room_types;
DROP POLICY IF EXISTS "room_types_admin_all" ON public.room_types;

CREATE POLICY "room_types_owner_select"
  ON public.room_types FOR SELECT
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.hotels h
      WHERE h.id = room_types.hotel_id
        AND h.owner_id = auth.uid()
        AND h.deleted_at IS NULL
    )
  );

CREATE POLICY "room_types_owner_insert"
  ON public.room_types FOR INSERT
  WITH CHECK (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.hotels h
      WHERE h.id = room_types.hotel_id
        AND h.owner_id = auth.uid()
        AND h.deleted_at IS NULL
    )
  );

CREATE POLICY "room_types_owner_update"
  ON public.room_types FOR UPDATE
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.hotels h
      WHERE h.id = room_types.hotel_id
        AND h.owner_id = auth.uid()
        AND h.deleted_at IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.hotels h
      WHERE h.id = room_types.hotel_id
        AND h.owner_id = auth.uid()
    )
  );

CREATE POLICY "room_types_staff_select"
  ON public.room_types FOR SELECT
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.hotel_staff hs
      WHERE hs.hotel_id = room_types.hotel_id
        AND hs.user_id = auth.uid()
        AND hs.deleted_at IS NULL
    )
  );

CREATE POLICY "room_types_admin_select"
  ON public.room_types FOR SELECT
  USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin' AND deleted_at IS NULL)
    AND deleted_at IS NULL
  );

CREATE POLICY "room_types_admin_insert"
  ON public.room_types FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin' AND deleted_at IS NULL)
    AND deleted_at IS NULL
  );

CREATE POLICY "room_types_admin_update"
  ON public.room_types FOR UPDATE
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin' AND deleted_at IS NULL))
  WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin' AND deleted_at IS NULL));

-- =============================================================================
-- 7) Rooms RLS: active-only by default; no hard delete
-- =============================================================================
DROP POLICY IF EXISTS "rooms_owner_all" ON public.rooms;
DROP POLICY IF EXISTS "rooms_staff_select" ON public.rooms;
DROP POLICY IF EXISTS "rooms_admin_all" ON public.rooms;

CREATE POLICY "rooms_owner_select"
  ON public.rooms FOR SELECT
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.hotels h
      WHERE h.id = rooms.hotel_id
        AND h.owner_id = auth.uid()
        AND h.deleted_at IS NULL
    )
  );

CREATE POLICY "rooms_owner_insert"
  ON public.rooms FOR INSERT
  WITH CHECK (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.hotels h
      WHERE h.id = rooms.hotel_id
        AND h.owner_id = auth.uid()
        AND h.deleted_at IS NULL
    )
  );

CREATE POLICY "rooms_owner_update"
  ON public.rooms FOR UPDATE
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.hotels h
      WHERE h.id = rooms.hotel_id
        AND h.owner_id = auth.uid()
        AND h.deleted_at IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.hotels h
      WHERE h.id = rooms.hotel_id
        AND h.owner_id = auth.uid()
    )
  );

CREATE POLICY "rooms_staff_select"
  ON public.rooms FOR SELECT
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.hotel_staff hs
      WHERE hs.hotel_id = rooms.hotel_id
        AND hs.user_id = auth.uid()
        AND hs.deleted_at IS NULL
    )
  );

CREATE POLICY "rooms_admin_select"
  ON public.rooms FOR SELECT
  USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin' AND deleted_at IS NULL)
    AND deleted_at IS NULL
  );

CREATE POLICY "rooms_admin_insert"
  ON public.rooms FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin' AND deleted_at IS NULL)
    AND deleted_at IS NULL
  );

CREATE POLICY "rooms_admin_update"
  ON public.rooms FOR UPDATE
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin' AND deleted_at IS NULL))
  WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin' AND deleted_at IS NULL));

-- =============================================================================
-- 8) Guests RLS: active-only by default; no hard delete
-- =============================================================================
DROP POLICY IF EXISTS "guests_insert_authenticated" ON public.guests;
DROP POLICY IF EXISTS "guests_select_staff_or_admin" ON public.guests;
DROP POLICY IF EXISTS "guests_update_staff_or_admin" ON public.guests;

CREATE POLICY "guests_insert_authenticated"
  ON public.guests FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND deleted_at IS NULL);

CREATE POLICY "guests_select_staff_or_admin"
  ON public.guests FOR SELECT
  USING (
    deleted_at IS NULL
    AND (
      auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin' AND deleted_at IS NULL)
      OR EXISTS (
        SELECT 1 FROM public.bookings b
        JOIN public.hotels h ON h.id = b.hotel_id
        LEFT JOIN public.hotel_staff hs ON hs.hotel_id = h.id AND hs.user_id = auth.uid()
        WHERE b.guest_id = guests.id
          AND h.deleted_at IS NULL
          AND (h.owner_id = auth.uid() OR (hs.user_id IS NOT NULL AND hs.deleted_at IS NULL))
      )
      OR EXISTS (SELECT 1 FROM public.bookings b WHERE b.guest_id = guests.id AND b.booker_id = auth.uid())
    )
  );

CREATE POLICY "guests_update_staff_or_admin"
  ON public.guests FOR UPDATE
  USING (
    deleted_at IS NULL
    AND (
      auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin' AND deleted_at IS NULL)
      OR EXISTS (
        SELECT 1 FROM public.bookings b
        JOIN public.hotels h ON h.id = b.hotel_id
        LEFT JOIN public.hotel_staff hs ON hs.hotel_id = h.id AND hs.user_id = auth.uid()
        WHERE b.guest_id = guests.id
          AND h.deleted_at IS NULL
          AND (h.owner_id = auth.uid() OR (hs.user_id IS NOT NULL AND hs.deleted_at IS NULL))
      )
    )
  )
  WITH CHECK (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin' AND deleted_at IS NULL)
    OR EXISTS (
      SELECT 1 FROM public.bookings b
      JOIN public.hotels h ON h.id = b.hotel_id
      LEFT JOIN public.hotel_staff hs ON hs.hotel_id = h.id AND hs.user_id = auth.uid()
      WHERE b.guest_id = guests.id
        AND (h.owner_id = auth.uid() OR hs.user_id IS NOT NULL)
    )
  );

-- =============================================================================
-- 9) Enforce active rooms/hotels/guests for booking writes
-- =============================================================================
CREATE OR REPLACE FUNCTION public.ensure_booking_targets_active()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  room_ok BOOLEAN;
  hotel_ok BOOLEAN;
  guest_ok BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.rooms r
    WHERE r.id = NEW.room_id
      AND r.hotel_id = NEW.hotel_id
      AND r.deleted_at IS NULL
  ) INTO room_ok;

  IF NOT room_ok THEN
    RAISE EXCEPTION 'Cannot create/update booking with an archived room.'
      USING ERRCODE = '23514';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.hotels h
    WHERE h.id = NEW.hotel_id
      AND h.deleted_at IS NULL
  ) INTO hotel_ok;

  IF NOT hotel_ok THEN
    RAISE EXCEPTION 'Cannot create/update booking for an archived hotel.'
      USING ERRCODE = '23514';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.guests g
    WHERE g.id = NEW.guest_id
      AND g.deleted_at IS NULL
  ) INTO guest_ok;

  IF NOT guest_ok THEN
    RAISE EXCEPTION 'Cannot create/update booking for an archived guest.'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_require_active_targets ON public.bookings;
CREATE TRIGGER bookings_require_active_targets
  BEFORE INSERT OR UPDATE OF hotel_id, room_id, guest_id
  ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_booking_targets_active();

-- =============================================================================
-- 10) Helper view for app queries (active rooms only)
-- =============================================================================
CREATE OR REPLACE VIEW public.active_rooms AS
SELECT *
FROM public.rooms
WHERE deleted_at IS NULL;

COMMENT ON VIEW public.active_rooms IS 'Helper view: only active (non-archived) rooms.';
