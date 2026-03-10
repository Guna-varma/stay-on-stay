import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CLEANING_TASKS, HOTELS } from "@/data/mock-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Clock, AlertTriangle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const priorityColors: Record<string, string> = { urgent: "bg-destructive/10 text-destructive", high: "bg-warning/10 text-warning", normal: "bg-info/10 text-info" };
const statusColors: Record<string, string> = { pending: "bg-warning/10 text-warning", in_progress: "bg-info/10 text-info", completed: "bg-success/10 text-success" };

export default function HousekeepingDashboard() {
  const pending = CLEANING_TASKS.filter(t => t.status === "pending");
  const inProgress = CLEANING_TASKS.filter(t => t.status === "in_progress");
  const completed = CLEANING_TASKS.filter(t => t.status === "completed");

  const stats = [
    { label: "Pending", value: pending.length, icon: Clock, color: "text-warning" },
    { label: "In Progress", value: inProgress.length, icon: Sparkles, color: "text-info" },
    { label: "Completed", value: completed.length, icon: CheckCircle, color: "text-success" },
    { label: "Urgent", value: CLEANING_TASKS.filter(t => t.priority === "urgent").length, icon: AlertTriangle, color: "text-destructive" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-bold">Housekeeping Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card><CardContent className="p-4 flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-muted ${s.color}`}><s.icon className="h-5 w-5" /></div>
              <div><p className="text-2xl font-heading font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
            </CardContent></Card>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="tasks">
        <TabsList>
          <TabsTrigger value="tasks">Cleaning Tasks</TabsTrigger>
          <TabsTrigger value="rooms">Room Status</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="mt-4 space-y-3">
          {CLEANING_TASKS.map(task => (
            <Card key={task.id} className={task.priority === "urgent" ? "border-destructive/30" : ""}>
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-muted-foreground">{task.id}</span>
                    <Badge className={priorityColors[task.priority]}>{task.priority}</Badge>
                    <Badge className={statusColors[task.status]}>{task.status.replace("_", " ")}</Badge>
                  </div>
                  <p className="font-medium text-sm">Room {task.roomNumber} — {task.type}</p>
                  {task.notes && <p className="text-xs text-muted-foreground mt-0.5">{task.notes}</p>}
                  <p className="text-xs text-muted-foreground">Assigned to: {task.assignedTo}</p>
                </div>
                <div className="flex gap-2">
                  {task.status === "pending" && <Button size="sm" variant="outline" onClick={() => toast.info("Task started")}>Start</Button>}
                  {task.status !== "completed" && <Button size="sm" onClick={() => toast.success(`Room ${task.roomNumber} marked ready!`)}>Mark Ready</Button>}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="rooms" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <h4 className="text-sm font-medium mb-4">Room Lifecycle</h4>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6 flex-wrap">
                {["Available", "→", "Booked", "→", "Occupied", "→", "Cleaning", "→", "Available"].map((s, i) => (
                  <span key={i} className={s === "→" ? "" : "px-2 py-1 rounded bg-muted font-medium"}>{s}</span>
                ))}
              </div>
              {HOTELS.slice(0, 1).map(hotel => (
                <div key={hotel.id}>
                  <h5 className="text-sm font-medium mb-3">{hotel.name}</h5>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                    {hotel.rooms.map(room => (
                      <div key={room.id} className={`p-2 rounded-lg text-center text-xs font-mono ${
                        room.status === "available" ? "bg-success/10 text-success" :
                        room.status === "booked" ? "bg-destructive/10 text-destructive" :
                        "bg-muted text-muted-foreground"
                      }`}>{room.number}</div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
