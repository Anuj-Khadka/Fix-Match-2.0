-- ============================================================
-- Seed: 8 electrical service providers (Caldwell, NJ area)
-- Idempotent — safe to re-run (ON CONFLICT guards on all inserts)
-- ============================================================

DO $$
DECLARE
  -- Fixed provider UUIDs
  _p1  UUID := 'ffff0001-0000-0000-0000-000000000000';
  _p2  UUID := 'ffff0002-0000-0000-0000-000000000000';
  _p3  UUID := 'ffff0003-0000-0000-0000-000000000000';
  _p4  UUID := 'ffff0004-0000-0000-0000-000000000000';
  _p5  UUID := 'ffff0005-0000-0000-0000-000000000000';
  _p6  UUID := 'ffff0006-0000-0000-0000-000000000000';
  _p7  UUID := 'ffff0007-0000-0000-0000-000000000000';
  _p8  UUID := 'ffff0008-0000-0000-0000-000000000000';

  -- Seed client for generating review records
  _client UUID := 'ffff0000-0000-0000-0000-000000000000';

  -- Base coords for Caldwell, NJ — providers placed within a few miles
  _base_lat FLOAT8 := 40.8398;
  _base_lng FLOAT8 := -74.3112;

  _job_id UUID;
  _i      INT;
  _rating SMALLINT;
BEGIN

  -- ── Seed client ──────────────────────────────────────────────────────────
  INSERT INTO auth.users (
    id, instance_id, aud, role,
    email, encrypted_password, email_confirmed_at,
    raw_user_meta_data, raw_app_meta_data,
    created_at, updated_at
  ) VALUES (
    _client,
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'seed.client@fixmatch.internal', '', now(),
    '{"role":"client","full_name":"Seed Client"}'::jsonb,
    '{"role":"client"}'::jsonb,
    now(), now()
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.profiles (id, role, full_name)
  VALUES (_client, 'client', 'Seed Client')
  ON CONFLICT (id) DO UPDATE
    SET role      = EXCLUDED.role,
        full_name = EXCLUDED.full_name;

  -- ── Helper macro (repeated per provider) ─────────────────────────────────
  -- Pattern: auth user → profile → provider_profile → seed reviews

  -- ── 1. Ace Handyman Services Montclair ───────────────────────────────────
  INSERT INTO auth.users (
    id, instance_id, aud, role,
    email, encrypted_password, email_confirmed_at,
    raw_user_meta_data, raw_app_meta_data, created_at, updated_at
  ) VALUES (
    _p1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'ace.handyman@fixmatch.internal', '', now(),
    '{"role":"provider","full_name":"Ace Handyman"}'::jsonb,
    '{"role":"provider"}'::jsonb, now(), now()
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.profiles (id, role, full_name)
  VALUES (_p1, 'provider', 'Ace Handyman')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role;

  INSERT INTO public.provider_profiles (
    id, business_name, status, service_categories,
    years_of_experience, base_rate, is_online,
    live_location, reliability_score
  ) VALUES (
    _p1, 'Ace Handyman Services Montclair', 'approved', '{electrical}',
    1, 85.00, FALSE,
    ST_SetSRID(ST_MakePoint(_base_lng + 0.010, _base_lat + 0.010), 4326)::GEOGRAPHY,
    5.00
  ) ON CONFLICT (id) DO UPDATE
    SET business_name        = EXCLUDED.business_name,
        service_categories   = EXCLUDED.service_categories,
        years_of_experience  = EXCLUDED.years_of_experience,
        base_rate            = EXCLUDED.base_rate,
        status               = EXCLUDED.status,
        reliability_score    = EXCLUDED.reliability_score;

  -- Reviews: 5.0 avg → 10 × ★5
  FOR _i IN 1..10 LOOP
    _job_id := md5('job_p1_' || _i)::UUID;
    INSERT INTO public.jobs (
      id, client_id, provider_id, category, status,
      location, description, completed_at, created_at, updated_at
    ) VALUES (
      _job_id, _client, _p1, 'electrical', 'completed',
      ST_SetSRID(ST_MakePoint(_base_lng, _base_lat), 4326)::GEOGRAPHY,
      'Seed job', now() - (_i || ' days')::INTERVAL, now(), now()
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.reviews (job_id, reviewer_id, reviewee_id, rating)
    VALUES (_job_id, _client, _p1, 5)
    ON CONFLICT (job_id, reviewer_id) DO NOTHING;
  END LOOP;


  -- ── 2. Service Professionals ─────────────────────────────────────────────
  INSERT INTO auth.users (
    id, instance_id, aud, role,
    email, encrypted_password, email_confirmed_at,
    raw_user_meta_data, raw_app_meta_data, created_at, updated_at
  ) VALUES (
    _p2, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'service.professionals@fixmatch.internal', '', now(),
    '{"role":"provider","full_name":"Service Professionals"}'::jsonb,
    '{"role":"provider"}'::jsonb, now(), now()
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.profiles (id, role, full_name)
  VALUES (_p2, 'provider', 'Service Professionals')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role;

  INSERT INTO public.provider_profiles (
    id, business_name, status, service_categories,
    years_of_experience, base_rate, is_online,
    live_location, reliability_score
  ) VALUES (
    _p2, 'Service Professionals', 'approved', '{electrical}',
    30, 95.00, FALSE,
    ST_SetSRID(ST_MakePoint(_base_lng - 0.020, _base_lat + 0.015), 4326)::GEOGRAPHY,
    4.70
  ) ON CONFLICT (id) DO UPDATE
    SET business_name        = EXCLUDED.business_name,
        service_categories   = EXCLUDED.service_categories,
        years_of_experience  = EXCLUDED.years_of_experience,
        base_rate            = EXCLUDED.base_rate,
        status               = EXCLUDED.status,
        reliability_score    = EXCLUDED.reliability_score;

  -- Reviews: 4.7 avg → 7 × ★5  +  3 × ★4
  FOR _i IN 1..10 LOOP
    _job_id := md5('job_p2_' || _i)::UUID;
    _rating  := CASE WHEN _i <= 7 THEN 5 ELSE 4 END;
    INSERT INTO public.jobs (
      id, client_id, provider_id, category, status,
      location, description, completed_at, created_at, updated_at
    ) VALUES (
      _job_id, _client, _p2, 'electrical', 'completed',
      ST_SetSRID(ST_MakePoint(_base_lng, _base_lat), 4326)::GEOGRAPHY,
      'Seed job', now() - (_i || ' days')::INTERVAL, now(), now()
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.reviews (job_id, reviewer_id, reviewee_id, rating)
    VALUES (_job_id, _client, _p2, _rating)
    ON CONFLICT (job_id, reviewer_id) DO NOTHING;
  END LOOP;


  -- ── 3. Centanni & Sons Plumbing & Electrical Contractors ─────────────────
  INSERT INTO auth.users (
    id, instance_id, aud, role,
    email, encrypted_password, email_confirmed_at,
    raw_user_meta_data, raw_app_meta_data, created_at, updated_at
  ) VALUES (
    _p3, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'centanni.sons@fixmatch.internal', '', now(),
    '{"role":"provider","full_name":"Centanni & Sons"}'::jsonb,
    '{"role":"provider"}'::jsonb, now(), now()
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.profiles (id, role, full_name)
  VALUES (_p3, 'provider', 'Centanni & Sons')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role;

  INSERT INTO public.provider_profiles (
    id, business_name, status, service_categories,
    years_of_experience, base_rate, is_online,
    live_location, reliability_score
  ) VALUES (
    _p3, 'Centanni & Sons Plumbing & Electrical Contractors', 'approved',
    '{electrical,plumbing}',
    56, 110.00, FALSE,
    ST_SetSRID(ST_MakePoint(_base_lng + 0.025, _base_lat - 0.012), 4326)::GEOGRAPHY,
    5.00
  ) ON CONFLICT (id) DO UPDATE
    SET business_name        = EXCLUDED.business_name,
        service_categories   = EXCLUDED.service_categories,
        years_of_experience  = EXCLUDED.years_of_experience,
        base_rate            = EXCLUDED.base_rate,
        status               = EXCLUDED.status,
        reliability_score    = EXCLUDED.reliability_score;

  -- Reviews: 5.0 avg → 10 × ★5
  FOR _i IN 1..10 LOOP
    _job_id := md5('job_p3_' || _i)::UUID;
    INSERT INTO public.jobs (
      id, client_id, provider_id, category, status,
      location, description, completed_at, created_at, updated_at
    ) VALUES (
      _job_id, _client, _p3, 'electrical', 'completed',
      ST_SetSRID(ST_MakePoint(_base_lng, _base_lat), 4326)::GEOGRAPHY,
      'Seed job', now() - (_i || ' days')::INTERVAL, now(), now()
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.reviews (job_id, reviewer_id, reviewee_id, rating)
    VALUES (_job_id, _client, _p3, 5)
    ON CONFLICT (job_id, reviewer_id) DO NOTHING;
  END LOOP;


  -- ── 4. Gold Medal Service ─────────────────────────────────────────────────
  INSERT INTO auth.users (
    id, instance_id, aud, role,
    email, encrypted_password, email_confirmed_at,
    raw_user_meta_data, raw_app_meta_data, created_at, updated_at
  ) VALUES (
    _p4, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'gold.medal.service@fixmatch.internal', '', now(),
    '{"role":"provider","full_name":"Gold Medal Service"}'::jsonb,
    '{"role":"provider"}'::jsonb, now(), now()
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.profiles (id, role, full_name)
  VALUES (_p4, 'provider', 'Gold Medal Service')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role;

  INSERT INTO public.provider_profiles (
    id, business_name, status, service_categories,
    years_of_experience, base_rate, is_online,
    live_location, reliability_score
  ) VALUES (
    _p4, 'Gold Medal Service - Air Conditioning, Heating, Plumbing', 'approved',
    '{electrical,plumbing}',
    32, 120.00, FALSE,
    ST_SetSRID(ST_MakePoint(_base_lng - 0.030, _base_lat - 0.020), 4326)::GEOGRAPHY,
    4.80
  ) ON CONFLICT (id) DO UPDATE
    SET business_name        = EXCLUDED.business_name,
        service_categories   = EXCLUDED.service_categories,
        years_of_experience  = EXCLUDED.years_of_experience,
        base_rate            = EXCLUDED.base_rate,
        status               = EXCLUDED.status,
        reliability_score    = EXCLUDED.reliability_score;

  -- Reviews: 4.8 avg → 8 × ★5  +  2 × ★4
  FOR _i IN 1..10 LOOP
    _job_id := md5('job_p4_' || _i)::UUID;
    _rating  := CASE WHEN _i <= 8 THEN 5 ELSE 4 END;
    INSERT INTO public.jobs (
      id, client_id, provider_id, category, status,
      location, description, completed_at, created_at, updated_at
    ) VALUES (
      _job_id, _client, _p4, 'electrical', 'completed',
      ST_SetSRID(ST_MakePoint(_base_lng, _base_lat), 4326)::GEOGRAPHY,
      'Seed job', now() - (_i || ' days')::INTERVAL, now(), now()
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.reviews (job_id, reviewer_id, reviewee_id, rating)
    VALUES (_job_id, _client, _p4, _rating)
    ON CONFLICT (job_id, reviewer_id) DO NOTHING;
  END LOOP;


  -- ── 5. Jason Klein Electrical Contractor ─────────────────────────────────
  INSERT INTO auth.users (
    id, instance_id, aud, role,
    email, encrypted_password, email_confirmed_at,
    raw_user_meta_data, raw_app_meta_data, created_at, updated_at
  ) VALUES (
    _p5, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'jason.klein@fixmatch.internal', '', now(),
    '{"role":"provider","full_name":"Jason Klein"}'::jsonb,
    '{"role":"provider"}'::jsonb, now(), now()
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.profiles (id, role, full_name)
  VALUES (_p5, 'provider', 'Jason Klein')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role;

  INSERT INTO public.provider_profiles (
    id, business_name, status, service_categories,
    years_of_experience, base_rate, is_online,
    live_location, reliability_score
  ) VALUES (
    _p5, 'Jason Klein Electrical Contractor', 'approved', '{electrical}',
    14, 100.00, FALSE,
    ST_SetSRID(ST_MakePoint(_base_lng + 0.015, _base_lat - 0.030), 4326)::GEOGRAPHY,
    5.00
  ) ON CONFLICT (id) DO UPDATE
    SET business_name        = EXCLUDED.business_name,
        service_categories   = EXCLUDED.service_categories,
        years_of_experience  = EXCLUDED.years_of_experience,
        base_rate            = EXCLUDED.base_rate,
        status               = EXCLUDED.status,
        reliability_score    = EXCLUDED.reliability_score;

  -- Reviews: 5.0 avg → 10 × ★5
  FOR _i IN 1..10 LOOP
    _job_id := md5('job_p5_' || _i)::UUID;
    INSERT INTO public.jobs (
      id, client_id, provider_id, category, status,
      location, description, completed_at, created_at, updated_at
    ) VALUES (
      _job_id, _client, _p5, 'electrical', 'completed',
      ST_SetSRID(ST_MakePoint(_base_lng, _base_lat), 4326)::GEOGRAPHY,
      'Seed job', now() - (_i || ' days')::INTERVAL, now(), now()
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.reviews (job_id, reviewer_id, reviewee_id, rating)
    VALUES (_job_id, _client, _p5, 5)
    ON CONFLICT (job_id, reviewer_id) DO NOTHING;
  END LOOP;


  -- ── 6. Binsky Home Service ────────────────────────────────────────────────
  INSERT INTO auth.users (
    id, instance_id, aud, role,
    email, encrypted_password, email_confirmed_at,
    raw_user_meta_data, raw_app_meta_data, created_at, updated_at
  ) VALUES (
    _p6, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'binsky.home@fixmatch.internal', '', now(),
    '{"role":"provider","full_name":"Binsky Home Service"}'::jsonb,
    '{"role":"provider"}'::jsonb, now(), now()
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.profiles (id, role, full_name)
  VALUES (_p6, 'provider', 'Binsky Home Service')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role;

  INSERT INTO public.provider_profiles (
    id, business_name, status, service_categories,
    years_of_experience, base_rate, is_online,
    live_location, reliability_score
  ) VALUES (
    _p6, 'Binsky Home Service', 'approved', '{electrical,plumbing}',
    87, 130.00, FALSE,
    ST_SetSRID(ST_MakePoint(_base_lng - 0.008, _base_lat + 0.025), 4326)::GEOGRAPHY,
    4.80
  ) ON CONFLICT (id) DO UPDATE
    SET business_name        = EXCLUDED.business_name,
        service_categories   = EXCLUDED.service_categories,
        years_of_experience  = EXCLUDED.years_of_experience,
        base_rate            = EXCLUDED.base_rate,
        status               = EXCLUDED.status,
        reliability_score    = EXCLUDED.reliability_score;

  -- Reviews: 4.8 avg → 8 × ★5  +  2 × ★4
  FOR _i IN 1..10 LOOP
    _job_id := md5('job_p6_' || _i)::UUID;
    _rating  := CASE WHEN _i <= 8 THEN 5 ELSE 4 END;
    INSERT INTO public.jobs (
      id, client_id, provider_id, category, status,
      location, description, completed_at, created_at, updated_at
    ) VALUES (
      _job_id, _client, _p6, 'electrical', 'completed',
      ST_SetSRID(ST_MakePoint(_base_lng, _base_lat), 4326)::GEOGRAPHY,
      'Seed job', now() - (_i || ' days')::INTERVAL, now(), now()
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.reviews (job_id, reviewer_id, reviewee_id, rating)
    VALUES (_job_id, _client, _p6, _rating)
    ON CONFLICT (job_id, reviewer_id) DO NOTHING;
  END LOOP;


  -- ── 7. Alb electric llc ───────────────────────────────────────────────────
  INSERT INTO auth.users (
    id, instance_id, aud, role,
    email, encrypted_password, email_confirmed_at,
    raw_user_meta_data, raw_app_meta_data, created_at, updated_at
  ) VALUES (
    _p7, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'alb.electric@fixmatch.internal', '', now(),
    '{"role":"provider","full_name":"Alb Electric"}'::jsonb,
    '{"role":"provider"}'::jsonb, now(), now()
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.profiles (id, role, full_name)
  VALUES (_p7, 'provider', 'Alb Electric')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role;

  INSERT INTO public.provider_profiles (
    id, business_name, status, service_categories,
    years_of_experience, base_rate, is_online,
    live_location, reliability_score
  ) VALUES (
    _p7, 'Alb electric llc', 'approved', '{electrical}',
    11, 90.00, FALSE,
    ST_SetSRID(ST_MakePoint(_base_lng + 0.030, _base_lat + 0.005), 4326)::GEOGRAPHY,
    5.00
  ) ON CONFLICT (id) DO UPDATE
    SET business_name        = EXCLUDED.business_name,
        service_categories   = EXCLUDED.service_categories,
        years_of_experience  = EXCLUDED.years_of_experience,
        base_rate            = EXCLUDED.base_rate,
        status               = EXCLUDED.status,
        reliability_score    = EXCLUDED.reliability_score;

  -- Reviews: 5.0 avg → 10 × ★5
  FOR _i IN 1..10 LOOP
    _job_id := md5('job_p7_' || _i)::UUID;
    INSERT INTO public.jobs (
      id, client_id, provider_id, category, status,
      location, description, completed_at, created_at, updated_at
    ) VALUES (
      _job_id, _client, _p7, 'electrical', 'completed',
      ST_SetSRID(ST_MakePoint(_base_lng, _base_lat), 4326)::GEOGRAPHY,
      'Seed job', now() - (_i || ' days')::INTERVAL, now(), now()
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.reviews (job_id, reviewer_id, reviewee_id, rating)
    VALUES (_job_id, _client, _p7, 5)
    ON CONFLICT (job_id, reviewer_id) DO NOTHING;
  END LOOP;


  -- ── 8. Sperry Electric LLC ────────────────────────────────────────────────
  INSERT INTO auth.users (
    id, instance_id, aud, role,
    email, encrypted_password, email_confirmed_at,
    raw_user_meta_data, raw_app_meta_data, created_at, updated_at
  ) VALUES (
    _p8, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'sperry.electric@fixmatch.internal', '', now(),
    '{"role":"provider","full_name":"Sperry Electric"}'::jsonb,
    '{"role":"provider"}'::jsonb, now(), now()
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.profiles (id, role, full_name)
  VALUES (_p8, 'provider', 'Sperry Electric')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role;

  INSERT INTO public.provider_profiles (
    id, business_name, status, service_categories,
    years_of_experience, base_rate, is_online,
    live_location, reliability_score
  ) VALUES (
    _p8, 'Sperry Electric LLC', 'approved', '{electrical}',
    4, 80.00, FALSE,
    ST_SetSRID(ST_MakePoint(_base_lng - 0.015, _base_lat - 0.008), 4326)::GEOGRAPHY,
    5.00
  ) ON CONFLICT (id) DO UPDATE
    SET business_name        = EXCLUDED.business_name,
        service_categories   = EXCLUDED.service_categories,
        years_of_experience  = EXCLUDED.years_of_experience,
        base_rate            = EXCLUDED.base_rate,
        status               = EXCLUDED.status,
        reliability_score    = EXCLUDED.reliability_score;

  -- Reviews: 5.0 avg → 10 × ★5
  FOR _i IN 1..10 LOOP
    _job_id := md5('job_p8_' || _i)::UUID;
    INSERT INTO public.jobs (
      id, client_id, provider_id, category, status,
      location, description, completed_at, created_at, updated_at
    ) VALUES (
      _job_id, _client, _p8, 'electrical', 'completed',
      ST_SetSRID(ST_MakePoint(_base_lng, _base_lat), 4326)::GEOGRAPHY,
      'Seed job', now() - (_i || ' days')::INTERVAL, now(), now()
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.reviews (job_id, reviewer_id, reviewee_id, rating)
    VALUES (_job_id, _client, _p8, 5)
    ON CONFLICT (job_id, reviewer_id) DO NOTHING;
  END LOOP;

END;
$$;
