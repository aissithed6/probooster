import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * GET /api/public/special-promotions
 * Retourne uniquement les promotions spéciales actives (is_active=true) et non expirées, sans cache.
 */
export async function GET() {
  try {
    const supabase = getSupabaseAdmin()

    const now = new Date()
    const nowIso = now.toISOString()

    const startOfToday = new Date()
    startOfToday.setUTCHours(0, 0, 0, 0)
    const startOfTodayIso = startOfToday.toISOString()

    const { data, error } = await supabase
      .from('special_promotions')
      .select('*')
      // Tolérance: certaines lignes existantes peuvent avoir is_active = NULL.
      // Côté client, on les considère actives par défaut tant qu'elles ne sont pas expirées.
      .or('is_active.eq.true,is_active.is.null')
      .gte('end_date', startOfTodayIso)
      .order('sort_order', { ascending: true })

    if (error) throw error

    const specialsRaw = (data ?? []) as any[]

    const specials = specialsRaw.filter((sp) => {
      const startRaw = sp?.start_date
      if (!startRaw) return true
      const start = new Date(startRaw)
      if (Number.isNaN(start.getTime())) return true
      return start <= now
    })

    // Anti-cumul: récupérer tous les produits déjà couverts par une promo classique active
    const { data: promos, error: promErr } = await supabase
      .from('promotions')
      .select('*')
      .eq('status', 'active')
      .lte('start_date', nowIso)
      .gte('end_date', nowIso)

    if (promErr) throw promErr

    const promotions = (promos ?? []) as any[]

    const classicActiveProductIds = new Set<string>()

    for (const promo of promotions) {
      const ids = new Set<string>()

      const explicitProductIds = Array.isArray(promo?.applicable_products) ? promo.applicable_products : []
      const categories = Array.isArray(promo?.applicable_categories) ? promo.applicable_categories : []
      const vendors = Array.isArray(promo?.applicable_vendors) ? promo.applicable_vendors : []

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

      ids.forEach((id) => classicActiveProductIds.add(id))
    }

    const promoToProductIds = new Map<string, Set<string>>()
    const allProductIds = new Set<string>()

    for (const sp of specials) {
      const ids = new Set<string>()

      const directProductIds = Array.isArray(sp?.applicable_products) ? sp.applicable_products : []
      for (const pid of directProductIds) {
        if (typeof pid === 'string' && pid) ids.add(pid)
      }

      const categories = Array.isArray(sp?.applicable_categories) ? sp.applicable_categories : []
      if (categories.length > 0) {
        const { data: catAssignments, error: catErr } = await supabase
          .from('product_category_assignments')
          .select('product_id')
          .in('category_id', categories)
        if (catErr) throw catErr
        for (const row of catAssignments || []) if ((row as any)?.product_id) ids.add((row as any).product_id)
      }

      const vendors = Array.isArray(sp?.applicable_vendors) ? sp.applicable_vendors : []
      if (vendors.length > 0) {
        if (directProductIds.length === 0 && categories.length === 0) {
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

      // Non-cumul: supprimer les produits qui ont déjà une promo classique active
      for (const pid of Array.from(ids)) {
        if (classicActiveProductIds.has(pid)) ids.delete(pid)
      }

      promoToProductIds.set(sp.id, ids)
      ids.forEach((id) => allProductIds.add(id))
    }

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
        const productId = (row as any)?.product_id
        const path = (row as any)?.path
        if (!productId || !path) continue
        const current = mediaMap.get(productId) ?? { images: [] }
        current.images.push(path)
        mediaMap.set(productId, current)
      }
    }

    const computeDiscount = (price: number, discountType: string, discountValue: number) => {
      if (discountType === 'percentage') return Math.max(0, Math.round(price * (1 - (discountValue || 0) / 100)))
      if (discountType === 'fixed') return Math.max(0, Math.round(price - (discountValue || 0)))
      return price
    }

    const responsePayload = specials.map((sp) => {
      const ids = promoToProductIds.get(sp.id) ?? new Set<string>()
      const products = Array.from(ids)
        .map((pid) => {
          const baseProd = productMap.get(pid)
          if (!baseProd) return null
          const media = mediaMap.get(pid)

          const prod = {
            ...baseProd,
            images: media?.images ?? []
          }

          const originalPrice = typeof (prod as any).price === 'number' ? (prod as any).price : Number((prod as any).price ?? 0) || 0
          const discountType = (sp?.discount_type as string) || 'percentage'
          const discountValue = Number(sp?.discount_value ?? 0) || 0
          const discountedPrice = computeDiscount(originalPrice, discountType, discountValue)

          return {
            ...prod,
            originalPrice,
            discountedPrice,
            hasFreeShipping: discountType === 'free_shipping',
            promoBadge: discountType === 'percentage'
              ? `-${discountValue}%`
              : discountType === 'fixed'
                ? 'Promo'
                : 'Livraison gratuite'
          }
        })
        .filter(Boolean)

      return {
        id: sp.id,
        title: sp.title,
        subtitle: sp.subtitle ?? null,
        description: sp.description ?? null,
        start_date: sp.start_date ?? null,
        end_date: sp.end_date,
        discount_type: sp.discount_type ?? null,
        discount_value: sp.discount_value ?? null,
        gradient_from: sp.gradient_from,
        gradient_to: sp.gradient_to,
        text_color: sp.text_color,
        products
      }
    })

    return NextResponse.json(responsePayload, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        Pragma: 'no-cache',
        Expires: '0'
      }
    })
  } catch (error) {
    console.error('GET /api/public/special-promotions failed:', error)
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
