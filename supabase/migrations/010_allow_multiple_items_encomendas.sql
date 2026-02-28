-- Adiciona coluna itens à tabela pedidos
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS itens JSONB DEFAULT '[]'::jsonb;

-- Migra dados existentes (um produto por pedido) para o novo formato JSON
-- Estrutura do item: [{ "produto": "Nome", "quantidade": 10, "preco": 5.0 }]
UPDATE pedidos 
SET itens = jsonb_build_array(
    jsonb_build_object(
        'produto', produto,
        'quantidade', quantidade,
        'preco', preco
    )
)
WHERE itens IS NULL OR itens = '[]'::jsonb AND produto IS NOT NULL;

-- Nota: Mantemos as colunas produto, quantidade e preco por enquanto para evitar quebra imediata
-- mas os novos dados serão lidos e gravados preferencialmente na coluna 'itens'.
