import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { getManagerAssignedHotel, listStaff, type StaffDesignation, type StaffMember } from "@/lib/supabase";
import { UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const DESIGNATION_LABEL: Record<StaffDesignation, string> = {
  room_service: "Room service",
  cleaning: "Cleaning",
  cook: "Cook",
  driver: "Driver",
  translator: "Translator",
  housekeeping: "Housekeeping",
  maintenance: "Maintenance",
};

export function StaffPanel() {
  const { user } = useAuth();
  const [rows, setRows] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [hotelName, setHotelName] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!user?.id) {
        setRows([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const assigned = await getManagerAssignedHotel(user.id);
      if (assigned.error) {
        toast.error(assigned.error.message || "Failed to load assigned hotel");
        setLoading(false);
        return;
      }
      if (!assigned.data) {
        setRows([]);
        setHotelName(null);
        setLoading(false);
        return;
      }
      setHotelName(assigned.data.name);
      const staff = await listStaff(assigned.data.id);
      if (staff.error) {
        toast.error(staff.error.message || "Failed to load staff");
        setRows([]);
      } else {
        setRows(staff.data);
      }
      setLoading(false);
    };
    void run();
  }, [user?.id]);

  const activeRows = useMemo(() => rows.filter((row) => row.is_active), [rows]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Front-desk coverage and handoffs for {hotelName ?? "your assigned property"}.
      </p>
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading staff…</p>
      ) : null}
      {!loading && activeRows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No active staff found for this property.</p>
      ) : null}
      <div className="space-y-2">
        {activeRows.map((s) => (
          <Card key={s.id} className="border-border/60">
            <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <UserCircle className="h-9 w-9 text-muted-foreground" />
                <div>
                  <p className="font-semibold">{s.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {DESIGNATION_LABEL[s.designation]}
                  </p>
                  <p className="text-xs text-muted-foreground">{s.mobile_number}</p>
                </div>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  s.is_active ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-slate-200",
                )}
              >
                {s.is_active ? "on duty" : "inactive"}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
