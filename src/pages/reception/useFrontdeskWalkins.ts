import { useCallback, useEffect, useState } from "react";
import {
  listCheckoutQueueForHotel,
  listFrontdeskBookingsForHotel,
  listFrontdeskDraftQueue,
  listRoomAvailabilityForHotel,
  listRoomHoldsForHotel,
  listServiceRequestsForHotel,
  listTasks,
  supabase,
  type CheckoutQueueRecord,
  type FrontdeskBookingRecord,
  type RoomAvailabilityRecord,
  type RoomHoldRecord,
  type ServiceRequest,
  type Task,
  type WalkInDraftQueueRecord,
} from "@/lib/supabase";
import { toast } from "sonner";
import type { HousekeepingTask, OpsServiceRequest } from "@/lib/operations-types";

interface FrontdeskWalkinsState {
  drafts: WalkInDraftQueueRecord[];
  holds: RoomHoldRecord[];
  bookings: FrontdeskBookingRecord[];
  checkoutQueue: CheckoutQueueRecord[];
  roomAvailability: RoomAvailabilityRecord[];
  housekeepingTasks: HousekeepingTask[];
  serviceRequests: OpsServiceRequest[];
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useFrontdeskWalkins(hotelId: string | null): FrontdeskWalkinsState {
  const [drafts, setDrafts] = useState<WalkInDraftQueueRecord[]>([]);
  const [holds, setHolds] = useState<RoomHoldRecord[]>([]);
  const [bookings, setBookings] = useState<FrontdeskBookingRecord[]>([]);
  const [checkoutQueue, setCheckoutQueue] = useState<CheckoutQueueRecord[]>([]);
  const [roomAvailability, setRoomAvailability] = useState<RoomAvailabilityRecord[]>([]);
  const [housekeepingTasks, setHousekeepingTasks] = useState<HousekeepingTask[]>([]);
  const [serviceRequests, setServiceRequests] = useState<OpsServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const mapTaskToHousekeeping = (task: Task): HousekeepingTask | null => {
    if (task.type !== "room_cleaning" && task.type !== "housekeeping") return null;
    const mappedStatus: HousekeepingTask["status"] =
      task.priority === "urgent" && task.status !== "completed"
        ? "urgent"
        : task.status === "in_progress"
          ? "in_progress"
          : task.status === "completed"
            ? "completed"
            : "pending";
    return {
      id: task.id,
      title: task.description?.trim() || "Cleaning task",
      roomLabel: task.room?.room_number ?? "Room pending",
      status: mappedStatus,
      assignee: task.staff?.name,
    };
  };

  const mapServiceRequest = (row: ServiceRequest): OpsServiceRequest => ({
    id: row.id,
    category: row.type === "maintenance" ? "Maintenance" : row.type === "driver" ? "Transport" : "Housekeeping",
    priority: row.priority === "urgent" || row.priority === "high" ? "high" : row.priority === "low" ? "low" : "medium",
    title: row.description,
    roomLabel: row.room?.room_number ?? "Room pending",
    guestName:
      row.booking?.guest
        ? [row.booking.guest.first_name, row.booking.guest.last_name].filter(Boolean).join(" ").trim() || "Guest"
        : "Guest",
    resolved: row.status === "completed",
  });

  const refresh = useCallback(async () => {
    if (!hotelId) {
      setDrafts([]);
      setHolds([]);
      setBookings([]);
      setCheckoutQueue([]);
      setRoomAvailability([]);
      setHousekeepingTasks([]);
      setServiceRequests([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const [draftRes, holdRes, bookingRes, checkoutRes, availabilityRes, tasksRes, servicesRes] = await Promise.all([
      listFrontdeskDraftQueue(hotelId),
      listRoomHoldsForHotel(hotelId),
      listFrontdeskBookingsForHotel(hotelId),
      listCheckoutQueueForHotel(hotelId),
      listRoomAvailabilityForHotel(hotelId),
      listTasks(hotelId),
      listServiceRequestsForHotel(hotelId),
    ]);

    if (draftRes.error) toast.error(draftRes.error.message || "Failed to load walk-in drafts");
    if (holdRes.error) toast.error(holdRes.error.message || "Failed to load room holds");
    if (bookingRes.error) toast.error(bookingRes.error.message || "Failed to load front-desk bookings");
    if (checkoutRes.error) toast.error(checkoutRes.error.message || "Failed to load checkout queue");
    if (availabilityRes.error) toast.error(availabilityRes.error.message || "Failed to load room availability");
    if (tasksRes.error) toast.error(tasksRes.error.message || "Failed to load housekeeping tasks");
    if (servicesRes.error) toast.error(servicesRes.error.message || "Failed to load service requests");

    setDrafts(draftRes.data);
    setHolds(holdRes.data);
    setBookings(bookingRes.data);
    setCheckoutQueue(checkoutRes.data);
    setRoomAvailability(availabilityRes.data);
    setHousekeepingTasks(tasksRes.data.map(mapTaskToHousekeeping).filter((row): row is HousekeepingTask => row !== null));
    setServiceRequests(servicesRes.data.map(mapServiceRequest));
    setLoading(false);
  }, [hotelId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!hotelId) return;
    const timer = window.setInterval(() => {
      void refresh();
    }, 15000);
    return () => {
      window.clearInterval(timer);
    };
  }, [hotelId, refresh]);

  useEffect(() => {
    if (!hotelId) return;

    const refreshSilently = () => {
      void refresh();
    };

    const channel = supabase
      .channel(`frontdesk-walkins-${hotelId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms", filter: `hotel_id=eq.${hotelId}` }, refreshSilently)
      .on("postgres_changes", { event: "*", schema: "public", table: "room_blocks", filter: `property_id=eq.${hotelId}` }, refreshSilently)
      .on("postgres_changes", { event: "*", schema: "public", table: "room_holds", filter: `hotel_id=eq.${hotelId}` }, refreshSilently)
      .on("postgres_changes", { event: "*", schema: "public", table: "walkin_checkin_drafts", filter: `hotel_id=eq.${hotelId}` }, refreshSilently)
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings", filter: `hotel_id=eq.${hotelId}` }, refreshSilently)
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks", filter: `hotel_id=eq.${hotelId}` }, refreshSilently)
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [hotelId, refresh]);

  return {
    drafts,
    holds,
    bookings,
    checkoutQueue,
    roomAvailability,
    housekeepingTasks,
    serviceRequests,
    loading,
    refresh,
  };
}
