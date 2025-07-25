-- Create landing page settings table
CREATE TABLE public.landing_page_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  default_client_team_slug TEXT,
  cta_text TEXT NOT NULL DEFAULT 'Start Booking',
  hero_title TEXT NOT NULL DEFAULT 'The smart way to bring the right people to the table',
  hero_description TEXT NOT NULL DEFAULT 'Streamline your meeting scheduling with our intelligent booking system. Connect with E3 team members and manage your appointments effortlessly.',
  show_how_it_works BOOLEAN NOT NULL DEFAULT true,
  show_features BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.landing_page_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access
CREATE POLICY "Allow all operations on landing_page_settings" 
ON public.landing_page_settings 
FOR ALL 
USING (true);

-- Insert default settings
INSERT INTO public.landing_page_settings (
  default_client_team_slug,
  cta_text,
  hero_title,
  hero_description
) VALUES (
  'atr',
  'Start Booking',
  'The smart way to bring the right people to the table',
  'Connect with E3 team members and schedule meetings effortlessly.'
);

-- Add trigger for updated_at
CREATE TRIGGER update_landing_page_settings_updated_at
BEFORE UPDATE ON public.landing_page_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();