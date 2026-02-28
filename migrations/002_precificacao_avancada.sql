-- ============================================================================
-- Migration 002: Módulo Avançado de Precificação
-- ============================================================================
-- Este script evolui as tabelas existentes para suportar:
-- - Gestão de insumos com unidades de compra e preço por embalagem
-- - 3 modos de custo (Proporcional, Compra Mínima, Amortizado)
-- - Cálculo automático de CMV + Segurança + Fixos + 3 preços finais
-- - Histórico de mudanças de preços para auditoria
-- ============================================================================

-- ============================================================================
-- 1. EVOLUIR TABELA PRODUTOS (Gestão de Insumos)
-- ============================================================================

-- Adicionar campos para gestão detalhada de insumos
ALTER TABLE public.produtos 
  ADD COLUMN IF NOT EXISTS unidade_compra text DEFAULT 'kg',
  ADD COLUMN IF NOT EXISTS quantidade_por_embalagem numeric DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS preco_embalagem numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS perdas_percentual numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ativo boolean DEFAULT true;

-- Adicionar comentários para documentação
COMMENT ON COLUMN produtos.unidade_compra IS 'Unidade de compra: kg, g, L, ml, un, pacote, rolo, frasco, lata';
COMMENT ON COLUMN produtos.quantidade_por_embalagem IS 'Quantidade na embalagem comprada (ex: 1000g para 1kg, 600ml, 12un para pacote)';
COMMENT ON COLUMN produtos.preco_embalagem IS 'Preço da embalagem completa conforme comprada do fornecedor';
COMMENT ON COLUMN produtos.perdas_percentual IS 'Percentual de perdas estimado (evaporação, quebra, desperdício, etc.)';
COMMENT ON COLUMN produtos.ativo IS 'Indica se o insumo está ativo para uso em novas receitas';

-- Adicionar constraint para validar unidades de compra
ALTER TABLE public.produtos
  DROP CONSTRAINT IF EXISTS check_unidade_compra,
  ADD CONSTRAINT check_unidade_compra 
    CHECK (unidade_compra IN ('kg', 'g', 'L', 'ml', 'un', 'pacote', 'rolo', 'frasco', 'lata', 'cx', 'pct'));

-- Adicionar constraint para validar percentual de perdas
ALTER TABLE public.produtos
  DROP CONSTRAINT IF EXISTS check_perdas_percentual,
  ADD CONSTRAINT check_perdas_percentual 
    CHECK (perdas_percentual >= 0 AND perdas_percentual <= 100);

-- ============================================================================
-- 2. EVOLUIR TABELA RECEITA_INGREDIENTES (Modos de Custo)
-- ============================================================================

-- Adicionar modo de custo para cada ingrediente na receita
ALTER TABLE public.receita_ingredientes 
  ADD COLUMN IF NOT EXISTS modo_custo text DEFAULT 'proporcional',
  ADD COLUMN IF NOT EXISTS usos_amortizacao numeric DEFAULT 1;

-- Adicionar comentários
COMMENT ON COLUMN receita_ingredientes.modo_custo IS 'proporcional: cobra pelo exato que usou | compra_minima: considera embalagem inteira | amortizado: divide custo por N usos';
COMMENT ON COLUMN receita_ingredientes.usos_amortizacao IS 'Para modo amortizado: quantos usos estimados até acabar (ex: caixa reutilizável = 100 usos)';

-- Adicionar constraint para validar modo de custo
ALTER TABLE public.receita_ingredientes
  DROP CONSTRAINT IF EXISTS check_modo_custo,
  ADD CONSTRAINT check_modo_custo 
    CHECK (modo_custo IN ('proporcional', 'compra_minima', 'amortizado'));

-- Adicionar constraint para validar usos de amortização
ALTER TABLE public.receita_ingredientes
  DROP CONSTRAINT IF EXISTS check_usos_amortizacao,
  ADD CONSTRAINT check_usos_amortizacao 
    CHECK (usos_amortizacao > 0);

-- ============================================================================
-- 3. EVOLUIR TABELA RECEITAS (Rendimento e Parâmetros)
-- ============================================================================

-- Adicionar campos para precificação
ALTER TABLE public.receitas
  ADD COLUMN IF NOT EXISTS rendimento_unidades numeric DEFAULT 1,
  ADD COLUMN IF NOT EXISTS observacoes_precificacao text;

-- Adicionar comentários
COMMENT ON COLUMN receitas.rendimento_unidades IS 'Quantidade de unidades que a receita produz (ex: 24 brigadeiros, 1 bolo, 100g)';
COMMENT ON COLUMN receitas.observacoes_precificacao IS 'Observações específicas para precificação (ex: tempo de forno, cuidados especiais)';

-- Adicionar constraint para validar rendimento
ALTER TABLE public.receitas
  DROP CONSTRAINT IF EXISTS check_rendimento_unidades,
  ADD CONSTRAINT check_rendimento_unidades 
    CHECK (rendimento_unidades > 0);

-- ============================================================================
-- 4. EVOLUIR TABELA PRODUTO_VARIACOES (Preços Calculados)
-- ============================================================================

-- Adicionar campos para armazenar os 3 preços finais e detalhes do cálculo
ALTER TABLE public.produto_variacoes
  ADD COLUMN IF NOT EXISTS preco_lucro_30 numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS preco_lucro_50 numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS preco_lucro_70 numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cmv_base numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cmv_com_seguranca numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS custo_base_final numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ultima_atualizacao_preco timestamp with time zone DEFAULT now();

-- Adicionar comentários
COMMENT ON COLUMN produto_variacoes.preco_lucro_30 IS 'Preço final com 30% de margem de lucro';
COMMENT ON COLUMN produto_variacoes.preco_lucro_50 IS 'Preço final com 50% de margem de lucro';
COMMENT ON COLUMN produto_variacoes.preco_lucro_70 IS 'Preço final com 70% de margem de lucro';
COMMENT ON COLUMN produto_variacoes.cmv_base IS 'CMV puro (custo de matéria-prima) do lote';
COMMENT ON COLUMN produto_variacoes.cmv_com_seguranca IS 'CMV base + percentual de segurança (ex: +20%)';
COMMENT ON COLUMN produto_variacoes.custo_base_final IS 'CMV com segurança + fixos/mão de obra (multiplicado)';
COMMENT ON COLUMN produto_variacoes.ultima_atualizacao_preco IS 'Data/hora da última atualização de preço';

-- ============================================================================
-- 5. EVOLUIR TABELA CONFIGURACOES_PRECIFICACAO (Parâmetros Globais)
-- ============================================================================

-- Adicionar parâmetros globais de precificação
ALTER TABLE public.configuracoes_precificacao
  ADD COLUMN IF NOT EXISTS percentual_seguranca numeric DEFAULT 20,
  ADD COLUMN IF NOT EXISTS multiplicador_fixos_mao_obra numeric DEFAULT 2,
  ADD COLUMN IF NOT EXISTS margens_lucro jsonb DEFAULT '[30, 50, 70]'::jsonb,
  ADD COLUMN IF NOT EXISTS arredondamento_casas numeric DEFAULT 2,
  ADD COLUMN IF NOT EXISTS arredondamento_tipo text DEFAULT 'nenhum';

-- Adicionar comentários
COMMENT ON COLUMN configuracoes_precificacao.percentual_seguranca IS 'Percentual de segurança aplicado sobre o CMV (padrão: 20%)';
COMMENT ON COLUMN configuracoes_precificacao.multiplicador_fixos_mao_obra IS 'Multiplicador para fixos/mão de obra (padrão: 2x = duplica)';
COMMENT ON COLUMN configuracoes_precificacao.margens_lucro IS 'Array JSON com as margens de lucro padrão (ex: [30, 50, 70])';
COMMENT ON COLUMN configuracoes_precificacao.arredondamento_casas IS 'Número de casas decimais para arredondamento';
COMMENT ON COLUMN configuracoes_precificacao.arredondamento_tipo IS 'Tipo de arredondamento: nenhum, cima_0_10, cima_0_50, psicologico_0_90';

-- Adicionar constraint para validar tipo de arredondamento
ALTER TABLE public.configuracoes_precificacao
  DROP CONSTRAINT IF EXISTS check_arredondamento_tipo,
  ADD CONSTRAINT check_arredondamento_tipo 
    CHECK (arredondamento_tipo IN ('nenhum', 'cima_0_10', 'cima_0_50', 'psicologico_0_90'));

-- Atualizar registro existente com valores padrão
UPDATE public.configuracoes_precificacao
SET 
  percentual_seguranca = COALESCE(percentual_seguranca, 20),
  multiplicador_fixos_mao_obra = COALESCE(multiplicador_fixos_mao_obra, 2),
  margens_lucro = COALESCE(margens_lucro, '[30, 50, 70]'::jsonb),
  arredondamento_casas = COALESCE(arredondamento_casas, 2),
  arredondamento_tipo = COALESCE(arredondamento_tipo, 'nenhum')
WHERE id IS NOT NULL;

-- ============================================================================
-- 6. CRIAR TABELA PRECIFICACAO_HISTORICO (Auditoria)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.precificacao_historico (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  variacao_id uuid REFERENCES public.produto_variacoes(id) ON DELETE CASCADE,
  receita_id uuid REFERENCES public.receitas(id) ON DELETE SET NULL,
  data_calculo timestamp with time zone DEFAULT now(),
  
  -- Valores calculados (snapshot)
  cmv_total numeric NOT NULL DEFAULT 0,
  cmv_unitario numeric NOT NULL DEFAULT 0,
  cmv_com_seguranca numeric NOT NULL DEFAULT 0,
  custo_base_unitario numeric NOT NULL DEFAULT 0,
  preco_lucro_30 numeric DEFAULT 0,
  preco_lucro_50 numeric DEFAULT 0,
  preco_lucro_70 numeric DEFAULT 0,
  
  -- Snapshot dos insumos usados (JSON para auditoria completa)
  snapshot_insumos jsonb,
  
  -- Parâmetros usados no cálculo (para reproduzir)
  percentual_seguranca numeric DEFAULT 20,
  multiplicador_fixos numeric DEFAULT 2,
  rendimento_unidades numeric DEFAULT 1,
  
  -- Observações
  observacoes text,
  usuario_id text
);

-- Adicionar comentários
COMMENT ON TABLE precificacao_historico IS 'Histórico de todas as precificações calculadas para auditoria e análise de evolução de preços';
COMMENT ON COLUMN precificacao_historico.snapshot_insumos IS 'JSON com lista de insumos, quantidades e preços no momento do cálculo';

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_historico_variacao_data 
  ON precificacao_historico(variacao_id, data_calculo DESC);

CREATE INDEX IF NOT EXISTS idx_historico_receita 
  ON precificacao_historico(receita_id, data_calculo DESC);

CREATE INDEX IF NOT EXISTS idx_historico_data 
  ON precificacao_historico(data_calculo DESC);

-- RLS Policy
ALTER TABLE public.precificacao_historico ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for historico" ON public.precificacao_historico;
CREATE POLICY "Allow all for historico" 
  ON public.precificacao_historico FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- 7. CRIAR VIEWS ÚTEIS
-- ============================================================================

-- View: Insumos com preço por unidade básica calculado
CREATE OR REPLACE VIEW v_insumos_preco_unitario AS
SELECT 
  p.id,
  p.nome,
  p.categoria,
  p.unidade_compra,
  p.quantidade_por_embalagem,
  p.preco_embalagem,
  p.perdas_percentual,
  p.ativo,
  p.fornecedor,
  -- Calcular preço por unidade básica
  CASE 
    WHEN p.unidade_compra IN ('kg') THEN p.preco_embalagem / (p.quantidade_por_embalagem * 1000)
    WHEN p.unidade_compra IN ('L') THEN p.preco_embalagem / (p.quantidade_por_embalagem * 1000)
    ELSE p.preco_embalagem / NULLIF(p.quantidade_por_embalagem, 0)
  END AS preco_por_unidade_basica,
  -- Unidade básica resultante
  CASE 
    WHEN p.unidade_compra IN ('kg', 'g') THEN 'g'
    WHEN p.unidade_compra IN ('L', 'ml') THEN 'ml'
    ELSE 'un'
  END AS unidade_basica
FROM produtos p
WHERE p.ativo = true;

COMMENT ON VIEW v_insumos_preco_unitario IS 'View que calcula automaticamente o preço por unidade básica (g, ml, un) de cada insumo';

-- ============================================================================
-- 8. FUNÇÃO AUXILIAR: Calcular Preço por Unidade Básica
-- ============================================================================

CREATE OR REPLACE FUNCTION calcular_preco_unitario_insumo(
  p_preco_embalagem numeric,
  p_quantidade_por_embalagem numeric,
  p_unidade_compra text
)
RETURNS numeric AS $$
BEGIN
  -- Conversões para unidades básicas
  IF p_unidade_compra IN ('kg') THEN
    RETURN p_preco_embalagem / (p_quantidade_por_embalagem * 1000);
  ELSIF p_unidade_compra IN ('L') THEN
    RETURN p_preco_embalagem / (p_quantidade_por_embalagem * 1000);
  ELSE
    RETURN p_preco_embalagem / NULLIF(p_quantidade_por_embalagem, 0);
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calcular_preco_unitario_insumo IS 'Calcula o preço por unidade básica (g, ml, un) dado o preço da embalagem';

-- ============================================================================
-- 9. POPULAR DADOS DE EXEMPLO (Opcional - Apenas para desenvolvimento)
-- ============================================================================

-- Inserir configuração padrão se não existir
INSERT INTO public.configuracoes_precificacao (
  preco_botijao_gas, 
  duracao_botijao_horas, 
  custo_hora_mao_obra,
  percentual_seguranca,
  multiplicador_fixos_mao_obra,
  margens_lucro,
  arredondamento_casas,
  arredondamento_tipo
)
SELECT 120, 50, 20, 20, 2, '[30, 50, 70]'::jsonb, 2, 'nenhum'
WHERE NOT EXISTS (SELECT 1 FROM public.configuracoes_precificacao);

-- ============================================================================
-- 10. GRANTS E PERMISSÕES
-- ============================================================================

-- Garantir que tabelas e views sejam acessíveis
GRANT SELECT, INSERT, UPDATE, DELETE ON public.produtos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.receitas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.receita_ingredientes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.produto_variacoes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.configuracoes_precificacao TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.precificacao_historico TO authenticated;
GRANT SELECT ON v_insumos_preco_unitario TO authenticated;

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================

-- Para verificar se a migration foi aplicada com sucesso:
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'produtos' AND column_name IN ('unidade_compra', 'preco_embalagem');
