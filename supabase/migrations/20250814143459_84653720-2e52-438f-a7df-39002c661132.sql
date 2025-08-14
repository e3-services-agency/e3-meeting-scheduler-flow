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

-- Add time_format to business_hours and client_team_business_hours
ALTER TABLE business_hours 
ADD COLUMN IF NOT EXISTS time_format text DEFAULT '24h' CHECK (time_format IN ('12h', '24h'));

ALTER TABLE client_team_business_hours 
ADD COLUMN IF NOT EXISTS time_format text DEFAULT '24h' CHECK (time_format IN ('12h', '24h'));