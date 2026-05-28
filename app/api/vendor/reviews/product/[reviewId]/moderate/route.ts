import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertVendor } from '@/app/api/vendor/_helpers/auth'
import { assertVendorOwnsReview, recordReviewModeration } from '@/lib/product-reviews'
import { getSupabaseAdmin } from '@/lib/supabase'

/**
 * POST /api/vendor/reviews/product/:reviewId/moderate
 * Approuve ou rejette un avis sur un produit du vendeur.
 */
export async function POST(request: NextRequest, context: { params: Promise<{ reviewId: string }> }) {
  try {
    const vendorId = await assertVendor(request)
    const { reviewId } = await context.params

    if (!reviewId) {
      return NextResponse.json({ error: 'reviewId manquant.' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const actionRaw: unknown = (body as any)?.action
    const reasonRaw: unknown = (body as any)?.reason

    const action = typeof actionRaw === 'string' ? actionRaw.trim().toLowerCase() : ''
    const reason = typeof reasonRaw === 'string' ? reasonRaw.trim() : ''

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ error: 'Action invalide (approve ou reject).' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const { productId } = await assertVendorOwnsReview(supabase, vendorId, reviewId)

    const status = await recordReviewModeration({
      supabase,
      reviewId,
      productId,
      action: action as 'approve' | 'reject',
      actorId: vendorId,
      reason: reason || null
    })

    return NextResponse.json({ data: { ok: true, status } }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const lower = message.toLowerCase()
    const status = lower.includes('token')
      ? 401
      : lower.includes('accès') || lower.includes('refusé')
        ? 403
        : lower.includes('introuvable')
          ? 404
          : 500
    return NextResponse.json({ error: message }, { status })
  }
}
