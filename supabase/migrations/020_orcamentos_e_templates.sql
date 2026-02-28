-- Create orcamentos table
CREATE TABLE IF NOT EXISTS public.orcamentos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    cliente_nome TEXT NOT NULL,
    cliente_endereco TEXT,
    cliente_telefone TEXT,
    cliente_email TEXT,
    validade DATE,
    itens JSONB NOT NULL DEFAULT '[]'::jsonb,
    notas TEXT,
    valor_total NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'pendente',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create templates_orcamento table
CREATE TABLE IF NOT EXISTS public.templates_orcamento (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nome_template TEXT NOT NULL,
    descricao TEXT,
    tipo_encomenda TEXT DEFAULT 'bolo',
    descricao_kit TEXT,
    tema TEXT,
    porcoes TEXT,
    sabor TEXT,
    recheio TEXT,
    cobertura TEXT,
    custo_total NUMERIC DEFAULT 0,
    tipo_lucro TEXT DEFAULT 'fixo',
    lucro_valor NUMERIC DEFAULT 0,
    tipo_desconto TEXT DEFAULT 'fixo',
    desconto_valor NUMERIC DEFAULT 0,
    preco_final NUMERIC DEFAULT 0,
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates_orcamento ENABLE ROW LEVEL SECURITY;

-- Policies for orcamentos
CREATE POLICY "Users can manage their own orcamentos"
    ON public.orcamentos
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policies for templates_orcamento
CREATE POLICY "Users can manage their own templates_orcamento"
    ON public.templates_orcamento
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
