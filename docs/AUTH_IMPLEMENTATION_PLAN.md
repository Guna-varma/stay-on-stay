# StayOnStay – Secure Google OAuth + RBAC Implementation Plan

**Domain:** https://www.stayonstay.com  
**Supabase callback:** `https://ahmiqwvfajaawwjlesoy.supabase.co/auth/v1/callback`

---

## 1. Overview

This plan implements **production-ready Google OAuth via Supabase Auth** with **RBAC** for the StayOnStay hospitality SaaS. New users get `role = 'customer'` by default; only admins can change roles. RLS enforces permissions on `profiles`, `hotels`, and `hotel_staff`.

---

## 2. Authentication Flow

```
User clicks "Login with Google"
  → Redirect to Google OAuth
  → Supabase Auth handles callback
  → auth.users row created
  → DB trigger creates profiles row with role = 'customer'
  → Client: onAuthStateChange → fetch profile → set user + role
  → Redirect to /dashboard
```

---

## 3. Supported Roles

| Role          | Default for new users | Who can assign |
|---------------|------------------------|----------------|
| `customer`    | Yes                    | (automatic)    |
| `owner`       | No                     | admin only     |
| `manager`     | No                     | admin only     |
| `receptionist`| No                     | admin only     |
| `admin`       | No                     | manual/DB      |

- **Default:** every new user gets `role = 'customer'`.
- **Privilege escalation prevention:** users cannot update their own role; only admin can update other users’ roles.

---

## 4. Database Architecture

### 4.1 Tables

- **profiles**  
  - `id` UUID PK → `auth.users(id)`  
  - `email` TEXT  
  - `role` TEXT DEFAULT `'customer'`  
  - `created_at` TIMESTAMPTZ  

- **hotels**  
  - `id` UUID PK  
  - `name` TEXT  
  - `owner_id` UUID → `profiles(id)`  
  - `created_at` TIMESTAMPTZ  

- **hotel_staff**  
  - `id` UUID PK  
  - `hotel_id` UUID → `hotels(id)`  
  - `user_id` UUID → `profiles(id)`  
  - `role` TEXT CHECK (`role` IN ('manager','receptionist'))  
  - `created_at` TIMESTAMPTZ  

### 4.2 Auto profile creation

- **Trigger on `auth.users`:** after INSERT, insert into `profiles (id, email, role)` with `role = 'customer'`.

### 4.3 Row Level Security (RLS)

- **profiles**  
  - SELECT: own row (`auth.uid() = id`).  
  - UPDATE: only admin, and only on **other** users’ rows (so users cannot change their own role).  

- **hotels**  
  - Owner: full access where `owner_id = auth.uid()`.  
  - Admin: full access (e.g. `auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')`).  

- **hotel_staff**  
  - Access only for staff linked to the hotel (e.g. `EXISTS (SELECT 1 FROM hotel_staff WHERE hotel_id = hotels.id AND user_id = auth.uid())`) or for admins.  

- **Admin override:** where applicable, policies allow full access when `auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')`.

---

## 5. Client Implementation

### 5.1 Supabase client

- Single createClient using:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- OAuth redirect: `redirectTo: `${origin}/dashboard`` (or `/` and let app redirect to `/dashboard` when authenticated).

### 5.2 Auth / session API

- `getSession()` – get current Supabase session (with refresh).
- `getUser()` – get current Supabase user.
- `signInWithOAuth({ provider: 'google' })` – Google login.
- `logout()` – `signOut()`.

Token refresh is handled by the Supabase client; ensure one client instance is used app-wide.

### 5.3 AuthProvider (React)

- On init: call `getSession()`; if session exists, fetch `profiles` for `auth.uid()` to get `role`.
- Subscribe to `onAuthStateChange`: on SIGNED_IN, fetch profile and set user (id, email, role, name/avatar from provider if needed); on SIGNED_OUT, clear user.
- Expose: `user`, `login` (for mock/demo when Supabase not configured), `logout` (Supabase signOut when configured).

### 5.4 Login UI

- **Login with Google** button (primary when Supabase is configured).
- Optional: keep existing demo role selector + email/password when Supabase is not configured.
- After successful Google sign-in (and profile loaded), redirect to `/dashboard`.

### 5.5 Logout

- Logout button in header/shell: call `logout()` (Supabase `signOut`) and clear local state.

### 5.6 Admin role management

- **Server-side:** RLS allows UPDATE on `profiles` only when:
  - requester is admin, and  
  - target `id <> auth.uid()` (no self-role update).  
- **Client:** Admin-only UI calls `supabase.from('profiles').update({ role }).eq('id', targetUserId)`.  
- Do not trust client-side role for permission; RLS enforces “only admin can update other users’ roles”.

### 5.7 Protected routes

- **Guard:** Existing AppShell (or equivalent) checks `user` from AuthProvider.
  - If no user → redirect to `/login`.
  - If user exists but `canAccessPath(user.role, path)` is false → redirect to `/access-denied`.
- Ensure `getSession()` runs on app load so protected routes see the correct user after OAuth redirect.

---

## 6. Security Checklist

- [ ] New users get `role = 'customer'` only via DB trigger (no client control).
- [ ] RLS enabled on `profiles`, `hotels`, `hotel_staff`.
- [ ] Roles are never trusted from client; all permission checks use server-side data (RLS + profile fetched after auth).
- [ ] Only admin can update other users’ roles; users cannot update their own role (RLS UPDATE policy).
- [ ] Owners see only their hotels; staff see only hotels they belong to (RLS on `hotels` / `hotel_staff`).
- [ ] Supabase anon key is public; no secrets in client; RLS is the security boundary.

---

## 7. Supabase Dashboard Configuration

1. **Authentication → Providers:** enable Google OAuth; set Client ID and Secret.
2. **URL Configuration:**  
   - Site URL: `https://www.stayonstay.com`  
   - Redirect URLs: `https://www.stayonstay.com/dashboard`, `https://www.stayonstay.com`, and `http://localhost:*` for dev.
3. Run migrations in order: `001_initial_schema.sql`, then `002_rls.sql`.

---

## 8. Next Schema (Future)

For full hospitality flow, extend with:

- `rooms`, `room_types`, `bookings`, `payments`, `checkins`, `audit_logs`

Keep `hotels`, `hotel_staff`, and `profiles` as above; new tables will reference them and add their own RLS policies.

---

## 9. File Deliverables

| Item                    | Location / Description |
|-------------------------|------------------------|
| Implementation plan     | `docs/AUTH_IMPLEMENTATION_PLAN.md` (this file) |
| Schema + trigger        | `supabase/migrations/001_initial_schema.sql` |
| RLS policies           | `supabase/migrations/002_rls.sql` |
| Supabase client + auth  | `src/lib/supabase.ts` (client, getSession, getUser, logout, signInWithGoogle) |
| Session utilities      | Same file or `src/lib/session.ts` (getSession, getUser, logout) |
| AuthProvider (Supabase) | `src/lib/auth.tsx` (session + profile role, onAuthStateChange) |
| Login UI                | `src/pages/Login.tsx` + `src/components/auth/AuthModal.tsx` (Google button, redirect) |
| Logout                  | `AppHeader` or AppShell (logout button calling auth logout) |
| Admin role update       | `src/lib/admin-api.ts` or similar: `updateUserRole(targetId, role)` using Supabase; RLS enforces admin-only |
| Protected routes        | `AppShell` + route guard (existing); ensure session init on load |

---

*End of implementation plan.*
