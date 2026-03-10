import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BOOKINGS, HOTELS, SERVICE_REQUESTS } from "@/data/mock-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Clock, BedDouble, ShieldCheck, AlertTriangle, Users } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const statusColors: Record<string, string> = { confirmed: "bg-info/10 text-info", checked_in: "bg-success/10 text-success", checked_out: "bg-muted text-muted-foreground", no_show: "bg-warning/10 text-warning" };

export default function ReceptionDashboard() {
  const todayCheckIns = BOOKINGS.filter(b => b.checkIn === "2026-03-10" || b.status === "confirmed");
  const todayCheckOuts = BOOKINGS.filter(b => b.status === "checked_in");
  const pendingVerifications = BOOKINGS.filter(b => b.status === "confirmed");
  const allRooms = HOTELS.flatMap(h => h.rooms);

  const stats = [
    { label: "Today Check-ins", value: todayCheckIns.length, icon: CheckCircle, color: "text-success" },
    { label: "Today Check-outs", value: todayCheckOuts.length, icon: XCircle, color: "text-info" },
    { label: "Pending Verifications", value: pendingVerifications.length, icon: Clock, color: "text-warning" },
    { label: "Available Rooms", value: allRooms.filter(r => r.status === "available").length, icon: BedDouble, color: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-bold">Reception Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card><CardContent className="p-4 flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-muted ${s.color}`}><s.icon className="h-5 w-5" /></div>
              <div><p className="text-2xl font-heading font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
            </CardContent></Card>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="checkins">
        <TabsList>
          <TabsTrigger value="checkins">Check-ins</TabsTrigger>
          <TabsTrigger value="checkouts">Check-outs</TabsTrigger>
          <TabsTrigger value="rooms">Room Grid</TabsTrigger>
          <TabsTrigger value="requests">Service Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="checkins" className="mt-4 space-y-3">
          {todayCheckIns.map(b => (
            <Card key={b.id}>
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-muted-foreground">{b.id}</span>
                    <Badge className={statusColors[b.status]}>{b.status.replace("_", " ")}</Badge>
                  </div>
                  <p className="font-medium">{b.guestName} <span className="text-xs text-muted-foreground">· {b.nationality}</span></p>
                  <p className="text-xs text-muted-foreground">Passport: {b.passportNumber} · Room: {b.roomId}</p>
                  {b.companions.length > 0 && <p className="text-xs text-muted-foreground mt-1"><Users className="h-3 w-3 inline mr-1" />{b.companions.length} companion(s): {b.companions.map(c => c.name).join(", ")}</p>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => toast.success("Passport verified")}><ShieldCheck className="h-3 w-3" /> Verify</Button>
                  <Button size="sm" className="gap-1" onClick={() => toast.success(`${b.guestName} checked in!`)}><CheckCircle className="h-3 w-3" /> Check In</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="checkouts" className="mt-4 space-y-3">
          {todayCheckOuts.map(b => (
            <Card key={b.id}>
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1">
                  <p className="font-medium">{b.guestName}</p>
                  <p className="text-xs text-muted-foreground">Room: {b.roomId} · Check-out: {b.checkOut}</p>
                  <p className="text-xs text-muted-foreground">Balance: ₹{(b.totalAmount - b.paidAmount).toLocaleString()}</p>
                </div>
                <Button size="sm" onClick={() => toast.success(`${b.guestName} checked out!`)}>Process Check-out</Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="rooms" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Live Room Status</CardTitle></CardHeader>
            <CardContent>
              {HOTELS.slice(0, 2).map(hotel => (
                <div key={hotel.id} className="mb-6">
                  <h4 className="text-sm font-medium mb-3">{hotel.name}</h4>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                    {hotel.rooms.map(room => (
                      <div key={room.id} className={`p-2 rounded-lg text-center text-xs font-mono cursor-pointer transition-colors ${
                        room.status === "available" ? "bg-success/10 text-success border border-success/20 hover:bg-success/20" :
                        room.status === "booked" ? "bg-destructive/10 text-destructive border border-destructive/20" :
                        "bg-muted text-muted-foreground border"
                      }`}>
                        {room.number}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex gap-4 text-xs mt-4">
                <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-success/20 border border-success/30" /> Available</span>
                <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-destructive/20 border border-destructive/30" /> Booked</span>
                <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-muted border" /> Maintenance</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="mt-4 space-y-3">
          {SERVICE_REQUESTS.map(r => (
            <Card key={r.id}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary">{r.type}</Badge>
                    <Badge className={r.priority === "high" ? "bg-destructive/10 text-destructive" : "bg-info/10 text-info"}>{r.priority}</Badge>
                  </div>
                  <p className="text-sm">{r.description}</p>
                  <p className="text-xs text-muted-foreground">Room {r.roomNumber} · {r.guestName}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => toast.success("Request handled")}>Resolve</Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
