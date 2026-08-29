import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertCustomer } from '../../_helpers/auth'
import { getSupabaseAdmin } from '../../../../../lib/supabase'

/**
 * GET /api/client/points/today
 * Retourne les transactions de points récentes (48h) de l'utilisateur connecté.
 * Utilise le client admin (service role) pour ne pas dépendre des policies RLS
 * sur point_transactions : la carte "Points aujourd'hui" du tableau de bord
 * client doit rester fiable même si le client ne peut pas lire la table directly.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await assertCustomer(request)
    const supabase = getSupabaseAdmin()

    const since = new Date()
    since.setDate(since.getDate() - 2)

    const { data, error } = await supabase
      .from('point_transactions')
      .select('type, points, created_at')
      .eq('user_id', userId)
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })
      .limit(500)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const rows = (data ?? []).map((r: any) => ({
      type: String(r.type ?? ''),
      points: Number(r.points ?? 0),
      createdAt: String(r.created_at ?? '')
    }))

    return NextResponse.json(
      { data: { rows } },
      { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    )
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Accès refusé.' },
      { status: 401 }
    )
  }
}
