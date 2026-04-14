/**
 * Derive address fields from a Google Maps URL.
 * 1) If coordinates are present → OpenStreetMap Nominatim reverse geocode (browser fetch).
 * 2) Else if /place/Name+With+Plus → decode as a location hint for the address line.
 * 3) Else if ?q= free-text (not lat,lng) → use as address line.
 */

const NOMINATIM = "https://nominatim.openstreetmap.org/reverse";

export function looksLikeShortMapsLink(url: string): boolean {
  const u = url.trim().toLowerCase();
  return /^(https?:\/\/)?(goo\.gl|maps\.app\.goo\.gl|bit\.ly)\//i.test(u) || u.includes("goo.gl/maps");
}

export function extractLatLngFromMapsUrl(url: string): { lat: number; lng: number } | null {
  const decoded = decodeURIComponent(url);
  // Standard: .../@28.4595,77.0266,17z or .../@28.4595,77.0266z
  const at = /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)(?:,|\b)/.exec(decoded);
  if (at) {
    const lat = parseFloat(at[1]);
    const lng = parseFloat(at[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  }
  // ?q=lat,lng or &query=lat,lng
  const qm = /[?&](?:q|query)=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)(?:&|$)/.exec(decoded);
  if (qm) {
    const lat = parseFloat(qm[1]);
    const lng = parseFloat(qm[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  }
  return null;
}

/** Path segment after /place/ — often "Name+City+Country" or similar */
export function extractPlaceLabelFromMapsUrl(url: string): string | null {
  try {
    const u = new URL(url.trim().includes("://") ? url.trim() : `https://${url.trim()}`);
    const m = /\/place\/([^/?]+)/.exec(u.pathname);
    if (!m) return null;
    return decodeURIComponent(m[1].replace(/\+/g, " "))
      .replace(/\s+/g, " ")
      .trim();
  } catch {
    return null;
  }
}

function extractQueryAddress(url: string): string | null {
  try {
    const u = new URL(url.trim().includes("://") ? url.trim() : `https://${url.trim()}`);
    const q = u.searchParams.get("q") ?? u.searchParams.get("query");
    if (!q) return null;
    const decoded = decodeURIComponent(q.replace(/\+/g, " ")).trim();
    if (/^-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?$/.test(decoded)) return null;
    return decoded;
  } catch {
    return null;
  }
}

type NominatimAddr = {
  house_number?: string;
  road?: string;
  suburb?: string;
  neighbourhood?: string;
  city?: string;
  town?: string;
  village?: string;
  state_district?: string;
  state?: string;
  postcode?: string;
  country?: string;
};

async function reverseGeocodeNominatim(lat: number, lng: number): Promise<{
  address: string;
  city: string;
  country: string;
} | null> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: "json",
    addressdetails: "1",
  });
  const res = await fetch(`${NOMINATIM}?${params.toString()}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      // Nominatim usage policy: identify app (browser sends User-Agent too)
      "Accept-Language": "en",
    },
  });
  if (!res.ok) return null;
  const j = (await res.json()) as {
    display_name?: string;
    address?: NominatimAddr;
  };
  const a = j.address;
  if (!a && !j.display_name) return null;

  const city =
    a?.city ||
    a?.town ||
    a?.village ||
    a?.suburb ||
    a?.state_district ||
    a?.state ||
    "";
  const country = a?.country || "";

  const lineParts = [a?.house_number, a?.road, a?.neighbourhood || a?.suburb].filter(Boolean) as string[];
  const address =
    lineParts.length > 0
      ? lineParts.join(", ")
      : j.display_name
        ? j.display_name.split(",").slice(0, 3).join(",").trim()
        : "";

  return {
    address: address || j.display_name?.split(",").slice(0, 2).join(",").trim() || "",
    city,
    country,
  };
}

export type MapsLinkEnrichment = {
  address: string;
  city: string;
  country: string;
  source: "geocode" | "place_path" | "query";
  hint?: string;
};

/**
 * Fill address / city / country from a pasted Google Maps URL.
 * May throw if the link cannot be interpreted (e.g. opaque short URL).
 */
export async function enrichAddressFromGoogleMapsUrl(url: string): Promise<MapsLinkEnrichment> {
  const trimmed = url.trim();
  if (!trimmed) {
    throw new Error("Paste a Google Maps link first.");
  }
  if (looksLikeShortMapsLink(trimmed)) {
    throw new Error("Short links cannot be read. Open the place in Google Maps and copy the full URL from the address bar.");
  }

  const coords = extractLatLngFromMapsUrl(trimmed);
  if (coords) {
    try {
      const geo = await reverseGeocodeNominatim(coords.lat, coords.lng);
      if (geo && (geo.address || geo.city || geo.country)) {
        return {
          address: geo.address,
          city: geo.city,
          country: geo.country,
          source: "geocode",
          hint: "Resolved with OpenStreetMap from coordinates in your link.",
        };
      }
    } catch {
      /* fall through */
    }
  }

  const place = extractPlaceLabelFromMapsUrl(trimmed);
  if (place) {
    const parts = place.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 3) {
      return {
        address: parts.slice(0, -2).join(", ") || parts[0],
        city: parts[parts.length - 2] ?? "",
        country: parts[parts.length - 1] ?? "",
        source: "place_path",
        hint: "Parsed from the Maps URL path. Adjust if needed.",
      };
    }
    if (parts.length === 2) {
      return {
        address: parts[0],
        city: parts[1],
        country: "",
        source: "place_path",
        hint: "Parsed from the Maps URL path.",
      };
    }
    return {
      address: place,
      city: "",
      country: "",
      source: "place_path",
      hint: "Parsed from the Maps URL. Add city and country if missing.",
    };
  }

  const q = extractQueryAddress(trimmed);
  if (q) {
    return {
      address: q,
      city: "",
      country: "",
      source: "query",
      hint: "Used the search text from the link as the address line.",
    };
  }

  throw new Error(
    "Could not read this link. Try a full maps.google.com URL (place page or @lat,lng), or enter the address manually.",
  );
}
