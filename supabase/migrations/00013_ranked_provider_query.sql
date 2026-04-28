-- Migration 00013: Weighted provider ranking
-- Score = (1-dist)*5 + exp*4 + rating*3 + (1-price)*2  (max 14, higher = better)
-- All factors normalized 0-1 via min-max within the result set.
-- NULLs: experience→0, price→midpoint, rating→0.5 (benefit of doubt for new pros).
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

  WITH candidates AS (
    SELECT
      pp.id,
      pr.full_name,
      pp.business_name,
      pp.base_rate,
      pp.years_of_experience,
      ROUND(
        (ST_Distance(pp.live_location, _job_location) / 1609.34)::NUMERIC, 1
      )                                                          AS distance_miles,
      (
        SELECT ROUND(AVG(r.rating)::NUMERIC, 1)
        FROM   public.reviews r
        WHERE  r.reviewee_id = pp.id
      )                                                          AS avg_rating,
      (
        SELECT COUNT(*)::INT
        FROM   public.reviews r
        WHERE  r.reviewee_id = pp.id
      )                                                          AS total_reviews
    FROM  public.provider_profiles pp
    JOIN  public.profiles           pr ON pr.id = pp.id
    WHERE pp.status    = 'approved'
      AND pp.is_online = TRUE
      AND pp.live_location IS NOT NULL
      AND p_category = ANY(pp.service_categories)
      AND ST_DWithin(pp.live_location, _job_location, p_radius_miles * 1609.34)
  ),

  scored AS (
    SELECT
      c.*,

      -- Distance norm (0 = closest, 1 = farthest)
      CASE
        WHEN MAX(distance_miles) OVER () > MIN(distance_miles) OVER ()
        THEN (distance_miles - MIN(distance_miles) OVER ())
             / (MAX(distance_miles) OVER () - MIN(distance_miles) OVER ())
        ELSE 0.5
      END AS dist_norm,

      -- Experience norm (0 = least, 1 = most); NULL treated as 0
      CASE
        WHEN MAX(COALESCE(years_of_experience, 0)) OVER () > 0
        THEN COALESCE(years_of_experience, 0)::FLOAT8
             / MAX(COALESCE(years_of_experience, 0)) OVER ()
        ELSE 0.0
      END AS exp_norm,

      -- Rating norm (0 = worst, 1 = best); NULL → 0.5 (neutral for new pros)
      CASE
        WHEN avg_rating IS NULL THEN 0.5
        ELSE (avg_rating - 1.0) / 4.0
      END AS rating_norm,

      -- Price norm (0 = cheapest, 1 = most expensive); NULL → midpoint
      CASE
        WHEN MAX(COALESCE(base_rate, 0)) OVER () > MIN(COALESCE(base_rate, 0)) OVER ()
        THEN (COALESCE(base_rate,
                (MAX(base_rate) OVER () + MIN(base_rate) OVER ()) / 2.0
              ) - MIN(COALESCE(base_rate, 0)) OVER ())
             / (MAX(COALESCE(base_rate, 0)) OVER () - MIN(COALESCE(base_rate, 0)) OVER ())
        ELSE 0.5
      END AS price_norm

    FROM candidates
  )

  SELECT json_agg(row_to_json(result) ORDER BY result.rank_score DESC)
  INTO   _providers
  FROM (
    SELECT
      id,
      full_name,
      business_name,
      base_rate,
      years_of_experience,
      distance_miles,
      avg_rating,
      total_reviews,
      ROUND(
        (
          (1.0 - dist_norm)  * 5 +   -- distance:    weight 5
          exp_norm           * 4 +   -- experience:  weight 4
          rating_norm        * 3 +   -- rating:      weight 3
          (1.0 - price_norm) * 2     -- price:       weight 2
        )::NUMERIC, 2
      ) AS rank_score
    FROM scored
    LIMIT 20
  ) result;

  RETURN json_build_object(
    'success',   true,
    'providers', COALESCE(_providers, '[]'::json)
  );
END;
$$;
