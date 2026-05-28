import type { SupabaseClient } from '@supabase/supabase-js'

import { isAnalyticsEnabled } from '@/app/api/_helpers/analytics-privacy'

export type VendorAnalyticsPeriod = '7d' | '30d' | '90d' | '1y'

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
  return 30
}

/**
 * Heuristique alignée sur GET /api/vendor/dashboard — évite les divergences de CA / ventes.
 */
function isPaidLikeStatus(value: unknown): boolean {
  const s = typeof value === 'string' ? value.trim().toLowerCase() : ''
  if (!s) return false
  if (
    s === 'unpaid' ||
    s === 'failed' ||
    s === 'cancelled' ||
    s === 'canceled' ||
    s === 'pending' ||
    s === 'complete' ||
    s === 'completed'
  ) {
    return false
  }
  return s.includes('paid') || s.includes('success') || s.includes('succeed')
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
  if (period === '1y') {
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

  const { data: orderRows } = await supabase
    .from('orders')
    .select(
      'id, user_id, customer_id, vendor_id, created_at, status, delivery_status, payment_status, total_amount, final_total'
    )
    .in('vendor_id', vendorIds as any)
    .gte('created_at', previousStartIso)
    .order('created_at', { ascending: false })
    .limit(20000)

  const orderRowsRaw = Array.isArray(orderRows) ? orderRows : []
  const orders = orderRowsRaw.filter(isEligibleForRevenue)

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
        user_id,
        customer_id,
        created_at,
        status,
        delivery_status,
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
  if (orderItems.length === 0 || itemsJoinErr) {
    if (orderIdsForItems.length > 0) {
      const { data: itemRows } = await supabase
        .from('order_items')
        .select(
          'product_id, quantity, unit_price, total_price, order_id, orders!inner(id, created_at, status, delivery_status, payment_status, vendor_id)'
        )
        .in('order_id', orderIdsForItems as any)
        .limit(20000)

      orderItems = (itemRows ?? []).filter((row: any) => {
        const oid = String(row?.order_id ?? row?.orders?.id ?? '')
        if (!currentOrderIds.has(oid) && !previousOrderIds.has(oid)) return false
        return isEligibleForRevenue(row.orders)
      })
    }
  }

  if (orderIdsForItems.length > 0 && orderItems.length === 0) {
    const orderById = new Map<string, any>(orders.map((o: any) => [String(o?.id ?? ''), o]))
    const { data: fallbackItems } = await supabase
      .from('order_items')
      .select('product_id, quantity, unit_price, total_price, order_id')
      .in('order_id', orderIdsForItems as any)
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

  if (orderIdsForItems.length > 0 && orderItems.length === 0) {
    const { data: ordersWithItems } = await supabase
      .from('orders')
      .select(
        'id, created_at, status, delivery_status, payment_status, order_items (product_id, quantity, unit_price, total_price)'
      )
      .in('vendor_id', vendorIds as any)
      .in('id', orderIdsForItems.slice(0, 4000) as any)

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
    const headerSum = nonCancelledHeaderRevenueInclusiveEnd(orderRowsRaw, currentStartIso, nowIso)
    if (headerSum > 0) {
      currentRevenue = headerSum
      if (currentSales <= 0) {
        currentSales = countNonCancelledOrdersInclusiveEnd(orderRowsRaw, currentStartIso, nowIso)
      }
      for (let i = 0; i < days; i++) {
        const d = new Date(currentStart)
        d.setDate(currentStart.getDate() + i)
        const key = d.toISOString().slice(0, 10)
        salesByDay.set(key, { sales: 0, revenue: 0 })
      }
      fillSalesByDayFromNonCancelledOrders(orderRowsRaw, currentStartIso, nowIso, salesByDay)
    }
  }
  if (previousRevenue <= 0 && previousOrders.length > 0) {
    previousRevenue = previousOrders.reduce((acc: number, o: any) => acc + orderHeaderAmount(o), 0)
    if (previousSales <= 0) previousSales = previousOrders.length
  }
  if (previousRevenue <= 0) {
    const prevHeader = nonCancelledHeaderRevenueHalfOpen(orderRowsRaw, previousStartIso, currentStartIso)
    if (prevHeader > 0) {
      previousRevenue = prevHeader
      if (previousSales <= 0) {
        previousSales = countNonCancelledOrdersHalfOpen(orderRowsRaw, previousStartIso, currentStartIso)
      }
    }
  }

  const customerIdsCurrent = new Set<string>()
  const customerIdsPrevious = new Set<string>()
  const customerSpend = new Map<string, { total: number; orders: number; lastAt: string }>()

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
    .select('overall_rank, rank, ranking')
    .in('user_id', vendorIds as any)
    .order('created_at', { ascending: false })
    .limit(1)

  const rankingRow = Array.isArray(rankingRows) ? rankingRows[0] : null
  const rankingValueRaw =
    (rankingRow as any)?.overall_rank ?? (rankingRow as any)?.rank ?? (rankingRow as any)?.ranking ?? 0
  marketPosition = Number.isFinite(Number(rankingValueRaw)) ? Number(rankingValueRaw) : 0

  const { count: vendorCount } = await supabase
    .from('vendor_stats')
    .select('id', { count: 'exact', head: true })

  totalVendors = Number(vendorCount ?? 0)

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

/**
 * Exporte les analytics vendeur au format JSON téléchargeable.
 */
export function buildVendorAnalyticsExportBlob(data: VendorAnalyticsData, type: string): Blob {
  const payload =
    type === 'summary'
      ? { summary: data.summary, period: data.period, generatedAt: data.generatedAt }
      : type === 'insights'
        ? { insights: data.insights, optimizations: data.optimizations }
        : data

  return new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
}
