"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'

import type { VendorDeliveryResponse } from '@/lib/services/vendor-delivery-service'
import { VendorDeliveryService } from '@/lib/services/vendor-delivery-service'

interface AsyncResourceState<T> {
  data: T | null
  isLoading: boolean
  error: Error | null
  mutate: () => Promise<void>
}

export interface UseVendorDeliveriesOptions {
  enabled?: boolean
}

/**
 * Gestionnaire générique d'une ressource asynchrone (chargement, erreur, données et mutation).
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
 * Hook principal pour récupérer les livraisons d'un vendeur via l'API dédiée.
 */
export function useVendorDeliveries(options: UseVendorDeliveriesOptions = {}) {
  const { enabled = true } = options

  const fetcher = useCallback(async () => {
    if (!enabled) {
      return null
    }
    return VendorDeliveryService.list()
  }, [enabled])

  return useAsyncResource<VendorDeliveryResponse>(fetcher, enabled)
}
