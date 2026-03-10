import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FRRO_RECORDS, AUDIT_LOGS, INCIDENTS } from "@/data/mock-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, FileText, AlertTriangle, Lock, Download, Globe } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function ComplianceDashboard() {
  const expiringVisas = FRRO_RECORDS.filter(r => {
    const exp = new Date(r.visaExpiry);
    const now = new Date("2026-03-10");
    const diff = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff < 30;
  });

  const stats = [
    { label: "FRRO Records", value: FRRO_RECORDS.length, icon: Globe, color: "text-primary" },
    { label: "Expiring Visas", value: expiringVisas.length, icon: AlertTriangle, color: "text-warning" },
    { label: "Audit Entries", value: AUDIT_LOGS.length, icon: FileText, color: "text-info" },
    { label: "Active Incidents", value: INCIDENTS.filter(i => i.status !== "resolved").length, icon: Shield, color: "text-destructive" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold">Compliance & Safety</h1>
        <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => toast.success("FRRO data exported")}>
          <Download className="h-3 w-3" /> Export FRRO
        </Button>
      </div>

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

      <Tabs defaultValue="frro">
        <TabsList>
          <TabsTrigger value="frro">FRRO Records</TabsTrigger>
          <TabsTrigger value="visas">Visa Alerts</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          <TabsTrigger value="safety">Trust & Safety</TabsTrigger>
        </TabsList>

        <TabsContent value="frro" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="py-3 px-2 text-xs">Guest</TableHead>
                    <TableHead className="py-3 px-2 text-xs">Nationality</TableHead>
                    <TableHead className="py-3 px-2 text-xs">Passport</TableHead>
                    <TableHead className="py-3 px-2 text-xs">Visa Type</TableHead>
                    <TableHead className="py-3 px-2 text-xs">Visa Expiry</TableHead>
                    <TableHead className="py-3 px-2 text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {FRRO_RECORDS.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="py-3 px-2 font-medium">{r.guestName}</TableCell>
                      <TableCell className="py-3 px-2">{r.nationality}</TableCell>
                      <TableCell className="py-3 px-2 font-mono text-xs"><Lock className="h-3 w-3 inline mr-1 text-muted-foreground" />{r.passportNumber}</TableCell>
                      <TableCell className="py-3 px-2">{r.visaType}</TableCell>
                      <TableCell className="py-3 px-2">{r.visaExpiry}</TableCell>
                      <TableCell className="py-3 px-2"><Badge className={r.status === "Registered" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}>{r.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visas" className="mt-4 space-y-3">
          {expiringVisas.map((r, i) => (
            <Card key={i} className="border-warning/30">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{r.guestName}</p>
                  <p className="text-xs text-muted-foreground">{r.nationality} · Visa expires: {r.visaExpiry}</p>
                </div>
                <Button size="sm" variant="outline" className="text-xs" onClick={() => toast.info("Reminder sent")}>Send Reminder</Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="py-3 px-2 text-xs">Time</TableHead>
                    <TableHead className="py-3 px-2 text-xs">Action</TableHead>
                    <TableHead className="py-3 px-2 text-xs">User</TableHead>
                    <TableHead className="py-3 px-2 text-xs">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {AUDIT_LOGS.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="py-3 px-2 text-xs font-mono">{log.timestamp}</TableCell>
                      <TableCell className="py-3 px-2"><Badge variant="outline" className="font-mono text-[10px]">{log.action}</Badge></TableCell>
                      <TableCell className="py-3 px-2 text-xs">{log.role}</TableCell>
                      <TableCell className="py-3 px-2 text-xs text-muted-foreground">{log.details}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="safety" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Panic Alert System</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">Emergency alerts from guests and staff</p>
              <div className="p-4 rounded-lg bg-success/5 border border-success/20">
                <p className="text-sm font-medium text-success">✓ No active emergency alerts</p>
                <p className="text-xs text-muted-foreground mt-1">Last alert: 2026-03-09 14:22 — Resolved</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Hotel Quality Scores</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[
                { name: "MedStay Grand Residency", score: 94, badge: "Verified" },
                { name: "Artemis Care Suites", score: 91, badge: "Verified" },
                { name: "Healing Heights Hotel", score: 86, badge: "Verified" },
                { name: "Wellness Stay Inn", score: 92, badge: "Verified" },
              ].map(h => (
                <div key={h.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">{h.name}</p>
                    <Badge variant="secondary" className="text-[10px] mt-1"><Shield className="h-2.5 w-2.5 mr-1" />{h.badge}</Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-heading font-bold text-primary">{h.score}</p>
                    <p className="text-[10px] text-muted-foreground">Quality Score</p>
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
