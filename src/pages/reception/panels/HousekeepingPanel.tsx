import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SEED_PROPERTY_GRIDS } from "@/data/operations-seed";
import type { HousekeepingTask, RoomTileStatus } from "@/lib/operations-types";
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
  onAdvanceTask: (id: string) => void;
}

export function HousekeepingPanel({ tasks, kpi, onAdvanceTask }: Props) {
  const grid = SEED_PROPERTY_GRIDS[0];

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
          {tasks.map((t) => (
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
          ))}
        </TabsContent>

        <TabsContent value="rooms" className="mt-4 space-y-4">
          <Card className="border-dashed border-primary/20 bg-muted/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Room lifecycle</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-foreground">
              <span className="font-medium">Available</span>
              <span className="mx-2 text-muted-foreground">→</span>
              <span className="font-medium">Booked</span>
              <span className="mx-2 text-muted-foreground">→</span>
              <span className="font-medium">Occupied</span>
              <span className="mx-2 text-muted-foreground">→</span>
              <span className="font-medium">Cleaning</span>
              <span className="mx-2 text-muted-foreground">→</span>
              <span className="font-medium">Available</span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{grid.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {grid.rooms.map((cell) => (
                  <div
                    key={cell.number}
                    className={cn(
                      "min-w-[3rem] rounded-lg border px-2 py-2 text-center text-sm font-mono",
                      tileStyles[cell.status],
                    )}
                  >
                    {cell.number}
                  </div>
                ))}
              </div>
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
