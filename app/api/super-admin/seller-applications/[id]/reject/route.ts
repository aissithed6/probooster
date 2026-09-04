import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertSuperAdmin } from '../../../_helpers/auth'
import { getSupabaseAdmin } from '../../../../../../lib/supabase'

interface RouteParams {
  params: { id: string }
}

/**
 * POST /api/super-admin/seller-applications/:id/reject
 * Rejette une candidature vendeur avec motif (body: { reason }).
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const reviewerId = await assertSuperAdmin(request)
    const supabase = getSupabaseAdmin()

    const applicationId = params.id
    if (!applicationId) {
      return NextResponse.json({ error: 'Identifiant candidature requis.' }, { status: 400 })
    }

    const body = await request.json().catch(() => null)
    const reason = String(body?.reason ?? '').trim()
    if (!reason) {
      return NextResponse.json({ error: 'Un motif de rejet est requis.' }, { status: 400 })
    }

    const { data: application, error: fetchError } = await supabase
      .from('seller_applications')
      .select('*')
      .eq('id', applicationId)
      .maybeSingle()

    if (fetchError) {
      const message = fetchError.message ?? fetchError.hint ?? fetchError.details ?? 'Impossible de charger la candidature.'
      return NextResponse.json({ error: message }, { status: 500 })
    }

    if (!application) {
      return NextResponse.json({ error: 'Candidature introuvable.' }, { status: 404 })
    }

    if (application.status !== 'pending') {
      return NextResponse.json({ error: "Cette candidature n'est pas en attente." }, { status: 409 })
    }

    const { error: appError } = await supabase
      .from('seller_applications')
      .update({
        status: 'rejected',
        review_notes: reason,
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewerId
      })
      .eq('id', applicationId)

    if (appError) {
      const message = appError.message ?? appError.hint ?? appError.details ?? 'Impossible de rejeter la candidature.'
      return NextResponse.json({ error: message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const status = message.toLowerCase().includes('accès') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
