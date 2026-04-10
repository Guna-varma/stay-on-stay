import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SEED_TRANSLATORS, SEED_VEHICLES, SEED_VENDORS } from "@/data/operations-seed";
import type { TransportDriver, TransportTrip, TripStatus } from "@/lib/operations-types";
import type { LucideIcon } from "lucide-react";
import { Car, Clock, Globe, Truck, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const tripStatusStyles: Record<TripStatus, string> = {
  scheduled: "bg-sky-100 text-sky-800",
  active: "bg-amber-100 text-amber-900",
  completed: "bg-emerald-100 text-emerald-800",
};

interface Props {
  trips: TransportTrip[];
  drivers: TransportDriver[];
  kpi: { active: number; scheduled: number; drivers: number; vehicles: number };
  onStartTrip: (id: string) => void;
}

export function TransportPanel({ trips, drivers, kpi, onStartTrip }: Props) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={Truck} label="Active trips" value={kpi.active} accent="text-amber-600" />
        <Kpi icon={Clock} label="Scheduled" value={kpi.scheduled} accent="text-sky-600" />
        <Kpi icon={Users} label="Available drivers" value={kpi.drivers} accent="text-emerald-600" />
        <Kpi icon={Car} label="Active vehicles" value={kpi.vehicles} accent="text-primary" />
      </div>

      <Tabs defaultValue="trips">
        <TabsList className="flex h-auto min-h-10 w-full flex-wrap justify-start gap-1 rounded-xl bg-muted/50 p-1">
          {(["trips", "drivers", "vehicles", "translators", "vendors"] as const).map((t) => (
            <TabsTrigger key={t} value={t} className="rounded-lg capitalize">
              {t}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="trips" className="mt-4 space-y-3">
          {trips.map((trip) => (
            <Card key={trip.id} className="border-border/60 shadow-sm">
              <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{trip.type}</Badge>
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", tripStatusStyles[trip.status])}>
                      {trip.status}
                    </span>
                  </div>
                  <p className="font-semibold">{trip.guestName}</p>
                  <p className="text-sm text-muted-foreground">{trip.route}</p>
                  <p className="text-xs text-muted-foreground">
                    {trip.scheduledAt.replace("T", " at ").slice(0, 16)} · Driver: {trip.driverName}
                  </p>
                  <p className="text-sm font-medium tabular-nums">₹{trip.priceInr.toLocaleString("en-IN")}</p>
                </div>
                {trip.status === "scheduled" ? (
                  <Button type="button" className="shrink-0 rounded-lg" onClick={() => onStartTrip(trip.id)}>
                    Start Trip
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="drivers" className="mt-4 space-y-2">
          {drivers.map((d) => (
            <Card key={d.id} className="border-border/60">
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground">
                    {d.name
                      .split(" ")
                      .map((p) => p[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-semibold">{d.name}</p>
                    <p className="text-xs text-muted-foreground">{d.phone}</p>
                    <p className="text-xs text-muted-foreground">License: {d.license}</p>
                    <p className="text-xs font-medium text-amber-600">★ {d.rating}</p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "capitalize",
                    d.status === "available" ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-amber-300 bg-amber-50 text-amber-900",
                  )}
                >
                  {d.status.replace("_", " ")}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="vehicles" className="mt-4 space-y-2">
          {SEED_VEHICLES.map((v) => (
            <Card key={v.id} className="border-border/60">
              <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <Car className="h-8 w-8 text-primary/70" />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{v.name}</span>
                      <Badge variant="secondary" className="text-[10px]">
                        {v.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {v.plate} · Capacity: {v.capacity}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    v.status === "active" ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-amber-300 bg-amber-50 text-amber-900",
                  )}
                >
                  {v.status}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="translators" className="mt-4 space-y-2">
          {SEED_TRANSLATORS.map((t) => (
            <Card key={t.id} className="border-border/60">
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">{t.name}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {t.languages.map((lang) => (
                        <Badge key={lang} variant="outline" className="text-[10px]">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      ★ {t.rating} · ₹{t.rateInrPerDay.toLocaleString("en-IN")}/day
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    t.status === "available" ? "border-emerald-300 bg-emerald-50" : "border-sky-300 bg-sky-50",
                  )}
                >
                  {t.status}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="vendors" className="mt-4 space-y-2">
          {SEED_VENDORS.map((v) => (
            <Card key={v.id} className="border-border/60">
              <CardContent className="p-4">
                <p className="font-semibold">{v.name}</p>
                <p className="text-xs text-muted-foreground">{v.category}</p>
                <p className="text-xs text-muted-foreground">{v.contact}</p>
                <Badge variant={v.active ? "default" : "secondary"} className="mt-2 text-[10px]">
                  {v.active ? "Active" : "Inactive"}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardContent className="flex items-center gap-3 p-4">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg bg-muted", accent)}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold tabular-nums">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
