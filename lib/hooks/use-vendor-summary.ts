'use client'

import { useEffect, useState } from 'react'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type CacheEntry = {
  value: VendorSummary
  expiresAt: number
}

const CACHE_TTL_MS = 60_000
const summaryCache = new Map<string, CacheEntry>()
const inflight = new Map<string, Promise<VendorSummary | null>>()

/**
 * Lit le résumé vendeur depuis l'API publique, avec parsing robuste.
 */
async function fetchVendorSummary(vendorId: string): Promise<VendorSummary | null> {
  const res = await fetch(`/api/public/vendors/summary?vendorId=${encodeURIComponent(vendorId)}`, {
    method: 'GET',
    cache: 'no-store'
  }).catch(() => null)
  const json = await res?.json().catch(() => null)
  if (!res || !res.ok) return null

  const data = json?.data
  const avg = Number(data?.averageRating ?? 0)
  const count = Number(data?.reviewCount ?? 0)
  const respSec = data?.avgResponseSeconds
  const normalizedRespSec = typeof respSec === 'number' && Number.isFinite(respSec) ? respSec : null

  return {
    averageRating: Number.isFinite(avg) ? avg : 0,
    reviewCount: Number.isFinite(count) ? count : 0,
    avgResponseSeconds: normalizedRespSec
  }
}

export type VendorSummary = {
  averageRating: number
  reviewCount: number
  avgResponseSeconds: number | null
}

/**
 * Charge le résumé public d'un vendeur (note, avis, temps de réponse moyen) via l'API publique.
 * Retourne `null` si vendorId absent/invalide ou si l'API échoue.
 */
export function useVendorSummary(vendorId: string) {
  const [summary, setSummary] = useState<VendorSummary | null>(null)

  useEffect(() => {
    let cancelled = false
    const normalized = String(vendorId ?? '').trim()

    if (!normalized || !UUID_REGEX.test(normalized)) {
      setSummary(null)
      return
    }

    ;(async () => {
      try {
        const cached = summaryCache.get(normalized)
        if (cached && cached.expiresAt > Date.now()) {
          if (!cancelled) setSummary(cached.value)
          return
        }

        let promise = inflight.get(normalized)
        if (!promise) {
          promise = fetchVendorSummary(normalized)
          inflight.set(normalized, promise)
        }

        const value = await promise
        if (value) {
          summaryCache.set(normalized, { value, expiresAt: Date.now() + CACHE_TTL_MS })
        } else {
          summaryCache.delete(normalized)
        }

        if (!cancelled) {
          setSummary(value)
        }
      } catch {
        // ignore
      } finally {
        inflight.delete(normalized)
      }
    })()

    // Revalidation au retour sur l'onglet / visibilité : permet aux notes des
    // cartes vendeurs et pages publiques de refléter une nouvelle approbation
    // d'avis sans attendre l'expiration du cache (fraîcheur « synchronization »).
    const forceRefetch = () => {
      summaryCache.delete(normalized)
      const promise = fetchVendorSummary(normalized)
      inflight.set(normalized, promise)
      promise
        .then((value) => {
          if (cancelled) return
          if (value) summaryCache.set(normalized, { value, expiresAt: Date.now() + CACHE_TTL_MS })
          else summaryCache.delete(normalized)
          setSummary(value)
        })
        .catch(() => {})
        .finally(() => inflight.delete(normalized))
    }

    const onFocus = () => forceRefetch()
    const onVisibility = () => {
      if (document.visibilityState === 'visible') forceRefetch()
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [vendorId])

  return { summary }
}
