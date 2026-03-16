-- ============================================================
-- Ensure accept_job RPC exists
-- ============================================================
-- This is the atomic claim function that allows a provider to
-- accept a job. It uses SECURITY DEFINER to bypass RLS, so
-- providers don't need an UPDATE policy on the jobs table.
-- ============================================================

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
