import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import AccessDenied from "./pages/AccessDenied";
import NotFound from "./pages/NotFound";

import CustomerDashboard from "./pages/customer/CustomerDashboard";
import HotelSearch from "./pages/customer/HotelSearch";
import HotelDetail from "./pages/customer/HotelDetail";
import MyBookings from "./pages/customer/MyBookings";
import ServiceRequests from "./pages/customer/ServiceRequests";
import NotificationsPage from "./pages/customer/NotificationsPage";
import Emergency from "./pages/customer/Emergency";

import ReceptionDashboard from "./pages/reception/ReceptionDashboard";
import HousekeepingDashboard from "./pages/housekeeping/HousekeepingDashboard";
import TransportDashboard from "./pages/transport/TransportDashboard";
import FinanceDashboard from "./pages/finance/FinanceDashboard";
import OwnerAnalytics from "./pages/owner/OwnerAnalytics";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ComplianceDashboard from "./pages/compliance/ComplianceDashboard";

const queryClient = new QueryClient();

function DashboardRouter() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  const roleComponentMap: Record<string, JSX.Element> = {
    customer: <CustomerDashboard />,
    receptionist: <ReceptionDashboard />,
    senior_receptionist: <ReceptionDashboard />,
    housekeeping: <HousekeepingDashboard />,
    transport: <TransportDashboard />,
    finance: <FinanceDashboard />,
    owner: <OwnerAnalytics />,
    admin: <AdminDashboard />,
  };

  return roleComponentMap[user.role] || <CustomerDashboard />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/access-denied" element={<AccessDenied />} />

            {/* Protected routes inside AppShell */}
            <Route element={<AppShell />}>
              <Route path="/dashboard" element={<DashboardRouter />} />

              {/* Customer routes */}
              <Route path="/hotels" element={<HotelSearch />} />
              <Route path="/hotels/:id" element={<HotelDetail />} />
              <Route path="/bookings" element={<MyBookings />} />
              <Route path="/services" element={<ServiceRequests />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/emergency" element={<Emergency />} />

              {/* Reception routes */}
              <Route path="/checkin" element={<ReceptionDashboard />} />
              <Route path="/rooms" element={<ReceptionDashboard />} />
              <Route path="/verifications" element={<ReceptionDashboard />} />
              <Route path="/staff" element={<ReceptionDashboard />} />
              <Route path="/reports" element={<ReceptionDashboard />} />

              {/* Housekeeping */}
              <Route path="/tasks" element={<HousekeepingDashboard />} />

              {/* Transport */}
              <Route path="/trips" element={<TransportDashboard />} />
              <Route path="/drivers" element={<TransportDashboard />} />
              <Route path="/vehicles" element={<TransportDashboard />} />
              <Route path="/vendors" element={<TransportDashboard />} />

              {/* Finance */}
              <Route path="/revenue" element={<FinanceDashboard />} />
              <Route path="/invoices" element={<FinanceDashboard />} />
              <Route path="/expenses" element={<FinanceDashboard />} />
              <Route path="/settlements" element={<FinanceDashboard />} />

              {/* Owner */}
              <Route path="/analytics/revenue" element={<OwnerAnalytics />} />
              <Route path="/analytics/occupancy" element={<OwnerAnalytics />} />
              <Route path="/analytics/expenses" element={<OwnerAnalytics />} />
              <Route path="/analytics/forecast" element={<OwnerAnalytics />} />
              <Route path="/analytics/rooms" element={<OwnerAnalytics />} />

              {/* Admin */}
              <Route path="/users" element={<AdminDashboard />} />
              <Route path="/hotels-mgmt" element={<AdminDashboard />} />
              <Route path="/payments" element={<AdminDashboard />} />
              <Route path="/fraud" element={<AdminDashboard />} />
              <Route path="/incidents" element={<AdminDashboard />} />
              <Route path="/logs" element={<AdminDashboard />} />
              <Route path="/settings" element={<AdminDashboard />} />

              {/* Compliance */}
              <Route path="/compliance" element={<ComplianceDashboard />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
