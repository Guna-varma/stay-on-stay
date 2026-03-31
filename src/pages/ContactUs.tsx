import { I18nProvider } from "@/lib/i18n";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";
import { Card } from "@/components/ui/card";

export default function ContactUs() {
  return (
    <I18nProvider>
      <div className="min-h-screen bg-background">
        <LandingHeader />
        <main className="py-12 lg:py-16">
          <div className="max-w-page space-y-6">
            <h1 className="text-3xl md:text-4xl font-semibold text-foreground">Contact Us</h1>
            <Card className="p-6 border-0 shadow-card space-y-2">
              <p className="text-sm text-muted-foreground">
                Reach our guest support team for booking, stay, or medical-travel assistance.
              </p>
              <p className="text-sm text-foreground">
                Email: <a href="mailto:support@stayonstay.com" className="text-primary hover:underline">support@stayonstay.com</a>
              </p>
              <p className="text-sm text-foreground">Phone: +91 99999 99999</p>
            </Card>
          </div>
        </main>
        <LandingFooter />
      </div>
    </I18nProvider>
  );
}

