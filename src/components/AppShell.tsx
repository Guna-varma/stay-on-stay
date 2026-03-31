import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/lib/auth";
import { canAccessPath } from "@/lib/roles";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AppHeader } from "@/components/AppHeader";
import { Loader2 } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

function OutletFallback() {
  return (
    <div className="flex min-h-[50vh] w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
      <span className="sr-only">Loading page</span>
    </div>
  );
}

function FullPageSpinner({ message = "Loading…" }: { message?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
      <span className="text-sm text-muted-foreground animate-pulse">{message}</span>
    </div>
  );
}

export function AppShell() {
  const { user, isInitialized } = useAuth();
  const location = useLocation();
  const [timedOut, setTimedOut] = useState(false);
  const [hasActiveSession, setHasActiveSession] = useState<boolean | null>(null);

  useEffect(() => {
    if (isInitialized) return;
    const t = setTimeout(() => setTimedOut(true), 6000);
    return () => clearTimeout(t);
  }, [isInitialized]);

  /**
   * When initialized but user is null, peek at Supabase to see if there's
   * actually an active session (profile just hasn't resolved yet).
   * If yes, show a spinner instead of bouncing to /login.
   */
  useEffect(() => {
    if (!isInitialized && !timedOut) return;
    if (user) {
      setHasActiveSession(true);
      return;
    }
    if (!isSupabaseConfigured()) {
      setHasActiveSession(false);
      return;
    }
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) setHasActiveSession(!!data.session);
    }).catch(() => {
      if (!cancelled) setHasActiveSession(false);
    });
    return () => { cancelled = true; };
  }, [isInitialized, timedOut, user]);

  if (!isInitialized && !timedOut) {
    return <FullPageSpinner />;
  }

  // Auth initialized but user is null — check if there's still a live session
  // whose profile is being resolved. Show spinner instead of redirecting.
  if (!user) {
    if (hasActiveSession === null) {
      return <FullPageSpinner message="Checking session…" />;
    }
    if (hasActiveSession) {
      return <FullPageSpinner message="Preparing your dashboard…" />;
    }
    return <Navigate to="/login" replace />;
  }

  if (!canAccessPath(user.role, location.pathname)) {
    return <Navigate to="/access-denied" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
          <AppHeader />
          <main className="flex-1 p-3 sm:p-4 md:p-6 max-w-[1600px] w-full overflow-x-auto">
            <Suspense fallback={<OutletFallback />}>
              <Outlet />
            </Suspense>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
