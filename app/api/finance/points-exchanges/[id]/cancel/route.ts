import { NextRequest, NextResponse } from 'next/server'

import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

/**
 * POST: Annule un échange de points.
 * Option B: contre-écriture (adjustment) pour recréditer les points.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await assertSuperAdmin(req)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Accès refusé.' },
      { status: 401 }
    )
  }

  const { id } = params
  if (!id) {
    return NextResponse.json({ error: 'Identifiant manquant.' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  const { data: row, error } = await supabase
    .from('point_exchange_history')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!row) {
    return NextResponse.json({ error: 'Échange introuvable.' }, { status: 404 })
  }

  const status = String((row as any).status ?? '')
  if (status.toLowerCase() === 'cancelled') {
    return NextResponse.json({ data: { id, status: 'cancelled' } })
  }

  const providedUserId = String((row as any).user_id ?? '')
  const pointsAmount = Number((row as any).points_amount ?? 0)
  if (!providedUserId) {
    return NextResponse.json({ error: 'Utilisateur manquant.' }, { status: 400 })
  }
  if (!Number.isFinite(pointsAmount) || pointsAmount <= 0) {
    return NextResponse.json({ error: 'Montant invalide.' }, { status: 400 })
  }

  const { data: profileRow } = await supabase
    .from('user_profiles')
    .select('user_id')
    .eq('id', providedUserId)
    .maybeSingle()

  const userId = profileRow?.user_id ? String(profileRow.user_id) : providedUserId

  let conversionRate = 1
  try {
    const { data: settingsRow } = await supabase
      .from('point_settings')
      .select('conversion_rate')
      .eq('scope', 'global')
      .maybeSingle()

    const numeric = Number((settingsRow as any)?.conversion_rate)
    if (Number.isFinite(numeric) && numeric > 0) conversionRate = numeric
  } catch {
    conversionRate = 1
  }

  const fcfaValue = Number((pointsAmount * conversionRate).toFixed(2))
  const nowIso = new Date().toISOString()

  await supabase.from('loyalty_points').upsert({ user_id: userId }, { onConflict: 'user_id' })

  const { data: lpRow, error: lpErr } = await supabase
    .from('loyalty_points')
    .select('points_balance, points_earned, fcfa_value')
    .eq('user_id', userId)
    .maybeSingle()

  if (lpErr) {
    return NextResponse.json({ error: lpErr.message }, { status: 500 })
  }

  const nextBalance = Math.max(0, Number((lpRow as any)?.points_balance ?? 0) + pointsAmount)
  const nextEarned = Math.max(0, Number((lpRow as any)?.points_earned ?? 0) + pointsAmount)
  const nextFcfa = Math.max(0, Number(Number((lpRow as any)?.fcfa_value ?? 0) + fcfaValue).toFixed(2))

  const { error: upErr } = await supabase
    .from('loyalty_points')
    .update({ points_balance: nextBalance, points_earned: nextEarned, fcfa_value: nextFcfa, updated_at: nowIso })
    .eq('user_id', userId)

  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 })
  }

  const { error: txErr } = await supabase
    .from('point_transactions')
    .insert({
      user_id: userId,
      type: 'adjustment',
      points: pointsAmount,
      fcfa_value: fcfaValue,
      description: `Annulation échange #${id} (contre-écriture)`,
      reference_id: id,
      created_at: nowIso
    })

  if (txErr) {
    return NextResponse.json({ error: txErr.message }, { status: 500 })
  }

  // Marque cancelled si la colonne existe; sinon ignore
  try {
    await supabase.from('point_exchange_history').update({ status: 'cancelled' } as any).eq('id', id)
  } catch {
    // noop
  }

  return NextResponse.json({ data: { id, status: 'cancelled', userId, points: pointsAmount, newBalance: nextBalance } })
}
