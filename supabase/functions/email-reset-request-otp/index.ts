/**
 * Send numeric OTP for password reset (SMTP from env). Supabase Auth “reset email” is not used here.
 * Body: { "email": "user@example.com" }
 * Secrets: SMTP_*, EMAIL_RESET_OTP_PEPPER or WHATSAPP_OTP_PEPPER,
 *          SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { sendSmtpMail } from "../_shared/smtp-send.ts";
import { randomOtpDigits, sha256Hex } from "../_shared/whatsapp-otp.ts";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EMAIL_RESET_OTP_DIGITS = 6;

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

  const host = Deno.env.get("SMTP_HOST")?.trim() ?? "";
  const port = parseInt(Deno.env.get("SMTP_PORT") ?? "587", 10);
  const user = Deno.env.get("SMTP_USER")?.trim() ?? "";
  const pass = Deno.env.get("SMTP_PASS") ?? "";
  const fromAddr = Deno.env.get("SMTP_SENDER_EMAIL")?.trim() || user;
  const fromName = Deno.env.get("SMTP_SENDER_NAME")?.trim() || "StayOnStay";

  if (!supabaseUrl || !serviceKey || !pepper || !host || !user || !pass || !fromAddr) {
    return new Response(JSON.stringify({ error: "server_misconfigured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: { email?: string };
  try {
    body = (await req.json()) as { email?: string };
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const raw = (body.email ?? "").trim().toLowerCase();
  const digits = EMAIL_RESET_OTP_DIGITS;

  if (!raw || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
    return new Response(JSON.stringify({ error: "invalid_email" }), {
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

  if (lookErr) {
    console.error("lookup_password_reset_email", lookErr.message);
    return new Response(JSON.stringify({ error: "lookup_failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!canonical || typeof canonical !== "string") {
    return new Response(JSON.stringify({ ok: true, digits }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const code = randomOtpDigits(digits);
  const codeHash = await sha256Hex(`${canonical.toLowerCase()}:${code}:${pepper}`);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  const { error: upErr } = await supabase.from("email_password_reset_otp").upsert(
    {
      email: canonical,
      code_hash: codeHash,
      digits,
      expires_at: expiresAt,
    },
    { onConflict: "email" },
  );

  if (upErr) {
    console.error("email_password_reset_otp upsert", upErr.message);
    return new Response(JSON.stringify({ error: "store_failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const subject = `${fromName} — password reset code`;
  const text = `Your password reset code is: ${code}\n\nIt expires in 15 minutes. If you did not request this, ignore this email.`;
  const html = `<p>Your password reset code is:</p><p style="font-size:22px;font-weight:bold;letter-spacing:4px">${code}</p><p>This code expires in 15 minutes.</p><p>If you did not request a reset, you can ignore this email.</p>`;

  try {
    await sendSmtpMail({
      host,
      port,
      user,
      pass,
      fromAddr,
      fromName,
      to: canonical,
      subject,
      text,
      html,
    });
  } catch (e) {
    console.error("smtp send", e);
    await supabase.from("email_password_reset_otp").delete().eq("email", canonical);
    return new Response(JSON.stringify({ error: "send_failed" }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, digits }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
