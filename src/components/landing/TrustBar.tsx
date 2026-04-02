import { Shield, Users, Clock, BadgeCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function TrustBar() {
  const { t } = useI18n();
  const items = [
    { icon: Users, labelKey: "trust.patients" },
    { icon: Shield, labelKey: "trust.verified" },
    { icon: Clock, labelKey: "trust.support" },
    { icon: BadgeCheck, labelKey: "trust.guide" },
  ];

  return (
    <section className="border-y border-border/80 bg-muted/40 py-4" aria-label={t("trust.aria")}>
      <div className="max-w-page mx-auto px-4 sm:px-6">
        <div className="flex gap-6 overflow-x-auto pb-1 scrollbar-none sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4 sm:gap-4 sm:pb-0">
          {items.map(({ icon: Icon, labelKey }) => (
            <div
              key={labelKey}
              className="flex min-w-[200px] shrink-0 items-center gap-3 sm:min-w-0"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Icon className="h-5 w-5 text-primary" aria-hidden />
              </div>
              <p className="text-sm font-medium text-foreground leading-snug">{t(labelKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
