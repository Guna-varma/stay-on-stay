import { useState } from "react";
import { Search, CalendarDays, Users, Locate } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HERO_IMAGE } from "@/lib/airbnb-images";
import { useI18n } from "@/lib/i18n";
import { useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";

const GUEST_OPTIONS = [
  { value: "1", label: "1 Room, 1 Guest" },
  { value: "2", label: "1 Room, 2 Guests" },
  { value: "3", label: "2 Rooms, 3 Guests" },
] as const;

const defaultCheckIn = new Date(2026, 2, 10);
const defaultCheckOut = new Date(2026, 2, 11);

const HeroSearch = () => {
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("location") ?? "");
  const [checkIn, setCheckIn] = useState<Date | undefined>(defaultCheckIn);
  const [checkOut, setCheckOut] = useState<Date | undefined>(defaultCheckOut);
  const [guests, setGuests] = useState(searchParams.get("guests") ?? "1");
  const [nearMeLoading, setNearMeLoading] = useState(false);

  const handleNearMe = () => {
    if (!navigator.geolocation) {
      setSearchQuery("Near me");
      return;
    }
    setNearMeLoading(true);
    navigator.geolocation.getCurrentPosition(
      () => {
        setSearchQuery("Near me");
        setNearMeLoading(false);
      },
      () => {
        setSearchQuery("Near me");
        setNearMeLoading(false);
      }
    );
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (searchQuery.trim()) next.set("location", searchQuery.trim());
    else next.delete("location");
    if (checkIn) next.set("checkIn", format(checkIn, "dd-MM-yyyy"));
    else next.delete("checkIn");
    if (checkOut) next.set("checkOut", format(checkOut, "dd-MM-yyyy"));
    else next.delete("checkOut");
    if (guests && guests !== "1") next.set("guests", guests);
    else next.delete("guests");
    setSearchParams(next, { replace: true });
    document.getElementById("hotels")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="relative min-h-[420px] sm:min-h-[480px] flex items-center justify-center overflow-hidden">
      <img
        src={HERO_IMAGE}
        alt="Medical hospitality"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div
        className="absolute inset-0"
        style={{ background: "var(--hero-overlay)" }}
      />

      <div className="relative z-10 max-w-page w-full py-6 sm:py-10 md:py-14 text-center px-3 sm:px-4">
        <h1 className="text-primary-foreground mb-2 sm:mb-3 text-2xl sm:text-3xl md:text-4xl lg:text-[40px] animate-fade-in">
          {t("hero.title")}
        </h1>
        <p className="text-primary-foreground/85 text-sm sm:text-base md:text-lg max-w-2xl mx-auto mb-6 sm:mb-8 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          {t("hero.subtitle")}
        </p>

        <form
          onSubmit={handleSearch}
          className="bg-card rounded-xl p-3 sm:p-4 shadow-card-hover max-w-5xl mx-auto animate-fade-in"
          style={{ animationDelay: "0.2s" }}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-2">
            {/* Search by area, landmark or hotel name + Near me */}
            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <Label className="text-[11px] font-medium text-muted-foreground uppercase sm:pl-1">Search</Label>
              <div className="flex items-center gap-2 bg-muted rounded-lg pl-3 pr-1.5 py-1 h-11 sm:h-12 focus-within:shadow-search-glow focus-within:ring-1 focus-within:ring-primary/30 transition-all">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by area, landmark or hotel name"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-0 shadow-none focus-visible:ring-0 h-auto py-0 text-sm placeholder:text-muted-foreground min-w-0 flex-1"
                />
                <button
                  type="button"
                  onClick={handleNearMe}
                  disabled={nearMeLoading}
                  className="shrink-0 flex items-center gap-1.5 rounded-full bg-muted-foreground/15 hover:bg-muted-foreground/25 text-foreground px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60"
                >
                  <Locate className="h-3.5 w-3.5" />
                  {nearMeLoading ? "…" : "Near me"}
                </button>
              </div>
            </div>

            {/* Check-in */}
            <div className="flex flex-col gap-1 sm:w-[130px]">
              <Label className="text-[11px] font-medium text-muted-foreground uppercase sm:pl-1">Check-in</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <div className="flex items-center gap-2 bg-muted rounded-lg px-3 h-11 sm:h-12 cursor-pointer focus-within:shadow-search-glow focus-within:ring-1 focus-within:ring-primary/30 transition-all">
                    <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="text-sm">{checkIn ? format(checkIn, "dd-MM-yyyy") : "Add date"}</span>
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={checkIn} onSelect={setCheckIn} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            {/* Check-out */}
            <div className="flex flex-col gap-1 sm:w-[130px]">
              <Label className="text-[11px] font-medium text-muted-foreground uppercase sm:pl-1">Check-out</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <div className="flex items-center gap-2 bg-muted rounded-lg px-3 h-11 sm:h-12 cursor-pointer focus-within:shadow-search-glow focus-within:ring-1 focus-within:ring-primary/30 transition-all">
                    <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="text-sm">{checkOut ? format(checkOut, "dd-MM-yyyy") : "Add date"}</span>
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={checkOut} onSelect={setCheckOut} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            {/* Guests */}
            <div className="flex flex-col gap-1 sm:w-[160px]">
              <Label className="text-[11px] font-medium text-muted-foreground uppercase sm:pl-1">Guests</Label>
              <Select value={guests} onValueChange={setGuests}>
                <SelectTrigger className="h-11 sm:h-12 bg-muted border-0 shadow-none focus:ring-1 focus:ring-primary/30 rounded-lg px-3 [&>span]:text-sm">
                  <span className="flex items-center gap-2 min-w-0">
                    <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <SelectValue placeholder="Guests" />
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {GUEST_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-sm">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search button - green */}
            <Button
              type="submit"
              className="h-11 sm:h-12 px-6 bg-green-600 hover:bg-green-700 text-white font-medium text-sm sm:text-base shrink-0"
            >
              Search
            </Button>
          </div>
        </form>

        <div className="flex flex-wrap justify-center gap-6 mt-6 sm:mt-8 animate-fade-in" style={{ animationDelay: "0.35s" }}>
          {[t("hero.badge1"), t("hero.badge2"), t("hero.badge3")].map((badge) => (
            <span key={badge} className="text-sm text-primary-foreground/75 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              {badge}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSearch;
