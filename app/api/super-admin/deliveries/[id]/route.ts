'use server'

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertOpsOrSuperAdmin } from '@/app/api/super-admin/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

type JsonRecord = Record<string, unknown>

type DeliveryStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready_for_pickup'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delayed'
  | 'delivered'
  | 'failed'
  | 'cancelled'

interface RouteParams {
  params: { id: string }
}

interface DeliveryPatchPayload {
  orderId?: string
  customerId?: string | null
  vendorId?: string | null
  status?: DeliveryStatus
  priority?: string | null
  eta?: string | null
  dispatchedAt?: string | null
  deliveredAt?: string | null
  cancelledAt?: string | null
  currentLocation?: string | null
  progressPercent?: number | null
  liveLat?: number | null
  liveLng?: number | null
  driverId?: string | null
  driver?: {
    name?: string | null
    phone?: string | null
    vehiclePlate?: string | null
  }
  trackingNumber?: string | null
  shippingMethodId?: string | null
  carrierId?: string | null
  metadata?: JsonRecord | null
}

/**
 * PATCH /api/super-admin/deliveries/:id — Met à jour une livraison (Super Admin).
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const superAdminId = await assertOpsOrSuperAdmin(request)
    const supabase = getSupabaseAdmin()

    const deliveryId = params.id
    if (!deliveryId) {
      return NextResponse.json({ error: 'Identifiant livraison requis.' }, { status: 400 })
    }

    const payload = (await request.json()) as DeliveryPatchPayload

    const updateInput: JsonRecord = {
      updated_by: superAdminId
    }

    // Option C: si orderId change, customerId/vendorId sont recalculés depuis orders (source de vérité).
    if (payload.orderId) {
      const { data: orderRow, error: orderError } = await supabase
        .from('orders')
        .select('id, customer_id, vendor_id')
        .eq('id', payload.orderId)
        .maybeSingle()

      if (orderError) {
        const message = orderError.message ?? orderError.hint ?? orderError.details ?? 'Impossible de charger la commande.'
        return NextResponse.json({ error: message }, { status: 500 })
      }

      if (!orderRow) {
        return NextResponse.json({ error: 'Commande introuvable.' }, { status: 404 })
      }

      updateInput.order_id = payload.orderId
      updateInput.customer_id = (orderRow as any)?.customer_id ?? null
      updateInput.vendor_id = (orderRow as any)?.vendor_id ?? null
    } else {
      if (payload.customerId !== undefined) updateInput.customer_id = payload.customerId
      if (payload.vendorId !== undefined) updateInput.vendor_id = payload.vendorId
    }
    if (payload.status) updateInput.status = payload.status
    if (payload.priority !== undefined) updateInput.priority = payload.priority
    if (payload.eta !== undefined) updateInput.eta = payload.eta
    if (payload.dispatchedAt !== undefined) updateInput.dispatched_at = payload.dispatchedAt
    if (payload.deliveredAt !== undefined) updateInput.delivered_at = payload.deliveredAt
    if (payload.cancelledAt !== undefined) updateInput.cancelled_at = payload.cancelledAt
    if (payload.currentLocation !== undefined) updateInput.current_location = payload.currentLocation

    if (payload.progressPercent !== undefined) {
      updateInput.progress_percent = payload.progressPercent
    }
    if (payload.liveLat !== undefined) {
      updateInput.live_lat = payload.liveLat
    }
    if (payload.liveLng !== undefined) {
      updateInput.live_lng = payload.liveLng
    }

    if (payload.driverId !== undefined) updateInput.driver_id = payload.driverId
    if (payload.driver?.name !== undefined) updateInput.driver_name = payload.driver.name
    if (payload.driver?.phone !== undefined) updateInput.driver_phone = payload.driver.phone
    if (payload.driver?.vehiclePlate !== undefined) updateInput.vehicle_plate = payload.driver.vehiclePlate
    if (payload.trackingNumber !== undefined) updateInput.tracking_number = payload.trackingNumber
    if (payload.shippingMethodId !== undefined) updateInput.shipping_method_id = payload.shippingMethodId
    if (payload.carrierId !== undefined) updateInput.carrier_id = payload.carrierId
    if (payload.metadata !== undefined) updateInput.metadata = payload.metadata

    const patchKeys = Object.keys(updateInput).filter((k) => k !== 'updated_by')
    if (patchKeys.length === 0) {
      return NextResponse.json({ error: 'Aucun champ à mettre à jour.' }, { status: 400 })
    }

    const { data: updated, error } = await supabase
      .from('deliveries')
      .update(updateInput)
      .eq('id', deliveryId)
      .select(
        `*,
        orders:orders!deliveries_order_id_fkey(id, order_number, vendor_id, customer_id, shipping_lat, shipping_lng),
        shipping_methods:shipping_method_id(*),
        carrier:carrier_id(*),
        delivery_events(*)
        `
      )
      .maybeSingle()

    if (error) {
      const message = error.message ?? error.hint ?? error.details ?? 'Impossible de mettre à jour la livraison.'
      return NextResponse.json({ error: message }, { status: 500 })
    }

    if (!updated) {
      return NextResponse.json({ error: 'Livraison introuvable.' }, { status: 404 })
    }

    try {
      await supabase.from('delivery_events').insert({
        delivery_id: deliveryId,
        event_type: 'updated',
        status: (payload.status ?? (updated as any)?.status ?? null) as string | null,
        description: 'Livraison modifiée par le back-office.',
        occurred_at: new Date().toISOString(),
        data: { actor: 'super_admin', updated_by: superAdminId, patch: payload }
      })
    } catch (eventError) {
      console.warn('⚠️ Impossible d\'ajouter l\'event delivery_events (updated):', eventError)
    }

    return NextResponse.json({ data: updated })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const status = message.toLowerCase().includes('accès') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

/**
 * DELETE /api/super-admin/deliveries/:id — Supprime une livraison (Super Admin).
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const superAdminId = await assertOpsOrSuperAdmin(request)
    const supabase = getSupabaseAdmin()

    const deliveryId = params.id
    if (!deliveryId) {
      return NextResponse.json({ error: 'Identifiant livraison requis.' }, { status: 400 })
    }

    const { data: existing, error: fetchError } = await supabase
      .from('deliveries')
      .select('id,status')
      .eq('id', deliveryId)
      .maybeSingle()

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!existing) {
      return NextResponse.json({ error: 'Livraison introuvable.' }, { status: 404 })
    }

    try {
      await supabase.from('delivery_events').insert({
        delivery_id: deliveryId,
        event_type: 'deleted',
        status: (existing as any)?.status ?? null,
        description: 'Livraison supprimée par le back-office.',
        occurred_at: new Date().toISOString(),
        data: { actor: 'super_admin', deleted_by: superAdminId }
      })
    } catch (eventError) {
      console.warn('⚠️ Impossible d\'ajouter l\'event delivery_events (deleted):', eventError)
    }

    const { error: deleteError } = await supabase.from('deliveries').delete().eq('id', deliveryId)

    if (deleteError) {
      const message = deleteError.message ?? deleteError.hint ?? deleteError.details ?? 'Impossible de supprimer la livraison.'
      return NextResponse.json({ error: message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const status = message.toLowerCase().includes('accès') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
