"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../supabase'
import { ClientPointsService, type ClientPointsConfiguration, type ClientPointsSummary } from '../services/client-points-service'

type AdminPointsConfig = {
  purchaseValue: number
  socialShareValue: number
  socialSharePerNetwork: Record<string, number>
  basePointsPerFCFA: number
}

export type ClientPointsState = {
  userId: string | null
  configuration: ClientPointsConfiguration | null
  summary: ClientPointsSummary | null
  adminPointsConfig: AdminPointsConfig | null
  isLoading: boolean
  error: string | null
}

const POINTS_SUMMARY_CACHE_KEY = 'probooster_client_points_summary'

let inflightUserId: Promise<string | null> | null = null

/**
 * Résout le userId connecté en sérialisant l'accès à Supabase Auth pour éviter les locks/AbortError.
 */
async function resolveUserIdFromSession(): Promise<string | null> {
  if (inflightUserId) return inflightUserId

  inflightUserId = (async () => {
    try {
      const { data } = await supabase.auth.getSession()
      return data?.session?.user?.id ?? null
    } catch {
      return null
    } finally {
      inflightUserId = null
    }
  })()

  return inflightUserId
}

/**
 * Hook centralisé pour synchroniser les points client (solde + configuration) partout dans le front.
 * Objectif: éviter les valeurs divergentes (localStorage / conversionRate hardcodé / fetchs dupliqués).
 */
export function useClientPoints() {
  const [state, setState] = useState<ClientPointsState>(() => {
    let cachedAdmin: AdminPointsConfig | null = null
    let cachedSummary: ClientPointsSummary | null = null
    try {
      if (typeof window !== 'undefined') {
        const raw = window.localStorage.getItem('probooster_admin_points_config')
        if (raw) {
          const parsed = JSON.parse(raw)
          if (parsed && typeof parsed === 'object') {
            const purchaseValueRaw = Number((parsed as any)?.purchaseValue)
            const purchaseValue = Number.isFinite(purchaseValueRaw) && purchaseValueRaw > 0 ? purchaseValueRaw : 1

            const socialShareValueRaw = Number((parsed as any)?.socialShareValue)
            const socialShareValue = Number.isFinite(socialShareValueRaw) && socialShareValueRaw >= 0 ? socialShareValueRaw : 0

            const perNetworkRaw = ((parsed as any)?.socialSharePerNetwork ?? {}) as Record<string, any>
            const socialSharePerNetwork: Record<string, number> = {}
            Object.entries(perNetworkRaw).forEach(([key, value]) => {
              const normalizedKey = String(key).toLowerCase().trim()
              const numeric = Number(value)
              if (!normalizedKey) return
              if (!Number.isFinite(numeric) || numeric < 0) return
              socialSharePerNetwork[normalizedKey] = numeric
            })

            const basePointsRaw = Number((parsed as any)?.basePointsPerFCFA)
            const basePointsPerFCFA = Number.isFinite(basePointsRaw) && basePointsRaw > 0 ? basePointsRaw : 1

            cachedAdmin = { purchaseValue, socialShareValue, socialSharePerNetwork, basePointsPerFCFA }
          }
        }

        const summaryRaw = window.localStorage.getItem(POINTS_SUMMARY_CACHE_KEY)
        if (summaryRaw) {
          const parsedSummary = JSON.parse(summaryRaw)
          if (parsedSummary && typeof parsedSummary === 'object') {
            const balanceRaw = Number((parsedSummary as any)?.balance)
            const balance = Number.isFinite(balanceRaw) && balanceRaw >= 0 ? balanceRaw : 0
            cachedSummary = {
              balance,
              isFrozen: Boolean((parsedSummary as any)?.isFrozen ?? false),
              freezeReason: (parsedSummary as any)?.freezeReason ?? null
            } as any
          }
        }
      }
    } catch {
      cachedAdmin = null
      cachedSummary = null
    }

    return {
      userId: null,
      configuration: null,
      summary: cachedSummary,
      adminPointsConfig: cachedAdmin,
      isLoading: true,
      error: null
    }
  })

  const refreshInFlightRef = useRef<Promise<void> | null>(null)

  const refreshAdminInFlightRef = useRef<Promise<void> | null>(null)

  /**
   * Recharge la configuration globale Super Admin via l'endpoint public (supporte l'absence de session).
   */
  const refreshAdminPointsConfig = useCallback(async () => {
    if (refreshAdminInFlightRef.current) {
      return await refreshAdminInFlightRef.current
    }

    refreshAdminInFlightRef.current = (async () => {
      try {
        const response = await fetch('/api/public/points-config', { method: 'GET', cache: 'no-store' })
        if (!response.ok) {
          return
        }

        const payload = (await response.json().catch(() => null)) as { data?: AdminPointsConfig | null }
        const cfg = payload?.data ?? null

        if (!cfg) {
          setState((prev) => ({ ...prev, adminPointsConfig: null }))
          return
        }

        const purchaseValueRaw = Number((cfg as any)?.purchaseValue)
        const purchaseValue = Number.isFinite(purchaseValueRaw) && purchaseValueRaw > 0 ? purchaseValueRaw : 1

        const socialShareValueRaw = Number((cfg as any)?.socialShareValue)
        const socialShareValue = Number.isFinite(socialShareValueRaw) && socialShareValueRaw >= 0 ? socialShareValueRaw : 0

        const perNetworkRaw = ((cfg as any)?.socialSharePerNetwork ?? {}) as Record<string, any>
        const socialSharePerNetwork: Record<string, number> = {}
        Object.entries(perNetworkRaw).forEach(([key, value]) => {
          const normalizedKey = String(key).toLowerCase().trim()
          const numeric = Number(value)
          if (!normalizedKey) return
          if (!Number.isFinite(numeric) || numeric < 0) return
          socialSharePerNetwork[normalizedKey] = numeric
        })

        const nextAdmin = {
          purchaseValue,
          socialShareValue,
          socialSharePerNetwork,
          basePointsPerFCFA: (() => {
            const basePointsRaw = Number((cfg as any)?.basePointsPerFCFA)
            return Number.isFinite(basePointsRaw) && basePointsRaw > 0 ? basePointsRaw : 1
          })()
        }

        setState((prev) => ({
          ...prev,
          adminPointsConfig: nextAdmin
        }))

        try {
          if (typeof window !== 'undefined') {
            window.localStorage.setItem('probooster_admin_points_config', JSON.stringify(nextAdmin))
          }
        } catch {
          // ignore cache write errors
        }
      } catch {
        // noop
      }
    })().finally(() => {
      refreshAdminInFlightRef.current = null
    })

    return await refreshAdminInFlightRef.current
  }, [])

  /**
   * Recharge la configuration + le résumé points depuis la source de vérité (Supabase / services).
   */
  const refresh = useCallback(async () => {
    return await refreshInternal({ silent: false })
  }, [])

  /**
   * Recharge en mode silencieux (sans toggler isLoading) pour les événements Realtime.
   */
  const refreshSilent = useCallback(async () => {
    return await refreshInternal({ silent: true })
  }, [])

  /**
   * Implémentation interne du refresh.
   */
  const refreshInternal = useCallback(async ({ silent }: { silent: boolean }) => {
    if (refreshInFlightRef.current) {
      return await refreshInFlightRef.current
    }

    refreshInFlightRef.current = (async () => {
    try {
      if (!silent) {
        setState((prev) => ({ ...prev, isLoading: true, error: null }))
      } else {
        setState((prev) => ({ ...prev, error: null }))
      }

      // Toujours rafraîchir la config Super Admin (même sans session).
      await refreshAdminPointsConfig()

      const userId = await resolveUserIdFromSession()
      if (!userId) {
        setState((prev) => ({
          ...prev,
          userId: null,
          configuration: null,
          summary: null,
          isLoading: false,
          error: null
        }))

        try {
          if (typeof window !== 'undefined') {
            window.localStorage.removeItem(POINTS_SUMMARY_CACHE_KEY)
          }
        } catch {
          // ignore
        }
        return
      }

      const [configuration, summary] = await Promise.all([
        ClientPointsService.getPointsConfiguration(userId),
        ClientPointsService.getPointsSummary(userId).catch(() => null)
      ])

      setState((prev) => ({
        ...prev,
        userId,
        configuration,
        summary,
        isLoading: false,
        error: null
      }))

      try {
        if (typeof window !== 'undefined') {
          const payload = {
            balance: (summary as any)?.balance ?? 0,
            isFrozen: Boolean((summary as any)?.isFrozen ?? false),
            freezeReason: (summary as any)?.freezeReason ?? null
          }
          window.localStorage.setItem(POINTS_SUMMARY_CACHE_KEY, JSON.stringify(payload))
        }
      } catch {
        // ignore
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Impossible de charger les informations de points'
      }))
    }
    })().finally(() => {
      refreshInFlightRef.current = null
    })

    return await refreshInFlightRef.current
  }, [refreshAdminPointsConfig])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    const scheduleRefresh = () => {
      void refreshSilent()
    }

    const channel = supabase
      .channel('client-points-config')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'point_settings' },
        scheduleRefresh
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'point_operation_limits' },
        scheduleRefresh
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'point_operation_fees' },
        scheduleRefresh
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [refreshSilent])

  /**
   * Synchronise automatiquement le solde/état des points utilisateur via Realtime.
   * Objectif: refléter les gains (ex: partage, achat) sans rafraîchir la page.
   */
  useEffect(() => {
    const userId = state.userId
    if (!userId) return

    const scheduleRefresh = () => {
      void refreshSilent()
    }

    const channel = supabase
      .channel(`client-points-balance:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'loyalty_points', filter: `user_id=eq.${userId}` },
        scheduleRefresh
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [refreshSilent, state.userId])

  const conversionRate = useMemo(() => {
    const raw = state.configuration?.settings?.conversionRate
    const numeric = Number(raw)
    return Number.isFinite(numeric) && numeric > 0 ? numeric : 1
  }, [state.configuration?.settings?.conversionRate])

  const purchaseValue = useMemo(() => {
    // Source de vérité: Super Admin (adminPointsConfig) doit l'emporter.
    const raw = state.adminPointsConfig?.purchaseValue ?? (state.configuration?.settings as any)?.purchaseValue
    const normalized = typeof raw === 'string' ? raw.trim().replace(',', '.') : raw
    const numeric = Number(normalized)
    return Number.isFinite(numeric) && numeric > 0 ? numeric : 1
  }, [state.configuration?.settings, state.adminPointsConfig?.purchaseValue])

  const socialShareValue = useMemo(() => {
    // Source de vérité: Super Admin (adminPointsConfig) doit l'emporter.
    const raw = state.adminPointsConfig?.socialShareValue ?? (state.configuration?.settings as any)?.socialShareValue
    const normalized = typeof raw === 'string' ? raw.trim().replace(',', '.') : raw
    const numeric = Number(normalized)
    return Number.isFinite(numeric) && numeric >= 0 ? numeric : 0
  }, [state.configuration?.settings, state.adminPointsConfig?.socialShareValue])

  const socialSharePerNetwork = useMemo(() => {
    const raw = (state.adminPointsConfig?.socialSharePerNetwork ?? {}) as Record<string, number>
    return raw
  }, [state.adminPointsConfig?.socialSharePerNetwork])

  const withdrawalValue = useMemo(() => {
    const raw = (state.configuration?.settings as any)?.withdrawalValue
    const numeric = Number(raw)
    return Number.isFinite(numeric) && numeric > 0 ? numeric : conversionRate
  }, [state.configuration?.settings, conversionRate])

  const basePointsPerFCFA = useMemo(() => {
    const raw = state.adminPointsConfig?.basePointsPerFCFA ?? (state.configuration?.settings as any)?.basePointsPerFCFA
    const numeric = Number(raw)
    return Number.isFinite(numeric) && numeric > 0 ? numeric : 1
  }, [state.adminPointsConfig?.basePointsPerFCFA, state.configuration?.settings])

  const basePointValue = useMemo(() => {
    // basePointsPerFCFA = points / 1 FCFA => valeur d'1 point en FCFA = 1 / basePointsPerFCFA
    return 1 / basePointsPerFCFA
  }, [basePointsPerFCFA])

  const balance = useMemo(() => state.summary?.balance ?? 0, [state.summary?.balance])

  const estimatedValue = useMemo(() => {
    // Source de vérité affichage portefeuille: valeur de base (points => FCFA).
    // Les retraits utilisent withdrawalValue, mais l'affichage général doit utiliser le taux base.
    return Number((balance * basePointValue).toFixed(2))
  }, [balance, basePointValue])

  const isFrozen = useMemo(() => Boolean(state.summary?.isFrozen ?? false), [state.summary?.isFrozen])
  const freezeReason = useMemo(() => state.summary?.freezeReason ?? null, [state.summary?.freezeReason])
  const defaultCurrency = useMemo(() => state.configuration?.settings?.defaultCurrency ?? 'XOF', [state.configuration?.settings?.defaultCurrency])

  return {
    ...state,
    refresh,
    conversionRate,
    purchaseValue,
    socialShareValue,
    socialSharePerNetwork,
    withdrawalValue,
    basePointsPerFCFA,
    basePointValue,
    defaultCurrency,
    balance,
    estimatedValue,
    isFrozen,
    freezeReason
  }
}
