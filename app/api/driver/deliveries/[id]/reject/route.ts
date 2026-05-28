'use server'

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertDriver } from '../../../_helpers/auth'
import { getSupabaseAdmin } from '../../../../../../lib/supabase'

interface RouteParams {
  params: { id: string }
}

interface DeliveryRow {
  id: string
  order_id: string
  driver_id: string | null
  status: string
}

/**
 * Récupère ou crée la conversation livraison et s'assure que le driver y est participant.
 */
async function ensureDriverInDeliveryChat(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  orderId: string,
  driverId: string
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

  const { error: participantError } = await supabase
    .from('delivery_chat_participants')
    .upsert(
      {
        conversation_id: conversationId,
        user_id: driverId,
        role_in_conversation: 'driver'
      },
      { onConflict: 'conversation_id,user_id' }
    )

  if (participantError) {
    throw new Error(participantError.message)
  }

  return conversationId
}

/**
 * POST /api/driver/deliveries/:id/reject — Le livreur refuse la livraison.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const driverId = await assertDriver(request)
    const supabase = getSupabaseAdmin()

    const deliveryId = params.id
    if (!deliveryId) {
      return NextResponse.json({ error: 'Identifiant livraison requis.' }, { status: 400 })
    }

    const body = (await request.json().catch(() => ({}))) as { reason?: string | null }

    const { data: delivery, error: fetchError } = await supabase
      .from('deliveries')
      .select('id, order_id, driver_id, status')
      .eq('id', deliveryId)
      .maybeSingle()

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!delivery) {
      return NextResponse.json({ error: 'Livraison introuvable.' }, { status: 404 })
    }

    const row = delivery as DeliveryRow

    if (row.driver_id !== driverId) {
      return NextResponse.json({ error: 'Cette livraison ne vous est pas assignée.' }, { status: 403 })
    }

    if (['delivered', 'cancelled', 'failed'].includes(row.status)) {
      return NextResponse.json({ error: 'Cette livraison ne peut pas être refusée dans son état actuel.' }, { status: 409 })
    }

    const { error: updateError } = await supabase
      .from('deliveries')
      .update({ driver_id: null, status: 'pending' })
      .eq('id', deliveryId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    await supabase.from('delivery_events').insert({
      delivery_id: deliveryId,
      event_type: 'driver_reject',
      status: 'pending',
      description: 'Livraison refusée par le livreur (réassignation requise).',
      occurred_at: new Date().toISOString(),
      data: { actor: 'driver', driver_id: driverId, reason: body?.reason ?? null }
    })

    const conversationId = await ensureDriverInDeliveryChat(supabase, row.order_id, driverId)

    const reason = typeof body?.reason === 'string' ? body.reason.trim() : ''
    await supabase.from('delivery_chat_messages').insert({
      conversation_id: conversationId,
      sender_id: driverId,
      content: reason ? `Le livreur a refusé la livraison. Motif: ${reason}` : 'Le livreur a refusé la livraison.',
      message_type: 'system'
    })

    return NextResponse.json({ success: true })
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
