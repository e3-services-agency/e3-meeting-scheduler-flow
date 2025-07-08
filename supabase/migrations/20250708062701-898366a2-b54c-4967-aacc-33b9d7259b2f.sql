
-- Create the missing team_member_client_teams junction table
CREATE TABLE public.team_member_client_teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_member_id UUID REFERENCES public.team_members(id) ON DELETE CASCADE,
  client_team_id UUID REFERENCES public.client_teams(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(team_member_id, client_team_id)
);

-- Fix the team_members table to remove the single client_team_id reference
ALTER TABLE public.team_members DROP COLUMN IF EXISTS client_team_id;

-- Enable RLS on the new table
ALTER TABLE public.team_member_client_teams ENABLE ROW LEVEL SECURITY;

-- Create policy for the junction table
CREATE POLICY "Allow all operations on team_member_client_teams" ON public.team_member_client_teams FOR ALL USING (true);

-- Insert some sample team members and relationships
INSERT INTO public.team_members (id, name, email, role) VALUES 
('11111111-1111-1111-1111-111111111111', 'Alex Chen', 'alex.chen@e3.mock', 'Business Consultant'),
('22222222-2222-2222-2222-222222222222', 'Brenda Smith', 'brenda.smith@e3.mock', 'Tech Consultant'),
('33333333-3333-3333-3333-333333333333', 'Charles Davis', 'charles.davis@e3.mock', 'Client Success Manager')
ON CONFLICT (email) DO NOTHING;

-- Get client team IDs for relationships
DO $$
DECLARE
    enterprise_team_id UUID;
    startup_team_id UUID;
    general_team_id UUID;
BEGIN
    SELECT id INTO enterprise_team_id FROM public.client_teams WHERE name = 'Enterprise Clients' LIMIT 1;
    SELECT id INTO startup_team_id FROM public.client_teams WHERE name = 'Startup Clients' LIMIT 1;
    SELECT id INTO general_team_id FROM public.client_teams WHERE name = 'General Consulting' LIMIT 1;
    
    -- Create sample relationships
    INSERT INTO public.team_member_client_teams (team_member_id, client_team_id) VALUES 
    ('11111111-1111-1111-1111-111111111111', enterprise_team_id),
    ('11111111-1111-1111-1111-111111111111', general_team_id),
    ('22222222-2222-2222-2222-222222222222', startup_team_id),
    ('33333333-3333-3333-3333-333333333333', enterprise_team_id)
    ON CONFLICT DO NOTHING;
END $$;
