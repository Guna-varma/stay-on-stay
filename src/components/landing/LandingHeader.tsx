import { useEffect, useState } from "react";
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
import { Menu, User, LayoutDashboard, LogOut, Shield, ChevronDown } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";
import { useI18n } from "@/lib/i18n";
import { BrandLogo } from "@/components/BrandLogo";
import { CartButton } from "@/components/CartButton";
import { AuthModal } from "@/components/auth/AuthModal";
import { useAuth } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/roles";

const navLinks = [
  { key: "nav.hotels", href: "/#hotels" },
  { key: "nav.hospitals", href: "/#hospitals" },
  { key: "nav.medicalTourism", to: "/med-tourism" },
  { key: "nav.services", href: "/#services" },
  { key: "nav.support", href: "/#support" },
] as const;

const LandingHeader = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { user, isInitialized, logoutCurrentDevice, logoutAllDevices } = useAuth();

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
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-150"
                >
                  {t(link.key)}
                </Link>
              ) : (
                <a
                  key={link.key}
                  href={link.href}
                  onClick={(e) => handleSectionNav(e, link.href)}
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-150"
                >
                  {t(link.key)}
                </a>
              ),
            )}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher />
            <CartButton onProceedToCheckout={openAuth} />
            {user ? (
              <div className="flex items-center gap-1">
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
                <Button variant="outline" size="sm" onClick={openAuth}>
                  <User className="h-4 w-4 mr-2" />
                  {t("nav.login")}
                </Button>
                <Button size="sm" onClick={openAuth}>{t("nav.signup")}</Button>
              </>
            ) : (
              <span className="text-sm text-muted-foreground animate-pulse">Loading…</span>
            )}
          </div>

          <div className="flex items-center gap-1 md:hidden">
            <CartButton onProceedToCheckout={openAuth} />
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
                        className="py-2 text-sm font-medium text-muted-foreground hover:text-primary"
                      >
                        {t(link.key)}
                      </Link>
                    ) : (
                      <a
                        key={link.key}
                        href={link.href}
                        onClick={(e) => handleSectionNav(e, link.href)}
                        className="py-2 text-sm font-medium text-muted-foreground hover:text-primary"
                      >
                        {t(link.key)}
                      </a>
                    ),
                  )}
                  <div className="flex items-center gap-2 pt-2">
                    <LanguageSwitcher />
                  </div>
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
