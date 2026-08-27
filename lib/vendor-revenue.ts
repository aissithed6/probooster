import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * ============================================================================
 * SOURCE UNIQUE DE VÉRITÉ — REVENUS VENDEUR
 * ============================================================================
 * Toutes les cartes « chiffre d'affaire » (dashboard vendeur, analytics vendeur,
 * produits vendeur, finance/super-admin, CA total & par vendeur) DOIVENT passer
 * par ce module afin qu'il n'existe qu'UNE SEULE définition du CA.
 *
 * Définition canonique :
 *   - Attribution : orders.vendor_id  (une commande = un vendeur).
 *   - CA (gross)   = SUM(order_items.total_price) des commandes PAYÉES du vendeur.
 *   - Retours      = SUM des order_returns approuvés/résolus (+ gross des commandes
 *                    entièrement remboursées payment_status='refunded').
 *   - Net          = CA − Retours   ( « CA = ventes payées − retours » )
 *
 * Lecteur ultra-rapide : table dénormalisée `vendor_revenue_snapshot` (1 ligne /
 * vendeur, maintenue par déclencheurs Postgres) → O(1) au lieu d'agréger N line_items.
 * Ce module expose getVendorRevenueSnapshots() (lecture instantanée) et
 * recomputeVendorRevenueLive() (recalcul en direct, fallback / backfill).
 * ============================================================================
 */

/** Statuts considérés comme « ventes payées » (source unique). */
export const PAID_REVENUE_STATUSES = [
  'paid',
  'completed',
  'succeeded',
  'successful',
  'authorized',
  'captured',
  'processed',
  'delivered'
] as const

/** Statut de paiement considéré comme « payé ». DOIT être la seule référence. */
export function isPaidRevenueStatus(value: unknown): boolean {
  const s = typeof value === 'string' ? value.trim().toLowerCase() : ''
  if (!s) return false
  if (s === 'unpaid' || s === 'pending' || s === 'failed' || s === 'cancelled' || s === 'refunded') return false
  return (PAID_REVENUE_STATUSES as readonly string[]).includes(s)
}

/** Statuts d'un retour considérés comme « validés/remboursés ». */
const APPROVED_RETURN_STATUSES = new Set([
  'approved',
  'completed',
  'resolved',
  'accepted',
  'processed',
  'refunded',
  'validated'
])

export function isApprovedReturnStatus(value: unknown): boolean {
  const s = typeof value === 'string' ? value.trim().toLowerCase() : ''
  return APPROVED_RETURN_STATUSES.has(s)
}

/** Montant canonique d'un en-tête de commande (final_total pris en priorité). */
export function orderGrossAmount(order: any): number {
  const raw = order?.final_total != null ? order.final_total : order?.total_amount
  const n = Number(raw ?? 0)
  return Number.isFinite(n) ? n : 0
}

/** Montant canonique d'une ligne order_items. */
export function itemLineAmount(item: any): number {
  const totalPrice = Number(item?.total_price ?? NaN)
  if (Number.isFinite(totalPrice) && totalPrice > 0) return totalPrice
  const total = Number(item?.total ?? NaN)
  if (Number.isFinite(total) && total > 0) return total
  const qty = Number(item?.quantity ?? 0)
  const unit = Number(item?.unit_price ?? item?.price ?? 0)
  const mult = unit * (Number.isFinite(qty) ? qty : 0)
  return Number.isFinite(mult) ? mult : 0
}

export interface VendorRevenueResult {
  /** Chiffre d'affaire brut = ventes payées (somme des lignes order_items). */
  totalRevenue: number
  /** Montant des retours validés / commandes remboursées. */
  returnsAmount: number
  /** CA net = totalRevenue − returnsAmount. */
  netRevenue: number
  /** Nombre d'articles vendus (quantités des lignes payées). */
  totalSales: number
  /** Nombre de commandes payées distinctes. */
  ordersCount: number
}

function num(v: unknown): number {
  const n = Number(v ?? 0)
  return Number.isFinite(n) ? n : 0
}

/** Somme les lignes order_items (montant + quantités). */
export function sumPaidItems(items: any[] | null | undefined): { totalRevenue: number; totalSales: number } {
  const out = { totalRevenue: 0, totalSales: 0 }
  for (const row of items ?? []) {
    out.totalRevenue += itemLineAmount(row)
    out.totalSales += Math.max(0, num(row?.quantity))
  }
  return out
}

/**
 * Calcule le CA d'un vendeur à partir de données déjà chargées.
 * `refundedGross` = somme des gross des commandes entièrement remboursées.
 */
export function computeVendorRevenue(input: {
  items?: any[]
  returns?: any[]
  refundedGross?: number
}): VendorRevenueResult {
  const { totalRevenue, totalSales } = sumPaidItems(input.items)

  let returnsAmount = 0
  for (const r of input.returns ?? []) {
    if (isApprovedReturnStatus(r?.status)) {
      returnsAmount += Math.max(0, num(r?.amount ?? r?.refund_amount ?? r?.total_price))
    }
  }
  returnsAmount += Math.max(0, num(input.refundedGross))

  const netRevenue = Math.max(0, totalRevenue - returnsAmount)

  const orderIdSet = new Set<string>()
  for (const row of input.items ?? []) {
    const oid = row?.order_id ?? row?.orders?.id
    if (typeof oid === 'string' && oid) orderIdSet.add(oid)
  }

  return {
    totalRevenue: Math.round(totalRevenue),
    returnsAmount: Math.round(returnsAmount),
    netRevenue: Math.round(netRevenue),
    totalSales: Math.round(totalSales),
    ordersCount: orderIdSet.size
  }
}

function zeroResult(): VendorRevenueResult {
  return { totalRevenue: 0, returnsAmount: 0, netRevenue: 0, totalSales: 0, ordersCount: 0 }
}

/**
 * Lecture instantanée (O(1) par vendeur) depuis le snapshot dénormalisé.
 * Retourne une Map vendor_id -> VendorRevenueResult. Les vendeurs sans ligne
 * reçoivent un résultat à zéro (pour éviter les trous d'affichage).
 */
export async function getVendorRevenueSnapshots(
  supabase: SupabaseClient,
  vendorIds: string[]
): Promise<Map<string, VendorRevenueResult>> {
  const map = new Map<string, VendorRevenueResult>()
  const ids = (vendorIds ?? []).map(String).filter(Boolean)
  for (const id of ids) map.set(id, zeroResult())
  if (ids.length === 0) return map

  try {
    const { data, error } = await supabase
      .from('vendor_revenue_snapshot')
      .select('vendor_id, total_revenue, returns_amount, net_revenue, total_sales, orders_count')
      .in('vendor_id', ids as any)

    if (error || !Array.isArray(data)) return map

    for (const row of data) {
      const vid = String(row?.vendor_id ?? '')
      if (!vid || !map.has(vid)) continue
      map.set(vid, {
        totalRevenue: Math.round(num(row?.total_revenue)),
        returnsAmount: Math.round(num(row?.returns_amount)),
        netRevenue: Math.round(num(row?.net_revenue)),
        totalSales: Math.round(num(row?.total_sales)),
        ordersCount: Math.round(num(row?.orders_count))
      })
    }
  } catch {
    // ignore — fallback au recalcul en direct
  }

  return map
}

/**
 * Recalcul en direct (fallback / backfill) : agrège orders + order_items + order_returns
 * pour les vendeurs fournis, en appliquant STRICTEMENT les mêmes règles que le trigger SQL.
 */
export async function recomputeVendorRevenueLive(
  supabase: SupabaseClient,
  vendorIds: string[]
): Promise<Map<string, VendorRevenueResult>> {
  const map = new Map<string, VendorRevenueResult>()
  const ids = (vendorIds ?? []).map(String).filter(Boolean)
  for (const id of ids) map.set(id, zeroResult())
  if (ids.length === 0) return map

  const orderIdToVendor = new Map<string, string>()

  try {
    // 1) Commandes du/des vendeur(s) : attribution + statut paiement.
    const { data: orderRows } = await supabase
      .from('orders')
      .select('id, vendor_id, payment_status, final_total, total_amount')
      .in('vendor_id', ids as any)

    const orders = Array.isArray(orderRows) ? (orderRows as any[]) : []
    const paidOrderIds: string[] = []
    const refundedGrossByVendor = new Map<string, number>()

    for (const o of orders) {
      const vendorId = String(o?.vendor_id ?? '')
      if (!ids.includes(vendorId)) continue
      const orderId = String(o?.id ?? '')
      if (orderId) orderIdToVendor.set(orderId, vendorId)

      if (String(o?.payment_status ?? '').toLowerCase() === 'refunded') {
        const g = orderGrossAmount(o)
        refundedGrossByVendor.set(vendorId, (refundedGrossByVendor.get(vendorId) ?? 0) + g)
      } else if (isPaidRevenueStatus(o?.payment_status)) {
        paidOrderIds.push(orderId)
      }
    }

    // 2) Lignes order_items des commandes payées → montant + quantités par vendeur.
    const itemsByVendor = new Map<string, any[]>()
    if (paidOrderIds.length > 0) {
      const { data: itemRows } = await supabase
        .from('order_items')
        .select('order_id, product_id, quantity, total_price, unit_price')
        .in('order_id', paidOrderIds as any)

      for (const row of Array.isArray(itemRows) ? (itemRows as any[]) : []) {
        const vendorId = orderIdToVendor.get(String(row?.order_id ?? ''))
        if (!vendorId) continue
        if (!itemsByVendor.has(vendorId)) itemsByVendor.set(vendorId, [])
        itemsByVendor.get(vendorId)!.push(row)
      }
    }

    // 3) Retours validés par vendeur (order_returns porte vendor_id).
    const returnsByVendor = new Map<string, any[]>()
    const { data: returnRows } = await supabase
      .from('order_returns')
      .select('vendor_id, amount, total_price, refund_amount, status')
      .in('vendor_id', ids as any)

    for (const row of Array.isArray(returnRows) ? (returnRows as any[]) : []) {
      const vendorId = String(row?.vendor_id ?? '')
      if (!vendorId || !ids.includes(vendorId)) continue
      if (!isApprovedReturnStatus(row?.status)) continue
      if (!returnsByVendor.has(vendorId)) returnsByVendor.set(vendorId, [])
      returnsByVendor.get(vendorId)!.push(row)
    }

    // 4) Assemblage.
    for (const vendorId of ids) {
      map.set(
        vendorId,
        computeVendorRevenue({
          items: itemsByVendor.get(vendorId) ?? [],
          returns: returnsByVendor.get(vendorId) ?? [],
          refundedGross: refundedGrossByVendor.get(vendorId) ?? 0
        })
      )
    }
  } catch {
    // garder le map à zéro, mais jamais planter le dashboard
  }

  return map
}

