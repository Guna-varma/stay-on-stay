/** Routes under `/med-tourism/*` — one full page per topic (charts live on each screen). */

export type JourneyContext = "cost" | "hospitals" | "speed" | "support";

/** URL segment after `/med-tourism/` */
export const MED_TOURISM_TOPIC_SLUGS: Record<JourneyContext, string> = {
  cost: "savings",
  hospitals: "hospitals",
  speed: "faster-treatment",
  support: "concierge",
};

export function pathForJourneyContext(ctx: JourneyContext): string {
  return `/med-tourism/${MED_TOURISM_TOPIC_SLUGS[ctx]}`;
}

export function journeyContextFromSlug(slug: string | undefined): JourneyContext | null {
  if (!slug) return null;
  const keys = Object.keys(MED_TOURISM_TOPIC_SLUGS) as JourneyContext[];
  for (const k of keys) {
    if (MED_TOURISM_TOPIC_SLUGS[k] === slug) return k;
  }
  return null;
}

/** Section on `/med-tourism` with “WHY INDIA / Why Patients Choose India” (see `WhyIndiaScreens`). */
export const MED_TOURISM_WHY_INDIA_SECTION_ID = "mt-why-india";

/** Back link target: main medical tourism page scrolled to the Why India cards. */
export const MED_TOURISM_OVERVIEW_WITH_WHY_INDIA = `/med-tourism#${MED_TOURISM_WHY_INDIA_SECTION_ID}`;
