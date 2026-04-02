import { Search, CalendarCheck, Smile } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const HowItWorks = () => {
  const { t } = useI18n();

  const steps = [
    { icon: Search, step: "1", titleKey: "how.step1.title", descKey: "how.step1.desc" },
    { icon: CalendarCheck, step: "2", titleKey: "how.step2.title", descKey: "how.step2.desc" },
    { icon: Smile, step: "3", titleKey: "how.step3.title", descKey: "how.step3.desc" },
  ];

  return (
    <section className="py-12 lg:py-20">
      <div className="max-w-page">
        <div className="text-center mb-12">
          <h2 className="text-foreground mb-3">{t("how.title")}</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">{t("how.subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((item, i) => (
            <div
              key={item.step}
              className="text-center animate-fade-in"
              style={{ animationDelay: `${i * 0.12}s` }}
            >
              <div className="relative w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5 group-hover:bg-primary/15 transition-colors">
                <item.icon className="h-7 w-7 text-primary" />
                <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center shadow-sm">
                  {item.step}
                </span>
              </div>
              <h4 className="text-foreground mb-2">{t(item.titleKey)}</h4>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                {t(item.descKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
