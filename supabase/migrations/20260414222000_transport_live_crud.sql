-- StayOnStay transport live model (manager/front-desk scoped, no static seed dependency)

-- -----------------------------------------------------------------------------
-- 1) Extend staff for transport-specific attributes (driver/translator)
-- -----------------------------------------------------------------------------
ALTER TABLE public.staff
  ADD COLUMN IF NOT EXISTS license_number TEXT,
  ADD COLUMN IF NOT EXISTS transport_status TEXT
    CHECK (transport_status IN ('available', 'on_trip', 'off_duty', 'assigned', 'on_leave')),
  ADD COLUMN IF NOT EXISTS rating NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS daily_rate_inr NUMERIC(12,2);

UPDATE public.staff
SET
  transport_status = COALESCE(
    transport_status,
    CASE
      WHEN designation = 'driver' THEN 'available'
      WHEN designation = 'translator' THEN 'available'
      ELSE NULL
    END
  ),
  rating = COALESCE(rating, 4.8)
WHERE designation IN ('driver', 'translator')
  AND (transport_status IS NULL OR rating IS NULL);

-- -----------------------------------------------------------------------------
-- 2) Transport vehicles
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transport_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  body_type TEXT NOT NULL,
  plate TEXT NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  status TEXT NOT NULL CHECK (status IN ('active', 'maintenance', 'retired')) DEFAULT 'active',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_transport_vehicles_hotel_plate_active
  ON public.transport_vehicles(hotel_id, plate)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_transport_vehicles_hotel_status
  ON public.transport_vehicles(hotel_id, status)
  WHERE deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- 3) Transport vendors
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transport_vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  contact TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_transport_vendors_hotel_active
  ON public.transport_vendors(hotel_id, active)
  WHERE deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- 4) Transport trips
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transport_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  trip_type TEXT NOT NULL CHECK (trip_type IN ('Airport Pickup', 'Daily Cab', 'Hospital', 'Discharge')),
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled')) DEFAULT 'scheduled',
  guest_name TEXT NOT NULL,
  room_label TEXT,
  checkin_ref TEXT,
  route TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  driver_staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES public.transport_vehicles(id) ON DELETE SET NULL,
  price_inr NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_transport_trips_hotel_status_sched
  ON public.transport_trips(hotel_id, status, scheduled_at DESC)
  WHERE deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- 5) updated_at trigger helpers
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.touch_transport_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS transport_vehicles_touch_updated_at ON public.transport_vehicles;
CREATE TRIGGER transport_vehicles_touch_updated_at
BEFORE UPDATE ON public.transport_vehicles
FOR EACH ROW EXECUTE FUNCTION public.touch_transport_updated_at();

DROP TRIGGER IF EXISTS transport_vendors_touch_updated_at ON public.transport_vendors;
CREATE TRIGGER transport_vendors_touch_updated_at
BEFORE UPDATE ON public.transport_vendors
FOR EACH ROW EXECUTE FUNCTION public.touch_transport_updated_at();

DROP TRIGGER IF EXISTS transport_trips_touch_updated_at ON public.transport_trips;
CREATE TRIGGER transport_trips_touch_updated_at
BEFORE UPDATE ON public.transport_trips
FOR EACH ROW EXECUTE FUNCTION public.touch_transport_updated_at();

-- -----------------------------------------------------------------------------
-- 6) RLS policies
-- -----------------------------------------------------------------------------
ALTER TABLE public.transport_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_trips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transport_vehicles_manager_all" ON public.transport_vehicles;
CREATE POLICY "transport_vehicles_manager_all"
  ON public.transport_vehicles FOR ALL
  TO authenticated
  USING (public.current_user_can_operate_ops_hotel(hotel_id))
  WITH CHECK (public.current_user_can_operate_ops_hotel(hotel_id));

DROP POLICY IF EXISTS "transport_vendors_manager_all" ON public.transport_vendors;
CREATE POLICY "transport_vendors_manager_all"
  ON public.transport_vendors FOR ALL
  TO authenticated
  USING (public.current_user_can_operate_ops_hotel(hotel_id))
  WITH CHECK (public.current_user_can_operate_ops_hotel(hotel_id));

DROP POLICY IF EXISTS "transport_trips_manager_all" ON public.transport_trips;
CREATE POLICY "transport_trips_manager_all"
  ON public.transport_trips FOR ALL
  TO authenticated
  USING (public.current_user_can_operate_ops_hotel(hotel_id))
  WITH CHECK (public.current_user_can_operate_ops_hotel(hotel_id));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.transport_vehicles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transport_vendors TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transport_trips TO authenticated;

