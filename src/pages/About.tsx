import { I18nProvider } from "@/lib/i18n";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";
import { Card } from "@/components/ui/card";

export default function About() {
  return (
    <I18nProvider>
      <div className="min-h-screen bg-background">
        <LandingHeader />
        <main className="py-12 lg:py-16">
          <div className="max-w-page space-y-8">
            <div className="max-w-3xl">
              <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-3">About StayOnStay</h1>
              <p className="text-muted-foreground leading-relaxed">
                StayOnStay is built for patients and families who travel for treatment. We focus on clean, safe hotels
                close to hospitals, clear pricing, and reliable ground support so that medical trips feel less stressful
                and more human.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 shadow-card border-0">
                <h2 className="text-lg font-semibold text-foreground mb-2">Hospital-first locations</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We map properties around major hospitals in Gurgaon and Delhi NCR, prioritising walking distance,
                  short cab rides, and safe access at late hours.
                </p>
              </Card>
              <Card className="p-6 shadow-card border-0">
                <h2 className="text-lg font-semibold text-foreground mb-2">Medical traveller services</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  From airport pickup and language support to extended-stay pricing, we design every touchpoint for
                  cross-city and international patients.
                </p>
              </Card>
              <Card className="p-6 shadow-card border-0">
                <h2 className="text-lg font-semibold text-foreground mb-2">Partner ecosystem</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We work with hospitals, hotels, and local transport partners who understand medical sensitivity and
                  commit to responsive, compassionate service.
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

