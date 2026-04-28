-- Migration 00012: Browse nearby providers with estimated quotes
-- Called before job creation so the client can pick a specific pro.
-- Takes lat/lng + category directly (no job_id needed yet).
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_nearby_providers_with_quotes(
  p_lat          FLOAT8,
  p_lng          FLOAT8,
  p_category     TEXT,
  p_radius_miles FLOAT8 DEFAULT 10
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _providers    JSON;
  _job_location GEOGRAPHY;
BEGIN
  _job_location := ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::GEOGRAPHY;

  SELECT json_agg(row_to_json(p))
  INTO   _providers
  FROM (
    SELECT
      pp.id,
      pr.full_name,
      pp.business_name,
      pp.base_rate,
      pp.years_of_experience,
      ROUND(
        (ST_Distance(pp.live_location, _job_location) / 1609.34)::NUMERIC, 1
      ) AS distance_miles,
      (
        SELECT ROUND(AVG(r.rating)::NUMERIC, 1)
        FROM   public.reviews r
        WHERE  r.reviewee_id = pp.id
      ) AS avg_rating,
      (
        SELECT COUNT(*)::INT
        FROM   public.reviews r
        WHERE  r.reviewee_id = pp.id
      ) AS total_reviews
    FROM  public.provider_profiles pp
    JOIN  public.profiles           pr ON pr.id = pp.id
    WHERE pp.status    = 'approved'
      AND pp.is_online = TRUE
      AND pp.live_location IS NOT NULL
      AND p_category = ANY(pp.service_categories)
      AND ST_DWithin(pp.live_location, _job_location, p_radius_miles * 1609.34)
    ORDER BY
      ST_Distance(pp.live_location, _job_location) ASC,
      pp.reliability_score DESC
    LIMIT 20
  ) p;

  RETURN json_build_object(
    'success',   true,
    'providers', COALESCE(_providers, '[]'::json)
  );
END;
$$;
