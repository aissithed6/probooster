import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

type RangeValue = 'week' | 'month' | 'quarter' | 'year'

type ScopeValue = 'global' | 'category' | 'both'

/**
 * Parse le paramètre `range` en une valeur supportée.
 */
function parseRange(value: string | null): RangeValue {
  const v = String(value ?? '').trim().toLowerCase()
  if (v === 'week' || v === 'month' || v === 'quarter' || v === 'year') return v
  return 'month'
}

/**
 * Convertit une période en nombre de jours.
 */
function getDaysForRange(range: RangeValue): number {
  if (range === 'week') return 7
  if (range === 'month') return 31
  if (range === 'quarter') return 92
  if (range === 'year') return 366
  return 31
}

/**
 * Parse le paramètre `scope`.
 */
function parseScope(value: string | null): ScopeValue {
  const v = String(value ?? '').trim().toLowerCase()
  if (v === 'global' || v === 'category' || v === 'both') return v
  return 'both'
}

function toNumber(value: unknown, fallback = 0): number {
  const n = typeof value === 'number' ? value : Number(value ?? NaN)
  return Number.isFinite(n) ? n : fallback
}

function safeStr(value: unknown): string {
  return typeof value === 'string' ? value : String(value ?? '')
}

/**
 * POST /api/super-admin/rankings/recompute?range=week|month|quarter|year&scope=global|category|both
 * Recalcule et persiste les classements vendeurs (global + par catégorie produit) dans `public.rankings`.
 */
export async function POST(request: NextRequest) {
  try {
    const adminId = await assertSuperAdmin(request)
    const url = new URL(request.url)
    const range = parseRange(url.searchParams.get('range'))
    const scope = parseScope(url.searchParams.get('scope'))

    const days = getDaysForRange(range)
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    const supabase = getSupabaseAdmin()

    // 1) Liste vendeurs
    const { data: vendorRows, error: vendorError } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'vendor')
      .limit(5000)

    if (vendorError) {
      console.error('❌ POST /api/super-admin/rankings/recompute vendors failed:', vendorError)
      return NextResponse.json({ error: 'Impossible de charger la liste des vendeurs.' }, { status: 500 })
    }

    const vendorIds = (vendorRows ?? []).map((r: any) => String(r?.id ?? '')).filter(Boolean)
    if (vendorIds.length === 0) {
      return NextResponse.json(
        { data: { inserted: 0, range, scope, cutoff, note: 'Aucun vendeur trouvé.' } },
        { status: 200 }
      )
    }

    // 2) Produits vendeurs (catégorie produit)
    const { data: productRows, error: productError } = await supabase
      .from('user_products')
      .select('id,vendor_id,category,product_statistics(view_count,views_count)')
      .in('vendor_id', vendorIds as any)
      .neq('product_status', 'archived')
      .limit(10000)

    if (productError) {
      console.error('❌ POST /api/super-admin/rankings/recompute products failed:', productError)
      return NextResponse.json({ error: 'Impossible de charger les produits vendeurs.' }, { status: 500 })
    }

    type ProductRow = {
      id: string
      vendor_id: string
      category: string | null
      product_statistics?: any
    }

    const products = (productRows ?? []) as ProductRow[]

    const productIds = products.map((p) => String(p.id)).filter(Boolean)
    const productById = new Map<string, ProductRow>()
    for (const p of products) {
      if (p?.id) productById.set(String(p.id), p)
    }

    // 3) Ventes par vendor+category via order_items + orders
    // Note: on agrège côté JS (best-effort) car les schémas peuvent varier.
    const orderItemSelect =
      'id,quantity,total_price,unit_price,product_id,order:orders(id,created_at,payment_status,status,vendor_id,final_total,total_amount)'

    const { data: orderItemRows, error: orderItemsError } = await supabase
      .from('order_items')
      .select(orderItemSelect)
      .gte('created_at', cutoff)
      .limit(20000)

    if (orderItemsError) {
      console.error('❌ POST /api/super-admin/rankings/recompute order_items failed:', orderItemsError)
      // On continue malgré tout (classement basé sur views/notes)
    }

    // 4) Notes via product_reviews (ou reviews selon schéma)
    let reviewRows: any[] = []
    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('id,product_id,rating,created_at')
        .eq('status', 'approved')
        .gte('created_at', cutoff)
        .in('product_id', productIds as any)
        .limit(20000)
      if (error) {
        throw error
      }
      reviewRows = Array.isArray(data) ? data : []
    } catch {
      try {
        const { data } = await supabase
          .from('reviews')
          .select('id,product_id,rating,created_at')
          .gte('created_at', cutoff)
          .in('product_id', productIds as any)
          .limit(20000)
        reviewRows = Array.isArray(data) ? data : []
      } catch {
        reviewRows = []
      }
    }

    type Key = string
    const makeKey = (vendorId: string, category: string) => `${vendorId}::${category}`

    const metricsByKey = new Map<
      Key,
      {
        vendorId: string
        category: string
        revenue: number
        salesCount: number
        views: number
        ratingSum: number
        ratingCount: number
      }
    >()

    const ensure = (vendorId: string, category: string) => {
      const key = makeKey(vendorId, category)
      const existing = metricsByKey.get(key)
      if (existing) return existing
      const init = { vendorId, category, revenue: 0, salesCount: 0, views: 0, ratingSum: 0, ratingCount: 0 }
      metricsByKey.set(key, init)
      return init
    }

    // 2b) Views: somme des vues produits (indépendant de la période si stats non temporelles)
    for (const p of products) {
      const vendorId = safeStr(p?.vendor_id).trim()
      if (!vendorId) continue
      const category = safeStr(p?.category ?? 'Général').trim() || 'Général'

      const stats = Array.isArray((p as any)?.product_statistics)
        ? (p as any).product_statistics[0]
        : (p as any)?.product_statistics

      const views = toNumber((stats as any)?.view_count ?? (stats as any)?.views_count ?? 0, 0)
      const row = ensure(vendorId, category)
      row.views += Math.max(0, views)
    }

    // 3b) Sales: somme total_price des order_items, filtrage paiement "completed" best-effort
    if (Array.isArray(orderItemRows)) {
      for (const item of orderItemRows as any[]) {
        const order = (item as any)?.order
        const vendorId = safeStr(order?.vendor_id).trim()
        if (!vendorId) continue

        const paymentStatus = safeStr(order?.payment_status).toLowerCase()
        if (paymentStatus && paymentStatus !== 'completed') continue

        const productId = safeStr((item as any)?.product_id).trim()
        const product = productById.get(productId)
        if (!product) continue

        const category = safeStr(product?.category ?? 'Général').trim() || 'Général'
        const total = toNumber((item as any)?.total_price ?? (item as any)?.unit_price, 0)
        const row = ensure(vendorId, category)
        row.revenue += Math.max(0, total)
        row.salesCount += Math.max(0, toNumber((item as any)?.quantity, 1))
      }
    }

    // 4b) Rating
    for (const r of reviewRows) {
      const productId = safeStr((r as any)?.product_id).trim()
      const product = productById.get(productId)
      if (!product) continue
      const vendorId = safeStr(product.vendor_id).trim()
      if (!vendorId) continue
      const category = safeStr(product.category ?? 'Général').trim() || 'Général'
      const rating = toNumber((r as any)?.rating, 0)
      if (rating <= 0) continue
      const row = ensure(vendorId, category)
      row.ratingSum += rating
      row.ratingCount += 1
    }

    // 5) Construire global + category rows selon scope
    const categoryRows: Array<{
      user_id: string
      category: string
      score: number
      rank_position: number
      period: string
      created_at: string
      // champs optionnels (best-effort)
      sales_volume?: number
      views_count?: number
      rating?: number
      total_revenue?: number
      overall_rank?: number
    }> = []

    const nowIso = new Date().toISOString()

    const perCategory = Array.from(metricsByKey.values())

    const computeScore = (m: { revenue: number; views: number; ratingSum: number; ratingCount: number }): number => {
      const ratingAvg = m.ratingCount > 0 ? m.ratingSum / m.ratingCount : 0
      // Pondération simple:
      // - CA: dominant
      // - Vues: léger boost
      // - Note: boost significatif
      return Math.max(0, m.revenue) + Math.max(0, m.views) * 0.1 + Math.max(0, ratingAvg) * 100
    }

    if (scope === 'category' || scope === 'both') {
      // Rank par catégorie
      const categories = Array.from(new Set(perCategory.map((m) => m.category)))
      for (const cat of categories) {
        const rows = perCategory
          .filter((m) => m.category === cat)
          .map((m) => {
            const ratingAvg = m.ratingCount > 0 ? m.ratingSum / m.ratingCount : 0
            const score = computeScore(m)
            return { ...m, ratingAvg, score }
          })
          .sort((a, b) => b.score - a.score)

        rows.forEach((m, idx) => {
          categoryRows.push({
            user_id: m.vendorId,
            category: cat,
            rank_position: idx + 1,
            score: Number(m.score.toFixed(2)),
            period: range,
            created_at: nowIso,
            sales_volume: Math.round(m.salesCount),
            views_count: Math.round(m.views),
            rating: Number(m.ratingAvg.toFixed(2)),
            total_revenue: Number(m.revenue.toFixed(2))
          })
        })
      }
    }

    if (scope === 'global' || scope === 'both') {
      // Agrégation globale par vendeur
      const byVendor = new Map<
        string,
        { vendorId: string; revenue: number; views: number; ratingSum: number; ratingCount: number; salesCount: number }
      >()

      for (const m of perCategory) {
        const current = byVendor.get(m.vendorId) ?? {
          vendorId: m.vendorId,
          revenue: 0,
          views: 0,
          ratingSum: 0,
          ratingCount: 0,
          salesCount: 0
        }
        current.revenue += m.revenue
        current.views += m.views
        current.ratingSum += m.ratingSum
        current.ratingCount += m.ratingCount
        current.salesCount += m.salesCount
        byVendor.set(m.vendorId, current)
      }

      const globalRows = Array.from(byVendor.values())
        .map((m) => {
          const ratingAvg = m.ratingCount > 0 ? m.ratingSum / m.ratingCount : 0
          const score = computeScore(m)
          return { ...m, ratingAvg, score }
        })
        .sort((a, b) => b.score - a.score)

      globalRows.forEach((m, idx) => {
        categoryRows.push({
          user_id: m.vendorId,
          category: 'global',
          rank_position: idx + 1,
          score: Number(m.score.toFixed(2)),
          period: range,
          created_at: nowIso,
          sales_volume: Math.round(m.salesCount),
          views_count: Math.round(m.views),
          rating: Number(m.ratingAvg.toFixed(2)),
          total_revenue: Number(m.revenue.toFixed(2)),
          overall_rank: idx + 1
        })
      })
    }

    if (categoryRows.length === 0) {
      return NextResponse.json(
        { data: { inserted: 0, range, scope, cutoff, note: 'Aucune métrique exploitable.' } },
        { status: 200 }
      )
    }

    // 6) Insert best-effort dans rankings.
    // Le schéma de `public.rankings` peut varier selon environnements.
    // On tente d'insérer un payload riche, puis on fallback sur un payload minimal si des colonnes n'existent pas.

    const buildMinimal = (r: any) => ({
      user_id: r.user_id,
      category: r.category,
      rank_position: r.rank_position,
      score: r.score,
      period: r.period,
      created_at: r.created_at
    })

    const payloadRich = categoryRows.map((r) => ({
      ...buildMinimal(r),
      sales_volume: r.sales_volume,
      views_count: r.views_count,
      rating: r.rating,
      total_revenue: r.total_revenue,
      overall_rank: r.overall_rank
    }))

    let inserted = 0

    const tryInsert = async (rows: any[]) => {
      const { error } = await supabase.from('rankings').insert(rows as any)
      if (error) throw error
      return rows.length
    }

    try {
      inserted = await tryInsert(payloadRich)
    } catch (error: any) {
      const msg = typeof error?.message === 'string' ? error.message : String(error ?? '')
      console.warn('⚠️ rankings insert rich failed, fallback minimal:', msg)
      const minimalRows = categoryRows.map(buildMinimal)
      inserted = await tryInsert(minimalRows)
    }

    return NextResponse.json(
      {
        data: {
          inserted,
          range,
          scope,
          cutoff,
          computedAt: nowIso,
          adminId
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ POST /api/super-admin/rankings/recompute unexpected error:', error)
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const status = message.toLowerCase().includes('accès') ? 403 : message.toLowerCase().includes('token') ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
