import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { authTheme } from "@/components/auth/AuthPageLayout";
import { cn } from "@/lib/utils";

type Props = {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete?: string;
  disabled?: boolean;
};

export function PasswordField({ id, value, onChange, placeholder, autoComplete = "current-password", disabled }: Props) {
  const [show, setShow] = useState(false);
  return (
    <div className={authTheme.inputWrap}>
      <Lock className={authTheme.inputIcon} aria-hidden />
      <input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        className={cn(authTheme.input, authTheme.inputWithRightIcon, "pr-11")}
      />
      <button
        type="button"
        tabIndex={-1}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
