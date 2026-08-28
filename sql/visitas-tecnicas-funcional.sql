create extension if not exists "pgcrypto";

create table if not exists public.visitas_tecnicas (
  id uuid primary key default gen_random_uuid(),
  cliente_nome text not null,
  tipo text default 'Avaliacao tecnica',
  tecnico text,
  data_visita date,
  horario time,
  status text default 'Agendada',
  prioridade text default 'Normal',
  endereco text,
  telefone text,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.visitas_tecnicas add column if not exists cliente_nome text;
alter table public.visitas_tecnicas add column if not exists tipo text default 'Avaliacao tecnica';
alter table public.visitas_tecnicas add column if not exists tecnico text;
alter table public.visitas_tecnicas add column if not exists data_visita date;
alter table public.visitas_tecnicas add column if not exists horario time;
alter table public.visitas_tecnicas add column if not exists status text default 'Agendada';
alter table public.visitas_tecnicas add column if not exists prioridade text default 'Normal';
alter table public.visitas_tecnicas add column if not exists endereco text;
alter table public.visitas_tecnicas add column if not exists telefone text;
alter table public.visitas_tecnicas add column if not exists observacoes text;
alter table public.visitas_tecnicas add column if not exists created_at timestamptz not null default now();
alter table public.visitas_tecnicas add column if not exists updated_at timestamptz not null default now();

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_visitas_tecnicas_updated_at on public.visitas_tecnicas;

create trigger set_visitas_tecnicas_updated_at
before update on public.visitas_tecnicas
for each row
execute function public.set_updated_at();

create index if not exists visitas_tecnicas_data_idx
on public.visitas_tecnicas (data_visita, horario);

alter table public.visitas_tecnicas enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'visitas_tecnicas'
      and policyname = 'Permitir leitura visitas temporario'
  ) then
    create policy "Permitir leitura visitas temporario"
    on public.visitas_tecnicas
    for select
    using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'visitas_tecnicas'
      and policyname = 'Permitir cadastro visitas temporario'
  ) then
    create policy "Permitir cadastro visitas temporario"
    on public.visitas_tecnicas
    for insert
    with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'visitas_tecnicas'
      and policyname = 'Permitir edicao visitas temporario'
  ) then
    create policy "Permitir edicao visitas temporario"
    on public.visitas_tecnicas
    for update
    using (true)
    with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'visitas_tecnicas'
      and policyname = 'Permitir exclusao visitas temporario'
  ) then
    create policy "Permitir exclusao visitas temporario"
    on public.visitas_tecnicas
    for delete
    using (true);
  end if;
end $$;
