import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { VerificationQueueItem } from "@/lib/operations-types";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  rows: VerificationQueueItem[];
  onApprove: (id: string) => void;
}

export function VerificationsPanel({ rows, onApprove }: Props) {
  const pending = rows.filter((r) => r.status === "pending");
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Review passport, visa, and FRRO submissions. Approved records sync to compliance exports (demo).
      </p>
      <div className="space-y-3">
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending verifications.</p>
        ) : null}
        {pending.map((row) => (
          <Card key={row.id} className="border-border/60 shadow-sm">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">{row.guestName}</p>
                  <p className="text-xs text-muted-foreground">Room {row.roomLabel}</p>
                  <p className="text-sm text-muted-foreground">{row.docType}</p>
                  <p className="text-[10px] text-muted-foreground">Submitted {row.submittedAt.replace("T", " ")}</p>
                  <Badge variant="outline" className="mt-1 text-[10px] capitalize">
                    {row.status}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="outline" className="rounded-lg" onClick={() => onApprove(row.id)}>
                  Approve
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="rounded-lg text-muted-foreground"
                  onClick={() => toast.message("Rejection recorded (demo) — connect API for audit trail")}
                >
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="rounded-lg border border-dashed bg-muted/30 p-4 text-xs text-muted-foreground">
        Recent decisions:{" "}
        {rows
          .filter((r) => r.status !== "pending")
          .map((r) => (
            <span key={r.id} className={cn("mr-2 inline-block", r.status === "approved" && "text-emerald-700")}>
              {r.guestName} — {r.status}
            </span>
          ))}
      </div>
    </div>
  );
}
