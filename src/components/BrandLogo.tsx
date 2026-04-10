import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type BrandLogoVariant = "header" | "hero" | "footer" | "sidebar" | "login";

interface BrandLogoProps {
  className?: string;
  imageClassName?: string;
  variant?: BrandLogoVariant;
}

/** Descriptive alt for SEO and a11y */
export const BRAND_LOGO_ALT =
  "StayOnStay — book trusted hotel and medical stay accommodation in India";

const ASSETS: Record<BrandLogoVariant, { svg: string; png: string }> = {
  header: { svg: "/logo-header.svg", png: "/logo-header.png" },
  sidebar: { svg: "/logo-header.svg", png: "/logo-header.png" },
  login: { svg: "/logo-center.svg", png: "/logo-center.png" },
  footer: { svg: "/logo.svg", png: "/logo.png" },
  hero: { svg: "/logo-header.svg", png: "/logo-header.png" },
};

const objectAlign: Record<BrandLogoVariant, string> = {
  header: "object-left",
  sidebar: "object-left",
  login: "object-center",
  footer: "object-center",
  hero: "object-center",
};

const wrapperClasses: Record<BrandLogoVariant, string> = {
  header:
    "h-10 min-h-10 max-h-11 w-auto min-w-[168px] max-w-[min(78vw,300px)] sm:h-11 sm:min-h-11 sm:max-h-12 sm:min-w-[188px] sm:max-w-[340px]",
  hero: "h-20 w-auto min-w-[220px] max-w-[min(92vw,440px)] sm:h-24 sm:min-w-[280px] md:h-28 md:min-w-[340px]",
  footer: "h-10 w-auto min-w-[120px] max-w-[200px] sm:h-12 sm:max-w-[220px]",
  sidebar: "h-9 w-auto min-w-[140px] max-w-[220px]",
  login: "h-12 w-auto min-w-[160px] max-w-[min(85vw,280px)] sm:h-14 sm:min-w-[200px] sm:max-w-[300px]",
};

export function BrandLogo({
  className,
  imageClassName,
  variant = "header",
}: BrandLogoProps) {
  const { svg, png } = ASSETS[variant];
  const [usePng, setUsePng] = useState(false);
  const src = usePng ? png : svg;

  useEffect(() => {
    setUsePng(false);
  }, [variant, svg, png]);

  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-visible",
        wrapperClasses[variant],
        className,
      )}
    >
      <img
        src={src}
        alt={BRAND_LOGO_ALT}
        width={1926}
        height={938}
        className={cn(
          "h-full w-auto max-h-full object-contain",
          objectAlign[variant],
          imageClassName,
        )}
        decoding="async"
        fetchPriority={variant === "header" ? "high" : "auto"}
        onError={() => {
          if (!usePng) setUsePng(true);
        }}
      />
    </div>
  );
}
