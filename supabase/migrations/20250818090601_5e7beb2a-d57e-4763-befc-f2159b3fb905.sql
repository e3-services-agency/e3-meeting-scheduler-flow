-- Fix function search path security warnings
-- Update existing functions to have secure search_path

-- Fix the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- Fix the is_admin_user function 
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER 
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$;