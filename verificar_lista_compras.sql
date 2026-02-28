-- ==========================================
-- VERIFICAÇÃO SIMPLES: Lista de Compras
-- ==========================================

-- Execute uma query de cada vez

-- QUERY 1: Ver todos os itens salvos
SELECT * FROM public.lista_compras ORDER BY created_at DESC;

-- Se der erro "relation does not exist", a tabela não foi criada
-- Se retornar vazio, os dados não estão sendo salvos
-- Se retornar dados, o problema é na leitura (RLS)
