import { MessageCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { whatsappMeUrl, whatsappNumberForVisitor } from "@/lib/whatsappContact";

export default function LandingCtaBanner() {
  const { t } = useI18n();

  const openWhatsApp = () => {
    const n = whatsappNumberForVisitor();
    window.open(whatsappMeUrl(n, t("ctaBanner.prefill")), "_blank", "noopener,noreferrer");
  };

  const scrollHotels = () => {
    document.getElementById("hotels")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="py-12 lg:py-16 bg-primary text-primary-foreground" aria-labelledby="cta-banner-title">
      <div className="max-w-page mx-auto px-4 sm:px-6 text-center">
        <h2 id="cta-banner-title" className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3">
          {t("ctaBanner.title")}
        </h2>
        <p className="text-primary-foreground/90 text-sm sm:text-base max-w-2xl mx-auto mb-2">
          {t("ctaBanner.line1")}
        </p>
        <p className="text-primary-foreground/85 text-sm italic max-w-xl mx-auto mb-8">
          {t("ctaBanner.line2")}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center max-w-md sm:max-w-none mx-auto">
          <Button
            type="button"
            size="lg"
            variant="secondary"
            className="h-12 px-8 font-semibold text-primary"
            onClick={scrollHotels}
          >
            {t("ctaBanner.book")}
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
          </Button>
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="h-12 px-8 font-semibold border-primary-foreground/80 text-primary-foreground bg-transparent hover:bg-primary-foreground/10"
            onClick={openWhatsApp}
          >
            <MessageCircle className="mr-2 h-5 w-5" aria-hidden />
            {t("ctaBanner.whatsapp")}
          </Button>
        </div>
      </div>
    </section>
  );
}
