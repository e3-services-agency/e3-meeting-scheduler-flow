-- Fix infinite recursion in profiles table RLS policies
-- The issue is policies that reference the profiles table within themselves

-- Drop the problematic policies that cause recursion
DROP POLICY IF EXISTS "Users can update own profile or admins can update all" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile or admins can view all" ON public.profiles;

-- Create simpler, non-recursive policies
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create separate admin policies that use the is_admin_user() function
-- which doesn't cause recursion
CREATE POLICY "Admin users can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (is_admin_user());

CREATE POLICY "Admin users can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (is_admin_user())
WITH CHECK (is_admin_user());