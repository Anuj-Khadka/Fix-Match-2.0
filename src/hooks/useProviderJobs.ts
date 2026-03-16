import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import type { Job } from "./useJobs";

interface UseProviderJobsReturn {
  activeJob: Job | null;
  loading: boolean;
}

export function useProviderJobs(userId: string | undefined): UseProviderJobsReturn {
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function fetch() {
      const { data } = await supabase
        .from("jobs")
        .select("*")
        .eq("provider_id", userId)
        .in("status", ["matched", "accepted"])
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      setActiveJob(data as Job | null);
      setLoading(false);
    }

    fetch();

    // Listen for realtime changes on provider's jobs
    const channel = supabase
      .channel(`provider-jobs-${userId}`)
      .on(
        "postgres_changes" as const,
        {
          event: "*",
          schema: "public",
          table: "jobs",
          filter: `provider_id=eq.${userId}`,
        },
        (payload) => {
          const updated = payload.new as Job;
          if (updated.status === "completed" || updated.status === "cancelled") {
            setActiveJob(null);
          } else if (updated.status === "matched" || updated.status === "accepted") {
            setActiveJob(updated);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { activeJob, loading };
}
