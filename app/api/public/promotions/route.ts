import { NextRequest, NextResponse } from 'next/server'

import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * GET /api/public/promotions
 * Liste les promotions actives visibles pour les clients. Filtres optionnels: productId, categoryId, vendorId
 * Retourne 200 avec [] en cas d'erreur pour éviter de casser le front.
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const productId = url.searchParams.get('productId')
    const categoryId = url.searchParams.get('categoryId')
    // vendorId est géré indirectement via /api/public/offers (filtrage au niveau des produits)
    // afin de ne pas exclure les promotions "globales".
    void url.searchParams.get('vendorId')

    /**
     * Début de journée UTC pour gérer correctement les colonnes date/datetime.
     */
    const startOfTodayUtcIso = () => {
      const d = new Date()
      d.setUTCHours(0, 0, 0, 0)
      return d.toISOString()
    }

    const nowIso = new Date().toISOString()
    const startOfTodayIso = startOfTodayUtcIso()
    const supabaseAdmin = getSupabaseAdmin()

    let query = supabaseAdmin
      .from('promotions')
      .select('*')
      .eq('status', 'active')
      .lte('start_date', nowIso)
      .gte('end_date', startOfTodayIso)
      .order('start_date', { ascending: false })

    if (productId) {
      query = query.filter('applicable_products', 'cs', JSON.stringify([productId]))
    }
    if (categoryId) {
      query = query.filter('applicable_categories', 'cs', JSON.stringify([categoryId]))
    }
    // NB: on évite de filtrer en SQL par vendorId ici pour ne pas exclure les promotions "globales".
    // Le filtrage sur les produits éligibles se fait dans /api/public/offers.

    const { data, error } = await query

    if (error) {
      console.error('GET /public/promotions error:', error)
      return NextResponse.json([], {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0'
        }
      })
    }

    return NextResponse.json(data ?? [], {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    })
  } catch (error) {
    console.error('GET /public/promotions failed:', error)
    return NextResponse.json([], {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    })
  }
}
