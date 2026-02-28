-- Aumenta a precisão das colunas de custo unitário para evitar erros de arredondamento em g/ml
ALTER TABLE public.receitas 
ALTER COLUMN custo_unitario TYPE NUMERIC(12,4),
ALTER COLUMN cmv_unitario TYPE NUMERIC(12,4);

COMMENT ON COLUMN receitas.custo_unitario IS 'Custo de produção unitário com 4 casas decimais para precisão em gramas/ml';
COMMENT ON COLUMN receitas.cmv_unitario IS 'Custo de insumos (CMV) unitário com 4 casas decimais para precisão em gramas/ml';
