-- First, let's create a proper foreign key relationship between team_members and member_roles
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
);

-- Make role_id NOT NULL after data migration
ALTER TABLE public.team_members 
ALTER COLUMN role_id SET NOT NULL;

-- Create index for better performance
CREATE INDEX idx_team_members_role_id ON public.team_members(role_id);

-- Create a view that joins team members with their role information
CREATE OR REPLACE VIEW public.team_members_with_roles AS
SELECT 
    tm.*,
    mr.name as role_name,
    mr.description as role_description
FROM public.team_members tm
JOIN public.member_roles mr ON tm.role_id = mr.id
WHERE tm.is_active = true AND mr.is_active = true;

-- Create a trigger function to update team members when role names change
CREATE OR REPLACE FUNCTION public.handle_role_name_update()
RETURNS TRIGGER AS $$
BEGIN
    -- When a role name is updated, we don't need to do anything special
    -- because we're using foreign keys now, the relationship is maintained
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for role updates
CREATE TRIGGER on_member_role_updated
    AFTER UPDATE ON public.member_roles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_role_name_update();