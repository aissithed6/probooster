import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'

/**
 * GET: Liste unifiée des transactions de points pour reporting financier.
 * Source: point_transactions (type, points, fcfa_value, description, reference_id, created_at).
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
  const category = searchParams.get('category') || ''
  const userId = searchParams.get('userId') || ''
  const from = searchParams.get('from') || ''
  const to = searchParams.get('to') || ''
  const sort = searchParams.get('sort') || 'created_at'
  const order = (searchParams.get('order') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc'
  const page = Math.max(parseInt(searchParams.get('page') || '1', 10) || 1, 1)
  const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '100', 10) || 100, 1), 1000)
  const withCount = (searchParams.get('withCount') || '').toLowerCase() === 'true'
  const withAggregates = (searchParams.get('withAggregates') || '').toLowerCase() === 'true'

  // Mapping du champ de tri
  const sortMap: Record<string, string> = {
    date: 'created_at',
    created_at: 'created_at',
    points: 'points',
    value: 'fcfa_value',
    type: 'type',
    category: 'type' // proxy pour la catégorie dérivée
  }
  const sortColumn = sortMap[sort] || 'created_at'

  let query = supabase
    .from('point_transactions')
    .select('*', { count: withCount ? 'exact' : undefined })

  if (userId) {
    query = query.eq('user_id', userId)
  }
  if (from) {
    query = query.gte('created_at', from)
  }
  if (to) {
    query = query.lte('created_at', to)
  }

  // Filtre catégorie basé sur le champ type (catégorie dérivée côté sortie)
  if (category) {
    if (category === 'fee') {
      query = query.ilike('type', '%fee%')
    } else if (['withdrawal', 'exchange', 'reward_redemption'].includes(category)) {
      query = query.eq('type', category)
    } else if (category === 'redemption') {
      // catégorie redemptions mappée depuis type 'reward_redemption'
      query = query.eq('type', 'reward_redemption')
    }
  }

  // Recherche plein texte simple sur type/description
  if (q) {
    // Supabase OR filter: or('col.ilike.%q%,other.ilike.%q%')
    query = query.or(`type.ilike.%${q}%,description.ilike.%${q}%`)
  }

  query = query.order(sortColumn, { ascending: order === 'asc' })

  const fromIdx = (page - 1) * pageSize
  const toIdx = fromIdx + pageSize - 1
  query = query.range(fromIdx, toIdx)

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
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

  const mapped = (data ?? []).map((r: any) => {
    const type: string = r.type
    const cat =
      type?.includes('fee') ? 'fee' :
      type === 'withdrawal' ? 'withdrawal' :
      type === 'exchange' ? 'exchange' :
      type === 'reward_redemption' ? 'redemption' :
      'other'

    return {
      id: r.id,
      userId: r.user_id,
      userName: userNameByKey.get(String(r.user_id ?? '')) || (r.user_id ? `Utilisateur ${String(r.user_id).slice(0, 8)}` : 'Utilisateur'),
      type,
      category: cat,
      points: Number(r.points || 0),
      value: Number(r.fcfa_value || 0),
      description: r.description ?? '',
      referenceId: r.reference_id ?? null,
      createdAt: r.created_at
    }
  })

  if (withCount) {
    let aggregates: { points: number; value: number } | undefined
    if (withAggregates) {
      let agg = supabase
        .from('point_transactions')
        .select('points, fcfa_value, type')

      if (userId) {
        agg = agg.eq('user_id', userId)
      }
      if (from) {
        agg = agg.gte('created_at', from)
      }
      if (to) {
        agg = agg.lte('created_at', to)
      }
      if (category) {
        if (category === 'fee') {
          agg = agg.ilike('type', '%fee%')
        } else if (['withdrawal', 'exchange', 'reward_redemption'].includes(category)) {
          agg = agg.eq('type', category)
        } else if (category === 'redemption') {
          agg = agg.eq('type', 'reward_redemption')
        }
      }
      if (q) {
        agg = agg.or(`type.ilike.%${q}%,description.ilike.%${q}%`)
      }

      const { data: aggRows, error: aggErr } = await agg.limit(100000)
      if (!aggErr) {
        const sums = (aggRows ?? []).reduce(
          (acc: { points: number; value: number }, r: any) => {
            acc.points += Number(r.points || 0)
            acc.value += Number(r.fcfa_value || 0)
            return acc
          },
          { points: 0, value: 0 }
        )
        aggregates = sums
      }
    }
    return NextResponse.json({ rows: mapped, total: typeof count === 'number' ? count : mapped.length, ...(aggregates ? { aggregates } : {}) })
  }
  return NextResponse.json(mapped)
}
