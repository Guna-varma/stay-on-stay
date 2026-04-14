import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CheckoutQueueRecord } from "@/lib/supabase";
import { LogOut } from "lucide-react";

interface Props {
  rows: CheckoutQueueRecord[];
  onProcess: (bookingId: string) => void;
}

export function CheckOutsPanel({ rows, onProcess }: Props) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 px-4 py-6 text-sm text-muted-foreground">
        No check-outs due today.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <Card key={row.booking_id} className="border-border/60 shadow-sm">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-base font-semibold">{row.guest_name}</p>
                <Badge variant={row.checkout_ready ? "default" : "secondary"}>
                  {row.checkout_ready ? "Ready" : "Blocked"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Room {row.room_no} · Check-out {row.scheduled_checkout_date}
              </p>
              <p className="mt-1 text-sm font-medium">
                Balance:{" "}
                <span className="tabular-nums">
                  ₹{row.balance_due.toLocaleString("en-IN")}
                </span>
              </p>
              {!row.checkout_ready && row.blockers.length > 0 ? (
                <p className="text-xs text-amber-700">
                  {row.blockers.join(" • ")}
                </p>
              ) : null}
              <p className="text-xs text-muted-foreground">
                Next room state: {row.next_room_state}
                {row.estimated_available_at ? ` · ETA ${new Date(row.estimated_available_at).toLocaleTimeString()}` : ""}
              </p>
            </div>
            <Button
              type="button"
              className="shrink-0 rounded-lg"
              onClick={() => onProcess(row.booking_id)}
              disabled={!row.checkout_ready}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Process Check-out
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
