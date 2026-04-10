import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Loader2, Mail } from "lucide-react";
import { AuthCard, AuthPageLayout, authTheme } from "@/components/auth/AuthPageLayout";
import { isValidEmail } from "@/lib/auth-forms";
import { requestEmailPasswordResetOtp, verifyEmailPasswordResetOtp } from "@/lib/email-password-reset";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";

export default function ForgotPassword() {
  const { user, isInitialized } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [otpDigits, setOtpDigits] = useState(6);
  const [otp, setOtp] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const hasSb = isSupabaseConfigured();

  useEffect(() => {
    if (!isInitialized || !user) return;
    navigate(user.role === "customer" ? "/hotels" : "/dashboard", { replace: true });
  }, [isInitialized, user, navigate]);

  if (isInitialized && user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FDFBF0]">
        <p className="text-stone-500">Redirecting…</p>
      </div>
    );
  }

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasSb) {
      toast({
        title: "Not configured",
        description: "Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
        variant: "destructive",
      });
      return;
    }
    const em = email.trim().toLowerCase();
    if (!isValidEmail(em)) {
      toast({ title: "Invalid email", description: "Enter a valid email address.", variant: "destructive" });
      return;
    }
    setRequestLoading(true);
    try {
      const { digits } = await requestEmailPasswordResetOtp(em);
      setOtpDigits(Math.min(8, Math.max(4, digits)));
      setOtp("");
      setStep("code");
      toast({
        title: "Check your email",
        description: "If this address is registered, we sent a code. It expires in 15 minutes.",
      });
    } catch (err) {
      toast({
        title: "Could not send code",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setRequestLoading(false);
    }
  };

  const runVerify = async (codeRaw: string) => {
    const code = codeRaw.replace(/\D/g, "");
    if (code.length !== otpDigits) {
      toast({ title: `Enter all ${otpDigits} digits`, variant: "destructive" });
      return;
    }
    const em = email.trim().toLowerCase();
    setVerifyLoading(true);
    try {
      await verifyEmailPasswordResetOtp(em, code);
      toast({ title: "Code accepted", description: "Choose a new password on the next screen." });
      navigate("/reset-password", { replace: true });
    } catch (err) {
      toast({
        title: "Invalid or expired code",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <AuthPageLayout>
      <AuthCard>
        <h1 className={authTheme.title}>Forgot Password</h1>
        <p className={cn(authTheme.subtitle, "mt-2")}>
          {step === "email"
            ? "Enter your email and we’ll send a one-time code to reset your password."
            : `Enter the ${otpDigits}-digit code we sent to your inbox.`}
        </p>
        {hasSb && step === "email" && (
          <p className="mt-3 rounded-lg bg-amber-50/80 px-3 py-2 text-center text-[11px] leading-snug text-stone-600">
            Codes are sent by a Supabase Edge Function using your <span className="font-mono">SMTP_*</span> vault
            values (and matching Edge secrets in production). Not read by the browser app.
          </p>
        )}

        {!hasSb ? (
          <p className="mt-6 text-center text-sm text-stone-600">
            Password reset requires Supabase.{" "}
            <Link to="/login" className={authTheme.link}>
              Back to sign in
            </Link>
          </p>
        ) : step === "email" ? (
          <form onSubmit={handleSendCode} className="mt-8 space-y-5">
            <div className={authTheme.inputWrap}>
              <Mail className={authTheme.inputIcon} aria-hidden />
              <input
                type="email"
                autoComplete="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={authTheme.input}
                required
              />
            </div>
            <Button
              type="submit"
              disabled={requestLoading}
              className={cn("h-12 w-full rounded-xl text-base font-semibold", authTheme.accentBg)}
            >
              {requestLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send code"}
            </Button>
            <p className="text-center text-sm text-stone-600">
              <Link to="/login" className={authTheme.link}>
                Back to sign in
              </Link>
            </p>
          </form>
        ) : (
          <div className="mt-8 space-y-5">
            <p className="text-center text-xs text-stone-500">{email}</p>
            <div className="flex justify-center">
              <InputOTP
                maxLength={otpDigits}
                value={otp}
                onChange={setOtp}
                disabled={verifyLoading}
                onComplete={(v) => void runVerify(v)}
              >
                <InputOTPGroup className="gap-1">
                  {Array.from({ length: otpDigits }, (_, i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
            <Button
              type="button"
              disabled={verifyLoading || otp.replace(/\D/g, "").length !== otpDigits}
              className={cn("h-12 w-full rounded-xl text-base font-semibold", authTheme.accentBg)}
              onClick={() => void runVerify(otp)}
            >
              {verifyLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify code"}
            </Button>
            <button
              type="button"
              className="w-full text-center text-xs text-stone-500 underline-offset-2 hover:underline"
              onClick={() => {
                setStep("email");
                setOtp("");
              }}
            >
              Use a different email
            </button>
            <p className="text-center text-sm text-stone-600">
              <Link to="/login" className={authTheme.link}>
                Back to sign in
              </Link>
            </p>
          </div>
        )}
      </AuthCard>
    </AuthPageLayout>
  );
}
