
-- Create tables for team configuration and Google Calendar integration

-- Table to store super admin Google OAuth credentials
CREATE TABLE public.admin_google_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_email TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  domain TEXT NOT NULL, -- e.g., "yourcompany.com"
  scopes TEXT[] NOT NULL DEFAULT ARRAY['https://www.googleapis.com/auth/calendar'],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table to store team members
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL,
  client_team_id UUID REFERENCES public.client_teams(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  google_calendar_id TEXT, -- Usually same as email for Google Workspace
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table to store client teams
CREATE TABLE public.client_teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table to store calendar events/meetings
CREATE TABLE public.meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  google_event_id TEXT, -- For syncing with Google Calendar
  organizer_email TEXT NOT NULL,
  attendee_emails TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'scheduled', -- scheduled, cancelled, completed
  client_team_id UUID REFERENCES public.client_teams(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.admin_google_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (initially permissive - you can restrict later based on auth)
CREATE POLICY "Allow all operations on admin_google_credentials" ON public.admin_google_credentials FOR ALL USING (true);
CREATE POLICY "Allow all operations on team_members" ON public.team_members FOR ALL USING (true);
CREATE POLICY "Allow all operations on client_teams" ON public.client_teams FOR ALL USING (true);
CREATE POLICY "Allow all operations on meetings" ON public.meetings FOR ALL USING (true);

-- Insert some sample client teams
INSERT INTO public.client_teams (name, description) VALUES 
('Enterprise Clients', 'Large enterprise clients'),
('Startup Clients', 'Early-stage startups'),
('General Consulting', 'General consulting services');
