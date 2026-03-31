import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, 
  DollarSign, 
  CreditCard, 
  BarChart3 
} from "lucide-react";
import { 
  getOwnerMonthlyRevenue,
  getOwnerDailyRevenue,
  listOwnerBookings,
  type MonthlyRevenue,
  type DailyRevenue,
  type OwnerBookingListItem 
} from "@/lib/supabase";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface RevenueTabProps {
  hotelId: string;
}

export default function OwnerRevenue({ hotelId }: RevenueTabProps) {
  const [monthlyData, setMonthlyData] = useState<MonthlyRevenue[]>([]);
  const [dailyData, setDailyData] = useState<DailyRevenue[]>([]);
  const [bookings, setBookings] = useState<OwnerBookingListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hotelId) { setLoading(false); return; }
    
    const fetchData = async () => {
      setLoading(true);
      const today = new Date();
      const sixMonthsAgo = new Date(today);
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const startOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      const [monthlyRes, dailyRes, bookingsRes] = await Promise.all([
        getOwnerMonthlyRevenue(
          hotelId,
          sixMonthsAgo.toISOString().split("T")[0],
          today.toISOString().split("T")[0]
        ),
        getOwnerDailyRevenue(
          hotelId,
          startOfCurrentMonth.toISOString().split("T")[0],
          today.toISOString().split("T")[0]
        ),
        listOwnerBookings(hotelId, 20),
      ]);

      if (!monthlyRes.error) setMonthlyData(monthlyRes.data);
      if (!dailyRes.error) setDailyData(dailyRes.data);
      if (!bookingsRes.error) setBookings(bookingsRes.data);
      setLoading(false);
    };

    fetchData();
  }, [hotelId]);

  const totalRevenue = monthlyData.reduce((s, m) => s + m.revenue, 0);
  const totalPaid = monthlyData.reduce((s, m) => s + m.paid_amount, 0);
  const totalBookings = monthlyData.reduce((s, m) => s + m.bookings_count, 0);
  const avgRevenuePerBooking = totalBookings > 0 ? totalRevenue / totalBookings : 0;

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
          Please select a hotel to view revenue analytics.
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
                  <DollarSign className="h-4 w-4" />
                </div>
                <p className="text-xs text-muted-foreground">Total Revenue (6mo)</p>
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
                <div className="p-2 rounded-lg bg-green-100 text-green-700">
                  <CreditCard className="h-4 w-4" />
                </div>
                <p className="text-xs text-muted-foreground">Paid Amount</p>
              </div>
              <p className="text-2xl font-heading font-bold">₹{totalPaid.toFixed(0)}</p>
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
                  <BarChart3 className="h-4 w-4" />
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
          transition={{ delay: 0.15 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-purple-100 text-purple-700">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <p className="text-xs text-muted-foreground">Avg / Booking</p>
              </div>
              <p className="text-2xl font-heading font-bold">₹{avgRevenuePerBooking.toFixed(0)}</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Monthly Revenue Bar Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monthly Revenue (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No revenue data available for the selected period.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    formatter={(value: number) => [`₹${value.toFixed(0)}`, '']}
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="hsl(174, 100%, 24%)" name="Revenue" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="paid_amount" fill="hsl(142, 76%, 36%)" name="Paid" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Daily Revenue Line Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daily Revenue (Current Month)</CardTitle>
          </CardHeader>
          <CardContent>
            {dailyData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No daily revenue data for this month.</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" tickFormatter={(d) => new Date(d).getDate().toString()} />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    formatter={(value: number) => [`₹${value.toFixed(0)}`, '']}
                    labelFormatter={(d) => new Date(d).toLocaleDateString()}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(174, 100%, 24%)" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Bookings Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {bookings.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No bookings yet for this hotel.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium">Room</th>
                      <th className="text-left p-2 font-medium">Room #</th>
                      <th className="text-left p-2 font-medium">Check-in</th>
                      <th className="text-left p-2 font-medium">Check-out</th>
                      <th className="text-left p-2 font-medium">Status</th>
                      <th className="text-right p-2 font-medium">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b) => (
                      <tr key={b.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="p-2">{b.room_type_name_snapshot || "N/A"}</td>
                        <td className="p-2 text-muted-foreground">{b.room_number || "—"}</td>
                        <td className="p-2">{new Date(b.check_in_date).toLocaleDateString()}</td>
                        <td className="p-2">{new Date(b.check_out_date).toLocaleDateString()}</td>
                        <td className="p-2">
                          <Badge variant={b.status === "confirmed" ? "default" : b.status === "cancelled" ? "destructive" : "secondary"}>
                            {b.status}
                          </Badge>
                        </td>
                        <td className="p-2 text-right font-medium">
                          {b.total_price !== null ? `₹${b.total_price.toFixed(0)}` : "—"}
                        </td>
                      </tr>
                    ))}
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
