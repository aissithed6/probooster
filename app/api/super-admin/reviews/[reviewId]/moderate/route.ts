import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'
import { recordReviewModeration } from '@/lib/product-reviews'
import { getSupabaseAdmin } from '@/lib/supabase'

/**
 * POST /api/super-admin/reviews/:reviewId/moderate
 * Enregistre une action de modération pour un avis produit.
 * Enregistre la modération, met à jour product_reviews.status et synchronise les agrégats produit.
 */
export async function POST(request: NextRequest, context: { params: Promise<{ reviewId: string }> }) {
  try {
    await assertSuperAdmin(request)
    const { reviewId } = await context.params

    if (!reviewId) {
      return NextResponse.json({ error: 'reviewId manquant.' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const actionRaw: unknown = (body as any)?.action
    const reasonRaw: unknown = (body as any)?.reason

    const action = typeof actionRaw === 'string' ? actionRaw.trim() : ''
    const reason = typeof reasonRaw === 'string' ? reasonRaw.trim() : ''

    const allowed = new Set(['approve', 'reject', 'flag', 'edit'])
    if (!allowed.has(action)) {
      return NextResponse.json({ error: 'Action invalide.' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // Vérifie que l'avis existe.
    const { data: reviewRow, error: reviewErr } = await supabase
      .from('product_reviews')
      .select('id, product_id')
      .eq('id', reviewId)
      .maybeSingle()

    if (reviewErr) {
      return NextResponse.json({ error: reviewErr.message ?? 'Impossible de vérifier l’avis.' }, { status: 500 })
    }

    if (!reviewRow?.id || !reviewRow?.product_id) {
      return NextResponse.json({ error: 'Avis introuvable.' }, { status: 404 })
    }

    const status = await recordReviewModeration({
      supabase,
      reviewId: String(reviewRow.id),
      productId: String(reviewRow.product_id),
      action: action as 'approve' | 'reject' | 'flag' | 'edit',
      actorId: null,
      reason: reason || null
    })

    return NextResponse.json({ data: { ok: true, status } }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const lower = message.toLowerCase()
    const status = lower.includes('token') ? 401 : lower.includes('accès') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
