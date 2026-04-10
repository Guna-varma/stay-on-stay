import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { cn } from "@/lib/utils";

/** Shared auth styles aligned to the landing-page palette. */
export const authTheme = {
  pageBg:
    "bg-[radial-gradient(circle_at_top,_rgba(17,157,168,0.16),_transparent_30%),linear-gradient(180deg,_#f7fbfc_0%,_#eef7f7_45%,_#f8fbfb_100%)]",
  card:
    "rounded-[2rem] border border-white/80 bg-white/92 shadow-[0_20px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl",
  title: "text-center font-heading text-[1.9rem] font-semibold tracking-tight text-foreground sm:text-[2.15rem]",
  subtitle: "text-center text-sm leading-6 text-muted-foreground",
  accent: "text-primary",
  accentBg: "bg-[var(--gradient-primary)] text-white shadow-[var(--shadow-premium)] hover:opacity-95",
  accentBorder: "border border-primary/20 bg-white text-foreground hover:border-primary/35 hover:bg-primary/[0.05]",
  inputWrap: "group relative",
  inputIcon:
    "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary",
  input:
    "h-12 w-full rounded-2xl border border-border/70 bg-white/90 pl-10 pr-3 text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:border-primary/35 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10",
  inputWithRightIcon: "pr-10",
  link: "font-semibold text-primary underline-offset-4 hover:underline",
  sectionLabel:
    "inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary",
  surface: "rounded-[1.5rem] border border-border/60 bg-muted/25",
  helper: "text-xs leading-5 text-muted-foreground",
  dividerLabel: "bg-white px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground",
};

type Props = {
  children: React.ReactNode;
  backTo?: string;
  className?: string;
};

export function AuthPageLayout({ children, backTo = "/", className }: Props) {
  return (
    <div className={cn("relative isolate min-h-screen overflow-hidden", authTheme.pageBg, className)}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-12rem] h-[22rem] w-[22rem] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-[-12%] top-[18%] h-[20rem] w-[20rem] rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute bottom-[-10rem] left-[20%] h-[18rem] w-[18rem] rounded-full bg-success/10 blur-3xl" />
      </div>

      <nav className="relative border-b border-white/70 bg-white/72 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1160px] items-center px-4 sm:px-6">
          <Link
            to={backTo}
            className="inline-flex items-center gap-3 rounded-full border border-white/70 bg-white/80 px-3.5 py-2 text-sm font-medium text-muted-foreground shadow-sm transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
            <BrandLogo variant="login" className="h-8 w-[138px] sm:h-9 sm:w-[150px]" />
          </Link>
        </div>
      </nav>
      <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10 sm:py-12">
        {children}
      </div>
    </div>
  );
}

export function AuthCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("w-full max-w-[460px]", className)}>
      <div className={cn("p-6 sm:p-8", authTheme.card)}>{children}</div>
    </div>
  );
}

export function AuthDivider({ label = "or" }: { label?: string }) {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-border/70" />
      </div>
      <div className="relative flex justify-center">
        <span className={authTheme.dividerLabel}>{label}</span>
      </div>
    </div>
  );
}
