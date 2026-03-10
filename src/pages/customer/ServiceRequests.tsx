import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SERVICE_REQUESTS } from "@/data/mock-data";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";

const priorityColors: Record<string, string> = { low: "bg-muted text-muted-foreground", medium: "bg-info/10 text-info", high: "bg-destructive/10 text-destructive" };
const statusColors: Record<string, string> = { open: "bg-warning/10 text-warning", in_progress: "bg-info/10 text-info", resolved: "bg-success/10 text-success" };

export default function ServiceRequests() {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Service Requests</h1>
          <p className="text-sm text-muted-foreground">Submit and track service requests</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2"><Plus className="h-3.5 w-3.5" /> New Request</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Service Request</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <Input placeholder="Request type (e.g., Housekeeping, Transport)" />
              <Textarea placeholder="Describe your request..." />
              <Button className="w-full" onClick={() => { setOpen(false); toast.success("Service request submitted"); }}>Submit</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {SERVICE_REQUESTS.map(r => (
          <Card key={r.id}>
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-muted-foreground">{r.id}</span>
                  <Badge className={statusColors[r.status]}>{r.status.replace("_", " ")}</Badge>
                  <Badge className={priorityColors[r.priority]} variant="outline">{r.priority}</Badge>
                </div>
                <p className="font-medium text-sm">{r.type}</p>
                <p className="text-xs text-muted-foreground">{r.description}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Room {r.roomNumber} · {r.createdAt}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
