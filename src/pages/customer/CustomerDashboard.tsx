import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Hotel, Search, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { motion } from "framer-motion";
import { supabase, isSupabaseConfigured, listPublicHotelsWithRoomTypesCached, getCustomerRecentBookings, publicHotelCoverUrls, type PublicHotelCard } from "@/lib/supabase";
import { HotelCoverCarousel } from "@/components/HotelCoverCarousel";
import { Skeleton } from "@/components/ui/skeleton";

function thumbCoverUrls(h: PublicHotelCard): string[] {
  const u = publicHotelCoverUrls(h);
  if (u.length) return u;
  const r0 = h.room_types[0]?.images?.[0];
  return r0 ? [r0] : [];
}

const statusColors: Record<string, string> = {
  confirmed: "bg-info/10 text-info",
  checked_in: "bg-success/10 text-success",
  checked_out: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

interface BookingSummary {
  id: string;
  check_in_date: string;
  check_out_date: string;
  status: string;
  total_price: number | null;
  currency: string | null;
  hotel_name_snapshot: string | null;
  room_type_name_snapshot: string | null;
}

export default function CustomerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const firstName = user?.displayName?.split(/\s+/)[0] ?? user?.name?.split(/\s+/)[0] ?? "there";
  const [bookings, setBookings] = useState<BookingSummary[]>([]);
  const [hotels, setHotels] = useState<PublicHotelCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id || !isSupabaseConfigured()) {
      setLoading(false);
      return;
    }
    let mounted = true;
    // Use optimized cached API functions
    Promise.all([
      getCustomerRecentBookings(user.id, 10),
      listPublicHotelsWithRoomTypesCached(),
    ]).then(([bookingsRes, hotelsRes]) => {
      if (!mounted) return;
      if (bookingsRes.data) setBookings(bookingsRes.data);
      if (hotelsRes.data) setHotels(hotelsRes.data);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, [user?.id]);

  const activeBooking = bookings.find((b) => b.status === "checked_in");
  const totalBookings = bookings.length;

  const stats = [
    { label: "Active Stay", value: activeBooking ? "1" : "0", icon: Hotel, color: "text-success" },
    { label: "Total Bookings", value: String(totalBookings), icon: CalendarDays, color: "text-info" },
    { label: "Browse Hotels", value: String(hotels.length), icon: Search, color: "text-warning" },
    { label: "Notifications", value: "—", icon: Bell, color: "text-primary" },
  ];

  return (
    <div className="space-y-8 p-1">
      <section>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl text-foreground">Welcome back, {firstName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Here's your stay overview</p>
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="rounded-xl border border-border/50 bg-card p-5 shadow-sm">
              <CardContent className="flex items-center justify-between p-0">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-muted ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold tracking-tight">{loading ? <Skeleton className="h-8 w-12" /> : s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </section>

      {activeBooking && (
        <section>
          <Card className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-md">
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="text-lg font-semibold">Current Stay</CardTitle>
                <Badge className={statusColors[activeBooking.status]} variant="secondary">Checked In</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-6 pb-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2"><Hotel className="h-4 w-4 text-primary" /><span className="font-medium">{activeBooking.hotel_name_snapshot || "Hotel"}</span></div>
                <p className="text-sm text-muted-foreground">{activeBooking.room_type_name_snapshot || "Room"}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span>Check-in: {activeBooking.check_in_date}</span>
                  <span>Check-out: {activeBooking.check_out_date}</span>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs text-muted-foreground">Total amount</p>
                <p className="text-xl font-bold text-primary">{activeBooking.currency ?? "INR"} {Number(activeBooking.total_price ?? 0).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-xl border border-border/50 bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold">Recent Bookings</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs font-medium" onClick={() => navigate("/bookings")}>View All</Button>
          </CardHeader>
          <CardContent>
            {loading && <Skeleton className="h-20 w-full" />}
            {!loading && bookings.length === 0 && <p className="text-sm text-muted-foreground">No bookings yet. Browse hotels to get started.</p>}
            <ul className="space-y-3">
              {bookings.slice(0, 4).map((b) => (
                <li key={b.id} className="flex items-center justify-between rounded-xl border border-transparent bg-muted/40 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{b.hotel_name_snapshot || "Hotel"}</p>
                    <p className="truncate text-xs text-muted-foreground">{b.check_in_date} — {b.check_out_date}</p>
                  </div>
                  <Badge variant="secondary" className={statusColors[b.status] ?? "bg-muted text-muted-foreground"}>{b.status.replace("_", " ")}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-border/50 bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold">Recommended Hotels</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs font-medium" onClick={() => navigate("/hotels")}>Browse All</Button>
          </CardHeader>
          <CardContent>
            {loading && <Skeleton className="h-20 w-full" />}
            <div className="space-y-3">
              {hotels.slice(0, 3).map((h) => (
                <button key={h.id} type="button" className="flex w-full items-center gap-3 rounded-xl border border-transparent bg-muted/40 p-3 text-left transition-colors hover:bg-muted/60" onClick={() => navigate(`/hotels/${h.id}`)}>
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                    <HotelCoverCarousel images={thumbCoverUrls(h)} alt={h.name} className="h-full w-full" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{h.name}</p>
                    <p className="text-xs text-muted-foreground">{[h.address, h.city].filter(Boolean).join(", ")}</p>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
