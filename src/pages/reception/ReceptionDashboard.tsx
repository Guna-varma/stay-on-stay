import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
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
import { useReceptionState } from "@/pages/reception/useReceptionState";
import { ReceptionHub, type HubTab } from "@/pages/reception/ReceptionHub";
import { VerificationsPanel } from "@/pages/reception/panels/VerificationsPanel";
import { StaffPanel } from "@/pages/reception/panels/StaffPanel";
import { ReportsPanel } from "@/pages/reception/panels/ReportsPanel";

function pathToHubTab(pathname: string): HubTab {
  if (pathname === "/checkin") return "checkins";
  if (pathname === "/rooms") return "room-grid";
  if (pathname === "/services") return "services";
  return "checkins";
}

export default function ReceptionDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const pathname = location.pathname;
  const hasSupabase = isSupabaseConfigured();
  const ops = useReceptionState();

  const [loading, setLoading] = useState(true);
  const [hotel, setHotel] = useState<HotelRecord | null>(null);
  const [rooms, setRooms] = useState<RoomRecord[]>([]);
  const [savingRoomId, setSavingRoomId] = useState<string | null>(null);

  const refreshHotelRooms = useCallback(async () => {
    if (!user?.id || !hasSupabase) {
      setHotel(null);
      setRooms([]);
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
      setRooms([]);
    } else {
      setRooms(roomRes.data);
    }
    setLoading(false);
  }, [user?.id, hasSupabase]);

  useEffect(() => {
    refreshHotelRooms();
  }, [refreshHotelRooms]);

  const cycleStatus = useCallback(
    async (room: RoomRecord) => {
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
      toast.success(`Room ${room.room_number} → ${nextStatus}`);
    },
    [],
  );

  const hubTab = useMemo(() => pathToHubTab(pathname), [pathname]);
  const hasLiveHotel = Boolean(hotel && rooms.length > 0);

  if (!hasSupabase) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-heading font-bold">Operations</h1>
        <p className="text-sm text-muted-foreground">
          Connect Supabase to load assigned property and live room status. Demo data still visible in UI when
          configured.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-heading font-bold">Operations</h1>
        <p className="text-sm text-muted-foreground">Loading property…</p>
      </div>
    );
  }

  if (pathname === "/verifications") {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-heading font-bold">Verifications</h1>
        <VerificationsPanel rows={ops.verifications} onApprove={ops.approveVerification} />
      </div>
    );
  }

  if (pathname === "/staff") {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-heading font-bold">Staff assignment</h1>
        <StaffPanel />
      </div>
    );
  }

  if (pathname === "/reports") {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-heading font-bold">Reports</h1>
        <ReportsPanel />
      </div>
    );
  }

  return (
    <ReceptionHub
      initialTab={hubTab}
      ops={ops}
      hotel={hotel}
      rooms={rooms}
      hasLiveHotel={hasLiveHotel}
      savingRoomId={savingRoomId}
      onCycleRoom={cycleStatus}
    />
  );
}
