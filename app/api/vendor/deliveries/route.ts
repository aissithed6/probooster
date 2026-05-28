'use server'

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertVendor } from '@/app/api/vendor/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

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

/**
 * Déduit un statut "effectif" de livraison à partir de :
 * - champs horodatés (delivered_at / cancelled_at / dispatched_at),
 * - dernier événement de tracking (delivery_events),
 * - et en fallback le champ deliveries.status.
 *
 * Objectif : éviter les désynchronisations si certains writers mettent à jour les events
 * sans propager systématiquement le champ status.
 */
function normalizeEffectiveDeliveryStatus(params: {
  status: string | null | undefined
  dispatchedAt?: string | null
  deliveredAt?: string | null
  cancelledAt?: string | null
  events: DeliveryEventRow[] | null | undefined
}): string {
  const raw = String(params.status ?? '').trim().toLowerCase()
  const dispatchedAt = params.dispatchedAt
  const deliveredAt = params.deliveredAt
  const cancelledAt = params.cancelledAt

  // 1) Champs horodatés (source très fiable)
  if (cancelledAt) return 'cancelled'
  if (deliveredAt) return 'delivered'

  const events = Array.isArray(params.events) ? params.events : []
  const sortedEvents = [...events].sort((a, b) => {
    const first = new Date(a.occurred_at ?? a.created_at ?? '').getTime()
    const second = new Date(b.occurred_at ?? b.created_at ?? '').getTime()
    return first - second
  })

  const lastEvent = sortedEvents.length > 0 ? sortedEvents[sortedEvents.length - 1] : null
  const lastType = String(lastEvent?.event_type ?? '').trim().toLowerCase()
  const lastStatus = String(lastEvent?.status ?? '').trim().toLowerCase()

  // 2) Certains systèmes poussent le statut dans event.status
  const statusCandidate = lastStatus.length > 0 ? lastStatus : raw

  // 3) Mapping robuste basé sur type d'événement
  const typeBased: string | null = (() => {
    if (!lastType) return null

    // Livraison finalisée / annulée
    if (['delivered', 'delivery_delivered', 'dropoff_completed', 'completed'].includes(lastType)) return 'delivered'
    if (['cancelled', 'canceled', 'delivery_cancelled', 'delivery_canceled', 'cancel'].includes(lastType)) return 'cancelled'
    if (['failed', 'delivery_failed', 'dropoff_failed'].includes(lastType)) return 'failed'

    // En transit / dernière étape
    if (['in_transit', 'picked_up', 'pickup_completed', 'driver_pickup'].includes(lastType)) return 'in_transit'
    if (['out_for_delivery', 'driver_en_route', 'en_route_to_dropoff'].includes(lastType)) return 'out_for_delivery'

    // Préparation
    if (['preparing', 'packing', 'preparation_started'].includes(lastType)) return 'preparing'
    if (['ready_for_pickup', 'ready', 'package_ready'].includes(lastType)) return 'ready_for_pickup'

    // Confirmation
    if (['confirmed', 'driver_accept', 'driver_accepted', 'assigned', 'driver_assigned'].includes(lastType)) return 'confirmed'

    // Retard
    if (['delayed', 'late', 'delay_reported'].includes(lastType)) return 'delayed'

    return null
  })()

  // 4) Heuristiques complémentaires
  if (!typeBased && dispatchedAt && (raw === 'pending' || raw === 'confirmed' || raw.length === 0)) {
    return 'in_transit'
  }

  // 5) Priorité: typeBased > statusCandidate > default
  if (typeBased) return typeBased

  if (statusCandidate === 'canceled') return 'cancelled'
  if (statusCandidate.length > 0) return statusCandidate
  return 'pending'
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
  delivery_id: string
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

/**
 * Détermine le statut HTTP approprié et le message à retourner après une erreur d’authentification ou d’accès vendeur.
 */
function resolveVendorDeliveryError(error: unknown): { status: number; message: string } {
  if (error instanceof Error) {
    const lower = error.message.toLowerCase()

    if (
      lower.includes('token supabase manquant') ||
      lower.includes('utilisateur introuvable') ||
      lower.includes('token invalide') ||
      lower.includes('authentification requise')
    ) {
      return { status: 401, message: 'Authentification requise.' }
    }

    if (lower.includes('accès réservé aux vendeurs authentifiés')) {
      return { status: 403, message: 'Accès réservé aux vendeurs.' }
    }

    if (lower.includes("impossible de vérifier le rôle de l'utilisateur")) {
      return { status: 503, message: 'Service temporairement indisponible.' }
    }
  }

  return { status: 500, message: 'Erreur inattendue.' }
}

interface DeliveryRow {
  id: string
  order_id: string
  customer_id: string | null
  vendor_id: string | null
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
  orders: {
    id: string
    order_number?: string | null
    customer_id: string | null
    shipping_address?: any | null
    billing_address?: any | null
    shipping_lat?: number | null
    shipping_lng?: number | null
  } | null
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
}

/**
 * GET /api/vendor/deliveries — Récupère les livraisons liées au vendeur authentifié
 * avec les événements, transporteur, méthode d'expédition et informations d'ordre associées.
 */
export async function GET(request: NextRequest) {
  try {
    const vendorId = await assertVendor(request)
    const supabase = getSupabaseAdmin()

    const baseSelect = `*,
        orders:orders!deliveries_order_id_fkey(id, order_number, customer_id, shipping_address, billing_address, shipping_lat, shipping_lng),
        shipping_methods:shipping_method_id(*),
        carrier:carrier_id(*),
        delivery_events(*)
        `

    // Compatibilité: selon les schémas, vendor_id peut être stocké soit sur deliveries.vendor_id,
    // soit uniquement sur orders.vendor_id. PostgREST ne supporte pas le .or() sur un champ embarqué
    // dans ce contexte, donc on fait 2 requêtes puis on fusionne.
    const { data: deliveryRowsByDeliveryVendor, error: errorByDeliveryVendor } = await supabase
      .from('deliveries')
      .select(baseSelect)
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false })
      .limit(200)

    if (errorByDeliveryVendor) {
      console.error('❌ Erreur lors de la récupération des livraisons vendeur (deliveries.vendor_id):', errorByDeliveryVendor)
      return NextResponse.json({ error: 'Erreur lors de la récupération des livraisons.' }, { status: 500 })
    }

    // Variante: vendor_id uniquement sur orders. On force un join INNER sur orders pour pouvoir filtrer.
    const { data: deliveryRowsByOrderVendor, error: errorByOrderVendor } = await supabase
      .from('deliveries')
      .select(
        `*,
        orders:orders!deliveries_order_id_fkey!inner(id, order_number, customer_id, shipping_address, billing_address, shipping_lat, shipping_lng, vendor_id),
        shipping_methods:shipping_method_id(*),
        carrier:carrier_id(*),
        delivery_events(*)
        `
      )
      .eq('orders.vendor_id', vendorId)
      .order('created_at', { ascending: false })
      .limit(200)

    if (errorByOrderVendor) {
      console.error('❌ Erreur lors de la récupération des livraisons vendeur (orders.vendor_id):', errorByOrderVendor)
      return NextResponse.json({ error: 'Erreur lors de la récupération des livraisons.' }, { status: 500 })
    }

    const combinedRows = [...(deliveryRowsByDeliveryVendor ?? []), ...(deliveryRowsByOrderVendor ?? [])] as DeliveryRow[]
    const dedupedRows = Array.from(new Map(combinedRows.map((row) => [row.id, row])).values())

    const typedRows = (dedupedRows ?? []) as DeliveryRow[]
    const normalizedBase = typedRows.map((row) => normalizeVendorDelivery(row))

    const ids = new Set<string>()
    normalizedBase.forEach((row) => {
      if (row.customerId) ids.add(String(row.customerId))
    })

    let nameByUserId = new Map<string, string>()
    const idList = Array.from(ids.values()).filter(Boolean)
    let profilesForAddresses: UserProfileNameRow[] = []
    if (idList.length > 0) {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id,first_name,last_name,address,city,country,postal_code,phone')
        .in('user_id', idList)

      if (profiles) {
        profilesForAddresses = profiles as UserProfileNameRow[]
        nameByUserId = new Map(
          (profiles as UserProfileNameRow[]).map((p) => {
            const name = [p.first_name, p.last_name].filter(Boolean).join(' ').trim()
            return [p.user_id, name]
          })
        )
      }
    }

    const profileByUserId = new Map(profilesForAddresses.map((p) => [p.user_id, p]))

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
        customerName: row.customerId ? nameByUserId.get(String(row.customerId)) ?? null : null,
        deliveryAddress
      }
    })

    const deliveries = normalized.map((record: ReturnType<typeof normalizeVendorDelivery>) => {
      const delivery = record
      if (delivery.metadata && 'crxlauncher' in delivery.metadata) {
        const { crxlauncher, ...rest } = delivery.metadata as Record<string, unknown>
        delivery.metadata = rest
      }
      return delivery
    })

    return NextResponse.json({ data: deliveries })
  } catch (error) {
    console.error('❌ Erreur inattendue GET /api/vendor/deliveries:', error)
    const { status, message } = resolveVendorDeliveryError(error)
    return NextResponse.json({ error: message }, { status })
  }
}

/**
 * Normalise une ligne de livraison brute en structure exploitable par l'UI vendeur.
 */
function normalizeVendorDelivery(row: DeliveryRow) {
  const events = Array.isArray((row as unknown as { delivery_events?: DeliveryEventRow[] }).delivery_events)
    ? ((row as unknown as { delivery_events?: DeliveryEventRow[] }).delivery_events ?? [])
    : []

  const sortedEvents = [...events].sort((a, b) => {
    const first = new Date(a.occurred_at ?? a.created_at ?? '').getTime()
    const second = new Date(b.occurred_at ?? b.created_at ?? '').getTime()
    return first - second
  })

  /**
   * Déduit une progression par défaut si la base ne fournit pas `progress_percent`.
   */
  const deriveProgressPercentFromStatus = (status: string): number => {
    const s = String(status ?? '').trim().toLowerCase()
    if (s === 'delivered') return 100
    if (s === 'cancelled' || s === 'failed') return 0
    if (s === 'out_for_delivery') return 85
    if (s === 'in_transit') return 65
    if (s === 'ready_for_pickup') return 45
    if (s === 'preparing') return 25
    if (s === 'confirmed') return 15
    return 0
  }

  const effectiveStatus = normalizeEffectiveDeliveryStatus({
    status: row.status,
    dispatchedAt: row.dispatched_at,
    deliveredAt: row.delivered_at,
    cancelledAt: row.cancelled_at,
    events
  })

  const rawProgress = row.progress_percent
  const progressPercent = Number.isFinite(rawProgress)
    ? Math.max(0, Math.min(100, Number(rawProgress)))
    : deriveProgressPercentFromStatus(effectiveStatus)

  return {
    id: row.id,
    orderId: row.order_id,
    orderNumber: row.orders?.order_number ?? row.orders?.id ?? row.order_id,
    customerId: row.orders?.customer_id ?? row.customer_id,
    deliveryAddress: formatShippingAddress(row.orders?.shipping_address ?? null),
    status: effectiveStatus,
    priority: row.priority ?? 'medium',
    eta: row.eta,
    dispatchedAt: row.dispatched_at,
    deliveredAt: row.delivered_at,
    cancelledAt: row.cancelled_at,
    currentLocation: row.current_location,
    driver: row.driver_name
      ? {
          name: row.driver_name,
          phone: row.driver_phone,
          vehiclePlate: row.vehicle_plate
        }
      : null,
    trackingNumber: row.tracking_number,
    progressPercent,
    coordinates:
      row.live_lat !== null && row.live_lng !== null
        ? { lat: Number(row.live_lat), lng: Number(row.live_lng) }
        : null,
    destinationCoordinates:
      row.orders?.shipping_lat !== null && row.orders?.shipping_lat !== undefined &&
      row.orders?.shipping_lng !== null && row.orders?.shipping_lng !== undefined
        ? { lat: Number(row.orders.shipping_lat), lng: Number(row.orders.shipping_lng) }
        : null,
    shippingMethod: row.shipping_methods
      ? {
          id: row.shipping_methods.id,
          name: row.shipping_methods.name,
          description: row.shipping_methods.description,
          basePrice: row.shipping_methods.base_price,
          currency: row.shipping_methods.currency,
          estimatedMinMinutes: row.shipping_methods.estimated_min_minutes,
          estimatedMaxMinutes: row.shipping_methods.estimated_max_minutes,
          serviceLevel: row.shipping_methods.service_level,
          metadata: row.shipping_methods.metadata ?? {}
        }
      : null,
    carrier: row.carrier
      ? {
          id: row.carrier.id,
          name: row.carrier.name,
          contactPhone: row.carrier.contact_phone,
          contactEmail: row.carrier.contact_email,
          trackingUrlTemplate: row.carrier.tracking_url_template,
          supportsGps: Boolean(row.carrier.supports_gps),
          metadata: row.carrier.metadata ?? {}
        }
      : null,
    events: sortedEvents.map(event => ({
      id: event.id,
      type: event.event_type,
      status: event.status,
      description: event.description,
      location: event.location,
      coordinates:
        event.latitude !== null && event.longitude !== null
          ? { lat: Number(event.latitude), lng: Number(event.longitude) }
          : null,
      occurredAt: event.occurred_at ?? event.created_at ?? null,
      data: event.data ?? {}
    })),
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}
