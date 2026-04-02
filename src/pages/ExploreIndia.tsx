import { I18nProvider } from "@/lib/i18n";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";
import FloatingWhatsApp from "@/components/landing/FloatingWhatsApp";
import ExploreIndiaView from "@/components/explore-india/ExploreIndiaView";

/** Image-first “Visit India” inspiration page — optional joy between medical appointments. */
export default function ExploreIndia() {
  return (
    <I18nProvider>
      <div className="min-h-screen bg-background pb-24 lg:pb-28">
        <LandingHeader />
        <ExploreIndiaView />
        <LandingFooter />
        <FloatingWhatsApp />
      </div>
    </I18nProvider>
  );
}
