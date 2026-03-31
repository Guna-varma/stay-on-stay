export interface IdentityInput {
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  email?: string | null;
}

function normalize(value?: string | null): string {
  return (value ?? "").trim();
}

function splitName(name?: string | null): string[] {
  return normalize(name)
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function getDisplayName(input: IdentityInput): string {
  const firstName = normalize(input.firstName);
  const lastName = normalize(input.lastName);
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  if (fullName) return fullName;

  const derivedName = normalize(input.name);
  if (derivedName) return derivedName;

  return normalize(input.email);
}

export function getInitials(input: IdentityInput): string {
  const firstName = normalize(input.firstName);
  const lastName = normalize(input.lastName);

  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }

  if (firstName) {
    return firstName.slice(0, 2).toUpperCase();
  }

  const parts = splitName(input.name);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  const email = normalize(input.email);
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }

  return "U";
}
