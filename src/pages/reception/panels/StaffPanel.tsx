import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SEED_STAFF } from "@/data/operations-seed";
import { UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function StaffPanel() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Front-desk coverage and handoffs. Integrate with HR / roster APIs when available.
      </p>
      <div className="space-y-2">
        {SEED_STAFF.map((s) => (
          <Card key={s.id} className="border-border/60">
            <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <UserCircle className="h-9 w-9 text-muted-foreground" />
                <div>
                  <p className="font-semibold">{s.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.role} · {s.area}
                  </p>
                  <p className="text-xs text-muted-foreground">Shift {s.shift}</p>
                </div>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  s.status === "on_duty" ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-slate-200",
                )}
              >
                {s.status.replace("_", " ")}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
