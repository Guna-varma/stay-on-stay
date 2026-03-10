import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BOOKINGS, HOTELS, SERVICE_REQUESTS, NOTIFICATIONS } from "@/data/mock-data";
import { CalendarDays, Hotel, ClipboardList, Bell, Phone, Star, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const statusColors: Record<string, string> = {
  confirmed: "bg-info/10 text-info",
  checked_in: "bg-success/10 text-success",
  checked_out: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
  no_show: "bg-warning/10 text-warning",
};

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const myBookings = BOOKINGS.filter(b => b.guestEmail === "customer@stayonstay.com");
  const activeBooking = myBookings.find(b => b.status === "checked_in");
  const myRequests = SERVICE_REQUESTS.filter(r => r.guestName === "Aisha Mohammed");
  const myNotifs = NOTIFICATIONS.filter(n => n.role === "all" || n.role === "customer").slice(0, 4);

  const stats = [
    { label: "Active Stay", value: activeBooking ? "1" : "0", icon: Hotel, color: "text-success" },
    { label: "Total Bookings", value: String(myBookings.length), icon: CalendarDays, color: "text-info" },
    { label: "Open Requests", value: String(myRequests.filter(r => r.status !== "resolved").length), icon: ClipboardList, color: "text-warning" },
    { label: "Notifications", value: String(myNotifs.filter(n => !n.read).length), icon: Bell, color: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-heading font-bold truncate">Welcome back, Aisha</h1>
          <p className="text-sm text-muted-foreground">Here's your stay overview</p>
        </div>
        <Button variant="destructive" size="sm" className="gap-2 shrink-0" onClick={() => navigate("/emergency")}>
          <Phone className="h-3.5 w-3.5" /> Emergency
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-muted ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-heading font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Active Booking */}
      {activeBooking && (
        <Card className="border-primary/20 shadow-premium">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Current Stay</CardTitle>
              <Badge className={statusColors[activeBooking.status]}>Checked In</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Hotel className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">{HOTELS.find(h => h.id === activeBooking.hotelId)?.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Near {HOTELS.find(h => h.id === activeBooking.hotelId)?.nearbyHospital}</span>
                </div>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>Check-in: {activeBooking.checkIn}</span>
                  <span>Check-out: {activeBooking.checkOut}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {activeBooking.services.map(s => (
                    <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total Amount</p>
                <p className="text-xl font-heading font-bold text-primary">₹{activeBooking.totalAmount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Service Requests */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Service Requests</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate("/services")}>View All</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {myRequests.map(r => (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">{r.type}</p>
                    <p className="text-xs text-muted-foreground">{r.description}</p>
                  </div>
                  <Badge variant="secondary" className={r.status === "resolved" ? "bg-success/10 text-success" : r.status === "in_progress" ? "bg-warning/10 text-warning" : "bg-info/10 text-info"}>
                    {r.status.replace("_", " ")}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Saved Hotels */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recommended Hotels</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate("/hotels")}>Browse All</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {HOTELS.slice(0, 3).map(h => (
                <div key={h.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors" onClick={() => navigate("/hotels")}>
                  <img src={h.image} alt={h.name} className="h-12 w-12 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{h.name}</p>
                    <p className="text-xs text-muted-foreground">{h.distanceKm}km from {h.nearbyHospital}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-warning fill-warning" />
                    <span className="text-xs font-medium">{h.rating}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
