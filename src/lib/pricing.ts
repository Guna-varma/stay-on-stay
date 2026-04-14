/**
 * Mirrors supabase/functions/_shared/stay-pricing.ts for browser checkout and hotel detail.
 * Defensive against NaN/Infinity/negative inputs so APIs and tests get deterministic results.
 */
export type PricingTier = "standard" | "weekly" | "monthly";

/** Aligns with customer checkout: at least 1 night, integer, bounded to avoid overflow noise in tests. */
const MAX_NIGHTS = 3650;

export function clampStayNights(nights: number): number {
  if (!Number.isFinite(nights)) return 1;
  const rounded = Math.max(1, Math.round(nights));
  return Math.min(rounded, MAX_NIGHTS);
}

function sanitizeCatalogNightly(price: number): number {
  if (!Number.isFinite(price) || price < 0) return 0;
  return price;
}

function sanitizeOptionalNightly(rate: number | null | undefined): number | null {
  if (rate == null) return null;
  if (!Number.isFinite(rate) || rate <= 0) return null;
  return rate;
}

export function computeStayPricing(args: {
  finalPrice: number;
  weeklyNightly: number | null;
  monthlyNightly: number | null;
  nights: number;
}): { effectiveNightly: number; listSubtotal: number; tier: PricingTier; lineTotal: number } {
  const { weeklyNightly, monthlyNightly } = args;
  const n = clampStayNights(args.nights);
  const fp = sanitizeCatalogNightly(args.finalPrice);
  const w = sanitizeOptionalNightly(weeklyNightly);
  const m = sanitizeOptionalNightly(monthlyNightly);

  const listSubtotal = fp * n;
  let tier: PricingTier = "standard";
  let effective = fp;

  if (n >= 28 && m != null) {
    effective = m;
    tier = "monthly";
  } else if (n >= 7 && w != null) {
    effective = w;
    tier = "weekly";
  }

  return {
    effectiveNightly: effective,
    listSubtotal,
    tier,
    lineTotal: effective * n,
  };
}

export function pricingTierLabel(tier: PricingTier): string {
  if (tier === "weekly") return "Weekly rate (7+ nights)";
  if (tier === "monthly") return "Extended stay (28+ nights)";
  return "Standard nightly rate";
}
