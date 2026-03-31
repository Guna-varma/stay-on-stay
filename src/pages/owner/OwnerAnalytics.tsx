import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BedDouble,
  Building2,
  Check,
  ExternalLink,
  Loader2,
  MapPin,
  Plus,
  Trash2,
  Upload,
  UserCog,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import {
  assignManagerByOwner,
  createHotelOnly,
  createRoomType,
  createRoom,
  insertRoomTypeImage,
  uploadRoomTypeImageCompressed,
  invalidateCatalogCache,
  isSupabaseConfigured,
  listAmenities,
  createAmenity,
  listCustomersForOwnerPromotion,
  listManagersForOwner,
  listOwnerHotels,
  listRoomsByHotel,
  revokeManagerByOwner,
  type AmenityRecord,
  type HotelRecord,
  type OwnerManagerAssignment,
  type OwnerPromotableUser,
} from "@/lib/supabase";
import OwnerRevenue from "./OwnerRevenue";
import OwnerOccupancy from "./OwnerOccupancy";
import OwnerExpenses from "./OwnerExpenses";
import OwnerRoomPerformance from "./OwnerRoomPerformance";
import OwnerForecast from "./OwnerForecast";

interface OwnerHotelView extends HotelRecord {
  roomCount: number;
}

type DiscountType = "none" | "percentage" | "flat";

interface RoomForm {
  name: string;
  basePrice: string;
  maxGuests: string;
  roomCount: string;
  roomNumbers: string[];
  discountType: DiscountType;
  discountValue: string;
  images: File[];
}

interface LandmarkForm {
  name: string;
  googleMapsUrl: string;
}

function generateDefaultRoomNumbers(typeName: string, count: number): string[] {
  const prefix = (typeName.trim().slice(0, 3) || "RM").toUpperCase().replace(/\s/g, "");
  return Array.from({ length: count }, (_, i) => `${prefix}-${String(i + 1).padStart(2, "0")}`);
}

const emptyRoom = (): RoomForm => ({
  name: "",
  basePrice: "",
  maxGuests: "2",
  roomCount: "1",
  roomNumbers: [""],
  discountType: "none",
  discountValue: "",
  images: [],
});

function calcFinalPrice(bp: string, dt: DiscountType, dv: string): number | null {
  const b = Number(bp);
  if (!Number.isFinite(b) || b <= 0) return null;
  if (dt === "none") return b;
  const trimmed = dv.trim();
  if (trimmed === "") return null;
  const d = Number(trimmed);
  if (!Number.isFinite(d) || d < 0) return null;
  if (dt === "percentage") return Math.max(0, b - (b * d) / 100);
  if (dt === "flat") return Math.max(0, b - d);
  return b;
}

export default function OwnerAnalytics() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const hasSupabase = isSupabaseConfigured();

  // Determine analytics tab from route (sub-routes only)
  const activeAnalyticsTab = useMemo(() => {
    const path = location.pathname;
    if (path.includes("/analytics/revenue")) return "revenue";
    if (path.includes("/analytics/occupancy")) return "occupancy";
    if (path.includes("/analytics/expenses")) return "expenses";
    if (path.includes("/analytics/forecast")) return "forecast";
    if (path.includes("/analytics/rooms")) return "rooms";
    return null;
  }, [location.pathname]);
  const [activeTab, setActiveTab] = useState("overview");

  const [loading, setLoading] = useState(true);
  const [hotels, setHotels] = useState<OwnerHotelView[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState("");

  // Team management
  const [teamLoading, setTeamLoading] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [demotingUserId, setDemotingUserId] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [managerSearch, setManagerSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [promotableUsers, setPromotableUsers] = useState<OwnerPromotableUser[]>([]);
  const [managers, setManagers] = useState<OwnerManagerAssignment[]>([]);

  // Hotel creation
  const [hotelName, setHotelName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [coverFiles, setCoverFiles] = useState<File[]>([]);
  const [savingHotel, setSavingHotel] = useState(false);

  // Amenities
  const [allAmenities, setAllAmenities] = useState<AmenityRecord[]>([]);
  const [selectedAmenityIds, setSelectedAmenityIds] = useState<Set<string>>(new Set());
  const [newAmenityName, setNewAmenityName] = useState("");
  const [addingAmenity, setAddingAmenity] = useState(false);

  // Landmarks
  const [landmarks, setLandmarks] = useState<LandmarkForm[]>([]);

  // Add rooms (inline modal-like)
  const [addRoomsForHotelId, setAddRoomsForHotelId] = useState<string | null>(null);
  const [roomForms, setRoomForms] = useState<RoomForm[]>([emptyRoom()]);
  const [savingRooms, setSavingRooms] = useState(false);

  useEffect(() => {
    if (activeAnalyticsTab) setActiveTab(activeAnalyticsTab);
    else if (location.pathname === "/dashboard") setActiveTab((prev) => (["add", "list", "team"].includes(prev) ? prev : "overview"));
  }, [activeAnalyticsTab, location.pathname]);

  const refreshHotels = async () => {
    if (!user?.id || !hasSupabase) { setLoading(false); return; }
    setLoading(true);
    const hotelRes = await listOwnerHotels(user.id);
    if (hotelRes.error) { setLoading(false); toast.error(hotelRes.error.message); return; }
    const withCounts: OwnerHotelView[] = [];
    for (const h of hotelRes.data) {
      const roomsRes = await listRoomsByHotel(h.id);
      withCounts.push({ ...h, roomCount: roomsRes.data.length });
    }
    setHotels(withCounts);
    if (!selectedHotelId && withCounts.length > 0) setSelectedHotelId(withCounts[0].id);
    if (selectedHotelId && !withCounts.find((h) => h.id === selectedHotelId)) setSelectedHotelId(withCounts[0]?.id ?? "");
    setLoading(false);
  };

  useEffect(() => { refreshHotels(); }, [user?.id, hasSupabase]);
  useEffect(() => {
    if (hasSupabase) listAmenities().then(({ data }) => { if (data) setAllAmenities(data); });
  }, [hasSupabase]);

  const totalRooms = useMemo(() => hotels.reduce((s, h) => s + h.roomCount, 0), [hotels]);

  // Team refresh
  const refreshTeamData = async () => {
    if (!user?.id || !selectedHotelId) { setPromotableUsers([]); setManagers([]); return; }
    setTeamLoading(true);
    const [customersRes, managersRes] = await Promise.all([
      listCustomersForOwnerPromotion(user.id, selectedHotelId, customerSearch),
      listManagersForOwner(user.id, selectedHotelId, managerSearch),
    ]);
    setTeamLoading(false);
    if (customersRes.error) { toast.error(customersRes.error.message); return; }
    if (managersRes.error) { toast.error(managersRes.error.message); return; }
    setPromotableUsers(customersRes.data);
    setManagers(managersRes.data);
    if (!customersRes.data.some((c) => c.user_id === selectedCustomerId)) setSelectedCustomerId("");
  };

  useEffect(() => { if (selectedHotelId && user?.id) refreshTeamData(); }, [selectedHotelId, user?.id]);
  useEffect(() => {
    if (!selectedHotelId || !user?.id) return;
    const t = setTimeout(() => { refreshTeamData(); }, 300);
    return () => clearTimeout(t);
  }, [customerSearch, managerSearch, selectedHotelId, user?.id]);

  const toggleAmenity = (id: string) => {
    setSelectedAmenityIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleAddAmenity = async () => {
    const trimmed = newAmenityName.trim();
    if (!trimmed) return;
    setAddingAmenity(true);
    const { data, error } = await createAmenity(trimmed);
    setAddingAmenity(false);
    if (error) { toast.error(error.message); return; }
    if (data) {
      setAllAmenities((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedAmenityIds((prev) => new Set(prev).add(data.id));
      setNewAmenityName("");
    }
  };

  const handleCreateHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    if (!hotelName.trim()) { toast.error("Hotel name is required"); return; }

    setSavingHotel(true);
    const validLandmarks = landmarks.filter((lm) => lm.name.trim());
    const { data: hotel, error } = await createHotelOnly(user.id, {
      name: hotelName.trim(),
      description,
      address,
      city,
      country,
      imageFiles: coverFiles.length > 0 ? coverFiles : undefined,
      amenityIds: Array.from(selectedAmenityIds),
      landmarks: validLandmarks,
    });
    setSavingHotel(false);

    if (error || !hotel) { toast.error(error?.message ?? "Failed to create hotel"); return; }

    toast.success("Hotel created! Now add rooms.");
    setHotelName(""); setDescription(""); setAddress(""); setCity(""); setCountry("");
    setCoverFiles([]); setSelectedAmenityIds(new Set()); setLandmarks([]);
    await refreshHotels();
    setAddRoomsForHotelId(hotel.id);
    setRoomForms([emptyRoom()]);
  };

  const handleAddRoomsSubmit = async () => {
    if (!addRoomsForHotelId || !user?.id) return;
    const allNumbers = new Set<string>();
    for (let i = 0; i < roomForms.length; i++) {
      const r = roomForms[i];
      if (!r.name.trim()) { toast.error(`Room type ${i + 1}: name required`); return; }
      const price = Number(r.basePrice);
      if (!Number.isFinite(price) || price <= 0) { toast.error(`Room type ${i + 1}: price must be > 0`); return; }
      const rc = Number(r.roomCount);
      if (!Number.isFinite(rc) || rc < 1) { toast.error(`Room type ${i + 1}: rooms must be >= 1`); return; }
      if (r.roomNumbers.length !== rc) { toast.error(`Room type ${i + 1}: room numbers count doesn't match`); return; }
      for (let j = 0; j < r.roomNumbers.length; j++) {
        const num = r.roomNumbers[j].trim();
        if (!num) { toast.error(`Room type ${i + 1}, Room ${j + 1}: room number is required`); return; }
        if (allNumbers.has(num.toLowerCase())) { toast.error(`Room type ${i + 1}, Room ${j + 1}: "${num}" is duplicate`); return; }
        allNumbers.add(num.toLowerCase());
      }
      if (r.images.length < 1) { toast.error(`Room type ${i + 1}: upload at least one image`); return; }
      if (r.discountType !== "none") {
        const dv = Number(r.discountValue.trim());
        if (r.discountValue.trim() === "" || !Number.isFinite(dv) || dv <= 0) { toast.error(`Room type ${i + 1}: discount value is required`); return; }
        if (r.discountType === "percentage" && dv > 100) { toast.error(`Room type ${i + 1}: percentage cannot exceed 100`); return; }
      }
    }

    setSavingRooms(true);
    try {
      for (const rf of roomForms) {
        const { data: rt, error: rtErr } = await createRoomType(addRoomsForHotelId, {
          name: rf.name.trim(),
          maxGuests: Number(rf.maxGuests) || undefined,
          basePrice: Number(rf.basePrice),
          discountType: rf.discountType,
          discountValue: rf.discountType !== "none" ? Number(rf.discountValue.trim()) : 0,
        });
        if (rtErr || !rt) { toast.error(rtErr?.message ?? "Error"); setSavingRooms(false); return; }

        for (let imgIdx = 0; imgIdx < rf.images.length; imgIdx++) {
          const up = await uploadRoomTypeImageCompressed(user.id, rt.id, rf.images[imgIdx], 120);
          if (up.error) { toast.error(up.error.message); setSavingRooms(false); return; }
          await insertRoomTypeImage(rt.id, up.data!.publicUrl, imgIdx, imgIdx === 0);
        }

        for (const rn of rf.roomNumbers) {
          const trimmed = rn.trim();
          if (!trimmed) continue;
          await createRoom(addRoomsForHotelId, { roomTypeId: rt.id, roomNumber: trimmed, status: "available" });
        }
      }
      invalidateCatalogCache();
      toast.success("Rooms added!");
      setAddRoomsForHotelId(null);
      setRoomForms([emptyRoom()]);
      await refreshHotels();
    } catch (e) {
      toast.error(String(e));
    } finally {
      setSavingRooms(false);
    }
  };

  const handlePromote = async () => {
    if (!user?.id || !selectedHotelId || !selectedCustomerId) { toast.error("Select hotel and customer"); return; }
    setPromoting(true);
    const { error } = await assignManagerByOwner({ ownerId: user.id, userId: selectedCustomerId, hotelId: selectedHotelId });
    setPromoting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Customer promoted to manager");
    setSelectedCustomerId("");
    await refreshTeamData();
  };

  const handleDemote = async (managerUserId: string) => {
    if (!user?.id || !selectedHotelId) return;
    setDemotingUserId(managerUserId);
    const { error } = await revokeManagerByOwner({ ownerId: user.id, userId: managerUserId, hotelId: selectedHotelId });
    setDemotingUserId(null);
    if (error) { toast.error(error.message); return; }
    toast.success("Manager demoted");
    await refreshTeamData();
  };

  if (!hasSupabase) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-heading font-bold">Owner Hotel Management</h1>
        <Card><CardContent className="p-6 text-sm text-muted-foreground">Supabase is not configured.</CardContent></Card>
      </div>
    );
  }

  const updateRoomForm = (idx: number, patch: Partial<RoomForm>) =>
    setRoomForms((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  // Determine if we're on an analytics tab that requires hotel selection
  const isAnalyticsTab = ["revenue", "occupancy", "expenses", "forecast", "rooms"].includes(activeTab);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold">
          {activeTab === "overview" ? "Owner Hotel Management" : "Analytics Dashboard"}
        </h1>
        <Badge className="bg-primary/10 text-primary">Live API Bound</Badge>
      </div>

      {/* Hotel Selector (shown for analytics tabs) */}
      {isAnalyticsTab && hotels.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Label className="text-sm font-medium whitespace-nowrap">Selected Hotel:</Label>
              <Select value={selectedHotelId} onValueChange={setSelectedHotelId}>
                <SelectTrigger className="max-w-md">
                  <SelectValue placeholder="Choose a hotel" />
                </SelectTrigger>
                <SelectContent>
                  {hotels.map((h) => (
                    <SelectItem key={h.id} value={h.id}>
                      {h.name} ({h.roomCount} rooms)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overview Stats (shown on overview tab) */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Owned Hotels</p><p className="text-2xl font-heading font-bold">{hotels.length}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Rooms</p><p className="text-2xl font-heading font-bold">{totalRooms}</p></CardContent></Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={(val) => {
        setActiveTab(val);
        if (val === "overview" || val === "add" || val === "list" || val === "team") {
          navigate("/dashboard");
          return;
        }
        if (val === "revenue") navigate("/analytics/revenue");
        if (val === "occupancy") navigate("/analytics/occupancy");
        if (val === "expenses") navigate("/analytics/expenses");
        if (val === "rooms") navigate("/analytics/rooms");
        if (val === "forecast") navigate("/analytics/forecast");
      }}>
        <TabsList className="grid grid-cols-3 lg:grid-cols-9 gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="add">Add Hotel</TabsTrigger>
          <TabsTrigger value="list">My Hotels</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="occupancy">Occupancy</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
          <TabsTrigger value="forecast">Forecast</TabsTrigger>
        </TabsList>

        {/* ── Overview Tab ── */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Quick Stats</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Welcome to your owner dashboard. Use the tabs above to manage hotels, team, and view analytics.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Add Hotel Tab ── */}
        <TabsContent value="add" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Create Hotel</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleCreateHotel} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Hotel name *</Label>
                    <Input value={hotelName} onChange={(e) => setHotelName(e.target.value)} placeholder="Sunrise Medical Stay" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input value={address} onChange={(e) => setAddress(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input value={city} onChange={(e) => setCity(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Country</Label>
                    <Input value={country} onChange={(e) => setCountry(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
                </div>
                <div className="space-y-2">
                  <Label>Cover photos (1–3, compressed to ~100KB each)</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const list = e.target.files ? Array.from(e.target.files).slice(0, 3) : [];
                      setCoverFiles(list);
                    }}
                  />
                  <p className="text-xs text-muted-foreground">Optional. Up to 3 images; they rotate on the public hotel page every 3 seconds.</p>
                  {coverFiles.length > 0 && <p className="text-xs text-muted-foreground">{coverFiles.length} file(s) selected</p>}
                </div>

                {/* Amenities */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Amenities</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {allAmenities.map((a) => (
                      <label
                        key={a.id}
                        className={`flex items-center gap-2 rounded-lg border p-2.5 cursor-pointer transition-colors text-sm ${
                          selectedAmenityIds.has(a.id) ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                        }`}
                      >
                        <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                          selectedAmenityIds.has(a.id) ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30"
                        }`}>
                          {selectedAmenityIds.has(a.id) && <Check className="h-3 w-3" />}
                        </div>
                        <input type="checkbox" className="sr-only" checked={selectedAmenityIds.has(a.id)} onChange={() => toggleAmenity(a.id)} />
                        <span>{a.name}</span>
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Input value={newAmenityName} onChange={(e) => setNewAmenityName(e.target.value)} placeholder="Add new amenity" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddAmenity())} />
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddAmenity} disabled={addingAmenity || !newAmenityName.trim()}>
                      {addingAmenity ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Landmarks */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Nearby Landmarks</Label>
                  {landmarks.map((lm, idx) => (
                    <div key={idx} className="border rounded-lg p-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Landmark {idx + 1}</span>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setLandmarks((p) => p.filter((_, i) => i !== idx))}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                      <Input value={lm.name} onChange={(e) => setLandmarks((p) => p.map((l, i) => (i === idx ? { ...l, name: e.target.value } : l)))} placeholder="e.g. Central Station" />
                      <Input value={lm.googleMapsUrl} onChange={(e) => setLandmarks((p) => p.map((l, i) => (i === idx ? { ...l, googleMapsUrl: e.target.value } : l)))} placeholder="Google Maps URL" />
                      {lm.googleMapsUrl.trim() && (
                        <a href={lm.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                          <ExternalLink className="h-3 w-3" /> Open in Maps
                        </a>
                      )}
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => setLandmarks((p) => [...p, { name: "", googleMapsUrl: "" }])}>
                    <Plus className="h-4 w-4 mr-1" /> Add landmark
                  </Button>
                </div>

                <Button type="submit" disabled={savingHotel} className="gap-2">
                  {savingHotel ? <Upload className="h-4 w-4 animate-pulse" /> : <Plus className="h-4 w-4" />}
                  {savingHotel ? "Creating..." : "Create Hotel"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── My Hotels Tab ── */}
        <TabsContent value="list" className="mt-4 space-y-3">
          {loading ? (
            <Card><CardContent className="p-6 text-sm text-muted-foreground">Loading hotels...</CardContent></Card>
          ) : hotels.length === 0 ? (
            <Card><CardContent className="p-6 text-sm text-muted-foreground">No hotels yet. Add your first hotel.</CardContent></Card>
          ) : (
            hotels.map((hotel) => (
              <Card key={hotel.id}>
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary"><Building2 className="h-5 w-5" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{hotel.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{[hotel.address, hotel.city, hotel.country].filter(Boolean).join(", ") || "Address not set"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>{hotel.roomCount} rooms</Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setAddRoomsForHotelId(hotel.id); setRoomForms([emptyRoom()]); }}
                    >
                      <BedDouble className="h-3.5 w-3.5 mr-1" /> Add Rooms
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          {/* Inline Add Rooms Panel */}
          {addRoomsForHotelId && (
            <Card className="border-primary">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base">Add Rooms — {hotels.find((h) => h.id === addRoomsForHotelId)?.name}</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setAddRoomsForHotelId(null)}>Cancel</Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {roomForms.map((rf, idx) => {
                  const fp = calcFinalPrice(rf.basePrice, rf.discountType, rf.discountValue);
                  return (
                    <div key={idx} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm">Room type {idx + 1}</span>
                        {roomForms.length > 1 && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setRoomForms((r) => r.filter((_, i) => i !== idx))}><Trash2 className="h-3.5 w-3.5" /></Button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label>Name *</Label><Input value={rf.name} onChange={(e) => updateRoomForm(idx, { name: e.target.value })} /></div>
                        <div><Label>Max guests</Label><Input type="number" min={1} value={rf.maxGuests} onChange={(e) => updateRoomForm(idx, { maxGuests: e.target.value })} /></div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div><Label>Base price *</Label><Input type="number" min={1} value={rf.basePrice} onChange={(e) => updateRoomForm(idx, { basePrice: e.target.value })} /></div>
                        <div>
                          <Label>Discount</Label>
                          <Select value={rf.discountType} onValueChange={(v) => updateRoomForm(idx, { discountType: v as DiscountType, discountValue: v === "none" ? "" : rf.discountValue })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              <SelectItem value="percentage">%</SelectItem>
                              <SelectItem value="flat">Flat</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div><Label>Value</Label><Input type="number" min={0} disabled={rf.discountType === "none"} value={rf.discountValue} onChange={(e) => updateRoomForm(idx, { discountValue: e.target.value })} /></div>
                      </div>
                      {rf.discountType !== "none" && fp !== null && Number(rf.basePrice) > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="line-through text-muted-foreground">₹{Number(rf.basePrice).toFixed(0)}</span>
                          <span className="font-semibold text-green-600">₹{fp.toFixed(0)}</span>
                          <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs font-medium">
                            {rf.discountType === "percentage" ? `${rf.discountValue}% OFF` : `₹${rf.discountValue} OFF`}
                          </span>
                        </div>
                      )}
                      {/* Room count + individual room numbers */}
                      <div className="space-y-2">
                        <Label>Number of rooms *</Label>
                        <Input
                          type="number"
                          min={1}
                          max={50}
                          value={rf.roomCount}
                          onChange={(e) => {
                            const val = e.target.value;
                            const count = Math.max(0, Math.min(50, Math.floor(Number(val) || 0)));
                            const current = rf.roomNumbers;
                            let next: string[];
                            if (count > current.length) {
                              const defaults = generateDefaultRoomNumbers(rf.name, count);
                              next = [...current, ...defaults.slice(current.length)];
                            } else {
                              next = current.slice(0, count);
                            }
                            updateRoomForm(idx, { roomCount: val, roomNumbers: next });
                          }}
                        />
                        <p className="text-xs text-muted-foreground">Customers will see these room numbers when booking.</p>
                      </div>

                      {rf.roomNumbers.length > 0 && (
                        <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                          <p className="text-sm font-medium">Room numbers / names</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {rf.roomNumbers.map((rn, rnIdx) => (
                              <div key={rnIdx} className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">
                                  #{rnIdx + 1}
                                </span>
                                <Input
                                  value={rn}
                                  onChange={(e) => {
                                    const updated = [...rf.roomNumbers];
                                    updated[rnIdx] = e.target.value;
                                    updateRoomForm(idx, { roomNumbers: updated });
                                  }}
                                  className="pl-9 h-9 text-sm"
                                  placeholder={`Room ${rnIdx + 1}`}
                                />
                              </div>
                            ))}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                            onClick={() => {
                              const count = rf.roomNumbers.length;
                              const defaults = generateDefaultRoomNumbers(rf.name, count);
                              updateRoomForm(idx, { roomNumbers: defaults });
                            }}
                          >
                            Auto-generate names
                          </Button>
                        </div>
                      )}

                      <div>
                        <Label>Images *</Label>
                        <Input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => updateRoomForm(idx, { images: e.target.files ? Array.from(e.target.files) : [] })} />
                        <p className="text-xs text-muted-foreground mt-1">{rf.images.length} file(s)</p>
                      </div>
                    </div>
                  );
                })}
                <Button type="button" variant="outline" size="sm" onClick={() => setRoomForms((r) => [...r, emptyRoom()])}>
                  <Plus className="h-4 w-4 mr-1" /> Add room type
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setAddRoomsForHotelId(null)}>Cancel</Button>
                  <Button onClick={handleAddRoomsSubmit} disabled={savingRooms}>
                    {savingRooms ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating…</> : `Create ${roomForms.length} room type${roomForms.length > 1 ? "s" : ""}`}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Team Tab ── */}
        <TabsContent value="team" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Manager Role Assignment</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2 md:col-span-2">
                  <Label>Select hotel</Label>
                  <Select value={selectedHotelId} onValueChange={setSelectedHotelId}>
                    <SelectTrigger><SelectValue placeholder="Choose hotel" /></SelectTrigger>
                    <SelectContent>
                      {hotels.map((h) => (<SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>&nbsp;</Label>
                  <Button type="button" variant="outline" className="w-full" onClick={refreshTeamData} disabled={!selectedHotelId || teamLoading}>
                    {teamLoading ? "Refreshing..." : "Refresh"}
                  </Button>
                </div>
              </div>

              {!selectedHotelId ? (
                <p className="text-sm text-muted-foreground">Create or select a hotel to manage team.</p>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  <Card>
                    <CardHeader><CardTitle className="text-sm">Promote Customer</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <Label>Search email</Label>
                        <Input value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} placeholder="name@example.com" />
                      </div>
                      <div className="space-y-2">
                        <Label>Select customer</Label>
                        <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                          <SelectTrigger><SelectValue placeholder="Choose" /></SelectTrigger>
                          <SelectContent>
                            {promotableUsers.map((p) => (<SelectItem key={p.user_id} value={p.user_id}>{p.email ?? p.user_id}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button type="button" className="w-full gap-2" disabled={promoting || !selectedCustomerId} onClick={handlePromote}>
                        <UserCog className="h-4 w-4" /> {promoting ? "Promoting..." : "Promote to Manager"}
                      </Button>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle className="text-sm">Current Managers</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <Label>Search email</Label>
                        <Input value={managerSearch} onChange={(e) => setManagerSearch(e.target.value)} placeholder="name@example.com" />
                      </div>
                      {managers.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No managers assigned.</p>
                      ) : (
                        <div className="space-y-2">
                          {managers.map((m) => (
                            <div key={m.assignment_id} className="flex items-center justify-between gap-2 rounded-lg border p-2">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium">{m.email ?? m.user_id}</p>
                                <p className="text-xs text-muted-foreground">Assigned: {new Date(m.created_at).toLocaleDateString()}</p>
                              </div>
                              <Button type="button" variant="destructive" size="sm" disabled={demotingUserId === m.user_id} onClick={() => handleDemote(m.user_id)}>
                                {demotingUserId === m.user_id ? "Removing..." : "Demote"}
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Analytics Tabs (Placeholders for now, will build content next) ── */}
        <TabsContent value="revenue" className="mt-4">
          <OwnerRevenue hotelId={selectedHotelId} />
        </TabsContent>

        <TabsContent value="occupancy" className="mt-4">
          <OwnerOccupancy hotelId={selectedHotelId} />
        </TabsContent>

        <TabsContent value="expenses" className="mt-4">
          <OwnerExpenses hotelId={selectedHotelId} />
        </TabsContent>

        <TabsContent value="rooms" className="mt-4">
          <OwnerRoomPerformance hotelId={selectedHotelId} />
        </TabsContent>

        <TabsContent value="forecast" className="mt-4">
          <OwnerForecast hotelId={selectedHotelId} />
        </TabsContent>

      </Tabs>
    </div>
  );
}
