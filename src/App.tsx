import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ScrollManager from "@/components/ScrollManager";
import { AuthProvider, useAuth, type UserRole } from "@/lib/auth";
import { CartProvider } from "@/lib/cart-context";
import { AppShell } from "@/components/AppShell";
import React from "react";

import Landing from "./pages/Landing";
import MedTourism from "./pages/MedTourism";
import MedTourismTopic from "./pages/MedTourismTopic";
import About from "./pages/About";
import Careers from "./pages/Careers";
import Partners from "./pages/Partners";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import HelpCenter from "./pages/HelpCenter";
import ContactUs from "./pages/ContactUs";
import WhatsAppSupport from "./pages/WhatsAppSupport";
import ExploreIndia from "./pages/ExploreIndia";
import Login from "./pages/Login";
import AccessDenied from "./pages/AccessDenied";
import NotFound from "./pages/NotFound";

const CustomerDashboard = React.lazy(() => import("./pages/customer/CustomerDashboard"));
const HotelSearch = React.lazy(() => import("./pages/customer/HotelSearch"));
const HotelDetail = React.lazy(() => import("./pages/customer/HotelDetail"));
const Checkout = React.lazy(() => import("./pages/customer/Checkout"));
const BookingSuccess = React.lazy(() => import("./pages/customer/BookingSuccess"));
const BookingCancel = React.lazy(() => import("./pages/customer/BookingCancel"));
const MyBookings = React.lazy(() => import("./pages/customer/MyBookings"));
const ServiceRequests = React.lazy(() => import("./pages/customer/ServiceRequests"));
const NotificationsPage = React.lazy(() => import("./pages/customer/NotificationsPage"));
const Emergency = React.lazy(() => import("./pages/customer/Emergency"));
const ReceptionDashboard = React.lazy(() => import("./pages/reception/ReceptionDashboard"));
const OwnerAnalytics = React.lazy(() => import("./pages/owner/OwnerAnalytics"));
const AdminDashboard = React.lazy(() => import("./pages/admin/AdminDashboard"));
const AdminAddHotel = React.lazy(() => import("./pages/admin/AdminAddHotel"));
const AdminAddRooms = React.lazy(() => import("./pages/admin/AdminAddRooms"));
const ComplianceDashboard = React.lazy(() => import("./pages/compliance/ComplianceDashboard"));
const Profile = React.lazy(() => import("./pages/Profile"));

const queryClient = new QueryClient();

function DashboardRouter() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  const roleComponentMap: Record<UserRole, JSX.Element> = {
    customer: <CustomerDashboard />,
    owner: <OwnerAnalytics />,
    manager: <ReceptionDashboard />,
    admin: <AdminDashboard />,
  };

  return roleComponentMap[user.role] ?? <Navigate to="/access-denied" replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_relativeSplatPath: true }}>
          <CartProvider>
          <ScrollManager />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/med-tourism" element={<MedTourism />} />
            <Route path="/med-tourism/:topic" element={<MedTourismTopic />} />
            <Route path="/about" element={<About />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/partners" element={<Partners />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/help-center" element={<HelpCenter />} />
            <Route path="/contact-us" element={<ContactUs />} />
            <Route path="/whatsapp-support" element={<WhatsAppSupport />} />
            <Route path="/explore-india" element={<ExploreIndia />} />
            <Route path="/login" element={<Login />} />
            <Route path="/access-denied" element={<AccessDenied />} />

            {/* Protected routes inside AppShell */}
            <Route element={<AppShell />}>
              <Route path="/dashboard" element={<DashboardRouter />} />
              <Route path="/profile" element={<Profile />} />

              {/* Customer routes */}
              <Route path="/hotels" element={<HotelSearch />} />
              <Route path="/hotels/:id" element={<HotelDetail />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/booking/success" element={<BookingSuccess />} />
              <Route path="/booking/cancel" element={<BookingCancel />} />
              <Route path="/bookings" element={<MyBookings />} />
              <Route path="/services" element={<ServiceRequests />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/emergency" element={<Emergency />} />

              {/* Manager (reception + front-desk) */}
              <Route path="/checkin" element={<ReceptionDashboard />} />
              <Route path="/rooms" element={<ReceptionDashboard />} />
              <Route path="/verifications" element={<ReceptionDashboard />} />
              <Route path="/staff" element={<ReceptionDashboard />} />
              <Route path="/reports" element={<ReceptionDashboard />} />

              {/* Owner */}
              <Route path="/analytics/revenue" element={<OwnerAnalytics />} />
              <Route path="/analytics/occupancy" element={<OwnerAnalytics />} />
              <Route path="/analytics/expenses" element={<OwnerAnalytics />} />
              <Route path="/analytics/forecast" element={<OwnerAnalytics />} />
              <Route path="/analytics/rooms" element={<OwnerAnalytics />} />

              {/* Admin */}
              <Route path="/users" element={<AdminDashboard />} />
              <Route path="/hotels-mgmt/new" element={<AdminAddHotel />} />
              <Route path="/hotels-mgmt/:hotelId/rooms/new" element={<AdminAddRooms />} />
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
          </CartProvider>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
