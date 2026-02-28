-- Add pricing columns to receitas table if they don't exist
DO $$
BEGIN
    -- Rendimento Unidades (ex: 100 unidades)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receitas' AND column_name = 'rendimento_unidades') THEN
        ALTER TABLE public.receitas ADD COLUMN rendimento_unidades NUMERIC DEFAULT 1;
    END IF;

    -- Preço de Venda
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receitas' AND column_name = 'preco_venda') THEN
        ALTER TABLE public.receitas ADD COLUMN preco_venda NUMERIC(10, 2) DEFAULT 0;
    END IF;

    -- Tempo de Produção (em minutos)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receitas' AND column_name = 'tempo_producao_minutos') THEN
        ALTER TABLE public.receitas ADD COLUMN tempo_producao_minutos NUMERIC DEFAULT 0;
    END IF;

    -- Margem de Lucro Alvo (%)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receitas' AND column_name = 'margem_lucro_alvo') THEN
        ALTER TABLE public.receitas ADD COLUMN margem_lucro_alvo NUMERIC DEFAULT 100;
    END IF;
END $$;
