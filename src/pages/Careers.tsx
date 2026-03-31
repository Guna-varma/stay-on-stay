import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { I18nProvider } from "@/lib/i18n";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const HIRING_EMAIL = "support@stayonstay.com";

export default function Careers() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Medical concierge & operations");
  const [experience, setExperience] = useState("");
  const [message, setMessage] = useState("");

  const submitApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !role.trim()) {
      toast.error("Please fill name, email, and role.");
      return;
    }
    const body = [
      `Candidate: ${name}`,
      `Email: ${email}`,
      `Role applied: ${role}`,
      `Experience: ${experience || "N/A"}`,
      "",
      "Why I want to join:",
      message || "N/A",
    ].join("\n");
    window.location.href = `mailto:${HIRING_EMAIL}?subject=${encodeURIComponent(`[Careers] Application - ${role}`)}&body=${encodeURIComponent(body)}`;
    toast.success("Application draft opened. Please send it to apply.");
  };

  return (
    <I18nProvider>
      <div className="min-h-screen bg-background">
        <LandingHeader />
        <main className="py-12 lg:py-16">
          <div className="max-w-page space-y-8">
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="max-w-3xl">
              <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-3">Careers</h1>
              <p className="text-muted-foreground leading-relaxed">
                We&apos;re building a hospitality layer around hospitals. If you care about patient experience,
                operations, and thoughtful technology, StayOnStay is a place to do meaningful work.
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.45 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6 shadow-card border-0">
                <h2 className="text-lg font-semibold text-foreground mb-2">Medical concierge &amp; operations</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Roles across guest experience, on-ground coordination, and partner onboarding in Gurgaon and Delhi
                  NCR.
                </p>
              </Card>
              <Card className="p-6 shadow-card border-0">
                <h2 className="text-lg font-semibold text-foreground mb-2">Product &amp; engineering</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Help us improve booking flows, pricing intelligence, and dashboards for hospital and hotel partners.
                </p>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.45 }}>
              <Card className="p-6 shadow-card border-0">
                <h2 className="text-lg font-semibold text-foreground mb-4">Apply now</h2>
                <form onSubmit={submitApplication} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Full name *</Label>
                      <Input value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Email *</Label>
                      <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Role interested *</Label>
                      <Input value={role} onChange={(e) => setRole(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Experience</Label>
                      <Input value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="e.g. 4 years" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Why you are a fit</Label>
                    <Textarea rows={5} value={message} onChange={(e) => setMessage(e.target.value)} />
                  </div>
                  <Button type="submit">Submit application</Button>
                </form>
              </Card>
            </motion.div>
          </div>
        </main>
        <LandingFooter />
      </div>
    </I18nProvider>
  );
}

