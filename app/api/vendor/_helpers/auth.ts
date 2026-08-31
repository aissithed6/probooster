import { cookies, headers } from 'next/headers'
import type { NextRequest } from 'next/server'

import { getSupabaseAdmin } from '@/lib/supabase'

/**
 * Vérifie que l'utilisateur courant est un vendeur et retourne son identifiant.
 */
export async function assertVendor(request?: NextRequest): Promise<string> {
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
    .select('role')
    .eq('id', userId)
    .single()

  if (roleError || !roleRow) {
    throw new Error("Impossible de vérifier le rôle de l'utilisateur.")
  }

  if (roleRow.role !== 'vendor') {
    throw new Error('Accès réservé aux vendeurs authentifiés.')
  }

  return userId
}

/**
 * Autorise les vendeurs OU les super admins (endpoints financiers partagés,
 * ex: programmations de paiement consultées par la trésorerie et les vendeurs).
 */
export async function assertVendorOrSuperAdmin(request?: NextRequest): Promise<string> {
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
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  const role = (roleRow?.role ?? '').toString().toLowerCase()
  const appMetaRole = ((authData.user.app_metadata as Record<string, unknown> | null)?.role ?? '').toString().toLowerCase()
  const allowed = new Set(['vendor', 'super_admin', 'superadmin', 'admin'])

  if (roleError && !role) {
    console.warn(`⚠️ Vérification du rôle échouée pour ${userId}:`, roleError)
  }

  if (!allowed.has(role) && !allowed.has(appMetaRole)) {
    throw new Error('Accès réservé aux vendeurs et administrateurs authentifiés.')
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

  const supabaseAuthCookieFromRequest = requestCookieStore?.get('supabase-auth-token')?.value
  const parsedFromRequest = parseSupabaseAuthCookie(supabaseAuthCookieFromRequest)
  if (parsedFromRequest) {
    return parsedFromRequest
  }

  const serverCookiesStore = await cookies()
  const serverToken = serverCookiesStore.get('sb-access-token')?.value
  if (serverToken) {
    return serverToken
  }

  const supabaseAuthCookie = serverCookiesStore.get('supabase-auth-token')?.value
  return parseSupabaseAuthCookie(supabaseAuthCookie)
}

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
