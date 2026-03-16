-- ============================================================
-- Job lifecycle statuses + Reviews table + RPCs
-- ============================================================

-- 1. Expand job status CHECK constraint
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_status_check;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_status_check
  CHECK (status IN (
    'searching', 'accepted', 'matched',
    'en_route', 'arrived', 'in_progress',
    'completed', 'cancelled', 'expired'
  ));

-- 2. Add timestamp columns for tracking
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS started_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- 3. Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id      UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(job_id, reviewer_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_job_id      ON public.reviews(job_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_id ON public.reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON public.reviews(reviewer_id);

-- 4. RLS for reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own reviews on completed jobs"
  ON public.reviews FOR INSERT
  WITH CHECK (
    auth.uid() = reviewer_id
    AND EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = job_id
        AND jobs.status = 'completed'
        AND (jobs.client_id = auth.uid() OR jobs.provider_id = auth.uid())
    )
  );

CREATE POLICY "Users can read own reviews"
  ON public.reviews FOR SELECT
  USING (auth.uid() = reviewer_id OR auth.uid() = reviewee_id);

-- 5. RPC: advance_job_status
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

-- 6. RPC: submit_review
CREATE OR REPLACE FUNCTION public.submit_review(p_job_id UUID, p_rating SMALLINT, p_comment TEXT DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _job RECORD;
  _reviewee UUID;
  _review_id UUID;
BEGIN
  SELECT * INTO _job FROM public.jobs WHERE id = p_job_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Job not found');
  END IF;

  IF _job.status != 'completed' THEN
    RETURN json_build_object('success', false, 'error', 'Job is not completed');
  END IF;

  IF auth.uid() = _job.client_id THEN
    _reviewee := _job.provider_id;
  ELSIF auth.uid() = _job.provider_id THEN
    _reviewee := _job.client_id;
  ELSE
    RETURN json_build_object('success', false, 'error', 'Not authorized');
  END IF;

  INSERT INTO public.reviews (job_id, reviewer_id, reviewee_id, rating, comment)
  VALUES (p_job_id, auth.uid(), _reviewee, p_rating, p_comment)
  ON CONFLICT (job_id, reviewer_id) DO NOTHING
  RETURNING id INTO _review_id;

  IF _review_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Already reviewed');
  END IF;

  RETURN json_build_object('success', true, 'review_id', _review_id);
END;
$$;

-- 7. Enable realtime on reviews
ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;
