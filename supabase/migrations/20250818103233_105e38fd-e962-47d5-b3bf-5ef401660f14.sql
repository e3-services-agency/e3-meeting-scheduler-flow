-- Comprehensive fix for Security Definer View warnings
-- We need to replace all SECURITY DEFINER usage with direct admin checks

-- Step 1: Drop all policies that depend on is_admin_user function
-- (This is required before we can drop the function)

-- Team members policies
DROP POLICY IF EXISTS "Admin users can view team members" ON public.team_members;
DROP POLICY IF EXISTS "Admin users can insert team members" ON public.team_members;
DROP POLICY IF EXISTS "Admin users can update team members" ON public.team_members;
DROP POLICY IF EXISTS "Admin users can delete team members" ON public.team_members;

-- OAuth states policies
DROP POLICY IF EXISTS "Admin users can manage oauth states" ON public.oauth_states;

-- Team member client teams policies
DROP POLICY IF EXISTS "Admin users can view team member client teams" ON public.team_member_client_teams;
DROP POLICY IF EXISTS "Admin users can insert team member client teams" ON public.team_member_client_teams;
DROP POLICY IF EXISTS "Admin users can update team member client teams" ON public.team_member_client_teams;
DROP POLICY IF EXISTS "Admin users can delete team member client teams" ON public.team_member_client_teams;

-- Member roles policies
DROP POLICY IF EXISTS "Admin users can view member roles" ON public.member_roles;
DROP POLICY IF EXISTS "Admin users can insert member roles" ON public.member_roles;
DROP POLICY IF EXISTS "Admin users can update member roles" ON public.member_roles;
DROP POLICY IF EXISTS "Admin users can delete member roles" ON public.member_roles;

-- Booked appointment settings policies
DROP POLICY IF EXISTS "Admin users can view booked appointment settings" ON public.booked_appointment_settings;
DROP POLICY IF EXISTS "Admin users can insert booked appointment settings" ON public.booked_appointment_settings;
DROP POLICY IF EXISTS "Admin users can update booked appointment settings" ON public.booked_appointment_settings;
DROP POLICY IF EXISTS "Admin users can delete booked appointment settings" ON public.booked_appointment_settings;

-- Client team business hours policies
DROP POLICY IF EXISTS "Admin users can view client team business hours" ON public.client_team_business_hours;
DROP POLICY IF EXISTS "Admin users can insert client team business hours" ON public.client_team_business_hours;
DROP POLICY IF EXISTS "Admin users can update client team business hours" ON public.client_team_business_hours;
DROP POLICY IF EXISTS "Admin users can delete client team business hours" ON public.client_team_business_hours;