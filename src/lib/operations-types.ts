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

export type RoomTileStatus = "available" | "booked" | "maintenance" | "occupied" | "cleaning";

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

export type TripStatus = "scheduled" | "active" | "completed";
export type TripType = "Airport Pickup" | "Daily Cab" | "Hospital" | "Discharge";

export interface TransportTrip {
  id: string;
  type: TripType;
  status: TripStatus;
  guestName: string;
  route: string;
  scheduledAt: string;
  driverName: string;
  priceInr: number;
}

export type DriverStatus = "available" | "on_trip";

export interface TransportDriver {
  id: string;
  name: string;
  phone: string;
  license: string;
  rating: number;
  status: DriverStatus;
}

export type VehicleStatus = "active" | "maintenance";

export interface TransportVehicle {
  id: string;
  name: string;
  type: string;
  plate: string;
  capacity: number;
  status: VehicleStatus;
}

export type TranslatorStatus = "available" | "assigned";

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
