import {
  Home, Search, CalendarDays, Bell, Phone, ClipboardList, Users, BedDouble,
  CheckCircle, ShieldCheck, FileText, Activity, Lock, Sparkles, Star, User,
  BarChart3, Building, UserCog, CreditCard, AlertTriangle, Settings
} from "lucide-react";
import type { UserRole } from "./auth";

export interface NavItem {
  title: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  customer: "Customer",
  owner: "Hotel Owner",
  manager: "Senior Receptionist",
  admin: "Platform Admin",
};

/** Manager = merged Receptionist + Senior Receptionist: all front-desk and reporting. */
export const ROLE_NAV: Record<UserRole, NavItem[]> = {
  customer: [
    { title: "Hotels", path: "/hotels", icon: Search },
    { title: "Orders", path: "/dashboard", icon: Home },
    { title: "My Bookings", path: "/bookings", icon: CalendarDays },
    { title: "Service Requests", path: "/services", icon: ClipboardList },
    { title: "Notifications", path: "/notifications", icon: Bell },
    { title: "Emergency", path: "/emergency", icon: Phone },
    { title: "Profile", path: "/profile", icon: User },
    { title: "Checkout", path: "/checkout", icon: CreditCard },
    { title: "Booking Status", path: "/booking", icon: CalendarDays },
  ],
  owner: [
    { title: "Dashboard", path: "/dashboard", icon: Home },
    { title: "Transport Ops", path: "/transport", icon: CheckCircle },
    { title: "Revenue Analytics", path: "/analytics/revenue", icon: BarChart3 },
    { title: "Occupancy", path: "/analytics/occupancy", icon: Activity },
    { title: "Expenses", path: "/analytics/expenses", icon: Lock },
    { title: "Forecasting", path: "/analytics/forecast", icon: Sparkles },
    { title: "Room Performance", path: "/analytics/rooms", icon: Star },
    { title: "Compliance", path: "/compliance", icon: Lock },
    { title: "Profile", path: "/profile", icon: User },
  ],
  manager: [
    { title: "Dashboard", path: "/dashboard", icon: Home },
    { title: "Check-In / Out", path: "/checkin", icon: CheckCircle },
    { title: "Room Status", path: "/rooms", icon: BedDouble },
    { title: "Verifications", path: "/verifications", icon: ShieldCheck },
    { title: "Staff Assignment", path: "/staff", icon: Users },
    { title: "Reports", path: "/reports", icon: FileText },
    { title: "Service Requests", path: "/services", icon: ClipboardList },
    { title: "Profile", path: "/profile", icon: User },
  ],
  admin: [
    { title: "Dashboard", path: "/dashboard", icon: Home },
    { title: "Users", path: "/users", icon: UserCog },
    { title: "Hotels", path: "/hotels-mgmt", icon: Building },
    { title: "Payments", path: "/payments", icon: CreditCard },
    { title: "Fraud Detection", path: "/fraud", icon: AlertTriangle },
    { title: "Compliance", path: "/compliance", icon: Lock },
    { title: "System Logs", path: "/logs", icon: FileText },
    { title: "Incidents", path: "/incidents", icon: AlertTriangle },
    { title: "Settings", path: "/settings", icon: Settings },
    { title: "Profile", path: "/profile", icon: User },
  ],
};

const ALL_PATHS_BY_ROLE: Record<UserRole, string[]> = Object.fromEntries(
  Object.entries(ROLE_NAV).map(([role, items]) => [
    role,
    items.map((i) => i.path),
  ])
) as Record<UserRole, string[]>;

export function canAccessPath(role: UserRole, path: string): boolean {
  const paths = ALL_PATHS_BY_ROLE[role];
  return paths.some((p) => path === p || path.startsWith(p + "/"));
}
