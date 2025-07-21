-- Create scheduling window settings table
CREATE TABLE public.scheduling_window_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  availability_type TEXT NOT NULL DEFAULT 'available_now' CHECK (availability_type IN ('available_now', 'date_range')),
  start_date DATE,
  end_date DATE,
  max_advance_days INTEGER DEFAULT 60,
  min_notice_hours INTEGER DEFAULT 5,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create booked appointment settings table
CREATE TABLE public.booked_appointment_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  buffer_time_minutes INTEGER DEFAULT 0,
  max_bookings_per_day INTEGER,
  guests_can_invite_others BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.scheduling_window_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booked_appointment_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for scheduling window settings
CREATE POLICY "Allow all operations on scheduling_window_settings" 
ON public.scheduling_window_settings 
FOR ALL 
USING (true);

-- Create policies for booked appointment settings  
CREATE POLICY "Allow all operations on booked_appointment_settings"
ON public.booked_appointment_settings
FOR ALL
USING (true);

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_scheduling_window_settings_updated_at
BEFORE UPDATE ON public.scheduling_window_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_booked_appointment_settings_updated_at
BEFORE UPDATE ON public.booked_appointment_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.scheduling_window_settings (availability_type, max_advance_days, min_notice_hours)
VALUES ('available_now', 60, 5);

INSERT INTO public.booked_appointment_settings (buffer_time_minutes, guests_can_invite_others)
VALUES (0, true);