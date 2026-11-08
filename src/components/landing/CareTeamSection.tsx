import { motion, useReducedMotion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { CARE_TEAM_MEMBERS } from "@/lib/healthcare-images";
import { Reveal } from "@/components/motion/Reveal";

export default function CareTeamSection() {
  const { t } = useI18n();
  const reduce = useReducedMotion();

  return (
    <section
      className="py-12 lg:py-20 bg-gradient-to-b from-background via-muted/20 to-background border-y border-border/40"
      aria-labelledby="care-team-heading"
    >
      <div className="max-w-page mx-auto px-4 sm:px-6">
        <Reveal className="text-center mb-10 lg:mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-2">{t("team.kicker")}</p>
          <h2 id="care-team-heading" className="text-foreground text-2xl sm:text-3xl font-semibold tracking-tight mb-3">
            {t("team.title")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            {t("team.subtitle")}
          </p>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {CARE_TEAM_MEMBERS.map((member, i) => (
            <Reveal key={member.nameKey} delay={i * 0.1}>
              <Card className="overflow-hidden border-border/60 shadow-card hover:shadow-premium transition-shadow duration-300 rounded-2xl h-full">
                <div className="relative aspect-[4/5] overflow-hidden bg-muted">
                  <motion.img
                    src={member.image}
                    alt={t(member.altKey)}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                    whileHover={reduce ? undefined : { scale: 1.04 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  />
                  <div
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent"
                    aria-hidden
                  />
                </div>
                <div className="p-5 pt-2 text-center sm:text-left">
                  <p className="font-semibold text-foreground">{t(member.nameKey)}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed mt-1">{t(member.roleKey)}</p>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
