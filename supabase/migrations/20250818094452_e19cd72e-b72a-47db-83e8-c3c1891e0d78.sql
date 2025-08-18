-- Fix Google API credentials security vulnerabilities

-- 1. Drop the overly permissive service role policy
DROP POLICY IF EXISTS "Restricted service role access for Google credentials" ON public.admin_google_credentials;

-- 2. Remove plain text token columns (security risk)
ALTER TABLE public.admin_google_credentials 
DROP COLUMN IF EXISTS access_token,
DROP COLUMN IF EXISTS refresh_token;

-- 3. Create a more secure service role policy that only allows specific edge function access
CREATE POLICY "Secure edge function only access for Google credentials"
ON public.admin_google_credentials
FOR ALL
TO service_role
USING (
  -- Only allow access from edge functions with specific user agent patterns
  ((auth.jwt() ->> 'role'::text) = 'service_role'::text) 
  AND ((auth.jwt() ->> 'iss'::text) = 'supabase'::text)
  AND (
    -- Only allow google-auth edge function
    ((current_setting('request.headers'::text, true))::json ->> 'user-agent'::text) ~~ '%supabase-edge-functions%'::text
    AND ((current_setting('request.headers'::text, true))::json ->> 'referer'::text) ~~ '%/functions/google-auth%'::text
  )
);

-- 4. Create an audit function for credential access
CREATE OR REPLACE FUNCTION public.audit_credential_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log all access attempts to credentials
  INSERT INTO public.google_credentials_audit_log (
    credential_id,
    action,
    ip_address,
    user_agent,
    edge_function_name,
    success
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    inet(coalesce((current_setting('request.headers'::text, true))::json ->> 'x-forwarded-for', '127.0.0.1')),
    (current_setting('request.headers'::text, true))::json ->> 'user-agent',
    'google-auth',
    true
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create trigger for audit logging
DROP TRIGGER IF EXISTS audit_google_credentials_access ON public.admin_google_credentials;
CREATE TRIGGER audit_google_credentials_access
  AFTER SELECT OR INSERT OR UPDATE OR DELETE ON public.admin_google_credentials
  FOR EACH ROW EXECUTE FUNCTION public.audit_credential_access();

-- 6. Create a secure view that only exposes encrypted credentials to service role
CREATE OR REPLACE VIEW public.secure_google_credentials AS
SELECT 
  id,
  admin_email,
  encrypted_access_token,
  encrypted_refresh_token,
  token_expires_at,
  domain,
  scopes,
  last_used_at,
  created_at,
  updated_at
FROM public.admin_google_credentials
WHERE 
  -- Only accessible by service role from edge functions
  ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- 7. Add function to rotate credentials with enhanced security
CREATE OR REPLACE FUNCTION public.rotate_google_credentials(
  credential_id_param uuid,
  new_encrypted_access_token text,
  new_encrypted_refresh_token text,
  new_expires_at timestamptz
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rotation_success boolean := false;
BEGIN
  -- Only allow rotation from authenticated edge functions
  IF (auth.jwt() ->> 'role'::text) != 'service_role'::text THEN
    RAISE EXCEPTION 'Unauthorized credential rotation attempt';
  END IF;
  
  -- Update credentials with rotation tracking
  UPDATE public.admin_google_credentials 
  SET 
    encrypted_access_token = new_encrypted_access_token,
    encrypted_refresh_token = new_encrypted_refresh_token,
    token_expires_at = new_expires_at,
    rotation_count = rotation_count + 1,
    updated_at = now(),
    last_used_at = now(),
    token_version = token_version + 1
  WHERE id = credential_id_param;
  
  GET DIAGNOSTICS rotation_success = FOUND;
  
  -- Log the rotation attempt
  INSERT INTO public.google_credentials_audit_log (
    credential_id,
    action,
    success,
    ip_address,
    user_agent,
    edge_function_name
  ) VALUES (
    credential_id_param,
    'ROTATE_CREDENTIALS',
    rotation_success,
    inet(coalesce((current_setting('request.headers'::text, true))::json ->> 'x-forwarded-for', '127.0.0.1')),
    (current_setting('request.headers'::text, true))::json ->> 'user-agent',
    'google-auth'
  );
  
  RETURN rotation_success;
END;
$$;