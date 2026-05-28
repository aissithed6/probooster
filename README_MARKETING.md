# 🎯 SYSTÈME MARKETING & PROMOTIONS - README

**Version:** 1.0.0  
**Date:** 2025-10-07  
**Statut:** ✅ 95% Complet - Prêt pour Tests

---

## 🚀 DÉMARRAGE RAPIDE

### 1. Exécuter les Scripts SQL (Supabase)
```sql
-- Script 1: Créer les tables
MARKETING_PROMOTIONS_COMPLET.sql

-- Script 2: Configurer l'automatisation
ACTIVATION_AUTOMATIQUE_CRON.sql

-- Script 3: Configurer le Cron Job
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('marketing-automation', '0 * * * *', 
  $$SELECT run_marketing_automation_with_logging()$$);
```

### 2. Vérifier les Fichiers TypeScript
```
✅ lib/services/marketing-service.ts
✅ hooks/usePromotions.ts
✅ components/super-admin/marketing-promotions.tsx
✅ components/seller-dashboard/marketing-promotions.tsx
```

### 3. Tester
```
Admin: Créer service → Vendeur: Acheter → Admin: Approuver → ✅ Actif
```

---

## 📊 ARCHITECTURE

### Base de Données (6 Tables)
```
boosting_services       → Services de boostage
boosting_campaigns      → Campagnes des vendeurs
boosting_performance    → Statistiques quotidiennes
promotions              → Promotions et codes promo
promotion_usage         → Historique d'utilisation
boosting_pricing        → Configuration des prix
```

### Services TypeScript (4 Classes)
```
BoostingServiceManager      → CRUD services
BoostingCampaignManager     → CRUD campagnes + approbation
BoostingPerformanceManager  → Gestion performances
PromotionManager            → CRUD promotions + application
```

### Automatisation
```
Cron Job (toutes les heures):
  → Active campagnes payées
  → Désactive campagnes expirées
  → Désactive promotions expirées
  → Enregistre logs
```

---

## 🎯 FONCTIONNALITÉS

### Admin Peut:
- ✅ Créer/Modifier/Supprimer services de boostage
- ✅ Définir prix et modèles de tarification
- ✅ Approuver/Rejeter campagnes des vendeurs
- ✅ Créer/Modifier/Supprimer promotions
- ✅ Voir statistiques globales

### Vendeur Peut:
- ✅ Voir services disponibles
- ✅ Acheter un service pour booster un produit
- ✅ Choisir durée et pages cibles
- ✅ Voir ses campagnes
- ✅ Mettre en pause/Reprendre campagnes
- ✅ Voir performances en temps réel

### Client Bénéficie:
- ✅ Promotions appliquées automatiquement
- ✅ Codes promo utilisables
- ✅ Voir économies réalisées
- ✅ Produits boostés mis en avant

---

## 🔄 FLUX COMPLET

```
1. Admin crée service "Premium Boost" (5,000 FCFA/page/jour)
   ↓
2. Vendeur achète pour son produit (7 jours × 3 pages = 105,000 FCFA)
   ↓
3. Vendeur paie via FeexPay (payment_status='paid')
   ↓
4. Admin approuve (status='active', start_date=NOW())
   ↓
5. Produit boosté automatiquement sur les pages
   ↓
6. Système enregistre performances quotidiennes
   ↓
7. Vendeur voit statistiques en temps réel
   ↓
8. Après 7 jours: Cron Job désactive automatiquement
```

---

## 📝 FICHIERS IMPORTANTS

### Pour Déployer:
1. `DEPLOIEMENT_MARKETING_FINAL.md` - Guide de déploiement complet
2. `MARKETING_PROMOTIONS_COMPLET.sql` - Script SQL principal
3. `ACTIVATION_AUTOMATIQUE_CRON.sql` - Script automatisation

### Pour Développer:
1. `lib/services/marketing-service.ts` - Services TypeScript
2. `hooks/usePromotions.ts` - Hook promotions
3. `EXEMPLE_INTEGRATION_PROMOTIONS_PANIER.tsx` - Exemple intégration

### Pour Tester:
1. `GUIDE_TEST_MARKETING.md` - Guide de test complet
2. `GUIDE_CONFIGURATION_CRON_JOB.md` - Configuration Cron

### Pour Comprendre:
1. `SYSTEME_MARKETING_FINAL.md` - Vue d'ensemble
2. `SYNCHRONISATION_COMPLETE.md` - Récapitulatif
3. `MARKETING_PROMOTIONS_RECAP.md` - Détails techniques

---

## ⚡ COMMANDES RAPIDES

### Vérifier les Services:
```sql
SELECT name, type, base_price, is_active FROM boosting_services;
```

### Vérifier les Campagnes:
```sql
SELECT 
  id, 
  vendor_id, 
  status, 
  payment_status, 
  total_cost 
FROM boosting_campaigns 
ORDER BY created_at DESC 
LIMIT 10;
```

### Vérifier les Promotions:
```sql
SELECT name, code, discount_value, status, used_count, usage_limit 
FROM promotions 
WHERE status = 'active';
```

### Exécuter l'Automatisation:
```sql
SELECT * FROM run_marketing_automation_with_logging();
```

### Voir les Logs:
```sql
SELECT * FROM marketing_automation_logs 
ORDER BY execution_time DESC 
LIMIT 10;
```

---

## 🎯 SERVICES PAR DÉFAUT

1. **Recommandation Premium**
   - Type: recommendation
   - Prix: 5,000 FCFA/page/jour
   - Pages: 5 (home, product, best_sellers, new_arrivals, vendor)

2. **Bannière Homepage**
   - Type: banner
   - Prix: 10,000 FCFA/page/jour
   - Pages: 5 (mêmes que recommandation)

3. **WhatsApp Marketing**
   - Type: whatsapp
   - Prix: 100 FCFA/message/pays
   - Ciblage: Pays, âge, profession, centres d'intérêt

---

## 🔧 DÉPANNAGE RAPIDE

### Campagne ne s'active pas:
```sql
-- Vérifier:
SELECT status, payment_status, start_date, end_date
FROM boosting_campaigns WHERE id = 'CAMPAIGN_ID';

-- Conditions requises:
-- payment_status = 'paid'
-- status = 'pending'
-- Admin doit approuver
```

### Promotion ne s'applique pas:
```sql
-- Vérifier:
SELECT status, start_date, end_date, used_count, usage_limit
FROM promotions WHERE id = 'PROMO_ID';

-- Conditions requises:
-- status = 'active'
-- start_date <= NOW()
-- end_date >= NOW()
-- used_count < usage_limit
```

### Cron Job ne s'exécute pas:
```sql
-- Vérifier:
SELECT * FROM cron.job WHERE jobname = 'marketing-automation';

-- Si active = false:
UPDATE cron.job SET active = true 
WHERE jobname = 'marketing-automation';
```

---

## 📞 SUPPORT

### Documentation Complète:
- **Vue d'ensemble:** `SYSTEME_MARKETING_FINAL.md`
- **Déploiement:** `DEPLOIEMENT_MARKETING_FINAL.md`
- **Tests:** `GUIDE_TEST_MARKETING.md`
- **Cron Job:** `GUIDE_CONFIGURATION_CRON_JOB.md`

### Fichiers Techniques:
- **Services:** `lib/services/marketing-service.ts`
- **Hook:** `hooks/usePromotions.ts`
- **SQL Principal:** `MARKETING_PROMOTIONS_COMPLET.sql`
- **SQL Cron:** `ACTIVATION_AUTOMATIQUE_CRON.sql`

---

## ✅ CHECKLIST FINALE

- [ ] Scripts SQL exécutés
- [ ] Cron Job configuré
- [ ] Application compilée sans erreur
- [ ] Tests Admin réussis
- [ ] Tests Vendeur réussis
- [ ] Tests Automatisation réussis
- [ ] Documentation lue
- [ ] Équipe formée

---

## 🎊 SYSTÈME PRÊT!

**Le système Marketing & Promotions est maintenant opérationnel!**

**Prochaines étapes:**
1. Configurer le Cron Job (15 min)
2. Tester le flux complet (30 min)
3. Déployer en production! 🚀

---

**Développé avec ❤️ pour Probooster**  
**Questions? Consultez la documentation complète!**
