-- CRITICAL SECURITY FIXES

-- 1. Lock down profiles table - prevent users from changing their own roles
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile (non-role fields only)" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND role = (SELECT role FROM public.profiles WHERE user_id = auth.uid()));

-- 2. Remove dangerous "allow all" policies and implement proper admin-only access

-- Remove permissive policies from sensitive tables
DROP POLICY IF EXISTS "Allow all operations on admin_google_credentials" ON public.admin_google_credentials;
DROP POLICY IF EXISTS "Allow all operations on oauth_states" ON public.oauth_states;
DROP POLICY IF EXISTS "Allow all operations on team_member_client_teams" ON public.team_member_client_teams;
DROP POLICY IF EXISTS "Allow all operations on member_roles" ON public.member_roles;
DROP POLICY IF EXISTS "Allow all operations on meetings" ON public.meetings;
DROP POLICY IF EXISTS "Allow all operations on booked_appointment_settings" ON public.booked_appointment_settings;
DROP POLICY IF EXISTS "Allow all operations on client_team_business_hours" ON public.client_team_business_hours;
DROP POLICY IF EXISTS "Allow all operations on scheduling_window_settings" ON public.scheduling_window_settings;
DROP POLICY IF EXISTS "Allow all operations on landing_page_settings" ON public.landing_page_settings;
DROP POLICY IF EXISTS "Allow all operations on booking_page_settings" ON public.booking_page_settings;
DROP POLICY IF EXISTS "Allow all operations on business_hours" ON public.business_hours;

-- Implement secure admin-only policies

-- Admin Google Credentials - Only admins can manage these
CREATE POLICY "Admin users can view admin google credentials" 
ON public.admin_google_credentials 
FOR SELECT 
USING (is_admin_user());

CREATE POLICY "Admin users can insert admin google credentials" 
ON public.admin_google_credentials 
FOR INSERT 
WITH CHECK (is_admin_user());

CREATE POLICY "Admin users can update admin google credentials" 
ON public.admin_google_credentials 
FOR UPDATE 
USING (is_admin_user())
WITH CHECK (is_admin_user());

CREATE POLICY "Admin users can delete admin google credentials" 
ON public.admin_google_credentials 
FOR DELETE 
USING (is_admin_user());

-- OAuth States - Only service role and own states
CREATE POLICY "Admin users can manage oauth states" 
ON public.oauth_states 
FOR ALL 
USING (is_admin_user() OR ((auth.jwt() ->> 'role'::text) = 'service_role'::text));

-- Team Member Client Teams - Admin only
CREATE POLICY "Admin users can view team member client teams" 
ON public.team_member_client_teams 
FOR SELECT 
USING (is_admin_user());

CREATE POLICY "Admin users can insert team member client teams" 
ON public.team_member_client_teams 
FOR INSERT 
WITH CHECK (is_admin_user());

CREATE POLICY "Admin users can update team member client teams" 
ON public.team_member_client_teams 
FOR UPDATE 
USING (is_admin_user())
WITH CHECK (is_admin_user());

CREATE POLICY "Admin users can delete team member client teams" 
ON public.team_member_client_teams 
FOR DELETE 
USING (is_admin_user());

-- Member Roles - Admin only
CREATE POLICY "Admin users can view member roles" 
ON public.member_roles 
FOR SELECT 
USING (is_admin_user());

CREATE POLICY "Admin users can insert member roles" 
ON public.member_roles 
FOR INSERT 
WITH CHECK (is_admin_user());

CREATE POLICY "Admin users can update member roles" 
ON public.member_roles 
FOR UPDATE 
USING (is_admin_user())
WITH CHECK (is_admin_user());

CREATE POLICY "Admin users can delete member roles" 
ON public.member_roles 
FOR DELETE 
USING (is_admin_user());

-- Meetings - Admin only for now (can be refined later for specific users)
CREATE POLICY "Admin users can view meetings" 
ON public.meetings 
FOR SELECT 
USING (is_admin_user());

CREATE POLICY "Admin users can insert meetings" 
ON public.meetings 
FOR INSERT 
WITH CHECK (is_admin_user());

CREATE POLICY "Admin users can update meetings" 
ON public.meetings 
FOR UPDATE 
USING (is_admin_user())
WITH CHECK (is_admin_user());

CREATE POLICY "Admin users can delete meetings" 
ON public.meetings 
FOR DELETE 
USING (is_admin_user());

-- Settings tables - Admin only
CREATE POLICY "Admin users can view booked appointment settings" 
ON public.booked_appointment_settings 
FOR SELECT 
USING (is_admin_user());

CREATE POLICY "Admin users can insert booked appointment settings" 
ON public.booked_appointment_settings 
FOR INSERT 
WITH CHECK (is_admin_user());

CREATE POLICY "Admin users can update booked appointment settings" 
ON public.booked_appointment_settings 
FOR UPDATE 
USING (is_admin_user())
WITH CHECK (is_admin_user());

CREATE POLICY "Admin users can delete booked appointment settings" 
ON public.booked_appointment_settings 
FOR DELETE 
USING (is_admin_user());

CREATE POLICY "Admin users can view client team business hours" 
ON public.client_team_business_hours 
FOR SELECT 
USING (is_admin_user());

CREATE POLICY "Admin users can insert client team business hours" 
ON public.client_team_business_hours 
FOR INSERT 
WITH CHECK (is_admin_user());

CREATE POLICY "Admin users can update client team business hours" 
ON public.client_team_business_hours 
FOR UPDATE 
USING (is_admin_user())
WITH CHECK (is_admin_user());

CREATE POLICY "Admin users can delete client team business hours" 
ON public.client_team_business_hours 
FOR DELETE 
USING (is_admin_user());

CREATE POLICY "Admin users can view scheduling window settings" 
ON public.scheduling_window_settings 
FOR SELECT 
USING (is_admin_user());

CREATE POLICY "Admin users can insert scheduling window settings" 
ON public.scheduling_window_settings 
FOR INSERT 
WITH CHECK (is_admin_user());

CREATE POLICY "Admin users can update scheduling window settings" 
ON public.scheduling_window_settings 
FOR UPDATE 
USING (is_admin_user())
WITH CHECK (is_admin_user());

CREATE POLICY "Admin users can delete scheduling window settings" 
ON public.scheduling_window_settings 
FOR DELETE 
USING (is_admin_user());

CREATE POLICY "Admin users can view landing page settings" 
ON public.landing_page_settings 
FOR SELECT 
USING (is_admin_user());

CREATE POLICY "Admin users can insert landing page settings" 
ON public.landing_page_settings 
FOR INSERT 
WITH CHECK (is_admin_user());

CREATE POLICY "Admin users can update landing page settings" 
ON public.landing_page_settings 
FOR UPDATE 
USING (is_admin_user())
WITH CHECK (is_admin_user());

CREATE POLICY "Admin users can delete landing page settings" 
ON public.landing_page_settings 
FOR DELETE 
USING (is_admin_user());

CREATE POLICY "Admin users can view booking page settings" 
ON public.booking_page_settings 
FOR SELECT 
USING (is_admin_user());

CREATE POLICY "Admin users can insert booking page settings" 
ON public.booking_page_settings 
FOR INSERT 
WITH CHECK (is_admin_user());

CREATE POLICY "Admin users can update booking page settings" 
ON public.booking_page_settings 
FOR UPDATE 
USING (is_admin_user())
WITH CHECK (is_admin_user());

CREATE POLICY "Admin users can delete booking page settings" 
ON public.booking_page_settings 
FOR DELETE 
USING (is_admin_user());

CREATE POLICY "Admin users can view business hours" 
ON public.business_hours 
FOR SELECT 
USING (is_admin_user());

CREATE POLICY "Admin users can insert business hours" 
ON public.business_hours 
FOR INSERT 
WITH CHECK (is_admin_user());

CREATE POLICY "Admin users can update business hours" 
ON public.business_hours 
FOR UPDATE 
USING (is_admin_user())
WITH CHECK (is_admin_user());

CREATE POLICY "Admin users can delete business hours" 
ON public.business_hours 
FOR DELETE 
USING (is_admin_user());

-- 3. Add public read access for landing page settings (needed for public landing page)
CREATE POLICY "Public can view landing page settings" 
ON public.landing_page_settings 
FOR SELECT 
USING (true);

-- 4. Add public read access for booking page settings (needed for booking flow)
CREATE POLICY "Public can view booking page settings" 
ON public.booking_page_settings 
FOR SELECT 
USING (true);