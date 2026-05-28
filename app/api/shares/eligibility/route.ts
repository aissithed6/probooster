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
 * Convertit un input (string/number) en number, en tolérant les formats français (virgule).
 */
function toLocaleNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const normalized = value.trim().replace(',', '.')
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : NaN
  }
  return Number(value)
}

/**
 * Résout les points d'un partage selon la configuration globale (Super Admin) dans `point_settings.metadata`.
 */
async function resolveSharePoints(
  supabaseAdmin: ReturnType<typeof getSupabaseAdmin>,
  params: { platform: string; productId: string }
): Promise<{ points: number; disabledByProduct: boolean }> {
  const platform = params.platform
  const productId = params.productId
  const normalized = String(platform ?? '').toLowerCase().trim()

  try {
    const { data: marketingRow } = await supabaseAdmin
      .from('product_marketing_settings')
      .select('social_sharing, social_points')
      .eq('product_id', productId)
      .maybeSingle()

    const socialSharing = (marketingRow as any)?.social_sharing
    if (socialSharing === false) {
      return { points: 0, disabledByProduct: true }
    }

    const overrideRaw = (marketingRow as any)?.social_points
    const overridePoints = Number(overrideRaw)
    if (Number.isFinite(overridePoints) && overridePoints >= 0) {
      return { points: Math.round(overridePoints), disabledByProduct: false }
    }
  } catch {
    // ignore
  }

  try {
    const { data: settingsRow } = await supabaseAdmin
      .from('point_settings')
      .select('metadata, conversion_rate')
      .eq('scope', 'global')
      .maybeSingle()

    const metadata = (settingsRow?.metadata ?? {}) as Record<string, any>
    const conversion = (metadata.conversion ?? {}) as Record<string, any>

    const socialShareValueRaw = toLocaleNumber(conversion.socialShareValue)
    const socialShareValue = Number.isFinite(socialShareValueRaw) && socialShareValueRaw >= 0 ? socialShareValueRaw : 0

    const perNetworkRaw = (metadata.socialSharePerNetwork ?? conversion.socialSharePerNetwork ?? {}) as Record<string, any>

    const specificRaw = perNetworkRaw?.[normalized]
    const specific = toLocaleNumber(specificRaw)

    if (Number.isFinite(specific) && specific >= 0) {
      return { points: Math.round(specific), disabledByProduct: false }
    }

    return { points: Math.round(socialShareValue), disabledByProduct: false }
  } catch {
    return { points: 0, disabledByProduct: false }
  }
}

/**
 * GET /api/shares/eligibility?productId=...&platform=...
 * Retourne si l'utilisateur peut gagner des points pour ce produit (1 seule fois par produit).
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const productId = String(url.searchParams.get('productId') ?? '').trim()
    const platform = String(url.searchParams.get('platform') ?? '').trim().toLowerCase()

    if (!productId || !platform) {
      return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()
    const accessToken = await extractAccessToken(request)

    if (!accessToken) {
      return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 })
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(accessToken)
    if (authError || !authData?.user?.id) {
      return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 })
    }

    const userId = String(authData.user.id)
    if (!UUID_REGEX.test(userId)) {
      return NextResponse.json({ error: 'Utilisateur invalide.' }, { status: 400 })
    }

    const analyticsAllowed = await isAnalyticsEnabled({ supabase: supabaseAdmin, userId })
    if (!analyticsAllowed) {
      return NextResponse.json(
        {
          data: {
            productId,
            platform,
            points: 0,
            canEarnPoints: false,
            alreadyRewarded: false,
            isOwnProduct: false,
            reason: 'analytics_disabled'
          }
        },
        { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } }
      )
    }

    const { data: productRow, error: productErr } = await supabaseAdmin
      .from('user_products')
      .select('id, vendor_id')
      .eq('id', productId)
      .maybeSingle()

    if (productErr) {
      return NextResponse.json({ error: 'Impossible de charger le produit.' }, { status: 500 })
    }

    if (!productRow?.id) {
      return NextResponse.json({ error: 'Produit introuvable.' }, { status: 404 })
    }

    const productVendorId = typeof (productRow as any)?.vendor_id === 'string' ? String((productRow as any).vendor_id).trim() : ''

    const isOwnProduct = Boolean(productVendorId) && productVendorId === userId

    const { data: rewardedRow } = await supabaseAdmin
      .from('product_shares')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .gt('points_earned', 0)
      .limit(1)
      .maybeSingle()

    const alreadyRewarded = Boolean((rewardedRow as any)?.id)

    const resolved = await resolveSharePoints(supabaseAdmin, { platform, productId })
    const points = Math.max(0, Math.round(Number(resolved.points) || 0))

    const canEarnPoints = !resolved.disabledByProduct && !isOwnProduct && !alreadyRewarded && points > 0

    const reason = resolved.disabledByProduct
      ? 'disabled'
      : isOwnProduct
        ? 'own_product'
        : alreadyRewarded
          ? 'already_rewarded'
          : canEarnPoints
            ? 'ok'
            : 'no_points'

    return NextResponse.json(
      {
        data: {
          productId,
          platform,
          points,
          canEarnPoints,
          alreadyRewarded,
          isOwnProduct,
          reason
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
