import { Star, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FEATURED_IMAGES } from "@/lib/airbnb-images";
import { useI18n } from "@/lib/i18n";
import { formatDualPrice } from "@/lib/currency";
import { useNavigate } from "react-router-dom";

const featuredHotels = [
  {
    id: 1,
    name: "MedStay Comfort Suites",
    image: FEATURED_IMAGES[0],
    rating: 4.8,
    distance: "0.5 km from Apollo Hospital",
    price: 75,
    tags: ["WiFi", "Kitchen", "AC"],
  },
  {
    id: 2,
    name: "Serenity Health Resort",
    image: FEATURED_IMAGES[1],
    rating: 4.6,
    distance: "1.2 km from Fortis Hospital",
    price: 92,
    tags: ["Pool", "Gym", "Laundry"],
  },
  {
    id: 3,
    name: "CareNest Residency",
    image: FEATURED_IMAGES[2],
    rating: 4.9,
    distance: "0.3 km from AIIMS",
    price: 65,
    tags: ["Long-stay", "Kitchen", "Elevator"],
  },
];

const FeaturedHotels = () => {
  const { t } = useI18n();
  const navigate = useNavigate();

  return (
    <>
      <section id="hotels" className="py-16 lg:py-24">
        <div className="max-w-page">
          <div className="text-center mb-12">
            <h2 className="text-foreground mb-3">{t("featured.title")}</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {t("featured.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredHotels.map((hotel, i) => {
              const price = formatDualPrice(hotel.price);
              return (
                <Card
                  key={hotel.id}
                  className="group overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-220 cursor-pointer animate-fade-in border-0"
                  style={{ animationDelay: `${i * 0.1}s` }}
                  onClick={() => navigate("/hotels")}
                >
                  <div className="relative overflow-hidden aspect-[4/3]">
                    <img
                      src={hotel.image}
                      alt={hotel.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-card/90 text-foreground backdrop-blur-sm border-0 shadow-sm">
                        <Star className="h-3 w-3 fill-accent text-accent mr-1" />
                        {hotel.rating}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-5">
                    <h4 className="text-foreground mb-1.5">{hotel.name}</h4>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mb-3">
                      <MapPin className="h-3.5 w-3.5 text-secondary" />
                      {hotel.distance}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {hotel.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs font-normal">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-baseline justify-between border-t border-border pt-3">
                      <div>
                        <span className="text-2xl font-bold text-primary">{price.usd}</span>
                        <span className="text-sm text-muted-foreground ml-1.5">/ {price.inr}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{t("featured.pernight")}</span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="max-w-page">
          <div className="text-center">
            <h2 className="text-foreground mb-3">Explore more stays</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Browse our full collection of verified stays near top hospitals.
            </p>
          </div>
        </div>
      </section>
    </>
  );
};

export default FeaturedHotels;
