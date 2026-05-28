"use client"

import { useEffect, useMemo, useState } from 'react'
import { 
  Coins, TrendingUp, TrendingDown, DollarSign, Download, Filter,
  Search, Gift, History, Wallet, Target, BarChart3,
  ArrowUp, ArrowDown, Minus, RefreshCw, Copy, ExternalLink,
  Calendar, Users, Star, Zap, Clock, CheckCircle, XCircle,
  Sparkles, Crown, Trophy, PiggyBank, Rocket, 
  Activity, PieChart, LineChart, BarChart,
  Smartphone, CreditCard, Banknote, QrCode, Share2,
  Heart, Star as StarIcon, Eye, EyeOff, Settings,
  Bell, AlertCircle, Info, HelpCircle, ChevronRight,
  ChevronLeft, Plus, Minus as MinusIcon, RotateCcw,
  Globe, Loader2, Snowflake
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ClientPointsService, type ClientRewardOption } from '@/lib/services/client-points-service'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from '@/components/ui/chart'
import {
  Line,
  LineChart as RechartsLineChart,
  Bar as RechartsBar,
  BarChart as RechartsBarChart,
  Area as RechartsArea,
  AreaChart as RechartsAreaChart,
  Pie as RechartsPie,
  PieChart as RechartsPieChart,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis
} from 'recharts'

interface PointData {
  balance: number
  isFallback?: boolean
  totalEarned: number
  totalSpent: number
  totalTransferred: number
  conversionRate: number
  exchangeRate: number
  pendingRequests: number
  withdrawalRequests?: Array<{
    id: string
    amount: number
    method: string | null
    status: string
    timestamp: string
  }>
  overview?: {
    balanceTrend: Array<{ date: string; balance: number; earned: number; spent: number }>
    categoryBreakdown: Array<{ type: PointData['history'][number]['type']; value: number }>
  }
  sharesData: {
    totalShares: number
    sharesThisMonth: number
    pointsFromShares: number
    viralScore: number
    topSharedProducts: Array<{
      id: string
      name: string
      image: string
      shares: number
      points: number
      revenue: number
      isOwnProduct: boolean
    }>
    socialNetworkStats: {
      facebook: { shares: number; points: number; engagement: number }
      instagram: { shares: number; points: number; engagement: number }
      twitter: { shares: number; points: number; engagement: number }
      whatsapp: { shares: number; points: number; engagement: number }
      linkedin: { shares: number; points: number; engagement: number }
    }
    userEngagement: Array<{
      id: string
      name: string
      avatar: string
      totalShares: number
      pointsEarned: number
      lastShareDate: string
      favoriteCategories: string[]
      engagementScore: number
    }>
  }
  history: Array<{
    id: string
    type: 'earned' | 'spent' | 'transferred' | 'exchanged' | 'bonus' | 'share_bonus'
    amount: number
    description: string
    timestamp: string
    status: 'completed' | 'pending' | 'failed'
    source?: string
    recipient?: string
    productId?: string
    socialNetwork?: string
    shareType?: 'product' | 'category' | 'campaign'
  }>
  topEarners: Array<{
    id: string
    name: string
    avatar: string
    points: number
    shares: number
    revenue: number
    engagementScore: number
    favoriteCategories: string[]
  }>
  exchangeHistory: Array<{
    id: string
    amount: number
    rate: number
    total: number
    timestamp: string
    status: 'completed' | 'pending' | 'failed'
  }>
  predictiveAnalytics?: {
    nextMonthPrediction: number
    growthTrend: 'increasing' | 'decreasing' | 'stable'
    recommendedActions: string[]
    marketOpportunities: Array<{
      category: string
      potentialPoints: number
      difficulty: 'low' | 'medium' | 'high'
    }>
  }
  configuration?: {
    settings: {
      defaultCurrency: string
      conversionRate: number
      minBalance: number
      maxBalance: number | null
      transferEnabled: boolean
      exchangeEnabled: boolean
      withdrawalEnabled: boolean
    }
    fees: {
      transfer: {
        flat: number
        percentage: number
        minimum: number
        maximum: number | null
        currency: string
      }
      exchange: {
        flat: number
        percentage: number
        minimum: number
        maximum: number | null
        currency: string
      }
      withdrawal: {
        flat: number
        percentage: number
        minimum: number
        maximum: number | null
        currency: string
      }
    }
    limits: {
      transfer: {
        min: number
        max: number | null
        daily: number | null
        monthly: number | null
      }
      exchange: {
        min: number
        max: number | null
        daily: number | null
        monthly: number | null
      }
      withdrawal: {
        min: number
        max: number | null
        daily: number | null
        monthly: number | null
      }
    }
    exchangeRates: Array<{
      currency: string
      rate: number
      isDefault: boolean
    }>
    withdrawalMethods: Array<{
      id: string
      name: string
      description: string | null
      isActive: boolean
      limits: Array<{
        currency: string
        minAmount: number
        maxAmount: number | null
        processingTime: string | null
      }>
    }>
  }
}

interface TransferRecipient {
  id: string
  fullName: string
  email: string | null
  phone: string | null
  username: string | null
  shortCode: string | null
}

interface PointSectionProps {
  vendorId?: string
  pointData: PointData
  onTransferPoints: (recipientId: string, amount: number, message?: string) => Promise<void> | void
  onExchangePoints: (fromCurrency: string, toCurrency: string, amount: number) => Promise<void> | void
  onRedeemReward?: (rewardId: string, amount: number) => Promise<void> | void
  onRequestWithdrawal: (amount: number, method: string, phoneNumber?: string) => Promise<void> | void
  onSearchRecipients: (query: string) => Promise<TransferRecipient[]>
}

type SellerPointsUiPrefs = {
  showBalance: boolean
  notificationsEnabled: boolean
}

const getSellerPointsPrefsKey = (vendorId?: string) =>
  vendorId ? `seller_points_ui_prefs:${vendorId}` : 'seller_points_ui_prefs'

const loadSellerPointsPrefs = (vendorId?: string): SellerPointsUiPrefs | null => {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(getSellerPointsPrefsKey(vendorId))
    if (!raw) return null
    return JSON.parse(raw) as SellerPointsUiPrefs
  } catch {
    return null
  }
}

const saveSellerPointsPrefs = (vendorId: string | undefined, prefs: SellerPointsUiPrefs) => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(getSellerPointsPrefsKey(vendorId), JSON.stringify(prefs))
  } catch {
    // ignore quota / private mode
  }
}

const transactionTypeLabels: Record<PointData['history'][number]['type'], string> = {
  earned: 'Points gagnés',
  spent: 'Points dépensés',
  transferred: 'Points transférés',
  exchanged: 'Points échangés',
  bonus: 'Bonus',
  share_bonus: 'Bonus partage'
}

const difficultyLabels: Record<'low' | 'medium' | 'high', string> = {
  low: 'Faible',
  medium: 'Moyenne',
  high: 'Élevée'
}

const difficultyColors: Record<'low' | 'medium' | 'high', string> = {
  low: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-rose-100 text-rose-700'
}

/**
 * Calcule les frais d'opération (fixe + pourcentage) en appliquant minimum/maximum.
 */
const calculateFee = (
  amount: number,
  feeConfig:
    | {
        flat: number
        percentage: number
        minimum: number
        maximum: number | null
      }
    | null
    | undefined
): number => {
  if (!feeConfig || amount <= 0) {
    return 0
  }

  const percentagePart = (amount * (feeConfig.percentage || 0)) / 100
  let totalFee = (feeConfig.flat || 0) + percentagePart
  totalFee = Math.max(totalFee, feeConfig.minimum || 0)
  if (feeConfig.maximum !== null && feeConfig.maximum !== undefined) {
    totalFee = Math.min(totalFee, feeConfig.maximum)
  }
  return Number(totalFee.toFixed(2))
}

export default function PointSection({
  vendorId,
  pointData,
  onTransferPoints,
  onExchangePoints,
  onRedeemReward,
  onRequestWithdrawal,
  onSearchRecipients
}: PointSectionProps) {
  const isPointsFrozen = Boolean((pointData as any)?.isFrozen ?? false)
  const pointsFrozenReason = (((pointData as any)?.freezeReason ?? '') as string).toString().trim()
  const isFallbackData = Boolean((pointData as any)?.isFallback ?? false)

  const [showBalance, setShowBalance] = useState(true)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [showExchangeModal, setShowExchangeModal] = useState(false)
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  
  const [notifications, setNotifications] = useState<Array<{
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message: string
    timestamp: Date
  }>>([])
  const [error, setError] = useState<string | null>(null)

  const [transferData, setTransferData] = useState({
    recipientId: '',
    amount: 0,
    message: ''
  })

  const [recipientQuery, setRecipientQuery] = useState('')
  const [recipientResults, setRecipientResults] = useState<TransferRecipient[]>([])
  const [isSearchingRecipient, setIsSearchingRecipient] = useState(false)
  const [selectedRecipient, setSelectedRecipient] = useState<TransferRecipient | null>(null)

  const [exchangeData, setExchangeData] = useState({
    fromCurrency: 'Points',
    toCurrency: 'XOF',
    amount: 0
  })

  const [withdrawalData, setWithdrawalData] = useState({
    amount: 0,
    method: 'Mobile Money',
    phoneNumber: '',
  })

  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  const [rewardOptions, setRewardOptions] = useState<ClientRewardOption[]>([])
  const [isRewardOptionsLoading, setIsRewardOptionsLoading] = useState(false)
  const [rewardOptionsError, setRewardOptionsError] = useState<string | null>(null)

  const [historyQuery, setHistoryQuery] = useState('')
  const [historyTypeFilter, setHistoryTypeFilter] = useState<'all' | PointData['history'][number]['type']>('all')

  const resolvedExchangeOptions = useMemo(() => {
    return rewardOptions.map((reward) => ({
      id: reward.id,
      title: reward.name,
      description: reward.description ?? '',
      pointsRequired: Number(reward.pointsCost ?? 0),
      __kind: 'reward' as const,
      __reward: reward
    }))
  }, [rewardOptions])

  const isUsingRewardsCatalog = rewardOptions.length > 0

  useEffect(() => {
    const prefs = loadSellerPointsPrefs(vendorId)
    if (!prefs) return
    setShowBalance(prefs.showBalance)
    setNotificationsEnabled(prefs.notificationsEnabled)
  }, [vendorId])

  const persistUiPrefs = (partial: Partial<SellerPointsUiPrefs>) => {
    const next: SellerPointsUiPrefs = {
      showBalance: partial.showBalance ?? showBalance,
      notificationsEnabled: partial.notificationsEnabled ?? notificationsEnabled
    }
    saveSellerPointsPrefs(vendorId, next)
  }

  useEffect(() => {
    if (!showExchangeModal) {
      return
    }

    let cancelled = false

    const loadRewards = async () => {
      try {
        setIsRewardOptionsLoading(true)
        setRewardOptionsError(null)
        const rewards = await ClientPointsService.listAvailableRewards()
        if (cancelled) return
        setRewardOptions(rewards)

        if (rewards.length === 0) {
          setRewardOptionsError("Aucune récompense n'est disponible pour le moment.")
        }
      } catch (e) {
        if (cancelled) return
        setRewardOptions([])
        setRewardOptionsError(e instanceof Error ? e.message : "Impossible de charger les récompenses")
      } finally {
        if (!cancelled) {
          setIsRewardOptionsLoading(false)
        }
      }
    }

    void loadRewards()

    return () => {
      cancelled = true
    }
  }, [showExchangeModal])

  const configuration = useMemo(() => {
    return pointData.configuration ?? {
      settings: {
        defaultCurrency: 'XOF',
        conversionRate: 1,
        purchaseValue: 1,
        withdrawalValue: 1,
        socialShareValue: 0,
        basePointsPerFCFA: 1,
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
  }, [pointData.configuration])

  const defaultCurrency = configuration.settings.defaultCurrency || 'XOF'

  const transferAllowed = configuration.settings.transferEnabled !== false
  const exchangeAllowed = configuration.settings.exchangeEnabled !== false
  const withdrawalAllowed = configuration.settings.withdrawalEnabled !== false

  const withdrawalValue = useMemo(() => {
    const raw = Number((configuration.settings as any)?.withdrawalValue)
    if (Number.isFinite(raw) && raw > 0) return raw
    const fallback = Number((configuration.settings as any)?.conversionRate)
    return Number.isFinite(fallback) && fallback > 0 ? fallback : 1
  }, [configuration.settings])

  const basePointsPerFCFA = useMemo(() => {
    const raw = Number((configuration.settings as any)?.basePointsPerFCFA)
    return Number.isFinite(raw) && raw > 0 ? raw : 1
  }, [configuration.settings])

  const basePointValue = useMemo(() => 1 / basePointsPerFCFA, [basePointsPerFCFA])

  const history = pointData.history ?? []
  const filteredHistory = useMemo(() => {
    const query = historyQuery.trim().toLowerCase()
    return history.filter((item) => {
      if (historyTypeFilter !== 'all' && item.type !== historyTypeFilter) {
        return false
      }
      if (!query) {
        return true
      }
      const haystack = [
        item.description,
        item.source,
        item.recipient,
        item.socialNetwork,
        item.shareType,
        item.status
      ]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase())
        .join(' ')
      return haystack.includes(query)
    })
  }, [history, historyQuery, historyTypeFilter])
  const topEarners = pointData.topEarners ?? []
  const withdrawalRequests = (pointData as any)?.withdrawalRequests ?? []
  const overview = pointData.overview ?? { balanceTrend: [], categoryBreakdown: [] }
  const balanceTrendData = overview.balanceTrend
  const categoryBreakdownData = overview.categoryBreakdown.map((item: { type: PointData['history'][number]['type']; value: number }) => ({
    type: item.type,
    label: transactionTypeLabels[item.type] ?? item.type,
    value: item.value
  }))
  const predictiveAnalytics = pointData.predictiveAnalytics ?? {
    nextMonthPrediction: 0,
    growthTrend: 'stable' as const,
    recommendedActions: [],
    marketOpportunities: [] as Array<{ category: string; potentialPoints: number; difficulty: 'low' | 'medium' | 'high' }>
  }
  const balanceChartConfig = {
    balance: { label: 'Solde', color: 'hsl(25, 95%, 54%)' },
    earned: { label: 'Points gagnés', color: 'hsl(142, 71%, 45%)' },
    spent: { label: 'Points dépensés', color: 'hsl(0, 72%, 51%)' }
  } as const
  const breakdownChartConfig = {
    value: { label: 'Points', color: 'hsl(25, 95%, 54%)' }
  } as const
  const analyticsTrendConfig = {
    earned: { label: 'Gains', color: 'hsl(142, 71%, 45%)' },
    spent: { label: 'Dépenses', color: 'hsl(0, 72%, 51%)' }
  } as const
  const socialNetworkChartConfig = {
    points: { label: 'Points', color: 'hsl(25, 95%, 54%)' }
  } as const
  const topEarnersChartConfig = {
    points: { label: 'Points', color: 'hsl(25, 95%, 54%)' }
  } as const

  const analyticsTrendData = balanceTrendData.slice(-14).map((day: { date: string; earned: number; spent: number }) => ({
    date: day.date,
    earned: day.earned,
    spent: day.spent,
    net: Math.max(day.earned - day.spent, 0)
  }))

  const downloadCsvFile = (filename: string, rows: string[][]) => {
    const escapeCell = (value: string) => `"${value.replace(/"/g, '""')}"`
    const csv = rows.map((row) => row.map((cell) => escapeCell(String(cell ?? ''))).join(';')).join('\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleExport = async (format: 'csv' | 'pdf') => {
    if (filteredHistory.length === 0) {
      addNotification('warning', 'Export', 'Aucune transaction à exporter avec les filtres actuels.')
      return
    }

    const rowsForExport = filteredHistory.map((item) => [
      new Date(item.timestamp).toLocaleString('fr-FR'),
      transactionTypeLabels[item.type] ?? item.type,
      item.description,
      String(item.amount),
      item.status
    ])

    if (format === 'csv') {
      downloadCsvFile(
        `historique-points-${new Date().toISOString().slice(0, 10)}.csv`,
        [['Date', 'Type', 'Description', 'Montant (pts)', 'Statut'], ...rowsForExport]
      )
      addNotification('success', 'Export CSV', 'Le fichier CSV a été téléchargé.')
      return
    }

    try {
      const { default: jsPDF } = await import('jspdf')
      const autoTable = (await import('jspdf-autotable')).default
      const doc = new jsPDF({ orientation: 'landscape' })
      autoTable(doc, {
        head: [['Date', 'Type', 'Description', 'Montant (pts)', 'Statut']],
        body: rowsForExport,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [255, 102, 0] }
      })
      doc.save(`historique-points-${new Date().toISOString().slice(0, 10)}.pdf`)
      addNotification('success', 'Export PDF', 'Le fichier PDF a été téléchargé.')
    } catch (exportError) {
      console.error('Export PDF historique points:', exportError)
      addNotification('error', 'Export PDF', "Impossible de générer le PDF pour l'instant.")
    }
  }

  const averageShareEngagement = useMemo(() => {
    const stats = Object.values(pointData.sharesData?.socialNetworkStats || {})
    const withShares = stats.filter((entry) => entry.shares > 0)
    if (withShares.length === 0) {
      return 0
    }
    return Math.round(withShares.reduce((sum, entry) => sum + entry.engagement, 0) / withShares.length)
  }, [pointData.sharesData?.socialNetworkStats])

  const socialNetworkData = Object.entries(pointData.sharesData?.socialNetworkStats || {}).map(([network, stats]) => ({
    network,
    label: network,
    shares: stats.shares,
    points: stats.points,
    engagement: stats.engagement
  })).filter(item => item.points > 0)

  const topEarnersChartData = topEarners.slice(0, 6).map(earner => ({
    id: earner.id,
    name: earner.name,
    points: earner.points,
    shares: earner.shares
  }))

  const socialNetworkColors = ['#FF6B35', '#FFA552', '#FFD07C', '#FFE6A7', '#F2F4F3']

  const transferLimits = configuration.limits.transfer
  const exchangeLimits = configuration.limits.exchange
  const withdrawalLimits = useMemo(() => {
    const min = Number((configuration.limits.withdrawal as any)?.min)
    const maxRaw = (configuration.limits.withdrawal as any)?.max
    const max = maxRaw === null || maxRaw === undefined ? null : Number(maxRaw)
    return {
      ...configuration.limits.withdrawal,
      min: Number.isFinite(min) ? min : 0,
      max: max !== null && Number.isFinite(max) ? max : null
    }
  }, [configuration.limits.withdrawal])

  const availableExchangeRates = configuration.exchangeRates.length > 0
    ? configuration.exchangeRates
    : [{ currency: defaultCurrency, rate: configuration.settings.conversionRate, isDefault: true }]

  const selectedExchangeRate = useMemo(() => {
    return availableExchangeRates.find(rate => rate.currency === exchangeData.toCurrency) || availableExchangeRates[0]
  }, [availableExchangeRates, exchangeData.toCurrency])

  const activeWithdrawalMethods = useMemo(
    () => configuration.withdrawalMethods.filter(method => method.isActive),
    [configuration.withdrawalMethods]
  )

  const selectedWithdrawalMethod = useMemo(() => {
    const withinActive = activeWithdrawalMethods.find(method => method.name === withdrawalData.method)
    if (withinActive) {
      return withinActive
    }
    return activeWithdrawalMethods[0] || null
  }, [activeWithdrawalMethods, withdrawalData.method])

  const selectedWithdrawalLimit = useMemo(() => {
    if (!selectedWithdrawalMethod) {
      return null
    }
    return selectedWithdrawalMethod.limits.find(limit => limit.currency === defaultCurrency) || selectedWithdrawalMethod.limits[0] || null
  }, [selectedWithdrawalMethod, defaultCurrency])

  const requiresWithdrawalPhone = Boolean(
    selectedWithdrawalMethod?.name?.toLowerCase().includes('mobile') ||
      withdrawalData.method.toLowerCase().includes('mobile')
  )

  const transferFee = calculateFee(transferData.amount, configuration.fees.transfer)
  const transferTotal = Number((transferData.amount + transferFee).toFixed(2))

  const exchangeFee = calculateFee(exchangeData.amount, configuration.fees.exchange)
  const exchangeTotal = Number((exchangeData.amount + exchangeFee).toFixed(2))
  const exchangeConvertedAmount = selectedExchangeRate
    ? Number((exchangeData.amount * selectedExchangeRate.rate).toFixed(2))
    : 0

  const withdrawalFee = calculateFee(withdrawalData.amount, configuration.fees.withdrawal)
  const withdrawalTotal = Number((withdrawalData.amount + withdrawalFee).toFixed(2))
  const withdrawalPayout = Number((withdrawalData.amount * withdrawalValue).toFixed(2))

  const transferLimitMessage = useMemo(() => {
    if (transferData.amount <= 0) {
      return null
    }
    if (transferLimits.min !== null && transferLimits.min !== undefined && transferData.amount < transferLimits.min) {
      return `Nombre de points minimum autorisé : ${formatNumber(transferLimits.min)} pts`
    }
    if (transferLimits.max !== null && transferLimits.max !== undefined && transferData.amount > transferLimits.max) {
      return `Nombre de points maximum autorisé : ${formatNumber(transferLimits.max)} pts`
    }
    if (transferTotal > pointData.balance) {
      return 'Solde insuffisant pour couvrir le transfert et les frais'
    }
    return null
  }, [transferData.amount, transferLimits.min, transferLimits.max, transferTotal, pointData.balance])

  const exchangeLimitMessage = useMemo(() => {
    if (exchangeData.amount <= 0) {
      return null
    }
    if (exchangeLimits.min !== null && exchangeLimits.min !== undefined && exchangeData.amount < exchangeLimits.min) {
      return `Nombre de points minimum à échanger : ${formatNumber(exchangeLimits.min)} pts`
    }
    if (exchangeLimits.max !== null && exchangeLimits.max !== undefined && exchangeData.amount > exchangeLimits.max) {
      return `Nombre de points maximum à échanger : ${formatNumber(exchangeLimits.max)} pts`
    }
    if (exchangeTotal > pointData.balance) {
      return 'Solde insuffisant pour couvrir l’échange et les frais'
    }
    return null
  }, [exchangeData.amount, exchangeLimits.min, exchangeLimits.max, exchangeTotal, pointData.balance])

  const withdrawalLimitMessage = useMemo(() => {
    if (withdrawalData.amount <= 0) {
      return null
    }
    const minLimit = selectedWithdrawalLimit?.minAmount ?? withdrawalLimits.min
    const maxLimit = selectedWithdrawalLimit?.maxAmount ?? withdrawalLimits.max
    if (minLimit !== null && minLimit !== undefined && withdrawalData.amount < minLimit) {
      return `Nombre de points minimum à retirer : ${formatNumber(minLimit)} pts`
    }
    if (maxLimit !== null && maxLimit !== undefined && withdrawalData.amount > maxLimit) {
      return `Nombre de points maximum à retirer : ${formatNumber(maxLimit)} pts`
    }
    if (withdrawalTotal > pointData.balance) {
      return 'Solde insuffisant pour couvrir le retrait et les frais'
    }
    return null
  }, [withdrawalData.amount, withdrawalLimits.min, withdrawalLimits.max, selectedWithdrawalLimit?.minAmount, selectedWithdrawalLimit?.maxAmount, withdrawalTotal, pointData.balance])

  useEffect(() => {
    if (!selectedWithdrawalMethod && activeWithdrawalMethods.length > 0) {
      setWithdrawalData(prev => ({ ...prev, method: activeWithdrawalMethods[0].name }))
    }
  }, [activeWithdrawalMethods, selectedWithdrawalMethod])

  useEffect(() => {
    if (!recipientQuery.trim()) {
      setRecipientResults([])
      if (!transferData.recipientId) {
        setSelectedRecipient(null)
      }
      return
    }

    const selectedDisplay = selectedRecipient ? getRecipientDisplayName(selectedRecipient) : null
    if (selectedDisplay && recipientQuery === selectedDisplay) {
      setRecipientResults([])
      return
    }

    const handler = setTimeout(async () => {
      try {
        setIsSearchingRecipient(true)
        const results = await onSearchRecipients(recipientQuery)
        setRecipientResults(results)
      } catch (searchError) {
        console.error('❌ Erreur lors de la recherche de destinataires:', searchError)
        setRecipientResults([])
      } finally {
        setIsSearchingRecipient(false)
      }
    }, 350)

    return () => clearTimeout(handler)
  }, [recipientQuery, selectedRecipient, onSearchRecipients, transferData.recipientId])

  const normalizeCurrencyCode = (currency?: string | null) => {
    const upper = (currency || defaultCurrency || 'XOF').toUpperCase()
    if (upper === 'FCFA') {
      return 'XOF'
    }
    if (upper.length !== 3) {
      return (defaultCurrency || 'XOF').toUpperCase()
    }
    return upper
  }

  const formatCurrencyWithSymbol = (amount: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: normalizeCurrencyCode(currency)
    }).format(amount)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(num)
  }

  const formatPoints = (num: number) => `${new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(num)} pts`

  const formatLimitValue = (value: number | null) =>
    value === null || value === undefined ? 'Illimité' : formatPoints(value)

  const formatPercentage = (value: number) => `${value.toLocaleString('fr-FR', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0
  })}%`

  const feeSummaries = [
    { key: 'transfer', label: 'Transfert', config: configuration.fees.transfer },
    { key: 'exchange', label: 'Échange', config: configuration.fees.exchange },
    { key: 'withdrawal', label: 'Retrait', config: configuration.fees.withdrawal }
  ] as const

  const limitSummaries = [
    { key: 'transfer', label: 'Transfert', config: configuration.limits.transfer },
    { key: 'exchange', label: 'Échange', config: configuration.limits.exchange },
    { key: 'withdrawal', label: 'Retrait', config: configuration.limits.withdrawal }
  ] as const

  const getRecipientDisplayName = (recipient: TransferRecipient) =>
    recipient.fullName?.trim() ||
    recipient.username?.trim() ||
    recipient.email?.trim() ||
    recipient.phone?.trim() ||
    recipient.id

  const handleSelectRecipient = (recipient: TransferRecipient) => {
    const displayName = getRecipientDisplayName(recipient)
    setSelectedRecipient(recipient)
    setTransferData(prev => ({ ...prev, recipientId: recipient.id }))
    setRecipientQuery(displayName)
    setRecipientResults([])
  }

  const handleRecipientInput = (value: string) => {
    setRecipientQuery(value)
    setTransferData(prev => ({ ...prev, recipientId: '' }))
    setSelectedRecipient(null)
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'earned': return 'text-green-600'
      case 'spent': return 'text-red-600'
      case 'transferred': return 'text-blue-600'
      case 'exchanged': return 'text-purple-600'
      case 'bonus': return 'text-amber-600'
      default: return 'text-gray-600'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'earned': return <TrendingUp className="w-4 h-4" />
      case 'spent': return <TrendingDown className="w-4 h-4" />
      case 'transferred': return <ArrowUp className="w-4 h-4" />
      case 'exchanged': return <ArrowUp className="w-4 h-4" />
      case 'bonus': return <Gift className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600'
      case 'pending': return 'text-yellow-600'
      case 'failed': return 'text-red-600'
      case 'approved': return 'text-green-600'
      case 'rejected': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'pending': return <Clock className="w-4 h-4" />
      case 'failed': return <XCircle className="w-4 h-4" />
      case 'approved': return <CheckCircle className="w-4 h-4" />
      case 'rejected': return <XCircle className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  /**
   * Envoie un transfert de points après validation.
   */
  const handleTransfer = async () => {
    if (!transferAllowed) {
      setError('Les transferts de points sont temporairement désactivés par la plateforme.')
      return
    }
    if (isPointsFrozen) {
      const message = pointsFrozenReason
        ? `Opération impossible : ${pointsFrozenReason}`
        : 'Opération impossible tant que votre compte de points est gelé.'
      setError(message)
      addNotification('warning', 'Compte gelé', message)
      return
    }
    if (!selectedRecipient || selectedRecipient.id !== transferData.recipientId) {
      setError('Sélectionnez un destinataire valide dans la liste proposée')
      return
    }

    if (transferData.amount <= 0) {
      setError('Veuillez saisir un montant valide')
      return
    }

    if (transferLimitMessage) {
      setError(transferLimitMessage)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await onTransferPoints(
        selectedRecipient.id,
        transferData.amount,
        transferData.message?.trim() ? transferData.message.trim() : undefined
      )
      setShowTransferModal(false)
      setTransferData({ recipientId: '', amount: 0, message: '' })
      setRecipientQuery('')
      setRecipientResults([])
      setSelectedRecipient(null)

      addNotification('success', 'Transfert réussi', `${formatNumber(transferData.amount)} points transférés (frais ${formatNumber(transferFee)} pts)`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du transfert'
      setError(message)
      addNotification('error', 'Erreur', message)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Envoie une demande d'échange de points.
   */
  const handleExchange = async () => {
    if (!exchangeAllowed) {
      setError('Les échanges de points sont temporairement désactivés par la plateforme.')
      return
    }
    if (!isUsingRewardsCatalog) {
      setError("Aucune récompense disponible pour l'échange. Réessayez plus tard.")
      return
    }
    if (isPointsFrozen) {
      const message = pointsFrozenReason
        ? `Opération impossible : ${pointsFrozenReason}`
        : 'Opération impossible tant que votre compte de points est gelé.'
      setError(message)
      addNotification('warning', 'Compte gelé', message)
      return
    }
    if (!selectedOptionId) {
      setError('Veuillez sélectionner un avantage');
      return;
    }

    if (exchangeData.amount <= 0) {
      setError('Veuillez saisir un montant valide')
      return
    }

    const selectedOption = resolvedExchangeOptions.find(option => option.id === selectedOptionId);
    if (!selectedOption) {
      setError('Avantage sélectionné invalide');
      return;
    }

    if (exchangeData.amount < selectedOption.pointsRequired) {
      setError(`Le montant minimal pour cet avantage est ${selectedOption.pointsRequired} points`);
      return;
    }

    if (exchangeLimitMessage) {
      setError(exchangeLimitMessage)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      if (!onRedeemReward) {
        throw new Error("Échange de récompense indisponible : handler manquant")
      }

      const expected = Number(selectedOption.pointsRequired ?? 0)
      if (!Number.isFinite(expected) || expected <= 0) {
        throw new Error('Récompense invalide (coût en points manquant)')
      }

      if (exchangeData.amount !== expected) {
        throw new Error(`Cette récompense coûte exactement ${formatNumber(expected)} points`)
      }

      await onRedeemReward(selectedOption.id, exchangeData.amount)
      setShowExchangeModal(false);
      setExchangeData({ fromCurrency: 'Points', toCurrency: exchangeData.toCurrency, amount: 0 });
      setSelectedOptionId(null);

      addNotification('success', 'Échange réussi', `${formatNumber(exchangeData.amount)} points échangés contre ${selectedOption.title}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur lors de l'échange";
      setError(message);
      addNotification('error', 'Erreur', message);
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Envoie une demande de retrait de points.
   */
  const handleWithdrawal = async () => {
    if (!withdrawalAllowed) {
      setError('Les retraits de points sont temporairement désactivés par la plateforme.')
      return
    }
    if (isPointsFrozen) {
      const message = pointsFrozenReason
        ? `Opération impossible : ${pointsFrozenReason}`
        : 'Opération impossible tant que votre compte de points est gelé.'
      setError(message)
      addNotification('warning', 'Compte gelé', message)
      return
    }
    if (withdrawalData.amount <= 0) {
      setError('Veuillez saisir un montant valide')
      return
    }

    if (withdrawalLimitMessage) {
      setError(withdrawalLimitMessage)
      return
    }

    if (requiresWithdrawalPhone && !withdrawalData.phoneNumber?.trim()) {
      setError('Veuillez saisir le numéro de téléphone pour Mobile Money')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await onRequestWithdrawal(
        withdrawalData.amount,
        withdrawalData.method,
        withdrawalData.phoneNumber?.trim() ? withdrawalData.phoneNumber.trim() : undefined
      )
      setShowWithdrawalModal(false)
      setWithdrawalData({ amount: 0, method: withdrawalData.method, phoneNumber: '' })

      addNotification('success', 'Demande de retrait envoyée', `Retrait de ${formatNumber(withdrawalData.amount)} points (frais ${formatNumber(withdrawalFee)} pts) en attente`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la demande de retrait'
      setError(message)
      addNotification('error', 'Erreur', message)
    } finally {
      setIsLoading(false)
    }
  }

  const addNotification = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    if (!notificationsEnabled && type !== 'error') {
      return
    }
    const newNotification = {
      id: Date.now().toString(),
      type,
      title,
      message,
      timestamp: new Date()
    }
    setNotifications(prev => [...prev, newNotification])
    
    // Auto-remove après 5 secondes
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id))
    }, 5000)
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      addNotification('success', 'Copié !', 'Solde copié dans le presse-papiers')
    } catch (err) {
      addNotification('error', 'Erreur', 'Impossible de copier dans le presse-papiers')
    }
  }

  // Actions rapides
  const quickActions = [
    {
      id: 'transfer',
      title: 'Transférer',
      description: 'Envoyer des points',
      icon: <ArrowUp className="w-6 h-6" />,
      color: 'text-blue-600',
      gradient: 'from-blue-500 to-blue-600',
      action: () => {
        if (!transferAllowed) {
          addNotification('warning', 'Transfert désactivé', 'Les transferts de points sont temporairement désactivés.')
          return
        }
        if (isPointsFrozen) {
          addNotification(
            'warning',
            'Compte gelé',
            pointsFrozenReason ? `Opération impossible : ${pointsFrozenReason}` : 'Opération impossible tant que votre compte de points est gelé.'
          )
          return
        }
        setShowTransferModal(true)
      }
    },
    {
      id: 'exchange',
      title: 'Échanger',
      description: 'Convertir en devise',
      icon: <ArrowUp className="w-6 h-6" />,
      color: 'text-purple-600',
      gradient: 'from-purple-500 to-purple-600',
      action: () => {
        if (!exchangeAllowed) {
          addNotification('warning', 'Échange désactivé', 'Les échanges de points sont temporairement désactivés.')
          return
        }
        if (isPointsFrozen) {
          addNotification(
            'warning',
            'Compte gelé',
            pointsFrozenReason ? `Opération impossible : ${pointsFrozenReason}` : 'Opération impossible tant que votre compte de points est gelé.'
          )
          return
        }
        setShowExchangeModal(true)
      }
    },
    {
      id: 'withdrawal',
      title: 'Retirer',
      description: 'Demande de retrait',
      icon: <Banknote className="w-6 h-6" />,
      color: 'text-green-600',
      gradient: 'from-green-500 to-green-600',
      action: () => {
        if (!withdrawalAllowed) {
          addNotification('warning', 'Retrait désactivé', 'Les retraits de points sont temporairement désactivés.')
          return
        }
        if (isPointsFrozen) {
          addNotification(
            'warning',
            'Compte gelé',
            pointsFrozenReason ? `Opération impossible : ${pointsFrozenReason}` : 'Opération impossible tant que votre compte de points est gelé.'
          )
          return
        }
        setShowWithdrawalModal(true)
      }
    },
    {
      id: 'share',
      title: 'Partager',
      description: 'Partager mon solde',
      icon: <Share2 className="w-6 h-6" />,
      color: 'text-orange-600',
      gradient: 'from-orange-500 to-orange-600',
      action: () => {
        if (isPointsFrozen) {
          addNotification(
            'warning',
            'Compte gelé',
            pointsFrozenReason ? `Partage désactivé : ${pointsFrozenReason}` : 'Partage désactivé tant que votre compte de points est gelé.'
          )
          return
        }
        copyToClipboard(`Mon solde de points: ${formatNumber(pointData.balance)}`)
      }
    }
  ]

  return (
    <div className="space-y-8">
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 rounded-lg shadow-lg border-l-4 min-w-80 transform transition-all duration-300 ${
              notification.type === 'success' ? 'bg-green-50 border-green-400 text-green-800' :
              notification.type === 'error' ? 'bg-red-50 border-red-400 text-red-800' :
              notification.type === 'warning' ? 'bg-yellow-50 border-yellow-400 text-yellow-800' :
              'bg-blue-50 border-blue-400 text-blue-800'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold">{notification.title}</h4>
                <p className="text-sm mt-1">{notification.message}</p>
                <p className="text-xs mt-2 opacity-70">
                  {notification.timestamp.toLocaleTimeString('fr-FR')}
                </p>
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="ml-4 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Affichage des erreurs globales */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="h-5 w-5 text-red-400">⚠️</div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-red-800">Erreur</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600"
            >
              ✕
            </Button>
          </div>
        </div>
      )}

      {isFallbackData && (
        <Alert variant="default">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Certaines données Points sont affichées en mode fallback (données partielles). Rafraîchissez la page ou réessayez plus tard.
          </AlertDescription>
        </Alert>
      )}

      {isPointsFrozen && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <Snowflake className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Compte de points gelé</div>
                <div className="text-sm text-gray-700 mt-1">
                  {pointsFrozenReason
                    ? pointsFrozenReason
                    : "Vos opérations (transfert, échange, retrait, partage) sont désactivées jusqu'à la levée du gel."}
                </div>
              </div>
            </div>
            <Badge variant="secondary" className="bg-gray-200 text-gray-800 border-gray-300">
              Gelé
            </Badge>
          </div>
        </div>
      )}

             {/* Header avec solde principal */}
       <div className="relative">
         <Card className="bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 text-white border-0 shadow-2xl" style={{ background: 'linear-gradient(135deg, #ff6600, #e55a00, #cc4d00)' }}>
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                  <Coins className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Mon Portefeuille de Points</h2>
                  <p className="text-white/80">Gérez vos points et récompenses</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBalance(!showBalance)}
                  className="text-white hover:bg-white/20"
                >
                  {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettingsModal(true)}
                  className="text-white hover:bg-white/20"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className={["text-4xl font-bold mb-2", isPointsFrozen ? "text-white/50" : ""].join(' ')}>
                  {showBalance ? formatNumber(pointData.balance) : '••••••'}
                </div>
                <p className={["text-white/80", isPointsFrozen ? "text-white/50" : ""].join(' ')}>Points disponibles</p>
                <div className="mt-2 text-sm text-white/60">
                  ≈ {showBalance ? formatCurrency(pointData.balance * basePointValue) : '••••••'}
                </div>
                {isPointsFrozen && (
                  <div className="mt-2">
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                      <Snowflake className="w-3 h-3 mr-1" />
                      Points gelés
                    </Badge>
                  </div>
                )}
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold mb-2">{formatNumber(pointData.totalEarned)}</div>
                <p className="text-white/80">Total gagnés</p>
                                   <div className="mt-2 flex items-center justify-center space-x-1">
                     <TrendingUp className="w-4 h-4" style={{ color: '#ff6600' }} />
                     <span className="text-sm" style={{ color: '#ff6600' }}>+{formatNumber(pointData.totalEarned - pointData.totalSpent)}</span>
                   </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold mb-2">{pointData.pendingRequests}</div>
                <p className="text-white/80">Demandes en attente</p>
                <div className="mt-2">
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    <Clock className="w-3 h-3 mr-1" />
                    En cours
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickActions.map((action) => {
          const operationBlocked =
            (action.id === 'transfer' && !transferAllowed) ||
            (action.id === 'exchange' && !exchangeAllowed) ||
            (action.id === 'withdrawal' && !withdrawalAllowed)
          const cardDisabled = isPointsFrozen || operationBlocked

          return (
          <Card 
            key={action.id}
            className={[
              'transition-all duration-300',
              cardDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:scale-105 hover:shadow-lg'
            ].join(' ')}
            onClick={() => {
              if (operationBlocked) {
                return
              }
              if (isPointsFrozen) {
                const message = pointsFrozenReason
                  ? `Opération impossible : ${pointsFrozenReason}`
                  : 'Opération impossible tant que votre compte de points est gelé.'
                setError(message)
                addNotification('warning', 'Compte gelé', message)
                return
              }
              action.action()
            }}
          >
            <CardContent className="p-6 text-center">
                             <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #ff6600, #e55a00)' }}>
                {action.icon}
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
              <p className="text-sm text-gray-600">{action.description}</p>
            </CardContent>
          </Card>
          )
        })}
      </div>

      {/* Onglets principaux */}
      <Tabs defaultValue="overview" className="space-y-6">
                 <TabsList className="grid w-full grid-cols-7 rounded-xl p-1" style={{ backgroundColor: '#f5f5f5' }}>
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Vue d'ensemble</span>
          </TabsTrigger>
          <TabsTrigger value="shares" className="flex items-center space-x-2">
            <Share2 className="w-4 h-4" />
            <span>Partages</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center space-x-2">
            <History className="w-4 h-4" />
            <span>Historique</span>
          </TabsTrigger>
          <TabsTrigger value="top-earners" className="flex items-center space-x-2">
            <Crown className="w-4 h-4" />
            <span>Top Gagnants</span>
          </TabsTrigger>
          <TabsTrigger value="withdrawals" className="flex items-center space-x-2">
            <Banknote className="w-4 h-4" />
            <span>Retraits</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <PieChart className="w-4 h-4" />
            <span>Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="predictions" className="flex items-center space-x-2">
            <Zap className="w-4 h-4" />
            <span>Prédictions</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Évolution du Solde</CardTitle>
              <CardDescription>Performance de vos points sur 30 jours</CardDescription>
            </CardHeader>
            <CardContent>
              {balanceTrendData.length > 0 ? (
                <ChartContainer config={balanceChartConfig} className="h-72">
                  <RechartsLineChart data={balanceTrendData}>
                    <CartesianGrid strokeDasharray="4 4" stroke="#f2f2f2" />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} width={60} />
                    <ChartTooltip cursor={{ stroke: '#e5e7eb', strokeWidth: 1 }} content={<ChartTooltipContent />} />
                    <ChartLegend verticalAlign="bottom" content={<ChartLegendContent />} />
                    <Line type="monotone" dataKey="balance" stroke="var(--color-balance)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="earned" stroke="var(--color-earned)" strokeWidth={2} strokeDasharray="6 6" dot={false} />
                    <Line type="monotone" dataKey="spent" stroke="var(--color-spent)" strokeWidth={2} strokeDasharray="2 4" dot={false} />
                  </RechartsLineChart>
                </ChartContainer>
              ) : (
                <div className="h-64 rounded-lg flex items-center justify-center bg-muted">
                  <div className="text-center text-muted-foreground">
                    <LineChart className="w-12 h-12 mx-auto mb-2" />
                    <p>Aucune donnée d'évolution disponible pour le moment.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Répartition par type de transactions</CardTitle>
              <CardDescription>Volume total de points par catégorie</CardDescription>
            </CardHeader>
            <CardContent>
              {categoryBreakdownData.length > 0 ? (
                <ChartContainer config={breakdownChartConfig} className="h-72">
                  <RechartsBarChart data={categoryBreakdownData}>
                    <CartesianGrid vertical={false} stroke="#f2f2f2" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} width={70} />
                    <ChartTooltip cursor={{ fill: 'rgba(229, 231, 235, 0.35)' }} content={<ChartTooltipContent />} />
                    <RechartsBar dataKey="value" fill="var(--color-value)" radius={[8, 8, 0, 0]} />
                  </RechartsBarChart>
                </ChartContainer>
              ) : (
                <div className="h-64 rounded-lg flex items-center justify-center bg-muted">
                  <div className="text-center text-muted-foreground">
                    <BarChart className="w-12 h-12 mx-auto mb-2" />
                    <p>Aucune donnée de répartition disponible.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shares" className="space-y-6">
          {/* Statistiques des partages */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                         <Card className="text-white" style={{ background: 'linear-gradient(135deg, #ff6600, #e55a00)' }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Total Partages</p>
                    <p className="text-3xl font-bold">{pointData.sharesData?.totalShares || 0}</p>
                  </div>
                  <Share2 className="h-12 w-12 text-green-200" />
                </div>
                <p className="text-green-100 text-xs mt-2">Ce mois: {pointData.sharesData?.sharesThisMonth || 0}</p>
              </CardContent>
            </Card>

                         <Card className="text-white" style={{ background: 'linear-gradient(135deg, #535455, #404142)' }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Points des Partages</p>
                    <p className="text-3xl font-bold">{formatNumber(pointData.sharesData?.pointsFromShares || 0)}</p>
                  </div>
                  <Coins className="h-12 w-12 text-blue-200" />
                </div>
                <p className="text-blue-100 text-xs mt-2">Gagnés via partages</p>
              </CardContent>
            </Card>

                         <Card className="text-white" style={{ background: 'linear-gradient(135deg, #ff6600, #cc4d00)' }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Score Viral</p>
                    <p className="text-3xl font-bold">{pointData.sharesData?.viralScore || 0}</p>
                  </div>
                  <Zap className="h-12 w-12 text-purple-200" />
                </div>
                <p className="text-purple-100 text-xs mt-2">Potentiel viral</p>
              </CardContent>
            </Card>

                         <Card className="text-white" style={{ background: 'linear-gradient(135deg, #535455, #404142)' }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">Engagement</p>
                    <p className="text-3xl font-bold">{averageShareEngagement}%</p>
                  </div>
                  <Users className="h-12 w-12 text-orange-200" />
                </div>
                <p className="text-orange-100 text-xs mt-2">Taux moyen</p>
              </CardContent>
            </Card>
          </div>

          {/* Produits les plus partagés */}
          <Card className="shadow-sm">
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <span>Produits les Plus Partagés</span>
                </div>
              </div>
              <div className="space-y-4">
                {(pointData.sharesData?.topSharedProducts ?? []).map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                          {product && product.image ? (
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <span className="text-gray-500 text-xs">IMG</span>
                          )}
                        </div>
                        {index < 3 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {index + 1}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium">{product.name}</p>
                          {product.isOwnProduct && (
                            <Badge variant="outline" className="text-xs">Mon produit</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{product.shares} partages</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">{formatNumber(product.points)}</div>
                      <p className="text-sm text-gray-500">points gagnés</p>
                      {!product.isOwnProduct && (
                        <p className="text-xs text-blue-600 mt-1">✓ Points valides</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Statistiques par réseau social */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5 text-blue-500" />
                <span>Performance par Réseau Social</span>
              </CardTitle>
              <CardDescription>Analyse détaillée de l'engagement sur chaque plateforme</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {Object.entries(pointData.sharesData?.socialNetworkStats || {}).map(([network, stats]) => (
                  <div key={network} className="text-center p-4 border rounded-lg">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, #535455, #404142)' }}>
                      {network === 'facebook' && <span className="text-lg">📘</span>}
                      {network === 'instagram' && <span className="text-lg">📷</span>}
                      {network === 'twitter' && <span className="text-lg">🐦</span>}
                      {network === 'whatsapp' && <span className="text-lg">💬</span>}
                      {network === 'linkedin' && <span className="text-lg">💼</span>}
                    </div>
                    <h3 className="font-semibold capitalize mb-2">{network}</h3>
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-600">{stats.shares} partages</p>
                      <p className="text-green-600 font-medium">{formatNumber(stats.points)} points</p>
                      <p className="text-blue-600">{stats.engagement}% engagement</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Engagement des utilisateurs */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-purple-500" />
                <span>Engagement des Utilisateurs</span>
              </CardTitle>
              <CardDescription>Utilisateurs les plus actifs dans le partage de vos produits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(pointData.sharesData?.userEngagement ?? []).map((user, index) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                                                 {index < 3 && (
                           <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: 'linear-gradient(135deg, #ff6600, #e55a00)' }}>
                             {index + 1}
                           </div>
                         )}
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.totalShares} partages</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">{formatNumber(user.pointsEarned)}</div>
                      <p className="text-sm text-gray-500">points</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Historique des Transactions</CardTitle>
              <CardDescription>Suivi complet de vos activités</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Rechercher une transaction..."
                      className="pl-10"
                      value={historyQuery}
                      onChange={(event) => setHistoryQuery(event.target.value)}
                    />
                  </div>
                  <Select
                    value={historyTypeFilter}
                    onValueChange={(value) => setHistoryTypeFilter(value as any)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filtrer par type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les types</SelectItem>
                      <SelectItem value="earned">Gagnés</SelectItem>
                      <SelectItem value="spent">Dépensés</SelectItem>
                      <SelectItem value="transferred">Transférés</SelectItem>
                      <SelectItem value="exchanged">Échangés</SelectItem>
                      <SelectItem value="share_bonus">Bonus partages</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={() => void handleExport('csv')}>
                      <Download className="w-4 h-4 mr-2" />
                      CSV
                    </Button>
                    <Button variant="outline" onClick={() => void handleExport('pdf')}>
                      <Download className="w-4 h-4 mr-2" />
                      PDF
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredHistory.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-full ${getTypeColor(item.type)} bg-opacity-10`}>
                          {getTypeIcon(item.type)}
                        </div>
                        <div>
                          <p className="font-medium">{item.description}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <p className="text-sm text-gray-500">
                              {new Date(item.timestamp).toLocaleDateString('fr-FR')}
                            </p>
                            {item.socialNetwork && (
                              <Badge variant="outline" className="text-xs">
                                {item.socialNetwork}
                              </Badge>
                            )}
                            {item.shareType && (
                              <Badge variant="outline" className="text-xs">
                                {item.shareType === 'product' ? 'Produit' : 
                                 item.shareType === 'category' ? 'Catégorie' : 'Campagne'}
                              </Badge>
                            )}
                          </div>
                          {item.type === 'share_bonus' && (
                            <p className="text-xs text-blue-600 mt-1">
                              ✓ Points gagnés sur partage d'autrui
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-medium ${item.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {item.amount > 0 ? '+' : ''}{formatNumber(item.amount)} points
                        </div>
                        <Badge variant="secondary" className={`mt-1 ${getStatusColor(item.status)}`}>
                          {item.status}
                        </Badge>
                        {item.source && (
                          <p className="text-xs text-gray-500 mt-1">
                            Source: {item.source}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}

                  {filteredHistory.length === 0 && (
                    <div className="text-sm text-muted-foreground text-center py-6 border rounded-lg">
                      Aucun résultat pour votre recherche/filtre.
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="top-earners" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Top Gagnants de Points</CardTitle>
              <CardDescription>Classement des meilleurs gagnants</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topEarners.map((earner, index) => (
                  <div key={earner.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={earner.avatar} />
                          <AvatarFallback>{earner.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                                                 {index < 3 && (
                           <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: 'linear-gradient(135deg, #ff6600, #e55a00)' }}>
                             {index + 1}
                           </div>
                         )}
                      </div>
                      <div>
                        <p className="font-medium">{earner.name}</p>
                        <p className="text-sm text-gray-500">{earner.shares} partages</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">{formatNumber(earner.points)}</div>
                      <p className="text-sm text-gray-500">points</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdrawals" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Demandes de Retrait</CardTitle>
              <CardDescription>Suivi de vos demandes de retrait</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {withdrawalRequests.map((request: { id: string; amount: number; method: string | null; status: string; timestamp: string }) => (
                  <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full ${getStatusColor(String(request.status))} bg-opacity-10`}>
                        {getStatusIcon(String(request.status))}
                      </div>
                      <div>
                        <p className="font-medium">{formatNumber(request.amount)} points</p>
                        <p className="text-sm text-gray-500">
                          {request.timestamp ? new Date(request.timestamp).toLocaleDateString('fr-FR') : '-'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        {String((request as any)?.method ?? '') === 'Mobile Money' && <Smartphone className="w-4 h-4 text-gray-400" />}
                        {String((request as any)?.method ?? '') === 'Carte Bancaire' && <CreditCard className="w-4 h-4 text-gray-400" />}
                        <span className="text-sm text-gray-600">{String((request as any)?.method ?? 'Méthode')}</span>
                      </div>
                      <Badge variant="secondary" className={`mt-1 ${getStatusColor(String(request.status))}`}>
                        {String(request.status)}
                      </Badge>
                    </div>
                  </div>
                ))}

                {withdrawalRequests.length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-6 border rounded-lg">
                    Aucune demande de retrait pour le moment.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Évolution hebdomadaire</CardTitle>
                <CardDescription>Comparaison des points gagnés et dépensés sur 14 jours</CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsTrendData.length > 0 ? (
                  <ChartContainer config={analyticsTrendConfig} className="h-72">
                    <RechartsAreaChart data={analyticsTrendData}>
                      <CartesianGrid strokeDasharray="4 4" stroke="#f3f4f6" />
                      <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                      <YAxis tickLine={false} axisLine={false} tickMargin={8} width={60} />
                      <ChartTooltip content={<ChartTooltipContent />} cursor={{ stroke: '#e5e7eb', strokeWidth: 1 }} />
                      <RechartsArea
                        type="monotone"
                        dataKey="earned"
                        stroke="var(--color-earned)"
                        fill="var(--color-earned)"
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
                      <RechartsArea
                        type="monotone"
                        dataKey="spent"
                        stroke="var(--color-spent)"
                        fill="var(--color-spent)"
                        fillOpacity={0.15}
                        strokeWidth={2}
                      />
                      <Line type="monotone" dataKey="net" stroke="var(--color-earned)" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                      <ChartLegend verticalAlign="bottom" content={<ChartLegendContent />} />
                    </RechartsAreaChart>
                  </ChartContainer>
                ) : (
                  <div className="h-64 rounded-lg flex items-center justify-center bg-muted">
                    <div className="text-center text-muted-foreground">
                      <LineChart className="w-12 h-12 mx-auto mb-2" />
                      <p>Pas encore assez de données pour afficher l'évolution.</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Réseaux performants</CardTitle>
                <CardDescription>Répartition des points gagnés par réseau social</CardDescription>
              </CardHeader>
              <CardContent>
                {socialNetworkData.length > 0 ? (
                  <ChartContainer config={socialNetworkChartConfig} className="h-72">
                    <RechartsPieChart>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <RechartsPie
                        data={socialNetworkData}
                        dataKey="points"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        outerRadius={110}
                        innerRadius={60}
                        paddingAngle={4}
                      >
                        {socialNetworkData.map((entry, index) => (
                          <Cell key={entry.network} fill={socialNetworkColors[index % socialNetworkColors.length]} />
                        ))}
                      </RechartsPie>
                      <ChartLegend verticalAlign="bottom" content={<ChartLegendContent nameKey="label" />} />
                    </RechartsPieChart>
                  </ChartContainer>
                ) : (
                  <div className="h-64 rounded-lg flex items-center justify-center bg-muted">
                    <div className="text-center text-muted-foreground">
                      <PieChart className="w-12 h-12 mx-auto mb-2" />
                      <p>Aucune donnée de partage par réseau pour l'instant.</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Top gagnants (points)</CardTitle>
              <CardDescription>Progression des meilleurs affiliés sur les 6 plus performants</CardDescription>
            </CardHeader>
            <CardContent>
              {topEarnersChartData.length > 0 ? (
                <ChartContainer config={topEarnersChartConfig} className="h-80">
                  <RechartsBarChart data={topEarnersChartData}>
                    <CartesianGrid vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={10} interval={0} angle={-15} textAnchor="end" height={70} />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} width={70} />
                    <ChartTooltip content={<ChartTooltipContent />} cursor={{ fill: 'rgba(229, 231, 235, 0.35)' }} />
                    <RechartsBar dataKey="points" fill="var(--color-points)" radius={[8, 8, 0, 0]} />
                  </RechartsBarChart>
                </ChartContainer>
              ) : (
                <div className="h-64 rounded-lg flex items-center justify-center bg-muted">
                  <div className="text-center text-muted-foreground">
                    <BarChart className="w-12 h-12 mx-auto mb-2" />
                    <p>Aucun top gagnant disponible pour l'instant.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-6">
          {/* Prédictions IA */}
                     <Card className="text-white" style={{ background: 'linear-gradient(135deg, #ff6600, #535455)' }}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-6 w-6 text-yellow-300" />
                <span>Prédictions IA pour le Prochain Mois</span>
              </CardTitle>
              <CardDescription className="text-indigo-100">
                Analyse prédictive basée sur vos données et tendances du marché
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">{formatNumber(predictiveAnalytics.nextMonthPrediction)}</div>
                  <p className="text-indigo-100">Points prédits</p>
                                     <div className="mt-2 flex items-center justify-center space-x-1">
                     {predictiveAnalytics.growthTrend === 'increasing' && <TrendingUp className="w-4 h-4" style={{ color: '#ff6600' }} />}
                     {predictiveAnalytics.growthTrend === 'decreasing' && <TrendingDown className="w-4 h-4" style={{ color: '#ff6600' }} />}
                     {predictiveAnalytics.growthTrend === 'stable' && <Minus className="w-4 h-4" style={{ color: '#ff6600' }} />}
                     <span className="text-sm text-indigo-100 capitalize">
                       {predictiveAnalytics.growthTrend}
                     </span>
                   </div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold mb-2">{predictiveAnalytics.recommendedActions.length}</div>
                  <p className="text-indigo-100">Actions recommandées</p>
                  <div className="mt-2">
                                         <Badge variant="secondary" className="text-white border-white/30" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                       <Sparkles className="w-3 h-3 mr-1" />
                       IA Optimisée
                     </Badge>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold mb-2">{predictiveAnalytics.marketOpportunities.length}</div>
                  <p className="text-indigo-100">Opportunités marché</p>
                  <div className="mt-2">
                                         <Badge variant="secondary" className="text-white border-white/30" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                       <Target className="w-3 h-3 mr-1" />
                       Détectées
                     </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions recommandées par l'IA */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                <span>Actions Recommandées par l'IA</span>
              </CardTitle>
              <CardDescription>Recommandations personnalisées pour optimiser vos gains de points</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {predictiveAnalytics.recommendedActions.length > 0 ? (
                  predictiveAnalytics.recommendedActions.map((action, index) => (
                    <div
                      key={index}
                      className="flex items-start space-x-4 p-4 border rounded-lg"
                      style={{ background: 'linear-gradient(135deg, #fff5f0, #f0f0f0)' }}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                        style={{ background: 'linear-gradient(135deg, #ff6600, #535455)' }}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{action}</p>
                        <div className="mt-2 flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            <Zap className="w-3 h-3 mr-1" />
                            Recommandation IA
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-6 border rounded-lg">
                    Aucune recommandation pour le moment. Revenez après de nouvelles activités.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Opportunités du marché */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-green-500" />
                <span>Opportunités du Marché</span>
              </CardTitle>
              <CardDescription>Catégories et segments avec le plus grand potentiel de gains</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {predictiveAnalytics.marketOpportunities.length > 0 ? (
                  predictiveAnalytics.marketOpportunities.map((opportunity, index) => (
                    <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">{opportunity.category}</h4>
                        <Badge
                          variant="outline"
                          className={`text-xs capitalize ${difficultyColors[opportunity.difficulty]}`}
                        >
                          {difficultyLabels[opportunity.difficulty]}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Potentiel estimé :{' '}
                        <span className="font-semibold">{formatNumber(opportunity.potentialPoints)} points</span>
                      </p>
                      <p className="text-xs text-gray-500 mb-3">
                        Optimisez vos actions sur ce segment pour maximiser vos gains.
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>Potentiel</span>
                          <span className="font-semibold text-green-600">
                            {formatNumber(opportunity.potentialPoints)} pts
                          </span>
                        </div>
                        <Progress
                          value={Math.min((opportunity.potentialPoints / 10000) * 100, 100)}
                          className="h-2"
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center text-sm text-muted-foreground py-6 border rounded-lg">
                    Aucune opportunité détectée pour l’instant. Revenez après de nouvelles données.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de transfert */}
      <Dialog open={showTransferModal} onOpenChange={setShowTransferModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Transférer des Points</DialogTitle>
            <DialogDescription>
              Envoyez des points à un autre utilisateur
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipient">Destinataire</Label>
              <div className="relative">
                <Input
                  id="recipient"
                  placeholder="Nom, email, ID ou téléphone du destinataire"
                  autoComplete="off"
                  value={recipientQuery}
                  onChange={event => handleRecipientInput(event.target.value)}
                  className="pr-10"
                />
                {isSearchingRecipient && (
                  <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                )}
              </div>
              {recipientQuery && !isSearchingRecipient && recipientResults.length === 0 && !selectedRecipient && (
                <p className="text-xs text-muted-foreground">Aucun utilisateur trouvé. Vérifiez l'orthographe ou essayez un autre critère.</p>
              )}
              {recipientResults.length > 0 && (
                <div className="rounded-md border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
                  <div className="max-h-48 overflow-y-auto">
                    {recipientResults.map(result => {
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
              {selectedRecipient && (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
                  <p className="font-medium">Destinataire sélectionné</p>
                  <p>{getRecipientDisplayName(selectedRecipient)}</p>
                  <div className="mt-1 space-x-2">
                    {selectedRecipient.email && <span>{selectedRecipient.email}</span>}
                    {selectedRecipient.phone && <span>{selectedRecipient.phone}</span>}
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="amount">Nombre de points à transférer</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Nombre de points"
                value={transferData.amount}
                onChange={(e) => setTransferData({ ...transferData, amount: parseInt(e.target.value) || 0 })}
              />
              <Label htmlFor="transferMessage" className="mt-3 block">Message (optionnel)</Label>
              <Textarea
                id="transferMessage"
                placeholder="Ajoutez un message pour le destinataire"
                value={transferData.message}
                onChange={(e) => setTransferData({ ...transferData, message: e.target.value })}
                rows={3}
              />
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
              <div className="flex items-center justify-between">
                <span>Points saisis</span>
                <span>{formatPoints(transferData.amount)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span>Frais estimés</span>
                <span>{formatPoints(transferFee)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between font-semibold">
                <span>Total débité</span>
                <span>{formatPoints(transferTotal)}</span>
              </div>
            </div>

            {transferLimitMessage && (
              <Alert
                variant="destructive"
                className="text-sm border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
              >
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-700 dark:text-red-200">{transferLimitMessage}</AlertDescription>
              </Alert>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowTransferModal(false)}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleTransfer}
              disabled={!selectedRecipient || transferData.amount <= 0 || Boolean(transferLimitMessage) || isLoading}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Transfert en cours...
                </>
              ) : (
                'Transférer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal d'échange */}
      <Dialog open={showExchangeModal} onOpenChange={setShowExchangeModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Échanger des Points</DialogTitle>
            <DialogDescription>
              Convertissez vos points en avantages réels.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {exchangeLimitMessage && (
              <Alert variant="default">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{exchangeLimitMessage}</AlertDescription>
              </Alert>
            )}

            {rewardOptionsError && (
              <Alert variant="default">
                <AlertDescription>{rewardOptionsError}</AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor="exchangeAmount">Montant de points à échanger</Label>
              <Input
                id="exchangeAmount"
                type="number"
                value={exchangeData.amount || ''}
                onChange={(e) => setExchangeData({ ...exchangeData, amount: parseInt(e.target.value) || 0 })}
                placeholder="Ex: 1000"
              />
            </div>

            <div>
              <Label>Sélectionnez un avantage</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {(isRewardOptionsLoading ? [] : resolvedExchangeOptions).map((option) => (
                  <Card
                    key={option.id}
                    className={`cursor-pointer border-2 ${selectedOptionId === option.id ? 'border-orange-500' : ''}`}
                    onClick={() => {
                      setSelectedOptionId(option.id)
                      if (option.__kind === 'reward') {
                        setExchangeData((prev) => ({ ...prev, amount: Number(option.pointsRequired ?? 0) }))
                      }
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="font-medium">{option.title}</div>
                      <div className="text-xs text-gray-500 mt-1">{option.description}</div>
                      <div className="text-sm font-bold text-orange-600 mt-2">{formatNumber(option.pointsRequired)} pts</div>
                    </CardContent>
                  </Card>
                ))}

                {isRewardOptionsLoading && (
                  <div className="col-span-2 flex items-center justify-center py-6 text-sm text-gray-600">
                    <Loader2 className="animate-spin mr-2" />
                    Chargement des récompenses...
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowExchangeModal(false)}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleExchange}
              disabled={isLoading || !selectedOptionId || exchangeData.amount <= 0 || !isUsingRewardsCatalog}
            >
              {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
              Confirmer l'échange
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de retrait */}
      <Dialog open={showWithdrawalModal} onOpenChange={setShowWithdrawalModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Demande de Retrait</DialogTitle>
            <DialogDescription>
              Retirez vos points en devise
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="withdrawalAmount">Nombre de points à retirer</Label>
              <Input
                id="withdrawalAmount"
                type="number"
                placeholder="Nombre de points à retirer"
                value={withdrawalData.amount}
                onChange={(e) => setWithdrawalData({ ...withdrawalData, amount: parseInt(e.target.value) || 0 })}
              />
            </div>
            
            <div>
              <Label htmlFor="withdrawalMethod">Méthode de paiement</Label>
              <Select 
                value={withdrawalData.method} 
                onValueChange={(value) => setWithdrawalData({ ...withdrawalData, method: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une méthode" />
                </SelectTrigger>
                <SelectContent>
                  {activeWithdrawalMethods.length > 0 ? (
                    activeWithdrawalMethods.map(method => (
                      <SelectItem key={method.id} value={method.name}>
                        {method.name}
                      </SelectItem>
                    ))
                  ) : (
                    <>
                      <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                      <SelectItem value="Carte Bancaire">Carte Bancaire</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {requiresWithdrawalPhone && (
              <div>
                <Label htmlFor="withdrawalPhone">Numéro Mobile Money</Label>
                <Input id="withdrawalPhone" type="tel" placeholder="Ex: +225 07 00 00 00 00" value={withdrawalData.phoneNumber} onChange={(e) => setWithdrawalData({ ...withdrawalData, phoneNumber: e.target.value })} />
              </div>
            )}

            {selectedWithdrawalMethod && (
              <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-3 text-xs text-gray-600 space-y-1">
                <div className="flex items-center justify-between">
                  <span>Min retrait</span>
                  <span>{formatLimitValue(selectedWithdrawalLimit?.minAmount ?? withdrawalLimits.min)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Max retrait</span>
                  <span>{formatLimitValue(selectedWithdrawalLimit?.maxAmount ?? withdrawalLimits.max)}</span>
                </div>
                {selectedWithdrawalLimit?.processingTime && (
                  <div className="flex items-center justify-between">
                    <span>Délai estimé</span>
                    <span>{selectedWithdrawalLimit.processingTime}</span>
                  </div>
                )}
              </div>
            )}

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
              <div className="flex items-center justify-between">
                <span>Points saisis</span>
                <span>{formatPoints(withdrawalData.amount)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span>Frais estimés</span>
                <span>{formatPoints(withdrawalFee)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span>Total débité</span>
                <span>{formatPoints(withdrawalTotal)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between font-semibold">
                <span>Paiement estimé</span>
                <span>{formatCurrencyWithSymbol(withdrawalPayout, defaultCurrency)}</span>
              </div>
            </div>

            {withdrawalLimitMessage && (
              <Alert variant="destructive" className="text-sm">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{withdrawalLimitMessage}</AlertDescription>
              </Alert>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowWithdrawalModal(false)}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleWithdrawal}
              disabled={withdrawalData.amount <= 0 || Boolean(withdrawalLimitMessage) || isLoading}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Demande en cours...
                </>
              ) : (
                'Demander le retrait'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal des paramètres */}
      <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Paramètres</DialogTitle>
            <DialogDescription>
              Personnalisez votre expérience
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-semibold">Afficher le solde</Label>
                  <p className="text-xs text-gray-500">Masquer ou afficher votre solde</p>
                </div>
                <Switch
                  checked={showBalance}
                  onCheckedChange={(checked) => {
                    setShowBalance(checked)
                    persistUiPrefs({ showBalance: checked })
                  }}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-semibold">Notifications</Label>
                  <p className="text-xs text-gray-500">Recevoir des notifications</p>
                </div>
                <Switch
                  checked={notificationsEnabled}
                  onCheckedChange={(checked) => {
                    setNotificationsEnabled(checked)
                    persistUiPrefs({ notificationsEnabled: checked })
                  }}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowSettingsModal(false)}
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
