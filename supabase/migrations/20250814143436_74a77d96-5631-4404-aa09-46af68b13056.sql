-- Add logo_link to landing_page_settings
ALTER TABLE landing_page_settings 
ADD COLUMN IF NOT EXISTS logo_link text DEFAULT 'https://e3-services.com';

-- Add footer_copyright_text to landing_page_settings
ALTER TABLE landing_page_settings 
ADD COLUMN IF NOT EXISTS footer_copyright_text text DEFAULT '© 2025 E3 Services. All rights reserved.';

-- Add booking_slug to client_teams
ALTER TABLE client_teams 
ADD COLUMN IF NOT EXISTS booking_slug text;

-- Update existing client_teams to have their booking slugs
UPDATE client_teams 
SET booking_slug = lower(replace(name, ' ', '-'))
WHERE booking_slug IS NULL;

-- Add member_roles if not exists
CREATE TABLE IF NOT EXISTS member_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on member_roles
ALTER TABLE member_roles ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for member_roles
CREATE POLICY IF NOT EXISTS "Allow all operations on member_roles" 
ON member_roles 
FOR ALL 
USING (true);

-- Insert default roles if they don't exist
INSERT INTO member_roles (name, description) 
VALUES 
  ('Developer', 'Software development and technical tasks'),
  ('Designer', 'UI/UX design and creative work'),
  ('Manager', 'Project management and coordination'),
  ('Consultant', 'Business consulting and advisory'),
  ('Sales', 'Sales and business development')
ON CONFLICT DO NOTHING;

-- Add time_format to business_hours and client_team_business_hours
ALTER TABLE business_hours 
ADD COLUMN IF NOT EXISTS time_format text DEFAULT '24h' CHECK (time_format IN ('12h', '24h'));

ALTER TABLE client_team_business_hours 
ADD COLUMN IF NOT EXISTS time_format text DEFAULT '24h' CHECK (time_format IN ('12h', '24h'));

-- Create trigger for updated_at on member_roles
CREATE TRIGGER IF NOT EXISTS update_member_roles_updated_at
BEFORE UPDATE ON member_roles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();