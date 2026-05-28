import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertVendor } from '@/app/api/vendor/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { isAnalyticsEnabled } from '@/app/api/_helpers/analytics-privacy'

export const dynamic = 'force-dynamic'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type SharesVendorSummary = {
  totals: {
    shares: number
    interactions: number
    pointsFromShares: number
    pointsFromInteractions: number
    pointsTotal: number
    uniqueCustomers: number
    uniqueProducts: number
  }
  byPlatform: Array<{ platform: string; shares: number; points: number }>
  byInteractionType: Array<{ type: string; count: number }>
  topCustomers: Array<{ userId: string; shares: number }>
  topProducts: Array<{ productId: string; shares: number }>
}

function safeNumber(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

/**
 * GET /api/vendor/shares/summary
 * Statistiques agrégées vendeur pour Partages & Engagement.
 * Filtres:
 * - start/end (ISO)
 * - platform
 */
export async function GET(request: NextRequest) {
  try {
    const vendorId = await assertVendor(request)
    const url = new URL(request.url)

    const start = String(url.searchParams.get('start') ?? '').trim()
    const end = String(url.searchParams.get('end') ?? '').trim()
    const platform = String(url.searchParams.get('platform') ?? '').trim().toLowerCase()

    const supabase = getSupabaseAdmin()

    const analyticsAllowed = await isAnalyticsEnabled({ supabase, userId: vendorId })
    if (!analyticsAllowed) {
      const empty: SharesVendorSummary = {
        totals: {
          shares: 0,
          interactions: 0,
          pointsFromShares: 0,
          pointsFromInteractions: 0,
          pointsTotal: 0,
          uniqueCustomers: 0,
          uniqueProducts: 0
        },
        byPlatform: [],
        byInteractionType: [],
        topCustomers: [],
        topProducts: []
      }
      return NextResponse.json({ data: empty }, { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } })
    }

    let sharesQuery = supabase
      .from('product_shares')
      .select('id, user_id, product_id, platform, points_earned, created_at')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false })
      .limit(5000)

    if (start) sharesQuery = sharesQuery.gte('created_at', start)
    if (end) sharesQuery = sharesQuery.lte('created_at', end)
    if (platform) sharesQuery = sharesQuery.eq('platform', platform)

    const { data: shareRows, error: shareErr } = await sharesQuery
    if (shareErr) {
      return NextResponse.json({ data: null, error: shareErr.message }, { status: 500 })
    }

    const shares = (shareRows ?? []) as any[]
    const shareIds = shares
      .map((s) => String(s?.id ?? '').trim())
      .filter((id) => UUID_REGEX.test(id))
      .slice(0, 5000)

    const pointsFromShares = shares.reduce((acc, s) => acc + safeNumber(s?.points_earned), 0)

    const uniqueCustomers = new Set(shares.map((s) => String(s?.user_id ?? '').trim()).filter((id) => UUID_REGEX.test(id))).size
    const uniqueProducts = new Set(shares.map((s) => String(s?.product_id ?? '').trim()).filter(Boolean)).size

    const byPlatformMap = new Map<string, { shares: number; points: number }>()
    const customerCountMap = new Map<string, number>()
    const productCountMap = new Map<string, number>()

    for (const s of shares) {
      const p = String(s?.platform ?? '').trim().toLowerCase() || 'unknown'
      const entry = byPlatformMap.get(p) ?? { shares: 0, points: 0 }
      entry.shares += 1
      entry.points += safeNumber(s?.points_earned)
      byPlatformMap.set(p, entry)

      const uid = String(s?.user_id ?? '').trim()
      if (UUID_REGEX.test(uid)) {
        customerCountMap.set(uid, (customerCountMap.get(uid) ?? 0) + 1)
      }

      const pid = String(s?.product_id ?? '').trim()
      if (pid) {
        productCountMap.set(pid, (productCountMap.get(pid) ?? 0) + 1)
      }
    }

    let interactions: any[] = []
    if (shareIds.length > 0) {
      const { data } = await supabase
        .from('share_interactions')
        .select('interaction_type, share_id')
        .in('share_id', shareIds)
        .limit(20000)
      interactions = data ?? []
    }

    const byTypeMap = new Map<string, number>()
    for (const i of interactions) {
      const t = String(i?.interaction_type ?? '').trim().toLowerCase() || 'unknown'
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
        const { data: legacyRows } = await supabase
          .from('user_points_transactions')
          .select('points, type, reference_id')
          .in('reference_id', shareIds)
          .neq('type', 'share')
          .limit(20000)
        pointsFromInteractions = (legacyRows ?? []).reduce((acc: number, row: any) => acc + safeNumber(row?.points), 0)
      }
    }

    const response: SharesVendorSummary = {
      totals: {
        shares: shares.length,
        interactions: interactions.length,
        pointsFromShares,
        pointsFromInteractions,
        pointsTotal: pointsFromShares + pointsFromInteractions,
        uniqueCustomers,
        uniqueProducts
      },
      byPlatform: Array.from(byPlatformMap.entries())
        .map(([p, v]) => ({ platform: p, shares: v.shares, points: v.points }))
        .sort((a, b) => b.shares - a.shares),
      byInteractionType: Array.from(byTypeMap.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count),
      topCustomers: Array.from(customerCountMap.entries())
        .map(([userId, sharesCount]) => ({ userId, shares: sharesCount }))
        .sort((a, b) => b.shares - a.shares)
        .slice(0, 5),
      topProducts: Array.from(productCountMap.entries())
        .map(([productId, sharesCount]) => ({ productId, shares: sharesCount }))
        .sort((a, b) => b.shares - a.shares)
        .slice(0, 5)
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
    const status = message.toLowerCase().includes('accès') ? 403 : message.toLowerCase().includes('token') ? 401 : 500
    return NextResponse.json({ data: null, error: message }, { status })
  }
}
