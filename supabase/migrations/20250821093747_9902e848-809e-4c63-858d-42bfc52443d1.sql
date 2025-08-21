-- Enable RLS on the team_members_with_roles view
ALTER TABLE public.team_members_with_roles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for the view that match the underlying team_members table security
CREATE POLICY "Admin users can view team members with roles" 
ON public.team_members_with_roles
FOR SELECT 
USING (EXISTS ( 
  SELECT 1
  FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = 'admin'::text))
));

-- Also add policies for any potential future operations
CREATE POLICY "Admin users can insert team members with roles" 
ON public.team_members_with_roles
FOR INSERT 
WITH CHECK (EXISTS ( 
  SELECT 1
  FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = 'admin'::text))
));

CREATE POLICY "Admin users can update team members with roles" 
ON public.team_members_with_roles
FOR UPDATE 
USING (EXISTS ( 
  SELECT 1
  FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = 'admin'::text))
))
WITH CHECK (EXISTS ( 
  SELECT 1
  FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = 'admin'::text))
));

CREATE POLICY "Admin users can delete team members with roles" 
ON public.team_members_with_roles
FOR DELETE 
USING (EXISTS ( 
  SELECT 1
  FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = 'admin'::text))
));