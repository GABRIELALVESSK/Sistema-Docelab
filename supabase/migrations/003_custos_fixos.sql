-- Create custos_fixos table
CREATE TABLE IF NOT EXISTS public.custos_fixos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    valor_mensal NUMERIC(10, 2) NOT NULL CHECK (valor_mensal >= 0),
    categoria TEXT NOT NULL, -- 'Administrativo', 'Operacional', 'Equipamentos', 'Outros'
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id)
);

-- Add horas_trabalho_mensal to configuracoes_precificacao if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'configuracoes_precificacao'
        AND column_name = 'horas_trabalho_mensal'
    ) THEN
        ALTER TABLE public.configuracoes_precificacao
        ADD COLUMN horas_trabalho_mensal INTEGER DEFAULT 220;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.custos_fixos ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own fixed costs"
    ON public.custos_fixos FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own fixed costs"
    ON public.custos_fixos FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own fixed costs"
    ON public.custos_fixos FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own fixed costs"
    ON public.custos_fixos FOR DELETE
    USING (auth.uid() = user_id);
