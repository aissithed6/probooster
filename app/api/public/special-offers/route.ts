import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

interface SpecialPromotionRow {
  id: string
  title?: string | null
  description?: string | null
  start_date?: string | null
  end_date?: string | null
  discount_type?: 'percentage' | 'fixed' | 'free_shipping' | string | null
  discount_value?: number | null
  applicable_products?: string[] | null
  applicable_categories?: string[] | null
  applicable_vendors?: string[] | null
  is_active?: boolean | null
}

/**
 * GET /api/public/special-offers
 * Retourne les offres (prix remisé + prix original) issues des promotions spéciales actives.
 * Règle non-cumul: si une promotion classique est déjà active sur un produit, cet endpoint ne retourne rien pour ce produit.
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const productId = url.searchParams.get('productId')
    const categoryId = url.searchParams.get('categoryId')
    const vendorId = url.searchParams.get('vendorId')

    const now = new Date()
    const nowIso = now.toISOString()

    const supabase = getSupabaseAdmin()

    // NB: on évite de filtrer par start_date en SQL pour rester compatible si la migration n'est pas encore appliquée.
    const { data, error } = await supabase
      .from('special_promotions')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) throw error

    const rows: SpecialPromotionRow[] = (Array.isArray(data) ? data : []) as any

    const activeSpecials = rows.filter((sp) => {
      const end = sp?.end_date ? new Date(sp.end_date) : null
      if (!end || Number.isNaN(end.getTime())) return false
      if (end < now) return false

      const startRaw = sp?.start_date
      if (!startRaw) return true
      const start = new Date(startRaw)
      if (Number.isNaN(start.getTime())) return true
      return start <= now
    })

    const promoToProductIds = new Map<string, Set<string>>()
    const allProductIds = new Set<string>()

    for (const sp of activeSpecials) {
      const ids = new Set<string>()

      const explicitProductIds = Array.isArray(sp?.applicable_products) ? sp.applicable_products : []
      const categories = Array.isArray(sp?.applicable_categories) ? sp.applicable_categories : []
      const vendors = Array.isArray(sp?.applicable_vendors) ? sp.applicable_vendors : []

      for (const pid of explicitProductIds) {
        if (typeof pid === 'string' && pid) ids.add(pid)
      }

      if (categories.length > 0) {
        const { data: catAssignments, error: catErr } = await supabase
          .from('product_category_assignments')
          .select('product_id')
          .in('category_id', categories)
        if (catErr) throw catErr
        for (const row of catAssignments || []) if ((row as any)?.product_id) ids.add((row as any).product_id)
      }

      if (vendors.length > 0) {
        if (explicitProductIds.length === 0 && categories.length === 0) {
          const { data: venProds, error: venErr } = await supabase
            .from('user_products')
            .select('id')
            .in('vendor_id', vendors)
            .neq('product_status', 'archived')
          if (venErr) throw venErr
          for (const p of venProds || []) if ((p as any)?.id) ids.add((p as any).id)
        } else if (ids.size > 0) {
          const { data: filtered, error: filterErr } = await supabase
            .from('user_products')
            .select('id')
            .in('id', Array.from(ids))
            .in('vendor_id', vendors)
            .neq('product_status', 'archived')
          if (filterErr) throw filterErr

          ids.clear()
          for (const p of filtered || []) if ((p as any)?.id) ids.add((p as any).id)
        }
      }

      if (productId) {
        if (ids.has(productId)) {
          ids.clear()
          ids.add(productId)
        } else {
          ids.clear()
        }
      }

      promoToProductIds.set(sp.id, ids)
      ids.forEach((id) => allProductIds.add(id))
    }

    // Anti-cumul: récupérer uniquement les produits (parmi allProductIds) déjà couverts par une promo classique active
    const { data: promos, error: promErr } = await supabase
      .from('promotions')
      .select('*')
      .eq('status', 'active')
      .lte('start_date', nowIso)
      .gte('end_date', nowIso)

    if (promErr) throw promErr

    const promotions = (promos ?? []) as any[]
    const classicActiveProductIds = new Set<string>()

    if (allProductIds.size > 0) {
      for (const promo of promotions) {
        const ids = new Set<string>()

        const explicitProductIds = Array.isArray(promo?.applicable_products) ? promo.applicable_products : []
        const categories = Array.isArray(promo?.applicable_categories) ? promo.applicable_categories : []
        const vendors = Array.isArray(promo?.applicable_vendors) ? promo.applicable_vendors : []

        for (const pid of explicitProductIds) {
          if (typeof pid === 'string' && pid && allProductIds.has(pid)) ids.add(pid)
        }

        if (categories.length > 0) {
          const { data: catAssignments, error: catErr } = await supabase
            .from('product_category_assignments')
            .select('product_id')
            .in('category_id', categories)
            .in('product_id', Array.from(allProductIds))

          if (catErr) throw catErr
          for (const row of catAssignments || []) if ((row as any)?.product_id) ids.add((row as any).product_id)
        }

        if (vendors.length > 0) {
          if (explicitProductIds.length === 0 && categories.length === 0) {
            const { data: venProds, error: venErr } = await supabase
              .from('user_products')
              .select('id')
              .in('vendor_id', vendors)
              .in('id', Array.from(allProductIds))
              .neq('product_status', 'archived')
            if (venErr) throw venErr
            for (const p of venProds || []) if ((p as any)?.id) ids.add((p as any).id)
          } else if (ids.size > 0) {
            const { data: filtered, error: filterErr } = await supabase
              .from('user_products')
              .select('id')
              .in('id', Array.from(ids))
              .in('vendor_id', vendors)
              .neq('product_status', 'archived')
            if (filterErr) throw filterErr

            ids.clear()
            for (const p of filtered || []) if ((p as any)?.id) ids.add((p as any).id)
          }
        }

        ids.forEach((id) => classicActiveProductIds.add(id))
      }
    }

    // Filtrer les produits de specials touchés par une promo classique
    if (classicActiveProductIds.size > 0) {
      for (const [spId, ids] of promoToProductIds.entries()) {
        for (const pid of Array.from(ids)) {
          if (classicActiveProductIds.has(pid)) ids.delete(pid)
        }
        promoToProductIds.set(spId, ids)
      }
    }

    // Filtrage par productId / categoryId / vendorId (comme /offers)
    let categoryProductIdSet: Set<string> | null = null
    if (categoryId && allProductIds.size > 0) {
      const { data: catRows, error: catErr } = await supabase
        .from('product_category_assignments')
        .select('product_id')
        .eq('category_id', categoryId)
        .in('product_id', Array.from(allProductIds))
      if (catErr) throw catErr
      categoryProductIdSet = new Set<string>()
      for (const row of catRows || []) {
        const pid = (row as any)?.product_id
        if (pid) categoryProductIdSet.add(pid)
      }
    }

    let allowedVendorProductIds: Set<string> | null = null
    if (vendorId && allProductIds.size > 0) {
      const { data: rows, error: venErr } = await supabase
        .from('user_products')
        .select('id')
        .eq('vendor_id', vendorId)
        .in('id', Array.from(allProductIds))
        .neq('product_status', 'archived')
      if (venErr) throw venErr
      allowedVendorProductIds = new Set<string>()
      for (const row of rows || []) if ((row as any)?.id) allowedVendorProductIds.add((row as any).id)
    }

    // Produits
    let productMap = new Map<string, any>()
    if (allProductIds.size > 0) {
      const { data: products, error: prodErr } = await supabase
        .from('user_products')
        .select('id, name, price')
        .in('id', Array.from(allProductIds))
        .neq('product_status', 'archived')
      if (prodErr) throw prodErr
      for (const p of products || []) productMap.set((p as any).id, p)
    }

    const mediaMap = new Map<string, { images: any[] }>()
    if (allProductIds.size > 0) {
      const { data: mediaRows, error: mediaErr } = await supabase
        .from('product_media')
        .select('product_id, path, position')
        .in('product_id', Array.from(allProductIds))
        .order('position', { ascending: true })

      if (mediaErr) throw mediaErr

      for (const row of mediaRows || []) {
        const pid = (row as any)?.product_id
        const path = (row as any)?.path
        if (!pid || !path) continue
        const current = mediaMap.get(pid) ?? { images: [] }
        current.images.push(path)
        mediaMap.set(pid, current)
      }
    }

    const computeDiscount = (price: number, discountType: string, discountValue: number) => {
      if (discountType === 'percentage') return Math.max(0, Math.round(price * (1 - (discountValue || 0) / 100)))
      if (discountType === 'fixed') return Math.max(0, Math.round(price - (discountValue || 0)))
      return price
    }

    const offers: any[] = []

    for (const sp of activeSpecials) {
      const productIdSet = promoToProductIds.get(sp.id) || new Set<string>()
      const discountType = (sp.discount_type as string) || 'percentage'
      const discountValue = Number(sp.discount_value ?? 0) || 0

      for (const pid of productIdSet) {
        if (productId && pid !== productId) continue
        if (categoryId && categoryProductIdSet && !categoryProductIdSet.has(pid)) continue
        if (vendorId && allowedVendorProductIds && !allowedVendorProductIds.has(pid)) continue

        const baseProd = productMap.get(pid)
        if (!baseProd) continue

        const media = mediaMap.get(pid)
        const prod = {
          ...baseProd,
          images: media?.images ?? []
        }

        const originalPrice = typeof (prod as any).price === 'number' ? (prod as any).price : Number((prod as any).price ?? 0) || 0
        const discountedPrice = computeDiscount(originalPrice, discountType, discountValue)

        const promoBadge = discountType === 'percentage'
          ? `-${discountValue}%`
          : discountType === 'fixed'
            ? 'Promo'
            : 'Livraison gratuite'

        offers.push({
          product: prod,
          originalPrice,
          discountedPrice,
          hasFreeShipping: discountType === 'free_shipping',
          promoBadge,
          promotionId: sp.id,
          promotionName: sp.title ?? 'Promotion spéciale',
          promotionDescription: sp.description ?? null,
          discountType,
          discountValue,
          startDate: sp.start_date ?? null,
          endDate: sp.end_date ?? null,
          source: 'special'
        })
      }
    }

    return NextResponse.json(offers, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        Pragma: 'no-cache',
        Expires: '0'
      }
    })
  } catch (error) {
    console.error('GET /api/public/special-offers failed:', error)
    return NextResponse.json([], {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        Pragma: 'no-cache',
        Expires: '0'
      }
    })
  }
}
