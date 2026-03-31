import { I18nProvider } from "@/lib/i18n";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";
import { Card } from "@/components/ui/card";

export default function Careers() {
  return (
    <I18nProvider>
      <div className="min-h-screen bg-background">
        <LandingHeader />
        <main className="py-12 lg:py-16">
          <div className="max-w-page space-y-8">
            <div className="max-w-3xl">
              <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-3">Careers</h1>
              <p className="text-muted-foreground leading-relaxed">
                We&apos;re building a hospitality layer around hospitals. If you care about patient experience,
                operations, and thoughtful technology, StayOnStay is a place to do meaningful work.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6 shadow-card border-0">
                <h2 className="text-lg font-semibold text-foreground mb-2">Medical concierge &amp; operations</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Roles across guest experience, on-ground coordination, and partner onboarding in Gurgaon and Delhi
                  NCR.
                </p>
              </Card>
              <Card className="p-6 shadow-card border-0">
                <h2 className="text-lg font-semibold text-foreground mb-2">Product &amp; engineering</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Help us improve booking flows, pricing intelligence, and dashboards for hospital and hotel partners.
                </p>
              </Card>
            </div>

            <Card className="p-6 shadow-card border-0">
              <h2 className="text-lg font-semibold text-foreground mb-2">How to reach us</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                For current openings, write to our hiring inbox with your resume, the role you&apos;re interested in,
                and a brief note on why medical travel matters to you.
              </p>
            </Card>
          </div>
        </main>
        <LandingFooter />
      </div>
    </I18nProvider>
  );
}

