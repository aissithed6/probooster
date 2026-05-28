"use client"

import { useMemo, useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  Filter, 
  Grid, 
  Heart, 
  List, 
  Search, 
  Share2, 
  ShoppingCart, 
  Star, 
  Sparkles, 
  TrendingUp, 
  Gift, 
  Clock, 
  Coins, 
  Zap, 
  Crown, 
  Flame,
  ArrowRight,
  ShoppingBag,
  Users,
  Award,
  Target,
  Rocket,
  MessageCircle
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useCart } from "@/hooks/use-cart"
import { useWishlist } from "@/hooks/use-wishlist"
import { useNotifications, NotificationContainer } from "@/components/ui/modern-notification"
import { enrichProductWithSpecs } from "@/lib/product-specifications"
import ProductModal from "@/components/product/product-modal"
import { LegacyChatModal } from "@/components/chat/LegacyChatModal"
import PointsPurchaseModal from "@/components/product/points-purchase-modal"
import { ShareEngagementService } from "@/lib/services/share-engagement-service"
import { useClientPoints } from "@/lib/hooks/use-client-points"
import { useToast } from "@/hooks/use-toast"
import { useVendorPresence } from "@/lib/hooks/use-vendor-presence"
import { useAuthGuard } from "@/lib/hooks/use-auth-guard"
import { useAuth } from "@/contexts/AuthContext"
import { ShareConfirmModal } from "@/components/product/share-confirm-modal"
import { buildViewDedupeKey, trackAutomationEvent } from "@/lib/client-automation-events"
import { EditableMessagesBanner } from "@/components/messages/EditableMessagesBanner"

type DbProductListItem = {
  id: string
  name: string
  price: number
  salePrice: number | null
  originalPrice?: number
  vendorId: string | null
  categoryIds?: string[]
  image: string
  images: string[]
  inStock: boolean
  stockQuantity: number | null
  shares?: number
  shareData?: Record<string, number>
  sellerName?: string
  sellerAvatar?: string
  createdAt?: string | null
}

type ProductsPageStats = {
  totalProducts: number
  pointsEarned: number
  activeVendors: number
  savingsPercent: number
}

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

/**
 * Sous-composant dédié au vendeur afin de pouvoir utiliser un hook (useVendorPresence)
 * sans enfreindre les règles des hooks dans une boucle de rendu.
 */
function ProductSellerLine({ vendorId, sellerName }: { vendorId: string | null; sellerName: string }) {
  const normalizedName = String(sellerName ?? '').trim() || 'Boutique'
  const sellerSlug = toSellerSlug(normalizedName) || 'boutique'
  const sellerHref = `/seller/${sellerSlug}`

  const isSellerOnline = useVendorPresence(String(vendorId ?? '').trim()).isOnline === true

  return (
    <div className="text-sm text-gray-600 flex items-center flex-wrap gap-1">
      <span>Vendu par</span>
      <Link
        href={sellerHref}
        prefetch
        className="font-medium text-[#ff6600] cursor-pointer hover:text-[#e55a00] transition-colors duration-300"
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
        {normalizedName}
      </Link>
      <span className="mx-1">•</span>
      <span className={isSellerOnline ? "text-green-700" : "text-gray-600"}>
        {isSellerOnline ? 'En ligne' : 'Hors ligne'}
      </span>
    </div>
  )
}

function mapApiListItems(items: any[]): DbProductListItem[] {
  return items
    .map((row: any) => ({
      id: String(row?.id ?? '').trim(),
      name: String(row?.name ?? 'Produit'),
      price: Number(row?.price ?? 0) || 0,
      salePrice: row?.salePrice === null || row?.salePrice === undefined ? null : Number(row.salePrice) || null,
      originalPrice: Number.isFinite(Number(row?.originalPrice)) ? Number(row.originalPrice) : undefined,
      vendorId: row?.vendorId ? String(row.vendorId) : null,
      categoryIds: Array.isArray(row?.categoryIds) ? row.categoryIds.map((v: any) => String(v ?? '').trim()).filter(Boolean) : [],
      image: String(row?.image ?? '/placeholder.svg'),
      images: Array.isArray(row?.images) ? row.images.map((x: any) => String(x ?? '')).filter(Boolean) : [],
      inStock: Boolean(row?.inStock),
      stockQuantity: row?.stockQuantity === null || row?.stockQuantity === undefined ? null : Number(row.stockQuantity),
      shares: Number(row?.shares ?? 0) || 0,
      shareData: (row?.shareData ?? row?.share_data ?? {}) as any,
      sellerName: typeof row?.sellerName === 'string' ? row.sellerName : '',
      sellerAvatar: typeof row?.sellerAvatar === 'string' ? row.sellerAvatar : '',
      createdAt: typeof row?.createdAt === 'string' ? row.createdAt : (typeof row?.created_at === 'string' ? row.created_at : null)
    }))
    .filter((p: DbProductListItem) => p.id.length > 0)
}

function shouldOpenProtectedShareDropdown(nextOpen: boolean, requireAuth: (message: string) => boolean): boolean {
  if (!nextOpen) return false
  return requireAuth('Connectez-vous pour gagner des points en partageant.')
}

export default function ProductsPageClient({
  initialProducts,
  initialStats
}: {
  initialProducts: any[]
  initialStats?: ProductsPageStats
}) {
  /**
   * Page /products (Client Component).
   * Les produits peuvent être préchargés côté serveur (SSR) via la prop initialProducts.
   */
  const router = useRouter()

  const fallbackStats: ProductsPageStats = useMemo(
    () => ({
      totalProducts: 0,
      pointsEarned: 0,
      activeVendors: 0,
      savingsPercent: 0
    }),
    []
  )

  const [stats, setStats] = useState<ProductsPageStats>(initialStats ?? fallbackStats)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<'popular' | 'price-low' | 'price-high' | 'rating' | 'newest'>('popular')
  const [popularityScoreById, setPopularityScoreById] = useState<Record<string, number>>({})
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPointsModalOpen, setIsPointsModalOpen] = useState(false)
  const [selectedProductForPoints, setSelectedProductForPoints] = useState<any>(null)
  const [sharePointsByPlatform, setSharePointsByPlatform] = useState<Record<string, number>>({})
  const [defaultSharePoints, setDefaultSharePoints] = useState<number>(0)
  const [adminPointsConfig, setAdminPointsConfig] = useState<{ purchaseValue: number } | null>(null)

  const {
    configuration: pointsConfiguration,
    socialShareValue,
    socialSharePerNetwork,
    refresh: refreshClientPoints
  } = useClientPoints()
  
  // États pour le modal chat
  const [showChatModal, setShowChatModal] = useState(false)
  const [chatSellerId, setChatSellerId] = useState('')
  const [chatSellerName, setChatSellerName] = useState('')
  const [chatSellerAvatar, setChatSellerAvatar] = useState('')
  
  // États pour les triggers d'incitation
  const [showUrgency, setShowUrgency] = useState(false)
  const [urgencyTimer, setUrgencyTimer] = useState(0)
  const [showStockAlert, setShowStockAlert] = useState(false)
  const [stockAlertProduct, setStockAlertProduct] = useState<any>(null)
  const [isClient, setIsClient] = useState(false)
  const [openShareMenuByProductId, setOpenShareMenuByProductId] = useState<Record<string, boolean>>({})
  const [sharingPlatform, setSharingPlatform] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmPlatform, setConfirmPlatform] = useState<string>('')
  const [confirmPoints, setConfirmPoints] = useState<number>(0)
  const pendingShareRef = useRef<{ productId: string; platform: string; shareUrl: string; openWindow: () => Promise<void> } | null>(null)

  type SpecialPromotion = {
    id: string
    title?: string | null
    description?: string | null
    start_date?: string | null
    end_date?: string | null
  }

  type SpecialOffer = {
    product: {
      id: string
    }
    originalPrice: number
    discountedPrice: number
    startDate?: string | null
    endDate?: string | null
    promotionId?: string
    promotionName?: string
  }

  const [specialPromotions, setSpecialPromotions] = useState<SpecialPromotion[]>([])
  const [specialOffers, setSpecialOffers] = useState<SpecialOffer[]>([])
  const [showOnlySpecialOffers, setShowOnlySpecialOffers] = useState(false)
  const [flashEndsAtIso, setFlashEndsAtIso] = useState<string | null>(null)
  const [isPromosModalOpen, setIsPromosModalOpen] = useState(false)
  
  // Hook pour les notifications modernes
  const { addNotification } = useNotifications()

  const { requireAuth } = useAuthGuard()

  const { toast } = useToast()
  const { user } = useAuth()

  const recordedAutomationListViewRef = useRef(false)
  
  // Hooks pour le panier et la wishlist
  const { addToCart, isInCart } = useCart()
  const { toggleWishlist, isInWishlist } = useWishlist()

  const [dbProducts, setDbProducts] = useState<DbProductListItem[]>(() =>
    Array.isArray(initialProducts) && initialProducts.length > 0 ? mapApiListItems(initialProducts) : []
  )
  const [isLoadingDbProducts, setIsLoadingDbProducts] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMoreProducts, setHasMoreProducts] = useState(true)
  const pageSize = 48

  /**
   * Calcule le nombre de secondes restantes avant une date ISO (0 si invalide ou expirée).
   */
  const computeSecondsUntil = (iso: string | null): number => {
    if (!iso) return 0
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return 0
    const diffMs = d.getTime() - Date.now()
    if (!Number.isFinite(diffMs) || diffMs <= 0) return 0
    return Math.max(0, Math.floor(diffMs / 1000))
  }

  useEffect(() => {
    let isMounted = true

    const loadSharePoints = async () => {
      const platforms = ["facebook", "whatsapp", "twitter", "instagram"]
      const config: Record<string, number> = {}

      const global = Math.max(0, Math.round(Number(socialShareValue) || 0))
      const resolve = (key: string) => {
        const normalized = String(key ?? '').toLowerCase().trim()
        const value = Number((socialSharePerNetwork as any)?.[normalized])
        return Number.isFinite(value) && value >= 0 ? Math.round(value) : global
      }

      config.copy = resolve('copy')
      for (const platform of platforms) {
        config[platform] = resolve(platform)
      }

      if (isMounted) {
        setSharePointsByPlatform(config)
        setDefaultSharePoints(global)
      }
    }

    loadSharePoints()

    return () => {
      isMounted = false
    }
  }, [socialSharePerNetwork, socialShareValue])

  useEffect(() => {
    let cancelled = false

    const hydrateShareCounts = async () => {
      const ids = (Array.isArray(dbProducts) ? dbProducts : [])
        .map((p) => String((p as any)?.id ?? '').trim())
        .filter(Boolean)
      if (ids.length === 0) return

      try {
        const results = await Promise.all(ids.map((pid) => ShareEngagementService.getProductShareCounts(pid)))
        if (cancelled) return
        setDbProducts((prev) => {
          const arr = Array.isArray(prev) ? prev : []
          return arr.map((p) => {
            const pid = String((p as any)?.id ?? '').trim()
            const idx = ids.indexOf(pid)
            if (idx < 0) return p
            const counts = results[idx]
            const total = Number(counts?.total)
            return {
              ...(p as any),
              shares: Number.isFinite(total) && total >= 0 ? Math.round(total) : Number((p as any)?.shares ?? 0) || 0,
              shareData: counts?.byPlatform ?? (p as any)?.shareData
            } as any
          })
        })
      } catch {
        // noop
      }
    }

    void hydrateShareCounts()
    return () => {
      cancelled = true
    }
  }, [dbProducts.length])

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

  useEffect(() => {
    let cancelled = false

    const refreshStats = async () => {
      try {
        const resp = await fetch('/api/public/products/stats', { method: 'GET', cache: 'no-store' }).catch(() => null)
        const json = await resp?.json().catch(() => null)
        const payload = json?.data
        if (cancelled) return

        const next: ProductsPageStats = {
          totalProducts: Number(payload?.totalProducts ?? 0) || 0,
          pointsEarned: Number(payload?.pointsEarned ?? 0) || 0,
          activeVendors: Number(payload?.activeVendors ?? 0) || 0,
          savingsPercent: Number(payload?.savingsPercent ?? 0) || 0
        }

        setStats(next)
      } catch {
        // noop
      }
    }

    refreshStats()
    const interval = setInterval(refreshStats, 30_000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const loadDbProducts = async () => {
      try {
        setIsLoadingDbProducts(true)
        const resp = await fetch(`/api/public/products/list?limit=${pageSize}&offset=0`, { method: 'GET', cache: 'no-store' }).catch(() => null)
        const json = await resp?.json().catch(() => null)
        const items = Array.isArray(json?.data?.items) ? json.data.items : []
        if (cancelled) return

        const mapped = mapApiListItems(items)
        setDbProducts(mapped)
        setHasMoreProducts(mapped.length >= pageSize)
      } catch {
        if (!cancelled) setDbProducts([])
      } finally {
        if (!cancelled) setIsLoadingDbProducts(false)
      }
    }

    void loadDbProducts()

    return () => {
      cancelled = true
    }
  }, [initialProducts])

  useEffect(() => {
    if (recordedAutomationListViewRef.current) return
    recordedAutomationListViewRef.current = true

    try {
      const path = typeof window !== 'undefined' ? window.location.pathname : null
      const dedupeKey = buildViewDedupeKey({ eventType: 'product.list_viewed', entityType: 'product_list', entityId: path, path })
      void trackAutomationEvent({
        eventType: 'product.list_viewed',
        entityType: 'product_list',
        entityId: path || null,
        payload: {
          pageType: 'products',
          initialCount: Array.isArray(initialProducts) ? initialProducts.length : 0
        },
        sourceUi: 'products_page',
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
          pageType: 'products'
        },
        sourceUi: 'products_page',
        dedupeKey,
        dedupeTtlMs: 10 * 60 * 1000
      })
    } catch {
      // best-effort
    }
  }, [initialProducts])

  /**
   * Charge la page suivante de produits depuis la DB (pagination offset/limit).
   */
  const loadMoreProducts = async () => {
    if (isLoadingMore || isLoadingDbProducts || !hasMoreProducts) return
    try {
      setIsLoadingMore(true)
      const offset = dbProducts.length
      const resp = await fetch(`/api/public/products/list?limit=${pageSize}&offset=${offset}`, {
        method: 'GET',
        cache: 'no-store'
      }).catch(() => null)
      const json = await resp?.json().catch(() => null)
      const items = Array.isArray(json?.data?.items) ? json.data.items : []
      const mapped = mapApiListItems(items)

      setDbProducts((prev) => {
        const existing = new Set(prev.map((p) => p.id))
        const merged = [...prev]
        for (const p of mapped) {
          if (!existing.has(p.id)) merged.push(p)
        }
        return merged
      })

      setHasMoreProducts(mapped.length >= pageSize)
    } catch {
      // noop
    } finally {
      setIsLoadingMore(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    const loadSpecialPromotions = async () => {
      try {
        const res = await fetch('/api/public/special-promotions', { method: 'GET', cache: 'no-store' }).catch(() => null)
        const json = await res?.json().catch(() => null)
        const list = Array.isArray(json) ? (json as any[]) : []
        const parsed: SpecialPromotion[] = list
          .map((sp: any) => ({
            id: String(sp?.id ?? '').trim(),
            title: sp?.title ?? null,
            description: sp?.description ?? null,
            start_date: sp?.start_date ?? null,
            end_date: sp?.end_date ?? null
          }))
          .filter((sp: SpecialPromotion) => sp.id.length > 0)

        if (cancelled) return
        setSpecialPromotions(parsed)

        const ends = parsed
          .map((sp) => (typeof sp.end_date === 'string' ? sp.end_date : null))
          .filter((v): v is string => Boolean(v))
          .map((v) => ({ iso: v, t: new Date(v).getTime() }))
          .filter((x) => Number.isFinite(x.t) && x.t > Date.now())
          .sort((a, b) => a.t - b.t)

        const nextEndsAt = ends.length > 0 ? ends[0].iso : null
        setFlashEndsAtIso(nextEndsAt)
        setShowUrgency(Boolean(nextEndsAt))
        setUrgencyTimer(computeSecondsUntil(nextEndsAt))
      } catch {
        if (cancelled) return
        setSpecialPromotions([])
        setFlashEndsAtIso(null)
        setShowUrgency(false)
        setUrgencyTimer(0)
      }
    }

    const loadSpecialOffers = async () => {
      try {
        const res = await fetch('/api/public/special-offers', { method: 'GET', cache: 'no-store' }).catch(() => null)
        const json = await res?.json().catch(() => null)
        const list = Array.isArray(json) ? (json as any[]) : []
        const parsed: SpecialOffer[] = list
          .map((offer: any) => ({
            product: { id: String(offer?.product?.id ?? '').trim() },
            originalPrice: Number(offer?.originalPrice ?? 0) || 0,
            discountedPrice: Number(offer?.discountedPrice ?? 0) || 0,
            startDate: offer?.startDate ?? null,
            endDate: offer?.endDate ?? null,
            promotionId: offer?.promotionId,
            promotionName: offer?.promotionName
          }))
          .filter((o: SpecialOffer) => o.product.id.length > 0 && o.originalPrice > 0 && o.discountedPrice > 0)

        if (cancelled) return
        setSpecialOffers(parsed)
      } catch {
        if (!cancelled) setSpecialOffers([])
      }
    }

    void loadSpecialPromotions()
    void loadSpecialOffers()

    const poll = setInterval(() => {
      void loadSpecialPromotions()
      void loadSpecialOffers()
    }, 15000)

    return () => {
      cancelled = true
      clearInterval(poll)
    }
  }, [])

  const resolveSharePoints = (platform: string, fallback: number) => {
    const value = Number(sharePointsByPlatform?.[platform])
    if (Number.isFinite(value) && value >= 0) return Math.round(value)
    return fallback
  }

  /**
   * Convertit un prix FCFA en points selon la config Super Admin (Option A), sans décimales.
   */
  const convertPriceToPoints = (price: number) => {
    const raw = (pointsConfiguration?.settings as any)?.purchaseValue ?? adminPointsConfig?.purchaseValue
    const normalized = typeof raw === 'string' ? raw.trim().replace(',', '.') : raw
    const numeric = Number(normalized)
    const safePurchaseValue = Number.isFinite(numeric) && numeric > 0 ? numeric : 1
    return Math.max(0, Math.ceil(Number(price || 0) / safePurchaseValue))
  }

  const productsForDisplay = useMemo(() => {
    const specialOfferByProductId = new Map<string, SpecialOffer>()
    for (const offer of specialOffers) {
      const pid = String(offer?.product?.id ?? '').trim()
      if (!pid) continue
      if (!specialOfferByProductId.has(pid)) specialOfferByProductId.set(pid, offer)
    }

    return dbProducts.map((product) => {
      const specialOffer = specialOfferByProductId.get(product.id)
      const specialSale = specialOffer && specialOffer.discountedPrice > 0 ? specialOffer.discountedPrice : null

      const sale =
        specialSale !== null
          ? specialSale
          : (product.salePrice !== null && Number.isFinite(Number(product.salePrice)) && Number(product.salePrice) > 0
              ? Number(product.salePrice)
              : null)

      const originalPrice = specialOffer && specialOffer.originalPrice > 0 ? specialOffer.originalPrice : product.price
      const effectivePrice = sale ?? originalPrice
      const discount =
        originalPrice > 0 && sale !== null && sale < originalPrice
          ? Math.round(((originalPrice - sale) / originalPrice) * 100)
          : 0

      return {
        id: product.id,
        name: product.name,
        price: originalPrice,
        salePrice: sale,
        pointsPrice: convertPriceToPoints(effectivePrice),
        originalPrice,
        rating: 0,
        reviews: 0,
        image: product.image,
        seller: product.sellerName?.trim() || 'Boutique',
        vendorId: product.vendorId ?? undefined,
        categoryIds: Array.isArray(product.categoryIds) ? product.categoryIds : [],
        sharePoints: defaultSharePoints,
        shares: Number((product as any)?.shares ?? 0) || 0,
        shareData: ((product as any)?.shareData ?? {}) as Record<string, number>,
        inStock: product.inStock,
        stockQuantity: product.stockQuantity,
        createdAt: product.createdAt ?? null,
        discount,
        isHot: false,
        isNew: false,
        isLimited: false,
        badges: [],
        color: 'black'
      }
    })
  }, [convertPriceToPoints, dbProducts, defaultSharePoints, specialOffers])

  useEffect(() => {
    let cancelled = false

    /**
     * Charge les scores de popularité calculés côté API (ventes + partages + vues + chats).
     */
    const loadPopularityScores = async () => {
      try {
        const resp = await fetch('/api/public/products/popular?limit=48', { method: 'GET', cache: 'no-store' }).catch(() => null)
        const json = await resp?.json().catch(() => null)
        const items = Array.isArray(json?.data?.items) ? json.data.items : []

        const next: Record<string, number> = {}
        for (const it of items) {
          const id = String(it?.id ?? '').trim()
          if (!id) continue
          const score = Number(it?.popularityScore ?? 0)
          next[id] = Number.isFinite(score) ? score : 0
        }

        if (!cancelled) setPopularityScoreById(next)
      } catch {
        // noop
      }
    }

    if (sortBy === 'popular') {
      void loadPopularityScores()
    }

    return () => {
      cancelled = true
    }
  }, [sortBy])

  const filteredProductsForDisplay = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()

    let items = productsForDisplay
    if (q.length > 0) {
      items = items.filter((p: any) => String(p?.name ?? '').toLowerCase().includes(q))
    }

    if (sortBy === 'newest') {
      items = [...items].sort((a: any, b: any) => {
        const at = typeof a?.createdAt === 'string' ? new Date(a.createdAt).getTime() : NaN
        const bt = typeof b?.createdAt === 'string' ? new Date(b.createdAt).getTime() : NaN
        const aTime = Number.isFinite(at) ? at : -Infinity
        const bTime = Number.isFinite(bt) ? bt : -Infinity
        return bTime - aTime
      })
    }

    if (showOnlySpecialOffers) {
      const ids = new Set(specialOffers.map((o) => String(o?.product?.id ?? '').trim()).filter(Boolean))
      items = ids.size === 0 ? [] : items.filter((p: any) => ids.has(String(p?.id ?? '').trim()))
    }

    const getEffectivePrice = (p: any) => {
      const sale = p?.salePrice
      const regular = p?.price
      const s = Number(sale)
      const r = Number(regular)
      if (Number.isFinite(s) && s > 0 && (!Number.isFinite(r) || s <= r)) return s
      return Number.isFinite(r) ? r : 0
    }

    if (sortBy === 'price-low') {
      items = [...items].sort((a: any, b: any) => getEffectivePrice(a) - getEffectivePrice(b))
    } else if (sortBy === 'price-high') {
      items = [...items].sort((a: any, b: any) => getEffectivePrice(b) - getEffectivePrice(a))
    } else if (sortBy === 'popular') {
      items = [...items].sort((a: any, b: any) => {
        const as = Number(popularityScoreById?.[String(a?.id ?? '').trim()] ?? 0)
        const bs = Number(popularityScoreById?.[String(b?.id ?? '').trim()] ?? 0)
        const aScore = Number.isFinite(as) ? as : 0
        const bScore = Number.isFinite(bs) ? bs : 0
        if (bScore !== aScore) return bScore - aScore
        return getEffectivePrice(b) - getEffectivePrice(a)
      })
    }

    return items
  }, [productsForDisplay, searchQuery, showOnlySpecialOffers, specialOffers, sortBy, popularityScoreById])

  const purchaseValue = (() => {
    const raw = (pointsConfiguration?.settings as any)?.purchaseValue ?? adminPointsConfig?.purchaseValue
    const normalized = typeof raw === 'string' ? raw.trim().replace(',', '.') : raw
    const numeric = Number(normalized)
    return Number.isFinite(numeric) && numeric > 0 ? numeric : 1
  })()

  /**
   * Calcule le prix en points synchronisé.
   */
  const getComputedPointsPrice = (price: number) => {
    return Math.max(0, Math.round(Number(price || 0) / purchaseValue))
  }

  // Fonction pour ouvrir le modal de fiche produit
  /**
   * Ouvre le modal produit immédiatement (sans attendre le réseau), puis hydrate en arrière-plan.
   */
  const handleOpenProductModal = (product: any) => {
    const pid = String(product?.id ?? '').trim()

    const enriched = {
      ...product,
      pointsPrice: getComputedPointsPrice(product.price),
      shares: Number(product?.shares ?? 0) || 0,
      shareData: (product?.shareData ?? {}) as Record<string, number>
    }

    setSelectedProduct(enriched)
    setIsModalOpen(true)
    
    // Hydratation asynchrone: compteurs de partages réels.
    if (pid) {
      void (async () => {
        try {
          const counts = await ShareEngagementService.getProductShareCounts(pid)
          setSelectedProduct((prev: any) => {
            const prevId = String(prev?.id ?? '').trim()
            if (!prev || prevId !== pid) return prev
            return {
              ...prev,
              shares: Number(counts?.total ?? prev?.shares ?? 0) || 0,
              shareData: (counts?.byPlatform ?? prev?.shareData ?? {}) as Record<string, number>
            }
          })
        } catch {
          // noop
        }
      })()
    }
  }

  // Fonction pour ouvrir le modal d'achat avec points
  const handleBuyWithPoints = (product: any) => {
    if (!requireAuth('Connectez-vous pour passer une commande.')) {
      return
    }
    const enriched = {
      ...product,
      pointsPrice: getComputedPointsPrice(product.price)
    }
    setSelectedProductForPoints(enriched)
    setIsPointsModalOpen(true)
  }

  /**
   * Ouvre la fenêtre de partage pour une plateforme donnée.
   * Important: la fenêtre doit s'ouvrir uniquement après confirmation du mini-modal (si applicable).
   */
  const openShareWindow = async (productName: string, productId: string, platform: string, shareUrl: string) => {
    const shareText = `Découvrez ${productName} sur Probooster !`
    let shareUrlPlatform = ""

    switch (platform) {
      case 'facebook':
        shareUrlPlatform = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`
        break
      case 'whatsapp':
        shareUrlPlatform = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`
        break
      case 'twitter':
        shareUrlPlatform = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
        break
      case 'instagram':
        shareUrlPlatform = `https://www.instagram.com/?url=${encodeURIComponent(shareUrl)}`
        break
      default:
        shareUrlPlatform = ""
    }

    if (shareUrlPlatform) {
      window.open(shareUrlPlatform, '_blank', 'width=600,height=400')
    }
  }

  /**
   * Enregistre le partage côté serveur via `ShareEngagementService.recordShare`.
   * `awardPoints` pilote l'attribution de points (verrou serveur: pas de points si propre produit / déjà récompensé).
   */
  const runShare = async (product: any, productId: string, platform: string, shareUrl: string, awardPoints: boolean) => {
    try {
      setSharingPlatform(platform)
      const vendorId = String((product as any)?.vendorId ?? (product as any)?.seller?.id ?? '').trim()
      if (!vendorId) {
        addNotification({
          type: 'error',
          title: 'Partage non enregistré',
          message: "Impossible d'identifier le vendeur pour enregistrer le partage."
        })
        return
      }

      const shareRow = await ShareEngagementService.recordShare(
        String(user?.id ?? ''),
        String(productId),
        vendorId,
        String(platform),
        shareUrl,
        { awardPoints }
      )

      const fallbackPoints = resolveSharePoints(platform, defaultSharePoints)
      const earned = Number((shareRow as any)?.points_earned ?? fallbackPoints) || 0

      if (shareRow?.id) {
        addNotification({
          type: 'success',
          title: 'Partage enregistré',
          message: `+${earned} points gagnés`
        })

        // Mise à jour immédiate du solde/progression points (sans recharger la page).
        try {
          void refreshClientPoints()
        } catch {
          // noop
        }
      } else {
        addNotification({
          type: 'error',
          title: 'Partage non enregistré',
          message: "Le partage a été ouvert, mais l'enregistrement n'a pas abouti."
        })
      }
    } catch {
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: "Impossible d'enregistrer le partage."
      })
    } finally {
      setSharingPlatform(null)
    }

    try {
      const counts = await ShareEngagementService.getProductShareCounts(String(productId))
      const total = Number(counts?.total)

      // Mettre à jour la carte: la source de vérité de la page est `dbProducts`.
      setDbProducts((prev) => {
        const arr = Array.isArray(prev) ? prev : []
        return arr.map((p) => {
          if (String(p?.id) !== String(productId)) return p
          return {
            ...p,
            shares: Number.isFinite(total) && total >= 0 ? Math.round(total) : Number((p as any)?.shares ?? 0) || 0,
            shareData: counts?.byPlatform ?? (p as any)?.shareData
          } as any
        })
      })

      // Mettre à jour le modal si ouvert sur ce produit
      setSelectedProduct((prev: any) => {
        const prevId = String(prev?.id ?? '').trim()
        if (!prev || prevId !== String(productId)) return prev
        return {
          ...prev,
          shares: Number.isFinite(total) && total >= 0 ? Math.round(total) : (prev?.shares ?? 0),
          shareData: counts?.byPlatform ?? prev?.shareData
        }
      })

      try {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('productShareRecorded', {
              detail: {
                productId: String(productId),
                total: Number.isFinite(total) && total >= 0 ? Math.round(total) : null
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
  }

  /**
   * Flux de partage (page /products):
   * - Check éligibilité serveur (`/api/shares/eligibility`).
   * - Si éligible => mini-modal `ShareConfirmModal` (gagner points vs partager sans points).
   * - Ouverture fenêtre seulement après décision.
   * - Enregistrement via `recordShare` avec `awardPoints` correspondant.
   */
  const handleShare = async (productId: string, platform: string) => {
    if (!requireAuth('Connectez-vous pour gagner des points en partageant.')) {
      return
    }

    const product = productsForDisplay.find((p) => p.id === productId)
    if (!product) return

    setOpenShareMenuByProductId((prev) => ({ ...prev, [String(productId)]: false }))

    const shareUrl = `${window.location.origin}/product/${encodeURIComponent(productId)}?ref=${user?.id ?? ''}`

    // Modal instantané (retard ~0): on l'ouvre tout de suite avec une valeur de points locale.
    // Ensuite on valide l'éligibilité côté serveur en arrière-plan.
    const optimisticPoints = resolveSharePoints(String(platform), defaultSharePoints)
    pendingShareRef.current = {
      productId: String(productId),
      platform: String(platform),
      shareUrl,
      openWindow: () => openShareWindow(String(product.name), String(productId), String(platform), shareUrl)
    }
    setConfirmPlatform(String(platform))
    setConfirmPoints(Math.max(0, Math.round(Number(optimisticPoints) || 0)))
    setConfirmOpen(true)

    const elig = await ShareEngagementService.checkShareEligibility(String(productId), String(platform))
    if (!elig) {
      // Si la vérif échoue, on retombe sur le comportement précédent.
      setConfirmOpen(false)
      pendingShareRef.current = null
      await openShareWindow(String(product.name), String(productId), String(platform), shareUrl)
      await runShare(product, String(productId), String(platform), shareUrl, true)
      return
    }

    if (!elig.canEarnPoints) {
      // Non éligible => pas de modal, partage direct sans points.
      setConfirmOpen(false)
      pendingShareRef.current = null
      await openShareWindow(String(product.name), String(productId), String(platform), shareUrl)
      await runShare(product, String(productId), String(platform), shareUrl, false)
      return
    }

    // Éligible: on met à jour le nombre de points exacts depuis l'API.
    setConfirmPoints(Math.max(0, Math.round(Number(elig.points) || optimisticPoints || 0)))
  }

  useEffect(() => {
    const handler = (evt: any) => {
      const pid = String(evt?.detail?.productId ?? '').trim()
      if (!pid) return
      const totalRaw = evt?.detail?.total
      const total = Number(totalRaw)
      if (!Number.isFinite(total) || total < 0) {
        void (async () => {
          try {
            const counts = await ShareEngagementService.getProductShareCounts(pid)
            const next = Number(counts?.total)
            setDbProducts((prev) => {
              const arr = Array.isArray(prev) ? prev : []
              return arr.map((p) => {
                if (String((p as any)?.id ?? '').trim() !== pid) return p
                return {
                  ...(p as any),
                  shares: Number.isFinite(next) && next >= 0 ? Math.round(next) : Number((p as any)?.shares ?? 0) || 0,
                  shareData: counts?.byPlatform ?? (p as any)?.shareData
                } as any
              })
            })
          } catch {
            // noop
          }
        })()
        return
      }

      setDbProducts((prev) => {
        const arr = Array.isArray(prev) ? prev : []
        return arr.map((p) => {
          if (String((p as any)?.id ?? '').trim() !== pid) return p
          return {
            ...(p as any),
            shares: Math.round(total)
          } as any
        })
      })
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
  }, [])

  const handleAddToCart = (productId: string) => {
    if (!requireAuth('Connectez-vous pour ajouter au panier.')) {
      return
    }
    const product = productsForDisplay.find(p => p.id === productId)
    if (product) {
      const basePrice = Number((product as any)?.price ?? 0) || 0
      const salePriceRaw = (product as any)?.salePrice
      const salePrice = salePriceRaw === null || salePriceRaw === undefined ? null : Number(salePriceRaw)
      const effectivePrice = Number.isFinite(salePrice as any) && (salePrice as number) > 0 ? (salePrice as number) : basePrice
      const originalPrice = basePrice
      addToCart({
        id: product.id,
        name: product.name,
        price: effectivePrice,
        originalPrice,
        warranty: (product as any)?.warranty,
        returnPolicy: (product as any)?.returnPolicy,
        image: product.image,
        seller: product.seller || 'Vendeur Probooster'
      })
      addNotification({ 
        type: 'success', 
        title: 'Produit ajouté', 
        message: `${product.name} a été ajouté au panier` 
      })
    }
  }

  const handleToggleWishlist = (productId: string) => {
    if (!requireAuth('Connectez-vous pour ajouter aux favoris.')) {
      return
    }
    const product = productsForDisplay.find(p => p.id === productId)
    if (product) {
      toggleWishlist({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        seller: product.seller || 'Vendeur Probooster'
      })
      
      if (isInWishlist(productId)) {
        addNotification({ 
          type: 'info', 
          title: 'Produit retiré', 
          message: `${product.name} a été retiré des favoris` 
        })
      } else {
        addNotification({ 
          type: 'success', 
          title: 'Produit ajouté', 
          message: `${product.name} a été ajouté aux favoris` 
        })
      }
    }
  }

  /**
   * Ouvre le modal immédiatement, puis hydrate le produit complet en arrière-plan.
   */
  const handleProductClick = (product: any) => {
    const pid = String(product?.id ?? '').trim()
    if (!pid) {
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: "Impossible d'ouvrir le produit (ID manquant)."
      })
      return
    }

    // Ouverture immédiate (aucun await avant l'ouverture).
    setSelectedProduct(product)
    setIsModalOpen(true)

    // Hydratation asynchrone: recharge un produit complet (images, stock, etc.).
    void (async () => {
      let fullProduct = product
      try {
        const resp = await fetch(`/api/public/products?id=${encodeURIComponent(pid)}`, { method: 'GET', cache: 'no-store' }).catch(() => null)
        const json = await resp?.json().catch(() => null)
        const data = json?.data

        if (data) {
        const toBoolean = (value: any): boolean => {
          if (typeof value === 'boolean') return value
          if (typeof value === 'number') return value !== 0
          if (typeof value === 'string') {
            const v = value.trim().toLowerCase()
            if (v === 'true' || v === 't' || v === '1' || v === 'yes') return true
            if (v === 'false' || v === 'f' || v === '0' || v === 'no') return false
          }
          return Boolean(value)
        }

        const toOptionalNumber = (value: any): number | null => {
          if (value === null || value === undefined) return null
          if (typeof value === 'number') return Number.isFinite(value) ? value : null
          if (typeof value === 'string') {
            const trimmed = value.trim()
            if (!trimmed) return null
            const normalized = trimmed.replace(',', '.')
            const direct = Number(normalized)
            if (Number.isFinite(direct)) return direct
            const match = normalized.match(/-?\d+(?:\.\d+)?/)
            if (!match) return null
            const extracted = Number(match[0])
            return Number.isFinite(extracted) ? extracted : null
          }
          const n = Number(value)
          return Number.isFinite(n) ? n : null
        }

        const images = [
          String(data?.media?.main_image ?? ''),
          ...(Array.isArray(data?.media?.images) ? data.media.images : [])
        ]
          .map((x: any) => String(x ?? '').trim())
          .filter((x: string) => x.length > 0)

        const regularPrice = Number(data?.price ?? 0) || 0
        const salePriceRaw = data?.sale_price
        const salePrice = salePriceRaw === null || salePriceRaw === undefined ? null : (Number(salePriceRaw) || null)
        const effectivePrice = (typeof salePrice === 'number' && Number.isFinite(salePrice) && salePrice > 0) ? salePrice : regularPrice
        const originalPrice = regularPrice
        const discount =
          originalPrice > 0 && typeof salePrice === 'number' && Number.isFinite(salePrice) && salePrice > 0 && salePrice < originalPrice
            ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
            : 0

        const manageStock = toBoolean(data?.stock?.manage_stock ?? data?.manage_stock ?? data?.stockQuantity)
        const stockQty = toOptionalNumber(data?.stock?.stock_quantity ?? data?.stock_quantity ?? data?.stockQuantity)
        const hasFiniteStockQty = typeof stockQty === 'number' && Number.isFinite(stockQty)
        const inStock = manageStock ? (hasFiniteStockQty ? (stockQty as number) > 0 : true) : true

        fullProduct = {
          id: String(data?.id ?? pid),
          name: String(data?.name ?? product?.name ?? 'Produit'),
          price: regularPrice,
          salePrice,
          pointsPrice: convertPriceToPoints(effectivePrice),
          originalPrice,
          rating: 0,
          reviews: 0,
          images: images.length > 0 ? images : [String(product?.image ?? '/placeholder.svg')],
          image: String(images[0] ?? product?.image ?? '/placeholder.svg'),
          seller: {
            id: typeof data?.vendor_id === 'string' ? data.vendor_id : undefined,
            name: 'Vendeur',
            avatar: '/placeholder-user.jpg',
            rating: 0,
            totalSales: 0,
            responseTime: '',
            location: '',
            phone: '',
            email: '',
            joinDate: '',
            memberSince: '',
            logo: ''
          },
          description: typeof data?.description === 'string' ? data.description : '',
          specifications: {},
          features: [],
          warranty: '',
          shipping: {
            cost: Number(data?.shipping?.shipping_cost ?? 0) || 0,
            time: '',
            method: ''
          },
          stock: hasFiniteStockQty ? (stockQty as number) : (inStock ? 1 : 0),
          sharePoints: defaultSharePoints,
          shares: 0,
          inStock,
          discount,
          isHot: false,
          isNew: false,
          isLimited: false,
          badges: [],
          color: 'black',
          category: '',
          tags: [],
          relatedProducts: []
        }
        }
      } catch {
        fullProduct = product
      }

      setSelectedProduct((prev: any) => {
        const prevId = String(prev?.id ?? '').trim()
        if (!prev || prevId !== pid) return prev
        return fullProduct
      })
    })()
  }

  /**
   * Résout l'ID vendeur réel (UUID Supabase) d'un produit.
   */
  const resolveVendorIdForProduct = async (product: any): Promise<string> => {
    const direct = String(product?.vendorId ?? product?.vendor_id ?? '').trim()
    if (direct) return direct

    try {
      const res = await fetch(`/api/public/products?id=${encodeURIComponent(String(product?.id ?? ''))}`, {
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
   * Démarre une conversation réelle Client ↔ Vendeur (basée sur vendor_id UUID).
   */
  const handleStartChat = async (product: any) => {
    if (!requireAuth('Connectez-vous pour écrire au vendeur.')) {
      return
    }
    const vendorId = await resolveVendorIdForProduct(product)

    if (!vendorId) {
      toast({
        title: 'Chat indisponible',
        description: "Impossible d'identifier le vendeur de ce produit.",
        variant: 'destructive'
      })
      return
    }

    // Ouvrir le modal chat avec les informations du vendeur et du produit
    setChatSellerId(vendorId)
    setChatSellerName(product?.seller || 'Vendeur Probooster')
    setChatSellerAvatar('/placeholder-user.jpg')
    setSelectedProduct(product)
    setShowChatModal(true)
    console.log('💬 Chat démarré pour le produit:', product?.name, 'avec vendorId:', vendorId)
  }

  const handlePointsPurchase = (product: any, usePoints: boolean, pointsToUse: number) => {
    // Simulation d'un achat avec points
    console.log(`Achat du produit ${product.name} avec ${pointsToUse} points`)
    
    // Ici vous pouvez ajouter la logique d'achat réelle
    // Par exemple, appeler une API pour traiter l'achat
    
    // Afficher une notification de succès
    addNotification({ 
      type: 'success', 
      title: 'Achat confirmé', 
      message: `Achat confirmé ! ${product.name} acheté avec ${pointsToUse} points` 
    })
    
    // Fermer le modal
    setIsPointsModalOpen(false)
    setSelectedProductForPoints(null)
  }

  const openPointsModal = (product: any) => {
    if (!requireAuth('Connectez-vous pour passer une commande.')) {
      return
    }
    setSelectedProductForPoints(product)
    setIsPointsModalOpen(true)
  }

  /**
   * Ouvre le modal "Promos actives".
   */
  const openPromosModal = () => {
    setIsPromosModalOpen(true)
  }

  const handleCompare = (product: any) => {
    if (!requireAuth('Connectez-vous pour comparer des produits.')) {
      return
    }
    // Utiliser le système de comparaison du header via localStorage
    if (!isClient) return
    
    try {
      const compareList = JSON.parse(localStorage.getItem('compareList') || '[]')
      
      // Fonction pour détecter si deux produits sont similaires ou partagent des intérêts communs
      const areProductsSimilar = (product1: any, product2: any): boolean => {
        if (product1.id === product2.id) return false
        
        const name1 = product1.name.toLowerCase()
        const name2 = product2.name.toLowerCase()
        
        // 1. Même marque (Apple, Samsung, Sony, etc.)
        const brands = ['apple', 'iphone', 'ipad', 'macbook', 'samsung', 'galaxy', 'sony', 'playstation', 'nike', 'adidas', 'jordan']
        const brand1 = brands.find(brand => name1.includes(brand))
        const brand2 = brands.find(brand => name2.includes(brand))
        
        if (brand1 && brand2 && brand1 === brand2) {
          return true
        }
        
        // 2. Même catégorie principale (smartphones, laptops, gaming, audio, etc.)
        const categories = {
          smartphones: ['iphone', 'galaxy', 'smartphone', 'mobile', 'phone'],
          laptops: ['macbook', 'laptop', 'ordinateur', 'computer', 'pc'],
          tablets: ['ipad', 'tablet', 'tablette'],
          audio: ['airpods', 'casque', 'headphone', 'écouteur', 'speaker'],
          gaming: ['playstation', 'xbox', 'nintendo', 'gaming', 'console'],
          watches: ['watch', 'montre', 'smartwatch'],
          sneakers: ['jordan', 'nike', 'adidas', 'sneaker', 'chaussure']
        }
        
        const category1 = Object.keys(categories).find(cat => 
          categories[cat as keyof typeof categories].some(keyword => name1.includes(keyword))
        )
        const category2 = Object.keys(categories).find(cat => 
          categories[cat as keyof typeof categories].some(keyword => name2.includes(keyword))
        )
        
        if (category1 && category2 && category1 === category2) {
          return true
        }
        
        // 3. Même domaine d'intérêt (tech, sport, mode, etc.)
        const domains = {
          tech: ['iphone', 'galaxy', 'macbook', 'ipad', 'airpods', 'watch', 'playstation', 'xbox'],
          sport: ['nike', 'adidas', 'jordan', 'sneaker', 'chaussure'],
          audio: ['airpods', 'casque', 'headphone', 'écouteur', 'speaker'],
          gaming: ['playstation', 'xbox', 'nintendo', 'gaming', 'console']
        }
        
        const domain1 = Object.keys(domains).find(domain => 
          domains[domain as keyof typeof domains].some(keyword => name1.includes(keyword))
        )
        const domain2 = Object.keys(domains).find(domain => 
          domains[domain as keyof typeof domains].some(keyword => name2.includes(keyword))
        )
        
        if (domain1 && domain2 && domain1 === domain2) {
          return true
        }
        
        // 4. Même gamme de prix (approximative) - seulement si les produits ont des prix
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
  title: 'Produit ajouté à la comparaison', 
          message: `${product.name} a été ajouté à votre liste de comparaison` 
})
      } else {
                  addNotification({
            type: 'warning',
            title: 'Impossible d\'ajouter à la comparaison',
            message: reason || 'Impossible d\'ajouter ce produit à la comparaison'
          })
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout à la comparaison:', error)
              addNotification({
          type: 'error',
          title: 'Erreur de comparaison',
          message: 'Impossible d\'ajouter le produit à la comparaison'
        })
    }
  }

  // Effet pour le timer d'urgence
  useEffect(() => {
    const timer = setInterval(() => {
      setUrgencyTimer((prev) => {
        if (prev <= 1) {
          const recalculated = computeSecondsUntil(flashEndsAtIso)
          if (recalculated > 0) {
            setShowUrgency(true)
            return recalculated
          }
          setShowUrgency(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [flashEndsAtIso])

  // Effet pour marquer le composant comme monté côté client
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Fonction pour formater le timer
  const formatTime = (seconds: number) => {
    const safe = Number(seconds)
    if (!Number.isFinite(safe) || safe <= 0) return '0s'

    let remaining = Math.floor(safe)

    const yearSec = 365 * 24 * 3600
    const monthSec = 30 * 24 * 3600
    const daySec = 24 * 3600
    const hourSec = 3600
    const minuteSec = 60

    const years = Math.floor(remaining / yearSec)
    remaining -= years * yearSec
    const months = Math.floor(remaining / monthSec)
    remaining -= months * monthSec
    const days = Math.floor(remaining / daySec)
    remaining -= days * daySec
    const hours = Math.floor(remaining / hourSec)
    remaining -= hours * hourSec
    const minutes = Math.floor(remaining / minuteSec)
    remaining -= minutes * minuteSec
    const secs = remaining

    const parts: string[] = []
    if (years > 0) parts.push(`${years}a`)
    if (months > 0) parts.push(`${months}mo`)
    if (days > 0) parts.push(`${days}j`)

    if (parts.length > 0) {
      parts.push(`${String(hours).padStart(2, '0')}h`)
      parts.push(`${String(minutes).padStart(2, '0')}m`)
      parts.push(`${String(secs).padStart(2, '0')}s`)
      return parts.join(' ')
    }

    if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`
    if (minutes > 0) return `${minutes}m ${String(secs).padStart(2, '0')}s`
    return `${secs}s`
  }

  // Fonction pour déclencher l'alerte de stock
  const triggerStockAlert = (product: any) => {
    setStockAlertProduct(product)
    setShowStockAlert(true)
    setTimeout(() => setShowStockAlert(false), 5000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Container des notifications modernes */}
      <NotificationContainer />

      <ShareConfirmModal
        open={confirmOpen}
        platform={(confirmPlatform || 'copy') as any}
        points={confirmPoints}
        onOpenChange={(next) => {
          if (!next) {
            setConfirmOpen(false)
            pendingShareRef.current = null
          }
        }}
        onEarnPoints={() => {
          const pending = pendingShareRef.current
          setConfirmOpen(false)
          pendingShareRef.current = null
          if (!pending) return
          const product = productsForDisplay.find((p) => p.id === pending.productId)
          if (!product) return
          void (async () => {
            await pending.openWindow()
            await runShare(product, pending.productId, pending.platform, pending.shareUrl, true)
          })()
        }}
        onShareNoPoints={() => {
          const pending = pendingShareRef.current
          setConfirmOpen(false)
          pendingShareRef.current = null
          if (!pending) return
          const product = productsForDisplay.find((p) => p.id === pending.productId)
          if (!product) return
          void (async () => {
            await pending.openWindow()
            await runShare(product, pending.productId, pending.platform, pending.shareUrl, false)
          })()
        }}
      />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <EditableMessagesBanner location="catalog" />
        </div>
        {/* Enhanced Header */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#ff6600] to-[#ff8533] text-white px-6 py-3 rounded-full mb-4 animate-pulse">
              <Sparkles className="h-5 w-5 animate-spin" />
              <span className="font-semibold">PROBOOSTER</span>
              <TrendingUp className="h-5 w-5 animate-bounce" />
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-gray-900 via-[#ff6600] to-gray-900 bg-clip-text text-transparent">
              Découvrez Nos Produits
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Explorez notre collection exclusive de produits innovants avec des points et des récompenses uniques
            </p>
          </div>

                  {/* Triggers d'incitation à l'achat */}
        {isClient && showUrgency && (
          <div className="bg-gradient-to-r from-red-500 via-orange-500 to-red-600 text-white p-4 rounded-2xl shadow-xl mb-6 animate-pulse border-2 border-red-400">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Flame className="h-6 w-6 animate-bounce" />
                <div>
                  <h3 className="font-bold text-lg">🔥 OFFRE FLASH ! 🔥</h3>
                  <p className="text-sm opacity-90">Profitez de nos réductions exceptionnelles !</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  openPromosModal()
                }}
                className="hidden md:flex items-center space-x-3 rounded-lg transition-all duration-300"
              >
                <span className="text-sm font-semibold opacity-95">Promos actives :</span>
                <span
                  className={`text-white font-bold px-3 py-1 rounded-lg transition-all duration-300 ${
                    showOnlySpecialOffers ? 'bg-white/35 ring-2 ring-white/70' : 'bg-white/20 hover:bg-white/30'
                  }`}
                >
                  {specialPromotions.length}
                </span>
              </button>
              <div className="text-center">
                <div className="text-2xl font-bold bg-white text-red-600 px-4 py-2 rounded-lg animate-pulse">
                  {formatTime(urgencyTimer)}
                </div>
                <p className="text-xs mt-1">Temps restant</p>
              </div>
            </div>
            <div className="mt-2 md:hidden flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  openPromosModal()
                }}
                className="flex items-center justify-between w-full rounded-lg transition-all duration-300"
              >
                <span className="text-sm font-semibold opacity-95">Promos actives :</span>
                <span
                  className={`text-white font-bold px-3 py-1 rounded-lg transition-all duration-300 ${
                    showOnlySpecialOffers ? 'bg-white/35 ring-2 ring-white/70' : 'bg-white/20 hover:bg-white/30'
                  }`}
                >
                  {specialPromotions.length}
                </span>
              </button>
            </div>
          </div>
        )}



        {/* Enhanced Search and Filters */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-100">
            <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
              <div className="flex-1 max-w-lg">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 group-hover:text-[#ff6600] transition-colors duration-300" />
                <Input
                  type="search"
                    placeholder="Rechercher des produits magiques..."
                    className="pl-12 pr-4 py-3 text-lg border-2 border-gray-200 focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/20 rounded-xl transition-all duration-300"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                  <SelectTrigger className="w-48 border-2 border-gray-200 focus:border-[#ff6600] rounded-xl">
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="popular">🔥 Plus populaire</SelectItem>
                    <SelectItem value="price-low">💰 Prix croissant</SelectItem>
                    <SelectItem value="price-high">💎 Prix décroissant</SelectItem>
                    <SelectItem value="rating">⭐ Mieux notés</SelectItem>
                    <SelectItem value="newest">🆕 Plus récents</SelectItem>
                </SelectContent>
              </Select>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowOnlySpecialOffers((prev) => !prev)}
                  className="border-2 border-gray-200 hover:border-[#ff6600] hover:bg-[#ff6600] hover:text-white rounded-xl transition-all duration-300 group"
                >
                  <Filter className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
              </Button>

                <div className="flex border-2 border-gray-200 rounded-xl overflow-hidden">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                    className={`rounded-r-none ${viewMode === "grid" ? "bg-[#ff6600] text-white" : "hover:bg-gray-100"}`}
                >
                    <Grid className="h-5 w-5" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                    className={`rounded-l-none ${viewMode === "list" ? "bg-[#ff6600] text-white" : "hover:bg-gray-100"}`}
                >
                    <List className="h-5 w-5" />
                </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Produits Totaux</p>
                <p className="text-3xl font-bold">{stats.totalProducts.toLocaleString()}</p>
              </div>
              <ShoppingBag className="h-8 w-8 animate-pulse" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Points Gagnés</p>
                <p className="text-3xl font-bold">{stats.pointsEarned.toLocaleString()}</p>
              </div>
              <Coins className="h-8 w-8 animate-bounce" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Vendeurs Actifs</p>
                <p className="text-3xl font-bold">{stats.activeVendors.toLocaleString()}</p>
              </div>
              <Users className="h-8 w-8 animate-pulse" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Économies</p>
                <p className="text-3xl font-bold">{stats.savingsPercent}%</p>
              </div>
              <Award className="h-8 w-8 animate-bounce" />
            </div>
          </div>
        </div>

        {/* Enhanced Products Grid */}
        <div
          className={`grid gap-8 ${
            viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
          }`}
        >
          {filteredProductsForDisplay.map((product) => (
            <Card 
              key={product.id} 
              className="group hover:shadow-2xl transition-all duration-500 overflow-hidden border-0 bg-white rounded-2xl transform hover:scale-105 hover:-translate-y-2 cursor-pointer"
              onClick={() => {
                console.log('🛍️ Clic sur la carte produit:', product.name)
                handleProductClick(product)
              }}
            >
              <div className="relative overflow-hidden">
                <div 
                  className="w-full h-56 cursor-pointer relative overflow-hidden"
                  onClick={() => {
                    console.log('🖱️ Clic sur l\'image du produit:', product.name)
                    handleProductClick(product)
                  }}
                >
                  <img
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                </div>

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
                  
                  {/* Triggers d'incitation supplémentaires */}
                  {isClient && product.inStock && (
                    <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 animate-pulse shadow-lg">
                      <Target className="h-3 w-3 mr-1 animate-bounce" />
                      POPULAIRE
                    </Badge>
                  )}
                  
                  {product.discount > 15 && (
                    <Badge className="bg-gradient-to-r from-pink-500 to-red-500 text-white border-0 animate-pulse shadow-lg">
                      <Crown className="h-3 w-3 mr-1 animate-pulse" />
                      MEILLEUR PRIX
                    </Badge>
                  )}
                </div>

                {/* Animated Discount Badge */}
                {product.discount > 0 && (
                  <Badge className="absolute top-3 right-3 bg-gradient-to-r from-[#ff6600] to-[#ff8533] text-white border-0 animate-bounce shadow-lg">
                    -{product.discount}%
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
                {isClient && product.inStock && typeof product.stockQuantity === 'number' && Number.isFinite(product.stockQuantity) && (
                  <div className="absolute bottom-3 left-3 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse shadow-lg">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>Seulement {Math.max(0, product.stockQuantity)} restants !</span>
                    </div>
                  </div>
                )}
                


                {/* Floating Action Buttons - Positionnés en dessous du badge de réduction */}
                <div className="absolute top-12 right-3 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0">
                  {/* Bouton Favori */}
                  {isClient && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`${isInWishlist(product.id) ? 'bg-red-50 hover:bg-red-100' : 'bg-white/90 hover:bg-white'} shadow-lg rounded-full h-9 w-9 transition-all duration-300 relative overflow-hidden group`}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleWishlist(product.id)
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
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAddToCart(product.id)
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
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCompare(product)
                    }}
                  >
                    {/* Effet de particules */}
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-purple-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <div className="absolute bottom-1/4 right-1/4 w-1 h-1 bg-violet-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ animationDelay: '0.3s' }}></div>
                    </div>
                    
                    <svg className="h-4 w-4 text-purple-600 hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </Button>
                  
                  {/* Bouton Message */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-white/90 hover:bg-white shadow-lg rounded-full h-9 w-9 transition-all duration-300 relative overflow-hidden group"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStartChat(product)
                    }}
                  >
                    {/* Effet de particules */}
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-blue-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <div className="absolute bottom-1/4 right-1/4 w-1 h-1 bg-cyan-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ animationDelay: '0.3s' }}></div>
                    </div>
                    
                    <MessageCircle className="h-4 w-4 text-blue-500 hover:scale-110 transition-transform duration-300" />
                    
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
                  {false}
                  
                  <div 
                    className="font-bold text-xl line-clamp-2 group-hover:text-[#ff6600] transition-colors duration-300 cursor-pointer"
                    onClick={() => {
                      console.log('🖱️ Clic sur le nom du produit:', product.name)
                      handleProductClick(product)
                    }}
                  >
                    {product.name}
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor(product.rating) ? "text-yellow-400 fill-current" : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      {product.rating} ({product.reviews})
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl font-bold text-[#ff6600]">
                        {(typeof product.salePrice === 'number' && Number.isFinite(product.salePrice) && product.salePrice > 0
                          ? product.salePrice
                          : product.price
                        ).toLocaleString()} F CFA
                      </span>
                      {typeof product.salePrice === 'number' &&
                        Number.isFinite(product.salePrice) &&
                        product.salePrice > 0 &&
                        product.salePrice < product.price && (
                          <span className="text-sm text-gray-500 line-through">
                            {product.price.toLocaleString()} F CFA
                          </span>
                        )}
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm">
                      <Coins className="h-4 w-4 text-yellow-500 animate-pulse" />
                      <span className="font-semibold text-gray-700">
                        {product.pointsPrice} points
                      </span>
                    </div>
                  </div>

                  <ProductSellerLine
                    vendorId={product.vendorId ?? null}
                    sellerName={product.seller || 'Vendeur Probooster'}
                  />

                  {/* Enhanced Share Info */}
                  <div className="bg-gradient-to-r from-[#ff6600]/10 to-[#ff8533]/10 p-3 rounded-xl border border-[#ff6600]/20">
                  <div className="flex items-center justify-between text-sm">
                      <span className="text-[#ff6600] font-semibold flex items-center">
                        <Gift className="h-4 w-4 mr-1 animate-bounce" />
                        +{defaultSharePoints} points par partage
                      </span>
                      <span className="text-gray-600 flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {product.shares} partages
                      </span>
                    </div>
                  </div>
                  
                  {/* Triggers d'incitation supplémentaires */}
                  {product.discount > 10 && (
                    <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 p-3 rounded-xl border border-green-500/20">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-green-600 font-semibold flex items-center">
                          <Award className="h-4 w-4 mr-1 animate-pulse" />
                          Économisez {product.discount}% aujourd'hui !
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
                        {product.rating}/5 ({product.reviews} avis)
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
                                            onClick={(e) => {
                          e.stopPropagation()
                          handleAddToCart(product.id)
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

                  <DropdownMenu
                    open={Boolean(openShareMenuByProductId[String(product.id)])}
                    onOpenChange={(nextOpen) => {
                      const pid = String(product.id)
                      const allowed = shouldOpenProtectedShareDropdown(nextOpen, requireAuth)
                      setOpenShareMenuByProductId((prev) => ({ ...prev, [pid]: allowed }))

                      if (allowed) {
                        const platforms = ['facebook', 'whatsapp', 'twitter', 'instagram']
                        for (const platform of platforms) {
                          void ShareEngagementService.prefetchShareEligibility(String(pid), String(platform))
                        }
                      }
                    }}
                  >
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
                        <DropdownMenuItem
                          disabled={Boolean(sharingPlatform)}
                          onClick={(e) => {
                          e.stopPropagation()
                          handleShare(product.id, "facebook")
                        }}
                          className="flex items-center space-x-3 p-3 hover:bg-blue-50 rounded-lg transition-all duration-300 group relative overflow-hidden"
                        >
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
                              <span className="text-sm text-gray-500">+{resolveSharePoints('facebook', defaultSharePoints)} points</span>
                              <div className="flex space-x-1">
                                <div className="w-1 h-1 bg-yellow-400 rounded-full animate-pulse"></div>
                                <div className="w-1 h-1 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                                <div className="w-1 h-1 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Indicateur de bonus */}
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full animate-pulse">
                            🔥
                          </span>
                      </DropdownMenuItem>
                        
                        <DropdownMenuItem
                          disabled={Boolean(sharingPlatform)}
                          onClick={(e) => {
                          e.stopPropagation()
                          handleShare(product.id, "whatsapp")
                        }}
                          className="flex items-center space-x-3 p-3 hover:bg-green-50 rounded-lg transition-all duration-300 group relative overflow-hidden"
                        >
                          {/* Effet de particules */}
                          <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-green-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="absolute bottom-1/4 right-1/4 w-1 h-1 bg-green-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ animationDelay: '0.3s' }}></div>
                          </div>
                          
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.815 0 0020.885 3.488"/>
                            </svg>
                          </div>
                          <div className="flex-1">
                            <span className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors duration-300">WhatsApp</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-500">+{resolveSharePoints('whatsapp', defaultSharePoints)} points</span>
                              <div className="flex space-x-1">
                                <div className="w-1 h-1 bg-yellow-400 rounded-full animate-pulse"></div>
                                <div className="w-1 h-1 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                                <div className="w-1 h-1 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Indicateur de bonus */}
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full animate-pulse">
                            ⚡
                          </span>
                      </DropdownMenuItem>
                        
                        <DropdownMenuItem
                          disabled={Boolean(sharingPlatform)}
                          onClick={(e) => {
                          e.stopPropagation()
                          handleShare(product.id, "twitter")
                        }}
                          className="flex items-center space-x-3 p-3 hover:bg-blue-50 rounded-lg transition-all duration-300 group relative overflow-hidden"
                        >
                          {/* Effet de particules */}
                          <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-blue-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="absolute bottom-1/4 right-1/4 w-1 h-1 bg-blue-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ animationDelay: '0.3s' }}></div>
                          </div>
                          
                          <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                            </svg>
                          </div>
                          <div className="flex-1">
                            <span className="font-semibold text-gray-900 group-hover:text-blue-400 transition-colors duration-300">Twitter</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-500">+{resolveSharePoints('twitter', defaultSharePoints)} points</span>
                              <div className="flex space-x-1">
                                <div className="w-1 h-1 bg-yellow-400 rounded-full animate-pulse"></div>
                                <div className="w-1 h-1 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                                <div className="w-1 h-1 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Indicateur de bonus */}
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full animate-pulse">
                            🚀
                          </span>
                      </DropdownMenuItem>
                        
                        <DropdownMenuItem
                          disabled={Boolean(sharingPlatform)}
                          onClick={(e) => {
                          e.stopPropagation()
                          handleShare(product.id, "instagram")
                        }}
                          className="flex items-center space-x-3 p-3 hover:bg-pink-50 rounded-lg transition-all duration-300 group relative overflow-hidden"
                        >
                          {/* Effet de particules */}
                          <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-pink-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="absolute bottom-1/4 right-1/4 w-1 h-1 bg-purple-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ animationDelay: '0.3s' }}></div>
                          </div>
                          
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323c-.875.807-2.026 1.297-3.323 1.297zm7.718-1.297c-.875.807-2.026 1.297-3.323 1.297s-2.448-.49-3.323-1.297c-.807-.875-1.297-2.026-1.297-3.323s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323z"/>
                            </svg>
                          </div>
                          <div className="flex-1">
                            <span className="font-semibold text-gray-900 group-hover:text-pink-500 transition-colors duration-300">Instagram</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-500">+{resolveSharePoints('instagram', defaultSharePoints)} points</span>
                              <div className="flex space-x-1">
                                <div className="w-1 h-1 bg-yellow-400 rounded-full animate-pulse"></div>
                                <div className="w-1 h-1 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                                <div className="w-1 h-1 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Indicateur de bonus */}
                          <span className="text-xs bg-pink-100 text-pink-800 px-2 py-1 rounded-full animate-pulse">
                            ✨
                          </span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                  <div className="w-full">
                    <Button 
                      variant="outline" 
                      className={`w-full border-2 rounded-xl transition-all duration-300 transform relative overflow-hidden group px-6 py-4 ${
                        product.inStock 
                          ? 'bg-gradient-to-r from-gray-50 to-gray-100 hover:from-[#ff6600]/10 hover:to-[#ff8533]/10 border-gray-200 hover:border-[#ff6600] text-gray-700 hover:text-[#ff6600] hover:scale-105' 
                          : 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed opacity-60'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (product.inStock) {
                          openPointsModal(product)
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
                      
                      {product.inStock ? (
                        <div className="flex flex-col items-center justify-center w-full text-center leading-tight">
                          <div className="flex items-center justify-center gap-2 whitespace-nowrap overflow-visible">
                            <Coins className="h-5 w-5 flex-shrink-0 animate-pulse text-yellow-600" />
                            <span className="text-sm font-semibold">Acheter avec points</span>
                          </div>
                          <div className="text-xs font-semibold text-gray-700">({product.pointsPrice} pts)</div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center w-full text-center">
                          <Coins className="h-5 w-5 flex-shrink-0 text-gray-400 mr-2" />
                          <span className="text-sm font-semibold">Indisponible</span>
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>

        

        {/* Enhanced Load More */}
        <div className="text-center mt-16">
          <div className="mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-2xl shadow-xl inline-block animate-pulse">
              <div className="flex items-center space-x-3">
                <Sparkles className="h-6 w-6 animate-spin" />
                <span className="font-bold">🎉 Découvrez encore plus de produits incroyables !</span>
                <Sparkles className="h-6 w-6 animate-spin" />
              </div>
            </div>
          </div>
          
          {hasMoreProducts && (
            <Button 
              variant="outline" 
              size="lg" 
              className="bg-gradient-to-r from-[#ff6600] to-[#ff8533] hover:from-[#e55a00] hover:to-[#ff6600] text-white border-0 shadow-lg px-8 py-4 text-lg rounded-2xl transform hover:scale-105 transition-all duration-300 relative overflow-hidden group"
              onClick={() => {
                void loadMoreProducts()
              }}
              disabled={isLoadingMore}
            >
              {/* Effet de brillance */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              <Rocket className="h-5 w-5 mr-2 animate-bounce" />
              {isLoadingMore ? 'Chargement...' : 'Charger plus de produits'}
              <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
              
              {/* Indicateur de nouveauté */}
              <span className="ml-2 text-xs bg-white/20 px-2 py-1 rounded-full animate-pulse">
                ✨ NOUVEAU
              </span>
            </Button>
          )}
        </div>

        {/* Product Modal */}
        <ProductModal
          product={selectedProduct}
          isOpen={isModalOpen}
          onClose={() => {
            console.log('🔧 Fermeture du modal')
            setIsModalOpen(false)
          }}
        />
        
        {/* Modal de Test Simple */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
              <h2 className="text-xl font-bold mb-4">Modal de Test</h2>
              <p className="mb-4">Produit sélectionné: {selectedProduct?.name || 'Aucun'}</p>
              <p className="mb-4">Modal ouvert: {isModalOpen ? 'Oui' : 'Non'}</p>
              <Button 
                onClick={() => {
                  console.log('🔧 Fermeture du modal de test')
                  setIsModalOpen(false)
                }}
                className="w-full"
              >
                Fermer
              </Button>
            </div>
          </div>
        )}
        
        {/* Chat Global - Remplacé par le nouveau système */}
        {/* Le chat est maintenant géré par le système global synchronisé */}
        {/* Utilisez le bouton flottant orange en bas à droite pour accéder au chat */}

        {/* Points Purchase Modal */}
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

        {/* Modal Chat */}
        <LegacyChatModal
          isOpen={showChatModal}
          onClose={() => setShowChatModal(false)}
          sellerId={chatSellerId}
          sellerName={chatSellerName}
          sellerAvatar={chatSellerAvatar}
        />

        {/* Modal Promos actives */}
        {isPromosModalOpen && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setIsPromosModalOpen(false)}
          >
            <div
              className="bg-white p-6 rounded-2xl max-w-lg w-full mx-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Promos actives</h2>
                  <p className="text-sm text-gray-600">
                    {specialPromotions.length} promotion(s) • {specialOffers.length} offre(s)
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setIsPromosModalOpen(false)}
                  className="shrink-0"
                >
                  Fermer
                </Button>
              </div>

              <div className="mb-4">
                <div className="text-sm font-semibold text-gray-900 mb-2">Produits en promo</div>
                {specialOffers.length === 0 ? (
                  <div className="text-sm text-gray-600">Aucun produit en promo pour le moment.</div>
                ) : (
                  <div className="space-y-3 max-h-[35vh] overflow-auto pr-1">
                    {specialOffers.slice(0, 20).map((offer) => {
                      const pid = String((offer as any)?.product?.id ?? '').trim()
                      const product = productsForDisplay.find((p: any) => String(p?.id ?? '').trim() === pid)
                      const name = String(product?.name ?? 'Produit')
                      const image = String(product?.image ?? '/placeholder.svg')
                      const discounted = Number((offer as any)?.discountedPrice ?? 0) || 0
                      const original = Number((offer as any)?.originalPrice ?? 0) || 0
                      const inStock = Boolean(product?.inStock ?? true)

                      return (
                        <div key={pid || Math.random()} className="border border-gray-200 rounded-xl p-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={image}
                              alt={name}
                              className="h-12 w-12 rounded-lg object-cover border border-gray-100"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-900 truncate">{name}</div>
                              <div className="text-sm mt-1">
                                <span className="font-bold text-[#ff6600]">{discounted.toLocaleString()} F</span>
                                {original > discounted && original > 0 ? (
                                  <span className="ml-2 text-gray-500 line-through">{original.toLocaleString()} F</span>
                                ) : null}
                              </div>
                            </div>
                            <Button
                              onClick={() => {
                                if (!pid) return
                                if (product) {
                                  handleAddToCart(pid)
                                } else {
                                  // Si le produit n'est pas dans la liste courante, on applique le filtre pour le faire apparaître.
                                  setShowOnlySpecialOffers(true)
                                }
                              }}
                              disabled={!inStock}
                              className="bg-[#ff6600] hover:bg-orange-600 text-white"
                            >
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              Panier
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-3 max-h-[50vh] overflow-auto pr-1">
                {specialPromotions.length === 0 ? (
                  <div className="text-sm text-gray-600">Aucune promotion active pour le moment.</div>
                ) : (
                  specialPromotions.map((p) => (
                    <div key={p.id} className="border border-gray-200 rounded-xl p-3">
                      <div className="font-semibold text-gray-900">{String(p.title ?? 'Promotion')}</div>
                      {p.description ? (
                        <div className="text-sm text-gray-600 mt-1">{String(p.description)}</div>
                      ) : null}
                      <div className="text-xs text-gray-500 mt-2">
                        {p.start_date ? `Début: ${String(p.start_date)}` : ''}
                        {p.start_date && p.end_date ? ' • ' : ''}
                        {p.end_date ? `Fin: ${String(p.end_date)}` : ''}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-5 flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => {
                    setShowOnlySpecialOffers((prev) => !prev)
                  }}
                  className="w-full bg-[#ff6600] hover:bg-orange-600"
                >
                  {showOnlySpecialOffers ? 'Afficher tous les produits' : 'Afficher uniquement les produits en promo'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowOnlySpecialOffers(true)
                    setIsPromosModalOpen(false)
                  }}
                  className="w-full"
                >
                  Appliquer et fermer
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
