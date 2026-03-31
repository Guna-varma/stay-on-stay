import { I18nProvider } from "@/lib/i18n";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";
import { Card } from "@/components/ui/card";

export default function PrivacyPolicy() {
  return (
    <I18nProvider>
      <div className="min-h-screen bg-background">
        <LandingHeader />
        <main className="py-12 lg:py-16">
          <div className="max-w-page space-y-8">
            <div className="max-w-3xl">
              <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-3">Privacy Policy</h1>
              <p className="text-muted-foreground leading-relaxed">
                This page describes how StayOnStay handles the personal information you share with us as a guest, a
                caregiver, or a partner.
              </p>
            </div>

            <Card className="p-6 shadow-card border-0 space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>
                We collect only the information required to manage your bookings, payments, and communication with
                partner properties and hospitals. Typical data includes contact details, stay preferences, and basic
                medical context that you voluntarily share to help us tailor your experience.
              </p>
              <p>
                We do not sell your personal information. Access to data is limited to authorised team members and
                vetted partners who need it to fulfil your booking or provide support. You can request corrections or
                deletion of your data wherever local regulations permit.
              </p>
              <p>
                For a production launch, this document should be reviewed with your legal adviser and updated with
                jurisdiction-specific obligations (for example, data retention periods and cross-border transfers).
              </p>
            </Card>
          </div>
        </main>
        <LandingFooter />
      </div>
    </I18nProvider>
  );
}

