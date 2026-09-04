"use client"

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { 
  Users, Package, ShoppingCart, DollarSign, 
  TrendingUp, Settings, Bell, MessageSquare,
  Star, Gift, Target, BarChart3, Shield,
  Globe, Zap, Database, Activity, Eye,
  Plus, Search, Filter, MoreHorizontal,
  CheckCircle, AlertTriangle, Clock,
  Heart, Share2, CreditCard, Truck,
  FileText, Lock, Mail, Smartphone, Trash2,
  MessageCircleMore, Loader2, Video, Store
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

// Composants des sections
import SuperAdminOverview from '@/components/super-admin/overview-section'
import { useDateTime } from '@/lib/hooks/use-date-time'
import { useAuth } from '@/contexts/AuthContext'
import { usePublicGlobalSettings } from '@/contexts/PublicGlobalSettingsContext'
import { UserPreferencesProvider } from '@/contexts/UserPreferencesContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { SuperAdminDashboardService, type SuperAdminInboxMessage, type SuperAdminOverviewStats, type SuperAdminSystemAlert, type SuperAdminTeamContact, type SuperAdminUserSummary, type SuperAdminProduct } from '@/lib/services/super-admin-dashboard-service'
import { SuperAdminOrderService } from '@/lib/services/super-admin-order-service'
import { useMoney } from '@/lib/hooks/use-money'
import dynamic from 'next/dynamic'

const SECTION_SLUG_BY_ID: Record<string, string> = {
  overview: '',
  users: 'utilisateurs',
  products: 'produits',
  orders: 'commandes',
  deliveries: 'livraisons',
  financial: 'finances',
  marketing: 'marketing',
  loyalty: 'fidelite',
  'shares-engagement': 'partages',
  messaging: 'messagerie',
  reviews: 'avis',
  notifications: 'notifications',
  settings: 'configuration',
  automation: 'automatisation',
  analytics: 'analyses',
  design: 'design',
  'messages-conseils': 'messages-conseils',
  'support-videos': 'support-videos',
  'seller-applications': 'candidatures-vendeurs'
}

const SECTION_ID_BY_SLUG: Record<string, string> = Object.entries(SECTION_SLUG_BY_ID).reduce(
  (acc, [id, slug]) => {
    if (slug) {
      acc[slug] = id
    }
    return acc
  },
  {} as Record<string, string>
)

const UserManagement = dynamic(() => import('@/components/super-admin/user-management'), { ssr: false })
const ProductManagement = dynamic(() => import('@/components/super-admin/product-management'), { ssr: false })
const OrderManagement = dynamic(() => import('@/components/super-admin/order-management'), { ssr: false })
const DeliveryManagement = dynamic(() => import('@/components/super-admin/delivery-management'), { ssr: false })
const FinancialManagement = dynamic(() => import('@/components/super-admin/financial-management'), { ssr: false })
const MarketingPromotions = dynamic(() => import('@/components/super-admin/marketing-promotions'), { ssr: false })
const LoyaltyPoints = dynamic(() => import('@/components/super-admin/loyalty-points'), { ssr: false })
const MessagingChatSynced = dynamic(() => import('@/components/super-admin/messaging-chat-synced'), { ssr: false })
const ReviewsReputation = dynamic(() => import('@/components/super-admin/reviews-reputation'), { ssr: false })
const NotificationsAlerts = dynamic(() => import('@/components/super-admin/notifications-alerts'), { ssr: false })
const GlobalSettings = dynamic(() => import('@/components/super-admin/global-settings'), { ssr: false })
const AutomationTriggers = dynamic(() => import('@/components/super-admin/automation-triggers'), { ssr: false })
const AdvancedAnalytics = dynamic(() => import('@/components/super-admin/advanced-analytics'), { ssr: false })
const DesignUX = dynamic(() => import('@/components/super-admin/design-ux'), { ssr: false })
const SharesEngagementSuperAdmin = dynamic(() => import('@/components/super-admin/shares-engagement'), { ssr: false })
const EditableMessagesManager = dynamic(() => import('@/components/admin/editable-messages-manager'), { ssr: false })
const SupportVideosAdmin = dynamic(() => import('@/app/dashboard/super-admin/support-videos/page'), { ssr: false })
const SellerApplicationsAdmin = dynamic(() => import('@/components/super-admin/seller-applications'), { ssr: false })

const EMPTY_OVERVIEW: SuperAdminOverviewStats = {
  totalUsers: 0,
  activeUsers: 0,
  totalVendors: 0,
  pendingVendors: 0,
  totalRevenue: 0,
  revenueGross: 0,
  revenueRefunds: 0,
  revenueNet: 0,
  conversionRate: 0,
  totalProducts: 0,
  totalOrders: 0,
  totalPoints: 0,
  unreadMessages: 0,
  systemAlerts: 0
}

/**
 * Tableau de bord Super Admin.
 * IMPORTANT: useSearchParams() doit être rendu sous Suspense pour éviter l'erreur de prerender Next.js.
 */
export default function SuperAdminDashboard() {
  return (
    <Suspense fallback={null}>
      <UserPreferencesProvider>
        <SuperAdminDashboardClient />
      </UserPreferencesProvider>
    </Suspense>
  )
}

function SuperAdminDashboardClient() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { formatMoney } = useMoney()
  const { data: publicSettings } = usePublicGlobalSettings()
  const confirm = useConfirm()
  const { formatDateTime } = useDateTime()
  const [activeSection, setActiveSection] = useState('overview')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let active = true
    const t = window.setTimeout(() => {
      if (!active) return
      void import('@/components/super-admin/user-management').catch(() => undefined)
      void import('@/components/super-admin/product-management').catch(() => undefined)
      void import('@/components/super-admin/order-management').catch(() => undefined)
      void import('@/components/super-admin/delivery-management').catch(() => undefined)
      void import('@/components/super-admin/financial-management').catch(() => undefined)
      void import('@/components/super-admin/marketing-promotions').catch(() => undefined)
      void import('@/components/super-admin/loyalty-points').catch(() => undefined)
      void import('@/components/super-admin/shares-engagement').catch(() => undefined)
      void import('@/components/super-admin/global-settings').catch(() => undefined)
    }, 0)

    return () => {
      active = false
      window.clearTimeout(t)
    }
  }, [])

  const prefetchFinancialManagement = useCallback(() => {
    void import('@/components/super-admin/financial-management').catch((error) => {
      console.warn('Prefetch FinancialManagement failed:', error)
    })
  }, [])
  
  // États pour les modals
  const [showAlertsModal, setShowAlertsModal] = useState(false)
  const [showMessagesModal, setShowMessagesModal] = useState(false)
  const [showConfigModal, setShowConfigModal] = useState(false)
  
  // États pour les actions des modals
  const [showReplyModal, setShowReplyModal] = useState(false)
  const [showForwardModal, setShowForwardModal] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<any>(null)
  const [replyContent, setReplyContent] = useState('')
  const [forwardRecipient, setForwardRecipient] = useState('')
  const [forwardMessage, setForwardMessage] = useState('')
  const [isReplying, setIsReplying] = useState(false)
  const [isForwarding, setIsForwarding] = useState(false)

  // États globaux pour le super admin
  const [stats, setStats] = useState<SuperAdminOverviewStats>(EMPTY_OVERVIEW)
  const [prefetchedFinanceStats, setPrefetchedFinanceStats] = useState<any | null>(null)
  const [systemAlerts, setSystemAlerts] = useState<SuperAdminSystemAlert[]>([])
  const [unreadMessages, setUnreadMessages] = useState<SuperAdminInboxMessage[]>([])
  const [teams, setTeams] = useState<SuperAdminTeamContact[]>([])
  const [prefetchedUsers, setPrefetchedUsers] = useState<SuperAdminUserSummary[] | null>(null)
  const [prefetchedProducts, setPrefetchedProducts] = useState<{ items: SuperAdminProduct[]; count: number } | null>(null)
  const [prefetchedOrders, setPrefetchedOrders] = useState<any[] | null>(null)
  const [loadingError, setLoadingError] = useState<string | null>(null)
  const [isRefreshingStats, setIsRefreshingStats] = useState(false)

  const defaultConfigState = useMemo(() => ({
    twoFactorRequired: true,
    allowMultipleSessions: true,
    auditActions: true,
    systemCacheEnabled: true,
    dataCompressionEnabled: true,
    maintenanceMode: false,
    autoBackupEnabled: true,
    emailAlertsEnabled: true,
    pushNotificationsEnabled: true,
    dailyReportsEnabled: false,
    dataEncryptionEnabled: true,
    intrusionDetectionEnabled: true,
    encryptedBackupsEnabled: true
  }), [])

  const [configState, setConfigState] = useState(defaultConfigState)
  const [isConfigLoading, setIsConfigLoading] = useState(false)
  const [isConfigSaving, setIsConfigSaving] = useState(false)
  const [configError, setConfigError] = useState<string | null>(null)

  const emptyStats = useMemo<SuperAdminOverviewStats>(() => ({
    totalUsers: 0,
    activeUsers: 0,
    totalVendors: 0,
    pendingVendors: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalPoints: 0,
    unreadMessages: 0,
    systemAlerts: 0
  }), [])

  const hasInitialData = Boolean(stats)

  /**
   * Rafraîchit les KPI (overview) depuis l'API super-admin.
   * Objectif: garantir que les compteurs restent alignés avec la DB après chaque action des modals.
   */
  const refreshOverviewStats = useCallback(async () => {
    try {
      setIsRefreshingStats(true)
      const latest = await SuperAdminDashboardService.getOverviewStats()
      if (latest) {
        setStats(latest)
      }
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des stats:', error)
    } finally {
      setIsRefreshingStats(false)
    }
  }, [])

  useEffect(() => {
    const run = () => {
      void import('@/components/super-admin/financial-management').catch((error) => {
        console.warn('Idle prefetch FinancialManagement failed:', error)
      })
    }

    const w = window as any
    if (typeof w?.requestIdleCallback === 'function') {
      w.requestIdleCallback(run)
    } else {
      setTimeout(run, 0)
    }
  }, [])

  const resolvedSiteName = useMemo(() => {
    const name = (publicSettings?.siteConfig?.siteName ?? 'Probooster').toString().trim()
    return name || 'Probooster'
  }, [publicSettings?.siteConfig?.siteName])

  const resolvedLogoSrc = useMemo(() => {
    const candidate = (publicSettings?.siteConfig?.logoUrl ?? '').toString().trim()
    return candidate || ''
  }, [publicSettings?.siteConfig?.logoUrl])

  useEffect(() => {
    if (!user?.id) {
      router.replace('/auth/login?redirect=/super-admin-dashboard')
      return
    }
  }, [router, user?.id])

  const navigateToSection = useCallback(
    (sectionId: string, mode: 'push' | 'replace' = 'push') => {
      const slug = SECTION_SLUG_BY_ID[sectionId]
      const nextUrl = slug ? `/super-admin-dashboard/${slug}` : '/super-admin-dashboard'

      setActiveSection(sectionId)
      if (mode === 'replace') {
        router.replace(nextUrl)
      } else {
        router.push(nextUrl)
      }
    },
    [router]
  )

  useEffect(() => {
    const section = searchParams?.get('section')
    if (!section) return

    if (Object.prototype.hasOwnProperty.call(SECTION_SLUG_BY_ID, section) && section !== activeSection) {
      setActiveSection(section)
    }
  }, [activeSection, searchParams])

  // Résout la section depuis le slug d'URL (/super-admin-dashboard/<slug>)
  useEffect(() => {
    const segments = pathname?.split('/').filter(Boolean) ?? []
    const slug = segments.length > 1 ? segments[segments.length - 1] : ''
    if (!slug) return

    const sectionId = SECTION_ID_BY_SLUG[slug]
    if (sectionId && sectionId !== activeSection) {
      setActiveSection(sectionId)
    }
  }, [activeSection, pathname])

  useEffect(() => {
    let cancelled = false

    const prefetchFinanceStats = async () => {
      try {
        const res = await fetch('/api/finance/stats', { credentials: 'include' })
        if (!res.ok) return
        const json = await res.json().catch(() => null)
        if (cancelled) return
        if (json && typeof json === 'object') {
          setPrefetchedFinanceStats(json)
        }
      } catch {
        return
      }
    }

    void prefetchFinanceStats()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return
      setIsLoading(true)
      setLoadingError(null)

      try {
        const [stats, alerts, messages, contacts, users, productsPayload] = await Promise.all([
          SuperAdminDashboardService.getOverviewStats(),
          SuperAdminDashboardService.getSystemAlerts(100),
          SuperAdminDashboardService.getInboxMessages(user.id, 50),
          SuperAdminDashboardService.getAdminContacts(),
          SuperAdminDashboardService.getUsers({ limit: 200 }),
          SuperAdminDashboardService.getProducts({ limit: 50, offset: 0 })
        ])

        setStats(stats ?? emptyStats)
        setSystemAlerts((alerts ?? []).filter((alert) => alert.status === 'active'))
        setUnreadMessages((messages ?? []).filter((message) => !message.isRead && message.status !== 'deleted'))
        setTeams(contacts ?? [])
        setPrefetchedUsers(Array.isArray(users) ? users : [])
        setPrefetchedProducts({
          items: Array.isArray(productsPayload?.items) ? productsPayload.items : [],
          count: typeof productsPayload?.count === 'number' ? productsPayload.count : 0
        })

        // Préchargement en arrière-plan des commandes: ne doit pas ralentir l'UI.
        setTimeout(() => {
          void SuperAdminOrderService.list({ limit: 200 })
            .then((orders) => {
              setPrefetchedOrders((previous) => {
                if (Array.isArray(previous) && previous.length > 0) return previous
                return Array.isArray(orders) ? orders : []
              })
            })
            .catch((error) => {
              console.error('Erreur lors du préchargement des commandes:', error)
            })
        }, 0)
      } catch (error) {
        console.error("Erreur lors du chargement des données super admin:", error)
        setLoadingError('Impossible de charger les données du tableau de bord. Veuillez réessayer plus tard.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadData()
  }, [user?.id])

  useEffect(() => {
    const loadConfig = async () => {
      if (!showConfigModal) return

      setIsConfigLoading(true)
      setConfigError(null)
      try {
        const dbConfig = await SuperAdminDashboardService.getGlobalSettings()
        setConfigState((prev) => ({
          ...prev,
          ...defaultConfigState,
          ...(dbConfig ?? {})
        }))
      } catch (error) {
        console.error('Erreur lors du chargement de la configuration:', error)
        setConfigError('Impossible de charger la configuration. Veuillez réessayer.')
        setConfigState(defaultConfigState)
      } finally {
        setIsConfigLoading(false)
      }
    }

    void loadConfig()
  }, [defaultConfigState, showConfigModal])

  // Fonctions de gestion des alertes et messages
  const handleAlertAction = async (alertId: string, action: 'resolve' | 'ignore' | 'escalate') => {
    if (!alertId) return

    let updated = false
    if (action === 'resolve') {
      updated = await SuperAdminDashboardService.resolveSystemAlert(alertId)
      if (updated) {
        setSystemAlerts(prev => prev.filter(alert => alert.id !== alertId))
        setStats(prev => {
          if (!prev) return prev
          return { ...prev, systemAlerts: Math.max((prev.systemAlerts ?? 0) - 1, 0) }
        })
        await refreshOverviewStats()
      }
    } else if (action === 'ignore') {
      updated = await SuperAdminDashboardService.ignoreSystemAlert(alertId)
      if (updated) {
        setSystemAlerts(prev => prev.filter(alert => alert.id !== alertId))
        setStats(prev => {
          if (!prev) return prev
          return { ...prev, systemAlerts: Math.max((prev.systemAlerts ?? 0) - 1, 0) }
        })
        await refreshOverviewStats()
      }
    } else if (action === 'escalate') {
      updated = await SuperAdminDashboardService.escalateSystemAlert(alertId)
      if (updated) {
        alert('Alerte escaladée auprès des administrateurs supérieurs.')
        setSystemAlerts(prev => prev.map(alert => 
          alert.id === alertId ? { ...alert, action_required: true } : alert
        ))
        await refreshOverviewStats()
      }
    }

    if (!updated) {
      alert('Action impossible sur cette alerte. Veuillez réessayer.')
    }
  }

  const handleMessageAction = async (messageId: string, action: 'read' | 'reply' | 'forward' | 'delete') => {
    const message = unreadMessages.find(m => m.id === messageId)
    if (!message) return

    if (action === 'read') {
      const success = await SuperAdminDashboardService.markMessageAsRead(messageId)
      if (success) {
        setUnreadMessages(prev => prev.filter(m => m.id !== messageId))
        setStats(prev => {
          if (!prev) return prev
          if (message.isRead) return prev
          return { ...prev, unreadMessages: Math.max((prev.unreadMessages ?? 0) - 1, 0) }
        })
        await refreshOverviewStats()
      } else {
        alert('Impossible de marquer ce message comme lu. Veuillez réessayer.')
      }
    } else if (action === 'reply') {
      // Ouvrir le modal de réponse
      setSelectedMessage(message)
      setReplyContent('')
      setShowReplyModal(true)
    } else if (action === 'forward') {
      // Ouvrir le modal de transfert
      setSelectedMessage(message)
      setForwardRecipient('')
      setForwardMessage(message.message)
      setShowForwardModal(true)
    } else if (action === 'delete') {
      const ok = await confirm.confirm({
        title: 'Supprimer le message',
        message: `Êtes-vous sûr de vouloir supprimer le message "${message.subject}" ? Cette action est irréversible.`,
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        tone: 'destructive'
      })
      if (!ok) return

      const deleted = await SuperAdminDashboardService.updateMessageStatus(messageId, 'deleted')
      if (deleted) {
        setUnreadMessages(prev => prev.filter(m => m.id !== messageId))
        setStats(prev => {
          if (!prev) return prev
          if (message.isRead) return prev
          return { ...prev, unreadMessages: Math.max((prev.unreadMessages ?? 0) - 1, 0) }
        })
        await refreshOverviewStats()
      } else {
        alert('Suppression impossible pour le moment. Veuillez réessayer plus tard.')
      }
    }
  }

  // Fonctions pour les modals de réponse et transfert
  const handleReply = async () => {
    if (!selectedMessage || !replyContent.trim()) return
    
    setIsReplying(true)
    try {
      const success = await SuperAdminDashboardService.sendInternalMessage({
        senderId: user?.id ?? '',
        recipientId: selectedMessage.senderId ?? '',
        subject: `RE: ${selectedMessage.subject}`,
        content: replyContent,
        priority: selectedMessage.priority,
        category: selectedMessage.category,
        parentMessageId: selectedMessage.id
      })

      if (!success) {
        alert('Erreur lors de l\'envoi de la réponse. Veuillez réessayer.')
        return
      }

      void SuperAdminDashboardService.markMessageAsRead(selectedMessage.id)

      setShowReplyModal(false)
      setSelectedMessage(null)
      setReplyContent('')

      setUnreadMessages(prev => prev.filter(m => m.id !== selectedMessage.id))
      setStats(prev => {
        if (!prev) return prev
        return { ...prev, unreadMessages: Math.max((prev.unreadMessages ?? 0) - 1, 0) }
      })

      await refreshOverviewStats()
    } catch (error) {
      console.error('Erreur lors de la réponse:', error)
      alert('Erreur lors de l\'envoi de la réponse')
    } finally {
      setIsReplying(false)
    }
  }

  const handleForward = async () => {
    if (!selectedMessage || !forwardRecipient.trim() || !forwardMessage.trim()) return
    
    setIsForwarding(true)
    try {
      const recipient = teams.find(team => team.id === forwardRecipient || team.name === forwardRecipient)
      const targetId = recipient?.id ?? forwardRecipient

      const success = await SuperAdminDashboardService.sendInternalMessage({
        senderId: user?.id ?? '',
        recipientId: targetId,
        subject: `FW: ${selectedMessage.subject}`,
        content: forwardMessage,
        priority: selectedMessage.priority,
        category: selectedMessage.category,
        parentMessageId: selectedMessage.id
      })

      if (!success) {
        alert('Erreur lors du transfert du message. Veuillez réessayer.')
        return
      }

      setShowForwardModal(false)
      setSelectedMessage(null)
      setForwardRecipient('')
      setForwardMessage('')
    } catch (error) {
      console.error('Erreur lors du transfert:', error)
      alert('Erreur lors du transfert du message')
    } finally {
      setIsForwarding(false)
    }
  }

  const handleMarkAllAlertsAsRead = async () => {
    const ok = await confirm.confirm({
      title: 'Tout marquer comme lu',
      message: 'Marquer toutes les alertes système comme lues ?',
      confirmText: 'Oui',
      cancelText: 'Annuler',
      tone: 'default'
    })
    if (!ok) return

    const success = await SuperAdminDashboardService.resolveAllSystemAlerts()
    if (success) {
      setSystemAlerts([])
      setStats(prev => prev ? { ...prev, systemAlerts: 0 } : prev)
      await refreshOverviewStats()
    } else {
      alert('Impossible de marquer toutes les alertes comme lues. Tentez à nouveau.')
    }
  }

  const handleMarkAllMessagesAsRead = async () => {
    const ok = await confirm.confirm({
      title: 'Tout marquer comme lu',
      message: 'Marquer tous les messages comme lus ?',
      confirmText: 'Oui',
      cancelText: 'Annuler',
      tone: 'default'
    })
    if (!ok) return
    if (!user?.id) return

    const success = await SuperAdminDashboardService.markAllMessagesAsRead(user.id)
    if (success) {
      setUnreadMessages([])
      setStats(prev => prev ? { ...prev, unreadMessages: 0 } : prev)
      await refreshOverviewStats()
    } else {
      alert('Impossible de marquer tous les messages comme lus. Veuillez réessayer.')
    }
  }

  const handleConfigSave = async () => {
    setIsConfigSaving(true)
    setConfigError(null)
    try {
      const ok = await SuperAdminDashboardService.updateGlobalSettings(configState)
      if (!ok) {
        setConfigError('Sauvegarde impossible pour le moment. Réessayez.')
        return
      }

      setShowConfigModal(false)
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la configuration:', error)
      setConfigError('Erreur lors de la sauvegarde. Veuillez réessayer.')
    } finally {
      setIsConfigSaving(false)
    }
  }

  // Configuration des sections avec icônes et descriptions
  const sections = [
    {
      id: 'overview',
      title: 'Vue d\'Ensemble',
      icon: BarChart3,
      description: 'Tableau de bord principal et KPIs',
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'users',
      title: 'Gestion Utilisateurs',
      icon: Users,
      description: 'CRUD, approbations, rôles et permissions',
      color: 'from-green-500 to-green-600'
    },
    {
      id: 'products',
      title: 'Gestion Produits',
      icon: Package,
      description: 'Catalogue, création, édition et modération',
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 'orders',
      title: 'Commandes & Ventes',
      icon: ShoppingCart,
      description: 'Suivi des commandes et paiements',
      color: 'from-orange-500 to-orange-600'
    },
    {
      id: 'deliveries',
      title: 'Gestion de livraison',
      icon: Truck,
      description: 'Planification, suivi et contrôle des livraisons',
      color: 'from-amber-500 to-orange-600'
    },
    {
      id: 'financial',
      title: 'Gestion Financière',
      icon: DollarSign,
      description: 'Commissions, points et retraits',
      color: 'from-emerald-500 to-emerald-600'
    },
    {
      id: 'marketing',
      title: 'Marketing & Promos',
      icon: Target,
      description: 'Campagnes, coupons et offres',
      color: 'from-pink-500 to-pink-600'
    },
    {
      id: 'loyalty',
      title: 'Points & Fidélité',
      icon: Star,
      description: 'Système de fidélité et récompenses',
      color: 'from-yellow-500 to-yellow-600'
    },
    {
      id: 'shares-engagement',
      title: 'Partages & Engagements',
      icon: Share2,
      description: 'Centralisation des partages et interactions (clients + vendeurs)',
      color: 'from-indigo-500 to-fuchsia-600'
    },
    {
      id: 'messaging',
      title: 'Messagerie & Chat',
      icon: MessageSquare,
      description: 'Modération et synchronisation',
      color: 'from-indigo-500 to-indigo-600'
    },
    {
      id: 'reviews',
      title: 'Avis & Réputation',
      icon: Star,
      description: 'Modération et gestion des avis',
      color: 'from-amber-500 to-amber-600'
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: Bell,
      description: 'Alertes et notifications push',
      color: 'from-red-500 to-red-600'
    },
    {
      id: 'settings',
      title: 'Configuration',
      icon: Settings,
      description: 'Paramètres globaux et sécurité',
      color: 'from-gray-500 to-gray-600'
    },
    {
      id: 'automation',
      title: 'Automatisation',
      icon: Zap,
      description: 'Déclencheurs et règles automatiques',
      color: 'from-cyan-500 to-cyan-600'
    },
    {
      id: 'analytics',
      title: 'Analyses',
      icon: Activity,
      description: 'Statistiques et rapports avancés',
      color: 'from-violet-500 to-violet-600'
    },
    {
      id: 'design',
      title: 'Design & UX',
      icon: Eye,
      description: 'Interface et expérience utilisateur',
      color: 'from-rose-500 to-rose-600'
    },
    {
      id: 'messages-conseils',
      title: 'Messages Conseils',
      icon: MessageCircleMore,
      description: 'Gérer les messages affichés aux utilisateurs',
      color: 'from-teal-500 to-teal-600'
    },
    {
      id: 'support-videos',
      title: 'Vidéos Tutoriels',
      icon: Video,
      description: 'Gérer les vidéos YouTube du centre de ressources',
      color: 'from-red-500 to-red-600'
    },
    {
      id: 'seller-applications',
      title: 'Candidatures Vendeur',
      icon: Store,
      description: 'Étudier et approuver les demandes des futurs vendeurs',
      color: 'from-emerald-500 to-emerald-600'
    }
  ]

  // Fonction pour rendre le contenu de la section active
  const renderSectionContent = () => {
    switch (activeSection) {
      case 'overview':
        return <SuperAdminOverview stats={stats} />
      case 'users':
        return <UserManagement prefetchedUsers={prefetchedUsers ?? undefined} />
      case 'products':
        return <ProductManagement prefetchedProducts={prefetchedProducts ?? undefined} />
      case 'orders':
        return <OrderManagement prefetchedOrders={prefetchedOrders ?? undefined} />
      case 'deliveries':
        return <DeliveryManagement />
      case 'financial':
        return (
          <FinancialManagement
            initialStats={{
              totalRevenue: Number(prefetchedFinanceStats?.totalRevenue ?? stats.totalRevenue) || 0,
              revenueGross: Number(prefetchedFinanceStats?.revenueGross ?? (stats as any).revenueGross) || 0,
              revenueRefunds: Number(prefetchedFinanceStats?.revenueRefunds ?? (stats as any).revenueRefunds) || 0,
              revenueNet: Number(prefetchedFinanceStats?.revenueNet ?? (stats as any).revenueNet) || 0,
              totalCommission: Number(prefetchedFinanceStats?.totalCommission) || 0,
              totalPayouts: Number(prefetchedFinanceStats?.totalPayouts) || 0,
              pendingPayouts: Number(prefetchedFinanceStats?.pendingPayouts) || 0,
              monthlyGrowth: Number(prefetchedFinanceStats?.monthlyGrowth) || 0,
              averageOrderValue: Number(prefetchedFinanceStats?.averageOrderValue) || 0,
              approvalRate: Number(prefetchedFinanceStats?.approvalRate) || 0,
              points: prefetchedFinanceStats?.points
            }}
          />
        )
      case 'marketing':
        return <MarketingPromotions />
      case 'loyalty':
        return <LoyaltyPoints />
      case 'shares-engagement':
        return <SharesEngagementSuperAdmin />
      case 'messaging':
        return <MessagingChatSynced />
      case 'reviews':
        return <ReviewsReputation />
      case 'notifications':
        return <NotificationsAlerts />
      case 'settings':
        return <GlobalSettings />
      case 'automation':
        return <AutomationTriggers />
      case 'analytics':
        return <AdvancedAnalytics />
      case 'design':
        return <DesignUX />
      case 'messages-conseils':
        return <EditableMessagesManager userId={user?.id || ''} />
      case 'support-videos':
        return <SupportVideosAdmin />
      case 'seller-applications':
        return <SellerApplicationsAdmin />
      default:
        return <SuperAdminOverview stats={stats} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête du tableau de bord */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              {resolvedLogoSrc ? (
                <img
                  src={resolvedLogoSrc}
                  alt={`${resolvedSiteName} Logo`}
                  className="h-10 w-auto object-contain"
                />
              ) : null}
              <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{resolvedSiteName} - Super Admin</h1>
                <p className="text-sm text-gray-600">Gestion totale et contrôle exhaustif de la marketplace</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAlertsModal(true)}
                className="border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400"
              >
                <AlertTriangle className="h-3 w-3 mr-1" />
                {stats.systemAlerts} Alertes
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowMessagesModal(true)}
                className="border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400"
              >
                <MessageSquare className="h-3 w-3 mr-1" />
                {stats.unreadMessages} Messages
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowConfigModal(true)}
                className="hover:bg-gray-50"
              >
                <Settings className="h-4 w-4 mr-2" />
                Configuration
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques globales en temps réel */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Utilisateurs Actifs</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.activeUsers.toLocaleString()}</p>
                  <p className="text-xs text-blue-700">Sur {stats.totalUsers.toLocaleString()} total</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Chiffre d'Affaires</p>
                  <p className="text-2xl font-bold text-green-900">{formatMoney((stats as any).revenueNet ?? stats.totalRevenue)}</p>
                  <p className="text-xs text-green-700">
                    Ventes: {formatMoney((stats as any).revenueGross ?? stats.totalRevenue)} · Remboursements: {formatMoney((stats as any).revenueRefunds ?? 0)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Points en Circulation</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {stats.totalPoints >= 1000000
                      ? `${(stats.totalPoints / 1000000).toFixed(1)}M`
                      : stats.totalPoints.toLocaleString('fr-FR')}
                  </p>
                  <p className="text-xs text-orange-700">Fidélité active</p>
                </div>
                <Star className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Commandes en Cours</p>
                  <p className="text-2xl font-bold text-purple-900">{stats.totalOrders.toLocaleString()}</p>
                  <p className="text-xs text-purple-700">Ce mois</p>
                </div>
                <ShoppingCart className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">Vendeurs en Attente</p>
                  <p className="text-2xl font-bold text-red-900">{stats.pendingVendors}</p>
                  <p className="text-xs text-red-700">Approbation requise</p>
                </div>
                <Package className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Layout principal avec barre latérale et contenu */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="flex gap-6">
          {/* Barre latérale gauche */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Sections d'Administration</h3>
              
              <div className="space-y-2">
                {sections.map((section) => {
                  const IconComponent = section.icon
                  const isActive = activeSection === section.id
                  
                  return (
                    <button
                      key={section.id}
                      onClick={() => navigateToSection(section.id)}
                      onMouseEnter={section.id === 'financial' ? prefetchFinancialManagement : undefined}
                      onFocus={section.id === 'financial' ? prefetchFinancialManagement : undefined}
                      className={`w-full text-left p-3 rounded-lg transition-all duration-200 group ${
                        isActive 
                          ? `bg-gradient-to-r ${section.color} text-white shadow-lg` 
                          : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          isActive 
                            ? 'bg-white/20 text-white' 
                            : `bg-gradient-to-r ${section.color} text-white`
                        }`}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium ${isActive ? 'text-white' : 'text-gray-900'}`}>
                            {section.title}
                          </p>
                          <p className={`text-xs ${isActive ? 'text-white/80' : 'text-gray-500'}`}>
                            {section.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Contenu principal */}
          <div className="flex-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              {/* En-tête de la section active */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  {(() => {
                    const activeSectionData = sections.find(s => s.id === activeSection)
                    const IconComponent = activeSectionData?.icon
                    return (
                      <>
                        <div className={`p-2 rounded-lg bg-gradient-to-r ${activeSectionData?.color}`}>
                          <IconComponent className="h-5 w-5 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">{activeSectionData?.title}</h2>
                      </>
                    )
                  })()}
                </div>
                <p className="text-gray-600">{sections.find(s => s.id === activeSection)?.description}</p>
              </div>

              {/* Contenu de la section */}
              <div className="min-h-[600px]">
                {renderSectionContent()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal des Alertes Système */}
      <Dialog open={showAlertsModal} onOpenChange={setShowAlertsModal}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[#ff6600]" />
              Alertes Système ({systemAlerts.length})
            </DialogTitle>
            <DialogDescription>
              Gérez et surveillez toutes les alertes système en temps réel
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {systemAlerts.map((alert) => (
              <div key={alert.id} className={`p-4 rounded-lg border ${
                alert.type === 'critical' ? 'border-red-200 bg-red-50' :
                alert.type === 'warning' ? 'border-orange-200 bg-orange-50' :
                'border-blue-200 bg-blue-50'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={alert.type === 'critical' ? 'destructive' : alert.type === 'warning' ? 'secondary' : 'default'}>
                        {alert.type === 'critical' ? 'Critique' : alert.type === 'warning' ? 'Avertissement' : 'Info'}
                      </Badge>
                      <Badge variant="outline" className={
                        alert.priority === 'high' ? 'border-red-300 text-red-700' :
                        alert.priority === 'medium' ? 'border-orange-300 text-orange-700' :
                        'border-blue-300 text-blue-700'
                      }>
                        {alert.priority === 'high' ? 'Haute' : alert.priority === 'medium' ? 'Moyenne' : 'Basse'}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatDateTime(alert.timestamp, { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-1">{alert.title}</h4>
                    <p className="text-sm text-gray-600">{alert.message}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    {alert.status === 'active' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAlertAction(alert.id, 'resolve')}
                          className="text-[#ff6600] border-[#ff6600] hover:bg-[#ff6600]/10"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Résoudre
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAlertAction(alert.id, 'ignore')}
                          className="text-[#535455] border-[#535455] hover:bg-[#535455]/10"
                        >
                          Ignorer
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAlertAction(alert.id, 'escalate')}
                      className="text-[#ff6600] border-[#ff6600] hover:bg-[#ff6600]/10"
                    >
                      Escalader
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => setShowAlertsModal(false)}
              className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white"
            >
              Fermer
            </Button>
            <Button 
              onClick={handleMarkAllAlertsAsRead}
              className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white"
            >
              Tout marquer comme lu
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal des Messages */}
      <Dialog open={showMessagesModal} onOpenChange={setShowMessagesModal}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-[#ff6600]" />
              Messages ({unreadMessages.length})
            </DialogTitle>
            <DialogDescription>
              Gérez vos messages et communications internes
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {unreadMessages.map((message) => (
              <div key={message.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className={
                        message.priority === 'high' ? 'border-red-300 text-red-700' :
                        message.priority === 'medium' ? 'border-orange-300 text-orange-700' :
                        'border-blue-300 text-blue-700'
                      }>
                        {message.priority === 'high' ? 'Urgent' : message.priority === 'medium' ? 'Important' : 'Normal'}
                      </Badge>
                      <Badge variant="outline" className="border-gray-300 text-gray-700">
                        {message.category === 'support' ? 'Support' : message.category === 'technical' ? 'Technique' : 'Direction'}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatDateTime(message.timestamp, { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-1">{message.subject}</h4>
                    <p className="text-sm text-gray-600 mb-2">De: {message.from}</p>
                    <p className="text-sm text-gray-600">{message.message}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMessageAction(message.id, 'read')}
                      className="text-[#ff6600] border-[#ff6600] hover:bg-[#ff6600]/10"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Marquer lu
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMessageAction(message.id, 'reply')}
                      className="text-[#ff6600] border-[#ff6600] hover:bg-[#ff6600]/10"
                    >
                      <Mail className="h-4 w-4 mr-1" />
                      Répondre
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMessageAction(message.id, 'forward')}
                      className="text-[#ff6600] border-[#ff6600] hover:bg-[#ff6600]/10"
                    >
                      <Share2 className="h-4 w-4 mr-1" />
                      Transférer
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMessageAction(message.id, 'delete')}
                      className="text-[#ff6600] border-[#ff6600] hover:bg-[#ff6600]/10"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => setShowMessagesModal(false)}
              className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white"
            >
              Fermer
            </Button>
            <Button 
              onClick={handleMarkAllMessagesAsRead}
              className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white"
            >
              Tout marquer comme lu
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Configuration */}
      <Dialog open={showConfigModal} onOpenChange={setShowConfigModal}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-[#ff6600]" />
              Configuration Système
            </DialogTitle>
            <DialogDescription>
              Configurez les paramètres globaux de la marketplace
            </DialogDescription>
          </DialogHeader>
 
          {configError ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {configError}
            </div>
          ) : null}

          <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2">
            {/* Paramètres de sécurité */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Sécurité</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Authentification à deux facteurs</p>
                    <p className="text-sm text-gray-500">Obligatoire pour tous les administrateurs</p>
                  </div>
                  <Switch
                    checked={configState.twoFactorRequired}
                    onCheckedChange={(checked) => setConfigState((prev) => ({ ...prev, twoFactorRequired: checked }))}
                    disabled={isConfigLoading || isConfigSaving}
                  />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Sessions multiples</p>
                    <p className="text-sm text-gray-500">Autoriser plusieurs connexions simultanées</p>
                  </div>
                  <Switch
                    checked={configState.allowMultipleSessions}
                    onCheckedChange={(checked) => setConfigState((prev) => ({ ...prev, allowMultipleSessions: checked }))}
                    disabled={isConfigLoading || isConfigSaving}
                  />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Audit des actions</p>
                    <p className="text-sm text-gray-500">Enregistrer toutes les actions administratives</p>
                  </div>
                  <Switch
                    checked={configState.auditActions}
                    onCheckedChange={(checked) => setConfigState((prev) => ({ ...prev, auditActions: checked }))}
                    disabled={isConfigLoading || isConfigSaving}
                  />
                </div>
              </div>
            </div>

            {/* Paramètres de performance */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Performance</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Cache système</p>
                    <p className="text-sm text-gray-500">Activer le cache pour améliorer les performances</p>
                  </div>
                  <Switch
                    checked={configState.systemCacheEnabled}
                    onCheckedChange={(checked) => setConfigState((prev) => ({ ...prev, systemCacheEnabled: checked }))}
                    disabled={isConfigLoading || isConfigSaving}
                  />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Compression des données</p>
                    <p className="text-sm text-gray-500">Compresser les données pour économiser la bande passante</p>
                  </div>
                  <Switch
                    checked={configState.dataCompressionEnabled}
                    onCheckedChange={(checked) => setConfigState((prev) => ({ ...prev, dataCompressionEnabled: checked }))}
                    disabled={isConfigLoading || isConfigSaving}
                  />
                </div>
              </div>
            </div>

            {/* Paramètres de maintenance */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Maintenance</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Mode maintenance</p>
                    <p className="text-sm text-gray-500">Activer le mode maintenance pour les mises à jour</p>
                  </div>
                  <Switch
                    checked={configState.maintenanceMode}
                    onCheckedChange={(checked) => setConfigState((prev) => ({ ...prev, maintenanceMode: checked }))}
                    disabled={isConfigLoading || isConfigSaving}
                  />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Sauvegarde automatique</p>
                    <p className="text-sm text-gray-500">Sauvegarde automatique toutes les heures</p>
                  </div>
                  <Switch
                    checked={configState.autoBackupEnabled}
                    onCheckedChange={(checked) => setConfigState((prev) => ({ ...prev, autoBackupEnabled: checked }))}
                    disabled={isConfigLoading || isConfigSaving}
                  />
                </div>
              </div>
            </div>

            {/* Paramètres de notifications */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Notifications</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Alertes par email</p>
                    <p className="text-sm text-gray-500">Recevoir les alertes système par email</p>
                  </div>
                  <Switch
                    checked={configState.emailAlertsEnabled}
                    onCheckedChange={(checked) => setConfigState((prev) => ({ ...prev, emailAlertsEnabled: checked }))}
                    disabled={isConfigLoading || isConfigSaving}
                  />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Notifications push</p>
                    <p className="text-sm text-gray-500">Activer les notifications push en temps réel</p>
                  </div>
                  <Switch
                    checked={configState.pushNotificationsEnabled}
                    onCheckedChange={(checked) => setConfigState((prev) => ({ ...prev, pushNotificationsEnabled: checked }))}
                    disabled={isConfigLoading || isConfigSaving}
                  />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Rapports quotidiens</p>
                    <p className="text-sm text-gray-500">Envoyer des rapports quotidiens par email</p>
                  </div>
                  <Switch
                    checked={configState.dailyReportsEnabled}
                    onCheckedChange={(checked) => setConfigState((prev) => ({ ...prev, dailyReportsEnabled: checked }))}
                    disabled={isConfigLoading || isConfigSaving}
                  />
                </div>
              </div>
            </div>

            {/* Paramètres de sécurité avancée */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Sécurité Avancée</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Chiffrement des données</p>
                    <p className="text-sm text-gray-500">Chiffrer toutes les données sensibles</p>
                  </div>
                  <Switch
                    checked={configState.dataEncryptionEnabled}
                    onCheckedChange={(checked) => setConfigState((prev) => ({ ...prev, dataEncryptionEnabled: checked }))}
                    disabled={isConfigLoading || isConfigSaving}
                  />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Détection d'intrusion</p>
                    <p className="text-sm text-gray-500">Système de détection d'intrusion automatique</p>
                  </div>
                  <Switch
                    checked={configState.intrusionDetectionEnabled}
                    onCheckedChange={(checked) => setConfigState((prev) => ({ ...prev, intrusionDetectionEnabled: checked }))}
                    disabled={isConfigLoading || isConfigSaving}
                  />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Sauvegarde chiffrée</p>
                    <p className="text-sm text-gray-500">Chiffrer les sauvegardes automatiques</p>
                  </div>
                  <Switch
                    checked={configState.encryptedBackupsEnabled}
                    onCheckedChange={(checked) => setConfigState((prev) => ({ ...prev, encryptedBackupsEnabled: checked }))}
                    disabled={isConfigLoading || isConfigSaving}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => {
                setConfigState(defaultConfigState)
                setConfigError(null)
                setShowConfigModal(false)
              }}
              className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white"
              disabled={isConfigSaving}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleConfigSave}
              className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white"
              disabled={isConfigLoading || isConfigSaving}
            >
              {isConfigSaving ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Réponse */}
      <Dialog open={showReplyModal} onOpenChange={setShowReplyModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-[#ff6600]" />
              Répondre au message
            </DialogTitle>
            <DialogDescription>
              Répondez au message de {selectedMessage?.from}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">{selectedMessage?.subject}</h4>
              <p className="text-sm text-gray-600 mb-2">De: {selectedMessage?.from}</p>
              <p className="text-sm text-gray-600">{selectedMessage?.message}</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Votre réponse</label>
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Tapez votre réponse..."
                className="min-h-[128px]"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowReplyModal(false)
                setSelectedMessage(null)
                setReplyContent('')
              }}
              className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white"
            >
              Annuler
            </Button>
            <Button 
              onClick={handleReply}
              disabled={!replyContent.trim() || isReplying}
              className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white"
            >
              {isReplying ? 'Envoi...' : 'Envoyer la réponse'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Transfert */}
      <Dialog open={showForwardModal} onOpenChange={setShowForwardModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-[#ff6600]" />
              Transférer le message
            </DialogTitle>
            <DialogDescription>
              Transférez ce message à un autre destinataire
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">{selectedMessage?.subject}</h4>
              <p className="text-sm text-gray-600 mb-2">De: {selectedMessage?.from}</p>
              <p className="text-sm text-gray-600">{selectedMessage?.message}</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Destinataire</label>
              <Select value={forwardRecipient} onValueChange={setForwardRecipient}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un destinataire" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.name}>
                      {team.name} ({team.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Message (optionnel)</label>
              <Textarea
                value={forwardMessage}
                onChange={(e) => setForwardMessage(e.target.value)}
                placeholder="Ajoutez un message d'accompagnement..."
                className="min-h-[96px]"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowForwardModal(false)
                setSelectedMessage(null)
                setForwardRecipient('')
                setForwardMessage('')
              }}
              className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white"
            >
              Annuler
            </Button>
            <Button 
              onClick={handleForward}
              disabled={!forwardRecipient.trim() || isForwarding}
              className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white"
            >
              {isForwarding ? 'Transfert...' : 'Transférer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
