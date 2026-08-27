-- MIGRATION : 20260827020000_enable_realtime_shares.sql
--
-- Rôle : activer le temps réel de la section « Partages et Engagement ».
-- Les abonnements côté client (vendor : nouveaux partages ; client : ses
-- partages ; modal détail : interactions par partage) écoutent
-- product_shares et share_interactions via postgres_changes. Sans
-- publication, ces canaux restent silencieux.
--
-- Idempotent : peut être ré-exécuté sans risque.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'product_shares'
  ) then
    alter publication supabase_realtime add table public.product_shares;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'share_interactions'
  ) then
    alter publication supabase_realtime add table public.share_interactions;
  end if;
end $$;

-- Rappel Realtime/RLS : un événement n'est délivré qu'au client autorisé en
-- SELECT sur la ligne concernée. Vérifier que product_shares / share_interactions
-- ont leurs politiques RLS (script PARTAGE_ENGAGEMENT_SUPABASE.sql) :
--   SELECT tablename, policyname FROM pg_policies
--   WHERE tablename IN ('product_shares','share_interactions');
