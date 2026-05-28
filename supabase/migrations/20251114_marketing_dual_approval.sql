-- =========================================================
-- Migration: Marketing dual-approval & promotions harmonization
-- Date: 2025-11-14
-- =========================================================

-- Extensions utiles
create extension if not exists pgcrypto;

-- =========================================================
-- boosting_campaigns: double approbation (super admin + admin)
-- =========================================================
alter table if exists public.boosting_campaigns
  add column if not exists super_admin_approved boolean not null default false,
  add column if not exists admin_approved boolean not null default false,
  add column if not exists approved_by_super_admin uuid null,
  add column if not exists approved_by_admin uuid null,
  add column if not exists approved_at timestamptz null,
  add column if not exists created_by uuid null,
  add column if not exists created_by_role text null;

-- Index utilitaires
create index if not exists idx_boosting_campaigns_status on public.boosting_campaigns (status);
create index if not exists idx_boosting_campaigns_vendor on public.boosting_campaigns (vendor_id);

-- =========================================================
-- promotions: harmonisation colonnes et index
-- =========================================================
alter table if exists public.promotions
  add column if not exists created_by uuid null,
  add column if not exists usage_limit_per_user integer not null default 1,
  add column if not exists used_count integer not null default 0,
  add column if not exists target_audience text[] not null default '{}',
  add column if not exists applicable_products text[] not null default '{}',
  add column if not exists applicable_categories text[] not null default '{}',
  add column if not exists applicable_vendors text[] not null default '{}',
  add column if not exists is_auto_apply boolean not null default false;

-- Index pour sélection client et filtrage
create index if not exists idx_promotions_active_dates on public.promotions (status, start_date, end_date);
create index if not exists idx_promotions_created_by on public.promotions (created_by);

-- Notes:
-- - Les campagnes créées par le super admin peuvent être auto-approuvées côté API.
-- - Les promotions actives sont celles dont le statut est 'active' et la date courante entre start_date et end_date.
