import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { OpsServiceRequest, ServicePriority } from "@/lib/operations-types";
import { cn } from "@/lib/utils";

const priorityClass: Record<ServicePriority, string> = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-sky-100 text-sky-800",
  high: "bg-rose-100 text-rose-800",
};

interface Props {
  rows: OpsServiceRequest[];
  onResolve: (id: string) => void;
}

export function OpsServiceRequestsPanel({ rows, onResolve }: Props) {
  const open = rows.filter((r) => !r.resolved);
  return (
    <div className="space-y-3">
      {open.length === 0 ? (
        <p className="text-sm text-muted-foreground">No open service requests.</p>
      ) : null}
      {open.map((row) => (
        <Card key={row.id} className="border-border/60 shadow-sm">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="rounded-full text-[10px] font-semibold">
                  {row.category}
                </Badge>
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize", priorityClass[row.priority])}>
                  {row.priority}
                </span>
              </div>
              <p className="font-semibold text-foreground">{row.title}</p>
              <p className="text-xs text-muted-foreground">
                Room {row.roomLabel} · {row.guestName}
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" className="shrink-0 rounded-lg" onClick={() => onResolve(row.id)}>
              Resolve
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
