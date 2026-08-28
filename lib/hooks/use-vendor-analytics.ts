'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { ClientAuthService } from '@/lib/services/client-auth-service'
import type { SellerRevenue } from '@/lib/services/seller-dashboard-service'
import {
  mergeAnalyticsWithDashboardRevenue,
  type VendorAnalyticsData,
  type VendorAnalyticsPeriod
} from '@/lib/vendor-analytics'

const ALL_PERIODS: VendorAnalyticsPeriod[] = ['7d', '30d', '90d', '1y', '2y', '3y']

export function useVendorAnalytics(
  initialPeriod: VendorAnalyticsPeriod = '30d',
  dashboardRevenue?: SellerRevenue | null
) {
  const [period, setPeriod] = useState<VendorAnalyticsPeriod>(initialPeriod)
  const [data, setData] = useState<VendorAnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const periodCacheRef = useRef<Partial<Record<VendorAnalyticsPeriod, VendorAnalyticsData>>>({})
  const trustedPeriodRef = useRef<VendorAnalyticsPeriod | null>(null)
  const periodRef = useRef(period)
  periodRef.current = period

  const applyDashboardMerge = useCallback(
    (analytics: VendorAnalyticsData | null, resolvedPeriod: VendorAnalyticsPeriod) => {
      if (!analytics) return null
      return mergeAnalyticsWithDashboardRevenue(analytics, dashboardRevenue ?? null, resolvedPeriod)
    },
    [dashboardRevenue]
  )

  const fetchPeriod = useCallback(
    async (
      targetPeriod: VendorAnalyticsPeriod,
      options?: { updateVisible?: boolean; silent?: boolean }
    ): Promise<VendorAnalyticsData | null> => {
      const updateVisible = options?.updateVisible !== false
      const silent = options?.silent === true

      if (!silent && updateVisible) {
        if (!periodCacheRef.current[targetPeriod] && !periodCacheRef.current[periodRef.current]) {
          setIsLoading(true)
        } else {
          setIsRefreshing(true)
        }
      }

      try {
        const headers = await ClientAuthService.buildAuthHeaders()
        const response = await fetch(
          `/api/vendor/analytics?period=${encodeURIComponent(targetPeriod)}`,
          {
            method: 'GET',
            headers,
            credentials: 'include',
            cache: 'no-store'
          }
        )

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}))
          throw new Error(payload?.error || 'Impossible de charger les analyses.')
        }

        const payload = await response.json()
        const raw = (payload?.data ?? null) as VendorAnalyticsData | null
        if (!raw) return null

        const merged = applyDashboardMerge({ ...raw, period: targetPeriod }, targetPeriod)
        if (merged) {
          periodCacheRef.current[targetPeriod] = merged
        }

        if (updateVisible && periodRef.current === targetPeriod) {
          trustedPeriodRef.current = targetPeriod
          setData(merged)
          setError(null)
        }

        return merged
      } catch (err) {
        if (updateVisible && periodRef.current === targetPeriod) {
          const message = err instanceof Error ? err.message : 'Erreur inconnue.'
          setError(message)
        }
        return null
      } finally {
        if (silent || !updateVisible) return
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [applyDashboardMerge]
  )

  const prefetchOtherPeriods = useCallback(
    (current: VendorAnalyticsPeriod) => {
      void Promise.all(
        ALL_PERIODS.filter((p) => p !== current && !periodCacheRef.current[p]).map((p) =>
          fetchPeriod(p, { updateVisible: false, silent: true })
        )
      )
    },
    [fetchPeriod]
  )

  useEffect(() => {
    void (async () => {
      const merged = await fetchPeriod(initialPeriod, { updateVisible: true })
      if (merged) {
        prefetchOtherPeriods(initialPeriod)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement initial uniquement
  }, [])

  useEffect(() => {
    if (!dashboardRevenue) return
    setData((prev) => {
      if (!prev) return prev
      return applyDashboardMerge(prev, periodRef.current)
    })
    ALL_PERIODS.forEach((p) => {
      const cached = periodCacheRef.current[p]
      if (cached) {
        periodCacheRef.current[p] = applyDashboardMerge(cached, p) ?? cached
      }
    })
  }, [
    applyDashboardMerge,
    dashboardRevenue?.totalRevenue,
    dashboardRevenue?.totalRevenue30Days,
    dashboardRevenue?.salesEvolution
  ])

  const changePeriod = useCallback(
    (nextPeriod: VendorAnalyticsPeriod) => {
      setPeriod(nextPeriod)
      setError(null)

      const cached = periodCacheRef.current[nextPeriod]
      if (cached) {
        trustedPeriodRef.current = nextPeriod
        setData(applyDashboardMerge(cached, nextPeriod))
        void fetchPeriod(nextPeriod, { updateVisible: true, silent: true })
        return
      }

      // Aucune donnée de confiance pour cette période : on efface l'affichage
      // (squelette de chargement) plutôt que de ré-étiqueter les chiffres de
      // l'ancienne période comme appartenant à la nouvelle.
      trustedPeriodRef.current = null
      setData(null)
      setIsLoading(true)
      void fetchPeriod(nextPeriod, { updateVisible: true, silent: false })
    },
    [applyDashboardMerge, fetchPeriod]
  )

  const refresh = useCallback(async () => {
    delete periodCacheRef.current[periodRef.current]
    trustedPeriodRef.current = null
    await fetchPeriod(periodRef.current, { updateVisible: true, silent: false })
    prefetchOtherPeriods(periodRef.current)
  }, [fetchPeriod, prefetchOtherPeriods])

  const trustApiForPeriod = trustedPeriodRef.current === period

  return {
    data,
    period,
    isLoading,
    isRefreshing,
    error,
    trustApiForPeriod,
    changePeriod,
    refresh,
    setPeriod
  }
}
