import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { getSupabaseAdmin } from '@/lib/supabase'
import { isAnalyticsEnabled } from '@/app/api/_helpers/analytics-privacy'

export const dynamic = 'force-dynamic'

type TrackPayload = {
  shareId: string
  interactionType: 'click' | 'open'
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
 * POST /api/shares/track
 * Enregistre une interaction interne (vendeur) sur un partage existant.
 * Utilisation: quand le vendeur ouvre un lien depuis l'historique.
 */
export async function POST(request: NextRequest) {
  let body: Partial<TrackPayload> = {}

  try {
    body = (await request.json().catch(() => ({}))) as Partial<TrackPayload>
  } catch {
    return NextResponse.json({ error: 'Corps de requête JSON invalide.' }, { status: 400 })
  }

  const shareId = String(body.shareId ?? '').trim()
  const interactionType = String(body.interactionType ?? '').trim().toLowerCase()

  if (!UUID_REGEX.test(shareId)) {
    return NextResponse.json({ error: 'shareId invalide.' }, { status: 400 })
  }

  if (interactionType !== 'click' && interactionType !== 'open') {
    return NextResponse.json({ error: 'interactionType invalide.' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  const accessToken = await extractAccessToken(request)

  if (!accessToken) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  }

  const { data: authData, error: authError } = await supabase.auth.getUser(accessToken)
  if (authError || !authData?.user?.id) {
    return NextResponse.json({ error: 'Utilisateur introuvable ou token invalide.' }, { status: 401 })
  }

  const currentUserId = String(authData.user.id)

  const analyticsAllowed = await isAnalyticsEnabled({ supabase, userId: currentUserId })
  if (!analyticsAllowed) {
    return NextResponse.json(
      { data: { recorded: false, reason: 'analytics_disabled' } },
      { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    )
  }

  const { data: shareRow, error: shareError } = await supabase
    .from('product_shares')
    .select('id, vendor_id')
    .eq('id', shareId)
    .maybeSingle()

  if (shareError) {
    return NextResponse.json({ error: shareError.message }, { status: 500 })
  }

  if (!shareRow?.id) {
    return NextResponse.json({ data: { recorded: false, reason: 'share_not_found' } }, { status: 200 })
  }

  // Sécurité: seules les actions du vendeur propriétaire du share sont autorisées ici.
  if (String((shareRow as any)?.vendor_id ?? '') !== currentUserId) {
    return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined
  const userAgent = request.headers.get('user-agent') ?? undefined
  const referrer = request.headers.get('referer') ?? undefined

  const { data: interactionRow, error: insertError } = await supabase
    .from('share_interactions')
    .insert({
      share_id: shareId,
      interaction_type: interactionType,
      user_id: currentUserId,
      ip_address: ip ?? null,
      user_agent: userAgent ?? null,
      referrer: referrer ?? null
    })
    .select('*')
    .single()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json(
    { data: { recorded: true, interaction: interactionRow } },
    { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } }
  )
}
