export type FreeShippingConfig = {
  enabled?: boolean
  rules?: any[]
}

export type FreeShippingEligibilityInput = {
  productId: string
  vendorId?: string | null
  categoryIds?: string[]
  freeShippingConfig: FreeShippingConfig | null | undefined
}

/**
 * Détermine si un produit est éligible à l'affichage du label "Livraison gratuite".
 *
 * Objectif UI: dès qu'une règle Super Admin cible le produit (produit/vendeur/catégorie),
 * on affiche le badge. Cette fonction n'évalue pas les conditions de panier (min montant/qty)
 * car elles ne sont pas disponibles de façon fiable sur une fiche produit.
 */
export function isProductEligibleForFreeShippingLabel(input: FreeShippingEligibilityInput): boolean {
  const productId = typeof input.productId === 'string' ? input.productId.trim() : ''
  if (!productId) return false

  const cfg = input.freeShippingConfig
  if (!cfg?.enabled) return false

  const rules = Array.isArray(cfg.rules) ? cfg.rules : []
  if (rules.length === 0) return false

  const vendorId = typeof input.vendorId === 'string' ? input.vendorId.trim() : ''
  const categoryIds = Array.isArray(input.categoryIds) ? input.categoryIds.map(String).filter(Boolean) : []
  const categorySet = new Set(categoryIds)

  const intersects = (a: string[], bSet: Set<string>): boolean => {
    if (a.length === 0 || bSet.size === 0) return false
    for (const v of a) {
      if (bSet.has(String(v))) return true
    }
    return false
  }

  for (const rule of rules) {
    if (!rule) continue
    const isActive = (rule as any)?.isActive ?? (rule as any)?.is_active ?? (rule as any)?.active
    if (isActive === false) continue

    const ruleProductIdsRaw =
      (rule as any)?.productIds ??
      (rule as any)?.product_ids ??
      (rule as any)?.products ??
      (rule as any)?.product_ids_list

    const ruleVendorIdsRaw = (rule as any)?.vendorIds ?? (rule as any)?.vendor_ids ?? (rule as any)?.vendors

    const ruleCategoryIdsRaw = (rule as any)?.categoryIds ?? (rule as any)?.category_ids ?? (rule as any)?.categories

    const ruleProductIds = Array.isArray(ruleProductIdsRaw) ? ruleProductIdsRaw.map(String).filter(Boolean) : []
    const ruleVendorIds = Array.isArray(ruleVendorIdsRaw) ? ruleVendorIdsRaw.map(String).filter(Boolean) : []
    const ruleCategoryIds = Array.isArray(ruleCategoryIdsRaw) ? ruleCategoryIdsRaw.map(String).filter(Boolean) : []

    const hasProductFilter = ruleProductIds.length > 0
    const hasVendorFilter = ruleVendorIds.length > 0
    const hasCategoryFilter = ruleCategoryIds.length > 0
    const hasAnyTarget = hasProductFilter || hasVendorFilter || hasCategoryFilter

    // Règle sans cible explicite: on n'affiche pas le badge sur la fiche/carte produit.
    if (!hasAnyTarget) {
      continue
    }

    if (hasProductFilter && !ruleProductIds.includes(productId)) {
      continue
    }

    if (hasVendorFilter) {
      if (!vendorId) continue
      if (!ruleVendorIds.includes(vendorId)) continue
    }

    if (hasCategoryFilter) {
      if (!intersects(ruleCategoryIds, categorySet)) continue
    }

    return true

  }

  return false
}
