// ─── HOTELS ───
export const HOSPITALS = [
  { id: "medanta", name: "Medanta The Medicity", address: "CH Baktawar Singh Rd, Sector 38, Gurugram", lat: 28.4395, lng: 77.0422 },
  { id: "artemis", name: "Artemis Hospital", address: "Sector 51, Gurugram", lat: 28.4089, lng: 77.0551 },
];

export interface Hotel {
  id: string;
  name: string;
  address: string;
  rating: number;
  reviewCount: number;
  image: string;
  nearbyHospital: string;
  distanceKm: number;
  amenities: string[];
  nearbyPlaces: { type: string; name: string; distance: string }[];
  rooms: Room[];
}

export interface Room {
  id: string;
  hotelId: string;
  number: string;
  type: string;
  capacity: number;
  pricePerNight: number;
  longStayDiscount: number;
  amenities: string[];
  accessibility: string[];
  medicalFacilities: string[];
  images: string[];
  status: "available" | "booked" | "maintenance";
  bookings: { start: string; end: string }[];
}

const roomAmenities = ["Wi-Fi", "AC", "TV", "Mini Fridge", "Microwave", "Kettle", "Safe", "Desk", "Wardrobe"];
const roomAccessibility = ["Wheelchair accessible", "Grab bars", "Low bed", "Wide doorway", "Emergency cord"];
const roomMedical = ["Adjustable bed", "Oxygen point", "Nurse call button", "Medicine refrigerator", "First aid kit"];

function makeRooms(hotelId: string, count: number): Room[] {
  const types = ["Standard", "Deluxe", "Suite", "Premium Suite"];
  const prices = [2800, 4500, 7200, 12000];
  return Array.from({ length: count }, (_, i) => ({
    id: `${hotelId}-r${i + 1}`,
    hotelId,
    number: `${Math.floor(i / 4) + 1}${String((i % 4) + 1).padStart(2, "0")}`,
    type: types[i % 4],
    capacity: i % 4 === 3 ? 4 : i % 4 === 2 ? 3 : 2,
    pricePerNight: prices[i % 4],
    longStayDiscount: i % 4 >= 2 ? 20 : 15,
    amenities: roomAmenities.slice(0, 5 + (i % 4)),
    accessibility: roomAccessibility.slice(0, 2 + (i % 3)),
    medicalFacilities: roomMedical.slice(0, 2 + (i % 3)),
    images: [`https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600`, `https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=600`],
    status: i % 7 === 0 ? "maintenance" as const : i % 5 === 0 ? "booked" as const : "available" as const,
    bookings: i % 5 === 0 ? [{ start: "2026-03-12", end: "2026-03-20" }] : [],
  }));
}

export const HOTELS: Hotel[] = [
  {
    id: "h1", name: "MedStay Grand Residency", address: "Sector 38, Gurugram", rating: 4.7, reviewCount: 342,
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
    nearbyHospital: "Medanta The Medicity", distanceKm: 0.8,
    amenities: ["24/7 Reception", "Pharmacy", "Cafeteria", "Laundry", "Airport Shuttle", "Wheelchair Access", "Medical Concierge"],
    nearbyPlaces: [
      { type: "Pharmacy", name: "Apollo Pharmacy", distance: "200m" },
      { type: "Restaurant", name: "Sagar Ratna", distance: "350m" },
      { type: "Grocery", name: "Big Bazaar", distance: "1.2km" },
      { type: "Park", name: "Leisure Valley Park", distance: "2km" },
    ],
    rooms: makeRooms("h1", 16),
  },
  {
    id: "h2", name: "Artemis Care Suites", address: "Sector 51, Gurugram", rating: 4.5, reviewCount: 218,
    image: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800",
    nearbyHospital: "Artemis Hospital", distanceKm: 0.5,
    amenities: ["24/7 Reception", "In-house Doctor", "Cafeteria", "Laundry", "Transport", "Wheelchair Access"],
    nearbyPlaces: [
      { type: "Pharmacy", name: "MedPlus", distance: "150m" },
      { type: "Restaurant", name: "Haldiram's", distance: "500m" },
      { type: "Grocery", name: "DMart", distance: "1km" },
      { type: "Park", name: "Tau Devi Lal Park", distance: "1.5km" },
    ],
    rooms: makeRooms("h2", 12),
  },
  {
    id: "h3", name: "Healing Heights Hotel", address: "Sector 40, Gurugram", rating: 4.3, reviewCount: 156,
    image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800",
    nearbyHospital: "Medanta The Medicity", distanceKm: 1.5,
    amenities: ["24/7 Reception", "Cafeteria", "Laundry", "Free Parking", "Translator Service"],
    nearbyPlaces: [
      { type: "Pharmacy", name: "Fortis Pharmacy", distance: "300m" },
      { type: "Restaurant", name: "Bikanervala", distance: "400m" },
      { type: "Grocery", name: "Reliance Fresh", distance: "800m" },
    ],
    rooms: makeRooms("h3", 10),
  },
  {
    id: "h4", name: "Wellness Stay Inn", address: "Sector 49, Gurugram", rating: 4.6, reviewCount: 289,
    image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800",
    nearbyHospital: "Artemis Hospital", distanceKm: 1.2,
    amenities: ["24/7 Reception", "Gym", "Spa", "Cafeteria", "Medical Concierge", "Airport Shuttle"],
    nearbyPlaces: [
      { type: "Pharmacy", name: "Guardian Pharmacy", distance: "100m" },
      { type: "Restaurant", name: "Punjab Grill", distance: "250m" },
      { type: "Grocery", name: "Nature's Basket", distance: "600m" },
      { type: "Park", name: "Sector 49 Park", distance: "500m" },
    ],
    rooms: makeRooms("h4", 14),
  },
];

// ─── BOOKINGS ───
export interface Booking {
  id: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  nationality: string;
  passportNumber: string;
  hotelId: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  status: "confirmed" | "checked_in" | "checked_out" | "cancelled" | "no_show";
  totalAmount: number;
  paidAmount: number;
  companions: { name: string; relation: string; passportNumber: string }[];
  services: string[];
  createdAt: string;
}

export const BOOKINGS: Booking[] = [
  { id: "BK-2026-001", guestName: "Aisha Mohammed", guestEmail: "customer@stayonstay.com", guestPhone: "+971-50-1234567", nationality: "UAE", passportNumber: "AE****4321", hotelId: "h1", roomId: "h1-r2", checkIn: "2026-03-10", checkOut: "2026-03-25", status: "checked_in", totalAmount: 67500, paidAmount: 67500, companions: [{ name: "Fatima Mohammed", relation: "Daughter", passportNumber: "AE****4322" }], services: ["Airport Pickup", "Daily Cab", "Arabic Translator"], createdAt: "2026-02-28" },
  { id: "BK-2026-002", guestName: "Jean-Pierre Dubois", guestEmail: "jp.dubois@email.com", guestPhone: "+33-6-12345678", nationality: "France", passportNumber: "FR****8765", hotelId: "h2", roomId: "h2-r5", checkIn: "2026-03-12", checkOut: "2026-03-20", status: "confirmed", totalAmount: 36000, paidAmount: 36000, companions: [], services: ["Airport Pickup", "French Translator"], createdAt: "2026-03-01" },
  { id: "BK-2026-003", guestName: "Amara Osei", guestEmail: "amara.o@email.com", guestPhone: "+254-700-123456", nationality: "Kenya", passportNumber: "KE****5678", hotelId: "h1", roomId: "h1-r8", checkIn: "2026-03-08", checkOut: "2026-03-18", status: "checked_in", totalAmount: 72000, paidAmount: 50000, companions: [{ name: "Kwame Osei", relation: "Husband", passportNumber: "KE****5679" }], services: ["Airport Pickup", "Swahili Translator", "Daily Cab"], createdAt: "2026-02-25" },
  { id: "BK-2026-004", guestName: "Abdullah Al-Rashid", guestEmail: "abdullah.r@email.com", guestPhone: "+966-50-9876543", nationality: "Saudi Arabia", passportNumber: "SA****1234", hotelId: "h4", roomId: "h4-r3", checkIn: "2026-03-15", checkOut: "2026-04-15", status: "confirmed", totalAmount: 216000, paidAmount: 108000, companions: [{ name: "Noura Al-Rashid", relation: "Wife", passportNumber: "SA****1235" }, { name: "Omar Al-Rashid", relation: "Son", passportNumber: "SA****1236" }], services: ["Airport Pickup", "Airport Drop", "Weekly Rental", "Arabic Translator"], createdAt: "2026-03-02" },
  { id: "BK-2026-005", guestName: "Marie Fontaine", guestEmail: "marie.f@email.com", guestPhone: "+33-7-98765432", nationality: "France", passportNumber: "FR****3456", hotelId: "h3", roomId: "h3-r1", checkIn: "2026-03-05", checkOut: "2026-03-12", status: "checked_out", totalAmount: 19600, paidAmount: 19600, companions: [], services: ["Airport Pickup"], createdAt: "2026-02-20" },
  { id: "BK-2026-006", guestName: "Samuel Wanjiku", guestEmail: "samuel.w@email.com", guestPhone: "+254-711-654321", nationality: "Kenya", passportNumber: "KE****9012", hotelId: "h2", roomId: "h2-r1", checkIn: "2026-03-11", checkOut: "2026-03-11", status: "no_show", totalAmount: 2800, paidAmount: 2800, companions: [], services: [], createdAt: "2026-03-05" },
  { id: "BK-2026-007", guestName: "Layla Hassan", guestEmail: "layla.h@email.com", guestPhone: "+20-10-12345678", nationality: "Egypt", passportNumber: "EG****7890", hotelId: "h1", roomId: "h1-r12", checkIn: "2026-03-14", checkOut: "2026-03-28", status: "confirmed", totalAmount: 100800, paidAmount: 50400, companions: [{ name: "Ahmed Hassan", relation: "Brother", passportNumber: "EG****7891" }], services: ["Airport Pickup", "Arabic Translator", "Daily Cab"], createdAt: "2026-03-06" },
  { id: "BK-2026-008", guestName: "Pierre Martin", guestEmail: "pierre.m@email.com", guestPhone: "+33-6-55544433", nationality: "France", passportNumber: "FR****2468", hotelId: "h4", roomId: "h4-r7", checkIn: "2026-02-20", checkOut: "2026-03-05", status: "checked_out", totalAmount: 58500, paidAmount: 58500, companions: [], services: ["French Translator"], createdAt: "2026-02-10" },
];

// ─── CLEANING TASKS ───
export interface CleaningTask {
  id: string;
  roomNumber: string;
  hotelId: string;
  priority: "urgent" | "high" | "normal";
  status: "pending" | "in_progress" | "completed";
  assignedTo: string;
  type: string;
  notes?: string;
}

export const CLEANING_TASKS: CleaningTask[] = [
  { id: "CT-001", roomNumber: "102", hotelId: "h1", priority: "urgent", status: "pending", assignedTo: "Sunita Devi", type: "Deep Clean", notes: "Guest checked out, next arrival in 3 hrs" },
  { id: "CT-002", roomNumber: "205", hotelId: "h1", priority: "high", status: "in_progress", assignedTo: "Meena Kumari", type: "Daily Cleaning", notes: "Medical waste disposal needed" },
  { id: "CT-003", roomNumber: "301", hotelId: "h1", priority: "normal", status: "pending", assignedTo: "Sunita Devi", type: "Linen Change" },
  { id: "CT-004", roomNumber: "108", hotelId: "h1", priority: "normal", status: "completed", assignedTo: "Rani Pal", type: "Daily Cleaning" },
  { id: "CT-005", roomNumber: "402", hotelId: "h1", priority: "high", status: "pending", assignedTo: "Meena Kumari", type: "Sanitization", notes: "Post-isolation cleaning" },
  { id: "CT-006", roomNumber: "110", hotelId: "h1", priority: "normal", status: "completed", assignedTo: "Sunita Devi", type: "Turndown Service" },
];

// ─── DRIVERS & VEHICLES ───
export interface Driver {
  id: string;
  name: string;
  phone: string;
  license: string;
  status: "available" | "on_trip" | "off_duty";
  rating: number;
  vehicleId: string;
}

export interface Vehicle {
  id: string;
  type: "Sedan" | "SUV" | "Tempo Traveller";
  model: string;
  plate: string;
  status: "active" | "maintenance" | "idle";
  capacity: number;
}

export interface Trip {
  id: string;
  type: "Airport Pickup" | "Airport Drop" | "Daily Cab" | "Weekly Rental";
  guestName: string;
  driverId: string;
  vehicleId: string;
  from: string;
  to: string;
  date: string;
  time: string;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  fare: number;
}

export const VEHICLES: Vehicle[] = [
  { id: "V1", type: "Sedan", model: "Toyota Etios", plate: "HR-26-AB-1234", status: "active", capacity: 4 },
  { id: "V2", type: "SUV", model: "Toyota Innova", plate: "HR-26-CD-5678", status: "active", capacity: 7 },
  { id: "V3", type: "Tempo Traveller", model: "Force Traveller", plate: "HR-26-EF-9012", status: "active", capacity: 12 },
  { id: "V4", type: "Sedan", model: "Honda Amaze", plate: "HR-26-GH-3456", status: "maintenance", capacity: 4 },
  { id: "V5", type: "SUV", model: "Mahindra XUV700", plate: "HR-26-IJ-7890", status: "active", capacity: 7 },
];

export const DRIVERS: Driver[] = [
  { id: "D1", name: "Raju Yadav", phone: "+91-98765-43210", license: "HR-0620110012345", status: "available", rating: 4.8, vehicleId: "V1" },
  { id: "D2", name: "Mohit Chauhan", phone: "+91-98765-43211", license: "HR-0620110054321", status: "on_trip", rating: 4.6, vehicleId: "V2" },
  { id: "D3", name: "Suresh Nair", phone: "+91-98765-43212", license: "HR-0620110098765", status: "available", rating: 4.9, vehicleId: "V3" },
  { id: "D4", name: "Amit Tiwari", phone: "+91-98765-43213", license: "HR-0620110011111", status: "off_duty", rating: 4.5, vehicleId: "V5" },
];

export const TRIPS: Trip[] = [
  { id: "TR-001", type: "Airport Pickup", guestName: "Jean-Pierre Dubois", driverId: "D2", vehicleId: "V2", from: "IGI Airport T3", to: "Artemis Care Suites", date: "2026-03-12", time: "14:30", status: "scheduled", fare: 1800 },
  { id: "TR-002", type: "Daily Cab", guestName: "Aisha Mohammed", driverId: "D1", vehicleId: "V1", from: "MedStay Grand", to: "Medanta Hospital", date: "2026-03-10", time: "09:00", status: "completed", fare: 500 },
  { id: "TR-003", type: "Airport Drop", guestName: "Marie Fontaine", driverId: "D3", vehicleId: "V3", from: "Healing Heights", to: "IGI Airport T3", date: "2026-03-12", time: "06:00", status: "scheduled", fare: 2200 },
  { id: "TR-004", type: "Weekly Rental", guestName: "Abdullah Al-Rashid", driverId: "D1", vehicleId: "V5", from: "Wellness Stay Inn", to: "Multiple", date: "2026-03-15", time: "08:00", status: "scheduled", fare: 15000 },
  { id: "TR-005", type: "Daily Cab", guestName: "Amara Osei", driverId: "D2", vehicleId: "V2", from: "MedStay Grand", to: "Medanta Hospital", date: "2026-03-10", time: "10:30", status: "in_progress", fare: 500 },
];

// ─── TRANSLATORS ───
export interface Translator {
  id: string;
  name: string;
  languages: string[];
  status: "available" | "assigned" | "off_duty";
  rating: number;
  pricePerDay: number;
}

export const TRANSLATORS: Translator[] = [
  { id: "TL-1", name: "Nadia Benali", languages: ["Arabic", "English", "French"], status: "assigned", rating: 4.9, pricePerDay: 3000 },
  { id: "TL-2", name: "Sophie Laurent", languages: ["French", "English"], status: "available", rating: 4.7, pricePerDay: 2500 },
  { id: "TL-3", name: "Joseph Mwangi", languages: ["Swahili", "English"], status: "available", rating: 4.6, pricePerDay: 2000 },
  { id: "TL-4", name: "Hassan El-Masri", languages: ["Arabic", "English"], status: "off_duty", rating: 4.8, pricePerDay: 2800 },
];

// ─── FINANCE ───
export interface Invoice {
  id: string;
  bookingId: string;
  guestName: string;
  amount: number;
  gst: number;
  total: number;
  status: "paid" | "pending" | "overdue" | "refunded";
  date: string;
}

export const INVOICES: Invoice[] = [
  { id: "INV-2026-001", bookingId: "BK-2026-001", guestName: "Aisha Mohammed", amount: 57203, gst: 10297, total: 67500, status: "paid", date: "2026-02-28" },
  { id: "INV-2026-002", bookingId: "BK-2026-002", guestName: "Jean-Pierre Dubois", amount: 30508, gst: 5492, total: 36000, status: "paid", date: "2026-03-01" },
  { id: "INV-2026-003", bookingId: "BK-2026-003", guestName: "Amara Osei", amount: 61017, gst: 10983, total: 72000, status: "pending", date: "2026-02-25" },
  { id: "INV-2026-004", bookingId: "BK-2026-004", guestName: "Abdullah Al-Rashid", amount: 183051, gst: 32949, total: 216000, status: "pending", date: "2026-03-02" },
  { id: "INV-2026-005", bookingId: "BK-2026-005", guestName: "Marie Fontaine", amount: 16610, gst: 2990, total: 19600, status: "paid", date: "2026-02-20" },
  { id: "INV-2026-007", bookingId: "BK-2026-007", guestName: "Layla Hassan", amount: 85424, gst: 15376, total: 100800, status: "pending", date: "2026-03-06" },
  { id: "INV-2026-008", bookingId: "BK-2026-008", guestName: "Pierre Martin", amount: 49576, gst: 8924, total: 58500, status: "paid", date: "2026-02-10" },
];

export const MONTHLY_REVENUE = [
  { month: "Oct", revenue: 1850000, expenses: 920000 },
  { month: "Nov", revenue: 2100000, expenses: 980000 },
  { month: "Dec", revenue: 2450000, expenses: 1050000 },
  { month: "Jan", revenue: 2680000, expenses: 1100000 },
  { month: "Feb", revenue: 2920000, expenses: 1150000 },
  { month: "Mar", revenue: 3150000, expenses: 1200000 },
];

export const OCCUPANCY_DATA = [
  { month: "Oct", rate: 62 },
  { month: "Nov", rate: 71 },
  { month: "Dec", rate: 78 },
  { month: "Jan", rate: 82 },
  { month: "Feb", rate: 85 },
  { month: "Mar", rate: 88 },
];

export const EXPENSE_BREAKDOWN = [
  { category: "Staff Salaries", amount: 480000 },
  { category: "Cleaning & Supplies", amount: 120000 },
  { category: "Utilities", amount: 95000 },
  { category: "Maintenance", amount: 75000 },
  { category: "Transport", amount: 150000 },
  { category: "Translator Services", amount: 60000 },
  { category: "Marketing", amount: 40000 },
];

// ─── NOTIFICATIONS ───
export interface AppNotification {
  id: string;
  type: "booking" | "payment" | "checkin" | "cleaning" | "alert" | "emergency";
  title: string;
  message: string;
  time: string;
  read: boolean;
  role: string;
}

export const NOTIFICATIONS: AppNotification[] = [
  { id: "N1", type: "booking", title: "New Booking Confirmed", message: "Booking BK-2026-004 confirmed for Abdullah Al-Rashid", time: "2 min ago", read: false, role: "all" },
  { id: "N2", type: "payment", title: "Payment Received", message: "₹67,500 received for BK-2026-001", time: "15 min ago", read: false, role: "finance" },
  { id: "N3", type: "checkin", title: "Check-in Reminder", message: "Jean-Pierre Dubois arriving today at 14:30", time: "1 hr ago", read: true, role: "receptionist" },
  { id: "N4", type: "cleaning", title: "Urgent Cleaning", message: "Room 102 needs deep cleaning before 14:00", time: "30 min ago", read: false, role: "housekeeping" },
  { id: "N5", type: "alert", title: "Visa Expiry Warning", message: "Guest Amara Osei's visa expires in 5 days", time: "2 hrs ago", read: false, role: "receptionist" },
  { id: "N6", type: "emergency", title: "Emergency Alert", message: "Medical emergency reported in Room 301", time: "5 min ago", read: false, role: "all" },
  { id: "N7", type: "booking", title: "Booking Cancelled", message: "Booking BK-2026-006 marked as no-show", time: "3 hrs ago", read: true, role: "receptionist" },
  { id: "N8", type: "payment", title: "Refund Processed", message: "₹2,800 refunded for BK-2026-006", time: "3 hrs ago", read: true, role: "finance" },
];

// ─── SERVICE REQUESTS ───
export interface ServiceRequest {
  id: string;
  guestName: string;
  roomNumber: string;
  type: string;
  description: string;
  status: "open" | "in_progress" | "resolved";
  priority: "low" | "medium" | "high";
  createdAt: string;
}

export const SERVICE_REQUESTS: ServiceRequest[] = [
  { id: "SR-001", guestName: "Aisha Mohammed", roomNumber: "102", type: "Housekeeping", description: "Extra pillows and blankets needed", status: "open", priority: "medium", createdAt: "2026-03-10 08:30" },
  { id: "SR-002", guestName: "Amara Osei", roomNumber: "208", type: "Maintenance", description: "AC not cooling properly", status: "in_progress", priority: "high", createdAt: "2026-03-09 22:15" },
  { id: "SR-003", guestName: "Aisha Mohammed", roomNumber: "102", type: "Transport", description: "Daily cab to Medanta at 9 AM", status: "resolved", priority: "medium", createdAt: "2026-03-09 18:00" },
  { id: "SR-004", guestName: "Abdullah Al-Rashid", roomNumber: "403", type: "Food", description: "Halal meal options for dinner", status: "open", priority: "medium", createdAt: "2026-03-10 07:45" },
  { id: "SR-005", guestName: "Layla Hassan", roomNumber: "312", type: "Medical", description: "Need wheelchair for hospital visit", status: "open", priority: "high", createdAt: "2026-03-10 09:00" },
];

// ─── AUDIT LOGS ───
export interface AuditLog {
  id: string;
  action: string;
  user: string;
  role: string;
  timestamp: string;
  details: string;
  ip: string;
}

export const AUDIT_LOGS: AuditLog[] = [
  { id: "AL-001", action: "LOGIN", user: "admin@stayonstay.com", role: "Admin", timestamp: "2026-03-10 09:00:12", details: "Successful login", ip: "103.21.58.142" },
  { id: "AL-002", action: "BOOKING_CREATED", user: "reception@stayonstay.com", role: "Receptionist", timestamp: "2026-03-10 09:15:34", details: "Booking BK-2026-007 created for Layla Hassan", ip: "49.36.128.91" },
  { id: "AL-003", action: "PASSPORT_VIEWED", user: "reception@stayonstay.com", role: "Receptionist", timestamp: "2026-03-10 09:20:11", details: "Viewed passport for Amara Osei", ip: "49.36.128.91" },
  { id: "AL-004", action: "PAYMENT_PROCESSED", user: "finance@stayonstay.com", role: "Finance", timestamp: "2026-03-10 08:45:00", details: "Payment of ₹67,500 processed for BK-2026-001", ip: "182.74.55.210" },
  { id: "AL-005", action: "ROOM_STATUS_CHANGED", user: "housekeeping@stayonstay.com", role: "Housekeeping", timestamp: "2026-03-10 07:30:22", details: "Room 108 marked as clean", ip: "14.139.60.15" },
  { id: "AL-006", action: "EXPORT_FRRO", user: "senior.reception@stayonstay.com", role: "Sr. Receptionist", timestamp: "2026-03-09 16:00:00", details: "FRRO data exported for 12 guests", ip: "49.36.128.91" },
  { id: "AL-007", action: "REFUND_APPROVED", user: "finance@stayonstay.com", role: "Finance", timestamp: "2026-03-09 15:30:00", details: "Refund of ₹2,800 approved for BK-2026-006", ip: "182.74.55.210" },
];

// ─── COMPLIANCE ───
export const FRRO_RECORDS = [
  { guestName: "Aisha Mohammed", nationality: "UAE", passportNumber: "AE****4321", visaType: "Medical Visa", visaExpiry: "2026-06-15", registrationDate: "2026-03-10", status: "Registered" },
  { guestName: "Jean-Pierre Dubois", nationality: "France", passportNumber: "FR****8765", visaType: "Medical Visa", visaExpiry: "2026-04-20", registrationDate: "2026-03-12", status: "Pending" },
  { guestName: "Amara Osei", nationality: "Kenya", passportNumber: "KE****5678", visaType: "Medical Visa", visaExpiry: "2026-03-25", registrationDate: "2026-03-08", status: "Registered" },
  { guestName: "Abdullah Al-Rashid", nationality: "Saudi Arabia", passportNumber: "SA****1234", visaType: "Medical Visa", visaExpiry: "2026-07-10", registrationDate: "2026-03-15", status: "Pending" },
  { guestName: "Layla Hassan", nationality: "Egypt", passportNumber: "EG****7890", visaType: "Medical Visa", visaExpiry: "2026-05-30", registrationDate: "2026-03-14", status: "Pending" },
];

// ─── INCIDENTS & SAFETY ───
export interface Incident {
  id: string;
  type: "medical_emergency" | "security" | "complaint" | "fraud" | "maintenance";
  title: string;
  description: string;
  reportedBy: string;
  status: "open" | "investigating" | "resolved" | "escalated";
  priority: "low" | "medium" | "high" | "critical";
  timestamp: string;
}

export const INCIDENTS: Incident[] = [
  { id: "INC-001", type: "medical_emergency", title: "Guest fainted in lobby", description: "Guest in Room 301 fainted near reception. Ambulance called.", reportedBy: "Priya Sharma", status: "resolved", priority: "critical", timestamp: "2026-03-09 14:22" },
  { id: "INC-002", type: "complaint", title: "Noise complaint", description: "Guest in Room 205 reported loud noise from adjacent room.", reportedBy: "Rajesh Kumar", status: "resolved", priority: "low", timestamp: "2026-03-08 23:15" },
  { id: "INC-003", type: "fraud", title: "Suspicious booking pattern", description: "Multiple bookings from same IP with different identities.", reportedBy: "System", status: "investigating", priority: "high", timestamp: "2026-03-10 06:30" },
  { id: "INC-004", type: "security", title: "Unauthorized floor access", description: "Unregistered person found on 4th floor.", reportedBy: "Vikram Singh", status: "open", priority: "high", timestamp: "2026-03-10 08:45" },
  { id: "INC-005", type: "maintenance", title: "Water leak in Room 410", description: "Bathroom pipe leak causing water damage.", reportedBy: "Sunita Devi", status: "investigating", priority: "medium", timestamp: "2026-03-10 07:00" },
];

// ─── PLATFORM USERS (for admin) ───
export const PLATFORM_USERS = [
  { id: "U1", name: "Aisha Mohammed", email: "customer@stayonstay.com", role: "Customer", status: "active", lastLogin: "2026-03-10 08:00", bookings: 3 },
  { id: "U2", name: "Priya Sharma", email: "reception@stayonstay.com", role: "Receptionist", status: "active", lastLogin: "2026-03-10 07:30", bookings: 0 },
  { id: "U3", name: "Rajesh Kumar", email: "senior.reception@stayonstay.com", role: "Sr. Receptionist", status: "active", lastLogin: "2026-03-10 07:00", bookings: 0 },
  { id: "U4", name: "Sunita Devi", email: "housekeeping@stayonstay.com", role: "Housekeeping", status: "active", lastLogin: "2026-03-10 06:00", bookings: 0 },
  { id: "U5", name: "Vikram Singh", email: "transport@stayonstay.com", role: "Transport Manager", status: "active", lastLogin: "2026-03-10 07:15", bookings: 0 },
  { id: "U6", name: "Ananya Gupta", email: "finance@stayonstay.com", role: "Finance Manager", status: "active", lastLogin: "2026-03-10 08:30", bookings: 0 },
  { id: "U7", name: "Deepak Malhotra", email: "owner@stayonstay.com", role: "Hotel Owner", status: "active", lastLogin: "2026-03-09 22:00", bookings: 0 },
  { id: "U8", name: "System Admin", email: "admin@stayonstay.com", role: "Platform Admin", status: "active", lastLogin: "2026-03-10 09:00", bookings: 0 },
];
