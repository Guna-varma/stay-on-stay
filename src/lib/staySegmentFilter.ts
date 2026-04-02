import type { PublicHotelCard } from "@/lib/supabase";

/** Browse medical stays by layout / property style (matched on names & descriptions). */
export type StaySegment = "all" | "hotel" | "bhk1_kitchen" | "bhk2_family" | "studio";

export function inventoryTextBlob(h: PublicHotelCard): string {
  const parts = [
    h.name,
    h.description ?? "",
    ...h.room_types.flatMap((rt) => [rt.name, rt.description ?? ""]),
  ];
  return parts.join(" ").toLowerCase();
}

/**
 * Heuristic filters — inventory copy should mention 1BHK, 2BHK, kitchen, hotel, etc.
 * When nothing matches, users can still WhatsApp for a manual match.
 */
export function matchesStaySegment(h: PublicHotelCard, segment: StaySegment): boolean {
  if (segment === "all") return true;
  const t = inventoryTextBlob(h);

  switch (segment) {
    case "hotel":
      return (
        /\b(hotel|residency|suites?|inn|lodge|lodging)\b/.test(t) ||
        /\b(deluxe|superior|executive|standard|premium)\s+(room|suite|accommodation)\b/.test(t) ||
        /\broom\s+only\b/.test(t)
      );
    case "bhk1_kitchen": {
      const kitchenAmenity = h.amenities.some((a) => /kitchen|microwave|induction|cooktop/i.test(a.name));
      return (
        /\b1\s*bhk\b|\b1bhk\b|\bone\s*bhk\b/.test(t) ||
        (/\bkitchen\b/.test(t) && /\b(1\s*bhk|1bhk)\b/.test(t)) ||
        /\b1\s*bhk\b.*\bkitchen\b|\bkitchen\b.*\b1\s*bhk\b/.test(t) ||
        (/\bfull\s+kitchen\b/.test(t) && /\b(1\s*bhk|1bhk|one\s*bhk)\b/.test(t)) ||
        (kitchenAmenity && /\b(1\s*bhk|1bhk|one\s*bhk|1\s*bedroom)\b/.test(t))
      );
    }
    case "bhk2_family":
      return (
        /\b2\s*bhk\b|\b2bhk\b|\btwo\s*bhk\b/.test(t) ||
        h.room_types.some((rt) => (rt.max_guests ?? 0) >= 4)
      );
    case "studio":
      return (
        /\b1rk\b|\brk\b|\bstudio\b|\bstudio\s+apartment\b|\bservice\s+apartment\b/.test(t) ||
        (/\brk\b/.test(t) && !/\bbhk\b/.test(t))
      );
    default:
      return true;
  }
}

export function segmentWhatsAppHint(segment: StaySegment): string {
  switch (segment) {
    case "hotel":
      return "hotel-style room or suite";
    case "bhk1_kitchen":
      return "1BHK with full kitchen near my hospital";
    case "bhk2_family":
      return "2BHK for family during treatment";
    case "studio":
      return "studio / 1RK serviced stay";
    default:
      return "the right stay for my medical trip";
  }
}
