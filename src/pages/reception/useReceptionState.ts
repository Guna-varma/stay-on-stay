import { useCallback, useMemo, useState } from "react";
import {
  SEED_CHECKINS,
  SEED_CHECKOUTS,
  SEED_DRIVERS,
  SEED_HK_TASKS,
  SEED_SERVICE_REQUESTS,
  SEED_TRIPS,
  SEED_TRANSLATORS,
  SEED_VEHICLES,
  SEED_VENDORS,
  SEED_VERIFICATIONS,
} from "@/data/operations-seed";
import type {
  CreateTripInput,
  ReceptionCheckIn,
  ReceptionCheckOut,
  OpsServiceRequest,
  TransportTrip,
  TransportDriver,
  TransportVehicle,
  Translator,
  Vendor,
  VerificationQueueItem,
  HousekeepingTask,
} from "@/lib/operations-types";
import { toast } from "sonner";

function newId(prefix: string) {
  return `${prefix}-${typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Date.now()}`;
}

export function useReceptionState() {
  const [checkins, setCheckins] = useState<ReceptionCheckIn[]>(() => [...SEED_CHECKINS]);
  const [checkouts, setCheckouts] = useState<ReceptionCheckOut[]>(() => [...SEED_CHECKOUTS]);
  const [services, setServices] = useState<OpsServiceRequest[]>(() => [...SEED_SERVICE_REQUESTS]);
  const [trips, setTrips] = useState<TransportTrip[]>(() => [...SEED_TRIPS]);
  const [drivers, setDrivers] = useState<TransportDriver[]>(() => [...SEED_DRIVERS]);
  const [vehicles, setVehicles] = useState<TransportVehicle[]>(() => [...SEED_VEHICLES]);
  const [translators, setTranslators] = useState<Translator[]>(() => [...SEED_TRANSLATORS]);
  const [vendors, setVendors] = useState<Vendor[]>(() => [...SEED_VENDORS]);
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
    const trip = trips.find((t) => t.id === id);
    if (!trip || trip.status !== "scheduled") {
      toast.error("Only a scheduled trip can be started");
      return;
    }
    const matchId = trip.driverId;
    const matchName = trip.driverName;
    setTrips((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "active" as const } : t)),
    );
    setDrivers((dprev) =>
      dprev.map((d) => {
        const isDriver =
          (matchId && d.id === matchId) || (!matchId && d.name === matchName);
        return isDriver ? { ...d, status: "on_trip" as const } : d;
      }),
    );
    toast.success("Trip started");
  }, [trips]);

  const createTrip = useCallback(
    (input: CreateTripInput) => {
      const driver = drivers.find((d) => d.id === input.driverId);
      if (!driver) {
        toast.error("Select a valid driver");
        return;
      }
      if (driver.status !== "available") {
        toast.error("Choose an available driver, or mark another trip complete first");
        return;
      }
      const row: TransportTrip = {
        id: newId("tr"),
        type: input.type,
        status: "scheduled",
        guestName: input.guestName.trim(),
        route: input.route.trim(),
        scheduledAt: input.scheduledAt,
        driverName: driver.name,
        driverId: driver.id,
        vehicleId: input.vehicleId,
        checkInRef: input.checkInRef,
        roomLabel: input.roomLabel?.trim() || undefined,
        priceInr: Math.max(0, input.priceInr),
      };
      setTrips((prev) => [...prev, row]);
      toast.success("Trip scheduled and assigned");
    },
    [drivers],
  );

  const cancelTrip = useCallback((id: string) => {
    setTrips((prev) =>
      prev.map((t) => (t.id === id && t.status === "scheduled" ? { ...t, status: "cancelled" as const } : t)),
    );
    toast.message("Trip cancelled");
  }, []);

  const upsertDriver = useCallback((row: TransportDriver) => {
    setDrivers((prev) => {
      const i = prev.findIndex((d) => d.id === row.id);
      if (i === -1) return [...prev, row];
      const next = [...prev];
      next[i] = row;
      return next;
    });
    toast.success("Driver saved");
  }, []);

  const removeDriver = useCallback((id: string) => {
    const d = drivers.find((x) => x.id === id);
    const busy = trips.some(
      (t) =>
        (t.driverId === id || (d && t.driverName === d.name)) &&
        (t.status === "scheduled" || t.status === "active"),
    );
    if (busy) {
      toast.error("Complete or cancel active trips for this driver first");
      return;
    }
    setDrivers((prev) => prev.filter((x) => x.id !== id));
    toast.success("Driver removed");
  }, [trips, drivers]);

  const upsertVehicle = useCallback((row: TransportVehicle) => {
    setVehicles((prev) => {
      const i = prev.findIndex((v) => v.id === row.id);
      if (i === -1) return [...prev, row];
      const next = [...prev];
      next[i] = row;
      return next;
    });
    toast.success("Vehicle saved");
  }, []);

  const removeVehicle = useCallback((id: string) => {
    setVehicles((prev) => prev.filter((v) => v.id !== id));
    toast.success("Vehicle removed");
  }, []);

  const upsertTranslator = useCallback((row: Translator) => {
    setTranslators((prev) => {
      const i = prev.findIndex((t) => t.id === row.id);
      if (i === -1) return [...prev, row];
      const next = [...prev];
      next[i] = row;
      return next;
    });
    toast.success("Translator saved");
  }, []);

  const removeTranslator = useCallback((id: string) => {
    setTranslators((prev) => prev.filter((t) => t.id !== id));
    toast.success("Translator removed");
  }, []);

  const upsertVendor = useCallback((row: Vendor) => {
    setVendors((prev) => {
      const i = prev.findIndex((v) => v.id === row.id);
      if (i === -1) return [...prev, row];
      const next = [...prev];
      next[i] = row;
      return next;
    });
    toast.success("Vendor saved");
  }, []);

  const removeVendor = useCallback((id: string) => {
    setVendors((prev) => prev.filter((v) => v.id !== id));
    toast.success("Vendor removed");
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
      availableRoomsHint: 35,
      openServiceRequests: openServices,
      activeTrips: trips.filter((t) => t.status === "active").length,
      scheduledTrips: trips.filter((t) => t.status === "scheduled").length,
      availableDrivers: drivers.filter((d) => d.status === "available").length,
      activeVehicles: vehicles.filter((v) => v.status === "active").length,
      hkPending: hkTasks.filter((t) => t.status === "pending").length,
      hkProgress: hkTasks.filter((t) => t.status === "in_progress").length,
      hkDone: hkTasks.filter((t) => t.status === "completed").length,
      hkUrgent: hkTasks.filter((t) => t.status === "urgent").length,
    };
  }, [checkins, checkouts, verifications, services, trips, drivers, vehicles, hkTasks]);

  return {
    checkins,
    checkouts,
    services,
    trips,
    drivers,
    vehicles,
    translators,
    vendors,
    hkTasks,
    verifications,
    kpi,
    checkInGuest,
    verifyGuest,
    processCheckout,
    resolveService,
    startTrip,
    createTrip,
    cancelTrip,
    upsertDriver,
    removeDriver,
    upsertVehicle,
    removeVehicle,
    upsertTranslator,
    removeTranslator,
    upsertVendor,
    removeVendor,
    approveVerification,
    advanceHkTask,
  };
}

export type ReceptionOperations = ReturnType<typeof useReceptionState>;
