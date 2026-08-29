"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'

import { supabase } from '@/lib/supabase'
import type { ClientDeliveryResponse } from '@/lib/services/client-delivery-service'
import { ClientDeliveryService } from '@/lib/services/client-delivery-service'

export interface UseClientDeliveriesOptions {
  enabled?: boolean
}

interface AsyncResourceState<T> {
  data: T | null
  isLoading: boolean
  error: Error | null
  mutate: () => Promise<void>
}

/**
 * Hook utilitaire léger pour reproduire les fonctionnalités essentielles de SWR
 * sans dépendance externe. Gère l'état de chargement, l'erreur et expose mutate.
 */
function useAsyncResource<T>(fetcher: () => Promise<T | null>, shouldFetch: boolean): AsyncResourceState<T> {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(shouldFetch)
  const [error, setError] = useState<Error | null>(null)

  const execute = useCallback(async () => {
    if (!shouldFetch) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const result = await fetcher()
      setData(result ?? null)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur inconnue'))
    } finally {
      setIsLoading(false)
    }
  }, [shouldFetch, fetcher])

  useEffect(() => {
    void execute()
  }, [execute])

  const mutate = useCallback(async () => {
    await execute()
  }, [execute])

  return useMemo(() => ({ data, isLoading, error, mutate }), [data, isLoading, error, mutate])
}

/**
 * Hook SWR principal pour récupérer les livraisons d'un client via l'API.
 *
 * En plus du fetch initial (rapide), s'abonne en temps réel (Realtime) aux
 * changements de la table `deliveries` pour CE client (`customer_id`) ainsi
 * qu'aux `delivery_events` liés, afin que l'UI reflète immédiatement les
 * mises à jour du livreur sans rafraîchissement manuel. Toute modification
 * déclenche un `mutate()` (debounce 250ms) qui relit la liste depuis l'API.
 */
export function useClientDeliveries(options: UseClientDeliveriesOptions = {}) {
  const { enabled = true } = options

  const fetcher = useCallback(async () => {
    if (!enabled) {
      return null
    }
    return ClientDeliveryService.list()
  }, [enabled])

  const { data, isLoading, error, mutate } = useAsyncResource<ClientDeliveryResponse>(fetcher, enabled)

  // Temps réel des livraisons du client connecté.
  useEffect(() => {
    if (!enabled) return

    let channel: ReturnType<typeof supabase.channel> | null = null
    let cancelled = false
    let timer: number | null = null
    let mounted = true

    const scheduleRefresh = () => {
      if (timer !== null) window.clearTimeout(timer)
      if (cancelled || !mounted) return
      timer = window.setTimeout(() => {
        timer = null
        void mutate()
      }, 250)
    }

    void (async () => {
      let userId: string | null = null
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        userId = sessionData?.session?.user?.id ?? null
      } catch {
        userId = null
      }

      if (cancelled || !mounted) return
      if (!userId) return

            channel = supabase
        .channel(`client-deliveries:${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'deliveries',
            filter: `customer_id=eq.${userId}`
          },
          scheduleRefresh
        )
        // Les évènements de chronologie (driver_accept, delivered, client_received, …)
        // sont insérés dans delivery_events sans toucher à deliveries.updated_at.
        // On écoute donc aussi cette table pour rafraîchir la liste en temps réel.
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'delivery_events'
          },
          scheduleRefresh
        )
        .subscribe()
    })()

    return () => {
      cancelled = true
      mounted = false
      if (timer !== null) window.clearTimeout(timer)
      if (channel) void supabase.removeChannel(channel)
    }
  }, [enabled, mutate])

  return { data, isLoading, error, mutate }
}

/**
 * Hook SWR pour récupérer une livraison spécifique.
 */
export function useClientDelivery(deliveryId?: string, options: UseClientDeliveriesOptions = {}) {
  const { enabled = true } = options

  const shouldFetch = enabled && Boolean(deliveryId)

  const fetcher = useCallback(async () => {
    if (!shouldFetch || !deliveryId) {
      return null
    }
    return ClientDeliveryService.getById(deliveryId)
  }, [shouldFetch, deliveryId])

  return useAsyncResource<ClientDeliveryResponse>(fetcher, shouldFetch)
}

/**
 * Hook SWR pour récupérer et mettre à jour les préférences de livraison du client.
 */
export function useClientDeliveryPreferences(options: UseClientDeliveriesOptions = {}) {
  const { enabled = true } = options

  const fetcher = useCallback(async () => {
    if (!enabled) {
      return null
    }
    return ClientDeliveryService.getPreferences()
  }, [enabled])

  return useAsyncResource(fetcher, enabled)
}
