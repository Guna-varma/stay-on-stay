import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { I18nProvider } from "@/lib/i18n";
import LandingHeader from "@/components/landing/LandingHeader";
import HeroSearch from "@/components/landing/HeroSearch";
import FeaturedHotels from "@/components/landing/FeaturedHotels";
import HowItWorks from "@/components/landing/HowItWorks";
import ServicesSection from "@/components/landing/ServicesSection";
import Testimonials from "@/components/landing/Testimonials";
import LandingFooter from "@/components/landing/LandingFooter";

export default function Landing() {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <I18nProvider>
      <div className="min-h-screen bg-background">
        <LandingHeader />
        <HeroSearch />
        <FeaturedHotels />
        <HowItWorks />
        <ServicesSection />
        <Testimonials />
        <LandingFooter />
      </div>
    </I18nProvider>
  );
}
