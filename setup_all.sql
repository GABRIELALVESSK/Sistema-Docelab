-- ==========================================
-- CONFEITARIA PRO - SETUP COMPLETO
-- ==========================================

-- 1. CLIENTES
create table if not exists public.clientes (
  id uuid default gen_random_uuid() primary key,
  nome text not null,
  telefone text not null,
  email text,
  data_aniversario timestamp with time zone,
  cpf_cnpj text,
  endereco text,
  notas text,
  criado_em timestamp with time zone default now()
);

-- 2. ESTOQUE (PRODUTOS)
create table if not exists public.produtos (
  id uuid default gen_random_uuid() primary key,
  nome text not null,
  categoria text not null,
  quantidade numeric default 0,
  unidade text not null,
  minimo numeric default 0,
  preco_medio numeric default 0,
  preco_venda numeric,
  fornecedor text,
  data_validade timestamp with time zone,
  criado_em timestamp with time zone default now()
);

-- 3. RECEITAS
create table if not exists public.receitas (
  id uuid default gen_random_uuid() primary key,
  nome text not null,
  categoria text,
  tempo_preparo text,
  ingredientes_texto text,
  modo_preparo text,
  foto_url text,
  created_at timestamp with time zone default now()
);

-- 4. RECEITA_INGREDIENTES (LIGAÇÃO RECEITA x ESTOQUE)
create table if not exists public.receita_ingredientes (
  id uuid default gen_random_uuid() primary key,
  receita_id uuid references public.receitas(id) on delete cascade,
  produto_id uuid references public.produtos(id) on delete cascade,
  quantidade numeric not null,
  created_at timestamp with time zone default now()
);

-- 5. CATÁLOGO DE PRODUTOS FINAIS (FASE 2)
create table if not exists public.catalogo_produtos (
  id uuid default gen_random_uuid() primary key,
  nome text not null,
  descricao text,
  categoria text,
  criado_em timestamp with time zone default now()
);

-- 6. VARIAÇÕES DE PRODUTO (TAMANHOS, VERSÕES)
create table if not exists public.produto_variacoes (
  id uuid default gen_random_uuid() primary key,
  produto_id uuid references public.catalogo_produtos(id) on delete cascade,
  nome text not null, -- ex: "250g", "Grande"
  criado_em timestamp with time zone default now()
);

-- Adicionar colunas de precificação se não existirem
alter table public.produto_variacoes add column if not exists preco_venda_sugerido numeric default 0;
alter table public.produto_variacoes add column if not exists margem_lucro_alvo numeric default 0;
alter table public.produto_variacoes add column if not exists custo_total_calculado numeric default 0;
alter table public.produto_variacoes add column if not exists custo_gas_energia numeric default 0;
alter table public.produto_variacoes add column if not exists custo_mao_obra numeric default 0;
alter table public.produto_variacoes add column if not exists percentual_perdas numeric default 0;
alter table public.produto_variacoes add column if not exists custo_entrega numeric default 0;
alter table public.produto_variacoes add column if not exists percentual_taxa_plataforma numeric default 0;
alter table public.produto_variacoes add column if not exists percentual_taxa_cartao numeric default 0;
alter table public.produto_variacoes add column if not exists tempo_producao_minutos numeric default 0;

-- 7. COMPOSIÇÃO DO PRODUTO (MATÉRIA-PRIMA DA VARIAÇÃO)
create table if not exists public.produto_composicao (
  id uuid default gen_random_uuid() primary key,
  variacao_id uuid references public.produto_variacoes(id) on delete cascade,
  tipo text check (tipo in ('receita', 'ingrediente', 'embalagem', 'extra')) not null,
  item_id uuid not null, 
  quantidade numeric not null default 1,
  criado_em timestamp with time zone default now()
);

-- 8. CONFIGURAÇÕES GLOBAIS DE PRECIFICAÇÃO
create table if not exists public.configuracoes_precificacao (
  id uuid default gen_random_uuid() primary key,
  preco_botijao_gas numeric default 120,
  duracao_botijao_horas numeric default 50,
  custo_hora_mao_obra numeric default 20,
  criado_em timestamp with time zone default now()
);

insert into public.configuracoes_precificacao (preco_botijao_gas, duracao_botijao_horas, custo_hora_mao_obra)
select 120, 50, 20
where not exists (select 1 from public.configuracoes_precificacao);

-- 9. PEDIDOS
create table if not exists public.pedidos (
  id uuid default gen_random_uuid() primary key,
  cliente text not null,
  telefone text,
  produto text not null,
  quantidade numeric default 1,
  preco numeric default 0,
  data timestamp with time zone,
  status text check (status in ('pendente', 'em_producao', 'pronto', 'entregue')) default 'pendente',
  imagem_inspiracao text,
  notas text,
  criado_em timestamp with time zone default now()
);

-- 10. TRANSAÇÕES (FINANCEIRO)
create table if not exists public.transacoes (
  id uuid default gen_random_uuid() primary key,
  tipo text check (tipo in ('receita', 'despesa')) not null,
  categoria text,
  descricao text,
  valor numeric not null default 0,
  data timestamp with time zone default now(),
  cliente text,
  metodo text
);

-- 11. LISTA DE COMPRAS
create table if not exists public.lista_compras (
  id uuid default gen_random_uuid() primary key,
  nome text not null,
  quantidade numeric default 1,
  valor_unitario numeric default 0,
  valor_total numeric default 0,
  fornecedor text,
  categoria text,
  prioridade text check (prioridade in ('baixa', 'media', 'alta')) default 'media',
  comprado boolean default false,
  tipo_estoque text default 'ingrediente',
  created_at timestamp with time zone default now()
);

-- ==========================================
-- RLS & POLICIES (ACESSO TOTAL PARA DESENVOLVIMENTO)
-- ==========================================

alter table public.clientes enable row level security;
alter table public.produtos enable row level security;
alter table public.receitas enable row level security;
alter table public.receita_ingredientes enable row level security;
alter table public.pedidos enable row level security;
alter table public.transacoes enable row level security;
alter table public.catalogo_produtos enable row level security;
alter table public.produto_variacoes enable row level security;
alter table public.produto_composicao enable row level security;
alter table public.configuracoes_precificacao enable row level security;
alter table public.lista_compras enable row level security;

-- Drop and Create Policies
drop policy if exists "Allow all for authenticated" on public.clientes;
drop policy if exists "Allow all for authenticated" on public.produtos;
drop policy if exists "Allow all for authenticated" on public.receitas;
drop policy if exists "Allow all for authenticated" on public.receita_ingredientes;
drop policy if exists "Allow all for authenticated" on public.pedidos;
drop policy if exists "Allow all for authenticated" on public.transacoes;
drop policy if exists "Allow all for catalogo" on public.catalogo_produtos;
drop policy if exists "Allow all for variacoes" on public.produto_variacoes;
drop policy if exists "Allow all for composicao" on public.produto_composicao;
drop policy if exists "Allow all for configuracoes" on public.configuracoes_precificacao;
drop policy if exists "Allow all for lista_compras" on public.lista_compras;

create policy "Allow all for authenticated" on public.clientes for all using (true) with check (true);
create policy "Allow all for authenticated" on public.produtos for all using (true) with check (true);
create policy "Allow all for authenticated" on public.receitas for all using (true) with check (true);
create policy "Allow all for authenticated" on public.receita_ingredientes for all using (true) with check (true);
create policy "Allow all for authenticated" on public.pedidos for all using (true) with check (true);
create policy "Allow all for authenticated" on public.transacoes for all using (true) with check (true);
create policy "Allow all for catalogo" on public.catalogo_produtos for all using (true) with check (true);
create policy "Allow all for variacoes" on public.produto_variacoes for all using (true) with check (true);
create policy "Allow all for composicao" on public.produto_composicao for all using (true) with check (true);
create policy "Allow all for configuracoes" on public.configuracoes_precificacao for all using (true) with check (true);
create policy "Allow all for lista_compras" on public.lista_compras for all using (true) with check (true);

-- ==========================================
-- STORAGE BUCKETS
-- ==========================================

insert into storage.buckets (id, name, public)
values ('receitas-fotos', 'receitas-fotos', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('pedido-images', 'pedido-images', true)
on conflict (id) do nothing;

drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Public Upload" on storage.objects;
drop policy if exists "Public Update" on storage.objects;
drop policy if exists "Public Delete" on storage.objects;

create policy "Public Access" on storage.objects for select using ( bucket_id = 'receitas-fotos' or bucket_id = 'pedido-images' );
create policy "Public Upload" on storage.objects for insert with check ( bucket_id = 'receitas-fotos' or bucket_id = 'pedido-images' );
create policy "Public Update" on storage.objects for update using ( bucket_id = 'receitas-fotos' or bucket_id = 'pedido-images' );
create policy "Public Delete" on storage.objects for delete using ( bucket_id = 'receitas-fotos' or bucket_id = 'pedido-images' );
