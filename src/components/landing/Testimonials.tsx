import { Star, Quote } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useI18n } from "@/lib/i18n";

const testimonials = [
  {
    name: "Aisha Mbabazi",
    location: "Kigali, Rwanda",
    avatar: "AM",
    rating: 5,
    text: "StayOnStay made my medical trip to India so easy. The hotel was 5 minutes from the hospital, and the translator service was a lifesaver!",
  },
  {
    name: "Rajesh Sharma",
    location: "Delhi, India",
    avatar: "RS",
    rating: 5,
    text: "My mother needed surgery at AIIMS. We found a clean, affordable hotel right next door through StayOnStay. The 24/7 support was incredible.",
  },
  {
    name: "Marie Uwimana",
    location: "Butare, Rwanda",
    avatar: "MU",
    rating: 4,
    text: "I was worried about finding a safe place to stay near the hospital. StayOnStay took away all my stress. The staff was so kind and helpful.",
  },
  {
    name: "Carlos Mendez",
    location: "Mexico City, Mexico",
    avatar: "CM",
    rating: 5,
    text: "The airport pickup and long-stay package saved us so much money. Everything was organized perfectly for our 3-week treatment stay.",
  },
  {
    name: "Fatima Al-Hassan",
    location: "Dubai, UAE",
    avatar: "FA",
    rating: 5,
    text: "As an international patient, the language barrier was my biggest fear. StayOnStay's translator service and verified hotels gave me peace of mind.",
  },
  {
    name: "Jean-Pierre Nkusi",
    location: "Musanze, Rwanda",
    avatar: "JN",
    rating: 5,
    text: "Nageye StayOnStay igihe nari nkeneye ibitaro i Nairobi. Byose byari byiza — ihoteri, gutwara, n'ubufasha. Ndabashimira cyane!",
  },
];

const Testimonials = () => {
  const { t } = useI18n();

  return (
    <section className="py-16 lg:py-24">
      <div className="max-w-page">
        <div className="text-center mb-12">
          <h2 className="text-foreground mb-3">{t("testimonials.title")}</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {t("testimonials.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((item, i) => (
            <Card
              key={item.name}
              className="group p-6 shadow-card hover:shadow-card-hover border-0 transition-all duration-220 animate-fade-in"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <Quote className="h-8 w-8 text-primary/20 mb-3" />
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                "{item.text}"
              </p>
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: 5 }).map((_, si) => (
                  <Star
                    key={si}
                    className={`h-3.5 w-3.5 ${si < item.rating ? "fill-accent text-accent" : "text-border"}`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-3 border-t border-border pt-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                    {item.avatar}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.location}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
