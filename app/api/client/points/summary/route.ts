import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { assertCustomer, isClientAuthError } from '../../_helpers/auth'
import { getSupabaseAdmin } from '../../../../../lib/supabase'

/**
 * GET /api/client/points/summary
 * Retourne un résumé des points pour le client connecté.
 * Source de vérité:
 * - loyalty_points (nouveau système)
 * - fallback users.points_balance (legacy affiché côté super-admin)
 * - fallback user_points.points (ancienne table)
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await assertCustomer(request)
    const supabase = getSupabaseAdmin()

    const { data: loyaltyRow, error: loyaltyError } = await supabase
      .from('loyalty_points')
      .select('points_balance, points_spent, fcfa_value, is_frozen, freeze_reason')
      .eq('user_id', userId)
      .maybeSingle()

    const loyaltyBalance = Number((loyaltyRow as any)?.points_balance ?? 0)
    const hasLoyaltyBalance = Number.isFinite(loyaltyBalance) && loyaltyBalance > 0

    let balance = hasLoyaltyBalance ? loyaltyBalance : 0
    let pointsSpent = Number((loyaltyRow as any)?.points_spent ?? 0)
    let fcfaValue = Number((loyaltyRow as any)?.fcfa_value ?? 0)
    let isFrozen = Boolean((loyaltyRow as any)?.is_frozen ?? false)
    let freezeReason = ((loyaltyRow as any)?.freeze_reason ?? null) as string | null

    if (!Number.isFinite(pointsSpent) || pointsSpent < 0) pointsSpent = 0
    if (!Number.isFinite(fcfaValue) || fcfaValue < 0) fcfaValue = 0

    if (!hasLoyaltyBalance) {
      const { data: userRow, error: userError } = await supabase
        .from('users')
        .select('points_balance')
        .eq('id', userId)
        .maybeSingle()

      const legacyUserBalance = Number((userRow as any)?.points_balance ?? 0)
      if (!userError && Number.isFinite(legacyUserBalance) && legacyUserBalance >= 0) {
        balance = legacyUserBalance
      }
    }

    if (!hasLoyaltyBalance && (!Number.isFinite(balance) || balance <= 0)) {
      const { data: legacyPointsRow, error: legacyError } = await supabase
        .from('user_points')
        .select('points, fcfa_value')
        .eq('user_id', userId)
        .maybeSingle()

      const legacyPoints = Number((legacyPointsRow as any)?.points ?? 0)
      const legacyFcfa = Number((legacyPointsRow as any)?.fcfa_value ?? 0)

      if (!legacyError && Number.isFinite(legacyPoints) && legacyPoints >= 0) {
        balance = legacyPoints
      }

      if (!legacyError && Number.isFinite(legacyFcfa) && legacyFcfa >= 0 && fcfaValue === 0) {
        fcfaValue = legacyFcfa
      }
    }

    return NextResponse.json({
      data: {
        balance: Number.isFinite(balance) && balance >= 0 ? balance : 0,
        pointsSpent: Number.isFinite(pointsSpent) && pointsSpent >= 0 ? pointsSpent : 0,
        fcfaValue: Number.isFinite(fcfaValue) && fcfaValue >= 0 ? fcfaValue : 0,
        isFrozen,
        freezeReason
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
