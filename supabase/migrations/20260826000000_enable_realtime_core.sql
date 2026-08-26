-- ============================================================================
-- ACTIVATION REALTIME - TOUTES LES TABLES DU TABLEAU DE BORD CLIENT
-- ============================================================================
-- MIGRATION : 20260826000000_enable_realtime_core.sql
--
-- Rôle : les abonnements `postgres_changes` côté client (chat, notifications,
-- messagerie interne, livraisons, points, profil) ne se déclenchent QUE si la
-- table concernée fait partie de la publication `supabase_realtime`.
-- Ce script ajoute de façon IDEMPOTENTE toutes les tables utilisées par le
-- tableau de bord afin que l'UI soit synchronisée en temps réel.
--
-- Exécution : SQL Editor Supabase ou via `supabase db push`.
-- ============================================================================

DO $$
DECLARE
  tbl_name text;
  reg text;
BEGIN
  FOREACH tbl_name IN ARRAY ARRAY[
    -- Livraisons / suivi
    'deliveries',
    'delivery_events',
    'delivery_preferences',
    -- Notifications & messagerie interne
    'user_notifications',
    'user_messages',
    -- Chat
    'chat_sessions',
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
    -- Profil
    'user_profiles'
  ]
  LOOP
    -- Ignore les tables qui n'existent pas sur ce projet (empêche l'échec global).
    reg := to_regclass('public.' || tbl_name);
    IF reg IS NULL THEN
      RAISE NOTICE 'Table ignorée (absente sur le projet) : %', tbl_name;
      CONTINUE;
    END IF;

    -- Ajoute à la publication Realtime si ce n'est pas déjà fait (idempotent).
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