import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PLATFORM_USERS, HOTELS, INVOICES, INCIDENTS, AUDIT_LOGS } from "@/data/mock-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Building, CreditCard, AlertTriangle, FileText, Shield, Activity, Settings } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";

const incidentPriorityColors: Record<string, string> = { low: "bg-muted text-muted-foreground", medium: "bg-info/10 text-info", high: "bg-warning/10 text-warning", critical: "bg-destructive/10 text-destructive" };
const incidentStatusColors: Record<string, string> = { open: "bg-warning/10 text-warning", investigating: "bg-info/10 text-info", resolved: "bg-success/10 text-success", escalated: "bg-destructive/10 text-destructive" };

export default function AdminDashboard() {
  const stats = [
    { label: "Total Users", value: PLATFORM_USERS.length, icon: Users, color: "text-primary" },
    { label: "Active Hotels", value: HOTELS.length, icon: Building, color: "text-success" },
    { label: "Total Revenue", value: `₹${(INVOICES.reduce((s, i) => s + i.total, 0) / 100000).toFixed(1)}L`, icon: CreditCard, color: "text-info" },
    { label: "Open Incidents", value: INCIDENTS.filter(i => i.status === "open" || i.status === "investigating").length, icon: AlertTriangle, color: "text-warning" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-heading font-bold">Admin Control Center</h1>

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

      <Tabs defaultValue="users">
        <TabsList className="flex-wrap">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="hotels">Hotels</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="fraud">Fraud</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="logs">System Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-base">User Management</CardTitle>
              <Input placeholder="Search users..." className="w-full sm:w-48" />
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="py-3 px-2 text-xs">Name</TableHead>
                    <TableHead className="py-3 px-2 text-xs">Email</TableHead>
                    <TableHead className="py-3 px-2 text-xs">Role</TableHead>
                    <TableHead className="py-3 px-2 text-xs">Status</TableHead>
                    <TableHead className="py-3 px-2 text-xs">Last Login</TableHead>
                    <TableHead className="py-3 px-2 text-xs text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {PLATFORM_USERS.map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="py-3 px-2 font-medium">{u.name}</TableCell>
                      <TableCell className="py-3 px-2 text-muted-foreground text-xs">{u.email}</TableCell>
                      <TableCell className="py-3 px-2"><Badge variant="secondary" className="text-[10px]">{u.role}</Badge></TableCell>
                      <TableCell className="py-3 px-2"><Badge className="bg-success/10 text-success text-[10px]">{u.status}</Badge></TableCell>
                      <TableCell className="py-3 px-2 text-xs text-muted-foreground">{u.lastLogin}</TableCell>
                      <TableCell className="py-3 px-2 text-right">
                        <Button size="sm" variant="ghost" className="text-xs" onClick={() => toast.info(`Editing ${u.name}`)}>Edit</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hotels" className="mt-4 space-y-3">
          {HOTELS.map(h => (
            <Card key={h.id}>
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <img src={h.image} alt={h.name} className="h-16 w-24 rounded-lg object-cover" />
                <div className="flex-1">
                  <p className="font-medium">{h.name}</p>
                  <p className="text-xs text-muted-foreground">{h.address} · {h.rooms.length} rooms · Rating: {h.rating}</p>
                </div>
                <div className="flex gap-2">
                  <Badge className="bg-success/10 text-success">Approved</Badge>
                  <Button size="sm" variant="outline" className="text-xs">Manage</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <Card><CardContent className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="py-3 px-2 text-xs">Invoice</TableHead>
                  <TableHead className="py-3 px-2 text-xs">Guest</TableHead>
                  <TableHead className="py-3 px-2 text-xs text-right">Amount</TableHead>
                  <TableHead className="py-3 px-2 text-xs">Status</TableHead>
                  <TableHead className="py-3 px-2 text-xs">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {INVOICES.map(inv => (
                  <TableRow key={inv.id}>
                    <TableCell className="py-3 px-2 font-mono text-xs">{inv.id}</TableCell>
                    <TableCell className="py-3 px-2">{inv.guestName}</TableCell>
                    <TableCell className="py-3 px-2 text-right font-heading font-bold">₹{inv.total.toLocaleString()}</TableCell>
                    <TableCell className="py-3 px-2"><Badge className={inv.status === "paid" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}>{inv.status}</Badge></TableCell>
                    <TableCell className="py-3 px-2 text-xs text-muted-foreground">{inv.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="fraud" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Fraud Detection</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <span className="font-medium text-sm">Suspicious Activity Detected</span>
                </div>
                <p className="text-xs text-muted-foreground">Multiple bookings from IP 185.220.101.42 with different identities — possible fraud ring.</p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="destructive" className="text-xs" onClick={() => toast.success("IP blocked")}>Block IP</Button>
                  <Button size="sm" variant="outline" className="text-xs">Investigate</Button>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-warning/5 border border-warning/20">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-warning" />
                  <span className="font-medium text-sm">Chargeback Alert</span>
                </div>
                <p className="text-xs text-muted-foreground">Guest "John D." initiated chargeback on booking BK-2026-009 (₹42,000)</p>
                <Button size="sm" variant="outline" className="text-xs mt-3">Review Case</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents" className="mt-4 space-y-3">
          {INCIDENTS.map(inc => (
            <Card key={inc.id} className={inc.priority === "critical" ? "border-destructive/30" : ""}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={incidentPriorityColors[inc.priority]}>{inc.priority}</Badge>
                  <Badge className={incidentStatusColors[inc.status]}>{inc.status}</Badge>
                  <span className="text-xs text-muted-foreground ml-auto">{inc.timestamp}</span>
                </div>
                <p className="font-medium text-sm">{inc.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{inc.description}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Reported by: {inc.reportedBy}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="logs" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">System Audit Logs</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="py-3 px-2 text-xs">Timestamp</TableHead>
                    <TableHead className="py-3 px-2 text-xs">Action</TableHead>
                    <TableHead className="py-3 px-2 text-xs">User</TableHead>
                    <TableHead className="py-3 px-2 text-xs">Details</TableHead>
                    <TableHead className="py-3 px-2 text-xs">IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {AUDIT_LOGS.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="py-3 px-2 text-xs font-mono text-muted-foreground">{log.timestamp}</TableCell>
                      <TableCell className="py-3 px-2"><Badge variant="outline" className="text-[10px] font-mono">{log.action}</Badge></TableCell>
                      <TableCell className="py-3 px-2 text-xs">{log.user}</TableCell>
                      <TableCell className="py-3 px-2 text-xs text-muted-foreground max-w-xs truncate">{log.details}</TableCell>
                      <TableCell className="py-3 px-2 text-xs font-mono text-muted-foreground">{log.ip}</TableCell>
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
