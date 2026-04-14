-- Fix: staff driver creation fails with:
-- 23514 new row violates check constraint "staff_check1"
--
-- Root cause:
-- Legacy staff constraint required driver rows to include:
--   car_name, car_number, seating_capacity
-- In the upgraded transport model, vehicles are stored separately in
-- public.transport_vehicles, so driver creation should not require car columns.

DO $$
BEGIN
  -- Drop legacy unnamed auto constraints if present
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'staff_check'
      AND conrelid = 'public.staff'::regclass
  ) THEN
    ALTER TABLE public.staff DROP CONSTRAINT staff_check;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'staff_check1'
      AND conrelid = 'public.staff'::regclass
  ) THEN
    ALTER TABLE public.staff DROP CONSTRAINT staff_check1;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'staff_check2'
      AND conrelid = 'public.staff'::regclass
  ) THEN
    ALTER TABLE public.staff DROP CONSTRAINT staff_check2;
  END IF;
END $$;

-- Re-add explicit named constraints aligned with current transport architecture.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'staff_hotel_required_for_operational_designations'
      AND conrelid = 'public.staff'::regclass
  ) THEN
    ALTER TABLE public.staff
      ADD CONSTRAINT staff_hotel_required_for_operational_designations CHECK (
        CASE
          WHEN designation IN ('room_service', 'cleaning', 'cook', 'housekeeping', 'maintenance', 'driver', 'translator')
          THEN hotel_id IS NOT NULL
          ELSE TRUE
        END
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'staff_translator_languages_required'
      AND conrelid = 'public.staff'::regclass
  ) THEN
    ALTER TABLE public.staff
      ADD CONSTRAINT staff_translator_languages_required CHECK (
        CASE
          WHEN designation = 'translator'
          THEN languages IS NOT NULL AND array_length(languages, 1) > 0
          ELSE TRUE
        END
      );
  END IF;
END $$;

