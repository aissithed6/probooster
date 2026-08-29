import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertCustomer, isClientAuthError } from '../../_helpers/auth'
import { getSupabaseAdmin } from '../../../../../lib/supabase'

/**
 * POST /api/client/account/delete-permanent
 * Suppression DÉFINITIVE du compte client (RGPD):
 * - Supprime les données liées dans public.* (best-effort, tables optionnelles)
 * - Supprime le compte d'authentification Supabase Auth (auth.users) via admin
 * - Supprime la ligne public.users
 * Action irréversible.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await assertCustomer(request)
    const supabase = getSupabaseAdmin()

    // 1. Suppression des données liées (best-effort: les tables peuvent ne pas exister)
    const tablesByUserId: Array<{ table: string; column?: string }> = [
      { table: 'user_sessions' },
      { table: 'activity_logs' },
      { table: 'user_security_settings' },
      { table: 'point_transactions' },
      { table: 'point_withdrawal_requests' },
      { table: 'point_transfer_requests' },
      { table: 'point_exchange_history' },
      { table: 'loyalty_points' },
      { table: 'user_wishlists' },
      { table: 'user_carts' },
      { table: 'user_notifications' },
      { table: 'user_profiles' },
      { table: 'user_features' },
      { table: 'orders', column: 'customer_id' },
      { table: 'client_orders', column: 'customer_id' }
    ]

    for (const { table, column } of tablesByUserId) {
      try {
        await supabase
          .from(table)
          .delete()
          .eq(column ?? 'user_id', userId)
      } catch {
        // Table inexistante ou bloquée par RLS: on continue (best-effort).
      }
    }

    // 2. Suppression du compte d'authentification (auth.users) via l'API admin
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId)
    if (authDeleteError) {
      return NextResponse.json(
        { error: `Suppression du compte d'authentification impossible: ${authDeleteError.message}` },
        { status: 500 }
      )
    }

    // 3. Suppression de la ligne public.users (si elle existe encore)
    await supabase
      .from('users')
      .delete()
      .eq('id', userId)

    return NextResponse.json({ data: { userId, deletedAt: new Date().toISOString(), permanent: true } }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'

    if (isClientAuthError(error)) {
      return NextResponse.json({ error: message }, { status: 401 })
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
