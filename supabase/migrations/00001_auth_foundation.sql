-- ============================================================
-- Fixmatch: Auth Foundation Migration
-- ============================================================

-- 1. Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================
-- 2. TABLES
-- ============================================================

-- profiles: one row per user, auto-created on signup
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'client'
              CHECK (role IN ('client', 'provider', 'admin')),
  full_name   TEXT,
  phone       TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- provider_profiles: extended data for service providers
CREATE TABLE public.provider_profiles (
  id                UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected')),
  id_document_url   TEXT,
  license_number    TEXT,
  service_category  TEXT,
  reliability_score NUMERIC(3,2) NOT NULL DEFAULT 5.00
                    CHECK (reliability_score >= 1.00 AND reliability_score <= 5.00),
  cancellation_count INTEGER NOT NULL DEFAULT 0,
  live_location     GEOGRAPHY(POINT, 4326),
  is_online         BOOLEAN NOT NULL DEFAULT FALSE,
  rejection_reason  TEXT,
  reviewed_by       UUID REFERENCES public.profiles(id),
  reviewed_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. HELPER: read role from JWT
-- ============================================================

CREATE OR REPLACE FUNCTION public.jwt_role()
RETURNS TEXT
LANGUAGE sql STABLE
AS $$
  SELECT coalesce(
    current_setting('request.jwt.claims', true)::json -> 'app_metadata' ->> 'role',
    'client'
  );
$$;

-- ============================================================
-- 4. AUTO-UPDATED updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER provider_profiles_updated_at
  BEFORE UPDATE ON public.provider_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 5. AUTO-CREATE profile on signup (SAFE: defaults to 'client')
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role TEXT;
BEGIN
  -- Only accept 'client' or 'provider' from signup metadata.
  -- Any other value (including 'admin') is forced to 'client'.
  _role := NEW.raw_user_meta_data ->> 'role';

  IF _role IS NULL OR _role NOT IN ('client', 'provider') THEN
    _role := 'client';
  END IF;

  -- Insert the profile row
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    NEW.id,
    _role,
    coalesce(NEW.raw_user_meta_data ->> 'full_name', '')
  );

  -- Write role into app_metadata so it appears in the JWT
  UPDATE auth.users
  SET raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', _role)
  WHERE id = NEW.id;

  -- If signing up as provider, create the pending provider_profiles row
  IF _role = 'provider' THEN
    INSERT INTO public.provider_profiles (id)
    VALUES (NEW.id);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 6. SYNC role changes to JWT app_metadata
-- ============================================================

CREATE OR REPLACE FUNCTION public.sync_role_to_jwt()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    UPDATE auth.users
    SET raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', NEW.role)
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_sync_role
  AFTER UPDATE OF role ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_role_to_jwt();

-- ============================================================
-- 7. ROW-LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_profiles ENABLE ROW LEVEL SECURITY;

-- ---------- profiles ----------

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile (but NOT the role column)
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT
  USING (public.jwt_role() = 'admin');

-- Admins can update any profile (for role changes, etc.)
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (public.jwt_role() = 'admin');

-- ---------- provider_profiles ----------

-- Providers can read their own provider profile
CREATE POLICY "Providers can read own provider profile"
  ON public.provider_profiles FOR SELECT
  USING (auth.uid() = id);

-- Providers can update their own profile (but NOT status, reviewed_by, reviewed_at, rejection_reason)
CREATE POLICY "Providers can update own provider profile"
  ON public.provider_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND status = (SELECT status FROM public.provider_profiles WHERE id = auth.uid())
    AND reviewed_by IS NOT DISTINCT FROM (SELECT reviewed_by FROM public.provider_profiles WHERE id = auth.uid())
    AND reviewed_at IS NOT DISTINCT FROM (SELECT reviewed_at FROM public.provider_profiles WHERE id = auth.uid())
    AND rejection_reason IS NOT DISTINCT FROM (SELECT rejection_reason FROM public.provider_profiles WHERE id = auth.uid())
  );

-- Providers can insert their own provider profile (for late provider signup)
CREATE POLICY "Providers can insert own provider profile"
  ON public.provider_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Admins can read all provider profiles
CREATE POLICY "Admins can read all provider profiles"
  ON public.provider_profiles FOR SELECT
  USING (public.jwt_role() = 'admin');

-- Admins can update any provider profile (for approvals/rejections)
CREATE POLICY "Admins can update any provider profile"
  ON public.provider_profiles FOR UPDATE
  USING (public.jwt_role() = 'admin');
