"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type RoundRobinStatus = {
  runId: string;
  state: "running" | "completed" | "failed";
  totalLeads: number;
  remainingLeads: number;
  processedLeads: number;
  totalBatches: number;
  completedBatches: number;
  notificationsSent: number;
  message?: string;
};

type RoundRobinRunnerProps = {
  initialRemaining: number;
};

export function RoundRobinRunner({ initialRemaining }: RoundRobinRunnerProps) {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);
  const [status, setStatus] = useState<RoundRobinStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const liveRemaining = useMemo(() => {
    if (status?.state === "running" || status?.state === "completed") {
      return status.remainingLeads;
    }
    return initialRemaining;
  }, [initialRemaining, status]);

  const startRoundRobin = async () => {
    setError(null);
    setIsStarting(true);
    try {
      const startResponse = await fetch("/api/admin/distribution/round-robin/start", {
        method: "POST",
      });
      const startData = await startResponse.json();

      if (!startResponse.ok) {
        setError(typeof startData.error === "string" ? startData.error : "Unable to start round-robin.");
        return;
      }

      const runId = startData.runId as string;
      await pollStatus(runId);
    } finally {
      setIsStarting(false);
    }
  };

  const pollStatus = async (runId: string) => {
    let done = false;
    while (!done) {
      const response = await fetch(`/api/admin/distribution/round-robin/status?runId=${encodeURIComponent(runId)}`, {
        method: "GET",
        cache: "no-store",
      });
      if (!response.ok) {
        setError("Unable to fetch round-robin progress.");
        return;
      }
      const data = (await response.json()) as RoundRobinStatus;
      setStatus(data);
      if (data.state === "completed" || data.state === "failed") {
        done = true;
      } else {
        await new Promise((resolve) => {
          setTimeout(resolve, 600);
        });
      }
    }
    router.refresh();
  };

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-[#EAE7E2] bg-[#FAF9F7] px-3 py-2 text-sm text-[#1A1A1A]">
        Unassigned eligible leads remaining: <span className="font-semibold">{liveRemaining}</span>
      </div>

      <div className="rounded-lg border border-[#EAE7E2] bg-white px-3 py-2 text-sm text-[#1A1A1A]">
        Notification counter (summary emails):{" "}
        <span className="font-semibold">{status?.notificationsSent ?? 0}</span>
      </div>

      {status && (
        <div className="rounded-lg border border-[#EAE7E2] bg-white px-3 py-2 text-xs text-gray-700">
          Progress: {status.processedLeads}/{status.totalLeads} leads • Batch {status.completedBatches}/
          {status.totalBatches} • State: {status.state}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button
        type="button"
        disabled={isStarting || (status?.state === "running")}
        onClick={startRoundRobin}
        className="h-10 rounded-lg bg-[#E55B3C] hover:bg-[#c94b2f]"
      >
        {isStarting || status?.state === "running" ? "Running..." : "Run Round-Robin on Unassigned Leads"}
      </Button>
    </div>
  );
}
