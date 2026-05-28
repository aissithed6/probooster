-- RLS for Reviews & Reputation (product reviews satellite tables + super admin settings)
-- Objectif:
-- - Super Admin: accès total
-- - Vendeur: répondre (responses) et signaler (flags) sur ses propres lignes uniquement
-- - Éviter toute régression: policies idempotentes, tables ciblées en IF EXISTS

-- =====================================================================================
-- Helpers (roles)
-- =====================================================================================

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
      and lower(replace(coalesce(u.role, ''), '-', '_')) in ('super_admin', 'superadmin', 'admin')
  );
$$;

create or replace function public.is_vendor_uid(p_uid uuid)
returns boolean
language sql
stable
security definer
as $$
  select exists(
    select 1
    from public.users u
    where u.id = p_uid
      and lower(replace(coalesce(u.role, ''), '-', '_')) in ('vendor', 'seller')
  );
$$;

-- =====================================================================================
-- product_review_responses
-- =====================================================================================

alter table if exists public.product_review_responses enable row level security;

drop policy if exists "product_review_responses_select_super_admin_or_vendor" on public.product_review_responses;
create policy "product_review_responses_select_super_admin_or_vendor"
  on public.product_review_responses
  for select
  to authenticated
  using (
    auth.role() = 'service_role'
    or public.is_super_admin_uid(auth.uid())
    or (public.is_vendor_uid(auth.uid()) and vendor_id = auth.uid())
  );

drop policy if exists "product_review_responses_insert_vendor_pending" on public.product_review_responses;
create policy "product_review_responses_insert_vendor_pending"
  on public.product_review_responses
  for insert
  to authenticated
  with check (
    auth.role() = 'service_role'
    or (
      public.is_vendor_uid(auth.uid())
      and vendor_id = auth.uid()
      and coalesce(status, 'pending') = 'pending'
    )
  );

drop policy if exists "product_review_responses_update_vendor_pending_or_super_admin" on public.product_review_responses;
create policy "product_review_responses_update_vendor_pending_or_super_admin"
  on public.product_review_responses
  for update
  to authenticated
  using (
    auth.role() = 'service_role'
    or public.is_super_admin_uid(auth.uid())
    or (public.is_vendor_uid(auth.uid()) and vendor_id = auth.uid() and coalesce(status, 'pending') = 'pending')
  )
  with check (
    auth.role() = 'service_role'
    or public.is_super_admin_uid(auth.uid())
    or (public.is_vendor_uid(auth.uid()) and vendor_id = auth.uid() and coalesce(status, 'pending') = 'pending')
  );

drop policy if exists "product_review_responses_delete_super_admin" on public.product_review_responses;
create policy "product_review_responses_delete_super_admin"
  on public.product_review_responses
  for delete
  to authenticated
  using (
    auth.role() = 'service_role'
    or public.is_super_admin_uid(auth.uid())
  );

-- =====================================================================================
-- product_review_flags
-- =====================================================================================

alter table if exists public.product_review_flags enable row level security;

drop policy if exists "product_review_flags_select_super_admin_or_reporter" on public.product_review_flags;
create policy "product_review_flags_select_super_admin_or_reporter"
  on public.product_review_flags
  for select
  to authenticated
  using (
    auth.role() = 'service_role'
    or public.is_super_admin_uid(auth.uid())
    or reporter_id = auth.uid()
  );

drop policy if exists "product_review_flags_insert_reporter" on public.product_review_flags;
create policy "product_review_flags_insert_reporter"
  on public.product_review_flags
  for insert
  to authenticated
  with check (
    auth.role() = 'service_role'
    or (
      auth.uid() is not null
      and reporter_id = auth.uid()
    )
  );

drop policy if exists "product_review_flags_update_super_admin" on public.product_review_flags;
create policy "product_review_flags_update_super_admin"
  on public.product_review_flags
  for update
  to authenticated
  using (
    auth.role() = 'service_role'
    or public.is_super_admin_uid(auth.uid())
  )
  with check (
    auth.role() = 'service_role'
    or public.is_super_admin_uid(auth.uid())
  );

drop policy if exists "product_review_flags_delete_super_admin" on public.product_review_flags;
create policy "product_review_flags_delete_super_admin"
  on public.product_review_flags
  for delete
  to authenticated
  using (
    auth.role() = 'service_role'
    or public.is_super_admin_uid(auth.uid())
  );

-- =====================================================================================
-- product_review_moderation_events
-- =====================================================================================

alter table if exists public.product_review_moderation_events enable row level security;

drop policy if exists "product_review_moderation_events_select_super_admin" on public.product_review_moderation_events;
create policy "product_review_moderation_events_select_super_admin"
  on public.product_review_moderation_events
  for select
  to authenticated
  using (
    auth.role() = 'service_role'
    or public.is_super_admin_uid(auth.uid())
  );

drop policy if exists "product_review_moderation_events_insert_super_admin" on public.product_review_moderation_events;
create policy "product_review_moderation_events_insert_super_admin"
  on public.product_review_moderation_events
  for insert
  to authenticated
  with check (
    auth.role() = 'service_role'
    or public.is_super_admin_uid(auth.uid())
  );

drop policy if exists "product_review_moderation_events_update_super_admin" on public.product_review_moderation_events;
create policy "product_review_moderation_events_update_super_admin"
  on public.product_review_moderation_events
  for update
  to authenticated
  using (
    auth.role() = 'service_role'
    or public.is_super_admin_uid(auth.uid())
  )
  with check (
    auth.role() = 'service_role'
    or public.is_super_admin_uid(auth.uid())
  );

drop policy if exists "product_review_moderation_events_delete_super_admin" on public.product_review_moderation_events;
create policy "product_review_moderation_events_delete_super_admin"
  on public.product_review_moderation_events
  for delete
  to authenticated
  using (
    auth.role() = 'service_role'
    or public.is_super_admin_uid(auth.uid())
  );

-- =====================================================================================
-- super_admin_settings
-- =====================================================================================

alter table if exists public.super_admin_settings enable row level security;

drop policy if exists "super_admin_settings_select_super_admin" on public.super_admin_settings;
create policy "super_admin_settings_select_super_admin"
  on public.super_admin_settings
  for select
  to authenticated
  using (
    auth.role() = 'service_role'
    or public.is_super_admin_uid(auth.uid())
  );

drop policy if exists "super_admin_settings_insert_super_admin" on public.super_admin_settings;
create policy "super_admin_settings_insert_super_admin"
  on public.super_admin_settings
  for insert
  to authenticated
  with check (
    auth.role() = 'service_role'
    or public.is_super_admin_uid(auth.uid())
  );

drop policy if exists "super_admin_settings_update_super_admin" on public.super_admin_settings;
create policy "super_admin_settings_update_super_admin"
  on public.super_admin_settings
  for update
  to authenticated
  using (
    auth.role() = 'service_role'
    or public.is_super_admin_uid(auth.uid())
  )
  with check (
    auth.role() = 'service_role'
    or public.is_super_admin_uid(auth.uid())
  );

drop policy if exists "super_admin_settings_delete_super_admin" on public.super_admin_settings;
create policy "super_admin_settings_delete_super_admin"
  on public.super_admin_settings
  for delete
  to authenticated
  using (
    auth.role() = 'service_role'
    or public.is_super_admin_uid(auth.uid())
  );
