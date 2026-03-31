import { Building2, Train, Trees, MapPin, Landmark, Navigation, ShoppingBag, Utensils } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Hub = {
  sector: string;
  highlight: string;
  image: string;
  hospitals: string[];
  metros: string[];
  parks: string[];
  visits: string[];
  notes?: string;
};

const hubs: Hub[] = [
  {
    sector: "Sector 57",
    highlight: "Artemis access corridor",
    image:
      "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=1200&q=80",
    hospitals: [
      "Artemis Hospital – multi-specialty, JCI/NABH accredited (Sector 51 belt)",
      "Arihant Hospital – in-sector option for routine care",
      "CK Birla Hospital – women & child focus, ~1 km radius",
      "Cloudnine Hospital – maternity & pediatrics on Golf Course Extension Road",
    ],
    metros: [
      "Sector 55-56 Rapid Metro (~3 km)",
      "Sector 54 Chowk Rapid Metro (~3.5 km)",
      "Millennium City Centre / HUDA City Centre (Yellow Line, ~6 km)",
    ],
    parks: ["Local sector parks & jogging tracks", "Aravalli Biodiversity Park (short drive via Golf Course Road)"],
    visits: [
      "Good Earth City Centre – daily shopping, cafes, pharmacies",
      "Baani Square – neighborhood restaurants and salons",
      "Hong Kong Bazaar – convenience stores and food outlets",
      "DLF CyberHub – evening dining hub (via Rapid Metro interchange)",
    ],
    notes:
      "Sector 57 is popular with international patients because it balances quiet residential streets with easy access to Artemis and other specialty hospitals.",
  },
  {
    sector: "Sector 39",
    highlight: "Medanta medical district",
    image:
      "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80",
    hospitals: [
      "Medanta - The Medicity – large tertiary care centre in nearby Sector 38",
      "Park Hospital – multi-specialty in Sector 47 corridor",
      "Angel Medicare / Bal Mukund Hospital – local neighbourhood options",
    ],
    metros: [
      "Millennium City Centre / HUDA City Centre (Yellow Line, ~3.5 km)",
      "IFFCO Chowk (Yellow Line, onward connectivity to Delhi NCR)",
    ],
    parks: [
      "Leisure Valley Park – large green lung with walking paths",
      "Neighbourhood parks across Sectors 38–40",
    ],
    visits: [
      "Kingdom of Dreams / Sector 29 entertainment zone",
      "Sector 29 food hub – family-friendly restaurants and cafes",
      "Ambience Mall – large indoor mall for climate-controlled outings",
    ],
    notes:
      "Around Medanta, guests usually prefer short-radius transport (cabs or autos) to keep transfers under 15–20 minutes between hotel and hospital.",
  },
  {
    sector: "Sector 45",
    highlight: "Central Gurgaon connectivity zone",
    image:
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80",
    hospitals: [
      "Fortis Memorial Research Institute – 450+ bed quaternary hospital",
      "Medharbour Family Clinic – diagnostics and day-care services",
      "Paras Health, Sector 43 – orthopedics and neurology strengths",
    ],
    metros: [
      "Millennium City Centre / HUDA City Centre (Yellow Line, ~2 km)",
      "Sector 42-43 Rapid Metro (interchange towards Cyber City)",
    ],
    parks: [
      "Leisure Valley Park – central lawns and amphitheatre area",
      "Aravalli Biodiversity Park – nature trails and birding",
    ],
    visits: [
      "Huda Market 45-46 – local market for daily needs",
      "Galleria Market – open-air shopping and cafes",
      "Ardee Mall & Gold Souk Mall – compact mall options",
    ],
    notes:
      "Sector 45 offers fast access to both Medanta and Fortis while staying within a short metro or cab ride from Delhi and airport connections.",
  },
];

const ncrPlaces = [
  "Ambience Mall, Gurgaon – indoor walks, cafes, cinema and kids’ activities",
  "DLF CyberHub – curated dining street (ideal for attendants in evenings)",
  "Galleria Market, DLF Phase 4 – relaxed open-air market and coffee shops",
  "Aravalli Biodiversity Park – easy nature trails and bird watching",
  "Lodhi Garden, Delhi – flat walking paths and heritage monuments",
  "India Gate & Kartavya Path – iconic drive-by visit in central Delhi",
  "Humayun's Tomb – UNESCO heritage with large landscaped gardens",
  "Akshardham Temple – cultural complex with evening water shows (post-recovery)",
];

export default function HospitalsTourismSection() {
  return (
    <section id="hospitals" className="py-16 lg:py-24 bg-muted/40">
      <div className="max-w-page">
        <div className="text-center mb-12">
          <h2 className="text-foreground mb-3">Hospitals and Nearby Visiting Places</h2>
          <p className="text-muted-foreground max-w-3xl mx-auto">
            Curated for medical travelers staying in Gurgaon Sectors 57, 39, and 45. Includes nearby hospitals,
            metro links, parks, and safe light-outing options across Delhi NCR.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {hubs.map((hub) => (
            <Card key={hub.sector} className="overflow-hidden border-0 shadow-card hover:shadow-card-hover transition-all duration-200">
              <img src={hub.image} alt={`${hub.sector} hospital area`} className="h-44 w-full object-cover" loading="lazy" />
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-foreground">{hub.sector}</h3>
                  <Badge variant="secondary">{hub.highlight}</Badge>
                </div>

                <div>
                  <p className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    Best nearby hospitals
                  </p>
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    {hub.hospitals.map((item) => (
                      <li key={item} className="flex gap-2">
                        <MapPin className="h-4 w-4 mt-0.5 text-primary/80 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Train className="h-4 w-4 text-primary" />
                    Nearest metro connectivity
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {hub.metros.map((m) => (
                      <Badge key={m} variant="outline" className="bg-background">
                        {m}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Trees className="h-4 w-4 text-primary" />
                    Nearby parks
                  </p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {hub.parks.map((p) => (
                      <li key={p}>- {p}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-primary" />
                    Recovery-friendly visiting places
                  </p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {hub.visits.map((v) => (
                      <li key={v}>- {v}</li>
                    ))}
                  </ul>
                </div>

                {hub.notes && (
                  <p className="text-xs text-muted-foreground border-t border-border/60 pt-3 mt-1 leading-relaxed">
                    {hub.notes}
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>

        <Card className="mt-10 border-0 shadow-card p-6 lg:p-8">
          <div className="flex items-start gap-3 mb-4">
            <Navigation className="h-5 w-5 text-primary mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-foreground">Top Delhi NCR add-on visits for attendants</h3>
              <p className="text-sm text-muted-foreground">
                Designed for low-strain, half-day plans that fit between consultations or lighter recovery days. Always confirm
                with the treating doctor before planning an outing.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-muted-foreground">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <ShoppingBag className="h-4 w-4 text-primary" />
                Light shopping & cafes
              </div>
              {ncrPlaces.slice(0, 3).map((place) => (
                <div key={place} className="rounded-md bg-muted/60 px-3 py-2">
                  {place}
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <Trees className="h-4 w-4 text-primary" />
                Green, open spaces
              </div>
              {ncrPlaces.slice(3, 5).map((place) => (
                <div key={place} className="rounded-md bg-muted/60 px-3 py-2">
                  {place}
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <Utensils className="h-4 w-4 text-primary" />
                Culture & heritage evenings
              </div>
              {ncrPlaces.slice(5).map((place) => (
                <div key={place} className="rounded-md bg-muted/60 px-3 py-2">
                  {place}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
