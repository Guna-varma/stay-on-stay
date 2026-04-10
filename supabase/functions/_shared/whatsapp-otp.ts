export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Six-digit numeric OTP. */
export function randomOtp6(): string {
  return randomOtpDigits(6);
}

/** Numeric OTP with fixed length (4–8). */
export function randomOtpDigits(length: number): string {
  const n = Math.min(8, Math.max(4, Math.floor(length)));
  const min = 10 ** (n - 1);
  const range = 9 * min;
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return String(min + (Number(buf[0] % range)));
}
