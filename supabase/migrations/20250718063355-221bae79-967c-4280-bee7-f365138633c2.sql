-- Add Google Meet link column to meetings table
ALTER TABLE public.meetings 
ADD COLUMN google_meet_link text;