import { I18nProvider } from "@/lib/i18n";
import LandingHeader from "@/components/landing/LandingHeader";
import { MedicalTourismSection } from "@/components/landing/MedicalTourismSection";
import LandingFooter from "@/components/landing/LandingFooter";

/** Medical tourism marketing content — standalone route (not embedded on home). */
export default function MedTourism() {
  return (
    <I18nProvider>
      <div className="min-h-screen bg-background">
        <LandingHeader />
        <MedicalTourismSection />
        <LandingFooter />
      </div>
    </I18nProvider>
  );
}
