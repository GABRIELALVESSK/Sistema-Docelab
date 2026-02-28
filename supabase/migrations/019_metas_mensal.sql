-- Migration: Create metas table for monthly goals
CREATE TABLE IF NOT EXISTS metas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gastos_fixos NUMERIC DEFAULT 0,
  gastos_variaveis NUMERIC DEFAULT 0,
  salario NUMERIC DEFAULT 0,
  outros_gastos NUMERIC DEFAULT 0,
  meta_faturamento NUMERIC DEFAULT 0,
  mes_referencia TEXT NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Unique constraint on mes_referencia to avoid duplicates
CREATE UNIQUE INDEX IF NOT EXISTS metas_mes_referencia_unique ON metas (mes_referencia);

-- Enable RLS
ALTER TABLE metas ENABLE ROW LEVEL SECURITY;

-- Allow all operations (adjust for your auth setup)
CREATE POLICY "Allow all operations on metas" ON metas
  FOR ALL USING (true) WITH CHECK (true);
