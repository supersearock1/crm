import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AdminFormSubmitButton } from "@/components/admin/admin-form-submit-button";
import { requireAdmin } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteUrl } from "@/lib/config/url";
import type { Profile, AgentStatus, AdminActionLog } from "@/lib/auth/types";

type AdminAgentsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminAgentsPage({ searchParams }: AdminAgentsPageProps) {
  await requireAdmin();
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim().toLowerCase() : "";
  const filterStatus =
    typeof params.status === "string" && ["active", "readonly", "blocked"].includes(params.status)
      ? (params.status as AgentStatus)
      : "all";
  const currentPage =
    typeof params.page === "string" && Number(params.page) > 0
      ? Number(params.page)
      : 1;
  const pageSize = 10;
  const from = (currentPage - 1) * pageSize;
  const to = from + pageSize - 1;
  const message =
    typeof params.message === "string"
      ? decodeURIComponent(params.message)
      : undefined;
  const error =
    typeof params.error === "string"
      ? decodeURIComponent(params.error)
      : undefined;

  const adminClient = createAdminClient();
  let agentsQuery = adminClient
    .from("profiles")
    .select("id,email,role,status,is_primary_admin,created_at,updated_at")
    .eq("role", "agent");

  if (filterStatus !== "all") {
    agentsQuery = agentsQuery.eq("status", filterStatus);
  }
  if (query) {
    agentsQuery = agentsQuery.ilike("email", `%${query}%`);
  }

  const { data: paginatedAgentsRaw } = await agentsQuery
    .order("created_at", { ascending: false })
    .range(from, to)
    .returns<Profile[]>();

  let agentsCountQuery = adminClient
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "agent");
  if (filterStatus !== "all") {
    agentsCountQuery = agentsCountQuery.eq("status", filterStatus);
  }
  if (query) {
    agentsCountQuery = agentsCountQuery.ilike("email", `%${query}%`);
  }
  const { count: filteredCount = 0 } = await agentsCountQuery;

  const totalPages = Math.max(1, Math.ceil((filteredCount ?? 0) / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const { data: allAgentsRaw } = await adminClient
    .from("profiles")
    .select("id,email,role,status,is_primary_admin,created_at,updated_at")
    .eq("role", "agent")
    .order("created_at", { ascending: false })
    .returns<Profile[]>();

  const agents = paginatedAgentsRaw ?? [];

  const totalAgents = (allAgentsRaw ?? []).length;
  const activeAgents = (allAgentsRaw ?? []).filter((agent) => agent.status === "active").length;
  const readonlyAgents = (allAgentsRaw ?? []).filter((agent) => agent.status === "readonly").length;
  const blockedAgents = (allAgentsRaw ?? []).filter((agent) => agent.status === "blocked").length;

  const { data: logsRaw } = await adminClient
    .from("admin_action_logs")
    .select("id,actor_id,actor_email,target_user_id,target_email,action_type,action_payload,created_at")
    .order("created_at", { ascending: false })
    .limit(10)
    .returns<AdminActionLog[]>();
  const logs = logsRaw ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl tracking-tight text-[#1A1A1A]">Agent Management</h1>
      </div>

      {message && <p className="text-sm text-green-700">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <Card className="border-[#E0DDD9] bg-white">
        <CardHeader>
          <CardTitle>Agent Activity Visibility</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Total Agents", value: totalAgents, hint: "All created accounts" },
              { label: "Active", value: activeAgents, hint: "Can login and work" },
              { label: "Read-only", value: readonlyAgents, hint: "Restricted updates" },
              { label: "Blocked", value: blockedAgents, hint: "Login disabled" },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-[#EAE7E2] bg-[#FAF9F7] p-4">
                <p className="text-xs uppercase tracking-widest text-gray-500">{item.label}</p>
                <p className="mt-2 text-2xl tracking-tight text-[#1A1A1A]">{item.value}</p>
                <p className="mt-1 text-xs text-gray-500">{item.hint}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#E0DDD9] bg-white">
        <CardHeader>
          <CardTitle>Search and Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form action="/admin/agents" method="get" className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            <Input
              name="q"
              defaultValue={query}
              placeholder="Search by agent email"
              className="h-10 rounded-lg border-[#CEC8BF] bg-white px-3.5 text-sm shadow-sm"
            />
            <div className="relative">
              <select
                name="status"
                defaultValue={filterStatus}
                className="h-10 w-full appearance-none rounded-lg border border-[#CEC8BF] pl-3.5 pr-10 text-sm bg-white shadow-sm"
              >
                <option value="all">all statuses</option>
                <option value="active">active</option>
                <option value="readonly">readonly</option>
                <option value="blocked">blocked</option>
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500">
                ▾
              </span>
            </div>
            <AdminFormSubmitButton
              idleText="Apply filters"
              pendingText="Applying..."
              variant="outline"
              className="h-10 rounded-lg text-sm"
            />
          </form>
          <p className="mt-3 text-xs text-gray-500">
            Showing {agents.length} of {filteredCount} filtered agents.
          </p>
        </CardContent>
      </Card>

      <Card className="border-[#E0DDD9] bg-white">
        <CardHeader>
          <CardTitle>Bulk Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={bulkUpdateAgentsStatusAction} className="space-y-3">
            <div className="rounded-lg border border-[#CEC8BF] bg-[#FCFBFA] p-2.5">
              <p className="mb-2 text-xs uppercase tracking-widest text-gray-500">Select agents</p>
              <select
                name="agentIds"
                multiple
                required
                className="h-32 w-full rounded-md border border-[#E0DDD9] bg-white px-2.5 py-2 text-sm"
              >
                {(allAgentsRaw ?? []).map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.email} ({agent.status})
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-gray-500">
                Hold Cmd/Ctrl to select multiple agents.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-end">
              <div className="w-full sm:w-60">
                <p className="mb-1.5 text-xs uppercase tracking-widest text-gray-500">New status</p>
                <div className="relative">
                  <select
                    name="status"
                    required
                    className="h-10 w-full appearance-none rounded-lg border border-[#CEC8BF] pl-3 pr-10 text-sm bg-white shadow-sm"
                    defaultValue="active"
                  >
                    <option value="active">Set active</option>
                    <option value="readonly">Set readonly</option>
                    <option value="blocked">Set blocked</option>
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500">
                    ▾
                  </span>
                </div>
              </div>

              <AdminFormSubmitButton
                idleText="Apply to selected"
                pendingText="Applying..."
                className="h-10 rounded-lg bg-[#E55B3C] hover:bg-[#c94b2f] text-sm sm:px-6"
              />
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-[#E0DDD9] bg-white">
        <CardHeader>
          <CardTitle>Create agent (invite by email)</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={inviteAgentAction} className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            <Input
              name="email"
              type="email"
              placeholder="agent@agency.com"
              required
              className="h-10 rounded-lg border-[#CEC8BF] bg-white px-3.5 text-sm shadow-sm"
            />
            <Input
              name="name"
              type="text"
              placeholder="Agent name (optional)"
              className="h-10 rounded-lg border-[#CEC8BF] bg-white px-3.5 text-sm shadow-sm"
            />
            <AdminFormSubmitButton
              idleText="Create and send invite"
              pendingText="Sending invite..."
              className="h-10 rounded-lg bg-[#E55B3C] hover:bg-[#c94b2f] text-sm"
            />
          </form>
        </CardContent>
      </Card>

      <Card className="border-[#E0DDD9] bg-white">
        <CardHeader>
          <CardTitle>Agents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {agents.length === 0 && (
            <p className="text-sm text-gray-500">No agents match this filter.</p>
          )}

          {agents.map((agent) => (
            <div
              key={agent.id}
              className="border border-[#E0DDD9] bg-[#FCFBFA] p-3.5 rounded-md space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{agent.email}</p>
                  <p className="text-xs text-gray-500">
                    Status: {agent.status} • Added {new Date(agent.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2">
                <form action={updateAgentStatusAction} className="flex gap-2">
                  <input type="hidden" name="agentId" value={agent.id} />
                  <div className="relative">
                    <select
                      name="status"
                      defaultValue={agent.status}
                      className="h-10 appearance-none rounded-lg border border-[#CEC8BF] pl-3 pr-10 text-sm bg-white shadow-sm"
                    >
                      <option value="active">active</option>
                      <option value="readonly">readonly</option>
                      <option value="blocked">blocked</option>
                    </select>
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500">
                      ▾
                    </span>
                  </div>
                  <AdminFormSubmitButton
                    idleText="Save status"
                    pendingText="Saving..."
                    variant="outline"
                    className="h-10 rounded-lg text-sm"
                  />
                </form>

                <form action={sendResetLinkByAdminAction}>
                  <input type="hidden" name="agentEmail" value={agent.email} />
                  <AdminFormSubmitButton
                    idleText="Send reset link"
                    pendingText="Sending..."
                    variant="outline"
                    className="w-full h-10 rounded-lg text-sm"
                  />
                </form>

                <form action={setTemporaryPasswordAction} className="flex gap-2">
                  <input type="hidden" name="agentId" value={agent.id} />
                  <Input
                    name="newPassword"
                    type="password"
                    minLength={8}
                    placeholder="Temp password"
                    required
                    className="h-10 rounded-lg border-[#CEC8BF] bg-white px-3 text-sm shadow-sm"
                  />
                  <AdminFormSubmitButton
                    idleText="Set password"
                    pendingText="Setting..."
                    variant="outline"
                    className="h-10 rounded-lg text-sm"
                  />
                </form>

                <form action={deleteAgentAction} className="flex gap-2">
                  <input type="hidden" name="agentId" value={agent.id} />
                  <AdminFormSubmitButton
                    idleText="Delete agent"
                    pendingText="Deleting..."
                    variant="outline"
                    className="w-full h-10 rounded-lg text-sm border-[#E55B3C] text-[#E55B3C] hover:bg-[#FDF2F0] hover:text-[#c94b2f]"
                  />
                </form>
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between border-t border-[#EAE7E2] pt-4">
            <p className="text-xs text-gray-500">
              Page {safePage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <a
                href={`/admin/agents?page=${Math.max(1, safePage - 1)}&status=${filterStatus}&q=${encodeURIComponent(query)}`}
                className={`rounded-md border px-3 py-1.5 text-sm ${
                  safePage <= 1
                    ? "pointer-events-none border-gray-200 text-gray-400"
                    : "border-[#E0DDD9] text-[#1A1A1A] hover:bg-[#F4F1ED]"
                }`}
              >
                Previous
              </a>
              <a
                href={`/admin/agents?page=${Math.min(totalPages, safePage + 1)}&status=${filterStatus}&q=${encodeURIComponent(query)}`}
                className={`rounded-md border px-3 py-1.5 text-sm ${
                  safePage >= totalPages
                    ? "pointer-events-none border-gray-200 text-gray-400"
                    : "border-[#E0DDD9] text-[#1A1A1A] hover:bg-[#F4F1ED]"
                }`}
              >
                Next
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#E0DDD9] bg-white">
        <CardHeader>
          <CardTitle>Action Audit Log</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="max-h-80 overflow-y-auto pr-1 space-y-2">
          {logs.length === 0 && (
            <p className="text-sm text-gray-500">
              No audit logs yet. Run the updated SQL schema to enable logs table.
            </p>
          )}
          {logs.map((log) => (
            <div key={log.id} className="rounded-lg border border-[#EAE7E2] bg-[#FAF9F7] p-3 text-sm">
              <p className="text-[#1A1A1A]">
                <span className="font-medium">{log.actor_email}</span> performed{" "}
                <span className="font-medium">{log.action_type}</span>
                {log.target_email ? ` on ${log.target_email}` : ""}.
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {new Date(log.created_at).toLocaleString()}
              </p>
            </div>
          ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

async function inviteAgentAction(formData: FormData) {
  "use server";

  const { profile: adminProfile } = await requireAdmin();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  if (!email) {
    redirect("/admin/agents?error=Email%20is%20required.");
  }
  const adminClient = createAdminClient();
  const siteUrl = await getSiteUrl();

  const { data: existingProfile } = await adminClient
    .from("profiles")
    .select("id,email")
    .eq("email", email)
    .maybeSingle();

  if (existingProfile) {
    redirect("/admin/agents?error=Agent%20with%20this%20email%20already%20exists.");
  }

  const { data: inviteData, error: inviteError } =
    await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent("/reset-password")}`,
      data: { full_name: name || null },
    });

  if (inviteError || !inviteData.user) {
    redirect(`/admin/agents?error=${encodeURIComponent(inviteError?.message ?? "Unable to invite agent.")}`);
  }

  const { error: profileError } = await adminClient.from("profiles").upsert({
    id: inviteData.user.id,
    email,
    role: "agent",
    status: "active",
    is_primary_admin: false,
  });

  if (profileError) {
    redirect(`/admin/agents?error=${encodeURIComponent(profileError.message)}`);
  }

  await logAdminAction({
    actorId: adminProfile.id,
    actorEmail: adminProfile.email,
    targetUserId: inviteData.user.id,
    targetEmail: email,
    actionType: "invite_agent",
    actionPayload: { name: name || null },
  });

  revalidatePath("/admin/agents");
  redirect(`/admin/agents?message=${encodeURIComponent("Invite email sent.")}&toast=${Date.now()}`);
}

async function updateAgentStatusAction(formData: FormData) {
  "use server";

  const { profile: adminProfile } = await requireAdmin();
  const agentId = String(formData.get("agentId") ?? "");
  const status = String(formData.get("status") ?? "") as AgentStatus;

  if (!["active", "readonly", "blocked"].includes(status)) {
    redirect("/admin/agents?error=Invalid%20agent%20status.");
  }

  const adminClient = createAdminClient();
  const { data: targetProfile } = await adminClient
    .from("profiles")
    .select("email")
    .eq("id", agentId)
    .maybeSingle();
  const { error } = await adminClient
    .from("profiles")
    .update({ status })
    .eq("id", agentId)
    .eq("role", "agent");

  if (error) {
    redirect(`/admin/agents?error=${encodeURIComponent(error.message)}`);
  }

  await logAdminAction({
    actorId: adminProfile.id,
    actorEmail: adminProfile.email,
    targetUserId: agentId,
    targetEmail: targetProfile?.email ?? null,
    actionType: "update_agent_status",
    actionPayload: { status },
  });

  revalidatePath("/admin/agents");
  redirect(`/admin/agents?message=${encodeURIComponent("Agent status saved.")}&toast=${Date.now()}`);
}

async function sendResetLinkByAdminAction(formData: FormData) {
  "use server";

  const { profile: adminProfile } = await requireAdmin();
  const email = String(formData.get("agentEmail") ?? "").trim().toLowerCase();
  const siteUrl = await getSiteUrl();
  const adminClient = createAdminClient();
  const { error } = await adminClient.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent("/reset-password")}`,
  });

  if (error) {
    redirect(`/admin/agents?error=${encodeURIComponent(error.message)}`);
  }

  await logAdminAction({
    actorId: adminProfile.id,
    actorEmail: adminProfile.email,
    targetUserId: null,
    targetEmail: email,
    actionType: "send_reset_link",
    actionPayload: null,
  });

  redirect(`/admin/agents?message=${encodeURIComponent("Reset link email sent.")}&toast=${Date.now()}`);
}

async function setTemporaryPasswordAction(formData: FormData) {
  "use server";

  const { profile: adminProfile } = await requireAdmin();
  const agentId = String(formData.get("agentId") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  if (newPassword.length < 8) {
    redirect("/admin/agents?error=Temporary%20password%20must%20be%20at%20least%208%20characters.");
  }
  const adminClient = createAdminClient();
  const { data: targetProfile } = await adminClient
    .from("profiles")
    .select("email")
    .eq("id", agentId)
    .maybeSingle();
  const { error } = await adminClient.auth.admin.updateUserById(agentId, {
    password: newPassword,
  });

  if (error) {
    redirect(`/admin/agents?error=${encodeURIComponent(error.message)}`);
  }

  await logAdminAction({
    actorId: adminProfile.id,
    actorEmail: adminProfile.email,
    targetUserId: agentId,
    targetEmail: targetProfile?.email ?? null,
    actionType: "set_temporary_password",
    actionPayload: null,
  });

  redirect(`/admin/agents?message=${encodeURIComponent("Temporary password updated.")}&toast=${Date.now()}`);
}

async function bulkUpdateAgentsStatusAction(formData: FormData) {
  "use server";

  const { profile: adminProfile } = await requireAdmin();
  const agentIds = formData.getAll("agentIds").map(String).filter(Boolean);
  const status = String(formData.get("status") ?? "") as AgentStatus;

  if (!agentIds.length) {
    redirect("/admin/agents?error=Select%20at%20least%20one%20agent.");
  }
  if (!["active", "readonly", "blocked"].includes(status)) {
    redirect("/admin/agents?error=Invalid%20bulk%20status.");
  }

  const adminClient = createAdminClient();
  const { data: targetProfiles } = await adminClient
    .from("profiles")
    .select("id,email")
    .in("id", agentIds)
    .eq("role", "agent");

  const { error } = await adminClient
    .from("profiles")
    .update({ status })
    .in("id", agentIds)
    .eq("role", "agent");

  if (error) {
    redirect(`/admin/agents?error=${encodeURIComponent(error.message)}`);
  }

  await logAdminAction({
    actorId: adminProfile.id,
    actorEmail: adminProfile.email,
    targetUserId: null,
    targetEmail: null,
    actionType: "bulk_update_agent_status",
    actionPayload: {
      status,
      targetEmails: (targetProfiles ?? []).map((p) => p.email),
      total: agentIds.length,
    },
  });

  revalidatePath("/admin/agents");
  redirect("/admin/agents?message=Bulk%20status%20update%20completed.");
}

async function logAdminAction(input: {
  actorId: string;
  actorEmail: string;
  targetUserId: string | null;
  targetEmail: string | null;
  actionType: string;
  actionPayload: Record<string, unknown> | null;
}) {
  const adminClient = createAdminClient();
  const { error } = await adminClient.from("admin_action_logs").insert({
    actor_id: input.actorId,
    actor_email: input.actorEmail,
    target_user_id: input.targetUserId,
    target_email: input.targetEmail,
    action_type: input.actionType,
    action_payload: input.actionPayload,
  });

  // If schema not migrated yet, do not block core admin operations.
  if (error) {
    return;
  }
}

async function deleteAgentAction(formData: FormData) {
  "use server";

  const { profile: adminProfile } = await requireAdmin();
  const agentId = String(formData.get("agentId") ?? "");
  const adminClient = createAdminClient();

  if (!agentId) {
    redirect("/admin/agents?error=Agent%20ID%20is%20required.");
  }

  const { data: targetProfile } = await adminClient
    .from("profiles")
    .select("email")
    .eq("id", agentId)
    .maybeSingle();

  // Unassign all leads and tasks currently assigned to this agent
  await adminClient.from("leads").update({ assigned_agent_id: null }).eq("assigned_agent_id", agentId);
  await adminClient.from("follow_up_tasks").update({ assigned_agent_id: null }).eq("assigned_agent_id", agentId);
  
  // Disable assignment rules
  await adminClient.from("lead_assignment_rules").update({ is_active: false }).eq("agent_id", agentId);

  // Attempt hard delete
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(agentId);

  if (deleteError) {
    // Soft delete fallback: change status to blocked, scramble email, and ban user
    if (targetProfile?.email) {
      const deletedEmail = `deleted_${Date.now()}_${targetProfile.email}`;
      await adminClient.auth.admin.updateUserById(agentId, {
        email: deletedEmail,
        ban_duration: "876000h",
      });
      await adminClient.from("profiles").update({
        status: "blocked",
        email: deletedEmail,
      }).eq("id", agentId);
    }

    await logAdminAction({
      actorId: adminProfile.id,
      actorEmail: adminProfile.email,
      targetUserId: agentId,
      targetEmail: targetProfile?.email ?? null,
      actionType: "soft_delete_agent",
      actionPayload: { reason: deleteError.message },
    });

    revalidatePath("/admin/agents");
    redirect(`/admin/agents?message=${encodeURIComponent("Agent soft-deleted (historical data preserved). Leads unassigned.")}&toast=${Date.now()}`);
  }

  await logAdminAction({
    actorId: adminProfile.id,
    actorEmail: adminProfile.email,
    targetUserId: agentId,
    targetEmail: targetProfile?.email ?? null,
    actionType: "hard_delete_agent",
    actionPayload: null,
  });

  revalidatePath("/admin/agents");
  redirect(`/admin/agents?message=${encodeURIComponent("Agent deleted successfully. Leads unassigned.")}&toast=${Date.now()}`);
}
