import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";

/**
 * OAuth callback page — Supabase redirects here after Google sign-in.
 *
 * The Supabase client automatically detects the access_token / refresh_token
 * in the URL hash (detectSessionInUrl: true) and fires onAuthStateChange(SIGNED_IN).
 * AuthProvider resolves the user; once ready we redirect by role.
 */
export default function AuthCallback() {
  const { user, isInitialized } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isInitialized) return;

    if (user) {
      // Redirect by role — same logic as DashboardRouter / Login
      const dest = user.role === "customer" ? "/hotels" : "/dashboard";
      navigate(dest, { replace: true });
    } else {
      // Session failed to establish — send back to login
      navigate("/login", { replace: true });
    }
  }, [isInitialized, user, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
      <p className="text-sm text-muted-foreground animate-pulse">
        Signing you in…
      </p>
    </div>
  );
}
