import { useCallback } from "react";
import { useI18n, type LanguageCode } from "@/lib/i18n";
import { MT_TRANSLATIONS } from "@/lib/medTourismTranslations";

type NonEn = Exclude<LanguageCode, "en">;

/** When a locale pack is thin, try these in order after the selected language. */
const LANG_FALLBACK: Partial<Record<NonEn, NonEn[]>> = {
  pt: ["es"],
  ln: ["fr"],
  rw: ["sw"],
  lg: ["sw"],
};

/**
 * Medical tourism page copy (`/med-tourism`). English strings are the stable keys.
 * Layman-friendly mixes (e.g. Hindi + common English words) live in medTourismTranslations.
 */
export function useMtText() {
  const { language } = useI18n();
  return useCallback(
    (text: string) => {
      if (language === "en") return text;
      const langs: NonEn[] = [language as NonEn, ...(LANG_FALLBACK[language as NonEn] ?? [])];
      for (const lang of langs) {
        const t = MT_TRANSLATIONS[lang]?.[text];
        if (t !== undefined) return t;
      }
      return text;
    },
    [language],
  );
}
