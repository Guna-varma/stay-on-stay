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

const OWNER_EMAIL = "support@stayonstay.com";

export default function ContactUs() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("General enquiry");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Please fill name, email, and message.");
      return;
    }
    const body = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone || "N/A"}`,
      "",
      "Message:",
      message,
    ].join("\n");
    window.location.href = `mailto:${OWNER_EMAIL}?subject=${encodeURIComponent(`[Contact Us] ${subject}`)}&body=${encodeURIComponent(body)}`;
    toast.success("Your email draft is ready. Send it to contact the owners.");
  };

  return (
    <I18nProvider>
      <div className="min-h-screen bg-background">
        <LandingHeader />
        <main className="py-12 lg:py-16">
          <div className="max-w-page space-y-8">
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="max-w-3xl">
              <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-3">Contact Us</h1>
              <p className="text-muted-foreground leading-relaxed">
                Reach our team for booking support, long-stay requirements, airport pickup, and hospital-nearby stay planning.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.45 }} className="lg:col-span-2">
                <Card className="p-6 border-0 shadow-card">
                  <h2 className="text-lg font-semibold text-foreground mb-4">Send a message to owners</h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Full name *</Label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
                      </div>
                      <div className="space-y-2">
                        <Label>Email *</Label>
                        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91..." />
                      </div>
                      <div className="space-y-2">
                        <Label>Subject</Label>
                        <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Message *</Label>
                      <Textarea rows={6} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Tell us your requirement..." />
                    </div>
                    <Button type="submit">Send enquiry</Button>
                  </form>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.45 }} className="space-y-4">
                <Card className="p-5 border-0 shadow-card">
                  <h3 className="font-semibold text-foreground mb-2">Contact channels</h3>
                  <p className="text-sm text-muted-foreground">
                    Email: <a href={`mailto:${OWNER_EMAIL}`} className="text-primary hover:underline">{OWNER_EMAIL}</a>
                  </p>
                  <p className="text-sm text-muted-foreground">Phone: +91 99999 99999</p>
                </Card>
                <Card className="p-5 border-0 shadow-card">
                  <h3 className="font-semibold text-foreground mb-2">Support hours</h3>
                  <p className="text-sm text-muted-foreground">Mon-Sun: 7:00 AM - 11:00 PM (IST)</p>
                  <p className="text-sm text-muted-foreground">Critical stay support: 24/7</p>
                </Card>
              </motion.div>
            </div>
          </div>
        </main>
        <LandingFooter />
      </div>
    </I18nProvider>
  );
}

