import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertCustomer, isClientAuthError } from '../../../_helpers/auth'
import { getSupabaseAdmin } from '../../../../../../lib/supabase'
import { computeShippingCost, resolveZoneFromGeo, resolveOrderShippingContext, fetchDeliveryRules, type DeliveryChangeContext } from '@/lib/server/delivery-pricing'

type QuotePayload = {
  shippingAddress?: string | null
  shippingLat?: number | null
  shippingLng?: number | null
  mode?: 'standard' | 'express' | string | null
  geo?: Partial<DeliveryChangeContext['geo']> | null
  quantity?: number | null
  weightKg?: number | null
  freeShipping?: boolean | null
}

function toFiniteNumber(value: unknown): number | null {
  // null / undefined / '' => null (et non 0 : Number(null) === 0 sinon l'adresse
  // seule serait transformée en coordonnées 0,0 et rejetée à tort).
  if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) return null
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : null
}

/**
 * POST /api/client/deliveries/:id/quote-change
 * Calcule le supplément (ou remise) résultant d'un changement d'adresse/coordonnées de livraison.
 * Ne modifie aucune donnée : renvoie oldShippingCost / newShippingCost / supplement.
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const customerId = await assertCustomer(request)
    const deliveryId = String(params?.id ?? '').trim()
    if (!deliveryId) {
      return NextResponse.json({ error: 'Livraison invalide.' }, { status: 400 })
    }

    const body = (await request.json().catch(() => ({}))) as QuotePayload

    const lat = toFiniteNumber(body?.shippingLat)
    const lng = toFiniteNumber(body?.shippingLng)

    // Coordonnées 0/0 = invalide (pin océan).
    if ((lat !== null && lat === 0 && lng === 0) || (lat !== null) !== (lng !== null)) {
      return NextResponse.json({ error: 'Coordonnées GPS invalides.' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    const { data: delivery, error: deliveryError } = await supabase
      .from('deliveries')
      .select('id, order_id, customer_id, status, metadata')
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
    const editableStatuses = new Set(['pending', 'confirmed', 'processing', 'preparing'])
    if (!editableStatuses.has(status)) {
      return NextResponse.json(
        { error: "Cette livraison ne peut plus être modifiée (statut: " + status + ")." },
        { status: 409 }
      )
    }

    // Ancien coût livraison stocké dans metadata au checkout (fallback 0).
    const meta = (delivery.metadata ?? {}) as Record<string, unknown>
    const checkoutMeta = (meta?.checkout ?? {}) as Record<string, unknown>
    const oldShippingCost = toFiniteNumber(checkoutMeta?.shippingCost) ?? toFiniteNumber(meta?.shippingCost) ?? 0

    // Contexte produit réel de la commande (livraison gratuite par produit + config admin,
    // quantité et poids réels des order_items) — mêmes règles que le checkout.
    const geo: DeliveryChangeContext['geo'] = {
      country: body?.geo?.country ?? null,
      regionDepartment: body?.geo?.regionDepartment ?? null,
      localDistrict: body?.geo?.localDistrict ?? null,
      department: body?.geo?.department ?? null,
      city: body?.geo?.city ?? null,
      arrondissement: body?.geo?.arrondissement ?? null,
      district: body?.geo?.district ?? null
    }

    const mode = String(body?.mode ?? 'standard') === 'express' ? 'express' : 'standard'
    const zone = resolveZoneFromGeo(geo)

    const orderCtx = delivery.order_id
      ? await resolveOrderShippingContext({ orderId: String(delivery.order_id), zone, geo, mode })
      : { allFree: false, quantity: 1, weightKg: null, itemCount: 0 }

    // La livraison gratuite configurée s'applique uniquement en mode standard (comme au checkout).
    const freeShipping = mode === 'standard' ? Boolean(orderCtx.allFree) : false

    const rules = await fetchDeliveryRules()

    const finalCost = computeShippingCost({
      deliveryRules: rules,
      mode,
      zone,
      geo,
      quantity: orderCtx.quantity,
      weightKg: orderCtx.weightKg,
      freeShipping
    })

    const newShippingCostFinal = freeShipping ? 0 : finalCost
    const supplement = Math.max(0, newShippingCostFinal - oldShippingCost)

    return NextResponse.json(
      {
        data: {
          ok: true,
          zone,
          mode,
          freeShipping,
          oldShippingCost,
          newShippingCost: newShippingCostFinal,
          supplement,
          requiresPayment: supplement > 0,
          currency: 'XOF'
        }
      },
      { status: 200 }
    )
  } catch (err) {
    if (isClientAuthError(err)) {
      return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 })
    }
    const message = err instanceof Error ? err.message : 'Erreur inconnue.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}