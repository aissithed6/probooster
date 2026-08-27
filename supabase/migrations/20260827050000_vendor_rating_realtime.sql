-- MIGRATION : 20260827050000_vendor_rating_realtime.sql
--
-- Objectif : temps réel des notes/avis vendeur affichés côté public
-- (cartes vendeur, page vendeur, page produit, liste des vendeurs).
--
-- product_reviews n'a pas de colonne vendor_id (seule product_id). Pour
-- pouvoir pousser en temps réel un changement de note par vendeur, on crée
-- un « snapshot » 1 ligne / vendeur alimenté par triggers. La publication
-- Realtime porte sur ce snapshot → les clients abonnés (un seul canal
-- global) reçoivent l'événement et re-calculent la note du vendeur concerné.
--
-- Idempotent : ré-exécutable sans risque.

--------------------------------------------------------------------------------
-- 1) Table snapshot (source de lecture ultra-rapide O(1))
--------------------------------------------------------------------------------
create table if not exists public.vendor_rating_snapshot (
  vendor_id     uuid primary key,
  average_rating numeric(6,2) not null default 0,
  review_count  integer not null default 0,
  updated_at    timestamptz not null default now()
);

create index if not exists vendor_rating_snapshot_rating_idx
  on public.vendor_rating_snapshot(average_rating desc);

-- RLS : lecture publique (notes publiques), écriture réservée au serveur
-- (fonctions SECURITY DEFINER / service role).
alter table public.vendor_rating_snapshot enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='vendor_rating_snapshot' and policyname='vendor_rating_snapshot_public_select'
  ) then
    create policy vendor_rating_snapshot_public_select
      on public.vendor_rating_snapshot for select
      to anon, authenticated
      using (true);
  end if;
end $$;

--------------------------------------------------------------------------------
-- 2) Fonction : recalcule le snapshot d'UN vendeur depuis les avis approuvés
--------------------------------------------------------------------------------
create or replace function public.refresh_vendor_rating_snapshot(p_vendor uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_sum   numeric;
  v_count integer;
begin
  if p_vendor is null then
    return;
  end if;

  select coalesce(sum(r.rating), 0)::numeric,
         count(r.id)::integer
    into v_sum, v_count
    from product_reviews r
    join user_products p on p.id = r.product_id
   where p.vendor_id = p_vendor
     and r.status = 'approved';

  insert into public.vendor_rating_snapshot (vendor_id, average_rating, review_count, updated_at)
  values (p_vendor,
          case when v_count > 0 then (v_sum / v_count) else 0 end,
          v_count,
          now())
  on conflict (vendor_id)
  do update set average_rating = excluded.average_rating,
                review_count   = excluded.review_count,
                updated_at     = excluded.updated_at;
end $$;

--------------------------------------------------------------------------------
-- 3) Trigger sur product_reviews : nouveau / modif d'avis (note ou statut)
--------------------------------------------------------------------------------
create or replace function public.vendor_rating_after_review_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_vendor uuid;
begin
  select p.vendor_id into v_vendor
    from user_products p
   where p.id = coalesce(new.product_id, old.product_id);
  if v_vendor is not null then
    perform public.refresh_vendor_rating_snapshot(v_vendor);
  end if;
  return coalesce(new, old);
end $$;

drop trigger if exists trg_vendor_rating_review on public.product_reviews;
create trigger trg_vendor_rating_review
  after insert or update of product_id, rating, status on public.product_reviews
  for each row execute function public.vendor_rating_after_review_change();

--------------------------------------------------------------------------------
-- 4) Trigger sur user_products : produit attribué/réaffecté/retiré d'un vendeur
--------------------------------------------------------------------------------
create or replace function public.vendor_rating_after_product_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    if old.vendor_id is not null then
      perform public.refresh_vendor_rating_snapshot(old.vendor_id);
    end if;
    return old;
  else
    if old is not null and old.vendor_id is distinct from new.vendor_id then
      if old.vendor_id is not null then
        perform public.refresh_vendor_rating_snapshot(old.vendor_id);
      end if;
    end if;
    if new.vendor_id is not null then
      perform public.refresh_vendor_rating_snapshot(new.vendor_id);
    end if;
    return new;
  end if;
end $$;

drop trigger if exists trg_vendor_rating_product on public.user_products;
create trigger trg_vendor_rating_product
  after insert or update of vendor_id or delete on public.user_products
  for each row execute function public.vendor_rating_after_product_change();

--------------------------------------------------------------------------------
-- 5) Backfill : alimenter le snapshot pour TOUS les vendeurs existants
--------------------------------------------------------------------------------
do $$
declare
  v uuid;
begin
  for v in select distinct vendor_id from public.user_products where vendor_id is not null loop
    perform public.refresh_vendor_rating_snapshot(v);
  end loop;
end $$;

--------------------------------------------------------------------------------
-- 6) Publier le snapshot en Realtime
--------------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'vendor_rating_snapshot'
  ) then
    alter publication supabase_realtime add table public.vendor_rating_snapshot;
  end if;
end $$;
