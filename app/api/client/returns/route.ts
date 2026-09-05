import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertCustomer, isClientAuthError } from '../_helpers/auth'
import { getSupabaseAdmin } from '../../../../lib/supabase'
import { OrderRepository } from '../../../../lib/repositories/order-repository'

/**
 * POST /api/client/returns
 * Crée une demande de retour pour une commande du client authentifié.
 * Persiste dans order_returns, passe la commande en 'returned', trace
 * l'historique, synchronise Finance et notifie vendeur + super admins.
 */
export async function POST(request: NextRequest) {
  try {
    const customerId = await assertCustomer(request)
    const supabase = getSupabaseAdmin()

    const body = (await request.json().catch(() => null)) as {
      orderId?: string
      reason?: string
      description?: string
      refundCurrency?: string
    } | null

    const orderId = typeof body?.orderId === 'string' ? body.orderId.trim() : ''
    const reason = typeof body?.reason === 'string' ? body.reason.trim() : ''
    const description = typeof body?.description === 'string' ? body.description.trim() : ''

    if (!orderId || !reason) {
      return NextResponse.json({ error: 'Commande et raison du retour requises.' }, { status: 400 })
    }

    // La commande doit appartenir au client authentifié.
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, customer_id, vendor_id, currency')
      .eq('id', orderId)
      .maybeSingle()

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 500 })
    }
    if (!order) {
      return NextResponse.json({ error: 'Commande introuvable.' }, { status: 404 })
    }
    if (String(order.customer_id) !== String(customerId)) {
      return NextResponse.json({ error: 'Cette commande ne vous appartient pas.' }, { status: 403 })
    }

    const details = await OrderRepository.createReturn(
      orderId,
      {
        reason,
        refundCurrency: typeof body?.refundCurrency === 'string' ? body.refundCurrency : order.currency ?? 'XOF',
        metadata: {
          description,
          requested_by: 'customer',
          source: 'public_returns_page'
        }
      },
      { actorId: String(customerId), actorRole: 'customer' }
    )

    // Notifications: vendeur + super admins.
    try {
      const recipients = new Set<string>()
      if (order.vendor_id) recipients.add(String(order.vendor_id))

      const { data: superAdmins } = await supabase.from('users').select('id').in('role', ['super_admin', 'admin'])
      ;(superAdmins ?? []).forEach((row: any) => {
        if (row?.id) recipients.add(String(row.id))
      })

      const recipientList = Array.from(recipients.values()).filter(Boolean)
      if (recipientList.length > 0) {
        await supabase.from('user_notifications').insert(
          recipientList.map((userId) => ({
            user_id: userId,
            type: 'order',
            title: 'Demande de retour',
            message: `Le client a initié un retour pour la commande #${orderId.slice(0, 8)} — motif : ${reason}.`,
            action_url: '/super-admin-dashboard/commandes',
            priority: 'high'
          }))
        )
      }
    } catch (notifyError) {
      console.error('⚠️ Notification retour échouée (non bloquant):', notifyError)
    }

    return NextResponse.json({ data: details }, { status: 201 })
  } catch (err) {
    if (isClientAuthError(err)) {
      return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 })
    }

    console.error('❌ POST /api/client/returns failed:', err)
    const message = err instanceof Error ? err.message : 'Erreur inattendue.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}