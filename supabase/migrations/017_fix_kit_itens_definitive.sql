-- Migration to definitively fix the kit_receita_itens schema and cache
-- This ensures all required columns exist and forces PostgREST to refresh

-- 1. Ensure the table exists (it should, but just in case)
CREATE TABLE IF NOT EXISTS public.kit_receita_itens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kit_id UUID REFERENCES public.kits_receitas(id) ON DELETE CASCADE,
    receita_id UUID REFERENCES public.receitas(id) ON DELETE CASCADE,
    produto_id UUID REFERENCES public.produtos(id) ON DELETE CASCADE,
    papel TEXT,
    quantidade DECIMAL,
    unidade TEXT DEFAULT 'un',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Ensure columns exist if table was created older
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='kit_receita_itens' AND COLUMN_NAME='produto_id') THEN
        ALTER TABLE public.kit_receita_itens ADD COLUMN produto_id UUID REFERENCES public.produtos(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='kit_receita_itens' AND COLUMN_NAME='unidade') THEN
        ALTER TABLE public.kit_receita_itens ADD COLUMN unidade TEXT DEFAULT 'un';
    END IF;

    -- Make receita_id optional if it wasn't already
    ALTER TABLE public.kit_receita_itens ALTER COLUMN receita_id DROP NOT NULL;
END $$;

-- 3. Force schema cache reload
-- In some Supabase versions, a simple comment or DDL change triggers it, 
-- but NOTIFY is the most direct way if configured.
COMMENT ON TABLE public.kit_receita_itens IS 'Itens que compõem um kit (podem ser receitas ou produtos do estoque)';
NOTIFY pgrst, 'reload schema';
