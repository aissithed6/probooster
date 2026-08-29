-- Tables de statistiques manquantes (dashboard client & vendeur).
-- Idempotent : peut être rejoué sans risque.

-- ============================================================
-- user_stats (une ligne par utilisateur, id = auth.users.id)
-- ============================================================
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
create policy "user_stats_select_own"
  on public.user_stats for select
  using (auth.uid() = id);

drop policy if exists "user_stats_insert_own" on public.user_stats;
create policy "user_stats_insert_own"
  on public.user_stats for insert
  with check (auth.uid() = id);

drop policy if exists "user_stats_update_own" on public.user_stats;
create policy "user_stats_update_own"
  on public.user_stats for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ============================================================
-- vendor_stats (une ligne par vendeur, id = auth.users.id du vendeur)
-- ============================================================
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
create policy "vendor_stats_select_own"
  on public.vendor_stats for select
  using (auth.uid() = id or auth.uid() = user_id or auth.uid() = vendor_id);

drop policy if exists "vendor_stats_insert_own" on public.vendor_stats;
create policy "vendor_stats_insert_own"
  on public.vendor_stats for insert
  with check (auth.uid() = id or auth.uid() = user_id or auth.uid() = vendor_id);

drop policy if exists "vendor_stats_update_own" on public.vendor_stats;
create policy "vendor_stats_update_own"
  on public.vendor_stats for update
  using (auth.uid() = id or auth.uid() = user_id or auth.uid() = vendor_id)
  with check (auth.uid() = id or auth.uid() = user_id or auth.uid() = vendor_id);

-- ============================================================
-- user_sessions : colonne last_activity_at manquante si la table
-- a été créée avant la migration 20260828120000.
-- ============================================================
alter table public.user_sessions
  add column if not exists last_activity_at timestamptz;

-- ============================================================
-- Publication realtime (optionnel mais utile pour les dashboards)
-- ============================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename in ('user_stats','vendor_stats')
  ) then
    begin
      alter publication supabase_realtime add table public.user_stats;
    exception when others then null;
    end;
    begin
      alter publication supabase_realtime add table public.vendor_stats;
    exception when others then null;
    end;
  end if;
end $$;