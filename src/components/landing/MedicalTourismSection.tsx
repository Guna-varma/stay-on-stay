import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import {
  ArrowRight,
  Shield,
  MessageCircle,
  Plane,
  Hotel,
  Car,
  Stethoscope,
  Globe,
  MessageSquare,
  ListChecks,
  CalendarCheck,
  HeartPulse,
  Camera,
  Home,
  Smile,
  Eye,
  Bone,
  Baby,
  Brain,
  MapPin,
  Star,
  BadgeCheck,
  Headphones,
  Building2,
  PlaneTakeoff,
  Quote,
} from "lucide-react";
import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  VIEWER_LOCALE_LINES,
  LANGUAGE_OPTIONS,
  type RegionCode,
  useI18n,
} from "@/lib/i18n";
import { useMtText } from "@/lib/medTourismText";
import { WHATSAPP_RW_NUMBER } from "@/lib/whatsappContact";
import { WhyIndiaScreens } from "@/components/landing/WhyIndiaScreens";

const HERO_IMG =
  "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&q=80&auto=format&fit=crop";

const sectionPad = "py-20 md:py-28 px-4 sm:px-6 lg:px-8";
const glass =
  "rounded-2xl border border-border/40 bg-card/70 backdrop-blur-xl shadow-elevated";
const glassHover = cn(glass, "transition-shadow duration-300 hover:shadow-premium");

/* —— Why travel —— */
const whyServices = [
  { icon: Plane, title: "Help with flights", desc: "We help you pick flights and dates that fit your treatment." },
  { icon: Hotel, title: "Hotel booking", desc: "We book hotels near your hospital. Good price. We do all booking." },
  { icon: Car, title: "Airport pickup & drop", desc: "Our helper meets you at the airport and drives you to your hotel." },
  { icon: Stethoscope, title: "Hospital help", desc: "We book doctor visits and help you talk to your hospital team." },
  { icon: Globe, title: "Safe trip home", desc: "We help you plan going home and care after treatment." },
];

/* —— Journey —— */
const journeySteps = [
  { icon: MessageSquare, title: "Tell us your problem", desc: "Tell us what you need. We listen." },
  { icon: ListChecks, title: "Get hospitals and prices", desc: "We send hospital names and clear prices." },
  { icon: CalendarCheck, title: "We plan travel and stay", desc: "Flights, hotel, visa help — we fix it for you." },
  { icon: Plane, title: "You fly to India", desc: "You land in India. Our helper meets you at the airport." },
  { icon: HeartPulse, title: "Treatment and rest", desc: "Good treatment. Help by phone 24 hours a day." },
  { icon: Camera, title: "Visit India (optional)", desc: "You can see places in India while you rest, if you want." },
  { icon: Home, title: "Your trip home", desc: "We help you go home and get follow-up care." },
];

/* —— Treatments —— */
const treatments = [
  { icon: Stethoscope, name: "Heart surgery", price: "From $6,000", tag: "Popular in Africa", badge: "High Success Rate" },
  { icon: Smile, name: "Dental implants", price: "From $800", tag: null, badge: null },
  { icon: Eye, name: "LASIK eye surgery", price: "From $1,200", tag: null, badge: "High Success Rate" },
  { icon: Bone, name: "Bone and joint surgery", price: "From $5,500", tag: "Popular in Africa", badge: null },
  { icon: Baby, name: "Fertility / IVF", price: "From $3,500", tag: "Popular in Africa", badge: null },
  { icon: Brain, name: "Brain and nerve surgery", price: "From $8,000", tag: null, badge: "High Success Rate" },
];

/* —— Hospitals —— */
/** Gurugram (Gurgaon) only — major tertiary hospitals physically in the city */
const partnerHospitals = [
  { name: "Artemis Hospital", location: "Sector 51, Gurgaon, India", rating: 4.8, specialty: "Multi-Specialty", accreditation: "JCI" },
  { name: "Fortis Memorial Research Institute", location: "Sector 44, Gurgaon, India", rating: 4.8, specialty: "Oncology & Transplants", accreditation: "JCI" },
  { name: "Medanta – The Medicity", location: "Sector 38, Gurgaon, India", rating: 4.9, specialty: "Cardiac & Neurology", accreditation: "JCI" },
  { name: "Paras Hospital", location: "Sector 43, Gurgaon, India", rating: 4.6, specialty: "Multi-Specialty", accreditation: "NABH" },
];

type Country =
  | "nigeria"
  | "kenya"
  | "ghana"
  | "south-africa"
  | "rwanda"
  | "congo"
  | "somalia"
  | "uganda"
  | "angola"
  | "ethiopia";

type DisplayCurrency = "usd" | "inr";

interface CountryMeta {
  id: Country;
  code: string;
  label: string;
  flagUrl: string;
  localCurrencyCode: string;
  localCurrencySymbol: string;
  usdToLocal: number;
}

/** Aligns pricing country rows with header region lines (same copy as LanguageSwitcher) */
const countryToRegionCode: Record<Country, RegionCode> = {
  nigeria: "ng",
  kenya: "ke",
  ghana: "gh",
  "south-africa": "za",
  rwanda: "rw",
  congo: "cd",
  somalia: "so",
  uganda: "ug",
  angola: "ao",
  ethiopia: "et",
};

const countries: CountryMeta[] = [
  { id: "nigeria", code: "NG", label: "Nigeria", flagUrl: "https://flagcdn.com/w40/ng.png", localCurrencyCode: "NGN", localCurrencySymbol: "₦", usdToLocal: 1550 },
  { id: "kenya", code: "KE", label: "Kenya", flagUrl: "https://flagcdn.com/w40/ke.png", localCurrencyCode: "KES", localCurrencySymbol: "KSh", usdToLocal: 129 },
  { id: "ghana", code: "GH", label: "Ghana", flagUrl: "https://flagcdn.com/w40/gh.png", localCurrencyCode: "GHS", localCurrencySymbol: "₵", usdToLocal: 15.5 },
  { id: "south-africa", code: "ZA", label: "South Africa", flagUrl: "https://flagcdn.com/w40/za.png", localCurrencyCode: "ZAR", localCurrencySymbol: "R", usdToLocal: 18.3 },
  { id: "rwanda", code: "RW", label: "Rwanda", flagUrl: "https://flagcdn.com/w40/rw.png", localCurrencyCode: "RWF", localCurrencySymbol: "RWF", usdToLocal: 1310 },
  { id: "congo", code: "CD", label: "Congo", flagUrl: "https://flagcdn.com/w40/cd.png", localCurrencyCode: "CDF", localCurrencySymbol: "CDF", usdToLocal: 2800 },
  { id: "somalia", code: "SO", label: "Somalia", flagUrl: "https://flagcdn.com/w40/so.png", localCurrencyCode: "SOS", localCurrencySymbol: "SOS", usdToLocal: 570 },
  { id: "uganda", code: "UG", label: "Uganda", flagUrl: "https://flagcdn.com/w40/ug.png", localCurrencyCode: "UGX", localCurrencySymbol: "UGX", usdToLocal: 3750 },
  { id: "angola", code: "AO", label: "Angola", flagUrl: "https://flagcdn.com/w40/ao.png", localCurrencyCode: "AOA", localCurrencySymbol: "Kz", usdToLocal: 860 },
  { id: "ethiopia", code: "ET", label: "Ethiopia", flagUrl: "https://flagcdn.com/w40/et.png", localCurrencyCode: "ETB", localCurrencySymbol: "Br", usdToLocal: 57 },
];

const costData: Record<Country, { procedure: string; localUsd: number; indiaUsd: number }[]> = {
  nigeria: [
    { procedure: "Heart Bypass", localUsd: 18000, indiaUsd: 5500 },
    { procedure: "Hip Replacement", localUsd: 12000, indiaUsd: 6000 },
    { procedure: "Dental Implants", localUsd: 3000, indiaUsd: 800 },
    { procedure: "Fertility / IVF", localUsd: 8000, indiaUsd: 3500 },
  ],
  kenya: [
    { procedure: "Heart Bypass", localUsd: 16000, indiaUsd: 5500 },
    { procedure: "Hip Replacement", localUsd: 10500, indiaUsd: 6000 },
    { procedure: "Dental Implants", localUsd: 2600, indiaUsd: 800 },
    { procedure: "Fertility / IVF", localUsd: 7200, indiaUsd: 3500 },
  ],
  ghana: [
    { procedure: "Heart Bypass", localUsd: 16500, indiaUsd: 5500 },
    { procedure: "Hip Replacement", localUsd: 11200, indiaUsd: 6000 },
    { procedure: "Dental Implants", localUsd: 2800, indiaUsd: 800 },
    { procedure: "Fertility / IVF", localUsd: 7600, indiaUsd: 3500 },
  ],
  "south-africa": [
    { procedure: "Heart Bypass", localUsd: 25000, indiaUsd: 5500 },
    { procedure: "Hip Replacement", localUsd: 15000, indiaUsd: 6000 },
    { procedure: "Dental Implants", localUsd: 4000, indiaUsd: 800 },
    { procedure: "Fertility / IVF", localUsd: 10000, indiaUsd: 3500 },
  ],
  rwanda: [
    { procedure: "Heart Bypass", localUsd: 14200, indiaUsd: 5500 },
    { procedure: "Hip Replacement", localUsd: 9400, indiaUsd: 6000 },
    { procedure: "Dental Implants", localUsd: 2100, indiaUsd: 800 },
    { procedure: "Fertility / IVF", localUsd: 6700, indiaUsd: 3500 },
  ],
  congo: [
    { procedure: "Heart Bypass", localUsd: 17200, indiaUsd: 5500 },
    { procedure: "Hip Replacement", localUsd: 11600, indiaUsd: 6000 },
    { procedure: "Dental Implants", localUsd: 2900, indiaUsd: 800 },
    { procedure: "Fertility / IVF", localUsd: 7800, indiaUsd: 3500 },
  ],
  somalia: [
    { procedure: "Heart Bypass", localUsd: 14800, indiaUsd: 5500 },
    { procedure: "Hip Replacement", localUsd: 9800, indiaUsd: 6000 },
    { procedure: "Dental Implants", localUsd: 2300, indiaUsd: 800 },
    { procedure: "Fertility / IVF", localUsd: 6900, indiaUsd: 3500 },
  ],
  uganda: [
    { procedure: "Heart Bypass", localUsd: 15200, indiaUsd: 5500 },
    { procedure: "Hip Replacement", localUsd: 10100, indiaUsd: 6000 },
    { procedure: "Dental Implants", localUsd: 2400, indiaUsd: 800 },
    { procedure: "Fertility / IVF", localUsd: 7000, indiaUsd: 3500 },
  ],
  angola: [
    { procedure: "Heart Bypass", localUsd: 18500, indiaUsd: 5500 },
    { procedure: "Hip Replacement", localUsd: 12400, indiaUsd: 6000 },
    { procedure: "Dental Implants", localUsd: 3200, indiaUsd: 800 },
    { procedure: "Fertility / IVF", localUsd: 8300, indiaUsd: 3500 },
  ],
  ethiopia: [
    { procedure: "Heart Bypass", localUsd: 14600, indiaUsd: 5500 },
    { procedure: "Hip Replacement", localUsd: 9600, indiaUsd: 6000 },
    { procedure: "Dental Implants", localUsd: 2200, indiaUsd: 800 },
    { procedure: "Fertility / IVF", localUsd: 6800, indiaUsd: 3500 },
  ],
};

const safetyPoints = [
  { icon: Car, title: "Airport pickup by helper", desc: "A helper meets you when you land. No stress." },
  { icon: Headphones, title: "24/7 help on phone", desc: "Call or message us any time, day or night." },
  { icon: Building2, title: "Hospital to hotel car", desc: "Safe rides between your hotel and hospital." },
  { icon: PlaneTakeoff, title: "Plan your trip home", desc: "We help you fly home and get care after treatment." },
];

const testimonials = [
  {
    name: "Amina O.",
    location: "Lagos, Nigeria",
    flag: "🇳🇬",
    text: "I was scared to travel alone for heart surgery. StayOnStay fixed everything — pickup, hotel, translator. I felt safe.",
    rating: 5,
  },
  {
    name: "David K.",
    location: "Nairobi, Kenya",
    flag: "🇰🇪",
    text: "My hip work in India cost one-third of Nairobi price. The hospital was good. StayOnStay helped me every step.",
    rating: 5,
  },
  {
    name: "Grace A.",
    location: "Accra, Ghana",
    flag: "🇬🇭",
    text: "Everything was easy. WhatsApp chat to airport ride — someone was always there.",
    rating: 5,
  },
];

/** ISO2 + flag images (emoji flags fail on many Windows/Android setups). */
const africaFlags = [
  { code: "NG", flagUrl: "https://flagcdn.com/w80/ng.png", label: "Nigeria" as const },
  { code: "KE", flagUrl: "https://flagcdn.com/w80/ke.png", label: "Kenya" as const },
  { code: "GH", flagUrl: "https://flagcdn.com/w80/gh.png", label: "Ghana" as const },
  { code: "ZA", flagUrl: "https://flagcdn.com/w80/za.png", label: "South Africa" as const },
  { code: "UG", flagUrl: "https://flagcdn.com/w80/ug.png", label: "Uganda" as const },
  { code: "RW", flagUrl: "https://flagcdn.com/w80/rw.png", label: "Rwanda" as const },
  { code: "TZ", flagUrl: "https://flagcdn.com/w80/tz.png", label: "Tanzania" as const },
];

function AnimatedNumber({ value, inView }: { value: number; inView: boolean }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration: 1.2,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [value, inView]);

  return <>${display.toLocaleString()}</>;
}

function MTHero() {
  const tx = useMtText();
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-300, 300], [3, -3]);
  const rotateY = useTransform(mouseX, [-300, 300], [-3, 3]);
  const bgX = useTransform(mouseX, [-300, 300], [-10, 10]);
  const bgY = useTransform(mouseY, [-300, 300], [-10, 10]);

  const handleMouse = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  return (
    <section
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={() => {
        mouseX.set(0);
        mouseY.set(0);
      }}
      className="relative min-h-[min(100vh,920px)] flex items-center overflow-hidden bg-gradient-to-br from-muted/90 via-background to-muted/50"
    >
      <motion.div style={{ x: bgX, y: bgY }} className="absolute top-20 right-10 w-72 h-72 rounded-full bg-primary/5 blur-3xl" />
      <div className="max-w-page mx-auto w-full grid md:grid-cols-2 gap-12 items-center relative z-10 px-4 sm:px-6 lg:px-8 py-12">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex flex-wrap items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full mb-6"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{tx("Trusted by patients across Africa")}</span>
            <span className="inline-flex items-center rounded-full bg-primary/15 border border-primary/20 px-2 py-1">
              <img src="https://flagcdn.com/w20/ng.png" alt="Nigeria flag" className="h-3.5 w-5 rounded-[2px]" loading="lazy" />
            </span>
            <span className="inline-flex items-center rounded-full bg-primary/15 border border-primary/20 px-2 py-1">
              <img src="https://flagcdn.com/w20/ke.png" alt="Kenya flag" className="h-3.5 w-5 rounded-[2px]" loading="lazy" />
            </span>
            <span className="inline-flex items-center rounded-full bg-primary/15 border border-primary/20 px-2 py-1">
              <img src="https://flagcdn.com/w20/gh.png" alt="Ghana flag" className="h-3.5 w-5 rounded-[2px]" loading="lazy" />
            </span>
            <span className="inline-flex items-center rounded-full bg-primary/15 border border-primary/20 px-2 py-1">
              <img src="https://flagcdn.com/w20/za.png" alt="South Africa flag" className="h-3.5 w-5 rounded-[2px]" loading="lazy" />
            </span>
          </motion.div>

          <h2 className="font-heading text-4xl md:text-5xl lg:text-[3.4rem] font-bold text-foreground leading-tight mb-6 text-balance">
            {tx("Travel to India for Affordable Treatment — ")}<span className="text-primary">{tx("We Handle Everything")}</span>
          </h2>

          <p className="text-lg text-muted-foreground max-w-2xl mb-8 leading-relaxed">
            {tx("We help from your first check to going home. Good hospitals. Easy travel. No stress.")}
          </p>

          <div className="flex flex-wrap gap-4">
            <motion.a
              href="#mt-cta"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-br from-primary to-primary/85 text-primary-foreground font-semibold px-8 py-3.5 rounded-xl inline-flex items-center gap-2 shadow-premium relative overflow-hidden"
            >
              {tx("Get My Treatment Plan")}
              <ArrowRight className="w-4 h-4" />
            </motion.a>
            <motion.a
              href={`https://wa.me/${WHATSAPP_RW_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="bg-card text-foreground font-medium px-8 py-3.5 rounded-xl border border-border shadow-sm inline-flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              {tx("Talk to a Care Guide")}
            </motion.a>
          </div>

          <p className="text-xs text-muted-foreground mt-6 max-w-md leading-relaxed italic">
            {tx("We do not give medical care here. We connect you to good hospitals and help your whole trip.")}
          </p>

          <div className="flex flex-wrap items-center gap-6 mt-6">
            <div className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">10,000+</span> {tx("people helped")}
            </div>
            <div className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">50+</span> {tx("hospitals with us")}
            </div>
            <div className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{tx("Save about 70%")}</span> {tx("on average")}
            </div>
          </div>
        </motion.div>

        <motion.div
          style={{ rotateX, rotateY, perspective: 1000 }}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="relative hidden md:block"
        >
          <div className={cn(glass, "p-3 rounded-2xl")}>
            <img
              src={HERO_IMG}
              alt={tx("Hospital in India")}
              className="w-full rounded-xl object-cover aspect-[16/10]"
              width={1200}
              height={750}
              loading="lazy"
            />
            <div className="absolute -bottom-4 -left-4 px-5 py-3 rounded-xl bg-card/90 backdrop-blur border border-border shadow-elevated">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                <span className="text-sm font-medium text-foreground">{tx("JCI approved hospital")}</span>
              </div>
            </div>
            <div className="absolute -top-3 -right-3 px-5 py-3 rounded-xl bg-card/90 backdrop-blur border border-border shadow-elevated">
                <span className="text-sm font-medium text-primary">{tx("Save up to 70%")}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function WhyTravelWithUsBlock() {
  const tx = useMtText();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className={sectionPad} ref={ref}>
      <div className="max-w-page mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-primary uppercase tracking-wider">{tx("Why Travel With Us")}</span>
          <h3 className="font-heading text-3xl md:text-4xl font-bold text-foreground mt-3 text-balance">
            {tx("We Handle Everything — So You Don't Have To")}
          </h3>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">{tx("You focus on healing. We handle the rest.")}</p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {whyServices.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.1, ease: "easeOut" }}
              whileHover={{ scale: 1.03, transition: { type: "spring", stiffness: 120, damping: 14 } }}
              className={cn(glassHover, "p-7 text-center cursor-default")}
              style={{ perspective: 800 }}
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/85 flex items-center justify-center mx-auto mb-5">
                <s.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h4 className="font-heading text-base font-semibold text-foreground mb-2">{tx(s.title)}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{tx(s.desc)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function JourneyBlock() {
  const tx = useMtText();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="mt-how-it-works" className={cn(sectionPad, "bg-muted/30")} ref={ref}>
      <div className="max-w-page mx-auto">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-center mb-16"
          >
            <span className="text-sm font-medium text-primary uppercase tracking-wider">{tx("How It Works")}</span>
            <h3 className="font-heading text-3xl md:text-4xl font-bold text-foreground mt-3">{tx("Your Journey, Step by Step")}</h3>
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto">{tx("No confusion. No stress. We guide you through every stage.")}</p>
          </motion.div>

          <div className="relative">
            <div className="absolute left-6 md:left-8 top-0 bottom-0 w-px bg-border/60" />
            <div className="space-y-1">
              {journeySteps.map((step, i) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: i * 0.1, ease: "easeOut" }}
                  className="relative flex gap-5 items-start pl-0 py-4"
                >
                  <div className="relative z-10 shrink-0">
                    <div
                      className={cn(
                        "w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center",
                        i === 0 ? "bg-gradient-to-br from-primary to-primary/85 shadow-lg" : "bg-card border border-border",
                      )}
                    >
                      <step.icon className={cn("w-5 h-5 md:w-6 md:h-6", i === 0 ? "text-primary-foreground" : "text-primary")} />
                    </div>
                    {i === 0 && <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-warning animate-pulse" />}
                  </div>
                  <div className="pt-1 md:pt-3">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-bold text-primary">{tx("Step")} {i + 1}</span>
                      {i === 0 && (
                        <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">{tx("You are here")}</span>
                      )}
                    </div>
                    <h4 className="font-heading text-base md:text-lg font-semibold text-foreground">{tx(step.title)}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed mt-1">{tx(step.desc)}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TreatmentsBlock() {
  const tx = useMtText();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="mt-treatments" className={sectionPad} ref={ref}>
      <div className="max-w-page mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-primary uppercase tracking-wider">{tx("Treatments")}</span>
          <h3 className="font-heading text-3xl md:text-4xl font-bold text-foreground mt-3">{tx("Find the right care — easy and clear")}</h3>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
            {tx("Top hospitals in India. Good care. Much less money.")}
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {treatments.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              whileHover={{ scale: 1.03, transition: { type: "spring", stiffness: 120, damping: 14 } }}
              className={cn(glassHover, "p-7 cursor-default relative group")}
              style={{ perspective: 800 }}
            >
              <div className="flex flex-wrap gap-2 absolute top-4 right-4">
                {t.tag && (
                  <span className="bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full">{tx(t.tag)}</span>
                )}
                {t.badge && (
                  <span className="bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full">{tx(t.badge)}</span>
                )}
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/15 transition-colors">
                <t.icon className="w-5 h-5 text-primary" />
              </div>
              <h4 className="font-heading text-lg font-semibold text-foreground mb-1">{tx(t.name)}</h4>
              <p className="text-primary font-semibold text-sm">{tx(t.price)}</p>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6 }}
          className="text-center text-xs text-muted-foreground mt-10 italic"
        >
          {tx("We link you to good hospitals in India. We help you plan. We do not give treatment ourselves.")}
        </motion.p>
      </div>
    </section>
  );
}

function HospitalsBlock() {
  const tx = useMtText();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="mt-partner-hospitals" className={cn(sectionPad, "bg-muted/30")} ref={ref}>
      <div className="max-w-page mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-primary uppercase tracking-wider">{tx("Partner Hospitals")}</span>
          <h3 className="font-heading text-3xl md:text-4xl font-bold text-foreground mt-3">{tx("Leading accredited hospitals in Gurugram")}</h3>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {partnerHospitals.map((h, i) => (
            <motion.div
              key={h.name}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              whileHover={{ y: -4, transition: { type: "spring", stiffness: 120, damping: 14 } }}
              className={cn(glassHover, "p-7 flex gap-5 items-start cursor-default")}
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <BadgeCheck className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-heading text-lg font-semibold text-foreground">{h.name}</h4>
                <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {h.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-warning fill-warning" />
                    {h.rating}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="bg-muted text-foreground text-xs font-medium px-3 py-1 rounded-full">{h.specialty}</span>
                  <span className="bg-primary/10 text-primary text-xs font-medium px-3 py-1 rounded-full">{h.accreditation} {tx("Accredited")}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CostComparisonBlock() {
  const tx = useMtText();
  const { language, t } = useI18n();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [selected, setSelected] = useState<Country>("nigeria");
  const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>("usd");
  const comparisons = costData[selected];
  const countryMeta = countries.find((c) => c.id === selected)!;
  const uiLang = LANGUAGE_OPTIONS.find((l) => l.code === language) ?? LANGUAGE_OPTIONS[0];
  const USD_TO_INR = 83;

  const localeLine = (countryId: Country) =>
    tx(VIEWER_LOCALE_LINES[countryToRegionCode[countryId]]);

  const formatPrimary = (usdValue: number) => {
    if (displayCurrency === "usd") return `$${usdValue.toLocaleString()}`;
    return `₹${Math.round(usdValue * USD_TO_INR).toLocaleString()}`;
  };

  const formatLocalCurrency = (usdValue: number) => {
    const localValue = usdValue * countryMeta.usdToLocal;
    return `${countryMeta.localCurrencySymbol} ${Math.round(localValue).toLocaleString()}`;
  };

  return (
    <section id="mt-pricing" className={sectionPad} ref={ref}>
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <span className="text-sm font-medium text-primary uppercase tracking-wider">{tx("Pricing")}</span>
          <h3 className="font-heading text-3xl md:text-4xl font-bold text-foreground mt-3">{tx("See How Much You Can Save")}</h3>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
            {tx("See what you pay at home vs India. Same care, lower price.")}
          </p>
        </motion.div>

        <div className="mb-6 flex flex-wrap items-center justify-center gap-2 rounded-xl border border-border/50 bg-muted/25 px-4 py-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t("lang.pageLanguage")}</span>
          <span className="flex items-center gap-2 rounded-lg bg-background/80 px-2.5 py-1 shadow-sm">
            <img src={uiLang.flagUrl} alt="" className="h-4 w-6 shrink-0 rounded-[2px]" loading="lazy" />
            <span className="text-sm font-semibold text-foreground">{t(`lang.${language}.native`)}</span>
            <span className="text-xs text-muted-foreground">({t(`lang.${language}.label`)})</span>
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <p className="text-sm text-muted-foreground">
            {tx("Selected:")} <span className="font-semibold text-foreground">{tx(countryMeta.label)}</span> · {tx("Currency:")}{" "}
            <span className="font-semibold text-foreground">{countryMeta.localCurrencyCode}</span> · {tx("Language:")}{" "}
            <span className="text-muted-foreground">{localeLine(selected)}</span>
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{tx("Display")}</span>
            <Select value={displayCurrency} onValueChange={(v) => setDisplayCurrency(v as DisplayCurrency)}>
              <SelectTrigger className="w-[120px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="usd">USD ($)</SelectItem>
                <SelectItem value="inr">INR (₹)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-10"
        >
          {countries.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelected(c.id)}
              className={cn(
                "px-3 py-2.5 rounded-xl text-left text-sm font-medium transition-all duration-200 border",
                selected === c.id
                  ? "bg-gradient-to-br from-primary to-primary/85 text-primary-foreground shadow-md border-primary/40"
                  : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/30",
              )}
            >
              <span className="flex items-center gap-2">
                <img src={c.flagUrl} alt={`${c.label} flag`} className="h-4 w-6 rounded-[2px]" loading="lazy" />
                <span className="text-xs font-semibold opacity-90">{c.code}</span>
                <span>{tx(c.label)}</span>
              </span>
              <span
                className={cn(
                  "mt-1 block text-xs",
                  selected === c.id ? "text-primary-foreground/75" : "text-muted-foreground",
                )}
              >
                {localeLine(c.id)}
              </span>
            </button>
          ))}
        </motion.div>

        <div className="space-y-4">
          {comparisons.map((c, i) => {
            const savings = Math.round(((c.localUsd - c.indiaUsd) / c.localUsd) * 100);
            return (
              <motion.div
                key={`${selected}-${displayCurrency}-${c.procedure}`}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                whileHover={{ y: -2 }}
                className={cn(glass, "p-6 flex flex-col sm:flex-row sm:items-center gap-4 transition-all duration-200 hover:shadow-premium")}
              >
                <div className="flex-1">
                  <h4 className="font-heading font-semibold text-foreground">{tx(c.procedure)}</h4>
                </div>
                <div className="flex items-center gap-6 sm:gap-10 flex-wrap">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">{tx("Local Cost")}</p>
                    <p className="font-heading font-bold text-foreground line-through opacity-50">{formatPrimary(c.localUsd)}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{countryMeta.localCurrencyCode}: {formatLocalCurrency(c.localUsd)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">{tx("India")}</p>
                    <p className="font-heading font-bold text-primary text-lg">{formatPrimary(c.indiaUsd)}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {countryMeta.localCurrencyCode}: {formatLocalCurrency(c.indiaUsd)}
                    </p>
                  </div>
                  <div
                    title={tx("About how much you save vs paying at home")}
                    className="bg-primary/10 text-primary text-sm font-bold px-4 py-1.5 rounded-full"
                  >
                    {savings}% {tx("savings")}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function WhyIndiaBlock() {
  return <WhyIndiaScreens />;
}

function SafetyCareBlock() {
  const tx = useMtText();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className={sectionPad} ref={ref}>
      <div className="max-w-page mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-primary uppercase tracking-wider">{tx("Safety & Care")}</span>
          <h3 className="font-heading text-3xl md:text-4xl font-bold text-foreground mt-3 text-balance">
            {tx("From airport to getting well — we stay with you")}
          </h3>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {safetyPoints.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.12 }}
              whileHover={{ y: -4, transition: { type: "spring", stiffness: 120, damping: 14 } }}
              className={cn(glassHover, "p-8 text-center cursor-default")}
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-warning to-orange-600 flex items-center justify-center mx-auto mb-5">
                <p.icon className="w-6 h-6 text-warning-foreground" />
              </div>
              <h4 className="font-heading text-base font-semibold text-foreground mb-2">{tx(p.title)}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{tx(p.desc)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsBlock() {
  const tx = useMtText();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="mt-testimonials" className={cn(sectionPad, "bg-muted/30")} ref={ref}>
      <div className="max-w-page mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-primary uppercase tracking-wider">{tx("Testimonials")}</span>
          <h3 className="font-heading text-3xl md:text-4xl font-bold text-foreground mt-3">{tx("Stories from people in Africa")}</h3>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.15 }}
              className={cn(glass, "p-8 relative")}
            >
              <Quote className="w-8 h-8 text-primary/15 absolute top-6 right-6" />
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 text-warning fill-warning" />
                ))}
              </div>
              <p className="text-foreground/80 leading-relaxed mb-6 text-sm">{tx(t.text)}</p>
              <div>
                <p className="font-heading font-semibold text-foreground text-sm">
                  {t.flag} {t.name}
                </p>
                <p className="text-xs text-muted-foreground">{t.location}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AfricaTrustBlock() {
  const tx = useMtText();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="mt-for-africa" className={sectionPad} ref={ref}>
      <div className="max-w-page mx-auto max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <span className="text-sm font-medium text-primary uppercase tracking-wider">{tx("For Africa")}</span>
          <h3 className="font-heading text-3xl md:text-4xl font-bold text-foreground mt-3">{tx("People across Africa trust us")}</h3>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
            {tx("We help people in many countries. WhatsApp in your language. Clear advice for your area.")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-6 mt-12"
        >
          {africaFlags.map((f, i) => (
            <motion.div
              key={f.code}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.3, delay: 0.3 + i * 0.08 }}
              className="flex flex-col items-center gap-2 min-w-[4.75rem] sm:min-w-[5.5rem]"
            >
              <img
                src={f.flagUrl}
                alt={tx(f.label)}
                width={64}
                height={43}
                className="h-9 w-14 sm:h-11 sm:w-[4.5rem] rounded-[3px] object-cover shadow-md border border-border/60 bg-muted/30"
                loading="lazy"
                decoding="async"
              />
              <span className="text-sm sm:text-base font-semibold text-foreground text-center leading-tight px-0.5 max-w-[6.5rem]">
                {tx(f.label)}
              </span>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.5 }}
          className={cn(glass, "mt-12 p-8 inline-flex flex-col sm:flex-row items-center gap-4 mx-auto")}
        >
          <MessageCircle className="w-8 h-8 text-green-600 shrink-0" />
          <div className="text-left">
            <p className="font-heading font-semibold text-foreground">{tx("Reach us on WhatsApp")}</p>
            <p className="text-sm text-muted-foreground">{tx("Get instant support from a care guide in your region.")}</p>
          </div>
          <a
            href={`https://wa.me/${WHATSAPP_RW_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 bg-green-600 text-white font-medium text-sm px-6 py-2.5 rounded-xl hover:bg-green-700 transition-colors"
          >
            {tx("Chat Now")}
          </a>
        </motion.div>
      </div>
    </section>
  );
}

function CTABlock() {
  const tx = useMtText();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="mt-cta" className={sectionPad} ref={ref}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
        className="max-w-page mx-auto max-w-4xl bg-gradient-to-br from-primary to-primary/85 rounded-3xl p-10 md:p-16 text-center relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-foreground/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-foreground/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <h3 className="font-heading text-3xl md:text-4xl font-bold text-primary-foreground mb-4 text-balance">
            {tx("Ready to Start Your Healing Journey?")}
          </h3>
          <p className="text-primary-foreground/80 max-w-lg mx-auto mb-4 leading-relaxed">
            {tx("Talk to a Care Guide — we'll plan your entire trip for free.")}
          </p>
          <p className="text-primary-foreground/60 text-sm mb-8 italic">{tx("You focus on healing. We handle the rest.")}</p>

          <div className="flex flex-wrap justify-center gap-4">
            <motion.a
              href="#medical-tourism"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="bg-primary-foreground text-primary font-semibold px-8 py-3.5 rounded-xl inline-flex items-center gap-2 shadow-lg"
            >
              {tx("Get My Treatment Plan")}
              <ArrowRight className="w-4 h-4" />
            </motion.a>
            <motion.a
              href={`https://wa.me/${WHATSAPP_RW_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="border-2 border-primary-foreground/30 text-primary-foreground font-medium px-8 py-3.5 rounded-xl inline-flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              {tx("Chat on WhatsApp")}
            </motion.a>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

/** Full medical tourism landing content (ported from gentle-guide-motion). */
export function MedicalTourismSection() {
  return (
    <div id="medical-tourism" className="scroll-mt-24 border-t border-border bg-background">
      <MTHero />
      <WhyTravelWithUsBlock />
      <JourneyBlock />
      <TreatmentsBlock />
      <HospitalsBlock />
      <CostComparisonBlock />
      <WhyIndiaBlock />
      <SafetyCareBlock />
      <TestimonialsBlock />
      <AfricaTrustBlock />
      <CTABlock />
    </div>
  );
}
