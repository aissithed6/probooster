import { NextRequest, NextResponse } from 'next/server'

import { getSupabaseAdmin } from '@/lib/supabase'

type TransferRecipient = {
  id: string
  userId: string
  fullName: string
  email: string
  phone: string | null
  username: string | null
  shortCode: string | null
}

/**
 * Extrait un access token Supabase depuis Authorization: Bearer ou cookie sb-access-token / supabase-auth-token.
 */
function extractAccessToken(request: NextRequest): string | undefined {
  const bearerHeader = request.headers.get('authorization') ?? undefined
  if (bearerHeader?.startsWith('Bearer ')) {
    const token = bearerHeader.slice(7).trim()
    if (token.length > 0) {
      return token
    }
  }

  const tokenFromCookie = request.cookies.get('sb-access-token')?.value
  if (tokenFromCookie) {
    return tokenFromCookie
  }

  // Supporte les cookies Supabase modernes: sb-<project-ref>-auth-token
  const sbAuthCookie = request.cookies
    .getAll()
    .find((cookie) => cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token'))
    ?.value
  if (sbAuthCookie) {
    try {
      const decoded = decodeURIComponent(sbAuthCookie)
      const parsed = JSON.parse(decoded)
      const token: unknown = parsed?.access_token ?? parsed?.currentSession?.access_token ?? parsed?.currentAccessToken
      if (typeof token === 'string' && token.length > 0) {
        return token
      }
    } catch {
      try {
        const parsed = JSON.parse(sbAuthCookie)
        const token: unknown = parsed?.access_token ?? parsed?.currentSession?.access_token ?? parsed?.currentAccessToken
        if (typeof token === 'string' && token.length > 0) {
          return token
        }
      } catch {
        // ignore
      }
    }
  }

  const supabaseAuthCookie = request.cookies.get('supabase-auth-token')?.value
  if (!supabaseAuthCookie) {
    return undefined
  }

  try {
    const decoded = decodeURIComponent(supabaseAuthCookie)
    const parsed = JSON.parse(decoded)
    const token: unknown = parsed?.currentSession?.access_token ?? parsed?.currentAccessToken ?? parsed?.access_token
    return typeof token === 'string' && token.length > 0 ? token : undefined
  } catch {
    try {
      const parsed = JSON.parse(supabaseAuthCookie)
      const token: unknown = parsed?.currentSession?.access_token ?? parsed?.currentAccessToken ?? parsed?.access_token
      return typeof token === 'string' && token.length > 0 ? token : undefined
    } catch {
      return undefined
    }
  }
}

/**
 * GET: Recherche des destinataires (user_profiles + users.email) pour transfert.
 * Query param: query=...
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = (searchParams.get('query') || '').trim()

  if (!query) {
    return NextResponse.json({ rows: [] satisfies TransferRecipient[] })
  }

  const accessToken = extractAccessToken(request)
  if (!accessToken) {
    return NextResponse.json({ error: 'Token Supabase manquant, accès refusé.' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()

  try {
    const { data: authUser, error: authErr } = await supabase.auth.getUser(accessToken)
    if (authErr) {
      return NextResponse.json({ error: authErr.message || 'Accès refusé.' }, { status: 401 })
    }

    const requesterId = authUser?.user?.id
    if (!requesterId) {
      return NextResponse.json({ error: 'Utilisateur introuvable.' }, { status: 404 })
    }

    const normalizedQuery = query
    const escapeValue = (value: string) => value.replace(/,/g, '').replace(/'/g, "''")
    const sanitizedDigits = normalizedQuery.replace(/[^\d+]/g, '')
    const isUuid = /^[0-9a-fA-F-]{8}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{12}$/.test(normalizedQuery)

    const userFilters = [`email.ilike.%${escapeValue(normalizedQuery)}%`]
    if (isUuid) {
      userFilters.push(`id.eq.${normalizedQuery}`)
    }

    const usersById = new Map<string, { id: string; email: string; role?: string }>()
    if (userFilters.length > 0) {
      const { data: userRows, error: usersError } = await supabase
        .from('users')
        .select('id, email, role')
        .or(userFilters.join(','))
        .limit(25)

      if (usersError) {
        return NextResponse.json({ error: usersError.message }, { status: 500 })
      }

      ;(userRows || []).forEach((user: any) => {
        usersById.set(user.id, { id: user.id, email: user.email, role: user.role })
      })
    }

    const emailMatchedIds = Array.from(usersById.keys())

    const profileFilters = [
      `first_name.ilike.%${escapeValue(normalizedQuery)}%`,
      `last_name.ilike.%${escapeValue(normalizedQuery)}%`
    ]

    if (sanitizedDigits.length >= 3) {
      profileFilters.push(`phone.ilike.%${sanitizedDigits}%`)
    }

    if (isUuid) {
      profileFilters.push(`id.eq.${normalizedQuery}`)
      profileFilters.push(`user_id.eq.${normalizedQuery}`)
    }

    if (emailMatchedIds.length > 0) {
      profileFilters.push(`user_id.in.(${emailMatchedIds.join(',')})`)
    }

    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, user_id, first_name, last_name, phone, short_code')
      .or(profileFilters.join(','))
      .limit(10)

    if (profilesError) {
      return NextResponse.json({ error: profilesError.message }, { status: 500 })
    }

    const userIds = (profiles || []).map((p: any) => p.user_id).filter(Boolean)
    const missingUserIds = userIds.filter((id: string) => !usersById.has(id))

    if (missingUserIds.length > 0) {
      const { data: additionalUsers, error: additionalUsersError } = await supabase
        .from('users')
        .select('id, email, role')
        .in('id', missingUserIds)

      if (additionalUsersError) {
        return NextResponse.json({ error: additionalUsersError.message }, { status: 500 })
      }

      ;(additionalUsers || []).forEach((user: any) => {
        usersById.set(user.id, { id: user.id, email: user.email, role: user.role })
      })
    }

    const rows: TransferRecipient[] = (profiles || [])
      .filter((p: any) => String(p.user_id) !== requesterId)
      .map((profile: any) => {
        const user = usersById.get(profile.user_id)
        const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
        return {
          id: String(profile.id),
          userId: String(profile.user_id),
          fullName: fullName || user?.email || profile.phone || `Profil ${String(profile.id).slice(0, 8)}`,
          email: user?.email || '',
          phone: profile.phone ?? null,
          username: null,
          shortCode: profile.short_code ?? null
        }
      })

    return NextResponse.json({ rows })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Erreur lors de la recherche.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
