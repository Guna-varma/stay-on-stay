/**
 * Request WhatsApp OTP for sign-in (only if phone matches user_contacts).
 * Body: { "phone": "+918287696453" }
 * Secrets: TWILIO_*, WHATSAPP_OTP_PEPPER, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { normalizeWhatsAppFrom, normalizeWhatsAppTo, sendTwilioWhatsAppContentTemplate } from "../_shared/twilio-whatsapp.ts";
import { randomOtp6, sha256Hex } from "../_shared/whatsapp-otp.ts";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function normalizeE164(phone: string): string | null {
  const t = phone.trim();
  const withPlus = t.startsWith("+") ? t : `+${t.replace(/^\+/, "")}`;
  return /^\+\d{10,15}$/.test(withPlus) ? withPlus : null;
}

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

  const pepper = Deno.env.get("WHATSAPP_OTP_PEPPER") ?? "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID") ?? "";
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN") ?? "";
  const fromRaw = Deno.env.get("TWILIO_WHATSAPP_FROM") ?? "whatsapp:+14155238886";
  const contentSid = Deno.env.get("TWILIO_VERIFICATION_CONTENT_SID") ?? "HX229f5a04fd0510ce1b071852155d3e75";

  if (!pepper || !supabaseUrl || !serviceKey || !accountSid || !authToken) {
    return new Response(JSON.stringify({ error: "server_misconfigured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: { phone?: string };
  try {
    body = (await req.json()) as { phone?: string };
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const e164 = body.phone ? normalizeE164(body.phone) : null;
  if (!e164) {
    return new Response(JSON.stringify({ error: "invalid_phone" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userId, error: rpcErr } = await supabase.rpc("find_user_id_by_phone_e164", {
    p_e164: e164,
  });

  if (rpcErr) {
    console.error("find_user_id_by_phone_e164", rpcErr.message);
    return new Response(JSON.stringify({ error: "lookup_failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Do not reveal whether the number is registered (same response shape).
  if (!userId) {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const code = randomOtp6();
  const codeHash = await sha256Hex(`${e164}:${code}:${pepper}`);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const { error: upsertErr } = await supabase.from("whatsapp_signin_otp").upsert(
    {
      phone_e164: e164,
      code_hash: codeHash,
      user_id: userId as string,
      expires_at: expiresAt,
    },
    { onConflict: "phone_e164" },
  );

  if (upsertErr) {
    console.error("whatsapp_signin_otp upsert", upsertErr.message);
    return new Response(JSON.stringify({ error: "store_failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const toWa = normalizeWhatsAppTo(e164);
  if (!toWa) {
    return new Response(JSON.stringify({ error: "invalid_phone" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const twilio = await sendTwilioWhatsAppContentTemplate({
    accountSid,
    authToken,
    fromWa: normalizeWhatsAppFrom(fromRaw),
    toWa,
    contentSid,
    code,
  });

  if (!twilio.ok) {
    console.error("twilio send", twilio.message);
    await supabase.from("whatsapp_signin_otp").delete().eq("phone_e164", e164);
    return new Response(JSON.stringify({ error: "send_failed" }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
