import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertVendor } from '@/app/api/vendor/_helpers/auth'
import {
  fetchLatestModerationByReviewId,
  isPublicReviewStatus,
  mapReviewRowsToUiItems
} from '@/lib/product-reviews'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getVendorRevenueSnapshots, recomputeVendorRevenueLive, isPaidRevenueStatus } from '@/lib/vendor-revenue'

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

/** Calcule un montant de commission selon une règle, borné à [0, total]. */
function computeCommissionAmount(params: { totalAmount: number; rule: CommissionRuleRow | null }): number {
  const total = Number.isFinite(params.totalAmount) ? Math.max(0, params.totalAmount) : 0
  const rule = params.rule
  if (!rule || total <= 0) return 0

  const hybridPercentRaw = Number(rule.hybrid_percent ?? NaN)
  const hybridAmountRaw = Number(rule.hybrid_amount ?? NaN)

  const hasHybridPercent = Number.isFinite(hybridPercentRaw) && hybridPercentRaw > 0
  const hasHybridAmount = Number.isFinite(hybridAmountRaw) && hybridAmountRaw > 0

  const useHybrid = hasHybridPercent || hasHybridAmount

  const percent = useHybrid ? hybridPercentRaw : Number(rule.base_percent ?? 0)
  const fixed = useHybrid ? hybridAmountRaw : Number(rule.base_amount ?? 0)

  const percentSafe = Number.isFinite(percent) ? percent : 0
  const fixedSafe = Number.isFinite(fixed) ? fixed : 0
  const byPercent = total * (Math.max(0, percentSafe) / 100)
  const raw = byPercent + Math.max(0, fixedSafe)
  const commission = Number.isFinite(raw) ? raw : 0

  return Math.min(total, Math.max(0, commission))
}

 function toIsoDay(value: string | Date): string {
   const date = value instanceof Date ? value : new Date(value)
   if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10)
   return date.toISOString().slice(0, 10)
 }

 /**
  * Heuristique robuste pour considérer un statut de paiement comme "payé".
  * On évite d'être trop strict car certains providers renvoient des variantes (successful, succeeded, paid, etc.).
  */
 function isPaidLikeStatus(value: unknown): boolean {
   // SOURCE UNIQUE : même définition que lib/vendor-revenue.ts
   // ('paid', 'completed', 'successful', ...). 'completed' = PAYÉ.
   return isPaidRevenueStatus(value)
 }

 function isDeliveredLikeStatus(value: unknown): boolean {
  const s = typeof value === 'string' ? value.trim().toLowerCase() : ''
  if (!s) return false
  if (s === 'delivered') return true
  if (s === 'completed') return true
  if (s.includes('deliver')) return true
  if (s.includes('livr')) return true
  return false
 }

 function isEligibleForRevenue(order: any): boolean {
  const status = String(order?.status ?? '').trim().toLowerCase()
  if (status === 'cancelled' || status === 'canceled') return false
  const deliveryStatus = String(order?.delivery_status ?? order?.deliveryStatus ?? '').trim().toLowerCase()
  const paymentStatus = order?.payment_status
  return (
    isPaidLikeStatus(paymentStatus) ||
    isDeliveredLikeStatus(status) ||
    isDeliveredLikeStatus(deliveryStatus) ||
    isDeliveredLikeStatus(paymentStatus)
  )
 }

 /**
  * Agrège des commandes en série temporelle (jour) sur les N derniers jours.
  */
 function computeSalesEvolution(orders: any[], days: number) {
   const today = new Date()
   const start = new Date(today)
   start.setDate(start.getDate() - (days - 1))
   start.setHours(0, 0, 0, 0)

   const byDay = new Map<string, { revenue: number; ordersCount: number }>()

   for (const order of orders) {
     const createdAt = order?.created_at ?? order?.order_date
     if (!createdAt) continue
     const date = new Date(createdAt)
     if (Number.isNaN(date.getTime())) continue
     if (date < start) continue

     const dayKey = toIsoDay(date)
     const current = byDay.get(dayKey) ?? { revenue: 0, ordersCount: 0 }
     const total = Number(order?.total ?? order?.total_amount ?? 0)
     current.revenue += Number.isFinite(total) ? total : 0
     current.ordersCount += 1
     byDay.set(dayKey, current)
   }

   const out: Array<{ date: string; revenue: number; ordersCount: number }> = []
   for (let i = 0; i < days; i++) {
     const d = new Date(start)
     d.setDate(start.getDate() + i)
     const key = toIsoDay(d)
     const row = byDay.get(key) ?? { revenue: 0, ordersCount: 0 }
     out.push({ date: key, revenue: row.revenue, ordersCount: row.ordersCount })
   }
   return out
 }

 /**
  * Agrège des lignes `order_items` (avec join `orders`) en série temporelle (jour) sur les N derniers jours.
  */
 function computeSalesEvolutionFromItems(items: any[], days: number) {
   const today = new Date()
   const start = new Date(today)
   start.setDate(start.getDate() - (days - 1))
   start.setHours(0, 0, 0, 0)

   const byDay = new Map<string, { revenue: number; orderIds: Set<string> }>()

   for (const row of items) {
     const createdAt = row?.orders?.created_at
     if (!createdAt) continue
     const date = new Date(createdAt)
     if (Number.isNaN(date.getTime())) continue
     if (date < start) continue

     const dayKey = toIsoDay(date)
     const current = byDay.get(dayKey) ?? { revenue: 0, orderIds: new Set<string>() }

     const qty = Number(row?.quantity ?? 0)
     const totalPrice = Number(row?.total_price ?? NaN)
     const total = Number(row?.total ?? NaN)
     const unit = Number(row?.unit_price ?? row?.price ?? 0)
     const resolvedLineTotal =
       Number.isFinite(totalPrice) && totalPrice > 0
         ? totalPrice
         : Number.isFinite(total) && total > 0
           ? total
           : unit * (Number.isFinite(qty) ? qty : 0)

     current.revenue += Number.isFinite(resolvedLineTotal) ? resolvedLineTotal : 0

     const oid = row?.orders?.id
     if (oid) current.orderIds.add(String(oid))

     byDay.set(dayKey, current)
   }

   const out: Array<{ date: string; revenue: number; ordersCount: number }> = []
   for (let i = 0; i < days; i++) {
     const d = new Date(start)
     d.setDate(start.getDate() + i)
     const key = toIsoDay(d)
     const row = byDay.get(key)
     out.push({
       date: key,
       revenue: row?.revenue ?? 0,
       ordersCount: row ? row.orderIds.size : 0
     })
   }
   return out
 }

 /**
  * Calcule un top produits (quantité + CA) basé sur orders.order_items.
  */
 function computeTopProducts(orders: any[], limit: number) {
   const byProductId = new Map<
     string,
     { productId: string; name: string; sales: number; revenue: number }
   >()

   for (const order of orders) {
     const items = Array.isArray(order?.order_items) ? order.order_items : []
     for (const item of items) {
       const rawId = item?.product_id ?? item?.productId ?? item?.product
       if (!rawId) continue
       const productId = String(rawId)
       const current = byProductId.get(productId) ?? {
         productId,
         name: String(item?.product_name ?? item?.name ?? 'Produit'),
         sales: 0,
         revenue: 0
       }

       const qty = Number(item?.quantity ?? 0)
       const lineTotal = Number(item?.total_price ?? item?.total ?? 0)
       const unit = Number(item?.unit_price ?? item?.price ?? 0)
       const resolvedLineTotal = Number.isFinite(lineTotal) && lineTotal > 0 ? lineTotal : unit * qty

       current.sales += Number.isFinite(qty) ? qty : 0
       current.revenue += Number.isFinite(resolvedLineTotal) ? resolvedLineTotal : 0
       if (!current.name || current.name === 'Produit') {
         current.name = String(item?.product_name ?? item?.name ?? current.name)
       }

       byProductId.set(productId, current)
     }
   }

   return Array.from(byProductId.values())
     .sort((a, b) => {
       if (b.sales !== a.sales) return b.sales - a.sales
       return b.revenue - a.revenue
     })
     .slice(0, limit)
 }

/**
 * GET /api/vendor/dashboard
 * Retourne un sous-ensemble des données nécessaires au tableau de bord vendeur.
 * Objectif principal: synchroniser les KPI "Classement" et "Note moyenne" affichés dans l'UI.
 */
export async function GET(request: NextRequest) {
  try {
    const vendorId = await assertVendor(request)
    const supabase = getSupabaseAdmin()

    const { data: vendorProfile, error: vendorProfileErr } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', vendorId)
      .maybeSingle()

    if (vendorProfileErr) {
      console.warn('⚠️ GET /api/vendor/dashboard: vendor profile lookup failed:', vendorProfileErr)
    }

    const vendorIds = [vendorId]
    const profileId = (vendorProfile as any)?.id
    if (typeof profileId === 'string' && profileId.length > 0 && profileId !== vendorId) {
      vendorIds.push(profileId)
    }

    const salesPeriodDays = 30
    const now = new Date()
    const since = new Date(now)
    since.setDate(since.getDate() - salesPeriodDays)
    const sinceIso = since.toISOString()

    // Base: commandes vendeur (pour paymentHistory / cohérence)
    const { data: orderRows } = await supabase
      .from('orders')
      .select('id, vendor_id, created_at, status, delivery_status, total_amount, final_total, payment_status, currency')
      .in('vendor_id', vendorIds as any)
      .order('created_at', { ascending: false })
      .limit(2000)

    const orderIds = (orderRows ?? []).map((r: any) => r?.id).filter(Boolean) as string[]

    const ordersAll = Array.isArray(orderRows) ? (orderRows as any[]) : []
    const paidOrdersAllTime = ordersAll.filter((row) => isEligibleForRevenue(row))

    const paidOrdersRecent = paidOrdersAllTime.filter((row) => {
      const createdAt = row?.created_at
      if (!createdAt) return false
      return String(createdAt) >= sinceIso
    })

    const paidOrderIdSetAllTime = new Set<string>(paidOrdersAllTime.map((o) => String(o?.id ?? '')).filter(Boolean))
    const paidOrderIdSetRecent = new Set<string>(paidOrdersRecent.map((o) => String(o?.id ?? '')).filter(Boolean))

    // Totaux CA (toutes périodes + 30 jours) basés sur order_items des commandes "payées".
    // NB: on ne filtre pas côté SQL sur payment_status pour éviter des divergences (ex: "successful").
    const [allTimePaidItemsResult, recentPaidItemsResult] = await Promise.all([
      supabase
        .from('order_items')
        .select(
          `
            product_id,
            quantity,
            unit_price,
            total_price,
            orders!inner (
              id,
              vendor_id,
              payment_status,
              created_at
            )
          `
        )
        .in('orders.vendor_id', vendorIds as any)
        .limit(10_000),
      supabase
        .from('order_items')
        .select(
          `
            product_id,
            quantity,
            unit_price,
            total_price,
            orders!inner (
              id,
              vendor_id,
              payment_status,
              created_at
            )
          `
        )
        .in('orders.vendor_id', vendorIds as any)
        .gte('orders.created_at', sinceIso)
        .limit(10_000)
    ])

    const allTimeItemsRaw = Array.isArray(allTimePaidItemsResult.data) ? (allTimePaidItemsResult.data as any[]) : []
    const recentItemsRaw = Array.isArray(recentPaidItemsResult.data) ? (recentPaidItemsResult.data as any[]) : []

    const debug: any = {
      vendorId,
      vendorIds,
      counts: {
        ordersAll: ordersAll.length,
        paidOrdersAllTime: paidOrdersAllTime.length,
        paidOrdersRecent: paidOrdersRecent.length,
        allTimeItemsRaw: allTimeItemsRaw.length,
        recentItemsRaw: recentItemsRaw.length
      },
      errors: {
        allTimeItemsRaw: (allTimePaidItemsResult as any)?.error
          ? {
              code: String((allTimePaidItemsResult as any).error?.code ?? ''),
              message: String((allTimePaidItemsResult as any).error?.message ?? ''),
              details: String((allTimePaidItemsResult as any).error?.details ?? ''),
              hint: String((allTimePaidItemsResult as any).error?.hint ?? '')
            }
          : null,
        recentItemsRaw: (recentPaidItemsResult as any)?.error
          ? {
              code: String((recentPaidItemsResult as any).error?.code ?? ''),
              message: String((recentPaidItemsResult as any).error?.message ?? ''),
              details: String((recentPaidItemsResult as any).error?.details ?? ''),
              hint: String((recentPaidItemsResult as any).error?.hint ?? '')
            }
          : null
      },
      samples: {
        paidOrderIdsAllTime: paidOrdersAllTime.map((o) => String(o?.id ?? '')).filter(Boolean).slice(0, 5)
      }
    }

    let allTimePaidItems = allTimeItemsRaw.filter((row) => {
      const order = (row as any)?.orders
      return isEligibleForRevenue(order)
    })
    let recentPaidItems = recentItemsRaw.filter((row) => {
      const order = (row as any)?.orders
      return isEligibleForRevenue(order)
    })

    debug.counts.allTimePaidItemsAfterJoinFilter = allTimePaidItems.length
    debug.counts.recentPaidItemsAfterJoinFilter = recentPaidItems.length

    // Fallback: si la jointure order_items -> orders ne remonte pas (relations Supabase),
    // on récupère les items par order_id puis on re-attache les infos de commande depuis orderRows.
    if (allTimePaidItems.length === 0 && paidOrderIdSetAllTime.size > 0) {
      const paidOrderIds = Array.from(paidOrderIdSetAllTime).slice(0, 5000)
      const { data: fallbackItems, error: fallbackItemsErr } = await supabase
        .from('order_items')
        .select('order_id, product_id, quantity, unit_price, total_price')
        .in('order_id', paidOrderIds as any)
        .limit(10_000)

      if (fallbackItemsErr) {
        debug.errors.fallbackItemsByOrderIdAllTime = {
          code: String((fallbackItemsErr as any)?.code ?? ''),
          message: String((fallbackItemsErr as any)?.message ?? ''),
          details: String((fallbackItemsErr as any)?.details ?? ''),
          hint: String((fallbackItemsErr as any)?.hint ?? '')
        }
      }

      debug.counts.fallbackItemsByOrderIdAllTime = Array.isArray(fallbackItems) ? fallbackItems.length : 0

      const orderById = new Map<string, any>(ordersAll.map((o) => [String(o?.id ?? ''), o]))
      allTimePaidItems = (Array.isArray(fallbackItems) ? fallbackItems : [])
        .map((it: any) => ({ ...it, orders: orderById.get(String(it?.order_id ?? '')) ?? null }))
        .filter((row: any) => isEligibleForRevenue(row?.orders))
    }

    if (recentPaidItems.length === 0 && paidOrderIdSetRecent.size > 0) {
      const paidOrderIds = Array.from(paidOrderIdSetRecent).slice(0, 5000)
      const { data: fallbackItems, error: fallbackItemsErr } = await supabase
        .from('order_items')
        .select('order_id, product_id, quantity, unit_price, total_price')
        .in('order_id', paidOrderIds as any)
        .limit(10_000)

      if (fallbackItemsErr) {
        debug.errors.fallbackItemsByOrderIdRecent = {
          code: String((fallbackItemsErr as any)?.code ?? ''),
          message: String((fallbackItemsErr as any)?.message ?? ''),
          details: String((fallbackItemsErr as any)?.details ?? ''),
          hint: String((fallbackItemsErr as any)?.hint ?? '')
        }
      }

      debug.counts.fallbackItemsByOrderIdRecent = Array.isArray(fallbackItems) ? fallbackItems.length : 0

      const orderById = new Map<string, any>(ordersAll.map((o) => [String(o?.id ?? ''), o]))
      recentPaidItems = (Array.isArray(fallbackItems) ? fallbackItems : [])
        .map((it: any) => ({ ...it, orders: orderById.get(String(it?.order_id ?? '')) ?? null }))
        .filter((row: any) => isEligibleForRevenue(row?.orders))
    }

    // Fallback supplémentaire: si les items restent vides, on passe par la relation orders -> order_items.
    // Cela évite d'être bloqué par un schéma order_items non standard (ex: colonne order_id absente / join cassé).
    if (allTimePaidItems.length === 0 && paidOrdersAllTime.length > 0) {
      const paidOrderIds = paidOrdersAllTime.map((o) => String(o?.id ?? '')).filter(Boolean).slice(0, 2000)
      const { data: ordersWithItems, error: ordersWithItemsErr } = await supabase
        .from('orders')
        .select('id, vendor_id, payment_status, created_at, order_items (product_id, quantity, unit_price, total_price)')
        .in('id', paidOrderIds as any)
        .limit(2000)

      if (ordersWithItemsErr) {
        debug.errors.fallbackOrdersWithItemsAllTime = {
          code: String((ordersWithItemsErr as any)?.code ?? ''),
          message: String((ordersWithItemsErr as any)?.message ?? ''),
          details: String((ordersWithItemsErr as any)?.details ?? ''),
          hint: String((ordersWithItemsErr as any)?.hint ?? '')
        }
      }

      debug.counts.fallbackOrdersWithItemsAllTime = Array.isArray(ordersWithItems) ? ordersWithItems.length : 0
      debug.counts.fallbackOrdersWithItemsAllTimeItems = Array.isArray(ordersWithItems)
        ? (ordersWithItems as any[]).reduce((acc, o) => acc + (Array.isArray((o as any)?.order_items) ? (o as any).order_items.length : 0), 0)
        : 0

      const flattened: any[] = []
      for (const o of ordersWithItems ?? []) {
        const items = Array.isArray((o as any)?.order_items) ? (o as any).order_items : []
        for (const it of items) {
          flattened.push({
            ...it,
            orders: {
              id: (o as any)?.id,
              vendor_id: (o as any)?.vendor_id,
              payment_status: (o as any)?.payment_status,
              created_at: (o as any)?.created_at
            }
          })
        }
      }

      allTimePaidItems = flattened.filter((row) => isEligibleForRevenue((row as any)?.orders))
    }

    if (recentPaidItems.length === 0 && paidOrdersRecent.length > 0) {
      const paidOrderIds = paidOrdersRecent.map((o) => String(o?.id ?? '')).filter(Boolean).slice(0, 2000)
      const { data: ordersWithItems, error: ordersWithItemsErr } = await supabase
        .from('orders')
        .select('id, vendor_id, payment_status, created_at, order_items (product_id, quantity, unit_price, total_price)')
        .in('id', paidOrderIds as any)
        .limit(2000)

      if (ordersWithItemsErr) {
        debug.errors.fallbackOrdersWithItemsRecent = {
          code: String((ordersWithItemsErr as any)?.code ?? ''),
          message: String((ordersWithItemsErr as any)?.message ?? ''),
          details: String((ordersWithItemsErr as any)?.details ?? ''),
          hint: String((ordersWithItemsErr as any)?.hint ?? '')
        }
      }

      debug.counts.fallbackOrdersWithItemsRecent = Array.isArray(ordersWithItems) ? ordersWithItems.length : 0
      debug.counts.fallbackOrdersWithItemsRecentItems = Array.isArray(ordersWithItems)
        ? (ordersWithItems as any[]).reduce((acc, o) => acc + (Array.isArray((o as any)?.order_items) ? (o as any).order_items.length : 0), 0)
        : 0

      const flattened: any[] = []
      for (const o of ordersWithItems ?? []) {
        const items = Array.isArray((o as any)?.order_items) ? (o as any).order_items : []
        for (const it of items) {
          flattened.push({
            ...it,
            orders: {
              id: (o as any)?.id,
              vendor_id: (o as any)?.vendor_id,
              payment_status: (o as any)?.payment_status,
              created_at: (o as any)?.created_at
            }
          })
        }
      }

      recentPaidItems = flattened.filter((row) => isEligibleForRevenue((row as any)?.orders))
    }

    const sumItems = (rows: any[] | null | undefined) => {
      return (rows ?? []).reduce((acc, row) => {
        const totalPrice = Number((row as any)?.total_price ?? NaN)
        const total = Number((row as any)?.total ?? NaN)
        const qty = Number((row as any)?.quantity ?? 0)
        const unit = Number((row as any)?.unit_price ?? (row as any)?.price ?? 0)

        const resolved =
          Number.isFinite(totalPrice) && totalPrice > 0
            ? totalPrice
            : Number.isFinite(total) && total > 0
              ? total
              : unit * (Number.isFinite(qty) ? qty : 0)

        return acc + (Number.isFinite(resolved) ? resolved : 0)
      }, 0)
    }

    const totalRevenueAllTime = sumItems(allTimePaidItems)
    const totalRevenue30Days = sumItems(recentPaidItems)

    // Fallback si aucun paiement n'est marqué "paid": on somme les totaux côté orders (non annulées).
    let resolvedTotalRevenueAllTime = totalRevenueAllTime
    let resolvedTotalRevenue30Days = totalRevenue30Days

    if (resolvedTotalRevenueAllTime <= 0 && Array.isArray(orderRows)) {
      const rows = orderRows as any[]
      const sumOrders = (filterSinceIso?: string) => {
        return rows.reduce((acc, row) => {
          const createdAt = row?.created_at
          if (filterSinceIso && createdAt && String(createdAt) < filterSinceIso) return acc
          const status = String(row?.status ?? '').toLowerCase()
          if (status === 'cancelled') return acc
          const raw = row?.final_total != null ? row.final_total : row?.total_amount
          const total = Number(raw ?? 0)
          return acc + (Number.isFinite(total) ? total : 0)
        }, 0)
      }

      resolvedTotalRevenueAllTime = sumOrders()
      resolvedTotalRevenue30Days = sumOrders(sinceIso)
    }

    // Règle de commission (vendor > global)
    const ruleCache: { rule: CommissionRuleRow | null; loaded: boolean } = { rule: null, loaded: false }
    const getRuleForVendor = async (): Promise<CommissionRuleRow | null> => {
      if (ruleCache.loaded) return ruleCache.rule

      const { data: vendorRule } = await supabase
        .from('finance_commission_rules')
        .select('*')
        .eq('scope', 'vendor')
        .in('vendor_id', vendorIds as any)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (vendorRule) {
        ruleCache.rule = vendorRule as any
        ruleCache.loaded = true
        return ruleCache.rule
      }

      const { data: globalRule } = await supabase
        .from('finance_commission_rules')
        .select('*')
        .eq('scope', 'global')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      ruleCache.rule = (globalRule ?? null) as any
      ruleCache.loaded = true
      return ruleCache.rule
    }

    const commissionRule = await getRuleForVendor()

    const computeCommissionsFromItems = (rows: any[] | null | undefined) => {
      return (rows ?? []).reduce((acc, row) => {
        const totalPrice = Number((row as any)?.total_price ?? NaN)
        const total = Number((row as any)?.total ?? NaN)
        const qty = Number((row as any)?.quantity ?? 0)
        const unit = Number((row as any)?.unit_price ?? (row as any)?.price ?? 0)
        const resolved =
          Number.isFinite(totalPrice) && totalPrice > 0
            ? totalPrice
            : Number.isFinite(total) && total > 0
              ? total
              : unit * (Number.isFinite(qty) ? qty : 0)
        const gross = Number.isFinite(resolved) ? resolved : 0
        return acc + computeCommissionAmount({ totalAmount: gross, rule: commissionRule })
      }, 0)
    }

    const totalRevenue = Math.round(resolvedTotalRevenueAllTime)
    const totalCommissions = Math.round(computeCommissionsFromItems(allTimePaidItems))
    const netRevenue = Math.max(0, totalRevenue - totalCommissions)

    debug.counts.allTimePaidItemsFinal = allTimePaidItems.length
    debug.counts.recentPaidItemsFinal = recentPaidItems.length

    // salesEvolution + topProducts (30 jours)
    const salesEvolution =
      recentPaidItems.length > 0
        ? computeSalesEvolutionFromItems(recentPaidItems, salesPeriodDays)
        : computeSalesEvolution(paidOrdersRecent, salesPeriodDays)

    const topProductsSourceItems = recentPaidItems.length > 0 ? recentPaidItems : allTimePaidItems

    const topProductsRaw = (() => {
      const byProductId = new Map<string, { productId: string; name: string; sales: number; revenue: number }>()
      for (const item of topProductsSourceItems) {
        const rawId = (item as any)?.product_id ?? (item as any)?.productId ?? (item as any)?.product
        if (!rawId) continue
        const productId = String(rawId)
        const current = byProductId.get(productId) ?? {
          productId,
          name: String((item as any)?.product_name ?? (item as any)?.name ?? 'Produit'),
          sales: 0,
          revenue: 0
        }
        const qty = Number((item as any)?.quantity ?? 0)
        const totalPrice = Number((item as any)?.total_price ?? NaN)
        const total = Number((item as any)?.total ?? NaN)
        const unit = Number((item as any)?.unit_price ?? (item as any)?.price ?? 0)
        const resolvedLine =
          Number.isFinite(totalPrice) && totalPrice > 0
            ? totalPrice
            : Number.isFinite(total) && total > 0
              ? total
              : unit * (Number.isFinite(qty) ? qty : 0)
        current.sales += Number.isFinite(qty) ? qty : 0
        current.revenue += Number.isFinite(resolvedLine) ? resolvedLine : 0
        if (!current.name || current.name === 'Produit') {
          current.name = String((item as any)?.product_name ?? (item as any)?.name ?? current.name)
        }
        byProductId.set(productId, current)
      }
      return Array.from(byProductId.values())
        .sort((a, b) => {
          if (b.sales !== a.sales) return b.sales - a.sales
          return b.revenue - a.revenue
        })
        .slice(0, 5)
    })()

    const topProductIds = topProductsRaw
      .map((row) => row.productId)
      .filter((id) => typeof id === 'string' && id.length > 0)

    const { data: topProductRows } = topProductIds.length
      ? await supabase.from('user_products').select('id, name, main_image').in('id', topProductIds as any)
      : ({ data: [] } as any)

    const productById = new Map<string, any>()
    ;(topProductRows ?? []).forEach((row: any) => {
      if (row?.id) productById.set(String(row.id), row)
    })

    const topProducts = topProductsRaw.map((row) => {
      const product = productById.get(row.productId)
      return {
        id: row.productId,
        productId: row.productId,
        name: String(product?.name ?? row.name ?? 'Produit'),
        image: String(product?.main_image ?? ''),
        sales: row.sales,
        revenue: Math.round(row.revenue),
        shares: 0
      }
    })

    // monthlyRevenue/monthlyOrders (6 mois, all-time payés)
    const nowMonth = new Date()
    const monthKeys: string[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(nowMonth)
      d.setMonth(d.getMonth() - i)
      monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    }

    const monthlyRevenueByKey = new Map<string, number>(monthKeys.map((k) => [k, 0]))
    const monthlyOrdersByKey = new Map<string, Set<string>>(monthKeys.map((k) => [k, new Set<string>()]))

    const allTimeItems = allTimePaidItems
    if (allTimeItems.length > 0) {
      for (const row of allTimeItems) {
        const createdAt = (row as any)?.orders?.created_at
        if (!createdAt) continue
        const dt = new Date(createdAt)
        if (Number.isNaN(dt.getTime())) continue
        const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
        if (!monthlyRevenueByKey.has(key)) continue

        const qty = Number((row as any)?.quantity ?? 0)
        const totalPrice = Number((row as any)?.total_price ?? NaN)
        const total = Number((row as any)?.total ?? NaN)
        const unit = Number((row as any)?.unit_price ?? (row as any)?.price ?? 0)
        const resolvedLine =
          Number.isFinite(totalPrice) && totalPrice > 0
            ? totalPrice
            : Number.isFinite(total) && total > 0
              ? total
              : unit * (Number.isFinite(qty) ? qty : 0)

        monthlyRevenueByKey.set(key, (monthlyRevenueByKey.get(key) ?? 0) + (Number.isFinite(resolvedLine) ? resolvedLine : 0))
        const oid = (row as any)?.orders?.id
        if (oid) monthlyOrdersByKey.get(key)?.add(String(oid))
      }
    } else {
      // Fallback: si on n'a pas de lignes order_items payées, on construit l'évolution mensuelle depuis orders.
      for (const row of paidOrdersAllTime) {
        const createdAt = row?.created_at
        if (!createdAt) continue
        const dt = new Date(createdAt)
        if (Number.isNaN(dt.getTime())) continue
        const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
        if (!monthlyRevenueByKey.has(key)) continue

        const raw = row?.final_total != null ? row.final_total : row?.total_amount
        const total = Number(raw ?? 0)
        monthlyRevenueByKey.set(key, (monthlyRevenueByKey.get(key) ?? 0) + (Number.isFinite(total) ? total : 0))

        const oid = row?.id
        if (oid) monthlyOrdersByKey.get(key)?.add(String(oid))
      }
    }

    const monthlyRevenue = monthKeys.map((k) => Math.round(monthlyRevenueByKey.get(k) ?? 0))
    const monthlyOrders = monthKeys.map((k) => (monthlyOrdersByKey.get(k)?.size ?? 0))

    // revenueByCategory (all-time) via catégories Super Admin (product_categories)
    // Certains environnements n'ont PAS order_items.product_category_ids: on reconstruit via product_category_assignments.
    const allTimeProductIds = Array.from(
      new Set(
        allTimeItems
          .map((item: any) => String(item?.product_id ?? '').trim())
          .filter((id: string) => id.length > 0)
      )
    ).slice(0, 5000)

    const primaryCategoryIdByProductId = new Map<string, string>()
    const categoryNameById = new Map<string, string>()

    if (allTimeProductIds.length > 0) {
      const { data: assignmentRows, error: assignmentErr } = await supabase
        .from('product_category_assignments')
        .select('product_id, category_id')
        .in('product_id', allTimeProductIds as any)
        .limit(10_000)

      if (assignmentErr) {
        debug.errors.productCategoryAssignments = {
          code: String((assignmentErr as any)?.code ?? ''),
          message: String((assignmentErr as any)?.message ?? ''),
          details: String((assignmentErr as any)?.details ?? ''),
          hint: String((assignmentErr as any)?.hint ?? '')
        }
      }

      const categoryIds = Array.from(
        new Set(
          (assignmentRows ?? [])
            .map((row: any) => String(row?.category_id ?? '').trim())
            .filter((id: string) => id.length > 0)
        )
      ).slice(0, 5000)

      ;(assignmentRows ?? []).forEach((row: any) => {
        const pid = String(row?.product_id ?? '').trim()
        const cid = String(row?.category_id ?? '').trim()
        if (!pid || !cid) return
        if (!primaryCategoryIdByProductId.has(pid)) {
          primaryCategoryIdByProductId.set(pid, cid)
        }
      })

      if (categoryIds.length > 0) {
        const { data: categoryRows, error: categoryErr } = await supabase
          .from('product_categories')
          .select('id, name')
          .in('id', categoryIds as any)
          .limit(5000)

        if (categoryErr) {
          debug.errors.productCategories = {
            code: String((categoryErr as any)?.code ?? ''),
            message: String((categoryErr as any)?.message ?? ''),
            details: String((categoryErr as any)?.details ?? ''),
            hint: String((categoryErr as any)?.hint ?? '')
          }
        }

        for (const row of categoryRows ?? []) {
          const id = String((row as any)?.id ?? '').trim()
          const name = String((row as any)?.name ?? '').trim()
          if (id && name) categoryNameById.set(id, name)
        }
      }
    }

    const addItemToCategoryMap = (item: any) => {
      const qty = Number(item?.quantity ?? 0)
      const totalPrice = Number(item?.total_price ?? NaN)
      const unit = Number(item?.unit_price ?? 0)
      const resolvedLine =
        Number.isFinite(totalPrice) && totalPrice > 0
          ? totalPrice
          : unit * (Number.isFinite(qty) ? qty : 0)
      const safe = Number.isFinite(resolvedLine) ? resolvedLine : 0

      const productId = String(item?.product_id ?? '').trim()
      const primaryCategoryId = (productId && primaryCategoryIdByProductId.get(productId)) || ''
      const cat = (primaryCategoryId && categoryNameById.get(primaryCategoryId)) || 'Autres'
      revenueByCategoryMap.set(cat, (revenueByCategoryMap.get(cat) ?? 0) + safe)
    }

    const revenueByCategoryMap = new Map<string, number>()
    for (const item of allTimeItems) {
      addItemToCategoryMap(item)
    }

    if (revenueByCategoryMap.size === 0 && paidOrdersAllTime.length > 0) {
      const paidOrderIds = paidOrdersAllTime.map((o) => String(o?.id ?? '')).filter(Boolean).slice(0, 2000)
      const { data: ordersWithItems, error: ordersWithItemsErr } = await supabase
        .from('orders')
        .select('id, vendor_id, payment_status, created_at, order_items (product_id, quantity, unit_price, total_price)')
        .in('id', paidOrderIds as any)
        .limit(2000)

      if (ordersWithItemsErr) {
        console.warn('⚠️ GET /api/vendor/dashboard: fallback revenueByCategory orders->order_items failed:', ordersWithItemsErr)
      }

      for (const o of ordersWithItems ?? []) {
        const items = Array.isArray((o as any)?.order_items) ? (o as any).order_items : []
        for (const it of items) {
          addItemToCategoryMap(it)
        }
      }
    }

    const revenueByCategory = Array.from(revenueByCategoryMap.entries())
      .map(([category, revenue]) => ({ category, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 12)
      .map((row) => {
        const percentage = resolvedTotalRevenueAllTime > 0 ? (row.revenue / resolvedTotalRevenueAllTime) * 100 : 0
        return {
          category: row.category,
          revenue: Math.round(row.revenue),
          percentage: Math.max(0, Math.min(100, Number(percentage.toFixed(1))))
        }
      })

    // pendingPayments/completedPayments: finance_payment_requests
    const { data: paymentRequestRows } = await supabase
      .from('finance_payment_requests')
      .select('id, status, net_amount, created_at')
      .in('vendor_id', vendorIds as any)
      .order('created_at', { ascending: false })
      .limit(500)

    const reqs = Array.isArray(paymentRequestRows) ? paymentRequestRows : []
    const pendingPayments = reqs
      .filter((r: any) => String(r?.status ?? '').toLowerCase() === 'pending')
      .reduce((sum: number, r: any) => sum + Number(r?.net_amount ?? 0), 0)

    const completedPayments = reqs.filter((r: any) => {
      const s = String(r?.status ?? '').toLowerCase()
      return s === 'approved' || s === 'paid' || s === 'completed'
    }).length

    // Calcul direct des ventes totales (nombre d'articles vendus dans des commandes non annulées)
    const { data: itemCounts } = await supabase
      .from('order_items')
      .select('quantity, orders!inner(vendor_id, status)')
      .in('orders.vendor_id', vendorIds as any)
      .not('orders.status', 'in', '("cancelled", "canceled")')

    const totalItemsSold = (itemCounts ?? []).reduce((acc, it) => acc + (Number(it.quantity) || 0), 0)

    const { count: totalOrdersCount } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .in('vendor_id', vendorIds as any)
      .not('status', 'in', '("cancelled", "canceled")')

    // On prend le maximum entre le nombre d'articles soldés et le nombre de commandes
    const resolvedTotalSales = Math.max(totalItemsSold, Number(totalOrdersCount ?? 0), paidOrdersAllTime.length)

    // paymentHistory: order_payments
    const fetchOrderPayments = async () => {
      if (orderIds.length === 0) return [] as any[]
      const { data } = await supabase
        .from('order_payments')
        .select('id, amount, provider, status, paid_at, created_at, order_id, reference')
        .in('order_id', orderIds as any)
        .order('created_at', { ascending: false })
        .limit(50)
      return Array.isArray(data) ? (data as any[]) : []
    }

    let orderPaymentRows = await fetchOrderPayments()

    // Backfill idempotent: si des commandes éligibles existent mais que l'historique order_payments est incomplet,
    // on insère uniquement les paiements manquants (par order_id).
    if (paidOrdersAllTime.length > 0) {
      try {
        const paidOrdersForBackfill = paidOrdersAllTime.slice(0, 500)
        const backfillOrderIds = paidOrdersForBackfill.map((o) => String((o as any)?.id ?? '')).filter(Boolean)

        if (backfillOrderIds.length > 0) {
          const { data: existingPayments } = await supabase
            .from('order_payments')
            .select('order_id')
            .in('order_id', backfillOrderIds as any)
            .limit(2000)

          const alreadyPaidOrderIdSet = new Set<string>(
            (Array.isArray(existingPayments) ? existingPayments : [])
              .map((r: any) => String(r?.order_id ?? ''))
              .filter(Boolean)
          )

          const inserts = paidOrdersForBackfill
            .filter((o) => !alreadyPaidOrderIdSet.has(String((o as any)?.id ?? '')))
            .map((o) => {
              const rawAmount = (o as any)?.final_total != null ? (o as any).final_total : (o as any)?.total_amount
              const amount = Number(rawAmount ?? 0)
              const createdAt = String((o as any)?.created_at ?? new Date().toISOString())
              const paymentStatus = String((o as any)?.payment_status ?? 'completed')
              const currency = String((o as any)?.currency ?? 'XOF')
              return {
                order_id: String((o as any)?.id ?? ''),
                provider: 'system',
                reference: null,
                amount: Number.isFinite(amount) ? amount : 0,
                currency,
                status: paymentStatus,
                paid_at: createdAt,
                metadata: { source: 'dashboard_backfill' }
              }
            })
            .filter((row) => Boolean((row as any).order_id))

          if (inserts.length > 0) {
            const { error: insertErr } = await supabase.from('order_payments').insert(inserts as any)
            if (insertErr) {
              debug.errors.paymentHistoryBackfill = {
                code: String((insertErr as any)?.code ?? ''),
                message: String((insertErr as any)?.message ?? ''),
                details: String((insertErr as any)?.details ?? ''),
                hint: String((insertErr as any)?.hint ?? '')
              }
            }
          }
        }
      } catch (e) {
        debug.errors.paymentHistoryBackfillUnexpected = String(e)
      }

      orderPaymentRows = await fetchOrderPayments()
    }

    const paymentHistory = orderPaymentRows.map((p: any) => ({
      id: String(p?.id ?? ''),
      amount: Number(p?.amount ?? 0),
      date: String(p?.paid_at ?? p?.created_at ?? new Date().toISOString()),
      method: String(p?.provider ?? 'provider'),
      status: String(p?.status ?? 'unknown')
    }))

    // Ranking
    const { data: rankingRows, error: rankingErr } = await supabase
      .from('rankings')
      .select('*')
      .in('user_id', vendorIds as any)
      .order('created_at', { ascending: false })
      .limit(1)

    if (rankingErr) {
      console.warn('⚠️ GET /api/vendor/dashboard: rankings lookup failed:', rankingErr)
    }

    const rankingRow = Array.isArray(rankingRows) ? rankingRows[0] : null
    const rankingValueRaw =
      (rankingRow as any)?.overall_rank ??
      (rankingRow as any)?.overallRank ??
      (rankingRow as any)?.rank ??
      (rankingRow as any)?.ranking ??
      0

    const ranking = Number.isFinite(Number(rankingValueRaw)) ? Number(rankingValueRaw) : 0

    // Avis
    const { data: productIds, error: productErr } = await supabase
      .from('user_products')
      .select('id, name, main_image, vendor_id, category, subcategory')
      .in('vendor_id', vendorIds as any)

    if (productErr) {
      console.warn('⚠️ GET /api/vendor/dashboard: vendor products lookup failed:', productErr)
    }

    const vendorProducts = Array.isArray(productIds) ? productIds : []
    const ids = vendorProducts.map((row: any) => row?.id).filter((id: any) => typeof id === 'string') as string[]

    let averageRating = 0
    let totalReviews = 0
    let reviews: any[] = []

    if (ids.length > 0) {
      // Calcul global de la note moyenne sur TOUS les avis publics (pas seulement les 200 derniers)
      const { data: ratingStats, error: ratingStatsErr } = await supabase
        .from('product_reviews')
        .select('rating')
        .in('product_id', ids as any)
        .in('status', ['approved', 'published'])

      if (ratingStatsErr) {
        console.warn('⚠️ GET /api/vendor/dashboard: rating stats lookup failed:', ratingStatsErr)
      } else {
        const ratings = (ratingStats ?? []).map(r => Number(r.rating)).filter(n => Number.isFinite(n))
        totalReviews = ratings.length
        averageRating = totalReviews > 0
          ? Number((ratings.reduce((a, b) => a + b, 0) / totalReviews).toFixed(2))
          : 0
      }

      const { data: reviewRows, error: reviewErr } = await supabase
        .from('product_reviews')
        .select('id, product_id, user_id, rating, title, comment, is_verified_purchase, helpful_votes, created_at, updated_at, status, status_reason, moderated_at, moderated_by')
        .in('product_id', ids as any)
        .order('created_at', { ascending: false })
        .limit(200)

      if (reviewErr) {
        console.warn('⚠️ GET /api/vendor/dashboard: product reviews lookup failed:', reviewErr)
      } else {
        const rows = Array.isArray(reviewRows) ? reviewRows : []

        const reviewerIds = Array.from(
          new Set(
            rows
              .map((row: any) => row?.user_id)
              .filter((id: any) => typeof id === 'string') as string[]
          )
        )

        const reviewIds = Array.from(
          new Set(rows.map((row: any) => row?.id).filter((id: any) => typeof id === 'string') as string[])
        )

        const { data: reviewerProfiles, error: reviewerProfileErr } = reviewerIds.length
          ? await supabase
              .from('user_profiles')
              .select('user_id, first_name, last_name, avatar_url')
              .in('user_id', reviewerIds as any)
          : { data: [], error: null }

        if (reviewerProfileErr) {
          console.warn('⚠️ GET /api/vendor/dashboard: reviewer profiles lookup failed:', reviewerProfileErr)
        }

        const [{ data: responseRows, error: responseErr }, { data: flagRows, error: flagErr }] = await Promise.all([
          reviewIds.length
            ? supabase
                .from('product_review_responses')
                .select('id, review_id, vendor_id, content, status, created_at, updated_at')
                .in('review_id', reviewIds as any)
            : Promise.resolve({ data: [], error: null } as any),
          reviewIds.length
            ? supabase
                .from('product_review_flags')
                .select('id, review_id, reporter_id, reason, details, status, created_at')
                .in('review_id', reviewIds as any)
                .order('created_at', { ascending: false })
            : Promise.resolve({ data: [], error: null } as any)
        ])

        if (responseErr) {
          console.warn('⚠️ GET /api/vendor/dashboard: product review responses lookup failed:', responseErr)
        }
        if (flagErr) {
          console.warn('⚠️ GET /api/vendor/dashboard: product review flags lookup failed:', flagErr)
        }

        const responseByReviewId = new Map<string, any>()
        ;(responseRows ?? []).forEach((row: any) => {
          const rid = row?.review_id
          if (rid) {
            responseByReviewId.set(String(rid), row)
          }
        })

        const flagsByReviewId = new Map<string, any[]>()
        ;(flagRows ?? []).forEach((row: any) => {
          const rid = row?.review_id
          if (!rid) return
          const key = String(rid)
          const current = flagsByReviewId.get(key) ?? []
          current.push(row)
          flagsByReviewId.set(key, current)
        })

        const profileByUserId = new Map<string, any>()
        ;(reviewerProfiles ?? []).forEach((profile: any) => {
          if (profile?.user_id) {
            profileByUserId.set(String(profile.user_id), profile)
          }
        })

        const productById = new Map<string, any>()
        vendorProducts.forEach((product: any) => {
          if (product?.id) {
            productById.set(String(product.id), product)
          }
        })

        const moderationByReviewId = await fetchLatestModerationByReviewId(supabase, reviewIds)

        reviews = mapReviewRowsToUiItems({
          rows,
          productsById: productById,
          profileByUserId,
          responseByReviewId,
          flagsByReviewId,
          moderationByReviewId
        })
      }
    }

    // Total vendeurs
    const { count: totalVendorsCount, error: vendorCountErr } = await supabase
      .from('vendor_stats')
      .select('id', { count: 'exact', head: true })

    if (vendorCountErr) {
      console.warn('⚠️ GET /api/vendor/dashboard: vendor_stats count failed:', vendorCountErr)
    }

    const totalVendors = Number(totalVendorsCount ?? 0)

    // Calcul du taux de réponse et temps de réponse
    let responseRate = 0
    let averageResponseTime = 0 // en minutes
    try {
      const { data: chats } = await supabase
        .from('user_chats')
        .select('id, participant1_id, participant2_id')
        .or(`participant1_id.eq.${vendorId},participant2_id.eq.${vendorId}`)

      if (chats && chats.length > 0) {
        const chatIds = chats.map(c => c.id)
        const { data: messages } = await supabase
          .from('chat_messages')
          .select('chat_id, sender_id, created_at')
          .in('chat_id', chatIds)
          .order('created_at', { ascending: true })

        if (messages && messages.length > 0) {
          const chatData = new Map<string, { 
            clientMsgTime: number | null, 
            responded: boolean,
            responseTime: number | null
          }>()
          
          messages.forEach(msg => {
            const chatId = msg.chat_id
            const isVendor = msg.sender_id === vendorId
            const msgTime = new Date(msg.created_at).getTime()
            
            if (!chatData.has(chatId)) {
              chatData.set(chatId, { 
                clientMsgTime: !isVendor ? msgTime : null, 
                responded: false,
                responseTime: null
              })
            } else {
              const current = chatData.get(chatId)!
              // Si c'est le premier message du client qu'on voit
              if (!isVendor && current.clientMsgTime === null) {
                current.clientMsgTime = msgTime
              }
              // Si c'est une réponse du vendeur à un message client non encore répondu
              if (isVendor && current.clientMsgTime !== null && !current.responded) {
                current.responded = true
                current.responseTime = (msgTime - current.clientMsgTime) / (1000 * 60) // minutes
              }
            }
          })

          const chatsWithClientMsg = Array.from(chatData.values()).filter(c => c.clientMsgTime !== null)
          const respondedChats = chatsWithClientMsg.filter(c => c.responded)
          
          responseRate = chatsWithClientMsg.length > 0 
            ? Math.round((respondedChats.length / chatsWithClientMsg.length) * 100)
            : 100 // 100% par défaut si aucune sollicitation

          const responseTimes = respondedChats
            .map(c => c.responseTime)
            .filter((t): t is number => t !== null)

          averageResponseTime = responseTimes.length > 0
            ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
            : 0
        }
      }
    } catch (e) {
      console.warn('⚠️ Erreur calcul stats chat:', e)
    }

    // ── SOURCE UNIQUE DE VÉRITÉ : CA vendeur depuis le snapshot (O(1)) ─────
    // Le CA affiché partout (carte "Chiffre d'affaires", RevenueManagement, analytics)
    // doit provenir de `vendor_revenue_snapshot` maintenu par triggers = CA = ventes
    // payées − retours. Fallback : recalcul en direct via les mêmes règles.
    const revenueSnapshots = await getVendorRevenueSnapshots(supabase, vendorIds)
    let canonicalRevenue = revenueSnapshots.get(String(vendorId))
    if (
      !canonicalRevenue ||
      (canonicalRevenue.totalRevenue === 0 && canonicalRevenue.ordersCount === 0 && resolvedTotalRevenueAllTime > 0)
    ) {
      const live = await recomputeVendorRevenueLive(supabase, vendorIds)
      canonicalRevenue = live.get(String(vendorId)) ?? canonicalRevenue
    }
    const canonicalTotalRevenue = canonicalRevenue?.totalRevenue ?? Math.round(resolvedTotalRevenueAllTime)
    const canonicalReturnsAmount = canonicalRevenue?.returnsAmount ?? 0
    const canonicalNetRevenue = canonicalRevenue?.netRevenue ?? canonicalTotalRevenue

    return NextResponse.json(
      {
        data: {
          debug,
          stats: {
            totalSales: resolvedTotalSales,
            totalRevenue: canonicalTotalRevenue,
            totalCommissions,
            returnsAmount: canonicalReturnsAmount,
            netRevenue: canonicalNetRevenue,
            averageRating,
            totalReviews,
            ranking,
            totalVendors,
            responseRate,
            averageResponseTime
          },
          revenue: {
            totalRevenue: canonicalTotalRevenue,
            totalRevenueAllTime: canonicalTotalRevenue,
            totalRevenue30Days: Math.min(canonicalTotalRevenue, Math.round(resolvedTotalRevenue30Days)),
            returnsAmount: canonicalReturnsAmount,
            netRevenue: canonicalNetRevenue,
            totalCommissions,
            pendingPayments: Math.round(pendingPayments),
            completedPayments,
            monthlyRevenue,
            monthlyOrders,
            salesEvolution,
            topProducts,
            revenueByCategory,
            paymentHistory,
            monthKeys
          },
          rankings: rankingRow ? [rankingRow] : [],
          reviews
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ GET /api/vendor/dashboard unexpected error:', error)
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const status = message.toLowerCase().includes('accès') ? 403 : message.toLowerCase().includes('token') ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
