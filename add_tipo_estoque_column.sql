-- ==========================================
-- CORREÇÃO: Adicionar coluna tipo_estoque
-- ==========================================

ALTER TABLE public.lista_compras 
ADD COLUMN IF NOT EXISTS tipo_estoque text DEFAULT 'ingrediente';

-- Pronto! Agora os itens podem ser marcados como ingredientes ou produtos acabados.
