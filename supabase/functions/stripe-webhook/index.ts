/**
 * Stripe webhook: verify signature, process checkout.session.completed,
 * call assign_room_and_create_booking (idempotent via stripe_checkout_session_id), retries, refund on failure.
 */
import Stripe from "https://esm.sh/stripe@14.21.0?dts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { processBookingConfirmation } from "../_shared/process-booking-confirmation.ts";
import { computeStayPricing } from "../_shared/stay-pricing.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";

function log(level: string, msg: string, extra?: Record<string, unknown>) {
  console.log(JSON.stringify({ level, msg, ts: new Date().toISOString(), ...extra }));
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    log("error", "missing_stripe_signature");
    return new Response("Missing signature", { status: 400 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (e) {
    log("error", "webhook_signature_verify_failed", { detail: String(e) });
    return new Response(`Webhook Error: ${String(e)}`, { status: 400 });
  }

  log("info", "stripe_event_received", { id: event.id, type: event.type });

  if (event.type !== "checkout.session.completed") {
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const session = event.data.object as Stripe.Checkout.Session;
  const md = session.metadata ?? {};

  const { data: alreadyHandled } = await supabase
    .from("stripe_webhook_events")
    .select("id")
    .eq("id", event.id)
    .maybeSingle();
  if (alreadyHandled) {
    log("info", "duplicate_event_skipped", { id: event.id, type: event.type });
    return new Response(JSON.stringify({ received: true, duplicate: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const room_type_id = md.room_type_id;
  const check_in_date = md.check_in_date;
  const check_out_date = md.check_out_date;

  if (!room_type_id || !check_in_date || !check_out_date) {
    log("error", "checkout_missing_metadata", { session: session.id, md });
    return new Response(JSON.stringify({ received: true, error: "missing_metadata" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const booker_id = md.booker_id && md.booker_id.length > 0 ? md.booker_id : null;

  const { data: rtRow, error: rtErr } = await supabase
    .from("room_types")
    .select("id, name, base_price, hotel_id, final_price, weekly_nightly_rate, monthly_nightly_rate")
    .eq("id", room_type_id)
    .maybeSingle();

  if (rtErr || !rtRow) {
    log("error", "room_type_lookup_failed", { room_type_id, rtErr });
    await refundSessionIfNeeded(stripe, session);
    return new Response(JSON.stringify({ received: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  const { data: hotelRow } = await supabase.from("hotels").select("name").eq("id", rtRow.hotel_id).maybeSingle();
  const hotelName = (hotelRow as { name?: string } | null)?.name ?? "";

  const amountTotal = session.amount_total != null ? Number(session.amount_total) / 100 : null;
  const pi = session.payment_intent;
  const paymentIntentId = typeof pi === "string" ? pi : pi?.id ?? "";

  const cin = new Date(check_in_date + "T12:00:00Z");
  const cout = new Date(check_out_date + "T12:00:00Z");
  const nights = Math.max(1, Math.round((cout.getTime() - cin.getTime()) / (86400 * 1000)));
  const finalPrice = Number((rtRow as { final_price?: number | null }).final_price ?? rtRow.base_price ?? 0);
  const weeklyNightly = (rtRow as { weekly_nightly_rate?: number | null }).weekly_nightly_rate;
  const monthlyNightly = (rtRow as { monthly_nightly_rate?: number | null }).monthly_nightly_rate;
  const computed = computeStayPricing({
    finalPrice,
    weeklyNightly: weeklyNightly != null ? Number(weeklyNightly) : null,
    monthlyNightly: monthlyNightly != null ? Number(monthlyNightly) : null,
    nights,
  });

  const mdList = md.list_price_subtotal != null && String(md.list_price_subtotal).length > 0
    ? Number(md.list_price_subtotal)
    : NaN;
  const mdEff = md.effective_nightly != null && String(md.effective_nightly).length > 0
    ? Number(md.effective_nightly)
    : NaN;
  const mdTier = typeof md.pricing_tier === "string" && md.pricing_tier.trim().length > 0
    ? md.pricing_tier.trim()
    : "";

  const listSubtotal = Number.isFinite(mdList) ? mdList : computed.listSubtotal;
  let effectiveNightly = Number.isFinite(mdEff) ? mdEff : computed.effectiveNightly;
  let pricingTier = ["standard", "weekly", "monthly"].includes(mdTier) ? mdTier : computed.tier;

  if (amountTotal != null && nights > 0) {
    const implied = amountTotal / nights;
    if (Number.isFinite(implied)) {
      effectiveNightly = implied;
    }
  }

  const rpcPayload = {
    p_room_type_id: room_type_id,
    p_check_in_date: check_in_date,
    p_check_out_date: check_out_date,
    p_booker_id: booker_id,
    p_guest_first_name: md.guest_first_name ?? "",
    p_guest_last_name: md.guest_last_name ?? "",
    p_guest_email: md.guest_email ?? "",
    p_guest_phone: md.guest_phone ?? "",
    p_stripe_checkout_session_id: session.id,
    p_stripe_payment_intent_id: paymentIntentId,
    p_total_price: amountTotal,
    p_currency: (session.currency ?? "inr").toUpperCase(),
    p_price_per_night_snap: effectiveNightly,
    p_room_type_name_snap: (rtRow.name as string) ?? "",
    p_hotel_name_snap: hotelName,
    p_list_price_subtotal: listSubtotal,
    p_pricing_tier: pricingTier,
    p_negotiated_discount_type: null,
    p_negotiated_discount_value: null,
    p_negotiated_note: null,
  };

  let lastErr: Error | null = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const { data: bookingId, error: rpcError } = await supabase.rpc("assign_room_and_create_booking", rpcPayload);
    if (!rpcError && bookingId) {
      log("info", "booking_created", { bookingId, session: session.id, attempt });
      await supabase.from("stripe_webhook_events").insert({
        id: event.id,
        event_type: event.type,
        payload: { session_id: session.id, booking_id: bookingId } as unknown as Record<string, unknown>,
      });
      try {
        const conf = await processBookingConfirmation(supabase, bookingId as string);
        log("info", "booking_confirmation_pipeline", { bookingId, ...conf });
      } catch (e) {
        log("warn", "booking_confirmation_pipeline_error", { bookingId, detail: String(e) });
      }
      return new Response(JSON.stringify({ received: true, bookingId }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    lastErr = rpcError as Error;
    log("warn", "rpc_attempt_failed", { attempt, detail: String(rpcError) });
    await new Promise((r) => setTimeout(r, 150 * attempt));
  }

  log("error", "booking_failed_after_retries", { session: session.id, lastErr: String(lastErr) });
  await refundSessionIfNeeded(stripe, session);
  await supabase.from("stripe_webhook_events").insert({
    id: event.id,
    event_type: event.type + ":failed",
    payload: { session_id: session.id, error: String(lastErr) } as unknown as Record<string, unknown>,
  });
  return new Response(JSON.stringify({ received: true, refunded: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

async function refundSessionIfNeeded(stripe: Stripe, session: Stripe.Checkout.Session) {
  try {
    const pi = session.payment_intent;
    const pid = typeof pi === "string" ? pi : pi?.id;
    if (!pid) {
      log("warn", "refund_skipped_no_payment_intent", { session: session.id });
      return;
    }
    await stripe.refunds.create({ payment_intent: pid });
    log("info", "refund_created", { session: session.id, payment_intent: pid });
  } catch (e) {
    log("error", "refund_failed", { session: session.id, detail: String(e) });
  }
}
