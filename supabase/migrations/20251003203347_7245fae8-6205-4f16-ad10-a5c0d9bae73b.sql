-- Create vagas table
CREATE TABLE public.vagas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'inativa' CHECK (status IN ('ativa', 'inativa')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create candidatos table
CREATE TABLE public.candidatos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'não qualificado' CHECK (status IN ('qualificado', 'não qualificado')),
  vaga_id UUID REFERENCES public.vagas(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.vagas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidatos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vagas (authenticated users can view and modify)
CREATE POLICY "Authenticated users can view vagas"
  ON public.vagas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert vagas"
  ON public.vagas FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update vagas"
  ON public.vagas FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete vagas"
  ON public.vagas FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for candidatos (authenticated users can view only)
CREATE POLICY "Authenticated users can view candidatos"
  ON public.candidatos FOR SELECT
  TO authenticated
  USING (true);

-- Function to ensure only one active vaga
CREATE OR REPLACE FUNCTION public.validate_single_active_vaga()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'ativa' THEN
    UPDATE public.vagas
    SET status = 'inativa'
    WHERE id != NEW.id AND status = 'ativa';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to enforce single active vaga
CREATE TRIGGER enforce_single_active_vaga
  BEFORE INSERT OR UPDATE ON public.vagas
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_single_active_vaga();