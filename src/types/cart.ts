/** Single item in the booking cart (guest: localStorage; logged-in: sync to DB later) */
export interface CartItem {
  hotel_id: string;
  room_id: string;
  check_in: string;   // ISO date or dd-MM-yyyy
  check_out: string;
  guests: number;
  price: number;      // total or per night depending on your model
  /** Optional: hotel/room display info for tray UI */
  hotel_name?: string;
  room_label?: string;
}

export const CART_STORAGE_KEY = "sos_booking_cart";
