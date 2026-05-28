-- 🔐 Politiques RLS pour le tableau de bord client / user-facing
-- Ce script sécurise l'accès aux messages, notifications, promotions et tables de configuration des points.
-- À exécuter dans Supabase (SQL Editor) avant de relancer les tests fonctionnels.

-- =====================================================================================
-- Helpers
-- =====================================================================================

-- Active la RLS si elle n'est pas encore en place
ALTER TABLE public.user_messages           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_settings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_operation_fees    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_operation_limits  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_exchange_rates    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_withdrawal_methods ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.users                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles          ENABLE ROW LEVEL SECURITY;

-- =====================================================================================
-- user_messages : lecture/écriture réservée aux participants
-- =====================================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_messages' AND policyname = 'messages_select_for_participants'
  ) THEN
    CREATE POLICY messages_select_for_participants
      ON public.user_messages
      FOR SELECT
      USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_messages' AND policyname = 'messages_insert_by_sender'
  ) THEN
    CREATE POLICY messages_insert_by_sender
      ON public.user_messages
      FOR INSERT
      WITH CHECK (auth.uid() = sender_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_messages' AND policyname = 'messages_update_by_participants'
  ) THEN
    CREATE POLICY messages_update_by_participants
      ON public.user_messages
      FOR UPDATE
      USING (auth.uid() = sender_id OR auth.uid() = recipient_id)
      WITH CHECK (auth.uid() = sender_id OR auth.uid() = recipient_id);
  END IF;
END $$;

-- =====================================================================================
-- user_notifications : accès strictement personnel
-- =====================================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_notifications' AND policyname = 'notifications_select_for_owner'
  ) THEN
    CREATE POLICY notifications_select_for_owner
      ON public.user_notifications
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_notifications' AND policyname = 'notifications_update_for_owner'
  ) THEN
    CREATE POLICY notifications_update_for_owner
      ON public.user_notifications
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- =====================================================================================
-- promotions : consultation ouverte aux utilisateurs authentifiés
-- =====================================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'promotions' AND policyname = 'promotions_select_authenticated'
  ) THEN
    CREATE POLICY promotions_select_authenticated
      ON public.promotions
      FOR SELECT
      USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- =====================================================================================
-- Tables de configuration des points : lecture pour tous les utilisateurs authentifiés
-- =====================================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'point_settings' AND policyname = 'point_settings_select_authenticated'
  ) THEN
    CREATE POLICY point_settings_select_authenticated
      ON public.point_settings
      FOR SELECT
      USING (auth.role() = 'authenticated');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'point_operation_fees' AND policyname = 'point_fees_select_authenticated'
  ) THEN
    CREATE POLICY point_fees_select_authenticated
      ON public.point_operation_fees
      FOR SELECT
      USING (auth.role() = 'authenticated');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'point_operation_limits' AND policyname = 'point_limits_select_authenticated'
  ) THEN
    CREATE POLICY point_limits_select_authenticated
      ON public.point_operation_limits
      FOR SELECT
      USING (auth.role() = 'authenticated');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'point_exchange_rates' AND policyname = 'point_rates_select_authenticated'
  ) THEN
    CREATE POLICY point_rates_select_authenticated
      ON public.point_exchange_rates
      FOR SELECT
      USING (auth.role() = 'authenticated');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'point_withdrawal_methods' AND policyname = 'point_withdrawal_select_authenticated'
  ) THEN
    CREATE POLICY point_withdrawal_select_authenticated
      ON public.point_withdrawal_methods
      FOR SELECT
      USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- =====================================================================================
-- users / user_profiles : accès lecture simple pour éviter la récursion
-- =====================================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'users_select_self'
  ) THEN
    CREATE POLICY users_select_self
      ON public.users
      FOR SELECT
      USING (auth.uid() = id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_profiles' AND policyname = 'user_profiles_select_self'
  ) THEN
    CREATE POLICY user_profiles_select_self
      ON public.user_profiles
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- =====================================================================================
-- Fin du script
-- =====================================================================================
