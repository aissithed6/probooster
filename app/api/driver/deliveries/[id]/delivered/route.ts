import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertDriver } from '../../../_helpers/auth'
import { getSupabaseAdmin } from '../../../../../../lib/supabase'
import { filterRecipientsByNotificationPreference } from '../../../../_helpers/notification-preferences'

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
 * POST /api/driver/deliveries/:id/delivered
 * Confirme que la livraison a été effectuée par le livreur + upload une preuve photo.
 * - Reçoit un form-data avec champ `file` (image)
 * - Upload dans Storage bucket `delivery-proofs`
 * - Insère un enregistrement dans public.delivery_proofs
 * - Met à jour deliveries.driver_delivered_at + status='delivered'
 * - Ajoute un event delivery_events: driver_delivered
 * - Notifie client, vendeur, super-admin
 */
export async function POST(request: NextRequest, context: { params: { id: string } }) {
  try {
    const driverId = await assertDriver(request)
    const deliveryId = String(context?.params?.id ?? '').trim()

    if (!deliveryId) {
      return NextResponse.json({ error: 'Livraison invalide.' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    const form = await request.formData()
    const file = form.get('file')

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Fichier manquant.' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Type de fichier invalide (image requise).' }, { status: 400 })
    }

    const maxBytes = 5 * 1024 * 1024
    if (file.size > maxBytes) {
      return NextResponse.json({ error: 'Fichier trop volumineux. Taille maximale: 5 Mo.' }, { status: 413 })
    }

    const { data: delivery, error: deliveryError } = await supabase
      .from('deliveries')
      .select('id, order_id, driver_id, customer_id, vendor_id, status')
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

    const extension = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const uniqueId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`

    const bucketName = 'delivery-proofs'
    const objectPath = `deliveries/${deliveryId}/proofs/${uniqueId}.${extension}`

    const { error: uploadError } = await supabase.storage.from(bucketName).upload(objectPath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type
    })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const {
      data: { publicUrl }
    } = supabase.storage.from(bucketName).getPublicUrl(objectPath)

    const nowIso = new Date().toISOString()

    const { error: proofError } = await supabase.from('delivery_proofs').insert({
      delivery_id: deliveryId,
      order_id: delivery.order_id,
      uploaded_by: driverId,
      proof_type: 'photo',
      storage_bucket: bucketName,
      storage_path: objectPath,
      public_url: publicUrl,
      metadata: {
        contentType: file.type,
        size: file.size
      }
    })

    if (proofError) {
      return NextResponse.json({ error: proofError.message }, { status: 500 })
    }

    const { error: updateError } = await supabase
      .from('deliveries')
      .update({ driver_delivered_at: nowIso, status: 'delivered' })
      .eq('id', deliveryId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    const { error: eventError } = await supabase.from('delivery_events').insert({
      delivery_id: deliveryId,
      event_type: 'driver_delivered',
      status: 'delivered',
      description: 'Livraison effectuée par le livreur (preuve photo enregistrée).',
      occurred_at: nowIso,
      data: {
        actor: 'driver',
        driver_id: driverId,
        proof: {
          bucket: bucketName,
          path: objectPath,
          public_url: publicUrl
        }
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
        content: publicUrl
          ? `Le livreur a confirmé la livraison. Preuve photo: ${publicUrl}`
          : 'Le livreur a confirmé la livraison.',
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
            title: 'Livraison: effectuée',
            message: `Le livreur a confirmé la livraison (livraison #${deliveryId.slice(0, 8)}).`,
            action_url: '/dashboard?tab=deliveries',
            priority: 'urgent'
          }))
        )
      }
    }

    return NextResponse.json({ data: { publicUrl, path: objectPath } }, { status: 201 })
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
