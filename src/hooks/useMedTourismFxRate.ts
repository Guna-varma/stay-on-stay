import { useEffect, useState } from "react";

let ratesCache: Record<string, number> | null = null;
let inflight: Promise<Record<string, number> | null> | null = null;

/** Shared USD→foreign rates (exchangerate.host). One fetch per session; no API key. */
export function prefetchUsdRates(): Promise<Record<string, number> | null> {
  if (ratesCache) return Promise.resolve(ratesCache);
  if (inflight) return inflight;
  inflight = fetch("https://api.exchangerate.host/latest?base=USD")
    .then((r) => r.json())
    .then((data) => {
      const rates = data?.rates as Record<string, number> | undefined;
      if (rates && typeof rates === "object") {
        ratesCache = rates;
        return rates;
      }
      return null;
    })
    .catch(() => null)
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/**
 * Live units of local currency per 1 USD when the API succeeds; otherwise `fallback`
 * from static country data.
 */
export function useUsdToLocalRate(currencyCode: string, fallback: number): number {
  const [rate, setRate] = useState(fallback);

  useEffect(() => {
    let alive = true;
    prefetchUsdRates().then((rates) => {
      if (!alive || !rates) return;
      const r = rates[currencyCode];
      if (typeof r === "number" && r > 0) setRate(r);
    });
    return () => {
      alive = false;
    };
  }, [currencyCode]);

  return rate;
}
