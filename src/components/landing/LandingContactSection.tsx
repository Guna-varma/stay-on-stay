import { MapPin, Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { whatsappMeUrl, whatsappNumberForVisitor } from "@/lib/whatsappContact";

export default function LandingContactSection() {
  const { t } = useI18n();

  const openWhatsApp = () => {
    const n = whatsappNumberForVisitor();
    window.open(whatsappMeUrl(n, t("contact.prefill")), "_blank", "noopener,noreferrer");
  };

  return (
    <section id="contact" className="py-12 lg:py-20 bg-background">
      <div className="max-w-page mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h2 className="text-foreground text-2xl sm:text-3xl font-semibold tracking-tight mb-3">
            {t("contact.title")}
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">{t("contact.subtitle")}</p>
        </div>

        <div className="max-w-lg mx-auto rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm text-center space-y-6">
          <Button
            type="button"
            size="lg"
            className="w-full h-14 text-base font-semibold bg-[#25D366] hover:bg-[#20BD5A] text-white"
            onClick={openWhatsApp}
          >
            <MessageCircle className="mr-2 h-6 w-6" aria-hidden />
            {t("contact.whatsappCta")}
          </Button>

          <div className="flex flex-col gap-4 text-left text-sm">
            <a
              href="tel:+250788944143"
              className="flex items-start gap-3 rounded-xl bg-muted/50 p-4 hover:bg-muted/80 transition-colors"
            >
              <Phone className="h-5 w-5 text-primary shrink-0 mt-0.5" aria-hidden />
              <div>
                <p className="font-medium text-foreground">{t("contact.phoneLabel")}</p>
                <p className="text-muted-foreground">+250 788 944 143</p>
              </div>
            </a>
            <div className="flex items-start gap-3 rounded-xl bg-muted/50 p-4">
              <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" aria-hidden />
              <div>
                <p className="font-medium text-foreground">{t("contact.locationLabel")}</p>
                <p className="text-muted-foreground leading-relaxed">{t("contact.locationValue")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
