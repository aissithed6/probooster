import { supabase } from '@/lib/supabase'
import type { SharedProduct, SharedProductInput } from '@/lib/types/shared-product'

const DEFAULT_HEADERS: HeadersInit = {
  'Content-Type': 'application/json',
  Accept: 'application/json'
}

interface FetchOptions<TBody = unknown> {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  body?: TBody
  signal?: AbortSignal
}

async function fetchVendorApi<TResponse, TBody = unknown>(path: string, options: FetchOptions<TBody> = {}): Promise<TResponse> {
  const { method = 'GET', body, signal } = options

  let accessToken: string | null = null
  let fetchImpl: typeof fetch | undefined

  if (typeof window !== 'undefined') {
    const { data } = await supabase.auth.getSession()
    accessToken = data.session?.access_token ?? null
    fetchImpl = window.fetch.bind(window)
  } else {
    try {
      const { headers: getHeaders, cookies: getCookies } = await import('next/headers')
      const headerStore = await Promise.resolve(getHeaders())
      const bearerHeader = headerStore.get('authorization')
      if (bearerHeader?.startsWith('Bearer ')) {
        accessToken = bearerHeader.slice(7).trim()
      }

      if (!accessToken) {
        const cookieStore = await Promise.resolve(getCookies())
        const bearer = cookieStore.get('sb-access-token')?.value
        if (bearer) {
          accessToken = bearer
        } else {
          const supabaseAuthCookie = cookieStore.get('supabase-auth-token')?.value
          if (supabaseAuthCookie) {
            try {
              const parsed = JSON.parse(supabaseAuthCookie)
              accessToken = Array.isArray(parsed) ? parsed[0]?.access_token ?? null : parsed?.access_token ?? null
            } catch {
              accessToken = null
            }
          }
        }
      }
    } catch {
      accessToken = null
    }

    fetchImpl = fetch
  }

  const headersInit: HeadersInit = {
    ...DEFAULT_HEADERS,
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
  }

  const response = await (fetchImpl ?? fetch)(`/api/vendor${path}`, {
    method,
    headers: headersInit,
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
    signal
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => undefined)
    const message = payload?.error ?? `Requête ${method} ${path} échouée (status ${response.status}).`
    throw new Error(message)
  }

  if (response.status === 204) {
    return undefined as TResponse
  }

  const data = await response.json().catch(() => ({}))
  return data?.data ?? data
}

interface VendorProductQueryOptions {
  search?: string
  status?: string
  featured?: boolean
  limit?: number
  offset?: number
}

export class SellerDashboardApi {
  static async getDashboard(vendorId: string, signal?: AbortSignal): Promise<any | null> {
    try {
      if (!vendorId) return null
      return await fetchVendorApi<any>(`/dashboard?vendorId=${encodeURIComponent(vendorId)}`, {
        method: 'GET',
        signal
      })
    } catch {
      return null
    }
  }

  /**
   * Retourne les produits du vendeur courant avec pagination + filtres.
   */
  static async getProducts(options: VendorProductQueryOptions = {}, signal?: AbortSignal): Promise<{ items: SharedProduct[]; count: number }> {
    const params = new URLSearchParams()
    if (options.search) params.set('search', options.search)
    if (options.status) params.set('status', options.status)
    if (typeof options.featured === 'boolean') params.set('featured', options.featured ? 'true' : 'false')
    if (options.limit) params.set('limit', String(options.limit))
    if (options.offset) params.set('offset', String(options.offset))

    const query = params.toString() ? `?${params.toString()}` : ''
    return fetchVendorApi<{ items: SharedProduct[]; count: number }>(`/products${query}`, { method: 'GET', signal })
  }

  /**
   * Récupère un produit spécifique du vendeur.
   */
  static async getProductById(productId: string, signal?: AbortSignal): Promise<SharedProduct> {
    return fetchVendorApi<SharedProduct>(`/products?id=${encodeURIComponent(productId)}`, {
      method: 'GET',
      signal
    })
  }

  /**
   * Crée un produit côté vendeur et retourne la structure partagée normalisée.
   */
  static async createProduct(payload: SharedProductInput, signal?: AbortSignal): Promise<SharedProduct> {
    return fetchVendorApi<SharedProduct, SharedProductInput>('/products', {
      method: 'POST',
      body: payload,
      signal
    })
  }

  /**
   * Met à jour un produit existant du vendeur.
   */
  static async updateProduct(payload: SharedProductInput & { id: string }, signal?: AbortSignal): Promise<SharedProduct> {
    return fetchVendorApi<SharedProduct, SharedProductInput & { id: string }>('/products', {
      method: 'PUT',
      body: payload,
      signal
    })
  }

  /**
   * Supprime un produit du vendeur authentifié.
   */
  static async deleteProduct(productId: string, signal?: AbortSignal): Promise<void> {
    await fetchVendorApi<void>(`/products?id=${encodeURIComponent(productId)}`, {
      method: 'DELETE',
      signal
    })
  }
}
