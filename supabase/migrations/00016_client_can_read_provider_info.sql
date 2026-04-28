-- Allow any authenticated user to read basic profile info (full_name, etc.)
-- Needed so clients can see the name of their matched provider.
CREATE POLICY "Authenticated users can read any profile"
  ON public.profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow any authenticated user to read approved provider profiles.
-- Needed so clients can see base_rate, business_name, etc. for payment/display.
CREATE POLICY "Authenticated users can read approved provider profiles"
  ON public.provider_profiles FOR SELECT
  USING (status = 'approved');
