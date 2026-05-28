import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'

/**
 * GET: Liste les rédemptions de récompenses (loyalty_reward_redemptions) pour suivi financier.
 * Query params: q, userId, rewardId, from, to, sort, order, page, pageSize, withCount
 * Rétrocompatibilité: si withCount != true, retourne un tableau.
 */
export async function GET(request: Request) {
  try {
    try {
      await assertSuperAdmin()
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : 'Accès refusé.' },
        { status: 401 }
      )
    }

    const supabase = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)

  const q = (searchParams.get('q') || '').toLowerCase()
  const userId = searchParams.get('userId') || ''
  const rewardId = searchParams.get('rewardId') || ''
  const from = searchParams.get('from') || ''
  const to = searchParams.get('to') || ''
  const sort = searchParams.get('sort') || 'created_at'
  const order = (searchParams.get('order') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc'
  const page = Math.max(parseInt(searchParams.get('page') || '1', 10) || 1, 1)
  const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '100', 10) || 100, 1), 1000)
  const withCount = (searchParams.get('withCount') || '').toLowerCase() === 'true'
  const withAggregates = (searchParams.get('withAggregates') || '').toLowerCase() === 'true'

  const sortMap: Record<string, string> = {
    date: 'created_at',
    created_at: 'created_at',
    points: 'points_spent'
  }
  const sortColumn = sortMap[sort] || 'created_at'

  let query = supabase
    .from('loyalty_reward_redemptions')
    .select('*', { count: withCount ? 'exact' : undefined })

  if (userId) {
    query = query.eq('user_id', userId)
  }
  if (rewardId) {
    query = query.eq('reward_id', rewardId)
  }
  if (from) {
    query = query.gte('created_at', from)
  }
  if (to) {
    query = query.lte('created_at', to)
  }
  if (q) {
    const isUuid = /^[0-9a-fA-F-]{36}$/.test(q)
    if (isUuid) {
      query = query.or(`reward_id.eq.${q},user_id.eq.${q}`)
    }
  }

  query = query.order(sortColumn, { ascending: order === 'asc' })

  const fromIdx = (page - 1) * pageSize
  const toIdx = fromIdx + pageSize - 1
  query = query.range(fromIdx, toIdx)

  const { data, error, count } = await query

  if (error) {
    if (withCount) {
      return NextResponse.json({ rows: [], total: 0 })
    }
    return NextResponse.json([])
  }

  const rows = (data ?? []).map((r: any) => ({
    id: r.id,
    userId: r.user_id,
    rewardId: r.reward_id,
    pointsSpent: Number(r.points_spent || 0),
    metadata: r.metadata ?? {},
    createdAt: r.created_at
  }))

  if (withCount) {
    let aggregates: { pointsSpent: number } | undefined
    if (withAggregates) {
      let agg = supabase
        .from('loyalty_reward_redemptions')
        .select('points_spent, user_id, reward_id')

      if (userId) {
        agg = agg.eq('user_id', userId)
      }
      if (rewardId) {
        agg = agg.eq('reward_id', rewardId)
      }
      if (from) {
        agg = agg.gte('created_at', from)
      }
      if (to) {
        agg = agg.lte('created_at', to)
      }
      if (q) {
        const isUuid = /^[0-9a-fA-F-]{36}$/.test(q)
        if (isUuid) {
          agg = agg.or(`reward_id.eq.${q},user_id.eq.${q}`)
        }
      }

      const { data: aggRows, error: aggErr } = await agg.limit(100000)
      if (!aggErr) {
        const sum = (aggRows ?? []).reduce((acc: number, r: any) => acc + Number(r.points_spent || 0), 0)
        aggregates = { pointsSpent: sum }
      } else {
        aggregates = { pointsSpent: 0 }
      }
    }
    return NextResponse.json({ rows, total: typeof count === 'number' ? count : rows.length, ...(aggregates ? { aggregates } : {}) })
  }
    return NextResponse.json(rows)
  } catch (e) {
    try {
      const { searchParams } = new URL(request.url)
      const withCount = (searchParams.get('withCount') || '').toLowerCase() === 'true'
      if (withCount) {
        return NextResponse.json({ rows: [], total: 0 })
      }
      return NextResponse.json([])
    } catch (_) {
      return NextResponse.json([])
    }
  }
}
