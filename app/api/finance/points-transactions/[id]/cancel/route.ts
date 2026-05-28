import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await assertSuperAdmin(request as any)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Accès refusé.' },
      { status: 401 }
    )
  }

  const supabase = getSupabaseAdmin()
  const { id } = await context.params
  const rawId = String(id || '').trim()
  const txId = rawId.startsWith('pt_') ? rawId.slice('pt_'.length) : rawId

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

  if (!txId) {
    return NextResponse.json({ error: 'Identifiant de transaction manquant.' }, { status: 400 })
  }

  if (!uuidRegex.test(txId)) {
    return NextResponse.json({ error: `Identifiant de transaction invalide: ${rawId}` }, { status: 400 })
  }

  // Récupère la transaction à annuler
  const { data: tx, error: txErr } = await supabase
    .from('point_transactions')
    .select('id, user_id, type, points, fcfa_value, description, reference_id, created_at')
    .eq('id', txId)
    .maybeSingle()

  if (txErr) {
    return NextResponse.json({ error: txErr.message }, { status: 500 })
  }

  if (!tx?.id) {
    return NextResponse.json({ error: 'Transaction introuvable.' }, { status: 404 })
  }

  const txType = String(tx.type || '')

  // On limite volontairement l'annulation aux opérations Super Admin:
  // - spend: soustraction (RPC admin_withdraw_points)
  // - adjustment: attribution manuelle
  if (txType !== 'spend' && txType !== 'adjustment') {
    return NextResponse.json(
      { error: "Annulation impossible: cette transaction n'est pas une opération Super Admin annulable." },
      { status: 400 }
    )
  }

  const userId = String(tx.user_id || '').trim()
  if (!userId) {
    return NextResponse.json({ error: 'Transaction invalide (user_id manquant).' }, { status: 400 })
  }

  const points = Number(tx.points || 0)
  const fcfaValue = Number(tx.fcfa_value || 0)

  if (!Number.isFinite(points) || points <= 0) {
    return NextResponse.json({ error: 'Transaction invalide (points non valides).' }, { status: 400 })
  }

  // Empêche double annulation: on cherche une contre-écriture déjà créée avec reference_id=txId
  const { data: existingCancel, error: existingErr } = await supabase
    .from('point_transactions')
    .select('id')
    .eq('type', 'adjustment')
    .eq('reference_id', txId)
    .limit(1)
    .maybeSingle()

  if (existingErr) {
    return NextResponse.json({ error: existingErr.message }, { status: 500 })
  }

  if (existingCancel?.id) {
    return NextResponse.json(
      { error: 'Cette transaction a déjà été annulée.' },
      { status: 400 }
    )
  }

  // Lecture solde actuel
  const { data: loyaltyRow, error: loyaltyErr } = await supabase
    .from('loyalty_points')
    .select('points_balance, points_earned, points_spent, fcfa_value')
    .eq('user_id', userId)
    .maybeSingle()

  if (loyaltyErr) {
    return NextResponse.json({ error: loyaltyErr.message }, { status: 500 })
  }

  const currentBalance = Number(loyaltyRow?.points_balance ?? 0)
  const currentEarned = Number(loyaltyRow?.points_earned ?? 0)
  const currentSpent = Number(loyaltyRow?.points_spent ?? 0)
  const currentFcfa = Number(loyaltyRow?.fcfa_value ?? 0)

  // Contre-écriture:
  // - Si spend (soustraction) => on recrédite le solde et on diminue points_spent/fcfa_value
  // - Si adjustment (attribution) => on redébite le solde et on diminue points_earned/fcfa_value
  const nowIso = new Date().toISOString()

  let nextBalance = currentBalance
  let nextEarned = currentEarned
  let nextSpent = currentSpent
  let nextFcfa = currentFcfa

  let cancelPointsDelta = 0
  let cancelFcfaDelta = 0
  let cancelDescription = ''

  if (txType === 'spend') {
    // Recrédit
    cancelPointsDelta = points
    cancelFcfaDelta = -Math.abs(fcfaValue)
    nextBalance = Math.max(0, currentBalance + points)
    nextSpent = Math.max(0, currentSpent - points)
    nextFcfa = Number((currentFcfa + cancelFcfaDelta).toFixed(2))
    cancelDescription = `Annulation soustraction #${txId} (contre-écriture)`
  } else {
    // adjustment: on inverse l'attribution (on retire)
    cancelPointsDelta = -points
    cancelFcfaDelta = -Math.abs(fcfaValue)

    if (currentBalance < points) {
      return NextResponse.json(
        { error: "Annulation impossible: solde insuffisant pour retirer les points attribués." },
        { status: 400 }
      )
    }

    nextBalance = Math.max(0, currentBalance - points)
    nextEarned = Math.max(0, currentEarned - points)
    nextFcfa = Number((currentFcfa + cancelFcfaDelta).toFixed(2))
    cancelDescription = `Annulation attribution #${txId} (contre-écriture)`
  }

  // Mise à jour loyalty_points
  const { error: upErr } = await supabase
    .from('loyalty_points')
    .update({
      points_balance: nextBalance,
      points_earned: nextEarned,
      points_spent: nextSpent,
      fcfa_value: nextFcfa,
      updated_at: nowIso
    } as any)
    .eq('user_id', userId)

  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 })
  }

  // Trace audit: une contre-écriture (adjustment)
  const { error: insertErr } = await supabase
    .from('point_transactions')
    .insert({
      user_id: userId,
      type: 'adjustment',
      points: Math.abs(cancelPointsDelta),
      fcfa_value: cancelFcfaDelta,
      description: cancelDescription,
      reference_id: txId,
      created_at: nowIso
    } as any)

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 })
  }

  try {
    await supabase
      .from('users')
      .update({ points_balance: nextBalance } as any)
      .eq('id', userId)
  } catch {
    // noop
  }

  return NextResponse.json({
    data: {
      cancelledTransactionId: txId,
      userId,
      newBalance: nextBalance
    }
  })
}
