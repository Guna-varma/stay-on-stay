import { useCallback, useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, CreditCard, CheckCircle, Loader2, Sparkles, AlertTriangle } from "lucide-react";
import {
  fetchCustomerNotifications,
  markCustomerNotificationRead,
  type CustomerNotification,
} from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const iconMap: Record<string, typeof Bell> = {
  booking_confirmed: CheckCircle,
  payment: CreditCard,
  info: Bell,
  alert: AlertTriangle,
  emergency: AlertTriangle,
};

const colorMap: Record<string, string> = {
  booking_confirmed: "text-emerald-600",
  payment: "text-sky-600",
  info: "text-primary",
  alert: "text-amber-600",
  emergency: "text-destructive",
};

export default function NotificationsPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<CustomerNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await fetchCustomerNotifications();
    if (error) {
      toast({
        title: "Could not load notifications",
        description: error.message,
        variant: "destructive",
      });
      setItems([]);
    } else {
      setItems(data);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const onOpen = async (n: CustomerNotification) => {
    if (n.read_at) return;
    const { error } = await markCustomerNotificationRead(n.id);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)));
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-1 sm:px-0">
      <div>
        <h1 className="text-xl font-heading font-bold sm:text-2xl">Notifications</h1>
        <p className="text-sm text-muted-foreground">Booking updates and account messages</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
        </div>
      ) : items.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Sparkles className="h-10 w-10 text-muted-foreground/50" aria-hidden />
            <p className="text-sm font-medium text-foreground">You&apos;re all caught up</p>
            <p className="text-xs text-muted-foreground">
              When a booking is confirmed, you&apos;ll see it here. A receipt is also emailed to you when we have your
              email.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((n) => {
            const Icon = iconMap[n.notification_type] || Bell;
            const color = colorMap[n.notification_type] || "text-primary";
            const unread = !n.read_at;
            return (
              <Card
                key={n.id}
                className={cn(
                  "transition-colors",
                  unread ? "border-primary/25 bg-primary/[0.04]" : "",
                )}
              >
                <CardContent className="flex items-start gap-3 p-4 sm:p-5">
                  <button
                    type="button"
                    className="flex flex-1 items-start gap-3 text-left"
                    onClick={() => void onOpen(n)}
                  >
                    <div className={cn("mt-0.5 shrink-0", color)}>
                      <Icon className="h-4 w-4" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium leading-snug">{n.title}</p>
                        {unread && (
                          <Badge className="bg-primary/15 text-[10px] text-primary hover:bg-primary/15">New</Badge>
                        )}
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{n.body}</p>
                      <p className="mt-2 text-[10px] text-muted-foreground/90">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
