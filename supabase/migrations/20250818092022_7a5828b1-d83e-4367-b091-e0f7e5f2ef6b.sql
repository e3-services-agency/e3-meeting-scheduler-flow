-- CRITICAL SECURITY FIX: Remove dangerous Google OAuth credentials policies

-- Remove the policy that allows users to see credentials based on email matching
-- This is dangerous because it exposes OAuth tokens to frontend users
DROP POLICY IF EXISTS "Users can only see their own Google credentials" ON public.admin_google_credentials;

-- The table should now only have:
-- 1. Admin users can manage credentials (for admin UI)
-- 2. Service role can manage credentials (for edge functions)
-- No regular users should ever see OAuth tokens

-- Let's also ensure the service role policy is more restrictive and specific
DROP POLICY IF EXISTS "Service role can manage Google credentials" ON public.admin_google_credentials;

-- Create a more specific service role policy that only allows operations from edge functions
CREATE POLICY "Service role can manage Google credentials for edge functions" 
ON public.admin_google_credentials 
FOR ALL 
USING (
  (auth.jwt() ->> 'role'::text) = 'service_role'::text
  AND (auth.jwt() ->> 'iss'::text) = 'supabase'
);