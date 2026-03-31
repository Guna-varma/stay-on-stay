import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { invokeVerifyCheckoutSession } from "@/lib/supabase";

export default function BookingSuccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = params.get("session_id") ?? "";
  const [status, setStatus] = useState("Verifying payment...");
  const [booking, setBooking] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setStatus("Missing Stripe session id.");
      return;
    }
    invokeVerifyCheckoutSession(sessionId).then(({ data, error }) => {
      if (error || !data) {
        setStatus("Unable to verify your booking right now. Please contact support.");
        return;
      }
      const s = String(data.status ?? "");
      if (s === "confirmed") {
        setStatus("Booking confirmed.");
        setBooking((data.booking as Record<string, unknown>) ?? null);
        return;
      }
      if (s === "paid_no_booking") {
        setStatus("Payment received. We are finalizing your booking, please check back shortly.");
        return;
      }
      setStatus(`Payment status: ${s}`);
    });
  }, [sessionId]);

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-heading font-bold">Booking Status</h1>
      <Card>
        <CardHeader><CardTitle>{status}</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {booking && (
            <>
              <p>Booking ID: {String(booking.id ?? "-")}</p>
              <p>Hotel: {String(booking.hotel_name_snapshot ?? "-")}</p>
              <p>Room Type: {String(booking.room_type_name_snapshot ?? "-")}</p>
              <p>Dates: {String(booking.check_in_date ?? "-")} to {String(booking.check_out_date ?? "-")}</p>
            </>
          )}
          {!booking && <p>Session: {sessionId || "-"}</p>}
          <div className="pt-2 flex gap-2">
            <Button onClick={() => navigate("/bookings")}>My Bookings</Button>
            <Button variant="outline" onClick={() => navigate("/hotels")}>Book Another Stay</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
