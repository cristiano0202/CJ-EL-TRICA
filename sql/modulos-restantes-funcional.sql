create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists public.ordens_servico (
  id uuid primary key default gen_random_uuid(),
  cliente_nome text,
  servico text,
  tecnico text,
  prazo date,
  status text default 'Em andamento',
  prioridade text default 'Normal',
  valor_total numeric(12,2) default 0,
  descricao text,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ordens_servico add column if not exists cliente_nome text;
alter table public.ordens_servico add column if not exists servico text;
alter table public.ordens_servico add column if not exists tecnico text;
alter table public.ordens_servico add column if not exists prazo date;
alter table public.ordens_servico add column if not exists status text default 'Em andamento';
alter table public.ordens_servico add column if not exists prioridade text default 'Normal';
alter table public.ordens_servico add column if not exists valor_total numeric(12,2) default 0;
alter table public.ordens_servico add column if not exists descricao text;
alter table public.ordens_servico add column if not exists observacoes text;
alter table public.ordens_servico add column if not exists created_at timestamptz not null default now();
alter table public.ordens_servico add column if not exists updated_at timestamptz not null default now();

drop trigger if exists set_ordens_servico_updated_at on public.ordens_servico;
create trigger set_ordens_servico_updated_at
before update on public.ordens_servico
for each row execute function public.set_updated_at();

create table if not exists public.materiais (
  id uuid primary key default gen_random_uuid(),
  codigo text,
  nome text,
  categoria text default 'Geral',
  estoque numeric(12,2) default 0,
  unidade text default 'un',
  estoque_minimo numeric(12,2) default 0,
  valor_unitario numeric(12,2) default 0,
  status text default 'Normal',
  fornecedor text,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.materiais add column if not exists codigo text;
alter table public.materiais add column if not exists nome text;
alter table public.materiais add column if not exists categoria text default 'Geral';
alter table public.materiais add column if not exists estoque numeric(12,2) default 0;
alter table public.materiais add column if not exists unidade text default 'un';
alter table public.materiais add column if not exists estoque_minimo numeric(12,2) default 0;
alter table public.materiais add column if not exists valor_unitario numeric(12,2) default 0;
alter table public.materiais add column if not exists status text default 'Normal';
alter table public.materiais add column if not exists fornecedor text;
alter table public.materiais add column if not exists observacoes text;
alter table public.materiais add column if not exists created_at timestamptz not null default now();
alter table public.materiais add column if not exists updated_at timestamptz not null default now();

drop trigger if exists set_materiais_updated_at on public.materiais;
create trigger set_materiais_updated_at
before update on public.materiais
for each row execute function public.set_updated_at();

create table if not exists public.financeiro (
  id uuid primary key default gen_random_uuid(),
  documento text,
  descricao text,
  tipo text default 'Receita',
  vencimento date,
  status text default 'A receber',
  valor numeric(12,2) default 0,
  cliente_nome text,
  forma_pagamento text,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.financeiro add column if not exists documento text;
alter table public.financeiro add column if not exists descricao text;
alter table public.financeiro add column if not exists tipo text default 'Receita';
alter table public.financeiro add column if not exists vencimento date;
alter table public.financeiro add column if not exists status text default 'A receber';
alter table public.financeiro add column if not exists valor numeric(12,2) default 0;
alter table public.financeiro add column if not exists cliente_nome text;
alter table public.financeiro add column if not exists forma_pagamento text;
alter table public.financeiro add column if not exists observacoes text;
alter table public.financeiro add column if not exists created_at timestamptz not null default now();
alter table public.financeiro add column if not exists updated_at timestamptz not null default now();

drop trigger if exists set_financeiro_updated_at on public.financeiro;
create trigger set_financeiro_updated_at
before update on public.financeiro
for each row execute function public.set_updated_at();

create table if not exists public.manutencoes (
  id uuid primary key default gen_random_uuid(),
  cliente_nome text,
  tipo text default 'Preventiva',
  periodicidade text,
  proxima_visita date,
  status text default 'Agendada',
  valor numeric(12,2) default 0,
  tecnico text,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.manutencoes add column if not exists cliente_nome text;
alter table public.manutencoes add column if not exists tipo text default 'Preventiva';
alter table public.manutencoes add column if not exists periodicidade text;
alter table public.manutencoes add column if not exists proxima_visita date;
alter table public.manutencoes add column if not exists status text default 'Agendada';
alter table public.manutencoes add column if not exists valor numeric(12,2) default 0;
alter table public.manutencoes add column if not exists tecnico text;
alter table public.manutencoes add column if not exists observacoes text;
alter table public.manutencoes add column if not exists created_at timestamptz not null default now();
alter table public.manutencoes add column if not exists updated_at timestamptz not null default now();

drop trigger if exists set_manutencoes_updated_at on public.manutencoes;
create trigger set_manutencoes_updated_at
before update on public.manutencoes
for each row execute function public.set_updated_at();

create table if not exists public.agenda (
  id uuid primary key default gen_random_uuid(),
  cliente_nome text,
  servico text,
  tecnico text,
  data_agendamento date,
  horario time,
  tipo text default 'Servico',
  status text default 'Agendado',
  prioridade text default 'Normal',
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.agenda add column if not exists cliente_nome text;
alter table public.agenda add column if not exists servico text;
alter table public.agenda add column if not exists tecnico text;
alter table public.agenda add column if not exists data_agendamento date;
alter table public.agenda add column if not exists horario time;
alter table public.agenda add column if not exists tipo text default 'Servico';
alter table public.agenda add column if not exists status text default 'Agendado';
alter table public.agenda add column if not exists prioridade text default 'Normal';
alter table public.agenda add column if not exists observacoes text;
alter table public.agenda add column if not exists created_at timestamptz not null default now();
alter table public.agenda add column if not exists updated_at timestamptz not null default now();

drop trigger if exists set_agenda_updated_at on public.agenda;
create trigger set_agenda_updated_at
before update on public.agenda
for each row execute function public.set_updated_at();

create table if not exists public.configuracoes (
  id text primary key default 'principal',
  empresa_nome text default 'CJ Eletrica',
  cnpj text,
  telefone text,
  email text,
  idioma text default 'pt-BR',
  notificar_visitas boolean default true,
  controle_estoque boolean default true,
  financeiro_simplificado boolean default false,
  updated_at timestamptz not null default now()
);

alter table public.configuracoes add column if not exists id text default 'principal';
alter table public.configuracoes add column if not exists empresa_nome text default 'CJ Eletrica';
alter table public.configuracoes add column if not exists cnpj text;
alter table public.configuracoes add column if not exists telefone text;
alter table public.configuracoes add column if not exists email text;
alter table public.configuracoes add column if not exists idioma text default 'pt-BR';
alter table public.configuracoes add column if not exists notificar_visitas boolean default true;
alter table public.configuracoes add column if not exists controle_estoque boolean default true;
alter table public.configuracoes add column if not exists financeiro_simplificado boolean default false;
alter table public.configuracoes add column if not exists updated_at timestamptz not null default now();

update public.configuracoes
set id = 'principal'
where id is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.configuracoes'::regclass
      and contype = 'p'
  ) then
    alter table public.configuracoes add primary key (id);
  end if;
end $$;

create index if not exists ordens_servico_status_idx on public.ordens_servico (status);
create index if not exists materiais_status_idx on public.materiais (status);
create index if not exists financeiro_status_idx on public.financeiro (status);
create index if not exists manutencoes_status_idx on public.manutencoes (status);
create index if not exists agenda_data_idx on public.agenda (data_agendamento, horario);

do $$
declare
  tabela text;
  nome_politica text;
begin
  foreach tabela in array array[
    'ordens_servico',
    'materiais',
    'financeiro',
    'manutencoes',
    'agenda',
    'configuracoes'
  ]
  loop
    execute format('alter table public.%I enable row level security', tabela);

    nome_politica := 'Permitir leitura ' || tabela || ' temporario';
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = tabela and policyname = nome_politica
    ) then
      execute format('create policy %I on public.%I for select using (true)', nome_politica, tabela);
    end if;

    nome_politica := 'Permitir cadastro ' || tabela || ' temporario';
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = tabela and policyname = nome_politica
    ) then
      execute format('create policy %I on public.%I for insert with check (true)', nome_politica, tabela);
    end if;

    nome_politica := 'Permitir edicao ' || tabela || ' temporario';
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = tabela and policyname = nome_politica
    ) then
      execute format('create policy %I on public.%I for update using (true) with check (true)', nome_politica, tabela);
    end if;

    nome_politica := 'Permitir exclusao ' || tabela || ' temporario';
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = tabela and policyname = nome_politica
    ) then
      execute format('create policy %I on public.%I for delete using (true)', nome_politica, tabela);
    end if;
  end loop;
end $$;
