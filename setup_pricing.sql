-- Database setup for Pricing Module (Fase 2)

-- 8. Catalogo de Produtos (Produto Pai Ex: Ovo de Páscoa)
create table if not exists public.catalogo_produtos (
  id uuid default gen_random_uuid() primary key,
  nome text not null,
  descricao text,
  categoria text,
  criado_em timestamp with time zone default now()
);

-- 9. Variações de Produto (Ex: Ovo 250g, Ovo 350g)
create table if not exists public.produto_variacoes (
  id uuid default gen_random_uuid() primary key,
  produto_id uuid references public.catalogo_produtos(id) on delete cascade,
  nome text not null, -- ex: "250g", "Grande"
  criado_em timestamp with time zone default now()
);

-- Add columns safely if they don't exist
alter table public.produto_variacoes add column if not exists preco_venda_sugerido numeric default 0;
alter table public.produto_variacoes add column if not exists margem_lucro_alvo numeric default 0;
alter table public.produto_variacoes add column if not exists custo_total_calculado numeric default 0;
alter table public.produto_variacoes add column if not exists custo_gas_energia numeric default 0;
alter table public.produto_variacoes add column if not exists custo_mao_obra numeric default 0;
alter table public.produto_variacoes add column if not exists percentual_perdas numeric default 0;
alter table public.produto_variacoes add column if not exists custo_entrega numeric default 0;
alter table public.produto_variacoes add column if not exists percentual_taxa_plataforma numeric default 0;
alter table public.produto_variacoes add column if not exists percentual_taxa_cartao numeric default 0;
alter table public.produto_variacoes add column if not exists tempo_producao_minutos numeric default 0; -- Tempo para produzir esta variação

-- 11. Configurações Globais de Precificação
create table if not exists public.configuracoes_precificacao (
  id uuid default gen_random_uuid() primary key,
  preco_botijao_gas numeric default 120, -- R$ 120.00
  duracao_botijao_horas numeric default 50, -- Média de 50 horas de uso contínuo
  custo_hora_mao_obra numeric default 20, -- R$ 20.00 por hora
  criado_em timestamp with time zone default now()
);

-- Inserir configuração inicial se não existir
insert into public.configuracoes_precificacao (preco_botijao_gas, duracao_botijao_horas, custo_hora_mao_obra)
select 120, 50, 20
where not exists (select 1 from public.configuracoes_precificacao);

-- 10. Composição do Produto (Camadas de custo: Receita, Ingrediente, Embalagem)
create table if not exists public.produto_composicao (
  id uuid default gen_random_uuid() primary key,
  variacao_id uuid references public.produto_variacoes(id) on delete cascade,
  tipo text check (tipo in ('receita', 'ingrediente', 'embalagem', 'extra')) not null,
  item_id uuid not null, 
  quantidade numeric not null default 1,
  criado_em timestamp with time zone default now()
);

-- Permitir acesso via RLS (Desenvolvimento: allow all)
alter table public.catalogo_produtos enable row level security;
alter table public.produto_variacoes enable row level security;
alter table public.produto_composicao enable row level security;

-- Drop policies before creating to avoid "already exists" error
drop policy if exists "Allow all for catalogo" on public.catalogo_produtos;
drop policy if exists "Allow all for variacoes" on public.produto_variacoes;
drop policy if exists "Allow all for composicao" on public.produto_composicao;

drop policy if exists "Allow all for configuracoes" on public.configuracoes_precificacao;

create policy "Allow all for catalogo" on public.catalogo_produtos for all using (true) with check (true);
create policy "Allow all for variacoes" on public.produto_variacoes for all using (true) with check (true);
create policy "Allow all for composicao" on public.produto_composicao for all using (true) with check (true);
create policy "Allow all for configuracoes" on public.configuracoes_precificacao for all using (true) with check (true);
