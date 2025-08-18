-- Add encryption, token rotation, and audit logging for Google OAuth tokens
-- Add encryption columns and audit logging
ALTER TABLE public.admin_google_credentials 
ADD COLUMN encrypted_access_token TEXT,
ADD COLUMN encrypted_refresh_token TEXT,
ADD COLUMN token_version INTEGER DEFAULT 1,
ADD COLUMN last_used_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN rotation_count INTEGER DEFAULT 0,
ADD COLUMN security_flags JSONB DEFAULT '{}';

-- Create audit log table for Google credentials access
CREATE TABLE public.google_credentials_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  credential_id UUID REFERENCES admin_google_credentials(id),
  action TEXT NOT NULL, -- 'access', 'refresh', 'create', 'delete'
  user_agent TEXT,
  ip_address INET,
  edge_function_name TEXT,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.google_credentials_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for audit log (admin and service role only)
CREATE POLICY "Admin users can view audit logs"
ON public.google_credentials_audit_log
FOR SELECT
USING (is_admin_user());

CREATE POLICY "Service role can manage audit logs"
ON public.google_credentials_audit_log
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- Add trigger to update last_used_at automatically
CREATE OR REPLACE FUNCTION public.update_credential_last_used()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_used_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_credential_last_used_trigger
  BEFORE UPDATE ON public.admin_google_credentials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_credential_last_used();

-- Create function to encrypt/decrypt tokens (uses environment variable)
CREATE OR REPLACE FUNCTION public.encrypt_token(token TEXT)
RETURNS TEXT AS $$
BEGIN
  -- This is a placeholder - actual encryption will be handled in edge functions
  -- using the GOOGLE_TOKEN_ENCRYPTION_KEY environment variable
  RETURN token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate more restrictive service role policy
DROP POLICY IF EXISTS "Service role can manage Google credentials for edge functions" ON public.admin_google_credentials;

CREATE POLICY "Restricted service role access for Google credentials"
ON public.admin_google_credentials
FOR ALL
USING (
  (auth.jwt() ->> 'role' = 'service_role') 
  AND (auth.jwt() ->> 'iss' = 'supabase')
  AND (
    -- Only allow access from our specific edge functions
    current_setting('request.headers', true)::json ->> 'user-agent' LIKE '%supabase-edge-functions%'
    OR current_setting('request.jwt.claims', true)::json ->> 'sub' = 'supabase-admin'
  )
);

-- Add index for better performance on audit queries
CREATE INDEX idx_google_credentials_audit_log_credential_id ON public.google_credentials_audit_log(credential_id);
CREATE INDEX idx_google_credentials_audit_log_created_at ON public.google_credentials_audit_log(created_at);
CREATE INDEX idx_admin_google_credentials_last_used_at ON public.admin_google_credentials(last_used_at);