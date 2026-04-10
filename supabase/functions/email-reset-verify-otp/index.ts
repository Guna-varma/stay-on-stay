/**
 * Verify email OTP, return recovery token_hash for client verifyOtp → PASSWORD_RECOVERY session.
 * Body: { "email": "user@example.com", "code": "123456" }
 * Secrets: EMAIL_RESET_OTP_PEPPER or WHATSAPP_OTP_PEPPER, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { sha256Hex } from "../_shared/whatsapp-otp.ts";

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

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const pepper =
    Deno.env.get("EMAIL_RESET_OTP_PEPPER")?.trim() ||
    Deno.env.get("WHATSAPP_OTP_PEPPER")?.trim() ||
    "";

  if (!supabaseUrl || !serviceKey || !pepper) {
    return new Response(JSON.stringify({ error: "server_misconfigured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: { email?: string; code?: string };
  try {
    body = (await req.json()) as { email?: string; code?: string };
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const raw = (body.email ?? "").trim().toLowerCase();
  const code = (body.code ?? "").replace(/\D/g, "");

  if (!raw || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw) || code.length < 4 || code.length > 8) {
    return new Response(JSON.stringify({ error: "invalid_email_or_code" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: canonical, error: lookErr } = await supabase.rpc("lookup_password_reset_email", {
    p_email: raw,
  });

  if (lookErr || !canonical || typeof canonical !== "string") {
    return new Response(JSON.stringify({ error: "invalid_or_expired_code" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: row, error: selErr } = await supabase
    .from("email_password_reset_otp")
    .select("code_hash, expires_at, digits")
    .eq("email", canonical)
    .maybeSingle();

  if (selErr) {
    console.error("email_password_reset_otp select", selErr.message);
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

  const r = row as { code_hash: string; expires_at: string; digits: number };
  if (new Date(r.expires_at).getTime() < Date.now()) {
    await supabase.from("email_password_reset_otp").delete().eq("email", canonical);
    return new Response(JSON.stringify({ error: "invalid_or_expired_code" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (code.length !== r.digits) {
    return new Response(JSON.stringify({ error: "invalid_or_expired_code" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const gotHash = await sha256Hex(`${canonical.toLowerCase()}:${code}:${pepper}`);
  if (gotHash !== r.code_hash) {
    return new Response(JSON.stringify({ error: "invalid_or_expired_code" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  await supabase.from("email_password_reset_otp").delete().eq("email", canonical);

  const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
    type: "recovery",
    email: canonical,
  });

  if (linkErr || !linkData?.properties?.hashed_token) {
    console.error("generateLink recovery", linkErr?.message);
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
