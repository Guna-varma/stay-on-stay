import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type UserRole =
  | "customer"
  | "receptionist"
  | "senior_receptionist"
  | "housekeeping"
  | "transport"
  | "finance"
  | "owner"
  | "admin";

export interface AuthUser {
  email: string;
  role: UserRole;
  name: string;
  avatar?: string;
  loginTime: number;
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
  login: (email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  loginLogs: LoginLog[];
}

const CREDENTIALS: Record<string, { password: string; role: UserRole; name: string }> = {
  "customer@stayonstay.com": { password: "12345678", role: "customer", name: "Aisha Mohammed" },
  "reception@stayonstay.com": { password: "12345678", role: "receptionist", name: "Priya Sharma" },
  "senior.reception@stayonstay.com": { password: "12345678", role: "senior_receptionist", name: "Rajesh Kumar" },
  "housekeeping@stayonstay.com": { password: "12345678", role: "housekeeping", name: "Sunita Devi" },
  "transport@stayonstay.com": { password: "12345678", role: "transport", name: "Vikram Singh" },
  "finance@stayonstay.com": { password: "12345678", role: "finance", name: "Ananya Gupta" },
  "owner@stayonstay.com": { password: "12345678", role: "owner", name: "Deepak Malhotra" },
  "admin@stayonstay.com": { password: "12345678", role: "admin", name: "System Admin" },
};

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 min

const mockDevices = ["Chrome on Windows 11", "Safari on macOS", "Chrome on Android", "Firefox on Ubuntu"];
const mockIPs = ["103.21.58.142", "49.36.128.91", "182.74.55.210", "14.139.60.15"];

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem("sos_user");
    if (!stored) return null;
    const parsed = JSON.parse(stored) as AuthUser;
    if (Date.now() - parsed.loginTime > SESSION_TIMEOUT) {
      localStorage.removeItem("sos_user");
      return null;
    }
    return parsed;
  });

  const [loginLogs, setLoginLogs] = useState<LoginLog[]>(() => {
    const stored = localStorage.getItem("sos_login_logs");
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      if (Date.now() - user.loginTime > SESSION_TIMEOUT) {
        setUser(null);
        localStorage.removeItem("sos_user");
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const login = useCallback((email: string, password: string) => {
    const cred = CREDENTIALS[email.toLowerCase()];
    if (!cred) return { success: false, error: "Invalid credentials" };
    if (cred.password !== password) return { success: false, error: "Invalid credentials" };

    const newUser: AuthUser = {
      email: email.toLowerCase(),
      role: cred.role,
      name: cred.name,
      loginTime: Date.now(),
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

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("sos_user");
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loginLogs }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
