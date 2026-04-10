import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ReceptionCheckIn } from "@/lib/operations-types";
import { CheckCircle, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const statusBadge: Record<string, string> = {
  checked_in: "bg-emerald-100 text-emerald-800 border-emerald-200",
  confirmed: "bg-sky-100 text-sky-800 border-sky-200",
  pending: "bg-amber-100 text-amber-900 border-amber-200",
};

interface Props {
  rows: ReceptionCheckIn[];
  onVerify: (id: string) => void;
  onCheckIn: (id: string) => void;
}

export function CheckInsPanel({ rows, onVerify, onCheckIn }: Props) {
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <Card key={row.id} className="border-border/60 shadow-sm">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">{row.bookingRef}</span>
                <Badge variant="outline" className={cn("text-[10px] font-semibold uppercase", statusBadge[row.status])}>
                  {row.status.replace("_", " ")}
                </Badge>
              </div>
              <p className="text-base font-semibold text-foreground">{row.guestName}</p>
              <p className="text-sm text-muted-foreground">
                {row.country} · Passport {row.passportMasked} · Room {row.roomLabel}
              </p>
              {row.companionNote ? (
                <p className="text-xs text-muted-foreground">{row.companionNote}</p>
              ) : null}
            </div>
            <div className="flex shrink-0 gap-2">
              <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={() => onVerify(row.id)}>
                <Shield className="mr-1.5 h-3.5 w-3.5" />
                Verify
              </Button>
              <Button
                type="button"
                size="sm"
                className="rounded-lg"
                disabled={row.status === "checked_in"}
                onClick={() => onCheckIn(row.id)}
              >
                <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                Check In
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
