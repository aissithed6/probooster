import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'

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
 * Analytics basées sur les événements, demandes et remboursements.
 */
export async function GET(request: NextRequest) {
  try {
    await assertSuperAdmin(request)
    const supabase = getSupabaseAdmin()

    const now = new Date()
    const start = new Date(now.getTime() - 30 * 24 * 3600 * 1000)
    const startIso = start.toISOString()
    const endIso = now.toISOString()
    const paidStatuses = ['paid', 'completed']

    // Charger données nécessaires
    const [evtsRes, reqsRes, rfRes] = await Promise.all([
      supabase.from('finance_payment_request_events').select('occurred_at'),
      supabase.from('finance_payment_requests').select('created_at, processed_at, status'),
      supabase.from('finance_refunds').select('opened_at, amount')
    ])

    if (evtsRes.error || reqsRes.error || rfRes.error) {
      return NextResponse.json({})
    }

    const events = evtsRes.data ?? []
    const requests = reqsRes.data ?? []
    const refunds = rfRes.data ?? []

    // totalOperations: nombre d'événements enregistrés
    const totalOperations = events.length

    // averagePayoutTime: moyenne (en heures) entre created_at et processed_at pour demandes approuvées
    const approved = requests.filter((r: any) => r.status === 'approved' && r.processed_at && r.created_at)
    const avgHours = approved.length
      ? Math.round(
          approved
            .map((r: any) => (new Date(r.processed_at).getTime() - new Date(r.created_at).getTime()) / 3600000)
            .reduce((a: number, b: number) => a + b, 0) / approved.length
        )
      : 0

    // fraudAlerts: proxy simple = nombre de remboursements > 0 sur 7 jours
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000)
    const fraudAlerts = refunds.filter((r: any) => r.opened_at && new Date(r.opened_at) >= sevenDaysAgo).length

    // operationsTimeline: distribution par jour (Lun..Dim) sur les 7 derniers jours
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
    const counts = new Map<string, number>(days.map((d) => [d, 0]))
    events.forEach((e: any) => {
      const d = new Date(e.occurred_at)
      if (d >= sevenDaysAgo) {
        const label = days[d.getDay()]
        counts.set(label, (counts.get(label) || 0) + 1)
      }
    })
    const operationsTimeline = days.map((label) => ({ label, value: counts.get(label) || 0 }))

    const productAgg = new Map<
      string,
      {
        orders: Set<string>
        totalRevenue: number
        netRevenue: number
      }
    >()

    const userAgg = new Map<
      string,
      {
        totalSpent: number
        commissionGenerated: number
        lastPurchase: string | null
      }
    >()

    /**
     * Charge une page de commandes payées sur la période [startIso, endIso]
     * avec leurs lignes (order_items). Sert à construire les agrégats Analyse.
     */
    const fetchOrdersPage = async (page: number, pageSize: number) => {
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      const res = await supabase
        .from('orders')
        .select(
          `
          id,
          customer_id,
          vendor_id,
          total_amount,
          final_total,
          created_at,
          payment_status,
          order_items (
            product_id,
            quantity,
            total_price
          )
        `
        )
        .gte('created_at', startIso)
        .lte('created_at', endIso)
        .in('payment_status', paidStatuses)
        .order('created_at', { ascending: false })
        .range(from, to)

      if (res.error) throw res.error
      return res.data ?? []
    }

    const pageSize = 500
    let page = 1

    const globalRuleCache: { rule: CommissionRuleRow | null; loaded: boolean } = { rule: null, loaded: false }
    const vendorRuleCache = new Map<string, CommissionRuleRow | null>()

    const getRuleForVendor = async (vendorId: string | null): Promise<CommissionRuleRow | null> => {
      if (!vendorId) {
        if (globalRuleCache.loaded) return globalRuleCache.rule
        const { data: globalRule } = await supabase
          .from('finance_commission_rules')
          .select('*')
          .eq('scope', 'global')
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        globalRuleCache.rule = (globalRule ?? null) as any
        globalRuleCache.loaded = true
        return globalRuleCache.rule
      }

      if (vendorRuleCache.has(vendorId)) return vendorRuleCache.get(vendorId) ?? null

      const { data: vendorRule } = await supabase
        .from('finance_commission_rules')
        .select('*')
        .eq('scope', 'vendor')
        .eq('vendor_id', vendorId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (vendorRule) {
        vendorRuleCache.set(vendorId, vendorRule as any)
        return vendorRule as any
      }

      const fallback = await getRuleForVendor(null)
      vendorRuleCache.set(vendorId, fallback)
      return fallback
    }
    while (true) {
      const orders = await fetchOrdersPage(page, pageSize)
      if (orders.length === 0) break

      for (const order of orders as any[]) {
        const orderId = typeof order?.id === 'string' ? order.id : ''
        const customerId = typeof order?.customer_id === 'string' ? order.customer_id : ''
        const vendorId = typeof order?.vendor_id === 'string' ? order.vendor_id : ''
        const createdAt = typeof order?.created_at === 'string' ? order.created_at : null
        const gross = Number(order?.final_total ?? order?.total_amount ?? 0) || 0
        const rule = await getRuleForVendor(vendorId || null)
        const commission = computeCommissionAmount({ totalAmount: gross, rule })
        const totalAmount = Number(order?.total_amount ?? gross ?? 0) || 0
        const items = Array.isArray(order?.order_items) ? order.order_items : []

        if (customerId) {
          const bucket = userAgg.get(customerId) ?? { totalSpent: 0, commissionGenerated: 0, lastPurchase: null }
          bucket.totalSpent += gross
          bucket.commissionGenerated += commission
          if (createdAt && (!bucket.lastPurchase || createdAt > bucket.lastPurchase)) {
            bucket.lastPurchase = createdAt
          }
          userAgg.set(customerId, bucket)
        }

        if (!orderId || items.length === 0) continue

        for (const it of items as any[]) {
          const productId = typeof it?.product_id === 'string' ? it.product_id : ''
          if (!productId) continue

          const itemRevenue = Number(it?.total_price ?? 0) || 0
          const ratio = totalAmount > 0 ? itemRevenue / totalAmount : 0
          const allocatedCommission = commission > 0 ? commission * ratio : 0
          const itemNet = itemRevenue - allocatedCommission

          const pBucket = productAgg.get(productId) ?? { orders: new Set<string>(), totalRevenue: 0, netRevenue: 0 }
          if (orderId) pBucket.orders.add(orderId)
          pBucket.totalRevenue += itemRevenue
          pBucket.netRevenue += itemNet
          productAgg.set(productId, pBucket)
        }
      }

      if (orders.length < pageSize) break
      page += 1
      if (page > 200) break
    }

    const productIds = Array.from(productAgg.keys())
    const userIds = Array.from(userAgg.keys())

    const productNameById = new Map<string, string>()
    if (productIds.length > 0) {
      const batchSize = 500
      for (let i = 0; i < productIds.length; i += batchSize) {
        const batch = productIds.slice(i, i + batchSize)
        const { data } = await supabase.from('user_products').select('id, name').in('id', batch as any)
        for (const row of data ?? []) {
          const id = typeof (row as any)?.id === 'string' ? (row as any).id : ''
          if (!id) continue
          productNameById.set(id, String((row as any)?.name ?? 'Produit'))
        }
      }
    }

    const profileByUserId = new Map<string, { firstName: string; lastName: string }>()
    const emailByUserId = new Map<string, string>()
    if (userIds.length > 0) {
      const batchSize = 500
      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize)
        const [profilesRes, usersRes] = await Promise.all([
          supabase.from('user_profiles').select('user_id, first_name, last_name').in('user_id', batch as any),
          supabase.from('users').select('id, email').in('id', batch as any)
        ])

        for (const row of profilesRes.data ?? []) {
          const id = typeof (row as any)?.user_id === 'string' ? (row as any).user_id : ''
          if (!id) continue
          profileByUserId.set(id, {
            firstName: String((row as any)?.first_name ?? ''),
            lastName: String((row as any)?.last_name ?? '')
          })
        }

        for (const row of usersRes.data ?? []) {
          const id = typeof (row as any)?.id === 'string' ? (row as any).id : ''
          if (!id) continue
          emailByUserId.set(id, String((row as any)?.email ?? ''))
        }
      }
    }

    const productRevenues = Array.from(productAgg.entries())
      .map(([productId, v]) => {
        const totalRevenue = Number.isFinite(v.totalRevenue) ? v.totalRevenue : 0
        const netRevenue = Number.isFinite(v.netRevenue) ? v.netRevenue : 0
        const marginRate = totalRevenue > 0 ? Math.round((netRevenue / totalRevenue) * 100) : 0
        return {
          productId,
          productName: productNameById.get(productId) ?? 'Produit',
          orders: v.orders.size,
          totalRevenue,
          netRevenue,
          marginRate
        }
      })
      .sort((a, b) => b.totalRevenue - a.totalRevenue)

    const userRevenues = Array.from(userAgg.entries())
      .map(([userId, v]) => {
        const profile = profileByUserId.get(userId)
        const fullName = `${profile?.firstName ?? ''} ${profile?.lastName ?? ''}`.trim()
        return {
          userId,
          userName: fullName || userId,
          userEmail: emailByUserId.get(userId) ?? '',
          totalSpent: v.totalSpent,
          commissionGenerated: v.commissionGenerated,
          lastPurchase: v.lastPurchase ?? undefined
        }
      })
      .sort((a, b) => b.totalSpent - a.totalSpent)

    return NextResponse.json({
      totalOperations,
      averagePayoutTime: avgHours,
      fraudAlerts,
      operationsTimeline,
      productRevenues,
      userRevenues
    })
  } catch (_) {
    return NextResponse.json({})
  }
}
