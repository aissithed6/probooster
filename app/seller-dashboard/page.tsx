"use client"

import { Suspense, useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { 
  LayoutDashboard, Package, ShoppingCart, TrendingUp, Trophy, MessageCircle,
  Share2, Tag, Gift, Star, BarChart3, User, Plus, Bell, HelpCircle, LogOut,
  Eye, Edit, Trash2, CheckCircle, XCircle, Clock, AlertTriangle, DollarSign,
  Users, Target, Award, TrendingDown, Activity, Calendar, Search, Filter, Crown,
    ChevronDown, Mail, Send, Info, X, Phone, CreditCard, Settings, MapPin, Globe, Truck, Download, RefreshCw, Check
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

// Import des composants de sections
import ProductManagement from '@/components/seller-dashboard/product-management'
import OrderManagement from '@/components/seller-dashboard/order-management'
import RevenueManagement from '@/components/seller-dashboard/revenue-management'
import PointSection from '@/components/seller-dashboard/point-section'
import PaymentRequestsSection from '@/components/seller-dashboard/payment-requests-section'
import RankingSection from '@/components/seller-dashboard/ranking-section'
import VendorDeliveryManagement from '@/components/seller-dashboard/vendor-delivery-management'

import SharesEngagementSectionSynced from '@/components/seller-dashboard/shares-engagement-section-synced'
import MarketingPromotionsSection from '@/components/seller-dashboard/marketing-promotions-section'
import ReviewsSection from '@/components/seller-dashboard/reviews-section'
import StatisticsAnalyticsSection from '@/components/seller-dashboard/statistics-analytics-section'
import ProfileSection from '@/components/seller-dashboard/profile-section'
import { useMoney } from '@/lib/hooks/use-money'
import { EditableMessagesBanner } from '@/components/messages/EditableMessagesBanner'
import { useDateTime } from '@/lib/hooks/use-date-time'

import AdvancedProductModal from '@/components/seller-dashboard/advanced-product-modal'
import InternalMessagingSectionSynced from '@/components/seller-dashboard/internal-messaging-section-synced'
import { SellerChatInterfaceClientStyle } from '@/components/chat'
import { useToast } from '@/hooks/use-toast'
import { ClientPointsService } from '@/lib/services/client-points-service'
import { useAuth } from '@/contexts/AuthContext'
import { ProductCategoryProvider } from '@/contexts/product-category-context'
import { useRouter, useSearchParams } from 'next/navigation'

import { DashboardService } from '@/lib/services/dashboard-service'
import { supabase } from '@/lib/supabase'

// Import du service tableau de bord vendeur
import { 
  useSellerDashboardData,
  SellerDashboardService,
  type SellerStats,
  type SellerProduct,
  type SellerOrder,
  type SellerRevenue,
  type SellerProfile,
  type SellerPointsData,
  type SellerReview,
  type SellerRanking,
  type SellerDashboardData
} from '@/lib/services/seller-dashboard-service'
import { SellerDashboardApi } from '@/lib/services/seller-dashboard-service.api'
import type { SharedProductInput } from '@/lib/types/shared-product'
import { ClientAuthService } from '@/lib/services/client-auth-service'
import { computeReputationStats } from '@/lib/product-reviews'

// Tous les types sont maintenant importés du service

const SELLER_TAB_SLUG_BY_ID: Record<string, string> = {
  overview: '',
  products: 'produits',
  orders: 'commandes',
  deliveries: 'livraisons',
  revenue: 'chiffre-affaires',
  'payment-requests': 'demandes-paiement',
  rankings: 'classements',
  chat: 'chat',
  messaging: 'messagerie',
  notifications: 'notifications',
  shares: 'partages',
  marketing: 'marketing',
  points: 'points',
  reviews: 'avis',
  analytics: 'analyses',
  settings: 'parametres',
  'currency-test': 'test-devises'
}

const SELLER_TAB_ID_BY_SLUG: Record<string, string> = Object.entries(SELLER_TAB_SLUG_BY_ID).reduce(
  (acc, [id, slug]) => {
    if (slug) {
      acc[slug] = id
    }
    return acc
  },
  {} as Record<string, string>
)

// Sections du tableau de bord
const sellerDashboardSections = [
  {
    id: 'overview',
    label: 'Vue d\'ensemble',
    icon: LayoutDashboard,
    description: 'Statistiques générales et aperçu des performances'
  },
  {
    id: 'products',
    label: 'Gestion Produits',
    icon: Package,
    description: 'Création, édition et gestion des produits'
  },
  {
    id: 'orders',
    label: 'Commandes & Ventes',
    icon: ShoppingCart,
    description: 'Suivi des commandes et gestion des ventes'
  },
  {
    id: 'deliveries',
    label: 'Suivi des livraisons',
    icon: Truck,
    description: 'Suivi opérationnel des livraisons confiées au vendeur'
  },
  {
    id: 'revenue',
    label: 'Chiffre d\'Affaires',
    icon: TrendingUp,
    description: 'Analyses financières et revenus'
  },
  {
    id: 'payment-requests',
    label: 'Demandes de Paiement',
    icon: DollarSign,
    description: 'Demandes de paiement pour les ventes livrées'
  },
  {
    id: 'rankings',
    label: 'Classements',
    icon: Trophy,
    description: 'Positionnement dans la marketplace'
  },
  {
    id: 'chat',
    label: 'Chat',
    icon: MessageCircle,
    description: 'Chat avec clients et administration'
  },
  {
    id: 'messaging',
    label: 'Messagerie Interne',
    icon: Mail,
    description: 'Messages internes avec l\'administration'
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    description: 'Notifications in-app reçues du super admin'
  },
  {
    id: 'shares',
    label: 'Partages & Engagement',
    icon: Share2,
    description: 'Suivi des partages et engagement utilisateur'
  },
  {
    id: 'marketing',
    label: 'Marketing & Promotions',
    icon: Tag,
    description: 'Codes promo et campagnes marketing'
  },
  {
    id: 'points',
    label: 'Point',
    icon: Gift,
    description: 'Gestion des points et récompenses'
  },
  {
    id: 'reviews',
    label: 'Avis & Réputation',
    icon: Star,
    description: 'Gestion des avis et réputation'
  },
  {
    id: 'analytics',
    label: 'Statistiques & Analyses',
    icon: BarChart3,
    description: 'Analyses avancées et rapports'
  },
  {
    id: 'settings',
    label: 'Paramètres',
    icon: Settings,
    description: 'Préférences (thème, langue, devise, fuseau horaire)'
  },
  {
    id: 'currency-test',
    label: 'Test Devises',
    icon: DollarSign,
    description: "Vérifiez l'affichage des prix et points Probooster"
  }
]

/**
 * Page dashboard vendeur.
 * Next.js exige que l'usage de useSearchParams() soit rendu sous Suspense lors du build/prerender.
 */
export default function SellerDashboardPage() {
  return (
    <Suspense fallback={<div className="p-6" />}> 
      <SellerDashboardPageInner />
    </Suspense>
  )
}

/**
 * Contient la logique principale du dashboard vendeur (hooks et rendu).
 */
function SellerDashboardPageInner() {
  // Hook d'authentification pour obtenir l'utilisateur connecté
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, userProfile, loyaltyPoints, loading: authLoading } = useAuth()
  const { formatMoney, currencyCode } = useMoney()
  const { formatTime } = useDateTime()
  const { toast } = useToast()
  
  const [activeTab, setActiveTab] = useState('overview')
  const [settingsTab, setSettingsTab] = useState<'preferences' | 'security' | 'documents' | 'profile'>('preferences')
  const [showChatModal, setShowChatModal] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [showRevenueModal, setShowRevenueModal] = useState(false)
  
  // États pour les sessions actives
  const [activeSessions, setActiveSessions] = useState<any[]>([])
  
  // États pour les modales de l'en-tête
  const [showNotificationsModal, setShowNotificationsModal] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  
  // États pour le chat support
  const [showChatSupportModal, setShowChatSupportModal] = useState(false)
  const [chatMessage, setChatMessage] = useState('')
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [chatStatus, setChatStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected')
  
  // États pour l'email support
  const [showEmailSupportModal, setShowEmailSupportModal] = useState(false)
  const [emailSubject, setEmailSubject] = useState('')
  const [emailMessage, setEmailMessage] = useState('')
  const [emailCategory, setEmailCategory] = useState('general')
  const [isSendingEmail, setIsSendingEmail] = useState(false)

  // États pour la section Test Devises
  const [testBasePrice, setTestBasePrice] = useState(129900)
  const [deferredInterestRate, setDeferredInterestRate] = useState(10) // 10% par défaut

  const [vendorNotifications, setVendorNotifications] = useState<any[]>([])
  const vendorUnreadNotifications = vendorNotifications.filter((n) => !(n?.is_read ?? n?.isRead ?? false)).length

  const vendorNotificationsRealtimeRefreshTimerRef = useRef<number | null>(null)

  const [vendorNotificationCategory, setVendorNotificationCategory] = useState<string>('all')

  const [showAdvancedProductModal, setShowAdvancedProductModal] = useState(false)
  const [productModalMode, setProductModalMode] = useState<'create' | 'edit'>('create')
  const [selectedProduct, setSelectedProduct] = useState<any>(null)

  // Hook du service tableau de bord vendeur
  useEffect(() => {
    if (!user?.id) {
      router.replace('/auth/login?redirect=/seller-dashboard')
    }
  }, [router, user?.id])

  const resolveTabFromPathname = useCallback(() => {
    if (typeof window === 'undefined') return 'overview'
    const raw = String(window.location.pathname ?? '')
    const prefix = '/seller-dashboard'
    if (!raw.startsWith(prefix)) return 'overview'
    const rest = raw.slice(prefix.length)
    const candidate = rest.replace(/^\/+/, '').split('/')[0] || ''
    const fromPath = candidate ? (SELLER_TAB_ID_BY_SLUG[candidate] ?? '') : 'overview'
    return fromPath && Object.prototype.hasOwnProperty.call(SELLER_TAB_SLUG_BY_ID, fromPath)
      ? fromPath
      : 'overview'
  }, [])

  const navigateToTab = useCallback(
    (tabId: string, mode: 'push' | 'replace' = 'push') => {
      const slug = SELLER_TAB_SLUG_BY_ID[tabId]
      const nextUrl = slug ? `/seller-dashboard/${slug}` : '/seller-dashboard'

      setActiveTab(tabId)

      if (typeof window !== 'undefined') {
        try {
          if (mode === 'replace') {
            window.history.replaceState(null, '', nextUrl)
          } else {
            window.history.pushState(null, '', nextUrl)
          }
          return
        } catch {
          // fallback below
        }
      }

      if (mode === 'replace') {
        router.replace(nextUrl)
      } else {
        router.push(nextUrl)
      }
    },
    [router]
  )

  useEffect(() => {
    const initial = resolveTabFromPathname()
    setActiveTab((previous) => (previous === initial ? previous : initial))

    if (typeof window === 'undefined') return
    const onPopState = () => {
      const next = resolveTabFromPathname()
      setActiveTab((previous) => (previous === next ? previous : next))
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [resolveTabFromPathname])

  /**
   * Permet la navigation par URL vers un onglet précis (ex: redirection depuis une liste de messages).
   * Aligné avec le comportement du dashboard client, sans modifier la logique des sections.
   */
  useEffect(() => {
    if (typeof window === 'undefined') return
    const rawPath = String(window.location.pathname ?? '')
    if (rawPath.startsWith('/seller-dashboard/')) return
    const rawQueryTab = String(searchParams?.get('tab') ?? '').trim().toLowerCase()
    const rawHashTab = String((window.location.hash || '').replace(/^#/, '') ?? '').trim().toLowerCase()
    const next = rawQueryTab || rawHashTab
    if (next && sellerDashboardSections.some((s) => s.id === next)) {
      navigateToTab(next, 'replace')
    }
  }, [navigateToTab, searchParams])

  const vendorId = user?.id || ''
  const { data: dashboardData, loading, error, refreshData } = useSellerDashboardData(vendorId, {
    skip: !user?.id
  })

  const [ordersState, setOrdersState] = useState<SellerOrder[]>([])
  const ordersRealtimeRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setOrdersState(Array.isArray(dashboardData?.orders) ? (dashboardData?.orders as SellerOrder[]) : [])
  }, [dashboardData?.orders])

  useEffect(() => {
    if (!vendorId) return

    const channel = supabase
      .channel(`realtime:vendor_orders:${vendorId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `vendor_id=eq.${vendorId}`
        },
        () => {
          if (ordersRealtimeRefreshTimerRef.current) {
            clearTimeout(ordersRealtimeRefreshTimerRef.current)
          }
          ordersRealtimeRefreshTimerRef.current = window.setTimeout(() => {
            ordersRealtimeRefreshTimerRef.current = null
            void refreshData()
          }, 150)
        }
      )
      .subscribe()

    return () => {
      if (ordersRealtimeRefreshTimerRef.current) {
        clearTimeout(ordersRealtimeRefreshTimerRef.current)
        ordersRealtimeRefreshTimerRef.current = null
      }
      try {
        supabase.removeChannel(channel)
      } catch {
        // ignore
      }
    }
  }, [refreshData, vendorId])

  // Realtime demandes de paiement : quand le Super Admin approuve/rejette une
  // demande (finance_payment_requests), le dashboard vendeur se rafraîchit
  // immédiatement (cartes paiements en attente / reçus, badges, montants).
  const paymentRequestsRealtimeRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!vendorId) return

    const channel = supabase
      .channel(`realtime:vendor_payment_requests:${vendorId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'finance_payment_requests',
          filter: `vendor_id=eq.${vendorId}`
        },
        () => {
          if (paymentRequestsRealtimeRefreshTimerRef.current) {
            clearTimeout(paymentRequestsRealtimeRefreshTimerRef.current)
          }
          paymentRequestsRealtimeRefreshTimerRef.current = window.setTimeout(() => {
            paymentRequestsRealtimeRefreshTimerRef.current = null
            void refreshData()
          }, 250)
        }
      )
      .subscribe()

    return () => {
      if (paymentRequestsRealtimeRefreshTimerRef.current) {
        clearTimeout(paymentRequestsRealtimeRefreshTimerRef.current)
        paymentRequestsRealtimeRefreshTimerRef.current = null
      }
      try {
        supabase.removeChannel(channel)
      } catch {
        // ignore
      }
    }
  }, [refreshData, vendorId])

  // Realtime avis & réputation : nouveau client avis / réponse / modération
  // (product_reviews + product_review_responses sur les produits du vendeur)
  // → refresh de la section Avis pour qu'elle reste synchronisée à 100 %.
  const reviewsRealtimeRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!vendorId) return

    const channel = supabase
      .channel(`realtime:vendor_reviews:${vendorId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'product_reviews' },
        () => {
          if (reviewsRealtimeRefreshTimerRef.current) {
            clearTimeout(reviewsRealtimeRefreshTimerRef.current)
          }
          reviewsRealtimeRefreshTimerRef.current = window.setTimeout(() => {
            reviewsRealtimeRefreshTimerRef.current = null
            void refreshData()
          }, 350)
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'product_review_responses' },
        () => {
          if (reviewsRealtimeRefreshTimerRef.current) {
            clearTimeout(reviewsRealtimeRefreshTimerRef.current)
          }
          reviewsRealtimeRefreshTimerRef.current = window.setTimeout(() => {
            reviewsRealtimeRefreshTimerRef.current = null
            void refreshData()
          }, 350)
        }
      )
      .subscribe()

    return () => {
      if (reviewsRealtimeRefreshTimerRef.current) {
        clearTimeout(reviewsRealtimeRefreshTimerRef.current)
        reviewsRealtimeRefreshTimerRef.current = null
      }
      try {
        supabase.removeChannel(channel)
      } catch {
        // ignore
      }
    }
  }, [refreshData, vendorId])

  const syncVendorNotificationsFromDb = useCallback(async () => {
    if (!vendorId) return
    try {
      const fresh = await DashboardService.getUserNotifications(vendorId)
      setVendorNotifications(Array.isArray(fresh) ? fresh : [])
    } catch {
      // ignore (best-effort)
    }
  }, [vendorId])

  useEffect(() => {
    if (!vendorId) return

    const channel = supabase
      .channel(`realtime:vendor_notifications:${vendorId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${vendorId}`
        },
        () => {
          if (vendorNotificationsRealtimeRefreshTimerRef.current) {
            clearTimeout(vendorNotificationsRealtimeRefreshTimerRef.current)
          }
          vendorNotificationsRealtimeRefreshTimerRef.current = window.setTimeout(() => {
            vendorNotificationsRealtimeRefreshTimerRef.current = null
            void syncVendorNotificationsFromDb()
          }, 250)
        }
      )
      .subscribe()

    return () => {
      if (vendorNotificationsRealtimeRefreshTimerRef.current) {
        clearTimeout(vendorNotificationsRealtimeRefreshTimerRef.current)
        vendorNotificationsRealtimeRefreshTimerRef.current = null
      }
      try {
        supabase.removeChannel(channel)
      } catch {
        // ignore
      }
    }
  }, [syncVendorNotificationsFromDb, vendorId])

  useEffect(() => {
    setVendorNotifications(Array.isArray(dashboardData?.notifications) ? dashboardData?.notifications : [])
  }, [dashboardData?.notifications])

  /**
   * Fabrique un payload minimal pour éviter un écran blanc si pointsData est indisponible.
   */
  const buildFallbackPointsData = () => {
    const balance = Number((loyaltyPoints as any)?.points_balance ?? 0)
    const isFrozen = Boolean((loyaltyPoints as any)?.is_frozen ?? false)
    const freezeReasonRaw = ((loyaltyPoints as any)?.freeze_reason ?? null) as any
    const freezeReason = freezeReasonRaw ? String(freezeReasonRaw) : null

    return {
      balance,
      isFallback: true,
      isFrozen,
      freezeReason,
      totalEarned: Number((loyaltyPoints as any)?.points_earned ?? 0),
      totalSpent: Number((loyaltyPoints as any)?.points_spent ?? 0),
      totalTransferred: 0,
      conversionRate: 1,
      exchangeRate: 1,
      pendingRequests: 0,
      sharesData: {
        totalShares: 0,
        sharesThisMonth: 0,
        pointsFromShares: 0,
        viralScore: 0,
        topSharedProducts: [],
        socialNetworkStats: {
          facebook: { shares: 0, points: 0, engagement: 0 },
          instagram: { shares: 0, points: 0, engagement: 0 },
          twitter: { shares: 0, points: 0, engagement: 0 },
          whatsapp: { shares: 0, points: 0, engagement: 0 },
          linkedin: { shares: 0, points: 0, engagement: 0 }
        },
        userEngagement: []
      },
      history: [],
      topEarners: [],
      exchangeHistory: [],
      withdrawalRequests: [],
      predictiveAnalytics: {
        nextMonthPrediction: 0,
        growthTrend: 'stable',
        recommendedActions: [],
        marketOpportunities: []
      },
      configuration: {
        settings: {
          defaultCurrency: 'XOF',
          conversionRate: 1,
          minBalance: 0,
          maxBalance: null,
          transferEnabled: true,
          exchangeEnabled: true,
          withdrawalEnabled: true
        },
        fees: {
          transfer: { flat: 0, percentage: 0, minimum: 0, maximum: null, currency: 'XOF' },
          exchange: { flat: 0, percentage: 0, minimum: 0, maximum: null, currency: 'XOF' },
          withdrawal: { flat: 0, percentage: 0, minimum: 0, maximum: null, currency: 'XOF' }
        },
        limits: {
          transfer: { min: 0, max: null, daily: null, monthly: null },
          exchange: { min: 0, max: null, daily: null, monthly: null },
          withdrawal: { min: 0, max: null, daily: null, monthly: null }
        },
        exchangeRates: [],
        withdrawalMethods: []
      }
    }
  }

  /**
   * Marque toutes les notifications du vendeur comme lues (persisté en base), puis synchronise l'UI.
   */
  const handleVendorMarkAllNotificationsRead = async () => {
    if (!vendorId) return

    try {
      await DashboardService.markAllNotificationsRead(vendorId)
      setVendorNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      toast({
        title: 'Notifications',
        description: 'Toutes les notifications ont été marquées comme lues.'
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible de tout marquer comme lu."
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive' as any
      })

      throw err
    }
  }

  /**
   * Supprime uniquement les notifications lues du vendeur (persisté en base), puis synchronise l'UI.
   */
  const handleVendorDeleteReadNotifications = async () => {
    if (!vendorId) return

    try {
      const deletedCount = await DashboardService.deleteReadNotifications(vendorId)
      setVendorNotifications((prev) => prev.filter((n) => !(n?.is_read ?? n?.isRead ?? false)))
      toast({
        title: 'Notifications',
        description: deletedCount > 0 ? `${deletedCount} notification(s) lue(s) supprimée(s).` : 'Aucune notification lue à supprimer.'
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible de supprimer les notifications lues."
      toast({
        title: 'Notifications',
        description: message,
        variant: 'destructive'
      })
    }
  }

  useEffect(() => {
    if (!user?.id) return
    if (!loyaltyPoints) return

    const dashboardBalance = Number(dashboardData?.loyaltyPoints?.points_balance ?? 0)
    const authBalance = Number(loyaltyPoints.points_balance ?? 0)

    const dashboardFrozen = Boolean((dashboardData?.loyaltyPoints as any)?.is_frozen ?? false)
    const authFrozen = Boolean((loyaltyPoints as any)?.is_frozen ?? false)
    const dashboardFreezeReason = String(((dashboardData?.loyaltyPoints as any)?.freeze_reason ?? '') as any)
    const authFreezeReason = String(((loyaltyPoints as any)?.freeze_reason ?? '') as any)

    if (
      dashboardData &&
      (authBalance !== dashboardBalance || authFrozen !== dashboardFrozen || authFreezeReason !== dashboardFreezeReason)
    ) {
      void refreshData()
    }
  }, [dashboardData, loyaltyPoints, refreshData, user?.id])



    // Statistiques vendeur depuis le service (remplace les données mock)
  const sellerStats: SellerStats = dashboardData?.stats || {
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    totalCommissions: 0,
    totalPoints: 0,
    averageRating: 0,
    totalReviews: 0,
    totalShares: 0,
    ranking: 0,
    totalVendors: 0,
    responseRate: 0,
    averageResponseTime: 0
  }

  const sellerProfile = useMemo((): SellerProfile | null => {
    if (dashboardData?.sellerProfile) return dashboardData.sellerProfile
    if (!user?.id) return null
    return SellerDashboardService.buildSellerProfileFromSources({
      vendorId: user.id,
      email: user.email,
      userProfile: userProfile ?? null,
      stats: sellerStats,
      isVerified: user.role === 'vendor'
    })
  }, [dashboardData?.sellerProfile, user, userProfile, sellerStats])

  // Fonction utilitaire pour formater les dates
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return 'Hier'
    if (diffDays < 7) return `Il y a ${diffDays} jours`
    if (diffDays < 30) return `Il y a ${Math.ceil(diffDays / 7)} semaines`
    if (diffDays < 365) return `Il y a ${Math.ceil(diffDays / 30)} mois`
    return date.toLocaleDateString('fr-FR')
  }

  const mapVendorNotificationColor = (notification: any) => {
    const rawType = String(notification?.type ?? notification?.notification_type ?? 'info').toLowerCase()
    if (rawType === 'promotion' || rawType === 'promo') return 'bg-[#ff6600]'
    if (rawType === 'success') return 'bg-green-500'
    if (rawType === 'warning') return 'bg-yellow-500'
    if (rawType === 'error') return 'bg-red-500'
    return 'bg-[#3b82f6]'
  }

  /**
   * Normalise la catégorie d'une notification (champ DB `category` ou fallback sur `type`).
   */
  const getVendorNotificationCategory = (notification: any) => {
    const raw = notification?.category ?? notification?.notification_category ?? notification?.type ?? notification?.notification_type
    const value = String(raw ?? 'general').trim().toLowerCase()
    return value.length > 0 ? value : 'general'
  }

  const vendorNotificationCategories = useMemo(() => {
    const categories = new Set<string>()
    vendorNotifications.forEach((n) => {
      categories.add(getVendorNotificationCategory(n))
    })
    return Array.from(categories).sort((a, b) => a.localeCompare(b, 'fr'))
  }, [vendorNotifications])

  const filteredVendorNotifications = useMemo(() => {
    if (vendorNotificationCategory === 'all') return vendorNotifications
    return vendorNotifications.filter((n) => getVendorNotificationCategory(n) === vendorNotificationCategory)
  }, [vendorNotificationCategory, vendorNotifications])

  const handleVendorMarkNotificationRead = async (notificationId: string) => {
    try {
      await DashboardService.markNotificationRead(notificationId, true)
      setVendorNotifications((prev) => prev.map((n) => (String(n?.id) === notificationId ? { ...n, is_read: true } : n)))
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible de marquer la notification comme lue."
      toast({
        title: 'Notifications',
        description: message,
        variant: 'destructive'
      })
    }
  }

  const handleVendorDeleteNotification = async (notificationId: string) => {
    try {
      await DashboardService.deleteNotification(notificationId)
      setVendorNotifications((prev) => prev.filter((n) => String(n?.id) !== notificationId))
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible de supprimer la notification."
      toast({
        title: 'Notifications',
        description: message,
        variant: 'destructive'
      })
    }
  }

  // Produits depuis le service (remplace les données mock)
  const products: SellerProduct[] = dashboardData?.products || []

  // Commandes depuis le service (remplace les données mock)
  const orders: SellerOrder[] = ordersState

  // Revenus depuis le service (remplace les données mock)
  const revenue: SellerRevenue = dashboardData?.revenue || {
    totalRevenue: 0,
    totalCommissions: 0,
    netRevenue: 0,
    pendingPayments: 0,
    completedPayments: 0,
    monthlyRevenue: [0, 0, 0, 0, 0, 0],
    monthlyOrders: [0, 0, 0, 0, 0, 0],
    salesEvolution: [],
    topProducts: [],
    revenueByCategory: [],
    paymentHistory: []
  }

  const topProducts = Array.isArray(revenue?.topProducts) ? revenue.topProducts : []
  const salesEvolution = Array.isArray((revenue as any)?.salesEvolution) ? ((revenue as any).salesEvolution as any[]) : []

  // Données de points depuis le service (remplace les données mock)
  const pointsData = dashboardData?.pointsData
  const pointSettingsConfig = pointsData?.configuration
  const sellerDefaultCurrency = pointSettingsConfig?.settings.defaultCurrency ?? currencyCode
  const sellerConversionRate = pointSettingsConfig?.settings.conversionRate ?? 1
  const sellerConversionRateSafe = sellerConversionRate > 0 ? sellerConversionRate : 1
  const sellerPointsPerCurrencyLabel = sellerConversionRate > 0
    ? (1 / sellerConversionRate).toLocaleString('fr-FR', { maximumFractionDigits: 2 })
    : '0'
  const sellerCurrencyPerPointLabel = sellerConversionRateSafe.toLocaleString('fr-FR', { maximumFractionDigits: 2 })
  const standardPricePoints = Math.round(129900 / sellerConversionRateSafe).toLocaleString('fr-FR')
  const promoPricePoints = Math.round(119900 / sellerConversionRateSafe).toLocaleString('fr-FR')
  const deliveryPricePoints = Math.round(599 / sellerConversionRateSafe).toLocaleString('fr-FR')

  // Avis depuis le service (remplace les données mock)
  const vendorReviews = (dashboardData?.reviews || []) as SellerReview[]
  const reviewsData = useMemo(
    () => ({
      reviews: vendorReviews,
      reputationData: computeReputationStats(vendorReviews as any)
    }),
    [vendorReviews]
  )

  const isDeliveredLikeStatus = (status: unknown) => {
    const s = String(status ?? '').trim().toLowerCase()
    if (!s) return false
    if (s === 'delivered') return true
    if (s === 'completed') return true
    if (s.includes('deliver')) return true
    if (s.includes('livr')) return true
    return false
  }

  const isOrderDeliveredLike = (order: any): boolean => {
    return (
      isDeliveredLikeStatus(order?.status) ||
      isDeliveredLikeStatus(order?.deliveryStatus ?? order?.delivery_status) ||
      isDeliveredLikeStatus(order?.payment_status ?? order?.paymentStatus)
    )
  }

  const isPaidLikeStatus = (value: unknown): boolean => {
    const s = typeof value === 'string' ? value.trim().toLowerCase() : ''
    if (!s) return false
    if (s === 'unpaid' || s === 'failed' || s === 'cancelled' || s === 'canceled' || s === 'pending') return false
    return s.includes('paid') || s.includes('success') || s.includes('succeed')
  }

  const isDeliveryRequiredFromOrder = (order: any): boolean => {
    const shippingMethodId = order?.shipping_method_id ?? order?.shippingMethodId
    const deliveryId = order?.delivery_id ?? order?.deliveryId
    const shippingLat = order?.shipping_lat ?? order?.shippingLat
    const shippingLng = order?.shipping_lng ?? order?.shippingLng
    const deliveryOption = order?.delivery_option ?? order?.deliveryOption

    const shippingMethod = order?.shipping_method ?? order?.shippingMethod

    const shippingMethodName = (() => {
      if (!shippingMethod) return ''
      if (typeof shippingMethod === 'string') return shippingMethod
      if (typeof shippingMethod === 'object') {
        const name = (shippingMethod as any)?.name
        return typeof name === 'string' ? name : ''
      }
      return ''
    })()

    const shippingMethodNameRaw = shippingMethodName.trim().toLowerCase()

    const hasShippingMethod = (() => {
      if (!shippingMethod) return false
      if (typeof shippingMethod === 'string') return shippingMethod.trim().length > 0
      if (typeof shippingMethod === 'object') {
        const id = (shippingMethod as any)?.id ?? (shippingMethod as any)?.shipping_method_id
        const name = (shippingMethod as any)?.name
        return Boolean(id) || (typeof name === 'string' && name.trim().length > 0)
      }
      return false
    })()

    const hasCoords =
      (typeof shippingLat === 'number' && Number.isFinite(shippingLat)) ||
      (typeof shippingLng === 'number' && Number.isFinite(shippingLng))

    const deliveryOptionRaw = typeof deliveryOption === 'string' ? deliveryOption.trim().toLowerCase() : ''
    const explicitNoDelivery = deliveryOptionRaw === 'none' || deliveryOptionRaw === 'no_delivery' || deliveryOptionRaw.includes('pas de liv')
    if (explicitNoDelivery) return false

    const shippingMethodIsNoDelivery =
      shippingMethodNameRaw === 'none' ||
      shippingMethodNameRaw === 'no_delivery' ||
      shippingMethodNameRaw.includes('pas de liv') ||
      shippingMethodNameRaw.includes('no delivery')
    if (shippingMethodIsNoDelivery) return false

    const items = Array.isArray(order?.products) ? order.products : []
    const hasItems = items.length > 0
    const allItemsDigital = hasItems && items.every((it: any) => Boolean(it?.isDigital))
    if (allItemsDigital) return false

    const deliveryOptionSuggestsDelivery =
      Boolean(deliveryOptionRaw) &&
      (deliveryOptionRaw.includes('deliver') || deliveryOptionRaw.includes('livr') || deliveryOptionRaw.includes('shipping'))

    if (shippingMethodId) return true
    if (hasShippingMethod) return true
    if (deliveryId) return true
    if (hasCoords) return true
    if (deliveryOptionSuggestsDelivery) return true

    return false
  }

  // Commandes livrées depuis le service (remplace les données mock)
  const deliveredOrders = (ordersState ?? []).filter((order: any) => isOrderDeliveredLike(order))

  const payoutCandidateOrders = (ordersState ?? []).filter((order: any) => {
    const statusRaw = String(order?.status ?? '').trim().toLowerCase()
    if (statusRaw === 'cancelled' || statusRaw === 'canceled') return false
    const deliveredLike = isOrderDeliveredLike(order)
    const paidLike = isPaidLikeStatus(order?.payment_status ?? order?.paymentStatus)
    return deliveredLike || paidLike
  })

  const payoutWithdrawableOrders = payoutCandidateOrders.filter((order: any) => {
    const requiresDelivery = isDeliveryRequiredFromOrder(order)
    const deliveredLike = isOrderDeliveredLike(order)
    const paidLike = isPaidLikeStatus(order?.payment_status ?? order?.paymentStatus)
    return requiresDelivery ? deliveredLike : paidLike
  })

  useEffect(() => {
    try {
      const debugFlag = String(searchParams?.get('debugPayout') ?? '').trim()
      const enabled = debugFlag === '1' || debugFlag.toLowerCase() === 'true'
      if (!enabled) return

      const resolveNetAmount = (o: any): number => {
        const netCandidate = Number(
          o?.netRevenue ??
            o?.net_revenue ??
            o?.net_revenue_amount ??
            o?.net_amount ??
            o?.final_total ??
            o?.totalAmount ??
            o?.total_amount ??
            0
        )
        const grossCandidate = Number(o?.final_total ?? o?.totalAmount ?? o?.total_amount ?? 0)
        const commissionCandidate = Number(o?.commission ?? o?.commission_amount ?? 0)
        const fallbackNet = Math.max(
          0,
          (Number.isFinite(grossCandidate) ? grossCandidate : 0) -
            (Number.isFinite(commissionCandidate) ? commissionCandidate : 0)
        )
        const resolved = Number.isFinite(netCandidate) && netCandidate > 0 ? netCandidate : fallbackNet
        return Number.isFinite(resolved) ? resolved : 0
      }

      const rows = (ordersState ?? []).map((order: any) => {
        const statusRaw = String(order?.status ?? '').trim().toLowerCase()
        const paymentRaw = String(order?.payment_status ?? order?.paymentStatus ?? '').trim().toLowerCase()

        const deliveredLike = isDeliveredLikeStatus(order?.status)
        const paidLike = isPaidLikeStatus(order?.payment_status ?? order?.paymentStatus)

        const items = Array.isArray(order?.products) ? order.products : []
        const hasItems = items.length > 0
        const allItemsDigital = hasItems && items.every((it: any) => Boolean(it?.isDigital))

        const deliveryOptionRaw = String(order?.deliveryOption ?? order?.delivery_option ?? '').trim().toLowerCase()
        const shippingMethodId = order?.shippingMethodId ?? order?.shipping_method_id
        const deliveryId = order?.deliveryId ?? order?.delivery_id
        const shippingLat = order?.shippingLat ?? order?.shipping_lat
        const shippingLng = order?.shippingLng ?? order?.shipping_lng
        const shippingMethod = order?.shippingMethod ?? order?.shipping_method

        const requiresDelivery = isDeliveryRequiredFromOrder(order)
        const eligible = statusRaw !== 'cancelled' && statusRaw !== 'canceled' && (requiresDelivery ? deliveredLike : paidLike)

        const isCancelled = statusRaw === 'cancelled' || statusRaw === 'canceled'
        const isPaymentRequested = Boolean(order?.isPaymentRequested ?? order?.is_payment_requested ?? order?.paymentRequested)
        const resolvedNet = resolveNetAmount(order)
        const countsInNetRevenue = paidLike && !isCancelled
        const countsInWithdrawable = eligible

        const reason = (() => {
          if (statusRaw === 'cancelled' || statusRaw === 'canceled') return 'cancelled'
          if (requiresDelivery && !deliveredLike) return 'delivery_required_not_delivered'
          if (!requiresDelivery && !paidLike) return 'paid_required_not_paid'
          return 'eligible'
        })()

        return {
          id: String(order?.id ?? ''),
          status: statusRaw,
          payment: paymentRaw,
          deliveryOption: deliveryOptionRaw,
          shippingMethodId: shippingMethodId ?? null,
          deliveryId: deliveryId ?? null,
          hasCoords: Boolean(shippingLat != null || shippingLng != null),
          shippingMethod: typeof shippingMethod === 'string' ? shippingMethod : (shippingMethod as any)?.name ?? null,
          itemsCount: items.length,
          allItemsDigital,
          requiresDelivery,
          deliveredLike,
          paidLike,
          eligible,
          reason,
          isPaymentRequested,
          resolvedNet,
          countsInNetRevenue,
          countsInWithdrawable
        }
      })

      console.group('debugPayout=1')
      console.table(rows)

      const sumNetFromPaidOrders = rows
        .filter((r: any) => Boolean(r?.countsInNetRevenue))
        .reduce((acc: number, r: any) => acc + Number(r?.resolvedNet ?? 0), 0)

      const sumWithdrawableNet = rows
        .filter((r: any) => Boolean(r?.countsInWithdrawable))
        .reduce((acc: number, r: any) => acc + Number(r?.resolvedNet ?? 0), 0)

      const sumRemainingNet = Math.max(0, sumNetFromPaidOrders - sumWithdrawableNet)

      console.log('net vs withdrawable (from ordersState)', {
        sumNetFromPaidOrders,
        sumWithdrawableNet,
        sumRemainingNet
      })

      console.log('api revenue snapshot', {
        revenueTotal: revenue?.totalRevenue,
        revenueCommissions: revenue?.totalCommissions,
        revenueNet: revenue?.netRevenue,
        pendingPayments: revenue?.pendingPayments
      })

      const withdrawableAmount = payoutWithdrawableOrders.reduce((sum: number, o: any) => {
        return sum + resolveNetAmount(o)
      }, 0)

      console.log('summary', {
        totalOrders: (ordersState ?? []).length,
        candidates: payoutCandidateOrders.length,
        withdrawable: payoutWithdrawableOrders.length,
        withdrawableAmount
      })
      console.groupEnd()
    } catch (e) {
      console.warn('debugPayout failed', e)
    }
  }, [ordersState, payoutCandidateOrders.length, payoutWithdrawableOrders, revenue?.netRevenue, revenue?.pendingPayments, revenue?.totalRevenue, revenue?.totalCommissions, searchParams])

  const withdrawableSummary = useMemo(() => {
    const pendingPayments = Number(revenue?.pendingPayments ?? 0)
    const hasPendingRequest = Number.isFinite(pendingPayments) && pendingPayments > 0

    const resolveNetAmount = (o: any): number => {
      const netCandidate = Number(
        o?.netRevenue ??
          o?.net_revenue ??
          o?.net_revenue_amount ??
          o?.net_amount ??
          o?.final_total ??
          o?.totalAmount ??
          o?.total_amount ??
          0
      )
      const grossCandidate = Number(o?.final_total ?? o?.totalAmount ?? o?.total_amount ?? 0)
      const commissionCandidate = Number(o?.commission ?? o?.commission_amount ?? 0)
      const fallbackNet = Math.max(
        0,
        (Number.isFinite(grossCandidate) ? grossCandidate : 0) -
          (Number.isFinite(commissionCandidate) ? commissionCandidate : 0)
      )
      const resolved = Number.isFinite(netCandidate) && netCandidate > 0 ? netCandidate : fallbackNet
      return Number.isFinite(resolved) ? resolved : 0
    }

    const orders = Array.isArray(payoutWithdrawableOrders) ? payoutWithdrawableOrders : []

    if (hasPendingRequest) {
      const requestedOrders = (Array.isArray(payoutCandidateOrders) ? payoutCandidateOrders : []).filter((o: any) => {
        const flag = o?.isPaymentRequested ?? o?.is_payment_requested ?? o?.paymentRequested
        return Boolean(flag)
      })

      const requestedCount = requestedOrders.length
      const requestedAmount = requestedOrders.reduce((sum: number, o: any) => sum + resolveNetAmount(o), 0)
      const displayedAmount = pendingPayments
      const remainingAmount = Math.max(0, pendingPayments - displayedAmount)

      return {
        availableOrdersCount: payoutCandidateOrders.length,
        ordersCount: requestedCount > 0 ? requestedCount : orders.length,
        amount: displayedAmount,
        remainingAmount
      }
    }

    const amount = orders.reduce((sum: number, o: any) => {
      return sum + resolveNetAmount(o)
    }, 0)

    const netLimit = Number(revenue?.netRevenue ?? NaN)
    const cappedAmount = Number.isFinite(netLimit) && netLimit >= 0 ? Math.min(amount, netLimit) : amount
    const remainingAmount = Number.isFinite(netLimit) ? Math.max(0, netLimit - cappedAmount) : 0
    return {
      availableOrdersCount: payoutCandidateOrders.length,
      ordersCount: orders.length,
      amount: cappedAmount,
      remainingAmount
    }
  }, [payoutCandidateOrders, payoutWithdrawableOrders, revenue?.netRevenue, revenue?.pendingPayments])

  const formatCurrency = (amount: number) => {
    return formatMoney(amount)
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

  // Handlers pour les sections
  const handleProductUpdate = (product: SellerProduct) => {
    console.log('Produit mis à jour:', product)
    // Ici on mettrait à jour la base de données
  }

  const handleProductDelete = (productId: number) => {
    console.log('Produit supprimé:', productId)
    // Ici on supprimerait de la base de données
  }

  const handleProductCreate = (product: Omit<SellerProduct, 'id'>) => {
    console.log('Nouveau produit:', product)
    // Ici on créerait dans la base de données
  }

  const handleOrderUpdate = (order: SellerOrder) => {
    console.log('Commande mise à jour:', order)
    setOrdersState((prev) => prev.map((o) => (String(o?.id) === String(order?.id) ? { ...o, ...order } : o)))
  }

  const handleOrderStatusChange = (orderId: string, status: SellerOrder['status']) => {
    console.log('Statut de commande changé:', orderId, status)
    setOrdersState((prev) => prev.map((o) => (String(o?.id) === String(orderId) ? { ...o, status } : o)))
  }

  const handlePaymentRequest = async (
    _amount: number,
    payment: {
      paymentMethod: 'mobile_money' | 'bank_transfer'
      mobileNumber?: string
      bankDetails?: { bankName?: string; accountNumber?: string; accountName?: string }
    }
  ) => {
    try {
      const orderIds = payoutWithdrawableOrders
        .filter((o: any) => {
          const flag = o?.isPaymentRequested ?? o?.is_payment_requested ?? o?.paymentRequested
          return !Boolean(flag)
        })
        .map((o: any) => String(o?.id ?? '').trim())
        .filter((id: string) => id.length > 0)

      if (orderIds.length === 0) {
        throw new Error('Aucune commande disponible pour une demande de paiement.')
      }

      const authHeaders = await ClientAuthService.buildAuthHeaders()
      const response = await fetch('/api/finance/payment-requests', {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderIds,
          requestedAmount: payment?.requestedAmount ?? null,
          paymentMethod: payment?.paymentMethod ?? 'mobile_money',
          bankDetails: payment?.paymentMethod === 'bank_transfer' ? payment?.bankDetails ?? null : null,
          mobileNumber: payment?.paymentMethod === 'mobile_money' ? payment?.mobileNumber ?? null : null,
          notes: payment?.notes ?? ''
        })
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.error || "Impossible d'envoyer la demande de paiement.")
      }

      toast({
        title: 'Demande envoyée',
        description: 'Votre demande de paiement a été enregistrée et transmise pour validation.'
      })
      await refreshData()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue.'
      toast({ title: 'Erreur', description: message, variant: 'destructive' as any })

      throw err
    }
  }

  const clearSellerDashboardCache = () => {
    if (typeof window === 'undefined' || !vendorId) return
    try {
      sessionStorage.removeItem(`sellerDashboardData:${vendorId}`)
    } catch {
      // ignore quota / private mode
    }
  }

  // Handlers pour les points
  const handleTransferPoints = async (recipientId: string, amount: number, message?: string) => {
    try {
      await SellerDashboardService.transferPoints(vendorId, recipientId, amount, message)
      clearSellerDashboardCache()
      await refreshData()
    } catch (err) {
      console.error('Erreur transfert points', err)
      throw err
    }
  }

  const handleExchangePoints = async (fromCurrency: string, toCurrency: string, amount: number) => {
    try {
      await SellerDashboardService.exchangePoints(vendorId, fromCurrency, toCurrency, amount)
      clearSellerDashboardCache()
      await refreshData()
    } catch (err) {
      console.error('Erreur échange points', err)
      throw err
    }
  }

  const handleRedeemReward = async (rewardId: string, amount: number) => {
    try {
      await ClientPointsService.redeemRewardWithPoints(vendorId, rewardId, amount)
      clearSellerDashboardCache()
      await refreshData()
    } catch (err) {
      console.error('Erreur échange récompense', err)
      throw err
    }
  }

  const handleRequestWithdrawal = async (amount: number, method: string, phoneNumber?: string) => {
    try {
      await SellerDashboardService.requestPointsWithdrawal(vendorId, amount, method, phoneNumber)
      clearSellerDashboardCache()
      await refreshData()
    } catch (err) {
      console.error('Erreur demande retrait', err)
      throw err
    }
  }

  // Handlers pour les demandes de paiement des ventes
  const handleSalesPaymentRequest = async (orderId: string, amount: number, paymentData: any) => {
    try {
      const orderIds = [String(orderId)]

      const requestedAmountCandidate = Number(amount ?? paymentData?.amount ?? NaN)
      const requestedAmount = Number.isFinite(requestedAmountCandidate) ? requestedAmountCandidate : null

      const authHeaders = await ClientAuthService.buildAuthHeaders()

      const response = await fetch('/api/finance/payment-requests', {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderIds,
          requestedAmount,
          paymentMethod: paymentData?.paymentMethod || 'mobile_money',
          bankDetails: paymentData?.paymentMethod === 'bank_transfer'
            ? {
                bankName: paymentData?.bankName || '',
                accountNumber: paymentData?.accountNumber || '',
                accountName: paymentData?.accountName || ''
              }
            : null,
          mobileNumber: paymentData?.paymentMethod === 'mobile_money' ? (paymentData?.phoneNumber || '') : null,
          notes: paymentData?.notes || ''
        })
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.error || "Impossible d'envoyer la demande de paiement.")
      }

      toast({
        title: 'Demande envoyée',
        description: `Votre demande de paiement a été enregistrée et transmise pour validation.`
      })
      await refreshData()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue.'
      toast({ title: 'Erreur', description: message, variant: 'destructive' as any })

      throw err
    }
  }

  const handleBulkPaymentRequest = async (
    orders: any[],
    payment?: {
      paymentMethod: 'mobile_money' | 'bank_transfer' | 'bank_card'
      mobileNumber?: string
      bankDetails?: { bankName?: string; accountNumber?: string; accountName?: string }
      notes?: string
      requestedAmount?: number | null
    }
  ) => {
    try {
      const orderIds = (Array.isArray(orders) ? orders : [])
        .map((o) => String(o?.id ?? '').trim())
        .filter((id) => id.length > 0)

      if (orderIds.length === 0) {
        throw new Error('Aucune commande sélectionnée.')
      }

      const authHeaders = await ClientAuthService.buildAuthHeaders()
      const response = await fetch('/api/finance/payment-requests', {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderIds,
          requestedAmount: payment?.requestedAmount ?? null,
          paymentMethod: payment?.paymentMethod ?? 'mobile_money',
          bankDetails: payment?.paymentMethod === 'bank_transfer' ? payment?.bankDetails ?? null : null,
          mobileNumber: payment?.paymentMethod === 'mobile_money' ? payment?.mobileNumber ?? null : null,
          notes: payment?.notes ?? ''
        })
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.error || "Impossible d'envoyer la demande groupée.")
      }

      toast({
        title: 'Demande groupée envoyée',
        description: `${orderIds.length} commande(s) ont été incluses dans la demande de paiement.`
      })
      await refreshData()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue.'
      toast({ title: 'Erreur', description: message, variant: 'destructive' as any })

      throw err
    }
  }

  const postReviewModeration = async (reviewId: string, action: 'approve' | 'reject', reason?: string) => {
    const authHeaders = await ClientAuthService.buildAuthHeaders()
    const resp = await fetch(`/api/vendor/reviews/product/${encodeURIComponent(reviewId)}/moderate`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, reason: reason ?? '' })
    })

    if (!resp.ok) {
      const payload = await resp.json().catch(() => ({}))
      throw new Error(payload?.error || `Impossible de ${action === 'approve' ? 'approuver' : 'rejeter'} cet avis.`)
    }
  }

  const handleReviewApprove = async (reviewId: string) => {
    try {
      await postReviewModeration(reviewId, 'approve')
      clearSellerDashboardCache()
      toast({
        title: 'Avis approuvé',
        description: 'L’avis est visible sur votre boutique et les fiches produit.'
      })
      await refreshData()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue.'
      toast({ title: 'Erreur', description: message, variant: 'destructive' as any })
    }
  }

  const handleReviewReject = async (reviewId: string, reason?: string) => {
    try {
      await postReviewModeration(reviewId, 'reject', reason)
      clearSellerDashboardCache()
      toast({
        title: 'Avis rejeté',
        description: 'L’avis n’est plus affiché publiquement.'
      })
      await refreshData()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue.'
      toast({ title: 'Erreur', description: message, variant: 'destructive' as any })
    }
  }

  /**
   * Envoie une réponse vendeur sur un avis produit.
   * Côté backend: la réponse est enregistrée en status "pending" (validation Super Admin).
   */
  const handleReviewReply = async (reviewId: string, reply: string) => {
    try {
      const authHeaders = await ClientAuthService.buildAuthHeaders()
      const resp = await fetch(`/api/vendor/reviews/product/${encodeURIComponent(reviewId)}/reply`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: reply })
      })

      if (!resp.ok) {
        const payload = await resp.json().catch(() => ({}))
        throw new Error(payload?.error || 'Impossible d’envoyer la réponse.')
      }

      toast({
        title: 'Réponse envoyée',
        description: 'Votre réponse a été soumise et attend la validation du Super Admin.'
      })
      clearSellerDashboardCache()
      await refreshData()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue.'
      toast({ title: 'Erreur', description: message, variant: 'destructive' as any })
    }
  }

  /**
   * Signale un avis produit.
   */
  const handleReviewFlag = async (reviewId: string, reason: string) => {
    try {
      const authHeaders = await ClientAuthService.buildAuthHeaders()
      const resp = await fetch(`/api/vendor/reviews/product/${encodeURIComponent(reviewId)}/flag`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      })

      if (!resp.ok) {
        const payload = await resp.json().catch(() => ({}))
        throw new Error(payload?.error || 'Impossible de signaler cet avis.')
      }

      toast({
        title: 'Avis signalé',
        description: 'Merci. Le signalement a été transmis pour modération.'
      })
      clearSellerDashboardCache()
      await refreshData()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue.'
      toast({ title: 'Erreur', description: message, variant: 'destructive' as any })
    }
  }

  const handleReviewDelete = async (reviewId: string) => {
    const confirmed =
      typeof window !== 'undefined'
        ? window.confirm('Supprimer définitivement cet avis ? Cette action est irréversible.')
        : true

    if (!confirmed) return

    try {
      const authHeaders = await ClientAuthService.buildAuthHeaders()
      const resp = await fetch(`/api/vendor/reviews/product/${encodeURIComponent(reviewId)}`, {
        method: 'DELETE',
        headers: authHeaders
      })

      if (!resp.ok) {
        const payload = await resp.json().catch(() => ({}))
        throw new Error(payload?.error || 'Impossible de supprimer cet avis.')
      }

      clearSellerDashboardCache()
      toast({
        title: 'Avis supprimé',
        description: 'Les statistiques produit ont été recalculées.'
      })
      await refreshData()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue.'
      toast({ title: 'Erreur', description: message, variant: 'destructive' as any })
    }
  }

  const handleExportReviews = () => {
    toast({
      title: 'Export',
      description: 'Utilisez le bouton « Rapport Complet » pour exporter les avis filtrés.'
    })
  }

  const handleViewCustomerProfile = (customerId: string) => {
    navigateToTab('chat')
    toast({
      title: 'Client',
      description: `Ouvrez la conversation avec le client ${customerId.slice(0, 8)}… depuis le chat.`
    })
  }

  const handleViewProductDetails = async (productId: string) => {
    navigateToTab('products')
    setProductModalMode('edit')

    try {
      const shared = await SellerDashboardApi.getProductById(productId)
      setSelectedProduct(shared)
    } catch (error) {
      console.error('Erreur chargement produit (depuis avis)', error)
      setSelectedProduct({ id: productId })
    }

    setShowAdvancedProductModal(true)
  }

  const handleExportData = (type: string, format: string) => {
    toast({
      title: 'Export réussi',
      description: `Le rapport ${type} a été téléchargé (${format === 'json' ? 'JSON' : format}).`
    })
  }

  const handleViewDetailedReport = (metric: string) => {
    setActiveTab('analytics')
    toast({
      title: 'Rapport détaillé',
      description: `Section Analyses : ${metric}. Les données proviennent de votre base en temps réel.`
    })
  }

  // Charger les sessions actives au chargement ou au changement d'onglet vers settings
  useEffect(() => {
    if (vendorId && (activeTab === 'settings' || activeTab === 'profile')) {
      SellerDashboardService.getActiveSessions(vendorId)
        .then(setActiveSessions)
        .catch(console.error)
    }
  }, [vendorId, activeTab])

  // Fonctions de gestion du profil
  const handleProfileUpdate = async (profileData: any) => {
    if (!vendorId) return
    try {
      await SellerDashboardService.updateSellerProfile(vendorId, profileData)
      toast({
        title: 'Profil mis à jour',
        description: 'Vos modifications ont été enregistrées avec succès.'
      })
      await refreshData()
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Impossible de mettre à jour le profil.',
        variant: 'destructive'
      })
    }
  }

  const handlePasswordChange = async (oldPassword: string, newPassword: string) => {
    try {
      // Note: Supabase Auth.updateUser ne requiert pas l'ancien mot de passe 
      // si l'utilisateur est déjà connecté.
      await SellerDashboardService.changePassword(newPassword)
      toast({
        title: 'Mot de passe modifié',
        description: 'Votre mot de passe a été mis à jour avec succès.'
      })
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Impossible de modifier le mot de passe.',
        variant: 'destructive'
      })
    }
  }

  const handleTwoFactorToggle = async (enabled: boolean) => {
    if (!vendorId) return
    try {
      await SellerDashboardService.toggleTwoFactor(vendorId, enabled)
      toast({
        title: enabled ? '2FA Activé' : '2FA Désactivé',
        description: `La double authentification a été ${enabled ? 'activée' : 'désactivée'}.`
      })
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Impossible de modifier le 2FA.',
        variant: 'destructive'
      })
    }
  }

  const handleSessionTerminate = async (sessionId: string) => {
    try {
      await SellerDashboardService.terminateSession(sessionId)
      setActiveSessions(prev => prev.filter(s => s.id !== sessionId))
      toast({
        title: 'Session terminée',
        description: 'La session a été fermée avec succès.'
      })
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Impossible de fermer la session.',
        variant: 'destructive'
      })
    }
  }

  const handleDocumentUpload = async (file: File, type: string) => {
    if (!vendorId) return
    try {
      await SellerDashboardService.uploadDocument(vendorId, file, type)
      toast({
        title: 'Document envoyé',
        description: 'Votre document a été téléchargé et est en attente de vérification.'
      })
      await refreshData()
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Impossible d\'envoyer le document.',
        variant: 'destructive'
      })
    }
  }

  const handleAccountDelete = async () => {
    if (!vendorId) return
    const reason = prompt('Veuillez indiquer la raison de la suppression de votre compte :')
    if (reason === null) return // Annulé

    try {
      await SellerDashboardService.deleteAccountRequest(vendorId, reason)
      toast({
        title: 'Demande envoyée',
        description: 'Votre demande de suppression de compte a été transmise à l\'administration.'
      })
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Impossible d\'envoyer la demande.',
        variant: 'destructive'
      })
    }
  }

  const handleTerminateAllSessions = async () => {
    if (!vendorId) return
    try {
      const currentSessionId = activeSessions.find(s => s.isCurrent)?.id
      await SellerDashboardService.terminateAllOtherSessions(vendorId, currentSessionId)
      setActiveSessions(prev => prev.filter(s => s.isCurrent))
      toast({
        title: 'Sessions fermées',
        description: 'Toutes les autres sessions ont été déconnectées.'
      })
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Impossible de fermer les sessions.',
        variant: 'destructive'
      })
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/auth/login')
    } catch (err) {
      console.error('Erreur déconnexion:', err)
    }
  }

  // Fonctions de gestion de l'en-tête
  const handleNotificationsClick = () => {
    setShowNotificationsModal(true)
  }

  const handleHelpClick = () => {
    setShowHelpModal(true)
  }

  const handleLogoutClick = () => {
    setShowLogoutModal(true)
  }

  const handleConfirmLogout = async () => {
    setShowLogoutModal(false)
    try {
      await supabase.auth.signOut()
      router.push('/auth/login')
    } catch (err) {
      console.error('Erreur déconnexion:', err)
    }
  }

  // Fonctions de gestion du chat support
  const handleChatSupportClick = () => {
    setShowChatSupportModal(true)
    setShowHelpModal(false)
    setChatStatus('connecting')
    
    // Simuler la connexion
    setTimeout(() => {
      setChatStatus('connected')
      // Message de bienvenue automatique
      const welcomeMessage = {
        id: Date.now(),
        type: 'admin',
        message: 'Bonjour ! Je suis l\'équipe support de Probooster. Comment puis-je vous aider aujourd\'hui ?',
        timestamp: new Date().toISOString(),
        sender: 'Support Probooster'
      }
      setChatMessages([welcomeMessage])
    }, 1000)
  }

  const handleChatMessageSubmit = () => {
    if (!chatMessage.trim() || chatStatus !== 'connected') return
    
    // Ajouter le message de l'utilisateur
    const userMessage = {
      id: Date.now(),
      type: 'user',
      message: chatMessage,
      timestamp: new Date().toISOString(),
      sender: 'Vous'
    }
    
    setChatMessages(prev => [...prev, userMessage])
    setChatMessage('')
    setIsTyping(true)
    
    // Simuler la réponse de l'administrateur
    setTimeout(() => {
      setIsTyping(false)
      const adminResponse = {
        id: Date.now() + 1,
        type: 'admin',
        message: `Merci pour votre message "${userMessage.message}". Un agent de notre équipe va vous répondre dans les plus brefs délais. En attendant, pouvez-vous me donner plus de détails sur votre problème ?`,
        timestamp: new Date().toISOString(),
        sender: 'Support Probooster'
      }
      setChatMessages(prev => [...prev, adminResponse])
    }, 2000)
  }

  // Fonctions de gestion de l'email support
  const handleEmailSupportClick = () => {
    setShowEmailSupportModal(true)
    setShowHelpModal(false)
    // Pré-remplir avec les informations du vendeur
    setEmailSubject('Demande de support - Vendeur')
            setEmailMessage(`Bonjour,\n\nJe suis vendeur sur Probooster et j'ai besoin d'assistance.\n\nProblème : \n\nMerci de votre aide.\n\nCordialement,\n${sellerProfile?.name || 'Vendeur'}`)
  }

  const handleEmailSubmit = async () => {
    if (!emailSubject.trim() || !emailMessage.trim()) {
      alert('Veuillez remplir tous les champs')
      return
    }
    
    setIsSendingEmail(true)
    
    try {
      // Simuler l'envoi d'email
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Succès
      alert('✅ Email envoyé avec succès ! L\'administrateur vous répondra dans les plus brefs délais.')
      setShowEmailSupportModal(false)
      setEmailSubject('')
      setEmailMessage('')
      setEmailCategory('general')
    } catch (error) {
      alert('❌ Erreur lors de l\'envoi de l\'email. Veuillez réessayer.')
    } finally {
      setIsSendingEmail(false)
    }
  }

  const handleCreateProduct = () => {
    setProductModalMode('create')
    setSelectedProduct(null)
    setShowAdvancedProductModal(true)
  }

  const handleEditProduct = async (product: any) => {
    setProductModalMode('edit')

    const productId = (product as any)?.id ? String((product as any).id) : ''
    if (!productId) {
      setSelectedProduct(product)
      setShowAdvancedProductModal(true)
      return
    }

    try {
      const shared = await SellerDashboardApi.getProductById(productId)
      setSelectedProduct(shared)
    } catch (error) {
      console.error('Erreur chargement produit complet (édition vendeur)', error)
      setSelectedProduct(product)
    } finally {
      setShowAdvancedProductModal(true)
    }
  }

  /**
   * Soumet la création/édition produit depuis la modale avancée (API vendeur) et synchronise l’UI.
   */
  const handleAdvancedProductSubmit = async (payload: SharedProductInput & { id?: string }) => {
    if (!vendorId) {
      throw new Error('Identifiant vendeur manquant.')
    }

    if (productModalMode === 'create') {
      await SellerDashboardApi.createProduct({
        ...payload,
        vendorId,
        source: 'vendor'
      })
      return
    }

    const id = payload.id ?? (selectedProduct as any)?.id
    if (!id) {
      throw new Error('Identifiant produit manquant pour la mise à jour.')
    }

    await SellerDashboardApi.updateProduct({
      ...payload,
      id,
      vendorId,
      source: 'vendor'
    })
  }

  const handleReviewAction = (reviewId: string, reason?: string) => {
    // Logique pour gérer les actions sur les avis
    console.log('Action sur avis:', reviewId, reason)
  }

  const handleNotificationAction = (type?: string) => {
    // Logique pour gérer les actions sur les notifications
    console.log('Action sur notification:', type)
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">Tableau de Bord Vendeur</h1>
            <Badge className="bg-orange-100 text-orange-800 border-orange-200">
              Vendeur Pro
            </Badge>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm" 
              className="hover:bg-orange-50 hover:border-orange-200 relative"
              onClick={handleNotificationsClick}
            >
              <Bell className="w-4 h-4 mr-2" />
              Notifications
              {vendorUnreadNotifications > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 min-w-5 px-1 flex items-center justify-center font-medium">
                  {vendorUnreadNotifications > 9 ? '9+' : vendorUnreadNotifications}
                </span>
              )}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="hover:bg-orange-50 hover:border-orange-200"
              onClick={handleHelpClick}
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              Aide
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="hover:bg-orange-50 hover:border-orange-200"
              onClick={handleLogoutClick}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen p-4 shadow-sm">
          <div className="space-y-4">
            {/* Profil vendeur */}
            <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
              <div className="flex items-center space-x-3">
                <Avatar className="w-12 h-12 border-2 border-orange-200">
                  <AvatarImage src="/placeholder-user.jpg" />
                  <AvatarFallback className="bg-orange-100 text-orange-800">VD</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-gray-900">Vendeur Pro</h3>
                  <p className="text-sm text-gray-600">Niveau 3 • Vérifié</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-orange-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Classement</span>
                  <span className="font-semibold text-orange-600">#{sellerStats.ranking}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Note moyenne</span>
                  <span className="font-semibold text-yellow-600">{sellerStats.averageRating}★</span>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="space-y-2">
              {sellerDashboardSections.map((section) => {
                const IconComponent = section.icon
                return (
                  <button
                    key={section.id}
                    onClick={() => navigateToTab(section.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === section.id
                        ? 'bg-orange-50 text-orange-700 border border-orange-200 shadow-sm'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-orange-600'
                    }`}
                  >
                    <IconComponent className="w-5 h-5" />
                    <div className="flex-1">
                      <div className="font-medium flex items-center justify-between gap-2">
                        <span>{section.label}</span>
                        {section.id === 'notifications' && vendorUnreadNotifications > 0 && (
                          <span className="bg-red-500 text-white text-xs rounded-full h-5 min-w-5 px-1 flex items-center justify-center font-medium">
                            {vendorUnreadNotifications > 9 ? '9+' : vendorUnreadNotifications}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">{section.description}</div>
                    </div>
                  </button>
                )
              })}
            </nav>

            

          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6">
          <div className="mb-4">
            <EditableMessagesBanner location="dashboard_vendeur" />
          </div>
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Statistiques principales */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-orange-700">Chiffre d'Affaires</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-orange-900">{formatCurrency(sellerStats.totalRevenue)}</div>
                      <TrendingUp className="w-8 h-8 text-orange-600" />
                    </div>
                    <p className="text-xs text-orange-600 mt-2">Total cumulé des commandes éligibles</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-green-700">Commandes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-green-900">{sellerStats.totalOrders}</div>
                      <ShoppingCart className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="text-xs text-green-600 mt-2">Commandes enregistrées</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-purple-700">Produits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-purple-900">{sellerStats.totalProducts}</div>
                      <Package className="w-8 h-8 text-purple-600" />
                    </div>
                    <p className="text-xs text-purple-600 mt-2">Actifs</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-blue-700">Classement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-blue-900">#{sellerStats.ranking}</div>
                      <Trophy className="w-8 h-8 text-blue-600" />
                    </div>
                    <p className="text-xs text-blue-600 mt-2">Sur {sellerStats.totalVendors} vendeurs</p>
                  </CardContent>
                </Card>
              </div>

              {/* Graphiques et analyses */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle>Évolution des Ventes</CardTitle>
                    <CardDescription>Performance des 30 derniers jours</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 bg-gray-50 rounded-lg p-4 overflow-auto">
                      {salesEvolution.length === 0 ? (
                        <div className="h-full flex items-center justify-center">
                          <div className="text-center">
                            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-500">Aucune donnée sur la période</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {salesEvolution.map((row: any) => (
                            <div key={String(row?.date)} className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">{String(row?.date ?? '')}</span>
                              <div className="flex items-center space-x-4">
                                <span className="text-gray-700">{Number(row?.ordersCount ?? 0)} cmd</span>
                                <span className="font-medium text-gray-900">{formatCurrency(Number(row?.revenue ?? 0))}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle>Produits les Plus Vendus</CardTitle>
                    <CardDescription>Top 5 des produits</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {topProducts.slice(0, 5).map((product: any) => (
                        <div key={String(product.id)} className="flex items-center space-x-4">
                          <img src={String(product.image ?? '')} alt={String(product.name ?? '')} className="w-12 h-12 rounded-lg object-cover" />
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{String(product.name ?? '')}</h4>
                            <p className="text-xs text-gray-500">{Number(product.sales ?? 0)} ventes</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-sm">{formatCurrency(Number(product.revenue ?? 0))}</p>
                            <p className="text-xs text-gray-500">{Number(product.shares ?? 0)} partages</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>



              {/* Commandes récentes */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Commandes Récentes</CardTitle>
                  <CardDescription>Dernières commandes reçues</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h4 className="font-medium">{order.customerName}</h4>
                            <p className="text-sm text-gray-500">{(order as any).displayId || order.id} • {formatDate(order.orderDate)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(order.totalAmount)}</p>
                          <Badge className={`mt-1 ${getStatusColor(order.status)}`}>
                            {order.status === 'pending' ? 'En attente' :
                             order.status === 'confirmed' ? 'Confirmée' :
                             order.status === 'shipped' ? 'Expédiée' :
                             order.status === 'delivered' ? 'Livrée' :
                             order.status === 'cancelled' ? 'Annulée' : 'Retournée'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Bell className="w-5 h-5 text-[#ff6600]" />
                      Notifications
                    </span>
                    {vendorUnreadNotifications > 0 && (
                      <Badge className="bg-red-100 text-red-800 border-red-200">
                        {vendorUnreadNotifications} non lue(s)
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>Recevez les notifications in-app envoyées par l'administration.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-3 pb-3">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div className="w-full md:w-64">
                        <Select value={vendorNotificationCategory} onValueChange={setVendorNotificationCategory}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Toutes les catégories" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Toutes les catégories</SelectItem>
                            {vendorNotificationCategories.map((category) => (
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
                          onClick={handleVendorMarkAllNotificationsRead}
                          disabled={vendorUnreadNotifications === 0}
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Tout marquer comme lu
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleVendorDeleteReadNotifications}
                          disabled={vendorNotifications.every((n) => !(n?.is_read ?? n?.isRead ?? false))}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Supprimer lus
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {filteredVendorNotifications.length === 0 ? (
                      <div className="text-sm text-gray-500">Aucune notification pour le moment.</div>
                    ) : (
                      filteredVendorNotifications.map((notification: any) => {
                        const id = String(notification?.id ?? '')
                        if (!id) return null
                        const isRead = Boolean(notification?.is_read ?? notification?.isRead ?? false)
                        const title = String(notification?.title ?? 'Notification')
                        const message = String(notification?.message ?? '')
                        const createdAt = String(notification?.created_at ?? new Date().toISOString())
                        const actionUrl = notification?.action_url ?? notification?.actionUrl ?? null

                        return (
                          <div
                            key={id}
                            className={`flex items-start space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 ${
                              !isRead ? 'bg-orange-50/50 border-orange-200' : ''
                            }`}
                          >
                            <div className={`w-2 h-2 rounded-full mt-2 ${mapVendorNotificationColor(notification)}`}></div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
                                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{message}</p>
                                  <p className="text-[11px] text-gray-400 mt-1">{formatDate(createdAt)}</p>
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
                                    onClick={() => handleVendorMarkNotificationRead(id)}
                                    disabled={isRead}
                                  >
                                    <Check className="w-4 h-4 mr-2" />
                                    Lire
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 hover:bg-red-50 hover:border-red-200"
                                    onClick={() => handleVendorDeleteNotification(id)}
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

          {/* Section Gestion des Produits */}
          {activeTab === 'products' && (
            <ProductManagement
              vendorId={user?.id || ''}
              products={products}
              onCreateProduct={handleCreateProduct}
              onEditProduct={handleEditProduct}
            />
          )}

          {/* Section Test des Devises */}
          {activeTab === 'currency-test' && (
            <div className="space-y-6">
              <Card className="border-[#ff6600]/20">
                <CardHeader className="bg-gradient-to-r from-[#ff6600]/5 to-transparent">
                  <CardTitle className="text-[#ff6600] flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Simulateur de Devises & Points
                  </CardTitle>
                  <CardDescription>
                    Configurez un prix de test pour vérifier la conversion en points et les paiements différés.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="test-price">Prix de test ({currencyCode})</Label>
                      <Input
                        id="test-price"
                        type="number"
                        value={testBasePrice}
                        onChange={(e) => setTestBasePrice(Number(e.target.value))}
                        className="border-[#ff6600]/30 focus:border-[#ff6600]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="interest-rate">Taux d'intérêt mensuel (%)</Label>
                      <Input
                        id="interest-rate"
                        type="number"
                        value={deferredInterestRate}
                        onChange={(e) => setDeferredInterestRate(Number(e.target.value))}
                        className="border-[#ff6600]/30 focus:border-[#ff6600]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="text-sm font-medium text-blue-800">Prix Standard</div>
                      <div className="text-2xl font-bold text-blue-600">{formatCurrency(testBasePrice)}</div>
                      <div className="text-xs text-blue-500 mt-1">
                        {Math.round(testBasePrice / sellerConversionRateSafe).toLocaleString('fr-FR')} points Probooster
                      </div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100">
                      <div className="text-sm font-medium text-green-800">Prix Promo (-10%)</div>
                      <div className="text-2xl font-bold text-green-600">{formatCurrency(testBasePrice * 0.9)}</div>
                      <div className="text-xs text-green-500 mt-1">
                        {Math.round((testBasePrice * 0.9) / sellerConversionRateSafe).toLocaleString('fr-FR')} points Probooster
                      </div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-100">
                      <div className="text-sm font-medium text-purple-800">Frais de Livraison</div>
                      <div className="text-2xl font-bold text-purple-600">{formatCurrency(testBasePrice * 0.05)}</div>
                      <div className="text-xs text-purple-500 mt-1">
                        {Math.round((testBasePrice * 0.05) / sellerConversionRateSafe).toLocaleString('fr-FR')} points Probooster
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Settings className="h-4 w-4 text-gray-500" />
                      Configuration Actuelle
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="space-y-1">
                        <span className="text-gray-500">Devise active:</span>
                        <p className="font-semibold">{currencyCode}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-gray-500">Taux de points:</span>
                        <p className="font-semibold">1 {currencyCode} = {sellerPointsPerCurrencyLabel} pts</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-gray-500">Valeur d'un point:</span>
                        <p className="font-semibold">1 pt = {sellerCurrencyPerPointLabel} {currencyCode}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-gray-500">Format monétaire:</span>
                        <p className="font-semibold">{formatMoney(testBasePrice)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Test des Paiements Différés */}
              <Card className="border-[#535455]/20">
                <CardHeader className="bg-gradient-to-r from-[#535455]/5 to-transparent">
                  <CardTitle className="text-[#535455] flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Simulation de Crédit / Paiements Différés
                  </CardTitle>
                  <CardDescription>
                    Calcul des mensualités avec un taux d'intérêt de {deferredInterestRate}% par mois.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-5 bg-gradient-to-br from-orange-50 to-white rounded-xl border border-orange-100 shadow-sm">
                        <h4 className="font-bold text-orange-800 mb-4 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Option : Intérêts Simples
                        </h4>
                        <div className="space-y-3">
                          {[1, 3, 6, 12].map((months) => {
                            const totalInterest = (testBasePrice * (deferredInterestRate / 100)) * months
                            const totalAmount = testBasePrice + totalInterest
                            const monthlyPayment = totalAmount / months
                            return (
                              <div key={months} className="flex justify-between items-center py-2 border-b border-orange-50 last:border-0">
                                <span className="text-gray-600 font-medium">{months} mois :</span>
                                <div className="text-right">
                                  <p className="font-bold text-orange-600">{formatMoney(totalAmount)}</p>
                                  <p className="text-[10px] text-gray-400">soit {formatMoney(monthlyPayment)}/mois</p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                      
                      <div className="p-5 bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-100 shadow-sm">
                        <h4 className="font-bold text-blue-800 mb-4 flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          Option : Frais Fixes Journaliers
                        </h4>
                        <div className="space-y-3">
                          {[1, 7, 30, 90].map((days) => {
                            const dailyFee = 100 // Frais fixe de 100 par jour (exemple)
                            const totalAmount = testBasePrice + (dailyFee * days)
                            return (
                              <div key={days} className="flex justify-between items-center py-2 border-b border-blue-50 last:border-0">
                                <span className="text-gray-600 font-medium">{days} jour(s) :</span>
                                <div className="text-right">
                                  <p className="font-bold text-blue-600">{formatMoney(totalAmount)}</p>
                                  <p className="text-[10px] text-gray-400">dont {formatMoney(dailyFee * days)} de frais</p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                      <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div className="text-xs text-blue-700 leading-relaxed">
                          <p className="font-bold mb-1">Note sur les calculs :</p>
                          Ces simulations sont données à titre indicatif pour tester la réactivité de l'interface aux changements de devise et de taux. 
                          Les frais réels appliqués lors d'un achat dépendent de la méthode de paiement choisie par le client et de la configuration du Super Admin.
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Section Commandes & Ventes */}
          {activeTab === 'orders' && (
            <OrderManagement
              vendorId={user?.id || ''}
              orders={orders}
              onOrderUpdate={handleOrderUpdate}
              onOrderStatusChange={handleOrderStatusChange}
            />
          )}

          {/* Section Suivi des livraisons */}
          {activeTab === 'deliveries' && (
            <VendorDeliveryManagement />
          )}

          {/* Section Chiffre d'Affaires */}
          {activeTab === 'revenue' && (
            <RevenueManagement
                              revenue={revenue}
              onPaymentRequest={handlePaymentRequest}
              withdrawableSummary={withdrawableSummary}
            />
          )}

          {/* Section Point */}
          {activeTab === 'points' && (
            <div className="space-y-4">
              {loading && (
                <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600">
                  Chargement des informations de points...
                </div>
              )}

              {!loading && error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-6">
                  <div className="text-sm font-semibold text-red-700">Impossible de charger la section Points</div>
                  <div className="mt-1 text-sm text-red-700">{error}</div>
                  <Button
                    className="mt-4"
                    variant="outline"
                    size="sm"
                    onClick={() => refreshData()}
                  >
                    Réessayer
                  </Button>
                </div>
              )}

              {!loading && !error && (
                <PointSection
                  vendorId={vendorId}
                  pointData={(pointsData ?? buildFallbackPointsData()) as any}
                  onTransferPoints={handleTransferPoints}
                  onExchangePoints={handleExchangePoints}
                  onRedeemReward={handleRedeemReward}
                  onRequestWithdrawal={handleRequestWithdrawal}
                  onSearchRecipients={(query) => SellerDashboardService.searchUsers(query)}
                />
              )}
            </div>
          )}

          {/* Section Demandes de Paiement */}
          {activeTab === 'payment-requests' && (
            <PaymentRequestsSection
                              deliveredOrders={payoutWithdrawableOrders}
              sellerProfile={sellerProfile}
              onPaymentRequest={handleSalesPaymentRequest}
              onBulkPaymentRequest={handleBulkPaymentRequest}
            />
          )}

          {/* Section Classements */}
          {activeTab === 'rankings' && (
            <RankingSection />
          )}

          {/* Section Chat */}
          {activeTab === 'chat' && (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden min-h-0">
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-orange-100">
                <h2 className="text-lg font-semibold text-gray-900">Chat avec vos clients</h2>
                <p className="text-sm text-gray-600">Gérez toutes vos conversations clientes depuis un seul endroit</p>
              </div>
              <div className="h-[70vh] min-h-0 overflow-hidden">
                <SellerChatInterfaceClientStyle />
              </div>
            </div>
          )}

          {/* Section Partages et Engagement */}
          {activeTab === 'shares' && (
            <SharesEngagementSectionSynced vendorId={user?.id || ''} />
          )}

          {/* Section Marketing et Promotions */}
          {activeTab === 'marketing' && (
            <MarketingPromotionsSection />
          )}

          {/* Section Avis et Réputation */}
          {activeTab === 'reviews' && (
            <ReviewsSection 
              reviews={reviewsData.reviews}
              reputationData={reviewsData.reputationData}
              onReviewApprove={(id) => void handleReviewApprove(id)}
              onReviewReject={(id, reason) => void handleReviewReject(id, reason)}
              onReviewReply={(id, reply) => void handleReviewReply(id, reply)}
              onReviewFlag={(id, reason) => void handleReviewFlag(id, reason)}
              onReviewDelete={(id) => void handleReviewDelete(id)}
              onExportReviews={handleExportReviews}
              onViewCustomerProfile={handleViewCustomerProfile}
              onViewProductDetails={handleViewProductDetails}
            />
          )}

          {/* Section Statistiques et Analyses */}
          {activeTab === 'analytics' && (
            <StatisticsAnalyticsSection
              vendorId={vendorId}
              dashboardRevenue={revenue}
              dashboardStats={sellerStats}
              orders={orders}
              reputation={{
                overallRating: reviewsData.reputationData.overallRating,
                totalReviews: reviewsData.reputationData.totalReviews
              }}
              products={products}
              onExportData={handleExportData}
              onViewProductDetails={handleViewProductDetails}
              onViewCustomerProfile={handleViewCustomerProfile}
              onViewDetailedReport={handleViewDetailedReport}
            />
          )}

          {/* Section Messagerie Interne */}
          {activeTab === 'messaging' && (
            <InternalMessagingSectionSynced />
          )}

          {/* Section Paramètres */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              {!sellerProfile && (loading || authLoading) ? (
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle>Paramètres</CardTitle>
                    <CardDescription>Chargement des préférences...</CardDescription>
                  </CardHeader>
                </Card>
              ) : !sellerProfile ? (
                <Card className="shadow-sm border-amber-200 bg-amber-50">
                  <CardHeader>
                    <CardTitle>Paramètres</CardTitle>
                    <CardDescription>
                      Impossible de charger votre profil. Vérifiez votre connexion puis réessayez.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" onClick={() => void refreshData()}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Réessayer
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Tabs value={settingsTab} onValueChange={(value) => setSettingsTab(value as any)} className="space-y-6">
                  <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                    <TabsTrigger value="preferences">Préférences</TabsTrigger>
                    <TabsTrigger value="security">Sécurité</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                    <TabsTrigger value="profile">Profil</TabsTrigger>
                  </TabsList>

                  <ProfileSection
                    profile={sellerProfile}
                    sessions={activeSessions}
                    onProfileUpdate={handleProfileUpdate}
                    onPasswordChange={handlePasswordChange}
                    onTwoFactorToggle={handleTwoFactorToggle}
                    onSessionTerminate={handleSessionTerminate}
                    onTerminateAllSessions={handleTerminateAllSessions}
                    onDocumentUpload={handleDocumentUpload}
                    onAccountDelete={handleAccountDelete}
                    onLogout={handleLogout}
                    initialTab={settingsTab}
                    hideNavigation
                  />
                </Tabs>
              )}
            </div>
          )}


        </main>
      </div>

      {/* Modal Chat Global */}
      <Dialog open={showChatModal} onOpenChange={setShowChatModal}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <MessageCircle className="w-5 h-5 text-orange-600" />
              <span>Chat Global - Toutes les Conversations</span>
            </DialogTitle>
            <DialogDescription>
              Gérez toutes vos conversations avec les clients depuis un seul endroit
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex h-[70vh] bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
            {/* Panneau gauche - Liste des conversations */}
            <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
              {/* Barre de recherche */}
              <div className="p-4 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher des conversations..."
                    className="pl-10 pr-4 py-2 bg-gray-50 border-gray-200 focus:bg-white focus:border-orange-300 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Liste des conversations */}
              <div className="flex-1 overflow-y-auto p-2">
                <div className="space-y-2">
                  {/* Conversation exemple */}
                  <div className="p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-orange-50 border border-gray-100 hover:border-orange-200">
                    <div className="flex items-start space-x-3">
                      <div className="relative">
                        <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                          <AvatarFallback className="bg-gradient-to-br from-orange-100 to-orange-200 text-orange-700 font-semibold">
                            C
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-gray-900 text-sm">Client Probooster</h4>
                          <span className="text-xs text-gray-500">2 min</span>
                        </div>
                        <p className="text-xs text-gray-600 truncate">Bonjour ! Je suis intéressé par votre produit...</p>
                      </div>
                    </div>
                  </div>

                  {/* Autres conversations */}
                  <div className="p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-orange-50 border border-gray-100 hover:border-orange-200">
                    <div className="flex items-start space-x-3">
                      <div className="relative">
                        <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                          <AvatarFallback className="bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 font-semibold">
                            M
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-gray-400 rounded-full border-2 border-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-gray-900 text-sm">Marie Dubois</h4>
                          <span className="text-xs text-gray-500">1h</span>
                        </div>
                        <p className="text-xs text-gray-600 truncate">Pouvez-vous me donner plus d'informations...</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Panneau droit - Zone de chat */}
            <div className="flex-1 bg-white flex flex-col">
              {/* En-tête de la conversation */}
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-orange-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                      <AvatarFallback className="bg-gradient-to-br from-orange-100 to-orange-200 text-orange-700 font-semibold">
                        C
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-gray-900">Client Probooster</h3>
                      <p className="text-xs text-gray-600">En ligne • Répond en 2-4h</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" className="text-gray-600 hover:text-orange-600">
                      <Phone className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-600 hover:text-orange-600">
                      <Mail className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Zone des messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Message du client */}
                <div className="flex justify-start">
                  <div className="max-w-xs lg:max-w-md">
                    <div className="bg-gray-100 rounded-lg p-3">
                      <p className="text-sm text-gray-900">Bonjour ! Je suis intéressé par votre produit "Laptop Gaming Ultra". Pouvez-vous me donner plus d'informations sur les spécifications techniques ?</p>
                      <span className="text-xs text-gray-500 mt-2 block">14:32</span>
                    </div>
                  </div>
                </div>

                {/* Message du vendeur */}
                <div className="flex justify-end">
                  <div className="max-w-xs lg:max-w-md">
                    <div className="bg-orange-500 text-white rounded-lg p-3">
                      <p className="text-sm">Bonjour ! Bien sûr, je serais ravi de vous aider. Le Laptop Gaming Ultra dispose d'un processeur Intel i7 de 12e génération, 16GB de RAM DDR4, et une carte graphique RTX 3060. Que souhaitez-vous savoir de plus ?</p>
                      <span className="text-xs text-orange-100 mt-2 block">14:35</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Zone de saisie */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Tapez votre message..."
                    className="flex-1"
                  />
                  <Button className="bg-orange-600 hover:bg-orange-700">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Nouveau Produit</DialogTitle>
            <DialogDescription>
              Accédez à la section "Gestion Produits" pour créer un nouveau produit
            </DialogDescription>
          </DialogHeader>
          <div className="p-8 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Utilisez la section dédiée pour une meilleure expérience</p>
            <Button 
              className="mt-4 bg-orange-600 hover:bg-orange-700"
              onClick={() => {
                setShowProductModal(false)
                navigateToTab('products')
              }}
            >
              Aller à la section Produits
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showRevenueModal} onOpenChange={setShowRevenueModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Demande de Paiement</DialogTitle>
            <DialogDescription>
              Accédez à la section "Chiffre d'Affaires" pour gérer vos paiements
            </DialogDescription>
          </DialogHeader>
          <div className="p-8 text-center">
            <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Utilisez la section dédiée pour une meilleure expérience</p>
            <Button 
              className="mt-4 bg-orange-600 hover:bg-orange-700"
              onClick={() => {
                setShowRevenueModal(false)
                navigateToTab('revenue')
              }}
            >
              Aller à la section CA
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Notifications */}
      <Dialog open={showNotificationsModal} onOpenChange={setShowNotificationsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center text-[#ff6600]">
              <Bell className="w-5 h-5 mr-2" />
              Notifications
            </DialogTitle>
            <DialogDescription>
              Gérez vos notifications et alertes
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Notifications récentes */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Notifications récentes</h4>

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div className="w-full md:w-64">
                  <Select value={vendorNotificationCategory} onValueChange={setVendorNotificationCategory}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Toutes les catégories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les catégories</SelectItem>
                      {vendorNotificationCategories.map((category) => (
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
                    onClick={handleVendorMarkAllNotificationsRead}
                    disabled={vendorUnreadNotifications === 0}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Tout marquer comme lu
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleVendorDeleteReadNotifications}
                    disabled={vendorNotifications.every((n) => !(n?.is_read ?? n?.isRead ?? false))}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer lus
                  </Button>
                </div>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {vendorNotifications.length > 0 && (
                  <>
                    {filteredVendorNotifications.map((notification: any) => {
                      const id = String(notification?.id ?? '')
                      if (!id) return null

                      const isRead = Boolean(notification?.is_read ?? notification?.isRead ?? false)
                      const title = String(notification?.title ?? 'Notification')
                      const message = String(notification?.message ?? '')
                      const createdAt = String(notification?.created_at ?? new Date().toISOString())
                      const actionUrl = notification?.action_url ?? notification?.actionUrl ?? null

                      return (
                        <div
                          key={id}
                          className={`flex items-start space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 ${
                            !isRead ? 'bg-orange-50/50 border-orange-200' : ''
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full mt-2 ${mapVendorNotificationColor(notification)}`}></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{message}</p>
                                <p className="text-[11px] text-gray-400 mt-1">{formatDate(createdAt)}</p>
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
                                  onClick={() => handleVendorMarkNotificationRead(id)}
                                  disabled={isRead}
                                >
                                  <Check className="w-4 h-4 mr-2" />
                                  Lire
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 hover:bg-red-50 hover:border-red-200"
                                  onClick={() => handleVendorDeleteNotification(id)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Supprimer
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </>
                )}

                {vendorNotifications.length === 0 && (
                <>
                  <div className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                    <div className="w-2 h-2 bg-[#ff6600] rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Nouvelle commande reçue</p>
                      <p className="text-xs text-gray-500">Commande #12345 - 2 minutes</p>
                    </div>
                    <Badge className="text-xs bg-orange-100 text-orange-800">Nouveau</Badge>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                    <div className="w-2 h-2 bg-[#3b82f6] rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Paiement validé</p>
                      <p className="text-xs text-gray-500">Paiement de 25 000 F CFA - 1 heure</p>
                    </div>
                    <Badge className="text-xs bg-blue-100 text-blue-800">Paiement</Badge>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                    <div className="w-2 h-2 bg-[#10b981] rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Avis client reçu</p>
                      <p className="text-xs text-gray-500">5 étoiles pour "Smartphone Premium" - 3 heures</p>
                    </div>
                    <Badge className="text-xs bg-green-100 text-green-800">Avis</Badge>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                    <div className="w-2 h-2 bg-[#8b5cf6] rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Promotion expirée</p>
                      <p className="text-xs text-gray-500">Code promo "ETE2024" - 1 jour</p>
                    </div>
                    <Badge className="text-xs bg-purple-100 text-purple-800">Promo</Badge>
                  </div>
                </>
                )}
              </div>
            </div>
            
            {/* Paramètres de notifications */}
            <div className="pt-4 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-3">Paramètres</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Notifications par email</p>
                    <p className="text-xs text-gray-500">Recevoir les notifications par email</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Notifications push</p>
                    <p className="text-xs text-gray-500">Recevoir les notifications push</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Notifications SMS</p>
                    <p className="text-xs text-gray-500">Recevoir les notifications par SMS</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <Button 
              onClick={() => setShowNotificationsModal(false)}
              className="bg-[#ff6600] hover:bg-[#ff6600]/90"
            >
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Aide */}
      <Dialog open={showHelpModal} onOpenChange={setShowHelpModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center text-[#3b82f6]">
              <HelpCircle className="w-5 h-5 mr-2" />
              Centre d'Aide
            </DialogTitle>
            <DialogDescription>
              Trouvez rapidement des réponses à vos questions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 overflow-y-auto max-h-[calc(90vh-120px)] pr-2">
            {/* Recherche */}
            <div className="relative">
              <Input 
                placeholder="Rechercher dans l'aide..."
                className="pl-10 border-[#3b82f6] focus:border-[#3b82f6] focus:ring-[#3b82f6] focus:ring-2"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#3b82f6]" />
            </div>
            
            {/* Catégories d'aide */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-gray-200 rounded-lg hover:border-[#ff6600] hover:bg-orange-50 transition-all duration-300 cursor-pointer group shadow-sm hover:shadow-md">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                    <Package className="w-6 h-6 text-[#ff6600]" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 group-hover:text-[#ff6600] transition-colors">Gestion des Produits</h4>
                    <p className="text-sm text-gray-500">Créer, modifier, supprimer des produits</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border border-gray-200 rounded-lg hover:border-[#3b82f6] hover:bg-blue-50 transition-all duration-300 cursor-pointer group shadow-sm hover:shadow-md">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <ShoppingCart className="w-6 h-6 text-[#3b82f6]" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 group-hover:text-[#3b82f6] transition-colors">Commandes & Ventes</h4>
                    <p className="text-sm text-gray-500">Gérer les commandes et suivre les ventes</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border border-gray-200 rounded-lg hover:border-[#8b5cf6] hover:bg-purple-50 transition-all duration-300 cursor-pointer group shadow-sm hover:shadow-md">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                    <TrendingUp className="w-6 h-6 text-[#8b5cf6]" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 group-hover:text-[#8b5cf6] transition-colors">Chiffre d'Affaires</h4>
                    <p className="text-sm text-gray-500">Suivre vos revenus et demander des paiements</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border border-gray-200 rounded-lg hover:border-[#10b981] hover:bg-green-50 transition-all duration-300 cursor-pointer group shadow-sm hover:shadow-md">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                    <Gift className="w-6 h-6 text-[#10b981]" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 group-hover:text-[#10b981] transition-colors">Points & Récompenses</h4>
                    <p className="text-sm text-gray-500">Gérer vos points et récompenses</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* FAQ rapide */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Questions fréquentes</h4>
              <div className="space-y-2">
                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer p-3 rounded-lg border border-gray-200 hover:border-[#ff6600] hover:bg-orange-50 transition-all duration-300">
                    <span className="font-medium text-gray-900 group-hover:text-[#ff6600]">Comment créer un nouveau produit ?</span>
                    <ChevronDown className="w-4 h-4 text-[#ff6600] group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="p-3 text-sm text-gray-600 bg-orange-50 rounded-b-lg border-l-4 border-l-[#ff6600]">
                    Allez dans la section "Gestion Produits" et cliquez sur "Nouveau Produit". Remplissez tous les champs requis et cliquez sur "Créer".
                  </div>
                </details>
                
                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer p-3 rounded-lg border border-gray-200 hover:border-[#3b82f6] hover:bg-blue-50 transition-all duration-300">
                    <span className="font-medium text-gray-900 group-hover:text-[#3b82f6]">Comment demander un paiement ?</span>
                    <ChevronDown className="w-4 h-4 text-[#3b82f6] group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="p-3 text-sm text-gray-600 bg-blue-50 rounded-b-lg border-l-4 border-l-[#3b82f6]">
                    Dans la section "Chiffre d'Affaires", sélectionnez les commandes livrées et cliquez sur "Demander Paiement".
                  </div>
                </details>
                
                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer p-3 rounded-lg border border-gray-200 hover:border-[#8b5cf6] hover:bg-purple-50 transition-all duration-300">
                    <span className="font-medium text-gray-900 group-hover:text-[#8b5cf6]">Comment améliorer mon classement ?</span>
                    <ChevronDown className="w-4 h-4 text-[#8b5cf6] group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="p-3 text-sm text-gray-600 bg-purple-50 rounded-b-lg border-l-4 border-l-[#8b5cf6]">
                    Vendez plus, recevez de bons avis, répondez rapidement aux clients et partagez vos produits.
                  </div>
                </details>
              </div>
            </div>
            
            {/* Contact support */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 hover:border-[#8b5cf6] transition-all duration-300">
              <h4 className="font-medium text-[#3b82f6] mb-2">Besoin d'aide supplémentaire ?</h4>
              <p className="text-sm text-blue-700 mb-3">
                Notre équipe support est disponible 24h/24 pour vous aider.
              </p>
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white shadow-md hover:shadow-lg transition-all duration-300"
                  onClick={handleChatSupportClick}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Chat Support
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="border-[#8b5cf6] text-[#8b5cf6] hover:bg-[#8b5cf6] hover:text-white transition-all duration-300"
                  onClick={handleEmailSupportClick}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email Support
                </Button>
              </div>
            </div>

            {/* Indicateur de scroll */}
            <div className="text-center py-2">
              <div className="inline-flex items-center space-x-2 text-xs text-gray-500">
                <div className="w-2 h-2 bg-[#ff6600] rounded-full animate-pulse"></div>
                <span className="text-[#3b82f6] font-medium">Utilisez la molette de votre souris pour naviguer</span>
                <div className="w-2 h-2 bg-[#8b5cf6] rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <Button 
              onClick={() => setShowHelpModal(false)}
              className="bg-[#3b82f6] hover:bg-[#3b82f6]/90"
            >
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Déconnexion */}
      <Dialog open={showLogoutModal} onOpenChange={setShowLogoutModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <LogOut className="w-5 h-5 mr-2" />
              Confirmer la déconnexion
            </DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir vous déconnecter ? Toutes vos sessions seront fermées.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div className="text-sm text-red-700">
                  <p className="font-medium">Attention :</p>
                  <ul className="mt-1 space-y-1">
                    <li>• Toutes vos sessions actives seront fermées</li>
                    <li>• Vous devrez vous reconnecter pour accéder au tableau de bord</li>
                    <li>• Les données non sauvegardées pourront être perdues</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setShowLogoutModal(false)}
                className="border-gray-300 hover:bg-gray-50"
              >
                Annuler
              </Button>
              <Button 
                onClick={handleConfirmLogout}
                className="bg-red-600 hover:bg-red-700"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Se déconnecter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Chat Support */}
      <Dialog open={showChatSupportModal} onOpenChange={setShowChatSupportModal}>
        <DialogContent className="max-w-4xl h-[80vh] p-0 overflow-hidden flex flex-col">
          <DialogHeader className="sr-only">
            <DialogTitle>Chat Support</DialogTitle>
            <DialogDescription>Chat en direct avec l'équipe support</DialogDescription>
          </DialogHeader>
          
          {/* Header du chat */}
          <div className="flex-shrink-0 p-6 border-b border-gray-200 bg-gradient-to-r from-[#ff6600] to-[#ff8533] text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <MessageCircle className="h-6 w-6" />
                <div>
                  <h2 className="text-xl font-bold">
                    Chat Support Probooster
                  </h2>
                  <p className="text-sm opacity-90">
                    {chatStatus === 'connecting' && 'Connexion en cours...'}
                    {chatStatus === 'connected' && 'Connecté - En ligne'}
                    {chatStatus === 'disconnected' && 'Déconnecté'}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowChatSupportModal(false)}
                className="text-white hover:text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          {/* Zone des messages */}
          <div className="flex-1 min-h-0 p-4 bg-gray-50 overflow-y-auto">
            {chatStatus === 'connecting' && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff6600] mx-auto mb-4"></div>
                  <p className="text-gray-600">Connexion au support en cours...</p>
                </div>
              </div>
            )}
            
            {chatStatus === 'connected' && (
              <div className="space-y-4">
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-[#ff6600] text-white'
                          : 'bg-white text-gray-900 border border-gray-200'
                      }`}
                    >
                      <p className="text-sm">{message.message}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white text-gray-900 border border-gray-200 px-4 py-2 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Zone de saisie */}
          {chatStatus === 'connected' && (
            <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-white">
              <div className="flex space-x-2">
                <Input
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Tapez votre message..."
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && handleChatMessageSubmit()}
                />
                <Button
                  onClick={handleChatMessageSubmit}
                  disabled={!chatMessage.trim()}
                  className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Email Support */}
      <Dialog open={showEmailSupportModal} onOpenChange={setShowEmailSupportModal}>
        <DialogContent className="max-w-2xl border-[#ff6600]">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center text-[#ff6600] text-xl font-bold">
              <Mail className="w-6 h-6 mr-3 text-[#ff6600]" />
              Envoyer un email au support
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-sm">
              Remplissez ce formulaire pour contacter l'équipe support par email
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="email-category" className="text-[#ff6600] font-medium">Catégorie</Label>
              <Select value={emailCategory} onValueChange={setEmailCategory}>
                <SelectTrigger className="border-[#ff6600] focus:border-[#ff6600] focus:ring-[#ff6600] focus:ring-2">
                  <SelectValue placeholder="Sélectionnez une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Question générale</SelectItem>
                  <SelectItem value="technical">Problème technique</SelectItem>
                  <SelectItem value="billing">Facturation</SelectItem>
                  <SelectItem value="account">Compte utilisateur</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="email-subject" className="text-[#ff6600] font-medium">Sujet</Label>
              <Input
                id="email-subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Sujet de votre demande"
                className="border-[#ff6600] focus:border-[#ff6600] focus:ring-[#ff6600] focus:ring-2"
              />
            </div>
            
            <div>
              <Label htmlFor="email-message" className="text-[#ff6600] font-medium">Message</Label>
              <Textarea
                id="email-message"
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                placeholder="Décrivez votre problème ou question..."
                rows={6}
                className="border-[#ff6600] focus:border-[#ff6600] focus:ring-[#ff6600] focus:ring-2"
              />
            </div>
            
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-[#ff6600] mt-0.5" />
                <div className="text-sm text-orange-700">
                  <p className="font-medium text-[#ff6600]">Informations :</p>
                  <ul className="mt-1 space-y-1">
                    <li>• L'email sera envoyé directement à l'équipe support</li>
                    <li>• Vous recevrez une confirmation par email</li>
                    <li>• Réponse garantie sous 24h ouvrées</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowEmailSupportModal(false)}
              className="border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white transition-colors"
            >
              Annuler
            </Button>
            <Button 
              onClick={handleEmailSubmit}
              disabled={isSendingEmail || !emailSubject.trim() || !emailMessage.trim()}
              className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white shadow-md hover:shadow-lg transition-all duration-300"
            >
              {isSendingEmail ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Envoi...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Envoyer l'email
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Chat Global */}
      

      <ProductCategoryProvider eager>
        <AdvancedProductModal
          isOpen={showAdvancedProductModal}
          onClose={() => setShowAdvancedProductModal(false)}
          product={selectedProduct}
          mode={productModalMode}
          context="vendor"
          onSubmit={handleAdvancedProductSubmit}
          onSuccess={async () => {
            await refreshData()
          }}
        />
      </ProductCategoryProvider>
    </div>
  )
}