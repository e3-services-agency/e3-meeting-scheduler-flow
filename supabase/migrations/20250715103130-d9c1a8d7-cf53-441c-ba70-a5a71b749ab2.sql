-- Create business hours tables for global and client-specific settings

-- Global business hours (default for all clients)
CREATE TABLE public.business_hours (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Default Business Hours',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  monday_start TIME,
  monday_end TIME,
  tuesday_start TIME,
  tuesday_end TIME,
  wednesday_start TIME,
  wednesday_end TIME,
  thursday_start TIME,
  thursday_end TIME,
  friday_start TIME,
  friday_end TIME,
  saturday_start TIME,
  saturday_end TIME,
  sunday_start TIME,
  sunday_end TIME,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Client-specific business hours overrides
CREATE TABLE public.client_team_business_hours (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_team_id UUID NOT NULL REFERENCES public.client_teams(id) ON DELETE CASCADE,
  timezone TEXT NOT NULL,
  monday_start TIME,
  monday_end TIME,
  tuesday_start TIME,
  tuesday_end TIME,
  wednesday_start TIME,
  wednesday_end TIME,
  thursday_start TIME,
  thursday_end TIME,
  friday_start TIME,
  friday_end TIME,
  saturday_start TIME,
  saturday_end TIME,
  sunday_start TIME,
  sunday_end TIME,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_team_id)
);

-- Enable RLS
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_team_business_hours ENABLE ROW LEVEL SECURITY;

-- RLS Policies for business_hours
CREATE POLICY "Allow all operations on business_hours" 
ON public.business_hours 
FOR ALL 
USING (true);

-- RLS Policies for client_team_business_hours
CREATE POLICY "Allow all operations on client_team_business_hours" 
ON public.client_team_business_hours 
FOR ALL 
USING (true);

-- Add update triggers
CREATE TRIGGER update_business_hours_updated_at
BEFORE UPDATE ON public.business_hours
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_team_business_hours_updated_at
BEFORE UPDATE ON public.client_team_business_hours
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default business hours (9 AM - 6 PM, Monday to Friday)
INSERT INTO public.business_hours (
  name, 
  timezone,
  monday_start, monday_end,
  tuesday_start, tuesday_end,
  wednesday_start, wednesday_end,
  thursday_start, thursday_end,
  friday_start, friday_end
) VALUES (
  'Default Business Hours',
  'UTC',
  '09:00:00', '18:00:00',
  '09:00:00', '18:00:00',
  '09:00:00', '18:00:00',
  '09:00:00', '18:00:00',
  '09:00:00', '18:00:00'
);