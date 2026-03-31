import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, ChevronDown, Map, SlidersHorizontal, ArrowUp } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { countAvailableRoomsBatch, listPublicHotelsWithRoomTypesCached, publicHotelCoverUrls, type PublicHotelCard } from "@/lib/supabase";
import { HotelCoverCarousel } from "@/components/HotelCoverCarousel";
import { toast } from "sonner";

function listingCoverUrls(h: PublicHotelCard): string[] {
  const u = publicHotelCoverUrls(h);
  if (u.length) return u;
  const r0 = h.room_types[0]?.images?.[0];
  return r0 ? [r0] : [];
}

type SortBy = "popularity" | "price_low" | "price_high" | "distance";
interface HotelSearchSectionProps { standalone?: boolean; sectionId?: string }

export function HotelSearchSection({ standalone = false, sectionId = "hotels" }: HotelSearchSectionProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [hotels, setHotels] = useState<PublicHotelCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [hospitalFilter, setHospitalFilter] = useState("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([800, 12000]);
  const [onlyFamily, setOnlyFamily] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>("popularity");
  const [checkIn, setCheckIn] = useState(new Date().toISOString().slice(0, 10));
  const [checkOut, setCheckOut] = useState(() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); });
  const [availability, setAvailability] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!standalone) {
      const location = searchParams.get("location") ?? "";
      setSearchQuery(location);
    }
  }, [searchParams, standalone]);

  useEffect(() => {
    let mounted = true;
    listPublicHotelsWithRoomTypesCached().then(({ data, error }) => {
      if (!mounted) return;
      if (error) toast.error("Unable to load hotels");
      setHotels(data);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    const roomTypeIds = hotels.flatMap((h) => h.room_types.map((rt) => rt.id));
    if (roomTypeIds.length === 0) return;
    countAvailableRoomsBatch(roomTypeIds, checkIn, checkOut).then(({ data }) => {
      if (mounted) setAvailability(data);
    });
    return () => { mounted = false; };
  }, [hotels, checkIn, checkOut]);

  const hotelsWithDerived = useMemo(() => hotels.map((hotel) => {
    let minBasePrice = 0;
    let minFinalPrice = 0;
    let hasDiscount = false;
    for (const rt of hotel.room_types) {
      const fp = Number(rt.final_price ?? rt.base_price ?? 0);
      const bp = Number(rt.base_price ?? 0);
      if (fp <= 0) continue;
      if (minFinalPrice <= 0 || fp < minFinalPrice) {
        minFinalPrice = fp;
        minBasePrice = bp;
        hasDiscount = rt.discount_type !== "none" && rt.discount_value > 0;
      }
    }
    const availableRooms = hotel.room_types.reduce((acc, rt) => acc + (availability[rt.id] ?? 0), 0);
    return { ...hotel, minPrice: minFinalPrice, minBasePrice, hasDiscount, availableRooms };
  }), [availability, hotels]);

  const filtered = useMemo(() => {
    let list = hotelsWithDerived.filter((h) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = h.name.toLowerCase().includes(q) || (h.address ?? "").toLowerCase().includes(q) || (h.city ?? "").toLowerCase().includes(q);
      const matchesHospital = hospitalFilter === "all" || (h.city ?? "").toLowerCase().includes("gurugram");
      const withinPrice = h.minPrice >= priceRange[0] && h.minPrice <= priceRange[1];
      const matchesFamily = !onlyFamily || h.room_types.some((rt) => (rt.max_guests ?? 0) >= 3);
      return matchesSearch && matchesHospital && withinPrice && matchesFamily;
    });
    list = list.sort((a, b) => {
      if (sortBy === "price_low") return a.minPrice - b.minPrice;
      if (sortBy === "price_high") return b.minPrice - a.minPrice;
      if (sortBy === "distance") return (a.city ?? "").localeCompare(b.city ?? "");
      return b.availableRooms - a.availableRooms;
    });
    return list;
  }, [hotelsWithDerived, hospitalFilter, onlyFamily, priceRange, searchQuery, sortBy]);

  const sortLabel: Record<SortBy, string> = { popularity: "Availability", price_low: "Price: Low to High", price_high: "Price: High to Low", distance: "Location" };

  const renderFilters = () => (
    <div className="space-y-6">
      <Card><CardHeader className="pb-3"><CardTitle className="text-base">Price</CardTitle></CardHeader><CardContent className="space-y-3"><Slider min={800} max={12000} step={200} value={priceRange} onValueChange={(v) => setPriceRange(v as [number, number])} /><div className="flex items-center justify-between text-xs"><span>₹{priceRange[0].toLocaleString()}</span><span>₹{priceRange[1].toLocaleString()}</span></div></CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-base">Collections</CardTitle></CardHeader><CardContent className="space-y-2"><div className="flex items-center gap-2"><Checkbox id="family" checked={onlyFamily} onCheckedChange={(c) => setOnlyFamily(Boolean(c))} /><Label htmlFor="family" className="text-sm">Family stays</Label></div><div className="flex items-center gap-2"><Checkbox id="near-hospital" checked={hospitalFilter !== "all"} onCheckedChange={(c) => setHospitalFilter(c ? "medanta" : "all")} /><Label htmlFor="near-hospital" className="text-sm">Near hospital</Label></div></CardContent></Card>
    </div>
  );

  const content = (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-xl sm:text-2xl font-heading font-bold">Gurugram stays near hospitals</h1><p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Room-first inventory with live availability.</p></div>
        {!standalone && <Button type="button" variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground shrink-0 self-start sm:self-center" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}><ArrowUp className="h-3.5 w-3.5 mr-1.5" />Refine search</Button>}
      </div>
      {standalone && <Card><CardContent className="p-4 space-y-3"><div className="flex flex-col gap-3 lg:flex-row lg:items-center"><div className="relative flex-1 min-w-0"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search by area, landmark or hotel name" className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div><div className="grid grid-cols-2 gap-3 sm:flex sm:items-center"><div className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted-foreground uppercase">Check-in</span><Input type="date" className="h-9" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} /></div><div className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted-foreground uppercase">Check-out</span><Input type="date" className="h-9" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} /></div><div className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted-foreground uppercase">Guests</span><Select defaultValue="1"><SelectTrigger className="h-9"><SelectValue placeholder="Guests" /></SelectTrigger><SelectContent><SelectItem value="1">1 Room, 1 Guest</SelectItem><SelectItem value="2">1 Room, 2 Guests</SelectItem></SelectContent></Select></div><Button className="h-10 px-6 bg-success hover:bg-success/90 text-success-foreground">Search</Button></div></div></CardContent></Card>}
      <Tabs defaultValue="all" className="w-full"><TabsList className="w-full justify-start overflow-x-auto"><TabsTrigger value="all" className="text-xs">All stays</TabsTrigger><TabsTrigger value="family" className="text-xs" onClick={() => setOnlyFamily(true)}>Family stays</TabsTrigger><TabsTrigger value="medanta" className="text-xs" onClick={() => setHospitalFilter("medanta")}>Near Medanta</TabsTrigger></TabsList><TabsContent value="all" /><TabsContent value="family" /><TabsContent value="medanta" /></Tabs>
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[280px,minmax(0,1fr)]">
        <div className="hidden lg:block">{renderFilters()}</div>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><span className="font-medium text-foreground">{filtered.length} stays</span><span>live inventory</span></div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="lg:hidden" asChild><Sheet><SheetTrigger asChild><span className="inline-flex items-center gap-1"><SlidersHorizontal className="h-3.5 w-3.5" />Filters</span></SheetTrigger><SheetContent side="left" className="w-full sm:max-w-sm overflow-y-auto"><SheetHeader className="mb-4"><SheetTitle>Filters</SheetTitle></SheetHeader>{renderFilters()}</SheetContent></Sheet></Button>
              <Button variant="outline" size="sm" className="hidden sm:inline-flex gap-1"><Map className="h-3.5 w-3.5" />Map view</Button>
              <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="inline-flex items-center gap-1"><span className="text-xs">Sort: {sortLabel[sortBy]}</span><ChevronDown className="h-3 w-3" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuLabel>Sort by</DropdownMenuLabel><DropdownMenuSeparator /><DropdownMenuItem onClick={() => setSortBy("popularity")}>Availability</DropdownMenuItem><DropdownMenuItem onClick={() => setSortBy("price_low")}>Price: Low to High</DropdownMenuItem><DropdownMenuItem onClick={() => setSortBy("price_high")}>Price: High to Low</DropdownMenuItem><DropdownMenuItem onClick={() => setSortBy("distance")}>Location</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
            </div>
          </div>
          <div className="grid gap-4">
            {loading && <Card><CardContent className="p-6 text-sm text-muted-foreground">Loading hotels...</CardContent></Card>}
            {filtered.map((hotel, i) => (
              <motion.div key={hotel.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Card className="overflow-hidden hover:shadow-elevated transition-shadow cursor-pointer" onClick={() => navigate(`/hotels/${hotel.id}?checkIn=${checkIn}&checkOut=${checkOut}`)}>
                  <div className="flex flex-col sm:flex-row">
                    <div className="h-48 w-full shrink-0 bg-muted sm:h-auto sm:w-64 sm:min-h-[200px]">
                      <HotelCoverCarousel
                        images={listingCoverUrls(hotel)}
                        alt={hotel.name}
                        className="h-full w-full sm:min-h-[200px]"
                      />
                    </div>
                    <div className="flex-1 p-5">
                      <div className="flex items-start justify-between mb-2 gap-3">
                        <div><h3 className="font-heading font-semibold text-lg">{hotel.name}</h3><div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5"><MapPin className="h-3.5 w-3.5" />{[hotel.address, hotel.city].filter(Boolean).join(", ")}</div></div>
                        <Badge variant="secondary" className="text-[10px]">{hotel.availableRooms} rooms available</Badge>
                      </div>
                      {hotel.amenities && hotel.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {hotel.amenities.slice(0, 4).map((a) => (
                            <span key={a.id} className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{a.name}</span>
                          ))}
                          {hotel.amenities.length > 4 && (
                            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">+{hotel.amenities.length - 4}</span>
                          )}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-1.5 mb-3">{hotel.room_types.slice(0, 3).map((rt) => <Badge key={rt.id} variant="outline" className="text-[10px] font-normal">{rt.name}</Badge>)}</div>
                      <div className="flex items-center justify-between"><div className="flex items-center gap-1.5">{hotel.hasDiscount && <span className="text-sm line-through text-muted-foreground">₹{hotel.minBasePrice.toLocaleString()}</span>}<span className="text-xs text-muted-foreground">From </span><span className="text-lg font-heading font-bold text-primary">₹{hotel.minPrice.toLocaleString()}</span><span className="text-xs text-muted-foreground"> /night</span>{hotel.hasDiscount && <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 px-1.5 py-0.5 text-[10px] font-semibold ml-1">DEAL</span>}</div><div className="flex gap-2">{hotel.availableRooms > 0 && hotel.availableRooms <= 2 && <Badge variant="secondary" className="bg-warning/10 text-warning text-[10px]">Almost sold out</Badge>}<Button size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/hotels/${hotel.id}?checkIn=${checkIn}&checkOut=${checkOut}`); }}>View Details</Button></div></div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
  if (standalone) return content;
  return <section id={sectionId} className="py-12 lg:py-16 bg-muted/30"><div className="max-w-page mx-auto px-4 sm:px-6 lg:px-8">{content}</div></section>;
}
