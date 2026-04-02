import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const DEFAULT_INTERVAL_MS = 3000;

export function HotelCoverCarousel({
  images,
  alt,
  className,
  imageClassName,
  intervalMs = DEFAULT_INTERVAL_MS,
  showBottomGradient = false,
}: {
  images: string[];
  alt: string;
  className?: string;
  imageClassName?: string;
  /** Auto-advance interval when there are 2+ images (default 3000 ms). */
  intervalMs?: number;
  /** Dark gradient at bottom (e.g. hotel hero); keeps dot indicators above the overlay. */
  showBottomGradient?: boolean;
}) {
  const urls = images.filter(Boolean);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (urls.length <= 1) return;
    const t = setInterval(() => {
      setIdx((i) => (i + 1) % urls.length);
    }, intervalMs);
    return () => clearInterval(t);
  }, [urls.length, intervalMs]);

  if (urls.length === 0) {
    return <div className={cn("bg-muted", className)} aria-hidden />;
  }

  const gradientEl = showBottomGradient ? (
    <div
      className="pointer-events-none absolute inset-0 z-[8] bg-gradient-to-t from-black/70 via-black/20 to-transparent"
      aria-hidden
    />
  ) : null;

  if (urls.length === 1) {
    return (
      <div className={cn("relative overflow-hidden", className)}>
        <img
          src={urls[0]}
          alt={alt}
          className={cn("relative z-0 h-full w-full object-cover", imageClassName)}
          loading="eager"
          decoding="async"
        />
        {gradientEl}
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {urls.map((src, i) => (
        <img
          key={`${src}-${i}`}
          src={src}
          alt={i === idx ? alt : ""}
          loading={i === 0 ? "eager" : "lazy"}
          decoding="async"
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-500",
            i === idx ? "z-10 opacity-100" : "z-0 opacity-0",
            imageClassName,
          )}
        />
      ))}
      {gradientEl}
      <div className="pointer-events-none absolute bottom-2 left-0 right-0 z-20 flex justify-center gap-1.5">
        {urls.map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i === idx ? "w-8 bg-white/90" : "w-1.5 bg-white/50",
            )}
          />
        ))}
      </div>
    </div>
  );
}
