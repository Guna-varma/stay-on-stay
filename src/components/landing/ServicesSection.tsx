import { Home, Plane, Ambulance, HeartHandshake } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { SERVICE_CARD_IMAGES } from "@/lib/healthcare-images";
import { Reveal } from "@/components/motion/Reveal";

const ServicesSection = () => {
  const { t } = useI18n();
  const reduce = useReducedMotion();

  const services = [
    { icon: Home, titleKey: "services.furnished.title", descKey: "services.furnished.desc" },
    { icon: Plane, titleKey: "services.airport.title", descKey: "services.airport.desc" },
    { icon: Ambulance, titleKey: "services.hospitalTransport.title", descKey: "services.hospitalTransport.desc" },
    { icon: HeartHandshake, titleKey: "services.patientCare.title", descKey: "services.patientCare.desc" },
  ];

  return (
    <section id="why-us" className="py-12 lg:py-20 bg-muted/50">
      <div className="max-w-page mx-auto px-4 sm:px-6">
        <Reveal className="text-center mb-10 lg:mb-12">
          <h2 className="text-foreground text-2xl sm:text-3xl font-semibold tracking-tight mb-3">
            {t("services.title")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            {t("services.subtitle")}
          </p>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 lg:gap-6 max-w-4xl mx-auto">
          {services.map((service, i) => (
            <Reveal key={service.titleKey} delay={i * 0.06}>
              <motion.div
                className="group rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm hover:shadow-premium transition-shadow duration-300"
                whileHover={reduce ? undefined : { y: -3 }}
                transition={{ duration: 0.25 }}
              >
                <div className="relative h-36 overflow-hidden bg-muted">
                  <motion.img
                    src={SERVICE_CARD_IMAGES[i]}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                    whileHover={reduce ? undefined : { scale: 1.06 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent pointer-events-none" aria-hidden />
                </div>
                <div className="p-6 pt-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 ring-1 ring-primary/10">
                    <service.icon className="h-6 w-6 text-primary" aria-hidden />
                  </div>
                  <h3 className="text-foreground font-semibold text-base mb-2">{t(service.titleKey)}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t(service.descKey)}</p>
                </div>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
