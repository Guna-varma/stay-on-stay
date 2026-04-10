import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SEED_PROPERTY_GRIDS } from "@/data/operations-seed";
import type { PropertyRoomGrid, RoomTileStatus } from "@/lib/operations-types";
import type { RoomRecord, RoomStatus } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const tileStyles: Record<RoomTileStatus, string> = {
  available: "bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100/80",
  booked: "bg-rose-100 text-rose-900 border-rose-200",
  occupied: "bg-rose-100 text-rose-900 border-rose-200",
  maintenance: "bg-slate-200 text-slate-700 border-slate-300",
  cleaning: "bg-amber-50 text-amber-900 border-amber-200",
};

function mapLiveStatus(s: RoomStatus): RoomTileStatus {
  if (s === "occupied") return "occupied";
  if (s === "maintenance") return "maintenance";
  if (s === "cleaning") return "cleaning";
  return "available";
}

interface Props {
  liveHotelName: string | null;
  liveRooms: RoomRecord[] | null;
  onLiveRoomClick?: (room: RoomRecord) => void;
  liveSavingId?: string | null;
}

export function RoomGridPanel({ liveHotelName, liveRooms, onLiveRoomClick, liveSavingId }: Props) {
  const liveSection: PropertyRoomGrid | null =
    liveHotelName && liveRooms && liveRooms.length > 0
      ? {
          id: "live",
          name: liveHotelName,
          rooms: liveRooms.map((r) => ({
            number: r.room_number,
            status: mapLiveStatus(r.status),
          })),
        }
      : null;

  const sections: PropertyRoomGrid[] = liveSection
    ? [liveSection, ...SEED_PROPERTY_GRIDS.filter((p) => p.id !== "p1")]
    : [...SEED_PROPERTY_GRIDS];

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <Card key={section.id} className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">{section.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {section.rooms.map((cell) => {
                const live = liveRooms?.find((r) => r.room_number === cell.number && section.id === "live");
                return (
                  <button
                    key={`${section.id}-${cell.number}`}
                    type="button"
                    disabled={!live || !onLiveRoomClick}
                    title={live && onLiveRoomClick ? "Click to cycle status" : undefined}
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
          <span className="h-3 w-3 rounded bg-rose-200" /> Booked / Occupied
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-slate-300" /> Maintenance
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-amber-200" /> Cleaning
        </span>
      </div>
    </div>
  );
}
