-- Fix Security Definer View warnings by removing problematic views
-- Handle dependencies properly by dropping policies first

-- Drop all policies that depend on the admin_users view
DROP POLICY IF EXISTS "Admins can view all profiles (secure)" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles (secure)" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated admin users can view Google credentials" ON public.admin_google_credentials;
DROP POLICY IF EXISTS "Authenticated admin users can insert Google credentials" ON public.admin_google_credentials;
DROP POLICY IF EXISTS "Authenticated admin users can update Google credentials" ON public.admin_google_credentials;
DROP POLICY IF EXISTS "Authenticated admin users can delete Google credentials" ON public.admin_google_credentials;

-- Now drop the views that might be causing the Security Definer warnings
DROP VIEW IF EXISTS public.secure_google_credentials;
DROP VIEW IF EXISTS public.admin_users;

-- Recreate policies using direct checks instead of views
-- This completely eliminates any potential security definer view concerns

-- Profiles policies with direct admin checks
CREATE POLICY "Users can view own profile or admins can view all"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.profiles admin_check 
    WHERE admin_check.user_id = auth.uid() AND admin_check.role = 'admin'
  )
);

CREATE POLICY "Users can update own profile or admins can update all"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.profiles admin_check 
    WHERE admin_check.user_id = auth.uid() AND admin_check.role = 'admin'
  )
)
WITH CHECK (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.profiles admin_check 
    WHERE admin_check.user_id = auth.uid() AND admin_check.role = 'admin'
  )
);

-- Google credentials policies with direct admin checks
CREATE POLICY "Admin users can view Google credentials"
ON public.admin_google_credentials
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admin users can insert Google credentials"
ON public.admin_google_credentials
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admin users can update Google credentials"
ON public.admin_google_credentials
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

CREATE POLICY "Admin users can delete Google credentials"
ON public.admin_google_credentials
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);