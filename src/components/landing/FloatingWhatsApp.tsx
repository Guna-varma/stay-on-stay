import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { whatsappMeUrl, whatsappNumberForVisitor } from "@/lib/whatsappContact";

/**
 * Always-on floating WhatsApp — India (+91) vs Africa / international (+250) from
 * timezone heuristic and optional `visitorWhatsAppRegion` (set by quick contact form).
 */
export default function FloatingWhatsApp() {
  const { t } = useI18n();
  const [href, setHref] = useState(() =>
    typeof window !== "undefined" ? whatsappMeUrl(whatsappNumberForVisitor()) : "#",
  );

  useEffect(() => {
    const sync = () => {
      const n = whatsappNumberForVisitor();
      const text = t("floatWhats.prefill");
      setHref(whatsappMeUrl(n, text));
    };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("visitor-whatsapp-updated", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("visitor-whatsapp-updated", sync);
    };
  }, [t]);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed z-[100] flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] lg:bottom-8 lg:right-8 lg:h-16 lg:w-16"
      aria-label={t("floatWhats.aria")}
    >
      <MessageCircle className="h-7 w-7 lg:h-8 lg:w-8" strokeWidth={2} aria-hidden />
    </a>
  );
}
