-- Fix SECURITY DEFINER issue with a more targeted approach
-- Keep essential functions but make non-essential ones regular functions

-- Remove the non-essential SECURITY DEFINER functions that I created recently
DROP FUNCTION IF EXISTS public.audit_google_credentials_access(text, uuid, jsonb);
DROP FUNCTION IF EXISTS public.log_credential_access(uuid, text, boolean);

-- Keep rotate_google_credentials as SECURITY DEFINER since it needs to modify sensitive data
-- Keep is_admin_user as SECURITY DEFINER since it's used by many policies 
-- Keep the core Supabase functions as they are essential

-- Create simpler audit logging without SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.simple_audit_log(
  action_type text,
  table_name text,
  record_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
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