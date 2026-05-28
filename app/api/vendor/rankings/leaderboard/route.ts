import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertVendor } from '@/app/api/vendor/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

type Metric = 'overall' | 'sales' | 'shares' | 'views' | 'rating' | 'performance'

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

function parseMetric(value: string | null): Metric {
  const v = String(value ?? '').trim().toLowerCase()
  if (v === 'sales') return 'sales'
  if (v === 'shares') return 'shares'
  if (v === 'views') return 'views'
  if (v === 'rating') return 'rating'
  if (v === 'performance') return 'performance'
  return 'overall'
}

function parseLimit(value: string | null): number {
  const n = Number(value ?? NaN)
  if (!Number.isFinite(n)) return 10
  return Math.min(100, Math.max(1, Math.floor(n)))
}

/**
 * GET /api/vendor/rankings/leaderboard?metric=overall|sales|shares|views&limit=10
 * Retourne un leaderboard (top N) basé sur la table public.rankings.
 * NB: la structure exacte de la table peut varier selon la DB; on tente plusieurs colonnes.
 */
export async function GET(request: NextRequest) {
  try {
    await assertVendor(request)
    const supabase = getSupabaseAdmin()

    const url = new URL(request.url)
    const metric = parseMetric(url.searchParams.get('metric'))
    const limit = parseLimit(url.searchParams.get('limit'))
    const range = parseRange(url.searchParams.get('range'))
    const cutoff = new Date(Date.now() - getDaysForRange(range) * 24 * 60 * 60 * 1000).toISOString()

    const orderCandidates: string[] = (() => {
      if (metric === 'sales') return ['sales_rank', 'salesRank', 'sales_volume', 'salesVolume']
      if (metric === 'shares') return ['shares_rank', 'sharesRank', 'shares_count', 'sharesCount']
      if (metric === 'views') return ['views_rank', 'viewsRank', 'views_count', 'viewsCount']
      if (metric === 'rating') return ['rating']
      if (metric === 'performance') return ['performance', 'score']
      return ['overall_rank', 'overallRank', 'rank', 'score']
    })()

    let lastError: any = null

    for (const col of orderCandidates) {
      const ascending = col.includes('rank') || col.includes('Rank')

      const { data, error } = await supabase
        .from('rankings')
        .select('*')
        .gte('created_at', cutoff)
        .order(col as any, { ascending })
        .limit(limit)

      if (!error) {
        return NextResponse.json({ data: data ?? [], meta: { metric, limit, orderedBy: col } }, { status: 200 })
      }

      lastError = error
    }

    console.error('❌ GET /api/vendor/rankings/leaderboard failed:', lastError)
    return NextResponse.json(
      {
        error: 'Erreur lors de la récupération du leaderboard.',
        details: String(lastError?.message ?? ''),
        hint:
          "Vérifie que la table public.rankings contient des colonnes de tri (ex: overall_rank, sales_rank, shares_rank, views_rank, score)."
      },
      { status: 500 }
    )
  } catch (error) {
    console.error('❌ GET /api/vendor/rankings/leaderboard unexpected error:', error)
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const status = message.toLowerCase().includes('accès') ? 403 : message.toLowerCase().includes('token') ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
