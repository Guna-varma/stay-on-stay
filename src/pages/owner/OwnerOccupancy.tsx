import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BedDouble,
  Home,
  Wrench,
  Sparkles
} from "lucide-react";
import { 
  getOwnerMonthlyOccupancy,
  getOwnerRoomStatusBreakdown,
  type MonthlyOccupancy,
  type RoomStatusBreakdown 
} from "@/lib/supabase";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface OccupancyTabProps {
  hotelId: string;
}

const STATUS_COLORS: Record<string, string> = {
  available: "hsl(142, 76%, 36%)",
  occupied: "hsl(174, 100%, 24%)",
  maintenance: "hsl(24, 100%, 50%)",
  cleaning: "hsl(210, 100%, 56%)",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  available: <Home className="h-4 w-4" />,
  occupied: <BedDouble className="h-4 w-4" />,
  maintenance: <Wrench className="h-4 w-4" />,
  cleaning: <Sparkles className="h-4 w-4" />,
};

export default function OwnerOccupancy({ hotelId }: OccupancyTabProps) {
  const [monthlyData, setMonthlyData] = useState<MonthlyOccupancy[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<RoomStatusBreakdown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hotelId) { setLoading(false); return; }
    
    const fetchData = async () => {
      setLoading(true);
      const today = new Date();
      const sixMonthsAgo = new Date(today);
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const [monthlyRes, statusRes] = await Promise.all([
        getOwnerMonthlyOccupancy(
          hotelId,
          sixMonthsAgo.toISOString().split("T")[0],
          today.toISOString().split("T")[0]
        ),
        getOwnerRoomStatusBreakdown(hotelId),
      ]);

      if (!monthlyRes.error) setMonthlyData(monthlyRes.data);
      if (!statusRes.error) setStatusBreakdown(statusRes.data);
      setLoading(false);
    };

    fetchData();
  }, [hotelId]);

  const currentOccupancyRate = monthlyData.length > 0 ? monthlyData[monthlyData.length - 1].occupancy_rate : 0;
  const totalRooms = statusBreakdown.reduce((s, st) => s + st.count, 0);
  const availableRooms = statusBreakdown.find((st) => st.status === "available")?.count || 0;
  const occupiedRooms = statusBreakdown.find((st) => st.status === "occupied")?.count || 0;
  const maintenanceRooms = statusBreakdown.find((st) => st.status === "maintenance")?.count || 0;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
        <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
      </div>
    );
  }

  if (!hotelId) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Please select a hotel to view occupancy analytics.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <BedDouble className="h-4 w-4" />
                </div>
                <p className="text-xs text-muted-foreground">Occupancy Rate</p>
              </div>
              <p className="text-2xl font-heading font-bold">{currentOccupancyRate.toFixed(1)}%</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-green-100 text-green-700">
                  <Home className="h-4 w-4" />
                </div>
                <p className="text-xs text-muted-foreground">Available Rooms</p>
              </div>
              <p className="text-2xl font-heading font-bold">{availableRooms}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                  <BedDouble className="h-4 w-4" />
                </div>
                <p className="text-xs text-muted-foreground">Occupied</p>
              </div>
              <p className="text-2xl font-heading font-bold">{occupiedRooms}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-orange-100 text-orange-700">
                  <Wrench className="h-4 w-4" />
                </div>
                <p className="text-xs text-muted-foreground">In Maintenance</p>
              </div>
              <p className="text-2xl font-heading font-bold">{maintenanceRooms}</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly Occupancy Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">Occupancy Trend (Last 6 Months)</CardTitle>
            </CardHeader>
            <CardContent>
              {monthlyData.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No occupancy data available.</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      formatter={(value: number) => [`${value.toFixed(1)}%`, 'Occupancy']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="occupancy_rate" 
                      stroke="hsl(174, 100%, 24%)" 
                      strokeWidth={2} 
                      dot={{ r: 4 }} 
                      fill="hsl(174, 100%, 24%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Room Status Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">Room Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {statusBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No room status data available.</p>
              ) : (
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={statusBreakdown}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={(entry) => `${entry.status}: ${entry.count}`}
                      >
                        {statusBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || "hsl(var(--muted))"} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {statusBreakdown.map((st) => (
                      <div key={st.status} className="flex items-center gap-2 rounded-lg border p-3">
                        <div 
                          className="p-2 rounded-lg" 
                          style={{ 
                            backgroundColor: STATUS_COLORS[st.status] ? `${STATUS_COLORS[st.status]}20` : 'hsl(var(--muted))',
                            color: STATUS_COLORS[st.status] || 'hsl(var(--foreground))'
                          }}
                        >
                          {STATUS_ICONS[st.status] || <Home className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground capitalize">{st.status}</p>
                          <p className="font-semibold">{st.count}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
