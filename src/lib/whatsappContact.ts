/**
 * Default WhatsApp line for international / Africa region (Rwanda +250).
 * Digits only — no + prefix — for https://wa.me/{number}
 */
export const WHATSAPP_RW_NUMBER = "250788944143";

export function whatsappMeUrl(number: string, text?: string): string {
  const base = `https://wa.me/${number}`;
  if (!text?.trim()) return base;
  return `${base}?text=${encodeURIComponent(text)}`;
}
