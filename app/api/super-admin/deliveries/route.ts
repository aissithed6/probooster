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

interface DeliveryCreatePayload {
  orderId: string
  customerId: string
  status: DeliveryStatus
  driverId?: string | null
  priority?: string | null
  eta?: string | null
  dispatchedAt?: string | null
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

function generateTrackingNumber(): string {
  const ts = Date.now().toString(36).toUpperCase()
  const rnd = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `DLV-${ts}-${rnd}`
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
  shipping_method_id: string | null
  carrier_id: string | null
  metadata: JsonRecord | null
  created_at: string
  updated_at: string
  orders: {
    id: string
    order_number?: string | null
    vendor_id: string | null
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
    metadata: JsonRecord | null
  } | null
  carrier: {
    id: string
    name: string
    contact_phone: string | null
    contact_email: string | null
    tracking_url_template: string | null
    supports_gps: boolean | null
    metadata: JsonRecord | null
  } | null
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
  data: JsonRecord | null
}

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

const normalizeDelivery = (delivery: DeliveryRow, events: DeliveryEventRow[] = []) => {
  const sortedEvents = [...events].sort((a, b) => {
    const first = new Date(a.occurred_at ?? a.created_at ?? '').getTime()
    const second = new Date(b.occurred_at ?? b.created_at ?? '').getTime()
    return first - second
  })

  return {
    id: delivery.id,
    orderId: delivery.order_id,
    orderNumber: delivery.orders?.order_number ?? null,
    customerId: delivery.customer_id,
    vendorId: delivery.orders?.vendor_id ?? delivery.vendor_id ?? null,
    status: normalizeEffectiveDeliveryStatus(delivery.status, sortedEvents),
    priority: delivery.priority ?? 'medium',
    eta: delivery.eta,
    deliveryAddress: formatShippingAddress(delivery.orders?.shipping_address ?? null),
    dispatchedAt: delivery.dispatched_at,
    deliveredAt: delivery.delivered_at,
    cancelledAt: delivery.cancelled_at,
    currentLocation: delivery.current_location,
    driver: delivery.driver_name
      ? {
          name: delivery.driver_name,
          phone: delivery.driver_phone,
          vehiclePlate: delivery.vehicle_plate
        }
      : null,
    trackingNumber: delivery.tracking_number,
    progressPercent: delivery.progress_percent ?? 0,
    coordinates:
      delivery.live_lat !== null && delivery.live_lng !== null
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
    metadata: delivery.metadata ?? {},
    createdAt: delivery.created_at,
    updatedAt: delivery.updated_at,
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
      occurredAt: event.occurred_at,
      data: event.data ?? {}
    }))
  }
}

export async function GET(request: NextRequest) {
  try {
    await assertOpsOrSuperAdmin(request)
    const supabase = getSupabaseAdmin()
    const url = new URL(request.url)

    const filters = {
      status: url.searchParams.get('status') ?? undefined,
      vendorId: url.searchParams.get('vendorId') ?? undefined,
      orderId: url.searchParams.get('orderId') ?? undefined,
      customerId: url.searchParams.get('customerId') ?? undefined
    }

    let query = supabase
      .from('deliveries')
      .select(
        `*,
        orders:orders!deliveries_order_id_fkey(id, order_number, vendor_id, customer_id, shipping_address, billing_address, shipping_lat, shipping_lng),
        shipping_methods:shipping_method_id(*),
        carrier:carrier_id(*)
        `
      )
      .order('created_at', { ascending: false })
      .limit(200)

    // IMPORTANT: on ne filtre pas sur deliveries.status côté SQL, car le statut effectif
    // peut être dérivé des delivery_events (ex: pending + driver_accept => confirmed).
    // Le filtrage se fera après normalisation.
    if (filters.vendorId) {
      query = query.eq('vendor_id', filters.vendorId)
    }
    if (filters.orderId) {
      query = query.eq('order_id', filters.orderId)
    }
    if (filters.customerId) {
      query = query.eq('customer_id', filters.customerId)
    }

    const { data, error } = await query

    if (error) {
      console.error('❌ Erreur lors de la récupération des livraisons (super admin):', error)
      const message =
        error.message ?? error.hint ?? error.details ?? 'Erreur lors de la récupération des livraisons.'
      return NextResponse.json({ error: message }, { status: 500 })
    }

    const deliveryIds = (data ?? []).map((delivery: DeliveryRow) => delivery.id)
    let eventsData: DeliveryEventRow[] = []
    if (deliveryIds.length > 0) {
      const { data: fetchedEvents, error: eventsError } = await supabase
        .from('delivery_events')
        .select('*')
        .in('delivery_id', deliveryIds)

      if (eventsError) {
        console.error('⚠️ Impossible de récupérer les évènements de livraison:', eventsError)
        const message =
          eventsError.message ?? eventsError.hint ?? eventsError.details ??
          'Impossible de récupérer les évènements de livraison.'
        return NextResponse.json({ error: message }, { status: 500 })
      }

      eventsData = (fetchedEvents ?? []) as DeliveryEventRow[]
    }

    const eventsByDelivery = new Map<string, DeliveryEventRow[]>()
    eventsData.forEach(event => {
      const list = eventsByDelivery.get(event.delivery_id) ?? []
      list.push(event)
      eventsByDelivery.set(event.delivery_id, list)
    })

    let normalizedBase: Array<ReturnType<typeof normalizeDelivery>> = (data ?? []).map((row: DeliveryRow) =>
      normalizeDelivery(row as DeliveryRow, eventsByDelivery.get(row.id) ?? [])
    )

    if (filters.status) {
      const desired = String(filters.status).trim().toLowerCase()
      normalizedBase = normalizedBase.filter((row) => String(row.status ?? '').trim().toLowerCase() === desired)
    }

    const ids = new Set<string>()
    normalizedBase.forEach((row: ReturnType<typeof normalizeDelivery>) => {
      if (row.customerId) ids.add(String(row.customerId))
      if (row.vendorId) ids.add(String(row.vendorId))
    })

    let nameByUserId = new Map<string, string>()
    const idList = Array.from(ids.values()).filter(Boolean)
    if (idList.length > 0) {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id,first_name,last_name,address,city,country,postal_code,phone')
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

    const profileByUserId = new Map(
      ((profilesWithAddresses ?? []) as UserProfileNameRow[]).map((p) => [p.user_id, p])
    )

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

    const normalized = normalizedBase.map((row: ReturnType<typeof normalizeDelivery>) => {
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
    console.error('❌ Erreur inattendue GET /api/super-admin/deliveries:', error)
    const { status, message } = resolveSuperAdminDeliveryError(error)
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(request: NextRequest) {
  try {
    const superAdminId = await assertOpsOrSuperAdmin(request)
    const supabase = getSupabaseAdmin()
    const payload = (await request.json()) as DeliveryCreatePayload

    if (!payload?.orderId || !payload?.customerId || !payload?.status) {
      return NextResponse.json(
        { error: 'Champs requis manquants (orderId, customerId, status).' },
        { status: 400 }
      )
    }

    // Validation coords de livraison: la livraison ne peut pas être planifiée si la commande n'a pas de destination.
    // (Les coords sont obligatoires pour les produits physiques, et elles alimentent le tracking.)
    const { data: orderRow, error: orderError } = await supabase
      .from('orders')
      .select('id, order_number, vendor_id, customer_id, shipping_lat, shipping_lng')
      .eq('id', payload.orderId)
      .single()

    if (orderError || !orderRow) {
      const message = orderError?.message ?? 'Commande introuvable.'
      return NextResponse.json({ error: message }, { status: 404 })
    }

    const orderCustomerId = (orderRow as any)?.customer_id as string | null | undefined
    if (!orderCustomerId) {
      return NextResponse.json({ error: 'Client introuvable sur la commande (customer_id manquant).' }, { status: 400 })
    }

    const hasCoords = (orderRow as any).shipping_lat !== null && (orderRow as any).shipping_lng !== null
    if (!hasCoords) {
      return NextResponse.json(
        {
          error:
            'Coordonnées GPS manquantes sur la commande: renseignez shipping_lat/shipping_lng avant de créer la livraison.'
        },
        { status: 400 }
      )
    }

    const insertInput: JsonRecord = {
      order_id: payload.orderId,
      customer_id: orderCustomerId,
      vendor_id: (orderRow as any)?.vendor_id ?? null,
      status: payload.status,
      priority: payload.priority ?? 'medium',
      eta: payload.eta ?? null,
      dispatched_at: payload.dispatchedAt ?? null,
      driver_id: payload.driverId ?? null,
      driver_name: payload.driver?.name ?? null,
      driver_phone: payload.driver?.phone ?? null,
      vehicle_plate: payload.driver?.vehiclePlate ?? null,
      tracking_number: payload.trackingNumber && String(payload.trackingNumber).trim().length > 0 ? payload.trackingNumber : generateTrackingNumber(),
      shipping_method_id: payload.shippingMethodId ?? null,
      carrier_id: payload.carrierId ?? null,
      metadata: payload.metadata ?? {},
      created_by: superAdminId,
      updated_by: superAdminId
    }

    const { data, error } = await supabase
      .from('deliveries')
      .insert(insertInput)
      .select(
        `*,
        orders:orders!deliveries_order_id_fkey(id, vendor_id, shipping_lat, shipping_lng),
        shipping_methods:shipping_method_id(*),
        carrier:carrier_id(*)
        `
      )
      .single()

    if (error || !data) {
      console.error('❌ Erreur lors de la création d’une livraison (super admin):', error)
      const message =
        error?.message ?? error?.hint ?? error?.details ?? "Impossible de créer la livraison."
      return NextResponse.json({ error: message }, { status: 500 })
    }

    // Initialise le chat livraison (conversation + participants) dès la planification.
    try {
      const deliveryId = (data as any)?.id as string | undefined
      const customerId = (data as any)?.customer_id as string | null | undefined
      const vendorId = (data as any)?.vendor_id as string | null | undefined
      const driverId = (data as any)?.driver_id as string | null | undefined

      if (deliveryId) {
        // Event système: création
        await supabase.from('delivery_events').insert({
          delivery_id: deliveryId,
          event_type: 'created',
          status: payload.status,
          description: 'Livraison planifiée par le back-office.',
          occurred_at: new Date().toISOString(),
          data: { actor: 'super_admin', created_by: superAdminId }
        })
      }

      const { data: existingConversation } = await supabase
        .from('delivery_chat_conversations')
        .select('id')
        .eq('order_id', payload.orderId)
        .maybeSingle()

      let conversationId = existingConversation?.id as string | undefined
      if (!conversationId) {
        const { data: createdConversation } = await supabase
          .from('delivery_chat_conversations')
          .insert({ order_id: payload.orderId })
          .select('id')
          .single()
        conversationId = createdConversation?.id
      }

      if (conversationId) {
        const participants: Array<{ conversation_id: string; user_id: string; role_in_conversation: 'client' | 'vendor' | 'driver' | 'super_admin' }> = []
        if (customerId) participants.push({ conversation_id: conversationId, user_id: customerId, role_in_conversation: 'client' })
        if (vendorId) participants.push({ conversation_id: conversationId, user_id: vendorId, role_in_conversation: 'vendor' })
        if (driverId) participants.push({ conversation_id: conversationId, user_id: driverId, role_in_conversation: 'driver' })
        participants.push({ conversation_id: conversationId, user_id: superAdminId, role_in_conversation: 'super_admin' })

        await supabase
          .from('delivery_chat_participants')
          .upsert(participants, { onConflict: 'conversation_id,user_id' })
      }
    } catch (chatInitError) {
      console.warn('⚠️ Chat livraison non initialisé (planification):', chatInitError)
    }

    return NextResponse.json({ data: normalizeDelivery(data as DeliveryRow) }, { status: 201 })
  } catch (error) {
    console.error('❌ Erreur inattendue POST /api/super-admin/deliveries:', error)
    const { status, message } = resolveSuperAdminDeliveryError(error)
    return NextResponse.json({ error: message }, { status })
  }
}

/**
 * Détermine le statut HTTP approprié pour les erreurs super admin.
 */
function resolveSuperAdminDeliveryError(error: unknown): { status: number; message: string } {
  if (error instanceof Error) {
    const lower = error.message.toLowerCase()

    if (
      lower.includes('token supabase manquant') ||
      lower.includes('utilisateur introuvable') ||
      lower.includes('token invalide')
    ) {
      return { status: 401, message: 'Authentification requise.' }
    }

    if (lower.includes('accès réservé au super administrateur')) {
      return { status: 403, message: 'Accès réservé au super administrateur.' }
    }

    if (lower.includes("impossible de vérifier le rôle de l'utilisateur")) {
      return { status: 503, message: 'Service temporairement indisponible.' }
    }
  }

  return { status: 500, message: 'Erreur inattendue.' }
}
