import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Building, CreditCard, AlertTriangle, FileText, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { AdminUserRoleManager } from "@/components/admin/AdminUserRoleManager";
import {
  getAdminStats,
  isSupabaseConfigured,
  listHotelsForAdmin,
  listRecentBookingsForAdmin,
  listStripeWebhookEventsForAdmin,
  type AdminRecentBooking,
  type AdminWebhookEvent,
  type HotelRecord,
} from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";

const PATH_TO_TAB: Record<string, string> = {
  "/dashboard": "users",
  "/users": "users",
  "/hotels-mgmt": "hotels",
  "/payments": "payments",
  "/fraud": "fraud",
  "/incidents": "incidents",
  "/logs": "logs",
  "/settings": "settings",
};

const TAB_TO_PATH: Record<string, string> = {
  users: "/users",
  hotels: "/hotels-mgmt",
  payments: "/payments",
  fraud: "/fraud",
  incidents: "/incidents",
  logs: "/logs",
  settings: "/settings",
};

export default function AdminDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const hasSupabase = isSupabaseConfigured();

  const tab = location.pathname.startsWith("/hotels-mgmt")
    ? "hotels"
    : PATH_TO_TAB[location.pathname] ?? "users";

  const [stats, setStats] = useState<{ profileCount: number; hotelCount: number; bookingCount: number } | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [hotels, setHotels] = useState<HotelRecord[]>([]);
  const [hotelsLoading, setHotelsLoading] = useState(true);
  const [recentBookings, setRecentBookings] = useState<AdminRecentBooking[]>([]);
  const [webhookEvents, setWebhookEvents] = useState<AdminWebhookEvent[]>([]);

  useEffect(() => {
    if (!hasSupabase || user?.role !== "admin") {
      setStatsLoading(false);
      setHotelsLoading(false);
      return;
    }
    let mounted = true;
    getAdminStats().then(({ data, error }) => {
      if (!mounted) return;
      if (!error && data) setStats(data);
      setStatsLoading(false);
    });
    listHotelsForAdmin().then(({ data, error }) => {
      if (!mounted) return;
      if (!error && data) setHotels(data);
      setHotelsLoading(false);
    });
    listRecentBookingsForAdmin(10).then(({ data, error }) => {
      if (!mounted || error) return;
      setRecentBookings(data);
    });
    listStripeWebhookEventsForAdmin(10).then(({ data, error }) => {
      if (!mounted || error) return;
      setWebhookEvents(data);
    });
    return () => {
      mounted = false;
    };
  }, [hasSupabase, user?.role]);

  const statCards = useMemo(
    () => [
      { label: "Total Users", value: stats?.profileCount ?? "—", icon: Users, color: "text-primary" },
      { label: "Active Hotels", value: stats?.hotelCount ?? "—", icon: Building, color: "text-success" },
      { label: "Bookings", value: stats?.bookingCount ?? "—", icon: CreditCard, color: "text-info" },
      { label: "Open incidents", value: "—", icon: AlertTriangle, color: "text-warning" },
    ],
    [stats]
  );

  const onTabChange = (v: string) => {
    const path = TAB_TO_PATH[v];
    if (path) navigate(path);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-heading font-bold">Admin Control Center</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-muted ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-heading font-bold">
                    {statsLoading ? <Skeleton className="h-8 w-12" /> : s.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Tabs value={tab} onValueChange={onTabChange}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="hotels">Hotels</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="fraud">Fraud</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="logs">System Logs</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4 space-y-4">
          <AdminUserRoleManager />
        </TabsContent>

        <TabsContent value="hotels" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button asChild size="sm">
              <Link to="/hotels-mgmt/new">
                <Plus className="h-4 w-4 mr-2" />
                Add hotel
              </Link>
            </Button>
          </div>
          {hotelsLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : hotels.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground text-sm">
                No hotels yet.{" "}
                <Link to="/hotels-mgmt/new" className="text-primary underline">
                  Add your first hotel
                </Link>
                .
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {hotels.map((h) => (
                <Card key={h.id}>
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    {h.image_url ? (
                      <img src={h.image_url} alt={h.name} className="h-16 w-24 rounded-lg object-cover" />
                    ) : (
                      <div className="h-16 w-24 rounded-lg bg-muted" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{h.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {[h.address, h.city].filter(Boolean).join(", ") || "—"}
                      </p>
                    </div>
                    <Badge className="bg-success/10 text-success shrink-0">Active</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent bookings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {recentBookings.length === 0 && <p className="text-sm text-muted-foreground">No bookings yet.</p>}
                {recentBookings.map((b) => (
                  <div key={b.id} className="rounded border p-2 text-xs">
                    <p className="font-medium">{b.hotel_name_snapshot || "Hotel"} - {b.room_type_name_snapshot || "Room"}</p>
                    <p className="text-muted-foreground">{b.status} · {new Date(b.created_at).toLocaleString()}</p>
                    <p>{b.currency ?? "INR"} {Number(b.total_price ?? 0).toLocaleString()}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Webhook reconciliation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {webhookEvents.length === 0 && <p className="text-sm text-muted-foreground">No webhook events logged yet.</p>}
                {webhookEvents.map((e) => (
                  <div key={e.id} className="rounded border p-2 text-xs">
                    <p className="font-medium">{e.event_type}</p>
                    <p className="text-muted-foreground">{e.id}</p>
                    <p className="text-muted-foreground">{new Date(e.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="fraud" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fraud detection</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Fraud rules and alerts are not configured in this build. Add scoring / rules when you have volume.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Incidents</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Operational incidents will be tracked here when connected to your ticketing or logging system.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                System logs
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Use Supabase logs and Stripe webhook event logs for debugging. In-app audit feed can be added later.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Platform Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border p-4 space-y-1">
                  <p className="font-medium">Stripe Integration</p>
                  <p className="text-muted-foreground">Stripe keys are configured via environment variables and Edge Functions.</p>
                  <Badge variant="secondary" className="bg-success/10 text-success">Connected</Badge>
                </div>
                <div className="rounded-lg border p-4 space-y-1">
                  <p className="font-medium">Supabase Project</p>
                  <p className="text-muted-foreground">Database, auth, and storage are managed through Supabase.</p>
                  <Badge variant="secondary" className="bg-success/10 text-success">{hasSupabase ? "Connected" : "Not configured"}</Badge>
                </div>
                <div className="rounded-lg border p-4 space-y-1">
                  <p className="font-medium">Default Currency</p>
                  <p className="text-muted-foreground">INR (Indian Rupee). Change in Edge Function config.</p>
                </div>
                <div className="rounded-lg border p-4 space-y-1">
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-muted-foreground">Configure transactional emails via Supabase Auth templates or a third-party provider.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
