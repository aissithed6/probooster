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

type BackfillPayload = {
  limit?: number
  dryRun?: boolean
}

/**
 * POST /api/finance/transactions/backfill
 *
 * Backfill idempotent: génère les écritures manquantes dans finance_transactions (et cash flow entrant)
 * à partir des commandes déjà payées (orders.payment_status = 'completed').
 *
 * Sécurité: réservé au super admin.
 */
export async function POST(request: NextRequest) {
  try {
    await assertSuperAdmin(request)

    const supabase = getSupabaseAdmin()
    const body = (await request.json().catch(() => null)) as BackfillPayload | null

    const limit = Math.min(5000, Math.max(1, Number(body?.limit ?? 2000)))
    const dryRun = Boolean(body?.dryRun)

    const { data: orders, error: ordersErr } = await supabase
      .from('orders')
      .select('id, vendor_id, total_amount, final_total, created_at, updated_at, order_number, payment_status')
      .in('payment_status', ['completed', 'paid', 'succeeded'] as any)
      .order('updated_at', { ascending: false })
      .limit(limit)

    if (ordersErr) {
      return NextResponse.json({ error: ordersErr.message }, { status: 500 })
    }

    const paidOrders = Array.isArray(orders) ? orders : []
    const orderIds = paidOrders.map((o: any) => String(o?.id ?? '')).filter(Boolean)

    if (orderIds.length === 0) {
      return NextResponse.json({
        scanned: 0,
        financeTransactionsInserted: 0,
        cashFlowInserted: 0,
        dryRun
      })
    }

    // Cherche les écritures déjà existantes pour éviter les doublons
    const { data: existingTxRows } = await supabase
      .from('finance_transactions')
      .select('order_id')
      .in('order_id', orderIds as any)

    const existingTxOrderIds = new Set<string>((existingTxRows ?? []).map((r: any) => String(r.order_id)))

    const missingOrders = paidOrders.filter((o: any) => !existingTxOrderIds.has(String(o?.id ?? '')))

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

    const financeRows: any[] = []
    for (const o of missingOrders) {
      const gross = Number(o?.final_total ?? o?.total_amount ?? 0) || 0
      const occurredAt = o?.updated_at || o?.created_at || new Date().toISOString()
      const vendorId = o?.vendor_id ? String(o.vendor_id) : null
      const rule = await getRuleForVendor(vendorId)
      const commission = computeCommissionAmount({ totalAmount: gross, rule })
      financeRows.push({
        order_id: String(o.id),
        vendor_id: vendorId,
        vendor_name: null,
        gross_amount: gross,
        commission_taken: commission,
        net_amount: Math.max(0, gross - commission),
        status: 'paid',
        occurred_at: occurredAt
      })
    }

    // Cash flow entrant (client)
    const cashLabels = missingOrders.map((o: any) => `Commande #${String(o.id)}`)
    const { data: existingCashRows } = cashLabels.length
      ? await supabase
          .from('finance_cash_flow')
          .select('label')
          .eq('direction', 'in')
          .eq('category', 'customer')
          .in('label', cashLabels as any)
      : ({ data: [] } as any)

    const existingCashLabels = new Set<string>((existingCashRows ?? []).map((r: any) => String(r.label)))

    const cashRows = missingOrders
      .filter((o: any) => !existingCashLabels.has(`Commande #${String(o.id)}`))
      .map((o: any) => {
        const gross = Number(o?.final_total ?? o?.total_amount ?? 0) || 0
        const occurredAt = o?.updated_at || o?.created_at || new Date().toISOString()
        return {
          direction: 'in',
          category: 'customer',
          label: `Commande #${String(o.id)}`,
          amount: gross,
          occurred_at: occurredAt
        }
      })

    if (!dryRun) {
      if (financeRows.length) {
        const { error: insertErr } = await supabase.from('finance_transactions').insert(financeRows as any)
        if (insertErr) {
          return NextResponse.json({ error: insertErr.message, hint: 'Insertion finance_transactions échouée.' }, { status: 500 })
        }
      }

      if (cashRows.length) {
        const { error: insertCashErr } = await supabase.from('finance_cash_flow').insert(cashRows as any)
        if (insertCashErr) {
          return NextResponse.json({ error: insertCashErr.message, hint: 'Insertion finance_cash_flow échouée.' }, { status: 500 })
        }
      }
    }

    return NextResponse.json({
      scanned: paidOrders.length,
      missing: missingOrders.length,
      financeTransactionsInserted: financeRows.length,
      cashFlowInserted: cashRows.length,
      dryRun
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const status = message.toLowerCase().includes('accès') ? 403 : message.toLowerCase().includes('token') ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
