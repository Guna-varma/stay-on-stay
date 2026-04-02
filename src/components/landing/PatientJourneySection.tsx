import { Globe, HeartHandshake, MessageCircle, FileText, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function PatientJourneySection() {
  const { t } = useI18n();
  const steps = [
    { icon: Globe, n: "1", titleKey: "journey.step1.title", descKey: "journey.step1.desc" },
    { icon: HeartHandshake, n: "2", titleKey: "journey.step2.title", descKey: "journey.step2.desc" },
    { icon: MessageCircle, n: "3", titleKey: "journey.step3.title", descKey: "journey.step3.desc" },
    { icon: FileText, n: "4", titleKey: "journey.step4.title", descKey: "journey.step4.desc" },
    { icon: Sparkles, n: "5", titleKey: "journey.step5.title", descKey: "journey.step5.desc" },
  ];

  return (
    <section id="journey" className="py-12 lg:py-20 bg-background">
      <div className="max-w-page mx-auto px-4 sm:px-6">
        <div className="text-center mb-10 lg:mb-12">
          <h2 className="text-foreground text-2xl sm:text-3xl font-semibold tracking-tight mb-3">
            {t("journey.title")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            {t("journey.subtitle")}
          </p>
        </div>

        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((step) => (
            <li
              key={step.n}
              className="relative rounded-2xl border border-border/80 bg-card p-5 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <step.icon className="h-6 w-6 text-primary" aria-hidden />
                </div>
                <div className="min-w-0 pt-0.5">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                    {t("journey.stepLabel")} {step.n}
                  </span>
                  <h3 className="text-foreground font-semibold text-sm sm:text-base mt-1 leading-snug">
                    {t(step.titleKey)}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-2 leading-relaxed">
                    {t(step.descKey)}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
