import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, FileText, AlertTriangle, Lock, Download, Globe, Search, Check, X, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  FRRORecord,
  AuditLog,
  Incident,
  HotelQualityScore,
  listFRRORecords,
  getExpiringVisas,
  updateGuestFRROStatus,
  listAuditLogs,
  listIncidents,
  createIncident,
  updateIncident,
  deleteIncident,
  getHotelQualityScores,
} from "@/lib/supabase";
import { exportToCSV, formatDateForCSV, formatTimestampForCSV } from "@/lib/export-utils";
import { useAuth } from "@/lib/auth";

export default function ComplianceDashboard() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // FRRO State
  const [frroRecords, setFrroRecords] = useState<FRRORecord[]>([]);
  const [filteredFrroRecords, setFilteredFrroRecords] = useState<FRRORecord[]>([]);
  const [frroSearch, setFrroSearch] = useState("");
  const [frroNationalityFilter, setFrroNationalityFilter] = useState("all");
  const [expiringVisas, setExpiringVisas] = useState<FRRORecord[]>([]);

  // Audit Log State
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditActionFilter, setAuditActionFilter] = useState("all");
  const [auditStartDate, setAuditStartDate] = useState("");
  const [auditEndDate, setAuditEndDate] = useState("");

  // Incidents State
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [incidentStatusFilter, setIncidentStatusFilter] = useState("all");
  const [isIncidentDialogOpen, setIsIncidentDialogOpen] = useState(false);
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);
  const [incidentForm, setIncidentForm] = useState({
    title: "",
    description: "",
    type: "security",
    priority: "medium",
  });

  // Quality Scores State
  const [qualityScores, setQualityScores] = useState<HotelQualityScore[]>([]);

  // Load all data
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      loadFRROData(),
      loadAuditLogs(),
      loadIncidents(),
      loadQualityScores(),
    ]);
    setLoading(false);
  };

  const loadFRROData = async () => {
    const [frroRes, visasRes] = await Promise.all([
      listFRRORecords(),
      getExpiringVisas(30),
    ]);
    if (frroRes.error) {
      toast.error("Failed to load FRRO records");
      return;
    }
    if (visasRes.error) {
      toast.error("Failed to load expiring visas");
      return;
    }
    setFrroRecords(frroRes.data);
    setFilteredFrroRecords(frroRes.data);
    setExpiringVisas(visasRes.data);
  };

  const loadAuditLogs = async () => {
    const { data, error } = await listAuditLogs({ limit: 100 });
    if (error) {
      toast.error("Failed to load audit logs");
      return;
    }
    setAuditLogs(data);
  };

  const loadIncidents = async () => {
    const { data, error } = await listIncidents();
    if (error) {
      toast.error("Failed to load incidents");
      return;
    }
    setIncidents(data);
  };

  const loadQualityScores = async () => {
    const { data, error } = await getHotelQualityScores();
    if (error) {
      toast.error("Failed to load quality scores");
      return;
    }
    setQualityScores(data);
  };

  // FRRO Filters
  useEffect(() => {
    let filtered = frroRecords;
    if (frroSearch) {
      filtered = filtered.filter(r =>
        r.guest_name?.toLowerCase().includes(frroSearch.toLowerCase()) ||
        r.passport_number?.toLowerCase().includes(frroSearch.toLowerCase())
      );
    }
    if (frroNationalityFilter !== "all") {
      filtered = filtered.filter(r => r.nationality === frroNationalityFilter);
    }
    setFilteredFrroRecords(filtered);
  }, [frroSearch, frroNationalityFilter, frroRecords]);

  const handleRegisterFRRO = async (guestId: string) => {
    const { error } = await updateGuestFRROStatus(guestId, "registered", new Date().toISOString().split('T')[0]);
    if (error) {
      toast.error("Failed to register FRRO");
      return;
    }
    toast.success("FRRO registered successfully");
    loadFRROData();
  };

  const handleRejectFRRO = async (guestId: string) => {
    const { error } = await updateGuestFRROStatus(guestId, "rejected");
    if (error) {
      toast.error("Failed to reject FRRO");
      return;
    }
    toast.success("FRRO rejected");
    loadFRROData();
  };

  // Export Functions
  const exportFRRO = () => {
    exportToCSV(
      filteredFrroRecords.map(r => ({
        guest_name: r.guest_name || "",
        nationality: r.nationality || "",
        passport_number: r.passport_number || "",
        visa_type: r.visa_type || "",
        visa_expiry: formatDateForCSV(r.visa_expiry_date),
        frro_status: r.frro_status || "",
        registration_date: formatDateForCSV(r.frro_registration_date),
        hotel_name: r.hotel_name || "",
      })),
      [
        { key: "guest_name", label: "Guest Name" },
        { key: "nationality", label: "Nationality" },
        { key: "passport_number", label: "Passport Number" },
        { key: "visa_type", label: "Visa Type" },
        { key: "visa_expiry", label: "Visa Expiry" },
        { key: "frro_status", label: "Status" },
        { key: "registration_date", label: "Registration Date" },
        { key: "hotel_name", label: "Hotel" },
      ],
      "frro_records"
    );
    toast.success("FRRO records exported");
  };

  const exportAuditLogs = () => {
    const filtered = auditLogs.filter(log => {
      if (auditActionFilter !== "all" && log.action !== auditActionFilter) return false;
      if (auditStartDate && log.created_at < auditStartDate) return false;
      if (auditEndDate && log.created_at > auditEndDate) return false;
      return true;
    });

    exportToCSV(
      filtered.map(log => ({
        timestamp: formatTimestampForCSV(log.created_at),
        action: log.action,
        user_email: log.user_email || "",
        user_role: log.user_role || "",
        entity: log.entity,
        details: log.details || "",
        ip_address: log.ip_address || "",
      })),
      [
        { key: "timestamp", label: "Timestamp" },
        { key: "action", label: "Action" },
        { key: "user_email", label: "User Email" },
        { key: "user_role", label: "Role" },
        { key: "entity", label: "Entity" },
        { key: "details", label: "Details" },
        { key: "ip_address", label: "IP Address" },
      ],
      "audit_logs"
    );
    toast.success("Audit logs exported");
  };

  const exportIncidents = () => {
    const filtered = incidentStatusFilter === "all" 
      ? incidents 
      : incidents.filter(i => i.status === incidentStatusFilter);

    exportToCSV(
      filtered.map(i => ({
        id: i.id,
        type: i.type,
        title: i.title,
        description: i.description || "",
        status: i.status,
        priority: i.priority,
        hotel_name: i.hotel_name || "",
        created_at: formatTimestampForCSV(i.created_at),
        resolved_at: formatTimestampForCSV(i.resolved_at),
      })),
      [
        { key: "id", label: "ID" },
        { key: "type", label: "Type" },
        { key: "title", label: "Title" },
        { key: "description", label: "Description" },
        { key: "status", label: "Status" },
        { key: "priority", label: "Priority" },
        { key: "hotel_name", label: "Hotel" },
        { key: "created_at", label: "Created At" },
        { key: "resolved_at", label: "Resolved At" },
      ],
      "incidents"
    );
    toast.success("Incidents exported");
  };

  // Incident CRUD
  const handleCreateIncident = async () => {
    if (!profile?.id || !incidentForm.title.trim()) {
      toast.error("Title is required");
      return;
    }
    const { error } = await createIncident(profile.id, incidentForm);
    if (error) {
      toast.error("Failed to create incident");
      return;
    }
    toast.success("Incident created");
    setIsIncidentDialogOpen(false);
    setIncidentForm({ title: "", description: "", type: "security", priority: "medium" });
    loadIncidents();
  };

  const handleUpdateIncidentStatus = async (incidentId: string, status: string) => {
    const { error } = await updateIncident(incidentId, { status });
    if (error) {
      toast.error("Failed to update incident");
      return;
    }
    toast.success("Incident updated");
    loadIncidents();
  };

  const handleDeleteIncident = async (incidentId: string) => {
    const { error } = await deleteIncident(incidentId);
    if (error) {
      toast.error("Failed to delete incident");
      return;
    }
    toast.success("Incident deleted");
    loadIncidents();
  };

  const stats = [
    { label: "FRRO Records", value: frroRecords.length, icon: Globe, color: "text-primary" },
    { label: "Expiring Visas", value: expiringVisas.length, icon: AlertTriangle, color: "text-warning" },
    { label: "Audit Entries", value: auditLogs.length, icon: FileText, color: "text-info" },
    { label: "Active Incidents", value: incidents.filter(i => i.status !== "resolved").length, icon: Shield, color: "text-destructive" },
  ];

  const uniqueNationalities = Array.from(new Set(frroRecords.map(r => r.nationality).filter(Boolean))).sort();
  const uniqueActions = Array.from(new Set(auditLogs.map(l => l.action))).sort();

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold">Compliance & Safety</h1>
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
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-base">FRRO Records</CardTitle>
              <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={exportFRRO}>
                <Download className="h-3 w-3" /> Export
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or passport"
                      value={frroSearch}
                      onChange={(e) => setFrroSearch(e.target.value)}
                      className="pl-8 h-9 text-sm"
                    />
                  </div>
                </div>
                <Select value={frroNationalityFilter} onValueChange={setFrroNationalityFilter}>
                  <SelectTrigger className="w-[180px] h-9 text-sm">
                    <SelectValue placeholder="Nationality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Nationalities</SelectItem>
                    {uniqueNationalities.map(n => <SelectItem key={n} value={n!}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {filteredFrroRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No FRRO records found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="py-3 px-2 text-xs">Guest</TableHead>
                      <TableHead className="py-3 px-2 text-xs">Nationality</TableHead>
                      <TableHead className="py-3 px-2 text-xs">Passport</TableHead>
                      <TableHead className="py-3 px-2 text-xs">Visa Type</TableHead>
                      <TableHead className="py-3 px-2 text-xs">Visa Expiry</TableHead>
                      <TableHead className="py-3 px-2 text-xs">Status</TableHead>
                      <TableHead className="py-3 px-2 text-xs">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFrroRecords.map((r) => {
                      const daysUntilExpiry = r.visa_expiry_date ? Math.floor((new Date(r.visa_expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
                      const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry < 30;
                      
                      return (
                        <TableRow key={r.guest_id} className={isExpiringSoon ? "bg-warning/5" : ""}>
                          <TableCell className="py-3 px-2 font-medium">{r.guest_name}</TableCell>
                          <TableCell className="py-3 px-2">{r.nationality || "—"}</TableCell>
                          <TableCell className="py-3 px-2 font-mono text-xs">
                            <Lock className="h-3 w-3 inline mr-1 text-muted-foreground" />
                            {r.passport_number}
                          </TableCell>
                          <TableCell className="py-3 px-2">{r.visa_type || "—"}</TableCell>
                          <TableCell className="py-3 px-2">
                            {r.visa_expiry_date ? formatDateForCSV(r.visa_expiry_date) : "—"}
                            {isExpiringSoon && <span className="ml-1 text-warning text-xs">({daysUntilExpiry}d)</span>}
                          </TableCell>
                          <TableCell className="py-3 px-2">
                            <Badge className={
                              r.frro_status === "registered" ? "bg-success/10 text-success" :
                              r.frro_status === "rejected" ? "bg-destructive/10 text-destructive" :
                              "bg-warning/10 text-warning"
                            }>
                              {r.frro_status || "pending"}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3 px-2">
                            {r.frro_status === "pending" && (
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => handleRegisterFRRO(r.guest_id)}>
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-destructive" onClick={() => handleRejectFRRO(r.guest_id)}>
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visas" className="mt-4 space-y-3">
          {expiringVisas.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground text-sm">
                No visas expiring in the next 30 days
              </CardContent>
            </Card>
          ) : (
            expiringVisas.map((r) => (
              <Card key={r.guest_id} className="border-warning/30">
                <CardContent className="p-4 flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{r.guest_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.nationality} · Visa expires: {formatDateForCSV(r.visa_expiry_date)} ({r.days_until_expiry}d)
                    </p>
                  </div>
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => toast.info("Reminder functionality coming soon")}>
                    Send Reminder
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-base">Audit Trail</CardTitle>
              <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={exportAuditLogs}>
                <Download className="h-3 w-3" /> Export
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Select value={auditActionFilter} onValueChange={setAuditActionFilter}>
                  <SelectTrigger className="w-[180px] h-9 text-sm">
                    <SelectValue placeholder="Action Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    {uniqueActions.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  value={auditStartDate}
                  onChange={(e) => setAuditStartDate(e.target.value)}
                  className="w-[160px] h-9 text-sm"
                  placeholder="Start Date"
                />
                <Input
                  type="date"
                  value={auditEndDate}
                  onChange={(e) => setAuditEndDate(e.target.value)}
                  className="w-[160px] h-9 text-sm"
                  placeholder="End Date"
                />
              </div>

              {auditLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No audit logs found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="py-3 px-2 text-xs">Timestamp</TableHead>
                      <TableHead className="py-3 px-2 text-xs">Action</TableHead>
                      <TableHead className="py-3 px-2 text-xs">User</TableHead>
                      <TableHead className="py-3 px-2 text-xs">Entity</TableHead>
                      <TableHead className="py-3 px-2 text-xs">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs
                      .filter(log => {
                        if (auditActionFilter !== "all" && log.action !== auditActionFilter) return false;
                        if (auditStartDate && log.created_at < auditStartDate) return false;
                        if (auditEndDate && log.created_at > auditEndDate) return false;
                        return true;
                      })
                      .slice(0, 50)
                      .map(log => (
                        <TableRow key={log.id}>
                          <TableCell className="py-3 px-2 text-xs font-mono">{formatTimestampForCSV(log.created_at)}</TableCell>
                          <TableCell className="py-3 px-2"><Badge variant="outline" className="font-mono text-[10px]">{log.action}</Badge></TableCell>
                          <TableCell className="py-3 px-2 text-xs">
                            {log.user_email || "—"}
                            {log.user_role && <span className="text-muted-foreground"> ({log.user_role})</span>}
                          </TableCell>
                          <TableCell className="py-3 px-2 text-xs">{log.entity}</TableCell>
                          <TableCell className="py-3 px-2 text-xs text-muted-foreground">{log.details || "—"}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="safety" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Incidents</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={exportIncidents}>
                  <Download className="h-3 w-3" /> Export
                </Button>
                <Dialog open={isIncidentDialogOpen} onOpenChange={setIsIncidentDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="default" className="gap-1 text-xs">
                      <Plus className="h-3 w-3" /> Report Incident
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Report New Incident</DialogTitle>
                      <DialogDescription>Create a new safety or security incident report</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Title *</Label>
                        <Input
                          value={incidentForm.title}
                          onChange={(e) => setIncidentForm({ ...incidentForm, title: e.target.value })}
                          placeholder="Brief incident title"
                        />
                      </div>
                      <div>
                        <Label>Type</Label>
                        <Select value={incidentForm.type} onValueChange={(v) => setIncidentForm({ ...incidentForm, type: v })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="security">Security</SelectItem>
                            <SelectItem value="safety">Safety</SelectItem>
                            <SelectItem value="health">Health</SelectItem>
                            <SelectItem value="fraud">Fraud</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Priority</Label>
                        <Select value={incidentForm.priority} onValueChange={(v) => setIncidentForm({ ...incidentForm, priority: v })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={incidentForm.description}
                          onChange={(e) => setIncidentForm({ ...incidentForm, description: e.target.value })}
                          placeholder="Detailed description of the incident"
                          rows={4}
                        />
                      </div>
                      <Button onClick={handleCreateIncident} className="w-full">Create Incident</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={incidentStatusFilter} onValueChange={setIncidentStatusFilter}>
                <SelectTrigger className="w-[180px] h-9 text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>

              {incidents.filter(i => incidentStatusFilter === "all" || i.status === incidentStatusFilter).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No incidents found
                </div>
              ) : (
                <div className="space-y-2">
                  {incidents
                    .filter(i => incidentStatusFilter === "all" || i.status === incidentStatusFilter)
                    .map(incident => (
                      <Card key={incident.id} className="border">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-sm">{incident.title}</p>
                                <Badge variant="outline" className="text-[10px]">{incident.type}</Badge>
                                <Badge className={
                                  incident.priority === "critical" ? "bg-destructive/10 text-destructive" :
                                  incident.priority === "high" ? "bg-warning/10 text-warning" :
                                  "bg-muted text-muted-foreground"
                                }>
                                  {incident.priority}
                                </Badge>
                              </div>
                              {incident.description && (
                                <p className="text-xs text-muted-foreground mb-2">{incident.description}</p>
                              )}
                              <div className="flex gap-4 text-xs text-muted-foreground">
                                <span>Status: <Badge variant="outline" className="text-[10px] ml-1">{incident.status}</Badge></span>
                                {incident.hotel_name && <span>Hotel: {incident.hotel_name}</span>}
                                <span>Created: {formatDateForCSV(incident.created_at)}</span>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              {incident.status !== "resolved" && (
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-7 px-2 text-xs text-success"
                                  onClick={() => handleUpdateIncidentStatus(incident.id, "resolved")}
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                              )}
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-7 px-2 text-xs text-destructive"
                                onClick={() => handleDeleteIncident(incident.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Hotel Quality Scores</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {qualityScores.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No quality scores available
                </div>
              ) : (
                qualityScores.slice(0, 10).map(h => (
                  <div key={h.hotel_id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm font-medium">{h.hotel_name}</p>
                      <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                        <span>{h.total_bookings} bookings</span>
                        <span>·</span>
                        <span>{h.incident_count} incidents</span>
                        <span>·</span>
                        <span>{h.success_rate}% success</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-heading font-bold ${
                        h.quality_score >= 90 ? "text-success" :
                        h.quality_score >= 70 ? "text-primary" :
                        "text-warning"
                      }`}>{h.quality_score}</p>
                      <p className="text-[10px] text-muted-foreground">Quality Score</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
