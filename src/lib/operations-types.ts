/** Domain types for reception / operations hub (mock + future API). */

export type BookingDisplayStatus = "confirmed" | "checked_in" | "checked_out" | "pending";

export interface ReceptionCheckIn {
  id: string;
  bookingRef: string;
  guestName: string;
  country: string;
  passportMasked: string;
  roomLabel: string;
  status: BookingDisplayStatus;
  companionNote?: string;
}

export interface ReceptionCheckOut {
  id: string;
  guestName: string;
  roomLabel: string;
  checkoutDate: string;
  balanceInr: number;
}

export type RoomTileStatus = "available" | "booked" | "maintenance" | "occupied" | "cleaning" | "held_self" | "held_other";

export interface PropertyRoomTile {
  number: string;
  status: RoomTileStatus;
}

export interface PropertyRoomGrid {
  id: string;
  name: string;
  rooms: PropertyRoomTile[];
}

export type ServiceCategory = "Housekeeping" | "Maintenance" | "Transport" | "Food" | "Medical";
export type ServicePriority = "low" | "medium" | "high";

export interface OpsServiceRequest {
  id: string;
  category: ServiceCategory;
  priority: ServicePriority;
  title: string;
  roomLabel: string;
  guestName: string;
  resolved?: boolean;
}

export type HkTaskStatus = "pending" | "in_progress" | "completed" | "urgent";

export interface HousekeepingTask {
  id: string;
  title: string;
  roomLabel: string;
  status: HkTaskStatus;
  assignee?: string;
}

export type TripStatus = "scheduled" | "active" | "completed" | "cancelled";
export type TripType = "Airport Pickup" | "Daily Cab" | "Hospital" | "Discharge";

export interface TransportTrip {
  id: string;
  type: TripType;
  status: TripStatus;
  guestName: string;
  route: string;
  scheduledAt: string;
  driverName: string;
  /** Stable link for driver status updates */
  driverId?: string;
  vehicleId?: string;
  /** Optional link to front-desk check-in row */
  checkInRef?: string;
  roomLabel?: string;
  priceInr: number;
}

export type DriverStatus = "available" | "on_trip" | "off_duty";

export interface TransportDriver {
  id: string;
  name: string;
  phone: string;
  license: string;
  rating: number;
  status: DriverStatus;
}

export type VehicleStatus = "active" | "maintenance" | "retired";

export interface TransportVehicle {
  id: string;
  name: string;
  type: string;
  plate: string;
  capacity: number;
  status: VehicleStatus;
}

export type TranslatorStatus = "available" | "assigned" | "on_leave";

export interface Translator {
  id: string;
  name: string;
  languages: string[];
  rating: number;
  rateInrPerDay: number;
  status: TranslatorStatus;
}

export interface Vendor {
  id: string;
  name: string;
  category: string;
  contact: string;
  active: boolean;
}

export interface VerificationQueueItem {
  id: string;
  guestName: string;
  roomLabel: string;
  docType: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
}

export interface StaffShift {
  id: string;
  name: string;
  role: string;
  area: string;
  shift: string;
  status: "on_duty" | "off";
}

/** Payload for scheduling a trip from the reception transport console */
export interface CreateTripInput {
  type: TripType;
  guestName: string;
  roomLabel?: string;
  checkInRef?: string;
  route: string;
  scheduledAt: string;
  driverId: string;
  vehicleId?: string;
  priceInr: number;
}
