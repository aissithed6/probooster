import { ClientDeliveryPreferences } from '@/lib/services/client-delivery-service'
import { supabase } from '@/lib/supabase'

export interface VendorDeliveryDriver {
  name: string | null
  phone: string | null
  vehiclePlate: string | null
}

export interface VendorDeliveryCoordinates {
  lat: number
  lng: number
}

export interface VendorDeliveryDestinationCoordinates {
  lat: number
  lng: number
}

export interface VendorDeliveryEvent {
  id: string
  type: string | null
  status: string | null
  description: string | null
  location: string | null
  coordinates: VendorDeliveryCoordinates | null
  occurredAt: string | null
  data: Record<string, unknown>
}

export interface VendorDeliveryShippingMethod {
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

export interface VendorDeliveryCarrier {
  id: string
  name: string
  contactPhone: string | null
  contactEmail: string | null
  trackingUrlTemplate: string | null
  supportsGps: boolean
  metadata: Record<string, unknown>
}

export interface VendorDelivery {
  id: string
  orderId: string
  orderNumber: string | null
  customerId: string | null
  customerName?: string | null
  deliveryAddress?: string | null
  status: string
  priority: string
  eta: string | null
  dispatchedAt: string | null
  deliveredAt: string | null
  cancelledAt: string | null
  currentLocation: string | null
  driver: VendorDeliveryDriver | null
  trackingNumber: string | null
  progressPercent: number
  coordinates: VendorDeliveryCoordinates | null
  destinationCoordinates?: VendorDeliveryDestinationCoordinates | null
  shippingMethod: VendorDeliveryShippingMethod | null
  carrier: VendorDeliveryCarrier | null
  events: VendorDeliveryEvent[]
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface VendorDeliveryResponse {
  data: VendorDelivery[]
}

const BASE_HEADERS = {
  'Content-Type': 'application/json'
} as const

/**
 * Extrait un message d'erreur lisible depuis une réponse fetch (JSON ou texte).
 */
async function resolveApiErrorMessage(response: Response): Promise<string | null> {
  try {
    const contentType = response.headers.get('content-type') ?? ''
    if (contentType.toLowerCase().includes('application/json')) {
      const payload = (await response.json()) as any
      const error = typeof payload?.error === 'string' ? payload.error.trim() : ''
      if (error.length > 0) return error
      const message = typeof payload?.message === 'string' ? payload.message.trim() : ''
      if (message.length > 0) return message
      const detail = typeof payload?.detail === 'string' ? payload.detail.trim() : ''
      if (detail.length > 0) return detail
      return null
    }

    const text = (await response.text()).trim()
    return text.length > 0 ? text : null
  } catch {
    return null
  }
}

/**
 * Service d'accès aux livraisons côté vendeur.
 */
export class VendorDeliveryService {
  /**
   * Garantit la récupération d'un jeton d'accès valide pour les requêtes protégées.
   */
  private static async resolveAccessToken(): Promise<string | null> {
    const {
      data: { session },
      error
    } = await supabase.auth.getSession()

    if (error) {
      console.warn('⚠️ Impossible de récupérer la session Supabase actuelle:', error)
    }

    if (session?.access_token) {
      return session.access_token
    }

    const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession()

    if (refreshError) {
      console.warn('⚠️ Échec du rafraîchissement de session Supabase:', refreshError)
      return null
    }

    return refreshed.session?.access_token ?? null
  }

  /**
   * Récupère les livraisons du vendeur connecté.
   */
  static async list(): Promise<VendorDeliveryResponse> {
    const headers: Record<string, string> = { ...BASE_HEADERS }

    const accessToken = await this.resolveAccessToken()

    if (!accessToken) {
      throw new Error('Session vendeur expirée. Veuillez vous reconnecter pour accéder aux livraisons.')
    }

    headers.Authorization = `Bearer ${accessToken}`

    const response = await fetch('/api/vendor/deliveries', {
      method: 'GET',
      headers,
      credentials: 'include',
      cache: 'no-store'
    })

    if (!response.ok) {
      const apiMessage = await resolveApiErrorMessage(response)
      const suffix = apiMessage ? ` (${apiMessage})` : ''
      throw new Error(`Impossible de récupérer les livraisons vendeur.${suffix}`)
    }

    return (await response.json()) as VendorDeliveryResponse
  }

  /**
   * Placeholder pour de futures préférences de livraison vendeur.
   * Réutilise la structure client si besoin.
   */
  static async getPreferences(): Promise<{ data: ClientDeliveryPreferences }> {
    const response = await fetch('/api/client/deliveries/preferences', {
      method: 'GET',
      headers: BASE_HEADERS,
      credentials: 'include',
      cache: 'no-store'
    })

    if (!response.ok) {
      throw new Error("Impossible de récupérer les préférences de livraison.")
    }

    return (await response.json()) as { data: ClientDeliveryPreferences }
  }
}
