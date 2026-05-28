import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertCustomer, isClientAuthError } from '../../_helpers/auth'
import { getSupabaseAdmin } from '../../../../../lib/supabase'

/**
 * POST /api/client/account/delete
 * Soft delete du compte client.
 * - Marque public.users.status='deleted' et renseigne deleted_at/deactivated_at
 * - Gèle les points loyalty_points (aucune suppression)
 * - Les données (commandes, messages, etc.) restent disponibles côté admin/super-admin.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await assertCustomer(request)
    const supabase = getSupabaseAdmin()

    const now = new Date().toISOString()

    const { error: userUpdateError } = await supabase
      .from('users')
      .update({
        status: 'deleted',
        deleted_at: now,
        deactivated_at: now,
        updated_at: now
      } as any)
      .eq('id', userId)

    if (userUpdateError) {
      return NextResponse.json({ error: userUpdateError.message }, { status: 500 })
    }

    // Geler les points (best-effort)
    await supabase
      .from('loyalty_points')
      .update({
        is_frozen: true,
        frozen_at: now,
        freeze_reason: 'account_deleted',
        updated_at: now
      } as any)
      .eq('user_id', userId)
      .then(() => null)
      .catch(() => null)

    return NextResponse.json({ data: { userId, deletedAt: now } }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'

    if (isClientAuthError(error)) {
      return NextResponse.json({ error: message }, { status: 401 })
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
