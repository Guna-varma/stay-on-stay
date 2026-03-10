import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, AlertTriangle, MapPin, Shield } from "lucide-react";
import { toast } from "sonner";

export default function Emergency() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-destructive">Emergency Help</h1>
        <p className="text-sm text-muted-foreground">Get immediate assistance</p>
      </div>

      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-heading font-bold mb-2">Panic Alert</h2>
          <p className="text-sm text-muted-foreground mb-4">Press the button below to send an immediate alert to hotel security and management</p>
          <Button variant="destructive" size="lg" className="text-base px-8" onClick={() => toast.error("🚨 Emergency alert sent! Security team has been notified.")}>
            <Phone className="h-5 w-5 mr-2" /> Send Emergency Alert
          </Button>
        </CardContent>
      </Card>

      <div className="grid sm:grid-cols-2 gap-4">
        {[
          { title: "Hotel Reception", number: "+91-124-456-7890", desc: "24/7 front desk support" },
          { title: "Medical Emergency", number: "108", desc: "Ambulance service" },
          { title: "Police", number: "100", desc: "Law enforcement" },
          { title: "Embassy Helpline", number: "+91-11-2419-8000", desc: "Consular assistance" },
        ].map(c => (
          <Card key={c.title}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                <Phone className="h-5 w-5 text-destructive" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{c.title}</p>
                <p className="text-xs text-muted-foreground">{c.desc}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => toast.info(`Calling ${c.number}...`)}>{c.number}</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
