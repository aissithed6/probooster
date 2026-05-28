import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertVendor } from '@/app/api/vendor/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

type CategoryPerformance = {
  category: string
  currentRank: number
  previousRank: number
  improvement: number
  totalVendors: number
  marketShare: number
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
 * Détermine le rang à utiliser (priorité au category_rank si présent).
 */
function pickRank(row: any): number {
  const rank = num(row?.category_rank ?? row?.categoryRank)
  if (rank > 0) return rank
  return num(row?.overall_rank ?? row?.overallRank ?? row?.rank)
}

/**
 * GET /api/vendor/rankings/categories
 * Retourne la performance du vendeur par catégorie à partir de la table `public.rankings`.
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
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false })
      .limit(5000)

    if (error) {
      console.error('❌ GET /api/vendor/rankings/categories failed:', error)
      return NextResponse.json({ error: 'Erreur lors de la récupération des classements par catégorie.' }, { status: 500 })
    }

    const rows = Array.isArray(data) ? data : []

    // latest + previous par vendor_id + category
    const latestByKey = new Map<string, any>()
    const prevByKey = new Map<string, any>()

    for (const row of rows) {
      const uid = String((row as any)?.user_id ?? (row as any)?.userId ?? '')
      if (!uid) continue
      const category = str((row as any)?.vendor_category ?? (row as any)?.vendorCategory ?? (row as any)?.category)
      const key = `${uid}::${category}`

      if (!latestByKey.has(key)) {
        latestByKey.set(key, row)
      } else if (!prevByKey.has(key)) {
        prevByKey.set(key, row)
      }
    }

    const categoriesOfVendor = new Set<string>()
    for (const [key, row] of latestByKey) {
      if (key.startsWith(`${vendorId}::`)) {
        categoriesOfVendor.add(str((row as any)?.vendor_category ?? (row as any)?.vendorCategory ?? (row as any)?.category))
      }
    }

    const results: CategoryPerformance[] = []

    for (const category of categoriesOfVendor) {
      const vendorKey = `${vendorId}::${category}`
      const vendorRow = latestByKey.get(vendorKey)
      if (!vendorRow) continue

      // Comptage des vendeurs (unique user_id) ayant un latest row dans cette catégorie
      let totalVendors = 0
      let totalSalesVolume = 0

      for (const [key, row] of latestByKey) {
        const parts = key.split('::')
        const rowCategory = parts[1] ?? ''
        if (rowCategory !== category) continue
        totalVendors += 1
        totalSalesVolume += num((row as any)?.sales_volume ?? (row as any)?.salesVolume)
      }

      const currentRank = pickRank(vendorRow)

      const explicitPrev = num((vendorRow as any)?.previous_rank ?? (vendorRow as any)?.previousRank)
      const prevRow = prevByKey.get(vendorKey)
      const previousRank = explicitPrev > 0 ? explicitPrev : prevRow ? pickRank(prevRow) : 0

      const improvement = previousRank > 0 && currentRank > 0 ? previousRank - currentRank : 0

      const vendorSales = num((vendorRow as any)?.sales_volume ?? (vendorRow as any)?.salesVolume)
      const marketShare = totalSalesVolume > 0 ? Number(((vendorSales / totalSalesVolume) * 100).toFixed(1)) : 0

      results.push({
        category,
        currentRank,
        previousRank,
        improvement,
        totalVendors,
        marketShare
      })
    }

    return NextResponse.json({ data: results, meta: { range, cutoff } }, { status: 200 })
  } catch (error) {
    console.error('❌ GET /api/vendor/rankings/categories unexpected error:', error)
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const status = message.toLowerCase().includes('accès') ? 403 : message.toLowerCase().includes('token') ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
