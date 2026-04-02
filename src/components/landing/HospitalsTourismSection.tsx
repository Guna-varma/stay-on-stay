import { Star, ShieldCheck, MessageCircle, BadgeCheck, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { GURUGRAM_PARTNER_HOSPITALS } from "@/lib/partnerHospitalsGurugram";
import { useMtText } from "@/lib/medTourismText";
import { WHATSAPP_CARE_GUIDE_PREFILL } from "@/lib/whatsappContact";
import { useWhatsappHref } from "@/hooks/useWhatsappHref";

/**
 * #hospitals anchor on /med-tourism — five partner hospitals only (no sector / metro / outing lists).
 * Mobile: horizontal snap scroll; desktop: responsive grid. Green accents = trust / care continuity with header WhatsApp.
 */
export default function HospitalsTourismSection() {
  const tx = useMtText();
  const waHref = useWhatsappHref(WHATSAPP_CARE_GUIDE_PREFILL);

  return (
    <section
      id="hospitals"
      className="border-t border-emerald-200/40 bg-gradient-to-b from-emerald-50/50 via-muted/30 to-background py-14 dark:border-emerald-900/30 dark:from-emerald-950/25 lg:py-20"
    >
      <div className="max-w-page px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-10 max-w-3xl text-center sm:mb-12">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            {tx("JCI-accredited partner hospitals")}
          </span>
          <h2 className="font-heading mt-4 text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
            {tx("Five hospitals we connect you with")}
          </h2>
          <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
            {tx("Trusted Gurugram facilities, in the order many families choose.")}
          </p>
          <p className="mx-auto mt-2 max-w-2xl text-xs text-muted-foreground sm:text-sm">{tx("Accreditation note Paras NABH")}</p>
        </div>

        <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:thin] sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3 xl:grid-cols-5">
          {GURUGRAM_PARTNER_HOSPITALS.map((h, i) => {
            const isJci = h.accreditation === "JCI";
            return (
              <article
                key={h.name}
                className={cn(
                  "flex w-[min(100%,300px)] shrink-0 snap-center flex-col overflow-hidden rounded-2xl border bg-card shadow-md transition-shadow duration-300 hover:shadow-lg sm:w-auto",
                  isJci
                    ? "border-emerald-200/80 dark:border-emerald-900/50"
                    : "border-amber-200/70 dark:border-amber-900/40",
                )}
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
                  <span
                    className={cn(
                      "absolute right-2 top-2 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-md",
                      isJci ? "bg-emerald-600" : "bg-amber-600",
                    )}
                  >
                    {h.accreditation}
                  </span>
                  <span className="absolute bottom-2 left-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-xs font-bold text-white backdrop-blur-sm">
                    {i + 1}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="font-heading text-base font-bold leading-snug text-foreground">{h.name}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-500" aria-hidden />
                      {h.rating}
                    </span>
                  </div>
                  <p className="mt-2 flex-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">{h.specialty}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                        isJci
                          ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100"
                          : "bg-amber-100 text-amber-950 dark:bg-amber-900/35 dark:text-amber-100",
                      )}
                    >
                      <BadgeCheck className="h-3 w-3 shrink-0" aria-hidden />
                      {h.accreditation} {tx("Accredited")}
                    </span>
                  </div>
                  <p className="mt-2 text-[10px] leading-snug text-muted-foreground">{tx("Representative photo note")}</p>
                  <a
                    href={h.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-emerald-700 underline-offset-4 transition-colors hover:text-emerald-800 hover:underline dark:text-emerald-400 dark:hover:text-emerald-300"
                  >
                    {tx("See more details >")}
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                  </a>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/90 to-background p-5 text-center shadow-sm dark:border-emerald-900/40 dark:from-emerald-950/30">
          <p className="text-sm font-medium text-foreground">{tx("Not sure which hospital fits your case?")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{tx("Our care team helps you choose on WhatsApp, no pressure.")}</p>
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex min-h-[48px] w-full max-w-sm items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 text-sm font-semibold text-white shadow-md ring-1 ring-black/5 transition-colors hover:bg-[#20bd5a] sm:w-auto"
          >
            <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
            {tx("Talk to a Care Guide")}
          </a>
        </div>
      </div>
    </section>
  );
}
