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