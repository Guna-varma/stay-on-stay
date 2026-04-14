import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import {
  getWalkInDraftById,
  getManagerAssignedHotel,
  isSupabaseConfigured,
  listHotelsForOwner,
  listRoomsByHotel,
  processCheckout,
  resolveServiceRequest,
  supabase,
  takeOverWalkInDraft,
  updateTaskStatusViaRpc,
  type HotelRecord,
  type RoomRecord,
  type WalkInDraftRecord,
} from "@/lib/supabase";
import { useReceptionState } from "@/pages/reception/useReceptionState";
import { useFrontdeskWalkins } from "@/pages/reception/useFrontdeskWalkins";
import { useFrontdeskTransport } from "@/pages/reception/useFrontdeskTransport";
import { ReceptionHub, type HubTab } from "@/pages/reception/ReceptionHub";
import { VerificationsPanel } from "@/pages/reception/panels/VerificationsPanel";
import { StaffPanel } from "@/pages/reception/panels/StaffPanel";
import { ReportsPanel } from "@/pages/reception/panels/ReportsPanel";
import { WalkInCheckInSheet } from "@/pages/reception/panels/WalkInCheckInSheet";
import type { ReceptionCheckIn } from "@/lib/operations-types";

function pathToHubTab(pathname: string): HubTab {
  if (pathname === "/checkin") return "checkins";
  if (pathname === "/rooms") return "room-grid";
  if (pathname === "/services") return "services";
  if (pathname === "/transport") return "transport";
  return "checkins";
}

export default function ReceptionDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const pathname = location.pathname;
  const hasSupabase = isSupabaseConfigured();
  const ops = useReceptionState();

  const [loading, setLoading] = useState(true);
  const [hotel, setHotel] = useState<HotelRecord | null>(null);
  const [rooms, setRooms] = useState<RoomRecord[]>([]);
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [activeDraft, setActiveDraft] = useState<WalkInDraftRecord | null>(null);
  const [walkInInitialStep, setWalkInInitialStep] = useState<"guest" | "room" | "documents" | "confirm">("guest");
  const [walkInInitialRoomId, setWalkInInitialRoomId] = useState<string | null>(null);

  const refreshHotelRooms = useCallback(async () => {
    if (!user?.id || !hasSupabase) {
      setHotel(null);
      setRooms([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    let activeHotel: HotelRecord | null = null;

    const assigned = await getManagerAssignedHotel(user.id);
    if (assigned.error) {
      toast.error(assigned.error.message || "Failed to load assigned hotel");
      setLoading(false);
      return;
    }
    if (assigned.data) {
      activeHotel = assigned.data;
    } else if (user.role === "owner") {
      const ownerHotels = await listHotelsForOwner(user.id);
      if (ownerHotels.error) {
        toast.error(ownerHotels.error.message || "Failed to load owner hotels");
        setLoading(false);
        return;
      }
      activeHotel = ownerHotels.data[0] ?? null;
    }

    if (!activeHotel) {
      setHotel(null);
      setRooms([]);
      setLoading(false);
      return;
    }

    setHotel(activeHotel);
    const roomRes = await listRoomsByHotel(activeHotel.id);
    if (roomRes.error) {
      toast.error(roomRes.error.message || "Failed to load rooms");
      setRooms([]);
    } else {
      setRooms(roomRes.data);
    }
    setLoading(false);
  }, [user?.id, hasSupabase]);

  useEffect(() => {
    refreshHotelRooms();
  }, [refreshHotelRooms]);

  const frontdesk = useFrontdeskWalkins(hotel?.id ?? null);
  const transportCheckins = useMemo<ReceptionCheckIn[]>(
    () =>
      frontdesk.bookings.map((booking) => ({
        id: booking.id,
        bookingRef: booking.booking_code ?? booking.id.slice(0, 8),
        guestName: [booking.guest?.first_name, booking.guest?.last_name].filter(Boolean).join(" ").trim() || "Guest",
        country: booking.guest?.nationality ?? "Unknown",
        passportMasked: booking.guest?.passport_number
          ? booking.guest.passport_number.replace(/.(?=.{4})/g, "*")
          : "N/A",
        roomLabel: booking.room?.room_number ?? "Room pending",
        status: booking.status,
      })),
    [frontdesk.bookings],
  );
  const transport = useFrontdeskTransport(hotel?.id ?? null, user?.id ?? null);

  useEffect(() => {
    if (!hotel?.id) return;
    const channel = supabase
      .channel(`reception-rooms-${hotel.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms", filter: `hotel_id=eq.${hotel.id}` }, () => {
        void refreshHotelRooms();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [hotel?.id, refreshHotelRooms]);

  const openNewWalkIn = useCallback((roomId?: string | null) => {
    setActiveDraftId(null);
    setActiveDraft(null);
    setWalkInInitialRoomId(roomId ?? null);
    setWalkInInitialStep(roomId ? "room" : "guest");
    setWalkInOpen(true);
  }, []);

  const openExistingDraft = useCallback(async (draftId: string, step: "guest" | "room" | "documents" | "confirm" = "guest") => {
    const result = await getWalkInDraftById(draftId);
    if (result.error || !result.data) {
      toast.error(result.error?.message || "Unable to open this walk-in draft");
      return;
    }
    setActiveDraftId(draftId);
    setActiveDraft(result.data);
    setWalkInInitialStep(step);
    setWalkInInitialRoomId(null);
    setWalkInOpen(true);
  }, []);

  const handleTakeOverDraft = useCallback(async (draftId: string) => {
    const takeover = await takeOverWalkInDraft(draftId);
    if (takeover.error) {
      toast.error(takeover.error.message || "Unable to take over this draft");
      return;
    }
    toast.success("Draft assigned to you");
    await frontdesk.refresh();
    await openExistingDraft(draftId, "guest");
  }, [frontdesk, openExistingDraft]);

  const handleWalkInCompleted = useCallback(async () => {
    await Promise.all([refreshHotelRooms(), frontdesk.refresh()]);
    setActiveDraft(null);
    setActiveDraftId(null);
  }, [frontdesk, refreshHotelRooms]);

  const handleProcessCheckout = useCallback(
    async (bookingId: string) => {
      const result = await processCheckout(bookingId, { markRoomDirty: true });
      if (result.error) {
        toast.error(result.error.message || "Failed to process checkout");
        return;
      }
      if (result.data?.result_type === "already_checked_out") {
        toast.message("Checkout already processed for this booking");
      } else {
        toast.success("Checkout processed and turnover task created");
      }
      await Promise.all([refreshHotelRooms(), frontdesk.refresh()]);
    },
    [frontdesk, refreshHotelRooms],
  );

  const handleAdvanceHousekeepingTask = useCallback(
    async (taskId: string) => {
      const row = frontdesk.housekeepingTasks.find((task) => task.id === taskId);
      if (!row) return;
      const nextStatus =
        row.status === "pending" || row.status === "urgent"
          ? "in_progress"
          : row.status === "in_progress"
            ? "completed"
            : "pending";
      const updated = await updateTaskStatusViaRpc(taskId, nextStatus, "Updated from reception housekeeping tab");
      if (updated.error) {
        toast.error(updated.error.message || "Failed to update housekeeping task");
        return;
      }
      toast.success("Housekeeping task updated");
      await frontdesk.refresh();
    },
    [frontdesk],
  );

  const handleResolveServiceRequest = useCallback(
    async (requestId: string) => {
      const result = await resolveServiceRequest(requestId);
      if (result.error) {
        toast.error(result.error.message || "Failed to resolve service request");
        return;
      }
      toast.success("Service request resolved");
      await frontdesk.refresh();
    },
    [frontdesk],
  );

  const hubTab = useMemo(() => pathToHubTab(pathname), [pathname]);
  const hasLiveHotel = Boolean(hotel && rooms.length > 0);
  const handleSheetOpenChange = useCallback((nextOpen: boolean) => {
    setWalkInOpen(nextOpen);
    if (!nextOpen) {
      setActiveDraft(null);
      setActiveDraftId(null);
      setWalkInInitialRoomId(null);
    }
  }, []);

  if (!hasSupabase) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-heading font-bold">Operations</h1>
        <p className="text-sm text-muted-foreground">
          Connect Supabase to load assigned property and live room status. Demo data still visible in UI when
          configured.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-heading font-bold">Operations</h1>
        <p className="text-sm text-muted-foreground">Loading property…</p>
      </div>
    );
  }

  if (pathname === "/verifications") {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-heading font-bold">Verifications</h1>
        <VerificationsPanel rows={ops.verifications} onApprove={ops.approveVerification} />
      </div>
    );
  }

  if (pathname === "/staff") {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-heading font-bold">Staff assignment</h1>
        <StaffPanel />
      </div>
    );
  }

  if (pathname === "/reports") {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-heading font-bold">Reports</h1>
        <ReportsPanel />
      </div>
    );
  }

  return (
    <>
      <ReceptionHub
        initialTab={hubTab}
        ops={ops}
        hotel={hotel}
        rooms={rooms}
        frontdeskDrafts={frontdesk.drafts}
        frontdeskBookings={frontdesk.bookings}
        frontdeskCheckoutQueue={frontdesk.checkoutQueue}
        frontdeskRoomAvailability={frontdesk.roomAvailability}
        frontdeskHousekeepingTasks={frontdesk.housekeepingTasks}
        frontdeskServiceRequests={frontdesk.serviceRequests}
        frontdeskHolds={frontdesk.holds}
        currentUserId={user?.id ?? null}
        onNewWalkIn={() => openNewWalkIn()}
        onResumeDraft={(draftId, step) => void openExistingDraft(draftId, step)}
        onTakeOverDraft={(draftId) => void handleTakeOverDraft(draftId)}
        onProcessCheckout={(bookingId) => void handleProcessCheckout(bookingId)}
        onAdvanceHousekeepingTask={(taskId) => void handleAdvanceHousekeepingTask(taskId)}
        onResolveServiceRequest={(requestId) => void handleResolveServiceRequest(requestId)}
        onStartWalkInFromRoom={(room) => openNewWalkIn(room.id)}
        hasLiveHotel={hasLiveHotel}
        frontdeskLoading={frontdesk.loading}
        transportTrips={transport.trips}
        transportDrivers={transport.drivers}
        transportVehicles={transport.vehicles}
        transportTranslators={transport.translators}
        transportVendors={transport.vendors}
        transportCheckins={transportCheckins}
        transportKpi={transport.kpi}
        onTransportStartTrip={(tripId) => void transport.startTrip(tripId)}
        onTransportCreateTrip={(input) => transport.createTrip(input)}
        onTransportCancelTrip={(tripId) => void transport.cancelTrip(tripId)}
        onTransportSaveDriver={(row) => void transport.upsertDriver(row)}
        onTransportRemoveDriver={(id) => void transport.removeDriver(id)}
        onTransportSaveVehicle={(row) => void transport.upsertVehicle(row)}
        onTransportRemoveVehicle={(id) => void transport.removeVehicle(id)}
        onTransportSaveTranslator={(row) => void transport.upsertTranslator(row)}
        onTransportRemoveTranslator={(id) => void transport.removeTranslator(id)}
        onTransportSaveVendor={(row) => void transport.upsertVendor(row)}
        onTransportRemoveVendor={(id) => void transport.removeVendor(id)}
      />
      {hotel && user?.id ? (
        <WalkInCheckInSheet
          open={walkInOpen}
          onOpenChange={handleSheetOpenChange}
          hotel={hotel}
          userId={user.id}
          rooms={rooms}
          holds={frontdesk.holds}
          existingDraft={activeDraft}
          initialRoomId={walkInInitialRoomId}
          initialStep={walkInInitialStep}
          onCompleted={handleWalkInCompleted}
        />
      ) : null}
    </>
  );
}
