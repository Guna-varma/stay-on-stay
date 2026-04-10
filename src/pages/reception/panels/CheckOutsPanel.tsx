import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ReceptionCheckOut } from "@/lib/operations-types";
import { LogOut } from "lucide-react";

interface Props {
  rows: ReceptionCheckOut[];
  onProcess: (id: string) => void;
}

export function CheckOutsPanel({ rows, onProcess }: Props) {
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <Card key={row.id} className="border-border/60 shadow-sm">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-base font-semibold">{row.guestName}</p>
              <p className="text-sm text-muted-foreground">
                Room {row.roomLabel} · Check-out {row.checkoutDate}
              </p>
              <p className="mt-1 text-sm font-medium">
                Balance:{" "}
                <span className="tabular-nums">
                  ₹{row.balanceInr.toLocaleString("en-IN")}
                </span>
              </p>
            </div>
            <Button type="button" className="shrink-0 rounded-lg" onClick={() => onProcess(row.id)}>
              <LogOut className="mr-2 h-4 w-4" />
              Process Check-out
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
