-- Fix critical security vulnerability: team_members table is publicly readable
-- Remove the insecure policy that allows all operations with 'true'
DROP POLICY IF EXISTS "Allow all operations on team_members" ON public.team_members;

-- Create a security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create secure RLS policies for team_members table
-- Only authenticated admin users can perform CRUD operations
CREATE POLICY "Admin users can view team members" 
ON public.team_members 
FOR SELECT 
TO authenticated
USING (public.is_admin_user());

CREATE POLICY "Admin users can insert team members" 
ON public.team_members 
FOR INSERT 
TO authenticated
WITH CHECK (public.is_admin_user());

CREATE POLICY "Admin users can update team members" 
ON public.team_members 
FOR UPDATE 
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

CREATE POLICY "Admin users can delete team members" 
ON public.team_members 
FOR DELETE 
TO authenticated
USING (public.is_admin_user());

-- Also secure client_teams table with similar policies
DROP POLICY IF EXISTS "Allow all operations on client_teams" ON public.client_teams;

CREATE POLICY "Admin users can view client teams" 
ON public.client_teams 
FOR SELECT 
TO authenticated
USING (public.is_admin_user());

CREATE POLICY "Admin users can insert client teams" 
ON public.client_teams 
FOR INSERT 
TO authenticated
WITH CHECK (public.is_admin_user());

CREATE POLICY "Admin users can update client teams" 
ON public.client_teams 
FOR UPDATE 
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

CREATE POLICY "Admin users can delete client teams" 
ON public.client_teams 
FOR DELETE 
TO authenticated
USING (public.is_admin_user());