-- ============================================================
-- MIGRAÇÃO GLOBAL: Adicionando user_id - Parte 2
-- Execute este script no SQL Editor do Supabase
-- ============================================================

DO $$
BEGIN
    -- KITS_RECEITAS
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kits_receitas' AND column_name='user_id') THEN
        ALTER TABLE public.kits_receitas ADD COLUMN user_id TEXT;
    END IF;

    -- TEMPLATES_ORCAMENTO
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='templates_orcamento' AND column_name='user_id') THEN
        ALTER TABLE public.templates_orcamento ADD COLUMN user_id TEXT;
    END IF;

    -- CONFIGURACOES_PRECIFICACAO
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='configuracoes_precificacao' AND column_name='user_id') THEN
        ALTER TABLE public.configuracoes_precificacao ADD COLUMN user_id TEXT;
    END IF;

END $$;
