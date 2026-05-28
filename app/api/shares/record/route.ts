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

type RecordSharePayload = {
  productId: string
  vendorId?: string
  platform: string
  shareUrl: string
  awardPoints?: boolean
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
 * Résout le taux de conversion FCFA pour calculer `fcfa_value`.
 */
async function resolveConversionRate(supabaseAdmin: ReturnType<typeof getSupabaseAdmin>): Promise<number> {
  try {
    const { data: settingsRow } = await supabaseAdmin
      .from('point_settings')
      .select('conversion_rate')
      .eq('scope', 'global')
      .maybeSingle()

    const numeric = Number(settingsRow?.conversion_rate ?? 1)
    if (Number.isFinite(numeric) && numeric > 0) return numeric
    return 1
  } catch {
    return 1
  }
}

/**
 * POST /api/shares/record
 * Enregistre un partage + crédite les points via service role (évite les blocages RLS).
 */
export async function POST(request: NextRequest) {
  let body: Partial<RecordSharePayload> = {}

  try {
    body = (await request.json().catch(() => ({}))) as Partial<RecordSharePayload>
  } catch {
    return NextResponse.json({ error: 'Corps de requête JSON invalide.' }, { status: 400 })
  }

  const productId = String(body.productId ?? '').trim()
  const platform = String(body.platform ?? '').trim()
  const shareUrl = String(body.shareUrl ?? '').trim()
  const awardPointsRequested = body.awardPoints === undefined ? true : Boolean(body.awardPoints)

  if (!productId || !platform || !shareUrl) {
    return NextResponse.json({ error: 'Champs manquants.' }, { status: 400 })
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
          recorded: false,
          reason: 'analytics_disabled'
        }
      },
      { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    )
  }

  const resolved = await resolveSharePoints(supabaseAdmin, { platform, productId })
  const resolvedPoints = Math.max(0, Math.round(Number(resolved.points) || 0))

  try {
    // Résolution du vendeur réel depuis le produit: source de vérité.
    let resolvedVendorId = ''

    // Vérrou 1: si l'utilisateur partage son propre produit (ou un produit créé en son nom), aucun point n'est accordé.
    let isOwnProduct = false
    try {
      const { data: productRow } = await supabaseAdmin
        .from('user_products')
        .select('id, vendor_id')
        .eq('id', productId)
        .maybeSingle()

      const productVendorId = typeof (productRow as any)?.vendor_id === 'string' ? String((productRow as any).vendor_id).trim() : ''
      resolvedVendorId = productVendorId
      if (productVendorId && productVendorId === userId) {
        isOwnProduct = true
      }
    } catch {
      // noop
    }

    // Si vendor_id correspond à un profile.id (et non user_id), tenter de convertir vers user_id.
    if (resolvedVendorId) {
      try {
        const { data: profileRow } = await supabaseAdmin
          .from('user_profiles')
          .select('id, user_id')
          .or(`id.eq.${resolvedVendorId},user_id.eq.${resolvedVendorId}`)
          .limit(1)
          .maybeSingle()

        const canonical = typeof (profileRow as any)?.user_id === 'string' ? String((profileRow as any).user_id).trim() : ''
        if (canonical) {
          resolvedVendorId = canonical
        }
      } catch {
        // noop
      }
    }

    if (!resolvedVendorId) {
      // Fallback: utiliser vendorId envoyé par le client si présent, mais on évite de planter.
      resolvedVendorId = String(body.vendorId ?? '').trim()
    }

    if (!resolvedVendorId) {
      return NextResponse.json({ error: 'Impossible de résoudre le vendeur pour ce produit.' }, { status: 400 })
    }

    // Vérrou 2: points gagnables une seule fois par produit (tous réseaux confondus)
    let alreadyRewarded = false
    try {
      const { data: rewardedRow } = await supabaseAdmin
        .from('product_shares')
        .select('id')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .gt('points_earned', 0)
        .limit(1)
        .maybeSingle()

      alreadyRewarded = Boolean((rewardedRow as any)?.id)
    } catch {
      alreadyRewarded = false
    }

    const shouldAwardPoints = awardPointsRequested && !resolved.disabledByProduct && !isOwnProduct && !alreadyRewarded
    const safePoints = shouldAwardPoints ? resolvedPoints : 0

    const { data: shareRow, error: shareErr } = await supabaseAdmin
      .from('product_shares')
      .insert({
        user_id: userId,
        product_id: productId,
        vendor_id: resolvedVendorId,
        platform: String(platform).toLowerCase().trim(),
        share_url: shareUrl,
        points_earned: safePoints
      })
      .select('*')
      .single()

    if (shareErr) {
      console.error('POST /api/shares/record insert product_shares error:', shareErr)
      return NextResponse.json({ error: 'Erreur lors de l’enregistrement du partage.' }, { status: 500 })
    }

    if (safePoints > 0) {
      const conversionRate = await resolveConversionRate(supabaseAdmin)
      const fcfaValue = Number((safePoints * conversionRate).toFixed(2))

      await supabaseAdmin
        .from('loyalty_points')
        .upsert({ user_id: userId }, { onConflict: 'user_id' })

      const { data: loyaltyRow, error: loyaltyErr } = await supabaseAdmin
        .from('loyalty_points')
        .select('points_balance, points_earned, fcfa_value')
        .eq('user_id', userId)
        .maybeSingle()

      if (loyaltyErr) {
        console.error('POST /api/shares/record select loyalty_points error:', loyaltyErr)
      } else {
        const currentBalance = Number(loyaltyRow?.points_balance ?? 0)
        const currentEarned = Number(loyaltyRow?.points_earned ?? 0)
        const currentFcfa = Number(loyaltyRow?.fcfa_value ?? 0)

        const nextBalance = Math.max(0, currentBalance + safePoints)
        const nextEarned = Math.max(0, currentEarned + safePoints)
        const nextFcfa = Math.max(0, Number((currentFcfa + fcfaValue).toFixed(2)))

        const { error: updateErr } = await supabaseAdmin
          .from('loyalty_points')
          .update({
            points_balance: nextBalance,
            points_earned: nextEarned,
            fcfa_value: nextFcfa
          })
          .eq('user_id', userId)

        if (updateErr) {
          console.error('POST /api/shares/record update loyalty_points error:', updateErr)
        }

        const { error: txErr } = await supabaseAdmin
          .from('point_transactions')
          .insert({
            user_id: userId,
            type: 'share',
            points: safePoints,
            fcfa_value: fcfaValue,
            description: 'Points gagnés pour share',
            reference_id: shareRow?.id ?? null
          })

        if (txErr) {
          console.error('POST /api/shares/record insert point_transactions error:', txErr)
        }

        try {
          await supabaseAdmin
            .from('users')
            .update({
              points_balance: nextBalance
            } as any)
            .eq('id', userId)
        } catch {
          // Tolère l'absence de colonne users.points_balance.
        }
      }
    }

    return NextResponse.json(
      {
        data: {
          share: shareRow,
          pointsEarned: safePoints,
          meta: {
            awardPointsRequested,
            awardedPoints: safePoints > 0,
            alreadyRewarded,
            isOwnProduct,
            disabledByProduct: resolved.disabledByProduct
          }
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
    console.error('POST /api/shares/record failed:', error)
    const message = error instanceof Error ? error.message : 'Erreur interne du serveur.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
