import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  animate,
  AnimatePresence,
  motion,
  useInView,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type Variants,
} from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, MessageCircle, MapPin, VolumeX } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import {
  EXPLORE_CATEGORIES,
  exploreIndiaPlaces,
  placesByCategory,
  type ExploreCategory,
} from "@/lib/exploreIndiaPlaces";
import { whatsappMeUrl, whatsappNumberForVisitor } from "@/lib/whatsappContact";

const MotionLink = motion.create(Link);

/**
 * Colour psychology (medical-travel context):
 * — Deep indigo / ink: trust, night calm, premium (hospital-adjacent reassurance)
 * — Saffron & honey gold: warmth, optimism, cultural India without alarm-red fatigue
 * — Teal emeralds: recovery / vitality / “healing journey”
 * — Soft coral (sparingly): human warmth on CTAs
 */
const C = {
  ink: "#0a0e1a",
  inkMid: "#121a2e",
  saffron: "#c8943f",
  saffronLight: "#e8c078",
  honey: "#f4e4c1",
  teal: "#0f766e",
  tealGlow: "#2dd4bf",
  coral: "#e07a5f",
  mist: "#e8eef5",
  white: "#faf8f5",
} as const;

const HERO_VIDEO_MP4 =
  "https://assets.mixkit.co/videos/preview/mixkit-taj-mahal-in-india-from-above-15908-large.mp4";
const HERO_POSTER =
  "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=1920&q=85&auto=format&fit=crop&ixlib=rb-4.0.3";

const mosaicPick = exploreIndiaPlaces.slice(0, 4);
const PLACE_COUNT = exploreIndiaPlaces.length;

const springGentle = { type: "spring" as const, stiffness: 120, damping: 22, mass: 0.8 };
const springSnappy = { type: "spring" as const, stiffness: 280, damping: 28 };

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, ...springGentle },
  }),
};

function useCountUp(end: number, duration = 2.2) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-12%" });
  const [val, setVal] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setVal(end);
      return;
    }
    const ctrl = animate(0, end, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setVal(Math.round(v)),
    });
    return () => ctrl.stop();
  }, [inView, end, duration, reduce]);

  return { ref, val };
}

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-[60] h-[3px] origin-left pointer-events-none"
      style={{
        scaleX,
        background: `linear-gradient(90deg, ${C.teal} 0%, ${C.saffron} 50%, ${C.coral} 100%)`,
      }}
    />
  );
}

function AmbientGlow() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <motion.div
        className="absolute -top-1/4 -left-1/4 w-[70vw] h-[70vw] rounded-full opacity-[0.12]"
        style={{
          background: `radial-gradient(circle, ${C.tealGlow} 0%, transparent 70%)`,
        }}
        animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-1/4 -right-1/4 w-[60vw] h-[60vw] rounded-full opacity-[0.1]"
        style={{
          background: `radial-gradient(circle, ${C.saffronLight} 0%, transparent 65%)`,
        }}
        animate={{ x: [0, -24, 0], y: [0, -16, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

function DragRailCarousel({ onPlan }: { onPlan: () => void }) {
  const { t } = useI18n();
  const reduce = useReducedMotion();
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const [maxDrag, setMaxDrag] = useState(0);

  const measure = useCallback(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    const diff = outer.clientWidth - inner.scrollWidth;
    const nextMax = Math.min(0, diff);
    setMaxDrag(nextMax);
    const cur = x.get();
    if (cur < nextMax) x.set(nextMax);
    if (cur > 0) x.set(0);
  }, [x]);

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (outerRef.current) ro.observe(outerRef.current);
    if (innerRef.current) ro.observe(innerRef.current);
    window.addEventListener("orientationchange", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("orientationchange", measure);
    };
  }, [measure]);

  const nudge = (dir: -1 | 1) => {
    const inner = innerRef.current;
    if (!inner) return;
    const card = inner.querySelector<HTMLElement>("[data-rail-card]");
    const step = (card?.offsetWidth ?? 320) + 24;
    const current = x.get();
    const next = Math.max(maxDrag, Math.min(0, current - dir * step));
    animate(x, next, springSnappy);
  };

  return (
    <div className="relative">
      <p className="text-center text-xs uppercase tracking-[0.35em] text-white/45 mb-6">
        {t("explore.drag.hint")}
      </p>
      <div
        ref={outerRef}
        className="overflow-hidden pb-4 -mx-2 px-2 cursor-grab active:cursor-grabbing"
        style={{ touchAction: reduce ? undefined : "pan-y" }}
      >
        <motion.div
          ref={innerRef}
          className="flex gap-5 md:gap-7 w-max px-4 md:px-8"
          style={{ x }}
          drag={reduce ? false : "x"}
          dragConstraints={{ left: maxDrag, right: 0 }}
          dragElastic={0.08}
          dragTransition={{ bounceStiffness: 400, bounceDamping: 35 }}
        >
          {exploreIndiaPlaces.map((p, idx) => (
            <motion.article
              key={p.id}
              data-rail-card
              initial={reduce ? false : { opacity: 0, y: 36, rotateY: -8 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0, rotateY: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ ...springGentle, delay: idx * 0.04 }}
              whileHover={reduce ? undefined : { y: -8, transition: springSnappy }}
              className="relative shrink-0 w-[min(88vw,340px)] sm:w-[300px] md:w-[320px] h-[min(78vh,480px)] rounded-[1.75rem] overflow-hidden snap-center shadow-[0_24px_80px_-20px_rgba(10,14,26,0.45)] border border-white/10"
              style={{
                background: `linear-gradient(165deg, ${C.inkMid} 0%, ${C.ink} 100%)`,
              }}
            >
              <motion.img
                src={p.image}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
                whileHover={reduce ? undefined : { scale: 1.06 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              />
              <div
                className="absolute inset-0 opacity-90"
                style={{
                  background: `linear-gradient(to top, ${C.ink} 0%, transparent 45%, rgba(10,14,26,0.25) 100%)`,
                }}
              />
              <div className="absolute inset-x-0 bottom-0 p-6 md:p-7">
                <motion.p
                  className="text-xs font-bold uppercase tracking-[0.2em] mb-2"
                  style={{ color: C.saffronLight }}
                >
                  {p.region}
                </motion.p>
                <h4 className="text-white text-2xl font-semibold tracking-tight leading-tight mb-2">{p.name}</h4>
                <p className="text-white/75 text-sm leading-relaxed line-clamp-2 mb-5">{p.tagline}</p>
                <motion.button
                  type="button"
                  onClick={onPlan}
                  className="inline-flex items-center rounded-full px-6 py-2.5 text-sm font-semibold text-[#0a0e1a]"
                  style={{
                    background: `linear-gradient(135deg, ${C.honey} 0%, ${C.saffronLight} 100%)`,
                    boxShadow: `0 8px 32px -8px ${C.saffron}`,
                  }}
                  whileHover={{ scale: 1.04, boxShadow: `0 12px 40px -8px ${C.tealGlow}` }}
                  whileTap={{ scale: 0.97 }}
                  transition={springSnappy}
                >
                  {t("explore.carousel.explore")}
                </motion.button>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>
      <div className="flex justify-center gap-4 mt-2">
        <motion.button
          type="button"
          aria-label="Previous"
          className="h-11 w-11 rounded-full border border-white/20 bg-white/10 backdrop-blur-md text-white flex items-center justify-center"
          whileHover={{ scale: 1.08, backgroundColor: "rgba(255,255,255,0.18)" }}
          whileTap={{ scale: 0.92 }}
          onClick={() => nudge(-1)}
        >
          <ChevronLeft className="h-5 w-5" />
        </motion.button>
        <motion.button
          type="button"
          aria-label="Next"
          className="h-11 w-11 rounded-full border border-white/20 bg-white/10 backdrop-blur-md text-white flex items-center justify-center"
          whileHover={{ scale: 1.08, backgroundColor: "rgba(255,255,255,0.18)" }}
          whileTap={{ scale: 0.92 }}
          onClick={() => nudge(1)}
        >
          <ChevronRight className="h-5 w-5" />
        </motion.button>
      </div>
    </div>
  );
}

export default function ExploreIndiaView() {
  const { t } = useI18n();
  const [category, setCategory] = useState<ExploreCategory | "all">("all");
  const filtered = useMemo(() => placesByCategory(category), [category]);
  const reduce = useReducedMotion();

  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 120]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 1.12]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0.35]);

  const stat200 = useCountUp(200, 2.4);
  const statPlaces = useCountUp(PLACE_COUNT, 1.6);
  const statCats = useCountUp(EXPLORE_CATEGORIES.length, 1.2);

  const openPlanWhatsApp = () => {
    // Specifically use India number for Explore India planning
    const n = "919312972981"; 
    window.open(
      whatsappMeUrl(
        n,
        "Hi — I’m on a medical trip in Delhi NCR. Please suggest a light sightseeing plan between my appointments.",
      ),
      "_blank",
      "noopener,noreferrer",
    );
  };

  const scrollToId = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const glowX = useMotionValue(50);
  const glowY = useMotionValue(50);
  const spotlight = useMotionTemplate`radial-gradient(600px circle at ${glowX}% ${glowY}%, rgba(45,212,191,0.08), transparent 55%)`;

  return (
    <main
      className="relative text-foreground overflow-x-hidden min-h-screen"
      style={{
        backgroundColor: C.ink,
        color: C.white,
      }}
      onPointerMove={(e) => {
        if (reduce) return;
        const { clientX, clientY, currentTarget } = e;
        const { width, height, left, top } = currentTarget.getBoundingClientRect();
        glowX.set(((clientX - left) / width) * 100);
        glowY.set(((clientY - top) / height) * 100);
      }}
    >
      <ScrollProgress />

      {/* Pointer-following ambient spotlight (desktop) */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-[1] hidden lg:block"
        style={{ background: spotlight }}
      />

      {/* Sticky edge CTAs */}
      <motion.div
        className="hidden xl:flex fixed left-0 top-[40%] -translate-y-1/2 z-40 flex-col pointer-events-none"
        initial={{ x: -12, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.8, ...springGentle }}
      >
        <MotionLink
          to="/#hotels"
          className="pointer-events-auto text-[11px] font-bold tracking-[0.2em] uppercase py-12 px-3 rounded-r-2xl text-white shadow-2xl"
          style={{
            writingMode: "vertical-rl",
            background: `linear-gradient(180deg, ${C.teal} 0%, ${C.inkMid} 100%)`,
            boxShadow: `4px 0 40px -10px ${C.tealGlow}`,
          }}
          whileHover={{ x: 4, transition: springSnappy }}
          whileTap={{ scale: 0.98 }}
        >
          {t("explore.sticky.plan")}
        </MotionLink>
      </motion.div>
      <motion.div
        className="hidden xl:flex fixed right-0 top-[40%] -translate-y-1/2 z-40 pointer-events-none"
        initial={{ x: 12, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.9, ...springGentle }}
      >
        <motion.button
          type="button"
          onClick={openPlanWhatsApp}
          className="pointer-events-auto text-[11px] font-bold tracking-[0.2em] uppercase py-12 px-3 rounded-l-2xl text-white shadow-2xl"
          style={{
            writingMode: "vertical-rl",
            background: `linear-gradient(180deg, ${C.coral} 0%, ${C.saffron} 100%)`,
          }}
          whileHover={{ x: -4, transition: springSnappy }}
          whileTap={{ scale: 0.98 }}
        >
          {t("explore.sticky.whatsapp")}
        </motion.button>
      </motion.div>

      {/* —— Hero: video + parallax + layered colour grading —— */}
      <section
        ref={heroRef}
        className="relative min-h-[100svh] flex flex-col items-center justify-center overflow-hidden"
      >
        <motion.div className="absolute inset-0 z-0" style={{ y: heroY, scale: heroScale }}>
          <video
            className="h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            poster={HERO_POSTER}
            aria-label={t("explore.hero.title")}
          >
            <source src={HERO_VIDEO_MP4} type="video/mp4" />
          </video>
        </motion.div>

        {/* Cinematic grade: lift shadows toward indigo, warm lift in mids */}
        <div
          className="absolute inset-0 z-[1]"
          style={{
            background: `
              linear-gradient(180deg, rgba(10,14,26,0.55) 0%, rgba(10,14,26,0.15) 35%, rgba(10,14,26,0.75) 100%),
              linear-gradient(125deg, rgba(15,118,110,0.12) 0%, transparent 50%),
              linear-gradient(215deg, rgba(200,148,63,0.15) 0%, transparent 45%)
            `,
          }}
        />
        <motion.div className="absolute inset-0 z-[2]" style={{ opacity: heroOpacity }} aria-hidden />

        <motion.div
          className="absolute top-24 right-6 md:right-10 z-20 flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/90 border border-white/20 bg-black/30 backdrop-blur-md"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, ...springGentle }}
        >
          <VolumeX className="h-3.5 w-3.5" aria-hidden />
          {t("explore.video.badge")}
        </motion.div>

        <div className="relative z-10 text-center px-5 max-w-5xl mx-auto pt-28 pb-32">
          <motion.p
            className="text-xs sm:text-sm font-semibold tracking-[0.35em] uppercase mb-6"
            style={{ color: C.tealGlow }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, ...springGentle }}
          >
            {t("explore.hero.kicker")}
          </motion.p>
          <motion.h1
            className="text-white text-[clamp(2.75rem,10vw,7rem)] font-black tracking-tight leading-[0.92] mb-5"
            style={{ textShadow: `0 4px 80px ${C.ink}` }}
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, ...springGentle }}
          >
            {t("explore.hero.title")}
          </motion.h1>
          <motion.p
            className="text-lg sm:text-2xl md:text-3xl font-light tracking-wide mb-3"
            style={{ color: C.honey }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.8 }}
          >
            {t("explore.hero.sub")}
          </motion.p>
          <motion.p
            className="text-base sm:text-lg font-medium mb-8"
            style={{ color: C.saffronLight }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45, duration: 0.8 }}
          >
            {t("explore.hero.delhi")}
          </motion.p>
          <motion.p
            className="text-sm max-w-xl mx-auto mb-12 leading-relaxed"
            style={{ color: "rgba(250,248,245,0.72)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55, duration: 0.8 }}
          >
            {t("explore.hero.note")}
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, ...springGentle }}
          >
            <motion.button
              type="button"
              onClick={() => scrollToId("explore-mosaic")}
              className="rounded-full px-11 py-3.5 text-[15px] font-semibold"
              style={{
                color: C.ink,
                background: `linear-gradient(135deg, ${C.white} 0%, ${C.honey} 100%)`,
                boxShadow: `0 12px 48px -12px rgba(232,192,120,0.5)`,
              }}
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={springSnappy}
            >
              {t("explore.hero.cta")}
            </motion.button>
            <motion.button
              type="button"
              onClick={openPlanWhatsApp}
              className="rounded-full px-9 py-3.5 text-[15px] font-semibold flex items-center gap-2 border border-white/35 text-white bg-white/5 backdrop-blur-md"
              whileHover={{
                scale: 1.04,
                borderColor: "rgba(45,212,191,0.5)",
                backgroundColor: "rgba(15,118,110,0.2)",
              }}
              whileTap={{ scale: 0.97 }}
              transition={springSnappy}
            >
              <MessageCircle className="h-5 w-5" style={{ color: C.tealGlow }} />
              {t("explore.cta.whatsapp")}
            </motion.button>
          </motion.div>
        </div>

        <motion.div
          className="absolute bottom-0 left-0 right-0 z-10 overflow-hidden border-t border-white/10 bg-black/25 backdrop-blur-md py-3"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.85, ...springGentle }}
        >
          <motion.div
            className="flex whitespace-nowrap text-xs sm:text-sm font-medium tracking-wide"
            style={{ color: "rgba(250,248,245,0.55)" }}
            animate={{ x: reduce ? 0 : ["0%", "-50%"] }}
            transition={{ duration: 36, repeat: Infinity, ease: "linear" }}
          >
            <span className="px-8">{t("explore.marquee")}</span>
            <span className="px-8" aria-hidden>
              {t("explore.marquee")}
            </span>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats — trust numerics */}
      <section
        className="relative py-16 md:py-20 overflow-hidden"
        style={{
          background: `linear-gradient(180deg, ${C.ink} 0%, ${C.inkMid} 50%, #0f1729 100%)`,
        }}
      >
        <AmbientGlow />
        <div className="relative z-10 max-w-page mx-auto px-5 grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6 text-center">
          {[
            { ref: stat200.ref, val: stat200.val, suffix: "+", label: t("explore.stat.curated"), sub: t("explore.stat.radius") },
            { ref: statPlaces.ref, val: statPlaces.val, suffix: "+", label: t("explore.stat.guide"), sub: t("explore.stat.guideSub") },
            { ref: statCats.ref, val: statCats.val, suffix: "", label: t("explore.stat.categories"), sub: t("explore.band.hint") },
          ].map((s, i) => (
            <motion.div
              key={i}
              ref={s.ref}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ delay: i * 0.1, ...springGentle }}
              className="rounded-3xl p-8 border border-white/10"
              style={{
                background: `linear-gradient(145deg, rgba(255,255,255,0.04) 0%, transparent 100%)`,
              }}
            >
              <div
                className="text-5xl md:text-6xl font-black tabular-nums mb-2"
                style={{
                  background: `linear-gradient(135deg, ${C.white} 0%, ${C.saffronLight} 100%)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {s.val}
                {s.suffix}
              </div>
              <p className="text-white font-semibold text-sm tracking-wide">{s.label}</p>
              <p className="text-white/50 text-xs mt-2 leading-relaxed max-w-xs mx-auto">{s.sub}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ATTRACTIONS band — cool mist (open sky feeling) */}
      <section
        className="relative py-20 md:py-28 overflow-hidden"
        style={{
          background: `linear-gradient(180deg, #dfe9f4 0%, ${C.mist} 40%, #cfd9e8 100%)`,
        }}
      >
        <motion.div
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${C.tealGlow} 0%, transparent 70%)`,
          }}
          animate={reduce ? undefined : { opacity: [0.2, 0.35, 0.2] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <div className="relative max-w-page mx-auto px-5 text-center">
          <motion.h2
            className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight mb-4"
            style={{ color: C.inkMid }}
            initial={{ opacity: 0, letterSpacing: "0.15em" }}
            whileInView={{ opacity: 1, letterSpacing: "-0.02em" }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            {t("explore.strip1.title")}
          </motion.h2>
          <motion.p
            className="text-lg md:text-xl font-light italic max-w-2xl mx-auto"
            style={{ color: "#3d4f66" }}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, ...springGentle }}
          >
            {t("explore.strip1.sub")}
          </motion.p>
        </div>
      </section>

      {/* Mosaic */}
      <section
        id="explore-mosaic"
        className="relative py-20 md:py-28"
        style={{ background: `linear-gradient(180deg, #0f1729 0%, ${C.ink} 100%)` }}
      >
        <div className="max-w-page mx-auto px-5">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={springGentle}
          >
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-3">{t("explore.mosaic.title")}</h3>
            <p className="text-white/55 max-w-2xl mx-auto leading-relaxed">{t("explore.mosaic.sub")}</p>
          </motion.div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {mosaicPick.map((p, i) => (
              <motion.button
                key={p.id}
                type="button"
                onClick={() => scrollToId("explore-carousel")}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-5%" }}
                whileHover={reduce ? undefined : { y: -10, transition: springSnappy }}
                whileTap={{ scale: 0.98 }}
                className="group relative aspect-[3/4] overflow-hidden rounded-3xl text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/80"
                style={{
                  boxShadow: `0 20px 60px -20px rgba(0,0,0,0.6)`,
                }}
              >
                <img src={p.image} alt="" className="h-full w-full object-cover" loading="lazy" />
                <div
                  className="absolute inset-0 opacity-95 transition-opacity duration-500 group-hover:opacity-100"
                  style={{
                    background: `linear-gradient(to top, ${C.ink} 0%, transparent 50%)`,
                  }}
                />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <p className="text-white font-bold text-lg leading-tight">{p.name}</p>
                  <p className="text-white/65 text-xs mt-2 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0" style={{ color: C.tealGlow }} />
                    {p.region}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Drag rail carousel */}
      <section
        id="explore-carousel"
        className="relative py-20 md:py-28 border-y border-white/10"
        style={{
          background: `linear-gradient(165deg, #111827 0%, ${C.inkMid} 40%, #0c1222 100%)`,
        }}
      >
        <div className="max-w-page mx-auto px-5 mb-12 text-center">
          <motion.h3
            className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={springGentle}
          >
            {t("explore.carousel.title")}
          </motion.h3>
          <motion.p
            className="text-white/55 max-w-2xl mx-auto text-sm md:text-base leading-relaxed"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.12, ...springGentle }}
          >
            {t("explore.carousel.sub")}
          </motion.p>
        </div>
        <DragRailCarousel onPlan={openPlanWhatsApp} />
      </section>

      {/* Honey-gold band + filters */}
      <section
        className="relative py-20 md:py-28 overflow-hidden"
        style={{
          background: `linear-gradient(155deg, #c8943f 0%, #d4a84b 35%, #a67c2e 100%)`,
        }}
      >
        <motion.div
          className="absolute inset-0 mix-blend-overlay opacity-30"
          style={{ background: `repeating-linear-gradient(-45deg, transparent, transparent 12px, rgba(0,0,0,0.04) 12px, rgba(0,0,0,0.04) 24px)` }}
        />
        <div className="relative z-10 max-w-page mx-auto px-5 text-center">
          <motion.h3
            className="text-3xl md:text-5xl font-black text-white drop-shadow-md tracking-tight mb-3"
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={springGentle}
          >
            {t("explore.band.title")}
          </motion.h3>
          <p className="text-white/95 text-sm md:text-lg font-light mb-2">{t("explore.band.sub")}</p>
          <p className="text-white/85 text-xs md:text-sm max-w-2xl mx-auto mb-10">{t("explore.band.hint")}</p>

          <div className="flex flex-wrap justify-center gap-2.5 mb-12">
            {(["all", ...EXPLORE_CATEGORIES.map((c) => c.id)] as const).map((id) => {
              const active = category === id;
              const label =
                id === "all" ? t("explore.cat.all") : t(EXPLORE_CATEGORIES.find((c) => c.id === id)!.labelKey);
              return (
                <motion.button
                  key={id}
                  type="button"
                  onClick={() => setCategory(id)}
                  layout
                  className="rounded-full px-5 py-2.5 text-sm font-semibold transition-colors"
                  style={{
                    background: active ? C.ink : "rgba(255,255,255,0.92)",
                    color: active ? C.white : C.ink,
                    boxShadow: active ? `0 8px 32px -8px ${C.ink}` : undefined,
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.96 }}
                  transition={springSnappy}
                >
                  {label}
                </motion.button>
              );
            })}
          </div>

          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
            <AnimatePresence mode="popLayout">
              {filtered.map((p) => (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, scale: 0.94, filter: "blur(4px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 0.9, filter: "blur(4px)" }}
                  transition={springGentle}
                  className="flex flex-col sm:flex-row rounded-2xl overflow-hidden border border-black/10 shadow-xl"
                  style={{ background: "rgba(10,14,26,0.88)" }}
                >
                  <div className="sm:w-[130px] shrink-0 h-36 sm:min-h-[140px]">
                    <motion.img
                      src={p.image}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                      whileHover={reduce ? undefined : { scale: 1.08 }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <div className="p-4 flex flex-col justify-center min-w-0">
                    <p className="font-bold text-[10px] uppercase tracking-widest" style={{ color: C.saffronLight }}>
                      {p.region}
                    </p>
                    <h4 className="text-white font-bold text-lg leading-snug mt-1">{p.name}</h4>
                    {p.distance && <p className="text-white/50 text-xs mt-1">{p.distance}</p>}
                    <p className="text-white/70 text-sm mt-2 line-clamp-2">{p.tagline}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* Teal conviction strip */}
      <section
        className="py-16 md:py-22 text-center px-5 relative overflow-hidden"
        style={{
          background: `linear-gradient(90deg, ${C.teal} 0%, #0d9488 50%, #115e59 100%)`,
        }}
      >
        <motion.div
          className="absolute inset-0 opacity-20"
          animate={reduce ? undefined : { backgroundPosition: ["0% 0%", "100% 100%"] }}
          transition={{ duration: 20, repeat: Infinity, repeatType: "reverse" }}
          style={{
            backgroundImage: `linear-gradient(110deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)`,
            backgroundSize: "200% 200%",
          }}
        />
        <motion.h3
          className="relative text-2xl md:text-4xl font-black text-white tracking-tight mb-3"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={springGentle}
        >
          {t("explore.red.title")}
        </motion.h3>
        <motion.p
          className="relative text-white/90 text-sm md:text-base max-w-xl mx-auto leading-relaxed"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, ...springGentle }}
        >
          {t("explore.red.sub")}
        </motion.p>
      </section>

      {/* Final CTA — same visual language as /med-tourism healing journey card (trust + action) */}
      <section
        className="relative py-20 md:py-28 px-4 sm:px-6 lg:px-8"
        style={{
          background: `radial-gradient(ellipse 120% 80% at 50% 100%, ${C.inkMid} 0%, ${C.ink} 70%)`,
        }}
      >
        <motion.div
          className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-white/15 px-1 py-1 shadow-[0_32px_80px_-24px_rgba(0,0,0,0.55)] sm:rounded-[2.25rem]"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={springGentle}
        >
          <div
            className="absolute inset-0 rounded-[1.85rem] sm:rounded-[2.1rem]"
            style={{
              background: "linear-gradient(135deg, hsl(var(--primary)) 0%, #0ea5e9 42%, #059669 100%)",
            }}
          />
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/20 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-emerald-300/30 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 rounded-[1.85rem] ring-1 ring-inset ring-white/20 sm:rounded-[2.1rem]"
            aria-hidden
          />

          <div className="relative z-10 px-6 py-12 text-center sm:px-10 sm:py-14 md:px-14 md:py-16">
            <h3 className="font-heading text-balance text-3xl font-black tracking-tight text-white drop-shadow-sm sm:text-4xl md:text-[2.35rem] md:leading-[1.12]">
              {t("explore.cta.title")}
            </h3>
            <p className="mx-auto mt-5 max-w-xl text-base font-medium leading-relaxed text-white/95 sm:text-lg">
              {t("explore.cta.body")}
            </p>

            <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <MotionLink
                to="/med-tourism"
                className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-white px-8 text-base font-bold text-primary shadow-xl shadow-black/15 sm:w-auto"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={springSnappy}
              >
                {t("explore.cta.medTourism")}
                <ArrowRight className="h-5 w-5 shrink-0" />
              </MotionLink>
              <motion.button
                type="button"
                onClick={openPlanWhatsApp}
                className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border-2 border-white/35 bg-[#25D366] px-8 text-base font-bold text-white shadow-lg ring-2 ring-white/15 hover:bg-[#20bd5a] sm:w-auto"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={springSnappy}
              >
                <MessageCircle className="h-5 w-5 shrink-0" />
                {t("explore.cta.whatsapp")}
              </motion.button>
              <MotionLink
                to="/#hotels"
                className="inline-flex min-h-[52px] w-full items-center justify-center rounded-2xl border-2 border-white/40 bg-white/10 px-8 text-base font-bold text-white backdrop-blur-sm hover:bg-white/15 sm:w-auto"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={springSnappy}
              >
                {t("explore.cta.stays")}
              </MotionLink>
            </div>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
