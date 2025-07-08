
-- Drop the existing foreign key constraint from team_members
ALTER TABLE public.team_members DROP COLUMN IF EXISTS client_team_id;

-- Create a junction table for many-to-many relationship between team members and client teams
CREATE TABLE public.team_member_client_teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_member_id UUID REFERENCES public.team_members(id) ON DELETE CASCADE NOT NULL,
  client_team_id UUID REFERENCES public.client_teams(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- Ensure a team member can't be added to the same client team twice
  UNIQUE(team_member_id, client_team_id)
);

-- Enable RLS on the junction table
ALTER TABLE public.team_member_client_teams ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for the junction table
CREATE POLICY "Allow all operations on team_member_client_teams" ON public.team_member_client_teams FOR ALL USING (true);
