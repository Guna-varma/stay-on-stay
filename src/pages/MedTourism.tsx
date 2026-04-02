import { I18nProvider } from "@/lib/i18n";
import LandingHeader from "@/components/landing/LandingHeader";
import { MedicalTourismSection } from "@/components/landing/MedicalTourismSection";
import HospitalsTourismSection from "@/components/landing/HospitalsTourismSection";
import LandingFooter from "@/components/landing/LandingFooter";

/** Medical tourism marketing content — standalone route (not embedded on home). */
export default function MedTourism() {
  return (
    <I18nProvider>
      <div className="min-h-screen bg-background">
        <LandingHeader />
        <MedicalTourismSection />
        <HospitalsTourismSection />
        <LandingFooter />
      </div>
    </I18nProvider>
  );
}
