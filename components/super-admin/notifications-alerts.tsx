"use client"

import { useMemo, useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  Bell, AlertTriangle, CheckCircle, Settings, Users, ShoppingCart, MessageCircle, TrendingUp, Globe, Smartphone,
  Search, Filter, Download, Upload, Play, Pause, Volume2, Shield, 
  TrendingDown, Calendar, Clock, Mail, Phone, MapPin, 
  Heart, Share2, Bookmark, MoreHorizontal, Zap, Target, Eye, Trash2, Edit, Copy, Plus, PlayCircle, RefreshCw
} from 'lucide-react'
import { useNotifications } from '@/components/ui/modern-notification'
import { getClientAccessToken, supabase } from '@/lib/supabase'
import { useMoney } from '@/lib/hooks/use-money'

// Interfaces pour le systÃ¨me de notifications et alertes
interface Notification {
  id: string
  type: 'order' | 'user' | 'payment' | 'alert' | 'system' | 'marketing' | 'security'
  title: string
  message: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
  date: string
  recipient: string
  recipientType: 'user' | 'vendor' | 'admin' | 'all'
  channel: 'push' | 'email' | 'sms' | 'in-app'
  category: string
  tags: string[]
  metadata?: Record<string, any>
  readAt?: string
  deliveredAt?: string
}

interface EmailTemplate {
  id: string
  key: string
  name: string
  category: 'transactional' | 'marketing' | 'system'
  subject: string
  html: string | null
  text: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

interface Alert {
  id: string
  title: string
  description: string
  type: 'critical' | 'warning' | 'info' | 'success'
  category: 'stock' | 'payment' | 'security' | 'performance' | 'user' | 'system'
  active: boolean
  conditions: AlertCondition[]
  actions: AlertAction[]
  schedule: AlertSchedule
  recipients: string[]
  lastTriggered?: string
  triggerCount: number
}

interface SystemAlertItem {
  id: string
  type: 'info' | 'warning' | 'critical'
  title: string
  message: string
  priority: 'low' | 'medium' | 'high'
  status: 'active' | 'resolved' | 'ignored'
  created_at: string
  updated_at?: string
  action_required?: boolean
}

type NotificationJobChannel = 'email' | 'push'
type NotificationJobStatus = 'pending' | 'processing' | 'sent' | 'delivered' | 'failed'

interface NotificationJobItem {
  id: string
  channel: NotificationJobChannel
  status: NotificationJobStatus
  payload: any
  attempts: number
  last_error: string | null
  created_at: string
  updated_at: string
}

interface AlertCondition {
  id: string
  field: string
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'not_equals'
  value: string | number
  logicalOperator?: 'AND' | 'OR'
}

interface AlertAction {
  id: string
  type: 'notification' | 'email' | 'sms' | 'webhook' | 'system_action'
  config: Record<string, any>
  enabled: boolean
}

interface AlertSchedule {
  enabled: boolean
  timezone: string
  quietHours: {
    enabled: boolean
    start: string
    end: string
  }
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly'
  maxPerDay?: number
}

interface NotificationStats {
  totalSent: number
  totalDelivered: number
  totalRead: number
  deliveryRate: number
  readRate: number
  averageDeliveryTime: number
  channelBreakdown: Record<string, number>
  priorityBreakdown: Record<string, number>
  dailyTrends: Array<{ date: string; count: number }>
  monthlyGrowth: number
}

interface SiteEvent {
  id: string
  title: string
  description: string | null
  date: string
  time: string | null
  categoryKey: string
  categoryLabel: string | null
  categoryIcon: string | null
  discount: string | null
  status: 'upcoming' | 'announced' | 'completed' | 'cancelled'
  isActive: boolean
  createdAt: string | null
  updatedAt: string | null
}

export default function NotificationsAlerts() {
  // Hook pour les notifications modernes
  const { addNotification } = useNotifications()
  const { formatMoney, currencyCode } = useMoney()

  const [isCreatingNotification, setIsCreatingNotification] = useState(false)

  const [pushConfig, setPushConfig] = useState({
    enabled: true,
    criticalAlerts: true,
    newMessages: false
  })

  /**
   * Onglet actif du module Notifications & Alertes.
   */
  const [activeTab, setActiveTab] = useState('notifications')

  /**
   * Charge la configuration Push (persistÃ©e) lorsque l'onglet Push est ouvert.
   */
  useEffect(() => {
    if (activeTab !== 'push') return
    void loadPushConfig()
  }, [activeTab])

  /**
   * Toggle une option Push et persiste la configuration cÃ´tÃ© Super Admin.
   */
  const togglePushConfig = async (key: keyof typeof pushConfig) => {
    const previous = pushConfig
    const next = { ...pushConfig, [key]: !pushConfig[key] }
    setPushConfig(next)
    try {
      await savePushConfig(next)
      addNotification({
        type: 'success',
        title: 'Configuration Push',
        message: 'Configuration sauvegardÃ©e.'
      })
    } catch {
      setPushConfig(previous)
    }
  }

  /**
   * Retourne les headers d'authentification pour les routes /api/super-admin/*.
   */
  const getSuperAdminAuthHeaders = async () => {
    const cached = getClientAccessToken()
    if (cached) {
      return { authorization: `Bearer ${cached}` }
    }

    const { data, error } = await supabase.auth.getSession()
    if (error) {
      throw new Error(`Token Supabase manquant. (${error.message})`)
    }

    const token = data?.session?.access_token ?? null
    if (!token) {
      throw new Error('Token Supabase manquant. Veuillez vous reconnecter en super-admin.')
    }

    return { authorization: `Bearer ${token}` }
  }

  const loadPushConfig = async () => {
    try {
      const authHeaders = await getSuperAdminAuthHeaders()
      const res = await fetch('/api/super-admin/settings?scopes=global', {
        method: 'GET',
        cache: 'no-store',
        headers: { ...authHeaders }
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(String(json?.error ?? 'Chargement configuration push Ã©chouÃ©'))
      }

      const items = Array.isArray(json?.data) ? json.data : []
      const global = items.find((x: any) => x?.scope === 'global')
      const settings = (global?.settings && typeof global.settings === 'object') ? global.settings : {}
      const cfg = (settings as any)?.superAdminNotifications?.push
      if (!cfg || typeof cfg !== 'object') return

      setPushConfig((prev) => ({
        enabled: typeof (cfg as any).enabled === 'boolean' ? Boolean((cfg as any).enabled) : prev.enabled,
        criticalAlerts: typeof (cfg as any).criticalAlerts === 'boolean' ? Boolean((cfg as any).criticalAlerts) : prev.criticalAlerts,
        newMessages: typeof (cfg as any).newMessages === 'boolean' ? Boolean((cfg as any).newMessages) : prev.newMessages
      }))
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Configuration Push',
        message: error instanceof Error ? error.message : 'Erreur lors du chargement.'
      })
    }
  }

  const savePushConfig = async (next: typeof pushConfig) => {
    const authHeaders = await getSuperAdminAuthHeaders()

    const getRes = await fetch('/api/super-admin/settings?scopes=global', {
      method: 'GET',
      cache: 'no-store',
      headers: { ...authHeaders }
    })
    const getJson = await getRes.json().catch(() => null)
    if (!getRes.ok) {
      throw new Error(String(getJson?.error ?? 'Chargement rÃ©glages Ã©chouÃ©'))
    }

    const items = Array.isArray(getJson?.data) ? getJson.data : []
    const global = items.find((x: any) => x?.scope === 'global')
    const currentSettings = (global?.settings && typeof global.settings === 'object') ? global.settings : {}

    const merged = {
      ...(currentSettings as any),
      superAdminNotifications: {
        ...((currentSettings as any)?.superAdminNotifications ?? {}),
        push: { ...next }
      }
    }

    const putRes = await fetch('/api/super-admin/settings', {
      method: 'PUT',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ scope: 'global', settings: merged })
    })
    const putJson = await putRes.json().catch(() => null)
    if (!putRes.ok) {
      throw new Error(String(putJson?.error ?? 'Sauvegarde configuration push Ã©chouÃ©e'))
    }
  }

  const [clientAlerts, setClientAlerts] = useState<
    Array<{
      id: string
      phone: string
      email: string | null
      categoryIds: string[]
      preferences: any
      isActive: boolean
      sourcePage: string | null
      createdAt: string | null
    }>
  >([])
  const [clientAlertsCount, setClientAlertsCount] = useState(0)
  const [clientAlertsQuery, setClientAlertsQuery] = useState('')
  const [clientAlertsPage, setClientAlertsPage] = useState(1)
  const [isLoadingClientAlerts, setIsLoadingClientAlerts] = useState(false)

  const [siteEvents, setSiteEvents] = useState<SiteEvent[]>([])
  const [siteEventsCount, setSiteEventsCount] = useState(0)
  const [siteEventsQuery, setSiteEventsQuery] = useState('')
  const [siteEventsPage, setSiteEventsPage] = useState(1)
  const [isLoadingSiteEvents, setIsLoadingSiteEvents] = useState(false)
  const [showSiteEventModal, setShowSiteEventModal] = useState(false)
  const [editingSiteEvent, setEditingSiteEvent] = useState<SiteEvent | null>(null)
  const [siteEventForm, setSiteEventForm] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    categoryKey: 'tech',
    categoryLabel: '',
    categoryIcon: '',
    discount: '',
    status: 'upcoming' as SiteEvent['status'],
    isActive: true
  })
  
  // Ã‰tats pour la gestion des notifications
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [stats, setStats] = useState<NotificationStats>({
    totalSent: 0,
    totalDelivered: 0,
    totalRead: 0,
    deliveryRate: 0,
    readRate: 0,
    averageDeliveryTime: 0,
    channelBreakdown: {
      push: 0,
      email: 0,
      sms: 0,
      'in-app': 0
    },
    priorityBreakdown: {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    },
    dailyTrends: [],
    monthlyGrowth: 0
  })

  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false)

  const [systemAlerts, setSystemAlerts] = useState<SystemAlertItem[]>([])
  const [isLoadingSystemAlerts, setIsLoadingSystemAlerts] = useState(false)

  const [notificationJobs, setNotificationJobs] = useState<NotificationJobItem[]>([])
  const [isLoadingNotificationJobs, setIsLoadingNotificationJobs] = useState(false)

  const [editNotificationId, setEditNotificationId] = useState<string | null>(null)

  const [isAutoProcessingQueue, setIsAutoProcessingQueue] = useState(false)
  const isProcessingQueueRef = useRef(false)

  const [pushStats, setPushStats] = useState({
    total: 0,
    deliveredRate: 0,
    averageDeliveryMinutes: 0
  })

  const [createNotificationForm, setCreateNotificationForm] = useState({
    title: 'Nouvelle Notification',
    type: 'system',
    priority: 'medium',
    channel: 'in-app',
    message: 'Contenu de la nouvelle notification',
    recipientEmail: 'admin@probooster.com',
    actionUrl: ''
  })

  // Ã‰tats pour les filtres et recherche
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [channelFilter, setChannelFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')

  // Ã‰tats pour les modals
  const [showNotificationModal, setShowNotificationModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showCreateNotificationModal, setShowCreateNotificationModal] = useState(false)
  const [showGlobalConfigModal, setShowGlobalConfigModal] = useState(false)
  const [showEditEmailModal, setShowEditEmailModal] = useState(false)
  const [showEditEmailMarketingModal, setShowEditEmailMarketingModal] = useState(false)
  const [showActionConfigModal, setShowActionConfigModal] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [selectedEmail, setSelectedEmail] = useState<any>(null)
  const [selectedEmailMarketing, setSelectedEmailMarketing] = useState<any>(null)
  const [selectedAction, setSelectedAction] = useState<AlertAction | null>(null)

  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([])
  const [emailTemplatesCount, setEmailTemplatesCount] = useState(0)
  const [isLoadingEmailTemplates, setIsLoadingEmailTemplates] = useState(false)
  const [emailTemplatesQuery, setEmailTemplatesQuery] = useState('')
  const [emailTemplatesCategory, setEmailTemplatesCategory] = useState<'all' | EmailTemplate['category']>('all')
  const [showEmailTemplateModal, setShowEmailTemplateModal] = useState(false)
  const [editingEmailTemplate, setEditingEmailTemplate] = useState<EmailTemplate | null>(null)
  const [emailTemplateForm, setEmailTemplateForm] = useState({
    key: '',
    name: '',
    category: 'transactional' as EmailTemplate['category'],
    subject: '',
    html: '',
    text: '',
    isActive: true
  })

  const [globalNotificationsConfig, setGlobalNotificationsConfig] = useState({
    realtimeEnabled: true,
    quietHoursEnabled: false,
    dailyLimitEnabled: true,
    maxNotificationsPerDay: 50,
    timezone: 'Europe/Paris',
    integrations: {
      webPush: true,
      mobilePush: true,
      sms: false,
      email: true,
      inApp: true
    }
  })
  const [isLoadingGlobalNotificationsConfig, setIsLoadingGlobalNotificationsConfig] = useState(false)
  const [isSavingGlobalNotificationsConfig, setIsSavingGlobalNotificationsConfig] = useState(false)

  const [globalChannelsEnabled, setGlobalChannelsEnabled] = useState({
    inApp: true,
    email: true,
    push: true
  })
  const [isLoadingGlobalChannelsEnabled, setIsLoadingGlobalChannelsEnabled] = useState(false)

  // Ã‰tats pour la pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [notificationsPerPage] = useState(10)

  // Chargement des donnÃ©es au montage
  useEffect(() => {
    void loadNotifications()
    void loadNotificationStats()
  }, [])

  useEffect(() => {
    if (activeTab === 'alertes-clients') {
      void loadClientAlerts(clientAlertsPage, clientAlertsQuery)
    }
    if (activeTab === 'alertes') {
      void loadSystemAlerts()
    }
    if (activeTab === 'queue' || activeTab === 'push') {
      void loadNotificationJobs()
    }
    if (activeTab === 'evenements') {
      void loadSiteEvents(siteEventsPage, siteEventsQuery)
    }
    if (activeTab === 'email') {
      void loadEmailTemplates()
    }
  }, [activeTab])

  /**
   * Charge la configuration globale des notifications (scope global) depuis la DB.
   */
  const loadGlobalNotificationsConfig = async () => {
    setIsLoadingGlobalNotificationsConfig(true)
    try {
      const authHeaders = await getSuperAdminAuthHeaders()
      const res = await fetch('/api/super-admin/settings?scopes=global', {
        method: 'GET',
        cache: 'no-store',
        headers: { ...authHeaders }
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(String(json?.error ?? 'Chargement configuration globale Ã©chouÃ©'))
      }

      const items = Array.isArray(json?.data) ? json.data : []
      const global = items.find((x: any) => x?.scope === 'global')
      const settings = (global?.settings && typeof global.settings === 'object') ? global.settings : {}
      const cfg = (settings as any)?.superAdminNotifications?.globalNotifications
      if (!cfg || typeof cfg !== 'object') return

      setGlobalNotificationsConfig((prev) => ({
        realtimeEnabled: typeof (cfg as any).realtimeEnabled === 'boolean' ? Boolean((cfg as any).realtimeEnabled) : prev.realtimeEnabled,
        quietHoursEnabled: typeof (cfg as any).quietHoursEnabled === 'boolean' ? Boolean((cfg as any).quietHoursEnabled) : prev.quietHoursEnabled,
        dailyLimitEnabled: typeof (cfg as any).dailyLimitEnabled === 'boolean' ? Boolean((cfg as any).dailyLimitEnabled) : prev.dailyLimitEnabled,
        maxNotificationsPerDay: Number((cfg as any).maxNotificationsPerDay ?? prev.maxNotificationsPerDay) || prev.maxNotificationsPerDay,
        timezone: typeof (cfg as any).timezone === 'string' && (cfg as any).timezone.trim() ? String((cfg as any).timezone).trim() : prev.timezone,
        integrations: {
          webPush: typeof (cfg as any)?.integrations?.webPush === 'boolean' ? Boolean((cfg as any).integrations.webPush) : prev.integrations.webPush,
          mobilePush: typeof (cfg as any)?.integrations?.mobilePush === 'boolean' ? Boolean((cfg as any).integrations.mobilePush) : prev.integrations.mobilePush,
          sms: typeof (cfg as any)?.integrations?.sms === 'boolean' ? Boolean((cfg as any).integrations.sms) : prev.integrations.sms,
          email: typeof (cfg as any)?.integrations?.email === 'boolean' ? Boolean((cfg as any).integrations.email) : prev.integrations.email,
          inApp: typeof (cfg as any)?.integrations?.inApp === 'boolean' ? Boolean((cfg as any).integrations.inApp) : prev.integrations.inApp
        }
      }))
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Configuration globale',
        message: error instanceof Error ? error.message : 'Erreur lors du chargement.'
      })
    } finally {
      setIsLoadingGlobalNotificationsConfig(false)
    }
  }

  /**
   * Sauvegarde la configuration globale des notifications (scope global) en DB.
   */
  const saveGlobalNotificationsConfig = async () => {
    if (isSavingGlobalNotificationsConfig) return
    setIsSavingGlobalNotificationsConfig(true)
    try {
      const authHeaders = await getSuperAdminAuthHeaders()

      const getRes = await fetch('/api/super-admin/settings?scopes=global', {
        method: 'GET',
        cache: 'no-store',
        headers: { ...authHeaders }
      })
      const getJson = await getRes.json().catch(() => null)
      if (!getRes.ok) {
        throw new Error(String(getJson?.error ?? 'Chargement rÃ©glages Ã©chouÃ©'))
      }

      const items = Array.isArray(getJson?.data) ? getJson.data : []
      const global = items.find((x: any) => x?.scope === 'global')
      const currentSettings = (global?.settings && typeof global.settings === 'object') ? global.settings : {}

      const merged = {
        ...(currentSettings as any),
        superAdminNotifications: {
          ...((currentSettings as any)?.superAdminNotifications ?? {}),
          globalNotifications: {
            ...globalNotificationsConfig,
            maxNotificationsPerDay: Number(globalNotificationsConfig.maxNotificationsPerDay ?? 50) || 50,
            timezone: String(globalNotificationsConfig.timezone ?? 'Europe/Paris')
          }
        }
      }

      const putRes = await fetch('/api/super-admin/settings', {
        method: 'PUT',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ scope: 'global', settings: merged })
      })
      const putJson = await putRes.json().catch(() => null)
      if (!putRes.ok) {
        throw new Error(String(putJson?.error ?? 'Sauvegarde Ã©chouÃ©e'))
      }

      addNotification({
        type: 'success',
        title: 'Configuration sauvegardÃ©e',
        message: 'La configuration globale a Ã©tÃ© sauvegardÃ©e avec succÃ¨s'
      })
      setShowGlobalConfigModal(false)
      void loadGlobalNotificationsConfig()
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Sauvegarde impossible',
        message: error instanceof Error ? error.message : 'Erreur inconnue.'
      })
    } finally {
      setIsSavingGlobalNotificationsConfig(false)
    }
  }

  useEffect(() => {
    if (!showGlobalConfigModal) return
    void loadGlobalNotificationsConfig()
    void loadEmailTemplates()
  }, [showGlobalConfigModal])

  /**
   * Charge les flags d'activation des canaux (In-App/Email/Push) depuis la config globale.
   */
  const loadGlobalChannelsEnabled = async () => {
    setIsLoadingGlobalChannelsEnabled(true)
    try {
      const authHeaders = await getSuperAdminAuthHeaders()
      const res = await fetch('/api/super-admin/settings?scopes=global', {
        method: 'GET',
        cache: 'no-store',
        headers: { ...authHeaders }
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(String(json?.error ?? 'Chargement rÃ©glages Ã©chouÃ©'))
      }

      const items = Array.isArray(json?.data) ? json.data : []
      const global = items.find((x: any) => x?.scope === 'global')
      const settings = (global?.settings && typeof global.settings === 'object') ? global.settings : {}
      const integrations = (settings as any)?.superAdminNotifications?.globalNotifications?.integrations

      setGlobalChannelsEnabled({
        inApp: typeof integrations?.inApp === 'boolean' ? Boolean(integrations.inApp) : true,
        email: typeof integrations?.email === 'boolean' ? Boolean(integrations.email) : true,
        push: typeof integrations?.push === 'boolean' ? Boolean(integrations.push) : true
      })
    } catch {
      setGlobalChannelsEnabled({ inApp: true, email: true, push: true })
    } finally {
      setIsLoadingGlobalChannelsEnabled(false)
    }
  }

  useEffect(() => {
    if (!showCreateNotificationModal) return
    void loadGlobalChannelsEnabled()
  }, [showCreateNotificationModal])

  useEffect(() => {
    if (!showCreateNotificationModal) return
    const current = String(createNotificationForm.channel ?? 'in-app')
    const enabledMap: Record<string, boolean> = {
      'in-app': globalChannelsEnabled.inApp,
      email: globalChannelsEnabled.email,
      push: globalChannelsEnabled.push
    }
    if (enabledMap[current] === false) {
      const next = (['in-app', 'email', 'push'] as const).find((ch) => enabledMap[ch] !== false) ?? 'in-app'
      setCreateNotificationForm((prev) => ({ ...prev, channel: next }))
    }
  }, [showCreateNotificationModal, globalChannelsEnabled, createNotificationForm.channel])

  /**
   * Ouvre un template email (Ã©dition si existant, crÃ©ation sinon) depuis le modal global.
   */
  const openGlobalEmailTemplate = (tpl: { key: string; name: string; category: EmailTemplate['category'] }) => {
    const existing = emailTemplates.find((t) => String(t?.key ?? '') === tpl.key) ?? null
    if (existing) {
      openEditEmailTemplate(existing)
      return
    }

    setEditingEmailTemplate(null)
    setEmailTemplateForm({
      key: tpl.key,
      name: tpl.name,
      category: tpl.category,
      subject: '',
      html: '',
      text: '',
      isActive: true
    })
    setShowEmailTemplateModal(true)
  }

  /**
   * Charge les templates email depuis la table `email_templates`.
   */
  const loadEmailTemplates = async () => {
    setIsLoadingEmailTemplates(true)
    try {
      const authHeaders = await getSuperAdminAuthHeaders()
      const params = new URLSearchParams()
      params.set('limit', '100')
      params.set('offset', '0')
      if (emailTemplatesQuery.trim()) params.set('q', emailTemplatesQuery.trim())
      if (emailTemplatesCategory !== 'all') params.set('category', emailTemplatesCategory)

      const res = await fetch(`/api/super-admin/email-templates?${params.toString()}`, {
        method: 'GET',
        cache: 'no-store',
        headers: authHeaders
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(String(json?.error ?? 'Erreur lors du chargement des templates email'))
      }

      const items = Array.isArray(json?.data?.items) ? json.data.items : []
      setEmailTemplates(items as EmailTemplate[])
      setEmailTemplatesCount(Number(json?.data?.count ?? items.length))
    } catch (error) {
      setEmailTemplates([])
      setEmailTemplatesCount(0)
      addNotification({
        type: 'error',
        title: 'Chargement impossible',
        message: error instanceof Error ? error.message : 'Erreur inconnue.'
      })
    } finally {
      setIsLoadingEmailTemplates(false)
    }
  }

  /**
   * Ouvre le modal de crÃ©ation d'un template email.
   */
  const openCreateEmailTemplate = () => {
    setEditingEmailTemplate(null)
    setEmailTemplateForm({
      key: '',
      name: '',
      category: 'transactional',
      subject: '',
      html: '',
      text: '',
      isActive: true
    })
    setShowEmailTemplateModal(true)
  }

  /**
   * Ouvre le modal d'Ã©dition d'un template email.
   */
  const openEditEmailTemplate = (tpl: EmailTemplate) => {
    setEditingEmailTemplate(tpl)
    setEmailTemplateForm({
      key: tpl.key,
      name: tpl.name,
      category: tpl.category,
      subject: tpl.subject,
      html: tpl.html ?? '',
      text: tpl.text ?? '',
      isActive: tpl.is_active
    })
    setShowEmailTemplateModal(true)
  }

  /**
   * CrÃ©e ou met Ã  jour un template email.
   */
  const saveEmailTemplate = async () => {
    try {
      const authHeaders = await getSuperAdminAuthHeaders()
      const payload = {
        key: emailTemplateForm.key.trim(),
        name: emailTemplateForm.name.trim(),
        category: emailTemplateForm.category,
        subject: emailTemplateForm.subject.trim(),
        html: emailTemplateForm.html ? emailTemplateForm.html : null,
        text: emailTemplateForm.text ? emailTemplateForm.text : null,
        isActive: emailTemplateForm.isActive
      }

      if (!payload.key || !payload.name || !payload.subject) {
        throw new Error('Champs requis: key, nom et sujet.')
      }

      const res = await fetch('/api/super-admin/email-templates', {
        method: editingEmailTemplate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(editingEmailTemplate ? { id: editingEmailTemplate.id, ...payload } : payload)
      })

      const json = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(String(json?.error ?? 'Sauvegarde impossible'))
      }

      addNotification({
        type: 'success',
        title: 'Template sauvegardÃ©',
        message: 'Le template email a Ã©tÃ© sauvegardÃ©.'
      })
      setShowEmailTemplateModal(false)
      setEditingEmailTemplate(null)
      void loadEmailTemplates()
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Sauvegarde impossible',
        message: error instanceof Error ? error.message : 'Erreur inconnue.'
      })
    }
  }

  /**
   * Supprime un template email.
   */
  const deleteEmailTemplate = async (tpl: EmailTemplate) => {
    try {
      if (!window.confirm(`Supprimer le template "${tpl.name}" ?`)) return

      const authHeaders = await getSuperAdminAuthHeaders()
      const res = await fetch(`/api/super-admin/email-templates?id=${encodeURIComponent(tpl.id)}`, {
        method: 'DELETE',
        headers: authHeaders
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(String(json?.error ?? 'Suppression impossible'))
      }

      addNotification({
        type: 'success',
        title: 'Template supprimÃ©',
        message: 'Le template email a Ã©tÃ© supprimÃ©.'
      })
      void loadEmailTemplates()
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Suppression impossible',
        message: error instanceof Error ? error.message : 'Erreur inconnue.'
      })
    }
  }

  /**
   * Charge les jobs multi-canaux (email/push) depuis la table `notification_jobs`.
   */
  const loadNotificationJobs = async () => {
    setIsLoadingNotificationJobs(true)
    try {
      const authHeaders = await getSuperAdminAuthHeaders()
      const res = await fetch('/api/super-admin/notification-jobs?limit=100&offset=0&status=all&channel=all', {
        method: 'GET',
        cache: 'no-store',
        headers: authHeaders
      })

      const json = await res.json().catch(() => null)
      if (!res.ok) {
        const raw = String(json?.error ?? 'Erreur lors du chargement de la file de jobs')
        const lower = raw.toLowerCase()
        if (lower.includes('schema cache') || lower.includes('notification_jobs')) {
          throw new Error(
            "La table 'notification_jobs' est introuvable (schema cache). VÃ©rifie que tu as bien exÃ©cutÃ© le SQL de crÃ©ation dans le bon projet Supabase, attends 30-60s, puis clique sur Actualiser."
          )
        }
        throw new Error(raw)
      }

      const items = Array.isArray(json?.data?.items) ? json.data.items : []
      setNotificationJobs(items as NotificationJobItem[])
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erreur inconnue.'
      // Message explicite dÃ©jÃ  remontÃ© via toast.
      setNotificationJobs([])
      addNotification({
        type: 'error',
        title: 'Chargement impossible',
        message: msg
      })
    } finally {
      setIsLoadingNotificationJobs(false)
    }
  }

  /**
   * Relance un job en le remettant en statut pending.
   */
  const retryNotificationJob = async (jobId: string) => {
    try {
      const authHeaders = await getSuperAdminAuthHeaders()
      const res = await fetch('/api/super-admin/notification-jobs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ id: jobId })
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(String(json?.error ?? 'Retry impossible'))
      }

      addNotification({
        type: 'success',
        title: 'Job relancÃ©',
        message: 'Le job a Ã©tÃ© remis en attente (pending).'
      })
      void loadNotificationJobs()
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Retry impossible',
        message: error instanceof Error ? error.message : 'Erreur inconnue.'
      })
    }
  }

  /**
   * Supprime un job.
   */
  const deleteNotificationJob = async (jobId: string) => {
    try {
      const authHeaders = await getSuperAdminAuthHeaders()
      const res = await fetch(`/api/super-admin/notification-jobs?id=${encodeURIComponent(jobId)}`, {
        method: 'DELETE',
        headers: { ...authHeaders }
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(String(json?.error ?? 'Suppression impossible'))
      }
      setNotificationJobs((prev) => prev.filter((j) => j.id !== jobId))
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Suppression impossible',
        message: error instanceof Error ? error.message : 'Erreur inconnue.'
      })
    }
  }

  /**
   * DÃ©clenche le traitement cÃ´tÃ© serveur (SMTP/OneSignal) des jobs pending.
   */
  const processNotificationQueue = async () => {
    try {
      if (isProcessingQueueRef.current) return
      isProcessingQueueRef.current = true

      const authHeaders = await getSuperAdminAuthHeaders()
      const res = await fetch('/api/super-admin/notifications/process', {
        method: 'POST',
        headers: { ...authHeaders }
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(String(json?.error ?? 'Traitement impossible'))
      }

      addNotification({
        type: 'success',
        title: 'Traitement lancÃ©',
        message: `Jobs traitÃ©s: ${String(json?.processed ?? 0)} | envoyÃ©s: ${String(json?.sent ?? 0)} | Ã©checs: ${String(json?.failed ?? 0)}`
      })
      void loadNotificationJobs()
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Traitement impossible',
        message: error instanceof Error ? error.message : 'Erreur inconnue.'
      })
    } finally {
      isProcessingQueueRef.current = false
    }
  }

  useEffect(() => {
    if (!isAutoProcessingQueue) return

    const interval = window.setInterval(() => {
      void processNotificationQueue()
    }, 15000)

    return () => {
      window.clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAutoProcessingQueue])

  const loadSystemAlerts = async () => {
    setIsLoadingSystemAlerts(true)
    try {
      const authHeaders = await getSuperAdminAuthHeaders()
      const res = await fetch('/api/super-admin/system-alerts?limit=200', {
        method: 'GET',
        cache: 'no-store',
        headers: authHeaders
      })

      const json = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(String(json?.error ?? 'Erreur lors du chargement des alertes systÃ¨me'))
      }

      const rows = Array.isArray(json?.data) ? json.data : []
      const mapped: SystemAlertItem[] = rows
        .map((row: any) => {
          const id = String(row?.id ?? '')
          if (!id) return null

          const rawStatus = String(row?.status ?? 'active').toLowerCase()
          const normalizedStatus = (rawStatus === 'ignored' ? 'resolved' : rawStatus) as SystemAlertItem['status']

          return {
            id,
            type: (row?.type ?? 'info') as SystemAlertItem['type'],
            title: String(row?.title ?? ''),
            message: String(row?.message ?? ''),
            priority: (row?.priority ?? 'low') as SystemAlertItem['priority'],
            status: normalizedStatus,
            created_at: String(row?.created_at ?? row?.createdAt ?? new Date().toISOString()),
            updated_at: row?.updated_at ? String(row.updated_at) : undefined,
            action_required: Boolean(row?.action_required)
          }
        })
        .filter(Boolean) as SystemAlertItem[]

      setSystemAlerts(mapped)
    } catch (error) {
      console.error('Erreur chargement alertes systÃ¨me:', error)
      setSystemAlerts([])
      addNotification({
        type: 'error',
        title: 'Chargement impossible',
        message: error instanceof Error ? error.message : 'Erreur inconnue.'
      })
    } finally {
      setIsLoadingSystemAlerts(false)
    }
  }

  const resolveSystemAlert = async (alertId: string) => {
    try {
      const authHeaders = await getSuperAdminAuthHeaders()
      const res = await fetch('/api/super-admin/system-alerts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ id: alertId, status: 'resolved' })
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(String(json?.error ?? 'RÃ©solution impossible'))
      }
      setSystemAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, status: 'resolved' } : a)))
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Action impossible',
        message: error instanceof Error ? error.message : 'Erreur inconnue.'
      })
    }
  }

  const escalateSystemAlert = async (alertId: string) => {
    try {
      const authHeaders = await getSuperAdminAuthHeaders()
      const res = await fetch('/api/super-admin/system-alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ id: alertId, action: 'escalate' })
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(String(json?.error ?? 'Escalade impossible'))
      }
      addNotification({
        type: 'success',
        title: 'Alerte escaladÃ©e',
        message: "L'alerte a Ã©tÃ© escaladÃ©e." 
      })
      void loadSystemAlerts()
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Action impossible',
        message: error instanceof Error ? error.message : 'Erreur inconnue.'
      })
    }
  }

  const deleteSystemAlert = async (alertId: string) => {
    try {
      const authHeaders = await getSuperAdminAuthHeaders()
      const res = await fetch(`/api/super-admin/system-alerts?id=${encodeURIComponent(alertId)}`, {
        method: 'DELETE',
        headers: { ...authHeaders }
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(String(json?.error ?? 'Suppression impossible'))
      }
      setSystemAlerts((prev) => prev.filter((a) => a.id !== alertId))
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Suppression impossible',
        message: error instanceof Error ? error.message : 'Erreur inconnue.'
      })
    }
  }

  useEffect(() => {
    void loadNotifications()
  }, [searchTerm, priorityFilter, statusFilter])

  const mapApiPriorityToUi = (value: any): Notification['priority'] => {
    const raw = String(value ?? '').toLowerCase()
    if (raw === 'low') return 'low'
    if (raw === 'high') return 'high'
    if (raw === 'critical') return 'critical'
    return 'medium'
  }

  const mapApiStatusToUi = (value: any): Notification['status'] => {
    const raw = String(value ?? '').toLowerCase()
    if (raw === 'pending') return 'pending'
    if (raw === 'sent') return 'sent'
    if (raw === 'failed') return 'failed'
    if (raw === 'read') return 'read'
    return 'delivered'
  }

  const mapUserRoleToRecipientType = (value: any): Notification['recipientType'] => {
    const raw = String(value ?? '').toLowerCase()
    if (raw === 'vendor') return 'vendor'
    if (raw === 'admin' || raw === 'super_admin' || raw === 'ops') return 'admin'
    return 'user'
  }

  const loadNotifications = async () => {
    setIsLoadingNotifications(true)
    try {
      const limit = 200
      const q = encodeURIComponent(searchTerm ?? '')
      const priority = encodeURIComponent(priorityFilter ?? 'all')
      const status = encodeURIComponent(statusFilter === 'read' || statusFilter === 'unread' ? statusFilter : 'all')

      const url = `/api/super-admin/notifications?limit=${limit}&offset=0&q=${q}&priority=${priority}&status=${status}`
      const authHeaders = await getSuperAdminAuthHeaders()
      const res = await fetch(url, { method: 'GET', cache: 'no-store', headers: authHeaders })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(String(json?.error ?? 'Erreur lors du chargement des notifications'))
      }

      const items = Array.isArray(json?.data?.items) ? json.data.items : []
      const mapped: Notification[] = items
        .map((row: any) => {
          const id = String(row?.id ?? '')
          if (!id) return null

          const userName = row?.userName ?? row?.user_name ?? null
          const userEmail = row?.userEmail ?? row?.user_email
          const userId = row?.userId ?? row?.user_id

          const type = String(row?.type ?? 'system') as Notification['type']
          const priority = mapApiPriorityToUi(row?.priority)
          const status = mapApiStatusToUi(row?.status)
          const createdAt = String(row?.createdAt ?? row?.created_at ?? new Date().toISOString())

          return {
            id,
            type,
            title: String(row?.title ?? ''),
            message: String(row?.message ?? ''),
            priority,
            status,
            date: createdAt,
            recipient: String(userName ?? userEmail ?? userId ?? ''),
            recipientType: mapUserRoleToRecipientType(row?.userRole ?? row?.user_role),
            channel: 'in-app',
            category: String(row?.type ?? 'SystÃ¨me'),
            tags: [],
            metadata: {
              actionUrl: row?.actionUrl ?? row?.action_url ?? null,
              userId: userId ?? null
            },
            readAt: row?.readAt ?? null,
            deliveredAt: row?.deliveredAt ?? null
          }
        })
        .filter(Boolean) as Notification[]

      setNotifications(mapped)
    } catch (error) {
      console.error('Erreur chargement notifications:', error)
      setNotifications([])
      addNotification({
        type: 'error',
        title: 'Chargement impossible',
        message: error instanceof Error ? error.message : 'Erreur inconnue.'
      })
    } finally {
      setIsLoadingNotifications(false)
    }
  }

  const loadNotificationStats = async () => {
    try {
      const authHeaders = await getSuperAdminAuthHeaders()
      const res = await fetch('/api/super-admin/notifications/stats?days=14', {
        method: 'GET',
        cache: 'no-store',
        headers: authHeaders
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(String(json?.error ?? 'Erreur lors du chargement des statistiques'))
      }

      const data = json?.data ?? null
      if (!data) return

      setStats((prev) => ({
        ...prev,
        totalSent: Number(data.totalSent ?? 0) || 0,
        totalDelivered: Number(data.totalDelivered ?? 0) || 0,
        totalRead: Number(data.totalRead ?? 0) || 0,
        deliveryRate: Number(data.deliveryRate ?? 0) || 0,
        readRate: Number(data.readRate ?? 0) || 0,
        averageDeliveryTime: Number(data.averageDeliveryTime ?? 0) || 0,
        channelBreakdown: data.channelBreakdown ?? prev.channelBreakdown,
        priorityBreakdown: data.priorityBreakdown ?? prev.priorityBreakdown,
        dailyTrends: Array.isArray(data.dailyTrends) ? data.dailyTrends : [],
        monthlyGrowth: Number(data.monthlyGrowth ?? 0) || 0
      }))
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Stats indisponibles',
        message: error instanceof Error ? error.message : 'Erreur inconnue.'
      })
    }
  }

  const loadSiteEvents = async (page: number, q: string) => {
    const limit = 25
    const offset = Math.max(0, (page - 1) * limit)

    setIsLoadingSiteEvents(true)
    try {
      const url = `/api/super-admin/site-events?limit=${limit}&offset=${offset}&q=${encodeURIComponent(q ?? '')}`
      const authHeaders = await getSuperAdminAuthHeaders()
      const res = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
        headers: authHeaders
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(String(json?.error ?? 'Erreur lors du chargement'))
      }

      const items = Array.isArray(json?.data?.items) ? json.data.items : []
      const count = Number(json?.data?.count ?? items.length) || 0

      setSiteEvents(
        items.map((row: any) => ({
          id: String(row?.id ?? ''),
          title: String(row?.title ?? ''),
          description: row?.description === null || row?.description === undefined ? null : String(row.description),
          date: String(row?.date ?? ''),
          time: row?.time === null || row?.time === undefined ? null : String(row.time),
          categoryKey: String(row?.categoryKey ?? ''),
          categoryLabel: row?.categoryLabel === null || row?.categoryLabel === undefined ? null : String(row.categoryLabel),
          categoryIcon: row?.categoryIcon === null || row?.categoryIcon === undefined ? null : String(row.categoryIcon),
          discount: row?.discount === null || row?.discount === undefined ? null : String(row.discount),
          status: (row?.status ?? 'upcoming') as SiteEvent['status'],
          isActive: Boolean(row?.isActive),
          createdAt: row?.createdAt ? String(row.createdAt) : null,
          updatedAt: row?.updatedAt ? String(row.updatedAt) : null
        }))
      )
      setSiteEventsCount(count)
    } catch (error) {
      console.error('Erreur chargement Ã©vÃ©nements:', error)
      setSiteEvents([])
      setSiteEventsCount(0)
    } finally {
      setIsLoadingSiteEvents(false)
    }
  }

  const openCreateSiteEvent = () => {
    setEditingSiteEvent(null)
    setSiteEventForm({
      title: '',
      description: '',
      date: '',
      time: '',
      categoryKey: 'tech',
      categoryLabel: '',
      categoryIcon: '',
      discount: '',
      status: 'upcoming',
      isActive: true
    })
    setShowSiteEventModal(true)
  }

  const openEditSiteEvent = (ev: SiteEvent) => {
    setEditingSiteEvent(ev)
    setSiteEventForm({
      title: ev.title ?? '',
      description: ev.description ?? '',
      date: ev.date ?? '',
      time: ev.time ?? '',
      categoryKey: ev.categoryKey ?? 'tech',
      categoryLabel: ev.categoryLabel ?? '',
      categoryIcon: ev.categoryIcon ?? '',
      discount: ev.discount ?? '',
      status: ev.status,
      isActive: ev.isActive
    })
    setShowSiteEventModal(true)
  }

  const saveSiteEvent = async () => {
    try {
      const payload = {
        id: editingSiteEvent?.id,
        title: siteEventForm.title,
        description: siteEventForm.description ? siteEventForm.description : null,
        date: siteEventForm.date,
        time: siteEventForm.time ? siteEventForm.time : null,
        categoryKey: siteEventForm.categoryKey,
        categoryLabel: siteEventForm.categoryLabel ? siteEventForm.categoryLabel : null,
        categoryIcon: siteEventForm.categoryIcon ? siteEventForm.categoryIcon : null,
        discount: siteEventForm.discount ? siteEventForm.discount : null,
        status: siteEventForm.status,
        isActive: siteEventForm.isActive
      }

      const authHeaders = await getSuperAdminAuthHeaders()
      const res = await fetch('/api/super-admin/site-events', {
        method: editingSiteEvent ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(payload)
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(String(json?.error ?? 'Erreur lors de la sauvegarde'))
      }

      addNotification({
        type: 'success',
        title: editingSiteEvent ? 'Ã‰vÃ©nement mis Ã  jour' : 'Ã‰vÃ©nement crÃ©Ã©',
        message: "L'Ã©vÃ©nement a Ã©tÃ© sauvegardÃ©." 
      })
      setShowSiteEventModal(false)
      void loadSiteEvents(siteEventsPage, siteEventsQuery)
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Sauvegarde impossible',
        message: error instanceof Error ? error.message : 'Erreur inconnue.'
      })
    }
  }

  const deleteSiteEvent = async (id: string) => {
    try {
      const authHeaders = await getSuperAdminAuthHeaders()
      const res = await fetch(`/api/super-admin/site-events?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          ...authHeaders
        }
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(String(json?.error ?? 'Suppression Ã©chouÃ©e'))
      }

      addNotification({
        type: 'success',
        title: 'Ã‰vÃ©nement supprimÃ©',
        message: "L'Ã©vÃ©nement a Ã©tÃ© supprimÃ©." 
      })
      void loadSiteEvents(siteEventsPage, siteEventsQuery)
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Suppression impossible',
        message: error instanceof Error ? error.message : 'Erreur inconnue.'
      })
    }
  }

  /**
   * Charge les alertes clients (inscriptions WhatsApp/email/sms/push) depuis l'API super-admin.
   */
  const loadClientAlerts = async (page: number, q: string) => {
    const limit = 25
    const offset = Math.max(0, (page - 1) * limit)

    setIsLoadingClientAlerts(true)
    try {
      const url = `/api/super-admin/client-alert-subscriptions?limit=${limit}&offset=${offset}&q=${encodeURIComponent(q ?? '')}`
      const authHeaders = await getSuperAdminAuthHeaders()
      const res = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          ...authHeaders
        }
      })
      const json = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(String(json?.error ?? 'AccÃ¨s refusÃ© ou erreur serveur (alertes clients).'))
      }

      const items = Array.isArray(json?.data?.items) ? json.data.items : []
      const count = Number(json?.data?.count ?? items.length) || 0

      setClientAlerts(
        items.map((row: any) => ({
          id: String(row?.id ?? ''),
          phone: String(row?.phone ?? ''),
          email: row?.email === null || row?.email === undefined ? null : String(row.email),
          categoryIds: Array.isArray(row?.categoryIds) ? row.categoryIds.map((x: any) => String(x)) : [],
          preferences: row?.preferences ?? null,
          isActive: Boolean(row?.isActive),
          sourcePage: row?.sourcePage ? String(row.sourcePage) : null,
          createdAt: row?.createdAt ? String(row.createdAt) : null
        }))
      )
      setClientAlertsCount(count)
    } catch (error) {
      console.error('Erreur chargement alertes clients:', error)
      setClientAlerts([])
      setClientAlertsCount(0)

      addNotification({
        type: 'error',
        title: 'Chargement impossible',
        message: error instanceof Error ? error.message : 'Erreur inconnue.'
      })
    } finally {
      setIsLoadingClientAlerts(false)
    }
  }

  /**
   * Export CSV des alertes clients.
   */
  const exportClientAlertsCsv = async () => {
    try {
      const url = `/api/super-admin/client-alert-subscriptions?format=csv&q=${encodeURIComponent(clientAlertsQuery)}`
      const authHeaders = await getSuperAdminAuthHeaders()
      const res = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          ...authHeaders
        }
      })
      const csv = await res.text()

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
      const href = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = href
      a.download = 'alertes-clients.csv'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(href)

      addNotification({
        type: 'success',
        title: 'Export prÃªt',
        message: 'Le fichier CSV a Ã©tÃ© tÃ©lÃ©chargÃ©.'
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Export impossible',
        message: error instanceof Error ? error.message : 'Impossible de gÃ©nÃ©rer le CSV pour le moment.'
      })
    }
  }

  // Fonctions utilitaires
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60)
      return `Il y a ${diffInMinutes} min`
    } else if (diffInHours < 24) {
      return `Il y a ${Math.floor(diffInHours)}h`
    } else {
      return date.toLocaleDateString('fr-FR')
    }
  }

  const getTypeIcon = (type: string) => {
    const iconConfig = {
      order: { icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-100' },
      user: { icon: Users, color: 'text-green-600', bg: 'bg-green-100' },
      payment: { icon: TrendingUp, color: 'text-yellow-600', bg: 'bg-yellow-100' },
      alert: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' },
      system: { icon: Settings, color: 'text-purple-600', bg: 'bg-purple-100' },
      marketing: { icon: Target, color: 'text-pink-600', bg: 'bg-pink-100' },
      security: { icon: Shield, color: 'text-orange-600', bg: 'bg-orange-100' }
    }
    
    const config = iconConfig[type as keyof typeof iconConfig] || iconConfig.system
    const IconComponent = config.icon
    
    return { IconComponent, color: config.color, bg: config.bg }
  }

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { color: 'bg-gray-100 text-gray-800 border-gray-200', text: 'Faible' },
      medium: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', text: 'Moyenne' },
      high: { color: 'bg-orange-100 text-orange-800 border-orange-200', text: 'Ã‰levÃ©e' },
      critical: { color: 'bg-red-100 text-red-800 border-red-200', text: 'Critique' }
    }
    
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.low
    
    return (
      <Badge variant="outline" className={config.color}>
        {config.text}
      </Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: 'outline',
      sent: 'secondary',
      delivered: 'default',
      read: 'default',
      failed: 'destructive'
    }
    const colors: Record<string, string> = {
      pending: 'text-yellow-600',
      sent: 'text-blue-600',
      delivered: 'text-green-600',
      read: 'text-gray-600',
      failed: 'text-red-600'
    }
    return <Badge variant={variants[status] || 'outline'} className={colors[status]}>
      {status === 'pending' ? 'En attente' : 
       status === 'sent' ? 'EnvoyÃ©e' : 
       status === 'delivered' ? 'LivrÃ©e' : 
       status === 'read' ? 'Lue' : 'Ã‰chouÃ©e'}
    </Badge>
  }

  // Fonction pour exporter les notifications
  const exportNotifications = () => {
    const csvHeaders = ['Type', 'Titre', 'Message', 'PrioritÃ©', 'Statut', 'Date', 'Destinataire', 'Canal', 'CatÃ©gorie']
    const csvRows = filteredNotifications.map(notification => [
      notification.type,
      notification.title,
      notification.message,
      notification.priority,
      notification.status,
      notification.date,
      notification.recipient,
      notification.channel,
      notification.category
    ])
    
    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')
    
    const bom = '\uFEFF'
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `notifications-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    
    addNotification({
      type: 'success',
      title: 'Export rÃ©ussi',
      message: `${filteredNotifications.length} notifications exportÃ©es en CSV`
    })
  }

  // Fonction pour dupliquer une notification
  const duplicateNotification = async (notification?: Notification) => {
    const source = notification ?? filteredNotifications[0]
    if (!source) {
      addNotification({
        type: 'error',
        title: 'Duplication impossible',
        message: 'Aucune notification Ã  dupliquer.'
      })
      return
    }

    try {
      const authHeaders = await getSuperAdminAuthHeaders()
      const priorityMap: Record<string, 'low' | 'normal' | 'high' | 'urgent'> = {
        low: 'low',
        medium: 'normal',
        high: 'high',
        critical: 'urgent'
      }

      const res = await fetch('/api/super-admin/notifications', {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          recipientEmails: String(source.recipient ?? ''),
          recipientEmail: String(source.recipient ?? '').trim() || undefined,
          channel: source.channel,
          title: `${source.title} (Copie)`,
          message: source.message,
          type: source.type,
          priority: priorityMap[source.priority] ?? 'normal'
        })
      })

      const json = await res.json().catch(() => null)
      if (!res.ok) {
        const rawError = (json as any)?.error
        const message =
          typeof rawError === 'string'
            ? rawError
            : rawError
              ? JSON.stringify(rawError)
              : 'Duplication Ã©chouÃ©e'
        throw new Error(message)
      }

      addNotification({
        type: 'success',
        title: 'Notification dupliquÃ©e',
        message: 'La notification a Ã©tÃ© dupliquÃ©e en base.'
      })
      void loadNotifications()
      void loadNotificationStats()
    } catch (error) {
      console.error('duplicateNotification failed:', error)
      addNotification({
        type: 'error',
        title: 'Duplication impossible',
        message: error instanceof Error ? error.message : 'Erreur inconnue.'
      })
    }
  }

  // Envoie les notifications en attente via la file technique (notification_jobs).
  const runJobProcessor = async (retryFailed: boolean) => {
    try {
      const authHeaders = await getSuperAdminAuthHeaders()
      const res = await fetch('/api/super-admin/notifications/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(retryFailed ? { retryFailed: true } : {})
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(String(json?.error ?? 'Traitement de la file impossible'))
      }

      const processed = Number(json?.processed ?? 0)
      const failed = Number(json?.failed ?? 0)
      addNotification({
        type: failed > 0 ? 'warning' : 'success',
        title: retryFailed ? 'Nouvelle tentative lancée' : 'Envoi effectué',
        message:
          processed === 0 && failed === 0
            ? 'Aucun job à traiter dans la file.'
            : `${processed} job(s) traité(s), ${failed} échec(s).`
      })
      void loadNotifications()
      void loadNotificationStats()
    } catch (error) {
      addNotification({
        type: 'error',
        title: retryFailed ? 'Réessai impossible' : 'Envoi impossible',
        message: error instanceof Error ? error.message : 'Erreur inconnue.'
      })
    }
  }

  // Fonction pour envoyer une notification
  const sendNotification = async (notification: Notification) => {
    await runJobProcessor(false)
  }

  // Fonction pour réessayer l'envoi d'une notification
  const retryNotification = async (notification: Notification) => {
    await runJobProcessor(true)
  }

  // Fonction pour marquer une notification comme lue
  const markAsRead = async (notification: Notification) => {
    try {
      const authHeaders = await getSuperAdminAuthHeaders()
      const res = await fetch('/api/super-admin/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ id: notification.id, action: 'mark_read' })
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(String(json?.error ?? 'Mise Ã  jour impossible'))
      }

      setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, status: 'read', readAt: new Date().toISOString() } : n)))
      void loadNotificationStats()
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Action impossible',
        message: error instanceof Error ? error.message : 'Erreur inconnue.'
      })
    }
  }

  // Fonction pour supprimer une notification
  const deleteNotification = async (notification: Notification) => {
    try {
      const authHeaders = await getSuperAdminAuthHeaders()
      const res = await fetch(`/api/super-admin/notifications?id=${encodeURIComponent(notification.id)}`, {
        method: 'DELETE',
        headers: {
          ...authHeaders
        }
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(String(json?.error ?? 'Suppression Ã©chouÃ©e'))
      }

      setNotifications((prev) => prev.filter((n) => n.id !== notification.id))
      void loadNotificationStats()
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Suppression impossible',
        message: error instanceof Error ? error.message : 'Erreur inconnue.'
      })
    }
  }

  // Fonction pour crÃ©er/mettre Ã  jour une notification
  const createNotification = async () => {
    if (isCreatingNotification) return

    const title = String(createNotificationForm.title ?? '').trim()
    const message = String(createNotificationForm.message ?? '').trim()
    const actionUrlRaw = String((createNotificationForm as any).actionUrl ?? '').trim()
    const rawRecipients = String(createNotificationForm.recipientEmail ?? '')
    const recipients = rawRecipients
      .split(/[,;\n]+/)
      .map((x) => x.trim())
      .filter((x) => x.length > 0)

    if (!title || !message) {
      addNotification({
        type: 'error',
        title: 'CrÃ©ation impossible',
        message: 'Titre et message sont requis.'
      })
      return
    }

    if (createNotificationForm.channel !== 'in-app' && recipients.length === 0) {
      addNotification({
        type: 'error',
        title: 'CrÃ©ation impossible',
        message: 'Ajoute au moins un destinataire email pour Email/Push.'
      })
      return
    }

    try {
      setIsCreatingNotification(true)
      const authHeaders = await getSuperAdminAuthHeaders()
      const priorityMap: Record<string, 'low' | 'normal' | 'high' | 'urgent'> = {
        low: 'low',
        medium: 'normal',
        high: 'high',
        critical: 'urgent'
      }

      /**
       * CrÃ©e une ligne "optimistic" pour affichage immÃ©diat cÃ´tÃ© super-admin.
       */
      const buildOptimisticNotification = (options: {
        title: string
        message: string
        type: string
        priority: Notification['priority']
        rawRecipients: string
      }): Notification => {
        const now = new Date().toISOString()
        const recipientLabel = String(options.rawRecipients ?? '').trim()
        const recipient = recipientLabel
          ? recipientLabel
          : 'Tous'

        return {
          id: `optimistic_${Date.now()}`,
          type: (options.type || 'system') as Notification['type'],
          title: options.title,
          message: options.message,
          priority: options.priority,
          status: 'sent',
          date: now,
          recipient,
          recipientType: 'user',
          channel: 'in-app',
          category: String(options.type || 'SystÃ¨me'),
          tags: [],
          metadata: {
            actionUrl: actionUrlRaw || null,
            userId: undefined
          },
          readAt: undefined,
          deliveredAt: now
        }
      }

      const isEditing = Boolean(editNotificationId)
      const endpoint = '/api/super-admin/notifications'

      const optimisticId = `optimistic_${Date.now()}`
      if (!isEditing) {
        const optimisticPriority: Notification['priority'] = (() => {
          const raw = String(createNotificationForm.priority ?? '').toLowerCase()
          if (raw === 'low') return 'low'
          if (raw === 'high') return 'high'
          if (raw === 'critical') return 'critical'
          return 'medium'
        })()

        setNotifications((prev) => [
          {
            ...buildOptimisticNotification({
              title,
              message,
              type: createNotificationForm.type,
              priority: optimisticPriority,
              rawRecipients
            }),
            id: optimisticId
          },
          ...prev
        ])

        setShowCreateNotificationModal(false)
        setEditNotificationId(null)
      }

      const res = await fetch(endpoint, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(
          isEditing
            ? {
                id: editNotificationId,
                action: 'update',
                title,
                message,
                type: createNotificationForm.type,
                priority: priorityMap[createNotificationForm.priority] ?? 'normal'
              }
            : {
                recipientEmails: rawRecipients,
                recipientEmail: recipients[0] ?? undefined,
                channel: createNotificationForm.channel,
                title,
                message,
                type: createNotificationForm.type,
                priority: priorityMap[createNotificationForm.priority] ?? 'normal',
                actionUrl: actionUrlRaw ? actionUrlRaw : null
              }
        )
      })

      const json = await res.json().catch(() => null)
      if (!res.ok) {
        const rawError = (json as any)?.error
        const message =
          typeof rawError === 'string'
            ? rawError
            : rawError
              ? JSON.stringify(rawError)
              : 'CrÃ©ation Ã©chouÃ©e'
        throw new Error(message)
      }

      if (isEditing) {
        addNotification({
          type: 'success',
          title: 'Notification mise Ã  jour',
          message: 'La notification a Ã©tÃ© mise Ã  jour en base.'
        })
      } else {
        const channelMsg =
          createNotificationForm.channel === 'in-app'
            ? 'Notification crÃ©Ã©e (in-app).'
            : `Notification crÃ©Ã©e (in-app) + job ajoutÃ© Ã  la Queue pour l'envoi ${
                createNotificationForm.channel === 'push' ? 'Push' : 'Email'
              }.`

        addNotification({
          type: 'success',
          title: 'Notification crÃ©Ã©e',
          message: channelMsg
        })
      }
      void loadNotifications()
      void loadNotificationStats()
    } catch (error) {
      console.error('createNotification failed:', error)
      setNotifications((prev) => prev.filter((n) => !String(n.id || '').startsWith('optimistic_')))
      addNotification({
        type: 'error',
        title: 'CrÃ©ation impossible',
        message: error instanceof Error ? error.message : 'Erreur inconnue.'
      })
    } finally {
      setIsCreatingNotification(false)
    }
  }

  // Fonction pour sauvegarder une notification
  const saveNotification = () => {
    if (selectedNotification) {
      setNotifications(prev => prev.map(n => 
        n.id === selectedNotification.id 
          ? { ...selectedNotification, updatedAt: new Date().toISOString() }
          : n
      ))
      
      addNotification({
        type: 'success',
        title: 'Notification sauvegardÃ©e',
        message: 'La notification a Ã©tÃ© sauvegardÃ©e avec succÃ¨s'
      })
      
      setShowCreateModal(false)
    }
  }

  const deleteNotificationDb = async (notification: Notification) => {
    const ok = window.confirm(
      'Confirmer la suppression ? Cette action supprime dÃ©finitivement la notification de la base de donnÃ©es.'
    )
    if (!ok) return

    try {
      const authHeaders = await getSuperAdminAuthHeaders()
      const res = await fetch(`/api/super-admin/notifications?id=${encodeURIComponent(notification.id)}`, {
        method: 'DELETE',
        headers: { ...authHeaders }
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(String(json?.error ?? 'Suppression Ã©chouÃ©e'))
      }

      addNotification({
        type: 'success',
        title: 'Notification supprimÃ©e',
        message: 'La notification a Ã©tÃ© supprimÃ©e dÃ©finitivement.'
      })
      void loadNotifications()
      void loadNotificationStats()
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Suppression impossible',
        message: error instanceof Error ? error.message : 'Erreur inconnue.'
      })
    }
  }

  // Filtrage des notifications
  const filteredNotifications = useMemo(() => {
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(startOfDay.getTime() - ((startOfDay.getDay() + 6) % 7) * 24 * 60 * 60 * 1000)
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)

    const matchesDate = (dateIso: string): boolean => {
      if (dateFilter === 'all' || !dateIso) return true
      const d = new Date(dateIso)
      if (Number.isNaN(d.getTime())) return true
      switch (dateFilter) {
        case 'today': return d >= startOfDay
        case 'week': return d >= startOfWeek
        case 'month': return d >= startOfMonth
        case 'quarter': return d >= startOfQuarter
        default: return true
      }
    }

    return notifications.filter((notification) => {
      const matchesSearch =
        notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.category.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = typeFilter === 'all' || notification.type === typeFilter
      const matchesPriority = priorityFilter === 'all' || notification.priority === priorityFilter
      const matchesStatus = statusFilter === 'all' || notification.status === statusFilter
      const matchesChannel = channelFilter === 'all' || notification.channel === channelFilter
      const matchesDateValue = matchesDate(notification.date)

      return matchesSearch && matchesType && matchesPriority && matchesStatus && matchesChannel && matchesDateValue
    })
  }, [notifications, searchTerm, typeFilter, priorityFilter, statusFilter, channelFilter, dateFilter])

  // Pagination
  const totalPages = Math.ceil(filteredNotifications.length / notificationsPerPage)
  const currentNotifications = filteredNotifications.slice(
    (currentPage - 1) * notificationsPerPage,
    currentPage * notificationsPerPage
  )

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Notifications & Alertes</h2>
            <p className="text-gray-600 mt-2">
              Gestion intelligente des notifications et systÃ¨me d'alertes personnalisables
            </p>
          </div>
          <Button 
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            onClick={() => setShowGlobalConfigModal(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Configuration
          </Button>
        </div>
      </div>

      {/* Statistiques principales amÃ©liorÃ©es */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Bell className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-700">{stats.totalSent.toLocaleString()}</p>
                  <p className="text-sm text-purple-600">Notifications envoyÃ©es</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-purple-600 mb-1">+{stats.monthlyGrowth}%</div>
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-700">{stats.priorityBreakdown.critical}</p>
                  <p className="text-sm text-red-600">Alertes critiques</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-red-600 mb-1">{stats.priorityBreakdown.high}</div>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-700">{stats.deliveryRate}%</p>
                  <p className="text-sm text-green-600">Taux de livraison</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-green-600 mb-1">{stats.readRate}%</div>
                <Eye className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-700">{stats.totalDelivered.toLocaleString()}</p>
                  <p className="text-sm text-blue-600">LivrÃ©es avec succÃ¨s</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-blue-600 mb-1">{stats.averageDeliveryTime}min</div>
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres avancÃ©s */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres AvancÃ©s
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Recherche</Label>
              <Input
                id="search"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous types</SelectItem>
                  <SelectItem value="order">Commandes</SelectItem>
                  <SelectItem value="user">Utilisateurs</SelectItem>
                  <SelectItem value="payment">Paiements</SelectItem>
                  <SelectItem value="alert">Alertes</SelectItem>
                  <SelectItem value="system">SystÃ¨me</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="security">SÃ©curitÃ©</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">PrioritÃ©</Label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes prioritÃ©s" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes prioritÃ©s</SelectItem>
                  <SelectItem value="low">Faible</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="high">Ã‰levÃ©e</SelectItem>
                  <SelectItem value="critical">Critique</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="sent">EnvoyÃ©e</SelectItem>
                  <SelectItem value="delivered">LivrÃ©e</SelectItem>
                  <SelectItem value="read">Lue</SelectItem>
                  <SelectItem value="failed">Ã‰chouÃ©e</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="channel">Canal</Label>
              <Select value={channelFilter} onValueChange={setChannelFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous canaux" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous canaux</SelectItem>
                  <SelectItem value="push">Push</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="in-app">In-App</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">PÃ©riode</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes pÃ©riodes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes pÃ©riodes</SelectItem>
                  <SelectItem value="today">Aujourd'hui</SelectItem>
                  <SelectItem value="week">Cette semaine</SelectItem>
                  <SelectItem value="month">Ce mois</SelectItem>
                  <SelectItem value="quarter">Ce trimestre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="alertes">Alertes</TabsTrigger>
          <TabsTrigger value="alertes-clients">Alertes des clients</TabsTrigger>
          <TabsTrigger value="evenements">Ã‰vÃ©nements</TabsTrigger>
          <TabsTrigger value="queue">Queue</TabsTrigger>
          <TabsTrigger value="push">Notifications Push</TabsTrigger>
          <TabsTrigger value="email">Emails</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Notifications SystÃ¨me</CardTitle>
                  <CardDescription>
                    Gestion des notifications automatiques et manuelles ({filteredNotifications.length} rÃ©sultats)
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={exportNotifications}>
                    <Download className="h-4 w-4 mr-2" />
                    Exporter
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => void duplicateNotification()}>
                    <Copy className="h-4 w-4 mr-2" />
                    Dupliquer
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => setShowCreateNotificationModal(true)}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    Nouvelle Notification
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentNotifications.map((notification) => {
                  const { IconComponent, color, bg } = getTypeIcon(notification.type)
                  
                  return (
                    <div key={notification.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${bg}`}>
                            <IconComponent className={`h-6 w-6 ${color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium text-gray-900">{notification.title}</h4>
                              {getPriorityBadge(notification.priority)}
                              {getStatusBadge(notification.status)}
                              <Badge variant="outline" className="text-xs">
                                {notification.channel}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-4 mb-2 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDate(notification.date)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {notification.recipient}
                              </span>
                              <span className="flex items-center gap-1">
                                <Target className="h-3 w-3" />
                                {notification.category}
                              </span>
                            </div>

                            <p className="text-gray-700 mb-3 leading-relaxed">{notification.message}</p>

                            {/* Tags et mÃ©tadonnÃ©es */}
                            <div className="flex items-center gap-2 mb-3">
                              {notification.tags.map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>

                            {/* MÃ©tadonnÃ©es si disponibles */}
                            {notification.metadata && Object.keys(notification.metadata).length > 0 && (
                              <div className="bg-gray-50 p-3 rounded-lg mb-3">
                                <h5 className="font-medium text-sm mb-2">DÃ©tails techniques:</h5>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  {Object.entries(notification.metadata)
                                    .filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== '')
                                    .map(([key, value]) => (
                                      <div key={key} className="flex justify-between gap-2">
                                        <span className="text-gray-600">{key}:</span>
                                        {key === 'actionUrl' ? (
                                          <a
                                            href={String(value)}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="font-medium text-blue-600 hover:underline break-all"
                                          >
                                            {String(value)}
                                          </a>
                                        ) : (
                                          <span className="font-medium break-all">{String(value)}</span>
                                        )}
                                      </div>
                                    ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedNotification(notification)
                              setShowNotificationModal(true)
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Voir
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedNotification(notification)
                              setEditNotificationId(notification.id)
                              setCreateNotificationForm({
                                title: notification.title,
                                type: notification.type,
                                priority: notification.priority,
                                channel: notification.channel,
                                message: notification.message,
                                recipientEmail: notification.recipient,
                actionUrl: notification.metadata?.actionUrl ?? ''
                              })
                              setShowCreateNotificationModal(true)
                            }}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Modifier
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-200 text-red-700 hover:bg-red-50"
                            onClick={() => void deleteNotificationDb(notification)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Supprimer
                          </Button>
                          {notification.status === 'pending' && (
                            <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => sendNotification(notification)}>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Envoyer
                            </Button>
                          )}
                          {notification.status === 'failed' && (
                            <Button size="sm" variant="outline" className="border-orange-200 text-orange-600 hover:bg-orange-50" onClick={() => retryNotification(notification)}>
                              <Zap className="h-4 w-4 mr-1" />
                              RÃ©essayer
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-gray-600">
                      Affichage de {((currentPage - 1) * notificationsPerPage) + 1} Ã  {Math.min(currentPage * notificationsPerPage, filteredNotifications.length)} sur {filteredNotifications.length} notifications
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        PrÃ©cÃ©dent
                      </Button>
                      <span className="text-sm text-gray-600">
                        Page {currentPage} sur {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      >
                        Suivant
                      </Button>
                    </div>
                  </div>
                )}

                {currentNotifications.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Aucune notification trouvÃ©e</p>
                    <p className="text-sm">Ajustez vos filtres ou crÃ©ez une nouvelle notification</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evenements" className="space-y-4">
          <Card className="border-0 shadow-xl">
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-[#ff6600]" />
                    Ã‰vÃ©nements
                  </CardTitle>
                  <CardDescription>
                    CrÃ©e et gÃ¨re les Ã©vÃ©nements qui s'affichent dans le modal "Voir le calendrier".
                  </CardDescription>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      value={siteEventsQuery}
                      onChange={(e) => {
                        setSiteEventsQuery(e.target.value)
                        setSiteEventsPage(1)
                      }}
                      placeholder="Rechercher un Ã©vÃ©nement"
                      className="pl-9 w-[280px]"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => void loadSiteEvents(siteEventsPage, siteEventsQuery)}
                    disabled={isLoadingSiteEvents}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Actualiser
                  </Button>
                  <Button
                    onClick={() => openCreateSiteEvent()}
                    className="bg-[#ff6600] hover:bg-orange-600 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvel Ã©vÃ©nement
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="grid grid-cols-12 bg-gradient-to-r from-orange-50 to-purple-50 px-4 py-3 text-xs font-semibold text-gray-700">
                  <div className="col-span-4">Ã‰vÃ©nement</div>
                  <div className="col-span-3">Date</div>
                  <div className="col-span-2">Statut</div>
                  <div className="col-span-2">Actif</div>
                  <div className="col-span-1 text-right">Actions</div>
                </div>

                {isLoadingSiteEvents ? (
                  <div className="p-6 text-sm text-gray-600">Chargement...</div>
                ) : siteEvents.length === 0 ? (
                  <div className="p-6 text-sm text-gray-600">Aucun Ã©vÃ©nement trouvÃ©.</div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {siteEvents.map((ev) => (
                      <div key={ev.id} className="grid grid-cols-12 px-4 py-3 text-sm items-center hover:bg-gray-50">
                        <div className="col-span-4">
                          <div className="font-medium text-gray-900 flex items-center gap-2">
                            <span>{ev.categoryIcon || 'ðŸ“…'}</span>
                            <span className="truncate">{ev.title}</span>
                          </div>
                          <div className="text-xs text-gray-500 truncate">{ev.categoryLabel || ev.categoryKey}</div>
                        </div>
                        <div className="col-span-3 text-gray-700">
                          {ev.date ? new Date(ev.date).toLocaleDateString('fr-FR') : 'â€”'} {ev.time ? `â€¢ ${ev.time}` : ''}
                        </div>
                        <div className="col-span-2">
                          <Badge className={ev.status === 'upcoming' ? 'bg-[#ff6600] text-white' : 'bg-blue-500 text-white'}>
                            {ev.status === 'upcoming' ? 'BientÃ´t' : ev.status === 'announced' ? 'AnnoncÃ©' : ev.status}
                          </Badge>
                        </div>
                        <div className="col-span-2">
                          {ev.isActive ? (
                            <Badge className="bg-green-100 text-green-700" variant="secondary">Oui</Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-700" variant="secondary">Non</Badge>
                          )}
                        </div>
                        <div className="col-span-1 flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => openEditSiteEvent(ev)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => void deleteSiteEvent(ev.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
                <div className="text-sm text-gray-600">
                  Total: <span className="font-semibold text-gray-900">{siteEventsCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const next = Math.max(1, siteEventsPage - 1)
                      setSiteEventsPage(next)
                      void loadSiteEvents(next, siteEventsQuery)
                    }}
                    disabled={siteEventsPage <= 1 || isLoadingSiteEvents}
                  >
                    PrÃ©cÃ©dent
                  </Button>
                  <Badge variant="outline">Page {siteEventsPage}</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const next = siteEventsPage + 1
                      setSiteEventsPage(next)
                      void loadSiteEvents(next, siteEventsQuery)
                    }}
                    disabled={isLoadingSiteEvents || siteEvents.length < 25}
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Dialog open={showSiteEventModal} onOpenChange={setShowSiteEventModal}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-[#ff6600]" />
                  {editingSiteEvent ? 'Modifier un Ã©vÃ©nement' : 'CrÃ©er un Ã©vÃ©nement'}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Titre</Label>
                    <Input value={siteEventForm.title} onChange={(e) => setSiteEventForm((p) => ({ ...p, title: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" value={siteEventForm.date} onChange={(e) => setSiteEventForm((p) => ({ ...p, date: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Heure</Label>
                    <Input value={siteEventForm.time} onChange={(e) => setSiteEventForm((p) => ({ ...p, time: e.target.value }))} placeholder="14:00" />
                  </div>
                  <div className="space-y-2">
                    <Label>Statut</Label>
                    <Select value={siteEventForm.status} onValueChange={(v) => setSiteEventForm((p) => ({ ...p, status: v as any }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="upcoming">BientÃ´t</SelectItem>
                        <SelectItem value="announced">AnnoncÃ©</SelectItem>
                        <SelectItem value="completed">TerminÃ©</SelectItem>
                        <SelectItem value="cancelled">AnnulÃ©</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>ClÃ© catÃ©gorie</Label>
                    <Input value={siteEventForm.categoryKey} onChange={(e) => setSiteEventForm((p) => ({ ...p, categoryKey: e.target.value }))} placeholder="tech" />
                  </div>
                  <div className="space-y-2">
                    <Label>Nom catÃ©gorie (optionnel)</Label>
                    <Input value={siteEventForm.categoryLabel} onChange={(e) => setSiteEventForm((p) => ({ ...p, categoryLabel: e.target.value }))} placeholder="Technologie" />
                  </div>
                  <div className="space-y-2">
                    <Label>IcÃ´ne (emoji)</Label>
                    <Input value={siteEventForm.categoryIcon} onChange={(e) => setSiteEventForm((p) => ({ ...p, categoryIcon: e.target.value }))} placeholder="ðŸ’»" />
                  </div>
                  <div className="space-y-2">
                    <Label>RÃ©duction / mention</Label>
                    <Input value={siteEventForm.discount} onChange={(e) => setSiteEventForm((p) => ({ ...p, discount: e.target.value }))} placeholder="Jusqu'Ã  -70%" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={siteEventForm.description} onChange={(e) => setSiteEventForm((p) => ({ ...p, description: e.target.value }))} rows={4} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch checked={siteEventForm.isActive} onCheckedChange={(v) => setSiteEventForm((p) => ({ ...p, isActive: Boolean(v) }))} />
                    <span className="text-sm text-gray-700">Actif</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setShowSiteEventModal(false)}>
                      Annuler
                    </Button>
                    <Button className="bg-[#ff6600] hover:bg-orange-600 text-white" onClick={() => void saveSiteEvent()}>
                      Enregistrer
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="alertes-clients" className="space-y-4">
          <Card className="border-0 shadow-xl">
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-[#ff6600]" />
                    Alertes des clients
                  </CardTitle>
                  <CardDescription>
                    Inscriptions provenant du modal â€œRecevoir les alertesâ€ (WhatsApp / Email / SMS / Push)
                  </CardDescription>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      value={clientAlertsQuery}
                      onChange={(e) => {
                        setClientAlertsQuery(e.target.value)
                        setClientAlertsPage(1)
                      }}
                      placeholder="Rechercher par tÃ©lÃ©phone ou email"
                      className="pl-9 w-[280px]"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => void loadClientAlerts(clientAlertsPage, clientAlertsQuery)}
                    disabled={isLoadingClientAlerts}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Actualiser
                  </Button>
                  <Button
                    onClick={() => void exportClientAlertsCsv()}
                    className="bg-[#ff6600] hover:bg-orange-600 text-white"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="grid grid-cols-12 bg-gradient-to-r from-orange-50 to-purple-50 px-4 py-3 text-xs font-semibold text-gray-700">
                  <div className="col-span-3">TÃ©lÃ©phone</div>
                  <div className="col-span-3">Email</div>
                  <div className="col-span-3">Canaux</div>
                  <div className="col-span-2">Statut</div>
                  <div className="col-span-1 text-right">Date</div>
                </div>

                {isLoadingClientAlerts ? (
                  <div className="p-6 text-sm text-gray-600">Chargement...</div>
                ) : clientAlerts.length === 0 ? (
                  <div className="p-6 text-sm text-gray-600">Aucune inscription trouvÃ©e.</div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {clientAlerts.map((row) => {
                      const pref = row.preferences ?? {}
                      const channels = [
                        pref.whatsapp ? 'WhatsApp' : null,
                        pref.email ? 'Email' : null,
                        pref.sms ? 'SMS' : null,
                        pref.push ? 'Push' : null
                      ].filter(Boolean)

                      return (
                        <div key={row.id} className="grid grid-cols-12 px-4 py-3 text-sm items-center hover:bg-gray-50">
                          <div className="col-span-3 font-medium text-gray-900">{row.phone}</div>
                          <div className="col-span-3 text-gray-700 truncate">{row.email ?? 'â€”'}</div>
                          <div className="col-span-3">
                            <div className="flex flex-wrap gap-2">
                              {channels.length === 0 ? (
                                <Badge variant="secondary">Aucun</Badge>
                              ) : (
                                channels.map((c) => (
                                  <Badge key={String(c)} className="bg-white text-gray-800 border border-gray-200" variant="outline">
                                    {String(c)}
                                  </Badge>
                                ))
                              )}
                            </div>
                          </div>
                          <div className="col-span-2">
                            {row.isActive ? (
                              <Badge className="bg-green-100 text-green-700" variant="secondary">Actif</Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-700" variant="secondary">Inactif</Badge>
                            )}
                          </div>
                          <div className="col-span-1 text-right text-xs text-gray-500">
                            {row.createdAt ? new Date(row.createdAt).toLocaleDateString('fr-FR') : 'â€”'}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
                <div className="text-sm text-gray-600">
                  Total: <span className="font-semibold text-gray-900">{clientAlertsCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const next = Math.max(1, clientAlertsPage - 1)
                      setClientAlertsPage(next)
                      void loadClientAlerts(next, clientAlertsQuery)
                    }}
                    disabled={clientAlertsPage <= 1 || isLoadingClientAlerts}
                  >
                    PrÃ©cÃ©dent
                  </Button>
                  <Badge variant="outline">Page {clientAlertsPage}</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const next = clientAlertsPage + 1
                      setClientAlertsPage(next)
                      void loadClientAlerts(next, clientAlertsQuery)
                    }}
                    disabled={isLoadingClientAlerts || clientAlerts.length < 25}
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alertes" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>SystÃ¨me d'Alertes</CardTitle>
                  <CardDescription>
                    Supervision des alertes systÃ¨me rÃ©elles ({systemAlerts.length} alertes)
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => void loadSystemAlerts()}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Actualiser
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {isLoadingSystemAlerts ? (
                  <div className="text-sm text-gray-600">Chargement...</div>
                ) : (
                  systemAlerts.map((alert) => (
                    <div key={alert.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h4 className="text-lg font-medium text-gray-900">{alert.title}</h4>
                            <Badge
                              variant={alert.type === 'critical' ? 'destructive' : alert.type === 'warning' ? 'secondary' : 'outline'}
                            >
                              {alert.type === 'critical' ? 'Critique' : alert.type === 'warning' ? 'Avertissement' : 'Info'}
                            </Badge>
                            <Badge variant={alert.status === 'active' ? 'default' : 'outline'}>
                              {alert.status === 'active' ? 'Active' : alert.status === 'resolved' ? 'RÃ©solue' : 'IgnorÃ©e'}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {alert.priority}
                            </Badge>
                          </div>

                          <p className="text-gray-700 mb-2">{alert.message}</p>

                          <div className="text-xs text-gray-500">
                            CrÃ©Ã©e: {alert.created_at ? new Date(alert.created_at).toLocaleString('fr-FR') : 'â€”'}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
                          {alert.status === 'active' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-green-200 text-green-700 hover:bg-green-50"
                              onClick={() => void resolveSystemAlert(alert.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              RÃ©soudre
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-orange-200 text-orange-700 hover:bg-orange-50"
                            onClick={() => void escalateSystemAlert(alert.id)}
                          >
                            <Zap className="h-4 w-4 mr-1" />
                            Escalader
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void deleteSystemAlert(alert.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Supprimer
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {!isLoadingSystemAlerts && systemAlerts.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Aucune alerte systÃ¨me</p>
                    <p className="text-sm">Les alertes apparaÃ®tront ici dÃ¨s qu'elles existent en base.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queue" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Queue Jobs (Email/Push)</CardTitle>
                  <CardDescription>
                    Suivi des envois multi-canaux via la table <span className="font-mono">notification_jobs</span>
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void loadNotificationJobs()}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Actualiser
                  </Button>
                  <Button
                    variant={isAutoProcessingQueue ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setIsAutoProcessingQueue((v) => !v)}
                    className={isAutoProcessingQueue ? 'bg-emerald-600 hover:bg-emerald-700' : undefined}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Auto
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => void processNotificationQueue()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Traiter la file
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoadingNotificationJobs ? (
                  <div className="text-sm text-gray-600">Chargement...</div>
                ) : (
                  notificationJobs.map((job) => (
                    <div key={job.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">{job.channel}</Badge>
                            <Badge variant={job.status === 'failed' ? 'destructive' : job.status === 'pending' ? 'secondary' : 'default'}>
                              {job.status}
                            </Badge>
                            <Badge variant="outline" className="text-xs">tentatives: {job.attempts}</Badge>
                          </div>

                          <div className="text-xs text-gray-500 mb-2">
                            CrÃ©Ã©: {job.created_at ? new Date(job.created_at).toLocaleString('fr-FR') : 'â€”'}
                          </div>

                          {job.last_error && (
                            <div className="text-sm text-red-700 bg-red-50 border border-red-100 rounded p-2">
                              {job.last_error}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void retryNotificationJob(job.id)}
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Retry
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void deleteNotificationJob(job.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Supprimer
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {!isLoadingNotificationJobs && notificationJobs.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Aucun job dans la file</p>
                    <p className="text-sm">CrÃ©e une notification Email/Push pour gÃ©nÃ©rer un job pending.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="push" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notifications Push</CardTitle>
              <CardDescription>
                Gestion des notifications push et configuration des appareils
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <h4 className="font-medium">Configuration Push</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Smartphone className="h-5 w-5 text-blue-600" />
                        <span>Notifications Push</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={pushConfig.enabled}
                        onChange={() => void togglePushConfig('enabled')}
                        className="w-4 h-4"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Bell className="h-5 w-5 text-green-600" />
                        <span>Alertes critiques</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={pushConfig.criticalAlerts}
                        onChange={() => void togglePushConfig('criticalAlerts')}
                        className="w-4 h-4"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <MessageCircle className="h-5 w-5 text-purple-600" />
                        <span>Nouveaux messages</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={pushConfig.newMessages}
                        onChange={() => void togglePushConfig('newMessages')}
                        className="w-4 h-4"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium">Statistiques Push</h4>
                  <div className="space-y-3">
                    <div className="text-center p-4 border border-gray-200 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{pushStats.deliveredRate}%</p>
                      <p className="text-sm text-gray-600">Taux de livraison</p>
                    </div>
                    <div className="text-center p-4 border border-gray-200 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{pushStats.averageDeliveryMinutes}min</p>
                      <p className="text-sm text-gray-600">Temps de livraison</p>
                    </div>
                    <div className="text-center p-4 border border-gray-200 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">{pushStats.total}</p>
                      <p className="text-sm text-gray-600">Jobs Push (Queue)</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notifications Email</CardTitle>
              <CardDescription>
                Configuration des emails transactionnels et marketing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        value={emailTemplatesQuery}
                        onChange={(e) => setEmailTemplatesQuery(e.target.value)}
                        placeholder="Rechercher un template (key, nom, sujet)"
                        className="pl-9 w-[320px]"
                      />
                    </div>
                    <Select
                      value={emailTemplatesCategory}
                      onValueChange={(v) => setEmailTemplatesCategory(v as any)}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="CatÃ©gorie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes</SelectItem>
                        <SelectItem value="transactional">Transactionnel</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="system">SystÃ¨me</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      onClick={() => void loadEmailTemplates()}
                      disabled={isLoadingEmailTemplates}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Actualiser
                    </Button>
                  </div>
                  <Button
                    onClick={() => openCreateEmailTemplate()}
                    className="bg-[#ff6600] hover:bg-orange-600 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nouveau template
                  </Button>
                </div>

                <div className="text-sm text-gray-600">
                  Total: <span className="font-semibold text-gray-900">{emailTemplatesCount}</span>
                </div>

                <div className="rounded-xl border border-gray-200 overflow-hidden">
                  <div className="grid grid-cols-12 bg-gradient-to-r from-orange-50 to-purple-50 px-4 py-3 text-xs font-semibold text-gray-700">
                    <div className="col-span-3">Key</div>
                    <div className="col-span-3">Nom</div>
                    <div className="col-span-2">CatÃ©gorie</div>
                    <div className="col-span-3">Sujet</div>
                    <div className="col-span-1 text-right">Actions</div>
                  </div>

                  {isLoadingEmailTemplates ? (
                    <div className="p-6 text-sm text-gray-600">Chargement...</div>
                  ) : emailTemplates.length === 0 ? (
                    <div className="p-6 text-sm text-gray-600">Aucun template trouvÃ©.</div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {emailTemplates.map((tpl) => (
                        <div key={tpl.id} className="grid grid-cols-12 px-4 py-3 text-sm items-center hover:bg-gray-50">
                          <div className="col-span-3 font-mono text-xs text-gray-700 truncate">{tpl.key}</div>
                          <div className="col-span-3 text-gray-900 truncate">{tpl.name}</div>
                          <div className="col-span-2">
                            <Badge variant="outline" className="text-xs">{tpl.category}</Badge>
                            {!tpl.is_active && (
                              <Badge variant="secondary" className="text-xs ml-2">Inactif</Badge>
                            )}
                          </div>
                          <div className="col-span-3 text-gray-700 truncate">{tpl.subject}</div>
                          <div className="col-span-1 flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => openEditEmailTemplate(tpl)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-200 text-red-700 hover:bg-red-50"
                              onClick={() => void deleteEmailTemplate(tpl)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        
      </Tabs>

      {/* Modal de visualisation de notification */}
      <Dialog open={showNotificationModal} onOpenChange={setShowNotificationModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              DÃ©tails de la Notification
            </DialogTitle>
          </DialogHeader>
          
          {selectedNotification && (
            <div className="space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Informations gÃ©nÃ©rales */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informations GÃ©nÃ©rales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center ${getTypeIcon(selectedNotification.type).bg}`}>
                        {(() => {
                          const { IconComponent, color } = getTypeIcon(selectedNotification.type)
                          return <IconComponent className={`h-8 w-8 ${color}`} />
                        })()}
                      </div>
                      <div>
                        <h4 className="font-medium text-lg">{selectedNotification.title}</h4>
                        <p className="text-gray-600">{selectedNotification.recipient}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {getPriorityBadge(selectedNotification.priority)}
                          {getStatusBadge(selectedNotification.status)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Date de crÃ©ation:</span>
                        <span className="font-medium">{formatDate(selectedNotification.date)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Canal:</span>
                        <Badge variant="outline">{selectedNotification.channel}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">CatÃ©gorie:</span>
                        <span className="font-medium">{selectedNotification.category}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Type de destinataire:</span>
                        <span className="font-medium">{selectedNotification.recipientType}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contenu du message */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Message</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-800 leading-relaxed text-lg">
                      {selectedNotification.message}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Tags et mÃ©tadonnÃ©es */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">MÃ©tadonnÃ©es</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Tags */}
                    <div>
                      <h5 className="font-medium mb-2">Tags associÃ©s:</h5>
                      <div className="flex flex-wrap gap-2">
                        {selectedNotification.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-sm">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* MÃ©tadonnÃ©es techniques */}
                    {selectedNotification.metadata && Object.keys(selectedNotification.metadata).length > 0 && (
                      <div>
                        <h5 className="font-medium mb-2">DÃ©tails techniques:</h5>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="grid grid-cols-2 gap-4">
                            {Object.entries(selectedNotification.metadata).map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="text-gray-600 font-medium">{key}:</span>
                                <span className="font-mono text-sm">{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Informations de livraison */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div className="text-center">
                        <div className="text-sm text-gray-600">EnvoyÃ©e le</div>
                        <div className="font-medium">{formatDate(selectedNotification.date)}</div>
                      </div>
                      {selectedNotification.deliveredAt && (
                        <div className="text-center">
                          <div className="text-sm text-gray-600">LivrÃ©e le</div>
                          <div className="font-medium">{formatDate(selectedNotification.deliveredAt)}</div>
                        </div>
                      )}
                      {selectedNotification.readAt && (
                        <div className="text-center">
                          <div className="text-sm text-gray-600">Lue le</div>
                          <div className="font-medium">{formatDate(selectedNotification.readAt)}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>


      {/* Modal d'Ã©dition des emails transactionnels */}
      <Dialog open={showEditEmailModal} onOpenChange={setShowEditEmailModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Modifier l'Email Transactionnel
            </DialogTitle>
          </DialogHeader>
          
          {selectedEmail && (
            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
              {/* Informations de base */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informations de Base</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="emailTitle">Titre</Label>
                      <Input
                        id="emailTitle"
                        placeholder="Titre de l'email"
                        defaultValue={selectedEmail.title}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="emailTemplate">Template</Label>
                      <Input
                        id="emailTemplate"
                        placeholder="Nom du template"
                        defaultValue={selectedEmail.template}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="emailStatus">Statut</Label>
                      <Select defaultValue={selectedEmail.active ? 'active' : 'inactive'}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Actif</SelectItem>
                          <SelectItem value="inactive">Inactif</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="emailPriority">PrioritÃ©</Label>
                      <Select defaultValue="normal">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Faible</SelectItem>
                          <SelectItem value="normal">Normale</SelectItem>
                          <SelectItem value="high">Ã‰levÃ©e</SelectItem>
                          <SelectItem value="urgent">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="emailSubject">Sujet par dÃ©faut</Label>
                    <Input
                      id="emailSubject"
                      placeholder="Sujet de l'email"
                      defaultValue={`${selectedEmail.title} - ProBooster`}
                    />
                  </div>
                  
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="emailContent">Contenu par dÃ©faut</Label>
                    <Textarea
                      id="emailContent"
                      placeholder="Contenu de l'email..."
                      rows={4}
                      defaultValue={`Template pour ${selectedEmail.title.toLowerCase()}`}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* ParamÃ¨tres d'envoi */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">ParamÃ¨tres d'Envoi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="emailDelay">DÃ©lai d'envoi (minutes)</Label>
                      <Input
                        id="emailDelay"
                        type="number"
                        placeholder="0"
                        defaultValue="0"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="emailRetry">Tentatives de renvoi</Label>
                      <Input
                        id="emailRetry"
                        type="number"
                        placeholder="3"
                        defaultValue="3"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="emailExpiry">Expiration (heures)</Label>
                      <Input
                        id="emailExpiry"
                        type="number"
                        placeholder="24"
                        defaultValue="24"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 pt-2">
                        <Switch id="emailTracking" defaultChecked />
                        <Label htmlFor="emailTracking">Suivi d'ouverture</Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowEditEmailModal(false)}>
              Annuler
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700" 
              onClick={() => {
                addNotification({
                  type: 'success',
                  title: 'Email modifiÃ©',
                  message: `L'email ${selectedEmail?.title} a Ã©tÃ© modifiÃ© avec succÃ¨s`
                })
                setShowEditEmailModal(false)
              }}
            >
              <Edit className="h-4 w-4 mr-1" />
              Sauvegarder
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal d'Ã©dition des emails marketing */}
      <Dialog open={showEditEmailMarketingModal} onOpenChange={setShowEditEmailMarketingModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Configurer l'Email Marketing
            </DialogTitle>
          </DialogHeader>
          
          {selectedEmailMarketing && (
            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
              {/* Informations de base */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informations de Base</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="marketingTitle">Titre</Label>
                      <Input
                        id="marketingTitle"
                        placeholder="Titre de l'email"
                        defaultValue={selectedEmailMarketing.title}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="marketingFrequency">FrÃ©quence</Label>
                      <Select defaultValue={selectedEmailMarketing.frequency.toLowerCase()}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="quotidienne">Quotidienne</SelectItem>
                          <SelectItem value="hebdomadaire">Hebdomadaire</SelectItem>
                          <SelectItem value="mensuelle">Mensuelle</SelectItem>
                          <SelectItem value="trimestrielle">Trimestrielle</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="marketingStatus">Statut</Label>
                      <Select defaultValue={selectedEmailMarketing.active ? 'active' : 'inactive'}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Actif</SelectItem>
                          <SelectItem value="inactive">Inactif</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="marketingType">Type</Label>
                      <Select defaultValue="newsletter">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="newsletter">Newsletter</SelectItem>
                          <SelectItem value="promotion">Promotion</SelectItem>
                          <SelectItem value="nouveaute">NouveautÃ©</SelectItem>
                          <SelectItem value="evenement">Ã‰vÃ©nement</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="marketingSubject">Sujet par dÃ©faut</Label>
                    <Input
                      id="marketingSubject"
                      placeholder="Sujet de l'email"
                      defaultValue={`${selectedEmailMarketing.title} - ProBooster`}
                    />
                  </div>
                  
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="marketingContent">Contenu par dÃ©faut</Label>
                    <Textarea
                      id="marketingContent"
                      placeholder="Contenu de l'email..."
                      rows={4}
                      defaultValue={`Contenu pour ${selectedEmailMarketing.title.toLowerCase()}`}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Planification */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Planification</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="marketingDay">Jour d'envoi</Label>
                      <Select defaultValue="monday">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monday">Lundi</SelectItem>
                          <SelectItem value="tuesday">Mardi</SelectItem>
                          <SelectItem value="wednesday">Mercredi</SelectItem>
                          <SelectItem value="thursday">Jeudi</SelectItem>
                          <SelectItem value="friday">Vendredi</SelectItem>
                          <SelectItem value="saturday">Samedi</SelectItem>
                          <SelectItem value="sunday">Dimanche</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="marketingTime">Heure d'envoi</Label>
                      <Input
                        id="marketingTime"
                        type="time"
                        defaultValue="09:00"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="marketingTimezone">Fuseau horaire</Label>
                      <Select defaultValue="Europe/Paris">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Europe/Paris">Europe/Paris</SelectItem>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="America/New_York">America/New_York</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 pt-2">
                        <Switch id="marketingAuto" defaultChecked />
                        <Label htmlFor="marketingAuto">Envoi automatique</Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Audience */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Audience</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="marketingAudience">Audience cible</Label>
                      <Select defaultValue="all">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les utilisateurs</SelectItem>
                          <SelectItem value="vendors">Vendeurs uniquement</SelectItem>
                          <SelectItem value="buyers">Acheteurs uniquement</SelectItem>
                          <SelectItem value="premium">Utilisateurs premium</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="marketingSegments">Segments spÃ©cifiques</Label>
                      <Input
                        id="marketingSegments"
                        placeholder="Ex: nouveaux_inscrits, clients_actifs"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="marketingExclusions">Exclusions</Label>
                      <Input
                        id="marketingExclusions"
                        placeholder="Ex: clients_inactifs, desabonnes"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowEditEmailMarketingModal(false)}>
              Annuler
            </Button>
            <Button 
              className="bg-purple-600 hover:bg-purple-700" 
              onClick={() => {
                addNotification({
                  type: 'success',
                  title: 'Email configurÃ©',
                  message: `L'email ${selectedEmailMarketing?.title} a Ã©tÃ© configurÃ© avec succÃ¨s`
                })
                setShowEditEmailMarketingModal(false)
              }}
            >
              <Target className="h-4 w-4 mr-2" />
              Sauvegarder
            </Button>
          </div>
        </DialogContent>
      </Dialog>


      <Dialog
        open={showEmailTemplateModal}
        onOpenChange={(open) => {
          setShowEmailTemplateModal(open)
          if (!open) setEditingEmailTemplate(null)
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              {editingEmailTemplate ? 'Modifier le Template Email' : 'Nouveau Template Email'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tplKey">Key (unique)</Label>
                    <Input
                      id="tplKey"
                      value={emailTemplateForm.key}
                      onChange={(e) =>
                        setEmailTemplateForm((prev) => ({
                          ...prev,
                          key: e.target.value
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tplName">Nom</Label>
                    <Input
                      id="tplName"
                      value={emailTemplateForm.name}
                      onChange={(e) =>
                        setEmailTemplateForm((prev) => ({
                          ...prev,
                          name: e.target.value
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tplCategory">CatÃ©gorie</Label>
                    <Select
                      value={emailTemplateForm.category}
                      onValueChange={(value) =>
                        setEmailTemplateForm((prev) => ({
                          ...prev,
                          category: value as any
                        }))
                      }
                    >
                      <SelectTrigger id="tplCategory">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="transactional">Transactionnel</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="system">SystÃ¨me</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 pt-2">
                      <Switch
                        id="tplActive"
                        checked={emailTemplateForm.isActive}
                        onCheckedChange={(checked) =>
                          setEmailTemplateForm((prev) => ({
                            ...prev,
                            isActive: checked
                          }))
                        }
                      />
                      <Label htmlFor="tplActive">Actif</Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <Label htmlFor="tplSubject">Sujet</Label>
                  <Input
                    id="tplSubject"
                    value={emailTemplateForm.subject}
                    onChange={(e) =>
                      setEmailTemplateForm((prev) => ({
                        ...prev,
                        subject: e.target.value
                      }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contenu</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="tplHtml">HTML (optionnel)</Label>
                  <Textarea
                    id="tplHtml"
                    rows={6}
                    value={emailTemplateForm.html}
                    onChange={(e) =>
                      setEmailTemplateForm((prev) => ({
                        ...prev,
                        html: e.target.value
                      }))
                    }
                    placeholder="<h1>Bonjour</h1>..."
                  />
                </div>

                <div className="space-y-2 mt-4">
                  <Label htmlFor="tplText">Texte (optionnel)</Label>
                  <Textarea
                    id="tplText"
                    rows={6}
                    value={emailTemplateForm.text}
                    onChange={(e) =>
                      setEmailTemplateForm((prev) => ({
                        ...prev,
                        text: e.target.value
                      }))
                    }
                    placeholder="Version texte..."
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setShowEmailTemplateModal(false)
                setEditingEmailTemplate(null)
              }}
            >
              Annuler
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => void saveEmailTemplate()}>
              <Mail className="h-4 w-4 mr-2" />
              Sauvegarder
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de configuration globale */}
      <Dialog open={showGlobalConfigModal} onOpenChange={setShowGlobalConfigModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuration Globale des Notifications
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 max-h-[70vh] overflow-y-auto">
            {/* ParamÃ¨tres gÃ©nÃ©raux */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ParamÃ¨tres GÃ©nÃ©raux</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">Notifications en temps rÃ©el</Label>
                        <p className="text-xs text-gray-600">Activer les notifications instantanÃ©es</p>
                      </div>
                      <Switch
                        checked={globalNotificationsConfig.realtimeEnabled}
                        onCheckedChange={(checked) =>
                          setGlobalNotificationsConfig((prev) => ({ ...prev, realtimeEnabled: checked }))
                        }
                        disabled={isLoadingGlobalNotificationsConfig || isSavingGlobalNotificationsConfig}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">Mode silencieux</Label>
                        <p className="text-xs text-gray-600">DÃ©sactiver entre 22h et 8h</p>
                      </div>
                      <Switch
                        checked={globalNotificationsConfig.quietHoursEnabled}
                        onCheckedChange={(checked) =>
                          setGlobalNotificationsConfig((prev) => ({ ...prev, quietHoursEnabled: checked }))
                        }
                        disabled={isLoadingGlobalNotificationsConfig || isSavingGlobalNotificationsConfig}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">Limite quotidienne</Label>
                        <p className="text-xs text-gray-600">Max 50 notifications par jour</p>
                      </div>
                      <Switch
                        checked={globalNotificationsConfig.dailyLimitEnabled}
                        onCheckedChange={(checked) =>
                          setGlobalNotificationsConfig((prev) => ({ ...prev, dailyLimitEnabled: checked }))
                        }
                        disabled={isLoadingGlobalNotificationsConfig || isSavingGlobalNotificationsConfig}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="maxNotifications">Maximum de notifications</Label>
                      <Input
                        id="maxNotifications"
                        type="number"
                        placeholder="50"
                        value={String(globalNotificationsConfig.maxNotificationsPerDay)}
                        onChange={(e) =>
                          setGlobalNotificationsConfig((prev) => ({
                            ...prev,
                            maxNotificationsPerDay: Number(e.target.value ?? 0) || 0
                          }))
                        }
                        disabled={isLoadingGlobalNotificationsConfig || isSavingGlobalNotificationsConfig}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Fuseau horaire</Label>
                      <Select
                        value={globalNotificationsConfig.timezone}
                        onValueChange={(value) =>
                          setGlobalNotificationsConfig((prev) => ({ ...prev, timezone: value }))
                        }
                        disabled={isLoadingGlobalNotificationsConfig || isSavingGlobalNotificationsConfig}
                      >
                        <SelectTrigger id="timezone">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Europe/Paris">Europe/Paris</SelectItem>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="America/New_York">America/New_York</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* IntÃ©grations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">IntÃ©grations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Globe className="h-5 w-5 text-blue-600" />
                        <span>Web Push</span>
                      </div>
                      <Switch
                        checked={globalNotificationsConfig.integrations.webPush}
                        onCheckedChange={(checked) =>
                          setGlobalNotificationsConfig((prev) => ({
                            ...prev,
                            integrations: { ...prev.integrations, webPush: checked }
                          }))
                        }
                        disabled={isLoadingGlobalNotificationsConfig || isSavingGlobalNotificationsConfig}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Smartphone className="h-5 w-5 text-green-600" />
                        <span>Mobile Push</span>
                      </div>
                      <Switch
                        checked={globalNotificationsConfig.integrations.mobilePush}
                        onCheckedChange={(checked) =>
                          setGlobalNotificationsConfig((prev) => ({
                            ...prev,
                            integrations: { ...prev.integrations, mobilePush: checked }
                          }))
                        }
                        disabled={isLoadingGlobalNotificationsConfig || isSavingGlobalNotificationsConfig}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <MessageCircle className="h-5 w-5 text-purple-600" />
                        <span>SMS</span>
                      </div>
                      <Switch
                        checked={globalNotificationsConfig.integrations.sms}
                        onCheckedChange={(checked) =>
                          setGlobalNotificationsConfig((prev) => ({
                            ...prev,
                            integrations: { ...prev.integrations, sms: checked }
                          }))
                        }
                        disabled={isLoadingGlobalNotificationsConfig || isSavingGlobalNotificationsConfig}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-5 w-5 text-orange-600" />
                        <span>Email</span>
                      </div>
                      <Switch
                        checked={globalNotificationsConfig.integrations.email}
                        onCheckedChange={(checked) =>
                          setGlobalNotificationsConfig((prev) => ({
                            ...prev,
                            integrations: { ...prev.integrations, email: checked }
                          }))
                        }
                        disabled={isLoadingGlobalNotificationsConfig || isSavingGlobalNotificationsConfig}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Bell className="h-5 w-5 text-red-600" />
                        <span>In-App</span>
                      </div>
                      <Switch
                        checked={globalNotificationsConfig.integrations.inApp}
                        onCheckedChange={(checked) =>
                          setGlobalNotificationsConfig((prev) => ({
                            ...prev,
                            integrations: { ...prev.integrations, inApp: checked }
                          }))
                        }
                        disabled={isLoadingGlobalNotificationsConfig || isSavingGlobalNotificationsConfig}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Templates de Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium">Template de bienvenue</p>
                      <p className="text-sm text-gray-600">Email de bienvenue pour nouveaux utilisateurs</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openGlobalEmailTemplate({ key: 'welcome_template', name: 'Template de bienvenue', category: 'transactional' })}
                    >
                      Modifier
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium">Template de commande</p>
                      <p className="text-sm text-gray-600">Confirmation de commande</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openGlobalEmailTemplate({ key: 'order_template', name: 'Template de commande', category: 'transactional' })}
                    >
                      Modifier
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium">Template de sÃ©curitÃ©</p>
                      <p className="text-sm text-gray-600">Alertes de sÃ©curitÃ©</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openGlobalEmailTemplate({ key: 'security_template', name: 'Template de sÃ©curitÃ©', category: 'system' })}
                    >
                      Modifier
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowGlobalConfigModal(false)}>
              Annuler
            </Button>
            <Button 
              className="bg-purple-600 hover:bg-purple-700" 
              onClick={() => void saveGlobalNotificationsConfig()}
              disabled={isSavingGlobalNotificationsConfig || isLoadingGlobalNotificationsConfig}
            >
              <Settings className="h-4 w-4 mr-2" />
              {isSavingGlobalNotificationsConfig ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de crÃ©ation de notification */}
      <Dialog
        open={showCreateNotificationModal}
        onOpenChange={(open) => {
          setShowCreateNotificationModal(open)
          if (!open) setEditNotificationId(null)
        }}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              {editNotificationId ? 'Modifier la Notification' : 'Nouvelle Notification'}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2 -mr-2">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newTitle">Titre</Label>
                  <Input
                    id="newTitle"
                    value={createNotificationForm.title}
                    onChange={(e) =>
                      setCreateNotificationForm((prev) => ({
                        ...prev,
                        title: e.target.value
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newChannel">Canal</Label>
                  <Select
                    value={createNotificationForm.channel}
                    onValueChange={(value) =>
                      setCreateNotificationForm((prev) => ({
                        ...prev,
                        channel: value
                      }))
                    }
                    disabled={Boolean(editNotificationId) || isLoadingGlobalChannelsEnabled}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in-app" disabled={!globalChannelsEnabled.inApp}>
                        In-App
                      </SelectItem>
                      <SelectItem value="email" disabled={!globalChannelsEnabled.email}>
                        Email
                      </SelectItem>
                      <SelectItem value="push" disabled={!globalChannelsEnabled.push}>
                        Push
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newRecipient">Destinataire(s)</Label>
                <Input
                  id="newRecipient"
                  placeholder="admin@probooster.com, support@probooster.com"
                  value={createNotificationForm.recipientEmail}
                  onChange={(e) =>
                    setCreateNotificationForm((prev) => ({
                      ...prev,
                      recipientEmail: e.target.value
                    }))
                  }
                  disabled={Boolean(editNotificationId)}
                />
                <div className="text-xs text-gray-500">SÃ©pare plusieurs emails par virgule ou point-virgule.</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newType">Type</Label>
                  <Select
                    value={createNotificationForm.type}
                    onValueChange={(value) =>
                      setCreateNotificationForm((prev) => ({
                        ...prev,
                        type: value
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">SystÃ¨me</SelectItem>
                      <SelectItem value="order">Commande</SelectItem>
                      <SelectItem value="payment">Paiement</SelectItem>
                      <SelectItem value="alert">Alerte</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="security">SÃ©curitÃ©</SelectItem>
                      {createNotificationForm.type &&
                        ![
                          'system',
                          'order',
                          'payment',
                          'alert',
                          'marketing',
                          'security'
                        ].includes(createNotificationForm.type) && (
                          <SelectItem value={createNotificationForm.type}>{createNotificationForm.type}</SelectItem>
                        )}
                    </SelectContent>
                  </Select>
                </div>

              <div className="space-y-2">
                <Label htmlFor="newPriority">PrioritÃ©</Label>
                <Select
                  value={createNotificationForm.priority}
                  onValueChange={(value) =>
                    setCreateNotificationForm((prev) => ({
                      ...prev,
                      priority: value
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Faible</SelectItem>
                    <SelectItem value="medium">Moyenne</SelectItem>
                    <SelectItem value="high">Ã‰levÃ©e</SelectItem>
                    <SelectItem value="critical">Critique</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newMessage">Message</Label>
              <Textarea
                id="newMessage"
                rows={5}
                value={createNotificationForm.message}
                onChange={(e) =>
                  setCreateNotificationForm((prev) => ({
                    ...prev,
                    message: e.target.value
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newActionUrl">Action URL (optionnel)</Label>
              <Input
                id="newActionUrl"
                placeholder="https://..."
                value={(createNotificationForm as any).actionUrl ?? ''}
                onChange={(e) =>
                  setCreateNotificationForm((prev: any) => ({
                    ...prev,
                    actionUrl: e.target.value
                  }))
                }
              />
            </div>
            </div>
          </div>

          <div className="flex-shrink-0 flex justify-end gap-2 pt-4 border-t bg-white">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateNotificationModal(false)
                setEditNotificationId(null)
              }}
            >
              Annuler
            </Button>
            <Button
              className="bg-purple-600 hover:bg-purple-700"
              onClick={createNotification}
              disabled={isCreatingNotification}
            >
              <Bell className="h-4 w-4 mr-2" />
              {editNotificationId ? 'Sauvegarder' : 'CrÃ©er'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
