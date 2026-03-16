-- ============================================================
-- Fix: RLS policy for Realtime postgres_changes delivery
-- ============================================================
-- The old policy used jwt_role() which relies on
-- current_setting('request.jwt.claims') — this is set by
-- PostgREST but NOT by the Realtime engine. As a result,
-- providers never receive INSERT events via postgres_changes.
--
-- This migration replaces it with a policy that uses auth.uid()
-- (works in both PostgREST and Realtime) and checks the role
-- via a subquery on the profiles table.
-- ============================================================

-- Drop the old policy that doesn't work with Realtime
DROP POLICY IF EXISTS "Providers can read searching jobs" ON public.jobs;

-- New policy: works in both REST and Realtime contexts
CREATE POLICY "Providers can read searching jobs"
  ON public.jobs FOR SELECT
  USING (
    status = 'searching'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'provider'
    )
  );
