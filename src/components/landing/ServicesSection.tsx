import { Home, Plane, Ambulance, HeartHandshake } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const ServicesSection = () => {
  const { t } = useI18n();

  const services = [
    { icon: Home, titleKey: "services.furnished.title", descKey: "services.furnished.desc" },
    { icon: Plane, titleKey: "services.airport.title", descKey: "services.airport.desc" },
    { icon: Ambulance, titleKey: "services.hospitalTransport.title", descKey: "services.hospitalTransport.desc" },
    { icon: HeartHandshake, titleKey: "services.patientCare.title", descKey: "services.patientCare.desc" },
  ];

  return (
    <section id="why-us" className="py-12 lg:py-20 bg-muted/50">
      <div className="max-w-page mx-auto px-4 sm:px-6">
        <div className="text-center mb-10 lg:mb-12">
          <h2 className="text-foreground text-2xl sm:text-3xl font-semibold tracking-tight mb-3">
            {t("services.title")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            {t("services.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 lg:gap-6 max-w-4xl mx-auto">
          {services.map((service) => (
            <div
              key={service.titleKey}
              className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <service.icon className="h-6 w-6 text-primary" aria-hidden />
              </div>
              <h3 className="text-foreground font-semibold text-base mb-2">{t(service.titleKey)}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{t(service.descKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
