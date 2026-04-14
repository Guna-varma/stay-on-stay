import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  createTransportTrip,
  listTransportDriversForHotel,
  listTransportTripsForHotel,
  listTransportTranslatorsForHotel,
  listTransportVendorsForHotel,
  listTransportVehiclesForHotel,
  removeTransportDriver,
  removeTransportTranslator,
  removeTransportVehicle,
  removeTransportVendor,
  supabase,
  updateTransportTripStatus,
  upsertTransportDriver,
  upsertTransportTranslator,
  upsertTransportVehicle,
  upsertTransportVendor,
  type StaffMember,
  type TransportTripRecord,
  type TransportVehicleRecord,
  type TransportVendorRecord,
} from "@/lib/supabase";
import type {
  CreateTripInput,
  TransportDriver,
  TransportTrip,
  TransportVehicle,
  Translator,
  Vendor,
} from "@/lib/operations-types";

function mapDriver(staff: StaffMember): TransportDriver {
  return {
    id: staff.id,
    name: staff.name,
    phone: staff.mobile_number,
    license: staff.license_number ?? "",
    rating: Number(staff.rating ?? 4.8),
    status:
      staff.transport_status === "on_trip"
        ? "on_trip"
        : staff.transport_status === "off_duty"
          ? "off_duty"
          : "available",
  };
}

function mapTranslator(staff: StaffMember): Translator {
  return {
    id: staff.id,
    name: staff.name,
    languages: staff.languages ?? [],
    rating: Number(staff.rating ?? 4.8),
    rateInrPerDay: Number(staff.daily_rate_inr ?? 2800),
    status:
      staff.transport_status === "assigned"
        ? "assigned"
        : staff.transport_status === "on_leave"
          ? "on_leave"
          : "available",
  };
}

function mapVehicle(row: TransportVehicleRecord): TransportVehicle {
  return {
    id: row.id,
    name: row.name,
    type: row.body_type,
    plate: row.plate,
    capacity: row.capacity,
    status: row.status,
  };
}

function mapVendor(row: TransportVendorRecord): Vendor {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    contact: row.contact,
    active: row.active,
  };
}

function mapTrip(row: TransportTripRecord): TransportTrip {
  return {
    id: row.id,
    type: row.trip_type,
    status: row.status,
    guestName: row.guest_name,
    route: row.route,
    scheduledAt: row.scheduled_at,
    driverName: row.driver?.name ?? "Driver",
    driverId: row.driver_staff_id ?? undefined,
    vehicleId: row.vehicle_id ?? undefined,
    checkInRef: row.checkin_ref ?? undefined,
    roomLabel: row.room_label ?? undefined,
    priceInr: Number(row.price_inr ?? 0),
  };
}

interface UseFrontdeskTransportState {
  loading: boolean;
  trips: TransportTrip[];
  drivers: TransportDriver[];
  vehicles: TransportVehicle[];
  translators: Translator[];
  vendors: Vendor[];
  kpi: { active: number; scheduled: number; drivers: number; vehicles: number };
  refresh: () => Promise<void>;
  startTrip: (id: string) => Promise<void>;
  createTrip: (input: CreateTripInput) => Promise<boolean>;
  cancelTrip: (id: string) => Promise<void>;
  upsertDriver: (row: TransportDriver) => Promise<void>;
  removeDriver: (id: string) => Promise<void>;
  upsertVehicle: (row: TransportVehicle) => Promise<void>;
  removeVehicle: (id: string) => Promise<void>;
  upsertTranslator: (row: Translator) => Promise<void>;
  removeTranslator: (id: string) => Promise<void>;
  upsertVendor: (row: Vendor) => Promise<void>;
  removeVendor: (id: string) => Promise<void>;
}

export function useFrontdeskTransport(
  hotelId: string | null,
  userId: string | null,
): UseFrontdeskTransportState {
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<TransportTrip[]>([]);
  const [drivers, setDrivers] = useState<TransportDriver[]>([]);
  const [vehicles, setVehicles] = useState<TransportVehicle[]>([]);
  const [translators, setTranslators] = useState<Translator[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  const refresh = useCallback(async () => {
    if (!hotelId) {
      setTrips([]);
      setDrivers([]);
      setVehicles([]);
      setTranslators([]);
      setVendors([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const [tripsRes, driversRes, vehiclesRes, translatorsRes, vendorsRes] = await Promise.all([
      listTransportTripsForHotel(hotelId),
      listTransportDriversForHotel(hotelId),
      listTransportVehiclesForHotel(hotelId),
      listTransportTranslatorsForHotel(hotelId),
      listTransportVendorsForHotel(hotelId),
    ]);

    if (tripsRes.error) toast.error(tripsRes.error.message || "Failed to load trips");
    if (driversRes.error) toast.error(driversRes.error.message || "Failed to load drivers");
    if (vehiclesRes.error) toast.error(vehiclesRes.error.message || "Failed to load vehicles");
    if (translatorsRes.error) toast.error(translatorsRes.error.message || "Failed to load translators");
    if (vendorsRes.error) toast.error(vendorsRes.error.message || "Failed to load vendors");

    setTrips(tripsRes.data.map(mapTrip));
    setDrivers(driversRes.data.map(mapDriver));
    setVehicles(vehiclesRes.data.map(mapVehicle));
    setTranslators(translatorsRes.data.map(mapTranslator));
    setVendors(vendorsRes.data.map(mapVendor));
    setLoading(false);
  }, [hotelId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!hotelId) return;
    const channel = supabase
      .channel(`frontdesk-transport-${hotelId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "transport_trips", filter: `hotel_id=eq.${hotelId}` }, () => void refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "transport_vehicles", filter: `hotel_id=eq.${hotelId}` }, () => void refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "transport_vendors", filter: `hotel_id=eq.${hotelId}` }, () => void refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "staff", filter: `hotel_id=eq.${hotelId}` }, () => void refresh())
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [hotelId, refresh]);

  const startTrip = useCallback(async (id: string) => {
    const result = await updateTransportTripStatus(id, "active");
    if (result.error) {
      toast.error(result.error.message || "Failed to start trip");
      return;
    }
    toast.success("Trip started");
    await refresh();
  }, [refresh]);

  const cancelTrip = useCallback(async (id: string) => {
    const result = await updateTransportTripStatus(id, "cancelled");
    if (result.error) {
      toast.error(result.error.message || "Failed to cancel trip");
      return;
    }
    toast.success("Trip cancelled");
    await refresh();
  }, [refresh]);

  const createTrip = useCallback(async (input: CreateTripInput) => {
    if (!hotelId || !userId) {
      toast.error("Hotel or user context missing");
      return false;
    }
    const result = await createTransportTrip({
      hotelId,
      createdBy: userId,
      tripType: input.type,
      guestName: input.guestName,
      roomLabel: input.roomLabel,
      checkinRef: input.checkInRef,
      route: input.route,
      scheduledAt: input.scheduledAt,
      driverStaffId: input.driverId,
      vehicleId: input.vehicleId ?? null,
      priceInr: input.priceInr,
    });
    if (result.error) {
      toast.error(result.error.message || "Failed to schedule trip");
      return false;
    }
    toast.success("Trip scheduled");
    await refresh();
    return true;
  }, [hotelId, userId, refresh]);

  const upsertDriverHandler = useCallback(async (row: TransportDriver) => {
    if (!hotelId) return;
    const result = await upsertTransportDriver({
      hotelId,
      id: row.id.startsWith("dr-") ? undefined : row.id,
      name: row.name,
      phone: row.phone,
      license: row.license,
      rating: row.rating,
      status: row.status,
    });
    if (result.error) {
      toast.error(result.error.message || "Failed to save driver");
      return;
    }
    toast.success("Driver saved");
    await refresh();
  }, [hotelId, refresh]);

  const removeDriverHandler = useCallback(async (id: string) => {
    const active = trips.some((t) => t.driverId === id && (t.status === "scheduled" || t.status === "active"));
    if (active) {
      toast.error("Complete or cancel active trips for this driver first");
      return;
    }
    const result = await removeTransportDriver(id);
    if (result.error) {
      toast.error(result.error.message || "Failed to remove driver");
      return;
    }
    toast.success("Driver removed");
    await refresh();
  }, [refresh, trips]);

  const upsertVehicleHandler = useCallback(async (row: TransportVehicle) => {
    if (!hotelId || !userId) return;
    const result = await upsertTransportVehicle({
      hotelId,
      userId,
      id: row.id.startsWith("v-") ? undefined : row.id,
      name: row.name,
      bodyType: row.type,
      plate: row.plate,
      capacity: row.capacity,
      status: row.status,
    });
    if (result.error) {
      toast.error(result.error.message || "Failed to save vehicle");
      return;
    }
    toast.success("Vehicle saved");
    await refresh();
  }, [hotelId, userId, refresh]);

  const removeVehicleHandler = useCallback(async (id: string) => {
    const active = trips.some((t) => t.vehicleId === id && (t.status === "scheduled" || t.status === "active"));
    if (active) {
      toast.error("Vehicle is assigned to active/scheduled trips");
      return;
    }
    const result = await removeTransportVehicle(id);
    if (result.error) {
      toast.error(result.error.message || "Failed to remove vehicle");
      return;
    }
    toast.success("Vehicle removed");
    await refresh();
  }, [refresh, trips]);

  const upsertTranslatorHandler = useCallback(async (row: Translator) => {
    if (!hotelId) return;
    const result = await upsertTransportTranslator({
      hotelId,
      id: row.id.startsWith("tl-") ? undefined : row.id,
      name: row.name,
      languages: row.languages,
      rating: row.rating,
      rateInrPerDay: row.rateInrPerDay,
      status: row.status,
    });
    if (result.error) {
      toast.error(result.error.message || "Failed to save translator");
      return;
    }
    toast.success("Translator saved");
    await refresh();
  }, [hotelId, refresh]);

  const removeTranslatorHandler = useCallback(async (id: string) => {
    const result = await removeTransportTranslator(id);
    if (result.error) {
      toast.error(result.error.message || "Failed to remove translator");
      return;
    }
    toast.success("Translator removed");
    await refresh();
  }, [refresh]);

  const upsertVendorHandler = useCallback(async (row: Vendor) => {
    if (!hotelId || !userId) return;
    const result = await upsertTransportVendor({
      hotelId,
      userId,
      id: row.id.startsWith("vn-") ? undefined : row.id,
      name: row.name,
      category: row.category,
      contact: row.contact,
      active: row.active,
    });
    if (result.error) {
      toast.error(result.error.message || "Failed to save vendor");
      return;
    }
    toast.success("Vendor saved");
    await refresh();
  }, [hotelId, userId, refresh]);

  const removeVendorHandler = useCallback(async (id: string) => {
    const result = await removeTransportVendor(id);
    if (result.error) {
      toast.error(result.error.message || "Failed to remove vendor");
      return;
    }
    toast.success("Vendor removed");
    await refresh();
  }, [refresh]);

  const kpi = useMemo(
    () => ({
      active: trips.filter((t) => t.status === "active").length,
      scheduled: trips.filter((t) => t.status === "scheduled").length,
      drivers: drivers.filter((d) => d.status === "available").length,
      vehicles: vehicles.filter((v) => v.status === "active").length,
    }),
    [drivers, trips, vehicles],
  );

  return {
    loading,
    trips,
    drivers,
    vehicles,
    translators,
    vendors,
    kpi,
    refresh,
    startTrip,
    createTrip,
    cancelTrip,
    upsertDriver: upsertDriverHandler,
    removeDriver: removeDriverHandler,
    upsertVehicle: upsertVehicleHandler,
    removeVehicle: removeVehicleHandler,
    upsertTranslator: upsertTranslatorHandler,
    removeTranslator: removeTranslatorHandler,
    upsertVendor: upsertVendorHandler,
    removeVendor: removeVendorHandler,
  };
}
