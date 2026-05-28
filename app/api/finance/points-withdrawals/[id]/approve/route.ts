import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'

/**
 * POST: Approuve une demande de retrait de points et enregistre le flux sortant en trésorerie.
 */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await assertSuperAdmin(_req)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Accès refusé.' },
      { status: 401 }
    )
  }

  const { id } = params
  const supabase = getSupabaseAdmin()

  const processedAt = new Date().toISOString()

  const { data: reqRow, error: upErr } = await supabase
    .from('point_withdrawal_requests')
    .update({ status: 'approved', processed_at: processedAt })
    .eq('id', id)
    .select('id, user_id, payout_amount, currency')
    .single()

  if (upErr || !reqRow) {
    return NextResponse.json({ error: upErr?.message || 'Demande introuvable' }, { status: upErr ? 500 : 404 })
  }

  try {
    await supabase.from('finance_cash_flow').insert({
      direction: 'out',
      category: 'points_withdrawal',
      label: `Retrait points #${id}`,
      amount: Number(reqRow.payout_amount || 0),
      occurred_at: processedAt
    })
  } catch (e) {
    console.error('Insertion finance_cash_flow (retrait points) échouée:', e)
  }

  return NextResponse.json({ success: true, id })
}
