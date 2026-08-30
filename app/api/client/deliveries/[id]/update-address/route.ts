import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertCustomer, isClientAuthError } from '../../../_helpers/auth'
import { getSupabaseAdmin } from '../../../../../../lib/supabase'
import { computeShippingCost, fetchDeliveryRules, resolveZoneFromGeo, resolveOrderShippingContext, type DeliveryChangeContext } from '@/lib/server/delivery-pricing'

type UpdateAddressPayload = {
  shippingAddress?: string | null
  shippingLat?: number | null
  shippingLng?: number | null
  mode?: 'standard' | 'express' | string | null
  geo?: Partial<DeliveryChangeContext['geo']> | null
  quantity?: number | null
  weightKg?: number | null
  freeShipping?: boolean | null
  /** Référence FeexPay du paiement du supplément (si supplement > 0). */
  reference?: string | null
  /** Montant supplémentaire attendu (recalculé côté serveur, utilisé pour vérification). */
  expectedSupplement?: number | null
}

type FeexpayVerifyResponse = {
  mode: string
  reference: string
  paid: boolean
  status: string
}

function toFiniteNumber(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : null
}

const EDITABLE_STATUSES = new Set(['pending', 'confirmed', 'processing', 'preparing'])

/**
 * Vérifie le statut d'un paiement FeexPay (même logique que points/purchase).
 */
async function verifyFeexpay(reference: string): Promise<FeexpayVerifyResponse> {
  const mode = (process.env.FEEXPAY_MODE ?? 'mock').toLowerCase()

  if (mode === 'mock') {
    return { mode, reference, paid: true, status: 'successful' }
  }

  const apiKey = process.env.FEEXPAY_API_KEY
  if (!apiKey) {
    throw new Error('FeexPay non configuré (FEEXPAY_API_KEY manquant).')
  }

  const upstream = await fetch(
    `https://api.feexpay.me/api/transactions/public/single/status/${encodeURIComponent(reference)}`,
    {
      method: 'GET',
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${apiKey}`
      },
      cache: 'no-store'
    }
  )

  const upstreamText = await upstream.text().catch(() => '')
  const upstreamJson = (() => {
    if (!upstreamText) return {} as any
    try {
      return JSON.parse(upstreamText) as any
    } catch {
      return {} as any
    }
  })()

  if (!upstream.ok) {
    const msg =
      (upstreamJson as any)?.error ||
      (upstreamJson as any)?.message ||
      (upstreamJson as any)?.responsemsg ||
      'Erreur FeexPay (verify).'
    throw new Error(msg)
  }

  const statusRaw = typeof (upstreamJson as any)?.status === 'string' ? (upstreamJson as any).status : ''
  const status = statusRaw.trim().toUpperCase()
  const operatorStatus = String((upstreamJson as any)?.operator_status ?? '').trim().toUpperCase()
  const reason = String((upstreamJson as any)?.reason ?? '').trim().toUpperCase()
  const responseCode = String((upstreamJson as any)?.responsecode ?? '').trim().toUpperCase()
  const responseMsg = String((upstreamJson as any)?.responsemsg ?? '').trim().toUpperCase()

  const isDeclined = operatorStatus === 'DECLINED' || reason === 'DECLINED'
  const isFailedCode = responseCode === 'FAILED' || responseMsg === 'FAILED'
  const effectiveStatus = isDeclined || isFailedCode ? 'FAILED' : status
  const paid =
    effectiveStatus === 'SUCCESS' ||
    effectiveStatus === 'SUCCESSFUL' ||
    effectiveStatus === 'SUCCEEDED' ||
    effectiveStatus === 'COMPLETED' ||
    effectiveStatus === 'PAID'

  return { mode, reference, paid, status: effectiveStatus || statusRaw || 'UNKNOWN' }
}

/**
 * POST /api/client/deliveries/:id/update-address
 * Met à jour l'adresse + coordonnées de livraison après paiement du supplément (si nécessaire).
 *
 * Flux:
 * 1. Recalcule côté serveur oldShippingCost vs newShippingCost (moteur de règles admin).
 * 2. Si supplement > 0: vérifie le paiement FeexPay (reference) avant toute modification.
 * 3. Met à jour orders (shipping_address, shipping_lat, shipping_lng), deliveries.metadata
 *    et journalise un delivery_events (address_changed).
 * Idempotent: une référence FeexPay déjà utilisée est refusée (delivery_events.data.reference).
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const customerId = await assertCustomer(request)
    const deliveryId = String(params?.id ?? '').trim()
    if (!deliveryId) {
      return NextResponse.json({ error: 'Livraison invalide.' }, { status: 400 })
    }

    const body = (await request.json().catch(() => ({}))) as UpdateAddressPayload

    const shippingAddress = typeof body?.shippingAddress === 'string' ? body.shippingAddress.trim() : ''
    const lat = toFiniteNumber(body?.shippingLat)
    const lng = toFiniteNumber(body?.shippingLng)

    if (!shippingAddress && lat === null) {
      return NextResponse.json({ error: 'Fournir une adresse ou des coordonnées GPS.' }, { status: 400 })
    }

    if (lat !== null && lat === 0 && lng === 0) {
      return NextResponse.json({ error: 'Coordonnées GPS invalides (0,0).' }, { status: 400 })
    }

    if ((lat === null) !== (lng === null)) {
      return NextResponse.json({ error: 'Coordonnées GPS incomplètes (lat et lng requis).' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    const { data: delivery, error: deliveryError } = await supabase
      .from('deliveries')
      .select('id, order_id, customer_id, vendor_id, driver_id, status, metadata')
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
    if (!EDITABLE_STATUSES.has(status)) {
      return NextResponse.json(
        { error: `Cette livraison ne peut plus être modifiée (statut: ${status}).` },
        { status: 409 }
      )
    }

    // --- Recalcul serveur du supplément ---
    const meta = (delivery.metadata ?? {}) as Record<string, unknown>
    const checkoutMeta = (meta?.checkout ?? {}) as Record<string, unknown>
    const oldShippingCost = toFiniteNumber(checkoutMeta?.shippingCost) ?? toFiniteNumber(meta?.shippingCost) ?? 0

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

    const rules = await fetchDeliveryRules()

    // Contexte produit réel de la commande (livraison gratuite par produit + config admin,
    // quantité et poids réels des order_items) — mêmes règles que le checkout.
    const orderCtx = delivery.order_id
      ? await resolveOrderShippingContext({ orderId: String(delivery.order_id), zone, geo, mode })
      : { allFree: false, quantity: Math.max(1, Math.floor(toFiniteNumber(body?.quantity) ?? 1)), weightKg: toFiniteNumber(body?.weightKg), itemCount: 0 }

    // La livraison gratuite configurée s'applique uniquement en mode standard (comme au checkout).
    const freeShipping = mode === 'standard' ? Boolean(orderCtx.allFree) : false

    const newShippingCost = computeShippingCost({
      deliveryRules: rules,
      mode,
      zone,
      geo,
      quantity: orderCtx.quantity,
      weightKg: orderCtx.weightKg,
      freeShipping
    })

    const supplement = Math.max(0, newShippingCost - oldShippingCost)
    const reference = typeof body?.reference === 'string' ? body.reference.trim() : ''

    // --- Vérification paiement si supplément ---
    if (supplement > 0) {
      if (!reference) {
        return NextResponse.json(
          { error: `Un supplément de ${supplement} FCFA est requis. Paiement nécessaire.`, supplement, requiresPayment: true },
          { status: 402 }
        )
      }

      // Idempotence: référence déjà consommée ?
      const { data: existingEvent } = await supabase
        .from('delivery_events')
        .select('id')
        .eq('delivery_id', deliveryId)
        .eq('event_type', 'address_changed')
        .contains('data', { paymentReference: reference })
        .maybeSingle()

      if (existingEvent?.id) {
        return NextResponse.json({ data: { alreadyProcessed: true, reference, supplement } })
      }

      const expected = toFiniteNumber(body?.expectedSupplement)
      if (expected !== null && Math.abs(expected - supplement) > 1) {
        return NextResponse.json(
          { error: `Montant payé (${expected}) différent du supplément recalculé (${supplement}).`, supplement },
          { status: 409 }
        )
      }

      const verification = await verifyFeexpay(reference)
      if (!verification.paid) {
        return NextResponse.json(
          { error: 'Paiement non confirmé.', details: { reference, status: verification.status } },
          { status: 402 }
        )
      }
    }

    const nowIso = new Date().toISOString()

    // --- Mise à jour orders (adresse + coordonnées) ---
    const orderPatch: Record<string, unknown> = {}
    if (shippingAddress) orderPatch.shipping_address = shippingAddress
    if (lat !== null && lng !== null) {
      orderPatch.shipping_lat = lat
      orderPatch.shipping_lng = lng
    }

    if (delivery.order_id && Object.keys(orderPatch).length > 0) {
      const { error: orderError } = await supabase
        .from('orders')
        .update(orderPatch)
        .eq('id', delivery.order_id)

      if (orderError) {
        return NextResponse.json({ error: orderError.message }, { status: 500 })
      }
    }

    // --- Mise à jour deliveries.metadata ---
    const nextMetadata: Record<string, unknown> = { ...meta }
    const nextCheckout = { ...(nextMetadata.checkout as Record<string, unknown> | undefined) }
    if (shippingAddress) nextCheckout.shippingAddress = shippingAddress
    if (lat !== null && lng !== null) {
      nextCheckout.shippingLat = lat
      nextCheckout.shippingLng = lng
    }
    nextCheckout.shippingCost = newShippingCost
    nextCheckout.zone = zone
    nextMetadata.checkout = nextCheckout
    nextMetadata.addressChangedAt = nowIso

    const { error: deliveryUpdateError } = await supabase
      .from('deliveries')
      .update({ metadata: nextMetadata })
      .eq('id', deliveryId)

    if (deliveryUpdateError) {
      return NextResponse.json({ error: deliveryUpdateError.message }, { status: 500 })
    }

    // --- Journalisation ---
    await supabase.from('delivery_events').insert({
      delivery_id: deliveryId,
      event_type: 'address_changed',
      status,
      description: 'Adresse / coordonnées de livraison modifiées par le client.',
      occurred_at: nowIso,
      data: {
        actor: 'client',
        customer_id: customerId,
        previousAddress: checkoutMeta?.shippingAddress ?? null,
        newAddress: shippingAddress || null,
        newCoordinates: lat !== null && lng !== null ? { lat, lng } : null,
        oldShippingCost,
        newShippingCost,
        supplement,
        paymentReference: reference || null,
        paymentMode: supplement > 0 ? (process.env.FEEXPAY_MODE ?? 'mock') : null
      }
    })

    // --- Notifications vendeur + super-admins (non bloquant) ---
    try {
      const recipients = new Set<string>()
      if (delivery.vendor_id) recipients.add(String(delivery.vendor_id))
      const { data: superAdmins } = await supabase.from('users').select('id').eq('role', 'super_admin')
      ;(superAdmins ?? []).forEach((row: any) => {
        if (row?.id) recipients.add(String(row.id))
      })

      const recipientList = Array.from(recipients.values()).filter(Boolean)
      if (recipientList.length > 0) {
        await supabase.from('user_notifications').insert(
          recipientList.map((userId) => ({
            user_id: userId,
            type: 'order',
            title: 'Livraison: adresse modifiée',
            message: `Le client a modifié l'adresse de livraison (livraison #${deliveryId.slice(0, 8)}).${supplement > 0 ? ` Supplément payé: ${supplement} FCFA.` : ''}`,
            action_url: '/dashboard?tab=deliveries',
            priority: 'normal'
          }))
        )
      }
    } catch (notifErr) {
      console.warn('⚠️ update-address: notification échouée (non bloquant):', notifErr)
    }

    return NextResponse.json(
      {
        data: {
          ok: true,
          deliveryId,
          orderId: delivery.order_id,
          shippingAddress: shippingAddress || null,
          coordinates: lat !== null && lng !== null ? { lat, lng } : null,
          oldShippingCost,
          newShippingCost,
          supplement,
          paymentProcessed: supplement > 0,
          reference: reference || null
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