-- ============================================================
-- MIGRAÇÃO GLOBAL: Adicionando user_id para Isolamento de Dados
-- Execute este script no SQL Editor do Supabase
-- ============================================================

-- Lista de tabelas para adicionar user_id:
-- clientes, pedidos, transacoes, receitas, metas, produtos, custos_fixos, caixa, orcamentos, lista_compras

DO $$
BEGIN
    -- CLIENTES
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clientes' AND column_name='user_id') THEN
        ALTER TABLE public.clientes ADD COLUMN user_id TEXT;
    END IF;

    -- PEDIDOS
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pedidos' AND column_name='user_id') THEN
        ALTER TABLE public.pedidos ADD COLUMN user_id TEXT;
    END IF;

    -- TRANSACOES
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transacoes' AND column_name='user_id') THEN
        ALTER TABLE public.transacoes ADD COLUMN user_id TEXT;
    END IF;

    -- RECEITAS
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='receitas' AND column_name='user_id') THEN
        ALTER TABLE public.receitas ADD COLUMN user_id TEXT;
    END IF;

    -- METAS
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='metas' AND column_name='user_id') THEN
        ALTER TABLE public.metas ADD COLUMN user_id TEXT;
    END IF;

    -- PRODUTOS (ESTOQUE)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='produtos' AND column_name='user_id') THEN
        ALTER TABLE public.produtos ADD COLUMN user_id TEXT;
    END IF;

    -- CUSTOS FIXOS
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='custos_fixos' AND column_name='user_id') THEN
        ALTER TABLE public.custos_fixos ADD COLUMN user_id TEXT;
    END IF;

    -- CAIXA
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='caixa' AND column_name='user_id') THEN
        ALTER TABLE public.caixa ADD COLUMN user_id TEXT;
    END IF;

    -- ORCAMENTOS
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orcamentos' AND column_name='user_id') THEN
        ALTER TABLE public.orcamentos ADD COLUMN user_id TEXT;
    END IF;

    -- LISTA_COMPRAS
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lista_compras' AND column_name='user_id') THEN
        ALTER TABLE public.lista_compras ADD COLUMN user_id TEXT;
    END IF;

END $$;

-- OPCIONAL: Habilitar RLS e criar políticas (mais seguro)
-- Por enquanto, o frontend filtrará manualmente com .eq('user_id', user_id)
-- para garantir que a transição seja simples.
