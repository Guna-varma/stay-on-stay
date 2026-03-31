import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/roles";
import { getUserPhone } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { Mail, Phone, Shield, User } from "lucide-react";

function roleBadgeVariant(role: string): "default" | "secondary" | "outline" | "destructive" {
  if (role === "admin") return "destructive";
  if (role === "owner" || role === "manager") return "default";
  return "secondary";
}

export default function Profile() {
  const { user } = useAuth();
  const [mobileDisplay, setMobileDisplay] = useState("Loading...");

  useEffect(() => {
    let mounted = true;
    if (!user?.id) {
      setMobileDisplay("Not added");
      return;
    }

    getUserPhone(user.id).then(({ data, error }) => {
      if (!mounted) return;
      if (error) {
        setMobileDisplay("Not added");
        return;
      }
      const countryCode = (data?.countryCode ?? "").trim();
      const phone = (data?.phone ?? "").trim();
      setMobileDisplay(phone ? `${countryCode} ${phone}`.trim() : "Not added");
    });

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  if (!user) return null;

  const roleLabel = ROLE_LABELS[user.role] ?? user.role;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <h1 className="text-2xl font-heading font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Your account and role</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.05 }}
      >
        <Card className="overflow-hidden border-0 shadow-lg shadow-primary/5 bg-card">
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent h-24 sm:h-28" />
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-end sm:gap-6 -mt-14 sm:-mt-16">
              <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border-4 border-background shadow-xl ring-2 ring-primary/20">
                <AvatarImage src={user.avatarUrl} alt={user.displayName} />
                <AvatarFallback className="text-2xl sm:text-3xl font-semibold bg-primary/15 text-primary">
                  {user.initials}
                </AvatarFallback>
              </Avatar>
              <div className="mt-4 sm:mt-0 sm:mb-1">
                <CardTitle className="text-xl sm:text-2xl font-heading">{user.displayName || "User"}</CardTitle>
                <CardDescription className="text-sm mt-0.5">
                  <Badge variant={roleBadgeVariant(user.role)} className="font-medium mt-1">
                    {roleLabel}
                  </Badge>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Mail className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</p>
                  <p className="mt-0.5 text-sm font-medium truncate" title={user.email}>
                    {user.email || "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Shield className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</p>
                  <p className="mt-0.5 text-sm font-medium">{roleLabel}</p>
                </div>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <User className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Display name</p>
                  <p className="mt-0.5 text-sm font-medium">{user.displayName || user.email || "—"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Phone className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Mobile</p>
                  <p className="mt-0.5 text-sm font-medium">{mobileDisplay}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

