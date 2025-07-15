-- Create a roles table for centralized role management
CREATE TABLE public.member_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.member_roles ENABLE ROW LEVEL SECURITY;

-- Create policies for role management
CREATE POLICY "Allow all operations on member_roles" 
ON public.member_roles 
FOR ALL 
USING (true);

-- Insert default roles
INSERT INTO public.member_roles (name, description) VALUES 
('Team Member', 'Standard team member with basic permissions'),
('Team Lead', 'Team leader with additional responsibilities'),
('Manager', 'Manager with oversight of multiple teams'),
('Director', 'Director with strategic oversight'),
('Senior Manager', 'Senior management role'),
('VP', 'Vice President level role'),
('C-Level', 'Executive level role');

-- Add profile photo fields to team_members table
ALTER TABLE public.team_members 
ADD COLUMN google_photo_url TEXT,
ADD COLUMN google_profile_data JSONB;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for member_roles updated_at
CREATE TRIGGER update_member_roles_updated_at
    BEFORE UPDATE ON public.member_roles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();