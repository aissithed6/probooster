import { getClientAccessToken, supabase } from '@/lib/supabase'

export type SuperAdminDeliveryStatus =
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

export interface SuperAdminDeliveryDriver {
  name: string | null
  phone: string | null
  vehiclePlate: string | null
}

export interface SuperAdminDeliveryEvent {
  id: string
  type: string | null
  status: string | null
  description: string | null
  location: string | null
  coordinates: { lat?: number; lng?: number; latitude?: number; longitude?: number } | null
  occurredAt: string | null
  data: Record<string, unknown>
}

export interface SuperAdminDeliveryShippingMethod {
  id: string
  name: string
  description: string | null
  basePrice: number | null
  currency: string | null
  estimatedMinMinutes: number | null
  estimatedMaxMinutes: number | null
  serviceLevel: string | null
  metadata: Record<string, unknown>
}

export interface SuperAdminDeliveryCarrier {
  id: string
  name: string
  contactPhone: string | null
  contactEmail: string | null
  trackingUrlTemplate: string | null
  supportsGps: boolean
  metadata: Record<string, unknown>
}

export interface SuperAdminDeliveryRecord {
  id: string
  orderId: string
  orderNumber: string | null
  customerId: string | null
  customerName?: string | null
  vendorId: string | null
  vendorName?: string | null
  status: SuperAdminDeliveryStatus
  priority: string
  eta: string | null
  deliveryAddress?: string | null
  dispatchedAt: string | null
  deliveredAt: string | null
  cancelledAt: string | null
  currentLocation: string | null
  driver: SuperAdminDeliveryDriver | null
  trackingNumber: string | null
  progressPercent: number
  /** Coordonnées du livreur. Accepte { lat, lng } ou { latitude, longitude }. */
  coordinates: { lat?: number; lng?: number; latitude?: number; longitude?: number } | null
  /** Coordonnées de la destination. Optionnel. */
  destinationCoordinates?: { lat?: number; lng?: number; latitude?: number; longitude?: number } | null
  shippingMethod: SuperAdminDeliveryShippingMethod | null
  carrier: SuperAdminDeliveryCarrier | null
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
  events: SuperAdminDeliveryEvent[]
}

/**
 * Normalise les coordonnées brutes issues de la base vers { lat, lng }.
 * Accepte les formats { lat, lng }, { latitude, longitude }, { coordinates: [lng, lat] } (GeoJSON)
 * ou { location: { lat, lng } }. Retourne null si aucune coordonnée valide n'est trouvée.
 */
export function normalizeCoordinates(raw: unknown): { lat: number; lng: number } | null {
  if (!raw || typeof raw !== 'object') return null

  const obj = raw as Record<string, unknown>

  // Format imbriqué : { coordinates: [lng, lat] } ou { location: { lat, lng } }
  if (Array.isArray(obj.coordinates)) {
    const [lng, lat] = obj.coordinates as unknown[]
    if (typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng }
    }
  }
  if (obj.location && typeof obj.location === 'object') {
    const loc = obj.location as Record<string, unknown>
    const lat = typeof loc.lat === 'number' ? loc.lat : typeof loc.latitude === 'number' ? loc.latitude : undefined
    const lng = typeof loc.lng === 'number' ? loc.lng : typeof loc.longitude === 'number' ? loc.longitude : undefined
    if (lat !== undefined && lng !== undefined && Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng }
    }
  }

  // Format plat : { lat, lng } ou { latitude, longitude }
  const lat = typeof obj.lat === 'number' ? obj.lat : typeof obj.latitude === 'number' ? obj.latitude : undefined
  const lng = typeof obj.lng === 'number' ? obj.lng : typeof obj.longitude === 'number' ? obj.longitude : undefined
  if (lat !== undefined && lng !== undefined && Number.isFinite(lat) && Number.isFinite(lng)) {
    return { lat, lng }
  }

  return null
}

export interface SuperAdminDeliveryListResponse {
  data: SuperAdminDeliveryRecord[]
}

export interface SuperAdminDeliveryFilters {
  status?: string
  vendorId?: string
  orderId?: string
  customerId?: string
}

export interface SuperAdminDeliveryCreatePayload {
  orderId: string
  customerId: string
  vendorId?: string | null
  status: SuperAdminDeliveryStatus
  driverId?: string | null
  priority?: string | null
  eta?: string | null
  dispatchedAt?: string | null
  deliveredAt?: string | null
  cancelledAt?: string | null
  currentLocation?: string | null
  progressPercent?: number | null
  liveLat?: number | null
  liveLng?: number | null
  driver?: {
    name?: string | null
    phone?: string | null
    vehiclePlate?: string | null
  }
  trackingNumber?: string | null
  shippingMethodId?: string | null
  carrierId?: string | null
  metadata?: Record<string, unknown> | null
}

const BASE_HEADERS = {
  'Content-Type': 'application/json'
} as const

/**
 * Construit les en-têtes HTTP requis pour les appels super admin, incluant le token si disponible.
 */
async function buildAuthHeaders(): Promise<HeadersInit> {
  let accessToken: string | null = null

  if (typeof window !== 'undefined') {
    accessToken = getClientAccessToken()
    if (!accessToken) {
      try {
        const { data } = await supabase.auth.getSession()
        accessToken = data.session?.access_token ?? null
      } catch {
        accessToken = null
      }
    }
  } else {
    try {
      const { headers: serverHeaders, cookies: serverCookies } = await import('next/headers')
      const headerStore = await serverHeaders()
      const cookieStore = await serverCookies()

      const bearerHeader = headerStore.get('authorization')
      if (bearerHeader?.startsWith('Bearer ')) {
        accessToken = bearerHeader.slice(7).trim()
      }

      if (!accessToken) {
        accessToken = cookieStore.get('sb-access-token')?.value ?? null

        if (!accessToken) {
          const supabaseAuthCookie = cookieStore.get('supabase-auth-token')?.value
          if (supabaseAuthCookie) {
            try {
              const parsed = JSON.parse(supabaseAuthCookie)
              accessToken = Array.isArray(parsed)
                ? parsed[0]?.access_token ?? null
                : parsed?.currentSession?.access_token ?? parsed?.access_token ?? null
            } catch {
              accessToken = null
            }
          }
        }
      }
    } catch {
      accessToken = null
    }
  }

  return accessToken
    ? { ...BASE_HEADERS, Authorization: `Bearer ${accessToken}` }
    : BASE_HEADERS
}

export class SuperAdminDeliveryService {
  static async list(filters: SuperAdminDeliveryFilters = {}): Promise<SuperAdminDeliveryRecord[]> {
    const params = new URLSearchParams()

    if (filters.status) params.set('status', filters.status)
    if (filters.vendorId) params.set('vendorId', filters.vendorId)
    if (filters.orderId) params.set('orderId', filters.orderId)
    if (filters.customerId) params.set('customerId', filters.customerId)

    const queryString = params.toString()
    const url = `/api/super-admin/deliveries${queryString ? `?${queryString}` : ''}`
    const headers = await buildAuthHeaders()
    const response = await fetch(url, {
      method: 'GET',
      headers,
      credentials: 'include',
      cache: 'no-store'
    })

    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      throw new Error(body?.error ?? 'Impossible de récupérer les livraisons.')
    }

    const payload = (await response.json()) as SuperAdminDeliveryListResponse
    return payload.data ?? []
  }

  static async create(payload: SuperAdminDeliveryCreatePayload): Promise<SuperAdminDeliveryRecord> {
    const headers = await buildAuthHeaders()
    const response = await fetch('/api/super-admin/deliveries', {
      method: 'POST',
      headers,
      credentials: 'include',
      cache: 'no-store',
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      throw new Error(body?.error ?? 'Impossible de créer la livraison.')
    }

    const data = (await response.json()) as { data: SuperAdminDeliveryRecord }
    return data.data
  }

  /**
   * Met à jour une livraison existante.
   */
  static async update(id: string, patch: Partial<SuperAdminDeliveryCreatePayload>): Promise<SuperAdminDeliveryRecord> {
    if (!id) {
      throw new Error('Identifiant livraison requis.')
    }

    const headers = await buildAuthHeaders()
    const response = await fetch(`/api/super-admin/deliveries/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers,
      credentials: 'include',
      cache: 'no-store',
      body: JSON.stringify(patch)
    })

    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      throw new Error(body?.error ?? 'Impossible de modifier la livraison.')
    }

    const data = (await response.json()) as { data: SuperAdminDeliveryRecord }
    return data.data
  }

  /**
   * Supprime une livraison existante.
   */
  static async remove(id: string): Promise<boolean> {
    if (!id) {
      throw new Error('Identifiant livraison requis.')
    }

    const headers = await buildAuthHeaders()
    const response = await fetch(`/api/super-admin/deliveries/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers,
      credentials: 'include',
      cache: 'no-store'
    })

    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      throw new Error(body?.error ?? 'Impossible de supprimer la livraison.')
    }

    return true
  }
}
