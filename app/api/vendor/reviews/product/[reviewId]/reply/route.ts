import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertVendor } from '@/app/api/vendor/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

/**
 * POST /api/vendor/reviews/product/:reviewId/reply
 * Crée ou met à jour la réponse vendeur à un avis produit.
 * Workflow: la réponse est créée avec status = "pending" (validation Super Admin).
 */
export async function POST(request: NextRequest, context: { params: Promise<{ reviewId: string }> }) {
  try {
    const vendorId = await assertVendor(request)
    const { reviewId } = await context.params

    if (!reviewId) {
      return NextResponse.json({ error: 'reviewId manquant.' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const contentRaw: unknown = (body as any)?.content
    const content = typeof contentRaw === 'string' ? contentRaw.trim() : ''

    if (!content) {
      return NextResponse.json({ error: 'Contenu de réponse manquant.' }, { status: 400 })
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

    // UPSERT: 1 réponse max par avis (unique(review_id)).
    const { data: responseRow, error: upsertErr } = await supabase
      .from('product_review_responses')
      .upsert(
        {
          review_id: String(reviewId),
          vendor_id: String(vendorId),
          content,
          status: 'pending',
          updated_at: new Date().toISOString()
        },
        { onConflict: 'review_id' }
      )
      .select('*')
      .maybeSingle()

    if (upsertErr) {
      return NextResponse.json({ error: upsertErr.message ?? 'Impossible d’enregistrer la réponse.' }, { status: 500 })
    }

    return NextResponse.json({ data: responseRow }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const lower = message.toLowerCase()
    const status = lower.includes('token') ? 401 : lower.includes('accès') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
