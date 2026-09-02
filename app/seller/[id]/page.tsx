"use client"

import { useMemo, useState, useEffect, useCallback, useRef, use } from "react"
import { useCart } from "@/hooks/use-cart"
import { useWishlist } from "@/hooks/use-wishlist"
import { useNotifications } from "@/components/ui/modern-notification"
import { 
  ArrowLeft, 
  Star, 
  ShoppingCart, 
  Heart, 
  MessageCircle, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Truck, 
  Shield, 
  Award, 
  TrendingUp, 
  Users, 
  Package,
  Filter,
  Search,
  Grid,
  List,
  Eye,
  EyeOff,
  Flame,
  Sparkles,
  Target,
  Crown,
  Coins,
  Gift,
  Zap,
  Share2,
  BarChart3
} from "lucide-react"
import { FaWhatsapp, FaFacebook, FaXTwitter, FaInstagram, FaLinkedin, FaTiktok } from 'react-icons/fa6'
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useChatContext } from "@/lib/chat-context-supabase"
import { LegacyChatModal } from "@/components/chat/LegacyChatModal"
import ProductModal from "@/components/product/product-modal"
import PointsPurchaseModal from "@/components/product/points-purchase-modal"
import { ShareEngagementService } from "@/lib/services/share-engagement-service"
import { useClientPoints } from "@/lib/hooks/use-client-points"
import { useToast } from "@/hooks/use-toast"
// Import supprimé - remplacé par le nouveau système de chat global
import { useVendorPresence } from "@/lib/hooks/use-vendor-presence"
import { useVendorSummary } from "@/lib/hooks/use-vendor-summary"
import { useAuth } from "@/contexts/AuthContext"
import { useAuthGuard } from "@/lib/hooks/use-auth-guard"
import { buildViewDedupeKey, trackAutomationEvent } from "@/lib/client-automation-events"

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * Normalise une valeur en slug comparable (minuscules, tirets, sans accents).
 */
function toComparableSlug(value: string): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Construit une URL vendeur propre basée sur le slug du nom.
 */
function buildSellerHref(name: string): string {
  const slug = toComparableSlug(name)
  return `/seller/${slug || 'boutique'}`
}

/**
 * Construit des initiales à partir d'un nom.
 */
function buildInitials(name: string): string {
  const parts = String(name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
  return parts.map((p) => p.slice(0, 1).toUpperCase()).join('') || 'VP'
}

/**
 * Construit un libellé "membre depuis" à partir d'une date ISO.
 */
function buildMemberSinceLabel(isoDate: string | null): { joinDate: string; memberSince: string } {
  if (!isoDate) return { joinDate: '', memberSince: '' }
  const d = new Date(isoDate)
  if (Number.isNaN(d.getTime())) return { joinDate: '', memberSince: '' }

  const now = new Date()
  const joinDate = String(d.getFullYear())

  // Différence calendaire (mois complets)
  // Exemple: 31/10 -> 14/02 = 3 mois complets (31/10->31/01) + 14 jours, donc "3 mois".
  let totalMonths = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth())
  if (now.getDate() < d.getDate()) totalMonths -= 1
  if (!Number.isFinite(totalMonths) || totalMonths < 0) totalMonths = 0

  const years = Math.floor(totalMonths / 12)
  const months = totalMonths % 12

  if (years >= 2) return { joinDate, memberSince: `${years} ans` }
  if (years === 1) return { joinDate, memberSince: `1 an` }
  if (months >= 2) return { joinDate, memberSince: `${months} mois` }
  if (months === 1) return { joinDate, memberSince: `1 mois` }
  return { joinDate, memberSince: `Nouveau` }
}

interface Product {
  id: string
  name: string
  price: number
  originalPrice?: number
  salePrice?: number | null
  pointsPrice?: number
  image: string
  category: string
  rating: number
  reviews: number
  inStock: boolean
  stockCount?: number
  createdAt?: string
  totalSales?: number
  shareCount?: number
  vendorId?: string
  discount?: number
  isHot?: boolean
  isNew?: boolean
  isLimited?: boolean
  description: string
  specifications: Record<string, string>
}

interface Seller {
  id: string
  name: string
  avatar: string
  initials: string
  rating: number
  reviews: number
  products: number
  sales: number
  isVerified: boolean
  isPremium: boolean
  badge: string
  badgeColor: string
  avatarColor: string
  description: string
  specialties: string[]
  responseTime: string
  deliveryTime: string
  isOnline: boolean
  location: string
  phone: string
  email: string
  joinedDate: string
  totalProducts: number
  categories: string[]
}

type PublicVendorProfile = {
  vendorId: string
  name: string
  avatar: string
  email: string
  phone: string
  location: string
  description: string
  specialties: string[]
  deliveryTime: string
  createdAt: string
}

export default function SellerPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const pathname = usePathname()
  const { id } = use(params)
  const rawSellerId = String(id ?? '').trim()
  const { addToCart, isInCart } = useCart()
  const { toggleWishlist, isInWishlist } = useWishlist()
  const { addNotification } = useNotifications()
  const { openChatSession, createChatSession } = useChatContext()
  const { user } = useAuth()
  const { requireAuth } = useAuthGuard()
  const { toast } = useToast()
  const { purchaseValue, socialShareValue, socialSharePerNetwork } = useClientPoints()

  const [sharePointsGlobal, setSharePointsGlobal] = useState<number>(0)
  const [shareCountsMap, setShareCountsMap] = useState<Record<string, { total: number; byPlatform: Record<string, number> }>>({})

  const [seller, setSeller] = useState<Seller | null>(null)
  const [isGeneralChatOpen, setIsGeneralChatOpen] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState("popularity")

  const [resolvedVendorId, setResolvedVendorId] = useState<string>(() =>
    UUID_REGEX.test(rawSellerId) ? rawSellerId : ''
  )

  const recordedAutomationVendorViewRef = useRef(false)

  const getComputedPointsPrice = (price: number) => {
    return Math.max(0, Math.round(Number(price || 0) / purchaseValue))
  }

  /**
   * Charge les stats de partage pour tous les produits de la page.
   */
  useEffect(() => {
    let mounted = true
    const pids = products.map(p => String(p.id).trim()).filter(Boolean)
    if (pids.length === 0) return

    const loadAllShareStats = async () => {
      try {
        const [globalPoints, ...countsArray] = await Promise.all([
          ShareEngagementService.getPointsConfig('copy'),
          ...pids.map(pid => ShareEngagementService.getProductShareCounts(pid))
        ])

        if (!mounted) return
        setSharePointsGlobal(Number(globalPoints) || 0)
        
        const newMap: Record<string, { total: number; byPlatform: Record<string, number> }> = {}
        pids.forEach((pid, idx) => {
          newMap[pid] = { total: countsArray[idx].total, byPlatform: countsArray[idx].byPlatform ?? {} }
        })
        setShareCountsMap(newMap)
      } catch {
        // noop
      }
    }

    void loadAllShareStats()
    return () => { mounted = false }
  }, [products])

  const resolveSharePoints = useCallback(
    (platform: string) => {
      const global = Math.max(0, Math.round(Number(socialShareValue) || 0))
      const normalized = String(platform ?? '').toLowerCase().trim()
      const byNetwork = Number((socialSharePerNetwork as any)?.[normalized])
      if (Number.isFinite(byNetwork) && byNetwork >= 0) return Math.round(byNetwork)
      return global
    },
    [socialSharePerNetwork, socialShareValue]
  )

  const handleShare = useCallback(async (product: any, platform: string) => {
    if (!requireAuth('Connectez-vous pour gagner des points en partageant.')) {
      return
    }

    const pid = String(product?.id ?? '').trim()
    if (!pid) return

    const shareUrl = `${window.location.origin}/product/${encodeURIComponent(pid)}?ref=${user?.id ?? ''}`
    const shareText = `Découvrez ce produit incroyable: ${String(product?.name ?? '').trim()}`

    const openShareWindow = async (p: string) => {
      let url = ''
      switch (p) {
        case 'facebook':
          url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
          break
        case 'twitter':
          url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
          break
        case 'whatsapp':
          url = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`
          break
        case 'linkedin':
          url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
          break
        case 'instagram':
        case 'tiktok':
          await navigator.clipboard.writeText(shareUrl)
          toast({
            title: 'Lien copié!',
            description: `Collez le lien dans votre ${p === 'instagram' ? 'story Instagram' : 'vidéo TikTok'}`
          })
          return true
      }
      if (url) {
        window.open(url, '_blank', 'width=600,height=400')
        return true
      }
      return false
    }

    const opened = await openShareWindow(platform)
    if (!opened) return

    try {
      const vendorId = String(resolvedVendorId || (product as any)?.vendorId || (seller as any)?.id || '').trim() || 'unknown'
      await ShareEngagementService.recordShare(String(user?.id ?? ''), pid, vendorId, platform, shareUrl)
    } catch {
      // noop
    }

    try {
      const refreshed = await ShareEngagementService.getProductShareCounts(pid)
      setShareCountsMap((prev) => ({
        ...prev,
        [pid]: {
          total: refreshed.total,
          byPlatform: refreshed.byPlatform ?? {}
        }
      }))
    } catch {
      // noop
    }
  }, [requireAuth, resolvedVendorId, seller, toast, user?.id])

  const handleStartChat = (product?: Product) => {
    if (!requireAuth('Connectez-vous pour écrire au vendeur.')) {
      return
    }
    if (seller) {
      // Ouvrir le modal chat avec les informations du vendeur et du produit
      setChatSellerId(resolvedVendorId || seller.id)
      setChatSellerName(seller.name)
      setChatSellerAvatar(seller.avatar)
      if (product) {
        setSelectedProduct(product) // Définir le produit sélectionné pour le chat
      }
      setShowChatModal(true)
      console.log('💬 Chat démarré avec le vendeur:', seller.name, product ? `pour le produit: ${product.name}` : '(chat général)')
    }
  }

  const handleProductClick = (product: Product) => {
    setSelectedProductForModal(product)
    setIsModalOpen(true)
    console.log('🔍 Modal produit ouvert pour:', product.name)
  }

  const [sharePointsPerShare, setSharePointsPerShare] = useState<number>(0)

  const [isLoading, setIsLoading] = useState(true)
  const [isPointsModalOpen, setIsPointsModalOpen] = useState(false)
  const [selectedProductForPoints, setSelectedProductForPoints] = useState<Product | null>(null)
  
  // États pour le modal chat
  const [showChatModal, setShowChatModal] = useState(false)
  const [chatSellerId, setChatSellerId] = useState<string>('')
  const [chatSellerName, setChatSellerName] = useState<string>('')
  const [chatSellerAvatar, setChatSellerAvatar] = useState<string>('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  
  // États pour le modal produit
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null)

  const [didReplaceSlug, setDidReplaceSlug] = useState(false)
  const { isOnline } = useVendorPresence(resolvedVendorId)
  const { summary } = useVendorSummary(resolvedVendorId)
  const isSellerOnline = isOnline === true
  const responseTimeLabel = (() => {
    const secs = summary?.avgResponseSeconds
    if (typeof secs !== 'number') return seller?.responseTime || ''
    const minutes = Math.max(1, Math.round(secs / 60))
    if (minutes < 60) return `~${minutes} min`
    const hours = Math.round(minutes / 60)
    return `~${hours} h`
  })()

  const ratingValue = typeof summary?.averageRating === 'number' ? summary.averageRating : seller?.rating
  const reviewsValue = typeof summary?.reviewCount === 'number' ? summary.reviewCount : seller?.reviews

  // Charge les données réelles du vendeur + ses produits (fallback sur mock si indisponible)
  useEffect(() => {
    const loadSellerData = async () => {
      setIsLoading(true)
      try {
        const incomingId = rawSellerId
        const incomingIsUuid = UUID_REGEX.test(incomingId)
        const incomingSlug = toComparableSlug(incomingId)

        const [vendorsRes] = await Promise.all([
          fetch('/api/public/vendors/list', { method: 'GET', cache: 'force-cache' }).catch(() => null as any)
        ])

        const vendorsJson = vendorsRes ? await vendorsRes.json().catch(() => null) : null
        const vendors = Array.isArray(vendorsJson?.data) ? vendorsJson.data : []

        const vendorFromApi = incomingIsUuid
          ? vendors.find((v: any) => String(v?.id ?? '').trim() === incomingId)
          : vendors.find((v: any) => {
              const shortCode = toComparableSlug(String(v?.shortCode ?? ''))
              const nameSlug = toComparableSlug(String(v?.name ?? ''))
              return (
                (shortCode && shortCode === incomingSlug) ||
                (nameSlug && nameSlug === incomingSlug)
              )
            })

        // Remplacer l'URL par le slug du NOM (jamais shortCode) pour une URL propre.
        if (!didReplaceSlug && vendorFromApi) {
          const nameSlug = toComparableSlug(String(vendorFromApi?.name ?? '').trim())
          const fallbackSlug = toComparableSlug(String(vendorFromApi?.shortCode ?? '').trim())
          const preferred = nameSlug || fallbackSlug

          const currentPath = typeof pathname === 'string' ? pathname : ''

          // Cas 1) URL en UUID -> replace
          if (incomingIsUuid && preferred && currentPath.endsWith(`/seller/${incomingId}`)) {
            router.replace(`/seller/${preferred}`)
            setDidReplaceSlug(true)
          }

          // Cas 2) URL en shortCode/slug différent -> replace vers slug du nom
          if (!incomingIsUuid && preferred && incomingSlug && incomingSlug !== preferred && currentPath.endsWith(`/seller/${incomingId}`)) {
            router.replace(`/seller/${preferred}`)
            setDidReplaceSlug(true)
          }
        }

        const vendorId = String(vendorFromApi?.id ?? '').trim() || (incomingIsUuid ? incomingId : '')
        if (vendorId && vendorId !== resolvedVendorId) {
          setResolvedVendorId(vendorId)
        }

        const [productsRes2, profileRes, categoriesRes, summaryRes] = await Promise.all([
          vendorId
            ? fetch(`/api/public/products/by-vendor?vendorId=${encodeURIComponent(vendorId)}&limit=96`, { method: 'GET' }).catch(() => null as any)
            : Promise.resolve(null as any),
          vendorId
            ? fetch(`/api/public/vendors/profile?vendorId=${encodeURIComponent(vendorId)}`, { method: 'GET' }).catch(() => null as any)
            : Promise.resolve(null as any)
          ,
          fetch('/api/catalog/categories', { method: 'GET', cache: 'no-store' }).catch(() => null as any),
          vendorId
            ? fetch(`/api/public/vendors/summary?vendorId=${encodeURIComponent(vendorId)}`, { method: 'GET' }).catch(() => null as any)
            : Promise.resolve(null as any)
        ])

        const productsJson = productsRes2 ? await productsRes2.json().catch(() => null) : null
        const items = Array.isArray(productsJson?.data?.items) ? productsJson.data.items : []

        const profileJson = profileRes ? await profileRes.json().catch(() => null) : null
        const profile: PublicVendorProfile | null = profileJson?.data && typeof profileJson.data === 'object' ? (profileJson.data as PublicVendorProfile) : null

        const categoriesJson = categoriesRes ? await categoriesRes.json().catch(() => null) : null
        const categoryRows = Array.isArray(categoriesJson?.data?.items) ? categoriesJson.data.items : []
        const categoryNameById = new Map<string, string>()
        for (const row of categoryRows) {
          const cid = String((row as any)?.id ?? '').trim()
          const cname = String((row as any)?.name ?? '').trim()
          if (cid && cname) categoryNameById.set(cid, cname)
        }

        const summaryJson = summaryRes ? await summaryRes.json().catch(() => null) : null
        const isVendorVerified = Boolean(summaryJson?.data?.isVerified)

        const sellerName = String(profile?.name ?? vendorFromApi?.name ?? '').trim() || "Vendeur"
        const sellerAvatar = String(profile?.avatar ?? vendorFromApi?.avatar ?? '').trim() || "/placeholder-user.jpg"
        const sellerCreatedAt = String(profile?.createdAt ?? (typeof (vendorFromApi as any)?.createdAt === 'string' ? String((vendorFromApi as any).createdAt).trim() : '')).trim()
        const memberMeta = buildMemberSinceLabel(sellerCreatedAt || null)

        const nextProducts: Product[] = items.map((p: any) => {
          const categoryIds = Array.isArray(p?.categoryIds) ? p.categoryIds : Array.isArray(p?.category_ids) ? p.category_ids : []
          const normalizedCategoryIds = categoryIds.map((v: any) => String(v ?? '').trim()).filter(Boolean)
          const categoryName = (() => {
            for (const id of normalizedCategoryIds) {
              const name = categoryNameById.get(id)
              if (name) return name
            }
            return 'Produit'
          })()

          return {
            id: String(p?.id ?? ''),
            name: String(p?.name ?? 'Produit'),
            price: (() => {
              const raw = Number(p?.price ?? NaN)
              const original = Number(p?.originalPrice ?? NaN)
              if (Number.isFinite(raw) && raw > 0) return raw
              if (Number.isFinite(original) && original > 0) return original
              return 0
            })(),
            originalPrice: Number.isFinite(Number(p?.originalPrice)) ? Number(p.originalPrice) : undefined,
            salePrice: p?.salePrice === null || p?.salePrice === undefined ? null : (Number.isFinite(Number(p?.salePrice)) ? Number(p.salePrice) : null),
            image: String(p?.image ?? '/placeholder.svg'),
            category: categoryName,
            rating: Number.isFinite(Number(p?.averageRating)) ? Math.max(0, Number(p.averageRating)) : 0,
            reviews: Number.isFinite(Number(p?.reviewCount)) ? Math.max(0, Math.floor(Number(p.reviewCount))) : 0,
            inStock: Boolean(p?.inStock ?? true),
            stockCount: Number.isFinite(Number(p?.stockCount)) ? Number(p.stockCount) : undefined,
            createdAt: typeof p?.createdAt === 'string' ? String(p.createdAt).trim() : undefined,
            totalSales: Number.isFinite(Number(p?.totalSales)) ? Math.max(0, Number(p.totalSales)) : undefined,
            shareCount: Number.isFinite(Number(p?.shareCount)) ? Math.max(0, Math.floor(Number(p.shareCount))) : undefined,
            vendorId: String(p?.vendorId ?? vendorId),
            discount: Number(p?.discount ?? 0) || 0,
            isNew: (() => {
              const iso = typeof p?.createdAt === 'string' ? String(p.createdAt).trim() : ''
              const d = iso ? new Date(iso) : null
              if (!d || Number.isNaN(d.getTime())) return false
              const days = (Date.now() - d.getTime()) / 86400000
              return days >= 0 && days <= 30
            })(),
            isHot: (() => {
              const sales = Number(p?.totalSales)
              if (!Number.isFinite(sales)) return false
              return sales >= 10
            })(),
            description: '',
            specifications: {}
          }
        })

        const nextCategories = Array.from(new Set(nextProducts.map((p) => p.category).filter(Boolean))).sort((a, b) => a.localeCompare(b))

        const nextSeller: Seller = {
          id: vendorId || String(id ?? '').trim(),
          name: sellerName,
          avatar: sellerAvatar,
          initials: buildInitials(sellerName),
          rating: 0,
          reviews: 0,
          products: items.length,
          sales: 0,
          isVerified: isVendorVerified,
          isPremium: false,
          badge: isVendorVerified ? "Vérifié" : "Standard",
          badgeColor: isVendorVerified ? "bg-green-500" : "bg-gray-500",
          avatarColor: "bg-gradient-to-r from-purple-500 to-blue-600",
          description: String(profile?.description ?? '').trim(),
          specialties: Array.isArray(profile?.specialties) ? profile!.specialties : [],
          responseTime: "",
          deliveryTime: String(profile?.deliveryTime ?? '').trim(),
          isOnline: false,
          location: String(profile?.location ?? '').trim(),
          phone: String(profile?.phone ?? '').trim(),
          email: String(profile?.email ?? '').trim(),
          joinedDate: memberMeta.memberSince || "",
          totalProducts: items.length,
          categories: nextCategories
        }

        setSeller(nextSeller)
        setProducts(nextProducts)
        setFilteredProducts(nextProducts)
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadSellerData()
  }, [rawSellerId, resolvedVendorId, didReplaceSlug, pathname, router])

  useEffect(() => {
    if (recordedAutomationVendorViewRef.current) return
    const vendorId = String(resolvedVendorId ?? '').trim()
    if (!UUID_REGEX.test(vendorId)) return

    recordedAutomationVendorViewRef.current = true

    try {
      const path = typeof window !== 'undefined' ? window.location.pathname : null
      const dedupeKey = buildViewDedupeKey({ eventType: 'vendor.page_viewed', entityType: 'vendor', entityId: vendorId, path })
      void trackAutomationEvent({
        eventType: 'vendor.page_viewed',
        entityType: 'vendor',
        entityId: vendorId,
        payload: {
          vendorId,
          vendorName: String(seller?.name ?? '').trim() || null
        },
        sourceUi: 'seller_page',
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
          pageType: 'seller',
          vendorId
        },
        sourceUi: 'seller_page',
        dedupeKey,
        dedupeTtlMs: 10 * 60 * 1000
      })
    } catch {
      // best-effort
    }
  }, [resolvedVendorId, seller])

  useEffect(() => {
    let isMounted = true

    const loadSharePoints = async () => {
      try {
        // Réseau générique -> retourne la valeur par défaut si non configuré spécifiquement.
        const points = await ShareEngagementService.getPointsConfig('copy')
        const safe = Number(points)
        if (!Number.isFinite(safe) || safe < 0) return

        if (isMounted) {
          setSharePointsPerShare(Math.round(safe))
        }
      } catch {
        // noop
      }
    }

    loadSharePoints()

    return () => {
      isMounted = false
    }
  }, [])

  /**
   * Convertit un prix FCFA en points selon la config Super Admin (Option A), sans décimales.
   */
  const convertPriceToPoints = (price: number) => {
    return Math.max(0, Math.ceil(Number(price || 0) / purchaseValue))
  }

  const filteredProductsWithPoints = useMemo(() => {
    return filteredProducts.map(product => ({
      ...product,
      pointsPrice: convertPriceToPoints(product.price)
    }))
  }, [filteredProducts, purchaseValue])

  // Filtrer les produits
  useEffect(() => {
    let filtered = products
    
    if (searchQuery) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    if (selectedCategory !== "all") {
      filtered = filtered.filter(product => product.category === selectedCategory)
    }
    
    // Trier les produits
    switch (sortBy) {
      case "price-low":
        filtered = [...filtered].sort((a, b) => a.price - b.price)
        break
      case "price-high":
        filtered = [...filtered].sort((a, b) => b.price - a.price)
        break
      case "rating":
        filtered = [...filtered].sort((a, b) => b.rating - a.rating)
        break
      case "reviews":
        filtered = [...filtered].sort((a, b) => b.reviews - a.reviews)
        break
      default:
        // Popularité par défaut
        filtered = [...filtered].sort((a, b) => b.reviews - a.reviews)
    }
    
    setFilteredProducts(filtered)
  }, [products, searchQuery, selectedCategory, sortBy])

  const handleAddToCart = (product: Product) => {
    if (!requireAuth('Connectez-vous pour ajouter au panier.')) {
      return
    }
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      seller: seller?.name || 'Vendeur Probooster'
    })
    addNotification({ 
      type: 'success', 
      title: 'Produit ajouté', 
      message: `${product.name} a été ajouté au panier` 
    })
  }

  const handleAddToWishlist = (product: Product) => {
    if (!requireAuth('Connectez-vous pour ajouter aux favoris.')) {
      return
    }
    toggleWishlist({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      seller: seller?.name || 'Vendeur Probooster'
    })
    
    if (isInWishlist(product.id)) {
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

  const handleAddToCompare = (product: Product) => {
    try {
      // Récupérer la liste de comparaison existante
      const existingCompareList = localStorage.getItem('compareList')
      const compareList = existingCompareList ? JSON.parse(existingCompareList) : []
      
      // Vérifier si le produit est déjà dans la liste
      if (compareList.find((p: any) => p.id === product.id)) {
        addNotification({ 
          type: 'warning', 
          title: 'Déjà en comparaison', 
          message: `${product.name} est déjà dans votre liste de comparaison` 
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
      
      // Ajouter le produit à la liste de comparaison
      const productToAdd = {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        seller: seller?.name || 'Vendeur Probooster',
        rating: product.rating,
        reviews: product.reviews,
        category: product.category,
        inStock: product.inStock
      }
      
      compareList.push(productToAdd)
      localStorage.setItem('compareList', JSON.stringify(compareList))
      
      // Déclencher un événement personnalisé pour notifier le header
      window.dispatchEvent(new CustomEvent('compareListUpdated', { 
        detail: { compareList, length: compareList.length } 
      }))
      
      addNotification({ 
        type: 'success', 
        title: 'Produit ajouté', 
        message: `${product.name} a été ajouté à la comparaison` 
      })
    } catch (error) {
      console.error('Erreur lors de l\'ajout à la comparaison:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible d\'ajouter le produit à la comparaison'
      })
    }
  }

  const handleCallSeller = () => {
    // Utiliser le protocole tel: pour déclencher l'appel
    if (seller && seller.phone) {
      try {
        // Vérifier si le navigateur supporte le protocole tel:
        if ('protocol' in window.location) {
          window.open(`tel:${seller.phone}`, '_self')
        } else {
          // Fallback pour les navigateurs qui ne supportent pas tel:
          (window.location as any).href = `tel:${seller.phone}`
        }
        console.log(`Appel en cours vers ${seller.phone}`)
      } catch (error) {
        console.error('Erreur lors de l\'appel:', error)
        // Fallback : copier le numéro dans le presse-papiers
        navigator.clipboard.writeText(seller.phone)
        alert(`Numéro copié dans le presse-papiers : ${seller.phone}`)
      }
    } else {
      console.log("Numéro de téléphone non disponible")
      alert("Numéro de téléphone non disponible pour ce vendeur")
    }
  }

  const handleEmailSeller = () => {
    // Utiliser le protocole mailto: pour ouvrir l'email
    if (seller && seller.email) {
      try {
        const subject = encodeURIComponent(`Contact - ${seller.name}`)
        const body = encodeURIComponent(`Bonjour,\n\nJe souhaite vous contacter concernant vos produits.\n\nCordialement,`)
        window.open(`mailto:${seller.email}?subject=${subject}&body=${body}`, '_self')
        console.log(`Email en cours vers ${seller.email}`)
      } catch (error) {
        console.error('Erreur lors de l\'ouverture de l\'email:', error)
        // Fallback : copier l'email dans le presse-papiers
        navigator.clipboard.writeText(seller.email)
        alert(`Email copié dans le presse-papiers : ${seller.email}`)
      }
    } else {
      console.log("Email non disponible")
      alert("Email non disponible pour ce vendeur")
    }
  }

  const handlePointsPurchase = (product: any, usePoints: boolean, pointsToUse: number) => {
    if (!requireAuth('Connectez-vous pour passer une commande.')) {
      return
    }
    // Simulation d'un achat avec points
    console.log(`Achat du produit ${product.name} avec ${pointsToUse} points`)
    
    // Ici vous pouvez ajouter la logique d'achat réelle
    // Par exemple, appeler une API pour traiter l'achat
    
    // Fermer le modal
    setIsPointsModalOpen(false)
    setSelectedProductForPoints(null)
  }

  const openPointsModal = (product: Product) => {
    if (!requireAuth('Connectez-vous pour passer une commande.')) {
      return
    }
    setSelectedProductForPoints(product)
    setIsPointsModalOpen(true)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Chargement de la boutique...</p>
        </div>
      </div>
    )
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">Vendeur non trouvé</p>
          <Button onClick={() => router.back()} className="mt-4">
            Retour
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">


      <div className="container mx-auto px-4 py-8">
        {/* En-tête du vendeur */}
        <div className="bg-gradient-to-br from-orange-50 via-yellow-50 to-pink-50 rounded-3xl p-8 mb-8 shadow-xl border border-orange-100 animate-fade-in-up">
          <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-6 lg:space-y-0 lg:space-x-8">
            {/* Avatar et informations principales */}
            <div className="flex items-center space-x-6">
              <div className="relative">
                <Avatar className="h-24 w-24 ring-4 ring-white shadow-2xl hover:scale-110 transition-transform duration-500">
                  <AvatarImage src={seller.avatar} alt={seller.name} />
                  <AvatarFallback className={`text-white font-bold text-2xl ${seller.avatarColor} shadow-lg`}>
                    {seller.initials}
                  </AvatarFallback>
                </Avatar>
                {isSellerOnline && (
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white animate-pulse shadow-lg"></div>
                )}
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <h1 className="text-4xl font-bold text-gray-900 hover:text-orange-600 transition-colors duration-300">
                    {seller.name}
                  </h1>
                  <Badge className={`text-white text-sm font-semibold ${seller.badgeColor} animate-pulse shadow-lg px-3 py-1`}>
                    {seller.badge}
                  </Badge>
                </div>
                
                <p className="text-lg text-gray-600 max-w-2xl">{seller.description}</p>
                
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${
                            i < Math.floor(Number(ratingValue ?? 0)) ? "text-yellow-400 fill-current" : "text-gray-300"
                          } hover:scale-110 transition-transform duration-200`}
                        />
                      ))}
                    </div>
                    <span className="text-lg font-semibold text-gray-700">
                      {Number(ratingValue ?? 0).toFixed(1)} ({Number(reviewsValue ?? 0)} avis)
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Users className="h-5 w-5" />
                    <span>{seller.sales.toLocaleString()} ventes</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Statistiques rapides */}
            <div className="flex flex-col space-y-4 lg:ml-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-orange-200 hover:shadow-lg transition-all duration-300 hover:scale-105">
                  <div className="text-2xl font-bold text-orange-600 mb-1">{seller.totalProducts}+</div>
                  <div className="text-sm text-gray-600">Produits</div>
                </div>
                <div className="text-center p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-blue-200 hover:shadow-lg transition-all duration-300 hover:scale-105">
                  <div className="text-2xl font-bold text-blue-600 mb-1">{seller.joinedDate}</div>
                  <div className="text-sm text-gray-600">Membre depuis</div>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <Button 
                  onClick={() => setIsGeneralChatOpen(true)}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 group"
                >
                  <MessageCircle className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                  Chat
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={handleCallSeller}
                  className="border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-all duration-300 group"
                >
                  <Phone className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                  Appeler
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Informations détaillées du vendeur */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Spécialités */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
            <CardHeader className="pb-4">
              <CardTitle className="text-blue-800 flex items-center space-x-2">
                <Award className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform duration-300" />
                <span>Spécialités</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(seller.specialties.length > 0 ? seller.specialties : ['Non renseigné']).map((specialty, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="bg-white/90 border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors font-medium px-3 py-1"
                  >
                    {specialty}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Informations de contact */}
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
            <CardHeader className="pb-4">
              <CardTitle className="text-green-800 flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-green-600 group-hover:scale-110 transition-transform duration-300" />
                <span>Contact</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2 text-green-700">
                <MapPin className="h-4 w-4" />
                <span>{seller.location || 'Non renseigné'}</span>
              </div>
              <div className="flex items-center space-x-2 text-green-700">
                <Phone className="h-4 w-4" />
                <span>{seller.phone || 'Non renseigné'}</span>
              </div>
              <div className="flex items-center space-x-2 text-green-700">
                <Mail className="h-4 w-4" />
                <span>{seller.email || 'Non renseigné'}</span>
              </div>
              
              {/* Boutons d'action rapide */}
              <div className="flex space-x-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleCallSeller}
                  className="flex-1 border-green-300 text-green-600 hover:bg-green-50 hover:border-green-400 transition-all duration-300 group"
                >
                  <Phone className="h-3 w-3 mr-1 group-hover:scale-110 transition-transform duration-300" />
                  Appeler
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleEmailSeller}
                  className="flex-1 border-green-300 text-green-600 hover:bg-green-50 hover:border-green-400 transition-all duration-300 group"
                >
                  <Mail className="h-3 w-3 mr-1 group-hover:scale-110 transition-transform duration-300" />
                  Email
                </Button>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => setIsGeneralChatOpen(true)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white transition-all duration-300 group"
                >
                  <MessageCircle className="h-3 w-3 mr-1 group-hover:scale-110 transition-transform duration-300" />
                  Chat Général
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Performance */}
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
            <CardHeader className="pb-4">
              <CardTitle className="text-purple-800 flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-purple-600 group-hover:scale-110 transition-transform duration-300" />
                <span>Performance</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-purple-700">Réponse</span>
                <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                  {responseTimeLabel || seller.responseTime}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-purple-700">Livraison</span>
                <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                  {seller.deliveryTime}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-purple-700">Disponibilité</span>
                <Badge className={`${isSellerOnline ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                  {isSellerOnline ? 'En ligne' : 'Hors ligne'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section des produits */}
        <div className="space-y-6">
          {/* En-tête des produits */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-4 lg:space-y-0">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Produits de {seller.name}
              </h2>
              <p className="text-gray-600">
                {filteredProductsWithPoints.length} produit{filteredProductsWithPoints.length !== 1 ? 's' : ''} disponible{filteredProductsWithPoints.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Recherche */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="search"
                  placeholder="Rechercher un produit..."
                  className="pl-10 w-64 border-2 focus:border-orange-500 transition-all duration-300"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              {/* Filtres */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48 border-2 hover:border-orange-500 transition-all duration-300">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {seller.categories.map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Tri */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40 border-2 hover:border-orange-500 transition-all duration-300">
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popularity">Popularité</SelectItem>
                  <SelectItem value="price-low">Prix croissant</SelectItem>
                  <SelectItem value="price-high">Prix décroissant</SelectItem>
                  <SelectItem value="rating">Note</SelectItem>
                  <SelectItem value="reviews">Avis</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Mode d'affichage */}
              <div className="flex border-2 border-gray-200 rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-none border-0 hover:bg-orange-50 hover:text-orange-600 transition-all duration-300"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-none border-0 hover:bg-orange-50 hover:text-orange-600 transition-all duration-300"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Grille des produits avec carte produit officielle */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProductsWithPoints.map((product: any, index: number) => (
                <Card 
                  key={product.id} 
                  className="group hover:shadow-2xl transition-all duration-500 overflow-hidden border-0 bg-white rounded-2xl transform hover:scale-105 hover:-translate-y-2 cursor-pointer"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => handleProductClick(product)}
                >
                  {/* Image du produit avec badges et actions */}
                  <div 
                    className="relative overflow-hidden cursor-pointer"
                  >
                    <Image
                      src={product.image}
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
                        <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 animate-ping shadow-lg">
                          <Clock className="h-3 w-3 mr-1 animate-ping" />
                          LIMITED
                        </Badge>
                      )}
                      
                      {/* Triggers d'incitation supplémentaires */}
                      {product.inStock && (
                        <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 animate-pulse shadow-lg">
                          <Target className="h-3 w-3 mr-1 animate-bounce" />
                          POPULAIRE
                        </Badge>
                      )}
                      
                      {product.discount && product.discount > 15 && (
                        <Badge className="bg-gradient-to-r from-pink-500 to-red-500 text-white border-0 animate-pulse shadow-lg">
                          <Crown className="h-3 w-3 mr-1 animate-pulse" />
                          MEILLEUR PRIX
                        </Badge>
                      )}
                    </div>

                    {/* Animated Discount Badge */}
                    {product.discount && product.discount > 0 && (
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
                    {product.inStock && Number.isFinite(Number(product?.stockCount)) && Number(product.stockCount) > 0 && (
                      <div className="absolute bottom-3 left-3 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse shadow-lg">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>Seulement {Math.max(0, Math.floor(Number(product.stockCount)))} restants !</span>
                        </div>
                      </div>
                    )}

                    {/* Floating Action Buttons */}
                    <div className="absolute top-12 right-3 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0">
                      {/* Bouton Favori */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="bg-white/90 hover:bg-white shadow-lg rounded-full h-9 w-9 transition-all duration-300 relative overflow-hidden group"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAddToWishlist(product)
                        }}
                      >
                        {/* Effet de particules */}
                        <div className="absolute inset-0 pointer-events-none">
                          <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-red-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                          <div className="absolute bottom-1/4 right-1/4 w-1 h-1 bg-pink-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ animationDelay: '0.3s' }}></div>
                        </div>
                      
                        <Heart className="h-4 w-4 text-red-500 hover:scale-110 transition-all duration-300" />
                      </Button>
                      
                      {/* Bouton Panier */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="bg-white/90 hover:bg-white shadow-lg rounded-full h-9 w-9 transition-all duration-300 relative overflow-hidden group"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAddToCart(product)
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
                          handleAddToCompare(product)
                        }}
                      >
                        {/* Effet de particules */}
                        <div className="absolute inset-0 pointer-events-none">
                          <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-purple-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                          <div className="absolute bottom-1/4 right-1/4 w-1 h-1 bg-violet-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ animationDelay: '0.3s' }}></div>
                        </div>
                        
                        <BarChart3 className="h-4 w-4 text-purple-600 hover:scale-110 transition-transform duration-300 animate-pulse" />
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
                      {/* Indicateur de vente rapide */}
                      {product.inStock && Number.isFinite(Number(product?.totalSales)) && Number(product.totalSales) > 0 && (
                        <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium animate-bounce shadow-md inline-flex items-center space-x-1">
                          <TrendingUp className="h-3 w-3" />
                          <span>Vendu {Math.max(0, Math.floor(Number(product.totalSales)))} fois !</span>
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
                            {(Number.isFinite(Number((product as any)?.salePrice)) && Number((product as any).salePrice) > 0
                              ? Number((product as any).salePrice)
                              : product.price
                            ).toLocaleString()} F CFA
                          </span>
                          {Number.isFinite(Number((product as any)?.salePrice)) && Number((product as any).salePrice) > 0 && Number((product as any).salePrice) < Number(product.price) && (
                            <span className="text-sm text-gray-500 line-through">
                              {Number(product.price).toLocaleString()} F CFA
                            </span>
                          )}
                      </div>
                        
                        <div className="flex items-center space-x-2 text-sm">
                          <Coins className="h-4 w-4 text-yellow-500 animate-pulse" />
                          <span className="font-semibold text-gray-700">
                            {getComputedPointsPrice(product.price)} points
                          </span>
                      </div>
                    </div>

                      <div className="text-sm text-gray-600">
                        Vendu par{' '}
                        <Link
                          href={buildSellerHref(seller.name)}
                          prefetch
                          className="font-medium text-[#ff6600] cursor-pointer hover:text-[#e55a00] transition-colors duration-300"
                          onClick={(e) => {
                            e.stopPropagation()
                          }}
                        >
                          {seller.name}
                        </Link>
                      </div>

                      {/* Enhanced Share Info */}
                      {(sharePointsGlobal > 0 || (shareCountsMap[String(product.id)]?.total || 0) > 0) && (
                        <div className="bg-gradient-to-r from-[#ff6600]/10 to-[#ff8533]/10 p-3 rounded-xl border border-[#ff6600]/20">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-[#ff6600] font-semibold flex items-center">
                              <Gift className="h-4 w-4 mr-1 animate-bounce" />
                              +{sharePointsGlobal} points par partage
                            </span>
                            <span className="text-gray-600 flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              {shareCountsMap[String(product.id)]?.total || 0} partages
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {/* Triggers d'incitation supplémentaires */}
                      {product.discount && product.discount > 10 && (
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
                        onClick={() => handleAddToCart(product)}
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
                      
                      <Button 
                        variant="outline"
                          size="icon"
                          className="border-2 border-gray-200 hover:border-[#ff6600] hover:bg-[#ff6600] hover:text-white rounded-xl transition-all duration-300 min-w-[44px] group animate-pulse relative overflow-hidden"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                          }}
                        >
                          {/* Effet de particules */}
                          <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-blue-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="absolute bottom-1/4 right-1/4 w-1 h-1 bg-green-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ animationDelay: '0.3s' }}></div>
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <div
                                className="flex items-center justify-center w-full h-full"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                }}
                              >
                                <Share2 className="h-4 w-4 group-hover:scale-110 transition-transform duration-300 animate-bounce" />
                              </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="bg-white border-2 border-gray-200 rounded-xl shadow-xl p-2 min-w-[220px]"
                              onClick={(e) => {
                                e.stopPropagation()
                              }}
                            >
                              {([
                                'facebook',
                                'whatsapp',
                                'twitter',
                                'instagram',
                                'linkedin',
                                'tiktok'
                              ] as const).map((platform) => {
                                const Icon = {
                                  facebook: FaFacebook,
                                  whatsapp: FaWhatsapp,
                                  twitter: FaXTwitter,
                                  instagram: FaInstagram,
                                  linkedin: FaLinkedin,
                                  tiktok: FaTiktok
                                }[platform]

                                const colors = {
                                  facebook: 'bg-blue-600',
                                  whatsapp: 'bg-green-500',
                                  twitter: 'bg-black',
                                  instagram: 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500',
                                  linkedin: 'bg-blue-700',
                                  tiktok: 'bg-black'
                                }[platform]

                                const pid = String(product?.id ?? '').trim()
                                const counts = shareCountsMap?.[pid]?.byPlatform ?? {}
                                const countValue = Number((counts as any)?.[platform] ?? 0)
                                const safeCount = Number.isFinite(countValue) && countValue >= 0 ? Math.round(countValue) : 0
                                const points = resolveSharePoints(platform)

                                return (
                                  <DropdownMenuItem
                                    key={platform}
                                    onSelect={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      void handleShare(product, platform)
                                    }}
                                    className="flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 group"
                                  >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300 ${colors}`}
                                    >
                                      <Icon className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1">
                                      <span className="font-semibold text-gray-900">
                                        {platform.charAt(0).toUpperCase() + platform.slice(1)}
                                      </span>
                                      <div className="flex items-center space-x-2">
                                        <span className="text-sm text-gray-500">+{points} points</span>
                                        <div className="flex space-x-1">
                                          <div className="w-1 h-1 bg-yellow-400 rounded-full animate-pulse"></div>
                                          <div className="w-1 h-1 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                                          <div className="w-1 h-1 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                                        </div>
                                      </div>
                                    </div>
                                    <Badge variant="outline" className="text-xs animate-pulse">
                                      {safeCount}
                                    </Badge>
                                  </DropdownMenuItem>
                                )
                              })}
                            </DropdownMenuContent>
                          </DropdownMenu>
                      </Button>
                    </div>

                      <div className="w-full">
                        <Button 
                          variant="outline" 
                          className="w-full bg-gradient-to-r from-gray-50 to-gray-100 hover:from-[#ff6600]/10 hover:to-[#ff8533]/10 border-2 border-gray-200 hover:border-[#ff6600] text-gray-700 hover:text-[#ff6600] rounded-xl transition-all duration-300 transform hover:scale-105 relative overflow-hidden group px-6 py-4"
                          onClick={(e) => {
                            e.stopPropagation()
                            openPointsModal(product)
                          }}
                        >
                          {/* Effet de particules */}
                          <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-yellow-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-yellow-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ animationDelay: '0.3s' }}></div>
                            <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-yellow-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ animationDelay: '0.6s' }}></div>
                          </div>
                          
                          <div className="flex items-center justify-center w-full min-w-0 gap-2">
                            <Coins className="h-5 w-5 animate-pulse flex-shrink-0 text-yellow-600" />
                            <span className="text-sm font-semibold text-gray-800 min-w-0 text-center whitespace-normal leading-tight break-words">
                              Acheter avec points ({getComputedPointsPrice(product.price)} pts)
                            </span>
                          </div>
                        </Button>
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProductsWithPoints.map((product: any, index: number) => (
                <Card
                  key={product.id}
                  className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border-0 shadow-md relative overflow-hidden animate-fade-in-up bg-white"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex space-x-4 p-4">
                    {/* Image du produit avec badges */}
                    <div className="relative w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden group-hover:scale-105 transition-transform duration-300 flex-shrink-0">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                      />

                      {/* Badges sur l'image */}
                      <div className="absolute top-2 left-2 flex flex-col space-y-1">
                        {product.isHot && (
                          <Badge className="bg-red-500 text-white text-xs px-1 py-0.5">
                            HOT
                          </Badge>
                        )}
                        {product.isNew && (
                          <Badge className="bg-blue-500 text-white text-xs px-1 py-0.5">
                            NEW
                          </Badge>
                        )}
                        {product.discount && product.discount > 0 && (
                          <Badge className="bg-orange-500 text-white text-xs px-1 py-0.5">
                            -{product.discount}%
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Informations du produit */}
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 group-hover:text-orange-600 transition-colors duration-300 mb-2">
                          {product.name}
                        </h3>
                        <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                          {product.description}
                        </p>
                        <Badge variant="outline" className="text-xs text-gray-600 border-gray-300">
                          {product.category}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="text-2xl font-bold text-orange-600">
                            {product.price.toLocaleString()} F CFA
                          </div>
                          <div className="text-sm text-gray-500">
                            {getComputedPointsPrice(product.price)} pts
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < Math.floor(product.rating) ? "text-yellow-400 fill-current" : "text-gray-300"
                                }`}
                              />
                            ))}
                            <span className="text-sm text-gray-600 ml-1">
                              {product.rating} ({product.reviews})
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleAddToCart(product)}
                          className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 group"
                        >
                          <ShoppingCart className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                          Ajouter au panier
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => handleAddToWishlist(product)}
                          className="border-gray-300 text-gray-600 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all duration-300 group"
                        >
                          <Heart className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
                          Wishlist
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            
            {/* Message si aucun produit */}
            {filteredProductsWithPoints.length === 0 && (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Package className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Aucun produit trouvé
                </h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Aucun produit ne correspond à vos critères de recherche. Essayez de modifier vos filtres.
                </p>
                <Button 
                  onClick={() => {
                    setSearchQuery("")
                    setSelectedCategory("all")
                  }}
                  className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white px-8 py-3"
                >
                  Réinitialiser les filtres
                </Button>
              </div>
            )}

            </div>
          )}
        </div>
      </div>



      {/* Modal d'achat avec points */}
      {selectedProductForPoints && isPointsModalOpen && (
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

      {/* Modal Fiche Produit */}
      {selectedProductForModal && (
        <ProductModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedProductForModal(null)
          }}
          product={{
            ...selectedProductForModal,
            vendorId: seller?.id,
            seller: {
              id: seller?.id,
              name: seller?.name || 'Vendeur',
              avatar: seller?.avatar || '/placeholder-user.jpg',
              logo: seller?.avatar || '/placeholder-user.jpg',
              rating: Number(ratingValue ?? 0),
              reviews: Number(reviewsValue ?? 0),
              totalSales: seller?.sales || 0,
              responseTime: responseTimeLabel || seller?.responseTime || '',
              location: seller?.location || 'Localisation',
              phone: seller?.phone || 'Téléphone',
              email: seller?.email || 'email@example.com',
              joinDate: seller?.joinedDate || '2020',
              memberSince: seller?.joinedDate || '2020'
            }
          } as any}
        />
      )}

      {/* Modal Chat Legacy */}
      <LegacyChatModal
        isOpen={showChatModal}
        onClose={() => {
          setShowChatModal(false)
          setSelectedProduct(null)
        }}
        sellerId={chatSellerId}
        sellerName={chatSellerName}
        sellerAvatar={chatSellerAvatar}
        product={selectedProduct}
      />
      
      {/* Chat général avec le vendeur - Intégré au système global */}
      {isGeneralChatOpen && seller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Chat avec {seller.name}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsGeneralChatOpen(false)}
              >
                ✕
              </Button>
            </div>
            <p className="text-gray-600 mb-4">
              Pour discuter avec ce vendeur, utilisez le bouton "Nouveau Chat" dans votre tableau de bord ou le bouton de chat flottant global.
            </p>
            <Button
              onClick={() => {
                setIsGeneralChatOpen(false)
                handleStartChat()
              }}
              className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white"
            >
              Démarrer le chat
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
