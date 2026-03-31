import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import {
  listServiceRequests,
  assignServiceRequest,
  getAvailableStaff,
  type ServiceRequest,
  type TaskStatus,
  type StaffMember,
} from "@/lib/supabase";

interface ServiceRequestsTabProps {
  hotelId: string;
}

export default function ServiceRequestsTab({ hotelId }: ServiceRequestsTabProps) {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    loadData();
  }, [hotelId, filterStatus]);

  const loadData = async () => {
    setLoading(true);

    const [requestsRes, staffRes] = await Promise.all([
      listServiceRequests(filterStatus === "all" ? undefined : (filterStatus as TaskStatus)),
      getAvailableStaff(hotelId),
    ]);

    if (requestsRes.error) {
      toast.error("Failed to load service requests");
    } else {
      setRequests(requestsRes.data);
    }

    if (!staffRes.error) setStaff(staffRes.data);

    setLoading(false);
  };

  const handleAssign = async (requestId: string, staffId: string) => {
    const { error } = await assignServiceRequest(requestId, staffId);
    if (error) {
      toast.error("Failed to assign request");
      return;
    }
    toast.success("Request assigned successfully");
    loadData();
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-warning" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-info" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      default:
        return null;
    }
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
    pending: requests.filter(r => r.status === 'pending').length,
    in_progress: requests.filter(r => r.status === 'in_progress').length,
    completed: requests.filter(r => r.status === 'completed').length,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Service Requests</h3>
          <p className="text-sm text-muted-foreground">Manage guest service requests</p>
        </div>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Requests</SelectItem>
            <SelectItem value="pending">Pending ({statusCounts.pending})</SelectItem>
            <SelectItem value="in_progress">In Progress ({statusCounts.in_progress})</SelectItem>
            <SelectItem value="completed">Completed ({statusCounts.completed})</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Service Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No service requests found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Room</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map(request => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      {request.room?.room_number || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {request.type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="truncate">{request.description}</p>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityBadge(request.priority)}>
                        {request.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(request.status)}
                        <Badge className={getStatusBadge(request.status)}>
                          {request.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(request.created_at).toLocaleDateString()}
                      <p className="text-xs">
                        {new Date(request.created_at).toLocaleTimeString()}
                      </p>
                    </TableCell>
                    <TableCell className="text-right">
                      {request.status === 'pending' && (
                        <Select onValueChange={(v) => handleAssign(request.id, v)}>
                          <SelectTrigger className="h-8 text-xs w-[140px]">
                            <SelectValue placeholder="Assign Staff" />
                          </SelectTrigger>
                          <SelectContent>
                            {staff.filter(s => s.is_active).map(s => (
                              <SelectItem key={s.id} value={s.id} className="text-xs">
                                {s.name}
                                <span className="text-muted-foreground ml-1">
                                  ({s.designation})
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      {request.status !== 'pending' && (
                        <span className="text-xs text-muted-foreground">
                          {request.status === 'in_progress' ? 'Assigned' : 'Completed'}
                        </span>
                      )}
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
