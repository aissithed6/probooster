import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertCustomer, isClientAuthError } from '../../../_helpers/auth'
import { getSupabaseAdmin } from '../../../../../../lib/supabase'
import { filterRecipientsByNotificationPreference } from '../../../../_helpers/notification-preferences'

/**
 * POST /api/client/deliveries/:id/received
 * Confirmation côté client que la livraison a bien été reçue.
 * - Vérifie l'utilisateur client et que la livraison lui appartient.
 * - Met à jour deliveries.client_received_at (si null).
 * - Ajoute un event delivery_events: client_received.
 * - Notifie vendeur + super-admin (et éventuellement le livreur si présent).
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const customerId = await assertCustomer(request)
    const deliveryId = String(params?.id ?? '').trim()

    if (!deliveryId) {
      return NextResponse.json({ error: 'Livraison invalide.' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    const { data: delivery, error: deliveryError } = await supabase
      .from('deliveries')
      .select('id, order_id, customer_id, vendor_id, driver_id, status, client_received_at')
      .eq('id', deliveryId)
      .eq('customer_id', customerId)
      .maybeSingle()

    if (deliveryError) {
      return NextResponse.json({ error: deliveryError.message }, { status: 500 })
    }

    if (!delivery) {
      return NextResponse.json({ error: 'Livraison introuvable.' }, { status: 404 })
    }

    const status = String(delivery.status ?? '').toLowerCase()
    if (status !== 'delivered') {
      return NextResponse.json({ error: "La livraison n'est pas encore marquée comme livrée." }, { status: 409 })
    }

    const nowIso = new Date().toISOString()

    if (!delivery.client_received_at) {
      const { error: updateError } = await supabase
        .from('deliveries')
        .update({ client_received_at: nowIso })
        .eq('id', deliveryId)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
    }

    const { error: eventError } = await supabase.from('delivery_events').insert({
      delivery_id: deliveryId,
      event_type: 'client_received',
      status: 'delivered',
      description: 'Livraison confirmée comme reçue par le client.',
      occurred_at: nowIso,
      data: {
        actor: 'client',
        customer_id: customerId
      }
    })

    if (eventError) {
      return NextResponse.json({ error: eventError.message }, { status: 500 })
    }

    const recipients = new Set<string>()
    if (delivery.vendor_id) recipients.add(String(delivery.vendor_id))
    if (delivery.driver_id) recipients.add(String(delivery.driver_id))

    const { data: superAdmins } = await supabase.from('users').select('id').eq('role', 'super_admin')
    ;(superAdmins ?? []).forEach((row: any) => {
      if (row?.id) recipients.add(String(row.id))
    })

    const recipientList = Array.from(recipients.values()).filter(Boolean)
    if (recipientList.length > 0) {
      const allowedRecipients = await filterRecipientsByNotificationPreference({
        supabase,
        recipientUserIds: recipientList,
        toggleKey: 'orders'
      })

      if (allowedRecipients.length > 0) {
        await supabase.from('user_notifications').insert(
          allowedRecipients.map((userId) => ({
            user_id: userId,
            type: 'order',
            title: 'Livraison: reçue',
            message: `Le client a confirmé la réception (livraison #${deliveryId.slice(0, 8)}).`,
            action_url: '/dashboard?tab=deliveries',
            priority: 'high'
          }))
        )
      }
    }

    return NextResponse.json({ data: { ok: true } }, { status: 200 })
  } catch (err) {
    if (isClientAuthError(err)) {
      return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 })
    }

    const message = err instanceof Error ? err.message : 'Erreur inconnue.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
