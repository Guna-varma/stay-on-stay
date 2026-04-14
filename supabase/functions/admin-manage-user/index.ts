import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ProfileRole = "customer" | "owner" | "manager" | "admin";

type SetRolePayload = {
  action: "set_role";
  targetUserId?: string;
  role?: ProfileRole;
};

type SetStatusPayload = {
  action: "set_status";
  targetUserId?: string;
  isActive?: boolean;
  reason?: string | null;
};

type ManageUserPayload = SetRolePayload | SetStatusPayload;

type ManagedProfileRow = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: ProfileRole;
  created_at: string;
  updated_at: string | null;
  is_active: boolean;
  deactivated_at: string | null;
  deactivated_by: string | null;
  deactivation_reason: string | null;
  deleted_at?: string | null;
};

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeRole(input: unknown): ProfileRole | null {
  const value = typeof input === "string" ? input.trim().toLowerCase() : "";
  if (value === "customer" || value === "owner" || value === "manager" || value === "admin") return value;
  return null;
}

function profileColumns() {
  return "id, email, first_name, last_name, avatar_url, role, created_at, updated_at, is_active, deactivated_at, deactivated_by, deactivation_reason, deleted_at";
}

async function countActiveAdmins(serviceSupabase: ReturnType<typeof createClient>) {
  const { count, error } = await serviceSupabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin")
    .eq("is_active", true)
    .is("deleted_at", null);

  if (error) throw error;
  return count ?? 0;
}

async function insertAuditLog(
  serviceSupabase: ReturnType<typeof createClient>,
  actor: { id: string; email: string | null; role: string },
  action: string,
  target: ManagedProfileRow,
  details: Record<string, unknown>
) {
  await serviceSupabase.from("audit_logs").insert({
    user_id: actor.id,
    user_email: actor.email,
    user_role: actor.role,
    action,
    entity: "profile",
    entity_id: target.id,
    details: JSON.stringify(details),
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json(405, { error: "method_not_allowed" });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json(401, { error: "missing_authorization" });

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !anonKey || !serviceKey) {
      return json(500, { error: "missing_supabase_env" });
    }

    const userSupabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const serviceSupabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const {
      data: { user },
      error: userError,
    } = await userSupabase.auth.getUser();

    if (userError || !user) return json(401, { error: "invalid_session" });

    const { data: callerProfile, error: callerError } = await userSupabase
      .from("profiles")
      .select("id, email, role, is_active, deleted_at")
      .eq("id", user.id)
      .maybeSingle();

    if (callerError) return json(403, { error: "caller_profile_unavailable" });

    const caller = callerProfile as {
      id: string;
      email: string | null;
      role: string;
      is_active: boolean;
      deleted_at: string | null;
    } | null;

    if (!caller || caller.deleted_at || caller.role !== "admin" || caller.is_active !== true) {
      return json(403, { error: "admin_only" });
    }

    const body = (await req.json()) as ManageUserPayload;
    const targetUserId = typeof body.targetUserId === "string" ? body.targetUserId.trim() : "";
    if (!targetUserId) return json(400, { error: "missing_target_user_id" });
    if (targetUserId === caller.id) return json(400, { error: "cannot_manage_self" });

    const { data: targetProfileRaw, error: targetError } = await serviceSupabase
      .from("profiles")
      .select(profileColumns())
      .eq("id", targetUserId)
      .maybeSingle();

    if (targetError) return json(500, { error: "target_lookup_failed", detail: targetError.message });

    const targetProfile = targetProfileRaw as ManagedProfileRow | null;
    if (!targetProfile || targetProfile.deleted_at) return json(404, { error: "target_not_found" });

    if (body.action === "set_role") {
      const nextRole = normalizeRole(body.role);
      if (!nextRole) return json(400, { error: "invalid_role" });

      if (targetProfile.role === "admin" && nextRole !== "admin") {
        const activeAdminCount = await countActiveAdmins(serviceSupabase);
        if (targetProfile.is_active && activeAdminCount <= 1) {
          return json(409, { error: "last_active_admin", message: "Keep at least one active admin account." });
        }
      }

      if (targetProfile.role === nextRole) {
        const { deleted_at: _deletedAt, ...safeUser } = targetProfile;
        return json(200, { action: "set_role", user: safeUser, message: "Role already set." });
      }

      const { data: updatedRaw, error: updateError } = await serviceSupabase
        .from("profiles")
        .update({ role: nextRole })
        .eq("id", targetUserId)
        .select(profileColumns())
        .single();

      if (updateError) return json(500, { error: "role_update_failed", detail: updateError.message });

      const updatedProfile = updatedRaw as ManagedProfileRow;

      await insertAuditLog(serviceSupabase, caller, "ADMIN_USER_ROLE_UPDATED", updatedProfile, {
        previous_role: targetProfile.role,
        next_role: nextRole,
        target_email: updatedProfile.email,
      });

      const { deleted_at: _deletedAt, ...safeUser } = updatedProfile;
      return json(200, {
        action: "set_role",
        user: safeUser,
        message: `Role updated to ${nextRole}.`,
      });
    }

    if (body.action === "set_status") {
      if (typeof body.isActive !== "boolean") return json(400, { error: "missing_is_active" });
      const nextIsActive = body.isActive;
      const reason = typeof body.reason === "string" ? body.reason.trim() : "";

      if (targetProfile.role === "admin" && targetProfile.is_active && !nextIsActive) {
        const activeAdminCount = await countActiveAdmins(serviceSupabase);
        if (activeAdminCount <= 1) {
          return json(409, { error: "last_active_admin", message: "Keep at least one active admin account." });
        }
      }

      if (targetProfile.is_active === nextIsActive) {
        const { deleted_at: _deletedAt, ...safeUser } = targetProfile;
        return json(200, { action: "set_status", user: safeUser, message: "Status already set." });
      }

      const banDuration = nextIsActive ? "none" : "876000h";
      const { error: authUpdateError } = await serviceSupabase.auth.admin.updateUserById(targetUserId, {
        ban_duration: banDuration,
      });

      if (authUpdateError) {
        return json(500, { error: "auth_status_update_failed", detail: authUpdateError.message });
      }

      const profilePatch = nextIsActive
        ? {
            is_active: true,
            deactivated_at: null,
            deactivated_by: null,
            deactivation_reason: null,
          }
        : {
            is_active: false,
            deactivated_at: new Date().toISOString(),
            deactivated_by: caller.id,
            deactivation_reason: reason || "Deactivated by admin",
          };

      const { data: updatedRaw, error: profileUpdateError } = await serviceSupabase
        .from("profiles")
        .update(profilePatch)
        .eq("id", targetUserId)
        .select(profileColumns())
        .single();

      if (profileUpdateError) {
        await serviceSupabase.auth.admin.updateUserById(targetUserId, {
          ban_duration: targetProfile.is_active ? "none" : "876000h",
        });
        return json(500, { error: "profile_status_update_failed", detail: profileUpdateError.message });
      }

      const updatedProfile = updatedRaw as ManagedProfileRow;

      await insertAuditLog(serviceSupabase, caller, "ADMIN_USER_STATUS_UPDATED", updatedProfile, {
        previous_is_active: targetProfile.is_active,
        next_is_active: nextIsActive,
        target_email: updatedProfile.email,
        reason: nextIsActive ? null : updatedProfile.deactivation_reason,
      });

      const { deleted_at: _deletedAt, ...safeUser } = updatedProfile;
      return json(200, {
        action: "set_status",
        user: safeUser,
        message: nextIsActive ? "User reactivated." : "User deactivated.",
      });
    }

    return json(400, { error: "invalid_action" });
  } catch (error) {
    return json(500, {
      error: "server_error",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
});
