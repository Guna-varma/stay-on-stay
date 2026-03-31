# Supabase – StayOnStay

## Schema summary

| Area | Tables / features |
|------|-------------------|
| **Auth & users** | `profiles` (id, email, role, first_name, last_name, avatar_url, …); `user_contacts` (phone for onboarding); trigger creates profile with `role = 'customer'` for every new auth user. Admins are assigned manually. |
| **Roles** | `customer`, `owner`, `manager`, `admin` (CHECK on `profiles.role`). |
| **Hotels** | `hotels` (name, owner_id, description, address, city, country, image_url, soft delete); `hotel_staff` (manager per hotel, one hotel per manager). |
| **Rooms** | `room_types`, `room_type_images`, `rooms` (status: available | occupied | maintenance | cleaning). |
| **Bookings** | `guests`, `guest_contacts`, `bookings` (daterange, no double-book), `payments`, `checkins`, `checkouts`. |
| **Other** | `notifications`, `audit_logs`; soft delete (deleted_at) on profiles, hotels, hotel_staff, room_types, rooms, guests. |
| **Storage** | Bucket `hotel-images` (public, 512KB limit, jpeg/png/webp); owners upload to `{owner_id}/...`. |

The app code in `src/lib/supabase.ts` matches this schema (profiles, hotels, room_types, rooms, user_contacts, getProfile, getOnboardingStatus, etc.). No schema changes are required for current app behavior **if** all migrations below have been applied.

## Migrations

Run migrations in order via Supabase Dashboard (SQL Editor) or CLI:

1. **20250315000001_initial_schema.sql** – `profiles`, `hotels`, `hotel_staff`, trigger to create profile with `role = 'customer'` on signup.
2. **20250315000002_rls.sql** – Row Level Security for profiles, hotels, hotel_staff.
3. **20250315000003_schema_scale.sql** – Extended profiles/hotels, `user_contacts`, `room_types`, `rooms`, `guests`, `guest_contacts`, `bookings` (daterange + double-booking constraint), `payments`, `checkins`, `checkouts`, `notifications`, `audit_logs`, indexes.
4. **20250315000004_rls_scale.sql** – RLS policies for all new tables.
5. **20250315000005_roles_three_only.sql** – Roles: Customer, Owner, Manager only; migrate existing data; drop admin-only policies.
6. **20250315000006_admin_role_and_policies.sql** – Re-add Admin role; admin RLS policies for profiles, hotels, staff, and scale tables.
7. **20250315000007_profiles_update_own_onboarding.sql** – Users can update own profile (name) for onboarding; role unchanged.
8. **20250315000008_soft_delete_and_historical_data.sql** – Soft delete (deleted_at/deleted_by) and RLS updates.
9. **20250315000009_fix_profiles_policy_recursion.sql** – `current_user_role()` / `current_user_is_admin()` to fix profiles RLS recursion.
10. **20250315000010_owner_manager_hotel_room_access.sql** – `hotels.image_url`; manager one-hotel; manager room_types/rooms access.
11. **20250315000011_owner_manager_role_assignment_rpc.sql** – RPCs for owner: list promotable customers, list/assign/revoke managers.
12. **20250315000012_storage_hotel_images.sql** – Storage bucket `hotel-images` (public, size/MIME limits) and owner upload/update/delete policies.
13. **20250315000013_admin_role_manual.sql** – Remove hardcoded admin email; `handle_new_user` always inserts customers; admins are assigned manually.
14. **20250315000014_room_images_booking_rpc_stripe.sql** – `room_type_images`; booking Stripe + price snapshot columns; `count_available_rooms()`; `assign_room_and_create_booking()` (transaction + `FOR UPDATE SKIP LOCKED`); `stripe_webhook_events`; admin storage policy on `hotel-images`.
15. **20250315000015_public_catalog_and_rpc_fix.sql** – Public `SELECT` on active hotels / room_types / rooms; `count_available_rooms` as `SECURITY DEFINER`; `guest_has_overlapping_booking`; `stripe_webhook_events` RLS for admin read.
16. **20250315000016_fix_hotel_staff_rls_recursion.sql** – Fixes **42P17 infinite recursion** on `hotel_staff` by replacing the self-referential `hotel_staff_select_same_hotel` policy with `user_has_active_hotel_staff_assignment()` (`SECURITY DEFINER`).

### Edge Functions (Stripe)

Deploy from `stay-on-stay/supabase/functions/`:

```bash
cd stay-on-stay
npx supabase functions deploy stripe-webhook --no-verify-jwt
npx supabase functions deploy create-checkout-session --no-verify-jwt
npx supabase functions deploy verify-checkout-session --no-verify-jwt
```

Set secrets in the Supabase project (Dashboard → Edge Functions → Secrets or CLI):

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SUPABASE_URL` (often auto)
- `SUPABASE_SERVICE_ROLE_KEY`

Configure Stripe webhook endpoint URL to `https://<project-ref>.supabase.co/functions/v1/stripe-webhook` and subscribe to `checkout.session.completed`.

### Using Supabase CLI

```bash
npx supabase link --project-ref ahmiqwvfajaawwjlesoy
npx supabase db push
```

Or paste each migration file into the SQL Editor in the Supabase Dashboard and run.

## Do I need to update anything?

- **If you’ve only run migrations 01–07:** Run **08–12** in order so you have soft delete, RLS recursion fix, `hotels.image_url`, manager access, owner/manager RPCs, and the **hotel-images** storage bucket (needed for hotel image uploads).
- **If you’ve run 01–11:** Run **20250315000012_storage_hotel_images.sql** so production has the `hotel-images` bucket and policies; otherwise hotel image uploads will fail.
- **App code:** No changes needed; `src/lib/supabase.ts` already matches the schema above.

## Auth setup

1. **Authentication → Providers:** Enable Google; set Client ID and Secret.
2. **URL Configuration:**
   - Site URL: `https://www.stayonstay.com` (or your production URL).
   - Redirect URLs: include `/login` (e.g. `https://www.stayonstay.com/login`, `http://localhost:5173/login`) since Google OAuth redirects to `/login`.

## First admin user

New users get `role = 'customer'` via the trigger. To create an admin:

1. Sign in with Google once so a `profiles` row exists.
2. In Supabase Dashboard → Table Editor → `profiles`, set `role = 'admin'` for that user’s row.

After that, that user can change other users’ roles from the Admin → Users UI.
