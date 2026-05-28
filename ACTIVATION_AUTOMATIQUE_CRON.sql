-- ============================================
-- ACTIVATION AUTOMATIQUE DES CAMPAGNES ET PROMOTIONS
-- ============================================
-- Date: 2025-10-07
-- Description: Scripts pour activer/désactiver automatiquement les campagnes et promotions
-- À exécuter via Supabase Cron Jobs ou manuellement
-- ============================================

-- ============================================
-- 1. FONCTION D'ACTIVATION AUTOMATIQUE DES CAMPAGNES
-- ============================================

-- Supprimer les anciennes fonctions si elles existent
DROP FUNCTION IF EXISTS auto_activate_paid_campaigns();
DROP FUNCTION IF EXISTS deactivate_expired_campaigns();
DROP FUNCTION IF EXISTS deactivate_expired_promotions();
DROP FUNCTION IF EXISTS run_marketing_automation();
DROP FUNCTION IF EXISTS run_marketing_automation_with_logging();

-- Active les campagnes payées qui sont prêtes à démarrer
CREATE OR REPLACE FUNCTION auto_activate_paid_campaigns()
RETURNS TABLE (
  activated_count INTEGER,
  campaign_ids UUID[]
) AS $$
DECLARE
  v_activated_count INTEGER;
  v_campaign_ids UUID[];
BEGIN
  -- Activer les campagnes payées en attente
  WITH activated AS (
    UPDATE boosting_campaigns
    SET 
      status = 'active',
      start_date = COALESCE(start_date, NOW()),
      updated_at = NOW()
    WHERE payment_status = 'paid'
      AND status = 'pending'
      AND (start_date IS NULL OR start_date <= NOW())
      AND (end_date IS NULL OR end_date >= NOW())
    RETURNING id
  )
  SELECT 
    COUNT(*)::INTEGER,
    ARRAY_AGG(id)
  INTO v_activated_count, v_campaign_ids
  FROM activated;

  RETURN QUERY SELECT v_activated_count, v_campaign_ids;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. FONCTION DE DÉSACTIVATION DES CAMPAGNES EXPIRÉES
-- ============================================

-- Désactive les campagnes dont la date de fin est dépassée
CREATE OR REPLACE FUNCTION deactivate_expired_campaigns()
RETURNS TABLE (
  deactivated_count INTEGER,
  campaign_ids UUID[]
) AS $$
DECLARE
  v_deactivated_count INTEGER;
  v_campaign_ids UUID[];
BEGIN
  -- Désactiver les campagnes expirées
  WITH deactivated AS (
    UPDATE boosting_campaigns
    SET 
      status = 'completed',
      updated_at = NOW()
    WHERE status = 'active'
      AND end_date < NOW()
    RETURNING id
  )
  SELECT 
    COUNT(*)::INTEGER,
    ARRAY_AGG(id)
  INTO v_deactivated_count, v_campaign_ids
  FROM deactivated;

  RETURN QUERY SELECT v_deactivated_count, v_campaign_ids;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. FONCTION DE DÉSACTIVATION DES PROMOTIONS EXPIRÉES
-- ============================================

-- Désactive les promotions dont la date de fin est dépassée
CREATE OR REPLACE FUNCTION deactivate_expired_promotions()
RETURNS TABLE (
  deactivated_count INTEGER,
  promotion_ids UUID[]
) AS $$
DECLARE
  v_deactivated_count INTEGER;
  v_promotion_ids UUID[];
BEGIN
  -- Désactiver les promotions expirées
  WITH deactivated AS (
    UPDATE promotions
    SET 
      status = 'ended',
      updated_at = NOW()
    WHERE status = 'active'
      AND end_date < NOW()
    RETURNING id
  )
  SELECT 
    COUNT(*)::INTEGER,
    ARRAY_AGG(id)
  INTO v_deactivated_count, v_promotion_ids
  FROM deactivated;

  RETURN QUERY SELECT v_deactivated_count, v_promotion_ids;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. FONCTION PRINCIPALE - EXÉCUTER TOUTES LES TÂCHES
-- ============================================

CREATE OR REPLACE FUNCTION run_marketing_automation()
RETURNS JSON AS $$
DECLARE
  v_result JSON;
  v_activated_campaigns INTEGER;
  v_deactivated_campaigns INTEGER;
  v_deactivated_promotions INTEGER;
BEGIN
  -- Activer les campagnes payées
  SELECT activated_count INTO v_activated_campaigns
  FROM auto_activate_paid_campaigns();

  -- Désactiver les campagnes expirées
  SELECT deactivated_count INTO v_deactivated_campaigns
  FROM deactivate_expired_campaigns();

  -- Désactiver les promotions expirées
  SELECT deactivated_count INTO v_deactivated_promotions
  FROM deactivate_expired_promotions();

  -- Construire le résultat JSON
  v_result := json_build_object(
    'timestamp', NOW(),
    'campaigns_activated', COALESCE(v_activated_campaigns, 0),
    'campaigns_deactivated', COALESCE(v_deactivated_campaigns, 0),
    'promotions_deactivated', COALESCE(v_deactivated_promotions, 0),
    'success', true
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. EXÉCUTION MANUELLE (POUR TESTER)
-- ============================================

-- Exécuter toutes les tâches d'automatisation
SELECT * FROM run_marketing_automation();

-- Ou exécuter individuellement:
-- SELECT * FROM auto_activate_paid_campaigns();
-- SELECT * FROM deactivate_expired_campaigns();
-- SELECT * FROM deactivate_expired_promotions();

-- ============================================
-- 6. CONFIGURATION CRON JOB (SUPABASE)
-- ============================================

/*
Pour configurer un Cron Job dans Supabase:

1. Aller dans Database → Cron Jobs (extension pg_cron)
2. Activer l'extension si nécessaire:
   CREATE EXTENSION IF NOT EXISTS pg_cron;

3. Créer un job qui s'exécute toutes les heures:
   
   SELECT cron.schedule(
     'marketing-automation',
     '0 * * * *',  -- Toutes les heures à la minute 0
     $$SELECT run_marketing_automation()$$
   );

4. Vérifier les jobs actifs:
   SELECT * FROM cron.job;

5. Voir l'historique d'exécution:
   SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;

6. Supprimer un job si nécessaire:
   SELECT cron.unschedule('marketing-automation');
*/

-- ============================================
-- 7. LOGS ET MONITORING
-- ============================================

-- Table pour logger les exécutions automatiques
CREATE TABLE IF NOT EXISTS marketing_automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  campaigns_activated INTEGER DEFAULT 0,
  campaigns_deactivated INTEGER DEFAULT 0,
  promotions_deactivated INTEGER DEFAULT 0,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  execution_duration_ms INTEGER
);

-- Fonction améliorée avec logging
CREATE OR REPLACE FUNCTION run_marketing_automation_with_logging()
RETURNS JSON AS $$
DECLARE
  v_result JSON;
  v_start_time TIMESTAMP;
  v_end_time TIMESTAMP;
  v_duration INTEGER;
  v_activated_campaigns INTEGER;
  v_deactivated_campaigns INTEGER;
  v_deactivated_promotions INTEGER;
BEGIN
  v_start_time := clock_timestamp();

  -- Activer les campagnes payées
  SELECT activated_count INTO v_activated_campaigns
  FROM auto_activate_paid_campaigns();

  -- Désactiver les campagnes expirées
  SELECT deactivated_count INTO v_deactivated_campaigns
  FROM deactivate_expired_campaigns();

  -- Désactiver les promotions expirées
  SELECT deactivated_count INTO v_deactivated_promotions
  FROM deactivate_expired_promotions();

  v_end_time := clock_timestamp();
  v_duration := EXTRACT(MILLISECONDS FROM (v_end_time - v_start_time))::INTEGER;

  -- Logger l'exécution
  INSERT INTO marketing_automation_logs (
    campaigns_activated,
    campaigns_deactivated,
    promotions_deactivated,
    success,
    execution_duration_ms
  ) VALUES (
    COALESCE(v_activated_campaigns, 0),
    COALESCE(v_deactivated_campaigns, 0),
    COALESCE(v_deactivated_promotions, 0),
    true,
    v_duration
  );

  -- Construire le résultat JSON
  v_result := json_build_object(
    'timestamp', NOW(),
    'campaigns_activated', COALESCE(v_activated_campaigns, 0),
    'campaigns_deactivated', COALESCE(v_deactivated_campaigns, 0),
    'promotions_deactivated', COALESCE(v_deactivated_promotions, 0),
    'execution_duration_ms', v_duration,
    'success', true
  );

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  -- Logger l'erreur
  INSERT INTO marketing_automation_logs (
    success,
    error_message
  ) VALUES (
    false,
    SQLERRM
  );

  RETURN json_build_object(
    'timestamp', NOW(),
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. VÉRIFICATIONS
-- ============================================

-- Voir les campagnes en attente d'activation
SELECT id, vendor_id, type, status, payment_status, start_date, end_date
FROM boosting_campaigns
WHERE payment_status = 'paid' AND status = 'pending';

-- Voir les campagnes expirées
SELECT id, vendor_id, type, status, end_date
FROM boosting_campaigns
WHERE status = 'active' AND end_date < NOW();

-- Voir les promotions expirées
SELECT id, name, status, end_date
FROM promotions
WHERE status = 'active' AND end_date < NOW();

-- Voir les logs d'exécution
SELECT * FROM marketing_automation_logs ORDER BY execution_time DESC LIMIT 10;

-- ============================================
-- FIN DU SCRIPT
-- ============================================
