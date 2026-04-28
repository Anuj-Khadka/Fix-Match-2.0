-- Add scheduled_at to jobs so clients can book for a future time
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_jobs_scheduled_at ON public.jobs(scheduled_at)
  WHERE scheduled_at IS NOT NULL;
