import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Check, X, Clock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import {
  listTasks,
  createTask,
  updateTask,
  deleteTask,
  getAvailableStaff,
  supabase,
  type Task,
  type TaskInput,
  type TaskStatus,
  type TaskType,
  type StaffMember,
} from "@/lib/supabase";

interface TasksTabProps {
  hotelId: string;
}

const TASK_TYPES: Array<{ value: TaskType; label: string }> = [
  { value: 'room_cleaning', label: 'Room Cleaning' },
  { value: 'room_service', label: 'Room Service' },
  { value: 'housekeeping', label: 'Housekeeping' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'cooking', label: 'Cooking' },
  { value: 'driver', label: 'Driver' },
  { value: 'translator', label: 'Translator' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export default function TasksTab({ hotelId }: TasksTabProps) {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [rooms, setRooms] = useState<Array<{ id: string; room_number: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [form, setForm] = useState<TaskInput>({
    type: 'room_cleaning',
    hotel_id: hotelId,
    priority: 'medium',
    description: "",
  });

  useEffect(() => {
    loadData();
  }, [hotelId, filterStatus]);

  const loadData = async () => {
    setLoading(true);

    const [tasksRes, staffRes, roomsRes] = await Promise.all([
      listTasks(hotelId, filterStatus === "all" ? undefined : (filterStatus as TaskStatus)),
      getAvailableStaff(hotelId),
      supabase
        .from("rooms")
        .select("id, room_number")
        .eq("hotel_id", hotelId)
        .is("deleted_at", null)
        .order("room_number"),
    ]);

    if (tasksRes.error) {
      toast.error("Failed to load tasks");
    } else {
      setTasks(tasksRes.data);
    }

    if (!staffRes.error) setStaff(staffRes.data);
    if (!roomsRes.error) setRooms(roomsRes.data || []);

    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!profile?.id) return;

    const { error } = await createTask(profile.id, form);
    if (error) {
      toast.error("Failed to create task");
      return;
    }

    toast.success("Task created successfully");
    setIsDialogOpen(false);
    setForm({
      type: 'room_cleaning',
      hotel_id: hotelId,
      priority: 'medium',
      description: "",
    });
    loadData();
  };

  const handleUpdateStatus = async (taskId: string, status: TaskStatus) => {
    const { error } = await updateTask(taskId, { status });
    if (error) {
      toast.error("Failed to update task");
      return;
    }
    toast.success(`Task ${status}`);
    loadData();
  };

  const handleAssignStaff = async (taskId: string, staffId: string) => {
    const { error } = await updateTask(taskId, { assigned_staff_id: staffId });
    if (error) {
      toast.error("Failed to assign staff");
      return;
    }
    toast.success("Staff assigned");
    loadData();
  };

  const getStatusBadge = (status: TaskStatus) => {
    const colors = {
      pending: 'bg-warning/10 text-warning',
      in_progress: 'bg-info/10 text-info',
      completed: 'bg-success/10 text-success',
      cancelled: 'bg-destructive/10 text-destructive',
    };
    return colors[status] || 'bg-muted';
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      low: 'bg-muted text-muted-foreground',
      medium: 'bg-info/10 text-info',
      high: 'bg-warning/10 text-warning',
      urgent: 'bg-destructive/10 text-destructive',
    };
    return colors[priority] || 'bg-muted';
  };

  const statusCounts = {
    pending: tasks.filter(t => t.status === 'pending').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tasks</SelectItem>
              <SelectItem value="pending">Pending ({statusCounts.pending})</SelectItem>
              <SelectItem value="in_progress">In Progress ({statusCounts.in_progress})</SelectItem>
              <SelectItem value="completed">Completed ({statusCounts.completed})</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isDialogOpen} onValueChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
              <DialogDescription>Assign a new task to your staff</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Task Type *</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm({ ...form, type: v as TaskType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Room (Optional)</Label>
                <Select
                  value={form.room_id || "none"}
                  onValueChange={(v) => setForm({ ...form, room_id: v === "none" ? null : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select room" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific room</SelectItem>
                    {rooms.map(r => (
                      <SelectItem key={r.id} value={r.id}>{r.room_number}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => setForm({ ...form, priority: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map(p => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Assign Staff (Optional)</Label>
                <Select
                  value={form.assigned_staff_id || "none"}
                  onValueChange={(v) => setForm({ ...form, assigned_staff_id: v === "none" ? null : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Assign later" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Assign later</SelectItem>
                    {staff.filter(s => s.is_active).map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} ({s.designation})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Task details..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmit}>Create Task</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No tasks found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map(task => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <Badge variant="outline">
                        {TASK_TYPES.find(t => t.value === task.type)?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {task.room ? task.room.room_number : '—'}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {task.description || '—'}
                    </TableCell>
                    <TableCell>
                      {task.assigned_staff_id ? (
                        <div className="text-sm">
                          {task.staff?.name || 'Unknown'}
                          <p className="text-xs text-muted-foreground">{task.staff?.mobile_number}</p>
                        </div>
                      ) : (
                        <Select onValueChange={(v) => handleAssignStaff(task.id, v)}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Assign..." />
                          </SelectTrigger>
                          <SelectContent>
                            {staff.filter(s => s.is_active).map(s => (
                              <SelectItem key={s.id} value={s.id} className="text-xs">
                                {s.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityBadge(task.priority)}>
                        {task.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(task.status)}>
                        {task.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        {task.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleUpdateStatus(task.id, 'in_progress')}
                            className="h-8 px-2"
                          >
                            <Clock className="h-3 w-3" />
                          </Button>
                        )}
                        {task.status === 'in_progress' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleUpdateStatus(task.id, 'completed')}
                            className="h-8 px-2 text-success"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUpdateStatus(task.id, 'cancelled')}
                          className="h-8 px-2 text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
