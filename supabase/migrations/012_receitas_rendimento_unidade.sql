-- Adiciona colunas para rendimento proporcional e custo unitário automático
ALTER TABLE public.receitas 
ADD COLUMN IF NOT EXISTS unidade_rendimento TEXT DEFAULT 'un',
ADD COLUMN IF NOT EXISTS custo_unitario NUMERIC(10,2) DEFAULT 0;

COMMENT ON COLUMN receitas.unidade_rendimento IS 'Unidade de medida do rendimento (un, g, kg, ml, L)';
COMMENT ON COLUMN receitas.custo_unitario IS 'Custo de produção unitário calculado automaticamente';
