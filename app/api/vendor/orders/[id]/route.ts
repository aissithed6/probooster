import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertVendor } from '@/app/api/vendor/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { OrderRepository } from '@/lib/repositories/order-repository'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * PATCH /api/vendor/orders/[id]
 * Met à jour une commande appartenant au vendeur authentifié.
 * Utilisé par le dashboard vendeur pour persister les changements de statut (confirm/ship/deliver/cancel, etc.).
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const vendorId = await assertVendor(request)
    const orderId = String(params?.id ?? '').trim()

    if (!orderId) {
      return NextResponse.json({ error: 'Identifiant commande manquant.' }, { status: 400 })
    }

    const payload = (await request.json().catch(() => ({}))) as any

    const status = typeof payload?.status === 'string' ? payload.status.trim() : undefined
    const paymentStatus = typeof payload?.paymentStatus === 'string' ? payload.paymentStatus.trim() : undefined
    const notes = typeof payload?.notes === 'string' ? payload.notes : undefined

    if (status && status.toLowerCase() === 'cancelled') {
      return NextResponse.json(
        { error: 'Annulation indisponible via cette route. Utilisez /api/vendor/orders/[id]/cancel.' },
        { status: 409 }
      )
    }

    if (!status && !paymentStatus && notes === undefined) {
      return NextResponse.json({ error: 'Aucune mise à jour fournie.' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    const { data: vendorProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', vendorId)
      .maybeSingle()

    const vendorIds = [vendorId]
    const profileId = (vendorProfile as any)?.id
    if (typeof profileId === 'string' && profileId.length > 0 && profileId !== vendorId) {
      vendorIds.push(profileId)
    }

    const { data: orderRow, error: orderErr } = await supabase
      .from('orders')
      .select('id, vendor_id')
      .eq('id', orderId)
      .maybeSingle()

    if (orderErr) {
      console.error('❌ PATCH /api/vendor/orders/[id]: order lookup failed:', orderErr)
      return NextResponse.json({ error: 'Erreur lors de la vérification de la commande.' }, { status: 500 })
    }

    if (!orderRow) {
      return NextResponse.json({ error: 'Commande introuvable.' }, { status: 404 })
    }

    const orderVendorId = String((orderRow as any)?.vendor_id ?? '')
    if (!vendorIds.includes(orderVendorId)) {
      return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })
    }

    const updated = await OrderRepository.updateOrder(
      orderId,
      {
        ...(status ? { status } : {}),
        ...(paymentStatus ? { paymentStatus } : {}),
        ...(notes !== undefined ? { notes } : {})
      },
      { actorId: vendorId, actorRole: 'vendor' }
    )

    return NextResponse.json({ data: updated }, { status: 200 })
  } catch (error) {
    console.error('❌ PATCH /api/vendor/orders/[id] unexpected error:', error)
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const lower = message.toLowerCase()
    const status = lower.includes('accès') ? 403 : lower.includes('token') ? 401 : lower.includes('introuvable') ? 404 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
