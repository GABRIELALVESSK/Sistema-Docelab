-- Migration: 025_add_rendimento_to_kits
-- Adiciona campos de rendimento e unidade de rendimento para kits de receitas

ALTER TABLE public.kits_receitas 
ADD COLUMN IF NOT EXISTS rendimento_unidades NUMERIC(10,3) DEFAULT 1,
ADD COLUMN IF NOT EXISTS unidade_rendimento TEXT DEFAULT 'un';

COMMENT ON COLUMN public.kits_receitas.rendimento_unidades IS 'Quantidade total que o kit rende';
COMMENT ON COLUMN public.kits_receitas.unidade_rendimento IS 'Unidade de medida do rendimento do kit (un, g, kg, ml, L)';

-- Recarrega o esquema do PostgREST
NOTIFY pgrst, 'reload schema';
