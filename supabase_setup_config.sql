-- ============================================================
-- MIGRAÇÃO: Tabela configuracoes agora é POR USUÁRIO
-- Execute este script no SQL Editor do Supabase
-- ============================================================

-- 1. Remove a tabela antiga (que usava id numérico compartilhado)
DROP TABLE IF EXISTS public.configuracoes;

-- 2. Cria a nova tabela com user_id (UUID do Supabase Auth) como chave
CREATE TABLE public.configuracoes (
    user_id TEXT PRIMARY KEY,
    nome TEXT,
    telefone TEXT,
    data_nascimento TEXT,
    cor_sistema TEXT DEFAULT 'pink',
    email TEXT,
    tema TEXT DEFAULT 'light',
    densidade TEXT DEFAULT 'spacious',
    notificacoes_pedidos BOOLEAN DEFAULT true,
    notificacoes_estoque BOOLEAN DEFAULT true,
    notificacoes_resumos BOOLEAN DEFAULT false,
    whatsapp BOOLEAN DEFAULT false,
    google_calendar BOOLEAN DEFAULT false,
    idioma TEXT DEFAULT 'Português (Brasil)',
    moeda TEXT DEFAULT 'BRL',
    foto_perfil TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Desativa RLS para acesso direto pelo frontend
ALTER TABLE public.configuracoes DISABLE ROW LEVEL SECURITY;
