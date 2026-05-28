# 📊 Système de Partage et Engagement - Documentation

## ✅ Vue d'ensemble

Système complet de traçage des partages et interactions en temps réel avec Supabase.

---

## 📁 Fichiers Créés

### 1. **`lib/services/share-engagement-service.ts`** ✅
Service complet pour gérer les partages et interactions.

**Fonctionnalités:**
- ✅ Enregistrement des partages (Facebook, Twitter, WhatsApp, Instagram, LinkedIn, Email, Copy)
- ✅ Traçage des interactions (vues, clics, conversions, achats)
- ✅ Calcul automatique des points
- ✅ Analytics en temps réel
- ✅ Classement des partageurs
- ✅ Abonnement temps réel aux nouveaux partages

### 2. **`contexts/ShareEngagementContext.tsx`** ✅
Contexte React pour la gestion globale des partages.

**Fonctionnalités:**
- ✅ Mode utilisateur et mode vendeur
- ✅ Synchronisation temps réel
- ✅ Gestion des analytics
- ✅ Notifications automatiques

### 3. **`PARTAGE_ENGAGEMENT_SUPABASE.sql`** ✅
Script SQL complet pour créer les tables et fonctions.

---

## 🗄️ Structure Base de Données

### Table: `product_shares`

Enregistre tous les partages de produits.

```sql
CREATE TABLE product_shares (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  product_id UUID NOT NULL,
  vendor_id UUID REFERENCES users(id),
  platform VARCHAR(50), -- facebook, twitter, whatsapp, etc.
  share_url TEXT,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Table: `share_interactions`

Trace toutes les interactions sur les partages.

```sql
CREATE TABLE share_interactions (
  id UUID PRIMARY KEY,
  share_id UUID REFERENCES product_shares(id),
  interaction_type VARCHAR(50), -- view, click, conversion, purchase
  user_id UUID REFERENCES users(id),
  ip_address VARCHAR(45),
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Table: `user_points_transactions`

Historique de toutes les transactions de points.

```sql
CREATE TABLE user_points_transactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  points INTEGER NOT NULL,
  type VARCHAR(50), -- share, conversion, purchase, bonus, withdrawal
  reference_id UUID,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🎯 Système de Points

### Points par Plateforme:

| Plateforme | Points |
|------------|--------|
| Facebook   | 10     |
| Instagram  | 10     |
| LinkedIn   | 12     |
| Twitter    | 8      |
| Email      | 7      |
| WhatsApp   | 5      |
| Copy Link  | 3      |

### Points Bonus:

- **Conversion**: +20 points
- **Achat**: +20 points

---

## 🔄 Fonctionnement

### Scénario: Client partage un produit

1. **Client clique sur "Partager"**
   ```typescript
   await recordShare(productId, vendorId, 'facebook', shareUrl)
   ```
   → Partage enregistré dans Supabase
   → Points ajoutés automatiquement

2. **Supabase Realtime**
   → Notifie le client en temps réel
   → Met à jour les analytics

3. **Quelqu'un clique sur le lien**
   ```typescript
   await recordInteraction(shareId, 'click')
   ```
   → Interaction tracée

4. **Conversion/Achat**
   ```typescript
   await recordInteraction(shareId, 'purchase')
   ```
   → +20 points bonus automatiques

---

## 📊 Analytics Disponibles

### Pour les Utilisateurs:
- Total de partages
- Partages par plateforme
- Total d'interactions
- Interactions par type
- Points totaux gagnés
- Taux de conversion
- Classement

### Pour les Vendeurs:
- Total de partages de leurs produits
- Nombre de partageurs uniques
- Produits les plus partagés
- Interactions totales
- Taux de conversion
- Impact des partages sur les ventes

---

## 🚀 Utilisation

### Dans un Composant React:

```typescript
import { useShareEngagement } from '@/contexts/ShareEngagementContext'

function MyComponent() {
  const { 
    shares, 
    analytics, 
    recordShare, 
    isLoading 
  } = useShareEngagement()

  const handleShare = async (platform: string) => {
    const success = await recordShare(
      productId,
      vendorId,
      platform,
      shareUrl
    )
    
    if (success) {
      console.log('Partage enregistré!')
    }
  }

  return (
    <div>
      <p>Total partages: {analytics?.total_shares}</p>
      <p>Points gagnés: {analytics?.total_points_earned}</p>
      <button onClick={() => handleShare('facebook')}>
        Partager sur Facebook
      </button>
    </div>
  )
}
```

### Avec Provider:

```typescript
// Pour un utilisateur
<ShareEngagementProvider userId={user.id} mode="user">
  <MyComponent />
</ShareEngagementProvider>

// Pour un vendeur
<ShareEngagementProvider vendorId={vendor.id} mode="vendor">
  <VendorDashboard />
</ShareEngagementProvider>
```

---

## 📈 Vues et Fonctions SQL

### Vue: `user_share_stats`
Statistiques de partage par utilisateur.

```sql
SELECT * FROM user_share_stats WHERE user_id = 'user-uuid';
```

### Vue: `vendor_share_stats`
Statistiques de partage par vendeur.

```sql
SELECT * FROM vendor_share_stats WHERE vendor_id = 'vendor-uuid';
```

### Fonction: `calculate_conversion_rate(user_id)`
Calcule le taux de conversion d'un utilisateur.

```sql
SELECT calculate_conversion_rate('user-uuid');
```

### Fonction: `get_share_leaderboard(limit)`
Récupère le classement des meilleurs partageurs.

```sql
SELECT * FROM get_share_leaderboard(10);
```

---

## 🔐 Sécurité (RLS)

### Politiques Configurées:

- ✅ Les utilisateurs voient uniquement leurs propres partages
- ✅ Les vendeurs voient les partages de leurs produits
- ✅ Les interactions sont publiques (pour le tracking)
- ✅ Les transactions de points sont privées

---

## 🎨 Composants UI à Créer

### Pour le Client:
1. **Boutons de Partage** - Sur chaque produit
2. **Historique des Partages** - Dans le dashboard
3. **Analytics Personnelles** - Graphiques et stats
4. **Classement** - Voir sa position

### Pour le Vendeur:
1. **Analytics de Partage** - Dashboard vendeur
2. **Produits les Plus Partagés** - Top liste
3. **Impact sur les Ventes** - Corrélation
4. **Partageurs Actifs** - Liste des clients qui partagent

---

## 🔄 Temps Réel

### Événements Synchronisés:

- ✅ Nouveau partage → Notification instantanée
- ✅ Nouvelle interaction → Mise à jour analytics
- ✅ Points gagnés → Notification + mise à jour solde
- ✅ Classement → Mise à jour en temps réel

---

## 📝 TODO - Prochaines Étapes

1. ✅ Service créé
2. ✅ Contexte créé
3. ✅ SQL créé
4. ⏳ Créer les composants UI synchronisés
5. ⏳ Intégrer dans le dashboard client
6. ⏳ Intégrer dans le dashboard vendeur
7. ⏳ Créer les boutons de partage sur les produits
8. ⏳ Tester la synchronisation temps réel

---

## 🎯 Avantages

- ✅ **Traçage complet** - Chaque partage et interaction est enregistré
- ✅ **Temps réel** - Synchronisation instantanée
- ✅ **Gamification** - Système de points motivant
- ✅ **Analytics** - Insights détaillés pour tous
- ✅ **Scalable** - Architecture robuste avec Supabase
- ✅ **Sécurisé** - RLS configuré correctement

---

**Date de création**: 2025-10-07
**Statut**: ✅ Backend créé - En attente d'intégration UI
**Prochaine étape**: Créer les composants UI et intégrer dans les dashboards
