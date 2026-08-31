import { SuperAdminDashboardApi } from '@/lib/services/super-admin-dashboard-service.api'

export interface SuperAdminOrderListParams {
  status?: string
  paymentStatus?: string
  vendorId?: string
  customerId?: string
  search?: string
  from?: string
  to?: string
  limit?: number
  offset?: number
}

export interface SuperAdminOrderUpdatePayload {
  status?: string
  paymentStatus?: string
  paymentMethod?: string | null
  notes?: string | null
  shippingAddress?: Record<string, unknown> | null
  shippingLat?: number | null
  shippingLng?: number | null
  billingAddress?: Record<string, unknown> | null
  deliveryDate?: string | null
  clientValidation?: boolean
  clientValidationDate?: string | null
}

export interface SuperAdminOrderReturnItemPayload {
  orderItemId: string
  quantity: number
  condition?: string | null
  refundAmount?: number | null
  metadata?: Record<string, unknown>
}

export interface SuperAdminOrderReturnPayload {
  reason?: string | null
  status?: string
  resolution?: string | null
  refundAmount?: number | null
  refundCurrency?: string | null
  processedAt?: string | null
  metadata?: Record<string, unknown>
  items: SuperAdminOrderReturnItemPayload[]
}

export interface SuperAdminOrderPaymentPayload {
  provider: string
  reference?: string | null
  amount: number
  currency?: string | null
  status?: string
  paidAt?: string | null
  metadata?: Record<string, unknown>
}

export interface SuperAdminOrderDisputePayload {
  type: string
  subject?: string | null
  description?: string | null
  priority?: string | null
  status?: string
  assignedTo?: string | null
  resolution?: string | null
  closedAt?: string | null
  metadata?: Record<string, unknown>
}

export class SuperAdminOrderService {
  /**
   * Liste paginée des commandes côté super admin.
   */
  static async list(params: SuperAdminOrderListParams = {}) {
    return SuperAdminDashboardApi.listOrders(params)
  }

  /**
   * Détails complets d’une commande.
   */
  static async get(orderId: string) {
    return SuperAdminDashboardApi.getOrder(orderId)
  }

  /**
   * Supprime une commande (super admin).
   */
  static async delete(orderId: string) {
    return SuperAdminDashboardApi.deleteOrder(orderId)
  }

  /**
   * Mise à jour de la commande (statuts, notes, adresses…).
   */
  static async update(orderId: string, payload: SuperAdminOrderUpdatePayload) {
    return SuperAdminDashboardApi.updateOrder(orderId, payload)
  }

  /**
   * Crée un retour de commande.
   */
  static async createReturn(orderId: string, payload: SuperAdminOrderReturnPayload) {
    return SuperAdminDashboardApi.createOrderReturn(orderId, payload)
  }

  /**
   * Enregistre un paiement pour la commande.
   */
  static async createPayment(orderId: string, payload: SuperAdminOrderPaymentPayload) {
    return SuperAdminDashboardApi.createOrderPayment(orderId, payload)
  }

  /**
   * Ouvre un litige sur la commande.
   */
  static async createDispute(orderId: string, payload: SuperAdminOrderDisputePayload) {
    return SuperAdminDashboardApi.createOrderDispute(orderId, payload)
  }
}
