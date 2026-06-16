"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AgentRealtimeRefreshProps = {
  agentId: string;
};

export function AgentRealtimeRefresh({ agentId }: AgentRealtimeRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const scheduleRefresh = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => router.refresh(), 500);
    };

    const channel = supabase
      .channel(`agent-live-${agentId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "leads",
          filter: `assigned_agent_id=eq.${agentId}`,
        },
        scheduleRefresh,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "follow_up_tasks",
          filter: `assigned_agent_id=eq.${agentId}`,
        },
        scheduleRefresh,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "lead_follow_up_activities",
          filter: `actor_id=eq.${agentId}`,
        },
        scheduleRefresh,
      )
      .subscribe();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      supabase.removeChannel(channel);
    };
  }, [agentId, router]);

  return null;
}
