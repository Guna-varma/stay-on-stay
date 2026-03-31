import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Hotel, BedDouble, UserCheck, UserX, ClipboardList, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { getManagerDashboardStats, listHotelsForOwner, type ManagerDashboardStats } from "@/lib/supabase";
import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Import tab components
import CheckInOutTab from "@/pages/manager/CheckInOutTab";
import RoomStatusTab from "@/pages/manager/RoomStatusTab";
import TasksTab from "@/pages/manager/TasksTab";
import StaffManagementTab from "@/pages/manager/StaffManagementTab";
import ServiceRequestsTab from "@/pages/manager/ServiceRequestsTab";

export default function ManagerDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [selectedHotelId, setSelectedHotelId] = useState<string>("");
  const [hotels, setHotels] = useState<Array<{ id: string; name: string }>>([]);
  const [stats, setStats] = useState<ManagerDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Determine active tab from URL
  const activeTab = location.pathname.includes('/check-in-out') ? 'checkin' :
    location.pathname.includes('/room-status') ? 'rooms' :
    location.pathname.includes('/tasks') ? 'tasks' :
    location.pathname.includes('/staff') ? 'staff' :
    location.pathname.includes('/service-requests') ? 'requests' :
    'dashboard';

  // Load hotels for manager
  useEffect(() => {
    if (!user?.id) return;
    
    const loadHotels = async () => {
      // For managers, get assigned hotels; for owners, get owned hotels
      const { data, error } = await listHotelsForOwner(user.id);
      
      if (error) {
        toast.error("Failed to load hotels");
        return;
      }
      
      if (data && data.length > 0) {
        setHotels(data);
        setSelectedHotelId(data[0].id);
      } else {
        toast.error("No hotels assigned");
      }
    };

    loadHotels();
  }, [user?.id]);

  // Load dashboard stats when hotel is selected
  useEffect(() => {
    if (!selectedHotelId) return;

    const loadStats = async () => {
      setLoading(true);
      const { data, error } = await getManagerDashboardStats(selectedHotelId);
      
      if (error) {
        toast.error("Failed to load dashboard stats");
        setLoading(false);
        return;
      }
      
      setStats(data);
      setLoading(false);
    };

    loadStats();
  }, [selectedHotelId]);

  const statCards = [
    { label: "Total Rooms", value: stats?.total_rooms || 0, icon: BedDouble, color: "text-primary" },
    { label: "Available", value: stats?.available_rooms || 0, icon: Hotel, color: "text-success" },
    { label: "Check-ins Today", value: stats?.today_checkins || 0, icon: UserCheck, color: "text-info" },
    { label: "Check-outs Today", value: stats?.today_checkouts || 0, icon: UserX, color: "text-warning" },
    { label: "Occupied", value: stats?.occupied_rooms || 0, icon: BedDouble, color: "text-destructive" },
    { label: "Cleaning", value: stats?.cleaning_rooms || 0, icon: ClipboardList, color: "text-warning" },
    { label: "Active Bookings", value: stats?.active_bookings || 0, icon: Users, color: "text-info" },
    { label: "Pending Tasks", value: stats?.pending_tasks || 0, icon: ClipboardList, color: "text-destructive" },
  ];

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Manager Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage operations and staff</p>
        </div>
        
        {hotels.length > 1 && (
          <Select value={selectedHotelId} onValueChange={setSelectedHotelId}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Select hotel" />
            </SelectTrigger>
            <SelectContent>
              {hotels.map(h => (
                <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(v) => {
        const routes: Record<string, string> = {
          'dashboard': '/manager',
          'checkin': '/manager/check-in-out',
          'rooms': '/manager/room-status',
          'tasks': '/manager/tasks',
          'staff': '/manager/staff',
          'requests': '/manager/service-requests',
        };
        navigate(routes[v] || '/manager');
      }}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="checkin">Check-In/Out</TabsTrigger>
          <TabsTrigger value="rooms">Room Status</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6 mt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))
            ) : (
              statCards.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-muted ${stat.color}`}>
                        <stat.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-2xl font-heading font-bold">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <Button className="w-full justify-start" variant="outline" onClick={() => navigate('/manager/check-in-out')}>
                    <UserCheck className="h-4 w-4 mr-2" />
                    Check-In / Check-Out
                  </Button>
                  <Button className="w-full justify-start" variant="outline" onClick={() => navigate('/manager/room-status')}>
                    <BedDouble className="h-4 w-4 mr-2" />
                    Update Room Status
                  </Button>
                  <Button className="w-full justify-start" variant="outline" onClick={() => navigate('/manager/tasks')}>
                    <ClipboardList className="h-4 w-4 mr-2" />
                    Assign Tasks
                  </Button>
                  <Button className="w-full justify-start" variant="outline" onClick={() => navigate('/manager/staff')}>
                    <Users className="h-4 w-4 mr-2" />
                    Manage Staff
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Today's Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Check-ins</span>
                    <Badge variant="outline">{stats?.today_checkins || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Check-outs</span>
                    <Badge variant="outline">{stats?.today_checkouts || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Occupancy Rate</span>
                    <Badge className="bg-success/10 text-success">
                      {stats && stats.total_rooms > 0 
                        ? Math.round((stats.occupied_rooms / stats.total_rooms) * 100)
                        : 0}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Pending Tasks</span>
                    <Badge className={stats && stats.pending_tasks > 0 ? "bg-destructive/10 text-destructive" : ""}>
                      {stats?.pending_tasks || 0}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="checkin" className="mt-6">
          {selectedHotelId && <CheckInOutTab hotelId={selectedHotelId} />}
        </TabsContent>

        <TabsContent value="rooms" className="mt-6">
          {selectedHotelId && <RoomStatusTab hotelId={selectedHotelId} />}
        </TabsContent>

        <TabsContent value="tasks" className="mt-6">
          {selectedHotelId && <TasksTab hotelId={selectedHotelId} />}
        </TabsContent>

        <TabsContent value="staff" className="mt-6">
          {selectedHotelId && <StaffManagementTab hotelId={selectedHotelId} />}
        </TabsContent>

        <TabsContent value="requests" className="mt-6">
          {selectedHotelId && <ServiceRequestsTab hotelId={selectedHotelId} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
