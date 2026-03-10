import { NOTIFICATIONS } from "@/data/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, CreditCard, CheckCircle, Sparkles, AlertTriangle } from "lucide-react";

const iconMap: Record<string, any> = { booking: CheckCircle, payment: CreditCard, checkin: Bell, cleaning: Sparkles, alert: AlertTriangle, emergency: AlertTriangle };
const colorMap: Record<string, string> = { booking: "text-success", payment: "text-info", checkin: "text-primary", cleaning: "text-warning", alert: "text-warning", emergency: "text-destructive" };

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Notifications</h1>
        <p className="text-sm text-muted-foreground">Stay updated with your stay activity</p>
      </div>
      <div className="space-y-3">
        {NOTIFICATIONS.map(n => {
          const Icon = iconMap[n.type] || Bell;
          return (
            <Card key={n.id} className={!n.read ? "border-primary/20 bg-accent/20" : ""}>
              <CardContent className="p-4 flex items-start gap-3">
                <div className={`mt-0.5 ${colorMap[n.type]}`}><Icon className="h-4 w-4" /></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{n.title}</p>
                    {!n.read && <Badge className="bg-primary/10 text-primary text-[9px]">New</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{n.time}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
