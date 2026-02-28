-- Set auth.uid() as default for user_id in orcamentos and templates
ALTER TABLE public.orcamentos ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.templates_orcamento ALTER COLUMN user_id SET DEFAULT auth.uid();
