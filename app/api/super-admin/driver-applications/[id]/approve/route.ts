import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertSuperAdmin } from '../../../_helpers/auth'
import { getSupabaseAdmin } from '../../../../../../lib/supabase'

interface RouteParams {
  params: { id: string }
}

/**
 * Approuve une demande livreur.
 * - driver_applications.status = approved
 * - drivers.status = approved
 * - users.role = driver (rôle principal utilisé par assertCustomer/assertVendor/etc.)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const reviewerId = await assertSuperAdmin(request)
    const supabase = getSupabaseAdmin()

    const applicationId = params.id
    if (!applicationId) {
      return NextResponse.json({ error: 'Identifiant demande requis.' }, { status: 400 })
    }

    const { data: application, error: fetchError } = await supabase
      .from('driver_applications')
      .select('*')
      .eq('id', applicationId)
      .maybeSingle()

    if (fetchError) {
      const message = fetchError.message ?? fetchError.hint ?? fetchError.details ?? 'Impossible de charger la demande.'
      return NextResponse.json({ error: message }, { status: 500 })
    }

    if (!application) {
      return NextResponse.json({ error: 'Demande introuvable.' }, { status: 404 })
    }

    if (application.status !== 'pending') {
      return NextResponse.json({ error: 'Cette demande n\'est pas en attente.' }, { status: 409 })
    }

    const applicantId = (application as any).user_id as string

    const { error: driverError } = await supabase
      .from('drivers')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: reviewerId,
        rejected_reason: null
      })
      .eq('user_id', applicantId)

    if (driverError) {
      const message = driverError.message ?? driverError.hint ?? driverError.details ?? 'Impossible de mettre à jour le dossier livreur.'
      return NextResponse.json({ error: message }, { status: 500 })
    }

    const { error: appError } = await supabase
      .from('driver_applications')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewerId
      })
      .eq('id', applicationId)

    if (appError) {
      const message = appError.message ?? appError.hint ?? appError.details ?? 'Impossible de valider la demande.'
      return NextResponse.json({ error: message }, { status: 500 })
    }

    const { error: roleError } = await supabase.from('users').update({ role: 'driver' }).eq('id', applicantId)
    if (roleError) {
      const message = roleError.message ?? roleError.hint ?? roleError.details ?? 'Impossible d\'attribuer le rôle driver.'
      return NextResponse.json({ error: message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const status = message.toLowerCase().includes('accès') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
