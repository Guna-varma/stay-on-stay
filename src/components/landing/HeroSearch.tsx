import { useState } from "react";
import { Search, CalendarDays, Users, MapPin, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HERO_HEALTHCARE_IMAGE } from "@/lib/healthcare-images";
import { useI18n } from "@/lib/i18n";
import { useSearchParams } from "react-router-dom";
import {
  inferVisitorIndiaLikely,
  setStoredWhatsAppRegion,
  WHATSAPP_IN_NUMBER,
  WHATSAPP_RW_NUMBER,
  whatsappMeUrl,
} from "@/lib/whatsappContact";

const GUEST_OPTIONS = [
  { value: "1", label: "1 Room, 1 Guest" },
  { value: "2", label: "1 Room, 2 Guests" },
  { value: "3", label: "2 Rooms, 3 Guests" },
] as const;

const QUICK_COUNTRIES = [
  { value: "nigeria", labelKey: "quick.country.nigeria" },
  { value: "kenya", labelKey: "quick.country.kenya" },
  { value: "rwanda", labelKey: "quick.country.rwanda" },
  { value: "ghana", labelKey: "quick.country.ghana" },
  { value: "south-africa", labelKey: "quick.country.southafrica" },
  { value: "uganda", labelKey: "quick.country.uganda" },
  { value: "india", labelKey: "quick.country.india" },
  { value: "other", labelKey: "quick.country.other" },
] as const;

const defaultCheckIn = new Date(2026, 2, 10);
const defaultCheckOut = new Date(2026, 2, 11);

const HeroSearch = () => {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("location") ?? "");
  const [checkIn, setCheckIn] = useState<Date | undefined>(defaultCheckIn);
  const [checkOut, setCheckOut] = useState<Date | undefined>(defaultCheckOut);
  const [guests, setGuests] = useState(searchParams.get("guests") ?? "1");
  const [nearMeLoading, setNearMeLoading] = useState(false);

  const [quickName, setQuickName] = useState("");
  const [quickCountry, setQuickCountry] = useState<string>("rwanda");

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
      },
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

  const scrollToHotels = () => {
    document.getElementById("hotels")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const openWhatsAppQuick = () => {
    const opt = QUICK_COUNTRIES.find((c) => c.value === quickCountry);
    const countryLabel = opt ? t(opt.labelKey) : quickCountry;
    const region = quickCountry === "india" ? "in" : "intl";
    setStoredWhatsAppRegion(region);
    const n = quickCountry === "india" ? WHATSAPP_IN_NUMBER : WHATSAPP_RW_NUMBER;
    const namePart = quickName.trim() ? quickName.trim() : t("quick.anonymous");
    const msg = t("quick.prefill").replace("{name}", namePart).replace("{country}", countryLabel);
    window.open(whatsappMeUrl(n, msg), "_blank", "noopener,noreferrer");
  };

  return (
    <section className="relative flex w-full items-start justify-center overflow-hidden pb-8 sm:pb-10 md:pb-12 min-h-[min(42vh,420px)] sm:min-h-0">
      <img
        src={HERO_HEALTHCARE_IMAGE}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        fetchpriority="high"
        decoding="async"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/20"
        aria-hidden
      />
      <div className="absolute inset-0" style={{ background: "var(--hero-overlay)" }} />

      <motion.div
        className="relative z-10 max-w-page w-full px-3 pt-6 pb-2 sm:px-4 sm:pt-8 sm:pb-4 md:pt-10"
        initial={reduceMotion ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="mx-auto mb-6 max-w-3xl text-center sm:mb-8">
          <h1 className="mb-3 text-balance text-2xl font-semibold leading-[1.15] tracking-tight text-primary-foreground [text-shadow:0_2px_28px_rgba(0,0,0,0.5),0_1px_2px_rgba(0,0,0,0.4)] sm:text-3xl md:text-4xl lg:text-[2.5rem]">
            {t("hero.title")}
          </h1>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-primary-foreground/95 [text-shadow:0_1px_18px_rgba(0,0,0,0.45)] sm:text-base md:text-lg">
            {t("hero.subtitle")}
          </p>
          <p className="mt-4 text-xs font-semibold text-white/95 [text-shadow:0_1px_14px_rgba(0,0,0,0.42)] sm:text-sm">
            {t("hero.promise")}
          </p>
        </div>

        <div className="mx-auto mb-8 max-w-xl rounded-2xl border border-white/20 bg-card/95 p-4 shadow-[0_24px_56px_-28px_rgba(0,0,0,0.45)] backdrop-blur-md sm:p-5">
          <p className="text-sm font-semibold text-foreground text-center mb-3">{t("quick.title")}</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1">
              <Label htmlFor="quick-name" className="text-xs text-muted-foreground">
                {t("quick.name")}
              </Label>
              <Input
                id="quick-name"
                value={quickName}
                onChange={(e) => setQuickName(e.target.value)}
                placeholder={t("quick.namePlaceholder")}
                className="h-11"
                autoComplete="name"
              />
            </div>
            <div className="flex-1 space-y-1">
              <Label htmlFor="quick-country" className="text-xs text-muted-foreground">
                {t("quick.country")}
              </Label>
              <Select value={quickCountry} onValueChange={setQuickCountry}>
                <SelectTrigger
                id="quick-country"
                className="h-11 focus:ring-2 focus:ring-primary/35 focus:border-primary/40 transition-shadow"
              >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUICK_COUNTRIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {t(c.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              variant="cta"
              className="h-11 w-full sm:w-auto shrink-0 bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold px-6 border-0 shadow-md hover:shadow-lg"
              onClick={openWhatsAppQuick}
            >
              {t("quick.submit")}
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center max-w-xl sm:max-w-2xl mx-auto mb-8">
          <Button
            type="button"
            size="lg"
            variant="cta"
            className="h-12 sm:h-14 text-base font-semibold bg-[#25D366] hover:bg-[#20BD5A] text-white border-0"
            onClick={() => {
              const n = inferVisitorIndiaLikely() ? WHATSAPP_IN_NUMBER : WHATSAPP_RW_NUMBER;
              window.open(whatsappMeUrl(n, t("hero.whatsappPrefill")), "_blank", "noopener,noreferrer");
            }}
          >
            <MessageCircle className="mr-2 h-5 w-5" aria-hidden />
            {t("hero.whatsappCta")}
          </Button>
          <Button
            type="button"
            size="lg"
            variant="cta"
            className="h-12 sm:h-14 text-base font-semibold"
            onClick={scrollToHotels}
          >
            {t("hero.bookNow")}
          </Button>
        </div>

        <section className="max-w-5xl mx-auto w-full" aria-labelledby="hero-apartment-search-heading">
          <div className="mb-2 flex flex-wrap items-center justify-center gap-2 px-1 sm:mb-3">
            <Search className="h-4 w-4 shrink-0 text-white/95 [filter:drop-shadow(0_1px_6px_rgba(0,0,0,0.45))]" aria-hidden />
            <h2
              id="hero-apartment-search-heading"
              className="text-center text-sm font-semibold tracking-tight text-white/95 [text-shadow:0_1px_12px_rgba(0,0,0,0.45)] sm:text-base"
            >
              {t("hero.searchToggle")}
            </h2>
          </div>
          <form
            onSubmit={handleSearch}
            className="relative z-[1] rounded-xl border border-border/50 bg-card p-3 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.25)] ring-2 ring-white/30 sm:p-4 md:p-5"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-2">
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <Label className="text-[11px] font-medium text-muted-foreground uppercase sm:pl-1">
                  {t("hero.search")}
                </Label>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-2">
                  <div className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-lg bg-muted px-3 py-2 sm:h-12 sm:py-0 focus-within:ring-1 focus-within:ring-primary/30 transition-all">
                    <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    <Input
                      type="text"
                      placeholder={t("hero.location.placeholder")}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-transparent border-0 shadow-none focus-visible:ring-0 h-9 min-h-0 py-0 text-sm min-w-0 flex-1"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleNearMe}
                    disabled={nearMeLoading}
                    aria-label={t("hero.nearMe")}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-primary/25 bg-primary/10 px-3 text-xs font-semibold text-primary shadow-sm ring-1 ring-primary/10 transition-colors hover:bg-primary/15 disabled:opacity-60 sm:min-w-[7.5rem] sm:self-auto min-h-11 sm:h-12 sm:px-4"
                  >
                    <MapPin className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden />
                    <span className="whitespace-nowrap">{nearMeLoading ? "…" : t("hero.nearMe")}</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1 sm:w-[130px]">
                <Label className="text-[11px] font-medium text-muted-foreground uppercase sm:pl-1">
                  {t("hero.checkin")}
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="flex items-center gap-2 bg-muted rounded-lg px-3 h-11 sm:h-12 cursor-pointer focus-within:ring-1 focus-within:ring-primary/30 transition-all">
                      <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="text-sm">
                        {checkIn ? format(checkIn, "dd-MM-yyyy") : t("hero.date.placeholder")}
                      </span>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={checkIn} onSelect={setCheckIn} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex flex-col gap-1 sm:w-[130px]">
                <Label className="text-[11px] font-medium text-muted-foreground uppercase sm:pl-1">
                  {t("hero.checkout")}
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="flex items-center gap-2 bg-muted rounded-lg px-3 h-11 sm:h-12 cursor-pointer focus-within:ring-1 focus-within:ring-primary/30 transition-all">
                      <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="text-sm">
                        {checkOut ? format(checkOut, "dd-MM-yyyy") : t("hero.date.placeholder")}
                      </span>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={checkOut} onSelect={setCheckOut} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex flex-col gap-1 sm:w-[160px]">
                <Label className="text-[11px] font-medium text-muted-foreground uppercase sm:pl-1">
                  {t("hero.guestsLabel")}
                </Label>
                <Select value={guests} onValueChange={setGuests}>
                  <SelectTrigger className="h-11 sm:h-12 bg-muted border-0 shadow-none focus:ring-1 focus:ring-primary/30 rounded-lg px-3 [&>span]:text-sm">
                    <span className="flex items-center gap-2 min-w-0">
                      <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <SelectValue placeholder={t("hero.guestsLabel")} />
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

              <Button
                type="submit"
                className="h-11 sm:h-12 px-6 bg-green-600 hover:bg-green-700 text-white font-medium text-sm sm:text-base shrink-0"
              >
                {t("hero.search")}
              </Button>
            </div>
          </form>
        </section>

        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mt-6 text-center">
          {[t("hero.badge1"), t("hero.badge2"), t("hero.badge3")].map((badge) => (
            <span
              key={badge}
              className="flex items-center gap-1.5 text-xs text-white/95 [text-shadow:0_1px_10px_rgba(0,0,0,0.45)] sm:text-sm"
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400 shadow-sm ring-1 ring-white/30" aria-hidden />
              {badge}
            </span>
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSearch;
