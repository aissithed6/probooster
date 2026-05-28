# 📅 Guide Configuration Cron Job Supabase

## 🎯 Objectif

Configurer un Cron Job dans Supabase pour exécuter automatiquement:
- Activation des campagnes payées
- Désactivation des campagnes expirées
- Désactivation des promotions expirées

**Fréquence:** Toutes les heures

---

## 📋 ÉTAPE 1: Activer l'Extension pg_cron

### Dans Supabase:

1. **Ouvrir Supabase Dashboard**
2. **Aller dans:** Database → Extensions
3. **Chercher:** `pg_cron`
4. **Cliquer sur:** Enable (Activer)

**OU via SQL Editor:**

```sql
-- Activer l'extension pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Vérifier que l'extension est activée
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
```

---

## 📋 ÉTAPE 2: Créer le Cron Job

### Copier et exécuter ce SQL:

```sql
-- ============================================
-- CRÉER LE CRON JOB
-- ============================================

-- Supprimer le job s'il existe déjà
SELECT cron.unschedule('marketing-automation');

-- Créer le job qui s'exécute toutes les heures
SELECT cron.schedule(
  'marketing-automation',           -- Nom du job
  '0 * * * *',                      -- Toutes les heures à la minute 0
  $$SELECT run_marketing_automation_with_logging()$$  -- Fonction à exécuter
);
```

### Explication du Cron Pattern: `'0 * * * *'`

```
┌───────────── minute (0 - 59)
│ ┌───────────── heure (0 - 23)
│ │ ┌───────────── jour du mois (1 - 31)
│ │ │ ┌───────────── mois (1 - 12)
│ │ │ │ ┌───────────── jour de la semaine (0 - 6) (Dimanche=0)
│ │ │ │ │
0 * * * *  = Toutes les heures à la minute 0
```

### Autres Exemples de Fréquence:

```sql
-- Toutes les 30 minutes
'*/30 * * * *'

-- Toutes les 6 heures
'0 */6 * * *'

-- Tous les jours à minuit
'0 0 * * *'

-- Tous les jours à 9h et 18h
'0 9,18 * * *'

-- Du lundi au vendredi à 10h
'0 10 * * 1-5'
```

---

## 📋 ÉTAPE 3: Vérifier le Cron Job

### Voir tous les jobs actifs:

```sql
-- Liste des jobs configurés
SELECT 
  jobid,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active,
  jobname
FROM cron.job
ORDER BY jobid DESC;
```

**Résultat attendu:**
```
jobid | schedule   | command                                          | jobname
------|------------|--------------------------------------------------|--------------------
1     | 0 * * * *  | SELECT run_marketing_automation_with_logging()   | marketing-automation
```

---

## 📋 ÉTAPE 4: Voir l'Historique d'Exécution

### Voir les dernières exécutions:

```sql
-- Historique des exécutions (10 dernières)
SELECT 
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time,
  end_time - start_time as duration
FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;
```

### Voir les logs de notre fonction:

```sql
-- Logs de notre fonction d'automatisation
SELECT 
  execution_time,
  campaigns_activated,
  campaigns_deactivated,
  promotions_deactivated,
  success,
  error_message,
  execution_duration_ms
FROM marketing_automation_logs
ORDER BY execution_time DESC
LIMIT 20;
```

---

## 📋 ÉTAPE 5: Tester Manuellement

### Avant de laisser le Cron Job tourner, testez manuellement:

```sql
-- Exécuter la fonction manuellement
SELECT * FROM run_marketing_automation_with_logging();
```

**Résultat attendu:**
```json
{
  "timestamp": "2025-10-07T23:00:00.000Z",
  "campaigns_activated": 2,
  "campaigns_deactivated": 1,
  "promotions_deactivated": 0,
  "execution_duration_ms": 45,
  "success": true
}
```

---

## 📋 ÉTAPE 6: Gérer le Cron Job

### Mettre en pause le job:

```sql
-- Désactiver temporairement
UPDATE cron.job 
SET active = false 
WHERE jobname = 'marketing-automation';
```

### Réactiver le job:

```sql
-- Réactiver
UPDATE cron.job 
SET active = true 
WHERE jobname = 'marketing-automation';
```

### Supprimer le job:

```sql
-- Supprimer complètement
SELECT cron.unschedule('marketing-automation');
```

### Modifier la fréquence:

```sql
-- Supprimer l'ancien
SELECT cron.unschedule('marketing-automation');

-- Créer avec nouvelle fréquence (ex: toutes les 30 min)
SELECT cron.schedule(
  'marketing-automation',
  '*/30 * * * *',
  $$SELECT run_marketing_automation_with_logging()$$
);
```

---

## 🔍 ÉTAPE 7: Monitoring et Debugging

### Vérifier les campagnes en attente:

```sql
-- Campagnes qui devraient être activées
SELECT 
  id,
  vendor_id,
  type,
  status,
  payment_status,
  start_date,
  end_date,
  total_cost
FROM boosting_campaigns
WHERE payment_status = 'paid' 
  AND status = 'pending'
  AND (start_date IS NULL OR start_date <= NOW())
  AND (end_date IS NULL OR end_date >= NOW());
```

### Vérifier les campagnes expirées:

```sql
-- Campagnes qui devraient être désactivées
SELECT 
  id,
  vendor_id,
  type,
  status,
  end_date,
  NOW() - end_date as expired_since
FROM boosting_campaigns
WHERE status = 'active' 
  AND end_date < NOW();
```

### Vérifier les promotions expirées:

```sql
-- Promotions qui devraient être désactivées
SELECT 
  id,
  name,
  code,
  status,
  end_date,
  NOW() - end_date as expired_since
FROM promotions
WHERE status = 'active' 
  AND end_date < NOW();
```

---

## ⚠️ IMPORTANT: Timezone

### Configurer le timezone de votre base de données:

```sql
-- Voir le timezone actuel
SHOW timezone;

-- Changer pour l'Afrique de l'Ouest (WAT - UTC+1)
ALTER DATABASE postgres SET timezone TO 'Africa/Lagos';

-- Ou pour UTC
ALTER DATABASE postgres SET timezone TO 'UTC';

-- Recharger la configuration
SELECT pg_reload_conf();
```

---

## 🎯 RÉSUMÉ DES COMMANDES

### Configuration Initiale:
```sql
-- 1. Activer pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Créer le job
SELECT cron.schedule(
  'marketing-automation',
  '0 * * * *',
  $$SELECT run_marketing_automation_with_logging()$$
);

-- 3. Vérifier
SELECT * FROM cron.job;
```

### Monitoring:
```sql
-- Voir les exécutions
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC LIMIT 10;

-- Voir les logs
SELECT * FROM marketing_automation_logs 
ORDER BY execution_time DESC LIMIT 20;
```

### Test Manuel:
```sql
-- Tester la fonction
SELECT * FROM run_marketing_automation_with_logging();
```

---

## 📊 Exemple de Résultat

### Après configuration réussie:

**Cron Job actif:**
```
✅ Job: marketing-automation
✅ Schedule: 0 * * * * (toutes les heures)
✅ Status: Active
✅ Last run: 2025-10-07 23:00:00
✅ Next run: 2025-10-08 00:00:00
```

**Logs d'exécution:**
```
2025-10-07 23:00:00 | 3 campagnes activées | 1 campagne désactivée | 0 promotions désactivées | ✅ Success
2025-10-07 22:00:00 | 0 campagnes activées | 2 campagnes désactivées | 1 promotion désactivée | ✅ Success
2025-10-07 21:00:00 | 1 campagne activée | 0 campagnes désactivées | 0 promotions désactivées | ✅ Success
```

---

## 🆘 Dépannage

### Problème 1: Extension pg_cron non disponible
**Solution:** Contacter le support Supabase ou utiliser un plan qui supporte pg_cron

### Problème 2: Permission denied
**Solution:** Vérifier que vous êtes connecté en tant que super admin

### Problème 3: Job ne s'exécute pas
**Solution:** 
```sql
-- Vérifier que le job est actif
SELECT * FROM cron.job WHERE jobname = 'marketing-automation';

-- Vérifier les erreurs
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'marketing-automation')
ORDER BY start_time DESC LIMIT 5;
```

### Problème 4: Fonction introuvable
**Solution:** Réexécuter `ACTIVATION_AUTOMATIQUE_CRON.sql` pour créer les fonctions

---

## ✅ CHECKLIST FINALE

- [ ] Extension pg_cron activée
- [ ] Fonctions créées (ACTIVATION_AUTOMATIQUE_CRON.sql exécuté)
- [ ] Cron Job créé
- [ ] Test manuel réussi
- [ ] Première exécution automatique vérifiée
- [ ] Logs consultés

---

**🎊 Une fois configuré, le système fonctionnera automatiquement 24/7!**

**Date:** 2025-10-07 23:08
**Prêt pour configuration!** ✅
