-- Add advanced pricing columns to produtos table if they don't exist
DO $$
BEGIN
    -- Unidade de Compra (ex: 'kg', 'cx', 'lata')
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'produtos' AND column_name = 'unidade_compra') THEN
        ALTER TABLE public.produtos ADD COLUMN unidade_compra TEXT DEFAULT 'un';
    END IF;

    -- Quantidade por Embalagem (ex: 500g, 12un)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'produtos' AND column_name = 'quantidade_por_embalagem') THEN
        ALTER TABLE public.produtos ADD COLUMN quantidade_por_embalagem NUMERIC(10, 3) DEFAULT 1;
    END IF;

    -- Preço da Embalagem (ex: R$ 10,00)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'produtos' AND column_name = 'preco_embalagem') THEN
        ALTER TABLE public.produtos ADD COLUMN preco_embalagem NUMERIC(10, 2) DEFAULT 0;
    END IF;

    -- Percentual de Perdas (ex: 10%)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'produtos' AND column_name = 'perdas_percentual') THEN
        ALTER TABLE public.produtos ADD COLUMN perdas_percentual NUMERIC(5, 2) DEFAULT 0;
    END IF;

    -- Status Ativo/Inativo
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'produtos' AND column_name = 'ativo') THEN
        ALTER TABLE public.produtos ADD COLUMN ativo BOOLEAN DEFAULT true;
    END IF;
END $$;
