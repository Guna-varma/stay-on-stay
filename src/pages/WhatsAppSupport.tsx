import { I18nProvider } from "@/lib/i18n";
import { WHATSAPP_RW_NUMBER } from "@/lib/whatsappContact";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const complianceRequirements = [
  "Get explicit user consent (opt-in) before sending WhatsApp messages.",
  "Provide a clear opt-out path in every promotional flow.",
  "Avoid spam and send only relevant, permission-based communication.",
  "Use WhatsApp-approved message templates for notifications and campaigns.",
  "Follow applicable data protection and privacy laws in all operating regions.",
];

const privacySections = [
  {
    title: "1. Information We Collect",
    points: ["Phone number", "Name", "Transaction details", "Device and usage data"],
  },
  {
    title: "2. How We Use Information",
    points: [
      "Send OTPs for authentication",
      "Provide billing and transactional updates",
      "Send promotional messages only when consent is given",
    ],
  },
  {
    title: "3. Data Sharing",
    points: [
      "We do not sell your personal data.",
      "We may share data with service providers (for example WhatsApp API providers) to deliver our services.",
      "We may disclose data to legal authorities where required by law.",
    ],
  },
  {
    title: "4. Data Security",
    points: ["We use industry-standard safeguards including encryption, access controls, and secure infrastructure."],
  },
  {
    title: "5. User Rights",
    points: [
      "Opt out of promotional messages at any time.",
      "Request deletion of personal data, subject to legal and operational requirements.",
    ],
  },
  {
    title: "6. Consent",
    points: ["By using our services, you consent to data processing as described in this policy."],
  },
  {
    title: "7. Contact",
    points: ["For privacy concerns, contact: stayonstay.guest@gmail.com"],
  },
];

const termsSections = [
  {
    title: "1. Acceptance of Terms",
    points: ["By using our services, you agree to these terms."],
  },
  {
    title: "2. Service Description",
    points: [
      "We provide automated WhatsApp communication services including OTP authentication, billing updates, and promotional messaging.",
    ],
  },
  {
    title: "3. User Responsibilities",
    points: ["Provide accurate information.", "Do not misuse the service."],
  },
  {
    title: "4. Messaging Consent",
    points: [
      "Transactional messages such as OTP and billing alerts may be sent based on service usage.",
      "Promotional messages are sent only when you have opted in.",
    ],
  },
  {
    title: "5. Opt-Out",
    points: ["You may opt out anytime by replying STOP or by contacting support."],
  },
  {
    title: "6. Limitation of Liability",
    points: ["We are not liable for delays in message delivery or third-party platform failures."],
  },
  {
    title: "7. Modifications",
    points: ["We may update these terms from time to time."],
  },
  {
    title: "8. Governing Law",
    points: ["These terms are governed by applicable local laws."],
  },
  {
    title: "9. Contact",
    points: ["For queries: stayonstay.guest@gmail.com"],
  },
];

export default function WhatsAppSupport() {
  return (
    <I18nProvider>
      <div className="min-h-screen bg-background">
        <LandingHeader />
        <main className="py-12 lg:py-16">
          <div className="max-w-page space-y-8">
            <div className="max-w-4xl space-y-3">
              <h1 className="text-3xl md:text-4xl font-semibold text-foreground">WhatsApp API Compliance & Policy</h1>
              <p className="text-muted-foreground leading-relaxed">
                This page outlines the WhatsApp communication rules for Stay On Stay, including consent, opt-out,
                privacy handling, and terms for transactional and promotional messaging.
              </p>
            </div>

            <Card className="p-6 border-0 shadow-card space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Compliance Requirements (Very Important)</h2>
              <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground leading-relaxed">
                {complianceRequirements.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Card>

            <Card className="p-6 border-0 shadow-card space-y-5">
              <h2 className="text-xl font-semibold text-foreground">Privacy Policy</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We value your privacy and are committed to protecting your personal data.
              </p>
              <div className="space-y-5">
                {privacySections.map((section) => (
                  <section key={section.title} className="space-y-2">
                    <h3 className="text-base font-semibold text-foreground">{section.title}</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground leading-relaxed">
                      {section.points.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </Card>

            <Card className="p-6 border-0 shadow-card space-y-5">
              <h2 className="text-xl font-semibold text-foreground">Terms and Conditions</h2>
              <div className="space-y-5">
                {termsSections.map((section) => (
                  <section key={section.title} className="space-y-2">
                    <h3 className="text-base font-semibold text-foreground">{section.title}</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground leading-relaxed">
                      {section.points.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </Card>

            <Card className="p-6 border-0 shadow-card space-y-3">
              <h2 className="text-lg font-semibold text-foreground">Need Help?</h2>
              <p className="text-sm text-muted-foreground">
                Contact our support team or open a WhatsApp chat for assistance with communication preferences.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <a href={`https://wa.me/${WHATSAPP_RW_NUMBER}`} target="_blank" rel="noopener noreferrer">
                    Open WhatsApp Chat
                  </a>
                </Button>
                <Button asChild variant="outline">
                  <a href="mailto:stayonstay.guest@gmail.com">Email Support</a>
                </Button>
              </div>
            </Card>
          </div>
        </main>
        <LandingFooter />
      </div>
    </I18nProvider>
  );
}
