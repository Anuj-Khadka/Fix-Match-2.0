import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { Job } from "./useJobs";

const ACTIVE_STATUSES = ["matched", "accepted", "en_route", "arrived", "in_progress"];

interface UseProviderJobsReturn {
  activeJob: Job | null;
  loading: boolean;
  advanceStatus: (newStatus: string) => Promise<{ success: boolean; error?: string }>;
  submitReview: (rating: number, comment: string) => Promise<{ success: boolean; error?: string }>;
  dismissCompletedJob: () => void;
}

export function useProviderJobs(userId: string | undefined): UseProviderJobsReturn {
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const JOBS_COLUMNS = "id,client_id,provider_id,category,status,description,images,started_at,completed_at,created_at,updated_at";

    async function fetch() {
      // Check for active job first
      const { data } = await supabase
        .from("jobs")
        .select(JOBS_COLUMNS)
        .eq("provider_id", userId)
        .in("status", ACTIVE_STATUSES)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setActiveJob(data as Job | null);
        setLoading(false);
        return;
      }

      // Check for completed job pending review
      const { data: completed } = await supabase
        .from("jobs")
        .select(JOBS_COLUMNS)
        .eq("provider_id", userId)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (completed) {
        const { data: review } = await supabase
          .from("reviews")
          .select("id")
          .eq("job_id", completed.id)
          .eq("reviewer_id", userId)
          .maybeSingle();

        if (!review) {
          setActiveJob(completed as Job);
        }
      }

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
          if (updated.status === "cancelled" || updated.status === "expired") {
            setActiveJob(null);
          } else {
            // Keep completed in state for rating
            setActiveJob(updated);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const advanceStatus = useCallback(
    async (newStatus: string) => {
      if (!activeJob) return { success: false, error: "No active job" };

      const { data, error } = await supabase.rpc("advance_job_status", {
        p_job_id: activeJob.id,
        p_new_status: newStatus,
      });

      if (error) return { success: false, error: error.message };
      return data as { success: boolean; error?: string };
    },
    [activeJob],
  );

  const submitReview = useCallback(
    async (rating: number, comment: string) => {
      if (!activeJob) return { success: false, error: "No job" };

      const { data, error } = await supabase.rpc("submit_review", {
        p_job_id: activeJob.id,
        p_rating: rating,
        p_comment: comment || null,
      });

      if (error) return { success: false, error: error.message };
      return data as { success: boolean; error?: string };
    },
    [activeJob],
  );

  const dismissCompletedJob = useCallback(() => {
    setActiveJob(null);
  }, []);

  return { activeJob, loading, advanceStatus, submitReview, dismissCompletedJob };
}
