-- Migração para adicionar campos de evento à tabela de orçamentos
-- Execute este script no SQL Editor do Supabase para corrigir o erro de salvamento

ALTER TABLE public.orcamentos 
ADD COLUMN IF NOT EXISTS data_evento TEXT,
ADD COLUMN IF NOT EXISTS tipo_evento TEXT,
ADD COLUMN IF NOT EXISTS aniversariante_nome TEXT,
ADD COLUMN IF NOT EXISTS aniversariante_idade TEXT;

-- Comentário para expor os campos na API
COMMENT ON COLUMN public.orcamentos.data_evento IS 'Data do evento formatada como YYYY-MM-DD';
COMMENT ON COLUMN public.orcamentos.tipo_evento IS 'Tipo do evento (ex: Aniversário, Casamento)';
COMMENT ON COLUMN public.orcamentos.aniversariante_nome IS 'Nome do aniversariante';
COMMENT ON COLUMN public.orcamentos.aniversariante_idade IS 'Idade que o aniversariante está completando';
