/**
 * Creates Stripe Checkout Session after availability + price checks (server-side).
 * Body: room_type_id, check_in_date, check_out_date, booker_id?, guest_*, success_url, cancel_url
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
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = (await req.json()) as Record<string, string | undefined>;
    const room_type_id = body.room_type_id;
    const check_in_date = body.check_in_date;
    const check_out_date = body.check_out_date;
    const success_url = body.success_url;
    const cancel_url = body.cancel_url;

    if (!room_type_id || !check_in_date || !check_out_date || !success_url || !cancel_url) {
      return new Response(JSON.stringify({ error: "missing_fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: avail, error: availErr } = await supabase.rpc("count_available_rooms", {
      p_room_type_id: room_type_id,
      p_check_in_date: check_in_date,
      p_check_out_date: check_out_date,
    });

    if (availErr) {
      return new Response(JSON.stringify({ error: "availability_check_failed", detail: availErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if ((avail ?? 0) < 1) {
      return new Response(JSON.stringify({ error: "sold_out" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const guestEmail = (body.guest_email ?? "").trim().toLowerCase();
    if (guestEmail.length > 0) {
      const { data: dupRows, error: dupErr } = await supabase.rpc("guest_has_overlapping_booking", {
        p_room_type_id: room_type_id,
        p_check_in_date: check_in_date,
        p_check_out_date: check_out_date,
        p_guest_email: guestEmail,
      });
      if (!dupErr && dupRows === true) {
        return new Response(JSON.stringify({ error: "duplicate_booking", message: "You already have a booking for these dates and room type." }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const { data: rt, error: rtErr } = await supabase
      .from("room_types")
      .select("id, name, base_price, hotel_id")
      .eq("id", room_type_id)
      .maybeSingle();

    if (rtErr || !rt || rt.base_price == null) {
      return new Response(JSON.stringify({ error: "room_type_not_found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: hotelRow } = await supabase.from("hotels").select("name").eq("id", rt.hotel_id).maybeSingle();
    const hotelName = (hotelRow as { name?: string } | null)?.name ?? "Stay";

    const cin = new Date(check_in_date + "T12:00:00Z");
    const cout = new Date(check_out_date + "T12:00:00Z");
    const nights = Math.max(1, Math.round((cout.getTime() - cin.getTime()) / (86400 * 1000)));
    const unitAmountPaise = Math.round(Number(rt.base_price) * nights * 100);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "inr",
            unit_amount: unitAmountPaise,
            product_data: {
              name: `${hotelName} — ${rt.name}`,
              description: `${check_in_date} → ${check_out_date} (${nights} night(s))`,
            },
          },
        },
      ],
      success_url: success_url.includes("?") ? `${success_url}&session_id={CHECKOUT_SESSION_ID}` : `${success_url}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url,
      metadata: {
        room_type_id,
        check_in_date,
        check_out_date,
        booker_id: body.booker_id ?? "",
        guest_first_name: body.guest_first_name ?? "",
        guest_last_name: body.guest_last_name ?? "",
        guest_email: body.guest_email ?? "",
        guest_phone: body.guest_phone ?? "",
      },
    });

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "server_error", detail: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
