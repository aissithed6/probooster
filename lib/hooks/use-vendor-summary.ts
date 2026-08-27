'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

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

async function doFetchAndCache(normalized: string): Promise<VendorSummary | null> {
  let promise = inflight.get(normalized)
  if (!promise) {
    promise = fetchVendorSummary(normalized)
    inflight.set(normalized, promise)
  }
  try {
    const value = await promise
    if (value) {
      summaryCache.set(normalized, { value, expiresAt: Date.now() + CACHE_TTL_MS })
    } else {
      summaryCache.delete(normalized)
    }
    return value
  } finally {
    inflight.delete(normalized)
  }
}

/**
 * Temps réel des notes vendeur côté public.
 *
 * Un SEUL canal global est partagé par tout le module (quel que soit le nombre
 * de cartes/vendeurs montés sur la page). Quand un trigger Supabase met à jour
 * le snapshot d'un vendeur, l'événement invalide le cache de ce vendeur et
 * notifie chaque composant monté → la note se rafraîchit immédiatement,
 * partout (cartes vendeur, page vendeur, page produit, liste des vendeurs).
 */
const vendorRatingListeners = new Map<string, Set<() => void>>()
let realtimeChannel: any = null

function ensureVendorRatingChannel() {
  if (realtimeChannel) return
  realtimeChannel = supabase
    .channel('realtime:vendor-ratings-global')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'vendor_rating_snapshot' },
      (payload) => {
        const vid = String((payload as any)?.new?.vendor_id ?? '').trim()
        if (!vid) return
        // Invalide le cache : le prochain refetch re-lira depuis Supabase.
        summaryCache.delete(vid)
        const set = vendorRatingListeners.get(vid)
        if (set) set.forEach((fn) => { try { fn() } catch { /* ignore */ } })
      }
    )
    .subscribe()
}

/**
 * Charge le résumé public d'un vendeur (note, avis, temps de réponse moyen),
 * rafraîchi en temps réel à chaque changement d'avis approuvé.
 * Retourne `null` si vendorId absent/invalide ou si l'API échoue.
 */
export function useVendorSummary(vendorId: string) {
  const [summary, setSummary] = useState<VendorSummary | null>(null)
  const listenersRef = useRef<Set<() => void> | null>(null)

  useEffect(() => {
    let cancelled = false
    const normalized = String(vendorId ?? '').trim()

    if (!normalized || !UUID_REGEX.test(normalized)) {
      setSummary(null)
      return
    }

    // Inscription à la pub/sub Réputation (realtime).
    let set = vendorRatingListeners.get(normalized)
    if (!set) {
      set = new Set()
      vendorRatingListeners.set(normalized, set)
    }
    listenersRef.current = set
    const onRatingEvent = () => {
      if (cancelled) return
      void doFetchAndCache(normalized).then((v) => {
        if (!cancelled) setSummary(v)
      })
    }
    set.add(onRatingEvent)
    ensureVendorRatingChannel()

    ;(async () => {
      const cached = summaryCache.get(normalized)
      if (cached && cached.expiresAt > Date.now()) {
        if (!cancelled) setSummary(cached.value)
        return
      }
      const value = await doFetchAndCache(normalized)
      if (!cancelled) setSummary(value)
    })()

    // Revalidation au retour sur l'onglet / visibilité.
    const forceRefetch = () => {
      summaryCache.delete(normalized)
      void doFetchAndCache(normalized).then((v) => {
        if (!cancelled) setSummary(v)
      })
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
      if (listenersRef.current) {
        listenersRef.current.delete(onRatingEvent)
      }
    }
  }, [vendorId])

  return { summary }
}

