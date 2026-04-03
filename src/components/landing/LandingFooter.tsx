import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { BrandLogo } from "@/components/BrandLogo";

type FooterLink = { label: string; to: string } | { label: string; href: string };

const LandingFooter = () => {
  const { t } = useI18n();

  const footerLinks: Record<string, FooterLink[]> = {
    [t("footer.platform")]: [
      { label: t("nav.hotels"), to: "/#hotels" },
      { label: t("nav.hospitals"), to: "/#hospitals" },
      { label: t("nav.medicalTourism"), to: "/med-tourism" },
      { label: t("nav.services"), to: "/#services" },
    ],
    [t("footer.support")]: [
      { label: t("nav.helpCenter"), to: "/help-center" },
      { label: t("nav.contactUs"), to: "/contact-us" },
      { label: t("nav.whatsappSupport"), to: "/whatsapp-support" },
    ],
    [t("footer.company")]: [
      { label: t("footer.aboutUs"), to: "/about" },
      { label: t("footer.careers"), to: "/careers" },
      { label: t("footer.partners"), to: "/partners" },
    ],
    [t("footer.legal")]: [
      { label: t("footer.privacyPolicy"), to: "/privacy" },
      { label: t("footer.termsOfService"), to: "/terms" },
    ],
  };

  return (
    <footer id="support" className="bg-card border-t border-border">
      <div className="max-w-page py-12 lg:py-20">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4">
              <BrandLogo variant="footer" />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("footer.tagline")}
            </p>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold text-foreground mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    {"to" in link ? (
                      <Link
                        to={link.to}
                        className="text-sm text-muted-foreground hover:text-primary transition-colors duration-150"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-primary transition-colors duration-150"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">{t("footer.rights")}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {t("footer.made")} <Heart className="h-3 w-3 text-destructive fill-destructive" /> {t("footer.for")}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
