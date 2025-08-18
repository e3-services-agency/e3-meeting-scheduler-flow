-- Continue recreating the missing policies for other tables

-- ===== OAUTH STATES POLICIES =====
CREATE POLICY "Admin users can manage oauth states"
ON public.oauth_states
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) OR (auth.jwt() ->> 'role'::text) = 'service_role'::text
);

-- ===== TEAM MEMBER CLIENT TEAMS POLICIES =====
CREATE POLICY "Admin users can view team member client teams"
ON public.team_member_client_teams
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admin users can insert team member client teams"
ON public.team_member_client_teams
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admin users can update team member client teams"
ON public.team_member_client_teams
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

CREATE POLICY "Admin users can delete team member client teams"
ON public.team_member_client_teams
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);