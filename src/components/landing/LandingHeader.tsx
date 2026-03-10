import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, User } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";
import { useI18n } from "@/lib/i18n";
import { useNavigate } from "react-router-dom";
import { BrandLogo } from "@/components/BrandLogo";

const navLinks = [
  { key: "nav.hotels", href: "#hotels" },
  { key: "nav.hospitals", href: "#hospitals" },
  { key: "nav.services", href: "#services" },
  { key: "nav.support", href: "#support" },
];

const LandingHeader = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useI18n();
  const navigate = useNavigate();

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setMobileOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-md transition-all duration-150">
      <div className="max-w-page flex items-center justify-between gap-4 py-3 min-h-[72px]">
        <a href="/" className="shrink-0">
          <BrandLogo variant="header" />
        </a>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.key}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-150"
            >
              {t(link.key)}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <LanguageSwitcher />
          <Button variant="outline" size="sm" onClick={() => navigate("/login")}>
            <User className="h-4 w-4 mr-2" />
            {t("nav.login")}
          </Button>
          <Button size="sm" onClick={() => navigate("/login")}>{t("nav.signup")}</Button>
        </div>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px]">
            <nav className="flex flex-col gap-3 pt-6">
              <a href="/" className="mb-2">
                <BrandLogo variant="header" className="w-[190px]" />
              </a>
              {navLinks.map((link) => (
                <a
                  key={link.key}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="py-2 text-sm font-medium text-muted-foreground hover:text-primary"
                >
                  {t(link.key)}
                </a>
              ))}
              <div className="flex items-center gap-2 pt-2">
                <LanguageSwitcher />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate("/login")}>{t("nav.login")}</Button>
                <Button size="sm" className="flex-1" onClick={() => navigate("/login")}>{t("nav.signup")}</Button>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

export default LandingHeader;
