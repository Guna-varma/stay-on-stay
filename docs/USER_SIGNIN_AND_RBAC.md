# User Sign-In and RBAC – Complete Process

This document describes how user sign-in and Role-Based Access Control (RBAC) work in StayOnStay, from first click to dashboard.

---

## 1. Roles (RBAC Overview)

There are **four roles**. The source of truth is the database table `public.profiles.role`.

| Role      | Description              | Typical UI / Access |
|-----------|--------------------------|---------------------|
| **customer** | Guest / patient family   | Search hotels, bookings, services, notifications, emergency |
| **owner**    | Hotel owner              | Analytics (revenue, occupancy, expenses, forecast, rooms), compliance |
| **manager**  | Front-desk / reception   | Check-in/out, room status, verifications, staff, reports, services |
| **admin**    | Platform administrator   | Users, hotels mgmt, payments, fraud, compliance, logs, incidents, settings |

- **App:** `UserRole` in `src/lib/auth.tsx` and `ProfileRole` in `src/lib/supabase.ts` match these values.
- **DB:** `profiles.role` has a CHECK constraint: `customer | owner | manager | admin`.
- **Default:** New users get `customer` (or `admin` only for a specific email; see below).

---

## 2. User Sign-In Flow (End-to-End)

### 2.1 Landing and Login Entry

- **Landing (`/`):** If the URL has `#access_token=...` (OAuth callback), the app redirects to `/login` with the same hash so the session can be restored on the Login page.
- **Login (`/login`):** Single entry for “Sign in with Google” and for post-login steps (onboarding or redirect).

### 2.2 Sign-In with Google (OAuth)

1. User clicks **“Sign in with Google”** on the Login page.
2. **`signInWithGoogle()`** (`src/lib/supabase.ts`):
   - Calls `supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: origin + "/login" } })`.
   - Receives a URL from Supabase and does **`window.location.href = data.url`** so the browser actually goes to Google.
3. User signs in (or chooses account) on Google.
4. Google redirects back to **`{origin}/login#access_token=...&refresh_token=...`** (and related params in the hash).

### 2.3 Session Recovery (AuthProvider)

1. **AuthProvider** (`src/lib/auth.tsx`) runs on app load (and when returning from Google).
2. If the URL hash contains `access_token`, it waits briefly and calls **`getSession()`** (and retries once if needed) so Supabase can recover the session from the hash.
3. **`getSession()`** returns the Supabase session (JWT in `session.access_token`). Supabase uses `detectSessionInUrl: true`, so it can parse the hash and establish the session.
4. With a valid session, the provider calls **`getProfile(session.user.id)`** to load the row from **`public.profiles`** (id, email, role).
5. It builds an **`AuthUser`** (id, email, role, name from `user_metadata`, avatar) and sets it in React state. **Role always comes from `profiles.role`**, not from the JWT payload.
6. **`onAuthStateChange`** is subscribed so future sign-in / token refresh / sign-out updates the same user state.

So: **Identity** comes from Supabase Auth (Google); **role** comes from **`public.profiles`**.

### 2.4 Profile Creation in the Database (New Users)

- When a new user is created in **`auth.users`** (after first Google sign-in), a trigger **`on_auth_user_created`** runs (migration `20250315000001`, refined in `20250315000013`).
- **`handle_new_user()`** inserts one row into **`public.profiles`**:
  - `id` = `auth.users.id`
  - `email` = from auth
  - `role` = **`'customer'`** for every new user
- So every new user starts as a customer; admins are assigned explicitly (via SQL or the Admin → Users UI) and RLS uses `profiles.role` as the single source of truth.

### 2.5 Onboarding (First-Time: Name + Phone)

- **Login page** uses **`getOnboardingStatus(userId)`** to decide:
  - **Complete:** `profiles.first_name`, `profiles.last_name`, and at least one phone in **`user_contacts`** are all present.
  - **Incomplete:** Any of these is missing (or error from API is treated as incomplete).
- If **incomplete**:
  - User is shown the **“Complete your profile”** form: **First name**, **Last name**, **Mobile number** (all required).
  - User cannot proceed until they submit; **Save** calls **`updateProfileName`** and **`upsertUserPhone`** (both use Supabase with RLS).
  - After a successful save, the app sets onboarding complete and **navigates to `/dashboard`**.
- If **complete**:
  - Login page **redirects to `/dashboard`** (no form).
- **AppShell** (which wraps `/dashboard`, `/profile`, and all protected routes) also calls **`getOnboardingStatus`**. If the result is **not complete**, it **redirects to `/login`** so the user cannot bypass onboarding by opening `/dashboard` directly.

So: **First login** → profile exists with role but no name/phone → user must complete the form → then they can reach the dashboard. **Later logins** → onboarding complete → straight redirect to dashboard.

### 2.6 Redirect to Role-Specific Dashboard

- **AppShell** ensures the user is logged in and onboarding is complete; then it checks **`canAccessPath(user.role, pathname)`** (`src/lib/roles.ts`). If the path is not allowed for that role, it redirects to **`/access-denied`**.
- **Dashboard** route (`/dashboard`) is rendered by **`DashboardRouter`** in **`App.tsx`**:
  - It reads **`user.role`** and renders:
    - **customer** → `CustomerDashboard`
    - **owner** → `OwnerAnalytics`
    - **manager** → `ReceptionDashboard`
    - **admin** → `AdminDashboard`
- Sidebar and nav items are also role-based: **`ROLE_NAV`** in **`src/lib/roles.ts`** defines which links each role sees (e.g. customers see Search Hotels, My Bookings; admins see Users, Hotels, Payments, etc.).

---

## 3. RBAC in the Application (Front-End)

| Layer            | What it does |
|------------------|--------------|
| **AuthProvider** | Holds `user` (id, email, **role**, name, avatar). Role comes from `getProfile()` → `profiles.role`. |
| **AppShell**     | 1) No user → redirect to `/login`. 2) Onboarding not complete → redirect to `/login`. 3) `canAccessPath(role, path)` false → redirect to `/access-denied`. |
| **DashboardRouter** | Renders the correct dashboard component by **`user.role`** (customer / owner / manager / admin). |
| **ROLE_NAV**     | Defines sidebar/nav links per role; only allowed paths are shown and are accessible. |
| **canAccessPath(role, path)** | Returns whether a path (e.g. `/dashboard`, `/users`, `/hotels`) is allowed for that role. |

So the **same** role value from **`profiles.role`** drives: which dashboard is shown, which routes are allowed, and which nav items appear.

---

## 4. RBAC in the Database (RLS)

Row Level Security (RLS) enforces who can read or change data. The database uses **`auth.uid()`** (from the JWT) to identify the user and **`public.profiles`** to know their role. The app never sends a “role” in the request; the DB derives it.

### 4.1 Profiles

- **SELECT:** User can read **own** row (`auth.uid() = id`). Admins can read **all** profiles (for user management).
- **UPDATE:** User can update **own** row only for **non-role** columns (e.g. `first_name`, `last_name`) via policy **`profiles_update_own`** (migration `20250315000007`). They cannot change their own `role`. Only **admin** can update **other** users’ profiles (e.g. change role) via **`profiles_update_admin_only`**.

So: **Role is set at signup (trigger) or by an admin later;** normal users cannot change their role.

### 4.2 Other Tables (Conceptual)

- **Hotels:** Owners can manage their own hotels; admins can manage all (policies in migrations 002, 004, 006).
- **Hotel staff, bookings, etc.:** Similarly, policies use `auth.uid()` and sometimes join to `profiles` to check `role` (e.g. admin) or ownership (e.g. owner_id, user_id).

Every request is authorized by the DB using the JWT and `profiles`; the UI only reflects what the backend allows.

---

## 5. Flow Summary (Diagram)

```
User visits /login
       │
       ▼
Clicks "Sign in with Google"
       │
       ▼
Browser → Google → Back to /login#access_token=...
       │
       ▼
AuthProvider: getSession() from hash → getProfile(userId) → set user (id, email, role, name, avatar)
       │
       ▼
Login page: getOnboardingStatus(userId)
       │
       ├── complete (first_name, last_name, phone in DB)
       │      → navigate("/dashboard")
       │      → AppShell allows → DashboardRouter → role-specific dashboard
       │
       └── not complete
              → Show "Complete your profile" (First name, Last name, Mobile)
              → User saves → updateProfileName + upsertUserPhone
              → navigate("/dashboard")
              → same as above
```

---

## 6. Important Files

| Purpose              | File(s) |
|----------------------|--------|
| Supabase client, session, OAuth, profile & onboarding API | `src/lib/supabase.ts` |
| Auth state (user, role), session restore, logout        | `src/lib/auth.tsx` |
| Role labels, nav per role, `canAccessPath`               | `src/lib/roles.ts` |
| Login UI, Google button, onboarding form                | `src/pages/Login.tsx` |
| Protected layout, onboarding check, route access         | `src/components/AppShell.tsx` |
| Routes, dashboard by role                                | `src/App.tsx` |
| Profile creation trigger, role default & admin email     | `supabase/migrations/20250315000001_initial_schema.sql`, `20250315000006_admin_role_and_policies.sql` |
| RLS: profiles (own + admin), hotels, etc.                | `supabase/migrations/20250315000002_rls.sql`, `007_profiles_update_own_onboarding.sql`, others |

---

## 7. Security Notes

- **Role is never taken from the client.** It is read from `public.profiles` in the backend (getProfile) and enforced again by RLS on every query.
- **JWT** contains identity (`auth.uid()`); RLS and `getProfile()` supply role from `profiles`.
- **Onboarding** is enforced both on the Login page (no redirect until complete) and in AppShell (redirect to `/login` if not complete), so users cannot skip the “Complete your profile” step by manipulating the URL.
