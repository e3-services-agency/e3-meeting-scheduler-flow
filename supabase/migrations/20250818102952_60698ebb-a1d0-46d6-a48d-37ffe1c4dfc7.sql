-- Address remaining SECURITY DEFINER warnings by minimizing their usage
-- The linter is concerned about SECURITY DEFINER functions being used in RLS policies
-- Let's restructure to reduce this security risk

-- Instead of using is_admin_user() SECURITY DEFINER function in policies,
-- we'll create a different approach that doesn't require SECURITY DEFINER

-- First, let's see which policies use is_admin_user and replace them
-- with direct checks that don't require SECURITY DEFINER

-- Get a list of current policies that use is_admin_user
-- We'll need to recreate them without the SECURITY DEFINER dependency

-- Drop policies that use is_admin_user SECURITY DEFINER function
DROP POLICY IF EXISTS "Admin users can view client teams" ON public.client_teams;
DROP POLICY IF EXISTS "Admin users can insert client teams" ON public.client_teams;
DROP POLICY IF EXISTS "Admin users can update client teams" ON public.client_teams;
DROP POLICY IF EXISTS "Admin users can delete client teams" ON public.client_teams;

-- Recreate these policies with direct admin checks (no SECURITY DEFINER function)
CREATE POLICY "Admin users can view client teams" 
ON public.client_teams 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admin users can insert client teams" 
ON public.client_teams 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admin users can update client teams" 
ON public.client_teams 
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

CREATE POLICY "Admin users can delete client teams" 
ON public.client_teams 
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);