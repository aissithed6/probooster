-- ============================================
-- SCRIPT DE VÉRIFICATION SYSTÈME MARKETING
-- ============================================
-- Date: 2025-10-07
-- Objectif: Vérifier que tout est correctement configuré
-- ============================================

-- ============================================
-- 1. VÉRIFICATION DES TABLES
-- ============================================

DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN (
    'boosting_services',
    'boosting_campaigns',
    'boosting_performance',
    'promotions',
    'promotion_usage',
    'boosting_pricing'
  );
  
  RAISE NOTICE '✅ Tables trouvées: % / 6', table_count;
  
  IF table_count < 6 THEN
    RAISE WARNING '⚠️ Certaines tables sont manquantes! Exécutez MARKETING_PROMOTIONS_COMPLET.sql';
  ELSE
    RAISE NOTICE '✅ Toutes les tables existent!';
  END IF;
END $$;

-- ============================================
-- 2. VÉRIFICATION DES SERVICES PAR DÉFAUT
-- ============================================

DO $$
DECLARE
  service_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO service_count
  FROM boosting_services
  WHERE is_active = true;
  
  RAISE NOTICE '✅ Services actifs: %', service_count;
  
  IF service_count < 3 THEN
    RAISE WARNING '⚠️ Moins de 3 services actifs! Vérifiez les données par défaut.';
  ELSE
    RAISE NOTICE '✅ Services par défaut configurés!';
  END IF;
END $$;

-- Afficher les services:
SELECT 
  name,
  type,
  base_price,
  pricing_model,
  is_active
FROM boosting_services
ORDER BY created_at;

-- ============================================
-- 3. VÉRIFICATION DES FONCTIONS
-- ============================================

DO $$
DECLARE
  function_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO function_count
  FROM information_schema.routines 
  WHERE routine_schema = 'public'
  AND routine_name IN (
    'auto_activate_paid_campaigns',
    'deactivate_expired_campaigns',
    'deactivate_expired_promotions',
    'run_marketing_automation',
    'run_marketing_automation_with_logging'
  );
  
  RAISE NOTICE '✅ Fonctions trouvées: % / 5', function_count;
  
  IF function_count < 5 THEN
    RAISE WARNING '⚠️ Certaines fonctions sont manquantes! Exécutez ACTIVATION_AUTOMATIQUE_CRON.sql';
  ELSE
    RAISE NOTICE '✅ Toutes les fonctions d''automatisation existent!';
  END IF;
END $$;

-- ============================================
-- 4. VÉRIFICATION DU CRON JOB
-- ============================================

DO $$
DECLARE
  cron_exists BOOLEAN;
  cron_active BOOLEAN;
BEGIN
  -- Vérifier si pg_cron est installé
  SELECT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) INTO cron_exists;
  
  IF NOT cron_exists THEN
    RAISE WARNING '⚠️ Extension pg_cron non installée! Exécutez: CREATE EXTENSION pg_cron;';
  ELSE
    RAISE NOTICE '✅ Extension pg_cron installée!';
    
    -- Vérifier si le job existe
    SELECT EXISTS (
      SELECT 1 FROM cron.job WHERE jobname = 'marketing-automation'
    ) INTO cron_active;
    
    IF NOT cron_active THEN
      RAISE WARNING '⚠️ Cron Job non configuré! Consultez GUIDE_CONFIGURATION_CRON_JOB.md';
    ELSE
      RAISE NOTICE '✅ Cron Job configuré!';
      
      -- Afficher les détails du job
      SELECT 
        jobname,
        schedule,
        active,
        jobid
      FROM cron.job 
      WHERE jobname = 'marketing-automation';
    END IF;
  END IF;
END $$;

-- ============================================
-- 5. VÉRIFICATION DES POLITIQUES RLS
-- ============================================

DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE tablename IN (
    'boosting_services',
    'boosting_campaigns',
    'boosting_performance',
    'promotions',
    'promotion_usage'
  );
  
  RAISE NOTICE '✅ Politiques RLS trouvées: %', policy_count;
  
  IF policy_count < 10 THEN
    RAISE WARNING '⚠️ Certaines politiques RLS sont manquantes!';
  ELSE
    RAISE NOTICE '✅ RLS correctement configuré!';
  END IF;
END $$;

-- ============================================
-- 6. VÉRIFICATION DES TRIGGERS
-- ============================================

DO $$
DECLARE
  trigger_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO trigger_count
  FROM information_schema.triggers
  WHERE event_object_table IN (
    'boosting_services',
    'boosting_campaigns',
    'promotions'
  );
  
  RAISE NOTICE '✅ Triggers trouvés: %', trigger_count;
  
  IF trigger_count < 3 THEN
    RAISE WARNING '⚠️ Certains triggers sont manquants!';
  ELSE
    RAISE NOTICE '✅ Triggers configurés!';
  END IF;
END $$;

-- ============================================
-- 7. TEST D'EXÉCUTION AUTOMATISATION
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '🧪 Test de l''automatisation...';
END $$;

-- Exécuter la fonction d'automatisation:
SELECT * FROM run_marketing_automation_with_logging();

-- Vérifier les logs:
SELECT 
  execution_time,
  campaigns_activated,
  campaigns_deactivated,
  promotions_deactivated,
  execution_duration_ms,
  success,
  error_message
FROM marketing_automation_logs
ORDER BY execution_time DESC
LIMIT 1;

-- ============================================
-- 8. STATISTIQUES ACTUELLES
-- ============================================

-- Services:
SELECT 
  'Services Actifs' AS metric,
  COUNT(*) AS value
FROM boosting_services
WHERE is_active = true

UNION ALL

-- Campagnes:
SELECT 
  'Campagnes Actives' AS metric,
  COUNT(*) AS value
FROM boosting_campaigns
WHERE status = 'active'

UNION ALL

SELECT 
  'Campagnes En Attente' AS metric,
  COUNT(*) AS value
FROM boosting_campaigns
WHERE status = 'pending'

UNION ALL

-- Promotions:
SELECT 
  'Promotions Actives' AS metric,
  COUNT(*) AS value
FROM promotions
WHERE status = 'active'

UNION ALL

-- Performances:
SELECT 
  'Enregistrements Performance' AS metric,
  COUNT(*) AS value
FROM boosting_performance

UNION ALL

-- Utilisations:
SELECT 
  'Utilisations Promotions' AS metric,
  COUNT(*) AS value
FROM promotion_usage;

-- ============================================
-- 9. CAMPAGNES À ACTIVER
-- ============================================

-- Campagnes payées en attente d'activation:
SELECT 
  id,
  vendor_id,
  type,
  status,
  payment_status,
  total_cost,
  created_at
FROM boosting_campaigns
WHERE status = 'pending'
AND payment_status = 'paid'
ORDER BY created_at;

-- ============================================
-- 10. CAMPAGNES À DÉSACTIVER
-- ============================================

-- Campagnes expirées encore actives:
SELECT 
  id,
  vendor_id,
  type,
  status,
  end_date,
  EXTRACT(DAY FROM (NOW() - end_date)) AS days_expired
FROM boosting_campaigns
WHERE status = 'active'
AND end_date < NOW()
ORDER BY end_date;

-- ============================================
-- 11. PROMOTIONS À DÉSACTIVER
-- ============================================

-- Promotions expirées encore actives:
SELECT 
  id,
  name,
  code,
  status,
  end_date,
  EXTRACT(DAY FROM (NOW() - end_date)) AS days_expired
FROM promotions
WHERE status = 'active'
AND end_date < NOW()
ORDER BY end_date;

-- ============================================
-- RÉSUMÉ FINAL
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ VÉRIFICATION TERMINÉE';
  RAISE NOTICE '================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Consultez les résultats ci-dessus pour:';
  RAISE NOTICE '1. Vérifier que toutes les tables existent';
  RAISE NOTICE '2. Vérifier que les services par défaut sont créés';
  RAISE NOTICE '3. Vérifier que les fonctions existent';
  RAISE NOTICE '4. Vérifier que le Cron Job est configuré';
  RAISE NOTICE '5. Vérifier que les RLS sont en place';
  RAISE NOTICE '6. Voir les statistiques actuelles';
  RAISE NOTICE '';
  RAISE NOTICE 'Si tout est ✅, le système est prêt!';
  RAISE NOTICE 'Sinon, consultez les ⚠️ warnings ci-dessus.';
  RAISE NOTICE '================================================';
END $$;

-- ============================================
-- FIN DU SCRIPT DE VÉRIFICATION
-- ============================================
