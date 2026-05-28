import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertCustomer, isClientAuthError } from '../../_helpers/auth'
import { getSupabaseAdmin } from '../../../../../lib/supabase'

type ProfileUpdateBody = {
  fullName?: string
  phone?: string
  country?: string
  address?: string
  email?: string
}

function splitFullName(fullName: string): { first_name: string; last_name: string } {
  const normalized = String(fullName ?? '').trim().replace(/\s+/g, ' ')
  if (!normalized) {
    return { first_name: '', last_name: '' }
  }
  const parts = normalized.split(' ')
  if (parts.length === 1) {
    return { first_name: parts[0], last_name: '' }
  }
  return {
    first_name: parts.slice(0, -1).join(' '),
    last_name: parts.slice(-1).join(' ')
  }
}

/**
 * POST /api/client/profile/update
 * Met à jour le profil client dans public.user_profiles.
 * Synchronise l'email dans public.users (cohérence) si fourni.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await assertCustomer(request)
    const supabase = getSupabaseAdmin()

    const body = (await request.json().catch(() => null)) as ProfileUpdateBody | null
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Corps de requête invalide.' }, { status: 400 })
    }

    const fullName = typeof body.fullName === 'string' ? body.fullName : ''
    const phone = typeof body.phone === 'string' ? body.phone : ''
    const country = typeof body.country === 'string' ? body.country : ''
    const address = typeof body.address === 'string' ? body.address : ''
    const email = typeof body.email === 'string' ? body.email.trim() : ''

    const nameParts = splitFullName(fullName)
    if (!nameParts.first_name.trim()) {
      return NextResponse.json({ error: 'Le nom complet est requis.' }, { status: 400 })
    }

    // 1) Mise à jour du profil
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({
        first_name: nameParts.first_name.trim(),
        last_name: nameParts.last_name.trim(),
        phone: phone.trim() || null,
        country: country.trim() || null,
        address: address.trim() || null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    // 2) Email: uniquement public.users (si fourni).
    // L'email côté auth.users doit être géré via supabase.auth.updateUser({ email }) côté client.
    if (email) {
      const { error: usersError } = await supabase
        .from('users')
        .update({ email, updated_at: new Date().toISOString() })
        .eq('id', userId)

      if (usersError) {
        return NextResponse.json({ error: usersError.message }, { status: 500 })
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
