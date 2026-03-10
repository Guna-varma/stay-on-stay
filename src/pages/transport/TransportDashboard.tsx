import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TRIPS, DRIVERS, VEHICLES, TRANSLATORS } from "@/data/mock-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Truck, Users, Car, Globe, MapPin, Clock, Star } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const tripStatusColors: Record<string, string> = { scheduled: "bg-info/10 text-info", in_progress: "bg-warning/10 text-warning", completed: "bg-success/10 text-success", cancelled: "bg-destructive/10 text-destructive" };
const driverStatusColors: Record<string, string> = { available: "bg-success/10 text-success", on_trip: "bg-warning/10 text-warning", off_duty: "bg-muted text-muted-foreground" };

export default function TransportDashboard() {
  const stats = [
    { label: "Active Trips", value: TRIPS.filter(t => t.status === "in_progress").length, icon: Truck, color: "text-warning" },
    { label: "Scheduled", value: TRIPS.filter(t => t.status === "scheduled").length, icon: Clock, color: "text-info" },
    { label: "Available Drivers", value: DRIVERS.filter(d => d.status === "available").length, icon: Users, color: "text-success" },
    { label: "Active Vehicles", value: VEHICLES.filter(v => v.status === "active").length, icon: Car, color: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-bold">Transport Management</h1>

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

      <Tabs defaultValue="trips">
        <TabsList>
          <TabsTrigger value="trips">Trips</TabsTrigger>
          <TabsTrigger value="drivers">Drivers</TabsTrigger>
          <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
          <TabsTrigger value="translators">Translators</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
        </TabsList>

        <TabsContent value="trips" className="mt-4 space-y-3">
          {TRIPS.map(trip => (
            <Card key={trip.id}>
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary">{trip.type}</Badge>
                    <Badge className={tripStatusColors[trip.status]}>{trip.status.replace("_", " ")}</Badge>
                  </div>
                  <p className="font-medium text-sm">{trip.guestName}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <MapPin className="h-3 w-3" /> {trip.from} → {trip.to}
                  </div>
                  <p className="text-xs text-muted-foreground">{trip.date} at {trip.time} · Driver: {DRIVERS.find(d => d.id === trip.driverId)?.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-heading font-bold">₹{trip.fare.toLocaleString()}</p>
                  {trip.status === "scheduled" && <Button size="sm" className="mt-1" onClick={() => toast.success("Trip started")}>Start Trip</Button>}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="drivers" className="mt-4 space-y-3">
          {DRIVERS.map(driver => (
            <Card key={driver.id}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-bold">{driver.name.split(" ").map(n => n[0]).join("")}</div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{driver.name}</p>
                  <p className="text-xs text-muted-foreground">{driver.phone} · License: {driver.license}</p>
                  <div className="flex items-center gap-1 mt-1"><Star className="h-3 w-3 fill-warning text-warning" /><span className="text-xs">{driver.rating}</span></div>
                </div>
                <Badge className={driverStatusColors[driver.status]}>{driver.status.replace("_", " ")}</Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="vehicles" className="mt-4 space-y-3">
          {VEHICLES.map(v => (
            <Card key={v.id}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted"><Car className="h-5 w-5 text-primary" /></div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{v.model} <Badge variant="secondary" className="text-[10px] ml-1">{v.type}</Badge></p>
                  <p className="text-xs text-muted-foreground">{v.plate} · Capacity: {v.capacity}</p>
                </div>
                <Badge className={v.status === "active" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}>{v.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="translators" className="mt-4 space-y-3">
          {TRANSLATORS.map(t => (
            <Card key={t.id}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted"><Globe className="h-5 w-5 text-primary" /></div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{t.name}</p>
                  <div className="flex flex-wrap gap-1 mt-1">{t.languages.map(l => <Badge key={l} variant="outline" className="text-[10px]">{l}</Badge>)}</div>
                  <div className="flex items-center gap-2 mt-1"><Star className="h-3 w-3 fill-warning text-warning" /><span className="text-xs">{t.rating}</span><span className="text-xs text-muted-foreground">· ₹{t.pricePerDay.toLocaleString()}/day</span></div>
                </div>
                <Badge className={t.status === "available" ? "bg-success/10 text-success" : t.status === "assigned" ? "bg-info/10 text-info" : "bg-muted text-muted-foreground"}>{t.status.replace("_", " ")}</Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="vendors" className="mt-4">
          <Card><CardContent className="p-6 space-y-4">
            {[
              { name: "Gurugram Cab Services", type: "Transport Provider", pending: 45000, paid: 180000 },
              { name: "Premium Cars Pvt Ltd", type: "Vehicle Rental", pending: 15000, paid: 95000 },
              { name: "Indo-Global Translators", type: "Translation Service", pending: 8000, paid: 52000 },
            ].map(v => (
              <div key={v.name} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium text-sm">{v.name}</p>
                  <p className="text-xs text-muted-foreground">{v.type}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Pending: <span className="font-medium text-warning">₹{v.pending.toLocaleString()}</span></p>
                  <p className="text-xs text-muted-foreground">Total Paid: ₹{v.paid.toLocaleString()}</p>
                  <Button size="sm" variant="outline" className="mt-1 text-xs" onClick={() => toast.success("Payment initiated")}>Pay Now</Button>
                </div>
              </div>
            ))}
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
