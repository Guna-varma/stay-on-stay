/**
 * Keep in sync with src/lib/pricing.ts — effective nightly + line total for Stripe and UI.
 * Rules: 28+ nights use monthly_nightly if set; else 7+ nights use weekly_nightly if set; else catalog final_price.
 */
export type PricingTier = "standard" | "weekly" | "monthly";

const MAX_NIGHTS = 3650;

function clampStayNights(nights: number): number {
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
