import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BOOKINGS, HOTELS } from "@/data/mock-data";
import { Download, Eye } from "lucide-react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  confirmed: "bg-info/10 text-info",
  checked_in: "bg-success/10 text-success",
  checked_out: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
  no_show: "bg-warning/10 text-warning",
};

export default function MyBookings() {
  const myBookings = BOOKINGS.filter(b => b.guestEmail === "customer@stayonstay.com" || true).slice(0, 6);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">My Bookings</h1>
        <p className="text-sm text-muted-foreground">View and manage your reservations</p>
      </div>

      <div className="space-y-4">
        {myBookings.map(booking => {
          const hotel = HOTELS.find(h => h.id === booking.hotelId);
          return (
            <Card key={booking.id} className="hover:shadow-card transition-shadow">
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-xs text-muted-foreground">{booking.id}</span>
                      <Badge className={statusColors[booking.status]}>{booking.status.replace("_", " ")}</Badge>
                    </div>
                    <h3 className="font-heading font-semibold">{hotel?.name || "Hotel"}</h3>
                    <p className="text-sm text-muted-foreground">{booking.guestName} · {booking.nationality}</p>
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Check-in: {booking.checkIn}</span>
                      <span>Check-out: {booking.checkOut}</span>
                    </div>
                    {booking.companions.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">+{booking.companions.length} companion(s)</p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {booking.services.map(s => <Badge key={s} variant="outline" className="text-[9px]">{s}</Badge>)}
                    </div>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="text-lg font-heading font-bold">₹{booking.totalAmount.toLocaleString()}</p>
                      {booking.paidAmount < booking.totalAmount && (
                        <p className="text-[10px] text-warning">₹{(booking.totalAmount - booking.paidAmount).toLocaleString()} pending</p>
                      )}
                    </div>
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => toast.success("Invoice downloaded")}>
                      <Download className="h-3 w-3" /> Invoice
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
