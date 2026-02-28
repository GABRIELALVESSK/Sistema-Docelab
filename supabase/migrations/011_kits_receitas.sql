-- Migration: 011_kits_receitas
-- Kit de Receitas: produto composto formado por múltiplas receitas (casca, recheio, finalização, embalagem)

-- Tabela principal de kits
CREATE TABLE IF NOT EXISTS kits_receitas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  preco_venda NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Itens que compõem o kit — cada linha aponta para uma receita e define seu papel
CREATE TABLE IF NOT EXISTS kit_receita_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id UUID NOT NULL REFERENCES kits_receitas(id) ON DELETE CASCADE,
  receita_id UUID NOT NULL REFERENCES receitas(id) ON DELETE CASCADE,
  papel TEXT NOT NULL DEFAULT 'Componente', -- ex: 'Casca', 'Recheio', 'Finalização', 'Embalagem'
  quantidade NUMERIC(10,3) NOT NULL DEFAULT 1, -- mudado para numeric para suportar gramas/ml
  unidade TEXT NOT NULL DEFAULT 'un', -- ex: 'g', 'kg', 'ml', 'L', 'un'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS básico (permissão total para usuário autenticado)
ALTER TABLE kits_receitas ENABLE ROW LEVEL SECURITY;
ALTER TABLE kit_receita_itens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_kits_receitas" ON kits_receitas;
CREATE POLICY "allow_all_kits_receitas" ON kits_receitas FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_kit_receita_itens" ON kit_receita_itens;
CREATE POLICY "allow_all_kit_receita_itens" ON kit_receita_itens FOR ALL USING (true) WITH CHECK (true);
