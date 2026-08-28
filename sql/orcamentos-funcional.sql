create extension if not exists "pgcrypto";

create table if not exists public.orcamentos (
  id uuid primary key default gen_random_uuid(),
  cliente_nome text not null,
  servico text not null,
  descricao text,
  data_emissao date default current_date,
  validade date,
  status text default 'Aguardando',
  valor_total numeric(12,2) default 0,
  entrada numeric(12,2) default 0,
  forma_pagamento text,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orcamentos add column if not exists cliente_nome text;
alter table public.orcamentos add column if not exists servico text;
alter table public.orcamentos add column if not exists descricao text;
alter table public.orcamentos add column if not exists data_emissao date default current_date;
alter table public.orcamentos add column if not exists validade date;
alter table public.orcamentos add column if not exists status text default 'Aguardando';
alter table public.orcamentos add column if not exists valor_total numeric(12,2) default 0;
alter table public.orcamentos add column if not exists entrada numeric(12,2) default 0;
alter table public.orcamentos add column if not exists forma_pagamento text;
alter table public.orcamentos add column if not exists observacoes text;
alter table public.orcamentos add column if not exists created_at timestamptz not null default now();
alter table public.orcamentos add column if not exists updated_at timestamptz not null default now();

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_orcamentos_updated_at on public.orcamentos;

create trigger set_orcamentos_updated_at
before update on public.orcamentos
for each row
execute function public.set_updated_at();

create index if not exists orcamentos_status_idx
on public.orcamentos (status);

create index if not exists orcamentos_emissao_idx
on public.orcamentos (data_emissao);

alter table public.orcamentos enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'orcamentos'
      and policyname = 'Permitir leitura orcamentos temporario'
  ) then
    create policy "Permitir leitura orcamentos temporario"
    on public.orcamentos
    for select
    using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'orcamentos'
      and policyname = 'Permitir cadastro orcamentos temporario'
  ) then
    create policy "Permitir cadastro orcamentos temporario"
    on public.orcamentos
    for insert
    with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'orcamentos'
      and policyname = 'Permitir edicao orcamentos temporario'
  ) then
    create policy "Permitir edicao orcamentos temporario"
    on public.orcamentos
    for update
    using (true)
    with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'orcamentos'
      and policyname = 'Permitir exclusao orcamentos temporario'
  ) then
    create policy "Permitir exclusao orcamentos temporario"
    on public.orcamentos
    for delete
    using (true);
  end if;
end $$;
