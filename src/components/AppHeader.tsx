import { useAuth } from "@/lib/auth";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Bell, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS } from "@/lib/roles";
import { NotificationCenter } from "@/components/NotificationCenter";
import { useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";

export function AppHeader() {
  const { user, logout } = useAuth();
  const [showNotifs, setShowNotifs] = useState(false);

  if (!user) return null;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-card px-3 shadow-card sm:gap-3 sm:px-4">
      <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
      <BrandLogo variant="header" className="h-8 w-[142px] sm:h-9 sm:w-[168px] shadow-card" />
      <div className="flex-1" />
      <span className="hidden sm:inline rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
        {ROLE_LABELS[user.role]}
      </span>
      <div className="relative">
        <Button variant="ghost" size="icon" className="relative h-8 w-8" onClick={() => setShowNotifs(!showNotifs)}>
          <Bell className="h-4 w-4" />
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">3</span>
        </Button>
        {showNotifs && <NotificationCenter onClose={() => setShowNotifs(false)} />}
      </div>
      <Button variant="ghost" size="sm" onClick={logout} className="hidden gap-2 text-muted-foreground hover:text-foreground sm:flex">
        <LogOut className="h-3.5 w-3.5" />
        <span className="text-xs">Logout</span>
      </Button>
    </header>
  );
}
