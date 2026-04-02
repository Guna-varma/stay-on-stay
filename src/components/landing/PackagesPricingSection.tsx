import { CalendarDays, CalendarRange, BriefcaseMedical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { whatsappMeUrl, whatsappNumberForVisitor } from "@/lib/whatsappContact";

export default function PackagesPricingSection() {
  const { t } = useI18n();

  const openWhatsApp = (pkgKey: string) => {
    const n = whatsappNumberForVisitor();
    const text = t(`pkg.quote.${pkgKey}`);
    window.open(whatsappMeUrl(n, text), "_blank", "noopener,noreferrer");
  };

  const packs = [
    {
      key: "daily",
      icon: CalendarDays,
      titleKey: "pkg.daily.title",
      descKey: "pkg.daily.desc",
      priceKey: "pkg.daily.price",
    },
    {
      key: "weekly",
      icon: CalendarRange,
      titleKey: "pkg.weekly.title",
      descKey: "pkg.weekly.desc",
      priceKey: "pkg.weekly.price",
    },
    {
      key: "medical",
      icon: BriefcaseMedical,
      titleKey: "pkg.medical.title",
      descKey: "pkg.medical.desc",
      priceKey: "pkg.medical.price",
    },
  ] as const;

  return (
    <section id="packages" className="py-12 lg:py-20 bg-muted/30">
      <div className="max-w-page mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h2 className="text-foreground text-2xl sm:text-3xl font-semibold tracking-tight mb-3">
            {t("pkg.title")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
            {t("pkg.subtitle")}
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {packs.map(({ key, icon: Icon, titleKey, descKey, priceKey }) => (
            <Card key={key} className="border-0 shadow-card flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 mb-3">
                  <Icon className="h-5 w-5 text-primary" aria-hidden />
                </div>
                <CardTitle className="text-lg">{t(titleKey)}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col pt-0">
                <p className="text-sm text-muted-foreground flex-1 leading-relaxed mb-4">{t(descKey)}</p>
                <p className="text-lg font-semibold text-foreground mb-4">{t(priceKey)}</p>
                <Button
                  type="button"
                  className="w-full h-11 bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold"
                  onClick={() => openWhatsApp(key)}
                >
                  {t("pkg.cta")}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
