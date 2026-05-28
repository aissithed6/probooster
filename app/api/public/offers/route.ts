import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

interface PublicPromotion {
  id: string
  name: string
  description?: string | null
  type: 'coupon' | 'discount' | 'flash_sale' | 'bundle'
  status: 'draft' | 'active' | 'paused' | 'ended'
  start_date: string
  end_date: string
  discount_type: 'percentage' | 'fixed' | 'free_shipping'
  discount_value: number
  applicable_products: string[]
  applicable_categories?: string[]
  applicable_vendors?: string[]
  created_at: string
  updated_at: string
}

/**
 * GET /api/public/offers
 * Retourne des "offers" (produit + prix remisé) issus des promotions actives côté client.
 * Inclut un aperçu limité pour les promotions sans ciblage explicite ("tous produits").
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const productId = url.searchParams.get('productId')
    const categoryId = url.searchParams.get('categoryId')
    const vendorId = url.searchParams.get('vendorId')

    /**
     * Calcule le début de journée UTC pour des comparaisons robustes sur des colonnes date/datetime.
     */
    const startOfTodayUtcIso = () => {
      const d = new Date()
      d.setUTCHours(0, 0, 0, 0)
      return d.toISOString()
    }

    const nowIso = new Date().toISOString()
    const startOfTodayIso = startOfTodayUtcIso()
    const supabaseAdmin = getSupabaseAdmin()

    // 1) Promotions actives
    let query = supabaseAdmin
      .from('promotions')
      .select('*')
      .eq('status', 'active')
      .lte('start_date', nowIso)
      .gte('end_date', startOfTodayIso)
      .order('start_date', { ascending: false })

    // NB: On ne filtre pas ici par productId/categoryId car une promotion peut viser un vendor (tous ses produits)
    // ou une catégorie, et rester applicable au produit filtré. On applique les filtres plus bas, au niveau des offres.
    // NB: On ne filtre pas les promotions ici par vendorId, afin de ne pas exclure les promotions "globales".
    // Le filtrage vendorId est appliqué plus bas, au niveau des produits.

    const { data: promos, error: promErr } = await query
    if (promErr) throw promErr

    const promotions: PublicPromotion[] = (promos || []) as any

    // 2) Construire le mapping promotion -> produits (union produits explicites + par catégories + par vendeurs)
    const promoToProductIds = new Map<string, Set<string>>()
    const allProductIds = new Set<string>()

    for (const promo of promotions) {
      const ids = new Set<string>()

      const explicitProductIds = Array.isArray(promo.applicable_products) ? promo.applicable_products : []
      const categories = (promo as any).applicable_categories as string[] | undefined
      const vendorsRaw = (promo as any).applicable_vendors as string[] | undefined
      const vendors = Array.isArray(vendorsRaw)
        ? vendorsRaw.filter((v) => typeof v === 'string' && v.trim().length > 0 && v !== 'all')
        : undefined

      // a) Produits explicitement ciblés
      for (const pid of explicitProductIds) {
        if (typeof pid === 'string' && pid) ids.add(pid)
      }

      // b) Produits par catégories
      if (Array.isArray(categories) && categories.length > 0) {
        const { data: catAssignments, error: catErr } = await supabaseAdmin
          .from('product_category_assignments')
          .select('product_id')
          .in('category_id', categories)
        if (catErr) throw catErr
        for (const row of catAssignments || []) if ((row as any)?.product_id) ids.add((row as any).product_id)
      }

      // c) Produits par vendeurs

      if (Array.isArray(vendors) && vendors.length > 0) {
        // Si aucun produit/catégorie n'est précisé, alors le vendor est le ciblage principal (tous ses produits).
        if (explicitProductIds.length === 0 && (!Array.isArray(categories) || categories.length === 0)) {
          const { data: venProds, error: venErr } = await supabaseAdmin
            .from('user_products')
            .select('id')
            .in('vendor_id', vendors)
            .neq('product_status', 'archived')
          if (venErr) throw venErr
          for (const p of venProds || []) if ((p as any)?.id) ids.add((p as any).id)
        } else if (ids.size > 0) {
          // Sinon, le vendor est une restriction: on intersecte pour éviter d'élargir la promo à tous les produits du vendeur.
          const { data: filtered, error: filterErr } = await supabaseAdmin
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

      promoToProductIds.set(promo.id, ids)
      ids.forEach(id => allProductIds.add(id))
    }

    // 3) Récupérer les détails produits en un seul appel
    let productMap = new Map<string, any>()
    if (allProductIds.size > 0) {
      const { data: products, error: prodErr } = await supabaseAdmin
        .from('user_products')
        .select('id, name, price, vendor_id')
        .in('id', Array.from(allProductIds))
        .neq('product_status', 'archived')
      if (prodErr) throw prodErr
      for (const p of products || []) productMap.set(p.id, p)
    }

    // 3.1) Charger les médias principaux (fallback: premier média) pour l'affichage des offres
    const mediaMap = new Map<string, { images: any[] }>()
    if (allProductIds.size > 0) {
      const { data: mediaRows, error: mediaErr } = await supabaseAdmin
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

    // 4) Construire les cartes d'offres
    const computeDiscount = (price: number, discountType: PublicPromotion["discount_type"], discountValue: number) => {
      if (discountType === 'percentage') return Math.max(0, Math.round(price * (1 - (discountValue || 0) / 100)))
      if (discountType === 'fixed') return Math.max(0, Math.round(price - (discountValue || 0)))
      return price
    }

    let categoryProductIdSet: Set<string> | null = null
    if (categoryId && allProductIds.size > 0) {
      const { data: catRows, error: catErr } = await supabaseAdmin
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

    const offers = [] as any[]

    const GLOBAL_PRODUCTS_PREVIEW_LIMIT = 50

    for (const promo of promotions) {
      const productIdSet = promoToProductIds.get(promo.id) || new Set<string>()

      // Promotions "globales": aucun ciblage (produits/catégories/vendeurs) => aperçu limité de produits.
      if (productIdSet.size === 0) {
        let globalProductsQuery = supabaseAdmin
          .from('user_products')
          .select('id, name, price, vendor_id')
          .neq('product_status', 'archived')
          .order('created_at', { ascending: false })
          .limit(GLOBAL_PRODUCTS_PREVIEW_LIMIT)

        if (vendorId) {
          globalProductsQuery = globalProductsQuery.eq('vendor_id', vendorId)
        }

        const { data: globalProducts, error: globalErr } = await globalProductsQuery

        if (globalErr) throw globalErr

        const ids = new Set<string>()
        for (const p of globalProducts || []) {
          if ((p as any)?.id) ids.add((p as any).id)
          if ((p as any)?.id) allProductIds.add((p as any).id)
          productMap.set((p as any).id, p)
        }

        // Si on filtre par catégorie, intégrer ces nouveaux produits au set des produits de la catégorie.
        if (categoryId && ids.size > 0) {
          const { data: catRows, error: catErr } = await supabaseAdmin
            .from('product_category_assignments')
            .select('product_id')
            .eq('category_id', categoryId)
            .in('product_id', Array.from(ids))

          if (catErr) throw catErr

          if (!categoryProductIdSet) categoryProductIdSet = new Set<string>()
          for (const row of catRows || []) {
            const pid = (row as any)?.product_id
            if (pid) categoryProductIdSet.add(pid)
          }
        }

        // Charger les médias pour les produits ajoutés après le chargement initial.
        if (ids.size > 0) {
          const missingMediaProductIds = Array.from(ids).filter((id) => !mediaMap.has(id))
          if (missingMediaProductIds.length > 0) {
            const { data: extraMediaRows, error: extraMediaErr } = await supabaseAdmin
              .from('product_media')
              .select('product_id, path, position')
              .in('product_id', missingMediaProductIds)
              .order('position', { ascending: true })

            if (extraMediaErr) throw extraMediaErr

            for (const row of extraMediaRows || []) {
              const productId = (row as any)?.product_id
              const path = (row as any)?.path
              if (!productId || !path) continue
              const current = mediaMap.get(productId) ?? { images: [] }
              current.images.push(path)
              mediaMap.set(productId, current)
            }
          }
        }

        promoToProductIds.set(promo.id, ids)
      }

      const effectiveProductIdSet = promoToProductIds.get(promo.id) || new Set<string>()

      for (const pid of effectiveProductIdSet) {
        if (productId && pid !== productId) continue
        if (categoryId && categoryProductIdSet && !categoryProductIdSet.has(pid)) continue
        const baseProd = productMap.get(pid as string)
        const media = mediaMap.get(pid as string)
        const prod = baseProd
          ? {
              ...baseProd,
              images: media?.images ?? []
            }
          : null
        if (!prod) continue
        if (vendorId && (prod as any).vendor_id && (prod as any).vendor_id !== vendorId) continue
        const originalPrice = prod.price || 0
        const discountedPrice = computeDiscount(originalPrice, promo.discount_type, promo.discount_value)
        const promoBadge = promo.discount_type === 'percentage' ? `-${promo.discount_value}%` : promo.discount_type === 'fixed' ? 'Promo' : 'Livraison gratuite'
        offers.push({
          product: prod,
          originalPrice,
          discountedPrice,
          hasFreeShipping: promo.discount_type === 'free_shipping',
          promoBadge,
          promotionId: promo.id,
          promotionName: promo.name,
          promotionDescription: promo.description ?? null,
          discountType: promo.discount_type,
          discountValue: promo.discount_value,
          startDate: promo.start_date,
          endDate: promo.end_date
        })
      }
    }

    return NextResponse.json(offers, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    })
  } catch (error) {
    console.error('GET /public/offers failed:', error)
    return NextResponse.json([], {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    })
  }
}
