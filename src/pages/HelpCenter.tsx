import { I18nProvider } from "@/lib/i18n";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

export default function HelpCenter() {
  return (
    <I18nProvider>
      <div className="min-h-screen bg-background">
        <LandingHeader />
        <main className="py-12 lg:py-16">
          <div className="max-w-page space-y-8">
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="max-w-3xl">
              <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-3">Support Center</h1>
              <p className="text-muted-foreground leading-relaxed">
                Fast answers for guests, attendants, and hospital coordinators. We prioritize booking-critical issues and transfer support.
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06, duration: 0.45 }} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-5 border-0 shadow-card">
                <h2 className="font-semibold text-foreground">Response targets</h2>
                <p className="text-sm text-muted-foreground mt-2">Critical stay issues: under 15 min</p>
                <p className="text-sm text-muted-foreground">General support: under 2 hours</p>
              </Card>
              <Card className="p-5 border-0 shadow-card">
                <h2 className="font-semibold text-foreground">Channels</h2>
                <p className="text-sm text-muted-foreground mt-2">Email: support@stayonstay.com</p>
                <p className="text-sm text-muted-foreground">WhatsApp support for active stays</p>
              </Card>
              <Card className="p-5 border-0 shadow-card">
                <h2 className="font-semibold text-foreground">Coverage</h2>
                <p className="text-sm text-muted-foreground mt-2">Gurgaon core sectors + Delhi NCR medical corridors</p>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.45 }}>
              <Card className="p-6 border-0 shadow-card space-y-3">
                <h2 className="text-lg font-semibold text-foreground">Common support topics</h2>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Booking changes</Badge>
                  <Badge variant="secondary">Airport pickup</Badge>
                  <Badge variant="secondary">Long-stay discounts</Badge>
                  <Badge variant="secondary">Hospital transfer timing</Badge>
                  <Badge variant="secondary">International check-in docs</Badge>
                </div>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>- How do I modify check-in/check-out dates for treatment changes?</li>
                  <li>- Can StayOnStay arrange airport pickup at night arrivals?</li>
                  <li>- Which properties support attendants and extended recovery stay?</li>
                  <li>- How far are listed hotels from Medanta, Fortis, and Artemis corridors?</li>
                </ul>
              </Card>
            </motion.div>
          </div>
        </main>
        <LandingFooter />
      </div>
    </I18nProvider>
  );
}

