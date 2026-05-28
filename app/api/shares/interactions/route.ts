import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { getSupabaseAdmin } from '@/lib/supabase'
import { isAnalyticsEnabled } from '@/app/api/_helpers/analytics-privacy'

export const dynamic = 'force-dynamic'

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

function resolveBoolean(value: unknown): boolean | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'boolean') return value
  if (value === 1 || value === '1' || value === 'true') return true
  if (value === 0 || value === '0' || value === 'false') return false
  return null
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
 * GET /api/shares/interactions?shareId=...
 * Retourne les interactions détaillées d'un partage.
 * Sécurité: requiert un utilisateur authentifié, et vérifie que le partage appartient à l'utilisateur (user_id) ou au vendeur (vendor_id).
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const shareId = String(url.searchParams.get('shareId') ?? '').trim()

  if (!UUID_REGEX.test(shareId)) {
    return NextResponse.json({ error: 'shareId invalide.' }, { status: 400 })
  }

  const accessToken = await extractAccessToken(request)
  if (!accessToken) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()

  try {
    const { data: authData, error: authError } = await supabase.auth.getUser(accessToken)
    if (authError || !authData?.user?.id) {
      return NextResponse.json({ error: 'Utilisateur introuvable ou token invalide.' }, { status: 401 })
    }

    const currentUserId = authData.user.id

    const analyticsAllowed = await isAnalyticsEnabled({ supabase, userId: currentUserId })
    if (!analyticsAllowed) {
      return NextResponse.json(
        { data: { rows: [] } },
        { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } }
      )
    }

    const { data: shareRow, error: shareError } = await supabase
      .from('product_shares')
      .select('id, user_id, vendor_id')
      .eq('id', shareId)
      .maybeSingle()

    if (shareError) {
      return NextResponse.json({ error: shareError.message }, { status: 500 })
    }

    if (!shareRow?.id) {
      return NextResponse.json({ data: { rows: [] } }, { status: 200 })
    }

    const isOwner = shareRow.user_id === currentUserId || shareRow.vendor_id === currentUserId
    if (!isOwner) {
      return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })
    }

    const { data: rows, error } = await supabase
      .from('share_interactions')
      .select('id, created_at, interaction_type, ip_address, user_agent, referrer')
      .eq('share_id', shareId)
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(
      {
        data: {
          rows: (rows ?? []).map((r: any) => ({
            id: String(r?.id ?? ''),
            createdAt: String(r?.created_at ?? ''),
            type: String(r?.interaction_type ?? ''),
            ip: String(r?.ip_address ?? ''),
            userAgent: String(r?.user_agent ?? ''),
            referrer: String(r?.referrer ?? '')
          }))
        }
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0'
        }
      }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur interne du serveur.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
