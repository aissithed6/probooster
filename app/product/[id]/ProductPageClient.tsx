"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Heart, Minus, Plus, Share2, ShoppingCart, Star, MessageCircle } from "lucide-react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { LegacyChatModal } from "@/components/chat/LegacyChatModal"
import { ModalGlobalChatTrigger } from "@/components/chat"
import PointsPurchaseModal from "@/components/product/points-purchase-modal"
import { ShareEngagementService } from '@/lib/services/share-engagement-service'
import { ShareConfirmModal } from '@/components/product/share-confirm-modal'
import { useClientPoints } from "@/lib/hooks/use-client-points"
import { useToast } from "@/hooks/use-toast"
import { useCart } from "@/hooks/use-cart"
import { useWishlist } from "@/hooks/use-wishlist"
import { useAuth } from "@/contexts/AuthContext"
import { CartService } from "@/lib/services"
import { isProductEligibleForFreeShippingLabel } from "@/lib/utils/free-shipping-eligibility"
import { useDeliveryConfig } from "@/contexts/DeliveryConfigContext"
import { useVendorPresence } from "@/lib/hooks/use-vendor-presence"
import { useVendorSummary } from "@/lib/hooks/use-vendor-summary"
import { useAuthGuard } from "@/lib/hooks/use-auth-guard"
import { useMoney } from "@/lib/hooks/use-money"
import { useDateTime } from "@/lib/hooks/use-date-time"
import { buildViewDedupeKey, trackAutomationEvent } from "@/lib/client-automation-events"
import { EditableMessagesBanner } from "@/components/messages/EditableMessagesBanner"

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type ProductLike = any

export default function ProductPageClient({
  initialProduct,
  productId
}: {
  initialProduct: ProductLike | null
  productId: string
}) {
  const router = useRouter()
  const { formatMoney } = useMoney()
  const { formatDate } = useDateTime()
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [sharePointsByPlatform, setSharePointsByPlatform] = useState<Record<string, number>>({})
  const [defaultSharePoints, setDefaultSharePoints] = useState<number>(0)
  const [shareCountsTotal, setShareCountsTotal] = useState(0)

  const [isPointsModalOpen, setIsPointsModalOpen] = useState(false)
  const [selectedProductForPoints, setSelectedProductForPoints] = useState<any>(null)

  const [shareConfirmOpen, setShareConfirmOpen] = useState(false)
  const [shareConfirmPlatform, setShareConfirmPlatform] = useState<string>('')
  const [shareConfirmPoints, setShareConfirmPoints] = useState<number>(0)
  const pendingShareRef = useRef<{ platform: string; openWindow: () => Promise<boolean> } | null>(null)

  const { toast } = useToast()

  const { user } = useAuth()

  const searchParams = useSearchParams()
  const recordedViewRef = useRef(false)

  const recordedAutomationViewRef = useRef(false)

  const { requireAuth } = useAuthGuard()

  const { addToCart, updateQuantity } = useCart()
  const { toggleWishlist } = useWishlist()

  // Source unique (Realtime + fallback public) pour toute l'app.
  const {
    purchaseValue,
    socialShareValue: sharePointsValue,
    socialSharePerNetwork,
    refresh: refreshClientPoints
  } = useClientPoints()

  /**
   * Points de partage (global + par réseau), source de vérité: configuration Super Admin.
   */
  const sharePointsConfig = useMemo(() => {
    const global = Math.max(0, Math.round(Number(sharePointsValue) || 0))
    const resolve = (key: string) => {
      const value = Number(sharePointsPerNetwork?.[key])
      return Number.isFinite(value) && value >= 0 ? Math.round(value) : global
    }

    return {
      global,
      byPlatform: {
        facebook: resolve('facebook'),
        whatsapp: resolve('whatsapp'),
        twitter: resolve('twitter'),
        instagram: resolve('instagram'),
        copy: resolve('copy')
      }
    }
  }, [sharePointsPerNetwork, sharePointsValue])

  const confirmAndRunShare = async (awardPoints: boolean) => {
    /**
     * Confirme un partage sur la fiche produit puis exécute l'ouverture de la fenêtre + l'enregistrement.
     */
    const pending = pendingShareRef.current
    setShareConfirmOpen(false)
    pendingShareRef.current = null

    if ((product as any)?.marketing?.socialSharing === false) {
      toast({
        title: 'Partage désactivé',
        description: 'Le partage social est désactivé pour ce produit.',
        variant: 'destructive'
      })
      return
    }

    const platform = String(pending?.platform ?? '').trim()
    if (!platform) return

    const safeVendorId = String(resolvedVendorId ?? '').trim()
    if (!safeVendorId) {
      toast({
        title: 'Partage indisponible',
        description: "Impossible d'identifier le vendeur pour ce produit.",
        variant: 'destructive'
      })
      return
    }

    const shareUrl = `${window.location.origin}/product/${encodeURIComponent(productId)}?ref=${user?.id ?? ''}`

    const opened = await pending?.openWindow?.()
    if (!opened) {
      toast({
        title: 'Plateforme non supportée',
        description: 'Ce mode de partage n\'est pas disponible.',
        variant: 'destructive'
      })
      return
    }

    try {
      const shareRow = await ShareEngagementService.recordShare(
        String(user?.id ?? ''),
        String(productId),
        safeVendorId,
        platform,
        shareUrl,
        { awardPoints }
      )

      if (!shareRow?.id) {
        toast({
          title: 'Partage non enregistré',
          description: "Le partage a été ouvert, mais l'enregistrement n'a pas abouti.",
          variant: 'destructive'
        })
        return
      }

      toast({
        title: 'Partage enregistré',
        description: `+${Number((shareRow as any)?.points_earned ?? 0) || 0} points gagnés`,
        variant: 'default'
      })

      // Mise à jour immédiate de la progression/solde points (sans actualiser la page).
      try {
        void refreshClientPoints()
      } catch {
        // noop
      }

      try {
        const counts = await ShareEngagementService.getProductShareCounts(String(productId))
        const total = Number(counts?.total)
        const safeTotal = Number.isFinite(total) && total >= 0 ? Math.round(total) : shareCountsTotal
        setShareCountsTotal(safeTotal)
        try {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('productShareRecorded', {
                detail: {
                  productId: String(productId),
                  total: safeTotal
                }
              })
            )
          }
        } catch {
          // noop
        }
      } catch {
        // noop
      }
    } catch {
      toast({
        title: 'Erreur',
        description: "Impossible d'enregistrer le partage.",
        variant: 'destructive'
      })
    }
  }

  const estimatedPointsToEarn = useMemo(() => {
    const perShare = Math.max(0, Math.round(Number(sharePointsConfig.global) || 0))
    return perShare
  }, [sharePointsConfig.global])

  const [resolvedVendorId, setResolvedVendorId] = useState(() => {
    const vendorId = String(initialProduct?.vendorId ?? initialProduct?.seller?.id ?? '').trim()
    return UUID_REGEX.test(vendorId) ? vendorId : ''
  })
  const [resolvedCategoryIds, setResolvedCategoryIds] = useState<string[]>(() => {
    const ids = Array.isArray(initialProduct?.categoryIds) ? initialProduct.categoryIds : []
    return ids.map((x: any) => String(x ?? '').trim()).filter((x: string) => x.length > 0)
  })
  const [isProductFreeShipping, setIsProductFreeShipping] = useState(false)
  const [isFreeShippingLabelVisible, setIsFreeShippingLabelVisible] = useState(false)

  const { freeShippingConfig, deliveryRules } = useDeliveryConfig()

  const { isOnline } = useVendorPresence(resolvedVendorId)
  const { summary: vendorSummary } = useVendorSummary(resolvedVendorId)
  const isSellerOnline = isOnline === true

  const responseTimeLabel = (() => {
    const secs = vendorSummary?.avgResponseSeconds
    if (typeof secs !== 'number') return ''
    const minutes = Math.max(1, Math.round(secs / 60))
    if (minutes < 60) return `~${minutes} min`
    const hours = Math.round(minutes / 60)
    return `~${hours} h`
  })()

  /**
   * Extrait un prix/durée de base pour un mode (standard/express) depuis la config super-admin.
   */
  const getBaseShippingByMode = (mode: 'standard' | 'express') => {
    const rules = Array.isArray(deliveryRules) ? deliveryRules : []
    const active = rules.filter((r: any) => r?.isActive !== false && r?.mode === mode)
    if (active.length === 0) return null

    const sorted = [...active].sort((a, b) => (Number(a?.price ?? 0) || 0) - (Number(b?.price ?? 0) || 0))
    const best = sorted[0] ?? null
    if (!best) return null
    return {
      price: Number(best?.price ?? 0) || 0,
      etaMinDays: typeof best?.etaMinDays === 'number' ? best.etaMinDays : null,
      etaMaxDays: typeof best?.etaMaxDays === 'number' ? best.etaMaxDays : null
    }
  }

  const [product, setProduct] = useState<ProductLike | null>(initialProduct)
  const [isLoadingProduct, setIsLoadingProduct] = useState(false)

  /**
   * Construit un libellé de livraison en privilégiant les données du produit préchargées (SSR)
   * puis en fallback la config globale (deliveryRules).
   */
  const shippingLabel = useMemo(() => {
    const apiShipping = (product as any)?.api?.shipping
    const apiFree = Boolean(apiShipping?.free_shipping)
    const apiCostRaw = apiShipping?.shipping_cost
    const apiCost = typeof apiCostRaw === 'number' ? apiCostRaw : Number(apiCostRaw ?? 0) || 0
    const apiClass = typeof apiShipping?.shipping_class === 'string' ? String(apiShipping.shipping_class).trim() : ''

    if (apiFree) {
      return 'Livraison: gratuite'
    }

    if (apiCost > 0) {
      const suffix = apiClass ? ` • ${apiClass}` : ''
      return `Livraison: ${formatMoney(Math.ceil(apiCost))}${suffix}`
    }

    const std = getBaseShippingByMode('standard')
    const exp = getBaseShippingByMode('express')
    const fmtEta = (min: number | null, max: number | null) => {
      if (min != null && max != null) return `${min}-${max} jours`
      if (min != null) return `${min}+ jours`
      if (max != null) return `≤ ${max} jours`
      return ''
    }
    const stdText = std
      ? `Standard: ${formatMoney(Math.ceil(std.price))}${
          fmtEta(std.etaMinDays, std.etaMaxDays) ? ` • ${fmtEta(std.etaMinDays, std.etaMaxDays)}` : ''
        }`
      : ''
    const expText = exp
      ? `Express: ${formatMoney(Math.ceil(exp.price))}${
          fmtEta(exp.etaMinDays, exp.etaMaxDays) ? ` • ${fmtEta(exp.etaMinDays, exp.etaMaxDays)}` : ''
        }`
      : ''
    const parts = [stdText, expText].filter(Boolean)
    return parts.length > 0 ? `Livraison (base): ${parts.join(' | ')}` : ''
  }, [deliveryRules, product])

  /**
   * Calcule l'éligibilité du label "Livraison gratuite" dès que la config livraison et les infos produit sont disponibles.
   */
  useEffect(() => {
    const pid = String(productId ?? '').trim()
    if (!UUID_REGEX.test(pid)) {
      setIsFreeShippingLabelVisible(false)
      return
    }

    const vendorId = String(resolvedVendorId ?? '').trim()
    const categoryIds = Array.isArray(resolvedCategoryIds) ? resolvedCategoryIds : []

    const eligibleByConfig = isProductEligibleForFreeShippingLabel({
      productId: pid,
      vendorId,
      categoryIds,
      freeShippingConfig
    })

    setIsFreeShippingLabelVisible(eligibleByConfig)
    setIsProductFreeShipping(false)
  }, [freeShippingConfig, productId, resolvedCategoryIds, resolvedVendorId])

  /**
   * Ouvre le chat (LegacyChatModal) avec le vendeur en utilisant l'UUID vendor_id résolu.
   */
  const handleOpenSellerChat = () => {
    if (!requireAuth('Connectez-vous pour écrire au vendeur.')) {
      return
    }
    void recordReferralInteraction('click')
    if (!resolvedVendorId) {
      toast({
        title: 'Chat indisponible',
        description: "Impossible d'identifier le vendeur pour ce produit.",
        variant: 'destructive'
      })
      return
    }

    setIsChatOpen(true)
  }

  const handleShare = async (platform: string) => {
    if (!requireAuth('Connectez-vous pour gagner des points en partageant.')) {
      return
    }

    if ((product as any)?.marketing?.socialSharing === false) {
      toast({
        title: 'Partage désactivé',
        description: 'Le partage social est désactivé pour ce produit.',
        variant: 'destructive'
      })
      return
    }

    const safeVendorId = String(resolvedVendorId ?? '').trim()
    if (!safeVendorId) {
      toast({
        title: 'Partage indisponible',
        description: "Impossible d'identifier le vendeur pour ce produit.",
        variant: 'destructive'
      })
      return
    }

    const shareText = `Découvrez ${product?.name ?? 'ce produit'} sur Probooster !`
    const shareUrl = `${window.location.origin}/product/${encodeURIComponent(productId)}?ref=${user?.id ?? ''}`
    const pointsEarned = Math.max(0, Math.round(Number(sharePointsByPlatform?.[platform] ?? defaultSharePoints) || 0))

    const openShareWindow = async (p: string) => {
      let url = ''
      switch (p) {
        case 'facebook':
          url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`
          break
        case 'twitter':
          url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
          break
        case 'whatsapp':
          url = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`
          break
        case 'instagram':
          await navigator.clipboard.writeText(shareUrl)
          toast({
            title: 'Lien copié!',
            description: 'Collez le lien dans votre story Instagram',
            variant: 'default'
          })
          return true
        default:
          return false
      }

      if (!url) return false
      window.open(url, '_blank', 'width=600,height=400')
      return true
    }

    // Vérifier l'éligibilité: si déjà récompensé / propre produit => pas de modal, partage direct sans points.
    const elig = await ShareEngagementService.checkShareEligibility(String(productId), String(platform))

    if (elig && elig.canEarnPoints) {
      pendingShareRef.current = { platform, openWindow: () => openShareWindow(platform) }
      setShareConfirmPlatform(platform)
      setShareConfirmPoints(elig.points)
      setShareConfirmOpen(true)
      return
    }

    const opened = await openShareWindow(platform)
    if (!opened) {
      toast({
        title: 'Plateforme non supportée',
        description: 'Ce mode de partage n\'est pas disponible.',
        variant: 'destructive'
      })
      return
    }

    try {
      const shareRow = await ShareEngagementService.recordShare(
        String(user?.id ?? ''),
        String(productId),
        safeVendorId,
        platform,
        shareUrl,
        { awardPoints: false }
      )

      if (!shareRow?.id) {
        toast({
          title: 'Partage non enregistré',
          description: "Le partage a été ouvert, mais l'enregistrement n'a pas abouti.",
          variant: 'destructive'
        })
        return
      }

      toast({
        title: 'Partage enregistré',
        description: `+${Number((shareRow as any)?.points_earned ?? pointsEarned) || 0} points gagnés`,
        variant: 'default'
      })

      // Mise à jour immédiate de la progression/solde points (sans actualiser la page).
      try {
        void refreshClientPoints()
      } catch {
        // noop
      }

      try {
        const counts = await ShareEngagementService.getProductShareCounts(String(productId))
        const total = Number(counts?.total)
        const safeTotal = Number.isFinite(total) && total >= 0 ? Math.round(total) : shareCountsTotal
        setShareCountsTotal(safeTotal)
        try {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('productShareRecorded', {
                detail: {
                  productId: String(productId),
                  total: safeTotal
                }
              })
            )
          }
        } catch {
          // noop
        }
      } catch {
        // noop
      }
    } catch {
      toast({
        title: 'Erreur',
        description: "Impossible d'enregistrer le partage.",
        variant: 'destructive'
      })
    }
  }

  useEffect(() => {
    let isMounted = true

    const syncSharePointsFromConfig = () => {
      const overrideRaw = (product as any)?.marketing?.socialPoints
      const overridePoints = Number(overrideRaw)
      const hasOverride = Number.isFinite(overridePoints) && overridePoints >= 0

      const config: Record<string, number> = hasOverride
        ? {
            facebook: Math.round(overridePoints),
            whatsapp: Math.round(overridePoints),
            twitter: Math.round(overridePoints),
            instagram: Math.round(overridePoints),
            copy: Math.round(overridePoints)
          }
        : {
            facebook: Number(sharePointsConfig.byPlatform.facebook) || 0,
            whatsapp: Number(sharePointsConfig.byPlatform.whatsapp) || 0,
            twitter: Number(sharePointsConfig.byPlatform.twitter) || 0,
            instagram: Number(sharePointsConfig.byPlatform.instagram) || 0,
            copy: Number(sharePointsConfig.byPlatform.copy) || 0
          }

      if (!isMounted) return
      setSharePointsByPlatform(config)
      setDefaultSharePoints(hasOverride ? Math.round(overridePoints) : Number(sharePointsConfig.global) || 0)
    }

    syncSharePointsFromConfig()

    return () => {
      isMounted = false
    }
  }, [product, sharePointsConfig])

  useEffect(() => {
    let mounted = true
    const resolvedPid = String((product as any)?.id ?? productId ?? '').trim()
    if (!resolvedPid) return

    const loadShareCounts = async () => {
      try {
        const stats = await ShareEngagementService.getProductShareCounts(resolvedPid)
        if (!mounted) return
        const safeTotal = Number(stats?.total)
        setShareCountsTotal(Number.isFinite(safeTotal) && safeTotal >= 0 ? Math.round(safeTotal) : 0)
      } catch {
        // noop
      }
    }

    void loadShareCounts()

    return () => {
      mounted = false
    }
  }, [productId, product])

  const resolveSharePoints = (platform: string, fallback: number) => {
    const value = Number(sharePointsByPlatform?.[platform])
    if (Number.isFinite(value) && value >= 0) return Math.round(value)
    return fallback
  }

  const recordReferralInteraction = async (interactionType: 'view' | 'click' | 'conversion' | 'purchase') => {
    try {
      const refUserIdRaw = String(searchParams?.get('ref') ?? '').trim()
      if (!UUID_REGEX.test(refUserIdRaw)) return
      const currentUserId = String(user?.id ?? '').trim()
      if (UUID_REGEX.test(currentUserId) && currentUserId === refUserIdRaw) return

      await fetch('/api/shares/interaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId: String(productId),
          refUserId: refUserIdRaw,
          interactionType,
          userId: UUID_REGEX.test(currentUserId) ? currentUserId : undefined
        }),
        cache: 'no-store'
      }).catch(() => null)
    } catch {
      // noop
    }
  }

  useEffect(() => {
    if (recordedViewRef.current) return
    const refUserIdRaw = String(searchParams?.get('ref') ?? '').trim()
    if (!UUID_REGEX.test(refUserIdRaw)) return
    const pid = String(productId ?? '').trim()
    if (!UUID_REGEX.test(pid)) return

    recordedViewRef.current = true
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const key = 'share_ref_by_product_id'
        const raw = window.sessionStorage.getItem(key)
        const obj = raw ? (JSON.parse(raw) as Record<string, string>) : {}
        if (obj && typeof obj === 'object') {
          obj[pid] = refUserIdRaw
          window.sessionStorage.setItem(key, JSON.stringify(obj))
        }
      }
    } catch {
      // noop
    }
    void recordReferralInteraction('view')
  }, [productId, searchParams])

  useEffect(() => {
    if (recordedAutomationViewRef.current) return
    const pid = String(productId ?? '').trim()
    if (!UUID_REGEX.test(pid)) return

    recordedAutomationViewRef.current = true

    try {
      const path = typeof window !== 'undefined' ? window.location.pathname : null
      const dedupeKey = buildViewDedupeKey({ eventType: 'product.viewed', entityType: 'product', entityId: pid, path })
      void trackAutomationEvent({
        eventType: 'product.viewed',
        entityType: 'product',
        entityId: pid,
        payload: {
          vendorId: String(resolvedVendorId ?? '').trim() || null,
          categoryIds: Array.isArray(resolvedCategoryIds) ? resolvedCategoryIds : [],
          price: Number((product as any)?.price ?? 0) || 0
        },
        sourceUi: 'product_page',
        dedupeKey,
        dedupeTtlMs: 10 * 60 * 1000
      })
    } catch {
      // best-effort
    }

    try {
      const path = typeof window !== 'undefined' ? window.location.pathname : null
      const dedupeKey = buildViewDedupeKey({ eventType: 'page.viewed', entityType: 'page', entityId: path, path })
      void trackAutomationEvent({
        eventType: 'page.viewed',
        entityType: 'page',
        entityId: path || null,
        payload: {
          pageType: 'product'
        },
        sourceUi: 'product_page',
        dedupeKey,
        dedupeTtlMs: 10 * 60 * 1000
      })
    } catch {
      // best-effort
    }
  }, [productId, product, resolvedCategoryIds, resolvedVendorId])

  const handleAddToCart = () => {
    const debugCart = (() => {
      try {
        return typeof window !== 'undefined' && window.localStorage?.getItem('probooster_debug_cart') === 'true'
      } catch {
        return false
      }
    })()

    if (!requireAuth('Connectez-vous pour ajouter au panier.')) {
      return
    }

    if (!product) {
      toast({
        title: 'Erreur',
        description: 'Produit introuvable.',
        variant: 'destructive'
      })
      return
    }

    void recordReferralInteraction('conversion')

    const originalPriceCandidate = Number((product as any)?.originalPrice ?? 0) || 0
    const currentPriceCandidate = Number((product as any)?.price ?? 0) || 0

    const regularPrice = originalPriceCandidate > 0 ? originalPriceCandidate : currentPriceCandidate
    const salePrice = currentPriceCandidate
    const effectiveUnitPrice = salePrice > 0 && regularPrice > 0 && salePrice <= regularPrice ? salePrice : regularPrice
    const originalPrice = regularPrice

    const image =
      (Array.isArray((product as any)?.images) ? (product as any)?.images?.[0] : null) ||
      (product as any)?.image ||
      '/placeholder.svg'

    const sellerName =
      String((product as any)?.seller?.name ?? (product as any)?.seller ?? '').trim() ||
      'Vendeur Probooster'

    const warranty = String((product as any)?.warranty ?? '').trim() || undefined
    const returnPolicy =
      String((product as any)?.returnPolicy ?? (product as any)?.return_policy ?? '').trim() || undefined

    const manageStock = Boolean((product as any)?.manageStock)
    const stockCountRaw = (product as any)?.stockCount
    const stockCount = stockCountRaw === null || stockCountRaw === undefined ? null : (Number(stockCountRaw) || 0)
    const inStock = manageStock ? (stockCount === null ? true : stockCount > 0) : true

    const qty = Math.max(1, Number(quantity) || 1)
    const id = (product as any)?.id ?? productId

    if (debugCart) {
      console.log('[CartDebug] ProductPageClient:clickAdd', {
        id: String(id),
        qty,
        effectiveUnitPrice,
        originalPrice,
        inStock
      })
    }

    const ok = addToCart({
      id,
      name: String((product as any)?.name ?? 'Produit').trim() || 'Produit',
      price: effectiveUnitPrice,
      originalPrice,
      warranty,
      returnPolicy,
      image,
      seller: sellerName,
      inStock
    })

    if (debugCart) {
      try {
        const nextCart = CartService.getCart()
        console.log('[CartDebug] ProductPageClient:addToCartResult', {
          ok,
          count: (Array.isArray(nextCart) ? nextCart : []).reduce((sum: number, it: any) => sum + (Number(it?.quantity ?? 0) || 0), 0),
          ids: (Array.isArray(nextCart) ? nextCart : []).map((x: any) => String(x?.id ?? '')).slice(0, 20)
        })
      } catch {
        // ignore
      }
    }

    if (!ok) {
      return
    }

    // Ajuste la quantité immédiatement sans spammer les événements/toasts.
    if (qty > 1) {
      const cart = CartService.getCart()
      const currentQty = Array.isArray(cart)
        ? Number((cart.find((it: any) => String(it?.id ?? '') === String(id)) as any)?.quantity ?? 0)
        : 0
      if (currentQty > 0) {
        updateQuantity(id, currentQty + (qty - 1))
      }
    }

    // Ceinture + bretelles: on force une relecture du panier réel et on ré-émet l'événement.
    // Objectif: garantir l'affichage immédiat dans le Header/Modal même si un refresh async est en cours.
    try {
      if (typeof window !== 'undefined') {
        const nextCart = CartService.getCart()
        const count = (Array.isArray(nextCart) ? nextCart : []).reduce(
          (sum: number, item: any) => sum + (Number(item?.quantity ?? 0) || 0),
          0
        )
        window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cart: nextCart, count } }))
      }
    } catch {
      // ignore
    }
  }

  const pointsRequired = useMemo(() => {
    const price = Number(product?.price ?? 0) || 0
    return Math.max(0, Math.round(price / purchaseValue))
  }, [product?.price, purchaseValue])

  /**
   * Ouvre le même modal "acheter avec points" que celui utilisé sur les cartes produit (/products).
   */
  const handleBuyWithPoints = () => {
    if (!requireAuth('Connectez-vous pour passer une commande.')) {
      return
    }
    if (!product) return
    void recordReferralInteraction('click')

    const enriched = {
      ...product,
      pointsPrice: pointsRequired
    }
    setSelectedProductForPoints(enriched)
    setIsPointsModalOpen(true)
  }

  /**
   * Handler identique à l'intention du flux carte: le modal remonte l'action.
   * Ici on conserve un comportement sûr (feedback UI) et tu pourras brancher la vraie commande si besoin.
   */
  const handlePointsPurchase = (selected: any, usePoints: boolean, pointsToUse: number) => {
    toast({
      title: 'Achat avec points',
      description: usePoints
        ? `Demande d'achat de ${String(selected?.name ?? 'ce produit')} avec ${Number(pointsToUse) || 0} points.`
        : `Demande d'achat de ${String(selected?.name ?? 'ce produit')} (sans utilisation de points).`,
      variant: 'default'
    })
  }

  if (!productId || !UUID_REGEX.test(String(productId))) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6 text-sm text-red-600">Produit introuvable.</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ShareConfirmModal
        open={shareConfirmOpen}
        platform={(shareConfirmPlatform || 'copy') as any}
        points={shareConfirmPoints}
        onOpenChange={(next) => {
          if (!next) {
            setShareConfirmOpen(false)
            pendingShareRef.current = null
          }
        }}
        onEarnPoints={() => {
          void confirmAndRunShare(true)
        }}
        onShareNoPoints={() => {
          void confirmAndRunShare(false)
        }}
      />

      {selectedProductForPoints && (
        <PointsPurchaseModal
          isOpen={isPointsModalOpen}
          onClose={() => {
            setIsPointsModalOpen(false)
            setSelectedProductForPoints(null)
          }}
          product={selectedProductForPoints}
          onPurchase={handlePointsPurchase}
        />
      )}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-4">
          <EditableMessagesBanner location="product_page" />
        </div>
        {isLoadingProduct && <div className="mb-6 text-sm text-gray-600">Chargement du produit…</div>}

        {!isLoadingProduct && !product && <div className="mb-6 text-sm text-red-600">Produit introuvable.</div>}

        {product && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Product Images */}
              <div className="space-y-4">
                <div className="aspect-square overflow-hidden rounded-lg border">
                  <Image
                    src={product.images[selectedImage] || "/placeholder.svg"}
                    alt={product.name}
                    width={500}
                    height={500}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {product.images.map((image: any, index: number) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-square overflow-hidden rounded-lg border-2 ${
                        selectedImage === index ? "border-[#ff6600]" : "border-gray-200"
                      }`}
                    >
                      <Image
                        src={image || "/placeholder.svg"}
                        alt={`${product.name} ${index + 1}`}
                        width={100}
                        height={100}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Info */}
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>

                  <div className="flex items-center space-x-4 mb-4">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${i < Math.floor(product.rating) ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                        />
                      ))}
                    </div>
                    <span className="text-gray-600">
                      {product.rating} ({product.reviews} avis)
                    </span>
                  </div>

                  <div className="flex items-center space-x-4 mb-4">
                    <span className="text-3xl font-bold text-[#ff6600]">{formatMoney(product.price)}</span>
                    {product.originalPrice > product.price && (
                      <>
                        <span className="text-xl text-gray-500 line-through">{formatMoney(product.originalPrice)}</span>
                        <Badge className="bg-red-500">-{product.discount}%</Badge>
                      </>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 mb-4">
                    <span className="text-[#ff6600]">🪙</span>
                    <span className="text-sm text-gray-600">{pointsRequired} points</span>
                  </div>

                  <div className="flex items-center space-x-2 mb-4">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={product.seller.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{product.seller.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div
                        className="font-medium text-[#ff6600] cursor-pointer hover:text-[#e55a00] transition-colors duration-300"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          const vendorId = String(resolvedVendorId ?? '').trim()
                          if (UUID_REGEX.test(vendorId)) {
                            router.push(`/seller/${vendorId}`)
                          }
                        }}
                      >
                        {product.seller.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        ⭐ {product.seller.rating} • {product.seller.totalSales} ventes
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
                      <div className="mt-1 text-xs text-gray-600">
                        {shippingLabel}
                      </div>

                      {(String((product as any)?.warranty ?? '').trim() || String((product as any)?.returnPolicy ?? '').trim()) && (
                        <div className="mt-2 text-xs text-gray-700">
                          <div className="flex flex-wrap gap-x-6 gap-y-1">
                            {String((product as any)?.warranty ?? '').trim() && (
                              <span>
                                <span className="font-medium">Garantie:</span> {String((product as any)?.warranty ?? '').trim()}
                              </span>
                            )}
                            {String((product as any)?.returnPolicy ?? '').trim() && (
                              <span>
                                <span className="font-medium">Retours:</span> {String((product as any)?.returnPolicy ?? '').trim()}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Share Section */}
                <Card className="bg-gradient-to-r from-[#ff6600]/10 to-orange-100 border-[#ff6600]/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-[#ff6600]">Gagnez +{estimatedPointsToEarn} points</div>
                        <div className="text-sm text-gray-600">En partageant ce produit • {shareCountsTotal} partages</div>
                      </div>
                      <DropdownMenu
                        open={isShareOpen}
                        onOpenChange={(nextOpen) => {
                          if (!nextOpen) {
                            setIsShareOpen(false)
                            return
                          }
                          if (!requireAuth('Connectez-vous pour gagner des points en partageant.')) {
                            setIsShareOpen(false)
                            return
                          }
                          setIsShareOpen(true)
                        }}
                      >
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="border-[#ff6600] text-[#ff6600] bg-transparent">
                            <Share2 className="h-4 w-4 mr-2" />
                            Partager
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleShare("facebook")}>📘 Facebook (+{resolveSharePoints("facebook", 0)} pts)</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleShare("whatsapp")}>💬 WhatsApp (+{resolveSharePoints("whatsapp", 0)} pts)</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleShare("twitter")}>🐦 Twitter (+{resolveSharePoints("twitter", 0)} pts)</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleShare("instagram")}>📷 Instagram (+{resolveSharePoints("instagram", 0)} pts)</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>

                {/* Quantity and Actions */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <span className="font-medium">Quantité:</span>
                    <div className="flex items-center border rounded-lg">
                      <Button variant="ghost" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}>
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="px-4 py-2 font-medium">{quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const canIncrease = product.manageStock ? quantity < product.stockCount : true
                          if (!canIncrease) return
                          setQuantity(quantity + 1)
                        }}
                        disabled={product.manageStock ? quantity >= product.stockCount : false}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-col">
                      <Badge
                        className={
                          product.inStock
                            ? 'w-fit bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'w-fit bg-rose-50 text-rose-700 border border-rose-200'
                        }
                        variant="outline"
                      >
                        {product.inStock ? 'En stock' : 'Rupture de stock'}
                      </Badge>
                      <span className="mt-1 text-sm text-gray-600">
                        {product.manageStock ? `En stock (${product.stockCount} disponibilités)` : 'Disponible'}
                      </span>
                      {isFreeShippingLabelVisible && (
                        <Badge className="mt-2 w-fit bg-gradient-to-r from-emerald-500 to-green-600 text-white border-0 shadow-sm">
                          Livraison gratuite
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button size="lg" className="bg-[#ff6600] hover:bg-[#e55a00]" onClick={handleAddToCart}>
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Ajouter au panier
                    </Button>
                    <Button size="lg" variant="outline" onClick={handleBuyWithPoints}>
                      Acheter avec points ({pointsRequired} pts)
                    </Button>
                  </div>

                  <div className="flex space-x-4">
                    <Button
                      variant="outline"
                      className="flex-1 bg-transparent"
                      onClick={() => {
                        if (!requireAuth('Connectez-vous pour ajouter aux favoris.')) {
                          return
                        }
                        toggleWishlist(product)
                      }}
                    >
                      <Heart className="h-4 w-4 mr-2 text-red-500 hover:scale-110 transition-all duration-300" />
                      Ajouter aux favoris
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={handleOpenSellerChat}>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Contacter le vendeur
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Details Tabs */}
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="specifications">Caractéristiques</TabsTrigger>
                <TabsTrigger value="reviews">Avis ({product.reviews})</TabsTrigger>
              </TabsList>

              <TabsContent value="description" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Description du produit</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-700 leading-relaxed">{product.description}</p>
                    <div>
                      <h4 className="font-semibold mb-2">Caractéristiques principales:</h4>
                      <ul className="space-y-1">
                        {product.features.map((feature: any, index: number) => (
                          <li key={index} className="flex items-center space-x-2">
                            <span className="w-2 h-2 bg-[#ff6600] rounded-full"></span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="specifications" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Spécifications techniques</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(product.specifications).map(([key, value]) => (
                        <div key={key} className="flex justify-between py-2 border-b">
                          <span className="font-medium">{key}:</span>
                          <span className="text-gray-600">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Avis clients</CardTitle>
                    <CardDescription>
                      {product.reviews} avis • Note moyenne: {product.rating}/5
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {(() => {
                      const list = Array.isArray((product as any)?.api?.reviews) ? (product as any).api.reviews : []
                      if (list.length === 0) {
                        return <div className="text-sm text-gray-600">Aucun avis pour le moment.</div>
                      }

                      return list.map((review: any) => {
                        const userName = String(review?.userName ?? review?.user ?? 'Client')
                        const comment = String(review?.comment ?? '')
                        const rating = Number(review?.rating ?? 0) || 0
                        const verified = Boolean(review?.verified ?? review?.is_verified_purchase ?? false)

                        return (
                          <div
                            key={String(review?.id ?? `${userName}-${comment}-${rating}`)}
                            className="border-b pb-4 last:border-b-0"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={String(review?.userAvatar ?? '') || undefined} alt={userName} />
                                  <AvatarFallback>{userName[0] ?? 'C'}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{userName}</div>
                                  <div className="text-sm text-gray-600">
                                    {typeof review?.createdAt === 'string'
                                      ? formatDate(review.createdAt, { dateStyle: 'medium' })
                                      : ''}
                                  </div>
                                </div>
                              </div>
                              {verified && (
                                <Badge variant="secondary" className="text-xs">
                                  Achat vérifié
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center mb-2">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${i < Math.floor(rating) ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                                />
                              ))}
                            </div>
                            <p className="text-gray-700">{comment}</p>
                          </div>
                        )
                      })
                    })()}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Chat Widget */}
            <ModalGlobalChatTrigger
              sellerId={resolvedVendorId}
              sellerName={product.seller.name}
              product={product}
              className="fixed bottom-6 right-6 z-50"
            />

            {/* Modal chat (design différent) mais synchronisé Supabase */}
            <LegacyChatModal
              isOpen={isChatOpen}
              onClose={() => setIsChatOpen(false)}
              sellerId={resolvedVendorId}
              sellerName={product?.seller?.name || 'Boutique'}
              sellerAvatar={product?.seller?.avatar}
              product={product}
            />
          </>
        )}
      </div>
    </div>
  )
}
