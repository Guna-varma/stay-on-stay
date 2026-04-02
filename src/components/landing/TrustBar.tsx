import { Shield, Users, Clock, BadgeCheck } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { Reveal } from "@/components/motion/Reveal";

export default function TrustBar() {
  const { t } = useI18n();
  const reduce = useReducedMotion();
  const items = [
    { icon: Users, labelKey: "trust.patients" },
    { icon: Shield, labelKey: "trust.verified" },
    { icon: Clock, labelKey: "trust.support" },
    { icon: BadgeCheck, labelKey: "trust.guide" },
  ];

  return (
    <Reveal as="section" className="border-y border-border/80 bg-muted/40 py-5" aria-label={t("trust.aria")}>
      <div className="max-w-page mx-auto px-4 sm:px-6">
        <div className="flex gap-6 overflow-x-auto pb-1 scrollbar-none sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4 sm:gap-4 sm:pb-0">
          {items.map(({ icon: Icon, labelKey }, i) => (
            <motion.div
              key={labelKey}
              className="flex min-w-[200px] shrink-0 items-center gap-3 sm:min-w-0"
              initial={reduce ? false : { opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-20px" }}
              transition={{ duration: 0.45, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/10">
                <Icon className="h-5 w-5 text-primary" aria-hidden />
              </div>
              <p className="text-sm font-medium text-foreground leading-snug">{t(labelKey)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </Reveal>
  );
}
