-- Adicionar coluna minimo_acertos na tabela vagas
ALTER TABLE vagas 
ADD COLUMN minimo_acertos integer NOT NULL DEFAULT 1;

COMMENT ON COLUMN vagas.minimo_acertos IS 
'Número mínimo de perguntas que o candidato precisa acertar para ser aprovado';