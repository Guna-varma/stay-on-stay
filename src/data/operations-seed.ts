import type {
  HousekeepingTask,
  OpsServiceRequest,
  PropertyRoomGrid,
  ReceptionCheckIn,
  ReceptionCheckOut,
  StaffShift,
  Translator,
  TransportDriver,
  TransportTrip,
  TransportVehicle,
  Vendor,
  VerificationQueueItem,
} from "@/lib/operations-types";

export const SEED_CHECKINS: ReceptionCheckIn[] = [
  {
    id: "ci-1",
    bookingRef: "BK-2026-001",
    guestName: "Aisha Mohammed",
    country: "UAE",
    passportMasked: "AE****4321",
    roomLabel: "h1-r2",
    status: "checked_in",
    companionNote: "1 companion: Fatima Mohammed",
  },
  {
    id: "ci-2",
    bookingRef: "BK-2026-002",
    guestName: "Jean-Pierre Dubois",
    country: "France",
    passportMasked: "FR****8765",
    roomLabel: "h2-r5",
    status: "confirmed",
  },
  {
    id: "ci-3",
    bookingRef: "BK-2026-003",
    guestName: "Amara Osei",
    country: "Ghana",
    passportMasked: "GH****2210",
    roomLabel: "h1-r8",
    status: "confirmed",
  },
];

export const SEED_CHECKOUTS: ReceptionCheckOut[] = [
  {
    id: "co-1",
    guestName: "Aisha Mohammed",
    roomLabel: "h1-r2",
    checkoutDate: "2026-03-25",
    balanceInr: 0,
  },
  {
    id: "co-2",
    guestName: "Amara Osei",
    roomLabel: "h1-r8",
    checkoutDate: "2026-03-26",
    balanceInr: 22000,
  },
];

/** Reference room grids (two properties). */
export const SEED_PROPERTY_GRIDS: PropertyRoomGrid[] = [
  {
    id: "p1",
    name: "MedStay Grand Residency",
    rooms: [
      { number: "101", status: "maintenance" },
      { number: "102", status: "available" },
      { number: "103", status: "available" },
      { number: "104", status: "available" },
      { number: "201", status: "available" },
      { number: "202", status: "occupied" },
      { number: "203", status: "available" },
      { number: "204", status: "maintenance" },
      { number: "301", status: "available" },
      { number: "302", status: "available" },
      { number: "303", status: "occupied" },
      { number: "304", status: "available" },
      { number: "401", status: "available" },
      { number: "402", status: "available" },
      { number: "403", status: "maintenance" },
      { number: "404", status: "occupied" },
    ],
  },
  {
    id: "p2",
    name: "Artemis Care Suites",
    rooms: [
      { number: "101", status: "available" },
      { number: "102", status: "booked" },
      { number: "201", status: "occupied" },
      { number: "202", status: "available" },
    ],
  },
];

export const SEED_SERVICE_REQUESTS: OpsServiceRequest[] = [
  {
    id: "sr-1",
    category: "Housekeeping",
    priority: "medium",
    title: "Extra pillows and blankets needed",
    roomLabel: "102",
    guestName: "Aisha Mohammed",
  },
  {
    id: "sr-2",
    category: "Maintenance",
    priority: "high",
    title: "AC not cooling properly",
    roomLabel: "208",
    guestName: "Amara Osei",
  },
  {
    id: "sr-3",
    category: "Transport",
    priority: "medium",
    title: "Daily cab to Medanta at 9 AM",
    roomLabel: "102",
    guestName: "Aisha Mohammed",
  },
  {
    id: "sr-4",
    category: "Food",
    priority: "medium",
    title: "Halal meal options for dinner",
    roomLabel: "403",
    guestName: "Abdullah Al-Rashid",
  },
  {
    id: "sr-5",
    category: "Medical",
    priority: "high",
    title: "Need wheelchair for hospital visit",
    roomLabel: "403",
    guestName: "Abdullah Al-Rashid",
  },
];

export const SEED_HK_TASKS: HousekeepingTask[] = [
  { id: "hk-1", title: "Turnover — Room 202", roomLabel: "202", status: "pending" },
  { id: "hk-2", title: "Deep clean — Suite 301", roomLabel: "301", status: "in_progress", assignee: "Sunita" },
  { id: "hk-3", title: "Linen restock — Floor 4", roomLabel: "4F", status: "completed" },
  { id: "hk-4", title: "Biohazard protocol — 208", roomLabel: "208", status: "urgent" },
  { id: "hk-5", title: "Minibar check — 104", roomLabel: "104", status: "pending" },
];

export const SEED_TRIPS: TransportTrip[] = [
  {
    id: "tr-1",
    type: "Airport Pickup",
    status: "scheduled",
    guestName: "Jean-Pierre Dubois",
    route: "IGI Airport T3 → Artemis Care Suites",
    scheduledAt: "2026-03-12T14:30:00",
    driverName: "Mohit Chauhan",
    driverId: "dr-2",
    vehicleId: "v-2",
    checkInRef: "ci-2",
    roomLabel: "h2-r5",
    priceInr: 1800,
  },
  {
    id: "tr-2",
    type: "Daily Cab",
    status: "completed",
    guestName: "Aisha Mohammed",
    route: "MedStay Grand → Medanta Hospital",
    scheduledAt: "2026-03-10T09:00:00",
    driverName: "Raju Yadav",
    driverId: "dr-1",
    vehicleId: "v-1",
    checkInRef: "ci-1",
    roomLabel: "h1-r2",
    priceInr: 500,
  },
  {
    id: "tr-3",
    type: "Hospital",
    status: "active",
    guestName: "Abdullah Al-Rashid",
    route: "Artemis Care Suites → Medanta",
    scheduledAt: "2026-03-11T11:00:00",
    driverName: "Suresh Nair",
    driverId: "dr-3",
    vehicleId: "v-2",
    priceInr: 650,
  },
];

export const SEED_DRIVERS: TransportDriver[] = [
  {
    id: "dr-1",
    name: "Raju Yadav",
    phone: "+91-98765-43210",
    license: "HR-0620110012345",
    rating: 4.8,
    status: "available",
  },
  {
    id: "dr-2",
    name: "Mohit Chauhan",
    phone: "+91 98765 43211",
    license: "HR 0620110054321",
    rating: 4.6,
    status: "available",
  },
  {
    id: "dr-3",
    name: "Suresh Nair",
    phone: "+91-98765-43212",
    license: "HR-0620110098765",
    rating: 4.9,
    status: "on_trip",
  },
  {
    id: "dr-4",
    name: "Amit Tiwari",
    phone: "+91-98765-43213",
    license: "HR-0620110043210",
    rating: 4.7,
    status: "available",
  },
];

export const SEED_VEHICLES: TransportVehicle[] = [
  { id: "v-1", name: "Toyota Etios", type: "Sedan", plate: "HR-26-AB-1234", capacity: 4, status: "active" },
  { id: "v-2", name: "Toyota Innova", type: "SUV", plate: "HR-26-CD-5678", capacity: 7, status: "active" },
  { id: "v-3", name: "Force Traveller", type: "Tempo Traveller", plate: "HR-26-EF-9012", capacity: 12, status: "active" },
  { id: "v-4", name: "Honda Amaze", type: "Sedan", plate: "HR-26-GH-3456", capacity: 4, status: "maintenance" },
];

export const SEED_TRANSLATORS: Translator[] = [
  {
    id: "tl-1",
    name: "Nadia Benali",
    languages: ["Arabic", "English", "French"],
    rating: 4.9,
    rateInrPerDay: 3000,
    status: "assigned",
  },
  {
    id: "tl-2",
    name: "Chen Wei",
    languages: ["Mandarin", "English"],
    rating: 4.8,
    rateInrPerDay: 2800,
    status: "available",
  },
  {
    id: "tl-3",
    name: "Maria Santos",
    languages: ["Portuguese", "English", "Spanish"],
    rating: 4.7,
    rateInrPerDay: 2600,
    status: "available",
  },
];

export const SEED_VENDORS: Vendor[] = [
  { id: "vn-1", name: "MedSupply Co.", category: "Medical consumables", contact: "procurement@medsupply.in", active: true },
  { id: "vn-2", name: "FreshHarvest Catering", category: "Food service", contact: "+91-11-4000-2200", active: true },
  { id: "vn-3", name: "City Linen Works", category: "Laundry", contact: "orders@citylinen.in", active: true },
];

export const SEED_VERIFICATIONS: VerificationQueueItem[] = [
  {
    id: "vr-1",
    guestName: "Jean-Pierre Dubois",
    roomLabel: "h2-r5",
    docType: "Passport + medical visa",
    submittedAt: "2026-03-10T08:12:00",
    status: "pending",
  },
  {
    id: "vr-2",
    guestName: "Amara Osei",
    roomLabel: "h1-r8",
    docType: "Passport",
    submittedAt: "2026-03-10T09:40:00",
    status: "pending",
  },
  {
    id: "vr-3",
    guestName: "Layla Hassan",
    roomLabel: "h1-r3",
    docType: "FRRO form C",
    submittedAt: "2026-03-09T16:00:00",
    status: "approved",
  },
];

export const SEED_STAFF: StaffShift[] = [
  { id: "st-1", name: "Priya Sharma", role: "Reception", area: "Lobby A", shift: "07:00–15:00", status: "on_duty" },
  { id: "st-2", name: "Rajesh Kumar", role: "Senior Reception", area: "Lobby A", shift: "07:00–15:00", status: "on_duty" },
  { id: "st-3", name: "Anita Desai", role: "Night audit", area: "Back office", shift: "22:00–06:00", status: "off" },
];
