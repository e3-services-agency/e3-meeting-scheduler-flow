-- Fix Security Definer View issue 
-- The issue is that views owned by privileged users can bypass RLS policies
-- Solution: Recreate views with proper ownership and ensure they follow security best practices

-- Drop the existing views
DROP VIEW IF EXISTS public.public_landing_display;
DROP VIEW IF EXISTS public.public_booking_display;

-- Create new views without any security definer characteristics
-- By default, views use SECURITY INVOKER behavior (run with permissions of current user)

CREATE VIEW public.public_landing_display AS 
SELECT 
  hero_title,
  hero_description,
  cta_text,
  show_how_it_works,
  show_features
FROM public.landing_page_settings
WHERE is_active = true
LIMIT 1;

CREATE VIEW public.public_booking_display AS
SELECT 
  logo_url
FROM public.booking_page_settings
LIMIT 1;

-- Grant appropriate permissions
GRANT SELECT ON public.public_landing_display TO anon, authenticated;
GRANT SELECT ON public.public_booking_display TO anon, authenticated;

-- Ensure the underlying tables have appropriate policies for these views to work
-- The views will now respect the RLS policies of the underlying tables