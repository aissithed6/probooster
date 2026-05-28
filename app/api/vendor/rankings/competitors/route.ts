import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertVendor } from '@/app/api/vendor/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

type CompetitorAnalysis = {
  competitorName: string
  currentRank: number
  previousRank: number
  rankChange: number
  performanceGap: number
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
}

/**
 * Parse le paramètre `range` en une valeur supportée.
 */
function parseRange(value: string | null): 'week' | 'month' | 'quarter' | 'year' {
  const v = String(value ?? '').trim().toLowerCase()
  if (v === 'week' || v === 'month' || v === 'quarter' || v === 'year') return v
  return 'month'
}

/**
 * Parse la limite de concurrents retournés.
 */
function parseLimit(value: string | null): number {
  const n = Number(value ?? NaN)
  if (!Number.isFinite(n)) return 5
  return Math.min(20, Math.max(1, Math.floor(n)))
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
 * Normalise une valeur numérique.
 */
function num(value: any): number {
  const n = Number(value ?? NaN)
  return Number.isFinite(n) ? n : 0
}

/**
 * Normalise une valeur string non vide.
 */
function str(value: any): string {
  const s = String(value ?? '').trim()
  return s.length > 0 ? s : 'N/A'
}

/**
 * Sélectionne un rang global (overall_rank / rank).
 */
function pickRank(row: any): number {
  const rank = num(row?.overall_rank ?? row?.overallRank ?? row?.rank)
  return rank
}

/**
 * Sélectionne un score de performance (performance / score).
 */
function pickPerformance(row: any): number {
  const perf = num(row?.performance ?? row?.score)
  return perf
}

/**
 * Sélectionne un nom de vendeur pour affichage.
 */
function pickName(row: any): string {
  return str(row?.vendor_name ?? row?.vendorName ?? row?.name ?? row?.vendor ?? row?.user_id)
}

/**
 * Compare vendeur vs concurrent et retourne des listes dynamiques (sans mock).
 */
function buildComparison(vendorRow: any, competitorRow: any) {
  const vendorSales = num(vendorRow?.sales_volume ?? vendorRow?.salesVolume)
  const vendorShares = num(vendorRow?.shares_count ?? vendorRow?.sharesCount)
  const vendorViews = num(vendorRow?.views_count ?? vendorRow?.viewsCount)
  const vendorRating = num(vendorRow?.rating)

  const compSales = num(competitorRow?.sales_volume ?? competitorRow?.salesVolume)
  const compShares = num(competitorRow?.shares_count ?? competitorRow?.sharesCount)
  const compViews = num(competitorRow?.views_count ?? competitorRow?.viewsCount)
  const compRating = num(competitorRow?.rating)

  const strengths: string[] = []
  const weaknesses: string[] = []
  const recommendations: string[] = []

  const pushIf = (arr: string[], cond: boolean, msg: string) => {
    if (cond) arr.push(msg)
  }

  pushIf(strengths, compShares > vendorShares, 'Partages supérieurs')
  pushIf(strengths, compViews > vendorViews, 'Visibilité (vues) supérieure')
  pushIf(strengths, compSales > vendorSales, 'Volume des ventes supérieur')
  pushIf(strengths, compRating > vendorRating, 'Meilleure note client')

  pushIf(weaknesses, compShares < vendorShares, 'Partages inférieurs')
  pushIf(weaknesses, compViews < vendorViews, 'Moins de vues')
  pushIf(weaknesses, compSales < vendorSales, 'Ventes inférieures')
  pushIf(weaknesses, compRating < vendorRating, 'Note client inférieure')

  if (compShares > vendorShares) recommendations.push('Renforcer la stratégie de partage (réseaux sociaux, incentives).')
  if (compViews > vendorViews) recommendations.push('Optimiser le SEO et les visuels pour augmenter les vues.')
  if (compSales > vendorSales) recommendations.push('Travailler l’offre (prix, promos, bundles) pour augmenter les ventes.')
  if (compRating > vendorRating) recommendations.push('Améliorer la satisfaction client (SAV, délais, qualité, retours).')

  return { strengths: strengths.slice(0, 4), weaknesses: weaknesses.slice(0, 4), recommendations: recommendations.slice(0, 4) }
}

/**
 * GET /api/vendor/rankings/competitors
 * Retourne une analyse des concurrents (même catégorie) à partir de la table `public.rankings`.
 */
export async function GET(request: NextRequest) {
  try {
    const vendorId = await assertVendor(request)
    const supabase = getSupabaseAdmin()

    const url = new URL(request.url)
    const range = parseRange(url.searchParams.get('range'))
    const limit = parseLimit(url.searchParams.get('limit'))
    const days = getDaysForRange(range)
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('rankings')
      .select('*')
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false })
      .limit(5000)

    if (error) {
      console.error('❌ GET /api/vendor/rankings/competitors failed:', error)
      return NextResponse.json({ error: 'Erreur lors de la récupération de la concurrence.' }, { status: 500 })
    }

    const rows = Array.isArray(data) ? data : []

    // latest + prev par vendor
    const latestByVendor = new Map<string, any>()
    const prevByVendor = new Map<string, any>()

    for (const row of rows) {
      const uid = String((row as any)?.user_id ?? (row as any)?.userId ?? '')
      if (!uid) continue
      if (!latestByVendor.has(uid)) {
        latestByVendor.set(uid, row)
      } else if (!prevByVendor.has(uid)) {
        prevByVendor.set(uid, row)
      }
    }

    const vendorRow = latestByVendor.get(vendorId)
    if (!vendorRow) {
      return NextResponse.json({ data: [], meta: { range, limit, cutoff, note: 'Aucune donnée vendeur dans rankings.' } }, { status: 200 })
    }

    const vendorCategory = str((vendorRow as any)?.vendor_category ?? (vendorRow as any)?.vendorCategory ?? (vendorRow as any)?.category)
    const vendorPerf = pickPerformance(vendorRow)

    const candidates = Array.from(latestByVendor.values())
      .filter((r) => {
        const uid = String((r as any)?.user_id ?? (r as any)?.userId ?? '')
        if (!uid || uid === vendorId) return false
        const cat = str((r as any)?.vendor_category ?? (r as any)?.vendorCategory ?? (r as any)?.category)
        return cat === vendorCategory
      })
      .sort((a, b) => {
        const ra = pickRank(a)
        const rb = pickRank(b)
        if (ra === 0 && rb === 0) return 0
        if (ra === 0) return 1
        if (rb === 0) return -1
        return ra - rb
      })
      .slice(0, limit)

    const results: CompetitorAnalysis[] = candidates.map((r) => {
      const uid = String((r as any)?.user_id ?? (r as any)?.userId ?? '')
      const currentRank = pickRank(r)
      const explicitPrev = num((r as any)?.previous_rank ?? (r as any)?.previousRank)
      const prevRow = prevByVendor.get(uid)
      const previousRank = explicitPrev > 0 ? explicitPrev : prevRow ? pickRank(prevRow) : 0

      const rankChange = previousRank > 0 && currentRank > 0 ? previousRank - currentRank : 0
      const perfGap = Number((pickPerformance(r) - vendorPerf).toFixed(1))

      const cmp = buildComparison(vendorRow, r)

      return {
        competitorName: pickName(r),
        currentRank,
        previousRank,
        rankChange,
        performanceGap: perfGap,
        strengths: cmp.strengths,
        weaknesses: cmp.weaknesses,
        recommendations: cmp.recommendations
      }
    })

    return NextResponse.json(
      { data: results, meta: { range, limit, cutoff, category: vendorCategory } },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ GET /api/vendor/rankings/competitors unexpected error:', error)
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const status = message.toLowerCase().includes('accès') ? 403 : message.toLowerCase().includes('token') ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
