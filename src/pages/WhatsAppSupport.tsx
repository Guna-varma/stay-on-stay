import { I18nProvider } from "@/lib/i18n";
import { WHATSAPP_RW_NUMBER } from "@/lib/whatsappContact";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function WhatsAppSupport() {
  return (
    <I18nProvider>
      <div className="min-h-screen bg-background">
        <LandingHeader />
        <main className="py-12 lg:py-16">
          <div className="max-w-page space-y-6">
            <h1 className="text-3xl md:text-4xl font-semibold text-foreground">WhatsApp Support</h1>
            <Card className="p-6 border-0 shadow-card space-y-3">
              <p className="text-sm text-muted-foreground">
                Chat directly with a care guide for hospital-side stays, airport pickup, and recovery support.
              </p>
              <Button asChild>
                <a href={`https://wa.me/${WHATSAPP_RW_NUMBER}`} target="_blank" rel="noopener noreferrer">
                  Open WhatsApp Chat
                </a>
              </Button>
            </Card>
          </div>
        </main>
        <LandingFooter />
      </div>
    </I18nProvider>
  );
}

