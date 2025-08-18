-- Fix meeting booking issue for guest users
-- The current INSERT policy prevents guests from booking meetings

-- Drop the current restrictive INSERT policy
DROP POLICY IF EXISTS "Authenticated users can insert meetings" ON public.meetings;

-- Create a new policy that allows both authenticated users and guest bookings
CREATE POLICY "Users can insert meetings"
ON public.meetings
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow admins to create any meeting
  is_admin_user() 
  OR 
  -- Allow team members to create meetings where they are the organizer
  (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.email = meetings.organizer_email
  ))
  OR
  -- Allow any authenticated user to create meetings as a guest booking
  -- (this covers the case where guests book meetings with team members)
  (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.email = meetings.organizer_email AND tm.is_active = true
    )
  )
);