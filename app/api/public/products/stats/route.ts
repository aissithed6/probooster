import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

type ProductsPageStats = {
  totalProducts: number
  pointsEarned: number
  activeVendors: number
  savingsPercent: number
}

/**
 * Retourne des statistiques publiques agrégées pour /products.
 */
export async function GET() {
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

    const data: ProductsPageStats = {
      totalProducts,
      pointsEarned: Math.round(pointsEarned),
      activeVendors,
      savingsPercent
    }

    return NextResponse.json({ data }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erreur inconnue' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}
