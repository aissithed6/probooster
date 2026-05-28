-- Delivery workflow: events + proofs + storage bucket + RLS
-- Objectif: tracer l'acceptation/refus (motifs), l'arrivée à destination, la livraison effectuée, la livraison reçue,
-- et lier une preuve photo (super admin + client).

-- =====================================================
-- 1) delivery_events (si absent)
-- =====================================================
create table if not exists public.delivery_events (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references public.deliveries(id) on delete cascade,
  event_type text null,
  status text null,
  description text null,
  location text null,
  latitude double precision null,
  longitude double precision null,
  occurred_at timestamptz null,
  created_at timestamptz not null default now(),
  data jsonb null
);

create index if not exists delivery_events_delivery_id_idx on public.delivery_events (delivery_id);
create index if not exists delivery_events_occurred_at_idx on public.delivery_events (occurred_at);
create index if not exists delivery_events_created_at_idx on public.delivery_events (created_at);

-- RLS: lecture autorisée aux parties prenantes de la livraison et aux super admins.
alter table public.delivery_events enable row level security;

-- Helper: super admin (déjà présent dans une migration chat, on le re-crée en idempotent)
create or replace function public.is_super_admin_uid(p_uid uuid)
returns boolean
language sql
stable
security definer
as $$
  select exists(
    select 1
    from public.users u
    where u.id = p_uid
      and lower(coalesce(u.role, '')) = 'super_admin'
  );
$$;

-- Helper: l'utilisateur fait partie de la livraison (client/vendor/driver)
create or replace function public.is_delivery_party(p_delivery_id uuid, p_uid uuid)
returns boolean
language sql
stable
security definer
as $$
  select exists(
    select 1
    from public.deliveries d
    where d.id = p_delivery_id
      and (
        d.customer_id = p_uid
        or d.vendor_id = p_uid
        or d.driver_id = p_uid
      )
  );
$$;

drop policy if exists "delivery_events_select" on public.delivery_events;
create policy "delivery_events_select"
on public.delivery_events
for select
using (
  public.is_super_admin_uid(auth.uid())
  or public.is_delivery_party(delivery_events.delivery_id, auth.uid())
);

-- Insert events: service_role (routes API serveur) ou super_admin.
-- Note: les routes driver/client passent déjà côté serveur (getSupabaseAdmin), donc service_role suffit.
drop policy if exists "delivery_events_insert_service" on public.delivery_events;
create policy "delivery_events_insert_service"
on public.delivery_events
for insert
with check (
  auth.role() = 'service_role'
  or public.is_super_admin_uid(auth.uid())
);

-- =====================================================
-- 2) delivery_proofs (preuve photo)
-- =====================================================
create table if not exists public.delivery_proofs (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references public.deliveries(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  uploaded_by uuid not null,
  proof_type text not null default 'photo' check (proof_type in ('photo')),
  storage_bucket text not null default 'delivery-proofs',
  storage_path text not null,
  public_url text null,
  metadata jsonb null,
  created_at timestamptz not null default now()
);

create index if not exists delivery_proofs_delivery_id_idx on public.delivery_proofs (delivery_id);
create index if not exists delivery_proofs_order_id_idx on public.delivery_proofs (order_id);
create index if not exists delivery_proofs_created_at_idx on public.delivery_proofs (created_at);

alter table public.delivery_proofs enable row level security;

-- Lecture: super admin + client uniquement (choix du user)
create or replace function public.can_read_delivery_proof(p_delivery_id uuid, p_uid uuid)
returns boolean
language sql
stable
security definer
as $$
  select exists(
    select 1
    from public.deliveries d
    where d.id = p_delivery_id
      and (
        public.is_super_admin_uid(p_uid)
        or d.customer_id = p_uid
      )
  );
$$;

drop policy if exists "delivery_proofs_select" on public.delivery_proofs;
create policy "delivery_proofs_select"
on public.delivery_proofs
for select
using (public.can_read_delivery_proof(delivery_proofs.delivery_id, auth.uid()));

-- Insertion: service_role uniquement (upload par route serveur)
drop policy if exists "delivery_proofs_insert_service" on public.delivery_proofs;
create policy "delivery_proofs_insert_service"
on public.delivery_proofs
for insert
with check (auth.role() = 'service_role');

-- =====================================================
-- 3) Storage bucket: delivery-proofs
-- =====================================================
-- Bucket public: OUI (plus simple pour affichage), mais l'accès DB est limité par RLS sur delivery_proofs.
insert into storage.buckets (id, name, public)
values ('delivery-proofs', 'delivery-proofs', true)
on conflict (id) do update set public = excluded.public;

-- Policies storage.objects (écriture): service_role (upload serveur)
-- NB: si tu veux du direct-upload client plus tard, on ajustera ces policies.
do $$
begin
  -- Sur Supabase, l'utilisateur SQL courant n'est généralement pas propriétaire de storage.objects.
  -- On rend donc cette section non-bloquante: l'upload côté serveur (service_role) fonctionne déjà.
  begin
    alter table storage.objects enable row level security;

    drop policy if exists "delivery_proofs_objects_insert_service" on storage.objects;
    create policy "delivery_proofs_objects_insert_service"
      on storage.objects
      for insert
      to authenticated
      with check (
        bucket_id = 'delivery-proofs'
        and auth.role() = 'service_role'
      );
  exception
    when insufficient_privilege then
      null;
    when undefined_table then
      null;
  end;
end
$$;

-- Lecture publique autorisée car bucket public.

-- =====================================================
-- 4) Colonnes de confort sur deliveries (non obligatoires mais utiles)
-- =====================================================
-- On garde les statuts existants, mais on ajoute des timestamps optionnels pour requêtes rapides.
alter table if exists public.deliveries
  add column if not exists driver_delivered_at timestamptz null,
  add column if not exists client_received_at timestamptz null,
  add column if not exists arrived_at timestamptz null;

create index if not exists deliveries_driver_delivered_at_idx on public.deliveries (driver_delivered_at);
create index if not exists deliveries_client_received_at_idx on public.deliveries (client_received_at);
create index if not exists deliveries_arrived_at_idx on public.deliveries (arrived_at);
