-- Migration to add custo_total to kits_receitas
-- This column will store the calculated production cost of the kit

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='kits_receitas' AND COLUMN_NAME='custo_total') THEN
        ALTER TABLE public.kits_receitas ADD COLUMN custo_total DECIMAL DEFAULT 0;
    END IF;
END $$;

COMMENT ON COLUMN public.kits_receitas.custo_total IS 'Custo total de produção do kit (soma dos componentes)';
