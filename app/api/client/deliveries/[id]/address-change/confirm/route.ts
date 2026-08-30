import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertCustomer, isClientAuthError } from '../../../../_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import {
  computeShippingCost,
  fetchDeliveryRules,
  jsonError,
  loadEditableDelivery,
  parseAddressChangePayload,
  verifyFeexpayPayment
} from '../helper'

/**
 * POST /api/client/deliveries/:id/address-change/confirm
 * Vérifie le paiement FeexPay du supplément (si requis), puis met à jour
 * l'adresse + coordonnées sur orders et deliveries, et journalise l'événement.
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const customerId = await assertCustomer(request)
    const deliveryId = String(params?.id ?? '').trim()
    if (!deliveryId) return jsonError('Livraison invalide.', 400)

    const supabase = getSupabaseAdmin()

    const loaded = await loadEditableDelivery(supabase, deliveryId, customerId)
    if (!loaded.delivery) return jsonError(loaded.error ?? 'Livraison introuvable.', loaded.statusCode ?? 404)
    const delivery = loaded.delivery

    const body = await request.json().catch(() => ({}))
    const parsed = parseAddressChangePayload(body)
    if (parsed.error) return jsonError(parsed.error, 400)
    const payload = parsed.payload

    // Recalcul serveur (jamais confiance au montant client)
    const rules = await fetchDeliveryRules(supabase)
    if (rules.length === 0) return jsonError('Configuration de livraison indisponible.', 503)

    const newCost = computeShippingCost(rules, payload)
    if (newCost === null) {
      return jsonError('Aucune règle de livraison ne correspond à cette destination.', 422)
    }

    const oldCost = Number(delivery.orders?.shipping_cost ?? 0) || 0
    const supplement = Math.max(0, newCost - oldCost)
    const reference = typeof body?.paymentReference === 'string' ? body.paymentReference.trim() : ''

    // Vérification du paiement si un supplément est dû
    if (supplement > 0) {
      if (!reference) return jsonError('Référence de paiement manquante.', 400)
      const verification = await verifyFeexpayPayment(reference, supplement)
      if (!verification.paid) {
        return jsonError(verification.error ?? 'Paiement non confirmé.', 402)
      }
    }

    const nowIso = new Date().toISOString()

    // 1) Mise à jour de la commande (adresse + coordonnées + coût)
    const orderUpdate: Record<string, unknown> = {
      shipping_lat: payload.shippingLat ?? null,
      shipping_lng: payload.shippingLng ?? null
    }
    if (payload.shippingAddress) orderUpdate.shipping_address = payload.shippingAddress
    if (supplement > 0) orderUpdate.shipping_cost = newCost

    const { error: orderUpdateError } = await supabase
      .from('orders')
      .update(orderUpdate)
      .eq('id', delivery.order_id)

    if (orderUpdateError) return jsonError(orderUpdateError.message, 500)

    // 2) Metadata livraison (traçabilité du changement)
    const previousMetadata = delivery.metadata ?? {}
    const addressHistory = Array.isArray((previousMetadata as any)?.addressChanges)
      ? (previousMetadata as any).addressChanges
      : []

    const { error: deliveryUpdateError } = await supabase
      .from('deliveries')
      .update({
        metadata: {
          ...previousMetadata,
          addressChanges: [
            ...addressHistory,
            {
              changedAt: nowIso,
              changedBy: customerId,
              shippingAddress: payload.shippingAddress ?? null,
              shippingLat: payload.shippingLat ?? null,
              shippingLng: payload.shippingLng ?? null,
              oldShippingCost: oldCost,
              newShippingCost: newCost,
              supplement,
              paymentReference: supplement > 0 ? reference : null
            }
          ]
        }
      })
      .eq('id', deliveryId)

    if (deliveryUpdateError) return jsonError(deliveryUpdateError.message, 500)

    // 3) Événement de suivi
    const description =
      supplement > 0
        ? `Adresse de livraison modifiée par le client. Supplément payé: ${supplement} XOF (réf: ${reference}).`
        : 'Adresse de livraison modifiée par le client (aucun supplément).'

    await supabase.from('delivery_events').insert({
      delivery_id: deliveryId,
      event_type: 'address_changed',
      status: String(delivery.status ?? 'pending'),
      description,
      occurred_at: nowIso,
      data: {
        actor: 'client',
        customer_id: customerId,
        shippingLat: payload.shippingLat ?? null,
        shippingLng: payload.shippingLng ?? null,
        supplement,
        paymentReference: supplement > 0 ? reference : null
      }
    })

    // 4) Notification vendeur + admins
    const recipients = new Set<string>()
    if (delivery.vendor_id) recipients.add(String(delivery.vendor_id))
    const { data: superAdmins } = await supabase.from('users').select('id').eq('role', 'super_admin')
    ;(superAdmins ?? []).forEach((row: any) => {
      if (row?.id) recipients.add(String(row.id))
    })

    if (recipients.size > 0) {
      await supabase.from('user_notifications').insert(
        Array.from(recipients).map((userId) => ({
          user_id: userId,
          type: 'order',
          title: 'Livraison: adresse modifiée',
          message: `Le client a modifié l'adresse de livraison #${deliveryId.slice(0, 8)}${supplement > 0 ? ` (supplément: ${supplement} XOF)` : ''}.`,
          action_url: '/super-admin-dashboard?section=deliveries',
          priority: supplement > 0 ? 'high' : 'normal'
        }))
      )
    }

    return NextResponse.json({
      data: {
        ok: true,
        shippingAddress: payload.shippingAddress ?? null,
        destinationCoordinates:
          payload.shippingLat !== null && payload.shippingLng !== null
            ? { lat: payload.shippingLat, lng: payload.shippingLng }
            : null,
        oldShippingCost: oldCost,
        newShippingCost: newCost,
        supplement,
        paid: supplement > 0
      }
    })
  } catch (err) {
    if (isClientAuthError(err)) return jsonError('Authentification requise.', 401)
    return jsonError(err instanceof Error ? err.message : 'Erreur inconnue.', 500)
  }
}

