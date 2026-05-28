import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

type DebitPointsInput = {
  userId: string
  points: number
  description?: string
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
 * POST: Retire des points à un utilisateur (Super Admin).
 *
 * Implémentation:
 * - Vérifie le rôle via assertSuperAdmin
 * - Appelle la RPC public.admin_withdraw_points (security definer) avec un token utilisateur (pour auth.uid())
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

  let body: Partial<DebitPointsInput> = {}

  try {
    body = (await request.json()) as Partial<DebitPointsInput>
  } catch {
    return NextResponse.json({ error: 'Corps de requête JSON invalide.' }, { status: 400 })
  }

  const providedId = body.userId ? String(body.userId) : ''
  const pointsRaw = body.points
  const description = typeof body.description === 'string' ? body.description.trim() : ''

  if (!providedId) {
    return NextResponse.json({ error: 'Identifiant utilisateur manquant.' }, { status: 400 })
  }

  const points = Number(pointsRaw)
  if (!Number.isFinite(points) || !Number.isInteger(points) || points <= 0) {
    return NextResponse.json({ error: 'Le nombre de points doit être un entier positif.' }, { status: 400 })
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

    const { error: rpcError } = await supabaseUser.rpc('admin_withdraw_points', {
      p_target_id: userId,
      p_points: points,
      p_description: description || null
    })

    if (rpcError) {
      const message = rpcError.message || 'Erreur lors du retrait de points.'
      return NextResponse.json({ error: message }, { status: 400 })
    }

    const { data: loyaltyRow } = await supabaseAdmin
      .from('loyalty_points')
      .select('points_balance, points_spent, fcfa_value')
      .eq('user_id', userId)
      .maybeSingle()

    return NextResponse.json({
      data: {
        userId,
        points,
        newBalance: Number(loyaltyRow?.points_balance ?? 0)
      }
    })
  } catch (error) {
    console.error('POST /api/finance/points-debits failed:', error)
    const message = error instanceof Error ? error.message : 'Erreur lors du retrait de points.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
