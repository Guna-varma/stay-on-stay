import { NOTIFICATIONS } from "@/data/mock-data";
import { Bell, CreditCard, CheckCircle, Sparkles, AlertTriangle, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const iconMap: Record<string, any> = {
  booking: CheckCircle,
  payment: CreditCard,
  checkin: Bell,
  cleaning: Sparkles,
  alert: AlertTriangle,
  emergency: AlertTriangle,
};

const colorMap: Record<string, string> = {
  booking: "text-success",
  payment: "text-info",
  checkin: "text-primary",
  cleaning: "text-warning",
  alert: "text-warning",
  emergency: "text-destructive",
};

export function NotificationCenter({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute right-0 top-10 w-80 sm:w-96 rounded-lg border bg-card shadow-elevated z-50 animate-fade-in">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="text-sm font-heading font-semibold">Notifications</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="max-h-80 overflow-y-auto divide-y">
        {NOTIFICATIONS.map((n) => {
          const Icon = iconMap[n.type] || Bell;
          return (
            <div key={n.id} className={`flex gap-3 px-4 py-3 ${!n.read ? "bg-accent/30" : ""}`}>
              <div className={`mt-0.5 ${colorMap[n.type]}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium">{n.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{n.message}</p>
                <span className="text-[10px] text-muted-foreground">{n.time}</span>
              </div>
              {!n.read && <Badge variant="secondary" className="h-5 text-[9px] bg-primary/10 text-primary">New</Badge>}
            </div>
          );
        })}
      </div>
    </div>
  );
}


