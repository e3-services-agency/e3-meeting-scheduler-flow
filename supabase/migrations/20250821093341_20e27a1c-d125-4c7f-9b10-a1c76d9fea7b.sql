-- First, create any missing roles in member_roles table
INSERT INTO public.member_roles (name, description, is_active)
SELECT DISTINCT tm.role, 'Auto-created role', true
FROM public.team_members tm
WHERE tm.role IS NOT NULL 
AND NOT EXISTS (
    SELECT 1 FROM public.member_roles mr 
    WHERE mr.name = tm.role AND mr.is_active = true
)
ON CONFLICT (name) DO NOTHING;

-- Add a role_id column to team_members table
ALTER TABLE public.team_members 
ADD COLUMN role_id uuid REFERENCES public.member_roles(id);

-- Update existing team members to link to their corresponding roles
UPDATE public.team_members 
SET role_id = (
    SELECT mr.id 
    FROM public.member_roles mr 
    WHERE mr.name = team_members.role 
    AND mr.is_active = true
    LIMIT 1
)
WHERE role IS NOT NULL;

-- Make role_id NOT NULL after data migration
ALTER TABLE public.team_members 
ALTER COLUMN role_id SET NOT NULL;

-- Create index for better performance
CREATE INDEX idx_team_members_role_id ON public.team_members(role_id);

-- Create a view that joins team members with their role information
CREATE OR REPLACE VIEW public.team_members_with_roles AS
SELECT 
    tm.id,
    tm.name,
    tm.email,
    tm.role_id,
    tm.google_calendar_id,
    tm.google_photo_url,
    tm.google_profile_data,
    tm.is_active,
    tm.created_at,
    tm.updated_at,
    mr.name as role_name,
    mr.description as role_description
FROM public.team_members tm
JOIN public.member_roles mr ON tm.role_id = mr.id
WHERE tm.is_active = true AND mr.is_active = true;