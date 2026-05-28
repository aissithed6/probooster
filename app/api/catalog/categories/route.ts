import { NextResponse } from 'next/server'

import { getSupabaseAdmin } from '@/lib/supabase'
import type { ProductCategoryRecord } from '@/lib/types/product-category'

const CATEGORY_COLUMNS = [
  'id',
  'parent_id',
  'name',
  'slug',
  'description',
  'icon',
  'is_active',
  'metadata',
  'created_at',
  'updated_at'
] as const

const mapRowToRecord = (row: Record<string, any>): ProductCategoryRecord => ({
  id: row.id,
  parent_id: row.parent_id,
  name: row.name,
  slug: row.slug,
  description: row.description,
  icon: row.icon,
  is_active: Boolean(row.is_active),
  metadata: row.metadata,
  created_at: row.created_at,
  updated_at: row.updated_at
})

/**
 * Retourne les catégories actives pour l’affichage catalogue (accès public/vendor).
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')?.trim() ?? ''

    const supabase = getSupabaseAdmin()
    let query = supabase
      .from('product_categories')
      .select(CATEGORY_COLUMNS.join(','))
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (search.length > 0) {
      query = query.ilike('name', `%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const items = (data ?? []).map(mapRowToRecord)
    return NextResponse.json({ data: { items } }, { status: 200 })
  } catch (error) {
    console.error('❌ GET /api/catalog/categories failed', error)
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
