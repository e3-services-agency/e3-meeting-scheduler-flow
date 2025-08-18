-- Fix Security Definer View issue 
-- The issue is that views created by privileged users (like postgres) 
-- can bypass RLS when accessed by less privileged users

-- Drop and recreate the public views with safer approach
DROP VIEW IF EXISTS public.public_landing_display;
DROP VIEW IF EXISTS public.public_booking_display;

-- Create regular views (not security definer) with explicit security context
-- These views will respect the RLS policies of the underlying tables

CREATE VIEW public.public_landing_display 
SECURITY INVOKER  -- Explicitly use security invoker (not definer)
AS 
SELECT 
  hero_title,
  hero_description,
  cta_text,
  show_how_it_works,
  show_features
FROM public.landing_page_settings
WHERE is_active = true
LIMIT 1;

CREATE VIEW public.public_booking_display 
SECURITY INVOKER  -- Explicitly use security invoker (not definer)
AS
SELECT 
  logo_url
FROM public.booking_page_settings
LIMIT 1;

-- Ensure the views are accessible to anonymous users
GRANT SELECT ON public.public_landing_display TO anon;
GRANT SELECT ON public.public_booking_display TO anon;

-- Ensure the views are accessible to authenticated users
GRANT SELECT ON public.public_landing_display TO authenticated;
GRANT SELECT ON public.public_booking_display TO authenticated;