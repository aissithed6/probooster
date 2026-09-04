import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertSuperAdmin } from '../../../_helpers/auth'
import { getSupabaseAdmin } from '../../../../../../lib/supabase'

interface RouteParams {
  params: { id: string }
}

/**
 * POST /api/super-admin/seller-applications/:id/approve
 * Approuve une candidature vendeur :
 * - seller_applications.status = approved
 * - si un compte utilisateur existe avec l'email du candidat,
 *   son rôle passe à 'vendor'.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const reviewerId = await assertSuperAdmin(request)
    const supabase = getSupabaseAdmin()

    const applicationId = params.id
    if (!applicationId) {
      return NextResponse.json({ error: 'Identifiant candidature requis.' }, { status: 400 })
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
        status: 'approved',
        review_notes: null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewerId
      })
      .eq('id', applicationId)

    if (appError) {
      const message = appError.message ?? appError.hint ?? appError.details ?? 'Impossible de valider la candidature.'
      return NextResponse.json({ error: message }, { status: 500 })
    }

    // Lien optionnel avec un compte existant (par email) : promouvoir en vendeur.
    let roleUpdated = false
    if (application.email) {
      const { data: linkedUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', application.email.toLowerCase())
        .maybeSingle()

      if (linkedUser?.id) {
        const { error: roleError } = await supabase
          .from('users')
          .update({ role: 'vendor' })
          .eq('id', linkedUser.id)

        if (!roleError) {
          roleUpdated = true
          await supabase
            .from('seller_applications')
            .update({ user_id: linkedUser.id })
            .eq('id', applicationId)
        }
      }
    }

    return NextResponse.json({ success: true, roleUpdated })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const status = message.toLowerCase().includes('accès') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
