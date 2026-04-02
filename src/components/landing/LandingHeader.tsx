import { Fragment, useEffect, useMemo, useState } from "react";
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
import {
  whatsappMeUrl,
  whatsappNumberForVisitor,
  WHATSAPP_STAYS_CONTACT_PREFILL,
} from "@/lib/whatsappContact";
import { cn } from "@/lib/utils";

/**
 * All visible in the bar (no dropdown). Explore India sits after Hotels so it isn’t clipped
 * when the right-side actions consume width (it was last before and scrolled off-screen).
 */
const navLinks = [
  { key: "nav.medicalTourism", to: "/med-tourism" },
  { key: "nav.hospitals", href: "/med-tourism#hospitals" },
  { key: "nav.hotels", href: "/#hotels" },
  { key: "nav.exploreIndia", to: "/explore-india" },
  { key: "nav.services", href: "/#why-us" },
  { key: "nav.support", to: "/help-center" },
] as const;

/** Divider before this index (between stay block and explore + help). */
const NAV_DIVIDER_BEFORE_INDEX = 3;

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
    let pathname: string;
    let hash: string;
    try {
      const url = new URL(href, window.location.origin);
      pathname = url.pathname;
      hash = url.hash;
    } catch {
      return;
    }
    if (!hash || hash === "#") return;

    const onTargetPage =
      pathname === "/"
        ? location.pathname === "/"
        : location.pathname === pathname || location.pathname.startsWith(`${pathname}/`);

    if (onTargetPage) {
      const el = document.querySelector(hash);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        setMobileOpen(false);
        return;
      }
    }
    navigate({ pathname, hash: hash.slice(1) });
    setMobileOpen(false);
  };

  const openAuth = () => {
    setMobileOpen(false);
    setAuthOpen(true);
  };

  const openContactChat = () => {
    const n = whatsappNumberForVisitor();
    window.open(whatsappMeUrl(n, WHATSAPP_STAYS_CONTACT_PREFILL), "_blank", "noopener,noreferrer");
  };

  /** WhatsApp green — growth, safety, “easy to reach us” (distinct from primary care blue). */
  const whatsappCtaClass =
    "h-9 rounded-lg bg-[#25D366] px-4 text-xs font-semibold text-white shadow-md ring-1 ring-black/5 transition-colors hover:bg-[#20bd5a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366] sm:h-10 sm:px-5 sm:text-sm";

  const activeNavKey = useMemo(() => {
    if (location.pathname === "/med-tourism" || location.pathname.startsWith("/med-tourism/")) {
      const hash = (location.hash || "").toLowerCase();
      if (hash === "#hospitals") return "nav.hospitals";
      return "nav.medicalTourism";
    }
    if (location.pathname === "/help-center") return "nav.support";
    if (location.pathname === "/explore-india") return "nav.exploreIndia";

    if (location.pathname === "/") {
      const hash = (location.hash || "").toLowerCase();
      if (hash === "#why-us") return "nav.services";
      if (hash === "#hotels") return "nav.hotels";
      return "";
    }

    return "";
  }, [location.pathname, location.hash]);

  const desktopLinkClass = (isActive: boolean, key: string) =>
    cn(
      "inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-md px-2 text-[11px] font-semibold tracking-tight transition-all duration-200 sm:h-10 sm:px-2.5 sm:text-[12px] lg:text-[13px] xl:px-3 xl:text-sm",
      isActive
        ? "bg-primary/[0.12] text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.2)]"
        : "text-foreground/[0.82] hover:bg-muted/65 hover:text-foreground",
      /* Teal accent on “Explore India” = optimism / journey (inactive only) */
      !isActive &&
        key === "nav.exploreIndia" &&
        "hover:text-teal-700 dark:hover:text-teal-400",
    );

  const actionOutlineClass =
    "h-9 rounded-lg border-2 border-border/80 bg-background px-3 text-xs font-semibold text-foreground shadow-none transition-colors hover:border-primary/35 hover:bg-muted/40 sm:h-10 sm:px-3.5 sm:text-sm";

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border/80 bg-card/95 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-card/90">
        <div className="max-w-page flex h-14 items-center justify-between gap-2 sm:gap-3 lg:gap-4">
          <Link to="/" className="flex shrink-0 items-center py-1">
            <BrandLogo variant="header" />
          </Link>

          {/* Single row: nowrap + horizontal scroll if the viewport is still tight (Sign up removed to free space) */}
          <nav className="hidden min-w-0 flex-1 justify-center md:flex" aria-label="Main">
            <div className="flex max-w-full flex-nowrap items-center justify-center gap-0.5 overflow-x-auto overflow-y-visible py-0.5 [-ms-overflow-style:none] [scrollbar-width:thin] sm:gap-1 lg:gap-1.5 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border">
              {navLinks.map((link, index) => (
                <Fragment key={link.key}>
                  {index === NAV_DIVIDER_BEFORE_INDEX ? (
                    <span
                      className="mx-0.5 hidden h-6 w-px shrink-0 bg-gradient-to-b from-transparent via-primary/25 to-transparent sm:block"
                      aria-hidden
                    />
                  ) : null}
                  {"to" in link ? (
                    <Link
                      to={link.to}
                      className={desktopLinkClass(activeNavKey === link.key, link.key)}
                      aria-current={activeNavKey === link.key ? "page" : undefined}
                    >
                      {t(link.key)}
                    </Link>
                  ) : (
                    <a
                      href={link.href}
                      onClick={(e) => handleSectionNav(e, link.href)}
                      className={desktopLinkClass(activeNavKey === link.key, link.key)}
                      aria-current={activeNavKey === link.key ? "page" : undefined}
                    >
                      {t(link.key)}
                    </a>
                  )}
                </Fragment>
              ))}
            </div>
          </nav>

          <div className="hidden shrink-0 items-center gap-1.5 md:flex lg:gap-2">
            <LanguageSwitcher />
            <Button onClick={openContactChat} className={whatsappCtaClass}>
              <MessageCircle className="mr-2 h-4 w-4" />
              {t("nav.contactUs")}
            </Button>
            {!isMedTourismPage &&
              (user ? (
                <div className="flex items-center gap-1.5 pl-0.5">
                  <CartButton onProceedToCheckout={openAuth} className="h-10 w-10 shrink-0 rounded-lg border border-border/70 bg-background hover:bg-muted/50" />
                  <Link
                    to="/profile"
                    className="flex max-w-[200px] items-center gap-2 rounded-lg border-2 border-border/70 bg-background px-2 py-1.5 transition-colors hover:border-primary/30 hover:bg-muted/30"
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.displayName} />}
                      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">{user.initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-col items-start text-left">
                      <span className="truncate text-sm font-semibold leading-none text-foreground">{user.displayName || "User"}</span>
                      <span className="mt-0.5 truncate text-[11px] font-medium text-muted-foreground leading-none">{ROLE_LABELS[user.role]}</span>
                    </div>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 rounded-lg border border-transparent hover:border-border/60 hover:bg-muted/50">
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem asChild>
                        <Link to="/profile" className="flex cursor-pointer items-center">
                          <User className="mr-2 h-4 w-4" />
                          Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/dashboard" className="flex cursor-pointer items-center">
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
                <div className="flex items-center gap-1.5 pl-0.5 lg:gap-2">
                  <CartButton onProceedToCheckout={openAuth} className="h-9 w-9 shrink-0 rounded-lg border border-border/70 bg-background hover:bg-muted/50 sm:h-10 sm:w-10" />
                  <Button variant="outline" onClick={openAuth} className={actionOutlineClass}>
                    <User className="mr-1.5 h-4 w-4 shrink-0 sm:mr-2" />
                    {t("nav.login")}
                  </Button>
                </div>
              ) : (
                <span className="text-sm font-medium text-muted-foreground animate-pulse">Loading…</span>
              ))}
          </div>

          <div className="flex shrink-0 items-center gap-1.5 md:hidden">
            <LanguageSwitcher compact />
            <Button
              type="button"
              size="icon"
              className="h-10 w-10 shrink-0 rounded-lg bg-[#25D366] text-white shadow-md ring-1 ring-black/5 hover:bg-[#20bd5a]"
              onClick={openContactChat}
              aria-label={t("nav.contactUs")}
            >
              <MessageCircle className="h-5 w-5" />
            </Button>
            {!isMedTourismPage && <CartButton onProceedToCheckout={openAuth} className="h-10 w-10 rounded-lg border border-border/70" />}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] border-l border-border/80">
                <nav className="flex flex-col gap-0.5 pt-2" aria-label="Mobile main">
                  <Link to="/" className="mb-4 inline-block" onClick={() => setMobileOpen(false)}>
                    <BrandLogo variant="header" className="w-[190px]" />
                  </Link>
                  {navLinks.map((link) =>
                    "to" in link ? (
                      <Link
                        key={link.key}
                        to={link.to}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "rounded-lg px-3 py-3 text-[15px] font-semibold transition-colors",
                          activeNavKey === link.key ? "bg-primary/10 text-primary" : "text-foreground/85 hover:bg-muted/70",
                        )}
                        aria-current={activeNavKey === link.key ? "page" : undefined}
                      >
                        {t(link.key)}
                      </Link>
                    ) : (
                      <a
                        key={link.key}
                        href={link.href}
                        onClick={(e) => handleSectionNav(e, link.href)}
                        className={cn(
                          "rounded-lg px-3 py-3 text-[15px] font-semibold transition-colors",
                          activeNavKey === link.key ? "bg-primary/10 text-primary" : "text-foreground/85 hover:bg-muted/70",
                        )}
                        aria-current={activeNavKey === link.key ? "page" : undefined}
                      >
                        {t(link.key)}
                      </a>
                    ),
                  )}
                  {!isMedTourismPage && (
                    <div className="mt-4 flex flex-col gap-2 border-t border-border/80 pt-4">
                      {user ? (
                        <>
                          <Link
                            to="/profile"
                            onClick={() => setMobileOpen(false)}
                            className="flex items-center gap-3 rounded-xl border border-border/80 bg-muted/20 p-3 no-underline hover:bg-muted/40"
                          >
                            <Avatar className="h-10 w-10">
                              {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.displayName} />}
                              <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">{user.initials}</AvatarFallback>
                            </Avatar>
                            <div className="flex min-w-0 flex-col">
                              <span className="truncate text-sm font-semibold text-foreground">{user.displayName || "User"}</span>
                              <span className="text-xs font-medium text-muted-foreground">{ROLE_LABELS[user.role]}</span>
                            </div>
                          </Link>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="h-10 flex-1 rounded-lg font-semibold" asChild>
                              <Link to="/dashboard" onClick={() => setMobileOpen(false)}>
                                Dashboard
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-10 flex-1 rounded-lg font-semibold"
                              onClick={() => {
                                setMobileOpen(false);
                                logoutCurrentDevice();
                              }}
                            >
                              Log out
                            </Button>
                          </div>
                        </>
                      ) : headerReady ? (
                        <Button variant="outline" className="h-11 w-full rounded-lg border-2 font-semibold" onClick={openAuth}>
                          {t("nav.login")}
                        </Button>
                      ) : (
                        <span className="py-2 text-sm font-medium text-muted-foreground animate-pulse">Loading…</span>
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
