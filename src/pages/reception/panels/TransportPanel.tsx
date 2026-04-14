import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import type {
  CreateTripInput,
  ReceptionCheckIn,
  TransportDriver,
  TransportTrip,
  TransportVehicle,
  Translator,
  TripStatus,
  TripType,
  Vendor,
} from "@/lib/operations-types";
import {
  DRIVER_STATUSES,
  ROUTE_PRESETS,
  TRIP_TYPES,
  TRANSLATOR_LANGUAGE_OPTIONS,
  TRANSLATOR_STATUSES,
  VENDOR_CATEGORIES,
  VEHICLE_BODY_TYPES,
  VEHICLE_STATUSES,
} from "@/lib/transport-lovs";
import type { LucideIcon } from "lucide-react";
import { Car, Clock, Globe, Pencil, Plus, Trash2, Truck, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const tripStatusStyles: Record<TripStatus, string> = {
  scheduled: "bg-sky-100 text-sky-800",
  active: "bg-amber-100 text-amber-900",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-slate-200 text-slate-700",
};

interface Props {
  trips: TransportTrip[];
  drivers: TransportDriver[];
  vehicles: TransportVehicle[];
  translators: Translator[];
  vendors: Vendor[];
  /** Guests eligible for transport assignment (in-house or confirmed arrival) */
  checkins: ReceptionCheckIn[];
  kpi: { active: number; scheduled: number; drivers: number; vehicles: number };
  onStartTrip: (id: string) => void;
  onCreateTrip: (input: CreateTripInput) => Promise<boolean>;
  onCancelTrip: (id: string) => void;
  onSaveDriver: (row: TransportDriver) => void;
  onRemoveDriver: (id: string) => void;
  onSaveVehicle: (row: TransportVehicle) => void;
  onRemoveVehicle: (id: string) => void;
  onSaveTranslator: (row: Translator) => void;
  onRemoveTranslator: (id: string) => void;
  onSaveVendor: (row: Vendor) => void;
  onRemoveVendor: (id: string) => void;
}

export function TransportPanel({
  trips,
  drivers,
  vehicles,
  translators,
  vendors,
  checkins,
  kpi,
  onStartTrip,
  onCreateTrip,
  onCancelTrip,
  onSaveDriver,
  onRemoveDriver,
  onSaveVehicle,
  onRemoveVehicle,
  onSaveTranslator,
  onRemoveTranslator,
  onSaveVendor,
  onRemoveVendor,
}: Props) {
  const guestOptions = useMemo(
    () => checkins.filter((c) => c.status === "checked_in" || c.status === "confirmed"),
    [checkins],
  );

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
          <div className="flex justify-end">
            <ScheduleTripDialog
              guestOptions={guestOptions}
              drivers={drivers}
              vehicles={vehicles}
              onCreate={onCreateTrip}
            />
          </div>
          {trips.map((trip) => (
            <Card key={trip.id} className="border-border/60 shadow-sm">
              <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{trip.type}</Badge>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        tripStatusStyles[trip.status],
                      )}
                    >
                      {trip.status}
                    </span>
                  </div>
                  <p className="font-semibold">{trip.guestName}</p>
                  {trip.roomLabel ? (
                    <p className="text-xs text-muted-foreground">Room / ref: {trip.roomLabel}</p>
                  ) : null}
                  <p className="text-sm text-muted-foreground">{trip.route}</p>
                  <p className="text-xs text-muted-foreground">
                    {trip.scheduledAt.replace("T", " at ").slice(0, 16)} · Driver: {trip.driverName}
                  </p>
                  <p className="text-sm font-medium tabular-nums">₹{trip.priceInr.toLocaleString("en-IN")}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {trip.status === "scheduled" ? (
                    <>
                      <Button type="button" className="shrink-0 rounded-lg" onClick={() => onStartTrip(trip.id)}>
                        Start Trip
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => onCancelTrip(trip.id)}>
                        Cancel
                      </Button>
                    </>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="drivers" className="mt-4 space-y-2">
          <div className="flex justify-end">
            <DriverDialog drivers={drivers} onSave={onSaveDriver} onRemove={onRemoveDriver} />
          </div>
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
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      "capitalize",
                      d.status === "available"
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                        : d.status === "on_trip"
                          ? "border-amber-300 bg-amber-50 text-amber-900"
                          : "border-slate-300 bg-slate-50 text-slate-700",
                    )}
                  >
                    {d.status.replace("_", " ")}
                  </Badge>
                  <DriverDialog drivers={drivers} initial={d} onSave={onSaveDriver} onRemove={onRemoveDriver} />
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="vehicles" className="mt-4 space-y-2">
          <div className="flex justify-end">
            <VehicleDialog vehicles={vehicles} onSave={onSaveVehicle} onRemove={onRemoveVehicle} />
          </div>
          {vehicles.map((v) => (
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
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      v.status === "active"
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                        : v.status === "maintenance"
                          ? "border-amber-300 bg-amber-50 text-amber-900"
                          : "border-slate-300 bg-slate-50 text-slate-600",
                    )}
                  >
                    {v.status}
                  </Badge>
                  <VehicleDialog vehicles={vehicles} initial={v} onSave={onSaveVehicle} onRemove={onRemoveVehicle} />
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="translators" className="mt-4 space-y-2">
          <div className="flex justify-end">
            <TranslatorDialog translators={translators} onSave={onSaveTranslator} onRemove={onRemoveTranslator} />
          </div>
          {translators.map((t) => (
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
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      t.status === "available" ? "border-emerald-300 bg-emerald-50" : "border-sky-300 bg-sky-50",
                    )}
                  >
                    {t.status.replace("_", " ")}
                  </Badge>
                  <TranslatorDialog
                    translators={translators}
                    initial={t}
                    onSave={onSaveTranslator}
                    onRemove={onRemoveTranslator}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="vendors" className="mt-4 space-y-2">
          <div className="flex justify-end">
            <VendorDialog vendors={vendors} onSave={onSaveVendor} onRemove={onRemoveVendor} />
          </div>
          {vendors.map((v) => (
            <Card key={v.id} className="border-border/60">
              <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">{v.name}</p>
                  <p className="text-xs text-muted-foreground">{v.category}</p>
                  <p className="text-xs text-muted-foreground">{v.contact}</p>
                  <Badge variant={v.active ? "default" : "secondary"} className="mt-2 text-[10px]">
                    {v.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <VendorDialog vendors={vendors} initial={v} onSave={onSaveVendor} onRemove={onRemoveVendor} />
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ScheduleTripDialog({
  guestOptions,
  drivers,
  vehicles,
  onCreate,
}: {
  guestOptions: ReceptionCheckIn[];
  drivers: TransportDriver[];
  vehicles: TransportVehicle[];
  onCreate: (input: CreateTripInput) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [guestKey, setGuestKey] = useState<string>("");
  const [type, setType] = useState<TripType>("Airport Pickup");
  const [routePreset, setRoutePreset] = useState<string>(ROUTE_PRESETS[0]);
  const [routeCustom, setRouteCustom] = useState("");
  const [scheduledLocal, setScheduledLocal] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 1, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [driverId, setDriverId] = useState("");
  const [vehicleId, setVehicleId] = useState<string>("__none__");
  const [price, setPrice] = useState("1200");
  const [manualGuestName, setManualGuestName] = useState("");
  const [manualRoomLabel, setManualRoomLabel] = useState("");
  const [manualCheckInRef, setManualCheckInRef] = useState("");

  const route = routeCustom.trim() || routePreset || ROUTE_PRESETS[0];

  const submit = async () => {
    const g = guestOptions.find((c) => c.id === guestKey);
    const guestName = g?.guestName ?? manualGuestName.trim();
    if (!guestName) {
      toast.error("Select a guest or enter guest name");
      return;
    }
    const d = drivers.find((x) => x.id === driverId);
    if (!d) {
      toast.error("Select a driver");
      return;
    }
    if (d.status !== "available") {
      toast.error("Selected driver is not available");
      return;
    }
    const iso = new Date(scheduledLocal).toISOString();
    const created = await onCreate({
      type,
      guestName,
      roomLabel: g?.roomLabel ?? (manualRoomLabel.trim() || undefined),
      checkInRef: g?.id ?? (manualCheckInRef.trim() || undefined),
      route,
      scheduledAt: iso,
      driverId,
      vehicleId: vehicleId === "__none__" ? undefined : vehicleId,
      priceInr: Number(price) || 0,
    });
    if (created) {
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" className="gap-1.5 rounded-lg" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Schedule trip
      </Button>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign trip to guest</DialogTitle>
        </DialogHeader>
        {guestOptions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No in-house/confirmed guests found right now. You can still create a manual trip.
          </p>
        ) : null}
        <div className="grid gap-3 text-sm">
          {guestOptions.length > 0 ? (
            <div>
              <Label>Guest (in-house / confirmed)</Label>
              <Select value={guestKey} onValueChange={setGuestKey}>
                <SelectTrigger>
                  <SelectValue placeholder="Select guest (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {guestOptions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.guestName} · {c.roomLabel} · {c.bookingRef}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <div>
            <Label>Guest name (manual)</Label>
            <Input
              value={manualGuestName}
              onChange={(e) => setManualGuestName(e.target.value)}
              placeholder="Enter guest name when not selecting from list"
            />
          </div>
          <div>
            <Label>Room / reference (manual, optional)</Label>
            <Input
              value={manualRoomLabel}
              onChange={(e) => setManualRoomLabel(e.target.value)}
              placeholder="e.g. h2-r5"
            />
          </div>
          <div>
            <Label>Check-in reference (manual, optional)</Label>
            <Input
              value={manualCheckInRef}
              onChange={(e) => setManualCheckInRef(e.target.value)}
              placeholder="e.g. BK-2026-001"
            />
          </div>
          <div>
            <Label>Trip type</Label>
            <Select value={type} onValueChange={(v) => setType(v as TripType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRIP_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Route preset</Label>
            <Select value={routePreset} onValueChange={setRoutePreset}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a common route" />
              </SelectTrigger>
              <SelectContent>
                {ROUTE_PRESETS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Custom route (optional)</Label>
            <Input value={routeCustom} onChange={(e) => setRouteCustom(e.target.value)} placeholder="Overrides preset if filled" />
          </div>
          <div>
            <Label>Scheduled time</Label>
            <Input type="datetime-local" value={scheduledLocal} onChange={(e) => setScheduledLocal(e.target.value)} />
          </div>
          <div>
            <Label>Driver (available)</Label>
            <Select value={driverId} onValueChange={setDriverId}>
              <SelectTrigger>
                <SelectValue placeholder="Select driver" />
              </SelectTrigger>
              <SelectContent>
                {drivers.map((d) => (
                  <SelectItem key={d.id} value={d.id} disabled={d.status !== "available"}>
                    {d.name} {d.status !== "available" ? `(${d.status})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Vehicle (optional)</Label>
            <Select value={vehicleId} onValueChange={setVehicleId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">No preference</SelectItem>
                {vehicles
                  .filter((v) => v.status === "active")
                  .map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name} · {v.plate}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Price (INR)</Label>
            <Input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
          <Button
            type="button"
            onClick={submit}
            disabled={!driverId || (!guestKey && !manualGuestName.trim())}
          >
            Save trip
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DriverDialog({
  drivers: _drivers,
  initial,
  onSave,
  onRemove,
}: {
  drivers: TransportDriver[];
  initial?: TransportDriver;
  onSave: (row: TransportDriver) => void;
  onRemove: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [license, setLicense] = useState(initial?.license ?? "");
  const [rating, setRating] = useState(String(initial?.rating ?? 4.8));
  const [status, setStatus] = useState(initial?.status ?? "available");

  const openForEdit = () => {
    if (initial) {
      setName(initial.name);
      setPhone(initial.phone);
      setLicense(initial.license);
      setRating(String(initial.rating));
      setStatus(initial.status);
    }
    setOpen(true);
  };

  const openForCreate = () => {
    setName("");
    setPhone("");
    setLicense("");
    setRating("4.8");
    setStatus("available");
    setOpen(true);
  };

  const save = () => {
    onSave({
      id: initial?.id ?? `dr-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      license: license.trim(),
      rating: Math.min(5, Math.max(0, Number(rating) || 0)),
      status: status as TransportDriver["status"],
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {initial ? (
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={openForEdit}>
          <Pencil className="h-4 w-4" />
        </Button>
      ) : (
        <Button type="button" variant="outline" size="sm" className="gap-1" onClick={openForCreate}>
          <Plus className="h-3.5 w-3.5" /> Add driver
        </Button>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Edit driver" : "Add driver"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <Label>License</Label>
            <Input value={license} onChange={(e) => setLicense(e.target.value)} />
          </div>
          <div>
            <Label>Rating</Label>
            <Input value={rating} onChange={(e) => setRating(e.target.value)} />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DRIVER_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          {initial ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="gap-1"
              onClick={() => {
                onRemove(initial.id);
                setOpen(false);
              }}
            >
              <Trash2 className="h-4 w-4" /> Remove
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={save}>
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function VehicleDialog({
  vehicles: _vehicles,
  initial,
  onSave,
  onRemove,
}: {
  vehicles: TransportVehicle[];
  initial?: TransportVehicle;
  onSave: (row: TransportVehicle) => void;
  onRemove: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState(initial?.type ?? "Sedan");
  const [plate, setPlate] = useState(initial?.plate ?? "");
  const [capacity, setCapacity] = useState(String(initial?.capacity ?? 4));
  const [status, setStatus] = useState(initial?.status ?? "active");

  const openForEdit = () => {
    if (initial) {
      setName(initial.name);
      setType(initial.type);
      setPlate(initial.plate);
      setCapacity(String(initial.capacity));
      setStatus(initial.status);
    }
    setOpen(true);
  };

  const openForCreate = () => {
    setName("");
    setType("Sedan");
    setPlate("");
    setCapacity("4");
    setStatus("active");
    setOpen(true);
  };

  const save = () => {
    onSave({
      id: initial?.id ?? `v-${Date.now()}`,
      name: name.trim(),
      type,
      plate: plate.trim(),
      capacity: Math.max(1, Math.floor(Number(capacity) || 1)),
      status: status as TransportVehicle["status"],
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {initial ? (
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={openForEdit}>
          <Pencil className="h-4 w-4" />
        </Button>
      ) : (
        <Button type="button" variant="outline" size="sm" className="gap-1" onClick={openForCreate}>
          <Plus className="h-3.5 w-3.5" /> Add vehicle
        </Button>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Edit vehicle" : "Add vehicle"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2">
          <div>
            <Label>Model / label</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Body type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VEHICLE_BODY_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Registration</Label>
            <Input value={plate} onChange={(e) => setPlate(e.target.value)} />
          </div>
          <div>
            <Label>Capacity</Label>
            <Input value={capacity} onChange={(e) => setCapacity(e.target.value)} />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VEHICLE_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          {initial ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => {
                onRemove(initial.id);
                setOpen(false);
              }}
            >
              <Trash2 className="h-4 w-4" /> Remove
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={save}>
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TranslatorDialog({
  translators: _translators,
  initial,
  onSave,
  onRemove,
}: {
  translators: Translator[];
  initial?: Translator;
  onSave: (row: Translator) => void;
  onRemove: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initial?.name ?? "");
  const [langs, setLangs] = useState<Record<string, boolean>>(() => {
    const m: Record<string, boolean> = {};
    for (const l of TRANSLATOR_LANGUAGE_OPTIONS) {
      m[l] = initial ? initial.languages.includes(l) : false;
    }
    return m;
  });
  const [rating, setRating] = useState(String(initial?.rating ?? 4.8));
  const [rate, setRate] = useState(String(initial?.rateInrPerDay ?? 2800));
  const [status, setStatus] = useState(initial?.status ?? "available");

  const openForEdit = () => {
    if (initial) {
      setName(initial.name);
      const m: Record<string, boolean> = {};
      for (const l of TRANSLATOR_LANGUAGE_OPTIONS) m[l] = initial.languages.includes(l);
      setLangs(m);
      setRating(String(initial.rating));
      setRate(String(initial.rateInrPerDay));
      setStatus(initial.status);
    }
    setOpen(true);
  };

  const openForCreate = () => {
    setName("");
    const m: Record<string, boolean> = {};
    for (const l of TRANSLATOR_LANGUAGE_OPTIONS) m[l] = false;
    setLangs(m);
    setRating("4.8");
    setRate("2800");
    setStatus("available");
    setOpen(true);
  };

  const toggleLang = (l: string, v: boolean) => setLangs((prev) => ({ ...prev, [l]: v }));

  const save = () => {
    const languages = Object.entries(langs)
      .filter(([, on]) => on)
      .map(([l]) => l);
    if (languages.length === 0) {
      toast.error("Select at least one language");
      return;
    }
    onSave({
      id: initial?.id ?? `tl-${Date.now()}`,
      name: name.trim(),
      languages,
      rating: Math.min(5, Math.max(0, Number(rating) || 0)),
      rateInrPerDay: Math.max(0, Number(rate) || 0),
      status: status as Translator["status"],
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {initial ? (
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={openForEdit}>
          <Pencil className="h-4 w-4" />
        </Button>
      ) : (
        <Button type="button" variant="outline" size="sm" className="gap-1" onClick={openForCreate}>
          <Plus className="h-3.5 w-3.5" /> Add translator
        </Button>
      )}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit translator" : "Add translator"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Languages</Label>
            <div className="mt-2 grid max-h-40 gap-2 overflow-y-auto rounded-md border p-2">
              {TRANSLATOR_LANGUAGE_OPTIONS.map((l) => (
                <label key={l} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={!!langs[l]} onCheckedChange={(c) => toggleLang(l, c === true)} />
                  {l}
                </label>
              ))}
            </div>
          </div>
          <div>
            <Label>Rating</Label>
            <Input value={rating} onChange={(e) => setRating(e.target.value)} />
          </div>
          <div>
            <Label>Daily rate (INR)</Label>
            <Input value={rate} onChange={(e) => setRate(e.target.value)} />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRANSLATOR_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          {initial ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => {
                onRemove(initial.id);
                setOpen(false);
              }}
            >
              Remove
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={save}>
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function VendorDialog({
  vendors: _vendors,
  initial,
  onSave,
  onRemove,
}: {
  vendors: Vendor[];
  initial?: Vendor;
  onSave: (row: Vendor) => void;
  onRemove: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState(initial?.category ?? VENDOR_CATEGORIES[0]);
  const [contact, setContact] = useState(initial?.contact ?? "");
  const [active, setActive] = useState(initial?.active ?? true);

  const openForEdit = () => {
    if (initial) {
      setName(initial.name);
      setCategory(initial.category);
      setContact(initial.contact);
      setActive(initial.active);
    }
    setOpen(true);
  };

  const openForCreate = () => {
    setName("");
    setCategory(VENDOR_CATEGORIES[0]);
    setContact("");
    setActive(true);
    setOpen(true);
  };

  const save = () => {
    onSave({
      id: initial?.id ?? `vn-${Date.now()}`,
      name: name.trim(),
      category,
      contact: contact.trim(),
      active,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {initial ? (
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={openForEdit}>
          <Pencil className="h-4 w-4" />
        </Button>
      ) : (
        <Button type="button" variant="outline" size="sm" className="gap-1" onClick={openForCreate}>
          <Plus className="h-3.5 w-3.5" /> Add vendor
        </Button>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Edit vendor" : "Add vendor"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VENDOR_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Contact (email / phone)</Label>
            <Input value={contact} onChange={(e) => setContact(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={active} onCheckedChange={(c) => setActive(c === true)} />
            Active supplier
          </label>
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          {initial ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => {
                onRemove(initial.id);
                setOpen(false);
              }}
            >
              Remove
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={save}>
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
