import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BedDouble, CheckCircle, ClipboardList, Clock, LayoutGrid, LogOut, Sparkles, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HotelRecord, RoomRecord } from "@/lib/supabase";
import type { ReceptionOperations } from "@/pages/reception/useReceptionState";
import { CheckInsPanel } from "@/pages/reception/panels/CheckInsPanel";
import { CheckOutsPanel } from "@/pages/reception/panels/CheckOutsPanel";
import { RoomGridPanel } from "@/pages/reception/panels/RoomGridPanel";
import { OpsServiceRequestsPanel } from "@/pages/reception/panels/OpsServiceRequestsPanel";
import { HousekeepingPanel } from "@/pages/reception/panels/HousekeepingPanel";
import { TransportPanel } from "@/pages/reception/panels/TransportPanel";

export type HubTab = "checkins" | "checkouts" | "room-grid" | "services" | "housekeeping" | "transport";

interface Props {
  initialTab: HubTab;
  ops: ReceptionOperations;
  hotel: HotelRecord | null;
  rooms: RoomRecord[];
  hasLiveHotel: boolean;
  savingRoomId: string | null;
  onCycleRoom: (room: RoomRecord) => void;
}

export function ReceptionHub({
  initialTab,
  ops,
  hotel,
  rooms,
  hasLiveHotel,
  savingRoomId,
  onCycleRoom,
}: Props) {
  const [tab, setTab] = useState<HubTab>(initialTab);
  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const availableLive = useMemo(() => rooms.filter((r) => r.status === "available").length, [rooms]);
  const availableRoomsDisplay = hasLiveHotel ? availableLive : ops.kpi.availableRoomsHint;

  const kpiCards = useMemo(
    () => [
      {
        label: "Today check-ins",
        value: ops.kpi.todayCheckIns,
        icon: CheckCircle,
        color: "text-emerald-600",
      },
      {
        label: "Today check-outs",
        value: ops.kpi.todayCheckOuts,
        icon: LogOut,
        color: "text-sky-600",
      },
      {
        label: "Pending verifications",
        value: ops.kpi.pendingVerifications,
        icon: Clock,
        color: "text-amber-600",
      },
      {
        label: "Available rooms",
        value: availableRoomsDisplay,
        icon: BedDouble,
        color: "text-primary",
      },
    ],
    [ops.kpi, availableRoomsDisplay],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold tracking-tight text-foreground">Reception dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Operations hub — check-ins, rooms, requests, housekeeping, and transport. Live room tiles sync when a hotel
          is assigned to your manager account.
        </p>
        {hotel ? (
          <p className="mt-1 text-xs font-medium text-primary">Assigned property: {hotel.name}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpiCards.map((k) => (
          <Card key={k.label} className="border-border/60 shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg bg-muted", k.color)}>
                <k.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{k.value}</p>
                <p className="text-xs text-muted-foreground">{k.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as HubTab)} className="w-full">
        <TabsList className="flex h-auto min-h-11 w-full flex-wrap justify-start gap-1 rounded-xl bg-muted/50 p-1">
          <TabsTrigger value="checkins" className="gap-1.5 rounded-lg text-xs sm:text-sm">
            <CheckCircle className="h-3.5 w-3.5" />
            Check-ins
          </TabsTrigger>
          <TabsTrigger value="checkouts" className="gap-1.5 rounded-lg text-xs sm:text-sm">
            <LogOut className="h-3.5 w-3.5" />
            Check-outs
          </TabsTrigger>
          <TabsTrigger value="room-grid" className="gap-1.5 rounded-lg text-xs sm:text-sm">
            <LayoutGrid className="h-3.5 w-3.5" />
            Room grid
          </TabsTrigger>
          <TabsTrigger value="services" className="gap-1.5 rounded-lg text-xs sm:text-sm">
            <ClipboardList className="h-3.5 w-3.5" />
            Service requests
          </TabsTrigger>
          <TabsTrigger value="housekeeping" className="gap-1.5 rounded-lg text-xs sm:text-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Housekeeping
          </TabsTrigger>
          <TabsTrigger value="transport" className="gap-1.5 rounded-lg text-xs sm:text-sm">
            <Truck className="h-3.5 w-3.5" />
            Transport
          </TabsTrigger>
        </TabsList>

        <TabsContent value="checkins" className="mt-4">
          <CheckInsPanel rows={ops.checkins} onVerify={ops.verifyGuest} onCheckIn={ops.checkInGuest} />
        </TabsContent>
        <TabsContent value="checkouts" className="mt-4">
          <CheckOutsPanel rows={ops.checkouts} onProcess={ops.processCheckout} />
        </TabsContent>
        <TabsContent value="room-grid" className="mt-4">
          <RoomGridPanel
            liveHotelName={hotel?.name ?? null}
            liveRooms={hasLiveHotel ? rooms : null}
            onLiveRoomClick={hasLiveHotel ? onCycleRoom : undefined}
            liveSavingId={savingRoomId}
          />
        </TabsContent>
        <TabsContent value="services" className="mt-4">
          <OpsServiceRequestsPanel rows={ops.services} onResolve={ops.resolveService} />
        </TabsContent>
        <TabsContent value="housekeeping" className="mt-4">
          <HousekeepingPanel
            tasks={ops.hkTasks}
            kpi={{
              pending: ops.kpi.hkPending,
              inProgress: ops.kpi.hkProgress,
              completed: ops.kpi.hkDone,
              urgent: ops.kpi.hkUrgent,
            }}
            onAdvanceTask={ops.advanceHkTask}
          />
        </TabsContent>
        <TabsContent value="transport" className="mt-4">
          <TransportPanel
            trips={ops.trips}
            drivers={ops.drivers}
            kpi={{
              active: ops.kpi.activeTrips,
              scheduled: ops.kpi.scheduledTrips,
              drivers: ops.kpi.availableDrivers,
              vehicles: ops.kpi.activeVehicles,
            }}
            onStartTrip={ops.startTrip}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
