-- ============================================================
-- Sequential dispatch: get eligible providers ranked by proximity
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_eligible_providers(p_job_id UUID)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _job RECORD;
  _providers JSON;
BEGIN
  SELECT * INTO _job FROM public.jobs WHERE id = p_job_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Job not found');
  END IF;

  SELECT json_agg(row_to_json(p))
  INTO _providers
  FROM (
    SELECT
      pp.id,
      pr.full_name,
      pp.business_name
    FROM provider_profiles pp
    JOIN profiles pr ON pr.id = pp.id
    WHERE pp.status = 'approved'
      AND _job.category = ANY(pp.service_categories)
      AND pp.id != COALESCE(_job.provider_id, '00000000-0000-0000-0000-000000000000'::uuid)
    ORDER BY
      CASE WHEN pp.live_location IS NOT NULL AND _job.location IS NOT NULL
           THEN ST_Distance(pp.live_location, _job.location)
           ELSE 999999 END ASC,
      pp.reliability_score DESC
    LIMIT 10
  ) p;

  RETURN json_build_object('success', true, 'providers', COALESCE(_providers, '[]'::json));
END;
$$;
