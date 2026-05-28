import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { getSupabaseAdmin } from '@/lib/supabase'

interface CreateChatSessionPayload {
  otherUserId: string
}

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
 * POST /api/chat/sessions
 * Crée ou récupère une session 1-to-1 (user_chats) pour l'utilisateur authentifié.
 * Réalisé côté serveur (service role) pour éviter les blocages RLS côté navigateur.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const accessToken = await extractAccessToken(request)

    if (!accessToken) {
      return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 })
    }

    const { data: authData, error: authError } = await supabase.auth.getUser(accessToken)
    if (authError || !authData?.user?.id) {
      return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 })
    }

    const userId = String(authData.user.id)

    const body = (await request.json().catch(() => null)) as CreateChatSessionPayload | null
    const rawOtherUserId = String(body?.otherUserId ?? '').trim()

    if (!UUID_REGEX.test(rawOtherUserId)) {
      return NextResponse.json({ error: 'Destinataire invalide.' }, { status: 400 })
    }

    // Normalisation: otherUserId peut être un users.id OU un user_profiles.id.
    // On convertit vers user_profiles.user_id si nécessaire.
    let otherUserId = rawOtherUserId
    const { data: directUser } = await supabase.from('users').select('id').eq('id', rawOtherUserId).maybeSingle()
    if (!directUser?.id) {
      const { data: profileLookup, error: profileError } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('id', rawOtherUserId)
        .maybeSingle()

      if (profileError) {
        return NextResponse.json({ error: profileError.message }, { status: 500 })
      }

      const mapped = String(profileLookup?.user_id ?? '').trim()
      if (mapped && UUID_REGEX.test(mapped)) {
        otherUserId = mapped
      }
    }

    if (otherUserId === userId) {
      return NextResponse.json({ error: 'Conversation invalide.' }, { status: 400 })
    }

    // Chercher une session existante (2 requêtes simples: beaucoup plus rapide qu'un OR complexe)
    const [existingA, existingB] = await Promise.all([
      supabase
        .from('user_chats')
        .select('*')
        .eq('participant1_id', userId)
        .eq('participant2_id', otherUserId)
        .maybeSingle(),
      supabase
        .from('user_chats')
        .select('*')
        .eq('participant1_id', otherUserId)
        .eq('participant2_id', userId)
        .maybeSingle()
    ])

    if (existingA.error) {
      return NextResponse.json({ error: existingA.error.message }, { status: 500 })
    }
    if (existingB.error) {
      return NextResponse.json({ error: existingB.error.message }, { status: 500 })
    }

    const existing = existingA.data ?? existingB.data
    if (existing) {
      return NextResponse.json({ data: existing }, { status: 200 })
    }

    const { data: created, error: createError } = await supabase
      .from('user_chats')
      .insert({
        participant1_id: userId,
        participant2_id: otherUserId,
        is_active: true,
        last_message_at: new Date().toISOString()
      })
      .select('*')
      .single()

    if (createError || !created) {
      return NextResponse.json({ error: createError?.message ?? 'Création de conversation échouée.' }, { status: 500 })
    }

    return NextResponse.json({ data: created }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
