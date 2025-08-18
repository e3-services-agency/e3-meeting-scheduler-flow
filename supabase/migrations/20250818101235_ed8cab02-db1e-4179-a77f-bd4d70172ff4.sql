-- Fix business configuration data exposure warnings
-- Remove public access to sensitive configuration data

-- 1. Fix Landing Page Configuration Exposure
-- Drop the overly permissive public policy on landing_page_settings
DROP POLICY IF EXISTS "Public can view limited landing page display data" ON public.landing_page_settings;

-- Create a more restrictive policy that only allows admins and authenticated users
CREATE POLICY "Authenticated users can view landing page settings"
ON public.landing_page_settings
FOR SELECT
TO authenticated
USING (true);

-- Create a public-safe view for landing page display data only
CREATE OR REPLACE VIEW public.public_landing_display AS
SELECT 
  hero_title,
  hero_description,
  cta_text,
  show_how_it_works,
  show_features
FROM public.landing_page_settings
WHERE is_active = true
LIMIT 1;

-- 2. Fix Booking Configuration Exposure  
-- Drop the overly permissive public policy on booking_page_settings
DROP POLICY IF EXISTS "Public can view booking page settings" ON public.booking_page_settings;

-- Create a more restrictive policy for booking page settings
CREATE POLICY "Authenticated users can view booking page settings"
ON public.booking_page_settings
FOR SELECT
TO authenticated
USING (true);

-- Create a public-safe view for booking page display data only
CREATE OR REPLACE VIEW public.public_booking_display AS
SELECT 
  logo_url
FROM public.booking_page_settings
LIMIT 1;

-- Grant public access to the safe views only
GRANT SELECT ON public.public_landing_display TO anon;
GRANT SELECT ON public.public_booking_display TO anon;