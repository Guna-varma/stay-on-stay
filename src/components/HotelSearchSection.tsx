import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  MapPin,
  ChevronDown,
  Map,
  SlidersHorizontal,
  ArrowUp,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
  Building2,
  Utensils,
  Home,
  BedDouble,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Reveal } from "@/components/motion/Reveal";
import { HOTEL_SECTION_GALLERY } from "@/lib/healthcare-images";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  countAvailableRoomsBatch,
  listPublicHotelsWithRoomTypesCached,
  peekPublicHotelCatalogFromSessionStorage,
  publicHotelCoverUrls,
  type PublicHotelCard,
} from "@/lib/supabase";
import { HotelCoverCarousel } from "@/components/HotelCoverCarousel";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { whatsappMeUrl, whatsappNumberForVisitor } from "@/lib/whatsappContact";
import {
  type StaySegment,
  matchesStaySegment,
  segmentWhatsAppHint,
} from "@/lib/staySegmentFilter";

function listingCoverUrls(h: PublicHotelCard): string[] {
  const u = publicHotelCoverUrls(h);
  if (u.length) return u;
  const r0 = h.room_types[0]?.images?.[0];
  return r0 ? [r0] : [];
}

type SortBy = "popularity" | "price_low" | "price_high" | "distance";

function distanceTrustLine(hotel: PublicHotelCard, t: (key: string) => string): string {
  const city = (hotel.city ?? "").toLowerCase();
  if (city.includes("gurugram") || city.includes("gurgaon")) return t("hotelSearch.distanceGurgaon");
  if (city.includes("delhi")) return t("hotelSearch.distanceDelhi");
  return t("hotelSearch.distanceGeneric");
}

interface HotelSearchSectionProps {
  standalone?: boolean;
  sectionId?: string;
}

export function HotelSearchSection({ standalone = false, sectionId = "hotels" }: HotelSearchSectionProps) {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const catalogBootstrap = useMemo(() => {
    const peek = peekPublicHotelCatalogFromSessionStorage();
    return { hotels: peek ?? [], loading: !peek?.length };
  }, []);
  const [hotels, setHotels] = useState<PublicHotelCard[]>(catalogBootstrap.hotels);
  const [loading, setLoading] = useState(catalogBootstrap.loading);
  const [searchQuery, setSearchQuery] = useState("");
  const [hospitalFilter, setHospitalFilter] = useState("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([800, 12000]);
  const [onlyFamily, setOnlyFamily] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>("popularity");
  const [staySegment, setStaySegment] = useState<StaySegment>("all");
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
      const matchesSegment = matchesStaySegment(h, staySegment);
      return matchesSearch && matchesHospital && withinPrice && matchesFamily && matchesSegment;
    });
    list = list.sort((a, b) => {
      if (sortBy === "price_low") return a.minPrice - b.minPrice;
      if (sortBy === "price_high") return b.minPrice - a.minPrice;
      if (sortBy === "distance") return (a.city ?? "").localeCompare(b.city ?? "");
      return b.availableRooms - a.availableRooms;
    });
    return list;
  }, [hotelsWithDerived, hospitalFilter, onlyFamily, priceRange, searchQuery, sortBy, staySegment]);

  const sortLabel = useMemo(
    (): Record<SortBy, string> => ({
      popularity: t("hotelSearch.sortAvailability"),
      price_low: t("hotelSearch.sortPriceLow"),
      price_high: t("hotelSearch.sortPriceHigh"),
      distance: t("hotelSearch.sortLocation"),
    }),
    [t],
  );

  const openHotelWhatsApp = (hotelName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const n = whatsappNumberForVisitor();
    const msg = t("hotelSearch.waPrefill").replace("{name}", hotelName);
    window.open(whatsappMeUrl(n, msg), "_blank", "noopener,noreferrer");
  };

  const openSegmentLeadWhatsApp = () => {
    const n = whatsappNumberForVisitor();
    const hint = segmentWhatsAppHint(staySegment);
    const msg = t("hotelSearch.emptyPrefill").replace("{hint}", hint);
    window.open(whatsappMeUrl(n, msg), "_blank", "noopener,noreferrer");
  };

  const segmentOptions: { id: StaySegment; labelKey: string }[] = [
    { id: "all", labelKey: "hotelSearch.segmentAll" },
    { id: "hotel", labelKey: "hotelSearch.segmentHotel" },
    { id: "bhk1_kitchen", labelKey: "hotelSearch.segmentBhk1" },
    { id: "bhk2_family", labelKey: "hotelSearch.segmentBhk2" },
    { id: "studio", labelKey: "hotelSearch.segmentStudio" },
  ];

  const renderFilters = () => (
    <div className="space-y-6">
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">{t("hotelSearch.filtersPrice")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Slider min={800} max={12000} step={200} value={priceRange} onValueChange={(v) => setPriceRange(v as [number, number])} />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>₹{priceRange[0].toLocaleString()}</span>
            <span>₹{priceRange[1].toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">{t("hotelSearch.filtersCollections")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Checkbox id="family" checked={onlyFamily} onCheckedChange={(c) => setOnlyFamily(Boolean(c))} />
            <Label htmlFor="family" className="text-sm cursor-pointer">
              {t("hotelSearch.filterFamily")}
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="near-hospital" checked={hospitalFilter !== "all"} onCheckedChange={(c) => setHospitalFilter(c ? "medanta" : "all")} />
            <Label htmlFor="near-hospital" className="text-sm cursor-pointer">
              {t("hotelSearch.filterNearHospital")}
            </Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const marketingBlock = (
    <>
      <Reveal>
        <p className="text-center text-xs font-medium text-muted-foreground mb-3 max-w-lg mx-auto leading-relaxed">
          {t("apartments.galleryCaption")}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 rounded-2xl overflow-hidden ring-1 ring-border/50 shadow-sm">
          {HOTEL_SECTION_GALLERY.map(({ src, alt }, gi) => (
            <motion.div
              key={src}
              className="relative aspect-[4/3] overflow-hidden bg-muted"
              whileHover={reduceMotion ? undefined : { scale: 1.02 }}
              transition={{ duration: 0.35 }}
            >
              <img
                src={src}
                alt={alt}
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            </motion.div>
          ))}
        </div>
      </Reveal>

      <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card to-muted/30 p-6 sm:p-8 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] ring-1 ring-border/40">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-primary mb-2">{t("hotelSearch.trustMedical")}</p>
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight mb-3">{t("apartments.title")}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl mb-6">{t("apartments.subtitle")}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {(
            [
              { icon: Building2, titleKey: "apartments.point1.title", descKey: "apartments.point1.desc" },
              { icon: Utensils, titleKey: "apartments.point2.title", descKey: "apartments.point2.desc" },
              { icon: Home, titleKey: "apartments.point3.title", descKey: "apartments.point3.desc" },
              { icon: BedDouble, titleKey: "apartments.point4.title", descKey: "apartments.point4.desc" },
            ] as const
          ).map(({ icon: Icon, titleKey, descKey }) => (
            <div
              key={titleKey}
              className="rounded-xl border border-border/50 bg-background/60 p-4 shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-3">
                <Icon className="h-5 w-5 text-primary" aria-hidden />
              </div>
              <p className="text-sm font-semibold text-foreground leading-snug mb-1">{t(titleKey)}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{t(descKey)}</p>
            </div>
          ))}
        </div>

        <p className="text-sm font-medium text-foreground border-l-2 border-primary pl-3 leading-relaxed">
          {t("apartments.distance")}
        </p>
      </div>
    </>
  );

  const content = (
    <div className="space-y-6">
      {standalone && marketingBlock}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">{t("apartments.listTitle")}</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">{t("apartments.listSubtitle")}</p>
        </div>
        {!standalone && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 self-start sm:self-center border-border/80"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <ArrowUp className="h-3.5 w-3.5 mr-1.5" />
            {t("hotelSearch.refine")}
          </Button>
        )}
      </div>

      {standalone && (
        <Card className="border-border/60 shadow-md overflow-hidden">
          <CardContent className="p-4 sm:p-5 space-y-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("hotelSearch.searchPlaceholder")}
                  className="pl-9 h-11"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:flex sm:items-end sm:flex-wrap">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase">{t("hotelSearch.checkIn")}</span>
                  <Input type="date" className="h-11" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase">{t("hotelSearch.checkOut")}</span>
                  <Input type="date" className="h-11" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase">{t("hotelSearch.guests")}</span>
                  <Select defaultValue="1">
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder={t("hotelSearch.guests")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">{t("hotelSearch.guestOpt1")}</SelectItem>
                      <SelectItem value="2">{t("hotelSearch.guestOpt2")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="h-11 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold col-span-2 sm:col-span-1">
                  {t("hotelSearch.searchBtn")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("hotelSearch.segmentLabel")}</p>
          <p className="text-[11px] text-muted-foreground max-w-xl">{t("hotelSearch.segmentHint")}</p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory sm:flex-wrap sm:overflow-visible">
          {segmentOptions.map(({ id, labelKey }) => (
            <Button
              key={id}
              type="button"
              variant={staySegment === id ? "default" : "outline"}
              size="sm"
              className={`shrink-0 snap-start rounded-full h-9 px-4 text-xs font-medium border-border/80 ${
                staySegment === id ? "shadow-sm" : "bg-background/80"
              }`}
              onClick={() => setStaySegment(id)}
            >
              {t(labelKey)}
            </Button>
          ))}
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto h-auto rounded-xl bg-muted/60 p-1 gap-1">
          <TabsTrigger
            value="all"
            className="text-xs sm:text-sm rounded-lg data-[state=active]:shadow-sm"
            onClick={() => {
              setOnlyFamily(false);
              setHospitalFilter("all");
            }}
          >
            {t("hotelSearch.tabAll")}
          </TabsTrigger>
          <TabsTrigger
            value="family"
            className="text-xs sm:text-sm rounded-lg data-[state=active]:shadow-sm"
            onClick={() => {
              setOnlyFamily(true);
              setHospitalFilter("all");
            }}
          >
            {t("hotelSearch.tabFamily")}
          </TabsTrigger>
          <TabsTrigger
            value="medanta"
            className="text-xs sm:text-sm rounded-lg data-[state=active]:shadow-sm"
            onClick={() => {
              setHospitalFilter("medanta");
              setOnlyFamily(false);
            }}
          >
            {t("hotelSearch.tabMedanta")}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="all" />
        <TabsContent value="family" />
        <TabsContent value="medanta" />
      </Tabs>
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[300px,minmax(0,1fr)] lg:gap-8">
        <div className="hidden lg:block">{renderFilters()}</div>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-foreground">
                {t("hotelSearch.resultsCount").replace("{n}", String(filtered.length))}
              </span>
              <span className="text-muted-foreground">{t("hotelSearch.liveInventory")}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="lg:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-full gap-1.5">
                      <SlidersHorizontal className="h-3.5 w-3.5" />
                      {t("hotelSearch.filtersSheet")}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-full sm:max-w-sm overflow-y-auto">
                    <SheetHeader className="mb-4">
                      <SheetTitle>{t("hotelSearch.filtersSheet")}</SheetTitle>
                    </SheetHeader>
                    {renderFilters()}
                  </SheetContent>
                </Sheet>
              </div>
              <Button variant="outline" size="sm" className="hidden sm:inline-flex gap-1 rounded-full">
                <Map className="h-3.5 w-3.5" />
                {t("hotelSearch.mapView")}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="inline-flex items-center gap-1 rounded-full">
                    <span className="text-xs">
                      {t("hotelSearch.sortLabel")}: {sortLabel[sortBy]}
                    </span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{t("hotelSearch.sortLabel")}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSortBy("popularity")}>{t("hotelSearch.sortAvailability")}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("price_low")}>{t("hotelSearch.sortPriceLow")}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("price_high")}>{t("hotelSearch.sortPriceHigh")}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("distance")}>{t("hotelSearch.sortLocation")}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="grid gap-6">
            {loading && (
              <div className="grid gap-6" aria-busy="true" aria-label={t("hotelSearch.loading")}>
                {[0, 1, 2].map((s) => (
                  <Card key={s} className="border-border/50 overflow-hidden rounded-2xl">
                    <div className="flex flex-col sm:flex-row animate-pulse">
                      <div className="h-52 w-full sm:w-72 lg:w-80 shrink-0 bg-muted" />
                      <CardContent className="flex-1 p-6 space-y-4">
                        <div className="h-6 bg-muted rounded-md w-2/3" />
                        <div className="h-4 bg-muted rounded-md w-1/2" />
                        <div className="h-4 bg-muted rounded-md w-5/6" />
                        <div className="flex gap-2 pt-4">
                          <div className="h-9 flex-1 bg-muted rounded-full max-w-[120px]" />
                          <div className="h-9 flex-1 bg-muted rounded-full max-w-[140px]" />
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                ))}
              </div>
            )}
            {!loading && filtered.length === 0 && (
              <Card className="border-dashed border-primary/25 bg-gradient-to-br from-muted/40 to-card overflow-hidden">
                <CardContent className="p-8 sm:p-10 text-center space-y-4">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <MessageCircle className="h-6 w-6 text-primary" aria-hidden />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{t("hotelSearch.emptyTitle")}</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">{t("hotelSearch.emptyBody")}</p>
                  <Button
                    type="button"
                    className="rounded-full bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold px-8"
                    onClick={openSegmentLeadWhatsApp}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" aria-hidden />
                    {t("hotelSearch.emptyCta")}
                  </Button>
                </CardContent>
              </Card>
            )}
            {filtered.map((hotel, i) => (
              <motion.div
                key={hotel.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: Math.min(i * 0.03, 0.18) }}
              >
                <Card
                  className="group overflow-hidden border-border/60 bg-card shadow-[0_4px_24px_-8px_rgba(0,0,0,0.12)] transition-all duration-300 hover:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.15)] hover:border-primary/20 cursor-pointer rounded-2xl"
                  onClick={() => navigate(`/hotels/${hotel.id}?checkIn=${checkIn}&checkOut=${checkOut}`)}
                >
                  <div className="flex flex-col sm:flex-row">
                    <div className="relative h-52 w-full shrink-0 bg-muted sm:h-auto sm:w-72 lg:w-80 sm:min-h-[220px] overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent z-[1] pointer-events-none sm:hidden" />
                      <HotelCoverCarousel
                        images={listingCoverUrls(hotel)}
                        alt={hotel.name}
                        className="h-full w-full sm:min-h-[220px] object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                      />
                      <div className="absolute top-3 left-3 z-[2] flex flex-wrap gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-background/90 backdrop-blur-sm px-2.5 py-1 text-[10px] font-semibold text-foreground shadow-sm border border-border/50">
                          <ShieldCheck className="h-3 w-3 text-primary shrink-0" aria-hidden />
                          {t("hotelSearch.trustVerified")}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 backdrop-blur-sm px-2.5 py-1 text-[10px] font-medium border border-emerald-500/20">
                          <Sparkles className="h-3 w-3 shrink-0" aria-hidden />
                          {t("hotelSearch.trustHygiene")}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col p-5 sm:p-6">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg sm:text-xl tracking-tight text-foreground">{hotel.name}</h3>
                          </div>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mb-1">
                            <Star className="h-3.5 w-3.5 text-amber-500 shrink-0" strokeWidth={1.5} aria-hidden />
                            {t("hotelSearch.ratingLine")}
                          </p>
                          <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-primary/80" aria-hidden />
                            <span>{[hotel.address, hotel.city].filter(Boolean).join(", ")}</span>
                          </div>
                          <p className="text-xs text-primary/90 mt-2 font-medium leading-snug flex items-start gap-1.5">
                            <span className="text-primary mt-0.5" aria-hidden>
                              ◆
                            </span>
                            {distanceTrustLine(hotel, t)}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-[11px] shrink-0 font-medium px-2.5 py-1 self-start">
                          {hotel.availableRooms} {hotel.availableRooms === 1 ? "room" : "rooms"} available
                        </Badge>
                      </div>

                      {hotel.amenities && hotel.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {hotel.amenities.slice(0, 5).map((a) => (
                            <span
                              key={a.id}
                              className="inline-flex items-center rounded-md bg-muted/80 px-2 py-1 text-[11px] text-muted-foreground"
                            >
                              {a.name}
                            </span>
                          ))}
                          {hotel.amenities.length > 5 && (
                            <span className="inline-flex items-center rounded-md bg-muted/80 px-2 py-1 text-[11px] text-muted-foreground">
                              +{hotel.amenities.length - 5}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 mb-4">
                        {hotel.room_types.slice(0, 4).map((rt) => (
                          <Badge key={rt.id} variant="outline" className="text-[11px] font-normal border-primary/15 bg-primary/5">
                            {rt.name}
                          </Badge>
                        ))}
                      </div>

                      <div className="mt-auto flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-t border-border/60 pt-4">
                        <div className="flex flex-wrap items-baseline gap-2">
                          {hotel.hasDiscount && (
                            <span className="text-sm line-through text-muted-foreground">₹{hotel.minBasePrice.toLocaleString()}</span>
                          )}
                          <span className="text-xs text-muted-foreground">From</span>
                          <span className="text-2xl font-bold text-primary tabular-nums">₹{hotel.minPrice.toLocaleString()}</span>
                          <span className="text-sm text-muted-foreground">/ night</span>
                          {hotel.hasDiscount && (
                            <span className="inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 text-[10px] font-semibold">
                              DEAL
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 justify-end">
                          {hotel.availableRooms > 0 && hotel.availableRooms <= 2 && (
                            <Badge variant="secondary" className="bg-amber-500/15 text-amber-900 dark:text-amber-200 text-[10px]">
                              Almost sold out
                            </Badge>
                          )}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-10 rounded-full border-[#25D366]/40 text-[#128C7E] hover:bg-[#25D366]/10 font-semibold"
                            onClick={(e) => openHotelWhatsApp(hotel.name, e)}
                          >
                            <MessageCircle className="h-4 w-4 mr-1.5" aria-hidden />
                            {t("hotelSearch.waCta")}
                          </Button>
                          <Button
                            size="sm"
                            variant="cta"
                            className="h-10 rounded-full px-5 font-semibold"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/hotels/${hotel.id}?checkIn=${checkIn}&checkOut=${checkOut}`);
                            }}
                          >
                            {t("hotelSearch.viewSuite")}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {!standalone && marketingBlock}
    </div>
  );
  if (standalone) return <div className="pb-8">{content}</div>;
  return (
    <section
      id={sectionId}
      className="scroll-mt-20 py-12 lg:py-20 bg-gradient-to-b from-muted/25 via-background to-muted/20 border-t border-border/40"
    >
      <div className="max-w-page mx-auto px-4 sm:px-6 lg:px-8">{content}</div>
    </section>
  );
}
