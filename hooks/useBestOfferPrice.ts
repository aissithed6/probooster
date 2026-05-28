"use client"

import { useEffect, useMemo, useState } from 'react'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type BestOfferSource = 'classic' | 'special'

export type BestOfferPrice = {
  price: number
  originalPrice: number
  discountPercent: number
  source: BestOfferSource
  promotionId?: string
}

type CacheEntry = {
  value: BestOfferPrice
  expiresAt: number
}

const CACHE_TTL_MS = 30_000
const bestOfferCache = new Map<string, CacheEntry>()
const inflight = new Map<string, Promise<BestOfferPrice | null>>()

/**
 * Calcule un pourcentage de remise à partir d'un prix original et d'un prix remisé.
 */
function computeDiscountPercent(originalPrice: number, price: number) {
  if (!Number.isFinite(originalPrice) || originalPrice <= 0) return 0
  if (!Number.isFinite(price) || price >= originalPrice) return 0
  return Math.max(0, Math.min(100, Math.round(((originalPrice - price) / originalPrice) * 100)))
}

/**
 * Retourne la meilleure offre disponible pour un produit:
 * - Priorité aux promotions classiques (/api/public/offers)
 * - Sinon promotions spéciales (/api/public/special-offers)
 */
async function fetchBestOfferPrice(productId: string): Promise<BestOfferPrice | null> {
  const pid = encodeURIComponent(productId)

  const readBestFromEndpoint = async (url: string, source: BestOfferSource): Promise<BestOfferPrice | null> => {
    const resp = await fetch(url, { cache: 'no-store' }).catch(() => null)
    if (!resp || !resp.ok) return null

    const data = await resp.json().catch(() => [])
    const list = Array.isArray(data) ? data : []

    let best: any | null = null
    for (const item of list) {
      const discounted = Number((item as any)?.discountedPrice)
      if (!Number.isFinite(discounted)) continue
      if (!best || discounted < Number((best as any)?.discountedPrice)) {
        best = item
      }
    }

    if (!best) return null

    const originalPrice = Number((best as any)?.originalPrice)
    const discountedPrice = Number((best as any)?.discountedPrice)

    if (!Number.isFinite(originalPrice) || !Number.isFinite(discountedPrice)) return null

    return {
      price: discountedPrice,
      originalPrice,
      discountPercent: computeDiscountPercent(originalPrice, discountedPrice),
      source,
      promotionId: typeof (best as any)?.promotionId === 'string' ? (best as any).promotionId : undefined
    }
  }

  // 1) Promotions classiques
  const classic = await readBestFromEndpoint(`/api/public/offers?productId=${pid}`, 'classic')
  if (classic) return classic

  // 2) Promotions spéciales
  const special = await readBestFromEndpoint(`/api/public/special-offers?productId=${pid}`, 'special')
  if (special) return special

  return null
}

/**
 * Hook client pour obtenir et mettre en cache le meilleur prix (promo classique sinon spéciale).
 * Si l'ID n'est pas un UUID Supabase, le hook ne fait aucune requête.
 */
export function useBestOfferPrice(productId: string | number | null | undefined) {
  const key = useMemo(() => {
    if (productId === null || productId === undefined) return null
    const str = String(productId)
    if (!UUID_REGEX.test(str)) return null
    return str
  }, [productId])

  const [state, setState] = useState<{
    offer: BestOfferPrice | null
    loading: boolean
  }>(() => ({ offer: null, loading: false }))

  useEffect(() => {
    if (!key) {
      setState({ offer: null, loading: false })
      return
    }

    const cached = bestOfferCache.get(key)
    if (cached && cached.expiresAt > Date.now()) {
      setState({ offer: cached.value, loading: false })
      return
    }

    setState((prev) => ({ ...prev, loading: true }))

    let promise = inflight.get(key)
    if (!promise) {
      promise = fetchBestOfferPrice(key)
      inflight.set(key, promise)
    }

    promise
      .then((offer) => {
        if (offer) {
          bestOfferCache.set(key, { value: offer, expiresAt: Date.now() + CACHE_TTL_MS })
        } else {
          bestOfferCache.delete(key)
        }
        setState({ offer: offer ?? null, loading: false })
      })
      .catch(() => {
        setState({ offer: null, loading: false })
      })
      .finally(() => {
        inflight.delete(key)
      })
  }, [key])

  return state
}

/**
 * Vide le cache du hook useBestOfferPrice (utile après une action admin ou un test).
 */
export function clearBestOfferPriceCache() {
  bestOfferCache.clear()
  inflight.clear()
}
