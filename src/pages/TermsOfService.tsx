import { I18nProvider } from "@/lib/i18n";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";
import { Card } from "@/components/ui/card";

export default function TermsOfService() {
  return (
    <I18nProvider>
      <div className="min-h-screen bg-background">
        <LandingHeader />
        <main className="py-12 lg:py-16">
          <div className="max-w-page space-y-8">
            <div className="max-w-3xl">
              <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-3">Terms of Service</h1>
              <p className="text-muted-foreground leading-relaxed">
                These terms outline how you can use the StayOnStay platform as a guest, attendant, or partner.
              </p>
            </div>

            <Card className="p-6 shadow-card border-0 space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>
                StayOnStay connects guests with accommodation and service partners but does not itself provide medical
                treatment. Hospital care remains the responsibility of your chosen healthcare provider, and hotel
                services remain the responsibility of the property you book.
              </p>
              <p>
                When you confirm a booking, you agree to the specific cancellation, payment, and house rules shown at
                checkout. You are also responsible for sharing accurate guest information so that we and our partners
                can support your stay safely and efficiently.
              </p>
              <p>
                For a real-world go-live, please replace this summary with a full legal document reviewed by your
                counsel, including governing law, dispute resolution, and emergency disclaimers.
              </p>
            </Card>
          </div>
        </main>
        <LandingFooter />
      </div>
    </I18nProvider>
  );
}

