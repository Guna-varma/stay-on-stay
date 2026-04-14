import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { BrandLogo } from "@/components/BrandLogo";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { Phone, ArrowLeft, Loader2, Mail } from "lucide-react";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { signInWithGoogle, isSupabaseConfigured } from "@/lib/supabase";
import { requestWhatsAppSignInOtp, verifyWhatsAppSignInOtp } from "@/lib/whatsapp-verification";
import { useAuth } from "@/lib/auth";
import { authTheme } from "@/components/auth/AuthPageLayout";
import { cn } from "@/lib/utils";

type Step = "welcome" | "phone" | "otp";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Optional: "signin" vs "signup" - same flow, auto account detection */
  mode?: "signin" | "signup";
}

const OTP_RESEND_SECONDS = 45;

export function AuthModal({ open, onOpenChange, mode = "signin" }: AuthModalProps) {
  const { toast } = useToast();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("welcome");
  const [phoneValue, setPhoneValue] = useState<string>("");
  const [otp, setOtp] = useState("");
  const [resendSeconds, setResendSeconds] = useState(0);
  const [loading, setLoading] = useState(false);

  const hasSupabase = isSupabaseConfigured();

  const resetState = () => {
    setStep("welcome");
    setPhoneValue("");
    setOtp("");
    setResendSeconds(0);
    setLoading(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) resetState();
    onOpenChange(next);
  };

  const handleGoogle = async () => {
    if (!hasSupabase) {
      toast({ title: "Auth not configured", description: "Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY for Google sign-in.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await signInWithGoogle();
      toast({ title: "Redirecting to Google…" });
    } catch (e) {
      toast({ title: "Sign-in failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleContinueWithPhone = () => {
    setStep("phone");
  };

  const handleSendOtp = async () => {
    const normalized = phoneValue?.trim() ?? "";
    if (!normalized) {
      toast({ title: "Enter phone number", variant: "destructive" });
      return;
    }
    if (hasSupabase && !isValidPhoneNumber(normalized)) {
      toast({ title: "Invalid phone number", description: "Include country code and a valid mobile number.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      if (hasSupabase) {
        await requestWhatsAppSignInOtp(normalized);
        toast({
          title: "Check WhatsApp",
          description:
            "If this number is on your profile, open WhatsApp for your sign-in code. It expires in 10 minutes. (Sandbox: join Twilio WhatsApp sandbox first if you test there.)",
        });
      } else {
        toast({ title: "Demo mode", description: "Add VITE_SUPABASE_* and deploy WhatsApp Edge Functions to use real OTP." });
      }
      setStep("otp");
      setOtp("");
      setResendSeconds(OTP_RESEND_SECONDS);
    } catch (e) {
      toast({ title: "Failed to send code", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (codeOverride?: string) => {
    const pin = (codeOverride ?? otp).replace(/\D/g, "");
    if (pin.length !== 6) {
      toast({ title: "Enter the full code", variant: "destructive" });
      return;
    }
    const e164 = phoneValue?.trim() ?? "";
    setLoading(true);
    try {
      if (hasSupabase) {
        await verifyWhatsAppSignInOtp(e164, pin);
        toast({ title: "Signed in successfully" });
        handleOpenChange(false);
      } else {
        login("customer@stayonstay.com", "12345678");
        toast({ title: "Signed in (demo)" });
        handleOpenChange(false);
      }
    } catch (e) {
      toast({ title: "Invalid code", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (step !== "otp" || resendSeconds <= 0) return;
    const t = setInterval(() => setResendSeconds((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [step, resendSeconds]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="overflow-hidden border border-white/55 bg-white/50 p-0 shadow-[0_24px_64px_rgba(15,23,42,0.14)] backdrop-blur-2xl supports-[backdrop-filter]:bg-white/40 sm:max-w-[min(520px,calc(100vw-1.5rem))] sm:rounded-3xl">
        <DialogHeader className="px-6 pb-4 pt-7 sm:px-8">
          <div className="mb-3 flex justify-center">
            <BrandLogo variant="login" className="h-10 w-[152px]" />
          </div>
          <div className="flex justify-center">
            <span className={authTheme.sectionLabel}>{mode === "signup" ? "Create account" : "Secure sign in"}</span>
          </div>
          <DialogTitle className="mt-4 text-center font-heading text-[1.9rem] font-semibold tracking-tight text-foreground">
            {step === "welcome" && "Welcome to StayOnStay"}
            {step === "phone" && "Continue with WhatsApp"}
            {step === "otp" && "Enter verification code"}
          </DialogTitle>
          <p className="mt-2 text-center text-sm leading-6 text-muted-foreground">
            {step === "welcome" && "Choose how you want to continue. Email sign in, sign up, and password reset are available too."}
            {step === "phone" && "Use the mobile number already saved on your StayOnStay profile."}
            {step === "otp" && "Enter the code we sent on WhatsApp."}
          </p>
        </DialogHeader>

        <div className="px-6 pb-7 sm:px-8">
          {step === "welcome" && (
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className={cn("h-12 min-h-[48px] w-full rounded-2xl text-base font-medium", authTheme.accentBorder)}
                onClick={handleGoogle}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
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
                    Continue with Google
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className={cn("h-12 w-full rounded-2xl text-base font-medium", authTheme.accentBorder)}
                onClick={handleContinueWithPhone}
                disabled={loading}
              >
                <Phone className="h-4 w-4 mr-2" />
                Continue with Phone
              </Button>
              <Button
                type="button"
                variant="outline"
                className={cn("h-12 w-full rounded-2xl text-base font-medium", authTheme.accentBorder)}
                onClick={() => {
                  handleOpenChange(false);
                  navigate("/login");
                }}
                disabled={loading}
              >
                <Mail className="mr-2 h-4 w-4" />
                Continue with Email
              </Button>

              <div className={cn("rounded-[1.5rem] px-4 py-4 text-center", authTheme.surface)}>
                <p className="text-sm text-muted-foreground">
                  New to StayOnStay?{" "}
                  <Link
                    to="/signup"
                    className={authTheme.link}
                    onClick={() => handleOpenChange(false)}
                  >
                    Create an account
                  </Link>
                </p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  Forgot your password?{" "}
                  <Link
                    to="/forgot-password"
                    className={authTheme.link}
                    onClick={() => handleOpenChange(false)}
                  >
                    click here
                  </Link>
                </p>
              </div>
            </div>
          )}

          {step === "phone" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">Country &amp; phone number</Label>
                <PhoneInput
                  international
                  countryCallingCodeEditable={false}
                  defaultCountry="IN"
                  value={phoneValue}
                  onChange={(v) => setPhoneValue(v ?? "")}
                  className="flex h-12 items-center gap-2 rounded-2xl border border-border/70 bg-white px-3 shadow-sm [&_.PhoneInputInput]:bg-transparent [&_.PhoneInputInput]:border-0 [&_.PhoneInputInput]:outline-none [&_.PhoneInputInput]:text-sm"
                  numberInputProps={{ placeholder: "Phone number" }}
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="sm" className="rounded-full" onClick={() => setStep("welcome")}>
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
                <Button type="button" className={cn("h-12 flex-1 rounded-2xl text-sm font-semibold", authTheme.accentBg)} onClick={handleSendOtp} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send OTP"}
                </Button>
              </div>
            </div>
          )}

          {step === "otp" && (
            <div className="space-y-4">
              <p className="text-center text-sm text-muted-foreground">
                We sent a code on <span className="font-medium">WhatsApp</span> when this number matches your profile.
                Valid for 10 minutes.
              </p>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={setOtp}
                  onComplete={(v) => void handleVerifyOtp(v)}
                >
                  <InputOTPGroup className="gap-1">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              {resendSeconds > 0 ? (
                <p className="text-center text-xs text-muted-foreground">
                  Resend code in {resendSeconds}s
                </p>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full rounded-full"
                  onClick={handleSendOtp}
                  disabled={loading}
                >
                  Resend OTP
                </Button>
              )}
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => setStep("phone")}>
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
                <Button
                  type="button"
                  className={cn("h-12 flex-1 rounded-2xl text-sm font-semibold", authTheme.accentBg)}
                  onClick={handleVerifyOtp}
                  disabled={otp.length !== 6 || loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
