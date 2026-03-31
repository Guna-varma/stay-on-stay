import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp,
  TrendingDown,
  Award,
  AlertCircle
} from "lucide-react";
import { 
  getRoomTypePerformance,
  type RoomTypePerformance 
} from "@/lib/supabase";

interface RoomPerformanceTabProps {
  hotelId: string;
}

export default function OwnerRoomPerformance({ hotelId }: RoomPerformanceTabProps) {
  const [performance, setPerformance] = useState<RoomTypePerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<keyof RoomTypePerformance>("total_revenue");
  const [sortDesc, setSortDesc] = useState(true);

  useEffect(() => {
    if (!hotelId) { setLoading(false); return; }
    
    const fetchData = async () => {
      setLoading(true);
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await getRoomTypePerformance(
        hotelId,
        thirtyDaysAgo.toISOString().split("T")[0],
        today.toISOString().split("T")[0]
      );

      if (!error) setPerformance(data);
      setLoading(false);
    };

    fetchData();
  }, [hotelId]);

  const sortedData = [...performance].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    return sortDesc ? Number(bVal) - Number(aVal) : Number(aVal) - Number(bVal);
  });

  const totalRevenue = performance.reduce((s, p) => s + p.total_revenue, 0);
  const totalBookings = performance.reduce((s, p) => s + p.bookings_count, 0);
  const avgOccupancy = performance.length > 0
    ? performance.reduce((s, p) => s + p.occupancy_rate, 0) / performance.length
    : 0;
  
  const bestPerformer = performance.length > 0
    ? performance.reduce((best, curr) => curr.total_revenue > best.total_revenue ? curr : best, performance[0])
    : null;

  const toggleSort = (col: keyof RoomTypePerformance) => {
    if (sortBy === col) {
      setSortDesc(!sortDesc);
    } else {
      setSortBy(col);
      setSortDesc(true);
    }
  };

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
          Please select a hotel to view room performance.
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
                  <TrendingUp className="h-4 w-4" />
                </div>
                <p className="text-xs text-muted-foreground">Total Revenue (30d)</p>
              </div>
              <p className="text-2xl font-heading font-bold">₹{totalRevenue.toFixed(0)}</p>
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
                <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                  <Award className="h-4 w-4" />
                </div>
                <p className="text-xs text-muted-foreground">Total Bookings</p>
              </div>
              <p className="text-2xl font-heading font-bold">{totalBookings}</p>
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
                <div className="p-2 rounded-lg bg-green-100 text-green-700">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <p className="text-xs text-muted-foreground">Avg Occupancy</p>
              </div>
              <p className="text-2xl font-heading font-bold">{avgOccupancy.toFixed(1)}%</p>
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
                <div className="p-2 rounded-lg bg-yellow-100 text-yellow-700">
                  <Award className="h-4 w-4" />
                </div>
                <p className="text-xs text-muted-foreground">Top Performer</p>
              </div>
              <p className="text-sm font-semibold truncate">{bestPerformer?.room_type_name || "—"}</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Performance Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Room Type Performance (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {performance.length === 0 ? (
              <div className="py-12 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No performance data available.</p>
                <p className="text-xs text-muted-foreground mt-1">Add room types and bookings to see metrics here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">
                        <button
                          onClick={() => toggleSort("room_type_name")}
                          className="hover:text-primary"
                        >
                          Room Type {sortBy === "room_type_name" && (sortDesc ? "↓" : "↑")}
                        </button>
                      </th>
                      <th className="text-center p-3 font-medium">
                        <button
                          onClick={() => toggleSort("total_rooms")}
                          className="hover:text-primary"
                        >
                          Rooms {sortBy === "total_rooms" && (sortDesc ? "↓" : "↑")}
                        </button>
                      </th>
                      <th className="text-center p-3 font-medium">
                        <button
                          onClick={() => toggleSort("bookings_count")}
                          className="hover:text-primary"
                        >
                          Bookings {sortBy === "bookings_count" && (sortDesc ? "↓" : "↑")}
                        </button>
                      </th>
                      <th className="text-right p-3 font-medium">
                        <button
                          onClick={() => toggleSort("total_revenue")}
                          className="hover:text-primary"
                        >
                          Revenue {sortBy === "total_revenue" && (sortDesc ? "↓" : "↑")}
                        </button>
                      </th>
                      <th className="text-center p-3 font-medium">
                        <button
                          onClick={() => toggleSort("avg_nights")}
                          className="hover:text-primary"
                        >
                          Avg Nights {sortBy === "avg_nights" && (sortDesc ? "↓" : "↑")}
                        </button>
                      </th>
                      <th className="text-center p-3 font-medium">
                        <button
                          onClick={() => toggleSort("occupancy_rate")}
                          className="hover:text-primary"
                        >
                          Occupancy {sortBy === "occupancy_rate" && (sortDesc ? "↓" : "↑")}
                        </button>
                      </th>
                      <th className="text-center p-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedData.map((room, idx) => {
                      const isTopPerformer = room.total_revenue === bestPerformer?.total_revenue && room.total_revenue > 0;
                      const isUnderperforming = room.occupancy_rate < 30 && room.total_rooms > 0;
                      
                      return (
                        <tr key={room.room_type_id} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="p-3 font-medium">{room.room_type_name}</td>
                          <td className="p-3 text-center">{room.total_rooms}</td>
                          <td className="p-3 text-center">{room.bookings_count}</td>
                          <td className="p-3 text-right font-medium">₹{room.total_revenue.toFixed(0)}</td>
                          <td className="p-3 text-center">{room.avg_nights ? room.avg_nights.toFixed(1) : "—"}</td>
                          <td className="p-3 text-center">
                            <span className={`inline-flex items-center gap-1 ${
                              room.occupancy_rate >= 70 ? "text-green-600" :
                              room.occupancy_rate >= 40 ? "text-yellow-600" :
                              "text-red-600"
                            }`}>
                              {room.occupancy_rate >= 70 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                              {room.occupancy_rate.toFixed(1)}%
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            {isTopPerformer && (
                              <Badge className="bg-yellow-100 text-yellow-700 text-xs">
                                <Award className="h-3 w-3 mr-1" /> Top
                              </Badge>
                            )}
                            {isUnderperforming && !isTopPerformer && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertCircle className="h-3 w-3 mr-1" /> Low
                              </Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
