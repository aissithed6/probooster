import { NextResponse } from 'next/server'

import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

/**
 * GET: Retourne les soldes actuels (disponibles + gelés) pour une liste d'utilisateurs.
 * Query param: userIds=uuid,uuid,uuid
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

  const { searchParams } = new URL(request.url)
  const raw = (searchParams.get('userIds') || '').trim()

  if (!raw) {
    return NextResponse.json({ rows: [] })
  }

  const userIds = raw
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
    .slice(0, 2000)

  if (userIds.length === 0) {
    return NextResponse.json({ rows: [] })
  }

  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('loyalty_points')
    .select('user_id, points_balance, frozen_points, is_frozen, freeze_reason')
    .in('user_id', userIds)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = (data ?? []).map((r: any) => ({
    userId: String(r.user_id),
    pointsBalance: Number(r.points_balance ?? 0),
    frozenPoints: Number(r.frozen_points ?? 0),
    isFrozen: Boolean(r.is_frozen ?? false),
    freezeReason: (r.freeze_reason ?? null) as string | null
  }))

  return NextResponse.json({ rows })
}
