import { describe, expect, it } from "vitest";
import { clampStayNights, computeStayPricing, pricingTierLabel } from "@/lib/pricing";

describe("clampStayNights", () => {
  it("uses 1 for non-finite values", () => {
    expect(clampStayNights(NaN)).toBe(1);
    expect(clampStayNights(Number.POSITIVE_INFINITY)).toBe(1);
    expect(clampStayNights(Number.NEGATIVE_INFINITY)).toBe(1);
  });

  it("rounds and enforces minimum 1", () => {
    expect(clampStayNights(0)).toBe(1);
    expect(clampStayNights(0.4)).toBe(1);
    expect(clampStayNights(-5)).toBe(1);
    expect(clampStayNights(3.7)).toBe(4);
  });

  it("caps very large stays", () => {
    expect(clampStayNights(999999)).toBe(3650);
  });
});

describe("computeStayPricing", () => {
  it("standard tier: catalog only", () => {
    const r = computeStayPricing({
      finalPrice: 1000,
      weeklyNightly: null,
      monthlyNightly: null,
      nights: 3,
    });
    expect(r.tier).toBe("standard");
    expect(r.effectiveNightly).toBe(1000);
    expect(r.listSubtotal).toBe(3000);
    expect(r.lineTotal).toBe(3000);
  });

  it("weekly tier from 7 nights when weekly rate set", () => {
    const r = computeStayPricing({
      finalPrice: 1000,
      weeklyNightly: 800,
      monthlyNightly: null,
      nights: 7,
    });
    expect(r.tier).toBe("weekly");
    expect(r.effectiveNightly).toBe(800);
    expect(r.listSubtotal).toBe(7000);
    expect(r.lineTotal).toBe(5600);
  });

  it("does not apply weekly below 7 nights", () => {
    const r = computeStayPricing({
      finalPrice: 1000,
      weeklyNightly: 500,
      monthlyNightly: null,
      nights: 6,
    });
    expect(r.tier).toBe("standard");
    expect(r.lineTotal).toBe(6000);
  });

  it("monthly tier from 28 nights when monthly rate set", () => {
    const r = computeStayPricing({
      finalPrice: 1000,
      weeklyNightly: 800,
      monthlyNightly: 600,
      nights: 28,
    });
    expect(r.tier).toBe("monthly");
    expect(r.effectiveNightly).toBe(600);
    expect(r.lineTotal).toBe(16800);
  });

  it("monthly overrides weekly at 30 nights", () => {
    const r = computeStayPricing({
      finalPrice: 1000,
      weeklyNightly: 700,
      monthlyNightly: 500,
      nights: 30,
    });
    expect(r.tier).toBe("monthly");
    expect(r.effectiveNightly).toBe(500);
  });

  it("ignores zero or negative optional rates (treated as unset)", () => {
    const r = computeStayPricing({
      finalPrice: 100,
      weeklyNightly: 0,
      monthlyNightly: -10,
      nights: 10,
    });
    expect(r.tier).toBe("standard");
    expect(r.lineTotal).toBe(1000);
  });

  it("treats invalid finalPrice as 0", () => {
    const r = computeStayPricing({
      finalPrice: NaN,
      weeklyNightly: null,
      monthlyNightly: null,
      nights: 5,
    });
    expect(r.listSubtotal).toBe(0);
    expect(r.lineTotal).toBe(0);
  });

  it("clamps negative finalPrice to 0", () => {
    const r = computeStayPricing({
      finalPrice: -50,
      weeklyNightly: null,
      monthlyNightly: null,
      nights: 2,
    });
    expect(r.listSubtotal).toBe(0);
    expect(r.effectiveNightly).toBe(0);
  });

  it("handles malformed nights like API edge payloads", () => {
    const r = computeStayPricing({
      finalPrice: 100,
      weeklyNightly: null,
      monthlyNightly: null,
      nights: NaN,
    });
    expect(r.lineTotal).toBe(100);
  });

  it("allows weekly rate higher than catalog (owner choice)", () => {
    const r = computeStayPricing({
      finalPrice: 100,
      weeklyNightly: 500,
      monthlyNightly: null,
      nights: 7,
    });
    expect(r.tier).toBe("weekly");
    expect(r.lineTotal).toBe(3500);
  });
});

describe("pricingTierLabel", () => {
  it("returns human labels", () => {
    expect(pricingTierLabel("standard")).toContain("Standard");
    expect(pricingTierLabel("weekly")).toContain("7+");
    expect(pricingTierLabel("monthly")).toContain("28+");
  });
});
