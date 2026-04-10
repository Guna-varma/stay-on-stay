import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Loader2, Mail, Phone, User } from "lucide-react";
import { AuthCard, AuthPageLayout, authTheme } from "@/components/auth/AuthPageLayout";
import { PasswordField } from "@/components/auth/PasswordField";
import { signUpWithEmailPassword, isSupabaseConfigured } from "@/lib/supabase";
import {
  isValidEmail,
  validateFullName,
  validatePassword,
  validatePasswordMatch,
  validateOptionalPhone,
  validateGender,
  type GenderValue,
} from "@/lib/auth-forms";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const GENDER_OPTIONS: { value: GenderValue; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

export default function SignUp() {
  const { user, isInitialized } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isInitialized || !user) return;
    navigate(user.role === "customer" ? "/hotels" : "/dashboard", { replace: true });
  }, [isInitialized, user, navigate]);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState<GenderValue>("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const hasSb = isSupabaseConfigured();

  if (isInitialized && user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FDFBF0]">
        <p className="text-stone-500">Redirecting…</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasSb) {
      toast({
        title: "Sign-up unavailable",
        description: "Connect Supabase (env vars) to create an account.",
        variant: "destructive",
      });
      return;
    }

    const nameErr = validateFullName(fullName);
    if (nameErr) {
      toast({ title: nameErr, variant: "destructive" });
      return;
    }
    const em = email.trim().toLowerCase();
    if (!isValidEmail(em)) {
      toast({ title: "Invalid email", description: "Enter a valid email address.", variant: "destructive" });
      return;
    }
    const gErr = validateGender(gender);
    if (gErr) {
      toast({ title: gErr, variant: "destructive" });
      return;
    }
    const phoneErr = validateOptionalPhone(phone);
    if (phoneErr) {
      toast({ title: phoneErr, variant: "destructive" });
      return;
    }
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

    setLoading(true);
    try {
      const data = await signUpWithEmailPassword(em, password, {
        full_name: fullName.trim(),
        gender,
        phone: phone.trim() || undefined,
      });

      if (data.session) {
        toast({ title: "Account created", description: "Welcome to StayOnStay." });
        navigate("/login", { replace: true });
        return;
      }
      toast({
        title: "Confirm your email",
        description: "We sent you a link. After confirming, sign in on the next screen.",
      });
      navigate("/login", { replace: true });
    } catch (err) {
      toast({
        title: "Could not sign up",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageLayout>
      <AuthCard>
        <h1 className={authTheme.title}>Create Your Account</h1>
        <p className={cn(authTheme.subtitle, "mt-2")}>Join StayOnStay to book stays and manage your trips.</p>

        {!hasSb ? (
          <p className="mt-6 text-center text-sm text-stone-600">
            Sign-up requires Supabase configuration.{" "}
            <Link to="/login" className={authTheme.link}>
              Sign in
            </Link>
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div className={authTheme.inputWrap}>
              <User className={authTheme.inputIcon} aria-hidden />
              <input
                type="text"
                autoComplete="name"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={authTheme.input}
                required
              />
            </div>
            <div className={authTheme.inputWrap}>
              <Mail className={authTheme.inputIcon} aria-hidden />
              <input
                type="email"
                autoComplete="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={authTheme.input}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Select value={gender || undefined} onValueChange={(v) => setGender(v as GenderValue)}>
                <SelectTrigger
                  className={cn(
                    "h-12 rounded-xl border-stone-300 bg-white pl-3 text-left text-stone-800 focus:ring-[#A68948]/25",
                    !gender && "text-stone-400",
                  )}
                >
                  <SelectValue placeholder="Select Gender" />
                </SelectTrigger>
                <SelectContent>
                  {GENDER_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className={authTheme.inputWrap}>
              <Phone className={authTheme.inputIcon} aria-hidden />
              <input
                type="tel"
                autoComplete="tel"
                placeholder="Phone Number (Optional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={authTheme.input}
              />
            </div>

            <PasswordField
              id="signup-password"
              value={password}
              onChange={setPassword}
              placeholder="Password"
              autoComplete="new-password"
            />
            <PasswordField
              id="signup-confirm"
              value={confirm}
              onChange={setConfirm}
              placeholder="Confirm Password"
              autoComplete="new-password"
            />

            <Button
              type="submit"
              disabled={loading}
              className={cn("h-12 w-full rounded-xl text-base font-semibold", authTheme.accentBg)}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign Up"}
            </Button>

            <p className="pt-2 text-center text-sm text-stone-600">
              Already have an account?{" "}
              <Link to="/login" className={authTheme.link}>
                Sign in
              </Link>
            </p>
          </form>
        )}
      </AuthCard>
    </AuthPageLayout>
  );
}
