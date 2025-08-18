-- Remove views that might be causing Security Definer View warnings
-- Replace them with direct policy checks to eliminate any potential security concerns

-- Drop the views that might be triggering the linter warnings
DROP VIEW IF EXISTS public.secure_google_credentials;
DROP VIEW IF EXISTS public.admin_users;

-- Update all policies to use direct checks instead of views
-- This eliminates any potential security definer view concerns

-- Update profiles policies to use direct admin check
DROP POLICY IF EXISTS "Admins can view all profiles (secure)" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles (secure)" ON public.profiles;

CREATE POLICY "Admins can view all profiles (direct check)"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.profiles p2 
    WHERE p2.user_id = auth.uid() AND p2.role = 'admin'
  )
);

CREATE POLICY "Admins can update all profiles (direct check)"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.profiles p2 
    WHERE p2.user_id = auth.uid() AND p2.role = 'admin'
  )
)
WITH CHECK (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.profiles p2 
    WHERE p2.user_id = auth.uid() AND p2.role = 'admin'
  )
);

-- Update Google credentials policies to use direct admin check
DROP POLICY IF EXISTS "Authenticated admin users can view Google credentials" ON public.admin_google_credentials;
DROP POLICY IF EXISTS "Authenticated admin users can insert Google credentials" ON public.admin_google_credentials;
DROP POLICY IF EXISTS "Authenticated admin users can update Google credentials" ON public.admin_google_credentials;
DROP POLICY IF EXISTS "Authenticated admin users can delete Google credentials" ON public.admin_google_credentials;

CREATE POLICY "Admin users can view Google credentials (direct check)"
ON public.admin_google_credentials
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admin users can insert Google credentials (direct check)"
ON public.admin_google_credentials
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admin users can update Google credentials (direct check)"
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

CREATE POLICY "Admin users can delete Google credentials (direct check)"
ON public.admin_google_credentials
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);