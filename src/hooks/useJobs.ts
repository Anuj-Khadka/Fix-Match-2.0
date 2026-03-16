import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

export type JobCategory = "plumbing" | "electrical" | "cleaning";
export type JobStatus =
  | "searching"
  | "accepted"
  | "matched"
  | "en_route"
  | "arrived"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "expired";

export interface Job {
  id: string;
  client_id: string;
  provider_id: string | null;
  category: JobCategory;
  status: JobStatus;
  description: string | null;
  images?: string[];
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

const ACTIVE_STATUSES = ["searching", "accepted", "matched", "en_route", "arrived", "in_progress"];

interface UseJobsReturn {
  activeJob: Job | null;
  loading: boolean;
  error: string | null;
  createJob: (params: {
    category: JobCategory;
    lat: number;
    lng: number;
    description?: string;
    images?: string[];
  }) => Promise<void>;
  cancelJob: () => Promise<void>;
  submitReview: (rating: number, comment: string) => Promise<{ success: boolean; error?: string }>;
  dismissCompletedJob: () => void;
}

export function useJobs(userId: string | undefined): UseJobsReturn {
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // On mount, check for active job OR a completed job pending review
  useEffect(() => {
    if (!userId) return;

    async function fetchActive() {
      // First check for active jobs
      const { data } = await supabase
        .from("jobs")
        .select("*")
        .eq("client_id", userId)
        .in("status", ACTIVE_STATUSES)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setActiveJob(data as Job);
        return;
      }

      // Check for completed job pending review
      const { data: completed } = await supabase
        .from("jobs")
        .select("*")
        .eq("client_id", userId)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (completed) {
        // Check if already reviewed
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
    }

    fetchActive();
  }, [userId]);

  // Subscribe to realtime changes on the active job
  useEffect(() => {
    if (!activeJob) return;

    const channel = supabase
      .channel(`job-${activeJob.id}`)
      .on(
        "postgres_changes" as const,
        {
          event: "UPDATE",
          schema: "public",
          table: "jobs",
          filter: `id=eq.${activeJob.id}`,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const updated = payload.new as unknown as Job;
          if (updated.status === "cancelled" || updated.status === "expired") {
            setActiveJob(null);
          } else {
            // Keep completed jobs in state for rating modal
            setActiveJob(updated);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeJob?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const createJob = useCallback(
    async (params: {
      category: JobCategory;
      lat: number;
      lng: number;
      description?: string;
      images?: string[];
    }) => {
      if (!userId) return;
      setLoading(true);
      setError(null);

      const point = `SRID=4326;POINT(${params.lng} ${params.lat})`;

      const row: Record<string, unknown> = {
        client_id: userId,
        category: params.category,
        status: "searching",
        location: point,
        description: params.description ?? null,
      };
      if (params.images && params.images.length > 0) {
        row.images = params.images;
      }

      const { data, error: insertErr } = await supabase
        .from("jobs")
        .insert(row)
        .select()
        .single();

      setLoading(false);

      if (insertErr) {
        setError(insertErr.message);
        return;
      }

      setActiveJob(data as Job);
    },
    [userId],
  );

  const cancelJob = useCallback(async () => {
    if (!activeJob) return;
    setLoading(true);
    setError(null);

    const { error: updateErr } = await supabase
      .from("jobs")
      .update({ status: "cancelled" })
      .eq("id", activeJob.id);

    setLoading(false);

    if (updateErr) {
      setError(updateErr.message);
      return;
    }

    setActiveJob(null);
  }, [activeJob]);

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

  return { activeJob, loading, error, createJob, cancelJob, submitReview, dismissCompletedJob };
}
