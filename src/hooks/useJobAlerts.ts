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
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Subscribe to broadcast channel for this provider
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`job_alerts:${userId}`)
      .on("broadcast", { event: "new_job" }, (payload) => {
        const alert = payload.payload as JobAlert;
        setCurrentAlert(alert);
        setAcceptError(null);

        // Auto-dismiss after 30s
        if (dismissTimer.current) clearTimeout(dismissTimer.current);
        dismissTimer.current = setTimeout(() => {
          setCurrentAlert((prev) =>
            prev?.job_id === alert.job_id ? null : prev
          );
        }, 30_000);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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

    setAccepting(false);

    if (error) {
      setAcceptError(error.message);
      return;
    }

    const result = data as { success: boolean; error?: string };
    if (result.success) {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
      // Keep alert visible briefly to show success state — caller handles transition
    } else {
      setAcceptError(result.error ?? "Job was taken by another pro");
    }
  }, [currentAlert]);

  const dismissAlert = useCallback(() => {
    setCurrentAlert(null);
    setAcceptError(null);
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
  }, []);

  return { currentAlert, accepting, acceptError, acceptJob, dismissAlert };
}
