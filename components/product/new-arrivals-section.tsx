"use client"

import { useEffect, useMemo, useState } from "react"
import NewArrivalCard from "./new-arrival-card"
import { useNotifications, NotificationContainer } from "@/components/ui/modern-notification"
import { enrichProductWithSpecs } from "@/lib/product-specifications"
import PointsPurchaseModal from "./points-purchase-modal"
import { useClientPoints } from "@/lib/hooks/use-client-points"
import { useAuthGuard } from "@/lib/hooks/use-auth-guard"

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

interface Product {
  id: string
  name: string
  price: number
  salePrice?: number | null
  pointsPrice: number
  originalPrice?: number
  rating: number
  reviews: number
  image: string
  seller: string
  vendorId?: string
  stockQuantity?: number | null
  sharePoints: number
  shares: number
  inStock: boolean
  discount: number
  isHot: boolean
  isNew: boolean
  isLimited: boolean
  badges: string[]
  color: string
  rank: number
  sales: number
  daysAgo: number
}

interface NewArrivalsSectionProps {
  onProductClick?: (product: Product) => void;
  onStartChat?: (product: Product) => void;
  searchQuery?: string;
  sort?: 'newest' | 'rating' | 'price-low' | 'price-high';
}

export default function NewArrivalsSection({ onProductClick, onStartChat, searchQuery, sort }: NewArrivalsSectionProps) {
  const [isPointsModalOpen, setIsPointsModalOpen] = useState(false)
  const [selectedProductForPoints, setSelectedProductForPoints] = useState<Product | null>(null)
  const [items, setItems] = useState<Product[]>([])
  const [adminPointsConfig, setAdminPointsConfig] = useState<{ purchaseValue: number } | null>(null)
  const { configuration: pointsConfiguration } = useClientPoints()
  const { requireAuth } = useAuthGuard()
  
  // Hook pour les notifications modernes
  const { addNotification } = useNotifications()

  /**
   * Vérifie si une date est dans les N derniers jours.
   */
  const isWithinLastDays = (value: string, days: number): boolean => {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return false

    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    if (diffMs < 0) return false

    const diffDays = diffMs / (1000 * 60 * 60 * 24)
    return diffDays <= days
  }

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const res = await fetch('/api/public/products/list?limit=60', { method: 'GET', cache: 'no-store' })
        const json = await res.json().catch(() => null)
        const raw = Array.isArray(json?.data?.items) ? json.data.items : []

        const filtered = raw
          .filter((p: any) => typeof p?.createdAt === 'string' && isWithinLastDays(String(p.createdAt), 30))
          .slice(0, 60)

        const mapped: Product[] = filtered.map((p: any, idx: number) => {
          const id = String(p?.id ?? '')
          const vendorId = typeof p?.vendorId === 'string' && UUID_REGEX.test(String(p.vendorId)) ? String(p.vendorId) : undefined
          const regularPrice = Number(p?.price ?? 0) || 0
          const salePrice = p?.salePrice === null || p?.salePrice === undefined ? null : (Number(p.salePrice) || null)
          const effectivePrice = (typeof salePrice === 'number' && Number.isFinite(salePrice) && salePrice > 0) ? salePrice : regularPrice
          const originalPrice = regularPrice
          const pointsPrice = Number(p?.pointsPrice ?? Math.max(1, Math.round(effectivePrice / 200))) || 0
          const rating = Number(p?.rating ?? 0) || 0
          const reviews = Number(p?.reviews ?? 0) || 0
          const seller = String(p?.sellerName ?? p?.seller ?? 'Boutique')
          const discount =
            originalPrice > 0 && typeof salePrice === 'number' && Number.isFinite(salePrice) && salePrice > 0 && salePrice < originalPrice
              ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
              : 0

          return {
            id,
            name: String(p?.name ?? 'Produit'),
            price: regularPrice,
            salePrice,
            pointsPrice,
            originalPrice,
            rating,
            reviews,
            image: String(p?.image ?? '/placeholder.svg'),
            seller,
            vendorId,
            stockQuantity: (p as any)?.stockQuantity ?? null,
            sharePoints: Number(p?.sharePoints ?? 50) || 0,
            shares: Number(p?.shares ?? 0) || 0,
            inStock: Boolean(p?.inStock ?? true),
            discount,
            isHot: Boolean(p?.isHot ?? false),
            isNew: true,
            isLimited: Boolean(p?.isLimited ?? false),
            badges: Array.isArray(p?.badges) ? p.badges : [],
            color: String(p?.color ?? 'black'),
            rank: idx + 1,
            sales: Number(p?.sales ?? 0) || 0,
            daysAgo: 30
          }
        })

        if (!cancelled) setItems(mapped)
      } catch {
        if (!cancelled) setItems([])
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const loadAdminPointsConfig = async () => {
      try {
        const resp = await fetch('/api/public/points-config', { method: 'GET', cache: 'no-store' }).catch(() => null)
        const json = await resp?.json().catch(() => null)
        const payload = json?.data
        const raw = payload?.purchaseValue
        const normalized = typeof raw === 'string' ? raw.trim().replace(',', '.') : raw
        const numeric = Number(normalized)
        const safePurchaseValue = Number.isFinite(numeric) && numeric > 0 ? numeric : NaN
        if (cancelled) return
        if (Number.isFinite(safePurchaseValue)) {
          setAdminPointsConfig({ purchaseValue: safePurchaseValue })
        }
      } catch {
        // noop
      }
    }

    void loadAdminPointsConfig()

    return () => {
      cancelled = true
    }
  }, [])

  const purchaseValue = (() => {
    const raw = (pointsConfiguration?.settings as any)?.purchaseValue ?? adminPointsConfig?.purchaseValue
    const normalized = typeof raw === 'string' ? raw.trim().replace(',', '.') : raw
    const numeric = Number(normalized)
    return Number.isFinite(numeric) && numeric > 0 ? numeric : 1
  })()

  const newArrivalsProducts = useMemo(() => {
    const q = String(searchQuery ?? '').trim().toLowerCase()
    let result = items

    result = result.map((p) => {
      const sale = (typeof p.salePrice === 'number' && Number.isFinite(p.salePrice) && p.salePrice > 0) ? p.salePrice : null
      const effective = sale ?? p.price
      const pointsPrice = Math.max(0, Math.round(Number(effective || 0) / purchaseValue))
      return {
        ...p,
        pointsPrice
      }
    })

    if (q.length > 0) {
      result = result.filter((p) => String(p?.name ?? '').toLowerCase().includes(q))
    }

    const sortKey = sort ?? 'newest'
    if (sortKey === 'rating') {
      result = [...result].sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0))
    } else if (sortKey === 'price-low') {
      result = [...result].sort((a, b) => (Number(a.salePrice ?? a.price) || 0) - (Number(b.salePrice ?? b.price) || 0))
    } else if (sortKey === 'price-high') {
      result = [...result].sort((a, b) => (Number(b.salePrice ?? b.price) || 0) - (Number(a.salePrice ?? a.price) || 0))
    } else {
      // newest: déjà triés par created_at desc via l'API
      result = result
    }

    return result.slice(0, 12)
  }, [items, searchQuery, sort, purchaseValue])



  // Fonction pour acheter avec des points
  const handleBuyWithPoints = (product: Product) => {
    if (!requireAuth("Connectez-vous pour passer une commande.")) {
      return
    }
    setSelectedProductForPoints(product)
    setIsPointsModalOpen(true)
  }

  // Fonction pour gérer l'achat avec points
  const handlePointsPurchase = (product: Product, usePoints: boolean, pointsToUse: number) => {
    // Simulation d'un achat avec points
    console.log(`Achat du produit ${product.name} avec ${pointsToUse} points`)
    
    // Ici vous pouvez ajouter la logique d'achat réelle
    // Par exemple, appeler une API pour traiter l'achat
    
            addNotification({ 
  type: 'success', 
  title: 'Achat confirmé', 
  message: '${product.name} acheté avec ${pointsToUse} points' 
})
    
    // Fermer le modal
    setIsPointsModalOpen(false)
    setSelectedProductForPoints(null)
  }

  // Fonction pour partager
  const handleShare = (product: Product, platform: string) => {
    if (!requireAuth("Connectez-vous pour gagner des points en partageant.")) {
      return
    }
    try {
      const shareUrls = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(`Découvrez ${product.name} sur notre marketplace !`)}`,
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Découvrez ${product.name} sur notre marketplace !`)}&url=${encodeURIComponent(window.location.href)}`,
        whatsapp: `https://wa.me/?text=${encodeURIComponent(`Découvrez ${product.name} sur notre marketplace ! ${window.location.href}`)}`
      }
      
      const url = shareUrls[platform as keyof typeof shareUrls]
      if (url) {
        window.open(url, '_blank', 'width=600,height=400')
        addNotification({ 
  type: 'success', 
  title: 'Produit partagé', 
  message: 'Produit partagé sur ${platform} ! +${Math.floor(product.sharePoints * 0.5)} points gagnés' 
})
      }
    } catch (error) {
      console.error('Erreur lors du partage:', error)
              addNotification({ 
  type: 'error', 
  title: 'Erreur', 
  message: 'Impossible de partager le produit' 
})
    }
  }

  // Fonction pour démarrer un chat
  const handleStartChat = (product: Product) => {
    if (!requireAuth("Connectez-vous pour écrire au vendeur.")) {
      return
    }
    if (onStartChat) {
      onStartChat(product)
    } else {
      try {
        // Logique de fallback pour démarrer un chat
        addNotification({ 
  type: 'success', 
  title: 'Chat démarré', 
  message: 'Chat démarré avec le vendeur de ${product.name}' 
})
      } catch (error) {
        console.error('Erreur lors du démarrage du chat:', error)
        addNotification({ 
  type: 'error', 
  title: 'Erreur', 
  message: 'Impossible de démarrer le chat' 
})
      }
    }
  }

  // Fonction pour comparer
  const handleCompare = (product: Product) => {
    if (!requireAuth("Connectez-vous pour comparer des produits.")) {
      return
    }
    try {
      // Récupérer la liste de comparaison existante
      const existingCompareList = localStorage.getItem('compareList')
      let compareList = existingCompareList ? JSON.parse(existingCompareList) : []
      
      // Vérifier si le produit est déjà dans la liste
      if (compareList.find((p: any) => p.id === product.id)) {
        addNotification({ 
  type: 'warning', 
  title: 'Déjà en comparaison', 
  message: 'Ce produit est déjà dans votre liste de comparaison' 
})
        return
      }
      
      // Vérifier la limite de 4 produits
      if (compareList.length >= 4) {
        addNotification({ 
  type: 'warning', 
  title: 'Limite atteinte', 
  message: 'Vous ne pouvez comparer que 4 produits maximum' 
})
        return
      }
      
      // Fonction pour vérifier si deux produits sont similaires
      const areProductsSimilar = (product1: any, product2: any): boolean => {
        // Vérifier la catégorie (basée sur le nom du produit)
        const category1 = product1.name.toLowerCase()
        const category2 = product2.name.toLowerCase()
        
        if (category1.includes('iphone') && category2.includes('iphone')) return true
        if (category1.includes('samsung') && category2.includes('samsung')) return true
        if (category1.includes('macbook') && category2.includes('macbook')) return true
        if (category1.includes('playstation') && category2.includes('playstation')) return true
        if (category1.includes('tesla') && category2.includes('tesla')) return true
        if (category1.includes('dyson') && category2.includes('dyson')) return true
        
        // Vérifier la gamme de prix (différence < 50%)
        const price1 = product1.price || 0
        const price2 = product2.price || 0
        if (price1 > 0 && price2 > 0) {
          const priceDiff = Math.abs(price1 - price2)
          const avgPrice = (price1 + price2) / 2
          
          if (priceDiff / avgPrice < 0.5) { // Différence de prix < 50%
            return true
          }
        }
        
        return false
      }
      
      // Fonction pour vérifier si un produit peut être ajouté
      const canAddToCompare = (newProduct: any, existingList: any[]): { canAdd: boolean, reason?: string } => {
        if (existingList.find(p => p.id === newProduct.id)) {
          return { canAdd: false, reason: 'Ce produit est déjà dans votre liste de comparaison' }
        }
        
        if (existingList.length >= 4) {
          return { canAdd: false, reason: 'Vous ne pouvez comparer que 4 produits maximum' }
        }
        
        if (existingList.length === 0) {
          return { canAdd: true }
        }
        
        const hasSimilarProduct = existingList.some(existingProduct => 
          areProductsSimilar(newProduct, existingProduct)
        )
        
        if (!hasSimilarProduct) {
          return { 
            canAdd: false, 
            reason: 'Ce produit n\'est pas similaire aux produits déjà en comparaison. Vous ne pouvez comparer que des produits de même marque, catégorie, domaine d\'intérêt ou gamme de prix.' 
          }
        }
        
        return { canAdd: true }
      }
      
      const { canAdd, reason } = canAddToCompare(product, compareList)
      
      if (canAdd) {
        // Enrichir le produit avec des spécifications techniques
        const enrichedProduct = enrichProductWithSpecs(product)
        compareList.push(enrichedProduct)
        localStorage.setItem('compareList', JSON.stringify(compareList))
        
        // Déclencher un événement personnalisé pour notifier le header
        window.dispatchEvent(new CustomEvent('compareListUpdated', { 
          detail: { compareList, length: compareList.length } 
        }))
        
        addNotification({ 
  type: 'success', 
  title: 'Produit ajouté', 
  message: '${product.name} a été ajouté à votre liste de comparaison' 
})
      } else {
        addNotification({
          type: 'warning',
          title: 'Impossible d\'ajouter',
          message: reason || 'Impossible d\'ajouter ce produit à la comparaison'
        })
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout à la comparaison:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible d\'ajouter le produit à la comparaison'
      })
    }
  }

  return (
    <div className="space-y-8">
      {/* Container des notifications modernes */}
      <NotificationContainer />
      
      {/* Titre de la section */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          <span className="text-[#ff6600]">Nouveautés</span> Exclusives
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Découvrez les derniers produits ajoutés à notre marketplace avec des offres exclusives
        </p>
      </div>

      {/* Grille des nouveautés */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {newArrivalsProducts.map((product) => (
          <NewArrivalCard
            key={product.id}
            product={product}
            onBuyWithPoints={handleBuyWithPoints}
            onShare={handleShare}
            onStartChat={handleStartChat}
            onCompare={handleCompare}
            onProductClick={onProductClick}
          />
        ))}
      </div>

      {/* Modal d'achat avec points */}
      {selectedProductForPoints && (
        <PointsPurchaseModal
          isOpen={isPointsModalOpen}
          onClose={() => {
            setIsPointsModalOpen(false)
            setSelectedProductForPoints(null)
          }}
          product={{
            id: selectedProductForPoints.id,
            name: selectedProductForPoints.name,
            price: selectedProductForPoints.price,
            pointsPrice: selectedProductForPoints.pointsPrice,
            image: selectedProductForPoints.image,
            rating: selectedProductForPoints.rating,
            reviews: selectedProductForPoints.reviews,
            discount: selectedProductForPoints.discount,
            isHot: selectedProductForPoints.isHot,
            isNew: selectedProductForPoints.isNew,
            isLimited: selectedProductForPoints.isLimited
          }}
          onPurchase={handlePointsPurchase}
        />
      )}
    </div>
  )
}
