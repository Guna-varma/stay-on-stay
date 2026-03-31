# Fix: Google OAuth "redirect_uri_mismatch" (Error 400)

Google blocks sign-in when the redirect URI in the request doesn’t **exactly** match one of the URIs in your OAuth client.

With **Supabase Auth**, Google is told to redirect to **Supabase’s** callback URL, not your app. You must add that URL in Google Cloud Console.

---

## Step 1: Add the redirect URI in Google Cloud Console

1. Open **[Google Cloud Console](https://console.cloud.google.com/)** and select your project (or the one used for StayOnStay).
2. Go to **APIs & Services** → **Credentials**.
3. Open your **OAuth 2.0 Client ID** (the one whose Client ID is `1095870339746-...apps.googleusercontent.com`).
4. Under **Authorized redirect URIs**, click **ADD URI** and add **exactly**:

   ```
   https://ahmiqwvfajaawwjlesoy.supabase.co/auth/v1/callback
   ```

5. Save.

No trailing slash, no typo. This is the URL Supabase uses to receive the code from Google.

---

## Step 2: Confirm Supabase redirect URLs (optional)

In **Supabase Dashboard** → **Authentication** → **URL Configuration**:

- **Site URL:** e.g. `http://localhost:8080` (dev) or `https://www.stayonstay.com` (prod).
- **Redirect URLs:** add where your app runs, for example:
  - `http://localhost:8080/dashboard`
  - `https://www.stayonstay.com/dashboard`

These are where Supabase sends the user **after** the callback; they don’t fix the Google `redirect_uri_mismatch` by themselves.

---

## Summary

| Where              | URL to add |
|--------------------|------------|
| **Google Console** (Authorized redirect URIs) | `https://ahmiqwvfajaawwjlesoy.supabase.co/auth/v1/callback` |
| **Supabase** (Redirect URLs)                 | `http://localhost:8080/dashboard`, `https://www.stayonstay.com/dashboard` |

After saving in Google Cloud Console, wait a minute and try **Login with Google** again.
