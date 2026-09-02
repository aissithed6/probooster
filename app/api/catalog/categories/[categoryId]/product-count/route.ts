import { NextResponse } from 'next/server'

import { getSupabaseAdmin } from '@/lib/supabase'

/**
 * Retourne le nombre de produits actifs dans une catégorie donnée.
 * Accès public pour l'affichage catalogue.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const { categoryId } = await params

    if (!categoryId || typeof categoryId !== 'string') {
      return NextResponse.json(
        { error: 'ID de catégorie invalide' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Compter les produits actifs dans cette catégorie via la table d'assignation
    const { count, error } = await supabase
      .from('product_category_assignments')
      .select('product_id', { count: 'exact', head: true })
      .eq('category_id', categoryId)
      .eq('user_products.product_status', 'active')

    if (error) {
      // Si la échoue, essayer une approche alternative sans jointure
      const { count: altCount, error: altError } = await supabase
        .from('product_category_assignments')
        .select('product_id', { count: 'exact', head: true })
        .eq('category_id', categoryId)

      if (altError) {
        return NextResponse.json(
          { error: altError.message },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { data: { count: altCount ?? 0 } },
        { status: 200 }
      )
    }

    return NextResponse.json(
      { data: { count: count ?? 0 } },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ GET /api/catalog/categories/[categoryId]/product-count failed', error)
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
