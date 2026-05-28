import { cookies, headers } from 'next/headers'
import type { NextRequest } from 'next/server'

import { getSupabaseAdmin } from '../../../../lib/supabase'

/**
 * Vérifie que l'utilisateur courant est un livreur (role = driver) et retourne son identifiant.
 */
export async function assertDriver(request?: NextRequest): Promise<string> {
  const supabase = getSupabaseAdmin()
  const accessToken = await extractAccessToken(request)

  if (!accessToken) {
    throw new Error('Token Supabase manquant, accès refusé.')
  }

  const { data: authData, error } = await supabase.auth.getUser(accessToken)

  if (error || !authData?.user) {
    throw new Error('Utilisateur introuvable ou token invalide.')
  }

  const userId = authData.user.id

  const { data: roleRow, error: roleError } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  if (roleError || !roleRow) {
    throw new Error("Impossible de vérifier le rôle de l'utilisateur.")
  }

  if (roleRow.role !== 'driver') {
    throw new Error('Accès réservé aux livreurs authentifiés.')
  }

  return userId
}

async function extractAccessToken(request?: NextRequest): Promise<string | undefined> {
  const asyncHeaders = request ? request.headers : await headers()
  const bearerHeader = asyncHeaders.get('authorization') ?? undefined
  if (bearerHeader?.startsWith('Bearer ')) {
    const token = bearerHeader.slice(7).trim()
    if (token.length > 0) {
      return token
    }
  }

  const requestCookieStore = request ? request.cookies : undefined
  const tokenFromRequestCookies = requestCookieStore?.get('sb-access-token')?.value
  if (tokenFromRequestCookies) {
    return tokenFromRequestCookies
  }

  const requestDerivedToken = extractTokenFromCookieStore(requestCookieStore)
  if (requestDerivedToken) return requestDerivedToken

  const serverCookiesStore = await cookies()
  const serverToken = serverCookiesStore.get('sb-access-token')?.value
  if (serverToken) {
    return serverToken
  }

  return extractTokenFromCookieStore(serverCookiesStore)
}

/**
 * Extrait un access_token Supabase depuis un cookieStore Next.js.
 * Supporte:
 * - supabase-auth-token (format objet JSON)
 * - sb-access-token
 * - sb-<project-ref>-auth-token (auth-helpers, souvent au format tableau JSON)
 */
function extractTokenFromCookieStore(
  cookieStore?: { get: (name: string) => { value: string } | undefined }
): string | undefined {
  if (!cookieStore) return undefined

  const direct = cookieStore.get('supabase-auth-token')?.value
  const parsedDirect = parseSupabaseAuthCookie(direct)
  if (parsedDirect) return parsedDirect

  const allCookies = getAllCookiesFromStore(cookieStore)
  for (const [name, rawValue] of allCookies) {
    if (!rawValue) continue

    // Cookie standard de @supabase/auth-helpers-nextjs: sb-<project-ref>-auth-token
    if (name.startsWith('sb-') && name.endsWith('-auth-token')) {
      const parsed = parseSupabaseAuthCookie(rawValue)
      if (parsed) return parsed
    }

    // Certaines variantes existantes
    if (name === 'sb-access-token') {
      return rawValue
    }
  }

  return undefined
}

/**
 * Récupère les cookies pertinents.
 * NOTE: cookies() côté serveur expose souvent getAll(), mais request.cookies côté route handler peut ne pas l'avoir.
 */
function getAllCookiesFromStore(
  cookieStore: { get: (name: string) => { value: string } | undefined }
): Array<[string, string | undefined]> {
  const knownNames = ['supabase-auth-token', 'sb-access-token']
  const knownPairs: Array<[string, string | undefined]> = knownNames.map((n) => [n, cookieStore.get(n)?.value])

  // Next.js cookies() supporte getAll(), mais request.cookies non; on tente sans casser.
  const anyStore = cookieStore as unknown as { getAll?: () => Array<{ name: string; value: string }> }
  if (typeof anyStore.getAll === 'function') {
    try {
      const all = anyStore.getAll()
      const sbLike = all
        .filter((c) => c?.name && (c.name.startsWith('sb-') || c.name === 'supabase-auth-token' || c.name === 'sb-access-token'))
        .map((c) => [c.name, c.value] as [string, string])
      return [...knownPairs, ...sbLike]
    } catch {
      return knownPairs
    }
  }

  return knownPairs
}

/**
 * Parse un cookie d'auth Supabase et retourne l'access_token.
 * Supporte:
 * - objet JSON { currentSession: { access_token } }
 * - tableau JSON [access_token, refresh_token, ...] (auth-helpers)
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
    // ignore decode errors
  }

  for (const candidate of attempts) {
    try {
      const parsed = JSON.parse(candidate)

      // Format "tableau": [access_token, refresh_token, ...] (auth-helpers)
      if (Array.isArray(parsed)) {
        const tokenCandidate = parsed[0]
        if (typeof tokenCandidate === 'string' && tokenCandidate.length > 0) {
          return tokenCandidate
        }
      }

      // Format "objet"
      const token: unknown = parsed?.currentSession?.access_token ?? parsed?.currentAccessToken ?? parsed?.access_token
      if (typeof token === 'string' && token.length > 0) {
        return token
      }
    } catch {
      // ignore JSON parse errors
    }
  }

  return undefined
}
