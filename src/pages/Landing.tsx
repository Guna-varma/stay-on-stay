import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { I18nProvider } from "@/lib/i18n";
import LandingHeader from "@/components/landing/LandingHeader";
import HeroSearch from "@/components/landing/HeroSearch";
import TrustBar from "@/components/landing/TrustBar";
import { HotelSearchSection } from "@/components/HotelSearchSection";
import PatientJourneySection from "@/components/landing/PatientJourneySection";
import MedTourismStrip from "@/components/landing/MedTourismStrip";
import ServicesSection from "@/components/landing/ServicesSection";
import CareTeamSection from "@/components/landing/CareTeamSection";
import PackagesPricingSection from "@/components/landing/PackagesPricingSection";
import Testimonials from "@/components/landing/Testimonials";
import LandingCtaBanner from "@/components/landing/LandingCtaBanner";
import LandingContactSection from "@/components/landing/LandingContactSection";
import FloatingWhatsApp from "@/components/landing/FloatingWhatsApp";
import LandingFooter from "@/components/landing/LandingFooter";

function LandingMain() {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className="min-h-screen bg-background pb-24 lg:pb-28"
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <LandingHeader />
      <HeroSearch />
      <HotelSearchSection sectionId="hotels" />
      <TrustBar />
      <ServicesSection />
      <CareTeamSection />
      <PatientJourneySection />
      <MedTourismStrip />
      <PackagesPricingSection />
      <Testimonials />
      <LandingCtaBanner />
      <LandingContactSection />
      <LandingFooter />
      <FloatingWhatsApp />
    </motion.div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const location = useLocation();

  // OAuth callback with tokens in hash: Supabase may redirect to Site URL (/) instead of /login; send to /login so session is restored and user is routed correctly
  useEffect(() => {
    if (window.location.pathname === "/" && window.location.hash.includes("access_token")) {
      window.location.replace(`/login${window.location.hash}`);
      return;
    }
  }, []);

  // OAuth state expired: Supabase redirects to site URL with error params; send user to login with a clear message
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("error_code");
    const desc = params.get("error_description") ?? "";
    if (code === "bad_oauth_state" || (params.get("error") === "invalid_request" && desc.toLowerCase().includes("state"))) {
      navigate("/login?oauth_error=state_expired", { replace: true });
    }
  }, [navigate]);

  // Scroll to section when navigating from another page with a hash (e.g. /#hotels)
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

  // When logged in, show landing with authenticated header (no redirect so / shows username + role)
  return (
    <LandingMain />
  );
}
