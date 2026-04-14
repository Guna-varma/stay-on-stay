-- StayOnStay front-desk walk-in check-in flow
-- Manager-only front-desk capability for draft walk-ins, temporary room holds, and transactional finalization.

-- =============================================================================
-- 1. EXTEND GUESTS / BOOKINGS
-- =============================================================================

ALTER TABLE public.guests
  ADD COLUMN IF NOT EXISTS guest_category TEXT CHECK (guest_category IN ('domestic', 'foreign')),
  ADD COLUMN IF NOT EXISTS address_line1 TEXT,
  ADD COLUMN IF NOT EXISTS address_line2 TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state_region TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT,
  ADD COLUMN IF NOT EXISTS id_type TEXT,
  ADD COLUMN IF NOT EXISTS id_number TEXT,
  ADD COLUMN IF NOT EXISTS passport_expiry_date DATE,
  ADD COLUMN IF NOT EXISTS passport_issued_country TEXT,
  ADD COLUMN IF NOT EXISTS preferred_language TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS guests_updated_at ON public.guests;
CREATE TRIGGER guests_updated_at
  BEFORE UPDATE ON public.guests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- 2. FRONT-DESK HELPERS
-- =============================================================================

-- Ensure the column exists before functions compile, in case of a partial previous run
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.walkin_checkin_drafts ADD COLUMN IF NOT EXISTS assigned_operator_id UUID;
  EXCEPTION
    WHEN undefined_table THEN
      -- table doesn't exist yet, safe to ignore
      NULL;
  END;
END $$;

CREATE OR REPLACE FUNCTION public.current_user_can_operate_frontdesk(p_hotel_id UUID)
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
      AND COALESCE(p.is_active, TRUE) = TRUE
      AND p.role = 'manager'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_walkin_draft_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
VOLATILE
SET search_path = public
AS $$
BEGIN
  RETURN 'WD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(REPLACE(gen_random_uuid()::TEXT, '-', '') FROM 1 FOR 6));
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_frontdesk_booking_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
VOLATILE
SET search_path = public
AS $$
BEGIN
  RETURN 'BK-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD((FLOOR(RANDOM() * 100000))::INT::TEXT, 5, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.frontdesk_hotel_id_from_storage_path(p_name TEXT)
RETURNS UUID
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_parts TEXT[];
BEGIN
  v_parts := storage.foldername(p_name);
  IF array_length(v_parts, 1) >= 2
     AND v_parts[1] = 'hotels'
     AND v_parts[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN v_parts[2]::UUID;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.frontdesk_draft_id_from_storage_path(p_name TEXT)
RETURNS UUID
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_parts TEXT[];
BEGIN
  v_parts := storage.foldername(p_name);
  IF array_length(v_parts, 1) >= 4
     AND v_parts[1] = 'hotels'
     AND v_parts[3] = 'walkin-drafts'
     AND v_parts[4] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN v_parts[4]::UUID;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.current_user_owns_walkin_draft(p_draft_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.walkin_checkin_drafts d
    WHERE d.id = p_draft_id
      AND d.assigned_operator_id = auth.uid()
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.current_user_can_access_guest_document_path(p_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_draft_id UUID;
BEGIN
  v_draft_id := public.frontdesk_draft_id_from_storage_path(p_name);
  IF v_draft_id IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN public.current_user_owns_walkin_draft(v_draft_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.required_walkin_document_types(
  p_guest_category TEXT,
  p_guest_payload JSONB DEFAULT '{}'::JSONB
)
RETURNS TEXT[]
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_required TEXT[];
  v_needs_visa BOOLEAN;
BEGIN
  IF COALESCE(TRIM(p_guest_category), '') = 'foreign' THEN
    v_required := ARRAY['passport'];
    v_needs_visa :=
      COALESCE((p_guest_payload ->> 'visa_required')::BOOLEAN, FALSE)
      OR COALESCE(NULLIF(TRIM(p_guest_payload ->> 'visa_type'), ''), '') <> ''
      OR COALESCE(NULLIF(TRIM(p_guest_payload ->> 'visa_expiry_date'), ''), '') <> '';
    IF v_needs_visa THEN
      v_required := v_required || ARRAY['visa'];
    END IF;
  ELSE
    v_required := ARRAY['government_id'];
  END IF;

  RETURN v_required;
END;
$$;

-- =============================================================================
-- 3. WALK-IN DRAFT TABLES
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.walkin_checkin_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_code TEXT NOT NULL UNIQUE DEFAULT public.generate_walkin_draft_code(),
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_operator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  taken_over_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  taken_over_at TIMESTAMPTZ,
  assigned_room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  primary_guest_id UUID REFERENCES public.guests(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'room_held', 'docs_pending', 'ready', 'completed', 'cancelled', 'expired')),
  guest_payload JSONB NOT NULL DEFAULT '{}'::JSONB,
  companions_payload JSONB NOT NULL DEFAULT '[]'::JSONB,
  check_in_date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_out_date DATE NOT NULL DEFAULT (CURRENT_DATE + 1),
  guest_category TEXT CHECK (guest_category IN ('domestic', 'foreign')),
  primary_guest_name TEXT,
  primary_phone TEXT,
  document_status TEXT NOT NULL DEFAULT 'missing'
    CHECK (document_status IN ('missing', 'partial', 'complete')),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revision INTEGER NOT NULL DEFAULT 1,
  hold_expires_at TIMESTAMPTZ,
  completed_booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  cancelled_at TIMESTAMPTZ,
  CONSTRAINT walkin_checkout_after_checkin CHECK (check_out_date > check_in_date)
);

ALTER TABLE public.walkin_checkin_drafts
  ADD COLUMN IF NOT EXISTS assigned_operator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.walkin_checkin_drafts
  ADD COLUMN IF NOT EXISTS taken_over_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.walkin_checkin_drafts
  ADD COLUMN IF NOT EXISTS taken_over_at TIMESTAMPTZ;

UPDATE public.walkin_checkin_drafts
SET assigned_operator_id = created_by
WHERE assigned_operator_id IS NULL;

ALTER TABLE public.walkin_checkin_drafts
  ALTER COLUMN assigned_operator_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'walkin_checkin_drafts_assigned_operator_id_fkey'
      AND conrelid = 'public.walkin_checkin_drafts'::regclass
  ) THEN
    ALTER TABLE public.walkin_checkin_drafts
      ADD CONSTRAINT walkin_checkin_drafts_assigned_operator_id_fkey
      FOREIGN KEY (assigned_operator_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_walkin_drafts_hotel_status_updated
  ON public.walkin_checkin_drafts(hotel_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_walkin_drafts_hotel_guest_category
  ON public.walkin_checkin_drafts(hotel_id, guest_category, status);
CREATE INDEX IF NOT EXISTS idx_walkin_drafts_hotel_primary_phone
  ON public.walkin_checkin_drafts(hotel_id, primary_phone);
CREATE INDEX IF NOT EXISTS idx_walkin_drafts_hotel_primary_guest_name
  ON public.walkin_checkin_drafts(hotel_id, primary_guest_name);
CREATE INDEX IF NOT EXISTS idx_walkin_drafts_hotel_document_status
  ON public.walkin_checkin_drafts(hotel_id, document_status);
CREATE INDEX IF NOT EXISTS idx_walkin_drafts_assigned_operator
  ON public.walkin_checkin_drafts(assigned_operator_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.room_holds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  draft_id UUID NOT NULL REFERENCES public.walkin_checkin_drafts(id) ON DELETE CASCADE,
  held_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'consumed', 'expired', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_room_holds_active_room
  ON public.room_holds(room_id)
  WHERE status = 'active';

CREATE UNIQUE INDEX IF NOT EXISTS idx_room_holds_active_draft
  ON public.room_holds(draft_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_room_holds_hotel_expires
  ON public.room_holds(hotel_id, expires_at);

CREATE TABLE IF NOT EXISTS public.booking_companions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  temp_key TEXT,
  full_name TEXT NOT NULL,
  relationship TEXT,
  nationality TEXT,
  guest_category TEXT CHECK (guest_category IN ('domestic', 'foreign')),
  document_type TEXT,
  document_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_booking_companions_booking_id
  ON public.booking_companions(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_companions_hotel_id
  ON public.booking_companions(hotel_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.guest_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  draft_id UUID REFERENCES public.walkin_checkin_drafts(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES public.guests(id) ON DELETE SET NULL,
  companion_id UUID REFERENCES public.booking_companions(id) ON DELETE SET NULL,
  subject_kind TEXT NOT NULL CHECK (subject_kind IN ('primary_guest', 'companion')),
  subject_temp_key TEXT,
  document_type TEXT NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT FALSE,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  checksum TEXT,
  document_number TEXT,
  issued_country TEXT,
  uploaded_via TEXT NOT NULL DEFAULT 'frontdesk' CHECK (uploaded_via IN ('frontdesk')),
  verification_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  CONSTRAINT guest_documents_subject_ref CHECK (
    (
      subject_kind = 'primary_guest'
      AND companion_id IS NULL
    )
    OR (
      subject_kind = 'companion'
      AND (subject_temp_key IS NOT NULL OR companion_id IS NOT NULL)
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_guest_documents_draft
  ON public.guest_documents(draft_id, subject_kind, document_type);
CREATE INDEX IF NOT EXISTS idx_guest_documents_booking
  ON public.guest_documents(booking_id, subject_kind, document_type);
CREATE INDEX IF NOT EXISTS idx_guest_documents_hotel_uploaded
  ON public.guest_documents(hotel_id, uploaded_at DESC);

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS booking_code TEXT,
  ADD COLUMN IF NOT EXISTS booking_source TEXT CHECK (booking_source IN ('web', 'frontdesk_walkin', 'phone', 'manual')),
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS frontdesk_notes TEXT,
  ADD COLUMN IF NOT EXISTS source_draft_id UUID REFERENCES public.walkin_checkin_drafts(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_booking_code_unique
  ON public.bookings(booking_code)
  WHERE booking_code IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_source_draft_unique
  ON public.bookings(source_draft_id)
  WHERE source_draft_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_checkins_booking_unique
  ON public.checkins(booking_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_checkouts_booking_unique
  ON public.checkouts(booking_id);

-- =============================================================================
-- 4. TIMESTAMP / DOCUMENT STATUS TRIGGERS
-- =============================================================================

CREATE OR REPLACE FUNCTION public.touch_walkin_checkin_draft()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  NEW.last_activity_at = now();
  NEW.revision = COALESCE(OLD.revision, 0) + 1;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS walkin_checkin_drafts_touch ON public.walkin_checkin_drafts;
CREATE TRIGGER walkin_checkin_drafts_touch
  BEFORE UPDATE ON public.walkin_checkin_drafts
  FOR EACH ROW EXECUTE FUNCTION public.touch_walkin_checkin_draft();

CREATE OR REPLACE FUNCTION public.sync_walkin_draft_document_status(p_draft_id UUID)
RETURNS public.walkin_checkin_drafts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_draft public.walkin_checkin_drafts%ROWTYPE;
  v_required TEXT[];
  v_uploaded TEXT[];
  v_status TEXT;
BEGIN
  SELECT *
  INTO v_draft
  FROM public.walkin_checkin_drafts
  WHERE id = p_draft_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Walk-in draft not found';
  END IF;

  v_required := public.required_walkin_document_types(v_draft.guest_category, v_draft.guest_payload);

  SELECT COALESCE(array_agg(DISTINCT gd.document_type), ARRAY[]::TEXT[])
  INTO v_uploaded
  FROM public.guest_documents gd
  WHERE gd.draft_id = p_draft_id
    AND gd.subject_kind = 'primary_guest';

  IF COALESCE(array_length(v_uploaded, 1), 0) = 0 THEN
    v_status := 'missing';
  ELSIF v_required <@ v_uploaded THEN
    v_status := 'complete';
  ELSE
    v_status := 'partial';
  END IF;

  UPDATE public.walkin_checkin_drafts
  SET
    document_status = v_status,
    status = CASE
      WHEN status IN ('completed', 'cancelled', 'expired') THEN status
      WHEN assigned_room_id IS NULL THEN 'draft'
      WHEN v_status = 'complete' THEN 'ready'
      WHEN v_status = 'partial' THEN 'docs_pending'
      ELSE 'room_held'
    END
  WHERE id = p_draft_id
  RETURNING *
  INTO v_draft;

  RETURN v_draft;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_frontdesk_draft_queue(
  p_hotel_id UUID
)
RETURNS TABLE(
  id UUID,
  draft_code TEXT,
  hotel_id UUID,
  assigned_operator_id UUID,
  assigned_operator_name TEXT,
  assigned_room_id UUID,
  room_number TEXT,
  status TEXT,
  guest_category TEXT,
  primary_guest_name TEXT,
  primary_phone TEXT,
  document_status TEXT,
  hold_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  is_owner BOOLEAN,
  can_take_over BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.current_user_can_operate_frontdesk(p_hotel_id) THEN
    RAISE EXCEPTION 'Not authorized for this hotel';
  END IF;

  PERFORM public.expire_stale_walkin_drafts();

  RETURN QUERY
  SELECT
    d.id,
    d.draft_code,
    d.hotel_id,
    d.assigned_operator_id,
    COALESCE(NULLIF(TRIM(CONCAT_WS(' ', p.first_name, p.last_name)), ''), p.email, 'Assigned operator') AS assigned_operator_name,
    d.assigned_room_id,
    r.room_number,
    d.status,
    d.guest_category,
    d.primary_guest_name,
    d.primary_phone,
    d.document_status,
    d.hold_expires_at,
    d.created_at,
    d.updated_at,
    d.assigned_operator_id = auth.uid() AS is_owner,
    d.status NOT IN ('completed', 'cancelled', 'expired') AND d.assigned_operator_id <> auth.uid() AS can_take_over
  FROM public.walkin_checkin_drafts d
  LEFT JOIN public.rooms r ON r.id = d.assigned_room_id
  LEFT JOIN public.profiles p ON p.id = d.assigned_operator_id
  WHERE d.hotel_id = p_hotel_id
  ORDER BY d.updated_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.search_frontdesk_guest_matches(
  p_hotel_id UUID,
  p_query TEXT
)
RETURNS TABLE(
  guest_id UUID,
  full_name TEXT,
  email TEXT,
  nationality TEXT,
  phone TEXT,
  passport_number TEXT,
  id_type TEXT,
  id_number TEXT,
  match_type TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_query TEXT := LOWER(TRIM(COALESCE(p_query, '')));
BEGIN
  IF NOT public.current_user_can_operate_frontdesk(p_hotel_id) THEN
    RAISE EXCEPTION 'Not authorized for this hotel';
  END IF;

  IF LENGTH(v_query) < 3 THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH hotel_guests AS (
    SELECT DISTINCT g.id, g.first_name, g.last_name, g.email, g.nationality, g.passport_number, g.id_type, g.id_number
    FROM public.bookings b
    INNER JOIN public.guests g ON g.id = b.guest_id
    WHERE b.hotel_id = p_hotel_id
  ),
  ranked AS (
    SELECT
      hg.id AS guest_id,
      COALESCE(NULLIF(TRIM(CONCAT_WS(' ', hg.first_name, hg.last_name)), ''), 'Guest') AS full_name,
      hg.email,
      hg.nationality,
      gc.phone_number AS phone,
      hg.passport_number,
      hg.id_type,
      hg.id_number,
      CASE
        WHEN LOWER(COALESCE(hg.email, '')) = v_query
          OR LOWER(COALESCE(hg.passport_number, '')) = v_query
          OR LOWER(COALESCE(hg.id_number, '')) = v_query
          OR LOWER(COALESCE(gc.phone_number, '')) = v_query
        THEN 'exact'
        ELSE 'similar'
      END AS match_type,
      ROW_NUMBER() OVER (
        PARTITION BY hg.id
        ORDER BY
          CASE
            WHEN LOWER(COALESCE(hg.email, '')) = v_query
              OR LOWER(COALESCE(hg.passport_number, '')) = v_query
              OR LOWER(COALESCE(hg.id_number, '')) = v_query
              OR LOWER(COALESCE(gc.phone_number, '')) = v_query
            THEN 0 ELSE 1
          END,
          gc.created_at DESC NULLS LAST
      ) AS row_num
    FROM hotel_guests hg
    LEFT JOIN public.guest_contacts gc
      ON gc.guest_id = hg.id
     AND gc.contact_type = 'phone'
    WHERE
      LOWER(COALESCE(hg.first_name, '')) LIKE '%' || v_query || '%'
      OR LOWER(COALESCE(hg.last_name, '')) LIKE '%' || v_query || '%'
      OR LOWER(COALESCE(hg.email, '')) LIKE '%' || v_query || '%'
      OR LOWER(COALESCE(hg.passport_number, '')) LIKE '%' || v_query || '%'
      OR LOWER(COALESCE(hg.id_number, '')) LIKE '%' || v_query || '%'
      OR LOWER(COALESCE(gc.phone_number, '')) LIKE '%' || v_query || '%'
  )
  SELECT
    r.guest_id,
    r.full_name,
    r.email,
    r.nationality,
    r.phone,
    r.passport_number,
    r.id_type,
    r.id_number,
    r.match_type
  FROM ranked r
  WHERE r.row_num = 1
  ORDER BY CASE WHEN r.match_type = 'exact' THEN 0 ELSE 1 END, r.full_name
  LIMIT 10;
END;
$$;

CREATE OR REPLACE FUNCTION public.guest_documents_sync_walkin_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_draft_id UUID;
BEGIN
  v_draft_id := COALESCE(NEW.draft_id, OLD.draft_id);
  IF v_draft_id IS NOT NULL THEN
    PERFORM public.sync_walkin_draft_document_status(v_draft_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS guest_documents_sync_walkin_insert ON public.guest_documents;
CREATE TRIGGER guest_documents_sync_walkin_insert
  AFTER INSERT ON public.guest_documents
  FOR EACH ROW EXECUTE FUNCTION public.guest_documents_sync_walkin_status();

DROP TRIGGER IF EXISTS guest_documents_sync_walkin_update ON public.guest_documents;
CREATE TRIGGER guest_documents_sync_walkin_update
  AFTER UPDATE ON public.guest_documents
  FOR EACH ROW EXECUTE FUNCTION public.guest_documents_sync_walkin_status();

DROP TRIGGER IF EXISTS guest_documents_sync_walkin_delete ON public.guest_documents;
CREATE TRIGGER guest_documents_sync_walkin_delete
  AFTER DELETE ON public.guest_documents
  FOR EACH ROW EXECUTE FUNCTION public.guest_documents_sync_walkin_status();

CREATE OR REPLACE FUNCTION public.expire_walkin_room_holds(p_hotel_id UUID DEFAULT NULL)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  WITH expired AS (
    UPDATE public.room_holds rh
    SET status = 'expired'
    WHERE rh.status = 'active'
      AND rh.expires_at <= now()
      AND (p_hotel_id IS NULL OR rh.hotel_id = p_hotel_id)
    RETURNING rh.draft_id
  )
  UPDATE public.walkin_checkin_drafts d
  SET
    assigned_room_id = NULL,
    hold_expires_at = NULL,
    status = CASE
      WHEN d.status IN ('completed', 'cancelled', 'expired') THEN d.status
      ELSE 'draft'
    END
  WHERE d.id IN (SELECT DISTINCT draft_id FROM expired)
    AND d.status NOT IN ('completed', 'cancelled', 'expired');

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.expire_stale_walkin_drafts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  PERFORM public.expire_walkin_room_holds();

  UPDATE public.walkin_checkin_drafts
  SET
    status = 'expired',
    cancelled_at = COALESCE(cancelled_at, now()),
    hold_expires_at = NULL,
    assigned_room_id = NULL
  WHERE status NOT IN ('completed', 'cancelled', 'expired')
    AND last_activity_at <= now() - INTERVAL '30 minutes';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- =============================================================================
-- 5. FRONT-DESK RPCS
-- =============================================================================

CREATE OR REPLACE FUNCTION public.hold_room_for_walkin(
  p_draft_id UUID,
  p_room_id UUID
)
RETURNS TABLE(
  hold_id UUID,
  hold_expires_at TIMESTAMPTZ,
  effective_room_state TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_draft public.walkin_checkin_drafts%ROWTYPE;
  v_room public.rooms%ROWTYPE;
  v_existing_hold public.room_holds%ROWTYPE;
  v_required_hold public.room_holds%ROWTYPE;
  v_cancelled_other_hold BOOLEAN := FALSE;
BEGIN
  SELECT *
  INTO v_draft
  FROM public.walkin_checkin_drafts
  WHERE id = p_draft_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Walk-in draft not found';
  END IF;

  IF NOT public.current_user_can_operate_frontdesk(v_draft.hotel_id) THEN
    RAISE EXCEPTION 'Not authorized for this hotel';
  END IF;

  IF v_draft.assigned_operator_id <> auth.uid() THEN
    RAISE EXCEPTION 'Take over this draft before editing it';
  END IF;

  IF v_draft.status IN ('completed', 'cancelled', 'expired') THEN
    RAISE EXCEPTION 'This draft cannot be edited';
  END IF;

  PERFORM public.expire_walkin_room_holds(v_draft.hotel_id);

  SELECT *
  INTO v_room
  FROM public.rooms
  WHERE id = p_room_id
    AND deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Room not found';
  END IF;

  IF v_room.hotel_id <> v_draft.hotel_id THEN
    RAISE EXCEPTION 'Room does not belong to the selected hotel';
  END IF;

  IF v_room.status <> 'available' THEN
    RAISE EXCEPTION 'Room is not available';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.bookings b
    WHERE b.room_id = v_room.id
      AND b.status IN ('confirmed', 'checked_in')
      AND b.stay_period && daterange(v_draft.check_in_date, v_draft.check_out_date, '[)')
  ) THEN
    RAISE EXCEPTION 'Room already has an active stay for the selected dates';
  END IF;

  SELECT *
  INTO v_existing_hold
  FROM public.room_holds
  WHERE room_id = p_room_id
    AND status = 'active'
  FOR UPDATE;

  IF FOUND AND v_existing_hold.draft_id <> p_draft_id THEN
    RAISE EXCEPTION 'Room is currently held by another front-desk user';
  END IF;

  UPDATE public.room_holds
  SET status = 'cancelled'
  WHERE draft_id = p_draft_id
    AND status = 'active'
    AND room_id <> p_room_id;

  v_cancelled_other_hold := FOUND;

  IF v_cancelled_other_hold THEN
    UPDATE public.walkin_checkin_drafts
    SET assigned_room_id = NULL, hold_expires_at = NULL, status = 'draft'
    WHERE id = p_draft_id
      AND status NOT IN ('completed', 'cancelled', 'expired');
  END IF;

  IF v_existing_hold.id IS NOT NULL AND v_existing_hold.draft_id = p_draft_id THEN
    UPDATE public.room_holds
    SET expires_at = now() + INTERVAL '3 minutes', held_by = auth.uid()
    WHERE id = v_existing_hold.id
    RETURNING * INTO v_required_hold;
  ELSE
    INSERT INTO public.room_holds (hotel_id, room_id, draft_id, held_by, expires_at, status)
    VALUES (v_draft.hotel_id, p_room_id, p_draft_id, auth.uid(), now() + INTERVAL '3 minutes', 'active')
    RETURNING * INTO v_required_hold;
  END IF;

  UPDATE public.walkin_checkin_drafts
  SET
    assigned_room_id = p_room_id,
    hold_expires_at = v_required_hold.expires_at,
    status = CASE
      WHEN document_status = 'complete' THEN 'ready'
      ELSE 'room_held'
    END
  WHERE id = p_draft_id;

  RETURN QUERY
  SELECT v_required_hold.id, v_required_hold.expires_at, 'held_self'::TEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_walkin_room_hold(
  p_draft_id UUID
)
RETURNS TABLE(
  released BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_draft public.walkin_checkin_drafts%ROWTYPE;
BEGIN
  SELECT *
  INTO v_draft
  FROM public.walkin_checkin_drafts
  WHERE id = p_draft_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Walk-in draft not found';
  END IF;

  IF NOT public.current_user_can_operate_frontdesk(v_draft.hotel_id) THEN
    RAISE EXCEPTION 'Not authorized for this hotel';
  END IF;

  IF v_draft.assigned_operator_id <> auth.uid() THEN
    RAISE EXCEPTION 'Take over this draft before releasing its room hold';
  END IF;

  UPDATE public.room_holds
  SET status = 'cancelled'
  WHERE draft_id = p_draft_id
    AND status = 'active';

  UPDATE public.walkin_checkin_drafts
  SET
    assigned_room_id = NULL,
    hold_expires_at = NULL,
    status = 'draft'
  WHERE id = p_draft_id
    AND status NOT IN ('completed', 'cancelled', 'expired');

  RETURN QUERY SELECT TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.preflight_walkin_checkin(
  p_draft_id UUID
)
RETURNS TABLE(
  can_finalize BOOLEAN,
  blockers TEXT[],
  hold_expires_at TIMESTAMPTZ,
  effective_room_state TEXT,
  document_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_draft public.walkin_checkin_drafts%ROWTYPE;
  v_room public.rooms%ROWTYPE;
  v_hold public.room_holds%ROWTYPE;
  v_blockers TEXT[] := ARRAY[]::TEXT[];
  v_effective TEXT := 'unassigned';
BEGIN
  SELECT *
  INTO v_draft
  FROM public.walkin_checkin_drafts
  WHERE id = p_draft_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Walk-in draft not found';
  END IF;

  IF NOT public.current_user_can_operate_frontdesk(v_draft.hotel_id) THEN
    RAISE EXCEPTION 'Not authorized for this hotel';
  END IF;

  IF v_draft.assigned_operator_id <> auth.uid() THEN
    RAISE EXCEPTION 'Take over this draft before validating it';
  END IF;

  PERFORM public.expire_walkin_room_holds(v_draft.hotel_id);
  SELECT * INTO v_draft FROM public.sync_walkin_draft_document_status(p_draft_id);

  IF v_draft.assigned_room_id IS NULL THEN
    v_blockers := array_append(v_blockers, 'Select an available room');
  ELSE
    SELECT *
    INTO v_room
    FROM public.rooms
    WHERE id = v_draft.assigned_room_id
      AND deleted_at IS NULL;

    IF NOT FOUND THEN
      v_blockers := array_append(v_blockers, 'Assigned room no longer exists');
    ELSE
      IF v_room.status <> 'available' THEN
        v_blockers := array_append(v_blockers, 'Assigned room is no longer available');
      END IF;

      SELECT *
      INTO v_hold
      FROM public.room_holds
      WHERE draft_id = p_draft_id
        AND room_id = v_room.id
        AND status = 'active'
        AND expires_at > now();

      IF NOT FOUND THEN
        v_blockers := array_append(v_blockers, 'Room hold has expired');
        v_effective := CASE
          WHEN v_room.status = 'occupied' THEN 'occupied'
          WHEN v_room.status = 'maintenance' THEN 'maintenance'
          WHEN v_room.status = 'cleaning' THEN 'cleaning'
          ELSE 'available'
        END;
      ELSE
        v_effective := 'held_self';
      END IF;

      IF EXISTS (
        SELECT 1
        FROM public.bookings b
        WHERE b.room_id = v_room.id
          AND b.status IN ('confirmed', 'checked_in')
          AND b.stay_period && daterange(v_draft.check_in_date, v_draft.check_out_date, '[)')
      ) THEN
        v_blockers := array_append(v_blockers, 'Room already has an active stay for the selected dates');
      END IF;
    END IF;
  END IF;

  IF v_draft.document_status <> 'complete' THEN
    v_blockers := array_append(v_blockers, 'Upload the required identity documents');
  END IF;

  RETURN QUERY
  SELECT
    COALESCE(array_length(v_blockers, 1), 0) = 0,
    v_blockers,
    v_draft.hold_expires_at,
    v_effective,
    v_draft.document_status;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_walkin_draft(
  p_draft_id UUID
)
RETURNS TABLE(
  draft_id UUID,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_draft public.walkin_checkin_drafts%ROWTYPE;
BEGIN
  SELECT *
  INTO v_draft
  FROM public.walkin_checkin_drafts
  WHERE id = p_draft_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Walk-in draft not found';
  END IF;

  IF NOT public.current_user_can_operate_frontdesk(v_draft.hotel_id) THEN
    RAISE EXCEPTION 'Not authorized for this hotel';
  END IF;

  IF v_draft.assigned_operator_id <> auth.uid() THEN
    RAISE EXCEPTION 'Take over this draft before cancelling it';
  END IF;

  IF v_draft.status = 'completed' THEN
    RAISE EXCEPTION 'Completed drafts cannot be cancelled';
  END IF;

  UPDATE public.room_holds
  SET status = 'cancelled'
  WHERE draft_id = p_draft_id
    AND status = 'active';

  UPDATE public.walkin_checkin_drafts
  SET
    status = 'cancelled',
    cancelled_at = now(),
    assigned_room_id = NULL,
    hold_expires_at = NULL
  WHERE id = p_draft_id
  RETURNING id, status INTO v_draft.id, v_draft.status;

  RETURN QUERY SELECT v_draft.id, v_draft.status;
END;
$$;

CREATE OR REPLACE FUNCTION public.take_over_walkin_draft(
  p_draft_id UUID
)
RETURNS TABLE(
  draft_id UUID,
  assigned_operator_id UUID,
  hold_expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_draft public.walkin_checkin_drafts%ROWTYPE;
BEGIN
  SELECT *
  INTO v_draft
  FROM public.walkin_checkin_drafts
  WHERE id = p_draft_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Walk-in draft not found';
  END IF;

  IF NOT public.current_user_can_operate_frontdesk(v_draft.hotel_id) THEN
    RAISE EXCEPTION 'Not authorized for this hotel';
  END IF;

  IF v_draft.status IN ('completed', 'cancelled', 'expired') THEN
    RAISE EXCEPTION 'This draft cannot be taken over';
  END IF;

  IF v_draft.assigned_operator_id = auth.uid() THEN
    RETURN QUERY SELECT v_draft.id, v_draft.assigned_operator_id, v_draft.hold_expires_at;
    RETURN;
  END IF;

  UPDATE public.walkin_checkin_drafts
  SET
    assigned_operator_id = auth.uid(),
    taken_over_by = auth.uid(),
    taken_over_at = now()
  WHERE id = p_draft_id
  RETURNING * INTO v_draft;

  UPDATE public.room_holds
  SET held_by = auth.uid()
  WHERE draft_id = p_draft_id
    AND status = 'active';

  INSERT INTO public.audit_logs (user_id, action, entity, entity_id, details)
  VALUES (auth.uid(), 'WALKIN_DRAFT_TAKEN_OVER', 'walkin_checkin_draft', p_draft_id, 'Draft ownership transferred to current operator');

  RETURN QUERY SELECT v_draft.id, v_draft.assigned_operator_id, v_draft.hold_expires_at;
END;
$$;

DROP FUNCTION IF EXISTS public.finalize_walkin_checkin(UUID);
CREATE OR REPLACE FUNCTION public.finalize_walkin_checkin(
  p_draft_id UUID
)
RETURNS TABLE(
  result_type TEXT,
  booking_id UUID,
  booking_code TEXT,
  guest_id UUID,
  room_id UUID,
  room_number TEXT,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_draft public.walkin_checkin_drafts%ROWTYPE;
  v_room public.rooms%ROWTYPE;
  v_hold public.room_holds%ROWTYPE;
  v_booking public.bookings%ROWTYPE;
  v_guest_id UUID;
  v_guest_first_name TEXT;
  v_guest_last_name TEXT;
  v_guest_email TEXT;
  v_guest_phone TEXT;
  v_country_code TEXT;
  v_guest_contact_id UUID;
  v_companion JSONB;
  v_companion_id UUID;
BEGIN
  SELECT *
  INTO v_draft
  FROM public.walkin_checkin_drafts
  WHERE id = p_draft_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Walk-in draft not found';
  END IF;

  IF v_draft.completed_booking_id IS NOT NULL THEN
    RETURN QUERY
    SELECT
      'already_completed'::TEXT,
      b.id,
      b.booking_code,
      b.guest_id,
      b.room_id,
      r.room_number,
      b.status
    FROM public.bookings b
    INNER JOIN public.rooms r ON r.id = b.room_id
    WHERE b.id = v_draft.completed_booking_id;
    RETURN;
  END IF;

  SELECT *
  INTO v_booking
  FROM public.bookings
  WHERE source_draft_id = p_draft_id
  LIMIT 1;

  IF v_booking.id IS NOT NULL THEN
    UPDATE public.walkin_checkin_drafts
    SET completed_booking_id = v_booking.id,
        status = 'completed',
        hold_expires_at = NULL
    WHERE id = p_draft_id;

    RETURN QUERY
    SELECT
      'already_completed'::TEXT,
      v_booking.id,
      v_booking.booking_code,
      v_booking.guest_id,
      v_booking.room_id,
      r.room_number,
      v_booking.status
    FROM public.rooms r
    WHERE r.id = v_booking.room_id;
    RETURN;
  END IF;

  IF NOT public.current_user_can_operate_frontdesk(v_draft.hotel_id) THEN
    RAISE EXCEPTION 'Not authorized for this hotel';
  END IF;

  IF v_draft.assigned_operator_id <> auth.uid() THEN
    RAISE EXCEPTION 'Take over this draft before finalizing it';
  END IF;

  PERFORM public.expire_walkin_room_holds(v_draft.hotel_id);
  SELECT * INTO v_draft FROM public.sync_walkin_draft_document_status(p_draft_id);

  IF v_draft.assigned_room_id IS NULL THEN
    RAISE EXCEPTION 'A room must be assigned before check-in';
  END IF;

  SELECT *
  INTO v_room
  FROM public.rooms
  WHERE id = v_draft.assigned_room_id
    AND deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assigned room was not found';
  END IF;

  SELECT *
  INTO v_hold
  FROM public.room_holds
  WHERE draft_id = p_draft_id
    AND room_id = v_room.id
    AND status = 'active'
    AND expires_at > now()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Room hold expired. Select the room again.';
  END IF;

  IF v_room.hotel_id <> v_draft.hotel_id THEN
    RAISE EXCEPTION 'Assigned room no longer belongs to this hotel';
  END IF;

  IF v_room.status <> 'available' THEN
    RAISE EXCEPTION 'Assigned room is no longer available';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.bookings b
    WHERE b.room_id = v_room.id
      AND b.status IN ('confirmed', 'checked_in')
      AND b.stay_period && daterange(v_draft.check_in_date, v_draft.check_out_date, '[)')
  ) THEN
    RAISE EXCEPTION 'Assigned room already has an active stay';
  END IF;

  IF v_draft.document_status <> 'complete' THEN
    RAISE EXCEPTION 'Required identity documents must be uploaded before check-in';
  END IF;

  v_guest_first_name := COALESCE(NULLIF(TRIM(v_draft.guest_payload ->> 'first_name'), ''), 'Guest');
  v_guest_last_name := NULLIF(TRIM(v_draft.guest_payload ->> 'last_name'), '');
  v_guest_email := NULLIF(TRIM(v_draft.guest_payload ->> 'email'), '');
  v_guest_phone := NULLIF(TRIM(v_draft.guest_payload ->> 'phone'), '');
  v_country_code := NULLIF(TRIM(v_draft.guest_payload ->> 'country_code'), '');

  IF v_draft.primary_guest_id IS NOT NULL THEN
    UPDATE public.guests
    SET
      first_name = v_guest_first_name,
      last_name = v_guest_last_name,
      email = v_guest_email,
      nationality = NULLIF(TRIM(v_draft.guest_payload ->> 'nationality'), ''),
      guest_category = v_draft.guest_category,
      address_line1 = NULLIF(TRIM(v_draft.guest_payload ->> 'address_line1'), ''),
      address_line2 = NULLIF(TRIM(v_draft.guest_payload ->> 'address_line2'), ''),
      city = NULLIF(TRIM(v_draft.guest_payload ->> 'city'), ''),
      state_region = NULLIF(TRIM(v_draft.guest_payload ->> 'state_region'), ''),
      country = NULLIF(TRIM(v_draft.guest_payload ->> 'country'), ''),
      postal_code = NULLIF(TRIM(v_draft.guest_payload ->> 'postal_code'), ''),
      id_type = NULLIF(TRIM(v_draft.guest_payload ->> 'id_type'), ''),
      id_number = NULLIF(TRIM(v_draft.guest_payload ->> 'id_number'), ''),
      passport_number = NULLIF(TRIM(v_draft.guest_payload ->> 'passport_number'), ''),
      passport_expiry_date = NULLIF(TRIM(v_draft.guest_payload ->> 'passport_expiry_date'), '')::DATE,
      passport_issued_country = NULLIF(TRIM(v_draft.guest_payload ->> 'passport_issued_country'), ''),
      visa_type = NULLIF(TRIM(v_draft.guest_payload ->> 'visa_type'), ''),
      visa_expiry_date = NULLIF(TRIM(v_draft.guest_payload ->> 'visa_expiry_date'), '')::DATE,
      preferred_language = NULLIF(TRIM(v_draft.guest_payload ->> 'preferred_language'), ''),
      notes = NULLIF(TRIM(v_draft.guest_payload ->> 'notes'), '')
    WHERE id = v_draft.primary_guest_id
    RETURNING id INTO v_guest_id;
  ELSE
    INSERT INTO public.guests (
      first_name,
      last_name,
      email,
      nationality,
      guest_category,
      address_line1,
      address_line2,
      city,
      state_region,
      country,
      postal_code,
      id_type,
      id_number,
      passport_number,
      passport_expiry_date,
      passport_issued_country,
      visa_type,
      visa_expiry_date,
      preferred_language,
      notes
    )
    VALUES (
      v_guest_first_name,
      v_guest_last_name,
      v_guest_email,
      NULLIF(TRIM(v_draft.guest_payload ->> 'nationality'), ''),
      v_draft.guest_category,
      NULLIF(TRIM(v_draft.guest_payload ->> 'address_line1'), ''),
      NULLIF(TRIM(v_draft.guest_payload ->> 'address_line2'), ''),
      NULLIF(TRIM(v_draft.guest_payload ->> 'city'), ''),
      NULLIF(TRIM(v_draft.guest_payload ->> 'state_region'), ''),
      NULLIF(TRIM(v_draft.guest_payload ->> 'country'), ''),
      NULLIF(TRIM(v_draft.guest_payload ->> 'postal_code'), ''),
      NULLIF(TRIM(v_draft.guest_payload ->> 'id_type'), ''),
      NULLIF(TRIM(v_draft.guest_payload ->> 'id_number'), ''),
      NULLIF(TRIM(v_draft.guest_payload ->> 'passport_number'), ''),
      NULLIF(TRIM(v_draft.guest_payload ->> 'passport_expiry_date'), '')::DATE,
      NULLIF(TRIM(v_draft.guest_payload ->> 'passport_issued_country'), ''),
      NULLIF(TRIM(v_draft.guest_payload ->> 'visa_type'), ''),
      NULLIF(TRIM(v_draft.guest_payload ->> 'visa_expiry_date'), '')::DATE,
      NULLIF(TRIM(v_draft.guest_payload ->> 'preferred_language'), ''),
      NULLIF(TRIM(v_draft.guest_payload ->> 'notes'), '')
    )
    RETURNING id INTO v_guest_id;
  END IF;

  IF v_guest_phone IS NOT NULL THEN
    SELECT gc.id
    INTO v_guest_contact_id
    FROM public.guest_contacts gc
    WHERE gc.guest_id = v_guest_id
      AND gc.contact_type = 'phone'
    ORDER BY gc.created_at DESC
    LIMIT 1
    FOR UPDATE;

    IF v_guest_contact_id IS NOT NULL THEN
      UPDATE public.guest_contacts
      SET country_code = v_country_code,
          phone_number = v_guest_phone
      WHERE id = v_guest_contact_id;
    ELSE
      INSERT INTO public.guest_contacts (guest_id, contact_type, country_code, phone_number)
      VALUES (v_guest_id, 'phone', v_country_code, v_guest_phone);
    END IF;
  END IF;

  INSERT INTO public.bookings (
    hotel_id,
    room_id,
    guest_id,
    booker_id,
    check_in_date,
    check_out_date,
    status,
    total_price,
    booking_code,
    booking_source,
    created_by,
    frontdesk_notes,
    source_draft_id
  )
  VALUES (
    v_draft.hotel_id,
    v_room.id,
    v_guest_id,
    auth.uid(),
    v_draft.check_in_date,
    v_draft.check_out_date,
    'checked_in',
    NULL,
    public.generate_frontdesk_booking_code(),
    'frontdesk_walkin',
    auth.uid(),
    NULLIF(TRIM(v_draft.guest_payload ->> 'notes'), ''),
    p_draft_id
  )
  RETURNING * INTO v_booking;

  FOR v_companion IN
    SELECT value
    FROM jsonb_array_elements(COALESCE(v_draft.companions_payload, '[]'::JSONB))
  LOOP
    INSERT INTO public.booking_companions (
      hotel_id,
      booking_id,
      temp_key,
      full_name,
      relationship,
      nationality,
      guest_category,
      document_type,
      document_number
    )
    VALUES (
      v_draft.hotel_id,
      v_booking.id,
      NULLIF(TRIM(v_companion ->> 'temp_key'), ''),
      COALESCE(NULLIF(TRIM(v_companion ->> 'full_name'), ''), 'Companion'),
      NULLIF(TRIM(v_companion ->> 'relationship'), ''),
      NULLIF(TRIM(v_companion ->> 'nationality'), ''),
      NULLIF(TRIM(v_companion ->> 'guest_category'), ''),
      NULLIF(TRIM(v_companion ->> 'document_type'), ''),
      NULLIF(TRIM(v_companion ->> 'document_number'), '')
    )
    RETURNING id INTO v_companion_id;

    UPDATE public.guest_documents
    SET booking_id = v_booking.id, companion_id = v_companion_id
    WHERE draft_id = p_draft_id
      AND subject_kind = 'companion'
      AND subject_temp_key = NULLIF(TRIM(v_companion ->> 'temp_key'), '');
  END LOOP;

  INSERT INTO public.checkins (booking_id, checked_in_by)
  VALUES (v_booking.id, auth.uid())
  ON CONFLICT (booking_id) DO NOTHING;

  UPDATE public.guest_documents
  SET booking_id = v_booking.id, guest_id = v_guest_id
  WHERE draft_id = p_draft_id
    AND subject_kind = 'primary_guest';

  UPDATE public.rooms
  SET status = 'occupied'
  WHERE id = v_room.id;

  UPDATE public.room_holds
  SET status = 'consumed'
  WHERE id = v_hold.id;

  UPDATE public.walkin_checkin_drafts
  SET
    status = 'completed',
    primary_guest_id = v_guest_id,
    completed_booking_id = v_booking.id,
    hold_expires_at = NULL
  WHERE id = p_draft_id;

  INSERT INTO public.audit_logs (user_id, action, entity, entity_id)
  VALUES (auth.uid(), 'WALKIN_CHECKIN_FINALIZED', 'booking', v_booking.id);

  RETURN QUERY
  SELECT
    'created'::TEXT,
    v_booking.id,
    v_booking.booking_code,
    v_guest_id,
    v_room.id,
    v_room.room_number,
    v_booking.status;
END;
$$;

-- =============================================================================
-- 6. TABLE PERMISSIONS / RLS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.walkin_checkin_drafts TO authenticated;
GRANT SELECT ON public.room_holds TO authenticated;
GRANT SELECT ON public.booking_companions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guest_documents TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_frontdesk_draft_queue(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_frontdesk_guest_matches(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.hold_room_for_walkin(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.release_walkin_room_hold(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.preflight_walkin_checkin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_walkin_draft(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.take_over_walkin_draft(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_walkin_checkin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.expire_stale_walkin_drafts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.expire_walkin_room_holds(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_walkin_draft_document_status(UUID) TO authenticated;

ALTER TABLE public.walkin_checkin_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_companions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "walkin_drafts_frontdesk_select" ON public.walkin_checkin_drafts;
CREATE POLICY "walkin_drafts_frontdesk_select"
  ON public.walkin_checkin_drafts FOR SELECT
  TO authenticated
  USING (assigned_operator_id = auth.uid());

DROP POLICY IF EXISTS "walkin_drafts_frontdesk_insert" ON public.walkin_checkin_drafts;
CREATE POLICY "walkin_drafts_frontdesk_insert"
  ON public.walkin_checkin_drafts FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND assigned_operator_id = auth.uid()
    AND public.current_user_can_operate_frontdesk(hotel_id)
  );

DROP POLICY IF EXISTS "walkin_drafts_frontdesk_update" ON public.walkin_checkin_drafts;
CREATE POLICY "walkin_drafts_frontdesk_update"
  ON public.walkin_checkin_drafts FOR UPDATE
  TO authenticated
  USING (assigned_operator_id = auth.uid())
  WITH CHECK (
    assigned_operator_id = auth.uid()
    AND public.current_user_can_operate_frontdesk(hotel_id)
  );

DROP POLICY IF EXISTS "walkin_drafts_frontdesk_delete" ON public.walkin_checkin_drafts;
CREATE POLICY "walkin_drafts_frontdesk_delete"
  ON public.walkin_checkin_drafts FOR DELETE
  TO authenticated
  USING (assigned_operator_id = auth.uid());

DROP POLICY IF EXISTS "room_holds_frontdesk_select" ON public.room_holds;
CREATE POLICY "room_holds_frontdesk_select"
  ON public.room_holds FOR SELECT
  TO authenticated
  USING (public.current_user_can_operate_frontdesk(hotel_id));

DROP POLICY IF EXISTS "booking_companions_frontdesk_select" ON public.booking_companions;
CREATE POLICY "booking_companions_frontdesk_select"
  ON public.booking_companions FOR SELECT
  TO authenticated
  USING (public.current_user_can_operate_frontdesk(hotel_id));

DROP POLICY IF EXISTS "guest_documents_frontdesk_select" ON public.guest_documents;
CREATE POLICY "guest_documents_frontdesk_select"
  ON public.guest_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.walkin_checkin_drafts d
      WHERE d.id = guest_documents.draft_id
        AND d.assigned_operator_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "guest_documents_frontdesk_insert" ON public.guest_documents;
CREATE POLICY "guest_documents_frontdesk_insert"
  ON public.guest_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.walkin_checkin_drafts d
      WHERE d.id = guest_documents.draft_id
        AND d.assigned_operator_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "guest_documents_frontdesk_update" ON public.guest_documents;
CREATE POLICY "guest_documents_frontdesk_update"
  ON public.guest_documents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.walkin_checkin_drafts d
      WHERE d.id = guest_documents.draft_id
        AND d.assigned_operator_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.walkin_checkin_drafts d
      WHERE d.id = guest_documents.draft_id
        AND d.assigned_operator_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "guest_documents_frontdesk_delete" ON public.guest_documents;
CREATE POLICY "guest_documents_frontdesk_delete"
  ON public.guest_documents FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.walkin_checkin_drafts d
      WHERE d.id = guest_documents.draft_id
        AND d.assigned_operator_id = auth.uid()
    )
  );

-- =============================================================================
-- 7. STORAGE BUCKET / POLICIES
-- =============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'guest-documents',
  'guest-documents',
  FALSE,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "guest_documents_frontdesk_insert" ON storage.objects;
CREATE POLICY "guest_documents_frontdesk_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'guest-documents'
    AND public.current_user_can_access_guest_document_path(name)
  );

DROP POLICY IF EXISTS "guest_documents_frontdesk_select" ON storage.objects;
CREATE POLICY "guest_documents_frontdesk_select"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'guest-documents'
    AND public.current_user_can_access_guest_document_path(name)
  );

DROP POLICY IF EXISTS "guest_documents_frontdesk_update" ON storage.objects;
CREATE POLICY "guest_documents_frontdesk_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'guest-documents'
    AND public.current_user_can_access_guest_document_path(name)
  )
  WITH CHECK (
    bucket_id = 'guest-documents'
    AND public.current_user_can_access_guest_document_path(name)
  );

DROP POLICY IF EXISTS "guest_documents_frontdesk_delete" ON storage.objects;
CREATE POLICY "guest_documents_frontdesk_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'guest-documents'
    AND public.current_user_can_access_guest_document_path(name)
  );
