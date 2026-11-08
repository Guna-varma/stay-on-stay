import { describe, expect, it } from "vitest";
import { getDisplayName, getInitials } from "@/lib/user-identity";

describe("user identity helpers", () => {
  it("prefers first and last name for display name and initials", () => {
    expect(getDisplayName({ firstName: "Anita", lastName: "Rao", email: "ar@example.com" })).toBe("Anita Rao");
    expect(getInitials({ firstName: "Anita", lastName: "Rao", email: "ar@example.com" })).toBe("AR");
  });

  it("uses the first two letters for a single name", () => {
    expect(getInitials({ firstName: "Anita", email: "anita@example.com" })).toBe("AN");
  });

  it("falls back to the email when names are unavailable", () => {
    expect(getDisplayName({ email: "email@example.com" })).toBe("email@example.com");
    expect(getInitials({ email: "email@example.com" })).toBe("EM");
  });

  it("returns a safe default when no identity data exists", () => {
    expect(getInitials({})).toBe("U");
  });
});
