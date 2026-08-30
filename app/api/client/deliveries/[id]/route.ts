import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertCustomer } from '@/app/api/client/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

/**
 * Retourne le détail d'une livraison appartenant au client connecté.
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const customerId = await assertCustomer(request)
    const supabase = getSupabaseAdmin()

        const { data: delivery, error } = await supabase
      .from('deliveries')
      .select(
        `
          *,
          shipping_methods:shipping_method_id (*),
          carrier:carrier_id (*),
          delivery_events (*),
          orders!inner (id, payment_method, payment_status, vendor_id, shipping_lat, shipping_lng)
        `
      )
      .eq('id', params.id)
      .eq('customer_id', customerId)
      .maybeSingle()

    if (error) {
      console.error('❌ Erreur lors de la récupération de la livraison client:', error)
      return NextResponse.json({ error: 'Erreur lors de la récupération de la livraison.' }, { status: 500 })
    }

    if (!delivery) {
      return NextResponse.json({ error: 'Livraison introuvable.' }, { status: 404 })
    }

    // Résolution du nom du vendeur via orders.vendor_id (les profiles vendeur sont dans
    // user_profiles, indexé par id ou user_id selon la convention enregistrée).
    let vendorInfo: { id: string | null; name: string | null } | null = null
    const vendorIdValue = (delivery as any)?.orders?.vendor_id ?? (delivery as any)?.vendor_id ?? null
    if (typeof vendorIdValue === 'string' && vendorIdValue.trim().length > 0) {
      const vids = [vendorIdValue]
      const [byIdRes, byUserIdRes] = await Promise.all([
        supabase.from('user_profiles').select('id, user_id, first_name, last_name, metadata').in('id', vids as any),
        supabase.from('user_profiles').select('id, user_id, first_name, last_name, metadata').in('user_id', vids as any)
      ])
      const profile = (byIdRes.data?.[0] ?? byUserIdRes.data?.[0]) as
        | { first_name?: string | null; last_name?: string | null; metadata?: Record<string, unknown> | null }
        | undefined
      if (profile) {
        const prefs = (profile.metadata as any)?.preferences ?? {}
        const rawName = prefs?.business_name ?? prefs?.store_name ?? prefs?.company ?? null
        const fallback = [profile.first_name, profile.last_name]
          .filter((p): p is string => typeof p === 'string' && p.trim().length > 0)
          .join(' ')
        vendorInfo = {
          id: vendorIdValue,
          name:
            typeof rawName === 'string' && rawName.trim().length > 0
              ? rawName.trim()
              : (fallback || null)
        }
      } else {
        vendorInfo = { id: vendorIdValue, name: null }
      }
    }

    const normalized = {
      id: delivery.id,
      orderId: delivery.order_id,
      orderNumber: delivery.orders?.id ?? delivery.order_id,
      status: delivery.status,
      priority: delivery.priority,
      eta: delivery.eta,
      dispatchedAt: delivery.dispatched_at,
      deliveredAt: delivery.delivered_at,
      cancelledAt: delivery.cancelled_at,
      currentLocation: delivery.current_location,
      paymentMethod: delivery.orders?.payment_method ?? 'cod',
      paymentStatus: delivery.orders?.payment_status ?? 'pending',
      vendor: vendorInfo,
      driver: delivery.driver_name
        ? {
            name: delivery.driver_name,
            phone: delivery.driver_phone,
            vehiclePlate: delivery.vehicle_plate
          }
        : null,
      trackingNumber: delivery.tracking_number,
      progressPercent: delivery.progress_percent,
      coordinates: delivery.live_lat !== null && delivery.live_lng !== null
        ? { lat: Number(delivery.live_lat), lng: Number(delivery.live_lng) }
        : null,
      shippingMethod: delivery.shipping_methods
        ? {
            id: delivery.shipping_methods.id,
            name: delivery.shipping_methods.name,
            description: delivery.shipping_methods.description,
            basePrice: delivery.shipping_methods.base_price,
            currency: delivery.shipping_methods.currency,
            estimatedMinMinutes: delivery.shipping_methods.estimated_min_minutes,
            estimatedMaxMinutes: delivery.shipping_methods.estimated_max_minutes,
            serviceLevel: delivery.shipping_methods.service_level,
            metadata: delivery.shipping_methods.metadata
          }
        : null,
      carrier: delivery.carrier
        ? {
            id: delivery.carrier.id,
            name: delivery.carrier.name,
            contactPhone: delivery.carrier.contact_phone,
            contactEmail: delivery.carrier.contact_email,
            trackingUrlTemplate: delivery.carrier.tracking_url_template,
            supportsGps: delivery.carrier.supports_gps,
            metadata: delivery.carrier.metadata
          }
        : null,
            destinationCoordinates:
        delivery.orders?.shipping_lat !== null && delivery.orders?.shipping_lat !== undefined &&
        delivery.orders?.shipping_lng !== null && delivery.orders?.shipping_lng !== undefined
          ? { lat: Number(delivery.orders.shipping_lat), lng: Number(delivery.orders.shipping_lng) }
          : null,
      events: (delivery.delivery_events ?? [])
        .sort((a: any, b: any) => new Date(a.occurred_at ?? a.created_at ?? '').getTime() - new Date(b.occurred_at ?? b.created_at ?? '').getTime())
        .map((event: any) => ({
          id: event.id,
          type: event.event_type,
          status: event.status,
          description: event.description,
          location: event.location,
          coordinates: event.latitude !== null && event.longitude !== null
            ? { lat: Number(event.latitude), lng: Number(event.longitude) }
            : null,
          occurredAt: event.occurred_at,
          data: event.data
        })),
      metadata: delivery.metadata,
      createdAt: delivery.created_at,
      updatedAt: delivery.updated_at
    }

    return NextResponse.json({ data: normalized })
  } catch (err) {
    console.error('❌ Erreur inattendue lors de la récupération du détail de livraison client:', err)
    return NextResponse.json({ error: 'Erreur inattendue.' }, { status: 500 })
  }
}
