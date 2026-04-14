/**
 * Admin-only: production user lifecycle management.
 * Lists all users with filters, role updates, and active/inactive controls.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  adminUpdateUserRole,
  adminUpdateUserStatus,
  isSupabaseConfigured,
  listUsersForAdmin,
  type AdminUserListCursor,
  type Profile,
  type ProfileRole,
} from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/roles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const ALLOWED_ROLES: ProfileRole[] = ["customer", "owner", "manager"];

type RoleFilter = ProfileRole | "all";
type StatusFilter = "all" | "active" | "inactive";

export function AdminUserRoleManager() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [cursor, setCursor] = useState<AdminUserListCursor | null>(null);
  const [statusDialog, setStatusDialog] = useState<{ profile: Profile; nextActive: boolean } | null>(null);

  const isAdmin = user?.role === "admin";
  const hasSupabase = isSupabaseConfigured();

  const normalizedIsActive = useMemo(() => {
    if (statusFilter === "active") return true;
    if (statusFilter === "inactive") return false;
    return "all" as const;
  }, [statusFilter]);

  const loadUsers = useCallback(async (append: boolean, cursorArg: AdminUserListCursor | null = null) => {
    if (!hasSupabase || !isAdmin) {
      setProfiles([]);
      setCursor(null);
      setLoading(false);
      return;
    }

    if (append) setLoadingMore(true);
    else setLoading(true);

    const { data, error, nextCursor } = await listUsersForAdmin({
      search,
      role: roleFilter,
      isActive: normalizedIsActive,
      pageSize: 50,
      cursor: append ? cursorArg : null,
    });

    if (error) {
      toast.error("Failed to load users: " + error.message);
      if (!append) setProfiles([]);
      setCursor(null);
    } else {
      setProfiles((prev) => (append ? [...prev, ...data] : data));
      setCursor(nextCursor);
    }

    if (append) setLoadingMore(false);
    else setLoading(false);
  }, [hasSupabase, isAdmin, normalizedIsActive, roleFilter, search]);

  useEffect(() => {
    if (!hasSupabase || !isAdmin) {
      setLoading(false);
      return;
    }
    const timeout = window.setTimeout(() => {
      loadUsers(false);
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [hasSupabase, isAdmin, loadUsers]);

  const handleRoleChange = async (profileId: string, newRole: ProfileRole) => {
    if (user?.id === profileId) {
      toast.error("You cannot change your own role.");
      return;
    }

    setUpdatingId(profileId);
    const { data, error } = await adminUpdateUserRole({ targetUserId: profileId, role: newRole });
    setUpdatingId(null);

    if (error) {
      toast.error("Failed to update role: " + error.message);
      return;
    }

    if (data?.user) {
      setProfiles((prev) => prev.map((p) => (p.id === profileId ? data.user : p)));
    }
    toast.success(data?.message ?? "Role updated.");
  };

  const confirmStatusChange = async () => {
    if (!statusDialog) return;

    const { profile, nextActive } = statusDialog;
    setUpdatingId(profile.id);
    const { data, error } = await adminUpdateUserStatus({
      targetUserId: profile.id,
      isActive: nextActive,
      reason: nextActive ? null : "Deactivated from Admin Users",
    });
    setUpdatingId(null);
    setStatusDialog(null);

    if (error) {
      toast.error("Failed to update status: " + error.message);
      return;
    }

    if (data?.user) {
      setProfiles((prev) => prev.map((p) => (p.id === profile.id ? data.user : p)));
    }
    toast.success(data?.message ?? "User status updated.");
  };

  if (!hasSupabase || !isAdmin) return null;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">User management (Supabase)</CardTitle>
          <p className="text-xs text-muted-foreground">
            Admin can list every active or inactive user, change roles, and reactivate or deactivate accounts.
            Self-role and self-status changes are blocked.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="admin-user-search">Search user</Label>
              <Input
                id="admin-user-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as RoleFilter)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <Skeleton className="h-40 w-full" />
          ) : profiles.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              No users match the current filters.
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Account</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.map((profile) => {
                    const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();
                    const joinedDate = new Date(profile.created_at).toLocaleDateString();
                    const isBusy = updatingId === profile.id;
                    const isSelf = profile.id === user?.id;

                    return (
                      <TableRow key={profile.id}>
                        <TableCell className="min-w-[240px]">
                          <div className="space-y-1">
                            <p className="font-medium">{fullName || profile.email || profile.id.slice(0, 8)}</p>
                            <p className="text-xs text-muted-foreground">{profile.email ?? "No email"}</p>
                            {profile.deactivation_reason && !profile.is_active && (
                              <p className="text-xs text-muted-foreground">Reason: {profile.deactivation_reason}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={profile.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}>
                            {profile.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={profile.role}
                            disabled={isBusy || isSelf}
                            onValueChange={(value) => handleRoleChange(profile.id, value as ProfileRole)}
                          >
                            <SelectTrigger className="w-[170px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ALLOWED_ROLES.map((role) => (
                                <SelectItem key={role} value={role}>
                                  {ROLE_LABELS[role] ?? role}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>{joinedDate}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isBusy && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                            <Button
                              type="button"
                              size="sm"
                              variant={profile.is_active ? "destructive" : "outline"}
                              disabled={isBusy || isSelf}
                              onClick={() => setStatusDialog({ profile, nextActive: !profile.is_active })}
                            >
                              {profile.is_active ? "Deactivate" : "Reactivate"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Exact user lookups use indexed email search, and the table uses paginated server-side loading for production scale.
            </p>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={() => loadUsers(false)} disabled={loading || loadingMore}>
                Refresh
              </Button>
              <Button type="button" variant="outline" onClick={() => loadUsers(true, cursor)} disabled={!cursor || loading || loadingMore}>
                {loadingMore ? "Loading..." : "Load more"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={Boolean(statusDialog)} onOpenChange={(open) => !open && setStatusDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {statusDialog?.nextActive ? "Reactivate user?" : "Deactivate user?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {statusDialog?.nextActive
                ? "This restores database access and allows the user to sign in again."
                : "This immediately blocks database access and bans future sign-ins until the account is reactivated."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(updatingId)}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={Boolean(updatingId)} onClick={confirmStatusChange}>
              {statusDialog?.nextActive ? "Reactivate" : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
