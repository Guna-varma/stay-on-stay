/**
 * Success-page fallback: confirm Stripe session is paid and booking exists; if paid but missing booking, retry RPC once.
 * POST body: { session_id: string }
 */
import Stripe from "https://esm.sh/stripe@14.21.0?dts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = (await req.json()) as { session_id?: string };
    const sessionId = body.session_id?.trim();
    if (!sessionId) {
      return new Response(JSON.stringify({ error: "missing_session_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: existing } = await supabase
      .from("bookings")
      .select("id, hotel_id, check_in_date, check_out_date, status, stripe_checkout_session_id, hotel_name_snapshot, room_type_name_snapshot, total_price, currency")
      .eq("stripe_checkout_session_id", sessionId)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({
          status: "confirmed",
          booking: existing,
          payment_status: session.payment_status,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (session.payment_status !== "paid") {
      return new Response(
        JSON.stringify({ status: "unpaid", payment_status: session.payment_status }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const md = session.metadata ?? {};
    const room_type_id = md.room_type_id;
    const check_in_date = md.check_in_date;
    const check_out_date = md.check_out_date;
    if (!room_type_id || !check_in_date || !check_out_date) {
      return new Response(
        JSON.stringify({ status: "paid_no_metadata", payment_status: session.payment_status }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const booker_id = md.booker_id && md.booker_id.length > 0 ? md.booker_id : null;

    const { data: rtRow } = await supabase
      .from("room_types")
      .select("id, name, base_price, hotel_id")
      .eq("id", room_type_id)
      .maybeSingle();

    if (!rtRow) {
      return new Response(JSON.stringify({ status: "recovery_failed", reason: "room_type_not_found" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: hotelRow } = await supabase.from("hotels").select("name").eq("id", rtRow.hotel_id).maybeSingle();
    const hotelName = (hotelRow as { name?: string } | null)?.name ?? "";

    const amountTotal = session.amount_total != null ? Number(session.amount_total) / 100 : null;
    const pi = session.payment_intent;
    const paymentIntentId = typeof pi === "string" ? pi : (pi as Stripe.PaymentIntent | null)?.id ?? "";

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
      p_price_per_night_snap: rtRow.base_price != null ? Number(rtRow.base_price) : null,
      p_room_type_name_snap: (rtRow.name as string) ?? "",
      p_hotel_name_snap: hotelName,
    };

    const { data: bookingId, error: rpcError } = await supabase.rpc("assign_room_and_create_booking", rpcPayload);

    if (!rpcError && bookingId) {
      const { data: row } = await supabase
        .from("bookings")
        .select("id, hotel_id, check_in_date, check_out_date, status, stripe_checkout_session_id, hotel_name_snapshot, room_type_name_snapshot, total_price, currency")
        .eq("id", bookingId)
        .single();

      return new Response(
        JSON.stringify({
          status: "confirmed",
          recovered: true,
          booking: row,
          payment_status: session.payment_status,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        status: "paid_no_booking",
        payment_status: session.payment_status,
        detail: rpcError ? String(rpcError.message) : "rpc_failed",
      }),
      { status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: "server_error", detail: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
