-- Migration 00011: Fix job-images storage bucket
-- Ensures the bucket exists and is public so getPublicUrl() works.
-- The bucket was previously created as private in 00006 but never applied,
-- and getPublicUrl() requires a public bucket.
-- ============================================================

-- Create bucket if it doesn't exist, or make it public if it does
INSERT INTO storage.buckets (id, name, public)
VALUES ('job-images', 'job-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Policies may already exist from 00006 if that migration ran; skip if so
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Clients upload job images'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Clients upload job images"
        ON storage.objects FOR INSERT
        WITH CHECK (
          bucket_id = 'job-images'
          AND auth.uid()::text = (storage.foldername(name))[1]
        )
    $policy$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Clients read own job images'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Clients read own job images"
        ON storage.objects FOR SELECT
        USING (
          bucket_id = 'job-images'
          AND auth.uid()::text = (storage.foldername(name))[1]
        )
    $policy$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Providers read job images'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Providers read job images"
        ON storage.objects FOR SELECT
        USING (
          bucket_id = 'job-images'
          AND public.jwt_role() = 'provider'
        )
    $policy$;
  END IF;
END;
$$;
