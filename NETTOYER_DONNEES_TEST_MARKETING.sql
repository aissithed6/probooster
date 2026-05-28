-- ============================================
-- NETTOYER LES DONNÉES DE TEST - Marketing
-- ============================================
-- Ce script supprime toutes les données de test
-- tout en conservant les services par défaut
-- ============================================

-- ⚠️ ATTENTION: Ce script supprime des données!
-- Utilisez-le uniquement si vous voulez repartir à zéro

DO $$
BEGIN
  -- ============================================
  -- 1. SUPPRIMER LES PERFORMANCES
  -- ============================================
  
  DELETE FROM boosting_performance;
  RAISE NOTICE '✅ Performances de test supprimées';
  
  -- ============================================
  -- 2. SUPPRIMER LES CAMPAGNES
  -- ============================================
  
  DELETE FROM boosting_campaigns;
  RAISE NOTICE '✅ Campagnes de test supprimées';
  
  -- ============================================
  -- 3. SUPPRIMER LES UTILISATIONS DE PROMOTIONS
  -- ============================================
  
  DELETE FROM promotion_usage;
  RAISE NOTICE '✅ Utilisations de promotions supprimées';
  
  -- ============================================
  -- 4. SUPPRIMER LES PROMOTIONS
  -- ============================================
  
  DELETE FROM promotions;
  RAISE NOTICE '✅ Promotions de test supprimées';

  -- ============================================
  -- 5. RÉINITIALISER LES SERVICES (OPTIONNEL)
  -- ============================================
  
  -- Option A: Supprimer tous les services (y compris les 3 par défaut)
  -- DELETE FROM boosting_services;
  
  -- Option B: Supprimer uniquement les services créés après l'installation
  -- DELETE FROM boosting_services 
  -- WHERE created_at > '2025-10-08 00:00:00';
  
  -- Option C: Garder les 3 services par défaut (recommandé)
  -- Ne rien faire, les services par défaut restent
  
  RAISE NOTICE '✅ Services conservés (3 services par défaut)';
  
  -- ============================================
  -- 6. NETTOYER LES LOGS (OPTIONNEL)
  -- ============================================
  
  -- Supprimer les logs de plus de 7 jours
  DELETE FROM marketing_automation_logs
  WHERE execution_time < NOW() - INTERVAL '7 days';
  
  RAISE NOTICE '✅ Vieux logs supprimés';
  
END $$;

-- ============================================
-- 7. VÉRIFICATION
-- ============================================

-- Compter ce qui reste
SELECT 
  'boosting_services' AS table_name,
  COUNT(*) AS count
FROM boosting_services

UNION ALL

SELECT 
  'boosting_campaigns' AS table_name,
  COUNT(*) AS count
FROM boosting_campaigns

UNION ALL

SELECT 
  'boosting_performance' AS table_name,
  COUNT(*) AS count
FROM boosting_performance

UNION ALL

SELECT 
  'promotions' AS table_name,
  COUNT(*) AS count
FROM promotions

UNION ALL

SELECT 
  'promotion_usage' AS table_name,
  COUNT(*) AS count
FROM promotion_usage

UNION ALL

SELECT 
  'marketing_automation_logs' AS table_name,
  COUNT(*) AS count
FROM marketing_automation_logs;

-- ============================================
-- RÉSULTAT ATTENDU:
-- ============================================
-- boosting_services: 3 (les 3 services par défaut)
-- boosting_campaigns: 0
-- boosting_performance: 0
-- promotions: 0
-- promotion_usage: 0
-- marketing_automation_logs: 0 ou quelques-uns

-- ============================================
-- 8. RÉINITIALISER LES SÉQUENCES (OPTIONNEL)
-- ============================================

-- Si vous voulez que les prochains IDs recommencent à 1:
-- ALTER SEQUENCE boosting_campaigns_id_seq RESTART WITH 1;
-- ALTER SEQUENCE boosting_performance_id_seq RESTART WITH 1;
-- ALTER SEQUENCE promotions_id_seq RESTART WITH 1;
-- ALTER SEQUENCE promotion_usage_id_seq RESTART WITH 1;

-- ============================================
-- FIN DU NETTOYAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ NETTOYAGE TERMINÉ';
  RAISE NOTICE '================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Résultat:';
  RAISE NOTICE '- Services: 3 (par défaut)';
  RAISE NOTICE '- Campagnes: 0';
  RAISE NOTICE '- Performances: 0';
  RAISE NOTICE '- Promotions: 0';
  RAISE NOTICE '- Utilisations: 0';
  RAISE NOTICE '';
  RAISE NOTICE 'Le système est maintenant propre!';
  RAISE NOTICE 'Vous pouvez commencer à créer de vraies données.';
  RAISE NOTICE '================================================';
END $$;
