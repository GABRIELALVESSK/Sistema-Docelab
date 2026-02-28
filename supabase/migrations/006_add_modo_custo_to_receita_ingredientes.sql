-- Add modo_custo and usos_amortizacao columns to receita_ingredientes table
DO $$
BEGIN
    -- Add modo_custo column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receita_ingredientes' AND column_name = 'modo_custo') THEN
        ALTER TABLE public.receita_ingredientes ADD COLUMN modo_custo TEXT DEFAULT 'proporcional';
    END IF;

    -- Add usos_amortizacao column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receita_ingredientes' AND column_name = 'usos_amortizacao') THEN
        ALTER TABLE public.receita_ingredientes ADD COLUMN usos_amortizacao NUMERIC DEFAULT 1;
    END IF;
END $$;
