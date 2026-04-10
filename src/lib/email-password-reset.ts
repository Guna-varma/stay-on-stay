import { supabase } from "@/lib/supabase";

export const EMAIL_RESET_OTP_DIGITS = 6;

/**
 * Sends a numeric OTP to the address if it exists in auth (same response either way).
 */
export async function requestEmailPasswordResetOtp(email: string): Promise<{ digits: number }> {
  const { data, error } = await supabase.functions.invoke<{
    ok?: boolean;
    error?: string;
  }>("email-reset-request-otp", { body: { email: email.trim().toLowerCase() } });

  if (error) throw new Error(error.message ?? "invoke_failed");
  if (data?.error) throw new Error(String(data.error));
  if (!data?.ok) throw new Error("unexpected_response");
  return { digits: EMAIL_RESET_OTP_DIGITS };
}

/** Verifies OTP and opens a Supabase PASSWORD_RECOVERY session (then use /reset-password). */
export async function verifyEmailPasswordResetOtp(email: string, code: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke<{
    ok?: boolean;
    token_hash?: string;
    error?: string;
  }>("email-reset-verify-otp", { body: { email: email.trim().toLowerCase(), code } });

  if (error) throw new Error(error.message ?? "invoke_failed");
  if (data?.error) throw new Error(String(data.error));
  const tokenHash = data?.token_hash;
  if (!tokenHash) throw new Error("missing_token");

  const { error: vErr } = await supabase.auth.verifyOtp({
    type: "recovery",
    token_hash: tokenHash,
  });
  if (vErr) throw vErr;
}
