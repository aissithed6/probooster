"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { usePathname, useRouter } from "next/navigation"
import { 
  Heart, 
  Minus, 
  Plus, 
  Share2, 
  ShoppingCart, 
  Star, 
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  Clock,
  Truck,
  Shield,
  Gift,
  Coins,
  Users,
  Award,
  TrendingUp,
  Eye,
  ThumbsUp,
  MessageSquare,
  Zap,
  Crown,
  Flame,
  Sparkles,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Info,
  RefreshCw,
  Send,
  Mic,
  MicOff,
  Paperclip,
  File as FileIcon,
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  BarChart3
} from "lucide-react"
import { useNotifications, NotificationContainer } from "@/components/ui/modern-notification"
// Import supprimé - remplacé par le nouveau système de chat global

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { ProductGlobalChatTrigger } from "@/components/chat"
import { LegacyChatModal } from "@/components/chat/LegacyChatModal"
import ShareButtons from "@/components/product/share-buttons"
import PointsPurchaseModal from "@/components/product/points-purchase-modal"
import { useToast } from "@/hooks/use-toast"
import { useBestOfferPrice } from "@/hooks/useBestOfferPrice"
import { useClientPoints } from "@/lib/hooks/use-client-points"
import { useAuthGuard } from "@/lib/hooks/use-auth-guard"
import { useChatContext } from "@/lib/chat-context-supabase"
import { isProductEligibleForFreeShippingLabel } from "@/lib/utils/free-shipping-eligibility"
import { useDeliveryConfig } from "@/contexts/DeliveryConfigContext"
import { useVendorPresence } from "@/lib/hooks/use-vendor-presence"
import { useAuth } from "@/contexts/AuthContext"
import { CartService, PointsService, WishlistService } from "@/lib/services"
import { ShareEngagementService } from "@/lib/services/share-engagement-service"
import { EditableMessagesBanner } from "@/components/messages/EditableMessagesBanner"

 const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

 /**
  * Convertit une valeur (number/string/mixte) en number optionnel.
  */
 function toOptionalNumber(value: unknown): number | null {
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

 /**
  * Convertit une valeur (boolean/string/number) en boolean.
  */
 function toBoolean(value: unknown): boolean {
   if (typeof value === 'boolean') return value
   if (typeof value === 'number') return value !== 0
   if (typeof value === 'string') {
     const v = value.trim().toLowerCase()
     if (v === 'true' || v === 't' || v === '1' || v === 'yes') return true
     if (v === 'false' || v === 'f' || v === '0' || v === 'no') return false
   }
   return Boolean(value)
 }

interface Product {
  id: string
  name: string
  price: number
  pointsPrice: number
  originalPrice: number
  rating: number
  reviews: number
  returnPolicy?: string
  images?: string[]
  image?: string
  seller: {
    id?: string
    name: string
    avatar: string
    rating: number
    totalSales: number
    responseTime: string
    location: string
    phone: string
    email: string
    joinDate: string
    memberSince: string
    logo: string
  }
  description: string
  specifications: Record<string, string>
  features: string[]
  warranty: string
  shipping: {
    cost: number
    time: string
    method: string
  }
  stock: number
  sharePoints: number
  shares: number
  inStock: boolean
  discount: number
  isHot: boolean
  isNew: boolean
  isLimited: boolean
  badges: string[]
  color: string
  category: string
  tags: string[]
  relatedProducts: number[]
}

interface ProductModalProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
}

export default function ProductModal({
  product,
  isOpen,
  onClose 
}: ProductModalProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()
  const { createChatSession, openChatSession, activeChatSession, messages: syncedMessages, sendMessage: sendSyncedMessage } = useChatContext()
  // useChat remplacé par le nouveau système de chat global
  // Utilisez le bouton flottant orange en bas à droite pour accéder au chat
  
  const { addNotification } = useNotifications()

  /**
   * Formatage simple d'une date ISO pour l'affichage.
   */
  const formatIsoDateForUi = (iso: string | null | undefined) => {
    if (!iso) return ''
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const {
    balance: pointsBalance,
    refresh: refreshPoints,
    purchaseValue,
    socialShareValue: sharePointsGlobal,
    socialSharePerNetwork
  } = useClientPoints()

  const { toast } = useToast()
  const { requireAuth } = useAuthGuard()

  const showLegacyChat = process.env.NEXT_PUBLIC_ENABLE_LEGACY_CHAT === 'true'
  
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [activeTab, setActiveTab] = useState("details")
  const [isWishlisted, setIsWishlisted] = useState(false)
  // États locaux pour compatibilité (certaines parties du modal utilisent encore un chat simulé)
  const [chatInput, setChatInput] = useState("")
  const [currentSession, setCurrentSession] = useState<{
    id: string
    isTyping: boolean
    messages: Array<{
      id: string
      text: string
      sender: 'user' | 'seller' | 'system'
      type: 'text' | 'system' | 'audio' | 'file'
      timestamp: Date
      productId?: number
      fileUrl?: string
      fileName?: string
      fileSize?: string
      fileType?: string
    }>
  } | null>(null)
  
  // États pour les fonctionnalités vocales et fichiers
  const [editMode, setEditMode] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [recordingPaused, setRecordingPaused] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioChunks, setAudioChunks] = useState<Blob[]>([])
  const [isFileUploading, setIsFileUploading] = useState(false)
  const [showFileInput, setShowFileInput] = useState(false)
  
  // Références
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const recordingPausedRef = useRef<boolean>(false)
  const inlineChatInitKeyRef = useRef<string>('')

  // États pour le modal chat
  const [showChatModal, setShowChatModal] = useState(false)
  const [chatSellerId, setChatSellerId] = useState('')
  const [chatSellerName, setChatSellerName] = useState('')
  const [chatSellerAvatar, setChatSellerAvatar] = useState('')

  const [isFreeShippingLabelVisible, setIsFreeShippingLabelVisible] = useState(false)

  const [isPointsModalOpen, setIsPointsModalOpen] = useState(false)
  const [selectedProductForPoints, setSelectedProductForPoints] = useState<any>(null)

  const ensureAuthenticated = (message: string): boolean => requireAuth(message)

  const [hydratedProduct, setHydratedProduct] = useState<Product | null>(null)
  const [isHydratingProduct, setIsHydratingProduct] = useState(false)

  const [debugHydrationState, setDebugHydrationState] = useState<{
    attempted: boolean
    isUuid: boolean
    productId: string
    httpStatus: number | null
    error: string
    vendorId: string
    sellerName: string
  }>({
    attempted: false,
    isUuid: false,
    productId: '',
    httpStatus: null,
    error: '',
    vendorId: '',
    sellerName: ''
  })

  const { freeShippingConfig, deliveryRules } = useDeliveryConfig()

  const productForBadges = (hydratedProduct ?? product) as any

  const vendorIdForBadges = String(
    productForBadges?.seller?.id ?? productForBadges?.vendorId ?? productForBadges?.vendor_id ?? ''
  ).trim()

  const [resolvedVendorIdForBadges, setResolvedVendorIdForBadges] = useState('')

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()
    const direct = String(vendorIdForBadges ?? '').trim()

    if (UUID_REGEX.test(direct)) {
      setResolvedVendorIdForBadges(direct)
      return
    }

    const pid = String(productForBadges?.id ?? '').trim()
    if (!pid) {
      setResolvedVendorIdForBadges('')
      return
    }

    ;(async () => {
      try {
        const res = await fetch(`/api/public/products?id=${encodeURIComponent(pid)}`, { method: 'GET', signal: controller.signal })
        const json = await res.json().catch(() => null)
        const vendorId = String(json?.data?.vendor_id ?? '').trim()
        if (cancelled) return
        setResolvedVendorIdForBadges(UUID_REGEX.test(vendorId) ? vendorId : '')
      } catch (error) {
        if ((error as any)?.name === 'AbortError') return
        console.warn('ProductModal resolveVendorIdForBadges failed to fetch:', {
          url: `/api/public/products?id=${encodeURIComponent(pid)}`,
          productId: pid,
          errorMessage: error instanceof Error ? error.message : String(error),
          error
        })
        if (!cancelled) setResolvedVendorIdForBadges('')
      }
    })()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [productForBadges?.id, vendorIdForBadges])

  const { isOnline } = useVendorPresence(resolvedVendorIdForBadges)
  const isSellerOnline = isOnline === true
  const [vendorSummary, setVendorSummary] = useState<{
    averageRating: number
    reviewCount: number
    avgResponseSeconds: number | null
  } | null>(null)

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()
    const vendorId = UUID_REGEX.test(resolvedVendorIdForBadges) ? resolvedVendorIdForBadges : ''

    if (!vendorId) {
      setVendorSummary(null)
      return
    }

    ;(async () => {
      try {
        const url = `/api/public/vendors/summary?vendorId=${encodeURIComponent(vendorId)}`
        const res = await fetch(url, { method: 'GET', signal: controller.signal })
        const json = await res.json().catch(() => null)
        if (!res.ok) {
          console.warn('ProductModal vendors/summary non-ok response:', {
            url,
            vendorId,
            status: res.status,
            body: json
          })
          return
        }

        const data = json?.data
        const avg = Number(data?.averageRating ?? 0)
        const count = Number(data?.reviewCount ?? 0)
        const respSec = data?.avgResponseSeconds
        const normalizedRespSec = typeof respSec === 'number' && Number.isFinite(respSec) ? respSec : null

        if (!cancelled) {
          setVendorSummary({
            averageRating: Number.isFinite(avg) ? avg : 0,
            reviewCount: Number.isFinite(count) ? count : 0,
            avgResponseSeconds: normalizedRespSec
          })
        }
      } catch (error) {
        if ((error as any)?.name === 'AbortError') return
        console.warn('ProductModal vendors/summary failed to fetch:', {
          url: `/api/public/vendors/summary?vendorId=${encodeURIComponent(vendorId)}`,
          vendorId,
          errorMessage: error instanceof Error ? error.message : String(error),
          error
        })
        // ignore
      }
    })()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [resolvedVendorIdForBadges])

  const responseTimeLabel = (() => {
    const secs = vendorSummary?.avgResponseSeconds
    if (typeof secs !== 'number') {
      return String(productForBadges?.seller?.responseTime ?? '')
    }
    const minutes = Math.max(1, Math.round(secs / 60))
    if (minutes < 60) return `~${minutes} min`
    const hours = Math.round(minutes / 60)
    return `~${hours} h`
  })()

  const ratingLabel = vendorSummary ? vendorSummary.averageRating.toFixed(1) : String(productForBadges?.seller?.rating ?? '')

  /**
   * Construit un libellé "membre depuis" à partir d'une date ISO.
   */
  const buildMemberSinceLabel = (isoDate: string | null): { joinDate: string; memberSince: string } => {
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

  /**
   * Extrait un prix/durée de base pour un mode (standard/express) depuis la config super-admin.
   */
  const getBaseShippingByMode = (mode: 'standard' | 'express') => {
    const rules = Array.isArray(deliveryRules) ? deliveryRules : []
    const normalizeMode = (value: unknown): 'standard' | 'express' | '' => {
      const raw = String(value ?? '').trim().toLowerCase()
      if (!raw) return ''
      if (raw === 'express' || raw.includes('express')) return 'express'
      if (raw === 'standard' || raw.includes('standard')) return 'standard'
      return ''
    }

    const isActiveRule = (r: any): boolean => {
      // Support camelCase (isActive) et snake_case (is_active)
      const v = (r as any)?.isActive
      const vs = (r as any)?.is_active
      if (typeof v === 'boolean') return v
      if (typeof vs === 'boolean') return vs
      // Si le flag n'existe pas, on considère actif par défaut
      return true
    }

    const active = rules.filter((r: any) => isActiveRule(r) && normalizeMode(r?.mode) === mode)
    if (active.length === 0) return null

    const pick = (arr: any[]) => {
      const sorted = [...arr].sort((a, b) => (Number(a?.price ?? 0) || 0) - (Number(b?.price ?? 0) || 0))
      return sorted[0] ?? null
    }

    const best = pick(active)
    if (!best) return null
    const readNumberOrNull = (value: unknown): number | null => {
      if (value == null) return null
      const n = typeof value === 'number' ? value : Number(value)
      return Number.isFinite(n) ? n : null
    }

    const etaMinDays = readNumberOrNull((best as any)?.etaMinDays ?? (best as any)?.eta_min_days)
    const etaMaxDays = readNumberOrNull((best as any)?.etaMaxDays ?? (best as any)?.eta_max_days)

    return {
      price: Number((best as any)?.price ?? 0) || 0,
      etaMinDays,
      etaMaxDays,
      currency: typeof (best as any)?.currency === 'string' ? String((best as any).currency) : 'XOF'
    }
  }

  const addMessage = (
    sessionId: string,
    payload: {
      text: string
      sender: 'user' | 'seller' | 'system'
      type: 'text' | 'system' | 'audio' | 'file'
      timestamp?: Date
      productId?: number
      fileUrl?: string
      fileName?: string
      fileSize?: string
      fileType?: string
    }
  ) => {
    setCurrentSession((prev) => {
      if (!prev || prev.id !== sessionId) return prev
      const nextMessage = {
        id: Date.now().toString(),
        timestamp: payload.timestamp ?? new Date(),
        ...payload
      }
      return {
        ...prev,
        messages: [...prev.messages, nextMessage]
      }
    })
  }

  const setTyping = (sessionId: string, isTyping: boolean) => {
    setCurrentSession((prev) => {
      if (!prev || prev.id !== sessionId) return prev
      return { ...prev, isTyping }
    })
  }

  const handleShare = async (platform: string) => {
    if (!ensureAuthenticated("Connectez-vous pour partager et gagner des points.")) {
      return
    }

    // 0 délai côté UI: on lance l'ouverture immédiatement.
    if (typeof window !== 'undefined') {
      const shareUrl = `${window.location.origin}/product/${encodeURIComponent(String(productForModal?.id ?? ''))}?ref=${encodeURIComponent(String(user?.id ?? ''))}`
      const shareText = `Découvrez ce produit: ${String(productForModal?.name ?? 'Produit')}`

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
            addNotification({
              type: 'success',
              title: 'Lien copié',
              message: 'Collez le lien dans votre story Instagram.',
              duration: 2500
            })
            return true
          default:
            return false
        }

        if (!url) return false
        window.open(url, '_blank', 'width=600,height=400')
        return true
      }

      const opened = await openShareWindow(platform)
      if (!opened) {
        addNotification({
          type: 'error',
          title: 'Plateforme non supportée',
          message: "Ce mode de partage n'est pas disponible.",
          duration: 3000
        })
        return
      }

      addNotification({
        type: 'info',
        title: 'Partage',
        message: `Ouverture du partage...`,
        duration: 2500
      })

      // Sync DB (doit réussir pour être visible dans les dashboards)
      const safeVendorId = String(productForModal?.seller?.id ?? '').trim()
      if (!safeVendorId) {
        addNotification({
          type: 'error',
          title: 'Partage non enregistré',
          message: "Impossible d'identifier le vendeur pour enregistrer le partage.",
          duration: 3000
        })
        return
      }

      try {
        const share = await ShareEngagementService.recordShare(
          String(user?.id ?? ''),
          String(productForModal?.id ?? ''),
          safeVendorId,
          String(platform),
          shareUrl
        )

        if (share?.id) {
          addNotification({
            type: 'success',
            title: 'Partage enregistré',
            message: `Points gagnés: ${Number((share as any)?.points_earned ?? 0) || 0}`,
            duration: 3000
          })

          try {
            const stats = await ShareEngagementService.getProductShareCounts(String(productForModal?.id ?? ''))
            setShareCounts({ total: stats.total, byPlatform: stats.byPlatform })
          } catch {
            // noop
          }
        } else {
          addNotification({
            type: 'error',
            title: 'Partage non enregistré',
            message: "Le partage a été ouvert, mais l'enregistrement n'a pas abouti.",
            duration: 3500
          })
        }
      } catch {
        addNotification({
          type: 'error',
          title: 'Erreur',
          message: "Impossible d'enregistrer le partage.",
          duration: 3500
        })
      }
    }
  }

  // Initialiser les données utilisateur si elles n'existent pas
  useEffect(() => {
    // Vérifier si le produit est dans la wishlist (source de vérité identique au header)
    if (!product) return
    const pid = Number(String((product as any)?.id ?? '')) || 0
    if (!pid) return
    setIsWishlisted(WishlistService.isInWishlist(pid))
  }, [product])

  // Ouvre (ou crée) la session Supabase du chat inline pour ce produit.
  useEffect(() => {
    let cancelled = false

    const run = async () => {
      if (!isOpen) return
      if (!user?.id) return
      if (!product) return

      const key = `${user.id}:${String((product as any)?.id ?? '')}`
      if (inlineChatInitKeyRef.current === key) return
      inlineChatInitKeyRef.current = key

      const vendorId = await resolveVendorIdForProduct()
      const safeVendorId = UUID_REGEX.test(String(vendorId)) ? String(vendorId) : ''
      if (!safeVendorId) return

      const sellerName = String((product as any)?.seller?.name ?? (product as any)?.seller ?? 'Vendeur').trim() || 'Vendeur'
      const sellerAvatar = String((product as any)?.seller?.logo ?? (product as any)?.seller?.avatar ?? '').trim()

      try {
        const sessionId = await createChatSession(safeVendorId, sellerName, sellerAvatar)
        if (!sessionId) return
        if (cancelled) return
        openChatSession(sessionId)
        setCurrentSession({
          id: sessionId,
          isTyping: false,
          messages: []
        })
      } catch {
        // Ignoré: l'UI affichera un chat vide si la session ne peut pas être créée.
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [isOpen, user?.id, (product as any)?.id, createChatSession, openChatSession])

  // Synchronise l'affichage du chat inline avec les messages Supabase.
  useEffect(() => {
    if (!activeChatSession?.id) return
    if (!currentSession || currentSession.id !== activeChatSession.id) {
      // Ne pas vider agressivement l'historique: `syncedMessages` peut être momentanément vide
      // pendant le chargement/transition de session.
      setCurrentSession((prev) => ({
        id: activeChatSession.id,
        isTyping: false,
        messages: prev?.messages ?? []
      }))
    }

    const mapped = (Array.isArray(syncedMessages) ? syncedMessages : []).map((m: any) => {
      const senderRaw = String(m?.sender ?? '').toLowerCase().trim()
      const sender: 'user' | 'seller' | 'system' = senderRaw === 'user' ? 'user' : senderRaw === 'seller' ? 'seller' : 'seller'

      const typeRaw = String(m?.type ?? 'text').toLowerCase().trim()
      const content = String(m?.content ?? '')

      const base = {
        id: String(m?.id ?? ''),
        text: content,
        sender,
        type: 'text' as 'text' | 'system' | 'audio' | 'file',
        timestamp: new Date()
      }

      // Pièces jointes déjà normalisées par useChatContext
      if (typeRaw === 'image' && String(m?.imageUrl ?? '').trim()) {
        return {
          ...base,
          type: 'file' as const,
          fileUrl: String(m.imageUrl),
          fileName: String(m?.fileName ?? 'Image'),
          fileSize: typeof m?.fileSize === 'number' ? formatFileSize(Number(m.fileSize)) : '',
          fileType: 'image'
        }
      }

      if (typeRaw === 'document' && String(m?.fileUrl ?? '').trim()) {
        const mime = String(m?.fileType ?? '').toLowerCase().trim()
        const isAudio = mime.startsWith('audio/')
        return {
          ...base,
          type: (isAudio ? 'audio' : 'file') as any,
          fileUrl: String(m.fileUrl),
          fileName: String(m?.fileName ?? 'Fichier'),
          fileSize: typeof m?.fileSize === 'number' ? formatFileSize(Number(m.fileSize)) : '',
          fileType: isAudio ? 'audio' : (mime.startsWith('video/') ? 'video' : 'file')
        }
      }

      // Product/system: fallback en texte dans le chat inline
      return base
    })

    // Déduplique par id pour éviter les doublons (optimistic + realtime / refresh) qui cassent les keys React.
    const seenIds = new Set<string>()
    const deduped = mapped.filter((msg) => {
      const id = String((msg as any)?.id ?? '')
      if (!id) return true
      if (seenIds.has(id)) return false
      seenIds.add(id)
      return true
    })

    // Si Supabase renvoie temporairement une liste vide (ex: pendant un refresh),
    // on évite d'effacer l'historique déjà affiché.
    if (deduped.length === 0) {
      const existingLen = currentSession?.id === activeChatSession.id ? (currentSession?.messages?.length ?? 0) : 0
      if (existingLen > 0) return
    }

    setCurrentSession((prev) => {
      if (!prev || prev.id !== activeChatSession.id) return prev
      return { ...prev, isTyping: false, messages: deduped }
    })
  }, [activeChatSession?.id, syncedMessages, user?.id])

  /**
   * Hydrate le produit avec les données réelles (vendeur + stats + avis + shipping + images).
   */
  useEffect(() => {
    let cancelled = false

    const hydrate = async () => {
      if (!isOpen) return
      const pid = String((product as any)?.id ?? '').trim()
      const isUuid = Boolean(pid && UUID_REGEX.test(pid))

      if (!isUuid) {
        setDebugHydrationState({
          attempted: false,
          isUuid: false,
          productId: pid,
          httpStatus: null,
          error: 'ID produit non-UUID: hydratation ignorée',
          vendorId: String((product as any)?.vendorId ?? (product as any)?.vendor_id ?? (product as any)?.seller?.id ?? '').trim(),
          sellerName: String((product as any)?.seller?.name ?? (product as any)?.seller ?? '').trim()
        })
        setHydratedProduct(null)
        return
      }

      try {
        setIsHydratingProduct(true)
        setDebugHydrationState((prev) => ({
          ...prev,
          attempted: true,
          isUuid: true,
          productId: pid,
          httpStatus: null,
          error: ''
        }))

        const hydrateUrl = `/api/public/products?id=${encodeURIComponent(pid)}`
        const res = await fetch(hydrateUrl, {
          method: 'GET',
          cache: 'no-store'
        }).catch(() => null)

        if (!res) {
          console.warn('ProductModal hydrate failed to fetch:', {
            url: hydrateUrl,
            productId: pid
          })
          if (cancelled) return
          setDebugHydrationState((prev) => ({
            ...prev,
            attempted: true,
            isUuid: true,
            productId: pid,
            httpStatus: null,
            error: 'fetch() a échoué (réseau ou serveur indisponible)'
          }))
          setHydratedProduct(null)
          return
        }

        const json = await res.json().catch(() => null)
        const data = json?.data
        if (cancelled) return
        if (!data) {
          setDebugHydrationState((prev) => ({
            ...prev,
            attempted: true,
            isUuid: true,
            productId: pid,
            httpStatus: res.status,
            error: 'API a répondu sans data (data=null)'
          }))
          setHydratedProduct(null)
          return
        }

        const images = [String(data?.media?.main_image ?? ''), ...(Array.isArray(data?.media?.images) ? data.media.images : [])]
          .map((x: any) => String(x ?? '').trim())
          .filter((x: string) => x.length > 0)

        const basePrice = Number((data as any)?.price ?? 0) || 0
        const salePriceRaw = (data as any)?.sale_price ?? (data as any)?.salePrice
        const originalPriceRaw = (data as any)?.original_price ?? (data as any)?.originalPrice
        const salePrice = salePriceRaw === null || salePriceRaw === undefined ? null : Number(salePriceRaw) || null
        const originalPrice = originalPriceRaw === null || originalPriceRaw === undefined ? null : Number(originalPriceRaw) || null
        const effectiveApiPrice = (salePrice ?? 0) > 0 ? (salePrice as number) : basePrice

        const manageStock = toBoolean((data as any)?.stock?.manage_stock ?? (data as any)?.manage_stock ?? (data as any)?.manageStock)
        const stockQty = toOptionalNumber((data as any)?.stock?.stock_quantity ?? (data as any)?.stock_quantity ?? (data as any)?.stockQuantity)
        const hasFiniteStockQty = typeof stockQty === 'number' && Number.isFinite(stockQty)
        const inStock = manageStock ? (hasFiniteStockQty ? (stockQty as number) > 0 : true) : true

        const stats = data?.stats ?? null
        const rating = Number(stats?.average_rating ?? 0) || 0
        const reviewCount = Number(stats?.review_count ?? 0) || 0
        const totalSales = Number(stats?.total_sales ?? 0) || 0
        const shareCount = Number(stats?.share_count ?? 0) || 0

        const sellerName = String(data?.seller_name ?? '').trim()
        const sellerAvatar = String(data?.seller_avatar ?? '').trim()
        const sellerPhone = String(data?.seller_phone ?? '').trim()
        const sellerEmail = String(data?.seller_email ?? '').trim()
        const sellerCity = String(data?.seller_city ?? '').trim()
        const sellerCountry = String(data?.seller_country ?? '').trim()
        const sellerCreatedAt =
          typeof data?.seller_created_at === 'string' && data.seller_created_at.length > 0 ? data.seller_created_at : null
        const memberMeta = buildMemberSinceLabel(sellerCreatedAt)

        const warranty = typeof data?.warranty === 'string' ? String(data.warranty).trim() : ''
        const returnPolicy = typeof data?.return_policy === 'string' ? String(data.return_policy).trim() : ''

        const shippingCost = Number(data?.shipping?.shipping_cost ?? 0) || 0
        const apiFreeShipping = Boolean(data?.shipping?.free_shipping)

        const vendorId = typeof data?.vendor_id === 'string' ? String(data.vendor_id).trim() : ''

        const next: Product = {
          ...(product as any),
          id: String(data?.id ?? pid),
          name: String(data?.name ?? (product as any)?.name ?? 'Produit'),
          price: effectiveApiPrice,
          originalPrice: basePrice > 0 ? basePrice : (originalPrice ?? ((product as any)?.originalPrice ?? effectiveApiPrice)),
          rating,
          reviews: reviewCount,
          warranty: warranty || (product as any)?.warranty || '',
          images: images.length > 0 ? images : (product?.images ?? undefined),
          image: images.length > 0 ? images[0] : (product as any)?.image,
          shares: shareCount,
          inStock,
          stock: hasFiniteStockQty ? (stockQty as number) : (product as any)?.stock,
          description: typeof data?.description === 'string' ? data.description : ((product as any)?.description ?? ''),
          returnPolicy: returnPolicy || (product as any)?.returnPolicy || '',
          shipping: {
            ...(product as any)?.shipping,
            cost: apiFreeShipping ? 0 : shippingCost,
            time: (product as any)?.shipping?.time ?? '',
            method: (product as any)?.shipping?.method ?? ''
          },
          seller: {
            ...(product as any)?.seller,
            id: vendorId || (product as any)?.seller?.id,
            name: sellerName || (product as any)?.seller?.name || 'Boutique',
            avatar: sellerAvatar || (product as any)?.seller?.avatar || '/placeholder-user.jpg',
            logo: sellerAvatar || (product as any)?.seller?.logo || '',
            phone: sellerPhone || (product as any)?.seller?.phone || '',
            email: sellerEmail || (product as any)?.seller?.email || '',
            location: [sellerCity, sellerCountry].filter(Boolean).join(', ') || (product as any)?.seller?.location || '',
            totalSales: totalSales || (product as any)?.seller?.totalSales || 0,
            rating:
              (typeof (product as any)?.seller?.rating === 'number' ? (product as any).seller.rating : 0) || rating || 0,
            joinDate: memberMeta.joinDate || (product as any)?.seller?.joinDate || '',
            memberSince: memberMeta.memberSince || (product as any)?.seller?.memberSince || ''
          }
        }

        ;(next as any).api = {
          stats,
          reviews: Array.isArray(data?.reviews) ? data.reviews : [],
          shipping: data?.shipping ?? null
        }

        setDebugHydrationState({
          attempted: true,
          isUuid: true,
          productId: pid,
          httpStatus: res.status,
          error: '',
          vendorId: vendorId,
          sellerName: String(next?.seller?.name ?? '').trim()
        })

        setHydratedProduct(next)
      } catch (error) {
        console.error('ProductModal hydrate exception:', {
          productId: pid,
          error
        })
        const message = error instanceof Error ? error.message : String(error)
        setDebugHydrationState((prev) => ({
          ...prev,
          attempted: true,
          isUuid: true,
          productId: pid,
          httpStatus: null,
          error: message
        }))
        setHydratedProduct(null)
      } finally {
        if (!cancelled) setIsHydratingProduct(false)
      }
    }

    void hydrate()

    return () => {
      cancelled = true
    }
  }, [isOpen, product])

  /**
   * Calcule l'éligibilité au label "Livraison gratuite" à partir de la config Super Admin et du champ produit.
   */
  useEffect(() => {
    let mounted = true

    const loadFreeShippingEligibility = async () => {
      const pid = String((product as any)?.id ?? '').trim()
      if (!pid) {
        if (mounted) setIsFreeShippingLabelVisible(false)
        return
      }

      const vendorFromProp =
        typeof (product as any)?.vendorId === 'string'
          ? String((product as any).vendorId).trim()
          : typeof (product as any)?.seller?.id === 'string'
            ? String((product as any).seller.id).trim()
            : ''

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

    void loadFreeShippingEligibility()

    return () => {
      mounted = false
    }
  }, [freeShippingConfig, product])

  const { offer: bestOffer } = useBestOfferPrice(product?.id)
  const effectivePrice = bestOffer?.price ?? (product?.price ?? 0)
  const effectiveOriginalPrice = bestOffer?.originalPrice ?? ((product as any)?.originalPrice ?? (product?.price ?? 0))
  const effectiveDiscount = bestOffer?.discountPercent ?? (product?.discount ?? 0)

  const productForModal = (hydratedProduct ?? product) as Product

  const computedPointsPrice = useMemo(() => {
    return Math.max(0, Math.round(Number(effectivePrice || 0) / purchaseValue))
  }, [effectivePrice, productForModal, purchaseValue])

  const resolvedSharePointsGlobal = useMemo(() => {
    const safe = Number(sharePointsGlobal)
    return Number.isFinite(safe) && safe >= 0 ? Math.round(safe) : 0
  }, [sharePointsGlobal])

  const resolvedSharePointsPerNetwork = useMemo(() => {
    const raw = (socialSharePerNetwork ?? {}) as Record<string, any>
    const result: Record<string, number> = {}
    Object.entries(raw).forEach(([key, value]) => {
      const normalizedKey = String(key).toLowerCase().trim()
      const numeric = Number(value)
      if (!normalizedKey) return
      if (!Number.isFinite(numeric) || numeric < 0) return
      result[normalizedKey] = Math.round(numeric)
    })
    return result
  }, [socialSharePerNetwork])

  const resolveSharePoints = (platform: string, fallback: number) => {
    const normalized = String(platform ?? '').toLowerCase().trim()
    const value = Number(resolvedSharePointsPerNetwork?.[normalized])
    if (Number.isFinite(value) && value >= 0) return Math.round(value)
    const globalFallback = Number(resolvedSharePointsGlobal)
    if (Number.isFinite(globalFallback) && globalFallback >= 0) return Math.round(globalFallback)
    return fallback
  }

  const [shareCounts, setShareCounts] = useState(() => {
    const rawTotal = Number((productForModal as any)?.shares)
    const total = Number.isFinite(rawTotal) && rawTotal >= 0 ? Math.round(rawTotal) : 0
    return {
      total,
      byPlatform: {
        facebook: 0,
        twitter: 0,
        whatsapp: 0,
        instagram: 0
      }
    }
  })

  useEffect(() => {
    let mounted = true
    const resolvedPid = String((productForModal as any)?.id ?? '').trim()
    if (!resolvedPid) return

    const loadCounts = async () => {
      try {
        const stats = await ShareEngagementService.getProductShareCounts(resolvedPid)
        if (!mounted) return
        setShareCounts({ total: stats.total, byPlatform: stats.byPlatform })
      } catch {
        // noop
      }
    }

    void loadCounts()
    return () => {
      mounted = false
    }
  }, [(productForModal as any)?.id])

  // Fonction utilitaire pour obtenir l'image du produit
  const getProductImage = (index: number = 0) => {
    if (productForModal.images && productForModal.images.length > index) {
      return productForModal.images[index]
    }
    return productForModal.image || "/placeholder.svg"
  }

  // Fonction pour trouver un produit similaire pour la comparaison
  const findSimilarProduct = () => {
    // Simuler une base de données de produits similaires
    const similarProducts = [
      {
        id: productForModal.id + 1,
        name: `${productForModal.name} Pro`,
        price: Math.round(productForModal.price * 1.2),
        originalPrice: Math.round(productForModal.price * 1.4),
        rating: Math.min(5, productForModal.rating + 0.2),
        reviews: Math.round(productForModal.reviews * 0.8),
        images: productForModal.images || [productForModal.image || "/placeholder.svg"],
        seller: {
          name: "Vendeur Premium",
          avatar: "/vendor-avatar.png",
          rating: 4.8,
          totalSales: Math.round((productForModal.seller.totalSales || 100) * 1.1),
          responseTime: "2-4h",
          location: "Abidjan, CI",
          phone: "+225 0701234567",
          email: "premium@probooster.online",
          joinDate: "2023",
          memberSince: "1 an",
          logo: "/placeholder-logo.png"
        },
        description: `Version améliorée de ${productForModal.name} avec des fonctionnalités premium`,
        specifications: {
          ...(productForModal.specifications || {}),
          "Version": "Pro",
          "Garantie": "2 ans",
          "Support": "24/7"
        },
        features: [...(productForModal.features || []), "Support premium", "Garantie étendue"],
        warranty: "2 ans",
        shipping: {
          cost: Math.round((productForModal.shipping?.cost || 1000) * 0.9),
          time: "1-2 jours",
          method: "Express"
        },
        stock: Math.round((productForModal.stock || 10) * 0.7),
        sharePoints: Math.round((productForModal.sharePoints || 100) * 1.3),
        shares: Math.round((productForModal.shares || 50) * 1.2),
        inStock: true,
        discount: 15,
        isHot: true,
        isNew: false,
        isLimited: false,
        badges: [...(productForModal.badges || []), "Premium"],
        color: productForModal.color,
        category: productForModal.category,
        tags: [...(productForModal.tags || []), "premium", "pro"],
        relatedProducts: []
      },
      {
        id: productForModal.id + 2,
        name: `${productForModal.name} Édition Limitée`,
        price: Math.round(productForModal.price * 0.9),
        originalPrice: productForModal.price,
        rating: Math.max(1, productForModal.rating - 0.1),
        reviews: Math.round(productForModal.reviews * 0.6),
        images: productForModal.images || [productForModal.image || "/placeholder.svg"],
        seller: {
          name: "Vendeur Économique",
          avatar: "/vendor-avatar.png",
          rating: 4.2,
          totalSales: Math.round((productForModal.seller.totalSales || 100) * 0.8),
          responseTime: "4-8h",
          location: "Lagos, NG",
          phone: "+234 0801234567",
          email: "eco@probooster.online",
          joinDate: "2024",
          memberSince: "6 mois",
          logo: "/placeholder-logo.png"
        },
        description: `Version économique de ${productForModal.name} avec un excellent rapport qualité-prix`,
        specifications: {
          ...(productForModal.specifications || {}),
          "Version": "Économique",
          "Garantie": "1 an",
          "Support": "Standard"
        },
        features: (productForModal.features || []).filter(f => !f.includes("Premium")),
        warranty: "1 an",
        shipping: {
          cost: Math.round((productForModal.shipping?.cost || 1000) * 1.1),
          time: "3-5 jours",
          method: "Standard"
        },
        stock: Math.round((productForModal.stock || 10) * 1.3),
        sharePoints: Math.round((productForModal.sharePoints || 100) * 0.8),
        shares: Math.round((productForModal.shares || 50) * 0.9),
        inStock: true,
        discount: 25,
        isHot: false,
        isNew: false,
        isLimited: true,
        badges: [...(productForModal.badges || []), "Économique"],
        color: productForModal.color,
        category: productForModal.category,
        tags: [...(productForModal.tags || []), "economique", "bon-prix"],
        relatedProducts: []
      }
    ]

    // Algorithme intelligent pour choisir le produit le plus similaire
    const chooseBestSimilar = () => {
      // Critères de similarité
      const categoryMatch = 0.4 // 40% d'importance pour la catégorie
      const priceMatch = 0.3    // 30% d'importance pour le prix
      const ratingMatch = 0.2   // 20% d'importance pour la note
      const featureMatch = 0.1  // 10% d'importance pour les fonctionnalités
      
      let bestProduct = similarProducts[0]
      let bestScore = 0
      
      similarProducts.forEach(prod => {
        let score = 0
        
        // Score pour la catégorie (même catégorie = 100%)
        if (prod.category === productForModal.category) {
          score += categoryMatch
        }
        
        // Score pour le prix (plus proche = meilleur score)
        const priceDiff = Math.abs(prod.price - productForModal.price) / productForModal.price
        score += priceMatch * (1 - priceDiff)
        
        // Score pour la note (plus proche = meilleur score)
        const ratingDiff = Math.abs(prod.rating - productForModal.rating) / 5
        score += ratingMatch * (1 - ratingDiff)
        
        // Score pour les fonctionnalités (plus de fonctionnalités communes = meilleur score)
        const commonFeatures = prod.features ? prod.features.filter(f => productForModal.features && productForModal.features.includes(f)).length : 0
        const totalFeatures = Math.max(prod.features?.length || 0, productForModal.features?.length || 0)
        score += featureMatch * (totalFeatures > 0 ? commonFeatures / totalFeatures : 0)
        
        if (score > bestScore) {
          bestScore = score
          bestProduct = prod
        }
      })
      
      return bestProduct
    }

    // Retourner le produit le plus similaire selon l'algorithme intelligent
    return chooseBestSimilar()
  }

  const handleQuantityChange = (increment: boolean) => {
    if (increment) {
      const raw = (productForModal as any)?.stock
      const hasFiniteStock = typeof raw === 'number' && Number.isFinite(raw)
      const maxQty = hasFiniteStock ? Math.max(0, Math.trunc(raw)) : null

      setQuantity((prev) => {
        const next = prev + 1
        if (maxQty === null) return next
        return Math.min(next, Math.max(1, maxQty))
      })
    } else {
      setQuantity(prev => Math.max(prev - 1, 1))
    }
  }

  useEffect(() => {
    const raw = (productForModal as any)?.stock
    const hasFiniteStock = typeof raw === 'number' && Number.isFinite(raw)
    const maxQty = hasFiniteStock ? Math.max(0, Math.trunc(raw)) : null
    if (maxQty !== null) {
      setQuantity((prev) => Math.min(prev, Math.max(1, maxQty)))
    }
  }, [productForModal?.stock])

  const handleAddToCart = () => {
    if (!ensureAuthenticated("Connectez-vous pour ajouter au panier.")) {
      return
    }

    const pid = String((productForModal as any)?.id ?? '').trim()
    if (!pid) return

    const debugCart = (() => {
      try {
        return typeof window !== 'undefined' && window.localStorage?.getItem('probooster_debug_cart') === 'true'
      } catch {
        return false
      }
    })()

    try {
      if (debugCart) {
        console.log('[CartDebug] ProductModal:clickAdd', {
          id: pid,
          qty: Math.max(1, Number(quantity) || 1),
          effectivePrice,
          originalPrice: effectiveOriginalPrice
        })
      }

      CartService.addToCart({
        id: pid,
        name: productForModal.name,
        price: effectivePrice,
        originalPrice: effectiveOriginalPrice,
        warranty: String((productForModal as any)?.warranty ?? '').trim() || undefined,
        returnPolicy: String((productForModal as any)?.returnPolicy ?? '').trim() || undefined,
        image: getProductImage(0),
        seller: productForModal.seller.name,
        inStock: Boolean(productForModal.inStock)
      } as any)

      const qty = Math.max(1, Number(quantity) || 1)
      if (qty > 1) {
        const cart = CartService.getCart()
        const currentQty = Array.isArray(cart)
          ? Number((cart.find((it: any) => String(it?.id ?? '') === pid) as any)?.quantity ?? 0)
          : 0
        if (currentQty > 0) {
          CartService.updateQuantity(pid, currentQty + (qty - 1))
        }
      }

      addNotification({
        type: 'success',
        title: 'Panier',
        message: `✅ ${qty} ${productForModal.name} ajouté${qty > 1 ? 's' : ''} au panier !`,
        duration: 3000
      })
    } catch (error) {
      console.error('Erreur lors de l\'ajout au panier:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: `Impossible d'ajouter ${productForModal.name} au panier.`,
        duration: 3500
      })
    }
  }

  /**
   * Ajoute/retire le produit courant des favoris (source de vérité: WishlistService).
   */
  const handleToggleWishlist = () => {
    if (!ensureAuthenticated("Connectez-vous pour gérer vos favoris.")) {
      return
    }

    const pid = String((productForModal as any)?.id ?? '').trim()
    if (!pid) return

    const isInWishlist = WishlistService.isInWishlist(pid)

    if (!isInWishlist) {
      WishlistService.addToWishlist({
        id: pid,
        name: productForModal.name,
        price: effectivePrice,
        image: getProductImage(0),
        seller: productForModal.seller.name
      })

      setIsWishlisted(true)
      addNotification({
        type: 'success',
        title: 'Favoris',
        message: `❤️ ${productForModal.name} ajouté aux favoris !`,
        duration: 3000
      })
      return
    }

    WishlistService.removeFromWishlist(pid)
    setIsWishlisted(false)
    addNotification({
      type: 'info',
      title: 'Favoris',
      message: `💔 ${productForModal.name} retiré des favoris.`,
      duration: 3000
    })
  }

  const handleBuyWithPoints = () => {
    if (!ensureAuthenticated("Connectez-vous pour passer une commande.")) {
      return
    }

    const enriched = {
      ...productForModal,
      pointsPrice: computedPointsPrice
    }
    setSelectedProductForPoints(enriched)
    setIsPointsModalOpen(true)
  }

  /**
   * Callback du modal d'achat avec points.
   */
  const handlePointsPurchase = (selected: any, usePoints: boolean, pointsToUse: number) => {
    addNotification({
      type: 'info',
      title: 'Achat avec points',
      message: usePoints
        ? `Demande d'achat de ${String(selected?.name ?? 'ce produit')} avec ${Number(pointsToUse) || 0} points.`
        : `Demande d'achat de ${String(selected?.name ?? 'ce produit')} (paiement cash).`,
      duration: 4000
    })
  }

  /**
   * Résout l'ID vendeur réel (UUID Supabase) pour un produit.
   */
  const resolveVendorIdForProduct = async (): Promise<string> => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    const direct = String(
      resolvedVendorIdForBadges ||
        ((productForModal as any)?.vendorId ?? (productForModal as any)?.vendor_id ?? (productForModal as any)?.seller?.id ?? '')
    ).trim()
    if (direct && uuidRegex.test(direct)) return direct

    try {
      const res = await fetch(`/api/public/products?id=${encodeURIComponent(String((productForModal as any)?.id ?? ''))}`, {
        method: 'GET'
      })
      const json = await res.json().catch(() => null)
      const vendorId = String(json?.data?.vendor_id ?? '').trim()
      return vendorId
    } catch {
      return ''
    }
  }

  const goToSellerPage = () => {
    const vendorId = String(resolvedVendorIdForBadges ?? '').trim()
    if (UUID_REGEX.test(vendorId)) {
      router.push(`/seller/${vendorId}`)
      return
    }
    router.push(`/seller/${productForModal.seller.name.toLowerCase().replace(/\s+/g, '-')}`)
  }

  /**
   * Ouvre le chat avec le vendeur en utilisant le vendor_id (UUID) réel.
   */
  const openRealSellerChat = async () => {
    if (!ensureAuthenticated("Connectez-vous pour écrire au vendeur.")) {
      return
    }

    try {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      const vendorId = await resolveVendorIdForProduct()
      const safeVendorId = uuidRegex.test(String(vendorId)) ? String(vendorId) : ''
      if (!safeVendorId) {
        toast({
          title: 'Chat indisponible',
          description: "Impossible d'identifier le vendeur de ce produit.",
          variant: 'destructive'
        })
        return
      }

      setChatSellerId(safeVendorId)
      setChatSellerName(productForModal?.seller?.name || 'Vendeur Probooster')
      setChatSellerAvatar(productForModal?.seller?.logo || productForModal?.seller?.avatar || '/placeholder-user.jpg')
      setShowChatModal(true)
    } catch (error) {
      console.error('openRealSellerChat failed:', error)
      toast({
        title: 'Erreur',
        description: "Une erreur est survenue lors de l'ouverture du chat.",
        variant: 'destructive'
      })
    }
  }

  const handleContactSeller = (method: 'chat' | 'phone' | 'email') => {
    switch (method) {
      case 'chat':
        // Ouvrir le modal chat avec les informations du vendeur et du produit (ID réel)
        void openRealSellerChat()
        break
        
      case 'phone':
        // Vérifier si l'appareil supporte les appels
        if (navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry|IEMobile)/)) {
        window.open(`tel:${productForModal.seller.phone}`)
        } else {
          // Copier le numéro dans le presse-papiers
          navigator.clipboard.writeText(productForModal.seller.phone).then(() => {
          addNotification({
            type: 'success',
            title: 'Téléphone',
            message: `📞 Numéro copié : ${productForModal.seller.phone}\n\nAppelez ce numéro pour contacter le vendeur.`,
            duration: 5000
          })
          }).catch(() => {
          addNotification({
            type: 'info',
            title: 'Téléphone',
            message: `📞 Numéro du vendeur : ${productForModal.seller.phone}\n\nCopiez ce numéro pour l'appeler.`,
            duration: 5000
          })
          })
        }
        
        // Message de confirmation - Notification moderne
        addNotification({
          type: 'info',
          title: 'Appel initié',
          message: `📞 Appel vers ${productForModal.seller.phone}`,
          duration: 3000
        })
        break
        
      case 'email':
        const subject = encodeURIComponent(`Question sur le produit : ${productForModal.name}`)
        const body = encodeURIComponent(`Bonjour ${productForModal.seller.name},\n\nJe suis intéressé(e) par votre produit "${productForModal.name}" (ID: ${productForModal.id}).\n\nPouvez-vous me donner plus d'informations sur :\n\n- La disponibilité\n- Les options de livraison\n- Les garanties\n- Les prix\n\nMerci d'avance !\n\nCordialement,`)
        
        window.open(`mailto:${productForModal.seller.email}?subject=${subject}&body=${body}`)
        
        // Notification de confirmation email
        addNotification({
          type: 'info',
          title: 'Email ouvert',
          message: `📧 Email ouvert vers ${productForModal.seller.email}`,
          duration: 3000
        })
        break
    }
  }

  const handleSendChatMessage = () => {
    if (!chatInput.trim()) return

    // Utilise le chat Supabase synchronisé (même historique partout)
    if (!user?.id || !activeChatSession) return
    void sendSyncedMessage(chatInput.trim())
    setChatInput("")
  }

  const handleChatAction = (action: 'buy' | 'cart' | 'wishlist') => {
    if (!ensureAuthenticated("Connectez-vous pour passer une commande.")) {
      return
    }

    const pid = String((productForModal as any)?.id ?? '').trim()
    const pointsPrice = Number(computedPointsPrice ?? 0) || 0

    switch (action) {
      case 'buy':
        // Ne pas bloquer si points insuffisants: ouvrir le modal et laisser choisir (points/mixte/cash).
        handleBuyWithPoints()
        break
        
      case 'cart':
        {
          // Synchronisation identique au header: CartService (émet cartUpdated)
          CartService.addToCart({
            id: pid,
            name: productForModal.name,
            price: effectivePrice,
            originalPrice: effectiveOriginalPrice,
            warranty: String((productForModal as any)?.warranty ?? '').trim() || undefined,
            returnPolicy: String((productForModal as any)?.returnPolicy ?? '').trim() || undefined,
            image: getProductImage(0),
            seller: productForModal.seller.name,
            inStock: Boolean(productForModal.inStock)
          })

          const existingCart = CartService.getCart()

          const cartMessage = {
            id: Date.now().toString(),
            text: `✅ ${productForModal.name} ajouté au panier !\n🛒 Votre panier contient maintenant ${existingCart.length} article${existingCart.length > 1 ? 's' : ''}.`,
            sender: 'system',
            timestamp: new Date(),
            type: 'system'
          }
          if (currentSession) {
            addMessage(currentSession.id, {
              text: `✅ ${productForModal.name} ajouté au panier !\n🛒 Votre panier contient maintenant ${existingCart.length} article${existingCart.length > 1 ? 's' : ''}.`,
              sender: 'system',
              type: 'system',
              productId: pid
            })
          }
          break
        }
        
      case 'wishlist':
        {
          // Synchronisation identique au header: WishlistService (émet wishlistUpdated)
          const isInWishlist = WishlistService.isInWishlist(pid)

          if (!isInWishlist) {
            WishlistService.addToWishlist({
              id: pid,
              name: productForModal.name,
              price: effectivePrice,
              image: getProductImage(0),
              seller: productForModal.seller.name
            })

            setIsWishlisted(true)

            const existingWishlist = WishlistService.getWishlist()
            
            const wishlistMessage = {
              id: Date.now().toString(),
              text: `❤️ ${productForModal.name} ajouté aux favoris !\n💝 Vous avez maintenant ${existingWishlist.length} favori${existingWishlist.length > 1 ? 's' : ''}.`,
              sender: 'system',
              timestamp: new Date(),
              type: 'system'
            }
            if (currentSession) {
              addMessage(currentSession.id, {
                text: `❤️ ${productForModal.name} ajouté aux favoris !\n💝 Vous avez maintenant ${existingWishlist.length} favori${existingWishlist.length > 1 ? 's' : ''}.`,
                sender: 'system',
                type: 'system',
                productId: pid
              })
            }
          } else {
            WishlistService.removeFromWishlist(pid)
            setIsWishlisted(false)
            if (currentSession) {
              addMessage(currentSession.id, {
                text: `💔 ${productForModal.name} retiré des favoris.`,
                sender: 'system',
                type: 'system',
                productId: pid
              })
            }
          }
          break
        }
    }
  }

  // Fonctionnalités vocales
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: Blob[] = []
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }
      
      recorder.onstop = async () => {
        try {
          if (!activeChatSession) return
          const mime = recorder.mimeType || 'audio/webm'
          const audioBlob = new Blob(chunks, { type: mime })
          if (audioBlob.size <= 0) return
          const file = new globalThis.File([audioBlob], `audio_${Date.now()}.webm`, { type: audioBlob.type || mime })
          await sendSyncedMessage('Message audio', 'document', undefined, file)
        } finally {
          setAudioChunks([])
          setRecordingTime(0)
        }
      }
      
      recorder.start()
      setMediaRecorder(recorder)
      setAudioChunks(chunks)
      setIsRecording(true)
      setRecordingPaused(false)
      recordingPausedRef.current = false
      
      // Démarrer le chronomètre
      recordingIntervalRef.current = setInterval(() => {
        if (recordingPausedRef.current) return
        setRecordingTime(prev => prev + 1)
      }, 1000)
      
    } catch (error) {
      console.error('Erreur lors de l\'accès au microphone:', error)
      
      // Gestion intelligente des erreurs de microphone
      let errorMessage = 'Impossible d\'accéder au microphone.'
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Permission microphone refusée. Cliquez sur l\'icône microphone dans la barre d\'adresse pour autoriser l\'accès.'
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'Aucun microphone détecté. Vérifiez que votre appareil dispose d\'un microphone.'
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'Le microphone est utilisé par une autre application. Fermez les autres applications qui utilisent le microphone.'
        } else {
          errorMessage = `Erreur microphone: ${error.message}`
        }
      }
      
      // Notification d'erreur microphone
      addNotification({
        type: 'error',
        title: 'Erreur Microphone',
        message: `${errorMessage}\n\nSolutions:\n• Vérifiez les permissions du navigateur\n• Cliquez sur l'icône microphone dans la barre d'adresse\n• Rafraîchissez la page et réessayez`,
        duration: 8000
      })
    }
  }
  
  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop()
      mediaRecorder.stream.getTracks().forEach(track => track.stop())
      setIsRecording(false)
      setRecordingPaused(false)
      recordingPausedRef.current = false
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
        recordingIntervalRef.current = null
      }
    }
  }

  const toggleRecordingPause = () => {
    if (!mediaRecorder || !isRecording) return
    try {
      if (recordingPaused) {
        mediaRecorder.resume()
        setRecordingPaused(false)
        recordingPausedRef.current = false
      } else {
        mediaRecorder.pause()
        setRecordingPaused(true)
        recordingPausedRef.current = true
      }
    } catch (error) {
      console.error('toggleRecordingPause failed:', error)
      addNotification({
        type: 'error',
        title: 'Enregistrement',
        message: "Impossible de mettre en pause/reprendre l'enregistrement.",
        duration: 3500
      })
    }
  }

  const getFileType = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.startsWith('audio/')) return 'audio'
    if (mimeType.includes('pdf')) return 'pdf'
    if (mimeType.includes('word') || mimeType.includes('document')) return 'document'
    return 'file'
  }

  /**
   * Envoie des pièces jointes depuis le chat inline.
   * IMPORTANT: passe par Supabase (upload + contenu encodé) afin que vendeur/super-admin puissent les voir.
   */
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    if (files.length === 0) return

    if (!activeChatSession) {
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setIsFileUploading(true)
    try {
      for (const file of files) {
        const mime = String(file.type ?? '').toLowerCase().trim()
        const type: 'image' | 'document' = mime.startsWith('image/') ? 'image' : 'document'
        await sendSyncedMessage(file.name || 'Pièce jointe', type, undefined, file)
      }
    } catch (error) {
      console.error('handleFileSelect failed:', error)
      addNotification({
        type: 'error',
        title: 'Pièce jointe',
        message: "Impossible d'envoyer la pièce jointe.",
        duration: 4000
      })
    } finally {
      setIsFileUploading(false)
      setShowFileInput(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }
  
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
  
  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'image': return <ImageIcon className="h-4 w-4" />
      case 'video': return <Video className="h-4 w-4" />
      case 'audio': return <Music className="h-4 w-4" />
      case 'pdf': return <FileText className="h-4 w-4" />
      case 'document': return <FileText className="h-4 w-4" />
      default: return <FileIcon className="h-4 w-4" />
    }
  }

  // IMPORTANT: aucun hook après ce point.
  // Si le produit n'est pas encore disponible, on affiche un contenu minimal dans le modal.
  if (!product) {
    return (
      <>
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="max-w-6xl h-[90vh] overflow-hidden p-0">
            <div className="h-full overflow-y-auto overscroll-contain touch-pan-y [-webkit-overflow-scrolling:touch]">
              <DialogHeader className="sr-only">
                <DialogTitle>Détails du produit</DialogTitle>
              </DialogHeader>
              <div className="p-6 text-sm text-gray-600">Chargement du produit…</div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] overflow-hidden p-0">
        <div className="h-full overflow-y-auto overscroll-contain touch-pan-y [-webkit-overflow-scrolling:touch]">
          <DialogHeader className="sr-only">
            <DialogTitle>Détails du produit - {productForModal.name}</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <div className="px-6 py-3 text-xs text-gray-700 border-b bg-gray-50">
              <div className="font-semibold">
                Debug produit: {debugHydrationState.isUuid ? 'Réel (UUID)' : 'Démo (non-UUID)'}
              </div>
              <div>
                id: <span className="font-mono">{debugHydrationState.productId || String((productForModal as any)?.id ?? '')}</span>
              </div>
              <div>
                vendorId: <span className="font-mono">{debugHydrationState.vendorId || String((productForModal as any)?.vendorId ?? (productForModal as any)?.seller?.id ?? '')}</span>
              </div>
              <div>
                seller: <span className="font-mono">{debugHydrationState.sellerName || String((productForModal as any)?.seller?.name ?? (productForModal as any)?.seller ?? '')}</span>
              </div>
              <div>
                hydratation: {debugHydrationState.attempted ? 'tentée' : 'non tentée'}
                {debugHydrationState.httpStatus !== null ? ` • HTTP ${debugHydrationState.httpStatus}` : ''}
                {debugHydrationState.error ? ` • ${debugHydrationState.error}` : ''}
              </div>
            </div>
            {isHydratingProduct && (
              <div className="px-6 py-3 text-sm text-gray-600 border-b bg-white">
                Chargement des informations produit…
              </div>
            )}
          </div>

          <div className="px-6 pt-4">
            <EditableMessagesBanner location="product_page" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Left Column - Images */}
            <div className="relative bg-gray-50 p-6">
              <div className="space-y-4">
                {/* Main Image */}
                <div className="aspect-square overflow-hidden rounded-xl border-2 border-gray-100 shadow-lg">
                  <Image
                    src={productForModal.images ? productForModal.images[selectedImage] : productForModal.image || "/placeholder.svg"}
                    alt={productForModal.name}
                    width={600}
                    height={600}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                  
                  {/* Image Navigation - Only show if multiple images exist */}
                  {productForModal.images && productForModal.images.length > 1 && (
                  <div className="absolute top-4 left-4 flex space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="bg-white/90 hover:bg-white shadow-lg transform hover:scale-110 active:scale-95 transition-all duration-300"
                      onClick={() => setSelectedImage(prev => Math.max(prev - 1, 0))}
                      disabled={selectedImage === 0}
                    >
                      <ChevronLeft className="h-4 w-4 animate-pulse" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="bg-white/90 hover:bg-white shadow-lg transform hover:scale-110 active:scale-95 transition-all duration-300"
                        onClick={() => setSelectedImage(prev => Math.min(prev + 1, (productForModal.images?.length || 1) - 1))}
                        disabled={selectedImage === (productForModal.images?.length || 1) - 1}
                    >
                      <ChevronRight className="h-4 w-4 animate-pulse" />
                    </Button>
                  </div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2">
                    {effectiveDiscount > 0 && (
                      <Badge className="bg-red-500 text-white animate-pulse shadow-lg">
                        -{effectiveDiscount}%
                      </Badge>
                    )}
                    {product.isHot && (
                      <Badge className="bg-orange-500 text-white animate-bounce shadow-lg">
                        🔥 HOT
                      </Badge>
                    )}
                    {product.isNew && (
                      <Badge className="bg-green-500 text-white animate-pulse shadow-lg">
                        🆕 NOUVEAU
                      </Badge>
                    )}
                    {product.isLimited && (
                      <Badge className="bg-purple-500 text-white animate-pulse shadow-lg">
                        ⏰ LIMITÉ
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Thumbnail Images - Only show if multiple images exist */}
                {product.images && product.images.length > 1 && (
                <div className="grid grid-cols-5 gap-2">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-square overflow-hidden rounded-lg border-2 transition-all duration-300 ${
                        selectedImage === index 
                          ? "border-[#ff6600] shadow-lg scale-105" 
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <Image
                        src={image || "/placeholder.svg"}
                        alt={`${productForModal.name} ${index + 1}`}
                        width={100}
                        height={100}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
                )}
              </div>
            </div>
            {/* Right Column - Product Info */}
            <div className="p-6 space-y-6">
              {/* Product Header */}
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">{productForModal.name}</h2>
                    <div className="flex items-center space-x-4 mb-3">
                      <div className="flex items-center space-x-1">
                        <Star className="h-5 w-5 text-yellow-400 fill-current" />
                        <span className="font-semibold text-gray-900">{product.rating}</span>
                        <span className="text-gray-500">({product.reviews} avis)</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {product.category}
                      </Badge>
                    </div>
                  </div>
                  
                                     <div className="flex space-x-2">
                     <Button
                       variant="ghost"
                       size="icon"
                       onClick={handleToggleWishlist}
                       className={`${isWishlisted ? 'text-red-500 bg-red-50' : 'text-gray-400'} hover:text-red-500 hover:bg-red-50 transition-all duration-300 transform hover:scale-110 active:scale-95`}
                     >
                       <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current animate-pulse' : 'hover:scale-110'} transition-all duration-300`} />
                     </Button>
                    <ShareButtons
                      productId={String(productForModal.id)}
                      productName={productForModal.name}
                      vendorId={productForModal.seller.id || 'unknown'}
                    />
                  </div>
                </div>

                {/* Price Section */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl font-bold text-[#ff6600]">
                      {effectivePrice.toLocaleString()} FCFA
                    </span>
                    {effectiveOriginalPrice > effectivePrice && (
                      <span className="text-xl text-gray-400 line-through">
                        {effectiveOriginalPrice.toLocaleString()} FCFA
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Coins className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm text-gray-600">
                      {computedPointsPrice} points
                    </span>
                  </div>
                </div>

                {/* Stock Status */}
                <div className="flex items-center space-x-2">
                  {productForModal.inStock ? (
                    <div className="flex items-center space-x-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      {typeof (productForModal as any)?.stock === 'number' && Number.isFinite((productForModal as any).stock) ? (
                        <span className="text-sm font-medium">En stock ({Math.max(0, Math.trunc((productForModal as any).stock))} disponibles)</span>
                      ) : (
                        <span className="text-sm font-medium">En stock (∞)</span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Rupture de stock</span>
                    </div>
                  )}
                </div>

                {isFreeShippingLabelVisible && (
                  <div className="mt-2">
                    <Badge className="w-fit bg-gradient-to-r from-emerald-500 to-green-600 text-white border-0 shadow-sm">
                      Livraison gratuite
                    </Badge>
                  </div>
                )}
              </div>

              {/* Quantity Selector */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Quantité</label>
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(false)}
                    disabled={quantity <= 1}
                    className="transform hover:scale-110 active:scale-95 transition-all duration-300 hover:bg-red-50 hover:border-red-300"
                  >
                    <Minus className="h-4 w-4 animate-pulse" />
                  </Button>
                  <span className="w-16 text-center font-semibold animate-pulse">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(true)}
                    disabled={
                      typeof (productForModal as any)?.stock === 'number' &&
                      Number.isFinite((productForModal as any).stock) &&
                      quantity >= Math.max(1, Math.trunc((productForModal as any).stock))
                    }
                    className="transform hover:scale-110 active:scale-95 transition-all duration-300 hover:bg-green-50 hover:border-green-300"
                  >
                    <Plus className="h-4 w-4 animate-pulse" />
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  className="bg-[#ff6600] hover:bg-[#e55a00] text-white py-3 text-lg font-semibold transform hover:scale-105 transition-all duration-300 hover:shadow-lg active:scale-95"
                  onClick={handleAddToCart}
                  disabled={!productForModal.inStock}
                >
                  <ShoppingCart className="h-5 w-5 mr-2 animate-bounce" />
                  Ajouter au panier
                </Button>
                
                <Button 
                  variant="outline" 
                  className="border-purple-200 text-purple-600 hover:bg-purple-50 py-3 transform hover:scale-105 transition-all duration-300 hover:shadow-md active:scale-95 hover:border-purple-300 group"
                  onClick={handleBuyWithPoints}
                  disabled={!productForModal.inStock}
                >
                  <div className="relative mr-2">
                    <Coins className="h-5 w-5 animate-bounce group-hover:animate-spin" />
                    {/* Pièce animée en haut à droite */}
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-ping group-hover:animate-bounce"></div>
                    {/* Pièce animée en bas à gauche */}
                    <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse group-hover:animate-ping" style={{ animationDelay: '0.5s' }}></div>
                    {/* Pièce animée au centre */}
                    <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-yellow-300 rounded-full animate-pulse group-hover:animate-bounce" style={{ animationDelay: '1s' }}></div>
                    {/* Effet de brillance */}
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-200/30 to-transparent rounded-full animate-pulse group-hover:animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                    {/* Pièces supplémentaires au survol */}
                    <div className="absolute -top-2 -right-2 w-1 h-1 bg-yellow-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-bounce transition-opacity duration-300" style={{ animationDelay: '0.2s' }}></div>
                    <div className="absolute -bottom-2 -left-2 w-1 h-1 bg-yellow-500 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-bounce transition-opacity duration-300" style={{ animationDelay: '0.7s' }}></div>
                  </div>
                  Acheter avec points
                </Button>
              </div>

              {/* Seller Info */}
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="relative">
                      {productForModal.seller.logo ? (
                        <Image 
                          src={productForModal.seller.logo || "/placeholder-logo.svg"}
                          alt={`Logo ${productForModal.seller.name}`}
                          width={40}
                          height={40}
                          className="rounded-full object-cover border-2 border-white shadow-md"
                        />
                      ) : (
                        <Avatar className="h-10 w-10 ring-2 ring-white shadow-md">
                          <AvatarImage src={productForModal.seller.avatar} />
                          <AvatarFallback>{productForModal.seller.name ? productForModal.seller.name[0] : 'U'}</AvatarFallback>
                        </Avatar>
                      )}
                      <span
                        className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white ${
                          isSellerOnline ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                      ></span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 
                          className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors duration-300"
                          onClick={goToSellerPage}
                        >
                          {productForModal.seller.name}
                        </h4>
                        <Badge variant="outline" className="text-[10px] border-green-200 text-green-600 bg-green-50 px-1.5 py-0 rounded-full">
                          <span
                            className={`h-1.5 w-1.5 rounded-full mr-1 ${
                              isSellerOnline ? 'bg-green-500' : 'bg-gray-400'
                            }`}
                          ></span>
                          {isSellerOnline ? 'Actif' : 'Hors ligne'}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Star className="h-3 w-3 text-yellow-400 fill-current" />
                        <span>{ratingLabel || productForModal.seller.rating}</span>
                        <span>•</span>
                        <span>{Number.isFinite(productForModal.seller.totalSales) ? productForModal.seller.totalSales : 0} ventes</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>Membre depuis {productForModal.seller.memberSince || "Nouveau"}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-green-200 text-green-600 hover:bg-green-50 transform hover:scale-105 transition-all duration-300 hover:shadow-md active:scale-95 hover:border-green-300"
                      onClick={() => handleContactSeller('chat')}
                    >
                      <MessageCircle className="h-4 w-4 mr-2 animate-pulse" />
                      Chat
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50 transform hover:scale-105 transition-all duration-300 hover:shadow-md active:scale-95 hover:border-blue-300"
                      onClick={() => handleContactSeller('phone')}
                    >
                      <Phone className="h-4 w-4 mr-2 animate-bounce" />
                      Appeler
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-gray-200 text-gray-600 hover:bg-gray-50 transform hover:scale-105 transition-all duration-300 hover:shadow-md active:scale-95 hover:border-gray-300"
                      onClick={() => handleContactSeller('email')}
                    >
                      <Mail className="h-4 w-4 mr-2 animate-pulse" />
                      Email
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Info */}
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <Truck className="h-5 w-5 text-blue-600" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Livraison</h4>
                      <p className="text-sm text-gray-600">
                        {(() => {
                          const cost = Number(productForModal.shipping?.cost ?? 0) || 0
                          const std = getBaseShippingByMode('standard')
                          const apiFree = Boolean((productForModal as any)?.api?.shipping?.free_shipping)
                          const isFreeByRules = isFreeShippingLabelVisible === true
                          const fmtEta = (min: number | null, max: number | null) => {
                            if (min != null && max != null) return `${min}-${max} jours`
                            if (min != null) return `${min}+ jours`
                            if (max != null) return `≤ ${max} jours`
                            return ''
                          }

                          const derivedTime = std ? fmtEta(std.etaMinDays, std.etaMaxDays) : ''
                          const time = String(productForModal.shipping?.time ?? '').trim() || derivedTime || '3-5 jours'

                          const isFree = apiFree || isFreeByRules
                          const derivedCost = std ? (Number(std.price ?? 0) || 0) : 0
                          const effectiveCost = isFree ? 0 : (cost > 0 ? cost : derivedCost)
                          const costLabel = isFree
                            ? 'Gratuite'
                            : `${Math.ceil(effectiveCost).toLocaleString()} FCFA`
                          return `${costLabel} • ${time}`
                        })()}
                      </p>
                      <div className="mt-1 text-xs text-gray-600">
                        {(() => {
                          const std = getBaseShippingByMode('standard')
                          const exp = getBaseShippingByMode('express')
                          const fmtEta = (min: number | null, max: number | null) => {
                            if (min != null && max != null) return `${min}-${max} jours`
                            if (min != null) return `${min}+ jours`
                            if (max != null) return `≤ ${max} jours`
                            return ''
                          }

                          const renderLine = (label: string, row: any) => {
                            if (!row) return null
                            const eta = fmtEta(row.etaMinDays, row.etaMaxDays)
                            const price = `${Math.ceil(Number(row.price ?? 0) || 0).toLocaleString()} FCFA`
                            return (
                              <div>
                                <span className={label === 'Express' ? 'font-semibold text-pink-700' : 'font-semibold text-blue-700'}>
                                  {label}
                                </span>
                                : {price}{eta ? ` • ${eta}` : ''}
                              </div>
                            )
                          }

                          const stdLine = renderLine('Standard', std)
                          const expLine = renderLine('Express', exp)
                          if (!stdLine && !expLine) return null

                          return (
                            <div>
                              <div className="text-gray-500">Base (zone locale) :</div>
                              {stdLine}
                              {expLine}
                              <div className="mt-1 font-semibold text-orange-700">Autres zones : au panier</div>
                            </div>
                          )
                        })()}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center space-x-3">
                      <Shield className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-gray-600">Garantie {String((productForModal as any)?.warranty ?? '').trim() || '1 an'}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <RefreshCw className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-gray-600">
                        Retours: {String((productForModal as any)?.returnPolicy ?? '').trim() || '30 jours satisfait ou remboursé'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Section Récompenses et Points - Design Élégant */}
            <div className="mt-6">
              <Card className="border border-gray-200 shadow-sm">
                <CardContent className="p-4">
                  {/* En-tête simple */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <Coins className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Gagnez des points</h3>
                        <p className="text-sm text-gray-500">Partagez et cumulez des récompenses</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs border-green-200 text-green-600">
                      +{sharePointsGlobal} pts
                    </Badge>
                  </div>

                  {/* Statistiques simples */}
                  <div className="flex justify-between mb-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-gray-900">{sharePointsGlobal}</div>
                      <div className="text-xs text-gray-500">Points à gagner</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-900">{shareCounts.total}</div>
                      <div className="text-xs text-gray-500">Partages</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-900">{sharePointsGlobal}</div>
                      <div className="text-xs text-gray-500">Points/partage</div>
                    </div>
                  </div>

                  {/* Boutons de partage ronds */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Partagez sur :</h4>
                    
                    <div className="flex justify-center space-x-4">
                      {/* WhatsApp */}
                      <div className="flex flex-col items-center">
                        <Button
                          onClick={() => handleShare('whatsapp')}
                          size="icon"
                          className="w-12 h-12 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-sm hover:shadow-md transition-all duration-300 hover:scale-110 active:scale-95 group"
                        >
                          <div className="relative">
                          <svg className="w-5 h-5 fill-current group-hover:animate-bounce" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                          </svg>
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-opacity duration-300"></div>
                          </div>
                        </Button>
                        <div className="mt-1 text-[11px] text-gray-500">+{resolveSharePoints('whatsapp', sharePointsGlobal)} pts</div>
                      </div>

                      {/* Facebook */}
                      <div className="flex flex-col items-center">
                        <Button
                          onClick={() => handleShare('facebook')}
                          size="icon"
                          className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all duration-300 hover:scale-110 active:scale-95 group"
                        >
                          <div className="relative">
                          <svg className="w-5 h-5 fill-current group-hover:animate-bounce" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-opacity duration-300"></div>
                          </div>
                        </Button>
                        <div className="mt-1 text-[11px] text-gray-500">+{resolveSharePoints('facebook', sharePointsGlobal)} pts</div>
                      </div>

                      {/* X (Twitter) */}
                      <div className="flex flex-col items-center">
                        <Button
                          onClick={() => handleShare('twitter')}
                          size="icon"
                          className="w-12 h-12 rounded-full bg-black hover:bg-gray-800 text-white shadow-sm hover:shadow-md transition-all duration-300 hover:scale-110 active:scale-95 group"
                        >
                          <div className="relative">
                          <svg className="w-5 h-5 fill-current group-hover:animate-bounce" viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                          </svg>
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-opacity duration-300"></div>
                          </div>
                        </Button>
                        <div className="mt-1 text-[11px] text-gray-500">+{resolveSharePoints('twitter', sharePointsGlobal)} pts</div>
                      </div>

                      {/* Instagram */}
                      <div className="flex flex-col items-center">
                        <Button
                          onClick={() => handleShare('instagram')}
                          size="icon"
                          className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 hover:from-purple-700 hover:via-pink-700 hover:to-orange-600 text-white shadow-sm hover:shadow-md transition-all duration-300 hover:scale-110 active:scale-95 group"
                        >
                          <div className="relative">
                          <svg className="w-5 h-5 fill-current group-hover:animate-bounce" viewBox="0 0 24 24">
                            <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323c-.875.807-2.026 1.297-3.323 1.297zm7.718-1.297c-.875.807-2.026 1.297-3.323 1.297s-2.448-.49-3.323-1.297c-.807-.875-1.297-2.026-1.297-3.323s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323z"/>
                          </svg>
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-opacity duration-300"></div>
                          </div>
                        </Button>
                        <div className="mt-1 text-[11px] text-gray-500">+{resolveSharePoints('instagram', sharePointsGlobal)} pts</div>
                      </div>
                    </div>

                    {/* Progression simple */}
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">Progression</span>
                        <span className="text-xs text-gray-600 font-medium">75%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: '75%' }}></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>Bronze</span>
                        <span>Argent</span>
                      </div>
                    </div>
                   </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Bottom Section - Tabs */}
          <div className="border-t border-gray-200 p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details" className="flex items-center space-x-2">
                  <Info className="h-4 w-4" />
                  <span>Détails</span>
                </TabsTrigger>
                <TabsTrigger value="specs" className="flex items-center space-x-2">
                  <Award className="h-4 w-4" />
                  <span>Spécifications</span>
                </TabsTrigger>
                <TabsTrigger value="reviews" className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Avis ({product.reviews})</span>
                </TabsTrigger>
                <TabsTrigger value="seller" className="flex items-center space-x-2">
                  <Crown className="h-4 w-4" />
                  <span>Vendeur</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="mt-6">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900">Description</h3>
                  <p className="text-gray-600 leading-relaxed">{product.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Caractéristiques</h4>
                      <ul className="space-y-1">
                        {product.features && product.features.length > 0 ? (
                          product.features.map((feature, index) => (
                          <li key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span>{feature}</span>
                          </li>
                          ))
                        ) : (
                          <li className="text-sm text-gray-500 italic">Aucune caractéristique disponible</li>
                        )}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {product.tags && product.tags.length > 0 ? (
                          product.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-gray-500 italic">Aucun tag disponible</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="specs" className="mt-6">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900">Spécifications techniques</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {product.specifications && Object.keys(product.specifications).length > 0 ? (
                      Object.entries(product.specifications).map(([key, value]) => (
                      <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-700">{key}</span>
                        <span className="text-gray-600">{value}</span>
                      </div>
                      ))
                    ) : (
                      <div className="col-span-2 text-center py-8 text-gray-500 italic">
                        Aucune spécification technique disponible
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="reviews" className="mt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900">Avis clients</h3>
                    <div className="flex items-center space-x-2">
                      <Star className="h-5 w-5 text-yellow-400 fill-current" />
                      <span className="font-semibold">{product.rating}</span>
                      <span className="text-gray-500">/ 5</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {/* Rating breakdown */}
                    <div className="space-y-2">
                      {(() => {
                        const rows = Array.isArray((product as any)?.api?.reviews) ? (product as any).api.reviews : []
                        const total = rows.length
                        const counts = new Map<number, number>([
                          [1, 0],
                          [2, 0],
                          [3, 0],
                          [4, 0],
                          [5, 0]
                        ])

                        rows.forEach((r: any) => {
                          const val = Math.round(Number(r?.rating ?? 0) || 0)
                          if (val >= 1 && val <= 5) counts.set(val, (counts.get(val) ?? 0) + 1)
                        })

                        return [5, 4, 3, 2, 1].map((stars) => {
                          const count = counts.get(stars) ?? 0
                          const percent = total > 0 ? Math.round((count / total) * 100) : 0
                          return (
                            <div key={stars} className="flex items-center space-x-2">
                              <span className="text-sm text-gray-600 w-8">{stars}★</span>
                              <Progress value={percent} className="flex-1 h-2" />
                              <span className="text-sm text-gray-500 w-12">{percent}%</span>
                            </div>
                          )
                        })
                      })()}
                    </div>

                    {/* Liste des avis (données réelles) */}
                    <div className="space-y-4 pt-2">
                      {(() => {
                        const rows = Array.isArray((product as any)?.api?.reviews) ? (product as any).api.reviews : []
                        if (rows.length === 0) {
                          return (
                            <div className="text-sm text-gray-500 italic">
                              Aucun avis pour ce produit pour le moment.
                            </div>
                          )
                        }

                        return rows.map((review: any) => {
                          const userName = String(review?.userName ?? 'Client')
                          const userAvatar = String(review?.userAvatar ?? '')
                          const rating = Math.max(0, Math.min(5, Math.round(Number(review?.rating ?? 0) || 0)))
                          const title = String(review?.title ?? '')
                          const comment = String(review?.comment ?? '')
                          const verified = Boolean(review?.verified)
                          const dateLabel = formatIsoDateForUi(review?.createdAt)

                          return (
                            <div key={String(review?.id ?? Math.random())} className="border-b pb-4 last:border-b-0">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <Avatar className="h-7 w-7">
                                    <AvatarImage src={userAvatar || '/placeholder-user.jpg'} />
                                    <AvatarFallback>{userName ? userName[0] : 'C'}</AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium text-gray-900">{userName}</span>
                                  {verified && (
                                    <Badge variant="outline" className="text-xs">
                                      Achat vérifié
                                    </Badge>
                                  )}
                                </div>
                                {dateLabel && <span className="text-xs text-gray-500">{dateLabel}</span>}
                              </div>

                              <div className="flex items-center mb-2">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                  />
                                ))}
                              </div>

                              {title && <div className="text-sm font-semibold text-gray-900 mb-1">{title}</div>}
                              {comment && <div className="text-sm text-gray-700">{comment}</div>}
                            </div>
                          )
                        })
                      })()}
                    </div>
                    
                    <div className="text-center py-4">
                      <Button 
                        variant="outline" 
                        className="w-full transform hover:scale-105 transition-all duration-300 hover:shadow-md active:scale-95 hover:bg-blue-50 hover:border-blue-300"
                        onClick={() => {
                          const reviewData = {
                            productId: productForModal.id,
                            productName: productForModal.name,
                            rating: 0,
                            comment: '',
                            date: new Date().toISOString()
                          }
                          
                          // Simuler l'ouverture d'un formulaire d'avis
                          const reviewMessage = {
                            id: Date.now().toString(),
                            text: `📝 Formulaire d'avis ouvert pour ${productForModal.name}.\n\nVeuillez remplir le formulaire qui s'ouvre dans un nouvel onglet.`,
                            sender: 'system',
                            timestamp: new Date(),
                            type: 'system'
                          }
                          
                          // Notification pour l'ouverture du formulaire d'avis
                          addNotification({
                            type: 'info',
                            title: 'Formulaire d\'avis',
                            message: `📝 Formulaire d'avis ouvert pour ${productForModal.name}.\n\nVeuillez remplir le formulaire qui s'ouvre dans un nouvel onglet.`,
                            duration: 5000
                          })
                          
                          // Simuler l'ouverture d'un formulaire
                          setTimeout(() => {
                            const successMessage = {
                              id: (Date.now() + 1).toString(),
                              text: `✅ Votre avis a été enregistré avec succès !\n⭐ Merci pour votre contribution à la communauté Probooster.`,
                              sender: 'system',
                              timestamp: new Date(),
                              type: 'system'
                            }
                            
                            // Notification de succès pour l'avis
                            addNotification({
                              type: 'success',
                              title: 'Avis enregistré',
                              message: '✅ Votre avis a été enregistré avec succès !\n⭐ Merci pour votre contribution !',
                              duration: 4000
                            })
                          }, 2000)
                        }}
                      >
                        <MessageSquare className="h-4 w-4 mr-2 animate-pulse" />
                        Laisser un avis
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="seller" className="mt-6">
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      {productForModal.seller.logo ? (
                        <Image 
                          src={productForModal.seller.logo || "/placeholder-logo.svg"}
                          alt={`Logo ${productForModal.seller.name}`}
                          width={64}
                          height={64}
                          className="rounded-full object-cover border-2 border-white shadow-md"
                        />
                      ) : (
                        <Avatar className="h-16 w-16 ring-2 ring-white shadow-md">
                          <AvatarImage src={productForModal.seller.avatar} />
                          <AvatarFallback className="text-lg">{productForModal.seller.name ? productForModal.seller.name[0] : 'U'}</AvatarFallback>
                        </Avatar>
                      )}
                      <span
                        className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white ${
                          isSellerOnline ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                      ></span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 
                          className="text-xl font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors duration-300"
                          onClick={goToSellerPage}
                        >
                          {productForModal.seller.name}
                        </h3>
                        <Badge variant="outline" className="text-xs border-green-200 text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                          <span
                            className={`h-2 w-2 rounded-full mr-1.5 ${
                              isSellerOnline ? 'bg-green-500' : 'bg-gray-400'
                            }`}
                          ></span>
                          {isSellerOnline ? 'Actif' : 'Hors ligne'}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span>{ratingLabel || productForModal.seller.rating}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          <span>{Number.isFinite(productForModal.seller.totalSales) ? productForModal.seller.totalSales : 0} ventes</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4 text-blue-500" />
                          <span>Réponse: {responseTimeLabel || productForModal.seller.responseTime}</span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 flex items-center bg-gray-50 px-3 py-1.5 rounded-full w-fit">
                        <Clock className="h-4 w-4 mr-2 text-orange-500" />
                        <span>Membre depuis {productForModal.seller.memberSince || "Nouveau"}</span>
                        {productForModal.seller.joinDate && (
                          <span className="ml-1 text-gray-400">({productForModal.seller.joinDate})</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <MapPin className="h-5 w-5 text-gray-600" />
                          <div>
                            <h4 className="font-semibold text-gray-900">Localisation</h4>
                            <p className="text-sm text-gray-600">{productForModal.seller.location}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <Phone className="h-5 w-5 text-gray-600" />
                          <div>
                            <h4 className="font-semibold text-gray-900">Contact</h4>
                            <p className="text-sm text-gray-600">{productForModal.seller.phone}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="flex space-x-3">
                    <Button 
                      className="flex-1 bg-[#ff6600] hover:bg-[#e55a00] transform hover:scale-105 transition-all duration-300 hover:shadow-lg active:scale-95"
                      onClick={() => {
                        void openRealSellerChat()
                      }}
                    >
                      <MessageCircle className="h-4 w-4 mr-2 animate-pulse" />
                      Discuter avec le vendeur
                    </Button>
                    
                      <Button 
                        variant="outline"
                      className="transform hover:scale-105 transition-all duration-300 hover:shadow-md active:scale-95 hover:bg-blue-50 hover:border-blue-300"
                        onClick={() => handleContactSeller('phone')}
                      >
                      <Phone className="h-4 w-4 mr-2 animate-bounce" />
                        Appeler
                      </Button>
                      <Button 
                        variant="outline"
                      className="transform hover:scale-105 transition-all duration-300 hover:shadow-md active:scale-95 hover:bg-gray-50 hover:border-gray-300"
                        onClick={() => handleContactSeller('email')}
                      >
                      <Mail className="h-4 w-4 mr-2 animate-pulse" />
                        Email
                      </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

         {/* Chat Section - Ancien design restauré avec nouveau système de chat */}
         <div className="border-t border-gray-200 bg-gradient-to-br from-gray-50 to-white">
           <div className="p-4">
             {/* En-tête du chat moderne */}
             <div className="relative bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-t-2xl p-4 border-b border-orange-200 shadow-lg">
               {/* Effet de brillance en arrière-plan */}
               <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/10 rounded-t-2xl animate-pulse"></div>
               
               <div className="relative flex items-center justify-between">
                 <div className="flex items-center space-x-3">
                   {/* Avatar du vendeur avec animation moderne */}
                   <div className="relative group">
                     <div className="w-12 h-12 bg-gradient-to-br from-white to-gray-100 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white/50 group-hover:ring-orange-200 transition-all duration-300">
                       {productForModal.seller?.logo ? (
                         <Image 
                           src={productForModal.seller.logo}
                           alt={productForModal.seller.name}
                           width={40}
                           height={40}
                           className="rounded-full object-cover"
                         />
                       ) : (
                         <span className="text-orange-600 font-bold text-lg">VP</span>
                       )}
                     </div>
                     {/* Indicateur de statut animé */}
                     <div
                       className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-md ${
                         isSellerOnline ? 'bg-green-500' : 'bg-gray-400'
                       } ${isSellerOnline ? 'animate-ping' : ''}`}
                     ></div>
                     <div
                       className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                         isSellerOnline ? 'bg-green-500' : 'bg-gray-400'
                       }`}
                     ></div>
                     {/* Effet de brillance au survol */}
                     <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                   </div>
                   
                   {/* Informations du vendeur améliorées */}
                   <div className="flex flex-col">
                     <div className="flex items-center space-x-2">
                       <h3 
                         className="text-lg font-bold text-white drop-shadow-sm cursor-pointer hover:text-blue-200 transition-colors duration-300"
                         onClick={goToSellerPage}
                       >
                         {productForModal.seller.name}
                       </h3>
                       <Badge className="bg-white/20 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full border border-white/30 animate-pulse">
                         <span
                           className={`h-2 w-2 rounded-full mr-1.5 ${
                             isSellerOnline ? 'bg-green-400' : 'bg-gray-300'
                           } ${isSellerOnline ? 'animate-ping' : ''}`}
                         ></span>
                         {isSellerOnline ? 'En ligne' : 'Hors ligne'}
                       </Badge>
                     </div>
                     
                     {/* Message informatif sur la comparaison automatique */}
                     <div className="mt-2 bg-white/20 backdrop-blur-sm rounded-lg p-2 border border-white/30">
                       <p className="text-white text-sm">
                         💬 <strong>Chat moderne et sécurisé</strong><br />
                         Connecté au système global de synchronisation
                       </p>
                     </div>
                   </div>
                 </div>
                 
                 {/* Bouton pour ouvrir le chat global */}
                 <Button
                   onClick={() => {
                     void openRealSellerChat()
                   }}
                   className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border border-white/30 px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105"
                 >
                   <MessageCircle className="h-4 w-4 mr-2" />
                   Démarrer le chat
                 </Button>
               </div>
             </div>
             {/* Ancienne section chat désactivée pour référence */}
            {showLegacyChat && (
              <div className="border-t border-gray-200 bg-gradient-to-br from-gray-50 to-white">
                <div className="p-4"></div>
              </div>
             )}

                {/* Action Buttons - Design Amélioré */}
                <div className="flex items-center space-x-3 mt-4">
                   <Button
                     size="sm"
                     onClick={() => handleChatAction('buy')}
                     className="bg-gradient-to-br from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-xs rounded-full px-5 py-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 font-medium border-0"
                   >
                     <ShoppingCart className="h-4 w-4 mr-2 animate-bounce" />
                     Acheter
                   </Button>
                   
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => handleChatAction('cart')}
                     className="text-xs rounded-full border-2 border-green-200 hover:border-green-400 hover:text-green-600 hover:bg-green-50 transition-all duration-300 hover:scale-105 active:scale-95 font-medium bg-white"
                   >
                     <ShoppingCart className="h-4 w-4 mr-2 animate-pulse" />
                     Panier
                   </Button>
                   
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => {
                       // Fonction utilitaire pour localStorage sécurisé
                       const safeLocalStorage = {
                         getItem: (key: string, defaultValue: string = '') => {
                           if (typeof window !== 'undefined' && window.localStorage) {
                             return localStorage.getItem(key) || defaultValue
                           }
                           return defaultValue
                         },
                         setItem: (key: string, value: string) => {
                           if (typeof window !== 'undefined' && window.localStorage) {
                             localStorage.setItem(key, value)
                           }
                         }
                       }
                       
                       // Trouver un produit similaire pour la comparaison
                       const similarProduct = findSimilarProduct()
                       
                       // Ajouter les deux produits à la comparaison
                       const compareList = JSON.parse(safeLocalStorage.getItem('compareList', '[]'))
                       
                       // Vérifier si les produits ne sont pas déjà dans la comparaison
                       const productExists = compareList.find((p: any) => p.id === productForModal.id)
                       const similarExists = compareList.find((p: any) => p.id === similarProduct.id)
                       
                       if (!productExists && !similarExists) {
                         if (compareList.length >= 3) { // Réserver une place pour le produit similaire
                           addNotification({ 
  type: 'warning', 
  title: 'Limite de comparaison atteinte', 
  message: 'Vous ne pouvez comparer que 4 produits maximum !' 
})
                           return
                         }
                         
                         // Ajouter le produit actuel
                         compareList.push({
                           id: productForModal.id,
                           name: productForModal.name,
                           price: productForModal.price,
                           image: getProductImage(0),
                           seller: productForModal.seller.name || 'Vendeur Probooster'
                         })
                         
                         // Ajouter le produit similaire
                         compareList.push({
                           id: similarProduct.id,
                           name: similarProduct.name,
                           price: similarProduct.price,
                           image: similarProduct.images && similarProduct.images.length > 0 ? similarProduct.images[0] : "/placeholder.svg",
                           seller: similarProduct.seller.name || 'Vendeur Probooster'
                         })
                         
                         safeLocalStorage.setItem('compareList', JSON.stringify(compareList))
                         
                         // Message de confirmation avec les produits ajoutés
                         addNotification({
                           type: 'success',
                           title: 'Comparaison créée !',
                           message: `${productForModal.name} vs ${similarProduct.name}\n\nLe modal de comparaison s'ouvre par-dessus.`
                         })
                         
                         // Notification pour la comparaison créée
                         addNotification({
                           type: 'success',
                           title: 'Comparaison créée !',
                           message: `📊 ${productForModal.name} vs ${similarProduct.name}\n\nLe modal de comparaison s'ouvre par-dessus.`,
                           duration: 4000
                         })
                         
                         // Ouvrir le modal de comparaison SANS fermer le modal produit
                         // Le modal de comparaison s'affichera par-dessus
                           window.dispatchEvent(new CustomEvent('openCompareModal'))
                       } else {
                         // Si un des produits est déjà dans la comparaison
                         if (productExists && similarExists) {
                           addNotification({ 
  type: 'info', 
  title: 'Produits déjà comparés', 
  message: 'Ces produits sont déjà dans la comparaison !' 
})
                         } else if (productExists) {
                           addNotification({ 
  type: 'info', 
  title: 'Produit déjà comparé', 
  message: `${productForModal.name} est déjà dans la comparaison !` 
})
                         } else {
                           addNotification({ 
  type: 'info', 
  title: 'Produit déjà comparé', 
  message: `${similarProduct.name} est déjà dans la comparaison !` 
})
                         }
                       }
                     }}
                     className="text-xs rounded-full border-2 border-blue-200 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300 hover:scale-105 active:scale-95 font-medium bg-white group relative"
                   >
                     <BarChart3 className="h-4 w-4 mr-2 animate-pulse group-hover:animate-bounce" />
                     Comparer
                     
                     {/* Tooltip informatif */}
                     <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-blue-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-50">
                       <div className="text-center">
                         <div className="font-semibold">Comparaison automatique</div>
                         <div className="text-blue-200">Produit similaire + actuel</div>
                       </div>
                       {/* Flèche du tooltip */}
                       <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-blue-900"></div>
                     </div>
                   </Button>
                   
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => handleChatAction('wishlist')}
                     className={`text-xs rounded-full border-2 transition-all duration-300 hover:scale-105 active:scale-95 font-medium bg-white ${isWishlisted ? 'text-red-500 border-red-300 bg-red-50 hover:bg-red-100' : 'border-gray-200 hover:border-red-400 hover:text-red-500 hover:bg-red-50'}`}
                   >
                     <Heart className={`h-4 w-4 mr-2 transition-all duration-300 ${isWishlisted ? 'fill-current animate-pulse' : ''}`} />
                     Favoris
                   </Button>
                   
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => handleShare('whatsapp')}
                     className="text-xs rounded-full border-2 border-green-200 hover:border-green-400 hover:text-green-600 hover:bg-green-50 transition-all duration-300 hover:scale-105 active:scale-95 font-medium bg-white"
                   >
                     <Share2 className="h-4 w-4 mr-2 animate-pulse" />
                     Partager
                   </Button>
                 </div>
               </div>

               {/* Messages - Design Amélioré */}
               <div className="relative bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
                 <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                   <div className="flex items-center space-x-3">
                     <div className="relative">
                       {productForModal.seller.logo ? (
                         <Image 
                           src={productForModal.seller.logo || "/placeholder-logo.svg"}
                           alt={`Logo ${productForModal.seller.name}`}
                           width={36}
                           height={36}
                           className="rounded-full object-cover border-2 border-white shadow-md"
                         />
                       ) : (
                         <Avatar className="h-9 w-9 ring-2 ring-white shadow-md">
                           <AvatarImage src="/vendor-avatar.png" />
                           <AvatarFallback className="bg-gradient-to-br from-orange-100 to-red-100 text-orange-600 text-xs font-medium">VP</AvatarFallback>
                         </Avatar>
                       )}
                       <span
                         className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${
                           isSellerOnline ? 'bg-green-500' : 'bg-gray-400'
                         } ${isSellerOnline ? 'animate-pulse' : ''}`}
                       ></span>
                     </div>
                     <div>
                       <h4 
                         className="text-sm font-semibold text-gray-800 cursor-pointer hover:text-blue-600 transition-colors duration-300"
                         onClick={goToSellerPage}
                       >
                         {productForModal.seller.name}
                       </h4>
                       <div className="flex items-center space-x-2">
                         <p className={`text-xs font-medium ${isSellerOnline ? 'text-green-600' : 'text-gray-500'}`}>
                          {isSellerOnline ? 'En ligne maintenant' : 'Hors ligne'}
                        </p>
                         <span>•</span>
                         <p className="text-xs text-gray-500 flex items-center">
                           <Clock className="h-3 w-3 mr-1 text-orange-500" />
                           <span>Réponse: {responseTimeLabel || productForModal.seller.responseTime}</span>
                         </p>
                       </div>
                     </div>
                   </div>
                   <Badge variant="outline" className="text-xs border-green-200 text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    <span
                      className={`h-2 w-2 rounded-full mr-1.5 ${
                        isSellerOnline ? 'bg-green-500' : 'bg-gray-400'
                      } ${isSellerOnline ? 'animate-pulse' : ''}`}
                    ></span>
                    {isSellerOnline ? 'Actif' : 'Hors ligne'}
                  </Badge>
                 </div>
                 <div className="space-y-4 max-h-80 overflow-y-auto mb-4 px-2 py-3 custom-scrollbar">
                 {currentSession?.messages.map((message, index) => (
                   <div
                    key={`${String((message as any)?.id ?? 'msg')}-${index}`}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                  >
                    {message.sender !== 'user' && (
                      <div className="relative">
                        {productForModal.seller.logo ? (
                          <div className="relative h-9 w-9 mr-2 self-end mb-1">
                             <Image 
                               src={productForModal.seller.logo || "/placeholder-logo.svg"}
                               alt={`Logo ${productForModal.seller.name}`}
                               width={36}
                               height={36}
                               className="rounded-full object-cover border-2 border-white shadow-md"
                             />
                             {index === 0 && (
                               <span className="absolute -top-1 -right-1 bg-green-500 h-3 w-3 rounded-full border-2 border-white"></span>
                             )}
                           </div>
                         ) : (
                           <div className="relative">
                             <Avatar className="h-9 w-9 mr-2 self-end mb-1 ring-2 ring-white shadow-md">
                               <AvatarImage src="/vendor-avatar.png" />
                               <AvatarFallback className="bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 text-xs font-medium">VD</AvatarFallback>
                             </Avatar>
                             {index === 0 && (
                               <span className="absolute -top-1 -right-1 bg-green-500 h-3 w-3 rounded-full border-2 border-white"></span>
                             )}
                           </div>
                         )}
                       </div>
                     )}
                     
                     {/* Messages textuels */}
                     {message.type === 'text' && (
                     <div
                       className={`max-w-[75%] rounded-2xl p-3 shadow-md transition-all duration-200 hover:shadow-lg ${
                         message.sender === 'user'
                           ? 'bg-gradient-to-br from-[#ff6600] to-[#ff8533] text-white rounded-tr-none transform hover:-translate-y-0.5'
                             : message.sender === 'system'
                           ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-800 border border-emerald-200 transform hover:-translate-y-0.5'
                           : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none transform hover:-translate-y-0.5'
                       }`}
                     >
                       <p className="text-sm leading-relaxed">{message.text}</p>
                       <div className="flex items-center justify-end mt-1 space-x-1">
                         <p className="text-[10px] opacity-70">
                           {message.timestamp.toLocaleTimeString('fr-FR', { 
                             hour: '2-digit', 
                             minute: '2-digit' 
                           })}
                         </p>
                         {message.sender === 'user' && (
                           <CheckCircle className="h-3 w-3 text-white opacity-70" />
                         )}
                       </div>
                     </div>
                     )}
                     
                     {/* Messages vocaux */}
                     {message.type === 'audio' && (
                       <div
                         className={`max-w-[75%] rounded-2xl p-3 shadow-md transition-all duration-200 hover:shadow-lg ${
                           message.sender === 'user'
                             ? 'bg-gradient-to-br from-[#ff6600] to-[#ff8533] text-white rounded-tr-none transform hover:-translate-y-0.5'
                             : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none transform hover:-translate-y-0.5'
                         }`}
                       >
                         <div className="flex items-center space-x-2">
                           <div className="flex items-center space-x-1">
                             <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
                             <div className="w-2 h-2 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                             <div className="w-2 h-2 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                           </div>
                           <span className="text-sm font-medium">
                             {typeof (message as any)?.duration === 'number'
                               ? `${Math.floor(Math.max(0, Number((message as any).duration)) / 60)}:${(Math.max(0, Number((message as any).duration)) % 60).toString().padStart(2, '0')}`
                               : (String((message as any)?.fileSize ?? '').trim() ? String((message as any).fileSize) : 'Audio')}
                           </span>
                         </div>

                         {String((message as any)?.fileUrl ?? '').trim() ? (
                           <div className="mt-3">
                             <div className="rounded-lg bg-white/20 p-2">
                               <audio
                                 controls
                                 preload="metadata"
                                 src={String((message as any).fileUrl)}
                                 className="w-full h-10 min-w-[240px]"
                               />
                             </div>
                           </div>
                         ) : null}
                         <div className="flex items-center justify-end mt-1 space-x-1">
                           <p className="text-[10px] opacity-70">
                             {message.timestamp.toLocaleTimeString('fr-FR', { 
                               hour: '2-digit', 
                               minute: '2-digit' 
                             })}
                           </p>
                           {message.sender === 'user' && (
                             <CheckCircle className="h-3 w-3 text-white opacity-70" />
                           )}
                         </div>
                       </div>
                     )}
                     
                     {/* Messages de fichiers */}
                     {message.type === 'file' && (
                       <div
                         className={`max-w-[75%] rounded-2xl p-3 shadow-md transition-all duration-200 hover:shadow-lg ${
                           message.sender === 'user'
                             ? 'bg-gradient-to-br from-[#ff6600] to-[#ff8533] text-white rounded-tr-none transform hover:-translate-y-0.5'
                             : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none transform hover:-translate-y-0.5'
                         }`}
                       >
                         {(() => {
                           const url = String((message as any)?.fileUrl ?? '').trim()
                           const kind = String((message as any)?.fileType ?? (message as any)?.type ?? '').toLowerCase().trim()

                           if (url && kind === 'image') {
                             return (
                               <a href={url} target="_blank" rel="noreferrer" className="block" title="Ouvrir l'image">
                                 {/* eslint-disable-next-line @next/next/no-img-element */}
                                 <img src={url} alt={String((message as any)?.fileName ?? 'Image')} className="max-h-72 w-auto max-w-full rounded-lg border border-white/20 object-contain" loading="lazy" />
                               </a>
                             )
                           }

                           if (url && kind === 'video') {
                             return (
                               <div className="w-full">
                                 <video controls src={url} className="w-full max-h-72 rounded-lg border border-white/20" />
                               </div>
                             )
                           }

                           if (url && kind === 'audio') {
                             return (
                               <div className="w-full">
                                 <div className="rounded-lg bg-white/20 p-2">
                                   <audio
                                     controls
                                     preload="metadata"
                                     src={url}
                                     className="w-full h-10 min-w-[240px]"
                                   />
                                 </div>
                               </div>
                             )
                           }

                           return (
                             <div className="flex items-center space-x-3">
                               <div className="flex-shrink-0">
                                 {getFileIcon(String((message as any)?.fileType ?? 'file'))}
                               </div>
                               <div className="flex-1 min-w-0">
                                 <p className="text-sm font-medium truncate">{String((message as any)?.fileName ?? '').trim() || 'Fichier'}</p>
                                 <p className="text-xs opacity-70">{String((message as any)?.fileSize ?? '').trim()}</p>
                               </div>
                               {url ? (
                                 <Button
                                   variant="ghost"
                                   size="sm"
                                   className="p-1 hover:bg-white/20"
                                   onClick={() => window.open(url, '_blank')}
                                 >
                                   <FileIcon className="h-4 w-4" />
                                 </Button>
                               ) : null}
                             </div>
                           )
                         })()}
                         <div className="flex items-center justify-end mt-1 space-x-1">
                           <p className="text-[10px] opacity-70">
                             {message.timestamp.toLocaleTimeString('fr-FR', { 
                               hour: '2-digit', 
                               minute: '2-digit' 
                             })}
                           </p>
                           {message.sender === 'user' && (
                             <CheckCircle className="h-3 w-3 text-white opacity-70" />
                           )}
                         </div>
                       </div>
                     )}
                     
                     {message.sender === 'user' && (
                       <Avatar className="h-9 w-9 ml-2 self-end mb-1 ring-2 ring-[#fff0e6] shadow-md">
                         <AvatarImage src="/user-avatar.png" />
                         <AvatarFallback className="bg-gradient-to-br from-[#fff0e6] to-[#ffdfcc] text-[#ff6600] text-xs font-medium">ME</AvatarFallback>
                       </Avatar>
                     )}
                   </div>
                 ))}
                 
                                   {currentSession?.isTyping && (
                   <div className="flex justify-start items-end animate-fadeIn">
                     <div className="relative">
                       {productForModal.seller.logo ? (
                         <div className="relative h-9 w-9 mr-2 mb-1">
                           <Image 
                             src={productForModal.seller.logo || "/placeholder-logo.svg"}
                             alt={`Logo ${productForModal.seller.name}`}
                             width={36}
                             height={36}
                             className="rounded-full object-cover border-2 border-white shadow-md"
                           />
                           <span className="absolute -top-1 -right-1 bg-green-500 h-3 w-3 rounded-full border-2 border-white"></span>
                         </div>
                       ) : (
                         <div className="relative">
                           <Avatar className="h-9 w-9 mr-2 mb-1 ring-2 ring-white shadow-md">
                             <AvatarImage src="/vendor-avatar.png" />
                             <AvatarFallback className="bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 text-xs font-medium">VD</AvatarFallback>
                           </Avatar>
                           <span className="absolute -top-1 -right-1 bg-green-500 h-3 w-3 rounded-full border-2 border-white"></span>
                         </div>
                       )}
                     </div>
                     <div className="bg-white rounded-2xl rounded-tl-none p-3 shadow-md border border-gray-100">
                       <div className="flex space-x-1">
                         <div className="w-2 h-2 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full animate-pulse"></div>
                         <div className="w-2 h-2 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                         <div className="w-2 h-2 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }}></div>
                       </div>
                     </div>
                   </div>
                 )}
               </div>

               {/* Input Moderne avec Fonctionnalités Avancées */}
               <div className="relative mt-4 bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
                 {/* Zone de saisie principale */}
                 <div className="relative">
                 <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                     <MessageCircle className="h-5 w-5" />
                 </div>
                 <Input
                   value={chatInput}
                   onChange={(e) => setChatInput(e.target.value)}
                   onKeyPress={(e) => e.key === 'Enter' && handleSendChatMessage()}
                   placeholder="Tapez votre message..."
                     className="w-full pr-44 pl-12 py-4 rounded-2xl border-2 border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-400 focus:ring-opacity-20 transition-all shadow-sm hover:shadow-md text-sm bg-gray-50 focus:bg-white"
                   />
                   
                   {/* Boutons d'action modernes */}
                   <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-2">
                     {/* Bouton emojis avec sélecteur */}
                     <DropdownMenu>
                       <DropdownMenuTrigger asChild>
                   <Button
                           variant="ghost"
                           size="sm"
                           className="h-10 w-10 p-0 rounded-full bg-gradient-to-br from-yellow-100 to-orange-100 hover:from-yellow-200 hover:to-orange-200 border border-yellow-200 shadow-md transition-all duration-300 hover:scale-110 active:scale-95"
                         >
                           <span className="text-lg">😊</span>
                         </Button>
                       </DropdownMenuTrigger>
                       <DropdownMenuContent className="w-64 p-2">
                         <div className="grid grid-cols-8 gap-1">
                           {['😊', '😂', '❤️', '👍', '🎉', '🔥', '💯', '👏', '🙏', '😍', '🤔', '😅', '😭', '😱', '🤯', '🥳', '😎', '🤩', '😇', '🤗', '😴', '🤤', '😋', '🤪', '😜', '😝', '🤓', '🧐', '🤠', '👻', '🤖', '👽'].map((emoji) => (
                             <button
                              key={emoji}
                              onClick={() => setChatInput((prev: string) => prev + emoji)}
                              className="w-8 h-8 text-lg hover:bg-gray-100 rounded transition-colors duration-200"
                            >
                              {emoji}
                            </button>
                           ))}
                         </div>
                       </DropdownMenuContent>
                     </DropdownMenu>
                     
                     {/* Bouton d'envoi de fichiers */}
                     <Button
                       variant="ghost"
                       size="sm"
                       onClick={() => fileInputRef.current?.click()}
                       className="h-10 w-10 p-0 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 hover:from-blue-200 hover:to-purple-200 border border-blue-200 shadow-md transition-all duration-300 hover:scale-110 active:scale-95"
                     >
                       <Paperclip className="h-5 w-5 text-blue-600" />
                     </Button>
                   
                     {/* Bouton d'enregistrement vocal */}
                   <Button
                      variant="ghost"
                      size="sm"
                      onPointerDown={(e) => {
                        e.preventDefault()
                        if (isRecording) return
                        void startRecording()
                      }}
                      className={`h-10 w-10 p-0 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 shadow-md ${
                        isRecording 
                          ? 'bg-gradient-to-br from-red-500 to-red-600 text-white animate-pulse border border-red-400' 
                          : 'bg-gradient-to-br from-green-100 to-emerald-100 hover:from-green-200 hover:to-emerald-200 border border-green-200'
                      }`}
                    >
                      {isRecording ? (
                        <MicOff className="h-5 w-5 animate-pulse" />
                      ) : (
                        <Mic className="h-5 w-5 text-green-600" />
                      )}
                    </Button>

                    {isRecording && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={toggleRecordingPause}
                          className="h-10 px-3 rounded-full bg-yellow-100 hover:bg-yellow-200 border border-yellow-200 text-yellow-800 shadow-md transition-all duration-300 hover:scale-105 active:scale-95"
                          title={recordingPaused ? 'Reprendre' : 'Pause'}
                        >
                          {recordingPaused ? 'Reprendre' : 'Pause'}
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={stopRecording}
                          className="h-10 px-3 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-md transition-all duration-300 hover:scale-105 active:scale-95"
                          title="Stop"
                        >
                          Stop
                        </Button>
                      </>
                    )}
                   
                     {/* Bouton d'envoi */}
                     <Button
                       variant="ghost"
                       size="sm"
                     onClick={handleSendChatMessage}
                       disabled={!chatInput.trim() && !isRecording}
                       className="h-10 w-10 p-0 rounded-full bg-gradient-to-br from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border-0"
                   >
                       <Send className="h-5 w-5" />
                   </Button>
                 </div>
                 </div>
                 
                 {/* Indicateur d'enregistrement moderne */}
                {isRecording && (
                  <div className="absolute -top-12 left-0 right-0 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm px-4 py-2 rounded-full text-center animate-pulse shadow-lg border border-red-400">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                      <span className="font-medium">Enregistrement en cours...</span>
                      <span className="font-bold">{Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}</span>
                      {recordingPaused && (
                        <span className="ml-1 rounded-full bg-yellow-100 px-2 py-0.5 text-[11px] font-semibold text-yellow-800">PAUSE</span>
                      )}
              </div>
                  </div>
                )}
                 
                 {/* Indicateur de chargement de fichier */}
                 {isFileUploading && (
                   <div className="absolute -top-12 left-0 right-0 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm px-4 py-2 rounded-full text-center animate-pulse shadow-lg border border-blue-400">
                     <div className="flex items-center justify-center space-x-2">
                       <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                       <span className="font-medium">Envoi du fichier...</span>
                     </div>
                   </div>
                 )}
                 
                 {/* Message d'aide */}
                 <div className="absolute -bottom-6 left-0 right-0 text-center">
                   <p className="text-xs text-gray-500 font-medium">💬 Réponse rapide en quelques secondes</p>
                 </div>
                 
                 {/* Barre de progression en bas */}
                 <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 rounded-b-2xl overflow-hidden">
                   <div className="h-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse"></div>
                 </div>
               </div>
               
               {/* Input caché pour les fichiers */}
               <input
                 ref={fileInputRef}
                 type="file"
                 multiple
                 accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                 onChange={handleFileSelect}
                 className="hidden"
               />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Modal chat intégré */}
    <LegacyChatModal
      isOpen={showChatModal}
      onClose={() => setShowChatModal(false)}
      sellerId={chatSellerId}
      sellerName={chatSellerName}
      sellerAvatar={chatSellerAvatar}
      product={product}
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

      {/* Conteneur des notifications modernes */}
      <NotificationContainer />
    </>
  )
}