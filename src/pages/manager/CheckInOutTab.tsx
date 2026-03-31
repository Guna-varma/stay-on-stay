import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, UserCheck, UserX, Calendar } from "lucide-react";
import { toast } from "sonner";
import { supabase, checkInGuest, checkOutGuest } from "@/lib/supabase";

interface CheckInOutTabProps {
  hotelId: string;
}

interface Booking {
  id: string;
  check_in_date: string;
  check_out_date: string;
  status: string;
  room_id: string;
  hotel_name_snapshot: string;
  room_type_name_snapshot: string;
  guest: { first_name: string; last_name: string } | null;
  rooms: { room_number: string } | null;
}

export default function CheckInOutTab({ hotelId }: CheckInOutTabProps) {
  const [checkIns, setCheckIns] = useState<Booking[]>([]);
  const [checkOuts, setCheckOuts] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadBookings();
  }, [hotelId]);

  const loadBookings = async () => {
    setLoading(true);

    const today = new Date().toISOString().split('T')[0];

    const [checkInsRes, checkOutsRes] = await Promise.all([
      supabase
        .from("bookings")
        .select(`
          id, check_in_date, check_out_date, status, room_id, hotel_name_snapshot, room_type_name_snapshot,
          guests:guest_id(first_name, last_name),
          rooms:room_id(room_number)
        `)
        .eq("hotel_id", hotelId)
        .eq("check_in_date", today)
        .eq("status", "confirmed")
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),
      
      supabase
        .from("bookings")
        .select(`
          id, check_in_date, check_out_date, status, room_id, hotel_name_snapshot, room_type_name_snapshot,
          guests:guest_id(first_name, last_name),
          rooms:room_id(room_number)
        `)
        .eq("hotel_id", hotelId)
        .eq("check_out_date", today)
        .eq("status", "checked_in")
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),
    ]);

    setCheckIns((checkInsRes.data as any) || []);
    setCheckOuts((checkOutsRes.data as any) || []);
    setLoading(false);
  };

  const handleCheckIn = async (bookingId: string, roomId: string) => {
    const { error } = await checkInGuest(bookingId, roomId);
    if (error) {
      toast.error("Failed to check-in guest");
      return;
    }
    toast.success("Guest checked in successfully");
    loadBookings();
  };

  const handleCheckOut = async (bookingId: string, roomId: string) => {
    const { error } = await checkOutGuest(bookingId, roomId);
    if (error) {
      toast.error("Failed to check-out guest");
      return;
    }
    toast.success("Guest checked out successfully. Cleaning task created.");
    loadBookings();
  };

  const filterBookings = (bookings: Booking[]) => {
    if (!searchTerm) return bookings;
    return bookings.filter(b => {
      const guestName = b.guest ? `${b.guest.first_name} ${b.guest.last_name}`.toLowerCase() : '';
      const roomNumber = b.rooms?.room_number?.toLowerCase() || '';
      return guestName.includes(searchTerm.toLowerCase()) || roomNumber.includes(searchTerm.toLowerCase());
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by guest name or room..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <Tabs defaultValue="checkin">
        <TabsList>
          <TabsTrigger value="checkin">
            <UserCheck className="h-4 w-4 mr-2" />
            Check-Ins Today ({checkIns.length})
          </TabsTrigger>
          <TabsTrigger value="checkout">
            <UserX className="h-4 w-4 mr-2" />
            Check-Outs Today ({checkOuts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="checkin">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Today's Check-Ins</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}
                </div>
              ) : filterBookings(checkIns).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No check-ins scheduled for today
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Guest</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Room Type</TableHead>
                      <TableHead>Check-Out Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filterBookings(checkIns).map(booking => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">
                          {booking.guest ? `${booking.guest.first_name} ${booking.guest.last_name}` : '—'}
                        </TableCell>
                        <TableCell>{booking.rooms?.room_number || '—'}</TableCell>
                        <TableCell>{booking.room_type_name_snapshot}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3" />
                            {new Date(booking.check_out_date).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-info/10 text-info">Confirmed</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => handleCheckIn(booking.id, booking.room_id)}
                            className="bg-success hover:bg-success/90"
                          >
                            <UserCheck className="h-4 w-4 mr-2" />
                            Check In
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checkout">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Today's Check-Outs</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}
                </div>
              ) : filterBookings(checkOuts).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No check-outs scheduled for today
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Guest</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Room Type</TableHead>
                      <TableHead>Check-In Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filterBookings(checkOuts).map(booking => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">
                          {booking.guest ? `${booking.guest.first_name} ${booking.guest.last_name}` : '—'}
                        </TableCell>
                        <TableCell>{booking.rooms?.room_number || '—'}</TableCell>
                        <TableCell>{booking.room_type_name_snapshot}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3" />
                            {new Date(booking.check_in_date).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-success/10 text-success">Checked In</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => handleCheckOut(booking.id, booking.room_id)}
                            variant="outline"
                          >
                            <UserX className="h-4 w-4 mr-2" />
                            Check Out
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
