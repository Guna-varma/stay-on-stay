import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function BookingCancel() {
  const navigate = useNavigate();
  return (
    <div className="max-w-xl mx-auto">
      <Card>
        <CardHeader><CardTitle>Payment cancelled</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>Your payment was not completed. No booking has been created.</p>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/hotels")}>Try Again</Button>
            <Button variant="outline" onClick={() => navigate("/bookings")}>My Bookings</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
