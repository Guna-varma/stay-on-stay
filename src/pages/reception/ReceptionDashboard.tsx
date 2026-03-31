import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, BedDouble, Building2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import {
  getManagerAssignedHotel,
  isSupabaseConfigured,
  listRoomsByHotel,
  updateRoomStatus,
  type HotelRecord,
  type RoomRecord,
  type RoomStatus,
} from "@/lib/supabase";

const statusStyles: Record<RoomStatus, string> = {
  available: "bg-success/10 text-success border-success/20 hover:bg-success/20",
  occupied: "bg-destructive/10 text-destructive border-destructive/20",
  maintenance: "bg-warning/10 text-warning border-warning/20",
  cleaning: "bg-info/10 text-info border-info/20",
};

export default function ReceptionDashboard() {
  const { user } = useAuth();
  const hasSupabase = isSupabaseConfigured();
  const [loading, setLoading] = useState(true);
  const [hotel, setHotel] = useState<HotelRecord | null>(null);
  const [rooms, setRooms] = useState<RoomRecord[]>([]);
  const [savingRoomId, setSavingRoomId] = useState<string | null>(null);

  const refreshData = async () => {
    if (!user?.id || !hasSupabase) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const assigned = await getManagerAssignedHotel(user.id);
    if (assigned.error) {
      toast.error(assigned.error.message || "Failed to load assigned hotel");
      setLoading(false);
      return;
    }

    if (!assigned.data) {
      setHotel(null);
      setRooms([]);
      setLoading(false);
      return;
    }

    setHotel(assigned.data);
    const roomRes = await listRoomsByHotel(assigned.data.id);
    if (roomRes.error) {
      toast.error(roomRes.error.message || "Failed to load rooms");
      setLoading(false);
      return;
    }

    setRooms(roomRes.data);
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, [user?.id, hasSupabase]);

  const stats = useMemo(() => {
    const available = rooms.filter((r) => r.status === "available").length;
    const occupied = rooms.filter((r) => r.status === "occupied").length;
    const maintenance = rooms.filter((r) => r.status === "maintenance").length;
    const cleaning = rooms.filter((r) => r.status === "cleaning").length;

    return [
      { label: "Total Rooms", value: rooms.length, icon: BedDouble, color: "text-primary" },
      { label: "Available", value: available, icon: CheckCircle, color: "text-success" },
      { label: "Occupied", value: occupied, icon: Building2, color: "text-destructive" },
      { label: "Needs Attention", value: maintenance + cleaning, icon: AlertTriangle, color: "text-warning" },
    ];
  }, [rooms]);

  const cycleStatus = async (room: RoomRecord) => {
    const order: RoomStatus[] = ["available", "occupied", "cleaning", "maintenance"];
    const currentIndex = order.indexOf(room.status);
    const nextStatus = order[(currentIndex + 1) % order.length];

    setSavingRoomId(room.id);
    const { error } = await updateRoomStatus(room.id, nextStatus);
    setSavingRoomId(null);

    if (error) {
      toast.error(error.message || "Unable to update room status");
      return;
    }

    setRooms((prev) => prev.map((r) => (r.id === room.id ? { ...r, status: nextStatus } : r)));
    toast.success(`Room ${room.room_number} set to ${nextStatus}`);
  };

  if (!hasSupabase) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-heading font-bold">Manager Dashboard</h1>
        <Card><CardContent className="p-6 text-sm text-muted-foreground">Supabase is not configured. Manager hotel APIs are disabled.</CardContent></Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-heading font-bold">Manager Dashboard</h1>
        <Card><CardContent className="p-6 text-sm text-muted-foreground">Loading assigned hotel...</CardContent></Card>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-heading font-bold">Manager Dashboard</h1>
        <Card><CardContent className="p-6 text-sm text-muted-foreground">No hotel is assigned to this manager account.</CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold">Manager Dashboard</h1>
        <Badge className="bg-primary/10 text-primary">{hotel.name}</Badge>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card><CardContent className="p-4 flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-muted ${s.color}`}><s.icon className="h-5 w-5" /></div>
              <div><p className="text-2xl font-heading font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
            </CardContent></Card>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="rooms">
        <TabsList>
          <TabsTrigger value="rooms">Room Grid</TabsTrigger>
        </TabsList>

        <TabsContent value="rooms" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">{hotel.name} - Live Room Status</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {rooms.map((room) => (
                  <button
                    key={room.id}
                    className={`rounded-lg border p-2 text-center text-xs font-mono transition-colors ${statusStyles[room.status]}`}
                    onClick={() => cycleStatus(room)}
                    disabled={savingRoomId === room.id}
                    title="Click to cycle status"
                  >
                    {savingRoomId === room.id ? "..." : room.room_number}
                  </button>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span>Click a room tile to cycle status in order: available, occupied, cleaning, maintenance</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


