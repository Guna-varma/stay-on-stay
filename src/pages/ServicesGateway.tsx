import { useAuth } from "@/lib/auth";
import ServiceRequests from "@/pages/customer/ServiceRequests";
import ReceptionDashboard from "@/pages/reception/ReceptionDashboard";

/**
 * Customers use /services for their own requests; managers see the operations queue (same route, role-aware).
 */
export default function ServicesGateway() {
  const { user } = useAuth();
  if (user?.role === "manager") {
    return <ReceptionDashboard />;
  }
  return <ServiceRequests />;
}
