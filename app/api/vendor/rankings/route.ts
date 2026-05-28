import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertVendor } from '@/app/api/vendor/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

/**
 * Parse le paramètre `range` en une valeur supportée.
 */
function parseRange(value: string | null): 'week' | 'month' | 'quarter' | 'year' {
  const v = String(value ?? '').trim().toLowerCase()
  if (v === 'week' || v === 'month' || v === 'quarter' || v === 'year') return v
  return 'month'
}

/**
 * Convertit une période en nombre de jours.
 */
function getDaysForRange(range: string): number {
  if (range === 'week') return 7
  if (range === 'month') return 31
  if (range === 'quarter') return 92
  if (range === 'year') return 366
  return 31
}

/**
 * GET /api/vendor/rankings
 * Retourne les classements (table public.rankings) du vendeur authentifié.
 */
export async function GET(request: NextRequest) {
  try {
    const vendorId = await assertVendor(request)
    const supabase = getSupabaseAdmin()

    const url = new URL(request.url)
    const range = parseRange(url.searchParams.get('range'))
    const days = getDaysForRange(range)
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('rankings')
      .select('*')
      .eq('user_id', vendorId)
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) {
      console.error('❌ GET /api/vendor/rankings failed:', error)
      return NextResponse.json({ error: 'Erreur lors de la récupération des classements.' }, { status: 500 })
    }

    return NextResponse.json({ data: data ?? [] }, { status: 200 })
  } catch (error) {
    console.error('❌ GET /api/vendor/rankings unexpected error:', error)
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const status = message.toLowerCase().includes('accès') ? 403 : message.toLowerCase().includes('token') ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
