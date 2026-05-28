'use server'

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertDriver } from '../_helpers/auth'
import { getSupabaseAdmin } from '../../../../lib/supabase'

type UserProfileNameRow = {
  user_id: string
  first_name: string | null
  last_name: string | null
  address?: string | null
  city?: string | null
  country?: string | null
  postal_code?: string | null
  phone?: string | null
}

type DeliveryPreferenceRow = {
  customer_id: string
  metadata: Record<string, unknown> | null
}

function formatProfileAddress(profile?: UserProfileNameRow | null): string | null {
  if (!profile) return null
  const parts = [profile.address, profile.city, profile.country, profile.postal_code]
    .map((v) => (typeof v === 'string' ? v.trim() : ''))
    .filter(Boolean)
  const label = parts.join(', ').trim()
  if (label.length > 0) return label
  const phone = typeof profile.phone === 'string' ? profile.phone.trim() : ''
  return phone.length > 0 ? phone : null
}

/**
 * Convertit une adresse (JSON ou string) en texte lisible.
 */
function formatShippingAddress(value: unknown): string | null {
  if (!value) return null
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed.length === 0) return null

    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed)
        return formatShippingAddress(parsed)
      } catch {
        return trimmed
      }
    }

    return trimmed
  }
  if (typeof value !== 'object') return null

  const record = value as Record<string, unknown>
  const parts: string[] = []
  const pushPart = (candidate: unknown) => {
    if (typeof candidate !== 'string') return
    const trimmed = candidate.trim()
    if (trimmed.length === 0) return
    parts.push(trimmed)
  }

  pushPart((record as any)?.customer_email)
  pushPart((record as any)?.customerEmail)
  pushPart((record as any)?.customer_phone)
  pushPart((record as any)?.customerPhone)

  const deliveryRaw = (record as any)?.delivery_address ?? (record as any)?.deliveryAddress ?? null
  if (typeof deliveryRaw === 'string') {
    pushPart(deliveryRaw)
  }

  const extractParts = (obj: unknown): string[] => {
    if (!obj || typeof obj !== 'object') return []
    const r = obj as Record<string, unknown>
    return [
      r['name'],
      r['full_name'],
      r['recipient'],
      r['address'],
      r['address1'],
      r['address2'],
      r['line1'],
      r['line2'],
      r['street'],
      r['street_address'],
      r['neighborhood'],
      r['quartier'],
      r['arrondissement'],
      r['district'],
      r['commune'],
      r['city'],
      r['town'],
      r['state'],
      r['region'],
      r['province'],
      r['postal_code'],
      r['zip'],
      r['country'],
      r['landmark'],
      r['note'],
      r['phone'],
      r['phone_number']
    ]
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter((item) => item.length > 0)
  }

  parts.push(...extractParts(record))

  if (deliveryRaw && typeof deliveryRaw === 'object') {
    parts.push(...extractParts(deliveryRaw))
  }

  const label = parts.join(', ').trim()
  if (label.length > 0) return label

  const nestedCandidates = [record['address'], record['shipping'], record['location'], record['destination']]
  const nestedParts = nestedCandidates.flatMap((candidate) => extractParts(candidate))
  const nestedLabel = nestedParts.join(', ').trim()
  if (nestedLabel.length > 0) return nestedLabel

  try {
    const jsonFallback = JSON.stringify(record)
    return jsonFallback.length > 0 ? jsonFallback : null
  } catch {
    return null
  }
}

interface DeliveryEventRow {
  id: string
  event_type: string | null
  status: string | null
  description: string | null
  location: string | null
  latitude: number | null
  longitude: number | null
  occurred_at: string | null
  created_at: string | null
  data: Record<string, unknown> | null
}

interface DeliveryRow {
  id: string
  order_id: string
  customer_id: string | null
  vendor_id: string | null
  driver_id: string | null
  status: string
  priority: string | null
  eta: string | null
  dispatched_at: string | null
  delivered_at: string | null
  cancelled_at: string | null
  current_location: string | null
  driver_name: string | null
  driver_phone: string | null
  vehicle_plate: string | null
  tracking_number: string | null
  progress_percent: number | null
  live_lat: number | null
  live_lng: number | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
  delivery_events: DeliveryEventRow[] | null
  orders: {
    id: string
    order_number?: string | null
    customer_id?: string | null
    vendor_id?: string | null
    shipping_address?: any | null
    billing_address?: any | null
    shipping_lat?: number | null
    shipping_lng?: number | null
  } | null
}

function normalizeEffectiveDeliveryStatus(status: string, events: DeliveryEventRow[] | null | undefined): string {
  const raw = String(status ?? '').trim().toLowerCase()
  const types = new Set(
    (Array.isArray(events) ? events : []).map((e) => String(e?.event_type ?? '').trim().toLowerCase())
  )

  if (raw === 'pending' && (types.has('driver_accept') || types.has('driver_accepted'))) {
    return 'confirmed'
  }

  return raw.length > 0 ? raw : 'pending'
}

/**
 * GET /api/driver/deliveries — Liste des livraisons assignées au livreur connecté.
 */
export async function GET(request: NextRequest) {
  try {
    const driverUserId = await assertDriver(request)
    const supabase = getSupabaseAdmin()

    const { data: deliveries, error } = await supabase
      .from('deliveries')
      .select(
        `
          *,
          delivery_events (*),
          orders:orders!deliveries_order_id_fkey (id, order_number, customer_id, vendor_id, shipping_address, shipping_lat, shipping_lng)
        `
      )
      .eq('driver_id', driverUserId)
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) {
      const rawMessage = error.message ?? error.hint ?? error.details ?? 'Erreur lors de la récupération des livraisons.'

      // Cas fréquent en dev: la migration shipping_lat/shipping_lng n'a pas encore été appliquée.
      // On retente une requête compatible pour ne pas bloquer le dashboard.
      const lower = rawMessage.toLowerCase()
      const shouldFallback =
        lower.includes('shipping_lat') ||
        lower.includes('shipping_lng') ||
        lower.includes('order_number') ||
        lower.includes('orders_1_order_number')

      if (shouldFallback) {
        const { data: fallbackDeliveries, error: fallbackError } = await supabase
          .from('deliveries')
          .select(
            `
              *,
              delivery_events (*),
              orders:orders!deliveries_order_id_fkey (id, customer_id, vendor_id, shipping_address)
            `
          )
          .eq('driver_id', driverUserId)
          .order('created_at', { ascending: false })
          .limit(200)

        if (fallbackError) {
          const message = fallbackError.message ?? fallbackError.hint ?? fallbackError.details ?? rawMessage
          return NextResponse.json({ error: message }, { status: 500 })
        }

        const normalizedFallbackBase = ((fallbackDeliveries ?? []) as DeliveryRow[]).map((delivery) => {
          const sortedEvents = [...(delivery.delivery_events ?? [])].sort((a: DeliveryEventRow, b: DeliveryEventRow) => {
            const first = new Date(a.occurred_at ?? a.created_at ?? '').getTime()
            const second = new Date(b.occurred_at ?? b.created_at ?? '').getTime()
            return first - second
          })

          return {
            id: delivery.id,
            orderId: delivery.order_id,
            orderNumber: delivery.orders?.order_number ?? delivery.orders?.id ?? delivery.order_id,
            customerId: delivery.customer_id,
            vendorId: delivery.vendor_id,
            status: delivery.status,
            priority: delivery.priority,
            eta: delivery.eta,
            dispatchedAt: delivery.dispatched_at,
            deliveredAt: delivery.delivered_at,
            cancelledAt: delivery.cancelled_at,
            currentLocation: delivery.current_location,
            trackingNumber: delivery.tracking_number,
            progressPercent: delivery.progress_percent ?? 0,
            coordinates:
              delivery.live_lat !== null && delivery.live_lng !== null
                ? { lat: delivery.live_lat, lng: delivery.live_lng }
                : null,
            destinationCoordinates: null,
            driver: {
              userId: delivery.driver_id,
              name: delivery.driver_name,
              phone: delivery.driver_phone,
              vehiclePlate: delivery.vehicle_plate
            },
            shippingAddress: delivery.orders?.shipping_address ?? null,
            deliveryAddress:
              formatShippingAddress(delivery.orders?.shipping_address ?? null) ??
              formatShippingAddress((delivery.orders as any)?.billing_address ?? null),
            events: sortedEvents.map((event) => ({
              id: event.id,
              type: event.event_type,
              status: event.status,
              description: event.description,
              location: event.location,
              coordinates:
                event.latitude !== null && event.longitude !== null
                  ? { lat: event.latitude, lng: event.longitude }
                  : null,
              occurredAt: event.occurred_at ?? event.created_at,
              data: event.data ?? {}
            })),
            metadata: delivery.metadata ?? {},
            createdAt: delivery.created_at,
            updatedAt: delivery.updated_at
          }
        })

        const ids = new Set<string>()
        normalizedFallbackBase.forEach((row) => {
          if (row.customerId) ids.add(String(row.customerId))
          if (row.vendorId) ids.add(String(row.vendorId))
        })

        let nameByUserId = new Map<string, string>()
        const idList = Array.from(ids.values()).filter(Boolean)
        if (idList.length > 0) {
          const { data: profiles } = await supabase
            .from('user_profiles')
            .select('user_id,first_name,last_name')
            .in('user_id', idList)

          if (profiles) {
            nameByUserId = new Map(
              (profiles as UserProfileNameRow[]).map((p) => {
                const name = [p.first_name, p.last_name].filter(Boolean).join(' ').trim()
                return [p.user_id, name]
              })
            )
          }
        }

        const normalizedFallback = normalizedFallbackBase.map((row) => ({
          ...row,
          customerName: row.customerId ? nameByUserId.get(String(row.customerId)) ?? null : null,
          vendorName: row.vendorId ? nameByUserId.get(String(row.vendorId)) ?? null : null
        }))

        return NextResponse.json({ data: normalizedFallback })
      }

      return NextResponse.json({ error: rawMessage }, { status: 500 })
    }

    const normalizedBase = ((deliveries ?? []) as DeliveryRow[]).map((delivery) => {
      const sortedEvents = [...(delivery.delivery_events ?? [])].sort((a: DeliveryEventRow, b: DeliveryEventRow) => {
        const first = new Date(a.occurred_at ?? a.created_at ?? '').getTime()
        const second = new Date(b.occurred_at ?? b.created_at ?? '').getTime()
        return first - second
      })

      const deliveryAddress =
        formatShippingAddress(delivery.orders?.shipping_address ?? null) ??
        formatShippingAddress(delivery.orders?.billing_address ?? null)

      return {
        id: delivery.id,
        orderId: delivery.order_id,
        orderNumber: delivery.orders?.order_number ?? delivery.orders?.id ?? delivery.order_id,
        customerId: delivery.customer_id,
        vendorId: delivery.orders?.vendor_id ?? delivery.vendor_id,
        status: normalizeEffectiveDeliveryStatus(delivery.status, delivery.delivery_events),
        priority: delivery.priority,
        eta: delivery.eta,
        dispatchedAt: delivery.dispatched_at,
        deliveredAt: delivery.delivered_at,
        cancelledAt: delivery.cancelled_at,
        currentLocation: delivery.current_location,
        trackingNumber: delivery.tracking_number,
        progressPercent: delivery.progress_percent ?? 0,
        coordinates:
          delivery.live_lat !== null && delivery.live_lng !== null
            ? { lat: delivery.live_lat, lng: delivery.live_lng }
            : null,
        destinationCoordinates:
          delivery.orders?.shipping_lat !== null && delivery.orders?.shipping_lat !== undefined &&
          delivery.orders?.shipping_lng !== null && delivery.orders?.shipping_lng !== undefined
            ? { lat: Number(delivery.orders.shipping_lat), lng: Number(delivery.orders.shipping_lng) }
            : null,
        driver: {
          userId: delivery.driver_id,
          name: delivery.driver_name,
          phone: delivery.driver_phone,
          vehiclePlate: delivery.vehicle_plate
        },
        shippingAddress: delivery.orders?.shipping_address ?? null,
        deliveryAddress,
        events: sortedEvents.map((event) => ({
          id: event.id,
          type: event.event_type,
          status: event.status,
          description: event.description,
          location: event.location,
          coordinates:
            event.latitude !== null && event.longitude !== null
              ? { lat: event.latitude, lng: event.longitude }
              : null,
          occurredAt: event.occurred_at ?? event.created_at,
          data: event.data ?? {}
        })),
        metadata: delivery.metadata ?? {},
        createdAt: delivery.created_at,
        updatedAt: delivery.updated_at
      }
    })

    const ids = new Set<string>()
    normalizedBase.forEach((row) => {
      if (row.customerId) ids.add(String(row.customerId))
      if (row.vendorId) ids.add(String(row.vendorId))
    })

    let nameByUserId = new Map<string, string>()
    const idList = Array.from(ids.values()).filter(Boolean)
    if (idList.length > 0) {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id,first_name,last_name')
        .in('user_id', idList)

      if (profiles) {
        nameByUserId = new Map(
          (profiles as UserProfileNameRow[]).map((p) => {
            const name = [p.first_name, p.last_name].filter(Boolean).join(' ').trim()
            return [p.user_id, name]
          })
        )
      }
    }

    const { data: profilesWithAddresses } = await supabase
      .from('user_profiles')
      .select('user_id,first_name,last_name,address,city,country,postal_code,phone')
      .in('user_id', idList)

    const profileByUserId = new Map(((profilesWithAddresses ?? []) as UserProfileNameRow[]).map((p) => [p.user_id, p]))

    let checkoutByCustomerId = new Map<string, Record<string, unknown>>()
    if (idList.length > 0) {
      const { data: prefs } = await supabase
        .from('delivery_preferences')
        .select('customer_id,metadata')
        .in('customer_id', idList)

      if (prefs) {
        checkoutByCustomerId = new Map(
          (prefs as DeliveryPreferenceRow[]).map((row) => {
            const metadata = row?.metadata
            const checkout = metadata && typeof metadata === 'object' ? ((metadata as any)?.checkout ?? null) : null
            return [row.customer_id, checkout && typeof checkout === 'object' ? (checkout as Record<string, unknown>) : {}]
          })
        )
      }
    }

    const normalized = normalizedBase.map((row) => {
      const profile = row.customerId ? profileByUserId.get(String(row.customerId)) ?? null : null
      const checkout = row.customerId ? checkoutByCustomerId.get(String(row.customerId)) ?? null : null
      const checkoutAddressCandidate =
        checkout && typeof checkout === 'object'
          ? ((checkout as any)?.shippingAddress ?? (checkout as any)?.address ?? (checkout as any)?.deliveryAddress ?? null)
          : null
      const deliveryAddress =
        (typeof row.deliveryAddress === 'string' && row.deliveryAddress.trim().length > 0
          ? row.deliveryAddress
          : null) ?? formatShippingAddress(checkoutAddressCandidate) ?? formatProfileAddress(profile)

      return {
        ...row,
        deliveryAddress,
        customerName: row.customerId ? nameByUserId.get(String(row.customerId)) ?? null : null,
        vendorName: row.vendorId ? nameByUserId.get(String(row.vendorId)) ?? null : null
      }
    })

    return NextResponse.json({ data: normalized })
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
          : lower.includes("impossible de vérifier le rôle")
            ? 503
            : 500
    return NextResponse.json({ error: message }, { status })
  }
}
