import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

interface JobRow {
  id: string;
  category: string;
  location: string; // PostGIS geography
  status: string;
  dispatch_metadata: Record<string, unknown>;
}

interface Provider {
  provider_id: string;
  distance_m: number;
}

/* ── helpers ─────────────────────────────────────────── */

async function getJobStatus(jobId: string): Promise<string | null> {
  const { data } = await supabase
    .from("jobs")
    .select("status")
    .eq("id", jobId)
    .single();
  return data?.status ?? null;
}

async function updateMetadata(
  jobId: string,
  metadata: Record<string, unknown>
) {
  await supabase
    .from("jobs")
    .update({ dispatch_metadata: metadata, updated_at: new Date().toISOString() })
    .eq("id", jobId);
}

async function expireJob(jobId: string) {
  await supabase
    .from("jobs")
    .update({ status: "expired", updated_at: new Date().toISOString() })
    .eq("id", jobId);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Broadcast a new_job event to a specific provider's alert channel */
async function pingProvider(jobId: string, category: string) {
  // We broadcast on per-provider channels from the serial/blast callers
  // This is a no-op placeholder; actual broadcast is inline below.
}

/* ── dispatch logic ──────────────────────────────────── */

async function dispatch(job: JobRow) {
  const metadata: {
    pinged: { provider_id: string; at: string; phase: string }[];
  } = { pinged: [] };

  // 1. Find nearby providers
  const { data: providers, error } = await supabase.rpc(
    "find_nearby_providers",
    {
      job_location: job.location,
      job_category: job.category,
      radius_km: 25,
    }
  );

  if (error || !providers || providers.length === 0) {
    console.log(`[dispatch] No providers found for job ${job.id}, expiring.`);
    await expireJob(job.id);
    return;
  }

  const candidates: Provider[] = providers;
  console.log(
    `[dispatch] Found ${candidates.length} providers for job ${job.id}`
  );

  // 2. Serial phase — first 2 providers, 30s each
  const serialCount = Math.min(2, candidates.length);

  for (let i = 0; i < serialCount; i++) {
    const status = await getJobStatus(job.id);
    if (status !== "searching") {
      console.log(`[dispatch] Job ${job.id} status=${status}, stopping.`);
      return;
    }

    const p = candidates[i];
    console.log(
      `[dispatch] Serial ping #${i} → provider ${p.provider_id} (${Math.round(p.distance_m)}m)`
    );

    // Broadcast alert to provider
    const channel = supabase.channel(`job_alerts:${p.provider_id}`);
    await channel.send({
      type: "broadcast",
      event: "new_job",
      payload: {
        job_id: job.id,
        category: job.category,
      },
    });
    supabase.removeChannel(channel);

    metadata.pinged.push({
      provider_id: p.provider_id,
      at: new Date().toISOString(),
      phase: "serial",
    });
    await updateMetadata(job.id, metadata);

    // Poll for 30s (6 × 5s)
    for (let poll = 0; poll < 6; poll++) {
      await sleep(5000);
      const s = await getJobStatus(job.id);
      if (s !== "searching") {
        console.log(`[dispatch] Job ${job.id} matched during serial phase.`);
        return;
      }
    }
  }

  // 3. Blast phase — remaining providers (indices 2+)
  const blastCandidates = candidates.slice(2);
  if (blastCandidates.length === 0) {
    console.log(`[dispatch] No blast candidates, expiring job ${job.id}.`);
    await expireJob(job.id);
    return;
  }

  console.log(
    `[dispatch] Blast phase → ${blastCandidates.length} providers for job ${job.id}`
  );

  for (const p of blastCandidates) {
    const channel = supabase.channel(`job_alerts:${p.provider_id}`);
    await channel.send({
      type: "broadcast",
      event: "new_job",
      payload: {
        job_id: job.id,
        category: job.category,
      },
    });
    supabase.removeChannel(channel);

    metadata.pinged.push({
      provider_id: p.provider_id,
      at: new Date().toISOString(),
      phase: "blast",
    });
  }
  await updateMetadata(job.id, metadata);

  // Poll for 2 minutes (24 × 5s)
  for (let poll = 0; poll < 24; poll++) {
    await sleep(5000);
    const s = await getJobStatus(job.id);
    if (s !== "searching") {
      console.log(`[dispatch] Job ${job.id} matched during blast phase.`);
      return;
    }
  }

  // Timeout — expire
  console.log(`[dispatch] Blast timeout, expiring job ${job.id}.`);
  await expireJob(job.id);
}

/* ── HTTP handler (Database Webhook) ─────────────────── */

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const job: JobRow = payload.record;

    if (!job || job.status !== "searching") {
      return new Response(JSON.stringify({ skipped: true }), { status: 200 });
    }

    console.log(`[match-dispatcher] Dispatching job ${job.id}`);

    // Run dispatch in background so we return 200 quickly
    // (Edge Functions have a 150s wall-clock limit which is enough)
    dispatch(job).catch((err) =>
      console.error(`[match-dispatcher] Error:`, err)
    );

    return new Response(JSON.stringify({ dispatching: true }), { status: 200 });
  } catch (err) {
    console.error("[match-dispatcher] Handler error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
    });
  }
});
