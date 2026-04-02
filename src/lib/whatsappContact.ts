/**
 * Default WhatsApp line for international / Africa region (Rwanda +250).
 * Digits only — no + prefix — for https://wa.me/{number}
 */
export const WHATSAPP_RW_NUMBER = "250788944143";

/** India care line — digits only for wa.me */
export const WHATSAPP_IN_NUMBER = "919312972981";

const STORAGE_WHATSAPP_REGION = "visitorWhatsAppRegion";

export type VisitorWhatsAppRegion = "in" | "intl";

/** Heuristic: India timezone / locale → India WhatsApp; else Rwanda line. */
export function inferVisitorIndiaLikely(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
    if (/Asia\/(Kolkata|Calcutta)/i.test(tz)) return true;
    const lang = (navigator.language || "").toLowerCase();
    if (lang === "en-in" || lang.endsWith("-in")) return true;
  } catch {
    /* ignore */
  }
  return false;
}

export function getStoredWhatsAppRegion(): VisitorWhatsAppRegion | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(STORAGE_WHATSAPP_REGION);
  if (v === "in" || v === "intl") return v;
  return null;
}

export function setStoredWhatsAppRegion(region: VisitorWhatsAppRegion): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_WHATSAPP_REGION, region);
  window.dispatchEvent(new Event("visitor-whatsapp-updated"));
}

/** Floating CTA and default opens: stored country choice wins, then heuristic. */
export function whatsappNumberForVisitor(): string {
  const stored = getStoredWhatsAppRegion();
  if (stored === "in") return WHATSAPP_IN_NUMBER;
  if (stored === "intl") return WHATSAPP_RW_NUMBER;
  return inferVisitorIndiaLikely() ? WHATSAPP_IN_NUMBER : WHATSAPP_RW_NUMBER;
}

/** Pick line from explicit country label (quick form). */
export function whatsappNumberForCountryLabel(country: string): string {
  const c = country.trim().toLowerCase();
  if (c === "india") return WHATSAPP_IN_NUMBER;
  return WHATSAPP_RW_NUMBER;
}

export function whatsappMeUrl(number: string, text?: string): string {
  const base = `https://wa.me/${number}`;
  if (!text?.trim()) return base;
  return `${base}?text=${encodeURIComponent(text)}`;
}
