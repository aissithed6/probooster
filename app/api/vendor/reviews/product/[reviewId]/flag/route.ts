import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertVendor } from '@/app/api/vendor/_helpers/auth'
import { syncProductReviewStats } from '@/lib/product-reviews'
import { getSupabaseAdmin } from '@/lib/supabase'

/**
 * POST /api/vendor/reviews/product/:reviewId/flag
 * Permet à un vendeur de signaler un avis produit (ex: contenu inapproprié).
 */
export async function POST(request: NextRequest, context: { params: Promise<{ reviewId: string }> }) {
  try {
    const vendorId = await assertVendor(request)
    const { reviewId } = await context.params

    if (!reviewId) {
      return NextResponse.json({ error: 'reviewId manquant.' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const reasonRaw: unknown = (body as any)?.reason
    const detailsRaw: unknown = (body as any)?.details

    const reason = typeof reasonRaw === 'string' ? reasonRaw.trim() : ''
    const details = typeof detailsRaw === 'string' ? detailsRaw.trim() : null

    if (!reason) {
      return NextResponse.json({ error: 'Raison manquante.' }, { status: 400 })
    }

    const allowedReasons = new Set(['inappropriate', 'spam', 'fake', 'harassment', 'other'])
    if (!allowedReasons.has(reason)) {
      return NextResponse.json({ error: 'Raison invalide.' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // Vérifie que l'avis appartient à un produit du vendeur.
    const { data: reviewRow, error: reviewErr } = await supabase
      .from('product_reviews')
      .select('id, product_id')
      .eq('id', reviewId)
      .maybeSingle()

    if (reviewErr) {
      return NextResponse.json({ error: reviewErr.message ?? 'Impossible de vérifier l’avis.' }, { status: 500 })
    }

    if (!reviewRow?.product_id) {
      return NextResponse.json({ error: 'Avis introuvable.' }, { status: 404 })
    }

    const { data: productRow, error: productErr } = await supabase
      .from('user_products')
      .select('id, vendor_id')
      .eq('id', String(reviewRow.product_id))
      .maybeSingle()

    if (productErr) {
      return NextResponse.json({ error: productErr.message ?? 'Impossible de vérifier le produit.' }, { status: 500 })
    }

    if (!productRow?.vendor_id || String(productRow.vendor_id) !== String(vendorId)) {
      return NextResponse.json({ error: 'Accès refusé: cet avis ne concerne pas vos produits.' }, { status: 403 })
    }

    const { data: flagRow, error: insertErr } = await supabase
      .from('product_review_flags')
      .insert({
        review_id: String(reviewId),
        reporter_id: String(vendorId),
        reason,
        details
      })
      .select('*')
      .maybeSingle()

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message ?? 'Impossible de signaler l’avis.' }, { status: 500 })
    }

    // Le trigger SQL met status = flagged ; on recalcule les notes produit (avis approuvés uniquement).
    await syncProductReviewStats(supabase, String(reviewRow.product_id))

    return NextResponse.json({ data: flagRow }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const lower = message.toLowerCase()
    const status = lower.includes('token') ? 401 : lower.includes('accès') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
