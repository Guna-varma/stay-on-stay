/**
 * Sends a WhatsApp message using a Twilio Content Template (e.g. "Verification Codes").
 * Body JSON: { "to": "+918287696453", "code": "409173" }
 * Secrets: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM, TWILIO_VERIFICATION_CONTENT_SID
 */
import { normalizeWhatsAppFrom, normalizeWhatsAppTo, sendTwilioWhatsAppContentTemplate } from "../_shared/twilio-whatsapp.ts";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID") ?? "";
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN") ?? "";
  const fromRaw = Deno.env.get("TWILIO_WHATSAPP_FROM") ?? "whatsapp:+14155238886";
  const contentSid = Deno.env.get("TWILIO_VERIFICATION_CONTENT_SID") ?? "HX229f5a04fd0510ce1b071852155d3e75";

  if (!accountSid || !authToken) {
    return new Response(JSON.stringify({ error: "server_misconfigured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: { to?: string; code?: string };
  try {
    body = (await req.json()) as { to?: string; code?: string };
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const toWa = body.to ? normalizeWhatsAppTo(body.to) : null;
  const code = (body.code ?? "").trim();

  if (!toWa || !isValidCode(code)) {
    return new Response(JSON.stringify({ error: "invalid_to_or_code" }), {
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
    return new Response(JSON.stringify({ error: twilio.message, status: twilio.status }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      ok: true,
      sid: twilio.sid,
      status: twilio.status,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
