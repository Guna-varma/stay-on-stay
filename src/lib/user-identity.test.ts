import { describe, expect, it } from "vitest";
import { getDisplayName, getInitials } from "@/lib/user-identity";

describe("user identity helpers", () => {
  it("prefers first and last name for display name and initials", () => {
    expect(getDisplayName({ firstName: "Gunavarma", lastName: "Meda", email: "gm@example.com" })).toBe("Gunavarma Meda");
    expect(getInitials({ firstName: "Gunavarma", lastName: "Meda", email: "gm@example.com" })).toBe("GM");
  });

  it("uses the first two letters for a single name", () => {
    expect(getInitials({ firstName: "Gunavarma", email: "gunavarma@example.com" })).toBe("GU");
  });

  it("falls back to the email when names are unavailable", () => {
    expect(getDisplayName({ email: "email@example.com" })).toBe("email@example.com");
    expect(getInitials({ email: "email@example.com" })).toBe("EM");
  });

  it("returns a safe default when no identity data exists", () => {
    expect(getInitials({})).toBe("U");
  });
});
