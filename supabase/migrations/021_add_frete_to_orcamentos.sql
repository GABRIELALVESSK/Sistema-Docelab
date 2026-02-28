-- Add frete_valor to orcamentos and templates_orcamento
ALTER TABLE public.orcamentos ADD COLUMN IF NOT EXISTS frete_valor NUMERIC DEFAULT 0;
ALTER TABLE public.templates_orcamento ADD COLUMN IF NOT EXISTS frete_valor NUMERIC DEFAULT 0;
