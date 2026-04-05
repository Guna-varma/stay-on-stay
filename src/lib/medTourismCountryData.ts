/**
 * All 54 African Union member states for /med-tourism pricing.
 * USD→local rates are indicative mid-market snapshots for layman comparison (refresh via FX hook when online).
 * Heart-bypass “home country” USD anchors scale procedure rows vs Nigeria template (same model as before).
 */
import type { RegionCode } from "@/lib/i18n";
import { VIEWER_LOCALE_LINES } from "@/lib/i18n";
import { AFRICA_COUNTRY_FLAGS, africaFlagUrl } from "@/lib/africaCountryFlags";

export type MedTourismCountryIso = string;

export interface MedTourismCountry {
  iso: string;
  label: string;
  flagUrl: string;
  localCurrencyCode: string;
  localCurrencySymbol: string;
  /** Local currency units per 1 USD (indicative; live rate may override when fetched). */
  usdToLocal: number;
  /** Indicative coronary bypass cost at home (USD) — scales Nigeria template rows. */
  heartBypassLocalUsd: number;
}

/** Map each ISO2 → one of the 10 RegionCode lines (WhatsApp / language hint). */
export const MED_TOURISM_ISO_TO_REGION: Record<string, RegionCode> = {
  DZ: "ng",
  AO: "ao",
  BJ: "ng",
  BW: "za",
  BF: "cd",
  BI: "rw",
  CV: "ng",
  CM: "cd",
  CF: "cd",
  TD: "cd",
  KM: "ke",
  CD: "cd",
  CG: "cd",
  CI: "cd",
  DJ: "so",
  EG: "ng",
  GQ: "cd",
  ER: "et",
  SZ: "za",
  ET: "et",
  GA: "cd",
  GM: "ng",
  GH: "gh",
  GN: "ng",
  GW: "ao",
  KE: "ke",
  LS: "za",
  LR: "ng",
  LY: "ng",
  MG: "ke",
  MW: "ke",
  ML: "cd",
  MR: "cd",
  MU: "ke",
  MA: "ng",
  MZ: "ke",
  NA: "za",
  NE: "ng",
  NG: "ng",
  RW: "rw",
  ST: "ao",
  SN: "cd",
  SC: "ke",
  SL: "ng",
  SO: "so",
  ZA: "za",
  SS: "et",
  SD: "et",
  TZ: "ke",
  TG: "cd",
  TN: "ng",
  UG: "ug",
  ZM: "ke",
  ZW: "za",
};

const NIGERIA_HEART = 18000;

/**
 * Indicative heart bypass USD at home — regional tiers (not medical quotes).
 * Nigeria anchor = 18000; peers scaled for display only.
 */
const HEART_BY_ISO: Record<string, number> = {
  DZ: 21000,
  AO: 18500,
  BJ: 15200,
  BW: 22000,
  BF: 14800,
  BI: 13800,
  CV: 16800,
  CM: 16500,
  CF: 15500,
  TD: 15000,
  KM: 17000,
  CD: 17200,
  CG: 16800,
  CI: 17500,
  DJ: 14200,
  EG: 20000,
  GQ: 17500,
  ER: 14500,
  SZ: 21000,
  ET: 14600,
  GA: 17500,
  GM: 15000,
  GH: 16500,
  GN: 14800,
  GW: 15200,
  KE: 16000,
  LS: 17500,
  LR: 14500,
  LY: 18500,
  MG: 15500,
  MW: 14800,
  ML: 15000,
  MR: 15500,
  MU: 24000,
  MA: 20500,
  MZ: 16000,
  NA: 21500,
  NE: 14800,
  NG: NIGERIA_HEART,
  RW: 14200,
  ST: 16500,
  SN: 16800,
  SC: 23000,
  SL: 14500,
  SO: 14800,
  ZA: 25000,
  SS: 14000,
  SD: 14500,
  TZ: 15800,
  TG: 15200,
  TN: 19500,
  UG: 15200,
  ZM: 15500,
  ZW: 15000,
};

/** Approximate units of local currency per 1 USD (indicative; refresh via API when possible). */
const USD_TO_LOCAL_BY_CCY: Record<string, number> = {
  DZD: 135,
  AOA: 910,
  XOF: 605,
  BWP: 13.5,
  BIF: 2900,
  CVE: 100,
  XAF: 605,
  CDF: 2800,
  DJF: 178,
  EGP: 45,
  ERN: 15,
  SZL: 18.3,
  ETB: 57,
  GMD: 67,
  GHS: 15.5,
  GNF: 8600,
  KES: 129,
  LSL: 18.3,
  LRD: 190,
  LYD: 4.85,
  MGA: 4500,
  MWK: 1730,
  MRU: 40,
  MUR: 46,
  MAD: 10,
  MZN: 63,
  NAD: 18.3,
  NGN: 1550,
  RWF: 1310,
  STN: 23,
  SCR: 14,
  SLL: 22000,
  SOS: 570,
  ZAR: 18.3,
  SSP: 1300,
  SDG: 600,
  TZS: 2500,
  TND: 3.15,
  UGX: 3750,
  ZMW: 27,
  ZWL: 25,
  KMF: 455,
};

const SYMBOL_BY_CCY: Record<string, string> = {
  DZD: "د.ج",
  AOA: "Kz",
  XOF: "CFA",
  BWP: "P",
  BIF: "FBu",
  CVE: "$",
  XAF: "FCFA",
  CDF: "FC",
  DJF: "Fdj",
  EGP: "E£",
  ERN: "Nfk",
  SZL: "E",
  ETB: "Br",
  GMD: "D",
  GHS: "₵",
  GNF: "FG",
  KES: "KSh",
  LSL: "L",
  LRD: "L$",
  LYD: "ل.د",
  MGA: "Ar",
  MWK: "MK",
  MRU: "UM",
  MUR: "₨",
  MAD: "د.م.",
  MZN: "MT",
  NAD: "N$",
  NGN: "₦",
  RWF: "RF",
  STN: "Db",
  SCR: "₨",
  SLL: "Le",
  SOS: "S",
  ZAR: "R",
  SSP: "£",
  SDG: "ج.س.",
  TZS: "TSh",
  TND: "د.ت",
  UGX: "USh",
  ZMW: "ZK",
  ZWL: "Z$",
  KMF: "CF",
};

/** ISO 3166-1 alpha-2 → ISO 4217 + symbol (shared currencies use same rate). */
const CCY_BY_ISO: Record<string, { code: string }> = {
  DZ: { code: "DZD" },
  AO: { code: "AOA" },
  BJ: { code: "XOF" },
  BW: { code: "BWP" },
  BF: { code: "XOF" },
  BI: { code: "BIF" },
  CV: { code: "CVE" },
  CM: { code: "XAF" },
  CF: { code: "XAF" },
  TD: { code: "XAF" },
  KM: { code: "KMF" },
  CD: { code: "CDF" },
  CG: { code: "XAF" },
  CI: { code: "XOF" },
  DJ: { code: "DJF" },
  EG: { code: "EGP" },
  GQ: { code: "XAF" },
  ER: { code: "ERN" },
  SZ: { code: "SZL" },
  ET: { code: "ETB" },
  GA: { code: "XAF" },
  GM: { code: "GMD" },
  GH: { code: "GHS" },
  GN: { code: "GNF" },
  GW: { code: "XOF" },
  KE: { code: "KES" },
  LS: { code: "LSL" },
  LR: { code: "LRD" },
  LY: { code: "LYD" },
  MG: { code: "MGA" },
  MW: { code: "MWK" },
  ML: { code: "XOF" },
  MR: { code: "MRU" },
  MU: { code: "MUR" },
  MA: { code: "MAD" },
  MZ: { code: "MZN" },
  NA: { code: "NAD" },
  NE: { code: "XOF" },
  NG: { code: "NGN" },
  RW: { code: "RWF" },
  ST: { code: "STN" },
  SN: { code: "XOF" },
  SC: { code: "SCR" },
  SL: { code: "SLL" },
  SO: { code: "SOS" },
  ZA: { code: "ZAR" },
  SS: { code: "SSP" },
  SD: { code: "SDG" },
  TZ: { code: "TZS" },
  TG: { code: "XOF" },
  TN: { code: "TND" },
  UG: { code: "UGX" },
  ZM: { code: "ZMW" },
  ZW: { code: "ZWL" },
};

function buildCountries(): MedTourismCountry[] {
  return AFRICA_COUNTRY_FLAGS.map(({ code, label }) => {
    const ccy = CCY_BY_ISO[code];
    if (!ccy) throw new Error(`Missing currency for ${code}`);
    const usdToLocal = USD_TO_LOCAL_BY_CCY[ccy.code];
    if (usdToLocal == null) throw new Error(`Missing rate for ${ccy.code}`);
    return {
      iso: code.toLowerCase(),
      label,
      flagUrl: africaFlagUrl(code, 40),
      localCurrencyCode: ccy.code,
      localCurrencySymbol: SYMBOL_BY_CCY[ccy.code] ?? ccy.code,
      usdToLocal,
      heartBypassLocalUsd: HEART_BY_ISO[code] ?? NIGERIA_HEART,
    };
  });
}

export const MED_TOURISM_COUNTRIES: MedTourismCountry[] = buildCountries();

export function getMedTourismCountry(isoLower: string): MedTourismCountry | undefined {
  return MED_TOURISM_COUNTRIES.find((c) => c.iso === isoLower.toLowerCase());
}

export function getLocaleLineForMedTourismCountry(isoLower: string): string {
  const region = MED_TOURISM_ISO_TO_REGION[isoLower.toUpperCase()];
  if (region) return VIEWER_LOCALE_LINES[region];
  return "English support — we match you with a clear-speaking care guide.";
}

const NIGERIA_HEART_REF = NIGERIA_HEART;

/** UI filter groups for treatment list (search + chips). */
export type MedTreatmentCategoryId =
  | "heart"
  | "orthopaedic"
  | "oncology_transplant"
  | "women_children"
  | "eyes_ent_dental"
  | "urology"
  | "neuro"
  | "bariatric_cosmetic";

export const MED_TOURISM_TREATMENT_CATEGORY_FILTERS: { id: "all" | MedTreatmentCategoryId; label: string }[] = [
  { id: "all", label: "All treatments" },
  { id: "heart", label: "Heart & circulation" },
  { id: "orthopaedic", label: "Bones & joints" },
  { id: "oncology_transplant", label: "Cancer & transplants" },
  { id: "women_children", label: "Women & children" },
  { id: "eyes_ent_dental", label: "Eyes, ears & teeth" },
  { id: "urology", label: "Kidney & urology" },
  { id: "neuro", label: "Brain & nerves" },
  { id: "bariatric_cosmetic", label: "Weight & cosmetic" },
];

/** Procedure rows anchored on Nigeria; local “home” prices scale by heart-bypass ratio per country. */
export const COMPARISON_TEMPLATE_NIGERIA: {
  procedure: string;
  localUsd: number;
  indiaUsd: number;
  category: MedTreatmentCategoryId;
}[] = [
  { procedure: "Angioplasty & Stenting (Coronary)", localUsd: 14500, indiaUsd: 4400, category: "heart" },
  { procedure: "Arthroscopy (Knee/Shoulder)", localUsd: 6400, indiaUsd: 2000, category: "orthopaedic" },
  { procedure: "Bariatric (Weight-Loss) Surgery", localUsd: 13800, indiaUsd: 4500, category: "bariatric_cosmetic" },
  { procedure: "Bone Marrow Transplant (Stem Cell)", localUsd: 118000, indiaUsd: 37500, category: "oncology_transplant" },
  { procedure: "Breast/Lung/Colorectal Cancer (surgery/chemo/radiotherapy)", localUsd: 34200, indiaUsd: 10500, category: "oncology_transplant" },
  { procedure: "Cataract Surgery", localUsd: 2200, indiaUsd: 650, category: "eyes_ent_dental" },
  { procedure: "Congenital Heart Surgery (e.g. ASD/VSD repair)", localUsd: 20800, indiaUsd: 6000, category: "heart" },
  { procedure: "Cosmetic/Plastic Surgery (rhinoplasty, liposuction, etc.)", localUsd: 10200, indiaUsd: 3000, category: "bariatric_cosmetic" },
  { procedure: "Cochlear (Ear) Implant", localUsd: 33200, indiaUsd: 10000, category: "eyes_ent_dental" },
  { procedure: "Dental Implants & Care", localUsd: 3200, indiaUsd: 1000, category: "eyes_ent_dental" },
  { procedure: "Eye Surgery (LASIK, Retina)", localUsd: 4100, indiaUsd: 1250, category: "eyes_ent_dental" },
  { procedure: "Gynecological Surgery (hysterectomy, fibroids)", localUsd: 10200, indiaUsd: 3000, category: "women_children" },
  { procedure: "Hip Replacement", localUsd: 12000, indiaUsd: 6000, category: "orthopaedic" },
  { procedure: "IVF and Fertility Treatment", localUsd: 8200, indiaUsd: 4000, category: "women_children" },
  { procedure: "Knee Replacement", localUsd: 10800, indiaUsd: 5000, category: "orthopaedic" },
  { procedure: "Kidney Stone/Lithotripsy", localUsd: 6600, indiaUsd: 2000, category: "urology" },
  { procedure: "Kidney Transplant", localUsd: 51000, indiaUsd: 16000, category: "oncology_transplant" },
  { procedure: "Liver Transplant", localUsd: 128000, indiaUsd: 40000, category: "oncology_transplant" },
  { procedure: "Neurosurgery (Brain Tumor, Spine)", localUsd: 32800, indiaUsd: 10000, category: "neuro" },
  { procedure: "Obstructive Uropathy (e.g. Prostate surgery)", localUsd: 6600, indiaUsd: 2000, category: "urology" },
  { procedure: "Reconstructive Pediatric Surgery (e.g. cleft lip/palate)", localUsd: 11200, indiaUsd: 3500, category: "women_children" },
];

export type MedTourismCostRow = {
  procedure: string;
  localUsd: number;
  indiaUsd: number;
  category: MedTreatmentCategoryId;
};

export function buildCostDataForIso(isoLower: string): MedTourismCostRow[] {
  const meta = getMedTourismCountry(isoLower);
  const heart = meta?.heartBypassLocalUsd ?? NIGERIA_HEART_REF;
  const scale = heart / NIGERIA_HEART_REF;
  return COMPARISON_TEMPLATE_NIGERIA.map((row) => ({
    procedure: row.procedure,
    indiaUsd: row.indiaUsd,
    category: row.category,
    localUsd: Math.max(0, Math.round(row.localUsd * scale)),
  }));
}
