import { getSupabaseAdmin } from '@/lib/supabase'
import type { PostgrestSingleResponse } from '@supabase/supabase-js'

type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

type ProfileRow = {
  user_id: string
  first_name: string | null
  last_name: string | null
  phone: string | null
}

type UserRow = {
  id: string
  email: string | null
}

type UserProductRow = {
  id: string
  name: string | null
  vendor_id?: string | null
  free_shipping?: boolean | null
  is_virtual?: boolean | null
  is_downloadable?: boolean | null
}

type CommissionRuleRow = {
  id: string
  scope: 'global' | 'vendor' | 'group'
  vendor_id: string | null
  group_name: string | null
  base_percent: number | null
  base_amount: number | null
  hybrid_percent: number | null
  hybrid_amount: number | null
  updated_at: string
}

function buildFullName(first?: string | null, last?: string | null): string {
  return `${first ?? ''} ${last ?? ''}`.trim()
}

/**
 * Calcule le montant de commission à partir d'une règle (si présente).
 */
function computeCommissionAmount(params: {
  totalAmount: number
  rule: CommissionRuleRow | null
}): number {
  const total = Number.isFinite(params.totalAmount) ? Math.max(0, params.totalAmount) : 0
  const rule = params.rule
  if (!rule || total <= 0) return 0

  const useHybrid = rule.hybrid_percent != null || rule.hybrid_amount != null
  const percent = useHybrid ? Number(rule.hybrid_percent ?? 0) : Number(rule.base_percent ?? 0)
  const fixed = useHybrid ? Number(rule.hybrid_amount ?? 0) : Number(rule.base_amount ?? 0)

  const percentSafe = Number.isFinite(percent) ? percent : 0
  const fixedSafe = Number.isFinite(fixed) ? fixed : 0

  const byPercent = total * (Math.max(0, percentSafe) / 100)
  const raw = byPercent + Math.max(0, fixedSafe)
  const commission = Number.isFinite(raw) ? raw : 0

  return Math.min(total, Math.max(0, commission))
}

/**
 * Récupère la règle de commission applicable à un vendeur (vendor > global).
 */
async function fetchApplicableCommissionRule(params: {
  supabase: ReturnType<typeof getSupabaseAdmin>
  vendorId: string
}): Promise<CommissionRuleRow | null> {
  const { supabase, vendorId } = params

  const { data: vendorRule, error: vendorErr } = await supabase
    .from('finance_commission_rules')
    .select('*')
    .eq('scope', 'vendor')
    .eq('vendor_id', vendorId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (vendorErr) {
    console.warn('[OrderRepository] commission_rules vendor lookup failed:', vendorErr)
  }

  if (vendorRule) return vendorRule as CommissionRuleRow

  const { data: globalRule, error: globalErr } = await supabase
    .from('finance_commission_rules')
    .select('*')
    .eq('scope', 'global')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (globalErr) {
    console.warn('[OrderRepository] commission_rules global lookup failed:', globalErr)
  }

  return globalRule ? (globalRule as CommissionRuleRow) : null
}

export interface OrderFilters {
  status?: string
  paymentStatus?: string
  vendorId?: string
  customerId?: string
  search?: string
  from?: string
  to?: string
}

export interface PaginationOptions {
  limit: number
  offset: number
}

export interface ListOrdersOptions {
  filters: OrderFilters
  pagination: PaginationOptions
}

interface OrderPayload {
  customerId: string
  vendorId: string
  totalAmount: number
  currency?: string
  paymentMethod?: string
  paymentStatus?: string
  paymentOption?: string
  status?: string
  shippingAddress?: Json
  shippingLat?: number | null
  shippingLng?: number | null
  billingAddress?: Json
  pointsUsed?: number
  pointsDiscount?: number
  finalTotal?: number
  deliveryOption?: string
  notes?: string
  items: Array<{
    productId: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }>
}

interface OrderCreateContext {
  actorId: string
  actorRole: string
}

interface OrderRecord {
  id: string
  customer_id: string
  vendor_id: string
  status: string | null
  total_amount: number
  currency: string | null
  payment_status: string | null
  payment_method: string | null
  payment_option?: string | null
  delivery_option?: string | null
  points_used?: number | null
  points_discount?: number | null
  final_total?: number | null
  shipping_address: Json | null
  shipping_lat?: number | null
  shipping_lng?: number | null
  billing_address: Json | null
  created_at: string | null
  updated_at: string | null
}

interface OrderItemRecord {
  id: string
  order_id: string
  product_id: string | null
  quantity: number
  unit_price: number
  total_price: number
  created_at: string | null
}

interface OrderPaymentRecord {
  id: string
  order_id: string
  provider: string
  reference: string | null
  amount: number
  currency: string
  status: string
  paid_at: string | null
  metadata: Json
  created_at: string | null
  updated_at: string | null
}

interface OrderReturnItemRecord {
  id: string
  return_id: string
  order_item_id: string
  quantity: number
  condition: string | null
  refund_amount: number | null
  metadata: Json
}

interface OrderReturnRecord {
  id: string
  order_id: string
  customer_id: string | null
  vendor_id: string | null
  status: string
  reason: string | null
  resolution: string | null
  refund_amount: number | null
  refund_currency: string
  requested_at: string
  processed_at: string | null
  metadata: Json
  order_return_items?: OrderReturnItemRecord[]
}

interface OrderDisputeRecord {
  id: string
  order_id: string
  opened_by: string | null
  assigned_to: string | null
  type: string
  status: string
  priority: string
  subject: string | null
  description: string | null
  resolution: string | null
  opened_at: string
  closed_at: string | null
  metadata: Json
}

interface OrderStatusHistoryRecord {
  id: string
  order_id: string
  actor_id: string | null
  actor_role: string
  previous_status: string | null
  new_status: string | null
  previous_payment_status: string | null
  new_payment_status: string | null
  previous_fulfillment_status: string | null
  new_fulfillment_status: string | null
  comment: string | null
  metadata: Json
  created_at: string
}

interface OrderPaymentRequestRecord {
  id: string
  vendor_id: string
  requested_by: string | null
  status: string
  amount: number
  commission_amount: number
  currency: string
  notes: string | null
  approved_by: string | null
  approved_at: string | null
  rejected_reason: string | null
  created_at: string
  updated_at: string
  metadata: Json
}

interface OrderPaymentRequestItemRecord {
  id: string
  payment_request_id: string
  order_id: string
  order_amount: number
  commission_amount: number
  net_amount: number | null
  metadata: Json
  payment_request?: OrderPaymentRequestRecord | null
}

interface OrderPaymentPayload {
  provider: string
  reference?: string | null
  amount: number
  currency?: string | null
  status?: string
  paidAt?: string | null
  metadata?: Json
}

interface OrderDisputePayload {
  type: string
  subject?: string | null
  description?: string | null
  priority?: string | null
  status?: string
  assignedTo?: string | null
  resolution?: string | null
  closedAt?: string | null
  metadata?: Json
}

interface OrderReturnItemPayload {
  orderItemId: string
  quantity: number
  condition?: string | null
  refundAmount?: number | null
  metadata?: Json
}

interface OrderReturnPayload {
  reason?: string | null
  status?: string
  resolution?: string | null
  refundAmount?: number | null
  refundCurrency?: string | null
  processedAt?: string | null
  metadata?: Json
  items: OrderReturnItemPayload[]
}

interface OrderWithItems extends OrderRecord {
  items: OrderItemRecord[]
}

interface OrderDetails extends OrderWithItems {
  payments: OrderPaymentRecord[]
  returns: Array<OrderReturnRecord & { order_return_items: OrderReturnItemRecord[] }>
  disputes: OrderDisputeRecord[]
  history: OrderStatusHistoryRecord[]
  paymentRequestItems: Array<OrderPaymentRequestItemRecord & { payment_request: OrderPaymentRequestRecord | null }>
}

function mapOrder(response: OrderRecord & { order_items?: OrderItemRecord[] }): OrderWithItems {
  const { order_items: items = [], ...rest } = response
  return {
    ...rest,
    items
  }
}

function mapOrderDetails(
  response: OrderRecord & {
    order_items?: OrderItemRecord[]
    order_payments?: OrderPaymentRecord[]
    order_returns?: Array<OrderReturnRecord & { order_return_items?: OrderReturnItemRecord[] }>
    order_disputes?: OrderDisputeRecord[]
    order_status_history?: OrderStatusHistoryRecord[]
  },
  paymentRequestItems: Array<OrderPaymentRequestItemRecord & { payment_request: OrderPaymentRequestRecord | null }>
): OrderDetails {
  const {
    order_items: items = [],
    order_payments: payments = [],
    order_returns: returnsRaw = [],
    order_disputes: disputes = [],
    order_status_history: history = [],
    ...rest
  } = response

  const returns = returnsRaw.map((ret) => ({
    ...ret,
    order_return_items: ret.order_return_items ?? []
  }))

  return {
    ...rest,
    items,
    payments,
    returns,
    disputes,
    history,
    paymentRequestItems
  }
}

export class OrderRepository {
  /**
   * Enrichit des commandes brutes avec:
   * - customer_name / customer_email / customer_phone
   * - vendor_name
   * - order_items[].product_name
   */
  private static async enrichOrders(
    orders: Array<(OrderRecord & { order_items?: any[] })>
  ): Promise<Array<(OrderRecord & { order_items?: any[] })>> {
    const supabase = getSupabaseAdmin()

    const customerIds = Array.from(
      new Set(
        (orders ?? [])
          .map((o) => (o as any)?.customer_id)
          .filter((v): v is string => typeof v === 'string' && v.length > 0)
      )
    )

    const vendorIds = Array.from(
      new Set(
        (orders ?? [])
          .map((o) => (o as any)?.vendor_id)
          .filter((v): v is string => typeof v === 'string' && v.length > 0)
      )
    )

    const productIds = Array.from(
      new Set(
        (orders ?? [])
          .flatMap((o) => {
            const items = Array.isArray((o as any)?.order_items) ? (o as any).order_items : []
            return items
              .map((it: any) => it?.product_id)
              .filter((v: any): v is string => typeof v === 'string' && v.length > 0)
          })
      )
    )

    const [profilesResult, usersResult, productsResult, assignmentsResult] = await Promise.all([
      customerIds.length + vendorIds.length > 0
        ? supabase
            .from('user_profiles')
            .select('user_id, first_name, last_name, phone')
            .in('user_id', Array.from(new Set([...customerIds, ...vendorIds])))
        : Promise.resolve({ data: [] as any[], error: null as any }),
      customerIds.length + vendorIds.length > 0
        ? supabase
            .from('users')
            .select('id, email')
            .in('id', Array.from(new Set([...customerIds, ...vendorIds])))
        : Promise.resolve({ data: [] as any[], error: null as any }),
      productIds.length > 0
        ? supabase.from('user_products').select('id, name, vendor_id, free_shipping, is_virtual, is_downloadable').in('id', productIds)
        : Promise.resolve({ data: [] as any[], error: null as any }),
      productIds.length > 0
        ? supabase
            .from('product_category_assignments')
            .select('product_id, category_id')
            .in('product_id', productIds)
        : Promise.resolve({ data: [] as any[], error: null as any })
    ])

    if (profilesResult.error) {
      console.warn('[OrderRepository] enrichOrders: user_profiles query failed:', profilesResult.error)
    }
    if (usersResult.error) {
      console.warn('[OrderRepository] enrichOrders: users query failed:', usersResult.error)
    }
    if (productsResult.error) {
      console.warn('[OrderRepository] enrichOrders: user_products query failed:', productsResult.error)
    }
    if (assignmentsResult.error) {
      console.warn('[OrderRepository] enrichOrders: product_category_assignments query failed:', assignmentsResult.error)
    }

    const profiles = (profilesResult.data ?? []) as ProfileRow[]
    const users = (usersResult.data ?? []) as UserRow[]
    const products = (productsResult.data ?? []) as UserProductRow[]

    const profileByUserId = new Map(profiles.map((p) => [p.user_id, p]))
    const emailByUserId = new Map(users.map((u) => [u.id, u.email ?? null]))
    const productNameById = new Map(products.map((p) => [p.id, p.name ?? null]))
    const productMetaById = new Map(
      products.map((p) => [
        p.id,
        {
          vendorId: (p as any)?.vendor_id ?? null,
          freeShipping: Boolean((p as any)?.free_shipping),
          isVirtual: Boolean((p as any)?.is_virtual),
          isDownloadable: Boolean((p as any)?.is_downloadable)
        }
      ])
    )

    const categoryIdsByProductId = new Map<string, string[]>()
    ;((assignmentsResult.data ?? []) as any[]).forEach((row: any) => {
      const pid = typeof row?.product_id === 'string' ? row.product_id : ''
      const cid = typeof row?.category_id === 'string' ? row.category_id : ''
      if (!pid || !cid) return
      const list = categoryIdsByProductId.get(pid) ?? []
      list.push(cid)
      categoryIdsByProductId.set(pid, list)
    })

    return (orders ?? []).map((order) => {
      const customerId = (order as any)?.customer_id as string | undefined
      const vendorId = (order as any)?.vendor_id as string | undefined

      const customerProfile = customerId ? profileByUserId.get(customerId) : undefined
      const vendorProfile = vendorId ? profileByUserId.get(vendorId) : undefined

      const customerName = buildFullName(customerProfile?.first_name ?? null, customerProfile?.last_name ?? null)
      const vendorName = buildFullName(vendorProfile?.first_name ?? null, vendorProfile?.last_name ?? null)

      const customerEmail = customerId ? emailByUserId.get(customerId) : null
      const customerPhone = customerProfile?.phone ?? null

      const items = Array.isArray((order as any)?.order_items) ? (order as any).order_items : []
      const enrichedItems = items.map((it: any) => {
        const pid = typeof it?.product_id === 'string' ? it.product_id : null
        const meta = pid ? productMetaById.get(pid) : undefined
        const categoryIds = pid ? categoryIdsByProductId.get(pid) ?? [] : []
        const name =
          typeof it?.product_name === 'string' && it.product_name.trim().length > 0
            ? it.product_name
            : pid
              ? productNameById.get(pid) ?? null
              : null

        return {
          ...it,
          product_name: name ?? it?.product_name ?? null,
          product_vendor_id: meta?.vendorId ?? null,
          product_category_ids: categoryIds,
          product_free_shipping: meta?.freeShipping ?? false,
          product_is_virtual: meta?.isVirtual ?? false,
          product_is_downloadable: meta?.isDownloadable ?? false,
          product_is_digital: Boolean(meta?.isVirtual || meta?.isDownloadable)
        }
      })

      return {
        ...order,
        customer_name:
          typeof (order as any)?.customer_name === 'string' && String((order as any).customer_name).trim().length > 0
            ? (order as any).customer_name
            : customerName || (customerEmail ?? null),
        customer_email: (order as any)?.customer_email ?? customerEmail ?? null,
        customer_phone: (order as any)?.customer_phone ?? customerPhone ?? null,
        vendor_name:
          typeof (order as any)?.vendor_name === 'string' && String((order as any).vendor_name).trim().length > 0
            ? (order as any).vendor_name
            : vendorName || (vendorId ?? null),
        order_items: enrichedItems
      }
    })
  }

  /**
   * Récupère une liste paginée de commandes avec filtrage optionnel.
   */
  static async listOrders({ filters, pagination }: ListOrdersOptions): Promise<OrderWithItems[]> {
    const supabase = getSupabaseAdmin()
    const { limit, offset } = pagination

    let query = supabase
      .from('orders')
      .select(
        `
        *,
        deliveries!order_id (
          id,
          status,
          eta,
          dispatched_at,
          delivered_at,
          cancelled_at,
          created_at
        ),
        order_items (
          id,
          order_id,
          product_id,
          quantity,
          unit_price,
          total_price,
          created_at
        )
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    if (filters.paymentStatus) {
      query = query.eq('payment_status', filters.paymentStatus)
    }

    if (filters.vendorId) {
      query = query.eq('vendor_id', filters.vendorId)
    }

    if (filters.customerId) {
      query = query.eq('customer_id', filters.customerId)
    }

    if (filters.from) {
      query = query.gte('created_at', filters.from)
    }

    if (filters.to) {
      query = query.lte('created_at', filters.to)
    }

    if (filters.search) {
      const term = `%${filters.search}%`
      query = query.or(`order_number.ilike.${term},notes.ilike.${term}`)
    }

    const { data, error } = (await query) as PostgrestSingleResponse<Array<OrderRecord & { order_items?: OrderItemRecord[] }>>

    if (error) {
      throw new Error(`Impossible de récupérer les commandes: ${error.message}`)
    }

    const enriched = await this.enrichOrders((data ?? []) as any)
    return (enriched ?? []).map(mapOrder)
  }

  /**
   * Crée une nouvelle commande ainsi que ses lignes produits et trace l'historique initial.
   */
  static async createOrder(payload: OrderPayload, context: OrderCreateContext): Promise<OrderWithItems> {
    const supabase = getSupabaseAdmin()

    if (!payload.items || payload.items.length === 0) {
      throw new Error('Création commande échouée: aucun article fourni')
    }

    const { data: orderRows, error: insertOrderError } = await supabase
      .from('orders')
      .insert({
        customer_id: payload.customerId,
        vendor_id: payload.vendorId,
        total_amount: payload.totalAmount,
        currency: payload.currency ?? 'XOF',
        payment_method: payload.paymentMethod ?? null,
        payment_option: payload.paymentOption ?? null,
        delivery_option: payload.deliveryOption ?? null,
        points_used: typeof payload.pointsUsed === 'number' ? payload.pointsUsed : null,
        points_discount: typeof payload.pointsDiscount === 'number' ? payload.pointsDiscount : null,
        final_total: typeof payload.finalTotal === 'number' ? payload.finalTotal : null,
        payment_status: payload.paymentStatus ?? 'pending',
        status: payload.status ?? 'pending',
        shipping_address: payload.shippingAddress ?? null,
        shipping_lat: typeof payload.shippingLat === 'number' ? payload.shippingLat : null,
        shipping_lng: typeof payload.shippingLng === 'number' ? payload.shippingLng : null,
        billing_address: payload.billingAddress ?? null,
        notes: payload.notes ?? null
      })
      .select('*, order_items (*)')
      .single()

    if (insertOrderError || !orderRows) {
      throw new Error(`Création commande échouée: ${insertOrderError?.message ?? 'erreur inconnue'}`)
    }

    const orderId = orderRows.id

    const itemsPayload = payload.items.map((item) => ({
      order_id: orderId,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.totalPrice
    }))

    if (itemsPayload.length === 0) {
      try {
        await supabase.from('orders').delete().eq('id', orderId)
      } catch {
        // silencieux
      }
      throw new Error('Création commande échouée: aucun article fourni')
    }

    const { error: insertItemsError } = await supabase.from('order_items').insert(itemsPayload)
    if (insertItemsError) {
      try {
        await supabase.from('orders').delete().eq('id', orderId)
      } catch {
        // silencieux
      }

      const errCode = typeof (insertItemsError as any)?.code === 'string' ? String((insertItemsError as any).code) : ''
      const errMessage = typeof (insertItemsError as any)?.message === 'string' ? String((insertItemsError as any).message) : ''

      if (errCode === '23514' || /stock insuffisant/i.test(errMessage)) {
        throw new Error(`Stock insuffisant pour un ou plusieurs produits. (${errCode || 'stock'})`)
      }

      throw new Error(`Insertion des lignes de commande échouée: ${insertItemsError.message}`)
    }

    await supabase.from('order_status_history').insert({
      order_id: orderId,
      actor_id: context.actorId,
      actor_role: context.actorRole,
      previous_status: null,
      new_status: payload.status ?? 'pending',
      previous_payment_status: null,
      new_payment_status: payload.paymentStatus ?? 'pending',
      previous_fulfillment_status: null,
      new_fulfillment_status: null,
      comment: 'Création de la commande'
    })

    const { data: orderWithItems, error: fetchError } = await supabase
      .from('orders')
      .select(
        `
        *,
        order_items (
          id,
          order_id,
          product_id,
          quantity,
          unit_price,
          total_price,
          created_at
        )
      `
      )
      .eq('id', orderId)
      .single()

    if (fetchError || !orderWithItems) {
      throw new Error(`Impossible de charger la commande créée: ${fetchError?.message ?? 'erreur inconnue'}`)
    }

    return mapOrder(orderWithItems)
  }

  /**
   * Retourne une commande détaillée avec paiements, retours, litiges, historiques et demandes de paiement.
   */
  static async getOrderById(orderId: string): Promise<OrderDetails | null> {
    const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('orders')
    .select(
      `
      *,
      deliveries!order_id (
        id,
        status,
        eta,
        dispatched_at,
        delivered_at,
        cancelled_at,
        created_at
      ),
      order_items (
        id,
        order_id,
        product_id,
        quantity,
        unit_price,
        total_price,
        created_at
      ),
      order_payments (
        id,
        order_id,
        provider,
        reference,
        amount,
        currency,
        status,
        paid_at,
        metadata,
        created_at,
        updated_at
      ),
      order_returns (
        id,
        order_id,
        customer_id,
        vendor_id,
        status,
        reason,
        resolution,
        refund_amount,
        refund_currency,
        requested_at,
        processed_at,
        metadata,
        order_return_items (
          id,
          return_id,
          order_item_id,
          quantity,
          condition,
          refund_amount,
          metadata
        )
      ),
      order_disputes (
        id,
        order_id,
        opened_by,
        assigned_to,
        type,
        status,
        priority,
        subject,
        description,
        resolution,
        opened_at,
        closed_at,
        metadata
      ),
      order_status_history (
        id,
        order_id,
        actor_id,
        actor_role,
        previous_status,
        new_status,
        previous_payment_status,
        new_payment_status,
        previous_fulfillment_status,
        new_fulfillment_status,
        comment,
        created_at
      )
    `
    )
    .eq('id', orderId)
    .maybeSingle()

  if (error) {
    throw new Error(`Impossible de charger la commande ${orderId}: ${error.message}`)
  }

  if (!data) {
    return null
  }

  const [enrichedOrder] = await this.enrichOrders([{ ...(data as any), order_items: (data as any)?.order_items ?? [] }])

    const { data: paymentRequestItems, error: paymentRequestError } = await supabase
      .from('order_payment_request_items')
      .select(
        `
        id,
        payment_request_id,
        order_id,
        order_amount,
        commission_amount,
        net_amount,
        metadata,
        payment_request:order_payment_requests (
          id,
          vendor_id,
          requested_by,
          status,
          amount,
          commission_amount,
          currency,
          notes,
          approved_by,
          approved_at,
          rejected_reason,
          created_at,
          updated_at,
          metadata
        )
      `
      )
      .eq('order_id', orderId)

    if (paymentRequestError) {
      throw new Error(`Impossible de charger les demandes de paiement: ${paymentRequestError.message}`)
    }

    const normalizedPaymentRequestItems = (paymentRequestItems ?? []).map((item) => ({
      ...item,
      payment_request: Array.isArray(item.payment_request)
        ? item.payment_request[0] ?? null
        : item.payment_request ?? null
    })) as Array<OrderPaymentRequestItemRecord & { payment_request: OrderPaymentRequestRecord | null }>

    return mapOrderDetails((enrichedOrder ?? data) as any, normalizedPaymentRequestItems)
  }

  /**
   * Supprime une commande et ses dépendances. Réservé au super-admin (API server-side).
   */
  static async deleteOrderById(orderId: string): Promise<void> {
    const supabase = getSupabaseAdmin()

    // Best-effort cascades (ne bloque pas si certaines tables n'existent pas).
    const safeDelete = async (table: string, filterKey: string) => {
      try {
        const { error } = await supabase.from(table).delete().eq(filterKey, orderId)
        if (error) {
          console.warn(`[OrderRepository] deleteOrderById: delete ${table} failed:`, error)
        }
      } catch (err) {
        console.warn(`[OrderRepository] deleteOrderById: delete ${table} unexpected error:`, err)
      }
    }

    // Supprimer les sous-éléments retours -> order_return_items d'abord.
    try {
      const { data: returns } = await supabase.from('order_returns').select('id').eq('order_id', orderId)
      const returnIds = Array.isArray(returns) ? returns.map((r: any) => r?.id).filter(Boolean) : []
      if (returnIds.length > 0) {
        await supabase.from('order_return_items').delete().in('return_id', returnIds as any)
      }
    } catch (err) {
      console.warn('[OrderRepository] deleteOrderById: cleanup return items failed:', err)
    }

    await safeDelete('order_items', 'order_id')
    await safeDelete('order_payments', 'order_id')
    await safeDelete('order_disputes', 'order_id')
    await safeDelete('order_returns', 'order_id')
    await safeDelete('order_status_history', 'order_id')
    await safeDelete('order_payment_request_items', 'order_id')
    await safeDelete('deliveries', 'order_id')

    const { error: deleteOrderError } = await supabase.from('orders').delete().eq('id', orderId)
    if (deleteOrderError) {
      throw new Error(`Suppression commande échouée: ${deleteOrderError.message}`)
    }
  }

  /**
   * Met à jour les champs principaux de la commande et trace les changements de statut.
   */
  static async updateOrder(
    orderId: string,
    updates: Partial<{
      status: string
      paymentStatus: string
      paymentMethod: string | null
      notes: string | null
      shippingAddress: Json | null
      shippingLat: number | null
      shippingLng: number | null
      billingAddress: Json | null
      deliveryDate: string | null
    }> ,
    context: OrderCreateContext
  ): Promise<OrderDetails> {
    const supabase = getSupabaseAdmin()

    const { data: current, error: currentError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle()

    if (currentError) {
      throw new Error(`Impossible de récupérer la commande ${orderId}: ${currentError.message}`)
    }

    if (!current) {
      throw new Error('Commande introuvable.')
    }

    const payload: Record<string, unknown> = {}

    if (updates.status !== undefined) {
      payload.status = updates.status
    }
    if (updates.paymentStatus !== undefined) {
      payload.payment_status = updates.paymentStatus
    }
    if (updates.paymentMethod !== undefined) {
      payload.payment_method = updates.paymentMethod
    }
    if (updates.notes !== undefined) {
      payload.notes = updates.notes
    }
    if (updates.shippingAddress !== undefined) {
      payload.shipping_address = updates.shippingAddress
    }
    if (updates.shippingLat !== undefined) {
      payload.shipping_lat = updates.shippingLat
    }
    if (updates.shippingLng !== undefined) {
      payload.shipping_lng = updates.shippingLng
    }
    if (updates.billingAddress !== undefined) {
      payload.billing_address = updates.billingAddress
    }
    if (updates.deliveryDate !== undefined) {
      payload.delivery_date = updates.deliveryDate
    }

    if (Object.keys(payload).length > 0) {
      const { error: updateError } = await supabase
        .from('orders')
        .update(payload)
        .eq('id', orderId)

      if (updateError) {
        throw new Error(`Mise à jour de la commande échouée: ${updateError.message}`)
      }

      const statusChanged = updates.status !== undefined && updates.status !== current.status
      const paymentStatusChanged = updates.paymentStatus !== undefined && updates.paymentStatus !== current.payment_status

      if (statusChanged || paymentStatusChanged) {
        await supabase.from('order_status_history').insert({
          order_id: orderId,
          actor_id: context.actorId,
          actor_role: context.actorRole,
          previous_status: current.status,
          new_status: updates.status ?? current.status,
          previous_payment_status: current.payment_status,
          new_payment_status: updates.paymentStatus ?? current.payment_status,
          previous_fulfillment_status: current.delivery_date ? 'delivered' : null,
          new_fulfillment_status: updates.deliveryDate ? 'delivered' : current.delivery_date ? 'delivered' : null,
          comment: 'Mise à jour administrative'
        })
      }

      if (
        paymentStatusChanged &&
        String(updates.paymentStatus || '').toLowerCase() === 'completed' &&
        String(current.payment_status || '').toLowerCase() !== 'completed'
      ) {
        try {
          await this.awardPurchasePointsForOrder(orderId, {
            customerId: (current as any).customer_id,
            vendorId: (current as any).vendor_id,
            totalAmount: Number((current as any).total_amount ?? 0),
            occurredAt: new Date().toISOString(),
            orderNumber: (current as any).order_number ?? null
          })
        } catch (e) {
          console.error('Attribution des points achat échouée (updateOrder, non bloquante):', e)
        }
      }
    }

    const refreshed = await this.getOrderById(orderId)

    if (!refreshed) {
      throw new Error('Commande introuvable après mise à jour.')
    }

    return refreshed
  }

  /**
   * Attribue des points pour un achat (commande) selon la configuration Super Admin.
   * 
   * Règle de déclenchement: paiement de commande au statut 'completed'.
   * 
   * Idempotence: si une transaction (type='earn') avec reference_id = orderId existe déjà,
   * l'attribution est ignorée.
   */
  private static async awardPurchasePointsForOrder(
    orderId: string,
    input: {
      customerId: string | null | undefined
      vendorId?: string | null | undefined
      totalAmount: number
      occurredAt: string
      orderNumber: string | null
    }
  ): Promise<void> {
    const supabase = getSupabaseAdmin()

    const customerId = input.customerId ? String(input.customerId) : ''
    const totalAmount = Number(input.totalAmount)

    if (!customerId) {
      return
    }

    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      return
    }

    const { data: existingTx, error: existingErr } = await supabase
      .from('point_transactions')
      .select('id')
      .eq('user_id', customerId)
      .eq('type', 'earn')
      .eq('reference_id', orderId)
      .limit(1)

    if (existingErr) {
      throw new Error(existingErr.message)
    }

    if ((existingTx ?? []).length > 0) {
      return
    }

    let pointValue = 1
    let basePointsPerFCFA = 1
    let weekendBonusPct = 0
    let premiumVendorBonusPct = 0
    let referralBonusPct = 0
    let bulkBonusPct = 0
    let bulkThreshold = Number.POSITIVE_INFINITY
    let firstPurchaseBonusPoints = 0
    let categoryBonuses: Record<string, number> = {}

    try {
      const { data: settingsRow } = await supabase
        .from('point_settings')
        .select('conversion_rate, metadata')
        .eq('scope', 'global')
        .maybeSingle()

      const numericPointValue = Number((settingsRow as any)?.conversion_rate ?? 1)
      if (Number.isFinite(numericPointValue) && numericPointValue > 0) {
        pointValue = numericPointValue
      }

      const metadata = (((settingsRow as any)?.metadata ?? {}) as Record<string, any>)
      const bonuses = ((metadata?.bonuses ?? {}) as Record<string, any>)

      const nBase = Number(bonuses.basePointsPerFCFA ?? basePointsPerFCFA)
      if (Number.isFinite(nBase) && nBase > 0) {
        basePointsPerFCFA = nBase
      }

      const nWeekend = Number(bonuses.weekendBonus ?? weekendBonusPct)
      if (Number.isFinite(nWeekend) && nWeekend >= 0) {
        weekendBonusPct = nWeekend
      }

      const nPremium = Number(bonuses.premiumVendorBonus ?? premiumVendorBonusPct)
      if (Number.isFinite(nPremium) && nPremium >= 0) {
        premiumVendorBonusPct = nPremium
      }

      const nReferral = Number(bonuses.referralBonus ?? referralBonusPct)
      if (Number.isFinite(nReferral) && nReferral >= 0) {
        referralBonusPct = nReferral
      }

      const nBulk = Number(bonuses.bulkPurchaseBonus ?? bulkBonusPct)
      if (Number.isFinite(nBulk) && nBulk >= 0) {
        bulkBonusPct = nBulk
      }

      const nThreshold = Number(bonuses.bulkPurchaseThreshold ?? bulkThreshold)
      if (Number.isFinite(nThreshold) && nThreshold > 0) {
        bulkThreshold = nThreshold
      }

      const nFirst = Number(bonuses.firstPurchaseBonus ?? firstPurchaseBonusPoints)
      if (Number.isFinite(nFirst) && nFirst >= 0) {
        firstPurchaseBonusPoints = nFirst
      }

      const rawCategoryBonuses = bonuses.categoryBonuses
      if (rawCategoryBonuses && typeof rawCategoryBonuses === 'object') {
        categoryBonuses = rawCategoryBonuses as Record<string, number>
      }
    } catch {
      // Tolère l'absence de configuration ou erreurs: on garde les valeurs par défaut.
    }

    const basePoints = totalAmount * basePointsPerFCFA

    const occurred = new Date(input.occurredAt)
    const utcDay = occurred.getUTCDay()
    const isWeekend = utcDay === 0 || utcDay === 6
    const weekendPoints = isWeekend ? (basePoints * weekendBonusPct) / 100 : 0

    const isBulk = totalAmount >= bulkThreshold
    const bulkPoints = isBulk ? (basePoints * bulkBonusPct) / 100 : 0

    let premiumVendorPoints = 0

    if (premiumVendorBonusPct > 0 && input.vendorId) {
      try {
        const isPremiumVendor = await this.isPremiumVendor(String(input.vendorId))
        premiumVendorPoints = isPremiumVendor ? (basePoints * premiumVendorBonusPct) / 100 : 0
      } catch {
        premiumVendorPoints = 0
      }
    }

    let categoryBonusPoints = 0

    try {
      const { data: items, error: itemsErr } = await supabase
        .from('order_items')
        .select('product_id, total_price')
        .eq('order_id', orderId)

      if (itemsErr) {
        throw itemsErr
      }

      const productIds = Array.from(
        new Set((items ?? []).map((it: any) => (it?.product_id ? String(it.product_id) : '')).filter(Boolean))
      )

      if (productIds.length > 0) {
        const { data: assignments, error: assignErr } = await supabase
          .from('product_category_assignments')
          .select('product_id, category_id, is_primary')
          .in('product_id', productIds)

        if (assignErr) {
          throw assignErr
        }

        const categoriesByProductId = new Map<string, Array<{ categoryId: string; isPrimary: boolean }>>()
        ;(assignments ?? []).forEach((row: any) => {
          const pid = row?.product_id ? String(row.product_id) : ''
          const cid = row?.category_id ? String(row.category_id) : ''
          if (!pid || !cid) return
          const list = categoriesByProductId.get(pid) ?? []
          list.push({ categoryId: cid, isPrimary: Boolean(row?.is_primary) })
          categoriesByProductId.set(pid, list)
        })

        categoryBonusPoints = (items ?? []).reduce((sum: number, it: any) => {
          const pid = it?.product_id ? String(it.product_id) : ''
          const total = Number(it?.total_price ?? 0)
          if (!pid || !Number.isFinite(total) || total <= 0) {
            return sum
          }

          const categories = categoriesByProductId.get(pid)
          if (!categories || categories.length === 0) {
            return sum
          }

          const primaryCategory = categories.find((entry) => entry.isPrimary) ?? categories[0]
          const pct = Number(categoryBonuses?.[primaryCategory.categoryId] ?? 0)
          if (!Number.isFinite(pct) || pct <= 0) {
            return sum
          }

          const itemBase = total * basePointsPerFCFA
          return sum + (itemBase * pct) / 100
        }, 0)
      }
    } catch {
      categoryBonusPoints = 0
    }

    let isFirstPurchase = false

    try {
      const { count, error: countErr } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('customer_id', customerId)
        .eq('payment_status', 'completed')
        .neq('id', orderId)

      if (countErr) {
        throw countErr
      }

      isFirstPurchase = Number(count ?? 0) === 0
    } catch {
      isFirstPurchase = false
    }

    const firstPurchasePoints = isFirstPurchase ? firstPurchaseBonusPoints : 0

    let referralPoints = 0
    if (referralBonusPct > 0 && isFirstPurchase) {
      try {
        const hasReferrer = await this.hasReferralReferrer(customerId)
        referralPoints = hasReferrer ? (basePoints * referralBonusPct) / 100 : 0
      } catch {
        referralPoints = 0
      }
    }

    const totalPointsRaw =
      basePoints +
      weekendPoints +
      premiumVendorPoints +
      referralPoints +
      bulkPoints +
      categoryBonusPoints +
      firstPurchasePoints
    const totalPoints = Math.max(0, Math.round(totalPointsRaw))

    if (totalPoints <= 0) {
      return
    }

    const fcfaValue = Number((totalPoints * pointValue).toFixed(2))

    const { error: upsertErr } = await supabase
      .from('loyalty_points')
      .upsert({ user_id: customerId }, { onConflict: 'user_id' })

    if (upsertErr) {
      throw new Error(upsertErr.message)
    }

    const { data: loyaltyRow, error: loyaltyErr } = await supabase
      .from('loyalty_points')
      .select('points_balance, points_earned, fcfa_value')
      .eq('user_id', customerId)
      .maybeSingle()

    if (loyaltyErr) {
      throw new Error(loyaltyErr.message)
    }

    const currentBalance = Number((loyaltyRow as any)?.points_balance ?? 0)
    const currentEarned = Number((loyaltyRow as any)?.points_earned ?? 0)
    const currentFcfaValue = Number((loyaltyRow as any)?.fcfa_value ?? 0)

    const nextBalance = Math.max(0, currentBalance + totalPoints)
    const nextEarned = Math.max(0, currentEarned + totalPoints)
    const nextFcfaValue = Math.max(0, Number((currentFcfaValue + fcfaValue).toFixed(2)))

    const { error: updateErr } = await supabase
      .from('loyalty_points')
      .update({
        points_balance: nextBalance,
        points_earned: nextEarned,
        fcfa_value: nextFcfaValue
      })
      .eq('user_id', customerId)

    if (updateErr) {
      throw new Error(updateErr.message)
    }

    const orderLabel = input.orderNumber ? `Commande ${input.orderNumber}` : `Commande ${orderId}`

    const { error: txErr } = await supabase
      .from('point_transactions')
      .insert({
        user_id: customerId,
        type: 'earn',
        points: totalPoints,
        fcfa_value: fcfaValue,
        description: `Points gagnés sur achat (${orderLabel})`,
        reference_id: orderId
      })

    if (txErr) {
      throw new Error(txErr.message)
    }
  }

  /** Détermine si un vendeur doit être considéré comme premium pour l'application des bonus. */
  private static async isPremiumVendor(vendorId: string): Promise<boolean> {
    const supabase = getSupabaseAdmin()

    const normalizedVendorId = vendorId ? String(vendorId) : ''
    if (!normalizedVendorId) {
      return false
    }

    let vendorUserId = normalizedVendorId

    try {
      const { data: vendorUserRow, error: vendorUserErr } = await supabase
        .from('users')
        .select('id, account_type')
        .eq('id', normalizedVendorId)
        .maybeSingle()

      if (!vendorUserErr && vendorUserRow?.id) {
        const accountType = String((vendorUserRow as any)?.account_type ?? '').toLowerCase()
        if (accountType.includes('premium')) {
          return true
        }
      }

      if (!vendorUserRow?.id) {
        const { data: vendorProfileRow, error: vendorProfileErr } = await supabase
          .from('user_profiles')
          .select('user_id')
          .eq('id', normalizedVendorId)
          .maybeSingle()

        if (!vendorProfileErr && vendorProfileRow?.user_id) {
          vendorUserId = String(vendorProfileRow.user_id)
        }
      }
    } catch {
      // ignore
    }

    try {
      const { data: featureRows, error: featuresErr } = await supabase
        .from('user_features')
        .select('feature_code, scope, enabled')
        .eq('user_id', vendorUserId)

      if (!featuresErr) {
        const hasPremiumFeature = (featureRows ?? []).some((row: any) => {
          const code = String(row?.feature_code ?? '').toLowerCase()
          const enabled = Boolean(row?.enabled ?? true)
          if (!enabled) return false
          return code.includes('premium')
        })

        if (hasPremiumFeature) {
          return true
        }
      }
    } catch {
      // ignore
    }

    try {
      const { data: roleAssignments, error: roleErr } = await supabase
        .from('user_role_assignments')
        .select('roles(slug)')
        .eq('user_id', vendorUserId)

      if (!roleErr) {
        const hasPremiumRole = (roleAssignments ?? []).some((assignment: any) => {
          const rolesData = Array.isArray(assignment?.roles) ? assignment.roles[0] : assignment?.roles
          const slug = String(rolesData?.slug ?? '').toLowerCase()
          return slug.includes('premium')
        })

        if (hasPremiumRole) {
          return true
        }
      }
    } catch {
      // ignore
    }

    return false
  }

  /** Détermine si l'utilisateur a un parrain (via user_profiles.preferences) pour appliquer le bonus parrainage. */
  private static async hasReferralReferrer(userId: string): Promise<boolean> {
    const supabase = getSupabaseAdmin()

    const normalizedUserId = userId ? String(userId) : ''
    if (!normalizedUserId) {
      return false
    }

    try {
      const { data: profileRow, error } = await supabase
        .from('user_profiles')
        .select('preferences')
        .eq('user_id', normalizedUserId)
        .maybeSingle()

      if (error) {
        return false
      }

      const prefs = (profileRow as any)?.preferences
      if (!prefs || typeof prefs !== 'object') {
        return false
      }

      const candidates = [
        (prefs as any).referrer_id,
        (prefs as any).referrerId,
        (prefs as any).referred_by,
        (prefs as any).referredBy,
        (prefs as any).sponsor_id,
        (prefs as any).sponsorId,
        (prefs as any).invited_by,
        (prefs as any).invitedBy,
        (prefs as any).referral_source,
        (prefs as any).referralSource
      ]

      return candidates.some((value) => typeof value === 'string' && value.trim().length > 0)
    } catch {
      return false
    }
  }

  /**
   * Crée une demande de retour pour une commande (avec lignes) et actualise l'historique.
   */
  static async createReturn(
    orderId: string,
    payload: OrderReturnPayload,
    context: OrderCreateContext
  ): Promise<OrderDetails> {
    const supabase = getSupabaseAdmin()

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, customer_id, vendor_id, status, payment_status, currency')
      .eq('id', orderId)
      .maybeSingle()

    if (orderError) {
      throw new Error(`Impossible de récupérer la commande ${orderId}: ${orderError.message}`)
    }

    if (!order) {
      throw new Error('Commande introuvable.')
    }

    const { data: createdReturn, error: insertReturnError } = await supabase
      .from('order_returns')
      .insert({
        order_id: orderId,
        customer_id: order.customer_id,
        vendor_id: order.vendor_id,
        status: payload.status ?? 'pending',
        reason: payload.reason ?? null,
        resolution: payload.resolution ?? null,
        refund_amount: payload.refundAmount ?? null,
        refund_currency: payload.refundCurrency ?? order.currency ?? 'XOF',
        requested_at: new Date().toISOString(),
        processed_at: payload.processedAt ?? null,
        metadata: payload.metadata ?? {}
      })
      .select('id')
      .single()

    if (insertReturnError || !createdReturn) {
      throw new Error(`Création du retour échouée: ${insertReturnError?.message ?? 'erreur inconnue'}`)
    }

    if (payload.items && payload.items.length > 0) {
      const itemsToInsert = payload.items.map((item) => ({
        return_id: createdReturn.id,
        order_item_id: item.orderItemId,
        quantity: item.quantity,
        condition: item.condition ?? null,
        refund_amount: item.refundAmount ?? null,
        metadata: item.metadata ?? {}
      }))

      const { error: insertItemsError } = await supabase
        .from('order_return_items')
        .insert(itemsToInsert)

      if (insertItemsError) {
        throw new Error(`Création des lignes de retour échouée: ${insertItemsError.message}`)
      }
    }

    const nextStatus = payload.status ?? 'returned'

    if (order.status !== nextStatus) {
      const { error: updateOrderStatusError } = await supabase
        .from('orders')
        .update({ status: nextStatus })
        .eq('id', orderId)

      if (updateOrderStatusError) {
        throw new Error(`Mise à jour du statut commande échouée: ${updateOrderStatusError.message}`)
      }
    }

    await supabase.from('order_status_history').insert({
      order_id: orderId,
      actor_id: context.actorId,
      actor_role: context.actorRole,
      previous_status: order.status,
      new_status: nextStatus,
      previous_payment_status: order.payment_status,
      new_payment_status: order.payment_status,
      previous_fulfillment_status: null,
      new_fulfillment_status: null,
      comment: payload.reason ? `Retour initié: ${payload.reason}` : 'Retour initié'
    })

    // Synchronisation Finance: enregistre un dossier de remboursement dans la table finance_refunds
    try {
      const amountFromItems = Array.isArray(payload.items)
        ? payload.items.reduce((sum, it) => sum + Number(it.refundAmount || 0), 0)
        : 0
      const refundAmount = Number(payload.refundAmount ?? amountFromItems ?? 0)

      await supabase.from('finance_refunds').insert({
        order_id: orderId,
        vendor_id: order.vendor_id ?? null,
        vendor_name: null,
        customer_email: null,
        amount: refundAmount,
        commission_adjustment: 0,
        status: payload.status ?? 'requested',
        opened_at: new Date().toISOString(),
        updated_at: null,
        reason: payload.reason ?? null,
        resolution_notes: payload.resolution ?? null
      })
    } catch (e) {
      // Ne pas bloquer le flux commande en cas d'échec Finance; simple log serveur
      console.error('Synchronisation Finance (refund) échouée:', e)
    }

    const refreshed = await this.getOrderById(orderId)

    if (!refreshed) {
      throw new Error('Commande introuvable après création du retour.')
    }

    return refreshed
  }

  /**
   * Enregistre un paiement pour une commande et synchronise le statut de paiement.
   */
  static async createPayment(
    orderId: string,
    payload: OrderPaymentPayload,
    context: OrderCreateContext
  ): Promise<OrderDetails> {
    const supabase = getSupabaseAdmin()

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, status, payment_status, currency, vendor_id, customer_id, total_amount, final_total, order_number')
      .eq('id', orderId)
      .maybeSingle()

    if (orderError) {
      throw new Error(`Impossible de récupérer la commande ${orderId}: ${orderError.message}`)
    }

    if (!order) {
      throw new Error('Commande introuvable.')
    }

    const paymentStatus = payload.status ?? 'completed'

    const paidAt = payload.paidAt ?? (paymentStatus === 'completed' ? new Date().toISOString() : null)

    // Idempotence / anti-doublon:
    // - si une référence provider est fournie, elle doit être unique par commande
    // - sinon, on évite de recréer un paiement "completed" si la commande est déjà au statut completed
    const reference = typeof payload.reference === 'string' && payload.reference.trim().length > 0 ? payload.reference.trim() : null
    let existingPaymentId: string | null = null

    if (reference) {
      const { data: existingByRef } = await supabase
        .from('order_payments')
        .select('id')
        .eq('order_id', orderId)
        .eq('reference', reference)
        .limit(1)
        .maybeSingle()

      if (existingByRef?.id) {
        existingPaymentId = String((existingByRef as any).id)
      }
    }

    if (!existingPaymentId && String(paymentStatus).toLowerCase() === 'completed' && String(order.payment_status || '').toLowerCase() === 'completed') {
      const { data: existingCompleted } = await supabase
        .from('order_payments')
        .select('id')
        .eq('order_id', orderId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (existingCompleted?.id) {
        existingPaymentId = String((existingCompleted as any).id)
      }
    }

    if (existingPaymentId) {
      const refreshed = await this.getOrderById(orderId)
      if (!refreshed) throw new Error('Commande introuvable après création du paiement.')
      return refreshed
    }

    const { error: insertPaymentError } = await supabase.from('order_payments').insert({
      order_id: orderId,
      provider: payload.provider,
      reference,
      amount: payload.amount,
      currency: payload.currency ?? order.currency ?? 'XOF',
      status: paymentStatus,
      paid_at: paidAt,
      metadata: payload.metadata ?? {}
    })

    if (insertPaymentError) {
      throw new Error(`Création du paiement échouée: ${insertPaymentError.message}`)
    }

    if (order.payment_status !== paymentStatus) {
      const { error: updateOrderError } = await supabase
        .from('orders')
        .update({ payment_status: paymentStatus })
        .eq('id', orderId)

      if (updateOrderError) {
        throw new Error(`Mise à jour du statut de paiement échouée: ${updateOrderError.message}`)
      }
    }

    await supabase.from('order_status_history').insert({
      order_id: orderId,
      actor_id: context.actorId,
      actor_role: context.actorRole,
      previous_status: order.status,
      new_status: order.status,
      previous_payment_status: order.payment_status,
      new_payment_status: paymentStatus,
      previous_fulfillment_status: null,
      new_fulfillment_status: null,
      comment: 'Paiement enregistré'
    })

    if (paymentStatus === 'completed' && order.payment_status !== 'completed') {
      try {
        await this.awardPurchasePointsForOrder(orderId, {
          customerId: (order as any).customer_id,
          vendorId: (order as any).vendor_id,
          totalAmount: Number((order as any).total_amount ?? payload.amount ?? 0),
          occurredAt: paidAt ?? new Date().toISOString(),
          orderNumber: (order as any).order_number ?? null
        })
      } catch (e) {
        console.error('Attribution des points achat échouée (non bloquante):', e)
      }
    }

    // Synchronisation Finance: enregistre une transaction de vente et un flux de trésorerie entrant
    try {
      const occurredAt = paidAt ?? new Date().toISOString()
      const gross = Number((order as any)?.final_total ?? (order as any)?.total_amount ?? payload.amount ?? 0) || 0
      const vendorId = typeof (order as any)?.vendor_id === 'string' && (order as any).vendor_id.trim().length > 0
        ? String((order as any).vendor_id)
        : null
      const rule = vendorId ? await fetchApplicableCommissionRule({ supabase, vendorId }) : null
      const commission = computeCommissionAmount({ totalAmount: gross, rule })
      const net = Math.max(0, gross - commission)

      const status =
        paymentStatus === 'completed' ? 'paid' : paymentStatus === 'processing' ? 'processing' : 'pending'

      const { data: existingFinanceTx } = await supabase
        .from('finance_transactions')
        .select('id')
        .eq('order_id', orderId)
        .limit(1)
        .maybeSingle()

      // Transaction de vente
      if (existingFinanceTx?.id) {
        await supabase
          .from('finance_transactions')
          .update({
            vendor_id: (order as any).vendor_id ?? null,
            gross_amount: gross,
            commission_taken: commission,
            net_amount: net,
            status,
            occurred_at: occurredAt
          })
          .eq('id', existingFinanceTx.id)
      } else {
        await supabase.from('finance_transactions').insert({
          order_id: orderId,
          vendor_id: (order as any).vendor_id ?? null,
          vendor_name: null,
          gross_amount: gross,
          commission_taken: commission,
          net_amount: net,
          status,
          occurred_at: occurredAt
        })
      }

      const cashFlowLabel = `Commande #${orderId}`
      const { data: existingCashFlow } = await supabase
        .from('finance_cash_flow')
        .select('id')
        .eq('direction', 'in')
        .eq('category', 'customer')
        .eq('label', cashFlowLabel)
        .limit(1)
        .maybeSingle()

      // Flux de trésorerie entrant (client)
      if (existingCashFlow?.id) {
        await supabase
          .from('finance_cash_flow')
          .update({
            amount: gross,
            occurred_at: occurredAt
          })
          .eq('id', existingCashFlow.id)
      } else {
        await supabase.from('finance_cash_flow').insert({
          direction: 'in',
          category: 'customer',
          label: cashFlowLabel,
          amount: gross,
          occurred_at: occurredAt
        })
      }
    } catch (e) {
      // Ne pas bloquer le flux commande en cas d'échec Finance; simple log serveur
      console.error('Synchronisation Finance (payment) échouée:', e)
    }

    const refreshed = await this.getOrderById(orderId)

    if (!refreshed) {
      throw new Error('Commande introuvable après création du paiement.')
    }

    return refreshed
  }

  /**
   * Ouvre un litige sur une commande et l'enregistre dans l'historique.
   */
  static async createDispute(
    orderId: string,
    payload: OrderDisputePayload,
    context: OrderCreateContext
  ): Promise<OrderDetails> {
    const supabase = getSupabaseAdmin()

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, status, payment_status')
      .eq('id', orderId)
      .maybeSingle()

    if (orderError) {
      throw new Error(`Impossible de récupérer la commande ${orderId}: ${orderError.message}`)
    }

    if (!order) {
      throw new Error('Commande introuvable.')
    }

    const { error: insertDisputeError } = await supabase.from('order_disputes').insert({
      order_id: orderId,
      opened_by: context.actorId,
      assigned_to: payload.assignedTo ?? null,
      type: payload.type,
      status: payload.status ?? 'open',
      priority: payload.priority ?? 'normal',
      subject: payload.subject ?? null,
      description: payload.description ?? null,
      resolution: payload.resolution ?? null,
      opened_at: new Date().toISOString(),
      closed_at: payload.closedAt ?? null,
      metadata: payload.metadata ?? {}
    })

    if (insertDisputeError) {
      throw new Error(`Création du litige échouée: ${insertDisputeError.message}`)
    }

    await supabase.from('order_status_history').insert({
      order_id: orderId,
      actor_id: context.actorId,
      actor_role: context.actorRole,
      previous_status: order.status,
      new_status: order.status,
      previous_payment_status: order.payment_status,
      new_payment_status: order.payment_status,
      previous_fulfillment_status: null,
      new_fulfillment_status: null,
      comment: payload.subject ? `Litige: ${payload.subject}` : 'Litige ouvert'
    })

    const refreshed = await this.getOrderById(orderId)

    if (!refreshed) {
      throw new Error('Commande introuvable après création du litige.')
    }

    return refreshed
  }
}
