import { describe, it, expect } from "vitest";
import {
  isValidEmail,
  validatePassword,
  validatePasswordMatch,
  validateFullName,
  validateOptionalPhone,
  validateGender,
} from "./auth-forms";

describe("isValidEmail", () => {
  it("accepts common valid emails", () => {
    expect(isValidEmail("a@b.co")).toBe(true);
    expect(isValidEmail("user.name+tag@example.com")).toBe(true);
  });
  it("rejects invalid", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("not-an-email")).toBe(false);
    expect(isValidEmail("@nodomain.com")).toBe(false);
  });
  it("trims for validation", () => {
    expect(isValidEmail("  user@example.com  ")).toBe(true);
  });
});

describe("validatePassword", () => {
  it("requires min length", () => {
    expect(validatePassword("")).toMatch(/required/i);
    expect(validatePassword("short")).not.toBeNull();
    expect(validatePassword("12345678")).toBeNull();
  });
  it("rejects too long", () => {
    expect(validatePassword("a".repeat(200))).not.toBeNull();
  });
});

describe("validatePasswordMatch", () => {
  it("detects mismatch", () => {
    expect(validatePasswordMatch("abc", "ab")).not.toBeNull();
    expect(validatePasswordMatch("same", "same")).toBeNull();
  });
});

describe("validateFullName", () => {
  it("requires non-empty trimmed", () => {
    expect(validateFullName("")).not.toBeNull();
    expect(validateFullName("  ")).not.toBeNull();
    expect(validateFullName("Jane Doe")).toBeNull();
  });
});

describe("validateOptionalPhone", () => {
  it("allows empty", () => {
    expect(validateOptionalPhone("")).toBeNull();
    expect(validateOptionalPhone("   ")).toBeNull();
  });
  it("validates digits length when present", () => {
    expect(validateOptionalPhone("12345")).not.toBeNull();
    expect(validateOptionalPhone("+1 234 567 8901")).toBeNull();
  });
});

describe("validateGender", () => {
  it("requires selection", () => {
    expect(validateGender("")).not.toBeNull();
    expect(validateGender("male")).toBeNull();
  });
});
