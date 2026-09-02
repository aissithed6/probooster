"use client"

import { useState, useEffect } from "react"
import type React from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useCart } from "@/hooks/use-cart"
import { useWishlist } from "@/hooks/use-wishlist"
import { useBestOfferPrice } from "@/hooks/useBestOfferPrice"
import { useVendorSummary } from "@/lib/hooks/use-vendor-summary"
import { useVendorPresence } from "@/lib/hooks/use-vendor-presence"
import { useClientPoints } from "@/lib/hooks/use-client-points"
import { ShareEngagementService } from "@/lib/services/share-engagement-service"
import { 
  ShoppingCart, 
  Heart, 
  Star, 
  Share2, 
  Gift, 
  Clock, 
  Coins, 
  Zap, 
  MessageCircle,
  Users,
  Award,
  Sparkles,
  TrendingUp,
  Crown,
  Flame
} from "lucide-react"

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
}

interface BestSellerCardProps {
  product: Product
  onBuyWithPoints: (product: Product) => void
  onShare: (product: Product, platform: string) => void
  onStartChat: (product: Product) => void
  onCompare: (product: Product) => void
  onProductClick?: (product: Product) => void
}

export default function BestSellerCard({
  product,
  onBuyWithPoints,
  onShare,
  onStartChat,
  onCompare,
  onProductClick
}: BestSellerCardProps) {
  const [isClient, setIsClient] = useState(false)
  const { configuration: pointsConfiguration } = useClientPoints()
  const [adminPointsConfig, setAdminPointsConfig] = useState<{ purchaseValue: number } | null>(null)
  const [sharePointsGlobal, setSharePointsGlobal] = useState<number>(0)
  const [shareCounts, setShareCounts] = useState<{ total: number; byPlatform: Record<string, number> }>({ total: 0, byPlatform: {} })
  const [sharePointsPerNetwork, setSharePointsPerNetwork] = useState<Record<string, number>>({})
  const { addToCart, isInCart } = useCart()
  const { toggleWishlist, isInWishlist } = useWishlist()

  const { offer: bestOffer } = useBestOfferPrice(product?.id)
  const baseSalePrice = typeof product?.salePrice === 'number' && Number.isFinite(product.salePrice) && product.salePrice > 0 ? product.salePrice : null
  const effectivePrice = bestOffer?.price ?? (baseSalePrice ?? product.price)
  const effectiveOriginalPrice = bestOffer?.originalPrice ?? product.price
  const effectiveDiscount = bestOffer?.discountPercent ?? product.discount

  const { summary: vendorSummary } = useVendorSummary(String((product as any)?.vendorId ?? '').trim())
  const { isOnline } = useVendorPresence(String((product as any)?.vendorId ?? '').trim())
  // Priorité à la note PRODUIT (source: product_statistics, synchronisée par triggers Supabase).
  // Fallback: note du VENDEUR (vendor_rating_snapshot) si le produit n'a pas encore d'avis.
  const productRating = Number(product?.rating ?? 0) || 0
  const productReviews = Number(product?.reviews ?? 0) || 0
  const vendorRating = typeof vendorSummary?.averageRating === 'number' ? vendorSummary.averageRating : 0
  const vendorReviews = typeof vendorSummary?.reviewCount === 'number' ? vendorSummary.reviewCount : 0
  const ratingForUi = productRating > 0 ? productRating : vendorRating
  const reviewsForUi = productRating > 0 ? productReviews : vendorReviews

  useEffect(() => {
    setIsClient(true)
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

  /**
   * Charge la config de points de partage (Super Admin) + les compteurs réels de partages produit.
   */
  useEffect(() => {
    let mounted = true
    const pid = String((product as any)?.id ?? '').trim()
    if (!pid) return

    ;(async () => {
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
    })()

    ;(async () => {
      try {
        const [facebook, whatsapp, twitter] = await Promise.all([
          ShareEngagementService.getPointsConfig('facebook'),
          ShareEngagementService.getPointsConfig('whatsapp'),
          ShareEngagementService.getPointsConfig('twitter')
        ])
        if (!mounted) return
        setSharePointsPerNetwork({
          facebook: Number(facebook) || 0,
          whatsapp: Number(whatsapp) || 0,
          twitter: Number(twitter) || 0
        })
      } catch {
        // noop
      }
    })()

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

  const purchaseValue = (() => {
    const raw = (pointsConfiguration?.settings as any)?.purchaseValue ?? adminPointsConfig?.purchaseValue
    const normalized = typeof raw === 'string' ? raw.trim().replace(',', '.') : raw
    const numeric = Number(normalized)
    return Number.isFinite(numeric) && numeric > 0 ? numeric : 1
  })()

  const computedPointsPrice = Math.max(0, Math.round(Number(effectivePrice || 0) / purchaseValue))

  const sellerName = String(product.seller ?? '').trim() || 'Boutique'
  const sellerSlug = toSellerSlug(sellerName) || 'boutique'
  const sellerHref = `/seller/${sellerSlug}`
  const isVendorVerified = vendorSummary?.isVerified === true



  return (
    <Card className="group hover:shadow-2xl transition-all duration-500 overflow-hidden border-0 bg-white rounded-2xl transform hover:scale-105 hover:-translate-y-2 cursor-pointer relative">
      

      <div className="relative overflow-hidden">
        <Image
          src={product.image || "/placeholder.svg"}
          alt={product.name}
          width={300}
          height={300}
          className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-700 cursor-pointer"
          onClick={() => onProductClick?.({ ...product, price: effectivePrice, originalPrice: effectiveOriginalPrice, discount: effectiveDiscount })}
        />

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
          
          {/* Badge spécial pour les top 3 */}
          {product.rank <= 3 && (
            <Badge className="bg-gradient-to-r from-pink-500 to-red-500 text-white border-0 animate-pulse shadow-lg">
              <Crown className="h-3 w-3 mr-1 animate-bounce" />
              TOP {product.rank}
            </Badge>
          )}
        </div>

        {/* Animated Discount Badge */}
        {effectiveDiscount > 0 && (
          <Badge className="absolute top-3 right-3 bg-gradient-to-r from-[#ff6600] to-[#ff8533] text-white border-0 animate-bounce shadow-lg">
            -{effectiveDiscount}%
          </Badge>
        )}

        {/* Floating Action Buttons - Positionnés en dessous du badge de réduction */}
        <div className="absolute top-12 right-3 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0">
          {/* Bouton Favori */}
          {isClient && (
            <Button
              variant="ghost"
              size="icon"
              className={`${isInWishlist(product.id) ? 'bg-red-50 hover:bg-red-100' : 'bg-white/90 hover:bg-white'} shadow-lg rounded-full h-9 w-9 transition-all duration-300 relative overflow-hidden group`}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation()
                toggleWishlist(product)
              }}
            >
              {/* Effet de particules */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-red-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute bottom-1/4 right-1/4 w-1 h-1 bg-pink-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ animationDelay: '0.3s' }}></div>
              </div>
              
              <Heart className={`h-4 w-4 ${isInWishlist(product.id) ? 'text-red-500 fill-current animate-pulse' : 'text-red-500 hover:scale-110'} transition-all duration-300`} />
              
              {/* Indicateur de statut */}
              {isInWishlist(product.id) && (
                <span className="absolute -top-1 -right-1 text-xs bg-red-500 text-white px-1 rounded-full animate-pulse">
                  ❤️
                </span>
              )}
            </Button>
          )}
          
          {/* Bouton Panier */}
          <Button
            variant="ghost"
            size="icon"
            className="bg-white/90 hover:bg-white shadow-lg rounded-full h-9 w-9 transition-all duration-300 relative overflow-hidden group"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation()
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
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation()
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
          
          {/* Bouton Message */}
          <Button
            variant="ghost"
            size="icon"
            className="bg-white/90 hover:bg-white shadow-lg rounded-full h-9 w-9 transition-all duration-300 relative overflow-hidden group"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation()
              onStartChat(product)
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
          {/* Indicateurs de vente - placés au-dessus du nom */}
          <div className="flex items-center justify-between">
            {/* Indicateur de vente rapide */}
            {isClient && product.inStock && Number.isFinite(Number((product as any)?.sales)) && Number((product as any).sales) > 0 && (
              <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium animate-bounce shadow-md inline-flex items-center space-x-1">
                <TrendingUp className="h-3 w-3" />
                <span>Vendu {Math.max(0, Math.floor(Number((product as any).sales)))} fois !</span>
              </div>
            )}
            
            {/* Indicateur de vente totale */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 rounded-full text-sm font-semibold animate-bounce shadow-lg border-2 border-white">
              <div className="flex items-center space-x-1">
                <span className="animate-pulse">🔥</span>
                <span>{(typeof product.sales === "number" ? product.sales : 0).toLocaleString()} vendus</span>
              </div>
            </div>
          </div>
          <h3 className="font-bold text-xl group-hover:text-[#ff6600] transition-colors duration-300">
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

                            <div className="text-sm text-gray-600 flex items-center gap-2 flex-wrap">
                    <span>
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
                      {isVendorVerified && (
                        <span className="ml-1 inline-flex items-center text-blue-600" title="Vendeur vérifié">
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </span>
                    {isOnline === true ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        En ligne
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                        Hors ligne
                      </span>
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
              {isVendorVerified ? (
                <span className="text-purple-600 flex items-center">
                  <Crown className="h-4 w-4 mr-1" />
                  Vendeur vérifié
                </span>
              ) : (
                <span className="text-gray-500 flex items-center">
                  <Award className="h-4 w-4 mr-1" />
                  Vendeur standard
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-6 pt-0 space-y-3">
        <div className="flex flex-col space-y-3 w-full">
          <div className="flex space-x-3 w-full">
            <Button
              className="flex-1 bg-gradient-to-r from-[#ff6600] to-[#ff8533] hover:from-[#e55a00] hover:to-[#ff6600] text-white border-0 shadow-lg transform hover:scale-105 transition-all duration-300"
              onClick={() =>
                addToCart({
                  ...product,
                  price: effectivePrice,
                  originalPrice: effectiveOriginalPrice,
                  warranty: (product as any)?.warranty,
                  returnPolicy: (product as any)?.returnPolicy
                })
              }
              disabled={!product.inStock}
            >
              <ShoppingCart className="h-4 w-4 mr-2 animate-pulse" />
              {product.inStock ? "Ajouter au panier" : "Indisponible"}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="border-2 border-gray-200 hover:border-[#ff6600] hover:bg-[#ff6600] hover:text-white rounded-xl transition-all duration-300 min-w-[44px] group animate-pulse relative overflow-hidden">
                  {/* Effet de particules */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-blue-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-1 h-1 bg-green-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ animationDelay: '0.3s' }}></div>
                  </div>
                  
                  <Share2 className="h-4 w-4 group-hover:scale-110 transition-transform duration-300 animate-bounce" />
                  
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white border-2 border-gray-200 rounded-xl shadow-xl p-2 min-w-[200px]">
                <DropdownMenuItem onClick={() => onShare(product, "facebook")} className="flex items-center space-x-3 p-3 hover:bg-blue-50 rounded-lg transition-all duration-300 group relative overflow-hidden">
                  {/* Effet de particules */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-blue-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-1 h-1 bg-blue-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ animationDelay: '0.3s' }}></div>
                  </div>
                  
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <span className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">Facebook</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">+{(sharePointsPerNetwork.facebook ?? sharePointsGlobal) || 0} points</span>
                      <div className="flex space-x-1">
                        <div className="w-1 h-1 bg-yellow-400 rounded-full animate-pulse"></div>
                        <div className="w-1 h-1 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-1 h-1 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>

                  <Badge variant="outline" className="text-xs">
                    {shareCounts.byPlatform.facebook || 0}
                  </Badge>
                  
                  {/* Indicateur de bonus */}
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full animate-pulse">
                    🔥
                  </span>
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => onShare(product, "whatsapp")} className="flex items-center space-x-3 p-3 hover:bg-green-50 rounded-lg transition-all duration-300 group relative overflow-hidden">
                  {/* Effet de particules */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-green-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-1 h-1 bg-green-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ animationDelay: '0.3s' }}></div>
                  </div>
                  
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.86 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.815 0 0020.885 3.488"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <span className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors duration-300">WhatsApp</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">+{(sharePointsPerNetwork.whatsapp ?? sharePointsGlobal) || 0} points</span>
                      <div className="flex space-x-1">
                        <div className="w-1 h-1 bg-yellow-400 rounded-full animate-pulse"></div>
                        <div className="w-1 h-1 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-1 h-1 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>

                  <Badge variant="outline" className="text-xs">
                    {shareCounts.byPlatform.whatsapp || 0}
                  </Badge>
                  
                  {/* Indicateur de bonus */}
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full animate-pulse">
                    🔥
                  </span>
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => onShare(product, "twitter")} className="flex items-center space-x-3 p-3 hover:bg-blue-400 rounded-lg transition-all duration-300 group relative overflow-hidden">
                  {/* Effet de particules */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-blue-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-1 h-1 bg-blue-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ animationDelay: '0.3s' }}></div>
                  </div>
                  
                  <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.665 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.92 0 003.946 4.827 4.996 4.96 0 01-2.212.085 4.936 4.96 0 004.604 3.417 9.867 9.86 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.86 0 0024 4.59z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <span className="font-semibold text-gray-900 group-hover:text-blue-400 transition-colors duration-300">Twitter</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">+{(sharePointsPerNetwork.twitter ?? sharePointsGlobal) || 0} points</span>
                      <div className="flex space-x-1">
                        <div className="w-1 h-1 bg-yellow-400 rounded-full animate-pulse"></div>
                        <div className="w-1 h-1 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-1 h-1 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>

                  <Badge variant="outline" className="text-xs">
                    {shareCounts.byPlatform.twitter || 0}
                  </Badge>
                  
                  {/* Indicateur de bonus */}
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full animate-pulse">
                    🔥
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <Button 
            variant="outline" 
            className={`border-2 rounded-xl px-6 py-3 transition-all duration-300 relative overflow-hidden group ${
                product.inStock
                ? 'bg-gradient-to-r from-gray-50 to-gray-100 hover:from-[#ff6600]/10 hover:to-[#ff8533]/10 border-gray-200 hover:border-[#ff6600] text-gray-700 hover:text-[#ff6600] hover:scale-105' 
                : 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed opacity-60'
            }`}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation()
              if (product.inStock) {
                onBuyWithPoints(product)
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
            
            <Coins className={`h-5 w-5 flex-shrink-0 mr-3 ${product.inStock ? 'animate-pulse text-yellow-600' : 'text-gray-400'}`} />
            <span className="text-sm font-semibold">
              {product.inStock ? `Acheter avec points (${computedPointsPrice} pts)` : 'Indisponible'}
            </span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
