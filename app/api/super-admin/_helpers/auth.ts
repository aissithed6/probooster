import { cookies, headers } from 'next/headers'
import type { NextRequest } from 'next/server'

import { getSupabaseAdmin } from '@/lib/supabase'

/**
 * Vérifie que l'utilisateur courant est un super administrateur.
 * Retourne l'identifiant utilisateur si la vérification réussit.
 */
export async function assertSuperAdmin(request?: NextRequest): Promise<string> {
  const supabase = getSupabaseAdmin()
  const accessToken = await extractAccessToken(request)

  if (!accessToken) {
    throw new Error('Token Supabase manquant, accès refusé.')
  }

  const { data: authData, error } = await supabase.auth.getUser(accessToken)

  if (error || !authData?.user) {
    throw new Error("Utilisateur introuvable ou token invalide.")
  }

  const userId = authData.user.id

  const roleCandidates: string[] = []

  const { data: roleRow, error: roleError } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  if (roleError) {
    console.warn(`⚠️ Vérification du rôle (table users) échouée pour ${userId}:`, roleError)
  }

  if (roleRow?.role) {
    roleCandidates.push(roleRow.role)
  }

  const appMeta = authData.user.app_metadata ?? {}
  const userMeta = authData.user.user_metadata ?? {}

  const candidateValues = [
    appMeta.role,
    userMeta.role,
    userMeta.account_type,
    userMeta.primary_role,
    ...(Array.isArray(appMeta.roles) ? appMeta.roles : [])
  ]

  candidateValues.forEach((value) => {
    if (typeof value === 'string' && value.length > 0) {
      roleCandidates.push(value)
    }
  })

  const normalizedRole = roleCandidates
    .map((role) => role.toLowerCase().replace(/-/g, '_'))
    .find((role) => role === 'super_admin' || role === 'admin')

  if (!normalizedRole) {
    throw new Error("Impossible de vérifier le rôle de l'utilisateur.")
  }

  if (normalizedRole !== 'super_admin' && normalizedRole !== 'admin') {
    throw new Error('Accès réservé au super administrateur.')
  }

  return userId
}

/**
 * Vérifie que l'utilisateur courant est super administrateur OU membre du service commandes & livraisons.
 * Retourne l'identifiant utilisateur si la vérification réussit.
 */
export async function assertOpsOrSuperAdmin(request?: NextRequest): Promise<string> {
  const supabase = getSupabaseAdmin()
  const accessToken = await extractAccessToken(request)

  if (!accessToken) {
    throw new Error('Token Supabase manquant, accès refusé.')
  }

  const { data: authData, error } = await supabase.auth.getUser(accessToken)

  if (error || !authData?.user) {
    throw new Error("Utilisateur introuvable ou token invalide.")
  }

  const userId = authData.user.id
  const roleCandidates: string[] = []

  const { data: roleRow, error: roleError } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  if (roleError) {
    console.warn(`⚠️ Vérification du rôle (table users) échouée pour ${userId}:`, roleError)
  }

  if (roleRow?.role) {
    roleCandidates.push(roleRow.role)
  }

  const appMeta = authData.user.app_metadata ?? {}
  const userMeta = authData.user.user_metadata ?? {}

  const candidateValues = [
    appMeta.role,
    userMeta.role,
    userMeta.account_type,
    userMeta.primary_role,
    ...(Array.isArray(appMeta.roles) ? appMeta.roles : [])
  ]

  candidateValues.forEach((value) => {
    if (typeof value === 'string' && value.length > 0) {
      roleCandidates.push(value)
    }
  })

  const normalizedRole = roleCandidates
    .map((role) => role.toLowerCase().replace(/-/g, '_'))
    .find((role) => role === 'super_admin' || role === 'ops')

  if (!normalizedRole) {
    throw new Error("Impossible de vérifier le rôle de l'utilisateur.")
  }

  if (normalizedRole !== 'super_admin' && normalizedRole !== 'ops') {
    throw new Error('Accès réservé au super administrateur ou au service commandes & livraisons.')
  }

  return userId
}

async function extractAccessToken(request?: NextRequest): Promise<string | undefined> {
  const requestHeaders = request?.headers
  const requestBearerHeader = requestHeaders?.get('authorization') ?? undefined
  const bearerHeader = requestBearerHeader ?? (await headers()).get('authorization') ?? undefined
  if (bearerHeader?.startsWith('Bearer ')) {
    const token = bearerHeader.slice(7).trim()
    if (token.length > 0) {
      return token
    }
  }

  /**
   * Extrait un cookie depuis l'en-tête brut "cookie" (fallback si request.cookies ne remonte pas les cookies).
   */
  const getCookieFromHeader = (cookieHeader: string, name: string): string | undefined => {
    const pattern = `(?:^|; )${name.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}=`
    const match = cookieHeader.match(new RegExp(pattern))
    if (!match) return undefined
    const start = match.index! + match[0].length
    const end = cookieHeader.indexOf(';', start)
    const raw = cookieHeader.slice(start, end === -1 ? cookieHeader.length : end)
    try {
      return decodeURIComponent(raw)
    } catch {
      return raw
    }
  }

  // Certaines configurations Next.js ne reflètent pas toujours le header cookie dans request.headers.
  // On tente donc d'abord request.headers, puis next/headers().
  const cookieHeaderRaw = requestHeaders?.get('cookie') ?? (await headers()).get('cookie') ?? ''
  if (cookieHeaderRaw) {
    const legacyToken = getCookieFromHeader(cookieHeaderRaw, 'sb-access-token')
    if (legacyToken) return legacyToken

    const legacyAuth = getCookieFromHeader(cookieHeaderRaw, 'supabase-auth-token')
    const parsedLegacyAuth = parseSupabaseAuthCookie(legacyAuth)
    if (parsedLegacyAuth) return parsedLegacyAuth

    const cookiePairs = cookieHeaderRaw.split(';').map((x) => x.trim()).filter(Boolean)
    for (const pair of cookiePairs) {
      const eqIndex = pair.indexOf('=')
      if (eqIndex <= 0) continue
      const name = pair.slice(0, eqIndex)
      const value = pair.slice(eqIndex + 1)
      if (!name || !value) continue

      if (name.startsWith('sb-') && name.endsWith('-access-token')) {
        try {
          return decodeURIComponent(value)
        } catch {
          return value
        }
      }

      if (name.startsWith('sb-') && name.endsWith('-auth-token')) {
        const decoded = (() => {
          try {
            return decodeURIComponent(value)
          } catch {
            return value
          }
        })()
        const parsed = parseSupabaseAuthCookie(decoded)
        if (parsed) return parsed
      }
    }
  }

  const requestCookieStore = request ? request.cookies : undefined
  const tokenFromRequestCookies = requestCookieStore?.get('sb-access-token')?.value
  if (tokenFromRequestCookies) {
    return tokenFromRequestCookies
  }

  const supabaseAuthCookieFromRequest = requestCookieStore?.get('supabase-auth-token')?.value
  const parsedFromRequest = parseSupabaseAuthCookie(supabaseAuthCookieFromRequest)
  if (parsedFromRequest) {
    return parsedFromRequest
  }

  // Supporte les cookies Supabase modernes (ex: sb-<project_ref>-auth-token / sb-<project_ref>-access-token)
  if (requestCookieStore) {
    try {
      const allCookies = typeof (requestCookieStore as any).getAll === 'function' ? (requestCookieStore as any).getAll() : []
      for (const cookie of allCookies as Array<{ name: string; value: string }>) {
        const name = cookie?.name ?? ''
        const value = cookie?.value
        if (!name || typeof value !== 'string' || value.length === 0) continue

        if (name.startsWith('sb-') && name.endsWith('-access-token')) {
          return value
        }

        if (name.startsWith('sb-') && name.endsWith('-auth-token')) {
          const parsed = parseSupabaseAuthCookie(value)
          if (parsed) return parsed
        }
      }
    } catch {
      // ignore cookie enumeration errors
    }
  }

  // Fallback robuste: lecture via next/headers (fiable dans le contexte des route handlers).
  const serverCookiesStore = await cookies()
  const serverToken = serverCookiesStore.get('sb-access-token')?.value
  if (serverToken) {
    return serverToken
  }

  const supabaseAuthCookie = serverCookiesStore.get('supabase-auth-token')?.value

  const parsedServer = parseSupabaseAuthCookie(supabaseAuthCookie)
  if (parsedServer) return parsedServer

  // Fallback server: scanne aussi les cookies Supabase modernes
  try {
    const allServerCookies = (serverCookiesStore as any).getAll?.() ?? []
    for (const cookie of allServerCookies as Array<{ name: string; value: string }>) {
      const name = cookie?.name ?? ''
      const value = cookie?.value
      if (!name || typeof value !== 'string' || value.length === 0) continue

      if (name.startsWith('sb-') && name.endsWith('-access-token')) {
        return value
      }

      if (name.startsWith('sb-') && name.endsWith('-auth-token')) {
        const parsed = parseSupabaseAuthCookie(value)
        if (parsed) return parsed
      }
    }
  } catch {
    // ignore
  }

  return undefined
}

function parseSupabaseAuthCookie(rawValue?: string): string | undefined {
  if (!rawValue) {
    return undefined
  }

  // Si c'est déjà un JWT brut (xxx.yyy.zzz), on le retourne tel quel.
  if (/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(rawValue.trim())) {
    return rawValue.trim()
  }

  const attempts = [rawValue]

  try {
    const decoded = decodeURIComponent(rawValue)
    if (decoded !== rawValue) {
      attempts.push(decoded)
    }
  } catch {
    // ignore decode errors
  }

  // Supporte les valeurs Supabase préfixées par "base64-".
  // Le contenu base64 est généralement un JSON contenant access_token.
  const base64Candidates = [...attempts]
  for (const candidate of base64Candidates) {
    const trimmed = candidate.trim()
    if (trimmed.startsWith('base64-')) {
      const base64 = trimmed.slice('base64-'.length)
      try {
        const decoded = Buffer.from(base64, 'base64').toString('utf8')
        if (decoded && !attempts.includes(decoded)) {
          attempts.push(decoded)
        }
      } catch {
        // ignore base64 errors
      }
    }
  }

  for (const candidate of attempts) {
    try {
      const parsed = JSON.parse(candidate)

      // Ancien format possible: [access_token, refresh_token, ...]
      if (Array.isArray(parsed) && typeof parsed[0] === 'string' && parsed[0].length > 0) {
        return parsed[0]
      }

      const token: unknown =
        parsed?.currentSession?.access_token ??
        parsed?.currentAccessToken ??
        parsed?.access_token ??
        parsed?.session?.access_token
      if (typeof token === 'string' && token.length > 0) {
        return token
      }
    } catch {
      // ignore JSON parse errors
    }
  }

  return undefined
}
