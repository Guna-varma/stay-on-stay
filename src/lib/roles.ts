import {
  Home, Search, CalendarDays, Bell, Phone, ClipboardList, Users, BedDouble,
  CheckCircle, ShieldCheck, Truck, Globe, DollarSign, BarChart3, Settings,
  FileText, AlertTriangle, Building, UserCog, CreditCard, Activity, Lock,
  Sparkles, Star
} from "lucide-react";
import type { UserRole } from "./auth";

export interface NavItem {
  title: string;
  path: string;
  icon: any;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  customer: "Customer",
  receptionist: "Receptionist",
  senior_receptionist: "Senior Receptionist",
  housekeeping: "Housekeeping Staff",
  transport: "Transport Manager",
  finance: "Finance Manager",
  owner: "Hotel Owner",
  admin: "Platform Admin",
};

export const ROLE_NAV: Record<UserRole, NavItem[]> = {
  customer: [
    { title: "Dashboard", path: "/dashboard", icon: Home },
    { title: "Search Hotels", path: "/hotels", icon: Search },
    { title: "My Bookings", path: "/bookings", icon: CalendarDays },
    { title: "Service Requests", path: "/services", icon: ClipboardList },
    { title: "Notifications", path: "/notifications", icon: Bell },
    { title: "Emergency", path: "/emergency", icon: Phone },
  ],
  receptionist: [
    { title: "Dashboard", path: "/dashboard", icon: Home },
    { title: "Check-In / Out", path: "/checkin", icon: CheckCircle },
    { title: "Room Status", path: "/rooms", icon: BedDouble },
    { title: "Verifications", path: "/verifications", icon: ShieldCheck },
    { title: "Service Requests", path: "/services", icon: ClipboardList },
  ],
  senior_receptionist: [
    { title: "Dashboard", path: "/dashboard", icon: Home },
    { title: "Check-In / Out", path: "/checkin", icon: CheckCircle },
    { title: "Room Status", path: "/rooms", icon: BedDouble },
    { title: "Verifications", path: "/verifications", icon: ShieldCheck },
    { title: "Staff Assignment", path: "/staff", icon: Users },
    { title: "Reports", path: "/reports", icon: FileText },
    { title: "Service Requests", path: "/services", icon: ClipboardList },
  ],
  housekeeping: [
    { title: "Dashboard", path: "/dashboard", icon: Home },
    { title: "Cleaning Tasks", path: "/tasks", icon: ClipboardList },
    { title: "Room Status", path: "/rooms", icon: BedDouble },
  ],
  transport: [
    { title: "Dashboard", path: "/dashboard", icon: Home },
    { title: "Trips", path: "/trips", icon: Truck },
    { title: "Drivers", path: "/drivers", icon: Users },
    { title: "Vehicles", path: "/vehicles", icon: Truck },
    { title: "Vendors", path: "/vendors", icon: DollarSign },
  ],
  finance: [
    { title: "Dashboard", path: "/dashboard", icon: Home },
    { title: "Revenue", path: "/revenue", icon: BarChart3 },
    { title: "Invoices", path: "/invoices", icon: FileText },
    { title: "Expenses", path: "/expenses", icon: DollarSign },
    { title: "Settlements", path: "/settlements", icon: CreditCard },
  ],
  owner: [
    { title: "Dashboard", path: "/dashboard", icon: Home },
    { title: "Revenue Analytics", path: "/analytics/revenue", icon: BarChart3 },
    { title: "Occupancy", path: "/analytics/occupancy", icon: Activity },
    { title: "Expenses", path: "/analytics/expenses", icon: DollarSign },
    { title: "Forecasting", path: "/analytics/forecast", icon: Sparkles },
    { title: "Room Performance", path: "/analytics/rooms", icon: Star },
    { title: "Compliance", path: "/compliance", icon: Lock },
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
