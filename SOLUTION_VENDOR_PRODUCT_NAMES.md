# 🔧 Solution: Récupérer vendor_name et product_name

## ⚠️ Problème

Les composants utilisent `campaign.vendorName` et `campaign.productName` mais Supabase stocke uniquement les IDs:
- `campaign.vendor_id` (UUID)
- `campaign.product_id` (UUID)

---

## ✅ SOLUTION 1: Jointure SQL (Recommandé)

### Modifier `BoostingCampaignManager.getAllCampaigns()`

**Fichier:** `lib/services/marketing-service.ts`

```typescript
static async getAllCampaigns(): Promise<BoostingCampaign[]> {
  const { data, error } = await supabase
    .from('boosting_campaigns')
    .select(`
      *,
      vendor:users!vendor_id(id, full_name, email),
      product:products(id, name, price)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erreur récupération campagnes:', error)
    return []
  }

  // Transformer les données pour ajouter vendorName et productName
  return (data || []).map(campaign => ({
    ...campaign,
    vendorName: campaign.vendor?.full_name || 'Vendeur Inconnu',
    productName: campaign.product?.name || 'Produit Inconnu'
  }))
}
```

### Modifier l'Interface BoostingCampaign

```typescript
export interface BoostingCampaign {
  id: string
  vendor_id: string
  product_id: string
  service_id: string
  type: 'recommendation' | 'banner' | 'whatsapp'
  status: 'pending' | 'active' | 'paused' | 'completed' | 'rejected'
  start_date: string | null
  end_date: string | null
  target_pages: string[]
  duration: number | null
  total_cost: number
  payment_status: 'pending' | 'paid' | 'failed'
  payment_id: string | null
  payment_method: string | null
  rejection_reason: string | null
  created_at: string
  updated_at: string
  
  // Propriétés ajoutées par jointure
  vendorName?: string
  productName?: string
  vendor?: { id: string; full_name: string; email: string }
  product?: { id: string; name: string; price: number }
}
```

---

## ✅ SOLUTION 2: Charger Séparément

### Dans le Composant

```typescript
const loadData = async () => {
  setLoading(true)
  try {
    // Charger les campagnes
    const campaignsData = await BoostingCampaignManager.getAllCampaigns()
    
    // Pour chaque campagne, récupérer le nom du vendeur et du produit
    const campaignsWithNames = await Promise.all(
      campaignsData.map(async (campaign) => {
        // Récupérer le vendeur
        const { data: vendor } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', campaign.vendor_id)
          .single()
        
        // Récupérer le produit
        const { data: product } = await supabase
          .from('products')
          .select('name')
          .eq('id', campaign.product_id)
          .single()
        
        return {
          ...campaign,
          vendorName: vendor?.full_name || 'Vendeur Inconnu',
          productName: product?.name || 'Produit Inconnu'
        }
      })
    )
    
    setCampaigns(campaignsWithNames)
  } catch (error) {
    console.error('Erreur:', error)
  } finally {
    setLoading(false)
  }
}
```

---

## ✅ SOLUTION 3: Afficher les IDs Temporairement

### Modification Rapide dans le JSX

```typescript
// Au lieu de:
<h4>{campaign.vendorName}</h4>

// Utiliser temporairement:
<h4>Vendeur: {campaign.vendor_id.substring(0, 8)}...</h4>

// Ou:
<h4>Campagne #{campaign.id.substring(0, 8)}</h4>
```

---

## 🎯 RECOMMANDATION

**Utiliser SOLUTION 1** car:
- ✅ Plus performant (1 seule requête)
- ✅ Données toujours à jour
- ✅ Code plus propre
- ✅ Pas de requêtes supplémentaires

---

## 📝 IMPLÉMENTATION SOLUTION 1

### Étape 1: Modifier marketing-service.ts

```typescript
// Dans BoostingCampaignManager
static async getAllCampaigns(): Promise<BoostingCampaign[]> {
  const { data, error } = await supabase
    .from('boosting_campaigns')
    .select(`
      *,
      vendor:users!vendor_id(full_name),
      product:products(name)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erreur récupération campagnes:', error)
    return []
  }

  return (data || []).map(campaign => ({
    ...campaign,
    vendorName: campaign.vendor?.full_name || 'Inconnu',
    productName: campaign.product?.name || 'Inconnu'
  }))
}

static async getVendorCampaigns(vendorId: string): Promise<BoostingCampaign[]> {
  const { data, error } = await supabase
    .from('boosting_campaigns')
    .select(`
      *,
      product:products(name)
    `)
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erreur récupération campagnes vendeur:', error)
    return []
  }

  return (data || []).map(campaign => ({
    ...campaign,
    productName: campaign.product?.name || 'Inconnu'
  }))
}
```

### Étape 2: Mettre à jour l'Interface

```typescript
export interface BoostingCampaign {
  // ... (tous les champs existants)
  
  // Propriétés calculées
  vendorName?: string
  productName?: string
  vendor?: { full_name: string }
  product?: { name: string }
}
```

### Étape 3: Utiliser dans les Composants

```typescript
// Maintenant ça fonctionne:
<h4>{campaign.vendorName}</h4>
<h4>{campaign.productName}</h4>
```

---

## ⚡ IMPLÉMENTATION RAPIDE

Je vais implémenter la Solution 1 maintenant!
