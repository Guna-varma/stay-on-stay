import { cn } from "@/lib/utils";

type BrandLogoVariant = "header" | "hero" | "footer" | "sidebar" | "login";

interface BrandLogoProps {
  className?: string;
  imageClassName?: string;
  variant?: BrandLogoVariant;
}

const wrapperClasses: Record<BrandLogoVariant, string> = {
  header: "h-9 min-h-9 w-[140px] min-w-[140px] sm:h-10 sm:min-h-10 sm:w-[160px] sm:min-w-[160px] md:h-11 md:w-[180px] md:min-w-[180px]",
  hero: "h-20 w-[260px] sm:h-24 sm:w-[320px] md:h-28 md:w-[380px]",
  footer: "h-10 w-[160px] sm:h-12 sm:w-[190px]",
  sidebar: "h-9 w-[140px]",
  login: "h-12 w-[200px] sm:h-14 sm:w-[240px]",
};

export function BrandLogo({
  className,
  imageClassName,
  variant = "header",
}: BrandLogoProps) {
  return (
    <div className={cn("inline-flex items-center justify-center shrink-0 overflow-visible", wrapperClasses[variant], className)}>
      <img
        src="/logo.png"
        alt="StayOnStay"
        className={cn("h-full w-full object-contain object-center", imageClassName)}
      />
    </div>
  );
}
