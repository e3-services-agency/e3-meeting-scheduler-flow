-- Fix function search path security warnings
ALTER FUNCTION public.update_credential_last_used() SET search_path = 'public';
ALTER FUNCTION public.encrypt_token(TEXT) SET search_path = 'public';