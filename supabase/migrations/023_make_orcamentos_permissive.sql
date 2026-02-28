-- Make user_id nullable for orcamentos and templates
ALTER TABLE public.orcamentos ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.templates_orcamento ALTER COLUMN user_id DROP NOT NULL;

-- Drop restrictive policies
DROP POLICY IF EXISTS "Users can manage their own orcamentos" ON public.orcamentos;
DROP POLICY IF EXISTS "Users can manage their own templates_orcamento" ON public.templates_orcamento;

-- Create permissive policies for orcamentos
CREATE POLICY "Allow all access to orcamentos" ON public.orcamentos FOR ALL USING (true) WITH CHECK (true);

-- Create permissive policies for templates_orcamento
CREATE POLICY "Allow all access to templates_orcamento" ON public.templates_orcamento FOR ALL USING (true) WITH CHECK (true);
