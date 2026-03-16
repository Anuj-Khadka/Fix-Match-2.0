import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";

interface JobAlert {
  job_id: string;
  category: string;
}

interface UseJobAlertsReturn {
  currentAlert: JobAlert | null;
  accepting: boolean;
  acceptError: string | null;
  acceptJob: () => Promise<void>;
  dismissAlert: () => void;
}

export function useJobAlerts(userId: string | undefined): UseJobAlertsReturn {
  const [currentAlert, setCurrentAlert] = useState<JobAlert | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  // Use refs for values accessed inside Realtime callbacks to avoid
  // tearing down channels when these change.
  const categoriesRef = useRef<string[]>([]);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch provider's service categories into ref (no re-render needed)
  useEffect(() => {
    if (!userId) return;
    supabase
      .from("provider_profiles")
      .select("service_categories")
      .eq("id", userId)
      .single()
      .then(({ data, error }) => {
        if (error) return;
        if (data?.service_categories) {
          categoriesRef.current = data.service_categories;
        }
      });
  }, [userId]);

  // Single effect: subscribe to BOTH postgres_changes AND broadcast
  // Only depends on userId — no array state in deps, so no cycling.
  useEffect(() => {
    if (!userId) return;

    function showAlert(alert: JobAlert) {
      setCurrentAlert(alert);
      setAcceptError(null);
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
      dismissTimer.current = setTimeout(() => {
        setCurrentAlert((prev) =>
          prev?.job_id === alert.job_id ? null : prev
        );
      }, 30_000);
    }

    // Channel 1: postgres_changes — picks up INSERTs even without Edge Function
    const pgChannel = supabase
      .channel(`pg_jobs_${userId}`)
      .on(
        "postgres_changes" as const,
        {
          event: "INSERT",
          schema: "public",
          table: "jobs",
        },
        (payload) => {
          const job = payload.new as {
            id: string;
            category: string;
            status: string;
            provider_id: string | null;
          };
          if (job.status !== "searching") return;
          const cats = categoriesRef.current;
          if (cats.length === 0 || !cats.includes(job.category)) return;
          if (job.provider_id) return;
          showAlert({ job_id: job.id, category: job.category });
        }
      )
      .subscribe();

    // Channel 2: broadcast — receives pings from Edge Function dispatcher
    const broadcastChannel = supabase
      .channel(`job_alerts:${userId}`)
      .on("broadcast", { event: "new_job" }, (payload) => {
        const alert = payload.payload as JobAlert;
        showAlert(alert);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(pgChannel);
      supabase.removeChannel(broadcastChannel);
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, [userId]);

  const acceptJob = useCallback(async () => {
    if (!currentAlert) return;
    setAccepting(true);
    setAcceptError(null);

    // Try RPC first, fall back to direct update
    const { data, error } = await supabase.rpc("accept_job", {
      p_job_id: currentAlert.job_id,
    });

    if (error) {
      // Fallback: RPC doesn't exist yet (migration not run)
      const { error: updateErr } = await supabase
        .from("jobs")
        .update({
          provider_id: userId,
          status: "accepted",
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentAlert.job_id)
        .eq("status", "searching")
        .is("provider_id", null);

      setAccepting(false);

      if (updateErr) {
        setAcceptError(updateErr.message);
      } else {
        if (dismissTimer.current) clearTimeout(dismissTimer.current);
        setCurrentAlert(null);
      }
      return;
    }

    setAccepting(false);

    const result = data as { success: boolean; error?: string };
    if (result.success) {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
      setCurrentAlert(null);
    } else {
      setAcceptError(result.error ?? "Job was taken by another pro");
    }
  }, [currentAlert, userId]);

  const dismissAlert = useCallback(() => {
    setCurrentAlert(null);
    setAcceptError(null);
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
  }, []);

  return { currentAlert, accepting, acceptError, acceptJob, dismissAlert };
}
