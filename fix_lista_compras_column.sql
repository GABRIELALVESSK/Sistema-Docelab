-- ==========================================
-- CORREÇÃO: Renomear coluna criado_em para created_at
-- ==========================================

-- Renomear a coluna para coincidir com o que o frontend espera
ALTER TABLE public.lista_compras 
RENAME COLUMN criado_em TO created_at;

-- Pronto! Agora teste novamente adicionando um item e atualizando a página.
