export type DeliveryPricingModel =
  | 'zone'
  | 'quantity'
  | 'weight'
  | 'zone_quantity'
  | 'zone_weight'
  | 'zone_quantity_weight'

export type DeliveryPriceType = 'fixed' | 'per_unit'
export type DeliveryPriceUnit = 'order' | 'item' | 'kg'

export type DeliveryRule = {
  id: string
  isActive: boolean
  mode: 'standard' | 'express'
  zone: 'local' | 'regional' | 'national' | 'international'
  country: string | '*'
  regionDepartment: string | '*'
  localDistrict: string | '*'
  department: string | '*'
  city: string | '*'
  arrondissement: string | '*'
  district: string | '*'
  pricingModel: DeliveryPricingModel
  priceType: DeliveryPriceType
  unit: DeliveryPriceUnit
  currency: string
  minQty: number | null
  maxQty: number | null
  minWeightKg: number | null
  maxWeightKg: number | null
  price: number
  etaMinDays: number | null
  etaMaxDays: number | null
}

export type DeliveryGeoTarget = {
  country?: string | null
  regionDepartment?: string | null
  localDistrict?: string | null
  department?: string | null
  city?: string | null
  arrondissement?: string | null
  district?: string | null
}

export type DeliveryRuleCriteria = {
  mode: 'standard' | 'express'
  zone: DeliveryRule['zone']
  geo?: DeliveryGeoTarget
  quantity?: number | null
  weightKg?: number | null
}

export type DeliveryPriceContext = {
  orderUnits: number
  itemUnits: number
  weightKg: number | null
}

/**
 * Normalise une chaîne (trim + lower) pour comparer des libellés de zones.
 */
function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

/**
 * Indique si une valeur correspond au wildcard '*'.
 */
function isWildcard(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value !== 'string') return true
  const trimmed = value.trim()
  return trimmed.length === 0 || trimmed === '*'
}

/**
 * Détermine si une règle match un critère géographique.
 * Règle: une valeur '*' match tout, sinon match exact (insensible à la casse).
 */
function matchesGeo(rule: DeliveryRule, geo?: DeliveryGeoTarget): boolean {
  const target = geo ?? {}

  const countryTarget = normalizeText(target.country ?? '')
  const regionDepartmentTarget = normalizeText(target.regionDepartment ?? '')
  const localDistrictTarget = normalizeText(target.localDistrict ?? '')
  const departmentTarget = normalizeText(target.department ?? '')
  const cityTarget = normalizeText(target.city ?? '')
  const arrondissementTarget = normalizeText(target.arrondissement ?? '')
  const districtTarget = normalizeText(target.district ?? '')

  const countryRule = normalizeText(rule.country)
  const regionDepartmentRule = normalizeText(rule.regionDepartment)
  const localDistrictRule = normalizeText(rule.localDistrict)
  const departmentRule = normalizeText(rule.department)
  const cityRule = normalizeText(rule.city)
  const arrondissementRule = normalizeText(rule.arrondissement)
  const districtRule = normalizeText(rule.district)

  if (!isWildcard(rule.country)) {
    if (!countryTarget || countryRule !== countryTarget) return false
  }

  if (!isWildcard(rule.regionDepartment)) {
    if (!regionDepartmentTarget || regionDepartmentRule !== regionDepartmentTarget) return false
  }

  if (!isWildcard(rule.localDistrict)) {
    if (!localDistrictTarget || localDistrictRule !== localDistrictTarget) return false
  }

  if (!isWildcard(rule.department)) {
    if (!departmentTarget || departmentRule !== departmentTarget) return false
  }

  if (!isWildcard(rule.city)) {
    if (!cityTarget || cityRule !== cityTarget) return false
  }

  if (!isWildcard(rule.arrondissement)) {
    if (!arrondissementTarget || arrondissementRule !== arrondissementTarget) return false
  }

  if (!isWildcard(rule.district)) {
    if (!districtTarget || districtRule !== districtTarget) return false
  }

  return true
}

/**
 * Calcule un score de spécificité: plus la règle a de champs géo non-wildcards, plus elle est spécifique.
 * Sert à appliquer la stratégie "la plus spécifique gagne".
 */
function computeGeoSpecificityScore(rule: DeliveryRule): number {
  return [
    rule.country,
    rule.regionDepartment,
    rule.localDistrict,
    rule.department,
    rule.city,
    rule.arrondissement,
    rule.district
  ].reduce((acc, value) => acc + (isWildcard(value) ? 0 : 1), 0)
}

/**
 * Vérifie si la quantité/poids du panier rentre dans les tranches de la règle.
 */
function matchesRanges(rule: DeliveryRule, criteria: DeliveryRuleCriteria): boolean {
  const qty = typeof criteria.quantity === 'number' && Number.isFinite(criteria.quantity) ? criteria.quantity : null
  const weight = typeof criteria.weightKg === 'number' && Number.isFinite(criteria.weightKg) ? criteria.weightKg : null

  if (rule.minQty !== null && qty !== null && qty < rule.minQty) return false
  if (rule.maxQty !== null && qty !== null && qty > rule.maxQty) return false

  if (rule.minWeightKg !== null && weight !== null && weight < rule.minWeightKg) return false
  if (rule.maxWeightKg !== null && weight !== null && weight > rule.maxWeightKg) return false

  // Si la règle impose une tranche mais que le contexte n'a pas la donnée, on considère que ça ne match pas.
  if ((rule.minQty !== null || rule.maxQty !== null) && qty === null) return false
  if ((rule.minWeightKg !== null || rule.maxWeightKg !== null) && weight === null) return false

  return true
}

/**
 * Sélectionne la meilleure règle (active) qui match.
 * Priorités: mode + zone + géo + tranches, puis score de spécificité max.
 */
export function selectBestDeliveryRule(rules: DeliveryRule[], criteria: DeliveryRuleCriteria): DeliveryRule | null {
  const list = Array.isArray(rules) ? rules : []

  const candidates = list.filter((r) => {
    if (!r || !r.isActive) return false
    if (r.mode !== criteria.mode) return false
    if (r.zone !== criteria.zone) return false
    if (!matchesGeo(r, criteria.geo)) return false
    if (!matchesRanges(r, criteria)) return false
    return true
  })

  if (candidates.length === 0) return null

  candidates.sort((a, b) => {
    const scoreA = computeGeoSpecificityScore(a)
    const scoreB = computeGeoSpecificityScore(b)
    if (scoreA !== scoreB) return scoreB - scoreA
    return String(a.id).localeCompare(String(b.id))
  })

  return candidates[0] ?? null
}

/**
 * Calcule un prix final à partir d'une règle sélectionnée.
 * - fixed: retourne rule.price
 * - per_unit: multiplie selon unit (order/item/kg)
 */
export function computeDeliveryPriceFromRule(rule: DeliveryRule, ctx: DeliveryPriceContext): number {
  const base = typeof rule.price === 'number' && Number.isFinite(rule.price) ? rule.price : 0

  if (rule.priceType === 'fixed') return base

  const unit = rule.unit
  if (unit === 'order') return base * Math.max(1, Math.floor(ctx.orderUnits || 1))
  if (unit === 'item') return base * Math.max(0, Math.floor(ctx.itemUnits || 0))

  const weight = ctx.weightKg
  if (unit === 'kg') {
    if (typeof weight !== 'number' || !Number.isFinite(weight) || weight <= 0) return base
    return base * weight
  }

  return base
}
