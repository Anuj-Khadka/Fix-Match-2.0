import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import type { JobCategory } from "./useJobs";

export interface HistoryOrder {
  id: string;
  category: JobCategory;
  status: string;
  description: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  scheduled_at: string | null;
  provider_name: string | null;
  provider_business: string | null;
  review_rating: number | null;
  review_comment: string | null;
  payment_amount: number | null;
  payment_tip: number | null;
  transaction_ref: string | null;
}

const HISTORY_STATUSES = ["completed", "cancelled", "expired"];

export function useOrderHistory(userId: string | undefined) {
  const [orders, setOrders] = useState<HistoryOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    async function fetchHistory() {
      setLoading(true);

      const { data: jobs } = await supabase
        .from("jobs")
        .select("id, category, status, description, created_at, started_at, completed_at, scheduled_at, provider_id")
        .eq("client_id", userId)
        .in("status", HISTORY_STATUSES)
        .order("created_at", { ascending: false });

      if (!jobs?.length) {
        setOrders([]);
        setLoading(false);
        return;
      }

      // Fetch provider names for jobs that had an assigned provider
      const providerIds = [...new Set(
        jobs.filter((j) => j.provider_id).map((j) => j.provider_id as string)
      )];

      const profileMap: Record<string, { full_name: string | null; business_name: string | null }> = {};

      if (providerIds.length > 0) {
        const [{ data: profiles }, { data: provProfiles }] = await Promise.all([
          supabase.from("profiles").select("id, full_name").in("id", providerIds),
          supabase.from("provider_profiles").select("id, business_name").in("id", providerIds),
        ]);
        for (const p of (profiles ?? [])) {
          profileMap[p.id] = { full_name: p.full_name, business_name: null };
        }
        for (const pp of (provProfiles ?? [])) {
          if (profileMap[pp.id]) profileMap[pp.id].business_name = pp.business_name;
        }
      }

      const jobIds = jobs.map((j) => j.id);

      // Fetch reviews + payments in parallel
      const [{ data: reviews }, { data: payments }] = await Promise.all([
        supabase
          .from("reviews")
          .select("job_id, rating, comment")
          .eq("reviewer_id", userId)
          .in("job_id", jobIds),
        supabase
          .from("payments")
          .select("job_id, amount, tip, transaction_ref")
          .eq("client_id", userId)
          .in("job_id", jobIds),
      ]);

      const reviewMap: Record<string, { rating: number; comment: string | null }> = {};
      for (const r of (reviews ?? [])) {
        reviewMap[r.job_id] = { rating: r.rating, comment: r.comment ?? null };
      }

      const paymentMap: Record<string, { amount: number; tip: number; transaction_ref: string | null }> = {};
      for (const p of (payments ?? [])) {
        paymentMap[p.job_id] = { amount: p.amount, tip: p.tip, transaction_ref: p.transaction_ref ?? null };
      }

      setOrders(
        jobs.map((j) => ({
          id: j.id,
          category: j.category as JobCategory,
          status: j.status,
          description: j.description ?? null,
          created_at: j.created_at,
          started_at: j.started_at ?? null,
          completed_at: j.completed_at ?? null,
          scheduled_at: j.scheduled_at ?? null,
          provider_name: j.provider_id ? (profileMap[j.provider_id]?.full_name ?? null) : null,
          provider_business: j.provider_id ? (profileMap[j.provider_id]?.business_name ?? null) : null,
          review_rating: reviewMap[j.id]?.rating ?? null,
          review_comment: reviewMap[j.id]?.comment ?? null,
          payment_amount: paymentMap[j.id]?.amount ?? null,
          payment_tip: paymentMap[j.id]?.tip ?? null,
          transaction_ref: paymentMap[j.id]?.transaction_ref ?? null,
        }))
      );

      setLoading(false);
    }

    fetchHistory();
  }, [userId]);

  return { orders, loading };
}
