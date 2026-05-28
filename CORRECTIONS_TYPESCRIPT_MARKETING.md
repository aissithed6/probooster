# 🔧 Corrections TypeScript - Marketing & Promotions

## ⚠️ Problème Principal

Les interfaces locales utilisent **camelCase** alors que Supabase utilise **snake_case**.

**Exemple:**
- Local: `isActive`, `basePrice`, `totalCost`
- Supabase: `is_active`, `base_price`, `total_cost`

---

## ✅ Solutions

### Option 1: Supprimer les Interfaces Locales (Recommandé)

Supprimer les interfaces `BoostingCampaign`, `BoostingService`, `PromotionCampaign` locales et utiliser uniquement celles de Supabase.

**Dans le fichier:**
```typescript
// SUPPRIMER ces interfaces:
interface BoostingCampaign { ... }
interface BoostingService { ... }
interface PromotionCampaign { ... }

// GARDER uniquement les imports:
import {
  type BoostingService,
  type BoostingCampaign,
  type Promotion
} from '@/lib/services/marketing-service'
```

### Option 2: Créer des Adaptateurs

Créer des fonctions pour convertir entre les formats:

```typescript
// Convertir Supabase → Local
const toLocalCampaign = (campaign: BoostingCampaignType): BoostingCampaign => ({
  id: campaign.id,
  vendorId: campaign.vendor_id,
  vendorName: '', // À récupérer depuis users
  type: campaign.type,
  status: campaign.status,
  startDate: campaign.start_date || '',
  endDate: campaign.end_date || '',
  targetPages: campaign.target_pages,
  duration: campaign.duration || 0,
  totalCost: campaign.total_cost,
  paymentStatus: campaign.payment_status,
  createdAt: campaign.created_at
})
```

---

## 🚀 Solution Rapide (Recommandée)

### Étape 1: Supprimer les interfaces locales

Dans `components/super-admin/marketing-promotions.tsx`, supprimer:
- `interface BoostingCampaign`
- `interface BoostingService`
- `interface PromotionCampaign`

### Étape 2: Utiliser les types Supabase

Remplacer partout:
- `BoostingCampaign` → `BoostingCampaignType`
- `BoostingService` → `BoostingServiceType`
- `PromotionCampaign` → `PromotionType`

### Étape 3: Corriger les propriétés dans le JSX

Remplacer:
- `service.isActive` → `service.is_active`
- `service.basePrice` → `service.base_price`
- `service.pricingModel` → `service.pricing_model`
- `campaign.totalCost` → `campaign.total_cost`
- `campaign.startDate` → `campaign.start_date`
- `campaign.endDate` → `campaign.end_date`
- `campaign.vendorName` → Récupérer depuis `users` table
- `promotion.discountType` → `promotion.discount_type`
- `promotion.discountValue` → `promotion.discount_value`

---

## 📝 Corrections Nécessaires

### 1. Notifications (lignes 273, 279)
```typescript
// AVANT:
addNotification({ type: 'success', message: '...' })

// APRÈS:
addNotification({ type: 'success', title: 'Succès', message: '...' })
```

### 2. handleCreateService (ligne 447)
```typescript
// SUPPRIMER:
created_at: new Date().toISOString(),
updated_at: new Date().toISOString(),
id: ''

// Ces champs sont générés automatiquement par Supabase
```

### 3. handleCreatePromotion (ligne 641)
```typescript
// AJOUTER:
created_by: user.id

// Le champ est requis
```

---

## 🎯 Prochaines Actions

1. **Supprimer les interfaces locales**
2. **Utiliser uniquement les types Supabase**
3. **Corriger les propriétés snake_case dans le JSX**
4. **Tester la compilation**

---

**Note:** Les données de démo ont été supprimées. Toutes les données viennent maintenant de Supabase! ✅
