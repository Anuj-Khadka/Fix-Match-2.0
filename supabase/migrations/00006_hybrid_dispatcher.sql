-- ============================================================
-- Migration 00006: Hybrid Dispatcher
-- Adds images, dispatch_metadata to jobs, new statuses,
-- find_nearby_providers + accept_job RPCs, job-images bucket
-- ============================================================

-- 1. Add new columns to jobs
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS images        TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS dispatch_metadata JSONB  DEFAULT '{}';

-- 2. Update status CHECK to include 'matched' and 'expired'
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_status_check;
ALTER TABLE public.jobs
  ADD CONSTRAINT jobs_status_check
  CHECK (status IN ('searching', 'accepted', 'matched', 'completed', 'cancelled', 'expired'));

-- 3. RPC: find_nearby_providers
--    Returns up to 15 approved, online providers whose service_categories
--    include the requested category and are within radius_km.
CREATE OR REPLACE FUNCTION public.find_nearby_providers(
  job_location GEOGRAPHY,
  job_category TEXT,
  radius_km    INT DEFAULT 25
)
RETURNS TABLE(provider_id UUID, distance_m FLOAT8)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    pp.id                                   AS provider_id,
    ST_Distance(pp.live_location, job_location) AS distance_m
  FROM public.provider_profiles pp
  WHERE pp.status = 'approved'
    AND pp.is_online = TRUE
    AND pp.live_location IS NOT NULL
    AND job_category = ANY(pp.service_categories)
    AND ST_DWithin(pp.live_location, job_location, radius_km * 1000)
  ORDER BY distance_m ASC
  LIMIT 15;
$$;

-- 4. RPC: accept_job
--    Atomic claim — only one provider can win the race.
CREATE OR REPLACE FUNCTION public.accept_job(p_job_id UUID)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _rows INT;
BEGIN
  UPDATE public.jobs
  SET provider_id = auth.uid(),
      status      = 'matched',
      updated_at  = now()
  WHERE id          = p_job_id
    AND status      = 'searching'
    AND provider_id IS NULL;

  GET DIAGNOSTICS _rows = ROW_COUNT;

  IF _rows = 1 THEN
    RETURN json_build_object('success', true);
  ELSE
    RETURN json_build_object('success', false, 'error', 'Job already taken or not available');
  END IF;
END;
$$;

-- 5. Storage bucket for job images
INSERT INTO storage.buckets (id, name, public)
VALUES ('job-images', 'job-images', false)
ON CONFLICT (id) DO NOTHING;

-- Clients upload to their own folder
CREATE POLICY "Clients upload job images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'job-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Clients read their own images
CREATE POLICY "Clients read own job images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'job-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Providers can read any job image
CREATE POLICY "Providers read job images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'job-images'
    AND public.jwt_role() = 'provider'
  );
