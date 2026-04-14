/**
 * List-of-values for Transport module (manager/owner UX).
 * Align forms and filters; backend can mirror these as CHECK constraints later.
 */

import type { TripType } from "@/lib/operations-types";

export const TRIP_TYPES: readonly TripType[] = [
  "Airport Pickup",
  "Daily Cab",
  "Hospital",
  "Discharge",
] as const;

export const TRIP_TYPE_DESCRIPTIONS: Record<TripType, string> = {
  "Airport Pickup": "Meet & greet from airport to hotel",
  "Daily Cab": "Scheduled local / hospital runs",
  Hospital: "Hotel ↔ hospital transfer",
  Discharge: "Hospital discharge pickup to hotel or airport",
};

export const VEHICLE_BODY_TYPES = [
  "Sedan",
  "SUV",
  "Tempo Traveller",
  "Mini Bus",
  "Luxury Sedan",
  "Wheelchair accessible",
] as const;

export const VEHICLE_STATUSES = ["active", "maintenance", "retired"] as const;

export const DRIVER_STATUSES = ["available", "on_trip", "off_duty"] as const;

export const TRANSLATOR_STATUSES = ["available", "assigned", "on_leave"] as const;

export const VENDOR_CATEGORIES = [
  "Medical consumables",
  "Food service",
  "Laundry",
  "Diagnostics / lab",
  "Pharmacy",
  "Equipment rental",
  "Security / concierge",
  "Other",
] as const;

/** Common medical-tourism language pairs — extend freely */
export const TRANSLATOR_LANGUAGE_OPTIONS = [
  "Arabic",
  "Bengali",
  "English",
  "French",
  "German",
  "Hindi",
  "Japanese",
  "Mandarin",
  "Portuguese",
  "Russian",
  "Spanish",
  "Tamil",
  "Turkish",
  "Urdu",
] as const;

export const ROUTE_PRESETS = [
  "IGI Airport T3 → Hotel",
  "Hotel → Medanta Hospital",
  "Hotel → Artemis Hospital",
  "Hotel → Fortis Hospital",
  "MedStay Grand → Medanta Hospital",
  "Artemis Care Suites → Medanta",
] as const;
