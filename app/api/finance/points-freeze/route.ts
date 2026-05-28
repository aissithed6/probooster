import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

type FreezePointsInput = {
  userId: string
  isFrozen: boolean
  reason?: string
  points?: number
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
 * Construit un client Supabase "user-scoped" pour exécuter une RPC avec auth.uid().
 */
function getSupabaseUserClient(accessToken: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Configuration Supabase manquante (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).')
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  })
}

/**
 * POST: Gèle ou dégèle les points d'un utilisateur (Super Admin).
 *
 * Implémentation:
 * - Vérifie le rôle via assertSuperAdmin
 * - Appelle la RPC public.set_points_freeze_status (security definer) avec un token utilisateur (pour auth.uid())
 */
export async function POST(request: NextRequest) {
  try {
    await assertSuperAdmin(request)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Accès refusé.' },
      { status: 401 }
    )
  }

  let body: Partial<FreezePointsInput> = {}

  try {
    body = (await request.json()) as Partial<FreezePointsInput>
  } catch {
    return NextResponse.json({ error: 'Corps de requête JSON invalide.' }, { status: 400 })
  }

  const providedId = body.userId ? String(body.userId) : ''
  const isFrozen = Boolean(body.isFrozen)
  const reason = typeof body.reason === 'string' ? body.reason.trim() : ''
  const pointsRaw = (body as any)?.points
  const pointsParsed = pointsRaw === undefined || pointsRaw === null || pointsRaw === '' ? undefined : Number(pointsRaw)
  const points = pointsParsed === undefined ? undefined : pointsParsed

  if (!providedId) {
    return NextResponse.json({ error: 'Identifiant utilisateur manquant.' }, { status: 400 })
  }

  if (points !== undefined) {
    if (!Number.isFinite(points) || !Number.isInteger(points) || points <= 0) {
      return NextResponse.json({ error: 'Le nombre de points doit être un entier positif.' }, { status: 400 })
    }
  }

  const accessToken = extractAccessToken(request)
  if (!accessToken) {
    return NextResponse.json({ error: 'Token Supabase manquant, accès refusé.' }, { status: 401 })
  }

  const supabaseAdmin = getSupabaseAdmin()

  try {
    const { data: profileRow } = await supabaseAdmin
      .from('user_profiles')
      .select('user_id')
      .eq('id', providedId)
      .maybeSingle()

    const userId = profileRow?.user_id ? String(profileRow.user_id) : providedId

    const { data: currentLoyaltyRow, error: currentLoyaltyErr } = await supabaseAdmin
      .from('loyalty_points')
      .select('points_balance, frozen_points, is_frozen')
      .eq('user_id', userId)
      .maybeSingle()

    if (currentLoyaltyErr) {
      throw currentLoyaltyErr
    }

    const currentFrozenPoints = Number((currentLoyaltyRow as any)?.frozen_points ?? 0)
    const currentPointsBalance = Number((currentLoyaltyRow as any)?.points_balance ?? 0)
    const currentIsFrozen = Boolean((currentLoyaltyRow as any)?.is_frozen ?? false)

    if (!isFrozen) {
      if (!Number.isFinite(currentFrozenPoints) || currentFrozenPoints <= 0 || !currentIsFrozen) {
        return NextResponse.json(
          { error: "Aucun point n'était gelé pour cet utilisateur. Vous ne pouvez pas dégeler." },
          { status: 409 }
        )
      }
    } else {
      // Gel total (sans points spécifiés) : refuse si rien à geler.
      if (points === undefined) {
        if (!Number.isFinite(currentPointsBalance) || currentPointsBalance <= 0) {
          return NextResponse.json(
            { error: "Aucun point disponible à geler pour cet utilisateur." },
            { status: 409 }
          )
        }
      }
    }

    const { data: userRow, error: userErr } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle()

    if (userErr) {
      throw userErr
    }

    if (!userRow?.id) {
      return NextResponse.json({ error: 'Utilisateur introuvable.' }, { status: 404 })
    }

    const supabaseUser = getSupabaseUserClient(accessToken)

    const { error: rpcError } = await supabaseUser.rpc('set_points_freeze_status', {
      p_target_id: userId,
      p_is_frozen: isFrozen,
      p_reason: reason || null,
      p_points: points ?? null
    })

    if (rpcError) {
      const message = rpcError.message || 'Erreur lors de la mise à jour du gel.'
      return NextResponse.json({ error: message }, { status: 400 })
    }

    const { data: loyaltyRow } = await supabaseAdmin
      .from('loyalty_points')
      .select('is_frozen, frozen_at, frozen_by, freeze_reason, points_balance, frozen_points')
      .eq('user_id', userId)
      .maybeSingle()

    const resolvedIsFrozen = Boolean((loyaltyRow as any)?.is_frozen ?? false)
    if (resolvedIsFrozen !== isFrozen) {
      return NextResponse.json(
        {
          error: `La mise à jour du gel n'a pas été appliquée (attendu: ${isFrozen ? 'gelé' : 'dégelé'} • reçu: ${resolvedIsFrozen ? 'gelé' : 'dégelé'}). Vérifiez la RPC set_points_freeze_status, les droits Supabase (RLS) et le rôle super_admin.`
        },
        { status: 409 }
      )
    }

    return NextResponse.json({
      data: {
        userId,
        isFrozen: resolvedIsFrozen,
        frozenAt: (loyaltyRow as any)?.frozen_at ?? null,
        frozenBy: (loyaltyRow as any)?.frozen_by ?? null,
        reason: (loyaltyRow as any)?.freeze_reason ?? null,
        pointsBalance: Number((loyaltyRow as any)?.points_balance ?? 0),
        frozenPoints: Number((loyaltyRow as any)?.frozen_points ?? 0)
      }
    })
  } catch (error) {
    console.error('POST /api/finance/points-freeze failed:', error)
    const message = error instanceof Error ? error.message : 'Erreur lors de la mise à jour du gel.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
