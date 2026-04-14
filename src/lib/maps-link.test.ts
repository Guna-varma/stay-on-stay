import { describe, expect, it } from "vitest";
import { extractLatLngFromMapsUrl, extractPlaceLabelFromMapsUrl, looksLikeShortMapsLink } from "@/lib/maps-link";

describe("maps-link", () => {
  it("extracts coordinates from @lat,lng in URL", () => {
    const u =
      "https://www.google.com/maps/place/MedStay/@28.4597123,77.0266455,17z/data=!3m1!4b1";
    expect(extractLatLngFromMapsUrl(u)).toEqual({ lat: 28.4597123, lng: 77.0266455 });
  });

  it("extracts place label from /place/", () => {
    const u = "https://www.google.com/maps/place/Artemis+Hospital/@28.45,77.02,15z";
    expect(extractPlaceLabelFromMapsUrl(u)).toContain("Artemis");
  });

  it("detects short links", () => {
    expect(looksLikeShortMapsLink("https://goo.gl/maps/abc")).toBe(true);
    expect(looksLikeShortMapsLink("https://www.google.com/maps/place/X")).toBe(false);
  });
});
