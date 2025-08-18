-- Fix SECURITY DEFINER functions security issue
-- Replace problematic SECURITY DEFINER functions with safer alternatives

-- 1. Fix audit_google_credentials_access - this can remain SECURITY DEFINER as it's for audit logging
-- No change needed for audit_google_credentials_access

-- 2. Fix log_credential_access - this can remain SECURITY DEFINER as it's for audit logging  
-- No change needed for log_credential_access

-- 3. Fix rotate_google_credentials - this needs SECURITY DEFINER for credential management
-- No change needed for rotate_google_credentials

-- 4. Replace is_profile_admin with a more secure approach
DROP FUNCTION IF EXISTS public.is_profile_admin(uuid);

-- Create a view-based approach instead of SECURITY DEFINER function
CREATE OR REPLACE VIEW public.admin_users AS
SELECT user_id
FROM public.profiles
WHERE role = 'admin';

-- 5. Update RLS policies to use the view instead of the function
-- Update profiles policies
DROP POLICY IF EXISTS "Admins can view all profiles (secure)" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles (secure)" ON public.profiles;

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

-- 6. Update Google credentials policies to use the view
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