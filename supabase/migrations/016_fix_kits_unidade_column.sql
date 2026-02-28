-- Migration to fix missing 'unidade' column in kit_receita_itens
-- This ensures the column exists even if the table was created by an older version of the migration
ALTER TABLE public.kit_receita_itens 
ADD COLUMN IF NOT EXISTS unidade TEXT DEFAULT 'un';

COMMENT ON COLUMN kit_receita_itens.unidade IS 'Unidade de medida do item no kit (un, g, kg, ml, L)';

-- Força atualização do cache do PostgREST (Supabase) realizando um pequeno comentário ou alteração insignificante
NOTIFY pgrst, 'reload schema';
