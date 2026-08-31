import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { getSupabaseAdmin } from '@/lib/supabase'
import { assertVendorOrSuperAdmin } from '@/app/api/vendor/_helpers/auth'

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

function toNumber(value: unknown): number {
  const n = Number(value ?? 0)
  return Number.isFinite(n) ? n : 0
}

/**
 * GET /api/finance/payment-schedules/eligible?mine=true
 * Retourne les commandes éligibles à la planification (vendeur connecté):
 * - commandes payées (payment_status paid-like)
 * - appartenant au vendeur
 * - non déjà présentes dans finance_payment_schedules
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const mine = url.searchParams.get('mine')
    if (mine !== 'true') {
      return NextResponse.json({ error: 'Paramètre mine=true requis.' }, { status: 400 })
    }

    const vendorUserId = await assertVendorOrSuperAdmin(request)
    const supabase = getSupabaseAdmin()

    // Certains environnements stockent vendor_id sur user_profiles.id, d'autres sur users.id.
    const { data: vendorProfile, error: vendorProfileError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', vendorUserId)
      .maybeSingle()

    if (vendorProfileError) {
      console.warn('⚠️ GET /api/finance/payment-schedules/eligible: user_profiles lookup failed:', vendorProfileError)
    }

    const vendorIds = [vendorUserId]
    const profileId = (vendorProfile as any)?.id
    if (typeof profileId === 'string' && profileId.length > 0 && profileId !== vendorUserId) {
      vendorIds.push(profileId)
    }

    // Exclut les commandes déjà planifiées pour ce vendorUserId (c'est la valeur stockée dans finance_payment_schedules.vendor_id)
    const { data: scheduledRows, error: scheduledErr } = await supabase
      .from('finance_payment_schedules')
      .select('order_id')
      .eq('vendor_id', vendorUserId)
      .limit(5000)

    if (scheduledErr) {
      console.error('❌ GET /api/finance/payment-schedules/eligible: schedules fetch failed:', scheduledErr)
      return NextResponse.json({ error: 'Impossible de charger les paiements planifiés.' }, { status: 500 })
    }

    const scheduledOrderIds = new Set(
      (Array.isArray(scheduledRows) ? scheduledRows : []).map((r: any) => String(r?.order_id ?? '')).filter((x) => x.length > 0)
    )

    const paidLikeStatuses = ['paid', 'succeeded', 'success', 'completed', 'complete']

    const { data: orders, error: ordersErr } = await supabase
      .from('orders')
      .select('id, vendor_id, customer_name, final_total, total_amount, payment_status, status, created_at')
      .in('vendor_id', vendorIds as any)
      .in('payment_status', paidLikeStatuses as any)
      .in('status', ['delivered'] as any)
      .order('created_at', { ascending: false })
      .limit(5000)

    if (ordersErr) {
      console.error('❌ GET /api/finance/payment-schedules/eligible: orders fetch failed:', ordersErr)
      return NextResponse.json({ error: 'Impossible de charger les commandes.' }, { status: 500 })
    }

    // Charge une règle de commission (vendor > global) pour afficher un netRevenue cohérent.
    const { data: vendorRule } = await supabase
      .from('finance_commission_rules')
      .select('*')
      .eq('scope', 'vendor')
      .eq('vendor_id', vendorUserId)
      .order('updated_at', { ascending: false })
      .maybeSingle()

    const { data: globalRule } = await supabase
      .from('finance_commission_rules')
      .select('*')
      .eq('scope', 'global')
      .order('updated_at', { ascending: false })
      .maybeSingle()

    const commissionRule = (vendorRule as any) ?? (globalRule as any) ?? null

    const rows = Array.isArray(orders) ? orders : []

    const eligible = rows
      .filter((o: any) => {
        const id = String(o?.id ?? '')
        if (!id) return false
        if (scheduledOrderIds.has(id)) return false
        if (String(o?.status ?? '').toLowerCase() !== 'delivered') return false
        return true
      })
      .slice(0, 50)
      .map((o: any) => {
        const gross = toNumber(o?.final_total ?? o?.total_amount ?? 0)
        const commission = computeCommissionAmount({ totalAmount: gross, rule: commissionRule })
        const net = Math.max(0, gross - commission)

        return {
          id: String(o?.id ?? ''),
          customerName: String(o?.customer_name ?? 'Client'),
          netRevenue: Math.round(net)
        }
      })

    return NextResponse.json(eligible)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const status = message.toLowerCase().includes('accès') ? 403 : message.toLowerCase().includes('token') ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
