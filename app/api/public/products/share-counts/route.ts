import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

type ProductShareCounts = {
  total: number
  byPlatform: Record<string, number>
}

/**
 * GET /api/public/products/share-counts?productId=<uuid>
 * Retourne les compteurs de partages (total + par plateforme) depuis `product_shares`.
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const productId = String(url.searchParams.get('productId') ?? '').trim()

    if (!productId) {
      return NextResponse.json({ error: 'productId invalide.' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('product_shares')
      .select('platform')
      .eq('product_id', productId)
      .limit(5000)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const byPlatform: Record<string, number> = {}
    for (const row of data ?? []) {
      const platform = String((row as any)?.platform ?? '').trim().toLowerCase()
      if (!platform) continue
      byPlatform[platform] = (byPlatform[platform] || 0) + 1
    }

    const total = Object.values(byPlatform).reduce((sum, value) => sum + (Number(value) || 0), 0)

    const result: ProductShareCounts = {
      total,
      byPlatform
    }

    return NextResponse.json({ data: result }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
