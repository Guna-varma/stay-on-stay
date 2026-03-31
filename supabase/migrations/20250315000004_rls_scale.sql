-- StayOnStay: RLS for scalable schema (user_contacts, room_types, rooms, guests, bookings, payments, etc.)
-- Run after 20250315000003_schema_scale.sql

-- =============================================================================
-- USER_CONTACTS: users manage their own contacts
-- =============================================================================
ALTER TABLE public.user_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_contacts_own_all"
  ON public.user_contacts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_contacts_admin_select"
  ON public.user_contacts FOR SELECT
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

-- =============================================================================
-- ROOM_TYPES: hotel owner and staff manage; admin all
-- =============================================================================
ALTER TABLE public.room_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "room_types_owner_all"
  ON public.room_types FOR ALL
  USING (EXISTS (SELECT 1 FROM public.hotels h WHERE h.id = room_types.hotel_id AND h.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.hotels h WHERE h.id = room_types.hotel_id AND h.owner_id = auth.uid()));

CREATE POLICY "room_types_staff_select"
  ON public.room_types FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.hotel_staff hs WHERE hs.hotel_id = room_types.hotel_id AND hs.user_id = auth.uid()));

CREATE POLICY "room_types_admin_all"
  ON public.room_types FOR ALL
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

-- =============================================================================
-- ROOMS: same as room_types
-- =============================================================================
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rooms_owner_all"
  ON public.rooms FOR ALL
  USING (EXISTS (SELECT 1 FROM public.hotels h WHERE h.id = rooms.hotel_id AND h.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.hotels h WHERE h.id = rooms.hotel_id AND h.owner_id = auth.uid()));

CREATE POLICY "rooms_staff_select"
  ON public.rooms FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.hotel_staff hs WHERE hs.hotel_id = rooms.hotel_id AND hs.user_id = auth.uid()));

CREATE POLICY "rooms_admin_all"
  ON public.rooms FOR ALL
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

-- =============================================================================
-- GUESTS: any authenticated user can insert (booking flow); staff/admin manage
-- =============================================================================
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "guests_insert_authenticated"
  ON public.guests FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "guests_select_staff_or_admin"
  ON public.guests FOR SELECT
  USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    OR EXISTS (
      SELECT 1 FROM public.bookings b
      JOIN public.hotels h ON h.id = b.hotel_id
      LEFT JOIN public.hotel_staff hs ON hs.hotel_id = h.id AND hs.user_id = auth.uid()
      WHERE b.guest_id = guests.id AND (h.owner_id = auth.uid() OR hs.user_id IS NOT NULL)
    )
    OR EXISTS (SELECT 1 FROM public.bookings b WHERE b.guest_id = guests.id AND b.booker_id = auth.uid())
  );

CREATE POLICY "guests_update_staff_or_admin"
  ON public.guests FOR UPDATE
  USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    OR EXISTS (
      SELECT 1 FROM public.bookings b
      JOIN public.hotels h ON h.id = b.hotel_id
      LEFT JOIN public.hotel_staff hs ON hs.hotel_id = h.id AND hs.user_id = auth.uid()
      WHERE b.guest_id = guests.id AND (h.owner_id = auth.uid() OR hs.user_id IS NOT NULL)
    )
  );

CREATE POLICY "guests_admin_delete"
  ON public.guests FOR DELETE
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

-- =============================================================================
-- GUEST_CONTACTS: same as guests (via guest_id)
-- =============================================================================
ALTER TABLE public.guest_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "guest_contacts_insert_authenticated"
  ON public.guest_contacts FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "guest_contacts_select_staff_or_admin"
  ON public.guest_contacts FOR SELECT
  USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    OR EXISTS (
      SELECT 1 FROM public.bookings b
      JOIN public.hotels h ON h.id = b.hotel_id
      LEFT JOIN public.hotel_staff hs ON hs.hotel_id = h.id AND hs.user_id = auth.uid()
      WHERE b.guest_id = guest_contacts.guest_id AND (h.owner_id = auth.uid() OR hs.user_id IS NOT NULL)
    )
    OR EXISTS (SELECT 1 FROM public.bookings b WHERE b.guest_id = guest_contacts.guest_id AND b.booker_id = auth.uid())
  );

CREATE POLICY "guest_contacts_update_staff_or_admin"
  ON public.guest_contacts FOR UPDATE
  USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    OR EXISTS (
      SELECT 1 FROM public.bookings b
      JOIN public.hotels h ON h.id = b.hotel_id
      LEFT JOIN public.hotel_staff hs ON hs.hotel_id = h.id AND hs.user_id = auth.uid()
      WHERE b.guest_id = guest_contacts.guest_id AND (h.owner_id = auth.uid() OR hs.user_id IS NOT NULL)
    )
  );

-- =============================================================================
-- BOOKINGS: hotel staff full access for their hotel; booker can read own; admin all
-- =============================================================================
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bookings_staff_all"
  ON public.bookings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.hotels h
      LEFT JOIN public.hotel_staff hs ON hs.hotel_id = h.id AND hs.user_id = auth.uid()
      WHERE h.id = bookings.hotel_id AND (h.owner_id = auth.uid() OR hs.user_id IS NOT NULL)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.hotels h
      LEFT JOIN public.hotel_staff hs ON hs.hotel_id = h.id AND hs.user_id = auth.uid()
      WHERE h.id = bookings.hotel_id AND (h.owner_id = auth.uid() OR hs.user_id IS NOT NULL)
    )
  );

CREATE POLICY "bookings_booker_select"
  ON public.bookings FOR SELECT
  USING (booker_id = auth.uid());

CREATE POLICY "bookings_booker_update_pending"
  ON public.bookings FOR UPDATE
  USING (booker_id = auth.uid() AND status = 'pending')
  WITH CHECK (booker_id = auth.uid());

CREATE POLICY "bookings_admin_all"
  ON public.bookings FOR ALL
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

-- =============================================================================
-- PAYMENTS: hotel staff (via booking) and admin
-- =============================================================================
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_staff_all"
  ON public.payments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      JOIN public.hotels h ON h.id = b.hotel_id
      LEFT JOIN public.hotel_staff hs ON hs.hotel_id = h.id AND hs.user_id = auth.uid()
      WHERE b.id = payments.booking_id AND (h.owner_id = auth.uid() OR hs.user_id IS NOT NULL)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings b
      JOIN public.hotels h ON h.id = b.hotel_id
      LEFT JOIN public.hotel_staff hs ON hs.hotel_id = h.id AND hs.user_id = auth.uid()
      WHERE b.id = payments.booking_id AND (h.owner_id = auth.uid() OR hs.user_id IS NOT NULL)
    )
  );

CREATE POLICY "payments_admin_all"
  ON public.payments FOR ALL
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

-- =============================================================================
-- CHECKINS / CHECKOUTS: hotel staff and admin
-- =============================================================================
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "checkins_staff_all"
  ON public.checkins FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      JOIN public.hotels h ON h.id = b.hotel_id
      LEFT JOIN public.hotel_staff hs ON hs.hotel_id = h.id AND hs.user_id = auth.uid()
      WHERE b.id = checkins.booking_id AND (h.owner_id = auth.uid() OR hs.user_id IS NOT NULL)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings b
      JOIN public.hotels h ON h.id = b.hotel_id
      LEFT JOIN public.hotel_staff hs ON hs.hotel_id = h.id AND hs.user_id = auth.uid()
      WHERE b.id = checkins.booking_id AND (h.owner_id = auth.uid() OR hs.user_id IS NOT NULL)
    )
  );

CREATE POLICY "checkins_admin_all"
  ON public.checkins FOR ALL
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

ALTER TABLE public.checkouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "checkouts_staff_all"
  ON public.checkouts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      JOIN public.hotels h ON h.id = b.hotel_id
      LEFT JOIN public.hotel_staff hs ON hs.hotel_id = h.id AND hs.user_id = auth.uid()
      WHERE b.id = checkouts.booking_id AND (h.owner_id = auth.uid() OR hs.user_id IS NOT NULL)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings b
      JOIN public.hotels h ON h.id = b.hotel_id
      LEFT JOIN public.hotel_staff hs ON hs.hotel_id = h.id AND hs.user_id = auth.uid()
      WHERE b.id = checkouts.booking_id AND (h.owner_id = auth.uid() OR hs.user_id IS NOT NULL)
    )
  );

CREATE POLICY "checkouts_admin_all"
  ON public.checkouts FOR ALL
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

-- =============================================================================
-- NOTIFICATIONS: users read own; service/authenticated can insert for user
-- =============================================================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_own_select"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "notifications_own_update"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notifications_insert_authenticated"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "notifications_admin_select"
  ON public.notifications FOR SELECT
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

-- =============================================================================
-- AUDIT_LOGS: admin read; authenticated insert (app writes on actions)
-- =============================================================================
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_admin_select"
  ON public.audit_logs FOR SELECT
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

CREATE POLICY "audit_logs_insert_authenticated"
  ON public.audit_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
