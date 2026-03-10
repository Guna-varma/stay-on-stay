import { useState } from "react";
import { Search, MapPin, CalendarDays, Building2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HERO_IMAGE } from "@/lib/airbnb-images";
import { useI18n } from "@/lib/i18n";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const HeroSearch = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [checkIn, setCheckIn] = useState<Date | undefined>();
  const [checkOut, setCheckOut] = useState<Date | undefined>();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/hotels");
  };

  return (
    <section className="relative min-h-[540px] flex items-center justify-center overflow-hidden">
      <img
        src={HERO_IMAGE}
        alt="Medical hospitality"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div
        className="absolute inset-0"
        style={{ background: "var(--hero-overlay)" }}
      />

      <div className="relative z-10 max-w-page w-full py-10 sm:py-16 text-center px-2">
        <h1 className="text-primary-foreground mb-3 sm:mb-4 text-2xl sm:text-3xl md:text-4xl lg:text-[40px] animate-fade-in">
          {t("hero.title")}
        </h1>
        <p className="text-primary-foreground/85 text-base sm:text-lg max-w-2xl mx-auto mb-8 sm:mb-10 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          {t("hero.subtitle")}
        </p>

        <form
          onSubmit={handleSearch}
          className="bg-card rounded-xl p-3 sm:p-4 shadow-card-hover max-w-4xl mx-auto animate-fade-in"
          style={{ animationDelay: "0.2s" }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <SearchField icon={<MapPin className="h-4 w-4" />} label={t("hero.location")} placeholder={t("hero.location.placeholder")} />
            <SearchField icon={<Building2 className="h-4 w-4" />} label={t("hero.hospital")} placeholder={t("hero.hospital.placeholder")} />
            <DateField
              icon={<CalendarDays className="h-4 w-4" />}
              label={t("hero.checkin")}
              date={checkIn}
              onSelect={setCheckIn}
              placeholder={t("hero.date.placeholder")}
            />
            <DateField
              icon={<CalendarDays className="h-4 w-4" />}
              label={t("hero.checkout")}
              date={checkOut}
              onSelect={setCheckOut}
              placeholder={t("hero.date.placeholder")}
            />
            <div className="flex items-end">
              <Button type="submit" className="w-full h-12 text-base gap-2" size="lg">
                <Search className="h-4 w-4" />
                {t("hero.search")}
              </Button>
            </div>
          </div>
        </form>

        <div className="flex flex-wrap justify-center gap-6 mt-8 animate-fade-in" style={{ animationDelay: "0.35s" }}>
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

const SearchField = ({ icon, label, placeholder }: { icon: React.ReactNode; label: string; placeholder: string }) => (
  <div className="flex flex-col gap-1">
    <Label className="text-xs font-medium text-muted-foreground pl-1">{label}</Label>
    <div className="flex items-center gap-2 bg-muted rounded-lg px-3 h-12 focus-within:shadow-search-glow focus-within:ring-1 focus-within:ring-primary/30 transition-all duration-150">
      <span className="text-muted-foreground shrink-0">{icon}</span>
      <Input
        type="text"
        placeholder={placeholder}
        className="bg-transparent border-0 shadow-none focus-visible:ring-0 h-auto py-0 text-sm placeholder:text-muted-foreground"
      />
    </div>
  </div>
);

const DateField = ({
  icon,
  label,
  date,
  onSelect,
  placeholder,
}: {
  icon: React.ReactNode;
  label: string;
  date: Date | undefined;
  onSelect: (d: Date | undefined) => void;
  placeholder: string;
}) => (
  <div className="flex flex-col gap-1">
    <Label className="text-xs font-medium text-muted-foreground pl-1">{label}</Label>
    <Popover>
      <PopoverTrigger asChild>
        <div
          className={cn(
            "flex items-center gap-2 bg-muted rounded-lg px-3 h-12 cursor-pointer focus-within:shadow-search-glow focus-within:ring-1 focus-within:ring-primary/30 transition-all duration-150",
            !date && "text-muted-foreground"
          )}
        >
          <span className="shrink-0">{icon}</span>
          <span className="text-sm">{date ? format(date, "PPP") : placeholder}</span>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={date} onSelect={onSelect} initialFocus />
      </PopoverContent>
    </Popover>
  </div>
);

export default HeroSearch;
