import { Car, Languages, Stethoscope, Clock, Shield, HeartHandshake } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";

const ServicesSection = () => {
  const { t } = useI18n();

  const services = [
    { icon: Car, titleKey: "services.airport", descKey: "services.airport.desc" },
    { icon: Languages, titleKey: "services.translators", descKey: "services.translators.desc" },
    { icon: Stethoscope, titleKey: "services.travel", descKey: "services.travel.desc" },
    { icon: Clock, titleKey: "services.longstay", descKey: "services.longstay.desc" },
    { icon: Shield, titleKey: "services.verified", descKey: "services.verified.desc" },
    { icon: HeartHandshake, titleKey: "services.guest", descKey: "services.guest.desc" },
  ];

  return (
    <section id="services" className="py-12 lg:py-20 bg-muted/50">
      <div className="max-w-page">
        <div className="text-center mb-12">
          <h2 className="text-foreground mb-3">{t("services.title")}</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">{t("services.subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, i) => (
            <Card
              key={service.titleKey}
              className="group p-6 shadow-card hover:shadow-card-hover border-0 transition-all duration-220 cursor-pointer animate-fade-in"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors duration-150">
                <service.icon className="h-6 w-6 text-primary" />
              </div>
              <h4 className="text-foreground mb-2">{t(service.titleKey)}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{t(service.descKey)}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
