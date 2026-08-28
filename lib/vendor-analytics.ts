import type { SupabaseClient } from '@supabase/supabase-js'

import { isAnalyticsEnabled } from '@/app/api/_helpers/analytics-privacy'
import { isPaidRevenueStatus } from '@/lib/vendor-revenue'

export type VendorAnalyticsPeriod = '7d' | '30d' | '90d' | '1y' | '2y' | '3y'

export type VendorAnalyticsSalesPoint = {
  period: string
  sales: number
  revenue: number
  growth: number
}

export type VendorAnalyticsProductRow = {
  id: string
  name: string
  sales: number
  revenue: number
  rating: number
  shares: number
  growth: number
  image?: string
}

export type VendorAnalyticsSharePlatform = {
  platform: string
  shares: number
  engagement: number
  reach: number
  growth: number
}

export type VendorAnalyticsInsight = {
  id: string
  type: 'positive' | 'warning' | 'negative'
  title: string
  description: string
  confidence: number
}

export type VendorAnalyticsOptimization = {
  id: string
  title: string
  description: string
  status: 'pending' | 'in-progress' | 'completed'
  progress: number
}

export type VendorAnalyticsCustomerSummary = {
  id: string
  name: string
  ordersCount: number
  totalSpent: number
  lastOrderAt: string | null
  isRepeat: boolean
}

export type VendorAnalyticsData = {
  period: VendorAnalyticsPeriod
  generatedAt: string
  summary: {
    totalSales: number
    totalRevenue: number
    totalCustomers: number
    averageRating: number
    totalReviews: number
    totalShares: number
    totalPoints: number
    growthRate: number
    revenueGrowthRate: number
    marketPosition: number
    totalVendors: number
    conversionRate: number
    sharesProgress: number
    pointsProgress: number
  }
  overview: {
    salesGrowthRate: number
    revenueGrowthRate: number
    customersGrowthRate: number
    conversionGrowthRate: number
    activeCustomers: number
    conversionRate: number
  }
  advanced: {
    roiPercent: number
    roiChangePercent: number
    ltv: number
    ltvChangePercent: number
    cac: number
    cacChangePercent: number
    retentionRate: number
    retentionChangePercent: number
  }
  salesSeries: VendorAnalyticsSalesPoint[]
  topProducts: VendorAnalyticsProductRow[]
  sharePlatforms: VendorAnalyticsSharePlatform[]
  insights: VendorAnalyticsInsight[]
  optimizations: VendorAnalyticsOptimization[]
  revenueByCategory: Array<{ category: string; revenue: number; percentage: number }>
  customersSample: VendorAnalyticsCustomerSummary[]
}

function periodToDays(period: VendorAnalyticsPeriod): number {
  if (period === '7d') return 7
  if (period === '90d') return 90
  if (period === '1y') return 365
  if (period === '2y') return 730
  if (period === '3y') return 1095
  return 30
}

/**
 * Heuristique alignée sur GET /api/vendor/dashboard — évite les divergences de CA / ventes.
 * Délègue à la source unique (lib/vendor-revenue) pour une seule définition du « payé ».
 */
function isPaidLikeStatus(value: unknown): boolean {
  return isPaidRevenueStatus(value)
}

function isDeliveredLikeStatus(value: unknown): boolean {
  const s = typeof value === 'string' ? value.trim().toLowerCase() : ''
  if (!s) return false
  if (s === 'delivered') return true
  if (s === 'completed') return true
  if (s.includes('deliver')) return true
  if (s.includes('livr')) return true
  return false
}

function isEligibleForRevenue(order: any): boolean {
  if (!order) return false
  const status = String(order?.status ?? '').trim().toLowerCase()
  if (status === 'cancelled' || status === 'canceled') return false
  const deliveryStatus = String(order?.delivery_status ?? order?.deliveryStatus ?? '').trim().toLowerCase()
  const paymentStatus = order?.payment_status
  return (
    isPaidLikeStatus(paymentStatus) ||
    isDeliveredLikeStatus(status) ||
    isDeliveredLikeStatus(deliveryStatus) ||
    isDeliveredLikeStatus(paymentStatus)
  )
}

function computeChangePercent(current: number, previous: number): number {
  const c = Number(current) || 0
  const p = Number(previous) || 0
  if (p <= 0) return c > 0 ? 100 : 0
  return Number((((c - p) / p) * 100).toFixed(1))
}

function resolveLineTotal(item: any): number {
  const qty = Number(item?.quantity ?? 0)
  const totalPrice = Number(item?.total_price ?? NaN)
  const total = Number(item?.total ?? NaN)
  const unit = Number(item?.unit_price ?? item?.price ?? 0)
  if (Number.isFinite(totalPrice) && totalPrice > 0) return totalPrice
  if (Number.isFinite(total) && total > 0) return total
  return unit * (Number.isFinite(qty) ? qty : 0)
}

function formatSeriesLabel(date: Date, period: VendorAnalyticsPeriod): string {
  if (period === '1y' || period === '2y' || period === '3y') {
    return date.toLocaleDateString('fr-FR', { month: 'short' })
  }
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

async function resolveVendorIds(supabase: SupabaseClient, vendorId: string): Promise<string[]> {
  const out = new Set<string>()
  out.add(vendorId)

  const { data: vendorProfileByUser } = await supabase
    .from('user_profiles')
    .select('id, user_id')
    .eq('user_id', vendorId)
    .maybeSingle()

  const profileIdFromUser = (vendorProfileByUser as any)?.id
  if (typeof profileIdFromUser === 'string' && profileIdFromUser.length > 0) {
    out.add(profileIdFromUser)
  }

  /** Si vendorId est déjà un id profil (legacy / données anciennes), récupérer le user_id lié. */
  const { data: vendorProfileById } = await supabase
    .from('user_profiles')
    .select('id, user_id')
    .eq('id', vendorId)
    .maybeSingle()

  const linkedUserId = (vendorProfileById as any)?.user_id
  if (typeof linkedUserId === 'string' && linkedUserId.length > 0) {
    out.add(linkedUserId)
  }
  const profileId = (vendorProfileById as any)?.id
  if (typeof profileId === 'string' && profileId.length > 0) {
    out.add(profileId)
  }

  return Array.from(out)
}

function orderHeaderAmount(order: any): number {
  const raw = order?.final_total != null ? order.final_total : order?.total_amount
  const n = Number(raw ?? 0)
  return Number.isFinite(n) ? n : 0
}

function isOrderCancelled(row: any): boolean {
  const status = String(row?.status ?? '').trim().toLowerCase()
  return status === 'cancelled' || status === 'canceled'
}

/** Période « demi-ouverte » [start, end) — alignée sur le découpage des lignes `order_items`. */
function nonCancelledHeaderRevenueHalfOpen(rows: any[], startIso: string, endIso: string): number {
  return rows.reduce((acc, row) => {
    const createdAt = String(row?.created_at ?? '')
    if (!createdAt || createdAt < startIso || createdAt >= endIso) return acc
    if (isOrderCancelled(row)) return acc
    return acc + orderHeaderAmount(row)
  }, 0)
}

function countNonCancelledOrdersHalfOpen(rows: any[], startIso: string, endIso: string): number {
  let n = 0
  for (const row of rows) {
    const createdAt = String(row?.created_at ?? '')
    if (!createdAt || createdAt < startIso || createdAt >= endIso) continue
    if (isOrderCancelled(row)) continue
    n++
  }
  return n
}

/**
 * Période courante : inclusif sur `endIso` (borne à maintenant), comme une fenêtre analytique jusqu'à « now ».
 * Même esprit que le fallback `orderRows` du dashboard quand les `order_items` ne totalisent pas.
 */
function nonCancelledHeaderRevenueInclusiveEnd(rows: any[], startIso: string, endIso: string): number {
  return rows.reduce((acc, row) => {
    const createdAt = String(row?.created_at ?? '')
    if (!createdAt || createdAt < startIso || createdAt > endIso) return acc
    if (isOrderCancelled(row)) return acc
    return acc + orderHeaderAmount(row)
  }, 0)
}

function countNonCancelledOrdersInclusiveEnd(rows: any[], startIso: string, endIso: string): number {
  let n = 0
  for (const row of rows) {
    const createdAt = String(row?.created_at ?? '')
    if (!createdAt || createdAt < startIso || createdAt > endIso) continue
    if (isOrderCancelled(row)) continue
    n++
  }
  return n
}

export type OrderForPeriodMetrics = {
  orderDate?: string
  status?: string
  totalAmount?: number
  products?: Array<{ id?: string; name?: string; price?: number; quantity?: number }>
  customerEmail?: string
  customerId?: string
  customerName?: string
}

export type DashboardTopProductRow = {
  id?: string
  productId?: string
  name?: string
  sales?: number
  revenue?: number
  shares?: number
  image?: string
}

/** CA + ventes sur la période à partir des commandes vendeur (même source que Commandes & Ventes). */
export function computePeriodMetricsFromOrders(
  orders: OrderForPeriodMetrics[],
  period: VendorAnalyticsPeriod
): { totalRevenue: number; totalSales: number } {
  const days = periodToDays(period)
  const now = new Date()
  const start = new Date(now)
  start.setDate(start.getDate() - (days - 1))
  start.setHours(0, 0, 0, 0)

  let totalRevenue = 0
  let totalSales = 0

  for (const order of orders) {
    const createdAt = String(order.orderDate ?? '')
    if (!createdAt) continue
    const dt = new Date(createdAt)
    if (Number.isNaN(dt.getTime()) || dt < start) continue
    const status = String(order.status ?? '').trim().toLowerCase()
    if (status === 'cancelled' || status === 'canceled') continue

    totalRevenue += Number(order.totalAmount ?? 0) || 0
    const items = Array.isArray(order.products) ? order.products : []
    const qty = items.reduce((sum, line) => sum + (Number(line?.quantity ?? 0) || 0), 0)
    totalSales += qty > 0 ? qty : 1
  }

  return {
    totalRevenue: Math.round(totalRevenue),
    totalSales: Math.round(totalSales)
  }
}

export type SyncedTopCardSummary = {
  totalRevenue: number
  totalSales: number
  growthRate: number
  revenueGrowthRate: number
  marketPosition: number
  totalVendors: number
  averageRating: number
  totalReviews: number
  activeCustomers: number
  conversionRate: number
}

const ADVANCED_MARKETING_COST_RATE = 0.12

function computeRoiPercent(revenue: number): number {
  if (revenue <= 0) return 0
  const cost = revenue * ADVANCED_MARKETING_COST_RATE
  return Number((((revenue - cost) / Math.max(cost, 1)) * 100).toFixed(1))
}

/**
 * ROI, LTV, CAC, rétention — calculés depuis les commandes vendeur (aligné dashboard / Commandes).
 */
export function computeAdvancedMetricsFromOrders(
  orders: OrderForPeriodMetrics[],
  period: VendorAnalyticsPeriod,
  syncedRevenue?: number,
  syncedActiveCustomers?: number
): VendorAnalyticsData['advanced'] {
  const days = periodToDays(period)
  const currentStart = periodStartDate(period)
  const previousStart = new Date(currentStart)
  previousStart.setDate(previousStart.getDate() - days)

  let currentRevenue = 0
  let previousRevenue = 0
  const customerOrdersCurrent = new Map<string, number>()
  const customerOrdersPrevious = new Map<string, number>()

  for (const order of orders) {
    const createdAt = String(order.orderDate ?? '')
    if (!createdAt) continue
    const dt = new Date(createdAt)
    if (Number.isNaN(dt.getTime())) continue
    const status = String(order.status ?? '').trim().toLowerCase()
    if (status === 'cancelled' || status === 'canceled') continue

    const amt = Number(order.totalAmount ?? 0) || 0
    const email = String(order.customerEmail ?? '').trim().toLowerCase()
    const id = String(order.customerId ?? '').trim()
    const name = String(order.customerName ?? '').trim()
    const key = email || id || (name ? `name:${name}` : '')

    if (dt >= currentStart) {
      currentRevenue += amt
      if (key) customerOrdersCurrent.set(key, (customerOrdersCurrent.get(key) ?? 0) + 1)
    } else if (dt >= previousStart && dt < currentStart) {
      previousRevenue += amt
      if (key) customerOrdersPrevious.set(key, (customerOrdersPrevious.get(key) ?? 0) + 1)
    }
  }

  if (Number(syncedRevenue ?? 0) > currentRevenue) {
    currentRevenue = Number(syncedRevenue)
  }

  const customersCurrent =
    Number(syncedActiveCustomers ?? 0) > 0
      ? Number(syncedActiveCustomers)
      : customerOrdersCurrent.size

  const repeatCustomers = Array.from(customerOrdersCurrent.values()).filter((n) => n > 1).length
  const retentionRate =
    customersCurrent > 0 ? Number(((repeatCustomers / customersCurrent) * 100).toFixed(1)) : 0

  const previousRepeat = Array.from(customerOrdersPrevious.values()).filter((n) => n > 1).length
  const previousCustomers = customerOrdersPrevious.size
  const previousRetention =
    previousCustomers > 0 ? Number(((previousRepeat / previousCustomers) * 100).toFixed(1)) : 0

  const ltv = customersCurrent > 0 ? Math.round(currentRevenue / customersCurrent) : 0
  const previousLtv = previousCustomers > 0 ? Math.round(previousRevenue / previousCustomers) : 0

  const cac = customersCurrent > 0 ? Math.round((currentRevenue * 0.05) / customersCurrent) : 0
  const previousCac = previousCustomers > 0 ? Math.round((previousRevenue * 0.05) / previousCustomers) : 0

  const roiPercent = computeRoiPercent(currentRevenue)
  const previousRoi = computeRoiPercent(previousRevenue)

  return {
    roiPercent,
    roiChangePercent: computeChangePercent(roiPercent, previousRoi),
    ltv,
    ltvChangePercent: computeChangePercent(ltv, previousLtv),
    cac,
    cacChangePercent: computeChangePercent(cac, previousCac),
    retentionRate,
    retentionChangePercent: computeChangePercent(retentionRate, previousRetention)
  }
}

/** Insights IA dérivés des métriques synchronisées (si l’API n’en renvoie pas). */
export function buildSyncedInsights(params: {
  summary?: VendorAnalyticsData['summary'] | null
  apiInsights?: VendorAnalyticsInsight[]
  growthRate?: number
}): VendorAnalyticsInsight[] {
  const existing = params.apiInsights ?? []
  if (existing.length > 0) return existing

  const out: VendorAnalyticsInsight[] = []
  const growth = Number(params.growthRate ?? params.summary?.growthRate ?? 0)
  const revenue = Number(params.summary?.totalRevenue ?? 0)
  const sales = Number(params.summary?.totalSales ?? 0)
  const shares = Number(params.summary?.totalShares ?? 0)
  const conversion = Number(params.summary?.conversionRate ?? 0)

  if (sales > 0) {
    out.push({
      id: 'sales-active',
      type: 'positive',
      title: 'Activité commerciale',
      description: `${sales} vente(s) et ${revenue.toLocaleString('fr-FR')} F CFA de CA sur la période.`,
      confidence: 85
    })
  }
  if (growth > 5) {
    out.push({
      id: 'sales-up-sync',
      type: 'positive',
      title: 'Croissance des ventes',
      description: `Progression de ${growth}% par rapport à la période précédente.`,
      confidence: Math.min(95, 60 + Math.abs(growth))
    })
  }
  if (growth < -5) {
    out.push({
      id: 'sales-down-sync',
      type: 'negative',
      title: 'Baisse des ventes',
      description: `Recul de ${Math.abs(growth)}% — renforcez promotions et visibilité.`,
      confidence: Math.min(95, 60 + Math.abs(growth))
    })
  }
  if (shares > 0) {
    out.push({
      id: 'shares-active',
      type: 'positive',
      title: 'Engagement partages',
      description: `${shares} partage(s) enregistré(s) sur la période.`,
      confidence: 75
    })
  }
  if (conversion > 0 && conversion < 3 && sales > 0) {
    out.push({
      id: 'conversion-low',
      type: 'warning',
      title: 'Conversion à optimiser',
      description: `Taux de conversion à ${conversion.toFixed(2)}% — améliorez fiches produits et visibilité.`,
      confidence: 70
    })
  }

  return out
}

/** Recommandations d’optimisation basées sur ventes, avis, partages (données synchronisées). */
export function buildSyncedOptimizations(params: {
  summary?: VendorAnalyticsData['summary'] | null
  topProducts?: VendorAnalyticsProductRow[]
  apiOptimizations?: VendorAnalyticsOptimization[]
}): VendorAnalyticsOptimization[] {
  const merged = [...(params.apiOptimizations ?? [])]
  const has = (id: string) => merged.some((o) => o.id === id)

  const summary = params.summary
  const totalSales = Number(summary?.totalSales ?? 0)
  const totalRevenue = Number(summary?.totalRevenue ?? 0)
  const totalShares = Number(summary?.totalShares ?? 0)
  const averageRating = Number(summary?.averageRating ?? 0)
  const conversion = Number(summary?.conversionRate ?? 0)
  const top = params.topProducts?.[0]

  if (top && top.sales > 0 && !has('top-product')) {
    merged.push({
      id: 'top-product',
      title: `Capitaliser sur « ${top.name} »`,
      description: `${top.sales} vente(s), ${top.revenue.toLocaleString('fr-FR')} F CFA — mettez ce produit en avant.`,
      status: 'pending',
      progress: 0
    })
  }
  if (totalSales > 0 && totalShares < 5 && !has('boost-shares')) {
    merged.push({
      id: 'boost-shares',
      title: 'Booster les partages',
      description: 'Encouragez vos clients à partager vos produits (WhatsApp, réseaux sociaux).',
      status: 'pending',
      progress: 0
    })
  }
  if (averageRating > 0 && averageRating < 4 && !has('reviews-quality')) {
    merged.push({
      id: 'reviews-quality',
      title: 'Améliorer la satisfaction',
      description: `Note moyenne ${averageRating.toFixed(1)}/5 — répondez aux avis et enrichissez vos fiches produits.`,
      status: 'pending',
      progress: 0
    })
  }
  if (totalRevenue > 0 && conversion > 0 && conversion < 5 && !has('conversion-boost')) {
    merged.push({
      id: 'conversion-boost',
      title: 'Augmenter la conversion',
      description: `Taux actuel ${conversion.toFixed(2)}% — optimisez images, prix et descriptions.`,
      status: 'pending',
      progress: 0
    })
  }
  if (totalSales >= 3 && !has('retention-campaign')) {
    merged.push({
      id: 'retention-campaign',
      title: 'Fidéliser vos acheteurs',
      description: 'Proposez une offre aux clients ayant déjà commandé sur la période.',
      status: 'pending',
      progress: 0
    })
  }

  return merged
}

/** Fusionne métriques avancées API + commandes / cartes synchronisées. */
export function buildSyncedAdvancedMetrics(params: {
  period: VendorAnalyticsPeriod
  apiAdvanced?: VendorAnalyticsData['advanced'] | null
  orders?: OrderForPeriodMetrics[]
  totalRevenue?: number
  activeCustomers?: number
}): VendorAnalyticsData['advanced'] {
  const fromOrders = computeAdvancedMetricsFromOrders(
    params.orders ?? [],
    params.period,
    params.totalRevenue,
    params.activeCustomers
  )
  const api = params.apiAdvanced

  const pickMain = (orderVal: number, apiVal: number) => {
    if (orderVal > 0 && apiVal <= 0) return orderVal
    if (apiVal > 0 && orderVal <= 0) return apiVal
    return Math.max(orderVal, apiVal)
  }

  const roiPercent = pickMain(fromOrders.roiPercent, Number(api?.roiPercent ?? 0))
  const ltv = pickMain(fromOrders.ltv, Number(api?.ltv ?? 0))
  const cac = pickMain(fromOrders.cac, Number(api?.cac ?? 0))
  const retentionRate = pickMain(fromOrders.retentionRate, Number(api?.retentionRate ?? 0))

  const useOrderDeltas = fromOrders.ltv > 0 || fromOrders.roiPercent > 0

  return {
    roiPercent,
    roiChangePercent: useOrderDeltas ? fromOrders.roiChangePercent : Number(api?.roiChangePercent ?? 0),
    ltv,
    ltvChangePercent: useOrderDeltas ? fromOrders.ltvChangePercent : Number(api?.ltvChangePercent ?? 0),
    cac,
    cacChangePercent: useOrderDeltas ? fromOrders.cacChangePercent : Number(api?.cacChangePercent ?? 0),
    retentionRate,
    retentionChangePercent: useOrderDeltas
      ? fromOrders.retentionChangePercent
      : Number(api?.retentionChangePercent ?? 0)
  }
}

/** Clients uniques ayant commandé sur la période (même logique que Commandes & Ventes). */
export function computeActiveCustomersFromOrders(
  orders: OrderForPeriodMetrics[],
  period: VendorAnalyticsPeriod
): number {
  const days = periodToDays(period)
  const now = new Date()
  const start = new Date(now)
  start.setDate(start.getDate() - (days - 1))
  start.setHours(0, 0, 0, 0)

  const keys = new Set<string>()
  for (const order of orders) {
    const createdAt = String(order.orderDate ?? '')
    if (!createdAt) continue
    const dt = new Date(createdAt)
    if (Number.isNaN(dt.getTime()) || dt < start) continue
    const status = String(order.status ?? '').trim().toLowerCase()
    if (status === 'cancelled' || status === 'canceled') continue

    const email = String(order.customerEmail ?? '').trim().toLowerCase()
    const id = String(order.customerId ?? '').trim()
    const name = String(order.customerName ?? '').trim()
    const key = email || id || (name ? `name:${name}` : '')
    if (key) keys.add(key)
  }
  return keys.size
}

export function computeConversionRate(params: {
  periodSales: number
  totalProductViews: number
  apiConversionRate?: number
}): number {
  const sales = Number(params.periodSales ?? 0) || 0
  const views = Number(params.totalProductViews ?? 0) || 0
  if (views > 0) {
    return Number(((sales / views) * 100).toFixed(2))
  }
  if (sales > 0) {
    return Number(params.apiConversionRate ?? 0) > 0 ? Number(params.apiConversionRate) : 100
  }
  return Number(params.apiConversionRate ?? 0) || 0
}

/**
 * Valeurs des 4 cartes du haut — priorité : commandes réelles > CA dashboard > analytics API.
 */
export function buildSyncedTopCardSummary(params: {
  period: VendorAnalyticsPeriod
  analyticsSummary?: VendorAnalyticsData['summary'] | null
  revenue?:
    | {
        totalRevenue?: number
        totalRevenue30Days?: number
        salesEvolution?: Array<{ date?: string; revenue?: number; ordersCount?: number; orders?: number }>
      }
    | null
  stats?: {
    ranking?: number
    totalVendors?: number
    averageRating?: number
    totalReviews?: number
  } | null
  orders?: OrderForPeriodMetrics[]
  reputation?: { overallRating?: number; totalReviews?: number } | null
  rankingSnapshot?: { position?: number; totalVendors?: number } | null
  totalProductViews?: number
  trustApi?: boolean
}): SyncedTopCardSummary {
  const trustApi = params.trustApi !== false
  const fromOrders = computePeriodMetricsFromOrders(params.orders ?? [], params.period)
  const fromDashboard = revenueMetricsFromDashboard(params.revenue, params.period)
  const api = params.analyticsSummary
  const localRevenue = Math.max(fromOrders.totalRevenue, fromDashboard.totalRevenue)
  const localSales = Math.max(fromOrders.totalSales, fromDashboard.totalSales)

  const totalRevenue = pickPeriodMetric(localRevenue, Number(api?.totalRevenue ?? 0) || 0, trustApi)
  const totalSales = pickPeriodMetric(localSales, Number(api?.totalSales ?? 0) || 0, trustApi)

  const activeCustomersLocal = computeActiveCustomersFromOrders(params.orders ?? [], params.period)
  const activeCustomers = pickPeriodMetric(
    activeCustomersLocal,
    Number(api?.totalCustomers ?? 0) || 0,
    trustApi
  )

  const conversionRate = computeConversionRate({
    periodSales: totalSales,
    totalProductViews: Number(params.totalProductViews ?? 0) || 0,
    apiConversionRate: Number(api?.conversionRate ?? 0) || 0
  })

  const marketPosition = Math.max(
    Number(params.rankingSnapshot?.position ?? 0) || 0,
    Number(params.stats?.ranking ?? 0) || 0,
    Number(api?.marketPosition ?? 0) || 0
  )

  const totalVendors = Math.max(
    Number(params.rankingSnapshot?.totalVendors ?? 0) || 0,
    Number(params.stats?.totalVendors ?? 0) || 0,
    Number(api?.totalVendors ?? 0) || 0
  )

  const averageRating = Math.max(
    Number(params.reputation?.overallRating ?? 0) || 0,
    Number(params.stats?.averageRating ?? 0) || 0,
    Number(api?.averageRating ?? 0) || 0
  )

  const totalReviews = Math.max(
    Number(params.reputation?.totalReviews ?? 0) || 0,
    Number(params.stats?.totalReviews ?? 0) || 0,
    Number(api?.totalReviews ?? 0) || 0
  )

  return {
    totalRevenue,
    totalSales,
    growthRate: Number(api?.growthRate ?? 0) || 0,
    revenueGrowthRate: Number(api?.revenueGrowthRate ?? 0) || 0,
    marketPosition,
    totalVendors,
    averageRating,
    totalReviews,
    activeCustomers,
    conversionRate
  }
}

/** Métriques CA/ventes depuis `GET /api/vendor/dashboard` — même source que l’onglet Chiffre d’affaires. */
export function revenueMetricsFromDashboard(
  revenue:
    | {
        totalRevenue?: number
        totalRevenue30Days?: number
        salesEvolution?: Array<{ date?: string; revenue?: number; ordersCount?: number; orders?: number }>
      }
    | null
    | undefined,
  period: VendorAnalyticsPeriod
): { totalRevenue: number; totalSales: number } {
  if (!revenue) return { totalRevenue: 0, totalSales: 0 }

  const days = periodToDays(period)
  const evolution = Array.isArray(revenue.salesEvolution) ? revenue.salesEvolution : []

  const now = new Date()
  const start = new Date(now)
  start.setDate(start.getDate() - (days - 1))
  start.setHours(0, 0, 0, 0)

  let totalRevenue = 0
  let totalSales = 0

  for (const row of evolution) {
    const rawDate = String(row?.date ?? '')
    if (!rawDate) continue
    const dt = new Date(rawDate)
    if (Number.isNaN(dt.getTime()) || dt < start) continue
    totalRevenue += Number(row?.revenue ?? 0) || 0
    totalSales += Number(row?.ordersCount ?? row?.orders ?? 0) || 0
  }

  if (period === '30d') {
    const t30 = Number(revenue.totalRevenue30Days ?? 0)
    if (t30 > 0) totalRevenue = t30
  }

  if (totalRevenue <= 0) {
    totalRevenue = Number(revenue.totalRevenue30Days ?? revenue.totalRevenue ?? 0) || 0
  }

  return {
    totalRevenue: Math.round(totalRevenue),
    totalSales: Math.round(totalSales)
  }
}

function periodStartDate(period: VendorAnalyticsPeriod): Date {
  const days = periodToDays(period)
  const now = new Date()
  const start = new Date(now)
  start.setDate(start.getDate() - (days - 1))
  start.setHours(0, 0, 0, 0)
  return start
}

function applyGrowthToSalesSeries(series: VendorAnalyticsSalesPoint[]): VendorAnalyticsSalesPoint[] {
  for (let i = 1; i < series.length; i++) {
    series[i].growth = computeChangePercent(series[i].sales, series[i - 1].sales)
  }
  return series
}

function sumSeriesSales(series: VendorAnalyticsSalesPoint[]): number {
  return series.reduce((acc, row) => acc + (Number(row.sales) || 0), 0)
}

function sumTopProductsSales(rows: VendorAnalyticsProductRow[]): number {
  return rows.reduce((acc, row) => acc + (Number(row.sales) || 0), 0)
}

/** Série journalière depuis `salesEvolution` du dashboard (GET /api/vendor/dashboard). */
export function buildSalesSeriesFromEvolution(
  evolution: Array<{ date?: string; revenue?: number; ordersCount?: number; orders?: number }>,
  period: VendorAnalyticsPeriod
): VendorAnalyticsSalesPoint[] {
  const days = periodToDays(period)
  const currentStart = periodStartDate(period)
  const byDay = new Map<string, { sales: number; revenue: number }>()

  for (const row of evolution) {
    const rawDate = String(row?.date ?? '').slice(0, 10)
    if (!rawDate) continue
    const dt = new Date(rawDate)
    if (Number.isNaN(dt.getTime()) || dt < currentStart) continue
    const bucket = byDay.get(rawDate) ?? { sales: 0, revenue: 0 }
    bucket.sales += Number(row?.ordersCount ?? row?.orders ?? 0) || 0
    bucket.revenue += Number(row?.revenue ?? 0) || 0
    byDay.set(rawDate, bucket)
  }

  const salesSeries: VendorAnalyticsSalesPoint[] = []
  for (let i = 0; i < days; i++) {
    const d = new Date(currentStart)
    d.setDate(currentStart.getDate() + i)
    const key = d.toISOString().slice(0, 10)
    const bucket = byDay.get(key) ?? { sales: 0, revenue: 0 }
    salesSeries.push({
      period: formatSeriesLabel(d, period),
      sales: bucket.sales,
      revenue: Math.round(bucket.revenue),
      growth: 0
    })
  }

  return applyGrowthToSalesSeries(salesSeries)
}

/** Série journalière depuis les commandes vendeur (onglet Commandes & Ventes). */
export function buildSalesSeriesFromOrders(
  orders: OrderForPeriodMetrics[],
  period: VendorAnalyticsPeriod
): VendorAnalyticsSalesPoint[] {
  const days = periodToDays(period)
  const currentStart = periodStartDate(period)
  const byDay = new Map<string, { sales: number; revenue: number }>()

  for (const order of orders) {
    const createdAt = String(order.orderDate ?? '')
    if (!createdAt) continue
    const dt = new Date(createdAt)
    if (Number.isNaN(dt.getTime()) || dt < currentStart) continue
    const status = String(order.status ?? '').trim().toLowerCase()
    if (status === 'cancelled' || status === 'canceled') continue

    const dayKey = createdAt.slice(0, 10)
    const bucket = byDay.get(dayKey) ?? { sales: 0, revenue: 0 }
    const items = Array.isArray(order.products) ? order.products : []
    const qty = items.reduce((sum, line) => sum + (Number(line?.quantity ?? 0) || 0), 0)
    bucket.sales += qty > 0 ? qty : 1
    bucket.revenue += Number(order.totalAmount ?? 0) || 0
    byDay.set(dayKey, bucket)
  }

  const salesSeries: VendorAnalyticsSalesPoint[] = []
  for (let i = 0; i < days; i++) {
    const d = new Date(currentStart)
    d.setDate(currentStart.getDate() + i)
    const key = d.toISOString().slice(0, 10)
    const bucket = byDay.get(key) ?? { sales: 0, revenue: 0 }
    salesSeries.push({
      period: formatSeriesLabel(d, period),
      sales: bucket.sales,
      revenue: Math.round(bucket.revenue),
      growth: 0
    })
  }

  return applyGrowthToSalesSeries(salesSeries)
}

export function buildTopProductsFromRevenue(
  rows: DashboardTopProductRow[] | undefined,
  limit = 3
): VendorAnalyticsProductRow[] {
  return (rows ?? [])
    .map((row) => {
      const id = String(row?.id ?? row?.productId ?? '').trim()
      if (!id) return null
      return {
        id,
        name: String(row?.name ?? 'Produit'),
        sales: Number(row?.sales ?? 0) || 0,
        revenue: Math.round(Number(row?.revenue ?? 0) || 0),
        rating: 0,
        shares: Number(row?.shares ?? 0) || 0,
        growth: 0,
        image: String(row?.image ?? '')
      }
    })
    .filter((row): row is VendorAnalyticsProductRow => row !== null)
    .sort((a, b) => {
      if (b.sales !== a.sales) return b.sales - a.sales
      return b.revenue - a.revenue
    })
    .slice(0, limit)
}

export function buildTopProductsFromOrders(
  orders: OrderForPeriodMetrics[],
  catalog: Array<{ id?: string; name?: string }> | undefined,
  period: VendorAnalyticsPeriod,
  limit = 3
): VendorAnalyticsProductRow[] {
  const currentStart = periodStartDate(period)
  const byProduct = new Map<string, { name: string; sales: number; revenue: number }>()
  const catalogByName = new Map<string, string>()
  for (const p of catalog ?? []) {
    const name = String(p?.name ?? '').trim().toLowerCase()
    const id = String(p?.id ?? '').trim()
    if (name && id) catalogByName.set(name, id)
  }

  for (const order of orders) {
    const createdAt = String(order.orderDate ?? '')
    if (!createdAt) continue
    const dt = new Date(createdAt)
    if (Number.isNaN(dt.getTime()) || dt < currentStart) continue
    const status = String(order.status ?? '').trim().toLowerCase()
    if (status === 'cancelled' || status === 'canceled') continue

    for (const line of order.products ?? []) {
      const name = String(line?.name ?? 'Produit').trim()
      const nameKey = name.toLowerCase()
      const productId =
        String(line?.id ?? '').trim() ||
        catalogByName.get(nameKey) ||
        (nameKey ? `name:${nameKey}` : '')
      if (!productId) continue

      const qty = Number(line?.quantity ?? 0) || 0
      const unit = Number(line?.price ?? 0) || 0
      const lineRevenue = unit * (qty > 0 ? qty : 1)

      const current = byProduct.get(productId) ?? { name, sales: 0, revenue: 0 }
      current.sales += qty > 0 ? qty : 1
      current.revenue += lineRevenue
      if (!current.name && name) current.name = name
      byProduct.set(productId, current)
    }
  }

  return Array.from(byProduct.entries())
    .map(([id, stats]) => ({
      id,
      name: stats.name,
      sales: stats.sales,
      revenue: Math.round(stats.revenue),
      rating: 0,
      shares: 0,
      growth: 0
    }))
    .sort((a, b) => {
      if (b.sales !== a.sales) return b.sales - a.sales
      return b.revenue - a.revenue
    })
    .slice(0, limit)
}

/** Regroupe les points pour l’affichage (évite le débordement des libellés). */
export function downsampleSalesSeriesForDisplay(
  series: VendorAnalyticsSalesPoint[],
  maxBars = 14
): VendorAnalyticsSalesPoint[] {
  if (series.length <= maxBars) return series
  const bucketSize = Math.ceil(series.length / maxBars)
  const out: VendorAnalyticsSalesPoint[] = []

  for (let i = 0; i < series.length; i += bucketSize) {
    const chunk = series.slice(i, i + bucketSize)
    const sales = chunk.reduce((sum, row) => sum + (Number(row.sales) || 0), 0)
    const revenue = chunk.reduce((sum, row) => sum + (Number(row.revenue) || 0), 0)
    const first = chunk[0]
    const last = chunk[chunk.length - 1]
    const period =
      chunk.length === 1
        ? first.period
        : first.period === last.period
          ? first.period
          : `${first.period} – ${last.period}`

    out.push({
      period,
      sales,
      revenue: Math.round(revenue),
      growth: 0
    })
  }

  return applyGrowthToSalesSeries(out)
}

/** CA / ventes : commandes ou dashboard d’abord ; API seulement si données déjà chargées pour cette période. */
function pickPeriodMetric(local: number, api: number, trustApi: boolean): number {
  const localN = Number(local) || 0
  const apiN = Number(api) || 0
  if (localN > 0) return localN
  if (!trustApi) return 0
  return apiN
}

/**
 * Graphiques : priorité dashboard (`salesEvolution`, `topProducts`) > commandes > API analytics.
 */
export function mergeAnalyticsCharts(
  analytics: VendorAnalyticsData,
  params: {
    period: VendorAnalyticsPeriod
    /** false pendant un changement de période avant réponse API (évite d’afficher l’ancienne période). */
    trustApi?: boolean
    revenue?:
      | {
          salesEvolution?: Array<{ date?: string; revenue?: number; ordersCount?: number; orders?: number }>
          topProducts?: DashboardTopProductRow[]
        }
      | null
    orders?: OrderForPeriodMetrics[]
    products?: Array<{ id?: string; name?: string }>
  }
): VendorAnalyticsData {
  const evolution = Array.isArray(params.revenue?.salesEvolution) ? params.revenue!.salesEvolution! : []
  const fromEvolution = evolution.length > 0 ? buildSalesSeriesFromEvolution(evolution, params.period) : []
  const fromOrders = buildSalesSeriesFromOrders(params.orders ?? [], params.period)

  const trustApi = params.trustApi !== false
  const evolutionSum = sumSeriesSales(fromEvolution)
  const ordersSum = sumSeriesSales(fromOrders)
  const apiSum = trustApi ? sumSeriesSales(analytics.salesSeries) : 0

  let salesSeries = trustApi ? analytics.salesSeries : []
  if (!trustApi) {
    if (ordersSum > 0) salesSeries = fromOrders
    else if (evolutionSum > 0) salesSeries = fromEvolution
  } else if (ordersSum >= evolutionSum && ordersSum >= apiSum && ordersSum > 0) {
    salesSeries = fromOrders
  } else if (evolutionSum >= apiSum && evolutionSum > 0) {
    salesSeries = fromEvolution
  } else if (apiSum > 0) {
    salesSeries = analytics.salesSeries
  } else if (ordersSum > 0) {
    salesSeries = fromOrders
  } else if (evolutionSum > 0) {
    salesSeries = fromEvolution
  }

  const dashTop = buildTopProductsFromRevenue(params.revenue?.topProducts, 3)
  const ordersTop = buildTopProductsFromOrders(params.orders ?? [], params.products, params.period, 3)
  const dashTopSum = sumTopProductsSales(dashTop)
  const ordersTopSum = sumTopProductsSales(ordersTop)
  const apiTopSum = trustApi ? sumTopProductsSales(analytics.topProducts.slice(0, 3)) : 0

  let topProducts = trustApi ? analytics.topProducts : []
  if (!trustApi) {
    if (dashTopSum > 0) topProducts = dashTop
    else if (ordersTopSum > 0) topProducts = ordersTop
  } else if (dashTopSum >= ordersTopSum && dashTopSum >= apiTopSum && dashTopSum > 0) {
    topProducts = dashTop
  } else if (ordersTopSum >= apiTopSum && ordersTopSum > 0) {
    topProducts = ordersTop
  } else if (apiTopSum > 0) {
    topProducts = analytics.topProducts.slice(0, 3)
  } else if (dashTopSum > 0) {
    topProducts = dashTop
  } else if (ordersTopSum > 0) {
    topProducts = ordersTop
  }

  return {
    ...analytics,
    salesSeries,
    topProducts
  }
}

export function mergeAnalyticsWithDashboardRevenue(
  analytics: VendorAnalyticsData,
  revenue:
    | {
        totalRevenue?: number
        totalRevenue30Days?: number
        salesEvolution?: Array<{ date?: string; revenue?: number; ordersCount?: number; orders?: number }>
        topProducts?: DashboardTopProductRow[]
      }
    | null
    | undefined,
  period: VendorAnalyticsPeriod,
  extras?: {
    orders?: OrderForPeriodMetrics[]
    products?: Array<{ id?: string; name?: string }>
    trustApi?: boolean
  }
): VendorAnalyticsData {
  const trustApi = extras?.trustApi !== false
  const fromDashboard = revenueMetricsFromDashboard(revenue, period)
  const fromOrders = computePeriodMetricsFromOrders(extras?.orders ?? [], period)
  const apiRevenue = Number(analytics.summary?.totalRevenue ?? 0)
  const apiSales = Number(analytics.summary?.totalSales ?? 0)
  const localRevenue = Math.max(fromDashboard.totalRevenue, fromOrders.totalRevenue)
  const localSales = Math.max(fromDashboard.totalSales, fromOrders.totalSales)

  const totalRevenue = pickPeriodMetric(localRevenue, apiRevenue, trustApi)
  const totalSales = pickPeriodMetric(localSales, apiSales, trustApi)

  const withCharts = mergeAnalyticsCharts(analytics, {
    period,
    trustApi,
    revenue,
    orders: extras?.orders,
    products: extras?.products
  })

  return {
    ...withCharts,
    summary: {
      ...withCharts.summary,
      totalRevenue,
      totalSales
    }
  }
}
/**
 * Repli 100 % local : reconstruit des analytics à partir du CA dashboard (source de
 * vérité de l'onglet Chiffre d'affaires) + commandes, lorsque l'API analytics est
 * indisponible. Garantit que les cartes du haut (CA, ventes, clients actifs…) restent
 * alimentées même en cas d'échec de GET /api/vendor/analytics.
 */
export function buildLocalAnalyticsFallback(params: {
  period: VendorAnalyticsPeriod
  revenue?: {
    totalRevenue?: number
    totalRevenue30Days?: number
    salesEvolution?: Array<{ date?: string; revenue?: number; ordersCount?: number; orders?: number }>
    topProducts?: DashboardTopProductRow[]
  } | null
  orders?: OrderForPeriodMetrics[]
  products?: Array<{ id?: string; name?: string }>
  stats?: {
    ranking?: number
    totalVendors?: number
    averageRating?: number
    totalReviews?: number
  } | null
  reputation?: { overallRating?: number; totalReviews?: number } | null
  rankingSnapshot?: { position?: number; totalVendors?: number } | null
  totalProductViews?: number
}): VendorAnalyticsData {
  const orders = params.orders ?? []
  const summary = buildSyncedTopCardSummary({
    period: params.period,
    analyticsSummary: null,
    revenue: params.revenue ?? null,
    stats: params.stats ?? null,
    orders,
    reputation: params.reputation ?? null,
    rankingSnapshot: params.rankingSnapshot ?? null,
    totalProductViews: params.totalProductViews ?? 0,
    trustApi: false
  })

  const stub = {
    period: params.period,
    generatedAt: new Date().toISOString(),
    summary,
    overview: {
      salesGrowthRate: 0,
      revenueGrowthRate: 0,
      customersGrowthRate: 0,
      conversionGrowthRate: 0,
      activeCustomers: summary.activeCustomers,
      conversionRate: summary.conversionRate
    },
    advanced: {
      roiPercent: 0,
      roiChangePercent: 0,
      ltv: 0,
      ltvChangePercent: 0,
      cac: 0,
      cacChangePercent: 0,
      retentionRate: 0,
      retentionChangePercent: 0
    },
    salesSeries: [] as VendorAnalyticsSalesPoint[],
    topProducts: [] as VendorAnalyticsProductRow[],
    sharePlatforms: [] as VendorAnalyticsSharePlatform[],
    insights: [] as VendorAnalyticsInsight[],
    optimizations: [] as VendorAnalyticsOptimization[],
    revenueByCategory: [] as Array<{ category: string; revenue: number; percentage: number }>,
    customersSample: [] as VendorAnalyticsCustomerSummary[]
  }

  const charts = mergeAnalyticsCharts(stub as unknown as VendorAnalyticsData, {
    period: params.period,
    trustApi: false,
    revenue: params.revenue ?? null,
    orders,
    products: params.products
  })

  return {
    ...stub,
    salesSeries: charts.salesSeries,
    topProducts: charts.topProducts
  }
}

function fillSalesByDayFromNonCancelledOrders(
  rows: any[],
  startIso: string,
  endIsoInclusive: string,
  salesByDay: Map<string, { sales: number; revenue: number }>
) {
  for (const row of rows) {
    const createdAt = String(row?.created_at ?? '')
    if (!createdAt || createdAt < startIso || createdAt > endIsoInclusive) continue
    if (isOrderCancelled(row)) continue
    const dayKey = createdAt.slice(0, 10)
    const amt = orderHeaderAmount(row)
    const bucket = salesByDay.get(dayKey) ?? { sales: 0, revenue: 0 }
    bucket.sales += 1
    bucket.revenue += amt
    salesByDay.set(dayKey, bucket)
  }
}

/**
 * Agrège toutes les métriques analytics vendeur pour une période donnée.
 */
export async function buildVendorAnalytics(
  supabase: SupabaseClient,
  vendorId: string,
  period: VendorAnalyticsPeriod = '30d'
): Promise<VendorAnalyticsData> {
  const vendorIds = await resolveVendorIds(supabase, vendorId)
  const days = periodToDays(period)
  const now = new Date()
  const currentStart = new Date(now)
  currentStart.setDate(currentStart.getDate() - (days - 1))
  currentStart.setHours(0, 0, 0, 0)

  const previousStart = new Date(currentStart)
  previousStart.setDate(previousStart.getDate() - days)

  const currentStartIso = currentStart.toISOString()
  const previousStartIso = previousStart.toISOString()
  const nowIso = now.toISOString()

  const { data: products } = await supabase
    .from('user_products')
    .select('id, name, main_image, category, vendor_id')
    .in('vendor_id', vendorIds as any)

  const productRows = Array.isArray(products) ? products : []
  const productIds = productRows.map((p: any) => String(p?.id ?? '')).filter(Boolean)
  const productById = new Map(productRows.map((p: any) => [String(p.id), p]))

  /**
   * Comme le dashboard : charger les commandes vendeur sans filtre SQL sur la date,
   * puis découper en mémoire (évite les commandes manquantes si jointure / dates incohérentes).
   */
  const { data: orderRows } = await supabase
    .from('orders')
    .select(
      'id, customer_id, vendor_id, created_at, status, payment_status, total_amount, final_total'
    )
    .in('vendor_id', vendorIds as any)
    .order('created_at', { ascending: false })
    .limit(20000)

  const orderRowsRaw = Array.isArray(orderRows) ? orderRows : []
  const orderRowsInWindow = orderRowsRaw.filter((row: any) => {
    const createdAt = String(row?.created_at ?? '')
    return createdAt && createdAt >= previousStartIso
  })
  const orders = orderRowsInWindow.filter(isEligibleForRevenue)
  const paidOrderIdSet = new Set<string>(
    orders.map((o: any) => String(o?.id ?? '')).filter(Boolean)
  )

  const currentOrderIds = new Set<string>()
  const previousOrderIds = new Set<string>()
  orders.forEach((order: any) => {
    const createdAt = String(order?.created_at ?? '')
    const id = String(order?.id ?? '')
    if (!id || !createdAt) return
    if (createdAt >= currentStartIso) currentOrderIds.add(id)
    else if (createdAt >= previousStartIso && createdAt < currentStartIso) previousOrderIds.add(id)
  })

  /** Même stratégie que GET /api/vendor/dashboard : order_items → orders!inner + filtre vendor_id + période. */
  const { data: itemsFromVendorDate, error: itemsJoinErr } = await supabase
    .from('order_items')
    .select(
      `
      product_id,
      quantity,
      unit_price,
      total_price,
      order_id,
      orders!inner (
        id,
        customer_id,
        created_at,
        status,
        payment_status,
        vendor_id,
        total_amount,
        final_total
      )
    `
    )
    .in('orders.vendor_id', vendorIds as any)
    .gte('orders.created_at', previousStartIso)
    .limit(20000)

  let orderItems: any[] = (itemsFromVendorDate ?? []).filter((row: any) => {
    const o = row?.orders
    if (!isEligibleForRevenue(o)) return false
    const createdAt = String(o?.created_at ?? '')
    if (!createdAt || createdAt < previousStartIso) return false
    return createdAt >= previousStartIso
  })

  /** Si la jointure échoue ou est vide, repli sur order_id (même logique que le dashboard). */
  const orderIdsForItems = Array.from(new Set([...currentOrderIds, ...previousOrderIds]))
  const paidOrderIds = Array.from(paidOrderIdSet).slice(0, 5000)

  if (orderItems.length === 0 || itemsJoinErr) {
    const idsForFallback = paidOrderIds.length > 0 ? paidOrderIds : orderIdsForItems
    if (idsForFallback.length > 0) {
      const { data: itemRows } = await supabase
        .from('order_items')
        .select(
          'product_id, quantity, unit_price, total_price, order_id, orders!inner(id, created_at, status, payment_status, vendor_id)'
        )
        .in('order_id', idsForFallback as any)
        .limit(20000)

      orderItems = (itemRows ?? []).filter((row: any) => {
        const oid = String(row?.order_id ?? row?.orders?.id ?? '')
        if (!currentOrderIds.has(oid) && !previousOrderIds.has(oid)) return false
        return isEligibleForRevenue(row.orders)
      })
    }
  }

  if (paidOrderIds.length > 0 && orderItems.length === 0) {
    const orderById = new Map<string, any>(orders.map((o: any) => [String(o?.id ?? ''), o]))
    const { data: fallbackItems } = await supabase
      .from('order_items')
      .select('product_id, quantity, unit_price, total_price, order_id')
      .in('order_id', paidOrderIds as any)
      .limit(20000)

    orderItems = (fallbackItems ?? [])
      .map((it: any) => ({
        ...it,
        orders: orderById.get(String(it?.order_id ?? '')) ?? null
      }))
      .filter((row: any) => {
        const oid = String(row?.order_id ?? '')
        if (!currentOrderIds.has(oid) && !previousOrderIds.has(oid)) return false
        return isEligibleForRevenue(row.orders)
      })
  }

  if (paidOrderIds.length > 0 && orderItems.length === 0) {
    const { data: ordersWithItems } = await supabase
      .from('orders')
      .select(
        'id, created_at, status, payment_status, order_items (product_id, quantity, unit_price, total_price)'
      )
      .in('vendor_id', vendorIds as any)
      .in('id', paidOrderIds.slice(0, 4000) as any)

    const flat: any[] = []
    for (const o of ordersWithItems ?? []) {
      if (!isEligibleForRevenue(o)) continue
      const oid = String((o as any)?.id ?? '')
      if (!currentOrderIds.has(oid) && !previousOrderIds.has(oid)) continue
      const items = Array.isArray((o as any)?.order_items) ? (o as any).order_items : []
      for (const it of items) {
        flat.push({
          ...it,
          order_id: oid,
          orders: {
            id: (o as any).id,
            created_at: (o as any).created_at,
            status: (o as any).status,
            delivery_status: (o as any).delivery_status,
            payment_status: (o as any).payment_status
          }
        })
      }
    }
    orderItems = flat
  }

  let currentSales = 0
  let previousSales = 0
  let currentRevenue = 0
  let previousRevenue = 0

  const salesByDay = new Map<string, { sales: number; revenue: number }>()
  const productStatsCurrent = new Map<string, { sales: number; revenue: number }>()

  for (const item of orderItems) {
    const oid = String(item?.order_id ?? item?.orders?.id ?? '')
    const productId = String(item?.product_id ?? '')
    const qty = Number(item?.quantity ?? 0) || 0
    const lineTotal = resolveLineTotal(item)
    const createdAt = String(item?.orders?.created_at ?? '')
    const dayKey = createdAt ? createdAt.slice(0, 10) : ''

    if (createdAt >= currentStartIso) {
      currentSales += qty
      currentRevenue += lineTotal
      if (dayKey) {
        const bucket = salesByDay.get(dayKey) ?? { sales: 0, revenue: 0 }
        bucket.sales += qty
        bucket.revenue += lineTotal
        salesByDay.set(dayKey, bucket)
      }
      if (productId) {
        const row = productStatsCurrent.get(productId) ?? { sales: 0, revenue: 0 }
        row.sales += qty
        row.revenue += lineTotal
        productStatsCurrent.set(productId, row)
      }
    } else if (createdAt >= previousStartIso && createdAt < currentStartIso) {
      previousSales += qty
      previousRevenue += lineTotal
    }
  }

  /**
   * Commandes de la période courante : liste principale + tout ID vu dans order_items
   * (évite les écarts si la requête orders est tronquée ou désynchronisée).
   */
  const currentOrderById = new Map<string, any>()
  for (const o of orders) {
    const createdAt = String(o?.created_at ?? '')
    const id = String(o?.id ?? '')
    if (!id || createdAt < currentStartIso) continue
    currentOrderById.set(id, o)
  }
  for (const item of orderItems) {
    const ord = item?.orders
    if (!ord) continue
    const createdAt = String(ord?.created_at ?? '')
    if (createdAt < currentStartIso) continue
    const oid = String(ord?.id ?? item?.order_id ?? '')
    if (!oid || currentOrderById.has(oid)) continue
    currentOrderById.set(oid, ord)
  }

  const previousOrders = orders.filter((o: any) => previousOrderIds.has(String(o?.id ?? '')))

  /**
   * Fallback aligné dashboard : lignes order_items vides ou total_price à 0, mais commandes avec final_total.
   */
  if (currentRevenue <= 0 && currentOrderById.size > 0) {
    const list = Array.from(currentOrderById.values())
    currentRevenue = list.reduce((acc: number, o: any) => acc + orderHeaderAmount(o), 0)
    if (currentSales <= 0) currentSales = list.length
    for (const o of list) {
      const createdAt = String(o?.created_at ?? '')
      const dayKey = createdAt ? createdAt.slice(0, 10) : ''
      if (!dayKey) continue
      const amt = orderHeaderAmount(o)
      const bucket = salesByDay.get(dayKey) ?? { sales: 0, revenue: 0 }
      bucket.sales += 1
      bucket.revenue += amt
      salesByDay.set(dayKey, bucket)
    }
  }
  /**
   * Second repli aligné sur GET /api/vendor/dashboard : somme des en-têtes de commande
   * non annulées sur la période si le CA issu des lignes / commandes « éligibles » reste à 0.
   */
  if (currentRevenue <= 0) {
    const headerSum = nonCancelledHeaderRevenueInclusiveEnd(orderRowsInWindow, currentStartIso, nowIso)
    if (headerSum > 0) {
      currentRevenue = headerSum
      if (currentSales <= 0) {
        currentSales = countNonCancelledOrdersInclusiveEnd(orderRowsInWindow, currentStartIso, nowIso)
      }
      for (let i = 0; i < days; i++) {
        const d = new Date(currentStart)
        d.setDate(currentStart.getDate() + i)
        const key = d.toISOString().slice(0, 10)
        salesByDay.set(key, { sales: 0, revenue: 0 })
      }
      fillSalesByDayFromNonCancelledOrders(orderRowsInWindow, currentStartIso, nowIso, salesByDay)
    }
  }
  if (previousRevenue <= 0 && previousOrders.length > 0) {
    previousRevenue = previousOrders.reduce((acc: number, o: any) => acc + orderHeaderAmount(o), 0)
    if (previousSales <= 0) previousSales = previousOrders.length
  }
  if (previousRevenue <= 0) {
    const prevHeader = nonCancelledHeaderRevenueHalfOpen(orderRowsInWindow, previousStartIso, currentStartIso)
    if (prevHeader > 0) {
      previousRevenue = prevHeader
      if (previousSales <= 0) {
        previousSales = countNonCancelledOrdersHalfOpen(orderRowsInWindow, previousStartIso, currentStartIso)
      }
    }
  }

  const customerIdsCurrent = new Set<string>()
  const customerIdsPrevious = new Set<string>()
  const customerSpend = new Map<string, { total: number; orders: number; lastAt: string }>()

  /** Clients actifs : toutes commandes non annulées de la période (pas seulement « éligibles » au CA). */
  for (const o of orderRowsInWindow) {
    const createdAt = String(o?.created_at ?? '')
    if (!createdAt || createdAt < currentStartIso) continue
    if (isOrderCancelled(o)) continue
    const cid = String(o?.user_id ?? o?.customer_id ?? '').trim()
    if (cid) customerIdsCurrent.add(cid)
  }

  currentOrderById.forEach((order: any) => {
    const cid = String(order?.user_id ?? order?.customer_id ?? '').trim()
    if (!cid) return
    customerIdsCurrent.add(cid)
    const amount = orderHeaderAmount(order)
    const createdAt = String(order?.created_at ?? '')
    const row = customerSpend.get(cid) ?? { total: 0, orders: 0, lastAt: '' }
    row.total += amount
    row.orders += 1
    if (!row.lastAt || createdAt > row.lastAt) row.lastAt = createdAt
    customerSpend.set(cid, row)
  })

  previousOrders.forEach((order: any) => {
    const cid = String(order?.user_id ?? order?.customer_id ?? '').trim()
    if (cid) customerIdsPrevious.add(cid)
  })

  const repeatCustomers = Array.from(customerSpend.values()).filter((c) => c.orders > 1).length
  const retentionRate =
    customerIdsCurrent.size > 0 ? Number(((repeatCustomers / customerIdsCurrent.size) * 100).toFixed(1)) : 0

  const ltv =
    customerIdsCurrent.size > 0 ? Math.round(currentRevenue / customerIdsCurrent.size) : 0
  const previousLtv =
    customerIdsPrevious.size > 0 ? Math.round(previousRevenue / customerIdsPrevious.size) : 0

  const cac = customerIdsCurrent.size > 0 ? Math.round(currentRevenue * 0.05 / customerIdsCurrent.size) : 0
  const previousCac =
    customerIdsPrevious.size > 0 ? Math.round(previousRevenue * 0.05 / customerIdsPrevious.size) : 0

  const roiPercent =
    currentRevenue > 0
      ? Number((((currentRevenue - currentRevenue * 0.12) / Math.max(currentRevenue * 0.12, 1)) * 100).toFixed(1))
      : 0

  let totalViews = 0
  if (productIds.length > 0) {
    const { data: statsRows } = await supabase
      .from('product_statistics')
      .select('product_id, total_views, total_sales, average_rating, review_count, share_count')
      .in('product_id', productIds as any)

    ;(statsRows ?? []).forEach((row: any) => {
      totalViews += Number(row?.total_views ?? 0) || 0
    })
  }

  const conversionRate =
    totalViews > 0 ? Number(((currentSales / totalViews) * 100).toFixed(2)) : currentSales > 0 ? 100 : 0

  const salesSeries: VendorAnalyticsSalesPoint[] = []
  for (let i = 0; i < days; i++) {
    const d = new Date(currentStart)
    d.setDate(currentStart.getDate() + i)
    const key = d.toISOString().slice(0, 10)
    const bucket = salesByDay.get(key) ?? { sales: 0, revenue: 0 }
    salesSeries.push({
      period: formatSeriesLabel(d, period),
      sales: bucket.sales,
      revenue: Math.round(bucket.revenue),
      growth: 0
    })
  }

  for (let i = 1; i < salesSeries.length; i++) {
    const prev = salesSeries[i - 1].sales
    const cur = salesSeries[i].sales
    salesSeries[i].growth = computeChangePercent(cur, prev)
  }

  let sharePlatforms: VendorAnalyticsSharePlatform[] = []
  let totalShares = 0
  /**
   * Aligné sur GET /api/vendor/shares/summary : `product_shares` + `eq('vendor_id', vendorId)` (auth),
   * fenêtre start/end, limite 5000, `isAnalyticsEnabled` (sinon totaux = 0 comme l’écran Partages).
   */
  const analyticsAllowed = await isAnalyticsEnabled({ supabase, userId: vendorId })
  if (analyticsAllowed) {
    const { data: shareRows } = await supabase
      .from('product_shares')
      .select('id, platform')
      .eq('vendor_id', vendorId)
      .gte('created_at', currentStartIso)
      .lte('created_at', nowIso)
      .order('created_at', { ascending: false })
      .limit(5000)

    const shares = shareRows ?? []
    totalShares = shares.length

    const byPlatformMap = new Map<string, number>()
    for (const s of shares) {
      const p = String(s?.platform ?? '').trim().toLowerCase() || 'unknown'
      byPlatformMap.set(p, (byPlatformMap.get(p) ?? 0) + 1)
    }

    sharePlatforms = Array.from(byPlatformMap.entries())
      .map(([p, sharesCount]) => {
        const platform = p.charAt(0).toUpperCase() + p.slice(1)
        return {
          platform,
          shares: sharesCount,
          engagement: sharesCount > 0 ? Number(Math.min(25, 5 + sharesCount * 0.5).toFixed(1)) : 0,
          reach: sharesCount * 120,
          growth: 0
        }
      })
      .sort((a, b) => b.shares - a.shares)
  }

  let averageRating = 0
  let totalReviews = 0
  if (productIds.length > 0) {
    const { data: reviewRows } = await supabase
      .from('product_reviews')
      .select('rating')
      .in('product_id', productIds as any)
      .eq('status', 'approved')

    const ratings = (reviewRows ?? [])
      .map((r: any) => Number(r?.rating))
      .filter((n) => Number.isFinite(n))
    totalReviews = ratings.length
    averageRating =
      ratings.length > 0
        ? Number((ratings.reduce((sum, n) => sum + n, 0) / ratings.length).toFixed(2))
        : 0
  }

  let totalPoints = 0
  const { data: pointsRow } = await supabase
    .from('loyalty_points')
    .select('points_balance')
    .eq('user_id', vendorId)
    .maybeSingle()

  totalPoints = Number((pointsRow as any)?.points_balance ?? 0) || 0

  let marketPosition = 0
  let totalVendors = 0
  const { data: rankingRows } = await supabase
    .from('rankings')
    .select('overall_rank, rank_position')
    .in('user_id', vendorIds as any)
    .order('created_at', { ascending: false })
    .limit(1)

  const rankingRow = Array.isArray(rankingRows) ? rankingRows[0] : null
  const rankingValueRaw =
    (rankingRow as any)?.overall_rank ?? (rankingRow as any)?.rank ?? (rankingRow as any)?.ranking ?? 0
  marketPosition = Number.isFinite(Number(rankingValueRaw)) ? Number(rankingValueRaw) : 0

  const { count: vendorCount } = await supabase
    .from('vendor_stats')
    .select('vendor_id', { count: 'exact', head: true })

  totalVendors = Number(vendorCount ?? 0)

  if (totalVendors <= 0) {
    const { count: usersVendorCount } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'vendor')
    totalVendors = Number(usersVendorCount ?? 0)
  }

  if (totalVendors <= 0) {
    const { data: rankingPeers } = await supabase.from('rankings').select('user_id').limit(5000)
    const peerIds = new Set(
      (rankingPeers ?? []).map((r: any) => String(r?.user_id ?? '').trim()).filter(Boolean)
    )
    totalVendors = peerIds.size
  }

  const growthRate = computeChangePercent(currentSales, previousSales)
  const revenueGrowthRate = computeChangePercent(currentRevenue, previousRevenue)

  const topProducts: VendorAnalyticsProductRow[] = Array.from(productStatsCurrent.entries())
    .map(([productId, stats]) => {
      const product = productById.get(productId)
      return {
        id: productId,
        name: String(product?.name ?? 'Produit'),
        sales: stats.sales,
        revenue: Math.round(stats.revenue),
        rating: averageRating,
        shares: 0,
        growth: 0,
        image: String(product?.main_image ?? '')
      }
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)

  if (productIds.length > 0 && topProducts.length > 0) {
    const topIds = topProducts.map((p) => p.id)
    const sharesForTopPromise = analyticsAllowed
      ? supabase
          .from('product_shares')
          .select('product_id')
          .eq('vendor_id', vendorId)
          .in('product_id', topIds as any)
          .gte('created_at', currentStartIso)
          .lte('created_at', nowIso)
      : Promise.resolve({ data: [] as any[] | null })

    const [{ data: statsForTop }, { data: sharesForTop }, { data: reviewsForTop }] = await Promise.all([
      supabase
        .from('product_statistics')
        .select('product_id, average_rating, share_count')
        .in('product_id', topIds as any),
      sharesForTopPromise,
      supabase
        .from('product_reviews')
        .select('product_id, rating')
        .in('product_id', topIds as any)
        .eq('status', 'approved')
    ])

    const ratingByProduct = new Map<string, number[]>()
    ;(reviewsForTop ?? []).forEach((row: any) => {
      const pid = String(row?.product_id ?? '')
      const rating = Number(row?.rating)
      if (!pid || !Number.isFinite(rating)) return
      const list = ratingByProduct.get(pid) ?? []
      list.push(rating)
      ratingByProduct.set(pid, list)
    })

    const sharesByProduct = new Map<string, number>()
    ;(sharesForTop ?? []).forEach((row: any) => {
      const pid = String(row?.product_id ?? '')
      if (!pid) return
      sharesByProduct.set(pid, (sharesByProduct.get(pid) ?? 0) + 1)
    })

    const statsMap = new Map<string, any>()
    ;(statsForTop ?? []).forEach((row: any) => {
      if (row?.product_id) statsMap.set(String(row.product_id), row)
    })

    topProducts.forEach((product) => {
      const ratings = ratingByProduct.get(product.id) ?? []
      const avg =
        ratings.length > 0
          ? Number((ratings.reduce((s, n) => s + n, 0) / ratings.length).toFixed(2))
          : Number(statsMap.get(product.id)?.average_rating ?? 0) || 0
      product.rating = avg
      product.shares =
        sharesByProduct.get(product.id) ??
        (Number(statsMap.get(product.id)?.share_count ?? 0) || 0)
    })
  }

  const revenueByCategoryMap = new Map<string, number>()
  productStatsCurrent.forEach((stats, productId) => {
    const category = String(productById.get(productId)?.category ?? 'Autres') || 'Autres'
    revenueByCategoryMap.set(category, (revenueByCategoryMap.get(category) ?? 0) + stats.revenue)
  })
  const categoryTotal = Array.from(revenueByCategoryMap.values()).reduce((s, v) => s + v, 0)
  const revenueByCategory = Array.from(revenueByCategoryMap.entries())
    .map(([category, revenue]) => ({
      category,
      revenue: Math.round(revenue),
      percentage: categoryTotal > 0 ? Number(((revenue / categoryTotal) * 100).toFixed(1)) : 0
    }))
    .sort((a, b) => b.revenue - a.revenue)

  const insights: VendorAnalyticsInsight[] = []
  if (growthRate > 5) {
    insights.push({
      id: 'sales-up',
      type: 'positive',
      title: 'Croissance des ventes',
      description: `Vos ventes ont progressé de ${growthRate}% sur la période sélectionnée.`,
      confidence: Math.min(95, 60 + Math.abs(growthRate))
    })
  }
  if (growthRate < -5) {
    insights.push({
      id: 'sales-down',
      type: 'negative',
      title: 'Baisse des ventes',
      description: `Vos ventes ont reculé de ${Math.abs(growthRate)}% — vérifiez vos promotions et stocks.`,
      confidence: Math.min(95, 60 + Math.abs(growthRate))
    })
  }
  if (totalShares > 0 && sharePlatforms.length > 0) {
    const top = sharePlatforms[0]
    insights.push({
      id: 'share-leader',
      type: 'positive',
      title: `Canal dominant : ${top.platform}`,
      description: `${top.shares} partages enregistrés sur la période via ${top.platform}.`,
      confidence: 78
    })
  }
  if (retentionRate < 25 && customerIdsCurrent.size > 3) {
    insights.push({
      id: 'retention-low',
      type: 'warning',
      title: 'Rétention client à améliorer',
      description: `Seulement ${retentionRate}% de clients ont passé plus d'une commande sur la période.`,
      confidence: 72
    })
  }

  const optimizations: VendorAnalyticsOptimization[] = []
  if (averageRating > 0 && averageRating < 4) {
    optimizations.push({
      id: 'reviews-quality',
      title: 'Améliorer la satisfaction',
      description: 'Répondez aux avis récents et améliorez la fiche produit des articles les moins notés.',
      status: 'pending',
      progress: 0
    })
  }
  if (totalShares < 5 && productIds.length > 0) {
    optimizations.push({
      id: 'boost-shares',
      title: 'Booster les partages',
      description: 'Encouragez vos clients à partager vos produits sur WhatsApp et les réseaux sociaux.',
      status: 'pending',
      progress: 0
    })
  }
  if (topProducts.length > 0 && topProducts[0].sales > 0) {
    optimizations.push({
      id: 'top-product',
      title: `Capitaliser sur « ${topProducts[0].name} »`,
      description: 'Mettez ce produit en avant sur votre vitrine et dans vos campagnes.',
      status: 'pending',
      progress: 0
    })
  }

  const customerIds = Array.from(customerSpend.keys()).slice(0, 20)
  let customersSample: VendorAnalyticsCustomerSummary[] = []
  if (customerIds.length > 0) {
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('user_id, first_name, last_name')
      .in('user_id', customerIds as any)

    const nameById = new Map<string, string>()
    ;(profiles ?? []).forEach((p: any) => {
      const uid = String(p?.user_id ?? '')
      const name = `${String(p?.first_name ?? '')} ${String(p?.last_name ?? '')}`.trim()
      if (uid) nameById.set(uid, name || 'Client')
    })

    customersSample = customerIds.map((cid) => {
      const row = customerSpend.get(cid)!
      return {
        id: cid,
        name: nameById.get(cid) ?? 'Client',
        ordersCount: row.orders,
        totalSpent: Math.round(row.total),
        lastOrderAt: row.lastAt || null,
        isRepeat: row.orders > 1
      }
    })
  }

  const sharesProgress = Math.min(100, totalShares > 0 ? Math.round((totalShares / Math.max(productIds.length, 1)) * 10) : 0)
  const pointsProgress = Math.min(100, totalPoints > 0 ? Math.round(totalPoints / 100) : 0)

  return {
    period,
    generatedAt: now.toISOString(),
    summary: {
      totalSales: Math.round(currentSales),
      totalRevenue: Math.round(currentRevenue),
      totalCustomers: customerIdsCurrent.size,
      averageRating,
      totalReviews,
      totalShares,
      totalPoints,
      growthRate,
      revenueGrowthRate,
      marketPosition,
      totalVendors,
      conversionRate,
      sharesProgress,
      pointsProgress
    },
    overview: {
      salesGrowthRate: growthRate,
      revenueGrowthRate,
      customersGrowthRate: computeChangePercent(customerIdsCurrent.size, customerIdsPrevious.size),
      conversionGrowthRate: 0,
      activeCustomers: customerIdsCurrent.size,
      conversionRate
    },
    advanced: {
      roiPercent,
      roiChangePercent: computeChangePercent(roiPercent, roiPercent * 0.9),
      ltv,
      ltvChangePercent: computeChangePercent(ltv, previousLtv),
      cac,
      cacChangePercent: computeChangePercent(cac, previousCac),
      retentionRate,
      retentionChangePercent: 0
    },
    salesSeries,
    topProducts,
    sharePlatforms,
    insights,
    optimizations,
    revenueByCategory,
    customersSample
  }
}

export type VendorAnalyticsExportFormat = 'json' | 'csv'

/** Libellé UI → clé d’export (données synchronisées `analyticsForUi`). */
export function resolveVendorReportExportType(reportLabel: string): string {
  const map: Record<string, string> = {
    Performance: 'performance',
    Clients: 'clients',
    Revenus: 'revenue',
    Comparatif: 'comparative',
    Prédictif: 'predictive',
    Personnalisé: 'all',
    'Insights IA': 'insights',
    Synthèse: 'summary',
    'Données Détaillées': 'detailed'
  }
  return map[reportLabel] ?? 'detailed'
}

function escapeCsvCell(value: unknown): string {
  const s = String(value ?? '')
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes(';')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function salesSeriesToCsv(data: VendorAnalyticsData): string {
  const lines = ['period;ventes;ca_fcfa;croissance_pct']
  for (const row of data.salesSeries) {
    lines.push(
      [row.period, row.sales, row.revenue, row.growth].map(escapeCsvCell).join(';')
    )
  }
  return lines.join('\n')
}

function topProductsToCsv(data: VendorAnalyticsData): string {
  const lines = ['produit_id;nom;ventes;ca_fcfa;partages;note']
  for (const p of data.topProducts) {
    lines.push(
      [p.id, p.name, p.sales, p.revenue, p.shares, p.rating].map(escapeCsvCell).join(';')
    )
  }
  return lines.join('\n')
}

function customersToCsv(data: VendorAnalyticsData): string {
  const lines = ['client_id;nom;commandes;total_fcfa;derniere_commande;client_fidele']
  for (const c of data.customersSample) {
    lines.push(
      [c.id, c.name, c.ordersCount, c.totalSpent, c.lastOrderAt ?? '', c.isRepeat ? 'oui' : 'non']
        .map(escapeCsvCell)
        .join(';')
    )
  }
  return lines.join('\n')
}

/**
 * Contenu d’export aligné sur les données synchronisées affichées à l’écran.
 */
export function buildVendorAnalyticsExportPayload(
  data: VendorAnalyticsData,
  type: string
): unknown {
  const base = { period: data.period, generatedAt: data.generatedAt }

  if (type === 'summary') {
    return { ...base, summary: data.summary, overview: data.overview }
  }
  if (type === 'ventes') {
    return {
      ...base,
      summary: data.summary,
      overview: data.overview,
      salesSeries: data.salesSeries
    }
  }
  if (type === 'performance') {
    return {
      ...base,
      summary: data.summary,
      topProducts: data.topProducts,
      advanced: data.advanced,
      revenueByCategory: data.revenueByCategory
    }
  }
  if (type === 'clients') {
    return {
      ...base,
      summary: data.summary,
      overview: data.overview,
      customersSample: data.customersSample,
      advanced: {
        ltv: data.advanced.ltv,
        cac: data.advanced.cac,
        retentionRate: data.advanced.retentionRate
      }
    }
  }
  if (type === 'revenue' || type === 'revenus') {
    return {
      ...base,
      summary: data.summary,
      overview: data.overview,
      salesSeries: data.salesSeries,
      revenueByCategory: data.revenueByCategory,
      advanced: data.advanced
    }
  }
  if (type === 'comparative' || type === 'comparatif') {
    return {
      ...base,
      summary: data.summary,
      overview: data.overview,
      salesSeries: data.salesSeries
    }
  }
  if (type === 'predictive' || type === 'predictif') {
    return {
      ...base,
      summary: data.summary,
      insights: data.insights,
      optimizations: data.optimizations,
      salesSeries: data.salesSeries,
      advanced: data.advanced
    }
  }
  if (type === 'detailed') {
    return {
      ...base,
      summary: data.summary,
      overview: data.overview,
      advanced: data.advanced,
      salesSeries: data.salesSeries,
      topProducts: data.topProducts,
      sharePlatforms: data.sharePlatforms,
      revenueByCategory: data.revenueByCategory,
      customersSample: data.customersSample
    }
  }
  if (type === 'insights') {
    return { ...base, insights: data.insights, optimizations: data.optimizations }
  }
  return data
}

/**
 * Exporte les analytics vendeur (JSON ou CSV) — données déjà fusionnées dashboard + commandes.
 */
export function buildVendorAnalyticsExportBlob(
  data: VendorAnalyticsData,
  type: string,
  format: VendorAnalyticsExportFormat = 'json'
): Blob {
  if (format === 'csv') {
    const sections: string[] = []
    const wantsSales =
      type === 'ventes' ||
      type === 'summary' ||
      type === 'revenue' ||
      type === 'revenus' ||
      type === 'comparative' ||
      type === 'comparatif' ||
      type === 'predictive' ||
      type === 'predictif' ||
      type === 'detailed' ||
      type === 'all'
    const wantsProducts =
      type === 'performance' || type === 'detailed' || type === 'all'
    const wantsClients = type === 'clients' || type === 'detailed' || type === 'all'

    if (wantsSales) {
      sections.push('=== Evolution des ventes ===', salesSeriesToCsv(data))
    }
    if (wantsProducts) {
      sections.push('=== Performance produits ===', topProductsToCsv(data))
    }
    if (wantsClients) {
      sections.push('=== Clients ===', customersToCsv(data))
    }
    const csv = sections.length > 0 ? sections.join('\n') : 'Aucune donnée à exporter'
    return new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
  }

  const payload = buildVendorAnalyticsExportPayload(data, type)
  return new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
}

/**
 * Rapport PDF (jsPDF) — mêmes données synchronisées que l’écran Statistiques & Analyses.
 */
export async function buildVendorAnalyticsExportPdf(
  data: VendorAnalyticsData,
  type: string = 'all'
): Promise<Blob> {
  const [{ jsPDF }, autoTableModule] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable')
  ])
  const autoTable = (autoTableModule as any).default ?? autoTableModule
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })

  const generatedLabel = data.generatedAt
    ? new Date(data.generatedAt).toLocaleString('fr-FR')
    : new Date().toLocaleString('fr-FR')

  const titleByType: Record<string, string> = {
    all: 'Rapport complet',
    summary: 'Rapport synthèse',
    detailed: 'Données détaillées',
    insights: 'Insights IA',
    ventes: 'Rapport ventes',
    performance: 'Rapport performance',
    clients: 'Rapport clients',
    revenue: 'Rapport revenus',
    revenus: 'Rapport revenus',
    comparative: 'Rapport comparatif',
    comparatif: 'Rapport comparatif',
    predictive: 'Rapport prédictif',
    predictif: 'Rapport prédictif'
  }
  const reportTitle = titleByType[type] ?? 'Rapport analytics'

  doc.setFontSize(16)
  doc.text(`${reportTitle} — Statistiques & Analyses`, 40, 40)
  doc.setFontSize(10)
  doc.text(`Période: ${data.period} | Généré le: ${generatedLabel}`, 40, 56)

  const s = data.summary
  const adv = data.advanced
  const showSummary =
    type !== 'insights' || data.insights.length === 0

  let cursorY = 68
  if (showSummary) {
    autoTable(doc, {
      startY: cursorY,
      head: [['Indicateur', 'Valeur']],
      body: [
        ['Ventes (période)', String(s.totalSales)],
        ['Chiffre d affaires (F CFA)', String(s.totalRevenue)],
        ['Clients actifs', String(s.totalCustomers)],
        ['Note moyenne', `${s.averageRating}/5`],
        ['Avis approuvés', String(s.totalReviews)],
        ['Partages', String(s.totalShares)],
        ['Taux de conversion', `${s.conversionRate}%`],
        ['Position marché', String(s.marketPosition)],
        ['Vendeurs (classement)', String(s.totalVendors)],
        ['ROI', `${adv.roiPercent}%`],
        ['LTV client (F CFA)', String(adv.ltv)],
        ['CAC (F CFA)', String(adv.cac)],
        ['Rétention', `${adv.retentionRate}%`]
      ],
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [255, 102, 0] }
    })
    cursorY = ((doc as any).lastAutoTable?.finalY as number) ?? cursorY
  }

  const includeSales =
    type === 'all' ||
    type === 'detailed' ||
    type === 'ventes' ||
    type === 'comparative' ||
    type === 'comparatif' ||
    type === 'revenue' ||
    type === 'revenus'
  if (includeSales && data.salesSeries.length > 0) {
    doc.setFontSize(12)
    doc.text('Évolution des ventes', 40, cursorY + 18)
    autoTable(doc, {
      startY: cursorY + 24,
      head: [['Période', 'Ventes', 'CA (F CFA)', 'Croissance %']],
      body: data.salesSeries.map((row) => [
        row.period,
        String(row.sales),
        String(row.revenue),
        String(row.growth)
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [59, 130, 246] }
    })
    cursorY = (doc as any).lastAutoTable?.finalY ?? cursorY
  }

  const includeProducts = type === 'all' || type === 'detailed' || type === 'performance'
  if (includeProducts && data.topProducts.length > 0) {
    doc.setFontSize(12)
    doc.text('Performance produits', 40, cursorY + 18)
    autoTable(doc, {
      startY: cursorY + 24,
      head: [['Produit', 'Ventes', 'CA (F CFA)']],
      body: data.topProducts.slice(0, 15).map((p) => [p.name, String(p.sales), String(p.revenue)]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [16, 185, 129] }
    })
    cursorY = (doc as any).lastAutoTable?.finalY ?? cursorY
  }

  const includeClients = type === 'all' || type === 'detailed' || type === 'clients'
  if (includeClients && data.customersSample.length > 0) {
    doc.setFontSize(12)
    doc.text('Clients', 40, cursorY + 18)
    autoTable(doc, {
      startY: cursorY + 24,
      head: [['Client', 'Commandes', 'Total (F CFA)', 'Fidèle']],
      body: data.customersSample.map((c) => [
        c.name,
        String(c.ordersCount),
        String(c.totalSpent),
        c.isRepeat ? 'Oui' : 'Non'
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [59, 130, 246] }
    })
    cursorY = (doc as any).lastAutoTable?.finalY ?? cursorY
  }

  const includeInsights =
    type === 'all' || type === 'insights' || type === 'predictive' || type === 'predictif'
  if (includeInsights && data.insights.length > 0) {
    doc.setFontSize(12)
    doc.text('Insights IA', 40, cursorY + 18)
    autoTable(doc, {
      startY: cursorY + 24,
      head: [['Titre', 'Description', 'Confiance %']],
      body: data.insights.map((i) => [i.title, i.description, String(i.confidence)]),
      styles: { fontSize: 7, cellPadding: 3 },
      headStyles: { fillColor: [139, 92, 246] }
    })
    cursorY = (doc as any).lastAutoTable?.finalY ?? cursorY
  }

  const includeOptimizations = type === 'all' || type === 'predictive' || type === 'predictif'
  if (includeOptimizations && data.optimizations.length > 0) {
    doc.setFontSize(12)
    doc.text('Optimisations recommandées', 40, cursorY + 18)
    autoTable(doc, {
      startY: cursorY + 24,
      head: [['Action', 'Description', 'Statut']],
      body: data.optimizations.map((o) => [o.title, o.description, o.status]),
      styles: { fontSize: 7, cellPadding: 3 },
      headStyles: { fillColor: [245, 158, 11] }
    })
  }

  const arrayBuffer = doc.output('arraybuffer')
  return new Blob([arrayBuffer], { type: 'application/pdf' })
}

export type VendorAnalyticsExportFileFormat = 'json' | 'csv' | 'pdf'

export async function buildVendorAnalyticsExportFile(
  data: VendorAnalyticsData,
  type: string,
  format: VendorAnalyticsExportFileFormat
): Promise<{ blob: Blob; extension: string }> {
  if (format === 'pdf') {
    return { blob: await buildVendorAnalyticsExportPdf(data, type), extension: 'pdf' }
  }
  const normalized = format === 'csv' ? 'csv' : 'json'
  return {
    blob: buildVendorAnalyticsExportBlob(data, type, normalized),
    extension: normalized
  }
}
