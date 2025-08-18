-- Fix Google credentials table security - restrict admin access to authenticated users only

-- Drop the existing overly permissive admin policies
DROP POLICY IF EXISTS "Admin users can view admin google credentials" ON public.admin_google_credentials;
DROP POLICY IF EXISTS "Admin users can insert admin google credentials" ON public.admin_google_credentials;
DROP POLICY IF EXISTS "Admin users can update admin google credentials" ON public.admin_google_credentials;
DROP POLICY IF EXISTS "Admin users can delete admin google credentials" ON public.admin_google_credentials;

-- Create secure admin policies that only allow authenticated admin users
CREATE POLICY "Authenticated admin users can view Google credentials"
ON public.admin_google_credentials
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Authenticated admin users can insert Google credentials"
ON public.admin_google_credentials
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Authenticated admin users can update Google credentials"
ON public.admin_google_credentials
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Authenticated admin users can delete Google credentials"
ON public.admin_google_credentials
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Enhance the edge function policy to be more restrictive
DROP POLICY IF EXISTS "Secure edge function only access for Google credentials" ON public.admin_google_credentials;

CREATE POLICY "Restricted edge function access for Google credentials"
ON public.admin_google_credentials
FOR ALL
TO service_role
USING (
  -- Only allow access from service role with proper edge function context
  ((auth.jwt() ->> 'role'::text) = 'service_role'::text) 
  AND ((auth.jwt() ->> 'iss'::text) = 'supabase'::text)
  AND (
    -- Only allow specific edge functions based on user agent
    ((current_setting('request.headers'::text, true))::json ->> 'user-agent'::text) ~~ '%supabase-edge-functions%'::text
    OR ((current_setting('request.jwt.claims'::text, true))::json ->> 'sub'::text) = 'supabase-admin'::text
  )
)
WITH CHECK (
  -- Same restrictions for write operations
  ((auth.jwt() ->> 'role'::text) = 'service_role'::text) 
  AND ((auth.jwt() ->> 'iss'::text) = 'supabase'::text)
  AND (
    ((current_setting('request.headers'::text, true))::json ->> 'user-agent'::text) ~~ '%supabase-edge-functions%'::text
    OR ((current_setting('request.jwt.claims'::text, true))::json ->> 'sub'::text) = 'supabase-admin'::text
  )
);

-- Add additional audit logging function for sensitive operations
CREATE OR REPLACE FUNCTION public.audit_google_credentials_access(
  action_type text,
  credential_id_param uuid DEFAULT NULL,
  additional_info jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Enhanced audit logging for Google credentials access
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