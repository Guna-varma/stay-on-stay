import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { countAvailableRooms, getPublicHotelDetail, invokeCreateCheckoutSession } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { computeStayPricing, pricingTierLabel } from "@/lib/pricing";

export default function Checkout() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const hotelId = params.get("hotelId") ?? "";
  const roomTypeId = params.get("roomTypeId") ?? "";
  const checkIn = params.get("checkIn") ?? "";
  const checkOut = params.get("checkOut") ?? "";
  const [hotelName, setHotelName] = useState("Hotel");
  const [roomTypeName, setRoomTypeName] = useState("Room");
  const [roomTypeRow, setRoomTypeRow] = useState<{
    final_price: number | null;
    base_price: number | null;
    weekly_nightly_rate: number | null;
    monthly_nightly_rate: number | null;
  } | null>(null);
  const [guestFirstName, setGuestFirstName] = useState(user?.firstName ?? "");
  const [guestLastName, setGuestLastName] = useState(user?.lastName ?? "");
  const [guestEmail, setGuestEmail] = useState(user?.email ?? "");
  const [guestPhone, setGuestPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [available, setAvailable] = useState<number | null>(null);

  useEffect(() => {
    getPublicHotelDetail(hotelId).then(({ data }) => {
      if (!data) return;
      setHotelName(data.name);
      const rt = data.room_types.find((r) => r.id === roomTypeId);
      if (rt) {
        setRoomTypeName(rt.name);
        setRoomTypeRow({
          final_price: rt.final_price,
          base_price: rt.base_price,
          weekly_nightly_rate: rt.weekly_nightly_rate,
          monthly_nightly_rate: rt.monthly_nightly_rate,
        });
      }
    });
    countAvailableRooms(roomTypeId, checkIn, checkOut).then(({ data }) => setAvailable(data));
  }, [checkIn, checkOut, hotelId, roomTypeId]);

  const nights = useMemo(
    () => Math.max(1, Math.round((new Date(`${checkOut}T12:00:00Z`).getTime() - new Date(`${checkIn}T12:00:00Z`).getTime()) / 86400000)),
    [checkIn, checkOut],
  );
  const stayPricing = useMemo(() => {
    if (!roomTypeRow) {
      return { effectiveNightly: 0, listSubtotal: 0, tier: "standard" as const, lineTotal: 0 };
    }
    const fp = Number(roomTypeRow.final_price ?? roomTypeRow.base_price ?? 0);
    return computeStayPricing({
      finalPrice: fp,
      weeklyNightly: roomTypeRow.weekly_nightly_rate,
      monthlyNightly: roomTypeRow.monthly_nightly_rate,
      nights,
    });
  }, [roomTypeRow, nights]);
  const total = stayPricing.lineTotal;

  const onPay = async () => {
    if (!guestFirstName.trim() || !guestEmail.trim() || !guestPhone.trim()) {
      toast.error("Please fill required guest details");
      return;
    }
    if ((available ?? 0) < 1) {
      toast.error("This room just sold out. Please pick another room type.");
      return;
    }
    setSubmitting(true);
    const { data, error } = await invokeCreateCheckoutSession({
      room_type_id: roomTypeId,
      check_in_date: checkIn,
      check_out_date: checkOut,
      success_url: `${window.location.origin}/booking/success`,
      cancel_url: `${window.location.origin}/booking/cancel`,
      booker_id: user?.id ?? "",
      guest_first_name: guestFirstName,
      guest_last_name: guestLastName,
      guest_email: guestEmail,
      guest_phone: guestPhone,
    });
    setSubmitting(false);
    if (error || !data?.url) {
      toast.error((data?.error as string) || error?.message || "Unable to create checkout session");
      return;
    }
    window.location.href = data.url;
  };

  if (!hotelId || !roomTypeId || !checkIn || !checkOut) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 text-center py-12">
        <h1 className="text-2xl font-heading font-bold">Invalid checkout link</h1>
        <p className="text-muted-foreground text-sm">Missing hotel, room, or date information.</p>
        <Button onClick={() => navigate("/hotels")}>Browse Hotels</Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-heading font-bold">Checkout</h1>
      <Card>
        <CardHeader><CardTitle>{hotelName} - {roomTypeName}</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between"><span>Dates</span><span>{checkIn} to {checkOut}</span></div>
          <div className="flex justify-between"><span>Effective rate</span><span>₹{stayPricing.effectiveNightly.toLocaleString()} / night</span></div>
          <div className="flex justify-between text-xs text-muted-foreground"><span>{pricingTierLabel(stayPricing.tier)}</span><span>{nights} night(s)</span></div>
          {stayPricing.tier !== "standard" && stayPricing.listSubtotal > stayPricing.lineTotal && (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Catalog at standard rate</span>
              <span className="line-through">₹{stayPricing.listSubtotal.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold"><span>Total</span><span>₹{total.toLocaleString()}</span></div>
          {available != null && available <= 2 && available > 0 && <p className="text-warning text-xs">Almost sold out - only {available} left.</p>}
          {available === 0 && <p className="text-destructive text-xs">This room type is currently unavailable.</p>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Guest details</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Input placeholder="First name *" value={guestFirstName} onChange={(e) => setGuestFirstName(e.target.value)} />
          <Input placeholder="Last name" value={guestLastName} onChange={(e) => setGuestLastName(e.target.value)} />
          <Input placeholder="Email *" type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} />
          <Input placeholder="Phone *" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} />
        </CardContent>
      </Card>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => navigate(-1)}>Back</Button>
        <Button onClick={onPay} disabled={submitting || available === 0}>{submitting ? "Redirecting..." : "Proceed to Payment"}</Button>
      </div>
    </div>
  );
}
