import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/lib/auth/types";
import { sendRoundRobinSummaryEmail } from "@/lib/email/round-robin-summary";
import {
  createRoundRobinRun,
  updateRoundRobinRun,
} from "@/lib/distribution/round-robin-progress";

const BATCH_SIZE = 50;

export async function POST() {
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminClient = createAdminClient();
  const { data: adminProfile } = await adminClient
    .from("profiles")
    .select("id,email,role,is_primary_admin,status")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  if (
    !adminProfile ||
    adminProfile.role !== "admin" ||
    !adminProfile.is_primary_admin ||
    adminProfile.status === "blocked"
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: agents } = await adminClient
    .from("profiles")
    .select("id,email,role,status,is_primary_admin,created_at,updated_at")
    .eq("role", "agent")
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .returns<Profile[]>();

  if (!agents || agents.length === 0) {
    return NextResponse.json({ error: "No active agents available." }, { status: 400 });
  }

  const { data: leads } = await adminClient
    .from("leads")
    .select("id,full_name,assigned_agent_id")
    .is("assigned_agent_id", null)
    .in("status", ["new", "assigned", "follow_up", "interested"])
    .order("created_at", { ascending: true })
    .returns<Array<{ id: string; full_name: string; assigned_agent_id: string | null }>>();

  if (!leads || leads.length === 0) {
    return NextResponse.json({ error: "No unassigned leads to distribute." }, { status: 400 });
  }

  const totalBatches = Math.ceil(leads.length / BATCH_SIZE);
  const run = createRoundRobinRun(leads.length, totalBatches);

  void executeRoundRobin(run.runId, {
    leads,
    agents,
    adminId: adminProfile.id,
    adminEmail: adminProfile.email,
  });

  return NextResponse.json({
    runId: run.runId,
    totalLeads: run.totalLeads,
    totalBatches: run.totalBatches,
    batchSize: BATCH_SIZE,
  });
}

async function executeRoundRobin(
  runId: string,
  input: {
    leads: Array<{ id: string; full_name: string; assigned_agent_id: string | null }>;
    agents: Profile[];
    adminId: string;
    adminEmail: string;
  },
) {
  const adminClient = createAdminClient();
  const assignedLeadNamesByAgent = new Map<string, string[]>();

  try {
    for (let batchStart = 0; batchStart < input.leads.length; batchStart += BATCH_SIZE) {
      const batch = input.leads.slice(batchStart, batchStart + BATCH_SIZE);
      const assignments = batch.map((lead, offset) => {
        const globalIndex = batchStart + offset;
        const agent = input.agents[globalIndex % input.agents.length];
        return {
          leadId: lead.id,
          leadName: lead.full_name,
          previousAgentId: lead.assigned_agent_id,
          newAgentId: agent.id,
        };
      });

      assignments.forEach((assignment) => {
        const list = assignedLeadNamesByAgent.get(assignment.newAgentId) ?? [];
        list.push(assignment.leadName);
        assignedLeadNamesByAgent.set(assignment.newAgentId, list);
      });

      await Promise.all(
        assignments.map((assignment) =>
          adminClient
            .from("leads")
            .update({ assigned_agent_id: assignment.newAgentId, status: "assigned" })
            .eq("id", assignment.leadId),
        ),
      );

      await adminClient.from("lead_assignment_logs").insert(
        assignments.map((assignment) => ({
          lead_id: assignment.leadId,
          previous_agent_id: assignment.previousAgentId,
          new_agent_id: assignment.newAgentId,
          assigned_by: input.adminId,
          method: "round_robin",
          notes: "Automatic round-robin assignment",
        })),
      );

      const processedLeads = Math.min(batchStart + batch.length, input.leads.length);
      updateRoundRobinRun(runId, {
        processedLeads,
        remainingLeads: input.leads.length - processedLeads,
        completedBatches: Math.ceil(processedLeads / BATCH_SIZE),
      });
    }

    const agentEmailById = new Map(input.agents.map((agent) => [agent.id, agent.email]));
    let notificationsSent = 0;
    await Promise.all(
      Array.from(assignedLeadNamesByAgent.entries()).map(async ([agentId, leadNames]) => {
        const agentEmail = agentEmailById.get(agentId);
        if (!agentEmail || leadNames.length === 0) return;
        try {
          await sendRoundRobinSummaryEmail({
            agentEmail,
            totalLeads: leadNames.length,
            leadNames,
            batchCount: Math.ceil(input.leads.length / BATCH_SIZE),
            assignedByEmail: input.adminEmail,
          });
          notificationsSent += 1;
        } catch {
          // Ignore email failures, assignment is already complete.
        }
      }),
    );

    updateRoundRobinRun(runId, {
      state: "completed",
      processedLeads: input.leads.length,
      remainingLeads: 0,
      completedBatches: Math.ceil(input.leads.length / BATCH_SIZE),
      notificationsSent,
      completedAt: new Date().toISOString(),
      message: `Assigned ${input.leads.length} leads.`,
    });
  } catch (error) {
    updateRoundRobinRun(runId, {
      state: "failed",
      completedAt: new Date().toISOString(),
      message: error instanceof Error ? error.message : "Round-robin failed.",
    });
  }
}
