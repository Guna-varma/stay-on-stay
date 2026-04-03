import { useI18n } from "@/lib/i18n";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

export default function HelpCenter() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      <main className="py-12 lg:py-16">
        <div className="max-w-page space-y-8">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="max-w-3xl">
            <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-3">{t("support.title")}</h1>
            <p className="text-muted-foreground leading-relaxed">
              {t("support.subtitle")}
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06, duration: 0.45 }} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5 border-0 shadow-card">
              <h2 className="font-semibold text-foreground">{t("support.response.title")}</h2>
              <p className="text-sm text-muted-foreground mt-2">{t("support.response.critical")}</p>
              <p className="text-sm text-muted-foreground">{t("support.response.general")}</p>
            </Card>
            <Card className="p-5 border-0 shadow-card">
              <h2 className="font-semibold text-foreground">{t("support.channels.title")}</h2>
              <p className="text-sm text-muted-foreground mt-2">{t("support.channels.email")}</p>
              <p className="text-sm text-muted-foreground">{t("support.channels.whatsapp")}</p>
            </Card>
            <Card className="p-5 border-0 shadow-card">
              <h2 className="font-semibold text-foreground">{t("support.coverage.title")}</h2>
              <p className="text-sm text-muted-foreground mt-2">{t("support.coverage.body")}</p>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.45 }}>
            <Card className="p-6 border-0 shadow-card space-y-3">
              <h2 className="text-lg font-semibold text-foreground">{t("support.faq.title")}</h2>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{t("support.faq.badge1")}</Badge>
                <Badge variant="secondary">{t("support.faq.badge2")}</Badge>
                <Badge variant="secondary">{t("support.faq.badge3")}</Badge>
                <Badge variant="secondary">{t("support.faq.badge4")}</Badge>
                <Badge variant="secondary">{t("support.faq.badge5")}</Badge>
              </div>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>- {t("support.faq.q1")}</li>
                <li>- {t("support.faq.q2")}</li>
                <li>- {t("support.faq.q3")}</li>
                <li>- {t("support.faq.q4")}</li>
              </ul>
            </Card>
          </motion.div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
