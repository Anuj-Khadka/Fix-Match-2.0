import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

export interface ChatMessage {
  id: string;
  job_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

interface UseChatReturn {
  messages: ChatMessage[];
  sending: boolean;
  sendMessage: (content: string) => Promise<void>;
}

export function useChat(jobId: string | undefined, userId: string | undefined): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);

  // Fetch existing messages when job changes
  useEffect(() => {
    if (!jobId) {
      setMessages([]);
      return;
    }

    supabase
      .from("messages")
      .select("id, job_id, sender_id, content, created_at")
      .eq("job_id", jobId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) setMessages(data as ChatMessage[]);
      });
  }, [jobId]);

  // Realtime subscription for new messages
  useEffect(() => {
    if (!jobId) return;

    const channel = supabase
      .channel(`messages:${jobId}`)
      .on(
        "postgres_changes" as const,
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `job_id=eq.${jobId}`,
        },
        (payload) => {
          const incoming = payload.new as ChatMessage;
          setMessages((prev) => {
            // Ignore if we already have it (from optimistic update)
            if (prev.some((m) => m.id === incoming.id)) return prev;
            return [...prev, incoming];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!jobId || !userId || !content.trim()) return;
      setSending(true);

      // Optimistic insert
      const tempId = `temp-${Date.now()}`;
      const optimistic: ChatMessage = {
        id: tempId,
        job_id: jobId,
        sender_id: userId,
        content: content.trim(),
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);

      const { data, error } = await supabase
        .from("messages")
        .insert({ job_id: jobId, sender_id: userId, content: content.trim() })
        .select("id, job_id, sender_id, content, created_at")
        .single();

      setSending(false);

      if (!error && data) {
        // Swap optimistic entry for the real DB row
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? (data as ChatMessage) : m))
        );
      } else {
        // Remove failed optimistic entry
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      }
    },
    [jobId, userId]
  );

  return { messages, sending, sendMessage };
}
