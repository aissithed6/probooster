import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertVendor } from '@/app/api/vendor/_helpers/auth'
import { assertVendorOwnsReview, syncProductReviewStats } from '@/lib/product-reviews'
import { getSupabaseAdmin } from '@/lib/supabase'

/**
 * DELETE /api/vendor/reviews/product/:reviewId
 * Supprime un avis lié à un produit du vendeur et recalcule les agrégats.
 */
export async function DELETE(request: NextRequest, context: { params: Promise<{ reviewId: string }> }) {
  try {
    const vendorId = await assertVendor(request)
    const { reviewId } = await context.params

    if (!reviewId) {
      return NextResponse.json({ error: 'reviewId manquant.' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const { productId } = await assertVendorOwnsReview(supabase, vendorId, reviewId)

    await supabase.from('product_review_responses').delete().eq('review_id', reviewId)
    await supabase.from('product_review_flags').delete().eq('review_id', reviewId)
    await supabase.from('product_review_moderation_events').delete().eq('review_id', reviewId)

    const { error: deleteErr } = await supabase.from('product_reviews').delete().eq('id', reviewId)

    if (deleteErr) {
      return NextResponse.json({ error: deleteErr.message ?? 'Impossible de supprimer l’avis.' }, { status: 500 })
    }

    await syncProductReviewStats(supabase, productId)

    return NextResponse.json({ data: { ok: true } }, { status: 200 })
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
