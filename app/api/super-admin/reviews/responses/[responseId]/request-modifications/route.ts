import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertSuperAdmin } from '../../../../_helpers/auth'
import { getSupabaseAdmin } from '../../../../../../../lib/supabase'

/**
 * POST /api/super-admin/reviews/responses/:responseId/request-modifications
 * Enregistre une demande de modifications à destination du vendeur (journalisation best-effort).
 */
export async function POST(request: NextRequest, context: { params: Promise<{ responseId: string }> }) {
  try {
    await assertSuperAdmin(request)
    const { responseId } = await context.params

    if (!responseId) {
      return NextResponse.json({ error: 'responseId manquant.' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const modificationsRaw: unknown = (body as any)?.modifications
    const modifications = typeof modificationsRaw === 'string' ? modificationsRaw.trim() : ''

    if (!modifications) {
      return NextResponse.json({ error: 'modifications manquantes.' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    const { data: responseRow, error: responseErr } = await supabase
      .from('product_review_responses')
      .select('id, review_id, vendor_id, status, created_at, updated_at')
      .eq('id', responseId)
      .maybeSingle()

    if (responseErr) {
      return NextResponse.json({ error: responseErr.message ?? 'Impossible de charger la réponse.' }, { status: 500 })
    }

    if (!responseRow) {
      return NextResponse.json({ error: 'Réponse introuvable.' }, { status: 404 })
    }

    // Journalisation (best-effort)
    try {
      await supabase.from('product_review_moderation_events').insert({
        review_id: String((responseRow as any)?.review_id ?? ''),
        actor_id: null,
        action: 'response_modifications_requested',
        payload: { response_id: responseId, vendor_id: String((responseRow as any)?.vendor_id ?? ''), modifications }
      } as any)
    } catch {
      // ignore
    }

    return NextResponse.json({ data: { ok: true } }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const lower = message.toLowerCase()
    const status = lower.includes('token') ? 401 : lower.includes('accès') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
