-- Migration to allow Recipes and Kits as ingredients in other Recipes
-- This enables hierarchical recipe composition

DO $$ 
BEGIN 
    -- 1. Add receita_componente_id to allow a recipe to be part of another recipe
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='receita_ingredientes' AND COLUMN_NAME='receita_componente_id') THEN
        ALTER TABLE public.receita_ingredientes ADD COLUMN receita_componente_id UUID REFERENCES public.receitas(id) ON DELETE CASCADE;
    END IF;

    -- 2. Add kit_componente_id to allow a kit to be part of a recipe
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='receita_ingredientes' AND COLUMN_NAME='kit_componente_id') THEN
        ALTER TABLE public.receita_ingredientes ADD COLUMN kit_componente_id UUID REFERENCES public.kits_receitas(id) ON DELETE CASCADE;
    END IF;

    -- 3. Make produto_id optional so we can have either produto_id, receita_componente_id or kit_componente_id
    ALTER TABLE public.receita_ingredientes ALTER COLUMN produto_id DROP NOT NULL;

    -- 4. Update the unique constraint to include the new columns
    -- First drop the old one
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_recipe_product') THEN
        ALTER TABLE public.receita_ingredientes DROP CONSTRAINT unique_recipe_product;
    END IF;

    -- Add a check constraint ensure at least one of the IDs is present
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_at_least_one_component') THEN
        ALTER TABLE public.receita_ingredientes ADD CONSTRAINT check_at_least_one_component 
        CHECK (
            (produto_id IS NOT NULL AND receita_componente_id IS NULL AND kit_componente_id IS NULL) OR
            (produto_id IS NULL AND receita_componente_id IS NOT NULL AND kit_componente_id IS NULL) OR
            (produto_id IS NULL AND receita_componente_id IS NULL AND kit_componente_id IS NOT NULL)
        );
    END IF;

END $$;

-- 5. Force schema cache reload
NOTIFY pgrst, 'reload schema';
COMMENT ON TABLE public.receita_ingredientes IS 'Ingredientes de uma receita, que podem ser produtos do estoque, outras receitas ou kits.';
