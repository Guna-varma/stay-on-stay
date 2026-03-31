import { I18nProvider } from "@/lib/i18n";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";
import { Card } from "@/components/ui/card";

export default function HelpCenter() {
  return (
    <I18nProvider>
      <div className="min-h-screen bg-background">
        <LandingHeader />
        <main className="py-12 lg:py-16">
          <div className="max-w-page space-y-6">
            <h1 className="text-3xl md:text-4xl font-semibold text-foreground">Help Center</h1>
            <Card className="p-6 border-0 shadow-card space-y-2">
              <h2 className="text-lg font-semibold text-foreground">Common support topics</h2>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>- Booking changes and cancellation policy</li>
                <li>- Airport pickup and transfer timing</li>
                <li>- Long-stay hotel discount plans</li>
                <li>- Check-in documents for international guests</li>
              </ul>
            </Card>
          </div>
        </main>
        <LandingFooter />
      </div>
    </I18nProvider>
  );
}

