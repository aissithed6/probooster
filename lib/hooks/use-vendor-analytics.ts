'use client'

import { useCallback, useEffect, useState } from 'react'

import { ClientAuthService } from '@/lib/services/client-auth-service'
import type { VendorAnalyticsData, VendorAnalyticsPeriod } from '@/lib/vendor-analytics'

type DashboardRevenueFallback = {
  totalRevenue30Days?: number
  totalRevenue?: number
  salesEvolution?: Array<{ date?: string; revenue?: number; ordersCount?: number; orders?: number }>
}

function periodToDays(period: VendorAnalyticsPeriod): number {
  if (period === '7d') return 7
  if (period === '90d') return 90
  if (period === '1y') return 365
  return 30
}

function sumRecentFromEvolution(
  rows: Array<{ date?: string; revenue?: number; ordersCount?: number; orders?: number }>,
  days: number
) {
  const now = new Date()
  const start = new Date(now)
  start.setDate(start.getDate() - (days - 1))
  start.setHours(0, 0, 0, 0)

  let revenue = 0
  let sales = 0
  for (const row of rows) {
    const rawDate = String(row?.date ?? '')
    if (!rawDate) continue
    const dt = new Date(rawDate)
    if (Number.isNaN(dt.getTime())) continue
    if (dt < start) continue
    revenue += Number(row?.revenue ?? 0) || 0
    sales += Number(row?.ordersCount ?? row?.orders ?? 0) || 0
  }
  return { revenue, sales }
}

export function useVendorAnalytics(initialPeriod: VendorAnalyticsPeriod = '30d') {
  const [period, setPeriod] = useState<VendorAnalyticsPeriod>(initialPeriod)
  const [data, setData] = useState<VendorAnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (nextPeriod?: VendorAnalyticsPeriod) => {
    const resolvedPeriod = nextPeriod ?? period
    setIsLoading(true)
    setError(null)

    try {
      const headers = await ClientAuthService.buildAuthHeaders()
      const response = await fetch(`/api/vendor/analytics?period=${encodeURIComponent(resolvedPeriod)}`, {
        method: 'GET',
        headers,
        credentials: 'include',
        cache: 'no-store'
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.error || 'Impossible de charger les analyses.')
      }

      const payload = await response.json()
      let nextData = (payload?.data ?? null) as VendorAnalyticsData | null

      /**
       * Fallback anti-régression:
       * si analytics renvoie 0 alors que la section "Chiffre d'affaires" fonctionne,
       * on réutilise les agrégats de /api/vendor/dashboard pour alimenter les cartes.
       */
      if (nextData && (Number(nextData?.summary?.totalRevenue ?? 0) <= 0 || Number(nextData?.summary?.totalSales ?? 0) <= 0)) {
        try {
          const dashResp = await fetch('/api/vendor/dashboard', {
            method: 'GET',
            headers,
            credentials: 'include',
            cache: 'no-store'
          })
          if (dashResp.ok) {
            const dashPayload = await dashResp.json().catch(() => ({}))
            const dashboardRevenue = (dashPayload?.data?.revenue ?? {}) as DashboardRevenueFallback
            const evolution = Array.isArray(dashboardRevenue?.salesEvolution) ? dashboardRevenue.salesEvolution : []
            const days = periodToDays(resolvedPeriod)
            const evo = sumRecentFromEvolution(evolution, days)
            const revenueFromDashboard =
              days === 30
                ? Number(dashboardRevenue?.totalRevenue30Days ?? dashboardRevenue?.totalRevenue ?? 0) || evo.revenue
                : evo.revenue

            if (revenueFromDashboard > 0 || evo.sales > 0) {
              nextData = {
                ...nextData,
                summary: {
                  ...nextData.summary,
                  totalRevenue: revenueFromDashboard > 0 ? Math.round(revenueFromDashboard) : nextData.summary.totalRevenue,
                  totalSales: evo.sales > 0 ? Math.round(evo.sales) : nextData.summary.totalSales
                },
                overview: {
                  ...nextData.overview,
                  activeCustomers: nextData.overview.activeCustomers,
                  conversionRate: nextData.overview.conversionRate
                }
              }
            }
          }
        } catch {
          // noop: on garde les données analytics initiales
        }
      }

      setData(nextData)
      if (nextPeriod) {
        setPeriod(nextPeriod)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [period])

  useEffect(() => {
    void load()
  }, [])

  const changePeriod = useCallback(
    async (nextPeriod: VendorAnalyticsPeriod) => {
      await load(nextPeriod)
    },
    [load]
  )

  const refresh = useCallback(async () => {
    await load(period)
  }, [load, period])

  return {
    data,
    period,
    isLoading,
    error,
    changePeriod,
    refresh,
    setPeriod
  }
}
