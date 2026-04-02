import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

/** Short trust strip + link to full medical tourism funnel (keeps homepage light). */
export default function MedTourismStrip() {
  const { t } = useI18n();

  return (
    <section className="py-10 lg:py-14 bg-muted/40 border-y border-border/60">
      <div className="max-w-page mx-auto px-4 sm:px-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="max-w-2xl">
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">{t("strip.title")}</h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{t("strip.body")}</p>
          <ul className="mt-4 space-y-2 text-sm text-foreground">
            <li className="flex gap-2">
              <span className="text-primary font-bold">✓</span>
              {t("strip.bullet1")}
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-bold">✓</span>
              {t("strip.bullet2")}
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-bold">✓</span>
              {t("strip.bullet3")}
            </li>
          </ul>
        </div>
        <Button asChild size="lg" className="shrink-0 h-12 px-6">
          <Link to="/med-tourism">
            {t("strip.cta")}
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
          </Link>
        </Button>
      </div>
    </section>
  );
}
