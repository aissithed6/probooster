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

type RecordInteractionPayload = {
  productId: string
  refUserId: string
  interactionType: 'view' | 'click' | 'conversion' | 'purchase'
  userId?: string
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * POST /api/shares/interaction
 * Enregistre une interaction (view/click/conversion/purchase) liée à un partage existant.
 * Résout le `share_id` via le couple (productId, refUserId) en prenant le partage le plus récent.
 */
export async function POST(request: NextRequest) {
  let body: Partial<RecordInteractionPayload> = {}

  try {
    body = (await request.json().catch(() => ({}))) as Partial<RecordInteractionPayload>
  } catch {
    return NextResponse.json({ error: 'Corps de requête JSON invalide.' }, { status: 400 })
  }

  const productId = String(body.productId ?? '').trim()
  const refUserId = String(body.refUserId ?? '').trim()
  const interactionType = String(body.interactionType ?? '').trim() as RecordInteractionPayload['interactionType']
  const userId = String(body.userId ?? '').trim()

  const supabase = getSupabaseAdmin()

  const analyticsAllowed = await isAnalyticsEnabled({ supabase, userId: UUID_REGEX.test(userId) ? userId : refUserId })
  if (!analyticsAllowed) {
    return NextResponse.json(
      { data: { recorded: false, reason: 'analytics_disabled' } },
      { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    )
  }

  if (!UUID_REGEX.test(productId) || !UUID_REGEX.test(refUserId)) {
    return NextResponse.json({ error: 'productId/refUserId invalides.' }, { status: 400 })
  }

  if (!['view', 'click', 'conversion', 'purchase'].includes(interactionType)) {
    return NextResponse.json({ error: 'interactionType invalide.' }, { status: 400 })
  }

  try {
    const { data: shareRow, error: shareError } = await supabase
      .from('product_shares')
      .select('id')
      .eq('product_id', productId)
      .eq('user_id', refUserId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (shareError) {
      return NextResponse.json({ error: shareError.message }, { status: 500 })
    }

    if (!shareRow?.id) {
      // Pas de partage trouvé (ex: lien vieux, suppression, ou ref invalide)
      return NextResponse.json({ data: { recorded: false, reason: 'share_not_found' } }, { status: 200 })
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined
    const userAgent = request.headers.get('user-agent') ?? undefined
    const referrer = request.headers.get('referer') ?? undefined

    const { data: interactionRow, error: interactionError } = await supabase
      .from('share_interactions')
      .insert({
        share_id: shareRow.id,
        interaction_type: interactionType,
        user_id: UUID_REGEX.test(userId) ? userId : null,
        ip_address: ip ?? null,
        user_agent: userAgent ?? null,
        referrer: referrer ?? null
      })
      .select('*')
      .single()

    if (interactionError) {
      return NextResponse.json({ error: interactionError.message }, { status: 500 })
    }

    return NextResponse.json(
      {
        data: {
          recorded: true,
          interaction: interactionRow
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
