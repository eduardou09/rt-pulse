-- Add telefone column to candidatos table
ALTER TABLE candidatos 
ADD COLUMN telefone text;

COMMENT ON COLUMN candidatos.telefone IS 'Número de telefone do candidato';