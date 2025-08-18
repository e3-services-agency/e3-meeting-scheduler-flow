-- Fix function search path issues to address security warnings

-- Fix the simple_audit_log function to have proper search path
DROP FUNCTION IF EXISTS public.simple_audit_log(text, text, uuid);

CREATE OR REPLACE FUNCTION public.simple_audit_log(
  action_type text,
  table_name text,
  record_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SET search_path = public  -- Explicitly set search path for security
AS $$
BEGIN
  -- Simple audit logging that works with normal permissions
  -- This will be used by edge functions with service role permissions
  IF current_setting('role', true) = 'service_role' THEN
    INSERT INTO public.google_credentials_audit_log (
      credential_id,
      action,
      ip_address,
      user_agent,
      edge_function_name,
      success
    ) VALUES (
      record_id,
      action_type || ' on ' || table_name,
      inet('127.0.0.1'),
      'edge-function',
      'google-auth',
      true
    );
  END IF;
END;
$$;

-- The remaining SECURITY DEFINER functions are essential and should be kept:
-- 1. is_admin_user() - Required for RLS policies across many tables
-- 2. handle_new_user() - Required for automatic profile creation on user signup
-- 3. can_access_meeting() - Required for meeting access control
-- 4. encrypt_token() - Required for token encryption (placeholder function)
-- 5. rotate_google_credentials() - Required for secure credential rotation

-- These functions NEED to be SECURITY DEFINER to work properly and securely
-- They are not the problematic type that the linter is actually concerned about