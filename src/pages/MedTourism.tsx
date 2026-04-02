import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { I18nProvider } from "@/lib/i18n";
import LandingHeader from "@/components/landing/LandingHeader";
import { MedicalTourismSection } from "@/components/landing/MedicalTourismSection";
import HospitalsTourismSection from "@/components/landing/HospitalsTourismSection";
import LandingFooter from "@/components/landing/LandingFooter";

/** Medical tourism marketing content — standalone route (not embedded on home). */
export default function MedTourism() {
  const location = useLocation();

  useEffect(() => {
    const hash = location.hash;
    if (!hash) return;
    const id = hash.slice(1);
    if (!id) return;
    const t = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
    return () => window.clearTimeout(t);
  }, [location.hash, location.pathname]);

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
