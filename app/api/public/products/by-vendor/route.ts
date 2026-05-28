import { NextRequest, NextResponse } from 'next/server'

import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

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

  const saleCandidate =
    input.sale_price === null || input.sale_price === undefined ? NaN : Number(input.sale_price)
  const sale = Number.isFinite(saleCandidate) && saleCandidate > 0 && saleCandidate < regular ? saleCandidate : null

  return { price: regular, salePrice: sale, originalPrice: regular }
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type PublicVendorProduct = {
  id: string
  name: string
  price: number
  originalPrice: number
  salePrice: number | null
  image: string
  images: string[]
  vendorId: string
  categoryIds: string[]
  inStock: boolean
  stockCount: number
  discount: number
  createdAt?: string
  totalSales?: number
  averageRating?: number
  reviewCount?: number
  shareCount?: number
}

/**
 * GET /api/public/products/by-vendor?vendorId=<uuid>&limit=48
 * Retourne une liste publique de produits pour un vendeur (page vendeur côté client).
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const vendorId = String(url.searchParams.get('vendorId') ?? '').trim()

    if (!UUID_REGEX.test(vendorId)) {
      return NextResponse.json({ data: { items: [], count: 0 } }, { status: 200 })
    }

    const limitRaw = url.searchParams.get('limit')
    const limit = Math.min(Math.max(Number(limitRaw ?? 48) || 48, 1), 96)

    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('user_products')
      .select(
        'id,name,price,sale_price,original_price,vendor_id,product_status,main_image,images,stock_quantity,manage_stock,created_at,product_category_assignments(category_id),product_statistics(total_sales,average_rating,review_count,share_count)'
      )
      .eq('vendor_id', vendorId)
      .neq('product_status', 'archived')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      return NextResponse.json({ data: { items: [], count: 0 }, warning: error.message }, { status: 200 })
    }

    const rows = (data ?? []) as any[]

    const items: PublicVendorProduct[] = rows.map((row: any) => {
      const images = Array.isArray(row.images) ? row.images : []
      const image = String(row.main_image ?? images[0] ?? '/placeholder.svg')

      const normalizedPrices = normalizePrices({
        price: row.price,
        sale_price: row.sale_price,
        original_price: row.original_price
      })

      const price = normalizedPrices.price
      const originalPrice = normalizedPrices.originalPrice
      const salePrice = normalizedPrices.salePrice

      const rawStockQuantity = row.stock_quantity === null || row.stock_quantity === undefined ? NaN : Number(row.stock_quantity)
      const stockCount = Number.isFinite(rawStockQuantity) ? rawStockQuantity : 0
      const manageStock = row.manage_stock === null || row.manage_stock === undefined ? false : Boolean(row.manage_stock)
      const inStock = manageStock ? stockCount > 0 : true

      const categoryIds = Array.isArray(row?.product_category_assignments)
        ? row.product_category_assignments
            .map((x: any) => String(x?.category_id ?? '').trim())
            .filter((id: string) => id.length > 0)
        : []

      const discount =
        originalPrice > 0 && salePrice !== null && salePrice > 0 && salePrice < originalPrice
          ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
          : 0

      const createdAt = typeof row?.created_at === 'string' ? String(row.created_at).trim() : ''
      const stats = (row as any)?.product_statistics
      const totalSalesRaw = Array.isArray(stats) ? stats?.[0]?.total_sales : stats?.total_sales
      const totalSales = Number(totalSalesRaw)

      const averageRatingRaw = Array.isArray(stats) ? stats?.[0]?.average_rating : stats?.average_rating
      const reviewCountRaw = Array.isArray(stats) ? stats?.[0]?.review_count : stats?.review_count
      const shareCountRaw = Array.isArray(stats) ? stats?.[0]?.share_count : stats?.share_count
      const averageRating = Number(averageRatingRaw)
      const reviewCount = Number(reviewCountRaw)
      const shareCount = Number(shareCountRaw)

      return {
        id: String(row.id),
        name: String(row.name ?? 'Produit'),
        price,
        originalPrice,
        salePrice,
        image,
        images: image ? [image, ...images.filter((x: any) => typeof x === 'string' && x !== image)] : images,
        vendorId,
        categoryIds,
        inStock,
        stockCount,
        discount,
        createdAt: createdAt || undefined,
        totalSales: Number.isFinite(totalSales) && totalSales >= 0 ? totalSales : undefined,
        averageRating: Number.isFinite(averageRating) && averageRating >= 0 ? averageRating : undefined,
        reviewCount: Number.isFinite(reviewCount) && reviewCount >= 0 ? reviewCount : undefined,
        shareCount: Number.isFinite(shareCount) && shareCount >= 0 ? shareCount : undefined
      }
    })

    return NextResponse.json(
      { data: { items, count: items.length } },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0'
        }
      }
    )
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ data: { items: [], count: 0 }, error: message }, { status: 200 })
  }
}
