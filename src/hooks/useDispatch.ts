import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabase";

interface Provider {
  id: string;
  full_name: string | null;
  business_name: string | null;
}

interface UseDispatchReturn {
  dispatching: boolean;
  dispatchPhase: "idle" | "sequential" | "blast" | "matched" | "no_providers";
  currentTarget: Provider | null;
  queuePosition: number; // 1-based index of current attempt
  queueTotal: number;
}

const INDIVIDUAL_TIMEOUT = 30_000; // 30s per provider
const MAX_INDIVIDUAL = 3;

export function useDispatch(jobId: string | null, jobStatus: string | null): UseDispatchReturn {
  const [dispatching, setDispatching] = useState(false);
  const [dispatchPhase, setDispatchPhase] = useState<UseDispatchReturn["dispatchPhase"]>("idle");
  const [currentTarget, setCurrentTarget] = useState<Provider | null>(null);
  const [queuePosition, setQueuePosition] = useState(0);
  const [queueTotal, setQueueTotal] = useState(0);

  const queueRef = useRef<Provider[]>([]);
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const activeJobIdRef = useRef<string | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const cleanup = useCallback(() => {
    clearTimer();
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, [clearTimer]);

  // Send alert to a specific provider via broadcast
  const alertProvider = useCallback((provider: Provider, jobIdVal: string, category?: string) => {
    const channel = supabase.channel(`job_alerts:${provider.id}`, {
      config: { broadcast: { self: false } },
    });
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        channel.send({
          type: "broadcast",
          event: "new_job",
          payload: { job_id: jobIdVal, category: category ?? "" },
        });
        // Unsubscribe after sending
        setTimeout(() => supabase.removeChannel(channel), 1000);
      }
    });
  }, []);

  // Notify providers that job was taken
  const notifyJobTaken = useCallback((providers: Provider[], jobIdVal: string) => {
    for (const p of providers) {
      const ch = supabase.channel(`job_alerts:${p.id}`, {
        config: { broadcast: { self: false } },
      });
      ch.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          ch.send({
            type: "broadcast",
            event: "job_taken",
            payload: { job_id: jobIdVal },
          });
          setTimeout(() => supabase.removeChannel(ch), 1000);
        }
      });
    }
  }, []);

  // Advance to next provider or blast
  const advanceDispatch = useCallback((jobIdVal: string) => {
    const queue = queueRef.current;
    const idx = indexRef.current;

    if (idx < MAX_INDIVIDUAL && idx < queue.length) {
      // Individual alert
      const provider = queue[idx];
      setCurrentTarget(provider);
      setQueuePosition(idx + 1);
      setDispatchPhase("sequential");
      alertProvider(provider, jobIdVal);

      // Start timeout for this provider
      clearTimer();
      timerRef.current = setTimeout(() => {
        indexRef.current = idx + 1;
        advanceDispatch(jobIdVal);
      }, INDIVIDUAL_TIMEOUT);
    } else if (queue.length > MAX_INDIVIDUAL) {
      // Blast to all remaining providers
      setDispatchPhase("blast");
      setCurrentTarget(null);
      const remaining = queue.slice(MAX_INDIVIDUAL);
      for (const p of remaining) {
        alertProvider(p, jobIdVal);
      }
    } else if (queue.length > 0) {
      // We've exhausted all providers individually
      setDispatchPhase("blast");
      setCurrentTarget(null);
    } else {
      setDispatchPhase("no_providers");
    }
  }, [alertProvider, clearTimer]);

  // Main effect: start dispatch when a new searching job appears
  useEffect(() => {
    if (!jobId || jobStatus !== "searching") {
      // Job was matched/cancelled — stop dispatching
      if (activeJobIdRef.current && jobStatus && jobStatus !== "searching") {
        // Notify all alerted providers that job is taken
        notifyJobTaken(queueRef.current, activeJobIdRef.current);
        cleanup();
        setDispatching(false);
        setDispatchPhase(jobStatus === "matched" ? "matched" : "idle");
        setCurrentTarget(null);
        activeJobIdRef.current = null;
      }
      return;
    }

    // Avoid re-dispatching for same job
    if (activeJobIdRef.current === jobId) return;
    activeJobIdRef.current = jobId;

    async function startDispatch() {
      setDispatching(true);

      // Fetch eligible providers
      const { data, error } = await supabase.rpc("get_eligible_providers", {
        p_job_id: jobId,
      });

      if (error || !data?.success) {
        setDispatchPhase("no_providers");
        setDispatching(false);
        return;
      }

      const providers: Provider[] = data.providers ?? [];
      if (providers.length === 0) {
        setDispatchPhase("no_providers");
        setDispatching(false);
        return;
      }

      queueRef.current = providers;
      setQueueTotal(providers.length);
      indexRef.current = 0;

      // Listen for decline responses from providers
      const dispatchChannel = supabase
        .channel(`dispatch_response:${jobId}`)
        .on("broadcast", { event: "declined" }, () => {
          // Provider declined — immediately advance
          clearTimer();
          indexRef.current = indexRef.current + 1;
          advanceDispatch(jobId!);
        })
        .subscribe();

      channelRef.current = dispatchChannel;

      // Start with first provider
      advanceDispatch(jobId!);
    }

    startDispatch();

    return () => {
      cleanup();
    };
  }, [jobId, jobStatus, advanceDispatch, cleanup, clearTimer, notifyJobTaken]);

  return { dispatching, dispatchPhase, currentTarget, queuePosition, queueTotal };
}
