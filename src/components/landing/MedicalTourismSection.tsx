import { motion, useInView, useMotionValue, useTransform, animate, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Shield,
  MessageCircle,
  Plane,
  Car,
  Stethoscope,
  HeartPulse,
  Camera,
  Home,
  Smile,
  Eye,
  Bone,
  Baby,
  Brain,
  Star,
  BadgeCheck,
  Headphones,
  Building2,
  CalendarDays,
  ListChecks,
  PlaneTakeoff,
  Quote,
  Video,
  FileText,
  ShieldCheck,
  ScrollText,
  ExternalLink,
  Activity,
  Scale,
  Sparkles,
  Pill,
  Ear,
  Droplets,
  ChevronsUpDown,
  Check,
  Search,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRef, useEffect, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LANGUAGE_OPTIONS, useI18n } from "@/lib/i18n";
import { useMtText } from "@/lib/medTourismText";
import {
  MT_HERO_DISCLAIMER,
  MT_HERO_SUBLINE_REST,
  MT_HERO_SUBLINE_WE,
} from "@/lib/medTourismCopy";
import { WHATSAPP_CARE_GUIDE_PREFILL } from "@/lib/whatsappContact";
import { useWhatsappHref } from "@/hooks/useWhatsappHref";
import { AFRICA_COUNTRY_FLAGS, africaFlagUrl } from "@/lib/africaCountryFlags";
import {
  MED_TOURISM_COUNTRIES,
  MED_TOURISM_TREATMENT_CATEGORY_FILTERS,
  buildCostDataForIso,
  getLocaleLineForMedTourismCountry,
  getMedTourismCountry,
  type MedTreatmentCategoryId,
} from "@/lib/medTourismCountryData";
import { useUsdToLocalRate } from "@/hooks/useMedTourismFxRate";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { GURUGRAM_PARTNER_HOSPITALS } from "@/lib/partnerHospitalsGurugram";
import { WhyIndiaScreens } from "@/components/landing/WhyIndiaScreens";

const HERO_IMG =
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80&auto=format&fit=crop&ixlib=rb-4.0.3";

const sectionPad = "py-20 md:py-28 px-4 sm:px-6 lg:px-8";
const glass =
  "rounded-2xl border border-border/40 bg-card/70 backdrop-blur-xl shadow-elevated";
const glassHover = cn(glass, "transition-shadow duration-300 hover:shadow-premium");

/** Five trust steps before travel (replaces old service cards). `highlight` is shown prominently on step 3. */
const trustProcessSteps: {
  icon: LucideIcon;
  title: string;
  desc: string;
  highlight?: string;
}[] = [
  {
    icon: Video,
    title: "Initial step: we speak with you online",
    desc: "Tell us how you feel and what your doctor said. Our care team meets you on video or phone, calmly and in simple words.",
  },
  {
    icon: FileText,
    title: "You share the documents we request",
    desc: "You upload reports on a clear checklist. We send them safely to experienced doctors in India.",
  },
  {
    icon: ShieldCheck,
    title: "Clear opinion and treatment cost from India",
    desc: "Doctors in India review your file. They explain your condition and the full cost of care in plain language.",
    highlight: "No commission from our team on your hospital quote. You see the real price.",
  },
  {
    icon: ScrollText,
    title: "Official letter on StayOnStay letterhead",
    desc: "When you say yes, the hospital prepares your invitation letter. We coordinate it on official StayOnStay letterhead so the paperwork is easy to trust.",
  },
  {
    icon: PlaneTakeoff,
    title: "Visa and flights: we guide you",
    desc: "We walk you through visa steps and suggest flight dates and routes that fit your treatment plan.",
  },
];

/** Unsplash image base query — `ixlib` is required for stable CDN URLs (avoids 404s / blocks). */
const u = (id: string) =>
  `https://images.unsplash.com/${id}?w=800&q=80&auto=format&fit=crop&ixlib=rb-4.0.3`;

/** Representative photos (Unsplash) — warm, real-world context for trust; not a specific patient or hospital. */
const journeySteps: {
  icon: LucideIcon;
  title: string;
  desc: string;
  imageSrc: string;
  imageAlt: string;
}[] = [
  {
    icon: MessageCircle,
    title: "Tell us your problem",
    desc: "Tell us what you need. We listen.",
    imageSrc: u("photo-1573497019940-1c28c88b4f3e"),
    imageAlt: "Person on a video call with a laptop, suggesting a remote care conversation",
  },
  {
    icon: ListChecks,
    title: "Get hospitals and prices",
    desc: "We send hospital names and clear prices.",
    imageSrc: u("photo-1519494026892-80bbd2d6fd0d"),
    imageAlt: "Bright, modern hospital building exterior",
  },
  {
    icon: CalendarDays,
    title: "We plan travel and stay",
    desc: "Flights, hotel, visa help: we fix it for you.",
    imageSrc: u("photo-1529074963764-98f45c47344b"),
    imageAlt: "Passport, phone, and travel items on a desk, suggesting trip planning",
  },
  {
    icon: Plane,
    title: "You fly to India",
    desc: "You land in India. Our helper meets you at the airport.",
    imageSrc: u("photo-1563013544-824ae1b704d3"),
    imageAlt: "Airport terminal with travelers and arrivals area",
  },
  {
    icon: HeartPulse,
    title: "Treatment and rest",
    desc: "Good treatment. Help by phone 24 hours a day.",
    imageSrc: u("photo-1579684385127-1ef15d508118"),
    imageAlt: "Healthcare professional with patient in a calm clinical setting",
  },
  {
    icon: Camera,
    title: "Visit India (optional)",
    desc: "You can see places in India while you rest, if you want.",
    imageSrc: u("photo-1524492412937-b28074a5d7da"),
    imageAlt: "India Gate monument in New Delhi on a clear day",
  },
  {
    icon: Home,
    title: "Your trip home",
    desc: "We help you go home and get follow-up care.",
    /** Replaced dead photo id (404); wing-over-clouds still reads as “heading home”. */
    imageSrc: u("photo-1436491865332-7a61a109cc05"),
    imageAlt: "View from above the clouds from an airplane, suggesting the journey home",
  },
];

/* —— Treatments (photo + icon; Unsplash = illustrative only). Prices/stays = indicative USD ranges. —— */
const treatments: {
  icon: LucideIcon;
  name: string;
  specialty: string;
  price: string;
  stay: string;
  tag: string | null;
  badge: string | null;
  imageSrc: string;
  imageAlt: string;
}[] = [
  {
    icon: HeartPulse,
    name: "Angioplasty & Stenting (Coronary)",
    specialty: "Interventional Cardiology",
    price: "$2,400–$6,400",
    stay: "7–14 days (incl. recovery)",
    tag: "Popular in Africa",
    badge: "High Success Rate",
    imageSrc: u("photo-1551190822-a9333d879b1f"),
    imageAlt: "Doctor and patient in a calm consultation",
  },
  {
    icon: Bone,
    name: "Arthroscopy (Knee/Shoulder)",
    specialty: "Orthopaedics",
    price: "$1,000–$3,000*",
    stay: "5–7 days",
    tag: "Popular in Africa",
    badge: null,
    imageSrc: u("photo-1582719478250-c89cae4dc85b"),
    imageAlt: "Physiotherapy and joint care context",
  },
  {
    icon: Scale,
    name: "Bariatric (Weight-Loss) Surgery",
    specialty: "Bariatric Surgery",
    price: "$3,000–$6,000*",
    stay: "10–14 days",
    tag: null,
    badge: null,
    imageSrc: u("photo-1571019613454-1cb2f99b2d8b"),
    imageAlt: "Wellness and healthy lifestyle context",
  },
  {
    icon: Pill,
    name: "Bone Marrow Transplant (Stem Cell)",
    specialty: "Hematology/Oncology",
    price: "$25,000–$50,000*",
    stay: "4–6 weeks",
    tag: null,
    badge: "High Success Rate",
    imageSrc: u("photo-1582719478250-c89cae4dc85b"),
    imageAlt: "Hospital care and recovery setting",
  },
  {
    icon: Activity,
    name: "Breast/Lung/Colorectal Cancer (surgery/chemo/radiotherapy)",
    specialty: "Oncology",
    price: "$6,000–$15,000* (for major surgeries)",
    stay: "10–21 days (surgery)",
    tag: "Popular in Africa",
    badge: null,
    imageSrc: u("photo-1576091160399-112ba8d25d1d"),
    imageAlt: "Modern hospital clinical environment",
  },
  {
    icon: Eye,
    name: "Cataract Surgery",
    specialty: "Ophthalmology",
    price: "$300–$1,000",
    stay: "3–5 days",
    tag: null,
    badge: "High Success Rate",
    imageSrc: u("photo-1579684385127-1ef15d508118"),
    imageAlt: "Eye health and vision care context",
  },
  {
    icon: Baby,
    name: "Congenital Heart Surgery (e.g. ASD/VSD repair)",
    specialty: "Pediatric Cardiology/Cardiac Surgery",
    price: "$4,000–$8,000",
    stay: "4–8 weeks",
    tag: "Popular in Africa",
    badge: null,
    imageSrc: u("photo-1519494026892-80bbd2d6fd0d"),
    imageAlt: "Children’s hospital and family-friendly care context",
  },
  {
    icon: Sparkles,
    name: "Cosmetic/Plastic Surgery (rhinoplasty, liposuction, etc.)",
    specialty: "Plastic Surgery",
    price: "$1,000–$5,000",
    stay: "3–10 days",
    tag: null,
    badge: null,
    imageSrc: u("photo-1576091160550-2173dba999ef"),
    imageAlt: "Clinical consultation setting",
  },
  {
    icon: Ear,
    name: "Cochlear (Ear) Implant",
    specialty: "ENT/Otolaryngology",
    price: "$8,000–$12,000",
    stay: "2–4 weeks",
    tag: null,
    badge: null,
    imageSrc: u("photo-1559757175-0eb30cd8c063"),
    imageAlt: "Medical technology and hearing health context",
  },
  {
    icon: Smile,
    name: "Dental Implants & Care",
    specialty: "Dentistry",
    price: "$500–$1,500 per implant",
    stay: "5–7 days",
    tag: "Popular in Africa",
    badge: null,
    imageSrc: u("photo-1606811841689-23dfddce3e95"),
    imageAlt: "Dental care setting with modern equipment",
  },
  {
    icon: Eye,
    name: "Eye Surgery (LASIK, Retina)",
    specialty: "Ophthalmology",
    price: "$500–$2,000",
    stay: "3–7 days",
    tag: null,
    badge: "High Success Rate",
    imageSrc: u("photo-1576091160399-112ba8d25d1d"),
    imageAlt: "Advanced eye surgery clinical setting",
  },
  {
    icon: HeartPulse,
    name: "Gynecological Surgery (hysterectomy, fibroids)",
    specialty: "Obstetrics/Gynecology",
    price: "$1,000–$5,000",
    stay: "3–7 days",
    tag: null,
    badge: null,
    imageSrc: u("photo-1579684385127-1ef15d508118"),
    imageAlt: "Caring clinical consultation",
  },
  {
    icon: Bone,
    name: "Hip Replacement",
    specialty: "Orthopaedics",
    price: "$4,000–$8,000",
    stay: "10–14 days",
    tag: "Popular in Africa",
    badge: null,
    imageSrc: u("photo-1582719478250-c89cae4dc85b"),
    imageAlt: "Joint recovery and mobility context",
  },
  {
    icon: Baby,
    name: "IVF and Fertility Treatment",
    specialty: "Reproductive Medicine",
    price: "$3,000–$5,000 (per cycle)",
    stay: "2–3 weeks per cycle",
    tag: "Popular in Africa",
    badge: null,
    imageSrc: u("photo-1515378791036-0648a3ef77b2"),
    imageAlt: "Family and hope context",
  },
  {
    icon: Bone,
    name: "Knee Replacement",
    specialty: "Orthopaedics",
    price: "$4,000–$6,000",
    stay: "10–14 days",
    tag: "Popular in Africa",
    badge: null,
    imageSrc: u("photo-1582719478250-c89cae4dc85b"),
    imageAlt: "Knee and mobility rehabilitation context",
  },
  {
    icon: Droplets,
    name: "Kidney Stone/Lithotripsy",
    specialty: "Urology",
    price: "$1,000–$3,000",
    stay: "3–5 days",
    tag: null,
    badge: null,
    imageSrc: u("photo-1576091160399-112ba8d25d1d"),
    imageAlt: "Hospital treatment context",
  },
  {
    icon: Activity,
    name: "Kidney Transplant",
    specialty: "Nephrology/Transplant",
    price: "$12,000–$20,000",
    stay: "4–6 weeks",
    tag: "Popular in Africa",
    badge: "High Success Rate",
    imageSrc: u("photo-1519494026892-80bbd2d6fd0d"),
    imageAlt: "Transplant and nephrology care setting",
  },
  {
    icon: Stethoscope,
    name: "Liver Transplant",
    specialty: "Hepatology/Transplant",
    price: "$30,000–$50,000",
    stay: "6–8 weeks",
    tag: null,
    badge: null,
    imageSrc: u("photo-1576091160550-2173dba999ef"),
    imageAlt: "Major hospital specialty care",
  },
  {
    icon: Brain,
    name: "Neurosurgery (Brain Tumor, Spine)",
    specialty: "Neurosurgery",
    price: "$5,000–$15,000 (varies)",
    stay: "10–21 days",
    tag: "Popular in Africa",
    badge: "High Success Rate",
    imageSrc: u("photo-1576091160550-2173dba999ef"),
    imageAlt: "Neurosurgery and advanced hospital care",
  },
  {
    icon: Droplets,
    name: "Obstructive Uropathy (e.g. Prostate surgery)",
    specialty: "Urology",
    price: "$1,000–$3,000",
    stay: "5–7 days",
    tag: null,
    badge: null,
    imageSrc: u("photo-1551190822-a9333d879b1f"),
    imageAlt: "Urology and men’s health clinical context",
  },
  {
    icon: Baby,
    name: "Reconstructive Pediatric Surgery (e.g. cleft lip/palate)",
    specialty: "Pediatric Surgery",
    price: "$2,000–$5,000",
    stay: "4–6 weeks",
    tag: "Popular in Africa",
    badge: null,
    imageSrc: u("photo-1519494026892-80bbd2d6fd0d"),
    imageAlt: "Pediatric surgical care context",
  },
];

/** Representative demand mix (industry-style shares; bars scaled to 100% width). */
const treatmentDemandMix: { label: string; pct: number; barClass: string }[] = [
  { label: "Oncology (cancer care)", pct: 31, barClass: "bg-primary" },
  { label: "Cardiology (heart surgery)", pct: 21, barClass: "bg-sky-500" },
  { label: "Orthopaedics (joints & spine)", pct: 19, barClass: "bg-teal-500" },
  { label: "Other procedures", pct: 23, barClass: "bg-emerald-500" },
];

type DisplayCurrency = "usd" | "inr";

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
  const waCareHref = useWhatsappHref(WHATSAPP_CARE_GUIDE_PREFILL);
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

          <h2 className="font-heading mb-6 text-balance text-3xl font-bold leading-tight text-foreground sm:text-4xl md:text-5xl lg:text-[3.4rem]">
            {tx("Travel to India for Affordable Treatment")}
            {" - "}
            <span className="text-primary">{tx("We Handle Everything")}</span>
          </h2>

          <div className="mb-5 flex flex-wrap gap-2 text-[11px] font-semibold sm:text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-900 shadow-sm dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100">
              <MessageCircle className="h-3.5 w-3.5 shrink-0 text-[#25D366]" aria-hidden />
              {tx("WhatsApp care in your language")}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/8 px-3 py-1.5 text-primary">
              <BadgeCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {tx("Clear prices before you decide")}
            </span>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mb-8 max-w-2xl font-body text-pretty text-lg font-normal leading-[1.7] tracking-[0.01em] text-foreground/90 antialiased sm:text-xl sm:leading-[1.65]"
          >
            {tx(MT_HERO_SUBLINE_WE)}
            {tx(MT_HERO_SUBLINE_REST)}
          </motion.p>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <motion.a
              href="#mt-cta"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary/85 px-8 py-3.5 text-center text-base font-semibold text-primary-foreground shadow-premium sm:w-auto"
            >
              {tx("Get My Treatment Plan")}
              <ArrowRight className="h-4 w-4 shrink-0" />
            </motion.a>
            <motion.a
              href={waCareHref}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#25D366] px-8 py-3.5 text-center text-base font-semibold text-white shadow-md ring-1 ring-black/5 transition-colors hover:bg-[#20bd5a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366] sm:w-auto"
            >
              <MessageCircle className="h-4 w-4 shrink-0" />
              {tx("Talk to a Care Guide")}
            </motion.a>
          </div>

          <div
            className="mt-8 max-w-2xl rounded-2xl border border-emerald-200/70 bg-emerald-50/90 px-5 py-5 text-left shadow-md dark:border-emerald-900/40 dark:bg-emerald-950/35 sm:px-6 sm:py-6"
            role="note"
          >
            <p className="text-base font-medium leading-relaxed text-foreground/95 sm:text-lg">
              {tx(MT_HERO_DISCLAIMER)}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground sm:gap-6">
            <div>
              <span className="font-semibold text-foreground">10,000+</span> {tx("people helped")}
            </div>
            <div>
              <span className="font-semibold text-foreground">50+</span> {tx("hospitals with us")}
            </div>
            <div>
              <span className="font-semibold text-foreground">{tx("Save about 70%")}</span> {tx("on average")}
            </div>
          </div>

          <div className="mt-8 md:hidden">
            <div className={cn(glass, "overflow-hidden p-2")}>
              <img
                src={HERO_IMG}
                alt={tx("Representative modern hospital in India")}
                className="aspect-[4/3] w-full rounded-xl object-cover"
                width={800}
                height={600}
                loading="lazy"
              />
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  <span className="h-2 w-2 rounded-full bg-primary" aria-hidden />
                  {tx("JCI approved hospital")}
                </span>
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground">{tx("Save up to 70%")}</span>
              </div>
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
    <section
      className={cn(
        sectionPad,
        "bg-gradient-to-b from-emerald-50/70 via-background to-background dark:from-emerald-950/25 dark:via-background",
      )}
      ref={ref}
    >
      <div className="mx-auto max-w-page">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center sm:mb-16"
        >
          <span className="text-sm font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            {tx("Why Travel With Us")}
          </span>
          <h3 className="font-heading mt-3 text-balance text-2xl font-bold text-foreground sm:text-3xl md:text-4xl">
            {tx("We Handle Everything — So You Don't Have To")}
          </h3>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{tx("You focus on healing. We handle the rest.")}</p>
          <p className="mx-auto mt-4 max-w-lg rounded-xl border border-emerald-200/80 bg-emerald-50/90 px-4 py-3 text-sm font-semibold text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100">
            {tx("Five clear steps from first call to your visa")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {trustProcessSteps.map((s, i) => (
            <motion.article
              key={s.title}
              initial={{ opacity: 0, y: 28 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.08, ease: "easeOut" }}
              whileHover={{ y: -3, transition: { type: "spring", stiffness: 260, damping: 22 } }}
              className={cn(
                "relative flex min-h-full flex-col rounded-2xl border p-5 text-left shadow-sm",
                s.highlight
                  ? "border-emerald-400 bg-gradient-to-b from-emerald-50 to-card ring-2 ring-emerald-400/30 dark:border-emerald-600 dark:from-emerald-950/50 dark:to-card"
                  : "border-border/70 bg-card/90 dark:bg-card/70",
              )}
            >
              <div className="mb-3 flex items-center gap-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white shadow-md"
                  aria-hidden
                >
                  {i + 1}
                </span>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
                  <s.icon className="h-5 w-5" aria-hidden />
                </div>
              </div>
              <h4 className="font-heading text-base font-bold leading-snug text-foreground">{tx(s.title)}</h4>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{tx(s.desc)}</p>
              {s.highlight ? (
                <p className="mt-3 rounded-xl border-2 border-emerald-500 bg-emerald-100 px-3 py-2.5 text-sm font-bold leading-snug text-emerald-950 dark:border-emerald-500 dark:bg-emerald-900/50 dark:text-emerald-50">
                  {tx(s.highlight)}
                </p>
              ) : null}
            </motion.article>
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
        <div className="mx-auto max-w-3xl lg:max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-center mb-16"
          >
            <span className="text-sm font-medium text-primary uppercase tracking-wider">{tx("How It Works")}</span>
            <h3 className="font-heading text-3xl md:text-4xl font-bold text-foreground mt-3">{tx("Your Journey, Step by Step")}</h3>
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
              {tx("No confusion. No stress. We guide you through every stage.")}
            </p>
          </motion.div>

          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-border/60 md:left-8" aria-hidden />
            <div className="space-y-2 md:space-y-3">
              {journeySteps.map((step, i) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: i * 0.08, ease: "easeOut" }}
                  className="relative flex gap-4 items-start py-3 md:gap-6 md:py-4"
                >
                  <div className="relative z-10 shrink-0">
                    <div
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-2xl md:h-16 md:w-16",
                        i === 0 ? "bg-gradient-to-br from-primary to-primary/85 shadow-lg" : "border border-border bg-card",
                      )}
                    >
                      <step.icon className={cn("h-5 w-5 md:h-6 md:w-6", i === 0 ? "text-primary-foreground" : "text-primary")} />
                    </div>
                    {i === 0 && <span className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full bg-warning" />}
                  </div>

                  <div className="min-w-0 flex-1 pt-0.5 md:pt-2">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-5">
                      <div className="order-2 min-w-0 flex-1 sm:order-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-primary">
                            {tx("Step")} {i + 1}
                          </span>
                          {i === 0 && (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                              {tx("You are here")}
                            </span>
                          )}
                        </div>
                        <h4 className="font-heading text-base font-semibold text-foreground md:text-lg">{tx(step.title)}</h4>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{tx(step.desc)}</p>
                      </div>
                      <div className="order-1 w-full shrink-0 sm:order-2 sm:w-[min(100%,200px)] md:w-[min(100%,240px)]">
                        <div className="overflow-hidden rounded-2xl border border-border/80 bg-muted/40 shadow-md ring-1 ring-black/[0.04] dark:ring-white/10">
                          <img
                            src={step.imageSrc}
                            alt={step.imageAlt}
                            width={480}
                            height={320}
                            loading="lazy"
                            decoding="async"
                            className="aspect-[3/2] h-auto w-full object-cover transition-transform duration-500 hover:scale-[1.02] motion-reduce:transition-none motion-reduce:hover:scale-100"
                            sizes="(min-width: 1024px) 240px, (min-width: 640px) 200px, 100vw"
                          />
                        </div>
                      </div>
                    </div>
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
  const reduce = useReducedMotion();

  return (
    <section
      id="mt-treatments"
      className={cn(sectionPad, "bg-gradient-to-b from-background via-muted/20 to-background")}
      ref={ref}
    >
      <div className="mx-auto max-w-page">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12 text-center md:mb-14"
        >
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">{tx("Treatments")}</span>
          <h3 className="font-heading mt-3 text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            {tx("Find the right care: easy and clear")}
          </h3>
          <p className="mx-auto mt-4 max-w-2xl font-body text-base leading-relaxed text-muted-foreground md:text-lg">
            {tx("Top hospitals in India. Good care. Much less money.")}
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-sm font-medium leading-relaxed text-foreground/85">
            {tx("India is a leading choice for African families: advanced specialties, shorter waits, and often 60–80% lower cost than many Western systems.")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="mb-10 grid gap-3 sm:grid-cols-3"
          role="group"
          aria-label="Key statistics for the Africa–India medical corridor"
        >
          {[
            "24,000+ African patients reached India in Q1 2026 — a sharp rise in medical travel.",
            "42% growth vs 2024 — many projections point to 100,000+ visits this year.",
            "East & West Africa lead: Nigeria, Kenya, Tanzania, Ghana, Uganda, Rwanda & Congo.",
          ].map((text, i) => (
            <motion.div
              key={text}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.12 + i * 0.06, duration: 0.45 }}
              className="rounded-2xl border border-primary/15 bg-card/90 px-4 py-4 text-left shadow-sm backdrop-blur-sm"
            >
              <p className="font-heading text-sm font-bold leading-snug text-foreground">{tx(text)}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-12 rounded-2xl border border-border/60 bg-card/80 p-5 shadow-sm md:p-7"
        >
          <h4 className="font-heading text-center text-base font-bold text-foreground md:text-lg">
            {tx("What African travelers often plan in India")}
          </h4>
          <p className="mx-auto mt-2 max-w-2xl text-center text-xs text-muted-foreground">
            {tx("Representative demand mix from industry reports — not a promise of availability.")}
          </p>
          <div className="mt-6 space-y-4" role="list">
            {treatmentDemandMix.map((row) => (
              <div key={row.label} role="listitem">
                <div className="mb-1 flex items-center justify-between gap-2 text-xs font-semibold text-foreground sm:text-sm">
                  <span>{tx(row.label)}</span>
                  <span className="tabular-nums text-primary">{row.pct}%</span>
                </div>
                <div
                  className="h-2.5 overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-valuenow={row.pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${tx(row.label)} ${row.pct}%`}
                >
                  <motion.div
                    className={cn("h-full rounded-full", row.barClass)}
                    initial={{ width: 0 }}
                    animate={inView ? { width: `${row.pct}%` } : {}}
                    transition={{ duration: reduce ? 0 : 0.85, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <p className="mx-auto mb-8 max-w-3xl text-center text-[11px] leading-relaxed text-muted-foreground">
          {tx("* Price ranges are indicative in USD; final cost depends on hospital, city, and your case. Asterisk (*) marks where agencies often cite bundled or variable packages.")}
        </p>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {treatments.map((t, i) => (
            <motion.article
              key={t.name}
              initial={{ opacity: 0, y: 36 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.45, delay: 0.08 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
              whileHover={reduce ? undefined : { y: -4, transition: { type: "spring", stiffness: 280, damping: 22 } }}
              whileTap={reduce ? undefined : { scale: 0.99 }}
              className={cn(
                "group flex cursor-default flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-md transition-shadow duration-300 hover:shadow-xl",
              )}
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                <img
                  src={t.imageSrc}
                  alt={t.imageAlt}
                  width={640}
                  height={400}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                />
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent"
                  aria-hidden
                />
                <div className="absolute right-2 top-2 flex max-w-[70%] flex-wrap justify-end gap-1.5">
                  {t.tag && (
                    <span className="rounded-full bg-white/95 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary shadow-sm backdrop-blur-sm dark:bg-black/70 dark:text-primary-foreground">
                      {tx(t.tag)}
                    </span>
                  )}
                  {t.badge && (
                    <span className="rounded-full bg-emerald-600/95 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                      {tx(t.badge)}
                    </span>
                  )}
                </div>
                <div className="absolute bottom-3 left-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/90 shadow-md backdrop-blur-sm dark:bg-black/60">
                  <t.icon className="h-5 w-5 text-primary" aria-hidden />
                </div>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h4 className="font-heading text-base font-bold leading-snug text-foreground md:text-lg">{tx(t.name)}</h4>
                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-primary/90">{tx(t.specialty)}</p>
                <p className="mt-2 text-sm font-bold text-primary">{tx(t.price)}</p>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground/80">{tx("Typical stay:")}</span> {tx(t.stay)}
                </p>
                <p className="mt-3 font-body text-xs leading-relaxed text-muted-foreground">
                  {tx("Illustrative photo — your hospital and doctor are chosen with you.")}
                </p>
              </div>
            </motion.article>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.55, duration: 0.5 }}
          className="mt-10 space-y-2 text-center"
        >
          <p className="text-sm font-medium text-foreground/90">{tx("Your health, our priority — we connect you; hospitals provide treatment.")}</p>
          <p className="text-xs italic leading-relaxed text-muted-foreground">
            {tx("We link you to good hospitals in India. We help you plan. We do not give treatment ourselves.")}
          </p>
        </motion.div>
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
      <div className="mx-auto max-w-page">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center sm:mb-14"
        >
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">{tx("Partner Hospitals")}</span>
          <h3 className="font-heading mt-3 text-2xl font-bold text-foreground sm:text-3xl md:text-4xl">
            {tx("JCI-accredited partner hospitals")}
          </h3>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
            {tx("Trusted Gurugram facilities, in the order many families choose.")}
          </p>
          <p className="mx-auto mt-2 max-w-2xl text-xs text-muted-foreground">{tx("Accreditation note Paras NABH")}</p>
        </motion.div>

        <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3 xl:grid-cols-5">
          {GURUGRAM_PARTNER_HOSPITALS.map((h, i) => (
            <motion.article
              key={h.name}
              initial={{ opacity: 0, y: 32 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="flex w-[min(100%,280px)] shrink-0 snap-center flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-md sm:w-auto"
            >
              <div className="relative aspect-[16/11] w-full overflow-hidden bg-muted">
                <img
                  src={h.image}
                  alt={`${h.name}, ${tx("Representative hospital photo")}`}
                  className="h-full w-full object-cover"
                  width={640}
                  height={440}
                  loading="lazy"
                  decoding="async"
                />
                <span className="absolute right-2 top-2 rounded-full bg-black/70 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  {h.accreditation}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h4 className="font-heading text-base font-bold leading-snug text-foreground">{h.name}</h4>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground sm:text-sm">
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 shrink-0 fill-warning text-warning" aria-hidden />
                    {h.rating}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{h.specialty}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                    {h.accreditation} {tx("Accredited")}
                  </span>
                </div>
                <p className="mt-2 text-[10px] leading-snug text-muted-foreground">{tx("Representative photo note")}</p>
                <a
                  href={h.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline"
                >
                  {tx("See more details >")}
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                </a>
              </div>
            </motion.article>
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
  const reduce = useReducedMotion();
  const [selectedIso, setSelectedIso] = useState("ng");
  const [countryOpen, setCountryOpen] = useState(false);
  const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>("usd");
  const [treatmentQuery, setTreatmentQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | MedTreatmentCategoryId>("all");
  const countryMeta = getMedTourismCountry(selectedIso) ?? MED_TOURISM_COUNTRIES[0];
  const comparisons = buildCostDataForIso(selectedIso);
  const liveUsdToLocal = useUsdToLocalRate(countryMeta.localCurrencyCode, countryMeta.usdToLocal);

  useEffect(() => {
    setTreatmentQuery("");
    setCategoryFilter("all");
  }, [selectedIso]);

  const filteredTreatments = useMemo(() => {
    const needle = treatmentQuery.trim().toLowerCase();
    return comparisons.filter((row) => {
      if (categoryFilter !== "all" && row.category !== categoryFilter) return false;
      if (!needle) return true;
      const en = row.procedure.toLowerCase();
      const localized = tx(row.procedure).toLowerCase();
      return en.includes(needle) || localized.includes(needle);
    });
  }, [comparisons, treatmentQuery, categoryFilter, tx]);
  const uiLang = LANGUAGE_OPTIONS.find((l) => l.code === language) ?? LANGUAGE_OPTIONS[0];
  const USD_TO_INR = 83;

  const corridorStatLines = [
    "24,000+ African patients reached India in Q1 2026 — a sharp rise in medical travel.",
    "42% growth vs 2024 — many projections point to 100,000+ visits this year.",
    "East & West Africa lead: Nigeria, Kenya, Tanzania, Ghana, Uganda, Rwanda & Congo.",
  ] as const;

  const formatPrimary = (usdValue: number) => {
    if (displayCurrency === "usd") return `$${usdValue.toLocaleString()}`;
    return `₹${Math.round(usdValue * USD_TO_INR).toLocaleString()}`;
  };

  const formatLocalCurrency = (usdValue: number) => {
    const localValue = usdValue * liveUsdToLocal;
    return `${countryMeta.localCurrencySymbol} ${Math.round(localValue).toLocaleString()}`;
  };

  return (
    <section id="mt-pricing" className={cn(sectionPad, "bg-muted/25")} ref={ref}>
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 text-center"
        >
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">{tx("Pricing")}</span>
          <h3 className="font-heading mt-3 text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            {tx("See How Much You Can Save")}
          </h3>
          <p className="mx-auto mt-4 max-w-xl font-body text-base leading-relaxed text-muted-foreground">
            {tx("See what you pay at home vs India. Same care, lower price.")}
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-sm font-medium text-foreground/85">
            {tx("Cardiac care in India can cost around a fraction of US rates — use the calculator below for your country.")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.06, duration: 0.45 }}
          className="mb-8 grid gap-2 sm:grid-cols-3"
        >
          {corridorStatLines.map((line) => (
            <div
              key={line}
              className="rounded-xl border border-border/60 bg-card/90 px-3 py-3 text-left text-xs font-semibold leading-snug text-foreground shadow-sm"
            >
              {tx(line)}
            </div>
          ))}
        </motion.div>

        <div className="mb-6 flex flex-wrap items-center justify-center gap-2 rounded-xl border border-border/50 bg-muted/25 px-4 py-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t("lang.pageLanguage")}</span>
          <span className="flex items-center gap-2 rounded-lg bg-background/80 px-2.5 py-1 shadow-sm">
            <img src={uiLang.flagUrl} alt="" className="h-4 w-6 shrink-0 rounded-[2px]" loading="lazy" />
            <span className="text-sm font-semibold text-foreground">{t(`lang.${language}.native`)}</span>
            <span className="text-xs text-muted-foreground">({t(`lang.${language}.label`)})</span>
          </span>
        </div>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm text-muted-foreground">
              {tx("Selected:")}{" "}
              <span className="font-semibold text-foreground">{tx(countryMeta.label)}</span>
              {" · "}
              {tx("Currency:")}{" "}
              <span className="font-semibold text-foreground">{countryMeta.localCurrencyCode}</span>
              {" · "}
              {tx("Language:")}{" "}
              <span className="text-muted-foreground">{tx(getLocaleLineForMedTourismCountry(selectedIso))}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {tx(
                "USD and your local amounts are guides only. Exchange rates refresh when you are online; hospital quotes are final.",
              )}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-xs text-muted-foreground">{tx("Display")}</span>
            <Select value={displayCurrency} onValueChange={(v) => setDisplayCurrency(v as DisplayCurrency)}>
              <SelectTrigger className="h-9 w-[120px]">
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
          transition={{ duration: 0.4, delay: 0.12 }}
          className="mb-10"
        >
          <label className="mb-2 block text-sm font-semibold text-foreground" htmlFor="mt-country-combo">
            {tx("Find your country")}
          </label>
          <Popover open={countryOpen} onOpenChange={setCountryOpen}>
            <PopoverTrigger asChild>
              <Button
                id="mt-country-combo"
                variant="outline"
                role="combobox"
                aria-expanded={countryOpen}
                className="h-12 w-full max-w-xl justify-between rounded-xl border-border px-4 text-left font-normal shadow-sm"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <img src={countryMeta.flagUrl} alt="" className="h-5 w-7 shrink-0 rounded-[2px]" width={28} height={20} />
                  <span className="truncate text-sm font-semibold">{tx(countryMeta.label)}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">({countryMeta.localCurrencyCode})</span>
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" aria-hidden />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[min(100vw-2rem,36rem)] p-0" align="start">
              <Command>
                <CommandInput placeholder={tx("Search country or currency…")} className="h-11" />
                <CommandList>
                  <CommandEmpty>{tx("No country found.")}</CommandEmpty>
                  <CommandGroup className="max-h-[min(60vh,320px)] overflow-y-auto p-1">
                    {MED_TOURISM_COUNTRIES.map((c) => (
                      <CommandItem
                        key={c.iso}
                        value={`${c.label} ${c.localCurrencyCode} ${c.iso}`.toLowerCase()}
                        onSelect={() => {
                          setSelectedIso(c.iso);
                          setCountryOpen(false);
                        }}
                        className="cursor-pointer"
                      >
                        <Check
                          className={cn("mr-2 h-4 w-4 shrink-0", selectedIso === c.iso ? "opacity-100" : "opacity-0")}
                          aria-hidden
                        />
                        <img src={c.flagUrl} alt="" className="mr-2 h-4 w-6 shrink-0 rounded-[2px]" width={24} height={16} />
                        <span className="flex-1 truncate">{tx(c.label)}</span>
                        <span className="ml-2 shrink-0 text-xs text-muted-foreground">{c.localCurrencyCode}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </motion.div>

        <div
          className={cn(
            "mb-8 rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur-sm sm:p-5",
            "ring-1 ring-black/[0.03] dark:ring-white/5",
          )}
        >
          <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h4 className="font-heading text-base font-bold text-foreground">{tx("Find a treatment")}</h4>
              <p className="text-xs text-muted-foreground">{tx("Search by name or tap a category — works on phones and tablets.")}</p>
            </div>
            <p className="text-xs font-medium tabular-nums text-muted-foreground sm:text-right" aria-live="polite">
              {tx("Showing")}{" "}
              <span className="font-semibold text-foreground">{filteredTreatments.length}</span> / {comparisons.length}{" "}
              {tx("treatments")}
            </p>
          </div>

          <div className="relative mb-4">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              type="search"
              enterKeyHint="search"
              autoComplete="off"
              value={treatmentQuery}
              onChange={(e) => setTreatmentQuery(e.target.value)}
              placeholder={tx("Search treatments (e.g. knee, cancer, eye)…")}
              className={cn(
                "h-12 w-full rounded-2xl border-border/80 bg-background pl-10 pr-11 text-base shadow-inner",
                "placeholder:text-muted-foreground/70",
                "focus-visible:ring-2 focus-visible:ring-primary/30",
              )}
              aria-label={tx("Search treatments")}
            />
            {treatmentQuery ? (
              <button
                type="button"
                onClick={() => setTreatmentQuery("")}
                className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label={tx("Clear search")}
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <div className="mb-1">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{tx("Category")}</p>
            <div
              className={cn(
                "flex gap-2 overflow-x-auto pb-2 pt-0.5 [-webkit-overflow-scrolling:touch]",
                "snap-x snap-mandatory sm:flex-wrap sm:overflow-visible sm:snap-none",
              )}
            >
              {MED_TOURISM_TREATMENT_CATEGORY_FILTERS.map((chip) => {
                const active = categoryFilter === chip.id;
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setCategoryFilter(chip.id)}
                    className={cn(
                      "min-h-[44px] shrink-0 snap-start rounded-full border px-4 py-2.5 text-left text-sm font-semibold transition-colors",
                      "touch-manipulation active:scale-[0.98]",
                      active
                        ? "border-primary bg-primary text-primary-foreground shadow-md"
                        : "border-border/80 bg-muted/40 text-foreground hover:border-primary/40 hover:bg-muted/70",
                    )}
                  >
                    {tx(chip.label)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {filteredTreatments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 px-6 py-14 text-center">
              <p className="font-medium text-foreground">{tx("No treatments match your filters.")}</p>
              <p className="mt-2 text-sm text-muted-foreground">{tx("Try another word or choose “All treatments”.")}</p>
              <Button
                type="button"
                variant="secondary"
                className="mt-6 min-h-[44px] rounded-xl"
                onClick={() => {
                  setTreatmentQuery("");
                  setCategoryFilter("all");
                }}
              >
                {tx("Reset filters")}
              </Button>
            </div>
          ) : null}
          {filteredTreatments.map((c, i) => {
            const savings = Math.round(((c.localUsd - c.indiaUsd) / c.localUsd) * 100);
            return (
              <motion.div
                key={`${selectedIso}-${displayCurrency}-${c.procedure}`}
                initial={{ opacity: 0, y: 24 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.45, delay: Math.min(i * 0.06, 0.45), ease: [0.22, 1, 0.36, 1] }}
                whileHover={reduce ? undefined : { y: -3, transition: { duration: 0.2 } }}
                className={cn(
                  glass,
                  "flex flex-col gap-5 border-l-4 border-l-primary p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-6",
                  "transition-shadow duration-300 hover:shadow-premium",
                )}
              >
                <div className="min-w-0 flex-1">
                  <h4 className="font-heading text-lg font-bold text-foreground">{tx(c.procedure)}</h4>
                  <p className="mt-1 font-body text-xs text-muted-foreground">{tx("Indicative comparison — final quotes come from your hospital.")}</p>
                </div>
                <div className="flex flex-wrap items-center gap-6 sm:gap-8">
                  <div className="min-w-[7rem] text-center sm:text-left">
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{tx("Local Cost")}</p>
                    <p className="font-heading text-base font-bold text-foreground line-through decoration-muted-foreground/50 opacity-60">
                      {formatPrimary(c.localUsd)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {countryMeta.localCurrencyCode}: {formatLocalCurrency(c.localUsd)}
                    </p>
                  </div>
                  <div className="min-w-[7rem] text-center sm:text-left">
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{tx("India")}</p>
                    <p className="font-heading text-xl font-black text-primary md:text-2xl">{formatPrimary(c.indiaUsd)}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {countryMeta.localCurrencyCode}: {formatLocalCurrency(c.indiaUsd)}
                    </p>
                  </div>
                  <div
                    title={tx("About how much you save vs paying at home")}
                    className="rounded-full bg-emerald-500/15 px-4 py-2 text-sm font-bold text-emerald-800 ring-1 ring-emerald-500/25 dark:bg-emerald-500/20 dark:text-emerald-50 dark:ring-emerald-400/30"
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
  const waCareHref = useWhatsappHref(WHATSAPP_CARE_GUIDE_PREFILL);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const n = AFRICA_COUNTRY_FLAGS.length;

  return (
    <section
      id="mt-for-africa"
      className={cn(sectionPad, "bg-gradient-to-b from-emerald-50/40 via-background to-muted/20 dark:from-emerald-950/20")}
      ref={ref}
    >
      <div className="mx-auto max-w-page max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
            {tx("For Africa")}
          </span>
          <h3 className="font-heading mt-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            {tx("People across Africa trust us")}
          </h3>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            {tx("We help people in many countries. WhatsApp in your language. Clear advice for your area.")}
          </p>
          <p className="mx-auto mt-3 text-sm font-semibold text-emerald-800 dark:text-emerald-300">
            {n} {tx("African countries, one caring team")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.45, delay: 0.12 }}
          className="mt-10 grid grid-cols-3 gap-2 min-[400px]:grid-cols-4 sm:grid-cols-5 sm:gap-3 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-9"
        >
          {AFRICA_COUNTRY_FLAGS.map((f, i) => (
            <motion.div
              key={f.code}
              initial={{ opacity: 0, y: 10 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.22, delay: Math.min(0.15 + i * 0.012, 0.75) }}
              className="group flex flex-col items-center gap-1.5 rounded-xl border border-emerald-200/50 bg-card/80 p-2 shadow-sm transition-all duration-200 hover:border-emerald-400/60 hover:shadow-md dark:border-emerald-900/40 dark:bg-card/50"
            >
              <img
                src={africaFlagUrl(f.code, 40)}
                alt=""
                width={40}
                height={27}
                className="h-[22px] w-10 rounded-[2px] object-cover shadow-sm ring-1 ring-black/5 sm:h-[26px] sm:w-11"
                loading="lazy"
                decoding="async"
              />
              <span className="line-clamp-2 min-h-[2rem] w-full px-0.5 text-center text-[9px] font-semibold leading-tight text-foreground sm:text-[10px] md:text-[11px]">
                {tx(f.label)}
              </span>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.35 }}
          className={cn(
            glass,
            "mx-auto mt-12 flex max-w-2xl flex-col items-stretch gap-5 rounded-2xl border-2 border-emerald-300/40 p-6 shadow-lg ring-1 ring-emerald-500/10 dark:border-emerald-800/50 sm:flex-row sm:items-center sm:justify-between sm:p-8",
          )}
        >
          <div className="flex items-start gap-4 sm:items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#25D366]/15 ring-2 ring-[#25D366]/25">
              <MessageCircle className="h-7 w-7 text-[#25D366]" aria-hidden />
            </div>
            <div className="text-left">
              <p className="font-heading text-lg font-bold text-foreground">{tx("Reach us on WhatsApp")}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{tx("Get instant support from a care guide in your region.")}</p>
            </div>
          </div>
          <a
            href={waCareHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[48px] shrink-0 items-center justify-center rounded-xl bg-[#25D366] px-8 text-sm font-bold text-white shadow-md ring-1 ring-black/5 transition-colors hover:bg-[#20bd5a] sm:px-6"
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
  const waCareHref = useWhatsappHref(WHATSAPP_CARE_GUIDE_PREFILL);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="mt-cta" className={cn(sectionPad, "bg-muted/20")} ref={ref}>
      <motion.div
        initial={{ opacity: 0, y: 48 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-white/15 shadow-[0_32px_80px_-24px_rgba(15,23,42,0.45)] px-1 py-1 sm:rounded-[2.25rem]"
      >
        <div
          className="absolute inset-0 rounded-[1.85rem] sm:rounded-[2.1rem]"
          style={{
            background:
              "linear-gradient(135deg, hsl(var(--primary)) 0%, #0ea5e9 42%, #059669 100%)",
          }}
        />
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/25 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-emerald-300/35 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute inset-0 rounded-[1.85rem] ring-1 ring-inset ring-white/20 sm:rounded-[2.1rem]" aria-hidden />

        <div className="relative z-10 px-6 py-12 text-center sm:px-10 sm:py-14 md:px-14 md:py-16">
          <h3 className="font-heading text-balance text-3xl font-black tracking-tight text-white drop-shadow-sm sm:text-4xl md:text-[2.75rem] md:leading-[1.1]">
            {tx("Ready to Start Your Healing Journey?")}
          </h3>
          <p className="mx-auto mt-5 max-w-xl text-base font-medium leading-relaxed text-white/95 sm:text-lg">
            {tx("Talk to a Care Guide: we'll plan your entire trip for free.")}
          </p>
          <p className="mx-auto mt-5 max-w-xl font-body text-pretty text-base font-normal leading-[1.65] tracking-[0.01em] text-white/88 antialiased sm:text-lg sm:leading-[1.6]">
            {tx("You focus on healing. We handle the rest.")}
          </p>

          <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
            <motion.a
              href="#medical-tourism"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-white px-8 text-base font-bold text-primary shadow-xl shadow-black/15 sm:w-auto"
            >
              {tx("Get My Treatment Plan")}
              <ArrowRight className="h-5 w-5 shrink-0" />
            </motion.a>
            <motion.a
              href={waCareHref}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border-2 border-white/35 bg-[#25D366] px-8 text-base font-bold text-white shadow-lg ring-2 ring-white/15 hover:bg-[#20bd5a] sm:w-auto"
            >
              <MessageCircle className="h-5 w-5 shrink-0" />
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
