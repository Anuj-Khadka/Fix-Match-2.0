import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";

interface JobAlert {
  job_id: string;
  category: string;
  description: string | null;
  images: string[];
  location_lat: number | null;
  location_lng: number | null;
  scheduled_at: string | null;
}

interface UseJobAlertsReturn {
  currentAlert: JobAlert | null;
  accepting: boolean;
  acceptError: string | null;
  acceptJob: () => Promise<void>;
  declineJob: () => void;
  dismissAlert: () => void;
}

export function useJobAlerts(userId: string | undefined): UseJobAlertsReturn {
  const [currentAlert, setCurrentAlert] = useState<JobAlert | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  const categoriesRef = useRef<string[]>([]);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch provider's service categories
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

  // Subscribe to broadcast alerts + job_taken events
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

    // Broadcast channel — receives targeted alerts from client dispatcher
    // AND job_taken notifications to dismiss stale alerts
    const broadcastChannel = supabase
      .channel(`job_alerts:${userId}`)
      .on("broadcast", { event: "new_job" }, (payload) => {
        const alert = payload.payload as JobAlert;
        showAlert(alert);
      })
      .on("broadcast", { event: "job_taken" }, (payload) => {
        const takenJobId = (payload.payload as { job_id: string }).job_id;
        setCurrentAlert((prev) =>
          prev?.job_id === takenJobId ? null : prev
        );
        if (dismissTimer.current) clearTimeout(dismissTimer.current);
      })
      .subscribe();

    // postgres_changes as fallback — only for jobs WITHOUT sequential dispatch
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
          // The client dispatcher will send targeted broadcasts.
          // postgres_changes fires for ALL providers — we suppress it here
          // so the dispatch hook controls who gets alerted and when.
          // Providers will only see alerts via the broadcast channel.
        }
      )
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

    const { data, error } = await supabase.rpc("accept_job", {
      p_job_id: currentAlert.job_id,
    });

    if (error) {
      // Fallback: direct update if RPC not available
      const { error: updateErr } = await supabase
        .from("jobs")
        .update({
          provider_id: userId,
          status: "matched",
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
      setAcceptError(result.error ?? "Job was already taken");
    }
  }, [currentAlert, userId]);

  // Decline: dismiss locally + notify client dispatcher to advance immediately
  const declineJob = useCallback(() => {
    if (!currentAlert) return;
    const jobId = currentAlert.job_id;

    // Broadcast decline to client dispatcher
    const ch = supabase.channel(`dispatch_response:${jobId}`, {
      config: { broadcast: { self: false } },
    });
    ch.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        ch.send({
          type: "broadcast",
          event: "declined",
          payload: { provider_id: userId },
        });
        setTimeout(() => supabase.removeChannel(ch), 1000);
      }
    });

    setCurrentAlert(null);
    setAcceptError(null);
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
  }, [currentAlert, userId]);

  const dismissAlert = useCallback(() => {
    setCurrentAlert(null);
    setAcceptError(null);
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
  }, []);

  return { currentAlert, accepting, acceptError, acceptJob, declineJob, dismissAlert };
}
