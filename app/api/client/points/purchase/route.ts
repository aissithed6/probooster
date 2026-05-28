import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertCustomer, isClientAuthError } from '../../_helpers/auth'
import { getSupabaseAdmin } from '../../../../../lib/supabase'

type PurchasePointsPayload = {
  reference: string
  points: number
  amountPaid: number
  currency?: string | null
}

type FeexpayVerifyResponse = {
  mode: string
  reference: string
  paid: boolean
  status: string
}

/**
 * POST /api/client/points/purchase
 * Finalise un achat de points après paiement FeexPay.
 * 
 * Stratégie:
 * - Vérifie le statut FeexPay via l'API (ou mode mock).
 * - Idempotent via point_transactions.reference_id (= reference FeexPay).
 * - Crédite loyalty_points + journalise dans point_transactions.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await assertCustomer(request)
    const supabase = getSupabaseAdmin()

    const body = (await request.json().catch(() => ({}))) as Partial<PurchasePointsPayload>
    const reference = typeof body.reference === 'string' ? body.reference.trim() : ''
    const points = typeof body.points === 'number' ? body.points : Number(body.points)
    const amountPaid = typeof body.amountPaid === 'number' ? body.amountPaid : Number(body.amountPaid)
    const currency = typeof body.currency === 'string' && body.currency.trim() ? body.currency.trim() : 'XOF'

    if (!reference) {
      return NextResponse.json({ error: 'Référence FeexPay manquante.' }, { status: 400 })
    }

    if (!Number.isFinite(points) || !Number.isInteger(points) || points <= 0) {
      return NextResponse.json({ error: 'Le nombre de points doit être un entier positif.' }, { status: 400 })
    }

    if (!Number.isFinite(amountPaid) || amountPaid <= 0) {
      return NextResponse.json({ error: 'Montant payé invalide.' }, { status: 400 })
    }

    // Idempotence: si déjà crédité, renvoyer OK.
    const { data: existingTx, error: existingErr } = await supabase
      .from('point_transactions')
      .select('id, points')
      .eq('user_id', userId)
      .eq('type', 'points_purchase')
      .eq('reference_id', reference)
      .maybeSingle()

    if (existingErr && (existingErr as any)?.code !== 'PGRST116') {
      return NextResponse.json({ error: existingErr.message }, { status: 500 })
    }

    if (existingTx?.id) {
      return NextResponse.json({ data: { alreadyProcessed: true, reference, points: Number(existingTx.points ?? points) } })
    }

    const mode = (process.env.FEEXPAY_MODE ?? 'mock').toLowerCase()

    const verifyFeexpay = async (): Promise<FeexpayVerifyResponse> => {
      if (mode === 'mock') {
        return { mode, reference, paid: true, status: 'successful' }
      }

      const apiKey = process.env.FEEXPAY_API_KEY
      if (!apiKey) {
        throw new Error('FeexPay non configuré (FEEXPAY_API_KEY manquant).')
      }

      const upstream = await fetch(
        `https://api.feexpay.me/api/transactions/public/single/status/${encodeURIComponent(reference)}`,
        {
          method: 'GET',
          headers: {
            accept: 'application/json',
            authorization: `Bearer ${apiKey}`
          },
          cache: 'no-store'
        }
      )

      const upstreamText = await upstream.text().catch(() => '')
      const upstreamJson = (() => {
        if (!upstreamText) return {} as any
        try {
          return JSON.parse(upstreamText) as any
        } catch {
          return {} as any
        }
      })()

      if (!upstream.ok) {
        const msg =
          (upstreamJson as any)?.error ||
          (upstreamJson as any)?.message ||
          (upstreamJson as any)?.responsemsg ||
          'Erreur FeexPay (verify).'
        throw new Error(msg)
      }

      const statusRaw = typeof (upstreamJson as any)?.status === 'string' ? (upstreamJson as any).status : ''
      const status = statusRaw.trim().toUpperCase()

      const operatorStatusRaw = typeof (upstreamJson as any)?.operator_status === 'string' ? (upstreamJson as any).operator_status : ''
      const operatorStatus = operatorStatusRaw.trim().toUpperCase()

      const reasonRaw = typeof (upstreamJson as any)?.reason === 'string' ? (upstreamJson as any).reason : ''
      const reason = reasonRaw.trim().toUpperCase()

      const responseCodeRaw = typeof (upstreamJson as any)?.responsecode === 'string' ? (upstreamJson as any).responsecode : ''
      const responseCode = responseCodeRaw.trim().toUpperCase()

      const responseMsgRaw = typeof (upstreamJson as any)?.responsemsg === 'string' ? (upstreamJson as any).responsemsg : ''
      const responseMsg = responseMsgRaw.trim().toUpperCase()

      const isDeclined = operatorStatus === 'DECLINED' || reason === 'DECLINED'
      const isFailedCode = responseCode === 'FAILED' || responseMsg === 'FAILED'

      const effectiveStatus = isDeclined || isFailedCode ? 'FAILED' : status
      const paid = effectiveStatus === 'SUCCESS' || effectiveStatus === 'SUCCESSFUL' || effectiveStatus === 'SUCCEEDED' || effectiveStatus === 'COMPLETED' || effectiveStatus === 'PAID'

      return { mode, reference, paid, status: effectiveStatus || statusRaw || 'UNKNOWN' }
    }

    const verification = await verifyFeexpay()
    if (!verification.paid) {
      return NextResponse.json(
        {
          error: 'Paiement non confirmé.',
          details: {
            reference,
            status: verification.status
          }
        },
        { status: 402 }
      )
    }

    await supabase
      .from('loyalty_points')
      .upsert({ user_id: userId } as any, { onConflict: 'user_id' })

    const { data: loyaltyRow, error: loyaltyErr } = await supabase
      .from('loyalty_points')
      .select('points_balance, points_earned, fcfa_value')
      .eq('user_id', userId)
      .maybeSingle()

    if (loyaltyErr) {
      return NextResponse.json({ error: loyaltyErr.message }, { status: 500 })
    }

    const currentBalance = Number((loyaltyRow as any)?.points_balance ?? 0)
    const currentEarned = Number((loyaltyRow as any)?.points_earned ?? 0)
    const currentFcfa = Number((loyaltyRow as any)?.fcfa_value ?? 0)

    const nextBalance = Math.max(0, currentBalance + points)
    const nextEarned = Math.max(0, currentEarned + points)
    const nextFcfa = Math.max(0, Number((currentFcfa + amountPaid).toFixed(2)))

    const { error: updateErr } = await supabase
      .from('loyalty_points')
      .update({
        points_balance: nextBalance,
        points_earned: nextEarned,
        fcfa_value: nextFcfa
      })
      .eq('user_id', userId)

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    const { error: txErr } = await supabase
      .from('point_transactions')
      .insert({
        user_id: userId,
        type: 'points_purchase',
        points,
        fcfa_value: Number(amountPaid.toFixed(2)),
        description: `Achat de points (${points} pts) via FeexPay`,
        reference_id: reference,
        created_at: new Date().toISOString()
      } as any)

    if (txErr) {
      return NextResponse.json({ error: txErr.message }, { status: 500 })
    }

    try {
      await supabase
        .from('users')
        .update({ points_balance: nextBalance } as any)
        .eq('id', userId)
    } catch {
      // ignore legacy sync
    }

    return NextResponse.json({
      data: {
        reference,
        points,
        amountPaid,
        currency,
        newBalance: nextBalance,
        status: verification.status
      }
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'

    if (isClientAuthError(error)) {
      return NextResponse.json({ error: message }, { status: 401 })
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
