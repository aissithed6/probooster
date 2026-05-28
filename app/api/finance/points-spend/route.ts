import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

import { getSupabaseAdmin } from '@/lib/supabase'

type SpendPointsInput = {
  points: number
  description?: string
  referenceId?: string
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
 * POST: Débite des points du compte de l'utilisateur courant (client) via la RPC spend_points.
 */
export async function POST(request: NextRequest) {
  let body: Partial<SpendPointsInput> = {}

  try {
    body = (await request.json()) as Partial<SpendPointsInput>
  } catch {
    return NextResponse.json({ error: 'Corps de requête JSON invalide.' }, { status: 400 })
  }

  const points = Number(body.points)
  const description = typeof body.description === 'string' ? body.description.trim() : ''
  const referenceId = typeof body.referenceId === 'string' ? body.referenceId.trim() : ''

  if (!Number.isFinite(points) || !Number.isInteger(points) || points <= 0) {
    return NextResponse.json({ error: 'Le nombre de points doit être un entier positif.' }, { status: 400 })
  }

  const accessToken = extractAccessToken(request)
  if (!accessToken) {
    return NextResponse.json({ error: 'Token Supabase manquant, accès refusé.' }, { status: 401 })
  }

  try {
    const supabaseUser = getSupabaseUserClient(accessToken)

    const { data: newBalance, error: rpcError } = await supabaseUser.rpc('spend_points', {
      p_points: points,
      p_description: description || null,
      p_reference_id: referenceId || null
    })

    if (rpcError) {
      const message = rpcError.message || 'Erreur lors du débit de points.'
      return NextResponse.json({ error: message }, { status: 400 })
    }

    // Bonus: retourne le solde réel recalculé depuis la DB (source de vérité)
    const supabaseAdmin = getSupabaseAdmin()
    const { data: userRow, error: userErr } = await supabaseAdmin.auth.getUser(accessToken)

    if (userErr) {
      throw userErr
    }

    const userId = userRow?.user?.id
    if (!userId) {
      return NextResponse.json({ error: 'Utilisateur introuvable.' }, { status: 404 })
    }

    const { data: loyaltyRow } = await supabaseAdmin
      .from('loyalty_points')
      .select('points_balance')
      .eq('user_id', userId)
      .maybeSingle()

    return NextResponse.json({
      data: {
        userId,
        points,
        newBalance: typeof loyaltyRow?.points_balance === 'number' ? loyaltyRow.points_balance : Number(newBalance ?? 0)
      }
    })
  } catch (error) {
    console.error('POST /api/finance/points-spend failed:', error)
    const message = error instanceof Error ? error.message : 'Erreur lors du débit de points.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
