import BestSellersPageClient from './BestSellersPageClient'
import { getSupabaseAdmin } from '@/lib/supabase'

type BestSellersStats = {
  totalSales: number
  revenueFcfa: number
  averageRating: number
  topCategoryName: string
  topCategorySharePercent: number
  salesGrowthPercent?: number
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

type BestSellersItem = {
  id: string
  name: string
  price: number
  salePrice?: number | null
  pointsPrice: number
  originalPrice?: number
  rating: number
  reviews: number
  image: string
  seller: string
  vendorId?: string
  stockQuantity?: number | null
  sharePoints: number
  shares: number
  inStock: boolean
  discount: number
  isHot: boolean
  isNew: boolean
  isLimited: boolean
  badges: string[]
  color: string
  rank: number
  sales: number
}

/**
 * Normalise les prix pour correspondre à la sémantique WooCommerce:
 * - price = prix régulier (le plus élevé)
 * - salePrice = prix promo (le plus bas, seulement s'il est inférieur)
 */
function normalizePrices(input: { price: unknown; sale_price: unknown; original_price: unknown }): {
  price: number
  salePrice: number | null
  originalPrice: number
} {
  const candidatesRaw = [input.price, input.sale_price, input.original_price]
  const candidates = candidatesRaw
    .map((v) => (v === null || v === undefined ? NaN : Number(v)))
    .filter((n) => Number.isFinite(n) && n > 0)

  const regular = candidates.length > 0 ? Math.max(...candidates) : 0

  const saleCandidate = input.sale_price === null || input.sale_price === undefined ? NaN : Number(input.sale_price)
  const sale = Number.isFinite(saleCandidate) && saleCandidate > 0 && saleCandidate < regular ? saleCandidate : null

  return { price: regular, salePrice: sale, originalPrice: regular }
}

/**
 * Page /best-sellers (SSR): charge produits et stats côté serveur pour un affichage immédiat.
 */
export default async function BestSellersPage() {
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

  const [{ data: productRows }, { data: statsRows }, { data: reviewRows }, { data: catAssignRows }, { data: ordersRows }] =
    await Promise.all([
    supabase
      .from('user_products')
      .select(
        'id,name,price,sale_price,original_price,vendor_id,product_status,main_image,images,created_at,stock_quantity,manage_stock,product_statistics(total_sales,average_rating,review_count)'
      )
      .neq('product_status', 'archived')
      .eq('product_status', 'active')
      .order('total_sales', { ascending: false, nullsFirst: false, referencedTable: 'product_statistics' } as any)
      .order('created_at', { ascending: false })
      .limit(12),

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

  const rows = Array.isArray(productRows) ? productRows : []
  const vendorIds = Array.from(
    new Set(
      rows
        .map((row: any) => row?.vendor_id)
        .filter((value: any) => typeof value === 'string' && value.length > 0)
        .map((value: any) => String(value))
    )
  )

  const { data: vendorProfiles } = vendorIds.length
    ? await supabase
        .from('user_profiles')
        .select('id, user_id, first_name, last_name, avatar_url')
        .or(`user_id.in.(${vendorIds.join(',')}),id.in.(${vendorIds.join(',')})`)
    : ({ data: [] } as any)

  const vendorProfileByVendorId = new Map<string, { name: string }>()
  const vendorUserIdByProfileId = new Map<string, string>()
  ;(vendorProfiles ?? []).forEach((profile: any) => {
    const profileId = typeof profile?.id === 'string' ? String(profile.id) : ''
    const userId = typeof profile?.user_id === 'string' ? String(profile.user_id) : ''
    const first = typeof profile?.first_name === 'string' ? profile.first_name : ''
    const last = typeof profile?.last_name === 'string' ? profile.last_name : ''
    const name = `${first} ${last}`.trim()
    if (userId) vendorProfileByVendorId.set(userId, { name })
    if (profileId) vendorProfileByVendorId.set(profileId, { name })
    if (profileId && userId) vendorUserIdByProfileId.set(profileId, userId)
  })

  const initialProducts: BestSellersItem[] = rows.map((row: any, idx: number) => {
    const images = Array.isArray(row.images) ? row.images : []
    const image = String(row.main_image ?? images[0] ?? '/placeholder.svg')

    const normalizedPrices = normalizePrices({
      price: row.price,
      sale_price: row.sale_price,
      original_price: row.original_price
    })

    const regularPrice = normalizedPrices.price
    const salePrice = normalizedPrices.salePrice
    const effectivePrice = salePrice && salePrice > 0 ? salePrice : regularPrice
    const pointsPrice = Math.max(1, Math.round((Number(effectivePrice) || 0) / 200))

    const rawStockQuantity = row.stock_quantity === null || row.stock_quantity === undefined ? NaN : Number(row.stock_quantity)
    const stockCount = Number.isFinite(rawStockQuantity) ? rawStockQuantity : 0
    const manageStock = row.manage_stock === null || row.manage_stock === undefined ? false : Boolean(row.manage_stock)
    const inStock = manageStock ? stockCount > 0 : true

    const rawVendorId = typeof row.vendor_id === 'string' ? String(row.vendor_id) : ''
    const vendorId = rawVendorId ? (vendorUserIdByProfileId.get(rawVendorId) ?? rawVendorId) : ''
    const sellerName = vendorId ? String(vendorProfileByVendorId.get(vendorId)?.name ?? '').trim() : ''

    const stats = (row as any)?.product_statistics
    const totalSales = Number(stats?.total_sales ?? 0) || 0
    const productRating = Number(stats?.average_rating ?? 0) || 0
    const productReviewCount = Number(stats?.review_count ?? 0) || 0

    const discount =
      regularPrice > 0 && salePrice !== null && salePrice > 0 && salePrice < regularPrice
        ? Math.round(((regularPrice - salePrice) / regularPrice) * 100)
        : 0

    return {
      id: String(row.id),
      name: String(row.name ?? 'Produit'),
      price: regularPrice,
      salePrice,
      pointsPrice,
      originalPrice: regularPrice,
      rating: productRating,
      reviews: productReviewCount,
      image,
      seller: sellerName || 'Boutique',
      vendorId: vendorId || undefined,
      stockQuantity: stockCount,
      sharePoints: 50,
      shares: 0,
      inStock,
      discount,
      isHot: false,
      isNew: false,
      isLimited: false,
      badges: [],
      color: 'black',
      rank: idx + 1,
      sales: totalSales
    }
  })

  const totalSales = (Array.isArray(statsRows) ? statsRows : []).reduce(
    (acc: number, r: any) => acc + (Number(r?.total_sales ?? 0) || 0),
    0
  )

  const reviewList = Array.isArray(reviewRows) ? reviewRows : []
  const ratingSum = reviewList.reduce((acc: number, r: any) => acc + (Number(r?.rating ?? 0) || 0), 0)
  const averageRating = reviewList.length > 0 ? ratingSum / reviewList.length : 0

  const assignList = Array.isArray(catAssignRows) ? catAssignRows : []
  const salesByCategory = new Map<string, number>()
  let totalSalesForCategories = 0
  for (const row of assignList) {
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

  const { data: revenueProducts } = await supabase
    .from('user_products')
    .select('id, price, product_statistics(total_sales)')
    .neq('product_status', 'archived')
    .limit(500)

  const revenueFcfa = (revenueProducts ?? []).reduce((acc: number, p: any) => {
    const sales = Number(p?.product_statistics?.total_sales ?? 0) || 0
    const price = Number(p?.price ?? 0) || 0
    return acc + Math.max(0, sales) * Math.max(0, price)
  }, 0)

  const flattenedOrderItems: Array<{ product_id: string; quantity: number; created_at: string | null }> = []
  for (const order of (Array.isArray(ordersRows) ? ordersRows : []) as any[]) {
    const createdAt = typeof order?.created_at === 'string' ? String(order.created_at) : null
    const items = Array.isArray(order?.order_items) ? order.order_items : []
    for (const it of items) {
      const productId = typeof it?.product_id === 'string' ? String(it.product_id) : ''
      if (!productId) continue
      flattenedOrderItems.push({
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
    for (const row of flattenedOrderItems as any[]) {
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

  const qtyTodayByProduct = new Map<string, number>()
  const qtyYesterdayByProduct = new Map<string, number>()
  const todayStartMs = todayStart.getTime()
  const yesterdayStartMs = yesterdayStart.getTime()
  const nowMs = now.getTime()

  for (const row of flattenedOrderItems as any[]) {
    const productId = typeof (row as any)?.product_id === 'string' ? String((row as any).product_id) : ''
    if (!productId) continue
    const q = Number((row as any)?.quantity ?? 0) || 0
    const createdAt = (row as any)?.created_at
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

  const topProducts = topProductIds.map((id) => {
    const todayQty = qtyTodayByProduct.get(id) ?? 0
    const yQty = qtyYesterdayByProduct.get(id) ?? 0
    return {
      productId: id,
      name: nameById.get(id) ?? 'Produit',
      salesCount: Math.round(todayQty),
      changePercent: computeChangePercent(todayQty, yQty)
    }
  })

  const initialStats: BestSellersStats = {
    totalSales: Math.round(totalSales),
    revenueFcfa: Math.round(revenueFcfa),
    averageRating: Number.isFinite(averageRating) ? Number(averageRating.toFixed(2)) : 0,
    topCategoryName: topCategoryName || '—',
    topCategorySharePercent,
    salesGrowthPercent: monthPercent,
    salesTrend,
    topProducts
  }

  return <BestSellersPageClient initialProducts={initialProducts} initialStats={initialStats} />
}
