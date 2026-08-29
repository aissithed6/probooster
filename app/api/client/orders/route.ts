'use server'

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertCustomer, isClientAuthError } from '../_helpers/auth'
import { getSupabaseAdmin } from '../../../../lib/supabase'
import { OrderRepository } from '../../../../lib/repositories/order-repository'
import { computeDeliveryPriceFromRule, selectBestDeliveryRule, type DeliveryRule } from '@/lib/utils/delivery-rule-matcher'
import { recordAutomationEvent } from '@/lib/automation-events'

type IncomingOrderItem = {
  productId: string
  quantity: number
  unitPrice?: number
  originalUnitPrice?: number
  appliedOffer?:
    | {
        source?: 'classic' | 'special'
        promotionId?: string | null
      }
    | null
}

type IncomingCreateOrderPayload = {
  items: IncomingOrderItem[]
  shareRefByProductId?: Record<string, string> | null
  currency?: string | null
  paymentMethod?: string | null
  paymentStatus?: string | null
  paymentOption?: string | null
  status?: string | null
  delivery?: {
    zone?: string | null
    method?: string | null
    aggregation?: string | null
    geoLocalDistrict?: string | null
    geoDepartment?: string | null
    geoCity?: string | null
    geoArrondissement?: string | null
    geoDistrict?: string | null
    geoCountry?: string | null
    geoRegionDepartment?: string | null
  } | null
  deliveryOption?: string | null
  shippingAddress?: any
  shippingLat?: number | null
  shippingLng?: number | null
  billingAddress?: any
  pointsUsed?: number | null
  pointsDiscount?: number | null
  finalTotal?: number | null
  notes?: string | null
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * Enregistre une interaction purchase pour un produit si une ref de partage existe.
 */
async function recordPurchaseInteraction(params: {
  supabase: ReturnType<typeof getSupabaseAdmin>
  productId: string
  refUserId: string
  buyerUserId: string
  request: NextRequest
}) {
  const { supabase, productId, refUserId, buyerUserId, request } = params

  if (!UUID_REGEX.test(productId) || !UUID_REGEX.test(refUserId) || !UUID_REGEX.test(buyerUserId)) return
  if (buyerUserId === refUserId) return

  try {
    const { data: shareRow } = await supabase
      .from('product_shares')
      .select('id')
      .eq('product_id', productId)
      .eq('user_id', refUserId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!shareRow?.id) return

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
    const userAgent = request.headers.get('user-agent') ?? null
    const referrer = request.headers.get('referer') ?? null

    await supabase
      .from('share_interactions')
      .insert({
        share_id: shareRow.id,
        interaction_type: 'purchase',
        user_id: buyerUserId,
        ip_address: ip,
        user_agent: userAgent,
        referrer
      } as any)
  } catch {
    // best-effort
  }
}

/**
 * Normalise un nombre (unit price / montants) sans propager NaN.
 */
function toNumber(value: unknown, fallback = 0): number {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : fallback
}

/**
 * Détermine si une commande nécessite des coordonnées de livraison.
 * Règle: si au moins un produit n'est PAS virtuel et PAS téléchargeable, alors livraison physique.
 */
function requiresShippingCoordinates(products: Array<{ is_virtual?: boolean | null; is_downloadable?: boolean | null }>): boolean {
  return (products ?? []).some((p) => !Boolean(p?.is_virtual) && !Boolean(p?.is_downloadable))
}

/**
 * Normalise une coordonnée (lat/lng) de façon sûre.
 */
function toOptionalCoordinate(value: unknown): number | null {
  if (value === null || value === undefined) return null
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : null
}

/**
 * Normalise une chaîne de façon sûre.
 */
function toTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function isPhysicalFromFlags(flags: { isVirtual?: boolean; isDownloadable?: boolean } | null | undefined): boolean {
  const isVirtual = Boolean(flags?.isVirtual)
  const isDownloadable = Boolean(flags?.isDownloadable)
  return !isVirtual && !isDownloadable
}

function isNoDeliveryOption(value: unknown): boolean {
  const v = typeof value === 'string' ? value.trim().toLowerCase() : ''
  if (!v) return false
  return v === 'none' || v === 'no_delivery' || v === 'no-delivery' || v === 'no delivery' || v === 'sans_livraison' || v === 'sans livraison'
}

/**
 * Charge la config livraison (super-admin) depuis super_admin_settings scope=global.
 */
async function fetchDeliveryConfig(supabase: ReturnType<typeof getSupabaseAdmin>) {
  const { data, error } = await supabase
    .from('super_admin_settings')
    .select('settings')
    .eq('scope', 'global')
    .maybeSingle()

  if (error) {
    console.warn('⚠️ fetchDeliveryConfig failed:', error)
    return {
      deliveryRules: [] as any[],
      freeShippingConfig: { enabled: false, rules: [] as any[] },
      shippingCostAggregationDefault: 'max' as 'max' | 'sum',
      allowCustomerShippingAggregationOverride: false
    }
  }

  const settings = (data as any)?.settings ?? {}
  const deliveryConfig = (settings as any)?.deliveryConfig ?? {}

  const rulesSource = (settings as any)?.deliveryRules ?? (deliveryConfig as any)?.deliveryRules
  const freeShippingSource = (settings as any)?.freeShippingConfig ?? (deliveryConfig as any)?.freeShippingConfig

  return {
    deliveryRules: Array.isArray(rulesSource) ? (rulesSource as any[]) : [],
    freeShippingConfig:
      freeShippingSource && typeof freeShippingSource === 'object'
        ? (freeShippingSource as any)
        : { enabled: false, rules: [] },
    shippingCostAggregationDefault: deliveryConfig?.shippingCostAggregationDefault === 'sum' ? ('sum' as const) : ('max' as const),
    allowCustomerShippingAggregationOverride: deliveryConfig?.allowCustomerShippingAggregationOverride === true
  }
}

/**
 * Fallback: récupère les préférences checkout depuis delivery_preferences.metadata.checkout.
 */
async function fetchCheckoutPreferences(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  customerId: string
): Promise<Record<string, any> | null> {
  const { data, error } = await supabase
    .from('delivery_preferences')
    .select('metadata')
    .eq('customer_id', customerId)
    .maybeSingle()

  if (error) {
    console.warn('⚠️ fetchCheckoutPreferences failed:', error)
    return null
  }

  const metadata = (data as any)?.metadata
  const checkout = metadata && typeof metadata === 'object' ? (metadata as any)?.checkout : null
  return checkout && typeof checkout === 'object' ? (checkout as Record<string, any>) : null
}

/**
 * Applique les règles de livraison gratuite super-admin (standard uniquement), à la manière du panier.
 */
function resolveFreeShippingProductIds(params: {
  freeShippingConfig: any
  shippingRows: Array<{ productId: string; vendorId: string | null; categoryIds: string[] }>
  cartItems: Array<{ productId: string; quantity: number; unitPrice: number }>
  zone: string
  geo: Record<string, string>
  isStandardMode: boolean
}): Set<string> {
  if (!params.isStandardMode) return new Set()
  if (!params.freeShippingConfig?.enabled) return new Set()

  const rules = Array.isArray(params.freeShippingConfig?.rules) ? params.freeShippingConfig.rules : []
  if (rules.length === 0) return new Set()

  const cartSubtotalXof = params.cartItems.reduce((acc, item) => acc + Math.max(0, item.unitPrice) * Math.max(0, item.quantity), 0)
  const cartQuantity = params.cartItems.reduce((acc, item) => acc + Math.max(0, item.quantity), 0)

  const intersects = (a: string[], b: string[]): boolean => {
    if (a.length === 0 || b.length === 0) return false
    const setB = new Set(b)
    return a.some((x) => setB.has(x))
  }

  const zoneMatches = (rule: any): boolean => {
    const ruleZone = typeof rule?.zone === 'string' ? rule.zone : '*'
    if (ruleZone === '*' || !ruleZone) return true
    if (ruleZone !== params.zone) return false

    if (ruleZone === 'local') {
      const target = (params.geo.localDistrict ?? '').toLowerCase()
      const expected = typeof rule?.localDistrict === 'string' ? rule.localDistrict.toLowerCase() : '*'
      if (expected && expected !== '*') return target === expected
      return true
    }

    if (ruleZone === 'national') {
      const deptOk = !rule.department || rule.department === '*' || (params.geo.department ?? '').toLowerCase() === String(rule.department).toLowerCase()
      const cityOk = !rule.city || rule.city === '*' || (params.geo.city ?? '').toLowerCase() === String(rule.city).toLowerCase()
      const arrOk = !rule.arrondissement || rule.arrondissement === '*' || (params.geo.arrondissement ?? '').toLowerCase() === String(rule.arrondissement).toLowerCase()
      const distOk = !rule.district || rule.district === '*' || (params.geo.district ?? '').toLowerCase() === String(rule.district).toLowerCase()
      return deptOk && cityOk && arrOk && distOk
    }

    return true
  }

  const sorted = rules
    .filter((r: any) => {
      if (!r) return false
      const isActive = (r as any)?.isActive ?? (r as any)?.is_active ?? (r as any)?.active
      return isActive !== false
    })
    .slice()
    .sort((a: any, b: any) => (Number(a.priority ?? 100) || 100) - (Number(b.priority ?? 100) || 100))

  const allProductIds = params.shippingRows.map((r) => r.productId)

  for (const rule of sorted) {
    if (!zoneMatches(rule)) continue

    const ruleProductIdsRaw =
      (rule as any)?.productIds ?? (rule as any)?.product_ids ?? (rule as any)?.products ?? (rule as any)?.product_ids_list
    const ruleVendorIdsRaw = (rule as any)?.vendorIds ?? (rule as any)?.vendor_ids ?? (rule as any)?.vendors
    const ruleCategoryIdsRaw = (rule as any)?.categoryIds ?? (rule as any)?.category_ids ?? (rule as any)?.categories

    const ruleProductIds = Array.isArray(ruleProductIdsRaw) ? ruleProductIdsRaw.map(String).filter(Boolean) : []
    const ruleVendorIds = Array.isArray(ruleVendorIdsRaw) ? ruleVendorIdsRaw.map(String).filter(Boolean) : []
    const ruleCategoryIds = Array.isArray(ruleCategoryIdsRaw) ? ruleCategoryIdsRaw.map(String).filter(Boolean) : []

    const hasProductFilter = ruleProductIds.length > 0
    const hasVendorFilter = ruleVendorIds.length > 0
    const hasCategoryFilter = ruleCategoryIds.length > 0
    const hasAnyTarget = hasProductFilter || hasVendorFilter || hasCategoryFilter

    const eligibleRows = params.shippingRows.filter((row) => {
      if (hasProductFilter && !ruleProductIds.includes(String(row.productId))) return false
      if (hasVendorFilter && !ruleVendorIds.includes(String(row.vendorId ?? ''))) return false
      if (hasCategoryFilter && !intersects(ruleCategoryIds, row.categoryIds)) return false
      return true
    })

    if (hasAnyTarget && eligibleRows.length === 0) continue

    const eligibleProductIds = (hasAnyTarget ? eligibleRows : params.shippingRows).map((r) => r.productId)
    if (eligibleProductIds.length === 0) continue

    const eligibleIdSet = new Set(eligibleProductIds)

    const eligibleSubtotalXof = params.cartItems.reduce((acc, item) => {
      if (!eligibleIdSet.has(item.productId)) return acc
      return acc + Math.max(0, item.unitPrice) * Math.max(0, item.quantity)
    }, 0)

    const eligibleQty = params.cartItems.reduce((acc, item) => {
      if (!eligibleIdSet.has(item.productId)) return acc
      return acc + Math.max(0, item.quantity)
    }, 0)

    const scope = rule?.scope === 'cart_total' ? 'cart_total' : 'eligible_items'
    const scopeSubtotal = scope === 'cart_total' ? cartSubtotalXof : eligibleSubtotalXof
    const scopeQty = scope === 'cart_total' ? cartQuantity : eligibleQty

    const minSubtotal = (rule as any)?.minEligibleSubtotalXof ?? (rule as any)?.min_eligible_subtotal_xof
    if (typeof minSubtotal === 'number' && Number.isFinite(minSubtotal) && scopeSubtotal < minSubtotal) continue

    const minQty = (rule as any)?.minEligibleQty ?? (rule as any)?.min_eligible_qty
    if (typeof minQty === 'number' && Number.isFinite(minQty) && scopeQty < minQty) continue

    const shouldApplyToAll = scope === 'cart_total' && !hasAnyTarget
    return new Set<string>(shouldApplyToAll ? allProductIds : eligibleProductIds)
  }

  return new Set()
}

/**
 * Récupère la liste des commandes du client connecté avec les retours et litiges associés.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await assertCustomer(request)
    const supabase = getSupabaseAdmin()

    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(
        `
          *,
          order_items (*),
          order_returns (*, order_return_items (*)),
          order_disputes (*)
        `
      )
      .eq('customer_id', userId)
      .order('created_at', { ascending: false })
      .limit(200)

    if (ordersError) {
      console.error('❌ Erreur lors de la récupération des commandes client:', ordersError)
      return NextResponse.json({ error: 'Erreur lors de la récupération des commandes.' }, { status: 500 })
    }

    const normalized = (orders ?? []).map((order: any) => ({
      ...order,
      order_returns: (order.order_returns ?? []).map((returnRecord: any) => ({
        ...returnRecord,
        order_return_items: returnRecord.order_return_items ?? []
      })),
      order_disputes: order.order_disputes ?? []
    }))

    const enriched = await OrderRepository['enrichOrders'](normalized as any).catch(() => normalized)

    return NextResponse.json({ data: enriched })
  } catch (error) {
    if (isClientAuthError(error)) {
      return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 })
    }

    console.error('❌ Erreur inattendue lors de la récupération des commandes client:', error)
    return NextResponse.json({ error: 'Erreur inattendue.' }, { status: 500 })
  }
}

/**
 * Crée une commande (ou plusieurs, si panier multi-vendeurs) et enregistre l'utilisation des promotions.
 * - L'enregistrement dans promotion_usage est fait uniquement pour les promotions classiques (source = classic).
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await assertCustomer(request)
    const supabase = getSupabaseAdmin()
    const payload = (await request.json().catch(() => null)) as IncomingCreateOrderPayload | null

    if (!payload || !Array.isArray(payload.items) || payload.items.length === 0) {
      return NextResponse.json({ error: 'Les articles de commande sont requis.' }, { status: 400 })
    }

    const normalizedItems = payload.items
      .map((item) => {
        const productId = typeof item?.productId === 'string' ? item.productId.trim() : ''
        const quantity = Math.max(1, Math.floor(toNumber(item?.quantity, 1)))
        const unitPrice = toNumber(item?.unitPrice, 0)
        const originalUnitPrice = toNumber(item?.originalUnitPrice, unitPrice)
        const appliedOffer = item?.appliedOffer ?? null
        return {
          productId,
          quantity,
          unitPrice,
          originalUnitPrice,
          appliedOffer
        }
      })
      .filter((item) => item.productId.length > 0)

    if (normalizedItems.length === 0) {
      return NextResponse.json({ error: 'Aucun article valide fourni.' }, { status: 400 })
    }

    const invalidIds = normalizedItems.filter((item) => !UUID_REGEX.test(item.productId))
    if (invalidIds.length > 0) {
      return NextResponse.json({ error: 'Un ou plusieurs identifiants produit sont invalides.' }, { status: 400 })
    }

    const paymentMethodNormalized = String(payload.paymentMethod ?? '')
      .trim()
      .toLowerCase()
      .replace(/_/g, '-')
      .replace(/\s+/g, '-')

    const isCashPayment = paymentMethodNormalized === 'cash' || paymentMethodNormalized === 'especes' || paymentMethodNormalized === 'espèces'
    const isAutoPaidPayment =
      paymentMethodNormalized === 'card' ||
      paymentMethodNormalized === 'points' ||
      paymentMethodNormalized === 'mixed' ||
      paymentMethodNormalized === 'mobile-money' ||
      paymentMethodNormalized === 'mobilemoney' ||
      paymentMethodNormalized === 'mobile_money'

    const effectivePaymentStatus = payload.paymentStatus ?? (isCashPayment ? 'pending' : isAutoPaidPayment ? 'paid' : 'pending')

    const productIds = Array.from(new Set(normalizedItems.map((i) => i.productId)))

    const shareRefByProductIdRaw = payload?.shareRefByProductId
    const shareRefByProductId: Record<string, string> =
      shareRefByProductIdRaw && typeof shareRefByProductIdRaw === 'object' && !Array.isArray(shareRefByProductIdRaw)
        ? (shareRefByProductIdRaw as any)
        : {}
    const { data: products, error: productsError } = await supabase
      .from('user_products')
      .select('id, vendor_id, price, is_virtual, is_downloadable, stock_quantity, manage_stock, allow_backorders')
      .in('id', productIds)
      .neq('product_status', 'archived')

    if (productsError) {
      console.error('❌ POST /api/client/orders: user_products query failed:', productsError)
      return NextResponse.json({ error: 'Impossible de valider les produits.' }, { status: 500 })
    }

    const vendorByProductId = new Map<string, string>()
    const priceByProductId = new Map<string, number>()
    const productFlagsByProductId = new Map<string, { isVirtual: boolean; isDownloadable: boolean }>()
    const stockByProductId = new Map<
      string,
      { manageStock: boolean; allowBackorders: boolean; stockQuantity: number | null }
    >()

    for (const row of products ?? []) {
      const pid = (row as any)?.id
      const vendorId = (row as any)?.vendor_id
      if (typeof pid === 'string' && typeof vendorId === 'string' && pid && vendorId) {
        vendorByProductId.set(pid, vendorId)
      }
      if (typeof pid === 'string' && pid) {
        priceByProductId.set(pid, toNumber((row as any)?.price, 0))
        productFlagsByProductId.set(pid, {
          isVirtual: Boolean((row as any)?.is_virtual),
          isDownloadable: Boolean((row as any)?.is_downloadable)
        })

        const manageStock = Boolean((row as any)?.manage_stock)
        const allowBackorders = Boolean((row as any)?.allow_backorders)
        const rawStock = (row as any)?.stock_quantity
        const stockQuantity = rawStock === null || rawStock === undefined ? null : Number(rawStock)
        stockByProductId.set(pid, {
          manageStock,
          allowBackorders,
          stockQuantity: Number.isFinite(stockQuantity) ? stockQuantity : null
        })
      }
    }

    // Validation stock (avant création commande)
    const stockProblems = normalizedItems
      .map((item) => {
        const stock = stockByProductId.get(item.productId)
        if (!stock) return null

        if (!stock.manageStock) return null
        if (stock.allowBackorders) return null
        if (stock.stockQuantity === null) return null

        if (item.quantity > stock.stockQuantity) {
          return {
            productId: item.productId,
            requested: item.quantity,
            available: stock.stockQuantity
          }
        }
        return null
      })
      .filter(Boolean) as Array<{ productId: string; requested: number; available: number }>

    if (stockProblems.length > 0) {
      return NextResponse.json(
        {
          error: 'Stock insuffisant pour un ou plusieurs produits.',
          details: stockProblems
        },
        { status: 409 }
      )
    }

    const legacyShipping = payload?.shippingAddress && typeof payload.shippingAddress === 'object' ? (payload.shippingAddress as any) : null
    const resolvedPaymentOption = toTrimmedString((payload as any)?.paymentOption) || toTrimmedString(legacyShipping?.payment_option) || null
    const resolvedDeliveryOption = toTrimmedString((payload as any)?.deliveryOption) || toTrimmedString(legacyShipping?.delivery_option) || null
    const noDeliveryRequested = isNoDeliveryOption(resolvedDeliveryOption)

    const requiresCoords = normalizedItems.some((item) => {
      const flags = productFlagsByProductId.get(item.productId)
      return isPhysicalFromFlags(flags)
    })

    const shippingLat = toOptionalCoordinate((payload as any)?.shippingLat ?? payload?.shippingAddress?.lat ?? payload?.shippingAddress?.latitude)
    const shippingLng = toOptionalCoordinate((payload as any)?.shippingLng ?? payload?.shippingAddress?.lng ?? payload?.shippingAddress?.longitude)

    if (!noDeliveryRequested && requiresCoords && (shippingLat === null || shippingLng === null)) {
      return NextResponse.json(
        {
          error:
            "Coordonnées GPS requises pour la livraison (produit physique). Activez la localisation ou saisissez latitude/longitude manuellement."
        },
        { status: 400 }
      )
    }

    const missing = productIds.filter((pid) => !vendorByProductId.has(pid))
    if (missing.length > 0) {
      return NextResponse.json({ error: 'Certains produits sont introuvables ou inaccessibles.' }, { status: 400 })
    }

    // Normaliser les vendor_id si certains produits référencent user_profiles.id au lieu de users.id.
    // Objectif: garantir que orders.vendor_id / deliveries.vendor_id utilisent l'id du user vendeur.
    const rawVendorIds = Array.from(new Set(Array.from(vendorByProductId.values())))
    if (rawVendorIds.length > 0) {
      try {
        const { data: profileRows, error: profileErr } = await supabase
          .from('user_profiles')
          .select('id, user_id')
          .in('id', rawVendorIds)

        if (profileErr) {
          console.warn('⚠️ POST /api/client/orders: user_profiles normalization failed:', profileErr)
        } else {
          const userIdByProfileId = new Map<string, string>(
            (profileRows ?? [])
              .filter((r: any) => typeof r?.id === 'string' && typeof r?.user_id === 'string')
              .map((r: any) => [r.id as string, r.user_id as string])
          )

          if (userIdByProfileId.size > 0) {
            for (const [pid, vid] of vendorByProductId.entries()) {
              const normalized = userIdByProfileId.get(vid)
              if (typeof normalized === 'string' && normalized.length > 0) {
                vendorByProductId.set(pid, normalized)
              }
            }
          }
        }
      } catch (err) {
        console.warn('⚠️ POST /api/client/orders: vendorId normalization unexpected error:', err)
      }
    }

    const itemsByVendor = new Map<string, typeof normalizedItems>()
    for (const item of normalizedItems) {
      const vendorId = vendorByProductId.get(item.productId)
      if (!vendorId) continue
      const list = itemsByVendor.get(vendorId) ?? []
      list.push(item)
      itemsByVendor.set(vendorId, list)
    }

    const ordersCreated: any[] = []

    const deliveryConfig = await fetchDeliveryConfig(supabase)
    const checkoutFallback = await fetchCheckoutPreferences(supabase, userId)

    const incomingDelivery = (payload as any)?.delivery && typeof (payload as any).delivery === 'object' ? ((payload as any).delivery as any) : null

    const resolvedZone = toTrimmedString(incomingDelivery?.zone) || toTrimmedString(checkoutFallback?.zone) || 'local'
    const resolvedMethod = toTrimmedString(incomingDelivery?.method) || toTrimmedString(checkoutFallback?.method) || 'standard'
    const resolvedAggregationRaw = toTrimmedString(incomingDelivery?.aggregation) || toTrimmedString(checkoutFallback?.aggregation)
    const resolvedAggregation =
      deliveryConfig.allowCustomerShippingAggregationOverride && (resolvedAggregationRaw === 'sum' || resolvedAggregationRaw === 'max')
        ? resolvedAggregationRaw
        : deliveryConfig.shippingCostAggregationDefault

    const resolvedGeo = {
      localDistrict: toTrimmedString(incomingDelivery?.geoLocalDistrict) || toTrimmedString(checkoutFallback?.geoLocalDistrict),
      department: toTrimmedString(incomingDelivery?.geoDepartment) || toTrimmedString(checkoutFallback?.geoDepartment),
      city: toTrimmedString(incomingDelivery?.geoCity) || toTrimmedString(checkoutFallback?.geoCity),
      arrondissement: toTrimmedString(incomingDelivery?.geoArrondissement) || toTrimmedString(checkoutFallback?.geoArrondissement),
      district: toTrimmedString(incomingDelivery?.geoDistrict) || toTrimmedString(checkoutFallback?.geoDistrict),
      country: toTrimmedString(incomingDelivery?.geoCountry) || toTrimmedString(checkoutFallback?.geoCountry),
      regionDepartment: toTrimmedString(incomingDelivery?.geoRegionDepartment) || toTrimmedString(checkoutFallback?.geoRegionDepartment)
    }
    const resolvedPointsUsedRaw = (payload as any)?.pointsUsed ?? legacyShipping?.points_used
    const resolvedPointsDiscountRaw = (payload as any)?.pointsDiscount ?? legacyShipping?.points_discount
    const resolvedFinalTotalRaw = (payload as any)?.finalTotal ?? legacyShipping?.final_total

    const resolvedPointsUsed = typeof resolvedPointsUsedRaw === 'number' ? resolvedPointsUsedRaw : Number(resolvedPointsUsedRaw ?? 0) || 0
    const resolvedPointsDiscount = typeof resolvedPointsDiscountRaw === 'number'
      ? resolvedPointsDiscountRaw
      : Number(resolvedPointsDiscountRaw ?? 0) || 0
    const resolvedFinalTotal = typeof resolvedFinalTotalRaw === 'number'
      ? resolvedFinalTotalRaw
      : Number(resolvedFinalTotalRaw ?? 0) || 0

    for (const [vendorId, vendorItems] of itemsByVendor.entries()) {
      const vendorProductIds = vendorItems.map((i) => i.productId)

      const vendorRequiresCoords =
        !noDeliveryRequested &&
        vendorItems.some((item) => {
          const flags = productFlagsByProductId.get(item.productId)
          return isPhysicalFromFlags(flags)
        })

      const { data: shippingRowsRaw } = await supabase
        .from('user_products')
        .select('id, vendor_id, shipping_cost, shipping_class, free_shipping, weight, metadata, product_category_assignments(category_id)')
        .in('id', vendorProductIds)

      const shippingRows = (shippingRowsRaw ?? []).map((row: any) => {
        const categoryIds = Array.isArray(row?.product_category_assignments)
          ? row.product_category_assignments.map((x: any) => String(x?.category_id ?? '')).filter(Boolean)
          : []

        return {
          productId: String(row?.id ?? ''),
          vendorId: typeof row?.vendor_id === 'string' ? row.vendor_id : null,
          categoryIds,
          baseFreeShipping: Boolean(row?.free_shipping),
          shippingCost: Number(row?.shipping_cost ?? 0) || 0,
          shippingClass: typeof row?.shipping_class === 'string' ? row.shipping_class : null,
          weightKg: typeof row?.weight === 'number' ? row.weight : row?.weight == null ? null : Number(row?.weight ?? 0) || null
        }
      })

      const cartItemsForRule = vendorItems.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice
      }))

      const isStandardMode = resolvedMethod !== 'express'
      const freeByConfigIds = vendorRequiresCoords
        ? resolveFreeShippingProductIds({
            freeShippingConfig: deliveryConfig.freeShippingConfig,
            shippingRows: shippingRows.map((r: any) => ({ productId: r.productId, vendorId: r.vendorId, categoryIds: r.categoryIds })),
            cartItems: cartItemsForRule,
            zone: resolvedZone,
            geo: resolvedGeo as any,
            isStandardMode
          })
        : new Set<string>()

      const shippingRowsWithFree = shippingRows.map((row: any) => ({
        ...row,
        freeShipping: !vendorRequiresCoords || Boolean(row.baseFreeShipping) || (isStandardMode && freeByConfigIds.has(String(row.productId)))
      }))

      const nonFreeCosts = vendorRequiresCoords
        ? shippingRowsWithFree
            .filter((s: any) => !Boolean(s?.freeShipping))
            .map((s: any) => (typeof s?.shippingCost === 'number' ? s.shippingCost : Number(s?.shippingCost ?? 0) || 0))
            .filter((v: any) => typeof v === 'number' && Number.isFinite(v) && v > 0)
        : []

      const baseCost = !vendorRequiresCoords
        ? 0
        : resolvedAggregation === 'sum'
          ? nonFreeCosts.reduce((acc: number, v: number) => acc + v, 0)
          : (nonFreeCosts.length > 0 ? Math.max(...nonFreeCosts) : 0)

      const allFree = !vendorRequiresCoords || (shippingRowsWithFree.length > 0 && shippingRowsWithFree.every((s: any) => Boolean(s?.freeShipping)))

      const cartWeightKg = !vendorRequiresCoords
        ? 0
        : shippingRowsWithFree.reduce((acc: number, row: any) => {
            const w = typeof row?.weightKg === 'number' && Number.isFinite(row.weightKg) && row.weightKg > 0 ? row.weightKg : 0
            const item = vendorItems.find((i) => i.productId === row.productId)
            const qty = item ? item.quantity : 0
            return acc + w * Math.max(0, qty)
          }, 0)

      const normalizedRules = (deliveryConfig.deliveryRules ?? []).map((r: any) => {
        return {
          ...r,
          isActive: r?.isActive !== false,
          mode: r?.mode === 'express' ? 'express' : 'standard',
          zone: r?.zone === 'regional' || r?.zone === 'national' || r?.zone === 'international' ? r.zone : 'local',
          country: typeof r?.country === 'string' ? r.country : '*',
          regionDepartment: typeof r?.regionDepartment === 'string' ? r.regionDepartment : '*',
          localDistrict: typeof r?.localDistrict === 'string' ? r.localDistrict : '*',
          department: typeof r?.department === 'string' ? r.department : '*',
          city: typeof r?.city === 'string' ? r.city : '*',
          arrondissement: typeof r?.arrondissement === 'string' ? r.arrondissement : '*',
          district: typeof r?.district === 'string' ? r.district : '*',
          pricingModel: r?.pricingModel ?? 'zone',
          priceType: r?.priceType === 'per_unit' ? 'per_unit' : 'fixed',
          unit: r?.unit === 'item' || r?.unit === 'kg' ? r.unit : 'order',
          currency: typeof r?.currency === 'string' ? r.currency : 'XOF',
          minQty: typeof r?.minQty === 'number' ? r.minQty : r?.minQty == null ? null : Number(r?.minQty) || null,
          maxQty: typeof r?.maxQty === 'number' ? r.maxQty : r?.maxQty == null ? null : Number(r?.maxQty) || null,
          minWeightKg: typeof r?.minWeightKg === 'number' ? r.minWeightKg : r?.minWeightKg == null ? null : Number(r?.minWeightKg) || null,
          maxWeightKg: typeof r?.maxWeightKg === 'number' ? r.maxWeightKg : r?.maxWeightKg == null ? null : Number(r?.maxWeightKg) || null,
          price: typeof r?.price === 'number' ? r.price : Number(r?.price ?? 0) || 0,
          etaMinDays: typeof r?.etaMinDays === 'number' ? r.etaMinDays : null,
          etaMaxDays: typeof r?.etaMaxDays === 'number' ? r.etaMaxDays : null
        } satisfies DeliveryRule
      })

      const bestRule = vendorRequiresCoords
        ? selectBestDeliveryRule(normalizedRules as DeliveryRule[], {
            mode: resolvedMethod === 'express' ? 'express' : 'standard',
            zone: resolvedZone as any,
            geo: {
              country: resolvedZone === 'international' ? (resolvedGeo.country || null) : null,
              regionDepartment: resolvedZone === 'regional' ? (resolvedGeo.regionDepartment || resolvedGeo.department || null) : null,
              localDistrict: resolvedZone === 'local' ? (resolvedGeo.localDistrict || null) : null,
              department: resolvedZone === 'national' ? (resolvedGeo.department || null) : null,
              city: resolvedZone === 'national' ? (resolvedGeo.city || null) : null,
              arrondissement: resolvedZone === 'national' ? (resolvedGeo.arrondissement || null) : null,
              district: resolvedZone === 'national' ? (resolvedGeo.district || null) : null
            },
            quantity: vendorItems.reduce((acc, i) => acc + Math.max(0, i.quantity), 0),
            weightKg: cartWeightKg > 0 ? cartWeightKg : null
          })
        : null

      const ruleCost = !vendorRequiresCoords
        ? 0
        : bestRule
          ? computeDeliveryPriceFromRule(bestRule, {
              orderUnits: 1,
              itemUnits: vendorItems.reduce((acc, i) => acc + Math.max(0, i.quantity), 0),
              weightKg: cartWeightKg > 0 ? cartWeightKg : null
            })
          : baseCost

      const effectiveShippingCost = !vendorRequiresCoords ? 0 : allFree ? 0 : Math.ceil(Number(ruleCost) || 0)

      const itemsPayload = vendorItems.map((item) => {
        const fallbackUnit = priceByProductId.get(item.productId) ?? item.unitPrice
        const safeUnitPrice = item.unitPrice > 0 ? item.unitPrice : fallbackUnit
        const totalPrice = Math.round(safeUnitPrice * item.quantity)
        return {
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: safeUnitPrice,
          totalPrice
        }
      })

      const totalAmount = itemsPayload.reduce((sum, i) => sum + toNumber(i.totalPrice, 0), 0)

      const created = await OrderRepository.createOrder(
        {
          customerId: userId,
          vendorId,
          totalAmount,
          currency: payload.currency ?? 'XOF',
          paymentMethod: payload.paymentMethod ?? undefined,
          paymentStatus: effectivePaymentStatus,
          status: payload.status ?? 'pending',
          paymentOption: resolvedPaymentOption ?? undefined,
          deliveryOption: resolvedDeliveryOption ?? undefined,
          pointsUsed: resolvedPointsUsed,
          pointsDiscount: resolvedPointsDiscount,
          finalTotal: resolvedFinalTotal,
          shippingAddress: {
            ...(payload.shippingAddress ?? {}),
            metadata: {
              ...((payload.shippingAddress as any)?.metadata ?? {}),
              delivery: {
                zone: resolvedZone,
                method: resolvedMethod,
                aggregation: resolvedAggregation,
                geo: resolvedGeo,
                shippingCost: effectiveShippingCost,
                isFreeShipping: allFree,
                computedAt: new Date().toISOString()
              }
            }
          },
          shippingLat,
          shippingLng,
          billingAddress: payload.billingAddress ?? null,
          notes: payload.notes ?? undefined,
          items: itemsPayload
        },
        {
          actorId: userId,
          actorRole: 'customer'
        }
      )

      // Automatisation: enregistrer l'événement de création commande (best-effort)
      try {
        const orderId = String((created as any)?.id ?? '').trim()
        await recordAutomationEvent({
          source: 'client_orders_api',
          eventType: 'order.created',
          entityType: 'order',
          entityId: orderId || null,
          actorUserId: userId,
          payload: {
            vendorId,
            totalAmount,
            currency: payload.currency ?? 'XOF',
            paymentStatus: effectivePaymentStatus,
            status: payload.status ?? 'pending',
            delivery: {
              zone: resolvedZone,
              method: resolvedMethod,
              aggregation: resolvedAggregation,
              shippingCost: effectiveShippingCost,
              isFreeShipping: allFree
            }
          },
          request
        })
      } catch {
        // best-effort
      }

      // Enregistrer une livraison (best-effort)
      try {
        if (vendorRequiresCoords) {
          const { error: deliveryInsertError } = await supabase.from('deliveries').insert({
            order_id: (created as any)?.id,
            customer_id: userId,
            vendor_id: vendorId,
            status: 'pending',
            priority: 'medium',
            progress_percent: 0,
            metadata: {
              source: 'client_orders_api',
              payment_method: payload.paymentMethod ?? null,
              payment_status: effectivePaymentStatus,
              delivery: {
                zone: resolvedZone,
                method: resolvedMethod,
                aggregation: resolvedAggregation,
                geo: resolvedGeo,
                shippingCost: effectiveShippingCost,
                isFreeShipping: allFree,
                shippingLat,
                shippingLng
              }
            }
          } as any)

          if (deliveryInsertError) {
            console.warn('⚠️ POST /api/client/orders: delivery insert failed:', deliveryInsertError)
          }
        }
      } catch (err) {
        console.warn('⚠️ POST /api/client/orders: delivery insert unexpected error:', err)
      }

      ordersCreated.push(created)

      // Tracking purchase (option A): uniquement si commande confirmée / paiement completed.
      try {
        const paymentStatus = String(payload.paymentStatus ?? 'pending').toLowerCase().trim()
        const orderStatus = String(payload.status ?? 'pending').toLowerCase().trim()
        const isPaid = paymentStatus === 'completed' || paymentStatus === 'paid' || paymentStatus === 'success'
        const isConfirmed = orderStatus === 'confirmed' || orderStatus === 'completed'
        if (isPaid || isConfirmed) {
          for (const item of vendorItems) {
            const pid = String(item?.productId ?? '').trim()
            const refUserId = String(shareRefByProductId?.[pid] ?? '').trim()
            if (!UUID_REGEX.test(pid) || !UUID_REGEX.test(refUserId)) continue
            await recordPurchaseInteraction({
              supabase,
              productId: pid,
              refUserId,
              buyerUserId: userId,
              request
            })
          }
        }
      } catch {
        // best-effort
      }

      const usageRows = vendorItems
        .map((item) => {
          const source = item.appliedOffer?.source
          const promotionId = item.appliedOffer?.promotionId
          if (source !== 'classic' || typeof promotionId !== 'string' || !UUID_REGEX.test(promotionId)) {
            return null
          }

          const originalUnit = item.originalUnitPrice > 0 ? item.originalUnitPrice : priceByProductId.get(item.productId) ?? item.unitPrice
          const finalUnit = item.unitPrice > 0 ? item.unitPrice : priceByProductId.get(item.productId) ?? originalUnit

          const originalAmount = Math.round(toNumber(originalUnit, 0) * item.quantity)
          const finalAmount = Math.round(toNumber(finalUnit, 0) * item.quantity)
          const discountAmount = Math.max(0, originalAmount - finalAmount)

          if (discountAmount <= 0) return null

          return {
            promotion_id: promotionId,
            user_id: userId,
            order_id: (created as any)?.id ?? null,
            product_id: item.productId,
            discount_amount: discountAmount,
            original_amount: originalAmount,
            final_amount: finalAmount
          }
        })
        .filter(Boolean)

      const specialUsageRows = vendorItems
        .map((item) => {
          const source = item.appliedOffer?.source
          const promotionId = item.appliedOffer?.promotionId
          if (source !== 'special' || typeof promotionId !== 'string' || !UUID_REGEX.test(promotionId)) {
            return null
          }

          const originalUnit = item.originalUnitPrice > 0 ? item.originalUnitPrice : priceByProductId.get(item.productId) ?? item.unitPrice
          const finalUnit = item.unitPrice > 0 ? item.unitPrice : priceByProductId.get(item.productId) ?? originalUnit

          const originalAmount = Math.round(toNumber(originalUnit, 0) * item.quantity)
          const finalAmount = Math.round(toNumber(finalUnit, 0) * item.quantity)
          const discountAmount = Math.max(0, originalAmount - finalAmount)

          if (discountAmount <= 0) return null

          return {
            special_promotion_id: promotionId,
            user_id: userId,
            order_id: (created as any)?.id ?? null,
            product_id: item.productId,
            discount_amount: discountAmount,
            original_amount: originalAmount,
            final_amount: finalAmount
          }
        })
        .filter(Boolean)

      if (usageRows.length > 0) {
        const { error: usageError } = await supabase.from('promotion_usage').insert(usageRows as any)
        if (usageError) {
          console.error('⚠️ POST /api/client/orders: promotion_usage insert failed:', usageError)
        }
      }

      if (specialUsageRows.length > 0) {
        const { error: usageError } = await supabase.from('special_promotion_usage').insert(specialUsageRows as any)
        if (usageError) {
          console.error('⚠️ POST /api/client/orders: special_promotion_usage insert failed:', usageError)
        }
      }
    }

    return NextResponse.json({ data: ordersCreated }, { status: 201 })
  } catch (error) {
    if (isClientAuthError(error)) {
      return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 })
    }

    console.error('❌ POST /api/client/orders failed', error)
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const lower = message.toLowerCase()
    const isStockError = lower.includes('stock insuffisant') || lower.includes('(23514)') || lower.includes('23514')
    const status = isStockError ? 409 : message.includes('Accès') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
