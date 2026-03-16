import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

export type JobCategory = "plumbing" | "electrical" | "cleaning";
export type JobStatus = "searching" | "accepted" | "matched" | "completed" | "cancelled" | "expired";

export interface Job {
  id: string;
  client_id: string;
  provider_id: string | null;
  category: JobCategory;
  status: JobStatus;
  description: string | null;
  images?: string[];
  created_at: string;
  updated_at: string;
}

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
}

export function useJobs(userId: string | undefined): UseJobsReturn {
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // On mount, check if the client already has an active (searching/accepted) job
  useEffect(() => {
    if (!userId) return;

    async function fetchActive() {
      const { data } = await supabase
        .from("jobs")
        .select("*")
        .eq("client_id", userId)
        .in("status", ["searching", "accepted", "matched"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) setActiveJob(data as Job);
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
          if (
            updated.status === "cancelled" ||
            updated.status === "completed" ||
            updated.status === "expired"
          ) {
            setActiveJob(null);
          } else {
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

      // PostGIS point: ST_MakePoint(lng, lat) — note: longitude first
      const point = `SRID=4326;POINT(${params.lng} ${params.lat})`;

      const { data, error: insertErr } = await supabase
        .from("jobs")
        .insert({
          client_id: userId,
          category: params.category,
          status: "searching",
          location: point,
          description: params.description ?? null,
          images: params.images ?? [],
        })
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

  return { activeJob, loading, error, createJob, cancelJob };
}
