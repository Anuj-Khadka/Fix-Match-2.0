import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

export interface MessageThread {
  job_id:        string;
  job_short_id:  string;          // last 6 chars of UUID, uppercase
  category:      string;
  status:        string;
  client_id:     string;
  client_name:   string;
  client_avatar: string | null;
  last_message:  string | null;
  last_message_at: string | null;
  last_sender_id:  string | null;
  created_at:    string;
  updated_at:    string;
}

const ACTIVE_STATUSES    = ["matched", "en_route", "arrived", "in_progress"];
const PENDING_STATUSES   = ["searching", "accepted"];
const COMPLETED_STATUSES = ["completed", "cancelled", "expired"];

export function threadGroup(status: string): "Active" | "Pending" | "Completed" {
  if (ACTIVE_STATUSES.includes(status))    return "Active";
  if (PENDING_STATUSES.includes(status))   return "Pending";
  return "Completed";
}

export function useProviderMessages(userId: string | undefined) {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchThreads = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    // 1. Fetch all provider jobs with client profile
    const { data: jobs, error } = await supabase
      .from("jobs")
      .select(`
        id, category, status, created_at, updated_at, client_id,
        client:profiles!client_id(id, full_name, avatar_url)
      `)
      .eq("provider_id", userId)
      .in("status", [...ACTIVE_STATUSES, ...PENDING_STATUSES, ...COMPLETED_STATUSES])
      .order("updated_at", { ascending: false })
      .limit(100);

    if (error || !jobs || jobs.length === 0) {
      setLoading(false);
      setThreads([]);
      return;
    }

    const jobIds = jobs.map((j: any) => j.id);

    // 2. Fetch last message per job in one query, group in JS
    const { data: allMessages } = await supabase
      .from("messages")
      .select("job_id, sender_id, content, created_at")
      .in("job_id", jobIds)
      .order("created_at", { ascending: false });

    const lastMessageMap: Record<string, { content: string; created_at: string; sender_id: string }> = {};
    for (const msg of (allMessages ?? []) as any[]) {
      if (!lastMessageMap[msg.job_id]) {
        lastMessageMap[msg.job_id] = {
          content:    msg.content,
          created_at: msg.created_at,
          sender_id:  msg.sender_id,
        };
      }
    }

    // 3. Build thread list
    const built: MessageThread[] = (jobs as any[]).map((job) => {
      const client  = job.client as any;
      const lastMsg = lastMessageMap[job.id] ?? null;

      return {
        job_id:          job.id,
        job_short_id:    job.id.slice(-6).toUpperCase(),
        category:        job.category,
        status:          job.status,
        client_id:       job.client_id,
        client_name:     client?.full_name ?? "Client",
        client_avatar:   client?.avatar_url ?? null,
        last_message:    lastMsg?.content ?? null,
        last_message_at: lastMsg?.created_at ?? job.updated_at,
        last_sender_id:  lastMsg?.sender_id ?? null,
        created_at:      job.created_at,
        updated_at:      job.updated_at,
      };
    });

    // Sort: active first, then by last message time
    built.sort((a, b) => {
      const ga = threadGroup(a.status);
      const gb = threadGroup(b.status);
      const order = ["Active", "Pending", "Completed"];
      if (ga !== gb) return order.indexOf(ga) - order.indexOf(gb);
      const ta = a.last_message_at ?? a.updated_at;
      const tb = b.last_message_at ?? b.updated_at;
      return tb.localeCompare(ta);
    });

    setThreads(built);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchThreads(); }, [fetchThreads]);

  // Realtime: re-fetch when any message arrives on provider's jobs
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`provider-inbox:${userId}`)
      .on(
        "postgres_changes" as const,
        { event: "INSERT", schema: "public", table: "messages" },
        () => { fetchThreads(); }
      )
      .on(
        "postgres_changes" as const,
        { event: "UPDATE", schema: "public", table: "jobs", filter: `provider_id=eq.${userId}` },
        () => { fetchThreads(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, fetchThreads]);

  return { threads, loading, refetch: fetchThreads };
}
