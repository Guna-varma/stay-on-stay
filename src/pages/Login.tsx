import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import {
  signInWithGoogle,
  signInWithEmailPassword,
  isSupabaseConfigured,
  getOnboardingStatus,
  updateProfileName,
  upsertUserPhone,
} from "@/lib/supabase";
import { requestWhatsAppSignInOtp, verifyWhatsAppSignInOtp } from "@/lib/whatsapp-verification";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { isValidEmail, validatePassword } from "@/lib/auth-forms";
import { AuthCard, AuthDivider, AuthPageLayout, authTheme } from "@/components/auth/AuthPageLayout";
import { PasswordField } from "@/components/auth/PasswordField";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft, User, Phone, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { BrandLogo } from "@/components/BrandLogo";

const COUNTRY_PHONE_RULES: Record<string, { min: number; max: number }> = {
  "+1": { min: 10, max: 10 },
  "+44": { min: 10, max: 10 },
  "+91": { min: 10, max: 10 },
  "+61": { min: 9, max: 9 },
  "+971": { min: 9, max: 9 },
  "+250": { min: 9, max: 9 },
};

function normalizeCountryCode(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits ? `+${digits}` : "";
}

function normalizeMobile(value: string): string {
  return value.replace(/\D/g, "");
}

function validatePhoneByCountry(countryCode: string, mobileNumber: string): string | null {
  const normalizedCountryCode = normalizeCountryCode(countryCode);
  const normalizedMobile = normalizeMobile(mobileNumber);

  if (!normalizedCountryCode || !/^\+\d{1,4}$/.test(normalizedCountryCode)) {
    return "Enter a valid country code (for example: +91).";
  }

  if (!normalizedMobile) {
    return "Mobile number is required";
  }

  const rule = COUNTRY_PHONE_RULES[normalizedCountryCode];
  if (rule) {
    if (normalizedMobile.length < rule.min || normalizedMobile.length > rule.max) {
      return `Mobile number for ${normalizedCountryCode} must be ${rule.min} digits.`;
    }
    return null;
  }

  if (normalizedMobile.length < 6 || normalizedMobile.length > 14) {
    return "Enter a valid mobile number.";
  }

  return null;
}

export default function Login() {
  const { user, isInitialized, recheckSession, login: loginDemo } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [onboardingLoading, setOnboardingLoading] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const [sessionRecheckDone, setSessionRecheckDone] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [mobile, setMobile] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [emailSignIn, setEmailSignIn] = useState("");
  const [passwordSignIn, setPasswordSignIn] = useState("");
  const [emailPasswordLoading, setEmailPasswordLoading] = useState(false);
  const [waCountryCode, setWaCountryCode] = useState("+91");
  const [waMobile, setWaMobile] = useState("");
  const [waStep, setWaStep] = useState<"phone" | "code">("phone");
  const [waPendingE164, setWaPendingE164] = useState<string | null>(null);
  const [waOtp, setWaOtp] = useState("");
  const [waRequestLoading, setWaRequestLoading] = useState(false);
  const [waVerifyLoading, setWaVerifyLoading] = useState(false);

  const hasSupabase = isSupabaseConfigured();

  // New tab / same browser: re-check session once so we don't show login if already signed in
  useEffect(() => {
    if (!isInitialized || user || !hasSupabase) {
      if (isInitialized && !user) setSessionRecheckDone(true);
      return;
    }
    let cancelled = false;
    const t = setTimeout(() => {
      if (!cancelled) setSessionRecheckDone(true);
    }, 600);
    recheckSession();
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [isInitialized, user, hasSupabase, recheckSession]);

  // Show message when redirected after OAuth state expired (bad_oauth_state)
  useEffect(() => {
    const oauthError = searchParams.get("oauth_error");
    const urlErrorCode = searchParams.get("error_code");
    const urlError = searchParams.get("error");
    const isStateExpired =
      oauthError === "state_expired" ||
      urlErrorCode === "bad_oauth_state" ||
      (urlError === "invalid_request" && (searchParams.get("error_description") ?? "").toLowerCase().includes("state"));
    if (isStateExpired) {
      toast({
        title: "Sign-in expired",
        description: "Please try signing in with Google again.",
        variant: "destructive",
      });
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, toast]);

  // Fast-path: existing user already has name in profile — redirect immediately, no extra API call needed.
  // New user (profileComplete=false): call getOnboardingStatus to get pre-filled values for the form.
  useEffect(() => {
    if (!user?.id || !isInitialized) return;

    // Existing user: profile already complete — go straight to their destination.
    if (user.profileComplete) {
      setOnboardingComplete(true);
      setOnboardingLoading(false);
      return;
    }

    // New user: check whether they've already completed onboarding (phone saved etc.)
    if (!hasSupabase) {
      setOnboardingComplete(true);
      setOnboardingLoading(false);
      return;
    }

    let mounted = true;
    getOnboardingStatus(user.id).then(({ data, error }) => {
      if (!mounted) return;
      setOnboardingLoading(false);
      // On error, fail open so existing users aren't blocked
      if (error) {
        setOnboardingComplete(true);
        return;
      }
      const complete = data?.complete ?? false;
      setOnboardingComplete(complete);
      if (data && !complete) {
        const first = (data.firstName ?? "").trim();
        const last = (data.lastName ?? "").trim();
        setFirstName(first || (user?.name?.trim().split(/\s+/)[0] ?? ""));
        setLastName(last || (user?.name?.trim().split(/\s+/).slice(1).join(" ") ?? ""));
        setCountryCode((data.countryCode ?? "").trim() || "+91");
        setMobile((data.phone ?? "").trim());
      }
    });
    return () => {
      mounted = false;
    };
  }, [user?.id, user?.profileComplete, isInitialized, hasSupabase]);

  // Redirect once onboarding is confirmed complete — always in an effect, never during render.
  useEffect(() => {
    if (!isInitialized || !user || onboardingComplete !== true) return;
    navigate(user.role === "customer" ? "/hotels" : "/dashboard", { replace: true });
  }, [isInitialized, user, onboardingComplete, navigate]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (user && onboardingComplete === true) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-2 bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
        <span className="text-sm text-muted-foreground">Redirecting…</span>
      </div>
    );
  }

  const handleEmailPasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = emailSignIn.trim().toLowerCase();
    if (!isValidEmail(email)) {
      toast({ title: "Invalid email", description: "Enter a valid email address.", variant: "destructive" });
      return;
    }
    const pErr = validatePassword(passwordSignIn);
    if (pErr) {
      toast({ title: pErr, variant: "destructive" });
      return;
    }
    setEmailPasswordLoading(true);
    try {
      if (hasSupabase) {
        await signInWithEmailPassword(email, passwordSignIn);
        toast({ title: "Signed in", description: "Welcome back." });
      } else {
        const result = loginDemo(email, passwordSignIn);
        if (!result.success) {
          toast({
            title: "Sign-in failed",
            description: result.error ?? "Invalid email or password.",
            variant: "destructive",
          });
          return;
        }
        toast({ title: "Signed in", description: "Welcome back." });
      }
    } catch (err) {
      toast({
        title: "Sign-in failed",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setEmailPasswordLoading(false);
    }
  };

  const handleWhatsAppRequestCode = async () => {
    const cc = normalizeCountryCode(waCountryCode);
    const digits = normalizeMobile(waMobile);
    const phoneErr = validatePhoneByCountry(cc, digits);
    if (phoneErr) {
      toast({ title: phoneErr, variant: "destructive" });
      return;
    }
    const e164 = `${cc}${digits.replace(/^0+/, "")}`;
    if (!hasSupabase) return;
    setWaRequestLoading(true);
    try {
      await requestWhatsAppSignInOtp(e164);
      setWaPendingE164(e164);
      setWaStep("code");
      setWaOtp("");
      toast({
        title: "Check WhatsApp",
        description: "If this number is saved on your StayOnStay profile, we sent a 6-digit code. It expires in 10 minutes.",
      });
    } catch (err) {
      toast({
        title: "Could not send code",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setWaRequestLoading(false);
    }
  };

  const handleWhatsAppVerify = async (codeOverride?: string) => {
    const code = (codeOverride ?? waOtp).replace(/\D/g, "");
    if (code.length !== 6) {
      toast({ title: "Enter the 6-digit code", variant: "destructive" });
      return;
    }
    if (!waPendingE164) {
      toast({ title: "Request a new code first", variant: "destructive" });
      return;
    }
    setWaVerifyLoading(true);
    try {
      await verifyWhatsAppSignInOtp(waPendingE164, code);
      toast({ title: "Signed in", description: "Welcome back." });
      setWaStep("phone");
      setWaPendingE164(null);
      setWaOtp("");
      setWaMobile("");
    } catch (err) {
      toast({
        title: "Sign-in failed",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setWaVerifyLoading(false);
    }
  };

  const handleLoginWithGoogle = async () => {
    if (!hasSupabase) {
      toast({
        title: "Sign-in not configured",
        description: "Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable Google sign-in.",
        variant: "destructive",
      });
      return;
    }
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      toast({ title: "Redirecting to Google…" });
    } catch (e) {
      toast({ title: "Sign-in failed", description: (e as Error).message, variant: "destructive" });
      setGoogleLoading(false);
    }
  };

  const handleSaveOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    const first = firstName.trim();
    const last = lastName.trim();
    const normalizedCountryCode = normalizeCountryCode(countryCode);
    const normalizedMobile = normalizeMobile(mobile);
    if (!first) {
      toast({ title: "First name is required", variant: "destructive" });
      return;
    }
    if (!last) {
      toast({ title: "Last name is required", variant: "destructive" });
      return;
    }
    const phoneError = validatePhoneByCountry(normalizedCountryCode, normalizedMobile);
    if (phoneError) {
      toast({ title: phoneError, variant: "destructive" });
      return;
    }
    if (!user?.id) return;
    setSaveLoading(true);
    try {
      const { error: err1 } = await updateProfileName(user.id, first, last);
      if (err1) throw err1;
      const { error: err2 } = await upsertUserPhone(user.id, normalizedCountryCode, normalizedMobile);
      if (err2) throw err2;
      setOnboardingComplete(true);
      toast({
        title: "Profile saved",
        description: user.role === "customer" ? "Taking you to Hotels." : "Taking you to your dashboard.",
      });
      navigate(user.role === "customer" ? "/hotels" : "/dashboard", { replace: true });
    } catch (err) {
      toast({ title: "Could not save", description: (err as Error).message, variant: "destructive" });
    } finally {
      setSaveLoading(false);
    }
  };

  // Still loading onboarding status for signed-in user
  if (user && onboardingLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Checking profile…</div>
      </div>
    );
  }

  // Signed-in but onboarding not complete (or error): show Name + Mobile form; cannot proceed until saved.
  if (user && onboardingComplete !== true) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <nav className="border-b bg-card/80 backdrop-blur-sm">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-4">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <BrandLogo variant="login" className="h-10 w-[170px] sm:h-12 sm:w-[210px] shadow-card" />
            </button>
          </div>
        </nav>
        <div className="flex-1 flex items-center justify-center px-3 sm:px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-[400px]"
          >
            <Card className="border-0 shadow-xl shadow-primary/5 bg-card">
              <CardContent className="p-8 sm:p-10">
                <div className="text-center mb-6">
                  <div className="mb-4 flex justify-center">
                    <BrandLogo variant="login" className="h-11 w-[160px]" />
                  </div>
                  <h1 className="text-xl font-heading font-bold">Complete your profile</h1>
                  <p className="text-muted-foreground text-sm mt-1">First-time login: add your name and mobile number.</p>
                </div>
                <form onSubmit={handleSaveOnboarding} className="space-y-5">
                  <div className="space-y-4 rounded-2xl border border-border/70 bg-gradient-to-b from-background to-muted/30 p-4 sm:p-5">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="firstName" className="text-[15px] font-semibold">First name</Label>
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">Mandatory</span>
                      </div>
                      <div className="group relative">
                        <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                        <Input
                          id="firstName"
                          type="text"
                          placeholder="Enter first name"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="h-12 rounded-xl border-border/80 bg-background/90 pl-10 text-base shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-primary/30"
                          autoComplete="given-name"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="lastName" className="text-[15px] font-semibold">Last name</Label>
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">Mandatory</span>
                      </div>
                      <div className="group relative">
                        <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                        <Input
                          id="lastName"
                          type="text"
                          placeholder="Enter last name"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="h-12 rounded-xl border-border/80 bg-background/90 pl-10 text-base shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-primary/30"
                          autoComplete="family-name"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="mobile" className="text-[15px] font-semibold">Mobile number</Label>
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">Mandatory</span>
                      </div>
                      <div className="grid grid-cols-[96px_1fr] gap-2.5">
                        <Input
                          type="text"
                          placeholder="+91"
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value)}
                          inputMode="tel"
                          className="h-12 rounded-xl border-border/80 bg-background/90 text-center text-base font-semibold tracking-wide shadow-sm"
                          aria-label="Country code"
                        />
                        <div className="group relative">
                          <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                          <Input
                            id="mobile"
                            type="tel"
                            placeholder="Enter mobile number"
                            value={mobile}
                            onChange={(e) => setMobile(e.target.value)}
                            inputMode="numeric"
                            pattern="[0-9]*"
                            autoComplete="tel-national"
                            className="h-12 rounded-xl border-border/80 bg-background/90 pl-10 text-base shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-primary/30"
                            required
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">Use digits only. Country code format: <span className="font-medium">+91</span>.</p>
                    </div>
                  </div>

                  <Button type="submit" size="lg" className="h-12 w-full rounded-xl text-base font-semibold shadow-premium" disabled={saveLoading}>
                    {saveLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Profile"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // Returned from Google with tokens in URL but session not yet recovered – show brief “Signing you in…”
  const hasOAuthHash = typeof window !== "undefined" && window.location.hash.includes("access_token");
  if (!user && isInitialized && hasOAuthHash) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Signing you in…</p>
        </div>
      </div>
    );
  }

  // New tab / same browser: briefly check for existing session before showing login form
  if (!user && isInitialized && !sessionRecheckDone) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Checking sign-in…</p>
        </div>
      </div>
    );
  }

  // Not signed in: email/password, Google, links (reference UI)
  return (
    <AuthPageLayout>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-[460px]"
      >
        <AuthCard>
          <div className="mb-5 flex justify-center">
            <BrandLogo variant="login" className="h-12 w-[180px] sm:h-14 sm:w-[200px]" />
          </div>
          <div className="flex justify-center">
            <span className={authTheme.sectionLabel}>Secure guest access</span>
          </div>
          <h1 className={cn(authTheme.title, "mt-4")}>Welcome back to StayOnStay</h1>
          <p className={cn(authTheme.subtitle, "mt-3")}>
            {hasSupabase
              ? "Sign in with email and password, continue with Google, or use WhatsApp if your saved mobile number is already on your profile."
              : "Demo mode is active. Use the test accounts below, or connect Supabase to enable Google sign-in and SMTP password reset."}
          </p>

          <form onSubmit={handleEmailPasswordSignIn} className="mt-8 space-y-4">
            <div className="flex items-center justify-between px-1 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              <span>Email and password</span>
              {hasSupabase && (
                <Link to="/forgot-password" className={cn("normal-case tracking-normal", authTheme.link)}>
                  Forgot password?
                </Link>
              )}
            </div>
            <div className={authTheme.inputWrap}>
              <Mail className={authTheme.inputIcon} aria-hidden />
              <input
                type="email"
                autoComplete="email"
                placeholder="Email address"
                value={emailSignIn}
                onChange={(e) => setEmailSignIn(e.target.value)}
                className={authTheme.input}
                required
              />
            </div>
            <PasswordField
              id="login-password"
              value={passwordSignIn}
              onChange={setPasswordSignIn}
              placeholder="Password"
              autoComplete="current-password"
              disabled={emailPasswordLoading}
            />
            <Button
              type="submit"
              disabled={emailPasswordLoading || googleLoading}
              className={cn("h-12 w-full rounded-xl text-base font-semibold", authTheme.accentBg)}
            >
              {emailPasswordLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign In"}
            </Button>
          </form>

          {!hasSupabase && (
            <p className="mt-3 rounded-2xl border border-border/60 bg-white/75 px-4 py-3 text-center text-[11px] leading-relaxed text-muted-foreground">
              Demo: <span className="font-mono text-foreground">customer@stayonstay.com</span> /{" "}
              <span className="font-mono text-foreground">12345678</span>
              <span className="block mt-1">Also: owner@, manager@, admin@ — same password.</span>
            </p>
          )}

          <AuthDivider label="More ways to continue" />

          {hasSupabase ? (
            <Button
              type="button"
              variant="outline"
              className={cn("h-12 w-full rounded-2xl text-base font-medium", authTheme.accentBorder)}
              onClick={handleLoginWithGoogle}
              disabled={googleLoading || emailPasswordLoading}
            >
              {googleLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" aria-hidden>
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Sign in with Google
                </>
              )}
            </Button>
          ) : (
            <p className="text-center text-xs text-muted-foreground">
              Google sign-in needs <code className="rounded bg-muted px-1">VITE_SUPABASE_*</code> in{" "}
              <code className="rounded bg-muted px-1">.env</code>.
            </p>
          )}

          {hasSupabase && (
            <>
              <AuthDivider label="WhatsApp sign in" />

              <div className={cn("px-4 py-4 sm:px-5", authTheme.surface)}>
                <p className="text-center text-sm font-semibold text-foreground">Sign in with WhatsApp</p>
                <p className="mt-1 text-center text-[11px] leading-snug text-muted-foreground">
                  Use the same mobile number you saved during profile setup. New here?{" "}
                  <Link to="/signup" className={authTheme.link}>
                    Sign up
                  </Link>{" "}
                  first.
                </p>

                {waStep === "phone" ? (
                  <div className="mt-4 space-y-3">
                    <div className="grid grid-cols-[88px_1fr] gap-2">
                      <Input
                        type="text"
                        placeholder="+91"
                        value={waCountryCode}
                        onChange={(e) => setWaCountryCode(e.target.value)}
                        inputMode="tel"
                        className="h-11 rounded-2xl border-border/80 bg-white text-center text-sm font-semibold"
                        aria-label="Country code"
                      />
                      <div className="relative">
                        <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="tel"
                          placeholder="Mobile number"
                          value={waMobile}
                          onChange={(e) => setWaMobile(e.target.value)}
                          inputMode="numeric"
                          className="h-11 rounded-2xl border-border/80 bg-white pl-9 text-sm"
                          autoComplete="tel-national"
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn("h-11 w-full rounded-2xl text-sm font-semibold", authTheme.accentBorder)}
                      onClick={handleWhatsAppRequestCode}
                      disabled={waRequestLoading || emailPasswordLoading || googleLoading}
                    >
                      {waRequestLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send WhatsApp code"}
                    </Button>
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    <p className="text-center text-xs text-muted-foreground">Enter the 6-digit code from WhatsApp</p>
                    <div className="flex justify-center">
                      <InputOTP
                        maxLength={6}
                        value={waOtp}
                        onChange={setWaOtp}
                        onComplete={(v) => void handleWhatsAppVerify(v)}
                        disabled={waVerifyLoading}
                      >
                        <InputOTPGroup className="gap-1">
                          {[0, 1, 2, 3, 4, 5].map((i) => (
                            <InputOTPSlot key={i} index={i} />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    <Button
                      type="button"
                      className={cn("h-11 w-full rounded-2xl text-sm font-semibold", authTheme.accentBg)}
                      onClick={() => void handleWhatsAppVerify()}
                      disabled={waVerifyLoading || waOtp.replace(/\D/g, "").length !== 6}
                    >
                      {waVerifyLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify and sign in"}
                    </Button>
                    <button
                      type="button"
                      className="w-full text-center text-xs text-muted-foreground underline-offset-2 hover:underline"
                      onClick={() => {
                        setWaStep("phone");
                        setWaPendingE164(null);
                        setWaOtp("");
                      }}
                    >
                      Use a different number
                    </button>
                  </div>
                )}

                <div className="mt-4 rounded-2xl border border-white/70 bg-white/75 px-3 py-3 text-center text-[11px] leading-5 text-muted-foreground">
                  Forgot your password instead? We’ll send a 6-digit reset code to your email using your configured SMTP mail setup.
                </div>
              </div>
            </>
          )}

          <div className="mt-6 rounded-[1.5rem] border border-border/60 bg-white/70 px-4 py-4 text-center text-sm">
            <p className="text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link to="/signup" className={authTheme.link}>
                Sign up now
              </Link>
            </p>
            {hasSupabase && (
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Need help resetting access?{" "}
                <Link to="/forgot-password" className={authTheme.link}>
                  Use the 6-digit email code flow
                </Link>
                .
              </p>
            )}
          </div>
        </AuthCard>
      </motion.div>
    </AuthPageLayout>
  );
}


