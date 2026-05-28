import { NextRequest, NextResponse } from 'next/server'

import { getSupabaseAdmin } from '@/lib/supabase'
import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'

type AwardPointsInput = {
  userId: string
  points: number
  description?: string
}

/**
 * POST: Attribue des points à un utilisateur (Super Admin).
 *
 * Effets:
 * - Upsert + update de loyalty_points (points_balance, points_earned, fcfa_value)
 * - Insertion dans point_transactions (type='adjustment')
 *
 * Sécurité:
 * - Accès réservé Super Admin via assertSuperAdmin
 * - Exécute les écritures avec service_role (getSupabaseAdmin)
 */
export async function POST(request: NextRequest) {
  try {
    await assertSuperAdmin(request)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Accès refusé.' },
      { status: 401 }
    )
  }

  let body: Partial<AwardPointsInput> = {}

  try {
    body = (await request.json()) as Partial<AwardPointsInput>
  } catch {
    return NextResponse.json({ error: 'Corps de requête JSON invalide.' }, { status: 400 })
  }

  const providedId = body.userId ? String(body.userId) : ''
  const pointsRaw = body.points
  const description = typeof body.description === 'string' ? body.description.trim() : ''

  if (!providedId) {
    return NextResponse.json({ error: 'Identifiant utilisateur manquant.' }, { status: 400 })
  }

  const points = Number(pointsRaw)
  if (!Number.isFinite(points) || !Number.isInteger(points) || points <= 0) {
    return NextResponse.json({ error: 'Le nombre de points doit être un entier positif.' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  try {
    const { data: profileRow } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('id', providedId)
      .maybeSingle()

    const userId = profileRow?.user_id ? String(profileRow.user_id) : providedId

    const { data: userProfileByUserId } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    const profileId = userProfileByUserId?.id ? String(userProfileByUserId.id) : null

    const { data: userRow, error: userErr } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle()

    if (userErr) {
      throw userErr
    }

    if (!userRow?.id) {
      return NextResponse.json({ error: 'Utilisateur introuvable.' }, { status: 404 })
    }

    let conversionRate = 1

    try {
      const { data: settingsRow } = await supabase
        .from('point_settings')
        .select('conversion_rate')
        .eq('scope', 'global')
        .maybeSingle()

      if (settingsRow?.conversion_rate !== null && settingsRow?.conversion_rate !== undefined) {
        const numeric = Number(settingsRow.conversion_rate)
        if (Number.isFinite(numeric) && numeric > 0) {
          conversionRate = numeric
        }
      }
    } catch {
      conversionRate = 1
    }

    const fcfaValue = Number((points * conversionRate).toFixed(2))

    await supabase
      .from('loyalty_points')
      .upsert(
        {
          user_id: userId
        },
        { onConflict: 'user_id' }
      )

    const { data: loyaltyRow, error: loyaltyErr } = await supabase
      .from('loyalty_points')
      .select('points_balance, points_earned, fcfa_value')
      .eq('user_id', userId)
      .maybeSingle()

    if (loyaltyErr) {
      throw loyaltyErr
    }

    const currentBalance = Number(loyaltyRow?.points_balance ?? 0)
    const currentEarned = Number(loyaltyRow?.points_earned ?? 0)
    const currentFcfa = Number(loyaltyRow?.fcfa_value ?? 0)

    const nextBalance = Math.max(0, currentBalance + points)
    const nextEarned = Math.max(0, currentEarned + points)
    const nextFcfa = Math.max(0, Number((currentFcfa + fcfaValue).toFixed(2)))

    const { error: updateErr } = await supabase
      .from('loyalty_points')
      .update({
        points_balance: nextBalance,
        points_earned: nextEarned,
        fcfa_value: nextFcfa
      })
      .eq('user_id', userId)

    if (updateErr) {
      throw updateErr
    }

    const finalDescription = description || 'Attribution de points par le Super Admin'

    const { error: txErr } = await supabase
      .from('point_transactions')
      .insert({
        user_id: userId,
        type: 'adjustment',
        points,
        fcfa_value: fcfaValue,
        description: finalDescription
      })

    if (txErr) {
      throw txErr
    }

    try {
      await supabase
        .from('users')
        .update({
          points_balance: nextBalance
        } as any)
        .eq('id', userId)
    } catch {
      // Tolère l'absence de colonne users.points_balance (schéma variable selon environnements)
    }

    try {
      if (profileId) {
        const { data: memberRow } = await supabase
          .from('loyalty_members')
          .select('user_id, tier, total_points, available_points, lifetime_points')
          .eq('user_id', profileId)
          .maybeSingle()

        if (!memberRow?.user_id) {
          await supabase
            .from('loyalty_members')
            .insert({
              user_id: profileId,
              tier: 'bronze',
              total_points: points,
              available_points: points,
              lifetime_points: points
            } as any)
        } else {
          const nextTotal = Number(memberRow.total_points ?? 0) + points
          const nextAvailable = Number(memberRow.available_points ?? 0) + points
          const nextLifetime = Number(memberRow.lifetime_points ?? 0) + points

          await supabase
            .from('loyalty_members')
            .update({
              total_points: nextTotal,
              available_points: nextAvailable,
              lifetime_points: nextLifetime,
              updated_at: new Date().toISOString()
            } as any)
            .eq('user_id', profileId)
        }
      }
    } catch {
      // Table loyalty_members optionnelle selon les environnements: si absente, on ignore.
    }

    return NextResponse.json({
      data: {
        userId,
        points,
        conversionRate,
        fcfaValue,
        newBalance: nextBalance
      }
    })
  } catch (error) {
    console.error('POST /api/finance/points-awards failed:', error)
    const message = error instanceof Error ? error.message : "Erreur lors de l'attribution de points."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
