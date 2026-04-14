/**
 * After a booking is confirmed (Stripe): email guest with PDF receipt + in-app notification for booker.
 * Idempotent via bookings.confirmation_email_sent_at.
 */
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { encode as base64Encode } from "https://deno.land/std@0.208.0/encoding/base64.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { buildBookingInvoicePdf } from "./booking-invoice-pdf.ts";

function log(level: string, msg: string, extra?: Record<string, unknown>) {
  console.log(JSON.stringify({ level, msg, ts: new Date().toISOString(), ...extra }));
}

async function sendMailWithPdf(opts: {
  host: string;
  port: number;
  user: string;
  pass: string;
  fromAddr: string;
  fromName: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  pdfBytes: Uint8Array;
  pdfFilename: string;
}): Promise<void> {
  const implicitTls = opts.port === 465;
  const client = new SMTPClient({
    connection: {
      hostname: opts.host,
      port: opts.port,
      tls: implicitTls,
      auth: { username: opts.user, password: opts.pass },
    },
  });
  try {
    await client.send({
      from: `${opts.fromName} <${opts.fromAddr}>`,
      to: opts.to,
      subject: opts.subject,
      content: opts.text,
      html: opts.html,
      attachments: [
        {
          filename: opts.pdfFilename,
          contentType: "application/pdf",
          encoding: "base64",
          content: base64Encode(opts.pdfBytes),
        },
      ],
    } as Record<string, unknown>);
  } finally {
    await client.close();
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function insertBookerNotification(
  supabase: SupabaseClient,
  bookerId: string,
  bookingId: string,
  hotelName: string,
  totalStr: string,
  emailedTo: string,
): Promise<void> {
  const { error } = await supabase.from("customer_notifications").insert({
    user_id: bookerId,
    title: "Booking confirmed",
    body: `Your stay at ${hotelName} is confirmed. Total ${totalStr}. Receipt emailed to ${emailedTo}.`,
    notification_type: "booking_confirmed",
    metadata: { booking_id: bookingId, receipt_email: emailedTo },
  });
  if (error?.code === "23505") return;
  if (error) log("warn", "customer_notification_insert_failed", { bookingId, detail: error.message });
}

export async function processBookingConfirmation(
  supabase: SupabaseClient,
  bookingId: string,
): Promise<{ ok: boolean; skipped?: boolean; reason?: string }> {
  const { data: row, error: fetchErr } = await supabase
    .from("bookings")
    .select(
      `
      id,
      booker_id,
      guest_id,
      check_in_date,
      check_out_date,
      total_price,
      currency,
      hotel_name_snapshot,
      room_type_name_snapshot,
      price_per_night_snapshot,
      list_price_subtotal,
      pricing_tier,
      stripe_checkout_session_id,
      confirmation_email_sent_at,
      guests ( first_name, last_name, email ),
      rooms ( room_number )
    `,
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (fetchErr || !row) {
    log("error", "booking_confirmation_fetch_failed", { bookingId, detail: String(fetchErr) });
    return { ok: false, reason: "fetch_failed" };
  }

  if (row.confirmation_email_sent_at) {
    return { ok: true, skipped: true, reason: "already_sent" };
  }

  const guest = row.guests as { first_name: string | null; last_name: string | null; email: string | null } | null;
  const room = row.rooms as { room_number: string | null } | null;

  let guestEmail = (guest?.email ?? "").trim().toLowerCase();
  let profileEmail = "";

  if (row.booker_id) {
    const { data: prof } = await supabase.from("profiles").select("email").eq("id", row.booker_id).maybeSingle();
    profileEmail = ((prof as { email?: string } | null)?.email ?? "").trim().toLowerCase();
  }

  const toEmail = guestEmail || profileEmail;

  const host = Deno.env.get("SMTP_HOST")?.trim() ?? "";
  const port = parseInt(Deno.env.get("SMTP_PORT") ?? "587", 10);
  const user = Deno.env.get("SMTP_USER")?.trim() ?? "";
  const pass = Deno.env.get("SMTP_PASS") ?? "";
  const fromAddr = Deno.env.get("SMTP_SENDER_EMAIL")?.trim() || user;
  const fromName = Deno.env.get("SMTP_SENDER_NAME")?.trim() || "StayOnStay";

  const ci = String(row.check_in_date).slice(0, 10);
  const co = String(row.check_out_date).slice(0, 10);
  const d0 = new Date(`${ci}T12:00:00Z`).getTime();
  const d1 = new Date(`${co}T12:00:00Z`).getTime();
  const nights = Math.max(1, Math.round((d1 - d0) / 86400000));

  const guestName = [guest?.first_name, guest?.last_name].filter(Boolean).join(" ").trim() || "Guest";

  const totalStr =
    row.total_price != null ? `${(row.currency || "INR").toUpperCase()} ${Number(row.total_price).toFixed(2)}` : "—";

  const hotelLabel = String(row.hotel_name_snapshot ?? "Hotel");

  if (!toEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) {
    log("warn", "booking_confirmation_no_recipient_email", { bookingId });
    if (row.booker_id) {
      const { error: nErr } = await supabase.from("customer_notifications").insert({
        user_id: row.booker_id,
        title: "Booking confirmed",
        body: `Your stay at ${hotelLabel} is confirmed. Total ${totalStr}. Add a guest email on checkout next time to receive a PDF receipt by email.`,
        notification_type: "booking_confirmed",
        metadata: { booking_id: bookingId, email_skipped: true },
      });
      if (nErr && nErr.code !== "23505") {
        log("warn", "customer_notification_insert_failed", { bookingId, detail: nErr.message });
      }
    }
    await supabase.from("bookings").update({ confirmation_email_sent_at: new Date().toISOString() }).eq("id", bookingId);
    return { ok: true, skipped: true, reason: "no_recipient_email" };
  }

  if (!host || !user || !pass || !fromAddr) {
    log("warn", "booking_confirmation_smtp_missing", { bookingId });
    return { ok: false, reason: "smtp_not_configured" };
  }

  const pdfBytes = await buildBookingInvoicePdf({
    bookingId: row.id,
    hotelName: hotelLabel,
    roomTypeName: String(row.room_type_name_snapshot ?? "Room"),
    roomNumber: room?.room_number ?? null,
    guestName,
    checkIn: ci,
    checkOut: co,
    nights,
    pricePerNight: row.price_per_night_snapshot != null ? Number(row.price_per_night_snapshot) : null,
    total: row.total_price != null ? Number(row.total_price) : null,
    currency: (row.currency as string) || "INR",
    stripeSessionId: (row.stripe_checkout_session_id as string) || null,
    listPriceSubtotal: row.list_price_subtotal != null ? Number(row.list_price_subtotal) : null,
    pricingTier: (row.pricing_tier as string | null) ?? null,
  });

  const subject = `${fromName} — Booking confirmed`;
  const text =
    `Hello ${guestName},\n\n` +
    `Your stay is confirmed.\n\n` +
    `Hotel: ${hotelLabel}\n` +
    `Room: ${row.room_type_name_snapshot}\n` +
    `Check-in: ${ci}  Check-out: ${co}  (${nights} night(s))\n` +
    `Total paid: ${totalStr}\n\n` +
    `A PDF receipt is attached.\n\n` +
    `Thank you for choosing StayOnStay.\n`;

  const html =
    `<p>Hello ${escapeHtml(guestName)},</p>` +
    `<p><strong>Your stay is confirmed.</strong></p>` +
    `<table style="border-collapse:collapse;font-family:sans-serif;font-size:14px;color:#222">` +
    `<tr><td style="padding:4px 12px 4px 0"><b>Hotel</b></td><td>${escapeHtml(hotelLabel)}</td></tr>` +
    `<tr><td style="padding:4px 12px 4px 0"><b>Room type</b></td><td>${escapeHtml(String(row.room_type_name_snapshot ?? ""))}</td></tr>` +
    `<tr><td style="padding:4px 12px 4px 0"><b>Check-in / out</b></td><td>${escapeHtml(ci)} → ${escapeHtml(co)} (${nights} night(s))</td></tr>` +
    `<tr><td style="padding:4px 12px 4px 0"><b>Total paid</b></td><td>${escapeHtml(totalStr)}</td></tr>` +
    `</table>` +
    `<p style="margin-top:16px">A <strong>PDF receipt</strong> is attached to this email.</p>` +
    `<p style="color:#555;font-size:13px">Thank you for choosing StayOnStay.</p>`;

  const safeFile = `StayOnStay-booking-${String(row.id).slice(0, 8)}.pdf`;

  try {
    await sendMailWithPdf({
      host,
      port,
      user,
      pass,
      fromAddr,
      fromName,
      to: toEmail,
      subject,
      text,
      html,
      pdfBytes,
      pdfFilename: safeFile,
    });
  } catch (e) {
    log("error", "booking_confirmation_email_failed", { bookingId, detail: String(e) });
    return { ok: false, reason: "email_failed" };
  }

  const now = new Date().toISOString();
  await supabase.from("bookings").update({ confirmation_email_sent_at: now }).eq("id", bookingId);

  if (row.booker_id) {
    await insertBookerNotification(supabase, row.booker_id, bookingId, hotelLabel, totalStr, toEmail);
  }

  log("info", "booking_confirmation_sent", { bookingId, to: toEmail });
  return { ok: true };
}
