-- ==========================================
-- CORREÇÃO EMERGENCIAL: RLS Lista de Compras
-- ==========================================
-- Se o problema for de permissão, este script vai desabilitar
-- temporariamente o RLS para testar

-- OPÇÃO 1: Desabilitar RLS temporariamente (APENAS PARA TESTE)
-- ALTER TABLE public.lista_compras DISABLE ROW LEVEL SECURITY;

-- OPÇÃO 2: Recriar a policy corretamente
DROP POLICY IF EXISTS "Allow all for lista_compras" ON public.lista_compras;

CREATE POLICY "Allow all for lista_compras" 
ON public.lista_compras 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- OPÇÃO 3: Se você estiver usando autenticação, use esta policy
-- DROP POLICY IF EXISTS "Allow all for lista_compras" ON public.lista_compras;
-- 
-- CREATE POLICY "Allow all for lista_compras" 
-- ON public.lista_compras 
-- FOR ALL 
-- TO authenticated, anon
-- USING (true) 
-- WITH CHECK (true);
