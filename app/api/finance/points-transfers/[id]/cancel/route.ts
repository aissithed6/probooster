import { NextRequest, NextResponse } from 'next/server'

import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

/**
 * POST: Annule un transfert de points.
 * Option B: contre-écriture.
 * - recrédite l'expéditeur
 * - débite le destinataire
 * - trace deux adjustments (audit)
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
    .from('point_transfer_requests')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!row) {
    return NextResponse.json({ error: 'Transfert introuvable.' }, { status: 404 })
  }

  const status = String((row as any).status ?? '')
  if (status.toLowerCase() === 'cancelled') {
    return NextResponse.json({ data: { id, status: 'cancelled' } })
  }

  const senderProfileId = String((row as any).sender_id ?? '')
  const recipientProfileId = String((row as any).recipient_id ?? '')
  const pointsAmount = Number((row as any).points_amount ?? 0)

  if (!senderProfileId || !recipientProfileId) {
    return NextResponse.json({ error: 'Expéditeur/destinataire manquant.' }, { status: 400 })
  }
  if (!Number.isFinite(pointsAmount) || pointsAmount <= 0) {
    return NextResponse.json({ error: 'Montant invalide.' }, { status: 400 })
  }

  // Résolution user_id depuis profils
  const [{ data: senderProfile }, { data: recipientProfile }] = await Promise.all([
    supabase.from('user_profiles').select('user_id').eq('id', senderProfileId).maybeSingle(),
    supabase.from('user_profiles').select('user_id').eq('id', recipientProfileId).maybeSingle()
  ])

  const senderUserId = senderProfile?.user_id ? String(senderProfile.user_id) : senderProfileId
  const recipientUserId = recipientProfile?.user_id ? String(recipientProfile.user_id) : recipientProfileId

  if (!senderUserId || !recipientUserId) {
    return NextResponse.json({ error: 'Impossible de résoudre les user_id.' }, { status: 400 })
  }

  // Conversion rate
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

  // S'assure que les comptes existent
  await Promise.all([
    supabase.from('loyalty_points').upsert({ user_id: senderUserId }, { onConflict: 'user_id' }),
    supabase.from('loyalty_points').upsert({ user_id: recipientUserId }, { onConflict: 'user_id' })
  ])

  // Vérifie que le destinataire a assez de points pour rembourser.
  const { data: recipientLp, error: recipientLpErr } = await supabase
    .from('loyalty_points')
    .select('points_balance, fcfa_value')
    .eq('user_id', recipientUserId)
    .maybeSingle()

  if (recipientLpErr) {
    return NextResponse.json({ error: recipientLpErr.message }, { status: 500 })
  }

  const recipientBalance = Number((recipientLp as any)?.points_balance ?? 0)
  if (recipientBalance < pointsAmount) {
    return NextResponse.json(
      { error: `Annulation impossible: le destinataire n'a pas assez de points (solde=${recipientBalance}, requis=${pointsAmount}).` },
      { status: 409 }
    )
  }

  // Crédit expéditeur
  const { data: senderLp } = await supabase
    .from('loyalty_points')
    .select('points_balance, points_earned, fcfa_value')
    .eq('user_id', senderUserId)
    .maybeSingle()

  const senderNextBalance = Math.max(0, Number((senderLp as any)?.points_balance ?? 0) + pointsAmount)
  const senderNextEarned = Math.max(0, Number((senderLp as any)?.points_earned ?? 0) + pointsAmount)
  const senderNextFcfa = Number(Math.max(0, Number((senderLp as any)?.fcfa_value ?? 0) + Number(fcfaValue)).toFixed(2))

  const { error: senderUpErr } = await supabase
    .from('loyalty_points')
    .update({
      points_balance: senderNextBalance,
      points_earned: senderNextEarned,
      fcfa_value: senderNextFcfa,
      updated_at: nowIso
    })
    .eq('user_id', senderUserId)

  if (senderUpErr) {
    return NextResponse.json({ error: senderUpErr.message }, { status: 500 })
  }

  // Débit destinataire
  const recipientNextBalance = Math.max(0, recipientBalance - pointsAmount)
  const recipientNextFcfa = Number(Math.max(0, Number((recipientLp as any)?.fcfa_value ?? 0) - Number(fcfaValue)).toFixed(2))

  const { error: recipientUpErr2 } = await supabase
    .from('loyalty_points')
    .update({
      points_balance: recipientNextBalance,
      fcfa_value: recipientNextFcfa,
      updated_at: nowIso
    })
    .eq('user_id', recipientUserId)

  if (recipientUpErr2) {
    return NextResponse.json({ error: recipientUpErr2.message }, { status: 500 })
  }

  // Trace audit: 2 adjustments
  const { error: txErr } = await supabase
    .from('point_transactions')
    .insert([
      {
        user_id: senderUserId,
        type: 'adjustment',
        points: pointsAmount,
        fcfa_value: fcfaValue,
        description: `Annulation transfert #${id} (recrédit expéditeur)`,
        reference_id: id,
        created_at: nowIso
      },
      {
        user_id: recipientUserId,
        type: 'adjustment',
        points: -pointsAmount,
        fcfa_value: -fcfaValue,
        description: `Annulation transfert #${id} (débit destinataire)`,
        reference_id: id,
        created_at: nowIso
      }
    ] as any)

  if (txErr) {
    return NextResponse.json({ error: txErr.message }, { status: 500 })
  }

  const { error: cancelErr } = await supabase
    .from('point_transfer_requests')
    .update({ status: 'cancelled', processed_at: nowIso })
    .eq('id', id)

  if (cancelErr) {
    return NextResponse.json({ error: cancelErr.message }, { status: 500 })
  }

  return NextResponse.json({
    data: {
      id,
      status: 'cancelled',
      points: pointsAmount,
      senderUserId,
      recipientUserId,
      senderNewBalance: senderNextBalance,
      recipientNewBalance: recipientNextBalance
    }
  })
}
