-- Drop the existing view since we can't add RLS to it directly
DROP VIEW IF EXISTS public.team_members_with_roles;

-- Create a security definer function that enforces admin access
CREATE OR REPLACE FUNCTION public.get_team_members_with_roles()
RETURNS TABLE (
    id uuid,
    name text,
    email text,
    role_id uuid,
    google_calendar_id text,
    google_photo_url text,
    google_profile_data jsonb,
    is_active boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    role_name text,
    role_description text
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    -- Check if user is admin
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access denied: Admin role required';
    END IF;
    
    -- Return the joined data only if user is admin
    RETURN QUERY
    SELECT 
        tm.id,
        tm.name,
        tm.email,
        tm.role_id,
        tm.google_calendar_id,
        tm.google_photo_url,
        tm.google_profile_data,
        tm.is_active,
        tm.created_at,
        tm.updated_at,
        mr.name as role_name,
        mr.description as role_description
    FROM public.team_members tm
    JOIN public.member_roles mr ON tm.role_id = mr.id
    WHERE tm.is_active = true AND mr.is_active = true;
END;
$$;

-- Grant execute permission to authenticated users (security is handled inside the function)
GRANT EXECUTE ON FUNCTION public.get_team_members_with_roles() TO authenticated;