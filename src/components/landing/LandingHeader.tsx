import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, User, LayoutDashboard, LogOut, Shield, ChevronDown, MessageCircle } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";
import { useI18n } from "@/lib/i18n";
import { BrandLogo } from "@/components/BrandLogo";
import { CartButton } from "@/components/CartButton";
import { AuthModal } from "@/components/auth/AuthModal";
import { useAuth } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/roles";
import { WHATSAPP_RW_NUMBER } from "@/lib/whatsappContact";

const navLinks = [
  { key: "nav.medicalTourism", to: "/med-tourism" },
  { key: "nav.hospitals", href: "/#hospitals" },
  { key: "nav.services", href: "/#services" },
  { key: "nav.support", to: "/help-center" },
  { key: "nav.hotels", href: "/#hotels" },
] as const;

const LandingHeader = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { user, isInitialized, logoutCurrentDevice, logoutAllDevices } = useAuth();
  const isMedTourismPage = location.pathname === "/med-tourism" || location.pathname.startsWith("/med-tourism/");

  const [headerReady, setHeaderReady] = useState(isInitialized);
  useEffect(() => {
    if (isInitialized) {
      setHeaderReady(true);
      return;
    }
    const t = setTimeout(() => setHeaderReady(true), 3000);
    return () => clearTimeout(t);
  }, [isInitialized]);

  const handleSectionNav = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const hashIdx = href.indexOf("#");
    if (hashIdx === -1) return;
    const hash = href.slice(hashIdx);
    if (location.pathname === "/") {
      const el = document.querySelector(hash);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        setMobileOpen(false);
        return;
      }
    }
    navigate({ pathname: "/", hash: hash.slice(1) });
    setMobileOpen(false);
  };

  const openAuth = () => {
    setMobileOpen(false);
    setAuthOpen(true);
  };

  const openContactChat = () => {
    const number = WHATSAPP_RW_NUMBER;
    const message = encodeURIComponent(
      "Hello, I need help with medical treatment in India.",
    );
    window.open(`https://wa.me/${number}?text=${message}`, "_blank");
  };

  const activeNavKey = useMemo(() => {
    if (location.pathname === "/med-tourism" || location.pathname.startsWith("/med-tourism/")) return "nav.medicalTourism";
    if (location.pathname === "/help-center") return "nav.support";

    if (location.pathname === "/") {
      const hash = (location.hash || "").toLowerCase();
      if (hash === "#hospitals") return "nav.hospitals";
      if (hash === "#services") return "nav.services";
      if (hash === "#support") return "nav.support";
      if (hash === "#hotels") return "nav.hotels";
      return "nav.hotels";
    }

    return "";
  }, [location.pathname, location.hash]);

  const navItemClass = (isActive: boolean) =>
    `text-sm font-medium transition-colors duration-150 ${isActive ? "text-primary" : "text-muted-foreground hover:text-primary"}`;

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-md transition-all duration-150">
        <div className="max-w-page flex items-center justify-between gap-4 py-3 min-h-[72px]">
          <a href="/" className="shrink-0">
            <BrandLogo variant="header" />
          </a>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) =>
              "to" in link ? (
                <Link
                  key={link.key}
                  to={link.to}
                  className={navItemClass(activeNavKey === link.key)}
                  aria-current={activeNavKey === link.key ? "page" : undefined}
                >
                  {t(link.key)}
                </Link>
              ) : (
                <a
                  key={link.key}
                  href={link.href}
                  onClick={(e) => handleSectionNav(e, link.href)}
                  className={navItemClass(activeNavKey === link.key)}
                  aria-current={activeNavKey === link.key ? "page" : undefined}
                >
                  {t(link.key)}
                </a>
              ),
            )}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher />
            {isMedTourismPage && (
              <Button
                onClick={openContactChat}
                className="relative overflow-hidden rounded-full px-6 py-2.5 font-semibold text-primary-foreground shadow-lg bg-gradient-to-r from-primary via-sky-500 to-cyan-500 hover:shadow-xl"
              >
                <span className="absolute inset-0 bg-white/15 opacity-0 hover:opacity-100 transition-opacity" />
                <span className="relative inline-flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  {t("nav.contactUs")}
                </span>
              </Button>
            )}
            {!isMedTourismPage && (
              <Button variant="outline" size="sm" className="shrink-0" asChild>
                <Link to="/contact-us">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {t("nav.contactUs")}
                </Link>
              </Button>
            )}
            {!isMedTourismPage &&
              (user ? (
                <div className="flex items-center gap-1">
                  <CartButton onProceedToCheckout={openAuth} />
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 rounded-full border border-border bg-background px-2 py-1.5 transition-colors hover:border-primary/30 hover:bg-muted/50 min-w-0"
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.displayName} />}
                      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                        {user.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start text-left min-w-0">
                      <span className="text-sm font-medium leading-none text-foreground truncate max-w-[140px]">
                        {user.displayName || "User"}
                      </span>
                      <span className="text-xs text-muted-foreground leading-none mt-0.5">
                        {ROLE_LABELS[user.role]}
                      </span>
                    </div>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-full">
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem asChild>
                        <Link to="/profile" className="flex items-center cursor-pointer">
                          <User className="mr-2 h-4 w-4" />
                          Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/dashboard" className="flex items-center cursor-pointer">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={logoutCurrentDevice} className="text-muted-foreground focus:text-destructive">
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={logoutAllDevices} className="text-muted-foreground focus:text-destructive">
                        <Shield className="mr-2 h-4 w-4" />
                        Logout all devices
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : headerReady ? (
                <>
                  <CartButton onProceedToCheckout={openAuth} />
                  <Button variant="outline" size="sm" onClick={openAuth}>
                    <User className="h-4 w-4 mr-2" />
                    {t("nav.login")}
                  </Button>
                  <Button size="sm" onClick={openAuth}>{t("nav.signup")}</Button>
                </>
              ) : (
                <span className="text-sm text-muted-foreground animate-pulse">Loading…</span>
              ))}
          </div>

          <div className="flex items-center gap-1.5 shrink-0 md:hidden">
            <LanguageSwitcher compact />
            {isMedTourismPage ? (
              <Button
                type="button"
                size="icon"
                className="h-10 w-10 shrink-0 rounded-lg bg-gradient-to-r from-primary via-sky-500 to-cyan-500 text-primary-foreground shadow-md hover:opacity-95"
                onClick={openContactChat}
                aria-label={t("nav.contactUs")}
              >
                <MessageCircle className="h-5 w-5" />
              </Button>
            ) : (
              <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 rounded-lg" asChild>
                <Link to="/contact-us" aria-label={t("nav.contactUs")}>
                  <MessageCircle className="h-5 w-5" />
                </Link>
              </Button>
            )}
            {!isMedTourismPage && <CartButton onProceedToCheckout={openAuth} />}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px]">
                <nav className="flex flex-col gap-3 pt-6">
                  <a href="/" className="mb-2">
                    <BrandLogo variant="header" className="w-[190px]" />
                  </a>
                  {navLinks.map((link) =>
                    "to" in link ? (
                      <Link
                        key={link.key}
                        to={link.to}
                        onClick={() => setMobileOpen(false)}
                        className={`py-2 text-sm font-medium ${activeNavKey === link.key ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
                        aria-current={activeNavKey === link.key ? "page" : undefined}
                      >
                        {t(link.key)}
                      </Link>
                    ) : (
                      <a
                        key={link.key}
                        href={link.href}
                        onClick={(e) => handleSectionNav(e, link.href)}
                        className={`py-2 text-sm font-medium ${activeNavKey === link.key ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
                        aria-current={activeNavKey === link.key ? "page" : undefined}
                      >
                        {t(link.key)}
                      </a>
                    ),
                  )}
                  {!isMedTourismPage && (
                    <div className="flex flex-col gap-2 pt-2">
                      {user ? (
                        <>
                          <Link
                            to="/profile"
                            onClick={() => setMobileOpen(false)}
                            className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3 no-underline hover:bg-muted/50"
                          >
                            <Avatar className="h-10 w-10">
                              {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.displayName} />}
                              <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                                {user.initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-medium text-foreground truncate">{user.displayName || "User"}</span>
                              <span className="text-xs text-muted-foreground">{ROLE_LABELS[user.role]}</span>
                            </div>
                          </Link>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1" asChild>
                              <Link to="/dashboard" onClick={() => setMobileOpen(false)}>Dashboard</Link>
                            </Button>
                            <Button variant="ghost" size="sm" className="flex-1" onClick={() => { setMobileOpen(false); logoutCurrentDevice(); }}>
                              Log out
                            </Button>
                          </div>
                        </>
                      ) : headerReady ? (
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1" onClick={openAuth}>{t("nav.login")}</Button>
                          <Button size="sm" className="flex-1" onClick={openAuth}>{t("nav.signup")}</Button>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground py-2 animate-pulse">Loading…</span>
                      )}
                    </div>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </>
  );
};

export default LandingHeader;
