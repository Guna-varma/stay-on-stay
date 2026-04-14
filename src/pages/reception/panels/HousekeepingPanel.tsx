import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { HousekeepingTask, RoomTileStatus } from "@/lib/operations-types";
import type { RoomAvailabilityRecord, RoomRecord } from "@/lib/supabase";
import type { LucideIcon } from "lucide-react";
import { CheckCircle2, Clock, Sparkles, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

const tileStyles: Record<RoomTileStatus, string> = {
  available: "bg-emerald-50 text-emerald-900 border-emerald-200",
  booked: "bg-slate-100 text-slate-600 border-slate-200",
  occupied: "bg-rose-100 text-rose-900 border-rose-200",
  maintenance: "bg-slate-200 text-slate-700 border-slate-300",
  cleaning: "bg-amber-50 text-amber-900 border-amber-200",
};

interface Props {
  tasks: HousekeepingTask[];
  kpi: { pending: number; inProgress: number; completed: number; urgent: number };
  roomAvailability: RoomAvailabilityRecord[];
  rooms: RoomRecord[];
  hotelName: string | null;
  onAdvanceTask: (id: string) => void;
}

function mapAvailabilityStateToTile(state: RoomAvailabilityRecord["effective_room_state"]): RoomTileStatus {
  if (state === "blocked") return "maintenance";
  if (state === "checkout_due" || state === "booked") return "booked";
  if (state === "occupied") return "occupied";
  if (state === "cleaning") return "cleaning";
  return "available";
}

export function HousekeepingPanel({ tasks, kpi, roomAvailability, rooms, hotelName, onAdvanceTask }: Props) {
  const roomTiles =
    roomAvailability.length > 0
      ? roomAvailability
          .slice()
          .sort((a, b) => String(a.room_no).localeCompare(String(b.room_no), undefined, { numeric: true, sensitivity: "base" }))
          .map((row) => ({
            number: row.room_no,
            status: mapAvailabilityStateToTile(row.effective_room_state),
            reason: row.unavailable_reason,
            eta: row.estimated_available_at,
          }))
      : rooms
          .slice()
          .sort((a, b) => String(a.room_number).localeCompare(String(b.room_number), undefined, { numeric: true, sensitivity: "base" }))
          .map((room) => ({
            number: room.room_number,
            status:
              room.status === "maintenance"
                ? ("maintenance" as RoomTileStatus)
                : room.status === "occupied"
                  ? ("occupied" as RoomTileStatus)
                  : room.status === "cleaning"
                    ? ("cleaning" as RoomTileStatus)
                    : ("available" as RoomTileStatus),
            reason: null,
            eta: null,
          }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={Clock} label="Pending" value={kpi.pending} className="text-amber-600" />
        <Kpi icon={Sparkles} label="In progress" value={kpi.inProgress} className="text-sky-600" />
        <Kpi icon={CheckCircle2} label="Completed" value={kpi.completed} className="text-emerald-600" />
        <Kpi icon={TriangleAlert} label="Urgent" value={kpi.urgent} className="text-rose-600" />
      </div>

      <Tabs defaultValue="tasks">
        <TabsList className="h-10 w-full justify-start rounded-xl bg-muted/50 p-1">
          <TabsTrigger value="tasks" className="rounded-lg">
            Cleaning tasks
          </TabsTrigger>
          <TabsTrigger value="rooms" className="rounded-lg">
            Room status
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="mt-4 space-y-2">
          {tasks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 px-4 py-6 text-sm text-muted-foreground">
              No live housekeeping tasks for this property.
            </div>
          ) : (
            tasks.map((t) => (
              <Card key={t.id} className="border-border/60">
                <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{t.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.roomLabel}
                      {t.assignee ? ` · ${t.assignee}` : ""}
                    </p>
                    <Badge variant="outline" className="mt-1 text-[10px] capitalize">
                      {t.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <Button type="button" size="sm" variant="secondary" className="rounded-lg" onClick={() => onAdvanceTask(t.id)}>
                    Update status
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="rooms" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{hotelName ?? "Assigned property"}</CardTitle>
            </CardHeader>
            <CardContent>
              {roomTiles.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/60 px-4 py-6 text-sm text-muted-foreground">
                  No live room status data available.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {roomTiles.map((cell) => (
                    <div
                      key={cell.number}
                      title={cell.reason ? `${cell.reason}${cell.eta ? ` · ETA ${new Date(cell.eta).toLocaleTimeString()}` : ""}` : undefined}
                      className={cn(
                        "min-w-[3rem] rounded-lg border px-2 py-2 text-center text-sm font-mono",
                        tileStyles[cell.status],
                      )}
                    >
                      {cell.number}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  className: string;
}) {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardContent className="flex items-center gap-3 p-4">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg bg-muted", className)}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold tabular-nums">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
