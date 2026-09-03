import { NextRequest, NextResponse } from 'next/server'

import { getSupabaseAdmin } from '../../../../../lib/supabase'

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

type PublicBestSellerProduct = {
  id: string
  name: string
  price: number
  originalPrice: number
  salePrice: number | null
  image: string
  images: string[]
  vendorId: string | null
  sellerName: string
  sellerAvatar: string
  inStock: boolean
  stockQuantity: number | null
  manageStock: boolean | null
  totalSales: number
  rating: number
  reviews: number
  discount: number
  createdAt: string | null
}

/**
 * GET /api/public/products/best-sellers?limit=12&includeInactive=true
 * Retourne une liste publique de produits triés par ventes réelles (product_statistics.total_sales).
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const limitRaw = url.searchParams.get('limit')
    const includeInactive = url.searchParams.get('includeInactive') === 'true'

    const limit = Math.min(Math.max(Number(limitRaw ?? 12) || 12, 1), 48)

    const supabase = getSupabaseAdmin()

    let query = supabase
      .from('user_products')
      .select(
        'id,name,price,sale_price,original_price,vendor_id,product_status,main_image,images,created_at,stock_quantity,manage_stock,product_statistics(total_sales,average_rating,review_count)'
      )
      .neq('product_status', 'archived')
      .order('total_sales', { ascending: false, nullsFirst: false, referencedTable: 'product_statistics' } as any)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (!includeInactive) {
      query = query.eq('product_status', 'active')
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ data: { items: [], count: 0 }, warning: error.message }, { status: 200 })
    }

    const rows = (data ?? []) as any[]

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

    const vendorProfileByVendorId = new Map<string, { name: string; avatar: string }>()
    const vendorUserIdByProfileId = new Map<string, string>()
    ;(vendorProfiles ?? []).forEach((profile: any) => {
      const profileId = typeof profile?.id === 'string' ? String(profile.id) : ''
      const userId = typeof profile?.user_id === 'string' ? String(profile.user_id) : ''
      const first = typeof profile?.first_name === 'string' ? profile.first_name : ''
      const last = typeof profile?.last_name === 'string' ? profile.last_name : ''
      const name = `${first} ${last}`.trim()
      const avatar = typeof profile?.avatar_url === 'string' ? profile.avatar_url : ''
      if (userId) vendorProfileByVendorId.set(userId, { name, avatar })
      if (profileId) vendorProfileByVendorId.set(profileId, { name, avatar })
      if (profileId && userId) vendorUserIdByProfileId.set(profileId, userId)
    })

    const items: PublicBestSellerProduct[] = rows.map((row: any) => {
      const images = Array.isArray(row.images) ? row.images : []
      const image = String(row.main_image ?? images[0] ?? '/placeholder.svg')

      const createdAt = typeof row.created_at === 'string' ? String(row.created_at) : null

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

      const rawVendorId = typeof row.vendor_id === 'string' ? String(row.vendor_id) : null
      const vendorId = rawVendorId ? (vendorUserIdByProfileId.get(rawVendorId) ?? rawVendorId) : null
      const vendorProfile = vendorId ? vendorProfileByVendorId.get(vendorId) : null
      const sellerName = vendorId ? String(vendorProfile?.name ?? '').trim() : 'Boutique'

      const totalSalesRaw = (row as any)?.product_statistics?.total_sales
      const totalSales = Number(totalSalesRaw ?? 0) || 0

      const discount =
        originalPrice > 0 && salePrice !== null && salePrice > 0 && salePrice < originalPrice
          ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
          : 0

      return {
        id: String(row.id),
        name: String(row.name ?? 'Produit'),
        price,
        originalPrice,
        salePrice,
        image,
        images: image ? [image, ...images.filter((x: any) => typeof x === 'string' && x !== image)] : images,
        vendorId,
        sellerName: sellerName || 'Vendeur',
        sellerAvatar: vendorProfile?.avatar ?? '',
        inStock,
        stockQuantity: stockCount,
        manageStock,
        totalSales,
        rating: Number((row as any)?.product_statistics?.average_rating ?? 0) || 0,
        reviews: Number((row as any)?.product_statistics?.review_count ?? 0) || 0,
        discount,
        createdAt
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
