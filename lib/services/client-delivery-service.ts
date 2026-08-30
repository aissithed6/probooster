import { ClientAuthService } from '@/lib/services/client-auth-service'

export interface ClientDeliveryDriver {
  name: string | null
  phone: string | null
  vehiclePlate: string | null
}

/**
 * Coordonnées du livreur. Accepte { lat, lng } ou { latitude, longitude }.
 * La base Supabase peut renvoyer l'une ou l'autre convention.
 */
export interface ClientDeliveryCoordinates {
  lat?: number
  lng?: number
  latitude?: number
  longitude?: number
}

/**
 * Coordonnées de la destination. Même flexibilité que ClientDeliveryCoordinates.
 */
export interface ClientDeliveryDestinationCoordinates {
  lat?: number
  lng?: number
  latitude?: number
  longitude?: number
}

export interface ClientDeliveryEvent {
  id: string
  type: string | null
  status: string | null
  description: string | null
  location: string | null
  coordinates: ClientDeliveryCoordinates | null
  occurredAt: string | null
  data: Record<string, unknown>
}

export interface ClientDeliveryShippingMethod {
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

export interface ClientDeliveryCarrier {
  id: string
  name: string
  contactPhone: string | null
  contactEmail: string | null
  trackingUrlTemplate: string | null
  supportsGps: boolean
  metadata: Record<string, unknown>
}

export interface ClientDelivery {
  id: string
  orderId: string
  orderNumber: string | null
  status: string
  priority: string
  eta: string | null
  deliveryAddress?: string | null
  dispatchedAt: string | null
  deliveredAt: string | null
  cancelledAt: string | null
  currentLocation: string | null
  driver: ClientDeliveryDriver | null
  trackingNumber: string | null
  progressPercent: number
  coordinates: ClientDeliveryCoordinates | null
  destinationCoordinates?: ClientDeliveryDestinationCoordinates | null
  shippingMethod: ClientDeliveryShippingMethod | null
  carrier: ClientDeliveryCarrier | null
  events: ClientDeliveryEvent[]
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface ClientDeliveryResponse {
  data: ClientDelivery[]
}

export interface ClientDeliveryPreferences {
  id: string
  customerId: string
  preferredTimeWindow: string | null
  contactBeforeDelivery: boolean
  leaveAtDoor: boolean
  requireSignature: boolean
  notificationChannels: {
    email: boolean
    sms: boolean
    push: boolean
    soundAlerts: boolean
    vibrationAlerts: boolean
    gpsTracking: boolean
  }
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export type ClientDeliveryPreferencesUpdate = Partial<{
  preferredTimeWindow: string | null
  contactBeforeDelivery: boolean
  leaveAtDoor: boolean
  requireSignature: boolean
  notificationChannels: Partial<ClientDeliveryPreferences['notificationChannels']>
  metadata: Record<string, unknown>
}>

async function buildAuthHeaders(): Promise<HeadersInit> {
  return ClientAuthService.buildAuthHeaders()
}

function hasAuthorizationHeader(headers: HeadersInit): boolean {
  if (!headers) return false
  if (headers instanceof Headers) {
    return Boolean(headers.get('authorization') ?? headers.get('Authorization'))
  }
  if (Array.isArray(headers)) {
    return headers.some(([key, value]) => key.toLowerCase() === 'authorization' && String(value ?? '').trim().length > 0)
  }
  const record = headers as Record<string, unknown>
  const value = record['Authorization'] ?? record['authorization']
  return typeof value === 'string' && value.trim().length > 0
}

export interface ClientDeliveryConfig {
  shippingCostAggregationDefault: 'max' | 'sum'
  allowCustomerShippingAggregationOverride: boolean
  deliveryRules: any[]
  deliveryGeo: any
  freeShippingConfig: {
    enabled: boolean
    rules: any[]
  }
  pickupConfig: {
    enabled: boolean
    points: any[]
  }
}

/**
 * Service client pour interagir avec les endpoints de suivi de livraison.
 */
export class ClientDeliveryService {
  /**
   * Récupère la configuration de livraison publique.
   */
  static async getPublicConfig(): Promise<{ data: ClientDeliveryConfig }> {
    const response = await fetch('/api/public/delivery-config', {
      method: 'GET',
      cache: 'no-store'
    })

    if (!response.ok) {
      throw new Error("Impossible de récupérer la configuration de livraison.")
    }

    return (await response.json()) as { data: ClientDeliveryConfig }
  }

  /**
   * Récupère la liste des livraisons du client courant.
   */
  static async list(): Promise<ClientDeliveryResponse> {
    if (typeof window !== 'undefined') {
      const path = typeof window.location?.pathname === 'string' ? window.location.pathname : ''
      if (path.startsWith('/auth') || path.startsWith('/seller-dashboard')) {
        return { data: [] }
      }
    }

    const headers = await buildAuthHeaders()
    if (!hasAuthorizationHeader(headers)) {
      return { data: [] }
    }

    const response = await fetch('/api/client/deliveries', {
      method: 'GET',
      headers,
      credentials: 'include',
      cache: 'no-store'
    })

    if (!response.ok) {
      throw new Error("Impossible de récupérer les livraisons client.")
    }

    return (await response.json()) as ClientDeliveryResponse
  }

  /**
   * Récupère le détail d'une livraison particulière.
   */
  static async getById(id: string): Promise<ClientDeliveryResponse> {
    const headers = await buildAuthHeaders()
    if (!hasAuthorizationHeader(headers)) {
      throw new Error('Authentification requise.')
    }

    const response = await fetch(`/api/client/deliveries/${id}`, {
      method: 'GET',
      headers,
      credentials: 'include',
      cache: 'no-store'
    })

    if (!response.ok) {
      throw new Error('Livraison introuvable ou inaccessible.')
    }

    return (await response.json()) as ClientDeliveryResponse
  }

  /**
   * Récupère les préférences de livraison du client.
   */
  static async getPreferences(): Promise<{ data: ClientDeliveryPreferences }> {
    const headers = await buildAuthHeaders()
    if (!hasAuthorizationHeader(headers)) {
      throw new Error('Authentification requise.')
    }

    const response = await fetch('/api/client/deliveries/preferences', {
      method: 'GET',
      headers,
      credentials: 'include',
      cache: 'no-store'
    })

    if (!response.ok) {
      throw new Error("Impossible de récupérer les préférences de livraison.")
    }

    return (await response.json()) as { data: ClientDeliveryPreferences }
  }

  /**
   * Met à jour les préférences de livraison du client.
   */
  static async updatePreferences(payload: ClientDeliveryPreferencesUpdate): Promise<{ data: ClientDeliveryPreferences }> {
    const headers = await buildAuthHeaders()
    if (!hasAuthorizationHeader(headers)) {
      throw new Error('Authentification requise.')
    }

    const response = await fetch('/api/client/deliveries/preferences', {
      method: 'PATCH',
      headers,
      credentials: 'include',
      cache: 'no-store',
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error("Impossible de mettre à jour les préférences de livraison.")
    }

    return (await response.json()) as { data: ClientDeliveryPreferences }
  }

  /**
   * Récupère le détail d'une livraison par son numéro de suivi (tracking number).
   */
  static async getByTrackingNumber(trackingNumber: string): Promise<{ data: ClientDelivery | null }> {
    if (!trackingNumber) {
      throw new Error('Numéro de suivi requis.')
    }

    const response = await fetch(`/api/public/tracking/${encodeURIComponent(trackingNumber)}`, {
      method: 'GET',
      cache: 'no-store'
    })

    if (response.status === 404) {
      return { data: null }
    }

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}))
      throw new Error(payload?.error ?? "Impossible de récupérer les informations de suivi.")
    }

    return (await response.json()) as { data: ClientDelivery }
  }

  /**
   * Confirme que le client a bien reçu la livraison.
   */
  static async markReceived(deliveryId: string): Promise<{ data: { ok: boolean } }> {
    if (!deliveryId) {
      throw new Error('Identifiant livraison requis.')
    }

    const headers = await buildAuthHeaders()
    if (!hasAuthorizationHeader(headers)) {
      throw new Error('Authentification requise.')
    }

    const response = await fetch(`/api/client/deliveries/${encodeURIComponent(deliveryId)}/received`, {
      method: 'POST',
      headers,
      credentials: 'include',
      cache: 'no-store'
    })

    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(payload?.error ?? 'Impossible de confirmer la réception.')
    }

    return payload as { data: { ok: boolean } }
  }
}
