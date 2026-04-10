import { supabase } from "@/lib/supabase";

export interface SendWhatsAppVerificationResult {
  ok: boolean;
  sid?: string;
  status?: string;
}

/**
 * Sends a verification code via WhatsApp using the Supabase Edge Function + Twilio Content template.
 * `to` must be E.164 (e.g. +918287696453). `code` is usually 6 digits.
 *
 * Twilio credentials are only on the server (Supabase secrets), never in the Vite bundle.
 */
export async function sendWhatsAppVerificationCode(
  toE164: string,
  code: string,
): Promise<SendWhatsAppVerificationResult> {
  const { data, error } = await supabase.functions.invoke<SendWhatsAppVerificationResult & { error?: string }>(
    "send-whatsapp-verification",
    { body: { to: toE164, code } },
  );

  if (error) {
    throw new Error(error.message ?? "invoke_failed");
  }
  if (data && "error" in data && data.error) {
    throw new Error(String(data.error));
  }
  if (!data?.ok) {
    throw new Error("unexpected_response");
  }
  return data;
}

/**
 * Request a 6-digit sign-in code on WhatsApp. Only sends if this E.164 matches a phone saved in
 * `user_contacts` (same number as onboarding). Response is always `{ ok: true }` when the phone
 * format is valid so unregistered numbers are not revealed.
 */
export async function requestWhatsAppSignInOtp(phoneE164: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke<{ ok?: boolean; error?: string }>(
    "whatsapp-signin-request-otp",
    { body: { phone: phoneE164 } },
  );
  if (error) throw new Error(error.message ?? "invoke_failed");
  if (data?.error) throw new Error(String(data.error));
  if (!data?.ok) throw new Error("unexpected_response");
}

/**
 * Verifies the WhatsApp code and establishes a Supabase session (magic link exchange).
 * Requires the account to have an email (normal for this app).
 */
export async function verifyWhatsAppSignInOtp(phoneE164: string, code: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke<{
    ok?: boolean;
    token_hash?: string;
    error?: string;
    message?: string;
  }>("whatsapp-signin-verify-otp", { body: { phone: phoneE164, code } });

  if (error) throw new Error(error.message ?? "invoke_failed");
  if (data?.error) {
    const msg = data.message ? `${data.error}: ${data.message}` : String(data.error);
    throw new Error(msg);
  }
  const tokenHash = data?.token_hash;
  if (!tokenHash) throw new Error("missing_token");

  const { error: vErr } = await supabase.auth.verifyOtp({
    type: "magiclink",
    token_hash: tokenHash,
  });
  if (vErr) throw vErr;
}
