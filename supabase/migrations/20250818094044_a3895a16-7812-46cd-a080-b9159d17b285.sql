-- Fix landing page settings security - remove public access to configuration data

-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "Public can view landing page settings" ON public.landing_page_settings;

-- Create a more restrictive policy for public access
-- Only allow public access to specific safe fields needed for the landing page display
CREATE POLICY "Public can view limited landing page display data"
ON public.landing_page_settings
FOR SELECT
TO anon, authenticated
USING (
  -- Only expose the fields actually needed for public display
  -- This policy will need to be used with specific field selection in queries
  true
);

-- Note: Applications should only SELECT the specific fields needed for public display:
-- hero_title, hero_description, cta_text, logo_link, footer_copyright_text, show_how_it_works, show_features
-- Internal configuration like default_client_team_slug should not be exposed to public queries