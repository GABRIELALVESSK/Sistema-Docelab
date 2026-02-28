-- Database setup for Bakery Management System

-- 1. Clientes Table
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

-- 2. Produtos (Estoque) Table
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

-- 3. Receitas Table
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

-- 4. Receita_Ingredientes Table
create table if not exists public.receita_ingredientes (
  id uuid default gen_random_uuid() primary key,
  receita_id uuid references public.receitas(id) on delete cascade,
  produto_id uuid references public.produtos(id) on delete cascade,
  quantidade numeric not null,
  created_at timestamp with time zone default now()
);

-- 5. Pedidos Table
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

-- 6. Transacoes Table
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

-- Basic RLS Policies (Allows all access for development)
alter table public.clientes enable row level security;
alter table public.produtos enable row level security;
alter table public.receitas enable row level security;
alter table public.receita_ingredientes enable row level security;
alter table public.pedidos enable row level security;
alter table public.transacoes enable row level security;

create policy "Allow all for authenticated" on public.clientes for all using (true) with check (true);
create policy "Allow all for authenticated" on public.produtos for all using (true) with check (true);
create policy "Allow all for authenticated" on public.receitas for all using (true) with check (true);
create policy "Allow all for authenticated" on public.receita_ingredientes for all using (true) with check (true);
create policy "Allow all for authenticated" on public.pedidos for all using (true) with check (true);
create policy "Allow all for authenticated" on public.transacoes for all using (true) with check (true);

-- 7. Storage Buckets Setup
-- Run these as a Superuser or through the SQL Editor

-- Create buckets for recipes and orders
insert into storage.buckets (id, name, public)
values ('receitas-fotos', 'receitas-fotos', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('pedido-images', 'pedido-images', true)
on conflict (id) do nothing;

-- Set up RLS for storage buckets (Allow all for development)
create policy "Public Access" on storage.objects for select using ( bucket_id = 'receitas-fotos' or bucket_id = 'pedido-images' );
create policy "Public Upload" on storage.objects for insert with check ( bucket_id = 'receitas-fotos' or bucket_id = 'pedido-images' );
create policy "Public Update" on storage.objects for update using ( bucket_id = 'receitas-fotos' or bucket_id = 'pedido-images' );
create policy "Public Delete" on storage.objects for delete using ( bucket_id = 'receitas-fotos' or bucket_id = 'pedido-images' );
