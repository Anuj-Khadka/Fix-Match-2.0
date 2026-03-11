-- ============================================================
-- Fixmatch: Jobs Table Migration
-- ============================================================

-- ============================================================
-- 1. TABLE
-- ============================================================

CREATE TABLE public.jobs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  category    TEXT NOT NULL
              CHECK (category IN ('plumbing', 'electrical', 'cleaning')),
  status      TEXT NOT NULL DEFAULT 'searching'
              CHECK (status IN ('searching', 'accepted', 'completed', 'cancelled')),
  location    GEOGRAPHY(POINT, 4326) NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups by client
CREATE INDEX idx_jobs_client_id ON public.jobs(client_id);

-- Index for fast lookups by provider
CREATE INDEX idx_jobs_provider_id ON public.jobs(provider_id);

-- Index for status-based queries (finding 'searching' jobs)
CREATE INDEX idx_jobs_status ON public.jobs(status);

-- Spatial index for proximity searches (find nearby jobs)
CREATE INDEX idx_jobs_location ON public.jobs USING GIST(location);

-- Auto-update updated_at
CREATE TRIGGER jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 2. ROW-LEVEL SECURITY
-- ============================================================

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Clients can read their own jobs
CREATE POLICY "Clients can read own jobs"
  ON public.jobs FOR SELECT
  USING (auth.uid() = client_id);

-- Clients can insert jobs for themselves
CREATE POLICY "Clients can create own jobs"
  ON public.jobs FOR INSERT
  WITH CHECK (
    auth.uid() = client_id
    AND public.jwt_role() = 'client'
  );

-- Clients can update their own jobs (cancel only — status must go to 'cancelled')
CREATE POLICY "Clients can cancel own jobs"
  ON public.jobs FOR UPDATE
  USING (auth.uid() = client_id)
  WITH CHECK (
    auth.uid() = client_id
    AND status = 'cancelled'
  );

-- Providers can read jobs that are assigned to them
CREATE POLICY "Providers can read assigned jobs"
  ON public.jobs FOR SELECT
  USING (auth.uid() = provider_id);

-- Providers can read 'searching' jobs (to see available work — future use)
CREATE POLICY "Providers can read searching jobs"
  ON public.jobs FOR SELECT
  USING (
    public.jwt_role() = 'provider'
    AND status = 'searching'
  );

-- Admins can read all jobs
CREATE POLICY "Admins can read all jobs"
  ON public.jobs FOR SELECT
  USING (public.jwt_role() = 'admin');

-- Admins can update any job
CREATE POLICY "Admins can update any job"
  ON public.jobs FOR UPDATE
  USING (public.jwt_role() = 'admin');

-- ============================================================
-- 3. REALTIME — enable for live status updates
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs;
