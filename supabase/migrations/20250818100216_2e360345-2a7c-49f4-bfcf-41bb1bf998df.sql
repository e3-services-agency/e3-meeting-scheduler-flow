-- Replace is_admin_user SECURITY DEFINER function with a safer approach

-- First, check what policies depend on is_admin_user
-- We need to replace this function to eliminate SECURITY DEFINER usage

-- Drop and recreate is_admin_user as a regular function (not SECURITY DEFINER)
DROP FUNCTION IF EXISTS public.is_admin_user();

-- Create a regular function that doesn't use SECURITY DEFINER
-- This function will be subject to normal RLS policies
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
-- Removed SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

-- Also, let's make the audit functions less privileged where possible
-- Replace audit_google_credentials_access to not use SECURITY DEFINER
DROP FUNCTION IF EXISTS public.audit_google_credentials_access(text, uuid, jsonb);

CREATE OR REPLACE FUNCTION public.audit_google_credentials_access(
  action_type text,
  credential_id_param uuid DEFAULT NULL,
  additional_info jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
-- Removed SECURITY DEFINER - let it work with normal permissions
SET search_path = public
AS $$
BEGIN
  -- Enhanced audit logging for Google credentials access
  -- This will now be subject to normal RLS policies on google_credentials_audit_log
  INSERT INTO public.google_credentials_audit_log (
    credential_id,
    action,
    ip_address,
    user_agent,
    edge_function_name,
    success,
    error_message
  ) VALUES (
    credential_id_param,
    action_type,
    inet(coalesce((current_setting('request.headers'::text, true))::json ->> 'x-forwarded-for', '127.0.0.1')),
    (current_setting('request.headers'::text, true))::json ->> 'user-agent',
    coalesce(additional_info ->> 'function_name', 'google-auth'),
    coalesce((additional_info ->> 'success')::boolean, true),
    additional_info ->> 'error'
  );
END;
$$;

-- Replace log_credential_access to not use SECURITY DEFINER
DROP FUNCTION IF EXISTS public.log_credential_access(uuid, text, boolean);

CREATE OR REPLACE FUNCTION public.log_credential_access(
  credential_id_param uuid,
  action_param text,
  success_param boolean DEFAULT true
)
RETURNS void
LANGUAGE plpgsql
-- Removed SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log credential access attempts
  -- This will now be subject to normal RLS policies on google_credentials_audit_log
  INSERT INTO public.google_credentials_audit_log (
    credential_id,
    action,
    ip_address,
    user_agent,
    edge_function_name,
    success
  ) VALUES (
    credential_id_param,
    action_param,
    inet(coalesce((current_setting('request.headers'::text, true))::json ->> 'x-forwarded-for', '127.0.0.1')),
    (current_setting('request.headers'::text, true))::json ->> 'user-agent',
    'google-auth',
    success_param
  );
END;
$$;