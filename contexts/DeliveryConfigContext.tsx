"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

import type { FreeShippingConfig } from '@/lib/utils/free-shipping-eligibility'

type DeliveryConfigPayload = {
  freeShippingConfig: FreeShippingConfig | null
  deliveryRules: any[]
  pickupConfig: any | null
}

type DeliveryConfigContextValue = {
  freeShippingConfig: FreeShippingConfig | null
  deliveryRules: any[]
  pickupConfig: any | null
  isLoading: boolean
  refresh: () => Promise<void>
}

const DeliveryConfigContext = createContext<DeliveryConfigContextValue | null>(null)

const SESSION_STORAGE_KEY = 'probooster_delivery_config_v2'

/**
 * Lit une config persistée en sessionStorage.
 */
function readCachedDeliveryConfig(): DeliveryConfigPayload | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as any
    const freeShippingConfig = (parsed as any)?.freeShippingConfig ?? null
    const deliveryRules = Array.isArray((parsed as any)?.deliveryRules) ? (parsed as any).deliveryRules : []
    const pickupConfig = (parsed as any)?.pickupConfig ?? null
    return { freeShippingConfig, deliveryRules, pickupConfig }
  } catch {
    return null
  }
}

/**
 * Persist la config en sessionStorage pour un rendu instantané après refresh.
 */
function writeCachedDeliveryConfig(payload: DeliveryConfigPayload) {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // ignore
  }
}

/**
 * DeliveryConfigProvider
 * Charge la configuration de livraison publique (`/api/public/delivery-config`) une seule fois côté client,
 * et la rend disponible partout (cartes produit, page produit, modals, etc.).
 */
export function DeliveryConfigProvider({ children }: { children: ReactNode }) {
  const cached = useMemo(() => readCachedDeliveryConfig(), [])

  const [freeShippingConfig, setFreeShippingConfig] = useState<FreeShippingConfig | null>(cached?.freeShippingConfig ?? null)
  const [deliveryRules, setDeliveryRules] = useState<any[]>(Array.isArray(cached?.deliveryRules) ? cached?.deliveryRules ?? [] : [])
  const [pickupConfig, setPickupConfig] = useState<any | null>(cached?.pickupConfig ?? null)
  const [isLoading, setIsLoading] = useState<boolean>(cached ? false : true)

  const refresh = async () => {
    try {
      setIsLoading(true)
      const resp = await fetch('/api/public/delivery-config', { method: 'GET', cache: 'no-store' }).catch(() => null)
      if (!resp?.ok) return
      const json = await resp.json().catch(() => null)
      const cfg = (json as any)?.data?.freeShippingConfig ?? null
      const rules = Array.isArray((json as any)?.data?.deliveryRules) ? (json as any).data.deliveryRules : []
      const pickup = (json as any)?.data?.pickupConfig ?? null
      setFreeShippingConfig(cfg)
      setDeliveryRules(rules)
      setPickupConfig(pickup)
      writeCachedDeliveryConfig({ freeShippingConfig: cfg, deliveryRules: rules, pickupConfig: pickup })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const resp = await fetch('/api/public/delivery-config', { method: 'GET', cache: 'no-store' }).catch(() => null)
        if (!resp?.ok) return
        const json = await resp.json().catch(() => null)
        const cfg = (json as any)?.data?.freeShippingConfig ?? null
        const rules = Array.isArray((json as any)?.data?.deliveryRules) ? (json as any).data.deliveryRules : []
        const pickup = (json as any)?.data?.pickupConfig ?? null
        if (cancelled) return
        setFreeShippingConfig(cfg)
        setDeliveryRules(rules)
        setPickupConfig(pickup)
        writeCachedDeliveryConfig({ freeShippingConfig: cfg, deliveryRules: rules, pickupConfig: pickup })
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo<DeliveryConfigContextValue>(
    () => ({
      freeShippingConfig,
      deliveryRules,
      pickupConfig,
      isLoading,
      refresh
    }),
    [deliveryRules, freeShippingConfig, isLoading, pickupConfig]
  )

  return <DeliveryConfigContext.Provider value={value}>{children}</DeliveryConfigContext.Provider>
}

/**
 * Hook d'accès à la configuration de livraison publique.
 */
export function useDeliveryConfig(): DeliveryConfigContextValue {
  const ctx = useContext(DeliveryConfigContext)
  if (!ctx) {
    return {
      freeShippingConfig: null,
      deliveryRules: [],
      pickupConfig: null,
      isLoading: true,
      refresh: async () => {
        // noop
      }
    }
  }
  return ctx
}
