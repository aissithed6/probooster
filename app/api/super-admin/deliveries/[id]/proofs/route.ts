import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertOpsOrSuperAdmin } from '../../../_helpers/auth'
import { getSupabaseAdmin } from '../../../../../../lib/supabase'

/**
 * GET /api/super-admin/deliveries/:id/proofs
 * Retourne les preuves photo associées à une livraison (super-admin uniquement).
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await assertOpsOrSuperAdmin(request)
    const deliveryId = String(params?.id ?? '').trim()

    if (!deliveryId) {
      return NextResponse.json({ error: 'Livraison invalide.' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    const { data: proofs, error } = await supabase
      .from('delivery_proofs')
      .select('id, delivery_id, order_id, uploaded_by, proof_type, public_url, created_at, metadata')
      .eq('delivery_id', deliveryId)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: proofs ?? [] })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const status = message.toLowerCase().includes('accès') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
