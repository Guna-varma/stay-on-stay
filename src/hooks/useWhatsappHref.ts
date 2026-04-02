import { useEffect, useState } from "react";
import { whatsappMeUrl, whatsappNumberForVisitor } from "@/lib/whatsappContact";

/** WhatsApp URL that follows visitor region (+ sync on storage / region change). */
export function useWhatsappHref(prefill?: string): string {
  const [href, setHref] = useState(() =>
    typeof window !== "undefined" ? whatsappMeUrl(whatsappNumberForVisitor(), prefill) : "#",
  );

  useEffect(() => {
    const sync = () => setHref(whatsappMeUrl(whatsappNumberForVisitor(), prefill));
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("visitor-whatsapp-updated", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("visitor-whatsapp-updated", sync);
    };
  }, [prefill]);

  return href;
}
