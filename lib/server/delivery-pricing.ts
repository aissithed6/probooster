import { getSupabaseAdmin } from '@/lib/supabase'
import { computeDeliveryPriceFromRule, selectBestDeliveryRule, type DeliveryRule } from '@/lib/utils/delivery-rule-matcher'

export type DeliveryChangeContext = {
  deliveryRules: DeliveryRule[]
  mode: 'standard' | 'express'
  zone: 'local' | 'regional' | 'national' | 'international'
  geo: {
    country?: string | null
    regionDepartment?: string | null
    localDistrict?: string | null
    department?: string | null
    city?: string | null
    arrondissement?: string | null
    district?: string | null
  }
  quantity: number
  weightKg: number | null
  freeShipping: boolean
}

/**
 * Charge la config de livraison publique (règles définies par le super-admin).
 */
export async function fetchDeliveryRules(): Promise<DeliveryRule[]> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('super_admin_settings')
    .select('settings')
    .eq('scope', 'global')
    .maybeSingle()

  if (error) {
    console.warn('⚠️ fetchDeliveryRules failed:', error.message)
    return []
  }

  const settings = (data as any)?.settings ?? {}
  const deliveryConfig = settings?.deliveryConfig ?? {}
  const rulesSource = settings?.deliveryRules ?? deliveryConfig?.deliveryRules
  return Array.isArray(rulesSource) ? (rulesSource as DeliveryRule[]) : []
}

/**
 * Charge les règles de livraison + la config de livraison gratuite (super-admin).
 */
export async function fetchDeliverySettings(): Promise<{
  deliveryRules: DeliveryRule[]
  freeShippingConfig: { enabled: boolean; rules: any[] } & Record<string, unknown>
}> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('super_admin_settings')
    .select('settings')
    .eq('scope', 'global')
    .maybeSingle()

  if (error) {
    console.warn('⚠️ fetchDeliverySettings failed:', error.message)
    return { deliveryRules: [], freeShippingConfig: { enabled: false, rules: [] } }
  }

  const settings = (data as any)?.settings ?? {}
  const deliveryConfig = (settings as any)?.deliveryConfig ?? {}
  const rulesSource = (settings as any)?.deliveryRules ?? (deliveryConfig as any)?.deliveryRules
  const freeShippingSource = (settings as any)?.freeShippingConfig ?? (deliveryConfig as any)?.freeShippingConfig

  return {
    deliveryRules: Array.isArray(rulesSource) ? (rulesSource as DeliveryRule[]) : [],
    freeShippingConfig:
      freeShippingSource && typeof freeShippingSource === 'object'
        ? (freeShippingSource as any)
        : { enabled: false, rules: [] }
  }
}

/**
 * Calcule le prix de livraison pour un contexte donné (même moteur que le checkout).
 */
export function computeShippingCost(ctx: DeliveryChangeContext): number {
  if (ctx.freeShipping) return 0

  const bestRule = selectBestDeliveryRule(ctx.deliveryRules, {
    mode: ctx.mode,
    zone: ctx.zone,
    geo: ctx.geo,
    quantity: ctx.quantity,
    weightKg: ctx.weightKg
  })

  if (!bestRule) return 0

  return Math.ceil(computeDeliveryPriceFromRule(bestRule, {
    orderUnits: 1,
    itemUnits: ctx.quantity,
    weightKg: ctx.weightKg
  }))
}

/**
 * Détermine la zone de livraison à partir des coordonnées / adresse fournies.
 * Heuristique simple basée sur la présence des champs géo.
 */
export function resolveZoneFromGeo(geo: DeliveryChangeContext['geo']): DeliveryChangeContext['zone'] {
  if (geo.localDistrict) return 'local'
  if (geo.department || geo.city || geo.arrondissement || geo.district) return 'national'
  if (geo.regionDepartment) return 'regional'
  if (geo.country) return 'international'
  return 'local'
}

/**
 * Applique les règles de livraison gratuite super-admin (standard uniquement),
 * à l'identique du checkout (app/api/client/orders/route.ts).
 */
function resolveFreeShippingProductIds(params: {
  freeShippingConfig: any
  shippingRows: Array<{ productId: string; vendorId: string | null; categoryIds: string[] }>
  cartItems: Array<{ productId: string; quantity: number; unitPrice: number }>
  zone: string
  geo: Record<string, string | null | undefined>
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
      const target = (params.geo.localDistrict ?? '').toString().toLowerCase()
      const expected = typeof rule?.localDistrict === 'string' ? rule.localDistrict.toLowerCase() : '*'
      if (expected && expected !== '*') return target === expected
      return true
    }

    if (ruleZone === 'national') {
      const eq = (a: unknown, b: unknown) => String(a ?? '').toLowerCase() === String(b ?? '').toLowerCase()
      const deptOk = !rule.department || rule.department === '*' || eq(params.geo.department, rule.department)
      const cityOk = !rule.city || rule.city === '*' || eq(params.geo.city, rule.city)
      const arrOk = !rule.arrondissement || rule.arrondissement === '*' || eq(params.geo.arrondissement, rule.arrondissement)
      const distOk = !rule.district || rule.district === '*' || eq(params.geo.district, rule.district)
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
    return new Set<string>(shouldApplyToAll ? params.shippingRows.map((r) => r.productId) : eligibleProductIds)
  }

  return new Set()
}

export type OrderShippingContext = {
  /** Livraison gratuite effective pour TOUTE la commande (tous les produits free). */
  allFree: boolean
  /** Quantité totale d'articles de la commande. */
  quantity: number
  /** Poids total (kg) de la commande, null si inconnu. */
  weightKg: number | null
  itemCount: number
}

/**
 * Reconstruit le contexte de tarification livraison d'une commande EXISTANTE,
 * en répliquant fidèlement le calcul du checkout:
 * - flags `free_shipping` des produits (user_products)
 * - règles de livraison gratuite de la config super-admin (standard uniquement)
 * - quantités + poids réels des order_items
 * Ne fait JAMAIS confiance aux valeurs envoyées par le client.
 */
export async function resolveOrderShippingContext(params: {
  orderId: string
  zone: DeliveryChangeContext['zone']
  geo: DeliveryChangeContext['geo']
  mode: 'standard' | 'express'
}): Promise<OrderShippingContext> {
  const supabase = getSupabaseAdmin()
  const fallback: OrderShippingContext = { allFree: false, quantity: 1, weightKg: null, itemCount: 0 }

  try {
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('product_id, quantity, unit_price')
      .eq('order_id', params.orderId)

    if (itemsError || !items || items.length === 0) return fallback

    const cartItems = items
      .map((row: any) => ({
        productId: String(row?.product_id ?? ''),
        quantity: Math.max(0, Math.floor(Number(row?.quantity ?? 0)) || 0),
        unitPrice: Number(row?.unit_price ?? 0) || 0
      }))
      .filter((i) => i.productId.length > 0)

    if (cartItems.length === 0) return fallback

    const productIds = Array.from(new Set(cartItems.map((i) => i.productId)))

    const [{ data: productRows }, settings] = await Promise.all([
      supabase
        .from('user_products')
        .select(
          'id, vendor_id, free_shipping, weight, is_virtual, is_downloadable, product_category_assignments(category_id)'
        )
        .in('id', productIds),
      fetchDeliverySettings()
    ])

    const isStandardMode = params.mode !== 'express'

    const shippingRows = (productRows ?? [])
      .map((row: any) => {
        const categoryIds = Array.isArray(row?.product_category_assignments)
          ? row.product_category_assignments.map((x: any) => String(x?.category_id ?? '')).filter(Boolean)
          : []
        return {
          productId: String(row?.id ?? ''),
          vendorId: typeof row?.vendor_id === 'string' ? row.vendor_id : null,
          categoryIds,
          baseFreeShipping: Boolean(row?.free_shipping),
          weightKg:
            typeof row?.weight === 'number'
              ? row.weight
              : row?.weight == null
                ? null
                : Number(row?.weight ?? 0) || null
        }
      })
      .filter((r) => r.productId.length > 0)

    if (shippingRows.length === 0) return fallback

    const freeByConfigIds = resolveFreeShippingProductIds({
      freeShippingConfig: settings.freeShippingConfig,
      shippingRows: shippingRows.map((r) => ({ productId: r.productId, vendorId: r.vendorId, categoryIds: r.categoryIds })),
      cartItems,
      zone: params.zone,
      geo: params.geo as Record<string, string | null | undefined>,
      isStandardMode
    })

    const rowsWithFree = shippingRows.map((row) => ({
      ...row,
      freeShipping: Boolean(row.baseFreeShipping) || (isStandardMode && freeByConfigIds.has(String(row.productId)))
    }))

    const quantity = cartItems.reduce((acc, i) => acc + i.quantity, 0)
    const weightKg = rowsWithFree.reduce((acc, row) => {
      const w = typeof row.weightKg === 'number' && Number.isFinite(row.weightKg) && row.weightKg > 0 ? row.weightKg : 0
      const item = cartItems.find((i) => i.productId === row.productId)
      const qty = item ? item.quantity : 0
      return acc + w * Math.max(0, qty)
    }, 0)

    return {
      allFree: rowsWithFree.length > 0 && rowsWithFree.every((r) => Boolean(r.freeShipping)),
      quantity: Math.max(1, quantity),
      weightKg: weightKg > 0 ? weightKg : null,
      itemCount: cartItems.length
    }
  } catch (error) {
    console.warn('⚠️ resolveOrderShippingContext failed:', error)
    return fallback
  }
}