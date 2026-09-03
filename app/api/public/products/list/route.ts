import { NextRequest, NextResponse } from 'next/server'

import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

function resolveBoolean(value: unknown): boolean | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'boolean') return value
  if (value === 1 || value === '1' || value === 'true') return true
  if (value === 0 || value === '0' || value === 'false') return false
  return null
}

async function resolveShareStatsPolicy(supabase: ReturnType<typeof getSupabaseAdmin>): Promise<boolean | null> {
  try {
    const { data: settingsRow } = await supabase
      .from('super_admin_settings')
      .select('settings')
      .eq('scope', 'global')
      .maybeSingle()

    const settings = asObject((settingsRow as any)?.settings)
    const privacyPolicy = asObject((settings as any)?.privacyPolicy)
    const rule = asObject((privacyPolicy as any)?.shareStats)
    return resolveBoolean((rule as any)?.forceValue)
  } catch {
    return null
  }
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

  const saleCandidate =
    input.sale_price === null || input.sale_price === undefined ? NaN : Number(input.sale_price)
  const sale = Number.isFinite(saleCandidate) && saleCandidate > 0 && saleCandidate < regular ? saleCandidate : null

  return { price: regular, salePrice: sale, originalPrice: regular }
}

/**
 * Résout un user.id représentant le super-admin.
 * Utilisé comme fallback pour les produits vendus par la boutique (vendor_id null).
 */
async function resolveSuperAdminUserId(supabase: ReturnType<typeof getSupabaseAdmin>): Promise<string | null> {
  try {
    const { data } = await supabase
      .from('users')
      .select('id, role')
      .or('role.ilike.super_admin,role.ilike.superadmin,role.ilike.admin')
      .order('created_at', { ascending: true })
      .limit(1)

    const first = Array.isArray(data) ? data[0] : null
    const id = typeof (first as any)?.id === 'string' ? String((first as any).id).trim() : ''
    return id.length > 0 ? id : null
  } catch {
    return null
  }
}

/**
 * GET /api/public/products/list
 * Retourne une liste publique de produits (pour affichage home / catalogue).
 * - Exclut archived
 * - Priorise active, sinon montre aussi pending_review/inactive si demandé
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const limitRaw = url.searchParams.get('limit')
    const offsetRaw = url.searchParams.get('offset')
    const includeInactive = url.searchParams.get('includeInactive') === 'true'
    const idsRaw = url.searchParams.get('ids')

    const ids = String(idsRaw ?? '')
      .split(',')
      .map((x) => String(x).trim())
      .filter((x) => x.length > 0)
      .slice(0, 50)

    const limit = Math.min(Math.max(Number(limitRaw ?? 12) || 12, 1), 48)
    const offset = Math.max(Number(offsetRaw ?? 0) || 0, 0)

    const supabase = getSupabaseAdmin()

    const shareStatsForced = await resolveShareStatsPolicy(supabase)
    const includeShareStats = shareStatsForced === null ? true : shareStatsForced

    let query = supabase
      .from('user_products')
      .select(
        'id,name,price,sale_price,original_price,vendor_id,product_status,main_image,images,is_virtual,is_downloadable,created_at,stock_quantity,manage_stock,free_shipping,product_category_assignments(category_id),product_statistics(total_sales,average_rating,review_count)'
      )
      .neq('product_status', 'archived')
      .order('created_at', { ascending: false })

    if (ids.length > 0) {
      query = query.in('id', ids).limit(ids.length)
    } else {
      query = query.range(offset, offset + limit - 1)
    }

    if (!includeInactive) {
      query = query.eq('product_status', 'active')
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ data: { items: [], count: 0 }, warning: error.message }, { status: 200 })
    }

    const rows = (data ?? []) as any[]

    const productIds = rows
      .map((row: any) => String(row?.id ?? '').trim())
      .filter((id: string) => id.length > 0)

    const shareCountsByProductId = new Map<string, { total: number; byPlatform: Record<string, number> }>()
    if (includeShareStats && productIds.length > 0) {
      try {
        const { data: shareRows } = await supabase
          .from('product_shares')
          .select('product_id, platform')
          .in('product_id', productIds)
          .limit(5000)

        for (const row of shareRows ?? []) {
          const pid = String((row as any)?.product_id ?? '').trim()
          if (!pid) continue
          const platform = String((row as any)?.platform ?? '').trim().toLowerCase()
          if (!platform) continue

          const existing = shareCountsByProductId.get(pid) ?? { total: 0, byPlatform: {} }
          existing.byPlatform[platform] = (existing.byPlatform[platform] || 0) + 1
          existing.total += 1
          shareCountsByProductId.set(pid, existing)
        }
      } catch {
        // noop
      }
    }

    const superAdminUserId = await resolveSuperAdminUserId(supabase)

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

    const items = rows.map((row: any) => {
      const images = Array.isArray(row.images) ? row.images : []
      const image = row.main_image ?? images[0] ?? '/placeholder.svg'

      const createdAt = typeof row.created_at === 'string' ? String(row.created_at) : null

      const normalizedPrices = normalizePrices({
        price: row.price,
        sale_price: row.sale_price,
        original_price: row.original_price
      })

      const stockQuantity = row.stock_quantity === null || row.stock_quantity === undefined ? null : Number(row.stock_quantity)
      const manageStock = row.manage_stock === null || row.manage_stock === undefined ? null : Boolean(row.manage_stock)
      const inStock = manageStock ? (stockQuantity !== null && Number.isFinite(stockQuantity) ? stockQuantity > 0 : true) : true

      const categoryIds = Array.isArray(row?.product_category_assignments)
        ? row.product_category_assignments
            .map((x: any) => String(x?.category_id ?? '').trim())
            .filter((id: string) => id.length > 0)
        : []

      const rawVendorId = typeof row.vendor_id === 'string' ? String(row.vendor_id) : null
      const vendorId = rawVendorId ? (vendorUserIdByProfileId.get(rawVendorId) ?? rawVendorId) : null
      const vendorProfile = vendorId ? vendorProfileByVendorId.get(vendorId) : null
      const resolvedSellerName = vendorId ? String(vendorProfile?.name ?? '').trim() : 'Boutique'

      const pid = String(row?.id ?? '').trim()
      const shareStats = includeShareStats && pid ? shareCountsByProductId.get(pid) : null

      return {
        id: row.id,
        name: row.name ?? 'Produit',
        price: normalizedPrices.price,
        salePrice: normalizedPrices.salePrice,
        originalPrice: normalizedPrices.originalPrice,
        vendorId: vendorId ?? superAdminUserId,
        productStatus: row.product_status ?? null,
        image,
        images: image ? [image, ...images.filter((x: any) => typeof x === 'string' && x !== image)] : images,
        is_virtual: Boolean(row.is_virtual),
        is_downloadable: Boolean(row.is_downloadable),
        freeShipping: Boolean(row.free_shipping),
        categoryIds,
        sellerName: resolvedSellerName || 'Vendeur',
        sellerAvatar: vendorProfile?.avatar ?? '',
        createdAt,
        stockQuantity: Number.isFinite(stockQuantity) ? stockQuantity : null,
        manageStock: manageStock === null ? null : manageStock,
        inStock,
        shares: includeShareStats ? (shareStats?.total ?? 0) : 0,
        shareData: includeShareStats ? (shareStats?.byPlatform ?? {}) : {},
        totalSales: Number((row as any)?.product_statistics?.total_sales ?? 0) || 0,
        rating: Number((row as any)?.product_statistics?.average_rating ?? 0) || 0,
        reviews: Number((row as any)?.product_statistics?.review_count ?? 0) || 0
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
