import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PropertyRoomGrid, RoomTileStatus } from "@/lib/operations-types";
import type { RoomAvailabilityRecord, RoomHoldRecord, RoomRecord, RoomStatus } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const tileStyles: Record<RoomTileStatus, string> = {
  available: "bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100/80",
  held_self: "bg-sky-50 text-sky-900 border-sky-200 hover:bg-sky-100/80",
  held_other: "bg-amber-50 text-amber-900 border-amber-200",
  booked: "bg-rose-100 text-rose-900 border-rose-200",
  occupied: "bg-rose-100 text-rose-900 border-rose-200",
  maintenance: "bg-slate-200 text-slate-700 border-slate-300",
  cleaning: "bg-amber-50 text-amber-900 border-amber-200",
};

function mapAvailabilityStateToTile(state: RoomAvailabilityRecord["effective_room_state"]): RoomTileStatus {
  if (state === "blocked") return "maintenance";
  if (state === "checkout_due" || state === "booked") return "booked";
  if (state === "occupied") return "occupied";
  if (state === "cleaning") return "cleaning";
  return "available";
}

function mapLiveStatus(s: RoomStatus, hold: RoomHoldRecord | null, currentUserId?: string | null): RoomTileStatus {
  if (s === "occupied") return "occupied";
  if (s === "maintenance") return "maintenance";
  if (s === "cleaning") return "cleaning";
  if (hold) return hold.held_by === currentUserId ? "held_self" : "held_other";
  return "available";
}

interface Props {
  liveHotelName: string | null;
  liveRooms: RoomRecord[] | null;
  liveAvailability?: RoomAvailabilityRecord[];
  liveHolds?: RoomHoldRecord[];
  currentUserId?: string | null;
  onLiveRoomClick?: (room: RoomRecord) => void;
  liveSavingId?: string | null;
}

export function RoomGridPanel({
  liveHotelName,
  liveRooms,
  liveAvailability = [],
  liveHolds = [],
  currentUserId,
  onLiveRoomClick,
  liveSavingId,
}: Props) {
  const sections: PropertyRoomGrid[] =
    liveHotelName && liveRooms && liveRooms.length > 0
      ? [
          {
            id: "live",
            name: liveHotelName,
            rooms: liveRooms.map((r) => ({
              number: r.room_number,
              status: (() => {
                const hold =
                  liveHolds.find(
                    (item) =>
                      item.room_id === r.id && item.status === "active" && new Date(item.expires_at).getTime() > Date.now(),
                  ) ?? null;
                const availability = liveAvailability.find((item) => item.room_id === r.id);
                if (hold) return hold.held_by === currentUserId ? "held_self" : "held_other";
                if (availability) return mapAvailabilityStateToTile(availability.effective_room_state);
                return mapLiveStatus(r.status, null, currentUserId);
              })(),
            })),
          },
        ]
      : [];

  return (
    <div className="space-y-6">
      {sections.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 px-4 py-6 text-sm text-muted-foreground">
          No live rooms available for your assigned property.
        </div>
      ) : null}
      {sections.map((section) => (
        <Card key={section.id} className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">{section.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {section.rooms.map((cell) => {
                const live = liveRooms?.find((r) => r.room_number === cell.number && section.id === "live");
                const availability = live
                  ? liveAvailability.find((item) => item.room_id === live.id)
                  : null;
                return (
                  <button
                    key={`${section.id}-${cell.number}`}
                    type="button"
                    disabled={!live || !onLiveRoomClick || cell.status === "occupied" || cell.status === "maintenance" || cell.status === "cleaning" || cell.status === "held_other"}
                    title={
                      availability
                        ? `${availability.unavailable_reason}${availability.estimated_available_at ? ` · ETA ${new Date(availability.estimated_available_at).toLocaleTimeString()}` : ""}`
                        : live && onLiveRoomClick
                          ? "Click to start or continue a walk-in"
                          : undefined
                    }
                    onClick={() => live && onLiveRoomClick?.(live)}
                    className={cn(
                      "min-w-[3rem] rounded-lg border px-2 py-2 text-center text-sm font-mono font-medium transition-colors",
                      tileStyles[cell.status],
                      live && onLiveRoomClick && "cursor-pointer",
                      (!live || !onLiveRoomClick) && "cursor-default",
                    )}
                  >
                    {live && liveSavingId === live.id ? "…" : cell.number}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-emerald-200" /> Available
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-sky-200" /> Held by you
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-amber-200" /> Held by another user / Cleaning
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-rose-200" /> Booked / Occupied
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-slate-300" /> Maintenance
        </span>
      </div>
    </div>
  );
}
