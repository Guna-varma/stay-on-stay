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
  Percent,
  Award,
  Clock,
  Headphones,
  Building2,
  PlaneTakeoff,
  Quote,
} from "lucide-react";
import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const HERO_IMG =
  "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&q=80&auto=format&fit=crop";

const sectionPad = "py-20 md:py-28 px-4 sm:px-6 lg:px-8";
const glass =
  "rounded-2xl border border-border/40 bg-card/70 backdrop-blur-xl shadow-elevated";
const glassHover = cn(glass, "transition-shadow duration-300 hover:shadow-premium");

/* —— Why travel —— */
const whyServices = [
  { icon: Plane, title: "Flight Guidance", desc: "We help you find the best flights and plan your travel dates around your treatment." },
  { icon: Hotel, title: "Stay Booking", desc: "Comfortable, affordable hotel stays near your hospital — we handle all reservations." },
  { icon: Car, title: "Airport Pickup & Drop", desc: "A local guide meets you at the airport and drives you safely to your stay." },
  { icon: Stethoscope, title: "Hospital Coordination", desc: "We arrange consultations, appointments, and liaise directly with your medical team." },
  { icon: Globe, title: "Safe Return Home", desc: "Post-treatment follow-up and return travel planning so you're never left alone." },
];

/* —— Journey —— */
const journeySteps = [
  { icon: MessageSquare, title: "Tell Us Your Condition", desc: "Share your medical needs and we'll understand your situation." },
  { icon: ListChecks, title: "Get Hospital Options & Prices", desc: "Receive curated hospital options with transparent pricing." },
  { icon: CalendarCheck, title: "We Plan Your Travel & Stay", desc: "Flights, hotel, visa guidance — all arranged for you." },
  { icon: Plane, title: "You Travel (Pickup Included)", desc: "Arrive in India. Our local guide meets you at the airport." },
  { icon: HeartPulse, title: "Treatment + Recovery", desc: "World-class treatment with 24/7 concierge support." },
  { icon: Camera, title: "Tourism (Optional)", desc: "Explore India during your recovery if you wish." },
  { icon: Home, title: "Safe Return Home", desc: "We coordinate your return and post-care follow-up." },
];

/* —— Treatments —— */
const treatments = [
  { icon: Stethoscope, name: "Cardiac Surgery", price: "From $6,000", tag: "Popular in Africa", badge: "High Success Rate" },
  { icon: Smile, name: "Dental Implants", price: "From $800", tag: null, badge: null },
  { icon: Eye, name: "LASIK Eye Surgery", price: "From $1,200", tag: null, badge: "High Success Rate" },
  { icon: Bone, name: "Orthopedic Surgery", price: "From $5,500", tag: "Popular in Africa", badge: null },
  { icon: Baby, name: "Fertility / IVF", price: "From $3,500", tag: "Popular in Africa", badge: null },
  { icon: Brain, name: "Neurosurgery", price: "From $8,000", tag: null, badge: "High Success Rate" },
];

/* —— Hospitals —— */
const partnerHospitals = [
  { name: "Apollo Hospitals", location: "Chennai, India", rating: 4.9, specialty: "Cardiac & Oncology", accreditation: "JCI" },
  { name: "Fortis Memorial Research", location: "Gurgaon, India", rating: 4.8, specialty: "Multi-Specialty", accreditation: "JCI" },
  { name: "Medanta – The Medicity", location: "Delhi NCR, India", rating: 4.8, specialty: "Neurology & Transplants", accreditation: "JCI" },
  { name: "Narayana Health", location: "Bangalore, India", rating: 4.7, specialty: "Cardiac & Orthopedics", accreditation: "NABH" },
];

type Country = "nigeria" | "kenya" | "ghana" | "south-africa";

const countries: { id: Country; label: string; flag: string }[] = [
  { id: "nigeria", label: "Nigeria", flag: "🇳🇬" },
  { id: "kenya", label: "Kenya", flag: "🇰🇪" },
  { id: "ghana", label: "Ghana", flag: "🇬🇭" },
  { id: "south-africa", label: "South Africa", flag: "🇿🇦" },
];

const costData: Record<Country, { procedure: string; local: number; india: number }[]> = {
  nigeria: [
    { procedure: "Heart Bypass", local: 18000, india: 5500 },
    { procedure: "Hip Replacement", local: 12000, india: 6000 },
    { procedure: "Dental Implants", local: 3000, india: 800 },
    { procedure: "Fertility / IVF", local: 8000, india: 3500 },
  ],
  kenya: [
    { procedure: "Heart Bypass", local: 15000, india: 5500 },
    { procedure: "Hip Replacement", local: 10000, india: 6000 },
    { procedure: "Dental Implants", local: 2500, india: 800 },
    { procedure: "Fertility / IVF", local: 7000, india: 3500 },
  ],
  ghana: [
    { procedure: "Heart Bypass", local: 16000, india: 5500 },
    { procedure: "Hip Replacement", local: 11000, india: 6000 },
    { procedure: "Dental Implants", local: 2800, india: 800 },
    { procedure: "Fertility / IVF", local: 7500, india: 3500 },
  ],
  "south-africa": [
    { procedure: "Heart Bypass", local: 25000, india: 5500 },
    { procedure: "Hip Replacement", local: 15000, india: 6000 },
    { procedure: "Dental Implants", local: 4000, india: 800 },
    { procedure: "Fertility / IVF", local: 10000, india: 3500 },
  ],
};

const whyIndiaReasons = [
  { icon: Percent, title: "Save Up to 70%", desc: "Get the same quality treatment at a fraction of the cost — including travel and stay." },
  { icon: Award, title: "World-Class JCI Hospitals", desc: "India has 40+ JCI-accredited hospitals with globally trained specialists." },
  { icon: Clock, title: "Faster Treatment Timelines", desc: "No long waiting lists. Get treated within days, not months." },
  { icon: Headphones, title: "Full Concierge Support", desc: "From visa to recovery — our team handles every detail of your journey." },
];

const safetyPoints = [
  { icon: Car, title: "Airport Pickup by Local Guide", desc: "A trusted guide meets you the moment you land — no confusion, no stress." },
  { icon: Headphones, title: "24/7 Support During Stay", desc: "Our team is just a call or message away, any time of day or night." },
  { icon: Building2, title: "Hospital-to-Hotel Transport", desc: "Safe, reliable transport between your accommodation and hospital." },
  { icon: PlaneTakeoff, title: "Safe Return Coordination", desc: "We plan your return journey and ensure post-care follow-up from home." },
];

const testimonials = [
  {
    name: "Amina O.",
    location: "Lagos, Nigeria",
    flag: "🇳🇬",
    text: "I was terrified of traveling alone for my heart surgery. StayOnStay arranged everything — pickup, hotel, even a translator. I felt safe the entire time.",
    rating: 5,
  },
  {
    name: "David K.",
    location: "Nairobi, Kenya",
    flag: "🇰🇪",
    text: "My hip replacement in India cost a third of what I was quoted in Nairobi. The hospital was world-class and the StayOnStay team was with me every step.",
    rating: 5,
  },
  {
    name: "Grace A.",
    location: "Accra, Ghana",
    flag: "🇬🇭",
    text: "I couldn't believe how smooth everything was. From the WhatsApp consultation to the ride from the airport — someone was always there for me.",
    rating: 5,
  },
];

const africaFlags = [
  { flag: "🇳🇬", name: "Nigeria" },
  { flag: "🇰🇪", name: "Kenya" },
  { flag: "🇬🇭", name: "Ghana" },
  { flag: "🇿🇦", name: "South Africa" },
  { flag: "🇺🇬", name: "Uganda" },
  { flag: "🇹🇿", name: "Tanzania" },
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
      className="relative min-h-[min(100vh,920px)] flex items-center overflow-hidden pt-8 bg-gradient-to-br from-muted/90 via-background to-muted/50"
    >
      <motion.div style={{ x: bgX, y: bgY }} className="absolute top-20 right-10 w-72 h-72 rounded-full bg-primary/5 blur-3xl" />
      <div className="max-w-page mx-auto w-full grid md:grid-cols-2 gap-12 items-center relative z-10 px-4 sm:px-6 lg:px-8 py-12">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full mb-6"
          >
            <Shield className="w-3.5 h-3.5" />
            Trusted by patients across Africa 🇳🇬 🇰🇪 🇬🇭 🇿🇦
          </motion.div>

          <h2 className="font-heading text-4xl md:text-5xl lg:text-[3.4rem] font-bold text-foreground leading-tight mb-6 text-balance">
            Travel to India for Affordable Treatment — <span className="text-primary">We Handle Everything</span>
          </h2>

          <p className="text-lg text-muted-foreground max-w-lg mb-8 leading-relaxed">
            From airport pickup to recovery stay, we guide your entire journey safely and stress-free.
          </p>

          <div className="flex flex-wrap gap-4">
            <motion.a
              href="#mt-cta"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-br from-primary to-primary/85 text-primary-foreground font-semibold px-8 py-3.5 rounded-xl inline-flex items-center gap-2 shadow-premium relative overflow-hidden"
            >
              Get My Treatment Plan
              <ArrowRight className="w-4 h-4" />
            </motion.a>
            <motion.a
              href="https://wa.me/1234567890"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="bg-card text-foreground font-medium px-8 py-3.5 rounded-xl border border-border shadow-sm inline-flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Talk to a Care Guide
            </motion.a>
          </div>

          <p className="text-xs text-muted-foreground mt-6 max-w-md leading-relaxed italic">
            We don't provide treatment — we connect you with trusted hospitals and manage your journey.
          </p>

          <div className="flex flex-wrap items-center gap-6 mt-6">
            <div className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">10,000+</span> patients guided
            </div>
            <div className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">50+</span> partner hospitals
            </div>
            <div className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Save 70%</span> on average
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
              alt="Modern international hospital in India"
              className="w-full rounded-xl object-cover aspect-[16/10]"
              width={1200}
              height={750}
              loading="lazy"
            />
            <div className="absolute -bottom-4 -left-4 px-5 py-3 rounded-xl bg-card/90 backdrop-blur border border-border shadow-elevated">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                <span className="text-sm font-medium text-foreground">JCI Accredited</span>
              </div>
            </div>
            <div className="absolute -top-3 -right-3 px-5 py-3 rounded-xl bg-card/90 backdrop-blur border border-border shadow-elevated">
              <span className="text-sm font-medium text-primary">Save up to 70%</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function WhyTravelWithUsBlock() {
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
          <span className="text-sm font-medium text-primary uppercase tracking-wider">Why Travel With Us</span>
          <h3 className="font-heading text-3xl md:text-4xl font-bold text-foreground mt-3 text-balance">
            We Handle Everything — So You Don&apos;t Have To
          </h3>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">You focus on healing. We handle the rest.</p>
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
              <h4 className="font-heading text-base font-semibold text-foreground mb-2">{s.title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function JourneyBlock() {
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
            <span className="text-sm font-medium text-primary uppercase tracking-wider">How It Works</span>
            <h3 className="font-heading text-3xl md:text-4xl font-bold text-foreground mt-3">Your Journey, Step by Step</h3>
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto">No confusion. No stress. We guide you through every stage.</p>
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
                      <span className="text-xs font-bold text-primary">Step {i + 1}</span>
                      {i === 0 && (
                        <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">You are here</span>
                      )}
                    </div>
                    <h4 className="font-heading text-base md:text-lg font-semibold text-foreground">{step.title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed mt-1">{step.desc}</p>
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
          <span className="text-sm font-medium text-primary uppercase tracking-wider">Treatments</span>
          <h3 className="font-heading text-3xl md:text-4xl font-bold text-foreground mt-3">Find the Right Treatment — Without the Stress</h3>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
            Access world-class procedures at India&apos;s top hospitals — at a fraction of the cost.
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
                  <span className="bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full">{t.tag}</span>
                )}
                {t.badge && (
                  <span className="bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full">{t.badge}</span>
                )}
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/15 transition-colors">
                <t.icon className="w-5 h-5 text-primary" />
              </div>
              <h4 className="font-heading text-lg font-semibold text-foreground mb-1">{t.name}</h4>
              <p className="text-primary font-semibold text-sm">{t.price}</p>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6 }}
          className="text-center text-xs text-muted-foreground mt-10 italic"
        >
          We connect you to trusted hospitals in India — we are facilitators, not providers.
        </motion.p>
      </div>
    </section>
  );
}

function HospitalsBlock() {
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
          <span className="text-sm font-medium text-primary uppercase tracking-wider">Partner Hospitals</span>
          <h3 className="font-heading text-3xl md:text-4xl font-bold text-foreground mt-3">India&apos;s Best JCI-Accredited Hospitals</h3>
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
                  <span className="bg-primary/10 text-primary text-xs font-medium px-3 py-1 rounded-full">{h.accreditation} Accredited</span>
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
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [selected, setSelected] = useState<Country>("nigeria");
  const comparisons = costData[selected];

  return (
    <section id="mt-pricing" className={sectionPad} ref={ref}>
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <span className="text-sm font-medium text-primary uppercase tracking-wider">Pricing</span>
          <h3 className="font-heading text-3xl md:text-4xl font-bold text-foreground mt-3">See How Much You Can Save</h3>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
            Compare what you&apos;d pay locally vs. treatment in India — same quality, fraction of the price.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-3 mb-10"
        >
          {countries.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelected(c.id)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                selected === c.id
                  ? "bg-gradient-to-br from-primary to-primary/85 text-primary-foreground shadow-md"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30",
              )}
            >
              {c.flag} {c.label}
            </button>
          ))}
        </motion.div>

        <div className="space-y-4">
          {comparisons.map((c, i) => {
            const savings = Math.round(((c.local - c.india) / c.local) * 100);
            return (
              <motion.div
                key={`${selected}-${c.procedure}`}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className={cn(glass, "p-6 flex flex-col sm:flex-row sm:items-center gap-4")}
              >
                <div className="flex-1">
                  <h4 className="font-heading font-semibold text-foreground">{c.procedure}</h4>
                </div>
                <div className="flex items-center gap-6 sm:gap-10 flex-wrap">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Local Cost</p>
                    <p className="font-heading font-bold text-foreground line-through opacity-50">
                      <AnimatedNumber value={c.local} inView={inView} />
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">India</p>
                    <p className="font-heading font-bold text-primary text-lg">
                      <AnimatedNumber value={c.india} inView={inView} />
                    </p>
                  </div>
                  <div className="bg-primary/10 text-primary text-sm font-bold px-4 py-1.5 rounded-full">{savings}% savings</div>
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
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className={cn(sectionPad, "bg-muted/30")} ref={ref}>
      <div className="max-w-page mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-primary uppercase tracking-wider">Why India</span>
          <h3 className="font-heading text-3xl md:text-4xl font-bold text-foreground mt-3">Why Patients Choose India</h3>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {whyIndiaReasons.map((r, i) => (
            <motion.div
              key={r.title}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              whileHover={{ scale: 1.03, transition: { type: "spring", stiffness: 120, damping: 14 } }}
              className={cn(glassHover, "p-8 text-center cursor-default")}
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                <r.icon className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-heading text-lg font-semibold text-foreground mb-2">{r.title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{r.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SafetyCareBlock() {
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
          <span className="text-sm font-medium text-primary uppercase tracking-wider">Safety & Care</span>
          <h3 className="font-heading text-3xl md:text-4xl font-bold text-foreground mt-3 text-balance">
            From Airport to Recovery — You&apos;re Never Alone
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
              <h4 className="font-heading text-base font-semibold text-foreground mb-2">{p.title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsBlock() {
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
          <span className="text-sm font-medium text-primary uppercase tracking-wider">Testimonials</span>
          <h3 className="font-heading text-3xl md:text-4xl font-bold text-foreground mt-3">Stories From African Patients</h3>
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
              <p className="text-foreground/80 leading-relaxed mb-6 text-sm">{t.text}</p>
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
          <span className="text-sm font-medium text-primary uppercase tracking-wider">For Africa</span>
          <h3 className="font-heading text-3xl md:text-4xl font-bold text-foreground mt-3">Trusted by Patients Across Africa</h3>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
            We serve patients from across the continent with local WhatsApp support and region-specific guidance.
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
              key={f.name}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.3, delay: 0.3 + i * 0.08 }}
              className="flex flex-col items-center gap-2"
            >
              <span className="text-5xl">{f.flag}</span>
              <span className="text-xs font-medium text-muted-foreground">{f.name}</span>
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
            <p className="font-heading font-semibold text-foreground">Reach us on WhatsApp</p>
            <p className="text-sm text-muted-foreground">Get instant support from a care guide in your region.</p>
          </div>
          <a
            href="https://wa.me/1234567890"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 bg-green-600 text-white font-medium text-sm px-6 py-2.5 rounded-xl hover:bg-green-700 transition-colors"
          >
            Chat Now
          </a>
        </motion.div>
      </div>
    </section>
  );
}

function CTABlock() {
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
            Ready to Start Your Healing Journey?
          </h3>
          <p className="text-primary-foreground/80 max-w-lg mx-auto mb-4 leading-relaxed">
            Talk to a Care Guide — we&apos;ll plan your entire trip for free.
          </p>
          <p className="text-primary-foreground/60 text-sm mb-8 italic">You focus on healing. We handle the rest.</p>

          <div className="flex flex-wrap justify-center gap-4">
            <motion.a
              href="#medical-tourism"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="bg-primary-foreground text-primary font-semibold px-8 py-3.5 rounded-xl inline-flex items-center gap-2 shadow-lg"
            >
              Get My Treatment Plan
              <ArrowRight className="w-4 h-4" />
            </motion.a>
            <motion.a
              href="https://wa.me/1234567890"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="border-2 border-primary-foreground/30 text-primary-foreground font-medium px-8 py-3.5 rounded-xl inline-flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Chat on WhatsApp
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
