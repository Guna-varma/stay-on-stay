import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BedDouble, CheckCircle, ClipboardList, Clock, LayoutGrid, LogOut, Sparkles, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  CheckoutQueueRecord,
  FrontdeskBookingRecord,
  HotelRecord,
  RoomAvailabilityRecord,
  RoomHoldRecord,
  RoomRecord,
  WalkInDraftQueueRecord,
} from "@/lib/supabase";
import type { ReceptionOperations } from "@/pages/reception/useReceptionState";
import { CheckInsPanel } from "@/pages/reception/panels/CheckInsPanel";
import { CheckOutsPanel } from "@/pages/reception/panels/CheckOutsPanel";
import { RoomGridPanel } from "@/pages/reception/panels/RoomGridPanel";
import { OpsServiceRequestsPanel } from "@/pages/reception/panels/OpsServiceRequestsPanel";
import { HousekeepingPanel } from "@/pages/reception/panels/HousekeepingPanel";
import { TransportPanel } from "@/pages/reception/panels/TransportPanel";
import type {
  CreateTripInput,
  HousekeepingTask,
  OpsServiceRequest,
  ReceptionCheckIn,
  TransportDriver,
  TransportTrip,
  TransportVehicle,
  Translator,
  Vendor,
} from "@/lib/operations-types";

export type HubTab = "checkins" | "checkouts" | "room-grid" | "services" | "housekeeping" | "transport";

interface Props {
  initialTab: HubTab;
  ops: ReceptionOperations;
  hotel: HotelRecord | null;
  rooms: RoomRecord[];
  frontdeskDrafts: WalkInDraftQueueRecord[];
  frontdeskBookings: FrontdeskBookingRecord[];
  frontdeskCheckoutQueue: CheckoutQueueRecord[];
  frontdeskRoomAvailability: RoomAvailabilityRecord[];
  frontdeskHousekeepingTasks: HousekeepingTask[];
  frontdeskServiceRequests: OpsServiceRequest[];
  frontdeskHolds: RoomHoldRecord[];
  transportTrips: TransportTrip[];
  transportDrivers: TransportDriver[];
  transportVehicles: TransportVehicle[];
  transportTranslators: Translator[];
  transportVendors: Vendor[];
  transportCheckins: ReceptionCheckIn[];
  transportKpi: { active: number; scheduled: number; drivers: number; vehicles: number };
  currentUserId: string | null;
  onNewWalkIn: () => void;
  onResumeDraft: (draftId: string, step?: "guest" | "room" | "documents" | "confirm") => void;
  onTakeOverDraft: (draftId: string) => void;
  onProcessCheckout: (bookingId: string) => void;
  onAdvanceHousekeepingTask: (taskId: string) => void;
  onResolveServiceRequest: (requestId: string) => void;
  onStartWalkInFromRoom: (room: RoomRecord) => void;
  onTransportStartTrip: (tripId: string) => void;
  onTransportCreateTrip: (input: CreateTripInput) => Promise<boolean>;
  onTransportCancelTrip: (tripId: string) => void;
  onTransportSaveDriver: (row: TransportDriver) => void;
  onTransportRemoveDriver: (id: string) => void;
  onTransportSaveVehicle: (row: TransportVehicle) => void;
  onTransportRemoveVehicle: (id: string) => void;
  onTransportSaveTranslator: (row: Translator) => void;
  onTransportRemoveTranslator: (id: string) => void;
  onTransportSaveVendor: (row: Vendor) => void;
  onTransportRemoveVendor: (id: string) => void;
  hasLiveHotel: boolean;
  frontdeskLoading: boolean;
}

export function ReceptionHub({
  initialTab,
  ops,
  hotel,
  rooms,
  frontdeskDrafts,
  frontdeskBookings,
  frontdeskCheckoutQueue,
  frontdeskRoomAvailability,
  frontdeskHousekeepingTasks,
  frontdeskServiceRequests,
  frontdeskHolds,
  transportTrips,
  transportDrivers,
  transportVehicles,
  transportTranslators,
  transportVendors,
  transportCheckins,
  transportKpi,
  currentUserId,
  onNewWalkIn,
  onResumeDraft,
  onTakeOverDraft,
  onProcessCheckout,
  onAdvanceHousekeepingTask,
  onResolveServiceRequest,
  onStartWalkInFromRoom,
  onTransportStartTrip,
  onTransportCreateTrip,
  onTransportCancelTrip,
  onTransportSaveDriver,
  onTransportRemoveDriver,
  onTransportSaveVehicle,
  onTransportRemoveVehicle,
  onTransportSaveTranslator,
  onTransportRemoveTranslator,
  onTransportSaveVendor,
  onTransportRemoveVendor,
  hasLiveHotel,
  frontdeskLoading,
}: Props) {
  const [tab, setTab] = useState<HubTab>(initialTab);
  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const availableLive = useMemo(() => {
    const now = Date.now();
    return rooms.filter((room) => {
      if (room.status !== "available") return false;
      return !frontdeskHolds.some(
        (hold) => hold.room_id === room.id && hold.status === "active" && new Date(hold.expires_at).getTime() > now,
      );
    }).length;
  }, [frontdeskHolds, rooms]);
  const availableRoomsDisplay = hasLiveHotel ? availableLive : ops.kpi.availableRoomsHint;

  const kpiCards = useMemo(
    () => [
      {
        label: "Today check-ins",
        value: frontdeskBookings.filter((booking) => booking.status === "checked_in").length,
        icon: CheckCircle,
        color: "text-emerald-600",
      },
      {
        label: "Today check-outs",
        value: frontdeskCheckoutQueue.length,
        icon: LogOut,
        color: "text-sky-600",
      },
      {
        label: "Pending verifications",
        value: frontdeskDrafts.filter((draft) => draft.document_status !== "complete").length,
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
    [availableRoomsDisplay, frontdeskBookings, frontdeskCheckoutQueue.length, frontdeskDrafts],
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
          {frontdeskLoading ? (
            <div className="rounded-xl border border-dashed border-border/60 px-4 py-6 text-sm text-muted-foreground">
              Loading walk-ins…
            </div>
          ) : (
            <CheckInsPanel
              drafts={frontdeskDrafts}
              bookings={frontdeskBookings}
              rooms={rooms}
              onNewWalkIn={onNewWalkIn}
              onResumeDraft={onResumeDraft}
              onTakeOverDraft={onTakeOverDraft}
            />
          )}
        </TabsContent>
        <TabsContent value="checkouts" className="mt-4">
          <CheckOutsPanel
            rows={frontdeskCheckoutQueue}
            onProcess={onProcessCheckout}
          />
        </TabsContent>
        <TabsContent value="room-grid" className="mt-4">
          <RoomGridPanel
            liveHotelName={hotel?.name ?? null}
            liveRooms={hasLiveHotel ? rooms : null}
            liveAvailability={frontdeskRoomAvailability}
            liveHolds={frontdeskHolds}
            currentUserId={currentUserId}
            onLiveRoomClick={hasLiveHotel ? onStartWalkInFromRoom : undefined}
          />
        </TabsContent>
        <TabsContent value="services" className="mt-4">
          <OpsServiceRequestsPanel rows={frontdeskServiceRequests} onResolve={onResolveServiceRequest} />
        </TabsContent>
        <TabsContent value="housekeeping" className="mt-4">
          <HousekeepingPanel
            tasks={frontdeskHousekeepingTasks}
            kpi={{
              pending: frontdeskHousekeepingTasks.filter((task) => task.status === "pending").length,
              inProgress: frontdeskHousekeepingTasks.filter((task) => task.status === "in_progress").length,
              completed: frontdeskHousekeepingTasks.filter((task) => task.status === "completed").length,
              urgent: frontdeskHousekeepingTasks.filter((task) => task.status === "urgent").length,
            }}
            roomAvailability={frontdeskRoomAvailability}
            rooms={rooms}
            hotelName={hotel?.name ?? null}
            onAdvanceTask={onAdvanceHousekeepingTask}
          />
        </TabsContent>
        <TabsContent value="transport" className="mt-4">
          <TransportPanel
            trips={transportTrips}
            drivers={transportDrivers}
            vehicles={transportVehicles}
            translators={transportTranslators}
            vendors={transportVendors}
            checkins={transportCheckins}
            kpi={transportKpi}
            onStartTrip={onTransportStartTrip}
            onCreateTrip={onTransportCreateTrip}
            onCancelTrip={onTransportCancelTrip}
            onSaveDriver={onTransportSaveDriver}
            onRemoveDriver={onTransportRemoveDriver}
            onSaveVehicle={onTransportSaveVehicle}
            onRemoveVehicle={onTransportRemoveVehicle}
            onSaveTranslator={onTransportSaveTranslator}
            onRemoveTranslator={onTransportRemoveTranslator}
            onSaveVendor={onTransportSaveVendor}
            onRemoveVendor={onTransportRemoveVendor}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
