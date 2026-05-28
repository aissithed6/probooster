"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'

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
 */
export function useClientDeliveries(options: UseClientDeliveriesOptions = {}) {
  const { enabled = true } = options

  const fetcher = useCallback(async () => {
    if (!enabled) {
      return null
    }
    return ClientDeliveryService.list()
  }, [enabled])

  return useAsyncResource<ClientDeliveryResponse>(fetcher, enabled)
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
