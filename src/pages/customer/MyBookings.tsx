import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";

const statusColors: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  confirmed: "bg-info/10 text-info",
  checked_in: "bg-success/10 text-success",
  checked_out: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

interface BookingRow {
  id: string;
  check_in_date: string;
  check_out_date: string;
  status: string;
  total_price: number | null;
  currency: string | null;
  hotel_name_snapshot: string | null;
  room_type_name_snapshot: string | null;
  created_at: string;
}

export default function MyBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id || !isSupabaseConfigured()) {
      setLoading(false);
      return;
    }
    let mounted = true;
    supabase
      .from("bookings")
      .select("id, check_in_date, check_out_date, status, total_price, currency, hotel_name_snapshot, room_type_name_snapshot, created_at")
      .eq("booker_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data, error }) => {
        if (!mounted) return;
        if (!error && data) setBookings(data as BookingRow[]);
        setLoading(false);
      });
    return () => { mounted = false; };
  }, [user?.id]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">My Bookings</h1>
        <p className="text-sm text-muted-foreground">View and manage your reservations</p>
      </div>
      <div className="space-y-4">
        {loading && <Skeleton className="h-32 w-full" />}
        {!loading && bookings.length === 0 && (
          <Card><CardContent className="p-8 text-center text-muted-foreground text-sm">No bookings yet. Browse hotels to make your first booking.</CardContent></Card>
        )}
        {bookings.map((b) => (
          <Card key={b.id} className="hover:shadow-card transition-shadow">
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-xs text-muted-foreground">{b.id.slice(0, 8)}</span>
                    <Badge className={statusColors[b.status] ?? "bg-muted text-muted-foreground"}>{b.status.replace("_", " ")}</Badge>
                  </div>
                  <h3 className="font-heading font-semibold">{b.hotel_name_snapshot || "Hotel"}</h3>
                  <p className="text-sm text-muted-foreground">{b.room_type_name_snapshot || "Room"}</p>
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    <span>Check-in: {b.check_in_date}</span>
                    <span>Check-out: {b.check_out_date}</span>
                  </div>
                </div>
                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-lg font-heading font-bold">{b.currency ?? "INR"} {Number(b.total_price ?? 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
