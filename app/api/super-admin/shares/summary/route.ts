import { NextRequest, NextResponse } from 'next/server'

import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type SharesSummaryResponse = {
  totals: {
    shares: number
    interactions: number
    pointsFromShares: number
    pointsFromInteractions: number
    pointsTotal: number
  }
  byPlatform: Array<{ platform: string; shares: number; points: number }>
  byInteractionType: Array<{ type: string; count: number }>
}

function safeNumber(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

/**
 * GET /api/super-admin/shares/summary
 * Statistiques globales Super Admin pour Partages & Engagement (tous utilisateurs).
 * Filtres:
 * - start/end (ISO date)
 * - platform
 */
export async function GET(request: NextRequest) {
  try {
    await assertSuperAdmin(request)

    const url = new URL(request.url)
    const start = String(url.searchParams.get('start') ?? '').trim()
    const end = String(url.searchParams.get('end') ?? '').trim()
    const platform = String(url.searchParams.get('platform') ?? '').trim().toLowerCase()

    const supabase = getSupabaseAdmin()

    let sharesQuery = supabase
      .from('product_shares')
      .select('id, platform, points_earned, created_at')
      .order('created_at', { ascending: false })
      .limit(5000)

    if (start) sharesQuery = sharesQuery.gte('created_at', start)
    if (end) sharesQuery = sharesQuery.lte('created_at', end)
    if (platform) sharesQuery = sharesQuery.eq('platform', platform)

    const { data: shareRows, error: shareErr } = await sharesQuery
    if (shareErr) {
      return NextResponse.json({ data: null, error: shareErr.message }, { status: 500 })
    }

    const shares = shareRows ?? []
    const shareIds = shares.map((s: any) => String(s?.id ?? '').trim()).filter((id) => UUID_REGEX.test(id)).slice(0, 5000)

    const pointsFromShares = shares.reduce((acc, s: any) => acc + safeNumber(s?.points_earned), 0)

    const byPlatformMap = new Map<string, { shares: number; points: number }>()
    for (const s of shares) {
      const p = String((s as any)?.platform ?? '').trim().toLowerCase() || 'unknown'
      const entry = byPlatformMap.get(p) ?? { shares: 0, points: 0 }
      entry.shares += 1
      entry.points += safeNumber((s as any)?.points_earned)
      byPlatformMap.set(p, entry)
    }

    let interactions: any[] = []
    if (shareIds.length > 0) {
      const { data } = await supabase
        .from('share_interactions')
        .select('interaction_type, created_at, share_id')
        .in('share_id', shareIds)
        .limit(20000)
      interactions = data ?? []
    }

    const byTypeMap = new Map<string, number>()
    for (const i of interactions) {
      const t = String((i as any)?.interaction_type ?? '').trim().toLowerCase() || 'unknown'
      byTypeMap.set(t, (byTypeMap.get(t) ?? 0) + 1)
    }

    let pointsFromInteractions = 0
    if (shareIds.length > 0) {
      const { data: txRows } = await supabase
        .from('point_transactions')
        .select('points, type, reference_id')
        .in('reference_id', shareIds)
        .neq('type', 'share')
        .limit(20000)

      if (Array.isArray(txRows)) {
        pointsFromInteractions = txRows.reduce((acc, row: any) => acc + safeNumber(row?.points), 0)
      } else {
        // Fallback schéma historique.
        const { data: legacyRows } = await supabase
          .from('user_points_transactions')
          .select('points, type, reference_id')
          .in('reference_id', shareIds)
          .neq('type', 'share')
          .limit(20000)
        pointsFromInteractions = (legacyRows ?? []).reduce((acc: number, row: any) => acc + safeNumber(row?.points), 0)
      }
    }

    const response: SharesSummaryResponse = {
      totals: {
        shares: shares.length,
        interactions: interactions.length,
        pointsFromShares,
        pointsFromInteractions,
        pointsTotal: pointsFromShares + pointsFromInteractions
      },
      byPlatform: Array.from(byPlatformMap.entries())
        .map(([p, v]) => ({ platform: p, shares: v.shares, points: v.points }))
        .sort((a, b) => b.shares - a.shares),
      byInteractionType: Array.from(byTypeMap.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
    }

    return NextResponse.json(
      { data: response },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0'
        }
      }
    )
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    const status = message.toLowerCase().includes('accès') || message.toLowerCase().includes('token') ? 401 : 500
    return NextResponse.json({ data: null, error: message }, { status })
  }
}
