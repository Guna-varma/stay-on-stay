import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { rwLandingPack } from "./i18n.landing.rw";
import { FR_LANDING, ES_LANDING, AR_LANDING } from "./i18n.landing.western";
import { swLandingPack, amLandingPack, yoLandingPack, zuLandingPack, hiLandingPack, lgLandingPack, lnLandingPack, soLandingPack, ptLandingPack } from "./i18n.regionalPacks";

/**
 * This system uses region-based localization.
 * Displayed language is conversational for user trust; actual translations use fallback
 * languages (mostly English, plus French where noted in REGION_CONFIG).
 *
 * UI language ≠ translation bundle — that split is intentional for trust and MVP speed.
 */
/** UI language codes: global + African core languages + existing Asian/European */
export type LanguageCode =
  | "en"
  | "sw"
  | "am"
  | "rw"
  | "yo"
  | "zu"
  | "so"
  | "lg"
  | "ln"
  | "pt"
  | "hi"
  | "ar"
  | "fr"
  | "es";

export type TranslationKey = LanguageCode;

/** ISO-style region / market selector — country codes, not spoken languages */
export type RegionCode =
  | "ng"
  | "ke"
  | "gh"
  | "za"
  | "rw"
  | "cd"
  | "so"
  | "ug"
  | "ao"
  | "et";

/**
 * Per market: `uiLanguage` is what we show in the selector (conversational trust).
 * `translationFallback` is the string bundle `t()` uses — often English, or the closest full pack (e.g. fr for CD).
 */
export const REGION_CONFIG = {
  ng: {
    label: "Nigeria",
    countryCode: "NG",
    flagUrl: "https://flagcdn.com/w40/ng.png",
    uiLanguage: "English (Pidgin supported)",
    translationFallback: "en" as const,
  },
  ke: {
    label: "Kenya",
    countryCode: "KE",
    flagUrl: "https://flagcdn.com/w40/ke.png",
    uiLanguage: "English + Swahili (mix)",
    translationFallback: "en" as const,
  },
  gh: {
    label: "Ghana",
    countryCode: "GH",
    flagUrl: "https://flagcdn.com/w40/gh.png",
    uiLanguage: "English (local dialect friendly)",
    translationFallback: "en" as const,
  },
  za: {
    label: "South Africa",
    countryCode: "ZA",
    flagUrl: "https://flagcdn.com/w40/za.png",
    uiLanguage: "English + Zulu (mix)",
    translationFallback: "en" as const,
  },
  rw: {
    label: "Rwanda",
    countryCode: "RW",
    flagUrl: "https://flagcdn.com/w40/rw.png",
    uiLanguage: "English + Kinyarwanda",
    translationFallback: "en" as const,
  },
  cd: {
    label: "Congo",
    countryCode: "CD",
    flagUrl: "https://flagcdn.com/w40/cd.png",
    uiLanguage: "Lingala (with English support)",
    /** Lingala in UI; French bundle is the closest available full translation */
    translationFallback: "fr" as const,
  },
  so: {
    label: "Somalia",
    countryCode: "SO",
    flagUrl: "https://flagcdn.com/w40/so.png",
    uiLanguage: "Somali + English",
    translationFallback: "en" as const,
  },
  ug: {
    label: "Uganda",
    countryCode: "UG",
    flagUrl: "https://flagcdn.com/w40/ug.png",
    uiLanguage: "English + Luganda",
    translationFallback: "en" as const,
  },
  ao: {
    label: "Angola",
    countryCode: "AO",
    flagUrl: "https://flagcdn.com/w40/ao.png",
    uiLanguage: "Portuguese + English",
    translationFallback: "pt" as const,
  },
  et: {
    label: "Ethiopia",
    countryCode: "ET",
    flagUrl: "https://flagcdn.com/w40/et.png",
    uiLanguage: "Amharic + English",
    translationFallback: "am" as const,
  },
} satisfies Record<
  RegionCode,
  {
    label: string;
    countryCode: string;
    flagUrl: string;
    uiLanguage: string;
    translationFallback: TranslationKey;
  }
>;

const REGION_ORDER: RegionCode[] = ["ng", "ke", "gh", "za", "rw", "cd", "so", "ug", "ao", "et"];

/** Conversational “how we talk with you” lines (shared with med-tourism country picker) */
export const VIEWER_LOCALE_LINES: Record<RegionCode, string> = Object.fromEntries(
  REGION_ORDER.map((code) => [code, REGION_CONFIG[code].uiLanguage]),
) as Record<RegionCode, string>;

export const LANGUAGE_OPTIONS: {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
  countryCode: string;
  flagUrl: string;
  languageLine: string;
}[] = [
    { code: "en", label: "English", nativeLabel: "English", countryCode: "US", flagUrl: "https://flagcdn.com/w40/us.png", languageLine: "Global default" },
    { code: "sw", label: "Swahili", nativeLabel: "Kiswahili", countryCode: "KE", flagUrl: "https://flagcdn.com/w40/ke.png", languageLine: "East & Central Africa" },
    { code: "am", label: "Amharic", nativeLabel: "አማርኛ", countryCode: "ET", flagUrl: "https://flagcdn.com/w40/et.png", languageLine: "Ethiopia" },
    { code: "rw", label: "Kinyarwanda", nativeLabel: "Ikinyarwanda", countryCode: "RW", flagUrl: "https://flagcdn.com/w40/rw.png", languageLine: "Rwanda" },
    { code: "yo", label: "Yoruba", nativeLabel: "Yorùbá", countryCode: "NG", flagUrl: "https://flagcdn.com/w40/ng.png", languageLine: "Nigeria" },
    { code: "zu", label: "Zulu", nativeLabel: "isiZulu", countryCode: "ZA", flagUrl: "https://flagcdn.com/w40/za.png", languageLine: "South Africa" },
    { code: "so", label: "Somali", nativeLabel: "Soomaali", countryCode: "SO", flagUrl: "https://flagcdn.com/w40/so.png", languageLine: "Somalia" },
    { code: "lg", label: "Luganda", nativeLabel: "Luganda", countryCode: "UG", flagUrl: "https://flagcdn.com/w40/ug.png", languageLine: "Uganda" },
    { code: "ln", label: "Lingala", nativeLabel: "Lingála", countryCode: "CD", flagUrl: "https://flagcdn.com/w40/cd.png", languageLine: "DR Congo" },
    { code: "pt", label: "Portuguese", nativeLabel: "Português", countryCode: "AO", flagUrl: "https://flagcdn.com/w40/ao.png", languageLine: "Angola & Lusophone Africa" },
    { code: "hi", label: "Hindi", nativeLabel: "हिंदी", countryCode: "IN", flagUrl: "https://flagcdn.com/w40/in.png", languageLine: "Hindi" },
    { code: "ar", label: "Arabic", nativeLabel: "العربية", countryCode: "SA", flagUrl: "https://flagcdn.com/w40/sa.png", languageLine: "Arabic" },
    { code: "fr", label: "French", nativeLabel: "Français", countryCode: "FR", flagUrl: "https://flagcdn.com/w40/fr.png", languageLine: "French" },
    { code: "es", label: "Spanish", nativeLabel: "Español", countryCode: "ES", flagUrl: "https://flagcdn.com/w40/es.png", languageLine: "Spanish" },
  ];

/** Header + footer copy for the header language menu (see LanguageSwitcher) */
const LANG_UI_EN: Record<string, string> = {
  "lang.pageLanguage": "Your page language",
  "lang.footer":
    "We use simple, easy-to-understand language for your comfort. You can switch anytime.",
  "lang.en.label": "English",
  "lang.en.native": "English",
  "lang.en.line": "Global default",
  "lang.hi.label": "Hindi",
  "lang.hi.native": "हिंदी",
  "lang.hi.line": "Simple Hindi — common English words where it helps",
  "lang.ar.label": "Arabic",
  "lang.ar.native": "العربية",
  "lang.ar.line": "Arabic",
  "lang.fr.label": "French",
  "lang.fr.native": "Français",
  "lang.fr.line": "French",
  "lang.es.label": "Spanish",
  "lang.es.native": "Español",
  "lang.es.line": "Spanish",
  "lang.sw.label": "Swahili",
  "lang.sw.native": "Kiswahili",
  "lang.sw.line": "East & Central Africa — English words where helpful",
  "lang.am.label": "Amharic",
  "lang.am.native": "አማርኛ",
  "lang.am.line": "Ethiopia — Amharic + English where helpful",
  "lang.rw.label": "Kinyarwanda",
  "lang.rw.native": "Ikinyarwanda",
  "lang.rw.line": "Rwanda — Kinyarwanda + English",
  "lang.yo.label": "Yoruba",
  "lang.yo.native": "Yorùbá",
  "lang.yo.line": "Nigeria — Yoruba + English",
  "lang.zu.label": "Zulu",
  "lang.zu.native": "isiZulu",
  "lang.zu.line": "South Africa — Zulu + English",
  "lang.so.label": "Somali",
  "lang.so.native": "Soomaali",
  "lang.so.line": "Somali + English",
  "lang.lg.label": "Luganda",
  "lang.lg.native": "Luganda",
  "lang.lg.line": "Uganda — Luganda + English",
  "lang.ln.label": "Lingala",
  "lang.ln.native": "Lingála",
  "lang.ln.line": "DR Congo — Lingala + French/English",
  "lang.pt.label": "Portuguese",
  "lang.pt.native": "Português",
  "lang.pt.line": "Angola & Lusophone Africa — Portuguese + English",
};

const LANDING_EN: Record<string, string> = {
  ...LANG_UI_EN,
  "nav.hotels": "Hotels",
  "nav.exploreIndia": "Explore India",
  "nav.more": "More",
  "nav.hospitals": "Hospitals",
  "nav.medicalTourism": "Medical Tourism",
  "nav.services": "Services",
  "nav.support": "Support",
  "nav.login": "Login",
  "nav.signup": "Sign Up",
  "nav.contactUs": "Contact us",
  "nav.tagline": "Medical stays · India",
  "nav.group.care": "Treatment & care",
  "nav.group.stay": "Stay & travel",
  "nav.mobile.section.care": "Your treatment journey",
  "nav.mobile.section.stay": "Where you’ll stay & explore",
  "nav.mobile.section.more": "Help & services",
  "nav.dropdown.care.hint": "Costs, procedures & travel support",
  "nav.dropdown.hospitals.hint": "Accredited centres · Delhi NCR",
  "nav.dropdown.hotels.hint": "Near hospitals · live inventory",
  "nav.dropdown.explore.hint": "Heritage & recovery-friendly outings",
  "hero.title": "Healing starts with a calm place to stay — minutes from India’s best hospitals",
  "hero.subtitle":
    "Compassionate support for your whole journey: recovery-ready homes, airport pickup, hospital transfers, and a human care guide on WhatsApp. You rest — we coordinate every detail.",
  "hero.promise": "Trusted by 10,000+ patient nights with 50+ fully equipped recovery rooms available. Your health, our priority.",
  "hero.bookNow": "Book my stay",
  "hero.whatsappCta": "Chat on WhatsApp",
  "hero.whatsappPrefill": "Hello, I’d like help planning my medical stay in India.",
  "hero.searchToggle": "Search apartments (dates & area)",
  "hero.nearMe": "Near me",
  "hero.guestsLabel": "Guests",
  "hero.search": "Search",
  "hero.location": "Location",
  "hero.location.placeholder": "Area, landmark or hotel",
  "hero.hospital": "Hospital",
  "hero.hospital.placeholder": "Any hospital",
  "hero.checkin": "Check-in",
  "hero.checkout": "Check-out",
  "hero.date.placeholder": "Add date",
  "hero.badge1": "10,000+ patient nights hosted",
  "hero.badge2": "Verified apartments near hospitals",
  "hero.badge3": "WhatsApp care guides in your region",
  "quick.title": "Get a care guide in 10 seconds",
  "quick.name": "Your name",
  "quick.namePlaceholder": "e.g. Marie",
  "quick.country": "Country",
  "quick.submit": "WhatsApp us",
  "quick.anonymous": "A guest",
  "quick.prefill": "Hello, I’m {name} from {country}. I need help with a medical stay in India.",
  "quick.country.nigeria": "Nigeria",
  "quick.country.kenya": "Kenya",
  "quick.country.rwanda": "Rwanda",
  "quick.country.ghana": "Ghana",
  "quick.country.southafrica": "South Africa",
  "quick.country.uganda": "Uganda",
  "quick.country.india": "India",
  "quick.country.other": "Other / not listed",
  "trust.aria": "Trust highlights",
  "trust.patients": "10,000+ nights for medical travelers",
  "trust.verified": "Verified homes — hygiene & safety checks",
  "trust.support": "Fast replies on WhatsApp, 7 days a week",
  "trust.guide": "One care guide plans stay + hospital transfers",
  "team.kicker": "Human support",
  "team.title": "The people who answer first",
  "team.subtitle":
    "Regional care guides and coordinators — trained on Delhi NCR hospitals, recovery stays, and what families worry about most.",
  "team.1.name": "Mugwaneza Jean Bosco",
  "team.1.role": "Founder & Lead care guide · hospital transfers & stays",
  "team.1.alt": "Care guide coordinator smiling, professional portrait",
  "team.2.name": "Krishna Mandal",
  "team.2.role": "Co-founder & Clinical liaison · appointments & reports",
  "team.2.alt": "Healthcare professional in clinic setting",
  "journey.title": "Your patient journey — simple",
  "journey.subtitle": "From first visit to a booked stay, we keep every step clear and human.",
  "journey.stepLabel": "Step",
  "journey.step1.title": "You land on our site",
  "journey.step1.desc": "See real apartments, distances to hospitals, and honest pricing cues.",
  "journey.step2.title": "You feel the trust",
  "journey.step2.desc": "Clear photos, recovery-friendly spaces, and no confusing jargon.",
  "journey.step3.title": "You tap WhatsApp or Book",
  "journey.step3.desc": "Talk to a regional care guide or reserve your dates in a few taps.",
  "journey.step4.title": "You share your details",
  "journey.step4.desc": "Treatment window, family travel, reports — we organize the rest.",
  "journey.step5.title": "We help you convert",
  "journey.step5.desc": "Stay, cab, hospital coordination — one team until you’re home safe.",
  "pkg.title": "Stays that match your treatment",
  "pkg.subtitle": "Pick a starting point — your care guide finalizes the best rate for your dates.",
  "pkg.daily.title": "Daily stay",
  "pkg.daily.desc": "Short diagnostics, single-night pre-admission, or quick follow-ups.",
  "pkg.daily.price": "From ₹4,500 / night · quote on WhatsApp",
  "pkg.weekly.title": "Weekly recovery",
  "pkg.weekly.desc": "Comfortable 2BHK-style space for rest between appointments.",
  "pkg.weekly.price": "From ₹24,000 / week · includes housekeeping options",
  "pkg.medical.title": "Full medical package",
  "pkg.medical.desc": "Stay + airport pickup + hospital transfers + on-call assistance.",
  "pkg.medical.price": "Custom quote — we bundle what you actually need",
  "pkg.cta": "Get exact pricing",
  "pkg.quote.daily": "I’d like a quote for a daily medical stay in Gurugram.",
  "pkg.quote.weekly": "I’d like a quote for a weekly recovery apartment near my hospital.",
  "pkg.quote.medical": "I’d like the full medical travel package (stay + transfers + support).",
  "ctaBanner.title": "Start your journey to better health today",
  "ctaBanner.line1": "One conversation unlocks your whole trip — stays, transfers, and a calm voice on WhatsApp.",
  "ctaBanner.line2": "Compassionate planning at no cost until you’re ready to book.",
  "ctaBanner.book": "Get my care plan",
  "ctaBanner.whatsapp": "Chat on WhatsApp",
  "ctaBanner.prefill": "I’m ready to plan my medical trip to India. Please guide me.",
  "contact.title": "Reach out when you’re ready — we’re listening",
  "contact.subtitle": "WhatsApp connects you to a care guide who knows Delhi NCR hospitals and recovery stays.",
  "contact.whatsappCta": "Open WhatsApp now",
  "contact.prefill": "Hello, I’d like to speak with a care guide about my medical stay.",
  "contact.phoneLabel": "Call or WhatsApp",
  "contact.locationLabel": "Operations hub",
  "contact.locationValue": "Gurugram, India — serving patients traveling to NCR hospitals",
  "strip.title": "Need the full medical tourism journey?",
  "strip.body":
    "Costs, hospital choice, visas, and timelines — our dedicated medical tourism guide walks African and international patients through every decision.",
  "strip.bullet1": "Compare savings vs. care at home",
  "strip.bullet2": "Shortlists of accredited hospitals",
  "strip.bullet3": "Stay + transport planned together",
  "strip.cta": "Open medical tourism guide",
  "floatWhats.aria": "Chat on WhatsApp with a care guide",
  "floatWhats.prefill":
    "Hello — I'd like to connect with the StayOnStay care team about planning my visit to India for treatment. Please reply when you can. Thank you.",
  "apartments.title": "Stays chosen for healing — not just holidays",
  "apartments.subtitle":
    "Hotels, studios, 1BHKs with kitchens, and family-sized 2BHKs — real photos, vetted partners, and honest drive times to Medanta, Artemis, Fortis, and more.",
  "apartments.galleryCaption": "Real recovery spaces and trusted partners near NCR hospitals.",
  "apartments.distance": "Most listings are 5–15 minutes from major hospitals — we publish honest commute context, not marketing fluff.",
  "apartments.listTitle": "Choose your stay",
  "apartments.listSubtitle": "Live inventory. Open a card for the full gallery, room types, and secure booking.",
  "apartments.point1.title": "Hotel & suite rooms",
  "apartments.point1.desc": "Service-style stays when you want housekeeping and front-desk ease.",
  "apartments.point2.title": "1BHK + full kitchen",
  "apartments.point2.desc": "Cook simple meals, store meds, and feel at home between hospital visits.",
  "apartments.point3.title": "2BHK for families",
  "apartments.point3.desc": "Extra space for attendants, kids, and recovery without crowding.",
  "apartments.point4.title": "Studio & 1RK",
  "apartments.point4.desc": "Compact, budget-smart options for shorter treatment windows.",
  "hotelSearch.segmentLabel": "Stay type",
  "hotelSearch.segmentHint": "We tag listings from inventory names — ask on WhatsApp if you need an exact layout.",
  "hotelSearch.segmentAll": "All types",
  "hotelSearch.segmentHotel": "Hotel",
  "hotelSearch.segmentBhk1": "1BHK + kitchen",
  "hotelSearch.segmentBhk2": "2BHK family",
  "hotelSearch.segmentStudio": "Studio / 1RK",
  "hotelSearch.emptyTitle": "No exact match online yet",
  "hotelSearch.emptyBody":
    "Tell us what you need — we often source hotel blocks, 1BHKs with kitchens, and family suites that aren’t listed here.",
  "hotelSearch.emptyCta": "WhatsApp a care guide",
  "hotelSearch.emptyPrefill": "Hi — I’m looking for {hint} in Delhi NCR for a medical stay. Please help me find a match.",
  "hotelSearch.distanceGurgaon": "Typically 5–20 min drive to Medanta, Artemis & Fortis corridors",
  "hotelSearch.distanceDelhi": "Delhi NCR — we help you plan hospital transfers after you book",
  "hotelSearch.distanceGeneric": "Short transfers to your chosen hospital — care team confirms on WhatsApp",
  "hotelSearch.trustVerified": "Verified partner",
  "hotelSearch.trustHygiene": "Sanitized between stays",
  "hotelSearch.trustMedical": "Built for medical travel",
  "hotelSearch.ratingLine": "Trusted by international patients & families",
  "hotelSearch.waCta": "Ask on WhatsApp",
  "hotelSearch.waPrefill": "Hi — I’m interested in “{name}” for my medical stay in India. Please help me book.",
  "hotelSearch.viewSuite": "View & book",
  "hotelSearch.filtersPrice": "Price per night",
  "hotelSearch.filtersCollections": "Collections",
  "hotelSearch.filterFamily": "Family stays",
  "hotelSearch.filterNearHospital": "Near hospital",
  "hotelSearch.tabAll": "All stays",
  "hotelSearch.tabFamily": "Family stays",
  "hotelSearch.tabMedanta": "Near Medanta",
  "hotelSearch.sortLabel": "Sort",
  "hotelSearch.sortAvailability": "Availability",
  "hotelSearch.sortPriceLow": "Price: Low to High",
  "hotelSearch.sortPriceHigh": "Price: High to Low",
  "hotelSearch.sortLocation": "Location",
  "hotelSearch.mapView": "Map view",
  "hotelSearch.filtersSheet": "Filters",
  "hotelSearch.refine": "Refine search",
  "hotelSearch.resultsCount": "{n} stays",
  "hotelSearch.liveInventory": "live inventory",
  "hotelSearch.loading": "Loading stays…",
  "hotelSearch.searchPlaceholder": "Search by area, landmark or hotel name",
  "hotelSearch.checkIn": "Check-in",
  "hotelSearch.checkOut": "Check-out",
  "hotelSearch.guests": "Guests",
  "hotelSearch.searchBtn": "Search",
  "hotelSearch.guestOpt1": "1 Room, 1 Guest",
  "hotelSearch.guestOpt2": "1 Room, 2 Guests",
  "explore.cat.all": "All",
  "explore.cat.heritage": "Heritage",
  "explore.cat.spiritual": "Spiritual",
  "explore.cat.markets": "Markets",
  "explore.cat.parks": "Parks & nature",
  "explore.cat.food": "Food",
  "explore.cat.weekend": "Weekend trips",
  "explore.hero.kicker": "Optional joy while you heal",
  "explore.hero.title": "DESTINATIONS",
  "explore.hero.sub": "for every bucket list near Delhi NCR",
  "explore.hero.delhi": "Delhi NCR & beyond",
  "explore.hero.cta": "Scroll to explore",
  "explore.hero.note": "Curated for medical travelers — short drives, world icons, real photos.",
  "explore.strip1.title": "ATTRACTIONS",
  "explore.strip1.sub": "worth a thousand stories",
  "explore.mosaic.title": "Icons within a few hours",
  "explore.mosaic.sub": "Taj Mahal, Qutub Minar, Old Delhi lanes — plan light outings between treatment.",
  "explore.carousel.title": "Slide through NCR highlights",
  "explore.carousel.sub": "Drag the rail or use the arrows — same spirit as Incredible India, tailored for recovery travel.",
  "explore.carousel.explore": "Explore",
  "explore.band.title": "NEAR DELHI",
  "explore.band.sub": "— filter by mood —",
  "explore.band.hint": "200+ places within ~200 km — sample below; ask us for a custom day plan on WhatsApp.",
  "explore.red.title": "PLAN YOUR OUTINGS",
  "explore.red.sub": "We help you balance rest, doctors’ advice, and safe sightseeing.",
  "explore.cta.title": "Need an itinerary between check-ups?",
  "explore.cta.body": "Our care guides suggest pacing, transport, and family-friendly routes: no extra charge for planning.",
  "explore.cta.whatsapp": "WhatsApp for a day plan",
  "explore.cta.medTourism": "Medical trip planning",
  "explore.cta.stays": "Back to stays & booking",
  "explore.sticky.plan": "Plan stay",
  "explore.sticky.whatsapp": "WhatsApp",
  "explore.stat.curated": "Curated escapes",
  "explore.stat.radius": "within ~200 km of Delhi NCR",
  "explore.stat.guide": "In this guide",
  "explore.stat.guideSub": "Hand-picked for medical-travel pacing — full list expanding to 200+.",
  "explore.stat.categories": "Heritage · faith · food · nature · weekends",
  "explore.video.badge": "Cinematic preview · sound off",
  "explore.marquee": "Red Fort · Taj at dawn · Lotus silence · Chandni chaos · Neemrana sunsets · Bharatpur birds",
  "explore.drag.hint": "Drag to explore",
  "featured.title": "Featured Partner Hotels",
  "featured.subtitle": "Trusted accommodations vetted for comfort, cleanliness, and proximity to leading hospitals.",
  "featured.pernight": "per night",
  "how.title": "How It Works",
  "how.subtitle": "Book your medical stay in three simple steps.",
  "how.step1.title": "Search & Compare",
  "how.step1.desc": "Find hotels near your hospital with real-time availability and transparent pricing.",
  "how.step2.title": "Book Instantly",
  "how.step2.desc": "Secure your room in seconds. No hidden fees, flexible cancellation policies.",
  "how.step3.title": "Stay with Confidence",
  "how.step3.desc": "Enjoy your stay with 24/7 support, transport, and medical travel assistance.",
  "services.title": "Care that goes beyond a room key",
  "services.subtitle":
    "Start your journey to better health today — warm, practical support from touchdown to discharge.",
  "services.furnished.title": "Homes that feel safe the moment you arrive",
  "services.furnished.desc":
    "Fully furnished spaces with kitchens, calm lighting, and laundry — checked for hygiene so you can focus on healing.",
  "services.airport.title": "A familiar face at the airport",
  "services.airport.desc":
    "We track your flight and meet you with a trusted driver — straight to rest, not stress.",
  "services.hospitalTransport.title": "Rides when you need them most",
  "services.hospitalTransport.desc":
    "Hospital and lab visits coordinated for you — no wrong turns on the hardest days.",
  "services.patientCare.title": "Someone in your corner, always",
  "services.patientCare.desc":
    "Care guides on WhatsApp for groceries, pharmacy runs, translation, and the worries that keep you up at night.",
  "testimonials.title": "Families who felt the difference",
  "testimonials.subtitle": "Real guests, real recoveries — the trust you need in the first five seconds.",
  "footer.tagline": "Trusted medical hospitality for international patients and their families.",
  "footer.platform": "Platform",
  "footer.support": "Support",
  "footer.company": "Company",
  "footer.legal": "Legal",
  "footer.rights": "© 2026 StayOnStay. All rights reserved.",
  "footer.made": "Made with",
  "footer.for": "for medical travelers",
  "nav.helpCenter": "Help Center",
  "nav.whatsappSupport": "WhatsApp Support",
  "footer.aboutUs": "About Us",
  "footer.careers": "Careers",
  "footer.partners": "Partners",
  "footer.privacyPolicy": "Privacy Policy",
  "footer.termsOfService": "Terms of Service",
  "support.title": "Support Center",
  "support.subtitle": "Fast answers for guests, attendants, and hospital coordinators. We prioritize booking-critical issues and transfer support.",
  "support.response.title": "Response targets",
  "support.response.critical": "Critical stay issues: under 15 min",
  "support.response.general": "General support: under 2 hours",
  "support.channels.title": "Channels",
  "support.channels.email": "Email: support@stayonstay.com",
  "support.channels.whatsapp": "WhatsApp support for active stays",
  "support.coverage.title": "Coverage",
  "support.coverage.body": "Gurgaon core sectors + Delhi NCR medical corridors",
  "support.faq.title": "Common support topics",
  "support.faq.badge1": "Booking changes",
  "support.faq.badge2": "Airport pickup",
  "support.faq.badge3": "Long-stay discounts",
  "support.faq.badge4": "Hospital transfer timing",
  "support.faq.badge5": "International check-in docs",
  "support.faq.q1": "How do I modify check-in/check-out dates for treatment changes?",
  "support.faq.q2": "Can StayOnStay arrange airport pickup at night arrivals?",
  "support.faq.q3": "Which properties support attendants and extended recovery stay?",
  "support.faq.q4": "How far are listed hotels from Medanta, Fortis, and Artemis corridors?",
};

const translations: Record<TranslationKey, Record<string, string>> = {
  en: LANDING_EN,
  sw: {
    ...LANDING_EN,
    ...swLandingPack,
    "lang.pageLanguage": "Lugha ya ukurasa",
    "lang.footer": "Tunatumia lugha rahisi na inayoeleweka. Unaweza kubadilisha wakati wowote.",
  },
  am: { ...LANDING_EN, ...amLandingPack },
  yo: { ...LANDING_EN, ...yoLandingPack },
  zu: { ...LANDING_EN, ...zuLandingPack },
  lg: { ...LANDING_EN, ...lgLandingPack },
  ln: { ...LANDING_EN, ...lnLandingPack },
  so: { ...LANDING_EN, ...soLandingPack },
  pt: { ...LANDING_EN, ...ptLandingPack },

  hi: {
    ...LANDING_EN,
    ...hiLandingPack,
    "lang.pageLanguage": "आपकी भाषा (पेज)",
    "lang.footer":
      "हम आसान, समझने वाली भाषा use करते हैं। कभी भी बदल सकते हैं।",
    "lang.en.label": "English",
    "lang.en.native": "English",
    "lang.en.line": "Default — English",
    "lang.hi.label": "हिंदी",
    "lang.hi.native": "हिंदी",
    "lang.hi.line": "आसान हिंदी — ज़रूरत हो तो English शब्द",
    "lang.ar.label": "Arabic",
    "lang.ar.native": "العربية",
    "lang.ar.line": "Arabic",
    "lang.fr.label": "French",
    "lang.fr.native": "Français",
    "lang.fr.line": "French",
    "lang.es.label": "Spanish",
    "lang.es.native": "Español",
    "lang.es.line": "Spanish",
    "lang.sw.label": "Swahili",
    "lang.sw.native": "Kiswahili",
    "lang.sw.line": "पूर्वी अफ्रीका — ज़रूरत हो तो English शब्द",
    "lang.am.label": "Amharic",
    "lang.am.native": "አማርኛ",
    "lang.am.line": "इथियोपिया — አማርኛ + English",
    "lang.rw.label": "Kinyarwanda",
    "lang.rw.native": "Ikinyarwanda",
    "lang.rw.line": "रवांडा — Ikinyarwanda + English",
    "lang.yo.label": "Yoruba",
    "lang.yo.native": "Yorùbá",
    "lang.yo.line": "नाइजीरिया — Yorùbá + English",
    "lang.zu.label": "Zulu",
    "lang.zu.native": "isiZulu",
    "lang.zu.line": "दक्षिण अफ्रीका — isiZulu + English",
    "lang.so.label": "Somali",
    "lang.so.native": "Soomaali",
    "lang.so.line": "Soomaali + English",
    "lang.lg.label": "Luganda",
    "lang.lg.native": "Luganda",
    "lang.lg.line": "युगांडा — Luganda + English",
    "lang.ln.label": "Lingala",
    "lang.ln.native": "Lingála",
    "lang.ln.line": "Lingála + French/English",
    "lang.pt.label": "Portuguese",
    "lang.pt.native": "Português",
    "lang.pt.line": "अंगोला — Português + English",
    "nav.hotels": "होटल",
    "nav.hospitals": "अस्पताल",
    "nav.medicalTourism": "चिकित्सा पर्यटन",
    "nav.services": "सेवाएं",
    "nav.support": "सहायता",
    "nav.login": "लॉगिन",
    "nav.signup": "साइन अप",
    "nav.contactUs": "संपर्क करें",
    "hero.title": "अपने अस्पताल के पास आरामदायक ठहराव",
    "hero.subtitle": "शीर्ष अस्पतालों के पास विश्वसनीय होटल खोजें। हम आपके ठहराव का ध्यान रखते हैं ताकि आप अपने स्वास्थ्य पर ध्यान दे सकें।",
    "hero.search": "खोजें",
    "hero.location": "स्थान",
    "hero.location.placeholder": "शहर या क्षेत्र",
    "hero.hospital": "अस्पताल",
    "hero.hospital.placeholder": "कोई भी अस्पताल",
    "hero.checkin": "चेक-इन",
    "hero.checkout": "चेक-आउट",
    "hero.date.placeholder": "तारीख जोड़ें",
    "hero.badge1": "500+ पार्टनर होटल",
    "hero.badge2": "50+ अस्पताल",
    "hero.badge3": "24/7 सहायता",
    "featured.title": "चुनिंदा पार्टनर होटल",
    "featured.subtitle": "आराम, स्वच्छता और प्रमुख अस्पतालों से निकटता के लिए जांचे गए विश्वसनीय आवास।",
    "featured.pernight": "प्रति रात",
    "how.title": "कैसे काम करता है",
    "how.subtitle": "तीन सरल चरणों में अपना मेडिकल ठहराव बुक करें।",
    "how.step1.title": "खोजें और तुलना करें",
    "how.step1.desc": "रियल-टाइम उपलब्धता और पारदर्शी मूल्य के साथ अस्पतालों के पास होटल खोजें।",
    "how.step2.title": "तुरंत बुक करें",
    "how.step2.desc": "सेकंडों में अपना कमरा सुरक्षित करें। कोई छिपी फीस नहीं।",
    "how.step3.title": "आत्मविश्वास से रहें",
    "how.step3.desc": "24/7 सहायता, परिवहन और चिकित्सा यात्रा सहायता के साथ अपने ठहराव का आनंद लें।",
    "services.title": "कमरे की चाबी से बढ़कर देखभाल",
    "services.subtitle": "आज ही बेहतर स्वास्थ्य की ओर अपनी यात्रा शुरू करें — टचडाउन से डिस्चार्ज तक स्नेही, व्यावहारिक सहायता।",
    "services.furnished.title": "पहुंचते ही सुरक्षित महसूस होने वाले घर",
    "services.furnished.desc": "रसोई, शांत रोशनी और लॉन्ड्री के साथ पूरी तरह से सुसज्जित स्थान — स्वच्छता के लिए जांचे गए ताकि आप ठीक होने पर ध्यान केंद्रित कर सकें।",
    "services.airport.title": "एयरपोर्ट पर एक जाना-पहचाना चेहरा",
    "services.airport.desc": "हम आपकी उड़ान को ट्रैक करते हैं और आपसे एक भरोसेमंद ड्राइवर के साथ मिलते हैं — सीधे आराम की ओर, तनाव की नहीं।",
    "services.hospitalTransport.title": "जब आपको उनकी सबसे अधिक आवश्यकता हो तब सवारी",
    "services.hospitalTransport.desc": "अस्पताल और लैब विजिट आपके लिए समन्वित — सबसे कठिन दिनों में कोई गलत मोड़ नहीं।",
    "services.patientCare.title": "हमेशा आपके साथ, हर कदम पर",
    "services.patientCare.desc": "किराने का सामान, फार्मेसी, अनुवाद और उन चिंताओं के लिए व्हाट्सएप पर केयर गाइड जो आपको रात में जगाए रखती हैं।",
    "testimonials.title": "परिवार जिन्होंने फर्क महसूस किया",
    "testimonials.subtitle": "असली मेहमान, असली रिकवरी — वो भरोसा जिसकी आपको ज़रूरत है।",
    "footer.tagline": "अंतरराष्ट्रीय रोगियों और उनके परिवारों के लिए विश्वसनीय चिकित्सा आतिथ्य।",
    "footer.platform": "प्लेटफॉर्म",
    "footer.support": "सहायता",
    "footer.company": "कंपनी",
    "footer.legal": "कानूनी",
    "footer.rights": "© 2026 StayOnStay. सर्वाधिकार सुरक्षित।",
    "footer.made": "बनाया गया",
    "footer.for": "चिकित्सा यात्रियों के लिए",
    "nav.helpCenter": "हेल्प सेंटर",
    "nav.whatsappSupport": "WhatsApp सहायता",
    "footer.aboutUs": "हमारे बारे में",
    "footer.careers": "करियर",
    "footer.partners": "पार्टनर्स",
    "footer.privacyPolicy": "प्राइवेसी पॉलिसी",
    "footer.termsOfService": "सेवा की शर्तें",
    "support.title": "सहायता केंद्र",
    "support.subtitle": "मेहमानों, परिचारकों और अस्पताल समन्वयकों के लिए त्वरित उत्तर। हम बुकिंग-महत्वपूर्ण मुद्दों और स्थानांतरण सहायता को प्राथमिकता देते हैं।",
    "support.response.title": "प्रतिक्रिया लक्ष्य",
    "support.response.critical": "गंभीर प्रवास मुद्दे: 15 मिनट से कम",
    "support.response.general": "सामान्य सहायता: 2 घंटे से कम",
    "support.channels.title": "चैनल",
    "support.channels.email": "ईमेल: support@stayonstay.com",
    "support.channels.whatsapp": "सक्रिय प्रवास के लिए व्हाट्सएप सहायता",
    "support.coverage.title": "कवरेज",
    "support.coverage.body": "गुड़गांव मुख्य सेक्टर्स + दिल्ली एनसीआर मेडिकल कॉरिडोर",
    "support.faq.title": "सामान्य सहायता विषय",
    "support.faq.badge1": "बुकिंग में बदलाव",
    "support.faq.badge2": "एयरपोर्ट पिकअप",
    "support.faq.badge3": "लंबे समय तक रहने की छूट",
    "support.faq.badge4": "अस्पताल स्थानांतरण समय",
    "support.faq.badge5": "अंतरराष्ट्रीय चेक-इन दस्तावेज़",
    "support.faq.q1": "मैं इलाज में बदलाव के लिए चेक-इन/चेक-आउट तारीखों को कैसे संशोधित करूं?",
    "support.faq.q2": "क्या StayOnStay रात में आने पर एयरपोर्ट पिकअप की व्यवस्था कर सकता है?",
  },
  fr: { ...LANDING_EN, ...FR_LANDING },
  es: { ...LANDING_EN, ...ES_LANDING },
  ar: { ...LANDING_EN, ...AR_LANDING },
  rw: { ...LANDING_EN, ...rwLandingPack },
};

interface I18nContextType {
  /** Selected UI language for translations */
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("preferredLanguage");
      if (saved) return saved as LanguageCode;
    }
    return "en";
  });

  const setLanguage = useCallback((lang: LanguageCode) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("preferredLanguage", lang);
    }
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);

  const t = useCallback(
    (key: string) => {
      const pack = language;
      return translations[pack]?.[key] || translations.en[key] || key;
    },
    [language],
  );

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
};
