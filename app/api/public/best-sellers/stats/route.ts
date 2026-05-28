import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

type BestSellersStats = {
  totalSales: number
  revenueFcfa: number
  averageRating: number
  topCategoryName: string
  topCategorySharePercent: number
  salesGrowthPercent?: number
  revenueGrowthPercent?: number
  ratingDelta?: number
  salesTrend?: {
    weekPercent: number
    weekBarPercent: number
    monthPercent: number
    monthBarPercent: number
    quarterPercent: number
    quarterBarPercent: number
  }
  topProducts?: Array<{
    productId: string
    name: string
    salesCount: number
    changePercent: number
  }>
}

/**
 * Calcule le pourcentage de changement (courant vs précédent).
 */
function computeChangePercent(current: number, previous: number): number {
  const c = Number(current) || 0
  const p = Number(previous) || 0
  if (p <= 0) return 0
  return Math.round(((c - p) / p) * 1000) / 10
}

/**
 * Convertit un % de changement en largeur de barre (0-100) stable pour l'UI.
 */
function toBarWidthPercent(changePercent: number): number {
  const v = Math.abs(Number(changePercent) || 0)
  const capped = Math.min(v, 50)
  return Math.max(5, Math.round((capped / 50) * 100))
}

/**
 * Retourne des statistiques publiques agrégées pour /best-sellers.
 */
export async function GET() {
  try {
    const supabase = getSupabaseAdmin()

    const now = new Date()
    const dayMs = 24 * 60 * 60 * 1000
    const weekStart = new Date(now.getTime() - 7 * dayMs)
    const weekPrevStart = new Date(now.getTime() - 14 * dayMs)
    const monthStart = new Date(now.getTime() - 30 * dayMs)
    const monthPrevStart = new Date(now.getTime() - 60 * dayMs)
    const quarterStart = new Date(now.getTime() - 90 * dayMs)
    const quarterPrevStart = new Date(now.getTime() - 180 * dayMs)

    const todayStart = new Date(now.getTime() - 1 * dayMs)
    const yesterdayStart = new Date(now.getTime() - 2 * dayMs)

    const [statsRowsRes, reviewsAggRes, categoriesRes, ordersRes] = await Promise.all([
      supabase.from('product_statistics').select('total_sales, product_id'),
      supabase.from('product_reviews').select('rating').eq('status', 'approved'),
      supabase
        .from('product_category_assignments')
        .select('category_id, product_id, user_products!inner(id, product_status), product_statistics(total_sales)')
        .neq('user_products.product_status', 'archived'),
      supabase
        .from('orders')
        .select('created_at, payment_status, order_items(product_id, quantity)')
        .gte('created_at', quarterPrevStart.toISOString())
        .eq('payment_status', 'completed')
    ])

    const statsRows = statsRowsRes.error ? [] : (statsRowsRes.data ?? [])
    const totalSales = statsRows.reduce((acc: number, r: any) => acc + (Number(r?.total_sales ?? 0) || 0), 0)

    const reviewsRows = reviewsAggRes.error ? [] : (reviewsAggRes.data ?? [])
    const ratingSum = reviewsRows.reduce((acc: number, r: any) => acc + (Number(r?.rating ?? 0) || 0), 0)
    const averageRating = reviewsRows.length > 0 ? ratingSum / reviewsRows.length : 0

    const catAssignRows = categoriesRes.error ? [] : (categoriesRes.data ?? [])
    const salesByCategory = new Map<string, number>()
    let totalSalesForCategories = 0

    for (const row of catAssignRows) {
      const categoryId = String((row as any)?.category_id ?? '').trim()
      if (!categoryId) continue
      const sales = Number((row as any)?.product_statistics?.total_sales ?? 0) || 0
      totalSalesForCategories += Math.max(0, sales)
      salesByCategory.set(categoryId, (salesByCategory.get(categoryId) ?? 0) + Math.max(0, sales))
    }

    let topCategoryId = ''
    let topCategorySales = 0
    for (const [cid, s] of salesByCategory.entries()) {
      if (s > topCategorySales) {
        topCategoryId = cid
        topCategorySales = s
      }
    }

    let topCategoryName = ''
    if (topCategoryId) {
      const { data: catRow } = await supabase.from('product_categories').select('name').eq('id', topCategoryId).maybeSingle()
      topCategoryName = typeof (catRow as any)?.name === 'string' ? String((catRow as any).name) : ''
    }

    const topCategorySharePercent =
      totalSalesForCategories > 0 ? Math.round((topCategorySales / totalSalesForCategories) * 100) : 0

    // Chiffre d'affaires: approximation (ventes * prix régulier). Sans table d'orders fiable ici.
    // Pour rester synchronisé sans cassure, on estime en se basant sur user_products.price.
    const { data: topProducts } = await supabase
      .from('user_products')
      .select('id, price, product_statistics(total_sales)')
      .neq('product_status', 'archived')
      .limit(500)

    const revenueFcfa = (topProducts ?? []).reduce((acc: number, p: any) => {
      const sales = Number(p?.product_statistics?.total_sales ?? 0) || 0
      const price = Number(p?.price ?? 0) || 0
      return acc + Math.max(0, sales) * Math.max(0, price)
    }, 0)

    const ordersRows = ordersRes.error ? [] : (ordersRes.data ?? [])

    const orderItemsRows: Array<{ product_id: string; quantity: number; created_at: string | null }> = []
    for (const order of ordersRows as any[]) {
      const createdAt = typeof order?.created_at === 'string' ? String(order.created_at) : null
      const items = Array.isArray(order?.order_items) ? order.order_items : []
      for (const it of items) {
        const productId = typeof it?.product_id === 'string' ? String(it.product_id) : ''
        if (!productId) continue
        orderItemsRows.push({
          product_id: productId,
          quantity: Number(it?.quantity ?? 0) || 0,
          created_at: createdAt
        })
      }
    }

    const sumByRange = (start: Date, end: Date): number => {
      const s = start.getTime()
      const e = end.getTime()
      let total = 0
      for (const row of orderItemsRows as any[]) {
        const createdAt = (row as any)?.created_at
        const t = typeof createdAt === 'string' ? Date.parse(createdAt) : NaN
        if (!Number.isFinite(t)) continue
        if (t >= s && t < e) {
          total += Number((row as any)?.quantity ?? 0) || 0
        }
      }
      return total
    }

    const weekCurrent = sumByRange(weekStart, now)
    const weekPrev = sumByRange(weekPrevStart, weekStart)
    const monthCurrent = sumByRange(monthStart, now)
    const monthPrev = sumByRange(monthPrevStart, monthStart)
    const quarterCurrent = sumByRange(quarterStart, now)
    const quarterPrev = sumByRange(quarterPrevStart, quarterStart)

    const weekPercent = computeChangePercent(weekCurrent, weekPrev)
    const monthPercent = computeChangePercent(monthCurrent, monthPrev)
    const quarterPercent = computeChangePercent(quarterCurrent, quarterPrev)

    const salesTrend = {
      weekPercent,
      weekBarPercent: toBarWidthPercent(weekPercent),
      monthPercent,
      monthBarPercent: toBarWidthPercent(monthPercent),
      quarterPercent,
      quarterBarPercent: toBarWidthPercent(quarterPercent)
    }

    // Top produits sur 24h et variation vs les 24h précédentes
    const qtyTodayByProduct = new Map<string, number>()
    const qtyYesterdayByProduct = new Map<string, number>()
    const todayStartMs = todayStart.getTime()
    const yesterdayStartMs = yesterdayStart.getTime()
    const nowMs = now.getTime()

    for (const row of orderItemsRows as any[]) {
      const productId = typeof row?.product_id === 'string' ? String(row.product_id) : ''
      if (!productId) continue
      const q = Number(row?.quantity ?? 0) || 0
      const createdAt = row?.created_at
      const t = typeof createdAt === 'string' ? Date.parse(createdAt) : NaN
      if (!Number.isFinite(t)) continue

      if (t >= todayStartMs && t < nowMs) {
        qtyTodayByProduct.set(productId, (qtyTodayByProduct.get(productId) ?? 0) + q)
      } else if (t >= yesterdayStartMs && t < todayStartMs) {
        qtyYesterdayByProduct.set(productId, (qtyYesterdayByProduct.get(productId) ?? 0) + q)
      }
    }

    const topProductIds = Array.from(qtyTodayByProduct.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id)

    const { data: prodNames } = topProductIds.length
      ? await supabase.from('user_products').select('id, name').in('id', topProductIds)
      : ({ data: [] } as any)

    const nameById = new Map<string, string>()
    ;(prodNames ?? []).forEach((p: any) => {
      const id = typeof p?.id === 'string' ? String(p.id) : ''
      const name = typeof p?.name === 'string' ? String(p.name) : ''
      if (id) nameById.set(id, name)
    })

    const topProductsPayload = topProductIds.map((id) => {
      const todayQty = qtyTodayByProduct.get(id) ?? 0
      const yQty = qtyYesterdayByProduct.get(id) ?? 0
      return {
        productId: id,
        name: nameById.get(id) ?? 'Produit',
        salesCount: Math.round(todayQty),
        changePercent: computeChangePercent(todayQty, yQty)
      }
    })

    const data: BestSellersStats = {
      totalSales: Math.round(totalSales),
      revenueFcfa: Math.round(revenueFcfa),
      averageRating: Number.isFinite(averageRating) ? Number(averageRating.toFixed(2)) : 0,
      topCategoryName: topCategoryName || '—',
      topCategorySharePercent,
      salesGrowthPercent: monthPercent,
      salesTrend,
      topProducts: topProductsPayload
    }

    return NextResponse.json({ data }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erreur inconnue' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}
