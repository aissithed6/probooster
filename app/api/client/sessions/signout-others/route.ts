import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertCustomer, isClientAuthError } from '../../_helpers/auth'
import { getSupabaseAdmin } from '../../../../../lib/supabase'

/**
 * POST /api/client/sessions/signout-others
 * Révoque les autres sessions (autres appareils) de l'utilisateur courant.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await assertCustomer(request)
    const supabase = getSupabaseAdmin()

    // Supabase Auth Admin permet de révoquer les refresh tokens.
    // Mode privilégié: 'others' (conserve la session courante), fallback: 'global'.
    const { error } = await (supabase as any).auth.admin.signOut(userId, 'others')

    if (error) {
      // fallback global si 'others' n'est pas supporté selon config/version.
      const { error: fallbackError } = await (supabase as any).auth.admin.signOut(userId)
      if (fallbackError) {
        return NextResponse.json({ error: fallbackError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ data: { ok: true } }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'

    if (isClientAuthError(error)) {
      return NextResponse.json({ error: message }, { status: 401 })
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
