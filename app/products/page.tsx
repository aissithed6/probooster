import { headers } from 'next/headers'

import { getSupabaseAdmin } from '@/lib/supabase'
import ProductsPageClient from './ProductsPageClient'

export const dynamic = 'force-dynamic'

/**
 * Calcule l'origine (proto + host) pour permettre un fetch SSR vers les routes API internes.
 */
async function getOrigin(): Promise<string> {
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host')
  const proto = h.get('x-forwarded-proto') ?? 'http'
  if (!host) return 'http://localhost:3000'
  return `${proto}://${host}`
}

/**
 * Précharge la liste produits côté serveur pour éviter l'attente côté client.
 */
async function fetchInitialProducts(): Promise<any[]> {
  try {
    const origin = await getOrigin()
    const resp = await fetch(`${origin}/api/public/products/list?limit=48`, {
      method: 'GET',
      cache: 'no-store'
    }).catch(() => null)

    const json = await resp?.json().catch(() => null)
    const items = Array.isArray(json?.data?.items) ? json.data.items : []
    return items
  } catch {
    return []
  }
}

type ProductsPageStats = {
  totalProducts: number
  pointsEarned: number
  activeVendors: number
  savingsPercent: number
}

/**
 * Précharge les statistiques globales côté serveur pour un affichage immédiat (sans attente côté client).
 */
async function fetchInitialStats(): Promise<ProductsPageStats> {
  try {
    const supabase = getSupabaseAdmin()

    const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()

    const [productsCountRes, sharesRes, vendorsRes, promoUsageRes, specialUsageRes] = await Promise.all([
      supabase
        .from('user_products')
        .select('id', { head: true, count: 'exact' })
        .neq('product_status', 'archived'),
      supabase.from('product_shares').select('points_earned'),
      supabase
        .from('user_products')
        .select('vendor_id')
        .neq('product_status', 'archived'),
      supabase.from('promotion_usage').select('discount_amount, original_amount, used_at').gte('used_at', since),
      supabase.from('special_promotion_usage').select('discount_amount, original_amount, used_at').gte('used_at', since)
    ])

    const totalProducts = productsCountRes.count ?? 0

    const pointsEarned = (sharesRes.error ? [] : (sharesRes.data ?? [])).reduce((acc: number, row: any) => {
      const n = Number(row?.points_earned ?? 0)
      return acc + (Number.isFinite(n) ? n : 0)
    }, 0)

    const activeVendors = (() => {
      const rows = vendorsRes.error ? [] : (vendorsRes.data ?? [])
      const set = new Set<string>()
      for (const row of rows) {
        const id = String((row as any)?.vendor_id ?? '').trim()
        if (id) set.add(id)
      }
      return set.size
    })()

    const promoRows = promoUsageRes.error ? [] : (promoUsageRes.data ?? [])
    const specialRows = specialUsageRes.error ? [] : (specialUsageRes.data ?? [])
    const allRows = [...promoRows, ...specialRows]

    const { totalDiscount, totalOriginal } = allRows.reduce(
      (acc: { totalDiscount: number; totalOriginal: number }, row: any) => {
        const disc = Number(row?.discount_amount ?? 0)
        const orig = Number(row?.original_amount ?? 0)
        return {
          totalDiscount: acc.totalDiscount + (Number.isFinite(disc) ? disc : 0),
          totalOriginal: acc.totalOriginal + (Number.isFinite(orig) ? orig : 0)
        }
      },
      { totalDiscount: 0, totalOriginal: 0 }
    )

    const savingsPercent = totalOriginal > 0 ? Math.round((totalDiscount / totalOriginal) * 100) : 0

    return {
      totalProducts,
      pointsEarned: Math.round(pointsEarned),
      activeVendors,
      savingsPercent
    }
  } catch {
    return { totalProducts: 0, pointsEarned: 0, activeVendors: 0, savingsPercent: 0 }
  }
}

export default async function ProductsPage() {
  const initialProducts = await fetchInitialProducts()
  const initialStats = await fetchInitialStats()
  return <ProductsPageClient initialProducts={initialProducts} initialStats={initialStats} />
}
