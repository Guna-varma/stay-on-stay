import { useParams, useNavigate } from "react-router-dom";
import { HOTELS } from "@/data/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Star, Wifi, Users, Accessibility, HeartPulse, Calendar } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const statusColors: Record<string, string> = {
  available: "bg-success text-success-foreground",
  booked: "bg-destructive text-destructive-foreground",
  maintenance: "bg-muted text-muted-foreground",
};

export default function HotelDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const hotel = HOTELS.find(h => h.id === id);
  const [bookingRoom, setBookingRoom] = useState<string | null>(null);

  if (!hotel) return <div className="p-8 text-center text-muted-foreground">Hotel not found</div>;

  const handleBook = () => {
    toast.success("Booking Confirmed!", { description: "Your booking has been created successfully. Check My Bookings for details." });
    setBookingRoom(null);
    navigate("/bookings");
  };

  return (
    <div className="space-y-6">
      <button onClick={() => navigate("/hotels")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Back to Hotels</button>

      {/* Hero */}
      <div className="relative rounded-xl overflow-hidden h-48 sm:h-64">
        <img src={hotel.image} alt={hotel.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="text-2xl font-heading font-bold text-white">{hotel.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-white/80 text-sm flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{hotel.address}</span>
            <span className="text-white flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-warning text-warning" />{hotel.rating}</span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="rooms">
        <TabsList>
          <TabsTrigger value="rooms">Rooms ({hotel.rooms.length})</TabsTrigger>
          <TabsTrigger value="amenities">Amenities</TabsTrigger>
          <TabsTrigger value="nearby">Nearby</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="rooms" className="mt-4 space-y-4">
          {/* Availability Legend */}
          <div className="flex gap-4 text-xs">
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-success" /> Available</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-destructive" /> Booked</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-muted-foreground" /> Maintenance</span>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {hotel.rooms.map(room => (
              <Card key={room.id} className="hover:shadow-elevated transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-heading font-semibold">Room {room.number}</h3>
                        <Badge className={statusColors[room.status]} variant="secondary">{room.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{room.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-heading font-bold text-primary">₹{room.pricePerNight.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">/night</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" /> Capacity: {room.capacity} guests
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Accessibility className="h-3 w-3" /> {room.accessibility[0]}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <HeartPulse className="h-3 w-3" /> {room.medicalFacilities[0]}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {room.amenities.slice(0, 4).map(a => <Badge key={a} variant="outline" className="text-[9px]">{a}</Badge>)}
                  </div>

                  {room.longStayDiscount > 0 && (
                    <p className="text-[10px] text-success font-medium mb-3">🏷 {room.longStayDiscount}% off for stays over 7 nights</p>
                  )}

                  <Dialog open={bookingRoom === room.id} onOpenChange={(open) => setBookingRoom(open ? room.id : null)}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="w-full" disabled={room.status !== "available"}>
                        {room.status === "available" ? "Book Now" : room.status === "booked" ? "Unavailable" : "Under Maintenance"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle className="font-heading">Book Room {room.number}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-2">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Check-in</label>
                            <Input type="date" defaultValue="2026-03-15" />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Check-out</label>
                            <Input type="date" defaultValue="2026-03-30" />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">Number of Guests</label>
                          <Input type="number" defaultValue={2} min={1} max={room.capacity} />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">Passport Number</label>
                          <Input placeholder="Enter passport number" />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">Medical Companion (optional)</label>
                          <Input placeholder="Companion name" />
                        </div>
                        <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                          <div className="flex justify-between text-sm"><span>15 nights × ₹{room.pricePerNight.toLocaleString()}</span><span>₹{(15 * room.pricePerNight).toLocaleString()}</span></div>
                          <div className="flex justify-between text-sm text-success"><span>Long-stay discount ({room.longStayDiscount}%)</span><span>-₹{Math.round(15 * room.pricePerNight * room.longStayDiscount / 100).toLocaleString()}</span></div>
                          <div className="flex justify-between text-sm font-bold border-t pt-1"><span>Total</span><span>₹{Math.round(15 * room.pricePerNight * (1 - room.longStayDiscount / 100)).toLocaleString()}</span></div>
                        </div>
                        <Button className="w-full" onClick={handleBook}>Confirm Booking</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="amenities" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {hotel.amenities.map(a => (
                  <div key={a} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                    <Wifi className="h-4 w-4 text-primary" />
                    <span className="text-sm">{a}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nearby" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <h4 className="font-heading font-semibold text-sm mb-1">{hotel.nearbyHospital}</h4>
                  <p className="text-xs text-muted-foreground">{hotel.distanceKm}km away · ~{Math.round(hotel.distanceKm * 4)} min by car</p>
                </div>
                {hotel.nearbyPlaces.map(p => (
                  <div key={p.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.type}</p>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">{p.distance}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="mt-4">
          <Card>
            <CardContent className="p-6 space-y-4">
              {[
                { name: "Sarah K.", rating: 5, text: "Excellent location near the hospital. Staff was very helpful with our medical needs.", date: "Feb 2026" },
                { name: "Mohammed A.", rating: 4, text: "Clean rooms, good amenities. The translator service was a lifesaver.", date: "Jan 2026" },
                { name: "Claire D.", rating: 5, text: "Perfect for our 3-week stay during treatment. Felt like home.", date: "Dec 2025" },
              ].map((r, i) => (
                <div key={i} className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{r.name}</span>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: r.rating }).map((_, j) => <Star key={j} className="h-3 w-3 fill-warning text-warning" />)}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{r.text}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{r.date}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
