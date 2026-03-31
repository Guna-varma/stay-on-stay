import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Bell, ChevronDown, LogOut, Phone, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS } from "@/lib/roles";
import { NotificationCenter } from "@/components/NotificationCenter";
import { BrandLogo } from "@/components/BrandLogo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const customerNavItems = [
  { label: "Hotels", path: "/hotels" },
  { label: "My Bookings", path: "/bookings" },
];

function CustomerHeader() {
  const { user, logoutCurrentDevice, logoutAllDevices } = useAuth();
  const [showNotifs, setShowNotifs] = useState(false);
  const location = useLocation();

  if (!user) return null;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center border-b border-border/60 bg-background/95 px-4 shadow-sm backdrop-blur-md md:px-6">
      <SidebarTrigger className="mr-2 text-muted-foreground hover:text-foreground md:mr-0" />
      <Link to="/hotels" className="shrink-0">
        <BrandLogo variant="header" className="h-8 w-[130px] sm:h-9 sm:w-[160px]" />
      </Link>

      <nav className="hidden items-center gap-1 lg:ml-6 lg:flex">
        {customerNavItems.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "rounded-full px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />

      <div className="flex items-center gap-3">
        <Button
          asChild
          variant="destructive"
          size="sm"
          className="hidden shrink-0 items-center gap-2 rounded-full px-4 font-medium sm:inline-flex"
        >
          <Link to="/emergency">
            <Phone className="h-3.5 w-3.5" />
            Emergency
          </Link>
        </Button>
        <Button asChild variant="ghost" size="icon" className="shrink-0 sm:hidden" aria-label="Emergency">
          <Link to="/emergency">
            <Phone className="h-4 w-4 text-destructive" />
          </Link>
        </Button>

        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 shrink-0 rounded-full"
            onClick={() => setShowNotifs((current) => !current)}
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
              3
            </span>
          </Button>
          {showNotifs && <NotificationCenter onClose={() => setShowNotifs(false)} />}
        </div>

        <Link
          to="/profile"
          className="hidden min-w-0 items-center gap-2 rounded-full border border-border bg-background px-2 py-1.5 transition-colors hover:border-primary/30 hover:bg-muted/50 sm:flex"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatarUrl} alt={user.displayName} />
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              {user.initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 pr-1">
            <p className="truncate text-sm font-medium leading-none">{user.displayName}</p>
            <p className="truncate text-xs text-muted-foreground">Personal</p>
          </div>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" aria-label="Open profile menu">
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <div className="flex items-center gap-3 p-2 sm:hidden">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.avatarUrl} alt={user.displayName} />
                <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                  {user.initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{user.displayName}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <DropdownMenuItem asChild>
              <Link to="/profile">My Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/bookings">My Bookings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/notifications">Notifications</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logoutCurrentDevice} className="text-muted-foreground focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
            <DropdownMenuItem onClick={logoutAllDevices} className="text-muted-foreground focus:text-destructive">
              <Shield className="mr-2 h-4 w-4" />
              Logout all devices
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export function AppHeader() {
  const { user, logoutCurrentDevice } = useAuth();
  const [showNotifs, setShowNotifs] = useState(false);

  if (!user) return null;

  if (user.role === "customer") {
    return <CustomerHeader />;
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-card px-3 shadow-card sm:gap-3 sm:px-4">
      <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
      <BrandLogo variant="header" className="h-8 w-[142px] sm:h-9 sm:w-[168px] shadow-card" />
      <div className="flex-1" />
      <span className="hidden rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground sm:inline">
        {ROLE_LABELS[user.role]}
      </span>
      <div className="relative">
        <Button variant="ghost" size="icon" className="relative h-8 w-8" onClick={() => setShowNotifs(!showNotifs)}>
          <Bell className="h-4 w-4" />
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
            3
          </span>
        </Button>
        {showNotifs && <NotificationCenter onClose={() => setShowNotifs(false)} />}
      </div>
      <Button variant="ghost" size="sm" onClick={logoutCurrentDevice} className="hidden gap-2 text-muted-foreground hover:text-foreground sm:flex">
        <LogOut className="h-3.5 w-3.5" />
        <span className="text-xs">Logout</span>
      </Button>
    </header>
  );
}
