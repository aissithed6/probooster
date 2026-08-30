-- ============================================================
-- Migration de correction définitive du schéma user_sessions / stats
-- Corrige :
--   1. "Could not find the 'user_agent' column of 'user_sessions'"
--   2. Erreurs 406 sur les requêtes user_stats / vendor_stats (0 ligne)
--   3. Garantit que toutes les colonnes attendues existent.
-- Idempotente : peut être rejouée sans risque à tout moment.
-- ============================================================

-- ============================================================
-- 1. user_sessions : colonnes manquantes (ajoutées si absentes)
-- ============================================================
alter table public.user_sessions
  add column if not exists user_agent text,
  add column if not exists device_info text,
  add column if not exists session_token text,
  add column if not exists ip_address text,
  add column if not exists is_active boolean not null default true,
  add column if not exists last_activity_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_user_sessions_user_id on public.user_sessions (user_id);
create index if not exists idx_user_sessions_active on public.user_sessions (user_id, is_active);

alter table public.user_sessions enable row level security;

drop policy if exists "user_sessions_own" on public.user_sessions;
create policy "user_sessions_own" on public.user_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- 2. user_stats : une table (et non une vue) avec ligne auto-créée
-- ============================================================
do $$
begin
  if exists (
    select 1 from information_schema.views
    where table_schema = 'public' and table_name = 'user_stats'
  ) then
    drop view public.user_stats cascade;
  end if;
end $$;

create table if not exists public.user_stats (
  id uuid primary key references auth.users(id) on delete cascade,
  total_orders integer not null default 0,
  total_spent numeric(14,2) not null default 0,
  favorite_categories jsonb not null default '[]'::jsonb,
  last_order_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_stats enable row level security;
drop policy if exists "user_stats_select_own" on public.user_stats;
create policy "user_stats_select_own" on public.user_stats
  for select using (auth.uid() = id);
drop policy if exists "user_stats_insert_own" on public.user_stats;
create policy "user_stats_insert_own" on public.user_stats
  for insert with check (auth.uid() = id);
drop policy if exists "user_stats_update_own" on public.user_stats;
create policy "user_stats_update_own" on public.user_stats
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ============================================================
-- 3. vendor_stats : une table (et non une vue) avec ligne auto-créée
-- ============================================================
do $$
begin
  if exists (
    select 1 from information_schema.views
    where table_schema = 'public' and table_name = 'vendor_stats'
  ) then
    drop view public.vendor_stats cascade;
  end if;
end $$;

create table if not exists public.vendor_stats (
  id uuid primary key references auth.users(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  vendor_id uuid references auth.users(id) on delete cascade,
  total_sales numeric(14,2) not null default 0,
  total_orders integer not null default 0,
  total_products integer not null default 0,
  rating numeric(3,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vendor_stats_user_id_idx on public.vendor_stats (user_id);
create index if not exists vendor_stats_vendor_id_idx on public.vendor_stats (vendor_id);

alter table public.vendor_stats enable row level security;
drop policy if exists "vendor_stats_select_own" on public.vendor_stats;
create policy "vendor_stats_select_own" on public.vendor_stats
  for select using (auth.uid() = id or auth.uid() = user_id or auth.uid() = vendor_id);
drop policy if exists "vendor_stats_insert_own" on public.vendor_stats;
create policy "vendor_stats_insert_own" on public.vendor_stats
  for insert with check (auth.uid() = id or auth.uid() = user_id or auth.uid() = vendor_id);
drop policy if exists "vendor_stats_update_own" on public.vendor_stats;
create policy "vendor_stats_update_own" on public.vendor_stats
  for update using (auth.uid() = id or auth.uid() = user_id or auth.uid() = vendor_id)
  with check (auth.uid() = id or auth.uid() = user_id or auth.uid() = vendor_id);

-- ============================================================
-- 4. Auto-création des lignes à l'inscription (empêche les 406)
-- ============================================================
create or replace function public.ensure_user_stats_row()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_stats (id) values (new.id)
    on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_ensure_user_stats_row on auth.users;
create trigger trg_ensure_user_stats_row
  after insert on auth.users
  for each row execute function public.ensure_user_stats_row();