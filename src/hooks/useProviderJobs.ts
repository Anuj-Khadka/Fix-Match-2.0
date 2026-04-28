import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { Job } from "./useJobs";

const ACTIVE_STATUSES = ["reviewing", "matched", "accepted", "en_route", "arrived", "in_progress"];

const JOBS_COLUMNS = "id,client_id,provider_id,category,status,description,images,started_at,completed_at,scheduled_at,created_at,updated_at";

interface UseProviderJobsReturn {
  activeJob: Job | null;
  scheduledJobs: Job[];
  loading: boolean;
  advanceStatus: (newStatus: string) => Promise<{ success: boolean; error?: string }>;
  advanceJobStatus: (jobId: string, newStatus: string) => Promise<{ success: boolean; error?: string }>;
  submitReview: (rating: number, comment: string) => Promise<{ success: boolean; error?: string }>;
  dismissCompletedJob: () => void;
}

function isScheduled(job: Job): boolean {
  return !!job.scheduled_at && job.status === "matched";
}

export function useProviderJobs(userId: string | undefined): UseProviderJobsReturn {
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [scheduledJobs, setScheduledJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function fetch() {
      // Fetch all active-status jobs for this provider
      const { data: allActive } = await supabase
        .from("jobs")
        .select(JOBS_COLUMNS)
        .eq("provider_id", userId)
        .in("status", ACTIVE_STATUSES)
        .order("updated_at", { ascending: false });

      const jobs = (allActive ?? []) as Job[];
      const scheduled = jobs.filter(isScheduled);
      const active = jobs.find((j) => !isScheduled(j)) ?? null;

      setScheduledJobs(scheduled);

      if (active) {
        setActiveJob(active);
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

    // Realtime: listen for any changes on provider's jobs
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
            setActiveJob((prev) => (prev?.id === updated.id ? null : prev));
            setScheduledJobs((prev) => prev.filter((j) => j.id !== updated.id));
            return;
          }

          if (isScheduled(updated)) {
            // Move/update in scheduledJobs, remove from activeJob if it was there
            setScheduledJobs((prev) => {
              const exists = prev.find((j) => j.id === updated.id);
              if (exists) return prev.map((j) => (j.id === updated.id ? updated : j));
              return [...prev, updated];
            });
            setActiveJob((prev) => (prev?.id === updated.id ? null : prev));
          } else {
            // Regular active job — remove from scheduledJobs if it was there
            setScheduledJobs((prev) => prev.filter((j) => j.id !== updated.id));
            setActiveJob(updated);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const advanceJobStatus = useCallback(
    async (jobId: string, newStatus: string) => {
      const { data, error } = await supabase.rpc("advance_job_status", {
        p_job_id: jobId,
        p_new_status: newStatus,
      });

      if (error) return { success: false, error: error.message };
      return data as { success: boolean; error?: string };
    },
    [],
  );

  const advanceStatus = useCallback(
    async (newStatus: string) => {
      if (!activeJob) return { success: false, error: "No active job" };
      return advanceJobStatus(activeJob.id, newStatus);
    },
    [activeJob, advanceJobStatus],
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

  return { activeJob, scheduledJobs, loading, advanceStatus, advanceJobStatus, submitReview, dismissCompletedJob };
}
