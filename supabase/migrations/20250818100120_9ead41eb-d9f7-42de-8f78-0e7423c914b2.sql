-- Fix SECURITY DEFINER functions security issue (corrected approach)
-- Handle dependencies properly

-- First, drop all policies that depend on is_profile_admin function
DROP POLICY IF EXISTS "Admins can view all profiles (secure)" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles (secure)" ON public.profiles;

-- Now we can drop the function
DROP FUNCTION IF EXISTS public.is_profile_admin(uuid);

-- Create a secure view-based approach instead of SECURITY DEFINER function
CREATE OR REPLACE VIEW public.admin_users AS
SELECT user_id
FROM public.profiles
WHERE role = 'admin';

-- Recreate the profiles policies using the view instead of the function
CREATE POLICY "Admins can view all profiles (secure)"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR auth.uid() IN (SELECT user_id FROM public.admin_users)
);

CREATE POLICY "Admins can update all profiles (secure)"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id 
  OR auth.uid() IN (SELECT user_id FROM public.admin_users)
)
WITH CHECK (
  auth.uid() = user_id 
  OR auth.uid() IN (SELECT user_id FROM public.admin_users)
);

-- Update Google credentials policies to use the view approach
DROP POLICY IF EXISTS "Authenticated admin users can view Google credentials" ON public.admin_google_credentials;
DROP POLICY IF EXISTS "Authenticated admin users can insert Google credentials" ON public.admin_google_credentials;
DROP POLICY IF EXISTS "Authenticated admin users can update Google credentials" ON public.admin_google_credentials;
DROP POLICY IF EXISTS "Authenticated admin users can delete Google credentials" ON public.admin_google_credentials;

CREATE POLICY "Authenticated admin users can view Google credentials"
ON public.admin_google_credentials
FOR SELECT
TO authenticated
USING (auth.uid() IN (SELECT user_id FROM public.admin_users));

CREATE POLICY "Authenticated admin users can insert Google credentials"
ON public.admin_google_credentials
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admin_users));

CREATE POLICY "Authenticated admin users can update Google credentials"
ON public.admin_google_credentials
FOR UPDATE
TO authenticated
USING (auth.uid() IN (SELECT user_id FROM public.admin_users))
WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admin_users));

CREATE POLICY "Authenticated admin users can delete Google credentials"
ON public.admin_google_credentials
FOR DELETE
TO authenticated
USING (auth.uid() IN (SELECT user_id FROM public.admin_users));