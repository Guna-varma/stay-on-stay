import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HOTELS } from "@/data/mock-data";
import {
  Search,
  MapPin,
  Star,
  Phone,
  Utensils,
  Filter,
  SlidersHorizontal,
  ChevronDown,
  Map,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

type SortBy = "popularity" | "price_low" | "price_high" | "distance";

export default function HotelSearch() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [hospitalFilter, setHospitalFilter] = useState("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([800, 12000]);
  const [onlyFamily, setOnlyFamily] = useState(false);
  const [amenitiesFilter, setAmenitiesFilter] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortBy>("popularity");

  const hotelsWithDerived = useMemo(
    () =>
      HOTELS.map(hotel => ({
        ...hotel,
        minPrice: Math.min(...hotel.rooms.map(r => r.pricePerNight)),
        availableRooms: hotel.rooms.filter(r => r.status === "available").length,
      })),
    [],
  );

  const filtered = useMemo(() => {
    let list = hotelsWithDerived.filter(h => {
      const matchesSearch =
        h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.nearbyHospital.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesHospital = hospitalFilter === "all" || h.nearbyHospital.toLowerCase().includes(hospitalFilter.toLowerCase());

      const withinPrice = h.minPrice >= priceRange[0] && h.minPrice <= priceRange[1];

      const matchesAmenities =
        amenitiesFilter.length === 0 ||
        amenitiesFilter.every(a => h.amenities.some(hAmenity => hAmenity.toLowerCase().includes(a.toLowerCase())));

      const matchesFamily = !onlyFamily || h.rooms.some(r => r.capacity >= 3);

      return matchesSearch && matchesHospital && withinPrice && matchesAmenities && matchesFamily;
    });

    list = list.sort((a, b) => {
      if (sortBy === "price_low") return a.minPrice - b.minPrice;
      if (sortBy === "price_high") return b.minPrice - a.minPrice;
      if (sortBy === "distance") return a.distanceKm - b.distanceKm;
      return b.reviewCount - a.reviewCount;
    });

    return list;
  }, [amenitiesFilter, hospitalFilter, hotelsWithDerived, onlyFamily, priceRange, searchQuery, sortBy]);

  const toggleAmenity = (value: string) => {
    setAmenitiesFilter(prev => (prev.includes(value) ? prev.filter(a => a !== value) : [...prev, value]));
  };

  const sortLabel: Record<SortBy, string> = {
    popularity: "Popularity",
    price_low: "Price: Low to High",
    price_high: "Price: High to Low",
    distance: "Distance",
  };

  const renderFilters = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Price</CardTitle>
          <p className="text-xs text-muted-foreground">Per night, inclusive of taxes</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <Slider
            min={800}
            max={12000}
            step={200}
            value={priceRange}
            onValueChange={value => setPriceRange(value as [number, number])}
          />
          <div className="flex items-center justify-between text-xs">
            <span>₹{priceRange[0].toLocaleString()}</span>
            <span>₹{priceRange[1].toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Collections</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox id="family" checked={onlyFamily} onCheckedChange={checked => setOnlyFamily(Boolean(checked))} />
            <Label htmlFor="family" className="text-sm">
              Family stays
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="near-hospital"
              checked={hospitalFilter !== "all"}
              onCheckedChange={checked => setHospitalFilter(checked ? "medanta" : "all")}
            />
            <Label htmlFor="near-hospital" className="text-sm">
              Near hospital
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Hotel facilities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {["Wi-Fi", "AC", "Cafeteria", "Laundry"].map(item => (
            <div key={item} className="flex items-center gap-2">
              <Checkbox
                id={item}
                checked={amenitiesFilter.includes(item)}
                onCheckedChange={() => toggleAmenity(item)}
              />
              <Label htmlFor={item} className="text-sm">
                {item}
              </Label>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-heading font-bold">Gurugram stays near hospitals</h1>
        <p className="text-sm text-muted-foreground">Compare prices, amenities, and distance before you book.</p>
      </div>

      {/* Top search bar like OYO */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by area, landmark or hotel name"
                className="pl-9"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-medium text-muted-foreground uppercase">Check-in</span>
                <Input type="date" className="h-9" defaultValue="2026-03-10" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-medium text-muted-foreground uppercase">Check-out</span>
                <Input type="date" className="h-9" defaultValue="2026-03-11" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-medium text-muted-foreground uppercase">Guests</span>
                <Select defaultValue="1">
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Guests" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Room, 1 Guest</SelectItem>
                    <SelectItem value="2">1 Room, 2 Guests</SelectItem>
                    <SelectItem value="3">2 Rooms, 3 Guests</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="h-10 px-6 bg-success hover:bg-success/90 text-success-foreground">
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for quick filters */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="all" className="text-xs">
            All stays
          </TabsTrigger>
          <TabsTrigger value="family" className="text-xs" onClick={() => setOnlyFamily(true)}>
            Family stays
          </TabsTrigger>
          <TabsTrigger
            value="medanta"
            className="text-xs"
            onClick={() => setHospitalFilter("medanta")}
          >
            Near Medanta
          </TabsTrigger>
          <TabsTrigger
            value="artemis"
            className="text-xs"
            onClick={() => setHospitalFilter("artemis")}
          >
            Near Artemis
          </TabsTrigger>
        </TabsList>
        <TabsContent value="all" />
        <TabsContent value="family" />
        <TabsContent value="medanta" />
        <TabsContent value="artemis" />
      </Tabs>

      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[280px,minmax(0,1fr)]">
        {/* Desktop sidebar filters */}
        <div className="hidden lg:block">{renderFilters()}</div>

        {/* Results + mobile filters */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{filtered.length} stays</span>
              <span>in Gurugram · Near hospitals</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="lg:hidden" asChild>
                <Sheet>
                  <SheetTrigger asChild>
                    <span className="inline-flex items-center gap-1">
                      <SlidersHorizontal className="h-3.5 w-3.5" />
                      Filters
                    </span>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-full sm:max-w-sm overflow-y-auto">
                    <SheetHeader className="mb-4">
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    {renderFilters()}
                  </SheetContent>
                </Sheet>
              </Button>

              <Button variant="outline" size="sm" className="hidden sm:inline-flex gap-1">
                <Map className="h-3.5 w-3.5" />
                Map view
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="inline-flex items-center gap-1">
                    <span className="text-xs">Sort: {sortLabel[sortBy]}</span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSortBy("popularity")}>Popularity</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("price_low")}>Price: Low to High</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("price_high")}>Price: High to Low</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("distance")}>Distance</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="grid gap-4">
            {filtered.map((hotel, i) => (
              <motion.div
                key={hotel.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card
                  className="overflow-hidden hover:shadow-elevated transition-shadow cursor-pointer"
                  onClick={() => navigate(`/hotels/${hotel.id}`)}
                >
                  <div className="flex flex-col sm:flex-row">
                    <img src={hotel.image} alt={hotel.name} className="h-48 sm:h-auto sm:w-64 object-cover" />
                    <div className="flex-1 p-5">
                      <div className="flex items-start justify-between mb-2 gap-3">
                        <div>
                          <h3 className="font-heading font-semibold text-lg">{hotel.name}</h3>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                            <MapPin className="h-3.5 w-3.5" />
                            {hotel.address}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {hotel.distanceKm} km from {hotel.nearbyHospital}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-md">
                            <Star className="h-3.5 w-3.5 text-warning fill-warning" />
                            <span className="text-sm font-semibold text-primary">{hotel.rating}</span>
                            <span className="text-[10px] text-muted-foreground">({hotel.reviewCount})</span>
                          </div>
                          <Badge variant="secondary" className="text-[10px]">
                            {hotel.availableRooms} rooms available
                          </Badge>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {hotel.amenities.slice(0, 5).map(a => (
                          <Badge key={a} variant="outline" className="text-[10px] font-normal">
                            {a}
                          </Badge>
                        ))}
                        {hotel.amenities.length > 5 && (
                          <Badge variant="outline" className="text-[10px] font-normal">
                            +{hotel.amenities.length - 5} more
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
                        {hotel.nearbyPlaces.slice(0, 3).map(p => (
                          <span key={p.name} className="flex items-center gap-1">
                            {p.type === "Pharmacy" ? (
                              <Phone className="h-3 w-3" />
                            ) : p.type === "Restaurant" ? (
                              <Utensils className="h-3 w-3" />
                            ) : (
                              <MapPin className="h-3 w-3" />
                            )}
                            {p.name} ({p.distance})
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs text-muted-foreground">From </span>
                          <span className="text-lg font-heading font-bold text-primary">
                            ₹{hotel.minPrice.toLocaleString()}
                          </span>
                          <span className="text-xs text-muted-foreground"> /night</span>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="secondary" className="bg-success/10 text-success text-[10px]">
                            Great for long stays
                          </Badge>
                          <Button size="sm">View Details</Button>
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
    </div>
  );
}
