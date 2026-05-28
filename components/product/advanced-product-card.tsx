"use client"

import { useState, useEffect, type MouseEvent } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { 
  ShoppingCart, 
  Heart, 
  Star, 
  Share2, 
  Gift, 
  Clock, 
  Coins, 
  Zap, 
  Crown, 
  Flame,
  Sparkles,
  TrendingUp,
  Target,
  MessageCircle,
  Users,
  Award
} from "lucide-react"
import PointsPurchaseModal from "./points-purchase-modal"
import { useCart } from "@/hooks/use-cart"
import { useWishlist } from "@/hooks/use-wishlist"
import { ProductGlobalChatTrigger } from "@/components/chat"
import { LegacyChatModal } from "@/components/chat/LegacyChatModal"
import ShareButtons from "@/components/product/share-buttons"
import { useBestOfferPrice } from "@/hooks/useBestOfferPrice"
import { useToast } from "@/hooks/use-toast"
import { isProductEligibleForFreeShippingLabel } from "@/lib/utils/free-shipping-eligibility"
import { useDeliveryConfig } from "@/contexts/DeliveryConfigContext"
import { useVendorPresence } from "@/lib/hooks/use-vendor-presence"
import { useVendorSummary } from "@/lib/hooks/use-vendor-summary"
import { useAuth } from "@/contexts/AuthContext"
import { useClientPoints } from "@/lib/hooks/use-client-points"
import { useAuthGuard } from "@/lib/hooks/use-auth-guard"
import { ShareEngagementService } from "@/lib/services/share-engagement-service"

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * Normalise un nom vendeur en slug URL (minuscules, tirets, sans accents).
 */
function toSellerSlug(value: string): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

interface Product {
  id: string
  name: string
  price: number
  salePrice?: number | null
  pointsPrice: number
  originalPrice?: number
  warranty?: string
  returnPolicy?: string
  rating: number
  reviews: number
  image: string
  seller: string
  vendorId?: string
  categoryIds?: string[]
  sharePoints: number
  shares: number
  inStock: boolean
  stockQuantity?: number | null
  discount: number
  isHot: boolean
  isNew: boolean
  isLimited: boolean
  badges: string[]
  color: string
}

interface AdvancedProductCardProps {
  product: Product
  onBuyWithPoints: (product: Product) => void
  onCompare: (product: Product) => void
  onProductClick?: (product: any) => void
}

export default function AdvancedProductCard({
  product,
  onBuyWithPoints,
  onCompare,
  onProductClick
}: AdvancedProductCardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()
  const { requireAuth } = useAuthGuard()
  const [isClient, setIsClient] = useState(false)
  const [isPointsModalOpen, setIsPointsModalOpen] = useState(false)
  const [isChatModalOpen, setIsChatModalOpen] = useState(false)
  const [chatSellerId, setChatSellerId] = useState('')
  const [chatSellerName, setChatSellerName] = useState('')
  const [chatSellerAvatar, setChatSellerAvatar] = useState('')
  const [isFreeShippingLabelVisible, setIsFreeShippingLabelVisible] = useState(false)
  const { toast } = useToast()
  const { configuration: pointsConfiguration } = useClientPoints()

  const [sharePointsGlobal, setSharePointsGlobal] = useState<number>(0)
  const [shareCounts, setShareCounts] = useState<{ total: number; byPlatform: Record<string, number> }>({ total: 0, byPlatform: {} })
  const [adminPointsConfig, setAdminPointsConfig] = useState<{ purchaseValue: number } | null>(null)

  const { freeShippingConfig } = useDeliveryConfig()
  
  // Hooks pour le panier et la wishlist
  const { addToCart, isInCart, getItemQuantity } = useCart()
  const { toggleWishlist, isInWishlist } = useWishlist()

  const { offer: bestOffer } = useBestOfferPrice(product?.id)
  const baseSalePrice = typeof product?.salePrice === 'number' && Number.isFinite(product.salePrice) && product.salePrice > 0 ? product.salePrice : null
  const effectivePrice = bestOffer?.price ?? (baseSalePrice ?? product.price)
  const effectiveOriginalPrice = bestOffer?.originalPrice ?? (product.price)
  const effectiveDiscount = bestOffer?.discountPercent ?? product.discount

  const [resolvedVendorId, setResolvedVendorId] = useState('')

  useEffect(() => {
    let cancelled = false
    const direct = typeof (product as any)?.vendorId === 'string' ? String((product as any).vendorId).trim() : ''

    if (direct && UUID_REGEX.test(direct)) {
      setResolvedVendorId(direct)
      return
    }

    const pid = String((product as any)?.id ?? '').trim()
    if (!pid || !UUID_REGEX.test(pid)) {
      setResolvedVendorId('')
      return
    }

    ;(async () => {
      try {
        const res = await fetch(`/api/public/products?id=${encodeURIComponent(pid)}`, { method: 'GET' })
        const json = await res.json().catch(() => null)
        const vendorId = String(json?.data?.vendor_id ?? '').trim()
        if (cancelled) return
        setResolvedVendorId(UUID_REGEX.test(vendorId) ? vendorId : '')
      } catch {
        if (!cancelled) setResolvedVendorId('')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [product])

  const { isOnline } = useVendorPresence(resolvedVendorId)
  const { summary: vendorSummary } = useVendorSummary(resolvedVendorId)
  const isSellerOnline = isOnline === true
  const vendorRating = typeof vendorSummary?.averageRating === 'number' ? vendorSummary.averageRating : null
  const vendorReviewCount = typeof vendorSummary?.reviewCount === 'number' ? vendorSummary.reviewCount : null
  const ratingForUi = vendorRating !== null ? vendorRating : product.rating
  const reviewsForUi = vendorReviewCount !== null ? vendorReviewCount : product.reviews
  const responseTimeLabel = (() => {
    const secs = vendorSummary?.avgResponseSeconds
    if (typeof secs !== 'number') return ''
    const minutes = Math.max(1, Math.round(secs / 60))
    if (minutes < 60) return `~${minutes} min`
    const hours = Math.round(minutes / 60)
    return `~${hours} h`
  })()

  const sellerName = String(product.seller ?? '').trim() || 'Boutique'
  const sellerSlug = toSellerSlug(sellerName) || 'boutique'
  const sellerHref = `/seller/${sellerSlug}`

  /**
   * Charge la config de points de partage (Super Admin) + les compteurs réels de partages produit.
   */
  useEffect(() => {
    let mounted = true

    const loadShareStats = async () => {
      const pid = String((product as any)?.id ?? '').trim()
      if (!pid) return

      try {
        const [globalPoints, counts] = await Promise.all([
          ShareEngagementService.getPointsConfig('copy'),
          ShareEngagementService.getProductShareCounts(pid)
        ])

        if (!mounted) return
        setSharePointsGlobal(Number(globalPoints) || 0)
        setShareCounts(counts)
      } catch {
        // noop
      }
    }

    void loadShareStats()
    return () => {
      mounted = false
    }
  }, [product])

  useEffect(() => {
    const pid = String((product as any)?.id ?? '').trim()
    if (!pid) return

    const handler = (evt: any) => {
      const changedId = String(evt?.detail?.productId ?? '').trim()
      if (!changedId || changedId !== pid) return

      void (async () => {
        try {
          const counts = await ShareEngagementService.getProductShareCounts(pid)
          setShareCounts(counts)
        } catch {
          // noop
        }
      })()
    }

    try {
      if (typeof window !== 'undefined') {
        window.addEventListener('productShareRecorded', handler as any)
      }
    } catch {
      // noop
    }
    return () => {
      try {
        if (typeof window !== 'undefined') {
          window.removeEventListener('productShareRecorded', handler as any)
        }
      } catch {
        // noop
      }
    }
  }, [product])

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

  const computedPointsPrice = Math.max(0, Math.round(Number(effectivePrice || 0) / purchaseValue))

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    let mounted = true

    const loadFreeShippingLabel = async () => {
      const pid = String((product as any)?.id ?? '').trim()
      if (!UUID_REGEX.test(pid)) {
        if (mounted) setIsFreeShippingLabelVisible(false)
        return
      }

      const vendorFromProp = typeof (product as any)?.vendorId === 'string' ? String((product as any).vendorId).trim() : ''
      const categoriesFromProp = Array.isArray((product as any)?.categoryIds)
        ? (product as any).categoryIds.map((v: any) => String(v ?? '').trim()).filter((v: string) => v.length > 0)
        : []

      if (vendorFromProp || categoriesFromProp.length > 0) {
        const eligibleByConfig = isProductEligibleForFreeShippingLabel({
          productId: pid,
          vendorId: vendorFromProp,
          categoryIds: categoriesFromProp,
          freeShippingConfig
        })

        if (mounted) setIsFreeShippingLabelVisible(eligibleByConfig)
        return
      }

      try {
        const productRes = await fetch(`/api/public/products?id=${encodeURIComponent(pid)}`, { method: 'GET', cache: 'no-store' })
        const productJson = await productRes.json().catch(() => null)

        const vendorId = String(productJson?.data?.vendor_id ?? '').trim()
        const categoryIds = Array.isArray(productJson?.data?.category_ids)
          ? productJson.data.category_ids.map((value: any) => String(value ?? '').trim()).filter((value: string) => value.length > 0)
          : []

        const eligibleByConfig = isProductEligibleForFreeShippingLabel({
          productId: pid,
          vendorId,
          categoryIds,
          freeShippingConfig
        })

        if (mounted) setIsFreeShippingLabelVisible(eligibleByConfig)
      } catch {
        if (mounted) setIsFreeShippingLabelVisible(false)
      }
    }

    void loadFreeShippingLabel()

    return () => {
      mounted = false
    }
  }, [freeShippingConfig, product])

  const handlePointsPurchase = (product: any, usePoints: boolean, pointsToUse: number) => {
    if (!requireAuth("Connectez-vous pour passer une commande.")) {
      return
    }

    // Simulation d'un achat avec points
    console.log(`Achat du produit ${product.name} avec ${pointsToUse} points`)
    
    // Ici vous pouvez ajouter la logique d'achat réelle
    // Par exemple, appeler une API pour traiter l'achat
    
    // Fermer le modal
    setIsPointsModalOpen(false)
  }

  const openPointsModal = () => {
    if (!requireAuth("Connectez-vous pour passer une commande.")) {
      return
    }
    setIsPointsModalOpen(true)
  }

  /**
   * Résout l'ID vendeur réel (UUID Supabase) d'un produit.
   */
  const resolveVendorIdForProduct = async (): Promise<string> => {
    const direct = String((product as any)?.vendorId ?? '').trim()
    if (direct && UUID_REGEX.test(direct)) return direct

    try {
      const res = await fetch(`/api/public/products?id=${encodeURIComponent(String((product as any)?.id ?? ''))}`, {
        method: 'GET'
      })
      const json = await res.json().catch(() => null)
      const vendorId = String(json?.data?.vendor_id ?? '').trim()
      return vendorId
    } catch {
      return ''
    }
  }

  /**
   * Récupère les infos vendeur réelles (nom + avatar) pour le produit.
   */
  const resolveSellerInfoForProduct = async (): Promise<{ name: string; avatar: string }> => {
    try {
      const res = await fetch(`/api/public/products?id=${encodeURIComponent(String(product.id))}`, { method: 'GET' })
      const json = await res.json().catch(() => null)
      const name = String(json?.data?.seller_name ?? '').trim()
      const avatar = String(json?.data?.seller_avatar ?? '').trim()
      return { name, avatar }
    } catch {
      return { name: '', avatar: '' }
    }
  }

  /**
   * Ouvre le chat avec le vendeur du produit en utilisant son ID réel.
   */
  const handleOpenChat = async () => {
    if (!requireAuth("Connectez-vous pour écrire au vendeur.")) {
      return
    }

    const vendorId = await resolveVendorIdForProduct()

    if (!vendorId || !UUID_REGEX.test(String(vendorId))) {
      toast({
        title: 'Chat indisponible',
        description: "Impossible d'identifier le vendeur de ce produit.",
        variant: 'destructive'
      })
      return
    }

    const sellerInfo = await resolveSellerInfoForProduct()

    setChatSellerId(String(vendorId))
    setChatSellerName(sellerInfo.name || String((product as any)?.seller ?? 'Vendeur'))
    setChatSellerAvatar(sellerInfo.avatar || '/placeholder-user.jpg')
    setIsChatModalOpen(true)
  }

  return (
    <Card 
      className="group hover:shadow-2xl transition-all duration-500 overflow-hidden border-0 bg-white rounded-2xl transform hover:scale-105 hover:-translate-y-2 cursor-pointer"
    >
             <div 
         className="relative overflow-hidden cursor-pointer"
         onClick={() => {
           console.log("AdvancedProductCard - Conteneur image cliqué pour le produit:", product.name);
           if (onProductClick) {
             console.log("AdvancedProductCard - onProductClick disponible, transformation du produit");
             // Passer un objet minimal (réel) et laisser le ProductModal hydrater via /api/public/products.
             onProductClick({
               id: String((product as any)?.id ?? '').trim(),
               name: product.name,
               price: effectivePrice,
               pointsPrice: product.pointsPrice,
               originalPrice: effectiveOriginalPrice,
               rating: product.rating,
               reviews: product.reviews,
               image: product.image,
               images: product.image ? [product.image] : [],
               vendorId: resolvedVendorId || (product as any)?.vendorId,
               seller: {
                 id: resolvedVendorId || (product as any)?.vendorId,
                 name: String((product as any)?.seller ?? '').trim() || 'Boutique',
                 avatar: String((product as any)?.sellerAvatar ?? '').trim() || '',
                 rating: typeof (product as any)?.rating === 'number' ? (product as any).rating : 0,
                 totalSales: 0,
                 responseTime: '',
                 location: '',
                 phone: '',
                 email: '',
                 joinDate: '',
                 memberSince: '',
                 logo: String((product as any)?.sellerAvatar ?? '').trim() || ''
               },
              description: '',
              specifications: {},
              features: [],
              warranty: '',
              returnPolicy: '',
              shipping: { cost: 0, time: '', method: '' },
              stock:
                typeof (product as any)?.stockQuantity === 'number' && Number.isFinite((product as any).stockQuantity)
                  ? Math.max(0, Math.trunc((product as any).stockQuantity))
                  : 0,
              sharePoints: product.sharePoints,
              shares: product.shares,
              inStock: product.inStock,
              discount: effectiveDiscount,
              isHot: product.isHot,
              isNew: product.isNew,
              isLimited: product.isLimited,
              badges: product.badges,
              color: product.color,
              category: '',
              tags: [],
              relatedProducts: []
             })
           }
         }}
       >
         <Image
           src={product.image || "/placeholder.svg"}
           alt={product.name}
           width={300}
           height={300}
           className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-700"
         />

        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Animated Badges */}
        <div className="absolute top-3 left-3 flex flex-col space-y-2">
          {product.isHot && (
            <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0 animate-pulse shadow-lg">
              <Flame className="h-3 w-3 mr-1 animate-bounce" />
              HOT
            </Badge>
          )}
          {product.isNew && (
            <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 animate-pulse shadow-lg">
              <Sparkles className="h-3 w-3 mr-1 animate-spin" />
              NEW
            </Badge>
          )}
          {product.isLimited && (
            <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 animate-pulse shadow-lg">
              <Clock className="h-3 w-3 mr-1 animate-ping" />
              LIMITED
            </Badge>
          )}

          {isFreeShippingLabelVisible && (
            <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 text-white border-0 shadow-lg">
              Livraison gratuite
            </Badge>
          )}
          
          {/* Triggers d'incitation supplémentaires */}
          {product.inStock && (
            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 animate-pulse shadow-lg">
              <Target className="h-3 w-3 mr-1 animate-bounce" />
              POPULAIRE
            </Badge>
          )}
          
          {effectiveDiscount > 15 && (
            <Badge className="bg-gradient-to-r from-pink-500 to-red-500 text-white border-0 animate-pulse shadow-lg">
              <Crown className="h-3 w-3 mr-1 animate-pulse" />
              MEILLEUR PRIX
            </Badge>
          )}
        </div>

        {/* Animated Discount Badge */}
        {effectiveDiscount > 0 && (
          <Badge className="absolute top-3 right-3 bg-gradient-to-r from-[#ff6600] to-[#ff8533] text-white border-0 animate-bounce shadow-lg">
            -{effectiveDiscount}%
          </Badge>
        )}

        {/* Stock Status et Triggers d'urgence */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
            <Badge variant="destructive" className="text-lg px-4 py-2 animate-pulse">
              Rupture de stock
            </Badge>
          </div>
        )}
        
        {/* Indicateurs de stock limité */}
        {product.inStock && typeof product.stockQuantity === 'number' && Number.isFinite(product.stockQuantity) && (
          <div className="absolute bottom-3 left-3 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse shadow-lg">
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>Seulement {Math.max(0, Math.trunc(product.stockQuantity))} restants !</span>
            </div>
          </div>
        )}

        {/* Floating Action Buttons - Positionnés en dessous du badge de réduction */}
        <div className="absolute top-12 right-3 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0">
          {/* Bouton Favori */}
          <Button
            variant="ghost"
            size="icon"
            className={`${isInWishlist ? 'bg-red-50 hover:bg-red-100' : 'bg-white/90 hover:bg-white'} shadow-lg rounded-full h-9 w-9 transition-all duration-300 relative overflow-hidden group`}
            onClick={(e: MouseEvent) => {
              e.stopPropagation()
              if (!requireAuth("Connectez-vous pour ajouter aux favoris.")) {
                return
              }
              toggleWishlist(product)
            }}
          >
            {/* Effet de particules */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-red-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute bottom-1/4 right-1/4 w-1 h-1 bg-pink-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ animationDelay: '0.3s' }}></div>
            </div>
            
            <Heart className={`h-4 w-4 ${isInWishlist ? 'text-red-500 fill-current animate-pulse' : 'text-red-500 hover:scale-110'} transition-all duration-300`} />
            
            {/* Indicateur de statut */}
            {isInWishlist && (
              <span className="absolute -top-1 -right-1 text-xs bg-red-500 text-white px-1 rounded-full animate-pulse">
                ❤️
              </span>
            )}
          </Button>
          
          {/* Bouton Panier */}
          <Button
            variant="ghost"
            size="icon"
            className="bg-white/90 hover:bg-white shadow-lg rounded-full h-9 w-9 transition-all duration-300 relative overflow-hidden group"
            onClick={(e: MouseEvent) => {
              e.stopPropagation()
              if (!requireAuth("Connectez-vous pour ajouter au panier.")) {
                return
              }
              addToCart({ ...product, warranty: (product as any)?.warranty, returnPolicy: (product as any)?.returnPolicy })
            }}
          >
            {/* Effet de particules */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-green-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute bottom-1/4 right-1/4 w-1 h-1 bg-emerald-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ animationDelay: '0.3s' }}></div>
            </div>
            
            <ShoppingCart className="h-4 w-4 text-green-600 hover:scale-110 transition-transform duration-300 animate-bounce" />
          </Button>
          
          {/* Bouton Comparer */}
          <Button
            variant="ghost"
            size="icon"
            className="bg-white/90 hover:bg-white shadow-lg rounded-full h-9 w-9 transition-all duration-300 relative overflow-hidden group"
            onClick={(e: MouseEvent) => {
              e.stopPropagation()
              if (!requireAuth("Connectez-vous pour comparer des produits.")) {
                return
              }
              onCompare(product)
            }}
          >
            {/* Effet de particules */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-purple-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute bottom-1/4 right-1/4 w-1 h-1 bg-violet-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ animationDelay: '0.3s' }}></div>
            </div>
            
            <svg className="h-4 w-4 text-purple-600 hover:scale-110 transition-transform duration-300 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </Button>
          
          {/* Bouton Message - Ancien design avec nouveau système de chat */}
          <Button
            variant="ghost"
            size="icon"
            className="bg-white/90 hover:bg-white shadow-lg rounded-full h-9 w-9 transition-all duration-300 relative overflow-hidden group"
            onClick={(e) => {
              e.stopPropagation()
              console.log('🛍️ Bouton chat carte produit cliqué pour:', product.name)

              void handleOpenChat()
            }}
          >
            {/* Effet de particules */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-blue-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute bottom-1/4 right-1/4 w-1 h-1 bg-cyan-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ animationDelay: '0.3s' }}></div>
            </div>
            
            <MessageCircle className="h-4 w-4 text-blue-500 group-hover:scale-110 transition-transform duration-300" />
            
            {/* Indicateur de disponibilité */}
            <span className="absolute -top-1 -right-1 text-xs bg-green-500 text-white px-1 rounded-full animate-pulse">
              💬
            </span>
          </Button>
        </div>

        {/* Animated Sparkles */}
        <div className="absolute inset-0 pointer-events-none">
          <Sparkles className="absolute top-1/4 left-1/4 h-4 w-4 text-yellow-400 animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <Sparkles className="absolute top-1/3 right-1/3 h-3 w-3 text-yellow-400 animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ animationDelay: '0.5s' }} />
          <Sparkles className="absolute bottom-1/4 left-1/3 h-4 w-4 text-yellow-400 animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ animationDelay: '1s' }} />
        </div>
      </div>

      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Indicateur de vente rapide - réduit et placé au-dessus du nom */}
          {product.inStock && Number.isFinite(Number((product as any)?.sales)) && Number((product as any).sales) > 0 && (
            <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium animate-bounce shadow-md inline-flex items-center space-x-1">
              <TrendingUp className="h-3 w-3" />
              <span>Vendu {Math.max(0, Math.floor(Number((product as any).sales)))} fois !</span>
            </div>
          )}
          
          <h3 className="font-bold text-xl line-clamp-2 group-hover:text-[#ff6600] transition-colors duration-300">
            {product.name}
          </h3>

          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(ratingForUi) ? "text-yellow-400 fill-current" : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600">
              {Number(ratingForUi ?? 0).toFixed(1)} ({Number(reviewsForUi ?? 0)})
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <span className="text-2xl font-bold text-[#ff6600]">
                {effectivePrice.toLocaleString()} F CFA
              </span>
              {effectiveOriginalPrice > effectivePrice && (
                <span className="text-sm text-gray-500 line-through">
                  {effectiveOriginalPrice.toLocaleString()} F CFA
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2 text-sm">
              <Coins className="h-4 w-4 text-yellow-500 animate-pulse" />
              <span className="font-semibold text-gray-700">
                {computedPointsPrice} points
              </span>
            </div>
          </div>

                            <div className="text-sm text-gray-600">
                    Vendu par{' '}
                    <Link
                      href={sellerHref}
                      prefetch
                      className="font-medium text-[#ff6600] cursor-pointer hover:text-[#e55a00] transition-colors duration-300"
                      onClick={(e) => {
                        e.stopPropagation()
                      }}
                    >
                      {sellerName}
                    </Link>
                    <span className="mx-1">•</span>
                    <span className={isSellerOnline ? "text-green-700" : "text-gray-600"}>
                      {isSellerOnline ? 'En ligne' : 'Hors ligne'}
                    </span>
                    {responseTimeLabel && (
                      <>
                        <span className="mx-1">•</span>
                        <span>Réponse: {responseTimeLabel}</span>
                      </>
                    )}
                  </div>

          {/* Enhanced Share Info */}
          <div className="bg-gradient-to-r from-[#ff6600]/10 to-[#ff8533]/10 p-3 rounded-xl border border-[#ff6600]/20">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#ff6600] font-semibold flex items-center">
                <Gift className="h-4 w-4 mr-1 animate-bounce" />
                +{sharePointsGlobal} points par partage
              </span>
              <span className="text-gray-600 flex items-center">
                <Users className="h-4 w-4 mr-1" />
                {shareCounts.total} partages
              </span>
            </div>
          </div>
          
          {/* Triggers d'incitation supplémentaires */}
          {effectiveDiscount > 10 && (
            <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 p-3 rounded-xl border border-green-500/20">
              <div className="flex items-center justify-between text-sm">
                <span className="text-green-600 font-semibold flex items-center">
                  <Award className="h-4 w-4 mr-1 animate-pulse" />
                  Économisez {effectiveDiscount}% aujourd'hui !
                </span>
                <span className="text-blue-600 flex items-center">
                  <Zap className="h-4 w-4 mr-1 animate-bounce" />
                  Offre limitée
                </span>
              </div>
            </div>
          )}
          
          {/* Indicateur de confiance */}
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-3 rounded-xl border border-blue-500/20">
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-600 font-semibold flex items-center">
                <Star className="h-4 w-4 mr-1 text-yellow-500" />
                {Number(ratingForUi ?? 0).toFixed(1)}/5 ({Number(reviewsForUi ?? 0)} avis)
              </span>
              <span className="text-purple-600 flex items-center">
                <Crown className="h-4 w-4 mr-1" />
                Vendeur vérifié
              </span>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-6 pt-0 space-y-3">
        <div className="flex flex-col space-y-3 w-full">
          <div className="flex space-x-3 w-full">
            <Button
              className="flex-1 bg-gradient-to-r from-[#ff6600] to-[#ff8533] hover:from-[#e55a00] hover:to-[#ff6600] text-white border-0 shadow-lg transform hover:scale-105 transition-all duration-300 relative overflow-hidden group"
              onClick={() => {
                if (!requireAuth("Connectez-vous pour ajouter au panier.")) {
                  return
                }
                addToCart({
                  ...product,
                  price: effectivePrice,
                  originalPrice: effectiveOriginalPrice,
                  warranty: (product as any)?.warranty,
                  returnPolicy: (product as any)?.returnPolicy
                })
              }}
              disabled={!product.inStock}
            >
              {/* Effet de brillance */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              <ShoppingCart className="h-4 w-4 mr-2 animate-pulse" />
              {product.inStock ? "Ajouter au panier" : "Indisponible"}
              
              {/* Indicateur d'urgence */}
              {product.inStock && (
                <span className="ml-2 text-xs bg-white/20 px-2 py-1 rounded-full animate-pulse">
                  🔥
                </span>
              )}
            </Button>

            <ShareButtons
              productId={product.id.toString()}
              productName={product.name}
              vendorId={resolvedVendorId || product.vendorId || 'unknown'}
            />
          </div>

          <div className="w-full">
            <Button 
              variant="outline" 
              className={`w-full border-2 rounded-xl transition-all duration-300 transform relative overflow-hidden group px-6 py-4 ${
                product.inStock 
                  ? 'bg-gradient-to-r from-gray-50 to-gray-100 hover:from-[#ff6600]/10 hover:to-[#ff8533]/10 border-gray-200 hover:border-[#ff6600] text-gray-700 hover:text-[#ff6600] hover:scale-105' 
                  : 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed opacity-60'
              }`}
              onClick={(e: MouseEvent) => {
                e.stopPropagation()
                if (product.inStock) {
                  openPointsModal()
                }
              }}
              disabled={!product.inStock}
            >
              {/* Effet de particules - seulement si en stock */}
              {product.inStock && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-yellow-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-yellow-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ animationDelay: '0.3s' }}></div>
                  <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-yellow-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ animationDelay: '0.6s' }}></div>
                </div>
              )}
              
              <div className="flex items-center justify-center w-full">
                <Coins className={`h-5 w-5 flex-shrink-0 mr-3 ${product.inStock ? 'animate-pulse text-yellow-600' : 'text-gray-400'}`} />
                <span className="text-sm font-semibold">
                  {product.inStock ? `Acheter avec points (${computedPointsPrice} pts)` : 'Indisponible'}
                </span>
              </div>
            </Button>
          </div>
        </div>
      </CardFooter>

      {/* Modal d'achat avec points */}
      {isPointsModalOpen && (
        <PointsPurchaseModal
          isOpen={isPointsModalOpen}
          onClose={() => {
            setIsPointsModalOpen(false)
          }}
          product={{
            id: product.id,
            name: product.name,
            price: effectivePrice,
            pointsPrice: computedPointsPrice,
            image: product.image,
            rating: product.rating,
            reviews: product.reviews,
            discount: product.discount,
            isHot: product.isHot,
            isNew: product.isNew,
            isLimited: product.isLimited
          }}
          onPurchase={handlePointsPurchase}
        />
      )}
      
      {/* Modal de chat avec l'ancien design */}
      <LegacyChatModal
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
        sellerId={chatSellerId}
        sellerName={chatSellerName || product.seller || 'Vendeur Probooster'}
        sellerAvatar={chatSellerAvatar || "/placeholder-user.jpg"}
        product={{
          id: product.id.toString(),
          name: product.name,
          price: effectivePrice,
          image: product.image,
          seller: product.seller
        }}
      />
    </Card>
  )
}
