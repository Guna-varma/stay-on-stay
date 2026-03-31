import { I18nProvider } from "@/lib/i18n";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";
import { Card } from "@/components/ui/card";

export default function Partners() {
  return (
    <I18nProvider>
      <div className="min-h-screen bg-background">
        <LandingHeader />
        <main className="py-12 lg:py-16">
          <div className="max-w-page space-y-8">
            <div className="max-w-3xl">
              <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-3">Partner with StayOnStay</h1>
              <p className="text-muted-foreground leading-relaxed">
                We collaborate with hospitals, hotel operators, and service providers who want to offer predictable,
                caring experiences to medical travellers and their families.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 shadow-card border-0">
                <h2 className="text-lg font-semibold text-foreground mb-2">Hospitals</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Offer curated stay recommendations around your campus, bundled services, and clear communication with
                  patient families.
                </p>
              </Card>
              <Card className="p-6 shadow-card border-0">
                <h2 className="text-lg font-semibold text-foreground mb-2">Hotels &amp; residences</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Join a network of properties that specialise in early check-ins, flexible meal plans, and recovery
                  friendly rooms.
                </p>
              </Card>
              <Card className="p-6 shadow-card border-0">
                <h2 className="text-lg font-semibold text-foreground mb-2">Transport &amp; support</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Work with us on airport transfers, local cabs, translation, and on-ground assistance for guests.
                </p>
              </Card>
            </div>
          </div>
        </main>
        <LandingFooter />
      </div>
    </I18nProvider>
  );
}

