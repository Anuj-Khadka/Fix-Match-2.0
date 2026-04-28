-- ============================================================
-- Add 'reviewing' status: provider reviews job before accepting
-- ============================================================

-- 1. Expand status CHECK constraint
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_status_check;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_status_check
  CHECK (status IN (
    'searching', 'reviewing', 'matched', 'accepted',
    'en_route', 'arrived', 'in_progress',
    'completed', 'cancelled', 'expired'
  ));

-- 2. RPC: start_review — atomically claims the job and sets it to 'reviewing'
CREATE OR REPLACE FUNCTION public.start_review(p_job_id UUID)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _job RECORD;
BEGIN
  SELECT * INTO _job FROM public.jobs WHERE id = p_job_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Job not found');
  END IF;

  IF _job.status != 'searching' THEN
    RETURN json_build_object('success', false, 'error', 'Job is no longer available');
  END IF;

  IF _job.provider_id IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'Job already claimed');
  END IF;

  UPDATE public.jobs
  SET status      = 'reviewing',
      provider_id = auth.uid(),
      updated_at  = now()
  WHERE id = p_job_id;

  RETURN json_build_object('success', true);
END;
$$;

-- 3. Update advance_job_status to allow reviewing → matched
CREATE OR REPLACE FUNCTION public.advance_job_status(p_job_id UUID, p_new_status TEXT)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _job RECORD;
  _valid BOOLEAN;
BEGIN
  SELECT * INTO _job FROM public.jobs WHERE id = p_job_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Job not found');
  END IF;

  IF _job.provider_id != auth.uid() THEN
    RETURN json_build_object('success', false, 'error', 'Not authorized');
  END IF;

  _valid := (
    (_job.status = 'reviewing'   AND p_new_status = 'matched') OR
    (_job.status = 'matched'     AND p_new_status = 'en_route') OR
    (_job.status = 'en_route'    AND p_new_status = 'arrived') OR
    (_job.status = 'arrived'     AND p_new_status = 'in_progress') OR
    (_job.status = 'in_progress' AND p_new_status = 'completed')
  );

  IF NOT _valid THEN
    RETURN json_build_object('success', false, 'error', 'Invalid status transition');
  END IF;

  UPDATE public.jobs
  SET status       = p_new_status,
      started_at   = CASE WHEN p_new_status = 'in_progress' THEN now() ELSE started_at END,
      completed_at = CASE WHEN p_new_status = 'completed' THEN now() ELSE completed_at END,
      updated_at   = now()
  WHERE id = p_job_id;

  RETURN json_build_object('success', true);
END;
$$;
