import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  supabase,
  isSupabaseConfigured,
  getSession,
  getProfile,
  logoutAllDevices as supabaseLogoutAllDevices,
  logoutCurrentDevice as supabaseLogoutCurrentDevice,
  type Profile,
  type ProfileRole,
} from "@/lib/supabase";
import { getDisplayName, getInitials } from "@/lib/user-identity";

export type UserRole = "customer" | "owner" | "manager" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  initials: string;
  role: UserRole;
  name: string;
  avatarUrl?: string;
  avatar?: string;
  loginTime: number;
  /** True when the profile has first_name + last_name already set (existing user, skip onboarding). */
  profileComplete: boolean;
}

interface LoginLog {
  email: string;
  role: UserRole;
  timestamp: number;
  device: string;
  ip: string;
}

interface AuthContextType {
  user: AuthUser | null;
  /** False until session is restored (Supabase) or localStorage read (demo). Prevents flash redirect to login. */
  isInitialized: boolean;
  /** Re-check session from storage (e.g. new tab). Use when initialized but user is null to pick up existing session. */
  recheckSession: () => Promise<void>;
  login: (email: string, password: string) => { success: boolean; error?: string };
  logoutCurrentDevice: () => Promise<void>;
  logoutAllDevices: () => Promise<void>;
  loginLogs: LoginLog[];
}

/** Map Supabase profile role to app UserRole (profile roles are a subset). */
function profileRoleToUserRole(role: ProfileRole): UserRole {
  return role as UserRole;
}

const CREDENTIALS: Record<string, { password: string; role: UserRole; name: string }> = {
  "customer@stayonstay.com": { password: "12345678", role: "customer", name: "Aisha Mohammed" },
  "owner@stayonstay.com": { password: "12345678", role: "owner", name: "Deepak Malhotra" },
  "manager@stayonstay.com": { password: "12345678", role: "manager", name: "Priya Sharma" },
};

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 min
const PROFILE_FETCH_MAX_ATTEMPTS = 4;
const PROFILE_FETCH_BASE_DELAY_MS = 200;
const SESSION_INIT_TIMEOUT_MS = 6000;

const mockDevices = ["Chrome on Windows 11", "Safari on macOS", "Chrome on Android", "Firefox on Ubuntu"];
const mockIPs = ["103.21.58.142", "49.36.128.91", "182.74.55.210", "14.139.60.15"];

const AuthContext = createContext<AuthContextType | null>(null);

function profileToAuthUser(profile: Profile, name?: string, avatarUrl?: string): AuthUser {
  const firstName = profile.first_name?.trim() ?? "";
  const lastName = profile.last_name?.trim() ?? "";
  const email = profile.email ?? "";
  const displayName = getDisplayName({ firstName, lastName, name, email });
  const initials = getInitials({ firstName, lastName, name: displayName, email });

  return {
    id: profile.id,
    email,
    firstName,
    lastName,
    displayName,
    initials,
    role: profileRoleToUserRole(profile.role),
    name: displayName || "User",
    avatarUrl: profile.avatar_url ?? avatarUrl,
    avatar: profile.avatar_url ?? avatarUrl,
    loginTime: Date.now(),
    profileComplete: Boolean(firstName.trim() && lastName.trim()),
  };
}

function getUserDisplay(sessionUser: { email?: string; user_metadata?: Record<string, any> }) {
  const name =
    sessionUser.user_metadata?.full_name ??
    sessionUser.user_metadata?.name ??
    sessionUser.email ??
    "";
  const avatar =
    sessionUser.user_metadata?.avatar_url ??
    sessionUser.user_metadata?.picture;
  return { name, avatar };
}

/** Build AuthUser from session only (e.g. profile not ready yet after OAuth). Default role customer. */
function sessionUserToAuthUser(sessionUser: { id: string; email?: string; user_metadata?: Record<string, any> }): AuthUser {
  const email = sessionUser.email ?? "";
  const { name, avatar } = getUserDisplay(sessionUser);
  const displayName = getDisplayName({ firstName: "", lastName: "", name, email });
  const initials = getInitials({ firstName: "", lastName: "", name: displayName, email });
  return {
    id: sessionUser.id,
    email,
    firstName: "",
    lastName: "",
    displayName: displayName || "User",
    initials: initials || "U",
    role: "customer",
    name: displayName || "User",
    profileComplete: false,
    avatarUrl: avatar,
    avatar,
    loginTime: Date.now(),
  };
}

function createMockUser(email: string, role: UserRole, name: string): AuthUser {
  const [firstName = "", ...rest] = name.trim().split(/\s+/);
  const lastName = rest.join(" ");
  const displayName = getDisplayName({ firstName, lastName, name, email });

  return {
    id: `mock-${email}`,
    email,
    firstName,
    lastName,
    displayName,
    initials: getInitials({ firstName, lastName, name: displayName, email }),
    role,
    name: displayName || "User",
    profileComplete: Boolean(firstName.trim() && lastName.trim()),
    loginTime: Date.now(),
  };
}

function clearStoredAuthState() {
  localStorage.removeItem("sos_user");
}

function hydrateStoredUser(user: Partial<AuthUser> & Pick<AuthUser, "id" | "email" | "role" | "loginTime">): AuthUser {
  const firstName = (user.firstName ?? "").trim();
  const lastName = (user.lastName ?? "").trim();
  const name = (user.displayName ?? user.name ?? "").trim();
  const email = user.email ?? "";
  const displayName = getDisplayName({ firstName, lastName, name, email });

  return {
    id: user.id,
    email,
    firstName,
    lastName,
    displayName,
    initials: getInitials({ firstName, lastName, name: displayName, email }),
    role: user.role,
    name: displayName || "User",
    profileComplete: Boolean(firstName && lastName),
    avatarUrl: user.avatarUrl ?? user.avatar,
    avatar: user.avatar ?? user.avatarUrl,
    loginTime: user.loginTime,
  };
}

async function fetchProfileWithRetry(userId: string): Promise<Profile | null> {
  for (let attempt = 1; attempt <= PROFILE_FETCH_MAX_ATTEMPTS; attempt++) {
    try {
      const { data: profileData } = await getProfile(userId);
      if (profileData) return profileData;
    } catch {
      /* network hiccup — retry */
    }
    if (attempt < PROFILE_FETCH_MAX_ATTEMPTS) {
      await new Promise((r) => setTimeout(r, PROFILE_FETCH_BASE_DELAY_MS * attempt));
    }
  }
  return null;
}

function getInitialUser(): AuthUser | null {
  if (isSupabaseConfigured()) return null;
  const stored = localStorage.getItem("sos_user");
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored) as Partial<AuthUser> & Pick<AuthUser, "id" | "email" | "role" | "loginTime">;
    if (Date.now() - parsed.loginTime > SESSION_TIMEOUT) {
      localStorage.removeItem("sos_user");
      return null;
    }
    return hydrateStoredUser(parsed);
  } catch {
    return null;
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(getInitialUser);
  const [initialized, setInitialized] = useState(!isSupabaseConfigured());

  const [loginLogs, setLoginLogs] = useState<LoginLog[]>(() => {
    const stored = localStorage.getItem("sos_login_logs");
    return stored ? JSON.parse(stored) : [];
  });

  /**
   * Resolve the user's real role from their profile. If the profile fetch fails,
   * retry with increasing delays. NEVER fall back to a guessed "customer" role —
   * that causes the wrong dashboard to flash for owners/admins/managers.
   */
  const resolveAuthUser = useCallback(async (
    sessionUser: { id: string; email?: string; user_metadata?: Record<string, any> },
    mountedRef: { current: boolean },
  ): Promise<AuthUser | null> => {
    const profileData = await fetchProfileWithRetry(sessionUser.id);
    if (!mountedRef.current) return null;
    if (profileData) {
      const { name, avatar } = getUserDisplay(sessionUser);
      return profileToAuthUser(profileData, name, avatar);
    }
    return null;
  }, []);

  const refreshFromSession = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    try {
      const { data } = await withTimeout(getSession(), 3000, { session: null });
      if (!data.session?.user) return;
      const ref = { current: true };
      const resolved = await resolveAuthUser(data.session.user, ref);
      if (resolved) setUser(resolved);
    } catch {
      /* swallow — session refresh is best-effort */
    }
  }, [resolveAuthUser]);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setInitialized(true);
      return;
    }

    const mountedRef = { current: true };

    const initSession = async () => {
      const hasHash = typeof window !== "undefined" && window.location.hash.includes("access_token");
      const maxAttempts = hasHash ? 3 : 1;
      const delayMs = hasHash ? 250 : 0;

      try {
        if (hasHash) {
          await new Promise((r) => setTimeout(r, 100));
        }

        let session: Awaited<ReturnType<typeof getSession>>["data"]["session"] = null;

        for (let attempt = 0; attempt < maxAttempts && mountedRef.current; attempt++) {
          try {
            const result = await withTimeout(getSession(), 2500, { session: null });
            session = result.data?.session ?? null;
            if (session) break;
          } catch {
            /* timeout or abort — continue */
          }
          if (!session && attempt < maxAttempts - 1 && delayMs > 0) {
            await new Promise((r) => setTimeout(r, delayMs));
          }
        }

        if (!mountedRef.current) return;
        if (!session?.user) return;

        const resolved = await resolveAuthUser(session.user, mountedRef);
        if (!mountedRef.current) return;
        if (resolved) {
          setUser(resolved);
        }
        // If profile still null, DON'T set a fake user — leave user=null.
        // onAuthStateChange will fire and try again.
      } catch {
        /* swallow — we'll still set initialized */
      } finally {
        if (mountedRef.current) setInitialized(true);
      }
    };

    initSession();

    const safetyTimer = setTimeout(() => {
      if (mountedRef.current) setInitialized(true);
    }, SESSION_INIT_TIMEOUT_MS);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mountedRef.current) return;
      try {
        if (event === "SIGNED_OUT") {
          setUser(null);
          setInitialized(true);
          return;
        }
        if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session?.user) {
          const resolved = await resolveAuthUser(session.user, mountedRef);
          if (!mountedRef.current) return;
          if (resolved) {
            setUser(resolved);
          }
          // If profile unavailable, don't set a fake user.
          // The user stays null → AppShell shows loading → safety timer eventually unblocks.
        }
        if (mountedRef.current) setInitialized(true);
      } catch {
        if (mountedRef.current) setInitialized(true);
      }
    });

    return () => {
      mountedRef.current = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, [resolveAuthUser]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const onFocus = () => {
      refreshFromSession();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        refreshFromSession();
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refreshFromSession]);

  useEffect(() => {
    if (!user || !isSupabaseConfigured()) return;
    const interval = setInterval(() => {
      if (Date.now() - user.loginTime > SESSION_TIMEOUT) {
        setUser(null);
        supabaseLogoutCurrentDevice();
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const login = useCallback((email: string, password: string) => {
    if (isSupabaseConfigured()) return { success: false, error: "Use Google or OTP to sign in." };
    const cred = CREDENTIALS[email.toLowerCase()];
    if (!cred) return { success: false, error: "Invalid credentials" };
    if (cred.password !== password) return { success: false, error: "Invalid credentials" };

    const newUser: AuthUser = {
      ...createMockUser(email.toLowerCase(), cred.role, cred.name),
    };

    const log: LoginLog = {
      email: email.toLowerCase(),
      role: cred.role,
      timestamp: Date.now(),
      device: mockDevices[Math.floor(Math.random() * mockDevices.length)],
      ip: mockIPs[Math.floor(Math.random() * mockIPs.length)],
    };

    const updatedLogs = [log, ...loginLogs].slice(0, 50);
    setLoginLogs(updatedLogs);
    localStorage.setItem("sos_login_logs", JSON.stringify(updatedLogs));

    setUser(newUser);
    localStorage.setItem("sos_user", JSON.stringify(newUser));
    return { success: true };
  }, [loginLogs]);

  const logoutCurrentDevice = useCallback(async () => {
    if (isSupabaseConfigured()) await supabaseLogoutCurrentDevice();
    setUser(null);
    clearStoredAuthState();
  }, []);

  const logoutAllDevices = useCallback(async () => {
    if (isSupabaseConfigured()) {
      await supabaseLogoutAllDevices();
    }
    setUser(null);
    clearStoredAuthState();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isInitialized: initialized, recheckSession: refreshFromSession, login, logoutCurrentDevice, logoutAllDevices, loginLogs }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
