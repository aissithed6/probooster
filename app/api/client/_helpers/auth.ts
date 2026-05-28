import { cookies, headers } from 'next/headers'
import type { NextRequest } from 'next/server'

import { getSupabaseAdmin } from '../../../../lib/supabase'

/**
 * Vérifie que l'utilisateur courant est un client authentifié et retourne son identifiant.
 */
export async function assertCustomer(request?: NextRequest): Promise<string> {
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

  const { data: roleRow, error: roleError } = await supabase
    .from('users')
    .select('role,status,deleted_at,deactivated_at')
    .eq('id', userId)
    .single()

  if (roleError || !roleRow) {
    throw new Error("Impossible de vérifier le rôle de l'utilisateur.")
  }

  const status = String((roleRow as any)?.status ?? '').toLowerCase().trim()
  const deletedAt = (roleRow as any)?.deleted_at ?? null
  const deactivatedAt = (roleRow as any)?.deactivated_at ?? null
  if (status === 'deleted' || Boolean(deletedAt) || Boolean(deactivatedAt)) {
    throw new Error('Compte désactivé ou supprimé. Authentification requise.')
  }

  if (roleRow.role !== 'client') {
    throw new Error('Accès réservé aux clients authentifiés.')
  }

  return userId
}

/**
 * Détermine si une erreur provient d’un échec d’authentification côté client.
 */
export function isClientAuthError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  const message = error.message.toLowerCase()
  return (
    message.includes('token supabase manquant') ||
    message.includes('utilisateur introuvable') ||
    message.includes('token invalide') ||
    message.includes('accès réservé aux clients authentifiés') ||
    message.includes('authentification requise')
  )
}

/**
 * Extrait le jeton d'accès depuis les en-têtes ou les cookies disponibles.
 */
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
  const tokenFromRequestCookies = readTokenFromCookieStore(requestCookieStore)
  if (tokenFromRequestCookies) {
    return tokenFromRequestCookies
  }

  const serverCookiesStore = await cookies()
  return readTokenFromCookieStore(serverCookiesStore)
}

function readTokenFromCookieStore(store?: {
  get: (name: string) => { value: string } | undefined
  getAll?: () => Array<{ name: string; value: string }>
} | null): string | undefined {
  if (!store) {
    return undefined
  }

  const direct = store.get('sb-access-token')?.value
  if (direct) {
    return direct
  }

  const legacy = parseSupabaseAuthCookie(store.get('supabase-auth-token')?.value)
  if (legacy) {
    return legacy
  }

  const all = typeof store.getAll === 'function' ? store.getAll() : []
  for (const cookie of all) {
    const name = cookie?.name ?? ''
    if (!name) continue

    if (/^sb-.*-access-token$/i.test(name) && cookie.value) {
      return cookie.value
    }

    if (/^sb-.*-auth-token$/i.test(name) && cookie.value) {
      const parsed = parseSupabaseAuthCookie(cookie.value)
      if (parsed) {
        return parsed
      }
    }
  }

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
    // ignore decode errors
  }

  for (const candidate of attempts) {
    try {
      const parsed = JSON.parse(candidate)
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
