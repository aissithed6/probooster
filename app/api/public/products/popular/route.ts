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

type PublicPopularProduct = {
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
  shareCount: number
  viewCount: number
  chatCount: number
  popularityScore: number
  discount: number
  createdAt: string | null
}

function toNumber(value: unknown, fallback = 0): number {
  const n = typeof value === 'number' ? value : Number(value ?? NaN)
  return Number.isFinite(n) ? n : fallback
}

function normalizeStats(value: unknown): Record<string, any> | null {
  if (!value) return null
  if (Array.isArray(value)) {
    const first = value.length > 0 ? value[0] : null
    return first && typeof first === 'object' ? (first as any) : null
  }
  if (typeof value === 'object') return value as any
  return null
}

/**
 * Calcule un score simple (pondéré) pour classer les produits.
 * Les poids sont ajustables sans impacter le front.
 */
function computePopularityScore(metrics: {
  totalSales: number
  shareCount: number
  viewCount: number
  chatCount: number
}): number {
  const wSales = 3
  const wShares = 2
  const wViews = 1
  const wChats = 3

  return (
    wSales * Math.max(0, metrics.totalSales) +
    wShares * Math.max(0, metrics.shareCount) +
    wViews * Math.max(0, metrics.viewCount) +
    wChats * Math.max(0, metrics.chatCount)
  )
}

/**
 * GET /api/public/products/popular?limit=12&includeInactive=true
 * Retourne les produits populaires (score: ventes + partages + vues + chats) à partir des données réelles.
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
        'id,name,price,sale_price,original_price,vendor_id,product_status,main_image,images,created_at,stock_quantity,manage_stock,product_statistics(*)'
      )
      .neq('product_status', 'archived')
      .order('created_at', { ascending: false })
      .limit(250)

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
          .map((row: any) => (typeof row?.vendor_id === 'string' ? String(row.vendor_id).trim() : ''))
          .filter((id: string) => UUID_REGEX.test(id))
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

    const enriched = rows.map((row: any) => {
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

      const stats = normalizeStats((row as any)?.product_statistics)
      const totalSales = toNumber(stats?.total_sales ?? stats?.totalSales, 0)
      const shareCount = toNumber(stats?.share_count ?? stats?.shareCount, 0)
      const viewCount = toNumber(stats?.view_count ?? stats?.views_count ?? stats?.viewCount, 0)
      const chatCount = toNumber(stats?.chat_count ?? stats?.chatCount ?? stats?.conversation_count, 0)

      const popularityScore = computePopularityScore({ totalSales, shareCount, viewCount, chatCount })
      const discount =
        originalPrice > 0 && salePrice !== null && salePrice > 0 && salePrice < originalPrice
          ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
          : 0

      const item: PublicPopularProduct = {
        id: String(row.id ?? ''),
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
        shareCount,
        viewCount,
        chatCount,
        popularityScore,
        discount,
        createdAt
      }

      return item
    })

    enriched.sort((a, b) => {
      if (b.popularityScore !== a.popularityScore) return b.popularityScore - a.popularityScore
      if (b.totalSales !== a.totalSales) return b.totalSales - a.totalSales
      if (b.shareCount !== a.shareCount) return b.shareCount - a.shareCount
      return String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))
    })

    const items = enriched.slice(0, limit)

    return NextResponse.json(
      { data: { items, count: items.length } },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0'
        }
      }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    return NextResponse.json(
      { data: { items: [], count: 0 }, warning: message },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0'
        }
      }
    )
  }
}
