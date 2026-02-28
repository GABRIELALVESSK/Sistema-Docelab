-- Remove duplicate ingredients and add unique constraint
DO $$
BEGIN
    -- 1. Remove duplicates keeping only one entry for each (receita_id, produto_id)
    DELETE FROM public.receita_ingredientes a
    WHERE a.id < (
        SELECT MAX(id)
        FROM public.receita_ingredientes b
        WHERE a.receita_id = b.receita_id AND a.produto_id = b.produto_id
    );

    -- 2. Add unique constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_recipe_product'
    ) THEN
        ALTER TABLE public.receita_ingredientes 
        ADD CONSTRAINT unique_recipe_product UNIQUE (receita_id, produto_id);
    END IF;
END $$;
