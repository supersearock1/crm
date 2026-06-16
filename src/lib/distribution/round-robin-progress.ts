import crypto from "node:crypto";

export type RoundRobinRunStatus = {
  runId: string;
  state: "running" | "completed" | "failed";
  totalLeads: number;
  remainingLeads: number;
  processedLeads: number;
  totalBatches: number;
  completedBatches: number;
  notificationsSent: number;
  message?: string;
  startedAt: string;
  completedAt?: string;
};

const runs = new Map<string, RoundRobinRunStatus>();

export function createRoundRobinRun(totalLeads: number, totalBatches: number) {
  const runId = crypto.randomUUID();
  const run: RoundRobinRunStatus = {
    runId,
    state: "running",
    totalLeads,
    remainingLeads: totalLeads,
    processedLeads: 0,
    totalBatches,
    completedBatches: 0,
    notificationsSent: 0,
    startedAt: new Date().toISOString(),
  };
  runs.set(runId, run);
  return run;
}

export function updateRoundRobinRun(
  runId: string,
  patch: Partial<Omit<RoundRobinRunStatus, "runId">>,
) {
  const current = runs.get(runId);
  if (!current) return;
  runs.set(runId, { ...current, ...patch });
}

export function getRoundRobinRun(runId: string) {
  return runs.get(runId) ?? null;
}
