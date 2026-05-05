import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

export interface CRMClient {
  id: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  job_count: number;
  completed_count: number;
  last_job_at: string | null;
  avg_rating: number | null;
  tags: string[];
  notes: string;
}

export interface CRMJob {
  id: string;
  category: string;
  status: string;
  description: string | null;
  created_at: string;
  completed_at: string | null;
  scheduled_at: string | null;
}

export interface CRMReview {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  job_id: string;
}

const MATCHED_STATUSES = [
  "matched", "en_route", "arrived", "in_progress", "completed", "cancelled",
];

export function useProviderCRM(userId: string | undefined) {
  const [clients, setClients] = useState<CRMClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Record<string, CRMJob[]>>({});
  const [reviews, setReviews] = useState<Record<string, CRMReview[]>>({});

  const fetchAll = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    const [jobsRes, reviewsRes, relsRes] = await Promise.all([
      supabase
        .from("jobs")
        .select(`
          id, client_id, category, status, description,
          created_at, completed_at, scheduled_at,
          client:profiles!client_id(id, full_name, phone, avatar_url)
        `)
        .eq("provider_id", userId)
        .in("status", MATCHED_STATUSES)
        .order("created_at", { ascending: false }),

      supabase
        .from("reviews")
        .select("id, job_id, reviewer_id, rating, comment, created_at")
        .eq("reviewee_id", userId),

      supabase
        .from("client_relationships")
        .select("client_id, notes, tags")
        .eq("provider_id", userId),
    ]);

    // Group jobs by client_id
    const jobsByClient: Record<string, CRMJob[]> = {};
    const profileMap: Record<string, { full_name: string; phone: string | null; avatar_url: string | null }> = {};

    for (const row of (jobsRes.data ?? []) as any[]) {
      const cid: string = row.client_id;
      if (!jobsByClient[cid]) jobsByClient[cid] = [];
      jobsByClient[cid].push({
        id: row.id,
        category: row.category,
        status: row.status,
        description: row.description ?? null,
        created_at: row.created_at,
        completed_at: row.completed_at ?? null,
        scheduled_at: row.scheduled_at ?? null,
      });
      if (!profileMap[cid] && row.client) {
        const p = row.client as any;
        profileMap[cid] = {
          full_name: p.full_name ?? "Unknown",
          phone: p.phone ?? null,
          avatar_url: p.avatar_url ?? null,
        };
      }
    }

    // Group reviews by reviewer (client)
    const reviewsByClient: Record<string, CRMReview[]> = {};
    for (const row of (reviewsRes.data ?? []) as any[]) {
      const cid: string = row.reviewer_id;
      if (!reviewsByClient[cid]) reviewsByClient[cid] = [];
      reviewsByClient[cid].push({
        id: row.id,
        rating: row.rating,
        comment: row.comment ?? null,
        created_at: row.created_at,
        job_id: row.job_id,
      });
    }

    // Build relationship map
    const relMap: Record<string, { notes: string; tags: string[] }> = {};
    for (const row of (relsRes.data ?? []) as any[]) {
      relMap[row.client_id] = { notes: row.notes ?? "", tags: row.tags ?? [] };
    }

    // Aggregate into client list
    const clientList: CRMClient[] = Object.entries(jobsByClient).map(([cid, cjobs]) => {
      const profile = profileMap[cid] ?? { full_name: "Unknown", phone: null, avatar_url: null };
      const creviews = reviewsByClient[cid] ?? [];
      const avgRating =
        creviews.length > 0
          ? Math.round((creviews.reduce((s, r) => s + r.rating, 0) / creviews.length) * 10) / 10
          : null;

      return {
        id: cid,
        full_name: profile.full_name,
        phone: profile.phone,
        avatar_url: profile.avatar_url,
        job_count: cjobs.length,
        completed_count: cjobs.filter((j) => j.status === "completed").length,
        last_job_at: cjobs[0]?.created_at ?? null,
        avg_rating: avgRating,
        tags: relMap[cid]?.tags ?? [],
        notes: relMap[cid]?.notes ?? "",
      };
    });

    // Most recent first
    clientList.sort((a, b) => {
      if (!a.last_job_at) return 1;
      if (!b.last_job_at) return -1;
      return b.last_job_at.localeCompare(a.last_job_at);
    });

    setClients(clientList);
    setJobs(jobsByClient);
    setReviews(reviewsByClient);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const ensureRelationship = useCallback(async (clientId: string) => {
    if (!userId) return;
    await supabase
      .from("client_relationships")
      .upsert(
        { provider_id: userId, client_id: clientId, notes: "", tags: [] },
        { onConflict: "provider_id,client_id", ignoreDuplicates: true }
      );
  }, [userId]);

  const updateNotes = useCallback(async (clientId: string, notes: string) => {
    if (!userId) return;
    const current = clients.find((c) => c.id === clientId);
    await supabase
      .from("client_relationships")
      .upsert(
        { provider_id: userId, client_id: clientId, notes, tags: current?.tags ?? [] },
        { onConflict: "provider_id,client_id" }
      );
    setClients((prev) => prev.map((c) => (c.id === clientId ? { ...c, notes } : c)));
  }, [userId, clients]);

  const updateTags = useCallback(async (clientId: string, tags: string[]) => {
    if (!userId) return;
    const current = clients.find((c) => c.id === clientId);
    await supabase
      .from("client_relationships")
      .upsert(
        { provider_id: userId, client_id: clientId, notes: current?.notes ?? "", tags },
        { onConflict: "provider_id,client_id" }
      );
    setClients((prev) => prev.map((c) => (c.id === clientId ? { ...c, tags } : c)));
  }, [userId, clients]);

  return { clients, loading, jobs, reviews, ensureRelationship, updateNotes, updateTags };
}
