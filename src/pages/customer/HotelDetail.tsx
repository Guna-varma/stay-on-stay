import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DoorOpen,
  ExternalLink,
  MapPin,
  Percent,
  Tag,
  Users,
  Wifi,
  Snowflake,
  Tv,
  Car,
  Waves,
  Dumbbell,
  Utensils,
  Zap,
  Camera,
  Flame,
  Sparkles,
  Coffee,
  Plane,
  Sun,
  Wine,
  type LucideIcon,
} from "lucide-react";
import {
  countAvailableRoomsBatch,
  getPublicHotelDetail,
  publicHotelCoverUrls,
  type PublicHotelCard,
  type PublicRoomTypeCard,
} from "@/lib/supabase";
import { HotelCoverCarousel } from "@/components/HotelCoverCarousel";
import { computeStayPricing, pricingTierLabel } from "@/lib/pricing";

function heroCoverUrls(h: PublicHotelCard): string[] {
  const u = publicHotelCoverUrls(h);
  if (u.length > 0) return u;
  const r0 = h.room_types[0]?.images?.[0];
  return r0 ? [r0] : [];
}

const ICON_MAP: Record<string, LucideIcon> = {
  wifi: Wifi,
  snowflake: Snowflake,
  tv: Tv,
  car: Car,
  waves: Waves,
  dumbbell: Dumbbell,
  utensils: Utensils,
  zap: Zap,
  camera: Camera,
  flame: Flame,
  sparkles: Sparkles,
  coffee: Coffee,
  plane: Plane,
  sun: Sun,
  wine: Wine,
};

function AmenityIcon({ icon }: { icon: string | null }) {
  const Comp = icon ? ICON_MAP[icon] : null;
  if (Comp) return <Comp className="h-4 w-4" />;
  return <Tag className="h-4 w-4" />;
}

function DiscountBadge({ rt }: { rt: PublicRoomTypeCard }) {
  if (rt.discount_type === "none" || !rt.discount_value) return null;
  const label =
    rt.discount_type === "percentage"
      ? `${rt.discount_value}% OFF`
      : `₹${rt.discount_value} OFF`;
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs font-semibold">
      <Percent className="h-3 w-3" />
      {label}
    </span>
  );
}

function PriceBlock({ rt, nights }: { rt: PublicRoomTypeCard; nights: number }) {
  const hasDiscount = rt.discount_type !== "none" && rt.discount_value > 0;
  const finalPrice = Number(rt.final_price ?? rt.base_price ?? 0);
  const stay = computeStayPricing({
    finalPrice,
    weeklyNightly: rt.weekly_nightly_rate,
    monthlyNightly: rt.monthly_nightly_rate,
    nights,
  });
  const showLongStaySavings =
    stay.tier !== "standard" && stay.listSubtotal > stay.lineTotal;

  return (
    <div className="text-right space-y-0.5">
      <div className="flex items-center justify-end gap-1.5">
        {hasDiscount && (
          <span className="text-sm line-through text-muted-foreground">
            ₹{Number(rt.base_price ?? 0).toLocaleString()}
          </span>
        )}
        <span className="text-lg font-bold text-primary">
          ₹{stay.effectiveNightly.toLocaleString()}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">/night · {pricingTierLabel(stay.tier)}</p>
      {hasDiscount && <DiscountBadge rt={rt} />}
      {showLongStaySavings && (
        <p className="text-[11px] text-muted-foreground">
          vs standard total ₹{stay.listSubtotal.toLocaleString()}
        </p>
      )}
      <p className="text-xs font-medium mt-1">
        Total: ₹{stay.lineTotal.toLocaleString()} ({nights}n)
      </p>
    </div>
  );
}

export default function HotelDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [hotel, setHotel] = useState<PublicHotelCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkIn, setCheckIn] = useState(
    params.get("checkIn") ?? new Date().toISOString().slice(0, 10)
  );
  const [checkOut, setCheckOut] = useState(
    params.get("checkOut") ??
      (() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().slice(0, 10);
      })()
  );
  const [availability, setAvailability] = useState<Record<string, number>>({});

  useEffect(() => {
    let mounted = true;
    getPublicHotelDetail(id).then(({ data }) => {
      if (!mounted) return;
      setHotel(data);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    let mounted = true;
    if (!hotel) return;
    const ids = hotel.room_types.map((rt) => rt.id);
    countAvailableRoomsBatch(ids, checkIn, checkOut).then(({ data }) => {
      if (mounted) setAvailability(data);
    });
    return () => {
      mounted = false;
    };
  }, [hotel, checkIn, checkOut]);

  const nights = useMemo(
    () =>
      Math.max(
        1,
        Math.round(
          (new Date(`${checkOut}T12:00:00Z`).getTime() -
            new Date(`${checkIn}T12:00:00Z`).getTime()) /
            86400000
        )
      ),
    [checkIn, checkOut]
  );

  if (loading)
    return (
      <div className="p-8 text-center text-muted-foreground">
        Loading hotel...
      </div>
    );
  if (!hotel)
    return (
      <div className="p-8 text-center text-muted-foreground">
        Hotel not found
      </div>
    );

  const coverFallbacks = heroCoverUrls(hotel);

  return (
    <div className="space-y-8">
      {/* Back link */}
      <button
        onClick={() => navigate("/hotels")}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Back to Hotels
      </button>

      {/* ── Hero (up to 3 cover images, auto-rotate every 3s) ── */}
      <div className="relative rounded-2xl overflow-hidden h-56 sm:h-72 lg:h-80">
        <HotelCoverCarousel
          images={coverFallbacks}
          alt={hotel.name}
          className="absolute inset-0 h-full w-full bg-muted"
          showBottomGradient
        />
        <div className="absolute bottom-6 left-6 right-6 z-30">
          <h1 className="text-3xl font-heading font-bold text-white drop-shadow-lg">
            {hotel.name}
          </h1>
          <div className="text-white/90 text-sm flex items-center gap-1 mt-1">
            <MapPin className="h-4 w-4" />
            {[hotel.address, hotel.city, hotel.country]
              .filter(Boolean)
              .join(", ")}
          </div>
        </div>
      </div>

      {/* ── Description ── */}
      {hotel.description && (
        <div className="max-w-3xl">
          <p className="text-muted-foreground leading-relaxed">
            {hotel.description}
          </p>
        </div>
      )}

      {/* ── Amenities ── */}
      {hotel.amenities.length > 0 && (
        <section>
          <h2 className="text-lg font-heading font-semibold mb-3">Amenities</h2>
          <div className="flex flex-wrap gap-2">
            {hotel.amenities.map((a) => (
              <span
                key={a.id}
                className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-sm"
              >
                <AmenityIcon icon={a.icon} />
                {a.name}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* ── Date Picker ── */}
      <Card>
        <CardContent className="p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Check-in</p>
            <Input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Check-out</p>
            <Input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2 flex items-end text-sm text-muted-foreground">
            {nights} night(s) stay
          </div>
        </CardContent>
      </Card>

      {/* ── Room Cards ── */}
      <section>
        <h2 className="text-lg font-heading font-semibold mb-3">Rooms</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {hotel.room_types.map((rt) => {
            const left = availability[rt.id] ?? 0;
            return (
              <Card
                key={rt.id}
                className="hover:shadow-elevated transition-shadow overflow-hidden"
              >
                <CardContent className="p-0">
                  {/* Image carousel */}
                  <div className="flex gap-0.5 overflow-x-auto">
                    {(rt.images.length ? rt.images : coverFallbacks.length ? coverFallbacks : [""])
                      .slice(0, 5)
                      .map((img, idx) => (
                        <img
                          key={`${rt.id}-${idx}`}
                          src={img ?? ""}
                          alt={rt.name}
                          className="h-36 w-48 object-cover bg-muted shrink-0 first:rounded-tl-lg last:rounded-tr-lg"
                        />
                      ))}
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <h3 className="font-semibold text-base">{rt.name}</h3>
                        {rt.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {rt.description}
                          </p>
                        )}
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                          <Users className="h-3.5 w-3.5" />
                          Up to {rt.max_guests ?? 2} guests
                        </div>
                      </div>
                      <PriceBlock rt={rt} nights={nights} />
                    </div>

                    {/* Individual room numbers for transparency */}
                    {rt.room_numbers.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <DoorOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        {rt.room_numbers.map((rn) => (
                          <span
                            key={rn}
                            className="inline-flex items-center rounded-md border bg-muted/50 px-2 py-0.5 text-xs font-medium text-foreground"
                          >
                            {rn}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="text-xs">
                        {left > 0 ? (
                          <Badge variant="secondary">{left} available</Badge>
                        ) : (
                          <Badge variant="destructive">Sold out</Badge>
                        )}
                        {left > 0 && left <= 2 && (
                          <span className="ml-2 text-orange-600 font-medium">
                            Almost sold out
                          </span>
                        )}
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      disabled={left < 1}
                      onClick={() =>
                        navigate(
                          `/checkout?hotelId=${hotel.id}&roomTypeId=${rt.id}&checkIn=${checkIn}&checkOut=${checkOut}`
                        )
                      }
                    >
                      {left < 1 ? "Unavailable" : "Continue to Book"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ── Nearby Landmarks ── */}
      {hotel.landmarks.length > 0 && (
        <section>
          <h2 className="text-lg font-heading font-semibold mb-3">
            Nearby Landmarks
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {hotel.landmarks.map((lm) => (
              <Card key={lm.id}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{lm.name}</p>
                    {lm.google_maps_url && (
                      <a
                        href={lm.google_maps_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-0.5"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Open in Google Maps
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Embedded map preview if any landmark has lat/lng */}
          {hotel.landmarks.some((lm) => lm.latitude && lm.longitude) && (
            <div className="mt-4 rounded-xl overflow-hidden border">
              <iframe
                title="Map preview"
                width="100%"
                height="300"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps/embed/v1/place?key=&q=${
                  hotel.landmarks.find((lm) => lm.latitude && lm.longitude)!
                    .latitude
                },${
                  hotel.landmarks.find((lm) => lm.latitude && lm.longitude)!
                    .longitude
                }`}
              />
            </div>
          )}
        </section>
      )}
    </div>
  );
}
