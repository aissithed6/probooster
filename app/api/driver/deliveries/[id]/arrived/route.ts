import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertDriver } from '../../../_helpers/auth'
import { getSupabaseAdmin } from '../../../../../../lib/supabase'
import { filterRecipientsByNotificationPreference } from '../../../../_helpers/notification-preferences'

type ArrivedPayload = {
  location?: string
  coordinates?: { lat?: number; lng?: number }
}

/**
 * Récupère la conversation livraison (créée si besoin) liée à order_id.
 */
async function getOrCreateDeliveryConversationId(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  orderId: string
): Promise<string> {
  const { data: existing, error: fetchError } = await supabase
    .from('delivery_chat_conversations')
    .select('id')
    .eq('order_id', orderId)
    .maybeSingle()

  if (fetchError) {
    throw new Error(fetchError.message)
  }

  let conversationId = existing?.id as string | undefined

  if (!conversationId) {
    const { data: created, error: createError } = await supabase
      .from('delivery_chat_conversations')
      .insert({ order_id: orderId })
      .select('id')
      .single()

    if (createError || !created?.id) {
      throw new Error(createError?.message ?? 'Impossible de créer la conversation livraison.')
    }
    conversationId = created.id
  }

  if (!conversationId) {
    throw new Error('Conversation livraison introuvable.')
  }

  return conversationId
}

/**
 * POST /api/driver/deliveries/:id/arrived
 * Marque l'arrivée à destination (GPS + bouton manuel).
 * - Vérifie que l'utilisateur est un driver et qu'il est bien assigné à la livraison.
 * - Met à jour deliveries.arrived_at (si null).
 * - Ajoute un event delivery_events: driver_arrived.
 * - Envoie des notifications (client, vendeur, super-admin).
 */
export async function POST(request: NextRequest, context: { params: { id: string } }) {
  try {
    const driverId = await assertDriver(request)
    const deliveryId = String(context?.params?.id ?? '').trim()

    if (!deliveryId) {
      return NextResponse.json({ error: 'Livraison invalide.' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const body = (await request.json().catch(() => ({}))) as ArrivedPayload

    const { data: delivery, error: deliveryError } = await supabase
      .from('deliveries')
      .select('id, order_id, driver_id, customer_id, vendor_id, status, arrived_at')
      .eq('id', deliveryId)
      .maybeSingle()

    if (deliveryError) {
      return NextResponse.json({ error: deliveryError.message }, { status: 500 })
    }

    if (!delivery) {
      return NextResponse.json({ error: 'Livraison introuvable.' }, { status: 404 })
    }

    if (delivery.driver_id !== driverId) {
      return NextResponse.json({ error: "Cette livraison n'est pas assignée à ce livreur." }, { status: 403 })
    }

    const location = typeof body?.location === 'string' ? body.location.trim() : null
    const latRaw = body?.coordinates?.lat
    const lngRaw = body?.coordinates?.lng
    const latitude = typeof latRaw === 'number' && Number.isFinite(latRaw) ? latRaw : null
    const longitude = typeof lngRaw === 'number' && Number.isFinite(lngRaw) ? lngRaw : null

    const nowIso = new Date().toISOString()

    if (!delivery.arrived_at) {
      const { error: updateError } = await supabase
        .from('deliveries')
        .update({ arrived_at: nowIso })
        .eq('id', deliveryId)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
    }

    const { error: eventError } = await supabase.from('delivery_events').insert({
      delivery_id: deliveryId,
      event_type: 'driver_arrived',
      status: delivery.status,
      description: "Le livreur est arrivé à destination.",
      location,
      latitude,
      longitude,
      occurred_at: nowIso,
      data: {
        actor: 'driver',
        driver_id: driverId
      }
    })

    if (eventError) {
      return NextResponse.json({ error: eventError.message }, { status: 500 })
    }

    try {
      const conversationId = await getOrCreateDeliveryConversationId(supabase, String(delivery.order_id))
      await supabase.from('delivery_chat_messages').insert({
        conversation_id: conversationId,
        sender_id: driverId,
        content: location ? `Le livreur est arrivé à destination. (${location})` : 'Le livreur est arrivé à destination.',
        message_type: 'system'
      })
    } catch {
      // Message système best-effort: ne pas bloquer le workflow livraison si le chat échoue.
    }

    const recipients = new Set<string>()
    if (delivery.customer_id) recipients.add(String(delivery.customer_id))
    if (delivery.vendor_id) recipients.add(String(delivery.vendor_id))

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
            title: 'Livraison: arrivée à destination',
            message: `Le livreur vient d'arriver à destination (livraison #${deliveryId.slice(0, 8)}).`,
            action_url: '/dashboard?tab=deliveries',
            priority: 'high'
          }))
        )
      }
    }

    return NextResponse.json({ data: { ok: true } }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const lower = message.toLowerCase()
    const status =
      lower.includes('token supabase manquant') ||
      lower.includes('utilisateur introuvable') ||
      lower.includes('token invalide')
        ? 401
        : lower.includes('accès réservé aux livreurs')
          ? 403
          : 500

    return NextResponse.json({ error: message }, { status })
  }
}
