-- MIGRATION : 20260827030000_enable_realtime_marketing.sql
--
-- Rôle : temps réel de la section « Marketing & Promotions ».
-- Le dashboard vendeur s'abonne aux postgres_changes sur `promotions` et
-- `boosting_campaigns` (filtre vendor_id) : toute création/modification/
-- approbation côté Super Admin se reflète instantanément chez le vendeur.
--
-- Idempotent : peut être ré-exécuté sans risque.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'promotions'
  ) then
    alter publication supabase_realtime add table public.promotions;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'boosting_campaigns'
  ) then
    alter publication supabase_realtime add table public.boosting_campaigns;
  end if;
end $$;

-- Rappel Realtime/RLS : les événements ne sont délivrés qu'aux clients
-- autorisés en SELECT par la RLS (migrations 20251114_marketing_rls.sql :
-- vendeur propriétaire + Super Admin/Admin selon politique). Le flux
-- d'approbation (super_admin_approved / admin_approved) déclenchera donc
-- un événement visible du vendeur dès l'action admin, et réciproquement.
