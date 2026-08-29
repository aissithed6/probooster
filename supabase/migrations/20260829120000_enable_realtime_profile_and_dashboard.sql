-- ============================================================================
-- Activer le Realtime pour user_profiles (et autres tables du dashboard client)
-- ============================================================================
-- La souscription `postgres_changes` sur user_profiles (AuthContext.tsx) ne
-- fonctionne QUE si la table est dans la publication `supabase_realtime`.
-- Ce script est IDEMPOTENT : il peut être relancé sans risque.
--
-- Vérif:  SELECT * FROM pg_publication_tables WHERE pubname='supabase_realtime';
-- ============================================================================

DO $$
DECLARE
  tbl_name text;
  reg text;
BEGIN
  FOREACH tbl_name IN ARRAY ARRAY[
    -- Profil (résync avatar / infos sans reconnexion)
    'user_profiles',
    -- Notifications & messagerie interne
    'user_notifications',
    'user_messages',
    -- Chat
    'chat_messages',
    'user_chats',
    -- Point booster / fidélité
    'loyalty_points',
    'point_settings',
    'point_operation_limits',
    'point_operation_fees',
    'point_exchange_rates',
    'point_withdrawal_methods',
    'point_withdrawal_method_limits',
    'point_transfer_requests',
    'point_exchange_history',
    'loyalty_reward_redemptions',
    -- Suivi de livraison & événements
    'deliveries',
    'delivery_events'
  ]
  LOOP
    -- Ignore les tables absentes pour ne pas faire échouer tout le script.
    reg := to_regclass('public.' || tbl_name);
    IF reg IS NULL THEN
      RAISE NOTICE 'Table ignorée (absente sur le projet) : %', tbl_name;
      CONTINUE;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables pt
      WHERE pt.pubname = 'supabase_realtime'
        AND pt.schemaname = 'public'
        AND pt.tablename = tbl_name
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', tbl_name);
    END IF;
  END LOOP;
END $$;

-- Vérification (doit lister toutes les tables ci-dessus)
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;
