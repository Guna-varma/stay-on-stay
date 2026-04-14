import { createClient } from "@supabase/supabase-js";
import type { Session, SignOutScope, User } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// -----------------------------------------------------------------------------
// Session & user (production auth; JWT handled by Supabase)
// -----------------------------------------------------------------------------
// Supabase Auth uses JWT: getSession() returns session.access_token (JWT) and
// session.refresh_token. The client sends the JWT in the Authorization header;
// Supabase validates it and RLS uses auth.uid() from the JWT. No custom JWT logic.

/** Get current session; refreshes token if needed. Use for initial load and auth checks. */
export async function getSession(): Promise<{ data: { session: Session | null }; error: Error | null }> {
  return supabase.auth.getSession();
}

/** Get current user from session. */
export async function getUser(): Promise<{ data: { user: User | null }; error: Error | null }> {
  return supabase.auth.getUser();
}

/** Sign out and clear session. */
export async function logout(scope: SignOutScope = "local"): Promise<{ error: Error | null }> {
  return supabase.auth.signOut({ scope });
}

/** Sign out only the current device/browser session. */
export async function logoutCurrentDevice(): Promise<{ error: Error | null }> {
  return logout("local");
}

/**
 * Sign out across all devices by revoking refresh tokens for every session.
 * Existing access tokens remain valid until they expire.
 */
export async function logoutAllDevices(): Promise<{ error: Error | null }> {
  return logout("global");
}

// -----------------------------------------------------------------------------
// Google OAuth (redirects to Google then back to app; post-login redirect to /dashboard)
// -----------------------------------------------------------------------------

/** Sign in with Google OAuth. Redirects the browser to Google; user returns to redirectTo with session in URL hash. */
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        prompt: "select_account",
      },
    },
  });
  if (error) throw error;
  if (data?.url) window.location.href = data.url;
  return data;
}

/** Email + password sign-in (Supabase Auth). */
export async function signInWithEmailPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
  if (error) throw error;
  return data;
}

export interface SignUpMetadata {
  full_name: string;
  gender: string;
  phone?: string;
}

/** Register with email/password; metadata stored on raw_user_meta_data for triggers / display. */
export async function signUpWithEmailPassword(email: string, password: string, meta: SignUpMetadata) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/login`,
      data: {
        full_name: meta.full_name.trim(),
        gender: meta.gender,
        phone: meta.phone?.trim() || null,
      },
    },
  });
  if (error) throw error;
  return data;
}

/** Sends password reset email (Supabase delivers mail — configure Gmail SMTP in Dashboard; see .env.example). */
export async function sendPasswordResetEmail(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
  return data;
}

/** Call on /reset-password after user opens the email link (session established from URL hash). */
export async function updateUserPassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
  return data;
}

/** Send OTP to phone (E.164). Supabase → Twilio SMS. */
export async function signInWithOtp(phone: string) {
  const { data, error } = await supabase.auth.signInWithOtp({
    phone: phone.startsWith("+") ? phone : `+${phone}`,
    options: { channel: "sms" },
  });
  if (error) throw error;
  return data;
}

/** Verify OTP and create session */
export async function verifyOtp(phone: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    phone: phone.startsWith("+") ? phone : `+${phone}`,
    token,
    type: "sms",
  });
  if (error) throw error;
  return data;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

// -----------------------------------------------------------------------------
// Profile (RBAC): fetch role from public.profiles; used by AuthProvider
// -----------------------------------------------------------------------------

export type ProfileRole = "customer" | "owner" | "manager" | "admin";

export interface Profile {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: ProfileRole;
  created_at: string;
  updated_at: string | null;
  is_active: boolean;
  deactivated_at: string | null;
  deactivated_by: string | null;
  deactivation_reason: string | null;
}

/** Fetch the current user's profile (id, email, role). RLS: users can read own row. */
export async function getProfile(userId: string): Promise<{ data: Profile | null; error: Error | null }> {
  return getCachedOrFetch(
    `profile_${userId}`,
    async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, first_name, last_name, avatar_url, role, created_at, updated_at, is_active, deactivated_at, deactivated_by, deactivation_reason")
        .eq("id", userId)
        .single();
      if (error) return { data: null, error };
      return { data: data as Profile, error: null };
    },
    CACHE_TTL.PROFILE
  );
}

// -----------------------------------------------------------------------------
// Onboarding (first-time user: Name + Mobile required)
// -----------------------------------------------------------------------------

export interface OnboardingStatus {
  complete: boolean;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  countryCode: string | null;
}

export interface UserPhone {
  countryCode: string | null;
  phone: string | null;
}

export async function getUserPhone(userId: string): Promise<{ data: UserPhone | null; error: Error | null }> {
  return getCachedOrFetch(
    `phone_${userId}`,
    async () => {
      const { data, error } = await supabase
        .from("user_contacts")
        .select("country_code, phone_number")
        .eq("user_id", userId)
        .eq("contact_type", "phone")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) return { data: null, error };

      return {
        data: {
          countryCode: (data as { country_code: string | null } | null)?.country_code ?? null,
          phone: (data as { phone_number: string | null } | null)?.phone_number ?? null,
        },
        error: null,
      };
    },
    CACHE_TTL.PHONE
  );
}

/** First-time = profile has no name or no phone. Existing = has name + at least one phone. */
export async function getOnboardingStatus(userId: string): Promise<{
  data: OnboardingStatus | null;
  error: Error | null;
}> {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", userId)
    .single();
  if (profileError) return { data: null, error: profileError };

  const { data: contacts } = await supabase
    .from("user_contacts")
    .select("country_code, phone_number")
    .eq("user_id", userId)
    .eq("contact_type", "phone")
    .limit(1);
  const phoneRow = contacts?.[0] as { country_code: string | null; phone_number: string | null } | undefined;

  const firstName = (profile as { first_name: string | null } | null)?.first_name ?? null;
  const lastName = (profile as { last_name: string | null } | null)?.last_name ?? null;
  const phone = phoneRow?.phone_number ?? null;
  const countryCode = phoneRow?.country_code ?? null;

  const hasFirstName = Boolean((firstName ?? "").trim());
  const hasLastName = Boolean((lastName ?? "").trim());
  const hasPhone = Boolean((phone ?? "").trim());
  const complete = hasFirstName && hasLastName && hasPhone;

  return {
    data: { complete, firstName, lastName, phone, countryCode },
    error: null,
  };
}

/** Update current user's name (onboarding). RLS: profiles_update_own. */
export async function updateProfileName(
  userId: string,
  first_name: string,
  last_name: string
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from("profiles")
    .update({ first_name: first_name.trim() || null, last_name: last_name.trim() || null })
    .eq("id", userId);
  return { error };
}

/** Upsert primary phone for user (onboarding). RLS: user_contacts_own_all. */
export async function upsertUserPhone(
  userId: string,
  countryCode: string,
  phoneNumber: string
): Promise<{ error: Error | null }> {
  const code = (countryCode || "").trim() || null;
  const num = (phoneNumber || "").trim();
  if (!num) return { error: new Error("Phone number is required") as Error };

  const { data: existing } = await supabase
    .from("user_contacts")
    .select("id")
    .eq("user_id", userId)
    .eq("contact_type", "phone")
    .limit(1)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("user_contacts")
      .update({ country_code: code, phone_number: num })
      .eq("id", (existing as { id: string }).id);
    return { error };
  }
  const { error } = await supabase.from("user_contacts").insert({
    user_id: userId,
    contact_type: "phone",
    country_code: code,
    phone_number: num,
  });
  return { error };
}

// -----------------------------------------------------------------------------
// Admin-only: update user role (RLS enforces: only admin, and not self)
// -----------------------------------------------------------------------------

/**
 * Update another user's role. Call only from admin UI.
 * Server-side RLS allows UPDATE only when current user is admin and target id <> auth.uid().
 * Prevents privilege escalation and self-role changes.
 */
export async function updateUserRole(
  targetUserId: string,
  role: ProfileRole
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", targetUserId);
  return { error };
}

/**
 * List all profiles. Only succeeds for admin (RLS: admin can SELECT all).
 * Use in admin user-management UI.
 */
export async function listProfilesForAdmin(): Promise<{ data: Profile[]; error: Error | null }> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, first_name, last_name, avatar_url, role, created_at, updated_at, is_active, deactivated_at, deactivated_by, deactivation_reason")
    .order("created_at", { ascending: false });
  if (error) return { data: [], error };
  return { data: (data ?? []) as Profile[], error: null };
}

export interface AdminUserListCursor {
  createdAt: string;
  id: string;
}

export interface AdminUserListFilters {
  search?: string;
  role?: ProfileRole | "all";
  isActive?: boolean | "all";
  pageSize?: number;
  cursor?: AdminUserListCursor | null;
}

export interface AdminManageUserPayload {
  targetUserId: string;
  role?: ProfileRole;
  isActive?: boolean;
  reason?: string | null;
}

export interface AdminManageUserResult {
  action: "set_role" | "set_status";
  user: Profile;
  message?: string;
}

export async function listUsersForAdmin(
  filters: AdminUserListFilters = {}
): Promise<{ data: Profile[]; error: Error | null; nextCursor: AdminUserListCursor | null }> {
  const pageSize = Math.min(Math.max(filters.pageSize ?? 50, 1), 100);
  const { data, error } = await supabase.rpc("admin_list_users", {
    search_text: filters.search?.trim() ? filters.search.trim() : null,
    filter_role: filters.role && filters.role !== "all" ? filters.role : null,
    filter_active: typeof filters.isActive === "boolean" ? filters.isActive : null,
    cursor_created_at: filters.cursor?.createdAt ?? null,
    cursor_id: filters.cursor?.id ?? null,
    page_size: pageSize,
  });

  if (error) return { data: [], error, nextCursor: null };

  const rows = (data ?? []) as Profile[];
  const lastRow = rows.length === pageSize ? rows[rows.length - 1] : null;

  return {
    data: rows,
    error: null,
    nextCursor: lastRow ? { createdAt: lastRow.created_at, id: lastRow.id } : null,
  };
}

async function invokeAdminManageUser(
  body: Record<string, unknown>
): Promise<{ data: AdminManageUserResult | null; error: Error | null }> {
  const { data, error } = await supabase.functions.invoke("admin-manage-user", { body });
  if (error) return { data: null, error };
  return { data: (data as AdminManageUserResult) ?? null, error: null };
}

export async function adminUpdateUserRole(
  input: Required<Pick<AdminManageUserPayload, "targetUserId" | "role">>
): Promise<{ data: AdminManageUserResult | null; error: Error | null }> {
  return invokeAdminManageUser({
    action: "set_role",
    targetUserId: input.targetUserId,
    role: input.role,
  });
}

export async function adminUpdateUserStatus(
  input: Required<Pick<AdminManageUserPayload, "targetUserId" | "isActive">> & Pick<AdminManageUserPayload, "reason">
): Promise<{ data: AdminManageUserResult | null; error: Error | null }> {
  return invokeAdminManageUser({
    action: "set_status",
    targetUserId: input.targetUserId,
    isActive: input.isActive,
    reason: input.reason?.trim() ? input.reason.trim() : null,
  });
}


// -----------------------------------------------------------------------------
// Owner/Manager hotel + room operations
// -----------------------------------------------------------------------------

export type RoomStatus = "available" | "occupied" | "maintenance" | "cleaning";
export type WalkInDraftStatus = "draft" | "room_held" | "docs_pending" | "ready" | "completed" | "cancelled" | "expired";
export type WalkInDocumentStatus = "missing" | "partial" | "complete";
export type RoomHoldStatus = "active" | "consumed" | "expired" | "cancelled";
export type WalkInSubjectKind = "primary_guest" | "companion";

export interface HotelRecord {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  /** Owner-provided Google Maps link to the property */
  google_maps_url?: string | null;
  image_url: string | null;
  owner_id: string;
  created_at: string;
}

export interface RoomTypeRecord {
  id: string;
  hotel_id: string;
  name: string;
  description: string | null;
  max_guests: number | null;
  base_price: number | null;
  discount_type: string;
  discount_value: number;
  final_price: number | null;
  /** Optional lower nightly rate for stays of 7+ nights. */
  weekly_nightly_rate: number | null;
  /** Optional nightly rate for stays of 28+ nights (overrides weekly when applicable). */
  monthly_nightly_rate: number | null;
  created_at: string;
}

export interface RoomRecord {
  id: string;
  hotel_id: string;
  room_type_id: string | null;
  room_number: string;
  status: RoomStatus;
  created_at: string;
}

export interface WalkInDraftGuestPayload {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  country_code?: string;
  nationality?: string;
  guest_category?: "domestic" | "foreign";
  guestCategory?: "domestic" | "foreign";
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state_region?: string;
  country?: string;
  postal_code?: string;
  id_type?: string;
  id_number?: string;
  passport_number?: string;
  passport_expiry_date?: string;
  passport_issued_country?: string;
  visa_type?: string;
  visa_expiry_date?: string;
  preferred_language?: string;
  notes?: string;
  visa_required?: boolean;
}

export interface WalkInCompanionPayload {
  temp_key: string;
  full_name: string;
  relationship?: string;
  nationality?: string;
  guest_category?: "domestic" | "foreign";
  document_type?: string;
  document_number?: string;
}

export interface WalkInDraftRecord {
  id: string;
  draft_code: string;
  hotel_id: string;
  created_by: string;
  assigned_operator_id: string;
  taken_over_by: string | null;
  taken_over_at: string | null;
  assigned_room_id: string | null;
  primary_guest_id: string | null;
  status: WalkInDraftStatus;
  guest_payload: WalkInDraftGuestPayload;
  companions_payload: WalkInCompanionPayload[];
  check_in_date: string;
  check_out_date: string;
  guest_category: "domestic" | "foreign" | null;
  primary_guest_name: string | null;
  primary_phone: string | null;
  document_status: WalkInDocumentStatus;
  last_activity_at: string;
  revision: number;
  hold_expires_at: string | null;
  completed_booking_id: string | null;
  created_at: string;
  updated_at: string;
  cancelled_at: string | null;
}

export interface WalkInDraftQueueRecord {
  id: string;
  draft_code: string;
  hotel_id: string;
  assigned_operator_id: string;
  assigned_operator_name: string | null;
  assigned_room_id: string | null;
  room_number: string | null;
  status: WalkInDraftStatus;
  guest_category: "domestic" | "foreign" | null;
  primary_guest_name: string | null;
  primary_phone: string | null;
  document_status: WalkInDocumentStatus;
  hold_expires_at: string | null;
  created_at: string;
  updated_at: string;
  is_owner: boolean;
  can_take_over: boolean;
}

export interface RoomHoldRecord {
  id: string;
  hotel_id: string;
  room_id: string;
  draft_id: string;
  held_by: string;
  expires_at: string;
  status: RoomHoldStatus;
  created_at: string;
}

export interface GuestDocumentRecord {
  id: string;
  hotel_id: string;
  draft_id: string | null;
  booking_id: string | null;
  guest_id: string | null;
  companion_id: string | null;
  subject_kind: WalkInSubjectKind;
  subject_temp_key: string | null;
  document_type: string;
  is_required: boolean;
  file_name: string;
  storage_path: string;
  mime_type: string;
  file_size: number;
  checksum: string | null;
  document_number: string | null;
  issued_country: string | null;
  uploaded_via: "frontdesk";
  verification_status: "pending" | "verified" | "rejected";
  uploaded_by: string | null;
  uploaded_at: string;
  notes: string | null;
}

export interface FrontdeskBookingRecord {
  id: string;
  booking_code: string | null;
  booking_source: string | null;
  check_in_date: string;
  check_out_date: string;
  status: "confirmed" | "checked_in";
  room_id: string;
  room_type_name_snapshot: string | null;
  frontdesk_notes: string | null;
  room: { room_number: string | null } | null;
  guest: {
    first_name: string | null;
    last_name: string | null;
    nationality: string | null;
    passport_number: string | null;
    id_type: string | null;
    id_number: string | null;
  } | null;
}

export interface CheckoutQueueRecord {
  booking_id: string;
  guest_name: string;
  room_no: string;
  scheduled_checkout_date: string;
  balance_due: number;
  checkout_ready: boolean;
  blockers: string[];
  next_room_state: "cleaning" | "inspection" | "available";
  estimated_available_at: string | null;
}

export interface CheckoutPreviewRecord extends CheckoutQueueRecord {
  hotel_id: string;
  status: string;
}

export interface CheckoutProcessResult {
  processed: boolean;
  result_type: "processed" | "already_checked_out";
  booking_id: string;
  room_id: string;
  room_no: string;
  booking_status: string;
  room_state: string;
  task_id: string | null;
}

export interface RoomAvailabilityRecord {
  room_id: string;
  room_no: string;
  occupancy_status: string;
  housekeeping_status: string;
  effective_room_state: "available" | "booked" | "occupied" | "checkout_due" | "cleaning" | "blocked";
  unavailable_reason: string;
  estimated_available_at: string | null;
  next_check_in_at: string | null;
}

export interface WalkInPreflightResult {
  can_finalize: boolean;
  blockers: string[];
  hold_expires_at: string | null;
  effective_room_state: string;
  document_status: WalkInDocumentStatus;
}

export interface TakeOverWalkInDraftResult {
  draft_id: string;
  assigned_operator_id: string;
  hold_expires_at: string | null;
}

export interface RoomTypeSeedInput {
  name: string;
  description?: string;
  maxGuests?: number;
  basePrice?: number;
  discountType?: "none" | "percentage" | "flat";
  discountValue?: number;
  weeklyNightlyRate?: number | null;
  monthlyNightlyRate?: number | null;
  roomCount: number;
  roomPrefix?: string;
  /** Optional gallery images per room type (uploaded after room_type row exists). */
  images?: File[];
}

export interface CreateHotelInput {
  name: string;
  description?: string;
  address?: string;
  city?: string;
  country?: string;
  imageFile?: File;
  roomTypes?: RoomTypeSeedInput[];
}

export interface OwnerPromotableUser {
  user_id: string;
  email: string | null;
  created_at: string;
}

export interface OwnerManagerAssignment {
  assignment_id: string;
  user_id: string;
  email: string | null;
  hotel_id: string;
  created_at: string;
}

export interface OwnerManagerActionInput {
  ownerId: string;
  userId: string;
  hotelId: string;
}

/** Target file sizes (KB) for tiered hotel / room imagery. */
export const IMAGE_COMPRESSION_TARGETS_KB = {
  thumbnail: 50,
  /** Hotel hero / cover uploads (Supabase `hotel-images` bucket). */
  hotelCover: 100,
  listing: 120,
  detail: 320,
} as const;

/** Max longest edge (px) before lowering quality — downscale first keeps detail sharper at a given byte budget. */
export const IMAGE_MAX_EDGE_PX = {
  thumbnail: 640,
  hotelCover: 1920,
  listing: 1400,
  detail: 2400,
} as const;

export interface CompressImageOptions {
  maxEdgePx?: number;
  /** WebP often beats JPEG at the same visual quality and is allowed on `hotel-images`. Falls back to JPEG if unsupported. */
  preferWebP?: boolean;
}

function browserSupportsWebP(): boolean {
  if (typeof document === "undefined") return false;
  const c = document.createElement("canvas");
  c.width = 1;
  c.height = 1;
  return c.toDataURL("image/webp").startsWith("data:image/webp");
}

async function fileToImage(file: File): Promise<HTMLImageElement> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read image"));
    reader.readAsDataURL(file);
  });

  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Invalid image file"));
    img.src = dataUrl;
  });
}

async function canvasToBlobMime(canvas: HTMLCanvasElement, mime: string, quality: number): Promise<Blob> {
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Image compression failed"));
          return;
        }
        resolve(blob);
      },
      mime,
      quality
    );
  });
}

/**
 * Compresses an image to at most `maxKb` (binary KB). Uses high-quality downscaling and WebP when available
 * so the result stays visually sharp; hard cap on bytes still implies lossy encoding for large photos.
 */
export async function compressImageToMaxKB(file: File, maxKb = 50, options: CompressImageOptions = {}): Promise<File> {
  const maxBytes = maxKb * 1024;
  if (file.size <= maxBytes) return file;
  if (typeof window === "undefined") throw new Error("Image compression is available only in browser context");

  const maxEdgePx = options.maxEdgePx ?? 1920;
  const wantWebP = options.preferWebP === true && browserSupportsWebP();

  const tryEncode = async (mime: "image/webp" | "image/jpeg", ext: string): Promise<File> => {
    const img = await fileToImage(file);
    let w = img.naturalWidth || img.width;
    let h = img.naturalHeight || img.height;
    const edge = Math.max(w, h);
    if (edge > maxEdgePx) {
      const f = maxEdgePx / edge;
      w = Math.round(w * f);
      h = Math.round(h * f);
    }

    const baseName = file.name.replace(/\.[^.]+$/, "") || "image";

    for (let round = 0; round < 18; round++) {
      let quality = mime === "image/webp" ? 0.92 : 0.9;
      while (quality >= 0.42) {
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, w);
        canvas.height = Math.max(1, h);
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas context unavailable for image compression");
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, w, h);

        const blob = await canvasToBlobMime(canvas, mime, quality);
        if (blob.size <= maxBytes) {
          return new File([blob], `${baseName}.${ext}`, { type: mime });
        }
        quality -= mime === "image/webp" ? 0.05 : 0.06;
      }
      w = Math.max(320, Math.round(w * 0.9));
      h = Math.max(240, Math.round(h * 0.9));
    }

    throw new Error(`Unable to compress image below ${maxKb}KB. Try a smaller source image.`);
  };

  if (wantWebP) {
    try {
      return await tryEncode("image/webp", "webp");
    } catch {
      /* fall through to JPEG */
    }
  }
  return await tryEncode("image/jpeg", "jpg");
}

export async function uploadHotelImageCompressed(ownerId: string, imageFile: File): Promise<{ data: { path: string; publicUrl: string } | null; error: Error | null }> {
  try {
    const compressed = await compressImageToMaxKB(imageFile, IMAGE_COMPRESSION_TARGETS_KB.hotelCover, {
      maxEdgePx: IMAGE_MAX_EDGE_PX.hotelCover,
      preferWebP: true,
    });
    const ext = compressed.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${ownerId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("hotel-images")
      .upload(path, compressed, { upsert: false, contentType: compressed.type });

    if (uploadError) return { data: null, error: uploadError as Error };

    const { data: publicData } = supabase.storage.from("hotel-images").getPublicUrl(path);
    return { data: { path, publicUrl: publicData.publicUrl }, error: null };
  } catch (e) {
    return { data: null, error: e as Error };
  }
}

export async function insertRoomTypeImage(
  roomTypeId: string,
  imageUrl: string,
  sortOrder: number,
  isPrimary: boolean
): Promise<{ error: Error | null }> {
  const { error } = await supabase.from("room_type_images").insert({
    room_type_id: roomTypeId,
    image_url: imageUrl,
    sort_order: sortOrder,
    is_primary: isPrimary,
  });
  return { error };
}

export async function insertHotelImage(
  hotelId: string,
  imageUrl: string,
  sortOrder: number,
): Promise<{ error: Error | null }> {
  const { error } = await supabase.from("hotel_images").insert({
    hotel_id: hotelId,
    image_url: imageUrl,
    sort_order: sortOrder,
  });
  return { error };
}

export async function uploadRoomTypeImageCompressed(
  ownerId: string,
  roomTypeId: string,
  imageFile: File,
  maxKb = IMAGE_COMPRESSION_TARGETS_KB.detail
): Promise<{ data: { path: string; publicUrl: string } | null; error: Error | null }> {
  try {
    const compressed = await compressImageToMaxKB(imageFile, maxKb, {
      maxEdgePx: IMAGE_MAX_EDGE_PX.detail,
      preferWebP: true,
    });
    const ext = compressed.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${ownerId}/room-types/${roomTypeId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("hotel-images")
      .upload(path, compressed, { upsert: false, contentType: compressed.type });
    if (uploadError) return { data: null, error: uploadError as Error };
    const { data: publicData } = supabase.storage.from("hotel-images").getPublicUrl(path);
    return { data: { path, publicUrl: publicData.publicUrl }, error: null };
  } catch (e) {
    return { data: null, error: e as Error };
  }
}

export async function listHotelsForOwner(ownerId: string): Promise<{ data: HotelRecord[]; error: Error | null }> {
  const { data, error } = await supabase
    .from("hotels")
    .select("id, name, description, address, city, country, google_maps_url, image_url, owner_id, created_at")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error) return { data: [], error };
  return { data: (data ?? []) as HotelRecord[], error: null };
}

export async function listOwnerHotels(ownerId: string): Promise<{ data: HotelRecord[]; error: Error | null }> {
  return listHotelsForOwner(ownerId);
}

export async function listRoomTypesByHotel(hotelId: string): Promise<{ data: RoomTypeRecord[]; error: Error | null }> {
  const { data, error } = await supabase
    .from("room_types")
    .select(
      "id, hotel_id, name, description, max_guests, base_price, discount_type, discount_value, final_price, weekly_nightly_rate, monthly_nightly_rate, created_at",
    )
    .eq("hotel_id", hotelId)
    .order("created_at", { ascending: true });

  if (error) return { data: [], error };
  return { data: (data ?? []) as RoomTypeRecord[], error: null };
}

export async function listRoomsByHotel(hotelId: string): Promise<{ data: RoomRecord[]; error: Error | null }> {
  const { data, error } = await supabase
    .from("rooms")
    .select("id, hotel_id, room_type_id, room_number, status, created_at")
    .eq("hotel_id", hotelId)
    .order("room_number", { ascending: true });

  if (error) return { data: [], error };
  return { data: (data ?? []) as RoomRecord[], error: null };
}

export async function createRoomType(
  hotelId: string,
  input: {
    name: string;
    description?: string;
    maxGuests?: number;
    basePrice?: number;
    discountType?: string;
    discountValue?: number;
    weeklyNightlyRate?: number | null;
    monthlyNightlyRate?: number | null;
  },
): Promise<{ data: RoomTypeRecord | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("room_types")
    .insert({
      hotel_id: hotelId,
      name: input.name,
      description: input.description?.trim() || null,
      max_guests: input.maxGuests ?? null,
      base_price: input.basePrice ?? null,
      discount_type: input.discountType ?? "none",
      discount_value: input.discountValue ?? 0,
      weekly_nightly_rate: input.weeklyNightlyRate ?? null,
      monthly_nightly_rate: input.monthlyNightlyRate ?? null,
    })
    .select(
      "id, hotel_id, name, description, max_guests, base_price, discount_type, discount_value, final_price, weekly_nightly_rate, monthly_nightly_rate, created_at",
    )
    .single();

  if (error) return { data: null, error };
  return { data: data as RoomTypeRecord, error: null };
}

export async function createRoom(hotelId: string, input: { roomTypeId?: string; roomNumber: string; status?: RoomStatus }): Promise<{ data: RoomRecord | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("rooms")
    .insert({
      hotel_id: hotelId,
      room_type_id: input.roomTypeId ?? null,
      room_number: input.roomNumber,
      status: input.status ?? "available",
    })
    .select("id, hotel_id, room_type_id, room_number, status, created_at")
    .single();

  if (error) return { data: null, error };
  return { data: data as RoomRecord, error: null };
}

export async function updateRoomStatus(roomId: string, status: RoomStatus): Promise<{ error: Error | null }> {
  const { error } = await supabase.from("rooms").update({ status }).eq("id", roomId);
  return { error };
}

function deriveDraftShadowFields(guestPayload: WalkInDraftGuestPayload) {
  const guestCategory =
    guestPayload.guest_category ??
    guestPayload.guestCategory ??
    null;
  const first = guestPayload.first_name?.trim() ?? "";
  const last = guestPayload.last_name?.trim() ?? "";
  return {
    guest_category: guestCategory,
    primary_guest_name: [first, last].filter(Boolean).join(" ").trim() || null,
    primary_phone: guestPayload.phone?.trim() || null,
  };
}

function normalizeWalkInDraftRow(row: any): WalkInDraftRecord {
  return {
    id: String(row.id),
    draft_code: String(row.draft_code),
    hotel_id: String(row.hotel_id),
    created_by: String(row.created_by),
    assigned_operator_id: String(row.assigned_operator_id),
    taken_over_by: row.taken_over_by ? String(row.taken_over_by) : null,
    taken_over_at: row.taken_over_at ?? null,
    assigned_room_id: row.assigned_room_id ? String(row.assigned_room_id) : null,
    primary_guest_id: row.primary_guest_id ? String(row.primary_guest_id) : null,
    status: row.status as WalkInDraftStatus,
    guest_payload: (row.guest_payload ?? {}) as WalkInDraftGuestPayload,
    companions_payload: Array.isArray(row.companions_payload) ? (row.companions_payload as WalkInCompanionPayload[]) : [],
    check_in_date: String(row.check_in_date),
    check_out_date: String(row.check_out_date),
    guest_category: (row.guest_category as "domestic" | "foreign" | null) ?? null,
    primary_guest_name: row.primary_guest_name ?? null,
    primary_phone: row.primary_phone ?? null,
    document_status: row.document_status as WalkInDocumentStatus,
    last_activity_at: String(row.last_activity_at),
    revision: Number(row.revision ?? 1),
    hold_expires_at: row.hold_expires_at ?? null,
    completed_booking_id: row.completed_booking_id ?? null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    cancelled_at: row.cancelled_at ?? null,
  };
}

function normalizeWalkInDraftQueueRow(row: any): WalkInDraftQueueRecord {
  return {
    id: String(row.id),
    draft_code: String(row.draft_code),
    hotel_id: String(row.hotel_id),
    assigned_operator_id: String(row.assigned_operator_id),
    assigned_operator_name: row.assigned_operator_name ?? null,
    assigned_room_id: row.assigned_room_id ? String(row.assigned_room_id) : null,
    room_number: row.room_number ?? null,
    status: row.status as WalkInDraftStatus,
    guest_category: (row.guest_category as "domestic" | "foreign" | null) ?? null,
    primary_guest_name: row.primary_guest_name ?? null,
    primary_phone: row.primary_phone ?? null,
    document_status: row.document_status as WalkInDocumentStatus,
    hold_expires_at: row.hold_expires_at ?? null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    is_owner: Boolean(row.is_owner),
    can_take_over: Boolean(row.can_take_over),
  };
}

const FRONTDESK_ALLOWED_DOCUMENT_TYPES = new Set([
  "passport",
  "visa",
  "government_id",
  "address_proof",
  "other",
]);

const FRONTDESK_ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const FRONTDESK_MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

export async function createHotelWithRooms(ownerId: string, payload: CreateHotelInput): Promise<{ data: { hotel: HotelRecord; roomTypes: RoomTypeRecord[]; rooms: RoomRecord[] } | null; error: Error | null }> {
  try {
    let imageUrl: string | null = null;
    if (payload.imageFile) {
      const uploaded = await uploadHotelImageCompressed(ownerId, payload.imageFile);
      if (uploaded.error) return { data: null, error: uploaded.error };
      imageUrl = uploaded.data?.publicUrl ?? null;
    }

    const { data: hotelData, error: hotelError } = await supabase
      .from("hotels")
      .insert({
        owner_id: ownerId,
        name: payload.name,
        description: payload.description?.trim() || null,
        address: payload.address?.trim() || null,
        city: payload.city?.trim() || null,
        country: payload.country?.trim() || null,
        image_url: imageUrl,
      })
      .select("id, name, description, address, city, country, image_url, owner_id, created_at")
      .single();

    if (hotelError) return { data: null, error: hotelError };

    const hotel = hotelData as HotelRecord;
    const createdTypes: RoomTypeRecord[] = [];
    const createdRooms: RoomRecord[] = [];

    for (const typeInput of payload.roomTypes ?? []) {
      if (!typeInput.name?.trim()) continue;

      const createdType = await createRoomType(hotel.id, {
        name: typeInput.name.trim(),
        description: typeInput.description,
        maxGuests: typeInput.maxGuests,
        basePrice: typeInput.basePrice,
        discountType: typeInput.discountType,
        discountValue: typeInput.discountValue,
        weeklyNightlyRate: typeInput.weeklyNightlyRate ?? null,
        monthlyNightlyRate: typeInput.monthlyNightlyRate ?? null,
      });
      if (createdType.error || !createdType.data) return { data: null, error: createdType.error ?? new Error("Could not create room type") };
      createdTypes.push(createdType.data);

      const imgs = typeInput.images ?? [];
      for (let imgIdx = 0; imgIdx < imgs.length; imgIdx++) {
        const up = await uploadRoomTypeImageCompressed(ownerId, createdType.data.id, imgs[imgIdx], 120);
        if (up.error) return { data: null, error: up.error };
        const ins = await insertRoomTypeImage(createdType.data.id, up.data!.publicUrl, imgIdx, imgIdx === 0);
        if (ins.error) return { data: null, error: ins.error };
      }

      const count = Math.max(0, Math.min(500, Math.floor(typeInput.roomCount || 0)));
      const prefix = (typeInput.roomPrefix?.trim() || typeInput.name.slice(0, 1) || "R").toUpperCase();

      for (let i = 1; i <= count; i++) {
        const roomNumber = `${prefix}${String(i).padStart(3, "0")}`;
        const createdRoom = await createRoom(hotel.id, {
          roomTypeId: createdType.data.id,
          roomNumber,
          status: "available",
        });
        if (createdRoom.error || !createdRoom.data) return { data: null, error: createdRoom.error ?? new Error("Could not create room") };
        createdRooms.push(createdRoom.data);
      }
    }

    return { data: { hotel, roomTypes: createdTypes, rooms: createdRooms }, error: null };
  } catch (e) {
    return { data: null, error: e as Error };
  }
}

export async function getManagerAssignedHotel(userId: string): Promise<{ data: HotelRecord | null; error: Error | null }> {
  const { data: assignment, error: assignmentError } = await supabase
    .from("hotel_staff")
    .select("hotel_id")
    .eq("user_id", userId)
    .eq("role", "manager")
    .limit(1)
    .maybeSingle();

  if (assignmentError) return { data: null, error: assignmentError };
  if (!assignment || !(assignment as { hotel_id?: string }).hotel_id) return { data: null, error: null };

  const hotelId = (assignment as { hotel_id: string }).hotel_id;
  const { data: hotel, error: hotelError } = await supabase
    .from("hotels")
    .select("id, name, description, address, city, country, image_url, owner_id, created_at")
    .eq("id", hotelId)
    .single();

  if (hotelError) return { data: null, error: hotelError };
  return { data: hotel as HotelRecord, error: null };
}

export async function createWalkInDraft(
  hotelId: string,
  createdBy: string,
  checkOutDate: string,
): Promise<{ data: WalkInDraftRecord | null; error: Error | null }> {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const fallbackCheckOut = tomorrow.toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("walkin_checkin_drafts")
    .insert({
      hotel_id: hotelId,
      created_by: createdBy,
      assigned_operator_id: createdBy,
      check_out_date: checkOutDate || fallbackCheckOut,
      guest_payload: {},
      companions_payload: [],
    })
    .select("*")
    .single();

  if (error) return { data: null, error };
  const sync = await supabase.rpc("sync_walkin_draft_document_status", { p_draft_id: data.id });
  if (sync.error) return { data: null, error: sync.error };
  const syncRow = Array.isArray(sync.data) ? sync.data[0] : sync.data;
  return { data: normalizeWalkInDraftRow(syncRow), error: null };
}

export async function updateWalkInDraft(
  draftId: string,
  updates: {
    guest_payload?: WalkInDraftGuestPayload;
    companions_payload?: WalkInCompanionPayload[];
    check_out_date?: string;
    primary_guest_id?: string | null;
  },
): Promise<{ data: WalkInDraftRecord | null; error: Error | null }> {
  const payload: Record<string, unknown> = {};
  if (updates.guest_payload) {
    payload.guest_payload = updates.guest_payload;
    Object.assign(payload, deriveDraftShadowFields(updates.guest_payload));
  }
  if (updates.companions_payload) payload.companions_payload = updates.companions_payload;
  if (updates.check_out_date) payload.check_out_date = updates.check_out_date;
  if (Object.prototype.hasOwnProperty.call(updates, "primary_guest_id")) {
    payload.primary_guest_id = updates.primary_guest_id;
  }

  const { error } = await supabase
    .from("walkin_checkin_drafts")
    .update(payload)
    .eq("id", draftId);

  if (error) return { data: null, error };

  const sync = await supabase.rpc("sync_walkin_draft_document_status", { p_draft_id: draftId });
  if (sync.error) return { data: null, error: sync.error };
  const syncRow = Array.isArray(sync.data) ? sync.data[0] : sync.data;
  return { data: normalizeWalkInDraftRow(syncRow), error: null };
}

export async function getWalkInDraftById(
  draftId: string,
): Promise<{ data: WalkInDraftRecord | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("walkin_checkin_drafts")
    .select("*")
    .eq("id", draftId)
    .single();
  if (error) return { data: null, error };
  return { data: normalizeWalkInDraftRow(data), error: null };
}

export async function listFrontdeskDraftQueue(
  hotelId: string,
): Promise<{ data: WalkInDraftQueueRecord[]; error: Error | null }> {
  const { data, error } = await supabase.rpc("list_frontdesk_draft_queue", { p_hotel_id: hotelId });
  if (error) return { data: [], error };
  const rows = Array.isArray(data) ? data : data ? [data] : [];
  return { data: rows.map(normalizeWalkInDraftQueueRow), error: null };
}

export async function listRoomHoldsForHotel(
  hotelId: string,
): Promise<{ data: RoomHoldRecord[]; error: Error | null }> {
  const expireResult = await supabase.rpc("expire_walkin_room_holds", { p_hotel_id: hotelId });
  if (expireResult.error) {
    console.warn("Failed to expire stale room holds before listing", expireResult.error);
  }
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("room_holds")
    .select("id, hotel_id, room_id, draft_id, held_by, expires_at, status, created_at")
    .eq("hotel_id", hotelId)
    .eq("status", "active")
    .gt("expires_at", nowIso);

  if (error) return { data: [], error };
  return { data: (data ?? []) as RoomHoldRecord[], error: null };
}

export async function listFrontdeskBookingsForHotel(
  hotelId: string,
): Promise<{ data: FrontdeskBookingRecord[]; error: Error | null }> {
  const today = new Date().toISOString().split("T")[0];
  // `bookings` in the current production schema does not have a `deleted_at` column.
  const { data, error } = await supabase
    .from("bookings")
    .select(`
      id,
      booking_code,
      booking_source,
      check_in_date,
      check_out_date,
      status,
      room_id,
      room_type_name_snapshot,
      frontdesk_notes,
      room:room_id(room_number),
      guest:guest_id(first_name, last_name, nationality, passport_number, id_type, id_number)
    `)
    .eq("hotel_id", hotelId)
    .eq("check_in_date", today)
    .in("status", ["confirmed", "checked_in"])
    .order("created_at", { ascending: false });

  if (error) return { data: [], error };
  return { data: (data ?? []) as FrontdeskBookingRecord[], error: null };
}

export async function listCheckoutQueueForHotel(
  hotelId: string,
  targetDate: string = new Date().toISOString().split("T")[0],
): Promise<{ data: CheckoutQueueRecord[]; error: Error | null }> {
  const { data, error } = await supabase.rpc("rpc_get_checkout_queue", {
    p_hotel_id: hotelId,
    p_target_date: targetDate,
  });
  if (error) return { data: [], error };
  const rows = Array.isArray(data) ? data : data ? [data] : [];
  return {
    data: rows.map((row) => ({
      booking_id: String(row.booking_id),
      guest_name: row.guest_name ?? "Guest",
      room_no: row.room_no ?? "Unknown",
      scheduled_checkout_date: String(row.scheduled_checkout_date),
      balance_due: Number(row.balance_due ?? 0),
      checkout_ready: Boolean(row.checkout_ready),
      blockers: Array.isArray(row.blockers) ? row.blockers.map(String) : [],
      next_room_state: (row.next_room_state ?? "cleaning") as "cleaning" | "inspection" | "available",
      estimated_available_at: row.estimated_available_at ?? null,
    })),
    error: null,
  };
}

export async function getCheckoutPreview(
  bookingId: string,
): Promise<{ data: CheckoutPreviewRecord | null; error: Error | null }> {
  const { data, error } = await supabase.rpc("rpc_get_checkout_preview", {
    p_booking_id: bookingId,
  });
  if (error) return { data: null, error };
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { data: null, error: null };
  return {
    data: {
      booking_id: String(row.booking_id),
      hotel_id: String(row.hotel_id),
      guest_name: row.guest_name ?? "Guest",
      room_no: row.room_no ?? "Unknown",
      status: row.status ?? "confirmed",
      scheduled_checkout_date: String(row.scheduled_checkout_date),
      balance_due: Number(row.balance_due ?? 0),
      checkout_ready: Boolean(row.checkout_ready),
      blockers: Array.isArray(row.blockers) ? row.blockers.map(String) : [],
      next_room_state: (row.next_room_state ?? "cleaning") as "cleaning" | "inspection" | "available",
      estimated_available_at: row.estimated_available_at ?? null,
    },
    error: null,
  };
}

export async function processCheckout(
  bookingId: string,
  input?: { paymentReceived?: number; markRoomDirty?: boolean; notes?: string },
): Promise<{ data: CheckoutProcessResult | null; error: Error | null }> {
  const { data, error } = await supabase.rpc("rpc_process_checkout", {
    p_booking_id: bookingId,
    p_payment_received: Number(input?.paymentReceived ?? 0),
    p_mark_room_dirty: input?.markRoomDirty ?? true,
    p_notes: input?.notes ?? null,
  });
  if (error) return { data: null, error };
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { data: null, error: null };
  invalidateCache("bookings");
  invalidateCache("rooms");
  invalidateCache("tasks");
  invalidateCache("manager_dashboard");
  return {
    data: {
      processed: Boolean(row.processed),
      result_type: row.result_type === "already_checked_out" ? "already_checked_out" : "processed",
      booking_id: String(row.booking_id),
      room_id: String(row.room_id),
      room_no: row.room_no ?? "Unknown",
      booking_status: row.booking_status ?? "checked_out",
      room_state: row.room_state ?? "cleaning",
      task_id: row.task_id ? String(row.task_id) : null,
    },
    error: null,
  };
}

export async function listRoomAvailabilityForHotel(
  hotelId: string,
): Promise<{ data: RoomAvailabilityRecord[]; error: Error | null }> {
  const { data, error } = await supabase.rpc("rpc_get_room_availability", { p_hotel_id: hotelId });
  if (error) return { data: [], error };
  const rows = Array.isArray(data) ? data : data ? [data] : [];
  return {
    data: rows.map((row) => ({
      room_id: String(row.room_id),
      room_no: row.room_no ?? "Unknown",
      occupancy_status: row.occupancy_status ?? "available",
      housekeeping_status: row.housekeeping_status ?? "clean",
      effective_room_state: (row.effective_room_state ?? "available") as RoomAvailabilityRecord["effective_room_state"],
      unavailable_reason: row.unavailable_reason ?? "Available",
      estimated_available_at: row.estimated_available_at ?? null,
      next_check_in_at: row.next_check_in_at ?? null,
    })),
    error: null,
  };
}

export async function holdRoomForWalkIn(
  draftId: string,
  roomId: string,
): Promise<{ data: { hold_id: string; hold_expires_at: string; effective_room_state: string } | null; error: Error | null }> {
  const { data, error } = await supabase.rpc("hold_room_for_walkin", {
    p_draft_id: draftId,
    p_room_id: roomId,
  });
  if (error) return { data: null, error };
  const row = Array.isArray(data) ? data[0] : data;
  return { data: row ?? null, error: null };
}

export async function releaseWalkInRoomHold(
  draftId: string,
): Promise<{ error: Error | null }> {
  const { error } = await supabase.rpc("release_walkin_room_hold", { p_draft_id: draftId });
  return { error };
}

export async function preflightWalkInCheckIn(
  draftId: string,
): Promise<{ data: WalkInPreflightResult | null; error: Error | null }> {
  const { data, error } = await supabase.rpc("preflight_walkin_checkin", { p_draft_id: draftId });
  if (error) return { data: null, error };
  const row = Array.isArray(data) ? data[0] : data;
  return { data: (row as WalkInPreflightResult) ?? null, error: null };
}

export async function finalizeWalkInCheckIn(
  draftId: string,
): Promise<{ data: { result_type: "created" | "already_completed"; booking_id: string; booking_code: string; guest_id: string; room_id: string; room_number: string; status: string } | null; error: Error | null }> {
  const { data, error } = await supabase.rpc("finalize_walkin_checkin", { p_draft_id: draftId });
  if (error) return { data: null, error };
  const row = Array.isArray(data) ? data[0] : data;
  invalidateCache("bookings");
  invalidateCache("rooms");
  return { data: row ?? null, error: null };
}

export async function cancelWalkInDraft(
  draftId: string,
): Promise<{ error: Error | null }> {
  const { error } = await supabase.rpc("cancel_walkin_draft", { p_draft_id: draftId });
  return { error };
}

export async function takeOverWalkInDraft(
  draftId: string,
): Promise<{ data: TakeOverWalkInDraftResult | null; error: Error | null }> {
  const { data, error } = await supabase.rpc("take_over_walkin_draft", { p_draft_id: draftId });
  if (error) return { data: null, error };
  const row = Array.isArray(data) ? data[0] : data;
  return {
    data: row
      ? {
          draft_id: String(row.draft_id),
          assigned_operator_id: String(row.assigned_operator_id),
          hold_expires_at: row.hold_expires_at ?? null,
        }
      : null,
    error: null,
  };
}

export async function listGuestDocumentsForDraft(
  draftId: string,
): Promise<{ data: GuestDocumentRecord[]; error: Error | null }> {
  const { data, error } = await supabase
    .from("guest_documents")
    .select("*")
    .eq("draft_id", draftId)
    .order("uploaded_at", { ascending: false });
  if (error) return { data: [], error };
  return { data: (data ?? []) as GuestDocumentRecord[], error: null };
}

export async function createSignedGuestDocumentUrl(
  storagePath: string,
  expiresInSeconds = 300,
): Promise<{ data: string | null; error: Error | null }> {
  const { data, error } = await supabase.storage
    .from("guest-documents")
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error) return { data: null, error };
  return { data: data.signedUrl, error: null };
}

export async function uploadGuestDocumentForDraft(input: {
  hotelId: string;
  draftId: string;
  subjectKind: WalkInSubjectKind;
  subjectTempKey?: string | null;
  documentType: string;
  file: File;
  isRequired?: boolean;
  documentNumber?: string | null;
  issuedCountry?: string | null;
  notes?: string | null;
}): Promise<{ data: GuestDocumentRecord | null; error: Error | null }> {
  const documentType = input.documentType.trim().toLowerCase();
  if (!FRONTDESK_ALLOWED_DOCUMENT_TYPES.has(documentType)) {
    return { data: null, error: new Error("Unsupported document type") };
  }
  if (!FRONTDESK_ALLOWED_MIME_TYPES.has(input.file.type)) {
    return { data: null, error: new Error("Unsupported file format") };
  }
  if (input.file.size > FRONTDESK_MAX_DOCUMENT_BYTES) {
    return { data: null, error: new Error("File exceeds 10MB limit") };
  }

  const ext = input.file.name.includes(".") ? input.file.name.split(".").pop()?.toLowerCase() : undefined;
  const safeExt = ext || (input.file.type === "application/pdf" ? "pdf" : "jpg");
  const subjectKey =
    input.subjectKind === "primary_guest"
      ? "primary"
      : input.subjectTempKey?.trim() || crypto.randomUUID();
  const storagePath = `hotels/${input.hotelId}/walkin-drafts/${input.draftId}/subjects/${subjectKey}/${documentType}/${crypto.randomUUID()}.${safeExt}`;

  const { error: uploadError } = await supabase.storage
    .from("guest-documents")
    .upload(storagePath, input.file, {
      upsert: false,
      contentType: input.file.type,
    });

  if (uploadError) return { data: null, error: uploadError as Error };

  const { data: currentUser } = await getUser();
  const { data, error } = await supabase
    .from("guest_documents")
    .insert({
      hotel_id: input.hotelId,
      draft_id: input.draftId,
      subject_kind: input.subjectKind,
      subject_temp_key: input.subjectKind === "companion" ? subjectKey : null,
      document_type: documentType,
      is_required: input.isRequired ?? false,
      file_name: input.file.name,
      storage_path: storagePath,
      mime_type: input.file.type,
      file_size: input.file.size,
      document_number: input.documentNumber?.trim() || null,
      issued_country: input.issuedCountry?.trim() || null,
      uploaded_by: currentUser.user?.id ?? null,
      notes: input.notes?.trim() || null,
    })
    .select("*")
    .single();

  if (error) {
    await supabase.storage.from("guest-documents").remove([storagePath]);
    return { data: null, error };
  }

  const syncResult = await supabase.rpc("sync_walkin_draft_document_status", { p_draft_id: input.draftId });
  if (syncResult.error) {
    console.warn("Failed to sync walk-in draft document status after upload", syncResult.error);
  }
  return { data: data as GuestDocumentRecord, error: null };
}

export async function deleteGuestDocument(
  documentId: string,
  storagePath: string,
  draftId?: string | null,
): Promise<{ error: Error | null }> {
  const { error: storageError } = await supabase.storage
    .from("guest-documents")
    .remove([storagePath]);
  if (storageError) return { error: storageError as Error };

  const { error } = await supabase
    .from("guest_documents")
    .delete()
    .eq("id", documentId);
  if (!error && draftId) {
    const syncResult = await supabase.rpc("sync_walkin_draft_document_status", { p_draft_id: draftId });
    if (syncResult.error) {
      console.warn("Failed to sync walk-in draft document status after delete", syncResult.error);
    }
  }
  return { error };
}

export interface FrontdeskGuestSearchResult {
  guest_id: string;
  full_name: string;
  email: string | null;
  nationality: string | null;
  phone: string | null;
  passport_number: string | null;
  id_type: string | null;
  id_number: string | null;
  match_type: "exact" | "similar";
}

export async function searchFrontdeskGuestMatches(
  hotelId: string,
  query: string,
): Promise<{ data: FrontdeskGuestSearchResult[]; error: Error | null }> {
  const q = query.trim();
  if (q.length < 3) return { data: [], error: null };
  const { data, error } = await supabase.rpc("search_frontdesk_guest_matches", {
    p_hotel_id: hotelId,
    p_query: q,
  });
  if (error) return { data: [], error };
  return {
    data: ((Array.isArray(data) ? data : data ? [data] : []) as any[]).map((row) => ({
      guest_id: String(row.guest_id),
      full_name: row.full_name ?? "Guest",
      email: row.email ?? null,
      nationality: row.nationality ?? null,
      phone: row.phone ?? null,
      passport_number: row.passport_number ?? null,
      id_type: row.id_type ?? null,
      id_number: row.id_number ?? null,
      match_type: row.match_type === "exact" ? "exact" : "similar",
    })),
    error: null,
  };
}

export async function listCustomersForOwnerPromotion(ownerId: string, hotelId: string, searchEmail?: string): Promise<{ data: OwnerPromotableUser[]; error: Error | null }> {
  if (!ownerId || !hotelId) return { data: [], error: new Error("ownerId and hotelId are required") };

  const { data, error } = await supabase.rpc("owner_list_promotable_customers", {
    target_hotel_id: hotelId,
    search_email: searchEmail?.trim() ? searchEmail.trim() : null,
  });
  if (error) return { data: [], error };

  return { data: (data ?? []) as OwnerPromotableUser[], error: null };
}

export async function findPromotableCustomerByEmail(
  ownerId: string,
  hotelId: string,
  email: string
): Promise<{ data: OwnerPromotableUser | null; error: Error | null }> {
  if (!ownerId || !hotelId) return { data: null, error: new Error("ownerId and hotelId are required") };
  const normalized = email.trim().toLowerCase();
  if (!normalized) return { data: null, error: new Error("email is required") };

  const { data, error } = await supabase.rpc("owner_find_promotable_customer_by_email", {
    target_hotel_id: hotelId,
    target_email: normalized,
  });
  if (error) return { data: null, error };
  const row = ((data ?? []) as OwnerPromotableUser[])[0] ?? null;
  return { data: row, error: null };
}

export async function listManagersForOwner(ownerId: string, hotelId: string, searchEmail?: string): Promise<{ data: OwnerManagerAssignment[]; error: Error | null }> {
  if (!ownerId || !hotelId) return { data: [], error: new Error("ownerId and hotelId are required") };

  const { data, error } = await supabase.rpc("owner_list_managers", {
    target_hotel_id: hotelId,
    search_email: searchEmail?.trim() ? searchEmail.trim() : null,
  });
  if (error) return { data: [], error };

  return { data: (data ?? []) as OwnerManagerAssignment[], error: null };
}

export async function assignManagerByOwner(input: OwnerManagerActionInput): Promise<{ error: Error | null }> {
  if (!input.ownerId || !input.userId || !input.hotelId) {
    return { error: new Error("ownerId, userId, and hotelId are required") };
  }

  const { error } = await supabase.rpc("owner_assign_manager", {
    target_user_id: input.userId,
    target_hotel_id: input.hotelId,
  });
  return { error };
}

export async function revokeManagerByOwner(input: OwnerManagerActionInput): Promise<{ error: Error | null }> {
  if (!input.ownerId || !input.userId || !input.hotelId) {
    return { error: new Error("ownerId, userId, and hotelId are required") };
  }

  const { error } = await supabase.rpc("owner_revoke_manager", {
    target_user_id: input.userId,
    target_hotel_id: input.hotelId,
  });
  return { error };
}

// -----------------------------------------------------------------------------
// Admin
// -----------------------------------------------------------------------------

export async function listHotelsForAdmin(): Promise<{ data: HotelRecord[]; error: Error | null }> {
  const { data, error } = await supabase
    .from("hotels")
    .select("id, name, description, address, city, country, image_url, owner_id, created_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) return { data: [], error };
  return { data: (data ?? []) as HotelRecord[], error: null };
}

export interface AdminStats {
  profileCount: number;
  hotelCount: number;
  bookingCount: number;
}

export async function getAdminStats(): Promise<{ data: AdminStats; error: Error | null }> {
  const [p, h, b] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("hotels").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("bookings").select("id", { count: "exact", head: true }),
  ]);
  const err = p.error || h.error || b.error;
  if (err) return { data: { profileCount: 0, hotelCount: 0, bookingCount: 0 }, error: err };
  return {
    data: {
      profileCount: p.count ?? 0,
      hotelCount: h.count ?? 0,
      bookingCount: b.count ?? 0,
    },
    error: null,
  };
}

export async function countAvailableRooms(
  roomTypeId: string,
  checkIn: string,
  checkOut: string
): Promise<{ data: number; error: Error | null }> {
  const { data, error } = await supabase.rpc("count_available_rooms", {
    p_room_type_id: roomTypeId,
    p_check_in_date: checkIn,
    p_check_out_date: checkOut,
  });
  if (error) return { data: 0, error };
  return { data: typeof data === "number" ? data : Number(data), error: null };
}

export async function invokeCreateCheckoutSession(
  body: Record<string, string>
): Promise<{ data: { url?: string; sessionId?: string; error?: string } | null; error: Error | null }> {
  const { data, error } = await supabase.functions.invoke("create-checkout-session", { body });
  if (error) return { data: null, error };
  return { data: data as { url?: string; sessionId?: string; error?: string }, error: null };
}

export async function invokeVerifyCheckoutSession(
  sessionId: string
): Promise<{ data: Record<string, unknown> | null; error: Error | null }> {
  const { data, error } = await supabase.functions.invoke("verify-checkout-session", {
    body: { session_id: sessionId },
  });
  if (error) return { data: null, error };
  return { data: (data as Record<string, unknown>) ?? null, error: null };
}

export interface PublicRoomTypeCard {
  id: string;
  hotel_id: string;
  name: string;
  description: string | null;
  max_guests: number | null;
  base_price: number | null;
  discount_type: string;
  discount_value: number;
  final_price: number | null;
  weekly_nightly_rate: number | null;
  monthly_nightly_rate: number | null;
  images: string[];
  room_numbers: string[];
  available_count?: number;
}

export interface AmenityRecord {
  id: string;
  name: string;
  icon: string | null;
}

export interface LandmarkRecord {
  id: string;
  hotel_id: string;
  name: string;
  google_maps_url: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface PublicHotelCard {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  /** Legacy single cover; first gallery image is mirrored here when uploading. */
  image_url: string | null;
  /** Up to 3 cover images (ordered); empty if only legacy image_url exists. */
  cover_images: string[];
  room_types: PublicRoomTypeCard[];
  amenities: AmenityRecord[];
  landmarks: LandmarkRecord[];
}

/** URLs for hero / carousel: gallery rows, else legacy image_url. */
export function publicHotelCoverUrls(h: PublicHotelCard): string[] {
  if (h.cover_images.length > 0) return h.cover_images;
  if (h.image_url) return [h.image_url];
  return [];
}

/**
 * RPC `get_public_hotel_catalog` JSON uses `rooms` on room types; app expects `room_numbers`.
 * Landmarks omit `hotel_id` in SQL — inject from parent hotel.
 */
function normalizePublicHotelCatalogFromRpc(raw: unknown): PublicHotelCard[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const h = item as Record<string, unknown>;
    const hid = String(h.id ?? "");
    const roomRaw = h.room_types;
    const room_types: PublicRoomTypeCard[] = Array.isArray(roomRaw)
      ? roomRaw.map((rt) => {
          const r = rt as Record<string, unknown>;
          const nums = r.room_numbers;
          const legacyRooms = r.rooms;
          const room_numbers = Array.isArray(nums)
            ? nums.map(String)
            : Array.isArray(legacyRooms)
              ? legacyRooms.map(String)
              : [];
          return {
            id: String(r.id ?? ""),
            hotel_id: String(r.hotel_id ?? hid),
            name: String(r.name ?? ""),
            description: (r.description as string | null) ?? null,
            max_guests: (r.max_guests as number | null) ?? null,
            base_price: (r.base_price as number | null) ?? null,
            discount_type: String(r.discount_type ?? "none"),
            discount_value: Number(r.discount_value ?? 0),
            final_price: (r.final_price as number | null) ?? (r.base_price as number | null) ?? null,
            weekly_nightly_rate:
              r.weekly_nightly_rate != null && r.weekly_nightly_rate !== ""
                ? Number(r.weekly_nightly_rate)
                : null,
            monthly_nightly_rate:
              r.monthly_nightly_rate != null && r.monthly_nightly_rate !== ""
                ? Number(r.monthly_nightly_rate)
                : null,
            images: Array.isArray(r.images) ? r.images.map(String) : [],
            room_numbers,
          };
        })
      : [];
    const amenities: AmenityRecord[] = Array.isArray(h.amenities)
      ? (h.amenities as Array<Record<string, unknown>>).map((a) => ({
          id: String(a.id ?? ""),
          name: String(a.name ?? ""),
          icon: (a.icon as string | null) ?? null,
        }))
      : [];
    const landmarks: LandmarkRecord[] = Array.isArray(h.landmarks)
      ? (h.landmarks as Array<Record<string, unknown>>).map((l) => ({
          id: String(l.id ?? ""),
          hotel_id: hid,
          name: String(l.name ?? ""),
          google_maps_url: (l.google_maps_url as string | null) ?? null,
          latitude: (l.latitude as number | null) ?? null,
          longitude: (l.longitude as number | null) ?? null,
        }))
      : [];
    const covers = h.cover_images;
    const cover_images = Array.isArray(covers) ? covers.map(String) : [];
    return {
      id: hid,
      name: String(h.name ?? ""),
      description: (h.description as string | null) ?? null,
      address: (h.address as string | null) ?? null,
      city: (h.city as string | null) ?? null,
      country: (h.country as string | null) ?? null,
      image_url: (h.image_url as string | null) ?? null,
      cover_images,
      room_types,
      amenities,
      landmarks,
    };
  });
}

export async function listPublicHotelsWithRoomTypes(): Promise<{ data: PublicHotelCard[]; error: Error | null }> {
  const { data, error } = await supabase.rpc("get_public_hotel_catalog");

  if (error) {
    if (import.meta.env.DEV) {
      console.warn("[stay-on-stay] get_public_hotel_catalog failed, using REST fallback:", error.message);
    }
    return listPublicHotelsWithRoomTypesLegacy();
  }

  if (data == null) {
    return listPublicHotelsWithRoomTypesLegacy();
  }

  try {
    const parsed = typeof data === "string" ? JSON.parse(data) : data;
    const hotels = normalizePublicHotelCatalogFromRpc(parsed);
    return { data: hotels, error: null };
  } catch (parseError) {
    if (import.meta.env.DEV) {
      console.warn("[stay-on-stay] hotel catalog RPC parse failed, using REST fallback:", parseError);
    }
    return listPublicHotelsWithRoomTypesLegacy();
  }
}

// Legacy implementation (kept as fallback)
async function listPublicHotelsWithRoomTypesLegacy(): Promise<{ data: PublicHotelCard[]; error: Error | null }> {
  const { data: hotels, error: hotelsError } = await supabase
    .from("hotels")
    .select("id, name, description, address, city, country, image_url")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (hotelsError) return { data: [], error: hotelsError };
  const hotelRows = (hotels ?? []) as Array<Record<string, unknown>>;
  if (hotelRows.length === 0) return { data: [], error: null };

  const hotelIds = hotelRows.map((h) => String(h.id));

  const [roomTypesResult, imagesResult, hotelCoverResult, amenitiesJoinResult, amenitiesResult, landmarksResult, roomsResult] = await Promise.all([
    supabase
      .from("room_types")
      .select(
        "id, hotel_id, name, description, max_guests, base_price, discount_type, discount_value, final_price, weekly_nightly_rate, monthly_nightly_rate",
      )
      .in("hotel_id", hotelIds)
      .is("deleted_at", null)
      .order("created_at", { ascending: true }),
    supabase
      .from("room_type_images")
      .select("room_type_id, image_url, sort_order")
      .order("sort_order", { ascending: true }),
    supabase
      .from("hotel_images")
      .select("hotel_id, image_url, sort_order")
      .in("hotel_id", hotelIds)
      .order("sort_order", { ascending: true }),
    supabase
      .from("hotel_amenities")
      .select("hotel_id, amenity_id")
      .in("hotel_id", hotelIds),
    supabase
      .from("amenities")
      .select("id, name, icon"),
    supabase
      .from("landmarks")
      .select("id, hotel_id, name, google_maps_url, latitude, longitude")
      .in("hotel_id", hotelIds),
    supabase
      .from("rooms")
      .select("room_type_id, room_number")
      .in("hotel_id", hotelIds)
      .order("room_number", { ascending: true }),
  ]);

  if (roomTypesResult.error) return { data: [], error: roomTypesResult.error };

  const roomTypeRows = (roomTypesResult.data ?? []) as Array<Record<string, unknown>>;
  const roomTypeIdSet = new Set(roomTypeRows.map((rt) => String(rt.id)));

  const imagesByType = new Map<string, string[]>();
  for (const row of (imagesResult.data ?? []) as Array<{ room_type_id: string; image_url: string }>) {
    if (!roomTypeIdSet.has(row.room_type_id)) continue;
    const arr = imagesByType.get(row.room_type_id) ?? [];
    arr.push(row.image_url);
    imagesByType.set(row.room_type_id, arr);
  }

  const amenityMap = new Map<string, AmenityRecord>();
  for (const a of (amenitiesResult.data ?? []) as Array<{ id: string; name: string; icon: string | null }>) {
    amenityMap.set(a.id, { id: a.id, name: a.name, icon: a.icon });
  }

  const amenitiesByHotel = new Map<string, AmenityRecord[]>();
  for (const row of (amenitiesJoinResult.data ?? []) as Array<{ hotel_id: string; amenity_id: string }>) {
    const amenity = amenityMap.get(row.amenity_id);
    if (!amenity) continue;
    const arr = amenitiesByHotel.get(row.hotel_id) ?? [];
    arr.push(amenity);
    amenitiesByHotel.set(row.hotel_id, arr);
  }

  const landmarksByHotel = new Map<string, LandmarkRecord[]>();
  for (const row of (landmarksResult.data ?? []) as Array<LandmarkRecord>) {
    const arr = landmarksByHotel.get(row.hotel_id) ?? [];
    arr.push(row);
    landmarksByHotel.set(row.hotel_id, arr);
  }

  const coverImagesByHotel = new Map<string, string[]>();
  for (const row of (hotelCoverResult.data ?? []) as Array<{ hotel_id: string; image_url: string }>) {
    const arr = coverImagesByHotel.get(row.hotel_id) ?? [];
    arr.push(row.image_url);
    coverImagesByHotel.set(row.hotel_id, arr);
  }

  const roomNumbersByType = new Map<string, string[]>();
  for (const row of (roomsResult.data ?? []) as Array<{ room_type_id: string | null; room_number: string }>) {
    if (!row.room_type_id) continue;
    const arr = roomNumbersByType.get(row.room_type_id) ?? [];
    arr.push(row.room_number);
    roomNumbersByType.set(row.room_type_id, arr);
  }

  const typesByHotel = new Map<string, PublicRoomTypeCard[]>();
  for (const rt of roomTypeRows) {
    const hotelId = String(rt.hotel_id);
    const arr = typesByHotel.get(hotelId) ?? [];
    arr.push({
      id: String(rt.id),
      hotel_id: hotelId,
      name: String(rt.name),
      description: (rt.description as string | null) ?? null,
      max_guests: (rt.max_guests as number | null) ?? null,
      base_price: (rt.base_price as number | null) ?? null,
      discount_type: String(rt.discount_type ?? "none"),
      discount_value: Number(rt.discount_value ?? 0),
      final_price: (rt.final_price as number | null) ?? (rt.base_price as number | null) ?? null,
      weekly_nightly_rate: (rt.weekly_nightly_rate as number | null) ?? null,
      monthly_nightly_rate: (rt.monthly_nightly_rate as number | null) ?? null,
      images: imagesByType.get(String(rt.id)) ?? [],
      room_numbers: roomNumbersByType.get(String(rt.id)) ?? [],
    });
    typesByHotel.set(hotelId, arr);
  }

  const normalized: PublicHotelCard[] = hotelRows.map((h) => {
    const hid = String(h.id);
    const gallery = coverImagesByHotel.get(hid) ?? [];
    return {
      id: hid,
      name: String(h.name),
      description: (h.description as string | null) ?? null,
      address: (h.address as string | null) ?? null,
      city: (h.city as string | null) ?? null,
      country: (h.country as string | null) ?? null,
      image_url: (h.image_url as string | null) ?? null,
      cover_images: gallery,
      room_types: typesByHotel.get(hid) ?? [],
      amenities: amenitiesByHotel.get(hid) ?? [],
      landmarks: landmarksByHotel.get(hid) ?? [],
    };
  });
  return { data: normalized, error: null };
}

const CATALOG_STORAGE_KEY = "sos_public_hotel_catalog_v1";
const CATALOG_TTL_MS = 5 * 60 * 1000; // public catalog — refresh periodically
const CATALOG_EMPTY_TTL_MS = 45 * 1000; // empty result may be transient

type CatalogCacheEntry = { data: PublicHotelCard[]; ts: number; isEmpty: boolean };

let _catalogMemoryCache: CatalogCacheEntry | null = null;
let _catalogFetchPromise: Promise<{ data: PublicHotelCard[]; error: Error | null }> | null = null;

function readCatalogSessionCache(): CatalogCacheEntry | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CATALOG_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { ts: number; data: PublicHotelCard[] };
    if (typeof parsed.ts !== "number" || !Array.isArray(parsed.data)) return null;
    return {
      data: parsed.data,
      ts: parsed.ts,
      isEmpty: parsed.data.length === 0,
    };
  } catch {
    return null;
  }
}

function writeCatalogSessionCache(entry: CatalogCacheEntry): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    const payload = JSON.stringify({ ts: entry.ts, data: entry.data });
    if (payload.length > 4_500_000) return;
    sessionStorage.setItem(CATALOG_STORAGE_KEY, payload);
  } catch {
    /* quota / private mode */
  }
}

function isCatalogEntryFresh(entry: CatalogCacheEntry, now: number): boolean {
  const ttl = entry.isEmpty ? CATALOG_EMPTY_TTL_MS : CATALOG_TTL_MS;
  return now - entry.ts < ttl;
}

/** Last non-empty catalog for stale-while-error (ignores TTL). */
function lastResortCatalogSnapshot(): PublicHotelCard[] | null {
  if (_catalogMemoryCache && _catalogMemoryCache.data.length > 0) {
    return _catalogMemoryCache.data;
  }
  const fromSession = readCatalogSessionCache();
  if (fromSession && fromSession.data.length > 0) return fromSession.data;
  return null;
}

/**
 * Synchronous read from sessionStorage for first paint (repeat visits).
 * Does not hit the network; a full fetch should still run to refresh.
 */
export function peekPublicHotelCatalogFromSessionStorage(): PublicHotelCard[] | null {
  const entry = readCatalogSessionCache();
  if (!entry || entry.data.length === 0) return null;
  return entry.data;
}

export async function listPublicHotelsWithRoomTypesCached(): Promise<{ data: PublicHotelCard[]; error: Error | null }> {
  const now = Date.now();

  if (_catalogMemoryCache && isCatalogEntryFresh(_catalogMemoryCache, now)) {
    return { data: _catalogMemoryCache.data, error: null };
  }

  const sessionEntry = readCatalogSessionCache();
  if (sessionEntry && isCatalogEntryFresh(sessionEntry, now)) {
    _catalogMemoryCache = sessionEntry;
    return { data: sessionEntry.data, error: null };
  }

  if (_catalogFetchPromise) {
    return _catalogFetchPromise;
  }

  _catalogFetchPromise = (async () => {
    const result = await listPublicHotelsWithRoomTypes();
    const ts = Date.now();

    if (!result.error) {
      const entry: CatalogCacheEntry = {
        data: result.data,
        ts,
        isEmpty: result.data.length === 0,
      };
      _catalogMemoryCache = entry;
      writeCatalogSessionCache(entry);
      return result;
    }

    const stale = lastResortCatalogSnapshot();
    if (stale && stale.length > 0) {
      if (import.meta.env.DEV) {
        console.warn("[stay-on-stay] Hotel catalog fetch failed; serving stale cache.", result.error?.message);
      }
      return { data: stale, error: null };
    }

    return result;
  })();

  try {
    return await _catalogFetchPromise;
  } finally {
    _catalogFetchPromise = null;
  }
}

export function invalidateCatalogCache() {
  _catalogMemoryCache = null;
  if (typeof sessionStorage !== "undefined") {
    try {
      sessionStorage.removeItem(CATALOG_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }
}

export async function getPublicHotelDetail(hotelId: string): Promise<{ data: PublicHotelCard | null; error: Error | null }> {
  const { data, error } = await listPublicHotelsWithRoomTypesCached();
  if (error) return { data: null, error };
  return { data: data.find((h) => h.id === hotelId) ?? null, error: null };
}

export async function countAvailableRoomsBatch(
  roomTypeIds: string[],
  checkIn: string,
  checkOut: string,
): Promise<{ data: Record<string, number>; error: Error | null }> {
  if (roomTypeIds.length === 0) return { data: {}, error: null };
  const results = await Promise.all(
    roomTypeIds.map(async (id) => {
      const { data, error } = await countAvailableRooms(id, checkIn, checkOut);
      return { id, count: error ? 0 : data };
    }),
  );
  const map: Record<string, number> = {};
  for (const r of results) map[r.id] = r.count;
  return { data: map, error: null };
}

// -----------------------------------------------------------------------------
// Amenities CRUD
// -----------------------------------------------------------------------------

export async function listAmenities(): Promise<{ data: AmenityRecord[]; error: Error | null }> {
  const { data, error } = await supabase
    .from("amenities")
    .select("id, name, icon")
    .order("name", { ascending: true });
  if (error) return { data: [], error };
  return { data: (data ?? []) as AmenityRecord[], error: null };
}

export async function createAmenity(name: string): Promise<{ data: AmenityRecord | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("amenities")
    .insert({ name: name.trim() })
    .select("id, name, icon")
    .single();
  if (error) return { data: null, error };
  return { data: data as AmenityRecord, error: null };
}

export async function setHotelAmenities(hotelId: string, amenityIds: string[]): Promise<{ error: Error | null }> {
  const { error: delError } = await supabase
    .from("hotel_amenities")
    .delete()
    .eq("hotel_id", hotelId);
  if (delError) return { error: delError };

  if (amenityIds.length === 0) return { error: null };

  const rows = amenityIds.map((aid) => ({ hotel_id: hotelId, amenity_id: aid }));
  const { error: insError } = await supabase.from("hotel_amenities").insert(rows);
  return { error: insError };
}

export async function getHotelAmenities(hotelId: string): Promise<{ data: AmenityRecord[]; error: Error | null }> {
  const { data, error } = await supabase
    .from("hotel_amenities")
    .select("amenity_id, amenities(id, name, icon)")
    .eq("hotel_id", hotelId);
  if (error) return { data: [], error };
  const amenities = (data ?? []).map((row: Record<string, unknown>) => {
    const a = row.amenities as { id: string; name: string; icon: string | null } | null;
    return a ? { id: a.id, name: a.name, icon: a.icon } : null;
  }).filter(Boolean) as AmenityRecord[];
  return { data: amenities, error: null };
}

// -----------------------------------------------------------------------------
// Landmarks CRUD
// -----------------------------------------------------------------------------

export function extractLatLngFromGoogleMapsUrl(url: string): { lat: number; lng: number } | null {
  if (!url) return null;
  const atMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
  const qMatch = url.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
  const placeMatch = url.match(/place\/[^/]+\/(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (placeMatch) return { lat: parseFloat(placeMatch[1]), lng: parseFloat(placeMatch[2]) };
  return null;
}

export async function listLandmarks(hotelId: string): Promise<{ data: LandmarkRecord[]; error: Error | null }> {
  const { data, error } = await supabase
    .from("landmarks")
    .select("id, hotel_id, name, google_maps_url, latitude, longitude")
    .eq("hotel_id", hotelId)
    .order("created_at", { ascending: true });
  if (error) return { data: [], error };
  return { data: (data ?? []) as LandmarkRecord[], error: null };
}

export async function createLandmark(hotelId: string, input: { name: string; googleMapsUrl?: string }): Promise<{ data: LandmarkRecord | null; error: Error | null }> {
  const coords = input.googleMapsUrl ? extractLatLngFromGoogleMapsUrl(input.googleMapsUrl) : null;
  const { data, error } = await supabase
    .from("landmarks")
    .insert({
      hotel_id: hotelId,
      name: input.name.trim(),
      google_maps_url: input.googleMapsUrl?.trim() || null,
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
    })
    .select("id, hotel_id, name, google_maps_url, latitude, longitude")
    .single();
  if (error) return { data: null, error };
  return { data: data as LandmarkRecord, error: null };
}

export async function deleteLandmark(id: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.from("landmarks").delete().eq("id", id);
  return { error };
}

// -----------------------------------------------------------------------------
// Hotel-only creation (no rooms) for the new flow
// -----------------------------------------------------------------------------

export async function createHotelOnly(ownerId: string, payload: {
  name: string;
  description?: string;
  address?: string;
  city?: string;
  country?: string;
  googleMapsUrl?: string;
  /** Up to 3 cover photos (compressed); first is also stored on hotels.image_url. */
  imageFiles?: File[];
  /** @deprecated use imageFiles; if set without imageFiles, treated as a single cover. */
  imageFile?: File;
  amenityIds?: string[];
  landmarks?: { name: string; googleMapsUrl?: string }[];
}): Promise<{ data: HotelRecord | null; error: Error | null }> {
  try {
    const rawFiles =
      payload.imageFiles && payload.imageFiles.length > 0
        ? payload.imageFiles.slice(0, 3)
        : payload.imageFile
          ? [payload.imageFile]
          : [];

    const uploadedUrls: string[] = [];
    for (const file of rawFiles) {
      const uploaded = await uploadHotelImageCompressed(ownerId, file);
      if (uploaded.error) return { data: null, error: uploaded.error };
      if (uploaded.data?.publicUrl) uploadedUrls.push(uploaded.data.publicUrl);
    }

    const imageUrl: string | null = uploadedUrls[0] ?? null;

    const { data: hotelData, error: hotelError } = await supabase
      .from("hotels")
      .insert({
        name: payload.name.trim(),
        description: payload.description?.trim() || null,
        address: payload.address?.trim() || null,
        city: payload.city?.trim() || null,
        country: payload.country?.trim() || null,
        google_maps_url: payload.googleMapsUrl?.trim() || null,
        image_url: imageUrl,
        owner_id: ownerId,
      })
      .select("id, name, description, address, city, country, google_maps_url, image_url, owner_id, created_at")
      .single();

    if (hotelError) return { data: null, error: hotelError };
    const hotel = hotelData as HotelRecord;

    for (let i = 0; i < uploadedUrls.length; i++) {
      const ins = await insertHotelImage(hotel.id, uploadedUrls[i], i);
      if (ins.error) return { data: null, error: ins.error };
    }

    if (payload.amenityIds && payload.amenityIds.length > 0) {
      await setHotelAmenities(hotel.id, payload.amenityIds);
    }

    if (payload.landmarks) {
      for (const lm of payload.landmarks) {
        if (lm.name.trim()) {
          await createLandmark(hotel.id, lm);
        }
      }
    }

    invalidateCatalogCache();
    return { data: hotel, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

export interface AdminRecentBooking {
  id: string;
  created_at: string;
  status: string;
  total_price: number | null;
  currency: string | null;
  stripe_checkout_session_id: string | null;
  hotel_name_snapshot: string | null;
  room_type_name_snapshot: string | null;
}

export async function listRecentBookingsForAdmin(limit = 20): Promise<{ data: AdminRecentBooking[]; error: Error | null }> {
  const { data, error } = await supabase
    .from("bookings")
    .select("id, created_at, status, total_price, currency, stripe_checkout_session_id, hotel_name_snapshot, room_type_name_snapshot")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return { data: [], error };
  return { data: (data ?? []) as AdminRecentBooking[], error: null };
}

export interface AdminWebhookEvent {
  id: string;
  event_type: string;
  created_at: string;
}

export async function listStripeWebhookEventsForAdmin(limit = 20): Promise<{ data: AdminWebhookEvent[]; error: Error | null }> {
  const { data, error } = await supabase
    .from("stripe_webhook_events")
    .select("id, event_type, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return { data: [], error };
  return { data: (data ?? []) as AdminWebhookEvent[], error: null };
}

// -----------------------------------------------------------------------------
// Owner Analytics APIs (with client-side caching for performance)
// -----------------------------------------------------------------------------

// Global client-side caching with configurable TTL
const globalCache = new Map<string, { data: any; timestamp: number }>();

// Cache TTL constants (in milliseconds)
const CACHE_TTL = {
  PROFILE: 60000,        // 1 minute - user profile data
  PHONE: 120000,         // 2 minutes - phone numbers
  HOTELS: 30000,         // 30 seconds - hotel lists
  ANALYTICS: 30000,      // 30 seconds - analytics data
  COMPLIANCE: 45000,     // 45 seconds - compliance data
  STATIC: 300000,        // 5 minutes - static/rarely changing data
} as const;

function getCachedOrFetch<T>(
  key: string,
  fetchFn: () => Promise<{ data: T; error: Error | null }>,
  ttlMs = CACHE_TTL.ANALYTICS
): Promise<{ data: T; error: Error | null }> {
  const cached = globalCache.get(key);
  if (cached && Date.now() - cached.timestamp < ttlMs) {
    return Promise.resolve({ data: cached.data as T, error: null });
  }

  return fetchFn().then((result) => {
    if (!result.error && result.data) {
      globalCache.set(key, { data: result.data, timestamp: Date.now() });
    }
    return result;
  });
}

function invalidateCache(pattern?: string) {
  if (!pattern) {
    globalCache.clear();
    return;
  }
  // Invalidate keys matching pattern
  for (const key of globalCache.keys()) {
    if (key.includes(pattern)) {
      globalCache.delete(key);
    }
  }
}

// Legacy aliases for backward compatibility
const analyticsCache = globalCache;
const ANALYTICS_CACHE_TTL_MS = CACHE_TTL.ANALYTICS;

export function invalidateAnalyticsCache(): void {
  invalidateCache('analytics');
}

// Revenue Analytics

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  bookings_count: number;
  paid_amount: number;
}

export async function getOwnerMonthlyRevenue(
  hotelId: string,
  startDate: string,
  endDate: string
): Promise<{ data: MonthlyRevenue[]; error: Error | null }> {
  const cacheKey = `revenue-monthly-${hotelId}-${startDate}-${endDate}`;
  return getCachedOrFetch(cacheKey, async () => {
    const { data, error } = await supabase.rpc("owner_monthly_revenue", {
      p_hotel_id: hotelId,
      p_start_date: startDate,
      p_end_date: endDate,
    });
    if (error) return { data: [], error };
    return {
      data: (data ?? []).map((row: any) => ({
        month: row.month,
        revenue: Number(row.revenue ?? 0),
        bookings_count: Number(row.bookings_count ?? 0),
        paid_amount: Number(row.paid_amount ?? 0),
      })),
      error: null,
    };
  });
}

export interface DailyRevenue {
  date: string;
  revenue: number;
  bookings_count: number;
}

export async function getOwnerDailyRevenue(
  hotelId: string,
  startDate: string,
  endDate: string
): Promise<{ data: DailyRevenue[]; error: Error | null }> {
  const cacheKey = `revenue-daily-${hotelId}-${startDate}-${endDate}`;
  return getCachedOrFetch(cacheKey, async () => {
    const { data, error } = await supabase.rpc("owner_daily_revenue", {
      p_hotel_id: hotelId,
      p_start_date: startDate,
      p_end_date: endDate,
    });
    if (error) return { data: [], error };
    return {
      data: (data ?? []).map((row: any) => ({
        date: row.date,
        revenue: Number(row.revenue ?? 0),
        bookings_count: Number(row.bookings_count ?? 0),
      })),
      error: null,
    };
  });
}

// Occupancy Analytics

export interface MonthlyOccupancy {
  month: string;
  total_rooms: number;
  booked_nights: number;
  available_nights: number;
  occupancy_rate: number;
}

export async function getOwnerMonthlyOccupancy(
  hotelId: string,
  startDate: string,
  endDate: string
): Promise<{ data: MonthlyOccupancy[]; error: Error | null }> {
  const cacheKey = `occupancy-monthly-${hotelId}-${startDate}-${endDate}`;
  return getCachedOrFetch(cacheKey, async () => {
    const { data, error } = await supabase.rpc("owner_monthly_occupancy", {
      p_hotel_id: hotelId,
      p_start_date: startDate,
      p_end_date: endDate,
    });
    if (error) return { data: [], error };
    return {
      data: (data ?? []).map((row: any) => ({
        month: row.month,
        total_rooms: Number(row.total_rooms ?? 0),
        booked_nights: Number(row.booked_nights ?? 0),
        available_nights: Number(row.available_nights ?? 0),
        occupancy_rate: Number(row.occupancy_rate ?? 0),
      })),
      error: null,
    };
  });
}

export interface RoomStatusBreakdown {
  status: string;
  count: number;
}

export async function getOwnerRoomStatusBreakdown(
  hotelId: string
): Promise<{ data: RoomStatusBreakdown[]; error: Error | null }> {
  const cacheKey = `room-status-${hotelId}`;
  return getCachedOrFetch(cacheKey, async () => {
    const { data, error } = await supabase.rpc("owner_room_status_breakdown", {
      p_hotel_id: hotelId,
    });
    if (error) return { data: [], error };
    return {
      data: (data ?? []).map((row: any) => ({
        status: row.status,
        count: Number(row.count ?? 0),
      })),
      error: null,
    };
  });
}

// Expense Management

export interface ExpenseCategory {
  id: string;
  name: string;
  icon: string | null;
  is_custom: boolean;
  created_by: string | null;
  created_at: string;
}

export interface Expense {
  id: string;
  hotel_id: string;
  category_id: string;
  category_name?: string;
  amount: number;
  description: string | null;
  expense_date: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export async function listExpenseCategories(): Promise<{ data: ExpenseCategory[]; error: Error | null }> {
  const { data, error } = await supabase
    .from("expense_categories")
    .select("id, name, icon, is_custom, created_by, created_at")
    .order("is_custom", { ascending: true })
    .order("name", { ascending: true });
  if (error) return { data: [], error };
  return { data: (data ?? []) as ExpenseCategory[], error: null };
}

export async function createExpenseCategory(
  name: string,
  icon: string | null,
  userId: string
): Promise<{ data: ExpenseCategory | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("expense_categories")
    .insert({ name: name.trim(), icon, is_custom: true, created_by: userId })
    .select("id, name, icon, is_custom, created_by, created_at")
    .single();
  if (error) return { data: null, error };
  return { data: data as ExpenseCategory, error: null };
}

export async function listExpenses(
  hotelId: string,
  startDate: string,
  endDate: string
): Promise<{ data: Expense[]; error: Error | null }> {
  const { data, error } = await supabase
    .from("expenses")
    .select(`
      id, hotel_id, category_id, amount, description, expense_date, created_by, created_at, updated_at,
      expense_categories!inner(name)
    `)
    .eq("hotel_id", hotelId)
    .gte("expense_date", startDate)
    .lte("expense_date", endDate)
    .order("expense_date", { ascending: false });
  if (error) return { data: [], error };
  return {
    data: (data ?? []).map((row: any) => ({
      id: row.id,
      hotel_id: row.hotel_id,
      category_id: row.category_id,
      category_name: row.expense_categories?.name ?? "Unknown",
      amount: Number(row.amount),
      description: row.description,
      expense_date: row.expense_date,
      created_by: row.created_by,
      created_at: row.created_at,
      updated_at: row.updated_at,
    })),
    error: null,
  };
}

export async function createExpense(
  hotelId: string,
  categoryId: string,
  amount: number,
  description: string | null,
  expenseDate: string,
  userId: string
): Promise<{ data: Expense | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("expenses")
    .insert({
      hotel_id: hotelId,
      category_id: categoryId,
      amount,
      description: description?.trim() || null,
      expense_date: expenseDate,
      created_by: userId,
    })
    .select(`
      id, hotel_id, category_id, amount, description, expense_date, created_by, created_at, updated_at,
      expense_categories!inner(name)
    `)
    .single();
  if (error) return { data: null, error };
  invalidateAnalyticsCache();
  return {
    data: {
      id: (data as any).id,
      hotel_id: (data as any).hotel_id,
      category_id: (data as any).category_id,
      category_name: (data as any).expense_categories?.name ?? "Unknown",
      amount: Number((data as any).amount),
      description: (data as any).description,
      expense_date: (data as any).expense_date,
      created_by: (data as any).created_by,
      created_at: (data as any).created_at,
      updated_at: (data as any).updated_at,
    },
    error: null,
  };
}

export async function updateExpense(
  expenseId: string,
  updates: { category_id?: string; amount?: number; description?: string; expense_date?: string }
): Promise<{ data: Expense | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("expenses")
    .update(updates)
    .eq("id", expenseId)
    .select(`
      id, hotel_id, category_id, amount, description, expense_date, created_by, created_at, updated_at,
      expense_categories!inner(name)
    `)
    .single();
  if (error) return { data: null, error };
  invalidateAnalyticsCache();
  return {
    data: {
      id: (data as any).id,
      hotel_id: (data as any).hotel_id,
      category_id: (data as any).category_id,
      category_name: (data as any).expense_categories?.name ?? "Unknown",
      amount: Number((data as any).amount),
      description: (data as any).description,
      expense_date: (data as any).expense_date,
      created_by: (data as any).created_by,
      created_at: (data as any).created_at,
      updated_at: (data as any).updated_at,
    },
    error: null,
  };
}

export async function deleteExpense(expenseId: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.from("expenses").delete().eq("id", expenseId);
  if (!error) invalidateAnalyticsCache();
  return { error };
}

export interface ExpenseByCategory {
  category_id: string;
  category_name: string;
  total_amount: number;
  expense_count: number;
}

export async function getExpensesByCategory(
  hotelId: string,
  startDate: string,
  endDate: string
): Promise<{ data: ExpenseByCategory[]; error: Error | null }> {
  const cacheKey = `expenses-by-cat-${hotelId}-${startDate}-${endDate}`;
  return getCachedOrFetch(cacheKey, async () => {
    const { data, error } = await supabase.rpc("owner_expenses_by_category", {
      p_hotel_id: hotelId,
      p_start_date: startDate,
      p_end_date: endDate,
    });
    if (error) return { data: [], error };
    return {
      data: (data ?? []).map((row: any) => ({
        category_id: row.category_id,
        category_name: row.category_name,
        total_amount: Number(row.total_amount ?? 0),
        expense_count: Number(row.expense_count ?? 0),
      })),
      error: null,
    };
  });
}

// Room Performance

export interface RoomTypePerformance {
  room_type_id: string;
  room_type_name: string;
  total_rooms: number;
  bookings_count: number;
  total_revenue: number;
  avg_nights: number;
  occupancy_rate: number;
}

export async function getRoomTypePerformance(
  hotelId: string,
  startDate: string,
  endDate: string
): Promise<{ data: RoomTypePerformance[]; error: Error | null }> {
  const cacheKey = `room-perf-${hotelId}-${startDate}-${endDate}`;
  return getCachedOrFetch(cacheKey, async () => {
    const { data, error } = await supabase.rpc("owner_room_type_performance", {
      p_hotel_id: hotelId,
      p_start_date: startDate,
      p_end_date: endDate,
    });
    if (error) return { data: [], error };
    return {
      data: (data ?? []).map((row: any) => ({
        room_type_id: row.room_type_id,
        room_type_name: row.room_type_name,
        total_rooms: Number(row.total_rooms ?? 0),
        bookings_count: Number(row.bookings_count ?? 0),
        total_revenue: Number(row.total_revenue ?? 0),
        avg_nights: Number(row.avg_nights ?? 0),
        occupancy_rate: Number(row.occupancy_rate ?? 0),
      })),
      error: null,
    };
  });
}

// Owner hotel bookings list
export interface OwnerBookingListItem {
  id: string;
  check_in_date: string;
  check_out_date: string;
  status: string;
  total_price: number | null;
  room_type_name_snapshot: string | null;
  room_number: string | null;
  created_at: string;
}

export async function listOwnerBookings(
  hotelId: string,
  limit = 50
): Promise<{ data: OwnerBookingListItem[]; error: Error | null }> {
  const { data, error } = await supabase
    .from("bookings")
    .select("id, check_in_date, check_out_date, status, total_price, room_type_name_snapshot, created_at, rooms!inner(room_number)")
    .eq("hotel_id", hotelId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return { data: [], error };
  return {
    data: (data ?? []).map((row: any) => ({
      id: row.id,
      check_in_date: row.check_in_date,
      check_out_date: row.check_out_date,
      status: row.status,
      total_price: row.total_price ? Number(row.total_price) : null,
      room_type_name_snapshot: row.room_type_name_snapshot,
      room_number: row.rooms?.room_number ?? null,
      created_at: row.created_at,
    })),
    error: null,
  };
}

// -----------------------------------------------------------------------------
export async function getCustomerRecentBookings(userId: string, limit = 10): Promise<{ data: Array<{
  id: string;
  check_in_date: string;
  check_out_date: string;
  status: string;
  total_price: number | null;
  currency: string | null;
  hotel_name_snapshot: string | null;
  room_type_name_snapshot: string | null;
}>; error: Error | null }> {
  return getCachedOrFetch(
    `bookings_${userId}`,
    async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, check_in_date, check_out_date, status, total_price, currency, hotel_name_snapshot, room_type_name_snapshot")
        .eq("booker_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) return { data: [], error };
      return { data: data as any, error: null };
    },
    CACHE_TTL.HOTELS // 30s cache for recent bookings
  );
}
// -----------------------------------------------------------------------------
// Manager/Receptionist Dashboard APIs
// -----------------------------------------------------------------------------

export interface ManagerDashboardStats {
  total_rooms: number;
  available_rooms: number;
  occupied_rooms: number;
  cleaning_rooms: number;
  today_checkins: number;
  today_checkouts: number;
  active_bookings: number;
  pending_tasks: number;
}

export async function getManagerDashboardStats(hotelId: string): Promise<{ data: ManagerDashboardStats | null; error: Error | null }> {
  return getCachedOrFetch(
    `manager_dashboard_${hotelId}`,
    async () => {
      const { data, error } = await supabase.rpc("get_manager_dashboard_stats", { p_hotel_id: hotelId });
      if (error) return { data: null, error };
      return { data: data as ManagerDashboardStats, error: null };
    },
    CACHE_TTL.ANALYTICS
  );
}

// Staff Management APIs
// -----------------------------------------------------------------------------

export type StaffDesignation = 'room_service' | 'cleaning' | 'cook' | 'driver' | 'translator' | 'housekeeping' | 'maintenance';

export interface StaffMember {
  id: string;
  name: string;
  mobile_number: string;
  designation: StaffDesignation;
  hotel_id: string | null;
  is_active: boolean;
  license_number?: string | null;
  transport_status?: "available" | "on_trip" | "off_duty" | "assigned" | "on_leave" | null;
  rating?: number | null;
  daily_rate_inr?: number | null;
  car_name?: string | null;
  car_number?: string | null;
  seating_capacity?: number | null;
  languages?: string[] | null;
  created_at: string;
}

export interface StaffInput {
  name: string;
  mobile_number: string;
  designation: StaffDesignation;
  hotel_id?: string | null;
  license_number?: string | null;
  transport_status?: "available" | "on_trip" | "off_duty" | "assigned" | "on_leave" | null;
  rating?: number | null;
  daily_rate_inr?: number | null;
  car_name?: string | null;
  car_number?: string | null;
  seating_capacity?: number | null;
  languages?: string[] | null;
}

export async function listStaff(hotelId?: string, designation?: StaffDesignation): Promise<{ data: StaffMember[]; error: Error | null }> {
  return getCachedOrFetch(
    `staff_${hotelId}_${designation || 'all'}`,
    async () => {
      let query = supabase
        .from("staff")
        .select("*")
        .is("deleted_at", null)
        .order("name");

      if (hotelId) query = query.eq("hotel_id", hotelId);
      if (designation) query = query.eq("designation", designation);

      const { data, error } = await query;
      if (error) return { data: [], error };
      return { data: (data ?? []) as StaffMember[], error: null };
    },
    CACHE_TTL.HOTELS
  );
}

export async function getAvailableStaff(hotelId: string, designation?: StaffDesignation): Promise<{ data: StaffMember[]; error: Error | null }> {
  const { data, error } = await supabase.rpc("get_available_staff", {
    p_hotel_id: hotelId,
    p_designation: designation || null,
  });
  if (error) return { data: [], error };
  return { data: (data ?? []) as StaffMember[], error: null };
}

export async function createStaff(input: StaffInput): Promise<{ data: StaffMember | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("staff")
    .insert({
      name: input.name,
      mobile_number: input.mobile_number,
      designation: input.designation,
      hotel_id: input.hotel_id || null,
      license_number: input.license_number || null,
      transport_status: input.transport_status ?? null,
      rating: input.rating ?? null,
      daily_rate_inr: input.daily_rate_inr ?? null,
      car_name: input.car_name || null,
      car_number: input.car_number || null,
      seating_capacity: input.seating_capacity || null,
      languages: input.languages || null,
    })
    .select()
    .single();

  if (error) return { data: null, error };
  invalidateCache('staff');
  return { data: data as StaffMember, error: null };
}

export async function updateStaff(staffId: string, updates: Partial<StaffInput>): Promise<{ data: StaffMember | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("staff")
    .update(updates)
    .eq("id", staffId)
    .select()
    .single();

  if (error) return { data: null, error };
  invalidateCache('staff');
  return { data: data as StaffMember, error: null };
}

export async function deleteStaff(staffId: string): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from("staff")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", staffId);

  if (error) return { error };
  invalidateCache('staff');
  return { error: null };
}

export async function toggleStaffActive(staffId: string, isActive: boolean): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from("staff")
    .update({ is_active: isActive })
    .eq("id", staffId);

  if (error) return { error };
  invalidateCache('staff');
  return { error: null };
}

// Task Management APIs
// -----------------------------------------------------------------------------

export type TaskType = 'room_cleaning' | 'room_service' | 'driver' | 'translator' | 'cooking' | 'maintenance' | 'housekeeping';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  type: TaskType;
  room_id: string | null;
  hotel_id: string;
  booking_id: string | null;
  assigned_staff_id: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  description: string | null;
  notes: string | null;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  staff?: StaffMember;
  room?: { room_number: string };
}

export interface TaskInput {
  type: TaskType;
  room_id?: string | null;
  hotel_id: string;
  booking_id?: string | null;
  assigned_staff_id?: string | null;
  priority?: TaskPriority;
  description?: string;
  scheduled_at?: string;
}

function normalizeTaskRow(row: any): Task {
  return {
    ...(row as Task),
    staff: row?.staff ?? null,
    room: row?.room ?? row?.rooms ?? null,
  };
}

export async function listTasks(hotelId: string, status?: TaskStatus, limit = 50): Promise<{ data: Task[]; error: Error | null }> {
  return getCachedOrFetch(
    `tasks_${hotelId}_${status || 'all'}`,
    async () => {
      let query = supabase
        .from("tasks")
        .select(`
          *,
          staff:assigned_staff_id(id, name, mobile_number, designation),
          rooms:room_id(room_number)
        `)
        .eq("hotel_id", hotelId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (status) query = query.eq("status", status);

      const { data, error } = await query;
      if (error) return { data: [], error };
      return { data: (data ?? []).map(normalizeTaskRow), error: null };
    },
    CACHE_TTL.HOTELS
  );
}

export async function createTask(userId: string, input: TaskInput): Promise<{ data: Task | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      ...input,
      created_by: userId,
    })
    .select(`
      *,
      staff:assigned_staff_id(id, name, mobile_number, designation),
      rooms:room_id(room_number)
    `)
    .single();

  if (error) return { data: null, error };
  invalidateCache('tasks');
  return { data: normalizeTaskRow(data), error: null };
}

export async function updateTask(taskId: string, updates: {
  status?: TaskStatus;
  assigned_staff_id?: string;
  notes?: string;
  priority?: TaskPriority;
}): Promise<{ data: Task | null; error: Error | null }> {
  const payload: any = { ...updates };
  
  if (updates.status === 'in_progress' && !payload.started_at) {
    payload.started_at = new Date().toISOString();
  }
  if (updates.status === 'completed' && !payload.completed_at) {
    payload.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("tasks")
    .update(payload)
    .eq("id", taskId)
    .select(`
      *,
      staff:assigned_staff_id(id, name, mobile_number, designation),
      rooms:room_id(room_number)
    `)
    .single();

  if (error) return { data: null, error };
  invalidateCache('tasks');
  return { data: normalizeTaskRow(data), error: null };
}

export async function assignTaskViaRpc(
  taskId: string,
  staffId: string,
): Promise<{ data: { task_id: string; assigned_staff_id: string; task_status: string } | null; error: Error | null }> {
  const { data, error } = await supabase.rpc("rpc_assign_task", {
    p_task_id: taskId,
    p_staff_id: staffId,
  });
  if (error) return { data: null, error };
  const row = Array.isArray(data) ? data[0] : data;
  invalidateCache("tasks");
  return {
    data: row
      ? {
          task_id: String(row.task_id),
          assigned_staff_id: String(row.assigned_staff_id),
          task_status: String(row.task_status),
        }
      : null,
    error: null,
  };
}

export async function updateTaskStatusViaRpc(
  taskId: string,
  status: TaskStatus,
  note?: string,
): Promise<{ data: { task_id: string; task_status: string; started_at: string | null; completed_at: string | null } | null; error: Error | null }> {
  const { data, error } = await supabase.rpc("rpc_update_task_status", {
    p_task_id: taskId,
    p_status: status,
    p_note: note ?? null,
  });
  if (error) return { data: null, error };
  const row = Array.isArray(data) ? data[0] : data;
  invalidateCache("tasks");
  return {
    data: row
      ? {
          task_id: String(row.task_id),
          task_status: String(row.task_status),
          started_at: row.started_at ?? null,
          completed_at: row.completed_at ?? null,
        }
      : null,
    error: null,
  };
}

export async function deleteTask(taskId: string): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from("tasks")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", taskId);

  if (error) return { error };
  invalidateCache('tasks');
  return { error: null };
}

// Booking Management for Manager/Receptionist
// -----------------------------------------------------------------------------

export interface BookingInput {
  hotel_id: string;
  room_id: string;
  room_type_id: string;
  guest_id: string;
  booker_id: string;
  check_in_date: string;
  check_out_date: string;
  num_guests: number;
  total_price: number;
  payment_method?: string;
  hotel_name_snapshot: string;
  room_type_name_snapshot: string;
  /** Rack total (catalog nightly × nights) before long-stay or manual discount. */
  list_price_subtotal?: number | null;
  pricing_tier?: "standard" | "weekly" | "monthly" | null;
  negotiated_discount_type?: "none" | "percentage" | "flat" | null;
  negotiated_discount_value?: number;
  negotiated_note?: string | null;
}

export async function createBookingAsManager(input: BookingInput): Promise<{ data: any; error: Error | null }> {
  const { data, error } = await supabase
    .from("bookings")
    .insert(input)
    .select()
    .single();

  if (error) return { data: null, error };
  invalidateCache('bookings');
  invalidateCache('manager_dashboard');
  return { data, error: null };
}

export async function checkInGuest(bookingId: string, roomId: string): Promise<{ error: Error | null }> {
  // Update booking status and room status
  const [bookingResult, roomResult] = await Promise.all([
    supabase.from("bookings").update({ status: "checked_in" }).eq("id", bookingId),
    supabase.from("rooms").update({ status: "occupied" }).eq("id", roomId),
  ]);

  if (bookingResult.error) return { error: bookingResult.error };
  if (roomResult.error) return { error: roomResult.error };

  invalidateCache('bookings');
  invalidateCache('rooms');
  invalidateCache('manager_dashboard');
  return { error: null };
}

export async function checkOutGuest(bookingId: string, roomId: string): Promise<{ error: Error | null }> {
  // Update booking status and room status to cleaning
  const [bookingResult, roomResult] = await Promise.all([
    supabase.from("bookings").update({ status: "checked_out" }).eq("id", bookingId),
    supabase.from("rooms").update({ status: "cleaning" }).eq("id", roomId),
  ]);

  if (bookingResult.error) return { error: bookingResult.error };
  if (roomResult.error) return { error: roomResult.error };

  // Create cleaning task automatically
  const { data: hotel } = await supabase.from("rooms").select("hotel_id").eq("id", roomId).single();
  if (hotel) {
    await createTask('system', {
      type: 'room_cleaning',
      room_id: roomId,
      hotel_id: hotel.hotel_id,
      priority: 'high',
      description: 'Post check-out cleaning required',
    });
  }

  invalidateCache('bookings');
  invalidateCache('rooms');
  invalidateCache('tasks');
  invalidateCache('manager_dashboard');
  return { error: null };
}

// Service Requests APIs
// -----------------------------------------------------------------------------

export interface ServiceRequest {
  id: string;
  booking_id: string;
  room_id: string;
  type: TaskType;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_task_id: string | null;
  created_at: string;
  room?: { room_number: string };
  booking?: {
    guest_id: string;
    guest?: { first_name: string | null; last_name: string | null } | null;
  };
}

function normalizeServiceRequestRow(row: any): ServiceRequest {
  return {
    ...(row as ServiceRequest),
    room: row?.room ?? row?.rooms ?? null,
    booking: row?.booking ?? row?.bookings ?? null,
  };
}

export async function listServiceRequests(status?: TaskStatus): Promise<{ data: ServiceRequest[]; error: Error | null }> {
  let query = supabase
    .from("service_requests")
    .select(`
      *,
      rooms:room_id(room_number),
      bookings:booking_id(guest_id)
    `)
    .order("created_at", { ascending: false })
    .limit(50);

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return { data: [], error };
  return { data: (data ?? []).map(normalizeServiceRequestRow), error: null };
}

export async function listServiceRequestsForHotel(
  hotelId: string,
  status?: TaskStatus,
): Promise<{ data: ServiceRequest[]; error: Error | null }> {
  let query = supabase
    .from("service_requests")
    .select(`
      *,
      rooms:room_id(room_number),
      bookings:booking_id!inner(hotel_id, guest_id, guest:guest_id(first_name, last_name))
    `)
    .eq("bookings.hotel_id", hotelId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return { data: [], error };
  return { data: (data ?? []).map(normalizeServiceRequestRow), error: null };
}

export async function resolveServiceRequest(
  requestId: string,
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from("service_requests")
    .update({ status: "completed", resolved_at: new Date().toISOString() })
    .eq("id", requestId);
  if (error) return { error };
  invalidateCache("tasks");
  return { error: null };
}

export async function assignServiceRequest(requestId: string, staffId: string): Promise<{ error: Error | null }> {
  // Create a task and link it
  const { data: request } = await supabase
    .from("service_requests")
    .select("room_id, type, description, priority, booking_id, rooms!inner(hotel_id)")
    .eq("id", requestId)
    .single();

  if (!request) return { error: new Error("Service request not found") };

  const { data: task } = await supabase
    .from("tasks")
    .insert({
      type: request.type,
      room_id: request.room_id,
      hotel_id: (request as any).rooms.hotel_id,
      booking_id: request.booking_id,
      assigned_staff_id: staffId,
      priority: request.priority,
      description: request.description,
    })
    .select()
    .single();

  if (!task) return { error: new Error("Failed to create task") };

  const { error } = await supabase
    .from("service_requests")
    .update({
      assigned_task_id: task.id,
      status: 'in_progress',
    })
    .eq("id", requestId);

  invalidateCache('tasks');
  return { error };
}

// Transport (live front-desk operations)
// -----------------------------------------------------------------------------

export type TransportTripStatus = "scheduled" | "active" | "completed" | "cancelled";
export type TransportTripType = "Airport Pickup" | "Daily Cab" | "Hospital" | "Discharge";
export type TransportVehicleStatus = "active" | "maintenance" | "retired";
export type TransportDriverStatus = "available" | "on_trip" | "off_duty";
export type TransportTranslatorStatus = "available" | "assigned" | "on_leave";

export interface TransportTripRecord {
  id: string;
  hotel_id: string;
  trip_type: TransportTripType;
  status: TransportTripStatus;
  guest_name: string;
  room_label: string | null;
  checkin_ref: string | null;
  route: string;
  scheduled_at: string;
  driver_staff_id: string | null;
  vehicle_id: string | null;
  price_inr: number;
  notes: string | null;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  driver?: { id: string; name: string | null } | null;
  vehicle?: { id: string; name: string | null; plate: string | null } | null;
}

export interface TransportVehicleRecord {
  id: string;
  hotel_id: string;
  name: string;
  body_type: string;
  plate: string;
  capacity: number;
  status: TransportVehicleStatus;
  is_active: boolean;
  created_at: string;
}

export interface TransportVendorRecord {
  id: string;
  hotel_id: string;
  name: string;
  category: string;
  contact: string;
  active: boolean;
  created_at: string;
}

function normalizeTransportTripRow(row: any): TransportTripRecord {
  return {
    ...(row as TransportTripRecord),
    driver: row?.driver ?? row?.staff ?? null,
    vehicle: row?.vehicle ?? row?.transport_vehicles ?? null,
  };
}

async function resolveTransportCreatedBy(userId: string): Promise<string | null> {
  if (!userId) return null;
  const { data } = await getProfile(userId);
  return data?.id ?? null;
}

export async function listTransportTripsForHotel(
  hotelId: string,
): Promise<{ data: TransportTripRecord[]; error: Error | null }> {
  const { data, error } = await supabase
    .from("transport_trips")
    .select(`
      *,
      driver:driver_staff_id(id, name),
      vehicle:vehicle_id(id, name, plate)
    `)
    .eq("hotel_id", hotelId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) return { data: [], error };
  return { data: (data ?? []).map(normalizeTransportTripRow), error: null };
}

export async function createTransportTrip(input: {
  hotelId: string;
  createdBy: string;
  tripType: TransportTripType;
  guestName: string;
  roomLabel?: string | null;
  checkinRef?: string | null;
  route: string;
  scheduledAt: string;
  driverStaffId: string;
  vehicleId?: string | null;
  priceInr: number;
  notes?: string | null;
}): Promise<{ data: TransportTripRecord | null; error: Error | null }> {
  const createdBy = await resolveTransportCreatedBy(input.createdBy);
  const { data, error } = await supabase
    .from("transport_trips")
    .insert({
      hotel_id: input.hotelId,
      trip_type: input.tripType,
      status: "scheduled",
      guest_name: input.guestName.trim(),
      room_label: input.roomLabel?.trim() || null,
      checkin_ref: input.checkinRef?.trim() || null,
      route: input.route.trim(),
      scheduled_at: input.scheduledAt,
      driver_staff_id: input.driverStaffId,
      vehicle_id: input.vehicleId || null,
      price_inr: Math.max(0, input.priceInr || 0),
      notes: input.notes?.trim() || null,
      created_by: createdBy,
    })
    .select(`
      *,
      driver:driver_staff_id(id, name),
      vehicle:vehicle_id(id, name, plate)
    `)
    .single();

  if (error) return { data: null, error };

  await supabase
    .from("staff")
    .update({ transport_status: "assigned" })
    .eq("id", input.driverStaffId);

  invalidateCache("transport");
  invalidateCache("staff");
  return { data: normalizeTransportTripRow(data), error: null };
}

export async function updateTransportTripStatus(
  tripId: string,
  status: TransportTripStatus,
): Promise<{ data: TransportTripRecord | null; error: Error | null }> {
  const { data: existing, error: existingError } = await supabase
    .from("transport_trips")
    .select("id, driver_staff_id")
    .eq("id", tripId)
    .single();
  if (existingError) return { data: null, error: existingError };

  const patch: Record<string, unknown> = { status };
  if (status === "active") patch.started_at = new Date().toISOString();
  if (status === "completed") patch.completed_at = new Date().toISOString();
  if (status === "cancelled") patch.cancelled_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("transport_trips")
    .update(patch)
    .eq("id", tripId)
    .select(`
      *,
      driver:driver_staff_id(id, name),
      vehicle:vehicle_id(id, name, plate)
    `)
    .single();

  if (error) return { data: null, error };

  if (existing?.driver_staff_id) {
    const driverStatus =
      status === "active" ? "on_trip" : status === "scheduled" ? "assigned" : "available";
    await supabase
      .from("staff")
      .update({ transport_status: driverStatus })
      .eq("id", existing.driver_staff_id);
  }

  invalidateCache("transport");
  invalidateCache("staff");
  return { data: normalizeTransportTripRow(data), error: null };
}

export async function listTransportDriversForHotel(
  hotelId: string,
): Promise<{ data: StaffMember[]; error: Error | null }> {
  return listStaff(hotelId, "driver");
}

export async function upsertTransportDriver(input: {
  hotelId: string;
  id?: string;
  name: string;
  phone: string;
  license: string;
  rating: number;
  status: TransportDriverStatus;
}): Promise<{ data: StaffMember | null; error: Error | null }> {
  if (input.id) {
    return updateStaff(input.id, {
      name: input.name,
      mobile_number: input.phone,
      license_number: input.license,
      rating: input.rating,
      transport_status: input.status,
      designation: "driver",
      hotel_id: input.hotelId,
    });
  }
  return createStaff({
    name: input.name,
    mobile_number: input.phone,
    designation: "driver",
    hotel_id: input.hotelId,
    license_number: input.license,
    rating: input.rating,
    transport_status: input.status,
  });
}

export async function removeTransportDriver(
  staffId: string,
): Promise<{ error: Error | null }> {
  return deleteStaff(staffId);
}

export async function listTransportTranslatorsForHotel(
  hotelId: string,
): Promise<{ data: StaffMember[]; error: Error | null }> {
  return listStaff(hotelId, "translator");
}

export async function upsertTransportTranslator(input: {
  hotelId: string;
  id?: string;
  name: string;
  languages: string[];
  rating: number;
  rateInrPerDay: number;
  status: TransportTranslatorStatus;
}): Promise<{ data: StaffMember | null; error: Error | null }> {
  if (input.id) {
    return updateStaff(input.id, {
      name: input.name,
      designation: "translator",
      hotel_id: input.hotelId,
      languages: input.languages,
      rating: input.rating,
      daily_rate_inr: input.rateInrPerDay,
      transport_status: input.status,
    });
  }
  return createStaff({
    name: input.name,
    mobile_number: `translator-${crypto.randomUUID()}`,
    designation: "translator",
    hotel_id: input.hotelId,
    languages: input.languages,
    rating: input.rating,
    daily_rate_inr: input.rateInrPerDay,
    transport_status: input.status,
  });
}

export async function removeTransportTranslator(
  staffId: string,
): Promise<{ error: Error | null }> {
  return deleteStaff(staffId);
}

export async function listTransportVehiclesForHotel(
  hotelId: string,
): Promise<{ data: TransportVehicleRecord[]; error: Error | null }> {
  const { data, error } = await supabase
    .from("transport_vehicles")
    .select("*")
    .eq("hotel_id", hotelId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) return { data: [], error };
  return { data: (data ?? []) as TransportVehicleRecord[], error: null };
}

export async function upsertTransportVehicle(input: {
  hotelId: string;
  id?: string;
  name: string;
  bodyType: string;
  plate: string;
  capacity: number;
  status: TransportVehicleStatus;
  userId: string;
}): Promise<{ data: TransportVehicleRecord | null; error: Error | null }> {
  if (input.id) {
    const { data, error } = await supabase
      .from("transport_vehicles")
      .update({
        name: input.name,
        body_type: input.bodyType,
        plate: input.plate,
        capacity: input.capacity,
        status: input.status,
      })
      .eq("id", input.id)
      .select("*")
      .single();
    if (error) return { data: null, error };
    invalidateCache("transport");
    return { data: data as TransportVehicleRecord, error: null };
  }
  const createdBy = await resolveTransportCreatedBy(input.userId);
  const { data, error } = await supabase
    .from("transport_vehicles")
    .insert({
      hotel_id: input.hotelId,
      name: input.name,
      body_type: input.bodyType,
      plate: input.plate,
      capacity: input.capacity,
      status: input.status,
      created_by: createdBy,
    })
    .select("*")
    .single();
  if (error) return { data: null, error };
  invalidateCache("transport");
  return { data: data as TransportVehicleRecord, error: null };
}

export async function removeTransportVehicle(id: string): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from("transport_vehicles")
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq("id", id);
  if (!error) invalidateCache("transport");
  return { error };
}

export async function listTransportVendorsForHotel(
  hotelId: string,
): Promise<{ data: TransportVendorRecord[]; error: Error | null }> {
  const { data, error } = await supabase
    .from("transport_vendors")
    .select("*")
    .eq("hotel_id", hotelId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) return { data: [], error };
  return { data: (data ?? []) as TransportVendorRecord[], error: null };
}

export async function upsertTransportVendor(input: {
  hotelId: string;
  id?: string;
  name: string;
  category: string;
  contact: string;
  active: boolean;
  userId: string;
}): Promise<{ data: TransportVendorRecord | null; error: Error | null }> {
  if (input.id) {
    const { data, error } = await supabase
      .from("transport_vendors")
      .update({
        name: input.name,
        category: input.category,
        contact: input.contact,
        active: input.active,
      })
      .eq("id", input.id)
      .select("*")
      .single();
    if (error) return { data: null, error };
    invalidateCache("transport");
    return { data: data as TransportVendorRecord, error: null };
  }
  const createdBy = await resolveTransportCreatedBy(input.userId);
  const { data, error } = await supabase
    .from("transport_vendors")
    .insert({
      hotel_id: input.hotelId,
      name: input.name,
      category: input.category,
      contact: input.contact,
      active: input.active,
      created_by: createdBy,
    })
    .select("*")
    .single();
  if (error) return { data: null, error };
  invalidateCache("transport");
  return { data: data as TransportVendorRecord, error: null };
}

export async function removeTransportVendor(id: string): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from("transport_vendors")
    .update({ deleted_at: new Date().toISOString(), active: false })
    .eq("id", id);
  if (!error) invalidateCache("transport");
  return { error };
}

// -----------------------------------------------------------------------------

export interface FRRORecord {
  guest_id: string;
  guest_name: string;
  nationality: string | null;
  passport_number: string | null;
  visa_type: string | null;
  visa_expiry_date: string | null;
  days_until_expiry?: number;
  frro_status: string | null;
  frro_registration_date: string | null;
  hotel_name: string | null;
  booking_id: string | null;
}

export async function listFRRORecords(hotelId?: string): Promise<{ data: FRRORecord[]; error: Error | null }> {
  const { data, error } = await supabase
    .from("guests")
    .select(`
      id,
      first_name,
      last_name,
      nationality,
      passport_number,
      visa_type,
      visa_expiry_date,
      frro_status,
      frro_registration_date,
      bookings!inner(id, hotel_id, hotels!inner(name))
    `)
    .not("passport_number", "is", null)
    .order("frro_registration_date", { ascending: false });

  if (error) return { data: [], error };

  const records: FRRORecord[] = (data ?? []).map((g: any) => {
    const booking = Array.isArray(g.bookings) ? g.bookings[0] : g.bookings;
    const hotel = booking?.hotels;
    
    return {
      guest_id: g.id,
      guest_name: `${g.first_name || ''} ${g.last_name || ''}`.trim(),
      nationality: g.nationality,
      passport_number: g.passport_number,
      visa_type: g.visa_type,
      visa_expiry_date: g.visa_expiry_date,
      frro_status: g.frro_status || 'pending',
      frro_registration_date: g.frro_registration_date,
      hotel_name: hotel?.name || null,
      booking_id: booking?.id || null,
    };
  });

  const filtered = hotelId 
    ? records.filter(r => {
        const booking = data?.find((g: any) => g.id === r.guest_id)?.bookings;
        return Array.isArray(booking) ? booking[0]?.hotel_id === hotelId : booking?.hotel_id === hotelId;
      })
    : records;

  return { data: filtered, error: null };
}

export async function getExpiringVisas(daysThreshold = 30, hotelId?: string): Promise<{ data: FRRORecord[]; error: Error | null }> {
  const { data, error } = await supabase.rpc("get_expiring_visas", {
    p_days_threshold: daysThreshold,
    p_hotel_id: hotelId || null,
  });

  if (error) return { data: [], error };

  return {
    data: (data ?? []).map((row: any) => ({
      guest_id: row.guest_id,
      guest_name: row.guest_name,
      nationality: row.nationality,
      passport_number: row.passport_number,
      visa_type: row.visa_type,
      visa_expiry_date: row.visa_expiry_date,
      days_until_expiry: row.days_until_expiry,
      frro_status: row.frro_status,
      hotel_name: row.hotel_name,
      booking_id: row.booking_id,
    })),
    error: null,
  };
}

export async function updateGuestFRROStatus(
  guestId: string,
  status: string,
  registrationDate?: string
): Promise<{ error: Error | null }> {
  const updates: any = { frro_status: status };
  if (registrationDate) updates.frro_registration_date = registrationDate;

  const { error } = await supabase
    .from("guests")
    .update(updates)
    .eq("id", guestId);

  return { error };
}

// Audit Logs

export interface AuditLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  user_role: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  details: string | null;
  ip_address: string | null;
  created_at: string;
}

export async function listAuditLogs(filters?: {
  userId?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}): Promise<{ data: AuditLog[]; error: Error | null }> {
  let query = supabase
    .from("audit_logs")
    .select("id, user_id, user_email, user_role, action, entity, entity_id, details, ip_address, created_at")
    .order("created_at", { ascending: false });

  if (filters?.userId) query = query.eq("user_id", filters.userId);
  if (filters?.action) query = query.eq("action", filters.action);
  if (filters?.startDate) query = query.gte("created_at", filters.startDate);
  if (filters?.endDate) query = query.lte("created_at", filters.endDate);
  if (filters?.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) return { data: [], error };
  return { data: (data ?? []) as AuditLog[], error: null };
}

export async function createAuditLog(
  userId: string,
  action: string,
  entity: string,
  entityId: string | null,
  details: string | null,
  ipAddress?: string
): Promise<{ error: Error | null }> {
  const { error } = await supabase.from("audit_logs").insert({
    user_id: userId,
    action,
    entity,
    entity_id: entityId,
    details,
    ip_address: ipAddress,
  });
  return { error };
}

// Incidents

export interface Incident {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  priority: string;
  hotel_id: string | null;
  hotel_name?: string | null;
  reported_by: string | null;
  assigned_admin_id: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface IncidentInput {
  title: string;
  description?: string;
  type: string;
  priority?: string;
  hotel_id?: string;
}

export async function listIncidents(hotelId?: string, status?: string): Promise<{ data: Incident[]; error: Error | null }> {
  let query = supabase
    .from("incidents")
    .select(`
      id, title, description, type, status, priority, hotel_id, reported_by, 
      assigned_admin_id, created_at, updated_at, resolved_at,
      hotels(name)
    `)
    .order("created_at", { ascending: false });

  if (hotelId) query = query.eq("hotel_id", hotelId);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return { data: [], error };

  return {
    data: (data ?? []).map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      type: row.type,
      status: row.status,
      priority: row.priority,
      hotel_id: row.hotel_id,
      hotel_name: row.hotels?.name || null,
      reported_by: row.reported_by,
      assigned_admin_id: row.assigned_admin_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      resolved_at: row.resolved_at,
    })),
    error: null,
  };
}

export async function createIncident(
  userId: string,
  input: IncidentInput
): Promise<{ data: Incident | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("incidents")
    .insert({
      title: input.title,
      description: input.description || null,
      type: input.type,
      priority: input.priority || 'medium',
      hotel_id: input.hotel_id || null,
      reported_by: userId,
    })
    .select(`
      id, title, description, type, status, priority, hotel_id, reported_by, 
      assigned_admin_id, created_at, updated_at, resolved_at,
      hotels(name)
    `)
    .single();

  if (error) return { data: null, error };

  return {
    data: {
      id: (data as any).id,
      title: (data as any).title,
      description: (data as any).description,
      type: (data as any).type,
      status: (data as any).status,
      priority: (data as any).priority,
      hotel_id: (data as any).hotel_id,
      hotel_name: (data as any).hotels?.name || null,
      reported_by: (data as any).reported_by,
      assigned_admin_id: (data as any).assigned_admin_id,
      created_at: (data as any).created_at,
      updated_at: (data as any).updated_at,
      resolved_at: (data as any).resolved_at,
    },
    error: null,
  };
}

export async function updateIncident(
  incidentId: string,
  updates: {
    status?: string;
    priority?: string;
    description?: string;
    assigned_admin_id?: string;
  }
): Promise<{ data: Incident | null; error: Error | null }> {
  const payload: any = { ...updates };
  
  // If resolving, set resolved_at timestamp
  if (updates.status === 'resolved' && !payload.resolved_at) {
    payload.resolved_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("incidents")
    .update(payload)
    .eq("id", incidentId)
    .select(`
      id, title, description, type, status, priority, hotel_id, reported_by, 
      assigned_admin_id, created_at, updated_at, resolved_at,
      hotels(name)
    `)
    .single();

  if (error) return { data: null, error };

  return {
    data: {
      id: (data as any).id,
      title: (data as any).title,
      description: (data as any).description,
      type: (data as any).type,
      status: (data as any).status,
      priority: (data as any).priority,
      hotel_id: (data as any).hotel_id,
      hotel_name: (data as any).hotels?.name || null,
      reported_by: (data as any).reported_by,
      assigned_admin_id: (data as any).assigned_admin_id,
      created_at: (data as any).created_at,
      updated_at: (data as any).updated_at,
      resolved_at: (data as any).resolved_at,
    },
    error: null,
  };
}

export async function deleteIncident(incidentId: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.from("incidents").delete().eq("id", incidentId);
  return { error };
}

// Hotel Quality Scores

export interface HotelQualityScore {
  hotel_id: string;
  hotel_name: string;
  quality_score: number;
  total_bookings: number;
  incident_count: number;
  success_rate: number;
}

export async function getHotelQualityScores(): Promise<{ data: HotelQualityScore[]; error: Error | null }> {
  const { data, error } = await supabase.rpc("get_hotel_quality_scores");
  if (error) return { data: [], error };

  return {
    data: (data ?? []).map((row: any) => ({
      hotel_id: row.hotel_id,
      hotel_name: row.hotel_name,
      quality_score: Number(row.quality_score ?? 0),
      total_bookings: Number(row.total_bookings ?? 0),
      incident_count: Number(row.incident_count ?? 0),
      success_rate: Number(row.success_rate ?? 0),
    })),
    error: null,
  };
}

// -----------------------------------------------------------------------------
// Customer notifications (booking confirmations, etc.)
// -----------------------------------------------------------------------------

export interface CustomerNotification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  notification_type: string;
  metadata: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

export async function fetchCustomerNotifications(): Promise<{
  data: CustomerNotification[];
  error: Error | null;
}> {
  const { data, error } = await supabase
    .from("customer_notifications")
    .select("id, user_id, title, body, notification_type, metadata, read_at, created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return { data: [], error };
  return { data: (data ?? []) as CustomerNotification[], error: null };
}

export async function markCustomerNotificationRead(id: string): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from("customer_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id);
  return { error };
}
