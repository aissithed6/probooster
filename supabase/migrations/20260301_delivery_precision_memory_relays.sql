-- Précision de livraison : mémoire d'adresses validées + points relais géolocalisés.
-- Créé pour le géocodage "intelligent" (meilleure précision au point de livraison).

-- =============================================================================
-- 1) Mémoire d'adresses de livraison validées
--    Chaque livraison réussie ("delivered" / "client_received") mémorise
--    l'adresse + la coordonnée LA PLUS PRÉCISE (pointage manuel, GPS, relais).
--    À la prochaine commande du même client, on propose automatiquement
--    cette coordonnée exacte plutôt que de re-dépendre du GPS (±10 m).
-- =============================================================================
create table if not exists public.delivery_memory (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null,
  vendor_id uuid null,
  address text,
  city text,
  latitude double precision not null,
  longitude double precision not null,
  -- Source de la coordonnée (gps / manual_pin / relay_point / previous_delivery)
  source text not null default 'gps'
    check (source in ('gps', 'manual_pin', 'relay_point', 'previous_delivery')),
  -- Profondeur de la validation : plus sa élevée, plus on y fait confiance
  confidence integer not null default 1 check (confidence between 1 and 5),
  order_id uuid null,
  metadata jsonb not null default '{}'::jsonb,
  delivery_count integer not null default 1,
  last_used_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (customer_id, latitude, longitude)
);

create index if not exists delivery_memory_customer_idx on public.delivery_memory (customer_id);
create index if not exists delivery_memory_customer_updated_idx on public.delivery_memory (customer_id, updated_at desc);
create index if not exists delivery_memory_city_idx on public.delivery_memory (city);

-- =============================================================================
-- 2) Points relais géolocalisés (carrefours, échoppes, écoles, point de dépôt)
--    Gérés par le super-admin / vendeur. Fiables AU MÈTRE car ce sont des
--    points géo connus et validés, vers lesquels on guide le livreur.
-- =============================================================================
create table if not exists public.delivery_relay_points (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  address text,
  latitude double precision not null,
  longitude double precision not null,
  -- Type du relais (carrefour / ecole / eglise / marche / boutique / depot / autre)
  relay_type text not null default 'carrefour',
  zone text,
  city text,
  vendor_id uuid null,
  is_active boolean not null default true,
  created_by uuid null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists delivery_relay_points_geo_idx on public.delivery_relay_points (latitude, longitude);
create index if not exists delivery_relay_points_city_idx on public.delivery_relay_points (city);
create index if not exists delivery_relay_points_active_idx on public.delivery_relay_points (is_active);

-- =============================================================================
-- RLS : mémoire(lisible/modifiable par le client propriétaire + super-admin),
--       points relais(lisibles par tous les clients connectés, administrés par
--       les vendeurs/super-admin).
-- =============================================================================
alter table public.delivery_memory enable row level security;
alter table public.delivery_relay_points enable row level security;

-- --- delivery_memory ---
drop policy if exists "delivery_memory_select_own" on public.delivery_memory;
create policy "delivery_memory_select_own"
  on public.delivery_memory
  for select
  using (
    auth.uid() = customer_id
    or exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'super_admin')
  );

drop policy if exists "delivery_memory_insert_own" on public.delivery_memory;
create policy "delivery_memory_insert_own"
  on public.delivery_memory
  for insert
  with check (
    auth.uid() = customer_id
    or exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'super_admin')
  );

drop policy if exists "delivery_memory_update_own" on public.delivery_memory;
create policy "delivery_memory_update_own"
  on public.delivery_memory
  for update
  using (
    auth.uid() = customer_id
    or exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'super_admin')
  );

-- --- delivery_relay_points ---
drop policy if exists "delivery_relay_points_select" on public.delivery_relay_points;
create policy "delivery_relay_points_select"
  on public.delivery_relay_points
  for select
  using (
    is_active = true
    or exists (select 1 from public.users u where u.id = auth.uid() and u.role in ('super_admin', 'vendor'))
  );

drop policy if exists "delivery_relay_points_insert" on public.delivery_relay_points;
create policy "delivery_relay_points_insert"
  on public.delivery_relay_points
  for insert
  with check (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role in ('super_admin', 'vendor'))
  );

drop policy if exists "delivery_relay_points_update" on public.delivery_relay_points;
create policy "delivery_relay_points_update"
  on public.delivery_relay_points
  for update
  using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role in ('super_admin', 'vendor'))
  );

drop policy if exists "delivery_relay_points_delete" on public.delivery_relay_points;
create policy "delivery_relay_points_delete"
  on public.delivery_relay_points
  for delete
  using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'super_admin')
  );
