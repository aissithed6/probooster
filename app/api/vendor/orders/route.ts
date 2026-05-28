import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertVendor } from '../_helpers/auth'
import { getSupabaseAdmin } from '../../../../lib/supabase'
import { OrderRepository } from '../../../../lib/repositories/order-repository'

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

function resolveOrderItemGross(item: any): number {
  const totalPrice = Number(item?.total_price ?? NaN)
  const total = Number(item?.total ?? NaN)
  const qty = Number(item?.quantity ?? 0)
  const unit = Number(item?.unit_price ?? item?.price ?? 0)
  const resolved =
    Number.isFinite(totalPrice) && totalPrice > 0
      ? totalPrice
      : Number.isFinite(total) && total > 0
        ? total
        : unit * (Number.isFinite(qty) ? qty : 0)
  return Number.isFinite(resolved) ? Math.max(0, resolved) : 0
}

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

function resolveSharePurchaseHistory(preferences: unknown): boolean {
  const prefs = asObject(preferences)
  const privacy = asObject((prefs as any)?.privacy)
  const raw = (privacy as any)?.sharePurchaseHistory
  if (typeof raw === 'boolean') return raw
  if (raw === 1 || raw === '1' || raw === 'true') return true
  if (raw === 0 || raw === '0' || raw === 'false') return false
  return false
}

/**
 * GET /api/vendor/orders
 * Retourne les commandes du vendeur connecté (orders + order_items) pour affichage dashboard vendeur.
 */
export async function GET(request: NextRequest) {
  try {
    const vendorId = await assertVendor(request)
    const supabase = getSupabaseAdmin()

    const { data: vendorProfile, error: vendorProfileError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', vendorId)
      .maybeSingle()

    if (vendorProfileError) {
      console.warn('⚠️ GET /api/vendor/orders: user_profiles lookup failed:', vendorProfileError)
    }

    const vendorIds = [vendorId]
    const profileId = (vendorProfile as any)?.id
    if (typeof profileId === 'string' && profileId.length > 0 && profileId !== vendorId) {
      vendorIds.push(profileId)
    }

    // Commission rule (vendor > global)
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
          order_items (*)
        `
      )
      .in('vendor_id', vendorIds)
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) {
      console.error('❌ GET /api/vendor/orders failed:', error)
      const details = {
        message: (error as any)?.message ?? null,
        details: (error as any)?.details ?? null,
        hint: (error as any)?.hint ?? null,
        code: (error as any)?.code ?? null
      }
      const isDev = process.env.NODE_ENV !== 'production'
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des commandes.', ...(isDev ? { debug: details } : {}) },
        { status: 500 }
      )
    }

    const enriched = await OrderRepository['enrichOrders']((data ?? []) as any).catch(() => data ?? [])

    const orders = Array.isArray(enriched) ? enriched : []

    // Compute commission/net per order, consistent with /api/vendor/dashboard
    const ordersWithFinance = orders.map((o: any) => {
      const items = Array.isArray(o?.order_items) ? o.order_items : []
      const commissionAmount = items.reduce((acc: number, it: any) => {
        const gross = resolveOrderItemGross(it)
        return acc + computeCommissionAmount({ totalAmount: gross, rule: commissionRule })
      }, 0)

      const rawTotal = o?.final_total != null ? o.final_total : o?.total_amount
      const grossOrder = Number(rawTotal ?? o?.total ?? 0)
      const grossSafe = Number.isFinite(grossOrder) ? grossOrder : 0
      const netAmount = Math.max(0, grossSafe - (Number.isFinite(commissionAmount) ? commissionAmount : 0))

      return {
        ...o,
        commission_amount: Math.round(commissionAmount),
        net_amount: Math.round(netAmount)
      }
    })

    /**
     * Associe les commandes à une demande de paiement en cours (finance_payment_requests.status=pending).
     * Permet de synchroniser l'UI "Demande de paiement" et d'éviter les doubles demandes.
     */
    const pendingRequestMetaByOrderId = new Map<string, { createdAt: string; requestId: string }>()
    try {
      const { data: pendingRequests } = await supabase
        .from('finance_payment_requests')
        .select('id, status, order_ids, created_at')
        .in('vendor_id', vendorIds as any)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(200)

      for (const req of pendingRequests ?? []) {
        const createdAt = String((req as any)?.created_at ?? '')
        const requestId = String((req as any)?.id ?? '')
        const orderIds = Array.isArray((req as any)?.order_ids) ? ((req as any).order_ids as any[]) : []
        for (const oid of orderIds) {
          const id = String(oid ?? '').trim()
          if (!id) continue
          if (!pendingRequestMetaByOrderId.has(id)) {
            pendingRequestMetaByOrderId.set(id, { createdAt, requestId })
          }
        }
      }
    } catch {
      // Ne pas bloquer le dashboard si la jointure finance échoue.
    }

    const ordersWithFinanceAndRequests = ordersWithFinance.map((o: any) => {
      const oid = String(o?.id ?? '').trim()
      const meta = oid ? pendingRequestMetaByOrderId.get(oid) : undefined
      return {
        ...o,
        is_payment_requested: Boolean(meta),
        payment_request_date: meta?.createdAt ?? null,
        payment_request_id: meta?.requestId ?? null
      }
    })
    const customerIds = Array.from(
      new Set(
        orders
          .map((o: any) => String(o?.customer_id ?? '').trim())
          .filter((id: string) => id.length > 0)
      )
    ).slice(0, 200)

    const shareAllowedByCustomerId = new Map<string, boolean>()
    if (customerIds.length > 0) {
      try {
        const { data: customerProfiles } = await supabase
          .from('user_profiles')
          .select('user_id, preferences')
          .in('user_id', customerIds as any)
          .limit(500)

        for (const row of customerProfiles ?? []) {
          const uid = typeof (row as any)?.user_id === 'string' ? String((row as any).user_id).trim() : ''
          if (!uid) continue
          shareAllowedByCustomerId.set(uid, resolveSharePurchaseHistory((row as any)?.preferences))
        }
      } catch {
        // noop
      }
    }

    const sanitized = ordersWithFinanceAndRequests.map((o: any) => {
      const cid = String(o?.customer_id ?? '').trim()
      const allowed = cid ? (shareAllowedByCustomerId.get(cid) ?? false) : false
      if (allowed) return o
      return {
        ...o,
        customer_name: 'Client',
        customer_email: null,
        customer_phone: null
      }
    })

    return NextResponse.json({ data: sanitized }, { status: 200 })
  } catch (error) {
    console.error('❌ GET /api/vendor/orders unexpected error:', error)
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const status = message.toLowerCase().includes('accès') ? 403 : message.toLowerCase().includes('token') ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
