-- Update Ján Pan and Marcel Madarasz roles to Co-Founder
UPDATE public.team_members 
SET role = 'Co-Founder', updated_at = now()
WHERE email IN ('jan.pan@e3-services.com', 'marcel.madarasz@e3-services.com');