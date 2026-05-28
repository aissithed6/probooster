import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertCustomer, isClientAuthError } from '../../_helpers/auth'
import { getSupabaseAdmin } from '../../../../../lib/supabase'

/**
 * POST /api/client/profile/sync-email
 * Aligne automatiquement public.users.email sur l'email effectif côté Supabase Auth.
 * Utile quand l'email nécessite une confirmation: dès que l'email Auth est mis à jour,
 * cet endpoint peut être appelé pour synchroniser la DB interne.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await assertCustomer(request)
    const supabase = getSupabaseAdmin()

    const accessToken = request.headers.get('authorization')?.startsWith('Bearer ')
      ? request.headers.get('authorization')?.slice(7).trim()
      : undefined

    // On préfère relire l'utilisateur Auth via le token plutôt que de faire confiance au body.
    if (!accessToken) {
      return NextResponse.json({ error: 'Token Supabase manquant, accès refusé.' }, { status: 401 })
    }

    const { data: authData, error: authError } = await supabase.auth.getUser(accessToken)
    if (authError || !authData?.user?.email) {
      return NextResponse.json({ error: authError?.message ?? 'Email Auth introuvable.' }, { status: 401 })
    }

    const email = String(authData.user.email).trim()
    if (!email) {
      return NextResponse.json({ error: 'Email Auth introuvable.' }, { status: 400 })
    }

    const { error: usersError } = await supabase
      .from('users')
      .update({ email, updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (usersError) {
      return NextResponse.json({ error: usersError.message }, { status: 500 })
    }

    return NextResponse.json({ data: { email } }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'

    if (isClientAuthError(error)) {
      return NextResponse.json({ error: message }, { status: 401 })
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
