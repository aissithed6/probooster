import { NextRequest, NextResponse } from 'next/server'

import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

type PeriodKey = '7d' | '30d' | '90d' | '6m' | '1y' | 'custom'

type PaidStatus = 'paid' | 'completed'

interface AnalyticsCategoryBreakdown {
  categoryId: string
  name: string
  revenue: number
  orders: number
  sharePercent: number
}

interface AnalyticsTopProduct {
  productId: string
  name: string
  categoryId: string | null
  categoryName: string | null
  revenue: number
  sales: number
  growthPercent: number
}

interface AnalyticsTimeseriesPoint {
  date: string
  revenue: number
  orders: number
}

interface SalesSummary {
  revenue: number
  ordersCount: number
  uniqueCustomers: number
  avgOrderValue: number
  compare: {
    revenue: number
    ordersCount: number
    uniqueCustomers: number
    avgOrderValue: number
  }
  changePercent: {
    revenue: number
    ordersCount: number
    uniqueCustomers: number
    avgOrderValue: number
  }
}

interface WebVitalsSummary {
  pageLoad: {
    p75LcpMs: number | null
    p75InpMs: number | null
    p75Cls: number | null
    coreWebVitalsStatus: 'good' | 'needs-improvement' | 'poor' | null
  }
  compare: {
    pageLoad: {
      p75LcpMs: number | null
      p75InpMs: number | null
      p75Cls: number | null
      coreWebVitalsStatus: 'good' | 'needs-improvement' | 'poor' | null
    }
  }
  changePercent: {
    p75LcpMs: number
  }
}

interface UsersSummary {
  activeCustomers: number
  newUsers: number
  compare: {
    activeCustomers: number
    newUsers: number
  }
  changePercent: {
    activeCustomers: number
    newUsers: number
  }
  countries: Array<{ label: string; count: number; percent: number }>
}

interface VisitsSummary {
  pageViews: number
  compare: {
    pageViews: number
  }
  changePercent: {
    pageViews: number
  }
  conversionRate: number
  compareConversionRate: number
  conversionRateChangePercent: number
}

interface ReviewsSummary {
  averageRating: number
  reviewCount: number
  compare: {
    averageRating: number
    reviewCount: number
  }
  changePercent: {
    averageRating: number
    reviewCount: number
  }
}

interface UptimeSummary {
  availabilityPercent: number
  avgLatencyMs: number | null
  totalChecks: number
  compare: {
    availabilityPercent: number
    avgLatencyMs: number | null
    totalChecks: number
  }
  changePercent: {
    availabilityPercent: number
    avgLatencyMs: number
    totalChecks: number
  }
}

function toIsoDateUtc(date: Date): string {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseDateParam(value: string | null): Date | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  const d = new Date(trimmed)
  if (Number.isNaN(d.getTime())) return null
  return d
}

function percentile(values: number[], p: number): number | null {
  const safe = values.filter((v) => Number.isFinite(v)).sort((a, b) => a - b)
  if (safe.length === 0) return null
  const clamped = Math.min(100, Math.max(0, p))
  const idx = Math.ceil((clamped / 100) * safe.length) - 1
  const pos = Math.min(safe.length - 1, Math.max(0, idx))
  return safe[pos]
}

function computeCwvStatus(params: { p75LcpMs: number | null; p75InpMs: number | null; p75Cls: number | null }):
  | 'good'
  | 'needs-improvement'
  | 'poor'
  | null {
  const lcp = params.p75LcpMs
  const inp = params.p75InpMs
  const cls = params.p75Cls
  if (lcp == null || inp == null || cls == null) return null

  const lcpStatus = lcp <= 2500 ? 'good' : lcp <= 4000 ? 'needs-improvement' : 'poor'
  const inpStatus = inp <= 200 ? 'good' : inp <= 500 ? 'needs-improvement' : 'poor'
  const clsStatus = cls <= 0.1 ? 'good' : cls <= 0.25 ? 'needs-improvement' : 'poor'

  const statuses = [lcpStatus, inpStatus, clsStatus]
  if (statuses.includes('poor')) return 'poor'
  if (statuses.includes('needs-improvement')) return 'needs-improvement'
  return 'good'
}

/**
 * Résout la période demandée en bornes [start, end].
 */
function resolvePeriodBounds(url: URL): { key: PeriodKey; start: Date; end: Date; compareStart: Date; compareEnd: Date } {
  const now = new Date()
  const periodRaw = (url.searchParams.get('period') ?? '30d').trim() as PeriodKey

  const customStart = parseDateParam(url.searchParams.get('start'))
  const customEnd = parseDateParam(url.searchParams.get('end'))

  const end = customEnd ?? now
  const start = new Date(end.getTime())

  const compareEnd = new Date(start.getTime())
  const compareStart = new Date(compareEnd.getTime())

  if (periodRaw === 'custom' && customStart && customEnd) {
    start.setTime(customStart.getTime())
    const duration = Math.max(0, customEnd.getTime() - customStart.getTime())
    compareStart.setTime(Math.max(0, customStart.getTime() - duration))
    return { key: 'custom', start, end, compareStart, compareEnd }
  }

  const dayMs = 24 * 60 * 60 * 1000

  const shiftByMs = (ms: number) => {
    start.setTime(end.getTime() - ms)
    compareStart.setTime(compareEnd.getTime() - ms)
  }

  if (periodRaw === '7d') {
    shiftByMs(7 * dayMs)
    return { key: '7d', start, end, compareStart, compareEnd }
  }

  if (periodRaw === '90d') {
    shiftByMs(90 * dayMs)
    return { key: '90d', start, end, compareStart, compareEnd }
  }

  if (periodRaw === '6m') {
    start.setMonth(end.getMonth() - 6)
    compareStart.setMonth(compareEnd.getMonth() - 6)
    return { key: '6m', start, end, compareStart, compareEnd }
  }

  if (periodRaw === '1y') {
    start.setFullYear(end.getFullYear() - 1)
    compareStart.setFullYear(compareEnd.getFullYear() - 1)
    return { key: '1y', start, end, compareStart, compareEnd }
  }

  // default: 30d
  shiftByMs(30 * dayMs)
  return { key: '30d', start, end, compareStart, compareEnd }
}

function safeNumber(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value ?? 0)
  return Number.isFinite(n) ? n : 0
}

function safeString(value: unknown): string {
  return typeof value === 'string' ? value : String(value ?? '')
}

/**
 * GET /api/super-admin/advanced-analytics
 * Analytics avancées Super Admin basées sur orders + order_items.
 */
export async function GET(request: NextRequest) {
  try {
    await assertSuperAdmin(request)

    const url = new URL(request.url)
    const { key, start, end, compareStart, compareEnd } = resolvePeriodBounds(url)

    const supabase = getSupabaseAdmin()

    const paidStatuses: PaidStatus[] = ['paid', 'completed']

    const startIso = start.toISOString()
    const endIso = end.toISOString()
    const compareStartIso = compareStart.toISOString()
    const compareEndIso = compareEnd.toISOString()

    // 1) Compte des commandes + utilisateurs actifs sur la période (+ période de comparaison).
    const [ordersCountRes, activeUsersRes, compareOrdersCountRes, compareActiveUsersRes] = await Promise.all([
      supabase
        .from('orders')
        .select('id', { head: true, count: 'exact' })
        .gte('created_at', startIso)
        .lte('created_at', endIso)
        .in('payment_status', paidStatuses),
      supabase
        .from('orders')
        .select('customer_id')
        .gte('created_at', startIso)
        .lte('created_at', endIso)
        .in('payment_status', paidStatuses)
        .limit(5000),
      supabase
        .from('orders')
        .select('id', { head: true, count: 'exact' })
        .gte('created_at', compareStartIso)
        .lte('created_at', compareEndIso)
        .in('payment_status', paidStatuses),
      supabase
        .from('orders')
        .select('customer_id')
        .gte('created_at', compareStartIso)
        .lte('created_at', compareEndIso)
        .in('payment_status', paidStatuses)
        .limit(5000)
    ])

    if (ordersCountRes.error) throw ordersCountRes.error
    if (activeUsersRes.error) throw activeUsersRes.error
    if (compareOrdersCountRes.error) throw compareOrdersCountRes.error
    if (compareActiveUsersRes.error) throw compareActiveUsersRes.error

    const ordersCount = ordersCountRes.count ?? 0

    const activeUserIds = new Set(
      (activeUsersRes.data ?? [])
        .map((row: any) => (typeof row?.customer_id === 'string' ? row.customer_id : null))
        .filter((id: any) => typeof id === 'string' && id.length > 0)
    )
    const activeUsers = activeUserIds.size

    const compareOrdersCount = compareOrdersCountRes.count ?? 0
    const compareActiveUserIds = new Set(
      (compareActiveUsersRes.data ?? [])
        .map((row: any) => (typeof row?.customer_id === 'string' ? row.customer_id : null))
        .filter((id: any) => typeof id === 'string' && id.length > 0)
    )
    const compareActiveUsers = compareActiveUserIds.size

    // 2) Revenue + ventes (quantités) + timeseries: basé sur order_items (join orders).
    const fetchPaidItems = async (params: { from: string; to: string }) => {
      const res = await supabase
        .from('order_items')
        .select(
          `
            product_id,
            quantity,
            total_price,
            orders!inner(
              id,
              created_at,
              payment_status
            )
          `
        )
        .gte('orders.created_at', params.from)
        .lte('orders.created_at', params.to)
        .in('orders.payment_status', paidStatuses)
        .limit(10000)

      if (res.error) throw res.error
      return res.data ?? []
    }

    const [items, compareItems] = await Promise.all([
      fetchPaidItems({ from: startIso, to: endIso }),
      fetchPaidItems({ from: compareStartIso, to: compareEndIso })
    ])

    const sumRevenue = (rows: any[]) => rows.reduce((acc, row) => acc + safeNumber((row as any)?.total_price), 0)

    const revenue = sumRevenue(items)
    const compareRevenue = sumRevenue(compareItems)

    const growthPercent = compareRevenue > 0 ? ((revenue - compareRevenue) / compareRevenue) * 100 : revenue > 0 ? 100 : 0

    const avgOrderValue = ordersCount > 0 ? revenue / ordersCount : 0
    const compareAvgOrderValue = compareOrdersCount > 0 ? compareRevenue / compareOrdersCount : 0

    const percentChange = (current: number, previous: number): number => {
      if (previous > 0) return ((current - previous) / previous) * 100
      return current > 0 ? 100 : 0
    }

    const salesSummary: SalesSummary = {
      revenue,
      ordersCount,
      uniqueCustomers: activeUsers,
      avgOrderValue,
      compare: {
        revenue: compareRevenue,
        ordersCount: compareOrdersCount,
        uniqueCustomers: compareActiveUsers,
        avgOrderValue: compareAvgOrderValue
      },
      changePercent: {
        revenue: percentChange(revenue, compareRevenue),
        ordersCount: percentChange(ordersCount, compareOrdersCount),
        uniqueCustomers: percentChange(activeUsers, compareActiveUsers),
        avgOrderValue: percentChange(avgOrderValue, compareAvgOrderValue)
      }
    }

    // 2bis) Utilisateurs (nouveaux utilisateurs + répartition par pays sur clients actifs).
    const [newUsersRes, compareNewUsersRes] = await Promise.all([
      supabase
        .from('users')
        .select('id', { head: true, count: 'exact' })
        .gte('created_at', startIso)
        .lte('created_at', endIso),
      supabase
        .from('users')
        .select('id', { head: true, count: 'exact' })
        .gte('created_at', compareStartIso)
        .lte('created_at', compareEndIso)
    ])

    if (newUsersRes.error) throw newUsersRes.error
    if (compareNewUsersRes.error) throw compareNewUsersRes.error

    const newUsers = newUsersRes.count ?? 0
    const compareNewUsers = compareNewUsersRes.count ?? 0

    const countryCounts = new Map<string, number>()
    const activeCustomerIds = Array.from(activeUserIds).slice(0, 2000)

    if (activeCustomerIds.length > 0) {
      const { data: profiles, error } = await supabase
        .from('user_profiles')
        .select('user_id, country')
        .in('user_id', activeCustomerIds as any)
        .limit(5000)

      if (error) {
        console.warn('⚠️ advanced-analytics users country query failed:', error)
      } else {
        for (const row of profiles ?? []) {
          const label = typeof (row as any)?.country === 'string' ? String((row as any).country).trim() : ''
          const countryLabel = label || 'Non renseigné'
          countryCounts.set(countryLabel, (countryCounts.get(countryLabel) ?? 0) + 1)
        }
      }
    }

    const countriesRaw = Array.from(countryCounts.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)

    const countriesTotal = countriesRaw.reduce((acc, row) => acc + row.count, 0)
    const countries = countriesRaw.map((row) => ({
      ...row,
      percent: countriesTotal > 0 ? Math.round((row.count / countriesTotal) * 100) : 0
    }))

    const usersSummary: UsersSummary = {
      activeCustomers: activeUsers,
      newUsers,
      compare: {
        activeCustomers: compareActiveUsers,
        newUsers: compareNewUsers
      },
      changePercent: {
        activeCustomers: percentChange(activeUsers, compareActiveUsers),
        newUsers: percentChange(newUsers, compareNewUsers)
      },
      countries
    }

    // 2ter) Visites (page views) via automation_events.event_type='page.viewed'
    const [pageViewsRes, comparePageViewsRes] = await Promise.all([
      supabase
        .from('automation_events')
        .select('id', { head: true, count: 'exact' })
        .eq('event_type', 'page.viewed')
        .gte('created_at', startIso)
        .lte('created_at', endIso),
      supabase
        .from('automation_events')
        .select('id', { head: true, count: 'exact' })
        .eq('event_type', 'page.viewed')
        .gte('created_at', compareStartIso)
        .lte('created_at', compareEndIso)
    ])

    if (pageViewsRes.error) {
      console.warn('⚠️ advanced-analytics pageViews query failed:', pageViewsRes.error)
    }
    if (comparePageViewsRes.error) {
      console.warn('⚠️ advanced-analytics comparePageViews query failed:', comparePageViewsRes.error)
    }

    const pageViews = pageViewsRes.error ? 0 : (pageViewsRes.count ?? 0)
    const comparePageViews = comparePageViewsRes.error ? 0 : (comparePageViewsRes.count ?? 0)

    const conversionRate = pageViews > 0 ? (ordersCount / pageViews) * 100 : 0
    const compareConversionRate = comparePageViews > 0 ? (compareOrdersCount / comparePageViews) * 100 : 0
    const conversionRateChangePercent = percentChange(conversionRate, compareConversionRate)

    const visitsSummary: VisitsSummary = {
      pageViews,
      compare: { pageViews: comparePageViews },
      changePercent: { pageViews: percentChange(pageViews, comparePageViews) },
      conversionRate: Number.isFinite(conversionRate) ? conversionRate : 0,
      compareConversionRate: Number.isFinite(compareConversionRate) ? compareConversionRate : 0,
      conversionRateChangePercent: Number.isFinite(conversionRateChangePercent) ? conversionRateChangePercent : 0
    }

    // 2quater) Avis / note moyenne (product_reviews)
    const [reviewsRes, compareReviewsRes] = await Promise.all([
      supabase
        .from('product_reviews')
        .select('rating')
        .eq('status', 'approved')
        .gte('created_at', startIso)
        .lte('created_at', endIso)
        .limit(5000),
      supabase
        .from('product_reviews')
        .select('rating')
        .eq('status', 'approved')
        .gte('created_at', compareStartIso)
        .lte('created_at', compareEndIso)
        .limit(5000)
    ])

    if (reviewsRes.error) {
      console.warn('⚠️ advanced-analytics reviews query failed:', reviewsRes.error)
    }
    if (compareReviewsRes.error) {
      console.warn('⚠️ advanced-analytics compare reviews query failed:', compareReviewsRes.error)
    }

    const ratings = (reviewsRes.error ? [] : (reviewsRes.data ?? []))
      .map((r: any) => Number(r?.rating))
      .filter((n: any) => Number.isFinite(n)) as number[]
    const compareRatings = (compareReviewsRes.error ? [] : (compareReviewsRes.data ?? []))
      .map((r: any) => Number(r?.rating))
      .filter((n: any) => Number.isFinite(n)) as number[]

    const reviewCount = ratings.length
    const compareReviewCount = compareRatings.length
    const averageRating = reviewCount > 0 ? ratings.reduce((acc, v) => acc + v, 0) / reviewCount : 0
    const compareAverageRating = compareReviewCount > 0 ? compareRatings.reduce((acc, v) => acc + v, 0) / compareReviewCount : 0

    const reviewsSummary: ReviewsSummary = {
      averageRating,
      reviewCount,
      compare: {
        averageRating: compareAverageRating,
        reviewCount: compareReviewCount
      },
      changePercent: {
        averageRating: percentChange(averageRating, compareAverageRating),
        reviewCount: percentChange(reviewCount, compareReviewCount)
      }
    }

    // 2quater bis) Web Vitals (automation_events: web.vital)
    const [webVitalsRes, compareWebVitalsRes] = await Promise.all([
      supabase
        .from('automation_events')
        .select('payload, created_at')
        .eq('event_type', 'web.vital')
        .gte('created_at', startIso)
        .lte('created_at', endIso)
        .order('created_at', { ascending: false })
        .limit(5000),
      supabase
        .from('automation_events')
        .select('payload, created_at')
        .eq('event_type', 'web.vital')
        .gte('created_at', compareStartIso)
        .lte('created_at', compareEndIso)
        .order('created_at', { ascending: false })
        .limit(5000)
    ])

    if (webVitalsRes.error) {
      console.warn('⚠️ advanced-analytics web vitals query failed:', webVitalsRes.error)
    }
    if (compareWebVitalsRes.error) {
      console.warn('⚠️ advanced-analytics compare web vitals query failed:', compareWebVitalsRes.error)
    }

    const extractVitals = (rows: any[]) => {
      const lcpMs: number[] = []
      const inpMs: number[] = []
      const cls: number[] = []

      for (const row of rows) {
        const payload = (row as any)?.payload ?? {}
        const name = String((payload as any)?.name ?? '').toUpperCase().trim()
        const value = Number((payload as any)?.value)
        if (!Number.isFinite(value)) continue

        if (name === 'LCP') {
          // web-vitals renvoie LCP en ms.
          // Filtre outliers (tab inactif, throttling extrême, etc.).
          if (value >= 0 && value <= 60_000) lcpMs.push(value)
        } else if (name === 'INP') {
          // web-vitals renvoie INP en ms.
          if (value >= 0 && value <= 10_000) inpMs.push(value)
        } else if (name === 'CLS') {
          // CLS est un score.
          if (value >= 0 && value <= 5) cls.push(value)
        }
      }

      const p75LcpMs = percentile(lcpMs, 75)
      const p75InpMs = percentile(inpMs, 75)
      const p75Cls = percentile(cls, 75)
      const coreWebVitalsStatus = computeCwvStatus({ p75LcpMs, p75InpMs, p75Cls })

      return {
        p75LcpMs: p75LcpMs == null ? null : Math.round(p75LcpMs),
        p75InpMs: p75InpMs == null ? null : Math.round(p75InpMs),
        p75Cls: p75Cls == null ? null : Math.round(p75Cls * 1000) / 1000,
        coreWebVitalsStatus
      }
    }

    const vitalsNow = extractVitals(webVitalsRes.error ? [] : (webVitalsRes.data ?? []))
    const vitalsCompare = extractVitals(compareWebVitalsRes.error ? [] : (compareWebVitalsRes.data ?? []))

    const webVitalsSummary: WebVitalsSummary = {
      pageLoad: {
        p75LcpMs: vitalsNow.p75LcpMs,
        p75InpMs: vitalsNow.p75InpMs,
        p75Cls: vitalsNow.p75Cls,
        coreWebVitalsStatus: vitalsNow.coreWebVitalsStatus
      },
      compare: {
        pageLoad: {
          p75LcpMs: vitalsCompare.p75LcpMs,
          p75InpMs: vitalsCompare.p75InpMs,
          p75Cls: vitalsCompare.p75Cls,
          coreWebVitalsStatus: vitalsCompare.coreWebVitalsStatus
        }
      },
      changePercent: {
        p75LcpMs: percentChange(vitalsNow.p75LcpMs ?? 0, vitalsCompare.p75LcpMs ?? 0)
      }
    }

    // 2quinquies) Uptime / disponibilité (automation_events: uptime.check)
    const [uptimeRes, compareUptimeRes] = await Promise.all([
      supabase
        .from('automation_events')
        .select('payload, created_at')
        .eq('event_type', 'uptime.check')
        .gte('created_at', startIso)
        .lte('created_at', endIso)
        .order('created_at', { ascending: false })
        .limit(5000),
      supabase
        .from('automation_events')
        .select('payload, created_at')
        .eq('event_type', 'uptime.check')
        .gte('created_at', compareStartIso)
        .lte('created_at', compareEndIso)
        .order('created_at', { ascending: false })
        .limit(5000)
    ])

    if (uptimeRes.error) {
      console.warn('⚠️ advanced-analytics uptime query failed:', uptimeRes.error)
    }
    if (compareUptimeRes.error) {
      console.warn('⚠️ advanced-analytics compare uptime query failed:', compareUptimeRes.error)
    }

    const uptimeRows = uptimeRes.error ? [] : (uptimeRes.data ?? [])
    const compareUptimeRows = compareUptimeRes.error ? [] : (compareUptimeRes.data ?? [])

    const computeUptime = (rows: any[]) => {
      const total = rows.length
      let upCount = 0
      const latencies: number[] = []

      for (const row of rows) {
        const payload = (row as any)?.payload ?? {}
        const status = String((payload as any)?.status ?? '').toLowerCase()
        if (status === 'up') {
          upCount += 1
          const latencyMs = Number((payload as any)?.latencyMs)
          if (Number.isFinite(latencyMs) && latencyMs >= 0) {
            latencies.push(latencyMs)
          }
        }
      }

      const availabilityPercent = total > 0 ? (upCount / total) * 100 : 0
      const avgLatencyMs = latencies.length > 0 ? Math.round(latencies.reduce((acc, v) => acc + v, 0) / latencies.length) : null

      return {
        availabilityPercent,
        avgLatencyMs,
        totalChecks: total
      }
    }

    const uptimeNow = computeUptime(uptimeRows)
    const uptimeCompare = computeUptime(compareUptimeRows)

    const uptimeSummary: UptimeSummary = {
      availabilityPercent: uptimeNow.availabilityPercent,
      avgLatencyMs: uptimeNow.avgLatencyMs,
      totalChecks: uptimeNow.totalChecks,
      compare: {
        availabilityPercent: uptimeCompare.availabilityPercent,
        avgLatencyMs: uptimeCompare.avgLatencyMs,
        totalChecks: uptimeCompare.totalChecks
      },
      changePercent: {
        availabilityPercent: percentChange(uptimeNow.availabilityPercent, uptimeCompare.availabilityPercent),
        avgLatencyMs: percentChange(uptimeNow.avgLatencyMs ?? 0, uptimeCompare.avgLatencyMs ?? 0),
        totalChecks: percentChange(uptimeNow.totalChecks, uptimeCompare.totalChecks)
      }
    }

    // 2sexies) Métriques système (automation_events: system.metric)
    // Lues en dernier sur la fenêtre complète : connexions DB actives + espace de stockage.
    const [systemMetricsRes] = await Promise.all([
      supabase
        .from('automation_events')
        .select('payload, created_at')
        .eq('event_type', 'system.metric')
        .order('created_at', { ascending: false })
        .limit(20)
    ])
    const systemMetricRows = systemMetricsRes.error ? [] : (systemMetricsRes.data ?? [])
    const latestMetric = systemMetricRows[0] as any
    const latestPayload = (latestMetric?.payload ?? {}) as any
    const activeConnections =
      typeof latestPayload?.activeConnections === 'number' && Number.isFinite(latestPayload.activeConnections)
        ? latestPayload.activeConnections
        : null
    const storageUsedBytes =
      typeof latestPayload?.storageUsedBytes === 'number' && Number.isFinite(latestPayload.storageUsedBytes)
        ? latestPayload.storageUsedBytes
        : null

    // 3) Récupérer catégories principales des produits.
    const productIds = Array.from(
      new Set(
        items
          .map((r: any) => (typeof r?.product_id === 'string' ? r.product_id : null))
          .filter((v: any) => typeof v === 'string' && v.length > 0)
      )
    )

    const categoryByProductId = new Map<string, { categoryId: string | null; categoryName: string | null }>()

    if (productIds.length > 0) {
      const { data: assignments, error } = await supabase
        .from('product_category_assignments')
        .select('product_id, category_id, is_primary, product_categories(id, name)')
        .in('product_id', productIds as any)

      if (error) throw error

      // priorise is_primary.
      const seen = new Set<string>()
      for (const row of assignments ?? []) {
        const pid = safeString((row as any)?.product_id).trim()
        if (!pid) continue

        const isPrimary = Boolean((row as any)?.is_primary)
        const categoryId = (row as any)?.category_id ? safeString((row as any).category_id) : null
        const categoryName = (row as any)?.product_categories?.name
          ? safeString((row as any).product_categories.name)
          : null

        if (!categoryByProductId.has(pid)) {
          categoryByProductId.set(pid, { categoryId, categoryName })
          if (isPrimary) {
            seen.add(pid)
          }
          continue
        }

        if (!seen.has(pid) && isPrimary) {
          categoryByProductId.set(pid, { categoryId, categoryName })
          seen.add(pid)
        }
      }

      for (const pid of productIds) {
        if (!categoryByProductId.has(pid)) {
          categoryByProductId.set(pid, { categoryId: null, categoryName: null })
        }
      }
    }

    // 4) Agrégation par catégorie + top produits.
    const categoryAgg = new Map<string, { name: string; revenue: number; orders: Set<string> }>()
    const productAgg = new Map<string, { revenue: number; sales: number }>()
    const timeseries = new Map<string, { revenue: number; orders: Set<string> }>()

    for (const row of items) {
      const productId = typeof (row as any)?.product_id === 'string' ? (row as any).product_id : ''
      if (!productId) continue

      const qty = safeNumber((row as any)?.quantity)
      const price = safeNumber((row as any)?.total_price)
      const orderId = (row as any)?.orders?.id ? safeString((row as any).orders.id) : ''
      const createdAt = (row as any)?.orders?.created_at ? safeString((row as any).orders.created_at) : ''

      const cat = categoryByProductId.get(productId) ?? { categoryId: null, categoryName: null }
      const categoryId = cat.categoryId ?? 'uncategorized'
      const categoryName = cat.categoryId ? (cat.categoryName ?? 'Catégorie') : 'Sans catégorie'

      const catBucket = categoryAgg.get(categoryId) ?? { name: categoryName, revenue: 0, orders: new Set<string>() }
      catBucket.name = categoryName
      catBucket.revenue += price
      if (orderId) catBucket.orders.add(orderId)
      categoryAgg.set(categoryId, catBucket)

      const pBucket = productAgg.get(productId) ?? { revenue: 0, sales: 0 }
      pBucket.revenue += price
      pBucket.sales += qty
      productAgg.set(productId, pBucket)

      // Timeseries (jour UTC).
      if (createdAt) {
        const d = new Date(createdAt)
        if (!Number.isNaN(d.getTime())) {
          const dayKey = toIsoDateUtc(d)
          const tBucket = timeseries.get(dayKey) ?? { revenue: 0, orders: new Set<string>() }
          tBucket.revenue += price
          if (orderId) tBucket.orders.add(orderId)
          timeseries.set(dayKey, tBucket)
        }
      }
    }

    const salesByCategoryRaw = Array.from(categoryAgg.entries()).map(([categoryId, v]) => ({
      categoryId,
      name: v.name,
      revenue: v.revenue,
      orders: v.orders.size
    }))

    const totalRevenueForCategories = salesByCategoryRaw.reduce((acc, row) => acc + row.revenue, 0)

    const salesByCategory: AnalyticsCategoryBreakdown[] = salesByCategoryRaw
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 12)
      .map((row) => ({
        ...row,
        sharePercent: totalRevenueForCategories > 0 ? Math.round((row.revenue / totalRevenueForCategories) * 100) : 0
      }))

    // Top produits: on mappe id -> name
    const topProductIds = Array.from(productAgg.entries())
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 10)
      .map(([pid]) => pid)

    // Revenus cumulés par produit sur la période précédente (pour la croissance).
    const prevRevenueByProduct = new Map<string, number>()
    for (const row of compareItems) {
      const pid = String((row as any)?.product_id ?? '').trim()
      if (!pid) continue
      prevRevenueByProduct.set(pid, (prevRevenueByProduct.get(pid) ?? 0) + safeNumber((row as any)?.total_price))
    }

    const productNameById = new Map<string, string>()
    if (topProductIds.length > 0) {
      const { data: productRows, error } = await supabase
        .from('user_products')
        .select('id, name')
        .in('id', topProductIds as any)

      if (error) throw error

      for (const p of productRows ?? []) {
        const id = safeString((p as any)?.id).trim()
        if (!id) continue
        productNameById.set(id, safeString((p as any)?.name ?? 'Produit'))
      }
    }

    const topProducts: AnalyticsTopProduct[] = topProductIds.map((pid) => {
      const agg = productAgg.get(pid) ?? { revenue: 0, sales: 0 }
      const cat = categoryByProductId.get(pid) ?? { categoryId: null, categoryName: null }

      // Croissance du produit : revenus courants vs revenus de la période précédente (même produit).
      const prevRevenue = prevRevenueByProduct.get(pid) ?? 0
      const growthPercent =
        prevRevenue > 0 ? ((agg.revenue - prevRevenue) / prevRevenue) * 100 : agg.revenue > 0 ? 100 : 0

      return {
        productId: pid,
        name: productNameById.get(pid) ?? 'Produit',
        categoryId: cat.categoryId,
        categoryName: cat.categoryName,
        revenue: agg.revenue,
        sales: agg.sales,
        growthPercent
      }
    })

    const timeseriesPoints: AnalyticsTimeseriesPoint[] = Array.from(timeseries.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, v]) => ({ date, revenue: v.revenue, orders: v.orders.size }))

    return NextResponse.json(
      {
        data: {
          period: {
            key,
            startIso,
            endIso,
            compareStartIso,
            compareEndIso
          },
          kpis: {
            growthPercent,
            activeUsers,
            ordersCount,
            revenue
          },
          sales: salesSummary,
          users: usersSummary,
          visits: visitsSummary,
          reviews: reviewsSummary,
          webVitals: webVitalsSummary,
          uptime: uptimeSummary,
          system: {
            activeConnections,
            storageUsedBytes
          },
          salesByCategory,
          topProducts,
          timeseries: timeseriesPoints
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ GET /api/super-admin/advanced-analytics failed:', error)
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const status = message.toLowerCase().includes('accès') ? 403 : message.toLowerCase().includes('token') ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
