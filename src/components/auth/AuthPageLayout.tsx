import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { cn } from "@/lib/utils";

/** Shared auth styles — glassmorphism + solid primary CTAs (gradient CSS vars are not valid Tailwind bg-color). */
export const authTheme = {
  pageBg:
    "bg-[radial-gradient(circle_at_18%_0%,rgba(17,157,168,0.2),transparent_40%),radial-gradient(circle_at_82%_15%,rgba(59,130,246,0.1),transparent_42%),linear-gradient(180deg,#eef8fa_0%,#e8f3f6_48%,#f4fafb_100%)]",
  card:
    "rounded-[1.75rem] border border-white/55 bg-white/45 shadow-[0_12px_48px_rgba(15,23,42,0.1),inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-2xl supports-[backdrop-filter]:bg-white/38 dark:border-white/10 dark:bg-slate-950/45",
  title:
    "text-center font-heading text-[1.65rem] font-semibold tracking-tight text-foreground sm:text-[2rem] text-balance",
  subtitle: "text-center text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]",
  accent: "text-primary",
  /** Solid primary — reliable contrast on glass cards (avoid `bg-[var(--gradient-primary)]`). */
  accentBg:
    "bg-primary text-primary-foreground shadow-md shadow-primary/25 hover:bg-primary/92 active:bg-primary/88 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2",
  accentBorder:
    "border border-primary/25 bg-white/55 text-foreground shadow-sm backdrop-blur-sm hover:border-primary/40 hover:bg-white/75 dark:bg-white/10 dark:hover:bg-white/15",
  inputWrap: "group relative",
  inputIcon:
    "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary",
  input:
    "h-12 min-h-[48px] w-full rounded-2xl border border-white/60 bg-white/60 pl-10 pr-3 text-foreground shadow-inner shadow-black/[0.03] backdrop-blur-sm placeholder:text-muted-foreground focus-visible:border-primary/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 dark:bg-white/10 dark:border-white/15",
  inputWithRightIcon: "pr-10",
  link: "font-semibold text-primary underline-offset-4 hover:underline",
  sectionLabel:
    "inline-flex items-center rounded-full bg-primary/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary backdrop-blur-sm",
  surface: "rounded-[1.5rem] border border-white/45 bg-white/35 shadow-sm backdrop-blur-md dark:bg-white/5",
  helper: "text-xs leading-relaxed text-muted-foreground",
  dividerLabel:
    "bg-white/80 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground backdrop-blur-sm",
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

      <nav className="relative border-b border-white/50 bg-white/50 backdrop-blur-2xl supports-[backdrop-filter]:bg-white/40">
        <div className="mx-auto flex h-14 min-h-[3.5rem] max-w-[1160px] items-center px-3 sm:h-16 sm:px-6">
          <Link
            to={backTo}
            className="inline-flex items-center gap-3 rounded-full border border-white/70 bg-white/80 px-3.5 py-2 text-sm font-medium text-muted-foreground shadow-sm transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
            <BrandLogo variant="login" className="h-8 w-[138px] sm:h-9 sm:w-[150px]" />
          </Link>
        </div>
      </nav>
      <div className="relative flex min-h-[calc(100vh-3.5rem)] items-start justify-center px-3 py-8 sm:min-h-[calc(100vh-4rem)] sm:items-center sm:px-4 sm:py-12">
        {children}
      </div>
    </div>
  );
}

export function AuthCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("w-full max-w-[min(28rem,100%)]", className)}>
      <div className={cn("p-5 sm:p-8", authTheme.card)}>{children}</div>
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
