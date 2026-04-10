/** Pure validation helpers for auth forms (unit-tested; no React / Supabase). */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  const t = email.trim();
  return t.length <= 254 && EMAIL_RE.test(t);
}

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export function validatePassword(password: string): string | null {
  if (!password) return "Password is required";
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Password must be at most ${PASSWORD_MAX_LENGTH} characters`;
  }
  return null;
}

export function validatePasswordMatch(password: string, confirm: string): string | null {
  if (password !== confirm) return "Passwords do not match";
  return null;
}

export function validateFullName(name: string): string | null {
  const t = name.trim();
  if (!t) return "Full name is required";
  if (t.length < 2) return "Enter your full name";
  if (t.length > 120) return "Name is too long";
  return null;
}

export function validateOptionalPhone(phone: string): string | null {
  const t = phone.trim();
  if (!t) return null;
  const digits = t.replace(/\D/g, "");
  if (digits.length < 6 || digits.length > 15) return "Enter a valid phone number or leave blank";
  return null;
}

export type GenderValue = "male" | "female" | "other" | "prefer_not_to_say" | "";

export function validateGender(g: GenderValue): string | null {
  if (!g) return "Please select gender";
  return null;
}
