import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { INVOICES, MONTHLY_REVENUE, EXPENSE_BREAKDOWN } from "@/data/mock-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, TrendingUp, FileText, CreditCard, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

const invoiceStatusColors: Record<string, string> = { paid: "bg-success/10 text-success", pending: "bg-warning/10 text-warning", overdue: "bg-destructive/10 text-destructive", refunded: "bg-muted text-muted-foreground" };

export default function FinanceDashboard() {
  const totalRevenue = INVOICES.reduce((s, i) => s + i.total, 0);
  const totalPaid = INVOICES.filter(i => i.status === "paid").reduce((s, i) => s + i.total, 0);
  const totalPending = INVOICES.filter(i => i.status === "pending").reduce((s, i) => s + i.total, 0);
  const totalGST = INVOICES.reduce((s, i) => s + i.gst, 0);

  const stats = [
    { label: "Total Revenue", value: `₹${(totalRevenue / 100000).toFixed(1)}L`, icon: DollarSign, color: "text-success", change: "+12.5%" },
    { label: "Collected", value: `₹${(totalPaid / 100000).toFixed(1)}L`, icon: TrendingUp, color: "text-primary", change: "+8.3%" },
    { label: "Pending", value: `₹${(totalPending / 100000).toFixed(1)}L`, icon: CreditCard, color: "text-warning", change: "-2.1%" },
    { label: "GST Collected", value: `₹${(totalGST / 1000).toFixed(0)}K`, icon: FileText, color: "text-info", change: "+10.2%" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-bold">Finance Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card><CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-muted ${s.color}`}><s.icon className="h-4 w-4" /></div>
                <span className={`text-xs font-medium flex items-center gap-0.5 ${s.change.startsWith("+") ? "text-success" : "text-destructive"}`}>
                  {s.change.startsWith("+") ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}{s.change}
                </span>
              </div>
              <p className="text-xl font-heading font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent></Card>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="revenue">
        <TabsList>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="settlements">Settlements</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Monthly Revenue vs Expenses</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MONTHLY_REVENUE}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={v => `₹${v / 100000}L`} />
                    <Tooltip formatter={(v: number) => `₹${v.toLocaleString()}`} />
                    <Bar dataKey="revenue" fill="hsl(174, 100%, 24%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" fill="hsl(174, 30%, 80%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="mt-4 space-y-3">
          {INVOICES.map(inv => (
            <Card key={inv.id}>
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-muted-foreground">{inv.id}</span>
                    <Badge className={invoiceStatusColors[inv.status]}>{inv.status}</Badge>
                  </div>
                  <p className="font-medium text-sm">{inv.guestName}</p>
                  <p className="text-xs text-muted-foreground">Booking: {inv.bookingId} · Date: {inv.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Amount: ₹{inv.amount.toLocaleString()} + GST ₹{inv.gst.toLocaleString()}</p>
                  <p className="font-heading font-bold">₹{inv.total.toLocaleString()}</p>
                  <Button size="sm" variant="outline" className="mt-1 text-xs" onClick={() => toast.success("Invoice downloaded")}>Download</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="expenses" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Expense Breakdown</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {EXPENSE_BREAKDOWN.map(e => (
                  <div key={e.category} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{e.category}</span>
                        <span className="text-sm font-heading font-bold">₹{e.amount.toLocaleString()}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${(e.amount / 500000) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settlements" className="mt-4">
          <Card><CardContent className="p-6 space-y-4">
            <h4 className="text-sm font-medium">Commission & Revenue Share</h4>
            <div className="space-y-3">
              {[
                { hotel: "MedStay Grand Residency", revenue: 245000, commission: 24500, rate: "10%" },
                { hotel: "Artemis Care Suites", revenue: 180000, commission: 18000, rate: "10%" },
                { hotel: "Healing Heights Hotel", revenue: 95000, commission: 9500, rate: "10%" },
                { hotel: "Wellness Stay Inn", revenue: 210000, commission: 21000, rate: "10%" },
              ].map(s => (
                <div key={s.hotel} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">{s.hotel}</p>
                    <p className="text-xs text-muted-foreground">Revenue: ₹{s.revenue.toLocaleString()} · Commission Rate: {s.rate}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-heading font-bold text-primary">₹{s.commission.toLocaleString()}</p>
                    <Button size="sm" variant="outline" className="mt-1 text-xs" onClick={() => toast.success("Settlement processed")}>Settle</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
