-- Fix security definer view issue identified by linter

-- Drop the problematic security definer view
DROP VIEW IF EXISTS public.secure_google_credentials;

-- Create a regular view (not security definer) that only exposes encrypted credentials
-- The view will still be protected by RLS policies on the underlying table
CREATE VIEW public.secure_google_credentials AS
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
FROM public.admin_google_credentials;