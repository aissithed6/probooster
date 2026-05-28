# 📊 Analyse - Système Marketing et Promotions

## 🎯 Objectif

Synchroniser le système Marketing et Promotions avec Supabase pour permettre:
1. **Admins:** Créer des services de boostage et des promotions
2. **Vendeurs:** Acheter des services et bénéficier des promotions
3. **Système:** Activer automatiquement les boostages et appliquer les promotions

---

## 📋 Composants Analysés

### 1. **Admin/Super Admin**
**Fichier:** `components/super-admin/marketing-promotions.tsx`

**Interfaces:**
```typescript
interface BoostingService {
  id: string
  name: string
  description: string
  type: 'recommendation' | 'banner' | 'whatsapp'
  basePrice: number
  pricingModel: 'per_page_day' | 'per_message_country' | 'fixed'
  features: string[]
  isActive: boolean
}

interface BoostingCampaign {
  id: string
  vendorId: string
  vendorName: string
  type: 'recommendation' | 'banner' | 'whatsapp'
  status: 'pending' | 'active' | 'paused' | 'completed' | 'rejected'
  startDate: string
  endDate: string
  targetPages: string[]
  duration: number
  totalCost: number
  paymentStatus: 'pending' | 'paid' | 'failed'
  performance?: {
    impressions: number
    clicks: number
    conversions: number
    ctr: number
    conversionRate: number
  }
}

interface PromotionCampaign {
  id: string
  name: string
  type: 'coupon' | 'discount' | 'flash_sale' | 'bundle'
  status: 'draft' | 'active' | 'paused' | 'ended'
  startDate: string
  endDate: string
  discountType: 'percentage' | 'fixed' | 'free_shipping'
  discountValue: number
  minOrderAmount?: number
  maxDiscount?: number
  usageLimit: number
  usedCount: number
  targetAudience: string[]
}
```

### 2. **Vendeur**
**Fichier:** `components/seller-dashboard/marketing-promotions.tsx`

**Interfaces similaires mais avec:**
```typescript
interface BoostingCampaign {
  productId: string  // Lié à un produit spécifique
  productName: string
  status: 'draft' | 'pending' | 'active' | 'paused' | 'completed' | 'rejected'
}
```

---

## 🗄️ Tables Supabase Nécessaires

### 1. **boosting_services** (Services créés par les admins)
```sql
CREATE TABLE boosting_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL, -- 'recommendation', 'banner', 'whatsapp'
  base_price DECIMAL(10,2) NOT NULL,
  pricing_model VARCHAR(50) NOT NULL, -- 'per_page_day', 'per_message_country', 'fixed'
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. **boosting_campaigns** (Campagnes achetées par les vendeurs)
```sql
CREATE TABLE boosting_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES users(id) NOT NULL,
  product_id UUID, -- Optionnel, peut être NULL pour boostage général
  service_id UUID REFERENCES boosting_services(id) NOT NULL,
  type VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'draft', 'pending', 'active', 'paused', 'completed', 'rejected'
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  target_pages JSONB DEFAULT '[]',
  duration INTEGER, -- En jours
  total_cost DECIMAL(10,2) NOT NULL,
  payment_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid', 'failed'
  payment_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. **boosting_performance** (Statistiques de performance)
```sql
CREATE TABLE boosting_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES boosting_campaigns(id) NOT NULL,
  date DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  ctr DECIMAL(5,2) DEFAULT 0, -- Click-through rate
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(campaign_id, date)
);
```

### 4. **promotions** (Promotions créées par les admins)
```sql
CREATE TABLE promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE, -- Code promo (optionnel)
  type VARCHAR(50) NOT NULL, -- 'coupon', 'discount', 'flash_sale', 'bundle'
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'active', 'paused', 'ended'
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  discount_type VARCHAR(50) NOT NULL, -- 'percentage', 'fixed', 'free_shipping'
  discount_value DECIMAL(10,2) NOT NULL,
  min_order_amount DECIMAL(10,2),
  max_discount DECIMAL(10,2),
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  target_audience JSONB DEFAULT '[]', -- ['all', 'new_customers', 'vip', etc.]
  applicable_products JSONB DEFAULT '[]', -- IDs des produits concernés
  applicable_categories JSONB DEFAULT '[]',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 5. **promotion_usage** (Utilisation des promotions)
```sql
CREATE TABLE promotion_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id UUID REFERENCES promotions(id) NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  order_id UUID, -- Référence à la commande
  discount_amount DECIMAL(10,2) NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🔄 Flux de Fonctionnement

### A. Services de Boostage

#### 1. **Admin crée un service**
```
Admin Dashboard → Créer Service
↓
Supabase: INSERT INTO boosting_services
↓
Service disponible pour tous les vendeurs
```

#### 2. **Vendeur achète un service**
```
Vendeur Dashboard → Choisir Service → Choisir Produit → Payer
↓
Supabase: INSERT INTO boosting_campaigns (status='pending', payment_status='pending')
↓
Traitement du paiement
↓
UPDATE boosting_campaigns SET payment_status='paid'
↓
Admin approuve (optionnel)
↓
UPDATE boosting_campaigns SET status='active', start_date=NOW()
```

#### 3. **Activation automatique**
```
Fonction Supabase (Trigger ou Cron)
↓
Vérifier: payment_status='paid' AND start_date <= NOW() AND end_date >= NOW()
↓
UPDATE boosting_campaigns SET status='active'
↓
Produit affiché dans les zones de boostage
```

### B. Promotions

#### 1. **Admin crée une promotion**
```
Admin Dashboard → Créer Promotion
↓
Supabase: INSERT INTO promotions (status='draft')
↓
Admin active
↓
UPDATE promotions SET status='active'
```

#### 2. **Application automatique**
```
Client ajoute produit au panier
↓
Vérifier: SELECT * FROM promotions WHERE status='active' AND applicable_products CONTAINS product_id
↓
Appliquer réduction automatiquement
↓
INSERT INTO promotion_usage
```

---

## 🎯 Fonctionnalités à Implémenter

### Admin
- ✅ Créer/Modifier/Supprimer services de boostage
- ✅ Créer/Modifier/Supprimer promotions
- ✅ Approuver/Rejeter campagnes de boostage
- ✅ Voir statistiques globales
- ✅ Gérer les paiements

### Vendeur
- ✅ Voir services disponibles
- ✅ Acheter un service pour un produit
- ✅ Voir ses campagnes actives
- ✅ Voir statistiques de performance
- ✅ Mettre en pause/Reprendre campagne
- ✅ Voir promotions applicables à ses produits

### Système
- ✅ Activer automatiquement les campagnes payées
- ✅ Désactiver les campagnes expirées
- ✅ Appliquer automatiquement les promotions
- ✅ Calculer les statistiques de performance
- ✅ Envoyer notifications (campagne activée, promotion appliquée, etc.)

---

## 📝 Prochaines Étapes

1. ✅ Créer le schéma SQL complet
2. ✅ Créer les services TypeScript
3. ✅ Synchroniser composant Admin
4. ✅ Synchroniser composant Vendeur
5. ✅ Implémenter triggers/fonctions automatiques
6. ✅ Tester le flux complet

---

**Date:** 2025-10-07 22:08
**Statut:** Analyse complète - Prêt pour implémentation
