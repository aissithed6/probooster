import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'

/**
 * GET: Liste les transferts de points (point_transfer_requests) pour suivi financier.
 * Query params: q, status, userId, senderId, recipientId, from, to, sort, order, page, pageSize, withCount
 * Rétrocompatibilité: si withCount != true, retourne un tableau.
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
  const senderId = searchParams.get('senderId') || ''
  const recipientId = searchParams.get('recipientId') || ''
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
    fee: 'fee_amount',
    status: 'status'
  }
  const sortColumn = sortMap[sort] || 'created_at'

  let query = supabase
    .from('point_transfer_requests')
    .select('*', { count: withCount ? 'exact' : undefined })

  if (status) {
    query = query.eq('status', status)
  }
  if (senderId) {
    query = query.eq('sender_id', senderId)
  }
  if (recipientId) {
    query = query.eq('recipient_id', recipientId)
  }
  if (userId) {
    // Filtre si l'utilisateur est expéditeur OU destinataire
    query = query.or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
  }
  if (from) {
    query = query.gte('created_at', from)
  }
  if (to) {
    query = query.lte('created_at', to)
  }
  if (q) {
    query = query.or(`status.ilike.%${q}%`)
  }

  query = query.order(sortColumn, { ascending: order === 'asc' })

  const fromIdx = (page - 1) * pageSize
  const toIdx = fromIdx + pageSize - 1
  query = query.range(fromIdx, toIdx)

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json(withCount ? { rows: [], total: 0 } : [])
  }

  const idCandidates = Array.from(
    new Set(
      (data ?? []).flatMap((r: any) => [String(r.sender_id ?? ''), String(r.recipient_id ?? '')]).filter((v: string) => v.length > 0)
    )
  )

  const userNameByKey = new Map<string, string>()

  if (idCandidates.length > 0) {
    const [profilesByIdRes, profilesByUserIdRes, usersRes] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('id, user_id, first_name, last_name')
        .in('id', idCandidates),
      supabase
        .from('user_profiles')
        .select('id, user_id, first_name, last_name')
        .in('user_id', idCandidates),
      supabase
        .from('users')
        .select('id, email')
        .in('id', idCandidates)
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
    idCandidates.forEach((id) => {
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
    senderId: r.sender_id,
    senderName: userNameByKey.get(String(r.sender_id ?? '')) || (r.sender_id ? `Utilisateur ${String(r.sender_id).slice(0, 8)}` : 'Utilisateur'),
    recipientId: r.recipient_id,
    recipientName: userNameByKey.get(String(r.recipient_id ?? '')) || (r.recipient_id ? `Utilisateur ${String(r.recipient_id).slice(0, 8)}` : 'Utilisateur'),
    pointsAmount: Number(r.points_amount || 0),
    feeAmount: Number(r.fee_amount || 0),
    status: r.status,
    createdAt: r.created_at,
    processedAt: r.processed_at ?? null,
    processedBy: r.processed_by ?? null,
    metadata: r.metadata ?? {}
  }))

  if (withCount) {
    let aggregates: { points: number; fee: number } | undefined
    if (withAggregates) {
      let agg = supabase
        .from('point_transfer_requests')
        .select('points_amount, fee_amount, status, sender_id, recipient_id')

      if (status) {
        agg = agg.eq('status', status)
      }
      if (senderId) {
        agg = agg.eq('sender_id', senderId)
      }
      if (recipientId) {
        agg = agg.eq('recipient_id', recipientId)
      }
      if (userId) {
        agg = agg.or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      }
      if (from) {
        agg = agg.gte('created_at', from)
      }
      if (to) {
        agg = agg.lte('created_at', to)
      }
      if (q) {
        agg = agg.or(`status.ilike.%${q}%`)
      }

      const { data: aggRows, error: aggErr } = await agg.limit(100000)
      if (!aggErr) {
        const sums = (aggRows ?? []).reduce(
          (acc: { points: number; fee: number }, r: any) => {
            acc.points += Number(r.points_amount || 0)
            acc.fee += Number(r.fee_amount || 0)
            return acc
          },
          { points: 0, fee: 0 }
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
