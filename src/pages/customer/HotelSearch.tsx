import { HotelSearchSection } from "@/components/HotelSearchSection";
import FloatingWhatsApp from "@/components/landing/FloatingWhatsApp";
import { I18nProvider } from "@/lib/i18n";

export default function HotelSearch() {
  return (
    <I18nProvider>
      <div className="min-h-full bg-background pb-24 lg:pb-28">
        <HotelSearchSection standalone />
        <FloatingWhatsApp />
      </div>
    </I18nProvider>
  );
}
