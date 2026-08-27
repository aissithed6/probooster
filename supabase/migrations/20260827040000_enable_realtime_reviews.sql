-- MIGRATION : 20260827040000_enable_realtime_reviews.sql
--
-- Rôle : temps réel de la section « Avis & Réputation » vendeur.
-- Le dashboard vendeur s'abonne aux postgres_changes sur product_reviews
-- et product_review_responses : nouveau client avis / nouvelle réponse /
-- changement de statut (modération) refléter instantanément côté vendeur.
--
-- Idempotent : peut être ré-exécuté sans risque.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'product_reviews'
  ) then
    alter publication supabase_realtime add table public.product_reviews;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'product_review_responses'
  ) then
    alter publication supabase_realtime add table public.product_review_responses;
  end if;
end $$;

-- Rappel Realtime/RLS : événement délivré seulement aux clients autorisés
-- en SELECT. Les avis/réponses sont liés aux produits du vendeur → vérifier
-- les politiques RLS afin que le vendeur reçoive les changements de ses produits.
