-- ============================================================
-- Fixmatch: Provider Onboarding Migration
-- ============================================================

-- 1. Add onboarding columns to provider_profiles
ALTER TABLE public.provider_profiles
  ADD COLUMN IF NOT EXISTS business_name         TEXT,
  ADD COLUMN IF NOT EXISTS years_of_experience   INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bio                   TEXT,
  ADD COLUMN IF NOT EXISTS service_categories    TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS service_radius        INTEGER DEFAULT 25,
  ADD COLUMN IF NOT EXISTS base_rate             NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS license_document_url  TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_step       INTEGER NOT NULL DEFAULT 0;

-- 2. Update status CHECK to allow 'pending_review'
ALTER TABLE public.provider_profiles
  DROP CONSTRAINT provider_profiles_status_check;

ALTER TABLE public.provider_profiles
  ADD CONSTRAINT provider_profiles_status_check
  CHECK (status IN ('pending', 'pending_review', 'approved', 'rejected'));

-- 3. Update RLS policy so providers can transition pending → pending_review
DROP POLICY IF EXISTS "Providers can update own provider profile" ON public.provider_profiles;

CREATE POLICY "Providers can update own provider profile"
  ON public.provider_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND (
      -- status unchanged
      status = (SELECT status FROM public.provider_profiles WHERE id = auth.uid())
      OR (
        -- allow pending → pending_review transition only
        (SELECT status FROM public.provider_profiles WHERE id = auth.uid()) = 'pending'
        AND status = 'pending_review'
      )
    )
    -- admin-only fields must stay unchanged
    AND reviewed_by IS NOT DISTINCT FROM (SELECT reviewed_by FROM public.provider_profiles WHERE id = auth.uid())
    AND reviewed_at IS NOT DISTINCT FROM (SELECT reviewed_at FROM public.provider_profiles WHERE id = auth.uid())
    AND rejection_reason IS NOT DISTINCT FROM (SELECT rejection_reason FROM public.provider_profiles WHERE id = auth.uid())
  );

-- 4. Create storage bucket for provider documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('provider-docs', 'provider-docs', false)
ON CONFLICT (id) DO NOTHING;

-- 5. Storage RLS policies
CREATE POLICY "Providers upload own docs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'provider-docs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Providers read own docs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'provider-docs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins read all provider docs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'provider-docs'
    AND public.jwt_role() = 'admin'
  );
