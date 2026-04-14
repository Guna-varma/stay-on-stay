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

const PROFILE_FETCH_MAX_ATTEMPTS = 4;
const PROFILE_FETCH_BASE_DELAY_MS = 200;
const SESSION_INIT_TIMEOUT_MS = 6000;
const AUTH_SYNC_CHANNEL = "sos-auth";

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

/** When profiles row is slow/unreachable, infer role from JWT metadata (set in Supabase for staff if needed). */
function inferUserRoleFromSession(sessionUser: {
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
}): UserRole {
  const raw =
    sessionUser.user_metadata?.role ??
    sessionUser.app_metadata?.role ??
    sessionUser.user_metadata?.user_role;
  const s = typeof raw === "string" ? raw.toLowerCase().trim() : "";
  if (s === "owner" || s === "manager" || s === "admin" || s === "customer") return s;
  return "customer";
}

/** Last-resort user so the shell does not spin forever when getProfile fails after retries. */
function fallbackAuthUserFromSession(sessionUser: {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
}): AuthUser {
  const base = sessionUserToAuthUser(sessionUser as Parameters<typeof sessionUserToAuthUser>[0]);
  return { ...base, role: inferUserRoleFromSession(sessionUser) };
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

function clearStoredDemoAuthState() {
  localStorage.removeItem("sos_user");
}

function getInitialDemoUser(): AuthUser | null {
  if (isSupabaseConfigured()) return null;
  const stored = localStorage.getItem("sos_user");
  if (!stored) return null;
  try {
    return JSON.parse(stored) as AuthUser;
  } catch {
    return null;
  }
}

function createAuthSyncChannel(): BroadcastChannel | null {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
    return null;
  }
  return new BroadcastChannel(AUTH_SYNC_CHANNEL);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(getInitialDemoUser);
  const [initialized, setInitialized] = useState(!isSupabaseConfigured());

  const [loginLogs, setLoginLogs] = useState<LoginLog[]>(() => {
    const stored = localStorage.getItem("sos_login_logs");
    return stored ? JSON.parse(stored) : [];
  });

  /**
   * Prefer `profiles` row for role and name. If fetch fails after retries, fall back to
   * session-only user with role from JWT `user_metadata.role` / `app_metadata.role` when set.
   */
  const resolveAuthUser = useCallback(async (
    sessionUser: { id: string; email?: string; user_metadata?: Record<string, any> },
    mountedRef: { current: boolean },
  ): Promise<AuthUser | null> => {
    const profileData = await fetchProfileWithRetry(sessionUser.id);
    if (!mountedRef.current) return null;
    if (profileData) {
      if (!profileData.is_active) {
        try {
          await supabaseLogoutCurrentDevice();
        } catch {
          /* best effort */
        }
        return null;
      }
      const { name, avatar } = getUserDisplay(sessionUser);
      return profileToAuthUser(profileData, name, avatar);
    }
    return fallbackAuthUserFromSession(sessionUser);
  }, []);

  const refreshFromSession = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    try {
      const { data, error } = await getSession();
      if (error) return;
      if (!data.session?.user) {
        setUser(null);
        return;
      }
      const ref = { current: true };
      const resolved = await resolveAuthUser(data.session.user, ref);
      setUser(resolved);
    } catch {
      /* swallow — session refresh is best-effort */
    }
  }, [resolveAuthUser]);

  /**
   * Single auth hydration path: rely on onAuthStateChange(INITIAL_SESSION) instead of a
   * parallel getSession() loop. Competing calls contend on GoTrue's storage lock and
   * trigger "Lock … was not released within 5000ms" on slow networks / mobile.
   */
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setInitialized(true);
      return;
    }

    const mountedRef = { current: true };
    const authSyncChannel = createAuthSyncChannel();

    const safetyTimer = setTimeout(() => {
      if (mountedRef.current) setInitialized(true);
    }, SESSION_INIT_TIMEOUT_MS);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mountedRef.current) return;
      try {
        if (event === "INITIAL_SESSION") {
          if (session?.user) {
            const resolved = await resolveAuthUser(session.user, mountedRef);
            if (mountedRef.current) setUser(resolved);
          } else if (
            typeof window !== "undefined" &&
            window.location.hash.includes("access_token")
          ) {
            // OAuth implicit/PKCE fragment: session can appear shortly after storage write
            await new Promise((r) => setTimeout(r, 200));
            const { data } = await getSession();
            if (mountedRef.current && data.session?.user) {
              const resolved = await resolveAuthUser(data.session.user, mountedRef);
              if (mountedRef.current) setUser(resolved);
            }
          } else if (mountedRef.current) {
            setUser(null);
          }
          if (mountedRef.current) setInitialized(true);
          return;
        }

        if (event === "SIGNED_OUT") {
          setUser(null);
          setInitialized(true);
          authSyncChannel?.postMessage({ type: "auth-state-changed" });
          return;
        }

        if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session?.user) {
          const resolved = await resolveAuthUser(session.user, mountedRef);
          if (!mountedRef.current) return;
          setUser(resolved);
          if (event === "SIGNED_IN") {
            authSyncChannel?.postMessage({ type: "auth-state-changed" });
          }
        }
        if (mountedRef.current) setInitialized(true);
      } catch {
        if (mountedRef.current) setInitialized(true);
      }
    });

    return () => {
      mountedRef.current = false;
      clearTimeout(safetyTimer);
      authSyncChannel?.close();
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
    if (!isSupabaseConfigured()) return;

    const channel = createAuthSyncChannel();
    if (!channel) return;

    channel.onmessage = (event: MessageEvent<{ type?: string }>) => {
      if (event.data?.type === "auth-state-changed") {
        refreshFromSession();
      }
    };

    return () => {
      channel.close();
    };
  }, [refreshFromSession]);

  /* Removed artificial 30-min SESSION_TIMEOUT. Supabase manages JWT expiry
     and auto-refreshes tokens via autoRefreshToken: true. */

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
    else clearStoredDemoAuthState();
    setUser(null);
  }, []);

  const logoutAllDevices = useCallback(async () => {
    if (isSupabaseConfigured()) {
      await supabaseLogoutAllDevices();
    } else {
      clearStoredDemoAuthState();
    }
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isInitialized: initialized, login, logoutCurrentDevice, logoutAllDevices, loginLogs }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
