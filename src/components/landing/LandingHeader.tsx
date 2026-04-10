import { useEffect, useMemo, useState } from "react";
import { ScrollProgressBar } from "@/components/landing/ScrollProgressBar";
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
import {
  Menu,
  User,
  LayoutDashboard,
  LogOut,
  Shield,
  ChevronDown,
  MessageCircle,
  Stethoscope,
  Building2,
  BedDouble,
  Compass,
  HeartHandshake,
  LifeBuoy,
} from "lucide-react";
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

const MORE_LINKS = [
  { key: "nav.services" as const, href: "/#why-us", icon: HeartHandshake },
  { key: "nav.support" as const, to: "/help-center", icon: LifeBuoy },
] as const;

const navPillBase =
  "inline-flex h-9 items-center gap-1 rounded-lg px-3 text-[13px] font-medium transition-[color,background-color,box-shadow] duration-200 sm:h-10 sm:px-3.5 sm:text-sm";

const LandingHeader = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [headerElevated, setHeaderElevated] = useState(false);
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
    const timer = setTimeout(() => setHeaderReady(true), 3000);
    return () => clearTimeout(timer);
  }, [isInitialized]);

  useEffect(() => {
    const onScroll = () => setHeaderElevated(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  const careActive = activeNavKey === "nav.medicalTourism" || activeNavKey === "nav.hospitals";
  const stayActive = activeNavKey === "nav.hotels" || activeNavKey === "nav.exploreIndia";

  const linkActiveClass =
    "bg-primary/[0.12] text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.22)]";
  const linkIdleClass =
    "text-foreground/80 hover:bg-black/[0.04] hover:text-foreground dark:hover:bg-white/[0.06]";

  const dropdownTriggerClass = (active: boolean) =>
    cn(navPillBase, active ? linkActiveClass : cn(linkIdleClass, "border-0 bg-transparent"));

  const simpleNavClass = (isActive: boolean) => cn(navPillBase, isActive ? linkActiveClass : linkIdleClass);

  const actionOutlineClass =
    "h-9 min-h-9 min-w-[5.5rem] rounded-full border border-foreground/15 bg-background px-3.5 text-xs font-semibold text-foreground shadow-sm transition-colors hover:border-primary/30 hover:bg-muted/40 sm:h-10 sm:min-h-10 sm:text-sm";

  return (
    <>
      <ScrollProgressBar />
      <header
        className={cn(
          "sticky top-0 z-50 border-b backdrop-blur-xl transition-[background-color,box-shadow,border-color] duration-300 ease-out supports-[backdrop-filter]:backdrop-blur-xl",
          headerElevated
            ? "border-primary/12 bg-background/[0.97] supports-[backdrop-filter]:bg-background/92 [box-shadow:var(--header-scroll-shadow)]"
            : "border-border/35 bg-background/[0.88] shadow-[0_1px_0_0_hsl(var(--border)/0.4)] supports-[backdrop-filter]:bg-background/82",
        )}
      >
        <div
          className={cn(
            "max-w-page mx-auto flex items-center justify-between gap-2 transition-[min-height,padding] duration-300 ease-out sm:gap-3 md:gap-4",
            headerElevated ? "min-h-[3.25rem] py-1 sm:min-h-[3.75rem]" : "min-h-[3.5rem] py-1.5 sm:min-h-[4rem]",
          )}
        >
          <Link
            to="/"
            className="group flex min-w-0 shrink-0 items-center gap-2 py-1 sm:gap-3"
            aria-label="StayOnStay — home"
          >
            <BrandLogo variant="header" />
            <span className="hidden max-w-[9rem] leading-tight lg:block xl:max-w-none">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/58">
                {t("nav.tagline")}
              </span>
            </span>
          </Link>

          {/* Desktop: grouped medical-travel nav */}
          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 md:flex md:gap-1.5 lg:gap-2" aria-label="Main">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={dropdownTriggerClass(careActive)}
                  aria-expanded={undefined}
                  aria-haspopup="menu"
                >
                  {t("nav.group.care")}
                  <ChevronDown className="h-3.5 w-3.5 opacity-45 text-foreground/55" aria-hidden />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 p-2" sideOffset={8}>
                <DropdownMenuItem asChild className="cursor-pointer rounded-lg p-0 focus:bg-transparent">
                  <Link
                    to="/med-tourism"
                    className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-muted/70"
                    aria-current={activeNavKey === "nav.medicalTourism" ? "page" : undefined}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Stethoscope className="h-4 w-4" aria-hidden />
                    </span>
                    <span>
                      <span className="block font-semibold text-foreground">{t("nav.medicalTourism")}</span>
                      <span className="text-xs font-normal text-muted-foreground leading-snug">
                        {t("nav.dropdown.care.hint")}
                      </span>
                    </span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer rounded-lg p-0 focus:bg-transparent">
                  <a
                    href="/med-tourism#hospitals"
                    className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-muted/70"
                    onClick={(e) => handleSectionNav(e, "/med-tourism#hospitals")}
                    aria-current={activeNavKey === "nav.hospitals" ? "page" : undefined}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Building2 className="h-4 w-4" aria-hidden />
                    </span>
                    <span>
                      <span className="block font-semibold text-foreground">{t("nav.hospitals")}</span>
                      <span className="text-xs font-normal text-muted-foreground leading-snug">
                        {t("nav.dropdown.hospitals.hint")}
                      </span>
                    </span>
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className={dropdownTriggerClass(stayActive)} aria-haspopup="menu">
                  {t("nav.group.stay")}
                  <ChevronDown className="h-3.5 w-3.5 opacity-45 text-foreground/55" aria-hidden />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 p-2" sideOffset={8}>
                <DropdownMenuItem asChild className="cursor-pointer rounded-lg p-0 focus:bg-transparent">
                  <a
                    href="/#hotels"
                    className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-muted/70"
                    onClick={(e) => handleSectionNav(e, "/#hotels")}
                    aria-current={activeNavKey === "nav.hotels" ? "page" : undefined}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <BedDouble className="h-4 w-4" aria-hidden />
                    </span>
                    <span>
                      <span className="block font-semibold text-foreground">{t("nav.hotels")}</span>
                      <span className="text-xs font-normal text-muted-foreground leading-snug">
                        {t("nav.dropdown.hotels.hint")}
                      </span>
                    </span>
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer rounded-lg p-0 focus:bg-transparent">
                  <Link
                    to="/explore-india"
                    className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-muted/70"
                    aria-current={activeNavKey === "nav.exploreIndia" ? "page" : undefined}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Compass className="h-4 w-4" aria-hidden />
                    </span>
                    <span>
                      <span className="block font-semibold text-foreground">{t("nav.exploreIndia")}</span>
                      <span className="text-xs font-normal text-muted-foreground leading-snug">
                        {t("nav.dropdown.explore.hint")}
                      </span>
                    </span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {MORE_LINKS.map((link) =>
              "to" in link ? (
                <Link
                  key={link.key}
                  to={link.to}
                  className={simpleNavClass(activeNavKey === link.key)}
                  aria-current={activeNavKey === link.key ? "page" : undefined}
                >
                  {t(link.key)}
                </Link>
              ) : (
                <a
                  key={link.key}
                  href={link.href}
                  onClick={(e) => handleSectionNav(e, link.href)}
                  className={simpleNavClass(activeNavKey === link.key)}
                  aria-current={activeNavKey === link.key ? "page" : undefined}
                >
                  {t(link.key)}
                </a>
              ),
            )}
          </nav>

          <div className="hidden shrink-0 items-center gap-1.5 md:flex lg:gap-2">
            <LanguageSwitcher variant="minimal" />
            <Button
              type="button"
              onClick={openContactChat}
              className="h-9 shrink-0 gap-2 rounded-full border border-primary/25 bg-primary/[0.1] px-3.5 text-xs font-semibold text-primary shadow-sm ring-1 ring-primary/10 hover:bg-primary/[0.16] sm:h-10 sm:px-4 sm:text-sm"
            >
              <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
              {t("nav.contactUs")}
            </Button>
            {!isMedTourismPage &&
              (user ? (
                <div className="flex items-center gap-1 pl-0.5">
                  <CartButton
                    onProceedToCheckout={openAuth}
                    className="h-9 w-9 shrink-0 rounded-full text-muted-foreground hover:text-foreground sm:h-10 sm:w-10"
                  />
                  <Link
                    to="/profile"
                    className="flex max-w-[160px] items-center gap-2 rounded-full border border-border/50 bg-muted/15 px-2 py-1 transition-colors hover:border-primary/20 hover:bg-muted/30 xl:max-w-[200px]"
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.displayName} />}
                      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">{user.initials}</AvatarFallback>
                    </Avatar>
                    <div className="hidden min-w-0 flex-col items-start text-left xl:flex">
                      <span className="truncate text-sm font-semibold leading-none text-foreground">{user.displayName || "User"}</span>
                      <span className="mt-0.5 truncate text-[10px] font-medium text-muted-foreground leading-none">
                        {ROLE_LABELS[user.role]}
                      </span>
                    </div>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-full lg:h-10 lg:w-10">
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
                <div className="flex items-center gap-1 lg:gap-1.5">
                  <CartButton
                    onProceedToCheckout={openAuth}
                    className="h-9 w-9 shrink-0 rounded-full text-muted-foreground hover:text-foreground sm:h-10 sm:w-10"
                  />
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
              className="h-10 w-10 shrink-0 rounded-full border border-primary/20 bg-primary/[0.08] text-primary hover:bg-primary/[0.14]"
              onClick={openContactChat}
              aria-label={t("nav.contactUs")}
            >
              <MessageCircle className="h-5 w-5" />
            </Button>
            {!isMedTourismPage && (
              <CartButton onProceedToCheckout={openAuth} className="h-10 w-10 rounded-full text-muted-foreground" />
            )}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full border border-border/50">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[min(100vw-1rem,320px)] border-l border-border/60 p-0">
                <div className="flex h-full flex-col overflow-y-auto">
                  <div className="border-b border-border/60 bg-muted/20 px-4 py-4">
                    <Link to="/" className="inline-block" onClick={() => setMobileOpen(false)}>
                      <BrandLogo variant="header" className="max-w-[min(100%,280px)]" />
                    </Link>
                    <p className="mt-2 text-xs font-medium text-muted-foreground leading-snug">{t("nav.tagline")}</p>
                  </div>
                  <nav className="flex flex-col gap-1 px-2 py-3" aria-label="Mobile main">
                    <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                      {t("nav.mobile.section.care")}
                    </p>
                    <Link
                      to="/med-tourism"
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-semibold",
                        activeNavKey === "nav.medicalTourism" ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted/70",
                      )}
                    >
                      <Stethoscope className="h-5 w-5 shrink-0 opacity-70" />
                      {t("nav.medicalTourism")}
                    </Link>
                    <a
                      href="/med-tourism#hospitals"
                      onClick={(e) => {
                        handleSectionNav(e, "/med-tourism#hospitals");
                      }}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-semibold",
                        activeNavKey === "nav.hospitals" ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted/70",
                      )}
                    >
                      <Building2 className="h-5 w-5 shrink-0 opacity-70" />
                      {t("nav.hospitals")}
                    </a>

                    <p className="px-3 pb-1 pt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                      {t("nav.mobile.section.stay")}
                    </p>
                    <a
                      href="/#hotels"
                      onClick={(e) => handleSectionNav(e, "/#hotels")}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-semibold",
                        activeNavKey === "nav.hotels" ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted/70",
                      )}
                    >
                      <BedDouble className="h-5 w-5 shrink-0 opacity-70" />
                      {t("nav.hotels")}
                    </a>
                    <Link
                      to="/explore-india"
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-semibold",
                        activeNavKey === "nav.exploreIndia" ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted/70",
                      )}
                    >
                      <Compass className="h-5 w-5 shrink-0 opacity-70" />
                      {t("nav.exploreIndia")}
                    </Link>

                    <p className="px-3 pb-1 pt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                      {t("nav.mobile.section.more")}
                    </p>
                    <a
                      href="/#why-us"
                      onClick={(e) => handleSectionNav(e, "/#why-us")}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-semibold",
                        activeNavKey === "nav.services" ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted/70",
                      )}
                    >
                      <HeartHandshake className="h-5 w-5 shrink-0 opacity-70" />
                      {t("nav.services")}
                    </a>
                    <Link
                      to="/help-center"
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-semibold",
                        activeNavKey === "nav.support" ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted/70",
                      )}
                    >
                      <LifeBuoy className="h-5 w-5 shrink-0 opacity-70" />
                      {t("nav.support")}
                    </Link>
                  </nav>

                  {!isMedTourismPage && (
                    <div className="mt-auto border-t border-border/60 p-4">
                      {user ? (
                        <>
                          <Link
                            to="/profile"
                            onClick={() => setMobileOpen(false)}
                            className="mb-3 flex items-center gap-3 rounded-xl border border-border/60 bg-muted/15 p-3 no-underline hover:bg-muted/30"
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
                            <Button variant="outline" size="sm" className="h-11 flex-1 rounded-full font-semibold" asChild>
                              <Link to="/dashboard" onClick={() => setMobileOpen(false)}>
                                Dashboard
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-11 flex-1 rounded-full font-semibold"
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
                        <Button variant="outline" className="h-11 w-full rounded-full border-2 font-semibold" onClick={openAuth}>
                          {t("nav.login")}
                        </Button>
                      ) : (
                        <span className="py-2 text-sm font-medium text-muted-foreground animate-pulse">Loading…</span>
                      )}
                    </div>
                  )}
                </div>
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
