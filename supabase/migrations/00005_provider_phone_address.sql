-- Add phone and address columns to provider_profiles
ALTER TABLE public.provider_profiles
  ADD COLUMN IF NOT EXISTS phone   TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT;
