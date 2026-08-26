-- ============================================================================
-- RLS SUPPLÉMENTAIRES POUR REALTIME (LIVRAISONS + POINTS)
-- ============================================================================
-- MIGRATION : 20260826000001_enable_realtime_rls_deliveries_points.sql
--
-- Le Realtime côté client ne diffuse que si l'utilisateur a une politique
-- SELECT sur la table. deliveries / delivery_events / delivery_preferences /
-- loyalty_points n'avaient aucune politique -> abonnements realtime muets.
-- Ce script ajoute les politiques SELECT (et écritures préférences) idempotentes.
-- ============================================================================

ALTER TABLE IF EXISTS public.deliveries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "deliveries_select_own_customer" ON public.deliveries;
CREATE POLICY "deliveries_select_own_customer"
  ON public.deliveries
  FOR SELECT
  TO authenticated
  USING (auth.role() = 'service_role' OR (auth.uid() IS NOT NULL AND customer_id = auth.uid()));

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
      WHERE d.id = delivery_events.delivery_id AND d.customer_id = auth.uid()
    )
  );

ALTER TABLE IF EXISTS public.delivery_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "delivery_preferences_select_own" ON public.delivery_preferences;
CREATE POLICY "delivery_preferences_select_own"
  ON public.delivery_preferences
  FOR SELECT
  TO authenticated
  USING (auth.role() = 'service_role' OR (auth.uid() IS NOT NULL AND customer_id = auth.uid()));

DROP POLICY IF EXISTS "delivery_preferences_insert_own" ON public.delivery_preferences;
CREATE POLICY "delivery_preferences_insert_own"
  ON public.delivery_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.role() = 'service_role' OR (auth.uid() IS NOT NULL AND customer_id = auth.uid()));

DROP POLICY IF EXISTS "delivery_preferences_update_own" ON public.delivery_preferences;
CREATE POLICY "delivery_preferences_update_own"
  ON public.delivery_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.role() = 'service_role' OR (auth.uid() IS NOT NULL AND customer_id = auth.uid()))
  WITH CHECK (auth.role() = 'service_role' OR (auth.uid() IS NOT NULL AND customer_id = auth.uid()));

ALTER TABLE IF EXISTS public.loyalty_points ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "loyalty_points_select_own" ON public.loyalty_points;
CREATE POLICY "loyalty_points_select_own"
  ON public.loyalty_points
  FOR SELECT
  TO authenticated
  USING (auth.role() = 'service_role' OR (auth.uid() IS NOT NULL AND user_id = auth.uid()));