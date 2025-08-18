-- Add RLS policies for meetings table to allow users to book meetings

-- Allow authenticated users to insert meetings
CREATE POLICY "Users can insert meetings"
ON public.meetings
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to view meetings they participate in (organizer or attendee)
CREATE POLICY "Users can view meetings they participate in"
ON public.meetings
FOR SELECT
TO authenticated
USING (
  organizer_email = (auth.jwt() ->> 'email'::text) 
  OR (auth.jwt() ->> 'email'::text) = ANY(attendee_emails)
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Allow users to update meetings they organize or admins can update any
CREATE POLICY "Users can update meetings they organize or admins"
ON public.meetings
FOR UPDATE
TO authenticated
USING (
  organizer_email = (auth.jwt() ->> 'email'::text)
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  organizer_email = (auth.jwt() ->> 'email'::text)
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Allow users to delete meetings they organize or admins can delete any
CREATE POLICY "Users can delete meetings they organize or admins"
ON public.meetings
FOR DELETE
TO authenticated
USING (
  organizer_email = (auth.jwt() ->> 'email'::text)
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);