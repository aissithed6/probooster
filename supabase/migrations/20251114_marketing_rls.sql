-- RLS initiale pour Marketing & Promotions
-- Active les politiques de sécurité par ligne pour limiter l'accès selon le rôle.

-- BOOSTING CAMPAIGNS
alter table if exists public.boosting_campaigns enable row level security;

-- Lecture: le vendeur peut lire ses campagnes
create policy "campaigns_vendor_select_own"
  on public.boosting_campaigns
  for select
  to authenticated
  using (vendor_id = auth.uid());

-- Lecture: admins et super admins lisent tout
create policy "campaigns_admin_select_all"
  on public.boosting_campaigns
  for select
  to authenticated
  using (exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role in ('admin','super_admin')
  ));

-- Insertion: un vendeur peut créer des campagnes pour lui-même
create policy "campaigns_vendor_insert_self"
  on public.boosting_campaigns
  for insert
  to authenticated
  with check (vendor_id = auth.uid());

-- Mise à jour: admins/super_admins peuvent tout mettre à jour (approbations, statuts)
create policy "campaigns_admin_update_all"
  on public.boosting_campaigns
  for update
  to authenticated
  using (exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role in ('admin','super_admin')
  ))
  with check (true);

-- Mise à jour: le vendeur peut modifier ses brouillons/en attente hors champs d'approbation
-- (premier jet: autoriser la mise à jour des siens, affinage ultérieur pour exclure les colonnes d'approbation)
create policy "campaigns_vendor_update_own"
  on public.boosting_campaigns
  for update
  to authenticated
  using (vendor_id = auth.uid())
  with check (vendor_id = auth.uid());

-- Suppression: admins/super_admins seulement
create policy "campaigns_admin_delete_all"
  on public.boosting_campaigns
  for delete
  to authenticated
  using (exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role in ('admin','super_admin')
  ));


-- PROMOTIONS
alter table if exists public.promotions enable row level security;

-- Lecture publique: promotions actives visibles par tous (clients inclus)
create policy "promotions_public_select_active"
  on public.promotions
  for select
  to anon, authenticated
  using (status = 'active');

-- Lecture propriétaire/admin: le créateur et l'admin peuvent lire indépendamment du statut
create policy "promotions_owner_admin_select"
  on public.promotions
  for select
  to authenticated
  using (
    created_by = auth.uid()
    or exists (select 1 from public.users u where u.id = auth.uid() and u.role in ('admin','super_admin'))
  );

-- Insertion: authentifiés peuvent créer des promos, limité à eux-mêmes
create policy "promotions_insert_owner"
  on public.promotions
  for insert
  to authenticated
  with check (created_by = auth.uid());

-- Mise à jour: admin/super_admin ou propriétaire
create policy "promotions_update_owner_admin"
  on public.promotions
  for update
  to authenticated
  using (
    created_by = auth.uid()
    or exists (select 1 from public.users u where u.id = auth.uid() and u.role in ('admin','super_admin'))
  )
  with check (
    created_by = auth.uid()
    or exists (select 1 from public.users u where u.id = auth.uid() and u.role in ('admin','super_admin'))
  );

-- Suppression: admin/super_admin ou propriétaire
create policy "promotions_delete_owner_admin"
  on public.promotions
  for delete
  to authenticated
  using (
    created_by = auth.uid()
    or exists (select 1 from public.users u where u.id = auth.uid() and u.role in ('admin','super_admin'))
  );
