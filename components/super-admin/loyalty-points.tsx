"use client"

import { useState, useEffect, useCallback, useMemo, Dispatch, SetStateAction } from 'react'
import {
  Star, Gift, Users, TrendingUp, TrendingDown, Settings, Plus,
  Edit, Trash2, Eye, BarChart3, Download, RefreshCw, Minus, Lock, Unlock,
  Target, DollarSign, Calendar, Clock, Award, Crown,
  Zap, Snowflake, Filter, Search, Mail, FileText, FileSpreadsheet,
  ChevronDown, ChevronUp, AlertCircle, CheckCircle, XCircle, Loader2, ChevronsUpDown, Check
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/components/ui/modern-notification'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { supabase } from '@/lib/supabase'
import { ClientAuthService } from '@/lib/services/client-auth-service'
import { SuperAdminDashboardService } from '@/lib/services/super-admin-dashboard-service'
import type { SuperAdminUserSummary } from '@/lib/services/super-admin-dashboard-service'
import {
  fetchAdminPointSettings,
  saveAdminPointSettings,
  DEFAULT_ADMIN_POINT_SETTINGS,
  AdminPointSettings
} from '@/lib/services/point-settings-service'
import PointsConfiguration from '@/components/super-admin/points-configuration'
import { SuperAdminCategoryService } from '@/lib/services/super-admin-category-service'
import type { ProductCategoryRecord } from '@/lib/types/product-category'
import {
  LoyaltyAdminService,
  LoyaltyRule as ServiceLoyaltyRule,
  LoyaltyReward as ServiceLoyaltyReward,
  LoyaltyTransaction as ServiceLoyaltyTransaction,
  LoyaltyMember as ServiceLoyaltyMember,
  LoyaltyAnalyticsSnapshot as ServiceLoyaltyAnalyticsSnapshot
} from '@/lib/services/loyalty-admin-service'

// Interfaces pour le système de fidélité
interface UILoyaltyRule {
  id: string
  name: string
  type: 'purchase' | 'bonus' | 'referral' | 'social' | 'custom'
  description: string
  pointsValue: number
  multiplier?: number
  minAmount?: number
  maxPoints?: number
  isActive: boolean
  conditions: string[]
  createdAt: string
}

/** Récupère les transferts de points (point_transfer_requests) via l'API Super Admin. */
const fetchAdminPointsTransfers = async (): Promise<PointsTransferRow[]> => {
  try {
    const headers = await ClientAuthService.buildAuthHeaders()
    const params = new URLSearchParams()
    params.set('page', '1')
    params.set('pageSize', '200')
    params.set('withCount', 'false')
    const res = await fetch(`/api/finance/points-transfers?${params.toString()}`, { headers })
    if (!res.ok) return []
    const payload = (await res.json()) as unknown
    const rows = Array.isArray(payload)
      ? payload
      : payload && typeof payload === 'object' && Array.isArray((payload as any).rows)
        ? (payload as any).rows
        : []
    return rows as PointsTransferRow[]
  } catch {
    return []
  }
}

type AwardPointsPayload = {
  userId: string
  points: number
  description?: string
}

type AwardPointsResult = {
  userId: string
  points: number
  conversionRate: number
  fcfaValue: number
  newBalance: number
}

type AwardUserCandidate = {
  id: string
  name: string
  email: string
  phone: string
  tier?: UILoyaltyMember['tier']
  availablePoints: number
  source: 'loyalty_member' | 'platform_user'
}

/**
 * Attribue des points à un utilisateur via l'API Super Admin.
 */
const awardAdminPoints = async (payload: AwardPointsPayload): Promise<AwardPointsResult> => {
  const headers = await ClientAuthService.buildAuthHeaders()

  const res = await fetch('/api/finance/points-awards', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  })

  const json = (await res.json().catch(() => ({}))) as any

  if (!res.ok) {
    const message =
      (typeof json?.error === 'string' && json.error) ||
      (json?.error && typeof json.error?.message === 'string' && json.error.message) ||
      "Erreur lors de l'attribution des points"
    throw new Error(message)
  }

  return (json?.data ?? json) as AwardPointsResult
}

type DebitPointsPayload = {
  userId: string
  points: number
  description?: string
}

type DebitPointsResult = {
  userId: string
  points: number
  newBalance: number
}

/**
 * Retire des points à un utilisateur via l'API Super Admin.
 */
const debitAdminPoints = async (payload: DebitPointsPayload): Promise<DebitPointsResult> => {
  const headers = await ClientAuthService.buildAuthHeaders()

  const res = await fetch('/api/finance/points-debits', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  })

  const json = (await res.json().catch(() => ({}))) as any

  if (!res.ok) {
    const message =
      (typeof json?.error === 'string' && json.error) ||
      (json?.error && typeof json.error?.message === 'string' && json.error.message) ||
      'Erreur lors du retrait de points'
    throw new Error(message)
  }

  return (json?.data ?? json) as DebitPointsResult
}

type FreezePointsPayload = {
  userId: string
  isFrozen: boolean
  reason?: string
  points?: number
}

type FreezePointsResult = {
  userId: string
  isFrozen: boolean
  frozenAt?: string | null
  frozenBy?: string | null
  reason?: string | null
  pointsBalance?: number
  frozenPoints?: number
}

/**
 * Gèle ou dégèle les points d'un utilisateur via l'API Super Admin.
 */
const setAdminPointsFreezeStatus = async (payload: FreezePointsPayload): Promise<FreezePointsResult> => {
  const headers = await ClientAuthService.buildAuthHeaders()

  console.debug('[points-freeze] request payload:', payload)

  const res = await fetch('/api/finance/points-freeze', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  })

  console.debug('[points-freeze] response status:', res.status)

  const json = (await res.json().catch(() => ({}))) as any

  console.debug('[points-freeze] response json:', json)

  if (!res.ok) {
    const message =
      (typeof json?.error === 'string' && json.error) ||
      (json?.error && typeof json.error?.message === 'string' && json.error.message) ||
      'Erreur lors de la mise à jour du gel'
    console.error('[points-freeze] request failed:', message)
    throw new Error(message)
  }

  return (json?.data ?? json) as FreezePointsResult
}

type CancelableTransactionKind = 'withdrawal' | 'transfer' | 'exchange'

const isAdminCancelableTransaction = (tx: UILoyaltyTransaction): boolean => {
  const txType = String((tx as any)?.type ?? '')
  if (txType !== 'spend' && txType !== 'adjustment') return false

  const description = String(tx.description || '').toLowerCase()
  // On limite volontairement aux opérations explicitement faites par Super Admin.
  return description.includes('super admin')
}

/**
 * Déduit le type d'opération annulable depuis l'identifiant UI.
 */
const getCancelableKind = (txId: string): CancelableTransactionKind | null => {
  if (txId.startsWith('pt_wd_')) return 'withdrawal'
  if (txId.startsWith('pt_tr_')) return 'transfer'
  if (txId.startsWith('pt_ex_')) return 'exchange'
  return null
}

const extractCancelableOperationId = (tx: UILoyaltyTransaction, kind: CancelableTransactionKind | null): string | null => {
  const byReference = String(tx.reference || '').trim()
  if (byReference) return byReference
  if (!kind) return null

  const id = String(tx.id || '')
  if (!id) return null

  if (kind === 'withdrawal' && id.startsWith('pt_wd_')) return id.slice('pt_wd_'.length)
  if (kind === 'exchange' && id.startsWith('pt_ex_')) return id.slice('pt_ex_'.length)

  if (kind === 'transfer') {
    const outPrefix = 'pt_tr_out_'
    const inPrefix = 'pt_tr_in_'
    if (id.startsWith(outPrefix)) return id.slice(outPrefix.length)
    if (id.startsWith(inPrefix)) return id.slice(inPrefix.length)
    if (id.startsWith('pt_tr_')) return id.slice('pt_tr_'.length)
  }

  return null
}

const getCancelableKindFromTransaction = (tx: UILoyaltyTransaction): CancelableTransactionKind | null => {
  const txType = String((tx as any)?.type ?? '')

  // Source de vérité: le type métier (évite les faux positifs sur la description).
  if (txType === 'withdrawal') return 'withdrawal'
  if (txType === 'exchange') return 'exchange'
  if (txType === 'transfer' || txType === 'transfer_in') return 'transfer'

  const byId = getCancelableKind(tx.id)
  if (byId) return byId

  // Fallback très permissif (legacy). Gardé uniquement si on n'a pas le type.
  const description = String(tx.description || '').toLowerCase()
  if (description.includes('échange') || description.includes('echange')) return 'exchange'
  if (description.includes('transfert')) return 'transfer'
  return null
}

/**
 * Annule une opération (Option B: contre-écriture) via l'API Super Admin.
 */
const cancelOperation = async (kind: CancelableTransactionKind, operationId: string) => {
  const headers = await ClientAuthService.buildAuthHeaders()

  const endpoint =
    kind === 'withdrawal'
      ? `/api/finance/points-withdrawals/${encodeURIComponent(operationId)}/cancel`
      : kind === 'transfer'
        ? `/api/finance/points-transfers/${encodeURIComponent(operationId)}/cancel`
        : `/api/finance/points-exchanges/${encodeURIComponent(operationId)}/cancel`

  const res = await fetch(endpoint, { method: 'POST', headers })
  const json = (await res.json().catch(() => ({}))) as any

  if (!res.ok) {
    const message =
      (typeof json?.error === 'string' && json.error) ||
      (json?.error && typeof json.error?.message === 'string' && json.error.message) ||
      "Erreur lors de l'annulation."
    throw new Error(message)
  }

  return json?.data ?? json
}

/** Annule une transaction Super Admin (spend/adjustment) via contre-écriture, basée sur l'id point_transactions. */
const cancelAdminTransaction = async (transactionId: string) => {
  const headers = await ClientAuthService.buildAuthHeaders()

  const normalizedId = String(transactionId || '').startsWith('pt_')
    ? String(transactionId).slice('pt_'.length)
    : String(transactionId || '')

  const res = await fetch(`/api/finance/points-transactions/${encodeURIComponent(normalizedId)}/cancel`, {
    method: 'POST',
    headers
  })

  const json = (await res.json().catch(() => ({}))) as any

  if (!res.ok) {
    const message =
      (typeof json?.error === 'string' && json.error) ||
      (json?.error && typeof json.error?.message === 'string' && json.error.message) ||
      "Erreur lors de l'annulation."
    throw new Error(message)
  }

  return json?.data ?? json
}

/** Récupère les retraits de points (point_withdrawal_requests) via l'API Super Admin. */
const fetchAdminPointsWithdrawals = async (): Promise<PointsWithdrawalRow[]> => {
  try {
    const headers = await ClientAuthService.buildAuthHeaders()
    const params = new URLSearchParams()
    params.set('page', '1')
    params.set('pageSize', '200')
    params.set('withCount', 'false')
    const res = await fetch(`/api/finance/points-withdrawals?${params.toString()}`, { headers })
    if (!res.ok) return []
    const payload = (await res.json()) as unknown
    const rows = Array.isArray(payload)
      ? payload
      : payload && typeof payload === 'object' && Array.isArray((payload as any).rows)
        ? (payload as any).rows
        : []
    return rows as PointsWithdrawalRow[]
  } catch {
    return []
  }
}

/** Récupère les échanges de points (point_exchange_history) via l'API Super Admin. */
const fetchAdminPointsExchanges = async (): Promise<PointsExchangeRow[]> => {
  try {
    const headers = await ClientAuthService.buildAuthHeaders()
    const params = new URLSearchParams()
    params.set('page', '1')
    params.set('pageSize', '200')
    params.set('withCount', 'false')
    const res = await fetch(`/api/finance/points-exchanges?${params.toString()}`, { headers })
    if (!res.ok) return []
    const payload = (await res.json()) as unknown
    const rows = Array.isArray(payload)
      ? payload
      : payload && typeof payload === 'object' && Array.isArray((payload as any).rows)
        ? (payload as any).rows
        : []
    return rows as PointsExchangeRow[]
  } catch {
    return []
  }
}

/** Convertit un transfert de points vers le format UI existant. */
const mapTransferToUI = (tr: PointsTransferRow, memberMap: Record<string, UILoyaltyMember>): UILoyaltyTransaction[] => {
  const sender = memberMap[tr.senderId]
  const recipient = memberMap[tr.recipientId]

  const senderLabel = sender?.name ?? tr.senderName ?? 'Utilisateur'
  const recipientLabel = recipient?.name ?? tr.recipientName ?? 'Utilisateur'

  const statusRaw = String(tr.status || '').toLowerCase()
  const status: UILoyaltyTransaction['status'] =
    statusRaw === 'failed' || statusRaw === 'rejected'
      ? 'failed'
      : statusRaw === 'pending' || statusRaw === 'approved'
        ? 'pending'
        : 'completed'

  const base: Omit<UILoyaltyTransaction, 'id' | 'userId' | 'userName' | 'type' | 'points' | 'description' | 'delta'> = {
    balance: 0,
    reference: tr.id,
    status,
    createdAt: tr.createdAt
  }

  const senderTx: UILoyaltyTransaction = {
    id: `pt_tr_out_${tr.id}`,
    userId: tr.senderId,
    userName: senderLabel,
    type: 'spend',
    points: Math.abs(Number(tr.pointsAmount || 0)),
    delta: -Math.abs(Number(tr.pointsAmount || 0)),
    description: `Transfert vers ${recipientLabel}`,
    ...base
  }

  const recipientTx: UILoyaltyTransaction = {
    id: `pt_tr_in_${tr.id}`,
    userId: tr.recipientId,
    userName: recipientLabel,
    type: 'earn',
    points: Math.abs(Number(tr.pointsAmount || 0)),
    delta: Math.abs(Number(tr.pointsAmount || 0)),
    description: `Transfert reçu de ${senderLabel}`,
    ...base
  }

  return [senderTx, recipientTx]
}

/** Convertit un retrait de points vers le format UI existant. */
const mapWithdrawalToUI = (w: PointsWithdrawalRow, memberMap: Record<string, UILoyaltyMember>): UILoyaltyTransaction => {
  const member = memberMap[w.userId]
  const label = member?.name ?? w.userName ?? 'Utilisateur'
  const statusRaw = String(w.status || '').toLowerCase()
  const status: UILoyaltyTransaction['status'] =
    statusRaw === 'failed' || statusRaw === 'rejected'
      ? 'failed'
      : statusRaw === 'pending' || statusRaw === 'processing'
        ? 'pending'
        : 'completed'

  return {
    id: `pt_wd_${w.id}`,
    userId: w.userId,
    userName: label,
    type: 'spend',
    points: Math.abs(Number(w.pointsAmount || 0)),
    balance: 0,
    delta: -Math.abs(Number(w.pointsAmount || 0)),
    description: `Retrait (${w.currency})`,
    reference: w.id,
    status,
    createdAt: w.createdAt
  }
}

/** Convertit un échange de points vers le format UI existant. */
const mapExchangeToUI = (e: PointsExchangeRow, memberMap: Record<string, UILoyaltyMember>): UILoyaltyTransaction => {
  const member = memberMap[e.userId]
  const label = member?.name ?? e.userName ?? 'Utilisateur'

  return {
    id: `pt_ex_${e.id}`,
    userId: e.userId,
    userName: label,
    type: 'spend',
    points: Math.abs(Number(e.pointsAmount || 0)),
    balance: 0,
    delta: -Math.abs(Number(e.pointsAmount || 0)),
    description: `Échange ${e.fromCurrency} ➝ ${e.toCurrency}`,
    reference: e.id,
    status: 'completed',
    createdAt: e.createdAt
  }
}

type TierDistributionEntry = {
  tier: UILoyaltyMember['tier']
  label: string
  count: number
  percentage: number
  color: string
}

type MonthlyPointsEntry = {
  label: string
  points: number
}

interface UILoyaltyReward {
  id: string
  name: string
  description: string
  type: 'discount' | 'free_shipping' | 'free_product' | 'cashback' | 'voucher'
  pointsCost: number
  value: number
  valueType: 'percentage' | 'fixed' | 'points'
  minOrderAmount?: number
  maxUsage: number
  currentUsage: number
  isActive: boolean
  startDate: string
  endDate: string
  categories: string[]
}

interface UILoyaltyTransaction {
  id: string
  userId: string
  userName: string
  type: 'earn' | 'spend' | 'expire' | 'adjustment' | 'freeze' | 'unfreeze'
  points: number
  balance: number
  delta: number
  description: string
  reference: string
  status: 'completed' | 'pending' | 'failed' | 'cancelled'
  createdAt: string
  expiresAt?: string
}

type PointsTransactionRow = {
  id: string
  userId: string
  userName?: string
  type: string
  category: 'fee' | 'withdrawal' | 'exchange' | 'redemption' | 'other'
  points: number
  value: number
  description: string
  referenceId: string | null
  createdAt: string
}

type PointsTransferRow = {
  id: string
  senderId: string
  senderName?: string
  recipientId: string
  recipientName?: string
  pointsAmount: number
  feeAmount: number
  status: 'pending' | 'approved' | 'rejected' | 'failed' | 'completed'
  createdAt: string
  processedAt: string | null
  processedBy: string | null
  metadata: Record<string, unknown>
}

type PointsWithdrawalRow = {
  id: string
  userId: string
  userName?: string
  methodId: string
  pointsAmount: number
  payoutAmount: number
  feeAmount: number
  currency: string
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed' | 'failed'
  createdAt: string
  processedAt: string | null
  processedBy: string | null
  metadata: Record<string, unknown>
}

type PointsExchangeRow = {
  id: string
  userId: string
  userName?: string
  fromCurrency: string
  toCurrency: string
  pointsAmount: number
  convertedAmount: number
  feeAmount: number
  rate: number
  metadata: Record<string, unknown>
  createdAt: string
}

interface UILoyaltyMember {
  id: string
  name: string
  email: string
  phone: string
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'
  totalPoints: number
  availablePoints: number
  lifetimePoints: number
  joinDate: string
  lastActivity: string
  totalOrders: number
  totalSpent: number
  referralCount: number
  status: 'active' | 'inactive' | 'suspended'
}

type RuleFormState = {
  name: string
  type: UILoyaltyRule['type']
  description: string
  pointsValue: string
  multiplier: string
  minAmount: string
  maxPoints: string
  isActive: boolean
  conditions: string
}

type RewardFormState = {
  name: string
  description: string
  type: UILoyaltyReward['type']
  pointsCost: string
  value: string
  valueType: UILoyaltyReward['valueType']
  minOrderAmount: string
  maxUsage: string
  currentUsage: string
  isActive: boolean
  startDate: string
  endDate: string
  categories: string
}

const DEFAULT_ANALYTICS_DATA = {
  totalPoints: 0,
  activeMembers: 0,
  exchangedPoints: 0,
  totalValue: 0,
  monthlyGrowth: 0,
  memberGrowth: 0,
  pointGrowth: 0,
  valueGrowth: 0
}

const TIER_DISPLAY_CONFIG: Array<{ tier: UILoyaltyMember['tier']; label: string; colorClass: string }> = [
  { tier: 'bronze', label: 'Bronze (0-1000 points)', colorClass: 'bg-amber-600' },
  { tier: 'silver', label: 'Argent (1001-5000 points)', colorClass: 'bg-gray-400' },
  { tier: 'gold', label: 'Or (5001-15000 points)', colorClass: 'bg-yellow-500' },
  { tier: 'platinum', label: 'Platine (15001-30000 points)', colorClass: 'bg-blue-500' },
  { tier: 'diamond', label: 'Diamant (30001+ points)', colorClass: 'bg-purple-500' }
]

const TRANSACTION_THEME: Record<UILoyaltyTransaction['type'], { label: string; containerClass: string; pointsClass: string }> = {
  earn: {
    label: 'Gain',
    containerClass: 'bg-green-50',
    pointsClass: 'text-green-600'
  },
  spend: {
    label: 'Dépense',
    containerClass: 'bg-blue-50',
    pointsClass: 'text-blue-600'
  },
  expire: {
    label: 'Expiration',
    containerClass: 'bg-orange-50',
    pointsClass: 'text-orange-600'
  },
  adjustment: {
    label: 'Ajustement',
    containerClass: 'bg-purple-50',
    pointsClass: 'text-purple-600'
  },
  freeze: {
    label: 'Gel',
    containerClass: 'bg-slate-50',
    pointsClass: 'text-slate-700'
  },
  unfreeze: {
    label: 'Dégel',
    containerClass: 'bg-emerald-50',
    pointsClass: 'text-emerald-700'
  }
}

/**
 * Convertit une transaction de points issue de l'API finance vers le format UI existant (sans changer le design).
 */
const mapPointTransactionToUI = (transaction: PointsTransactionRow, memberMap: Record<string, UILoyaltyMember>): UILoyaltyTransaction => {
  const member = memberMap[transaction.userId]

  const rawType = String(transaction.type || '').toLowerCase()
  const uiType: UILoyaltyTransaction['type'] =
    rawType === 'earn' || rawType === 'share' || rawType === 'bonus'
      ? 'earn'
      : rawType === 'freeze'
        ? 'freeze'
        : rawType === 'unfreeze'
          ? 'unfreeze'
      : rawType === 'expire'
        ? 'expire'
        : rawType === 'adjustment'
          ? 'adjustment'
          : 'spend'

  const rawPoints = Number(transaction.points ?? 0)
  const points = Math.abs(rawPoints)
  const delta = uiType === 'earn'
    ? Math.abs(rawPoints)
    : uiType === 'spend' || uiType === 'expire'
      ? -Math.abs(rawPoints)
      : uiType === 'freeze'
        ? -Math.abs(rawPoints)
        : uiType === 'unfreeze'
          ? Math.abs(rawPoints)
        : rawPoints

  return {
    id: `pt_${transaction.id}`,
    userId: transaction.userId,
    userName: member?.name ?? transaction.userName ?? 'Utilisateur inconnu',
    type: uiType,
    points,
    balance: 0,
    delta,
    description: transaction.description ?? rawType,
    reference: transaction.referenceId ?? '',
    status: 'completed',
    createdAt: transaction.createdAt
  }
}

/**
 * Récupère les transactions de points via l'API Super Admin (routes finance) avec auth Bearer.
 */
const fetchAdminPointsTransactions = async (): Promise<PointsTransactionRow[]> => {
  try {
    const headers = await ClientAuthService.buildAuthHeaders()
    const params = new URLSearchParams()
    params.set('page', '1')
    params.set('pageSize', '200')
    params.set('withCount', 'false')

    const res = await fetch(`/api/finance/points-transactions?${params.toString()}`, { headers })
    if (!res.ok) {
      return []
    }

    const payload = (await res.json()) as unknown
    const rows = Array.isArray(payload)
      ? payload
      : payload && typeof payload === 'object' && Array.isArray((payload as any).rows)
        ? (payload as any).rows
        : []

    return rows as PointsTransactionRow[]
  } catch (_) {
    return []
  }
}

const TRANSACTION_STATUS_LABEL: Record<UILoyaltyTransaction['status'], { label: string; badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  completed: { label: 'Terminé', badgeVariant: 'default' },
  pending: { label: 'En attente', badgeVariant: 'secondary' },
  failed: { label: 'Échoué', badgeVariant: 'destructive' },
  cancelled: { label: 'Annulé', badgeVariant: 'outline' }
}

const ANALYTICS_PERIOD_MONTHS: Record<'1month' | '3months' | '6months' | '1year', number> = {
  '1month': 1,
  '3months': 3,
  '6months': 6,
  '1year': 12
}

/**
 * Retourne l'étiquette lisible correspondant à une période analytics.
 */
const getAnalyticsPeriodLabel = (period: '1month' | '3months' | '6months' | '1year') => {
  switch (period) {
    case '1month':
      return '1 Mois'
    case '3months':
      return '3 Mois'
    case '6months':
      return '6 Mois'
    case '1year':
    default:
      return '1 An'
  }
}

/**
 * Convertit une règle Supabase vers sa représentation UI.
 */
const mapServiceRuleToUI = (rule: ServiceLoyaltyRule): UILoyaltyRule => ({
  id: rule.id,
  name: rule.name,
  type: rule.rule_type,
  description: rule.description ?? '',
  pointsValue: Number(rule.points_value ?? 0),
  multiplier: rule.multiplier !== null ? Number(rule.multiplier) : undefined,
  minAmount: rule.min_amount !== null ? Number(rule.min_amount) : undefined,
  maxPoints: rule.max_points !== null ? Number(rule.max_points) : undefined,
  isActive: rule.is_active,
  conditions: rule.conditions ?? [],
  createdAt: rule.created_at
})

/**
 * Convertit une récompense Supabase vers la structure utilisée par l'UI.
 */
const mapServiceRewardToUI = (reward: ServiceLoyaltyReward): UILoyaltyReward => ({
  id: reward.id,
  name: reward.name,
  description: reward.description ?? '',
  type: reward.reward_type,
  pointsCost: Number(reward.points_cost ?? 0),
  value: Number(reward.value ?? 0),
  valueType: reward.value_type,
  minOrderAmount: reward.min_order_amount !== null ? Number(reward.min_order_amount) : undefined,
  maxUsage: reward.max_usage !== null ? Number(reward.max_usage) : 0,
  currentUsage: Number(reward.current_usage ?? 0),
  isActive: reward.is_active,
  startDate: reward.start_date ?? '',
  endDate: reward.end_date ?? '',
  categories: reward.categories ?? []
})

/**
 * Convertit une transaction Supabase vers la structure UI.
 */
const mapServiceTransactionToUI = (transaction: ServiceLoyaltyTransaction, memberMap: Record<string, UILoyaltyMember>): UILoyaltyTransaction => {
  const member = memberMap[transaction.user_id]

  const rawPoints = Number(transaction.points ?? 0)
  const delta = transaction.transaction_type === 'earn'
    ? Math.abs(rawPoints)
    : transaction.transaction_type === 'spend' || transaction.transaction_type === 'expire'
      ? -Math.abs(rawPoints)
      : rawPoints

  return {
    id: transaction.id,
    userId: transaction.user_id,
    userName: member?.name ?? 'Utilisateur inconnu',
    type: transaction.transaction_type,
    points: Math.abs(rawPoints),
    balance: Number(transaction.balance_after ?? 0),
    delta,
    description: transaction.description ?? '',
    reference: transaction.reference ?? '',
    status: transaction.status,
    createdAt: transaction.created_at,
    expiresAt: undefined
  }
}

/**
 * Convertit un membre Supabase vers la structure UI.
 */
const mapServiceMemberToUI = (member: ServiceLoyaltyMember): UILoyaltyMember => {
  const fullName = `${member.first_name ?? ''} ${member.last_name ?? ''}`.trim()
  const fallbackName = member.email ?? 'Utilisateur'

  return {
    id: member.user_id,
    name: fullName !== '' ? fullName : fallbackName,
    email: member.email ?? 'Non renseigné',
    phone: member.phone ?? '',
    tier: member.tier,
    totalPoints: Number(member.total_points ?? 0),
    availablePoints: Number(member.available_points ?? 0),
    lifetimePoints: Number(member.lifetime_points ?? 0),
    joinDate: member.joined_at,
    lastActivity: member.last_activity ?? '',
    totalOrders: Number(member.total_orders ?? 0),
    totalSpent: Number(member.total_spent ?? 0),
    referralCount: Number(member.referral_count ?? 0),
    status: member.status
  }
}

/**
 * Agrège les snapshots analytics en un objet de synthèse.
 */
const buildAnalyticsFromSnapshots = (snapshots: ServiceLoyaltyAnalyticsSnapshot[]): typeof DEFAULT_ANALYTICS_DATA => {
  if (!snapshots.length) {
    return DEFAULT_ANALYTICS_DATA
  }

  const latest = snapshots[0]

  return {
    totalPoints: Number(latest.total_points ?? 0),
    activeMembers: Number(latest.active_members ?? 0),
    exchangedPoints: Number(latest.exchanged_points ?? 0),
    totalValue: Number(latest.total_value ?? 0),
    monthlyGrowth: Number(latest.monthly_growth ?? 0),
    memberGrowth: Number(latest.member_growth ?? 0),
    pointGrowth: Number(latest.point_growth ?? 0),
    valueGrowth: Number(latest.value_growth ?? 0)
  }
}

/**
 * Calcule un snapshot analytics (valeurs réelles) à partir des données déjà chargées en mémoire.
 * Objectif: éviter un onglet Analytics à 0 lorsque la table loyalty_analytics_snapshots est vide.
 */
const computeAnalyticsSnapshotFromData = (params: {
  period: '1month' | '3months' | '6months' | '1year'
  members: UILoyaltyMember[]
  transactions: UILoyaltyTransaction[]
  pointValue: number
  balancesByUser?: Record<string, number>
}): Omit<ServiceLoyaltyAnalyticsSnapshot, 'id' | 'captured_at' | 'metadata'> & { metadata?: Record<string, unknown> } => {
  const monthsToInclude = ANALYTICS_PERIOD_MONTHS[params.period]
  const now = new Date()
  const startDate = new Date(now.getFullYear(), now.getMonth() - (monthsToInclude - 1), 1)

  const balancesEntries = params.balancesByUser ? Object.entries(params.balancesByUser) : []
  const totalPointsFromBalances = balancesEntries.reduce((acc, [, value]) => acc + Number(value ?? 0), 0)
  const totalPointsFromMembers = params.members.reduce((acc, m) => acc + Number(m.availablePoints ?? 0), 0)
  const totalPoints = totalPointsFromMembers > 0 ? totalPointsFromMembers : totalPointsFromBalances

  const activeFromMembers = params.members.filter((m) => m.status === 'active').length
  const activeFromBalances = balancesEntries.filter(([, value]) => Number(value ?? 0) > 0).length
  const activeFromTransactions = new Set(params.transactions.map((tx) => String(tx.userId || '')).filter(Boolean)).size
  const activeMembers = activeFromMembers > 0 ? activeFromMembers : Math.max(activeFromBalances, activeFromTransactions)

  const exchangedPoints = params.transactions.reduce((acc, tx) => {
    if (tx.type !== 'spend') return acc
    const createdAt = tx.createdAt ? new Date(tx.createdAt) : null
    if (!createdAt || Number.isNaN(createdAt.getTime())) return acc
    if (createdAt < startDate) return acc
    return acc + Number(tx.points ?? 0)
  }, 0)

  const safePointValue = Number.isFinite(params.pointValue) ? params.pointValue : 0
  const totalValue = totalPoints * safePointValue

  return {
    snapshot_period: params.period,
    total_points: totalPoints,
    active_members: activeMembers,
    exchanged_points: exchangedPoints,
    total_value: totalValue,
    monthly_growth: 0,
    member_growth: 0,
    point_growth: 0,
    value_growth: 0,
    metadata: {
      source: 'computed_from_live_data'
    }
  }
}

/**
 * Transforme un formulaire de règle en payload Supabase.
 */
const mapRuleFormToPayload = (form: RuleFormState) => ({
  name: form.name.trim(),
  rule_type: form.type,
  description: form.description.trim() || null,
  points_value: Number(form.pointsValue) || 0,
  multiplier: form.multiplier ? Number(form.multiplier) : null,
  min_amount: form.minAmount ? Number(form.minAmount) : null,
  max_points: form.maxPoints ? Number(form.maxPoints) : null,
  is_active: form.isActive,
  conditions: form.conditions
    .split(',')
    .map(condition => condition.trim())
    .filter(Boolean)
})

/**
 * Transforme un formulaire de récompense en payload Supabase.
 */
const mapRewardFormToPayload = (form: RewardFormState) => ({
  name: form.name.trim(),
  reward_type: form.type,
  description: form.description.trim() || null,
  points_cost: Number(form.pointsCost) || 0,
  value: Number(form.value) || 0,
  value_type: form.valueType,
  min_order_amount: form.minOrderAmount ? Number(form.minOrderAmount) : null,
  max_usage: form.maxUsage ? Number(form.maxUsage) : null,
  current_usage: form.currentUsage ? Number(form.currentUsage) : 0,
  is_active: form.isActive,
  start_date: form.startDate ? new Date(form.startDate).toISOString() : null,
  end_date: form.endDate ? new Date(form.endDate).toISOString() : null,
  categories: form.categories
    .split(',')
    .map(category => category.trim())
    .filter(Boolean)
})

export default function LoyaltyPoints() {
  const { confirm } = useConfirm()
  const [activeTab, setActiveTab] = useState('overview')
  const [showNewRuleModal, setShowNewRuleModal] = useState(false)
  const [showNewRewardModal, setShowNewRewardModal] = useState(false)
  const [showEditRuleModal, setShowEditRuleModal] = useState(false)
  const [showEditRewardModal, setShowEditRewardModal] = useState(false)
  const [showViewRewardModal, setShowViewRewardModal] = useState(false)
  const [showFilterRewardsModal, setShowFilterRewardsModal] = useState(false)
  const [showAwardPointsModal, setShowAwardPointsModal] = useState(false)
  const [showDebitPointsModal, setShowDebitPointsModal] = useState(false)
  const [showFreezePointsModal, setShowFreezePointsModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPointsCost, setFilterPointsCost] = useState({ min: '', max: '' })
  const [filterValue, setFilterValue] = useState({ min: '', max: '' })
  const [filterCategories, setFilterCategories] = useState<string[]>([])
  const [filterDateRange, setFilterDateRange] = useState({ start: '', end: '' })
  const [filterUsage, setFilterUsage] = useState({ min: '', max: '' })
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'1month' | '3months' | '6months' | '1year'>('6months')
  const [isDataLoading, setIsDataLoading] = useState(true)
  const [isTransactionsLoading, setIsTransactionsLoading] = useState(false)
  const [isSubmittingRule, setIsSubmittingRule] = useState(false)
  const [isSubmittingReward, setIsSubmittingReward] = useState(false)
  const [isEmailSending, setIsEmailSending] = useState(false)
  const [isAwardingPoints, setIsAwardingPoints] = useState(false)
  const [isDebitingPoints, setIsDebitingPoints] = useState(false)
  const [isFreezingPoints, setIsFreezingPoints] = useState(false)
  const [awardUserSearchOpen, setAwardUserSearchOpen] = useState(false)
  const [awardUserSearchValue, setAwardUserSearchValue] = useState('')
  const [awardTargetId, setAwardTargetId] = useState<string | null>(null)
  const [awardPointsAmount, setAwardPointsAmount] = useState('')
  const [awardDescription, setAwardDescription] = useState('')
  const [debitUserSearchOpen, setDebitUserSearchOpen] = useState(false)
  const [debitUserSearchValue, setDebitUserSearchValue] = useState('')
  const [debitTargetId, setDebitTargetId] = useState<string | null>(null)
  const [debitPointsAmount, setDebitPointsAmount] = useState('')
  const [debitDescription, setDebitDescription] = useState('')
  const [freezeUserSearchOpen, setFreezeUserSearchOpen] = useState(false)
  const [freezeUserSearchValue, setFreezeUserSearchValue] = useState('')
  const [freezeTargetId, setFreezeTargetId] = useState<string | null>(null)
  const [freezeIsFrozen, setFreezeIsFrozen] = useState(true)
  const [freezeReason, setFreezeReason] = useState('')
  const [freezePointsAmount, setFreezePointsAmount] = useState('')
  const [awardUsers, setAwardUsers] = useState<SuperAdminUserSummary[]>([])
  const [isAwardUsersLoading, setIsAwardUsersLoading] = useState(false)
  const [pointsConfig, setPointsConfig] = useState<AdminPointSettings>(() => ({
    ...DEFAULT_ADMIN_POINT_SETTINGS,
    socialSharePerNetwork: { ...DEFAULT_ADMIN_POINT_SETTINGS.socialSharePerNetwork },
    categoryBonuses: {}
  }))
  const [productCategories, setProductCategories] = useState<ProductCategoryRecord[]>([])
  const [isSavingPointsConfig, setIsSavingPointsConfig] = useState(false)
  const [isTestingPointsConfig, setIsTestingPointsConfig] = useState(false)
  const [isResettingPointsConfig, setIsResettingPointsConfig] = useState(false)

  // Hooks de contexte
  const { addNotification } = useNotifications()
  const { user, userProfile } = useAuth()

  const getErrorMessage = (error: unknown) => {
    if (!error) return 'Une erreur inattendue est survenue.'
    if (error instanceof Error) return error.message
    const anyError = error as any
    const message = typeof anyError?.message === 'string' ? anyError.message : null
    const details = typeof anyError?.details === 'string' ? anyError.details : null
    const hint = typeof anyError?.hint === 'string' ? anyError.hint : null
    return [message, details, hint].filter(Boolean).join(' - ') || 'Une erreur inattendue est survenue.'
  }

  // États pour les données
  const [rules, setRules] = useState<UILoyaltyRule[]>([])
  const [rewards, setRewards] = useState<UILoyaltyReward[]>([])
  const [transactions, setTransactions] = useState<UILoyaltyTransaction[]>([])
  const [members, setMembers] = useState<UILoyaltyMember[]>([])
  const [balancesByUser, setBalancesByUser] = useState<Record<string, number>>({})
  const [analyticsSnapshots, setAnalyticsSnapshots] = useState<ServiceLoyaltyAnalyticsSnapshot[]>([])
  const [analyticsData, setAnalyticsData] = useState(DEFAULT_ANALYTICS_DATA)
  const [selectedRule, setSelectedRule] = useState<UILoyaltyRule | null>(null)
  const [selectedReward, setSelectedReward] = useState<UILoyaltyReward | null>(null)
  const [viewReward, setViewReward] = useState<UILoyaltyReward | null>(null)
  const [newRuleForm, setNewRuleForm] = useState<RuleFormState>({
    name: '',
    type: 'purchase',
    description: '',
    pointsValue: '',
    multiplier: '',
    minAmount: '',
    maxPoints: '',
    isActive: true,
    conditions: ''
  })
  const [editRuleForm, setEditRuleForm] = useState<RuleFormState | null>(null)
  const [newRewardForm, setNewRewardForm] = useState<RewardFormState>({
    name: '',
    description: '',
    type: 'discount',
    pointsCost: '',
    value: '',
    valueType: 'percentage',
    minOrderAmount: '',
    maxUsage: '',
    currentUsage: '',
    isActive: true,
    startDate: '',
    endDate: '',
    categories: ''
  })
  const [editRewardForm, setEditRewardForm] = useState<RewardFormState | null>(null)

  const filteredRewards = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    const minCost = filterPointsCost.min ? Number(filterPointsCost.min) : null
    const maxCost = filterPointsCost.max ? Number(filterPointsCost.max) : null
    const minValue = filterValue.min ? Number(filterValue.min) : null
    const maxValue = filterValue.max ? Number(filterValue.max) : null
    const usageMin = filterUsage.min ? Number(filterUsage.min) : null
    const usageMax = filterUsage.max ? Number(filterUsage.max) : null

    const rangeStart = filterDateRange.start ? new Date(filterDateRange.start) : null
    const rangeEnd = filterDateRange.end ? new Date(filterDateRange.end) : null

    return rewards.filter((reward) => {
      const matchesSearch = term ? reward.name.toLowerCase().includes(term) : true
      const matchesType = filterType === 'all' || reward.type === filterType
      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' && reward.isActive) ||
        (filterStatus === 'inactive' && !reward.isActive)

      const cost = Number(reward.pointsCost ?? 0)
      const value = Number(reward.value ?? 0)
      const usage = Number(reward.currentUsage ?? 0)

      const matchesCost =
        (minCost === null || (Number.isFinite(minCost) && cost >= minCost)) &&
        (maxCost === null || (Number.isFinite(maxCost) && cost <= maxCost))

      const matchesValue =
        (minValue === null || (Number.isFinite(minValue) && value >= minValue)) &&
        (maxValue === null || (Number.isFinite(maxValue) && value <= maxValue))

      const matchesUsage =
        (usageMin === null || (Number.isFinite(usageMin) && usage >= usageMin)) &&
        (usageMax === null || (Number.isFinite(usageMax) && usage <= usageMax))

      const matchesCategories =
        filterCategories.length === 0 ||
        filterCategories.some((cat) => reward.categories.includes(cat)) ||
        filterCategories.includes('all')

      const startDate = reward.startDate ? new Date(reward.startDate) : null
      const endDate = reward.endDate ? new Date(reward.endDate) : null
      const matchesDateRange =
        (!rangeStart || (startDate && startDate >= rangeStart) || !reward.startDate) &&
        (!rangeEnd || (endDate && endDate <= rangeEnd) || !reward.endDate)

      return (
        matchesSearch &&
        matchesType &&
        matchesStatus &&
        matchesCost &&
        matchesValue &&
        matchesUsage &&
        matchesCategories &&
        matchesDateRange
      )
    })
  }, [
    rewards,
    searchTerm,
    filterType,
    filterStatus,
    filterPointsCost,
    filterValue,
    filterUsage,
    filterCategories,
    filterDateRange
  ])

  const tierDistribution = useMemo<TierDistributionEntry[]>(() => {
    const inferTier = (points: number): UILoyaltyMember['tier'] => {
      if (points <= 1000) return 'bronze'
      if (points <= 5000) return 'silver'
      if (points <= 15000) return 'gold'
      if (points <= 30000) return 'platinum'
      return 'diamond'
    }

    const base = TIER_DISPLAY_CONFIG.map(config => ({
      tier: config.tier,
      label: config.label,
      color: config.colorClass,
      count: 0,
      percentage: 0
    }))

    // Source 1 (préférée): tiers réels venant de loyalty_members_with_profiles.
    if (members.length > 0) {
      const totalMembers = members.length
      return base.map((entry) => {
        const count = members.filter(member => member.tier === entry.tier).length
        const percentage = totalMembers > 0 ? Math.round((count / totalMembers) * 100) : 0
        return { ...entry, count, percentage }
      })
    }

    // Source 2 (fallback): inférer le tier depuis les soldes (loyalty-balances).
    const balances = Object.values(balancesByUser)
      .map((v) => Number(v ?? 0))
      .filter((v) => Number.isFinite(v) && v >= 0)

    if (balances.length === 0) {
      return base
    }

    const counts = balances.reduce<Record<string, number>>((acc, balance) => {
      const tier = inferTier(balance)
      acc[tier] = (acc[tier] ?? 0) + 1
      return acc
    }, {})

    const total = balances.length
    return base.map((entry) => {
      const count = counts[entry.tier] ?? 0
      const percentage = total > 0 ? Math.round((count / total) * 100) : 0
      return { ...entry, count, percentage }
    })
  }, [members, balancesByUser])

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
  }, [transactions])

  const filteredTransactions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return transactions.filter((transaction) => {
      const matchesSearch = term
        ? String(transaction.userName || '').toLowerCase().includes(term)
        : true
      const matchesType = filterType === 'all' || transaction.type === filterType
      const matchesStatus = filterStatus === 'all' || transaction.status === filterStatus
      return matchesSearch && matchesType && matchesStatus
    })
  }, [transactions, searchTerm, filterType, filterStatus])

  const monthlyPointsTrend = useMemo<MonthlyPointsEntry[]>(() => {
    if (!transactions.length) {
      return []
    }

    const monthsToInclude = ANALYTICS_PERIOD_MONTHS[analyticsPeriod]
    const now = new Date()
    const startDate = new Date(now.getFullYear(), now.getMonth() - (monthsToInclude - 1), 1)

    const bucket = new Map<string, { label: string; points: number; date: Date }>()

    transactions.forEach(transaction => {
      const createdDate = new Date(transaction.createdAt)

      if (createdDate < startDate) {
        return
      }

      const monthKey = `${createdDate.getFullYear()}-${createdDate.getMonth()}`
      const label = createdDate.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
      const existing = bucket.get(monthKey)

      if (existing) {
        existing.points += Number(transaction.delta ?? transaction.points ?? 0)
      } else {
        bucket.set(monthKey, { label, points: Number(transaction.delta ?? transaction.points ?? 0), date: new Date(createdDate.getFullYear(), createdDate.getMonth(), 1) })
      }
    })

    const sorted = Array.from(bucket.values()).sort((a, b) => a.date.getTime() - b.date.getTime())

    return sorted.map(entry => ({
      label: entry.label,
      points: entry.points
    }))
  }, [transactions, analyticsPeriod])

  /**
   * Charge la configuration des points stockée côté Supabase.
   */
  const loadPointsConfiguration = useCallback(async () => {
    try {
      const settings = await fetchAdminPointSettings()
      setPointsConfig({
        ...settings,
        socialSharePerNetwork: { ...settings.socialSharePerNetwork },
        categoryBonuses: { ...settings.categoryBonuses }
      })
    } catch (error) {
      console.error('Erreur lors du chargement de la configuration des points:', error)
      addNotification({
        type: 'error',
        title: 'Configuration indisponible',
        message: "Impossible de charger les paramètres des points de fidélité.",
        duration: 5000
      })
    }
  }, [addNotification])

  useEffect(() => {
    void loadPointsConfiguration()
  }, [loadPointsConfiguration])

  /** Charge les catégories de produits (créées par le super admin) pour les bonus par catégorie. */
  const loadProductCategories = useCallback(async () => {
    try {
      const payload = await SuperAdminCategoryService.fetchCategories({ includeInactive: false })
      const categories = Array.isArray((payload as any)?.items) ? ((payload as any).items as ProductCategoryRecord[]) : ([] as ProductCategoryRecord[])
      setProductCategories(categories)
    } catch (error) {
      console.error('Erreur lors du chargement des catégories produit:', error)
      setProductCategories([])
    }
  }, [])

  useEffect(() => {
    void loadProductCategories()

    const channel = supabase
      .channel('product-categories-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'product_categories' },
        () => {
          void loadProductCategories()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadProductCategories])

  // Chargement des données au montage
  const ensureAuthenticated = () => {
    const profileId = (userProfile as any)?.id
    if (!profileId) {
      throw new Error("Utilisateur non authentifié. Veuillez vous reconnecter.")
    }

    return String(profileId)
  }

  /**
   * Sauvegarde la configuration actuelle des points auprès de Supabase.
   */
  const handleSavePointsConfig = async () => {
    setIsSavingPointsConfig(true)
    try {
      const userId = ensureAuthenticated()
      await saveAdminPointSettings(pointsConfig, userId)
      await loadPointsConfiguration()
      addNotification({
        type: 'success',
        title: 'Configuration sauvegardée',
        message: 'Les paramètres des points de fidélité ont été enregistrés avec succès.',
        duration: 5000
      })
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la configuration des points:', error)
      addNotification({
        type: 'error',
        title: 'Échec de la sauvegarde',
        message: error instanceof Error ? error.message : 'Une erreur inattendue est survenue.',
        duration: 5000
      })
    } finally {
      setIsSavingPointsConfig(false)
    }
  }

  /**
   * Valide le formulaire et retire des points à l'utilisateur sélectionné.
   */
  const handleDebitPoints = async () => {
    try {
      if (!debitTargetId) {
        addNotification({
          type: 'error',
          title: 'Utilisateur requis',
          message: 'Veuillez sélectionner un utilisateur à débiter.'
        })
        return
      }

      const points = Number(debitPointsAmount)
      if (!Number.isFinite(points) || !Number.isInteger(points) || points <= 0) {
        addNotification({
          type: 'error',
          title: 'Montant invalide',
          message: 'Le nombre de points doit être un entier positif.'
        })
        return
      }

      setIsDebitingPoints(true)

      await debitAdminPoints({
        userId: debitTargetId,
        points,
        description: debitDescription.trim() || undefined
      })

      addNotification({
        type: 'success',
        title: 'Retrait effectué',
        message: `-${points} points ont été retirés avec succès.`
      })

      setShowDebitPointsModal(false)
      await fetchInitialData()
    } catch (error) {
      console.error('Erreur retrait points:', error)
      addNotification({
        type: 'error',
        title: 'Retrait impossible',
        message: error instanceof Error ? error.message : 'Une erreur est survenue lors du retrait.'
      })
    } finally {
      setIsDebitingPoints(false)
    }
  }

  /**
   * Valide le formulaire et gèle / dégèle les points de l'utilisateur sélectionné.
   */
  const handleFreezePoints = async () => {
    try {
      if (!freezeTargetId) {
        addNotification({
          type: 'error',
          title: 'Utilisateur requis',
          message: 'Veuillez sélectionner un utilisateur.'
        })
        return
      }

      console.debug('[points-freeze] handleFreezePoints called:', {
        freezeTargetId,
        freezeIsFrozen,
        freezeReason,
        freezePointsAmount
      })

      setIsFreezingPoints(true)

      const pointsParsed = freezePointsAmount.trim() === '' ? undefined : Number(freezePointsAmount)
      if (pointsParsed !== undefined) {
        if (!Number.isFinite(pointsParsed) || !Number.isInteger(pointsParsed) || pointsParsed <= 0) {
          addNotification({
            type: 'error',
            title: 'Montant invalide',
            message: 'Le nombre de points doit être un entier positif.'
          })
          return
        }
      }

      const result = await setAdminPointsFreezeStatus({
        userId: freezeTargetId,
        isFrozen: freezeIsFrozen,
        reason: freezeReason.trim() || undefined,
        points: pointsParsed
      })

      console.debug('[points-freeze] result:', result)

      if (result.isFrozen !== freezeIsFrozen) {
        addNotification({
          type: 'warning',
          title: 'Mise à jour incomplète',
          message: `La requête a été traitée mais l'état retourné ne correspond pas (attendu: ${freezeIsFrozen ? 'gelé' : 'dégelé'} • reçu: ${result.isFrozen ? 'gelé' : 'dégelé'}). Rafraîchissez la page ou vérifiez les règles Supabase.`
        })
      }

      addNotification({
        type: 'success',
        title: result.isFrozen ? 'Compte gelé' : 'Compte dégelé',
        message: result.isFrozen
          ? 'Les opérations de transfert seront bloquées pour cet utilisateur.'
          : 'Les opérations de transfert sont à nouveau autorisées.'
      })

      setShowFreezePointsModal(false)
      setFreezePointsAmount('')
      await fetchInitialData()
    } catch (error) {
      console.error('Erreur gel/dégel points:', error)
      addNotification({
        type: 'error',
        title: 'Mise à jour impossible',
        message: error instanceof Error ? error.message : 'Une erreur est survenue lors de la mise à jour.'
      })
    } finally {
      setIsFreezingPoints(false)
    }
  }

  /**
   * Charge les utilisateurs (plateforme) pour permettre la recherche même si loyalty_members est vide.
   */
  useEffect(() => {
    if (!showAwardPointsModal && !showDebitPointsModal && !showFreezePointsModal) return
    if (awardUsers.length > 0) return

    let mounted = true
    setIsAwardUsersLoading(true)
    ;(async () => {
      try {
        const users = await SuperAdminDashboardService.getUsers({ limit: 200, offset: 0 })
        if (mounted) {
          setAwardUsers(users)
        }
      } catch {
        if (mounted) {
          setAwardUsers([])
        }
      } finally {
        if (mounted) {
          setIsAwardUsersLoading(false)
        }
      }
    })()

    return () => {
      mounted = false
    }
  }, [showAwardPointsModal, showDebitPointsModal, showFreezePointsModal, awardUsers.length])

  const awardCandidates = useMemo<AwardUserCandidate[]>(() => {
    const memberCandidates: AwardUserCandidate[] = members.map((member) => ({
      id: member.id,
      name: member.name,
      email: member.email,
      phone: member.phone ?? '',
      tier: member.tier,
      availablePoints: Number(member.availablePoints ?? 0),
      source: 'loyalty_member'
    }))

    const userCandidates: AwardUserCandidate[] = awardUsers.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone ?? '',
      availablePoints: Number(user.loyaltyPoints ?? 0),
      source: 'platform_user'
    }))

    const seen = new Set<string>()
    const merged = [...memberCandidates, ...userCandidates].filter((candidate) => {
      const key = candidate.email?.toLowerCase?.() || candidate.id
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    return merged
  }, [members, awardUsers])

  /**
   * Vérifie la cohérence métier de la configuration sans la persister.
   */
  const handleTestPointsConfig = async () => {
    setIsTestingPointsConfig(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 200))

      const errors: string[] = []

      if (pointsConfig.purchaseValue <= 0) {
        errors.push("La valeur d'achat doit être supérieure à 0")
      }
      if (pointsConfig.withdrawalValue <= 0) {
        errors.push('La valeur de retrait doit être supérieure à 0')
      }
      if (pointsConfig.minWithdrawal <= 0) {
        errors.push('Le seuil minimum doit être supérieur à 0')
      }
      if (pointsConfig.maxWithdrawal <= pointsConfig.minWithdrawal) {
        errors.push('Le seuil maximum doit être supérieur au seuil minimum')
      }
      if (pointsConfig.transferFees < 0) {
        errors.push('Les frais de transfert ne peuvent pas être négatifs')
      }
      if (pointsConfig.exchangeFee < 0) {
        errors.push("Les frais d'échange ne peuvent pas être négatifs")
      }

      const invalidSocialShares = Object.entries(pointsConfig.socialSharePerNetwork).filter(([, value]) => value < 0)
      if (invalidSocialShares.length > 0) {
        errors.push('Chaque réseau social doit attribuer un nombre de points supérieur ou égal à 0')
      }

      if (errors.length > 0) {
        addNotification({
          type: 'error',
          title: 'Tests de cohérence échoués',
          message: errors.join(' | '),
          duration: 7000
        })
        return
      }

      const summary = [
        `Achat: 1 FCFA = ${(1 / pointsConfig.purchaseValue).toFixed(2)} points`,
        `Retrait: 1 point = ${pointsConfig.withdrawalValue} FCFA`,
        `Frais d'échange: ${pointsConfig.exchangeFee} FCFA`
      ].join(' | ')

      addNotification({
        type: 'success',
        title: 'Tests réussis',
        message: summary,
        duration: 7000
      })
    } catch (error) {
      console.error('Erreur lors du test de la configuration des points:', error)
      addNotification({
        type: 'error',
        title: 'Erreur lors des tests',
        message: error instanceof Error ? error.message : 'Une erreur inattendue est survenue.',
        duration: 5000
      })
    } finally {
      setIsTestingPointsConfig(false)
    }
  }

  /**
   * Réinitialise la configuration aux valeurs par défaut et les persiste.
   */
  const handleResetPointsConfig = async () => {
    setIsResettingPointsConfig(true)
    try {
      const defaults: AdminPointSettings = {
        ...DEFAULT_ADMIN_POINT_SETTINGS,
        socialSharePerNetwork: { ...DEFAULT_ADMIN_POINT_SETTINGS.socialSharePerNetwork },
        categoryBonuses: { ...DEFAULT_ADMIN_POINT_SETTINGS.categoryBonuses }
      }

      setPointsConfig(defaults)

      const userId = ensureAuthenticated()
      await saveAdminPointSettings(defaults, userId)

      addNotification({
        type: 'info',
        title: 'Configuration réinitialisée',
        message: 'Les paramètres des points ont été réinitialisés aux valeurs par défaut.',
        duration: 5000
      })
    } catch (error) {
      console.error('Erreur lors de la réinitialisation de la configuration des points:', error)
      addNotification({
        type: 'error',
        title: 'Échec de la réinitialisation',
        message: error instanceof Error ? error.message : 'Une erreur inattendue est survenue.',
        duration: 5000
      })
    } finally {
      setIsResettingPointsConfig(false)
    }
  }

  const fetchInitialData = useCallback(async () => {
    try {
      setIsDataLoading(true)

      const [serviceRules, serviceRewards, serviceMembers, serviceSnapshots] = await Promise.all([
        LoyaltyAdminService.listRules(),
        LoyaltyAdminService.listRewards(),
        LoyaltyAdminService.listMembers(),
        LoyaltyAdminService.listSnapshots()
      ])

      const uiMembers = serviceMembers.map(mapServiceMemberToUI)
      const memberMap = uiMembers.reduce<Record<string, UILoyaltyMember>>((acc, member) => {
        acc[member.id] = member
        return acc
      }, {})

      const [serviceTransactions, pointsTransactions] = await Promise.all([
        LoyaltyAdminService.listTransactions(),
        fetchAdminPointsTransactions()
      ])

      const [pointsTransfers, pointsWithdrawals, pointsExchanges] = await Promise.all([
        fetchAdminPointsTransfers(),
        fetchAdminPointsWithdrawals(),
        fetchAdminPointsExchanges()
      ])

      const uiTransactions = serviceTransactions.map(transaction => mapServiceTransactionToUI(transaction, memberMap))
      const uiPointTransactions = pointsTransactions.map(transaction => mapPointTransactionToUI(transaction, memberMap))

      const uiTransferTransactions = pointsTransfers.flatMap(tr => mapTransferToUI(tr, memberMap))
      const uiWithdrawalTransactions = pointsWithdrawals.map(w => mapWithdrawalToUI(w, memberMap))
      const uiExchangeTransactions = pointsExchanges.map(e => mapExchangeToUI(e, memberMap))

      const dedupe = <T extends { id: string }>(items: T[]) => {
        const seen = new Set<string>()
        return items.filter((it) => {
          if (seen.has(it.id)) return false
          seen.add(it.id)
          return true
        })
      }

      const mergedTransactions = dedupe([
        ...uiTransactions,
        ...uiPointTransactions,
        ...uiTransferTransactions,
        ...uiWithdrawalTransactions,
        ...uiExchangeTransactions
      ])
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      const uniqueUserIds = Array.from(
        new Set([
          ...uiMembers.map(m => m.id),
          ...mergedTransactions.map(t => t.userId)
        ])
      ).filter(Boolean)
      const balancesHeaders = await ClientAuthService.buildAuthHeaders()
      const balancesRes = await fetch(`/api/finance/loyalty-balances?userIds=${encodeURIComponent(uniqueUserIds.join(','))}`, {
        headers: balancesHeaders
      })
      const balancesJson = (await balancesRes.json().catch(() => ({}))) as any
      const balancesRows = Array.isArray(balancesJson?.rows) ? balancesJson.rows : []
      const balancesByUser = (balancesRows as any[]).reduce((acc: Record<string, number>, row: any) => {
        acc[String(row.userId)] = Number(row.pointsBalance ?? 0)
        return acc
      }, {} as Record<string, number>)

      setBalancesByUser(balancesByUser)

      const freezeByUser = (balancesRows as any[]).reduce(
        (acc: Record<string, { isFrozen: boolean; frozenPoints: number }>, row: any) => {
          acc[String(row.userId)] = {
            isFrozen: Boolean(row.isFrozen ?? false),
            frozenPoints: Number(row.frozenPoints ?? 0)
          }
          return acc
        },
        {} as Record<string, { isFrozen: boolean; frozenPoints: number }>
      )

      const mergedWithBalances = mergedTransactions.map((tx) => {
        const current = balancesByUser[tx.userId] ?? 0
        const nextTx = { ...tx, balance: current }
        balancesByUser[tx.userId] = current - Number(tx.delta ?? 0)
        return nextTx
      })

      setRules(serviceRules.map(mapServiceRuleToUI))
      setRewards(serviceRewards.map(mapServiceRewardToUI))
      setMembers(
        uiMembers.map((m) => {
          const freeze = freezeByUser[m.id]
          if (!freeze) return m as any
          return {
            ...(m as any),
            isFrozen: freeze.isFrozen,
            frozenPoints: freeze.frozenPoints
          }
        }) as any
      )
      setTransactions(mergedWithBalances)

      // Analytics: utiliser les snapshots existants, sinon calculer depuis les données réelles.
      if (serviceSnapshots.length > 0) {
        setAnalyticsSnapshots(serviceSnapshots)
        setAnalyticsData(buildAnalyticsFromSnapshots(serviceSnapshots))
      } else {
        const computedSnapshots = (['1month', '3months', '6months', '1year'] as const).map((period) =>
          computeAnalyticsSnapshotFromData({
            period,
            members: uiMembers as any,
            transactions: mergedWithBalances,
            pointValue: Number(pointsConfig?.pointValue ?? DEFAULT_ADMIN_POINT_SETTINGS.pointValue),
            balancesByUser
          })
        )

        try {
          const created = await Promise.all(
            computedSnapshots.map((snapshot) => LoyaltyAdminService.createSnapshot(snapshot as any))
          )
          setAnalyticsSnapshots(created)
          const matching = created.find((s) => s.snapshot_period === analyticsPeriod)
          setAnalyticsData(buildAnalyticsFromSnapshots(matching ? [matching] : created))
        } catch (error) {
          console.warn('Impossible de créer les snapshots analytics, utilisation des valeurs calculées en mémoire.', error)
          setAnalyticsSnapshots([])
          const matching = computedSnapshots.find((s) => s.snapshot_period === analyticsPeriod)
          setAnalyticsData(
            buildAnalyticsFromSnapshots(
              matching
                ? ([matching] as any)
                : (computedSnapshots as any)
            )
          )
        }
      }
    } catch (error) {
      console.error('Erreur de chargement des données fidélité:', error)
      addNotification({
        type: 'error',
        title: 'Chargement impossible',
        message: "Une erreur est survenue lors du chargement des données du programme de fidélité."
      })
    } finally {
      setIsDataLoading(false)
    }
  }, [addNotification, analyticsPeriod, pointsConfig])

  useEffect(() => {
    void fetchInitialData()
  }, [fetchInitialData])

  useEffect(() => {
    const channel = supabase
      .channel('loyalty-rewards-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'loyalty_rewards' },
        async () => {
          try {
            const serviceRewards = await LoyaltyAdminService.listRewards()
            setRewards(serviceRewards.map(mapServiceRewardToUI))
          } catch {
            // Ignore silencieusement les erreurs realtime pour ne pas perturber l'UI.
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  /**
   * Annule une opération (Option B: contre-écriture) depuis la liste des transactions.
   */
  const handleCancelOperation = async (transaction: UILoyaltyTransaction) => {
    if (transaction.type === 'freeze' || transaction.type === 'unfreeze') {
      addNotification({
        type: 'error',
        title: 'Annulation impossible',
        message: "Les opérations de gel/dégel ne sont pas annulables via 'Annuler'."
      })
      return
    }

     if (isAdminCancelableTransaction(transaction)) {
      const confirmed = await confirm({
        title: 'Confirmer l’annulation',
        message: 'Une contre-écriture sera appliquée pour restaurer le solde.',
        confirmText: 'Annuler l’opération',
        cancelText: 'Retour',
        tone: 'destructive'
      })
      if (!confirmed) return

      try {
        await cancelAdminTransaction(transaction.id)

        addNotification({
          type: 'success',
          title: 'Annulation effectuée',
          message: "La contre-écriture a été appliquée."
        })

        await handleRefreshTransactions()
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erreur lors de l'annulation."
        addNotification({
          type: 'error',
          title: 'Annulation impossible',
          message
        })
      }

      return
    }

    const kind = getCancelableKindFromTransaction(transaction)
    const operationId = extractCancelableOperationId(transaction, kind)

    if (!kind || !operationId) {
      const ref = String(transaction.reference || '').trim()
      addNotification({
        type: 'error',
        title: 'Annulation impossible',
        message: `Type d'opération non reconnu ou référence manquante. (id=${transaction.id} • ref=${ref || '∅'} • kind=${kind ?? '∅'})`
      })
      return
    }

    const confirmed = await confirm({
      title: 'Confirmer l’annulation',
      message: `Une contre-écriture sera appliquée pour restaurer le solde.`,
      confirmText: 'Annuler l’opération',
      cancelText: 'Retour',
      tone: 'destructive'
    })
    if (!confirmed) return

    try {
      await cancelOperation(kind, operationId)
      addNotification({
        type: 'success',
        title: 'Opération annulée',
        message: "Une contre-écriture a été appliquée et l'opération a été marquée comme annulée."
      })
      await fetchInitialData()
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Annulation échouée',
        message: error instanceof Error ? error.message : "Erreur lors de l'annulation."
      })
    }
  }

  // ...
  // Fonctions utilitaires
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(price)
  }

  const getTierBadge = (tier: string) => {
    const tierConfig = {
      bronze: { color: 'bg-amber-100 text-amber-800 border-amber-200', icon: '🥉' },
      silver: { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: '🥈' },
      gold: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: '🥇' },
      platinum: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: '💎' },
      diamond: { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: '👑' }
    }
    
    const config = tierConfig[tier as keyof typeof tierConfig] || tierConfig.bronze
    
    return (
      <Badge variant="outline" className={config.color}>
        {config.icon} {tier.charAt(0).toUpperCase() + tier.slice(1)}
      </Badge>
    )
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'earn':
        return <Plus className="h-4 w-4 text-green-600" />
      case 'spend':
        return <Minus className="h-4 w-4 text-red-600" />
      case 'expire':
        return <Clock className="h-4 w-4 text-orange-600" />
      case 'freeze':
        return <Lock className="h-4 w-4 text-slate-700" />
      case 'unfreeze':
        return <Unlock className="h-4 w-4 text-emerald-700" />
      default:
        return <Star className="h-4 w-4 text-gray-600" />
    }
  }

  // Gestionnaires d'événements
  /**
   * Réinitialise le formulaire de création de règle.
   */
  const resetNewRuleForm = () => {
    setNewRuleForm({
      name: '',
      type: 'purchase',
      description: '',
      pointsValue: '',
      multiplier: '',
      minAmount: '',
      maxPoints: '',
      isActive: true,
      conditions: ''
    })
  }

  /**
   * Réinitialise le formulaire de création de récompense.
   */
  const resetNewRewardForm = () => {
    setNewRewardForm({
      name: '',
      description: '',
      type: 'discount',
      pointsCost: '',
      value: '',
      valueType: 'percentage',
      minOrderAmount: '',
      maxUsage: '',
      currentUsage: '',
      isActive: true,
      startDate: '',
      endDate: '',
      categories: ''
    })
  }

  /**
   * Ouvre la modale d'attribution de points.
   */
  const handleOpenAwardPointsModal = () => {
    setAwardTargetId(null)
    setAwardUserSearchValue('')
    setAwardPointsAmount('')
    setAwardDescription('')
    setShowAwardPointsModal(true)
  }

  /**
   * Ouvre la modale de retrait de points.
   */
  const handleOpenDebitPointsModal = () => {
    setDebitTargetId(null)
    setDebitUserSearchValue('')
    setDebitPointsAmount('')
    setDebitDescription('')
    setShowDebitPointsModal(true)
  }

  /**
   * Ouvre la modale de gel / dégel.
   */
  const handleOpenFreezePointsModal = () => {
    setFreezeTargetId(null)
    setFreezeUserSearchValue('')
    setFreezeIsFrozen(true)
    setFreezeReason('')
    setFreezePointsAmount('')
    setShowFreezePointsModal(true)
  }

  /**
   * Ouvre la modale gel/dégel pré-remplie depuis une transaction.
   */
  const openFreezeFromTransaction = (transaction: UILoyaltyTransaction, nextFrozenStatus: boolean) => {
    setFreezeTargetId(transaction.userId)
    setFreezeUserSearchValue(transaction.userName)
    setFreezeIsFrozen(nextFrozenStatus)
    setFreezeReason(transaction.description ?? '')

    const points = Number(transaction.points ?? 0)
    setFreezePointsAmount(Number.isFinite(points) && points > 0 ? String(points) : '')

    setShowFreezePointsModal(true)
  }

  /**
   * Valide le formulaire et attribue des points à l'utilisateur sélectionné.
   */
  const handleAwardPoints = async () => {
    try {
      if (!awardTargetId) {
        addNotification({
          type: 'error',
          title: 'Utilisateur requis',
          message: 'Veuillez sélectionner un utilisateur à créditer.'
        })
        return
      }

      const points = Number(awardPointsAmount)
      if (!Number.isFinite(points) || !Number.isInteger(points) || points <= 0) {
        addNotification({
          type: 'error',
          title: 'Montant invalide',
          message: 'Le nombre de points doit être un entier positif.'
        })
        return
      }

      setIsAwardingPoints(true)

      await awardAdminPoints({
        userId: awardTargetId,
        points,
        description: awardDescription.trim() || undefined
      })

      addNotification({
        type: 'success',
        title: 'Points attribués',
        message: `+${points} points ont été ajoutés avec succès.`
      })

      setShowAwardPointsModal(false)
      await fetchInitialData()
    } catch (error) {
      console.error('Erreur attribution points:', error)
      addNotification({
        type: 'error',
        title: 'Attribution impossible',
        message: error instanceof Error ? error.message : "Une erreur est survenue lors de l'attribution."
      })
    } finally {
      setIsAwardingPoints(false)
    }
  }

  const awardTarget = useMemo(() => {
    if (!awardTargetId) return null
    return awardCandidates.find(candidate => candidate.id === awardTargetId) ?? null
  }, [awardTargetId, awardCandidates])

  const awardPointsPreview = useMemo(() => {
    const points = Number(awardPointsAmount)
    if (!Number.isFinite(points) || !Number.isInteger(points) || points <= 0) return null
    return points
  }, [awardPointsAmount])

  const debitTarget = useMemo(() => {
    if (!debitTargetId) return null
    return awardCandidates.find(candidate => candidate.id === debitTargetId) ?? null
  }, [debitTargetId, awardCandidates])

  const debitPointsPreview = useMemo(() => {
    const points = Number(debitPointsAmount)
    if (!Number.isFinite(points) || !Number.isInteger(points) || points <= 0) return null
    return points
  }, [debitPointsAmount])

  const freezeTarget = useMemo(() => {
    if (!freezeTargetId) return null
    return awardCandidates.find(candidate => candidate.id === freezeTargetId) ?? null
  }, [freezeTargetId, awardCandidates])

  /**
   * Bascule le statut actif d'une règle via Supabase.
   */
  const handleRuleToggle = async (ruleId: string) => {
    try {
      const targetRule = rules.find(rule => rule.id === ruleId)

      if (!targetRule) {
        return
      }

      const userId = ensureAuthenticated()
      await LoyaltyAdminService.setRuleStatus(ruleId, !targetRule.isActive, userId)

      setRules(prev => prev.map(rule =>
        rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule
      ))

      addNotification({
        type: 'success',
        title: 'Règle mise à jour',
        message: 'Le statut de la règle a été modifié avec succès.'
      })
    } catch (error) {
      console.error('Erreur bascule statut règle:', error)
      addNotification({
        type: 'error',
        title: 'Bascule impossible',
        message: "La mise à jour du statut de la règle a échoué."
      })
    }
  }

  /**
   * Bascule le statut actif d'une récompense via Supabase.
   */
  const handleRewardToggle = async (rewardId: string) => {
    try {
      const targetReward = rewards.find(reward => reward.id === rewardId)

      if (!targetReward) {
        return
      }

      const userId = ensureAuthenticated()
      await LoyaltyAdminService.setRewardStatus(rewardId, !targetReward.isActive, userId)

      setRewards(prev => prev.map(reward =>
        reward.id === rewardId ? { ...reward, isActive: !reward.isActive } : reward
      ))

      addNotification({
        type: 'success',
        title: 'Récompense mise à jour',
        message: 'Le statut de la récompense a été modifié avec succès.'
      })
    } catch (error) {
      console.error('Erreur bascule statut récompense:', error)
      addNotification({
        type: 'error',
        title: 'Bascule impossible',
        message: "La mise à jour du statut de la récompense a échoué."
      })
    }
  }

  /**
   * Supprime une règle côté Supabase et met à jour l'état local.
   */
  const handleDeleteRule = async (ruleId: string) => {
    try {
      await LoyaltyAdminService.deleteRule(ruleId)
      setRules(prev => prev.filter(rule => rule.id !== ruleId))

      addNotification({
        type: 'success',
        title: 'Règle supprimée',
        message: 'La règle a été supprimée avec succès.'
      })
    } catch (error) {
      console.error('Erreur suppression règle:', error)
      addNotification({
        type: 'error',
        title: 'Suppression impossible',
        message: "La suppression de la règle a échoué."
      })
    }
  }

  /**
   * Supprime une récompense côté Supabase et met à jour l'état local.
   */
  const handleDeleteReward = async (rewardId: string) => {
    try {
      const targetReward = rewards.find(reward => reward.id === rewardId)
      const confirmed = await confirm({
        title: 'Confirmer la suppression',
        message: `Supprimer définitivement la récompense "${targetReward?.name ?? 'cette récompense'}" ?`,
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        tone: 'destructive'
      })

      if (!confirmed) {
        return
      }

      await LoyaltyAdminService.deleteReward(rewardId)
      setRewards(prev => prev.filter(reward => reward.id !== rewardId))

      addNotification({
        type: 'success',
        title: 'Récompense supprimée',
        message: 'La récompense a été supprimée avec succès.'
      })
    } catch (error) {
      console.error('Erreur suppression récompense:', error)
      addNotification({
        type: 'error',
        title: 'Suppression impossible',
        message: "La suppression de la récompense a échoué."
      })
    }
  }

  const updateAnalyticsData = (period: '1month' | '3months' | '6months' | '1year') => {
    setAnalyticsPeriod(period)

    const matchingSnapshot = analyticsSnapshots.find(snapshot => snapshot.snapshot_period === period)

    if (matchingSnapshot) {
      setAnalyticsData(buildAnalyticsFromSnapshots([matchingSnapshot]))
    }
  }

  // Nouvelles fonctions pour implémenter tous les boutons
  /**
   * Ouvre la modale de création de règle.
   */
  const handleNewRule = () => {
    resetNewRuleForm()
    setShowNewRuleModal(true)
  }

  /**
   * Ouvre la modale de création de récompense.
   */
  const handleNewReward = () => {
    resetNewRewardForm()
    setShowNewRewardModal(true)
  }

  /**
   * Prépare la modale d'édition de règle avec les données existantes.
   */
  const handleEditRule = (rule: UILoyaltyRule) => {
    setSelectedRule(rule)
    setEditRuleForm({
      name: rule.name,
      type: rule.type,
      description: rule.description,
      pointsValue: String(rule.pointsValue ?? ''),
      multiplier: rule.multiplier !== undefined ? String(rule.multiplier) : '',
      minAmount: rule.minAmount !== undefined ? String(rule.minAmount) : '',
      maxPoints: rule.maxPoints !== undefined ? String(rule.maxPoints) : '',
      isActive: rule.isActive,
      conditions: rule.conditions.join(', ')
    })
    setShowEditRuleModal(true)
  }

  /**
   * Prépare la modale d'édition de récompense avec les données existantes.
   */
  const handleEditReward = (reward: UILoyaltyReward) => {
    setSelectedReward(reward)
    setEditRewardForm({
      name: reward.name,
      description: reward.description,
      type: reward.type,
      pointsCost: String(reward.pointsCost ?? ''),
      value: String(reward.value ?? ''),
      valueType: reward.valueType,
      minOrderAmount: reward.minOrderAmount !== undefined ? String(reward.minOrderAmount) : '',
      maxUsage: reward.maxUsage !== undefined ? String(reward.maxUsage) : '',
      currentUsage: reward.currentUsage !== undefined ? String(reward.currentUsage) : '',
      isActive: reward.isActive,
      startDate: reward.startDate,
      endDate: reward.endDate,
      categories: reward.categories.join(', ')
    })
    setShowEditRewardModal(true)
  }

  /**
   * Crée une nouvelle règle côté Supabase.
   */
  const handleCreateRule = async () => {
    try {
      setIsSubmittingRule(true)
      const userId = ensureAuthenticated()
      const payload = {
        ...mapRuleFormToPayload(newRuleForm),
        is_active: newRuleForm.isActive
      }
      const createdRule = await LoyaltyAdminService.createRule(payload, userId)

      setRules(prev => [mapServiceRuleToUI(createdRule), ...prev])
      addNotification({
        type: 'success',
        title: 'Règle créée',
        message: 'La nouvelle règle a été enregistrée avec succès.'
      })
      setShowNewRuleModal(false)
      resetNewRuleForm()
    } catch (error) {
      console.error('Erreur création règle:', error)
      addNotification({
        type: 'error',
        title: 'Création impossible',
        message: getErrorMessage(error)
      })
    } finally {
      setIsSubmittingRule(false)
    }
  }

  /**
   * Met à jour une règle existante dans Supabase.
   */
  const handleUpdateRule = async () => {
    if (!selectedRule || !editRuleForm) {
      return
    }

    try {
      setIsSubmittingRule(true)
      const payload = mapRuleFormToPayload(editRuleForm)
      const updatedRule = await LoyaltyAdminService.updateRule(selectedRule.id, payload)

      setRules(prev => prev.map(rule => (rule.id === updatedRule.id ? mapServiceRuleToUI(updatedRule) : rule)))
      addNotification({
        type: 'success',
        title: 'Règle mise à jour',
        message: 'La règle a été synchronisée avec Supabase.'
      })
      setShowEditRuleModal(false)
      setSelectedRule(null)
      setEditRuleForm(null)
    } catch (error) {
      console.error('Erreur mise à jour règle:', error)
      addNotification({
        type: 'error',
        title: 'Mise à jour impossible',
        message: "La mise à jour de la règle a échoué."
      })
    } finally {
      setIsSubmittingRule(false)
    }
  }

  /**
   * Crée une nouvelle récompense dans Supabase.
   */
  const handleCreateReward = async () => {
    try {
      setIsSubmittingReward(true)
      const userId = ensureAuthenticated()
      const payload = {
        ...mapRewardFormToPayload(newRewardForm),
        is_active: newRewardForm.isActive
      }
      const createdReward = await LoyaltyAdminService.createReward(payload, userId)

      setRewards(prev => [mapServiceRewardToUI(createdReward), ...prev])
      addNotification({
        type: 'success',
        title: 'Récompense créée',
        message: 'La nouvelle récompense a été enregistrée avec succès.'
      })
      setShowNewRewardModal(false)
      resetNewRewardForm()
    } catch (error) {
      console.error('Erreur création récompense:', error)
      addNotification({
        type: 'error',
        title: 'Création impossible',
        message: getErrorMessage(error)
      })
    } finally {
      setIsSubmittingReward(false)
    }
  }

  /**
   * Met à jour une récompense existante dans Supabase.
   */
  const handleUpdateReward = async () => {
    if (!selectedReward || !editRewardForm) {
      return
    }

    try {
      setIsSubmittingReward(true)
      const payload = mapRewardFormToPayload(editRewardForm)
      const updatedReward = await LoyaltyAdminService.updateReward(selectedReward.id, payload)

      setRewards(prev => prev.map(reward => (reward.id === updatedReward.id ? mapServiceRewardToUI(updatedReward) : reward)))
      addNotification({
        type: 'success',
        title: 'Récompense mise à jour',
        message: 'La récompense a été synchronisée avec Supabase.'
      })
      setShowEditRewardModal(false)
      setSelectedReward(null)
      setEditRewardForm(null)
    } catch (error) {
      console.error('Erreur mise à jour récompense:', error)
      addNotification({
        type: 'error',
        title: 'Mise à jour impossible',
        message: "La mise à jour de la récompense a échoué."
      })
    } finally {
      setIsSubmittingReward(false)
    }
  }

  const handleExportData = () => {
    try {
      const csvContent = generateCSVReport()
      downloadCSV(csvContent, `rapport-points-fidelite-${new Date().toISOString().split('T')[0]}.csv`)

      addNotification({
        type: 'success',
        title: 'Export Réussi',
        message: 'Le rapport analytique a été exporté avec succès.'
      })
    } catch (error) {
      console.error('Erreur export rapport:', error)
      addNotification({
        type: 'error',
        title: 'Export impossible',
        message: "L'export du rapport a échoué."
      })
    }
  }

  const handleFilterRewards = () => {
    setShowFilterRewardsModal(true)
  }

  const applyAdvancedFilters = () => {
    // Appliquer tous les filtres avancés
    addNotification({
      type: 'success',
      title: 'Filtres Appliqués',
      message: 'Les filtres avancés ont été appliqués avec succès'
    })
    
    // Ici on pourrait implémenter la logique de filtrage réelle
    // Pour l'instant, on simule l'application des filtres
    console.log('Filtres appliqués:', {
      type: filterType,
      status: filterStatus,
      pointsCost: filterPointsCost,
      value: filterValue,
      categories: filterCategories,
      dateRange: filterDateRange,
      usage: filterUsage
    })
    
    setShowFilterRewardsModal(false)
  }

  const resetFilters = () => {
    setFilterType('all')
    setFilterStatus('all')
    setFilterPointsCost({ min: '', max: '' })
    setFilterValue({ min: '', max: '' })
    setFilterCategories([])
    setFilterDateRange({ start: '', end: '' })
    setFilterUsage({ min: '', max: '' })
    
    addNotification({
      type: 'info',
      title: 'Filtres Réinitialisés',
      message: 'Tous les filtres ont été remis à zéro'
    })
  }



  const handleViewReward = (reward: UILoyaltyReward) => {
    console.log('🔍 Voir récompense:', reward?.id, reward?.name)
    setViewReward(reward)
    setShowViewRewardModal(true)
  }

  const handleExportCSV = () => {
    try {
      const csvContent = generateTransactionsCSV(filteredTransactions)
      downloadCSV(csvContent, `transactions-points-${new Date().toISOString().split('T')[0]}.csv`)

      addNotification({
        type: 'success',
        title: 'Export CSV Réussi',
        message: 'Les transactions ont été exportées en CSV.'
      })
    } catch (error) {
      console.error('Erreur export CSV transactions:', error)
      addNotification({
        type: 'error',
        title: 'Export impossible',
        message: "L'export CSV des transactions a échoué."
      })
    }
  }

  const handleExportExcel = () => {
    try {
      const htmlContent = generateTransactionsExcelHtml()
      downloadBlob(htmlContent, `transactions-points-${new Date().toISOString().split('T')[0]}.xls`, 'application/vnd.ms-excel;charset=utf-8;')

      addNotification({
        type: 'success',
        title: 'Export Excel Réussi',
        message: 'Les transactions ont été exportées en Excel.'
      })
    } catch (error) {
      console.error('Erreur export Excel transactions:', error)
      addNotification({
        type: 'error',
        title: 'Export impossible',
        message: "L'export Excel des transactions a échoué."
      })
    }
  }

  const handleExportPDF = () => {
    try {
      const jsonContent = JSON.stringify({
        generatedAt: new Date().toISOString(),
        analyticsPeriod,
        analyticsData,
        topTransactions: transactions.slice(0, 20),
        topMembers: members.slice(0, 20)
      }, null, 2)

      downloadBlob(jsonContent, `rapport-points-fidelite-${analyticsPeriod}.json`, 'application/json')

      addNotification({
        type: 'success',
        title: 'Export JSON simulé',
        message: 'Le contenu du rapport a été généré. Remplacer par une génération PDF réelle ultérieurement.'
      })
    } catch (error) {
      console.error('Erreur export PDF:', error)
      addNotification({
        type: 'error',
        title: 'Export impossible',
        message: "La génération du rapport PDF a échoué."
      })
    }
  }

  const handleExportRawData = () => {
    try {
      const csvContent = generateRawDataCSV()
      downloadCSV(csvContent, `donnees-brutes-points-${new Date().toISOString().split('T')[0]}.csv`)

      addNotification({
        type: 'success',
        title: 'Export Données Brutes Réussi',
        message: 'Les données membres ont été exportées en CSV.'
      })
    } catch (error) {
      console.error('Erreur export données brutes:', error)
      addNotification({
        type: 'error',
        title: 'Export impossible',
        message: "L'export des données brutes a échoué."
      })
    }
  }

  const handleExportCharts = () => {
    try {
      const chartsData = buildChartsPayload()
      downloadBlob(JSON.stringify(chartsData, null, 2), `graphiques-points-fidelite-${analyticsPeriod}.json`, 'application/json')

      addNotification({
        type: 'success',
        title: 'Export Graphiques (JSON)',
        message: 'Les données nécessaires aux graphiques ont été exportées.'
      })
    } catch (error) {
      console.error('Erreur export graphiques:', error)
      addNotification({
        type: 'error',
        title: 'Export impossible',
        message: "L'export des graphiques a échoué."
      })
    }
  }

  const handleSendEmail = async () => {
    try {
      if (!user?.email) {
        addNotification({
          type: 'error',
          title: 'Envoi impossible',
          message: "Impossible d'identifier l'adresse email de réception."
        })
        return
      }

      setIsEmailSending(true)

      const payload = buildEmailPayload()
      const userMetadata = (user as unknown as { user_metadata?: { full_name?: string } }).user_metadata
      const recipients = [
        {
          email: user.email,
          name: userMetadata?.full_name ?? user.email
        }
      ]

      const summaryLines = [
        `Points en circulation: ${formatNumber(payload.analytics.totalPoints)}`,
        `Membres actifs: ${formatNumber(payload.analytics.activeMembers)}`,
        `Points échangés: ${formatNumber(payload.analytics.exchangedPoints)}`,
        `Valeur totale estimée: ${formatPrice(payload.analytics.totalValue)}`
      ]

      const textContent = [
        payload.subject,
        `Généré le ${new Date(payload.generatedAt).toLocaleString('fr-FR')}`,
        '',
        ...summaryLines
      ].join('\n')

      const htmlContent = `
        <html>
          <body>
            <h2 style="font-family: Arial, sans-serif; color: #1f2937;">${payload.subject}</h2>
            <p style="font-family: Arial, sans-serif; color: #4b5563;">Généré le ${new Date(payload.generatedAt).toLocaleString('fr-FR')}.</p>
            <ul style="font-family: Arial, sans-serif; color: #111827;">
              <li>${summaryLines[0]}</li>
              <li>${summaryLines[1]}</li>
              <li>${summaryLines[2]}</li>
              <li>${summaryLines[3]}</li>
            </ul>
          </body>
        </html>
      `

      const { error } = await supabase.functions.invoke('send-loyalty-report', {
        body: {
          subject: payload.subject,
          recipients,
          content: {
            text: textContent,
            html: htmlContent
          }
        }
      })

      if (error) {
        throw error
      }

      addNotification({
        type: 'success',
        title: 'Email envoyé',
        message: "Le rapport de fidélité a été transmis via Supabase SMTP."
      })
    } catch (error) {
      console.error('Erreur envoi email via Supabase:', error)
      addNotification({
        type: 'error',
        title: 'Envoi impossible',
        message: "L'envoi du rapport par email a échoué."
      })
    } finally {
      setIsEmailSending(false)
    }
  }

  const handleRefreshTransactions = async () => {
    try {
      setIsTransactionsLoading(true)

      const memberMap = members.reduce<Record<string, UILoyaltyMember>>((acc, member) => {
        acc[member.id] = member
        return acc
      }, {})

      const [refreshedTransactions, refreshedPointTransactions] = await Promise.all([
        LoyaltyAdminService.listTransactions(),
        fetchAdminPointsTransactions()
      ])

      const [refreshedTransfers, refreshedWithdrawals, refreshedExchanges] = await Promise.all([
        fetchAdminPointsTransfers(),
        fetchAdminPointsWithdrawals(),
        fetchAdminPointsExchanges()
      ])

      const uiTransactions = refreshedTransactions.map(transaction => mapServiceTransactionToUI(transaction, memberMap))
      const uiPointTransactions = refreshedPointTransactions.map(transaction => mapPointTransactionToUI(transaction, memberMap))

      const uiTransferTransactions = refreshedTransfers.flatMap(tr => mapTransferToUI(tr, memberMap))
      const uiWithdrawalTransactions = refreshedWithdrawals.map(w => mapWithdrawalToUI(w, memberMap))
      const uiExchangeTransactions = refreshedExchanges.map(e => mapExchangeToUI(e, memberMap))

      const seen = new Set<string>()
      const merged = [...uiTransactions, ...uiPointTransactions, ...uiTransferTransactions, ...uiWithdrawalTransactions, ...uiExchangeTransactions]
        .filter((it) => {
          if (seen.has(it.id)) return false
          seen.add(it.id)
          return true
        })

      const mergedSorted = merged
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      const uniqueUserIds = Array.from(
        new Set([
          ...members.map(m => m.id),
          ...mergedSorted.map(t => t.userId)
        ])
      ).filter(Boolean)

      const balancesHeaders = await ClientAuthService.buildAuthHeaders()
      const balancesRes = await fetch(`/api/finance/loyalty-balances?userIds=${encodeURIComponent(uniqueUserIds.join(','))}`, {
        headers: balancesHeaders
      })
      const balancesJson = (await balancesRes.json().catch(() => ({}))) as any
      const balancesRows = Array.isArray(balancesJson?.rows) ? balancesJson.rows : []
      const balancesByUser = (balancesRows as any[]).reduce((acc: Record<string, number>, row: any) => {
        acc[String(row.userId)] = Number(row.pointsBalance ?? 0)
        return acc
      }, {} as Record<string, number>)

      const freezeByUser = (balancesRows as any[]).reduce(
        (acc: Record<string, { isFrozen: boolean; frozenPoints: number }>, row: any) => {
          acc[String(row.userId)] = {
            isFrozen: Boolean(row.isFrozen ?? false),
            frozenPoints: Number(row.frozenPoints ?? 0)
          }
          return acc
        },
        {} as Record<string, { isFrozen: boolean; frozenPoints: number }>
      )

      const mergedWithBalances = mergedSorted.map((tx) => {
        const current = balancesByUser[tx.userId] ?? 0
        const nextTx = { ...tx, balance: current }
        balancesByUser[tx.userId] = current - Number(tx.delta ?? 0)
        return nextTx
      })

      setMembers(
        members.map((m) => {
          const freeze = freezeByUser[m.id]
          if (!freeze) return m as any
          return {
            ...(m as any),
            isFrozen: freeze.isFrozen,
            frozenPoints: freeze.frozenPoints
          }
        }) as any
      )
      setTransactions(mergedWithBalances)

      addNotification({
        type: 'success',
        title: 'Transactions actualisées',
        message: 'Les dernières opérations de points ont été synchronisées.'
      })
    } catch (error) {
      console.error('Erreur actualisation transactions:', error)
      addNotification({
        type: 'error',
        title: 'Actualisation impossible',
        message: "Le rafraîchissement des transactions a échoué."
      })
    } finally {
      setIsTransactionsLoading(false)
    }
  }

  // Fonctions utilitaires pour les exports
  const generateCSVReport = () => {
    const headers = ['Métrique', 'Valeur', 'Variation']
    const rows = [
      ['Points en Circulation', analyticsData.totalPoints, `${analyticsData.pointGrowth}%`],
      ['Membres Actifs', analyticsData.activeMembers, `${analyticsData.memberGrowth}%`],
      ['Points Échangés', analyticsData.exchangedPoints, `${analyticsData.monthlyGrowth}%`],
      ['Valeur Totale (FCFA)', analyticsData.totalValue, `${analyticsData.valueGrowth}%`]
    ]

    return buildCsvString([headers, ...rows])
  }

  const generateTransactionsCSV = (rowsInput: UILoyaltyTransaction[] = transactions) => {
    const headers = ['ID', 'Utilisateur', 'Type', 'Points', 'Solde', 'Description', 'Référence', 'Statut', 'Date']
    const rows = rowsInput.map(transaction => [
      transaction.id,
      transaction.userName,
      transaction.type,
      transaction.points,
      transaction.balance,
      transaction.description,
      transaction.reference,
      transaction.status,
      new Date(transaction.createdAt).toLocaleString('fr-FR')
    ])

    return buildCsvString([headers, ...rows])
  }

  const generateRawDataCSV = () => {
    const headers = ['ID', 'Nom', 'Email', 'Téléphone', 'Niveau', 'Points Totaux', 'Points Disponibles', 'Points Vie', 'Commandes', 'Dépenses (FCFA)', 'Parrainages', 'Dernière Activité']
    const rows = members.map(member => [
      member.id,
      member.name,
      member.email,
      member.phone,
      member.tier,
      member.totalPoints,
      member.availablePoints,
      member.lifetimePoints,
      member.totalOrders,
      member.totalSpent,
      member.referralCount,
      member.lastActivity ? new Date(member.lastActivity).toLocaleString('fr-FR') : ''
    ])

    return buildCsvString([headers, ...rows])
  }

  const downloadCSV = (content: string, filename: string) => {
    downloadBlob(content, filename, 'text/csv;charset=utf-8;')
  }

  const buildChartsPayload = () => ({
    generatedAt: new Date().toISOString(),
    analyticsPeriod,
    distributionByTier: tierDistribution.reduce<Record<string, number>>((acc, entry) => {
      acc[entry.tier] = entry.count
      return acc
    }, {}),
    pointsEvolution: monthlyPointsTrend.reduce<Record<string, number>>((acc, entry) => {
      acc[entry.label] = entry.points
      return acc
    }, {}),
    topMembers: members
      .slice()
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, 10)
      .map(member => ({
        name: member.name,
        tier: member.tier,
        points: member.totalPoints,
        orders: member.totalOrders,
        spent: member.totalSpent
      }))
  })

  const buildEmailPayload = () => ({
    subject: `Rapport Points de Fidélité - ${
      analyticsPeriod === '1month'
        ? '1 Mois'
        : analyticsPeriod === '3months'
          ? '3 Mois'
          : analyticsPeriod === '6months'
            ? '6 Mois'
            : '1 An'
    }`,
    generatedAt: new Date().toISOString(),
    analytics: analyticsData,
    highlights: {
      rules: rules.filter(rule => rule.isActive).length,
      rewards: rewards.filter(reward => reward.isActive).length,
      transactions: transactions.length,
      members: members.length
    },
    topMembers: members
      .slice()
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, 5)
      .map(member => ({
        name: member.name,
        tier: member.tier,
        totalPoints: member.totalPoints,
        totalSpent: member.totalSpent
      })),
    recentTransactions: transactions
      .slice(0, 5)
      .map(transaction => ({
        user: transaction.userName,
        type: transaction.type,
        points: transaction.points,
        status: transaction.status,
        createdAt: transaction.createdAt
      }))
  })

  /**
   * Construit un document HTML compatible Excel pour l'export des transactions.
   */
  const generateTransactionsExcelHtml = () => {
    const headers = [
      'ID',
      'Utilisateur',
      'Type',
      'Points',
      'Solde après',
      'Description',
      'Référence',
      'Statut',
      'Date de création'
    ]

    const rows = transactions.map(transaction => [
      transaction.id,
      transaction.userName,
      TRANSACTION_THEME[transaction.type].label,
      transaction.points,
      transaction.balance,
      transaction.description,
      transaction.reference,
      TRANSACTION_STATUS_LABEL[transaction.status].label,
      new Date(transaction.createdAt).toLocaleString('fr-FR')
    ])

    const tableRows = [headers, ...rows]
      .map(columns => `      <tr>${columns.map(column => `<td>${column ?? ''}</td>`).join('')}</tr>`)
      .join('\n')

    return [
      '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">',
      '<head>',
      '  <meta charset="UTF-8" />',
      '  <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Transactions</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->',
      '</head>',
      '<body>',
      '  <table border="1">',
      tableRows,
      '  </table>',
      '</body>',
      '</html>'
    ].join('\n')
  }

  const buildCsvString = (rows: (string | number | null | undefined)[][]) =>
    rows
      .map(row =>
        row
          .map(cell => {
            if (cell === null || cell === undefined) {
              return '""'
            }
            const normalized = typeof cell === 'number' ? cell : String(cell).replace(/"/g, '""')
            return `"${normalized}` + '"'
          })
          .join(',')
      )
      .join('\n')

  const downloadBlob = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Points de Fidélité</h2>
            <p className="text-gray-600 mt-2">
              Gestion complète du système de fidélité et des récompenses
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700"
              onClick={handleNewRule}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle Règle
            </Button>
            <Button variant="outline" disabled={isDataLoading}>
              {isDataLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              Exporter
            </Button>
          </div>
        </div>
      </div>

      {/* Statistiques des points */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-600">Points en Circulation</p>
                <p className="text-2xl font-bold text-amber-900">{formatNumber(analyticsData.totalPoints)}</p>
                <p className="text-xs text-green-600">+{analyticsData.pointGrowth}% ce mois</p>
              </div>
              <Star className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Membres Actifs</p>
                <p className="text-2xl font-bold text-green-900">{formatNumber(analyticsData.activeMembers)}</p>
                <p className="text-xs text-green-600">+{analyticsData.memberGrowth}% ce mois</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Points Échangés</p>
                <p className="text-2xl font-bold text-blue-900">{formatNumber(analyticsData.exchangedPoints)}</p>
                <p className="text-xs text-green-600">+{analyticsData.monthlyGrowth}% ce mois</p>
              </div>
              <Gift className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Valeur Totale</p>
                <p className="text-2xl font-bold text-purple-900">{formatPrice(analyticsData.totalValue)}</p>
                <p className="text-xs text-green-600">+{analyticsData.valueGrowth}% ce mois</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation par onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Vue d'Ensemble</TabsTrigger>
          <TabsTrigger value="points">Points & Fidélité</TabsTrigger>
          <TabsTrigger value="rewards">Récompenses</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribution des Points</CardTitle>
                <CardDescription>
                  Répartition par niveau de fidélité
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tierDistribution.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      Aucun membre pour le moment. Les données apparaîtront dès que des membres rejoindront le programme.
                    </p>
                  ) : (
                    tierDistribution.map(entry => (
                      <div key={entry.tier} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${entry.color}`}></div>
                            <span className="text-sm font-medium">{entry.label}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold">{formatNumber(entry.count)} membres</p>
                            <p className="text-xs text-gray-500">{entry.percentage}%</p>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-500"
                            style={{ width: `${Math.min(entry.percentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Activité Récente</CardTitle>
                <CardDescription>
                  Dernières transactions de points
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentTransactions.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      Aucune transaction récente. Revenez plus tard pour visualiser les nouvelles activités.
                    </p>
                  ) : (
                    recentTransactions.map(transaction => {
                      const theme = TRANSACTION_THEME[transaction.type]
                      const sign = transaction.type === 'earn' ? '+' : ''

                      return (
                        <div
                          key={transaction.id}
                          className={`flex items-center justify-between p-3 rounded border ${theme.containerClass.replace('bg', 'border')}`}
                        >
                          <div>
                            <span className="text-sm font-medium text-gray-900">{transaction.userName}</span>
                            <p className="text-xs text-gray-600">{transaction.description || 'Transaction de points'}</p>
                            <p className="text-xxs text-gray-400">
                              {new Date(transaction.createdAt).toLocaleString('fr-FR')}
                            </p>
                          </div>
                          <span className={`text-sm font-semibold ${theme.pointsClass}`}>
                            {sign}{transaction.points} points
                          </span>
                        </div>
                      )
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="points" className="mt-6">
          <PointsConfiguration
            config={pointsConfig}
            setConfig={setPointsConfig}
            categories={productCategories}
            isSaving={isSavingPointsConfig}
            isTesting={isTestingPointsConfig}
            isResetting={isResettingPointsConfig}
            onSave={handleSavePointsConfig}
            onTest={handleTestPointsConfig}
            onReset={handleResetPointsConfig}
          />
        </TabsContent>

        <TabsContent value="rewards" className="mt-6">
          <div className="space-y-6">
            {/* En-tête avec actions */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Récompenses Disponibles</h3>
                <p className="text-sm text-gray-600">Gestion des récompenses échangeables</p>
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  onClick={handleFilterRewards}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filtrer
                </Button>
                <Button onClick={() => setShowNewRewardModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle Récompense
                </Button>
              </div>
            </div>

            {/* Filtres et recherche */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Rechercher une récompense..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-md"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="discount">Réduction</SelectItem>
                  <SelectItem value="free_shipping">Livraison gratuite</SelectItem>
                  <SelectItem value="free_product">Produit gratuit</SelectItem>
                  <SelectItem value="cashback">Cashback</SelectItem>
                  <SelectItem value="voucher">Bon d'achat</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Liste des récompenses */}
            <div className="grid gap-4">
              {filteredRewards.map((reward) => (
                  <Card key={reward.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h4 className="font-semibold text-lg">{reward.name}</h4>
                            <Badge variant={reward.isActive ? "default" : "secondary"}>
                              {reward.isActive ? "Actif" : "Inactif"}
                            </Badge>
                            <Badge variant="outline" className="capitalize">
                              {reward.type.replace('_', ' ')}
                            </Badge>
                          </div>
                          
                          <p className="text-gray-600 mb-4">{reward.description}</p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                            <div>
                              <span className="text-gray-600">Coût:</span>
                              <p className="font-medium text-orange-600">{reward.pointsCost} points</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Valeur:</span>
                              <p className="font-medium">
                                {reward.valueType === 'percentage' ? `${reward.value}%` : 
                                 reward.valueType === 'fixed' ? formatPrice(reward.value) : 
                                 `${reward.value} points`}
                              </p>
                            </div>
                            {reward.minOrderAmount && (
                              <div>
                                <span className="text-gray-600">Commande min:</span>
                                <p className="font-medium">{formatPrice(reward.minOrderAmount)}</p>
                              </div>
                            )}
                            <div>
                              <span className="text-gray-600">Utilisation:</span>
                              <p className="font-medium">{reward.currentUsage} / {reward.maxUsage || '∞'}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Début:</span>
                              <p className="font-medium">{reward.startDate}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Fin:</span>
                              <p className="font-medium">{reward.endDate}</p>
                            </div>
                          </div>

                          {reward.categories.length > 0 && (
                            <div className="mt-4">
                              <h5 className="text-sm font-medium mb-2">Catégories:</h5>
                              <div className="flex flex-wrap gap-2">
                                {reward.categories.map((category, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {category === 'all' ? 'Toutes catégories' : category}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Barre de progression d'utilisation */}
                          <div className="mt-4">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-gray-600">Taux d'utilisation</span>
                              <span className="font-medium">
                                {reward.maxUsage && reward.maxUsage > 0
                                  ? Math.round((reward.currentUsage / reward.maxUsage) * 100)
                                  : 0}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  reward.maxUsage && reward.maxUsage > 0 && (reward.currentUsage / reward.maxUsage) > 0.8 ? 'bg-red-500' :
                                  reward.maxUsage && reward.maxUsage > 0 && (reward.currentUsage / reward.maxUsage) > 0.5 ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{width: `${reward.maxUsage && reward.maxUsage > 0 ? (reward.currentUsage / reward.maxUsage) * 100 : 0}%`}}
                              ></div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
                          <Switch
                            checked={reward.isActive}
                            onCheckedChange={() => handleRewardToggle(reward.id)}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            type="button"
                            onClick={() => handleEditReward(reward)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Modifier
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            type="button"
                            onClick={() => handleViewReward(reward)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Voir
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            type="button"
                            onClick={() => handleDeleteReward(reward.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Supprimer
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>

            {/* Statistiques des récompenses */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="text-center p-4">
                <p className="text-sm text-gray-600">Récompenses Actives</p>
                <p className="text-2xl font-bold text-green-600">
                  {rewards.filter(r => r.isActive).length}
                </p>
              </Card>
              <Card className="text-center p-4">
                <p className="text-sm text-gray-600">Total Récompenses</p>
                <p className="text-2xl font-bold text-blue-600">{rewards.length}</p>
              </Card>
              <Card className="text-center p-4">
                <p className="text-sm text-gray-600">Points Échangés</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatNumber(rewards.reduce((sum, r) => sum + (r.pointsCost * r.currentUsage), 0))}
                </p>
              </Card>
              <Card className="text-center p-4">
                <p className="text-sm text-gray-600">Utilisations Totales</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatNumber(rewards.reduce((sum, r) => sum + r.currentUsage, 0))}
                </p>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="mt-6">
          <div className="space-y-6">
            {/* En-tête avec actions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-gray-900">Historique des Transactions</h3>
                  <p className="text-sm text-gray-600">Suivi de toutes les opérations de points</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleOpenAwardPointsModal}
                  disabled={isTransactionsLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Attribuer des points
                </Button>
                <Button
                  onClick={handleOpenDebitPointsModal}
                  disabled={isTransactionsLoading}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <TrendingDown className="h-4 w-4 mr-2" />
                  Retirer des points
                </Button>
                <Button
                  variant="outline"
                  onClick={handleOpenFreezePointsModal}
                  disabled={isTransactionsLoading}
                >
                  <Snowflake className="h-4 w-4 mr-2" />
                  Geler / Dégeler
                </Button>
                <Button
                  variant="outline"
                  onClick={handleExportData}
                  disabled={isTransactionsLoading}
                >
                  {isTransactionsLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                  Exporter
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleRefreshTransactions}
                  disabled={isTransactionsLoading}
                >
                  {isTransactionsLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Actualiser
                </Button>
              </div>
            </div>

            {/* Filtres et recherche */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Rechercher une transaction..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-md"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="earn">Gain</SelectItem>
                  <SelectItem value="spend">Dépense</SelectItem>
                  <SelectItem value="expire">Expiration</SelectItem>
                  <SelectItem value="adjustment">Ajustement</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="failed">Échoué</SelectItem>
                  <SelectItem value="cancelled">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Statistiques des transactions */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <Card className="text-center p-4">
                <p className="text-sm text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold text-blue-600">{filteredTransactions.length}</p>
              </Card>
              <Card className="text-center p-4">
                <p className="text-sm text-gray-600">Points Gagnés</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatNumber(
                    filteredTransactions.reduce((sum, t) => {
                      const delta = Number(t.delta ?? 0)
                      return delta > 0 ? sum + delta : sum
                    }, 0)
                  )}
                </p>
              </Card>
              <Card className="text-center p-4">
                <p className="text-sm text-gray-600">Points Dépensés</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatNumber(
                    Math.abs(
                      filteredTransactions.reduce((sum, t) => {
                        const delta = Number(t.delta ?? 0)
                        return delta < 0 ? sum + delta : sum
                      }, 0)
                    )
                  )}
                </p>
              </Card>
              <Card className="text-center p-4">
                <p className="text-sm text-gray-600">Solde Total</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatNumber(members.reduce((sum, m) => sum + Number((m as any)?.availablePoints ?? 0), 0))}
                </p>
              </Card>
              <Card className="text-center p-4">
                <p className="text-sm text-gray-600">Points Transférés</p>
                <p className="text-2xl font-bold text-sky-600">
                  {formatNumber(
                    filteredTransactions
                      .filter(t =>
                        String(t.id || '').startsWith('pt_tr_in_') ||
                        String(t.id || '').startsWith('pt_tr_out_') ||
                        String(t.description || '').toLowerCase().startsWith('transfert')
                      )
                      .reduce((sum, t) => sum + Math.abs(Number(t.points ?? 0)), 0)
                  )}
                </p>
              </Card>
              <Card className="text-center p-4">
                <p className="text-sm text-gray-600">Points Gelés / Dégelés</p>
                <p className="text-2xl font-bold text-slate-700">
                  {formatNumber(
                    filteredTransactions
                      .filter(t => t.type === 'freeze' || t.type === 'unfreeze')
                      .reduce((sum, t) => sum + Math.abs(Number(t.points ?? 0)), 0)
                  )}
                </p>
              </Card>
            </div>

            {/* Liste des transactions */}
            <div className="space-y-3">
              {filteredTransactions
                .map((transaction) => (
                  <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            transaction.type === 'earn' ? 'bg-green-100' :
                            transaction.type === 'spend' ? 'bg-red-100' :
                            transaction.type === 'expire' ? 'bg-orange-100' :
                            transaction.type === 'freeze' ? 'bg-slate-100' :
                            transaction.type === 'unfreeze' ? 'bg-emerald-100' :
                            'bg-blue-100'
                          }`}>
                            {getTypeIcon(transaction.type)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{transaction.userName}</span>
                              <Badge variant="outline" className="text-xs">
                                {transaction.type === 'earn' ? 'Gain' :
                                 transaction.type === 'spend' ? 'Dépense' :
                                 transaction.type === 'expire' ? 'Expiration' :
                                 transaction.type === 'freeze' ? 'Gel' :
                                 transaction.type === 'unfreeze' ? 'Dégel' :
                                 'Ajustement'}
                              </Badge>
                              <Badge variant={TRANSACTION_STATUS_LABEL[transaction.status].badgeVariant}>
                                {TRANSACTION_STATUS_LABEL[transaction.status].label}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">{transaction.description}</p>
                            <p className="text-xs text-gray-500">Réf: {transaction.reference}</p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className={`text-lg font-semibold ${
                            transaction.type === 'earn' ? 'text-green-600' :
                            transaction.type === 'spend' ? 'text-red-600' :
                            transaction.type === 'expire' ? 'text-orange-600' :
                            transaction.type === 'freeze' ? 'text-slate-700' :
                            transaction.type === 'unfreeze' ? 'text-emerald-700' :
                            'text-blue-600'
                          }`}>
                            {transaction.type === 'earn' ? '+' : ''}{transaction.points} points
                          </div>
                          <p className="text-sm text-gray-600">Solde: {transaction.balance}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(transaction.createdAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-end gap-2">
                        {(() => {
                          const member = members.find(m => m.id === transaction.userId)
                          const isFrozen = Boolean((member as any)?.isFrozen ?? false)
                          const effectiveIsFrozen =
                            transaction.type === 'freeze'
                              ? true
                              : transaction.type === 'unfreeze'
                                ? false
                                : isFrozen

                          const cancelableKind = getCancelableKindFromTransaction(transaction)
                          const canShowCancel = Boolean(cancelableKind)
                          const canCancel = Boolean(extractCancelableOperationId(transaction, cancelableKind))
                          const isAdminCancelable = isAdminCancelableTransaction(transaction)

                          return (
                            <>
                              {(transaction.type === 'freeze' || transaction.type === 'unfreeze') ? (
                                transaction.type === 'freeze' ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                                    onClick={() => openFreezeFromTransaction(transaction, false)}
                                    disabled={!effectiveIsFrozen}
                                  >
                                    <Unlock className="h-4 w-4 mr-2" />
                                    Dégeler
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                                    onClick={() => openFreezeFromTransaction(transaction, true)}
                                    disabled={effectiveIsFrozen}
                                  >
                                    <Lock className="h-4 w-4 mr-2" />
                                    Geler
                                  </Button>
                                )
                              ) : (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                                    onClick={() => openFreezeFromTransaction(transaction, true)}
                                    disabled={effectiveIsFrozen}
                                  >
                                    <Lock className="h-4 w-4 mr-2" />
                                    Geler
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                                    onClick={() => openFreezeFromTransaction(transaction, false)}
                                    disabled={!effectiveIsFrozen}
                                  >
                                    <Unlock className="h-4 w-4 mr-2" />
                                    Dégeler
                                  </Button>
                                </>
                              )}

                              {transaction.type !== 'freeze' && transaction.type !== 'unfreeze' && (isAdminCancelable || canShowCancel) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-red-200 text-red-700 hover:bg-red-50"
                                  onClick={() => void handleCancelOperation(transaction)}
                                  disabled={isAdminCancelable ? false : !canCancel}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Annuler
                                </Button>
                              )}
                            </>
                          )
                        })()}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>

            {/* Pagination et actions */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Affichage de {transactions.length} transactions
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleExportCSV}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleExportExcel}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export Excel
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <div className="space-y-6">
            {/* Sélecteur de période */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Analytics et Statistiques</h3>
              <div className="flex gap-2">
                <Button
                  variant={analyticsPeriod === '1month' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateAnalyticsData('1month')}
                >
                  1 Mois
                </Button>
                <Button
                  variant={analyticsPeriod === '3months' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateAnalyticsData('3months')}
                >
                  3 Mois
                </Button>
                <Button
                  variant={analyticsPeriod === '6months' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateAnalyticsData('6months')}
                >
                  6 Mois
                </Button>
                <Button
                  variant={analyticsPeriod === '1year' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateAnalyticsData('1year')}
                >
                  1 An
                </Button>
              </div>
            </div>

            {/* Statistiques détaillées */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="text-center p-4">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-blue-100 rounded-full">
                  <Star className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-sm text-gray-600">Points en Circulation</p>
                <p className="text-2xl font-bold text-blue-600">{formatNumber(analyticsData.totalPoints)}</p>
                <p className="text-xs text-green-600">+{analyticsData.pointGrowth}% ce mois</p>
              </Card>
              
              <Card className="text-center p-4">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-green-100 rounded-full">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-sm text-gray-600">Membres Actifs</p>
                <p className="text-2xl font-bold text-green-600">{formatNumber(analyticsData.activeMembers)}</p>
                <p className="text-xs text-green-600">+{analyticsData.memberGrowth}% ce mois</p>
              </Card>
              
              <Card className="text-center p-4">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-orange-100 rounded-full">
                  <Gift className="h-6 w-6 text-orange-600" />
                </div>
                <p className="text-sm text-gray-600">Points Échangés</p>
                <p className="text-2xl font-bold text-orange-600">{formatNumber(analyticsData.exchangedPoints)}</p>
                <p className="text-xs text-green-600">+{analyticsData.monthlyGrowth}% ce mois</p>
              </Card>
              
              <Card className="text-center p-4">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-purple-100 rounded-full">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
                <p className="text-sm text-gray-600">Valeur Totale</p>
                <p className="text-2xl font-bold text-purple-600">{formatPrice(analyticsData.totalValue)}</p>
                <p className="text-xs text-green-600">+{analyticsData.valueGrowth}% ce mois</p>
              </Card>
            </div>

            {/* Graphiques et analyses détaillées */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Distribution des niveaux de fidélité */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Distribution par Niveau de Fidélité
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {tierDistribution.map(entry => (
                      <div key={entry.tier} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${entry.color}`}></div>
                            <span className="text-sm font-medium">{entry.label}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold">{formatNumber(entry.count)} membres</p>
                            <p className="text-xs text-gray-500">{entry.percentage}%</p>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-500"
                            style={{ width: `${Math.min(entry.percentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Évolution temporelle */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Évolution des Points ({analyticsPeriod === '1month' ? '1 Mois' : 
                                       analyticsPeriod === '3months' ? '3 Mois' :
                                       analyticsPeriod === '6months' ? '6 Mois' : '1 An'})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {monthlyPointsTrend.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        Aucune donnée sur la période sélectionnée.
                      </p>
                    ) : (
                      (() => {
                        const maxAbs = Math.max(
                          1,
                          ...monthlyPointsTrend.map((entry) => Math.abs(Number(entry.points ?? 0)))
                        )

                        return (
                          <>
                            <div className="flex items-center justify-between text-sm">
                              {monthlyPointsTrend.map((entry) => (
                                <span key={entry.label}>{entry.label}</span>
                              ))}
                            </div>

                            <div className="flex items-end justify-between h-32">
                              {monthlyPointsTrend.map((entry) => {
                                const value = Number(entry.points ?? 0)
                                const heightPct = Math.round((Math.abs(value) / maxAbs) * 100)
                                const barClass = value >= 0 ? 'bg-blue-500' : 'bg-red-500'
                                return (
                                  <div
                                    key={entry.label}
                                    className={`w-8 ${barClass} rounded-t`}
                                    style={{ height: `${heightPct}%` }}
                                    title={`${entry.label}: ${formatNumber(value)} pts`}
                                  ></div>
                                )
                              })}
                            </div>

                            <div className="text-center text-sm text-gray-600">
                              Croissance constante de +{analyticsData.pointGrowth}% en moyenne
                            </div>
                          </>
                        )
                      })()
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top des membres et performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5" />
                  Top 10 des Membres par Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-medium">Rang</th>
                        <th className="text-left py-2 font-medium">Membre</th>
                        <th className="text-left py-2 font-medium">Niveau</th>
                        <th className="text-left py-2 font-medium">Points Totaux</th>
                        <th className="text-left py-2 font-medium">Points Disponibles</th>
                        <th className="text-left py-2 font-medium">Commandes</th>
                        <th className="text-left py-2 font-medium">Dépenses</th>
                        <th className="text-left py-2 font-medium">Parrainages</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members
                        .sort((a, b) => b.totalPoints - a.totalPoints)
                        .slice(0, 10)
                        .map((member, index) => (
                          <tr key={member.id} className="border-b hover:bg-gray-50">
                            <td className="py-2">
                              <Badge variant={index < 3 ? "default" : "secondary"}>
                                #{index + 1}
                              </Badge>
                            </td>
                            <td className="py-2">
                              <div>
                                <p className="font-medium">{member.name}</p>
                                <p className="text-xs text-gray-500">{member.email}</p>
                              </div>
                            </td>
                            <td className="py-2">
                              {getTierBadge(member.tier)}
                            </td>
                            <td className="py-2 font-semibold">{formatNumber(member.totalPoints)}</td>
                            <td className="py-2">{formatNumber(member.availablePoints)}</td>
                            <td className="py-2">{member.totalOrders}</td>
                            <td className="py-2 font-semibold">{formatPrice(member.totalSpent)}</td>
                            <td className="py-2">{member.referralCount}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Actions et export */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Export et Rapports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    onClick={handleExportPDF}
                  >
                    <FileText className="h-4 w-4" />
                    Rapport Complet (PDF)
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    onClick={handleExportRawData}
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Données Brutes (CSV)
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    onClick={handleExportCharts}
                  >
                    <BarChart3 className="h-4 w-4" />
                    Graphiques (PNG)
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    onClick={handleSendEmail}
                    disabled={isEmailSending}
                  >
                    {isEmailSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                    {isEmailSending ? 'Envoi en cours...' : 'Envoyer par Email'}
                  </Button>
                </div>
                
                {/* Informations supplémentaires */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Informations sur les Rapports</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                      <p className="font-medium">Période sélectionnée:</p>
                      <p>{getAnalyticsPeriodLabel(analyticsPeriod)}</p>
                    </div>
                    <div>
                      <p className="font-medium">Dernière mise à jour:</p>
                      <p>{new Date().toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div>
                      <p className="font-medium">Format disponible:</p>
                      <p>PDF, CSV, PNG, Email</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal Attribution de Points */}
      <Dialog open={showAwardPointsModal} onOpenChange={setShowAwardPointsModal}>
        <DialogContent className="max-w-2xl max-h-[95vh] overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-lg text-gray-900 flex items-center gap-2">
              <Plus className="h-5 w-5 text-emerald-600" />
              Attribution de Points
            </DialogTitle>
          </DialogHeader>

          <div className="max-h-[65vh] overflow-y-auto pr-2">
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <p className="text-sm text-emerald-800">
                  <strong>Créditer un utilisateur</strong>
                </p>
                <p className="text-xs text-emerald-700 mt-1">
                  Cette opération ajoute des points au solde et crée une transaction de type <strong>adjustment</strong>.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Utilisateur *</Label>
                  <Popover open={awardUserSearchOpen} onOpenChange={setAwardUserSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={awardUserSearchOpen}
                        className="w-full justify-between"
                      >
                        <span className="truncate text-left">
                          {awardTarget
                            ? `${awardTarget.name} • ${awardTarget.email}`
                            : 'Rechercher un utilisateur...'}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Tapez un nom, email ou téléphone..."
                          value={awardUserSearchValue}
                          onValueChange={setAwardUserSearchValue}
                        />
                        <CommandList>
                          <CommandEmpty>Aucun utilisateur trouvé.</CommandEmpty>
                          <CommandGroup>
                            {(isAwardUsersLoading && awardCandidates.length === 0) ? (
                              <CommandItem disabled value="loading" className="py-6 text-sm text-gray-600 flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Chargement des utilisateurs...
                              </CommandItem>
                            ) : awardCandidates
                              .filter(candidate => {
                                const q = awardUserSearchValue.trim().toLowerCase()
                                if (!q) return true
                                return (
                                  candidate.name.toLowerCase().includes(q) ||
                                  candidate.email.toLowerCase().includes(q) ||
                                  candidate.phone.toLowerCase().includes(q)
                                )
                              })
                              .slice(0, 30)
                              .map(candidate => (
                                <CommandItem
                                  key={candidate.id}
                                  value={`${candidate.name} ${candidate.email} ${candidate.phone}`}
                                  onSelect={() => {
                                    setAwardTargetId(candidate.id)
                                    setAwardUserSearchOpen(false)
                                  }}
                                  className="flex items-center gap-2"
                                >
                                  <Check className={awardTargetId === candidate.id ? 'h-4 w-4 opacity-100' : 'h-4 w-4 opacity-0'} />
                                  <div className="flex-1">
                                    <div className="font-medium">{candidate.name}</div>
                                    <div className="text-xs text-gray-500">{candidate.email}{candidate.phone ? ` • ${candidate.phone}` : ''}</div>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {candidate.source === 'loyalty_member' ? (candidate.tier ?? 'bronze') : 'Compte'}
                                  </Badge>
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="awardPoints">Points à attribuer *</Label>
                    <Input
                      id="awardPoints"
                      type="number"
                      step="1"
                      value={awardPointsAmount}
                      onChange={(e) => setAwardPointsAmount(e.target.value)}
                      placeholder="Ex: 500"
                      className="border-gray-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Estimation valeur (FCFA)</Label>
                    <div className="h-10 px-3 flex items-center rounded-md border border-gray-200 bg-gray-50 text-sm text-gray-700">
                      {awardPointsPreview
                        ? `${Number((awardPointsPreview * Number(pointsConfig.pointValue || 1)).toFixed(2))} FCFA`
                        : '—'}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="awardDescription">Description (optionnel)</Label>
                  <Textarea
                    id="awardDescription"
                    value={awardDescription}
                    onChange={(e) => setAwardDescription(e.target.value)}
                    placeholder="Ex: Bonus de bienvenue / Compensation / Campagne marketing..."
                    rows={3}
                    className="border-gray-300"
                  />
                </div>

                {awardTarget ? (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Résumé</p>
                        <p className="text-xs text-gray-600">{awardTarget.name} • {awardTarget.email}</p>
                      </div>
                      <Badge variant="outline">
                        {awardTarget.source === 'loyalty_member' ? (awardTarget.tier ?? 'bronze') : 'Compte'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm">
                      <div>
                        <p className="text-gray-600">Solde actuel</p>
                        <p className="font-semibold text-gray-900">{formatNumber(awardTarget.availablePoints)} pts</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Points ajoutés</p>
                        <p className="font-semibold text-emerald-700">{awardPointsPreview ? `+${formatNumber(awardPointsPreview)}` : '—'} pts</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Solde après</p>
                        <p className="font-semibold text-gray-900">
                          {awardPointsPreview
                            ? `${formatNumber(awardTarget.availablePoints + awardPointsPreview)} pts`
                            : '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4 pb-2 flex-shrink-0 bg-white border-t border-gray-100 mt-4">
            <Button
              onClick={handleAwardPoints}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={isAwardingPoints}
            >
              {isAwardingPoints ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              {isAwardingPoints ? 'Attribution...' : 'Attribuer'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowAwardPointsModal(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
              disabled={isAwardingPoints}
            >
              Annuler
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Retrait de Points */}
      <Dialog open={showDebitPointsModal} onOpenChange={setShowDebitPointsModal}>
        <DialogContent className="max-w-2xl max-h-[95vh] overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-lg text-gray-900 flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              Retrait de Points
            </DialogTitle>
          </DialogHeader>

          <div className="max-h-[65vh] overflow-y-auto pr-2">
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  <strong>Débiter un utilisateur</strong>
                </p>
                <p className="text-xs text-red-700 mt-1">
                  Cette opération retire des points au solde et crée une transaction de type <strong>spend</strong>.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Utilisateur *</Label>
                  <Popover open={debitUserSearchOpen} onOpenChange={setDebitUserSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={debitUserSearchOpen}
                        className="w-full justify-between"
                      >
                        <span className="truncate text-left">
                          {debitTarget
                            ? `${debitTarget.name} • ${debitTarget.email}`
                            : 'Rechercher un utilisateur...'}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Tapez un nom, email ou téléphone..."
                          value={debitUserSearchValue}
                          onValueChange={setDebitUserSearchValue}
                        />
                        <CommandList>
                          <CommandEmpty>Aucun utilisateur trouvé.</CommandEmpty>
                          <CommandGroup>
                            {(isAwardUsersLoading && awardCandidates.length === 0) ? (
                              <CommandItem disabled value="loading" className="py-6 text-sm text-gray-600 flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Chargement des utilisateurs...
                              </CommandItem>
                            ) : awardCandidates
                              .filter(candidate => {
                                const q = debitUserSearchValue.trim().toLowerCase()
                                if (!q) return true
                                return (
                                  candidate.name.toLowerCase().includes(q) ||
                                  candidate.email.toLowerCase().includes(q) ||
                                  candidate.phone.toLowerCase().includes(q)
                                )
                              })
                              .slice(0, 30)
                              .map(candidate => (
                                <CommandItem
                                  key={candidate.id}
                                  value={`${candidate.name} ${candidate.email} ${candidate.phone}`}
                                  onSelect={() => {
                                    setDebitTargetId(candidate.id)
                                    setDebitUserSearchOpen(false)
                                  }}
                                  className="flex items-center gap-2"
                                >
                                  <Check className={debitTargetId === candidate.id ? 'h-4 w-4 opacity-100' : 'h-4 w-4 opacity-0'} />
                                  <div className="flex-1">
                                    <div className="font-medium">{candidate.name}</div>
                                    <div className="text-xs text-gray-500">{candidate.email}{candidate.phone ? ` • ${candidate.phone}` : ''}</div>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {candidate.source === 'loyalty_member' ? (candidate.tier ?? 'bronze') : 'Compte'}
                                  </Badge>
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="debitPoints">Points à retirer *</Label>
                    <Input
                      id="debitPoints"
                      type="number"
                      step="1"
                      value={debitPointsAmount}
                      onChange={(e) => setDebitPointsAmount(e.target.value)}
                      placeholder="Ex: 200"
                      className="border-gray-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Estimation valeur (FCFA)</Label>
                    <div className="h-10 px-3 flex items-center rounded-md border border-gray-200 bg-gray-50 text-sm text-gray-700">
                      {debitPointsPreview
                        ? `${Number((debitPointsPreview * Number(pointsConfig.pointValue || 1)).toFixed(2))} FCFA`
                        : '—'}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="debitDescription">Description (optionnel)</Label>
                  <Textarea
                    id="debitDescription"
                    value={debitDescription}
                    onChange={(e) => setDebitDescription(e.target.value)}
                    placeholder="Ex: Correction / Sanction / Ajustement..."
                    rows={3}
                    className="border-gray-300"
                  />
                </div>

                {debitTarget ? (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Résumé</p>
                        <p className="text-xs text-gray-600">{debitTarget.name} • {debitTarget.email}</p>
                      </div>
                      <Badge variant="outline">
                        {debitTarget.source === 'loyalty_member' ? (debitTarget.tier ?? 'bronze') : 'Compte'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm">
                      <div>
                        <p className="text-gray-600">Solde actuel</p>
                        <p className="font-semibold text-gray-900">{formatNumber(debitTarget.availablePoints)} pts</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Points retirés</p>
                        <p className="font-semibold text-red-700">{debitPointsPreview ? `-${formatNumber(debitPointsPreview)}` : '—'} pts</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Solde après</p>
                        <p className="font-semibold text-gray-900">
                          {debitPointsPreview
                            ? `${formatNumber(Math.max(0, debitTarget.availablePoints - debitPointsPreview))} pts`
                            : '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4 pb-2 flex-shrink-0 bg-white border-t border-gray-100 mt-4">
            <Button
              onClick={handleDebitPoints}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isDebitingPoints}
            >
              {isDebitingPoints ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <TrendingDown className="h-4 w-4 mr-2" />}
              {isDebitingPoints ? 'Retrait...' : 'Retirer'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowDebitPointsModal(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
              disabled={isDebitingPoints}
            >
              Annuler
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Gel / Dégel de Points */}
      <Dialog open={showFreezePointsModal} onOpenChange={setShowFreezePointsModal}>
        <DialogContent className="max-w-2xl max-h-[95vh] overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-lg text-gray-900 flex items-center gap-2">
              <Snowflake className="h-5 w-5 text-blue-600" />
              {freezeIsFrozen ? 'Geler des Points' : 'Dégeler des Points'}
            </DialogTitle>
            <DialogDescription>
              Consultez et ajustez l'état de gel des points.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[65vh] overflow-y-auto pr-2">
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Geler un compte</strong>
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Lorsque le compte est gelé, l'utilisateur ne peut plus transférer ses points (sauf admin).
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Utilisateur *</Label>
                  <Popover open={freezeUserSearchOpen} onOpenChange={setFreezeUserSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={freezeUserSearchOpen}
                        className="w-full justify-between"
                      >
                        <span className="truncate text-left">
                          {freezeTarget
                            ? `${freezeTarget.name} • ${freezeTarget.email}`
                            : 'Rechercher un utilisateur...'}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Tapez un nom, email ou téléphone..."
                          value={freezeUserSearchValue}
                          onValueChange={setFreezeUserSearchValue}
                        />
                        <CommandList>
                          <CommandEmpty>Aucun utilisateur trouvé.</CommandEmpty>
                          <CommandGroup>
                            {(isAwardUsersLoading && awardCandidates.length === 0) ? (
                              <CommandItem disabled value="loading" className="py-6 text-sm text-gray-600 flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Chargement des utilisateurs...
                              </CommandItem>
                            ) : awardCandidates
                              .filter(candidate => {
                                const q = freezeUserSearchValue.trim().toLowerCase()
                                if (!q) return true
                                return (
                                  candidate.name.toLowerCase().includes(q) ||
                                  candidate.email.toLowerCase().includes(q) ||
                                  candidate.phone.toLowerCase().includes(q)
                                )
                              })
                              .slice(0, 30)
                              .map(candidate => (
                                <CommandItem
                                  key={candidate.id}
                                  value={`${candidate.name} ${candidate.email} ${candidate.phone}`}
                                  onSelect={() => {
                                    setFreezeTargetId(candidate.id)
                                    setFreezeUserSearchOpen(false)
                                  }}
                                  className="flex items-center gap-2"
                                >
                                  <Check className={freezeTargetId === candidate.id ? 'h-4 w-4 opacity-100' : 'h-4 w-4 opacity-0'} />
                                  <div className="flex-1">
                                    <div className="font-medium">{candidate.name}</div>
                                    <div className="text-xs text-gray-500">{candidate.email}{candidate.phone ? ` • ${candidate.phone}` : ''}</div>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {candidate.source === 'loyalty_member' ? (candidate.tier ?? 'bronze') : 'Compte'}
                                  </Badge>
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Action *</Label>
                    <Select
                      value={freezeIsFrozen ? 'freeze' : 'unfreeze'}
                      onValueChange={(value) => setFreezeIsFrozen(value === 'freeze')}
                    >
                      <SelectTrigger className="border-gray-300">
                        <SelectValue placeholder="Choisir" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="freeze">Geler</SelectItem>
                        <SelectItem value="unfreeze">Dégeler</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Solde (info)</Label>
                    <div className="h-10 px-3 flex items-center rounded-md border border-gray-200 bg-gray-50 text-sm text-gray-700">
                      {freezeTarget ? `${formatNumber(freezeTarget.availablePoints)} pts` : '—'}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="freezeReason">Raison (optionnel)</Label>
                  <Textarea
                    id="freezeReason"
                    value={freezeReason}
                    onChange={(e) => setFreezeReason(e.target.value)}
                    placeholder="Ex: Suspicion de fraude / Vérification en cours..."
                    rows={3}
                    className="border-gray-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="freezePointsAmount">Nombre de points (optionnel)</Label>
                  <Input
                    id="freezePointsAmount"
                    type="number"
                    inputMode="numeric"
                    value={freezePointsAmount}
                    onChange={(e) => setFreezePointsAmount(e.target.value)}
                    placeholder={freezeIsFrozen ? 'Ex: 100 (laisser vide = geler tout le solde disponible)' : 'Ex: 50 (laisser vide = dégeler tout le gel)'}
                    className="border-gray-300"
                    min={1}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4 pb-2 flex-shrink-0 bg-white border-t border-gray-100 mt-4">
            <Button
              onClick={handleFreezePoints}
              className={freezeIsFrozen ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}
              disabled={isFreezingPoints}
            >
              {isFreezingPoints ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Snowflake className="h-4 w-4 mr-2" />}
              {isFreezingPoints ? 'Mise à jour...' : (freezeIsFrozen ? 'Geler' : 'Dégeler')}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowFreezePointsModal(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
              disabled={isFreezingPoints}
            >
              Annuler
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Voir Récompense */}
      <Dialog
        open={showViewRewardModal}
        onOpenChange={(open) => {
          setShowViewRewardModal(open)
          if (!open) {
            setViewReward(null)
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[95vh] overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-lg text-gray-900 flex items-center gap-2">
              <Eye className="h-5 w-5 text-gray-700" />
              Détails de la Récompense
            </DialogTitle>
            <DialogDescription>
              Visualisation en lecture seule des informations de la récompense.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[70vh] overflow-y-auto pr-2">
            {!viewReward ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                Aucune récompense sélectionnée.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm text-gray-500">Nom</div>
                      <div className="text-lg font-semibold text-gray-900">{viewReward.name}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={viewReward.isActive ? 'default' : 'secondary'}>
                        {viewReward.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline">{viewReward.type}</Badge>
                    </div>
                  </div>
                  {viewReward.description ? (
                    <p className="text-sm text-gray-700 mt-2">{viewReward.description}</p>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Coût en points</Label>
                    <div className="h-10 px-3 flex items-center rounded-md border border-gray-200 bg-white text-sm text-gray-900">
                      {formatNumber(Number(viewReward.pointsCost ?? 0))} pts
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Valeur</Label>
                    <div className="h-10 px-3 flex items-center rounded-md border border-gray-200 bg-white text-sm text-gray-900">
                      {formatNumber(Number(viewReward.value ?? 0))} ({viewReward.valueType})
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Montant minimum de commande</Label>
                    <div className="h-10 px-3 flex items-center rounded-md border border-gray-200 bg-white text-sm text-gray-900">
                      {viewReward.minOrderAmount !== undefined ? formatNumber(Number(viewReward.minOrderAmount)) : '—'}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Utilisation</Label>
                    <div className="h-10 px-3 flex items-center justify-between rounded-md border border-gray-200 bg-white text-sm text-gray-900">
                      <span>Actuelle: {formatNumber(Number(viewReward.currentUsage ?? 0))}</span>
                      <span>Max: {viewReward.maxUsage ? formatNumber(Number(viewReward.maxUsage)) : 'Illimité'}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Période</Label>
                    <div className="rounded-md border border-gray-200 bg-white p-3 text-sm text-gray-900">
                      <div className="flex items-center justify-between">
                        <span>Début</span>
                        <span>{viewReward.startDate ? new Date(viewReward.startDate).toLocaleDateString('fr-FR') : '—'}</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <span>Fin</span>
                        <span>{viewReward.endDate ? new Date(viewReward.endDate).toLocaleDateString('fr-FR') : '—'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Catégories</Label>
                    <div className="rounded-md border border-gray-200 bg-white p-3">
                      {viewReward.categories.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {viewReward.categories.map((cat) => (
                            <Badge key={cat} variant="secondary">{cat}</Badge>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-700">—</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4 pb-2 flex-shrink-0 bg-white border-t border-gray-100 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowViewRewardModal(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Nouvelle Règle */}
      <Dialog open={showNewRuleModal} onOpenChange={setShowNewRuleModal}>
        <DialogContent className="max-w-2xl max-h-[95vh] overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-lg text-gray-900 flex items-center gap-2">
              <Plus className="h-5 w-5 text-amber-600" />
              Nouvelle Règle de Fidélité
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[65vh] overflow-y-auto pr-2">
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>Créer une nouvelle règle de fidélité</strong>
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  Définissez les conditions d'attribution des points de fidélité
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="ruleName">Nom de la règle *</Label>
                  <Input
                    id="ruleName"
                    value={newRuleForm.name}
                    onChange={(event) => setNewRuleForm(prev => ({ ...prev, name: event.target.value }))}
                    placeholder="Ex: Points par achat"
                    className="mt-1 border-gray-300 focus:border-amber-600 focus:ring-amber-600"
                  />
                </div>
                
                <div>
                  <Label htmlFor="ruleType">Type de règle *</Label>
                  <Select value={newRuleForm.type} onValueChange={(value) => setNewRuleForm(prev => ({ ...prev, type: value as UILoyaltyRule['type'] }))}>
                    <SelectTrigger className="mt-1 border-gray-300 focus:border-amber-600 focus:ring-amber-600">
                      <SelectValue placeholder="Sélectionner le type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="purchase">Achat</SelectItem>
                      <SelectItem value="bonus">Bonus</SelectItem>
                      <SelectItem value="referral">Parrainage</SelectItem>
                      <SelectItem value="social">Réseaux sociaux</SelectItem>
                      <SelectItem value="custom">Personnalisé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="ruleDescription">Description *</Label>
                  <Textarea
                    id="ruleDescription"
                    value={newRuleForm.description}
                    onChange={(event) => setNewRuleForm(prev => ({ ...prev, description: event.target.value }))}
                    placeholder="Description détaillée de la règle..."
                    className="mt-1 border-gray-300 focus:border-amber-600 focus:ring-amber-600"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="pointsValue">Valeur en points *</Label>
                    <Input
                      id="pointsValue"
                      type="number"
                      value={newRuleForm.pointsValue}
                      onChange={(event) => setNewRuleForm(prev => ({ ...prev, pointsValue: event.target.value }))}
                      placeholder="Ex: 1"
                      className="mt-1 border-gray-300 focus:border-amber-600 focus:ring-amber-600"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="multiplier">Multiplicateur</Label>
                    <Input
                      id="multiplier"
                      type="number"
                      step="0.1"
                      value={newRuleForm.multiplier}
                      onChange={(event) => setNewRuleForm(prev => ({ ...prev, multiplier: event.target.value }))}
                      placeholder="Ex: 1.2"
                      className="mt-1 border-gray-300 focus:border-amber-600 focus:ring-amber-600"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="conditions">Conditions</Label>
                  <Textarea
                    id="conditions"
                    value={newRuleForm.conditions}
                    onChange={(event) => setNewRuleForm(prev => ({ ...prev, conditions: event.target.value }))}
                    placeholder="Conditions d'application de la règle..."
                    className="mt-1 border-gray-300 focus:border-amber-600 focus:ring-amber-600"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 pt-4 pb-2 flex-shrink-0 bg-white border-t border-gray-100 mt-4">
            <Button 
              onClick={handleCreateRule}
              className="bg-amber-600 hover:bg-amber-700 text-white"
              disabled={isSubmittingRule}
            >
              {isSubmittingRule ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              {isSubmittingRule ? 'Création...' : 'Créer la Règle'}
            </Button>
            <Button 
              variant="outline"
              onClick={() => setShowNewRuleModal(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Nouvelle Récompense */}
      <Dialog open={showNewRewardModal} onOpenChange={setShowNewRewardModal}>
        <DialogContent className="max-w-2xl max-h-[95vh] overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-lg text-gray-900 flex items-center gap-2">
              <Gift className="h-5 w-5 text-green-600" />
              Nouvelle Récompense
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[65vh] overflow-y-auto pr-2">
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Créer une nouvelle récompense</strong>
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Définissez les récompenses que les membres peuvent échanger
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="rewardName">Nom de la récompense *</Label>
                  <Input
                    id="rewardName"
                    value={newRewardForm.name}
                    onChange={(event) => setNewRewardForm(prev => ({ ...prev, name: event.target.value }))}
                    placeholder="Ex: Réduction 10%"
                    className="mt-1 border-gray-300 focus:border-green-600 focus:ring-green-600"
                  />
                </div>
                
                <div>
                  <Label htmlFor="rewardType">Type de récompense *</Label>
                  <Select value={newRewardForm.type} onValueChange={(value) => setNewRewardForm(prev => ({ ...prev, type: value as UILoyaltyReward['type'] }))}>
                    <SelectTrigger className="mt-1 border-gray-300 focus:border-green-600 focus:ring-green-600">
                      <SelectValue placeholder="Sélectionner le type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="discount">Réduction</SelectItem>
                      <SelectItem value="free_shipping">Livraison gratuite</SelectItem>
                      <SelectItem value="free_product">Produit gratuit</SelectItem>
                      <SelectItem value="cashback">Cashback</SelectItem>
                      <SelectItem value="voucher">Bon d'achat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="rewardDescription">Description *</Label>
                  <Textarea
                    id="rewardDescription"
                    value={newRewardForm.description}
                    onChange={(event) => setNewRewardForm(prev => ({ ...prev, description: event.target.value }))}
                    placeholder="Description détaillée de la récompense..."
                    className="mt-1 border-gray-300 focus:border-green-600 focus:ring-green-600"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="pointsCost">Coût en points *</Label>
                    <Input
                      id="pointsCost"
                      type="number"
                      value={newRewardForm.pointsCost}
                      onChange={(event) => setNewRewardForm(prev => ({ ...prev, pointsCost: event.target.value }))}
                      placeholder="Ex: 500"
                      className="mt-1 border-gray-300 focus:border-green-600 focus:ring-green-600"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="rewardValue">Valeur de la récompense *</Label>
                    <Input
                      id="rewardValue"
                      type="number"
                      value={newRewardForm.value}
                      onChange={(event) => setNewRewardForm(prev => ({ ...prev, value: event.target.value }))}
                      placeholder="Ex: 10"
                      className="mt-1 border-gray-300 focus:border-green-600 focus:ring-green-600"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="maxUsage">Utilisation maximale</Label>
                  <Input
                    id="maxUsage"
                    type="number"
                    value={newRewardForm.maxUsage}
                    onChange={(event) => setNewRewardForm(prev => ({ ...prev, maxUsage: event.target.value }))}
                    placeholder="Ex: 1000"
                    className="mt-1 border-gray-300 focus:border-green-600 focus:ring-green-600"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 pt-4 pb-2 flex-shrink-0 bg-white border-t border-gray-100 mt-4">
            <Button 
              onClick={handleCreateReward}
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={isSubmittingReward}
            >
              {isSubmittingReward ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Gift className="h-4 w-4 mr-2" />}
              {isSubmittingReward ? 'Création...' : 'Créer la Récompense'}
            </Button>
            <Button 
              variant="outline"
              onClick={() => setShowNewRewardModal(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Édition Règle */}
      <Dialog open={showEditRuleModal} onOpenChange={setShowEditRuleModal}>
        <DialogContent className="max-w-2xl max-h-[95vh] overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-lg text-gray-900 flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-600" />
              Modifier la Règle
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[65vh] overflow-y-auto pr-2">
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Modifier la règle de fidélité</strong>
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Ajustez les paramètres de la règle existante
                </p>
              </div>
              
              {selectedRule && editRuleForm && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="editRuleName">Nom de la règle</Label>
                    <Input
                      id="editRuleName"
                      value={editRuleForm.name}
                      onChange={(event) => setEditRuleForm(prev => prev ? { ...prev, name: event.target.value } : prev)}
                      className="mt-1 border-gray-300 focus:border-blue-600 focus:ring-blue-600"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="editRuleDescription">Description</Label>
                    <Textarea
                      id="editRuleDescription"
                      value={editRuleForm.description}
                      onChange={(event) => setEditRuleForm(prev => prev ? { ...prev, description: event.target.value } : prev)}
                      className="mt-1 border-gray-300 focus:border-blue-600 focus:ring-blue-600"
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="editPointsValue">Valeur en points</Label>
                      <Input
                        id="editPointsValue"
                        type="number"
                        value={editRuleForm.pointsValue}
                        onChange={(event) => setEditRuleForm(prev => prev ? { ...prev, pointsValue: event.target.value } : prev)}
                        className="mt-1 border-gray-300 focus:border-blue-600 focus:ring-blue-600"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="editMultiplier">Multiplicateur</Label>
                      <Input
                        id="editMultiplier"
                        type="number"
                        step="0.1"
                        value={editRuleForm.multiplier}
                        onChange={(event) => setEditRuleForm(prev => prev ? { ...prev, multiplier: event.target.value } : prev)}
                        className="mt-1 border-gray-300 focus:border-blue-600 focus:ring-blue-600"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="editConditions">Conditions</Label>
                    <Textarea
                      id="editConditions"
                      value={editRuleForm.conditions}
                      onChange={(event) => setEditRuleForm(prev => prev ? { ...prev, conditions: event.target.value } : prev)}
                      className="mt-1 border-gray-300 focus:border-blue-600 focus:ring-blue-600"
                      rows={2}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-2 pt-4 pb-2 flex-shrink-0 bg-white border-t border-gray-100 mt-4">
            <Button 
              onClick={handleUpdateRule}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isSubmittingRule || !editRuleForm}
            >
              {isSubmittingRule ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Edit className="h-4 w-4 mr-2" />}
              {isSubmittingRule ? 'Sauvegarde...' : 'Sauvegarder les Modifications'}
            </Button>
            <Button 
              variant="outline"
              onClick={() => setShowEditRuleModal(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Édition Récompense */}
      <Dialog open={showEditRewardModal} onOpenChange={setShowEditRewardModal}>
        <DialogContent className="max-w-2xl max-h-[95vh] overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-lg text-gray-900 flex items-center gap-2">
              <Edit className="h-5 w-5 text-green-600" />
              Modifier la Récompense
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[65vh] overflow-y-auto pr-2">
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Modifier la récompense</strong>
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Ajustez les paramètres de la récompense existante
                </p>
              </div>
              
              {selectedReward && editRewardForm && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="editRewardName">Nom de la récompense</Label>
                    <Input
                      id="editRewardName"
                      value={editRewardForm.name}
                      onChange={(event) => setEditRewardForm(prev => prev ? { ...prev, name: event.target.value } : prev)}
                      className="mt-1 border-gray-300 focus:border-green-600 focus:ring-green-600"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="editRewardDescription">Description</Label>
                    <Textarea
                      id="editRewardDescription"
                      value={editRewardForm.description}
                      onChange={(event) => setEditRewardForm(prev => prev ? { ...prev, description: event.target.value } : prev)}
                      className="mt-1 border-gray-300 focus:border-green-600 focus:ring-green-600"
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="editPointsCost">Coût en points</Label>
                      <Input
                        id="editPointsCost"
                        type="number"
                        value={editRewardForm.pointsCost}
                        onChange={(event) => setEditRewardForm(prev => prev ? { ...prev, pointsCost: event.target.value } : prev)}
                        className="mt-1 border-gray-300 focus:border-green-600 focus:ring-green-600"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="editRewardValue">Valeur de la récompense</Label>
                      <Input
                        id="editRewardValue"
                        type="number"
                        value={editRewardForm.value}
                        onChange={(event) => setEditRewardForm(prev => prev ? { ...prev, value: event.target.value } : prev)}
                        className="mt-1 border-gray-300 focus:border-green-600 focus:ring-green-600"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="editMaxUsage">Utilisation maximale</Label>
                    <Input
                      id="editMaxUsage"
                      type="number"
                      value={editRewardForm.maxUsage}
                      onChange={(event) => setEditRewardForm(prev => prev ? { ...prev, maxUsage: event.target.value } : prev)}
                      className="mt-1 border-gray-300 focus:border-green-600 focus:ring-green-600"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-2 pt-4 pb-2 flex-shrink-0 bg-white border-t border-gray-100 mt-4">
            <Button 
              onClick={handleUpdateReward}
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={isSubmittingReward || !editRewardForm}
            >
              {isSubmittingReward ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Edit className="h-4 w-4 mr-2" />}
              {isSubmittingReward ? 'Sauvegarde...' : 'Sauvegarder les Modifications'}
            </Button>
            <Button 
              variant="outline"
              onClick={() => setShowEditRewardModal(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </Button>
          </div>
        </DialogContent>
      </Dialog>

       {/* Modal Filtrage Avancé des Récompenses */}
       <Dialog open={showFilterRewardsModal} onOpenChange={setShowFilterRewardsModal}>
         <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden">
           <DialogHeader className="flex-shrink-0">
             <DialogTitle className="text-lg text-gray-900 flex items-center gap-2">
               <Filter className="h-5 w-5 text-blue-600" />
               Filtrage Avancé des Récompenses
             </DialogTitle>
           </DialogHeader>
           <div className="max-h-[70vh] overflow-y-auto pr-2">
             <div className="space-y-6">
               {/* Informations */}
               <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                 <p className="text-sm text-blue-800">
                   <strong>Filtrage avancé des récompenses</strong>
                 </p>
                 <p className="text-xs text-blue-700 mt-1">
                   Définissez des critères précis pour filtrer les récompenses selon vos besoins
                 </p>
               </div>

               {/* Filtres de base */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                   <Label htmlFor="filterType">Type de récompense</Label>
                   <Select value={filterType} onValueChange={setFilterType}>
                     <SelectTrigger className="mt-1 border-gray-300 focus:border-blue-600 focus:ring-blue-600">
                       <SelectValue placeholder="Tous les types" />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="all">Tous les types</SelectItem>
                       <SelectItem value="discount">Réduction</SelectItem>
                       <SelectItem value="free_shipping">Livraison gratuite</SelectItem>
                       <SelectItem value="free_product">Produit gratuit</SelectItem>
                       <SelectItem value="cashback">Cashback</SelectItem>
                       <SelectItem value="voucher">Bon d'achat</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>

                 <div>
                   <Label htmlFor="filterStatus">Statut</Label>
                   <Select value={filterStatus} onValueChange={setFilterStatus}>
                     <SelectTrigger className="mt-1 border-gray-300 focus:border-blue-600 focus:ring-blue-600">
                       <SelectValue placeholder="Tous les statuts" />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="all">Tous les statuts</SelectItem>
                       <SelectItem value="active">Actif</SelectItem>
                       <SelectItem value="inactive">Inactif</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
               </div>

               {/* Filtres de coût en points */}
               <div>
                 <Label className="text-sm font-medium">Coût en points</Label>
                 <div className="grid grid-cols-2 gap-4 mt-2">
                   <div>
                     <Label htmlFor="minPointsCost" className="text-xs">Minimum</Label>
                     <Input
                       id="minPointsCost"
                       type="number"
                       placeholder="Ex: 100"
                       value={filterPointsCost.min}
                       onChange={(e) => setFilterPointsCost(prev => ({ ...prev, min: e.target.value }))}
                       className="border-gray-300 focus:border-blue-600 focus:ring-blue-600"
                     />
                   </div>
                   <div>
                     <Label htmlFor="maxPointsCost" className="text-xs">Maximum</Label>
                     <Input
                       id="maxPointsCost"
                       type="number"
                       placeholder="Ex: 1000"
                       value={filterPointsCost.max}
                       onChange={(e) => setFilterPointsCost(prev => ({ ...prev, max: e.target.value }))}
                       className="border-gray-300 focus:border-blue-600 focus:ring-blue-600"
                     />
                   </div>
                 </div>
               </div>

               {/* Filtres de valeur */}
               <div>
                 <Label className="text-sm font-medium">Valeur de la récompense</Label>
                 <div className="grid grid-cols-2 gap-4 mt-2">
                   <div>
                     <Label htmlFor="minValue" className="text-xs">Minimum</Label>
                     <Input
                       id="minValue"
                       type="number"
                       placeholder="Ex: 5"
                       value={filterValue.min}
                       onChange={(e) => setFilterValue(prev => ({ ...prev, min: e.target.value }))}
                       className="border-gray-300 focus:border-blue-600 focus:ring-blue-600"
                     />
                   </div>
                   <div>
                     <Label htmlFor="maxValue" className="text-xs">Maximum</Label>
                     <Input
                       id="maxValue"
                       type="number"
                       placeholder="Ex: 50"
                       value={filterValue.max}
                       onChange={(e) => setFilterValue(prev => ({ ...prev, max: e.target.value }))}
                       className="border-gray-300 focus:border-blue-600 focus:ring-blue-600"
                     />
                   </div>
                 </div>
               </div>

               {/* Filtres de catégories */}
               <div>
                 <Label className="text-sm font-medium">Catégories</Label>
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                   {['all', 'electronics', 'fashion', 'home', 'sports', 'books', 'food'].map((category) => (
                     <div key={category} className="flex items-center space-x-2">
                       <input
                         type="checkbox"
                         id={`cat-${category}`}
                         checked={filterCategories.includes(category)}
                         onChange={(e) => {
                           if (e.target.checked) {
                             setFilterCategories(prev => [...prev, category])
                           } else {
                             setFilterCategories(prev => prev.filter(c => c !== category))
                           }
                         }}
                         className="rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                       />
                       <Label htmlFor={`cat-${category}`} className="text-sm">
                         {category === 'all' ? 'Toutes catégories' : category.charAt(0).toUpperCase() + category.slice(1)}
                       </Label>
                     </div>
                   ))}
                 </div>
               </div>

               {/* Filtres de dates */}
               <div>
                 <Label className="text-sm font-medium">Période de validité</Label>
                 <div className="grid grid-cols-2 gap-4 mt-2">
                   <div>
                     <Label htmlFor="startDate" className="text-xs">Date de début</Label>
                     <Input
                       id="startDate"
                       type="date"
                       value={filterDateRange.start}
                       onChange={(e) => setFilterDateRange(prev => ({ ...prev, start: e.target.value }))}
                       className="border-gray-300 focus:border-blue-600 focus:ring-blue-600"
                     />
                   </div>
                   <div>
                     <Label htmlFor="endDate" className="text-xs">Date de fin</Label>
                     <Input
                       id="endDate"
                       type="date"
                       value={filterDateRange.end}
                       onChange={(e) => setFilterDateRange(prev => ({ ...prev, end: e.target.value }))}
                       className="border-gray-300 focus:border-blue-600 focus:ring-blue-600"
                     />
                   </div>
                 </div>
               </div>

               {/* Filtres d'utilisation */}
               <div>
                 <Label className="text-sm font-medium">Taux d'utilisation</Label>
                 <div className="grid grid-cols-2 gap-4 mt-2">
                   <div>
                     <Label htmlFor="minUsage" className="text-xs">Minimum (%)</Label>
                     <Input
                       id="minUsage"
                       type="number"
                       min="0"
                       max="100"
                       placeholder="Ex: 10"
                       value={filterUsage.min}
                       onChange={(e) => setFilterUsage(prev => ({ ...prev, min: e.target.value }))}
                       className="border-gray-300 focus:border-blue-600 focus:ring-blue-600"
                     />
                   </div>
                   <div>
                     <Label htmlFor="maxUsage" className="text-xs">Maximum (%)</Label>
                     <Input
                       id="maxUsage"
                       type="number"
                       min="0"
                       max="100"
                       placeholder="Ex: 90"
                       value={filterUsage.max}
                       onChange={(e) => setFilterUsage(prev => ({ ...prev, max: e.target.value }))}
                       className="border-gray-300 focus:border-blue-600 focus:ring-blue-600"
                     />
                   </div>
                 </div>
               </div>

               {/* Résumé des filtres actifs */}
               <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                 <h4 className="font-medium text-gray-900 mb-2">Filtres actifs</h4>
                 <div className="text-sm text-gray-600 space-y-1">
                   <p>Type: {filterType === 'all' ? 'Tous' : filterType}</p>
                   <p>Statut: {filterStatus === 'all' ? 'Tous' : filterStatus}</p>
                   {filterPointsCost.min && <p>Coût min: {filterPointsCost.min} points</p>}
                   {filterPointsCost.max && <p>Coût max: {filterPointsCost.max} points</p>}
                   {filterValue.min && <p>Valeur min: {filterValue.min}</p>}
                   {filterValue.max && <p>Valeur max: {filterValue.max}</p>}
                   {filterCategories.length > 0 && <p>Catégories: {filterCategories.join(', ')}</p>}
                   {filterDateRange.start && <p>Début: {filterDateRange.start}</p>}
                   {filterDateRange.end && <p>Fin: {filterDateRange.end}</p>}
                   {filterUsage.min && <p>Usage min: {filterUsage.min}%</p>}
                   {filterUsage.max && <p>Usage max: {filterUsage.max}%</p>}
                 </div>
               </div>
             </div>
           </div>

           <div className="flex gap-2 pt-4 pb-2 flex-shrink-0 bg-white border-t border-gray-100 mt-4">
             <Button
               onClick={applyAdvancedFilters}
               className="bg-blue-600 hover:bg-blue-700 text-white"
             >
               <Filter className="h-4 w-4 mr-2" />
               Appliquer les Filtres
             </Button>
             <Button
               variant="outline"
               onClick={resetFilters}
               className="border-gray-300 text-gray-700 hover:bg-gray-50"
             >
               <RefreshCw className="h-4 w-4 mr-2" />
               Réinitialiser
             </Button>
             <Button
               variant="outline"
               onClick={() => setShowFilterRewardsModal(false)}
               className="border-gray-300 text-gray-700 hover:bg-gray-50"
             >
               Annuler
             </Button>
           </div>
         </DialogContent>
       </Dialog>
     </div>
   )
 }

