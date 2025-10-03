-- Add perguntas column to vagas table
ALTER TABLE public.vagas
ADD COLUMN perguntas jsonb DEFAULT NULL;