import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { getSupabaseAdmin } from '@/lib/supabase'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * Extrait un token Supabase depuis l'en-tête Authorization ou depuis les cookies.
 */
async function extractAccessToken(request: NextRequest): Promise<string | undefined> {
  const bearerHeader = request.headers.get('authorization') ?? undefined
  if (bearerHeader?.startsWith('Bearer ')) {
    const token = bearerHeader.slice(7).trim()
    if (token.length > 0) return token
  }

  const direct = request.cookies.get('sb-access-token')?.value
  if (direct) return direct

  const all = request.cookies.getAll?.() ?? []
  for (const cookie of all) {
    const name = cookie?.name ?? ''
    const value = cookie?.value ?? ''
    if (!name || !value) continue

    if (/^sb-.*-access-token$/i.test(name)) {
      return value
    }

    if (/^sb-.*-auth-token$/i.test(name)) {
      const parsed = parseSupabaseAuthCookie(value)
      if (parsed) return parsed
    }
  }

  const legacy = parseSupabaseAuthCookie(request.cookies.get('supabase-auth-token')?.value)
  if (legacy) return legacy

  return undefined
}

/**
 * Analyse le cookie d'authentification Supabase pour récupérer un jeton d'accès valide.
 */
function parseSupabaseAuthCookie(rawValue?: string): string | undefined {
  if (!rawValue) {
    return undefined
  }

  const attempts = [rawValue]
  try {
    const decoded = decodeURIComponent(rawValue)
    if (decoded !== rawValue) {
      attempts.push(decoded)
    }
  } catch {
    // ignore
  }

  for (const candidate of attempts) {
    try {
      const parsed = JSON.parse(candidate)
      const token: unknown = parsed?.currentSession?.access_token ?? parsed?.currentAccessToken ?? parsed?.access_token
      if (typeof token === 'string' && token.length > 0) {
        return token
      }
    } catch {
      // ignore
    }
  }

  return undefined
}

/**
 * GET /api/chat/participants?userId=UUID
 * Retourne des infos minimales d'un participant (name/avatar/role) côté serveur.
 */
export async function GET(request: NextRequest) {
  try {
    const accessToken = await extractAccessToken(request)
    if (!accessToken) {
      return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()
    const { data: authData, error: authError } = await supabase.auth.getUser(accessToken)
    if (authError || !authData?.user?.id) {
      return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 })
    }

    const url = new URL(request.url)
    const userId = String(url.searchParams.get('userId') ?? '').trim()
    if (!UUID_REGEX.test(userId)) {
      return NextResponse.json({ error: 'userId invalide.' }, { status: 400 })
    }

    const [{ data: userRow, error: userError }, { data: profileRow, error: profileError }] = await Promise.all([
      supabase.from('users').select('id, email, role').eq('id', userId).maybeSingle(),
      supabase.from('user_profiles').select('first_name, last_name, avatar_url').eq('user_id', userId).maybeSingle()
    ])

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 })
    }

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    const firstName = String((profileRow as any)?.first_name ?? '').trim()
    const lastName = String((profileRow as any)?.last_name ?? '').trim()
    const fullName = `${firstName} ${lastName}`.trim()

    const email = String((userRow as any)?.email ?? '').trim()
    const role = String((userRow as any)?.role ?? '').trim() || 'client'

    const fallbackName = email || role || 'Utilisateur'
    const name = fullName.length > 0 ? fullName : fallbackName

    return NextResponse.json(
      {
        data: {
          id: userId,
          name,
          avatar_url: ((profileRow as any)?.avatar_url as string | null) || undefined,
          role
        }
      },
      { status: 200 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
