import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n, LANGUAGE_OPTIONS } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Variant = "default" | "minimal";

const LanguageSwitcher = ({ compact, variant = "default" }: { compact?: boolean; variant?: Variant }) => {
  const { language, setLanguage, t } = useI18n();
  const current = LANGUAGE_OPTIONS.find((l) => l.code === language);
  const code = (current?.code ?? "en").toUpperCase();

  const isMinimal = variant === "minimal" && !compact;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={compact ? "icon" : "sm"}
          className={cn(
            compact
              ? "h-10 w-10 shrink-0 rounded-xl border border-border/50 bg-background text-foreground hover:bg-muted/80"
              : isMinimal
                ? "h-9 shrink-0 gap-2 rounded-full border border-border/40 bg-muted/25 px-3 text-foreground hover:bg-muted/45 sm:h-10 sm:px-3.5"
                : "h-9 gap-1.5 rounded-full border border-border/50 bg-muted/20 px-2.5 text-xs font-medium text-foreground/90 shadow-sm hover:bg-muted/40 hover:text-foreground sm:h-10 sm:gap-2 sm:px-3 sm:text-sm",
          )}
          aria-label={t("lang.pageLanguage")}
          aria-haspopup="menu"
        >
          {current ? (
            compact ? (
              <img src={current.flagUrl} alt="" className="h-5 w-7 shrink-0 rounded-[2px]" loading="lazy" />
            ) : isMinimal ? (
              <span className="flex items-center gap-2">
                <img src={current.flagUrl} alt="" className="h-3.5 w-5 shrink-0 rounded-[2px]" loading="lazy" />
                <span className="text-[11px] font-semibold uppercase tracking-wide text-foreground/90">{code}</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <img src={current.flagUrl} alt="" className="h-3.5 w-5 shrink-0 rounded-[2px]" loading="lazy" />
                <span className="hidden font-medium sm:inline">{t(`lang.${current.code}.label`)}</span>
              </span>
            )
          ) : (
            <span className="text-xs font-semibold tracking-wide">EN</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[220px] p-0">
        <div className="border-b border-border/60 px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t("lang.pageLanguage")}</p>
        </div>
        <div className="max-h-[min(85vh,560px)] overflow-y-auto py-1">
          {LANGUAGE_OPTIONS.map((opt) => {
            const active = language === opt.code;
            return (
              <DropdownMenuItem
                key={opt.code}
                onClick={() => setLanguage(opt.code)}
                className={cn(
                  "flex cursor-pointer flex-row items-center gap-3 rounded-none px-3 py-2.5",
                  active && "bg-primary/8 focus:bg-primary/8",
                )}
              >
                <img src={opt.flagUrl} alt="" className="h-4 w-6 shrink-0 rounded-[2px]" loading="lazy" />
                <span className={cn("font-medium leading-tight", active ? "text-primary" : "text-foreground")}>
                  {t(`lang.${opt.code}.label`)}
                </span>
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
