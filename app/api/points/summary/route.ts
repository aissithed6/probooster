import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies, headers } from 'next/headers'

import { getSupabaseAdmin } from '../../../../lib/supabase'

/**
 * GET /api/points/summary
 * Retourne un résumé des points pour l'utilisateur authentifié (tous rôles).
 * Source de vérité:
 * - loyalty_points (nouveau système)
 * - fallback users.points_balance (legacy affiché côté super-admin)
 * - fallback user_points.points (ancienne table)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const accessToken = await extractAccessToken(request)

    if (!accessToken) {
      return NextResponse.json({ error: 'Token Supabase manquant, accès refusé.' }, { status: 401 })
    }

    const { data: authData, error: authError } = await supabase.auth.getUser(accessToken)

    if (authError || !authData?.user) {
      return NextResponse.json({ error: 'Utilisateur introuvable ou token invalide.' }, { status: 401 })
    }

    const userId = authData.user.id

    const { data: loyaltyRow } = await supabase
      .from('loyalty_points')
      .select('points_balance, points_spent, fcfa_value, is_frozen, freeze_reason')
      .eq('user_id', userId)
      .maybeSingle()

    const loyaltyBalance = Number((loyaltyRow as any)?.points_balance ?? 0)
    const hasLoyaltyBalance = Number.isFinite(loyaltyBalance) && loyaltyBalance > 0

    let balance = hasLoyaltyBalance ? loyaltyBalance : 0
    let pointsSpent = Number((loyaltyRow as any)?.points_spent ?? 0)
    let fcfaValue = Number((loyaltyRow as any)?.fcfa_value ?? 0)
    const isFrozen = Boolean((loyaltyRow as any)?.is_frozen ?? false)
    const freezeReason = ((loyaltyRow as any)?.freeze_reason ?? null) as string | null

    if (!Number.isFinite(pointsSpent) || pointsSpent < 0) pointsSpent = 0
    if (!Number.isFinite(fcfaValue) || fcfaValue < 0) fcfaValue = 0

    if (!hasLoyaltyBalance) {
      const { data: userRow, error: userError } = await supabase
        .from('users')
        .select('points_balance')
        .eq('id', userId)
        .maybeSingle()

      const legacyUserBalance = Number((userRow as any)?.points_balance ?? 0)
      if (!userError && Number.isFinite(legacyUserBalance) && legacyUserBalance >= 0) {
        balance = legacyUserBalance
      }
    }

    if (!hasLoyaltyBalance && (!Number.isFinite(balance) || balance <= 0)) {
      const { data: legacyPointsRow, error: legacyError } = await supabase
        .from('user_points')
        .select('points, fcfa_value')
        .eq('user_id', userId)
        .maybeSingle()

      const legacyPoints = Number((legacyPointsRow as any)?.points ?? 0)
      const legacyFcfa = Number((legacyPointsRow as any)?.fcfa_value ?? 0)

      if (!legacyError && Number.isFinite(legacyPoints) && legacyPoints >= 0) {
        balance = legacyPoints
      }

      if (!legacyError && Number.isFinite(legacyFcfa) && legacyFcfa >= 0 && fcfaValue === 0) {
        fcfaValue = legacyFcfa
      }
    }

    return NextResponse.json({
      data: {
        balance: Number.isFinite(balance) && balance >= 0 ? balance : 0,
        pointsSpent: Number.isFinite(pointsSpent) && pointsSpent >= 0 ? pointsSpent : 0,
        fcfaValue: Number.isFinite(fcfaValue) && fcfaValue >= 0 ? fcfaValue : 0,
        isFrozen,
        freezeReason
      }
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const lower = message.toLowerCase()
    const status =
      lower.includes('token supabase manquant') ||
      lower.includes('utilisateur introuvable') ||
      lower.includes('token invalide')
        ? 401
        : 500

    return NextResponse.json({ error: message }, { status })
  }
}

async function extractAccessToken(request: NextRequest): Promise<string | undefined> {
  const bearerHeader = request.headers.get('authorization') ?? undefined
  if (bearerHeader?.startsWith('Bearer ')) {
    const token = bearerHeader.slice(7).trim()
    if (token.length > 0) {
      return token
    }
  }

  const directCookie = request.cookies.get('sb-access-token')?.value
  if (directCookie) {
    return directCookie
  }

  const parsedFromCookies = extractTokenFromCookieStore(request.cookies)
  if (parsedFromCookies) {
    return parsedFromCookies
  }

  const serverCookiesStore = await cookies()
  const serverDirect = serverCookiesStore.get('sb-access-token')?.value
  if (serverDirect) {
    return serverDirect
  }

  const parsedServer = extractTokenFromCookieStore(serverCookiesStore)
  if (parsedServer) {
    return parsedServer
  }

  const serverHeaders = await headers()
  const serverBearer = serverHeaders.get('authorization') ?? undefined
  if (serverBearer?.startsWith('Bearer ')) {
    const token = serverBearer.slice(7).trim()
    if (token.length > 0) {
      return token
    }
  }

  return undefined
}

function extractTokenFromCookieStore(store: {
  get: (name: string) => { value: string } | undefined
  getAll?: () => Array<{ name: string; value: string }>
}): string | undefined {
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
