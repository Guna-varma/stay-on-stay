import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { BrandLogo } from "@/components/BrandLogo";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { Phone, ArrowLeft, Loader2 } from "lucide-react";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { signInWithGoogle, isSupabaseConfigured } from "@/lib/supabase";
import { requestWhatsAppSignInOtp, verifyWhatsAppSignInOtp } from "@/lib/whatsapp-verification";
import { useAuth } from "@/lib/auth";

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
            "If this number is saved on your StayOnStay profile, we sent a 6-digit code. Join the Twilio sandbox on your phone if you test in sandbox. Code expires in 10 minutes.",
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
      toast({ title: "Enter 6-digit code", variant: "destructive" });
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
      <DialogContent className="sm:max-w-[400px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4">
          <div className="flex justify-center mb-2">
            <BrandLogo variant="login" className="h-9 w-[140px]" />
          </div>
          <DialogTitle className="text-center text-lg">
            {step === "welcome" && "Welcome to StayOnStay"}
            {step === "phone" && "Continue with Phone"}
            {step === "otp" && "Enter verification code"}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6">
          {step === "welcome" && (
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full h-11"
                onClick={handleGoogle}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Continue with Google
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase text-muted-foreground">
                  <span className="bg-background px-2">or</span>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full h-11"
                onClick={handleContinueWithPhone}
                disabled={loading}
              >
                <Phone className="h-4 w-4 mr-2" />
                Continue with Phone
              </Button>
            </div>
          )}

          {step === "phone" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Country &amp; phone number</Label>
                <PhoneInput
                  international
                  countryCallingCodeEditable={false}
                  defaultCountry="IN"
                  value={phoneValue}
                  onChange={(v) => setPhoneValue(v ?? "")}
                  className="flex items-center gap-2 rounded-md border border-input bg-background px-3 h-11 [&_.PhoneInputInput]:bg-transparent [&_.PhoneInputInput]:border-0 [&_.PhoneInputInput]:outline-none [&_.PhoneInputInput]:text-sm"
                  numberInputProps={{ placeholder: "Phone number" }}
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setStep("welcome")}>
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
                <Button type="button" className="flex-1" onClick={handleSendOtp} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send OTP"}
                </Button>
              </div>
            </div>
          )}

          {step === "otp" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                We sent a 6-digit code on <span className="font-medium">WhatsApp</span> (if this number is on your
                profile). Valid for 10 minutes. Sandbox: join Twilio&apos;s WhatsApp sandbox first.
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
                  className="w-full"
                  onClick={handleSendOtp}
                  disabled={loading}
                >
                  Resend OTP
                </Button>
              )}
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setStep("phone")}>
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
                <Button
                  type="button"
                  className="flex-1"
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
