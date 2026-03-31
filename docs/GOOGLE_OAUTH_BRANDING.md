# Show "StayOnStay" on Google Sign-In (Instead of Supabase URL)

Google’s sign-in page shows **"to continue to [domain]"** using the **redirect URI’s domain**. With Supabase Auth, that redirect goes to Supabase, so Google shows the Supabase project URL unless you change how the flow is hosted.

---

## What you can do today (no code change)

### 1. Brand the OAuth consent screen

So users see **StayOnStay** (and your logo) on the consent step:

1. Open **[Google Cloud Console](https://console.cloud.google.com/)** → **APIs & Services** → **OAuth consent screen**.
2. **Application name:** set to **StayOnStay** (or your product name).
3. **Application logo:** upload your app logo (optional but recommended).
4. **Support email** and **Developer contact** as required.
5. Save.

This affects the **consent** screen (where users click “Allow”). The **first** screen (“Sign in”) may still say “to continue to [Supabase domain]” because that comes from the redirect URI host.

### 2. Why “to continue to” shows the Supabase URL

- Google takes the **redirect_uri** you send (e.g. `https://ahmiqwvfajaawwjlesoy.supabase.co/auth/v1/callback`) and shows its **host** in “to continue to [host]”.
- With Supabase, that host is your Supabase project URL. So the text is correct from Google’s point of view: the user is being sent to that URL to complete sign-in.

### 3. Showing your own domain instead

To have “to continue to **stayonstay.com**” (or similar), the redirect URI would need to be on **your** domain. That means:

- Using a **custom domain for Supabase** (e.g. `auth.stayonstay.com` pointing at your Supabase project), if your plan supports it, **or**
- Using an auth proxy on your backend that receives the callback on your domain and then talks to Supabase.

So:

- **Right now:** Use the OAuth consent screen (app name + logo) so the flow is clearly “StayOnStay”. The first screen may still show the Supabase URL.
- **Later:** If you need “to continue to stayonstay.com”, look into Supabase custom domains or a backend proxy and then use that URL as the redirect_uri in Google and Supabase.

---

## Summary

| Goal | Action |
|------|--------|
| Users see “StayOnStay” and your logo | OAuth consent screen: set **Application name** and **Application logo** in Google Cloud Console. |
| Change “to continue to [Supabase URL]” | Redirect URI must be on your domain (custom auth domain or proxy); then add that URL in Google and Supabase. |
