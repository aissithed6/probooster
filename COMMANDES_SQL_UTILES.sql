-- ============================================
-- COMMANDES SQL UTILES - Système Marketing
-- ============================================
-- Commandes fréquemment utilisées pour gérer le système
-- ============================================

-- ============================================
-- 1. SERVICES DE BOOSTAGE
-- ============================================

-- Voir tous les services actifs:
SELECT 
  id,
  name,
  type,
  base_price,
  pricing_model,
  is_active
FROM boosting_services
WHERE is_active = true
ORDER BY type;

-- Activer/Désactiver un service:
UPDATE boosting_services 
SET is_active = true 
WHERE id = 'SERVICE_ID';

-- Modifier le prix d'un service:
UPDATE boosting_services 
SET base_price = 6000 
WHERE id = 'SERVICE_ID';

-- Voir les statistiques d'utilisation d'un service:
SELECT 
  s.name,
  s.type,
  COUNT(c.id) AS total_campaigns,
  COUNT(CASE WHEN c.status = 'active' THEN 1 END) AS active_campaigns,
  SUM(c.total_cost) AS total_revenue
FROM boosting_services s
LEFT JOIN boosting_campaigns c ON c.service_id = s.id
GROUP BY s.id, s.name, s.type
ORDER BY total_revenue DESC;

-- ============================================
-- 2. CAMPAGNES DE BOOSTAGE
-- ============================================

-- Voir toutes les campagnes actives:
SELECT 
  c.id,
  u.full_name AS vendor_name,
  p.name AS product_name,
  c.type,
  c.status,
  c.start_date,
  c.end_date,
  c.total_cost,
  c.payment_status
FROM boosting_campaigns c
LEFT JOIN users u ON u.id = c.vendor_id
LEFT JOIN products p ON p.id = c.product_id
WHERE c.status = 'active'
ORDER BY c.start_date DESC;

-- Voir les campagnes en attente d'approbation:
SELECT 
  c.id,
  u.full_name AS vendor_name,
  u.email AS vendor_email,
  p.name AS product_name,
  c.type,
  c.total_cost,
  c.payment_status,
  c.created_at
FROM boosting_campaigns c
LEFT JOIN users u ON u.id = c.vendor_id
LEFT JOIN products p ON p.id = c.product_id
WHERE c.status = 'pending'
AND c.payment_status = 'paid'
ORDER BY c.created_at;

-- Approuver une campagne manuellement:
UPDATE boosting_campaigns
SET 
  status = 'active',
  start_date = NOW()
WHERE id = 'CAMPAIGN_ID';

-- Rejeter une campagne:
UPDATE boosting_campaigns
SET 
  status = 'rejected',
  rejection_reason = 'Contenu inapproprié'
WHERE id = 'CAMPAIGN_ID';

-- Mettre en pause une campagne:
UPDATE boosting_campaigns
SET status = 'paused'
WHERE id = 'CAMPAIGN_ID';

-- Reprendre une campagne:
UPDATE boosting_campaigns
SET status = 'active'
WHERE id = 'CAMPAIGN_ID';

-- Voir les campagnes d'un vendeur spécifique:
SELECT 
  c.id,
  p.name AS product_name,
  c.type,
  c.status,
  c.start_date,
  c.end_date,
  c.total_cost,
  c.duration
FROM boosting_campaigns c
LEFT JOIN products p ON p.id = c.product_id
WHERE c.vendor_id = 'VENDOR_ID'
ORDER BY c.created_at DESC;

-- Voir les revenus par vendeur:
SELECT 
  u.full_name AS vendor_name,
  COUNT(c.id) AS total_campaigns,
  SUM(c.total_cost) AS total_spent,
  AVG(c.total_cost) AS average_spent
FROM boosting_campaigns c
JOIN users u ON u.id = c.vendor_id
WHERE c.payment_status = 'paid'
GROUP BY u.id, u.full_name
ORDER BY total_spent DESC;

-- ============================================
-- 3. PERFORMANCES
-- ============================================

-- Voir les performances d'une campagne:
SELECT 
  date,
  impressions,
  clicks,
  conversions,
  ctr,
  conversion_rate,
  revenue
FROM boosting_performance
WHERE campaign_id = 'CAMPAIGN_ID'
ORDER BY date DESC;

-- Voir les performances totales d'un vendeur:
SELECT 
  SUM(bp.impressions) AS total_impressions,
  SUM(bp.clicks) AS total_clicks,
  SUM(bp.conversions) AS total_conversions,
  AVG(bp.ctr) AS average_ctr,
  AVG(bp.conversion_rate) AS average_conversion_rate,
  SUM(bp.revenue) AS total_revenue
FROM boosting_performance bp
JOIN boosting_campaigns bc ON bc.id = bp.campaign_id
WHERE bc.vendor_id = 'VENDOR_ID';

-- Ajouter des performances manuellement (pour test):
INSERT INTO boosting_performance (
  campaign_id,
  date,
  impressions,
  clicks,
  conversions,
  ctr,
  conversion_rate,
  revenue
) VALUES (
  'CAMPAIGN_ID',
  CURRENT_DATE,
  1000,
  75,
  5,
  7.5,
  6.67,
  375000
);

-- ============================================
-- 4. PROMOTIONS
-- ============================================

-- Voir toutes les promotions actives:
SELECT 
  id,
  name,
  code,
  type,
  discount_type,
  discount_value,
  start_date,
  end_date,
  used_count,
  usage_limit,
  min_order_amount
FROM promotions
WHERE status = 'active'
AND start_date <= NOW()
AND end_date >= NOW()
ORDER BY created_at DESC;

-- Créer une promotion rapidement:
INSERT INTO promotions (
  name,
  code,
  type,
  status,
  start_date,
  end_date,
  discount_type,
  discount_value,
  usage_limit,
  usage_limit_per_user,
  target_audience,
  applicable_products,
  applicable_categories,
  applicable_vendors,
  is_auto_apply,
  created_by
) VALUES (
  'Promo Test -20%',
  'TEST20',
  'coupon',
  'active',
  NOW(),
  NOW() + INTERVAL '30 days',
  'percentage',
  20,
  100,
  1,
  ARRAY['all'],
  ARRAY[]::TEXT[],
  ARRAY[]::TEXT[],
  ARRAY[]::TEXT[],
  true,
  'ADMIN_ID'
);

-- Activer/Désactiver une promotion:
UPDATE promotions 
SET status = 'active' 
WHERE id = 'PROMO_ID';

UPDATE promotions 
SET status = 'paused' 
WHERE id = 'PROMO_ID';

-- Voir l'utilisation d'une promotion:
SELECT 
  pu.used_at,
  u.full_name AS user_name,
  pu.discount_amount,
  pu.original_amount,
  pu.final_amount
FROM promotion_usage pu
JOIN users u ON u.id = pu.user_id
WHERE pu.promotion_id = 'PROMO_ID'
ORDER BY pu.used_at DESC;

-- Voir les promotions les plus utilisées:
SELECT 
  p.name,
  p.code,
  p.discount_value,
  p.used_count,
  p.usage_limit,
  ROUND((p.used_count::NUMERIC / NULLIF(p.usage_limit, 0)) * 100, 2) AS usage_percentage
FROM promotions p
WHERE p.status = 'active'
ORDER BY p.used_count DESC;

-- ============================================
-- 5. AUTOMATISATION
-- ============================================

-- Exécuter l'automatisation manuellement:
SELECT * FROM run_marketing_automation_with_logging();

-- Voir les dernières exécutions:
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
LIMIT 10;

-- Voir les erreurs d'automatisation:
SELECT 
  execution_time,
  error_message,
  execution_duration_ms
FROM marketing_automation_logs
WHERE success = false
ORDER BY execution_time DESC;

-- Nettoyer les vieux logs (garder 30 jours):
DELETE FROM marketing_automation_logs
WHERE execution_time < NOW() - INTERVAL '30 days';

-- ============================================
-- 6. STATISTIQUES GLOBALES
-- ============================================

-- Dashboard Admin - Vue d'ensemble:
SELECT 
  (SELECT COUNT(*) FROM boosting_services WHERE is_active = true) AS services_actifs,
  (SELECT COUNT(*) FROM boosting_campaigns WHERE status = 'active') AS campagnes_actives,
  (SELECT COUNT(*) FROM boosting_campaigns WHERE status = 'pending') AS campagnes_en_attente,
  (SELECT COUNT(*) FROM promotions WHERE status = 'active') AS promotions_actives,
  (SELECT SUM(total_cost) FROM boosting_campaigns WHERE payment_status = 'paid') AS revenus_totaux,
  (SELECT COUNT(DISTINCT vendor_id) FROM boosting_campaigns) AS vendeurs_actifs;

-- Top 5 vendeurs par dépenses:
SELECT 
  u.full_name,
  u.email,
  COUNT(c.id) AS total_campaigns,
  SUM(c.total_cost) AS total_spent
FROM boosting_campaigns c
JOIN users u ON u.id = c.vendor_id
WHERE c.payment_status = 'paid'
GROUP BY u.id, u.full_name, u.email
ORDER BY total_spent DESC
LIMIT 5;

-- Performance globale:
SELECT 
  SUM(impressions) AS total_impressions,
  SUM(clicks) AS total_clicks,
  SUM(conversions) AS total_conversions,
  ROUND(AVG(ctr), 2) AS average_ctr,
  ROUND(AVG(conversion_rate), 2) AS average_conversion_rate,
  SUM(revenue) AS total_revenue
FROM boosting_performance;

-- Promotions les plus rentables:
SELECT 
  p.name,
  p.code,
  p.discount_value,
  COUNT(pu.id) AS times_used,
  SUM(pu.discount_amount) AS total_discount_given,
  SUM(pu.final_amount) AS total_revenue_generated
FROM promotions p
LEFT JOIN promotion_usage pu ON pu.promotion_id = p.id
GROUP BY p.id, p.name, p.code, p.discount_value
ORDER BY total_revenue_generated DESC;

-- ============================================
-- 7. MAINTENANCE
-- ============================================

-- Nettoyer les campagnes terminées (plus de 90 jours):
UPDATE boosting_campaigns
SET status = 'completed'
WHERE status = 'active'
AND end_date < NOW() - INTERVAL '90 days';

-- Archiver les vieilles performances (optionnel):
-- CREATE TABLE boosting_performance_archive AS
-- SELECT * FROM boosting_performance
-- WHERE date < NOW() - INTERVAL '90 days';

-- DELETE FROM boosting_performance
-- WHERE date < NOW() - INTERVAL '90 days';

-- Réinitialiser le compteur d'une promotion:
UPDATE promotions
SET used_count = 0
WHERE id = 'PROMO_ID';

-- Prolonger une promotion:
UPDATE promotions
SET end_date = end_date + INTERVAL '7 days'
WHERE id = 'PROMO_ID';

-- ============================================
-- 8. CRON JOB
-- ============================================

-- Voir le statut du Cron Job:
SELECT 
  jobid,
  jobname,
  schedule,
  active,
  database
FROM cron.job
WHERE jobname = 'marketing-automation';

-- Activer le Cron Job:
UPDATE cron.job
SET active = true
WHERE jobname = 'marketing-automation';

-- Désactiver le Cron Job:
UPDATE cron.job
SET active = false
WHERE jobname = 'marketing-automation';

-- Voir les exécutions du Cron Job:
SELECT 
  runid,
  jobid,
  start_time,
  end_time,
  status,
  return_message
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'marketing-automation')
ORDER BY start_time DESC
LIMIT 10;

-- Supprimer le Cron Job:
SELECT cron.unschedule('marketing-automation');

-- Recréer le Cron Job:
SELECT cron.schedule(
  'marketing-automation',
  '0 * * * *',
  $$SELECT run_marketing_automation_with_logging()$$
);

-- ============================================
-- 9. DÉPANNAGE
-- ============================================

-- Trouver les campagnes bloquées:
SELECT 
  c.id,
  u.full_name AS vendor_name,
  c.status,
  c.payment_status,
  c.created_at,
  EXTRACT(HOUR FROM (NOW() - c.created_at)) AS hours_waiting
FROM boosting_campaigns c
JOIN users u ON u.id = c.vendor_id
WHERE c.status = 'pending'
AND c.payment_status = 'paid'
AND c.created_at < NOW() - INTERVAL '24 hours'
ORDER BY c.created_at;

-- Trouver les promotions expirées non désactivées:
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

-- Trouver les campagnes sans performances:
SELECT 
  c.id,
  u.full_name AS vendor_name,
  c.type,
  c.status,
  c.start_date,
  EXTRACT(DAY FROM (NOW() - c.start_date)) AS days_active
FROM boosting_campaigns c
JOIN users u ON u.id = c.vendor_id
LEFT JOIN boosting_performance bp ON bp.campaign_id = c.id
WHERE c.status = 'active'
AND c.start_date IS NOT NULL
AND bp.id IS NULL
ORDER BY c.start_date;

-- Vérifier l'intégrité des données:
SELECT 
  'Campagnes sans service' AS issue,
  COUNT(*) AS count
FROM boosting_campaigns c
LEFT JOIN boosting_services s ON s.id = c.service_id
WHERE s.id IS NULL

UNION ALL

SELECT 
  'Campagnes sans vendeur' AS issue,
  COUNT(*) AS count
FROM boosting_campaigns c
LEFT JOIN users u ON u.id = c.vendor_id
WHERE u.id IS NULL

UNION ALL

SELECT 
  'Performances sans campagne' AS issue,
  COUNT(*) AS count
FROM boosting_performance bp
LEFT JOIN boosting_campaigns c ON c.id = bp.campaign_id
WHERE c.id IS NULL;

-- ============================================
-- 10. RAPPORTS
-- ============================================

-- Rapport mensuel des revenus:
SELECT 
  TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
  COUNT(*) AS total_campaigns,
  SUM(total_cost) AS total_revenue,
  AVG(total_cost) AS average_revenue
FROM boosting_campaigns
WHERE payment_status = 'paid'
AND created_at >= NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- Rapport par type de service:
SELECT 
  s.type,
  s.name,
  COUNT(c.id) AS total_campaigns,
  SUM(c.total_cost) AS total_revenue,
  AVG(c.duration) AS average_duration
FROM boosting_services s
LEFT JOIN boosting_campaigns c ON c.service_id = s.id AND c.payment_status = 'paid'
GROUP BY s.id, s.type, s.name
ORDER BY total_revenue DESC;

-- Rapport d'utilisation des promotions:
SELECT 
  TO_CHAR(DATE_TRUNC('week', pu.used_at), 'YYYY-MM-DD') AS week,
  p.name,
  COUNT(pu.id) AS times_used,
  SUM(pu.discount_amount) AS total_discount,
  SUM(pu.final_amount) AS total_revenue
FROM promotion_usage pu
JOIN promotions p ON p.id = pu.promotion_id
WHERE pu.used_at >= NOW() - INTERVAL '4 weeks'
GROUP BY DATE_TRUNC('week', pu.used_at), p.name
ORDER BY week DESC, times_used DESC;

-- ============================================
-- 11. EXPORT DE DONNÉES
-- ============================================

-- Exporter toutes les campagnes (format CSV):
COPY (
  SELECT 
    c.id,
    u.full_name AS vendor_name,
    u.email AS vendor_email,
    p.name AS product_name,
    s.name AS service_name,
    c.type,
    c.status,
    c.start_date,
    c.end_date,
    c.duration,
    c.total_cost,
    c.payment_status,
    c.created_at
  FROM boosting_campaigns c
  LEFT JOIN users u ON u.id = c.vendor_id
  LEFT JOIN products p ON p.id = c.product_id
  LEFT JOIN boosting_services s ON s.id = c.service_id
  ORDER BY c.created_at DESC
) TO '/tmp/campaigns_export.csv' WITH CSV HEADER;

-- Exporter les promotions:
COPY (
  SELECT 
    id,
    name,
    code,
    type,
    status,
    discount_type,
    discount_value,
    start_date,
    end_date,
    used_count,
    usage_limit,
    min_order_amount
  FROM promotions
  ORDER BY created_at DESC
) TO '/tmp/promotions_export.csv' WITH CSV HEADER;

-- ============================================
-- 12. RÉINITIALISATION (ATTENTION!)
-- ============================================

-- ⚠️ ATTENTION: Ces commandes suppriment des données!
-- À utiliser uniquement en développement ou pour nettoyer

-- Supprimer toutes les performances:
-- TRUNCATE boosting_performance CASCADE;

-- Supprimer toutes les campagnes:
-- TRUNCATE boosting_campaigns CASCADE;

-- Supprimer toutes les promotions:
-- TRUNCATE promotions CASCADE;
-- TRUNCATE promotion_usage CASCADE;

-- Réinitialiser les services (garder les 3 par défaut):
-- DELETE FROM boosting_services 
-- WHERE created_at > '2025-10-07';

-- ============================================
-- FIN DES COMMANDES UTILES
-- ============================================

-- Pour plus d'informations, consultez:
-- - README_MARKETING.md
-- - GUIDE_TEST_MARKETING.md
-- - DEPLOIEMENT_MARKETING_FINAL.md
