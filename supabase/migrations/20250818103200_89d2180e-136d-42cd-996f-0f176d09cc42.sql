-- Address the Security Definer View warnings comprehensively
-- The linter is detecting SECURITY DEFINER views/functions that could bypass RLS

-- 1. The vault.decrypted_secrets view is a system view we cannot modify
-- 2. We need to ensure our public functions that use SECURITY DEFINER are truly necessary

-- Let's minimize SECURITY DEFINER usage by removing it from functions where possible
-- and restructuring our security model

-- First, let's see if we can eliminate the is_admin_user SECURITY DEFINER function
-- by replacing all its usage with direct database queries

-- Drop the is_admin_user function since it's flagged as a security risk
DROP FUNCTION IF EXISTS public.is_admin_user();

-- Find and update any remaining policies that might reference is_admin_user
-- Update all admin-related policies to use direct checks instead

-- Landing page settings policies
DROP POLICY IF EXISTS "Admin users can delete landing page settings" ON public.landing_page_settings;
DROP POLICY IF EXISTS "Admin users can insert landing page settings" ON public.landing_page_settings;
DROP POLICY IF EXISTS "Admin users can update landing page settings" ON public.landing_page_settings;
DROP POLICY IF EXISTS "Admin users can view landing page settings" ON public.landing_page_settings;

CREATE POLICY "Admin users can view landing page settings"
ON public.landing_page_settings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admin users can insert landing page settings"
ON public.landing_page_settings
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admin users can update landing page settings"
ON public.landing_page_settings
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admin users can delete landing page settings"
ON public.landing_page_settings
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);