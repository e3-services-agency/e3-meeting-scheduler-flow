-- Fix SECURITY DEFINER functions that don't actually need elevated privileges
-- Keep only the essential SECURITY DEFINER functions for security and system operations

-- 1. Fix can_access_meeting - this can be a regular function since it just checks data
DROP FUNCTION IF EXISTS public.can_access_meeting(uuid, text);

CREATE OR REPLACE FUNCTION public.can_access_meeting(meeting_id uuid, user_email text)
RETURNS boolean
LANGUAGE plpgsql
STABLE  -- Removed SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if user is organizer or attendee of the meeting
  RETURN EXISTS (
    SELECT 1 FROM public.meetings m
    WHERE m.id = meeting_id
    AND (
      m.organizer_email = user_email 
      OR user_email = ANY(m.attendee_emails)
    )
  );
END;
$$;

-- 2. Fix encrypt_token - this is just a placeholder, doesn't need SECURITY DEFINER
DROP FUNCTION IF EXISTS public.encrypt_token(text);

CREATE OR REPLACE FUNCTION public.encrypt_token(token text)
RETURNS text
LANGUAGE plpgsql
STABLE  -- Removed SECURITY DEFINER 
SET search_path TO 'public'
AS $$
BEGIN
  -- This is a placeholder - actual encryption will be handled in edge functions
  -- using the GOOGLE_TOKEN_ENCRYPTION_KEY environment variable
  RETURN token;
END;
$$;

-- The remaining functions (handle_new_user, is_admin_user, rotate_google_credentials) 
-- legitimately need SECURITY DEFINER for their operations:
-- - handle_new_user: needs to insert into profiles table during user creation
-- - is_admin_user: needs to check admin status for RLS policies
-- - rotate_google_credentials: needs to update sensitive credential data