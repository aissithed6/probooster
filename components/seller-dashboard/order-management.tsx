"use client"

import { useRef, useState, useEffect, useMemo } from 'react'
import { 
  Search, Eye, Edit, Download, Package, Truck, 
  CheckCircle, XCircle, DollarSign, User, MapPin, 
  Phone, Mail, FileText, Printer, Star, RefreshCw, 
  CheckCircle2, Package2, Settings,
  TrendingUp, BarChart3, PieChart, Calendar, Filter,
  AlertTriangle, Clock, AlertCircle, Info, Zap,
  Target, Award, Trophy, TrendingDown, Users,
  MessageSquare, Bell, CreditCard, Smartphone,
  Shield, AlertCircle as AlertCircleIcon, Copy, Share, Receipt, Archive, Trash2, Save
} from 'lucide-react'

// Icônes officielles des réseaux sociaux
import { 
  FaWhatsapp, 
  FaFacebook, 
  FaTwitter, 
  FaLinkedin, 
  FaInstagram,
  FaTelegram,
  FaDiscord
} from 'react-icons/fa'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { useConfirm } from '@/components/ui/confirm-dialog'

import { SellerOrder } from './types'
import {
  type SuperAdminOrderPaymentPayload,
  type SuperAdminOrderReturnPayload,
  type SuperAdminOrderDisputePayload
} from '@/lib/services/super-admin-order-service'
import { SellerDashboardService } from '@/lib/services/seller-dashboard-service'
import { isProductEligibleForFreeShippingLabel, type FreeShippingConfig } from '@/lib/utils/free-shipping-eligibility'

interface OrderManagementProps {
  vendorId: string
  orders: SellerOrder[]
  onOrderUpdate: (order: SellerOrder) => void
  onOrderStatusChange: (orderId: string, status: SellerOrder['status']) => void
  onPaymentRequest?: (orderId: string) => void
  onCustomerValidation?: (orderId: string) => void
}

interface OrderAnalytics {
  daily: { date: string; revenue: number; orders: number }[]
  weekly: { week: string; revenue: number; orders: number }[]
  monthly: { month: string; revenue: number; orders: number }[]
}

interface MarketplaceRanking {
  position: number
  totalVendors: number
  salesVolume: number
  sharesCount: number
  productViews: number
  category: string
  trend: 'up' | 'down' | 'stable'
}

type AnalyticsPeriod = 'daily' | 'weekly' | 'monthly'
type DateRange = { start: Date; end: Date }
type NotificationItem = {
  id: string
  title: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  timestamp: Date
}

export default function OrderManagement({ 
  vendorId,
  orders, 
  onOrderUpdate, 
  onOrderStatusChange,
  onPaymentRequest,
  onCustomerValidation
}: OrderManagementProps) {
  const timeoutsRef = useRef<Array<ReturnType<typeof setTimeout>>>([])
  const intervalsRef = useRef<Array<ReturnType<typeof setInterval>>>([])

  const scheduleTimeout = (cb: () => void, delay: number) => {
    const id = setTimeout(cb, delay)
    timeoutsRef.current.push(id)
    return id
  }

  /**
   * Résout un litige côté vendeur (persisté en base via /api/vendor/disputes PATCH).
   */
  const handleResolveDispute = async (disputeId: string) => {
    if (!disputeId) return

    try {
      setIsLoading(true)

      const accessToken = await SellerDashboardService.getAccessToken()
      const headers: Record<string, string> = {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
      if (accessToken) headers.Authorization = `Bearer ${accessToken}`

      const resp = await fetch('/api/vendor/disputes', {
        method: 'PATCH',
        headers,
        credentials: 'include',
        body: JSON.stringify({ id: disputeId, status: 'resolved' })
      })

      const body = await resp.json().catch(() => ({}))
      if (!resp.ok) {
        const message = typeof (body as any)?.error === 'string' ? (body as any).error : 'Impossible de résoudre le litige.'
        throw new Error(message)
      }

      const updated = (body as any)?.data
      if (updated) {
        setVendorDisputes((prev) => (Array.isArray(prev)
          ? prev.map((d) => (String((d as any)?.id) === String(disputeId) ? { ...d, ...updated } : d))
          : prev
        ))
      }

      setSelectedDispute((prev) => (prev && String(prev.id) === String(disputeId)
        ? { ...prev, status: 'résolu', resolvedAt: new Date().toISOString() }
        : prev
      ))

      showNotification('Litige résolu', 'Le litige a été marqué comme résolu.', 'success')
    } catch (error) {
      console.error('❌ Résolution litige impossible', error)
      const message = error instanceof Error ? error.message : 'Impossible de résoudre le litige.'
      showNotification('Erreur', message, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const safeCopyToClipboard = async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
        return true
      }
    } catch {
      // ignore and try fallback
    }

    try {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.setAttribute('readonly', 'true')
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      textarea.style.left = '-9999px'
      textarea.style.top = '0'
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      const ok = document.execCommand('copy')
      safeRemoveFromBody(textarea)
      return ok
    } catch {
      return false
    }
  }

  const scrollToOrdersList = () => {
    const run = () => {
      document.getElementById('orders-list')?.scrollIntoView({ behavior: 'smooth' })
    }
    scheduleTimeout(run, 50)
    scheduleTimeout(run, 250)
  }

  const scheduleInterval = (cb: () => void, delay: number) => {
    const id = setInterval(cb, delay)
    intervalsRef.current.push(id)
    return id
  }

  const safeRemoveFromBody = (node: Node) => {
    try {
      if (node && (node as any).parentNode === document.body) {
        document.body.removeChild(node)
      }
    } catch {
      // ignore
    }
  }

  const safeDownloadFile = (content: BlobPart, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    safeRemoveFromBody(link)
    window.URL.revokeObjectURL(url)
  }

  /**
   * Formate un nombre avec toFixed de manière sûre (évite les crashs si undefined/NaN).
   */
  const safeToFixed = (value: unknown, digits: number, fallback: number = 0) => {
    const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
    const safe = Number.isFinite(n) ? n : fallback
    return safe.toFixed(digits)
  }
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [paymentFilter, setPaymentFilter] = useState<string>('all')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all')
  const [minAmountFilter, setMinAmountFilter] = useState<string>('')
  const [maxAmountFilter, setMaxAmountFilter] = useState<string>('')
  const [dateStartFilter, setDateStartFilter] = useState<string>('')
  const [dateEndFilter, setDateEndFilter] = useState<string>('')
  const [selectedOrder, setSelectedOrder] = useState<SellerOrder | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [isLoading, setIsLoading] = useState(false)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [isOrderDetailsSyncLoading, setIsOrderDetailsSyncLoading] = useState(false)
  const [selectedOrdersForBulkAction, setSelectedOrdersForBulkAction] = useState<string[]>([])
  const [showBulkActionsModal, setShowBulkActionsModal] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const { confirm } = useConfirm()
  const [isSettingsLoading, setIsSettingsLoading] = useState(false)
  const [freeShippingConfig, setFreeShippingConfig] = useState<FreeShippingConfig | null>(null)
  const [vendorDashboardSettings, setVendorDashboardSettings] = useState<{
    notifications: Record<string, any>
    ai: Record<string, any>
  }>({ notifications: {}, ai: {} })

  /**
   * Charge la configuration publique de livraison (incluant les règles de livraison gratuite).
   */
  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const resp = await fetch('/api/public/delivery-config', { method: 'GET', cache: 'no-store' }).catch(() => null)
        if (!resp?.ok) return
        const json = await resp.json().catch(() => null)
        const cfg =
          (json as any)?.deliveryConfig?.freeShippingConfig ??
          (json as any)?.deliveryConfig?.free_shipping_config ??
          (json as any)?.freeShippingConfig ??
          (json as any)?.free_shipping_config ??
          (json as any)?.settings?.freeShippingConfig ??
          (json as any)?.settings?.free_shipping_config ??
          null
        if (!cancelled) {
          setFreeShippingConfig(cfg)
        }
      } catch {
        // ignore
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  /**
   * Détermine si un produit (ligne de commande) est éligible à l'affichage du label livraison gratuite.
   */
  const isOrderProductFreeShippingEligible = (p: SellerOrder['products'][number]): boolean => {
    const productId = String((p as any)?.productId ?? '').trim()
    if (!productId) return false

    return isProductEligibleForFreeShippingLabel({
      productId,
      vendorId: typeof (p as any)?.vendorId === 'string' ? (p as any).vendorId : '',
      categoryIds: Array.isArray((p as any)?.categoryIds) ? (p as any).categoryIds : [],
      freeShippingConfig
    })
  }

  /**
   * Lit une valeur booléenne dans vendorDashboardSettings.notifications.
   */
  const getNotificationBool = (key: string, fallback: boolean) => {
    const raw = (vendorDashboardSettings.notifications as any)?.[key]
    return typeof raw === 'boolean' ? raw : fallback
  }

  /**
   * Lit une valeur string dans vendorDashboardSettings.notifications.
   */
  const getNotificationString = (key: string, fallback: string) => {
    const raw = (vendorDashboardSettings.notifications as any)?.[key]
    return typeof raw === 'string' && raw.length > 0 ? raw : fallback
  }

  /**
   * Met à jour vendorDashboardSettings.notifications (merge).
   */
  const updateNotificationSettings = (patch: Record<string, any>) => {
    setVendorDashboardSettings((prev) => ({
      ...prev,
      notifications: {
        ...(prev.notifications ?? {}),
        ...patch
      }
    }))
  }

  /**
   * Lit une valeur booléenne dans vendorDashboardSettings.ai.
   */
  const getAiBool = (key: string, fallback: boolean) => {
    const raw = (vendorDashboardSettings.ai as any)?.[key]
    return typeof raw === 'boolean' ? raw : fallback
  }

  /**
   * Lit une valeur number dans vendorDashboardSettings.ai.
   */
  const getAiNumber = (key: string, fallback: number) => {
    const raw = (vendorDashboardSettings.ai as any)?.[key]
    const n = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw) : NaN
    return Number.isFinite(n) ? n : fallback
  }

  /**
   * Lit une valeur string dans vendorDashboardSettings.ai.
   */
  const getAiString = (key: string, fallback: string) => {
    const raw = (vendorDashboardSettings.ai as any)?.[key]
    return typeof raw === 'string' && raw.trim().length > 0 ? raw : fallback
  }

  /**
   * Met à jour vendorDashboardSettings.ai (merge).
   */
  const updateAiSettings = (patch: Record<string, any>) => {
    setVendorDashboardSettings((prev) => ({
      ...prev,
      ai: {
        ...(prev.ai ?? {}),
        ...patch
      }
    }))
  }
  
  // Nouveaux états pour les fonctionnalités avancées
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false)
  const [showRankingModal, setShowRankingModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showReturnsModal, setShowReturnsModal] = useState(false)
  const [showAllPaymentsModal, setShowAllPaymentsModal] = useState(false)
  const [showDeliveryOptimizationModal, setShowDeliveryOptimizationModal] = useState(false)
  const [showDisputesModal, setShowDisputesModal] = useState(false)
  const [disputeForm, setDisputeForm] = useState({
    type: 'delivery_issue',
    subject: '',
    description: '',
    priority: 'normal',
    assignedTo: '',
    resolution: '',
    metadataNotes: ''
  })

  useEffect(() => {
    return () => {
      for (const id of timeoutsRef.current) {
        clearTimeout(id)
      }
      timeoutsRef.current = []

      for (const id of intervalsRef.current) {
        clearInterval(id)
      }
      intervalsRef.current = []
    }
  }, [])
  const [paymentForm, setPaymentForm] = useState({
    provider: 'bank_transfer',
    reference: '',
    amount: 0,
    accountName: '',
    bankName: '',
    phoneNumber: '',
    notes: ''
  })

  const [allPaymentsRequest, setAllPaymentsRequest] = useState({
    preferredMethod: 'mobile-money',
    urgency: 'normal',
    message: 'Bonjour, nous vous rappelons que votre commande a été livrée avec succès. Merci de procéder au paiement dans les plus brefs délais.'
  })

  const [deliveryOptimizationPrefs, setDeliveryOptimizationPrefs] = useState({
    priority: 'balanced',
    zone: 'national',
    trackingNotifications: true
  })

  const [disputeAiPrefs, setDisputeAiPrefs] = useState({
    enabled: true
  })
  const [showNotificationsModal, setShowNotificationsModal] = useState(false)
  const [showAIConfigModal, setShowAIConfigModal] = useState(false)
  const [showForecastsModal, setShowForecastsModal] = useState(false)
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false)
  const [layoutTab, setLayoutTab] = useState<'orders' | 'overview'>('orders')
  const [showDisputeDetailsModal, setShowDisputeDetailsModal] = useState(false)
  const [showCreateDisputeModal, setShowCreateDisputeModal] = useState(false)
  const [createDisputeForm, setCreateDisputeForm] = useState({
    orderId: '',
    type: 'general',
    priority: 'normal',
    subject: '',
    description: ''
  })
  const [selectedDispute, setSelectedDispute] = useState<{
    id: string
    orderId: string
    type: string
    description: string
    status: 'en_cours' | 'résolu' | 'fermé'
    openedAt: string
    resolvedAt?: string
    customerName: string
    priority: 'normal' | 'urgent' | 'critique'
  } | null>(null)

  const [rankingMode, setRankingMode] = useState<'sales' | 'engagement'>('sales')

  const [rankings, setRankings] = useState<any[]>([])
  const [shareStats, setShareStats] = useState<any | null>(null)
  const [interactionStats, setInteractionStats] = useState<any | null>(null)
  const [vendorDisputes, setVendorDisputes] = useState<any[]>([])
  const [vendorPayments, setVendorPayments] = useState<any[]>([])
  const [vendorDeliveries, setVendorDeliveries] = useState<any[]>([])

  const [vendorDataSyncError, setVendorDataSyncError] = useState<string | null>(null)

  const [isVendorDataLoading, setIsVendorDataLoading] = useState(false)
  const [analyticsPeriod, setAnalyticsPeriod] = useState<AnalyticsPeriod>('daily')
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date()
  })

  useEffect(() => {
    if (!vendorId) return

    let cancelled = false
    const controller = new AbortController()

    const run = async () => {
      setIsVendorDataLoading(true)
      setVendorDataSyncError(null)
      try {
        const accessToken = await SellerDashboardService.getAccessToken()
        const headers: Record<string, string> = { Accept: 'application/json' }
        if (accessToken) headers.Authorization = `Bearer ${accessToken}`

        const [rankingsResp, sharesResp, disputesResp, paymentsResp, deliveriesResp] = await Promise.all([
          fetch('/api/vendor/rankings', { method: 'GET', headers, credentials: 'include', cache: 'no-store', signal: controller.signal }).catch(() => null),
          fetch('/api/vendor/shares-stats', { method: 'GET', headers, credentials: 'include', cache: 'no-store', signal: controller.signal }).catch(() => null),
          fetch('/api/vendor/disputes', { method: 'GET', headers, credentials: 'include', cache: 'no-store', signal: controller.signal }).catch(() => null),
          fetch('/api/vendor/payments', { method: 'GET', headers, credentials: 'include', cache: 'no-store', signal: controller.signal }).catch(() => null),
          fetch('/api/vendor/deliveries', { method: 'GET', headers, credentials: 'include', cache: 'no-store', signal: controller.signal }).catch(() => null)
        ])

        const respOk = (r: Response | null) => Boolean(r && r.ok)
        if (!respOk(rankingsResp) || !respOk(sharesResp) || !respOk(disputesResp) || !respOk(paymentsResp) || !respOk(deliveriesResp)) {
          setVendorDataSyncError('Certaines données vendeur n\'ont pas pu être synchronisées.')
        }

        const settingsPromise = (async () => {
          setIsSettingsLoading(true)
          try {
            const resp = await fetch('/api/vendor/settings', {
              method: 'GET',
              headers,
              credentials: 'include',
              cache: 'no-store',
              signal: controller.signal
            }).catch(() => null)

            if (!resp?.ok) {
              setVendorDataSyncError('Certaines données vendeur n\'ont pas pu être synchronisées.')
              return
            }
            const body = await resp.json().catch(() => null)
            const notifications = (body as any)?.data?.vendorDashboard?.notifications ?? {}
            const ai = (body as any)?.data?.vendorDashboard?.ai ?? {}
            setVendorDashboardSettings({
              notifications: (notifications && typeof notifications === 'object' && !Array.isArray(notifications)) ? notifications : {},
              ai: (ai && typeof ai === 'object' && !Array.isArray(ai)) ? ai : {}
            })
          } finally {
            setIsSettingsLoading(false)
          }
        })()

        if (cancelled) return

        if (rankingsResp?.ok) {
          const body = await rankingsResp.json().catch(() => null)
          setRankings(Array.isArray(body?.data) ? body.data : [])
        }

        if (sharesResp?.ok) {
          const body = await sharesResp.json().catch(() => null)
          setShareStats(body?.data?.shareStats ?? null)
          setInteractionStats(body?.data?.interactionStats ?? null)
        }

        if (disputesResp?.ok) {
          const body = await disputesResp.json().catch(() => null)
          setVendorDisputes(Array.isArray(body?.data) ? body.data : [])
        }

        if (paymentsResp?.ok) {
          const body = await paymentsResp.json().catch(() => null)
          setVendorPayments(Array.isArray(body?.data) ? body.data : [])
        }

        if (deliveriesResp?.ok) {
          const body = await deliveriesResp.json().catch(() => null)
          setVendorDeliveries(Array.isArray(body?.data) ? body.data : [])
        }

        await settingsPromise
      } catch {
        setVendorDataSyncError('Certaines données vendeur n\'ont pas pu être synchronisées.')
      } finally {
        if (!cancelled) setIsVendorDataLoading(false)
      }
    }

    void run()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [vendorId])
  
  // Données simulées pour les analyses et classements
  const orderAnalytics = useMemo<OrderAnalytics>(() => {
    const toISODate = (d: Date) => d.toISOString().split('T')[0]
    const normalizeDay = (d: Date) => {
      const x = new Date(d)
      x.setHours(0, 0, 0, 0)
      return x
    }

    const normalizeMonth = (d: Date) => {
      const x = new Date(d.getFullYear(), d.getMonth(), 1)
      x.setHours(0, 0, 0, 0)
      return x
    }

    const toWeekKey = (d: Date) => {
      const date = normalizeDay(d)
      const day = date.getDay() || 7
      date.setDate(date.getDate() - day + 1)
      return toISODate(date)
    }

    const dailyMap = new Map<string, { revenue: number; orders: number }>()
    const weeklyMap = new Map<string, { revenue: number; orders: number }>()
    const monthlyMap = new Map<string, { revenue: number; orders: number }>()

    for (const o of orders ?? []) {
      const rawDate = (o as any)?.orderDate ?? (o as any)?.createdAt ?? (o as any)?.created_at
      const dateObj = rawDate ? new Date(rawDate) : null
      if (!dateObj || Number.isNaN(dateObj.getTime())) continue

      const revenue = Number((o as any)?.totalAmount ?? 0)
      const dayKey = toISODate(normalizeDay(dateObj))
      const weekKey = toWeekKey(dateObj)
      const monthKey = toISODate(normalizeMonth(dateObj))

      const dRow = dailyMap.get(dayKey) ?? { revenue: 0, orders: 0 }
      dRow.revenue += revenue
      dRow.orders += 1
      dailyMap.set(dayKey, dRow)

      const wRow = weeklyMap.get(weekKey) ?? { revenue: 0, orders: 0 }
      wRow.revenue += revenue
      wRow.orders += 1
      weeklyMap.set(weekKey, wRow)

      const mRow = monthlyMap.get(monthKey) ?? { revenue: 0, orders: 0 }
      mRow.revenue += revenue
      mRow.orders += 1
      monthlyMap.set(monthKey, mRow)
    }

    const daily = Array.from({ length: 30 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (29 - i))
      const key = toISODate(normalizeDay(d))
      const row = dailyMap.get(key) ?? { revenue: 0, orders: 0 }
      return { date: key, revenue: row.revenue, orders: row.orders }
    })

    const weekly = Array.from({ length: 12 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (7 * (11 - i)))
      const weekKey = toWeekKey(d)
      const row = weeklyMap.get(weekKey) ?? { revenue: 0, orders: 0 }
      return { week: `Semaine du ${new Date(weekKey).toLocaleDateString('fr-FR')}`, revenue: row.revenue, orders: row.orders }
    })

    const monthly = Array.from({ length: 12 }, (_, i) => {
      const d = new Date()
      d.setMonth(d.getMonth() - (11 - i), 1)
      const monthKey = toISODate(normalizeMonth(d))
      const row = monthlyMap.get(monthKey) ?? { revenue: 0, orders: 0 }
      return { month: new Date(monthKey).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }), revenue: row.revenue, orders: row.orders }
    })

    return { daily, weekly, monthly }
  }, [orders])

  const forecasts = useMemo(() => {
    const now = new Date()
    const dayMs = 24 * 60 * 60 * 1000
    const startCurrent = new Date(now.getTime() - 30 * dayMs)
    const startPrev = new Date(now.getTime() - 60 * dayMs)

    const inRange = (dRaw: string | undefined | null, start: Date, end: Date) => {
      if (!dRaw) return false
      const t = new Date(dRaw).getTime()
      return Number.isFinite(t) && t >= start.getTime() && t <= end.getTime()
    }

    const currentOrders = orders.filter((o) => inRange(o.orderDate, startCurrent, now))
    const prevOrders = orders.filter((o) => inRange(o.orderDate, startPrev, startCurrent))

    const currentRevenue = currentOrders.reduce((sum, o) => sum + Number(o.totalAmount ?? 0), 0)
    const prevRevenue = prevOrders.reduce((sum, o) => sum + Number(o.totalAmount ?? 0), 0)
    const growthPercent = prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 : 0

    const avgDailyOrders = currentOrders.length / 30
    const avgDailyRevenue = currentRevenue / 30
    const predictedOrders = Math.max(0, Math.round(avgDailyOrders * 30))
    const predictedRevenue = Math.max(0, Math.round(avgDailyRevenue * 30))

    const meanOrderValue = orders.length > 0 ? orders.reduce((s, o) => s + Number(o.totalAmount ?? 0), 0) / orders.length : 0
    const highAmount = orders
      .filter((o) => Number(o.totalAmount ?? 0) > meanOrderValue * 2.5 && Number(o.totalAmount ?? 0) > 0)
      .sort((a, b) => Number(b.totalAmount ?? 0) - Number(a.totalAmount ?? 0))
      .slice(0, 1)

    const returnedCustomers = new Set(orders.filter((o) => o.status === 'returned').map((o) => String(o.customerName ?? '').trim()).filter(Boolean))
    const riskyReturnOrder = orders.find((o) => returnedCustomers.has(String(o.customerName ?? '').trim()) && o.status !== 'returned')

    const criticalDelivery = orders.find((o) => o.status === 'shipped' && o.deliveryDate && new Date() > new Date(o.deliveryDate))

    const anomalies: Array<{ title: string; description: string; severity: 'low' | 'medium' | 'high' }> = []
    if (highAmount[0]) {
      anomalies.push({
        title: `Commande #${getOrderShortNumber(highAmount[0].id)}`,
        description: 'Montant anormalement élevé',
        severity: 'medium'
      })
    }
    if (riskyReturnOrder) {
      anomalies.push({
        title: `Commande #${getOrderShortNumber(riskyReturnOrder.id)}`,
        description: 'Client avec historique de retours',
        severity: 'high'
      })
    }
    if (criticalDelivery) {
      anomalies.push({
        title: `Commande #${getOrderShortNumber(criticalDelivery.id)}`,
        description: 'Délai de livraison critique',
        severity: 'high'
      })
    }

    return {
      growthPercent,
      predictedOrders,
      predictedRevenue,
      anomalies: anomalies.slice(0, 3)
    }
  }, [orders])

  const disputeResolvedPercent = useMemo(() => {
    const total = (vendorDisputes ?? []).length
    if (total <= 0) return 0
    const resolved = (vendorDisputes ?? []).filter((d) => {
      const s = String((d as any)?.status ?? '').toLowerCase()
      return s.includes('resolved') || s.includes('closed') || s.includes('clos') || s.includes('res')
    }).length
    return (resolved / total) * 100
  }, [vendorDisputes])

  useEffect(() => {
    setDeliveryOptimizationPrefs({
      priority: String(getAiString('delivery_priority', 'balanced')),
      zone: String(getAiString('delivery_zone', 'national')),
      trackingNotifications: Boolean(getAiBool('delivery_tracking_notifications', true))
    })

    setDisputeAiPrefs({
      enabled: Boolean(getAiBool('dispute_ai_enabled', true))
    })
  }, [vendorDashboardSettings.ai])

  const marketplaceRanking = useMemo<MarketplaceRanking>(() => {
    const desiredCategory = rankingMode === 'engagement' ? 'engagement' : 'sales'
    const selectedRanking =
      (rankings as any[])?.find((row) => String(row?.category ?? '').toLowerCase() === desiredCategory) ??
      (rankings as any[])?.[0] ??
      null

    const totalVendors = Number(selectedRanking?.total_vendors ?? selectedRanking?.totalVendors ?? 0)
    const positionFromRankings = Number(selectedRanking?.rank_position ?? selectedRanking?.rankPosition ?? 0)
    const category = String(selectedRanking?.category ?? 'Non défini')

    const sharesCount = Number((shareStats as any)?.total_shares ?? (shareStats as any)?.totalShares ?? 0)
    const interactions = Number((interactionStats as any)?.total_interactions ?? (interactionStats as any)?.totalInteractions ?? 0)

    const position = positionFromRankings
    const salesVolume = (orders ?? []).reduce((sum, order) => sum + Number((order as any)?.totalAmount ?? 0), 0)

    return {
      position: Number.isFinite(position) ? position : 0,
      totalVendors: Number.isFinite(totalVendors) ? totalVendors : 0,
      salesVolume: Number.isFinite(salesVolume) ? salesVolume : 0,
      sharesCount: Number.isFinite(sharesCount) ? sharesCount : 0,
      productViews: Number.isFinite(interactions) ? interactions : 0,
      category,
      trend: 'stable'
    }
  }, [interactionStats, orders, rankingMode, rankings, shareStats])

  const pendingPaymentOrders = useMemo(() => {
    return (orders ?? []).filter(order => order.status === 'delivered' && order.paymentStatus === 'pending')
  }, [orders])

  const pendingPaymentTotalAmount = useMemo(() => {
    return pendingPaymentOrders.reduce((sum, order) => sum + Number(order.totalAmount ?? 0), 0)
  }, [pendingPaymentOrders])

  const deliveryMetrics = useMemo(() => {
    const deliveries = vendorDeliveries ?? []
    const total = deliveries.length
    const delivered = deliveries.filter(d => String((d as any)?.status ?? '').toLowerCase() === 'delivered').length
    const cancelled = deliveries.filter(d => String((d as any)?.status ?? '').toLowerCase() === 'cancelled').length
    const inProgress = Math.max(total - delivered - cancelled, 0)

    const deliveredRecords = deliveries.filter(d => {
      const status = String((d as any)?.status ?? '').toLowerCase()
      return status === 'delivered'
    })

    const onTime = deliveredRecords.filter(d => {
      const deliveredAt = (d as any)?.deliveredAt ? new Date(String((d as any).deliveredAt)).getTime() : NaN
      const eta = (d as any)?.eta ? new Date(String((d as any).eta)).getTime() : NaN
      if (!Number.isFinite(deliveredAt) || !Number.isFinite(eta)) return false
      return deliveredAt <= eta
    }).length

    const onTimePercent = deliveredRecords.length > 0 ? (onTime / deliveredRecords.length) * 100 : 0

    const avgDeliveryDays = (() => {
      const durations = deliveredRecords
        .map(d => {
          const dispatchedAt = (d as any)?.dispatchedAt ? new Date(String((d as any).dispatchedAt)).getTime() : NaN
          const deliveredAt = (d as any)?.deliveredAt ? new Date(String((d as any).deliveredAt)).getTime() : NaN
          if (!Number.isFinite(dispatchedAt) || !Number.isFinite(deliveredAt)) return null
          const ms = deliveredAt - dispatchedAt
          if (!Number.isFinite(ms) || ms < 0) return null
          return ms / (1000 * 60 * 60 * 24)
        })
        .filter((v): v is number => typeof v === 'number' && Number.isFinite(v))
      if (durations.length === 0) return null
      return durations.reduce((a, b) => a + b, 0) / durations.length
    })()

    const sample = deliveries[0] ?? null
    const carrierName = String((sample as any)?.carrier?.name ?? (sample as any)?.carrierName ?? '').trim() || null
    const shippingMethodName = String((sample as any)?.shippingMethod?.name ?? (sample as any)?.shipping_method?.name ?? '').trim() || null
    const eta = (sample as any)?.eta ? String((sample as any).eta) : null
    const progressPercent = Number((sample as any)?.progressPercent ?? (sample as any)?.progress_percent ?? 0)

    return {
      total,
      delivered,
      cancelled,
      inProgress,
      onTimePercent,
      avgDeliveryDays,
      carrierName,
      shippingMethodName,
      eta,
      progressPercent: Number.isFinite(progressPercent) ? progressPercent : 0
    }
  }, [vendorDeliveries])

  const disputeMetrics = useMemo(() => {
    const disputes = vendorDisputes ?? []
    const totalOrders = (orders ?? []).length
    const disputeRate = totalOrders > 0 ? (disputes.length / totalOrders) * 100 : 0

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
    const disputesThisMonth = disputes.filter(d => {
      const createdAt = (d as any)?.created_at ?? (d as any)?.createdAt
      const ts = createdAt ? new Date(String(createdAt)).getTime() : NaN
      return Number.isFinite(ts) && ts >= monthStart
    }).length

    const resolutionHours = disputes
      .map(d => {
        const createdAt = (d as any)?.created_at ?? (d as any)?.createdAt
        const resolvedAt = (d as any)?.resolved_at ?? (d as any)?.resolvedAt
        const start = createdAt ? new Date(String(createdAt)).getTime() : NaN
        const end = resolvedAt ? new Date(String(resolvedAt)).getTime() : NaN
        if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null
        return (end - start) / (1000 * 60 * 60)
      })
      .filter((v): v is number => typeof v === 'number' && Number.isFinite(v))

    const avgResolutionHours = resolutionHours.length > 0 ? resolutionHours.reduce((a, b) => a + b, 0) / resolutionHours.length : null

    return {
      disputeRate,
      disputesThisMonth,
      avgResolutionHours
    }
  }, [orders, vendorDisputes])

  const paymentMetrics = useMemo(() => {
    const rows = vendorPayments ?? []
    const total = rows.length
    const completed = rows.filter(p => String((p as any)?.status ?? '').toLowerCase() === 'completed' || String((p as any)?.status ?? '').toLowerCase() === 'paid').length
    const pending = rows.filter(p => String((p as any)?.status ?? '').toLowerCase() === 'pending').length
    const failed = rows.filter(p => String((p as any)?.status ?? '').toLowerCase() === 'failed').length
    const totalAmount = rows.reduce((sum, p) => sum + Number((p as any)?.amount ?? 0), 0)
    const latest = rows[0] ?? null
    return { total, completed, pending, failed, totalAmount, latest }
  }, [vendorPayments])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(amount)
  }

  /**
   * Determine si la commande requiert une livraison physique (heuristique basee sur l'adresse).
   */
  const orderRequiresDelivery = (order: SellerOrder): boolean => {
    const deliveryOption = String((order as any)?.delivery_option ?? (order as any)?.deliveryOption ?? '').trim().toLowerCase()
    if (deliveryOption === 'none') return false

    const shipping = String((order as any)?.shippingAddress ?? '').trim().toLowerCase()
    if (!shipping) return false

    if (shipping.includes('retrait') || shipping.includes('pickup') || shipping.includes('point relais')) {
      return false
    }

    return true
  }

  /**
   * Resolve l'etat d'affichage livraison.
   */
  const resolveDeliveryUiState = (order: SellerOrder): 'delivered' | 'scheduled' | 'needs_delivery' | 'none' => {
    if (!orderRequiresDelivery(order)) return 'none'

    if (order.status === 'delivered') return 'delivered'

    const deliveries = Array.isArray((order as any)?.deliveries) ? ((order as any).deliveries as any[]) : []
    const active = deliveries.find((d) => {
      const status = String((d as any)?.status ?? '').toLowerCase()
      return status.length > 0 && status !== 'cancelled' && status !== 'failed'
    })

    if (!active) return 'needs_delivery'

    const deliveryStatus = String((active as any)?.status ?? '').toLowerCase()
    if (deliveryStatus === 'delivered') return 'delivered'
    return 'scheduled'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  const getOrderShortNumber = (orderId: string) => {
    const cleaned = String(orderId ?? '').replace(/[^a-fA-F0-9]/g, '').toLowerCase()
    if (cleaned.length >= 8) {
      return cleaned.slice(0, 8)
    }
    return String(orderId ?? '').slice(0, 8)
  }

  /**
   * Retourne un identifiant lisible pour l'affichage: displayId (si présent) sinon un raccourci de l'UUID.
   */
  const getOrderDisplayNumber = (order: { id: string; displayId?: string | null }) => {
    const displayId = String(order?.displayId ?? '').trim()
    if (displayId.length > 0) return displayId
    return getOrderShortNumber(String(order?.id ?? ''))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'shipped': return 'bg-blue-100 text-blue-800'
      case 'confirmed': return 'bg-yellow-100 text-yellow-800'
      case 'pending': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'returned': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'refunded': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'Commande payée'
      case 'pending': return 'Commande en attente'
      case 'failed': return 'Paiement échoué'
      case 'refunded': return 'Paiement remboursé'
      default: return String(status || '').trim() || 'Commande en attente'
    }
  }

  const normalizePaymentProvider = (value: unknown) => {
    return String(value ?? '')
      .trim()
      .toLowerCase()
      .replace(/_/g, '-')
      .replace(/\s+/g, '-')
  }

  /**
   * Formatte une adresse (JSON ou chaîne) en libellé lisible pour l’interface.
   */
  const formatShippingAddress = (address: unknown): string => {
    if (!address) return ''

    if (typeof address === 'string') {
      const trimmed = address.trim()
      if (!trimmed) return ''

      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          const parsed = JSON.parse(trimmed)
          return formatShippingAddress(parsed)
        } catch {
          return trimmed
        }
      }

      return trimmed
    }

    if (typeof address === 'object' && address !== null) {
      const candidate = address as Record<string, unknown>

      const parts: string[] = []
      const pushPart = (value: unknown) => {
        if (typeof value !== 'string') return
        const trimmed = value.trim()
        if (!trimmed) return
        parts.push(trimmed)
      }

      pushPart((candidate as any)?.customer_email)
      pushPart((candidate as any)?.customerEmail)
      pushPart((candidate as any)?.customer_phone)
      pushPart((candidate as any)?.customerPhone)

      const deliveryRaw =
        (candidate as any)?.delivery_address ??
        (candidate as any)?.deliveryAddress ??
        null

      if (typeof deliveryRaw === 'string') {
        const trimmed = deliveryRaw.trim()
        if (trimmed.length > 0) parts.push(trimmed)
      }

      if (deliveryRaw && typeof deliveryRaw === 'object') {
        const deliveryObj = deliveryRaw as Record<string, unknown>
        const deliveryParts = [
          deliveryObj.street,
          deliveryObj.address,
          deliveryObj.line1,
          deliveryObj.line2,
          deliveryObj.city,
          deliveryObj.state,
          deliveryObj.region,
          deliveryObj.country,
          deliveryObj.postalCode,
          deliveryObj.postal_code
        ].filter((value): value is string => typeof value === 'string' && value.trim().length > 0)

        if (deliveryParts.length > 0) {
          parts.push(deliveryParts.join(', '))
        }
      }

      const legacyParts = [
        candidate.street,
        candidate.address,
        candidate.line1,
        candidate.line2,
        candidate.city,
        candidate.state,
        candidate.region,
        candidate.country,
        candidate.postalCode,
        candidate.postal_code
      ].filter((value): value is string => typeof value === 'string' && value.trim().length > 0)

      if (legacyParts.length > 0) {
        parts.push(legacyParts.join(', '))
      }

      return parts.length > 0 ? parts.join(', ') : ''
    }

    return ''
  }

  const getOrderPaymentProviderLabel = (order: SellerOrder) => {
    const paymentRow = (vendorPayments ?? []).find(
      (p) => String((p as any)?.order_id ?? (p as any)?.orderId ?? '') === String(order.id)
    )
    const providerFromPayments = String(
      (paymentRow as any)?.provider ?? (paymentRow as any)?.payment_provider ?? (paymentRow as any)?.method ?? ''
    ).trim()
    const reference = String((paymentRow as any)?.reference ?? '').trim()
    if (providerFromPayments) {
      return `${providerFromPayments}${reference ? ` (${reference})` : ''}`
    }

    const providerFromOrder = String(
      (order as any)?.paymentProvider ?? (order as any)?.payment_provider ?? (order as any)?.paymentMethod ?? (order as any)?.payment_method ?? ''
    ).trim()
    return providerFromOrder || 'N/A'
  }

  const getOrderPaymentProviderNormalized = (order: SellerOrder) => {
    const fromPaymentRow = (vendorPayments ?? []).find(p => String((p as any)?.order_id ?? (p as any)?.orderId ?? '') === String(order.id))
    const providerFromPayments = normalizePaymentProvider((fromPaymentRow as any)?.provider ?? (fromPaymentRow as any)?.payment_provider ?? (fromPaymentRow as any)?.method)
    if (providerFromPayments) return providerFromPayments
    const provider = normalizePaymentProvider((order as any)?.paymentProvider ?? (order as any)?.payment_provider ?? (order as any)?.paymentMethod ?? (order as any)?.payment_method)
    return provider
  }

  const filteredOrders = orders.filter(order => {
    const term = searchTerm.toLowerCase().trim()
    const matchesSearch = term.length === 0 ||
      order.customerName.toLowerCase().includes(term) ||
      (getOrderDisplayNumber({ id: order.id, displayId: (order as any)?.displayId }).toLowerCase().includes(term)) ||
      order.id.toLowerCase().includes(term) ||
      (order.products ?? []).some(p => String(p?.name ?? '').toLowerCase().includes(term))
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    const matchesPayment = paymentFilter === 'all' || order.paymentStatus === paymentFilter

    const provider = getOrderPaymentProviderNormalized(order)
    const paymentMethodNeedle = normalizePaymentProvider(paymentMethodFilter)
    const matchesPaymentMethod = paymentMethodNeedle === 'all' || (provider.length > 0 && provider === paymentMethodNeedle)

    const minAmount = minAmountFilter.trim().length > 0 ? Number(minAmountFilter) : NaN
    const maxAmount = maxAmountFilter.trim().length > 0 ? Number(maxAmountFilter) : NaN
    const amount = Number(order.totalAmount ?? 0)
    const matchesMin = !Number.isFinite(minAmount) || amount >= minAmount
    const matchesMax = !Number.isFinite(maxAmount) || amount <= maxAmount

    const start = dateStartFilter ? new Date(`${dateStartFilter}T00:00:00`).getTime() : NaN
    const end = dateEndFilter ? new Date(`${dateEndFilter}T23:59:59`).getTime() : NaN
    const orderTs = order.orderDate ? new Date(order.orderDate).getTime() : NaN
    const matchesStart = !Number.isFinite(start) || (Number.isFinite(orderTs) && orderTs >= start)
    const matchesEnd = !Number.isFinite(end) || (Number.isFinite(orderTs) && orderTs <= end)

    return matchesSearch && matchesStatus && matchesPayment && matchesPaymentMethod && matchesMin && matchesMax && matchesStart && matchesEnd
  })

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    returned: orders.filter(o => o.status === 'returned').length,
    delayed: orders.filter(o => o.status === 'delivered' && o.deliveryDate && new Date(o.deliveryDate) > new Date()).length,
    notDelivered: orders.filter(o => o.status === 'shipped' && o.deliveryDate && new Date() > new Date(o.deliveryDate)).length,
    totalRevenue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
    totalCommissions: orders.reduce((sum, order) => sum + order.commission, 0),
    netRevenue: orders.reduce((sum, order) => sum + order.netRevenue, 0),
    pendingPayments: orders.filter(o => o.status === 'delivered' && o.paymentStatus === 'pending').length,
    averageOrderValue: orders.length > 0 ? orders.reduce((sum, order) => sum + order.totalAmount, 0) / orders.length : 0,
    conversionRate: orders.length > 0 ? (orders.filter(o => o.status === 'delivered').length / orders.length) * 100 : 0
  }

  const handleStatusChange = (orderId: string, newStatus: SellerOrder['status']) => {
    const run = async () => {
      if (!orderId) return
      try {
        setIsActionLoading(true)

        const accessToken = await SellerDashboardService.getAccessToken()
        const headers: Record<string, string> = {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
        if (accessToken) headers.Authorization = `Bearer ${accessToken}`

        const resp =
          newStatus === 'cancelled'
            ? await fetch(`/api/vendor/orders/${orderId}/cancel`, {
                method: 'POST',
                headers,
                credentials: 'include'
              })
            : await fetch(`/api/vendor/orders/${orderId}`, {
                method: 'PATCH',
                headers,
                credentials: 'include',
                body: JSON.stringify({ status: newStatus })
              })

        const body = await resp.json().catch(() => ({}))
        if (!resp.ok) {
          const message = typeof (body as any)?.error === 'string' ? (body as any).error : 'Impossible de mettre à jour le statut.'
          throw new Error(message)
        }

        const updated = (body as any)?.data
        if (updated) {
          onOrderUpdate({ ...(orders.find((o) => String(o?.id) === String(orderId)) as any), ...mapApiOrderToSellerOrder(updated) } as any)
        }

        onOrderStatusChange(orderId, newStatus)
        showNotification('Statut mis à jour', 'Le statut de la commande a été enregistré.', 'success')
      } catch (error) {
        console.error('❌ Mise à jour statut commande vendeur impossible', error)
        const message = error instanceof Error ? error.message : 'Impossible de mettre à jour le statut.'
        showNotification('Erreur', message, 'error')
      } finally {
        setIsActionLoading(false)
      }
    }

    void run()
  }

  const handleViewDisputeDetails = (payload: {
    id: string
    orderId: string
    type: string
    description: string
    status: 'en_cours' | 'résolu' | 'fermé'
    openedAt: string
    resolvedAt?: string
    customerName: string
    priority: 'normal' | 'urgent' | 'critique'
  }) => {
    setSelectedDispute(payload)
    setShowDisputeDetailsModal(true)
  }

  const handleExportOrders = () => {
    setIsLoading(true)
    scheduleTimeout(() => {
      const csvContent = [
        ['ID', 'Client', 'Date', 'Statut', 'Paiement', 'Total'],
        ...filteredOrders.map(order => [
          getOrderDisplayNumber(order),
          order.customerName,
          formatDate(order.orderDate),
          order.status,
          order.paymentStatus,
          formatCurrency(order.totalAmount)
        ])
      ].map(row => row.join(',')).join('\n')

      safeDownloadFile(csvContent, `commandes_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv')
      setIsLoading(false)
      showNotification('Export réussi', 'Fichier CSV téléchargé avec succès', 'success')
    }, 1000)
  }

  const handleExportOrderDetails = (order: SellerOrder) => {
    if (!order) return
    
    const csvContent = [
      ['Détails de la commande'],
      ['ID', order.id],
      ['Client', order.customerName],
      ['Date', formatDate(order.orderDate)],
      ['Statut', order.status],
      ['Paiement', order.paymentStatus],
      ['Total', formatCurrency(order.totalAmount)],
      ['Adresse', order.shippingAddress || 'Non spécifiée'],
      ['Téléphone', order.customerPhone || 'Non spécifié'],
      ['Email', order.customerEmail || 'Non spécifié']
    ].map(row => row.join(',')).join('\n')

    safeDownloadFile(csvContent, `commande_${order.id}_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv')
    
    showNotification('Export réussi', 'Détails de la commande exportés avec succès', 'success')
  }

  const handlePrintReport = () => {
    setIsLoading(true)
    scheduleTimeout(() => {
      const reportContent = `Rapport des commandes - ${new Date().toLocaleDateString('fr-FR')}`
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <html><head><title>Rapport</title></head><body><h1>${reportContent}</h1></body></html>
        `)
        printWindow.document.close()
        printWindow.print()
      }
      setIsLoading(false)
      showNotification('Impression lancée', 'Rapport envoyé à l\'imprimante', 'success')
    }, 1500)
  }

  const handleGenerateInvoices = () => {
    setIsLoading(true)
    scheduleTimeout(() => {
      const invoicesToGenerate = filteredOrders.filter(order => 
        order.status === 'delivered' && order.paymentStatus === 'paid'
      )
      
      if (invoicesToGenerate.length === 0) {
        showNotification('Information', 'Aucune facture à générer', 'info')
        setIsLoading(false)
        return
      }
      
      const invoiceContent = invoicesToGenerate.map(order => 
        `FACTURE ${order.id} - ${order.customerName}`
      ).join('\n')

      safeDownloadFile(invoiceContent, `factures_${new Date().toISOString().split('T')[0]}.txt`, 'text/plain')
      
      setIsLoading(false)
      showNotification('Factures générées', `${invoicesToGenerate.length} facture(s) téléchargée(s)`, 'success')
    }, 2000)
  }

  const handleCancelOrder = async (orderId: string) => {
    const accepted = await confirm({
      title: 'Annuler la commande',
      message: 'Êtes-vous sûr de vouloir annuler cette commande ? Cette action est irréversible.',
      confirmText: 'Annuler la commande',
      cancelText: 'Retour',
      tone: 'destructive'
    })
    if (!accepted) return

    try {
      setIsActionLoading(true)

      const accessToken = await SellerDashboardService.getAccessToken()
      const headers: Record<string, string> = {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
      if (accessToken) headers.Authorization = `Bearer ${accessToken}`

      const resp = await fetch(`/api/vendor/orders/${orderId}/cancel`, {
        method: 'POST',
        headers
      })

      const json = await resp.json().catch(() => ({}))

      if (!resp.ok) {
        const message = typeof json?.error === 'string' && json.error.length > 0
          ? json.error
          : 'Impossible d\'annuler la commande.'
        throw new Error(message)
      }

      onOrderStatusChange(orderId, 'cancelled')
      showNotification('Commande annulée', `La commande ${orderId} a été annulée`, 'warning')
    } catch (error) {
      console.error('❌ Annulation commande vendeur impossible', error)
      const message = error instanceof Error ? error.message : "Impossible d'annuler la commande."
      showNotification('Erreur', message, 'error')
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleReturnOrder = async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId)
    if (!order) return

    const accepted = await confirm({
      title: 'Marquer comme retournée',
      message: 'Êtes-vous sûr de vouloir marquer cette commande comme retournée ? ',
      confirmText: 'Confirmer le retour',
      cancelText: 'Annuler',
      tone: 'destructive'
    })
    if (!accepted) return

    try {
      setIsActionLoading(true)

      const returnPayload: SuperAdminOrderReturnPayload = {
        reason: 'Retour initié par le vendeur',
        status: 'pending',
        items: order.products.map((item) => ({
          orderItemId: String(item.id),
          quantity: item.quantity,
          refundAmount: item.total,
          metadata: {}
        }))
      }

      const updatedOrder = await SellerDashboardService.createSellerOrderReturn(orderId, returnPayload)
      onOrderUpdate({ ...order, ...mapApiOrderToSellerOrder(updatedOrder) })
      showNotification('Retour initié', `La commande ${orderId} a été envoyée en retour.`, 'info')
    } catch (error) {
      console.error('❌ Retour vendeur impossible', error)
      showNotification('Erreur', "Impossible d'initier le retour. Veuillez réessayer.", 'error')
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleRefreshData = () => {
    setIsLoading(true)
    scheduleTimeout(() => {
      setIsLoading(false)
    }, 1000)
  }

  const handleBulkAction = (action: 'confirm' | 'ship' | 'deliver' | 'cancel') => {
    if (selectedOrdersForBulkAction.length === 0) {
      showNotification('Attention', 'Veuillez sélectionner au moins une commande', 'warning')
      return
    }

    const run = async () => {
      try {
        setIsLoading(true)
        setIsActionLoading(true)

        const accessToken = await SellerDashboardService.getAccessToken()
        const headers: Record<string, string> = {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
        if (accessToken) headers.Authorization = `Bearer ${accessToken}`

        const targetStatus: SellerOrder['status'] =
          action === 'confirm'
            ? 'confirmed'
            : action === 'ship'
              ? 'shipped'
              : action === 'deliver'
                ? 'delivered'
                : 'cancelled'

        const results = await Promise.all(
          selectedOrdersForBulkAction.map(async (orderId) => {
            const resp =
              targetStatus === 'cancelled'
                ? await fetch(`/api/vendor/orders/${orderId}/cancel`, {
                    method: 'POST',
                    headers,
                    credentials: 'include'
                  })
                : await fetch(`/api/vendor/orders/${orderId}`, {
                    method: 'PATCH',
                    headers,
                    credentials: 'include',
                    body: JSON.stringify({ status: targetStatus })
                  })

            const body = await resp.json().catch(() => ({}))
            if (!resp.ok) {
              const message = typeof (body as any)?.error === 'string' ? (body as any).error : 'Mise à jour impossible.'
              throw new Error(message)
            }

            return { orderId, updated: (body as any)?.data }
          })
        )

        for (const row of results) {
          if (row.updated) {
            onOrderUpdate({ ...(orders.find((o) => String(o?.id) === String(row.orderId)) as any), ...mapApiOrderToSellerOrder(row.updated) } as any)
          }
          onOrderStatusChange(row.orderId, targetStatus)
        }

        const actionNames = {
          confirm: 'confirmation',
          ship: 'expédition',
          deliver: 'livraison',
          cancel: 'annulation'
        }

        showNotification(
          'Action en lot réussie',
          `${selectedOrdersForBulkAction.length} commande(s) ${actionNames[action]} effectuée(s)`,
          'success'
        )
        setSelectedOrdersForBulkAction([])
        setShowBulkActionsModal(false)
      } catch (error) {
        console.error('❌ Action en lot vendeur impossible', error)
        const message = error instanceof Error ? error.message : "Impossible d'appliquer l'action en lot."
        showNotification('Erreur', message, 'error')
      } finally {
        setIsLoading(false)
        setIsActionLoading(false)
      }
    }

    void run()
  }

  // Nouvelles fonctions pour les fonctionnalités avancées
  const handlePaymentRequest = async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId)
    if (!order) return

    if (onPaymentRequest) {
      onPaymentRequest(orderId)
      return
    }

    setSelectedOrder(order)
    setShowPaymentModal(true)
  }

  const handleCustomerValidation = (orderId: string) => {
    if (onCustomerValidation) {
      onCustomerValidation(orderId)
    } else {
      showNotification('Demande envoyée', 'Demande de validation client envoyée. Le client doit confirmer la réception.', 'info')
    }
  }

  const handleExportAnalytics = (format: 'csv' | 'pdf') => {
    setIsLoading(true)
    scheduleTimeout(() => {
      const analyticsData = orderAnalytics[analyticsPeriod]
      let exportContent = ''
      
      if (format === 'csv') {
        exportContent = [
          ['Période', 'Chiffre d\'affaires', 'Nombre de commandes'],
          ...analyticsData.map(item => [
            'date' in item ? item.date : 'week' in item ? item.week : item.month,
            formatCurrency(item.revenue),
            item.orders.toString()
          ])
        ].map(row => row.join(',')).join('\n')
        
        safeDownloadFile(exportContent, `analytics_${analyticsPeriod}_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv')
      }
      
      setIsLoading(false)
    }, 1500)
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'down': return <TrendingDown className="w-4 h-4 text-red-600" />
      default: return <BarChart3 className="w-4 h-4 text-blue-600" />
    }
  }

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return 'text-green-600'
      case 'down': return 'text-red-600'
      default: return 'text-blue-600'
    }
  }

  // Nouvelles fonctions pour les boutons des cartes de statistiques
  const handleViewAllOrders = () => {
    setLayoutTab('orders')
    setActiveTab('all')
    // Scroll vers la liste des commandes
    scrollToOrdersList()
  }

  const handleViewDeliveredOrders = () => {
    setLayoutTab('orders')
    setStatusFilter('delivered')
    setActiveTab('delivered')
    // Scroll vers la liste des commandes
    scrollToOrdersList()
    showNotification('Filtre appliqué', 'Affichage des commandes livrées', 'info')
  }

  const handleViewShippedOrders = () => {
    setLayoutTab('orders')
    setStatusFilter('shipped')
    setActiveTab('shipped')
    // Scroll vers la liste des commandes
    scrollToOrdersList()
    showNotification('Filtre appliqué', 'Affichage des commandes en transit', 'info')
  }

  const handleViewRevenueDetails = () => {
    setShowAnalyticsModal(true)
  }

  const handleViewPendingPayments = () => {
    setShowPaymentModal(true)
  }

  const handleViewReturns = () => {
    setShowReturnsModal(true)
  }

  const refreshVendorPayments = async () => {
    const accessToken = await SellerDashboardService.getAccessToken()
    const headers: Record<string, string> = { Accept: 'application/json' }
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`

    const resp = await fetch('/api/vendor/payments', {
      method: 'GET',
      headers,
      credentials: 'include',
      cache: 'no-store'
    }).catch(() => null)

    if (!resp?.ok) {
      throw new Error('Impossible de synchroniser les paiements.')
    }

    const body = await resp.json().catch(() => null)
    setVendorPayments(Array.isArray(body?.data) ? body.data : [])
  }

  // Fonction pour actualiser les paiements en attente
  const handleRefreshPendingPayments = () => {
    const run = async () => {
      setIsLoading(true)
      try {
        await refreshVendorPayments()
        showNotification('Actualisation terminée', 'Les données des paiements en attente ont été actualisées', 'success')
      } catch (error) {
        console.error('❌ Actualisation paiements impossible', error)
        const message = error instanceof Error ? error.message : 'Impossible de synchroniser les paiements.'
        showNotification('Erreur', message, 'error')
      } finally {
        setIsLoading(false)
      }
    }

    void run()
  }

  // Fonction pour exporter les paiements en attente
  const handleExportPendingPayments = () => {
    setIsLoading(true)
    scheduleTimeout(() => {
      const pendingOrders = orders.filter(order => order.status === 'delivered' && order.paymentStatus === 'pending')
      const csvContent = [
        'ID Commande,Client,Montant,Date Livraison,Statut Paiement',
        ...pendingOrders.map(order =>
          `${getOrderDisplayNumber(order)},${order.customerName},${order.totalAmount},${order.deliveryDate || 'N/A'},${order.paymentStatus}`
        )
      ].join('\n')

      safeDownloadFile(csvContent, `paiements_en_attente_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;')

      setIsLoading(false)
      showNotification('Export réussi', `Fichier CSV exporté avec ${pendingOrders.length} commande(s)`, 'success')
    }, 1500)
  }

  // Fonction pour demander tous les paiements
  const handleRequestAllPayments = () => {
    setShowPaymentModal(false)
    setShowAllPaymentsModal(true)
  }

  // Fonction pour envoyer toutes les demandes de paiement
  const handleSendAllPaymentRequests = () => {
    const run = async () => {
      setIsLoading(true)
      try {
        const accessToken = await SellerDashboardService.getAccessToken()
        const headers: Record<string, string> = {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
        if (accessToken) headers.Authorization = `Bearer ${accessToken}`

        const pendingOrders = orders.filter(order => order.status === 'delivered' && order.paymentStatus === 'pending')

        await Promise.all(
          pendingOrders.map((order) =>
            fetch('/api/vendor/payments', {
              method: 'POST',
              headers,
              credentials: 'include',
              body: JSON.stringify({
                orderId: order.id,
                provider: allPaymentsRequest.preferredMethod,
                amount: order.totalAmount,
                status: 'pending',
                metadata: {
                  urgency: allPaymentsRequest.urgency,
                  message: allPaymentsRequest.message
                }
              })
            }).then(async (resp) => {
              if (!resp.ok) {
                const body = await resp.json().catch(() => ({}))
                const message = typeof (body as any)?.error === 'string' ? (body as any).error : 'Impossible de créer une demande de paiement.'
                throw new Error(message)
              }
            })
          )
        )

        await refreshVendorPayments()
        setShowAllPaymentsModal(false)
        showNotification('Demandes envoyées', `${pendingOrders.length} demande(s) de paiement envoyée(s) avec succès`, 'success')
      } catch (error) {
        console.error('❌ Envoi demandes paiement impossible', error)
        const message = error instanceof Error ? error.message : 'Impossible de créer les demandes de paiement.'
        showNotification('Erreur', message, 'error')
      } finally {
        setIsLoading(false)
      }
    }

    void run()
  }

  // Fonction pour actualiser les retours
  const handleRefreshReturns = () => {
    const run = async () => {
      try {
        setIsLoading(true)

        const accessToken = await SellerDashboardService.getAccessToken()
        const headers: Record<string, string> = { Accept: 'application/json' }
        if (accessToken) headers.Authorization = `Bearer ${accessToken}`

        const resp = await fetch('/api/vendor/orders/returns?limit=200', {
          method: 'GET',
          headers,
          credentials: 'include',
          cache: 'no-store'
        })

        const body = await resp.json().catch(() => ({}))
        if (!resp.ok) {
          const message = typeof (body as any)?.error === 'string' ? (body as any).error : 'Impossible de synchroniser les retours.'
          throw new Error(message)
        }

        showNotification('Actualisation terminée', 'Les retours ont été synchronisés avec la base.', 'success')
      } catch (error) {
        console.error('❌ Actualisation retours impossible', error)
        const message = error instanceof Error ? error.message : 'Impossible de synchroniser les retours.'
        showNotification('Erreur', message, 'error')
      } finally {
        setIsLoading(false)
      }
    }

    void run()
  }

  // Fonction pour exporter les retours
  const handleExportReturns = () => {
    setIsLoading(true)
    scheduleTimeout(() => {
      const returnedOrders = orders.filter(order => order.status === 'returned')
      const csvContent = [
        'ID Commande,Client,Montant,Raison,Date Retour,Statut',
        ...returnedOrders.map(order => 
          `${order.id},${order.customerName},${order.totalAmount},Produit défectueux,${order.deliveryDate || 'N/A'},En cours`
        )
      ].join('\n')

      safeDownloadFile(csvContent, `retours_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;')
      
      setIsLoading(false)
      showNotification('Export réussi', `Fichier CSV exporté avec ${returnedOrders.length} retour(s)`, 'success')
    }, 1500)
  }

  // Fonction pour traiter tous les retours
  const handleProcessAllReturns = () => {
    const run = async () => {
      try {
        setIsLoading(true)

        const accessToken = await SellerDashboardService.getAccessToken()
        const headers: Record<string, string> = {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
        if (accessToken) headers.Authorization = `Bearer ${accessToken}`

        const resp = await fetch('/api/vendor/orders/returns/process', {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({ fromStatus: 'pending', toStatus: 'in_progress' })
        })

        const body = await resp.json().catch(() => ({}))
        if (!resp.ok) {
          const message = typeof (body as any)?.error === 'string' ? (body as any).error : 'Impossible de traiter les retours.'
          throw new Error(message)
        }

        const updated = Number((body as any)?.data?.updated ?? 0)

        showNotification('Traitement terminé', `${updated} retour(s) traité(s) et mis à jour en base`, 'success')
      } catch (error) {
        console.error('❌ Traitement retours impossible', error)
        const message = error instanceof Error ? error.message : 'Impossible de traiter les retours.'
        showNotification('Erreur', message, 'error')
      } finally {
        setIsLoading(false)
      }
    }

    void run()
  }

  // Fonction: exporter le contenu du modal Analytics Avancés
  const handleExportAnalyticsModal = () => {
    const lines = [
      'Section, Valeur',
      `Total commandes, ${stats.total}`,
      `Chiffre d'affaires, ${formatCurrency(stats.totalRevenue)}`,
      `Taux de conversion, ${stats.conversionRate.toFixed(1)}%`,
      `Panier moyen, ${formatCurrency(stats.averageOrderValue)}`
    ].join('\n')
    safeDownloadFile(lines, `analytics_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;')
    showNotification('Export réussi', 'Rapport Analytics exporté (CSV)', 'success')
  }

  // État pour gérer le partage en cours
  const [isSharing, setIsSharing] = useState(false)

  // Fonction pour partager la commande
  const handleShareOrder = async (order: SellerOrder) => {
    if (isSharing) return // Empêcher les clics multiples
    
    setIsSharing(true)
    const shareText = `Commande ${getOrderDisplayNumber({ id: order.id, displayId: (order as any)?.displayId })} - ${order.customerName} - ${formatCurrency(order.totalAmount)}`
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Détails de la commande',
          text: shareText
        })
        showNotification('Succès', 'Partage de la commande réussi', 'success')
      } else {
        const ok = await safeCopyToClipboard(shareText)
        showNotification(ok ? 'Succès' : 'Erreur', ok ? 'Détails de la commande copiés dans le presse-papiers' : 'Copie impossible sur ce navigateur', ok ? 'success' : 'error')
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        showNotification('Erreur', 'Erreur lors du partage', 'error')
      }
    } finally {
      setIsSharing(false)
    }
  }

  // Fonction pour partager les analytics
  const handleShareAnalytics = async () => {
    if (isSharing) return // Empêcher les clics multiples
    
    setIsSharing(true)
    const analyticsText = `Analytics de vente - CA: ${formatCurrency(stats.totalRevenue)} - ${stats.total} commandes`
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Analytics de vente',
          text: analyticsText
        })
        showNotification('Succès', 'Partage des analytics réussi', 'success')
      } else {
        const ok = await safeCopyToClipboard(analyticsText)
        showNotification(ok ? 'Succès' : 'Erreur', ok ? 'Analytics copiés dans le presse-papiers' : 'Copie impossible sur ce navigateur', ok ? 'success' : 'error')
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        showNotification('Erreur', 'Erreur lors du partage', 'error')
      }
    } finally {
      setIsSharing(false)
    }
  }

  // Fonction pour partager le classement
  const handleShareRanking = async () => {
    if (isSharing) return // Empêcher les clics multiples
    
    setIsSharing(true)
    const rankingLabel = rankingMode === 'engagement' ? 'Engagement' : 'Ventes'
    const rankingText = `Classement marketplace (${rankingLabel}) - Position #${marketplaceRanking.position} sur ${marketplaceRanking.totalVendors} vendeurs`
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Mon classement marketplace',
          text: rankingText
        })
        showNotification('Succès', 'Partage du classement réussi', 'success')
      } else {
        const ok = await safeCopyToClipboard(rankingText)
        showNotification(ok ? 'Succès' : 'Erreur', ok ? 'Classement copié dans le presse-papiers' : 'Copie impossible sur ce navigateur', ok ? 'success' : 'error')
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        showNotification('Erreur', 'Erreur lors du partage', 'error')
      }
    } finally {
      setIsSharing(false)
    }
  }

  // Fonction pour partager les statistiques
  const handleShareStats = async () => {
    if (isSharing) return // Empêcher les clics multiples
    
    setIsSharing(true)
    const statsText = `Statistiques vendeur - ${stats.total} commandes - CA: ${formatCurrency(stats.totalRevenue)}`
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Mes statistiques vendeur',
          text: statsText
        })
        showNotification('Succès', 'Partage des statistiques réussi', 'success')
      } else {
        const ok = await safeCopyToClipboard(statsText)
        showNotification(ok ? 'Succès' : 'Erreur', ok ? 'Statistiques copiées dans le presse-papiers' : 'Copie impossible sur ce navigateur', ok ? 'success' : 'error')
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        showNotification('Erreur', 'Erreur lors du partage', 'error')
      }
    } finally {
      setIsSharing(false)
    }
  }

  // Fonction pour partager sur les réseaux sociaux
  const handleShareOnSocial = (platform: 'facebook' | 'twitter' | 'linkedin' | 'whatsapp', order?: SellerOrder) => {
    let shareUrl = ''
    let shareText = ''
    
    if (order) {
      shareText = `Commande ${getOrderDisplayNumber(order)} - ${order.customerName} - ${formatCurrency(order.totalAmount)}`
    } else {
      shareText = `Statistiques vendeur - ${stats.total} commandes - CA: ${formatCurrency(stats.totalRevenue)}`
    }

    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(shareText)}`
        break
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(window.location.href)}`
        break
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`
        break
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + window.location.href)}`
        break
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400')
      showNotification('Succès', `Partage sur ${platform} lancé`, 'success')
    }

  }

  // Système de notifications modernes
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  const showNotification = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    const newNotification = {
      id: Date.now().toString(),
      title,
      message,
      type,
      timestamp: new Date()
    }
    
    setNotifications(prev => [...prev, newNotification])
    
    // Auto-remove after 5 seconds
    scheduleTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id))
    }, 5000)
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  // Fonction pour télécharger les documents
  const handleDownloadDocuments = (orderId: string) => {
    const run = async () => {
      try {
        setIsLoading(true)

        const accessToken = await SellerDashboardService.getAccessToken()
        const headers: Record<string, string> = { Accept: 'application/json' }
        if (accessToken) headers.Authorization = `Bearer ${accessToken}`

        const resp = await fetch(`/api/vendor/orders/${orderId}/documents`, {
          method: 'GET',
          headers,
          credentials: 'include',
          cache: 'no-store'
        })

        const body = await resp.json().catch(() => ({}))
        if (!resp.ok) {
          const message = typeof (body as any)?.error === 'string' ? (body as any).error : 'Impossible de générer les documents.'
          throw new Error(message)
        }

        const filename = String((body as any)?.data?.filename ?? `documents_${orderId}.txt`)
        const mime = String((body as any)?.data?.mime ?? 'text/plain')
        const content = String((body as any)?.data?.content ?? '')

        safeDownloadFile(content, filename, mime)
        showNotification('Documents téléchargés', `Documents générés pour la commande ${orderId}`, 'success')
      } catch (error) {
        console.error('❌ Téléchargement docs impossible', error)
        const message = error instanceof Error ? error.message : 'Impossible de télécharger les documents.'
        showNotification('Erreur', message, 'error')
      } finally {
        setIsLoading(false)
      }
    }

    void run()
  }

  // Fonction pour voir les détails du classement
  const handleViewRankingDetails = () => {
    setShowRankingModal(true)
  }

  // Fonction pour configurer l'IA
  const handleConfigureAI = () => {
    setShowAIConfigModal(true)
  }

  // Fonction pour voir les prévisions
  const handleViewForecasts = () => {
    setShowForecastsModal(true)
  }

  // Fonction pour optimiser les livraisons
  const handleOptimizeDeliveries = () => {
    setShowDeliveryOptimizationModal(true)
  }

  // Fonction pour gérer les litiges
  const handleManageDisputes = () => {
    setShowDisputesModal(true)
  }

  const submitDispute = async () => {
    if (!selectedOrder) return

    if (!disputeForm.subject.trim()) {
      showNotification('Sujet requis', 'Merci de renseigner un sujet.', 'warning')
      return
    }

    try {
      setIsActionLoading(true)

      const disputePayload: SuperAdminOrderDisputePayload = {
        type: disputeForm.type,
        subject: disputeForm.subject,
        description: disputeForm.description,
        priority: disputeForm.priority,
        assignedTo: disputeForm.assignedTo || null,
        resolution: disputeForm.resolution || null,
        metadata: disputeForm.metadataNotes ? { notes: disputeForm.metadataNotes } : {}
      }

      const createdDispute = await SellerDashboardService.createSellerOrderDispute(selectedOrder.id, disputePayload)
      if (createdDispute) {
        setVendorDisputes((prev) => [createdDispute, ...(Array.isArray(prev) ? prev : [])])
      }

      onOrderUpdate({
        ...selectedOrder,
        disputeStatus: 'open',
        disputePriority: disputeForm.priority,
        disputeSubject: disputeForm.subject,
        disputeDescription: disputeForm.description,
        disputeOpenedAt: new Date().toISOString(),
        disputeUpdatedAt: new Date().toISOString()
      })

      showNotification('Litige ouvert', 'Le litige a été transmis au support.', 'warning')
      setShowDisputesModal(false)
      setSelectedOrder(null)
    } catch (error) {
      console.error('❌ Impossible de créer le litige vendeur', error)
      showNotification('Erreur', "La création du litige a échoué.", 'error')
    } finally {
      setIsActionLoading(false)
    }
  }

  const submitPayment = async () => {
    if (!selectedOrder) return

    try {
      setIsActionLoading(true)

      const paymentPayload: SuperAdminOrderPaymentPayload = {
        provider: paymentForm.provider,
        reference: paymentForm.reference || null,
        amount: paymentForm.amount || selectedOrder.totalAmount,
        metadata: {
          accountName: paymentForm.accountName,
          bankName: paymentForm.bankName,
          phoneNumber: paymentForm.phoneNumber,
          notes: paymentForm.notes
        }
      }

      const updatedOrder = await SellerDashboardService.createSellerOrderPayment(selectedOrder.id, paymentPayload)
      onOrderUpdate({ ...selectedOrder, ...mapApiOrderToSellerOrder(updatedOrder) })
      showNotification('Paiement enregistré', 'La demande de paiement a été transmise.', 'success')
      setShowPaymentModal(false)
      setSelectedOrder(null)
    } catch (error) {
      console.error('❌ Impossible de créer le paiement vendeur', error)
      showNotification('Erreur', "L'enregistrement du paiement a échoué.", 'error')
    } finally {
      setIsActionLoading(false)
    }
  }

  const mapApiOrderToSellerOrder = (apiOrder: any): Partial<SellerOrder> => ({
    paymentStatus: apiOrder?.payment_status ?? 'pending',
    status: apiOrder?.status ?? 'pending',
    totalAmount: apiOrder?.total ?? apiOrder?.total_amount ?? 0,
    commission: apiOrder?.commission_total ?? apiOrder?.commission ?? 0,
    netRevenue: apiOrder?.net_amount ?? apiOrder?.total ?? 0,
    deliveryDate: apiOrder?.delivery_date ?? null,
    returnStatus: apiOrder?.return_status ?? apiOrder?.returnStatus ?? apiOrder?.return?.status,
    returnReason: apiOrder?.return_reason ?? apiOrder?.returnReason ?? apiOrder?.return?.reason,
    returnProcessedAt: apiOrder?.return_processed_at ?? apiOrder?.returnProcessedAt ?? apiOrder?.return?.processed_at,
    disputeStatus: apiOrder?.dispute_status ?? apiOrder?.disputeStatus ?? apiOrder?.dispute?.status,
    disputePriority: apiOrder?.dispute_priority ?? apiOrder?.disputePriority ?? apiOrder?.dispute?.priority,
    disputeAssignedTo: apiOrder?.dispute_assigned_to ?? apiOrder?.disputeAssignedTo ?? apiOrder?.dispute?.assigned_to,
    disputeOpenedAt: apiOrder?.dispute_opened_at ?? apiOrder?.disputeOpenedAt ?? apiOrder?.dispute?.opened_at ?? apiOrder?.dispute?.created_at,
    disputeUpdatedAt: apiOrder?.dispute_updated_at ?? apiOrder?.disputeUpdatedAt ?? apiOrder?.dispute?.updated_at ?? apiOrder?.dispute?.resolved_at
  })

  // Fonction pour configurer les notifications
  const handleConfigureNotifications = () => {
    setShowNotificationsModal(true)
  }

  // Fonction pour synchroniser maintenant
  const handleSyncNow = () => {
    const run = async () => {
      try {
        setIsLoading(true)
        setIsVendorDataLoading(true)
        setVendorDataSyncError(null)

        const accessToken = await SellerDashboardService.getAccessToken()
        const headers: Record<string, string> = { Accept: 'application/json', 'Content-Type': 'application/json' }
        if (accessToken) headers.Authorization = `Bearer ${accessToken}`

        // Persist "last sync" dans les settings vendeur.
        const syncStamp = new Date().toISOString()
        const settingsResp = await fetch('/api/vendor/settings', {
          method: 'PUT',
          headers,
          credentials: 'include',
          body: JSON.stringify({
            vendorDashboard: {
              ai: {
                ...(vendorDashboardSettings.ai ?? {}),
                last_sync_at: syncStamp
              }
            }
          })
        }).catch(() => null)

        if (!settingsResp?.ok) {
          setVendorDataSyncError('Certaines données vendeur n\'ont pas pu être synchronisées.')
        } else {
          const body = await settingsResp.json().catch(() => null)
          const ai = (body as any)?.data?.vendorDashboard?.ai ?? vendorDashboardSettings.ai
          setVendorDashboardSettings((prev) => ({
            ...prev,
            ai: (ai && typeof ai === 'object' && !Array.isArray(ai)) ? ai : prev.ai
          }))
        }

        const [rankingsResp, sharesResp, disputesResp, paymentsResp, deliveriesResp] = await Promise.all([
          fetch('/api/vendor/rankings', { method: 'GET', headers, credentials: 'include', cache: 'no-store' }).catch(() => null),
          fetch('/api/vendor/shares-stats', { method: 'GET', headers, credentials: 'include', cache: 'no-store' }).catch(() => null),
          fetch('/api/vendor/disputes', { method: 'GET', headers, credentials: 'include', cache: 'no-store' }).catch(() => null),
          fetch('/api/vendor/payments', { method: 'GET', headers, credentials: 'include', cache: 'no-store' }).catch(() => null),
          fetch('/api/vendor/deliveries', { method: 'GET', headers, credentials: 'include', cache: 'no-store' }).catch(() => null)
        ])

        const respOk = (r: Response | null) => Boolean(r && r.ok)
        if (!respOk(rankingsResp) || !respOk(sharesResp) || !respOk(disputesResp) || !respOk(paymentsResp) || !respOk(deliveriesResp)) {
          setVendorDataSyncError('Certaines données vendeur n\'ont pas pu être synchronisées.')
        }

        if (rankingsResp?.ok) {
          const body = await rankingsResp.json().catch(() => null)
          setRankings(Array.isArray(body?.data) ? body.data : [])
        }
        if (sharesResp?.ok) {
          const body = await sharesResp.json().catch(() => null)
          setShareStats(body?.data?.shareStats ?? null)
          setInteractionStats(body?.data?.interactionStats ?? null)
        }
        if (disputesResp?.ok) {
          const body = await disputesResp.json().catch(() => null)
          setVendorDisputes(Array.isArray(body?.data) ? body.data : [])
        }
        if (paymentsResp?.ok) {
          const body = await paymentsResp.json().catch(() => null)
          setVendorPayments(Array.isArray(body?.data) ? body.data : [])
        }
        if (deliveriesResp?.ok) {
          const body = await deliveriesResp.json().catch(() => null)
          setVendorDeliveries(Array.isArray(body?.data) ? body.data : [])
        }

        showNotification('Synchronisation terminée', 'Données vendeur synchronisées avec succès.', 'success')
      } catch (error) {
        console.error('❌ Synchronisation vendeur impossible', error)
        const message = error instanceof Error ? error.message : 'Impossible de synchroniser les données.'
        setVendorDataSyncError('Certaines données vendeur n\'ont pas pu être synchronisées.')
        showNotification('Erreur', message, 'error')
      } finally {
        setIsVendorDataLoading(false)
        setIsLoading(false)
      }
    }

    void run()
  }

  // Composant de menu de partage social réutilisable
  const SocialShareMenu = ({ 
    shareText, 
    shareTitle, 
    shareUrl = window.location.href,
    onShare,
    children 
  }: {
    shareText: string
    shareTitle: string
    shareUrl?: string
    onShare?: (platform: string) => void
    children: React.ReactNode
  }) => {
    const handleSocialShare = (platform: string) => {
      let shareUrlFinal = shareUrl
      let finalShareText = shareText
      
      switch (platform) {
        case 'whatsapp':
          shareUrlFinal = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`
          break
        case 'facebook':
          shareUrlFinal = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`
          break
        case 'twitter':
          shareUrlFinal = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
          break
        case 'linkedin':
          shareUrlFinal = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
          break
        case 'telegram':
          shareUrlFinal = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
          break
        case 'discord':
          shareUrlFinal = `https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&scope=bot&permissions=0`
          break
        case 'copy':
          ;(async () => {
            const ok = await safeCopyToClipboard(shareText + ' ' + shareUrl)
            showNotification(ok ? 'Succès' : 'Erreur', ok ? 'Lien copié dans le presse-papiers' : 'Copie impossible sur ce navigateur', ok ? 'success' : 'error')
            if (ok && onShare) onShare('copy')
          })()
          return
        default:
          break
      }
      
      if (shareUrlFinal && platform !== 'copy') {
        window.open(shareUrlFinal, '_blank', 'width=600,height=400')
        showNotification('Succès', `Partage sur ${platform} lancé`, 'success')
        
        // Récompense pour le partage
        scheduleTimeout(() => {
          showNotification('🎁 Récompense', '+10 points de fidélité pour ce partage !', 'success')
        }, 1000)
        
        if (onShare) onShare(platform)
      }
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {children}
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium text-gray-900">Partager sur</p>
            <p className="text-xs text-gray-500 truncate">{shareTitle}</p>
          </div>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => handleSocialShare('whatsapp')} className="cursor-pointer">
            <FaWhatsapp className="w-4 h-4 mr-2 text-green-600" />
            <span>WhatsApp</span>
            <span className="ml-auto text-xs text-green-600">+10 pts</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => handleSocialShare('facebook')} className="cursor-pointer">
            <FaFacebook className="w-4 h-4 mr-2 text-blue-600" />
            <span>Facebook</span>
            <span className="ml-auto text-xs text-blue-600">+10 pts</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => handleSocialShare('twitter')} className="cursor-pointer">
            <FaTwitter className="w-4 h-4 mr-2 text-sky-500" />
            <span>X (Twitter)</span>
            <span className="ml-auto text-xs text-sky-500">+10 pts</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => handleSocialShare('linkedin')} className="cursor-pointer">
            <FaLinkedin className="w-4 h-4 mr-2 text-blue-700" />
            <span>LinkedIn</span>
            <span className="ml-auto text-xs text-blue-700">+10 pts</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => handleSocialShare('telegram')} className="cursor-pointer">
            <FaTelegram className="w-4 h-4 mr-2 text-blue-500" />
            <span>Telegram</span>
            <span className="ml-auto text-xs text-blue-500">+10 pts</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => handleSocialShare('discord')} className="cursor-pointer">
            <FaDiscord className="w-4 h-4 mr-2 text-indigo-600" />
            <span>Discord</span>
            <span className="ml-auto text-xs text-indigo-600">+10 pts</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => handleSocialShare('copy')} className="cursor-pointer">
            <Copy className="w-4 h-4 mr-2 text-gray-600" />
            <span>Copier le lien</span>
            <span className="ml-auto text-xs text-gray-600">+5 pts</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // Fonction pour gérer les actions en lot
  const handleBulkActions = () => {
    if (selectedOrdersForBulkAction.length === 0) {
      showNotification('Attention', 'Veuillez sélectionner au moins une commande', 'warning')
      return
    }
    
    setShowBulkActionsModal(true)
  }

  // Fonction pour sauvegarder la configuration des notifications
  const handleSaveNotificationsConfig = () => {
    const save = async () => {
      setIsLoading(true)
      try {
        const accessToken = await SellerDashboardService.getAccessToken()
        const headers: Record<string, string> = {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
        if (accessToken) headers.Authorization = `Bearer ${accessToken}`

        const resp = await fetch('/api/vendor/settings', {
          method: 'PUT',
          headers,
          credentials: 'include',
          body: JSON.stringify({
            vendorDashboard: {
              notifications: vendorDashboardSettings.notifications
            }
          })
        })

        const body = await resp.json().catch(() => ({}))
        if (!resp.ok) {
          const message = typeof (body as any)?.error === 'string' ? (body as any).error : 'Impossible de sauvegarder la configuration.'
          throw new Error(message)
        }

        const notifications = (body as any)?.data?.vendorDashboard?.notifications ?? vendorDashboardSettings.notifications
        setVendorDashboardSettings((prev) => ({
          ...prev,
          notifications: (notifications && typeof notifications === 'object' && !Array.isArray(notifications)) ? notifications : prev.notifications
        }))

        setShowNotificationsModal(false)
        showNotification('Configuration sauvegardée', 'Vos paramètres de notifications ont été sauvegardés avec succès', 'success')
      } catch (error) {
        console.error('❌ Sauvegarde notifications impossible', error)
        const message = error instanceof Error ? error.message : 'Impossible de sauvegarder la configuration.'
        showNotification('Erreur', message, 'error')
      } finally {
        setIsLoading(false)
      }
    }

    void save()
  }

  // Fonction pour appliquer la configuration de l'IA
  const handleApplyAIConfig = () => {
    const save = async () => {
      setIsLoading(true)
      try {
        const accessToken = await SellerDashboardService.getAccessToken()
        const headers: Record<string, string> = {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
        if (accessToken) headers.Authorization = `Bearer ${accessToken}`

        const resp = await fetch('/api/vendor/settings', {
          method: 'PUT',
          headers,
          credentials: 'include',
          body: JSON.stringify({
            vendorDashboard: {
              ai: vendorDashboardSettings.ai
            }
          })
        })

        const body = await resp.json().catch(() => ({}))
        if (!resp.ok) {
          const message = typeof (body as any)?.error === 'string' ? (body as any).error : 'Impossible de sauvegarder la configuration.'
          throw new Error(message)
        }

        const ai = (body as any)?.data?.vendorDashboard?.ai ?? vendorDashboardSettings.ai
        setVendorDashboardSettings((prev) => ({
          ...prev,
          ai: (ai && typeof ai === 'object' && !Array.isArray(ai)) ? ai : prev.ai
        }))

        setShowAIConfigModal(false)
        showNotification('Configuration IA appliquée', 'Les paramètres de l\'IA ont été appliqués avec succès', 'success')
      } catch (error) {
        console.error('❌ Sauvegarde IA impossible', error)
        const message = error instanceof Error ? error.message : 'Impossible de sauvegarder la configuration.'
        showNotification('Erreur', message, 'error')
      } finally {
        setIsLoading(false)
      }
    }

    void save()
  }

  // Fonction pour actualiser les prévisions
  const handleRefreshForecasts = () => {
    const run = async () => {
      try {
        setIsLoading(true)

        const accessToken = await SellerDashboardService.getAccessToken()
        const headers: Record<string, string> = { Accept: 'application/json' }
        if (accessToken) headers.Authorization = `Bearer ${accessToken}`

        const resp = await fetch('/api/vendor/orders', { method: 'GET', headers, credentials: 'include', cache: 'no-store' })
        const body = await resp.json().catch(() => ({}))
        if (!resp.ok) {
          const message = typeof (body as any)?.error === 'string' ? (body as any).error : 'Impossible de synchroniser les commandes.'
          throw new Error(message)
        }

        const rows = Array.isArray((body as any)?.data) ? (body as any).data : []
        for (const row of rows) {
          const id = String((row as any)?.id ?? '').trim()
          if (!id) continue
          const existing = orders.find((o) => String(o?.id) === id)
          if (!existing) continue
          const mapped = mapVendorApiOrderToSellerOrder(row, existing)
          onOrderUpdate(mapped)
          if (existing.status !== mapped.status) {
            onOrderStatusChange(mapped.id, mapped.status)
          }
        }

        showNotification('Prévisions actualisées', 'Commandes synchronisées. Les prévisions ont été recalculées.', 'success')
      } catch (error) {
        console.error('❌ Refresh forecasts failed:', error)
        const message = error instanceof Error ? error.message : 'Impossible de synchroniser les prévisions.'
        showNotification('Erreur', message, 'error')
      } finally {
        setIsLoading(false)
      }
    }

    void run()
  }

  // Fonction pour exporter les prévisions
  const handleExportForecasts = () => {
    const csvContent = 'Prévisions de vente\nCroissance prévue,0%\nCommandes prévues,0\nCA prévu (F CFA),0'
    safeDownloadFile(csvContent, 'previsions-vente.csv', 'text/csv')
    showNotification('Export réussi', 'Rapport des prévisions exporté (CSV)', 'success')
  }

  // Fonction pour appliquer les actions en lot
  const handleApplyBulkActions = () => {
    if (selectedOrdersForBulkAction.length === 0) {
      showNotification('Attention', 'Veuillez sélectionner au moins une commande', 'warning')
      return
    }

    const run = async () => {
      try {
        setIsLoading(true)
        setIsActionLoading(true)

        const accessToken = await SellerDashboardService.getAccessToken()
        const headers: Record<string, string> = {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
        if (accessToken) headers.Authorization = `Bearer ${accessToken}`

        await Promise.all(
          selectedOrdersForBulkAction.map(async (orderId) => {
            const resp = await fetch(`/api/vendor/orders/${orderId}/actions`, {
              method: 'POST',
              headers,
              credentials: 'include',
              body: JSON.stringify({ action: 'bulk_apply' })
            })
            const body = await resp.json().catch(() => ({}))
            if (!resp.ok) {
              const message = typeof (body as any)?.error === 'string' ? (body as any).error : 'Impossible d\'appliquer l\'action.'
              throw new Error(message)
            }
          })
        )

        setShowBulkActionsModal(false)
        showNotification('Actions appliquées', `${selectedOrdersForBulkAction.length} action(s) enregistrée(s)`, 'success')
        setSelectedOrdersForBulkAction([])
      } catch (error) {
        console.error('❌ Bulk apply failed:', error)
        const message = error instanceof Error ? error.message : 'Impossible d\'appliquer les actions.'
        showNotification('Erreur', message, 'error')
      } finally {
        setIsLoading(false)
        setIsActionLoading(false)
      }
    }

    void run()
  }

  const handleBulkPaymentRequest = () => {
    if (selectedOrdersForBulkAction.length === 0) {
      showNotification('Attention', 'Veuillez sélectionner au moins une commande', 'warning')
      return
    }

    const run = async () => {
      try {
        setIsLoading(true)
        setIsActionLoading(true)

        const accessToken = await SellerDashboardService.getAccessToken()
        const headers: Record<string, string> = {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
        if (accessToken) headers.Authorization = `Bearer ${accessToken}`

        const selectedOrders = orders.filter((o) => selectedOrdersForBulkAction.includes(o.id))

        await Promise.all(
          selectedOrders.map(async (order) => {
            const resp = await fetch('/api/vendor/payments', {
              method: 'POST',
              headers,
              credentials: 'include',
              body: JSON.stringify({
                orderId: order.id,
                provider: getOrderPaymentProviderNormalized(order) || 'mobile-money',
                amount: Number(order.netRevenue ?? order.totalAmount ?? 0),
                status: 'pending',
                metadata: {
                  notes: (order as any)?.notes ?? null,
                  source: 'bulk'
                }
              })
            })

            const body = await resp.json().catch(() => ({}))
            if (!resp.ok) {
              const message = typeof (body as any)?.error === 'string' ? (body as any).error : 'Impossible de créer la demande de paiement.'
              throw new Error(message)
            }
          })
        )

        await refreshVendorPayments()

        setShowBulkActionsModal(false)
        showNotification('Demandes de paiement envoyées', `${selectedOrdersForBulkAction.length} demande(s) envoyée(s)`, 'success')
        setSelectedOrdersForBulkAction([])
      } catch (error) {
        console.error('❌ Bulk payment request failed:', error)
        const message = error instanceof Error ? error.message : 'Impossible de créer les demandes de paiement.'
        showNotification('Erreur', message, 'error')
      } finally {
        setIsLoading(false)
        setIsActionLoading(false)
      }
    }

    void run()
  }

  const handleBulkDeliveryValidation = () => {
    if (selectedOrdersForBulkAction.length === 0) {
      showNotification('Attention', 'Veuillez sélectionner au moins une commande', 'warning')
      return
    }

    const run = async () => {
      try {
        setIsLoading(true)
        setIsActionLoading(true)

        const accessToken = await SellerDashboardService.getAccessToken()
        const headers: Record<string, string> = {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
        if (accessToken) headers.Authorization = `Bearer ${accessToken}`

        await Promise.all(
          selectedOrdersForBulkAction.map(async (orderId) => {
            const resp = await fetch(`/api/vendor/orders/${orderId}/actions`, {
              method: 'POST',
              headers,
              credentials: 'include',
              body: JSON.stringify({ action: 'customer_validation_request' })
            })

            const body = await resp.json().catch(() => ({}))
            if (!resp.ok) {
              const message = typeof (body as any)?.error === 'string' ? (body as any).error : 'Impossible de valider la livraison.'
              throw new Error(message)
            }

            if (onCustomerValidation) {
              onCustomerValidation(orderId)
            }
          })
        )

        setShowBulkActionsModal(false)
        showNotification('Validations de livraison', `${selectedOrdersForBulkAction.length} demande(s) enregistrée(s)`, 'success')
        setSelectedOrdersForBulkAction([])
      } catch (error) {
        console.error('❌ Bulk delivery validation failed:', error)
        const message = error instanceof Error ? error.message : 'Impossible d\'enregistrer les validations.'
        showNotification('Erreur', message, 'error')
      } finally {
        setIsLoading(false)
        setIsActionLoading(false)
      }
    }

    void run()
  }

  // Fonction pour voir les détails d'une commande
  const mapVendorApiOrderToSellerOrder = (apiOrder: any, fallback: SellerOrder): SellerOrder => {
    const items = Array.isArray(apiOrder?.order_items) ? apiOrder.order_items : []
    const products = items.map((it: any, idx: number) => {
      const name = String(it?.product_name ?? it?.name ?? it?.title ?? '').trim() || `Produit ${idx + 1}`
      const quantity = Number(it?.quantity ?? it?.qty ?? 0)
      const price = Number(it?.price ?? it?.unit_price ?? it?.unitPrice ?? 0)
      const total = Number(it?.total ?? it?.line_total ?? (Number.isFinite(price) && Number.isFinite(quantity) ? price * quantity : 0))
      const idRaw = it?.id ?? it?.product_id ?? idx
      const id = typeof idRaw === 'number' ? idRaw : Number(String(idRaw).replace(/[^0-9]/g, '')) || idx
      const productId = typeof it?.product_id === 'string' ? it.product_id : undefined
      const vendorId = typeof it?.product_vendor_id === 'string' ? it.product_vendor_id : undefined
      const categoryIds = Array.isArray(it?.product_category_ids) ? it.product_category_ids.map(String).filter(Boolean) : undefined
      const freeShipping = Boolean(it?.product_free_shipping)
      return {
        id,
        name,
        quantity: Number.isFinite(quantity) ? quantity : 0,
        price: Number.isFinite(price) ? price : 0,
        total: Number.isFinite(total) ? total : 0,
        productId,
        vendorId,
        categoryIds,
        freeShipping
      }
    })

    const deliveries = Array.isArray(apiOrder?.deliveries)
      ? apiOrder.deliveries
          .map((row: any) => ({
            id: String(row?.id ?? ''),
            status: String(row?.status ?? ''),
            eta: row?.eta ?? null,
            dispatched_at: row?.dispatched_at ?? null,
            delivered_at: row?.delivered_at ?? null,
            cancelled_at: row?.cancelled_at ?? null,
            created_at: row?.created_at ?? null
          }))
          .filter((row: any) => typeof row.id === 'string' && row.id.length > 0)
      : []

    return {
      ...fallback,
      id: String(apiOrder?.id ?? fallback.id),
      customerName: String(apiOrder?.customer_name ?? apiOrder?.customerName ?? fallback.customerName),
      customerEmail: String(apiOrder?.customer_email ?? apiOrder?.customerEmail ?? fallback.customerEmail),
      customerPhone: String(apiOrder?.customer_phone ?? apiOrder?.customerPhone ?? fallback.customerPhone),
      shippingAddress:
        formatShippingAddress(apiOrder?.shipping_address ?? apiOrder?.shippingAddress ?? apiOrder?.delivery_address) ||
        String(fallback.shippingAddress ?? ''),
      orderDate: String(apiOrder?.created_at ?? apiOrder?.order_date ?? apiOrder?.orderDate ?? fallback.orderDate),
      deliveryDate: (apiOrder?.delivery_date ?? apiOrder?.deliveryDate ?? fallback.deliveryDate) || undefined,
      status: (apiOrder?.status ?? fallback.status) as any,
      paymentStatus: (apiOrder?.payment_status ?? apiOrder?.paymentStatus ?? fallback.paymentStatus) as any,
      totalAmount: Number(apiOrder?.total ?? apiOrder?.total_amount ?? fallback.totalAmount ?? 0),
      commission: Number(apiOrder?.commission_total ?? apiOrder?.commission ?? fallback.commission ?? 0),
      netRevenue: Number(apiOrder?.net_amount ?? apiOrder?.netRevenue ?? fallback.netRevenue ?? apiOrder?.total ?? apiOrder?.total_amount ?? 0),
      products: products.length > 0 ? products : (fallback.products ?? []),
      deliveries
    }
  }

  const syncOrderDetailsFromDb = async (order: SellerOrder) => {
    try {
      setIsOrderDetailsSyncLoading(true)
      const accessToken = await SellerDashboardService.getAccessToken()
      const headers: Record<string, string> = { Accept: 'application/json' }
      if (accessToken) headers.Authorization = `Bearer ${accessToken}`
      const resp = await fetch('/api/vendor/orders', { method: 'GET', headers, credentials: 'include', cache: 'no-store' }).catch(() => null)
      if (!resp?.ok) return
      const body = await resp.json().catch(() => null)
      const rows = Array.isArray(body?.data) ? body.data : []
      const match = rows.find((r: any) => String(r?.id ?? '') === String(order.id))
      if (!match) return
      setSelectedOrder((prev) => (prev ? mapVendorApiOrderToSellerOrder(match, prev) : mapVendorApiOrderToSellerOrder(match, order)))
    } catch {
      // ignore
    } finally {
      setIsOrderDetailsSyncLoading(false)
    }
  }

  const handleViewOrderDetails = (order: SellerOrder) => {
    setSelectedOrder(order)
    setShowOrderDetailsModal(true)
    void syncOrderDetailsFromDb(order)
  }

  const handlePrintOrderDetails = (order: SellerOrder) => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      showNotification('Erreur', "Impossible d'ouvrir la fenêtre d'impression.", 'error')
      return
    }

    const paymentRow = (vendorPayments ?? []).find(p => String((p as any)?.order_id ?? (p as any)?.orderId ?? '') === String(order.id))
    const paymentProvider = String((paymentRow as any)?.provider ?? (paymentRow as any)?.payment_provider ?? (paymentRow as any)?.method ?? '').trim()
    const paymentRef = String((paymentRow as any)?.reference ?? '').trim()

    const productsHtml = (order.products ?? [])
      .map(p => `<li>${String(p?.name ?? '')} x${Number(p?.quantity ?? 0)} — ${formatCurrency(Number(p?.price ?? 0))}</li>`)
      .join('')

    printWindow.document.write(`
      <html>
        <head><title>Commande ${order.id}</title></head>
        <body>
          <h1>Commande #${getOrderShortNumber(order.id)}</h1>
          <p><strong>ID:</strong> ${order.id}</p>
          <p><strong>Date:</strong> ${formatDate(order.orderDate)}</p>
          <p><strong>Client:</strong> ${order.customerName}</p>
          <p><strong>Email:</strong> ${order.customerEmail || 'Non spécifié'}</p>
          <p><strong>Téléphone:</strong> ${order.customerPhone || 'Non spécifié'}</p>
          <p><strong>Adresse:</strong> ${order.shippingAddress || 'Non spécifiée'}</p>
          <p><strong>Statut:</strong> ${order.status}</p>
          <p><strong>Statut paiement:</strong> ${order.paymentStatus}</p>
          <p><strong>Mode de paiement:</strong> ${paymentProvider || 'N/A'} ${paymentRef ? `(${paymentRef})` : ''}</p>
          <p><strong>Total:</strong> ${formatCurrency(order.totalAmount)}</p>
          <h2>Produits</h2>
          <ul>${productsHtml || '<li>Aucun produit</li>'}</ul>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  // Fonction pour dupliquer une commande
  const handleDuplicateOrder = (order: SellerOrder) => {
    const run = async () => {
      try {
        setIsLoading(true)

        const accessToken = await SellerDashboardService.getAccessToken()
        const headers: Record<string, string> = {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
        if (accessToken) headers.Authorization = `Bearer ${accessToken}`

        const resp = await fetch(`/api/vendor/orders/${order.id}/actions`, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({ action: 'duplicate_request' })
        })

        const body = await resp.json().catch(() => ({}))
        if (!resp.ok) {
          const message = typeof (body as any)?.error === 'string' ? (body as any).error : 'Impossible de soumettre la demande de duplication.'
          throw new Error(message)
        }

        showNotification('Demande envoyée', `Demande de duplication enregistrée pour ${getOrderDisplayNumber(order)}`, 'success')
      } catch (error) {
        console.error('❌ Duplication commande vendeur impossible', error)
        const message = error instanceof Error ? error.message : 'Impossible de soumettre la demande de duplication.'
        showNotification('Erreur', message, 'error')
      } finally {
        setIsLoading(false)
      }
    }

    void run()
  }

  // Fonction pour générer un bon de livraison
  const handleGenerateDeliveryNote = (order: SellerOrder) => {
    const deliveryNote = `Bon de livraison - Commande ${order.id}\nClient: ${order.customerName}\nAdresse: ${order.shippingAddress}\nDate: ${new Date().toLocaleDateString('fr-FR')}`
    safeDownloadFile(deliveryNote, `bon-livraison-${order.id}.txt`, 'text/plain')
    showNotification('Bon de livraison généré', 'Fichier téléchargé avec succès', 'success')
  }

  // Fonction pour générer un reçu
  // Formate un statut API en libellé lisible.
  const formatStatus = (status: string) => {
    if (!status) return ''
    return status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
  }

  // Retourne la palette Tailwind adaptée au statut de retour.
  const getReturnColor = (status?: string) => {
    switch (status) {
      case 'pending':
        return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'approved':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-200'
      case 'completed':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  // Retourne la palette Tailwind adaptée au statut de litige.
  const getDisputeColor = (status?: string) => {
    switch (status) {
      case 'pending':
      case 'open':
        return 'bg-red-50 text-red-700 border-red-200'
      case 'in_progress':
        return 'bg-orange-50 text-orange-700 border-orange-200'
      case 'resolved':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'closed':
        return 'bg-gray-50 text-gray-700 border-gray-200'
      default:
        return 'bg-red-50 text-red-700 border-red-200'
    }
  }

  const handleGenerateReceipt = (order: SellerOrder) => {
    const receipt = `Reçu - Commande ${getOrderDisplayNumber(order)}\nClient: ${order.customerName}\nMontant: ${formatCurrency(order.totalAmount)}\nDate: ${new Date().toLocaleDateString('fr-FR')}`
    safeDownloadFile(receipt, `recu-${getOrderDisplayNumber(order)}.txt`, 'text/plain')
    showNotification('Reçu généré', 'Fichier téléchargé avec succès', 'success')
  }

  // Fonction pour envoyer un rappel
  const handleSendReminder = (order: SellerOrder) => {
    const run = async () => {
      try {
        setIsLoading(true)

        const accessToken = await SellerDashboardService.getAccessToken()
        const headers: Record<string, string> = {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
        if (accessToken) headers.Authorization = `Bearer ${accessToken}`

        const resp = await fetch(`/api/vendor/orders/${order.id}/actions`, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({ action: 'send_reminder' })
        })

        const body = await resp.json().catch(() => ({}))
        if (!resp.ok) {
          const message = typeof (body as any)?.error === 'string' ? (body as any).error : 'Impossible d\'envoyer le rappel.'
          throw new Error(message)
        }

        showNotification('Rappel envoyé', `Rappel enregistré pour ${order.customerName}`, 'success')
      } catch (error) {
        console.error('❌ Rappel vendeur impossible', error)
        const message = error instanceof Error ? error.message : 'Impossible d\'envoyer le rappel.'
        showNotification('Erreur', message, 'error')
      } finally {
        setIsLoading(false)
      }
    }

    void run()
  }

  // Fonction pour marquer comme prioritaire
  const handleMarkAsPriority = (order: SellerOrder) => {
    const run = async () => {
      try {
        setIsLoading(true)

        const accessToken = await SellerDashboardService.getAccessToken()
        const headers: Record<string, string> = {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
        if (accessToken) headers.Authorization = `Bearer ${accessToken}`

        const resp = await fetch(`/api/vendor/orders/${order.id}/actions`, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({ action: 'mark_priority' })
        })

        const body = await resp.json().catch(() => ({}))
        if (!resp.ok) {
          const message = typeof (body as any)?.error === 'string' ? (body as any).error : 'Impossible de marquer la commande comme prioritaire.'
          throw new Error(message)
        }

        showNotification('Commande prioritaire', `Commande ${getOrderDisplayNumber(order)} marquée comme prioritaire`, 'success')
      } catch (error) {
        console.error('❌ Priorité commande vendeur impossible', error)
        const message = error instanceof Error ? error.message : 'Impossible de marquer la commande comme prioritaire.'
        showNotification('Erreur', message, 'error')
      } finally {
        setIsLoading(false)
      }
    }

    void run()
  }

  // Fonction pour archiver une commande
  const handleArchiveOrder = (order: SellerOrder) => {
    const run = async () => {
      try {
        setIsLoading(true)

        const accessToken = await SellerDashboardService.getAccessToken()
        const headers: Record<string, string> = {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
        if (accessToken) headers.Authorization = `Bearer ${accessToken}`

        const resp = await fetch(`/api/vendor/orders/${order.id}/actions`, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({ action: 'archive_request' })
        })

        const body = await resp.json().catch(() => ({}))
        if (!resp.ok) {
          const message = typeof (body as any)?.error === 'string' ? (body as any).error : 'Impossible de soumettre la demande d\'archivage.'
          throw new Error(message)
        }

        showNotification('Demande envoyée', `Demande d'archivage enregistrée pour ${getOrderDisplayNumber(order)}`, 'success')
      } catch (error) {
        console.error('❌ Archivage commande vendeur impossible', error)
        const message = error instanceof Error ? error.message : 'Impossible de soumettre la demande d\'archivage.'
        showNotification('Erreur', message, 'error')
      } finally {
        setIsLoading(false)
      }
    }

    void run()
  }

  // Fonction pour supprimer une commande
  const handleDeleteOrder = async (order: SellerOrder) => {
    const accepted = await confirm({
      title: 'Supprimer la commande',
      message: `Êtes-vous sûr de vouloir supprimer la commande ${getOrderDisplayNumber(order)} ? Cette action est irréversible.`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      tone: 'destructive'
    })
    if (!accepted) return

    const run = async () => {
      try {
        setIsLoading(true)

        const accessToken = await SellerDashboardService.getAccessToken()
        const headers: Record<string, string> = {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
        if (accessToken) headers.Authorization = `Bearer ${accessToken}`

        const resp = await fetch(`/api/vendor/orders/${order.id}/actions`, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({ action: 'delete_request' })
        })

        const body = await resp.json().catch(() => ({}))
        if (!resp.ok) {
          const message = typeof (body as any)?.error === 'string' ? (body as any).error : 'Impossible de soumettre la demande de suppression.'
          throw new Error(message)
        }

        showNotification('Demande envoyée', `Demande de suppression enregistrée pour ${getOrderDisplayNumber(order)}`, 'success')
      } catch (error) {
        console.error('❌ Suppression commande vendeur impossible', error)
        const message = error instanceof Error ? error.message : 'Impossible de soumettre la demande de suppression.'
        showNotification('Erreur', message, 'error')
      } finally {
        setIsLoading(false)
      }
    }

    void run()
  }

  // Exporter le rapport d'optimisation des livraisons
  const handleExportDeliveryReport = () => {
    const carrier = deliveryMetrics.carrierName ?? 'N/A'
    const shippingMethod = deliveryMetrics.shippingMethodName ?? 'N/A'
    const etaLabel = deliveryMetrics.eta ? formatDate(deliveryMetrics.eta) : 'N/A'
    const avgDelayLabel = deliveryMetrics.avgDeliveryDays === null ? 'N/A' : `${deliveryMetrics.avgDeliveryDays.toFixed(1)}j`
    const csv = [
      'Optimisation des livraisons',
      `Transporteur,${carrier}`,
      `Méthode,${shippingMethod}`,
      `Livraisons à temps,${deliveryMetrics.onTimePercent.toFixed(1)}%`,
      `Délai moyen,${avgDelayLabel}`,
      `ETA (exemple),${etaLabel}`
    ].join('\n')
    safeDownloadFile(csv, 'rapport-optimisation-livraisons.csv', 'text/csv')
    showNotification('Export réussi', 'Rapport d\'optimisation des livraisons exporté (CSV)', 'success')
  }

  // Appliquer l'optimisation des livraisons (simulation)
  const handleApplyDeliveryOptimization = () => {
    const save = async () => {
      setIsLoading(true)
      try {
        const accessToken = await SellerDashboardService.getAccessToken()
        const headers: Record<string, string> = {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
        if (accessToken) headers.Authorization = `Bearer ${accessToken}`

        const nextAi = {
          ...(vendorDashboardSettings.ai ?? {}),
          delivery_priority: deliveryOptimizationPrefs.priority,
          delivery_zone: deliveryOptimizationPrefs.zone,
          delivery_tracking_notifications: deliveryOptimizationPrefs.trackingNotifications,
          dispute_ai_enabled: disputeAiPrefs.enabled
        }

        const resp = await fetch('/api/vendor/settings', {
          method: 'PUT',
          headers,
          credentials: 'include',
          body: JSON.stringify({
            vendorDashboard: {
              ai: nextAi
            }
          })
        })

        const body = await resp.json().catch(() => ({}))
        if (!resp.ok) {
          const message = typeof (body as any)?.error === 'string' ? (body as any).error : 'Impossible de sauvegarder les préférences de livraison.'
          throw new Error(message)
        }

        const ai = (body as any)?.data?.vendorDashboard?.ai ?? nextAi
        setVendorDashboardSettings((prev) => ({
          ...prev,
          ai: (ai && typeof ai === 'object' && !Array.isArray(ai)) ? ai : prev.ai
        }))

        setShowDeliveryOptimizationModal(false)
        showNotification('Optimisation enregistrée', 'Préférences sauvegardées dans vos paramètres vendeur', 'success')
      } catch (error) {
        console.error('❌ Sauvegarde livraison impossible', error)
        const message = error instanceof Error ? error.message : 'Impossible de sauvegarder les préférences de livraison.'
        showNotification('Erreur', message, 'error')
      } finally {
        setIsLoading(false)
      }
    }

    void save()
  }

  // Exporter le rapport des litiges
  const handleExportDisputesReport = () => {
    const avgResolutionLabel = disputeMetrics.avgResolutionHours === null ? 'N/A' : `${disputeMetrics.avgResolutionHours.toFixed(1)}h`
    const csv = [
      'Rapport des litiges',
      `Taux de litiges,${disputeMetrics.disputeRate.toFixed(1)}%`,
      `Résolution moyenne,${avgResolutionLabel}`,
      `Total litiges,${(vendorDisputes ?? []).length}`,
      `Litiges ce mois,${disputeMetrics.disputesThisMonth}`,
      'Date,' + new Date().toLocaleDateString('fr-FR')
    ].join('\n')
    safeDownloadFile(csv, 'rapport-litiges.csv', 'text/csv')
    showNotification('Export réussi', 'Rapport des litiges exporté (CSV)', 'success')
  }

  // Créer un nouveau litige
  const handleCreateDispute = () => {
    const defaultOrderId = String(orders?.[0]?.id ?? '').trim()
    setCreateDisputeForm((prev) => ({
      ...prev,
      orderId: prev.orderId || defaultOrderId
    }))
    setShowCreateDisputeModal(true)
  }

  const handleSubmitCreateDispute = () => {
    const run = async () => {
      try {
        setIsActionLoading(true)

        const orderId = createDisputeForm.orderId.trim()
        if (!orderId) {
          showNotification('Erreur', 'Veuillez sélectionner une commande.', 'error')
          return
        }

        const accessToken = await SellerDashboardService.getAccessToken()
        const headers: Record<string, string> = {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
        if (accessToken) headers.Authorization = `Bearer ${accessToken}`

        const resp = await fetch('/api/vendor/disputes', {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({
            orderId,
            type: createDisputeForm.type,
            priority: createDisputeForm.priority,
            subject: createDisputeForm.subject || null,
            description: createDisputeForm.description || null,
            metadata: { source: 'seller_dashboard' }
          })
        })

        const body = await resp.json().catch(() => ({}))
        if (!resp.ok) {
          const message = typeof (body as any)?.error === 'string' ? (body as any).error : "La création du litige a échoué."
          throw new Error(message)
        }

        // Refresh disputes list
        try {
          const disputesResp = await fetch('/api/vendor/disputes', { method: 'GET', headers, credentials: 'include', cache: 'no-store' }).catch(() => null)
          if (disputesResp?.ok) {
            const disputesBody = await disputesResp.json().catch(() => null)
            setVendorDisputes(Array.isArray(disputesBody?.data) ? disputesBody.data : [])
          }
        } catch {
          // noop
        }

        setShowCreateDisputeModal(false)
        showNotification('Litige créé', 'Le litige a été enregistré et transmis au support.', 'success')
      } catch (error) {
        console.error('❌ Création litige vendeur impossible', error)
        const message = error instanceof Error ? error.message : "La création du litige a échoué."
        showNotification('Erreur', message, 'error')
      } finally {
        setIsActionLoading(false)
      }
    }

    void run()
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-300 cursor-pointer" onClick={handleViewAllOrders}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Total Commandes</p>
                <p className="text-2xl font-bold text-orange-900">{stats.total}</p>
                <p className="text-xs text-orange-600">+{stats.confirmed} en attente</p>
              </div>
              <Package className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300 cursor-pointer" onClick={handleViewDeliveredOrders}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Livrées</p>
                <p className="text-2xl font-bold text-green-900">{stats.delivered}</p>
                <p className="text-xs text-green-600">{stats.conversionRate.toFixed(1)}% de conversion</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300 cursor-pointer" onClick={handleViewShippedOrders}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">En Transit</p>
                <p className="text-2xl font-bold text-blue-900">{stats.shipped}</p>
                <p className="text-xs text-blue-600">{stats.delayed} en retard</p>
              </div>
              <Truck className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300 cursor-pointer" onClick={handleViewRevenueDetails}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">CA Total</p>
                <p className="text-2xl font-bold text-purple-900">{formatCurrency(stats.totalRevenue)}</p>
                <p className="text-xs text-purple-600">Moy: {formatCurrency(stats.averageOrderValue)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={layoutTab} onValueChange={(v) => setLayoutTab(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="orders">Commandes</TabsTrigger>
          <TabsTrigger value="overview">Aperçu & outils</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-6">
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="w-5 h-5 text-slate-600" />
            <span>Recherche & Filtres</span>
          </CardTitle>
          <CardDescription>Affinez la liste des commandes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Recherche</Label>
              <div className="relative">
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 bg-white/80 backdrop-blur-sm border-slate-300"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Statut</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-white/80 backdrop-blur-sm border-slate-300">
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="confirmed">Confirmée</SelectItem>
                  <SelectItem value="shipped">Expédiée</SelectItem>
                  <SelectItem value="delivered">Livrée</SelectItem>
                  <SelectItem value="cancelled">Annulée</SelectItem>
                  <SelectItem value="returned">Retournée</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Paiement</Label>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="bg-white/80 backdrop-blur-sm border-slate-300">
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="paid">Payé</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="failed">Échoué</SelectItem>
                  <SelectItem value="refunded">Remboursé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Mode de paiement</Label>
              <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                <SelectTrigger className="bg-white/80 backdrop-blur-sm border-slate-300">
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="mobile-money">Mobile Money</SelectItem>
                  <SelectItem value="bank-transfer">Virement bancaire</SelectItem>
                  <SelectItem value="cash">Espèces</SelectItem>
                  <SelectItem value="card">Carte</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Montant min</Label>
              <Input value={minAmountFilter} onChange={(e) => setMinAmountFilter(e.target.value)} type="number" placeholder="0" className="bg-white/80 backdrop-blur-sm border-slate-300" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Montant max</Label>
              <Input value={maxAmountFilter} onChange={(e) => setMaxAmountFilter(e.target.value)} type="number" placeholder="0" className="bg-white/80 backdrop-blur-sm border-slate-300" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Date début</Label>
              <Input value={dateStartFilter} onChange={(e) => setDateStartFilter(e.target.value)} type="date" className="bg-white/80 backdrop-blur-sm border-slate-300" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Date fin</Label>
              <Input value={dateEndFilter} onChange={(e) => setDateEndFilter(e.target.value)} type="date" className="bg-white/80 backdrop-blur-sm border-slate-300" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card id="orders-list">
        <CardHeader>
          <CardTitle>Commandes</CardTitle>
          <CardDescription>{filteredOrders.length} commande(s)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredOrders.length === 0 ? (
              <div className="text-sm text-gray-600">Aucune commande trouvée.</div>
            ) : (
              filteredOrders.slice(0, 50).map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="space-y-1">
                    <div className="font-medium">Commande #{getOrderDisplayNumber(order)}</div>
                    <div className="text-sm text-gray-600">{order.customerName} · {formatDate(order.orderDate)} · {formatCurrency(order.totalAmount)}</div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                      <Badge className={getPaymentStatusColor(order.paymentStatus)}>{getPaymentStatusLabel(order.paymentStatus)}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {(() => {
                      const state = resolveDeliveryUiState(order)
                      if (state === 'delivered') {
                        return (
                          <Badge className="bg-green-100 text-green-800">
                            <Truck className="h-3 w-3 mr-1" />
                            Livré
                          </Badge>
                        )
                      }

                      if (state === 'scheduled') {
                        return (
                          <Button size="sm" variant="outline" disabled className="opacity-60">
                            <Truck className="w-4 h-4 mr-1" />
                            Livraison programmée
                          </Button>
                        )
                      }

                      if (state === 'needs_delivery') {
                        return (
                          <Button
                            size="sm"
                            disabled
                            className="bg-orange-600 hover:bg-orange-700 opacity-80 animate-pulse"
                            title="Cette commande nécessite la création d'une livraison"
                          >
                            <Truck className="w-4 h-4 mr-1" />
                            Créer livraison
                          </Button>
                        )
                      }

                      return null
                    })()}
                    <Button size="sm" variant="outline" onClick={() => handleViewOrderDetails(order)}>
                      <Eye className="w-4 h-4 mr-1" />
                      Voir détails
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline">
                          Actions
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem className="cursor-pointer" onClick={() => handleCancelOrder(order.id)}>
                          <XCircle className="w-4 h-4 mr-2 text-red-600" />
                          Annuler
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="cursor-pointer" onClick={() => handlePrintOrderDetails(order)}>
                          <Printer className="w-4 h-4 mr-2" />
                          Imprimer
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer" onClick={() => handleShareOrder(order)}>
                          <Share className="w-4 h-4 mr-2" />
                          Partager
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={async () => {
                            const summary = `Commande #${getOrderShortNumber(order.id)}\nID: ${order.id}\nClient: ${order.customerName}\nDate: ${formatDate(order.orderDate)}\nTotal: ${formatCurrency(order.totalAmount)}`
                            const ok = await safeCopyToClipboard(summary)
                            showNotification(ok ? 'Copié' : 'Erreur', ok ? 'Résumé copié dans le presse-papiers' : 'Copie impossible sur ce navigateur', ok ? 'success' : 'error')
                          }}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copier
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button size="sm" variant="outline" onClick={() => handleDownloadDocuments(order.id)}>
                      <Download className="w-4 h-4 mr-1" />
                      Docs
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

        </TabsContent>

        <TabsContent value="overview" className="space-y-6">
          <div className="rounded-xl border bg-gradient-to-br from-slate-50 to-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="text-lg md:text-xl font-semibold text-slate-900">Aperçu & outils</div>
                <div className="text-sm text-slate-600">KPIs réels + outils de gestion. Les données proviennent de vos commandes et des modules vendeur.</div>
              </div>
              <div className="flex items-center gap-2">
                {(isVendorDataLoading || isSettingsLoading) ? (
                  <Badge className="bg-blue-50 text-blue-700 border border-blue-200">Synchronisation…</Badge>
                ) : vendorDataSyncError ? (
                  <Badge className="bg-amber-50 text-amber-800 border border-amber-200">Partiellement à jour</Badge>
                ) : (
                  <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200">À jour</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Vue d’ensemble */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-base font-semibold text-slate-900">Vue d’ensemble</div>
                <div className="text-sm text-slate-600">Indicateurs clés calculés depuis des données réelles.</div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowAnalyticsModal(true)}>
                <BarChart3 className="w-4 h-4 mr-2" />
                Ouvrir analytics
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-slate-200 bg-gradient-to-br from-indigo-50 to-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-indigo-700">Classement</div>
                      <div className="text-2xl font-bold text-slate-900">#{marketplaceRanking.position || 0}</div>
                      <div className="text-xs text-slate-600">sur {marketplaceRanking.totalVendors || 0}</div>
                    </div>
                    <Trophy className="w-8 h-8 text-indigo-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 bg-gradient-to-br from-emerald-50 to-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-emerald-700">Partages</div>
                      <div className="text-2xl font-bold text-slate-900">{marketplaceRanking.sharesCount}</div>
                      <div className="text-xs text-slate-600">Interactions: {marketplaceRanking.productViews}</div>
                    </div>
                    <Share className="w-8 h-8 text-emerald-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 bg-gradient-to-br from-amber-50 to-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-amber-700">Paiements</div>
                      <div className="text-2xl font-bold text-slate-900">{paymentMetrics.pending}</div>
                      <div className="text-xs text-slate-600">En attente • Total: {formatCurrency(paymentMetrics.totalAmount)}</div>
                    </div>
                    <CreditCard className="w-8 h-8 text-amber-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 bg-gradient-to-br from-sky-50 to-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-sky-700">Livraisons</div>
                      <div className="text-2xl font-bold text-slate-900">{deliveryMetrics.inProgress}</div>
                      <div className="text-xs text-slate-600">En cours • À l’heure: {safeToFixed(deliveryMetrics.onTimePercent, 0)}%</div>
                    </div>
                    <Truck className="w-8 h-8 text-sky-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Outils opérationnels */}
          <div className="space-y-3">
            <div>
              <div className="text-base font-semibold text-slate-900">Outils opérationnels</div>
              <div className="text-sm text-slate-600">Accès rapide aux modules de gestion.</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="hover:shadow-md transition-all cursor-pointer" onClick={() => setShowAllPaymentsModal(true)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium text-slate-900">Paiements</div>
                      <div className="text-xs text-slate-600">Demander les paiements en attente</div>
                    </div>
                    <CreditCard className="w-8 h-8 text-slate-700" />
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-all cursor-pointer" onClick={() => setShowReturnsModal(true)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium text-slate-900">Retours</div>
                      <div className="text-xs text-slate-600">Suivi et traitement</div>
                    </div>
                    <Package2 className="w-8 h-8 text-slate-700" />
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-all cursor-pointer" onClick={() => setShowDeliveryOptimizationModal(true)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium text-slate-900">Livraison</div>
                      <div className="text-xs text-slate-600">Optimisation & suivi</div>
                    </div>
                    <Truck className="w-8 h-8 text-slate-700" />
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-all cursor-pointer" onClick={() => setShowDisputesModal(true)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium text-slate-900">Litiges</div>
                      <div className="text-xs text-slate-600">Gestion & résolution</div>
                    </div>
                    <Shield className="w-8 h-8 text-slate-700" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="hover:shadow-md transition-all cursor-pointer" onClick={() => setShowRankingModal(true)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium text-slate-900">Classement</div>
                      <div className="text-xs text-slate-600">Détails marketplace</div>
                    </div>
                    <Trophy className="w-8 h-8 text-slate-700" />
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-all cursor-pointer" onClick={() => setShowAnalyticsModal(true)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium text-slate-900">Analytics</div>
                      <div className="text-xs text-slate-600">Performance & tendances</div>
                    </div>
                    <BarChart3 className="w-8 h-8 text-slate-700" />
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-all cursor-pointer" onClick={() => setShowForecastsModal(true)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium text-slate-900">Prévisions</div>
                      <div className="text-xs text-slate-600">Basées sur l’historique</div>
                    </div>
                    <TrendingUp className="w-8 h-8 text-slate-700" />
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-all cursor-pointer" onClick={() => setShowNotificationsModal(true)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium text-slate-900">Notifications</div>
                      <div className="text-xs text-slate-600">Alertes & canaux</div>
                    </div>
                    <Bell className="w-8 h-8 text-slate-700" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Configuration */}
          <div className="space-y-3">
            <div>
              <div className="text-base font-semibold text-slate-900">Configuration</div>
              <div className="text-sm text-slate-600">Paramètres persistés (synchronisés avec la base).</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="hover:shadow-md transition-all cursor-pointer" onClick={() => setShowNotificationsModal(true)}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Bell className="w-5 h-5 text-slate-700" />
                    Notifications intelligentes
                  </CardTitle>
                  <CardDescription>Canaux, fréquence, heures de réception</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-slate-700">
                  <div className="flex items-center justify-between">
                    <span>Temps réel</span>
                    <Badge className={getNotificationBool('realtime_enabled', true) ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-700'}>
                      {getNotificationBool('realtime_enabled', true) ? 'Activé' : 'Désactivé'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span>Canaux</span>
                    <span className="text-xs text-slate-600">Push: {getNotificationBool('channel_push', true) ? 'Oui' : 'Non'} • Email: {getNotificationBool('channel_email', true) ? 'Oui' : 'Non'}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-all cursor-pointer" onClick={() => setShowAIConfigModal(true)}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Zap className="w-5 h-5 text-slate-700" />
                    Configuration IA
                  </CardTitle>
                  <CardDescription>Automatisation et seuils d’alerte</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-slate-700">
                  <div className="flex items-center justify-between">
                    <span>Auto-validation</span>
                    <Badge className={getAiBool('auto_validation', true) ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-700'}>
                      {getAiBool('auto_validation', true) ? 'Activé' : 'Désactivé'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span>Seuil retard</span>
                    <span className="text-xs text-slate-600">{getAiNumber('delay_threshold_hours', 24)}h</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal Gestion des Retours */}
      <Dialog open={showReturnsModal} onOpenChange={setShowReturnsModal}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Gestion des Retours</DialogTitle>
            <DialogDescription className="text-gray-600">Gérez les retours et réclamations</DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Retours récents</CardTitle>
                <CardDescription>Commandes au statut "returned"</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {orders.filter(order => order.status === 'returned').slice(0, 10).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <Package2 className="w-5 h-5 text-yellow-600" />
                          <div>
                            <p className="font-medium">Commande #{getOrderDisplayNumber(order)}</p>
                            <p className="text-sm text-gray-600">{order.customerName} - {formatCurrency(order.totalAmount)}</p>
                            <p className="text-xs text-gray-500">Raison: {String((order as any)?.returnReason ?? (order as any)?.return_reason ?? 'Non spécifiée')}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getReturnColor(String((order as any)?.returnStatus ?? (order as any)?.return_status ?? 'pending'))}>
                          {formatStatus(String((order as any)?.returnStatus ?? (order as any)?.return_status ?? 'pending'))}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewOrderDetails(order)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Voir
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between items-center">
              <div className="flex space-x-2">
                <Button variant="outline" className="border-yellow-300 text-yellow-700 hover:bg-yellow-50" onClick={handleRefreshReturns}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Actualiser
                </Button>
                <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50" onClick={handleExportReturns}>
                  <Download className="w-4 h-4 mr-2" />
                  Exporter
                </Button>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setShowReturnsModal(false)}>
                  Fermer
                </Button>
                <Button className="bg-yellow-600 hover:bg-yellow-700" onClick={handleProcessAllReturns}>
                  <Package2 className="w-4 h-4 mr-2" />
                  Traiter tous les retours
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAnalyticsModal} onOpenChange={setShowAnalyticsModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Analytics Avancés</DialogTitle>
            <DialogDescription className="text-gray-600">Indicateurs calculés à partir de vos commandes</DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-slate-50 to-white border-slate-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
                  <div className="text-sm text-slate-600">Commandes</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-emerald-900">{formatCurrency(stats.totalRevenue)}</div>
                  <div className="text-sm text-emerald-700">Chiffre d'affaires</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-indigo-900">{stats.conversionRate.toFixed(1)}%</div>
                  <div className="text-sm text-indigo-700">Taux de conversion</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-amber-900">{formatCurrency(stats.averageOrderValue)}</div>
                  <div className="text-sm text-amber-700">Panier moyen</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Évolution (données réelles)</CardTitle>
                <CardDescription>Résumé des 30 derniers points calculés par jour/semaine/mois</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div className="rounded-lg border bg-slate-50 p-3">
                    <div className="font-medium text-slate-900">Journalier</div>
                    <div className="text-slate-600">Points: {orderAnalytics.daily.length}</div>
                  </div>
                  <div className="rounded-lg border bg-slate-50 p-3">
                    <div className="font-medium text-slate-900">Hebdomadaire</div>
                    <div className="text-slate-600">Points: {orderAnalytics.weekly.length}</div>
                  </div>
                  <div className="rounded-lg border bg-slate-50 p-3">
                    <div className="font-medium text-slate-900">Mensuel</div>
                    <div className="text-slate-600">Points: {orderAnalytics.monthly.length}</div>
                  </div>
                </div>

                <div className="text-xs text-slate-500">
                  Les graphiques avancés peuvent être ajoutés ensuite. Ici, on garantit l'absence de chiffres simulés.
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between items-center">
              <div className="flex space-x-2">
                <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50" onClick={handleExportAnalyticsModal}>
                  <Download className="w-4 h-4 mr-2" />
                  Exporter
                </Button>
                <Button variant="outline" className="border-green-300 text-green-700 hover:bg-green-50" onClick={handleShareAnalytics}>
                  <Share className="w-4 h-4 mr-2" />
                  Partager
                </Button>
              </div>
              <Button variant="outline" onClick={() => setShowAnalyticsModal(false)}>
                Fermer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showRankingModal} onOpenChange={setShowRankingModal}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Classement Marketplace</DialogTitle>
            <DialogDescription className="text-gray-600">Basé sur les données de l'endpoint vendeur</DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-indigo-900">#{marketplaceRanking.position || 0}</div>
                  <div className="text-sm text-indigo-700">Position</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-slate-50 to-white border-slate-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-slate-900">{marketplaceRanking.totalVendors || 0}</div>
                  <div className="text-sm text-slate-600">Vendeurs</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-emerald-900">{safeToFixed((marketplaceRanking as any)?.score, 1)}</div>
                  <div className="text-sm text-emerald-700">Score</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Détails</CardTitle>
                <CardDescription>Ventes/engagement selon le mode choisi</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Mode</span>
                  <span className="font-medium text-slate-900">{rankingMode === 'engagement' ? 'Engagement' : 'Ventes'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Catégorie</span>
                  <span className="font-medium text-slate-900">{marketplaceRanking.category}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Partages</span>
                  <span className="font-medium text-slate-900">{marketplaceRanking.sharesCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Vues produits</span>
                  <span className="font-medium text-slate-900">{marketplaceRanking.productViews}</span>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between items-center">
              <div className="flex space-x-2">
                <Button variant="outline" className="border-green-300 text-green-700 hover:bg-green-50" onClick={handleShareRanking}>
                  <Share className="w-4 h-4 mr-2" />
                  Partager
                </Button>
              </div>
              <Button variant="outline" onClick={() => setShowRankingModal(false)}>
                Fermer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Demande Tous les Paiements */}
      <Dialog open={showAllPaymentsModal} onOpenChange={setShowAllPaymentsModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Demande Tous les Paiements</DialogTitle>
            <DialogDescription className="text-gray-600">Demande de paiement pour toutes les commandes livrées en attente</DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-6">
            {/* Résumé des paiements */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-900">{stats.pendingPayments}</div>
                  <div className="text-sm text-red-700">Commandes en attente</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-900">{formatCurrency(pendingPaymentTotalAmount)}</div>
                  <div className="text-sm text-orange-700">Montant total</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-900">{paymentMetrics.pending}</div>
                  <div className="text-sm text-yellow-700">Paiements pending</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-900">{paymentMetrics.completed}</div>
                  <div className="text-sm text-blue-700">Paiements complétés</div>
                </CardContent>
              </Card>
            </div>

            {/* Liste détaillée des commandes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Commandes en attente de paiement</CardTitle>
                <CardDescription>Détail de toutes les commandes livrées mais non payées</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {pendingPaymentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <Package className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="font-medium">Commande #{getOrderDisplayNumber(order)}</p>
                            <p className="text-sm text-gray-600">{order.customerName} - {formatCurrency(order.totalAmount)}</p>
                            <p className="text-xs text-gray-500">
                              Livrée le: {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('fr-FR') : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>
                        <div className="text-sm text-gray-600">
                          {order.totalAmount} F CFA
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Options de demande */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Options de demande de paiement</CardTitle>
                <CardDescription>Personnalisez votre demande de paiement</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="payment-method">Mode de paiement préféré</Label>
                    <Select
                      value={allPaymentsRequest.preferredMethod}
                      onValueChange={(v) => setAllPaymentsRequest((prev) => ({ ...prev, preferredMethod: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mobile-money">Mobile Money</SelectItem>
                        <SelectItem value="bank-transfer">Virement bancaire</SelectItem>
                        <SelectItem value="cash">Espèces</SelectItem>
                        <SelectItem value="card">Carte bancaire</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="urgency-level">Niveau d'urgence</Label>
                    <Select
                      value={allPaymentsRequest.urgency}
                      onValueChange={(v) => setAllPaymentsRequest((prev) => ({ ...prev, urgency: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Faible</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">Élevé</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="payment-message">Message personnalisé</Label>
                  <Textarea 
                    id="payment-message"
                    placeholder="Ajoutez un message personnalisé pour vos clients..."
                    value={allPaymentsRequest.message}
                    onChange={(e) => setAllPaymentsRequest((prev) => ({ ...prev, message: e.target.value }))}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-between items-center">
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  className="border-blue-300 text-blue-700 hover:bg-blue-50"
                  onClick={handleExportPendingPayments}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exporter la liste
                </Button>
                <Button variant="outline" className="border-green-300 text-green-700 hover:bg-green-50">
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimer
                </Button>
                <SocialShareMenu
                  shareText={`Demande tous les paiements - ${stats.pendingPayments} commandes - Montant total: ${formatCurrency(pendingPaymentTotalAmount)}`}
                  shareTitle="Demande tous les paiements"
                  onShare={(platform) => console.log(`Demande paiements partagée sur ${platform}`)}
                >
                  <Button 
                    variant="outline" 
                    className="border-purple-300 text-purple-700 hover:bg-purple-50"
                  >
                    <Share className="w-4 h-4 mr-2" />
                    Partager
                  </Button>
                </SocialShareMenu>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setShowAllPaymentsModal(false)}>
                  Annuler
                </Button>
                <Button 
                  className="bg-red-600 hover:bg-red-700"
                  onClick={handleSendAllPaymentRequests}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Envoyer toutes les demandes
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>



      <Dialog open={showNotificationsModal} onOpenChange={setShowNotificationsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Configuration des Notifications Intelligentes</DialogTitle>
            <DialogDescription className="text-gray-600">Personnalisez vos alertes et notifications pour une gestion optimale de votre boutique</DialogDescription>
          </DialogHeader>
          
          <div className="p-6 space-y-6">
            {/* Types de notifications */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Types de Notifications</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                  <div className="flex items-center space-x-3">
                    <Package className="w-5 h-5 text-blue-600" />
                    <div>
                      <span className="font-medium text-blue-900">Nouvelles commandes</span>
                      <p className="text-xs text-blue-700">Alertes immédiates</p>
                    </div>
                </div>
                <Select
                  value={getNotificationString('new_orders_channel', 'push-email')}
                  onValueChange={(v) => updateNotificationSettings({ new_orders_channel: v })}
                >
                    <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="push">🔔 Push</SelectItem>
                      <SelectItem value="email">📧 Email</SelectItem>
                      <SelectItem value="push-email">🔔📧 Push + Email</SelectItem>
                      <SelectItem value="sms">📱 SMS</SelectItem>
                      <SelectItem value="none">❌ Aucune</SelectItem>
                  </SelectContent>
                </Select>
              </div>

                <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
                  <div className="flex items-center space-x-3">
                    <Truck className="w-5 h-5 text-orange-600" />
                    <div>
                      <span className="font-medium text-orange-900">Livraisons en retard</span>
                      <p className="text-xs text-orange-700">Alertes urgentes</p>
                    </div>
                </div>
                <Select
                  value={getNotificationString('late_deliveries_channel', 'urgent')}
                  onValueChange={(v) => updateNotificationSettings({ late_deliveries_channel: v })}
                >
                    <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="normal">⚡ Normal</SelectItem>
                      <SelectItem value="urgent">🚨 Urgent</SelectItem>
                      <SelectItem value="critical">💥 Critique</SelectItem>
                      <SelectItem value="none">❌ Aucune</SelectItem>
                  </SelectContent>
                </Select>
              </div>

                <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                  <div className="flex items-center space-x-3">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <div>
                      <span className="font-medium text-green-900">Paiements reçus</span>
                      <p className="text-xs text-green-700">Confirmations</p>
                    </div>
                </div>
                <Select
                  value={getNotificationString('payments_received_channel', 'push')}
                  onValueChange={(v) => updateNotificationSettings({ payments_received_channel: v })}
                >
                    <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="push">🔔 Push</SelectItem>
                      <SelectItem value="email">📧 Email</SelectItem>
                      <SelectItem value="sms">📱 SMS</SelectItem>
                      <SelectItem value="none">❌ Aucune</SelectItem>
                  </SelectContent>
                </Select>
              </div>

                <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-red-50 to-red-100 border-red-200">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <div>
                      <span className="font-medium text-red-900">Litiges détectés</span>
                      <p className="text-xs text-red-700">Alertes critiques</p>
            </div>
                  </div>
                  <Select
                    value={getNotificationString('disputes_channel', 'urgent')}
                    onValueChange={(v) => updateNotificationSettings({ disputes_channel: v })}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">⚡ Normal</SelectItem>
                      <SelectItem value="urgent">🚨 Urgent</SelectItem>
                      <SelectItem value="critical">💥 Critique</SelectItem>
                      <SelectItem value="none">❌ Aucune</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Paramètres avancés */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Paramètres Avancés</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Fréquence des notifications</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Notifications en temps réel</Label>
                      <Switch checked={getNotificationBool('realtime_enabled', true)} onCheckedChange={(checked) => updateNotificationSettings({ realtime_enabled: checked })} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Résumé quotidien</Label>
                      <Switch checked={getNotificationBool('daily_summary_enabled', true)} onCheckedChange={(checked) => updateNotificationSettings({ daily_summary_enabled: checked })} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Résumé hebdomadaire</Label>
                      <Switch checked={getNotificationBool('weekly_summary_enabled', false)} onCheckedChange={(checked) => updateNotificationSettings({ weekly_summary_enabled: checked })} />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Canaux de communication</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Notifications push</Label>
                      <Switch checked={getNotificationBool('channel_push', true)} onCheckedChange={(checked) => updateNotificationSettings({ channel_push: checked })} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Notifications email</Label>
                      <Switch checked={getNotificationBool('channel_email', true)} onCheckedChange={(checked) => updateNotificationSettings({ channel_email: checked })} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Notifications SMS</Label>
                      <Switch checked={getNotificationBool('channel_sms', false)} onCheckedChange={(checked) => updateNotificationSettings({ channel_sms: checked })} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Notifications WhatsApp</Label>
                      <Switch checked={getNotificationBool('channel_whatsapp', false)} onCheckedChange={(checked) => updateNotificationSettings({ channel_whatsapp: checked })} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Heures de réception */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Heures de Réception</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Heure de début</Label>
                  <Select
                    value={getNotificationString('reception_start', '08:00')}
                    onValueChange={(v) => updateNotificationSettings({ reception_start: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({length: 24}, (_, i) => (
                        <SelectItem key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                          {i.toString().padStart(2, '0')}:00
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Heure de fin</Label>
                  <Select
                    value={getNotificationString('reception_end', '20:00')}
                    onValueChange={(v) => updateNotificationSettings({ reception_end: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({length: 24}, (_, i) => (
                        <SelectItem key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                          {i.toString().padStart(2, '0')}:00
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Test des notifications */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Test des Notifications</h3>
              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => showNotification('Test Push', 'Ceci est une notification de test', 'info')}
                  className="border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Tester Push
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => showNotification('Test Email', 'Email de test envoyé', 'success')}
                  className="border-green-300 text-green-700 hover:bg-green-50"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Tester Email
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => showNotification('Test SMS', 'SMS de test envoyé', 'warning')}
                  className="border-orange-300 text-orange-700 hover:bg-orange-50"
                >
                  <Smartphone className="w-4 h-4 mr-2" />
                  Tester SMS
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 p-6 border-t">
              <Button variant="outline" onClick={() => setShowNotificationsModal(false)}>
                Annuler
              </Button>
            <Button 
              onClick={handleSaveNotificationsConfig}
              className="bg-blue-600 hover:bg-blue-700"
            >
                <Save className="w-4 h-4 mr-2" />
              Sauvegarder la Configuration
              </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAIConfigModal} onOpenChange={setShowAIConfigModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Configuration de l'Intelligence Artificielle</DialogTitle>
            <DialogDescription>Paramétrez l'IA pour optimiser vos processus</DialogDescription>
          </DialogHeader>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Automatisation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="auto-validation" checked={getAiBool('auto_validation', true)} onCheckedChange={(v) => updateAiSettings({ auto_validation: Boolean(v) })} />
                    <Label htmlFor="auto-validation">Validation automatique des commandes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="auto-reminders" checked={getAiBool('auto_reminders', true)} onCheckedChange={(v) => updateAiSettings({ auto_reminders: Boolean(v) })} />
                    <Label htmlFor="auto-reminders">Rappels intelligents</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="auto-forecasts" checked={getAiBool('auto_forecasts', true)} onCheckedChange={(v) => updateAiSettings({ auto_forecasts: Boolean(v) })} />
                    <Label htmlFor="auto-forecasts">Prévisions de vente</Label>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Seuils d'alerte</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="delay-threshold">Seuil de retard (heures)</Label>
                    <Input
                      id="delay-threshold"
                      type="number"
                      value={String(getAiNumber('delay_threshold_hours', 24))}
                      onChange={(e) => updateAiSettings({ delay_threshold_hours: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="stock-threshold">Seuil de stock</Label>
                    <Input
                      id="stock-threshold"
                      type="number"
                      value={String(getAiNumber('stock_threshold', 10))}
                      onChange={(e) => updateAiSettings({ stock_threshold: Number(e.target.value) })}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowAIConfigModal(false)}>
                Annuler
              </Button>
              <Button onClick={handleApplyAIConfig}>
                <Save className="w-4 h-4 mr-2" />
                Appliquer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showForecastsModal} onOpenChange={setShowForecastsModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Analytics Prédictifs</DialogTitle>
            <DialogDescription className="text-gray-600">Prévisions et tendances de vos ventes</DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-6">
            {/* Métriques principales */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-900">{`${forecasts.growthPercent.toFixed(1)}%`}</div>
                  <div className="text-sm text-green-700">Croissance prévue</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-900">{forecasts.predictedOrders}</div>
                  <div className="text-sm text-blue-700">Commandes prévues</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-900">{formatCurrency(forecasts.predictedRevenue)}</div>
                  <div className="text-sm text-purple-700">CA prévu (F CFA)</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-900">{forecasts.anomalies.length}</div>
                  <div className="text-sm text-orange-700">Anomalies détectées</div>
                </CardContent>
              </Card>
            </div>

            {/* Graphique des tendances */}
              <Card>
                <CardHeader>
                <CardTitle className="text-lg">Évolution des ventes (3 mois)</CardTitle>
                <CardDescription>Prévisions basées sur l'historique et les tendances saisonnières</CardDescription>
                </CardHeader>
                <CardContent>
                <div className="h-64 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <TrendingUp className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                    <div className="space-y-2">
                      <p className="text-lg font-semibold text-gray-800">Tendance de croissance</p>
                      <p className="text-sm text-gray-600">Prévision (30j): {`${forecasts.growthPercent.toFixed(1)}%`}</p>
                      <div className="flex justify-center space-x-4 mt-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">↑</div>
                          <div className="text-xs text-gray-600">Croissance</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">→</div>
                          <div className="text-xs text-gray-600">Stable</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">↓</div>
                          <div className="text-xs text-gray-600">Déclin</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  </div>
                </CardContent>
              </Card>

            {/* Détection d'anomalies */}
              <Card>
                <CardHeader>
                <CardTitle className="text-lg">Détection d'anomalies</CardTitle>
                <CardDescription>Commandes nécessitant une attention particulière</CardDescription>
                </CardHeader>
                <CardContent>
                <div className="space-y-3">
                  {forecasts.anomalies.length === 0 ? (
                    <div className="text-sm text-gray-600">Aucune anomalie détectée.</div>
                  ) : (
                    forecasts.anomalies.map((a) => {
                      const icon = a.severity === 'high'
                        ? <AlertCircle className="w-5 h-5 text-red-600" />
                        : a.severity === 'medium'
                          ? <AlertTriangle className="w-5 h-5 text-yellow-600" />
                          : <Clock className="w-5 h-5 text-orange-600" />

                      const wrapperClass = a.severity === 'high'
                        ? 'bg-red-50 border-red-200'
                        : a.severity === 'medium'
                          ? 'bg-yellow-50 border-yellow-200'
                          : 'bg-orange-50 border-orange-200'

                      const badgeClass = a.severity === 'high'
                        ? 'bg-red-100 text-red-800'
                        : a.severity === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-orange-100 text-orange-800'

                      const badgeLabel = a.severity === 'high' ? 'Risque élevé' : a.severity === 'medium' ? 'À surveiller' : 'Urgent'

                      return (
                        <div key={a.title} className={`flex items-center justify-between p-3 rounded-lg border ${wrapperClass}`}>
                          <div className="flex items-center space-x-3">
                            {icon}
                            <div>
                              <p className="font-medium">{a.title}</p>
                              <p className="text-sm text-gray-600">{a.description}</p>
                            </div>
                          </div>
                          <Badge className={badgeClass}>{badgeLabel}</Badge>
                        </div>
                      )
                    })
                  )}
                  </div>
                </CardContent>
              </Card>

            {/* Actions */}
            <div className="flex justify-between items-center">
              <div className="flex space-x-3">
                <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50" onClick={handleRefreshForecasts}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Actualiser
                </Button>
                <SocialShareMenu
                  shareText={`Prévisions: croissance ${forecasts.growthPercent.toFixed(1)}%, ${forecasts.predictedOrders} commandes prévues, CA ${formatCurrency(forecasts.predictedRevenue)}`}
                  shareTitle="Mes prévisions de vente"
                  onShare={(platform) => console.log(`Prévisions partagées sur ${platform}`)}
                >
                  <Button variant="outline" className="border-green-300 text-green-700 hover:bg-green-50">
                    <Share className="w-4 h-4 mr-2" />
                    Partager
                  </Button>
                </SocialShareMenu>
            </div>
              <div className="flex space-x-3">
              <Button variant="outline" onClick={() => setShowForecastsModal(false)}>
                Fermer
              </Button>
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleExportForecasts}>
                <Download className="w-4 h-4 mr-2" />
                  Exporter le rapport
              </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showBulkActionsModal} onOpenChange={setShowBulkActionsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Actions en Lot</DialogTitle>
            <DialogDescription className="text-gray-600">
              {selectedOrdersForBulkAction.length} commande(s) sélectionnée(s)
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-6">
            {/* Résumé des commandes sélectionnées */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Commandes sélectionnées</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {orders.filter(order => selectedOrdersForBulkAction.includes(order.id)).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-2 border rounded text-sm">
                      <span className="font-medium">#{getOrderDisplayNumber(order)}</span>
                      <span className="text-gray-600">{order.customerName}</span>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Actions disponibles */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Actions disponibles :</h3>
            <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => handleBulkAction('confirm')}
                  className="h-auto py-3 px-4 flex flex-col items-center space-y-2"
                >
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm">Confirmer</span>
              </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleBulkAction('ship')}
                  className="h-auto py-3 px-4 flex flex-col items-center space-y-2"
                >
                  <Truck className="w-5 h-5 text-blue-600" />
                  <span className="text-sm">Expédier</span>
              </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleBulkAction('deliver')}
                  className="h-auto py-3 px-4 flex flex-col items-center space-y-2"
                >
                  <Package className="w-5 h-5 text-green-600" />
                  <span className="text-sm">Livrer</span>
              </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleBulkAction('cancel')}
                  className="h-auto py-3 px-4 flex flex-col items-center space-y-2"
                >
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span className="text-sm">Annuler</span>
              </Button>
                <Button 
                  variant="outline" 
                  onClick={handleBulkPaymentRequest}
                  className="h-auto py-3 px-4 flex flex-col items-center space-y-2"
                >
                  <CreditCard className="w-5 h-5 text-orange-600" />
                  <span className="text-sm">Demander paiement</span>
              </Button>
                <Button 
                  variant="outline" 
                  onClick={handleBulkDeliveryValidation}
                  className="h-auto py-3 px-4 flex flex-col items-center space-y-2"
                >
                  <User className="w-5 h-5 text-purple-600" />
                  <span className="text-sm">Valider livraison</span>
              </Button>
            </div>
            </div>

            {/* Bouton de partage des actions en lot */}
            <div className="flex justify-center pt-4">
              <SocialShareMenu
                shareText={`Actions en lot - ${selectedOrdersForBulkAction.length} commande(s) sélectionnée(s) pour traitement`}
                shareTitle="Actions en lot"
                onShare={(platform) => console.log(`Actions en lot partagées sur ${platform}`)}
              >
                <Button 
                  variant="outline" 
                  className="border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  <Share className="w-4 h-4 mr-2" />
                  Partager les actions
                </Button>
              </SocialShareMenu>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={() => setShowBulkActionsModal(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleApplyBulkActions}
                disabled={selectedOrdersForBulkAction.length === 0}
              >
                Appliquer les actions
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showOrderDetailsModal} onOpenChange={setShowOrderDetailsModal}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader>
            <div className="p-6 bg-gradient-to-r from-slate-50 to-slate-100 border-b">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <DialogTitle className="text-xl md:text-2xl font-bold text-slate-900">Détails de commande</DialogTitle>
                  <DialogDescription className="text-slate-600">
                    {selectedOrder ? (
                      <span>
                        Commande #{getOrderDisplayNumber(selectedOrder)}
                        <span className="mx-2">•</span>
                        {selectedOrder.customerName}
                      </span>
                    ) : (
                      ''
                    )}
                  </DialogDescription>
                </div>

                {selectedOrder ? (
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <Badge className={getStatusColor(selectedOrder.status)}>{selectedOrder.status}</Badge>
                      <Badge className={getPaymentStatusColor(selectedOrder.paymentStatus)}>{selectedOrder.paymentStatus}</Badge>
                      {isOrderDetailsSyncLoading && (
                        <Badge className="bg-blue-50 text-blue-700 border border-blue-200">Synchronisation…</Badge>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">ID: {selectedOrder.id}</div>
                  </div>
                ) : null}
              </div>
            </div>
          </DialogHeader>
          {selectedOrder && (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="lg:col-span-2 border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-base md:text-lg">Produits</CardTitle>
                    <CardDescription>
                      {(selectedOrder.products ?? []).length} article(s)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(selectedOrder.products ?? []).length === 0 ? (
                        <div className="text-sm text-slate-600">Aucun produit.</div>
                      ) : (
                        (selectedOrder.products ?? []).map((p, idx) => (
                          <div key={`${p.id}-${idx}`} className="flex items-start justify-between gap-3 p-3 rounded-lg border bg-white">
                            <div className="min-w-0">
                              <div className="font-medium text-slate-900 truncate">{p.name}</div>
                              {(String((p as any)?.warranty ?? '').trim() || String((p as any)?.returnPolicy ?? '').trim()) && (
                                <div className="mt-1 text-xs text-slate-600">
                                  {String((p as any)?.warranty ?? '').trim() && (
                                    <span>
                                      <span className="font-medium">Garantie:</span> {String((p as any)?.warranty ?? '').trim()}
                                    </span>
                                  )}
                                  {String((p as any)?.warranty ?? '').trim() && String((p as any)?.returnPolicy ?? '').trim() ? (
                                    <span className="mx-2">•</span>
                                  ) : null}
                                  {String((p as any)?.returnPolicy ?? '').trim() && (
                                    <span>
                                      <span className="font-medium">Retours:</span> {String((p as any)?.returnPolicy ?? '').trim()}
                                    </span>
                                  )}
                                </div>
                              )}
                              {isOrderProductFreeShippingEligible(p) && (
                                <div className="mt-2 inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                                  Livraison gratuite
                                </div>
                              )}
                              <div className="text-xs text-slate-500">Qté: {p.quantity} · PU: {formatCurrency(Number(p.price ?? 0))}</div>
                            </div>
                            <div className="text-sm font-semibold text-slate-900 whitespace-nowrap">{formatCurrency(Number(p.total ?? (Number(p.price ?? 0) * Number(p.quantity ?? 0))))}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-base md:text-lg">Résumé</CardTitle>
                    <CardDescription>Informations clés</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Date</span>
                      <span className="font-medium text-slate-900">{formatDate(selectedOrder.orderDate)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Mode de paiement</span>
                      <span className="font-medium text-slate-900">{getOrderPaymentProviderLabel(selectedOrder)}</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Total</span>
                      <span className="font-bold text-slate-900">{formatCurrency(selectedOrder.totalAmount)}</span>
                    </div>
                    <div className="text-xs text-slate-500">Adresse: {selectedOrder.shippingAddress || 'Non spécifiée'}</div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-base md:text-lg">Client</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Nom</span>
                      <span className="font-medium text-slate-900">{selectedOrder.customerName}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Email</span>
                      <span className="font-medium text-slate-900 break-all">{selectedOrder.customerEmail || 'Non spécifié'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Téléphone</span>
                      <span className="font-medium text-slate-900">{selectedOrder.customerPhone || 'Non spécifié'}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-base md:text-lg">Actions</CardTitle>
                    <CardDescription>Outils rapides</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => handlePrintOrderDetails(selectedOrder)}>
                      <Printer className="w-4 h-4 mr-2" />
                      Imprimer
                    </Button>
                    <Button variant="outline" onClick={() => handleShareOrder(selectedOrder)}>
                      <Share className="w-4 h-4 mr-2" />
                      Partager
                    </Button>
                    <Button
                      variant="outline"
                      onClick={async () => {
                        const products = (selectedOrder.products ?? []).map(p => `${p.name} x${p.quantity}`).join(', ')
                        const summary = `Commande #${getOrderShortNumber(selectedOrder.id)}\nID: ${selectedOrder.id}\nClient: ${selectedOrder.customerName}\nProduits: ${products || 'N/A'}\nTotal: ${formatCurrency(selectedOrder.totalAmount)}`
                        const ok = await safeCopyToClipboard(summary)
                        showNotification(ok ? 'Copié' : 'Erreur', ok ? 'Résumé copié dans le presse-papiers' : 'Copie impossible sur ce navigateur', ok ? 'success' : 'error')
                      }}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copier
                    </Button>
                    <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-50" onClick={() => handleCancelOrder(selectedOrder.id)}>
                      <XCircle className="w-4 h-4 mr-2" />
                      Annuler
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowOrderDetailsModal(false)}>
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Système de notifications modernes */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`
              max-w-sm w-full bg-white rounded-lg shadow-lg border-l-4 p-4 transform transition-all duration-300 ease-in-out
              ${notification.type === 'success' ? 'border-l-green-500' : ''}
              ${notification.type === 'error' ? 'border-l-red-500' : ''}
              ${notification.type === 'warning' ? 'border-l-yellow-500' : ''}
              ${notification.type === 'info' ? 'border-l-blue-500' : ''}
            `}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {notification.type === 'success' && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
                {notification.type === 'error' && (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                {notification.type === 'warning' && (
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                )}
                {notification.type === 'info' && (
                  <Info className="w-5 h-5 text-blue-500" />
                )}
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {notification.title}
                </p>
                <p className="mt-1 text-sm text-gray-600 whitespace-pre-line">
                  {notification.message}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {notification.timestamp.toLocaleTimeString('fr-FR')}
                </p>
              </div>
              <div className="ml-4 flex-shrink-0">
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Optimisation des Livraisons */}
      <Dialog open={showDeliveryOptimizationModal} onOpenChange={setShowDeliveryOptimizationModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Optimisation des Livraisons</DialogTitle>
            <DialogDescription className="text-gray-600">Optimisez vos coûts et délais de livraison avec l'IA</DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-6">
            {/* Statistiques actuelles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-900">{deliveryMetrics.onTimePercent.toFixed(1)}%</div>
                  <div className="text-sm text-green-700">Livraisons à temps</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-900">{deliveryMetrics.inProgress}</div>
                  <div className="text-sm text-blue-700">Livraisons en cours</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-900">{deliveryMetrics.avgDeliveryDays === null ? 'N/A' : `${deliveryMetrics.avgDeliveryDays.toFixed(1)}j`}</div>
                  <div className="text-sm text-orange-700">Délai moyen</div>
                </CardContent>
              </Card>
            </div>

            {/* Transporteur recommandé */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg text-blue-900">🚚 Transporteur Recommandé</CardTitle>
                <CardDescription className="text-blue-700">Sélectionné par l'IA pour optimiser vos coûts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-3">
                    <Truck className="w-8 h-8 text-blue-600" />
                    <div>
                      <h3 className="font-semibold text-blue-900">{deliveryMetrics.carrierName ?? 'N/A'}</h3>
                      <p className="text-sm text-blue-700">Méthode: {deliveryMetrics.shippingMethodName ?? 'N/A'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-900">{`${deliveryMetrics.progressPercent}%`}</div>
                    <div className="text-sm text-blue-600">Progression</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Temps estimé:</span>
                      <span className="font-medium">{deliveryMetrics.eta ? formatDate(deliveryMetrics.eta) : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Livraison garantie:</span>
                      <span className="font-medium text-green-600">N/A</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Suivi en temps réel:</span>
                      <span className="font-medium text-green-600">N/A</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Livraisons totales:</span>
                      <span className="font-medium">{deliveryMetrics.total}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Livrées:</span>
                      <span className="font-medium text-green-600">{deliveryMetrics.delivered}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 font-semibold">Annulées:</span>
                      <span className="font-bold text-gray-700">{deliveryMetrics.cancelled}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Options d'optimisation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">⚙️ Options d'Optimisation</CardTitle>
                <CardDescription>Personnalisez vos préférences de livraison</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Priorité de livraison</Label>
                    <Select value={deliveryOptimizationPrefs.priority} onValueChange={(v) => setDeliveryOptimizationPrefs((prev) => ({ ...prev, priority: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cost">Coût minimum</SelectItem>
                        <SelectItem value="balanced">Équilibré</SelectItem>
                        <SelectItem value="speed">Vitesse maximale</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Zone de livraison</Label>
                    <Select value={deliveryOptimizationPrefs.zone} onValueChange={(v) => setDeliveryOptimizationPrefs((prev) => ({ ...prev, zone: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="local">Locale</SelectItem>
                        <SelectItem value="national">Nationale</SelectItem>
                        <SelectItem value="international">Internationale</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Notifications de suivi</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="tracking-notifications" checked={deliveryOptimizationPrefs.trackingNotifications} onCheckedChange={(v) => setDeliveryOptimizationPrefs((prev) => ({ ...prev, trackingNotifications: Boolean(v) }))} />
                    <Label htmlFor="tracking-notifications">Activer les notifications de suivi</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-between items-center">
              <div className="flex space-x-3">
                <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50" onClick={handleExportDeliveryReport}>
                  <Download className="w-4 h-4 mr-2" />
                  Exporter le rapport
                </Button>
                <SocialShareMenu
                  shareText={`🚚 Optimisation des livraisons: transporteur ${deliveryMetrics.carrierName ?? 'N/A'}, méthode ${deliveryMetrics.shippingMethodName ?? 'N/A'}, livraisons à temps ${deliveryMetrics.onTimePercent.toFixed(1)}%.`}
                  shareTitle="Optimisation des livraisons"
                  onShare={(platform) => console.log(`Optimisation partagée sur ${platform}`)}
                >
                  <Button variant="outline" className="border-green-300 text-green-700 hover:bg-green-50">
                    <Share className="w-4 h-4 mr-2" />
                    Partager
                  </Button>
                </SocialShareMenu>
              </div>
              <div className="flex space-x-3">
                <Button variant="outline" onClick={() => setShowDeliveryOptimizationModal(false)}>
                  Fermer
                </Button>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={handleApplyDeliveryOptimization}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Appliquer l'optimisation
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Gestion des Litiges */}
      <Dialog open={showDisputesModal} onOpenChange={setShowDisputesModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Gestion Intelligente des Litiges</DialogTitle>
            <DialogDescription className="text-gray-600">Résolvez et prévenez les litiges avec l'aide de l'IA</DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-6">
            {/* Statistiques des litiges */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-900">{disputeMetrics.disputeRate.toFixed(1)}%</div>
                  <div className="text-sm text-green-700">Taux de litiges</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-900">{disputeMetrics.avgResolutionHours === null ? 'N/A' : `${disputeMetrics.avgResolutionHours.toFixed(1)}h`}</div>
                  <div className="text-sm text-blue-700">Résolution moyenne</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-900">{vendorDisputes.length}</div>
                  <div className="text-sm text-purple-700">Total litiges</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-900">{disputeMetrics.disputesThisMonth}</div>
                  <div className="text-sm text-orange-700">Litiges ce mois</div>
                </CardContent>
              </Card>
            </div>

            {/* Fonctionnalités IA */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <CardHeader>
                  <CardTitle className="text-lg text-green-900">🤖 Résolution Automatique</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">{disputeAiPrefs.enabled ? 'Actif' : 'Inactif'}</div>
                  <p className="text-sm text-green-700">Taux de résolution observé: {disputeResolvedPercent.toFixed(0)}%</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-lg text-blue-900">🛡️ Prévention des Conflits</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{disputeAiPrefs.enabled ? 'Actif' : 'Inactif'}</div>
                  <p className="text-sm text-blue-700">Anomalies (Prévisions): {forecasts.anomalies.length}</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200">
                <CardHeader>
                  <CardTitle className="text-lg text-purple-900">💬 Chat de Support IA</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">{disputeAiPrefs.enabled ? 'Actif' : 'Inactif'}</div>
                  <p className="text-sm text-purple-700">Basé sur vos paramètres vendeur</p>
                </CardContent>
              </Card>
            </div>

            {/* Litiges en cours */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">📋 Litiges en Cours</CardTitle>
                <CardDescription>Suivi et résolution des litiges actifs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {vendorDisputes.length === 0 ? (
                    <div className="text-sm text-gray-600">Aucun litige trouvé.</div>
                  ) : (
                    vendorDisputes.slice(0, 10).map((dispute) => {
                      const statusRaw = String((dispute as any)?.status ?? 'en_cours').toLowerCase()
                      const isResolved = statusRaw.includes('res') || statusRaw.includes('clos') || statusRaw.includes('closed')
                      const badgeClass = isResolved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      const icon = isResolved ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      const type = String((dispute as any)?.type ?? (dispute as any)?.dispute_type ?? 'Litige')
                      const description = String((dispute as any)?.description ?? (dispute as any)?.message ?? type)
                      const createdAt = String((dispute as any)?.created_at ?? (dispute as any)?.createdAt ?? '')

                      return (
                        <div key={(dispute as any)?.id ?? `${(dispute as any)?.order_id}-${createdAt}`} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                          <div className="flex items-center space-x-3">
                            {icon}
                            <div>
                              <p className="font-medium">Commande #{String((dispute as any)?.order_id ?? '').slice(0, 8)}</p>
                              <p className="text-sm text-gray-600">{description}</p>
                              <p className="text-xs text-gray-500">{createdAt ? formatDate(createdAt) : ''}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={badgeClass}>{isResolved ? 'Résolu' : 'En cours'}</Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleViewDisputeDetails({
                                  id: String((dispute as any)?.id ?? ''),
                                  orderId: String((dispute as any)?.order_id ?? ''),
                                  type,
                                  description,
                                  status: (isResolved ? 'résolu' : 'en_cours') as any,
                                  openedAt: createdAt,
                                  resolvedAt: String((dispute as any)?.resolved_at ?? (dispute as any)?.resolvedAt ?? '') || undefined,
                                  customerName: String((dispute as any)?.customer_name ?? ''),
                                  priority: 'normal'
                                })
                              }
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Voir
                            </Button>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-between items-center">
              <div className="flex space-x-3">
                <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50" onClick={handleExportDisputesReport}>
                  <Download className="w-4 h-4 mr-2" />
                  Exporter le rapport
                </Button>
                <SocialShareMenu
                  shareText={`🛡️ Litiges: taux ${disputeMetrics.disputeRate.toFixed(1)}%, résolution moyenne ${disputeMetrics.avgResolutionHours === null ? 'N/A' : `${disputeMetrics.avgResolutionHours.toFixed(1)}h`}, total ${(vendorDisputes ?? []).length}.`}
                  shareTitle="Gestion intelligente des litiges"
                  onShare={(platform) => console.log(`Gestion des litiges partagée sur ${platform}`)}
                >
                  <Button variant="outline" className="border-green-300 text-green-700 hover:bg-green-50">
                    <Share className="w-4 h-4 mr-2" />
                    Partager
                  </Button>
                </SocialShareMenu>
              </div>
              <div className="flex space-x-3">
                <Button variant="outline" onClick={() => setShowDisputesModal(false)}>
                  Fermer
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleCreateDispute}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Nouveau litige
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateDisputeModal} onOpenChange={setShowCreateDisputeModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">Nouveau litige</DialogTitle>
            <DialogDescription className="text-gray-600">Crée un litige réel (persisté en base) pour une commande.</DialogDescription>
          </DialogHeader>

          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Commande</Label>
                <Select value={createDisputeForm.orderId} onValueChange={(v) => setCreateDisputeForm((prev) => ({ ...prev, orderId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une commande" />
                  </SelectTrigger>
                  <SelectContent>
                    {(orders ?? []).slice(0, 200).map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        #{getOrderDisplayNumber(o)} — {o.customerName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priorité</Label>
                <Select value={createDisputeForm.priority} onValueChange={(v) => setCreateDisputeForm((prev) => ({ ...prev, priority: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Faible</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">Élevé</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={createDisputeForm.type} onValueChange={(v) => setCreateDisputeForm((prev) => ({ ...prev, type: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Général</SelectItem>
                    <SelectItem value="delivery">Livraison</SelectItem>
                    <SelectItem value="payment">Paiement</SelectItem>
                    <SelectItem value="product">Produit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sujet</Label>
                <Input value={createDisputeForm.subject} onChange={(e) => setCreateDisputeForm((prev) => ({ ...prev, subject: e.target.value }))} placeholder="Ex: Produit endommagé" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={createDisputeForm.description} onChange={(e) => setCreateDisputeForm((prev) => ({ ...prev, description: e.target.value }))} placeholder="Décris le problème en détail..." />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateDisputeModal(false)}>
                Annuler
              </Button>
              <Button onClick={handleSubmitCreateDispute} disabled={isActionLoading}>
                <Save className="w-4 h-4 mr-2" />
                Créer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Détails des Litiges */}
      <Dialog open={showDisputeDetailsModal} onOpenChange={setShowDisputeDetailsModal}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Détails du Litige</DialogTitle>
            <DialogDescription className="text-gray-600">Informations complètes sur le litige sélectionné</DialogDescription>
          </DialogHeader>
          
          {selectedDispute && (
            <div className="p-6 space-y-6">
              {/* En-tête du litige */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Litige #{selectedDispute.id}</h3>
                    <p className="text-lg text-gray-700">{selectedDispute.type}</p>
                  </div>
                  <div className="text-right">
                    <Badge 
                      className={
                        selectedDispute.status === 'en_cours' ? 'bg-yellow-100 text-yellow-800' :
                        selectedDispute.status === 'résolu' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }
                    >
                      {selectedDispute.status === 'en_cours' ? 'En cours' :
                       selectedDispute.status === 'résolu' ? 'Résolu' : 'Fermé'}
                    </Badge>
                    <Badge 
                      className={`ml-2 ${
                        selectedDispute.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        selectedDispute.priority === 'critique' ? 'bg-purple-100 text-purple-800' :
                        'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {selectedDispute.priority === 'urgent' ? 'Urgent' :
                       selectedDispute.priority === 'critique' ? 'Critique' : 'Normal'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Informations détaillées */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informations Générales</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">Commande:</span>
                      <span className="text-sm">#{selectedDispute.orderId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">Client:</span>
                      <span className="text-sm">{selectedDispute.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">Ouvert:</span>
                      <span className="text-sm">{selectedDispute.openedAt}</span>
                    </div>
                    {selectedDispute.resolvedAt && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600">Résolu:</span>
                        <span className="text-sm">{selectedDispute.resolvedAt}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{selectedDispute.description}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Historique des actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Historique des Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">Litige créé</p>
                        <p className="text-xs text-blue-700">{selectedDispute.openedAt}</p>
                      </div>
                    </div>
                    {selectedDispute.status === 'en_cours' && (
                      <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        <div>
                          <p className="text-sm font-medium text-yellow-900">En cours de traitement</p>
                          <p className="text-xs text-yellow-700">IA analyse en cours...</p>
                        </div>
                      </div>
                    )}
                    {selectedDispute.status === 'résolu' && (
                      <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-green-900">Résolu</p>
                          <p className="text-xs text-green-700">{selectedDispute.resolvedAt}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Actions disponibles */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Actions Disponibles</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-3">
                    {selectedDispute.status === 'en_cours' && (
                      <>
                        <Button 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleResolveDispute(selectedDispute.id)}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Résolution...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Résoudre le litige
                            </>
                          )}
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => setShowDisputeDetailsModal(false)}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                              Fermeture...
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 mr-2" />
                              Fermer le litige
                            </>
                          )}
                        </Button>
                      </>
                    )}
                    <Button 
                      variant="outline"
                      onClick={() => setShowDisputeDetailsModal(false)}
                    >
                      Fermer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
  </div>
);
}