"use client"

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DashboardService, type DashboardData, type PointsTransaction, type UserOrderWithItems, type Seller } from '@/lib/services/dashboard-service'
import { useAuth } from "@/contexts/AuthContext"
import { useUserPreferences } from "@/contexts/UserPreferencesContext"
import { getClientAccessTokenSafe, supabase } from '@/lib/supabase'
import { ChatService } from "@/lib/services/chat-service"
import { useMoney } from '@/lib/hooks/use-money'
import { Checkbox } from '@/components/ui/checkbox'
import {
  ShoppingBag,
  MessageCircle,
  MessageSquare,
  Share2,
  Gift,
  User,
  Settings,
  Bell,
  TrendingUp,
  Package,
  Heart,
  CreditCard,
  BarChart3,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Shield,
  Camera,
  Edit3,
  Download,
  Upload,
  Filter,
  Search,
  Plus,
  MoreVertical,
  ChevronRight,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Truck,
  Home,
  Users,
  Activity,
  Zap,
  Target,
  Award,
  Coins,
  Wallet,
  RefreshCw,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Smartphone,
  Globe,
  ShoppingCart,
  Minus,
  Percent,
  Key,
  Trash2,
  AlertTriangle,
  Check,
  Sparkles,
  Tag,
  TrendingDown,
  Send,
  CornerUpLeft,
  Info,
  Copy,
  Lightbulb,
  HelpCircle,
  Archive,
  X,
  Loader2,
  Paperclip,
  Smile,
  Mic,
  Pause,
  Play,
  Square,
  QrCode,
  Video,
  Headphones,
  Monitor,
  Laptop,
  Sun,
  Moon,
  Building,
  FileText,
  ExternalLink,
  Gamepad2
} from 'lucide-react'
import { InternalMessagingService } from '@/lib/services/internal-messaging-service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useNotifications } from '@/components/ui/modern-notification'
import HeaderCart from '@/components/layout/header-cart'
import { ClientDeliveryManagement } from '@/components/dashboard/client-delivery-management'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useLocalStorageArray, useLocalStorageNumber } from '@/hooks/use-local-storage'
import { useToast } from '@/hooks/use-toast'
import { useCart } from '@/hooks/use-cart'
import { Product, CartItem, Order } from '@/lib/types'
import { ClientPointsService, ClientPointsConfiguration, ClientPointsSummary, TransferRecipient, ClientRewardOption } from '@/lib/services/client-points-service'
import { useClientPoints } from '@/lib/hooks/use-client-points'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  PointsEvolutionChart, 
  SharesDistributionChart, 
  OrdersChart, 
  WeeklyActivityChart, 
  PerformanceRadarChart, 
  RealTimeStats 
} from '@/components/charts/dashboard-charts'
import SystemSettingsSection from '@/components/dashboard/system-settings-section'
import SharesSectionSynced from '@/components/dashboard/shares-section-synced'
import { ClientOffersSection } from "./components/ClientOffersSection";
import { ClientSpecialPromotionsSection } from "./components/ClientSpecialPromotionsSection";
import { EditableMessagesBanner } from '@/components/messages/EditableMessagesBanner'

// Types spécifiques au dashboard
interface DashboardSummaryStats {
  totalOrders: number
  totalPoints: number
  totalShares: number
  totalSpent: number
  activeChats: number
  favoriteSellers: number
}

type DashboardChatSession = DashboardData['chats'] extends (infer T)[] ? T : never
type DashboardChatMessage = DashboardData['chatMessages'] extends (infer T)[] ? T : never

interface ChatContact {
  id: string
  partnerId: string | null
  displayName: string
  initials: string
  lastMessageAt: string | null
  lastMessagePreview: string
}

type EncodedProductPayload = {
  product: any
  text?: string
}

type EncodedAttachmentPayload = {
  kind: 'image' | 'video' | 'audio' | 'document' | 'file'
  url: string
  name?: string
  size?: number
  mime?: string
  text?: string
}

/**
 * Décode un message produit encodé sous la forme "__product__:{json}".
 */
function decodeProductMessage(content: string): EncodedProductPayload | null {
  const raw = String(content ?? '')
  const prefix = '__product__:'
  if (!raw.startsWith(prefix)) return null
  const jsonPart = raw.slice(prefix.length)
  try {
    const parsed = JSON.parse(jsonPart)
    if (!parsed || typeof parsed !== 'object') return null
    if (!('product' in (parsed as any))) return null
    return {
      product: (parsed as any).product,
      text: typeof (parsed as any).text === 'string' ? (parsed as any).text : undefined
    }
  } catch {
    return null
  }
}

/**
 * Décode un message pièce jointe encodé sous la forme "__attachment__:{json}".
 */
function decodeAttachmentMessage(content: string): EncodedAttachmentPayload | null {
  const raw = String(content ?? '')
  const prefix = '__attachment__:'
  if (!raw.startsWith(prefix)) return null
  const jsonPart = raw.slice(prefix.length)
  try {
    const parsed = JSON.parse(jsonPart)
    if (!parsed || typeof parsed !== 'object') return null
    const kind = String((parsed as any).kind)
    const url = String((parsed as any).url ?? '')
    if (!url) return null

    const mime = typeof (parsed as any).mime === 'string' ? String((parsed as any).mime) : undefined
    const normalizeKind = (input: string): EncodedAttachmentPayload['kind'] => {
      const candidate = String(input ?? '').toLowerCase().trim()
      if (candidate === 'image' || candidate === 'video' || candidate === 'audio' || candidate === 'document' || candidate === 'file') {
        return candidate
      }
      if (mime) {
        const m = mime.toLowerCase()
        if (m.startsWith('image/')) return 'image'
        if (m.startsWith('video/')) return 'video'
        if (m.startsWith('audio/')) return 'audio'
      }
      return 'document'
    }
    return {
      kind: normalizeKind(kind),
      url,
      name: typeof (parsed as any).name === 'string' ? (parsed as any).name : undefined,
      size: typeof (parsed as any).size === 'number' ? (parsed as any).size : undefined,
      mime,
      text: typeof (parsed as any).text === 'string' ? (parsed as any).text : undefined
    }
  } catch {
    return null
  }
}

/**
 * Retourne une version lisible du contenu pour les previews (liste de conversations).
 */
function toReadableChatText(content: string): string {
  const decoded = decodeProductMessage(content)
  if (decoded?.product) {
    const name = String((decoded.product as any)?.name ?? '').trim()
    const fallback = name ? `Produit: ${name}` : 'Produit partagé'
    return String(decoded.text ?? '').trim() || fallback
  }

  const attachment = decodeAttachmentMessage(content)
  if (attachment?.url) {
    const base = String(attachment.text ?? '').trim()
    if (base) return base
    if (attachment.kind === 'image') return 'Image'
    if (attachment.kind === 'audio') return 'Audio'
    if (attachment.kind === 'video') return 'Vidéo'
    if (attachment.kind === 'document') return 'Document'
    return 'Fichier'
  }
  return String(content ?? '')
}

function formatRelativeTimeShort(isoDate: string): string {
  const raw = String(isoDate ?? '').trim()
  if (!raw) return '-'
  const dt = new Date(raw)
  if (Number.isNaN(dt.getTime())) return '-'

  const now = new Date()
  const diffMs = now.getTime() - dt.getTime()
  const diffMinutes = Math.round(diffMs / (1000 * 60))
  if (diffMinutes <= 0) return "À l'instant"
  if (diffMinutes < 60) return `${diffMinutes}m`
  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h`
  const diffDays = Math.round(diffHours / 24)
  return `${diffDays}j`
}

/**
 * Regroupe visuellement un message produit suivi immédiatement d'une pièce jointe.
 * Objectif: afficher "produit + pièce jointe" en un seul bloc sans modifier la DB.
 */
function groupChatMessagesForDisplay(messages: DashboardChatMessage[]):
  Array<
    | { kind: 'single'; message: DashboardChatMessage }
    | { kind: 'product_with_attachment'; productMessage: DashboardChatMessage; attachmentMessage: DashboardChatMessage; attachment: EncodedAttachmentPayload }
  > {
  const out: Array<any> = []
  const list = Array.isArray(messages) ? messages : []
  for (let i = 0; i < list.length; i++) {
    const msg = list[i]
    const raw = String((msg as any)?.content ?? msg?.content ?? '')
    const product = decodeProductMessage(raw)
    if (product?.product) {
      const next = list[i + 1]
      if (next) {
        const nextRaw = String((next as any)?.content ?? next?.content ?? '')
        const attachment = decodeAttachmentMessage(nextRaw)
        const sameSender = String((next as any)?.sender_id ?? '') === String((msg as any)?.sender_id ?? '')
        if (attachment?.url && sameSender) {
          out.push({ kind: 'product_with_attachment', productMessage: msg, attachmentMessage: next, attachment })
          i++
          continue
        }
      }
    }

    out.push({ kind: 'single', message: msg })
  }
  return out
}

type ChatPartnerProfile = {
  userId: string
  displayName: string
  initials: string
  avatarUrl: string | null
}

type ChatPartnersApiResponse = {
  data?: Array<{
    user_id?: string
    first_name?: string
    last_name?: string
    display_name?: string
    avatar_url?: string | null
  }>
  error?: string
}

const formatOrderStatus = (status: Order['status']): string => {
  switch (status) {
    case 'delivered':
      return 'Livrée'
    case 'shipped':
      return 'Expédiée'
    case 'confirmed':
      return 'Confirmée'
    case 'pending':
      return 'En attente'
    case 'cancelled':
      return 'Annulée'
    default:
      return status
  }
}

const mapSupabaseOrderToInternal = (order: UserOrderWithItems): Order => {
  const normalizedStatus: Order['status'] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].includes(order.status as Order['status'])
    ? (order.status as Order['status'])
    : 'pending'

  const legacyShipping = (order as any)?.shipping_address && typeof (order as any).shipping_address === 'object'
    ? ((order as any).shipping_address as any)
    : null

  const resolvedFinalTotalRaw = (order as any)?.final_total ?? legacyShipping?.final_total ?? legacyShipping?.finalTotal
  const resolvedFinalTotal =
    typeof resolvedFinalTotalRaw === 'number'
      ? resolvedFinalTotalRaw
      : resolvedFinalTotalRaw == null
        ? null
        : Number(resolvedFinalTotalRaw) || null

  const resolvedPointsUsedRaw = (order as any)?.points_used ?? legacyShipping?.points_used ?? legacyShipping?.pointsUsed
  const resolvedPointsUsed =
    typeof resolvedPointsUsedRaw === 'number' ? resolvedPointsUsedRaw : Number(resolvedPointsUsedRaw ?? 0) || 0

  const resolvedPointsDiscountRaw =
    (order as any)?.points_discount ?? legacyShipping?.points_discount ?? legacyShipping?.pointsDiscount
  const resolvedPointsDiscount =
    typeof resolvedPointsDiscountRaw === 'number' ? resolvedPointsDiscountRaw : Number(resolvedPointsDiscountRaw ?? 0) || 0

  const resolvedPaymentOption =
    (typeof (order as any)?.payment_option === 'string' && (order as any).payment_option.trim().length > 0
      ? (order as any).payment_option.trim()
      : null) ??
    (typeof legacyShipping?.payment_option === 'string' && legacyShipping.payment_option.trim().length > 0
      ? legacyShipping.payment_option.trim()
      : null) ??
    (typeof legacyShipping?.paymentOption === 'string' && legacyShipping.paymentOption.trim().length > 0
      ? legacyShipping.paymentOption.trim()
      : null)

  const resolvedDeliveryOption =
    (typeof (order as any)?.delivery_option === 'string' && (order as any).delivery_option.trim().length > 0
      ? (order as any).delivery_option.trim()
      : null) ??
    (typeof legacyShipping?.delivery_option === 'string' && legacyShipping.delivery_option.trim().length > 0
      ? legacyShipping.delivery_option.trim()
      : null) ??
    (typeof legacyShipping?.deliveryOption === 'string' && legacyShipping.deliveryOption.trim().length > 0
      ? legacyShipping.deliveryOption.trim()
      : null) ??
    (typeof legacyShipping?.delivery_method === 'string' && legacyShipping.delivery_method.trim().length > 0
      ? legacyShipping.delivery_method.trim()
      : null) ??
    'Standard'

  const sourceItems: any[] = Array.isArray((order as any)?.order_items)
    ? ((order as any).order_items as any[])
    : Array.isArray((order as any)?.items)
      ? ((order as any).items as any[])
      : []

  const items: CartItem[] = sourceItems.map((item, index) => {
    const rawProductId = item?.product_id ?? item?.productId ?? item?.id ?? null
    const numericIdCandidate = typeof rawProductId === 'number' ? rawProductId : Number(rawProductId)
    const safeId = Number.isFinite(numericIdCandidate) ? numericIdCandidate : index + 1

    const name = String(item?.product_name ?? item?.productName ?? item?.name ?? 'Produit')
    const unitPrice = Number(item?.unit_price ?? item?.unitPrice ?? 0)
    const totalPrice = Number(item?.total_price ?? item?.totalPrice ?? unitPrice)
    const price = Number.isFinite(unitPrice) && unitPrice > 0 ? unitPrice : Number.isFinite(totalPrice) ? totalPrice : 0

    const quantityCandidate = Number(item?.quantity ?? 1)
    const quantity = Number.isFinite(quantityCandidate) && quantityCandidate > 0 ? quantityCandidate : 1

    const image =
      String(
        (item as any)?.product_image ??
          (item as any)?.productImage ??
          (item as any)?.image ??
          (item as any)?.product?.image ??
          ''
      ).trim() || '/images/placeholder-product.svg'

    const seller =
      String(
        (item as any)?.vendor_name ??
          (item as any)?.vendorName ??
          (item as any)?.seller_name ??
          (item as any)?.sellerName ??
          (order as any)?.vendor_name ??
          (order as any)?.vendorName ??
          ''
      ).trim() || 'Vendeur Pro Booster'

    return {
      id: safeId,
      name,
      price,
      image,
      seller,
      quantity
    }
  })

  return {
    id: order.order_number || order.id,
    items,
    total: resolvedFinalTotal ?? order.total_amount ?? 0,
    status: normalizedStatus,
    createdAt: order.created_at ?? new Date().toISOString(),
    pointsUsed: resolvedPointsUsed,
    pointsDiscount: resolvedPointsDiscount,
    finalTotal: resolvedFinalTotal,
    paymentOption: resolvedPaymentOption,
    deliveryOption: resolvedDeliveryOption,
    returnStatus: order.return_info?.status,
    returnReason: order.return_info?.reason,
    returnProcessedAt: order.return_info?.processedAt,
    disputeStatus: order.dispute_info?.status,
    disputePriority: order.dispute_info?.priority,
    disputeAssignedTo: order.dispute_info?.assignedTo,
    disputeSubject: order.dispute_info?.subject,
    disputeDescription: order.dispute_info?.description,
    disputeOpenedAt: order.dispute_info?.openedAt,
    disputeUpdatedAt: order.dispute_info?.updatedAt
  }
}

interface SharedProduct {
  id: string
  productId: number
  productName: string
  productImage: string
  shares: {
    facebook: number
    twitter: number
    whatsapp: number
    instagram: number
  }
  totalShares: number
  pointsEarned: number
  pointsUsed: number
  pointsWithdrawn: number
  pointsAvailable: number
  sharedAt: string
}

interface UserProfile {
  id: string
  name: string
  email: string
  phone: string
  avatar: string
  address: string
  city: string
  country: string
  twoFactorEnabled: boolean
  notifications: {
    email: boolean
    push: boolean
    sms: boolean
    orders: boolean
    points: boolean
    chat: boolean
    promotions: boolean
  }
  preferences: {
    language: string
    currency: string
    theme: 'light' | 'dark' | 'system'
  }
}

// Nouvelles interfaces pour les recommandations IA
interface AIRecommendation {
  id: string
  type: 'product' | 'seller' | 'promotion'
  title: string
  description: string
  confidence: number
  reason: string
  data: any
  createdAt: string
}

type ExchangeOptionKey = 'currency' | 'gift' | 'voucher' | 'discount'
type RewardExchangeOptionKey = Exclude<ExchangeOptionKey, 'currency'>

const REWARD_TYPES_BY_OPTION: Record<RewardExchangeOptionKey, ClientRewardOption['rewardType'][]> = {
  gift: ['free_product'],
  voucher: ['voucher'],
  discount: ['discount', 'cashback', 'free_shipping']
}

const REWARD_OPTION_COPY: Record<RewardExchangeOptionKey, { title: string; empty: string }> = {
  gift: {
    title: "Cadeaux d'achat disponibles",
    empty: "Aucun cadeau d'achat n'est disponible pour le moment."
  },
  voucher: {
    title: 'Bons d’achat disponibles',
    empty: "Aucun bon d'achat n'est proposé pour l'instant."
  },
  discount: {
    title: 'Réductions disponibles',
    empty: 'Aucune réduction n’est proposée pour le moment.'
  }
}

interface RecommendedProduct {
  id: number
  name: string
  price: number
  originalPrice: number
  image: string
  category: string
  rating: number
  reviews: number
  seller: string
  sellerRating: number
  promotion?: {
    type: 'discount' | 'flash' | 'bundle' | 'cashback'
    value: string
    endDate: string
  }
  aiConfidence: number
  aiReason: string
}

interface RecommendedSeller {
  id: string
  name: string
  avatar: string
  rating: number
  totalSales: number
  responseTime: string
  specialties: string[]
  topProducts: number[]
  aiConfidence: number
  aiReason: string
}

// Interface pour les promotions
interface Promotion {
  id: string
  code?: string
  title: string
  description: string
  type: 'discount' | 'flash' | 'bundle' | 'cashback' | 'free_shipping' | 'points_multiplier'
  value: string
  minAmount?: number
  maxDiscount?: number
  startDate: string
  endDate: string
  products: number[]
  categories: string[]
  isActive: boolean
  usageCount: number
  maxUsage?: number
  conditions: string[]
  image?: string
  priority: number
}

type NotificationPriority = 'low' | 'medium' | 'high'
type NotificationCategory = 'orders' | 'points' | 'promotions' | 'chat' | 'system'
type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'promotion'

interface NotificationItem {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: string
  isRead: boolean
  actionUrl?: string
  actionText?: string
  priority: NotificationPriority
  category: NotificationCategory
}

type MessagePriority = 'low' | 'medium' | 'high'
type MessageCategory = 'general' | 'support' | 'technical' | 'billing' | 'account'
type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read'

interface InternalMessage {
  id: string
  from: 'user' | 'admin'
  subject: string
  content: string
  timestamp: string
  isRead: boolean
  isImportant?: boolean
  priority: MessagePriority
  category: MessageCategory
  attachments: string[]
  status: MessageStatus
}

const mapSupabaseNotificationToInternal = (notification: any): NotificationItem => {
  const rawPriority = String(notification?.priority ?? 'medium').toLowerCase()
  const rawCategory = String(notification?.category ?? notification?.notification_category ?? 'system').toLowerCase()
  const rawType = String(notification?.type ?? notification?.notification_type ?? 'info').toLowerCase()

  const normalizedPriority: NotificationPriority =
    rawPriority === 'high' || rawPriority === 'urgent'
      ? 'high'
      : rawPriority === 'medium' || rawPriority === 'normal'
        ? 'medium'
        : 'low'

  const normalizedCategory: NotificationCategory = (() => {
    if (rawCategory === 'orders' || rawCategory === 'order' || rawCategory === 'payment') return 'orders'
    if (rawCategory === 'points' || rawCategory === 'loyalty') return 'points'
    if (rawCategory === 'promotions' || rawCategory === 'promotion') return 'promotions'
    if (rawCategory === 'chat' || rawCategory === 'message') return 'chat'
    return 'system'
  })()

  const normalizedType: NotificationType = (() => {
    if (rawType === 'success') return 'success'
    if (rawType === 'warning') return 'warning'
    if (rawType === 'error') return 'error'
    if (rawType === 'promotion' || rawType === 'promo') return 'promotion'
    return 'info'
  })()

  return {
    id: String(notification?.id ?? crypto.randomUUID()),
    type: normalizedType,
    title: String(notification?.title ?? ''),
    message: String(notification?.message ?? ''),
    timestamp: String(notification?.timestamp ?? notification?.created_at ?? new Date().toISOString()),
    isRead: Boolean(notification?.isRead ?? notification?.is_read ?? false),
    actionUrl: notification?.actionUrl ?? notification?.action_url ?? undefined,
    actionText: notification?.actionText ?? notification?.action_text ?? undefined,
    priority: normalizedPriority,
    category: normalizedCategory
  }
}

// Les données recommandées sont maintenant récupérées depuis Supabase via le service dashboard

// Les vendeurs recommandés sont maintenant récupérés depuis Supabase via le service dashboard



// Les notifications sont maintenant récupérées depuis Supabase via le service dashboard

// Toutes les données mockup ont été remplacées par des données réelles depuis Supabase via le service dashboard






// Composant pour les indicateurs de statut des messages
const MessageStatusIndicator = ({ status, messageId, isUserMessage }: { 
  status: 'sending' | 'sent' | 'delivered' | 'read'
  messageId: string
  isUserMessage: boolean
}) => {
  if (!isUserMessage) return null // Les indicateurs ne s'affichent que pour les messages de l'utilisateur
  
  const getStatusIcon = () => {
    switch (status) {
      case 'sending':
        return (
          <div className="flex items-center space-x-0.5">
            <div className="w-1 h-3 bg-gray-300 rounded-full animate-pulse"></div>
          </div>
        )
      case 'sent':
        return (
          <div className="flex items-center space-x-0.5">
            <div className="w-0.5 h-3 bg-gray-400 rounded-full transform rotate-12"></div>
          </div>
        )
      case 'delivered':
        return (
          <div className="flex items-center space-x-0.5">
            <div className="w-0.5 h-3 bg-gray-400 rounded-full transform rotate-12"></div>
            <div className="w-0.5 h-3 bg-gray-400 rounded-full transform rotate-12 -ml-1"></div>
          </div>
        )
      case 'read':
        return (
          <div className="flex items-center space-x-0.5">
            <div className="w-0.5 h-3 bg-green-500 rounded-full transform rotate-12"></div>
            <div className="w-0.5 h-3 bg-green-500 rounded-full transform rotate-12 -ml-1"></div>
          </div>
        )
      default:
        return null
    }
  }
  
  return (
    <div className="flex items-center justify-end mt-1">
      {getStatusIcon()}
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardPageContent />
    </Suspense>
  )
}

// Composant isolé sous Suspense pour permettre l'utilisation de useSearchParams() sans bloquer le build.
function DashboardPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { formatMoney, currencyCode } = useMoney()
  const {
    systemPrefs,
    setLanguage,
    setCurrency,
    setTheme,
    setTimezone,
    privacyPrefs,
    privacyPolicy,
    setProfilePublic: setProfilePublicPref,
    setSharePurchaseHistory: setSharePurchaseHistoryPref,
    setShareStats: setShareStatsPref,
    setAnalyticsEnabled: setAnalyticsEnabledPref,
    setPersonalizedRecommendations: setPersonalizedRecommendationsPref
  } = useUserPreferences()

  const [activeSessions, setActiveSessions] = useState<any[]>([])
  const activeSessionsCount = useMemo(() => {
    return Array.isArray(activeSessions) ? activeSessions.length : 0
  }, [activeSessions])

  /**
   * Normalise le SVG du QR code 2FA afin qu'il s'affiche correctement (taille + rendu) quel que soit
   * le contenu renvoyé par le provider.
   */
  const normalizeTwoFactorQrSvg = (svg: string) => {
    if (!svg) return svg

    const trimmed = svg.trim()
    if (!trimmed.toLowerCase().startsWith('<svg')) {
      return svg
    }

    // Injecte width/height + style pour éviter un SVG sans dimensions (donc invisible)
    // et pour garantir un rendu stable dans un conteneur responsive.
    const hasWidth = /\bwidth\s*=/.test(trimmed)
    const hasHeight = /\bheight\s*=/.test(trimmed)
    const hasStyle = /\bstyle\s*=/.test(trimmed)

    return trimmed.replace(
      /<svg\b([^>]*)>/i,
      (_m, attrs) => {
        const parts: string[] = []
        parts.push(`<svg${attrs}`)
        if (!hasWidth) parts.push(` width="100%"`)
        if (!hasHeight) parts.push(` height="100%"`)
        if (!/\bpreserveAspectRatio\s*=/.test(trimmed)) parts.push(` preserveAspectRatio="xMidYMid meet"`)
        if (!hasStyle) parts.push(` style="display:block;width:100%;height:100%;"`)
        parts.push('>')
        return parts.join('')
      }
    )
  }

  const settingsGeneralOptionCount = useMemo(() => {
    const languageOptions = ['fr', 'en', 'es'] as const
    const currencyOptions = ['xof', 'usd', 'eur'] as const
    const themeOptions = ['light', 'dark', 'auto'] as const
    const timezoneOptions = ['africa_cotonou', 'europe_paris', 'america_new_york', 'asia_tokyo'] as const
    return languageOptions.length + currencyOptions.length + themeOptions.length + timezoneOptions.length
  }, [])

  const settingsSecurityOptionCount = useMemo(() => {
    // 2FA + Mot de passe + Sessions actives
    return 3
  }, [])

  const settingsPersonalizationOptionCount = useMemo(() => {
    // Thème (3 choix) + préférences de confidentialité (5 switches)
    const themeOptions = 3
    const privacySwitches = 5
    return themeOptions + privacySwitches
  }, [])
  
  // HOOKS SUPABASE - AU DÉBUT, AVANT TOUS LES ÉTATS
  const { user, loyaltyPoints, updatePassword, signOut } = useAuth()

    // HOOK POUR LES NOTIFICATIONS
  const { toast } = useToast()
  const { addNotification } = useNotifications()

  useEffect(() => {
    if (!user?.id) return
    void refreshTwoFactorState()
  }, [user?.id])
  const [dashboardDataRaw, setDashboardDataRaw] = useState<DashboardData | null>(null)
  const dashboardData = dashboardDataRaw
  // Transactions de points récentes lues via l'API admin (source fiable pour
  // la carte "Points aujourd'hui", indépendante des policies RLS).
  const [recentPointTx, setRecentPointTx] = useState<Array<{ type: string; points: number; createdAt: string }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // TOUS LES ÉTATS (useState) - REGROUPÉS
  const [activeTab, setActiveTab] = useState('overview')
  const [isLoading, setIsLoading] = useState(true)
  const [showPointsHistory, setShowPointsHistory] = useState(false)
  const [showProfileEdit, setShowProfileEdit] = useState(false)
  const [showAvatarUpload, setShowAvatarUpload] = useState(false)
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false)
  const [showEmailConfirmationMiniModal, setShowEmailConfirmationMiniModal] = useState(false)
  const [pendingEmailConfirmationTarget, setPendingEmailConfirmationTarget] = useState<string>('')
  
  // États pour les informations du profil
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phone: '',
    country: '',
    address: '',
    avatar: '/placeholder.jpg'
  })
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const avatarFileInputRef = useRef<HTMLInputElement | null>(null)
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null)
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false)
  const [selectedWithdrawalMethod, setSelectedWithdrawalMethod] = useState<string>('')
  const [withdrawalAmountInput, setWithdrawalAmountInput] = useState('')
  const [withdrawalIdentifier, setWithdrawalIdentifier] = useState('')
  const [withdrawalProcessing, setWithdrawalProcessing] = useState(false)
  const [withdrawalError, setWithdrawalError] = useState<string | null>(null)
  const [selectedCurrency, setSelectedCurrency] = useState<'xof' | 'usd' | 'eur' | 'gbp'>(systemPrefs.currency)

  // Nouveaux états pour les nouvelles fonctionnalités
  const [showNewMessageModal, setShowNewMessageModal] = useState(false)
  const [newMessageSubject, setNewMessageSubject] = useState('')
  const [newMessageContent, setNewMessageContent] = useState('')
  const [newMessageCategory, setNewMessageCategory] = useState('general')
  const [newMessagePriority, setNewMessagePriority] = useState('medium')
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [newMessageAttachments, setNewMessageAttachments] = useState<Array<{ name: string; url: string }>>([])
  const [isUploadingNewMessageAttachment, setIsUploadingNewMessageAttachment] = useState(false)
  const internalMessageFileInputRef = useRef<HTMLInputElement | null>(null)
  const hasAutoRefreshedAiRecommendationsRef = useRef(false)
  const prevActiveTabRef = useRef<string | null>(null)
  const [selectedNotificationCategory, setSelectedNotificationCategory] = useState('all')
  const [clientInAppNotificationCategory, setClientInAppNotificationCategory] = useState<string>('all')
  const [selectedPromotionType, setSelectedPromotionType] = useState('all')
  const [aiRecommendationFilter, setAiRecommendationFilter] = useState('all')
  const [isRefreshingAiRecommendations, setIsRefreshingAiRecommendations] = useState(false)

  const { configuration: pointsConfiguration } = useClientPoints()

  const purchaseValue = useMemo(() => {
    const raw = (pointsConfiguration?.settings as any)?.purchaseValue
    const numeric = Number(raw)
    return Number.isFinite(numeric) && numeric > 0 ? numeric : 1
  }, [pointsConfiguration])

  const getComputedPointsPrice = (price: number) => {
    return Math.max(0, Math.round(Number(price || 0) / purchaseValue))
  }

  const [shareStatsMap, setShareStatsMap] = useState<Record<string, { total: number; byPlatform: any }>>({})

  const normalizeDashboardTab = (raw: string | null | undefined) => {
    const v = String(raw ?? '').trim().toLowerCase()
    if (!v) return null
    const allowed = new Set([
      'overview',
      'orders',
      'deliveries',
      'chat',
      'shares',
      'points',
      'recommendations',
      'promotions',
      'in_app_notifications',
      'notifications',
      'messaging',
      'settings',
      'profile'
    ])
    if (allowed.has(v)) return v
    return null
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const fromQuery = normalizeDashboardTab(searchParams?.get('tab'))
    const fromHash = normalizeDashboardTab((window.location.hash || '').replace(/^#/, ''))
    const next = fromQuery || fromHash
    if (next) setActiveTab(next)
  }, [searchParams])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const nextHash = `#${String(activeTab || 'overview')}`
    if (window.location.hash !== nextHash) {
      try {
        window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${nextHash}`)
      } catch {
        // ignore
      }
    }
  }, [activeTab])

  useEffect(() => {
    let mounted = true
    const products = dashboardData?.recommendedProducts ?? []
    const pids = products.map(p => String(p.id).trim()).filter(Boolean)
    if (pids.length === 0) return

    const loadAllStats = async () => {
      try {
        const results = await Promise.all(pids.map(pid => ShareEngagementService.getProductShareCounts(pid)))
        if (!mounted) return
        const newMap: Record<string, { total: number; byPlatform: any }> = {}
        pids.forEach((pid, idx) => {
          newMap[pid] = { total: results[idx].total, byPlatform: results[idx].byPlatform }
        })
        setShareStatsMap(newMap)
      } catch {
        // noop
      }
    }
    void loadAllStats()
    return () => { mounted = false }
  }, [dashboardData?.recommendedProducts])

  const [offersCount, setOffersCount] = useState(0)
  const [specialsCount, setSpecialsCount] = useState(0)

  const [promotionsStats, setPromotionsStats] = useState<{
    activePromotionsTotal: number
    totalSavingsFcfa: number
    totalSavingsPoints: number
    flashSalesActive: number
    pointsMultiplier: number
  } | null>(null)
  const [promotionsStatsLoading, setPromotionsStatsLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    const loadStats = async () => {
      try {
        setPromotionsStatsLoading(true)

        const [offersResp, promosResp, specialsResp] = await Promise.all([
          fetch('/api/public/offers', { cache: 'no-store' }),
          fetch('/api/public/promotions', { cache: 'no-store' }),
          fetch('/api/public/special-promotions', { cache: 'no-store' })
        ])

        const offersJson = offersResp.ok ? await offersResp.json() : []
        const promosJson = promosResp.ok ? await promosResp.json() : []
        const specialsJson = specialsResp.ok ? await specialsResp.json() : []

        const offers = Array.isArray(offersJson) ? offersJson : []
        const promotions = Array.isArray(promosJson) ? promosJson : []
        const specials = Array.isArray(specialsJson) ? specialsJson : []

        const classicPromoIds = new Set<string>()
        let totalSavingsFcfa = 0

        for (const o of offers) {
          const pid = (o as any)?.promotionId
          if (typeof pid === 'string' && pid) classicPromoIds.add(pid)
          const original = Number((o as any)?.originalPrice ?? 0) || 0
          const discounted = Number((o as any)?.discountedPrice ?? 0) || 0
          const diff = Math.max(0, Math.round(original - discounted))
          totalSavingsFcfa += diff
        }

        for (const sp of specials) {
          const products = Array.isArray((sp as any)?.products) ? ((sp as any).products as any[]) : []
          for (const p of products) {
            const original = Number((p as any)?.originalPrice ?? (p as any)?.price ?? 0) || 0
            const discounted = Number((p as any)?.discountedPrice ?? (p as any)?.price ?? 0) || 0
            const diff = Math.max(0, Math.round(original - discounted))
            totalSavingsFcfa += diff
          }
        }

        const flashSalesActive = promotions.filter((p) => {
          const t = (p as any)?.type
          return t === 'flash_sale' || t === 'flash'
        }).length

        const totalSavingsPoints = Math.max(0, Math.round(totalSavingsFcfa / purchaseValue))

        const multiplierRaw = (pointsConfiguration?.settings as any)?.pointsMultiplier
          ?? (pointsConfiguration?.settings as any)?.bonusMultiplier
          ?? (pointsConfiguration?.settings as any)?.multiplier
          ?? 1
        const pointsMultiplier = Math.max(1, Number(multiplierRaw) || 1)

        const activePromotionsTotal = classicPromoIds.size + specials.length

        if (!mounted) return
        setPromotionsStats({
          activePromotionsTotal,
          totalSavingsFcfa,
          totalSavingsPoints,
          flashSalesActive,
          pointsMultiplier
        })
      } catch {
        if (!mounted) return
        setPromotionsStats({
          activePromotionsTotal: offersCount + specialsCount,
          totalSavingsFcfa: 0,
          totalSavingsPoints: 0,
          flashSalesActive: 0,
          pointsMultiplier: 1
        })
      } finally {
        if (mounted) setPromotionsStatsLoading(false)
      }
    }

    if (activeTab === 'promotions') {
      void loadStats()
    }

    return () => {
      mounted = false
    }
  }, [activeTab, offersCount, specialsCount, pointsConfiguration?.settings, purchaseValue])
  
  // États pour la section recommandations IA
  const [showSellerDetailsModal, setShowSellerDetailsModal] = useState(false)
  const [showPromotionDetailsModal, setShowPromotionDetailsModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [selectedSeller, setSelectedSeller] = useState<any>(null)
  const [selectedPromotion, setSelectedPromotion] = useState<any>(null)
  
  // États pour les paramètres
  const [selectedLanguage, setSelectedLanguage] = useState<'fr' | 'en' | 'es' | 'de'>(systemPrefs.language)
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | 'auto'>(systemPrefs.theme)
  const [selectedTimezone, setSelectedTimezone] = useState<'africa_cotonou' | 'europe_paris' | 'america_new_york' | 'asia_tokyo'>(systemPrefs.timezone)
  const [settingsSubTab, setSettingsSubTab] = useState<'general' | 'security' | 'privacy' | 'actions'>('general')
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false)
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [isTwoFactorBusy, setIsTwoFactorBusy] = useState(false)
  const [twoFactorQrSvg, setTwoFactorQrSvg] = useState<string | null>(null)
  const [twoFactorSecret, setTwoFactorSecret] = useState<string | null>(null)
  const [twoFactorFactorId, setTwoFactorFactorId] = useState<string | null>(null)
  const [twoFactorChallengeId, setTwoFactorChallengeId] = useState<string | null>(null)
  const [showSessionsModal, setShowSessionsModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [isSigningOutOtherSessions, setIsSigningOutOtherSessions] = useState(false)
  const [isExportingAccountData, setIsExportingAccountData] = useState(false)
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false)
  const [showPrivacyPolicyModal, setShowPrivacyPolicyModal] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [deleteAccountConfirmText, setDeleteAccountConfirmText] = useState('')
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  
  // États pour les modales de sécurité
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  
  // États pour les notifications
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    push: true,
    sms: false,
    orders: true,
    points: true,
    chat: true,
    promotions: true,
    system: false,
    ai: true
  })
  const [notificationFrequency, setNotificationFrequency] = useState('daily')
  const [notificationStartTime, setNotificationStartTime] = useState('08:00')
  const [notificationEndTime, setNotificationEndTime] = useState('22:00')
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false)
  const [showNotificationActions, setShowNotificationActions] = useState<Record<string, boolean>>({})
  const [showNotificationSettings, setShowNotificationSettings] = useState(false)
  const [isSavingNotificationPrefs, setIsSavingNotificationPrefs] = useState(false)
  const notificationPrefsSaveTimerRef = useRef<number | null>(null)
  const notificationSettingsRef = useRef(notificationSettings)
  const notificationFrequencyRef = useRef(notificationFrequency)
  const notificationStartTimeRef = useRef(notificationStartTime)
  const notificationEndTimeRef = useRef(notificationEndTime)
  const [notificationPrefsFeedback, setNotificationPrefsFeedback] = useState<null | {
    type: 'success' | 'error'
    title: string
    description: string
  }>(null)
  
  // États pour les notifications (connectées à Supabase)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [internalMessages, setInternalMessages] = useState<InternalMessage[]>([])
  const [messageDeliveryStatus, setMessageDeliveryStatus] = useState<Record<string, { status: MessageStatus; timestamp: string }>>({})
  const notificationsRealtimeRefreshTimerRef = useRef<number | null>(null)

  /**
   * Déduit la liste des catégories disponibles depuis les notifications in-app (DB).
   */
  const clientInAppNotificationCategories = useMemo(() => {
    const categories = new Set<string>()
    notifications.forEach((n) => {
      const raw = String((n as any)?.category ?? 'general').trim().toLowerCase()
      categories.add(raw || 'general')
    })
    return Array.from(categories).sort((a, b) => a.localeCompare(b, 'fr'))
  }, [notifications])

  /**
   * Applique le filtre catégorie à l'onglet "Notifications" (in-app).
   */
  const filteredClientInAppNotifications = useMemo(() => {
    if (clientInAppNotificationCategory === 'all') return notifications
    return notifications.filter(
      (n) => String((n as any)?.category ?? '').trim().toLowerCase() === clientInAppNotificationCategory
    )
  }, [clientInAppNotificationCategory, notifications])

  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [notificationStats, setNotificationStats] = useState<null | {
    total: number
    unread: number
    promotions: number
    orders: number
  }>(null)
  const [notificationStatsLoading, setNotificationStatsLoading] = useState(false)
  const [messageStats, setMessageStats] = useState<null | {
    total: number
    unread: number
    admin: number
    fromUser: number
  }>(null)
  const [showAllNotifications, setShowAllNotifications] = useState(false)

  useEffect(() => {
    notificationSettingsRef.current = notificationSettings
  }, [notificationSettings])

  useEffect(() => {
    notificationFrequencyRef.current = notificationFrequency
  }, [notificationFrequency])

  useEffect(() => {
    notificationStartTimeRef.current = notificationStartTime
  }, [notificationStartTime])

  useEffect(() => {
    notificationEndTimeRef.current = notificationEndTime
  }, [notificationEndTime])

  /**
   * Sauvegarde (debounce) les préférences notifications dans la DB via DashboardService.
   */
  const queueSaveNotificationPreferences = useCallback((options?: { silent?: boolean }) => {
    const silent = options?.silent ?? true

    try {
      if (notificationPrefsSaveTimerRef.current) {
        window.clearTimeout(notificationPrefsSaveTimerRef.current)
      }
    } catch {
      // ignore
    }

    try {
      notificationPrefsSaveTimerRef.current = window.setTimeout(async () => {
        if (!user?.id) {
          if (!silent) {
            toast({
              title: 'Notifications',
              description: 'Reconnecte-toi pour enregistrer tes préférences.',
              variant: 'destructive'
            })
          }
          return
        }

        setIsSavingNotificationPrefs(true)
        try {
          const currentSettings = notificationSettingsRef.current
          const currentFrequency = notificationFrequencyRef.current
          const currentStart = notificationStartTimeRef.current
          const currentEnd = notificationEndTimeRef.current

          // Backup localStorage (best-effort)
          try {
            if (typeof window !== 'undefined') {
              window.localStorage.setItem('notificationSettings', JSON.stringify(currentSettings))
              window.localStorage.setItem('notificationFrequency', currentFrequency)
              window.localStorage.setItem('notificationStartTime', currentStart)
              window.localStorage.setItem('notificationEndTime', currentEnd)
            }
          } catch {
            // ignore
          }

          const { preferences } = await DashboardService.updateNotificationPreferences({
            userId: user.id,
            notificationSettings: currentSettings,
            notificationFrequency: currentFrequency,
            notificationStartTime: currentStart,
            notificationEndTime: currentEnd
          })

          // Met à jour dashboardDataRaw pour que toute l'UI reflète immédiatement les nouveaux prefs.
          setDashboardDataRaw((prev) => {
            if (!prev) return prev
            const nextUserProfile = {
              ...(prev as any).userProfile,
              ...(preferences ? { preferences } : {})
            }
            return { ...(prev as any), userProfile: nextUserProfile }
          })

          if (!silent) {
            toast({
              title: 'Notifications',
              description: 'Préférences enregistrées.',
              variant: 'default'
            })
          }
        } catch {
          if (!silent) {
            toast({
              title: 'Notifications',
              description: "Impossible d'enregistrer pour le moment.",
              variant: 'destructive'
            })
          }
        } finally {
          setIsSavingNotificationPrefs(false)
        }
      }, 700) as any
    } catch {
      // ignore
    }
  }, [toast, user?.id])

  /**
   * Applique un toggle notification + lance une sauvegarde en DB (debounce).
   */
  const setNotificationToggle = useCallback((key: keyof typeof notificationSettings, value: boolean) => {
    setNotificationSettings((prev) => ({ ...prev, [key]: value }))
    queueSaveNotificationPreferences({ silent: true })
  }, [queueSaveNotificationPreferences])

  const [selectedInternalMessage, setSelectedInternalMessage] = useState<InternalMessage | null>(null)

  /**
   * Déconnecte les autres appareils (révocation des autres sessions Supabase).
   */
  const handleSignOutOtherSessions = async () => {
    if (isSigningOutOtherSessions) return
    setIsSigningOutOtherSessions(true)

    try {
      const { error: signOutError } = await supabase.auth.signOut({ scope: 'others' as any })
      if (signOutError) {
        const accessToken = await getClientAccessTokenSafe()
        const headers: Record<string, string> = { accept: 'application/json' }
        if (accessToken) headers.Authorization = `Bearer ${accessToken}`

        const resp = await fetch('/api/client/sessions/signout-others', {
          method: 'POST',
          headers
        })

        const body = await resp.json().catch(() => null)
        if (!resp.ok) {
          const msg = body?.error ? String(body.error) : signOutError.message
          toast({
            title: 'Sessions',
            description: msg,
            variant: 'destructive'
          })
          return
        }
      }

      toast({
        title: 'Sessions mises à jour',
        description: 'Les autres appareils ont été déconnectés.',
        variant: 'default'
      })
      void loadActiveSessions()
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive'
      })
    } finally {
      setIsSigningOutOtherSessions(false)
    }
  }

  /**
   * Exporte réellement les données du compte via l'API.
   */
  const handleExportAccountData = async () => {
    if (isExportingAccountData) return
    setIsExportingAccountData(true)

    try {
      const accessToken = await getClientAccessTokenSafe()
      const headers: Record<string, string> = { accept: 'application/json' }
      if (accessToken) headers.Authorization = `Bearer ${accessToken}`

      const resp = await fetch('/api/client/account/export', {
        method: 'POST',
        headers
      })

      const body = await resp.json().catch(() => null)
      if (!resp.ok) {
        const msg = body?.error ? String(body.error) : 'Export impossible.'
        toast({
          title: 'Export',
          description: msg,
          variant: 'destructive'
        })
        return
      }

      const data = body?.data ?? body
      const content = JSON.stringify(data, null, 2)
      const filename = `export-compte-${new Date().toISOString().split('T')[0]}.json`

      const blob = new Blob([content], { type: 'application/json;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: 'Export terminé',
        description: 'Vos données ont été téléchargées en JSON.',
        variant: 'default'
      })

      setShowExportModal(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      toast({
        title: 'Erreur export',
        description: message,
        variant: 'destructive'
      })
    } finally {
      setIsExportingAccountData(false)
    }
  }

  /**
   * Sauvegarde le profil client :
   * - user_profiles via /api/client/profile/update
   * - email via supabase.auth.updateUser({ email }) (si modifié)
   * - puis synchronisation email dans public.users via /api/client/profile/update
   */
  const handleSaveProfile = async () => {
    if (isSavingProfile) return
    setIsSavingProfile(true)

    try {
      const fullName = String(profileData.fullName ?? '').trim()
      const email = String(profileData.email ?? '').trim()

      const splitFullName = (value: string) => {
        const normalized = String(value ?? '').trim().replace(/\s+/g, ' ')
        if (!normalized) return { first_name: '', last_name: '' }
        const parts = normalized.split(' ')
        if (parts.length === 1) return { first_name: parts[0], last_name: '' }
        return { first_name: parts.slice(0, -1).join(' '), last_name: parts.slice(-1).join(' ') }
      }

      const nameParts = splitFullName(fullName)

      if (!fullName) {
        toast({
          title: 'Profil',
          description: 'Le nom complet est requis.',
          variant: 'destructive'
        })
        return
      }

      if (!email || !email.includes('@')) {
        toast({
          title: 'Profil',
          description: "L'email est invalide.",
          variant: 'destructive'
        })
        return
      }

      const previousEmail = String(user?.email ?? '').trim()
      const emailChanged = Boolean(previousEmail) && previousEmail.toLowerCase() !== email.toLowerCase()

      let shouldSyncEmailInDb = true
      let shouldShowEmailConfirmationMiniModal = false
      if (emailChanged) {
        const { data: updateEmailData, error: updateEmailError } = await supabase.auth.updateUser({ email })
        if (updateEmailError) {
          toast({
            title: 'Email',
            description: "Impossible de modifier l'email. Réessaie.",
            variant: 'destructive'
          })
          return
        }

        const authEmail = String(updateEmailData?.user?.email ?? '').trim()
        const newEmail = String((updateEmailData?.user as any)?.new_email ?? '').trim()

        // Si l'email n'est pas encore effectif (confirmation requise), on évite de désynchroniser public.users.
        if (authEmail.toLowerCase() !== email.toLowerCase()) {
          shouldSyncEmailInDb = false
          shouldShowEmailConfirmationMiniModal = true
          setPendingEmailConfirmationTarget(newEmail || email)
        } else {
          setPendingEmailConfirmationTarget('')
        }
      }

      // Synchronise aussi les infos dans Supabase Auth (user_metadata) afin que l'onglet Authentication reflète les changements.
      // Note: auth.users ne contient pas forcément first_name/last_name en colonnes: c'est souvent stocké dans user_metadata.
      const { error: updateMetadataError } = await supabase.auth.updateUser({
        data: {
          first_name: nameParts.first_name,
          last_name: nameParts.last_name,
          full_name: fullName,
          phone: String(profileData.phone ?? '').trim(),
          country: String(profileData.country ?? '').trim(),
          address: String(profileData.address ?? '').trim()
        }
      })

      if (updateMetadataError) {
        toast({
          title: 'Profil',
          description: updateMetadataError.message,
          variant: 'destructive'
        })
        return
      }

      const accessToken = await getClientAccessTokenSafe()
      const headers: Record<string, string> = {
        accept: 'application/json',
        'content-type': 'application/json'
      }
      if (accessToken) headers.Authorization = `Bearer ${accessToken}`

      const resp = await fetch('/api/client/profile/update', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          fullName,
          ...(shouldSyncEmailInDb ? { email } : {}),
          phone: profileData.phone,
          country: profileData.country,
          address: profileData.address
        })
      })

      const body = await resp.json().catch(() => null)
      if (!resp.ok) {
        const msg = body?.error ? String(body.error) : 'Sauvegarde impossible.'
        toast({
          title: 'Profil',
          description: msg,
          variant: 'destructive'
        })
        return
      }

      toast({
        title: 'Modifications enregistrées',
        description: 'Votre profil a été mis à jour.',
        variant: 'default'
      })

      // Rafraîchit l'UI immédiatement (le reste du dashboard peut afficher dashboardData.userProfile).
      setDashboardDataRaw(prev => {
        if (!prev) return prev
        const nextProfile = {
          ...(prev as any).userProfile,
          first_name: nameParts.first_name,
          last_name: nameParts.last_name,
          phone: String(profileData.phone ?? '').trim(),
          country: String(profileData.country ?? '').trim(),
          address: String(profileData.address ?? '').trim(),
          ...(shouldSyncEmailInDb && email ? { email } : {})
        }
        return { ...(prev as any), userProfile: nextProfile }
      })

      setProfileData(prev => ({
        ...prev,
        fullName,
        email,
        phone: String(profileData.phone ?? '').trim(),
        country: String(profileData.country ?? '').trim(),
        address: String(profileData.address ?? '').trim()
      }))

      setShowProfileEdit(false)

      if (shouldShowEmailConfirmationMiniModal) {
        setShowEmailConfirmationMiniModal(true)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      toast({
        title: 'Erreur',
        description: "Une erreur est survenue. Réessaie.",
        variant: 'destructive'
      })
    } finally {
      setIsSavingProfile(false)
    }
  }

  /**
   * Upload l'avatar via /api/client/avatar et met à jour profileData.avatar.
   */
  const handleUploadAvatar = async () => {
    if (isUploadingAvatar) return

    try {
      if (!selectedAvatarFile) {
        toast({
          title: 'Avatar',
          description: 'Sélectionne une image avant de confirmer.',
          variant: 'destructive'
        })
        return
      }

      setIsUploadingAvatar(true)

      toast({
        title: 'Avatar',
        description: 'Upload en cours...',
        variant: 'default'
      })

      const accessToken = await getClientAccessTokenSafe()
      const headers: Record<string, string> = { accept: 'application/json' }
      if (accessToken) headers.Authorization = `Bearer ${accessToken}`

      const form = new FormData()
      form.append('file', selectedAvatarFile)

      const resp = await fetch('/api/client/avatar', {
        method: 'POST',
        headers,
        body: form
      })

      const rawText = await resp.text().catch(() => '')
      const body = rawText ? (() => { try { return JSON.parse(rawText) } catch { return null } })() : null

      if (!resp.ok) {
        const msg = body?.error
          ? String(body.error)
          : rawText?.trim()
            ? rawText.slice(0, 300)
            : `Upload impossible (HTTP ${resp.status}).`
        toast({
          title: 'Avatar',
          description: msg,
          variant: 'destructive'
        })
        return
      }

      const publicUrl = body?.data?.publicUrl ? String(body.data.publicUrl) : ''
      if (!publicUrl) {
        toast({
          title: 'Avatar',
          description: 'Réponse invalide du serveur (URL manquante).',
          variant: 'destructive'
        })
        return
      }

      setProfileData(prev => ({ ...prev, avatar: publicUrl }))
      setSelectedAvatarFile(null)

      toast({
        title: 'Avatar mis à jour !',
        description: 'Votre photo de profil a été mise à jour.',
        variant: 'default'
      })

      setShowAvatarUpload(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive'
      })
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  /**
   * Charge l'état réel de la 2FA (facteurs MFA) depuis Supabase.
   */
  const refreshTwoFactorState = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors()
      if (error) {
        throw error
      }

      const verifiedTotp = (data?.totp ?? []).find((f: any) => f?.status === 'verified')
      setTwoFactorEnabled(Boolean(verifiedTotp))
      setTwoFactorFactorId(verifiedTotp?.id ?? null)
    } catch (err) {
      console.warn('MFA listFactors error:', err)
    }
  }

  /**
   * Démarre l'enrôlement TOTP : enroll + challenge.
   */
  const startTwoFactorEnrollment = async () => {
    if (isTwoFactorBusy) return
    setIsTwoFactorBusy(true)

    try {
      setTwoFactorCode('')
      setTwoFactorChallengeId(null)
      setTwoFactorFactorId(null)
      setTwoFactorQrSvg(null)
      setTwoFactorSecret(null)

      const { data: enrollData, error: enrollError } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
      if (enrollError || !enrollData?.id) {
        throw enrollError ?? new Error("Impossible d'activer la 2FA.")
      }

      setTwoFactorFactorId(enrollData.id)
      setTwoFactorQrSvg((enrollData as any)?.totp?.qr_code ?? null)
      setTwoFactorSecret((enrollData as any)?.totp?.secret ?? null)

      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: enrollData.id })
      if (challengeError || !challengeData?.id) {
        throw challengeError ?? new Error('Challenge MFA impossible.')
      }

      setTwoFactorChallengeId(challengeData.id)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      toast({
        title: '2FA',
        description: message,
        variant: 'destructive'
      })
    } finally {
      setIsTwoFactorBusy(false)
    }
  }

  /**
   * Vérifie le code TOTP et active réellement le facteur.
   */
  const verifyTwoFactorCode = async () => {
    if (isTwoFactorBusy) return

    const code = twoFactorCode.trim()
    if (code.length !== 6) {
      toast({
        title: 'Code invalide',
        description: 'Entrez un code à 6 chiffres.',
        variant: 'destructive'
      })
      return
    }

    if (!twoFactorFactorId || !twoFactorChallengeId) {
      toast({
        title: '2FA',
        description: "La configuration n'est pas prête. Réessayez.",
        variant: 'destructive'
      })
      return
    }

    setIsTwoFactorBusy(true)

    try {
      const { data, error } = await supabase.auth.mfa.verify({
        factorId: twoFactorFactorId,
        challengeId: twoFactorChallengeId,
        code
      })

      if (error) {
        throw error
      }

      if (!(data as any)) {
        // no-op, supabase renvoie parfois data vide
      }

      await refreshTwoFactorState()
      setShowTwoFactorSetup(false)
      setTwoFactorCode('')
      setTwoFactorChallengeId(null)
      setTwoFactorQrSvg(null)
      setTwoFactorSecret(null)

      toast({
        title: '2FA activée',
        description: "L'authentification à deux facteurs est maintenant active.",
        variant: 'default'
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      toast({
        title: 'Échec de vérification',
        description: message,
        variant: 'destructive'
      })
    } finally {
      setIsTwoFactorBusy(false)
    }
  }

  /**
   * Désactive réellement la 2FA (unenroll du facteur vérifié).
   */
  const disableTwoFactor = async () => {
    if (isTwoFactorBusy) return
    setIsTwoFactorBusy(true)

    try {
      const { data, error } = await supabase.auth.mfa.listFactors()
      if (error) {
        throw error
      }

      const verifiedTotp = (data?.totp ?? []).find((f: any) => f?.status === 'verified')
      const factorId = verifiedTotp?.id

      if (!factorId) {
        setTwoFactorEnabled(false)
        setTwoFactorFactorId(null)
        setShowTwoFactorSetup(false)
        return
      }

      const { error: unenrollError } = await supabase.auth.mfa.unenroll({ factorId })
      if (unenrollError) {
        throw unenrollError
      }

      await refreshTwoFactorState()
      setShowTwoFactorSetup(false)

      toast({
        title: '2FA désactivée',
        description: "L'authentification à deux facteurs a été désactivée.",
        variant: 'default'
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      toast({
        title: 'Erreur 2FA',
        description: message,
        variant: 'destructive'
      })
    } finally {
      setIsTwoFactorBusy(false)
    }
  }

  useEffect(() => {
    if (!showTwoFactorSetup) return

    let cancelled = false

    const run = async () => {
      setIsTwoFactorBusy(true)
      try {
        const { data, error } = await supabase.auth.mfa.listFactors()
        if (error) throw error

        const verifiedTotp = (data?.totp ?? []).find((f: any) => f?.status === 'verified')
        if (cancelled) return

        if (verifiedTotp?.id) {
          setTwoFactorEnabled(true)
          setTwoFactorFactorId(verifiedTotp.id)
          setTwoFactorQrSvg(null)
          setTwoFactorSecret(null)
          setTwoFactorChallengeId(null)
          return
        }

        setTwoFactorEnabled(false)
        await startTwoFactorEnrollment()
      } catch (err) {
        console.warn('MFA init error:', err)
      } finally {
        if (!cancelled) setIsTwoFactorBusy(false)
      }
    }

    void run()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showTwoFactorSetup])

  /**
   * Supprime (soft delete) réellement le compte client via l'API.
   */
  const handleDeleteAccountSubmit = async () => {
    if (isDeletingAccount) return

    if (deleteAccountConfirmText.trim().toUpperCase() !== 'SUPPRIMER') {
      toast({
        title: 'Confirmation requise',
        description: 'Tapez SUPPRIMER pour confirmer.',
        variant: 'destructive'
      })
      return
    }

    setIsDeletingAccount(true)

    try {
      const accessToken = await getClientAccessTokenSafe()
      const headers: Record<string, string> = { accept: 'application/json' }
      if (accessToken) headers.Authorization = `Bearer ${accessToken}`

      const resp = await fetch('/api/client/account/delete', {
        method: 'POST',
        headers
      })

      const body = await resp.json().catch(() => null)
      if (!resp.ok) {
        const msg = body?.error ? String(body.error) : 'Suppression impossible.'
        toast({
          title: 'Échec de la suppression',
          description: msg,
          variant: 'destructive'
        })
        return
      }

      toast({
        title: 'Compte désactivé',
        description: 'Votre compte a été désactivé. Vous allez être déconnecté.',
        variant: 'default'
      })

      setShowDeleteAccountModal(false)
      setDeleteAccountConfirmText('')

      await signOut()

      if (typeof window !== 'undefined') {
        window.location.href = '/'
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      toast({
        title: 'Erreur inattendue',
        description: message,
        variant: 'destructive'
      })
    } finally {
      setIsDeletingAccount(false)
    }
  }

  /**
   * Change réellement le mot de passe via Supabase Auth.
   * Étapes: re-login avec le mot de passe actuel (ré-auth), puis updatePassword(newPassword).
   */
  const handlePasswordChangeSubmit = async () => {
    if (!user?.email) {
      toast({
        title: 'Action impossible',
        description: "Vous devez être connecté pour modifier votre mot de passe.",
        variant: 'destructive'
      })
      return
    }

    if (newPassword.length < 8) {
      toast({
        title: 'Mot de passe trop court',
        description: 'Le nouveau mot de passe doit contenir au moins 8 caractères',
        variant: 'destructive'
      })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Confirmation invalide',
        description: 'Les mots de passe ne correspondent pas.',
        variant: 'destructive'
      })
      return
    }

    if (newPassword === currentPassword) {
      toast({
        title: 'Mot de passe identique',
        description: "Le nouveau mot de passe doit être différent de l'actuel",
        variant: 'destructive'
      })
      return
    }

    if (isChangingPassword) return
    setIsChangingPassword(true)

    try {
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      })

      if (reauthError) {
        toast({
          title: 'Mot de passe actuel incorrect',
          description: "Le mot de passe actuel n'est pas correct.",
          variant: 'destructive'
        })
        return
      }

      const { error: updateError } = await updatePassword(newPassword)
      if (updateError) {
        toast({
          title: 'Échec de la modification',
          description: "Impossible de modifier le mot de passe. Réessaie.",
          variant: 'destructive'
        })
        return
      }

      toast({
        title: 'Mot de passe modifié !',
        description: 'Votre mot de passe a été modifié avec succès',
        variant: 'default'
      })

      setShowPasswordChangeModal(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      toast({
        title: 'Erreur inattendue',
        description: message,
        variant: 'destructive'
      })
    } finally {
      setIsChangingPassword(false)
    }
  }
  const [showInternalMessageModal, setShowInternalMessageModal] = useState(false)
  const [showInternalMessageEditModal, setShowInternalMessageEditModal] = useState(false)
  const [editInternalMessageSubject, setEditInternalMessageSubject] = useState('')
  const [editInternalMessageContent, setEditInternalMessageContent] = useState('')
  const [isUpdatingInternalMessage, setIsUpdatingInternalMessage] = useState(false)

  useEffect(() => {
    setSelectedLanguage(systemPrefs.language)
    setSelectedTheme(systemPrefs.theme)
    setSelectedTimezone(systemPrefs.timezone)
    setSelectedCurrency(systemPrefs.currency)
  }, [systemPrefs.currency, systemPrefs.language, systemPrefs.theme, systemPrefs.timezone])

  useEffect(() => {
    if (!user?.id) return
    setDashboardDataRaw((prev) => {
      if (!prev) return prev
      const existingPrefs = ((prev as any).userProfile?.preferences && typeof (prev as any).userProfile.preferences === 'object' && !Array.isArray((prev as any).userProfile.preferences))
        ? (prev as any).userProfile.preferences
        : {}
      const nextPreferences = { ...existingPrefs, system: { ...(existingPrefs as any).system, ...systemPrefs } }
      return {
        ...(prev as any),
        userProfile: {
          ...(prev as any).userProfile,
          preferences: nextPreferences
        }
      }
    })
  }, [systemPrefs, user?.id])
  const realChatSessions = useMemo<DashboardChatSession[]>(() => (dashboardData?.chats ?? []) as DashboardChatSession[], [dashboardData?.chats])
  const realChatMessages = useMemo<DashboardChatMessage[]>(() => (dashboardData?.chatMessages ?? []) as DashboardChatMessage[], [dashboardData?.chatMessages])
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [selectedChatIds, setSelectedChatIds] = useState<Record<string, boolean>>({})
  const [openingChatContact, setOpeningChatContact] = useState<ChatContact | null>(null)
  const [chatSearchQuery, setChatSearchQuery] = useState('')
  const [productSearchQuery, setProductSearchQuery] = useState('')
  const [messageFilterCategory, setMessageFilterCategory] = useState<'all' | MessageCategory>('all')
  const [messageFilterPriority, setMessageFilterPriority] = useState<'all' | MessagePriority>('all')
  const [messageSearchTerm, setMessageSearchTerm] = useState('')
  const getFilteredInternalMessages = useCallback(
    (category: 'all' | MessageCategory, priority: 'all' | MessagePriority, rawQuery: string) => {
      const normalizedQuery = rawQuery.trim().toLowerCase()

      return internalMessages.filter(message => {
        const categoryMatch = category === 'all' || message.category === category
        const priorityMatch = priority === 'all' || message.priority === priority

        if (normalizedQuery.length <= 2) {
          return categoryMatch && priorityMatch
        }

        const subjectMatch = message.subject.toLowerCase().includes(normalizedQuery)
        const contentMatch = message.content.toLowerCase().includes(normalizedQuery)
        const categoryLabelMatch = message.category.toLowerCase().includes(normalizedQuery)

        return categoryMatch && priorityMatch && (subjectMatch || contentMatch || categoryLabelMatch)
      })
    },
    [internalMessages]
  )
  const filteredInternalMessages = useMemo<InternalMessage[]>(
    () => getFilteredInternalMessages(messageFilterCategory, messageFilterPriority, messageSearchTerm),
    [getFilteredInternalMessages, messageFilterCategory, messageFilterPriority, messageSearchTerm]
  )
  const internalMessagesTotal = useMemo<number>(
    () => messageStats?.total ?? internalMessages.length,
    [internalMessages, messageStats]
  )
  const unreadInternalMessagesCount = useMemo<number>(
    () => messageStats?.unread ?? internalMessages.filter(message => !message.isRead).length,
    [internalMessages, messageStats]
  )
  const adminInternalMessagesCount = useMemo<number>(
    () => messageStats?.admin ?? internalMessages.filter(message => message.from === 'admin').length,
    [internalMessages, messageStats]
  )
  const userInternalMessagesCount = useMemo<number>(
    () => messageStats?.fromUser ?? internalMessages.filter(message => message.from !== 'admin').length,
    [internalMessages, messageStats]
  )

  // États pour les fonctionnalités du chat
  const [chatActiveTab, setChatActiveTab] = useState<'conversations' | 'produits'>('conversations')
  const [chatInput, setChatInput] = useState('')
  const [selectedChatPartner, setSelectedChatPartner] = useState<ChatContact | null>(null)

  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [isRecording, setIsRecording] = useState(false)
  const [recordingPaused, setRecordingPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const recordingChunksRef = useRef<BlobPart[]>([])
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const recordingPausedRef = useRef(false)

  const [isMessageSelectMode, setIsMessageSelectMode] = useState(false)
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(new Set())

  const pendingOpenChatVendorIdRef = useRef<string | null>(null)

  const { addToCart: addToCartReal } = useCart()

  const [isProductInfoOpen, setIsProductInfoOpen] = useState(false)
  const [productInfoLoading, setProductInfoLoading] = useState(false)
  const [productInfoError, setProductInfoError] = useState<string | null>(null)
  const [productInfoData, setProductInfoData] = useState<any>(null)

  const productInfoCacheRef = useRef<Map<string, any>>(new Map())
  const productInfoAbortRef = useRef<AbortController | null>(null)
  const productInfoActiveIdRef = useRef<string>('')
  
  // États pour les modales
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false)
  const [showPointsDetailsModal, setShowPointsDetailsModal] = useState(false)
  const [showPromotionModal, setShowPromotionModal] = useState(false)
  const [showSpecialPromotionModal, setShowSpecialPromotionModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [selectedSpecialPromotion, setSelectedSpecialPromotion] = useState<any>(null)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [selectedTransferMessageIds, setSelectedTransferMessageIds] = useState<string[]>([])
  const [selectedTransferSeller, setSelectedTransferSeller] = useState<string | null>(null)
  
  // États pour les évaluations et suivi
  const [showOrderEvaluationModal, setShowOrderEvaluationModal] = useState(false)
  const [showOrderTrackingModal, setShowOrderTrackingModal] = useState(false)
  const [selectedOrderForAction, setSelectedOrderForAction] = useState<Order | null>(null)
  const [evaluationRating, setEvaluationRating] = useState(0)
  const [evaluationComment, setEvaluationComment] = useState('')
  const [trackingCode, setTrackingCode] = useState('')
  
  // États pour les fonctionnalités des vendeurs
  const [sellerFavorites, setSellerFavorites] = useState<string[]>([])
  const [sellerChatHistory, setSellerChatHistory] = useState<any[]>([])
  const [sellerFollowStatus, setSellerFollowStatus] = useState<Record<string, boolean>>({})
  
  // États pour les notifications et alertes
  const [showPromotionSuccessModal, setShowPromotionSuccessModal] = useState(false)
  const [showProductAddedModal, setShowProductAddedModal] = useState(false)
  const [showSellerContactModal, setShowSellerContactModal] = useState(false)
  const [showPromotionHistoryModal, setShowPromotionHistoryModal] = useState(false)
  const [selectedItemForShare, setSelectedItemForShare] = useState<any>(null)
  
  // États pour les fonctionnalités des promotions
  const [promotionFavorites, setPromotionFavorites] = useState<string[]>([])
  const [promotionAlerts, setPromotionAlerts] = useState<string[]>([])
  const [promotionUsage, setPromotionUsage] = useState<Record<string, number>>({})
  const [appliedPromotions, setAppliedPromotions] = useState<string[]>([])
  const [promotionHistory, setPromotionHistory] = useState<any[]>([])
  const [showShareModal, setShowShareModal] = useState(false)
  const [showProductsModal, setShowProductsModal] = useState(false)
  
  // États pour les fonctionnalités des produits
  const [productFavorites, setProductFavorites] = useState<string[]>([])
  const [productCart, setProductCart] = useState<any[]>([])
  const [productWishlist, setProductWishlist] = useState<string[]>([])
  const [productShareHistory, setProductShareHistory] = useState<any[]>([])
  
  // État pour le menu de partage
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [openProductShareMenu, setOpenProductShareMenu] = useState<string | null>(null)
  
  // États pour la section partage
  const [showProductDetailsModal, setShowProductDetailsModal] = useState(false)
  const [selectedProductForDetails, setSelectedProductForDetails] = useState<any>(null)
  
  // États pour la section points
  const [showPointsPurchaseModal, setShowPointsPurchaseModal] = useState(false)
  const [selectedPointsOffer, setSelectedPointsOffer] = useState<any>(null)
  const [customPointsPurchaseAmountInput, setCustomPointsPurchaseAmountInput] = useState('')
  const [customPointsPurchasePointsInput, setCustomPointsPurchasePointsInput] = useState('')

  // États pour la gestion des points (transfert, échange, retrait)
  const [pointsConfigurationState, setPointsConfigurationState] = useState<ClientPointsConfiguration | null>(null)
  const [pointsSummary, setPointsSummary] = useState<ClientPointsSummary | null>(null)
  const [pointsLoading, setPointsLoading] = useState(true)
  const [pointsError, setPointsError] = useState<string | null>(null)

  const isPointsFrozen = useMemo(() => {
    const fromRealtime = (loyaltyPoints as any)?.is_frozen
    if (typeof fromRealtime === 'boolean') {
      return fromRealtime
    }
    return Boolean(pointsSummary?.isFrozen ?? false)
  }, [loyaltyPoints, pointsSummary?.isFrozen])

  const pointsFrozenReason = useMemo(() => {
    const fromRealtime = (loyaltyPoints as any)?.freeze_reason
    if (typeof fromRealtime === 'string') {
      return fromRealtime.toString().trim()
    }
    return (pointsSummary?.freezeReason ?? '').toString().trim()
  }, [loyaltyPoints, pointsSummary?.freezeReason])
  const pointsFrozenMessage = useMemo(() => {
    if (!isPointsFrozen) {
      return null
    }

    return pointsFrozenReason ? `Compte gelé : ${pointsFrozenReason}` : 'Compte gelé : opérations de points désactivées'
  }, [isPointsFrozen, pointsFrozenReason])

  // États pour le transfert de points
  const [showTransferPointsModal, setShowTransferPointsModal] = useState(false)
  const [transferRecipientQuery, setTransferRecipientQuery] = useState('')
  const [transferRecipientResults, setTransferRecipientResults] = useState<TransferRecipient[]>([])
  const [transferRecipientLoading, setTransferRecipientLoading] = useState(false)
  const [transferSelectedRecipient, setTransferSelectedRecipient] = useState<TransferRecipient | null>(null)
  const [transferAmountInput, setTransferAmountInput] = useState('')
  const [transferProcessing, setTransferProcessing] = useState(false)
  const [transferError, setTransferError] = useState<string | null>(null)

  // États pour l'échange de points
  const [showExchangePointsModal, setShowExchangePointsModal] = useState(false)
  const [exchangeAmountInput, setExchangeAmountInput] = useState('')
  const [exchangeCurrency, setExchangeCurrency] = useState<string>('')
  const [exchangeProcessing, setExchangeProcessing] = useState(false)
  const [exchangeError, setExchangeError] = useState<string | null>(null)
  const [exchangeRewardOptions, setExchangeRewardOptions] = useState<ClientRewardOption[]>([])
  const [exchangeOptionsLoading, setExchangeOptionsLoading] = useState(false)
  const [selectedExchangeOption, setSelectedExchangeOption] = useState<'currency' | 'gift' | 'voucher' | 'discount'>('currency')
  const [selectedRewardId, setSelectedRewardId] = useState<string>('')

  const POINTS_BASE_CURRENCY = 'PTS'

  // États pour le processus de paiement
  const [paymentStep, setPaymentStep] = useState<'selection' | 'details' | 'processing' | 'success' | 'error'>('selection')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'mobile-money' | 'bank-transfer' | 'card'>('mobile-money')
  const [paymentDetails, setPaymentDetails] = useState({
    phoneNumber: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
    bankAccount: '',
    accountName: ''
  })
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  // Fonction pour obtenir la couleur des activités
  const getActivityColor = (type: string) => {
    switch (type) {
      case 'order': return 'bg-green-500'
      case 'points': return 'bg-blue-500'
      case 'share': return 'bg-purple-500'
      case 'chat': return 'bg-orange-500'
      case 'promotion': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  // Fonction pour confirmer le transfert de messages
  const confirmTransfer = useCallback(() => {
    toast({
      title: 'Fonctionnalité à venir',
      description: 'Le transfert de messages sera bientôt disponible.',
      variant: 'default'
    })
  }, [toast])

  const markMessagesAsImportant = useCallback(() => {
    toast({
      title: 'Fonctionnalité à venir',
      description: 'Le marquage en important arrive prochainement.',
      variant: 'default'
    })
  }, [toast])

  const markMessagesAsUrgent = useCallback(() => {
    toast({
      title: 'Fonctionnalité à venir',
      description: 'Le marquage urgent arrive prochainement.',
      variant: 'default'
    })
  }, [toast])

  const markMessagesToResolve = useCallback(() => {
    toast({
      title: 'Fonctionnalité à venir',
      description: 'Le suivi des messages à traiter arrive prochainement.',
      variant: 'default'
    })
  }, [toast])
  
  // HOOKS LOCALSTORAGE
  const { value: cartItems } = useLocalStorageArray<CartItem>('cart', [])
  const { balance: syncedBalance, estimatedValue: syncedEstimatedValue, conversionRate: syncedConversionRate, configuration: syncedConfiguration } = useClientPoints()
  const [userPoints, setUserPoints] = useState(0)
  const [userTier, setUserTier] = useState('')

  const resolvedPointsBalance = useMemo(() => {
    const realtimeBalance = Number((loyaltyPoints as any)?.points_balance)
    if (Number.isFinite(realtimeBalance) && realtimeBalance >= 0) {
      return realtimeBalance
    }

    const summaryBalance = Number(pointsSummary?.balance)
    if (Number.isFinite(summaryBalance) && summaryBalance >= 0) {
      return summaryBalance
    }

    const userBalance = Number((dashboardDataRaw as any)?.user?.points_balance)
    if (Number.isFinite(userBalance) && userBalance >= 0) {
      return userBalance
    }

    const dashboardBalance = Number((dashboardDataRaw as any)?.pointsSummary?.balance)
    if (Number.isFinite(dashboardBalance) && dashboardBalance >= 0) {
      return dashboardBalance
    }

    const synced = Number(syncedBalance)
    return Number.isFinite(synced) && synced >= 0 ? synced : 0
  }, [dashboardDataRaw, loyaltyPoints, pointsSummary?.balance, syncedBalance])

  /**
   * Recharge le résumé + la configuration des points pour afficher les données réelles dans l'onglet Points.
   */
  const refreshPointsData = useCallback(async () => {
    if (!user?.id) {
      return
    }

    try {
      setPointsLoading(true)
      setPointsError(null)

      const [configuration, summary] = await Promise.all([
        ClientPointsService.getPointsConfiguration(user.id),
        ClientPointsService.getPointsSummary(user.id)
      ])

      setPointsConfigurationState(configuration)
      setPointsSummary(summary)
      setUserPoints(summary?.balance ?? 0)
    } catch (error) {
      console.error('Erreur lors du chargement de la configuration points client:', error)
      setPointsError(error instanceof Error ? error.message : 'Impossible de charger les informations de points')
    } finally {
      setPointsLoading(false)
    }
  }, [user?.id])

  const loadNotificationStats = useCallback(async () => {
    if (!user?.id) return
    try {
      setNotificationStatsLoading(true)
      const next = await DashboardService.getUserNotificationStats(user.id)
      setNotificationStats(next)
    } catch {
      // ignore (best-effort)
    } finally {
      setNotificationStatsLoading(false)
    }
  }, [user?.id])

  const loadMessageStats = useCallback(async () => {
    if (!user?.id) return
    try {
      const next = await DashboardService.getUserMessageStats(user.id)
      setMessageStats(next)
    } catch {
      // ignore (best-effort): on garde le fallback basé sur la liste chargée
    }
  }, [user?.id])

  const loadActiveSessions = useCallback(async () => {
    if (!user?.id) return
    try {
      const rows = await DashboardService.getActiveSessions(user.id)
      setActiveSessions(rows)
    } catch {
      // ignore (best-effort)
    }
  }, [user?.id])

  const refreshInAppNotificationsOnly = useCallback(async () => {
    if (!user?.id) return
    try {
      const notifications = await DashboardService.getUserNotifications(user.id)
      setDashboardDataRaw((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          notifications: notifications ?? []
        }
      })
    } catch {
      // ignore (best-effort)
    }
  }, [user?.id])

  useEffect(() => {
    if (activeTab !== 'notifications') return
    void loadNotificationStats()
    void refreshInAppNotificationsOnly()
  }, [activeTab, loadNotificationStats, refreshInAppNotificationsOnly])

  useEffect(() => {
    if (activeTab !== 'messaging') return
    void loadMessageStats()
  }, [activeTab, loadMessageStats])

  useEffect(() => {
    if (activeTab !== 'settings') return
    void loadActiveSessions()
  }, [activeTab, loadActiveSessions])

  useEffect(() => {
    setUserPoints(resolvedPointsBalance)
  }, [resolvedPointsBalance])
  
  const loadDashboardData = useCallback(async () => {
    if (!user?.id) {
      setDashboardDataRaw(null)
      setLoading(false)
      setIsLoading(false)
      setError('Utilisateur non authentifié')
      return
    }

    try {
      setLoading(true)
      setIsLoading(true)
      setError(null)

      const data = await DashboardService.getDashboardData(user.id)
      setDashboardDataRaw(data)

      // Recharge fiable des points récents (contourne les policies RLS
      // éventuelles sur point_transactions).
      try {
        const accessToken = await getClientAccessTokenSafe()
        const res = await fetch('/api/client/points/today', {
          cache: 'no-store',
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined
        })
        const json = await res.json().catch(() => null)
        if (res.ok && Array.isArray(json?.data?.rows)) {
          setRecentPointTx(json.data.rows)
        }
      } catch {
        // Silencieux : le fallback pointsHistory reste utilisé.
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du chargement du tableau de bord'
      setError(message)
    } finally {
      setLoading(false)
      setIsLoading(false)
    }
  }, [user?.id])

  /**
   * Recharge uniquement les recommandations (sans rafraîchir tout le dashboard).
   */
  const reloadRecommendationsOnly = useCallback(async () => {
    if (!user?.id) return
    try {
      const [recommendedProducts, recommendedSellers, recommendedPromotions] = await Promise.all([
        DashboardService.getRecommendedProducts(user.id),
        DashboardService.getRecommendedSellers(user.id),
        (DashboardService as any).getRecommendedPromotions?.(user.id)
      ])

      setDashboardDataRaw((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          recommendedProducts: recommendedProducts ?? [],
          recommendedSellers: recommendedSellers ?? [],
          recommendedPromotions: recommendedPromotions ?? []
        }
      })
    } catch {
      // silent: le toast de refresh gère déjà les erreurs
    }
  }, [user?.id])

  /**
   * Rafraîchit réellement les recommandations IA (règles + fusion DB) via l'API serveur.
   */
  const refreshAiRecommendations = useCallback(async () => {
    if (!user?.id) {
      toast({ title: 'Erreur', description: 'Utilisateur non authentifié', variant: 'destructive' })
      return
    }

    if (isRefreshingAiRecommendations) return
    setIsRefreshingAiRecommendations(true)

    try {
      const accessToken = String((await getClientAccessTokenSafe()) ?? '').trim()
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (accessToken) headers.Authorization = `Bearer ${accessToken}`

      const res = await fetch('/api/recommendations/refresh', {
        method: 'POST',
        headers,
        cache: 'no-store'
      })

      const json = await res.json().catch(() => null)
      if (!res.ok) {
        const msg =
          (typeof json?.error?.message === 'string' && json.error.message) ||
          (typeof json?.error === 'string' && json.error) ||
          'Impossible de rafraîchir les recommandations.'
        throw new Error(msg)
      }

      toast({
        title: 'Recommandations actualisées',
        description: 'Nouvelles suggestions disponibles.',
        variant: 'default'
      })

      await reloadRecommendationsOnly()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Impossible de rafraîchir les recommandations.'
      toast({ title: 'Erreur', description: msg, variant: 'destructive' })
    } finally {
      setIsRefreshingAiRecommendations(false)
    }
  }, [isRefreshingAiRecommendations, reloadRecommendationsOnly, toast, user?.id])

  /**
   * Auto-refresh: au premier chargement + à chaque retour sur l'onglet Recommandations IA,
   * avec un throttling (localStorage) pour éviter trop d'appels.
   */
  useEffect(() => {
    if (!user?.id) return
    if (typeof window === 'undefined') return

    const STORAGE_KEY = 'ai_recommendations_last_refresh_at'
    const MIN_INTERVAL_MS = 10 * 60 * 1000

    const now = Date.now()
    const last = Number(window.localStorage.getItem(STORAGE_KEY) ?? '0')
    const isStale = !Number.isFinite(last) || now - last >= MIN_INTERVAL_MS

    const isInitial = !hasAutoRefreshedAiRecommendationsRef.current
    const cameBackToRecommendations =
      prevActiveTabRef.current !== 'recommendations' && activeTab === 'recommendations'

    prevActiveTabRef.current = activeTab

    if (!isStale) return
    if (!isInitial && !cameBackToRecommendations) return
    if (isRefreshingAiRecommendations) return

    hasAutoRefreshedAiRecommendationsRef.current = true
    window.localStorage.setItem(STORAGE_KEY, String(now))
    void refreshAiRecommendations()
  }, [activeTab, isRefreshingAiRecommendations, refreshAiRecommendations, user?.id])

  useEffect(() => {
    if (!user?.id) return
    const chatIds = Array.from(new Set((realChatSessions ?? []).map((c: any) => String(c?.id ?? '').trim()).filter(Boolean)))
    if (chatIds.length === 0) return

    const channel = supabase
      .channel(`dashboard-chat-messages-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `chat_id=in.(${chatIds.join(',')})`
        },
        (payload: any) => {
          setDashboardDataRaw((prev) => {
            if (!prev) return prev

            const current = Array.isArray((prev as any).chatMessages) ? ((prev as any).chatMessages as any[]) : []
            const next = (() => {
              if (payload?.eventType === 'INSERT' && payload?.new) {
                const id = String(payload.new?.id ?? '').trim()
                if (!id) return current
                if (current.some((m) => String((m as any)?.id ?? '') === id)) return current
                return [...current, payload.new]
              }

              if (payload?.eventType === 'UPDATE' && payload?.new) {
                const id = String(payload.new?.id ?? '').trim()
                if (!id) return current
                const replaced = current.map((m) => (String((m as any)?.id ?? '') === id ? payload.new : m))
                if (replaced.some((m) => String((m as any)?.id ?? '') === id)) return replaced
                return [...current, payload.new]
              }

              if (payload?.eventType === 'DELETE' && payload?.old) {
                const id = String(payload.old?.id ?? '').trim()
                if (!id) return current
                return current.filter((m) => String((m as any)?.id ?? '') !== id)
              }

              return current
            })()

            return { ...prev, chatMessages: next }
          })
        }
      )
      .subscribe()

    return () => {
      try {
        void supabase.removeChannel(channel)
      } catch {
        // ignore
      }
    }
  }, [realChatSessions, user?.id])

  useEffect(() => {
    if (!user?.id) {
      router.replace('/auth/login?redirect=/dashboard')
      return
    }

    void loadDashboardData()
  }, [loadDashboardData, router, user?.id])

  const handleRefreshDashboard = useCallback(async () => {
    await Promise.all([loadDashboardData(), refreshPointsData()])
  }, [loadDashboardData, refreshPointsData])

  // STATISTIQUES ET GESTION SUPABASE - APRÈS TOUS LES HOOKS
  const stats: DashboardSummaryStats = useMemo(() => {
    const base = dashboardData?.stats

    return {
      totalOrders: base?.totalOrders ?? 0,
      totalPoints: base?.totalPoints ?? 0,
      totalShares: base?.totalShares ?? 0,
      totalSpent: base?.totalRevenue ?? 0,
      activeChats: dashboardData?.chats?.length ?? 0,
      favoriteSellers: sellerFavorites.length
    }
  }, [dashboardData, sellerFavorites.length])

  // Remplacer les données mockup par les vraies données Supabase
  const dashboardLoaded = dashboardData !== null
  const realOrdersRaw: UserOrderWithItems[] = dashboardData?.orders ?? []
  const realOrders = useMemo(() => realOrdersRaw.map(order => mapSupabaseOrderToInternal(order)), [realOrdersRaw])

  const visibleOrders = useMemo(() => {
    return realOrders.filter(order => (Array.isArray(order.items) && order.items.length > 0) || (Number.isFinite(order.total) && order.total > 0))
  }, [realOrders])

  const orderStatusCounts = useMemo(() => {
    return visibleOrders.reduce(
      (acc, order) => {
        if (order.status === 'delivered') {
          acc.delivered += 1
        } else if (order.status === 'cancelled') {
          acc.cancelled += 1
        } else {
          acc.inProgress += 1
        }

        return acc
      },
      {
        total: visibleOrders.length,
        inProgress: 0,
        delivered: 0,
        cancelled: 0
      }
    )
  }, [visibleOrders])

  const cancelClientOrder = useCallback(
    async (orderId: string) => {
      if (!orderId) return
      try {
        const accessToken = await getClientAccessTokenSafe()

        const resp = await fetch(`/api/client/orders/${encodeURIComponent(orderId)}/cancel`, {
          method: 'POST',
          headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {})
          },
          cache: 'no-store'
        }).catch(() => null)

        if (!resp || !resp.ok) {
          const body = await resp?.text().catch(() => '')
          console.error('Annulation commande échouée:', resp?.status, body)
          const message = (() => {
            try {
              const parsed = body ? JSON.parse(body) : null
              return typeof parsed?.error === 'string' ? parsed.error : null
            } catch {
              return null
            }
          })()

          toast({
            title: 'Annulation impossible',
            description: message ?? 'Impossible d\'annuler la commande pour le moment.',
            variant: 'destructive'
          })
          return
        }

        toast({
          title: 'Commande annulée',
          description: 'Votre commande a été annulée avec succès.',
          variant: 'default'
        })

        await loadDashboardData()
      } catch (err) {
        console.error('Annulation commande erreur:', err)
        toast({
          title: 'Erreur',
          description: "Une erreur est survenue lors de l'annulation.",
          variant: 'destructive'
        })
      }
    },
    [loadDashboardData, toast]
  )
  const realNotifications = useMemo<NotificationItem[]>(() => {
    const source = dashboardData?.notifications ?? []
    return source.map(mapSupabaseNotificationToInternal)
  }, [dashboardData?.notifications])

  /**
   * Rafraîchit uniquement les notifications in-app depuis la DB et synchronise les états dérivés.
   */
  const syncInAppNotificationsFromDb = useCallback(async () => {
    if (!user?.id) return
    try {
      const fresh = await DashboardService.getUserNotifications(user.id)
      setDashboardDataRaw((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          notifications: fresh ?? []
        }
      })
      const mapped = (fresh ?? []).map(mapSupabaseNotificationToInternal)
      setNotifications(mapped)
      setUnreadNotifications(mapped.filter((n) => !n.isRead).length)
    } catch {
      // ignore (best-effort)
    }
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel(`realtime:user_notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          if (notificationsRealtimeRefreshTimerRef.current) {
            clearTimeout(notificationsRealtimeRefreshTimerRef.current)
          }
          notificationsRealtimeRefreshTimerRef.current = window.setTimeout(() => {
            notificationsRealtimeRefreshTimerRef.current = null
            void syncInAppNotificationsFromDb()
          }, 250)
        }
      )
      .subscribe()

    return () => {
      if (notificationsRealtimeRefreshTimerRef.current) {
        clearTimeout(notificationsRealtimeRefreshTimerRef.current)
        notificationsRealtimeRefreshTimerRef.current = null
      }
      try {
        supabase.removeChannel(channel)
      } catch {
        // ignore
      }
    }
  }, [syncInAppNotificationsFromDb, user?.id])

  const notificationsByPreferences = useMemo(() => {
    const base = notifications

    const allowedCategories = new Set<NotificationCategory>()
    if (notificationSettings.orders) allowedCategories.add('orders')
    if (notificationSettings.points) allowedCategories.add('points')
    if (notificationSettings.chat) allowedCategories.add('chat')
    if (notificationSettings.promotions) allowedCategories.add('promotions')
    if (notificationSettings.system) allowedCategories.add('system')

    return base.filter((n) => allowedCategories.has(n.category))
  }, [notifications, notificationSettings])

  const notificationsForDisplay = useMemo(() => {
    if (selectedNotificationCategory === 'all') return notificationsByPreferences
    return notificationsByPreferences.filter((n) => n.category === selectedNotificationCategory)
  }, [notificationsByPreferences, selectedNotificationCategory])
  const promotionalProducts = useMemo(() => dashboardData?.products ?? [], [dashboardData?.products])
  const realSellers = useMemo<Seller[]>(() => dashboardData?.sellers ?? [], [dashboardData?.sellers])
  const realPromotions = dashboardData?.promotions ?? []
  const pointsHistory = dashboardData?.pointsHistory ?? []
  const recentPointsTransactions = useMemo(() => pointsHistory.slice(0, 10), [pointsHistory])

  // Clé de jour locale (YYYY-MM-DD) — évite les décalages UTC/heure locale.
  const localDayKey = useCallback((value: string | Date) => {
    const d = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(d.getTime())) return ''
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }, [])

  // Points gagnés pour un jour local donné.
  // Source prioritaire : transactions récentes lues via /api/client/points/today
  // (client admin, fiable même si RLS bloque la lecture directe de
  // point_transactions). Fallback : pointsHistory du dashboard.
  const DEBIT_POINT_TYPES = new Set([
    'spend', 'exchange', 'withdrawal', 'expire', 'transfer', 'reward_redemption',
    'transfer_fee', 'exchange_fee', 'withdrawal_fee', 'freeze'
  ])
  const pointsEarnedForDay = useCallback((dayKey: string) => {
    const fromApi = recentPointTx
      .filter((t) => localDayKey(t.createdAt) === dayKey && !DEBIT_POINT_TYPES.has(String(t.type).toLowerCase()))
      .reduce((sum, t) => sum + Math.abs(Number(t.points) || 0), 0)
    if (fromApi > 0) return fromApi

    return pointsHistory
      .filter((t) => localDayKey(String((t as any).date ?? '')) === dayKey && String((t as any).type ?? '').toLowerCase() === 'earned')
      .reduce((sum, t) => sum + (Number((t as any).amount ?? 0) || 0), 0)
  }, [recentPointTx, pointsHistory, localDayKey])

  const pointsTodayKey = localDayKey(new Date())
  const pointsYesterdayKey = (() => {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return localDayKey(d)
  })()

  const recentWithdrawals = dashboardData?.withdrawals ?? []

  const shareEvents = useMemo(() => {
    // Source réelle : product_shares agrégés (via dashboardData.sharedProducts)
    const shared = (dashboardData?.sharedProducts ?? []) as any[]

    const countByDay = new Map<string, number>()
    for (const p of shared) {
      const sharedAt = String((p as any).sharedAt ?? '')
      const total = Number((p as any).totalShares ?? 0) || 0
      if (!sharedAt || total <= 0) continue
      // On répartit le cumul du produit sur sa date de dernier partage
      for (let i = 0; i < total; i++) {
        const dayKey = sharedAt.slice(0, 10)
        countByDay.set(dayKey, (countByDay.get(dayKey) ?? 0) + 1)
      }
    }

    const totalCount = Array.from(countByDay.values()).reduce((sum, n) => sum + n, 0)
    const todayKey = new Date().toISOString().slice(0, 10)
    const yesterdayKey = (() => {
      const d = new Date()
      d.setDate(d.getDate() - 1)
      return d.toISOString().slice(0, 10)
    })()

    return {
      totalCount: totalCount > 0 ? totalCount : shared.length,
      todayCount: countByDay.get(todayKey) ?? 0,
      yesterdayCount: countByDay.get(yesterdayKey) ?? 0,
      countByDay
    }
  }, [dashboardData?.sharedProducts])

  const pointsChartData = useMemo(() => {
    // Fusionne deux sources, la source admin fiable ("/api/client/points/today",
    // lue via le client admin) étant prioritaire pour éviter les trous quand
    // la lecture directe de point_transactions échoue (RLS).
    const byDay = new Map<string, { earned: number; used: number; lastBalance: number }>()

    // 1) Source admin fiable (48h) : réduit le risque de données manquantes.
    for (const t of recentPointTx) {
      const dayKey = localDayKey(t.createdAt)
      if (!dayKey) continue
      const existing = byDay.get(dayKey) ?? { earned: 0, used: 0, lastBalance: 0 }
      const amount = Math.abs(Number(t.points ?? 0)) || 0
      const type = String(t.type ?? '').toLowerCase()
      if (!DEBIT_POINT_TYPES.has(type)) existing.earned += amount
      else existing.used += amount
      byDay.set(dayKey, existing)
    }

    // 2) Historique complet (fallback / complément pour les jours plus anciens).
    const sorted = [...pointsHistory]
      .filter((t) => t && typeof (t as any).date === 'string')
      .sort((a, b) => String(a.date).localeCompare(String(b.date)))

    for (const t of sorted) {
      const dayKey = String(t.date).slice(0, 10)
      if (!dayKey) continue
      const existing = byDay.get(dayKey) ?? { earned: 0, used: 0, lastBalance: 0 }
      const amount = Number((t as any).amount ?? 0) || 0
      const type = String((t as any).type ?? '').toLowerCase()
      if (type === 'earned') existing.earned += Math.max(0, amount)
      if (type === 'used') existing.used += Math.max(0, Math.abs(amount))
      const balance = Number((t as any).balance ?? 0) || 0
      if (balance !== 0) existing.lastBalance = balance
      byDay.set(dayKey, existing)
    }

    // Associe le dernier solde connu par jour local.
    const items = Array.from(byDay.entries()).map(([dayKey, v]) => ({
      date: dayKey,
      points: v.lastBalance,
      earned: Math.round(v.earned),
      used: Math.round(v.used)
    }))

    if (items.length > 0) return items

    const todayDate = new Date()
    const todayKey = localDayKey(todayDate)
    const yesterdayDate = new Date(todayDate)
    yesterdayDate.setDate(yesterdayDate.getDate() - 1)
    const yesterdayKey = localDayKey(yesterdayDate)
    const balance = Number(pointsSummary?.balance ?? userPoints) || 0

    return [
      { date: yesterdayKey, points: balance, earned: 0, used: 0 },
      { date: todayKey, points: balance, earned: 0, used: 0 }
    ]
  }, [recentPointTx, pointsHistory, pointsSummary?.balance, userPoints, localDayKey, DEBIT_POINT_TYPES])

  const ordersChartData = useMemo(() => {
    const orders = realOrders ?? []
    const now = new Date()
    const map = new Map<string, { orders: number; revenue: number }>()

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      map.set(key, { orders: 0, revenue: 0 })
    }

    for (const o of orders) {
      const dt = new Date(String((o as any).createdAt ?? ''))
      if (Number.isNaN(dt.getTime())) continue
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
      const bucket = map.get(key)
      if (!bucket) continue
      bucket.orders += 1
      bucket.revenue += Number((o as any).total ?? 0) || 0
    }

    const fmt = new Intl.DateTimeFormat('fr-FR', { month: 'short' })
    return Array.from(map.entries()).map(([key, v]) => {
      const [y, m] = key.split('-')
      const dt = new Date(Number(y), Math.max(0, Number(m) - 1), 1)
      return {
        month: fmt.format(dt),
        orders: v.orders,
        revenue: Math.round(v.revenue)
      }
    })
  }, [realOrders])

  const weeklyActivityData = useMemo(() => {
    const now = new Date()
    const days: Array<{ key: string; label: string; orders: number; shares: number; chats: number }> = []
    const fmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' })

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      days.push({ key, label: fmt.format(d), orders: 0, shares: 0, chats: 0 })
    }

    const byKey = new Map(days.map((d) => [d.key, d]))

    for (const o of realOrders ?? []) {
      const dt = new Date(String((o as any).createdAt ?? ''))
      const key = Number.isNaN(dt.getTime()) ? '' : dt.toISOString().slice(0, 10)
      const bucket = byKey.get(key)
      if (bucket) bucket.orders += 1
    }

    const shared = (dashboardData?.sharedProducts ?? []) as any[]
    for (const p of shared) {
      const dt = new Date(String((p as any).sharedAt ?? ''))
      const key = Number.isNaN(dt.getTime()) ? '' : dt.toISOString().slice(0, 10)
      const bucket = byKey.get(key)
      if (!bucket) continue
      bucket.shares += Number((p as any).totalShares ?? 0) || 0
    }

    const messages = (dashboardData?.chatMessages ?? []) as any[]
    for (const m of messages) {
      const dt = new Date(String((m as any).created_at ?? (m as any).timestamp ?? ''))
      const key = Number.isNaN(dt.getTime()) ? '' : dt.toISOString().slice(0, 10)
      const bucket = byKey.get(key)
      if (bucket) bucket.chats += 1
    }

    return days.map((d) => ({ day: d.label, orders: d.orders, shares: d.shares, chats: d.chats }))
  }, [dashboardData?.chatMessages, dashboardData?.sharedProducts, realOrders])

  const performanceData = useMemo(() => {
    const weekOrders = weeklyActivityData.reduce((sum, d) => sum + (Number(d.orders) || 0), 0)
    const weekShares = weeklyActivityData.reduce((sum, d) => sum + (Number(d.shares) || 0), 0)
    const weekChats = weeklyActivityData.reduce((sum, d) => sum + (Number(d.chats) || 0), 0)

    const clamp100 = (v: number) => Math.max(0, Math.min(100, Math.round(v)))

    const targets = {
      orders: 10,
      shares: 20,
      chats: 30,
      points: 1000
    }

    return [
      { metric: 'Commandes', value: clamp100((weekOrders / targets.orders) * 100), target: 100, color: '#3B82F6' },
      { metric: 'Partages', value: clamp100((weekShares / targets.shares) * 100), target: 100, color: '#8B5CF6' },
      { metric: 'Chats', value: clamp100((weekChats / targets.chats) * 100), target: 100, color: '#F59E0B' },
      { metric: 'Points', value: clamp100((userPoints / targets.points) * 100), target: 100, color: '#10B981' }
    ]
  }, [userPoints, weeklyActivityData])

  const overviewTopStats = useMemo(() => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)

    let ordersThisMonth = 0
    let ordersPrevMonth = 0
    let revenueThisMonth = 0
    let revenuePrevMonth = 0

    for (const o of realOrders ?? []) {
      const dt = new Date(String((o as any).createdAt ?? ''))
      if (Number.isNaN(dt.getTime())) continue
      const total = Number((o as any).total ?? 0) || 0
      if (dt >= monthStart) {
        ordersThisMonth += 1
        revenueThisMonth += total
      } else if (dt >= prevMonthStart && dt <= prevMonthEnd) {
        ordersPrevMonth += 1
        revenuePrevMonth += total
      }
    }

    const pct = (cur: number, prev: number) => {
      if (prev <= 0) return cur > 0 ? 100 : 0
      return Math.round(((cur - prev) / prev) * 100)
    }

    const sharesFromTableThisWeek = weeklyActivityData.reduce((sum, d) => sum + (Number(d.shares) || 0), 0)
    const sharesFromEventsThisWeek = Array.from(shareEvents.countByDay.entries()).reduce((sum, [day, c]) => {
      const dt = new Date(`${day}T00:00:00.000Z`)
      const diffDays = Math.floor((now.getTime() - dt.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays >= 0 && diffDays < 7) return sum + (Number(c) || 0)
      return sum
    }, 0)
    const sharesThisWeek = sharesFromTableThisWeek > 0 ? sharesFromTableThisWeek : sharesFromEventsThisWeek

    return {
      ordersPct: pct(ordersThisMonth, ordersPrevMonth),
      revenuePct: pct(revenueThisMonth, revenuePrevMonth),
      sharesThisWeek
    }
  }, [realOrders, shareEvents.countByDay, weeklyActivityData])

  const totalSharesDisplay = useMemo(() => {
    const fromStats = Number(stats.totalShares ?? 0) || 0
    return fromStats > 0 ? fromStats : shareEvents.totalCount
  }, [shareEvents.totalCount, stats.totalShares])

  const computeDeltaLabel = useCallback((today: number, yesterday: number, suffix: string) => {
    const t = Number(today || 0)
    const y = Number(yesterday || 0)
    if (y <= 0) {
      return `${t} ${suffix} vs hier`
    }
    const pct = Math.round(((t - y) / y) * 100)
    const sign = pct > 0 ? '+' : ''
    return `${sign}${pct}% vs hier`
  }, [])

  const mapSupabaseMessageToInternal = useCallback(
    (message: any): InternalMessage => {
      const priorityRaw = String(message?.priority ?? message?.message_priority ?? 'medium').toLowerCase()
      const typeRaw = String(message?.category ?? message?.type ?? 'general').toLowerCase()
      const isFromUser = message?.sender_id === user?.id

      const normalizedPriority: MessagePriority =
        priorityRaw === 'high' ? 'high' : priorityRaw === 'low' ? 'low' : 'medium'

      const normalizedCategory: MessageCategory = (() => {
        if (typeRaw === 'support') return 'support'
        if (typeRaw === 'technical' || typeRaw === 'tech') return 'technical'
        if (typeRaw === 'billing' || typeRaw === 'payment') return 'billing'
        if (typeRaw === 'account') return 'account'
        return 'general'
      })()

      const normalizedStatus: MessageStatus = message?.is_read
        ? 'read'
        : isFromUser
          ? 'sent'
          : 'delivered'

      return {
        id: String(message?.id ?? crypto.randomUUID()),
        from: isFromUser ? 'user' : 'admin',
        subject: String(message?.subject ?? message?.title ?? ''),
        content: String(message?.content ?? message?.body ?? ''),
        timestamp: String(message?.created_at ?? message?.timestamp ?? new Date().toISOString()),
        isRead: Boolean(message?.is_read ?? false),
        isImportant: Boolean(message?.is_important ?? false),
        priority: normalizedPriority,
        category: normalizedCategory,
        attachments: Array.isArray(message?.attachments) ? message.attachments : [],
        status: normalizedStatus
      }
    },
    [user?.id]
  )

  const handleOpenInternalMessage = useCallback(
    async (message: InternalMessage) => {
      if (!message) return
      setSelectedInternalMessage(message)
      setShowInternalMessageModal(true)
      setShowNotificationActions((prev) => ({ ...(prev ?? {}), [message.id]: false }))

      if (!message.isRead) {
        try {
          await InternalMessagingService.markAsRead(message.id)
        } finally {
          setInternalMessages((prev) =>
            (prev ?? []).map((item) =>
              item.id === message.id ? { ...item, isRead: true, status: 'read' } : item
            )
          )
          void loadMessageStats()
        }
      }
    },
    [loadMessageStats]
  )

  const handleOpenInternalMessageEdit = useCallback((message: InternalMessage) => {
    if (!message) return
    setSelectedInternalMessage(message)
    setEditInternalMessageSubject(String(message.subject ?? ''))
    setEditInternalMessageContent(String(message.content ?? ''))
    setShowInternalMessageEditModal(true)
  }, [])

  const handleSaveInternalMessageEdit = useCallback(async () => {
    if (!selectedInternalMessage) return
    if (!editInternalMessageSubject.trim() || !editInternalMessageContent.trim()) return

    setIsUpdatingInternalMessage(true)
    try {
      const updated = await InternalMessagingService.updateMessage({
        messageId: selectedInternalMessage.id,
        subject: editInternalMessageSubject,
        content: editInternalMessageContent,
        category: selectedInternalMessage.category,
        priority: selectedInternalMessage.priority
      })

      if (updated?.id) {
        setInternalMessages((prev) =>
          (prev ?? []).map((item) =>
            item.id === selectedInternalMessage.id
              ? {
                  ...item,
                  subject: String((updated as any)?.subject ?? item.subject),
                  content: String((updated as any)?.content ?? item.content)
                }
              : item
          )
        )
        setShowInternalMessageEditModal(false)
        void loadMessageStats()
      }
    } finally {
      setIsUpdatingInternalMessage(false)
    }
  }, [editInternalMessageContent, editInternalMessageSubject, selectedInternalMessage, loadMessageStats])

  const handleToggleInternalMessageImportant = useCallback(async (message: InternalMessage) => {
    if (!message) return
    const desired = !Boolean(message.isImportant)
    const updated = await InternalMessagingService.toggleImportant(message.id, desired)
    if (updated?.id) {
      setInternalMessages((prev) =>
        (prev ?? []).map((item) => (item.id === message.id ? { ...item, isImportant: desired } : item))
      )
      setSelectedInternalMessage((prev) => (prev?.id === message.id ? { ...prev, isImportant: desired } : prev))
      void loadMessageStats()
    }
  }, [loadMessageStats])

  const handleArchiveInternalMessage = useCallback(async (message: InternalMessage) => {
    if (!message) return
    const ok = await InternalMessagingService.archiveMessage(message.id)
    if (ok) {
      setInternalMessages((prev) => (prev ?? []).filter((item) => item.id !== message.id))
      setShowInternalMessageModal(false)
      void loadMessageStats()
    }
  }, [loadMessageStats])

  const handleDeleteInternalMessage = useCallback(async (message: InternalMessage) => {
    if (!message) return
    const accepted = confirm('Êtes-vous sûr de vouloir supprimer ce message ?')
    if (!accepted) return
    const ok = await InternalMessagingService.deleteMessage(message.id)
    if (ok) {
      setInternalMessages((prev) => (prev ?? []).filter((item) => item.id !== message.id))
      setShowInternalMessageModal(false)
      void loadMessageStats()
    }
  }, [loadMessageStats])

  const realMessages = useMemo<InternalMessage[]>(() => {
    const sourceMessages = dashboardData?.messages ?? []
    return sourceMessages.map(mapSupabaseMessageToInternal)
  }, [dashboardData?.messages, mapSupabaseMessageToInternal])
  
  // Utiliser les données réelles du service au lieu des données mockup
  const latestMessagesByChat = useMemo(() => {
    const map = new Map<string, DashboardChatMessage>()

    realChatMessages.forEach(message => {
      const chatId = (message as any).chat_id ?? message.chat_id
      if (!chatId) return

      const current = map.get(chatId)
      if (!current || new Date(message.created_at).getTime() > new Date(current.created_at).getTime()) {
        map.set(chatId, message)
      }
    })

    return map
  }, [realChatMessages])

  const [chatPartnerProfiles, setChatPartnerProfiles] = useState<Record<string, ChatPartnerProfile>>({})
  const chatPartnerProfilesLastKeyRef = useRef<string>('')

  const [isVendorShopModalOpen, setIsVendorShopModalOpen] = useState(false)
  const [conversationStatesByChatId, setConversationStatesByChatId] = useState<
    Record<string, { isImportant?: boolean; isToPay?: boolean; isToOrder?: boolean; isArchived?: boolean; isDeleted?: boolean }>
  >({})

  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)
  const [orderSelectionByProductId, setOrderSelectionByProductId] = useState<Record<string, number>>({})
  const [orderShippingLat, setOrderShippingLat] = useState<number | null>(null)
  const [orderShippingLng, setOrderShippingLng] = useState<number | null>(null)
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [confirmDeleteChatOpen, setConfirmDeleteChatOpen] = useState(false)

  /**
   * Charge les profils (nom/prénom) des partenaires de conversation afin d'afficher un nom réel
   * au lieu du fallback `Contact {id}`.
   */
  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()

    const loadPartnerProfiles = async () => {
      try {
        if (!dashboardData?.userProfile && !user) {
          if (!cancelled) setChatPartnerProfiles({})
          return
        }

        const sessions = Array.isArray(realChatSessions) ? realChatSessions : []
        const sessionPartnerIds = sessions
          .map((session) => {
            const isParticipant1 = session.participant1_id === user.id
            const pid = isParticipant1 ? session.participant2_id : session.participant1_id
            return String(pid ?? '').trim()
          })
          .filter(Boolean)

        const products = Array.isArray((dashboardData as any)?.chatProducts)
          ? (((dashboardData as any).chatProducts as any[]) ?? [])
          : []

        const productVendorIds = products
          .map((p: any) => String(p?.vendor_id ?? p?.vendorId ?? '').trim())
          .filter(Boolean)

        const partnerIds = Array.from(new Set([...sessionPartnerIds, ...productVendorIds]))
        const key = partnerIds.slice().sort().join('|')
        if (key && key === chatPartnerProfilesLastKeyRef.current) return

        if (partnerIds.length === 0) {
          chatPartnerProfilesLastKeyRef.current = ''
          if (!cancelled) setChatPartnerProfiles({})
          return
        }

        const accessToken = await getClientAccessTokenSafe()

        const res = await fetch('/api/client/chat/partners', {
          method: 'POST',
          headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {})
          },
          body: JSON.stringify({ partnerIds }),
          signal: controller.signal,
          cache: 'no-store'
        })

        if (!res || !res.ok) {
          const body = await res?.text().catch(() => '')
          console.warn('Dashboard chat: API partners non OK:', res?.status, body)
          chatPartnerProfilesLastKeyRef.current = ''
          if (!cancelled) setChatPartnerProfiles({})
          return
        }

        const payload = (await res.json().catch(() => null)) as ChatPartnersApiResponse | null
        const rows = Array.isArray(payload?.data) ? payload!.data : []

        const next: Record<string, ChatPartnerProfile> = {}
        rows.forEach((row: any) => {
          const userId = String(row?.user_id ?? '').trim()
          if (!userId) return
          const apiDisplay = typeof row?.display_name === 'string' ? String(row.display_name).trim() : ''
          const fullName = [row?.first_name, row?.last_name].filter(Boolean).join(' ').trim()
          const displayName = apiDisplay || fullName || `Contact ${userId.slice(0, 8)}`
          const initials = (fullName || displayName)
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part.charAt(0).toUpperCase())
            .join('')
            .slice(0, 2)

          next[userId] = {
            userId,
            displayName,
            initials: initials || 'C',
            avatarUrl: typeof row?.avatar_url === 'string' ? String(row.avatar_url) : null
          }
        })

        // Ne figer la clé que si le chargement a réussi, sinon on risquerait de bloquer les refetch après un 401/réseau.
        chatPartnerProfilesLastKeyRef.current = key
        if (!cancelled) setChatPartnerProfiles(next)
      } catch (error) {
        if ((error as any)?.name === 'AbortError') return
        console.warn('Dashboard chat: exception chargement profils partenaires:', error)
        chatPartnerProfilesLastKeyRef.current = ''
        if (!cancelled) setChatPartnerProfiles({})
      }
    }

    void loadPartnerProfiles()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [dashboardData?.chatProducts, realChatSessions, user?.id])

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()

    const loadConversationStates = async () => {
      try {
        if (!user?.id) return

        const chatIds = Array.from(new Set((realChatSessions ?? []).map((c: any) => String(c?.id ?? '').trim()).filter(Boolean)))
        if (chatIds.length === 0) {
          if (!cancelled) setConversationStatesByChatId({})
          return
        }

        const accessToken = await getClientAccessTokenSafe()

        const qs = encodeURIComponent(chatIds.join(','))
        const resp = await fetch(`/api/client/chat/states?chatIds=${qs}`, {
          method: 'GET',
          headers: {
            accept: 'application/json',
            ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {})
          },
          signal: controller.signal,
          cache: 'no-store'
        }).catch(() => null)

        if (!resp || !resp.ok) {
          // Si la table n'existe pas encore côté DB, l'API renvoie 501: on reste silencieux.
          return
        }

        const json = await resp.json().catch(() => null)
        const rows = Array.isArray(json?.data) ? json.data : []
        const next: Record<string, any> = {}
        rows.forEach((r: any) => {
          const id = String(r?.chat_id ?? '').trim()
          if (!id) return
          next[id] = {
            isImportant: Boolean(r?.is_important),
            isToPay: Boolean(r?.is_to_pay),
            isToOrder: Boolean(r?.is_to_order),
            isArchived: Boolean(r?.is_archived),
            isDeleted: Boolean(r?.is_deleted)
          }
        })

        if (!cancelled) setConversationStatesByChatId(next)
      } catch (error) {
        if ((error as any)?.name === 'AbortError') return
      }
    }

    void loadConversationStates()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [realChatSessions, user?.id])

  useEffect(() => {
    const hasProducts = Array.isArray((dashboardData as any)?.chatProducts) && ((dashboardData as any).chatProducts as any[]).length > 0
    if (realChatSessions.length === 0 && !hasProducts) {
      setChatPartnerProfiles({})
      return
    }
  }, [dashboardData, realChatSessions])

  const chatContacts = useMemo<ChatContact[]>(() => {
    if (realChatSessions.length === 0) {
      return []
    }

    return realChatSessions.map(session => {
      const isParticipant1 = session.participant1_id === user?.id
      const partnerId = isParticipant1 ? session.participant2_id : session.participant1_id
      const partnerKey = String(partnerId ?? '').trim()
      const profile = partnerKey ? chatPartnerProfiles[partnerKey] : undefined
      const baseName = profile?.displayName || (partnerId ? `Contact ${partnerKey.slice(0, 8)}` : 'Contact inconnu')
      const latestMessage = latestMessagesByChat.get(session.id)
      const previewRaw = String((latestMessage as any)?.content ?? latestMessage?.content ?? '').trim()
      const preview = previewRaw
        ? toReadableChatText(previewRaw).trim()
        : 'Aucun message pour le moment'

      return {
        id: session.id,
        partnerId,
        displayName: baseName,
        initials: profile?.initials || baseName.charAt(0).toUpperCase(),
        lastMessageAt: latestMessage?.created_at ?? session.last_message_at ?? null,
        lastMessagePreview: preview
      }
    })
  }, [chatPartnerProfiles, latestMessagesByChat, realChatSessions, user?.id])

  const filteredChatContacts = useMemo(() => {
    const q = String(chatSearchQuery ?? '').toLowerCase().trim()
    if (!q) return chatContacts
    return chatContacts.filter(contact =>
      contact.displayName.toLowerCase().includes(q) ||
      contact.lastMessagePreview.toLowerCase().includes(q)
    )
  }, [chatContacts, chatSearchQuery])

  const selectedChatIdsList = useMemo(() => {
    return Object.keys(selectedChatIds).filter((id) => selectedChatIds[id])
  }, [selectedChatIds])

  const toggleConversationSelection = useCallback((chatId: string) => {
    const cid = String(chatId ?? '').trim()
    if (!cid) return
    setSelectedChatIds((prev) => ({
      ...(prev ?? {}),
      [cid]: !(prev?.[cid] === true)
    }))
  }, [])

  const clearConversationSelection = useCallback(() => {
    setSelectedChatIds({})
  }, [])

  const selectAllFilteredConversations = useCallback(() => {
    setSelectedChatIds(() => {
      const next: Record<string, boolean> = {}
      for (const c of filteredChatContacts) {
        const id = String(c?.id ?? '').trim()
        if (id) next[id] = true
      }
      return next
    })
  }, [filteredChatContacts])

  useEffect(() => {
    if (chatContacts.length === 0) {
      setSelectedChatIds({})
      return
    }

    setSelectedChatIds((prev) => {
      const next: Record<string, boolean> = {}
      const allowed = new Set(chatContacts.map((c) => String(c?.id ?? '').trim()).filter(Boolean))
      for (const k of Object.keys(prev ?? {})) {
        if (prev[k] === true && allowed.has(k)) {
          next[k] = true
        }
      }
      return next
    })
  }, [chatContacts])

  const selectedChatContact = useMemo<ChatContact | null>(() => {
    if (!selectedChatId) return null
    return chatContacts.find(contact => contact.id === selectedChatId) ?? null
  }, [chatContacts, selectedChatId])

  useEffect(() => {
    if (selectedChatContact) {
      setOpeningChatContact(null)
    }
  }, [selectedChatContact])

  useEffect(() => {
    if (activeTab !== 'chat') {
      setSelectedChatId(null)
      setSelectedChatPartner(null)
      setOpeningChatContact(null)
      setIsVendorShopModalOpen(false)
      return
    }

    setIsVendorShopModalOpen(false)
  }, [activeTab])

  useEffect(() => {
    const vendorId = String(pendingOpenChatVendorIdRef.current ?? '').trim()
    if (!vendorId) return
    if (activeTab !== 'chat') return
    if (!user?.id) return

    pendingOpenChatVendorIdRef.current = null

    void (async () => {
      try {
        const vendorLabel = chatPartnerProfiles[vendorId]?.displayName
          ? chatPartnerProfiles[vendorId].displayName
          : `Contact ${vendorId.slice(0, 8)}`

        const existingSession = (Array.isArray(realChatSessions) ? realChatSessions : []).find((s: any) => {
          const p1 = String(s?.participant1_id ?? '').trim()
          const p2 = String(s?.participant2_id ?? '').trim()
          const me = String(user.id ?? '').trim()
          if (!p1 || !p2 || !me) return false
          return (p1 === me && p2 === vendorId) || (p2 === me && p1 === vendorId)
        })

        if (existingSession?.id) {
          setChatActiveTab('conversations')
          setSelectedChatId(String(existingSession.id))
          setSelectedChatPartner({
            id: String(existingSession.id),
            partnerId: vendorId,
            displayName: vendorLabel,
            initials: vendorLabel
              .split(' ')
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part.charAt(0).toUpperCase())
              .join('')
              .slice(0, 2) || 'C',
            lastMessageAt: null,
            lastMessagePreview: ''
          })
          setOpeningChatContact(null)
          return
        }

        setOpeningChatContact({
          id: 'opening',
          partnerId: vendorId,
          displayName: vendorLabel,
          initials: vendorLabel
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part.charAt(0).toUpperCase())
            .join('')
            .slice(0, 2) || 'C',
          lastMessageAt: null,
          lastMessagePreview: ''
        })

        const session = await ChatService.getOrCreateChatSession(user.id, vendorId)
        if (!session?.id) {
          toast({
            title: 'Erreur',
            description: 'Impossible de démarrer la conversation avec ce vendeur.',
            variant: 'destructive'
          })
          setOpeningChatContact(null)
          return
        }

        setChatActiveTab('conversations')
        setSelectedChatId(String(session.id))
        setSelectedChatPartner({
          id: String(session.id),
          partnerId: vendorId,
          displayName: vendorLabel,
          initials: vendorLabel
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part.charAt(0).toUpperCase())
            .join('')
            .slice(0, 2) || 'C',
          lastMessageAt: null,
          lastMessagePreview: ''
        })

        setDashboardDataRaw((prev) => {
          if (!prev) return prev
          const list = Array.isArray((prev as any).chats) ? ((prev as any).chats as any[]) : []
          const exists = list.some((c) => String(c?.id ?? '') === String(session.id))
          if (exists) return prev
          return { ...prev, chats: [...list, session] }
        })
      } catch {
        setOpeningChatContact(null)
      }
    })()
  }, [activeTab, chatPartnerProfiles, realChatSessions, toast, user?.id])

  const chatMessagesByChatId = useMemo(() => {
    const map = new Map<string, DashboardChatMessage[]>()
    const list = Array.isArray(realChatMessages) ? realChatMessages : []
    for (const message of list) {
      const chatId = String(((message as any).chat_id ?? (message as any)?.chatId ?? message.chat_id) ?? '').trim()
      if (!chatId) continue
      const current = map.get(chatId)
      if (current) {
        current.push(message)
      } else {
        map.set(chatId, [message])
      }
    }

    for (const [, messages] of map) {
      messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    }

    return map
  }, [realChatMessages])

  const filteredChatMessages = useMemo<DashboardChatMessage[]>(() => {
    if (!selectedChatId) return []

    return chatMessagesByChatId.get(selectedChatId) ?? []
  }, [chatMessagesByChatId, selectedChatId])

  const chatMessagesForDisplay = useMemo(() => {
    return groupChatMessagesForDisplay(filteredChatMessages)
  }, [filteredChatMessages])

  const toFiniteNumber = useCallback((value: unknown): number | null => {
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string') {
      const normalized = value.replace(/\s/g, '').replace(',', '.')
      const n = Number(normalized)
      return Number.isFinite(n) ? n : null
    }
    const n = Number(value)
    return Number.isFinite(n) ? n : null
  }, [])

  /**
   * Construit un snapshot minimal exploitable immédiatement dans l’overlay,
   * à partir des données déjà présentes dans le message de chat.
   */
  const buildProductSnapshotForOverlay = useCallback((product: any): any => {
    if (!product || typeof product !== 'object') return product
    const anyP = product as any
    const images = Array.isArray(anyP?.images) ? anyP.images : []
    const mainImage =
      String(anyP?.image_url ?? anyP?.imageUrl ?? '').trim() ||
      String(anyP?.metadata?.thumbnail ?? '').trim() ||
      (typeof images[0] === 'string' ? String(images[0]).trim() : '') ||
      String(anyP?.image ?? '').trim()

    return {
      ...anyP,
      media: {
        ...(typeof anyP?.media === 'object' && anyP.media ? anyP.media : {}),
        main_image: String((anyP as any)?.media?.main_image ?? '').trim() || mainImage
      }
    }
  }, [])

  /**
   * Ouvre l’overlay instantanément (cache/snapshot), puis re-synchronise en arrière-plan
   * depuis la base via /api/public/products.
   */
  const openProductInfo = useCallback(async (productId: string, snapshotProduct?: any) => {
    const pid = String(productId ?? '').trim()
    if (!pid) {
      toast({ title: 'Erreur', description: 'Produit introuvable.', variant: 'destructive' })
      return
    }

    productInfoActiveIdRef.current = pid
    setIsProductInfoOpen(true)
    setProductInfoError(null)

    const cached = productInfoCacheRef.current.get(pid)
    const snapshot = snapshotProduct ? buildProductSnapshotForOverlay(snapshotProduct) : null
    if (cached) {
      setProductInfoData(cached)
      setProductInfoLoading(false)
    } else if (snapshot) {
      setProductInfoData(snapshot)
      setProductInfoLoading(false)
    } else {
      setProductInfoData(null)
      setProductInfoLoading(true)
    }

    if (productInfoAbortRef.current) {
      try {
        productInfoAbortRef.current.abort()
      } catch {
        // ignore
      }
    }
    const controller = new AbortController()
    productInfoAbortRef.current = controller

    try {
      setProductInfoLoading(true)
      const resp = await fetch(`/api/public/products?id=${encodeURIComponent(pid)}`, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal
      })
      const json = resp.ok ? await resp.json().catch(() => null) : null
      const data = json?.data
      if (!data) {
        setProductInfoError('Aucune information produit disponible.')
        return
      }
      productInfoCacheRef.current.set(pid, data)
      if (productInfoActiveIdRef.current === pid) {
        setProductInfoData(data)
      }
    } catch (error) {
      if ((error as any)?.name === 'AbortError') return
      const msg = error instanceof Error ? error.message : 'Impossible de charger les informations produit.'
      setProductInfoError(msg)
    } finally {
      if (productInfoActiveIdRef.current === pid) {
        setProductInfoLoading(false)
      }
    }
  }, [buildProductSnapshotForOverlay, toast])

  const addProductMessageToCart = useCallback((product: any) => {
    const pid = String(product?.id ?? '').trim()
    if (!pid) {
      toast({ title: 'Erreur', description: 'Identifiant produit manquant.', variant: 'destructive' })
      return
    }

    const name = String(product?.name ?? 'Produit').trim() || 'Produit'
    const image = String(product?.image_url ?? product?.imageUrl ?? product?.image ?? product?.mainImage ?? '').trim() || '/placeholder.jpg'
    const seller = String(product?.seller_name ?? product?.sellerName ?? product?.vendorName ?? 'Vendeur').trim() || 'Vendeur'

    const price =
      toFiniteNumber(product?.sale_price) ??
      toFiniteNumber(product?.salePrice) ??
      toFiniteNumber(product?.price) ??
      0
    const originalPrice = toFiniteNumber(product?.original_price) ?? toFiniteNumber(product?.originalPrice) ?? undefined

    addToCartReal({
      id: pid,
      name,
      price,
      originalPrice,
      image,
      seller,
      inStock: product?.inStock === false ? false : undefined,
      warranty: typeof product?.warranty === 'string' ? product.warranty : undefined,
      returnPolicy: typeof product?.return_policy === 'string' ? product.return_policy : (typeof product?.returnPolicy === 'string' ? product.returnPolicy : undefined)
    })
  }, [addToCartReal, toast, toFiniteNumber])

  /**
   * Résout un libellé vendeur depuis les champs disponibles dans les produits du dashboard.
   */
  const resolveVendorLabelFromProduct = useCallback((product: any): string => {
    const raw =
      String(
        product?.vendor_name ??
          product?.vendorName ??
          product?.seller_name ??
          product?.sellerName ??
          product?.seller?.name ??
          product?.vendor?.name ??
          ''
      ).trim()
    if (raw && !raw.startsWith('Contact ') && raw !== 'Contact inconnu' && raw !== 'Vendeur') return raw
    const vid = String(product?.vendor_id ?? product?.vendorId ?? '').trim()
    const partner = vid ? chatPartnerProfiles?.[vid] : undefined
    const partnerName = typeof partner?.displayName === 'string' ? String(partner.displayName).trim() : ''
    if (partnerName) return partnerName
    return vid ? `Contact ${vid.slice(0, 8)}` : 'Vendeur'
  }, [chatPartnerProfiles])

  /**
   * Met à jour un flag conversation (important / à régler / à commander / supprimé) et synchronise DB.
   */
  const updateConversationStateFlag = useCallback(
    async (chatId: string, patch: { isImportant?: boolean; isToPay?: boolean; isToOrder?: boolean; isArchived?: boolean; isDeleted?: boolean }) => {
      const cid = String(chatId ?? '').trim()
      if (!cid) return

      // Optimistic UI
      setConversationStatesByChatId((prev) => ({
        ...prev,
        [cid]: {
          ...(prev[cid] ?? {}),
          ...patch
        }
      }))

      try {
        const accessToken = await getClientAccessTokenSafe()
        const resp = await fetch('/api/client/chat/state', {
          method: 'POST',
          headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {})
          },
          body: JSON.stringify({
            chatId: cid,
            isImportant: patch.isImportant,
            isToPay: patch.isToPay,
            isToOrder: patch.isToOrder,
            isArchived: patch.isArchived,
            isDeleted: patch.isDeleted
          }),
          cache: 'no-store'
        })

        if (!resp.ok) {
          // Si la table n'existe pas encore côté DB, l'API renvoie 501.
          const text = await resp.text().catch(() => '')
          throw new Error(text || `HTTP ${resp.status}`)
        }
      } catch {
        // En cas d'échec, on garde l'UI (best-effort) pour ne pas casser l'expérience.
      }
    },
    []
  )

  /**
   * Ouvre la modale "A commander" (sélection produits + quantités) et prépare les valeurs.
   */
  const openOrderModalForActiveChat = useCallback(() => {
    setIsOrderModalOpen(true)
    setOrderSelectionByProductId({})

    const cid = String(selectedChatId ?? '').trim()
    if (cid) {
      void updateConversationStateFlag(cid, { isToOrder: true })
    }

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      try {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lat = typeof pos?.coords?.latitude === 'number' ? pos.coords.latitude : null
            const lng = typeof pos?.coords?.longitude === 'number' ? pos.coords.longitude : null
            setOrderShippingLat(lat)
            setOrderShippingLng(lng)
          },
          () => {
            // ignore
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 60_000 }
        )
      } catch {
        // ignore
      }
    }
  }, [selectedChatId, updateConversationStateFlag])

  /**
   * Crée une commande depuis la sélection produits (option C).
   */
  const placeOrderFromSelection = useCallback(async () => {
    if (!user?.id) {
      toast({ title: 'Action impossible', description: 'Vous devez être connecté.', variant: 'destructive' })
      return
    }

    const activeVendorId = String((selectedChatContact ?? openingChatContact)?.partnerId ?? '').trim()
    const allChatProducts = Array.isArray((dashboardData as any)?.chatProducts) ? (((dashboardData as any).chatProducts as any[]) ?? []) : []
    const vendorProductsForOrder = activeVendorId
      ? allChatProducts.filter((p: any) => {
          const vid = String(p?.vendor_id ?? p?.vendorId ?? '').trim()
          return vid && vid === activeVendorId
        })
      : []

    const items = Object.entries(orderSelectionByProductId)
      .map(([productId, qty]) => ({ productId, quantity: Math.max(1, Math.floor(Number(qty) || 0)) }))
      .filter((i) => i.productId && i.quantity > 0)

    if (items.length === 0) {
      toast({ title: 'Sélection vide', description: 'Choisissez au moins un produit.', variant: 'destructive' })
      return
    }

    const enrichedItems = items.map((i) => {
      const p = vendorProductsForOrder.find((x: any) => String(x?.id ?? '').trim() === i.productId)
      const unitPrice = toFiniteNumber((p as any)?.sale_price) ?? toFiniteNumber((p as any)?.salePrice) ?? toFiniteNumber((p as any)?.price) ?? 0
      const originalUnitPrice = toFiniteNumber((p as any)?.original_price) ?? toFiniteNumber((p as any)?.originalPrice) ?? unitPrice
      return {
        productId: i.productId,
        quantity: i.quantity,
        unitPrice,
        originalUnitPrice
      }
    })

    try {
      setIsPlacingOrder(true)

      const accessToken = await getClientAccessTokenSafe()

      const payload: any = {
        items: enrichedItems,
        shareRefByProductId: (() => {
          try {
            if (typeof window === 'undefined' || !window.sessionStorage) return null
            const raw = window.sessionStorage.getItem('share_ref_by_product_id')
            if (!raw) return null
            const obj = JSON.parse(raw)
            return obj && typeof obj === 'object' && !Array.isArray(obj) ? obj : null
          } catch {
            return null
          }
        })(),
        currency: 'XOF',
        shippingLat: orderShippingLat,
        shippingLng: orderShippingLng,
        shippingAddress: {
          fullName: (profileData as any)?.fullName ?? (profileData as any)?.name ?? '',
          phone: (profileData as any)?.phone ?? '',
          country: (profileData as any)?.country ?? '',
          address: (profileData as any)?.address ?? ''
        }
      }

      const resp = await fetch('/api/client/orders', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify(payload),
        cache: 'no-store'
      })

      const json = await resp.json().catch(() => null)
      if (!resp.ok) {
        const msg = typeof json?.error === 'string' ? json.error : `HTTP ${resp.status}`
        toast({ title: 'Commande impossible', description: msg, variant: 'destructive' })
        return
      }

      toast({ title: 'Commande créée', description: 'Votre commande a été créée avec succès.', variant: 'default' })
      setIsOrderModalOpen(false)
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Impossible de créer la commande.'
      toast({ title: 'Erreur', description: msg, variant: 'destructive' })
    } finally {
      setIsPlacingOrder(false)
    }
  }, [dashboardData, openingChatContact, orderSelectionByProductId, orderShippingLat, orderShippingLng, profileData, selectedChatContact, toast, toFiniteNumber, user?.id])

  /**
   * Archive (masque) la conversation courante côté client (soft delete: user_chats.is_active=false).
   */
  const archiveActiveChat = useCallback(async () => {
    const chatId = String(selectedChatId ?? '').trim()
    if (!chatId) return

    try {
      const accessToken = await getClientAccessTokenSafe()

      const resp = await fetch('/api/client/chat/archive', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({ chatId: selectedChatId }),
        cache: 'no-store'
      })

      if (!resp.ok) {
        const body = await resp.text().catch(() => '')
        throw new Error(body || `HTTP ${resp.status}`)
      }

      // Mise à jour locale: retirer la conversation de la liste (is_active=false)
      setDashboardDataRaw((prev) => {
        if (!prev) return prev
        const chats = Array.isArray((prev as any).chats) ? ((prev as any).chats as any[]) : []
        const nextChats = chats.filter((c) => String(c?.id ?? '') !== String(selectedChatId))
        return { ...(prev as any), chats: nextChats }
      })

      setSelectedChatId(null)
      setSelectedChatPartner(null)

      toast({ title: 'Conversation masquée', description: 'La conversation a été masquée.', variant: 'default' })
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Impossible de masquer la conversation.'
      toast({ title: 'Erreur', description: msg, variant: 'destructive' })
    }
  }, [selectedChatId, setDashboardDataRaw, toast, user?.id])

  const archiveChatById = useCallback(async (chatId: string) => {
    const cid = String(chatId ?? '').trim()
    if (!cid) return

    try {
      const accessToken = await getClientAccessTokenSafe()
      const resp = await fetch('/api/client/chat/archive', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({ chatId: cid }),
        cache: 'no-store'
      })

      if (!resp.ok) {
        return
      }

      setDashboardDataRaw((prev) => {
        if (!prev) return prev
        const chats = Array.isArray((prev as any).chats) ? ((prev as any).chats as any[]) : []
        const nextChats = chats.filter((c) => String(c?.id ?? '') !== String(cid))
        return { ...(prev as any), chats: nextChats }
      })

      if (String(selectedChatId ?? '') === cid) {
        setSelectedChatId(null)
        setSelectedChatPartner(null)
      }
    } catch {
      return
    }
  }, [selectedChatId, setDashboardDataRaw, setSelectedChatPartner, user?.id])

  const applyBatchConversationPatch = useCallback(async (patch: { isImportant?: boolean; isToPay?: boolean; isToOrder?: boolean; isArchived?: boolean; isDeleted?: boolean }) => {
    const ids = selectedChatIdsList
    if (ids.length === 0) return
    await Promise.all(ids.map((id) => updateConversationStateFlag(id, patch)))
  }, [selectedChatIdsList, updateConversationStateFlag])

  const archiveSelectedConversations = useCallback(async () => {
    const ids = selectedChatIdsList
    if (ids.length === 0) return
    await Promise.all(ids.map((id) => archiveChatById(id)))
    clearConversationSelection()
  }, [archiveChatById, clearConversationSelection, selectedChatIdsList])

  const deleteSelectedConversations = useCallback(async () => {
    const ids = selectedChatIdsList
    if (ids.length === 0) return
    await Promise.all(ids.map((id) => updateConversationStateFlag(id, { isDeleted: true })))
    await Promise.all(ids.map((id) => archiveChatById(id)))
    clearConversationSelection()
  }, [archiveChatById, clearConversationSelection, selectedChatIdsList, updateConversationStateFlag])

  /**
   * Partage un produit dans la conversation actuellement ouverte (message produit synchronisé DB).
   */
  const shareProductInActiveChat = useCallback(async (product: any) => {
    if (!user?.id) {
      toast({ title: 'Action impossible', description: 'Vous devez être connecté.', variant: 'destructive' })
      return
    }
    if (!selectedChatId) {
      toast({ title: 'Action impossible', description: 'Aucune conversation sélectionnée.', variant: 'destructive' })
      return
    }

    const vendorId = String(product?.vendor_id ?? product?.vendorId ?? '').trim()
    const thumbnail =
      String(
        product?.image_url ??
          product?.imageUrl ??
          product?.image ??
          product?.mainImage ??
          product?.metadata?.thumbnail ??
          (Array.isArray(product?.images) && product.images.length > 0 ? product.images[0] : '') ??
          ''
      ).trim() || null

    const inserted = await DashboardService.addProductToChat({
      chatId: selectedChatId,
      senderId: user.id,
      product: {
        id: String(product?.id ?? '').trim(),
        name: String(product?.name ?? 'Produit').trim() || 'Produit',
        price: toFiniteNumber(product?.price) ?? 0,
        currency: String(product?.currency ?? 'XOF'),
        metadata: {
          vendor_id: vendorId,
          vendor_name: resolveVendorLabelFromProduct(product),
          thumbnail
        }
      }
    })

    if (inserted) {
      setDashboardDataRaw((prev) => {
        if (!prev) return prev
        const current = Array.isArray((prev as any).chatMessages) ? ((prev as any).chatMessages as any[]) : []
        const insertedId = String((inserted as any)?.id ?? '').trim()
        if (insertedId && current.some((m) => String((m as any)?.id ?? '').trim() === insertedId)) {
          return prev
        }
        return {
          ...(prev as any),
          chatMessages: [...current, inserted]
        }
      })
    }

    toast({
      title: 'Produit partagé',
      description: `${String(product?.name ?? 'Produit')} a été partagé dans la conversation.`,
      variant: 'default'
    })
  }, [resolveVendorLabelFromProduct, selectedChatId, setDashboardDataRaw, toast, toFiniteNumber, user?.id])

  /**
   * Liste (côté client) des produits du vendeur associé à la conversation active.
   */
  const vendorProductsForActiveChat = useMemo(() => {
    const vid = String((selectedChatContact ?? openingChatContact)?.partnerId ?? '').trim()
    if (!vid) return []
    const list = Array.isArray((dashboardData as any)?.chatProducts) ? (((dashboardData as any).chatProducts as any[]) ?? []) : []
    return list.filter((p: any) => String(p?.vendor_id ?? p?.vendorId ?? '').trim() === vid)
  }, [dashboardData?.chatProducts, openingChatContact, selectedChatContact])

  const toastFeatureComingSoon = useCallback((featureLabel: string) => {
    toast({
      title: 'Fonctionnalité à venir',
      description: `${featureLabel} sera bientôt disponible.`,
      variant: 'default'
    })
  }, [])

  /**
   * Encode les métadonnées d'une pièce jointe dans `content` (même format que le chat vendeur) pour rester compatible.
   */
  const encodeDashboardAttachmentContent = useCallback((payload: {
    kind: 'image' | 'video' | 'audio' | 'document' | 'file'
    url: string
    name?: string
    size?: number
    mime?: string
    text?: string
  }): string => {
    return `__attachment__:${JSON.stringify(payload)}`
  }, [])

  /**
   * Upload un fichier dans Supabase Storage et retourne l'URL publique (même approche que le chat vendeur).
   */
  const uploadDashboardChatAttachment = useCallback(async (chatId: string, file: File): Promise<string> => {
    const cid = String(chatId ?? '').trim()
    if (!cid) throw new Error('Chat ID manquant')

    const bucket =
      (process.env.NEXT_PUBLIC_SUPABASE_CHAT_UPLOAD_BUCKET && process.env.NEXT_PUBLIC_SUPABASE_CHAT_UPLOAD_BUCKET.trim())
        ? process.env.NEXT_PUBLIC_SUPABASE_CHAT_UPLOAD_BUCKET.trim()
        : 'chat-uploads'

    const ext = (() => {
      const name = String(file.name ?? '').trim()
      const idx = name.lastIndexOf('.')
      if (idx <= 0) return ''
      return name.slice(idx + 1).toLowerCase()
    })()
    const safeExt = ext ? `.${ext}` : ''
    const path = `chat/${encodeURIComponent(cid)}/${Date.now()}-${Math.random().toString(16).slice(2)}${safeExt}`

    const { error } = await ChatService.uploadFileToStorage(bucket, path, file)
    if (error) {
      const anyErr = error as any
      const msg = String(anyErr?.message ?? anyErr?.error ?? anyErr?.toString?.() ?? '')
      throw new Error(msg || 'Upload échoué')
    }
    const url = ChatService.getPublicUrlFromStorage(bucket, path)
    if (!url) throw new Error('URL upload manquante')
    return url
  }, [])

  /**
   * Ajoute un message à l'état local pour un rendu instantané (optimiste, sans régression).
   */
  const appendLocalChatMessage = useCallback((message: any) => {
    setDashboardDataRaw((prev) => {
      if (!prev) return prev
      const prevMsgs = Array.isArray((prev as any).chatMessages) ? ((prev as any).chatMessages as any[]) : []
      const exists = prevMsgs.some((m) => String(m?.id ?? '') === String(message?.id ?? ''))
      const nextMsgs = exists ? prevMsgs : [message, ...prevMsgs]
      return { ...(prev as any), chatMessages: nextMsgs }
    })
  }, [setDashboardDataRaw])

  /**
   * Retire localement des messages (pour refléter une action en lot sans attendre un refresh).
   */
  const removeLocalChatMessagesById = useCallback((ids: string[]) => {
    const wanted = new Set((ids ?? []).map((x) => String(x ?? '').trim()).filter(Boolean))
    if (wanted.size === 0) return
    setDashboardDataRaw((prev) => {
      if (!prev) return prev
      const prevMsgs = Array.isArray((prev as any).chatMessages) ? ((prev as any).chatMessages as any[]) : []
      const nextMsgs = prevMsgs.filter((m) => !wanted.has(String((m as any)?.id ?? '').trim()))
      if (nextMsgs.length === prevMsgs.length) return prev
      return { ...(prev as any), chatMessages: nextMsgs }
    })
  }, [setDashboardDataRaw])

  const toggleMessageSelectionDashboard = useCallback((messageId: string) => {
    const mid = String(messageId ?? '').trim()
    if (!mid) return
    setSelectedMessageIds((prev) => {
      const next = new Set(prev ?? new Set())
      if (next.has(mid)) next.delete(mid)
      else next.add(mid)
      return next
    })
  }, [])

  const clearMessageSelectionDashboard = useCallback(() => {
    setSelectedMessageIds(new Set())
  }, [])

  const selectedMessageIdsList = useMemo(() => Array.from(selectedMessageIds.values()), [selectedMessageIds])

  const selectAllMessagesInActiveChat = useCallback(() => {
    const list = Array.isArray(filteredChatMessages) ? filteredChatMessages : []
    const ids = list.map((m: any) => String(m?.id ?? '').trim()).filter(Boolean)
    setSelectedMessageIds(new Set(ids))
  }, [filteredChatMessages])

  const archiveSelectedMessagesDashboard = useCallback(async () => {
    const ids = selectedMessageIdsList
    if (ids.length === 0) return
    try {
      await Promise.all(ids.map((id) => DashboardService.archiveChatMessage(id)))
      removeLocalChatMessagesById(ids)
      clearMessageSelectionDashboard()
      setIsMessageSelectMode(false)
      toast({ title: 'Messages archivés', description: `${ids.length} message(s) archivé(s).`, variant: 'default' })
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Impossible d’archiver les messages.'
      toast({ title: 'Erreur', description: msg, variant: 'destructive' })
    }
  }, [clearMessageSelectionDashboard, removeLocalChatMessagesById, selectedMessageIdsList, toast])

  const deleteSelectedMessagesDashboard = useCallback(async () => {
    const ids = selectedMessageIdsList
    if (ids.length === 0) return
    try {
      await Promise.all(ids.map((id) => DashboardService.deleteChatMessage(id)))
      removeLocalChatMessagesById(ids)
      clearMessageSelectionDashboard()
      setIsMessageSelectMode(false)
      toast({ title: 'Messages supprimés', description: `${ids.length} message(s) supprimé(s).`, variant: 'default' })
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Impossible de supprimer les messages.'
      toast({ title: 'Erreur', description: msg, variant: 'destructive' })
    }
  }, [clearMessageSelectionDashboard, removeLocalChatMessagesById, selectedMessageIdsList, toast])

  /**
   * Envoie un message texte dans la conversation sélectionnée via ChatService (même pipeline DB).
   */
  const handleSendMessage = useCallback(async () => {
    const text = String(chatInput ?? '').trim()
    const chatId = String(selectedChatId ?? '').trim()
    const senderId = String(user?.id ?? '').trim()
    if (!text) return
    if (!chatId) {
      toast({ title: 'Chat', description: 'Veuillez sélectionner une conversation.', variant: 'destructive' })
      return
    }
    if (!senderId) {
      toast({ title: 'Chat', description: 'Vous devez être connecté.', variant: 'destructive' })
      return
    }

    try {
      setChatInput('')
      setShowEmojiPicker(false)
      const sent = await ChatService.sendMessage(chatId, senderId, text, 'text')
      if (sent) {
        appendLocalChatMessage(sent)
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Impossible d'envoyer le message."
      toast({ title: 'Erreur', description: msg, variant: 'destructive' })
    }
  }, [appendLocalChatMessage, chatInput, selectedChatId, toast, user?.id])

  /**
   * Envoie un fichier comme pièce jointe (upload + message __attachment__).
   */
  const sendDashboardAttachment = useCallback(async (file: File) => {
    const chatId = String(selectedChatId ?? '').trim()
    const senderId = String(user?.id ?? '').trim()
    if (!chatId) {
      toast({ title: 'Chat', description: 'Veuillez sélectionner une conversation.', variant: 'destructive' })
      return
    }
    if (!senderId) {
      toast({ title: 'Chat', description: 'Vous devez être connecté.', variant: 'destructive' })
      return
    }

    try {
      const url = await uploadDashboardChatAttachment(chatId, file)
      const mime = String(file.type ?? '').trim()
      const kind = (() => {
        const m = mime.toLowerCase()
        if (m.startsWith('image/')) return 'image' as const
        if (m.startsWith('video/')) return 'video' as const
        if (m.startsWith('audio/')) return 'audio' as const
        if (m.includes('pdf') || m.includes('word') || m.includes('text') || m.includes('presentation')) return 'document' as const
        return 'file' as const
      })()

      const content = encodeDashboardAttachmentContent({
        kind,
        url,
        name: file.name,
        size: file.size,
        mime
      })

      const sent = await ChatService.sendMessage(chatId, senderId, content, 'file')
      if (sent) appendLocalChatMessage(sent)
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Impossible d'envoyer la pièce jointe."
      toast({ title: 'Erreur', description: msg, variant: 'destructive' })
    }
  }, [appendLocalChatMessage, encodeDashboardAttachmentContent, selectedChatId, toast, uploadDashboardChatAttachment, user?.id])

  const formatRecordingTime = useCallback((seconds: number) => {
    const s = Math.max(0, Number(seconds) || 0)
    const mm = Math.floor(s / 60)
    const ss = s % 60
    return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
  }, [])

  /**
   * Démarre l'enregistrement audio (MediaRecorder) et prépare l'envoi au stop.
   */
  const startDashboardRecording = useCallback(async () => {
    if (isRecording) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream
      recordingChunksRef.current = []

      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordingChunksRef.current.push(event.data)
        }
      }

      recorder.onstop = async () => {
        try {
          const mime = recorder.mimeType || 'audio/webm'
          const blob = new Blob(recordingChunksRef.current, { type: mime })
          if (blob.size <= 0) return
          const file = new globalThis.File([blob], `audio_${Date.now()}.webm`, { type: blob.type || mime })
          await sendDashboardAttachment(file)
        } finally {
          recordingChunksRef.current = []
          setRecordingTime(0)
          setRecordingPaused(false)
          recordingPausedRef.current = false
          if (recordingIntervalRef.current) {
            clearInterval(recordingIntervalRef.current)
            recordingIntervalRef.current = null
          }
          try {
            recorder.stream.getTracks().forEach((t) => t.stop())
          } catch {
            // ignore
          }
          mediaRecorderRef.current = null
          mediaStreamRef.current = null
        }
      }

      recorder.start()
      setIsRecording(true)
      setRecordingPaused(false)
      recordingPausedRef.current = false
      setRecordingTime(0)

      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
      recordingIntervalRef.current = setInterval(() => {
        if (recordingPausedRef.current) return
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Impossible de démarrer le micro.'
      toast({ title: 'Microphone', description: msg, variant: 'destructive' })
      setIsRecording(false)
      setRecordingPaused(false)
      recordingPausedRef.current = false
      setRecordingTime(0)
      mediaRecorderRef.current = null
      try {
        mediaStreamRef.current?.getTracks?.().forEach((t) => t.stop())
      } catch {
        // ignore
      }
      mediaStreamRef.current = null
    }
  }, [isRecording, sendDashboardAttachment, toast])

  /**
   * Stoppe l'enregistrement (déclenche l'upload/envoi dans onstop).
   */
  const stopDashboardRecording = useCallback(() => {
    try {
      const recorder = mediaRecorderRef.current
      if (recorder && recorder.state !== 'inactive') {
        recorder.stop()
      }
    } finally {
      setIsRecording(false)
      setRecordingPaused(false)
      recordingPausedRef.current = false
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
        recordingIntervalRef.current = null
      }
    }
  }, [])

  const toggleDashboardRecordingPause = useCallback(() => {
    const recorder = mediaRecorderRef.current
    if (!recorder || !isRecording) return
    try {
      if (recordingPaused) {
        recorder.resume()
        setRecordingPaused(false)
        recordingPausedRef.current = false
      } else {
        recorder.pause()
        setRecordingPaused(true)
        recordingPausedRef.current = true
      }
    } catch {
      // ignore
    }
  }, [isRecording, recordingPaused])

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
        recordingIntervalRef.current = null
      }
      try {
        mediaStreamRef.current?.getTracks?.().forEach((t) => t.stop())
      } catch {
        // ignore
      }
      mediaStreamRef.current = null
      mediaRecorderRef.current = null
    }
  }, [])

  const realRecommendedProducts = dashboardData?.recommendedProducts ?? []
  const realRecommendedSellers = dashboardData?.recommendedSellers ?? []
  const realSharedProducts = dashboardData?.sharedProducts ?? []
  const realChatProducts = dashboardData?.chatProducts ?? []
  const realRecommendedPromotions = (dashboardData as any)?.recommendedPromotions ?? []
  const realShopProducts = dashboardData?.shopProducts ?? []
  const realActivities = dashboardData?.recentActivities ?? []

  // Précision IA réelle = moyenne des scores de confiance des recommandations actives
  const aiPrecisionPercent = useMemo(() => {
    const confidences = [
      ...realRecommendedProducts.map((p: any) => Number(p?.aiConfidence ?? 0)),
      ...realRecommendedSellers.map((s: any) => Number(s?.aiConfidence ?? 0)),
      ...realRecommendedPromotions.map((p: any) => Number(p?.aiConfidence ?? 0))
    ].filter(n => Number.isFinite(n) && n > 0)
    if (confidences.length === 0) return 0
    return Math.round(confidences.reduce((a: number, b: number) => a + b, 0) / confidences.length)
  }, [realRecommendedProducts, realRecommendedSellers, realRecommendedPromotions])

  // Hydratation des interactions persistées (favoris, follows, alertes, usage)
  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    void (async () => {
      const interactions = await DashboardService.getUserInteractions(user.id)
      if (cancelled) return
      if (interactions.wishlistProductIds.length > 0) {
        setProductFavorites(prev => Array.from(new Set([...prev, ...interactions.wishlistProductIds])))
      }
      if (interactions.promotionFavorites.length > 0) {
        setPromotionFavorites(prev => Array.from(new Set([...prev, ...interactions.promotionFavorites])))
      }
      if (interactions.sellerFollows.length > 0) {
        setSellerFollowStatus(prev => {
          const next = { ...prev }
          for (const sellerId of interactions.sellerFollows) {
            if (!(sellerId in next)) next[sellerId] = true
          }
          return next
        })
      }
      if (interactions.promotionAlerts.length > 0) {
        setPromotionAlerts(prev => Array.from(new Set([...prev, ...interactions.promotionAlerts])))
      }
      if (Object.keys(interactions.promotionUsage).length > 0) {
        setPromotionUsage(prev => ({ ...interactions.promotionUsage, ...prev }))
      }
      if (interactions.promotionAppliedIds.length > 0) {
        setAppliedPromotions(prev => Array.from(new Set([...prev, ...interactions.promotionAppliedIds])))
      }
    })()
    return () => { cancelled = true }
  }, [user?.id])

  // Gestion du chargement et des erreurs Supabase
  useEffect(() => {
    if (dashboardData) {
      setIsLoading(false)
    }
  }, [dashboardData])

  useEffect(() => {
    if (!dashboardData?.userProfile && !user) {
      return
    }

    const profile = dashboardData?.userProfile
    const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim()

    setProfileData(prev => ({
      fullName: fullName || prev.fullName || user?.email || '',
      email: user?.email || prev.email || '',
      phone: profile?.phone || prev.phone || '',
      country: profile?.country || prev.country || '',
      address: profile?.address || prev.address || '',
      avatar: profile?.avatar_url || prev.avatar || '/placeholder.jpg'
    }))

    // Charger les préférences de notifications depuis Supabase (user_profiles.preferences)
    // avec fallback localStorage (évite toute régression si la base n'est pas encore configurée).
    try {
      const prefs = profile?.preferences && typeof profile.preferences === 'object' && !Array.isArray(profile.preferences)
        ? (profile.preferences as any)
        : null

      const notifPrefs = prefs?.notifications && typeof prefs.notifications === 'object' && !Array.isArray(prefs.notifications)
        ? (prefs.notifications as any)
        : null

      const notifSettings = notifPrefs?.settings && typeof notifPrefs.settings === 'object' && !Array.isArray(notifPrefs.settings)
        ? (notifPrefs.settings as any)
        : null

      if (notifSettings) {
        setNotificationSettings(prev => ({
          ...prev,
          email: typeof notifSettings.email === 'boolean' ? notifSettings.email : prev.email,
          push: typeof notifSettings.push === 'boolean' ? notifSettings.push : prev.push,
          sms: typeof notifSettings.sms === 'boolean' ? notifSettings.sms : prev.sms,
          orders: typeof notifSettings.orders === 'boolean' ? notifSettings.orders : prev.orders,
          points: typeof notifSettings.points === 'boolean' ? notifSettings.points : prev.points,
          chat: typeof notifSettings.chat === 'boolean' ? notifSettings.chat : prev.chat,
          promotions: typeof notifSettings.promotions === 'boolean' ? notifSettings.promotions : prev.promotions,
          system: typeof notifSettings.system === 'boolean' ? notifSettings.system : prev.system,
          ai: typeof notifSettings.ai === 'boolean' ? notifSettings.ai : prev.ai
        }))
      } else if (typeof window !== 'undefined') {
        // Fallback localStorage (ancien comportement)
        const raw = window.localStorage.getItem('notificationSettings')
        if (raw) {
          const parsed = JSON.parse(raw)
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            setNotificationSettings(prev => ({ ...prev, ...(parsed as any) }))
          }
        }
      }

      const freq = typeof notifPrefs?.frequency === 'string' ? notifPrefs.frequency.trim() : ''
      if (freq) {
        setNotificationFrequency(freq)
      } else if (typeof window !== 'undefined') {
        const raw = window.localStorage.getItem('notificationFrequency')
        if (raw && raw.trim()) setNotificationFrequency(raw.trim())
      }

      const start = typeof notifPrefs?.startTime === 'string' ? notifPrefs.startTime.trim() : ''
      if (start) {
        setNotificationStartTime(start)
      } else if (typeof window !== 'undefined') {
        const raw = window.localStorage.getItem('notificationStartTime')
        if (raw && raw.trim()) setNotificationStartTime(raw.trim())
      }

      const end = typeof notifPrefs?.endTime === 'string' ? notifPrefs.endTime.trim() : ''
      if (end) {
        setNotificationEndTime(end)
      } else if (typeof window !== 'undefined') {
        const raw = window.localStorage.getItem('notificationEndTime')
        if (raw && raw.trim()) setNotificationEndTime(raw.trim())
      }
    } catch {
      // ignore (best-effort)
    }

    if (dashboardData?.pointsSummary) {
      setUserTier(dashboardData.pointsSummary.tier ?? '')
    }

    if (dashboardData?.notifications) {
      setNotifications(realNotifications)
      const unreadCount = realNotifications.filter(notification => !notification.isRead).length
      setUnreadNotifications(unreadCount)
    }

    if (dashboardData?.messages) {
      setInternalMessages(realMessages)
    }
  }, [dashboardData?.userProfile, dashboardData?.notifications, dashboardData?.messages, pointsSummary?.balance, realNotifications, realMessages, user])

  useEffect(() => {
    let cancelled = false

    const authEmail = String(user?.email ?? '').trim()
    const dbEmail = String((dashboardData as any)?.userProfile?.email ?? '').trim()

    if (!authEmail || !dbEmail) return
    if (authEmail.toLowerCase() === dbEmail.toLowerCase()) return

    const sync = async () => {
      try {
        const accessToken = await getClientAccessTokenSafe()
        const headers: Record<string, string> = { accept: 'application/json' }
        if (accessToken) headers.Authorization = `Bearer ${accessToken}`

        const resp = await fetch('/api/client/profile/sync-email', {
          method: 'POST',
          headers
        })

        const body = await resp.json().catch(() => null)
        if (!resp.ok) {
          return
        }

        const email = String(body?.data?.email ?? '').trim()
        if (!email || cancelled) return

        setDashboardDataRaw(prev => {
          if (!prev) return prev
          const nextProfile = { ...(prev as any).userProfile, email }
          return { ...(prev as any), userProfile: nextProfile }
        })
      } catch {
        // ignore
      }
    }

    void sync()
    return () => { cancelled = true }
  }, [user?.email, dashboardData])

  const handleMarkAllNotificationsRead = useCallback(async () => {
    if (!user?.id) {
      toast({
        title: 'Action impossible',
        description: 'Veuillez vous reconnecter pour gérer vos notifications.',
        variant: 'destructive'
      })
      return
    }

    try {
      await DashboardService.markAllNotificationsRead(user.id)
      setNotifications(prev => prev.map(notification => ({ ...notification, isRead: true })))
      setUnreadNotifications(0)
      void loadNotificationStats()
      toast({
        title: 'Succès !',
        description: 'Toutes les notifications ont été marquées comme lues.',
        variant: 'default'
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible de mettre à jour les notifications."
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive'
      })
    }
  }, [loadNotificationStats, toast, user?.id])

  const handleDeleteReadNotifications = useCallback(async () => {
    if (!user?.id) {
      toast({
        title: 'Action impossible',
        description: 'Veuillez vous reconnecter pour gérer vos notifications.',
        variant: 'destructive'
      })
      return
    }

    try {
      const deletedCount = await DashboardService.deleteReadNotifications(user.id)
      setNotifications(prev => prev.filter(notification => !notification.isRead))
      void loadNotificationStats()
      if (deletedCount > 0) {
        toast({
          title: 'Suppression réussie !',
          description: `${deletedCount} notification(s) lue(s) supprimée(s).`,
          variant: 'default'
        })
      } else {
        toast({
          title: 'Aucune notification supprimée',
          description: 'Aucune notification lue à supprimer pour le moment.',
          variant: 'default'
        })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible de supprimer les notifications lues."
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive'
      })
    }
  }, [loadNotificationStats, toast, user?.id])

  const handleToggleNotificationRead = useCallback(async (notification: NotificationItem) => {
    const nextState = !notification.isRead

    try {
      await DashboardService.markNotificationRead(notification.id, nextState)
      setNotifications(prev => prev.map(item => (item.id === notification.id ? { ...item, isRead: nextState } : item)))
      setUnreadNotifications(prev => {
        if (notification.isRead && !nextState) {
          return prev + 1
        }
        if (!notification.isRead && nextState) {
          return Math.max(0, prev - 1)
        }
        return prev
      })
      void loadNotificationStats()
      toast({
        title: 'État modifié !',
        description: nextState ? 'Notification marquée comme lue.' : 'Notification marquée comme non lue.',
        variant: 'default'
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible de modifier l'état de la notification."
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive'
      })
    }
  }, [loadNotificationStats, toast])

  const handleDeleteNotification = useCallback(async (notification: NotificationItem) => {
    try {
      await DashboardService.deleteNotification(notification.id)
      setNotifications(prev => prev.filter(item => item.id !== notification.id))
      if (!notification.isRead) {
        setUnreadNotifications(prev => Math.max(0, prev - 1))
      }
      void loadNotificationStats()
      toast({
        title: 'Notification supprimée !',
        description: `"${notification.title}" a été supprimée.`,
        variant: 'default'
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossible de supprimer la notification.'
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive'
      })
    }
  }, [toast])

  const handleMarkAllMessagesRead = useCallback(async () => {
    if (!user?.id) {
      toast({
        title: 'Action impossible',
        description: 'Veuillez vous reconnecter pour gérer vos messages.',
        variant: 'destructive'
      })
      return
    }

    try {
      await DashboardService.markAllMessagesRead(user.id)
      setInternalMessages(prev => prev.map(message => ({ ...message, isRead: true, status: 'read' })))
      setMessageDeliveryStatus(prev => {
        const updated = { ...prev }
        Object.keys(updated).forEach(id => {
          updated[id] = { status: 'read', timestamp: updated[id]?.timestamp ?? new Date().toISOString() }
        })
        return updated
      })
      toast({
        title: 'Messages marqués comme lus',
        description: 'Tous vos messages ont été marqués comme lus.',
        variant: 'default'
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible de marquer les messages comme lus."
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive'
      })
    }
  }, [toast, user?.id])

  const handleMarkSingleMessageRead = useCallback(async (message: InternalMessage) => {
    try {
      await DashboardService.markMessageRead(message.id, true)
      setInternalMessages(prev => prev.map(item => (item.id === message.id ? { ...item, isRead: true, status: 'read' } : item)))
      setMessageDeliveryStatus(prev => ({
        ...prev,
        [message.id]: { status: 'read', timestamp: message.timestamp }
      }))
      toast({
        title: 'Message marqué comme lu',
        description: `"${message.subject}" est désormais marqué comme lu.`,
        variant: 'default'
      })
    } catch (error) {
      const messageError = error instanceof Error ? error.message : "Impossible de marquer le message comme lu."
      toast({
        title: 'Erreur',
        description: messageError,
        variant: 'destructive'
      })
    }
  }, [toast])

  const handleUpdateMessagePriority = useCallback(async (message: InternalMessage, priority: InternalMessage['priority']) => {
    try {
      await DashboardService.updateMessagePriority(message.id, priority)
      setInternalMessages(prev => prev.map(item => (item.id === message.id ? { ...item, priority } : item)))
      toast({
        title: 'Priorité mise à jour',
        description: `La priorité du message "${message.subject}" a été définie sur ${priority}.`,
        variant: 'default'
      })
    } catch (error) {
      const messageError = error instanceof Error ? error.message : "Impossible de mettre à jour la priorité du message."
      toast({
        title: 'Erreur',
        description: messageError,
        variant: 'destructive'
      })
    }
  }, [toast])

  const handleArchiveMessage = useCallback(async (message: InternalMessage) => {
    try {
      await DashboardService.archiveMessage(message.id)
      setInternalMessages(prev => prev.filter(item => item.id !== message.id))
      toast({
        title: 'Message archivé',
        description: `Le message "${message.subject}" a été archivé.`,
        variant: 'default'
      })
    } catch (error) {
      const messageError = error instanceof Error ? error.message : "Impossible d'archiver le message."
      toast({
        title: 'Erreur',
        description: messageError,
        variant: 'destructive'
      })
    }
  }, [toast])

  const handleCreateMessage = useCallback(async () => {
    if (!user?.id) {
      toast({
        title: 'Utilisateur non authentifié',
        description: 'Veuillez vous reconnecter pour envoyer un message.',
        variant: 'destructive'
      })
      return
    }

    /**
     * Normalise une catégorie libre (UI) vers une catégorie supportée par le dashboard client.
     */
    const normalizeClientMessageCategory = (value: string): MessageCategory => {
      const raw = String(value ?? '').trim().toLowerCase()
      if (raw === 'support') return 'support'
      if (raw === 'technical' || raw === 'tech') return 'technical'
      if (raw === 'billing' || raw === 'payment') return 'billing'
      if (raw === 'account') return 'account'
      return 'general'
    }

    const normalizedCategory = normalizeClientMessageCategory(newMessageCategory)

    if (newMessageSubject.trim().length === 0 || newMessageContent.trim().length === 0) {
      toast({
        title: 'Champs requis',
        description: 'Sujet et contenu sont obligatoires pour envoyer un message.',
        variant: 'destructive'
      })
      return
    }

    try {
      setIsSendingMessage(true)
      const createdMessage = await DashboardService.createMessage({
        senderId: user.id,
        recipientId: null,
        subject: newMessageSubject.trim(),
        content: newMessageContent.trim(),
        category: normalizedCategory,
        priority: (newMessagePriority as InternalMessage['priority']) ?? 'medium',
        attachments: newMessageAttachments.map((item) => item.url)
      })

      const mapped = mapSupabaseMessageToInternal(createdMessage)

      setInternalMessages(prev => [mapped, ...prev])
      setMessageDeliveryStatus(prev => ({
        ...prev,
        [mapped.id]: { status: mapped.status, timestamp: mapped.timestamp }
      }))

      setNewMessageSubject('')
      setNewMessageContent('')
      setNewMessageCategory('general')
      setNewMessagePriority('medium')
      setNewMessageAttachments([])
      setShowNewMessageModal(false)

      void loadMessageStats()

      toast({
        title: 'Message envoyé',
        description: 'Votre message a été envoyé avec succès.',
        variant: 'default'
      })
    } catch (error) {
      const messageError = error instanceof Error ? error.message : "Impossible d'envoyer le message."
      toast({
        title: 'Erreur',
        description: messageError,
        variant: 'destructive'
      })
    } finally {
      setIsSendingMessage(false)
    }
  }, [user?.id, newMessageAttachments, newMessageCategory, newMessageContent, newMessagePriority, newMessageSubject, toast, mapSupabaseMessageToInternal, loadMessageStats])

  /**
   * Upload un fichier dans Supabase Storage (bucket chat-uploads) et retourne l'URL publique.
   */
  const uploadInternalMessageAttachment = useCallback(async (file: File): Promise<{ name: string; url: string }> => {
    const bucket =
      (process.env.NEXT_PUBLIC_SUPABASE_CHAT_UPLOAD_BUCKET && process.env.NEXT_PUBLIC_SUPABASE_CHAT_UPLOAD_BUCKET.trim())
        ? process.env.NEXT_PUBLIC_SUPABASE_CHAT_UPLOAD_BUCKET.trim()
        : 'chat-uploads'

    const ext = (() => {
      const name = String(file?.name ?? '').trim()
      const idx = name.lastIndexOf('.')
      if (idx === -1) return ''
      return name.slice(idx + 1).toLowerCase()
    })()

    const safeName = String(file.name ?? 'file').replace(/[^a-zA-Z0-9._-]+/g, '_')
    const uniqueId = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`
    const objectPath = `internal-messages/${String(user?.id ?? 'anonymous')}/${uniqueId}-${safeName}`

    const { error: uploadError } = await supabase.storage.from(bucket).upload(objectPath, file, {
      upsert: false,
      contentType: file.type || undefined
    })

    if (uploadError) {
      throw new Error(uploadError.message || 'Upload échoué')
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath)
    const publicUrl = String(data?.publicUrl ?? '').trim()
    if (!publicUrl) {
      throw new Error("Impossible d'obtenir l'URL publique de la pièce jointe.")
    }

    return { name: file.name, url: publicUrl }
  }, [user?.id])

  /**
   * Gestion de la sélection et de l'upload d'une pièce jointe pour un message interne.
   */
  const handlePickInternalMessageAttachment = useCallback(async () => {
    if (isUploadingNewMessageAttachment) return
    internalMessageFileInputRef.current?.click()
  }, [isUploadingNewMessageAttachment])

  const handleInternalMessageFileSelected = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      event.target.value = ''
      if (!file) return

      const maxBytes = 5 * 1024 * 1024
      if (file.size > maxBytes) {
        toast({
          title: 'Fichier trop volumineux',
          description: 'Taille maximale: 5MB',
          variant: 'destructive'
        })
        return
      }

      try {
        setIsUploadingNewMessageAttachment(true)
        const uploaded = await uploadInternalMessageAttachment(file)
        setNewMessageAttachments((prev) => {
          const next = [...(prev ?? [])]
          next.push(uploaded)
          return next
        })
        toast({
          title: 'Pièce jointe ajoutée',
          description: uploaded.name,
          variant: 'default'
        })
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Impossible d'uploader la pièce jointe."
        toast({ title: 'Erreur', description: msg, variant: 'destructive' })
      } finally {
        setIsUploadingNewMessageAttachment(false)
      }
    },
    [toast, uploadInternalMessageAttachment]
  )

  useEffect(() => {
    void refreshPointsData()
  }, [refreshPointsData])

  /**
   * Abonnement Realtime: met à jour automatiquement le solde et la configuration quand la DB change.
   */
  useEffect(() => {
    if (!user?.id) {
      return
    }

    const channel = supabase
      .channel(`client-points-sync-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'loyalty_points',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          void refreshPointsData()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'point_settings' },
        () => {
          void refreshPointsData()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'point_operation_fees' },
        () => {
          void refreshPointsData()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'point_operation_limits' },
        () => {
          void refreshPointsData()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'point_exchange_rates' },
        () => {
          void refreshPointsData()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'point_withdrawal_methods' },
        () => {
          void refreshPointsData()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'point_withdrawal_method_limits' },
        () => {
          void refreshPointsData()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'point_transactions',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          void handleRefreshDashboard()
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [user?.id, handleRefreshDashboard, refreshPointsData])

  useEffect(() => {
    const controller = new AbortController()

    const searchRecipients = async () => {
      if (!showTransferPointsModal) {
        return
      }
      if (!transferRecipientQuery.trim()) {
        setTransferRecipientResults([])
        return
      }

      try {
        setTransferRecipientLoading(true)
        setTransferError(null)
        const results = await ClientPointsService.searchRecipients(transferRecipientQuery)
        setTransferRecipientResults(results)
      } catch (error) {
        console.error('Erreur lors de la recherche de destinataires:', error)
        setTransferError(error instanceof Error ? error.message : 'Recherche impossible pour le moment')
      } finally {
        setTransferRecipientLoading(false)
      }
    }

    const debounce = setTimeout(() => {
      searchRecipients()
    }, 400)

    return () => {
      clearTimeout(debounce)
      controller.abort()
    }
  }, [transferRecipientQuery, showTransferPointsModal])

  useEffect(() => {
    const fetchExchangeOptions = async () => {
      if (!showExchangePointsModal) {
        return
      }

      setExchangeOptionsLoading(true)

      try {
        const rewards = await ClientPointsService.listAvailableRewards()
        setExchangeRewardOptions(rewards)

        const hasRates = (pointsConfigurationState?.exchangeRates?.length ?? 0) > 0
        if (!hasRates && rewards.length === 0) {
          setExchangeError("Aucune option d'échange n'est disponible pour le moment.")
        } else {
          setExchangeError(null)
        }
      } catch (error) {
        console.error("Erreur lors du chargement des options d'échange:", error)
        setExchangeRewardOptions([])
        setExchangeError(error instanceof Error ? error.message : "Impossible de charger les options d'échange")
      } finally {
        setExchangeOptionsLoading(false)
      }
    }

    fetchExchangeOptions()
  }, [showExchangePointsModal, pointsConfigurationState])

  // Simuler le chargement initial
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  const formatNumber = useCallback((value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(value)
  }, [])

  const formatPointsValue = useCallback((value: number) => {
    return `${formatNumber(value)} pts`
  }, [formatNumber])

  const calculateFee = useCallback((amount: number, feeConfig?: { flat: number; percentage: number; minimum: number; maximum: number | null }) => {
    if (!feeConfig || amount <= 0) {
      return 0
    }

    const { flat = 0, percentage = 0, minimum = 0, maximum = null } = feeConfig
    const percentageFee = (amount * percentage) / 100
    let total = flat + percentageFee
    total = Math.max(total, minimum)
    if (maximum !== null && maximum !== undefined) {
      total = Math.min(total, maximum)
    }

    return Number(total.toFixed(2))
  }, [])

  const sanitizeNumericInput = useCallback((value: string) => {
    return value.replace(/[^\d.,]/g, '')
  }, [])

  const getRecipientDisplayName = useCallback((recipient: TransferRecipient) => {
    return (
      recipient.fullName?.trim() ||
      recipient.username?.trim() ||
      recipient.email?.trim() ||
      recipient.phone?.trim() ||
      recipient.id
    )
  }, [])

  const resolvedPointsConfiguration = syncedConfiguration ?? pointsConfigurationState

  const transferFeeConfig = resolvedPointsConfiguration?.fees?.transfer
  const exchangeFeeConfig = resolvedPointsConfiguration?.fees?.exchange

  const transferAmountValue = useMemo(() => {
    const sanitized = sanitizeNumericInput(transferAmountInput).replace(',', '.')
    return Number(sanitized) || 0
  }, [transferAmountInput, sanitizeNumericInput])

  const transferFee = useMemo(() => calculateFee(transferAmountValue, transferFeeConfig), [transferAmountValue, transferFeeConfig, calculateFee])
  const transferTotal = useMemo(() => Number((transferAmountValue + transferFee).toFixed(2)), [transferAmountValue, transferFee])

  const transferLimitMessage = useMemo(() => {
    if (!resolvedPointsConfiguration || transferAmountValue <= 0) {
      return null
    }

    const limits = resolvedPointsConfiguration.limits.transfer

    if (limits.min !== null && limits.min !== undefined && transferAmountValue < limits.min) {
      return `Nombre de points minimum autorisé : ${formatPointsValue(limits.min)}`
    }

    if (limits.max !== null && limits.max !== undefined && transferAmountValue > limits.max) {
      return `Nombre de points maximum autorisé : ${formatPointsValue(limits.max)}`
    }

    const availableBalance = pointsSummary?.balance ?? 0
    if (transferTotal > availableBalance) {
      return 'Solde insuffisant pour couvrir le transfert et les frais'
    }

    return null
  }, [resolvedPointsConfiguration, transferAmountValue, transferTotal, pointsSummary, formatPointsValue])

  const exchangeAmountValue = useMemo(() => {
    const sanitized = sanitizeNumericInput(exchangeAmountInput).replace(',', '.')
    return Number(sanitized) || 0
  }, [exchangeAmountInput, sanitizeNumericInput])

  const exchangeFee = useMemo(() => calculateFee(exchangeAmountValue, exchangeFeeConfig), [exchangeAmountValue, exchangeFeeConfig, calculateFee])
  const exchangeTotal = useMemo(() => Number((exchangeAmountValue + exchangeFee).toFixed(2)), [exchangeAmountValue, exchangeFee])

  const hasExchangeRates = useMemo(() => (pointsConfigurationState?.exchangeRates?.length ?? 0) > 0, [pointsConfigurationState?.exchangeRates?.length])

  const selectedExchangeRate = useMemo(() => {
    if (selectedExchangeOption !== 'currency') {
      return null
    }
    const exchangeRates = pointsConfigurationState?.exchangeRates ?? []
    if (!exchangeCurrency) {
      return exchangeRates.find(rate => rate.isDefault) || exchangeRates[0] || null
    }
    return (
      exchangeRates.find(rate => rate.currency === exchangeCurrency) ||
      exchangeRates.find(rate => rate.isDefault) ||
      exchangeRates[0] ||
      null
    )
  }, [pointsConfigurationState, exchangeCurrency, selectedExchangeOption])

  const exchangeConvertedAmount = useMemo(() => {
    if (selectedExchangeOption !== 'currency' || !selectedExchangeRate) {
      return 0
    }
    return Number((exchangeAmountValue * selectedExchangeRate.rate).toFixed(2))
  }, [exchangeAmountValue, selectedExchangeOption, selectedExchangeRate])

  const rewardOptionsByCategory = useMemo(() => {
    const groups: Record<RewardExchangeOptionKey, ClientRewardOption[]> = {
      gift: [],
      voucher: [],
      discount: []
    }

    exchangeRewardOptions.forEach((option) => {
      (Object.keys(groups) as RewardExchangeOptionKey[]).forEach((key) => {
        if (REWARD_TYPES_BY_OPTION[key].includes(option.rewardType)) {
          groups[key].push(option)
        }
      })
    })

    return groups
  }, [exchangeRewardOptions])

  const rewardsForSelectedOption = useMemo(() => {
    if (selectedExchangeOption === 'currency') {
      return []
    }
    return rewardOptionsByCategory[selectedExchangeOption as RewardExchangeOptionKey]
  }, [rewardOptionsByCategory, selectedExchangeOption])

  const selectedReward = useMemo(() => {
    if (!selectedRewardId) {
      return null
    }
    return exchangeRewardOptions.find(option => option.id === selectedRewardId) || null
  }, [selectedRewardId, exchangeRewardOptions])

  useEffect(() => {
    if (selectedExchangeOption === 'currency') {
      return
    }

    const rewards = rewardOptionsByCategory[selectedExchangeOption as RewardExchangeOptionKey]

    if (!rewards || rewards.length === 0) {
      if (selectedRewardId) {
        setSelectedRewardId('')
      }
      return
    }

    const existingSelection = rewards.find(reward => reward.id === selectedRewardId)
    if (!existingSelection) {
      const firstReward = rewards[0]
      setSelectedRewardId(firstReward.id)
      setExchangeAmountInput(String(firstReward.pointsCost))
    }
  }, [selectedExchangeOption, rewardOptionsByCategory, selectedRewardId])

  const formatCurrencyValue = useCallback((value: number, currencyCode: string) => {
    try {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value)
    } catch (error) {
      return `${value.toFixed(2)} ${currencyCode}`
    }
  }, [])

  const rewardCostMismatch = useMemo(() => {
    if (selectedExchangeOption === 'currency' || !selectedReward) {
      return false
    }
    return selectedReward.pointsCost !== exchangeAmountValue
  }, [selectedExchangeOption, selectedReward, exchangeAmountValue])

  const exchangeLimitMessage = useMemo(() => {
    if (!pointsConfigurationState || exchangeAmountValue <= 0) {
      return null
    }

    if (selectedExchangeOption !== 'currency') {
      if (!selectedReward) {
        return 'Veuillez sélectionner une récompense disponible'
      }
      if (rewardCostMismatch) {
        return `Cette récompense coûte exactement ${formatPointsValue(selectedReward.pointsCost)}. Ajustez le montant saisi.`
      }
      if (selectedReward.pointsCost > (pointsSummary?.balance ?? 0)) {
        return 'Solde insuffisant pour obtenir cette récompense'
      }

      return null
    }

    const limits = pointsConfigurationState.limits.exchange

    if (limits.min !== null && limits.min !== undefined && exchangeAmountValue < limits.min) {
      return `Nombre de points minimum à échanger : ${formatPointsValue(limits.min)}`
    }

    if (limits.max !== null && limits.max !== undefined && exchangeAmountValue > limits.max) {
      return `Nombre de points maximum à échanger : ${formatPointsValue(limits.max)}`
    }

    const availableBalance = pointsSummary?.balance ?? 0
    if (exchangeTotal > availableBalance) {
      return 'Solde insuffisant pour couvrir l’échange et les frais'
    }

    return null
  }, [pointsConfigurationState, exchangeAmountValue, exchangeTotal, pointsSummary, formatPointsValue, selectedExchangeOption, selectedReward, rewardCostMismatch])

  const defaultCurrency = syncedConfiguration?.settings?.defaultCurrency ?? pointsConfigurationState?.settings?.defaultCurrency ?? 'XOF'
  const conversionRate = (Number.isFinite(Number(syncedConversionRate)) && Number(syncedConversionRate) > 0)
    ? Number(syncedConversionRate)
    : (pointsConfigurationState?.settings?.conversionRate ?? 1)

  const basePointsPerFCFA = useMemo(() => {
    const fromHook = Number((syncedConfiguration?.settings as any)?.basePointsPerFCFA)
    if (Number.isFinite(fromHook) && fromHook > 0) return fromHook
    const fromState = Number((pointsConfigurationState?.settings as any)?.basePointsPerFCFA)
    if (Number.isFinite(fromState) && fromState > 0) return fromState
    return 1
  }, [pointsConfigurationState?.settings, syncedConfiguration?.settings])

  const basePointValue = useMemo(() => conversionRate, [conversionRate])
  const purchaseFeePercent = useMemo(() => {
    const raw = Number((pointsConfigurationState?.settings as any)?.purchaseFeePercent)
    return Number.isFinite(raw) && raw >= 0 ? raw : 2
  }, [pointsConfigurationState?.settings])
  const withdrawalValue = useMemo(() => {
    const fromHook = Number((syncedConfiguration?.settings as any)?.withdrawalValue)
    if (Number.isFinite(fromHook) && fromHook > 0) {
      return fromHook
    }
    const fromState = Number((pointsConfigurationState?.settings as any)?.withdrawalValue)
    if (Number.isFinite(fromState) && fromState > 0) {
      return fromState
    }
    return conversionRate
  }, [syncedConfiguration?.settings, pointsConfigurationState?.settings, conversionRate])

  // Règle métier: aucun frais de retrait.
  const withdrawalFeeConfig = null

  const withdrawalMinPoints = useMemo(() => {
    const fromHookRaw = (syncedConfiguration?.limits?.withdrawal as any)?.min
    const fromHook = Number(fromHookRaw)
    if (Number.isFinite(fromHook) && fromHook > 0) {
      return fromHook
    }

    const fromStateRaw = (pointsConfigurationState?.limits?.withdrawal as any)?.min
    const fromState = Number(fromStateRaw)
    if (Number.isFinite(fromState) && fromState > 0) {
      return fromState
    }
    return 1000
  }, [pointsConfigurationState?.limits?.withdrawal, syncedConfiguration?.limits?.withdrawal])

  /**
   * Valeur estimée des points dans la devise de base (par défaut XOF).
   */
  const pointsEstimatedValue = useMemo(() => {
    // Source de vérité affichage portefeuille: valeur de base (points => FCFA).
    const computed = userPoints * basePointValue
    if (!Number.isFinite(computed)) {
      return 0
    }

    return Number(computed.toFixed(2))
  }, [userPoints, basePointValue])

  const syncedEstimatedValueSafe = useMemo(() => {
    const v = syncedEstimatedValue
    return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null
  }, [syncedEstimatedValue])

  const withdrawalMethods = useMemo(() => {
    const baseCurrency = (pointsConfigurationState?.settings.defaultCurrency ?? 'XOF').toUpperCase()

    return [
      {
        id: 'mobile-money',
        name: 'Mobile Money',
        description: 'Retrait instantané vers votre portefeuille Mobile Money',
        isActive: true,
        limits: [
          {
            currency: baseCurrency,
            processingTime: 'Instantané (sous 15 minutes)'
          }
        ]
      },
      {
        id: 'paypal',
        name: 'PayPal',
        description: 'Transfert sécurisé vers votre compte PayPal',
        isActive: true,
        limits: [
          {
            currency: baseCurrency,
            processingTime: '24 à 48 heures'
          }
        ]
      }
    ]
  }, [pointsConfigurationState?.settings.defaultCurrency])

  const selectedWithdrawalMethodDetails = useMemo(() => {
    if (!selectedWithdrawalMethod) {
      return null
    }

    return withdrawalMethods.find(method => method.id === selectedWithdrawalMethod || method.name === selectedWithdrawalMethod) ?? null
  }, [withdrawalMethods, selectedWithdrawalMethod])

  const selectedWithdrawalMethodId = selectedWithdrawalMethod ?? ''

  const selectedMethodLimit = useMemo(() => {
    if (!selectedWithdrawalMethodDetails) {
      return null
    }

    if (!selectedWithdrawalMethodId) {
      return selectedWithdrawalMethodDetails.limits[0] ?? null
    }

    return (
      selectedWithdrawalMethodDetails.limits.find(limit => limit.currency === defaultCurrency) ||
      selectedWithdrawalMethodDetails.limits[0] ||
      null
    )
  }, [selectedWithdrawalMethodDetails, selectedWithdrawalMethodId, defaultCurrency])

  const withdrawalIdentifierConfig = useMemo(() => {
    if (!selectedWithdrawalMethodDetails) {
      return {
        label: 'Référence (optionnelle)',
        placeholder: 'Ex: identifiant à associer',
        helper: '',
        required: false,
        type: 'text' as const
      }
    }

    const methodName = selectedWithdrawalMethodDetails.name.toLowerCase()
    const description = selectedWithdrawalMethodDetails.description?.toLowerCase() ?? ''
    const methodContext = `${methodName} ${description}`

    if (methodContext.includes('mobile') || methodContext.includes('wallet') || methodContext.includes('momo') || methodContext.includes('wave')) {
      return {
        label: 'Numéro Mobile Money',
        placeholder: 'Ex: +229 91 50 57 57',
        helper: 'Utilisez le numéro associé à votre compte Mobile Money.',
        required: true,
        type: 'tel' as const
      }
    }

    if (methodContext.includes('carte') || methodContext.includes('card')) {
      return {
        label: 'Référence carte / 4 derniers chiffres',
        placeholder: 'Ex: **** **** **** 1234',
        helper: 'Ajoutez une référence pour identifier la carte ou le compte carte.',
        required: true,
        type: 'text' as const
      }
    }

    if (methodContext.includes('banque') || methodContext.includes('bank') || methodContext.includes('rib') || methodContext.includes('iban') || methodContext.includes('compte')) {
      return {
        label: 'RIB / IBAN ou numéro de compte',
        placeholder: 'Ex: BJ12 3456 7890 1234 5678 90',
        helper: 'Renseignez l’identifiant du compte bancaire à créditer.',
        required: true,
        type: 'text' as const
      }
    }

    return {
      label: 'Référence (optionnelle)',
      placeholder: 'Ex: identifiant à associer',
      helper: '',
      required: false,
      type: 'text' as const
    }
  }, [selectedWithdrawalMethodDetails])

  useEffect(() => {
    setWithdrawalIdentifier('')
  }, [selectedWithdrawalMethod])

  const withdrawalAmountValue = useMemo(() => {
    const sanitized = sanitizeNumericInput(withdrawalAmountInput).replace(',', '.')
    return Number(sanitized) || 0
  }, [withdrawalAmountInput, sanitizeNumericInput])

  const withdrawalFee = useMemo(() => 0, [])
  const withdrawalTotal = useMemo(() => Number(withdrawalAmountValue.toFixed(2)), [withdrawalAmountValue])
  const withdrawalPayout = useMemo(() => Number((withdrawalAmountValue * withdrawalValue).toFixed(2)), [withdrawalAmountValue, withdrawalValue])

  const withdrawalLimitMessage = useMemo(() => {
    if (!pointsConfigurationState || withdrawalAmountValue <= 0) {
      return null
    }

    const globalLimits = pointsConfigurationState.limits.withdrawal
    if (globalLimits.min !== null && globalLimits.min !== undefined && withdrawalAmountValue < globalLimits.min) {
      return `Nombre de points minimum à retirer : ${formatPointsValue(globalLimits.min)}`
    }

    if (globalLimits.max !== null && globalLimits.max !== undefined && withdrawalAmountValue > globalLimits.max) {
      return `Nombre de points maximum à retirer : ${formatPointsValue(globalLimits.max)}`
    }

    const availableBalance = pointsSummary?.balance ?? 0
    if (withdrawalTotal > availableBalance) {
      return 'Solde insuffisant pour couvrir le retrait et les frais'
    }

    return null
  }, [pointsConfigurationState, withdrawalAmountValue, withdrawalTotal, pointsSummary, formatPointsValue])

  const handleOpenWithdrawalModal = useCallback(() => {
    if (isPointsFrozen) {
      toast({
        title: 'Compte gelé',
        description: pointsFrozenMessage ?? 'Compte gelé : opérations de points désactivées',
        variant: 'destructive'
      })
      return
    }

    if (pointsConfigurationState?.settings.withdrawalEnabled === false) {
      toast({
        title: 'Retrait indisponible',
        description: 'La fonctionnalité de retrait est momentanément désactivée.',
        variant: 'destructive'
      })
      return
    }

    setWithdrawalError(null)
    setShowWithdrawalModal(true)
  }, [isPointsFrozen, pointsFrozenMessage, pointsConfigurationState?.settings.withdrawalEnabled, toast])

  const handleOpenTransferModal = useCallback(() => {
    if (isPointsFrozen) {
      toast({
        title: 'Compte gelé',
        description: pointsFrozenMessage ?? 'Compte gelé : opérations de points désactivées',
        variant: 'destructive'
      })
      return
    }

    if (pointsConfigurationState?.settings.transferEnabled === false) {
      toast({
        title: 'Transfert indisponible',
        description: 'La fonctionnalité de transfert est momentanément désactivée.',
        variant: 'destructive'
      })
      return
    }

    setTransferError(null)
    setTransferRecipientQuery('')
    setTransferRecipientResults([])
    setTransferSelectedRecipient(null)
    setTransferAmountInput('')
    setShowTransferPointsModal(true)
  }, [isPointsFrozen, pointsFrozenMessage, pointsConfigurationState?.settings.transferEnabled, toast])

  const handleOpenExchangeModal = useCallback(() => {
    if (isPointsFrozen) {
      toast({
        title: 'Compte gelé',
        description: pointsFrozenMessage ?? 'Compte gelé : opérations de points désactivées',
        variant: 'destructive'
      })
      return
    }

    if (!pointsConfigurationState) {
      toast({
        title: 'Configuration en cours',
        description: 'Les informations de points se chargent toujours, le contenu peut être incomplet.',
        variant: 'destructive'
      })
    }

    if (pointsConfigurationState?.settings.exchangeEnabled === false) {
      toast({
        title: "Échange indisponible",
        description: "La fonctionnalité d’échange est momentanément désactivée.",
        variant: 'destructive'
      })
      return
    }

    const rates = pointsConfigurationState?.exchangeRates ?? []
    const hasRates = rates.length > 0

    const defaultOption: ExchangeOptionKey = hasRates ? 'currency' : 'gift'
    setSelectedExchangeOption(defaultOption)

    const defaultCurrencyCode =
      exchangeCurrency ||
      rates.find(rate => rate.isDefault)?.currency ||
      pointsConfigurationState?.settings?.defaultCurrency ||
      rates[0]?.currency ||
      ''

    setExchangeError(null)
    setExchangeAmountInput('')
    setExchangeCurrency(defaultCurrencyCode)

    const availableRewards = exchangeRewardOptions[0] ?? null
    setSelectedRewardId(availableRewards ? availableRewards.id : '')

    setShowExchangePointsModal(true)
  }, [isPointsFrozen, pointsFrozenMessage, pointsConfigurationState, exchangeCurrency, exchangeRewardOptions, toast])

  const handleSelectRecipient = useCallback((recipient: TransferRecipient) => {
    const displayName = getRecipientDisplayName(recipient)
    setTransferSelectedRecipient(recipient)
    setTransferRecipientQuery(displayName)
    setTransferRecipientResults([])
  }, [getRecipientDisplayName])

  const handleTransferPointsSubmit = useCallback(async () => {
    if (!user?.id) {
      setTransferError("Utilisateur non authentifié")
      return
    }

    if (!transferSelectedRecipient) {
      setTransferError('Sélectionnez un destinataire valide dans la liste proposée')
      return
    }

    if (transferLimitMessage) {
      setTransferError(transferLimitMessage)
      return
    }

    if (transferAmountValue <= 0) {
      setTransferError('Veuillez saisir un montant valide')
      return
    }

    try {
      setTransferProcessing(true)
      setTransferError(null)

      await ClientPointsService.transferPoints(user.id, transferSelectedRecipient.id, transferAmountValue)

      toast({
        title: 'Transfert effectué',
        description: `${formatPointsValue(transferAmountValue)} envoyés à ${getRecipientDisplayName(transferSelectedRecipient)}`,
        variant: 'default'
      })

      addNotification({
        type: 'success',
        title: 'Transfert effectué',
        message: `${formatPointsValue(transferAmountValue)} envoyés à ${getRecipientDisplayName(transferSelectedRecipient)}`
      })

      setShowTransferPointsModal(false)
      setTransferRecipientQuery('')
      setTransferRecipientResults([])
      setTransferSelectedRecipient(null)
      setTransferAmountInput('')

      await handleRefreshDashboard()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors du transfert de points'
      setTransferError(message)
      toast({
        title: 'Transfert impossible',
        description: message,
        variant: 'destructive'
      })

      addNotification({
        type: 'error',
        title: 'Transfert impossible',
        message
      })
    } finally {
      setTransferProcessing(false)
    }
  }, [user?.id, transferSelectedRecipient, transferAmountValue, transferLimitMessage, formatPointsValue, getRecipientDisplayName, handleRefreshDashboard, refreshPointsData, toast, addNotification])

  const handleExchangePointsSubmit = useCallback(async () => {
    if (!user?.id) {
      setExchangeError("Utilisateur non authentifié")
      return
    }

    if (exchangeLimitMessage) {
      setExchangeError(exchangeLimitMessage)
      return
    }

    if (exchangeAmountValue <= 0) {
      setExchangeError('Veuillez saisir un montant valide')
      return
    }

    try {
      setExchangeProcessing(true)
      setExchangeError(null)

      if (selectedExchangeOption === 'currency') {
        if (!selectedExchangeRate) {
          setExchangeError('Aucun taux de change disponible pour cette devise')
          setExchangeProcessing(false)
          return
        }

        await ClientPointsService.exchangePoints(
          user.id,
          POINTS_BASE_CURRENCY,
          selectedExchangeRate.currency,
          exchangeAmountValue
        )

        toast({
          title: 'Échange réalisé',
          description: `${formatPointsValue(exchangeAmountValue)} convertis en ${selectedExchangeRate.currency} (${formatCurrencyValue(exchangeConvertedAmount, selectedExchangeRate.currency)})`,
          variant: 'default'
        })

        addNotification({
          type: 'success',
          title: 'Échange réalisé',
          message: `${formatPointsValue(exchangeAmountValue)} convertis en ${selectedExchangeRate.currency} (${formatCurrencyValue(exchangeConvertedAmount, selectedExchangeRate.currency)})`
        })
      } else {
        if (!selectedReward) {
          setExchangeError('Veuillez sélectionner une récompense valable')
          setExchangeProcessing(false)
          return
        }

        await ClientPointsService.redeemRewardWithPoints(user.id, selectedReward.id, exchangeAmountValue)

        toast({
          title: 'Récompense obtenue',
          description: `${formatPointsValue(exchangeAmountValue)} échangés pour ${selectedReward.name}`,
          variant: 'default'
        })

        addNotification({
          type: 'success',
          title: 'Récompense obtenue',
          message: `${formatPointsValue(exchangeAmountValue)} échangés pour ${selectedReward.name}`
        })
      }

      setShowExchangePointsModal(false)
      setSelectedExchangeOption('currency')
      setExchangeAmountInput('')
      setSelectedRewardId('')

      await handleRefreshDashboard()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur lors de l'échange"
      setExchangeError(message)
      toast({
        title: 'Échange impossible',
        description: message,
        variant: 'destructive'
      })

      addNotification({
        type: 'error',
        title: 'Échange impossible',
        message
      })
    } finally {
      setExchangeProcessing(false)
    }
  }, [
    user?.id,
    selectedExchangeOption,
    selectedExchangeRate,
    selectedReward,
    exchangeLimitMessage,
    exchangeAmountValue,
    exchangeConvertedAmount,
    formatPointsValue,
    formatCurrencyValue,
    handleRefreshDashboard,
    refreshPointsData,
    toast,
    addNotification
  ])

  const handleWithdrawalSubmit = useCallback(async () => {
    if (!user?.id) {
      setWithdrawalError("Utilisateur non authentifié")
      return
    }

    if (!selectedWithdrawalMethodDetails) {
      setWithdrawalError('Veuillez sélectionner une méthode de retrait')
      return
    }

    if (withdrawalLimitMessage) {
      setWithdrawalError(withdrawalLimitMessage)
      return
    }

    if (withdrawalAmountValue <= 0) {
      setWithdrawalError('Veuillez saisir un montant valide')
      return
    }

    const identifierValue = withdrawalIdentifier.trim()

    if (withdrawalIdentifierConfig.required && identifierValue.length === 0) {
      setWithdrawalError(`Veuillez renseigner ${withdrawalIdentifierConfig.label.toLowerCase()}`)
      return
    }

    try {
      setWithdrawalProcessing(true)
      setWithdrawalError(null)

      const metadata: Record<string, unknown> = {
        methodId: selectedWithdrawalMethodDetails.id,
        methodName: selectedWithdrawalMethodDetails.name,
        identifierLabel: withdrawalIdentifierConfig.label
      }

      if (identifierValue.length > 0) {
        metadata.identifier = identifierValue
      }

      await ClientPointsService.requestWithdrawal(user.id, withdrawalAmountValue, selectedWithdrawalMethodDetails.id ?? selectedWithdrawalMethodDetails.name, metadata)

      toast({
        title: 'Demande envoyée',
        description: `${formatPointsValue(withdrawalAmountValue)} via ${selectedWithdrawalMethodDetails.name}${selectedMethodLimit?.processingTime ? ` • ${selectedMethodLimit.processingTime}` : ''}`,
        variant: 'default'
      })

      addNotification({
        type: 'success',
        title: 'Demande de retrait envoyée',
        message: `${formatPointsValue(withdrawalAmountValue)} via ${selectedWithdrawalMethodDetails.name}${selectedMethodLimit?.processingTime ? ` • ${selectedMethodLimit.processingTime}` : ''}`
      })

      setShowWithdrawalModal(false)
      setWithdrawalAmountInput('')
      setWithdrawalIdentifier('')
      if (selectedWithdrawalMethodDetails) {
        setSelectedWithdrawalMethod(selectedWithdrawalMethodDetails.id ?? selectedWithdrawalMethodDetails.name)
      }

      await handleRefreshDashboard()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la demande de retrait'
      setWithdrawalError(message)
      toast({
        title: 'Retrait impossible',
        description: message,
        variant: 'destructive'
      })

      addNotification({
        type: 'error',
        title: 'Retrait impossible',
        message
      })
    } finally {
      setWithdrawalProcessing(false)
    }
  }, [
    user?.id,
    selectedWithdrawalMethodDetails,
    withdrawalLimitMessage,
    withdrawalAmountValue,
    withdrawalIdentifier,
    withdrawalIdentifierConfig,
    formatPointsValue,
    handleRefreshDashboard,
    refreshPointsData,
    toast
  ])

  // Gestionnaire pour fermer le menu des notifications
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.notifications-dropdown')) {
        setShowNotificationsDropdown(false)
      }
    }

    if (showNotificationsDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showNotificationsDropdown])

  // Affichage du chargement
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-[#535455] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-[#ff6600] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white text-lg">Chargement de votre tableau de bord...</p>
        </div>
      </div>
    )
  }

  // Affichage des erreurs
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-[#535455] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-400 mb-2">❌ Erreur de chargement</h2>
            <p className="text-red-300 mb-4">{error}</p>
            <Button 
              onClick={handleRefreshDashboard}
              className="bg-[#ff6600] hover:bg-[#ff8533] text-white"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </div>
        </div>
      </div>
    )
  }



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'shipped': return 'bg-blue-100 text-blue-800'
      case 'confirmed': return 'bg-yellow-100 text-yellow-800'
      case 'pending': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="h-4 w-4" />
      case 'shipped': return <Truck className="h-4 w-4" />
      case 'confirmed': return <Clock className="h-4 w-4" />
      case 'pending': return <AlertCircle className="h-4 w-4" />
      case 'cancelled': return <XCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const formatCurrency = (amount: number) => {
    return formatMoney(amount)
  }

  const formatAiPromotionText = (value: unknown) => {
    const raw = typeof value === 'string' ? value : String(value ?? '')
    const trimmed = raw.trim()
    if (!trimmed) return ''

    // Nettoie les clés encodées du type `promotion:<uuid> || ...` qui polluent parfois l'affichage.
    const extractedIds = Array.from(new Set(trimmed.match(/promotion:[a-z0-9-]+/gi) ?? []))
    const withoutIds = trimmed
      .replace(/promotion:[a-z0-9-]+/gi, '')
      .replace(/\s*\|\|\s*/g, ' • ')
      .replace(/\s+/g, ' ')
      .replace(/^[•\-\s]+|[•\-\s]+$/g, '')
      .trim()

    const cleaned = withoutIds || (extractedIds.length > 0 ? `Promotion recommandée (${extractedIds.length})` : '')
    if (!cleaned) return ''
    return cleaned.length > 160 ? `${cleaned.slice(0, 157)}...` : cleaned
  }

  const getAiPromotionReasons = (value: unknown): string[] => {
    const raw = typeof value === 'string' ? value : String(value ?? '')
    const trimmed = raw.trim()
    if (!trimmed) return []

    const withoutIds = trimmed.replace(/promotion:[a-z0-9-]+/gi, ' ')

    const parts = withoutIds
      .split(/\r?\n|\|\||\|/g)
      .map((part) =>
        part
          .replace(/\s+/g, ' ')
          .replace(/^[•\-\s]+|[•\-\s]+$/g, '')
          .trim()
      )
      .filter(Boolean)

    const unique: string[] = []
    const seen = new Set<string>()
    for (const part of parts) {
      const key = part.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      unique.push(part.length > 140 ? `${part.slice(0, 137)}...` : part)
    }
    return unique
  }

  // Fonction pour afficher les valeurs en points et en F CFA
  const formatValueWithPoints = (amount: number, showPoints: boolean = true) => {
    const currencyValue = formatCurrency(amount)
    
    // purchaseValue est le taux réel configuré par le super-admin (FCFA par point)
    // computedPoints = prix / purchaseValue
    const pointsValue = purchaseValue > 0 ? Math.round(amount / purchaseValue) : 0
    
    if (showPoints) {
      return (
        <div className="flex flex-col">
          <span className="font-bold">{currencyValue}</span>
          <span className="text-xs text-orange-600 font-medium">{pointsValue} points</span>
        </div>
      )
    }
    return currencyValue
  }

  const setPromotionAlert = (promotionId: string) => {
    setPromotionAlerts(prev => 
      prev.includes(promotionId) 
        ? prev.filter(id => id !== promotionId)
        : [...prev, promotionId]
    )
    
    const hasAlert = promotionAlerts.includes(promotionId)
    toast({
      title: hasAlert ? "Alerte désactivée" : "Alerte activée",
      description: hasAlert 
        ? "Vous ne recevrez plus de notifications pour cette promotion" 
        : "Vous recevrez des notifications pour cette promotion",
      variant: "default",
    })
  }

  // Fonctions pour les produits
  const addProductToCart = (product: any) => {
    // Vérifier si le produit est déjà dans le panier
    if (productCart.some(item => item.id === product.id)) {
      toast({
        title: "Produit déjà dans le panier",
        description: "Ce produit est déjà présent dans votre panier",
        variant: "destructive",
      })
      return
    }

    // Ajouter au panier
    const cartItem = {
      ...product,
      quantity: 1,
      addedAt: new Date()
    }
    setProductCart(prev => [...prev, cartItem])

    // Afficher la modal de confirmation
    setSelectedProduct(product)
    setShowProductAddedModal(true)

    toast({
      title: "Produit ajouté au panier !",
      description: `${product.name} a été ajouté à votre panier`,
      variant: "default",
    })
  }

  const addProductToCartWithPromotion = (product: any, promotion?: Promotion) => {
    // Vérifier si le produit est déjà dans le panier
    if (productCart.some(item => item.id === product.id)) {
      toast({
        title: "Produit déjà dans le panier",
        description: "Ce produit est déjà présent dans votre panier",
        variant: "destructive",
      })
      return
    }

    // Ajouter au panier avec la promotion active
    const cartItem = {
      ...product,
      quantity: 1,
      addedAt: new Date(),
      activePromotion: promotion ? {
        id: promotion.id,
        title: promotion.title,
        value: promotion.value,
        type: promotion.type
      } : null
    }
    setProductCart(prev => [...prev, cartItem])

    // Afficher la modal de confirmation
    setSelectedProduct(product)
    setShowProductAddedModal(true)

    toast({
      title: "Produit ajouté avec promotion !",
      description: `${product.name} a été ajouté à votre panier avec la promotion ${promotion?.title || 'active'}`,
      variant: "default",
    })
  }

  const toggleProductFavorite = (productId: string | number) => {
    const productIdStr = productId.toString()
    const isFavorite = productFavorites.includes(productIdStr)
    toast({
      title: isFavorite ? "Retiré des favoris" : "Ajouté aux favoris",
      description: isFavorite
        ? "Produit retiré de vos favoris"
        : "Produit ajouté à vos favoris",
      variant: "default",
    })

    setProductFavorites(prev =>
      prev.includes(productIdStr)
        ? prev.filter(id => id !== productIdStr)
        : [...prev, productIdStr]
    )

    // Persistance Supabase (table user_wishlists)
    if (user?.id) {
      void DashboardService.setProductWishlist(user.id, productIdStr, !isFavorite)
    }
  }

  const shareProduct = (item: any) => {
    setSelectedItemForShare(item)
    setShowShareMenu(true)
  }

  const executeShare = (platform: string, item: any) => {
    // Déterminer si c'est un produit ou une promotion
    const isProduct = item.hasOwnProperty('name') && item.hasOwnProperty('category')
    const isPromotion = item.hasOwnProperty('title') && item.hasOwnProperty('code')
    
    let itemUrl = ""
    let message = ""
    let shareRecord = null
    
    if (isProduct) {
      // C'est un produit
      itemUrl = `${window.location.origin}/product/${item.id}`
      message = `Découvrez ce produit incroyable : ${item.name}`
      
      shareRecord = {
        id: Date.now().toString(),
        productId: item.id,
        productName: item.name,
        platform,
        sharedAt: new Date()
      }
    } else if (isPromotion) {
      // C'est une promotion
      itemUrl = `${window.location.origin}/promotions/${item.id}`
      message = `Promotion exceptionnelle : ${item.title} - ${item.description}`
      
      shareRecord = {
        id: Date.now().toString(),
        promotionId: item.id,
        promotionTitle: item.title,
        platform,
        sharedAt: new Date()
      }
    }
    
    let shareUrl = ""
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(itemUrl)}&quote=${encodeURIComponent(message)}`
        break
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(itemUrl)}&text=${encodeURIComponent(message)}`
        break
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(message + ' ' + itemUrl)}`
        break
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(itemUrl)}&text=${encodeURIComponent(message)}`
        break
      case 'email':
        const subject = isProduct ? 'Produit recommandé' : 'Promotion exceptionnelle'
        shareUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message + '\n\n' + itemUrl)}`
        break
      case 'copy':
        navigator.clipboard.writeText(itemUrl)
        toast({
          title: "Lien copié !",
          description: `Le lien ${isProduct ? 'du produit' : 'de la promotion'} a été copié`,
          variant: "default",
        })
        setShowShareMenu(false)
        return
      default:
        break
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400')
      
      // Enregistrer le partage
      if (shareRecord) {
        if (isProduct) {
          setProductShareHistory(prev => [shareRecord, ...prev])
        } else {
          // Ajouter l'historique des partages de promotions si l'état existe
          // setPromotionShareHistory(prev => [shareRecord, ...prev])
        }
      }
      
      toast({
        title: "Partage réussi !",
        description: `${isProduct ? 'Produit' : 'Promotion'} partagé sur ${platform}`,
        variant: "default",
      })
    }
    
    setShowShareMenu(false)
  }

  // Fonctions pour les vendeurs
  const contactSeller = (seller: any) => {
    // Ouvrir le chat avec le vendeur
    setActiveTab('chat')
    
    // Enregistrer le contact
    const contactRecord = {
      id: Date.now().toString(),
      sellerId: seller.id,
      sellerName: seller.name,
      contactedAt: new Date()
    }
    setSellerChatHistory(prev => [contactRecord, ...prev])
    
    // Fermer la modal si elle est ouverte
    setShowSellerDetailsModal(false)
    
    toast({
      title: "Chat ouvert !",
      description: `Ouverture du chat avec ${seller.name}`,
      variant: "default",
    })
  }

  const toggleSellerFollow = (sellerId: string) => {
    const isFollowing = sellerFollowStatus[sellerId]
    setSellerFollowStatus(prev => ({
      ...prev,
      [sellerId]: !prev[sellerId]
    }))

    // Persistance Supabase (table activity_logs)
    if (user?.id) {
      void DashboardService.setUserInteraction(user.id, 'seller_follow', 'seller', sellerId, !isFollowing)
    }

    toast({
      title: isFollowing ? "Ne suit plus" : "Suit maintenant",
      description: isFollowing 
        ? "Vous ne suivez plus ce vendeur" 
        : "Vous suivez maintenant ce vendeur",
      variant: "default",
    })
  }

  const viewSellerProfile = (seller: any) => {
    toast({
      title: "Redirection...",
      description: "Ouverture du profil complet du vendeur",
      variant: "default",
    })
    
    setTimeout(() => {
      window.open(`/seller/${seller.id}`, '_blank')
    }, 1000)
  }

  const formatDate = (dateString: string | null | undefined, options?: Intl.DateTimeFormatOptions) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) {
      return ''
    }

    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }

    return date.toLocaleDateString('fr-FR', { ...defaultOptions, ...options })
  }

  // Fonctions pour les promotions
  const applyPromotion = (promotion: any) => {
    const promotionConditions = Array.isArray(promotion?.conditions) ? promotion.conditions : []

    // Vérifier si la promotion est déjà appliquée
    if (appliedPromotions.includes(promotion.id)) {
      toast({
        title: "Promotion déjà appliquée",
        description: "Cette promotion est déjà active sur votre compte",
        variant: "destructive",
      })
      return
    }

    // Vérifier si la promotion est active
    if (promotion?.isActive === false) {
      toast({
        title: "Promotion expirée",
        description: "Cette promotion n'est plus disponible",
        variant: "destructive",
      })
      return
    }

    // Vérifier les conditions
    if (promotionConditions.length > 0) {
      const conditionsMet = promotionConditions.every((condition: string) => {
        // Logique de vérification des conditions
        if (condition.includes("minimum")) {
          const minAmount = parseInt(condition.match(/\d+/)?.[0] || "0")
          return userPoints >= minAmount
        }
        if (condition.includes("catégorie")) {
          return true // Pour l'instant, on accepte toutes les catégories
        }
        return true
      })

      if (!conditionsMet) {
        toast({
          title: "Conditions non remplies",
          description: "Vous ne remplissez pas toutes les conditions pour cette promotion",
          variant: "destructive",
        })
        return
      }
    }

    // Appliquer la promotion
    setAppliedPromotions(prev => [...prev, promotion.id])
    setPromotionUsage(prev => ({
      ...prev,
      [promotion.id]: (prev[promotion.id] || 0) + 1
    }))

    // Persistance Supabase (table activity_logs)
    if (user?.id) {
      void DashboardService.setUserInteraction(user.id, 'promotion_applied', 'promotion', promotion.id, true)
    }

    // Ajouter à l'historique
    const promotionRecord = {
      id: promotion.id,
      title: promotion.title,
      appliedAt: new Date(),
      value: promotion.value,
      type: promotion.type
    }
    setPromotionHistory(prev => [promotionRecord, ...prev])

    // Afficher la modal de succès
    setSelectedPromotion(promotion)
    setShowPromotionSuccessModal(true)

    toast({
      title: "Promotion appliquée avec succès !",
      description: `${promotion.title} est maintenant active sur votre compte`,
      variant: "default",
    })
  }

  const copyPromotionCode = (promotion: Promotion) => {
    const code = promotion.id
    navigator.clipboard.writeText(code)
    toast({
      title: "Code copié !",
      description: `Le code ${code} a été copié dans votre presse-papiers`,
      variant: "default",
    })
  }

  const sharePromotion = (promotion: any) => {
    setSelectedItemForShare(promotion)
    setShowShareMenu(true)
  }

  // Fonction pour exporter les promotions
  const exportPromotions = () => {
    const csvContent = [
      ['Titre', 'Type', 'Valeur', 'Début', 'Fin', 'Utilisations', 'Statut', 'Priorité'],
              ...realPromotions.map((promotion: any) => [
        promotion.title,
        promotion.type,
        promotion.value,
        formatDate(promotion.startDate),
        formatDate(promotion.endDate),
        promotion.usageCount.toString(),
        promotion.isActive ? 'Active' : 'Expirée',
        promotion.priority.toString()
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `Promotions-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Export réussi !",
      description: "Vos promotions ont été exportées en CSV",
      variant: "default",
    })
  }

  // Fonction pour ouvrir l'historique des promotions
  const openPromotionHistory = () => {
    // Ouvrir la modale d'historique des promotions
    setShowPromotionHistoryModal(true)
    toast({
      title: "Historique des promotions !",
      description: "Ouverture de l'historique des promotions",
      variant: "default",
    })
  }

  // Fonction pour activer les alertes de promotion
  const togglePromotionAlerts = (promotionTitle: string) => {
    const hasAlert = promotionAlerts.includes(promotionTitle)

    // Persistance Supabase (table activity_logs)
    if (user?.id && promotionTitle) {
      void DashboardService.setUserInteraction(user.id, 'promotion_alert', 'promotion', promotionTitle, !hasAlert)
    }

    if (hasAlert) {
      setPromotionAlerts(prev => prev.filter(title => title !== promotionTitle))
      toast({
        title: "Alertes désactivées !",
        description: "Vous ne recevrez plus d'alertes pour cette promotion",
        variant: "default",
      })
    } else {
      setPromotionAlerts(prev => [...prev, promotionTitle])
      toast({
        title: "Alertes activées !",
        description: "Vous recevrez des notifications pour cette promotion",
        variant: "default",
      })
    }
  }

  // Fonction pour rediriger vers la boutique avec promotion active
  const navigateToShopWithPromotion = (promotionTitle: string) => {
    toast({
      title: "Navigation !",
      description: "Redirection vers la boutique avec promotion active",
      variant: "default",
    })
    
    // Rediriger vers la page des produits avec la promotion active
    if (typeof window !== 'undefined') {
      const promotionParam = encodeURIComponent(promotionTitle.toLowerCase().replace(/\s+/g, '-'))
      window.location.href = `/products?promotion=${promotionParam}&special=true`
    }
  }

  // Fonction pour partager une promotion spéciale
  const shareSpecialPromotion = (promotion: any) => {
    const message = `Promotion exceptionnelle : ${promotion.title} - ${promotion.description}`
    const url = `${window.location.origin}/promotions/${promotion.title.toLowerCase().replace(/\s+/g, '-')}`
    
    // Ouvrir le menu de partage avec la promotion spéciale
    setSelectedItemForShare({
      ...promotion,
      id: promotion.title.toLowerCase().replace(/\s+/g, '-'),
      name: promotion.title,
      category: 'promotion-speciale'
    })
    setShowShareMenu(true)
  }



  const togglePromotionFavorite = (promotionId: string) => {
    const isFavorite = promotionFavorites.includes(promotionId)
    setPromotionFavorites(prev =>
      prev.includes(promotionId)
        ? prev.filter(id => id !== promotionId)
        : [...prev, promotionId]
    )

    // Persistance Supabase (table activity_logs)
    if (user?.id) {
      void DashboardService.setUserInteraction(user.id, 'promotion_favorite', 'promotion', promotionId, !isFavorite)
    }

    toast({
      title: isFavorite ? "Retiré des favoris" : "Ajouté aux favoris",
      description: isFavorite
        ? "Promotion retirée de vos favoris"
        : "Promotion ajoutée à vos favoris",
      variant: "default",
    })
  }

  // Fonction pour générer et télécharger l'historique des transactions en CSV
  const generateAndDownloadTransactionsCSV = () => {
    try {
      const csvContent = [
        ['ID', 'Type', 'Montant (points)', 'Description', 'Date', 'Solde après transaction'],
        ...(dashboardData?.pointsHistory ?? []).map(transaction => [
          transaction.id,
          transaction.type === 'earned' ? 'Gagné' : transaction.type === 'used' ? 'Utilisé' : 'Retiré',
          transaction.amount > 0 ? `+${transaction.amount}` : transaction.amount.toString(),
          transaction.description,
          formatDate(transaction.date),
          transaction.balance.toLocaleString()
        ])
      ]
        .map(row => row.join(','))
        .join('\n')

      // Créer un blob avec le contenu CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      
      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Historique-Transactions-${new Date().toISOString().split('T')[0]}.csv`
      
      // Déclencher le téléchargement
      document.body.appendChild(link)
      link.click()
      
      // Nettoyer
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      // Notification de succès
      toast({
        title: "Historique exporté !",
        description: "L'historique des transactions a été téléchargé en CSV",
        variant: "default",
      })
      
    } catch (error) {
      // Notification d'erreur
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter l'historique. Veuillez réessayer.",
        variant: "destructive",
      })
    }
  }

  // Fonction pour traiter le paiement
  const processPayment = async () => {
    if (!selectedPointsOffer) return
    
    setIsProcessingPayment(true)
    setPaymentStep('processing')
    
    try {
      // Flux réel: initialize -> verify -> purchase
      const totalPoints = Number(selectedPointsOffer.points ?? 0) + Number(selectedPointsOffer.bonus ?? 0)
      const offerPrice = Number(selectedPointsOffer.price ?? 0)
      const feePercent = purchaseFeePercent || 0
      const totalToPay = Number((offerPrice + (offerPrice * feePercent) / 100).toFixed(2))

      if (!Number.isFinite(totalPoints) || totalPoints <= 0) {
        throw new Error('Nombre de points invalide')
      }

      if (!Number.isFinite(totalToPay) || totalToPay <= 0) {
        throw new Error('Montant à payer invalide')
      }

      const safeJson = async (response: Response) => {
        const text = await response.text().catch(() => '')
        if (!text) return {} as any
        try {
          return JSON.parse(text) as any
        } catch {
          return {} as any
        }
      }

      // Initialiser la transaction FeexPay
      const initRes = await fetch('/api/client/payments/feexpay/initialize', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          amount: totalToPay,
          currency: 'XOF',
          method: selectedPaymentMethod === 'mobile-money' ? 'mobile_money' : selectedPaymentMethod === 'card' ? 'card' : 'bank_transfer',
          customerPhone: selectedPaymentMethod === 'mobile-money' ? paymentDetails.phoneNumber : null,
          customerEmail: (user as any)?.email ?? null,
          description: `Achat de points (${totalPoints} pts)`,
          metadata: {
            purchaseType: 'points',
            points: totalPoints,
            offer: {
              points: selectedPointsOffer.points,
              bonus: selectedPointsOffer.bonus,
              price: selectedPointsOffer.price,
              feePercent: purchaseFeePercent,
              totalToPay
            }
          }
        })
      })

      const initJson = await safeJson(initRes)
      if (!initRes.ok) {
        throw new Error(String(initJson?.error ?? 'Impossible d’initier le paiement FeexPay.'))
      }

      const reference = String(initJson?.reference ?? '').trim()
      const paymentUrl = typeof initJson?.paymentUrl === 'string' ? initJson.paymentUrl.trim() : ''

      if (!reference) {
        throw new Error('Référence FeexPay manquante.')
      }

      if (paymentUrl) {
        try {
          window.open(paymentUrl, '_blank', 'noopener,noreferrer')
        } catch {
          // ignore
        }
      }

      // Vérifier le paiement (polling simple)
      const verifyOnce = async () => {
        const verifyRes = await fetch('/api/client/payments/feexpay/verify', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ reference })
        })
        const verifyJson = await safeJson(verifyRes)
        if (!verifyRes.ok) {
          throw new Error(String(verifyJson?.error ?? 'Impossible de vérifier le paiement.'))
        }
        return {
          paid: Boolean(verifyJson?.paid),
          status: String(verifyJson?.status ?? '').trim()
        }
      }

      let verification = await verifyOnce()
      if (!verification.paid) {
        const startedAt = Date.now()
        const timeoutMs = 60_000
        while (!verification.paid && Date.now() - startedAt < timeoutMs) {
          await new Promise((resolve) => setTimeout(resolve, 3000))
          verification = await verifyOnce()
          if (verification.status.toUpperCase() === 'FAILED') {
            break
          }
        }
      }

      if (!verification.paid) {
        throw new Error('Paiement non confirmé. Si vous avez payé, patientez un instant puis réessayez.')
      }

      // Finaliser le crédit des points côté serveur (idempotent)
      const purchaseRes = await fetch('/api/client/points/purchase', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          reference,
          points: totalPoints,
          amountPaid: totalToPay,
          currency: 'XOF'
        })
      })
      const purchaseJson = await safeJson(purchaseRes)
      if (!purchaseRes.ok) {
        throw new Error(String(purchaseJson?.error ?? 'Impossible de finaliser l’achat de points.'))
      }

      setPaymentStep('success')

      toast({
        title: 'Paiement réussi !',
        description: `${totalPoints.toLocaleString()} points ont été ajoutés à votre compte`,
        variant: 'default'
      })

      addNotification({
        type: 'success',
        title: 'Achat de points confirmé',
        message: `${totalPoints.toLocaleString()} points ont été ajoutés à votre compte`
      })

      try {
        await handleRefreshDashboard()
      } catch {
        // ignore
      }

      setTimeout(() => {
        setShowPointsPurchaseModal(false)
        setPaymentStep('selection')
        setIsProcessingPayment(false)
      }, 1200)
    } catch (error) {
      console.error('Erreur lors du paiement:', error)
      setPaymentStep('error')
      
      toast({
        title: "Échec du paiement",
        description: error instanceof Error ? error.message : "Une erreur s'est produite. Veuillez réessayer.",
        variant: "destructive",
      })

      addNotification({
        type: 'error',
        title: 'Paiement refusé',
        message: error instanceof Error ? error.message : "Une erreur s'est produite. Veuillez réessayer."
      })
      
      setIsProcessingPayment(false)
    }
  }

  // Fonction pour valider les détails de paiement
  const validatePaymentDetails = () => {
    switch (selectedPaymentMethod) {
      case 'mobile-money':
        return paymentDetails.phoneNumber.length >= 8
      case 'bank-transfer':
        return paymentDetails.bankAccount.length >= 10 && paymentDetails.accountName.length >= 3
      case 'card':
        return paymentDetails.cardNumber.length >= 16 && 
               paymentDetails.cardExpiry.length === 5 && 
               paymentDetails.cardCvv.length >= 3
      default:
        return false
    }
  }

  // Fonction pour réinitialiser le processus de paiement
  const resetPaymentProcess = () => {
    setPaymentStep('selection')
    setIsProcessingPayment(false)
    setPaymentDetails({
      phoneNumber: '',
      cardNumber: '',
      cardExpiry: '',
      cardCvv: '',
      bankAccount: '',
      accountName: ''
    })
  }

  // Fonction pour générer et télécharger un rapport spécifique à un produit
  const generateProductSpecificReport = (product: any) => {
    try {
      // Créer le contenu du rapport spécifique
      const reportContent = `
RAPPORT PRODUIT SPÉCIFIQUE - PRO BOOSTER
=========================================

PRODUIT: ${product.productName}
Date de génération: ${new Date().toLocaleDateString('fr-FR')}
Date de partage: ${formatDate(product.sharedAt)}

STATISTIQUES GLOBALES:
- Total partages: ${product.totalShares}
- Points gagnés: ${product.pointsEarned}
- Points utilisés: ${product.pointsUsed}
- Points retirés: ${product.pointsWithdrawn}
- Points disponibles: ${product.pointsAvailable}

RÉPARTITION PAR RÉSEAU SOCIAL:
- Facebook: ${product.shares.facebook} partages (${Math.round((product.shares.facebook / product.totalShares) * 100)}%)
- WhatsApp: ${product.shares.whatsapp} partages (${Math.round((product.shares.whatsapp / product.totalShares) * 100)}%)
- Twitter/X: ${product.shares.twitter} partages (${Math.round((product.shares.twitter / product.totalShares) * 100)}%)
- Instagram: ${product.shares.instagram} partages (${Math.round((product.shares.instagram / product.totalShares) * 100)}%)

ANALYSE DE PERFORMANCE:
- Réseau le plus performant: ${Object.entries(product.shares).reduce((a, b) => product.shares[a[0]] > product.shares[b[0]] ? a : b)[0]}
- Taux de conversion moyen: ${Math.round((product.pointsEarned / product.totalShares) * 10)} points par partage
- Efficacité globale: ${Math.round((product.totalShares / 100) * 100)}%

RECOMMANDATIONS:
- Continuer à partager sur ${Object.entries(product.shares).reduce((a, b) => product.shares[a[0]] > product.shares[b[0]] ? a : b)[0]}
- Optimiser le contenu pour ${Object.entries(product.shares).reduce((a, b) => product.shares[a[0]] < product.shares[b[0]] ? a : b)[0]}
- Maintenir la fréquence de partage actuelle

Merci pour vos partages !
Pro Booster - Votre marketplace de confiance
      `.trim()

      // Créer un blob avec le contenu
      const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' })
      
      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Rapport-${product.productName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.txt`
      
      // Déclencher le téléchargement
      document.body.appendChild(link)
      link.click()
      
      // Nettoyer
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      // Notification de succès
      toast({
        title: "Rapport produit téléchargé !",
        description: `Le rapport pour ${product.productName} a été téléchargé`,
        variant: "default",
      })
    } catch (error) {
      console.error('Erreur lors de l\'export du rapport produit:', error)
      
      // Notification d'erreur
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter le rapport produit. Veuillez réessayer.",
        variant: "destructive",
      })
    }
  }

  // Fonction pour générer et télécharger le rapport de partage
  const generateAndDownloadSharesReport = () => {
    try {
      // Créer le contenu du rapport
      const reportContent = `
RAPPORT DE PARTAGE PRO BOOSTER
==============================

Date de génération: ${new Date().toLocaleDateString('fr-FR')}
        Total de produits partagés: ${realSharedProducts.length}

DÉTAILS PAR PRODUIT:
        ${realSharedProducts.map((product, index) => `
${index + 1}. ${product.productName}
   Date de partage: ${formatDate(product.sharedAt)}
   Total partages: ${product.totalShares}
   Points gagnés: ${product.pointsEarned}
   Points utilisés: ${product.pointsUsed}
   Points retirés: ${product.pointsWithdrawn}
   Points disponibles: ${product.pointsAvailable}
   
   Répartition par réseau:
   - Facebook: ${product.shares.facebook}
   - WhatsApp: ${product.shares.whatsapp}
   - Twitter: ${product.shares.twitter}
   - Instagram: ${product.shares.instagram}
`).join('')}

RÉSUMÉ GLOBAL:
        - Total partages: ${realSharedProducts.reduce((sum, p) => sum + p.totalShares, 0)}
        - Total points gagnés: ${realSharedProducts.reduce((sum, p) => sum + p.pointsEarned, 0)}
        - Total points utilisés: ${realSharedProducts.reduce((sum, p) => sum + p.pointsUsed, 0)}
        - Total points retirés: ${realSharedProducts.reduce((sum, p) => sum + p.pointsWithdrawn, 0)}
        - Total points disponibles: ${realSharedProducts.reduce((sum, p) => sum + p.pointsAvailable, 0)}

Merci pour vos partages !
Pro Booster - Votre marketplace de confiance
      `.trim()

      // Créer un blob avec le contenu
      const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' })
      
      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Rapport-Partages-${new Date().toISOString().split('T')[0]}.txt`
      
      // Déclencher le téléchargement
      document.body.appendChild(link)
      link.click()
      
      // Nettoyer
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      // Notification de succès
      toast({
        title: "Rapport exporté !",
        description: "Le rapport de partage a été téléchargé avec succès",
        variant: "default",
      })
    } catch (error) {
      console.error('Erreur lors de l\'export du rapport:', error)
      
      // Notification d'erreur
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter le rapport. Veuillez réessayer.",
        variant: "destructive",
      })
    }
  }

























  // Voir le profil du vendeur depuis le chat
  const viewSellerProfileFromChat = (sessionId: string) => {
    const session = realChatSessions.find(s => s.id === sessionId)
    if (!session) {
      toast({
        title: 'Conversation introuvable',
        description: 'Impossible de retrouver cette discussion.',
        variant: 'destructive'
      })
      return
    }

    toast({
      title: 'Profil vendeur',
      description: 'Ouverture du profil du vendeur...',
      variant: 'default'
    })
    // TODO: rediriger vers la fiche vendeur lorsque disponible
  }



  // Fonction pour générer et télécharger la facture
  const generateAndDownloadInvoice = (order: Order) => {
    try {
      // Créer le contenu de la facture
      const invoiceContent = `
FACTURE PRO BOOSTER
===================

Numéro de commande: ${order.id}
Date: ${formatDate(order.createdAt)}
Statut: ${order.status === 'delivered' ? 'Livrée' : 
         order.status === 'shipped' ? 'Expédiée' :
         order.status === 'confirmed' ? 'Confirmée' :
         order.status === 'pending' ? 'En attente' : 'Annulée'}

ARTICLES:
${order.items.map((item, index) => `
${index + 1}. ${item.name}
   Quantité: ${item.quantity}
   Prix unitaire: ${formatCurrency(item.price)}
   ${(() => {
     const warranty = String((item as any)?.warranty ?? (item as any)?.product?.warranty ?? '').trim()
     const returnPolicy = String((item as any)?.returnPolicy ?? (item as any)?.return_policy ?? (item as any)?.product?.returnPolicy ?? '').trim()
     const parts: string[] = []
     if (warranty) parts.push(`Garantie: ${warranty}`)
     if (returnPolicy) parts.push(`Retours: ${returnPolicy}`)
     return parts.length > 0 ? parts.map((p) => `\n   ${p}`).join('') : ''
   })()}
   Sous-total: ${formatCurrency(item.price * item.quantity)}
`).join('')}

${order.pointsUsed && order.pointsUsed > 0 ? `
Points utilisés: ${order.pointsUsed} points
Valeur des points: ${formatCurrency(order.pointsUsed * 10)}
` : ''}

${order.deliveryOption ? `
Option de livraison: ${order.deliveryOption}
` : ''}

TOTAL: ${formatCurrency(order.total)}
Points gagnés: ${Math.round(order.total / 10)} points

Merci pour votre commande !
Pro Booster - Votre marketplace de confiance
      `.trim()

      // Créer un blob avec le contenu
      const blob = new Blob([invoiceContent], { type: 'text/plain;charset=utf-8' })
      
      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Facture-${order.id}-${new Date().toISOString().split('T')[0]}.txt`
      
      // Déclencher le téléchargement
      document.body.appendChild(link)
      link.click()
      
      // Nettoyer
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      // Notification de succès
      toast({
        title: "Facture téléchargée !",
        description: `La facture ${order.id} a été téléchargée avec succès`,
        variant: "default",
      })
    } catch (error) {
      console.error('Erreur lors du téléchargement de la facture:', error)
      
      // Notification d'erreur
      toast({
        title: "Erreur de téléchargement",
        description: "Impossible de télécharger la facture. Veuillez réessayer.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center relative">
                <User className="w-6 h-6 text-white" />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Tableau de Bord</h1>
                <p className="text-sm text-gray-600">Gérez vos commandes, points et interactions</p>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-green-600 font-medium">En ligne</span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500">Dernière connexion: aujourd'hui</span>
                    </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Bouton Notifications avec indicateur et menu déroulant */}
              <div className="relative">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                  className="hover:bg-orange-50 hover:border-orange-200 transition-colors relative"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Notifications
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                      {unreadNotifications > 9 ? '9+' : unreadNotifications}
                    </span>
                  )}
                </Button>
                
                {/* Menu déroulant des notifications */}
                {showNotificationsDropdown && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 notifications-dropdown">
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Notifications</h3>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setActiveTab('notifications')}
                          className="text-orange-600 hover:text-orange-700"
                        >
                          Voir tout
                        </Button>
                      </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length > 0 ? notifications.slice(0, 10).map((notification) => (
                        <div 
                          key={notification.id} 
                          className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                            !notification.isRead ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => {
                            if (!notification.isRead) {
                              void handleToggleNotificationRead(notification)
                            }
                            setShowNotificationsDropdown(false)
                          }}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`w-2 h-2 rounded-full mt-2 ${
                              notification.type === 'success' ? 'bg-green-500' :
                              notification.type === 'info' ? 'bg-blue-500' :
                              notification.type === 'promotion' ? 'bg-orange-500' :
                              'bg-purple-500'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${
                                !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                              }`}>
                                {notification.title}
                              </p>
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {formatRelativeTimeShort(notification.timestamp)}
                              </p>
                            </div>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                            )}
                          </div>
                        </div>
                      )) : (
                        <div className="p-6 text-center text-sm text-gray-500">
                          Aucune notification
                        </div>
                      )}
                    </div>
                    <div className="p-3 border-t border-gray-200 bg-gray-50">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="w-full text-gray-600 hover:text-gray-800"
                        onClick={() => {
                          void handleMarkAllNotificationsRead()
                          setShowNotificationsDropdown(false)
                        }}
                      >
                        Marquer toutes comme lues
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Bouton Échanges */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenExchangeModal}
                className="hover:bg-orange-50 hover:border-orange-200 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Échanges
              </Button>

              {/* Bouton Paramètres */}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setActiveTab('settings')}
                className="hover:bg-orange-50 hover:border-orange-200 transition-colors"
              >
                <Settings className="w-4 h-4 mr-2" />
                Paramètres
              </Button>
              
              {/* Bouton Rafraîchir */}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  void handleRefreshDashboard()
                }}
                className="hover:bg-orange-50 hover:border-orange-200 transition-colors"
                title="Rafraîchir le tableau de bord"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-4">
          <EditableMessagesBanner location="dashboard_client" />
        </div>
        <div className="flex gap-8">
          {/* Navigation Latérale */}
          <div className="w-80 flex-shrink-0">
            <div className="space-y-6">
              {/* Profil utilisateur */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={profileData.avatar || undefined} alt={profileData.fullName || user?.email || 'Utilisateur'} />
                      <AvatarFallback>
                        {(profileData.fullName || user?.email || 'U').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg">{profileData.fullName || user?.email || 'Utilisateur'}</h3>
                      <p className="text-sm text-gray-600">
                        {profileData.country || 'Compte client'}
                      </p>
                      <div className="flex items-center space-x-1 mt-1 text-sm text-gray-600">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span>{stats.totalOrders} commandes • {formatCurrency(stats.totalSpent)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Navigation des sections */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Sections</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <nav className="space-y-1">
                    {[
                      { id: 'overview', label: 'Vue d\'ensemble', icon: Activity, active: activeTab === 'overview' },
                      { id: 'orders', label: 'Commandes', icon: Package, active: activeTab === 'orders' },
                      { id: 'deliveries', label: 'Livraisons', icon: Truck, active: activeTab === 'deliveries' },
                      { id: 'chat', label: 'Chat', icon: MessageCircle, active: activeTab === 'chat' },
                      { id: 'shares', label: 'Partages', icon: Share2, active: activeTab === 'shares' },
                      { id: 'points', label: 'Points', icon: Gift, active: activeTab === 'points' },
                      { id: 'recommendations', label: 'Recommandations IA', icon: Sparkles, active: activeTab === 'recommendations' },
                      { id: 'promotions', label: 'Offres Promotionnelles', icon: Tag, active: activeTab === 'promotions' },
                      { id: 'in_app_notifications', label: 'Notifications', icon: Bell, active: activeTab === 'in_app_notifications' },
                      { id: 'notifications', label: 'Gestion des notifications', icon: Bell, active: activeTab === 'notifications' },
                      { id: 'messaging', label: 'Messagerie Interne', icon: Mail, active: activeTab === 'messaging' },
                      { id: 'settings', label: 'Paramètres Système', icon: Settings, active: activeTab === 'settings' },
                      { id: 'profile', label: 'Profil', icon: User, active: activeTab === 'profile' }
                    ].map((section) => (
                      <button
                        key={section.id}
                        onClick={() => setActiveTab(section.id)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-colors ${
                          section.active
                            ? 'bg-orange-50 border-r-2 border-orange-500 text-orange-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <section.icon className={`w-5 h-5 ${section.active ? 'text-orange-600' : 'text-gray-500'}`} />
                        <span className="font-medium flex-1">{section.label}</span>
                        {(section.id === 'in_app_notifications' || section.id === 'notifications') && unreadNotifications > 0 && (
                          <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 min-w-5 px-1 flex items-center justify-center font-medium">
                            {unreadNotifications > 9 ? '9+' : unreadNotifications}
                          </span>
                        )}
                      </button>
                    ))}
                  </nav>
                </CardContent>
              </Card>

              {/* Demande de Paiement */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="w-5 h-5 text-green-600" />
                    <span>Demande de Paiement</span>
                  </CardTitle>
                  <CardDescription>Retirez vos points gagnés en argent réel</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Solde des points */}
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-green-700">Solde Points</span>
                      <Gift className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-green-900 mb-1">
                      {userPoints.toLocaleString()}
                    </div>
                    <div className="text-sm text-green-600">
                      ≈ {formatCurrency(userPoints * withdrawalValue)}
                    </div>
                    <div className="text-xs text-green-500 mt-1">
                      Taux: 1 point = {formatNumber(withdrawalValue)} {defaultCurrency}
                    </div>
                  </div>

                  {/* Seuil de retrait */}
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-700">Seuil minimum</span>
                    </div>
                    <p className="text-sm text-blue-600">
                      Minimum: {withdrawalMinPoints.toLocaleString()} points ({formatCurrency(withdrawalMinPoints * withdrawalValue)})
                    </p>
                  </div>

                  {/* Bouton de demande amélioré */}
                  <Button 
                    className="w-full bg-[#ff6600] hover:bg-[#e55a00] text-white shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-300 group relative overflow-visible"
                    onClick={() => {
                      if (isPointsFrozen) {
                        toast({
                          title: 'Compte gelé',
                          description: pointsFrozenMessage ?? 'Compte gelé : opérations de points désactivées',
                          variant: 'destructive'
                        })
                        return
                      }
                      setWithdrawalError(null)
                      if (withdrawalMethods.length > 0) {
                        const defaultMethod = withdrawalMethods[0]
                        setSelectedWithdrawalMethod(defaultMethod.id ?? defaultMethod.name)
                      }
                      setWithdrawalAmountInput('')
                      setWithdrawalIdentifier('')
                      setShowWithdrawalModal(true)
                    }}
                    disabled={isPointsFrozen || userPoints < withdrawalMinPoints}
                  >
                    {/* Effet de brillance au survol */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                    
                    <CreditCard className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                    <span className="relative z-10">Demander un Paiement</span>
                    
                    {/* Badge des nouveaux modes de paiement - Ajusté pour éviter la coupure */}
                    <div className="absolute -top-1 -right-1 bg-yellow-400 text-black text-xs px-1.5 py-0.5 rounded-full font-bold animate-pulse shadow-sm border border-yellow-500">
                      NOUVEAU
                    </div>
                  </Button>
                  
                  {/* Informations sur les modes de paiement */}
                  <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <Info className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-700">Modes de paiement disponibles</span>
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-blue-600">
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <span>Mobile Money</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span>Carte bancaire</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span>Compte bancaire</span>
                      </div>
                    </div>
                  </div>

                  {/* Historique des demandes */}
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Demandes récentes</h4>
                    <div className="space-y-2">
                      {recentWithdrawals.length > 0 ? recentWithdrawals.map((request) => (
                        <div key={request.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div>
                            <p className="text-xs font-medium">{request.id}</p>
                            <p className="text-xs text-gray-500">{request.date}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-medium">{formatCurrency(request.amount)}</p>
                            <Badge 
                              variant={request.status === 'Approuvée' ? 'default' : 
                                     request.status === 'En cours' ? 'secondary' : 'outline'}
                              className="text-xs"
                            >
                              {request.status}
                            </Badge>
                          </div>
                        </div>
                      )) : (
                        <div className="rounded border border-dashed border-gray-200 py-6 text-center text-sm text-gray-500">
                          Aucune demande de retrait
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Statistiques rapides */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    <span>Statistiques Rapides</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-900 mb-1">{stats.totalOrders}</div>
                      <p className="text-xs text-blue-600">Commandes</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-900 mb-1">{stats.totalShares}</div>
                      <p className="text-xs text-green-600">Partages</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-900 mb-1">{stats.activeChats}</div>
                      <p className="text-xs text-purple-600">Chats</p>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                                              <div className="text-2xl font-bold text-orange-900 mb-1">{dashboardData?.stats?.averageRating || 0}</div>
                      <p className="text-xs text-orange-600">Note</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions rapides */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-orange-600" />
                    <span>Actions Rapides</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start hover:bg-orange-50 hover:border-orange-200 transition-all durée-200" 
                    onClick={() => {
                      setChatActiveTab('conversations')
                      setActiveTab('chat')
                    }}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Nouveau Chat
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab('shares')}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Partager un Produit
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab('orders')}>
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Nouvelle Commande
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab('settings')}>
                    <Settings className="w-4 h-4 mr-2" />
                    Paramètres
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Contenu Principal */}
          <div className="flex-1">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Statistiques principales */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-blue-700">Total Commandes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-blue-900">{stats.totalOrders}</div>
                        <ShoppingBag className="w-8 h-8 text-blue-600" />
                      </div>
                      <p className="text-xs text-blue-600 mt-2">{overviewTopStats.ordersPct}% ce mois</p>
                    </CardContent>
                      </Card>

                  <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-green-700">Points Fidélité</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-green-900">{userPoints.toLocaleString()}</div>
                        <Gift className="w-8 h-8 text-green-600" />
                      </div>
                      <p className="text-xs text-green-600 mt-2">
                        Valeur: {formatCurrency(pointsEstimatedValue)} • {userPoints.toLocaleString()} points
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-purple-700">Partages</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-purple-900">{totalSharesDisplay}</div>
                        <Share2 className="w-8 h-8 text-purple-600" />
                      </div>
                      <p className="text-xs text-purple-600 mt-2">Total cumulé</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-orange-700">Total Dépensé</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-orange-900">{formatCurrency(stats.totalSpent)}</div>
                        <CreditCard className="w-8 h-8 text-orange-600" />
                      </div>
                      <p className="text-xs text-orange-600 mt-2">{overviewTopStats.revenuePct}% ce mois</p>
                    </CardContent>
                  </Card>
                </div>

                <RealTimeStats
                  pointsToday={Math.round(pointsEarnedForDay(pointsTodayKey))}
                  pointsDeltaLabel={computeDeltaLabel(
                    Math.round(pointsEarnedForDay(pointsTodayKey)),
                    Math.round(pointsEarnedForDay(pointsYesterdayKey)),
                    'pts'
                  )}
                  sharesToday={(() => {
                    const today = new Date().toISOString().slice(0, 10)
                    const fromTable = (dashboardData?.sharedProducts ?? [])
                      .filter((p: any) => String(p?.sharedAt ?? '').slice(0, 10) === today)
                      .reduce((sum: number, p: any) => sum + (Number(p?.totalShares ?? 0) || 0), 0)
                    return fromTable > 0 ? fromTable : shareEvents.todayCount
                  })()}
                  sharesDeltaLabel={computeDeltaLabel(shareEvents.todayCount, shareEvents.yesterdayCount, 'partages')}
                  ordersToday={(() => {
                    const today = new Date().toISOString().slice(0, 10)
                    return (realOrders ?? []).filter((o: any) => String(o?.createdAt ?? '').slice(0, 10) === today).length
                  })()}
                  ordersDeltaLabel={(() => {
                    const today = new Date().toISOString().slice(0, 10)
                    const yesterdayKey = (() => {
                      const d = new Date()
                      d.setDate(d.getDate() - 1)
                      return d.toISOString().slice(0, 10)
                    })()
                    const todayOrders = (realOrders ?? []).filter((o: any) => String(o?.createdAt ?? '').slice(0, 10) === today).length
                    const yesterdayOrders = (realOrders ?? []).filter((o: any) => String(o?.createdAt ?? '').slice(0, 10) === yesterdayKey).length
                    return computeDeltaLabel(todayOrders, yesterdayOrders, 'cmd')
                  })()}
                  activeChats={stats.activeChats}
                  chatsDeltaLabel={(() => {
                    const today = new Date().toISOString().slice(0, 10)
                    const yesterdayKey = (() => {
                      const d = new Date()
                      d.setDate(d.getDate() - 1)
                      return d.toISOString().slice(0, 10)
                    })()
                    const messages = (dashboardData?.chatMessages ?? []) as any[]
                    const todayChats = messages.filter((m) => String((m as any)?.created_at ?? (m as any)?.timestamp ?? '').slice(0, 10) === today).length
                    const yesterdayChats = messages.filter((m) => String((m as any)?.created_at ?? (m as any)?.timestamp ?? '').slice(0, 10) === yesterdayKey).length
                    return computeDeltaLabel(todayChats, yesterdayChats, 'msg')
                  })()}
                />

                {/* Graphiques et activités récentes */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Graphique des points */}
                  <div className="lg:col-span-2">
                    <PointsEvolutionChart 
                      title="Évolution des Points"
                      description="Progression de vos points fidélité sur 30 jours"
                      data={pointsChartData}
                    />
                  </div>

                  {/* Activités récentes */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Activity className="w-5 h-5 text-blue-600" />
                        <span>Activités Récentes</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {realActivities.length > 0 ? (
                        realActivities.slice(0, 4).map(activity => (
                          <div key={activity.id} className="flex items-center space-x-3">
                            <div className={`w-2 h-2 ${getActivityColor(activity.type)} rounded-full`}></div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{activity.title}</p>
                              <p className="text-xs text-gray-500">{activity.description}</p>
                            </div>
                            <span className="text-xs text-gray-400 whitespace-nowrap">{activity.time}</span>
                          </div>
                        ))
                      ) : (
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">Aucune activité récente</p>
                            <p className="text-xs text-gray-500">Vos prochaines actions apparaîtront ici.</p>
                          </div>
                          <span className="text-xs text-gray-400">-</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Commandes récentes et vendeurs favoris */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Commandes récentes */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center space-x-2">
                          <Package className="w-5 h-5 text-blue-600" />
                          <span>Commandes Récentes</span>
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setActiveTab('orders')
                            toast({
                              title: "Navigation effectuée !",
                              description: "Vous êtes maintenant dans la section Commandes",
                              variant: "default",
                            })
                          }}
                          className="hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        >
                          Voir tout <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {realOrders.slice(0, 3).map(order => {
                        const firstItem = order.items?.[0]
                        const additionalItems = Math.max((order.items?.length ?? 0) - 1, 0)

                        return (
                          <div key={order.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-900/40 rounded-lg">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Package className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">Commande #{order.id}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {firstItem ? firstItem.name : 'Produit inconnu'}
                                {additionalItems > 0 && ` +${additionalItems} autres`}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatCurrency(order.total)}</p>
                              <p className="text-xs text-[#ff6600]">{Math.round(order.total / 10)} points</p>
                              <p className="text-[11px] text-gray-400 dark:text-gray-500">{formatDate(order.createdAt)}</p>
                              <Badge className={`text-xs ${getStatusColor(order.status)}`}>
                                {formatOrderStatus(order.status)}
                              </Badge>
                            </div>
                          </div>
                        )
                      })}
                    </CardContent>
                  </Card>

                  {/* Vendeurs favoris */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center space-x-2">
                          <Heart className="w-5 h-5 text-red-600" />
                          <span>Vendeurs Favoris</span>
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setActiveTab('sellers')
                            toast({
                              title: "Navigation effectuée !",
                              description: "Vous êtes maintenant dans la section Vendeurs",
                              variant: "default",
                            })
                          }}
                          className="hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          Voir tout <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {dashboardData?.sellers?.slice(0, 3)?.map((seller) => (
                        <div
                          key={String((seller as any)?.userId ?? seller.name)}
                          className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-900/40 rounded-lg"
                        >
                          {(() => {
                            const sellerUserId = String((seller as any)?.userId ?? (seller as any)?.partnerId ?? '').trim()
                            const partner = sellerUserId ? chatPartnerProfiles?.[sellerUserId] : undefined
                            const displayName = (typeof partner?.displayName === 'string' && partner.displayName.trim().length > 0)
                              ? partner.displayName
                              : seller.name
                            const avatarUrl = (typeof partner?.avatarUrl === 'string' && partner.avatarUrl.trim().length > 0)
                              ? partner.avatarUrl
                              : seller.avatar

                            return (
                              <>
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={avatarUrl} />
                                <AvatarFallback>{displayName && displayName.length > 0 ? displayName[0] : '?'}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <p 
                                    className="text-sm font-medium cursor-pointer text-gray-900 dark:text-gray-100 hover:text-blue-600 transition-colors duration-300"
                                    onClick={() => router.push(`/seller/${displayName.toLowerCase().replace(/\s+/g, '-')}`)}
                                  >
                                    {displayName}
                                  </p>
                                  <div className={`w-2 h-2 rounded-full ${seller.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                  <p className="text-xs text-gray-500 dark:text-gray-400">{seller.rating}</p>
                                  {typeof (seller as any)?.reviewsCount === 'number' && (
                                    <>
                                      <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">{(seller as any).reviewsCount} avis</p>
                                    </>
                                  )}
                                  <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">{seller.responseTime}</p>
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  const vendorId = String((seller as any)?.userId ?? (seller as any)?.partnerId ?? '').trim()
                                  if (!vendorId) {
                                    toast({
                                      title: 'Vendeur introuvable',
                                      description: "Impossible d'identifier ce vendeur pour ouvrir le chat.",
                                      variant: 'destructive'
                                    })
                                    return
                                  }

                                  pendingOpenChatVendorIdRef.current = vendorId
                                  setActiveTab('chat')
                                }}
                                className="hover:bg-green-50 hover:text-green-600 transition-colors"
                                title={`Chatter avec ${displayName}`}
                              >
                                <MessageCircle className="w-4 h-4" />
                              </Button>
                                </>
                              )
                            })()}
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                  {/* Graphiques d'activité */}
                  <div className="grid grid-cols-1 gap-6">
                    <WeeklyActivityChart 
                      title="Activité Hebdomadaire"
                      description="Vue d'ensemble de vos activités sur la semaine"
                      data={weeklyActivityData}
                    />
                    <PerformanceRadarChart 
                      title="Performance Globale"
                      description="Évaluation de vos performances par métrique"
                      data={performanceData}
                    />
                  </div>

                  {/* Graphique des commandes */}
                  <OrdersChart 
                    title="Évolution des Commandes"
                    description="Progression de vos commandes et revenus sur 6 mois"
                    data={ordersChartData}
                  />
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="space-y-6">
                {/* Filtres et recherche */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Mes Commandes</span>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            toast({
                              title: "Export en cours !",
                              description: "Vos commandes sont en cours d'exportation...",
                              variant: "default",
                            })
                            // Simuler l'export
                            setTimeout(() => {
                              toast({
                                title: "Export terminé !",
                                description: "Vos commandes ont été exportées avec succès",
                                variant: "default",
                              })
                            }, 2000)
                          }}
                          className="hover:bg-green-50 hover:text-green-600 transition-colors"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Exporter
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            toast({
                              title: "Filtres appliqués !",
                              description: "Les filtres ont été appliqués à vos commandes",
                              variant: "default",
                            })
                          }}
                          className="hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        >
                          <Filter className="w-4 h-4 mr-2" />
                          Filtrer
                        </Button>
                      </div>
                    </CardTitle>
                    <CardDescription>Suivi complet de vos commandes et livraisons</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          placeholder="Rechercher une commande..."
                          className="pl-10"
                          onChange={(e) => {
                            const searchTerm = e.target.value.toLowerCase()
                            // Simuler la recherche
                            if (searchTerm.length > 2) {
                              toast({
                                title: "Recherche effectuée !",
                                description: `Résultats pour "${searchTerm}"`,
                                variant: "default",
                              })
                            }
                          }}
                        />
                      </div>
                      <Select defaultValue="all" onValueChange={(value) => {
                        if (value !== 'all') {
                          toast({
                            title: "Filtre appliqué !",
                            description: `Commandes avec le statut: ${value}`,
                            variant: "default",
                          })
                        }
                      }}>
                        <SelectTrigger className="w-48 hover:bg-gray-50 transition-colors">
                          <SelectValue placeholder="Statut" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les statuts</SelectItem>
                          <SelectItem value="pending">En attente</SelectItem>
                          <SelectItem value="confirmed">Confirmée</SelectItem>
                          <SelectItem value="shipped">Expédiée</SelectItem>
                          <SelectItem value="delivered">Livrée</SelectItem>
                          <SelectItem value="cancelled">Annulée</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Statistiques des commandes */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <Card 
                        className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105"
                        onClick={() => {
                          toast({
                            title: "Vue d'ensemble !",
                            description: "Affichage de toutes vos commandes",
                            variant: "default",
                          })
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-blue-700">Total</p>
                              <p className="text-2xl font-bold text-blue-900">{orderStatusCounts.total}</p>
                            </div>
                            <Package className="w-8 h-8 text-blue-600" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card 
                        className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105"
                        onClick={() => {
                          toast({
                            title: "Commandes en cours !",
                            description: "8 commandes en cours de traitement",
                            variant: "default",
                          })
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-yellow-700">En cours</p>
                              <p className="text-2xl font-bold text-yellow-900">{orderStatusCounts.inProgress}</p>
                            </div>
                            <Clock className="w-8 h-8 text-yellow-600" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card 
                        className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105"
                        onClick={() => {
                          toast({
                            title: "Commandes livrées !",
                            description: "14 commandes livrées avec succès",
                            variant: "default",
                          })
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-green-700">Livrées</p>
                              <p className="text-2xl font-bold text-green-900">{orderStatusCounts.delivered}</p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-green-600" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card 
                        className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105"
                        onClick={() => {
                          toast({
                            title: "Commandes annulées !",
                            description: "2 commandes ont été annulées",
                            variant: "default",
                          })
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-red-700">Annulées</p>
                              <p className="text-2xl font-bold text-red-900">{orderStatusCounts.cancelled}</p>
                            </div>
                            <XCircle className="w-8 h-8 text-red-600" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Liste des commandes */}
                    <div className="space-y-4">
                      {visibleOrders.map((order) => {
                        const firstItem = order.items?.[0]
                        const additionalItems = Math.max((order.items?.length ?? 0) - 1, 0)
                        const totalQuantity = order.items?.reduce((acc, item) => acc + (item.quantity ?? 0), 0) ?? 0

                        return (
                          <Card key={order.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4 flex items-center justify-between group">
                              <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <Package className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-semibold text-sm">Commande #{order.id}</p>
                                  <p className="text-xs text-gray-500">Passée le {formatDate(order.createdAt)}</p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {firstItem ? firstItem.name : 'Produit inconnu'}
                                    {additionalItems > 0 && ` +${additionalItems} autres`}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-gray-500">
                                    <span>{formatOrderStatus(order.status)}</span>
                                    <span>•</span>
                                    <span>{totalQuantity} article(s)</span>
                                    {order.pointsUsed && order.pointsUsed > 0 && (
                                      <>
                                        <span>•</span>
                                        <span>{order.pointsUsed} points utilisés</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="text-right">
                                <div>
                                  <p className="text-lg font-bold">{formatCurrency(order.total)}</p>
                                  <p className="text-sm text-[#ff6600]">{Math.round(order.total / 10)} points</p>
                                </div>
                                <div className="flex items-center space-x-2 mt-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedOrder(order)
                                      setShowOrderDetailsModal(true)
                                    }}
                                    className="hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    Détails
                                  </Button>

                                  {order.status !== 'cancelled' && order.status !== 'delivered' && (
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => void cancelClientOrder(String(order.id))}
                                      className="transition-colors"
                                      title="Annuler la commande"
                                    >
                                      Annuler
                                    </Button>
                                  )}

                                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {order.status === 'delivered' && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setSelectedOrderForAction(order)
                                          setShowOrderEvaluationModal(true)
                                        }}
                                        className="hover:bg-yellow-50 hover:text-yellow-600 transition-colors"
                                        title="Évaluer la commande"
                                      >
                                        <Star className="w-4 h-4" />
                                      </Button>
                                    )}

                                    {order.status === 'shipped' && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setSelectedOrderForAction(order)
                                          setShowOrderTrackingModal(true)
                                        }}
                                        className="hover:bg-green-50 hover:text-green-600 transition-colors"
                                        title="Suivre la livraison"
                                      >
                                        <Truck className="w-4 h-4" />
                                      </Button>
                                    )}

                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        navigator.clipboard.writeText(String(order.id))
                                        toast({
                                          title: 'Numéro copié !',
                                          description: 'Le numéro de commande a été copié',
                                          variant: 'default'
                                        })
                                      }}
                                      className="hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                      title="Copier le numéro"
                                    >
                                      <Copy className="w-4 h-4" />
                                    </Button>

                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => generateAndDownloadInvoice(order)}
                                      className="hover:bg-green-50 hover:text-green-600 transition-colors"
                                      title="Télécharger la facture"
                                    >
                                      <Download className="w-4 h-4" />
                                    </Button>
                                  </div>

                                  {order.status === 'delivered' && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedOrderForAction(order)
                                        setShowOrderEvaluationModal(true)
                                      }}
                                      className="hover:bg-yellow-50 hover:text-yellow-600 transition-colors"
                                    >
                                      <Star className="w-4 h-4 mr-1" />
                                      Évaluer
                                    </Button>
                                  )}

                                  {order.status === 'shipped' && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedOrderForAction(order)
                                        setShowOrderTrackingModal(true)
                                      }}
                                      className="hover:bg-green-50 hover:text-green-600 transition-colors"
                                    >
                                      <Truck className="w-4 h-4 mr-1" />
                                      Suivre
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>

                    <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-700 mt-0.5" />
                        <p className="text-sm text-yellow-800">
                          Une commande peut être annulée tant que le processus de livraison n'a pas démarré. Une fois confiée à un livreur, l'annulation n'est plus possible.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'deliveries' && (
              <div className="space-y-6">
                <ClientDeliveryManagement />
              </div>
            )}

            {activeTab === 'chat' && (
              <div className="space-y-6">
                {/* Section CHAT - Interface moderne et stylée */}
                <Card className="border-0 shadow-lg bg-white">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <MessageCircle className="w-6 h-6 text-orange-600" />
                        <span className="text-xl font-bold text-gray-900">Messages</span>
                        <Badge variant="secondary" className="bg-orange-100 text-orange-700 font-medium">
                          {dashboardData?.sellers?.filter(s => s.isOnline)?.length || 0} en ligne
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline"
                          size="sm"
                          className="border-orange-200 text-orange-600 hover:bg-orange-50"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="flex h-[600px] bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                      {/* Panneau gauche - Liste des conversations */}
                      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
                        {/* Barre de recherche */}
                        <div className="p-4 border-b border-gray-100">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                              placeholder="Rechercher des conversations..."
                              value={chatSearchQuery}
                              onChange={(e) => setChatSearchQuery(e.target.value)}
                              className="pl-10 pr-4 py-2 bg-gray-50 border-gray-200 focus:bg-white focus:border-orange-300 transition-all duration-200"
                            />
                          </div>
                        </div>

                        {/* Onglets et contenu */}
                        <div className="flex-1 overflow-y-auto">
                          <Tabs value={chatActiveTab} onValueChange={(value) => setChatActiveTab(value as 'conversations' | 'produits')} className="w-full h-full flex flex-col">
                            <div className="px-4 pt-2">
                              <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1">
                                <TabsTrigger 
                                  value="conversations" 
                                  className="data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm transition-all duration-200"
                                >
                                  Conversations
                                </TabsTrigger>
                                <TabsTrigger 
                                  value="produits" 
                                  className="data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm transition-all duration-200"
                                >
                                  Produits
                                </TabsTrigger>
                              </TabsList>
                            </div>

                            <TabsContent value="conversations" className="mt-0 flex-1">
                              <div className="space-y-1 p-2">
                                {selectedChatIdsList.length > 0 && (
                                  <div className="mb-2 flex items-center justify-between gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2">
                                    <div className="text-sm text-orange-800 font-medium">
                                      {selectedChatIdsList.length} sélectionnée(s)
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="border-orange-200 text-orange-700 hover:bg-orange-100"
                                        onClick={(e) => {
                                          e.preventDefault()
                                          clearConversationSelection()
                                        }}
                                      >
                                        Effacer
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="border-orange-200 text-orange-700 hover:bg-orange-100"
                                        onClick={(e) => {
                                          e.preventDefault()
                                          selectAllFilteredConversations()
                                        }}
                                      >
                                        Tout sélectionner
                                      </Button>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="border-orange-200 text-orange-700 hover:bg-orange-100"
                                            title="Actions"
                                          >
                                            <MoreVertical className="w-4 h-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem
                                            onSelect={(e) => {
                                              e.preventDefault()
                                              void applyBatchConversationPatch({ isImportant: true })
                                            }}
                                          >
                                            <Star className="w-4 h-4" />
                                            Marquer comme important
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onSelect={(e) => {
                                              e.preventDefault()
                                              void applyBatchConversationPatch({ isImportant: false })
                                            }}
                                          >
                                            <Star className="w-4 h-4" />
                                            Retirer important
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem
                                            onSelect={(e) => {
                                              e.preventDefault()
                                              void applyBatchConversationPatch({ isToPay: true })
                                            }}
                                          >
                                            <CreditCard className="w-4 h-4" />
                                            Ajouter à « A régler »
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onSelect={(e) => {
                                              e.preventDefault()
                                              void applyBatchConversationPatch({ isToPay: false })
                                            }}
                                          >
                                            <CreditCard className="w-4 h-4" />
                                            Retirer de « A régler »
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem
                                            onSelect={(e) => {
                                              e.preventDefault()
                                              void archiveSelectedConversations()
                                            }}
                                          >
                                            <Archive className="w-4 h-4" />
                                            Archiver
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onSelect={(e) => {
                                              e.preventDefault()
                                              void deleteSelectedConversations()
                                            }}
                                          >
                                            <Trash2 className="w-4 h-4" />
                                            Supprimer
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  </div>
                                )}

                                {filteredChatContacts.map((contact) => (
                                  <div
                                    key={contact.id}
                                    onClick={() => {
                                      setSelectedChatId(contact.id)
                                      setSelectedChatPartner(contact)
                                    }}
                                    className={`p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-orange-50 ${
                                      selectedChatId === contact.id ? 'bg-orange-100 border border-orange-200' : 'hover:border-orange-100'
                                    }`}
                                  >
                                    <div className="flex items-start gap-3">
                                      <div
                                        onClick={(e) => {
                                          e.preventDefault()
                                          e.stopPropagation()
                                        }}
                                        className="pt-1 shrink-0"
                                      >
                                        <Checkbox
                                          checked={selectedChatIds?.[contact.id] === true}
                                          onCheckedChange={() => toggleConversationSelection(contact.id)}
                                          aria-label="Sélectionner la conversation"
                                          className="h-5 w-5 border-2 border-gray-400 bg-white data-[state=checked]:bg-orange-500 data-[state=checked]:text-white"
                                        />
                                      </div>

                                      <Avatar className="w-12 h-12 border-2 border-white shadow-sm bg-gradient-to-br from-orange-100 to-orange-200 text-orange-700 font-semibold">
                                        <AvatarFallback>{contact.initials}</AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                          <h4 className="font-semibold text-gray-900 truncate">{contact.displayName}</h4>
                                          {contact.lastMessageAt && (
                                            <span className="text-xs text-gray-500">{formatDate(contact.lastMessageAt)}</span>
                                          )}
                                        </div>
                                        <p className="text-sm text-gray-600 truncate">{contact.lastMessagePreview}</p>
                                      </div>
                                    </div>
                                  </div>
                                ))}

                                {chatContacts.length === 0 && (
                                  <div className="text-center py-8 text-sm text-gray-500">
                                    Aucune conversation disponible pour le moment.
                                  </div>
                                )}
                              </div>
                            </TabsContent>

                            <TabsContent value="produits" className="mt-0 flex-1 flex flex-col">
                              {/* Champ de recherche spécifique aux produits */}
                              <div className="p-3 border-b border-gray-100">
                                <div className="relative">
                                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                  <Input
                                    placeholder="Rechercher un produit..."
                                    value={productSearchQuery}
                                    onChange={(e) => setProductSearchQuery(e.target.value)}
                                    className="pl-10 border-gray-200 focus:border-orange-300 focus:ring-orange-200 text-sm"
                                  />
                                </div>
                              </div>
                              
                              {/* Liste des produits */}
                              <div className="flex-1 overflow-y-auto">
                                <div className="space-y-1 p-2">
                                  {realChatProducts
                                    .filter(product => {
                                      const nameMatch = product.name?.toLowerCase().includes(productSearchQuery.toLowerCase())
                                      const sellerMatch = resolveVendorLabelFromProduct(product)
                                        .toLowerCase()
                                        .includes(productSearchQuery.toLowerCase())
                                      return nameMatch || sellerMatch
                                    })
                                    .map(product => (
                                      <div
                                        key={product.id}
                                        className="p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-orange-50 hover:border-orange-100 border border-transparent"
                                        onClick={() => {
                                          if (!user?.id) {
                                            toast({ title: 'Action impossible', description: 'Vous devez être connecté.', variant: 'destructive' })
                                            return
                                          }

                                          const vendorId = String((product as any)?.vendor_id ?? (product as any)?.vendorId ?? '').trim()
                                          if (!vendorId) {
                                            toast({
                                              title: 'Vendeur introuvable',
                                              description: "Impossible d'identifier le vendeur de ce produit.",
                                              variant: 'destructive'
                                            })
                                            return
                                          }

                                          void (async () => {
                                            try {
                                              const vendorLabel = resolveVendorLabelFromProduct(product)
                                              setOpeningChatContact({
                                                id: 'opening',
                                                partnerId: vendorId,
                                                displayName: vendorLabel || 'Vendeur',
                                                initials: (vendorLabel || 'Vendeur')
                                                  .split(' ')
                                                  .filter(Boolean)
                                                  .slice(0, 2)
                                                  .map((part) => part.charAt(0).toUpperCase())
                                                  .join('')
                                                  .slice(0, 2) || 'V',
                                                lastMessageAt: null,
                                                lastMessagePreview: ''
                                              })

                                              const session = await ChatService.getOrCreateChatSession(user.id, vendorId)
                                              if (!session?.id) {
                                                toast({
                                                  title: 'Erreur',
                                                  description: 'Impossible de démarrer la conversation avec ce vendeur.',
                                                  variant: 'destructive'
                                                })
                                                setOpeningChatContact(null)
                                                return
                                              }

                                              // Injection immédiate du profil partenaire pour éviter le délai d'affichage

                                              // Sélectionner la conversation immédiatement
                                              setSelectedChatId(session.id)

                                              // Injecter la session dans le dashboard local si elle n'existe pas encore
                                              setDashboardDataRaw((prev) => {
                                                if (!prev) return prev
                                                const list = Array.isArray((prev as any).chats) ? ((prev as any).chats as any[]) : []
                                                const exists = list.some((c) => String(c?.id ?? '') === String(session.id))
                                                if (exists) return prev
                                                return {
                                                  ...(prev as any),
                                                  chats: [
                                                    {
                                                      id: session.id,
                                                      participant1_id: session.participant1_id,
                                                      participant2_id: session.participant2_id,
                                                      last_message_at: session.last_message_at,
                                                      is_active: session.is_active,
                                                      created_at: session.created_at
                                                    },
                                                    ...list
                                                  ]
                                                }
                                              })

                                              const inserted = await DashboardService.addProductToChat({
                                                chatId: session.id,
                                                senderId: user.id,
                                                product: {
                                                  id: String(product.id),
                                                  name: product.name,
                                                  price: product.price ?? 0,
                                                  currency: product.currency ?? 'XOF',
                                                  metadata: {
                                                    vendor_id: vendorId,
                                                    vendor_name: resolveVendorLabelFromProduct(product),
                                                    thumbnail:
                                                      Array.isArray(product.images) && product.images.length > 0
                                                        ? product.images[0]
                                                        : null
                                                  }
                                                }
                                              })

                                              if (inserted) {
                                                setDashboardDataRaw((prev) => {
                                                  if (!prev) return prev
                                                  const current = Array.isArray((prev as any).chatMessages)
                                                    ? ((prev as any).chatMessages as any[])
                                                    : []
                                                  const insertedId = String((inserted as any)?.id ?? '').trim()
                                                  if (insertedId && current.some((m) => String((m as any)?.id ?? '').trim() === insertedId)) {
                                                    return prev
                                                  }
                                                  return {
                                                    ...(prev as any),
                                                    chatMessages: [...current, inserted]
                                                  }
                                                })
                                              }

                                              toast({
                                                title: 'Produit partagé',
                                                description: `${product.name} a été partagé dans la conversation.`,
                                                variant: 'default'
                                              })
                                            } catch (error) {
                                              const message = error instanceof Error ? error.message : 'Impossible de partager le produit.'
                                              setOpeningChatContact(null)
                                              toast({ title: 'Erreur', description: message, variant: 'destructive' })
                                            }
                                          })()
                                        }}
                                      >
                                        <div className="flex items-center space-x-3">
                                          <Avatar className="w-10 h-10 border border-gray-200">
                                            <AvatarImage src={Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : undefined} alt={product.name} />
                                            <AvatarFallback className="bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700">
                                              {product.name.charAt(0)}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-gray-900 truncate text-sm">{product.name}</h4>
                                            <p className="text-xs text-gray-500">{resolveVendorLabelFromProduct(product)}</p>
                                            
                                            {/* Prix en devise et en points */}
                                            <div className="space-y-1 mt-1">
                                              <p className="text-sm font-semibold text-orange-600">{formatCurrency(product.price)}</p>
                                              <div className="flex items-center space-x-1">
                                                <Coins className="w-3 h-3 text-yellow-500" />
                                                <span className="text-xs text-gray-600">
                                                  {Math.round(product.price * 10)} pts
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  
                                  {/* Message si aucun produit trouvé */}
                                  {realChatProducts.filter(product => {
                                    const nameMatch = product.name?.toLowerCase().includes(productSearchQuery.toLowerCase())
                                    const sellerMatch = resolveVendorLabelFromProduct(product)
                                      .toLowerCase()
                                      .includes(productSearchQuery.toLowerCase())
                                    return nameMatch || sellerMatch
                                  }).length === 0 && (
                                    <div className="text-center py-8">
                                      <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                      <p className="text-sm text-gray-500">Aucun produit trouvé</p>
                                      <p className="text-xs text-gray-400">Essayez avec d'autres mots-clés</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TabsContent>
                          </Tabs>
                        </div>
                      </div>

                      {/* Panneau droit - Zone de chat */}
                      <div className="flex-1 bg-white flex flex-col">
                        {selectedChatContact || openingChatContact ? (
                          <>
                            {/* En-tête de la conversation */}
                            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-white">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <Avatar className="w-10 h-10 border-2 border-orange-200 bg-gradient-to-br from-orange-100 to-orange-200 text-orange-700 font-semibold">
                                    <AvatarFallback>{(selectedChatContact ?? openingChatContact)!.initials}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <h3 className="font-semibold text-gray-900">{(selectedChatContact ?? openingChatContact)!.displayName}</h3>
                                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                                      <span>Discussion</span>
                                      {(selectedChatContact ?? openingChatContact)!.lastMessageAt && (
                                        <>
                                          <span className="text-gray-400">•</span>
                                          <span>Dernier message {formatDate((selectedChatContact ?? openingChatContact)!.lastMessageAt as any)}</span>
                                        </>
                                      )}
                                      {!selectedChatContact && openingChatContact ? (
                                        <>
                                          <span className="text-gray-400">•</span>
                                          <span>Ouverture...</span>
                                        </>
                                      ) : null}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-gray-600 hover:text-orange-600 relative group"
                                    onClick={() => setIsVendorShopModalOpen(true)}
                                    title="Voir la boutique"
                                  >
                                    <ShoppingBag className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="border-orange-200 text-orange-700 hover:bg-orange-50"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      setIsMessageSelectMode((prev) => {
                                        const next = !prev
                                        if (!next) {
                                          clearMessageSelectionDashboard()
                                        }
                                        return next
                                      })
                                    }}
                                    title="Sélectionner des messages"
                                  >
                                    {isMessageSelectMode ? 'Quitter sélection' : 'Sélection'}
                                  </Button>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="text-gray-600 hover:text-orange-600"
                                        title="Plus d'options"
                                      >
                                        <MoreVertical className="w-4 h-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        onSelect={(e) => {
                                          e.preventDefault()
                                          setIsMessageSelectMode((prev) => {
                                            const next = !prev
                                            if (!next) {
                                              clearMessageSelectionDashboard()
                                            }
                                            return next
                                          })
                                        }}
                                      >
                                        <Check className="w-4 h-4" />
                                        {isMessageSelectMode ? 'Quitter la sélection de messages' : 'Sélectionner des messages'}
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onSelect={(e) => {
                                          e.preventDefault()
                                          const chatId = String(selectedChatId ?? '').trim()
                                          if (!chatId) return
                                          const current = conversationStatesByChatId?.[chatId]?.isImportant === true
                                          void updateConversationStateFlag(chatId, { isImportant: !current })
                                          toast({
                                            title: !current ? 'Marqué comme important' : 'Important retiré',
                                            description: !current ? 'Cette conversation est maintenant importante.' : 'Cette conversation n\'est plus importante.',
                                            variant: 'default'
                                          })
                                        }}
                                      >
                                        <Star className="w-4 h-4" />
                                        Marquer comme important
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onSelect={(e) => {
                                          e.preventDefault()
                                          const chatId = String(selectedChatId ?? '').trim()
                                          if (!chatId) return
                                          const current = conversationStatesByChatId?.[chatId]?.isToPay === true
                                          void updateConversationStateFlag(chatId, { isToPay: !current })
                                          toast({
                                            title: !current ? 'Ajouté à « A régler »' : 'Retiré de « A régler »',
                                            description: !current ? 'Vous pourrez la retrouver facilement.' : 'Étiquette retirée.',
                                            variant: 'default'
                                          })
                                        }}
                                      >
                                        <CreditCard className="w-4 h-4" />
                                        A régler
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onSelect={(e) => {
                                          e.preventDefault()
                                          openOrderModalForActiveChat()
                                        }}
                                      >
                                        <ShoppingCart className="w-4 h-4" />
                                        A commander
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onSelect={(e) => {
                                          e.preventDefault()
                                          setIsVendorShopModalOpen(true)
                                        }}
                                      >
                                        <ShoppingBag className="w-4 h-4" />
                                        Ouvrir la boutique
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onSelect={async (e) => {
                                          e.preventDefault()
                                          const chatId = String(selectedChatId ?? '').trim()
                                          if (!chatId) return
                                          try {
                                            if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
                                              await navigator.clipboard.writeText(chatId)
                                            } else {
                                              const area = document.createElement('textarea')
                                              area.value = chatId
                                              document.body.appendChild(area)
                                              area.select()
                                              document.execCommand('copy')
                                              document.body.removeChild(area)
                                            }
                                            toast({ title: 'Copié', description: 'ID conversation copié.', variant: 'default' })
                                          } catch {
                                            toast({ title: 'Erreur', description: "Impossible de copier l'ID.", variant: 'destructive' })
                                          }
                                        }}
                                      >
                                        <Copy className="w-4 h-4" />
                                        Copier l'ID
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onSelect={(e) => {
                                          e.preventDefault()
                                          const chatId = String(selectedChatId ?? '').trim()
                                          if (chatId) {
                                            void updateConversationStateFlag(chatId, { isArchived: true })
                                          }
                                          void archiveActiveChat()
                                        }}
                                      >
                                        <Archive className="w-4 h-4" />
                                        Archiver
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onSelect={(e) => {
                                          e.preventDefault()
                                          setConfirmDeleteChatOpen(true)
                                        }}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                        Supprimer
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onSelect={(e) => {
                                          e.preventDefault()
                                        }}
                                      >
                                        <X className="w-4 h-4" />
                                        Fermer
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            </div>

                            <Dialog open={isVendorShopModalOpen} onOpenChange={setIsVendorShopModalOpen}>
                              <DialogContent
                                disableAnimations
                                hideCloseButton
                                className="w-[95vw] sm:w-auto max-w-2xl h-[85vh] sm:h-[80vh] p-0 overflow-hidden flex flex-col rounded-2xl"
                              >
                                <DialogHeader className="p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <DialogTitle className="text-base font-semibold text-gray-900">Boutique du vendeur</DialogTitle>
                                      <DialogDescription className="text-sm text-gray-600">
                                        Produits du vendeur pour cette conversation.
                                      </DialogDescription>
                                    </div>

                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-9 w-9 shrink-0"
                                      onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        setIsVendorShopModalOpen(false)
                                      }}
                                      aria-label="Fermer"
                                      title="Fermer"
                                    >
                                      <X className="h-5 w-5" />
                                    </Button>
                                  </div>
                                </DialogHeader>

                                <div className="flex-1 min-h-0 overflow-y-auto bg-gray-50 p-4">
                                  {vendorProductsForActiveChat.length === 0 ? (
                                    <div className="text-center py-10 text-sm text-gray-500">Aucun produit disponible.</div>
                                  ) : (
                                    <div className="grid grid-cols-1 gap-3">
                                      {vendorProductsForActiveChat.map((p: any) => {
                                        const pid = String(p?.id ?? '').trim()
                                        const name = String(p?.name ?? 'Produit').trim() || 'Produit'
                                        const price = typeof p?.price === 'number' ? p.price : Number(p?.price ?? 0) || 0
                                        const currency = String(p?.currency ?? 'XOF')
                                        const image = String(
                                          p?.image_url ??
                                            p?.imageUrl ??
                                            p?.image ??
                                            p?.mainImage ??
                                            p?.metadata?.thumbnail ??
                                            (Array.isArray(p?.images) && p.images.length > 0 ? p.images[0] : '') ??
                                            ''
                                        ).trim()

                                        return (
                                          <div key={pid || name} className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-3 shadow-sm">
                                            <div className="w-14 h-14 rounded-md border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center flex-shrink-0">
                                              {image ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={image} alt={name} className="w-full h-full object-cover" />
                                              ) : (
                                                <ShoppingBag className="w-6 h-6 text-gray-400" />
                                              )}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                              <div className="font-medium text-gray-900 truncate">{name}</div>
                                              <div className="text-sm text-gray-600">
                                                <div className="leading-tight">
                                                  {price.toLocaleString('fr-FR')} {currency}
                                                </div>
                                                <div className="text-xs text-[#ff6600] font-medium leading-tight">
                                                  {(conversionRate > 0 ? Math.round(price / conversionRate) : 0).toLocaleString('fr-FR')} points
                                                </div>
                                              </div>
                                            </div>

                                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full sm:w-auto"
                                                onClick={async (e) => {
                                                  e.preventDefault()
                                                  e.stopPropagation()
                                                  await shareProductInActiveChat(p)
                                                }}
                                              >
                                                Partager
                                              </Button>
                                              <Button
                                                variant="default"
                                                size="sm"
                                                className="w-full sm:w-auto"
                                                onClick={(e) => {
                                                  e.preventDefault()
                                                  e.stopPropagation()
                                                  addProductMessageToCart(p)
                                                  toast({
                                                    title: 'Ajouté au panier',
                                                    description: `${name} a été ajouté au panier.`,
                                                    variant: 'default'
                                                  })
                                                }}
                                              >
                                                Panier
                                              </Button>
                                            </div>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>

      <Dialog open={false} onOpenChange={setShowEmailConfirmationMiniModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirme ton nouvel email</DialogTitle>
            <DialogDescription>
              Un email de confirmation vient d'être envoyé{pendingEmailConfirmationTarget ? ` à ${pendingEmailConfirmationTarget}` : ''}.
              Ouvre ta boîte mail pour valider le changement.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowEmailConfirmationMiniModal(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

                            <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
                              <DialogContent className="w-[95vw] sm:w-auto max-w-2xl h-[85vh] sm:h-[80vh] p-0 overflow-hidden flex flex-col rounded-2xl">
                                <DialogHeader className="p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
                                  <DialogTitle className="text-base font-semibold text-gray-900">A commander</DialogTitle>
                                  <DialogDescription className="text-sm text-gray-600">
                                    Sélectionnez les produits à commander dans cette conversation.
                                  </DialogDescription>
                                </DialogHeader>

                                <div className="flex-1 min-h-0 overflow-y-auto bg-gray-50 p-4 space-y-3">
                                  <div className="bg-white border border-gray-200 rounded-xl p-3">
                                    <div className="text-sm text-gray-700">
                                      {orderShippingLat != null && orderShippingLng != null
                                        ? `Localisation détectée: ${orderShippingLat.toFixed(5)}, ${orderShippingLng.toFixed(5)}`
                                        : 'Localisation non détectée (certains produits physiques peuvent la requérir).'}
                                    </div>
                                  </div>

                                  {vendorProductsForActiveChat.length === 0 ? (
                                    <div className="text-center py-10 text-sm text-gray-500">Aucun produit disponible.</div>
                                  ) : (
                                    <div className="grid grid-cols-1 gap-3">
                                      {vendorProductsForActiveChat.map((p: any) => {
                                        const pid = String(p?.id ?? '').trim()
                                        const name = String(p?.name ?? 'Produit').trim() || 'Produit'
                                        const price = typeof p?.price === 'number' ? p.price : Number(p?.price ?? 0) || 0
                                        const currency = String(p?.currency ?? 'XOF')
                                        const qty = orderSelectionByProductId?.[pid] ?? 0
                                        return (
                                          <div key={pid || name} className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-3 shadow-sm">
                                            <div className="min-w-0 flex-1">
                                              <div className="font-medium text-gray-900 truncate">{name}</div>
                                              <div className="text-sm text-gray-600">
                                                {price.toLocaleString('fr-FR')} {currency}
                                              </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={(e) => {
                                                  e.preventDefault()
                                                  e.stopPropagation()
                                                  setOrderSelectionByProductId((prev) => {
                                                    const current = prev?.[pid] ?? 0
                                                    const nextQty = Math.max(0, Math.floor(current) - 1)
                                                    if (nextQty === 0) {
                                                      const copy = { ...(prev ?? {}) }
                                                      delete copy[pid]
                                                      return copy
                                                    }
                                                    return { ...(prev ?? {}), [pid]: nextQty }
                                                  })
                                                }}
                                              >
                                                -
                                              </Button>
                                              <input
                                                value={qty}
                                                onChange={(e) => {
                                                  const v = Math.max(0, Math.floor(Number((e.target as any)?.value ?? 0) || 0))
                                                  setOrderSelectionByProductId((prev) => {
                                                    if (v === 0) {
                                                      const copy = { ...(prev ?? {}) }
                                                      delete copy[pid]
                                                      return copy
                                                    }
                                                    return { ...(prev ?? {}), [pid]: v }
                                                  })
                                                }}
                                                type="number"
                                                min={0}
                                                className="w-16 h-9 rounded-md border border-gray-200 bg-white px-2 text-sm text-gray-900"
                                              />
                                              <Button
                                                variant="default"
                                                size="sm"
                                                onClick={(e) => {
                                                  e.preventDefault()
                                                  e.stopPropagation()
                                                  setOrderSelectionByProductId((prev) => ({ ...(prev ?? {}), [pid]: Math.max(1, Math.floor((prev?.[pid] ?? 0) + 1)) }))
                                                }}
                                              >
                                                +
                                              </Button>
                                            </div>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  )}
                                </div>

                                <DialogFooter className="p-4 border-t border-gray-200 bg-white">
                                  <Button
                                    variant="outline"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      setIsOrderModalOpen(false)
                                    }}
                                  >
                                    Annuler
                                  </Button>
                                  <Button
                                    variant="default"
                                    disabled={isPlacingOrder}
                                    onClick={(e) => {
                                      e.preventDefault()
                                      void placeOrderFromSelection()
                                    }}
                                  >
                                    {isPlacingOrder ? 'Commande...' : 'Créer la commande'}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>

                            <Dialog open={confirmDeleteChatOpen} onOpenChange={setConfirmDeleteChatOpen}>
                              <DialogContent className="w-[95vw] sm:w-auto max-w-md rounded-2xl">
                                <DialogHeader>
                                  <DialogTitle className="text-base font-semibold text-gray-900">Supprimer la conversation</DialogTitle>
                                  <DialogDescription className="text-sm text-gray-600">
                                    Cette action masquera la conversation (suppression douce). Vous pourrez la restaurer via le support si besoin.
                                  </DialogDescription>
                                </DialogHeader>

                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setConfirmDeleteChatOpen(false)}>
                                    Annuler
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      const chatId = String(selectedChatId ?? '').trim()
                                      if (chatId) {
                                        void updateConversationStateFlag(chatId, { isDeleted: true })
                                      }
                                      void archiveActiveChat()
                                      setConfirmDeleteChatOpen(false)
                                    }}
                                  >
                                    Supprimer
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>

                            {/* Zone des messages */}
                            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                              {isMessageSelectMode ? (
                                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2">
                                  <div className="text-sm text-orange-800 font-medium">
                                    {selectedMessageIdsList.length} message(s) sélectionné(s)
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="border-orange-200 text-orange-700 hover:bg-orange-100"
                                      onClick={(e) => {
                                        e.preventDefault()
                                        clearMessageSelectionDashboard()
                                      }}
                                    >
                                      Effacer
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="border-orange-200 text-orange-700 hover:bg-orange-100"
                                      onClick={(e) => {
                                        e.preventDefault()
                                        selectAllMessagesInActiveChat()
                                      }}
                                    >
                                      Tout sélectionner
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="border-orange-200 text-orange-700 hover:bg-orange-100"
                                      disabled={selectedMessageIdsList.length === 0}
                                      onClick={(e) => {
                                        e.preventDefault()
                                        void archiveSelectedMessagesDashboard()
                                      }}
                                    >
                                      <Archive className="w-4 h-4" />
                                      Archiver
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="sm"
                                      disabled={selectedMessageIdsList.length === 0}
                                      onClick={(e) => {
                                        e.preventDefault()
                                        void deleteSelectedMessagesDashboard()
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      Supprimer
                                    </Button>
                                  </div>
                                </div>
                              ) : null}

                              {filteredChatMessages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
                                  <MessageSquare className="w-12 h-12 text-orange-400 mb-4" />
                                  <p className="text-sm">Aucun message dans cette conversation pour le moment.</p>
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  {filteredChatMessages.map((message) => (
                                    <div
                                      key={message.id}
                                      className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                                    >
                                      {isMessageSelectMode ? (
                                        <div
                                          className={`pt-1 ${message.sender_id === user?.id ? 'order-2 ml-2' : 'order-1 mr-2'}`}
                                          onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            toggleMessageSelectionDashboard(String(message.id))
                                          }}
                                        >
                                          <Checkbox
                                            checked={selectedMessageIds.has(String(message.id))}
                                            aria-label="Sélectionner le message"
                                            className="h-5 w-5 border-2 border-gray-400 bg-white data-[state=checked]:bg-orange-500 data-[state=checked]:text-white"
                                          />
                                        </div>
                                      ) : null}
                                      <div
                                        className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-sm border ${
                                          message.sender_id === user?.id
                                            ? 'bg-orange-500 text-white border-orange-500 rounded-br-sm'
                                            : 'bg-white text-gray-900 border-gray-200 rounded-bl-sm'
                                        }`}
                                      >
                                        {(() => {
                                          const rawContent = String((message as any)?.content ?? message.content ?? '')
                                          const decoded = decodeProductMessage(rawContent)
                                          if (!decoded?.product) {
                                            const attachment = decodeAttachmentMessage(rawContent)
                                            if (!attachment?.url) {
                                              return (
                                                <p className="text-sm whitespace-pre-line break-words">{rawContent || 'Message vide'}</p>
                                              )
                                            }

                                            const formatBytes = (bytes?: number): string => {
                                              if (typeof bytes !== 'number' || !Number.isFinite(bytes) || bytes <= 0) return ''
                                              const units = ['o', 'Ko', 'Mo', 'Go']
                                              let size = bytes
                                              let unitIndex = 0
                                              while (size >= 1024 && unitIndex < units.length - 1) {
                                                size /= 1024
                                                unitIndex += 1
                                              }
                                              const rounded = size >= 10 || unitIndex === 0 ? Math.round(size) : Math.round(size * 10) / 10
                                              return `${rounded} ${units[unitIndex]}`
                                            }

                                            const name = String(attachment.name ?? '').trim() || 'Pièce jointe'
                                            const sizeLabel = formatBytes(attachment.size)
                                            const mime = String(attachment.mime ?? '').trim().toLowerCase()
                                            const kind: EncodedAttachmentPayload['kind'] = (() => {
                                              if (attachment.kind !== 'file') return attachment.kind
                                              if (mime.startsWith('image/')) return 'image'
                                              if (mime.startsWith('video/')) return 'video'
                                              if (mime.startsWith('audio/')) return 'audio'
                                              return 'document'
                                            })()

                                            const AttachmentFrame = ({ children }: { children: any }) => (
                                              <div className="space-y-2">
                                                {String(attachment.text ?? '').trim() ? (
                                                  <p className="text-sm whitespace-pre-line break-words">{String(attachment.text).trim()}</p>
                                                ) : null}
                                                <div
                                                  className={`rounded-xl border overflow-hidden ${
                                                    message.sender_id === user?.id
                                                      ? 'border-orange-400/40 bg-orange-500/10'
                                                      : 'border-gray-200 bg-white'
                                                  }`}
                                                >
                                                  <div className="p-3">{children}</div>
                                                </div>
                                              </div>
                                            )

                                            if (kind === 'image') {
                                              return (
                                                <AttachmentFrame>
                                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                                  <img
                                                    src={attachment.url}
                                                    alt={name}
                                                    className="max-h-80 w-full rounded-lg object-contain bg-black/5"
                                                    loading="lazy"
                                                  />
                                                  <div className={`mt-2 text-xs ${message.sender_id === user?.id ? 'text-orange-100' : 'text-gray-500'}`}>
                                                    {name}{sizeLabel ? ` • ${sizeLabel}` : ''}
                                                  </div>
                                                </AttachmentFrame>
                                              )
                                            }

                                            if (kind === 'video') {
                                              return (
                                                <AttachmentFrame>
                                                  <video src={attachment.url} controls className="w-full max-h-80 rounded-lg bg-black/10" />
                                                  <div className={`mt-2 text-xs ${message.sender_id === user?.id ? 'text-orange-100' : 'text-gray-500'}`}>
                                                    {name}{sizeLabel ? ` • ${sizeLabel}` : ''}
                                                  </div>
                                                </AttachmentFrame>
                                              )
                                            }

                                            if (kind === 'audio') {
                                              return (
                                                <AttachmentFrame>
                                                  <audio src={attachment.url} controls className="w-full" />
                                                  <div className={`mt-2 text-xs ${message.sender_id === user?.id ? 'text-orange-100' : 'text-gray-500'}`}>
                                                    {name}{sizeLabel ? ` • ${sizeLabel}` : ''}
                                                  </div>
                                                </AttachmentFrame>
                                              )
                                            }

                                            return (
                                              <AttachmentFrame>
                                                <a
                                                  href={attachment.url}
                                                  target="_blank"
                                                  rel="noreferrer"
                                                  className={`text-sm font-medium underline break-words ${
                                                    message.sender_id === user?.id ? 'text-white' : 'text-orange-600'
                                                  }`}
                                                >
                                                  {name}
                                                </a>
                                                <div className={`mt-2 text-xs ${message.sender_id === user?.id ? 'text-orange-100' : 'text-gray-500'}`}>
                                                  {mime ? mime : 'Document'}{sizeLabel ? ` • ${sizeLabel}` : ''}
                                                </div>
                                              </AttachmentFrame>
                                            )
                                          }

                                          const product = decoded.product as any
                                          const name = String(product?.name ?? 'Produit').trim() || 'Produit'
                                          const imageUrlRaw = String(
                                            product?.image_url ??
                                              product?.imageUrl ??
                                              product?.image ??
                                              product?.mainImage ??
                                              product?.metadata?.thumbnail ??
                                              (Array.isArray(product?.images) && product.images.length > 0 ? product.images[0] : '') ??
                                              ''
                                          ).trim()
                                          const imageUrl = (() => {
                                            if (!imageUrlRaw) return ''
                                            if (
                                              imageUrlRaw.startsWith('http://') ||
                                              imageUrlRaw.startsWith('https://') ||
                                              imageUrlRaw.startsWith('data:image/')
                                            ) {
                                              return imageUrlRaw
                                            }
                                            const path = imageUrlRaw.replace(/^\/+/, '')
                                            try {
                                              const { data } = supabase.storage.from('product-assets').getPublicUrl(path)
                                              const url = typeof data?.publicUrl === 'string' ? data.publicUrl.trim() : ''
                                              return url || imageUrlRaw
                                            } catch {
                                              return imageUrlRaw
                                            }
                                          })()
                                          const priceValue = product?.price
                                          const currency = String(product?.currency ?? 'XOF')

                                          return (
                                            <div className="space-y-2">
                                              {decoded.text ? (
                                                <p className="text-sm whitespace-pre-line break-words">{decoded.text}</p>
                                              ) : null}

                                              <div
                                                className={`rounded-xl border overflow-hidden ${
                                                  message.sender_id === user?.id
                                                    ? 'border-orange-400/40 bg-orange-500/10'
                                                    : 'border-gray-200 bg-white'
                                                }`}
                                              >
                                                <div className="flex items-center gap-3 p-3">
                                                  <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center shrink-0">
                                                    {imageUrl ? (
                                                      // eslint-disable-next-line @next/next/no-img-element
                                                      <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
                                                    ) : (
                                                      <ShoppingBag className="w-6 h-6 text-gray-400" />
                                                    )}
                                                  </div>

                                                  <div className="min-w-0 flex-1">
                                                    <div className={`text-sm font-medium truncate ${
                                                      message.sender_id === user?.id ? 'text-white' : 'text-gray-900'
                                                    }`}>{name}</div>
                                                    <div className={`text-xs ${
                                                      message.sender_id === user?.id ? 'text-orange-100' : 'text-gray-500'
                                                    }`}>
                                                      {typeof priceValue === 'number' || typeof priceValue === 'string'
                                                        ? `${priceValue} ${currency}`
                                                        : currency}
                                                    </div>
                                                  </div>

                                                  <div className="flex items-center gap-1">
                                                    <Button
                                                      type="button"
                                                      variant="ghost"
                                                      size="sm"
                                                      className={`h-8 w-8 p-0 ${message.sender_id === user?.id ? 'text-white hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-orange-600'}`}
                                                      onClick={() => {
                                                        const pid = String(product?.id ?? '').trim()
                                                        if (!pid) {
                                                          toast({ title: 'Erreur', description: 'Identifiant produit manquant.', variant: 'destructive' })
                                                          return
                                                        }
                                                        void openProductInfo(pid, product)
                                                      }}
                                                      title="Informations"
                                                    >
                                                      <Info className="h-4 w-4" />
                                                    </Button>

                                                    <Button
                                                      type="button"
                                                      variant="ghost"
                                                      size="sm"
                                                      className={`h-8 w-8 p-0 ${message.sender_id === user?.id ? 'text-white hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-orange-600'}`}
                                                      onClick={() => addProductMessageToCart(product)}
                                                      title="Ajouter au panier"
                                                    >
                                                      <ShoppingCart className="h-4 w-4" />
                                                    </Button>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          )
                                        })()}
                                        <div className={`mt-2 text-xs flex items-center space-x-2 ${
                                          message.sender_id === user?.id ? 'text-orange-100' : 'text-gray-500'
                                        }`}>
                                          <span>
                                            {formatDate(message.created_at, {
                                              hour: '2-digit',
                                              minute: '2-digit'
                                            })}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Zone de saisie */}
                            <div className="p-4 border-t border-gray-200 bg-white">
                              <div className="flex items-end space-x-3">
                                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl p-3">
                                  <div className="mb-2 flex items-center gap-2">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-gray-500 hover:text-orange-600"
                                      onClick={(e) => {
                                        e.preventDefault()
                                        setShowEmojiPicker((v) => !v)
                                      }}
                                      title="Emoji"
                                    >
                                      <Smile className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-gray-500 hover:text-orange-600"
                                      onClick={(e) => {
                                        e.preventDefault()
                                        fileInputRef.current?.click()
                                      }}
                                      title="Pièces jointes"
                                    >
                                      <Paperclip className="h-4 w-4" />
                                    </Button>
                                    {!isRecording ? (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-gray-500 hover:text-orange-600"
                                        onClick={(e) => {
                                          e.preventDefault()
                                          void startDashboardRecording()
                                        }}
                                        title="Enregistrer (REC)"
                                      >
                                        <Mic className="h-4 w-4" />
                                      </Button>
                                    ) : (
                                      <div className="flex-1 flex items-center gap-2 rounded-md border border-orange-200 bg-orange-50 px-3 py-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                                          <span className="text-sm font-medium text-orange-700">REC</span>
                                          <span className="text-sm text-orange-700">{formatRecordingTime(recordingTime)}</span>
                                        </div>
                                        <div className="ml-auto flex items-center gap-1">
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                              e.preventDefault()
                                              toggleDashboardRecordingPause()
                                            }}
                                            className="h-8 w-8 p-0"
                                            title={recordingPaused ? 'Reprendre' : 'Pause'}
                                          >
                                            {recordingPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                                          </Button>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                              e.preventDefault()
                                              stopDashboardRecording()
                                            }}
                                            className="h-8 w-8 p-0"
                                            title="Stop"
                                          >
                                            <Square className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    )}

                                    <input
                                      ref={fileInputRef}
                                      type="file"
                                      className="hidden"
                                      onChange={(e) => {
                                        const f = e.target.files && e.target.files[0] ? e.target.files[0] : null
                                        e.target.value = ''
                                        if (!f) return
                                        void sendDashboardAttachment(f)
                                      }}
                                    />
                                  </div>

                                  {showEmojiPicker ? (
                                    <div className="mb-2 flex flex-wrap gap-2">
                                      {['😀','😂','😍','🙏','👍','❤️','🔥','🎉','😢','😡','✅','❌'].map((em) => (
                                        <button
                                          key={em}
                                          type="button"
                                          className="h-8 w-8 rounded-md border border-gray-200 bg-white hover:bg-orange-50"
                                          onClick={(e) => {
                                            e.preventDefault()
                                            setChatInput((prev) => `${String(prev ?? '')}${em}`)
                                          }}
                                          aria-label={`Emoji ${em}`}
                                        >
                                          {em}
                                        </button>
                                      ))}
                                    </div>
                                  ) : null}

                                  <Textarea
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="Écrire un message..."
                                    className="flex-1 bg-transparent border-0 focus-visible:ring-0 text-sm resize-none min-h-[48px]"
                                    rows={1}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault()
                                        handleSendMessage()
                                      }
                                    }}
                                  />
                                </div>
                                <Button
                                  type="button"
                                  className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-6 py-3 shadow-lg"
                                  onClick={handleSendMessage}
                                  disabled={!chatInput.trim() || !selectedChatId || isRecording}
                                >
                                  <Send className="w-4 h-4 mr-2" />
                                  Envoyer
                                </Button>
                              </div>
                            </div>

                            <Dialog open={isProductInfoOpen} onOpenChange={setIsProductInfoOpen}>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Informations produit</DialogTitle>
                                  <DialogDescription>Détails réels (livraison, promotions, conditions)</DialogDescription>
                                </DialogHeader>

                                {productInfoLoading ? (
                                  <div className="py-10 text-center text-sm text-gray-500">Chargement...</div>
                                ) : productInfoError ? (
                                  <div className="py-6 text-sm text-red-600">{productInfoError}</div>
                                ) : productInfoData ? (
                                  <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center shrink-0">
                                        {String(productInfoData?.media?.main_image ?? '').trim() ? (
                                          // eslint-disable-next-line @next/next/no-img-element
                                          <img
                                            src={String(productInfoData?.media?.main_image)}
                                            alt={String(productInfoData?.name ?? 'Produit')}
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          <ShoppingBag className="w-7 h-7 text-gray-400" />
                                        )}
                                      </div>
                                      <div className="min-w-0">
                                        <div className="font-semibold text-gray-900 truncate">{String(productInfoData?.name ?? 'Produit')}</div>
                                        <div className="text-sm text-gray-600">
                                          {typeof productInfoData?.sale_price === 'number' && productInfoData.sale_price > 0 ? (
                                            <span>
                                              <span className="font-semibold text-orange-600">{formatMoney(productInfoData.sale_price)}</span>
                                              {typeof productInfoData?.price === 'number' && productInfoData.price > 0 ? (
                                                <span className="ml-2 text-gray-500 line-through">{formatMoney(productInfoData.price)}</span>
                                              ) : null}
                                            </span>
                                          ) : (
                                            <span className="font-semibold text-orange-600">{formatMoney(Number(productInfoData?.price ?? 0) || 0)}</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      <Card>
                                        <CardContent className="p-4">
                                          <div className="flex items-center gap-2 font-medium text-gray-900">
                                            <Truck className="h-4 w-4 text-orange-600" />
                                            Livraison
                                          </div>
                                          <div className="mt-2 text-sm text-gray-700 space-y-1">
                                            {String(productInfoData?.shipping?.delivery_label ?? '').trim() ? (
                                              <div>
                                                <span className="text-gray-500">Résumé:</span> {String(productInfoData.shipping.delivery_label)}
                                              </div>
                                            ) : null}
                                            <div>
                                              <span className="text-gray-500">Gratuite:</span>{' '}
                                              {productInfoData?.shipping?.free_shipping ? 'Oui' : 'Non'}
                                            </div>
                                            <div>
                                              <span className="text-gray-500">Coût:</span>{' '}
                                              {productInfoData?.shipping?.free_shipping
                                                ? formatMoney(0)
                                                : (productInfoData?.shipping?.shipping_cost ?? null) == null
                                                  ? '—'
                                                  : formatMoney(Number(productInfoData.shipping.shipping_cost) || 0)}
                                            </div>
                                            {String(productInfoData?.shipping?.delivery_delay ?? '').trim() ? (
                                              <div>
                                                <span className="text-gray-500">Délai:</span> {String(productInfoData.shipping.delivery_delay)}
                                              </div>
                                            ) : null}
                                            {productInfoData?.shipping?.shipping_class ? (
                                              <div>
                                                <span className="text-gray-500">Classe:</span> {String(productInfoData.shipping.shipping_class)}
                                              </div>
                                            ) : null}
                                          </div>
                                        </CardContent>
                                      </Card>

                                      <Card>
                                        <CardContent className="p-4">
                                          <div className="flex items-center gap-2 font-medium text-gray-900">
                                            <Percent className="h-4 w-4 text-orange-600" />
                                            Promotions
                                          </div>
                                          <div className="mt-2 text-sm text-gray-700 space-y-1">
                                            {productInfoData?.promotion_summary?.is_active && String(productInfoData?.promotion_summary?.summary ?? '').trim() ? (
                                              <div>
                                                <span className="text-gray-500">Résumé:</span> {String(productInfoData.promotion_summary.summary)}
                                              </div>
                                            ) : null}

                                            {productInfoData?.promotion_settings ? (
                                              <>
                                                <div>
                                                  <span className="text-gray-500">Badge:</span>{' '}
                                                  {String(productInfoData?.promotion_settings?.featured_badge_text ?? '—')}
                                                </div>
                                                <div>
                                                  <span className="text-gray-500">Début:</span>{' '}
                                                  {String(productInfoData?.promotion_settings?.promotion_start_date ?? '—')}
                                                </div>
                                                <div>
                                                  <span className="text-gray-500">Fin:</span>{' '}
                                                  {String(productInfoData?.promotion_settings?.promotion_end_date ?? '—')}
                                                </div>
                                              </>
                                            ) : productInfoData?.promotion_summary?.is_active ? null : (
                                              <div className="text-gray-500">Aucune promotion active</div>
                                            )}
                                          </div>
                                        </CardContent>
                                      </Card>

                                      <Card className="md:col-span-2">
                                        <CardContent className="p-4">
                                          <div className="flex items-center gap-2 font-medium text-gray-900">
                                            <Shield className="h-4 w-4 text-orange-600" />
                                            Conditions
                                          </div>
                                          <div className="mt-2 text-sm text-gray-700 space-y-2">
                                            {productInfoData?.warranty ? (
                                              <div>
                                                <span className="text-gray-500">Garantie:</span> {String(productInfoData.warranty)}
                                              </div>
                                            ) : null}
                                            {productInfoData?.return_policy ? (
                                              <div>
                                                <span className="text-gray-500">Retours:</span> {String(productInfoData.return_policy)}
                                              </div>
                                            ) : null}
                                            {productInfoData?.payment_settings ? (
                                              <div>
                                                <span className="text-gray-500">Paiement:</span>{' '}
                                                {productInfoData?.payment_settings?.installment_payment ? 'Échelonné disponible' : 'Standard'}
                                              </div>
                                            ) : null}
                                          </div>
                                        </CardContent>
                                      </Card>
                                    </div>
                                  </div>
                                ) : null}

                                <DialogFooter>
                                  <Button type="button" variant="outline" onClick={() => setIsProductInfoOpen(false)}>
                                    Fermer
                                  </Button>
                                  {productInfoData ? (
                                    <Button
                                      type="button"
                                      className="bg-orange-500 hover:bg-orange-600"
                                      onClick={() => {
                                        addProductMessageToCart(productInfoData)
                                        setIsProductInfoOpen(false)
                                      }}
                                    >
                                      Ajouter au panier
                                    </Button>
                                  ) : null}
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </>
                        ) : (
                          /* État vide - Aucune conversation sélectionnée */
                          <div className="flex-1 flex items-center justify-center bg-gray-50">
                            <div className="text-center">
                              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                              <h3 className="text-lg font-medium text-gray-900 mb-2">Sélectionnez une conversation</h3>
                              <p className="text-gray-500">Choisissez un vendeur pour commencer à discuter</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
 
 
            {activeTab === 'shares' && (user?.id ? <SharesSectionSynced userId={user.id} /> : null)}

            {activeTab === 'points' && (
              <div className="space-y-6">
                {pointsError && (
                  <Alert variant="destructive">
                    <AlertDescription>{pointsError}</AlertDescription>
                  </Alert>
                )}

                {isPointsFrozen && (
                  <Alert variant="destructive">
                    <AlertDescription>{pointsFrozenMessage ?? 'Compte gelé : opérations de points désactivées'}</AlertDescription>
                  </Alert>
                )}

                {/* Solde principal des points */}
                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="text-green-800">Solde des Points</span>
                      {isPointsFrozen && (
                        <Badge className="bg-gray-200 text-gray-800 border border-gray-300">
                          Points gelés
                        </Badge>
                      )}
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleOpenWithdrawalModal}
                          disabled={isPointsFrozen || pointsConfiguration?.settings.withdrawalEnabled === false}
                          className="border-green-300 text-green-700 hover:bg-green-200"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Retirer
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleOpenExchangeModal}
                          disabled={isPointsFrozen || pointsConfiguration?.settings.exchangeEnabled === false}
                          className="border-green-300 text-green-700 hover:bg-green-200"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Échanger
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleOpenTransferModal}
                          disabled={isPointsFrozen || pointsConfiguration?.settings.transferEnabled === false}
                          className="border-green-300 text-green-700 hover:bg-green-200"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Transférer
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <div className={[
                        'text-6xl font-bold mb-2',
                        isPointsFrozen ? 'text-gray-500' : 'text-green-900'
                      ].join(' ')}>
                        {userPoints.toLocaleString()}
                      </div>
                      <div className={['text-xl mb-4', isPointsFrozen ? 'text-gray-600' : 'text-green-700'].join(' ')}>
                        Points disponibles
                      </div>
                      <div className="text-lg text-green-600 mb-6">
                Valeur: {formatCurrency(pointsEstimatedValue)} • {userPoints} points
              </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <div className="text-2xl font-bold text-green-600">{dashboardData?.stats?.totalPoints || 0}</div>
                          <div className="text-sm text-gray-600">Points gagnés</div>
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <div className="text-2xl font-bold text-orange-600">{pointsSummary?.pointsSpent ?? dashboardData?.stats?.pointsUsed ?? 0}</div>
                          <div className="text-sm text-gray-600">Points utilisés</div>
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <div className="text-2xl font-bold text-blue-600">{dashboardData?.stats?.pointsWithdrawn || 0}</div>
                          <div className="text-sm text-gray-600">Points retirés</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Statistiques détaillées */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-blue-700">Taux de Base</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-blue-900">{formatNumber(basePointsPerFCFA)}:1</div>
                        <TrendingUp className="w-8 h-8 text-blue-600" />
                      </div>
                      <p className="text-xs text-blue-600 mt-2">{formatNumber(basePointsPerFCFA)} points = 1 {defaultCurrency}</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-purple-700">Seuil de Retrait</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-purple-900">{pointsConfiguration?.limits?.withdrawal?.min ?? dashboardData?.stats?.withdrawalThreshold ?? 0}</div>
                        <Target className="w-8 h-8 text-purple-600" />
                      </div>
                      <p className="text-xs text-purple-600 mt-2">Points minimum</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-orange-700">Frais de Retrait</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-orange-900">{withdrawalFeeConfig?.percentage ?? dashboardData?.stats?.withdrawalFee ?? 0}%</div>
                        <Percent className="w-8 h-8 text-orange-600" />
                      </div>
                      <p className="text-xs text-orange-600 mt-2">Par transaction</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-red-700">Points Expirés</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-red-900">{dashboardData?.stats?.expiredPoints || 0}</div>
                        <Clock className="w-8 h-8 text-red-600" />
                      </div>
                      <p className="text-xs text-red-600 mt-2">Cette année</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Historique des transactions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Historique des Transactions</span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          console.log('Bouton Exporter CSV cliqué !')
                          // Générer et télécharger l'historique des transactions en CSV
                          generateAndDownloadTransactionsCSV()
                        }}
                        className="hover:bg-green-50 hover:text-green-600 hover:border-green-300 transition-colors cursor-pointer"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Exporter CSV
                      </Button>
                    </CardTitle>
                    <CardDescription>Détail de toutes vos opérations de points</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {(dashboardData?.pointsHistory || []).length > 0 ? (
                        (dashboardData?.pointsHistory || []).map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              transaction.type === 'earned' ? 'bg-green-100' :
                              transaction.type === 'used' ? 'bg-orange-100' :
                              'bg-blue-100'
                            }`}>
                              {transaction.type === 'earned' ? (
                                <Plus className="w-5 h-5 text-green-600" />
                              ) : transaction.type === 'used' ? (
                                <Minus className="w-5 h-5 text-orange-600" />
                              ) : (
                                <Download className="w-5 h-5 text-blue-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{transaction.description}</p>
                              <p className="text-sm text-gray-500">{formatDate(transaction.date)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${
                              transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {transaction.amount > 0 ? '+' : ''}{transaction.amount} pts
                            </p>
                            <p className="text-sm text-gray-500">Solde: {transaction.balance.toLocaleString()}</p>
                          </div>
                        </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Gift className="w-8 h-8 text-gray-400" />
                          </div>
                          <p className="text-lg font-medium mb-2">Aucun historique de points</p>
                          <p className="text-sm">Vos transactions de points apparaîtront ici</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Options d'achat et transfert */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="dark:border-gray-800">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <ShoppingCart className="w-5 h-5 text-blue-600" />
                        <span className="dark:text-gray-100">Acheter des Points</span>
                      </CardTitle>
                      <CardDescription className="dark:text-gray-300">Augmentez votre solde en achetant des points</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-4 text-sm text-blue-900 dark:border-blue-950/40 dark:bg-blue-950/20 dark:text-blue-100">
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="font-medium">Paiement sécurisé</div>
                              <div className="text-xs text-blue-800/80 dark:text-blue-200/80">
                                Paiement via FeexPay (Mobile Money ou Carte). Transaction rapide et sécurisée.
                              </div>
                            </div>
                            <div className="shrink-0 rounded-md bg-white/70 px-2 py-1 text-[11px] font-semibold text-blue-700 dark:bg-white/10 dark:text-blue-200">
                              FeexPay
                            </div>
                          </div>
                        </div>

                        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
                          <div className="grid grid-cols-1 gap-3">
                            <div className="space-y-1">
                              <Label htmlFor="points-purchase-amount" className="text-sm">
                                Montant (FCFA)
                              </Label>
                              <Input
                                id="points-purchase-amount"
                                type="number"
                                inputMode="decimal"
                                placeholder="Ex: 5000"
                                value={customPointsPurchaseAmountInput}
                                onChange={(e) => {
                                  setCustomPointsPurchaseAmountInput(e.target.value)
                                  setCustomPointsPurchasePointsInput('')
                                }}
                              />
                              <div className="text-xs text-muted-foreground">
                                {(() => {
                                  const amount = Number(customPointsPurchaseAmountInput)
                                  if (!Number.isFinite(amount) || amount <= 0) return 'Saisis un montant pour calculer le nombre de points.'
                                  const points = Math.floor(amount / basePointValue)
                                  if (!Number.isFinite(points) || points <= 0) return 'Montant insuffisant pour acheter des points.'
                                  const computedPrice = Number((points * basePointValue).toFixed(2))
                                  return `${points.toLocaleString()} points estimés • ${formatCurrency(computedPrice)}`
                                })()}
                              </div>
                            </div>

                            <div className="space-y-1">
                              <Label htmlFor="points-purchase-points" className="text-sm">
                                Ou nombre de points
                              </Label>
                              <Input
                                id="points-purchase-points"
                                type="number"
                                inputMode="numeric"
                                placeholder="Ex: 200"
                                value={customPointsPurchasePointsInput}
                                onChange={(e) => {
                                  setCustomPointsPurchasePointsInput(e.target.value)
                                  setCustomPointsPurchaseAmountInput('')
                                }}
                              />
                              <div className="text-xs text-muted-foreground">
                                {(() => {
                                  const points = Number(customPointsPurchasePointsInput)
                                  if (!Number.isFinite(points) || points <= 0) return 'Saisis un nombre de points pour calculer le montant.'
                                  const computedPrice = Number((points * basePointValue).toFixed(2))
                                  if (!Number.isFinite(computedPrice) || computedPrice <= 0) return 'Nombre de points invalide.'
                                  return `${formatCurrency(computedPrice)} estimés` 
                                })()}
                              </div>
                            </div>
                          </div>
                        </div>

                        {Array.isArray(dashboardData?.pointsOffers) && dashboardData?.pointsOffers?.length > 0 ? (
                          <div className="space-y-3">
                            {(dashboardData?.pointsOffers || []).map((offer, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between gap-3 p-4 border dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/40"
                              >
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className="font-medium text-gray-900 dark:text-gray-100">{offer.points.toLocaleString()} points</span>
                                    {offer.bonus > 0 && (
                                      <Badge className="bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-200">
                                        +{offer.bonus} bonus
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600 dark:text-gray-300">{formatCurrency(offer.price)}</p>
                                </div>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedPointsOffer(offer)
                                    setShowPointsPurchaseModal(true)
                                    toast({
                                      title: "Offre sélectionnée !",
                                      description: `${offer.points.toLocaleString()} points pour ${formatCurrency(offer.price)}`,
                                      variant: "default",
                                    })
                                  }}
                                  className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 dark:border-gray-700 transition-colors cursor-pointer"
                                >
                                  Acheter
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-lg border border-dashed border-gray-200 p-4 text-sm text-gray-600 dark:border-gray-800 dark:text-gray-300">
                            Aucune offre d’achat de points n’est disponible pour le moment.
                          </div>
                        )}

                        <Button
                          className="w-full bg-[#ff6600] hover:bg-[#e55a00] text-white"
                          onClick={() => {
                            const offers = (dashboardData?.pointsOffers || []) as any[]

                            const sanitizeNumber = (raw: string): number => {
                              const cleaned = String(raw ?? '').replace(',', '.').trim()
                              return Number(cleaned)
                            }

                            const amount = sanitizeNumber(customPointsPurchaseAmountInput)
                            const pointsRaw = sanitizeNumber(customPointsPurchasePointsInput)

                            const offerFromAmount = (() => {
                              if (!Number.isFinite(amount) || amount <= 0) return null
                              const points = Math.floor(amount / basePointValue)
                              if (!Number.isFinite(points) || points <= 0) return null
                              const price = Number((points * basePointValue).toFixed(2))
                              return { points, bonus: 0, price }
                            })()

                            const offerFromPoints = (() => {
                              if (!Number.isFinite(pointsRaw) || pointsRaw <= 0) return null
                              const points = Math.floor(pointsRaw)
                              if (!Number.isFinite(points) || points <= 0) return null
                              const price = Number((points * basePointValue).toFixed(2))
                              if (!Number.isFinite(price) || price <= 0) return null
                              return { points, bonus: 0, price }
                            })()

                            const fallbackOffer = offerFromAmount || offerFromPoints || offers[0] || null
                            if (!fallbackOffer) {
                              toast({
                                title: 'Saisie requise',
                                description: 'Saisis un montant ou un nombre de points pour acheter des points.',
                                variant: 'destructive'
                              })
                              return
                            }

                            setSelectedPointsOffer(fallbackOffer)
                            setShowPointsPurchaseModal(true)
                          }}
                          disabled={(() => {
                            const hasOffers = Array.isArray(dashboardData?.pointsOffers) && (dashboardData?.pointsOffers?.length ?? 0) > 0
                            const amount = Number(String(customPointsPurchaseAmountInput ?? '').replace(',', '.'))
                            const points = Number(String(customPointsPurchasePointsInput ?? '').replace(',', '.'))
                            const hasAmount = Number.isFinite(amount) && amount > 0
                            const hasPoints = Number.isFinite(points) && points > 0
                            return !(hasAmount || hasPoints || hasOffers)
                          })()}
                        >
                          Acheter des points
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Users className="w-5 h-5 text-purple-600" />
                        <span>Transférer des Points</span>
                      </CardTitle>
                      <CardDescription>Envoyez des points à d'autres utilisateurs</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="p-4 bg-purple-50 rounded-lg">
                          <h4 className="font-medium text-purple-800 mb-2">Transfert sécurisé</h4>
                          <p className="text-sm text-purple-600 mb-4">
                            Transférez vos points vers d'autres utilisateurs en toute sécurité.
                          </p>
                          <div className="space-y-2 text-sm text-purple-700">
                            <div className="flex items-center space-x-2">
                              <Check className="w-4 h-4" />
                              <span>
                                Frais de transfert: {(() => {
                                  const flat = Number(transferFeeConfig?.flat ?? 0)
                                  const pct = Number(transferFeeConfig?.percentage ?? 0)

                                  const hasFlat = Number.isFinite(flat) && flat > 0
                                  const hasPct = Number.isFinite(pct) && pct > 0

                                  if (hasFlat && hasPct) {
                                    return `${formatPointsValue(flat)} + ${pct}%`
                                  }

                                  if (hasFlat) {
                                    return formatPointsValue(flat)
                                  }

                                  if (hasPct) {
                                    return `${pct}%`
                                  }

                                  return '0'
                                })()}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Check className="w-4 h-4" />
                              <span>
                                Minimum: {(() => {
                                  const min = Number(pointsConfigurationState?.limits?.transfer?.min ?? 0)
                                  return Number.isFinite(min) && min > 0 ? formatPointsValue(min) : '0 pts'
                                })()}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Check className="w-4 h-4" />
                              <span>
                                Maximum: {(() => {
                                  const daily = pointsConfigurationState?.limits?.transfer?.daily
                                  const max = pointsConfigurationState?.limits?.transfer?.max

                                  const dailyNum = daily === null || daily === undefined ? null : Number(daily)
                                  if (dailyNum !== null && Number.isFinite(dailyNum) && dailyNum > 0) {
                                    return `${formatPointsValue(dailyNum)}/jour`
                                  }

                                  const maxNum = max === null || max === undefined ? null : Number(max)
                                  if (maxNum !== null && Number.isFinite(maxNum) && maxNum > 0) {
                                    return formatPointsValue(maxNum)
                                  }

                                  return '—'
                                })()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button 
                          className="w-full bg-purple-600 hover:bg-purple-700"
                          onClick={handleOpenTransferModal}
                          disabled={isPointsFrozen}
                        >
                          <Users className="w-4 h-4 mr-2" />
                          Transférer des Points
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <RefreshCw className="w-5 h-5 text-orange-600" />
                        <span>Échanger des Points</span>
                      </CardTitle>
                      <CardDescription>Transformez vos points en avantages exclusifs ou en monnaie selon les options disponibles</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                          <h4 className="mb-2 font-medium text-orange-800">Avantages instantanés</h4>
                          <p className="mb-4 text-sm text-orange-700">
                            Choisissez la meilleure expérience : retraits en monnaie, cadeaux, bons d’achat ou réductions partenaires.
                          </p>
                          <div className="space-y-2 text-sm text-orange-700">
                            <div className="flex items-start space-x-2">
                              <Check className="mt-0.5 h-4 w-4" />
                              <span>Récompenses dynamiques proposées par les vendeurs et l’équipe ProBooster</span>
                            </div>
                            <div className="flex items-start space-x-2">
                              <Check className="mt-0.5 h-4 w-4" />
                              <span>Frais et limites clairement affichés avant validation</span>
                            </div>
                            <div className="flex items-start space-x-2">
                              <Check className="mt-0.5 h-4 w-4" />
                              <span>Suivi en temps réel de la valeur convertie ou de l’avantage sélectionné</span>
                            </div>
                          </div>
                        </div>
                        <Button 
                          className="w-full bg-[#ff6600] hover:bg-[#e55a00] text-white"
                          onClick={handleOpenExchangeModal}
                          disabled={isPointsFrozen}
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Échanger des Points
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Graphique d'évolution des points */}
                <PointsEvolutionChart 
                  title="Évolution Détaillée des Points"
                  description="Analyse complète de vos gains et utilisations de points"
                  data={pointsChartData}
                />
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="space-y-6">
                {/* Informations personnelles */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Informations Personnelles</span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          // Ouvrir la modal d'édition du profil
                          setShowProfileEdit(true)
                          toast({
                            title: "Édition du profil",
                            description: "Vous pouvez maintenant modifier vos informations",
                            variant: "default",
                          })
                        }}
                        className="hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300 transition-colors"
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        Modifier
                      </Button>
                    </CardTitle>
                    <CardDescription>Vos informations de base et coordonnées</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start space-x-6">
                      <div className="relative">
                        <Avatar className="w-24 h-24">
                          <AvatarImage src={profileData.avatar || '/placeholder.jpg'} />
                          <AvatarFallback className="text-2xl">
                            {(profileData.fullName || user?.email || 'P')
                              .split(' ')
                              .filter(Boolean)
                              .slice(0, 2)
                              .map((part) => part.charAt(0).toUpperCase())
                              .join('') || 'P'}
                          </AvatarFallback>
                        </Avatar>
                        <Button
                          size="sm"
                          variant="outline"
                          className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full p-0 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300 transition-colors"
                          onClick={() => {
                            // Ouvrir la modal de changement d'avatar
                            setShowAvatarUpload(true)
                            toast({
                              title: "Changement d'avatar",
                              description: "Vous pouvez maintenant changer votre photo de profil",
                              variant: "default",
                            })
                          }}
                        >
                          <Camera className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="flex-1 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Nom complet</Label>
                            <p className="text-gray-900">{profileData.fullName || '—'}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Email</Label>
                            <p className="text-gray-900">{profileData.email || user?.email || '—'}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Téléphone</Label>
                            <p className="text-gray-900">{profileData.phone || '—'}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Pays</Label>
                            <p className="text-gray-900">{profileData.country || '—'}</p>
                          </div>
                          <div className="md:col-span-2">
                            <Label className="text-sm font-medium text-gray-700">Adresse</Label>
                            <p className="text-gray-900">{profileData.address || '—'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Sécurité */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="w-5 h-5 text-blue-600" />
                      <span>Sécurité</span>
                    </CardTitle>
                    <CardDescription>Paramètres de sécurité de votre compte</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-900/50 border border-transparent dark:border-slate-700 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-orange-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                            <Lock className="w-5 h-5 text-orange-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-slate-100">Authentification à deux facteurs</h4>
                            <p className="text-sm text-gray-600 dark:text-slate-300">Protégez votre compte avec la 2FA</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge className={twoFactorEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {twoFactorEnabled ? 'Activée' : 'Désactivée'}
                          </Badge>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setShowTwoFactorSetup(true)}
                            className="hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300 transition-colors"
                          >
                            {twoFactorEnabled ? 'Modifier' : 'Activer'}
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-900/50 border border-transparent dark:border-slate-700 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-orange-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                            <Smartphone className="w-5 h-5 text-orange-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-slate-100">Appareils connectés</h4>
                            <p className="text-sm text-gray-600 dark:text-slate-300">Gérez vos sessions actives</p>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowSessionsModal(true)}
                          className="hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300 transition-colors"
                        >
                          Voir ({activeSessionsCount})
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-900/50 border border-transparent dark:border-slate-700 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-orange-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                            <Key className="w-5 h-5 text-orange-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-slate-100">Changer le mot de passe</h4>
                            <p className="text-sm text-gray-600 dark:text-slate-300">Mettez à jour votre mot de passe</p>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowPasswordChangeModal(true)}
                          className="hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300 transition-colors"
                        >
                          Modifier
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Notifications */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Bell className="w-5 h-5 text-orange-600" />
                      <span>Notifications</span>
                    </CardTitle>
                    <CardDescription>Configurez vos préférences de notifications</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-slate-100">Notifications par email</h4>
                          <p className="text-sm text-gray-600 dark:text-slate-300">Recevez des notifications par email</p>
                        </div>
                        <Switch 
                          checked={notificationSettings.email}
                          onCheckedChange={(checked) => {
                            setNotificationToggle('email', checked)
                            toast({
                              title: checked ? "Notifications email activées" : "Notifications email désactivées",
                              description: checked ? "Vous recevrez maintenant des notifications par email" : "Vous ne recevrez plus de notifications par email",
                              variant: "default",
                            })
                          }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-slate-100">Notifications push</h4>
                          <p className="text-sm text-gray-600 dark:text-slate-300">Notifications sur votre navigateur</p>
                        </div>
                        <Switch 
                          checked={notificationSettings.push}
                          onCheckedChange={(checked) => {
                            setNotificationToggle('push', checked)
                            toast({
                              title: checked ? "Notifications push activées" : "Notifications push désactivées",
                              description: checked ? "Vous recevrez maintenant des notifications push" : "Vous ne recevrez plus de notifications push",
                              variant: "default",
                            })
                          }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-slate-100">Notifications SMS</h4>
                          <p className="text-sm text-gray-600 dark:text-slate-300">Recevez des SMS importants</p>
                        </div>
                        <Switch 
                          checked={notificationSettings.sms}
                          onCheckedChange={(checked) => {
                            setNotificationToggle('sms', checked)
                            toast({
                              title: checked ? "Notifications SMS activées" : "Notifications SMS désactivées",
                              description: checked ? "Vous recevrez maintenant des notifications SMS" : "Vous ne recevrez plus de notifications SMS",
                              variant: "default",
                            })
                          }}
                        />
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900 dark:text-slate-100">Types de notifications</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-900 dark:text-slate-100">Commandes</span>
                            <Switch 
                              checked={notificationSettings.orders}
                              onCheckedChange={(checked) => {
                                setNotificationToggle('orders', checked)
                                toast({
                                  title: checked ? "Notifications commandes activées" : "Notifications commandes désactivées",
                                  description: checked ? "Vous recevrez maintenant des notifications de commandes" : "Vous ne recevrez plus de notifications de commandes",
                                  variant: "default",
                                })
                              }}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-900 dark:text-slate-100">Points de fidélité</span>
                            <Switch 
                              checked={notificationSettings.points}
                              onCheckedChange={(checked) => {
                                setNotificationToggle('points', checked)
                                toast({
                                  title: checked ? "Notifications points activées" : "Notifications points désactivées",
                                  description: checked ? "Vous recevrez maintenant des notifications de points" : "Vous ne recevrez plus de notifications de points",
                                  variant: "default",
                                })
                              }}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-900 dark:text-slate-100">Messages chat</span>
                            <Switch 
                              checked={notificationSettings.chat}
                              onCheckedChange={(checked) => {
                                setNotificationToggle('chat', checked)
                                toast({
                                  title: checked ? "Notifications chat activées" : "Notifications chat désactivées",
                                  description: checked ? "Vous recevrez maintenant des notifications de chat" : "Vous ne recevrez plus de notifications de chat",
                                  variant: "default",
                                })
                              }}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-900 dark:text-slate-100">Promotions</span>
                            <Switch 
                              checked={notificationSettings.promotions}
                              onCheckedChange={(checked) => {
                                setNotificationToggle('promotions', checked)
                                toast({
                                  title: checked ? "Notifications promotions activées" : "Notifications promotions désactivées",
                                  description: checked ? "Vous recevrez maintenant des notifications de promotions" : "Vous ne recevrez plus de notifications de promotions",
                                  variant: "default",
                                })
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Préférences */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Settings className="w-5 h-5 text-orange-600" />
                      <span>Préférences</span>
                    </CardTitle>
                    <CardDescription>Personnalisez votre expérience</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <Label className="text-sm font-medium">Langue</Label>
                        <Select value={selectedLanguage} onValueChange={(value) => {
                          setSelectedLanguage(value as any)
                          setLanguage(value as any)
                          toast({
                            title: "Langue modifiée !",
                            description: `Votre langue a été changée vers ${value === 'fr' ? 'Français' : value === 'en' ? 'English' : 'Español'}`,
                            variant: "default",
                          })
                        }}>
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fr">Français</SelectItem>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Español</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Devise</Label>
                        <Select value={selectedCurrency} onValueChange={(value) => {
                          setSelectedCurrency(value as any)
                          setCurrency(value as any)
                          toast({
                            title: "Devise modifiée !",
                            description: `Votre devise a été changée vers ${value === 'xof' ? 'XOF' : value === 'usd' ? 'USD' : 'EUR'}`,
                            variant: "default",
                          })
                        }}>
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="xof">XOF</SelectItem>
                            <SelectItem value="usd">USD ($)</SelectItem>
                            <SelectItem value="eur">EUR (€)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Thème</Label>
                        <Select value={selectedTheme} onValueChange={(value) => {
                          const mapped = (value === 'system' ? 'auto' : value) as any
                          setSelectedTheme(mapped)
                          setTheme(mapped)
                          toast({
                            title: "Thème modifié !",
                            description: `Votre thème a été changé vers ${mapped === 'light' ? 'Clair' : mapped === 'dark' ? 'Sombre' : 'Système'}`,
                            variant: "default",
                          })
                        }}>
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">Clair</SelectItem>
                            <SelectItem value="dark">Sombre</SelectItem>
                            <SelectItem value="auto">Système</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions du compte */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="w-5 h-5 text-orange-600" />
                      <span>Actions du Compte</span>
                    </CardTitle>
                    <CardDescription>Actions importantes sur votre compte</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <Download className="w-5 h-5 text-yellow-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-gray-900">Exporter mes données</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-600">Téléchargez toutes vos données personnelles</p>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowExportModal(true)}
                          className="hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300 transition-colors"
                        >
                          Exporter
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <Trash2 className="w-5 h-5 text-red-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-gray-900">Supprimer mon compte</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-600">Cette action est irréversible</p>
                          </div>
                        </div>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => setShowDeleteAccountModal(true)}
                          className="hover:bg-red-600 transition-colors"
                        >
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'messaging' && (
              <div className="space-y-6">
                {/* En-tête de la messagerie */}
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-6 h-6 text-blue-600" />
                        <span className="text-blue-800">Messagerie Interne</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowNewMessageModal(true)}
                          className="border-blue-300 text-blue-700 hover:bg-blue-200"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Nouveau Message
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            toast({
                              title: "Export en cours !",
                              description: "Vos messages sont en cours d'exportation...",
                              variant: "default",
                            })

                            const csvContent = [
                              ['ID', 'De', 'Sujet', 'Contenu', 'Date', 'Priorité', 'Catégorie', 'Statut', 'Lu'],
                              ...filteredInternalMessages.map(msg => [
                                msg.id,
                                msg.from === 'admin' ? 'Administration' : 'Vous',
                                msg.subject,
                                msg.content,
                                formatDate(msg.timestamp),
                                msg.priority,
                                msg.category,
                                msg.status === 'sent' ? 'Envoyé' : msg.status === 'delivered' ? 'Livré' : 'Lu',
                                msg.isRead ? 'Oui' : 'Non'
                              ])
                            ].map(row => row.join(',')).join('\n')

                            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
                            const url = window.URL.createObjectURL(blob)
                            const link = document.createElement('a')
                            link.href = url
                            link.download = `Messages-Internes-${new Date().toISOString().split('T')[0]}.csv`
                            link.style.visibility = 'hidden'
                            document.body.appendChild(link)
                            link.click()
                            document.body.removeChild(link)
                            window.URL.revokeObjectURL(url)

                            setTimeout(() => {
                              toast({
                                title: "Export terminé !",
                                description: "Vos messages ont été exportés en CSV avec succès",
                                variant: "default",
                              })
                            }, 800)
                          }}
                          className="border-blue-300 text-blue-700 hover:bg-blue-200"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Exporter
                        </Button>
                      </div>
                    </CardTitle>
                    <CardDescription className="text-blue-700">
                      Communiquez avec l'équipe d'administration et gérez vos messages internes
                    </CardDescription>
                  </CardHeader>
                </Card>

                {/* Statistiques de la messagerie */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                  <Card className="bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 border-blue-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-blue-700">Messages reçus</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-3xl font-semibold text-blue-900">{internalMessagesTotal}</span>
                        <Mail className="h-8 w-8 text-blue-600" />
                      </div>
                      <p className="mt-2 text-xs text-blue-700">Correspondances totales</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-amber-50 via-amber-100 to-amber-200 border-amber-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-amber-700">Messages non lus</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-3xl font-semibold text-amber-900">{unreadInternalMessagesCount}</span>
                        <Bell className="h-8 w-8 text-amber-600" />
                      </div>
                      <p className="mt-2 text-xs text-amber-700">Réponses à traiter</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-emerald-50 via-emerald-100 to-emerald-200 border-emerald-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-emerald-700">Messages administration</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-3xl font-semibold text-emerald-900">{adminInternalMessagesCount}</span>
                        <Building className="h-8 w-8 text-emerald-600" />
                      </div>
                      <p className="mt-2 text-xs text-emerald-700">Notifications officielles reçues</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-indigo-50 via-indigo-100 to-indigo-200 border-indigo-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-indigo-700">Vos réponses envoyées</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-3xl font-semibold text-indigo-900">{userInternalMessagesCount}</span>
                        <Send className="h-8 w-8 text-indigo-600" />
                      </div>
                      <p className="mt-2 text-xs text-indigo-700">Messages sortants</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Filtres et recherche */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <span>Filtres et recherche</span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors"
                          onClick={() => {
                            toast({
                              title: 'Filtres appliqués',
                              description: `${filteredInternalMessages.length} message${filteredInternalMessages.length > 1 ? 's' : ''} affiché${filteredInternalMessages.length > 1 ? 's' : ''}`,
                              variant: 'default'
                            })
                          }}
                        >
                          <Filter className="mr-2 h-4 w-4" />
                          Filtrer
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors"
                          onClick={() => {
                            const priorityOrder: Record<MessagePriority, number> = { high: 3, medium: 2, low: 1 }
                            setInternalMessages(current =>
                              [...current].sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
                            )
                            toast({
                              title: 'Triage effectué',
                              description: 'Messages réordonnés par priorité (haute → moyenne → basse).',
                              variant: 'default'
                            })
                          }}
                        >
                          <TrendingUp className="mr-2 h-4 w-4" />
                          Trier
                        </Button>
                      </div>
                    </CardTitle>
                    <CardDescription>Recherchez et filtrez vos messages internes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Rechercher dans vos messages..."
                          className="pl-9"
                          value={messageSearchTerm}
                          onChange={(event) => {
                            const value = event.target.value.toLowerCase()
                            setMessageSearchTerm(value)

                            if (value.length > 2) {
                              const matches = getFilteredInternalMessages(
                                messageFilterCategory,
                                messageFilterPriority,
                                value
                              )
                              toast({
                                title: 'Recherche effectuée',
                                description: `${matches.length} résultat${matches.length > 1 ? 's' : ''} trouvé${matches.length > 1 ? 's' : ''}`,
                                variant: 'default'
                              })
                            }
                          }}
                        />
                      </div>
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-4">
                        <Select
                          value={messageFilterCategory}
                          onValueChange={(value: 'all' | MessageCategory) => {
                            setMessageFilterCategory(value)
                            const matches = getFilteredInternalMessages(value, messageFilterPriority, messageSearchTerm)
                            toast({
                              title: value === 'all' ? 'Filtre réinitialisé' : 'Filtre appliqué',
                              description: `${matches.length} message${matches.length > 1 ? 's' : ''} affiché${matches.length > 1 ? 's' : ''}`,
                              variant: 'default'
                            })
                          }}
                        >
                          <SelectTrigger className="sm:w-48">
                            <SelectValue placeholder="Filtrer par catégorie" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Toutes les catégories</SelectItem>
                            <SelectItem value="support">Support</SelectItem>
                            <SelectItem value="technical">Technique</SelectItem>
                            <SelectItem value="billing">Facturation</SelectItem>
                            <SelectItem value="general">Général</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select
                          value={messageFilterPriority}
                          onValueChange={(value: 'all' | MessagePriority) => {
                            setMessageFilterPriority(value)
                            const matches = getFilteredInternalMessages(messageFilterCategory, value, messageSearchTerm)
                            toast({
                              title: value === 'all' ? 'Triage réinitialisé' : 'Triage appliqué',
                              description: `${matches.length} message${matches.length > 1 ? 's' : ''} affiché${matches.length > 1 ? 's' : ''}`,
                              variant: 'default'
                            })
                          }}
                        >
                          <SelectTrigger className="sm:w-48">
                            <SelectValue placeholder="Trier par priorité" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Toutes les priorités</SelectItem>
                            <SelectItem value="high">Haute priorité</SelectItem>
                            <SelectItem value="medium">Moyenne priorité</SelectItem>
                            <SelectItem value="low">Basse priorité</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Liste des messages */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <span>Messages internes</span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors"
                          onClick={handleRefreshDashboard}
                          disabled={loading}
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Actualiser
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors"
                          onClick={handleMarkAllMessagesRead}
                          disabled={internalMessages.every(message => message.isRead)}
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Tout marquer comme lu
                        </Button>
                      </div>
                    </CardTitle>
                    <CardDescription>Gérez vos échanges avec l’équipe d’administration</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {filteredInternalMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 py-12 text-center text-gray-500">
                          <Mail className="mb-3 h-10 w-10 text-gray-400" />
                          <p className="font-medium">Aucun message trouvé</p>
                          <p className="text-sm text-gray-400">Ajustez vos filtres ou votre recherche pour afficher d’autres messages.</p>
                        </div>
                      ) : (
                        filteredInternalMessages.map(message => (
                          <Card
                            key={message.id}
                            className={`transition-shadow hover:shadow-md ${
                              !message.isRead ? 'border-l-4 border-l-blue-500 bg-blue-50' : ''
                            }`}
                          >
                            <CardContent className="p-6">
                              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                <div className="flex-1 space-y-3">
                                  <div className="flex flex-wrap items-center gap-3">
                                    <span
                                      className={`inline-block h-3 w-3 rounded-full ${
                                        message.priority === 'high'
                                          ? 'bg-red-500'
                                          : message.priority === 'medium'
                                          ? 'bg-yellow-500'
                                          : 'bg-green-500'
                                      }`}
                                    />
                                    <Badge variant="outline" className="text-xs">
                                      {message.category === 'support'
                                        ? 'Support'
                                        : message.category === 'technical'
                                        ? 'Technique'
                                        : message.category === 'billing'
                                        ? 'Facturation'
                                        : 'Général'}
                                    </Badge>
                                    <Badge variant={message.from === 'admin' ? 'default' : 'secondary'} className="text-xs">
                                      {message.from === 'admin' ? 'Administration' : 'Vous'}
                                    </Badge>
                                    {Boolean((message as any).isImportant ?? (message as any).is_important) && (
                                      <Star className="h-4 w-4 text-yellow-500" />
                                    )}
                                    {!message.isRead && (
                                      <Badge className="bg-blue-500 text-white text-xs capitalize">Nouveau</Badge>
                                    )}
                                  </div>
                                  <div>
                                    <h3 className="text-lg font-semibold text-gray-900">{message.subject}</h3>
                                    <p className="mt-1 text-sm text-gray-600">{message.content}</p>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                                    <span>{formatDate(message.timestamp, { hour: '2-digit', minute: '2-digit' })}</span>
                                    <span className="text-gray-300">•</span>
                                    <span>
                                      Priorité :
                                      {message.priority === 'high'
                                        ? ' Haute'
                                        : message.priority === 'medium'
                                        ? ' Moyenne'
                                        : ' Basse'}
                                    </span>
                                    <span className="text-gray-300">•</span>
                                    <span>
                                      Statut :
                                      {message.status === 'sent'
                                        ? ' Envoyé'
                                        : message.status === 'delivered'
                                        ? ' Livré'
                                        : ' Lu'}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 md:ml-4">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors"
                                    onClick={() => void handleOpenInternalMessage(message)}
                                  >
                                    <Eye className="mr-1 h-4 w-4" />
                                    Ouvrir
                                  </Button>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors"
                                        onClick={(event) => {
                                          event.stopPropagation()
                                        }}
                                      >
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        onClick={() => handleOpenInternalMessageEdit(message)}
                                        disabled={message.from !== 'user'}
                                      >
                                        Modifier
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setNewMessageSubject(`Re: ${message.subject}`)
                                          setNewMessageCategory(message.category)
                                          setNewMessagePriority(message.priority)
                                          setShowNewMessageModal(true)
                                        }}
                                        disabled={message.from === 'user'}
                                      >
                                        Répondre
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => void handleToggleInternalMessageImportant(message)}>
                                        {message.isImportant ? 'Retirer important' : 'Marquer important'}
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => void handleArchiveInternalMessage(message)}>Archiver</DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          if (typeof navigator !== 'undefined' && navigator.clipboard) {
                                            void navigator.clipboard.writeText(`${message.subject}\n\n${message.content}`)
                                          }
                                        }}
                                      >
                                        Copier le contenu
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => void handleDeleteInternalMessage(message)}>
                                        Supprimer
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Dialog open={showInternalMessageModal} onOpenChange={setShowInternalMessageModal}>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center justify-between">
                        <span>{selectedInternalMessage?.subject}</span>
                        <div className="flex items-center gap-2">
                          {selectedInternalMessage && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button type="button" variant="outline" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleOpenInternalMessageEdit(selectedInternalMessage)}
                                  disabled={selectedInternalMessage.from !== 'user'}
                                >
                                  Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setNewMessageSubject(`Re: ${selectedInternalMessage.subject}`)
                                    setNewMessageCategory(selectedInternalMessage.category)
                                    setNewMessagePriority(selectedInternalMessage.priority)
                                    setShowNewMessageModal(true)
                                    setShowInternalMessageModal(false)
                                  }}
                                  disabled={selectedInternalMessage.from === 'user'}
                                >
                                  Répondre
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => void handleToggleInternalMessageImportant(selectedInternalMessage)}>
                                  {selectedInternalMessage.isImportant ? 'Retirer important' : 'Marquer important'}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => void handleArchiveInternalMessage(selectedInternalMessage)}>
                                  Archiver
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    if (typeof navigator !== 'undefined' && navigator.clipboard) {
                                      void navigator.clipboard.writeText(
                                        `${selectedInternalMessage.subject}\n\n${selectedInternalMessage.content}`
                                      )
                                    }
                                  }}
                                >
                                  Copier le contenu
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => void handleDeleteInternalMessage(selectedInternalMessage)}>
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (!selectedInternalMessage) return
                              setNewMessageSubject(`Re: ${selectedInternalMessage.subject}`)
                              setNewMessageCategory(selectedInternalMessage.category)
                              setNewMessagePriority(selectedInternalMessage.priority)
                              setShowNewMessageModal(true)
                              setShowInternalMessageModal(false)
                            }}
                            disabled={!selectedInternalMessage || selectedInternalMessage.from === 'user'}
                          >
                            <CornerUpLeft className="mr-2 h-4 w-4" />
                            Répondre
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (!selectedInternalMessage) return
                              void handleArchiveInternalMessage(selectedInternalMessage)
                            }}
                            disabled={!selectedInternalMessage}
                          >
                            <Archive className="h-4 w-4" />
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (!selectedInternalMessage) return
                              void handleDeleteInternalMessage(selectedInternalMessage)
                            }}
                            disabled={!selectedInternalMessage}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </DialogTitle>
                    </DialogHeader>

                    {selectedInternalMessage && (
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3 pb-3 border-b">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-blue-700">
                              {String((selectedInternalMessage.from === 'admin' ? 'A' : 'V') ?? 'A')}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{selectedInternalMessage.from === 'admin' ? 'Administration' : 'Vous'}</p>
                            <p className="text-sm text-gray-500">
                              {formatDate(selectedInternalMessage.timestamp, { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>

                        <div className="prose max-w-none">
                          <p className="whitespace-pre-wrap">{selectedInternalMessage.content}</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-3 border-t">
                          <Badge variant="outline">{selectedInternalMessage.category}</Badge>
                          <Badge variant="outline">Priorité: {selectedInternalMessage.priority}</Badge>
                          {Boolean((selectedInternalMessage as any).isImportant ?? (selectedInternalMessage as any).is_important) && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-500" />
                              Important
                            </Badge>
                          )}
                          <Badge variant={selectedInternalMessage.isRead ? 'secondary' : 'default'}>
                            {selectedInternalMessage.isRead ? 'Lu' : 'Non lu'}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>

                <Dialog open={showInternalMessageEditModal} onOpenChange={setShowInternalMessageEditModal}>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Modifier le message</DialogTitle>
                      <DialogDescription>Modifiez votre message et synchronisez la mise à jour en base.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="editInternalMessageSubject">Sujet *</Label>
                        <Input
                          id="editInternalMessageSubject"
                          value={editInternalMessageSubject}
                          onChange={(e) => setEditInternalMessageSubject(e.target.value)}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="editInternalMessageContent">Contenu *</Label>
                        <Textarea
                          id="editInternalMessageContent"
                          value={editInternalMessageContent}
                          onChange={(e) => setEditInternalMessageContent(e.target.value)}
                          className="mt-1 min-h-[150px]"
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowInternalMessageEditModal(false)}
                          disabled={isUpdatingInternalMessage}
                        >
                          Annuler
                        </Button>
                        <Button
                          onClick={() => void handleSaveInternalMessageEdit()}
                          disabled={
                            isUpdatingInternalMessage ||
                            !editInternalMessageSubject.trim() ||
                            !editInternalMessageContent.trim()
                          }
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {isUpdatingInternalMessage ? 'Sauvegarde...' : 'Sauvegarder'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Actions rapides */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Zap className="w-5 h-5 text-orange-600" />
                      <span>Actions Rapides</span>
                    </CardTitle>
                    <CardDescription>Accédez rapidement aux fonctionnalités de messagerie</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start h-16 text-left"
                        onClick={() => setShowNewMessageModal(true)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Plus className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium">Nouveau Message</div>
                            <div className="text-xs text-gray-500">Créer un nouveau message</div>
                          </div>
                        </div>
                      </Button>
                      
                                             <Button 
                         variant="outline" 
                         className="w-full justify-start h-16 text-left"
                         onClick={() => {
                           // Pré-remplir le formulaire pour le support technique
                           setNewMessageSubject("Demande de support technique")
                           setNewMessageCategory("technical")
                           setNewMessagePriority("medium")
                           setNewMessageContent("Bonjour,\n\nJ'ai besoin d'assistance technique pour le problème suivant :\n\n[Veuillez décrire votre problème en détail]\n\nMerci de votre aide.")
                           setShowNewMessageModal(true)
                           
                           toast({
                             title: "Support technique !",
                             description: "Formulaire de support technique ouvert et pré-rempli",
                             variant: "default",
                           })
                         }}
                       >
                         <div className="flex items-center space-x-3">
                           <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                             <Headphones className="w-5 h-5 text-green-600" />
                           </div>
                           <div>
                             <div className="font-medium">Support Technique</div>
                             <div className="text-xs text-gray-500">Demande d'assistance</div>
                           </div>
                         </div>
                       </Button>
                      
                                             <Button 
                         variant="outline" 
                         className="w-full justify-start h-16 text-left"
                         onClick={() => {
                           // Pré-remplir le formulaire pour la facturation
                           setNewMessageSubject("Question concernant la facturation")
                           setNewMessageCategory("billing")
                           setNewMessagePriority("high")
                           setNewMessageContent("Bonjour,\n\nJ'ai une question concernant ma facturation :\n\n[Veuillez décrire votre problème de facturation en détail]\n\nMerci de votre aide.")
                           setShowNewMessageModal(true)
                           
                           toast({
                             title: "Facturation !",
                             description: "Formulaire de facturation ouvert et pré-rempli",
                             variant: "default",
                           })
                         }}
                       >
                         <div className="flex items-center space-x-3">
                           <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                             <CreditCard className="w-5 h-5 text-purple-600" />
                           </div>
                           <div>
                             <div className="font-medium">Question Facturation</div>
                             <div className="text-xs text-gray-500">Problème de paiement</div>
                           </div>
                         </div>
                       </Button>
                      
                                             <Button 
                         variant="outline" 
                         className="w-full justify-start h-16 text-left"
                         onClick={() => {
                           // Pré-remplir le formulaire pour la suggestion
                           setNewMessageSubject("Suggestion d'amélioration")
                           setNewMessageCategory("general")
                           setNewMessagePriority("low")
                           setNewMessageContent("Bonjour,\n\nJ'aimerais proposer la suggestion suivante pour améliorer la plateforme :\n\n[Veuillez décrire votre suggestion en détail]\n\nMerci de votre attention.")
                           setShowNewMessageModal(true)
                           
                           toast({
                             title: "Suggestion !",
                             description: "Formulaire de suggestion ouvert et pré-rempli",
                             variant: "default",
                           })
                         }}
                       >
                         <div className="flex items-center space-x-3">
                           <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                             <Lightbulb className="w-5 h-5 text-orange-600" />
                           </div>
                           <div>
                             <div className="font-medium">Suggestion</div>
                             <div className="text-xs text-gray-500">Proposer une amélioration</div>
                           </div>
                         </div>
                       </Button>
                      
                                             <Button 
                         variant="outline" 
                         className="w-full justify-start h-16 text-left"
                         onClick={() => {
                           // Pré-remplir le formulaire pour le signalement
                           setNewMessageSubject("Signalement d'un problème")
                           setNewMessageCategory("support")
                           setNewMessagePriority("high")
                           setNewMessageContent("Bonjour,\n\nJ'aimerais signaler le problème suivant :\n\n[Veuillez décrire le problème rencontré en détail]\n\nMerci de votre intervention rapide.")
                           setShowNewMessageModal(true)
                           
                           toast({
                             title: "Signalement !",
                             description: "Formulaire de signalement ouvert et pré-rempli",
                             variant: "default",
                           })
                         }}
                       >
                         <div className="flex items-center space-x-3">
                           <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                             <AlertTriangle className="w-5 h-5 text-red-600" />
                           </div>
                           <div>
                             <div className="font-medium">Signalement</div>
                             <div className="text-xs text-gray-500">Signaler un problème</div>
                           </div>
                         </div>
                       </Button>
                      
                                             <Button 
                         variant="outline" 
                         className="w-full justify-start h-16 text-left"
                         onClick={() => {
                           // Ouvrir la FAQ dans une nouvelle fenêtre
                           const faqWindow = window.open('/faq', '_blank', 'width=800,height=600')
                           
                           if (faqWindow) {
                             toast({
                               title: "FAQ ouverte !",
                               description: "La FAQ a été ouverte dans une nouvelle fenêtre",
                               variant: "default",
                             })
                           } else {
                             // Si la popup est bloquée, afficher un message informatif
                             toast({
                               title: "FAQ !",
                               description: "Voici les questions fréquentes les plus courantes",
                               variant: "default",
                             })
                             
                             // Afficher une FAQ simple dans un toast étendu
                             setTimeout(() => {
                               toast({
                                 title: "Questions Fréquentes",
                                 description: "1. Comment créer un compte ?\n2. Comment récupérer mon mot de passe ?\n3. Comment contacter le support ?\n4. Quels sont les délais de livraison ?",
                                 variant: "default",
                               })
                             }, 1000)
                           }
                         }}
                       >
                         <div className="flex items-center space-x-3">
                           <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                             <HelpCircle className="w-5 h-5 text-indigo-600" />
                           </div>
                           <div>
                             <div className="font-medium">FAQ</div>
                             <div className="text-xs text-gray-500">Questions fréquentes</div>
                           </div>
                         </div>
                       </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'recommendations' && (
              <div className="space-y-6">
                {!privacyPrefs.personalizedRecommendations ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        <span>Recommandations IA</span>
                      </CardTitle>
                      <CardDescription>
                        La personnalisation des recommandations est désactivée dans vos paramètres de confidentialité.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ) : (
                  <>
                    {/* En-tête avec statistiques IA */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card 
                    className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105"
                    onClick={() => {
                      toast({
                        title: "Statistiques IA",
                        description: `Précision IA: ${aiPrecisionPercent}% - Basée sur les scores de confiance de vos recommandations actives`,
                        variant: "default",
                      })
                    }}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-purple-700">Précision IA</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-purple-900">{aiPrecisionPercent}%</div>
                        <Sparkles className="w-8 h-8 text-purple-600" />
                      </div>
                      <p className="text-xs text-purple-600 mt-2">Taux de satisfaction</p>
                    </CardContent>
                  </Card>

                  <Card 
                    className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105"
                    onClick={() => {
                      setAiRecommendationFilter('products')
                      toast({
                        title: "Filtre appliqué",
                        description: "Affichage des produits recommandés uniquement",
                        variant: "default",
                      })
                    }}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-blue-700">Produits Recommandés</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-blue-900">{realRecommendedProducts.length}</div>
                        <Package className="w-8 h-8 text-blue-600" />
                      </div>
                      <p className="text-xs text-blue-600 mt-2">Total enregistré</p>
                    </CardContent>
                  </Card>

                  <Card 
                    className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105"
                    onClick={() => {
                      setAiRecommendationFilter('sellers')
                      toast({
                        title: "Filtre appliqué",
                        description: "Affichage des vendeurs recommandés uniquement",
                        variant: "default",
                      })
                    }}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-green-700">Vendeurs Recommandés</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-green-900">{realRecommendedSellers.length}</div>
                        <Users className="w-8 h-8 text-green-600" />
                      </div>
                      <p className="text-xs text-green-600 mt-2">Basés sur vos préférences</p>
                    </CardContent>
                  </Card>

                  <Card 
                    className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105"
                    onClick={() => {
                      setAiRecommendationFilter('promotions')
                      toast({
                        title: "Filtre appliqué",
                        description: "Affichage des promotions détectées uniquement",
                        variant: "default",
                      })
                    }}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-orange-700">Promotions Détectées</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-orange-900">{realRecommendedPromotions.length}</div>
                        <Tag className="w-8 h-8 text-orange-600" />
                      </div>
                      <p className="text-xs text-orange-600 mt-2">Applicables à vos produits</p>
                    </CardContent>
                  </Card>
                </div>

                    {/* Filtres et contrôles */}
                    <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center space-x-2">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        <span>Recommandations IA</span>
                      </span>
                      <div className="flex items-center space-x-2">
                        <Select value={aiRecommendationFilter} onValueChange={setAiRecommendationFilter}>
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Filtrer par type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Toutes les recommandations</SelectItem>
                            <SelectItem value="products">Produits uniquement</SelectItem>
                            <SelectItem value="sellers">Vendeurs uniquement</SelectItem>
                            <SelectItem value="promotions">Promotions uniquement</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button 
                          variant="outline" 
                          size="sm"
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            void refreshAiRecommendations()
                          }}
                          disabled={isRefreshingAiRecommendations || !privacyPrefs.personalizedRecommendations}
                          className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors"
                        >
                          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshingAiRecommendations ? 'animate-spin' : ''}`} />
                          Actualiser
                        </Button>
                      </div>
                    </CardTitle>
                    <CardDescription>
                      Découvrez des produits et vendeurs personnalisés grâce à notre IA avancée
                    </CardDescription>
                  </CardHeader>
                </Card>

                    {/* Produits recommandés */}
                    {(aiRecommendationFilter === 'all' || aiRecommendationFilter === 'products') && (
                      <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Package className="w-5 h-5 text-blue-600" />
                          <span>Produits Recommandés pour Vous</span>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            toast({
                              title: "Navigation",
                              description: "Redirection vers la page des produits",
                              variant: "default",
                            })
                            setTimeout(() => {
                              router.push('/products')
                            }, 1000)
                          }}
                          className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors"
                        >
                          Voir tout <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </CardTitle>
                      <CardDescription>
                        Basé sur vos recherches, achats et préférences
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {dashboardData?.recommendedProducts?.map((product) => (
                                <Card key={product.id} className="hover:shadow-lg transition-all duration-300 hover:scale-105">
                                  <AdvancedProductCard 
                                    product={{
                                      ...product,
                                      pointsPrice: getComputedPointsPrice(product.price),
                                      sharePoints: 0,
                                      shares: shareStatsMap[String(product.id)]?.total || 0,
                                      badges: [],
                                      color: 'blue',
                                      seller: product.seller || 'Boutique',
                                      inStock: true,
                                      discount: product.promotion ? 10 : 0,
                                      rating: product.rating || 5,
                                      reviews: product.reviews || 0,
                                      image: product.image || '/placeholder.svg',
                                      isHot: false,
                                      isNew: false,
                                      isLimited: false
                                    }}
                                    onBuyWithPoints={() => {
                                      setSelectedProduct(product)
                                      setShowProductDetailsModal(true)
                                    }}
                                    onCompare={() => {
                                      toast({ title: "Comparaison", description: "Produit ajouté au comparateur" })
                                    }}
                                  />
                                </Card>
                        ))}
                      </div>
                    </CardContent>
                      </Card>
                    )}

                    {/* Vendeurs recommandés */}
                    {(aiRecommendationFilter === 'all' || aiRecommendationFilter === 'sellers') && (
                      <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Users className="w-5 h-5 text-green-600" />
                          <span>Vendeurs Recommandés</span>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            toast({
                              title: "Navigation",
                              description: "Redirection vers la page des vendeurs",
                              variant: "default",
                            })
                            setTimeout(() => {
                              router.push('/sellers')
                            }, 1000)
                          }}
                          className="hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300 transition-colors"
                        >
                          Voir tout <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </CardTitle>
                      <CardDescription>
                        Vendeurs de confiance dans vos catégories préférées
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {dashboardData?.recommendedSellers?.map((seller) => (
                          <Card key={seller.id} className="hover:shadow-lg transition-all duration-300">
                            <CardContent className="p-6">
                              <div className="flex items-center space-x-4 mb-4">
                                <Avatar className="w-16 h-16">
                                  <AvatarImage src={seller.avatar} />
                                  <AvatarFallback>{seller.name && seller.name.length > 0 ? seller.name[0] : '?'}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <h3 
                                    className="font-semibold text-lg cursor-pointer hover:text-blue-600 transition-colors duration-300"
                                    onClick={() => router.push(`/seller/${seller.id}`)}
                                  >
                                    {seller.name}
                                  </h3>
                                  <div className="flex items-center space-x-2">
                                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                    <span className="text-sm font-medium">{seller.rating}</span>
                                    <Badge className="bg-green-100 text-green-800">
                                      IA: {seller.aiConfidence}%
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <p className="text-gray-600">Ventes totales</p>
                                    <p className="font-medium">{seller.totalSales.toLocaleString()}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-600">Temps de réponse</p>
                                    <p className="font-medium">{seller.responseTime}</p>
                                  </div>
                                </div>
                                
                                <div>
                                  <p className="text-sm text-gray-600 mb-2">Spécialités:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {seller.specialties.map((specialty, index) => (
                                      <Badge key={index} variant="outline" className="text-xs">
                                        {specialty}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                
                                <div className="p-3 bg-green-50 rounded-lg">
                                  <p className="text-xs text-green-700 font-medium">Pourquoi ce vendeur ?</p>
                                  <p className="text-xs text-green-600 mt-1">{seller.aiReason}</p>
                                </div>
                                
                                <div className="flex space-x-2">
                                  <Button 
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                    onClick={() => contactSeller(seller)}
                                  >
                                    <MessageCircle className="w-4 h-4 mr-2" />
                                    Contacter
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      // Ouvrir la modal de détails du vendeur
                                      setSelectedSeller(seller)
                                      setShowSellerDetailsModal(true)
                                    }}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => toggleSellerFollow(seller.id)}
                                    className={sellerFollowStatus[seller.id] ? 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100' : ''}
                                  >
                                    <Heart className={`w-4 h-4 ${sellerFollowStatus[seller.id] ? 'fill-current' : ''}`} />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Promotions détectées par IA */}
                {(aiRecommendationFilter === 'all' || aiRecommendationFilter === 'promotions') && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Tag className="w-5 h-5 text-orange-600" />
                        <span>Promotions Détectées par IA</span>
                      </CardTitle>
                      <CardDescription>
                        Promotions applicables à vos produits favoris
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {(realRecommendedPromotions as any[])?.slice(0, 3)?.map((promotion) => (
                          <Card key={promotion.id} className="border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50">
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3 mb-3">
                                    <h3 className="font-bold text-lg">{promotion.title}</h3>
                                    <Badge className="bg-orange-500 text-white animate-pulse">
                                      {promotion.value ?? 'Promo'}
                                    </Badge>
                                    <Badge className="bg-purple-500 text-white">
                                      IA Détectée
                                    </Badge>
                                  </div>
                                  
                                  {(() => {
                                    const reasons = getAiPromotionReasons(promotion.description || promotion.aiReason || '')
                                    if (reasons.length === 0) {
                                      const fallback = formatAiPromotionText(promotion.description || promotion.aiReason || '')
                                      return fallback ? <p className="text-gray-600 mb-4">{fallback}</p> : null
                                    }
                                    return (
                                      <ul className="text-gray-600 mb-4 space-y-1">
                                        {reasons.slice(0, 4).map((reason, idx) => (
                                          <li key={`${promotion.id}-reason-${idx}`} className="flex items-start space-x-2">
                                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2" />
                                            <span>{reason}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    )
                                  })()}
                                  
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                      <p className="text-gray-600">Utilisations</p>
                                      <p className="font-medium">{Number((promotion as any)?.usageCount ?? 0)}</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-600">Fin</p>
                                      <p className="font-medium">{formatDate((promotion as any)?.endDate ?? null)}</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-600">Priorité</p>
                                      <p className="font-medium">{Number((promotion as any)?.priority ?? 1)}/5</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-600">Statut</p>
                                      <Badge
                                        className={(promotion as any)?.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                                      >
                                        {(promotion as any)?.isActive ? 'Active' : 'Expirée'}
                                      </Badge>
                                    </div>
                                  </div>
                                  
                                  {Array.isArray((promotion as any)?.conditions) && (promotion as any).conditions.length > 0 && (
                                    <div className="mt-4">
                                      <p className="text-sm font-medium text-gray-700 mb-2">Conditions:</p>
                                      <ul className="text-sm text-gray-600 space-y-1">
                                        {(promotion as any).conditions.map((condition: any, index: number) => (
                                          <li key={index} className="flex items-center space-x-2">
                                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                                            <span>{condition}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="ml-6 flex flex-col space-y-2">
                                  <Button 
                                    className={`text-white ${
                                      promotion.priority === 1 ? 'bg-red-600 hover:bg-red-700 animate-pulse' :
                                      promotion.priority === 2 ? 'bg-orange-600 hover:bg-orange-700' :
                                      'bg-blue-600 hover:bg-blue-700'
                                    }`}
                                    size="lg"
                                    onClick={() => applyPromotion(promotion)}
                                  >
                                    <Tag className="w-5 h-5 mr-2" />
                                    En profiter
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => sharePromotion(promotion)}
                                  >
                                    <Share2 className="w-4 h-4 mr-2" />
                                    Partager
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => togglePromotionFavorite(promotion.id)}
                                    className={promotionFavorites.includes(promotion.id) ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100' : ''}
                                  >
                                    <Heart className={`w-4 h-4 mr-2 ${promotionFavorites.includes(promotion.id) ? 'fill-current' : ''}`} />
                                    {promotionFavorites.includes(promotion.id) ? 'Retirer' : 'Favoris'}
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === 'promotions' && (
              <div className="space-y-6">
                {/* En-tête avec statistiques des promotions */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card className={`bg-gradient-to-br from-red-50 to-red-100 border-red-200 ${promotionsStatsLoading ? 'animate-pulse' : ''}`}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-red-700">Promotions Actives</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-red-900">{promotionsStats?.activePromotionsTotal ?? (offersCount + specialsCount)}</div>
                        <Tag className="w-8 h-8 text-red-600 animate-bounce" />
                      </div>
                      <p className="text-xs text-red-600 mt-2">En cours actuellement</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-green-700">Économies Totales</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex flex-col min-w-0">
                          <div className="text-base md:text-xl font-bold text-green-900 truncate">
                            {formatCurrency(promotionsStats?.totalSavingsFcfa ?? 0)}
                          </div>
                          <div className="text-xs md:text-sm text-[#ff6600] font-medium truncate">
                            {(promotionsStats?.totalSavingsPoints ?? 0).toLocaleString()} pts
                          </div>
                        </div>
                        <TrendingDown className="w-8 h-8 text-green-600 shrink-0" />
                      </div>
                      <p className="text-xs text-green-600 mt-2">Remises disponibles actuellement</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-blue-700">Flash Sales</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-blue-900">{promotionsStats?.flashSalesActive ?? 0}</div>
                        <Zap className="w-8 h-8 text-blue-600 animate-pulse" />
                      </div>
                      <p className="text-xs text-blue-600 mt-2">En cours</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-purple-700">Points Bonus</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-purple-900">x{Math.max(1, promotionsStats?.pointsMultiplier ?? 1)}</div>
                        <Gift className="w-8 h-8 text-purple-600" />
                      </div>
                      <p className="text-xs text-purple-600 mt-2">Multiplicateur actuel</p>
                    </CardContent>
                  </Card>
                </div>

                <Tabs defaultValue="offers" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-2 bg-white border border-gray-200">
                    <TabsTrigger value="offers">
                      <span className="inline-flex items-center gap-2">
                        <Badge className="bg-gray-100 text-gray-700 border border-gray-200">{offersCount}</Badge>
                        <span>Offres promotionnelles</span>
                      </span>
                    </TabsTrigger>
                    <TabsTrigger value="specials">
                      <span className="inline-flex items-center gap-2">
                        <Badge className="bg-gray-100 text-gray-700 border border-gray-200">{specialsCount}</Badge>
                        <span>Promotions spéciales</span>
                      </span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="offers">
                    {/* Filtres et recherche */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span className="flex items-center space-x-2">
                            <Tag className="w-5 h-5 text-orange-600" />
                            <span>Offres Promotionnelles</span>
                          </span>
                          <div className="flex items-center space-x-2">
                            <Select value={selectedPromotionType} onValueChange={setSelectedPromotionType}>
                              <SelectTrigger className="w-48">
                                <SelectValue placeholder="Filtrer par type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">Toutes les promotions</SelectItem>
                                <SelectItem value="flash">Flash Sales</SelectItem>
                                <SelectItem value="discount">Réductions</SelectItem>
                                <SelectItem value="bundle">Bundles</SelectItem>
                                <SelectItem value="points">Points Bonus</SelectItem>
                                <SelectItem value="shipping">Livraison</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => exportPromotions()}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Exporter
                            </Button>
                          </div>
                        </CardTitle>
                        <CardDescription>
                          Découvrez toutes nos offres promotionnelles et économisez sur vos achats
                        </CardDescription>
                      </CardHeader>
                    </Card>

                    {/* Promotions principales avec animations (données réelles depuis /api/public/offers) */}
                    <ClientOffersSection onCountChange={setOffersCount} />
                  </TabsContent>

                  <TabsContent value="specials">
                    {/* Promotions spéciales dynamiques (special_promotions) */}
                    <ClientSpecialPromotionsSection onCountChange={setSpecialsCount} />
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {activeTab === 'in_app_notifications' && (
              <div className="space-y-6">
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Bell className="w-5 h-5 text-[#ff6600]" />
                        Notifications
                      </span>
                      {unreadNotifications > 0 && (
                        <Badge className="bg-red-100 text-red-800 border-red-200">
                          {unreadNotifications} non lue(s)
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>Recevez les notifications in-app envoyées par l'administration.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-3 pb-3">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div className="w-full md:w-64">
                          <Select value={clientInAppNotificationCategory} onValueChange={setClientInAppNotificationCategory}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Toutes les catégories" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Toutes les catégories</SelectItem>
                              {clientInAppNotificationCategories.map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleMarkAllNotificationsRead}
                            disabled={unreadNotifications === 0}
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Tout marquer comme lu
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDeleteReadNotifications}
                            disabled={notifications.every((n) => Boolean((n as any)?.isRead) === false)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Supprimer lus
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {filteredClientInAppNotifications.length === 0 ? (
                        <div className="text-sm text-gray-500">Aucune notification pour le moment.</div>
                      ) : (
                        filteredClientInAppNotifications.map((notification) => {
                          const isRead = Boolean((notification as any)?.isRead)
                          const actionUrl = (notification as any)?.actionUrl ?? undefined
                          return (
                            <div
                              key={notification.id}
                              className={`flex items-start space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 ${
                                !isRead ? 'bg-orange-50/50 border-orange-200' : ''
                              }`}
                            >
                              <div
                                className={`w-2 h-2 rounded-full mt-2 ${
                                  notification.type === 'promotion'
                                    ? 'bg-[#ff6600]'
                                    : notification.type === 'success'
                                      ? 'bg-green-500'
                                      : notification.type === 'warning'
                                        ? 'bg-yellow-500'
                                        : notification.type === 'error'
                                          ? 'bg-red-500'
                                          : 'bg-[#3b82f6]'
                                }`}
                              ></div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{notification.title || 'Notification'}</p>
                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notification.message}</p>
                                    <p className="text-[11px] text-gray-400 mt-1">{formatDate(notification.timestamp)}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {!isRead && <Badge className="text-xs bg-orange-100 text-orange-800">Nouveau</Badge>}
                                  </div>
                                </div>

                                <div className="flex items-center justify-between mt-2">
                                  <div className="flex items-center gap-2">
                                    {actionUrl ? (
                                      <a
                                        href={String(actionUrl)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs text-blue-600 hover:underline"
                                      >
                                        Ouvrir
                                      </a>
                                    ) : null}
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-8"
                                      onClick={() => {
                                        if (!isRead) void handleToggleNotificationRead(notification)
                                      }}
                                      disabled={isRead}
                                    >
                                      <Check className="w-4 h-4 mr-2" />
                                      Lire
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-8 hover:bg-red-50 hover:border-red-200"
                                      onClick={() => void handleDeleteNotification(notification)}
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Supprimer
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                {/* En-tête avec statistiques des notifications */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-[#ff6600] border-opacity-30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-[#ff6600]">Total Notifications</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-[#535455]">{notificationStats?.total ?? notificationsByPreferences.length}</div>
                        <Bell className="w-8 h-8 text-[#ff6600]" />
                      </div>
                      <p className="text-xs text-[#ff6600] mt-2">Toutes les notifications</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-red-700">Non Lues</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-red-900">
                          {notificationStats?.unread ?? notificationsByPreferences.filter(n => !n.isRead).length}
                        </div>
                        <AlertCircle className="w-8 h-8 text-red-600" />
                      </div>
                      <p className="text-xs text-red-600 mt-2">Nécessitent attention</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-[#535455] border-opacity-30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-[#535455]">Promotions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-[#535455]">
                          {notificationStats?.promotions ?? notificationsByPreferences.filter(n => n.category === 'promotions').length}
                        </div>
                        <Tag className="w-8 h-8 text-[#ff6600]" />
                      </div>
                      <p className="text-xs text-[#535455] mt-2">Offres spéciales</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-[#ff6600] border-opacity-30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-[#ff6600]">Commandes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-[#535455]">
                          {notificationStats?.orders ?? notificationsByPreferences.filter(n => n.category === 'orders').length}
                        </div>
                        <Package className="w-8 h-8 text-[#ff6600]" />
                      </div>
                      <p className="text-xs text-[#ff6600] mt-2">Suivi des commandes</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Contrôles et filtres */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center space-x-2">
                        <Bell className="w-5 h-5 text-blue-600" />
                        <span>Gestion des Notifications</span>
                      </span>
                    </CardTitle>
                    <CardDescription>
                      Gérez vos notifications et préférences de communication
                    </CardDescription>
                  </CardHeader>
                </Card>

                {/* Liste des notifications */}
                <Card>
                  <CardContent className="p-0">
                    <div className="space-y-1">
                      {notificationsForDisplay
                        .map((notification) => (
                          <div 
                            key={notification.id} 
                            className={`p-4 border-b last:border-b-0 hover:bg-gray-50 transition-colors ${
                              !notification.isRead ? 'bg-orange-50 border-l-4 border-l-[#ff6600]' : ''
                            }`}
                          >
                            <div className="flex items-start space-x-4">
                              <div className={`w-3 h-3 rounded-full mt-2 ${
                                notification.type === 'promotion' ? 'bg-[#ff6600]' :
                                notification.type === 'success' ? 'bg-green-500' :
                                notification.type === 'warning' ? 'bg-yellow-500' :
                                notification.type === 'error' ? 'bg-red-500' :
                                'bg-[#535455]'
                              }`}></div>
                              
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center space-x-3">
                                    <h4 className="font-medium text-gray-900 dark:text-gray-900">{notification.title}</h4>
                                    {!notification.isRead && (
                                      <Badge className="bg-[#ff6600] text-white text-xs">
                                        Nouveau
                                      </Badge>
                                    )}
                                    <Badge className={`text-xs ${
                                      notification.priority === 'high' ? 'bg-red-100 text-red-800' :
                                      notification.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {notification.priority === 'high' ? 'Haute' :
                                       notification.priority === 'medium' ? 'Moyenne' : 'Basse'}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs text-gray-500 dark:text-gray-600">
                                      {formatDate(notification.timestamp)}
                                    </span>
                                    <div className="relative">
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => {
                                          setShowNotificationActions(prev => ({
                                            ...prev,
                                            [notification.id]: !prev[notification.id]
                                          }))
                                        }}
                                      >
                                        <MoreVertical className="w-4 h-4" />
                                      </Button>
                                      
                                      {showNotificationActions[notification.id] && (
                                        <div className="absolute right-0 top-8 bg-white border rounded-lg shadow-lg z-50 w-48 text-gray-900 dark:text-gray-900">
                                          <div className="p-1">
                                            <button
                                              className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-50 rounded"
                                              onClick={async () => {
                                                await handleToggleNotificationRead(notification)
                                                setShowNotificationActions(prev => ({ ...prev, [notification.id]: false }))
                                              }}
                                            >
                                              <Check className="w-4 h-4" />
                                              <span>{notification.isRead ? 'Marquer non lu' : 'Marquer lu'}</span>
                                            </button>
                                            <button
                                              className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-50 rounded text-red-600"
                                              onClick={async () => {
                                                await handleDeleteNotification(notification)
                                                setShowNotificationActions(prev => ({ ...prev, [notification.id]: false }))
                                              }}
                                            >
                                              <Trash2 className="w-4 h-4" />
                                              <span>Supprimer</span>
                                            </button>
                                            <button
                                              className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-50 rounded text-[#ff6600]"
                                              onClick={() => {
                                                navigator.clipboard.writeText(notification.message)
                                                setShowNotificationActions(prev => ({ ...prev, [notification.id]: false }))
                                                toast({
                                                  title: "Message copié !",
                                                  description: "Le message a été copié dans le presse-papiers",
                                                  variant: "default",
                                                })
                                              }}
                                            >
                                              <Copy className="w-4 h-4" />
                                              <span>Copier</span>
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                <p className="text-gray-600 dark:text-gray-600 mb-3">{notification.message}</p>
                                
                                {notification.actionUrl && notification.actionText && (
                                  <div className="flex items-center space-x-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="text-[#ff6600] border-[#ff6600] hover:bg-[#ff6600] hover:text-white transition-colors"
                                      onClick={() => {
                                        // Ouvrir la mini-modale appropriée selon l'action
                                        if (notification.actionText === "Voir la commande") {
                                          // Simuler une commande pour la démo
                                          const demoOrder: Order = {
                                            id: "ORD-001",
                                            items: [{ 
                                              id: 1,
                                              name: "Smartphone Samsung Galaxy", 
                                              price: 45000, 
                                              quantity: 1,
                                              image: "/placeholder.jpg",
                                              seller: "TechStore"
                                            }],
                                            total: 45000,
                                            status: "delivered",
                                            createdAt: "2024-01-15"
                                          }
                                          setSelectedOrder(demoOrder)
                                          setShowOrderDetailsModal(true)
                                        } else if (notification.actionText === "Voir mes points") {
                                          setShowPointsDetailsModal(true)
                                        } else if (notification.actionText === "Voir la promotion") {
                                          // Simuler une promotion pour la démo
                                          const demoPromotion = {
                                            title: "Flash Sale - Smartphones",
                                            description: "25% de réduction sur tous les smartphones",
                                            endDate: "2024-01-25",
                                            code: "FLASH25",
                                            type: "flash",
                                            priority: 1,
                                            maxUsage: 100,
                                            usageCount: 45
                                          }
                                          setSelectedPromotion(demoPromotion)
                                          setShowPromotionModal(true)
                                        } else if (notification.actionText === "En profiter") {
                                          // Simuler une promotion pour la démo
                                          const demoPromotion = {
                                            title: "Promotion Spéciale",
                                            description: "20% de réduction sur tous les smartphones",
                                            endDate: "2024-01-31",
                                            code: "SMART20"
                                          }
                                          setSelectedPromotion(demoPromotion)
                                          setShowPromotionModal(true)
                                        } else {
                                          // Action par défaut
                                          toast({
                                            title: "Action exécutée !",
                                            description: `Action "${notification.actionText}" exécutée avec succès`,
                                            variant: "default",
                                          })
                                        }
                                        
                                        // Marquer comme lu après l'action
                                        const updatedNotifications = notifications.map(n => 
                                          n.id === notification.id ? { ...n, isRead: true } : n
                                        )
                                        setNotifications(updatedNotifications)
                                      }}
                                    >
                                      {notification.actionText}
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      className="hover:bg-green-50 hover:text-green-600 transition-colors"
                                      onClick={() => {
                                        // Marquer la notification comme lue
                                        const updatedNotifications = notifications.map(n => 
                                          n.id === notification.id ? { ...n, isRead: true } : n
                                        )
                                        setNotifications(updatedNotifications)
                                        if (!notification.isRead) {
                                          setUnreadNotifications(prev => Math.max(0, prev - 1))
                                        }
                                        toast({
                                          title: "Notification marquée !",
                                          description: `"${notification.title}" a été marquée comme lue`,
                                          variant: "default",
                                        })
                                      }}
                                    >
                                      <Check className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      className="hover:bg-red-50 hover:text-red-600 transition-colors"
                                      onClick={() => {
                                        // Supprimer la notification
                                        const updatedNotifications = notifications.filter(n => n.id !== notification.id)
                                        setNotifications(updatedNotifications)
                                        if (!notification.isRead) {
                                          setUnreadNotifications(prev => Math.max(0, prev - 1))
                                        }
                                        toast({
                                          title: "Notification supprimée !",
                                          description: `"${notification.title}" a été supprimée`,
                                          variant: "default",
                                        })
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Paramètres de notifications */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Settings className="w-5 h-5 text-gray-600" />
                      <span>Paramètres de Notifications</span>
                    </CardTitle>
                    <CardDescription>
                      Configurez vos préférences de notifications
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Canaux de notification */}
                      <div>
                        <h4 className="font-medium mb-4 text-gray-900 dark:text-slate-100">Canaux de notification</h4>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Mail className="w-5 h-5 text-[#ff6600]" />
                              <div>
                                <p className="font-medium text-gray-900 dark:text-gray-900">Notifications par email</p>
                                <p className="text-sm text-[#535455] dark:text-gray-600">Recevez des notifications par email</p>
                              </div>
                            </div>
                            <Switch 
                              checked={notificationSettings.email}
                              onCheckedChange={(checked) => setNotificationToggle('email', checked)}
                            />
                          </div>
                          
                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Bell className="w-5 h-5 text-[#ff6600]" />
                              <div>
                                <p className="font-medium text-gray-900 dark:text-gray-900">Notifications push</p>
                                <p className="text-sm text-[#535455] dark:text-gray-600">Notifications sur votre navigateur</p>
                              </div>
                            </div>
                            <Switch 
                              checked={notificationSettings.push}
                              onCheckedChange={(checked) => setNotificationToggle('push', checked)}
                            />
                          </div>
                          
                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Smartphone className="w-5 h-5 text-[#ff6600]" />
                              <div>
                                <p className="font-medium text-gray-900 dark:text-gray-900">Notifications SMS</p>
                                <p className="text-sm text-[#535455] dark:text-gray-600">Recevez des SMS importants</p>
                              </div>
                            </div>
                            <Switch 
                              checked={notificationSettings.sms}
                              onCheckedChange={(checked) => setNotificationToggle('sms', checked)}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      {/* Types de notifications */}
                      <div>
                        <h4 className="font-medium mb-4 text-gray-900 dark:text-slate-100">Types de notifications</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Package className="w-4 h-4 text-[#ff6600]" />
                              <span className="text-sm text-gray-900 dark:text-gray-900">Commandes</span>
                            </div>
                            <Switch 
                              checked={notificationSettings.orders}
                              onCheckedChange={(checked) => setNotificationToggle('orders', checked)}
                            />
                          </div>
                          
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Gift className="w-4 h-4 text-[#ff6600]" />
                              <span className="text-sm text-gray-900 dark:text-gray-900">Points de fidélité</span>
                            </div>
                            <Switch 
                              checked={notificationSettings.points}
                              onCheckedChange={(checked) => setNotificationToggle('points', checked)}
                            />
                          </div>
                          
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <MessageCircle className="w-4 h-4 text-[#ff6600]" />
                              <span className="text-sm text-gray-900 dark:text-gray-900">Messages chat</span>
                            </div>
                            <Switch 
                              checked={notificationSettings.chat}
                              onCheckedChange={(checked) => setNotificationToggle('chat', checked)}
                            />
                          </div>
                          
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Tag className="w-4 h-4 text-[#ff6600]" />
                              <span className="text-sm text-gray-900 dark:text-gray-900">Promotions</span>
                            </div>
                            <Switch 
                              checked={notificationSettings.promotions}
                              onCheckedChange={(checked) => setNotificationToggle('promotions', checked)}
                            />
                          </div>
                          
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Settings className="w-4 h-4 text-[#535455]" />
                              <span className="text-sm text-gray-900 dark:text-gray-900">Système</span>
                            </div>
                            <Switch 
                              checked={notificationSettings.system}
                              onCheckedChange={(checked) => setNotificationToggle('system', checked)}
                            />
                          </div>
                          
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <TrendingUp className="w-4 h-4 text-[#ff6600]" />
                              <span className="text-sm text-gray-900 dark:text-gray-900">Recommandations IA</span>
                            </div>
                            <Switch 
                              checked={notificationSettings.ai}
                              onCheckedChange={(checked) => setNotificationToggle('ai', checked)}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      {/* Fréquence et timing */}
                      <div>
                        <h4 className="font-medium mb-4 text-gray-900 dark:text-slate-100">Fréquence et timing</h4>
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium">Fréquence des résumés</Label>
                            <Select value={notificationFrequency} onValueChange={setNotificationFrequency}>
                              <SelectTrigger className="mt-2 border-[#ff6600] focus:ring-[#ff6600]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="immediate">Immédiat</SelectItem>
                                <SelectItem value="hourly">Toutes les heures</SelectItem>
                                <SelectItem value="daily">Quotidien</SelectItem>
                                <SelectItem value="weekly">Hebdomadaire</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label className="text-sm font-medium">Heures de réception</Label>
                            <div className="flex items-center space-x-4 mt-2">
                              <Select value={notificationStartTime} onValueChange={setNotificationStartTime}>
                                <SelectTrigger className="w-32 border-[#ff6600] focus:ring-[#ff6600]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="06:00">06:00</SelectItem>
                                  <SelectItem value="07:00">07:00</SelectItem>
                                  <SelectItem value="08:00">08:00</SelectItem>
                                  <SelectItem value="09:00">09:00</SelectItem>
                                  <SelectItem value="10:00">10:00</SelectItem>
                                </SelectContent>
                              </Select>
                              <span className="text-[#535455]">à</span>
                              <Select value={notificationEndTime} onValueChange={setNotificationEndTime}>
                                <SelectTrigger className="w-32 border-[#ff6600] focus:ring-[#ff6600]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="18:00">18:00</SelectItem>
                                  <SelectItem value="19:00">19:00</SelectItem>
                                  <SelectItem value="20:00">20:00</SelectItem>
                                  <SelectItem value="21:00">21:00</SelectItem>
                                  <SelectItem value="22:00">22:00</SelectItem>
                                  <SelectItem value="23:00">23:00</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          {/* Bouton de sauvegarde des paramètres */}
                          <div className="pt-4">
                            {notificationPrefsFeedback && (
                              <div
                                className={`mb-3 flex items-start gap-3 rounded-lg border p-3 transition-all ${
                                  notificationPrefsFeedback.type === 'success'
                                    ? 'border-green-200 bg-green-50 text-green-800'
                                    : 'border-red-200 bg-red-50 text-red-800'
                                }`}
                              >
                                <div className="mt-0.5">
                                  {notificationPrefsFeedback.type === 'success' ? (
                                    <CheckCircle className="h-5 w-5" />
                                  ) : (
                                    <AlertCircle className="h-5 w-5" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium">{notificationPrefsFeedback.title}</div>
                                  <div className="text-sm opacity-90">{notificationPrefsFeedback.description}</div>
                                </div>
                              </div>
                            )}
                            <Button 
                              className="w-full bg-[#ff6600] hover:bg-[#e55a00] text-white transition-colors"
                              onClick={async () => {
                                setIsSavingNotificationPrefs(true)
                                setNotificationPrefsFeedback(null)

                                // Backup localStorage (sécurité) + persistance Supabase
                                try {
                                  if (typeof window !== 'undefined') {
                                    window.localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings))
                                    window.localStorage.setItem('notificationFrequency', notificationFrequency)
                                    window.localStorage.setItem('notificationStartTime', notificationStartTime)
                                    window.localStorage.setItem('notificationEndTime', notificationEndTime)
                                  }
                                } catch {
                                  // ignore
                                }

                                if (!user?.id) {
                                  toast({
                                    title: 'Action impossible',
                                    description: 'Veuillez vous reconnecter pour sauvegarder vos préférences.',
                                    variant: 'destructive'
                                  })
                                  setIsSavingNotificationPrefs(false)
                                  return
                                }

                                try {
                                  const { preferences } = await DashboardService.updateNotificationPreferences({
                                    userId: user.id,
                                    notificationSettings,
                                    notificationFrequency,
                                    notificationStartTime,
                                    notificationEndTime
                                  })

                                  setDashboardDataRaw((prev) => {
                                    if (!prev) return prev
                                    const nextUserProfile = {
                                      ...(prev as any).userProfile,
                                      ...(preferences ? { preferences } : {})
                                    }
                                    return { ...(prev as any), userProfile: nextUserProfile }
                                  })

                                  toast({
                                    title: 'Paramètres sauvegardés !',
                                    description: 'Vos préférences de notifications ont été sauvegardées.',
                                    variant: 'default'
                                  })

                                  setNotificationPrefsFeedback({
                                    type: 'success',
                                    title: 'Préférences enregistrées',
                                    description: 'La synchronisation avec la base de données est terminée.'
                                  })
                                } catch (error) {
                                  const message = error instanceof Error ? error.message : 'Impossible de sauvegarder vos préférences.'
                                  toast({
                                    title: 'Erreur',
                                    description: message,
                                    variant: 'destructive'
                                  })

                                  setNotificationPrefsFeedback({
                                    type: 'error',
                                    title: 'Échec de sauvegarde',
                                    description: message
                                  })
                                } finally {
                                  setIsSavingNotificationPrefs(false)
                                  try {
                                    window.setTimeout(() => setNotificationPrefsFeedback(null), 3500)
                                  } catch {
                                    // ignore
                                  }
                                }
                              }}
                              disabled={isSavingNotificationPrefs}
                            >
                              {isSavingNotificationPrefs ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Sauvegarde en cours...
                                </>
                              ) : (
                                <>
                                  <Settings className="w-4 h-4 mr-2" />
                                  Sauvegarder les paramètres
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Section Paramètres Système */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                {/* En-tête des paramètres */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 dark:from-slate-900/60 dark:to-slate-800/40 dark:border-slate-700">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-blue-700 dark:text-slate-100">Paramètres Généraux</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-blue-900 dark:text-slate-50">{settingsGeneralOptionCount}</div>
                        <Settings className="w-8 h-8 text-blue-600 dark:text-blue-300" />
                      </div>
                      <p className="text-xs text-blue-600 mt-2 dark:text-slate-300">Options configurables</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 dark:from-slate-900/60 dark:to-slate-800/40 dark:border-slate-700">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-green-700 dark:text-slate-100">Sécurité</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-green-900 dark:text-slate-50">{settingsSecurityOptionCount}</div>
                        <Shield className="w-8 h-8 text-green-600 dark:text-emerald-300" />
                      </div>
                      <p className="text-xs text-green-600 mt-2 dark:text-slate-300">Niveaux de protection</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 dark:from-slate-900/60 dark:to-slate-800/40 dark:border-slate-700">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-purple-700 dark:text-slate-100">Personnalisation</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-purple-900 dark:text-slate-50">{settingsPersonalizationOptionCount}</div>
                        <User className="w-8 h-8 text-purple-600 dark:text-violet-300" />
                      </div>
                      <p className="text-xs text-purple-700 mt-2 dark:text-slate-300">Préférences utilisateur</p>
                  </CardContent>
                </Card>
                </div>

                <Tabs value={settingsSubTab} onValueChange={(value) => setSettingsSubTab(value as any)} className="space-y-6">
                  <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                    <TabsTrigger value="general">Général</TabsTrigger>
                    <TabsTrigger value="security">Sécurité</TabsTrigger>
                    <TabsTrigger value="privacy">Confidentialité</TabsTrigger>
                    <TabsTrigger value="actions">Actions</TabsTrigger>
                  </TabsList>

                  <TabsContent value="general" className="space-y-6">
                    {/* Paramètres généraux */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Settings className="w-5 h-5 text-blue-600" />
                          <span>Paramètres Généraux</span>
                        </CardTitle>
                        <CardDescription>
                          Configurez vos préférences générales et l'apparence du tableau de bord
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Langue et devise */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="language">Langue</Label>
                            <Select value={selectedLanguage} onValueChange={(value) => {
                              setSelectedLanguage(value as any)
                              setLanguage(value as any)
                              toast({
                                title: "Langue modifiée !",
                                description: `Votre langue a été changée vers ${value === 'fr' ? 'Français' : value === 'en' ? 'English' : 'Español'}`,
                                variant: "default",
                              })
                            }}>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionnez une langue" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="fr">Français</SelectItem>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="es">Español</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="currency">Devise</Label>
                            <Select value={selectedCurrency} onValueChange={(value) => {
                              setSelectedCurrency(value as any)
                              setCurrency(value as any)
                              toast({
                                title: "Devise modifiée !",
                                description: `Votre devise a été changée vers ${value === 'xof' ? 'XOF' : value === 'usd' ? 'USD' : 'EUR'}`,
                                variant: "default",
                              })
                            }}>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionnez une devise" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="xof">XOF</SelectItem>
                                <SelectItem value="usd">USD (Dollar US)</SelectItem>
                                <SelectItem value="eur">EUR (Euro)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Thème */}
                        <div className="space-y-2">
                          <Label htmlFor="theme">Thème</Label>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <div className={`w-full h-20 bg-white dark:bg-slate-900/60 border-2 rounded-lg flex items-center justify-center cursor-pointer transition-all ${
                                selectedTheme === 'light' ? 'border-orange-500 bg-orange-50' : 'border-gray-300'
                              }`} onClick={() => {
                                setSelectedTheme('light')
                                setTheme('light')
                                toast({
                                  title: "Thème modifié !",
                                  description: "Le thème clair a été activé",
                                  variant: "default",
                                })
                              }}>
                                <Sun className="w-8 h-8 text-yellow-500" />
                              </div>
                              <div className="flex items-center space-x-2">
                                <input 
                                  type="radio" 
                                  name="theme" 
                                  id="light" 
                                  value="light" 
                                  checked={selectedTheme === 'light'}
                                  onChange={() => {
                                    setSelectedTheme('light')
                                    setTheme('light')
                                    toast({
                                      title: "Thème modifié !",
                                      description: "Le thème clair a été activé",
                                      variant: "default",
                                    })
                                  }}
                                />
                                <Label htmlFor="light" className="text-sm">Clair</Label>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className={`w-full h-20 bg-slate-900 dark:bg-slate-900/80 border-2 rounded-lg flex items-center justify-center cursor-pointer transition-all ${
                                selectedTheme === 'dark' ? 'border-orange-500 bg-orange-50 dark:bg-slate-800/60' : 'border-gray-300 dark:border-slate-600'
                              }`} onClick={() => {
                                setSelectedTheme('dark')
                                setTheme('dark')
                                toast({
                                  title: "Thème modifié !",
                                  description: "Le thème sombre a été activé",
                                  variant: "default",
                                })
                              }}>
                                <Moon className="w-8 h-8 text-blue-400" />
                              </div>
                              <div className="flex items-center space-x-2">
                                <input 
                                  type="radio" 
                                  name="theme" 
                                  id="dark" 
                                  value="dark" 
                                  checked={selectedTheme === 'dark'}
                                  onChange={() => {
                                    setSelectedTheme('dark')
                                    setTheme('dark')
                                    toast({
                                      title: "Thème modifié !",
                                      description: "Le thème sombre a été activé",
                                      variant: "default",
                                    })
                                  }}
                                />
                                <Label htmlFor="dark" className="text-sm">Sombre</Label>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className={`w-full h-20 bg-gradient-to-br from-gray-100 to-gray-300 dark:from-slate-900/60 dark:to-slate-800/40 border-2 rounded-lg flex items-center justify-center cursor-pointer transition-all ${
                                selectedTheme === 'auto' ? 'border-orange-500 bg-orange-50 dark:bg-slate-800/60' : 'border-gray-300 dark:border-slate-600'
                              }`} onClick={() => {
                                setSelectedTheme('auto')
                                setTheme('auto')
                                toast({
                                  title: "Thème modifié !",
                                  description: "Le thème système a été activé",
                                  variant: "default",
                                })
                              }}>
                                <Monitor className="w-8 h-8 text-gray-600 dark:text-slate-200" />
                              </div>
                              <div className="flex items-center space-x-2">
                                <input 
                                  type="radio" 
                                  name="theme" 
                                  id="system" 
                                  value="auto" 
                                  checked={selectedTheme === 'auto'}
                                  onChange={() => {
                                    setSelectedTheme('auto')
                                    setTheme('auto')
                                    toast({
                                      title: "Thème modifié !",
                                      description: "Le thème système a été activé",
                                      variant: "default",
                                    })
                                  }}
                                />
                                <Label htmlFor="system" className="text-sm">Système</Label>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Fuseau horaire */}
                        <div className="space-y-2">
                          <Label htmlFor="timezone">Fuseau horaire</Label>
                          <Select value={selectedTimezone} onValueChange={(value) => {
                            const timezoneLabelMap = {
                              africa_cotonou: 'Afrique/Cotonou',
                              europe_paris: 'Europe/Paris',
                              america_new_york: 'America/New_York',
                              asia_tokyo: 'Asia/Tokyo'
                            } as const

                            const next = value as any
                            setSelectedTimezone(next)
                            setTimezone(next)
                            toast({
                              title: "Fuseau horaire modifié !",
                              description: `Votre fuseau horaire a été changé vers ${timezoneLabelMap[next as keyof typeof timezoneLabelMap]}`,
                              variant: "default",
                            })
                          }}>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionnez un fuseau horaire" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="africa_cotonou">Afrique/Cotonou</SelectItem>
                              <SelectItem value="europe_paris">Europe/Paris</SelectItem>
                              <SelectItem value="america_new_york">America/New_York</SelectItem>
                              <SelectItem value="asia_tokyo">Asia/Tokyo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="security" className="space-y-6">
                    {/* Paramètres de sécurité */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Shield className="w-5 h-5 text-green-600" />
                          <span>Paramètres de Sécurité</span>
                        </CardTitle>
                        <CardDescription>
                          Sécurisez votre compte avec des options avancées
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Authentification à deux facteurs */}
                        <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-slate-900/50 rounded-lg border border-green-200 dark:border-slate-700">
                          <div className="flex items-center space-x-3">
                            <Key className="w-5 h-5 text-green-600 dark:text-emerald-300" />
                            <div>
                              <p className="font-medium">Authentification à deux facteurs</p>
                              <p className="text-sm text-green-600 dark:text-slate-300">Protection renforcée de votre compte</p>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setShowTwoFactorSetup(true)}
                            className="hover:bg-green-50 hover:text-green-600 hover:border-green-300 transition-colors dark:hover:bg-slate-800/60"
                          >
                            {twoFactorEnabled ? "Modifier" : "Configurer"}
                          </Button>
                        </div>

                        {/* Changement de mot de passe */}
                        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200 dark:bg-slate-900/50 dark:border-slate-700">
                          <div className="flex items-center space-x-3">
                            <Lock className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                            <div>
                              <p className="font-medium">Changer le mot de passe</p>
                              <p className="text-sm text-blue-600 dark:text-slate-300">Mettez à jour votre mot de passe</p>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setShowPasswordChangeModal(true)}
                            className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors dark:hover:bg-slate-800/60"
                          >
                            Modifier
                          </Button>
                        </div>

                        {/* Sessions actives */}
                        <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200 dark:bg-slate-900/50 dark:border-slate-700">
                          <div className="flex items-center space-x-3">
                            <Globe className="w-5 h-5 text-purple-600 dark:text-violet-300" />
                            <div>
                              <p className="font-medium">Sessions actives</p>
                              <p className="text-sm text-purple-600 dark:text-slate-300">Gérez vos connexions</p>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setShowSessionsModal(true)}
                            className="hover:bg-purple-50 hover:text-purple-600 hover:border-purple-300 transition-colors dark:hover:bg-slate-800/60"
                          >
                            Voir ({activeSessionsCount})
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="privacy" className="space-y-6">
                    {/* Paramètres de confidentialité */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Eye className="w-5 h-5 text-purple-600" />
                          <span>Confidentialité et Données</span>
                        </CardTitle>
                        <CardDescription>
                          Contrôlez la visibilité de vos informations et la collecte de données
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Visibilité du profil */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Profil public</p>
                              <p className="text-sm text-gray-600">Permettre aux autres de voir votre profil</p>
                            </div>
                            <Switch 
                              checked={privacyPrefs.profilePublic} 
                              disabled={privacyPolicy.profilePublic.locked || typeof privacyPolicy.profilePublic.forceValue === 'boolean'}
                              onCheckedChange={(checked) => {
                                setProfilePublicPref(checked)
                                toast({
                                  title: checked ? "Profil public activé" : "Profil privé activé",
                                  description: checked ? "Votre profil est maintenant visible par les autres utilisateurs" : "Votre profil est maintenant privé",
                                  variant: "default",
                                })
                              }}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Historique des achats</p>
                              <p className="text-sm text-gray-600">Partager vos achats avec les vendeurs</p>
                            </div>
                            <Switch 
                              checked={privacyPrefs.sharePurchaseHistory} 
                              disabled={privacyPolicy.sharePurchaseHistory.locked || typeof privacyPolicy.sharePurchaseHistory.forceValue === 'boolean'}
                              onCheckedChange={(checked) => {
                                setSharePurchaseHistoryPref(checked)
                                toast({
                                  title: checked ? "Historique partagé" : "Historique privé",
                                  description: checked ? "Votre historique d'achats est maintenant partagé avec les vendeurs" : "Votre historique d'achats est maintenant privé",
                                  variant: "default",
                                })
                              }}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Statistiques de partage</p>
                              <p className="text-sm text-gray-600">Afficher vos statistiques de partage</p>
                            </div>
                            <Switch 
                              checked={privacyPrefs.shareStats} 
                              disabled={privacyPolicy.shareStats.locked || typeof privacyPolicy.shareStats.forceValue === 'boolean'}
                              onCheckedChange={(checked) => {
                                setShareStatsPref(checked)
                                toast({
                                  title: checked ? "Statistiques partagées" : "Statistiques privées",
                                  description: checked ? "Vos statistiques de partage sont maintenant visibles" : "Vos statistiques de partage sont maintenant privées",
                                  variant: "default",
                                })
                              }}
                            />
                          </div>
                        </div>

                        {/* Collecte de données */}
                        <Separator />
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Analytics et amélioration</p>
                              <p className="text-sm text-gray-600">Aider à améliorer le service</p>
                            </div>
                            <Switch 
                              checked={privacyPrefs.analyticsEnabled} 
                              disabled={privacyPolicy.analyticsEnabled.locked || typeof privacyPolicy.analyticsEnabled.forceValue === 'boolean'}
                              onCheckedChange={(checked) => {
                                setAnalyticsEnabledPref(checked)
                                toast({
                                  title: checked ? "Analytics activés" : "Analytics désactivés",
                                  description: checked ? "Vous contribuez maintenant à l'amélioration du service" : "Vous ne contribuez plus à l'amélioration du service",
                                  variant: "default",
                                })
                              }}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Personnalisation des recommandations</p>
                              <p className="text-sm text-gray-600">Recevoir des suggestions personnalisées</p>
                            </div>
                            <Switch 
                              checked={privacyPrefs.personalizedRecommendations} 
                              disabled={privacyPolicy.personalizedRecommendations.locked || typeof privacyPolicy.personalizedRecommendations.forceValue === 'boolean'}
                              onCheckedChange={(checked) => {
                                setPersonalizedRecommendationsPref(checked)
                                toast({
                                  title: checked ? "Recommandations activées" : "Recommandations désactivées",
                                  description: checked ? "Vous recevrez maintenant des suggestions personnalisées" : "Vous ne recevrez plus de suggestions personnalisées",
                                  variant: "default",
                                })
                              }}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="actions" className="space-y-6">
                    {/* Actions rapides */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Zap className="w-5 h-5 text-orange-600" />
                          <span>Actions Rapides</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Button 
                            variant="outline" 
                            className="w-full justify-start hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors"
                            onClick={() => setShowExportModal(true)}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Exporter mes données
                          </Button>
                          <Button 
                            variant="outline" 
                            className="w-full justify-start hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors"
                            onClick={() => setShowDeleteAccountModal(true)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Supprimer mon compte
                          </Button>
                          <Button 
                            variant="outline" 
                            className="w-full justify-start hover:bg-purple-50 hover:text-purple-600 hover:border-purple-300 transition-colors"
                            onClick={() => setShowPrivacyPolicyModal(true)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Politique de confidentialité
                          </Button>
                          <Button 
                            variant="outline" 
                            className="w-full justify-start hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 transition-colors"
                            onClick={() => setShowTermsModal(true)}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Conditions d'utilisation
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Advanced Chat Component */}
      {/* Composant AdvancedChat remplacé par le nouveau système de chat global */}

      {/* Modal de retrait de points (client) */}
      <Dialog open={showWithdrawalModal} onOpenChange={setShowWithdrawalModal}>
        <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Retirer des Points</DialogTitle>
            <DialogDescription>
              Convertissez vos points en devise selon la méthode de paiement choisie
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2">
            <div className="space-y-4 pb-4">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                <div className="flex items-center justify-between">
                  <span>Solde disponible</span>
                  <span className="font-semibold text-[#ff6600]">
                    {formatPointsValue(pointsSummary?.balance ?? 0)}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Valeur estimée</span>
                  <span>
                    {formatMoney((pointsSummary?.balance ?? 0) * withdrawalValue)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="withdrawal-amount">Nombre de points à retirer</Label>
                <Input
                  id="withdrawal-amount"
                  type="number"
                  placeholder="Ex: 3 000"
                  value={withdrawalAmountInput}
                  onChange={(event) => setWithdrawalAmountInput(event.target.value)}
                />
              </div>

              <div className="space-y-3">
                <Label>Méthode de paiement</Label>
                {withdrawalMethods.length > 0 ? (
                  <RadioGroup
                    value={selectedWithdrawalMethodId}
                    onValueChange={(value) => setSelectedWithdrawalMethod(value)}
                    className="grid gap-3"
                  >
                    {withdrawalMethods.map((method) => {
                      const methodValue = method.id ?? method.name
                      const limit = method.limits[0]
                      const isSelected = selectedWithdrawalMethodId === methodValue
                      return (
                        <div
                          key={method.id}
                          className={`rounded-lg border ${isSelected ? 'border-[#ff6600] ring-2 ring-[#ff6600]/20' : 'border-gray-200'} bg-white transition-colors`}
                        >
                          <RadioGroupItem value={methodValue} id={`method-${method.id}`} className="sr-only" />
                          <label
                            htmlFor={`method-${method.id}`}
                            className="block cursor-pointer p-4 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className={`h-3 w-3 rounded-full border ${isSelected ? 'border-[#ff6600] bg-[#ff6600]' : 'border-gray-300'}`} />
                                <span className="font-medium text-gray-900">{method.name}</span>
                              </div>
                              {limit?.processingTime && (
                                <span className="text-xs text-muted-foreground">{limit.processingTime}</span>
                              )}
                            </div>
                            {method.description && (
                              <p className="text-sm text-gray-600">{method.description}</p>
                            )}

                            {isSelected && (
                              <div className="mt-3 space-y-2 border-t border-dashed border-gray-200 pt-3">
                                <div className="flex items-center justify-between text-sm font-medium text-gray-800">
                                  <span>
                                    {withdrawalIdentifierConfig.label}
                                    {withdrawalIdentifierConfig.required && <span className="ml-1 text-[#ff6600]">*</span>}
                                  </span>
                                  {limit?.processingTime && (
                                    <span className="text-xs text-muted-foreground">{limit.processingTime}</span>
                                  )}
                                </div>
                                <Input
                                  type={withdrawalIdentifierConfig.type}
                                  placeholder={withdrawalIdentifierConfig.placeholder}
                                  value={withdrawalIdentifier}
                                  onChange={(event) => setWithdrawalIdentifier(event.target.value)}
                                />
                                {withdrawalIdentifierConfig.helper && (
                                  <p className="text-xs text-muted-foreground">{withdrawalIdentifierConfig.helper}</p>
                                )}
                              </div>
                            )}
                          </label>
                        </div>
                      )
                    })}
                  </RadioGroup>
                ) : (
                  <Alert variant="default" className="text-sm">
                    <AlertDescription>
                      Aucune méthode de retrait n’est disponible pour le moment.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {pointsConfigurationState?.limits?.withdrawal && (
                <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-3 text-xs text-gray-600 space-y-1">
                  <div className="flex items-center justify-between">
                    <span>Min retrait</span>
                    <span>{formatPointsValue(withdrawalMinPoints)}</span>
                  </div>
                  {pointsConfigurationState.limits.withdrawal.max !== null && pointsConfigurationState.limits.withdrawal.max !== undefined && (
                    <div className="flex items-center justify_between">
                      <span>Max retrait</span>
                      <span>{formatPointsValue(pointsConfigurationState.limits.withdrawal.max)}</span>
                    </div>
                  )}
                  {selectedMethodLimit?.processingTime && (
                    <div className="flex items-center justify-between">
                      <span>Délai estimé</span>
                      <span>{selectedMethodLimit.processingTime}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 space-y-1">
                <div className="flex items-center justify-between">
                  <span>Points saisis</span>
                  <span>{formatPointsValue(withdrawalAmountValue)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Frais estimés</span>
                  <span>{formatPointsValue(withdrawalFee)}</span>
                </div>
                <div className="flex items-center justify_between">
                  <span>Total débité</span>
                  <span>{formatPointsValue(withdrawalTotal)}</span>
                </div>
                <div className="flex items-center justify-between font-semibold">
                  <span>Paiement estimé</span>
                  <span>
                    {formatMoney(withdrawalPayout)}
                  </span>
                </div>
              </div>

              {withdrawalLimitMessage && (
                <Alert variant="destructive" className="text-sm">
                  <AlertDescription>{withdrawalLimitMessage}</AlertDescription>
                </Alert>
              )}

              {withdrawalError && (
                <Alert variant="destructive" className="text-sm">
                  <AlertDescription>{withdrawalError}</AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowWithdrawalModal(false)}
              disabled={withdrawalProcessing}
            >
              Annuler
            </Button>
            <Button
              onClick={handleWithdrawalSubmit}
              disabled={withdrawalAmountValue <= 0 || Boolean(withdrawalLimitMessage) || withdrawalProcessing || !selectedWithdrawalMethodDetails}
            >
              {withdrawalProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Demande en cours...
                </>
              ) : (
                'Confirmer le retrait'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de nouveau message */}
      <Dialog open={showNewMessageModal} onOpenChange={setShowNewMessageModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Mail className="w-5 h-5 text-blue-600" />
              <span>Nouveau Message</span>
            </DialogTitle>
            <DialogDescription>
              Envoyez un message à l'équipe d'administration. Tous les champs marqués d'un * sont obligatoires.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="message-subject" className="flex items-center">
                  Sujet <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="message-subject"
                  placeholder="Sujet de votre message"
                  value={newMessageSubject}
                  onChange={(e) => setNewMessageSubject(e.target.value)}
                  className="focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message-category" className="flex items-center">
                  Catégorie <span className="text-red-500 ml-1">*</span>
                </Label>
                <Select value={newMessageCategory} onValueChange={setNewMessageCategory}>
                  <SelectTrigger className="focus:ring-2 focus:ring-blue-500">
                    <SelectValue placeholder="Sélectionnez une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Général</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                    <SelectItem value="technical">Technique</SelectItem>
                    <SelectItem value="billing">Facturation</SelectItem>
                    <SelectItem value="account">Compte</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message-priority" className="flex items-center">
                Priorité <span className="text-red-500 ml-1">*</span>
              </Label>
              <Select value={newMessagePriority} onValueChange={setNewMessagePriority}>
                <SelectTrigger className="focus:ring-2 focus:ring-blue-500">
                  <SelectValue placeholder="Sélectionnez la priorité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>Basse</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span>Moyenne</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span>Haute</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message-content" className="flex items-center">
                Message <span className="text-red-500 ml-1">*</span>
              </Label>
              <Textarea
                id="message-content"
                placeholder="Décrivez votre demande en détail..."
                rows={6}
                value={newMessageContent}
                onChange={(e) => setNewMessageContent(e.target.value)}
                className="focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>Minimum 10 caractères</span>
                <span>{newMessageContent.length}/1000</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <Label>Pièces jointes (optionnel)</Label>
              <div className="flex items-center space-x-3">
                <input
                  ref={internalMessageFileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handleInternalMessageFileSelected}
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => void handlePickInternalMessageAttachment()}
                  disabled={isUploadingNewMessageAttachment}
                  className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors"
                >
                  <Paperclip className="w-4 h-4 mr-2" />
                  {isUploadingNewMessageAttachment ? 'Upload...' : 'Ajouter une pièce jointe'}
                </Button>
                <span className="text-xs text-gray-500">
                  Formats acceptés: PDF, JPG, PNG (max 5MB)
                </span>
              </div>

              {newMessageAttachments.length > 0 && (
                <div className="space-y-2">
                  {newMessageAttachments.map((att) => (
                    <div key={att.url} className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-sm">
                      <a href={att.url} target="_blank" rel="noreferrer" className="truncate text-blue-600 hover:underline">
                        {att.name}
                      </a>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setNewMessageAttachments((prev) => (prev ?? []).filter((item) => item.url !== att.url))}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Info className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-700">Informations importantes</span>
              </div>
              <div className="text-xs text-blue-600">
                Temps de réponse moyen: 2-4 heures
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setNewMessageSubject('')
                  setNewMessageContent('')
                  setNewMessageCategory('general')
                  setNewMessagePriority('medium')
                  setShowNewMessageModal(false)
                  toast({
                    title: "Message annulé",
                    description: "Le message a été annulé et le formulaire réinitialisé",
                    variant: "default",
                  })
                }}
              >
                Annuler
              </Button>
              <Button 
                className="flex-1 bg-[#ff6600] hover:bg-[#e65c00] disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={
                  isSendingMessage ||
                  isUploadingNewMessageAttachment ||
                  !newMessageSubject.trim() ||
                  !newMessageContent.trim() ||
                  newMessageContent.trim().length < 10
                }
                onClick={handleCreateMessage}
              >
                {isSendingMessage ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Envoyer le message
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de transfert de points (client) */}
      <Dialog open={showTransferPointsModal} onOpenChange={setShowTransferPointsModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Transférer des Points</DialogTitle>
            <DialogDescription>
              Envoyez des points à un autre utilisateur ProBooster
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
              <div className="flex items-center justify-between">
                <span>Solde disponible</span>
                <span className="font-semibold text-[#ff6600]">
                  {formatPointsValue(pointsSummary?.balance ?? 0)}
                </span>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {resolvedPointsConfiguration ? (
                  <>
                    Frais fixes&nbsp;: {formatPointsValue(resolvedPointsConfiguration.fees.transfer.flat)} •
                    Pourcentage&nbsp;: {resolvedPointsConfiguration.fees.transfer.percentage}% •
                    Min:&nbsp;{resolvedPointsConfiguration.limits.transfer.min !== null ? formatPointsValue(resolvedPointsConfiguration.limits.transfer.min) : 'Illimité'} •
                    Max:&nbsp;{resolvedPointsConfiguration.limits.transfer.max !== null ? formatPointsValue(resolvedPointsConfiguration.limits.transfer.max) : 'Illimité'}
                  </>
                ) : (
                  'Chargement de la configuration...'
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transfer-recipient">Destinataire</Label>
              <div className="relative">
                <Input
                  id="transfer-recipient"
                  placeholder="Nom, email, ID ou téléphone"
                  value={transferRecipientQuery}
                  onChange={(event) => setTransferRecipientQuery(event.target.value)}
                  className="pr-10"
                  autoComplete="off"
                />
                {transferRecipientLoading && (
                  <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                )}
              </div>

              {transferRecipientQuery && !transferRecipientLoading && transferRecipientResults.length === 0 && !transferSelectedRecipient && (
                <p className="text-xs text-muted-foreground">
                  Aucun utilisateur trouvé. Vérifiez l'orthographe ou essayez un autre critère.
                </p>
              )}

              {transferRecipientResults.length > 0 && (
                <div className="rounded-md border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
                  <div className="max-h-48 overflow-y-auto">
                    {transferRecipientResults.map((result) => {
                      const displayName = getRecipientDisplayName(result)
                      return (
                        <button
                          key={result.id}
                          type="button"
                          onClick={() => handleSelectRecipient(result)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900 dark:text-gray-100">{displayName}</span>
                            <Badge variant="outline" className="text-[11px] dark:border-gray-600 dark:text-gray-200">ID {result.shortCode || result.id}</Badge>
                          </div>
                          <div className="mt-1 space-x-2 text-xs text-muted-foreground dark:text-gray-400">
                            {result.email && <span>{result.email}</span>}
                            {result.phone && <span>{result.phone}</span>}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {transferSelectedRecipient && (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
                  <p className="font-medium">Destinataire sélectionné</p>
                  <p>{getRecipientDisplayName(transferSelectedRecipient)}</p>
                  <div className="mt-1 space-x-2">
                    {transferSelectedRecipient.email && <span>{transferSelectedRecipient.email}</span>}
                    {transferSelectedRecipient.phone && <span>{transferSelectedRecipient.phone}</span>}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="transfer-amount">Nombre de points à transférer</Label>
              <Input
                id="transfer-amount"
                type="number"
                placeholder="Ex: 1 500"
                value={transferAmountInput}
                onChange={(event) => setTransferAmountInput(event.target.value)}
              />
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
              <div className="flex items-center justify-between">
                <span>Points saisis</span>
                <span>{formatPointsValue(transferAmountValue)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span>Frais estimés</span>
                <span>{formatPointsValue(transferFee)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between font-semibold">
                <span>Total débité</span>
                <span>{formatPointsValue(transferTotal)}</span>
              </div>
            </div>

            {transferLimitMessage && (
              <Alert
                variant="destructive"
                className="text-sm border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
              >
                <AlertDescription className="text-red-700 dark:text-red-200">{transferLimitMessage}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowTransferPointsModal(false)}
              disabled={transferProcessing}
            >
              Annuler
            </Button>
            <Button
              onClick={handleTransferPointsSubmit}
              disabled={!transferSelectedRecipient || transferAmountValue <= 0 || Boolean(transferLimitMessage) || transferProcessing}
            >
              {transferProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Transfert en cours...
                </>
              ) : (
                'Transférer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal d'échange de points (client) */}
      <Dialog open={showExchangePointsModal} onOpenChange={setShowExchangePointsModal}>
        <DialogContent className="max-w-md overflow-hidden p-0 sm:max-w-lg">
          <div className="flex max-h-[80vh] flex-col">
            <DialogHeader className="px-6 pt-6">
              <DialogTitle>Échanger des Points</DialogTitle>
              <DialogDescription>
                Convertissez vos points en devise selon les taux disponibles
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-6 pb-6">
              <div className="space-y-4">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                  <div className="flex items-center justify-between">
                    <span>Solde disponible</span>
                    <span className="font-semibold text-[#ff6600]">
                      {formatPointsValue(pointsSummary?.balance ?? 0)}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {resolvedPointsConfiguration ? (
                      <>
                        Frais fixes&nbsp;: {formatPointsValue(resolvedPointsConfiguration.fees.exchange.flat)} •
                        Pourcentage&nbsp;: {resolvedPointsConfiguration.fees.exchange.percentage}% •
                        Min:&nbsp;{resolvedPointsConfiguration.limits.exchange.min !== null ? formatPointsValue(resolvedPointsConfiguration.limits.exchange.min) : 'Illimité'} •
                        Max:&nbsp;{resolvedPointsConfiguration.limits.exchange.max !== null ? formatPointsValue(resolvedPointsConfiguration.limits.exchange.max) : 'Illimité'}
                      </>
                    ) : (
                      'Chargement de la configuration...'
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Option d'échange</Label>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <Button
                        type="button"
                        variant={selectedExchangeOption === 'currency' ? 'default' : 'outline'}
                        className="w-full min-h-[96px] justify-start whitespace-normal text-left transition-colors duration-150 hover:border-[#ff6600] hover:bg-[#ff6600]/10"
                        onClick={() => {
                          if (!hasExchangeRates) {
                            toast({
                              title: 'Devises indisponibles',
                              description: "Aucun taux de conversion n'est disponible pour le moment.",
                              variant: 'destructive'
                            })
                            return
                          }
                          setSelectedExchangeOption('currency')
                          setSelectedRewardId('')
                        }}
                        disabled={exchangeProcessing}
                      >
                        <div className="space-y-1">
                          <div className="font-semibold text-[15px] break-words">Devise</div>
                          <p className="text-xs leading-snug text-muted-foreground break-words">Convertir vers une devise réelle</p>
                        </div>
                      </Button>

                      {( ['gift', 'voucher', 'discount'] as RewardExchangeOptionKey[]).map((optionKey) => {
                        const rewards = rewardOptionsByCategory[optionKey]
                        const firstReward = rewards[0]
                        return (
                          <Button
                            key={optionKey}
                            type="button"
                            variant={selectedExchangeOption === optionKey ? 'default' : 'outline'}
                            className="w-full min-h-[96px] justify-start whitespace-normal text-left transition-colors duration-150 hover:border-[#ff6600] hover:bg-[#ff6600]/10"
                            onClick={() => {
                              setSelectedExchangeOption(optionKey)
                              setSelectedRewardId(firstReward?.id ?? '')
                              setExchangeAmountInput(firstReward ? String(firstReward.pointsCost) : '')
                            }}
                            disabled={exchangeProcessing}
                          >
                            <div className="space-y-1">
                              <div className="font-semibold text-[15px] break-words">
                                {optionKey === 'gift' && "Cadeau d'achat"}
                                {optionKey === 'voucher' && "Bon d'achat"}
                                {optionKey === 'discount' && 'Réduction'}
                              </div>
                              <p className="text-xs leading-snug text-muted-foreground break-words">
                                {optionKey === 'gift' && 'Échanger contre un cadeau physique ou digital'}
                                {optionKey === 'voucher' && 'Obtenir un bon utilisable chez nos vendeurs'}
                                {optionKey === 'discount' && 'Profiter de réductions ou cashback disponibles'}
                              </p>
                            </div>
                          </Button>
                        )
                      })}
                    </div>
                  </div>

                  {selectedExchangeOption === 'currency' && (
                    <div className="space-y-2">
                      <Label htmlFor="exchange-currency">Devise de destination</Label>
                      <Select
                        value={exchangeCurrency}
                        onValueChange={(value) => {
                          setExchangeCurrency(value)
                          setExchangeError(null)
                        }}
                        disabled={!hasExchangeRates || exchangeProcessing}
                      >
                        <SelectTrigger id="exchange-currency">
                          <SelectValue placeholder="Choisir une devise" />
                        </SelectTrigger>
                        <SelectContent>
                          {(pointsConfiguration?.exchangeRates || []).map((rate) => (
                            <SelectItem key={rate.currency} value={rate.currency}>
                              {rate.currency} — 1 {POINTS_BASE_CURRENCY} = {rate.rate} {rate.currency}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {selectedExchangeOption !== 'currency' && (
                    <div className="space-y-2">
                      <Label htmlFor="exchange-reward">{REWARD_OPTION_COPY[selectedExchangeOption as RewardExchangeOptionKey].title}</Label>
                      <Select
                        value={selectedRewardId}
                        onValueChange={(value) => {
                          setSelectedRewardId(value)
                          const reward = rewardOptionsByCategory[selectedExchangeOption as RewardExchangeOptionKey].find(r => r.id === value)
                          setExchangeAmountInput(reward ? String(reward.pointsCost) : '')
                          setExchangeError(null)
                        }}
                        disabled={exchangeProcessing}
                      >
                        <SelectTrigger id="exchange-reward">
                          <SelectValue placeholder="Choisir une option" />
                        </SelectTrigger>
                        <SelectContent>
                          {rewardsForSelectedOption.map((reward) => (
                            <SelectItem key={reward.id} value={reward.id}>
                              <div className="flex flex-col space-y-1">
                                <span className="font-medium">{reward.name}</span>
                                <span className="text-xs text-muted-foreground">Coût: {formatPointsValue(reward.pointsCost)} • Valeur: {reward.value} {reward.valueType === 'percentage' ? '%' : reward.valueType === 'fixed' ? currencyCode : 'pts'}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {rewardsForSelectedOption.length === 0 && (
                        <p className="text-xs text-muted-foreground break-words">
                          {REWARD_OPTION_COPY[selectedExchangeOption as RewardExchangeOptionKey].empty}
                        </p>
                      )}
                      {selectedReward && (
                        <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-xs text-muted-foreground">
                          <p className="font-medium text-gray-800 break-words">{selectedReward.name}</p>
                          {selectedReward.description && <p className="mt-1 break-words">{selectedReward.description}</p>}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="exchange-amount">Nombre de points à échanger</Label>
                    <Input
                      id="exchange-amount"
                      type="number"
                      placeholder="Ex: 2 000"
                      value={exchangeAmountInput}
                      onChange={(event) => setExchangeAmountInput(event.target.value)}
                    />
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                    <div className="flex items-center justify-between">
                      <span>Points saisis</span>
                      <span>{formatPointsValue(exchangeAmountValue)}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span>Frais estimés</span>
                      <span>{formatPointsValue(exchangeFee)}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span>Total débité</span>
                      <span>{formatPointsValue(exchangeTotal)}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between font-semibold">
                      <span>{selectedExchangeOption === 'currency' ? 'Montant converti' : 'Option sélectionnée'}</span>
                      <span>
                        {selectedExchangeOption === 'currency' && selectedExchangeRate
                          ? formatCurrencyValue(exchangeConvertedAmount, selectedExchangeRate.currency)
                          : selectedExchangeOption !== 'currency' && selectedReward
                            ? `${selectedReward.name} (${formatPointsValue(selectedReward.pointsCost)})`
                            : '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {exchangeLimitMessage && (
                  <Alert variant="destructive" className="text-sm">
                    <AlertDescription>{exchangeLimitMessage}</AlertDescription>
                  </Alert>
                )}

                {exchangeError && (
                  <Alert variant="destructive" className="text-sm">
                    <AlertDescription>{exchangeError}</AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            <DialogFooter className="border-t px-6 py-4">
              <Button
                variant="outline"
                onClick={() => setShowExchangePointsModal(false)}
                disabled={exchangeProcessing}
              >
                Annuler
              </Button>
              <Button
                onClick={handleExchangePointsSubmit}
                disabled={exchangeAmountValue <= 0 || Boolean(exchangeLimitMessage) || exchangeProcessing}
              >
                {exchangeProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Échange en cours...
                  </>
                ) : (
                  'Échanger'
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de changement de mot de passe */}
      <Dialog open={showPasswordChangeModal} onOpenChange={setShowPasswordChangeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Changer le mot de passe</DialogTitle>
            <DialogDescription>
              Mettez à jour votre mot de passe pour sécuriser votre compte
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Mot de passe actuel</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrentPassword ? "text" : "password"}
                  placeholder="Votre mot de passe actuel"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-password">Nouveau mot de passe</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Votre nouveau mot de passe"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmer le nouveau mot de passe</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirmez votre nouveau mot de passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setShowPasswordChangeModal(false)
                  setCurrentPassword('')
                  setNewPassword('')
                  setConfirmPassword('')
                }}
              >
                Annuler
              </Button>
              <Button 
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword || newPassword.length < 8}
                onClick={handlePasswordChangeSubmit}
              >
                <Lock className="w-4 h-4 mr-2" />
                {isChangingPassword ? 'Modification...' : 'Modifier le mot de passe'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal d'édition du profil */}
      <Dialog open={showProfileEdit} onOpenChange={setShowProfileEdit}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <User className="w-5 h-5 text-blue-600" />
              <span>Modifier le Profil</span>
            </DialogTitle>
            <DialogDescription>
              Mettez à jour vos informations personnelles
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full-name">Nom complet</Label>
                <Input
                  id="full-name"
                  placeholder="Votre nom complet"
                  value={profileData.fullName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, fullName: e.target.value }))}
                  className="focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={profileData.email}
                  onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  className="focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  placeholder="+229 91 50 57 57"
                  value={profileData.phone}
                  onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                  className="focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="country">Pays</Label>
                <Select value={profileData.country} onValueChange={(value) => setProfileData(prev => ({ ...prev, country: value }))}>
                  <SelectTrigger className="focus:ring-2 focus:ring-blue-500">
                    <SelectValue placeholder="Sélectionnez un pays" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bénin">Bénin</SelectItem>
                    <SelectItem value="Nigeria">Nigeria</SelectItem>
                    <SelectItem value="Côte d'Ivoire">Côte d'Ivoire</SelectItem>
                    <SelectItem value="Ghana">Ghana</SelectItem>
                    <SelectItem value="Sénégal">Sénégal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Textarea
                id="address"
                placeholder="Votre adresse complète"
                value={profileData.address}
                onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                rows={3}
                className="focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Info className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-700">Informations importantes</span>
              </div>
              <div className="text-xs text-blue-600">
                Vos informations seront mises à jour immédiatement
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setShowProfileEdit(false)
                  setProfileData(prev => ({ ...prev }))
                  toast({
                    title: "Modification annulée",
                    description: "Vos informations n'ont pas été modifiées.",
                    variant: "default",
                  })
                }}
                disabled={isSavingProfile}
              >
                Annuler
              </Button>
              <Button 
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={() => void handleSaveProfile()}
                disabled={isSavingProfile}
              >
                <Check className="w-4 h-4 mr-2" />
                {isSavingProfile ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showEmailConfirmationMiniModal} onOpenChange={setShowEmailConfirmationMiniModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirme ton nouvel email</DialogTitle>
            <DialogDescription>
              Un email de confirmation vient d'être envoyé{pendingEmailConfirmationTarget ? ` à ${pendingEmailConfirmationTarget}` : ''}.
              Ouvre ta boîte mail pour valider le changement.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowEmailConfirmationMiniModal(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de changement d'avatar */}
      <Dialog open={showAvatarUpload} onOpenChange={setShowAvatarUpload}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Camera className="w-5 h-5 text-blue-600" />
              <span>Changer l'Avatar</span>
            </DialogTitle>
            <DialogDescription>
              Téléchargez une nouvelle photo de profil
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <input
              ref={avatarFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null
                if (!f) return
                setSelectedAvatarFile(f)
                try {
                  const preview = URL.createObjectURL(f)
                  setProfileData(prev => ({ ...prev, avatar: preview }))
                } catch {
                  // ignore
                }
              }}
            />
            <div className="flex justify-center">
              <div className="relative">
                <Avatar className="w-32 h-32">
                  <AvatarImage src={profileData.avatar} />
                  <AvatarFallback className="text-4xl">JD</AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Camera className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Méthodes de téléchargement</Label>
                <div className="grid grid-cols-1 gap-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => {
                      avatarFileInputRef.current?.click()
                    }}
                    disabled={isUploadingAvatar}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Télécharger depuis l'ordinateur
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => {
                      toast({
                        title: "Caméra",
                        description: "Fonctionnalité de prise de photo en cours de développement",
                        variant: "default",
                      })
                    }}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Prendre une photo
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => {
                      toast({
                        title: "URL",
                        description: "Fonctionnalité d'URL en cours de développement",
                        variant: "default",
                      })
                    }}
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    Importer depuis une URL
                  </Button>
                </div>
              </div>
              
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Info className="w-4 h-4 text-blue-600" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium">Formats acceptés</p>
                    <p className="text-xs">JPG, PNG, GIF (max 5MB)</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setShowAvatarUpload(false)
                  setSelectedAvatarFile(null)
                }}
                disabled={isUploadingAvatar}
              >
                Annuler
              </Button>
              <Button 
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={() => void handleUploadAvatar()}
                disabled={isUploadingAvatar || !selectedAvatarFile}
              >
                <Check className="w-4 h-4 mr-2" />
                {isUploadingAvatar ? 'Upload...' : 'Confirmer'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal d'authentification à deux facteurs */}
      <Dialog
        open={showTwoFactorSetup}
        onOpenChange={(open) => {
          setShowTwoFactorSetup(open)
          if (!open) {
            setTwoFactorCode('')
            setTwoFactorQrSvg(null)
            setTwoFactorSecret(null)
            setTwoFactorFactorId(null)
            setTwoFactorChallengeId(null)
            setIsTwoFactorBusy(false)
          } else {
            // À chaque ouverture, on relit l'état réel depuis Supabase pour rester cohérent entre les sections.
            // Si la 2FA n'est pas activée, on (re)génère un QR / challenge frais.
            void (async () => {
              try {
                setIsTwoFactorBusy(true)
                await refreshTwoFactorState()
                const { data, error } = await supabase.auth.mfa.listFactors()
                if (error) throw error

                const verifiedTotp = (data?.totp ?? []).find((f: any) => f?.status === 'verified')
                if (verifiedTotp?.id) {
                  setTwoFactorEnabled(true)
                  setTwoFactorFactorId(verifiedTotp.id)
                  setTwoFactorQrSvg(null)
                  setTwoFactorSecret(null)
                  setTwoFactorChallengeId(null)
                  return
                }

                setTwoFactorEnabled(false)
                // reset visuel avant un nouvel enrollement
                setTwoFactorCode('')
                setTwoFactorQrSvg(null)
                setTwoFactorSecret(null)
                setTwoFactorFactorId(null)
                setTwoFactorChallengeId(null)
                await startTwoFactorEnrollment()
              } catch {
                // ignore (toasts gérés par startTwoFactorEnrollment si besoin)
              } finally {
                setIsTwoFactorBusy(false)
              }
            })()
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Key className="w-5 h-5 text-green-600" />
              <span>Configuration 2FA</span>
            </DialogTitle>
            <DialogDescription>
              Sécurisez votre compte avec l'authentification à deux facteurs
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {!twoFactorEnabled ? (
              <>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3">
                    <Info className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-700">Activation de la 2FA</p>
                      <p className="text-xs text-green-600 mt-1">
                        Scannez le QR code avec votre application d'authentification
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="w-40 h-40 bg-white rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 overflow-hidden p-2">
                      {twoFactorQrSvg ? (
                        <div
                          className="w-full h-full [&_svg]:w-full [&_svg]:h-full [&_svg]:max-w-full [&_svg]:max-h-full"
                          // Supabase renvoie un SVG string pour le QR TOTP.
                          dangerouslySetInnerHTML={{ __html: normalizeTwoFactorQrSvg(twoFactorQrSvg) }}
                        />
                      ) : (
                        <div className="text-center">
                          <QrCode className="w-16 h-16 text-gray-400" />
                          <p className="text-xs text-gray-500 mt-2">QR Code</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {twoFactorSecret ? (
                    <div className="text-xs text-gray-600 text-center">
                      Si vous ne pouvez pas scanner, utilisez le secret :
                      <div className="font-mono mt-1 break-all">{twoFactorSecret}</div>
                    </div>
                  ) : null}
                  
                  <div className="space-y-2">
                    <Label htmlFor="2fa-code">Code de vérification</Label>
                    <Input
                      id="2fa-code"
                      placeholder="Entrez le code à 6 chiffres"
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value)}
                      maxLength={6}
                      className="text-center text-lg tracking-widest"
                    />
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => {
                        setShowTwoFactorSetup(false)
                        setTwoFactorCode('')
                        setTwoFactorQrSvg(null)
                        setTwoFactorSecret(null)
                        setTwoFactorFactorId(null)
                        setTwoFactorChallengeId(null)
                      }}
                      disabled={isTwoFactorBusy}
                    >
                      Annuler
                    </Button>
                    <Button 
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      disabled={isTwoFactorBusy || twoFactorCode.trim().length !== 6}
                      onClick={() => void verifyTwoFactorCode()}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      {isTwoFactorBusy ? 'Activation...' : 'Activer'}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="text-sm font-medium text-red-700">2FA déjà activée</p>
                      <p className="text-xs text-red-600 mt-1">
                        Votre compte est déjà sécurisé avec l'authentification à deux facteurs
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowTwoFactorSetup(false)}
                    disabled={isTwoFactorBusy}
                  >
                    Fermer
                  </Button>
                  <Button 
                    variant="destructive"
                    className="flex-1"
                    onClick={() => void disableTwoFactor()}
                    disabled={isTwoFactorBusy}
                  >
                    <X className="w-4 h-4 mr-2" />
                    {isTwoFactorBusy ? 'Désactivation...' : 'Désactiver'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal des sessions actives */}
      <Dialog open={showSessionsModal} onOpenChange={setShowSessionsModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sessions actives</DialogTitle>
            <DialogDescription>
              Gérez vos connexions actives sur différents appareils
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {Array.isArray(activeSessions) && activeSessions.length > 0 ? (
              <div className="space-y-2">
                {activeSessions.map((session: any) => {
                  const device = session?.device_info ?? null
                  const deviceName =
                    typeof device === 'object' && device !== null
                      ? [device?.browser, device?.os, device?.device]
                          .filter(Boolean)
                          .join(' · ')
                      : ''
                  return (
                    <div key={session?.id ?? session?.session_token} className="p-4 rounded-lg border bg-blue-50 border-blue-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <p className="font-medium">
                              {deviceName || `Session ${String(session?.session_token ?? '').slice(0, 8)}`}
                            </p>
                            <Badge variant="default" className="text-xs">Actif</Badge>
                          </div>
                          {session?.ip_address && (
                            <p className="text-xs text-gray-500 mt-1">IP : {session.ip_address}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            Connue le{' '}
                            {session?.created_at
                              ? new Date(session.created_at).toLocaleString('fr-FR')
                              : 'date inconnue'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-4 rounded-lg border bg-blue-50 border-blue-200">
                <p className="font-medium">Aucune session active enregistrée</p>
                <p className="text-sm text-gray-600 mt-1">
                  Pour votre sécurité, vous pouvez contrôler votre connexion et déconnecter les autres appareils.
                </p>
              </div>
            )}

            <Button
              variant="outline"
              className="w-full"
              onClick={() => void handleSignOutOtherSessions()}
              disabled={isSigningOutOtherSessions || activeSessionsCount <= 1}
            >
              {isSigningOutOtherSessions ? 'Déconnexion...' : 'Déconnecter les autres appareils'}
            </Button>
            
            <div className="flex justify-end">
              <Button 
                variant="outline"
                onClick={() => setShowSessionsModal(false)}
              >
                Fermer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal d'export des données */}
      <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exporter mes données</DialogTitle>
            <DialogDescription>
              Téléchargez une copie de toutes vos données personnelles
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-3">
                <Info className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-700">Informations incluses</p>
                  <p className="text-xs text-blue-600 mt-1">
                    Profil, commandes, points, partages, messages et préférences
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Format d'export</Label>
                <Select defaultValue="json">
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">JSON (Recommandé)</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Période</Label>
                <Select defaultValue="all">
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les données</SelectItem>
                    <SelectItem value="last30">30 derniers jours</SelectItem>
                    <SelectItem value="last90">90 derniers jours</SelectItem>
                    <SelectItem value="last365">1 an</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowExportModal(false)}
                disabled={isExportingAccountData}
              >
                Annuler
              </Button>
              <Button 
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={() => void handleExportAccountData()}
                disabled={isExportingAccountData}
              >
                <Download className="w-4 h-4 mr-2" />
                {isExportingAccountData ? 'Export...' : 'Exporter les données'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de suppression de compte */}
      <Dialog open={showDeleteAccountModal} onOpenChange={setShowDeleteAccountModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer mon compte</DialogTitle>
            <DialogDescription>
              Cette action est irréversible et supprimera définitivement votre compte
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-red-700">Attention !</p>
                  <p className="text-xs text-red-600 mt-1">
                    La suppression de votre compte entraînera la perte de :
                  </p>
                  <ul className="text-xs text-red-600 mt-2 list-disc list-inside">
                    <li>Tous vos points et récompenses</li>
                    <li>Votre historique d'achats</li>
                    <li>Vos partages et interactions</li>
                    <li>Vos données personnelles</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="delete-confirm">Tapez "SUPPRIMER" pour confirmer</Label>
              <Input
                id="delete-confirm"
                placeholder="SUPPRIMER"
                className="uppercase"
                value={deleteAccountConfirmText}
                onChange={(e) => setDeleteAccountConfirmText(e.target.value)}
              />
            </div>
            
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  if (isDeletingAccount) return
                  setShowDeleteAccountModal(false)
                  setDeleteAccountConfirmText('')
                }}
              >
                Annuler
              </Button>
              <Button 
                variant="destructive"
                className="flex-1"
                disabled={isDeletingAccount || deleteAccountConfirmText.trim().toUpperCase() !== 'SUPPRIMER'}
                onClick={() => void handleDeleteAccountSubmit()}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isDeletingAccount ? 'Suppression...' : 'Supprimer définitivement'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de politique de confidentialité */}
      <Dialog open={showPrivacyPolicyModal} onOpenChange={setShowPrivacyPolicyModal}>
        <DialogContent className="max-w-5xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>Politique de Confidentialité</DialogTitle>
            <DialogDescription>
              Dernière mise à jour : 19 janvier 2024
            </DialogDescription>
          </DialogHeader>
          <div className="h-full">
            <iframe
              src="/privacy"
              className="w-full h-[calc(80vh-110px)] rounded-md border"
              title="Politique de Confidentialité"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal des conditions d'utilisation */}
      <Dialog open={showTermsModal} onOpenChange={setShowTermsModal}>
        <DialogContent className="max-w-5xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>Conditions d'Utilisation</DialogTitle>
            <DialogDescription>
              Dernière mise à jour : 19 janvier 2024
            </DialogDescription>
          </DialogHeader>
          <div className="h-full">
            <iframe
              src="/terms"
              className="w-full h-[calc(80vh-110px)] rounded-md border"
              title="Conditions d'Utilisation"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Mini-Modale Détails de Commande */}
      <Dialog open={showOrderDetailsModal} onOpenChange={setShowOrderDetailsModal}>
        <DialogContent className="max-w-2xl dark:bg-gray-950 dark:text-gray-100">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-[#ff6600]" />
              <span>Détails de la Commande</span>
            </DialogTitle>
            <DialogDescription className="dark:text-gray-300">
              Informations complètes sur votre commande
            </DialogDescription>
          </DialogHeader>
          
          {dashboardData && selectedOrder ? (
            <div className="space-y-6">
              {/* En-tête de la commande */}
              <div className="bg-gray-50 dark:bg-gray-900/40 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Numéro de commande</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{selectedOrder.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Date</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{formatDate(selectedOrder.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Statut</p>
                    <Badge className={`${getStatusColor(selectedOrder.status)}`}>
                      {selectedOrder.status === 'delivered' ? 'Livrée' : 
                       selectedOrder.status === 'shipped' ? 'Expédiée' :
                       selectedOrder.status === 'confirmed' ? 'Confirmée' :
                       selectedOrder.status === 'pending' ? 'En attente' : 'Annulée'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Livraison</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{selectedOrder.deliveryOption || 'Standard'}</p>
                  </div>
                </div>
              </div>

              {/* Articles de la commande */}
              <div>
                <h4 className="font-medium mb-3 text-gray-900 dark:text-gray-100">Articles commandés</h4>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/40 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-[#ff6600] rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{item.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Quantité: {item.quantity}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(item.price)}</p>
                        <p className="text-xs text-[#ff6600]">{Math.round(item.price / 10)} points</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total et actions */}
              <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">Total</span>
                  <div className="text-right">
                    <p className="text-xl font-bold text-[#ff6600]">{formatCurrency(selectedOrder.total)}</p>
                    <p className="text-sm text-[#ff6600]">{Math.round(selectedOrder.total / 10)} points</p>
                  </div>
                </div>
                
                {/* Actions rapides */}
                <div className="flex items-center space-x-2 mb-4">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedOrder.id)
                      toast({
                        title: "Numéro copié !",
                        description: "Le numéro de commande a été copié",
                        variant: "default",
                      })
                    }}
                    className="hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copier le numéro
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      // Générer et télécharger la facture
                      generateAndDownloadInvoice(selectedOrder)
                    }}
                    className="hover:bg-green-50 hover:text-green-600 transition-colors"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Télécharger facture
                  </Button>
                  
                  <div className="relative">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setShowShareMenu(!showShareMenu)}
                      className="hover:bg-purple-50 hover:text-purple-600 transition-colors"
                    >
                      <Share2 className="w-4 h-4 mr-1" />
                      Partager
                    </Button>
                    
                    {/* Menu de partage moderne */}
                    {showShareMenu && (
                      <div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                        <div className="p-3 border-b border-gray-100">
                          <h4 className="text-sm font-medium text-gray-900">Partager cette commande</h4>
                        </div>
                        <div className="p-2 space-y-1">
                          {/* Facebook */}
                          <button
                            onClick={() => {
                              const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin + '/orders/' + selectedOrder.id)}&quote=${encodeURIComponent(`J'ai commandé pour ${formatCurrency(selectedOrder.total)} sur Pro Booster`)}`
                              window.open(url, '_blank', 'width=600,height=400')
                              setShowShareMenu(false)
                              toast({
                                title: "Partage Facebook",
                                description: "Ouverture de Facebook...",
                                variant: "default",
                              })
                            }}
                            className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-blue-50 transition-colors group"
                          >
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                              </svg>
                            </div>
                            <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">Facebook</span>
                          </button>

                          {/* WhatsApp */}
                          <button
                            onClick={() => {
                              const url = `https://wa.me/?text=${encodeURIComponent(`J'ai commandé pour ${formatCurrency(selectedOrder.total)} sur Pro Booster - ${window.location.origin}/orders/${selectedOrder.id}`)}`
                              window.open(url, '_blank')
                              setShowShareMenu(false)
                              toast({
                                title: "Partage WhatsApp",
                                description: "Ouverture de WhatsApp...",
                                variant: "default",
                              })
                            }}
                            className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-green-50 transition-colors group"
                          >
                            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                              </svg>
                            </div>
                            <span className="text-sm font-medium text-gray-700 group-hover:text-green-600">WhatsApp</span>
                          </button>

                          {/* Twitter/X */}
                          <button
                            onClick={() => {
                              const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`J'ai commandé pour ${formatCurrency(selectedOrder.total)} sur Pro Booster`)}&url=${encodeURIComponent(window.location.origin + '/orders/' + selectedOrder.id)}`
                              window.open(url, '_blank', 'width=600,height=400')
                              setShowShareMenu(false)
                              toast({
                                title: "Partage Twitter/X",
                                description: "Ouverture de Twitter...",
                                variant: "default",
                              })
                            }}
                            className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-black transition-colors group"
                          >
                            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                              </svg>
                            </div>
                            <span className="text-sm font-medium text-gray-700 group-hover:text-black">Twitter/X</span>
                          </button>

                          {/* Telegram */}
                          <button
                            onClick={() => {
                              const url = `https://t.me/share/url?url=${encodeURIComponent(window.location.origin + '/orders/' + selectedOrder.id)}&text=${encodeURIComponent(`J'ai commandé pour ${formatCurrency(selectedOrder.total)} sur Pro Booster`)}`
                              window.open(url, '_blank')
                              setShowShareMenu(false)
                              toast({
                                title: "Partage Telegram",
                                description: "Ouverture de Telegram...",
                                variant: "default",
                              })
                            }}
                            className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-blue-50 transition-colors group"
                          >
                            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.125-1.63z"/>
                              </svg>
                            </div>
                            <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">Telegram</span>
                          </button>

                          {/* Copier le lien */}
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(window.location.origin + '/orders/' + selectedOrder.id)
                              setShowShareMenu(false)
                              toast({
                                title: "Lien copié !",
                                description: "Le lien de la commande a été copié",
                                variant: "default",
                              })
                            }}
                            className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                          >
                            <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center">
                              <Copy className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-600">Copier le lien</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {selectedOrder.status === 'delivered' && (
                    <Button 
                      variant="outline"
                      className="w-full hover:bg-yellow-50 hover:text-yellow-600 transition-colors"
                      onClick={() => {
                        setShowOrderDetailsModal(false)
                        setSelectedOrderForAction(selectedOrder)
                        setShowOrderEvaluationModal(true)
                      }}
                    >
                      <Star className="w-4 h-4 mr-2" />
                      Évaluer
                    </Button>
                  )}
                  
                  {selectedOrder.status === 'shipped' && (
                    <Button 
                      variant="outline"
                      className="w-full hover:bg-green-50 hover:text-green-600 transition-colors"
                      onClick={() => {
                        setShowOrderDetailsModal(false)
                        setSelectedOrderForAction(selectedOrder)
                        setShowOrderTrackingModal(true)
                      }}
                    >
                      <Truck className="w-4 h-4 mr-2" />
                      Suivre
                    </Button>
                  )}
                  
                  <Button 
                    className="w-full bg-[#ff6600] hover:bg-[#e55a00] text-white transition-colors"
                    onClick={() => {
                      setShowOrderDetailsModal(false)
                      setSelectedOrderForAction(selectedOrder)
                      setShowOrderTrackingModal(true)
                    }}
                  >
                    <Truck className="w-4 h-4 mr-2" />
                    Suivre ma commande
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full hover:bg-gray-50 transition-colors"
                    onClick={() => setShowOrderDetailsModal(false)}
                  >
                    Fermer
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Aucune commande sélectionnée.
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Mini-Modale Détails des Points */}
      <Dialog open={showPointsDetailsModal} onOpenChange={setShowPointsDetailsModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="flex-shrink-0 p-6 pb-4">
            <DialogTitle className="flex items-center space-x-2">
              <Gift className="w-5 h-5 text-[#ff6600]" />
              <span>Mes Points de Fidélité</span>
            </DialogTitle>
            <DialogDescription>
              Gérez et utilisez vos points de fidélité
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-6 px-6 scrollbar-modal" style={{ maxHeight: 'calc(90vh - 200px)' }}>
            {isPointsFrozen && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="text-sm text-gray-700">
                    {pointsFrozenMessage ?? 'Compte gelé : opérations de points désactivées'}
                  </div>
                  <Badge className="bg-gray-200 text-gray-800 border border-gray-300">Points gelés</Badge>
                </div>
              </div>
            )}
            {/* Résumé des points */}
            <div className="bg-gradient-to-r from-[#ff6600] to-orange-500 p-6 rounded-lg text-white text-center">
              <div className={['text-4xl font-bold mb-2', isPointsFrozen ? 'opacity-60' : ''].join(' ')}>
                {userPoints.toLocaleString()}
              </div>
              <p className="text-lg opacity-90">Points disponibles</p>
              <p className="text-sm opacity-75 mt-2">
                Valeur: {formatCurrency(userPoints * 10)} • {userPoints} points
              </p>
            </div>

            {/* Historique des points */}
            <div>
              <h4 className="font-medium mb-3">Historique récent</h4>
              <div className="space-y-3">
                {recentPointsTransactions.length > 0 ? (
                  recentPointsTransactions.map((transaction) => {
                    const isCredit = transaction.type === 'earned'
                    const amount = Math.abs(transaction.amount)

                    return (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full ${
                              isCredit ? 'bg-green-100' : 'bg-red-100'
                            }`}
                          >
                            {isCredit ? (
                              <Plus className="h-4 w-4 text-green-600" />
                            ) : (
                              <Minus className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{transaction.description}</p>
                            <p className="text-xs text-gray-500">
                              {formatDate(transaction.date, { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`font-semibold ${
                              isCredit ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {isCredit ? '+' : '-'}{amount} pts
                          </p>
                          <p className="text-xs text-gray-500">
                            Solde : {transaction.balance.toLocaleString()} pts
                          </p>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="rounded border border-dashed border-gray-200 py-6 text-center text-sm text-gray-500">
                    Aucun mouvement de points disponible
                  </div>
                )}
              </div>
            </div>

            {/* Statistiques des points */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Statistiques</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {userPoints > 100000 ? '100K+' : userPoints.toLocaleString()}
                    </div>
                    <p className="text-sm text-blue-600">Total gagné</p>
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round(userPoints * 0.1)}
                    </div>
                    <p className="text-sm text-green-600">Points/mois</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions rapides */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Actions rapides</h4>
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className="w-full hover:bg-[#ff6600] hover:text-white transition-colors"
                  onClick={() => {
                    toast({
                      title: "Historique complet !",
                      description: "Ouverture de l'historique complet des points",
                      variant: "default",
                    })
                  }}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Historique complet
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full hover:bg-[#ff6600] hover:text-white transition-colors"
                  onClick={() => {
                    toast({
                      title: "Programme de fidélité !",
                      description: "Ouverture du programme de fidélité",
                      variant: "default",
                    })
                  }}
                >
                  <Award className="w-4 h-4 mr-2" />
                  Programme fidélité
                </Button>
              </div>
            </div>
          </div>

          {/* Bouton de fermeture fixe en bas */}
          <div className="flex-shrink-0 border-t pt-4 mt-4 px-6 pb-6">
            <div className="flex justify-end">
              <Button 
                variant="outline"
                onClick={() => setShowPointsDetailsModal(false)}
                className="hover:bg-[#ff6600] hover:text-white transition-colors"
              >
                Fermer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mini-Modale Promotion */}
      <Dialog open={showPromotionModal} onOpenChange={setShowPromotionModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Tag className="w-5 h-5 text-[#ff6600]" />
              <span>Promotion Spéciale</span>
            </DialogTitle>
            <DialogDescription>
              Détails et utilisation de votre promotion
            </DialogDescription>
          </DialogHeader>
          
          {selectedPromotion && (
            <div className="space-y-6">
              {/* Détails de la promotion */}
              <div className="bg-gradient-to-r from-[#ff6600] to-orange-500 p-6 rounded-lg text-white text-center">
                <h3 className="text-2xl font-bold mb-2">{selectedPromotion.title}</h3>
                <p className="text-lg opacity-90 mb-4">{selectedPromotion.description}</p>
                <div className="bg-white bg-opacity-20 rounded-lg p-3">
                  <p className="text-sm opacity-75">Code promo</p>
                  <p className="text-2xl font-mono font-bold">{selectedPromotion.code}</p>
                </div>
                <p className="text-sm opacity-75 mt-3">
                  Se termine le {formatDate(selectedPromotion.endDate)}
                </p>
              </div>

              {/* Informations détaillées */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3 flex items-center space-x-2">
                    <Info className="w-5 h-5 text-[#ff6600]" />
                    <span>Conditions d'utilisation</span>
                  </h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Valable sur tous les smartphones</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Minimum d'achat: 25 000 F CFA</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Non cumulable avec d'autres promotions</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-orange-500" />
                      <span>Se termine le {formatDate(selectedPromotion.endDate)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3 flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-[#ff6600]" />
                    <span>Statistiques</span>
                  </h4>
                  <div className="space-y-3">
                    {selectedPromotion.type === 'flash' && (
                      <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <Zap className="w-4 h-4 text-red-600" />
                          <span className="text-sm font-medium text-red-800">Promotion Flash</span>
                        </div>
                        <p className="text-xs text-red-600">Offre limitée dans le temps</p>
                      </div>
                    )}
                    
                    {selectedPromotion.maxUsage && (
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-blue-800">Utilisations</span>
                          <span className="text-sm font-medium text-blue-800">
                            {selectedPromotion.usageCount}/{selectedPromotion.maxUsage}
                          </span>
                        </div>
                        <Progress 
                          value={(selectedPromotion.usageCount / selectedPromotion.maxUsage) * 100} 
                          className="h-2"
                        />
                        <p className="text-xs text-blue-600 mt-1">
                          {selectedPromotion.maxUsage - selectedPromotion.usageCount} utilisations restantes
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions principales */}
              <div className="border-t pt-6">
                <h4 className="font-semibold text-lg mb-4 text-center">Actions Disponibles</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    className="w-full bg-[#ff6600] hover:bg-[#e55a00] text-white"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(selectedPromotion.code)
                        
                        // Mettre à jour le compteur d'utilisation
                        const currentUsage = promotionUsage[selectedPromotion.code] || 0
                        setPromotionUsage(prev => ({
                          ...prev,
                          [selectedPromotion.code]: currentUsage + 1
                        }))
                        
                        toast({
                          title: "Code copié avec succès !",
                          description: `Le code ${selectedPromotion.code} a été copié dans votre presse-papiers`,
                          variant: "default",
                        })
                      } catch (error) {
                        toast({
                          title: "Erreur de copie",
                          description: "Impossible de copier le code. Veuillez le noter manuellement.",
                          variant: "destructive",
                        })
                      }
                    }}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copier le code
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white"
                    onClick={() => {
                      // Simuler la navigation vers la boutique avec promotion active
                      setShowProductsModal(true)
                      
                      toast({
                        title: "Promotion activée !",
                        description: `La promotion ${selectedPromotion.code} est maintenant active pour votre navigation`,
                        variant: "default",
                      })
                    }}
                  >
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Voir les produits
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      // Ouvrir la modale de partage
                      setShowShareModal(true)
                      
                      // Simuler le partage
                      const shareData = {
                        title: selectedPromotion.title,
                        text: selectedPromotion.description,
                        url: `${window.location.origin}/promotions/${selectedPromotion.code}`
                      }
                      
                      if (navigator.share && navigator.canShare(shareData)) {
                        navigator.share(shareData)
                      }
                      
                      toast({
                        title: "Partage réussi !",
                        description: "Promotion partagée sur vos réseaux sociaux",
                        variant: "default",
                      })
                    }}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Partager
                  </Button>
                </div>
              </div>

              {/* Actions secondaires */}
              <div className="border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button 
                    variant="ghost" 
                    className={`w-full ${
                      promotionFavorites.includes(selectedPromotion.code) 
                        ? 'text-red-500 bg-red-50 hover:bg-red-100' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      const isFavorite = promotionFavorites.includes(selectedPromotion.code)
                      
                      if (isFavorite) {
                        // Retirer des favoris
                        setPromotionFavorites(prev => 
                          prev.filter(code => code !== selectedPromotion.code)
                        )
                        toast({
                          title: "Retiré des favoris !",
                          description: "Promotion retirée de vos favoris",
                          variant: "default",
                        })
                      } else {
                        // Ajouter aux favoris
                        setPromotionFavorites(prev => [...prev, selectedPromotion.code])
                        toast({
                          title: "Ajouté aux favoris !",
                          description: "Promotion ajoutée à vos favoris",
                          variant: "default",
                        })
                      }
                    }}
                  >
                    <Heart className={`w-4 h-4 mr-2 ${
                      promotionFavorites.includes(selectedPromotion.code) ? 'fill-current' : ''
                    }`} />
                    {promotionFavorites.includes(selectedPromotion.code) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    className={`w-full ${
                      promotionAlerts.includes(selectedPromotion.code) 
                        ? 'text-blue-500 bg-blue-50 hover:bg-blue-100' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      const hasAlert = promotionAlerts.includes(selectedPromotion.code)
                      
                      if (hasAlert) {
                        // Désactiver les alertes
                        setPromotionAlerts(prev => 
                          prev.filter(code => code !== selectedPromotion.code)
                        )
                        toast({
                          title: "Alertes désactivées !",
                          description: "Vous ne recevrez plus d'alertes pour cette promotion",
                          variant: "default",
                        })
                      } else {
                        // Activer les alertes
                        setPromotionAlerts(prev => [...prev, selectedPromotion.code])
                        toast({
                          title: "Alertes activées !",
                          description: "Vous recevrez des notifications pour cette promotion",
                          variant: "default",
                        })
                      }
                    }}
                  >
                    <Bell className={`w-4 h-4 mr-2 ${
                      promotionAlerts.includes(selectedPromotion.code) ? 'fill-current' : ''
                    }`} />
                    {promotionAlerts.includes(selectedPromotion.code) ? 'Désactiver les alertes' : 'Activer les alertes'}
                  </Button>
                </div>
                
                <div className="mt-4">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setShowPromotionModal(false)}
                  >
                    Fermer
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Mini-Modale Promotion Spéciale */}
      <Dialog open={showSpecialPromotionModal} onOpenChange={setShowSpecialPromotionModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-[#ff6600]" />
              <span>Promotion Spéciale</span>
            </DialogTitle>
            <DialogDescription>
              Détails complets et actions disponibles
            </DialogDescription>
          </DialogHeader>
          
          {selectedSpecialPromotion && (
            <div className="flex-1 overflow-y-auto space-y-6 px-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {/* En-tête de la promotion avec gradient */}
              <div className={`bg-gradient-to-br ${selectedSpecialPromotion.color} ${selectedSpecialPromotion.textColor} p-8 rounded-lg text-center`}>
                <h2 className="text-3xl font-bold mb-3">{selectedSpecialPromotion.title}</h2>
                <p className="text-xl opacity-90 mb-4">{selectedSpecialPromotion.description}</p>
                <div className="bg-white bg-opacity-20 rounded-lg p-4 inline-block">
                  <p className="text-sm opacity-75 mb-1">Date de fin</p>
                  <p className="text-2xl font-bold">{formatDate(selectedSpecialPromotion.endDate)}</p>
                </div>
              </div>

              {/* Détails et conditions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-lg mb-3 flex items-center space-x-2">
                    <Info className="w-5 h-5 text-[#ff6600]" />
                    <span>Informations</span>
                  </h4>
                  <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Promotion exclusive et limitée</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Valable sur tous les produits éligibles</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Non cumulable avec d'autres offres</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-orange-500" />
                      <span>Temps limité : {formatDate(selectedSpecialPromotion.endDate)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-lg mb-3 flex items-center space-x-2">
                    <Tag className="w-5 h-5 text-[#ff6600]" />
                    <span>Produits Éligibles</span>
                  </h4>
                  <div className="space-y-2">
                    {selectedSpecialPromotion.title === "Black Friday" && (
                      <>
                        <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                          <Smartphone className="w-4 h-4 text-[#ff6600]" />
                          <span className="text-sm">Smartphones et tablettes</span>
                        </div>
                        <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                          <Monitor className="w-4 h-4 text-[#ff6600]" />
                          <span className="text-sm">Ordinateurs et accessoires</span>
                        </div>
                        <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                          <Headphones className="w-4 h-4 text-[#ff6600]" />
                          <span className="text-sm">Audio et gaming</span>
                        </div>
                      </>
                    )}
                    {selectedSpecialPromotion.title === "Cyber Monday" && (
                      <>
                        <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                          <Laptop className="w-4 h-4 text-[#ff6600]" />
                          <span className="text-sm">Technologies avancées</span>
                        </div>
                        <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                          <Camera className="w-4 h-4 text-[#ff6600]" />
                          <span className="text-sm">Photo et vidéo</span>
                        </div>
                        <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                          <Gamepad2 className="w-4 h-4 text-[#ff6600]" />
                          <span className="text-sm">Gaming et divertissement</span>
                        </div>
                      </>
                    )}
                    {selectedSpecialPromotion.title === "Boxing Day" && (
                      <>
                        <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                          <ShoppingBag className="w-4 h-4 text-[#ff6600]" />
                          <span className="text-sm">Mode et accessoires</span>
                        </div>
                        <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                          <Home className="w-4 h-4 text-[#ff6600]" />
                          <span className="text-sm">Maison et jardin</span>
                        </div>
                        <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                          <Heart className="w-4 h-4 text-[#ff6600]" />
                          <span className="text-sm">Beauté et bien-être</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions principales */}
              <div className="border-t pt-6">
                <h4 className="font-semibold text-lg mb-4 text-center">Actions Disponibles</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    className="w-full bg-[#ff6600] hover:bg-[#e55a00] text-white"
                    onClick={() => navigateToShopWithPromotion(selectedSpecialPromotion.title)}
                  >
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Voir les produits
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white"
                    onClick={() => shareSpecialPromotion(selectedSpecialPromotion)}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Partager
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className={`w-full ${
                      promotionFavorites.includes(selectedSpecialPromotion.title) 
                        ? 'bg-red-50 border-red-500 text-red-600 hover:bg-red-100' 
                        : ''
                    }`}
                    onClick={() => togglePromotionFavorite(selectedSpecialPromotion.title)}
                  >
                    <Heart className={`w-4 h-4 mr-2 ${
                      promotionFavorites.includes(selectedSpecialPromotion.title) ? 'fill-current' : ''
                    }`} />
                    {promotionFavorites.includes(selectedSpecialPromotion.title) ? 'Retirer des favoris' : 'Favoris'}
                  </Button>
                </div>
              </div>

              {/* Actions secondaires */}
              <div className="border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button 
                    variant="ghost" 
                    className="w-full"
                    onClick={openPromotionHistory}
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Historique des promotions
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    className={`w-full ${
                      promotionAlerts.includes(selectedSpecialPromotion.title) 
                        ? 'text-blue-500 bg-blue-50 hover:bg-blue-100' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => togglePromotionAlerts(selectedSpecialPromotion.title)}
                  >
                    <Bell className={`w-4 h-4 mr-2 ${
                      promotionAlerts.includes(selectedSpecialPromotion.title) ? 'fill-current' : ''
                    }`} />
                    {promotionAlerts.includes(selectedSpecialPromotion.title) ? 'Désactiver les alertes' : 'Activer les alertes'}
                  </Button>
                </div>
                
                <div className="mt-4 pb-4">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setShowSpecialPromotionModal(false)}
                  >
                    Fermer
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modale d'Historique des Promotions */}
      <Dialog open={showPromotionHistoryModal} onOpenChange={setShowPromotionHistoryModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-[#ff6600]" />
              <span>Historique des Promotions</span>
            </DialogTitle>
            <DialogDescription>
              Consultez l'historique complet de vos promotions utilisées
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-4 px-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {promotionHistory.length > 0 ? (
              <div className="space-y-4">
                {promotionHistory.map((promo, index) => (
                  <Card key={index} className="border-l-4 border-l-[#ff6600]">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg text-gray-900">{promo.title}</h4>
                          <p className="text-sm text-gray-600">Type: {promo.type}</p>
                          <p className="text-sm text-gray-600">Valeur: {promo.value}</p>
                          <p className="text-xs text-gray-500">
                            Appliquée le {formatDate(promo.appliedAt)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-green-100 text-green-800">
                            Utilisée
                          </Badge>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              // Ici on pourrait réappliquer la promotion si elle est encore valide
                              toast({
                                title: "Promotion réappliquée !",
                                description: `${promo.title} a été réactivée`,
                                variant: "default",
                              })
                            }}
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Réappliquer
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun historique</h3>
                <p className="text-gray-500">
                  Vous n'avez pas encore utilisé de promotions. Commencez par en appliquer une !
                </p>
              </div>
            )}
          </div>
          
          <div className="flex-shrink-0 pt-4 border-t">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setShowPromotionHistoryModal(false)}
            >
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modale des Produits avec Promotion */}
      <Dialog open={showProductsModal} onOpenChange={setShowProductsModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-[#ff6600]" />
              <span>Produits Éligibles à la Promotion</span>
            </DialogTitle>
            <DialogDescription>
              {selectedPromotion && `Promotion ${selectedPromotion.code} active - ${selectedPromotion.description}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Filtres et recherche */}
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Input 
                  placeholder="Rechercher des produits..." 
                  className="w-full"
                />
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  <SelectItem value="smartphones">Smartphones</SelectItem>
                  <SelectItem value="tablets">Tablettes</SelectItem>
                  <SelectItem value="laptops">Ordinateurs</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filtres
              </Button>
            </div>

            {/* Liste des produits */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {promotionalProducts.length > 0 ? (
                promotionalProducts.map((product) => {
                  const productId = product.id.toString()
                  const isFavorite = productFavorites.includes(productId)
                  const currentPrice = Number(product.price) || 0
                  const basePrice = Number(product.original_price ?? product.price) || currentPrice
                  const discount = basePrice > currentPrice ? Math.round(((basePrice - currentPrice) / basePrice) * 100) : 0
                  const availableStock = product.stock_quantity ?? product.inventory ?? 0
                  const isAvailable = availableStock > 0 || product.in_stock === true

                  return (
                    <Card key={product.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="relative mb-3">
                          {product.thumbnail_url ? (
                            <img
                              src={product.thumbnail_url}
                              alt={product.name}
                              className="h-32 w-full rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                              <Package className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                          {discount > 0 && (
                            <Badge className="absolute top-2 right-2 bg-[#ff6600] text-white">
                              -{discount}%
                            </Badge>
                          )}
                          {!isAvailable && (
                            <Badge variant="secondary" className="absolute top-2 left-2">
                              Rupture
                            </Badge>
                          )}
                        </div>

                        <h3 className="font-semibold mb-2 line-clamp-2" title={product.name}>{product.name}</h3>

                        <div className="flex items-center space-x-2 mb-3">
                          <span className="text-lg font-bold text-[#ff6600]">
                            {formatCurrency(currentPrice)}
                          </span>
                          {discount > 0 && (
                            <span className="text-sm text-gray-500 line-through">
                              {formatCurrency(basePrice)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 text-xs text-muted-foreground mb-3">
                          <span>Stock : {availableStock > 0 ? availableStock : '0'}</span>
                          {product.category && <span>• {product.category}</span>}
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            className="flex-1 bg-[#ff6600] hover:bg-[#e55a00]"
                            disabled={!isAvailable}
                            onClick={() => addProductToCartWithPromotion(product, selectedPromotion)}
                          >
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Ajouter
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!isAvailable}
                            onClick={() => toggleProductFavorite(productId)}
                            className={isFavorite ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100' : ''}
                          >
                            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              ) : (
                <div className="col-span-full rounded border border-dashed border-gray-200 py-10 text-center text-sm text-gray-500">
                  Aucun produit n’est éligible pour cette promotion pour le moment.
                </div>
              )}
            </div>

            {/* Actions de la promotion */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Promotion {selectedPromotion?.id} active sur tous les produits
                </div>
                <Button 
                  variant="outline"
                  onClick={() => setShowProductsModal(false)}
                >
                  Fermer
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modale de Partage */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Share2 className="w-5 h-5 text-[#ff6600]" />
              <span>Partager la Promotion</span>
            </DialogTitle>
            <DialogDescription>
              Partagez cette promotion avec vos amis et votre réseau
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Options de partage */}
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="w-full bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                onClick={() => {
                  const url = `${window.location.origin}/promotions/${selectedPromotion?.code}`
                  const text = `${selectedPromotion?.title}: ${selectedPromotion?.description}`
                  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`, '_blank')
                  toast({
                    title: "Partagé sur Facebook !",
                    description: "Votre promotion a été partagée",
                    variant: "default",
                  })
                }}
              >
                <div className="w-6 h-6 bg-blue-600 rounded mr-2" />
                Facebook
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                onClick={() => {
                  const url = `${window.location.origin}/promotions/${selectedPromotion?.code}`
                  const text = `${selectedPromotion?.title}: ${selectedPromotion?.description}`
                  window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank')
                  toast({
                    title: "Partagé sur Twitter !",
                    description: "Votre promotion a été partagée",
                    variant: "default",
                  })
                }}
              >
                <div className="w-6 h-6 bg-blue-400 rounded mr-2" />
                Twitter
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                onClick={() => {
                  const url = `${window.location.origin}/promotions/${selectedPromotion?.code}`
                  const text = `${selectedPromotion?.title}: ${selectedPromotion?.description}`
                  window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank')
                  toast({
                    title: "Partagé sur WhatsApp !",
                    description: "Votre promotion a été partagée",
                    variant: "default",
                  })
                }}
              >
                <div className="w-6 h-6 bg-green-600 rounded mr-2" />
                WhatsApp
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                onClick={() => {
                  const url = `${window.location.origin}/promotions/${selectedPromotion?.code}`
                  const text = `${selectedPromotion?.title}: ${selectedPromotion?.description}`
                  window.open(`https://www.instagram.com/?url=${encodeURIComponent(url)}`, '_blank')
                  toast({
                    title: "Partagé sur Instagram !",
                    description: "Votre promotion a été partagée",
                    variant: "default",
                  })
                }}
              >
                <div className="w-6 h-6 bg-purple-600 rounded mr-2" />
                Instagram
              </Button>
            </div>

            {/* Lien direct */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Lien direct</Label>
              <div className="flex items-center space-x-2">
                <Input 
                  value={`${window.location.origin}/promotions/${selectedPromotion?.code}`}
                  readOnly
                  className="flex-1"
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/promotions/${selectedPromotion?.code}`)
                    toast({
                      title: "Lien copié !",
                      description: "Le lien a été copié dans votre presse-papiers",
                      variant: "default",
                    })
                  }}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                variant="outline"
                onClick={() => setShowShareModal(false)}
              >
                Fermer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modale d'évaluation de commande */}
      <Dialog open={showOrderEvaluationModal} onOpenChange={setShowOrderEvaluationModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span>Évaluer votre commande</span>
            </DialogTitle>
            <DialogDescription>
              Donnez votre avis sur cette commande et aidez d'autres acheteurs
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrderForAction && (
            <div className="space-y-4">
              {/* Détails de la commande */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Commande {selectedOrderForAction.id}</h4>
                <p className="text-sm text-gray-600">
                  {selectedOrderForAction.items[0].name} {selectedOrderForAction.items.length > 1 && `+${selectedOrderForAction.items.length - 1} autres`}
                </p>
                <p className="text-sm text-gray-600">
                  Livrée le {formatDate(selectedOrderForAction.createdAt)}
                </p>
              </div>

              {/* Note */}
              <div>
                <label className="text-sm font-medium">Note globale</label>
                <div className="flex items-center space-x-1 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setEvaluationRating(star)}
                      className={`text-2xl ${star <= evaluationRating ? 'text-yellow-500' : 'text-gray-300'} hover:text-yellow-400 transition-colors`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {evaluationRating === 1 && "Très mauvais"}
                  {evaluationRating === 2 && "Mauvais"}
                  {evaluationRating === 3 && "Moyen"}
                  {evaluationRating === 4 && "Bon"}
                  {evaluationRating === 5 && "Excellent"}
                </p>
              </div>

              {/* Commentaire */}
              <div>
                <label className="text-sm font-medium">Commentaire (optionnel)</label>
                <textarea
                  value={evaluationComment}
                  onChange={(e) => setEvaluationComment(e.target.value)}
                  placeholder="Partagez votre expérience..."
                  className="w-full mt-2 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-[#ff6600] focus:border-transparent"
                  rows={3}
                />
              </div>

              {/* Boutons d'action */}
              <div className="flex space-x-3 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowOrderEvaluationModal(false)}
                >
                  Annuler
                </Button>
                <Button 
                  className="flex-1 bg-[#ff6600] hover:bg-[#e55a00]"
                  onClick={() => {
                    toast({
                      title: "Évaluation envoyée !",
                      description: "Merci pour votre avis",
                      variant: "default",
                    })
                    setShowOrderEvaluationModal(false)
                    setEvaluationComment('')
                    setEvaluationRating(5)
                  }}
                >
                  Envoyer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modale de suivi de commande */}
      <Dialog open={showOrderTrackingModal} onOpenChange={setShowOrderTrackingModal}>
        <DialogContent className="max-w-md dark:bg-gray-950 dark:text-gray-100">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Truck className="w-5 h-5 text-green-500" />
              <span>Suivi de commande</span>
            </DialogTitle>
            <DialogDescription className="dark:text-gray-300">
              Suivez l'état de votre commande en temps réel
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrderForAction && (
            <div className="space-y-4">
              {/* Détails de la commande */}
              <div className="bg-gray-50 dark:bg-gray-900/40 p-4 rounded-lg">
                <h4 className="font-medium mb-2 text-gray-900 dark:text-gray-100">Commande {selectedOrderForAction.id}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {selectedOrderForAction.items[0].name} {selectedOrderForAction.items.length > 1 && `+${selectedOrderForAction.items.length - 1} autres`}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Expédiée le {formatDate(selectedOrderForAction.createdAt)}
                </p>
              </div>

              {/* Statut de livraison */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Commande confirmée</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">15 janvier 2024 à 10:30</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">En préparation</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">15 janvier 2024 à 14:15</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Expédiée</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">16 janvier 2024 à 09:00</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">En transit</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">En cours de livraison</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Livraison prévue</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">18 janvier 2024</p>
                  </div>
                </div>
              </div>

              {/* Code de suivi */}
              <div className="bg-blue-50 dark:bg-blue-950/40 p-3 rounded-lg border border-blue-200 dark:border-blue-900">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">Code de suivi</p>
                <div className="flex items-center space-x-2">
                  <code className="bg-white dark:bg-gray-900/60 px-2 py-1 rounded text-sm font-mono text-gray-900 dark:text-gray-100">TRK-{selectedOrderForAction.id.slice(-6)}</code>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(`TRK-${selectedOrderForAction.id.slice(-6)}`)
                      toast({
                        title: "Code copié !",
                        description: "Le code de suivi a été copié",
                        variant: "default",
                      })
                    }}
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex space-x-3 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowOrderTrackingModal(false)}
                >
                  Fermer
                </Button>
                <Button 
                  className="flex-1 bg-[#ff6600] hover:bg-[#e55a00]"
                  onClick={() => {
                    toast({
                      title: "Notifications activées !",
                      description: "Vous recevrez des mises à jour sur votre commande",
                      variant: "default",
                    })
                  }}
                >
                  Activer les notifications
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de détails des produits partagés */}
      <Dialog open={showProductDetailsModal} onOpenChange={setShowProductDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3">
              <Eye className="w-6 h-6 text-blue-600" />
              <span>Détails du Produit Partagé</span>
            </DialogTitle>
            <DialogDescription>
              Informations complètes sur le produit et ses performances de partage
            </DialogDescription>
          </DialogHeader>
          
          {selectedProductForDetails && (
            <div className="space-y-6">
              {/* En-tête du produit */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-6">
                  <img
                    src={selectedProductForDetails.productImage}
                    alt={selectedProductForDetails.productName}
                    className="w-24 h-24 rounded-xl object-cover shadow-lg"
                  />
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {selectedProductForDetails.productName}
                    </h3>
                    <p className="text-gray-600 mb-3">
                      Partagé le {formatDate(selectedProductForDetails.sharedAt)}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{selectedProductForDetails.totalShares}</div>
                        <div className="text-sm text-gray-600">Total partages</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">+{selectedProductForDetails.pointsEarned}</div>
                        <div className="text-sm text-gray-600">Points gagnés</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{selectedProductForDetails.pointsUsed}</div>
                        <div className="text-sm text-gray-600">Points utilisés</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{selectedProductForDetails.pointsAvailable}</div>
                        <div className="text-sm text-gray-600">Points disponibles</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistiques détaillées par réseau social */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                    <span>Performance par Réseau Social</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Facebook */}
                    <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                      </div>
                      <div className="text-2xl font-bold text-blue-600">{selectedProductForDetails.shares.facebook}</div>
                      <div className="text-sm text-gray-600">Partages Facebook</div>
                      <div className="text-xs text-blue-500 mt-1">
                        {Math.round((selectedProductForDetails.shares.facebook / selectedProductForDetails.totalShares) * 100)}% du total
                      </div>
                    </div>

                    {/* WhatsApp */}
                    <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.87 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                        </svg>
                      </div>
                      <div className="text-2xl font-bold text-green-600">{selectedProductForDetails.shares.whatsapp}</div>
                      <div className="text-sm text-gray-600">Partages WhatsApp</div>
                      <div className="text-xs text-green-500 mt-1">
                        {Math.round((selectedProductForDetails.shares.whatsapp / selectedProductForDetails.totalShares) * 100)}% du total
                      </div>
                    </div>

                    {/* Twitter/X */}
                    <div className="text-center p-4 bg-black rounded-lg border border-gray-300">
                      <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                      </div>
                      <div className="text-2xl font-bold text-white">{selectedProductForDetails.shares.twitter}</div>
                      <div className="text-sm text-gray-300">Partages Twitter/X</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {Math.round((selectedProductForDetails.shares.twitter / selectedProductForDetails.totalShares) * 100)}% du total
                      </div>
                    </div>

                    {/* Instagram */}
                    <div className="text-center p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg border border-purple-300">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.058 1.644-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                      </div>
                      <div className="text-2xl font-bold text-white">{selectedProductForDetails.shares.instagram}</div>
                      <div className="text-sm text-gray-200">Partages Instagram</div>
                      <div className="text-xs text-gray-300 mt-1">
                        {Math.round((selectedProductForDetails.shares.instagram / selectedProductForDetails.totalShares) * 100)}% du total
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions rapides */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-yellow-600" />
                    <span>Actions Rapides</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {/* Partager à nouveau */}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setShowProductDetailsModal(false)
                        setOpenProductShareMenu(selectedProductForDetails.id)
                        toast({
                          title: "Menu de partage ouvert",
                          description: "Vous pouvez maintenant partager ce produit",
                          variant: "default",
                        })
                      }}
                      className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Partager
                    </Button>

                    {/* Voir le produit */}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        toast({
                          title: "Redirection...",
                          description: "Ouverture de la page du produit",
                          variant: "default",
                        })
                        // Simuler l'ouverture de la page produit
                        setTimeout(() => {
                          window.open(`/products/${selectedProductForDetails.productId}`, '_blank')
                        }, 1000)
                      }}
                      className="hover:bg-green-50 hover:text-green-600 hover:border-green-300 transition-colors"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Voir produit
                    </Button>

                    {/* Copier le lien */}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/products/${selectedProductForDetails.productId}`)
                        toast({
                          title: "Lien copié !",
                          description: "Le lien du produit a été copié",
                          variant: "default",
                        })
                      }}
                      className="hover:bg-purple-50 hover:text-purple-600 hover:border-purple-300 transition-colors"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copier lien
                    </Button>

                    {/* Télécharger rapport */}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        // Générer un rapport spécifique pour ce produit
                        generateProductSpecificReport(selectedProductForDetails)
                      }}
                      className="hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300 transition-colors"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Rapport
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Historique des actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-gray-600" />
                    <span>Historique des Actions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-green-800">Partage réussi</p>
                          <p className="text-xs text-green-600">Facebook - 15 partages</p>
                        </div>
                      </div>
                      <span className="text-xs text-green-600">Il y a 2h</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <Gift className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-blue-800">Points gagnés</p>
                          <p className="text-xs text-blue-600">+{selectedProductForDetails.pointsEarned} points</p>
                        </div>
                      </div>
                      <span className="text-xs text-blue-600">Il y a 1j</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-purple-800">Performance améliorée</p>
                          <p className="text-xs text-purple-600">0% de partages</p>
                        </div>
                      </div>
                      <span className="text-xs text-purple-600">Il y a 3j</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Boutons d'action principaux */}
              <div className="flex space-x-3 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowProductDetailsModal(false)}
                >
                  Fermer
                </Button>
                <Button 
                  className="flex-1 bg-[#ff6600] hover:bg-[#e55a00] text-white"
                  onClick={() => {
                    toast({
                      title: "Actions en cours...",
                      description: "Traitement de vos demandes",
                      variant: "default",
                    })
                  }}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Actions groupées
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal d'achat de points */}
      <Dialog open={showPointsPurchaseModal} onOpenChange={setShowPointsPurchaseModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0 flex flex-col">
          <DialogHeader className="flex-shrink-0 p-6 pb-4">
            <DialogTitle className="flex items-center space-x-3">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
              <span>Acheter des Points</span>
            </DialogTitle>
            <DialogDescription>
              Choisissez votre forfait et procédez au paiement sécurisé
            </DialogDescription>
          </DialogHeader>
          
          {selectedPointsOffer && (
            <div className="flex-1 overflow-y-auto space-y-6 px-6 pb-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {/* Détails de l'offre sélectionnée */}
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-900 mb-2">
                      {selectedPointsOffer.points.toLocaleString()} points
                    </div>
                    <div className="text-2xl font-bold text-purple-600 mb-3">
                      {formatCurrency(selectedPointsOffer.price)}
                    </div>
                    {selectedPointsOffer.bonus > 0 && (
                      <Badge className="bg-green-100 text-green-800 text-lg px-4 py-2 mb-4">
                        +{selectedPointsOffer.bonus} points bonus inclus !
                      </Badge>
                    )}
                    <div className="text-sm text-gray-600">
                      Taux de conversion: 1 point = {formatCurrency(basePointValue)}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Options de paiement */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="w-5 h-5 text-green-600" />
                    <span>Méthode de Paiement</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div 
                      className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedPaymentMethod === 'mobile-money' 
                          ? 'border-orange-500 bg-orange-50' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedPaymentMethod('mobile-money')}
                    >
                      <input 
                        type="radio" 
                        name="payment" 
                        id="mobile-money" 
                        checked={selectedPaymentMethod === 'mobile-money'}
                        onChange={() => setSelectedPaymentMethod('mobile-money')}
                      />
                      <label htmlFor="mobile-money" className="flex items-center space-x-2 cursor-pointer">
                        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                          <Smartphone className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-medium">Mobile Money</span>
                      </label>
                    </div>
                    
                    <div 
                      className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedPaymentMethod === 'bank-transfer' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedPaymentMethod('bank-transfer')}
                    >
                      <input 
                        type="radio" 
                        name="payment" 
                        id="bank-transfer" 
                        checked={selectedPaymentMethod === 'bank-transfer'}
                        onChange={() => setSelectedPaymentMethod('bank-transfer')}
                      />
                      <label htmlFor="bank-transfer" className="flex items-center space-x-2 cursor-pointer">
                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                          <Building className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-medium">Virement Bancaire</span>
                      </label>
                    </div>
                    
                    <div 
                      className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedPaymentMethod === 'card' 
                          ? 'border-purple-500 bg-purple-50' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedPaymentMethod('card')}
                    >
                      <input 
                        type="radio" 
                        name="payment" 
                        id="card" 
                        checked={selectedPaymentMethod === 'card'}
                        onChange={() => setSelectedPaymentMethod('card')}
                      />
                      <label htmlFor="card" className="flex items-center space-x-2 cursor-pointer">
                        <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                          <CreditCard className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-medium">Carte Bancaire</span>
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Formulaire de paiement */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span>Détails de Paiement</span>
                  </CardTitle>
                  <CardDescription>
                    Remplissez les informations requises pour votre méthode de paiement
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedPaymentMethod === 'mobile-money' && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="phone-number" className="text-sm font-medium text-gray-700">
                          Numéro de téléphone
                        </Label>
                        <Input
                          id="phone-number"
                          type="tel"
                          placeholder="+229 91 50 57 57"
                          value={paymentDetails.phoneNumber}
                          onChange={(e) => setPaymentDetails(prev => ({ ...prev, phoneNumber: e.target.value }))}
                          className="mt-1"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Entrez le numéro associé à votre compte Mobile Money
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedPaymentMethod === 'bank-transfer' && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="bank-account" className="text-sm font-medium text-gray-700">
                          Numéro de compte bancaire
                        </Label>
                        <Input
                          id="bank-account"
                          type="text"
                          placeholder="1234567890"
                          value={paymentDetails.bankAccount}
                          onChange={(e) => setPaymentDetails(prev => ({ ...prev, bankAccount: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="account-name" className="text-sm font-medium text-gray-700">
                          Nom du titulaire du compte
                        </Label>
                        <Input
                          id="account-name"
                          type="text"
                          placeholder="Nom du titulaire"
                          value={paymentDetails.accountName}
                          onChange={(e) => setPaymentDetails(prev => ({ ...prev, accountName: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  )}

                  {selectedPaymentMethod === 'card' && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="card-number" className="text-sm font-medium text-gray-700">
                          Numéro de carte
                        </Label>
                        <Input
                          id="card-number"
                          type="text"
                          placeholder="1234 5678 9012 3456"
                          value={paymentDetails.cardNumber}
                          onChange={(e) => setPaymentDetails(prev => ({ ...prev, cardNumber: e.target.value }))}
                          className="mt-1"
                          maxLength={19}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="card-expiry" className="text-sm font-medium text-gray-700">
                            Date d'expiration
                          </Label>
                          <Input
                            id="card-expiry"
                            type="text"
                            placeholder="MM/YY"
                            value={paymentDetails.cardExpiry}
                            onChange={(e) => setPaymentDetails(prev => ({ ...prev, cardExpiry: e.target.value }))}
                            className="mt-1"
                            maxLength={5}
                          />
                        </div>
                        <div>
                          <Label htmlFor="card-cvv" className="text-sm font-medium text-gray-700">
                            CVV
                          </Label>
                          <Input
                            id="card-cvv"
                            type="text"
                            placeholder="123"
                            value={paymentDetails.cardCvv}
                            onChange={(e) => setPaymentDetails(prev => ({ ...prev, cardCvv: e.target.value }))}
                            className="mt-1"
                            maxLength={4}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Résumé de la commande */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-gray-600" />
                    <span>Résumé de la Commande</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Points de base:</span>
                      <span className="font-medium">{selectedPointsOffer.points.toLocaleString()} points</span>
                    </div>
                    {selectedPointsOffer.bonus > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Points bonus:</span>
                        <span className="font-medium">+{selectedPointsOffer.bonus} points</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Prix total:</span>
                      <span className="font-medium">{formatCurrency(selectedPointsOffer.price)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Frais de transaction:</span>
                      <span className="font-medium">{formatCurrency(selectedPointsOffer.price * (purchaseFeePercent / 100))}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total à payer:</span>
                      <span className="text-blue-600">{formatCurrency(selectedPointsOffer.price * (1 + purchaseFeePercent / 100))}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Boutons d'action */}
              <div className="flex space-x-3 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setShowPointsPurchaseModal(false)
                    resetPaymentProcess()
                  }}
                  disabled={isProcessingPayment}
                >
                  Annuler
                </Button>
                <Button 
                  className="flex-1 bg-[#ff6600] hover:bg-[#e55a00] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={processPayment}
                  disabled={!validatePaymentDetails() || isProcessingPayment}
                >
                  {isProcessingPayment ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Traitement...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Procéder au Paiement
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de détails du produit recommandé */}
      <Dialog open={showProductDetailsModal} onOpenChange={setShowProductDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 flex flex-col">
          <DialogHeader className="flex-shrink-0 p-6 pb-4">
            <DialogTitle className="flex items-center space-x-3">
              <Package className="w-6 h-6 text-blue-600" />
              <span>Détails du Produit Recommandé</span>
            </DialogTitle>
            <DialogDescription>
              Informations complètes et recommandations IA pour ce produit
            </DialogDescription>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="flex-1 overflow-y-auto space-y-6 px-6 pb-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {/* Image et badges */}
              <div className="relative">
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  className="w-full h-64 object-cover rounded-lg"
                />
                {selectedProduct.promotion && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-red-500 text-white animate-pulse text-lg px-4 py-2">
                      {selectedProduct.promotion.value}
                    </Badge>
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <Badge className="bg-purple-500 text-white text-lg px-4 py-2">
                    IA: {selectedProduct.aiConfidence}%
                  </Badge>
                </div>
              </div>

              {/* Informations du produit */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{selectedProduct.name}</h3>
                    <p className="text-gray-600">{selectedProduct.category}</p>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Star className="w-5 h-5 text-yellow-500 fill-current" />
                      <span className="font-medium">{selectedProduct.rating}</span>
                      <span className="text-gray-500">({selectedProduct.reviews} avis)</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Prix actuel:</span>
                      <div className="text-2xl font-bold text-green-600">
                        {formatValueWithPoints(selectedProduct.price, true)}
                      </div>
                    </div>
                    {selectedProduct.originalPrice > selectedProduct.price && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Prix original:</span>
                        <div className="text-lg text-gray-500 line-through">
                          {formatValueWithPoints(selectedProduct.originalPrice, true)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Vendeur</h4>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {selectedProduct.seller && selectedProduct.seller.length > 0 ? selectedProduct.seller[0] : '?'}
                      </div>
                      <div>
                        <p className="font-medium">{selectedProduct.seller}</p>
                        <div className="flex items-center space-x-2">
                          <Star className="w-3 h-3 text-yellow-500 fill-current" />
                          <span className="text-sm">{selectedProduct.sellerRating}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Analyse IA</h4>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <p className="text-sm text-purple-700 font-medium">Pourquoi cette recommandation ?</p>
                      <p className="text-sm text-purple-600 mt-1">{selectedProduct.aiReason}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-4 border-t">
                <Button 
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  onClick={() => addProductToCart(selectedProduct)}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Ajouter au Panier
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => toggleProductFavorite(selectedProduct.id.toString())}
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Favoris
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => shareProduct(selectedProduct)}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Partager
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de détails du vendeur recommandé */}
      <Dialog open={showSellerDetailsModal} onOpenChange={setShowSellerDetailsModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] p-0 flex flex-col">
          <DialogHeader className="flex-shrink-0 p-6 pb-4">
            <DialogTitle className="flex items-center space-x-3">
              <Users className="w-6 h-6 text-green-600" />
              <span>Profil du Vendeur</span>
            </DialogTitle>
            <DialogDescription>
              Informations détaillées et statistiques du vendeur
            </DialogDescription>
          </DialogHeader>
          
          {selectedSeller && (
            <div className="flex-1 overflow-y-auto space-y-6 px-6 pb-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {/* En-tête du vendeur */}
              <div className="flex items-center space-x-6">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={selectedSeller.avatar} />
                  <AvatarFallback className="text-3xl">{selectedSeller.name && selectedSeller.name.length > 0 ? selectedSeller.name[0] : '?'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900">{selectedSeller.name}</h3>
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center space-x-2">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="font-medium">{selectedSeller.rating}</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      IA: {selectedSeller.aiConfidence}%
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Statistiques */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{selectedSeller.totalSales.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Ventes totales</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{selectedSeller.responseTime}</div>
                  <div className="text-sm text-gray-600">Temps de réponse</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{selectedSeller.specialties.length}</div>
                  <div className="text-sm text-gray-600">Spécialités</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">0%</div>
                  <div className="text-sm text-gray-600">Satisfaction</div>
                </div>
              </div>

              {/* Spécialités */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Spécialités</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedSeller.specialties.map((specialty: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-sm px-3 py-1">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Analyse IA */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Analyse IA</h4>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-700 font-medium">Pourquoi ce vendeur ?</p>
                  <p className="text-sm text-green-600 mt-1">{selectedSeller.aiReason}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-4 border-t">
                <Button 
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => contactSeller(selectedSeller)}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Contacter
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => viewSellerProfile(selectedSeller)}
                >
                  <ExternalLink className="w-4 h-2" />
                  Voir Profil Complet
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de détails de la promotion */}
      <Dialog open={showPromotionDetailsModal} onOpenChange={setShowPromotionDetailsModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] p-0 flex flex-col">
          <DialogHeader className="flex-shrink-0 p-6 pb-4">
            <DialogTitle className="flex items-center space-x-3">
              <Tag className="w-6 h-6 text-orange-600" />
              <span>Détails de la Promotion</span>
            </DialogTitle>
            <DialogDescription>
              Informations complètes et conditions de la promotion
            </DialogDescription>
          </DialogHeader>
          
          {selectedPromotion && (
            <div className="flex-1 overflow-y-auto space-y-6 px-6 pb-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {/* En-tête de la promotion */}
              <div className="text-center p-6 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-200">
                <h3 className="text-2xl font-bold text-orange-900 mb-2">{selectedPromotion.title}</h3>
                <div className="flex items-center justify-center space-x-3 mb-4">
                  <Badge className="bg-orange-500 text-white text-lg px-4 py-2 animate-pulse">
                    {selectedPromotion.value}
                  </Badge>
                  <Badge className="bg-purple-500 text-white text-lg px-4 py-2">
                    IA Détectée
                  </Badge>
                </div>
                <p className="text-gray-700">{selectedPromotion.description}</p>
              </div>

              {/* Statistiques */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{selectedPromotion.usageCount}</div>
                  <div className="text-sm text-gray-600">Utilisations</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{formatDate(selectedPromotion.endDate)}</div>
                  <div className="text-sm text-gray-600">Date de fin</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{selectedPromotion.priority}/5</div>
                  <div className="text-sm text-gray-600">Priorité IA</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {selectedPromotion.isActive ? 'Active' : 'Expirée'}
                  </div>
                  <div className="text-sm text-gray-600">Statut</div>
                </div>
              </div>

              {/* Conditions */}
              {(Array.isArray(selectedPromotion?.conditions) ? selectedPromotion.conditions : []).length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Conditions d'utilisation</h4>
                  <div className="space-y-2">
                    {(Array.isArray(selectedPromotion?.conditions) ? selectedPromotion.conditions : []).map((condition: string, index: number) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">{condition}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-3 pt-4 border-t">
                <Button 
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                  onClick={() => applyPromotion(selectedPromotion)}
                >
                  <Tag className="w-4 h-4 mr-2" />
                  En profiter
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => copyPromotionCode(selectedPromotion)}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copier le Code
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => togglePromotionFavorite(selectedPromotion.code)}
                  className={promotionFavorites.includes(selectedPromotion.code) ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100' : ''}
                >
                  <Heart className={`w-4 h-4 mr-2 ${promotionFavorites.includes(selectedPromotion.code) ? 'fill-current' : ''}`} />
                  {promotionFavorites.includes(selectedPromotion.code) ? 'Retirer' : 'Favoris'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => sharePromotion(selectedPromotion)}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Partager
                </Button>
              </div>
              
              {/* Actions secondaires */}
              <div className="flex space-x-3 pt-4 border-t">
                <Button 
                  variant="ghost" 
                  className={`w-full ${
                    promotionAlerts.includes(selectedPromotion.code) 
                      ? 'text-blue-500 bg-blue-50 hover:bg-blue-100' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    const hasAlert = promotionAlerts.includes(selectedPromotion.code)
                    
                    if (hasAlert) {
                      // Désactiver les alertes
                      setPromotionAlerts(prev => 
                        prev.filter(code => code !== selectedPromotion.code)
                      )
                      toast({
                        title: "Alertes désactivées !",
                        description: "Vous ne recevrez plus d'alertes pour cette promotion",
                        variant: "default",
                      })
                    } else {
                      // Activer les alertes
                      setPromotionAlerts(prev => [...prev, selectedPromotion.code])
                      toast({
                        title: "Alertes activées !",
                        description: "Vous recevrez des notifications pour cette promotion",
                        variant: "default",
                      })
                    }
                  }}
                >
                  <Bell className={`w-4 h-4 mr-2 ${
                    promotionAlerts.includes(selectedPromotion.code) ? 'fill-current' : ''
                  }`} />
                  {promotionAlerts.includes(selectedPromotion.code) ? 'Désactiver les alertes' : 'Activer les alertes'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de succès de promotion */}
      <Dialog open={showPromotionSuccessModal} onOpenChange={setShowPromotionSuccessModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <span>Promotion Appliquée !</span>
            </DialogTitle>
            <DialogDescription>
              Votre promotion a été activée avec succès
            </DialogDescription>
          </DialogHeader>
          
          {selectedPromotion && (
            <div className="space-y-4">
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {selectedPromotion.value}
                </div>
                <p className="text-sm text-green-700">{selectedPromotion.title}</p>
                <p className="text-xs text-green-600 mt-1">
                  Promotion active jusqu'au {formatDate(selectedPromotion.endDate)}
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Code de promotion:</span>
                  <code className="bg-gray-100 px-2 py-1 rounded font-mono">
                    {selectedPromotion.code || `PROMO-${selectedPromotion.id.slice(-6).toUpperCase()}`}
                  </code>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Utilisations restantes:</span>
                  <span className="font-medium">
                    {selectedPromotion.maxUsage ? selectedPromotion.maxUsage - (promotionUsage[selectedPromotion.id] || 0) : 'Illimité'}
                  </span>
                </div>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowPromotionSuccessModal(false)}
                >
                  Fermer
                </Button>
                <Button 
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    setShowPromotionSuccessModal(false)
                    // Ouvrir le modal des produits éligibles à la promotion
                    setShowProductsModal(true)
                    toast({
                      title: "Produits éligibles !",
                      description: "Affichage des produits concernés par cette promotion",
                      variant: "default",
                    })
                  }}
                >
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Voir les Produits
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de produit ajouté au panier */}
      <Dialog open={showProductAddedModal} onOpenChange={setShowProductAddedModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <span>Produit Ajouté !</span>
            </DialogTitle>
            <DialogDescription>
              Votre produit a été ajouté au panier avec succès
            </DialogDescription>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{selectedProduct.name}</h4>
                  <p className="text-sm text-gray-600">{selectedProduct.category}</p>
                  <div className="text-lg font-bold text-green-600">
                    {formatValueWithPoints(selectedProduct.price, true)}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Quantité:</span>
                  <span className="font-medium">1</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Total panier:</span>
                  <div className="font-medium">
                    {formatValueWithPoints(productCart.reduce((sum, item) => sum + item.price, 0), true)}
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowProductAddedModal(false)}
                >
                  Continuer les Achats
                </Button>
                <Button 
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    setShowProductAddedModal(false)
                    // Ouvrir directement le modal panier via un événement personnalisé
                    if (typeof window !== 'undefined') {
                      // Dispatcher un événement pour ouvrir le modal panier
                      window.dispatchEvent(new CustomEvent('openCartModal'))
                      toast({
                        title: "Panier ouvert !",
                        description: "Votre panier s'affiche maintenant",
                        variant: "default",
                      })
                    }
                  }}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Voir le Panier
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>



      {/* Modal de transfert de messages */}
      <Dialog open={showTransferModal} onOpenChange={setShowTransferModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Send className="w-5 h-5 text-blue-600" />
              <span>Transférer les Messages</span>
            </DialogTitle>
            <DialogDescription>
              Sélectionnez le vendeur vers lequel transférer {selectedTransferMessageIds.length} message(s)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Liste des vendeurs disponibles */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Vendeurs disponibles :</h4>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {realSellers.map((seller) => (
                  <div
                    key={seller.name}
                    className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                      selectedTransferSeller === seller.name
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedTransferSeller(seller.name)}
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={seller.avatar} alt={seller.name} />
                      <AvatarFallback className="bg-gray-100 text-gray-700 text-xs">
                        {seller.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">{seller.name}</span>
                        {seller.isOnline && (
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{seller.lastMessage}</p>
                    </div>
                    {selectedTransferSeller === seller.name && (
                      <Check className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setShowTransferModal(false)
                  setSelectedTransferSeller(null)
                }}
              >
                Annuler
              </Button>
              <Button 
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={confirmTransfer}
                disabled={!selectedTransferSeller}
              >
                <Send className="h-4 w-4 mr-2" />
                Transférer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Menu de partage */}
      <Dialog open={showShareMenu} onOpenChange={setShowShareMenu}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Share2 className="w-5 h-5 text-blue-600" />
              <span>Partager ce Produit</span>
            </DialogTitle>
            <DialogDescription>
              Choisissez votre plateforme de partage préférée
            </DialogDescription>
          </DialogHeader>
          
          {selectedItemForShare && (
            <div className="space-y-4">
              {/* Options de partage */}
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className="w-full bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                  onClick={() => executeShare('facebook', selectedItemForShare)}
                >
                  <div className="w-6 h-6 bg-blue-600 rounded mr-2" />
                  Facebook
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                  onClick={() => executeShare('twitter', selectedItemForShare)}
                >
                  <div className="w-6 h-6 bg-blue-400 rounded mr-2" />
                  Twitter/X
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                  onClick={() => executeShare('whatsapp', selectedItemForShare)}
                >
                  <div className="w-6 h-6 bg-green-600 rounded mr-2" />
                  WhatsApp
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                  onClick={() => executeShare('telegram', selectedItemForShare)}
                >
                  <div className="w-6 h-6 bg-purple-600 rounded mr-2" />
                  Telegram
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                  onClick={() => executeShare('email', selectedItemForShare)}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
                  onClick={() => executeShare('copy', selectedItemForShare)}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copier Lien
                </Button>
              </div>

              {/* Lien direct */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Lien direct</Label>
                <div className="flex items-center space-x-2">
                  <Input 
                    value={`${window.location.origin}/product/${selectedItemForShare.id}`}
                    readOnly
                    className="flex-1"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/product/${selectedItemForShare.id}`)
                      toast({
                        title: "Lien copié !",
                        description: "Le lien a été copié dans votre presse-papiers",
                        variant: "default",
                      })
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  variant="outline"
                  onClick={() => setShowShareMenu(false)}
                >
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  )
}
