import { useCallback, useMemo, useState } from "react";
import {
  SEED_CHECKINS,
  SEED_CHECKOUTS,
  SEED_DRIVERS,
  SEED_HK_TASKS,
  SEED_SERVICE_REQUESTS,
  SEED_TRIPS,
  SEED_VERIFICATIONS,
} from "@/data/operations-seed";
import type {
  ReceptionCheckIn,
  ReceptionCheckOut,
  OpsServiceRequest,
  TransportTrip,
  TransportDriver,
  VerificationQueueItem,
  HousekeepingTask,
} from "@/lib/operations-types";
import { toast } from "sonner";

export function useReceptionState() {
  const [checkins, setCheckins] = useState<ReceptionCheckIn[]>(() => [...SEED_CHECKINS]);
  const [checkouts, setCheckouts] = useState<ReceptionCheckOut[]>(() => [...SEED_CHECKOUTS]);
  const [services, setServices] = useState<OpsServiceRequest[]>(() => [...SEED_SERVICE_REQUESTS]);
  const [trips, setTrips] = useState<TransportTrip[]>(() => [...SEED_TRIPS]);
  const [drivers, setDrivers] = useState<TransportDriver[]>(() => [...SEED_DRIVERS]);
  const [hkTasks, setHkTasks] = useState<HousekeepingTask[]>(() => [...SEED_HK_TASKS]);
  const [verifications, setVerifications] = useState<VerificationQueueItem[]>(() => [...SEED_VERIFICATIONS]);

  const checkInGuest = useCallback((id: string) => {
    setCheckins((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "checked_in" as const } : c)),
    );
    toast.success("Guest checked in");
  }, []);

  const verifyGuest = useCallback((id: string) => {
    toast.success("Verification recorded (demo)");
    void id;
  }, []);

  const processCheckout = useCallback((id: string) => {
    const row = checkouts.find((c) => c.id === id);
    setCheckouts((prev) => prev.filter((c) => c.id !== id));
    if (row) {
      setCheckins((prev) => prev.filter((c) => c.guestName !== row.guestName));
    }
    toast.success("Check-out processed");
  }, [checkouts]);

  const resolveService = useCallback((id: string) => {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, resolved: true } : s)));
    toast.success("Request marked resolved");
  }, []);

  const startTrip = useCallback((id: string) => {
    let driverName: string | undefined;
    setTrips((prev) => {
      const trip = prev.find((t) => t.id === id);
      driverName = trip?.driverName;
      return prev.map((t) => (t.id === id ? { ...t, status: "active" as const } : t));
    });
    if (driverName) {
      setDrivers((prev) =>
        prev.map((d) => (d.name === driverName ? { ...d, status: "on_trip" as const } : d)),
      );
    }
    toast.success("Trip started");
  }, []);

  const approveVerification = useCallback((id: string) => {
    setVerifications((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status: "approved" as const } : v)),
    );
    toast.success("Verification approved");
  }, []);

  const advanceHkTask = useCallback((id: string) => {
    const order: HousekeepingTask["status"][] = ["pending", "in_progress", "completed", "urgent"];
    setHkTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const i = order.indexOf(t.status);
        const next = order[(i + 1) % order.length];
        return { ...t, status: next };
      }),
    );
    toast.message("Task status updated (cycle demo)");
  }, []);

  const kpi = useMemo(() => {
    const todayOut = checkouts.length;
    const pendingV = verifications.filter((v) => v.status === "pending").length;
    const openServices = services.filter((s) => !s.resolved).length;
    return {
      todayCheckIns: checkins.length,
      todayCheckOuts: todayOut,
      pendingVerifications: pendingV,
      /** Placeholder total when no live room count — overridden in UI */
      availableRoomsHint: 35,
      openServiceRequests: openServices,
      activeTrips: trips.filter((t) => t.status === "active").length,
      scheduledTrips: trips.filter((t) => t.status === "scheduled").length,
      availableDrivers: drivers.filter((d) => d.status === "available").length,
      activeVehicles: 4,
      hkPending: hkTasks.filter((t) => t.status === "pending").length,
      hkProgress: hkTasks.filter((t) => t.status === "in_progress").length,
      hkDone: hkTasks.filter((t) => t.status === "completed").length,
      hkUrgent: hkTasks.filter((t) => t.status === "urgent").length,
    };
  }, [checkins, checkouts, verifications, services, trips, drivers, hkTasks]);

  return {
    checkins,
    checkouts,
    services,
    trips,
    drivers,
    hkTasks,
    verifications,
    kpi,
    checkInGuest,
    verifyGuest,
    processCheckout,
    resolveService,
    startTrip,
    approveVerification,
    advanceHkTask,
  };
}

export type ReceptionOperations = ReturnType<typeof useReceptionState>;
