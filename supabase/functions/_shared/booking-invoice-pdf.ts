/**
 * One-page billing PDF for a confirmed booking (Stripe-paid).
 * Uses pdf-lib — ASCII-only text for broad font support.
 */
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";

export type BookingInvoiceInput = {
  bookingId: string;
  hotelName: string;
  roomTypeName: string;
  roomNumber: string | null;
  guestName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  pricePerNight: number | null;
  total: number | null;
  currency: string;
  stripeSessionId: string | null;
  /** Catalog total at standard nightly (before long-stay rate), for transparency */
  listPriceSubtotal?: number | null;
  pricingTier?: string | null;
};

function money(n: number | null, currency: string): string {
  if (n == null || Number.isNaN(n)) return "—";
  const c = (currency || "INR").toUpperCase();
  return `${c} ${n.toFixed(2)}`;
}

export async function buildBookingInvoicePdf(input: BookingInvoiceInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4 portrait
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const dark = rgb(0.12, 0.16, 0.2);
  const muted = rgb(0.35, 0.4, 0.45);

  let y = 780;
  const left = 50;
  const line = 18;

  page.drawText("StayOnStay — Booking receipt", { x: left, y, size: 18, font: bold, color: dark });
  y -= line * 2;

  page.drawText(`Booking ID: ${input.bookingId}`, { x: left, y, size: 10, font: regular, color: muted });
  y -= line;

  const rows: [string, string][] = [
    ["Hotel", input.hotelName],
    ["Room type", input.roomTypeName],
    ...(input.roomNumber ? ([["Room", input.roomNumber]] as [string, string][]) : []),
    ["Guest", input.guestName],
    ["Check-in", input.checkIn],
    ["Check-out", input.checkOut],
    ["Nights", String(input.nights)],
    ...(input.listPriceSubtotal != null &&
    input.total != null &&
    input.listPriceSubtotal > input.total + 0.005
      ? ([["Standard-rate total", money(input.listPriceSubtotal, input.currency)]] as [string, string][])
      : []),
    ...(input.pricingTier && input.pricingTier !== "standard"
      ? ([["Rate plan", input.pricingTier]] as [string, string][])
      : []),
    ["Price per night (charged)", money(input.pricePerNight, input.currency)],
    ["Total paid", money(input.total, input.currency)],
  ];

  if (input.stripeSessionId) {
    rows.push(["Payment ref", input.stripeSessionId]);
  }

  page.drawText("Details", { x: left, y, size: 12, font: bold, color: dark });
  y -= 27;

  for (const [label, val] of rows) {
    page.drawText(`${label}:`, { x: left, y, size: 10, font: bold, color: dark });
    page.drawText(val.length > 80 ? val.slice(0, 77) + "..." : val, { x: left + 130, y, size: 10, font: regular, color: dark });
    y -= line;
  }

  y -= line;
  page.drawText("Thank you for booking with StayOnStay.", { x: left, y, size: 9, font: regular, color: muted });
  y -= line;
  page.drawText("Please keep this receipt for your records.", { x: left, y, size: 9, font: regular, color: muted });

  return new Uint8Array(await doc.save());
}
