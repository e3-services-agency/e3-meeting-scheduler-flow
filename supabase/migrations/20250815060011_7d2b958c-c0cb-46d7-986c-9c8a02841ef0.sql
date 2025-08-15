-- Create booking_page_settings table
CREATE TABLE IF NOT EXISTS public.booking_page_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  logo_url text NOT NULL DEFAULT 'https://e3-services.com',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.booking_page_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for booking page settings
CREATE POLICY "Allow all operations on booking_page_settings" 
ON public.booking_page_settings 
FOR ALL 
USING (true);

-- Create trigger for auto-updating timestamps
CREATE TRIGGER update_booking_page_settings_updated_at
BEFORE UPDATE ON public.booking_page_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings if none exist
INSERT INTO public.booking_page_settings (logo_url)
VALUES ('https://e3-services.com')
ON CONFLICT DO NOTHING;