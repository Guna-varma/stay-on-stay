-- Booking confirmation email tracking + in-app customer notifications
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS confirmation_email_sent_at TIMESTAMPTZ;

COMMENT ON COLUMN public.bookings.confirmation_email_sent_at IS
  'Set when confirmation email (with invoice PDF) was sent to the guest/customer.';

CREATE TABLE IF NOT EXISTS public.customer_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  notification_type TEXT NOT NULL DEFAULT 'info',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_notifications_user_created
  ON public.customer_notifications(user_id, created_at DESC);

ALTER TABLE public.customer_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customer_notifications_select_own" ON public.customer_notifications;
CREATE POLICY "customer_notifications_select_own"
  ON public.customer_notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "customer_notifications_update_own" ON public.customer_notifications;
CREATE POLICY "customer_notifications_update_own"
  ON public.customer_notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

COMMENT ON TABLE public.customer_notifications IS
  'In-app messages for customers (e.g. booking confirmed). Inserts via service role / Edge Functions only.';

-- One "booking confirmed" row per user per booking (idempotent retries)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_customer_notif_booking_confirmed
  ON public.customer_notifications (user_id, (metadata ->> 'booking_id'))
  WHERE notification_type = 'booking_confirmed'
    AND metadata ->> 'booking_id' IS NOT NULL;
