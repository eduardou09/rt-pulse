-- Adicionar novos campos à tabela candidatos
ALTER TABLE candidatos
ADD COLUMN IF NOT EXISTS vaga_titulo TEXT,
ADD COLUMN IF NOT EXISTS resumo_experiencia TEXT,
ADD COLUMN IF NOT EXISTS interesse_remoto TEXT,
ADD COLUMN IF NOT EXISTS feedback_final TEXT,
ADD COLUMN IF NOT EXISTS fit_cultural JSONB,
ADD COLUMN IF NOT EXISTS respostas_personalizadas JSONB,
ADD COLUMN IF NOT EXISTS dados_completos JSONB;

-- Atualizar status default para 'qualificado'
ALTER TABLE candidatos 
ALTER COLUMN status SET DEFAULT 'qualificado';

-- Criar índices para performance em JSONB
CREATE INDEX IF NOT EXISTS idx_candidatos_vaga_titulo ON candidatos(vaga_titulo);
CREATE INDEX IF NOT EXISTS idx_candidatos_fit_cultural ON candidatos USING GIN (fit_cultural);
CREATE INDEX IF NOT EXISTS idx_candidatos_respostas ON candidatos USING GIN (respostas_personalizadas);

-- Remover política antiga se existir e criar nova
DROP POLICY IF EXISTS "Service role can insert candidatos" ON candidatos;

CREATE POLICY "Service role can insert candidatos"
ON candidatos FOR INSERT
TO service_role
WITH CHECK (true);

-- Comentários para documentação
COMMENT ON COLUMN candidatos.fit_cultural IS 'Dados estruturados de fit cultural (adaptabilidade, trabalho_em_equipe, etc)';
COMMENT ON COLUMN candidatos.respostas_personalizadas IS 'Respostas dinâmicas às perguntas específicas da vaga';
COMMENT ON COLUMN candidatos.dados_completos IS 'JSON completo recebido do n8n (backup/auditoria)';