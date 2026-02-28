-- Permite que itens de kit apontem para produtos (insumos) diretamente
ALTER TABLE public.kit_receita_itens 
ALTER COLUMN receita_id DROP NOT NULL;

ALTER TABLE public.kit_receita_itens 
ADD COLUMN IF NOT EXISTS produto_id UUID REFERENCES produtos(id) ON DELETE CASCADE;

COMMENT ON COLUMN kit_receita_itens.receita_id IS 'ID da receita vinculada (opcional se for produto direto)';
COMMENT ON COLUMN kit_receita_itens.produto_id IS 'ID do produto/insumo vinculado (opcional se for receita)';
