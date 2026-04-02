import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n, LANGUAGE_OPTIONS } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const LanguageSwitcher = ({ compact }: { compact?: boolean }) => {
  const { language, setLanguage, t } = useI18n();
  const current = LANGUAGE_OPTIONS.find((l) => l.code === language);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={compact ? "icon" : "sm"}
          className={cn(
            compact
              ? "h-10 w-10 shrink-0 rounded-lg border border-border/60 bg-background/80 text-foreground hover:bg-muted/80"
              : "gap-2 text-muted-foreground",
          )}
          aria-label={t("lang.pageLanguage")}
          aria-haspopup="menu"
        >
          {current ? (
            compact ? (
              <img src={current.flagUrl} alt="" className="h-5 w-7 shrink-0 rounded-[2px]" loading="lazy" />
            ) : (
              <span className="flex items-center gap-2">
                <img src={current.flagUrl} alt="" className="h-3.5 w-5 shrink-0 rounded-[2px]" loading="lazy" />
                <span className="text-xs font-semibold tracking-wide">{t(`lang.${current.code}.label`)}</span>
              </span>
            )
          ) : (
            <span className="text-xs font-semibold tracking-wide">English</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[200px] p-0">
        <div className="max-h-[min(85vh,560px)] overflow-y-auto py-1">
          {LANGUAGE_OPTIONS.map((opt) => {
            const active = language === opt.code;
            return (
              <DropdownMenuItem
                key={opt.code}
                onClick={() => setLanguage(opt.code)}
                className={cn(
                  "flex cursor-pointer flex-row items-center gap-2 rounded-none px-3 py-2.5",
                  active && "bg-primary/10 focus:bg-primary/10",
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
