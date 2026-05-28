import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertCustomer, isClientAuthError } from '../../../_helpers/auth'
import { getSupabaseAdmin } from '../../../../../../lib/supabase'

/**
 * GET /api/client/deliveries/:id/proofs
 * Retourne les preuves photo associées à une livraison (visible client + super-admin via RLS, mais on valide côté serveur).
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const customerId = await assertCustomer(request)
    const deliveryId = String(params?.id ?? '').trim()

    if (!deliveryId) {
      return NextResponse.json({ error: 'Livraison invalide.' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    const { data: delivery, error: deliveryError } = await supabase
      .from('deliveries')
      .select('id, customer_id')
      .eq('id', deliveryId)
      .maybeSingle()

    if (deliveryError) {
      return NextResponse.json({ error: deliveryError.message }, { status: 500 })
    }

    if (!delivery || delivery.customer_id !== customerId) {
      return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })
    }

    const { data: proofs, error: proofsError } = await supabase
      .from('delivery_proofs')
      .select('id, delivery_id, order_id, uploaded_by, proof_type, public_url, created_at, metadata')
      .eq('delivery_id', deliveryId)
      .order('created_at', { ascending: false })

    if (proofsError) {
      return NextResponse.json({ error: proofsError.message }, { status: 500 })
    }

    return NextResponse.json({ data: proofs ?? [] })
  } catch (err) {
    if (isClientAuthError(err)) {
      return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 })
    }

    const message = err instanceof Error ? err.message : 'Erreur inconnue.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
