import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertCustomer, isClientAuthError } from '@/app/api/client/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

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

type DeliveryRelationRow = {
  id: string
  order_id: string
  customer_id: string | null
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
  shipping_methods: {
    id: string
    name: string
    description: string | null
    base_price: number | null
    currency: string | null
    estimated_min_minutes: number | null
    estimated_max_minutes: number | null
    service_level: string | null
    metadata: Record<string, unknown> | null
  } | null
  carrier: {
    id: string
    name: string
    contact_phone: string | null
    contact_email: string | null
    tracking_url_template: string | null
    supports_gps: boolean | null
    metadata: Record<string, unknown> | null
  } | null
  orders: {
    id: string
    order_number?: string | null
    shipping_address?: any | null
    billing_address?: any | null
    shipping_lat?: number | null
    shipping_lng?: number | null
    payment_method?: string | null
    payment_status?: string | null
    vendor_id?: string | null
  } | null
    vendor_profile: {
    first_name?: string | null
    last_name?: string | null
    metadata?: Record<string, unknown> | null
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

type UserProfileAddressRow = {
  user_id: string
  address: string | null
  city: string | null
  country: string | null
  postal_code: string | null
  phone: string | null
}

type DeliveryPreferenceRow = {
  customer_id: string
  metadata: Record<string, unknown> | null
}

function formatProfileAddress(profile?: UserProfileAddressRow | null): string | null {
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
 * Retourne les livraisons du client connecté avec données enrichies (méthode, transporteur, événements).
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await assertCustomer(request)
    const supabase = getSupabaseAdmin()

    const { data: deliveries, error } = await supabase
      .from('deliveries')
      .select(
        `
          *,
          shipping_methods:shipping_method_id (*),
          carrier:carrier_id (*),
          delivery_events (*),
          orders:orders!deliveries_order_id_fkey (id, order_number, shipping_address, billing_address, shipping_lat, shipping_lng, payment_method, payment_status, vendor_id),
          vendor_profile:user_id!left (first_name, last_name, metadata)
        `
      )
      .eq('customer_id', userId)
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) {
      console.error('❌ Erreur lors de la récupération des livraisons client:', error)
      return NextResponse.json({ error: 'Erreur lors de la récupération des livraisons.' }, { status: 500 })
    }

    const customerIds = Array.from(
      new Set(((deliveries ?? []) as DeliveryRelationRow[]).map((d) => d.customer_id).filter((v): v is string => typeof v === 'string' && v.length > 0))
    )

    let profileByUserId = new Map<string, UserProfileAddressRow>()
    if (customerIds.length > 0) {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id,address,city,country,postal_code,phone')
        .in('user_id', customerIds)

      if (profiles) {
        profileByUserId = new Map((profiles as UserProfileAddressRow[]).map((p) => [p.user_id, p]))
      }
    }

    let checkoutByCustomerId = new Map<string, Record<string, unknown>>()
    if (customerIds.length > 0) {
      const { data: prefs } = await supabase
        .from('delivery_preferences')
        .select('customer_id,metadata')
        .in('customer_id', customerIds)

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

    const normalized = ((deliveries ?? []) as DeliveryRelationRow[]).map(delivery => {
      const sortedEvents = [...(delivery.delivery_events ?? [])].sort((a: DeliveryEventRow, b: DeliveryEventRow) => {
        const first = new Date(a.occurred_at ?? a.created_at ?? '').getTime()
        const second = new Date(b.occurred_at ?? b.created_at ?? '').getTime()
        return first - second
      })

      const profile = delivery.customer_id ? profileByUserId.get(delivery.customer_id) ?? null : null
      const checkout = delivery.customer_id ? checkoutByCustomerId.get(delivery.customer_id) ?? null : null

      const checkoutAddressCandidate =
        checkout && typeof checkout === 'object'
          ? ((checkout as any)?.shippingAddress ?? (checkout as any)?.address ?? (checkout as any)?.deliveryAddress ?? null)
          : null

      const deliveryAddress =
        formatShippingAddress(delivery.orders?.shipping_address ?? null) ??
        formatShippingAddress(delivery.orders?.billing_address ?? null) ??
        formatShippingAddress(checkoutAddressCandidate) ??
        formatProfileAddress(profile)

      return {
        id: delivery.id,
        orderId: delivery.order_id,
        orderNumber: delivery.orders?.order_number ?? delivery.orders?.id ?? delivery.order_id,
        status: normalizeEffectiveDeliveryStatus(delivery.status, delivery.delivery_events),
        priority: delivery.priority,
        eta: delivery.eta,
                 deliveryAddress,
        dispatchedAt: delivery.dispatched_at,
        deliveredAt: delivery.delivered_at,
        cancelledAt: delivery.cancelled_at,
        currentLocation: delivery.current_location,
        paymentMethod: delivery.orders?.payment_method ?? null,
        paymentStatus: delivery.orders?.payment_status ?? null,
                vendor: delivery.vendor_profile
          ? (() => {
              const prefs = (delivery.vendor_profile.metadata as any)?.preferences ?? {}
              const name = prefs?.business_name ?? prefs?.store_name ?? prefs?.company ?? null
              const fallback = [delivery.vendor_profile.first_name, delivery.vendor_profile.last_name]
                .filter((p): p is string => typeof p === 'string' && p.trim().length > 0)
                .join(' ')
              return {
                id: delivery.orders?.vendor_id ?? null,
                name: typeof name === 'string' && name.trim().length > 0 ? name.trim() : (fallback || null)
              }
            })()
          : null,
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
        destinationCoordinates:
          delivery.orders?.shipping_lat !== null && delivery.orders?.shipping_lat !== undefined &&
          delivery.orders?.shipping_lng !== null && delivery.orders?.shipping_lng !== undefined
            ? { lat: Number(delivery.orders.shipping_lat), lng: Number(delivery.orders.shipping_lng) }
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
              metadata: delivery.shipping_methods.metadata ?? {}
            }
          : null,
        carrier: delivery.carrier
          ? {
              id: delivery.carrier.id,
              name: delivery.carrier.name,
              contactPhone: delivery.carrier.contact_phone,
              contactEmail: delivery.carrier.contact_email,
              trackingUrlTemplate: delivery.carrier.tracking_url_template,
              supportsGps: Boolean(delivery.carrier.supports_gps),
              metadata: delivery.carrier.metadata ?? {}
            }
          : null,
        events: sortedEvents.map(event => ({
          id: event.id,
          type: event.event_type,
          status: event.status,
          description: event.description,
          location: event.location,
          coordinates: event.latitude !== null && event.longitude !== null
            ? { lat: Number(event.latitude), lng: Number(event.longitude) }
            : null,
          occurredAt: event.occurred_at,
          data: event.data ?? {}
        })),
        metadata: delivery.metadata ?? {},
        createdAt: delivery.created_at,
        updatedAt: delivery.updated_at
      }
    })

    return NextResponse.json({ data: normalized })
  } catch (err) {
    if (isClientAuthError(err)) {
      const referer = request.headers.get('referer') ?? ''
      const refererPath = (() => {
        if (!referer) return ''
        try {
          return new URL(referer).pathname
        } catch {
          return ''
        }
      })()

      if (
        refererPath.startsWith('/auth') ||
        refererPath.startsWith('/seller-dashboard') ||
        refererPath.startsWith('/super-admin-dashboard')
      ) {
        return NextResponse.json({ data: [] }, { status: 200 })
      }

      const authHeader = request.headers.get('authorization') ?? request.headers.get('Authorization')
      const hasAuthHeader = typeof authHeader === 'string' && authHeader.trim().length > 0
      const hasBearerPrefix = hasAuthHeader && authHeader.trim().toLowerCase().startsWith('bearer ')

      const cookieNames = (() => {
        try {
          return request.cookies.getAll().map((c) => c.name)
        } catch {
          return [] as string[]
        }
      })()

      const hasLegacyCookie = cookieNames.includes('supabase-auth-token')
      const hasDirectAccessTokenCookie = cookieNames.includes('sb-access-token')
      const hasSbAccessTokenCookie = cookieNames.some((name) => /^sb-.*-access-token$/i.test(name))
      const hasSbAuthTokenCookie = cookieNames.some((name) => /^sb-.*-auth-token$/i.test(name))

      console.warn('[ClientDeliveries] 401 auth error', {
        hasAuthHeader,
        hasBearerPrefix,
        cookieCount: cookieNames.length,
        hasLegacyCookie,
        hasDirectAccessTokenCookie,
        hasSbAccessTokenCookie,
        hasSbAuthTokenCookie,
        referer: referer || null,
        origin: request.headers.get('origin') ?? null
      })

      const isProd = (process.env.NODE_ENV ?? 'development').toLowerCase() === 'production'
      return NextResponse.json(
        {
          error: 'Authentification requise.',
          ...(isProd
            ? null
            : {
                diagnostics: {
                  hasAuthHeader,
                  hasBearerPrefix,
                  cookieCount: cookieNames.length,
                  hasLegacyCookie,
                  hasDirectAccessTokenCookie,
                  hasSbAccessTokenCookie,
                  hasSbAuthTokenCookie
                }
              })
        },
        { status: 401 }
      )
    }

    console.error('❌ Erreur inattendue lors de la récupération des livraisons client:', err)
    return NextResponse.json({ error: 'Erreur inattendue.' }, { status: 500 })
  }
}
