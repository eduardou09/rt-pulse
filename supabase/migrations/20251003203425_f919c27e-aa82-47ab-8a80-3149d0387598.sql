-- Fix function search path security issue
CREATE OR REPLACE FUNCTION public.validate_single_active_vaga()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'ativa' THEN
    UPDATE public.vagas
    SET status = 'inativa'
    WHERE id != NEW.id AND status = 'ativa';
  END IF;
  RETURN NEW;
END;
$$;