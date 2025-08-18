-- Fix meetings table security - restrict access to meeting participants only

-- Create security definer function to check if user can access a meeting
CREATE OR REPLACE FUNCTION public.can_access_meeting(meeting_id uuid, user_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if user is organizer or attendee of the meeting
  RETURN EXISTS (
    SELECT 1 FROM public.meetings m
    WHERE m.id = meeting_id
    AND (
      m.organizer_email = user_email 
      OR user_email = ANY(m.attendee_emails)
    )
  );
END;
$$;

-- Drop existing overly broad policies
DROP POLICY IF EXISTS "Admin users can view meetings" ON public.meetings;
DROP POLICY IF EXISTS "Admin users can insert meetings" ON public.meetings;
DROP POLICY IF EXISTS "Admin users can update meetings" ON public.meetings;
DROP POLICY IF EXISTS "Admin users can delete meetings" ON public.meetings;

-- Create new restrictive policies for meetings
CREATE POLICY "Users can view meetings they participate in"
ON public.meetings
FOR SELECT
TO authenticated
USING (
  -- Admin users can see all meetings
  is_admin_user() 
  OR 
  -- Regular users can only see meetings where they are organizer or attendee
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND (
      organizer_email = p.email
      OR p.email = ANY(attendee_emails)
    )
  )
);

CREATE POLICY "Authenticated users can insert meetings"
ON public.meetings
FOR INSERT
TO authenticated
WITH CHECK (
  -- Admin users can insert any meeting
  is_admin_user()
  OR
  -- Regular users can only insert meetings where they are the organizer
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.email = organizer_email
  )
);

CREATE POLICY "Users can update meetings they organize or admins"
ON public.meetings
FOR UPDATE
TO authenticated
USING (
  -- Admin users can update all meetings
  is_admin_user()
  OR
  -- Regular users can only update meetings they organize
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.email = organizer_email
  )
)
WITH CHECK (
  -- Admin users can update all meetings
  is_admin_user()
  OR
  -- Regular users can only update meetings they organize
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.email = organizer_email
  )
);

CREATE POLICY "Users can delete meetings they organize or admins"
ON public.meetings
FOR DELETE
TO authenticated
USING (
  -- Admin users can delete all meetings
  is_admin_user()
  OR
  -- Regular users can only delete meetings they organize
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.email = organizer_email
  )
);