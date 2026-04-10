import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { cn } from "@/lib/utils";

/** Cream + gold auth theme (sign-in / sign-up / forgot password). */
export const authTheme = {
  pageBg: "bg-[#FDFBF0]",
  card: "rounded-[1.25rem] border border-stone-200/80 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.06)]",
  title: "text-center font-heading text-xl font-semibold tracking-tight text-[#6B5A32] sm:text-2xl",
  subtitle: "text-center text-sm text-stone-500",
  accent: "text-[#A68948]",
  accentBg: "bg-[#A68948] hover:bg-[#8f7239] text-white",
  accentBorder: "border-[#A68948] text-[#6B5A32] hover:bg-[#A68948]/5",
  inputWrap: "relative",
  inputIcon: "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400",
  input:
    "h-12 w-full rounded-xl border border-stone-300 bg-white pl-10 pr-3 text-stone-800 shadow-sm placeholder:text-stone-400 focus-visible:border-[#A68948] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A68948]/25",
  inputWithRightIcon: "pr-10",
  link: "text-[#A68948] underline-offset-4 hover:underline font-medium",
};

type Props = {
  children: React.ReactNode;
  backTo?: string;
  className?: string;
};

export function AuthPageLayout({ children, backTo = "/", className }: Props) {
  return (
    <div className={cn("min-h-screen", authTheme.pageBg, className)}>
      <nav className="border-b border-stone-200/60 bg-white/70 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-lg items-center px-4 sm:h-16">
          <Link
            to={backTo}
            className="flex items-center gap-2 text-stone-500 transition-colors hover:text-[#6B5A32]"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
            <BrandLogo variant="login" className="h-9 w-[150px] sm:h-10 sm:w-[170px]" />
          </Link>
        </div>
      </nav>
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-10 sm:min-h-[calc(100vh-4rem)] sm:py-12">
        {children}
      </div>
    </div>
  );
}

export function AuthCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("w-full max-w-[420px]", className)}>
      <div className={cn("p-6 sm:p-8", authTheme.card)}>{children}</div>
    </div>
  );
}
