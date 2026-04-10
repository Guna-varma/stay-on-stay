/**
 * Verify WhatsApp OTP and return a one-time magic-link token_hash for Supabase verifyOtp.
 * Body: { "phone": "+918287696453", "code": "409173" }
 * Client then: supabase.auth.verifyOtp({ type: 'magiclink', token_hash })
 * Secrets: WHATSAPP_OTP_PEPPER, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { sha256Hex } from "../_shared/whatsapp-otp.ts";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function normalizeE164(phone: string): string | null {
  const t = phone.trim();
  const withPlus = t.startsWith("+") ? t : `+${t.replace(/^\+/, "")}`;
  return /^\+\d{10,15}$/.test(withPlus) ? withPlus : null;
}

function isValidCode(code: string): boolean {
  return /^\d{4,8}$/.test(code.trim());
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

  if (!pepper || !supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: "server_misconfigured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: { phone?: string; code?: string };
  try {
    body = (await req.json()) as { phone?: string; code?: string };
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const e164 = body.phone ? normalizeE164(body.phone) : null;
  const code = (body.code ?? "").trim();
  if (!e164 || !isValidCode(code)) {
    return new Response(JSON.stringify({ error: "invalid_phone_or_code" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: row, error: selErr } = await supabase
    .from("whatsapp_signin_otp")
    .select("user_id, code_hash, expires_at")
    .eq("phone_e164", e164)
    .maybeSingle();

  if (selErr) {
    console.error("whatsapp_signin_otp select", selErr.message);
    return new Response(JSON.stringify({ error: "verify_failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!row) {
    return new Response(JSON.stringify({ error: "invalid_or_expired_code" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const expiresAt = new Date((row as { expires_at: string }).expires_at);
  if (expiresAt.getTime() < Date.now()) {
    await supabase.from("whatsapp_signin_otp").delete().eq("phone_e164", e164);
    return new Response(JSON.stringify({ error: "invalid_or_expired_code" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const expectedHash = (row as { code_hash: string }).code_hash;
  const gotHash = await sha256Hex(`${e164}:${code}:${pepper}`);
  if (gotHash !== expectedHash) {
    return new Response(JSON.stringify({ error: "invalid_or_expired_code" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userId = (row as { user_id: string }).user_id;
  await supabase.from("whatsapp_signin_otp").delete().eq("phone_e164", e164);

  const { data: userRes, error: userErr } = await supabase.auth.admin.getUserById(userId);
  if (userErr || !userRes?.user?.email) {
    return new Response(
      JSON.stringify({
        error: "no_email_on_account",
        message: "Add an email to your account or use email / Google sign-in.",
      }),
      { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const email = userRes.user.email;

  const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  if (linkErr || !linkData?.properties?.hashed_token) {
    console.error("generateLink", linkErr?.message);
    return new Response(JSON.stringify({ error: "session_bootstrap_failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      ok: true,
      token_hash: linkData.properties.hashed_token,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
