import type { NextRequest } from 'next/server'

import { assertCustomer, isClientAuthError } from '../../../../_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import {
  computeShippingCost,
  fetchDeliveryRules,
  jsonError,
  loadEditableDelivery,
  parseAddressChangePayload,
  type AddressChangePayload
} from '../helper'

/**
 * POST /api/client/deliveries/:id/address-change/quote
 * Calcule en direct le nouveau coût de livraison (règles admin) et le supplément à payer.
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const customerId = await assertCustomer(request)
    const deliveryId = String(params?.id ?? '').trim()
    if (!deliveryId) return jsonError('Livraison invalide.', 400)

    const supabase = getSupabaseAdmin()

    const loaded = await loadEditableDelivery(supabase, deliveryId, customerId)
    if (!loaded.delivery) return jsonError(loaded.error ?? 'Livraison introuvable.', loaded.statusCode ?? 404)

    const body = await request.json().catch(() => ({}))
    const parsed = parseAddressChangePayload(body)
    if (parsed.error) return jsonError(parsed.error, 400)

    const payload: AddressChangePayload = parsed.payload
    const rules = await fetchDeliveryRules(supabase)
    if (rules.length === 0) return jsonError('Configuration de livraison indisponible.', 503)

    const newCost = computeShippingCost(rules, payload)
    if (newCost === null) {
      return jsonError('Aucune règle de livraison ne correspond à cette destination. Contactez le support.', 422)
    }

    const oldCost = Number(loaded.delivery.orders?.shipping_cost ?? 0) || 0
    const supplement = Math.max(0, newCost - oldCost)

    return NextResponse.json({
      data: {
        oldShippingCost: oldCost,
        newShippingCost: newCost,
        supplement,
        requiresPayment: supplement > 0,
        currency: 'XOF'
      }
    })
  } catch (err) {
    if (isClientAuthError(err)) return jsonError('Authentification requise.', 401)
    return jsonError(err instanceof Error ? err.message : 'Erreur inconnue.', 500)
  }
}
