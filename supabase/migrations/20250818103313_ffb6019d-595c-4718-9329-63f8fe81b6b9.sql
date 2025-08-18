-- Continue dropping the remaining policies that depend on is_admin_user

-- Scheduling window settings policies
DROP POLICY IF EXISTS "Admin users can view scheduling window settings" ON public.scheduling_window_settings;
DROP POLICY IF EXISTS "Admin users can insert scheduling window settings" ON public.scheduling_window_settings;
DROP POLICY IF EXISTS "Admin users can update scheduling window settings" ON public.scheduling_window_settings;
DROP POLICY IF EXISTS "Admin users can delete scheduling window settings" ON public.scheduling_window_settings;

-- Landing page settings policies
DROP POLICY IF EXISTS "Admin users can view landing page settings" ON public.landing_page_settings;
DROP POLICY IF EXISTS "Admin users can insert landing page settings" ON public.landing_page_settings;
DROP POLICY IF EXISTS "Admin users can update landing page settings" ON public.landing_page_settings;
DROP POLICY IF EXISTS "Admin users can delete landing page settings" ON public.landing_page_settings;

-- Booking page settings policies
DROP POLICY IF EXISTS "Admin users can view booking page settings" ON public.booking_page_settings;
DROP POLICY IF EXISTS "Admin users can insert booking page settings" ON public.booking_page_settings;
DROP POLICY IF EXISTS "Admin users can update booking page settings" ON public.booking_page_settings;
DROP POLICY IF EXISTS "Admin users can delete booking page settings" ON public.booking_page_settings;

-- Business hours policies
DROP POLICY IF EXISTS "Admin users can view business hours" ON public.business_hours;
DROP POLICY IF EXISTS "Admin users can insert business hours" ON public.business_hours;
DROP POLICY IF EXISTS "Admin users can update business hours" ON public.business_hours;
DROP POLICY IF EXISTS "Admin users can delete business hours" ON public.business_hours;

-- Google credentials audit log policies
DROP POLICY IF EXISTS "Admin users can view audit logs" ON public.google_credentials_audit_log;

-- Meeting policies that use is_admin_user
DROP POLICY IF EXISTS "Users can view meetings they participate in" ON public.meetings;
DROP POLICY IF EXISTS "Users can update meetings they organize or admins" ON public.meetings;
DROP POLICY IF EXISTS "Users can delete meetings they organize or admins" ON public.meetings;
DROP POLICY IF EXISTS "Users can insert meetings" ON public.meetings;

-- Profile policies
DROP POLICY IF EXISTS "Admin users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin users can update all profiles" ON public.profiles;