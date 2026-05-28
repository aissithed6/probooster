# 🧪 GUIDE DE TEST - Système Marketing & Promotions

Date: 2025-10-07 23:41
Objectif: Tester le flux complet du système

---

## 📋 PRÉREQUIS

### 1. Base de Données Configurée
```sql
-- Vérifier que les tables existent:
SELECT table_name 
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

-- Résultat attendu: 6 lignes
```

### 2. Services Par Défaut Insérés
```sql
-- Vérifier les services:
SELECT id, name, type, base_price, is_active 
FROM boosting_services;

-- Résultat attendu: 3 services
```

### 3. Cron Job Configuré
```sql
-- Vérifier le job:
SELECT * FROM cron.job WHERE jobname = 'marketing-automation';

-- Résultat attendu: 1 ligne
```

---

## 🧪 TEST 1: Admin Crée un Service

### Étape 1: Se Connecter en Admin
```
1. Ouvrir l'application
2. Se connecter avec un compte admin/super_admin
3. Aller dans Dashboard → Marketing & Promotions
```

### Étape 2: Créer un Service
```
1. Cliquer sur "Créer Service" ou "Configurer"
2. Remplir le formulaire:
   - Nom: "Test Service Premium"
   - Type: recommendation
   - Prix de base: 8000
   - Modèle: per_page_day
   - Features: ["Test 1", "Test 2"]
3. Cliquer sur "Créer"
```

### Résultat Attendu:
```
✅ Notification: "Service Créé"
✅ Service visible dans la liste
✅ Service actif (switch ON)
```

### Vérification SQL:
```sql
SELECT * FROM boosting_services 
WHERE name = 'Test Service Premium';

-- Doit retourner 1 ligne avec is_active = true
```

---

## 🧪 TEST 2: Vendeur Achète un Service

### Étape 1: Se Connecter en Vendeur
```
1. Se déconnecter
2. Se connecter avec un compte vendeur
3. Aller dans Dashboard → Marketing & Promotions
```

### Étape 2: Voir les Services Disponibles
```
1. Onglet "Vue d'Ensemble"
2. Section "Services de Boostage Disponibles"
3. Vérifier que les 3 services par défaut + le nouveau sont visibles
```

### Résultat Attendu:
```
✅ 4 services affichés
✅ Prix affichés correctement
✅ Features listées
```

### Étape 3: Créer une Campagne
```
1. Cliquer sur "Acheter" sur un service
2. Remplir:
   - Produit: Sélectionner un produit
   - Durée: 7 jours
   - Pages: Homepage, Product Page, Best Sellers (3 pages)
3. Vérifier le calcul: 8000 × 3 × 7 = 168,000 FCFA
4. Cliquer sur "Créer Campagne"
```

### Résultat Attendu:
```
✅ Notification: "Campagne Créée"
✅ Campagne visible dans "Mes Campagnes"
✅ Statut: "En Attente" (pending)
✅ Payment Status: "En attente" (pending)
```

### Vérification SQL:
```sql
SELECT 
  id, 
  vendor_id, 
  product_id, 
  type, 
  status, 
  payment_status,
  total_cost,
  duration,
  target_pages
FROM boosting_campaigns 
WHERE vendor_id = 'VOTRE_VENDOR_ID'
ORDER BY created_at DESC 
LIMIT 1;

-- Doit retourner la campagne avec status='pending'
```

---

## 🧪 TEST 3: Vendeur Paie (Simulation)

### Étape 1: Simuler le Paiement
```sql
-- Mettre à jour manuellement pour simuler le paiement:
UPDATE boosting_campaigns
SET 
  payment_status = 'paid',
  payment_id = 'PAY_TEST_123',
  payment_method = 'feexpay'
WHERE id = 'ID_DE_LA_CAMPAGNE';
```

### Résultat Attendu:
```
✅ payment_status = 'paid'
✅ Campagne toujours en status = 'pending'
```

---

## 🧪 TEST 4: Admin Approuve la Campagne

### Étape 1: Se Reconnecter en Admin
```
1. Se déconnecter du compte vendeur
2. Se connecter en admin
3. Aller dans Marketing & Promotions → Campagnes → Approbation
```

### Étape 2: Voir la Campagne en Attente
```
✅ La campagne du vendeur doit apparaître
✅ Status: "En Attente"
✅ Payment Status: "Payé"
```

### Étape 3: Approuver
```
1. Cliquer sur "Approuver"
2. Confirmer
```

### Résultat Attendu:
```
✅ Notification: "Campagne Approuvée"
✅ Status change: pending → active
✅ start_date est défini à NOW()
```

### Vérification SQL:
```sql
SELECT 
  id, 
  status, 
  start_date, 
  end_date,
  payment_status
FROM boosting_campaigns 
WHERE id = 'ID_DE_LA_CAMPAGNE';

-- Doit retourner:
-- status = 'active'
-- start_date = timestamp actuel
-- payment_status = 'paid'
```

---

## 🧪 TEST 5: Activation Automatique (Cron)

### Test Manuel:
```sql
-- Exécuter la fonction manuellement:
SELECT * FROM run_marketing_automation_with_logging();
```

### Résultat Attendu:
```json
{
  "timestamp": "2025-10-07T23:41:00.000Z",
  "campaigns_activated": 0,
  "campaigns_deactivated": 0,
  "promotions_deactivated": 0,
  "execution_duration_ms": 45,
  "success": true
}
```

### Vérifier les Logs:
```sql
SELECT * FROM marketing_automation_logs 
ORDER BY execution_time DESC 
LIMIT 5;
```

---

## 🧪 TEST 6: Performances de Campagne

### Étape 1: Enregistrer des Performances
```sql
-- Simuler des performances pour aujourd'hui:
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
  'ID_DE_LA_CAMPAGNE',
  CURRENT_DATE,
  1000,
  75,
  5,
  7.5,
  6.67,
  375000
);
```

### Étape 2: Voir dans le Dashboard Vendeur
```
1. Se connecter en vendeur
2. Aller dans Marketing & Promotions → Mes Campagnes
3. Voir la campagne active
```

### Résultat Attendu:
```
✅ Section "Performance" visible
✅ Impressions: 1,000
✅ Clics: 75
✅ CTR: 7.5%
✅ Conversions: 5
✅ Taux de conversion: 6.67%
```

---

## 🧪 TEST 7: Admin Crée une Promotion

### Étape 1: Se Connecter en Admin
```
1. Dashboard → Marketing & Promotions → Promotions
2. Cliquer sur "Nouvelle Promotion"
```

### Étape 2: Créer la Promotion
```
Remplir:
- Nom: "Test Promo -15%"
- Code: "TEST15"
- Type: coupon
- Discount Type: percentage
- Discount Value: 15
- Start Date: Aujourd'hui
- End Date: Dans 7 jours
- Usage Limit: 100
3. Cliquer sur "Créer"
```

### Résultat Attendu:
```
✅ Notification: "Promotion Créée"
✅ Promotion visible dans la liste
✅ Status: "draft"
```

### Étape 3: Activer la Promotion
```
1. Cliquer sur le switch pour activer
2. Confirmer
```

### Résultat Attendu:
```
✅ Status: draft → active
✅ Promotion visible pour les clients
```

### Vérification SQL:
```sql
SELECT * FROM promotions 
WHERE code = 'TEST15';

-- Doit retourner 1 ligne avec status='active'
```

---

## 🧪 TEST 8: Application Automatique des Promotions

### Étape 1: Intégrer le Hook (Si pas encore fait)
```typescript
// Dans votre composant panier:
import { usePromotions } from '@/hooks/usePromotions'

const { applyBestPromotion } = usePromotions(user?.id)

// Appliquer pour un produit:
const result = await applyBestPromotion(
  'product_id',
  50000, // prix
  1      // quantité
)

if (result) {
  console.log('Réduction:', result.discountAmount)
  console.log('Prix final:', result.finalAmount)
}
```

### Étape 2: Tester l'Application
```
1. Ajouter un produit au panier
2. Vérifier que la promotion s'applique automatiquement
3. Voir l'économie affichée
```

### Résultat Attendu:
```
✅ Prix original: 50,000 FCFA
✅ Réduction: -7,500 FCFA (15%)
✅ Prix final: 42,500 FCFA
```

---

## 🧪 TEST 9: Pause/Reprise Campagne

### Test Pause:
```
1. Vendeur Dashboard → Mes Campagnes
2. Campagne active → Cliquer "Pause"
```

### Résultat Attendu:
```
✅ Notification: "Campagne Mise en Pause"
✅ Status: active → paused
✅ Bouton change: "Pause" → "Reprendre"
```

### Test Reprise:
```
1. Cliquer sur "Reprendre"
```

### Résultat Attendu:
```
✅ Notification: "Campagne Reprise"
✅ Status: paused → active
```

---

## 🧪 TEST 10: Expiration Automatique

### Étape 1: Créer une Campagne Expirée
```sql
-- Créer une campagne avec end_date dans le passé:
INSERT INTO boosting_campaigns (
  vendor_id,
  service_id,
  type,
  status,
  start_date,
  end_date,
  target_pages,
  duration,
  total_cost,
  payment_status
) VALUES (
  'VENDOR_ID',
  'SERVICE_ID',
  'recommendation',
  'active',
  NOW() - INTERVAL '10 days',
  NOW() - INTERVAL '3 days',
  ARRAY['home', 'product'],
  7,
  50000,
  'paid'
);
```

### Étape 2: Exécuter le Cron
```sql
SELECT * FROM run_marketing_automation_with_logging();
```

### Résultat Attendu:
```json
{
  "campaigns_deactivated": 1,
  "success": true
}
```

### Vérification:
```sql
SELECT status FROM boosting_campaigns 
WHERE end_date < NOW() AND status = 'active';

-- Doit retourner 0 lignes (toutes désactivées)
```

---

## 📊 CHECKLIST COMPLÈTE

### Backend:
- [ ] Tables créées dans Supabase
- [ ] RLS vérifié
- [ ] Services par défaut insérés
- [ ] Cron Job configuré

### Tests Admin:
- [ ] Créer service ✓
- [ ] Modifier service ✓
- [ ] Désactiver service ✓
- [ ] Voir campagnes en attente ✓
- [ ] Approuver campagne ✓
- [ ] Rejeter campagne ✓
- [ ] Créer promotion ✓
- [ ] Activer promotion ✓

### Tests Vendeur:
- [ ] Voir services disponibles ✓
- [ ] Créer campagne ✓
- [ ] Voir mes campagnes ✓
- [ ] Mettre en pause ✓
- [ ] Reprendre ✓
- [ ] Voir performances ✓

### Tests Automatisation:
- [ ] Activation automatique ✓
- [ ] Désactivation expirées ✓
- [ ] Logs enregistrés ✓

### Tests Promotions:
- [ ] Application automatique ✓
- [ ] Code promo ✓
- [ ] Enregistrement utilisation ✓

---

## 🐛 DÉPANNAGE

### Problème: Campagne ne s'active pas
**Vérifier:**
```sql
SELECT status, payment_status, start_date, end_date
FROM boosting_campaigns
WHERE id = 'CAMPAIGN_ID';
```

**Conditions pour activation:**
- payment_status = 'paid'
- status = 'pending'
- start_date IS NULL OR start_date <= NOW()
- end_date IS NULL OR end_date >= NOW()

### Problème: Promotion ne s'applique pas
**Vérifier:**
```sql
SELECT 
  status,
  start_date,
  end_date,
  usage_limit,
  used_count,
  applicable_products
FROM promotions
WHERE id = 'PROMOTION_ID';
```

**Conditions:**
- status = 'active'
- start_date <= NOW()
- end_date >= NOW()
- used_count < usage_limit
- Produit dans applicable_products (ou vide pour tous)

### Problème: Performances non visibles
**Vérifier:**
```sql
SELECT * FROM boosting_performance
WHERE campaign_id = 'CAMPAIGN_ID';
```

**Si vide:** Insérer des données de test (voir TEST 6)

---

## 📈 SCÉNARIO COMPLET

### Jour 1: Configuration
```
09:00 - Admin crée service "Premium Boost"
09:15 - Vendeur achète pour produit "Smartphone X"
09:30 - Vendeur paie via FeexPay
10:00 - Admin approuve la campagne
10:01 - Campagne activée automatiquement
```

### Jour 2-7: Campagne Active
```
Chaque jour:
- Système enregistre performances
- Vendeur voit stats en temps réel
- Produit affiché sur pages sélectionnées
```

### Jour 8: Expiration
```
00:00 - Cron Job s'exécute
00:01 - Campagne désactivée automatiquement
00:02 - Status: active → completed
```

---

## 🎯 MÉTRIQUES À VÉRIFIER

### Dashboard Admin:
- ✅ Nombre total de campagnes
- ✅ Revenus générés
- ✅ Campagnes en attente
- ✅ Services actifs

### Dashboard Vendeur:
- ✅ Campagnes actives
- ✅ Investissement total
- ✅ Impressions totales
- ✅ ROI

### Base de Données:
- ✅ Logs d'automatisation
- ✅ Performances enregistrées
- ✅ Utilisations promotions

---

## ✅ VALIDATION FINALE

### Tous les tests passent:
```
✅ Admin peut créer services
✅ Admin peut créer promotions
✅ Admin peut approuver campagnes
✅ Vendeur peut voir services
✅ Vendeur peut créer campagnes
✅ Vendeur peut gérer campagnes
✅ Activation automatique fonctionne
✅ Désactivation automatique fonctionne
✅ Promotions s'appliquent automatiquement
✅ Performances enregistrées
```

### Le système est 100% fonctionnel! 🎊

---

## 📞 SUPPORT

En cas de problème:
1. Vérifier les logs: `SELECT * FROM marketing_automation_logs`
2. Vérifier les erreurs: Console navigateur
3. Vérifier Supabase: Dashboard → Logs
4. Consulter la documentation dans les fichiers MD

---

**Bon test!** 🚀
