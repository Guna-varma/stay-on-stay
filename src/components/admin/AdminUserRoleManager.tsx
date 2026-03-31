/**
 * Admin-only: manage user roles via Supabase.
 * RLS ensures only admin can list/update profiles; users cannot change their own role.
 */
import { useEffect, useState } from "react";
import {
  isSupabaseConfigured,
  listProfilesForAdmin,
  updateUserRole,
  type Profile,
  type ProfileRole,
} from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ROLE_LABELS } from "@/lib/roles";
import { toast } from "sonner";

const ALLOWED_ROLES: ProfileRole[] = ["customer", "owner", "manager"]; // admin can assign these

export function AdminUserRoleManager() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const isAdmin = user?.role === "admin";
  const hasSupabase = isSupabaseConfigured();

  useEffect(() => {
    if (!hasSupabase || !isAdmin) {
      setLoading(false);
      return;
    }
    let mounted = true;
    listProfilesForAdmin().then(({ data, error }) => {
      if (!mounted) return;
      if (error) {
        toast.error("Failed to load users: " + (error as Error).message);
        setLoading(false);
        return;
      }
      setProfiles(data);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [hasSupabase, isAdmin]);

  const handleRoleChange = async (profileId: string, newRole: ProfileRole) => {
    if (user?.id === profileId) {
      toast.error("You cannot change your own role.");
      return;
    }
    setUpdatingId(profileId);
    const { error } = await updateUserRole(profileId, newRole);
    setUpdatingId(null);
    if (error) {
      toast.error("Failed to update role: " + (error as Error).message);
      return;
    }
    setProfiles((prev) =>
      prev.map((p) => (p.id === profileId ? { ...p, role: newRole } : p))
    );
    toast.success("Role updated.");
  };

  if (!hasSupabase || !isAdmin) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Role management (Supabase)</CardTitle>
        <p className="text-xs text-muted-foreground">
          Only admin can change roles. You cannot change your own role.
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <ul className="space-y-2">
            {profiles.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-2 text-sm"
              >
                <span className="font-medium">{p.email ?? p.id.slice(0, 8)}</span>
                <Select
                  value={p.role}
                  disabled={updatingId === p.id || p.id === user?.id}
                  onValueChange={(value) =>
                    handleRoleChange(p.id, value as ProfileRole)
                  }
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALLOWED_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABELS[r as keyof typeof ROLE_LABELS] ?? r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
