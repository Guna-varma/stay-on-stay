import { Link, Navigate, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { I18nProvider } from "@/lib/i18n";
import { useMtText } from "@/lib/medTourismText";
import {
  journeyContextFromSlug,
  MED_TOURISM_OVERVIEW_WITH_WHY_INDIA,
  type JourneyContext,
} from "@/lib/medTourismTopicPaths";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";
import { MedTourismTopicContent } from "@/components/landing/WhyIndiaScreens";

function TopicTopBar({ topic }: { topic: JourneyContext }) {
  const tx = useMtText();
  const title =
    topic === "cost"
      ? tx("Cost Savings")
      : topic === "hospitals"
        ? tx("Hospitals")
        : topic === "speed"
          ? tx("Faster Treatment")
          : tx("Concierge Support");

  return (
    <div className="mb-8">
      <Link
        to={MED_TOURISM_OVERVIEW_WITH_WHY_INDIA}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
      >
        <ChevronLeft className="w-4 h-4 shrink-0" aria-hidden />
        {tx("Back to medical tourism")}
      </Link>
      <p className="text-xs text-muted-foreground mt-2">{title}</p>
    </div>
  );
}

/** One full screen per topic (charts + detail) at `/med-tourism/savings` etc. */
export default function MedTourismTopic() {
  const { topic } = useParams<{ topic: string }>();
  const ctx = journeyContextFromSlug(topic);

  if (!ctx) {
    return <Navigate to="/med-tourism" replace />;
  }

  return (
    <I18nProvider>
      <div className="min-h-screen bg-background">
        <LandingHeader />
        <main className="px-4 sm:px-6 lg:px-8 pt-6 pb-8 max-w-page mx-auto">
          <TopicTopBar topic={ctx} />
          <MedTourismTopicContent topic={ctx} />
        </main>
        <LandingFooter />
      </div>
    </I18nProvider>
  );
}
