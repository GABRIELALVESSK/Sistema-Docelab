-- Adiciona coluna para custo de insumos puro (CMV) unitário
ALTER TABLE public.receitas 
ADD COLUMN IF NOT EXISTS cmv_unitario NUMERIC(10,2) DEFAULT 0;

COMMENT ON COLUMN receitas.cmv_unitario IS 'Custo de insumos (CMV) unitário calculado automaticamente (soma de ingredientes / rendimento)';
