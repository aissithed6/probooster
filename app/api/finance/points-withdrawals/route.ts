import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'

/**
 * GET: Liste les demandes de retrait de points pour suivi financier.
 * Query params supportés: q, status, userId, from, to, sort, order, page, pageSize, withCount
 * Rétrocompatibilité: si withCount != true, retourne un tableau de lignes.
 */
export async function GET(request: Request) {
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
  const status = searchParams.get('status') || ''
  const userId = searchParams.get('userId') || ''
  const from = searchParams.get('from') || ''
  const to = searchParams.get('to') || ''
  const sort = searchParams.get('sort') || 'created_at'
  const order = (searchParams.get('order') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc'
  const page = Math.max(parseInt(searchParams.get('page') || '1', 10) || 1, 1)
  const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '100', 10) || 100, 1), 1000)
  const withCount = (searchParams.get('withCount') || '').toLowerCase() === 'true'
  const withAggregates = (searchParams.get('withAggregates') || '').toLowerCase() === 'true'
  try {
  const sortMap: Record<string, string> = {
    date: 'created_at',
    created_at: 'created_at',
    processed_at: 'processed_at',
    points: 'points_amount',
    payout: 'payout_amount',
    fee: 'fee_amount',
    status: 'status'
  }
  const sortColumn = sortMap[sort] || 'created_at'

  let query = supabase
    .from('point_withdrawal_requests')
    .select('*', { count: withCount ? 'exact' : undefined })

  if (userId) {
    query = query.eq('user_id', userId)
  }
  if (status) {
    query = query.eq('status', status)
  }
  if (from) {
    query = query.gte('created_at', from)
  }
  if (to) {
    query = query.lte('created_at', to)
  }
  if (q) {
    query = query.or(`status.ilike.%${q}%,currency.ilike.%${q}%`)
  }

  query = query.order(sortColumn, { ascending: order === 'asc' })

  const fromIdx = (page - 1) * pageSize
  const toIdx = fromIdx + pageSize - 1
  query = query.range(fromIdx, toIdx)

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json(withCount ? { rows: [], total: 0 } : [])
  }

  const userIds = Array.from(
    new Set(
      (data ?? [])
        .map((r: any) => String(r.user_id ?? ''))
        .filter((v: string) => v.length > 0)
    )
  )

  const userNameByKey = new Map<string, string>()

  if (userIds.length > 0) {
    const [profilesByIdRes, profilesByUserIdRes, usersRes] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('id, user_id, first_name, last_name')
        .in('id', userIds),
      supabase
        .from('user_profiles')
        .select('id, user_id, first_name, last_name')
        .in('user_id', userIds),
      supabase
        .from('users')
        .select('id, email')
        .in('id', userIds)
    ])

    const usersById = new Map<string, string>()
    ;((usersRes.data ?? []) as any[]).forEach((u) => {
      if (u?.id && u?.email) {
        usersById.set(String(u.id), String(u.email))
      }
    })

    const ingestProfile = (p: any) => {
      if (!p) return
      const id = String(p.id ?? '')
      const userIdKey = String(p.user_id ?? '')
      const fullName = `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim()
      const fallbackEmail = userIdKey ? usersById.get(userIdKey) : undefined
      const label = fullName || fallbackEmail || (id ? `Utilisateur ${id.slice(0, 8)}` : 'Utilisateur')

      if (id) {
        userNameByKey.set(id, label)
      }
      if (userIdKey) {
        userNameByKey.set(userIdKey, label)
      }
    }

    ;((profilesByIdRes.data ?? []) as any[]).forEach(ingestProfile)
    ;((profilesByUserIdRes.data ?? []) as any[]).forEach(ingestProfile)
    userIds.forEach((id) => {
      if (!userNameByKey.has(id)) {
        const email = usersById.get(id)
        if (email) {
          userNameByKey.set(id, email)
        }
      }
    })
  }

  const rows = (data ?? []).map((r: any) => ({
    id: r.id,
    userId: r.user_id,
    userName: userNameByKey.get(String(r.user_id ?? '')) || (r.user_id ? `Utilisateur ${String(r.user_id).slice(0, 8)}` : 'Utilisateur'),
    methodId: r.method_id,
    pointsAmount: Number(r.points_amount || 0),
    payoutAmount: Number(r.payout_amount || 0),
    feeAmount: Number(r.fee_amount || 0),
    currency: r.currency,
    status: r.status,
    createdAt: r.created_at,
    processedAt: r.processed_at ?? null,
    processedBy: r.processed_by ?? null,
    metadata: r.metadata ?? {}
  }))

  if (withCount) {
    let aggregates: { points: number; payout: number; fee: number } | undefined
    if (withAggregates) {
      let agg = supabase
        .from('point_withdrawal_requests')
        .select('points_amount, payout_amount, fee_amount, status')

      if (userId) {
        agg = agg.eq('user_id', userId)
      }
      if (status) {
        agg = agg.eq('status', status)
      }
      if (from) {
        agg = agg.gte('created_at', from)
      }
      if (to) {
        agg = agg.lte('created_at', to)
      }
      if (q) {
        agg = agg.or(`status.ilike.%${q}%,currency.ilike.%${q}%`)
      }

      const { data: aggRows, error: aggErr } = await agg.limit(100000)
      if (!aggErr) {
        const sums = (aggRows ?? []).reduce(
          (acc: { points: number; payout: number; fee: number }, r: any) => {
            acc.points += Number(r.points_amount || 0)
            acc.payout += Number(r.payout_amount || 0)
            acc.fee += Number(r.fee_amount || 0)
            return acc
          },
          { points: 0, payout: 0, fee: 0 }
        )
        aggregates = sums
      }
    }
    return NextResponse.json({ rows, total: typeof count === 'number' ? count : rows.length, ...(aggregates ? { aggregates } : {}) })
  }
  return NextResponse.json(rows)
  } catch (_) {
    return NextResponse.json(withCount ? { rows: [], total: 0 } : [])
  }
}
