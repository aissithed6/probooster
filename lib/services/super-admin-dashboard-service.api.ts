import { supabase } from '@/lib/supabase'
import type { SuperAdminSettingsScope } from '@/lib/types/super-admin-settings'
import type {
  CreateProductCategoryInput,
  ProductCategoryMutationPayload,
  ProductCategoryRecord,
  ProductCategoryInsights,
  ProductCategoryFilterOptions,
  UpdateProductCategoryInput
} from '@/lib/types/product-category'
import {
  CreateSuperAdminProductInput,
  CreateSuperAdminUserInput,
  DuplicateProductInput,
  GetUsersOptions,
  ProductBulkActionRequest,
  ProductQueryOptions,
  ReportProductInput,
  SuperAdminInboxMessage,
  SuperAdminOverviewStats,
  SuperAdminPermission,
  SuperAdminProduct,
  SuperAdminRole,
  SuperAdminActivity,
  SuperAdminSupportTicket,
  SuperAdminSupportMessage,
  SuperAdminSystemAlert,
  SuperAdminTeamContact,
  SuperAdminUserStatus,
  SuperAdminUserSummary,
  UpdateSuperAdminProductInput,
  UpdateSuperAdminUserInput
} from '@/lib/services/super-admin-dashboard-service'
import type { SharedProduct } from '@/lib/types/shared-product'

const DEFAULT_HEADERS: HeadersInit = {
  'Content-Type': 'application/json',
  Accept: 'application/json'
}

interface ApiError extends Error {
  status?: number
  payload?: unknown
  code?: string
}

interface FetchOptions<TBody = unknown> {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  body?: TBody
  signal?: AbortSignal
}

/**
 * Récupère un jeton d'accès Supabase côté navigateur en tentant un rafraîchissement si besoin.
 */
async function resolveClientAccessToken(): Promise<string | null> {
  try {
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.warn('⚠️ Impossible de récupérer la session Supabase actuelle:', error)
    }

    let token = data.session?.access_token ?? null

    if (!token) {
      const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession()

      if (refreshError) {
        console.warn('⚠️ Rafraîchissement de session Supabase impossible:', refreshError)
        return null
      }

      token = refreshed.session?.access_token ?? null
    }

    return token
  } catch (unexpected) {
    console.warn('⚠️ Erreur inattendue lors de la résolution du token Supabase:', unexpected)
    return null
  }
}

async function fetchApi<TResponse, TBody = unknown>(
  path: string,
  options: FetchOptions<TBody> = {},
  basePath = '/api/super-admin'
): Promise<TResponse> {
  const { method = 'GET', body, signal } = options

  const ensureLeadingSlash = (value: string) => (value.length === 0 || value.startsWith('/') ? value : `/${value}`)
  const stripTrailingSlash = (value: string) => (value.endsWith('/') ? value.slice(0, -1) : value)

  const resourcePath = ensureLeadingSlash(path)

  let accessToken: string | null = null
  let fetchImpl: typeof fetch | undefined
  let requestUrl: string

  if (typeof window !== 'undefined') {
    accessToken = await resolveClientAccessToken()

    if (!accessToken) {
      throw new Error('Session super admin expirée. Veuillez vous reconnecter pour continuer.')
    }
    fetchImpl = window.fetch.bind(window)

    const normalizedBase = basePath.startsWith('http')
      ? stripTrailingSlash(basePath)
      : ensureLeadingSlash(basePath)

    requestUrl = normalizedBase ? `${normalizedBase}${resourcePath}` : resourcePath
  } else {
    let headerOrigin: string | undefined

    try {
      const { headers: serverHeaders, cookies: serverCookies } = await import('next/headers')
      const headerStore = await serverHeaders()
      const cookieStore = await serverCookies()

      const bearerHeader = headerStore.get('authorization')
      if (bearerHeader?.startsWith('Bearer ')) {
        accessToken = bearerHeader.slice(7).trim()
      }

      if (!accessToken) {
        const sbToken = cookieStore.get('sb-access-token')?.value ?? null
        if (sbToken) {
          accessToken = sbToken
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

      const forwardedProto = headerStore.get('x-forwarded-proto') ?? headerStore.get('protocol') ?? 'http'
      const forwardedHost = headerStore.get('x-forwarded-host') ?? headerStore.get('host')
      if (forwardedHost) {
        headerOrigin = `${forwardedProto}://${forwardedHost}`
      }
    } catch {
      accessToken = null
      headerOrigin = undefined
    }

    fetchImpl = fetch

    const envOriginCandidates = [
      process.env.NEXT_PUBLIC_APP_URL,
      process.env.NEXT_PUBLIC_SITE_URL,
      process.env.APP_URL,
      process.env.NEXT_PUBLIC_BASE_URL,
      process.env.BASE_URL,
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
      process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : undefined
    ] as const

    const envOrigin = envOriginCandidates.find((candidate): candidate is string => typeof candidate === 'string' && candidate.length > 0)
    const origin = stripTrailingSlash(envOrigin ?? headerOrigin ?? 'http://localhost:3000')

    const normalizedBase = basePath.startsWith('http')
      ? stripTrailingSlash(basePath)
      : `${origin}${ensureLeadingSlash(basePath)}`

    requestUrl = `${normalizedBase}${resourcePath}`
  }

  const headersInit: HeadersInit = {
    ...DEFAULT_HEADERS,
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
  }

  let response: Response

  try {
    response = await (fetchImpl ?? fetch)(requestUrl, {
      method,
      headers: headersInit,
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined,
      signal
    })
  } catch (cause) {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const online = typeof navigator !== 'undefined' ? navigator.onLine : true
    const causeMessage = (cause as Error)?.message ?? String(cause)
    console.error('❌ fetchApi network error', {
      method,
      path,
      requestUrl,
      origin,
      online,
      cause: causeMessage
    })
    const networkError = new Error(
      `Impossible d'exécuter la requête ${method} ${requestUrl}: ${causeMessage || 'erreur réseau inconnue.'} (online=${String(online)} origin=${origin})`
    )
    ;(networkError as ApiError).payload = cause
    throw networkError
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => undefined)

    const baseMessage =
      (typeof payload?.error === 'string' && payload.error) ||
      (payload && typeof payload?.error === 'object' && typeof (payload.error as any)?.message === 'string' && (payload.error as any).message) ||
      (typeof payload?.message === 'string' && payload.message) ||
      (typeof payload?.details === 'string' && payload.details) ||
      `Requête ${method} ${path} échouée (status ${response.status}).`

    const errorCode = (payload && (payload.code || payload?.error?.code)) || undefined
    const errorHint = payload && typeof payload?.hint === 'string' ? payload.hint : undefined
    const errorDetails = payload && typeof payload?.details === 'string' ? payload.details : undefined

    const messageParts = [baseMessage]
    if (errorCode) messageParts.push(`code: ${errorCode}`)
    if (errorHint) messageParts.push(`hint: ${errorHint}`)
    if (errorDetails && errorDetails !== baseMessage) messageParts.push(`details: ${errorDetails}`)

    const message = messageParts.join(' | ')

    const err = new Error(message)
    ;(err as ApiError).status = response.status
    ;(err as ApiError).payload = payload
    ;(err as ApiError).code = errorCode
    throw err
  }

  if (response.status === 204) {
    return undefined as TResponse
  }

  const data = await response.json().catch(() => ({}))
  return data?.data ?? data
}

export class SuperAdminDashboardApi {
  // --- Gestion des commandes & ventes ---

  static async listOrders(params: {
    status?: string
    paymentStatus?: string
    vendorId?: string
    customerId?: string
    search?: string
    from?: string
    to?: string
    limit?: number
    offset?: number
  } = {}): Promise<any> {
    const query = new URLSearchParams()

    if (params.status) query.set('status', params.status)
    if (params.paymentStatus) query.set('paymentStatus', params.paymentStatus)
    if (params.vendorId) query.set('vendorId', params.vendorId)
    if (params.customerId) query.set('customerId', params.customerId)
    if (params.search) query.set('search', params.search)
    if (params.from) query.set('from', params.from)
    if (params.to) query.set('to', params.to)
    if (params.limit !== undefined) query.set('limit', String(params.limit))
    if (params.offset !== undefined) query.set('offset', String(params.offset))

    const search = query.toString() ? `?${query.toString()}` : ''
    return fetchApi<{ data: any[] }>(`/orders${search}`)
  }

  static async getOrder(orderId: string): Promise<any> {
    return fetchApi<{ data: any }>(`/orders/${orderId}`)
  }

  static async deleteOrder(orderId: string): Promise<any> {
    return fetchApi<{ data: any }>(`/orders/${orderId}`, { method: 'DELETE' })
  }

  static async updateOrder(orderId: string, payload: {
    status?: string
    paymentStatus?: string
    paymentMethod?: string | null
    notes?: string | null
    shippingAddress?: Record<string, unknown> | null
    shippingLat?: number | null
    shippingLng?: number | null
    billingAddress?: Record<string, unknown> | null
    deliveryDate?: string | null
  }): Promise<any> {
    return fetchApi<{ data: any }>(`/orders/${orderId}`, {
      method: 'PATCH',
      body: payload
    })
  }

  static async createOrderReturn(orderId: string, payload: unknown): Promise<any> {
    return fetchApi<{ data: any }>(`/orders/${orderId}/returns`, {
      method: 'POST',
      body: payload
    })
  }

  static async createOrderPayment(orderId: string, payload: unknown): Promise<any> {
    return fetchApi<{ data: any }>(`/orders/${orderId}/payments`, {
      method: 'POST',
      body: payload
    })
  }

  static async createOrderDispute(orderId: string, payload: unknown): Promise<any> {
    return fetchApi<{ data: any }>(`/orders/${orderId}/disputes`, {
      method: 'POST',
      body: payload
    })
  }

  static async getOverview(signal?: AbortSignal): Promise<SuperAdminOverviewStats> {
    return fetchApi<SuperAdminOverviewStats>('/overview', { method: 'GET', signal })
  }

  static async getUsers(options: GetUsersOptions = {}, signal?: AbortSignal): Promise<SuperAdminUserSummary[]> {
    const search = new URLSearchParams()
    if (options.limit) search.set('limit', String(options.limit))
    if (options.offset) search.set('offset', String(options.offset))
    if (options.search) search.set('search', options.search)
    if (options.status) search.set('status', options.status)
    if (options.role) search.set('role', options.role)

    const query = search.toString() ? `?${search.toString()}` : ''
    return fetchApi<SuperAdminUserSummary[]>(`/users${query}`, { method: 'GET', signal })
  }

  static async createUser(payload: CreateSuperAdminUserInput, signal?: AbortSignal): Promise<SuperAdminUserSummary> {
    return fetchApi<SuperAdminUserSummary, CreateSuperAdminUserInput>('/users', {
      method: 'POST',
      body: payload,
      signal
    })
  }

  static async updateUser(payload: UpdateSuperAdminUserInput, signal?: AbortSignal): Promise<SuperAdminUserSummary> {
    return fetchApi<SuperAdminUserSummary, UpdateSuperAdminUserInput>('/users', {
      method: 'PUT',
      body: payload,
      signal
    })
  }

  static async deleteUser(userId: string, signal?: AbortSignal): Promise<void> {
    const params = new URLSearchParams({ id: userId })
    await fetchApi<void>(`/users?${params.toString()}`, { method: 'DELETE', signal })
  }

  static async createBulkNotifications(
    payload: {
      userIds: string[]
      channel: 'in-app' | 'email' | 'push'
      title: string
      message: string
      type?: string
      priority?: 'low' | 'normal' | 'high' | 'urgent'
      actionUrl?: string | null
    },
    signal?: AbortSignal
  ): Promise<{ inserted: unknown[] }> {
    return fetchApi<{ inserted: unknown[] }, typeof payload>('/notifications', {
      method: 'POST',
      body: payload,
      signal
    })
  }

  static async updateUserStatus(userId: string, status: SuperAdminUserStatus, signal?: AbortSignal): Promise<void> {
    await fetchApi<void, { id: string; status: SuperAdminUserStatus }>('/users', {
      method: 'PATCH',
      body: { id: userId, status },
      signal
    })
  }

  static async updateUserRole(userId: string, role: SuperAdminUserSummary['role'], signal?: AbortSignal): Promise<void> {
    await fetchApi<void, { id: string; role: SuperAdminUserSummary['role'] }>('/users', {
      method: 'PATCH',
      body: { id: userId, role },
      signal
    })
  }

  static async assignSecondaryRole(userId: string, roleId: string, signal?: AbortSignal): Promise<void> {
    await fetchApi<void, { userId: string; roleId: string }>('/users/roles', {
      method: 'POST',
      body: { userId, roleId },
      signal
    })
  }

  static async removeSecondaryRole(userId: string, roleId: string, signal?: AbortSignal): Promise<void> {
    const params = new URLSearchParams({ userId, roleId })
    await fetchApi<void>(`/users/roles?${params.toString()}`, { method: 'DELETE', signal })
  }

  static async duplicateUser(userId: string, signal?: AbortSignal): Promise<SuperAdminUserSummary> {
    return fetchApi<SuperAdminUserSummary, { userId: string }>('/users/duplicate', {
      method: 'POST',
      body: { userId },
      signal
    })
  }

  /**
   * Récupère les réglages super-admin en base.
   * Peut être filtré par scopes via le query param `scopes` (ex: global,vendor,admin).
   */
  static async getSettings(
    scopes?: SuperAdminSettingsScope[],
    signal?: AbortSignal
  ): Promise<Array<{ scope: SuperAdminSettingsScope; settings: Record<string, unknown> }>> {
    const search = new URLSearchParams()
    if (Array.isArray(scopes) && scopes.length > 0) {
      search.set('scopes', scopes.join(','))
    }
    const query = search.toString() ? `?${search.toString()}` : ''

    return fetchApi<Array<{ scope: SuperAdminSettingsScope; settings: Record<string, unknown> }>>(`/settings${query}`, {
      method: 'GET',
      signal
    })
  }

  static async updateSettings(scope: SuperAdminSettingsScope, settings: Record<string, unknown>, signal?: AbortSignal): Promise<void> {
    await fetchApi('/settings', {
      method: 'PUT',
      body: { scope, settings },
      signal
    })
  }

  static async getRoles(includePermissions = false, signal?: AbortSignal): Promise<{ roles: SuperAdminRole[]; permissions?: SuperAdminPermission[] }> {
    const params = new URLSearchParams()
    if (includePermissions) params.set('includePermissions', 'true')
    const query = params.toString() ? `?${params.toString()}` : ''

    let accessToken: string | null = null
    if (typeof window !== 'undefined') {
      const { data } = await supabase.auth.getSession()
      accessToken = data.session?.access_token ?? null
    }

    const headers: HeadersInit = {
      ...DEFAULT_HEADERS,
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
    }

    const response = await fetch(`/api/super-admin/roles${query}`, {
      method: 'GET',
      headers,
      credentials: 'include',
      signal
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => undefined)
      throw new Error(payload?.error ?? 'Chargement des rôles échoué.')
    }

    const body = await response.json()
    return {
      roles: body.data ?? [],
      permissions: body.permissions
    }
  }

  static async createRole(payload: { name: string; description?: string; isActive?: boolean; metadata?: Record<string, any> }, signal?: AbortSignal) {
    return fetchApi<SuperAdminRole, typeof payload>('/roles', { method: 'POST', body: payload, signal })
  }

  static async updateRole(roleId: string, payload: { name?: string; description?: string; isActive?: boolean; metadata?: Record<string, any> }, signal?: AbortSignal) {
    return fetchApi<SuperAdminRole, typeof payload & { id: string }>('/roles', {
      method: 'PUT',
      body: { id: roleId, ...payload },
      signal
    })
  }

  static async deleteRole(roleId: string, signal?: AbortSignal): Promise<void> {
    const params = new URLSearchParams({ id: roleId })
    await fetchApi<void>(`/roles?${params.toString()}`, { method: 'DELETE', signal })
  }

  static async setRolePermissions(roleId: string, permissions: string[], signal?: AbortSignal): Promise<string[]> {
    const result = await fetchApi<{ success: boolean; permissions: string[] }, { id: string; permissions: string[] }>('/roles', {
      method: 'PATCH',
      body: { id: roleId, permissions },
      signal
    })
    return result?.permissions ?? []
  }

  static async getSupportTickets(limit?: number, signal?: AbortSignal): Promise<SuperAdminSupportTicket[]> {
    const params = new URLSearchParams()
    if (limit) params.set('limit', String(limit))
    const query = params.toString() ? `?${params.toString()}` : ''
    return fetchApi<SuperAdminSupportTicket[]>(`/support-tickets${query}`, { method: 'GET', signal })
  }

  static async updateSupportTicket(ticketId: string, updates: Partial<Omit<SuperAdminSupportTicket, 'id' | 'createdAt' | 'updatedAt'>>, signal?: AbortSignal): Promise<SuperAdminSupportTicket> {
    return fetchApi<SuperAdminSupportTicket, { id: string; updates: Partial<Omit<SuperAdminSupportTicket, 'id' | 'createdAt' | 'updatedAt'>> }>('/support-tickets', {
      method: 'PUT',
      body: { id: ticketId, updates },
      signal
    })
  }

  /**
   * Récupère la liste des messages liés à un ticket de support.
   */
  static async getSupportTicketMessages(ticketId: string, signal?: AbortSignal): Promise<SuperAdminSupportMessage[]> {
    return fetchApi<SuperAdminSupportMessage[]>(`/support-tickets/${ticketId}/messages`, { method: 'GET', signal })
  }

  /**
   * Ajoute un message interne/public à un ticket de support.
   */
  static async addSupportTicketMessage(
    ticketId: string,
    payload: { message: string; authorId?: string | null; visibility?: 'internal' | 'public' },
    signal?: AbortSignal
  ): Promise<SuperAdminSupportMessage> {
    return fetchApi<SuperAdminSupportMessage, typeof payload>(`/support-tickets/${ticketId}/messages`, {
      method: 'POST',
      body: payload,
      signal
    })
  }

  static async getSystemAlerts(params: { limit?: number; status?: SuperAdminSystemAlert['status']; priority?: SuperAdminSystemAlert['priority'] } = {}, signal?: AbortSignal) {
    const search = new URLSearchParams()
    if (params.limit) search.set('limit', String(params.limit))
    if (params.status) search.set('status', params.status)
    if (params.priority) search.set('priority', params.priority)
    const query = search.toString() ? `?${search.toString()}` : ''

    return fetchApi<SuperAdminSystemAlert[]>(`/system-alerts${query}`, { method: 'GET', signal })
  }

  static async createSystemAlert(payload: { title: string; message: string; severity?: SuperAdminSystemAlert['type']; priority?: SuperAdminSystemAlert['priority']; actionRequired?: boolean; targetRoles?: string[] }, signal?: AbortSignal) {
    return fetchApi<SuperAdminSystemAlert, typeof payload>('/system-alerts', { method: 'POST', body: payload, signal })
  }

  static async updateSystemAlertStatus(alertId: string, status: SuperAdminSystemAlert['status'], signal?: AbortSignal) {
    return fetchApi<SuperAdminSystemAlert, { id: string; status: SuperAdminSystemAlert['status'] }>('/system-alerts', {
      method: 'PUT',
      body: { id: alertId, status },
      signal
    })
  }

  static async escalateSystemAlert(alertId: string, signal?: AbortSignal): Promise<SuperAdminSystemAlert> {
    return fetchApi<SuperAdminSystemAlert, { id: string; action: 'escalate' }>('/system-alerts', {
      method: 'PATCH',
      body: { id: alertId, action: 'escalate' },
      signal
    })
  }

  static async resolveAllSystemAlerts(signal?: AbortSignal): Promise<number> {
    const result = await fetchApi<{ success: boolean; resolved: number }, { action: 'resolve_all' }>('/system-alerts', {
      method: 'PATCH',
      body: { action: 'resolve_all' },
      signal
    })

    return result?.resolved ?? 0
  }

  static async deleteSystemAlert(alertId: string, signal?: AbortSignal): Promise<void> {
    const params = new URLSearchParams({ id: alertId })
    await fetchApi<void>(`/system-alerts?${params.toString()}`, { method: 'DELETE', signal })
  }

  // --- Gestion des catégories produits ---

  static async fetchCategories(options: ProductCategoryFilterOptions = {}): Promise<{ items: ProductCategoryRecord[]; insights?: ProductCategoryInsights }> {
    const search = new URLSearchParams()
    if (options.includeInactive) search.set('includeInactive', String(options.includeInactive))
    if (options.search) search.set('search', options.search)
    if (options.withStats) search.set('withStats', 'true')

    const query = search.toString() ? `?${search.toString()}` : ''
    const response = await fetchApi<{ items: ProductCategoryRecord[]; insights?: ProductCategoryInsights }>(`/categories${query}`, {
      method: 'GET'
    })
    return {
      items: response?.items ?? [],
      insights: response?.insights
    }
  }

  static async createCategory(payload: CreateProductCategoryInput): Promise<ProductCategoryRecord> {
    return fetchApi<ProductCategoryRecord, CreateProductCategoryInput>('/categories', {
      method: 'POST',
      body: payload
    })
  }

  static async updateCategory(payload: UpdateProductCategoryInput): Promise<ProductCategoryRecord> {
    return fetchApi<ProductCategoryRecord, UpdateProductCategoryInput>('/categories', {
      method: 'PUT',
      body: payload
    })
  }

  static async mutateCategory(payload: ProductCategoryMutationPayload): Promise<ProductCategoryRecord[]> {
    const response = await fetchApi<{ items: ProductCategoryRecord[] }, ProductCategoryMutationPayload>('/categories', {
      method: 'PATCH',
      body: payload
    })
    return response?.items ?? []
  }

  static async deleteCategory(id: string): Promise<void> {
    const params = new URLSearchParams({ id })
    await fetchApi<void>(`/categories?${params.toString()}`, { method: 'DELETE' })
  }

  static async getInboxMessages(recipientId: string, options: { limit?: number; status?: SuperAdminInboxMessage['status'] } = {}, signal?: AbortSignal) {
    const search = new URLSearchParams({ recipientId })
    if (options.limit) search.set('limit', String(options.limit))
    if (options.status) search.set('status', options.status)
    const query = `?${search.toString()}`

    return fetchApi<SuperAdminInboxMessage[]>(`/messages${query}`, { method: 'GET', signal })
  }

  static async markMessageAsRead(messageId: string, signal?: AbortSignal): Promise<void> {
    await fetchApi<void, { action: 'mark_read'; messageId: string }>('/messages', {
      method: 'PATCH',
      body: { action: 'mark_read', messageId },
      signal
    })
  }

  static async markAllMessagesAsRead(recipientId: string, signal?: AbortSignal): Promise<void> {
    await fetchApi<void, { action: 'mark_all_read'; recipientId: string }>('/messages', {
      method: 'PATCH',
      body: { action: 'mark_all_read', recipientId },
      signal
    })
  }

  static async updateMessageStatus(messageId: string, status: SuperAdminInboxMessage['status'], signal?: AbortSignal): Promise<void> {
    await fetchApi<void, { action: 'update_status'; messageId: string; status: SuperAdminInboxMessage['status'] }>('/messages', {
      method: 'PATCH',
      body: { action: 'update_status', messageId, status },
      signal
    })
  }

  static async sendInternalMessage(
    payload: {
      senderId?: string | null
      recipientId: string
      subject: string
      message: string
      priority?: SuperAdminInboxMessage['priority']
      category?: string | null
      parentMessageId?: string | null
    },
    signal?: AbortSignal
  ): Promise<void> {
    await fetchApi<void, typeof payload>('/messages', {
      method: 'POST',
      body: payload,
      signal
    })
  }

  static async getActivities(limit = 20, signal?: AbortSignal): Promise<SuperAdminActivity[]> {
    const params = new URLSearchParams({ limit: String(limit) })
    const rawActivities = await fetchApi<Array<{ id: string; type: string; title: string; description: string; timestamp: string; priority: string; status: string }>>(
      `/activities?${params.toString()}`,
      { method: 'GET', signal }
    )

    return (rawActivities ?? []).map<SuperAdminActivity>((activity) => {
      const type: SuperAdminActivity['type'] = activity.type === 'order' || activity.type === 'alert' ? activity.type : 'message'
      const priority: SuperAdminActivity['priority'] = activity.priority === 'high' || activity.priority === 'low' ? activity.priority : 'medium'

      return {
        id: activity.id,
        type,
        title: activity.title,
        description: activity.description,
        timestamp: activity.timestamp,
        priority,
        status: activity.status
      }
    })
  }

  static async getContacts(signal?: AbortSignal): Promise<SuperAdminTeamContact[]> {
    return fetchApi<SuperAdminTeamContact[]>('/contacts', { method: 'GET', signal })
  }

  // Produits super-admin
  static async getProducts(options: ProductQueryOptions = {}, signal?: AbortSignal): Promise<{ items: SuperAdminProduct[]; count: number }> {
    const params = new URLSearchParams()
    if (options.search) params.set('search', options.search)
    if (options.status) params.set('status', options.status)
    if (options.vendorId) params.set('vendorId', options.vendorId)
    if (typeof options.featured === 'boolean') params.set('featured', String(options.featured))
    if (typeof options.limit === 'number') params.set('limit', String(options.limit))
    if (typeof options.offset === 'number') params.set('offset', String(options.offset))

    const query = params.toString() ? `?${params.toString()}` : ''
    return fetchApi<{ items: SuperAdminProduct[]; count: number }>(`/products${query}`, { method: 'GET', signal })
  }

  /**
   * Récupère un produit complet via son identifiant afin de pré-remplir les formulaires côté super admin.
   */
  static async getProductById(productId: string, signal?: AbortSignal): Promise<SharedProduct | null> {
    if (!productId) {
      console.warn('⚠️ getProductById appelé sans identifiant de produit.')
      return null
    }

    try {
      return await fetchApi<SharedProduct>(`/products?id=${encodeURIComponent(productId)}`, { method: 'GET', signal })
    } catch (error) {
      const status = typeof (error as ApiError)?.status === 'number' ? (error as ApiError).status : undefined

      if (status === 404) {
        console.warn('⚠️ Produit introuvable côté super admin.', { productId })
        return null
      }

      console.error('❌ getProductById failed:', error)
      throw error
    }
  }

  static async createProduct(payload: CreateSuperAdminProductInput, signal?: AbortSignal): Promise<SuperAdminProduct> {
    return fetchApi<SuperAdminProduct, CreateSuperAdminProductInput>('/products', {
      method: 'POST',
      body: payload,
      signal
    })
  }

  static async updateProduct(payload: UpdateSuperAdminProductInput, signal?: AbortSignal): Promise<SuperAdminProduct> {
    return fetchApi<SuperAdminProduct, UpdateSuperAdminProductInput>('/products', {
      method: 'PUT',
      body: payload,
      signal
    })
  }

  static async duplicateProduct(payload: DuplicateProductInput, signal?: AbortSignal): Promise<SuperAdminProduct> {
    return fetchApi<SuperAdminProduct, DuplicateProductInput & { type: 'duplicate' }>('/products', {
      method: 'PATCH',
      body: { type: 'duplicate', ...payload },
      signal
    })
  }

  static async reportProduct(payload: ReportProductInput, signal?: AbortSignal): Promise<SuperAdminProduct> {
    return fetchApi<SuperAdminProduct, ReportProductInput & { type: 'report' }>('/products', {
      method: 'PATCH',
      body: { type: 'report', ...payload },
      signal
    })
  }

  static async bulkProductAction(payload: ProductBulkActionRequest, signal?: AbortSignal): Promise<{ affected: number }> {
    return fetchApi<{ affected: number }, ProductBulkActionRequest & { type: 'bulk' }>('/products', {
      method: 'PATCH',
      body: { type: 'bulk', ...payload },
      signal
    })
  }

  static async deleteProduct(productId: string, signal?: AbortSignal): Promise<void> {
    const params = new URLSearchParams({ id: productId })
    await fetchApi<void>(`/products?${params.toString()}`, { method: 'DELETE', signal })
  }
}
