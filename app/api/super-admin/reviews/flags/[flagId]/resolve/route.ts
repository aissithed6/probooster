import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertSuperAdmin } from '../../../../_helpers/auth'
import { getSupabaseAdmin } from '../../../../../../../lib/supabase'

/**
 * POST /api/super-admin/reviews/flags/:flagId/resolve
 * Marque un signalement (product_review_flags) comme résolu.
 */
export async function POST(request: NextRequest, context: { params: Promise<{ flagId: string }> }) {
  try {
    await assertSuperAdmin(request)
    const { flagId } = await context.params

    if (!flagId) {
      return NextResponse.json({ error: 'flagId manquant.' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    const nowIso = new Date().toISOString()

    const { data: updated, error: updateErr } = await supabase
      .from('product_review_flags')
      .update({ status: 'resolved', resolved_at: nowIso, updated_at: nowIso })
      .eq('id', flagId)
      .select('*')
      .maybeSingle()

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message ?? 'Impossible de résoudre le signalement.' }, { status: 500 })
    }

    if (!updated) {
      return NextResponse.json({ error: 'Signalement introuvable.' }, { status: 404 })
    }

    // Journalisation (best-effort)
    try {
      await supabase.from('product_review_moderation_events').insert({
        review_id: String((updated as any)?.review_id ?? ''),
        actor_id: null,
        action: 'flag_resolved',
        payload: { flag_id: flagId }
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
