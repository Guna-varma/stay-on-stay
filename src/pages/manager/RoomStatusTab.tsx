import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { BedDouble } from "lucide-react";
import { toast } from "sonner";
import { supabase, updateRoomStatus } from "@/lib/supabase";
import { motion } from "framer-motion";

interface RoomStatusTabProps {
  hotelId: string;
}

interface Room {
  id: string;
  room_number: string;
  status: string;
  room_type_id: string;
  room_types: { name: string } | null;
}

const STATUS_OPTIONS = [
  { value: 'available', label: 'Available', color: 'bg-success' },
  { value: 'occupied', label: 'Occupied', color: 'bg-destructive' },
  { value: 'cleaning', label: 'Cleaning', color: 'bg-warning' },
  { value: 'maintenance', label: 'Maintenance', color: 'bg-muted' },
];

export default function RoomStatusTab({ hotelId }: RoomStatusTabProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    loadRooms();
  }, [hotelId]);

  const loadRooms = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("rooms")
      .select("id, room_number, status, room_type_id, room_types:room_type_id(name)")
      .eq("hotel_id", hotelId)
      .is("deleted_at", null)
      .order("room_number");

    if (error) {
      toast.error("Failed to load rooms");
      setLoading(false);
      return;
    }

    setRooms((data as any) || []);
    setLoading(false);
  };

  const handleStatusChange = async (roomId: string, newStatus: string) => {
    const { error } = await updateRoomStatus(roomId, newStatus);
    if (error) {
      toast.error("Failed to update room status");
      return;
    }
    toast.success("Room status updated");
    loadRooms();
  };

  const getStatusColor = (status: string) => {
    return STATUS_OPTIONS.find(s => s.value === status)?.color || 'bg-muted';
  };

  const filteredRooms = filterStatus === "all" ? rooms : rooms.filter(r => r.status === filterStatus);

  const statusCounts = {
    available: rooms.filter(r => r.status === 'available').length,
    occupied: rooms.filter(r => r.status === 'occupied').length,
    cleaning: rooms.filter(r => r.status === 'cleaning').length,
    maintenance: rooms.filter(r => r.status === 'maintenance').length,
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        {STATUS_OPTIONS.map((status, i) => (
          <motion.div
            key={status.value}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus(status.value)}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-2xl font-heading font-bold">
                    {statusCounts[status.value as keyof typeof statusCounts]}
                  </p>
                  <p className="text-xs text-muted-foreground">{status.label}</p>
                </div>
                <div className={`h-3 w-3 rounded-full ${status.color}`} />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Rooms</SelectItem>
            {STATUS_OPTIONS.map(s => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {filterStatus !== "all" && (
          <Button variant="ghost" size="sm" onClick={() => setFilterStatus("all")}>
            Clear Filter
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Room Grid</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {Array.from({ length: 16 }).map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No rooms found
            </div>
          ) : (
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {filteredRooms.map((room) => (
                <div
                  key={room.id}
                  className={`relative p-3 rounded-lg border-2 ${
                    room.status === 'available' ? 'border-success bg-success/5' :
                    room.status === 'occupied' ? 'border-destructive bg-destructive/5' :
                    room.status === 'cleaning' ? 'border-warning bg-warning/5' :
                    'border-muted bg-muted/5'
                  } hover:shadow-md transition-all cursor-pointer group`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <BedDouble className="h-6 w-6 text-muted-foreground" />
                    <p className="font-semibold text-sm">{room.room_number}</p>
                    <Badge variant="outline" className="text-[10px]">
                      {room.status}
                    </Badge>
                  </div>

                  <div className="absolute inset-0 bg-background/95 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg p-2 flex flex-col justify-center">
                    <p className="text-xs font-semibold mb-2 text-center">{room.room_number}</p>
                    <Select
                      value={room.status}
                      onValueChange={(v) => handleStatusChange(room.id, v)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map(s => (
                          <SelectItem key={s.value} value={s.value} className="text-xs">
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
