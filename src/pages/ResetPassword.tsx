import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { AuthCard, AuthPageLayout, authTheme } from "@/components/auth/AuthPageLayout";
import { PasswordField } from "@/components/auth/PasswordField";
import { supabase, updateUserPassword, getProfile, isSupabaseConfigured } from "@/lib/supabase";
import { validatePassword, validatePasswordMatch } from "@/lib/auth-forms";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ProfileRole } from "@/lib/supabase";
import { BrandLogo } from "@/components/BrandLogo";

type ReadyState = "loading" | "form" | "invalid";

function postResetPath(role: ProfileRole | undefined): string {
  if (role === "customer") return "/hotels";
  return "/dashboard";
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const hasSb = isSupabaseConfigured();
  const [ready, setReady] = useState<ReadyState>("loading");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const trySession = useCallback(async (): Promise<boolean> => {
    const { data: { session } } = await supabase.auth.getSession();
    return Boolean(session);
  }, []);

  useEffect(() => {
    if (!hasSb) {
      setReady("invalid");
      return;
    }

    let cancelled = false;

    const boot = async () => {
      if (await trySession()) {
        if (!cancelled) setReady("form");
        return;
      }
      await new Promise((r) => setTimeout(r, 400));
      if (cancelled) return;
      if (await trySession()) {
        setReady("form");
        return;
      }
      await new Promise((r) => setTimeout(r, 1200));
      if (cancelled) return;
      if (await trySession()) {
        setReady("form");
        return;
      }
      setReady("invalid");
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (cancelled) return;
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady("form");
      }
    });

    boot();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [hasSb, trySession]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pErr = validatePassword(password);
    if (pErr) {
      toast({ title: pErr, variant: "destructive" });
      return;
    }
    const mErr = validatePasswordMatch(password, confirm);
    if (mErr) {
      toast({ title: mErr, variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await updateUserPassword(password);
      const { data: { user } } = await supabase.auth.getUser();
      let path = "/login";
      if (user?.id) {
        const { data: profile } = await getProfile(user.id);
        if (profile?.role) path = postResetPath(profile.role);
      }
      toast({
        title: "Password updated",
        description: "You’re signed in with your new password.",
      });
      navigate(path, { replace: true });
    } catch (err) {
      toast({
        title: "Could not update password",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!hasSb) {
    return (
      <AuthPageLayout>
        <AuthCard>
          <div className="mb-5 flex justify-center">
            <BrandLogo variant="login" className="h-12 w-[180px] sm:h-14 sm:w-[200px]" />
          </div>
          <h1 className={authTheme.title}>Reset password</h1>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Supabase is not configured. Add <code className="rounded bg-muted px-1">VITE_SUPABASE_URL</code> and{" "}
            <code className="rounded bg-muted px-1">VITE_SUPABASE_ANON_KEY</code>.
          </p>
          <Link to="/forgot-password" className={cn("mt-6 block text-center text-sm", authTheme.link)}>
            Back
          </Link>
        </AuthCard>
      </AuthPageLayout>
    );
  }

  if (ready === "loading") {
    return (
      <AuthPageLayout>
        <AuthCard>
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
            <p className="text-center text-sm text-muted-foreground">Confirming your reset session…</p>
          </div>
        </AuthCard>
      </AuthPageLayout>
    );
  }

  if (ready === "invalid") {
    return (
      <AuthPageLayout>
        <AuthCard>
          <div className="mb-5 flex justify-center">
            <BrandLogo variant="login" className="h-12 w-[180px] sm:h-14 sm:w-[200px]" />
          </div>
          <h1 className={authTheme.title}>Link invalid or expired</h1>
          <p className={cn(authTheme.subtitle, "mt-3")}>
            Open the reset link from your email again, or start over below. Links expire after a short time to keep your account safe.
          </p>
          <div className="mt-8 flex flex-col gap-3 text-center text-sm">
            <Link to="/forgot-password" className={cn(authTheme.link)}>
              Email me a new reset link
            </Link>
            <Link to="/login" className="text-muted-foreground hover:text-foreground">
              Back to sign in
            </Link>
          </div>
        </AuthCard>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout>
      <AuthCard>
        <div className="mb-5 flex justify-center">
          <BrandLogo variant="login" className="h-12 w-[180px] sm:h-14 sm:w-[200px]" />
        </div>
        <div className="flex justify-center">
          <span className={authTheme.sectionLabel}>Create new password</span>
        </div>
        <h1 className={authTheme.title}>Set a new password</h1>
        <p className={cn(authTheme.subtitle, "mt-3")}>Choose a strong password you haven’t used elsewhere.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <PasswordField
            id="reset-password-new"
            value={password}
            onChange={setPassword}
            placeholder="New password"
            autoComplete="new-password"
            disabled={submitting}
          />
          <PasswordField
            id="reset-password-confirm"
            value={confirm}
            onChange={setConfirm}
            placeholder="Confirm new password"
            autoComplete="new-password"
            disabled={submitting}
          />
          <Button
            type="submit"
            disabled={submitting}
            className={cn("h-12 w-full rounded-2xl text-base font-semibold", authTheme.accentBg)}
          >
            {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Update password"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            <Link to="/login" className={authTheme.link}>
              Back to sign in
            </Link>
          </p>
        </form>
      </AuthCard>
    </AuthPageLayout>
  );
}
