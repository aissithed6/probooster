"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Building2,
  Calendar,
  CheckCircle,
  CreditCard,
  Download,
  Eye,
  FileText,
  History,
  Layers,
  LineChart,
  Mail,
  Percent,
  PieChart,
  Receipt,
  RefreshCw,
  ShieldCheck,
  Siren,
  TrendingUp,
  Wallet2,
  Users,
  Wallet,
  XCircle
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
import { ClientAuthService } from '@/lib/services/client-auth-service'

type PaymentMethod = 'bank_transfer' | 'mobile_money' | 'card'

type FinancialManagementInitialStats = Partial<Pick<FinancialStats,
  | 'totalRevenue'
  | 'revenueGross'
  | 'revenueRefunds'
  | 'revenueNet'
  | 'totalCommission'
  | 'totalPayouts'
  | 'pendingPayouts'
  | 'monthlyGrowth'
  | 'averageOrderValue'
  | 'approvalRate'
>> & {
  points?: Partial<PointsStatsSummary>
}

function formatBankDetails(details: unknown): string | null {
  if (!details) return null
  if (typeof details === 'string') {
    const trimmed = details.trim()
    return trimmed.length > 0 ? trimmed : null
  }
  if (typeof details !== 'object' || Array.isArray(details)) return null

  const bankName = String((details as any)?.bankName ?? (details as any)?.bank_name ?? '').trim()
  const accountName = String((details as any)?.accountName ?? (details as any)?.account_name ?? '').trim()
  const accountNumber = String((details as any)?.accountNumber ?? (details as any)?.account_number ?? '').trim()

  const parts: string[] = []
  if (bankName) parts.push(`Banque: ${bankName}`)
  if (accountName) parts.push(`Titulaire: ${accountName}`)
  if (accountNumber) parts.push(`Compte: ${accountNumber}`)
  if (parts.length > 0) return parts.join(' | ')

  try {
    const json = JSON.stringify(details)
    return json === '{}' ? null : json
  } catch {
    return null
  }
}

interface PaymentUser {
  id: string
  fullName: string
  email: string
  phone?: string
  country?: string
  company?: string
}

interface PaymentTimelineEntry {
  id: string
  label: string
  actor: string
  occurredAt: string
}

interface PaymentRequest {
  id: string
  vendorId: string
  vendorName: string
  ordersCount: number
  totalAmount: number
  commissionAmount: number
  netAmount: number
  status: 'pending' | 'approved' | 'rejected'
  paymentMethod: PaymentMethod
  bankDetails?: string
  mobileNumber?: string
  createdAt: string
  processedAt?: string
  notes?: string
  executionType?: 'immediate' | 'scheduled' | 'batch'
  scheduleDate?: string
  batchId?: string
  payoutWindow?: string
  user?: PaymentUser
  timeline?: PaymentTimelineEntry[]
}

interface FinancialStats {
  totalRevenue: number
  revenueGross: number
  revenueRefunds: number
  revenueNet: number
  totalCommission: number
  totalPayouts: number
  pendingPayouts: number
  monthlyGrowth: number
  averageOrderValue: number
  approvalRate: number
}

interface CashFlowEntry {
  id: string
  direction: 'in' | 'out'
  category: string
  label: string
  amount: number
  occurredAt: string
}

interface VendorMetric {
  id: string
  vendorName: string
  pendingAmount: number
  paidAmount: number
  riskScore: number
  lastPayout?: string
}

interface PayoutSettings {
  autoPayout: boolean
  minimumThreshold: number
  primaryValidationDay: string
  backupValidationDay: string
  internalNotes: string
}

interface PaymentBatch {
  id: string
  label: string
  status: 'pending' | 'processing' | 'completed'
  scheduledAt?: string
  executedAt?: string
  requests: PaymentRequest[]
  totalAmount: number
}

interface PaymentSchedule {
  id: string
  vendorId: string
  orderId: string
  customerName: string
  amount: number
  dueDate: string
  priority: string
  status: string
  notificationMethod: string
  reminderFrequency: string
  createdAt: string
  updatedAt?: string
}

interface ProductRevenue {
  productId: string
  productName: string
  totalRevenue: number
  netRevenue: number
  orders: number
  marginRate: number
}

interface UserRevenue {
  userId: string
  userName: string
  userEmail: string
  totalSpent: number
  commissionGenerated: number
  lastPurchase?: string
}

interface FinancialAnalytics {
  totalOperations: number
  averagePayoutTime: number
  fraudAlerts: number
  operationsTimeline: { label: string; value: number }[]
  productRevenues: ProductRevenue[]
  userRevenues: UserRevenue[]
}

interface CommissionPromotion {
  id: string
  label: string
  startDate: string
  endDate: string
  reductionPercent?: number
  reductionAmount?: number
}

interface CommissionRule {
  id: string
  scope: 'global' | 'vendor' | 'group'
  vendorId?: string
  groupName?: string
  basePercent?: number
  baseAmount?: number
  hybridPercent?: number
  hybridAmount?: number
  promotions?: CommissionPromotion[]
  updatedAt: string
}

interface TransactionEntry {
  id: string
  vendorId: string
  vendorName: string
  orderId: string
  grossAmount: number
  commissionTaken: number
  netAmount: number
  status: 'paid' | 'pending' | 'processing'
  occurredAt: string
}

interface RefundCase {
  id: string
  orderId: string
  vendorId: string
  vendorName: string
  customerEmail: string
  amount: number
  commissionAdjustment: number
  status: 'requested' | 'processing' | 'resolved'
  openedAt: string
  updatedAt?: string
  reason?: string
  resolutionNotes?: string
}

interface RefundSettings {
  autoAdjustCommission: boolean
  notifyVendor: boolean
  escalationEmail: string
  resolutionWindow: number
}

// Types liés aux opérations Points
interface PointsWithdrawal {
  id: string
  userId: string
  methodId: string
  pointsAmount: number
  payoutAmount: number
  feeAmount: number
  currency: string
  status: string
  createdAt: string
  processedAt?: string | null
}

interface PointsTransfer {
  id: string
  senderId: string
  recipientId: string
  pointsAmount: number
  feeAmount: number
  status: string
  createdAt: string
  processedAt?: string | null
}

interface PointsExchange {
  id: string
  userId: string
  fromCurrency: string
  toCurrency: string
  pointsAmount: number
  convertedAmount: number
  feeAmount: number
  rate: number
  createdAt: string
}

interface PointsRedemption {
  id: string
  userId: string
  rewardId: string
  pointsSpent: number
  createdAt: string
}

interface PointsTransaction {
  id: string
  userId: string
  type: string
  category: 'fee' | 'withdrawal' | 'exchange' | 'redemption' | 'other'
  points: number
  value: number
  description: string
  referenceId?: string | null
  createdAt: string
}

interface PointsStatsSummary {
  totalBalance: number
  totalFcfaValue: number
  withdrawalsApproved: number
  exchangesTotal: number
  exchangeFees: number
  feesTotal: number
  transfersVolume: number
  redemptionsTotal: number
}

type AdminPointsConfig = {
  purchaseValue: number
  withdrawalValue: number
}

interface VendorCommissionInsight {
  vendorId: string
  vendorName: string
  totalCommission: number
  totalGross: number
  totalNet: number
  operations: number
}

interface LoadingFlags {
  stats: boolean
  requests: boolean
  cash: boolean
  vendors: boolean
  settings: boolean
  scheduled: boolean
  batches: boolean
  analytics: boolean
  commissions: boolean
  refunds: boolean
  transactions: boolean
  points: boolean
}

const currencyOptions = [
  { code: 'XOF', label: 'FCFA - Franc CFA' },
  { code: 'EUR', label: '€ - Euro' },
  { code: 'USD', label: '$ - Dollar US' }
]

const validationDays = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']

const defaultStats: FinancialStats = {
  totalRevenue: 0,
  revenueGross: 0,
  revenueRefunds: 0,
  revenueNet: 0,
  totalCommission: 0,
  totalPayouts: 0,
  pendingPayouts: 0,
  monthlyGrowth: 0,
  averageOrderValue: 0,
  approvalRate: 0
}

const defaultSettings: PayoutSettings = {
  autoPayout: false,
  minimumThreshold: 0,
  primaryValidationDay: 'lundi',
  backupValidationDay: 'mardi',
  internalNotes: ''
}

const defaultRefundSettings: RefundSettings = {
  autoAdjustCommission: true,
  notifyVendor: true,
  escalationEmail: '',
  resolutionWindow: 7
}

const solidOrangeButton = 'bg-orange-500 hover:bg-orange-600 text-white border-none'
const outlineOrangeButton = 'border border-orange-500 text-orange-600 hover:bg-orange-50'
const subtleOrangeButton = 'bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-200'

/**
 * Tableau de bord financier moderne, orienté données réelles.
 */
const FinancialManagement = ({ initialStats }: { initialStats?: FinancialManagementInitialStats } = {}) => {
  const FINANCE_STATS_CACHE_KEY = 'finance_stats_cache_v1'
  const POINTS_STATS_CACHE_KEY = 'finance_points_stats_cache_v1'

  const readCachedJson = <T,>(key: string): T | null => {
    try {
      if (typeof window === 'undefined') return null
      const raw = window.localStorage.getItem(key)
      if (!raw) return null
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  }

  const writeCachedJson = (key: string, value: unknown) => {
    try {
      if (typeof window === 'undefined') return
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      return
    }
  }

  const cachedFinancialStats = readCachedJson<FinancialStats>(FINANCE_STATS_CACHE_KEY)
  const cachedPointsStats = readCachedJson<PointsStatsSummary>(POINTS_STATS_CACHE_KEY)

  const initialFinancialFromProps: FinancialStats | null = initialStats
    ? {
        totalRevenue: Number(initialStats.totalRevenue) || 0,
        revenueGross: Number(initialStats.revenueGross) || 0,
        revenueRefunds: Number(initialStats.revenueRefunds) || 0,
        revenueNet: Number(initialStats.revenueNet) || 0,
        totalCommission: Number(initialStats.totalCommission) || 0,
        totalPayouts: Number(initialStats.totalPayouts) || 0,
        pendingPayouts: Number(initialStats.pendingPayouts) || 0,
        monthlyGrowth: Number(initialStats.monthlyGrowth) || 0,
        averageOrderValue: Number(initialStats.averageOrderValue) || 0,
        approvalRate: Number(initialStats.approvalRate) || 0
      }
    : null

  const initialPointsFromProps: PointsStatsSummary | null = initialStats?.points
    ? {
        totalBalance: Number(initialStats.points.totalBalance) || 0,
        totalFcfaValue: Number(initialStats.points.totalFcfaValue) || 0,
        withdrawalsApproved: Number(initialStats.points.withdrawalsApproved) || 0,
        exchangesTotal: Number(initialStats.points.exchangesTotal) || 0,
        exchangeFees: Number(initialStats.points.exchangeFees) || 0,
        feesTotal: Number(initialStats.points.feesTotal) || 0,
        transfersVolume: Number(initialStats.points.transfersVolume) || 0,
        redemptionsTotal: Number(initialStats.points.redemptionsTotal) || 0
      }
    : null

  const [financialStats, setFinancialStats] = useState<FinancialStats>(
    () => initialFinancialFromProps ?? cachedFinancialStats ?? defaultStats
  )
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([])
  const [scheduledPayouts, setScheduledPayouts] = useState<PaymentRequest[]>([])
  const [paymentSchedules, setPaymentSchedules] = useState<PaymentSchedule[]>([])
  const [paymentSchedulesError, setPaymentSchedulesError] = useState<string | null>(null)
  const [paymentBatches, setPaymentBatches] = useState<PaymentBatch[]>([])
  const [cashFlows, setCashFlows] = useState<CashFlowEntry[]>([])
  const [vendorMetrics, setVendorMetrics] = useState<VendorMetric[]>([])
  const [analytics, setAnalytics] = useState<FinancialAnalytics | null>(null)
  const [commissionRules, setCommissionRules] = useState<CommissionRule[]>([])
  const [transactions, setTransactions] = useState<TransactionEntry[]>([])
  const [refundCases, setRefundCases] = useState<RefundCase[]>([])
  const [refundSettings, setRefundSettings] = useState<RefundSettings>(defaultRefundSettings)
  const [settingsDraft, setSettingsDraft] = useState<PayoutSettings>(defaultSettings)
  const [currency, setCurrency] = useState('XOF')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentRequest['status']>('all')
  const [transactionStatusFilter, setTransactionStatusFilter] = useState<'all' | TransactionEntry['status']>('all')
  const [transactionSearch, setTransactionSearch] = useState('')
  const [refundStatusFilter, setRefundStatusFilter] = useState<'all' | RefundCase['status']>('all')
  const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isRejectionOpen, setIsRejectionOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [selectedScheduleRequest, setSelectedScheduleRequest] = useState<PaymentRequest | null>(null)
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleWindow, setScheduleWindow] = useState('')
  const [batchTargetRequest, setBatchTargetRequest] = useState<PaymentRequest | null>(null)
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false)
  const [selectedBatchId, setSelectedBatchId] = useState('')
  const [batchLabel, setBatchLabel] = useState('')
  const [isCommissionModalOpen, setIsCommissionModalOpen] = useState(false)
  const [commissionDraft, setCommissionDraft] = useState<Partial<CommissionRule>>({ scope: 'global' })
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false)
  const [selectedRefund, setSelectedRefund] = useState<RefundCase | null>(null)
  const [refundResolutionNotes, setRefundResolutionNotes] = useState('')
  const [commissionModalError, setCommissionModalError] = useState<string | null>(null)
  const [refundModalStatus, setRefundModalStatus] = useState<RefundCase['status']>('requested')
  const [refundModalError, setRefundModalError] = useState<string | null>(null)
  const [loading, setLoading] = useState<LoadingFlags>({
    stats: !Boolean(cachedFinancialStats),
    requests: true,
    cash: true,
    vendors: true,
    settings: true,
    scheduled: true,
    batches: true,
    analytics: true,
    commissions: true,
    refunds: true,
    transactions: true,
    points: !Boolean(cachedPointsStats)
  })
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [partialWarning, setPartialWarning] = useState<string | null>(null)
  const [isBackfillRunning, setIsBackfillRunning] = useState(false)
  const [backfillMessage, setBackfillMessage] = useState<string | null>(null)
  const [activeMainTab, setActiveMainTab] = useState('overview')
  const [adminPointsConfig, setAdminPointsConfig] = useState<AdminPointsConfig | null>(null)
  const [activePointsTab, setActivePointsTab] = useState('summary')
  const [activePaymentRequestsTab, setActivePaymentRequestsTab] = useState('requests')

  // Etats pour l'onglet Points
  const [pointsStats, setPointsStats] = useState<PointsStatsSummary>(() => initialPointsFromProps ?? cachedPointsStats ?? {
    totalBalance: 0,
    totalFcfaValue: 0,
    withdrawalsApproved: 0,
    exchangesTotal: 0,
    exchangeFees: 0,
    feesTotal: 0,
    transfersVolume: 0,
    redemptionsTotal: 0
  })

  useEffect(() => {
    writeCachedJson(FINANCE_STATS_CACHE_KEY, financialStats)
  }, [FINANCE_STATS_CACHE_KEY, financialStats])

  useEffect(() => {
    writeCachedJson(POINTS_STATS_CACHE_KEY, pointsStats)
  }, [POINTS_STATS_CACHE_KEY, pointsStats])
  const [pointsWithdrawals, setPointsWithdrawals] = useState<PointsWithdrawal[]>([])
  const [pointsTransfers, setPointsTransfers] = useState<PointsTransfer[]>([])
  const [pointsExchanges, setPointsExchanges] = useState<PointsExchange[]>([])
  const [pointsRedemptions, setPointsRedemptions] = useState<PointsRedemption[]>([])
  const [pointsTransactions, setPointsTransactions] = useState<PointsTransaction[]>([])
  const [pointsTotal, setPointsTotal] = useState<number | null>(null)
  const [pointsAggregates, setPointsAggregates] = useState<{ points: number; value: number } | null>(null)
  const [withdrawalsTotal, setWithdrawalsTotal] = useState<number | null>(null)
  const [transfersTotal, setTransfersTotal] = useState<number | null>(null)
  const [exchangesTotal, setExchangesTotal] = useState<number | null>(null)
  const [redemptionsTotal, setRedemptionsTotal] = useState<number | null>(null)
  const [withdrawalsAggregates, setWithdrawalsAggregates] = useState<{ points: number; payout: number; fee: number } | null>(null)
  const [transfersAggregates, setTransfersAggregates] = useState<{ points: number; fee: number } | null>(null)
  const [exchangesAggregates, setExchangesAggregates] = useState<{ points: number; converted: number; fee: number } | null>(null)
  const [redemptionsAggregates, setRedemptionsAggregates] = useState<{ pointsSpent: number } | null>(null)

  // Filtres & pagination pour l'onglet Points
  const [pointsSearch, setPointsSearch] = useState('')
  const [pointsCategory, setPointsCategory] = useState<'all' | 'fee' | 'withdrawal' | 'exchange' | 'redemption' | 'other'>('all')
  const [pointsPage, setPointsPage] = useState(1)
  const [pointsPageSize, setPointsPageSize] = useState(10)
  const [pointsFromDate, setPointsFromDate] = useState('')
  const [pointsToDate, setPointsToDate] = useState('')
  const [pointsUserFilter, setPointsUserFilter] = useState('')
  const [pointsSortKey, setPointsSortKey] = useState<'date' | 'points' | 'value' | 'type' | 'category'>('date')
  const [pointsSortOrder, setPointsSortOrder] = useState<'asc' | 'desc'>('desc')

  // Filtres/pagination retraits de points
  const [withdrawalsSearch, setWithdrawalsSearch] = useState('')
  const [withdrawalsStatus, setWithdrawalsStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [withdrawalsPage, setWithdrawalsPage] = useState(1)
  const [withdrawalsPageSize, setWithdrawalsPageSize] = useState(5)

  // Filtres/pagination transferts
  const [transfersSearch, setTransfersSearch] = useState('')
  const [transfersStatus, setTransfersStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [transfersPage, setTransfersPage] = useState(1)
  const [transfersPageSize, setTransfersPageSize] = useState(5)

  // Filtres/pagination échanges
  const [exchangesSearch, setExchangesSearch] = useState('')
  const [exchangesFromDate, setExchangesFromDate] = useState('')
  const [exchangesToDate, setExchangesToDate] = useState('')
  const [exchangesPage, setExchangesPage] = useState(1)
  const [exchangesPageSize, setExchangesPageSize] = useState(5)

  // Filtres/pagination rédemptions
  const [redemptionsSearch, setRedemptionsSearch] = useState('')
  const [redemptionsPage, setRedemptionsPage] = useState(1)
  const [redemptionsPageSize, setRedemptionsPageSize] = useState(5)

  /** Formate un montant dans la devise active. */
  const formatAmount = useCallback(
    (value: number) => {
      const formatted = new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value)
      return currency === 'XOF' ? formatted.replace('XOF', 'FCFA') : formatted
    },
    [currency]
  )

  /**
   * Formate un nombre de points avec suffixe 'pts'.
   */
  const formatPointsCount = useCallback((value: number) => {
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value) + ' pts'
  }, [])

  /** Paramètres mailto par défaut pour les notifications. */
  const MAIL_DEFAULTS = {
    to: 'finance@votreentreprise.com',
    cc: 'ops@votreentreprise.com',
    bcc: '',
    subjectPrefix: '[Paiements]'
  } as const

  /** Construit une URL mailto avec destinataire, CC/BCC et corps. */
  const buildMailtoHref = useCallback((to: string, subject: string, body: string, cc?: string, bcc?: string) => {
    const params: string[] = []
    if (cc) params.push(`cc=${encodeURIComponent(cc)}`)
    if (bcc) params.push(`bcc=${encodeURIComponent(bcc)}`)
    params.push(`subject=${encodeURIComponent(subject)}`)
    params.push(`body=${encodeURIComponent(body)}`)
    return `mailto:${encodeURIComponent(to)}?${params.join('&')}`
  }, [])

  /** Réglages email modifiables via l'UI. */
  const [emailSettings, setEmailSettings] = useState<{
    to: string
    cc: string
    bcc: string
    subjectPrefix: string
    recipientMode: 'all' | 'user' | 'group' | 'custom'
    selectedUserId: string | null
    groupEmails: string
  }>({
    to: MAIL_DEFAULTS.to,
    cc: MAIL_DEFAULTS.cc,
    bcc: MAIL_DEFAULTS.bcc,
    subjectPrefix: MAIL_DEFAULTS.subjectPrefix,
    recipientMode: 'all',
    selectedUserId: null,
    groupEmails: ''
  })

  // Persistance locale temporaire des paramètres e-mail
  const EMAIL_SETTINGS_KEY = 'finance_email_settings_v1'

  useEffect(() => {
    try {
      const raw = localStorage.getItem(EMAIL_SETTINGS_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        setEmailSettings((prev) => ({
          ...prev,
          to: typeof parsed.to === 'string' ? parsed.to : prev.to,
          cc: typeof parsed.cc === 'string' ? parsed.cc : prev.cc,
          bcc: typeof parsed.bcc === 'string' ? parsed.bcc : prev.bcc,
          subjectPrefix: typeof parsed.subjectPrefix === 'string' ? parsed.subjectPrefix : prev.subjectPrefix,
          recipientMode: ['all', 'user', 'group', 'custom'].includes(parsed.recipientMode) ? parsed.recipientMode : prev.recipientMode,
          selectedUserId: typeof parsed.selectedUserId === 'string' || parsed.selectedUserId === null ? parsed.selectedUserId : prev.selectedUserId,
          groupEmails: typeof parsed.groupEmails === 'string' ? parsed.groupEmails : prev.groupEmails
        }))
      }
    } catch (_) {
      void 0;
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(EMAIL_SETTINGS_KEY, JSON.stringify(emailSettings))
    } catch (_) {
      void 0;
    }
  }, [emailSettings])

  // Placeholders backend pour futurs branchements
  interface Segment { id: string; name: string; emails?: string[] }
  const [segments, setSegments] = useState<Segment[]>([])
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null)

  const loadEmailSettingsFromBackend = useCallback(async () => {
    try {
      const res = await fetch('/api/finance/email-settings')
      if (!res.ok) return
      const data = await res.json()
      setEmailSettings((prev) => ({
        ...prev,
        to: typeof data.to === 'string' ? data.to : prev.to,
        cc: typeof data.cc === 'string' ? data.cc : prev.cc,
        bcc: typeof data.bcc === 'string' ? data.bcc : prev.bcc,
        subjectPrefix: typeof data.subjectPrefix === 'string' ? data.subjectPrefix : prev.subjectPrefix,
        recipientMode: ['all', 'user', 'group', 'custom'].includes(data.recipientMode) ? data.recipientMode : prev.recipientMode,
        selectedUserId: typeof data.selectedUserId === 'string' || data.selectedUserId === null ? data.selectedUserId : prev.selectedUserId,
        groupEmails: typeof data.groupEmails === 'string' ? data.groupEmails : prev.groupEmails
      }))
    } catch (_) {
      void 0
    }
  }, [])

  const saveEmailSettingsToBackend = useCallback(async (settings: typeof emailSettings) => {
    try {
      await fetch('/api/finance/email-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
    } catch (_) {
      void 0
    }
  }, [])

  const loadSegmentsFromBackend = useCallback(async () => {
    try {
      const res = await fetch('/api/segments')
      if (!res.ok) return
      const data = await res.json()
      if (Array.isArray(data)) {
        const normalized: Segment[] = data.map((s: any) => ({
          id: String(s.id ?? ''),
          name: String(s.name ?? 'Segment'),
          emails: Array.isArray(s.emails) ? s.emails.filter((e: any) => typeof e === 'string') : []
        }))
        setSegments(normalized)
      }
    } catch (_) {
      void 0
    }
  }, [])

  useEffect(() => {
    if (emailSettings.recipientMode === 'group') {
      loadSegmentsFromBackend()
    }
    // On pourrait charger aussi les settings backend si souhaité
    // Activation: on charge la configuration e-mail au montage
    // (appelé aussi si Hot Reload redéfinit les callbacks)
    loadEmailSettingsFromBackend()
  }, [emailSettings.recipientMode, loadSegmentsFromBackend])

  /** Calcule dynamiquement la liste des destinataires 'To' selon le mode choisi. */
  const getEffectiveTo = useCallback(() => {
    if (emailSettings.recipientMode === 'all') {
      const emails = new Set<string>()
      const list = analytics?.userRevenues ?? []
      list.forEach((u) => {
        if (u.userEmail) emails.add(u.userEmail)
      })
      return Array.from(emails).join(',')
    }
    if (emailSettings.recipientMode === 'user') {
      const list = analytics?.userRevenues ?? []
      const found = list.find((u) => u.userId === emailSettings.selectedUserId)
      return found?.userEmail || ''
    }
    if (emailSettings.recipientMode === 'group') {
      const parsed = (emailSettings.groupEmails || '')
        .split(/[;,:\s]+/)
        .map((s) => s.trim())
        .filter(Boolean)
      const seg = selectedSegmentId ? segments.find((s) => s.id === selectedSegmentId) : undefined
      const combined = new Set<string>([...(seg?.emails ?? []), ...parsed])
      return Array.from(combined).join(',')
    }
    return emailSettings.to
  }, [emailSettings, analytics?.userRevenues, segments, selectedSegmentId])

  /** Retourne la liste des emails destinataires calculés. */
  const getEffectiveToList = useCallback(() => {
    return getEffectiveTo()
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }, [getEffectiveTo])

  /** Ouvre un ou plusieurs mailto en segmentant pour rester sous une longueur d'URL sûre. */
  const openMailtoChunked = useCallback((toList: string[], subject: string, body: string, cc?: string, bcc?: string) => {
    const MAX_URL = 1800
    const chunks: string[][] = []
    let current: string[] = []
    const urlLength = (toStr: string) => buildMailtoHref(toStr, subject, body, cc, bcc).length
    for (const email of toList) {
      const candidate = current.length ? `${current.join(',')},${email}` : email
      if (current.length === 0 || urlLength(candidate) <= MAX_URL) {
        current.push(email)
      } else {
        chunks.push(current)
        current = [email]
      }
    }
    if (current.length) chunks.push(current)
    chunks.forEach((grp, index) => {
      const href = buildMailtoHref(grp.join(','), subject, body, cc, bcc)
      setTimeout(() => {
        window.open(href, '_blank')
      }, index * 250)
    })
  }, [buildMailtoHref])

  /**
   * Formate une date ISO en date/heure lisible locale fr-FR.
   */
  const formatDateTime = useCallback((iso: string) => {
    try {
      const d = new Date(iso)
      return new Intl.DateTimeFormat('fr-FR', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      }).format(d)
    } catch {
      return iso
    }
  }, [])

  /**
   * Donne une aide lisible pour une catégorie de transaction de points.
   */
  const getCategoryHelp = useCallback((cat: PointsTransaction['category']) => {
    switch (cat) {
      case 'withdrawal':
        return 'Retrait de points convertis en cash'
      case 'exchange':
        return 'Échange de points contre une autre valeur (monnaie)'
      case 'redemption':
        return 'Utilisation de points pour une récompense'
      case 'fee':
        return "Frais appliqués à une opération sur points"
      default:
        return 'Autre mouvement sur le solde de points'
    }
  }, [])

  /** Transactions points issues du serveur (déjà filtrées/triées/paginées). */
  const filteredPointsTransactions = useMemo(() => {
    return pointsTransactions
  }, [pointsTransactions])

  const totalFilteredPoints = pointsTotal ?? filteredPointsTransactions.length

  /** L'ordre est géré côté serveur selon pointsSortKey/pointsSortOrder. */
  const sortedPointsTransactions = useMemo(() => {
    return filteredPointsTransactions
  }, [filteredPointsTransactions])

  const paginatedPointsTransactions = useMemo(() => {
    return sortedPointsTransactions
  }, [sortedPointsTransactions])

  // Totaux (filtrés) pour transactions points
  const filteredPointsTotals = useMemo(() => {
    return filteredPointsTransactions.reduce(
      (acc, t) => {
        acc.points += Number(t.points || 0)
        acc.value += Number(t.value || 0)
        return acc
      },
      { points: 0, value: 0 }
    )
  }, [filteredPointsTransactions])

  const displayedPointsTotals = useMemo(() => {
    return pointsAggregates ?? filteredPointsTotals
  }, [pointsAggregates, filteredPointsTotals])
  // Retraits de points côté serveur
  const filteredWithdrawals = useMemo(() => pointsWithdrawals, [pointsWithdrawals])
  const totalFilteredWithdrawals = withdrawalsTotal ?? filteredWithdrawals.length
  const paginatedWithdrawals = useMemo(() => filteredWithdrawals, [filteredWithdrawals])

  // Transferts côté serveur
  const filteredTransfers = useMemo(() => pointsTransfers, [pointsTransfers])
  const totalFilteredTransfers = transfersTotal ?? filteredTransfers.length
  const paginatedTransfers = useMemo(() => filteredTransfers, [filteredTransfers])

  // Échanges côté serveur
  const filteredExchanges = useMemo(() => pointsExchanges, [pointsExchanges])
  const totalFilteredExchanges = exchangesTotal ?? filteredExchanges.length
  const paginatedExchanges = useMemo(() => filteredExchanges, [filteredExchanges])

  // Rédemptions côté serveur
  const filteredRedemptions = useMemo(() => pointsRedemptions, [pointsRedemptions])
  const totalFilteredRedemptions = redemptionsTotal ?? filteredRedemptions.length
  const paginatedRedemptions = useMemo(() => filteredRedemptions, [filteredRedemptions])

  // Totaux (filtrés) pour retraits/transferts/échanges/rédemptions
  const filteredWithdrawalsTotals = useMemo(() => {
    return filteredWithdrawals.reduce(
      (acc, w) => {
        acc.points += Number(w.pointsAmount || 0)
        acc.payout += Number(w.payoutAmount || 0)
        acc.fee += Number(w.feeAmount || 0)
        return acc
      },
      { points: 0, payout: 0, fee: 0 }
    )
  }, [filteredWithdrawals])
  const displayedWithdrawalsTotals = useMemo(() => {
    return withdrawalsAggregates ?? filteredWithdrawalsTotals
  }, [withdrawalsAggregates, filteredWithdrawalsTotals])
  const filteredTransfersTotals = useMemo(() => {
    return filteredTransfers.reduce(
      (acc, t) => {
        acc.points += Number(t.pointsAmount || 0)
        acc.fee += Number(t.feeAmount || 0)
        return acc
      },
      { points: 0, fee: 0 }
    )
  }, [filteredTransfers])
  const displayedTransfersTotals = useMemo(() => {
    return transfersAggregates ?? filteredTransfersTotals
  }, [transfersAggregates, filteredTransfersTotals])
  const filteredExchangesTotals = useMemo(() => {
    return filteredExchanges.reduce(
      (acc, ex) => {
        acc.points += Number(ex.pointsAmount || 0)
        acc.converted += Number(ex.convertedAmount || 0)
        acc.fee += Number(ex.feeAmount || 0)
        return acc
      },
      { points: 0, converted: 0, fee: 0 }
    )
  }, [filteredExchanges])
  const displayedExchangesTotals = useMemo(() => {
    return exchangesAggregates ?? filteredExchangesTotals
  }, [exchangesAggregates, filteredExchangesTotals])
  const filteredRedemptionsTotal = useMemo(() => {
    return filteredRedemptions.reduce((acc, r) => acc + Number(r.pointsSpent || 0), 0)
  }, [filteredRedemptions])
  const displayedRedemptionsTotal = useMemo(() => {
    return redemptionsAggregates?.pointsSpent ?? filteredRedemptionsTotal
  }, [redemptionsAggregates, filteredRedemptionsTotal])

  /** Renvoie la variante de badge selon le statut. */
  const badgeVariant = useCallback((status: PaymentRequest['status']) => {
    switch (status) {
      case 'approved':
        return 'default'
      case 'pending':
        return 'secondary'
      default:
        return 'destructive'
    }
  }, [])

  /** Libellé lisible du statut. */
  const statusLabel = useCallback((status: PaymentRequest['status']) => {
    switch (status) {
      case 'approved':
        return 'Approuvée'
      case 'pending':
        return 'En attente'
      default:
        return 'Rejetée'
    }
  }, [])

  /** Libellé lisible de la méthode de paiement. */
  const paymentMethodLabel = useCallback((method: PaymentMethod) => {
    switch (method) {
      case 'bank_transfer':
        return 'Virement bancaire'
      case 'mobile_money':
        return 'Mobile Money'
      default:
        return 'Carte bancaire'
    }
  }, [])

  /** Libellé lisible du mode d'exécution. */
  const executionLabel = useCallback((executionType?: PaymentRequest['executionType']) => {
    switch (executionType) {
      case 'scheduled':
        return 'Paiement programmé'
      case 'batch':
        return 'Paiement groupé'
      case 'immediate':
        return 'Paiement immédiat'
      default:
        return 'Traitement à définir'
    }
  }, [])

  /** Filtre les demandes selon le statut et la recherche. */
  const filteredRequests = useMemo(() => {
    return paymentRequests.filter((request) => {
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter
      const matchesSearch = `${request.vendorName} ${request.id}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
      return matchesStatus && matchesSearch
    })
  }, [paymentRequests, searchTerm, statusFilter])

  /** Agrégats des flux financiers pour les visualisations. */
  const cashSummary = useMemo(() => {
    const incoming = cashFlows
      .filter((entry) => entry.direction === 'in')
      .reduce((total, entry) => total + entry.amount, 0)
    const payouts = cashFlows
      .filter((entry) => entry.direction === 'out' && entry.category === 'payout')
      .reduce((total, entry) => total + entry.amount, 0)
    const expenses = cashFlows
      .filter((entry) => entry.category === 'expense')
      .reduce((total, entry) => total + entry.amount, 0)

    return {
      incoming,
      payouts,
      expenses,
      balance: incoming - payouts - expenses
    }
  }, [cashFlows])

  /** Produit le plus performant selon l'analyse. */
  const topProduct = useMemo(() => {
    const products = analytics?.productRevenues ?? []
    return products.reduce<ProductRevenue | null>((best, current) => {
      if (!best || current.totalRevenue > best.totalRevenue) {
        return current
      }
      return best
    }, null)
  }, [analytics])

  /** Utilisateur le plus contributeur. */
  const topUser = useMemo(() => {
    const users = analytics?.userRevenues ?? []
    return users.reduce<UserRevenue | null>((best, current) => {
      if (!best || current.totalSpent > best.totalSpent) {
        return current
      }
      return best
    }, null)
  }, [analytics])

  /** Transactions filtrées selon la recherche et le statut. */
  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const matchesStatus = transactionStatusFilter === 'all' || transaction.status === transactionStatusFilter
      const haystack = `${transaction.vendorName} ${transaction.orderId}`.toLowerCase()
      const matchesSearch = haystack.includes(transactionSearch.toLowerCase())
      return matchesStatus && matchesSearch
    })
  }, [transactions, transactionStatusFilter, transactionSearch])

  /** Remboursements filtrés par statut. */
  const filteredRefunds = useMemo(() => {
    return refundCases.filter((refund) => {
      return refundStatusFilter === 'all' || refund.status === refundStatusFilter
    })
  }, [refundCases, refundStatusFilter])

  /** Synthèse des transactions filtrées. */
  const transactionSummary = useMemo(() => {
    const totals = filteredTransactions.reduce(
      (acc, transaction) => {
        acc.totalGross += transaction.grossAmount
        acc.totalCommission += transaction.commissionTaken
        acc.totalNet += transaction.netAmount
        acc.vendors.add(transaction.vendorId)
        acc.statusCount[transaction.status] += 1
        return acc
      },
      {
        totalGross: 0,
        totalCommission: 0,
        totalNet: 0,
        vendors: new Set<string>(),
        statusCount: {
          paid: 0,
          pending: 0,
          processing: 0
        }
      }
    )

    return {
      totalGross: totals.totalGross,
      totalCommission: totals.totalCommission,
      totalNet: totals.totalNet,
      vendorCount: totals.vendors.size,
      statusCount: totals.statusCount
    }
  }, [filteredTransactions])

  /** Synthèse des remboursements filtrés. */
  const refundSummary = useMemo(() => {
    return filteredRefunds.reduce(
      (acc, refund) => {
        acc.totalAmount += refund.amount
        acc.totalAdjustment += refund.commissionAdjustment
        acc.statusCount[refund.status] += 1
        return acc
      },
      {
        totalAmount: 0,
        totalAdjustment: 0,
        statusCount: {
          requested: 0,
          processing: 0,
          resolved: 0
        }
      }
    )
  }, [filteredRefunds])

  /** Classement commissions par vendeur. */
  const vendorCommissionInsights = useMemo(() => {
    const aggregates = new Map<string, VendorCommissionInsight>()

    filteredTransactions.forEach((transaction) => {
      const current = aggregates.get(transaction.vendorId) || {
        vendorId: transaction.vendorId,
        vendorName: transaction.vendorName,
        totalCommission: 0,
        totalGross: 0,
        totalNet: 0,
        operations: 0
      }

      current.totalCommission += transaction.commissionTaken
      current.totalGross += transaction.grossAmount
      current.totalNet += transaction.netAmount
      current.operations += 1
      aggregates.set(transaction.vendorId, current)
    })

    return Array.from(aggregates.values()).sort((first, second) => second.totalCommission - first.totalCommission)
  }, [filteredTransactions])

  /**
   * Exporte un tableau d'objets en CSV et déclenche un téléchargement.
   */
  const exportArrayToCSV = useCallback((filename: string, rows: Record<string, any>[]) => {
    const headers = Object.keys(rows[0] || {})
    const escapeValue = (val: any) => {
      if (val === null || val === undefined) return ''
      const s = String(val).replace(/"/g, '""')
      return /[",\n]/.test(s) ? `"${s}"` : s
    }
    const csv = [headers.join(',')]
      .concat(rows.map((row) => headers.map((h) => escapeValue(row?.[h])).join(',')))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  const fetchAllVendorTransactionsForExport = useCallback(async (): Promise<TransactionEntry[]> => {
    const authHeaders = await ClientAuthService.buildAuthHeaders()
    const q = transactionSearch.trim()
    const status = transactionStatusFilter !== 'all' ? transactionStatusFilter : ''
    const pageSize = 500

    let page = 1
    let total: number | null = null
    const allRows: TransactionEntry[] = []

    while (true) {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (status) params.set('status', status)
      params.set('page', String(page))
      params.set('pageSize', String(pageSize))
      params.set('withCount', 'true')

      const res = await fetch(`/api/finance/transactions?${params.toString()}`, { headers: authHeaders })
      if (!res.ok) throw new Error('Échec du chargement des transactions vendeurs (export)')
      const payload = await res.json()

      const rows: TransactionEntry[] = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.rows)
          ? payload.rows
          : []

      if (typeof payload?.total === 'number') {
        total = payload.total
      }

      allRows.push(...rows)

      if (rows.length < pageSize) break
      if (total !== null && allRows.length >= total) break

      page += 1
      if (page > 200) {
        throw new Error("Export interrompu: trop de pages à récupérer (sécurité)")
      }
    }

    return allRows
  }, [transactionSearch, transactionStatusFilter])

  const fetchAllCashFlowForExport = useCallback(async (): Promise<CashFlowEntry[]> => {
    const authHeaders = await ClientAuthService.buildAuthHeaders()
    const pageSize = 500

    let page = 1
    let total: number | null = null
    const allRows: CashFlowEntry[] = []

    while (true) {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('pageSize', String(pageSize))
      params.set('withCount', 'true')

      const res = await fetch(`/api/finance/cash-flow?${params.toString()}`, { headers: authHeaders })
      if (!res.ok) throw new Error('Échec du chargement des flux financiers (export)')
      const payload = await res.json()

      const rows: CashFlowEntry[] = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.rows)
          ? payload.rows
          : []

      if (typeof payload?.total === 'number') {
        total = payload.total
      }

      allRows.push(...rows)

      if (rows.length < pageSize) break
      if (total !== null && allRows.length >= total) break

      page += 1
      if (page > 200) {
        throw new Error("Export interrompu: trop de pages à récupérer (sécurité)")
      }
    }

    return allRows
  }, [])

  const fetchAllRefundsForExport = useCallback(async (): Promise<RefundCase[]> => {
    const authHeaders = await ClientAuthService.buildAuthHeaders()
    const status = refundStatusFilter !== 'all' ? refundStatusFilter : ''
    const pageSize = 500

    let page = 1
    let total: number | null = null
    const allRows: RefundCase[] = []

    while (true) {
      const params = new URLSearchParams()
      if (status) params.set('status', status)
      params.set('page', String(page))
      params.set('pageSize', String(pageSize))
      params.set('withCount', 'true')

      const res = await fetch(`/api/finance/refunds?${params.toString()}`, { headers: authHeaders })
      if (!res.ok) throw new Error('Échec du chargement des remboursements (export)')
      const payload = await res.json()

      const rows: RefundCase[] = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.rows)
          ? payload.rows
          : []

      if (typeof payload?.total === 'number') {
        total = payload.total
      }

      allRows.push(...rows)

      if (rows.length < pageSize) break
      if (total !== null && allRows.length >= total) break

      page += 1
      if (page > 200) {
        throw new Error("Export interrompu: trop de pages à récupérer (sécurité)")
      }
    }

    return allRows
  }, [refundStatusFilter])

  /**
   * Recharge les données nécessaires et exporte la synthèse "Tendances financières" en CSV.
   */
  const exportOverviewTrendsCSV = useCallback(async () => {
    try {
      setLoading((s) => ({ ...s, cashflow: true }))
      const authHeaders = await ClientAuthService.buildAuthHeaders()
      const [statsRes, cashflowRows] = await Promise.all([
        fetch('/api/finance/stats', { headers: authHeaders }),
        fetchAllCashFlowForExport()
      ])

      if (!statsRes.ok) {
        throw new Error('Échec du chargement des statistiques (export tendances)')
      }

      const statsPayload = await statsRes.json()
      const totalCommission = Number(statsPayload?.totalCommission ?? 0) || 0

      const entriesClients = cashflowRows
        .filter((flow) => flow.direction === 'in' && flow.category === 'customer')
        .reduce((total, flow) => total + Number(flow.amount || 0), 0)

      const sortiesVendeurs = cashflowRows
        .filter((flow) => flow.direction === 'out' && flow.category === 'payout')
        .reduce((total, flow) => total + Number(flow.amount || 0), 0)

      const charges = cashflowRows
        .filter((flow) => flow.category === 'expense')
        .reduce((total, flow) => total + Number(flow.amount || 0), 0)

      const margeNette = totalCommission - charges

      const rows = [
        { metric: 'Entrées clients', value: Math.round(entriesClients) },
        { metric: 'Sorties vendeurs', value: Math.round(sortiesVendeurs) },
        { metric: 'Charges', value: Math.round(charges) },
        { metric: 'Marge nette', value: Math.round(margeNette) }
      ]

      exportArrayToCSV('tendances_financieres.csv', rows as any)
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Impossible d'exporter les tendances financières")
    } finally {
      setLoading((s) => ({ ...s, cashflow: false }))
    }
  }, [exportArrayToCSV, fetchAllCashFlowForExport])

  /**
   * Exporte un rapport synthétique des indicateurs financiers actuels.
   */
  const exportFinancialSummaryCSV = useCallback(() => {
    const rows = [
      { metric: 'Chiffre d\'affaires', value: financialStats.totalRevenue },
      { metric: 'Commissions', value: financialStats.totalCommission },
      { metric: 'Paiements versés', value: financialStats.totalPayouts },
      { metric: 'En attente', value: financialStats.pendingPayouts },
      { metric: 'Croissance annuelle (%)', value: financialStats.monthlyGrowth },
      { metric: 'Panier moyen', value: financialStats.averageOrderValue },
      { metric: 'Taux d\'approbation (%)', value: financialStats.approvalRate }
    ]
    exportArrayToCSV('rapport_financier.csv', rows as any)
  }, [exportArrayToCSV, financialStats])

  /** Exporte les demandes de paiement filtrées. */
  const exportPaymentRequestsCSV = useCallback(() => {
    const rows = filteredRequests.map((r) => ({
      id: r.id,
      vendeur: r.vendorName,
      commandes: r.ordersCount,
      montant_brut: r.totalAmount,
      commission: r.commissionAmount,
      net: r.netAmount,
      statut: r.status,
      methode: r.paymentMethod,
      programme: r.scheduleDate || '',
      fenetre: r.payoutWindow || '',
      lot: r.batchId || '',
      cree_le: r.createdAt,
      traite_le: r.processedAt || ''
    }))
    if (rows.length > 0) {
      exportArrayToCSV('demandes_paiement.csv', rows)
    }
  }, [exportArrayToCSV, filteredRequests])

  /** Exporte les transactions filtrées. */
  const exportTransactionsCSV = useCallback(async () => {
    try {
      setLoading((s) => ({ ...s, transactions: true }))
      const data = await fetchAllVendorTransactionsForExport()
      const rows = data.map((t) => ({
        id: t.id,
        vendeur: t.vendorName,
        commande: t.orderId,
        brut: t.grossAmount,
        commission: t.commissionTaken,
        net: t.netAmount,
        statut: t.status,
        date: t.occurredAt
      }))
      if (rows.length > 0) {
        exportArrayToCSV('transactions_vendeurs.csv', rows)
      }
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Impossible d'exporter les transactions vendeurs")
    } finally {
      setLoading((s) => ({ ...s, transactions: false }))
    }
  }, [exportArrayToCSV, fetchAllVendorTransactionsForExport])

  /** Exporte les remboursements filtrés. */
  const exportRefundsCSV = useCallback(async () => {
    try {
      setLoading((s) => ({ ...s, refunds: true }))
      const data = await fetchAllRefundsForExport()
      const rows = data.map((r) => ({
        id: r.id,
        commande: r.orderId,
        vendeur: r.vendorName,
        client: r.customerEmail,
        montant: r.amount,
        ajustement_commission: r.commissionAdjustment,
        statut: r.status,
        ouvert_le: r.openedAt,
        mis_a_jour: r.updatedAt || '',
        raison: r.reason || '',
        notes: r.resolutionNotes || ''
      }))
      if (rows.length > 0) {
        exportArrayToCSV('remboursements.csv', rows)
      }
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Impossible d'exporter les remboursements")
    } finally {
      setLoading((s) => ({ ...s, refunds: false }))
    }
  }, [exportArrayToCSV, fetchAllRefundsForExport])

  /** Exporte le détail d'un lot de paiement. */
  const exportBatchCSV = useCallback((batch: PaymentBatch) => {
    const rows = batch.requests.map((r) => ({
      lot: batch.id,
      label_lot: batch.label,
      statut_lot: batch.status,
      vendeur: r.vendorName,
      reference: r.id,
      net: r.netAmount,
      programme: r.scheduleDate || ''
    }))
    if (rows.length > 0) {
      exportArrayToCSV(`lot_${batch.id}.csv`, rows)
    }
  }, [exportArrayToCSV])

  /** Exporte le classement des commissions par vendeur. */
  const exportCommissionInsightsCSV = useCallback(() => {
    const rows = vendorCommissionInsights.map((i) => ({
      vendeur: i.vendorName,
      operations: i.operations,
      commission: i.totalCommission,
      ventes_brutes: i.totalGross,
      net_verse: i.totalNet
    }))
    if (rows.length > 0) {
      exportArrayToCSV('classement_commissions.csv', rows)
    }
  }, [exportArrayToCSV, vendorCommissionInsights])

  /**
   * Construit un résumé texte compact du relevé financier courant.
   */
  const buildFinancialSummaryText = useCallback(() => {
    const lines: string[] = []
    lines.push('Relevé financier - Synthèse')
    lines.push(`Date: ${new Date().toLocaleString('fr-FR')}`)
    lines.push('')
    lines.push('— Indicateurs globaux —')
    lines.push(`Chiffre d'affaires: ${formatAmount(financialStats.totalRevenue)}`)
    lines.push(`Commissions: ${formatAmount(financialStats.totalCommission)}`)
    lines.push(`Paiements versés: ${formatAmount(financialStats.totalPayouts)}`)
    lines.push(`En attente: ${formatAmount(financialStats.pendingPayouts)}`)
    lines.push(`Croissance annuelle: ${financialStats.monthlyGrowth}%`)
    lines.push(`Panier moyen: ${formatAmount(financialStats.averageOrderValue)}`)
    lines.push(`Taux d'approbation: ${financialStats.approvalRate}%`)
    lines.push('')
    lines.push('— Flux financiers —')
    lines.push(`Encaissements: ${formatAmount(cashSummary.incoming)}`)
    lines.push(`Décaissements (payouts): ${formatAmount(cashSummary.payouts)}`)
    lines.push(`Charges: ${formatAmount(cashSummary.expenses)}`)
    lines.push(`Balance nette: ${formatAmount(cashSummary.balance)}`)
    lines.push('')
    lines.push('— Transactions vendeurs (filtrées) —')
    lines.push(`Ventes brutes: ${formatAmount(transactionSummary.totalGross)}`)
    lines.push(`Commission prélevée: ${formatAmount(transactionSummary.totalCommission)}`)
    lines.push(`Net reversé: ${formatAmount(transactionSummary.totalNet)}`)
    lines.push(`Vendeurs concernés: ${transactionSummary.vendorCount}`)
    lines.push(`Statuts - Payées: ${transactionSummary.statusCount.paid}, En cours: ${transactionSummary.statusCount.processing}, En attente: ${transactionSummary.statusCount.pending}`)
    lines.push('')
    lines.push('— Remboursements —')
    lines.push(`Montant remboursé: ${formatAmount(refundSummary.totalAmount)}`)
    lines.push(`Ajustement de commission: ${formatAmount(refundSummary.totalAdjustment)}`)
    lines.push(`Dossiers ouverts: ${refundSummary.statusCount.requested}, Résolus: ${refundSummary.statusCount.resolved}`)
    lines.push('')
    lines.push('— Points (synthèse) —')
    lines.push(`Solde total points: ${formatPointsCount(pointsStats.totalBalance)} (≈ ${formatAmount(pointsStats.totalFcfaValue)})`)
    lines.push(`Frais cumulés: ${formatAmount(pointsStats.feesTotal)}, Échanges: ${formatAmount(pointsStats.exchangesTotal)}, Rédemptions: ${formatPointsCount(pointsStats.redemptionsTotal)}`)
    return lines.join('\n')
  }, [financialStats, cashSummary, transactionSummary, refundSummary, pointsStats, formatAmount, formatPointsCount])

  /**
   * Télécharge un fichier texte avec le contenu fourni.
   */
  const downloadTextFile = useCallback((filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  /** Télécharge un JSON formaté. */
  const downloadJSONFile = useCallback((filename: string, data: unknown) => {
    const content = JSON.stringify(data, null, 2)
    const blob = new Blob([content], { type: 'application/json;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  /**
   * Prépare et envoie le relevé via client mail (mailto) et télécharge une copie locale.
   */
  const handleSendFinancialReport = useCallback(() => {
    const summary = buildFinancialSummaryText()
    // Téléchargement local pour archivage
    downloadTextFile('releve_financier.txt', summary)
    // Préparer l'email personnalisé
    const subject = `${emailSettings.subjectPrefix} Relevé financier - ${new Date().toLocaleDateString('fr-FR')}`
    const body = `${summary}\n\n(Le rapport détaillé est joint ou disponible en pièce jointe locale.)`
    openMailtoChunked(getEffectiveToList(), subject, body, emailSettings.cc, emailSettings.bcc)
  }, [buildFinancialSummaryText, downloadTextFile, emailSettings, getEffectiveToList, openMailtoChunked])

  /** Construit une facture globalisée simple à partir des demandes filtrées. */
  const buildGlobalInvoiceText = useCallback(() => {
    const lines: string[] = []
    lines.push('Facture globalisée - Demandes de paiement')
    lines.push(`Date: ${new Date().toLocaleString('fr-FR')}`)
    lines.push('')
    let totalNet = 0
    lines.push('Vendeur;Référence;Commandes;Brut;Commission;Net;Statut')
    filteredRequests.forEach((r) => {
      totalNet += Number(r.netAmount || 0)
      lines.push([
        r.vendorName,
        r.id,
        r.ordersCount,
        formatAmount(r.totalAmount),
        formatAmount(r.commissionAmount),
        formatAmount(r.netAmount),
        r.status
      ].join(';'))
    })
    lines.push('')
    lines.push(`Total net à verser: ${formatAmount(totalNet)}`)
    return lines.join('\n')
  }, [filteredRequests, formatAmount])

  /** Génère et télécharge la facture globalisée. */
  const handleGenerateInvoice = useCallback(() => {
    const content = buildGlobalInvoiceText()
    downloadTextFile('facture_globalisee.txt', content)
  }, [buildGlobalInvoiceText, downloadTextFile])

  /** Prépare un email aux vendeurs avec récapitulatif des paiements approuvés. */
  const handleNotifyVendors = useCallback(() => {
    const approved = filteredRequests.filter((r) => r.status === 'approved')
    const lines: string[] = []
    lines.push('Notification de paiement')
    lines.push(`Date: ${new Date().toLocaleString('fr-FR')}`)
    lines.push('')
    if (approved.length === 0) {
      lines.push('Aucun paiement approuvé pour le moment.')
    } else {
      lines.push('Paiements approuvés:')
      approved.forEach((r) => {
        lines.push(`- ${r.vendorName} · Net: ${formatAmount(r.netAmount)} · Réf: ${r.id}`)
      })
    }
    const content = lines.join('\n')
    downloadTextFile('notification_vendeurs.txt', content)
    const campaign = selectedBatchId ? `Campagne ${selectedBatchId}` : 'Campagne générale'
    const subject = `${emailSettings.subjectPrefix} Notification de paiement vendeur · ${campaign}`
    const body = `${content}\n\nMerci de votre collaboration.`
    openMailtoChunked(getEffectiveToList(), subject, body, emailSettings.cc, emailSettings.bcc)
  }, [filteredRequests, formatAmount, downloadTextFile, selectedBatchId, emailSettings, getEffectiveToList, openMailtoChunked])

  /** Alerte de validation pour les demandes en attente. */
  const handleValidationAlert = useCallback(() => {
    const pending = filteredRequests.filter((r) => r.status === 'pending')
    const lines: string[] = []
    lines.push('Alerte validation - Demandes en attente')
    lines.push(`Date: ${new Date().toLocaleString('fr-FR')}`)
    lines.push('')
    if (pending.length === 0) {
      lines.push('Aucune demande en attente actuellement.')
    } else {
      pending.forEach((r) => {
        lines.push(`- ${r.vendorName} · Brut: ${formatAmount(r.totalAmount)} · Net: ${formatAmount(r.netAmount)} · Réf: ${r.id}`)
      })
    }
    const content = lines.join('\n')
    downloadTextFile('alerte_validation.txt', content)
    const campaign = selectedBatchId ? `Campagne ${selectedBatchId}` : 'Campagne générale'
    const subject = `${emailSettings.subjectPrefix} Alerte validation · ${campaign}`
    const body = content
    openMailtoChunked(getEffectiveToList(), subject, body, emailSettings.cc, emailSettings.bcc)
  }, [filteredRequests, formatAmount, downloadTextFile, selectedBatchId, emailSettings, getEffectiveToList, openMailtoChunked])

  /** Export d'une règle de commission au format JSON. */
  const exportCommissionRuleJSON = useCallback((rule: CommissionRule) => {
    downloadJSONFile(`commission_rule_${rule.id || 'nouvelle'}.json`, rule)
  }, [downloadJSONFile])


  /** Échappe une valeur pour CSV. */
  const csvEscape = useCallback((value: unknown) => {
    const s = String(value ?? '')
    if (/[",;\n]/.test(s)) {
      return '"' + s.replace(/"/g, '""') + '"'
    }
    return s
  }, [])

  /** Exporte l'historique des flux financiers (cashflow) en CSV. */
  const exportCashFlowCSV = useCallback(async () => {
    try {
      setLoading((s) => ({ ...s, cash: true }))
      const data = await fetchAllCashFlowForExport()
      const headers = ['id', 'direction', 'category', 'label', 'amount', 'occurredAt']
      const rows = data.map((e) => [
        csvEscape(e.id),
        csvEscape(e.direction),
        csvEscape(e.category),
        csvEscape(e.label),
        csvEscape(e.amount),
        csvEscape(e.occurredAt)
      ])
      const content = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
      downloadTextFile('cashflow.csv', content)
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Impossible d'exporter les flux financiers")
    } finally {
      setLoading((s) => ({ ...s, cash: false }))
    }
  }, [csvEscape, downloadTextFile, fetchAllCashFlowForExport])

  /** Exporte les revenus par produit (analyse) en CSV. */
  const exportProductRevenuesCSV = useCallback(() => {
    const data = analytics?.productRevenues ?? []
    const headers = ['productId', 'productName', 'orders', 'totalRevenue', 'netRevenue', 'marginRate']
    const rows = data.map((p) => [
      csvEscape(p.productId),
      csvEscape(p.productName),
      csvEscape(p.orders),
      csvEscape(p.totalRevenue),
      csvEscape(p.netRevenue),
      csvEscape(p.marginRate)
    ])
    const content = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    downloadTextFile('revenus_produits.csv', content)
  }, [analytics?.productRevenues, csvEscape, downloadTextFile])

  /** Exporte les revenus par utilisateur (analyse) en CSV. */
  const exportUserRevenuesCSV = useCallback(() => {
    const data = analytics?.userRevenues ?? []
    const headers = ['userId', 'userName', 'userEmail', 'totalSpent', 'commissionGenerated']
    const rows = data.map((u) => [
      csvEscape(u.userId),
      csvEscape(u.userName),
      csvEscape(u.userEmail),
      csvEscape(u.totalSpent),
      csvEscape(u.commissionGenerated)
    ])
    const content = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    downloadTextFile('revenus_utilisateurs.csv', content)
  }, [analytics?.userRevenues, csvEscape, downloadTextFile])

  const fetchAllVendorMetricsForExport = useCallback(async (): Promise<VendorMetric[]> => {
    const authHeaders = await ClientAuthService.buildAuthHeaders()
    const res = await fetch('/api/finance/vendor-metrics', { headers: authHeaders })
    if (!res.ok) {
      throw new Error('Échec du chargement des métriques vendeurs (export)')
    }
    const data = await res.json()
    return Array.isArray(data) ? data : []
  }, [])

  /** Export CSV des transactions d'un vendeur (vue Transactions). */
  const exportVendorTransactionsCSV = useCallback((vendorId: string) => {
    const headers = ['id', 'orderId', 'grossAmount', 'commissionTaken', 'netAmount', 'status', 'occurredAt']
    const rows = filteredTransactions
      .filter((t) => t.vendorId === vendorId)
      .map((t) => [
        csvEscape(t.id),
        csvEscape(t.orderId),
        csvEscape(t.grossAmount),
        csvEscape(t.commissionTaken),
        csvEscape(t.netAmount),
        csvEscape(t.status),
        csvEscape(t.occurredAt)
      ])
    const content = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    downloadTextFile(`transactions_vendeur_${vendorId}.csv`, content)
  }, [filteredTransactions, csvEscape, downloadTextFile])

  /** Export CSV des transactions de points d'un utilisateur. */
  const exportUserPointsTransactionsCSV = useCallback((userId: string) => {
    const headers = ['id', 'type', 'category', 'points', 'value', 'description', 'createdAt']
    const rows = filteredPointsTransactions
      .filter((t) => t.userId === userId)
      .map((t) => [
        csvEscape(t.id),
        csvEscape(t.type),
        csvEscape(t.category),
        csvEscape(t.points),
        csvEscape(t.value),
        csvEscape(t.description),
        csvEscape(t.createdAt)
      ])
    const content = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    downloadTextFile(`points_utilisateur_${userId}.csv`, content)
  }, [filteredPointsTransactions, csvEscape, downloadTextFile])

  const fetchAllPointsTransactionsForExport = useCallback(async (): Promise<PointsTransaction[]> => {
    const authHeaders = await ClientAuthService.buildAuthHeaders()
    const q = pointsSearch.trim()
    const u = pointsUserFilter.trim()
    const pageSize = 500

    let page = 1
    let total: number | null = null
    const allRows: PointsTransaction[] = []

    while (true) {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (pointsCategory !== 'all') params.set('category', pointsCategory)
      if (u) params.set('userId', u)
      if (pointsFromDate) params.set('from', `${pointsFromDate}T00:00:00`)
      if (pointsToDate) params.set('to', `${pointsToDate}T23:59:59`)
      params.set('sort', pointsSortKey)
      params.set('order', pointsSortOrder)
      params.set('page', String(page))
      params.set('pageSize', String(pageSize))
      params.set('withCount', 'true')

      const res = await fetch(`/api/finance/points-transactions?${params.toString()}`, { headers: authHeaders })
      if (!res.ok) throw new Error('Échec du chargement des transactions de points (export)')
      const payload = await res.json()

      const rows: PointsTransaction[] = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.rows)
          ? payload.rows
          : []

      if (typeof payload?.total === 'number') {
        total = payload.total
      }

      allRows.push(...rows)

      if (rows.length < pageSize) break
      if (total !== null && allRows.length >= total) break

      page += 1

      if (page > 200) {
        throw new Error("Export interrompu: trop de pages à récupérer (sécurité)")
      }
    }

    return allRows
  }, [pointsSearch, pointsCategory, pointsUserFilter, pointsFromDate, pointsToDate, pointsSortKey, pointsSortOrder])

  /** Exporte les transactions de points en CSV.
   */
  const exportPointsTransactionsCSV = useCallback(async () => {
    try {
      setLoading((s) => ({ ...s, points: true }))
      const data = await fetchAllPointsTransactionsForExport()
      const rows = data.map((t) => ({
        id: t.id,
        utilisateur: t.userId,
        type: t.type,
        categorie: t.category,
        points: t.points,
        valeur: t.value,
        description: t.description || '',
        date: t.createdAt
      }))
      if (rows.length > 0) {
        exportArrayToCSV('transactions_points.csv', rows as any)
      }
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Impossible d'exporter les transactions de points")
    } finally {
      setLoading((s) => ({ ...s, points: false }))
    }
  }, [exportArrayToCSV, fetchAllPointsTransactionsForExport])

  /** Exporte la liste des vendeurs sous surveillance en CSV. */
  const exportVendorMetricsCSV = useCallback(async () => {
    try {
      setLoading((s) => ({ ...s, vendors: true }))
      const data = await fetchAllVendorMetricsForExport()
      const headers = ['id', 'vendorName', 'pendingAmount', 'paidAmount', 'riskScore', 'lastPayout']
      const rows = data.map((v) => [
        csvEscape(v.id),
        csvEscape(v.vendorName),
        csvEscape(v.pendingAmount),
        csvEscape(v.paidAmount),
        csvEscape(v.riskScore),
        csvEscape(v.lastPayout || '')
      ])
      const content = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
      downloadTextFile('vendeurs_sous_surveillance.csv', content)
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Impossible d'exporter l'analyse vendeurs")
    } finally {
      setLoading((s) => ({ ...s, vendors: false }))
    }
  }, [csvEscape, downloadTextFile, fetchAllVendorMetricsForExport])

  /** Ouvre une modale d'analyse pour un vendeur. */
  const openInsightModalForVendor = useCallback((vendorId: string, vendorName: string) => {
    setInsightModal({ type: 'vendor', id: vendorId, name: vendorName })
  }, [])

  /** Ouvre une modale d'analyse pour un utilisateur. */
  const openInsightModalForUser = useCallback((userId: string, userName: string) => {
    setInsightModal({ type: 'user', id: userId, name: userName })
  }, [])

  /** État de la modale d'analyse. */
  const [insightModal, setInsightModal] = useState<{ type: 'vendor' | 'user'; id: string; name: string } | null>(null)

  /** Agrège les transactions par mois pour un vendeur pour affichage graphique. */
  const insightSeries = useMemo(() => {
    if (!insightModal || insightModal.type !== 'vendor') return [] as { label: string; value: number }[]
    const byMonth = new Map<string, number>()
    filteredTransactions
      .filter((t) => t.vendorId === insightModal.id)
      .forEach((t) => {
        const d = new Date(t.occurredAt)
        const label = `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
        byMonth.set(label, (byMonth.get(label) || 0) + Number(t.netAmount || 0))
      })
    const labels = Array.from(byMonth.keys()).sort((a, b) => {
      const [am, ay] = a.split('/').map(Number)
      const [bm, by] = b.split('/').map(Number)
      return ay === by ? am - bm : ay - by
    })
    return labels.slice(-6).map((label) => ({ label, value: byMonth.get(label) || 0 }))
  }, [filteredTransactions, insightModal])

  /** Agrège les transactions de points par mois pour un utilisateur. */
  const userInsightSeries = useMemo(() => {
    if (!insightModal || insightModal.type !== 'user') return [] as { label: string; value: number }[]
    const byMonth = new Map<string, number>()
    filteredPointsTransactions
      .filter((t) => t.userId === insightModal.id)
      .forEach((t) => {
        const d = new Date(t.createdAt)
        const label = `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
        byMonth.set(label, (byMonth.get(label) || 0) + Number(t.value || 0))
      })
    const labels = Array.from(byMonth.keys()).sort((a, b) => {
      const [am, ay] = a.split('/').map(Number)
      const [bm, by] = b.split('/').map(Number)
      return ay === by ? am - bm : ay - by
    })
    return labels.slice(-6).map((label) => ({ label, value: byMonth.get(label) || 0 }))
  }, [filteredPointsTransactions, insightModal])

  /** Calcule des KPIs pour le vendeur sélectionné. */
  const vendorKPIs = useMemo(() => {
    if (!insightModal || insightModal.type !== 'vendor') return null as null | {
      totalGross: number; totalCommission: number; totalNet: number; operations: number; lastOp?: string
    }
    const list = filteredTransactions.filter((t) => t.vendorId === insightModal.id)
    const totalGross = list.reduce((s, t) => s + Number(t.grossAmount || 0), 0)
    const totalCommission = list.reduce((s, t) => s + Number(t.commissionTaken || 0), 0)
    const totalNet = list.reduce((s, t) => s + Number(t.netAmount || 0), 0)
    const operations = list.length
    const lastOp = list[0]?.occurredAt
    return { totalGross, totalCommission, totalNet, operations, lastOp }
  }, [filteredTransactions, insightModal])

  /** Calcule des KPIs pour l'utilisateur sélectionné. */
  const userKPIs = useMemo(() => {
    if (!insightModal || insightModal.type !== 'user') return null as null | {
      totalSpent: number; commissionGenerated: number; lastPurchase?: string; userEmail?: string
    }
    const item = (analytics?.userRevenues ?? []).find((u) => u.userId === insightModal.id)
    return item ? {
      totalSpent: Number(item.totalSpent || 0),
      commissionGenerated: Number(item.commissionGenerated || 0),
      lastPurchase: item.lastPurchase,
      userEmail: item.userEmail
    } : { totalSpent: 0, commissionGenerated: 0 }
  }, [analytics?.userRevenues, insightModal])

  /** Exporte la traçabilité d'une demande sélectionnée. */
  const exportRequestTraceCSV = useCallback((request: PaymentRequest) => {
    const timeline = request.timeline ?? []
    if (timeline.length === 0) {
      return
    }
    const rows = timeline.map((e) => ({
      demande: request.id,
      evenement: e.label,
      acteur: e.actor,
      date: e.occurredAt
    }))
    exportArrayToCSV(`trace_demande_${request.id}.csv`, rows)
  }, [exportArrayToCSV])

  /** Exporte les transferts de points. */
  const exportPointsTransfersCSV = useCallback(() => {
    const rows = filteredTransfers.map((t) => ({
      id: t.id,
      emetteur: t.senderId,
      destinataire: t.recipientId,
      points: t.pointsAmount,
      frais: t.feeAmount,
      statut: t.status,
      cree_le: t.createdAt,
      traite_le: t.processedAt || ''
    }))
    if (rows.length > 0) {
      exportArrayToCSV('transferts_points.csv', rows as any)
    }
  }, [exportArrayToCSV, filteredTransfers])

  /** Exporte les échanges de points. */
  const exportPointsExchangesCSV = useCallback(() => {
    const rows = filteredExchanges.map((ex) => ({
      id: ex.id,
      utilisateur: ex.userId,
      points: ex.pointsAmount,
      converti: ex.convertedAmount,
      frais: ex.feeAmount,
      taux: ex.rate,
      cree_le: ex.createdAt
    }))
    if (rows.length > 0) {
      exportArrayToCSV('echanges_points.csv', rows as any)
    }
  }, [exportArrayToCSV, filteredExchanges])

  /** Exporte les rédemptions de récompenses en points. */
  const exportPointsRedemptionsCSV = useCallback(() => {
    const rows = filteredRedemptions.map((r) => ({
      id: r.id,
      utilisateur: r.userId,
      recompense: r.rewardId,
      points_depenses: r.pointsSpent,
      cree_le: r.createdAt
    }))
    if (rows.length > 0) {
      exportArrayToCSV('redemptions_points.csv', rows as any)
    }
  }, [exportArrayToCSV, filteredRedemptions])

  /** Exporte les retraits de points. */
  const exportPointsWithdrawalsCSV = useCallback(() => {
    const rows = filteredWithdrawals.map((w) => ({
      id: w.id,
      utilisateur: w.userId,
      methode_id: w.methodId,
      points: w.pointsAmount,
      montant: w.payoutAmount,
      frais: w.feeAmount,
      devise: w.currency,
      statut: w.status,
      cree_le: w.createdAt,
      traite_le: w.processedAt || ''
    }))
    if (rows.length > 0) {
      exportArrayToCSV('retraits_points.csv', rows as any)
    }
  }, [exportArrayToCSV, filteredWithdrawals])

  

  /** Charge l'ensemble des données financières depuis l'API. */
  const refreshData = useCallback(async () => {
    setErrorMessage(null)
    setPaymentSchedulesError(null)
    setLoading({
      stats: true,
      requests: true,
      cash: true,
      vendors: true,
      settings: true,
      scheduled: true,
      batches: true,
      analytics: true,
      commissions: true,
      refunds: true,
      transactions: true,
      points: true
    })

    try {
      const statsPromise = fetch('/api/finance/stats', { credentials: 'include' })
      const authHeadersPromise = ClientAuthService.buildAuthHeaders()

      // Helpers locaux pour une récupération tolérante aux erreurs partielles.
      /** Convertit un résultat settled en Response OK ou null. */
      const toOkResponse = (r: PromiseSettledResult<Response>): Response | null =>
        r.status === 'fulfilled' && r.value && r.value.ok ? r.value : null
      /** Récupère le JSON d'une réponse ou renvoie une valeur par défaut en cas d'échec. */
      const jsonOrDefault = async <T,>(res: Response | null, def: T): Promise<T> => {
        if (!res) return def
        try {
          return (await res.json()) as T
        } catch {
          return def
        }
      }

      const statsRes = await statsPromise
      if (statsRes.ok) {
        const stats = await statsRes.json().catch(() => ({} as any))
        setFinancialStats({
          totalRevenue: Number(stats.totalRevenue) || 0,
          revenueGross: Number((stats as any).revenueGross) || 0,
          revenueRefunds: Number((stats as any).revenueRefunds) || 0,
          revenueNet: Number((stats as any).revenueNet) || 0,
          totalCommission: Number(stats.totalCommission) || 0,
          totalPayouts: Number(stats.totalPayouts) || 0,
          pendingPayouts: Number(stats.pendingPayouts) || 0,
          monthlyGrowth: Number(stats.monthlyGrowth) || 0,
          averageOrderValue: Number(stats.averageOrderValue) || 0,
          approvalRate: Number(stats.approvalRate) || 0
        })

        if (stats && stats.points) {
          setPointsStats({
            totalBalance: Number(stats.points.totalBalance) || 0,
            totalFcfaValue: Number(stats.points.totalFcfaValue) || 0,
            withdrawalsApproved: Number(stats.points.withdrawalsApproved) || 0,
            exchangesTotal: Number(stats.points.exchangesTotal) || 0,
            exchangeFees: Number(stats.points.exchangeFees) || 0,
            feesTotal: Number(stats.points.feesTotal) || 0,
            transfersVolume: Number(stats.points.transfersVolume) || 0,
            redemptionsTotal: Number(stats.points.redemptionsTotal) || 0
          })
        }
      } else {
        setPartialWarning((prev) => {
          const msg = "Certaines sections n'ont pas pu être chargées: stats"
          if (!prev) return msg
          if (prev.includes('stats')) return prev
          return `${prev} | stats`
        })
      }

      setLoading((prev) => ({ ...prev, stats: false }))

      const authHeaders = await authHeadersPromise
      const settled = await Promise.allSettled([
        fetch('/api/finance/payment-requests', { headers: authHeaders, cache: 'no-store' }),
        fetch('/api/finance/scheduled-payouts', { headers: authHeaders }),
        fetch('/api/finance/payment-schedules?all=true', { headers: authHeaders }),
        fetch('/api/finance/payment-batches', { headers: authHeaders }),
        fetch('/api/finance/cash-flow', { headers: authHeaders }),
        fetch('/api/finance/vendor-metrics', { headers: authHeaders }),
        fetch('/api/finance/payout-settings', { headers: authHeaders }),
        fetch('/api/finance/refund-settings', { headers: authHeaders }),
        fetch('/api/finance/analytics', { headers: authHeaders }),
        fetch('/api/finance/commission-rules', { headers: authHeaders }),
        fetch('/api/finance/refunds', { headers: authHeaders }),
        fetch('/api/finance/transactions', { headers: authHeaders })
      ])

      // Détermine les sections en échec pour afficher un avertissement non bloquant
      const labels = [
        'payment-requests',
        'scheduled-payouts',
        'payment-schedules',
        'payment-batches',
        'cash-flow',
        'vendor-metrics',
        'payout-settings',
        'refund-settings',
        'analytics',
        'commission-rules',
        'refunds',
        'transactions'
      ]
      const failed: string[] = []
      settled.forEach((r, i) => {
        const ok = (r as PromiseSettledResult<Response>).status === 'fulfilled' && (r as PromiseFulfilledResult<Response>).value?.ok
        if (!ok) failed.push(labels[i])
      })
      setPartialWarning((prev) => {
        const base = prev ? String(prev) : ''
        const tail = failed.length ? `Certaines sections n'ont pas pu être chargées: ${failed.join(', ')}` : ''
        if (!base) return tail || null
        if (!tail) return base || null
        return base.includes(tail) ? base : `${base} | ${tail}`
      })

      const [
        requestsResS,
        scheduledResS,
        paymentSchedulesResS,
        batchesResS,
        cashResS,
        vendorsResS,
        settingsResS,
        refundSettingsResS,
        analyticsResS,
        commissionsResS,
        refundsResS,
        transactionsResS
      ] = settled as PromiseSettledResult<Response>[]

      try {
        if (requestsResS.status === 'fulfilled') {
          const res = requestsResS.value
          if (!res.ok) {
            const payload = await res.json().catch(() => ({} as any))
            const apiMsg = typeof (payload as any)?.error === 'string' ? (payload as any).error : `Échec du chargement des demandes (${res.status}).`
            console.warn('❌ GET /api/finance/payment-requests failed:', res.status, apiMsg)
            setErrorMessage(apiMsg)
          }
        } else {
          console.warn('❌ GET /api/finance/payment-requests failed: request rejected')
          setErrorMessage("Impossible de charger les demandes de paiement.")
        }
      } catch {
        setErrorMessage("Impossible de charger les demandes de paiement.")
      }

      try {
        if (paymentSchedulesResS.status === 'fulfilled') {
          const res = paymentSchedulesResS.value
          if (!res.ok) {
            const payload = await res.json().catch(() => ({} as any))
            const msg = typeof (payload as any)?.error === 'string' ? (payload as any).error : 'Impossible de charger les planifications vendeur.'
            setPaymentSchedulesError(msg)
          }
        } else {
          setPaymentSchedulesError('Impossible de charger les planifications vendeur.')
        }
      } catch {
        setPaymentSchedulesError('Impossible de charger les planifications vendeur.')
      }

      const [
        requests,
        scheduled,
        schedules,
        batches,
        cash,
        vendors,
        settings,
        refundSettingsPayload,
        analyticsPayload,
        commissionsPayload,
        refundsPayload,
        transactionsPayload
      ] = await Promise.all([
        jsonOrDefault(toOkResponse(requestsResS), [] as any),
        jsonOrDefault(toOkResponse(scheduledResS), [] as any),
        jsonOrDefault(toOkResponse(paymentSchedulesResS), [] as any),
        jsonOrDefault(toOkResponse(batchesResS), [] as any),
        jsonOrDefault(toOkResponse(cashResS), [] as any),
        jsonOrDefault(toOkResponse(vendorsResS), [] as any),
        jsonOrDefault(toOkResponse(settingsResS), {} as any),
        jsonOrDefault(toOkResponse(refundSettingsResS), {} as any),
        jsonOrDefault(toOkResponse(analyticsResS), {} as any),
        jsonOrDefault(toOkResponse(commissionsResS), [] as any),
        jsonOrDefault(toOkResponse(refundsResS), [] as any),
        jsonOrDefault(toOkResponse(transactionsResS), [] as any)
      ])
      setPaymentRequests(Array.isArray(requests) ? requests : [])
      setScheduledPayouts(Array.isArray(scheduled) ? scheduled : [])
      setPaymentSchedules(Array.isArray(schedules) ? schedules : [])
      setPaymentBatches(Array.isArray(batches) ? batches : [])
      setCashFlows(Array.isArray(cash) ? cash : [])
      setVendorMetrics(Array.isArray(vendors) ? vendors : [])
      setCommissionRules(Array.isArray(commissionsPayload) ? commissionsPayload : [])
      setRefundCases(Array.isArray(refundsPayload) ? refundsPayload : [])
      setTransactions(Array.isArray(transactionsPayload) ? transactionsPayload : [])
      setSettingsDraft({
        autoPayout: Boolean(settings.autoPayout),
        minimumThreshold: Number(settings.minimumThreshold) || 0,
        primaryValidationDay: settings.primaryValidationDay || 'lundi',
        backupValidationDay: settings.backupValidationDay || 'mardi',
        internalNotes: settings.internalNotes || ''
      })
      setRefundSettings({
        autoAdjustCommission: Boolean(refundSettingsPayload.autoAdjustCommission),
        notifyVendor: Boolean(refundSettingsPayload.notifyVendor),
        escalationEmail: refundSettingsPayload.escalationEmail || '',
        resolutionWindow: Number(refundSettingsPayload.resolutionWindow) || defaultRefundSettings.resolutionWindow
      })
      setAnalytics(
        analyticsPayload && typeof analyticsPayload === 'object'
          ? {
              totalOperations: Number(analyticsPayload.totalOperations) || 0,
              averagePayoutTime: Number(analyticsPayload.averagePayoutTime) || 0,
              fraudAlerts: Number(analyticsPayload.fraudAlerts) || 0,
              operationsTimeline: Array.isArray(analyticsPayload.operationsTimeline)
                ? analyticsPayload.operationsTimeline
                : [],
              productRevenues: Array.isArray(analyticsPayload.productRevenues)
                ? analyticsPayload.productRevenues
                : [],
              userRevenues: Array.isArray(analyticsPayload.userRevenues)
                ? analyticsPayload.userRevenues
                : []
            }
          : null
      )
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Erreur inconnue lors du chargement des données.')
    } finally {
      setLoading({
        stats: false,
        requests: false,
        cash: false,
        vendors: false,
        settings: false,
        scheduled: false,
        batches: false,
        analytics: false,
        commissions: false,
        refunds: false,
        transactions: false,
        points: false
      })
    }
  }, [])

  const runFinanceTransactionsBackfill = useCallback(async () => {
    const confirmed = window.confirm(
      "Ce backfill va générer les écritures manquantes dans finance_transactions à partir des commandes payées. Continuer ?"
    )
    if (!confirmed) return

    try {
      setBackfillMessage(null)
      setErrorMessage(null)
      setIsBackfillRunning(true)

      const authHeaders = await ClientAuthService.buildAuthHeaders()
      const res = await fetch('/api/finance/transactions/backfill', {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun: false, limit: 2000 })
      })

      const payload = (await res.json().catch(() => ({} as any))) as any
      if (!res.ok) {
        const apiMsg = typeof payload?.error === 'string' ? payload.error : 'Backfill impossible.'
        throw new Error(apiMsg)
      }

      const msg = `Backfill terminé. Scanné: ${Number(payload?.scanned ?? 0)} | Manquants: ${Number(
        payload?.missing ?? 0
      )} | finance_transactions: +${Number(payload?.financeTransactionsInserted ?? 0)} | cash_flow: +${Number(
        payload?.cashFlowInserted ?? 0
      )}`
      setBackfillMessage(msg)
      refreshData()
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : 'Backfill impossible.')
    } finally {
      setIsBackfillRunning(false)
    }
  }, [refreshData])

  /**
   * Récupère les transactions de points côté serveur avec filtres/tri/pagination,
   * et met à jour la liste ainsi que le total (withCount=true).
   */
  const fetchPointsTransactions = useCallback(async () => {
    try {
      const authHeaders = await ClientAuthService.buildAuthHeaders()
      const params = new URLSearchParams()
      const q = pointsSearch.trim()
      if (q) params.set('q', q)
      if (pointsCategory !== 'all') params.set('category', pointsCategory)
      const u = pointsUserFilter.trim()
      if (u) params.set('userId', u)
      if (pointsFromDate) params.set('from', `${pointsFromDate}T00:00:00`)
      if (pointsToDate) params.set('to', `${pointsToDate}T23:59:59`)
      params.set('sort', pointsSortKey)
      params.set('order', pointsSortOrder)
      params.set('page', String(pointsPage))
      params.set('pageSize', String(pointsPageSize))
      params.set('withCount', 'true')
      params.set('withAggregates', 'true')

      const res = await fetch(`/api/finance/points-transactions?${params.toString()}`, { headers: authHeaders })
      if (!res.ok) throw new Error('Échec du chargement des transactions de points')
      const payload = await res.json()
      if (Array.isArray(payload)) {
        setPointsTransactions(payload)
        setPointsTotal(payload.length)
        setPointsAggregates(null)
      } else {
        setPointsTransactions(Array.isArray(payload.rows) ? payload.rows : [])
        setPointsTotal(typeof payload.total === 'number' ? payload.total : null)
        setPointsAggregates(payload && payload.aggregates && typeof payload.aggregates === 'object'
          ? { points: Number(payload.aggregates.points || 0), value: Number(payload.aggregates.value || 0) }
          : null)
      }
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : 'Erreur lors du chargement des transactions de points')
    }
  }, [pointsSearch, pointsCategory, pointsUserFilter, pointsFromDate, pointsToDate, pointsSortKey, pointsSortOrder, pointsPage, pointsPageSize])

  useEffect(() => {
    if (activeMainTab !== 'points') return
    if (activePointsTab !== 'transactions') return
    setLoading((s) => ({ ...s, points: true }))
    fetchPointsTransactions()
      .finally(() => setLoading((s) => ({ ...s, points: false })))
  }, [activeMainTab, activePointsTab, fetchPointsTransactions])

  /**
   * Approuve une demande de retrait de points via l'API, met à jour l'UI et rafraîchit les données.
   */
  const approvePointWithdrawal = useCallback(async (withdrawalId: string) => {
    try {
      const authHeaders = await ClientAuthService.buildAuthHeaders()
      const response = await fetch(`/api/finance/points-withdrawals/${withdrawalId}/approve`, {
        method: 'POST',
        headers: authHeaders
      })
      if (!response.ok) {
        throw new Error("Échec de l'approbation du retrait de points.")
      }

      setPointsWithdrawals((prev) =>
        prev.map((w) => (w.id === withdrawalId ? { ...w, status: 'approved', processedAt: new Date().toISOString() } : w))
      )
      refreshData()
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Impossible d'approuver le retrait de points.")
    }
  }, [refreshData])

  /**
   * Charge les retraits de points côté serveur avec filtres/pagination et withCount.
   */
  const fetchPointsWithdrawals = useCallback(async () => {
    try {
      const authHeaders = await ClientAuthService.buildAuthHeaders()
      const params = new URLSearchParams()
      const q = withdrawalsSearch.trim()
      if (q) params.set('q', q)
      if (withdrawalsStatus !== 'all') params.set('status', withdrawalsStatus)
      params.set('page', String(withdrawalsPage))
      params.set('pageSize', String(withdrawalsPageSize))
      params.set('withCount', 'true')
      params.set('withAggregates', 'true')
      const res = await fetch(`/api/finance/points-withdrawals?${params.toString()}`, { headers: authHeaders })
      if (!res.ok) throw new Error('Échec du chargement des retraits de points')
      const payload = await res.json()
      if (Array.isArray(payload)) {
        setPointsWithdrawals(payload)
        setWithdrawalsTotal(payload.length)
        setWithdrawalsAggregates(null)
      } else {
        setPointsWithdrawals(Array.isArray(payload.rows) ? payload.rows : [])
        setWithdrawalsTotal(typeof payload.total === 'number' ? payload.total : null)
        setWithdrawalsAggregates(payload && payload.aggregates && typeof payload.aggregates === 'object'
          ? {
              points: Number(payload.aggregates.points || 0),
              payout: Number(payload.aggregates.payout || 0),
              fee: Number(payload.aggregates.fee || 0)
            }
          : null)
      }
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : 'Erreur lors du chargement des retraits de points')
    }
  }, [withdrawalsSearch, withdrawalsStatus, withdrawalsPage, withdrawalsPageSize])

  useEffect(() => {
    if (activeMainTab !== 'points') return
    if (activePointsTab !== 'withdrawals') return
    setLoading((s) => ({ ...s, points: true }))
    fetchPointsWithdrawals()
      .finally(() => setLoading((s) => ({ ...s, points: false })))
  }, [activeMainTab, activePointsTab, fetchPointsWithdrawals])

  /**
   * Charge les transferts de points côté serveur avec filtres/pagination et withCount.
   */
  const fetchPointsTransfers = useCallback(async () => {
    try {
      const authHeaders = await ClientAuthService.buildAuthHeaders()
      const params = new URLSearchParams()
      const q = transfersSearch.trim()
      if (q) params.set('q', q)
      if (transfersStatus !== 'all') params.set('status', transfersStatus)
      params.set('page', String(transfersPage))
      params.set('pageSize', String(transfersPageSize))
      params.set('withCount', 'true')
      params.set('withAggregates', 'true')
      const res = await fetch(`/api/finance/points-transfers?${params.toString()}`, { headers: authHeaders })
      if (!res.ok) throw new Error('Échec du chargement des transferts de points')
      const payload = await res.json()
      if (Array.isArray(payload)) {
        setPointsTransfers(payload)
        setTransfersTotal(payload.length)
        setTransfersAggregates(null)
      } else {
        setPointsTransfers(Array.isArray(payload.rows) ? payload.rows : [])
        setTransfersTotal(typeof payload.total === 'number' ? payload.total : null)
        setTransfersAggregates(payload && payload.aggregates && typeof payload.aggregates === 'object'
          ? {
              points: Number(payload.aggregates.points || 0),
              fee: Number(payload.aggregates.fee || 0)
            }
          : null)
      }
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : 'Erreur lors du chargement des transferts de points')
    }
  }, [transfersSearch, transfersStatus, transfersPage, transfersPageSize])

  useEffect(() => {
    if (activeMainTab !== 'points') return
    if (activePointsTab !== 'transfers') return
    setLoading((s) => ({ ...s, points: true }))
    fetchPointsTransfers()
      .finally(() => setLoading((s) => ({ ...s, points: false })))
  }, [activeMainTab, activePointsTab, fetchPointsTransfers])

  /**
   * Charge les échanges de points côté serveur avec filtres/pagination et withCount.
   */
  const fetchPointsExchanges = useCallback(async () => {
    try {
      const authHeaders = await ClientAuthService.buildAuthHeaders()
      const params = new URLSearchParams()
      const q = exchangesSearch.trim()
      if (q) params.set('q', q)
      if (exchangesFromDate) params.set('from', `${exchangesFromDate}T00:00:00`)
      if (exchangesToDate) params.set('to', `${exchangesToDate}T23:59:59`)
      params.set('page', String(exchangesPage))
      params.set('pageSize', String(exchangesPageSize))
      params.set('withCount', 'true')
      params.set('withAggregates', 'true')
      const res = await fetch(`/api/finance/points-exchanges?${params.toString()}`, { headers: authHeaders })
      if (!res.ok) throw new Error('Échec du chargement des échanges de points')
      const payload = await res.json()
      if (Array.isArray(payload)) {
        setPointsExchanges(payload)
        setExchangesTotal(payload.length)
        setExchangesAggregates(null)
      } else {
        setPointsExchanges(Array.isArray(payload.rows) ? payload.rows : [])
        setExchangesTotal(typeof payload.total === 'number' ? payload.total : null)
        setExchangesAggregates(payload && payload.aggregates && typeof payload.aggregates === 'object'
          ? {
              points: Number(payload.aggregates.points || 0),
              converted: Number(payload.aggregates.converted || 0),
              fee: Number(payload.aggregates.fee || 0)
            }
          : null)
      }
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : 'Erreur lors du chargement des échanges de points')
    }
  }, [exchangesSearch, exchangesFromDate, exchangesToDate, exchangesPage, exchangesPageSize])

  useEffect(() => {
    if (activeMainTab !== 'points') return
    if (activePointsTab !== 'exchanges') return
    setLoading((s) => ({ ...s, points: true }))
    fetchPointsExchanges()
      .finally(() => setLoading((s) => ({ ...s, points: false })))
  }, [activeMainTab, activePointsTab, fetchPointsExchanges])

  /**
   * Charge les rédemptions de points côté serveur avec filtres/pagination et withCount.
   */
  const fetchPointsRedemptions = useCallback(async () => {
    try {
      const authHeaders = await ClientAuthService.buildAuthHeaders()
      const params = new URLSearchParams()
      const q = redemptionsSearch.trim()
      if (q) params.set('q', q)
      params.set('page', String(redemptionsPage))
      params.set('pageSize', String(redemptionsPageSize))
      params.set('withCount', 'true')
      params.set('withAggregates', 'true')
      const res = await fetch(`/api/finance/points-redemptions?${params.toString()}`, { headers: authHeaders })
      if (!res.ok) throw new Error('Échec du chargement des rédemptions de points')
      const payload = await res.json()
      if (Array.isArray(payload)) {
        setPointsRedemptions(payload)
        setRedemptionsTotal(payload.length)
        setRedemptionsAggregates(null)
      } else {
        setPointsRedemptions(Array.isArray(payload.rows) ? payload.rows : [])
        setRedemptionsTotal(typeof payload.total === 'number' ? payload.total : null)
        setRedemptionsAggregates(payload && payload.aggregates && typeof payload.aggregates === 'object'
          ? { pointsSpent: Number(payload.aggregates.pointsSpent || 0) }
          : null)
      }
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : 'Erreur lors du chargement des rédemptions de points')
    }
  }, [redemptionsSearch, redemptionsPage, redemptionsPageSize])

  useEffect(() => {
    if (activeMainTab !== 'points') return
    if (activePointsTab !== 'redemptions') return
    setLoading((s) => ({ ...s, points: true }))
    fetchPointsRedemptions()
      .finally(() => setLoading((s) => ({ ...s, points: false })))
  }, [activeMainTab, activePointsTab, fetchPointsRedemptions])

  useEffect(() => {
    refreshData()
  }, [refreshData])

  /** Charge la configuration Super Admin des points (valeur d'achat / valeur de retrait). */
  useEffect(() => {
    let cancelled = false

    const loadAdminPointsConfig = async () => {
      try {
        const resp = await fetch('/api/public/points-config', { method: 'GET', cache: 'no-store' }).catch(() => null)
        const json = await resp?.json().catch(() => null)
        const payload = json?.data
        const purchaseValue = Number(payload?.purchaseValue)
        const withdrawalValue = Number(payload?.withdrawalValue)

        if (cancelled) return
        setAdminPointsConfig({
          purchaseValue: Number.isFinite(purchaseValue) && purchaseValue > 0 ? purchaseValue : 0,
          withdrawalValue: Number.isFinite(withdrawalValue) && withdrawalValue > 0 ? withdrawalValue : 0
        })
      } catch {
        if (cancelled) return
        setAdminPointsConfig({ purchaseValue: 0, withdrawalValue: 0 })
      }
    }

    void loadAdminPointsConfig()

    return () => {
      cancelled = true
    }
  }, [])

  /** Extrait un message d'erreur exploitable depuis une réponse API. */
  const parseApiErrorMessage = useCallback(async (response: Response): Promise<string> => {
    try {
      const payload = await response.json().catch(() => null)
      const message = payload && typeof payload === 'object' ? (payload as any)?.error : null
      if (typeof message === 'string' && message.trim().length > 0) return message
    } catch {
      // ignore
    }

    return `Erreur API (${response.status})`
  }, [])

  /** Crée ou met à jour une règle de commission. */
  const upsertCommissionRule = useCallback(async () => {
    if (!commissionDraft.scope) {
      setCommissionModalError('Sélectionnez une portée de règle.')
      return
    }

    try {
      setCommissionModalError(null)
      const method = commissionDraft.id ? 'PUT' : 'POST'
      const endpoint = commissionDraft.id
        ? `/api/finance/commission-rules/${commissionDraft.id}`
        : '/api/finance/commission-rules'

      const authHeaders = await ClientAuthService.buildAuthHeaders()

      const response = await fetch(endpoint, {
        method,
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(commissionDraft)
      })

      if (!response.ok) {
        const apiMsg = await parseApiErrorMessage(response)
        throw new Error(apiMsg || 'Échec de la sauvegarde de la règle de commission.')
      }

      const saved = (await response.json().catch(() => null)) as CommissionRule | null

      if (saved && typeof saved === 'object' && typeof (saved as any)?.id === 'string') {
        setCommissionRules((prev) => {
          const next = prev.filter((r) => r.id !== (saved as any).id)
          next.unshift(saved as CommissionRule)
          return next
        })
      }

      setIsCommissionModalOpen(false)
      setCommissionDraft({ scope: 'global' })
    } catch (error) {
      setCommissionModalError(error instanceof Error ? error.message : 'Erreur inconnue lors de la sauvegarde.')
    }
  }, [commissionDraft, parseApiErrorMessage])

  /** Sauvegarde la configuration de remboursements. */
  const saveRefundSettings = useCallback(async () => {
    try {
      const authHeaders = await ClientAuthService.buildAuthHeaders()
      const response = await fetch('/api/finance/refund-settings', {
        method: 'PUT',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(refundSettings)
      })

      if (!response.ok) {
        const apiMsg = await parseApiErrorMessage(response)
        throw new Error(apiMsg || 'Échec de la sauvegarde des paramètres de remboursement.')
      }

      const saved = (await response.json().catch(() => null)) as RefundSettings | null
      if (saved && typeof saved === 'object') {
        setRefundSettings({
          autoAdjustCommission: Boolean((saved as any).autoAdjustCommission),
          notifyVendor: Boolean((saved as any).notifyVendor),
          escalationEmail: typeof (saved as any).escalationEmail === 'string' ? (saved as any).escalationEmail : '',
          resolutionWindow: Number((saved as any).resolutionWindow) || 0
        })
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Impossible de sauvegarder les paramètres de remboursement.')
    }
  }, [parseApiErrorMessage, refundSettings])

  /** Met à jour le statut ou les notes d'un remboursement. */
  const updateRefundCase = useCallback(async () => {
    if (!selectedRefund) {
      return
    }

    try {
      setRefundModalError(null)
      const response = await fetch(`/api/finance/refunds/${selectedRefund.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: refundModalStatus,
          resolutionNotes: refundResolutionNotes
        })
      })

      if (!response.ok) {
        throw new Error('Échec de la mise à jour du dossier de remboursement.')
      }

      setIsRefundModalOpen(false)
      setSelectedRefund(null)
      setRefundResolutionNotes('')
      refreshData()
    } catch (error) {
      setRefundModalError(error instanceof Error ? error.message : 'Impossible de mettre à jour le dossier.')
    }
  }, [refreshData, refundModalStatus, refundResolutionNotes, selectedRefund])

  /** Approuve une demande via l'API. */
  const approveRequest = useCallback(async (requestId: string) => {
    try {
      const authHeaders = await ClientAuthService.buildAuthHeaders()
      const response = await fetch(`/api/finance/payment-requests/${requestId}/approve`, {
        method: 'POST',
        headers: authHeaders
      })

      if (!response.ok) {
        throw new Error("Échec de l'approbation de la demande.")
      }

      setPaymentRequests((previous) =>
        previous.map((request) =>
          request.id === requestId
            ? { ...request, status: 'approved', processedAt: new Date().toISOString() }
            : request
        )
      )
      refreshData()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Impossible d'approuver la demande.")
    }
  }, [refreshData])

  /** Prépare le rejet d'une demande. */
  const openRejectionModal = useCallback((request: PaymentRequest) => {
    setSelectedRequest(request)
    setRejectionReason('')
    setIsRejectionOpen(true)
  }, [])

  /** Valide le rejet via l'API. */
  const rejectRequest = useCallback(async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      return
    }

    try {
      const authHeaders = await ClientAuthService.buildAuthHeaders()
      const response = await fetch(`/api/finance/payment-requests/${selectedRequest.id}/reject`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectionReason })
      })

      if (!response.ok) {
        throw new Error('Échec du rejet de la demande.')
      }

      setPaymentRequests((previous) =>
        previous.map((request) =>
          request.id === selectedRequest.id
            ? { ...request, status: 'rejected', processedAt: new Date().toISOString(), notes: rejectionReason }
            : request
        )
      )
      setIsRejectionOpen(false)
      setSelectedRequest(null)
      setRejectionReason('')
      refreshData()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Impossible de rejeter la demande.')
    }
  }, [refreshData, rejectionReason, selectedRequest])

  /**
   * Exécute un lot de paiements via l'API et rafraîchit les données.
   */
  const executeBatch = useCallback(async (batchId: string) => {
    try {
      const response = await fetch(`/api/finance/payment-batches/${batchId}/execute`, { method: 'POST' })
      if (!response.ok) {
        throw new Error("Échec de l'exécution du lot.")
      }
      refreshData()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Impossible d\'exécuter le lot.')
    }
  }, [refreshData])

  /** Enregistre les paramètres financiers. */
  const saveSettings = useCallback(async () => {
    try {
      // Sauvegarde des paramètres e-mail (placeholder backend, non bloquant)
      saveEmailSettingsToBackend(emailSettings).catch(() => {})

      const authHeaders = await ClientAuthService.buildAuthHeaders()

      const response = await fetch('/api/finance/payout-settings', {
        method: 'PUT',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsDraft)
      })

      if (!response.ok) {
        const apiMsg = await parseApiErrorMessage(response)
        throw new Error(apiMsg || 'Échec de la sauvegarde des paramètres.')
      }

      const saved = (await response.json().catch(() => null)) as PayoutSettings | null
      if (saved && typeof saved === 'object') {
        setSettingsDraft({
          autoPayout: Boolean((saved as any).autoPayout),
          minimumThreshold: Number((saved as any).minimumThreshold) || 0,
          primaryValidationDay: (saved as any).primaryValidationDay || 'lundi',
          backupValidationDay: (saved as any).backupValidationDay || 'mardi',
          internalNotes: (saved as any).internalNotes || ''
        })
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Impossible de sauvegarder les paramètres.')
    }
  }, [settingsDraft, emailSettings, saveEmailSettingsToBackend, parseApiErrorMessage])

  /** Met à jour un champ de paramètre. */
  const handleSettingsChange = useCallback(
    (key: keyof PayoutSettings, value: PayoutSettings[keyof PayoutSettings]) => {
      setSettingsDraft((prev) => ({ ...prev, [key]: value } as PayoutSettings))
    },
    []
  )

  return (
    <div className="space-y-8">
      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      )}
      {backfillMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {backfillMessage}
        </div>
      )}
      {partialWarning && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          {partialWarning}
        </div>
      )}

      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion Financière</h1>
          <p className="text-gray-600">Pilotage des flux, paiements vendeurs et indicateurs clés.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Devise" />
            </SelectTrigger>
            <SelectContent>
              {currencyOptions.map((option) => (
                <SelectItem key={option.code} value={option.code}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className={outlineOrangeButton}
            onClick={exportFinancialSummaryCSV}
          >
            <Download className="mr-2 h-4 w-4" />Rapport synthétique
          </Button>
          <Button
            variant="outline"
            className={outlineOrangeButton}
            onClick={handleSendFinancialReport}
          >
            <Mail className="mr-2 h-4 w-4" />Envoyer un relevé
          </Button>
          <Button className={solidOrangeButton} onClick={refreshData}>
            <RefreshCw className="mr-2 h-4 w-4" />Actualiser
          </Button>
          <Button
            variant="outline"
            className={outlineOrangeButton}
            onClick={runFinanceTransactionsBackfill}
            disabled={isBackfillRunning}
          >
            <History className="mr-2 h-4 w-4" />{isBackfillRunning ? 'Backfill…' : 'Backfill transactions'}
          </Button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <TrendingUp className="h-5 w-5" />Chiffre d'affaires global
            </CardTitle>
            <CardDescription>12 derniers mois</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-2xl font-bold text-blue-900">{formatAmount(financialStats.revenueNet || financialStats.totalRevenue)}</p>
            <p className="text-sm text-blue-700">
              Ventes: {formatAmount(financialStats.revenueGross || financialStats.totalRevenue)} · Remboursements: {formatAmount(financialStats.revenueRefunds)}
            </p>
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <ArrowUpRight className="h-4 w-4" />+{financialStats.monthlyGrowth}% vs 12 mois précédents
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-800">
              <Wallet className="h-5 w-5" />Commissions collectées
            </CardTitle>
            <CardDescription>Recettes nettes de la plateforme</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-2xl font-bold text-emerald-900">{formatAmount(financialStats.totalCommission)}</p>
            <p className="text-sm text-emerald-700">Panier moyen : {formatAmount(financialStats.averageOrderValue)}</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-800">
              <BarChart3 className="h-5 w-5" />Paiements versés
            </CardTitle>
            <CardDescription>Montant total approuvé</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-2xl font-bold text-purple-900">{formatAmount(financialStats.totalPayouts)}</p>
            <div className="flex items-center gap-2 text-sm text-purple-700">
              <ShieldCheck className="h-4 w-4" />Taux d'approbation {financialStats.approvalRate}%
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <LineChart className="h-5 w-5" />Demandes en attente
            </CardTitle>
            <CardDescription>Montants à traiter</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-2xl font-bold text-amber-900">{formatAmount(financialStats.pendingPayouts)}</p>
            <Badge variant="outline" className="border-amber-400 text-amber-600">
              {paymentRequests.filter((request) => request.status === 'pending').length} demandes
            </Badge>
          </CardContent>
        </Card>
      </section>

      <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="w-full space-y-6">
        <TabsList className="grid w-full grid-cols-8 gap-2 bg-transparent">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="payment-requests">Demandes Paiem.</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="cashflow">Flux financiers</TabsTrigger>
          <TabsTrigger value="analysis">Analyse</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="points">Points</TabsTrigger>
          <TabsTrigger value="refunds">Remboursements</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Tendances financières</CardTitle>
                  <CardDescription>Vision synthétique des flux de la marketplace.</CardDescription>
                </div>
                <Button
                  variant="outline"
                  className={outlineOrangeButton}
                  onClick={exportOverviewTrendsCSV}
                  disabled={loading.cashflow}
                >
                  <Download className="mr-2 h-4 w-4" />Exporter
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-600">Entrées clients</span>
                  <ArrowUpRight className="h-4 w-4 text-blue-500" />
                </div>
                <p className="mt-3 text-xl font-semibold text-blue-900">{formatAmount(cashFlows
                  .filter((flow) => flow.direction === 'in' && flow.category === 'customer')
                  .reduce((total, flow) => total + flow.amount, 0))}</p>
                <p className="text-xs text-blue-700">Somme calculée selon les transactions réelles.</p>
              </div>
              <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-purple-600">Sorties vendeurs</span>
                  <ArrowDownRight className="h-4 w-4 text-purple-500" />
                </div>
                <p className="mt-3 text-xl font-semibold text-purple-900">{formatAmount(cashFlows
                  .filter((flow) => flow.direction === 'out' && flow.category === 'payout')
                  .reduce((total, flow) => total + flow.amount, 0))}</p>
                <p className="text-xs text-purple-700">Basé sur les virements validés.</p>
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-emerald-600">Marge nette</span>
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                </div>
                <p className="mt-3 text-xl font-semibold text-emerald-900">{formatAmount(
                  financialStats.totalCommission -
                  cashFlows
                    .filter((flow) => flow.category === 'expense')
                    .reduce((total, flow) => total + flow.amount, 0)
                )}</p>
                <p className="text-xs text-emerald-700">Commission nette moins charges déclarées.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Analyse vendeurs</CardTitle>
              <CardDescription>Suivi des partenaires nécessitant une attention particulière.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              {vendorMetrics.length === 0 && !loading.vendors && (
                <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                  Aucune donnée vendeur disponible pour le moment.
                </div>
              )}

              {vendorMetrics.map((vendor) => (
                <div key={vendor.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{vendor.vendorName}</p>
                      {vendor.lastPayout && (
                        <p className="text-xs text-slate-500">Dernier paiement : {vendor.lastPayout}</p>
                      )}
                    </div>
                    <Badge variant="outline" className="border-blue-300 text-blue-600">{vendor.riskScore}% risque</Badge>
                  </div>
                  <dl className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-slate-500">En attente</dt>
                      <dd className="font-semibold text-amber-700">{formatAmount(vendor.pendingAmount)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Versé</dt>
                      <dd className="font-semibold text-emerald-700">{formatAmount(vendor.paidAmount)}</dd>
                    </div>
                  </dl>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="points" className="space-y-6">
          <Tabs value={activePointsTab} onValueChange={setActivePointsTab} className="space-y-6">
            <div className="overflow-x-auto">
              <TabsList className="inline-flex w-max min-w-full gap-2 bg-transparent">
                <TabsTrigger value="summary">Points - Synthèse</TabsTrigger>
                <TabsTrigger value="indicators">Indicateurs de points</TabsTrigger>
                <TabsTrigger value="transactions">Transactions Points</TabsTrigger>
                <TabsTrigger value="withdrawals">Demandes de retrait points</TabsTrigger>
                <TabsTrigger value="transfers">Transferts de points</TabsTrigger>
                <TabsTrigger value="exchanges">Échanges de points</TabsTrigger>
                <TabsTrigger value="redemptions">Rédemptions</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="summary" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Points - Synthèse</CardTitle>
                  <CardDescription>Vue consolidée des opérations liées aux points.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-5">
                  <div className="rounded-lg border border-slate-200 p-4">
                    <p className="text-xs text-slate-500">Solde total</p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">{formatPointsCount(pointsStats.totalBalance)}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-4">
                    <p className="text-xs text-slate-500">Valeur équivalente Achat</p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">{formatAmount(
                      Math.max(0, Number(pointsStats.totalBalance || 0)) * Math.max(0, Number(adminPointsConfig?.purchaseValue || 0))
                    )}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-4">
                    <p className="text-xs text-slate-500">Valeur équivalente Retrait</p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">{formatAmount(
                      Math.max(0, Number(pointsStats.totalBalance || 0)) * Math.max(0, Number(adminPointsConfig?.withdrawalValue || 0))
                    )}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-4">
                    <p className="text-xs text-slate-500">Retraits approuvés</p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">{formatAmount(pointsStats.withdrawalsApproved)}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-4">
                    <p className="text-xs text-slate-500">Volume d'échanges</p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">{formatAmount(pointsStats.exchangesTotal)}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="indicators" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Indicateurs Points</CardTitle>
                  <CardDescription>Frais et volumes consolidés.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-4">
                  <div className="rounded-lg border border-slate-200 p-4">
                    <p className="text-xs text-slate-500">Frais cumulés</p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">{formatAmount(pointsStats.feesTotal)}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-4">
                    <p className="text-xs text-slate-500">Frais d'échange</p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">{formatAmount(pointsStats.exchangeFees)}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-4">
                    <p className="text-xs text-slate-500">Transferts</p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">{formatPointsCount(pointsStats.transfersVolume)}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-4">
                    <p className="text-xs text-slate-500">Rédemptions</p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">{formatPointsCount(pointsStats.redemptionsTotal)}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="transactions" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle>Transactions Points</CardTitle>
                    <CardDescription>Historique consolidé des opérations de points.</CardDescription>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      className={outlineOrangeButton}
                      onClick={exportPointsTransactionsCSV}
                    >
                      <FileText className="mr-2 h-4 w-4" />Exporter CSV
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="overflow-x-auto">
                    <div className="flex w-max min-w-full items-center gap-3 pb-2">
                      <Input
                        value={pointsSearch}
                        onChange={(e) => {
                          setPointsSearch(e.target.value)
                          setPointsPage(1)
                        }}
                        placeholder="Rechercher (type, description)"
                        className="w-64"
                      />
                      <Input
                        value={pointsUserFilter}
                        onChange={(e) => { setPointsUserFilter(e.target.value); setPointsPage(1) }}
                        placeholder="Utilisateur (ID)"
                        className="w-56"
                      />
                      <Input
                        type="date"
                        value={pointsFromDate}
                        onChange={(e) => { setPointsFromDate(e.target.value); setPointsPage(1) }}
                        className="w-40"
                      />
                      <Input
                        type="date"
                        value={pointsToDate}
                        onChange={(e) => { setPointsToDate(e.target.value); setPointsPage(1) }}
                        className="w-40"
                      />
                      <Select
                        value={pointsCategory}
                        onValueChange={(v) => {
                          setPointsCategory(v as typeof pointsCategory)
                          setPointsPage(1)
                        }}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Catégorie" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toutes catégories</SelectItem>
                          <SelectItem value="withdrawal">Retrait</SelectItem>
                          <SelectItem value="exchange">Échange</SelectItem>
                          <SelectItem value="redemption">Rédemption</SelectItem>
                          <SelectItem value="fee">Frais</SelectItem>
                          <SelectItem value="other">Autres</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={String(pointsPageSize)} onValueChange={(v) => { setPointsPageSize(Number(v)); setPointsPage(1) }}>
                        <SelectTrigger className="w-28">
                          <SelectValue placeholder="Taille" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10 / page</SelectItem>
                          <SelectItem value="25">25 / page</SelectItem>
                          <SelectItem value="50">50 / page</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                        value={pointsSortKey}
                        onValueChange={(v) => { setPointsSortKey(v as typeof pointsSortKey); setPointsPage(1) }}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Trier par" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="date">Date</SelectItem>
                          <SelectItem value="points">Points</SelectItem>
                          <SelectItem value="value">Valeur</SelectItem>
                          <SelectItem value="type">Type</SelectItem>
                          <SelectItem value="category">Catégorie</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                        value={pointsSortOrder}
                        onValueChange={(v) => { setPointsSortOrder(v as typeof pointsSortOrder); setPointsPage(1) }}
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue placeholder="Ordre" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="asc">Croissant</SelectItem>
                          <SelectItem value="desc">Décroissant</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {loading.points && (
                    <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                      Chargement des transactions de points...
                    </div>
                  )}

                  {!loading.points && filteredPointsTransactions.length === 0 && (
                    <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                      Aucune transaction de points trouvée.
                    </div>
                  )}

                  {!loading.points && filteredPointsTransactions.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="text-left text-slate-500">
                            <th className="p-2">Date</th>
                            <th className="p-2">Utilisateur</th>
                            <th className="p-2">Type</th>
                            <th className="p-2">Catégorie</th>
                            <th className="p-2">Points</th>
                            <th className="p-2">Valeur</th>
                            <th className="p-2">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedPointsTransactions.map((t) => (
                            <tr key={t.id} className="border-b">
                              <td className="p-2 text-slate-700">{formatDateTime(t.createdAt)}</td>
                              <td className="p-2 text-slate-700">
                                <button
                                  className="text-blue-600 hover:underline"
                                  onClick={() => { setPointsUserFilter(t.userId || ''); setPointsPage(1) }}
                                  title="Filtrer par cet utilisateur"
                                >
                                  {t.userId || '-'}
                                </button>
                              </td>
                              <td className="p-2 text-slate-700">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="underline decoration-dotted underline-offset-2 cursor-help">{t.type}</span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Type brut: {t.type}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </td>
                              <td className="p-2 text-slate-700">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="underline decoration-dotted underline-offset-2 cursor-help">{t.category}</span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{getCategoryHelp(t.category)}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </td>
                              <td className="p-2 font-semibold text-slate-900">{formatPointsCount(t.points)}</td>
                              <td className="p-2 font-semibold text-slate-900">{formatAmount(t.value)}</td>
                              <td className="p-2 text-slate-700">{t.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div className="text-xs text-slate-500">
                          <p>Total (filtré): {formatPointsCount(displayedPointsTotals.points)} · {formatAmount(displayedPointsTotals.value)}</p>
                          <p>{totalFilteredPoints} éléments · Page {pointsPage} / {Math.max(1, Math.ceil(totalFilteredPoints / pointsPageSize))}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className={outlineOrangeButton}
                            disabled={pointsPage <= 1}
                            onClick={() => setPointsPage((p) => Math.max(1, p - 1))}
                          >
                            Précédent
                          </Button>
                          <Button
                            variant="outline"
                            className={outlineOrangeButton}
                            disabled={pointsPage >= Math.ceil(totalFilteredPoints / pointsPageSize)}
                            onClick={() => setPointsPage((p) => p + 1)}
                          >
                            Suivant
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="withdrawals" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle>Demandes de retrait points</CardTitle>
                    <CardDescription>Approbation des retraits en attente.</CardDescription>
                  </div>
                  <div className="flex justify-end">
                    <Button variant="outline" className={outlineOrangeButton} onClick={exportPointsWithdrawalsCSV}>
                      <FileText className="mr-2 h-4 w-4" />Exporter CSV
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="overflow-x-auto">
                    <div className="flex w-max min-w-full items-center gap-3 pb-2">
                      <Input
                        value={withdrawalsSearch}
                        onChange={(e) => { setWithdrawalsSearch(e.target.value); setWithdrawalsPage(1) }}
                        placeholder="Rechercher (statut, devise)"
                        className="w-64"
                      />
                      <Select
                        value={withdrawalsStatus}
                        onValueChange={(v) => { setWithdrawalsStatus(v as any); setWithdrawalsPage(1) }}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Statut" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous</SelectItem>
                          <SelectItem value="pending">En attente</SelectItem>
                          <SelectItem value="approved">Approuvé</SelectItem>
                          <SelectItem value="rejected">Rejeté</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                        value={String(withdrawalsPageSize)}
                        onValueChange={(v) => { setWithdrawalsPageSize(Number(v)); setWithdrawalsPage(1) }}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue placeholder="Taille" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="25">25</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {loading.points && (
                    <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500">
                      Chargement des retraits...
                    </div>
                  )}

                  {!loading.points && pointsWithdrawals.length === 0 && (
                    <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500">
                      Aucun retrait référencé.
                    </div>
                  )}

                  {!loading.points && pointsWithdrawals.map((w) => (
                    <div key={w.id} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Réf. {w.id}</p>
                          <p className="text-xs text-slate-500">Utilisateur: {w.userId}</p>
                          <div className="mt-2 grid grid-cols-2 gap-3 text-xs md:grid-cols-3">
                            <div>
                              <p className="text-slate-500">Points</p>
                              <p className="font-semibold text-slate-800">{formatPointsCount(w.pointsAmount)}</p>
                            </div>
                            <div>
                              <p className="text-slate-500">Montant</p>
                              <p className="font-semibold text-slate-800">{formatAmount(w.payoutAmount)}</p>
                            </div>
                            <div>
                              <p className="text-slate-500">Frais</p>
                              <p className="font-semibold text-rose-600">{formatAmount(w.feeAmount)}</p>
                            </div>
                          </div>
                          <p className="mt-2 text-[11px] text-slate-500">Créé le {formatDateTime(w.createdAt)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="border-blue-300 text-blue-600">{w.status}</Badge>
                          {w.status === 'pending' && (
                            <Button className={solidOrangeButton} size="sm" onClick={() => approvePointWithdrawal(w.id)}>
                              <CheckCircle className="mr-2 h-4 w-4" />Approuver
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {!loading.points && pointsWithdrawals.length > 0 && (
                    <div className="mt-2 text-xs text-slate-500">
                      <p>
                        Total (filtré): {formatPointsCount(displayedWithdrawalsTotals.points)} · {formatAmount(displayedWithdrawalsTotals.payout)} · frais {formatAmount(displayedWithdrawalsTotals.fee)}
                      </p>
                      <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <p>{totalFilteredWithdrawals} éléments · Page {withdrawalsPage} / {Math.max(1, Math.ceil(totalFilteredWithdrawals / withdrawalsPageSize))}</p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className={outlineOrangeButton}
                            disabled={withdrawalsPage <= 1}
                            onClick={() => setWithdrawalsPage((p) => Math.max(1, p - 1))}
                          >
                            Précédent
                          </Button>
                          <Button
                            variant="outline"
                            className={outlineOrangeButton}
                            disabled={withdrawalsPage >= Math.ceil(totalFilteredWithdrawals / withdrawalsPageSize)}
                            onClick={() => setWithdrawalsPage((p) => p + 1)}
                          >
                            Suivant
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="transfers" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle>Transferts de points</CardTitle>
                    <CardDescription>Derniers transferts entre utilisateurs.</CardDescription>
                  </div>
                  <div className="flex justify-end">
                    <Button variant="outline" className={outlineOrangeButton} onClick={exportPointsTransfersCSV}>
                      <FileText className="mr-2 h-4 w-4" />Exporter CSV
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="overflow-x-auto">
                    <div className="flex w-max min-w-full items-center gap-3 pb-2">
                      <Input
                        value={transfersSearch}
                        onChange={(e) => { setTransfersSearch(e.target.value); setTransfersPage(1) }}
                        placeholder="Rechercher (statut)"
                        className="w-64"
                      />
                      <Select
                        value={transfersStatus}
                        onValueChange={(v) => { setTransfersStatus(v as any); setTransfersPage(1) }}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Statut" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous</SelectItem>
                          <SelectItem value="pending">En attente</SelectItem>
                          <SelectItem value="approved">Approuvé</SelectItem>
                          <SelectItem value="rejected">Rejeté</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                        value={String(transfersPageSize)}
                        onValueChange={(v) => { setTransfersPageSize(Number(v)); setTransfersPage(1) }}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue placeholder="Taille" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="25">25</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {loading.points && (
                    <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500">
                      Chargement des transferts...
                    </div>
                  )}
                  {!loading.points && pointsTransfers.length === 0 && (
                    <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500">
                      Aucun transfert référencé.
                    </div>
                  )}
                  {!loading.points && pointsTransfers.map((t) => (
                    <div key={t.id} className="rounded-xl border border-slate-200 p-4">
                      <div className="grid gap-3 md:grid-cols-4">
                        <div>
                          <p className="text-slate-500">Émetteur</p>
                          <p className="font-semibold text-slate-800">{t.senderId}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Destinataire</p>
                          <p className="font-semibold text-slate-800">{t.recipientId}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Points</p>
                          <p className="font-semibold text-slate-800">{formatPointsCount(t.pointsAmount)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="border-blue-300 text-blue-600">{t.status}</Badge>
                        </div>
                      </div>
                      <p className="mt-2 text-[11px] text-slate-500">Créé le {formatDateTime(t.createdAt)}</p>
                    </div>
                  ))}
                  {!loading.points && pointsTransfers.length > 0 && (
                    <div className="mt-2 text-xs text-slate-500">
                      <p>
                        Total (filtré): {formatPointsCount(displayedTransfersTotals.points)} · frais {formatPointsCount(displayedTransfersTotals.fee)}
                      </p>
                      <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <p>{totalFilteredTransfers} éléments · Page {transfersPage} / {Math.max(1, Math.ceil(totalFilteredTransfers / transfersPageSize))}</p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className={outlineOrangeButton}
                            disabled={transfersPage <= 1}
                            onClick={() => setTransfersPage((p) => Math.max(1, p - 1))}
                          >
                            Précédent
                          </Button>
                          <Button
                            variant="outline"
                            className={outlineOrangeButton}
                            disabled={transfersPage >= Math.ceil(totalFilteredTransfers / transfersPageSize)}
                            onClick={() => setTransfersPage((p) => p + 1)}
                          >
                            Suivant
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="exchanges" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle>Échanges de points</CardTitle>
                    <CardDescription>Conversions de points en monnaie.</CardDescription>
                  </div>
                  <div className="flex justify-end">
                    <Button variant="outline" className={outlineOrangeButton} onClick={exportPointsExchangesCSV}>
                      <FileText className="mr-2 h-4 w-4" />Exporter CSV
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="overflow-x-auto">
                    <div className="flex w-max min-w-full items-center gap-3 pb-2">
                      <Input
                        value={exchangesSearch}
                        onChange={(e) => { setExchangesSearch(e.target.value); setExchangesPage(1) }}
                        placeholder="Rechercher (monnaies)"
                        className="w-64"
                      />
                      <Input
                        type="date"
                        value={exchangesFromDate}
                        onChange={(e) => { setExchangesFromDate(e.target.value); setExchangesPage(1) }}
                        className="w-40"
                      />
                      <Input
                        type="date"
                        value={exchangesToDate}
                        onChange={(e) => { setExchangesToDate(e.target.value); setExchangesPage(1) }}
                        className="w-40"
                      />
                      <Select
                        value={String(exchangesPageSize)}
                        onValueChange={(v) => { setExchangesPageSize(Number(v)); setExchangesPage(1) }}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue placeholder="Taille" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="25">25</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {loading.points && (
                    <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500">
                      Chargement des échanges...
                    </div>
                  )}
                  {!loading.points && pointsExchanges.length === 0 && (
                    <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500">
                      Aucun échange référencé.
                    </div>
                  )}
                  {!loading.points && pointsExchanges.map((ex) => (
                    <div key={ex.id} className="rounded-xl border border-slate-200 p-4">
                      <div className="grid gap-3 md:grid-cols-5">
                        <div>
                          <p className="text-slate-500">Utilisateur</p>
                          <p className="font-semibold text-slate-800">{ex.userId}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Points</p>
                          <p className="font-semibold text-slate-800">{formatPointsCount(ex.pointsAmount)}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Converti</p>
                          <p className="font-semibold text-slate-800">{formatAmount(ex.convertedAmount)}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Frais</p>
                          <p className="font-semibold text-rose-600">{formatAmount(ex.feeAmount)}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Taux</p>
                          <p className="font-semibold text-slate-800">{ex.rate}</p>
                        </div>
                      </div>
                      <p className="mt-2 text-[11px] text-slate-500">Créé le {formatDateTime(ex.createdAt)}</p>
                    </div>
                  ))}
                  {!loading.points && pointsExchanges.length > 0 && (
                    <div className="mt-2 text-xs text-slate-500">
                      <p>
                        Total (filtré): {formatPointsCount(displayedExchangesTotals.points)} · converti {formatAmount(displayedExchangesTotals.converted)} · frais {formatAmount(displayedExchangesTotals.fee)}
                      </p>
                      <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <p>{totalFilteredExchanges} éléments · Page {exchangesPage} / {Math.max(1, Math.ceil(totalFilteredExchanges / exchangesPageSize))}</p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className={outlineOrangeButton}
                            disabled={exchangesPage <= 1}
                            onClick={() => setExchangesPage((p) => Math.max(1, p - 1))}
                          >
                            Précédent
                          </Button>
                          <Button
                            variant="outline"
                            className={outlineOrangeButton}
                            disabled={exchangesPage >= Math.ceil(totalFilteredExchanges / exchangesPageSize)}
                            onClick={() => setExchangesPage((p) => p + 1)}
                          >
                            Suivant
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="redemptions" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle>Rédemptions</CardTitle>
                    <CardDescription>Utilisation de points contre récompenses.</CardDescription>
                  </div>
                  <div className="flex justify-end">
                    <Button variant="outline" className={outlineOrangeButton} onClick={exportPointsRedemptionsCSV}>
                      <FileText className="mr-2 h-4 w-4" />Exporter CSV
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="overflow-x-auto">
                    <div className="flex w-max min-w-full items-center gap-3 pb-2">
                      <Input
                        value={redemptionsSearch}
                        onChange={(e) => { setRedemptionsSearch(e.target.value); setRedemptionsPage(1) }}
                        placeholder="Rechercher (UUID user/récompense)"
                        className="w-72"
                      />
                      <Select
                        value={String(redemptionsPageSize)}
                        onValueChange={(v) => { setRedemptionsPageSize(Number(v)); setRedemptionsPage(1) }}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue placeholder="Taille" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="25">25</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {loading.points && (
                    <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500">
                      Chargement des rédemptions...
                    </div>
                  )}
                  {!loading.points && pointsRedemptions.length === 0 && (
                    <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500">
                      Aucune rédemption référencée.
                    </div>
                  )}
                  {!loading.points && pointsRedemptions.map((r) => (
                    <div key={r.id} className="rounded-xl border border-slate-200 p-4">
                      <div className="grid gap-3 md:grid-cols-3">
                        <div>
                          <p className="text-slate-500">Utilisateur</p>
                          <p className="font-semibold text-slate-800">{r.userId}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Récompense</p>
                          <p className="font-semibold text-slate-800">{r.rewardId}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Points dépensés</p>
                          <p className="font-semibold text-slate-800">{formatPointsCount(r.pointsSpent)}</p>
                        </div>
                      </div>
                      <p className="mt-2 text-[11px] text-slate-500">Créé le {formatDateTime(r.createdAt)}</p>
                    </div>
                  ))}
                  {!loading.points && pointsRedemptions.length > 0 && (
                    <div className="mt-2 text-xs text-slate-500">
                      <p>
                        Total (filtré): {formatPointsCount(displayedRedemptionsTotal)}
                      </p>
                      <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <p>{totalFilteredRedemptions} éléments · Page {redemptionsPage} / {Math.max(1, Math.ceil(totalFilteredRedemptions / redemptionsPageSize))}</p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className={outlineOrangeButton}
                            disabled={redemptionsPage <= 1}
                            onClick={() => setRedemptionsPage((p) => Math.max(1, p - 1))}
                          >
                            Précédent
                          </Button>
                          <Button
                            variant="outline"
                            className={outlineOrangeButton}
                            disabled={redemptionsPage >= Math.ceil(totalFilteredRedemptions / redemptionsPageSize)}
                            onClick={() => setRedemptionsPage((p) => p + 1)}
                          >
                            Suivant
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Indicateurs globaux</CardTitle>
              <CardDescription>Lecture synthétique des performances et alertes.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-4">
              <div className="rounded-lg border border-slate-200 p-4">
                <p className="text-xs text-slate-500">Opérations traitées</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{analytics?.totalOperations ?? 0}</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-4">
                <p className="text-xs text-slate-500">Temps moyen de versement</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{analytics?.averagePayoutTime ?? 0} h</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-4">
                <p className="text-xs text-slate-500">Alertes fraude</p>
                <p className="mt-2 text-2xl font-semibold text-rose-600">{analytics?.fraudAlerts ?? 0}</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-4">
                <p className="text-xs text-slate-500">Tendance hebdo</p>
                <div className="mt-2 flex items-end gap-1">
                  {(analytics?.operationsTimeline ?? []).map((item) => (
                    <div key={item.label} className="flex-1">
                      <div
                        className="mx-auto w-3 rounded bg-orange-400"
                        style={{ height: `${Math.max(item.value, 5)}px` }}
                      />
                      <p className="mt-1 text-[10px] text-center text-slate-500">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-4 w-4 text-orange-500" />Flux consolidé
              </CardTitle>
              <CardDescription>Balance globale entre encaissements, décaissements et charges.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-4">
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                <p className="text-xs text-orange-700">Encaissements</p>
                <p className="mt-2 text-xl font-semibold text-orange-900">{formatAmount(cashSummary.incoming)}</p>
              </div>
              <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                <p className="text-xs text-purple-700">Paiements sortants</p>
                <p className="mt-2 text-xl font-semibold text-purple-900">{formatAmount(cashSummary.payouts)}</p>
              </div>
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
                <p className="text-xs text-rose-700">Charges</p>
                <p className="mt-2 text-xl font-semibold text-rose-900">{formatAmount(cashSummary.expenses)}</p>
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs text-emerald-700">Balance nette</p>
                <p className="mt-2 text-xl font-semibold text-emerald-900">{formatAmount(cashSummary.balance)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-4 w-4 text-orange-500" />Revenus par produit
              </CardTitle>
              <CardDescription>Détail des performances produits et marges.</CardDescription>
              <div className="mt-2 flex justify-end">
                <Button
                  variant="outline"
                  className={outlineOrangeButton}
                  onClick={exportProductRevenuesCSV}
                >
                  <Download className="mr-2 h-4 w-4" />Exporter
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {(analytics?.productRevenues ?? []).length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                  Aucune donnée disponible, connectez vos rapports produits.
                </div>
              )}

              {(analytics?.productRevenues ?? []).map((product) => (
                <div key={product.productId} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{product.productName}</p>
                      <p className="text-xs text-slate-500">ID produit {product.productId}</p>
                    </div>
                    <div className="grid gap-3 text-sm md:grid-cols-3">
                      <div>
                        <p className="text-xs text-slate-500">Chiffre d'affaires</p>
                        <p className="font-semibold text-slate-800">{formatAmount(product.totalRevenue)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Revenu net</p>
                        <p className="font-semibold text-slate-800">{formatAmount(product.netRevenue)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Commandes</p>
                        <p className="font-semibold text-slate-800">{product.orders}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-emerald-300 text-emerald-600">
                      Marge {product.marginRate}%
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenus par utilisateur</CardTitle>
              <CardDescription>Vue complète des utilisateurs générant le plus de revenus.</CardDescription>
              <div className="mt-2 flex justify-end">
                <Button
                  variant="outline"
                  className={outlineOrangeButton}
                  onClick={exportUserRevenuesCSV}
                >
                  <Download className="mr-2 h-4 w-4" />Exporter
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {(analytics?.userRevenues ?? []).length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                  Aucun utilisateur référencé. Importez vos rapports clients.
                </div>
              )}

              {(analytics?.userRevenues ?? []).map((user) => (
                <div key={user.userId} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{user.userName}</p>
                      <p className="text-xs text-slate-500">{user.userEmail}</p>
                      {user.lastPurchase && (
                        <p className="text-xs text-slate-500">Dernier achat : {user.lastPurchase}</p>
                      )}
                    </div>
                    <div className="grid gap-3 text-sm md:grid-cols-2">
                      <div>
                        <p className="text-xs text-slate-500">Total dépensé</p>
                        <p className="font-semibold text-slate-800">{formatAmount(user.totalSpent)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Commission générée</p>
                        <p className="font-semibold text-slate-800">{formatAmount(user.commissionGenerated)}</p>
                      </div>
                    </div>
                    <Button
                      className={outlineOrangeButton}
                      onClick={() => openInsightModalForUser(user.userId, user.userName)}
                    >
                      <Users className="mr-2 h-4 w-4" />Analyser
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Points forts & alertes</CardTitle>
              <CardDescription>Identification des meilleures performances et des axes de vigilance.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs text-emerald-700">Produit le plus performant</p>
                {topProduct ? (
                  <div className="mt-2 space-y-1 text-sm">
                    <p className="font-semibold text-emerald-900">{topProduct.productName}</p>
                    <p className="text-emerald-700">{formatAmount(topProduct.totalRevenue)} générés</p>
                    <p className="text-xs text-emerald-600">Marge {topProduct.marginRate}%</p>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-emerald-700">Aucun produit référencé.</p>
                )}
              </div>
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                <p className="text-xs text-orange-700">Utilisateur le plus contributeur</p>
                {topUser ? (
                  <div className="mt-2 space-y-1 text-sm">
                    <p className="font-semibold text-orange-900">{topUser.userName}</p>
                    <p className="text-orange-700">{formatAmount(topUser.totalSpent)} dépensés</p>
                    <p className="text-xs text-orange-600">Commissions générées : {formatAmount(topUser.commissionGenerated)}</p>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-orange-700">Aucun utilisateur comparé.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment-requests" className="space-y-6">
          <Tabs value={activePaymentRequestsTab} onValueChange={setActivePaymentRequestsTab} className="space-y-6">
            <div className="overflow-x-auto">
              <TabsList className="inline-flex w-max min-w-full gap-2 bg-transparent">
                <TabsTrigger value="requests">Demandes de paiement</TabsTrigger>
                <TabsTrigger value="scheduled">Programmations en cours</TabsTrigger>
                <TabsTrigger value="batches">Lots de paiements groupés</TabsTrigger>
                <TabsTrigger value="notifications">Notifications & reçus</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="requests" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle>Demandes de paiement</CardTitle>
                    <CardDescription>Approbations, programmations et paiements groupés.</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Input
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Rechercher un vendeur ou une référence"
                      className="w-56"
                    />
                    <Select
                      value={statusFilter}
                      onValueChange={(value) => setStatusFilter(value as 'all' | PaymentRequest['status'])}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="approved">Approuvées</SelectItem>
                        <SelectItem value="rejected">Rejetées</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      className={outlineOrangeButton}
                      onClick={exportPaymentRequestsCSV}
                    >
                      <FileText className="mr-2 h-4 w-4" />Exporter CSV
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loading.requests && (
                    <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                      Chargement des demandes en cours...
                    </div>
                  )}

                  {!loading.requests && filteredRequests.length === 0 && (
                    <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                      Aucune demande ne correspond à vos critères.
                    </div>
                  )}

                  {filteredRequests.map((request) => (
                    <div key={request.id} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-start gap-3">
                          <div className="rounded-full bg-slate-100 p-2">
                            <CreditCard className="h-4 w-4 text-slate-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{request.vendorName}</p>
                            <p className="text-xs text-slate-500">Réf. {request.id} · {request.ordersCount} commandes</p>
                            <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                              <Badge variant="secondary">{paymentMethodLabel(request.paymentMethod)}</Badge>
                              <Badge variant={badgeVariant(request.status)}>{statusLabel(request.status)}</Badge>
                              <Badge variant="outline" className="border-orange-300 text-orange-600">
                                {executionLabel(request.executionType)}
                              </Badge>
                            </div>
                            {request.user && (
                              <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                                <p className="font-semibold text-slate-700">Utilisateur</p>
                                <p>{request.user.fullName}</p>
                                <p>{request.user.email}</p>
                                {request.user.phone && <p>{request.user.phone}</p>}
                                {request.user.country && <p>{request.user.country}</p>}
                                {request.user.company && <p>Entreprise : {request.user.company}</p>}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
                          <div>
                            <p className="text-xs text-slate-500">Montant brut</p>
                            <p className="font-semibold text-slate-800">{formatAmount(request.totalAmount)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Commission</p>
                            <p className="font-semibold text-rose-600">{formatAmount(request.commissionAmount)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Montant net</p>
                            <p className="font-semibold text-emerald-600">{formatAmount(request.netAmount)}</p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 md:w-64">
                          <Button
                            variant="outline"
                            className={outlineOrangeButton}
                            onClick={() => {
                              setSelectedRequest(request)
                              setIsDetailsOpen(true)
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />Voir les détails
                          </Button>
                          {request.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button className={`${solidOrangeButton} flex-1`} onClick={() => approveRequest(request.id)}>
                                <CheckCircle className="mr-2 h-4 w-4" />Approuver
                              </Button>
                              <Button
                                variant="destructive"
                                className={`${solidOrangeButton} flex-1 bg-orange-600 hover:bg-orange-700`}
                                onClick={() => openRejectionModal(request)}
                              >
                                <XCircle className="mr-2 h-4 w-4" />Rejeter
                              </Button>
                            </div>
                          )}
                          <div className="grid gap-2 md:grid-cols-2">
                            <Button
                              className={subtleOrangeButton}
                              onClick={() => {
                                setSelectedScheduleRequest(request)
                                setScheduleDate(request.scheduleDate || '')
                                setScheduleWindow(request.payoutWindow || '')
                                setIsScheduleModalOpen(true)
                              }}
                            >
                              <Calendar className="mr-2 h-4 w-4" />Programmer
                            </Button>
                            <Button
                              className={outlineOrangeButton}
                              onClick={() => {
                                setBatchTargetRequest(request)
                                setSelectedBatchId('')
                                setBatchLabel('')
                                setIsBatchModalOpen(true)
                              }}
                            >
                              <Layers className="mr-2 h-4 w-4" />Ajouter au lot
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="scheduled" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Programmations en cours</CardTitle>
                  <CardDescription>Virements différés, avec fenêtres de validation.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {loading.scheduled && (
                    <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500">
                      Chargement des programmations...
                    </div>
                  )}

                  {!loading.scheduled && paymentSchedulesError && (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
                      {paymentSchedulesError}
                    </div>
                  )}

                  {!loading.scheduled && scheduledPayouts.length === 0 && paymentSchedules.length === 0 && (
                    <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500">
                      Aucun paiement programmé.
                    </div>
                  )}

                  {!loading.scheduled && paymentSchedules.length === 0 && scheduledPayouts.length > 0 && (
                    <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500">
                      Aucune planification vendeur (finance_payment_schedules).
                    </div>
                  )}

                  {scheduledPayouts.map((request) => (
                    <div key={request.id} className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                      <p className="text-xs font-semibold text-orange-900">{request.vendorName}</p>
                      <p className="text-xs text-orange-700">Exécution prévue le {request.scheduleDate}</p>
                      {request.payoutWindow && <p className="text-[11px] text-orange-600">Fenêtre : {request.payoutWindow}</p>}
                      <div className="mt-2 flex gap-2">
                        <Button
                          size="sm"
                          className={outlineOrangeButton}
                          onClick={() => {
                            setSelectedRequest(request)
                            setIsDetailsOpen(true)
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />Inspecter
                        </Button>
                        <Button
                          size="sm"
                          className={solidOrangeButton}
                          onClick={() => {
                            setSelectedScheduleRequest(request)
                            setScheduleDate(request.scheduleDate || '')
                            setScheduleWindow(request.payoutWindow || '')
                            setIsScheduleModalOpen(true)
                          }}
                        >
                          <Calendar className="mr-2 h-4 w-4" />Réajuster
                        </Button>
                      </div>
                    </div>
                  ))}

                  {paymentSchedules.map((s) => (
                    <div key={s.id} className="rounded-lg border border-slate-200 bg-white p-3">
                      <p className="text-xs font-semibold text-slate-900">Vendeur: {s.vendorId}</p>
                      <p className="text-xs text-slate-600">Commande: {s.orderId} · Client: {s.customerName}</p>
                      <p className="text-xs text-slate-600">Échéance: {s.dueDate} · Montant: {formatAmount(Number(s.amount || 0))}</p>
                      <p className="text-[11px] text-slate-500">Priorité: {s.priority} · Statut: {s.status}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="batches" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Lots de paiements groupés</CardTitle>
                  <CardDescription>Orchestration multi-vendeurs par campagne.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {loading.batches && (
                    <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500">
                      Chargement des lots...
                    </div>
                  )}

                  {!loading.batches && paymentBatches.length === 0 && (
                    <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500">
                      Aucun lot défini.
                    </div>
                  )}

                  {paymentBatches.map((batch) => (
                    <div key={batch.id} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{batch.label}</p>
                          <p className="text-xs text-slate-500">Lot #{batch.id}</p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`border ${
                            batch.status === 'completed'
                              ? 'border-emerald-300 text-emerald-600'
                              : batch.status === 'processing'
                              ? 'border-blue-300 text-blue-600'
                              : 'border-amber-300 text-amber-600'
                          }`}
                        >
                          {batch.status === 'completed' && 'Terminé'}
                          {batch.status === 'processing' && 'En cours'}
                          {batch.status === 'pending' && 'En attente'}
                        </Badge>
                      </div>
                      <div className="mt-3 grid gap-3 text-xs md:grid-cols-2">
                        <div>
                          <p className="text-slate-500">Montant total</p>
                          <p className="font-semibold text-slate-800">{formatAmount(batch.totalAmount)}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Demandes incluses</p>
                          <p className="font-semibold text-slate-800">{batch.requests.length}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          className={outlineOrangeButton}
                          onClick={() => exportBatchCSV(batch)}
                        >
                          <FileText className="mr-2 h-4 w-4" />Exporter
                        </Button>
                        <Button
                          size="sm"
                          className={solidOrangeButton}
                          onClick={() => executeBatch(batch.id)}
                        >
                          <Layers className="mr-2 h-4 w-4" />Exécuter
                        </Button>
                      </div>
                      <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs">
                        <p className="font-semibold text-slate-700">Demandes concernées</p>
                        <div className="mt-2 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                          {batch.requests.map((request) => (
                            <div key={request.id} className="rounded border border-slate-200 bg-white p-2">
                              <p className="font-semibold text-slate-800">{request.vendorName}</p>
                              <p className="text-slate-500">Réf. {request.id}</p>
                              <p className="text-slate-500">Net {formatAmount(request.netAmount)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notifications & reçus</CardTitle>
                  <CardDescription>Communication automatique avec les vendeurs.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <Button
                    className={`${outlineOrangeButton} w-full justify-start`}
                    onClick={handleGenerateInvoice}
                  >
                    <Receipt className="mr-2 h-4 w-4" />Générer facture
                  </Button>
                  <Button
                    className={`${outlineOrangeButton} w-full justify-start`}
                    onClick={handleNotifyVendors}
                  >
                    <Mail className="mr-2 h-4 w-4" />Notifier les vendeurs
                  </Button>
                  <Button
                    className={`${outlineOrangeButton} w-full justify-start`}
                    onClick={handleValidationAlert}
                  >
                    <Siren className="mr-2 h-4 w-4" />Alerte validation
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Transactions vendeurs</CardTitle>
                <CardDescription>Suivi complet des ventes et commissions prélevées.</CardDescription>
              </div>
              <div className="flex flex-wrap gap-3">
                <Input
                  value={transactionSearch}
                  onChange={(event) => setTransactionSearch(event.target.value)}
                  placeholder="Rechercher un vendeur ou une commande"
                  className="w-60"
                />
                <Select
                  value={transactionStatusFilter}
                  onValueChange={(value) => setTransactionStatusFilter(value as 'all' | TransactionEntry['status'])}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="paid">Payées</SelectItem>
                    <SelectItem value="processing">En traitement</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  className={outlineOrangeButton}
                  onClick={exportTransactionsCSV}
                >
                  <Download className="mr-2 h-4 w-4" />Exporter
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-xs text-slate-500">Ventes brutes</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">{formatAmount(transactionSummary.totalGross)}</p>
                </div>
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-xs text-slate-500">Commission prélevée</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">{formatAmount(transactionSummary.totalCommission)}</p>
                </div>
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-xs text-slate-500">Net reversé</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">{formatAmount(transactionSummary.totalNet)}</p>
                </div>
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-xs text-slate-500">Vendeurs concernés</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">{transactionSummary.vendorCount}</p>
                  <div className="mt-2 flex gap-2 text-[11px] text-slate-500">
                    <span className="rounded-full bg-emerald-100 px-2 py-1">{transactionSummary.statusCount.paid} payées</span>
                    <span className="rounded-full bg-amber-100 px-2 py-1">{transactionSummary.statusCount.processing} en cours</span>
                    <span className="rounded-full bg-slate-100 px-2 py-1">{transactionSummary.statusCount.pending} en attente</span>
                  </div>
                </div>
              </div>

              {loading.transactions && (
                <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                  Chargement des transactions...
                </div>
              )}

              {!loading.transactions && filteredTransactions.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                  Aucune transaction ne correspond à vos critères.
                </div>
              )}

              {filteredTransactions.map((transaction) => (
                <div key={transaction.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{transaction.vendorName}</p>
                      <p className="text-xs text-slate-500">Commande #{transaction.orderId}</p>
                      <p className="text-xs text-slate-500">{transaction.occurredAt}</p>
                    </div>
                    <div className="grid gap-3 text-sm md:grid-cols-3">
                      <div>
                        <p className="text-xs text-slate-500">Montant brut</p>
                        <p className="font-semibold text-slate-800">{formatAmount(transaction.grossAmount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Commission</p>
                        <p className="font-semibold text-slate-800">{formatAmount(transaction.commissionTaken)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Net vendeur</p>
                        <p className="font-semibold text-emerald-600">{formatAmount(transaction.netAmount)}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={`border ${
                      transaction.status === 'paid'
                        ? 'border-emerald-300 text-emerald-700'
                        : transaction.status === 'processing'
                        ? 'border-amber-300 text-amber-600'
                        : 'border-slate-300 text-slate-600'
                    }`}>
                      {transaction.status === 'paid' && 'Payée'}
                      {transaction.status === 'processing' && 'En traitement'}
                      {transaction.status === 'pending' && 'En attente'}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="refunds" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Remboursements & litiges</CardTitle>
                <CardDescription>Impact des remboursements sur les soldes vendeurs et commissions.</CardDescription>
              </div>
              <div className="flex flex-wrap gap-3">
                <Select
                  value={refundStatusFilter}
                  onValueChange={(value) => setRefundStatusFilter(value as 'all' | RefundCase['status'])}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="requested">Demandés</SelectItem>
                    <SelectItem value="processing">En traitement</SelectItem>
                    <SelectItem value="resolved">Résolus</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  className={`${outlineOrangeButton} text-white hover:text-white [&_svg]:text-white`}
                  onClick={exportRefundsCSV}
                >
                  <Download className="mr-2 h-4 w-4" />Exporter
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-xs text-slate-500">Montant remboursé</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">{formatAmount(refundSummary.totalAmount)}</p>
                </div>
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-xs text-slate-500">Ajustement de commission</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">{formatAmount(refundSummary.totalAdjustment)}</p>
                </div>
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-xs text-slate-500">Demandes ouvertes</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">{refundSummary.statusCount.requested}</p>
                </div>
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-xs text-slate-500">Résolutions</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">{refundSummary.statusCount.resolved}</p>
                </div>
              </div>

              {loading.refunds && (
                <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                  Chargement des remboursements...
                </div>
              )}

              {!loading.refunds && filteredRefunds.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                  Aucun remboursement trouvé.
                </div>
              )}

              {filteredRefunds.map((refund) => (
                <div key={refund.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{refund.vendorName}</p>
                      <p className="text-xs text-slate-500">Commande #{refund.orderId}</p>
                      <p className="text-xs text-slate-500">Client {refund.customerEmail}</p>
                    </div>
                    <div className="grid gap-3 text-sm md:grid-cols-3">
                      <div>
                        <p className="text-xs text-slate-500">Montant remboursé</p>
                        <p className="font-semibold text-slate-800">{formatAmount(refund.amount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Commission ajustée</p>
                        <p className="font-semibold text-slate-800">{formatAmount(refund.commissionAdjustment)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Ouvert le</p>
                        <p className="font-semibold text-slate-800">{refund.openedAt}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`border ${
                        refund.status === 'resolved'
                          ? 'border-emerald-300 text-emerald-700'
                          : refund.status === 'processing'
                          ? 'border-amber-300 text-amber-600'
                          : 'border-rose-300 text-rose-600'
                      }`}>
                        {refund.status === 'resolved' && 'Résolu'}
                        {refund.status === 'processing' && 'En traitement'}
                        {refund.status === 'requested' && 'Demandé'}
                      </Badge>
                      <Button
                        size="sm"
                        className={outlineOrangeButton}
                        onClick={() => {
                          setSelectedRefund(refund)
                          setRefundResolutionNotes(refund.resolutionNotes ?? '')
                          setIsRefundModalOpen(true)
                        }}
                      >
                        <FileText className="mr-2 h-4 w-4" />Tracer
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cashflow" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Historique des flux financiers</CardTitle>
              <CardDescription>Mouvements entrants et sortants enregistrés.</CardDescription>
              <div className="mt-2 flex justify-end">
                <Button
                  variant="outline"
                  className={outlineOrangeButton}
                  onClick={exportCashFlowCSV}
                >
                  <Download className="mr-2 h-4 w-4" />Exporter
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading.cash && (
                <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                  Chargement des flux...
                </div>
              )}

              {!loading.cash && cashFlows.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                  Aucun flux enregistré pour la période sélectionnée.
                </div>
              )}

              {cashFlows.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`rounded-full p-2 ${
                        entry.direction === 'in'
                          ? 'bg-emerald-100 text-emerald-700'
                          : entry.category === 'payout'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {entry.direction === 'in' && <ArrowUpRight className="h-4 w-4" />}
                      {entry.direction === 'out' && entry.category === 'payout' && <ArrowDownRight className="h-4 w-4" />}
                      {entry.category === 'expense' && <History className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{entry.label}</p>
                      <p className="text-xs text-slate-500">{entry.occurredAt}</p>
                    </div>
                  </div>
                  <p
                    className={`text-sm font-semibold ${
                      entry.direction === 'in'
                        ? 'text-emerald-700'
                        : entry.category === 'payout'
                        ? 'text-purple-700'
                        : 'text-rose-700'
                    }`}
                  >
                    {entry.direction === 'in' ? '+' : '-'} {formatAmount(entry.amount)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vendeurs sous surveillance</CardTitle>
              <CardDescription>Focus sur les partenaires à risque financier.</CardDescription>
              <div className="mt-2 flex justify-end">
                <Button
                  variant="outline"
                  className={outlineOrangeButton}
                  onClick={exportVendorMetricsCSV}
                >
                  <Download className="mr-2 h-4 w-4" />Exporter
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              {loading.vendors && (
                <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                  Chargement des indicateurs vendeurs...
                </div>
              )}

              {!loading.vendors && vendorMetrics.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                  Aucun vendeur critique détecté.
                </div>
              )}

              {vendorMetrics.map((vendor) => (
                <div key={vendor.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{vendor.vendorName}</p>
                      {vendor.lastPayout && (
                        <p className="text-xs text-slate-500">Dernier virement : {vendor.lastPayout}</p>
                      )}
                    </div>
                    <Building2 className="h-5 w-5 text-slate-400" />
                  </div>
                  <dl className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-slate-500">À régler</dt>
                      <dd className="font-semibold text-amber-700">{formatAmount(vendor.pendingAmount)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Versé</dt>
                      <dd className="font-semibold text-emerald-700">{formatAmount(vendor.paidAmount)}</dd>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Score risque</span>
                      <span>{vendor.riskScore}%</span>
                    </div>
                  </dl>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Paramétrage financier avancé</CardTitle>
              <CardDescription>Gérez les cycles de versement, commissions différenciées et remboursements.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="payout" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 gap-2 bg-transparent">
                  <TabsTrigger value="payout">Paramètres généraux</TabsTrigger>
                  <TabsTrigger value="commissions">Commissions vendeurs</TabsTrigger>
                  <TabsTrigger value="refund-settings">Remboursements</TabsTrigger>
                </TabsList>

                <TabsContent value="payout" className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border border-slate-200 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">Paiements automatiques</p>
                          <p className="text-xs text-slate-500">Déclencher les virements dès que le seuil est atteint.</p>
                        </div>
                        <Switch
                          checked={settingsDraft.autoPayout}
                          onCheckedChange={(value) => handleSettingsChange('autoPayout', value)}
                        />
                      </div>
                      <div className="mt-3 space-y-2">
                        <Label htmlFor="minimum-threshold">Seuil minimum</Label>
                        <Input
                          id="minimum-threshold"
                          value={settingsDraft.minimumThreshold.toString()}
                          onChange={(event) => handleSettingsChange('minimumThreshold', Number(event.target.value.replace(/\D/g, '')))}
                          placeholder="Montant en devise courante"
                        />
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 p-4">
                      <p className="text-sm font-semibold text-slate-800">Fenêtre de validation</p>
                      <p className="text-xs text-slate-500">Planification des cycles de revue et paiements.</p>
                      <div className="mt-3 space-y-3">
                        <div>
                          <Label>Jour principal</Label>
                          <Select
                            value={settingsDraft.primaryValidationDay}
                            onValueChange={(value) => handleSettingsChange('primaryValidationDay', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {validationDays.map((day) => (
                                <SelectItem key={day} value={day}>
                                  {day.charAt(0).toUpperCase() + day.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Jour de rattrapage</Label>
                          <Select
                            value={settingsDraft.backupValidationDay}
                            onValueChange={(value) => handleSettingsChange('backupValidationDay', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {validationDays.map((day) => (
                                <SelectItem key={day} value={day}>
                                  {day.charAt(0).toUpperCase() + day.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 p-4">
                    <p className="text-sm font-semibold text-slate-800">Notes internes</p>
                    <p className="text-xs text-slate-500">Instructions ou points d'attention pour l'équipe finance.</p>
                    <Textarea
                      className="mt-3"
                      rows={4}
                      value={settingsDraft.internalNotes}
                      onChange={(event) => handleSettingsChange('internalNotes', event.target.value)}
                    />
                  </div>

                  <div className="rounded-lg border border-slate-200 p-4">
                    <p className="text-sm font-semibold text-slate-800">Paramètres e-mail</p>
                    <p className="text-xs text-slate-500">Destinataires et préfixe de sujet pour les envois par mailto.</p>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <div>
                        <Label>Mode de destinataires</Label>
                        <Select
                          value={emailSettings.recipientMode}
                          onValueChange={(value) =>
                            setEmailSettings((prev) => ({ ...prev, recipientMode: value as 'all' | 'user' | 'group' | 'custom' }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tous les utilisateurs</SelectItem>
                            <SelectItem value="user">Un utilisateur</SelectItem>
                            <SelectItem value="group">Groupe (liste d'emails)</SelectItem>
                            <SelectItem value="custom">Personnalisé (champ To)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {emailSettings.recipientMode === 'user' && (
                        <div>
                          <Label>Utilisateur</Label>
                          <Select
                            value={emailSettings.selectedUserId ?? ''}
                            onValueChange={(value) => setEmailSettings((prev) => ({ ...prev, selectedUserId: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Choisir un utilisateur" />
                            </SelectTrigger>
                            <SelectContent>
                              {(analytics?.userRevenues ?? []).map((u) => (
                                <SelectItem key={u.userId} value={u.userId}>
                                  {u.userName || u.userEmail}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      {emailSettings.recipientMode === 'group' && (
                        <>
                          <div>
                            <Label>Segment back office (optionnel)</Label>
                            <Select
                              value={selectedSegmentId ?? ''}
                              onValueChange={(value) => setSelectedSegmentId(value || null)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Choisir un segment" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">Aucun</SelectItem>
                                {segments.map((s) => (
                                  <SelectItem key={s.id} value={s.id}>
                                    {s.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="md:col-span-2">
                            <Label>Emails du groupe (séparés par virgule/point-virgule)</Label>
                            <Input
                              value={emailSettings.groupEmails}
                              onChange={(e) => setEmailSettings((prev) => ({ ...prev, groupEmails: e.target.value }))}
                              placeholder="user1@exemple.com, user2@exemple.com"
                            />
                          </div>
                        </>
                      )}
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <div>
                        <Label>À (To)</Label>
                        <Input
                          value={emailSettings.to}
                          onChange={(e) => setEmailSettings((prev) => ({ ...prev, to: e.target.value }))}
                          placeholder="finance@votreentreprise.com"
                          disabled={emailSettings.recipientMode !== 'custom'}
                        />
                      </div>
                      <div>
                        <Label>Copie (CC)</Label>
                        <Input
                          value={emailSettings.cc}
                          onChange={(e) => setEmailSettings((prev) => ({ ...prev, cc: e.target.value }))}
                          placeholder="ops@votreentreprise.com"
                        />
                      </div>
                      <div>
                        <Label>Copie cachée (BCC)</Label>
                        <Input
                          value={emailSettings.bcc}
                          onChange={(e) => setEmailSettings((prev) => ({ ...prev, bcc: e.target.value }))}
                          placeholder="direction@votreentreprise.com"
                        />
                      </div>
                      <div>
                        <Label>Préfixe sujet</Label>
                        <Input
                          value={emailSettings.subjectPrefix}
                          onChange={(e) => setEmailSettings((prev) => ({ ...prev, subjectPrefix: e.target.value }))}
                          placeholder="[Paiements]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button className={solidOrangeButton} onClick={saveSettings}>
                      Sauvegarder les paramètres
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="commissions" className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Règles existantes</p>
                      <p className="text-xs text-slate-500">Ajustez des commissions par vendeur ou groupe.</p>
                    </div>
                    <Button className={solidOrangeButton} onClick={() => setIsCommissionModalOpen(true)}>
                      <Percent className="mr-2 h-4 w-4" />Nouvelle règle
                    </Button>
                  </div>

                  {loading.commissions && (
                    <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                      Chargement des règles de commission...
                    </div>
                  )}

                  {!loading.commissions && commissionRules.length === 0 && (
                    <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                      Aucune règle définie. Créez votre première politique de commission.
                    </div>
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                    {commissionRules.map((rule) => (
                      <div key={rule.id} className="rounded-xl border border-slate-200 p-4 text-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {rule.scope === 'vendor' && `Vendeur spécifique`}
                              {rule.scope === 'group' && `Groupe ${rule.groupName}`}
                              {rule.scope === 'global' && 'Politique globale'}
                            </p>
                            <p className="text-xs text-slate-500">Mise à jour {rule.updatedAt}</p>
                          </div>
                          <Badge variant="outline" className="border-orange-300 text-orange-600">
                            {rule.scope}
                          </Badge>
                        </div>
                        <div className="mt-3 grid gap-3 text-xs md:grid-cols-2">
                          {rule.basePercent !== undefined && (
                            <div>
                              <p className="text-slate-500">Commission (%)</p>
                              <p className="font-semibold text-slate-800">{rule.basePercent}%</p>
                            </div>
                          )}
                          {rule.baseAmount !== undefined && (
                            <div>
                              <p className="text-slate-500">Commission fixe</p>
                              <p className="font-semibold text-slate-800">{formatAmount(rule.baseAmount)}</p>
                            </div>
                          )}
                          {rule.hybridPercent !== undefined && (
                            <div>
                              <p className="text-slate-500">Part variable</p>
                              <p className="font-semibold text-slate-800">{rule.hybridPercent}% + {formatAmount(rule.hybridAmount ?? 0)}</p>
                            </div>
                          )}
                        </div>
                        {rule.promotions && rule.promotions.length > 0 && (
                          <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs">
                            <p className="font-semibold text-slate-700">Promotions actives</p>
                            <div className="mt-2 space-y-2">
                              {rule.promotions.map((promo) => (
                                <div key={promo.id} className="flex items-center justify-between">
                                  <span>{promo.label}</span>
                                  <span className="text-slate-500">
                                    {promo.reductionPercent ? `-${promo.reductionPercent}%` : ''}
                                    {promo.reductionAmount ? ` ${formatAmount(promo.reductionAmount)}` : ''}
                                  </span>
                                  <span className="text-[11px] text-slate-400">
                                    {promo.startDate} → {promo.endDate}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="mt-4 flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className={outlineOrangeButton}
                            onClick={() => {
                              setCommissionDraft(rule)
                              setIsCommissionModalOpen(true)
                            }}
                          >
                            Modifier
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className={outlineOrangeButton}
                            onClick={() => exportCommissionRuleJSON(rule)}
                          >
                            Exporter
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">Top commissions par vendeur</p>
                        <p className="text-xs text-slate-500">Vue consolidée des montants collectés et net reversé.</p>
                      </div>
                      <Button
                        variant="outline"
                        className={outlineOrangeButton}
                        onClick={exportCommissionInsightsCSV}
                      >
                        <Download className="mr-2 h-4 w-4" />Exporter
                      </Button>
                    </div>
                    <div className="mt-4 space-y-3">
                      {vendorCommissionInsights.slice(0, 8).map((insight) => (
                        <div
                          key={insight.vendorId}
                          className="grid gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs md:grid-cols-[1.5fr_repeat(4,1fr)]"
                        >
                          <div>
                            <p className="font-semibold text-slate-800">{insight.vendorName}</p>
                            <p className="text-slate-500">{insight.operations} opérations</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Commission</p>
                            <p className="font-semibold text-slate-900">{formatAmount(insight.totalCommission)}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Ventes brutes</p>
                            <p className="font-semibold text-slate-900">{formatAmount(insight.totalGross)}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Net versé</p>
                            <p className="font-semibold text-emerald-600">{formatAmount(insight.totalNet)}</p>
                          </div>
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              className={outlineOrangeButton}
                              onClick={() => openInsightModalForVendor(insight.vendorId, insight.vendorName)}
                            >
                              Détails
                            </Button>
                          </div>
                        </div>
                      ))}

                      {vendorCommissionInsights.length === 0 && !loading.transactions && (
                        <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                          Aucune transaction disponible pour établir le classement.
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="refund-settings" className="space-y-6">
                  <div className="rounded-lg border border-slate-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">Ajustement automatique</p>
                        <p className="text-xs text-slate-500">Soustraire automatiquement la commission lors d'un remboursement.</p>
                      </div>
                      <Switch
                        checked={refundSettings.autoAdjustCommission}
                        onCheckedChange={(value) => setRefundSettings((prev) => ({ ...prev, autoAdjustCommission: value }))}
                      />
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">Notifications vendeurs</p>
                        <p className="text-xs text-slate-500">Informer automatiquement les vendeurs des remboursements traités.</p>
                      </div>
                      <Switch
                        checked={refundSettings.notifyVendor}
                        onCheckedChange={(value) => setRefundSettings((prev) => ({ ...prev, notifyVendor: value }))}
                      />
                    </div>
                    <div className="mt-3 space-y-2">
                      <Label htmlFor="escalation-email">Email d'escalade</Label>
                      <Input
                        id="escalation-email"
                        value={refundSettings.escalationEmail}
                        onChange={(event) => setRefundSettings((prev) => ({ ...prev, escalationEmail: event.target.value }))}
                        placeholder="finance@votreentreprise.com"
                      />
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 p-4">
                    <p className="text-sm font-semibold text-slate-800">Fenêtre de résolution</p>
                    <p className="text-xs text-slate-500">Nombre de jours autorisés pour régler un litige.</p>
                    <Input
                      className="mt-3"
                      type="number"
                      value={refundSettings.resolutionWindow}
                      onChange={(event) =>
                        setRefundSettings((prev) => ({ ...prev, resolutionWindow: Number(event.target.value) || 0 }))
                      }
                      min={0}
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      className={outlineOrangeButton}
                      onClick={() => setRefundSettings(defaultRefundSettings)}
                    >
                      Réinitialiser
                    </Button>
                    <Button
                      className={solidOrangeButton}
                      onClick={saveRefundSettings}
                    >
                      Sauvegarder
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isDetailsOpen && !!selectedRequest} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Détails de la demande</DialogTitle>
            <DialogDescription>Informations complètes pour la validation.</DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-200 p-4">
                <p className="text-sm font-semibold text-slate-900">{selectedRequest.vendorName}</p>
                <p className="text-xs text-slate-500">Référence {selectedRequest.id}</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="text-xs text-slate-500">Montant brut</p>
                  <p className="text-lg font-semibold text-slate-900">{formatAmount(selectedRequest.totalAmount)}</p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="text-xs text-slate-500">Commission</p>
                  <p className="text-lg font-semibold text-rose-600">{formatAmount(selectedRequest.commissionAmount)}</p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="text-xs text-slate-500">Montant net</p>
                  <p className="text-lg font-semibold text-emerald-600">{formatAmount(selectedRequest.netAmount)}</p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="text-xs text-slate-500">Demandé le</p>
                  <p className="text-lg font-semibold text-slate-900">{selectedRequest.createdAt}</p>
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 p-3 text-sm text-slate-600">
                <p className="font-semibold text-slate-800">Méthode de paiement</p>
                <p>{paymentMethodLabel(selectedRequest.paymentMethod)}</p>
                {formatBankDetails(selectedRequest.bankDetails) && <p>{formatBankDetails(selectedRequest.bankDetails)}</p>}
                {selectedRequest.mobileNumber && <p>Mobile: {selectedRequest.mobileNumber}</p>}
                {selectedRequest.notes && <p className="mt-2 text-xs text-slate-500">Notes : {selectedRequest.notes}</p>}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-slate-200 p-3 text-xs text-slate-600">
                  <p className="font-semibold text-slate-800">Trajectoire</p>
                  <p>{executionLabel(selectedRequest.executionType)}</p>
                  {selectedRequest.scheduleDate && <p>Programmation : {selectedRequest.scheduleDate}</p>}
                  {selectedRequest.payoutWindow && <p>Fenêtre : {selectedRequest.payoutWindow}</p>}
                  {selectedRequest.batchId && <p>Lot associé : {selectedRequest.batchId}</p>}
                </div>
                {selectedRequest.user && (
                  <div className="rounded-lg border border-slate-200 p-3 text-xs text-slate-600">
                    <p className="font-semibold text-slate-800">Profil utilisateur payé</p>
                    <p>{selectedRequest.user.fullName}</p>
                    <p>{selectedRequest.user.email}</p>
                    {selectedRequest.user.phone && <p>{selectedRequest.user.phone}</p>}
                    {selectedRequest.user.country && <p>{selectedRequest.user.country}</p>}
                    {selectedRequest.user.company && <p>Entreprise : {selectedRequest.user.company}</p>}
                  </div>
                )}
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-sm font-semibold text-slate-800">Historique et traçabilité</p>
                <p className="text-xs text-slate-500">Chaque étape est horodatée pour audit interne.</p>
                <ol className="mt-3 space-y-2">
                  {(selectedRequest.timeline ?? []).length === 0 && (
                    <li className="rounded border border-dashed border-slate-300 p-3 text-xs text-slate-500">
                      Aucune action enregistrée sur cette demande pour le moment.
                    </li>
                  )}
                  {(selectedRequest.timeline ?? []).map((event) => (
                    <li key={event.id} className="rounded border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800">{event.label}</span>
                        <span>{event.occurredAt}</span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500">Par {event.actor}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              className={outlineOrangeButton}
              onClick={() => setIsDetailsOpen(false)}
            >
              Fermer
            </Button>
            {selectedRequest && (
              <Button
                variant="outline"
                className={outlineOrangeButton}
                onClick={() => selectedRequest && exportRequestTraceCSV(selectedRequest)}
              >
                <FileText className="mr-2 h-4 w-4" />Exporter la trace
              </Button>
            )}
            {selectedRequest?.status === 'pending' && (
              <Button className={solidOrangeButton} onClick={() => selectedRequest && approveRequest(selectedRequest.id)}>
                <CheckCircle className="mr-2 h-4 w-4" />Approuver
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCommissionModalOpen} onOpenChange={setIsCommissionModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{commissionDraft.id ? 'Modifier la règle' : 'Nouvelle règle de commission'}</DialogTitle>
            <DialogDescription>Définissez la portée et la structure de commission.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            {commissionModalError && (
              <div className="rounded border border-red-200 bg-red-50 p-3 text-xs text-red-600">{commissionModalError}</div>
            )}
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label>Portée</Label>
                <Select
                  value={commissionDraft.scope}
                  onValueChange={(value) => setCommissionDraft((prev) => ({ ...prev, scope: value as CommissionRule['scope'] }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">Globale</SelectItem>
                    <SelectItem value="vendor">Vendeur</SelectItem>
                    <SelectItem value="group">Groupe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {commissionDraft.scope === 'vendor' && (
                <div>
                  <Label>Identifiant vendeur</Label>
                  <Input
                    value={commissionDraft.vendorId ?? ''}
                    onChange={(event) => setCommissionDraft((prev) => ({ ...prev, vendorId: event.target.value }))}
                    placeholder="ID vendeur"
                  />
                </div>
              )}
              {commissionDraft.scope === 'group' && (
                <div>
                  <Label>Nom du groupe</Label>
                  <Input
                    value={commissionDraft.groupName ?? ''}
                    onChange={(event) => setCommissionDraft((prev) => ({ ...prev, groupName: event.target.value }))}
                    placeholder="Ex. Premium"
                  />
                </div>
              )}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label>Taux de base (%)</Label>
                <Input
                  type="number"
                  value={commissionDraft.basePercent ?? ''}
                  onChange={(event) =>
                    setCommissionDraft((prev) => ({ ...prev, basePercent: Number(event.target.value) || undefined }))
                  }
                  placeholder="Ex. 12"
                />
              </div>
              <div>
                <Label>Montant fixe</Label>
                <Input
                  type="number"
                  value={commissionDraft.baseAmount ?? ''}
                  onChange={(event) =>
                    setCommissionDraft((prev) => ({ ...prev, baseAmount: Number(event.target.value) || undefined }))
                  }
                  placeholder="Ex. 1500"
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label>Hybride (%)</Label>
                <Input
                  type="number"
                  value={commissionDraft.hybridPercent ?? ''}
                  onChange={(event) =>
                    setCommissionDraft((prev) => ({ ...prev, hybridPercent: Number(event.target.value) || undefined }))
                  }
                  placeholder="Ex. 5"
                />
              </div>
              <div>
                <Label>Hybride (montant)</Label>
                <Input
                  type="number"
                  value={commissionDraft.hybridAmount ?? ''}
                  onChange={(event) =>
                    setCommissionDraft((prev) => ({ ...prev, hybridAmount: Number(event.target.value) || undefined }))
                  }
                  placeholder="Ex. 1000"
                />
              </div>
            </div>

            <Textarea
              rows={3}
              placeholder="Promotions (JSON) ou remarques"
              value={commissionDraft.promotions ? JSON.stringify(commissionDraft.promotions, null, 2) : ''}
              onChange={(event) => {
                try {
                  const parsed = JSON.parse(event.target.value)
                  if (Array.isArray(parsed)) {
                    setCommissionDraft((prev) => ({ ...prev, promotions: parsed }))
                    setCommissionModalError(null)
                  }
                } catch {
                  setCommissionModalError('Format de promotions invalide (JSON attendu).')
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCommissionModalOpen(false)}>
              Annuler
            </Button>
            <Button className={solidOrangeButton} onClick={upsertCommissionRule}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRefundModalOpen && !!selectedRefund} onOpenChange={setIsRefundModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Suivi du remboursement</DialogTitle>
            <DialogDescription>Mettre à jour le statut et documenter la résolution.</DialogDescription>
          </DialogHeader>
          {selectedRefund && (
            <div className="space-y-4 text-sm">
              {refundModalError && (
                <div className="rounded border border-red-200 bg-red-50 p-3 text-xs text-red-600">{refundModalError}</div>
              )}
              <div className="rounded border border-slate-200 p-3">
                <p className="text-sm font-semibold text-slate-900">{selectedRefund.vendorName}</p>
                <p className="text-xs text-slate-500">Commande #{selectedRefund.orderId}</p>
                <p className="text-xs text-slate-500">Client {selectedRefund.customerEmail}</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-500">Montant remboursé</p>
                  <p className="font-semibold text-slate-800">{formatAmount(selectedRefund.amount)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Commission ajustée</p>
                  <p className="font-semibold text-slate-800">{formatAmount(selectedRefund.commissionAdjustment)}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select value={refundModalStatus} onValueChange={(value) => setRefundModalStatus(value as RefundCase['status'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="requested">Demandé</SelectItem>
                    <SelectItem value="processing">En traitement</SelectItem>
                    <SelectItem value="resolved">Résolu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notes de résolution</Label>
                <Textarea
                  rows={4}
                  value={refundResolutionNotes}
                  onChange={(event) => setRefundResolutionNotes(event.target.value)}
                  placeholder="Préciser les étapes de traitement, renvoi de facture, etc."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRefundModalOpen(false)}>
              Annuler
            </Button>
            <Button className={solidOrangeButton} onClick={updateRefundCase}>
              Mettre à jour
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isRejectionOpen && !!selectedRequest} onOpenChange={setIsRejectionOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rejeter la demande</DialogTitle>
            <DialogDescription>Précisez le motif communiqué au vendeur.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-sm font-semibold text-slate-900">{selectedRequest?.vendorName}</p>
              <p className="text-xs text-slate-500">Référence {selectedRequest?.id}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Motif</Label>
              <Textarea
                id="rejection-reason"
                rows={4}
                value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)}
                placeholder="Expliquer brièvement la raison du rejet"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectionOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={rejectRequest} disabled={!rejectionReason.trim()}>
              <XCircle className="mr-2 h-4 w-4" />Confirmer le rejet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modale d'insights détaillés (vendeur/utilisateur) */}
      <Dialog open={!!insightModal} onOpenChange={(open) => !open && setInsightModal(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {insightModal?.type === 'vendor' ? 'Insights vendeur' : 'Insights utilisateur'}
            </DialogTitle>
            <DialogDescription>
              {insightModal?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            {insightModal?.type === 'vendor' && (
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="text-xs text-slate-500">Ventes brutes</p>
                  <p className="font-semibold text-slate-900">{formatAmount(vendorKPIs?.totalGross || 0)}</p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="text-xs text-slate-500">Commission</p>
                  <p className="font-semibold text-rose-600">{formatAmount(vendorKPIs?.totalCommission || 0)}</p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="text-xs text-slate-500">Net</p>
                  <p className="font-semibold text-emerald-600">{formatAmount(vendorKPIs?.totalNet || 0)}</p>
                </div>
              </div>
            )}
            {insightModal?.type === 'user' && (
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="text-xs text-slate-500">Total dépensé</p>
                  <p className="font-semibold text-slate-900">{formatAmount(userKPIs?.totalSpent || 0)}</p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="text-xs text-slate-500">Commission générée</p>
                  <p className="font-semibold text-slate-900">{formatAmount(userKPIs?.commissionGenerated || 0)}</p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="text-xs text-slate-500">Dernier achat</p>
                  <p className="font-semibold text-slate-900">{userKPIs?.lastPurchase || '-'}</p>
                </div>
              </div>
            )}
            <div>
              <p className="text-xs text-slate-500 mb-2">Série (6 derniers mois)</p>
              {insightModal?.type === 'vendor' && insightSeries.length > 0 && (
                <div className="flex items-end gap-2">
                  {insightSeries.map((item) => (
                    <div key={item.label} className="flex-1">
                      <div className="mx-auto w-3 rounded bg-orange-400" style={{ height: `${Math.max(item.value / 1000, 4)}px` }} />
                      <p className="mt-1 text-[10px] text-center text-slate-500">{item.label}</p>
                    </div>
                  ))}
                </div>
              )}
              {insightModal?.type === 'user' && userInsightSeries.length > 0 && (
                <div className="flex items-end gap-2">
                  {userInsightSeries.map((item) => (
                    <div key={item.label} className="flex-1">
                      <div className="mx-auto w-3 rounded bg-orange-400" style={{ height: `${Math.max(item.value / 1000, 4)}px` }} />
                      <p className="mt-1 text-[10px] text-center text-slate-500">{item.label}</p>
                    </div>
                  ))}
                </div>
              )}
              {((insightModal?.type === 'vendor' && insightSeries.length === 0) || (insightModal?.type === 'user' && userInsightSeries.length === 0)) && (
                <div className="rounded border border-dashed border-slate-300 p-3 text-center text-xs text-slate-500">
                  Aucune série temporelle disponible.
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            {insightModal?.type === 'vendor' && (
              <Button variant="outline" className={outlineOrangeButton} onClick={() => exportVendorTransactionsCSV(insightModal.id)}>
                <Download className="mr-2 h-4 w-4" />Exporter transactions vendeur
              </Button>
            )}
            {insightModal?.type === 'user' && (
              <Button variant="outline" className={outlineOrangeButton} onClick={() => exportUserPointsTransactionsCSV(insightModal.id)}>
                <Download className="mr-2 h-4 w-4" />Exporter points utilisateur
              </Button>
            )}
            <Button variant="outline" onClick={() => setInsightModal(null)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default FinancialManagement
