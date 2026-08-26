-- ============================================================================
-- ACTIVER_RLS_SUPPLEMENTAIRES.sql
-- ============================================================================
-- À EXÉCUTER DANS LE SQL EDITOR SUPABASE
--
-- Complète les RLS pour la synchronisation REALTIME des sections qui en sont
-- privées. Le Realtime (postgres_changes) n'envoie des événements à un client
-- QUE s'il possède une politique SELECT sur la table concernée.
--
-- Tables couvertes ICI (manquantes dans les 3 scripts précédents) :
--   - deliveries          (suivi de livraison)   -> client = détenteur de la commande
--   - delivery_events     (événements du suivi)  -> via livraison du client
--   - delivery_preferences (préférences livraison)
--   - loyalty_points       (point booster)
--
-- IDEMPOTENT (peut être relancé sans risque).
-- ============================================================================

-- 1) deliveries : le client lit ses propres livraisons (realtime + fallback)
ALTER TABLE IF EXISTS public.deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deliveries_select_own_customer" ON public.deliveries;
CREATE POLICY "deliveries_select_own_customer"
  ON public.deliveries
  FOR SELECT
  TO authenticated
  USING (
    auth.role() = 'service_role'
    OR (auth.uid() IS NOT NULL AND customer_id = auth.uid())
  );

-- 2) delivery_events : événements liés aux livraisons du client
--    (Le Realtime sur deliveries_events est optionnel, engagé côté actions du livreur.)
ALTER TABLE IF EXISTS public.delivery_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "delivery_events_select_own" ON public.delivery_events;
CREATE POLICY "delivery_events_select_own"
  ON public.delivery_events
  FOR SELECT
  TO authenticated
  USING (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.deliveries d
      WHERE d.id = delivery_events.delivery_id
        AND d.customer_id = auth.uid()
    )
  );

-- 3) delivery_preferences : préférences de livraison du client
ALTER TABLE IF EXISTS public.delivery_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "delivery_preferences_select_own" ON public.delivery_preferences;
CREATE POLICY "delivery_preferences_select_own"
  ON public.delivery_preferences
  FOR SELECT
  TO authenticated
  USING (
    auth.role() = 'service_role'
    OR (auth.uid() IS NOT NULL AND customer_id = auth.uid())
  );

DROP POLICY IF EXISTS "delivery_preferences_insert_own" ON public.delivery_preferences;
CREATE POLICY "delivery_preferences_insert_own"
  ON public.delivery_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.role() = 'service_role'
    OR (auth.uid() IS NOT NULL AND customer_id = auth.uid())
  );

DROP POLICY IF EXISTS "delivery_preferences_update_own" ON public.delivery_preferences;
CREATE POLICY "delivery_preferences_update_own"
  ON public.delivery_preferences
  FOR UPDATE
  TO authenticated
  USING (
    auth.role() = 'service_role'
    OR (auth.uid() IS NOT NULL AND customer_id = auth.uid())
  )
  WITH CHECK (
    auth.role() = 'service_role'
    OR (auth.uid() IS NOT NULL AND customer_id = auth.uid())
  );

-- 4) loyalty_points : le client lit son solde (point booster realtime)
ALTER TABLE IF EXISTS public.loyalty_points ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "loyalty_points_select_own" ON public.loyalty_points;
CREATE POLICY "loyalty_points_select_own"
  ON public.loyalty_points
  FOR SELECT
  TO authenticated
  USING (
    auth.role() = 'service_role'
    OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
  );

-- ============================================================================
-- Vérification rapide (doit lister deliveries, delivery_events,
-- delivery_preferences, loyalty_points avec leurs politiques SELECT)
-- ============================================================================
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('deliveries','delivery_events','delivery_preferences','loyalty_points')
ORDER BY tablename, policyname;