import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MONTHLY_REVENUE, OCCUPANCY_DATA, EXPENSE_BREAKDOWN, HOTELS } from "@/data/mock-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, BedDouble, DollarSign, Download, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from "recharts";

const forecastData = [
  ...MONTHLY_REVENUE,
  { month: "Apr", revenue: 3350000, expenses: 1250000 },
  { month: "May", revenue: 3500000, expenses: 1300000 },
  { month: "Jun", revenue: 3200000, expenses: 1280000 },
];

const roomPerformance = HOTELS[0].rooms.slice(0, 8).map((r, i) => ({
  room: `Room ${r.number}`,
  revenue: Math.round(50000 + Math.random() * 150000),
  occupancy: Math.round(55 + Math.random() * 40),
  rating: Number((4.0 + Math.random() * 0.9).toFixed(1)),
}));

export default function OwnerAnalytics() {
  const totalRev = MONTHLY_REVENUE.reduce((s, m) => s + m.revenue, 0);
  const totalExp = MONTHLY_REVENUE.reduce((s, m) => s + m.expenses, 0);
  const avgOccupancy = Math.round(OCCUPANCY_DATA.reduce((s, m) => s + m.rate, 0) / OCCUPANCY_DATA.length);

  const stats = [
    { label: "Total Revenue", value: `₹${(totalRev / 10000000).toFixed(1)}Cr`, icon: BarChart3, color: "text-success", change: "+18.2%" },
    { label: "Net Profit", value: `₹${((totalRev - totalExp) / 10000000).toFixed(1)}Cr`, icon: TrendingUp, color: "text-primary", change: "+22.5%" },
    { label: "Avg Occupancy", value: `${avgOccupancy}%`, icon: BedDouble, color: "text-info", change: "+5.3%" },
    { label: "Rev/Room", value: `₹${Math.round(totalRev / 52 / 1000)}K`, icon: DollarSign, color: "text-warning", change: "+8.1%" },
  ];

  const handleExport = (format: string) => toast.success(`Report exported as ${format}`);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold">Owner Analytics</h1>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handleExport("CSV")} className="text-xs gap-1"><Download className="h-3 w-3" />CSV</Button>
          <Button size="sm" variant="outline" onClick={() => handleExport("Excel")} className="text-xs gap-1"><Download className="h-3 w-3" />Excel</Button>
          <Button size="sm" variant="outline" onClick={() => handleExport("PDF")} className="text-xs gap-1"><Download className="h-3 w-3" />PDF</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card><CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-muted ${s.color}`}><s.icon className="h-4 w-4" /></div>
                <span className="text-xs font-medium flex items-center gap-0.5 text-success"><ArrowUpRight className="h-3 w-3" />{s.change}</span>
              </div>
              <p className="text-xl font-heading font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent></Card>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="revenue">
        <TabsList className="flex-wrap">
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="occupancy">Occupancy</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="forecast">Forecast</TabsTrigger>
          <TabsTrigger value="rooms">Room Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Monthly Revenue Trend</CardTitle></CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MONTHLY_REVENUE}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={v => `₹${v / 100000}L`} />
                    <Tooltip formatter={(v: number) => `₹${v.toLocaleString()}`} />
                    <Bar dataKey="revenue" fill="hsl(174, 100%, 24%)" radius={[4, 4, 0, 0]} name="Revenue" />
                    <Bar dataKey="expenses" fill="hsl(174, 30%, 80%)" radius={[4, 4, 0, 0]} name="Expenses" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="occupancy" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Occupancy Rate Trend</CardTitle></CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={OCCUPANCY_DATA}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={v => `${v}%`} />
                    <Tooltip formatter={(v: number) => `${v}%`} />
                    <Area type="monotone" dataKey="rate" stroke="hsl(174, 100%, 24%)" fill="hsl(174, 100%, 24%)" fillOpacity={0.15} name="Occupancy" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Expense Breakdown</CardTitle></CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={EXPENSE_BREAKDOWN} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" className="text-xs" tickFormatter={v => `₹${v / 1000}K`} />
                    <YAxis type="category" dataKey="category" className="text-xs" width={120} />
                    <Tooltip formatter={(v: number) => `₹${v.toLocaleString()}`} />
                    <Bar dataKey="amount" fill="hsl(174, 100%, 24%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecast" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Revenue Forecast (Next 3 Months)</CardTitle></CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={forecastData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={v => `₹${v / 100000}L`} />
                    <Tooltip formatter={(v: number) => `₹${v.toLocaleString()}`} />
                    <Line type="monotone" dataKey="revenue" stroke="hsl(174, 100%, 24%)" strokeWidth={2} dot={{ r: 4 }} name="Revenue" />
                    <Line type="monotone" dataKey="expenses" stroke="hsl(0, 72%, 51%)" strokeWidth={2} dot={{ r: 4 }} strokeDasharray="5 5" name="Expenses" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/10">
                <h4 className="text-sm font-heading font-semibold mb-2">Forecast Insights</h4>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li>• Projected Q2 revenue: ₹1.0 Cr (+14% YoY)</li>
                  <li>• Peak occupancy expected in April (medical tourism season)</li>
                  <li>• Recommended: Increase pricing for Premium Suites by 8%</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rooms" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Room Performance Analysis</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="py-3 px-2 text-xs">Room</TableHead>
                    <TableHead className="py-3 px-2 text-xs text-right">Revenue</TableHead>
                    <TableHead className="py-3 px-2 text-xs text-right">Occupancy</TableHead>
                    <TableHead className="py-3 px-2 text-xs text-right">Rating</TableHead>
                    <TableHead className="py-3 px-2 text-xs text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roomPerformance.sort((a, b) => b.revenue - a.revenue).map(r => (
                    <TableRow key={r.room}>
                      <TableCell className="py-3 px-2 font-medium">{r.room}</TableCell>
                      <TableCell className="py-3 px-2 text-right font-heading">₹{r.revenue.toLocaleString()}</TableCell>
                      <TableCell className="py-3 px-2 text-right">{r.occupancy}%</TableCell>
                      <TableCell className="py-3 px-2 text-right">{r.rating}</TableCell>
                      <TableCell className="py-3 px-2 text-right">
                        <Badge className={r.occupancy > 80 ? "bg-success/10 text-success" : r.occupancy > 60 ? "bg-info/10 text-info" : "bg-warning/10 text-warning"}>
                          {r.occupancy > 80 ? "Top Performer" : r.occupancy > 60 ? "Average" : "Underperforming"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
