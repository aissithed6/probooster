import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertSuperAdmin } from '../../../../_helpers/auth'
import { getSupabaseAdmin } from '../../../../../../../lib/supabase'

/**
 * POST /api/super-admin/reviews/responses/:responseId/approve
 * Approuve une réponse vendeur (product_review_responses).
 */
export async function POST(request: NextRequest, context: { params: Promise<{ responseId: string }> }) {
  try {
    await assertSuperAdmin(request)
    const { responseId } = await context.params

    if (!responseId) {
      return NextResponse.json({ error: 'responseId manquant.' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    const { data: updated, error: updateErr } = await supabase
      .from('product_review_responses')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', responseId)
      .select('*')
      .maybeSingle()

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message ?? 'Impossible d’approuver la réponse.' }, { status: 500 })
    }

    if (!updated) {
      return NextResponse.json({ error: 'Réponse introuvable.' }, { status: 404 })
    }

    // Journalisation (best-effort)
    try {
      await supabase.from('product_review_moderation_events').insert({
        review_id: String((updated as any)?.review_id ?? ''),
        actor_id: null,
        action: 'response_approved',
        payload: { response_id: responseId }
      } as any)
    } catch {
      // ignore
    }

    return NextResponse.json({ data: updated }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const lower = message.toLowerCase()
    const status = lower.includes('token') ? 401 : lower.includes('accès') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
