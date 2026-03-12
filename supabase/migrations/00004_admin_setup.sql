-- ============================================================
-- Fixmatch: Admin Setup Migration
-- ============================================================

-- Function to promote a user to admin role (called from client with secret key)
-- The secret key is validated server-side so it cannot be bypassed from the browser.
CREATE OR REPLACE FUNCTION public.promote_to_admin(user_email TEXT, secret_key TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
  _expected_key TEXT := 'fixmatch-admin-2026';
BEGIN
  -- Validate secret key
  IF secret_key IS NULL OR secret_key != _expected_key THEN
    RETURN json_build_object('success', false, 'error', 'Invalid secret key');
  END IF;

  -- Find the user by email
  SELECT id INTO _user_id
  FROM auth.users
  WHERE email = user_email;

  IF _user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Update role in profiles table
  UPDATE public.profiles
  SET role = 'admin'
  WHERE id = _user_id;

  -- If no profile row exists, create one
  IF NOT FOUND THEN
    INSERT INTO public.profiles (id, role)
    VALUES (_user_id, 'admin');
  END IF;

  -- Sync role to JWT app_metadata
  UPDATE auth.users
  SET raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
  WHERE id = _user_id;

  RETURN json_build_object('success', true);
END;
$$;
