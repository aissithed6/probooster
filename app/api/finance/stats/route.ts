import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'

/**
 * Calcule les statistiques financières globales à partir des tables réelles.
 */
export async function GET(request: NextRequest) {
  try {
    try {
      await assertSuperAdmin(request)
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : 'Accès refusé.' },
        { status: 401 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Totaux transactions
    const { data: txRows, error: txErr } = await supabase
      .from('finance_transactions')
      .select('gross_amount, commission_taken, net_amount, occurred_at, status')

    if (txErr) {
      return NextResponse.json({})
    }

    const now = new Date()
    const start12Months = new Date(now)
    start12Months.setMonth(start12Months.getMonth() - 12)
    const start24Months = new Date(now)
    start24Months.setMonth(start24Months.getMonth() - 24)

    const txLast12Months = (txRows ?? []).filter((r) => r.occurred_at && new Date(r.occurred_at) >= start12Months)
    const txPrev12Months = (txRows ?? []).filter(
      (r) => r.occurred_at && new Date(r.occurred_at) >= start24Months && new Date(r.occurred_at) < start12Months
    )

    // Remboursements résolus
    let refundRows: any[] = []
    try {
      // On teste plusieurs sélections, car selon les migrations, certaines colonnes peuvent ne pas exister.
      const candidates = [
        'amount, status, resolved_at, processed_at, occurred_at, created_at, opened_at, updated_at',
        'amount, status, resolved_at, processed_at, occurred_at, created_at',
        'amount, status, resolved_at, occurred_at, created_at',
        'amount, status, processed_at, occurred_at, created_at',
        'amount, status, occurred_at, created_at',
        'amount, status, opened_at, updated_at',
        'amount, status, updated_at',
        'amount, status, opened_at'
      ]

      let lastError: any = null
      for (const select of candidates) {
        const res = await supabase.from('finance_refunds').select(select)
        if (!(res as any)?.error) {
          refundRows = Array.isArray((res as any)?.data) ? (res as any).data : []
          lastError = null
          break
        }
        lastError = (res as any).error
      }

      if (lastError) {
        return NextResponse.json({})
      }
    } catch {
      return NextResponse.json({})
    }

    const resolvedRefunds = (refundRows ?? []).filter((r: any) => r.status === 'resolved')
    const refundDate = (r: any) =>
      (r as any).resolved_at ??
      (r as any).processed_at ??
      (r as any).occurred_at ??
      (r as any).created_at ??
      (r as any).opened_at ??
      (r as any).updated_at

    const refundsLast12Months = resolvedRefunds.filter((r: any) => refundDate(r) && new Date(refundDate(r)) >= start12Months)
    const refundsPrev12Months = resolvedRefunds.filter(
      (r: any) => refundDate(r) && new Date(refundDate(r)) >= start24Months && new Date(refundDate(r)) < start12Months
    )

    const revenueGross = txLast12Months.reduce((s, r) => s + Number(r.gross_amount || 0), 0)
    const revenueRefunds = refundsLast12Months.reduce((s: number, r: any) => s + Number(r.amount || 0), 0)
    const revenueNet = Math.max(0, revenueGross - revenueRefunds)

    const totalRevenue = revenueNet
    const totalCommission = txLast12Months.reduce((s, r) => s + Number(r.commission_taken || 0), 0)
    // Total des versements: somme des flux sortants catégorisés comme "payout" dans la trésorerie
    const { data: cfRows, error: cfErr } = await supabase
      .from('finance_cash_flow')
      .select('amount, category, direction')
      .eq('category', 'payout')
      .eq('direction', 'out')

    if (cfErr) {
      return NextResponse.json({})
    }

    const totalPayouts = (cfRows ?? []).reduce((s, r: any) => s + Number(r.amount || 0), 0)

    // Payouts en attente = net des demandes en statut pending
    const { data: pendingReqs } = await supabase
      .from('finance_payment_requests')
      .select('net_amount, status')
      .eq('status', 'pending')

    const pendingPayouts = (pendingReqs ?? []).reduce((s, r) => s + Number(r.net_amount || 0), 0)

    // Croissance annuelle (12 derniers mois vs 12 mois précédents) basée sur le net.
    const grossLast12 = txLast12Months.reduce((s, r) => s + Number(r.gross_amount || 0), 0)
    const grossPrev12 = txPrev12Months.reduce((s, r) => s + Number(r.gross_amount || 0), 0)
    const refundsLast12 = refundsLast12Months.reduce((s: number, r: any) => s + Number(r.amount || 0), 0)
    const refundsPrev12 = refundsPrev12Months.reduce((s: number, r: any) => s + Number(r.amount || 0), 0)
    const netLast12 = Math.max(0, grossLast12 - refundsLast12)
    const netPrev12 = Math.max(0, grossPrev12 - refundsPrev12)
    const monthlyGrowth = netPrev12 > 0 ? Math.round(((netLast12 - netPrev12) / netPrev12) * 100) : 0

    const averageOrderValue = txLast12Months.length
      ? Math.round((txLast12Months.reduce((s, r) => s + Number(r.gross_amount || 0), 0) / txLast12Months.length))
      : 0

    // Taux d'approbation = demandes approuvées / total demandes
    const { data: allReqs } = await supabase
      .from('finance_payment_requests')
      .select('status')

    const totalReqCount = (allReqs ?? []).length
    const approvedCount = (allReqs ?? []).filter((r) => r.status === 'approved').length
    const approvalRate = totalReqCount > 0 ? Math.round((approvedCount / totalReqCount) * 100) : 0

    // Points & Fidélité - métriques financières associées
    // On tolère les erreurs: en cas d'échec lecture, on considère 0 pour ne pas casser les stats globales
    const [{ data: lpRows, error: lpErr }, { data: wRows, error: wErr }, { data: exRows, error: exErr }, { data: ptRows, error: ptErr }, { data: trRows, error: trErr }, { data: rdRows, error: rdErr }] = await Promise.all([
      supabase.from('loyalty_points').select('points_balance, fcfa_value'),
      supabase.from('point_withdrawal_requests').select('payout_amount, status'),
      supabase.from('point_exchange_history').select('converted_amount, fee_amount'),
      supabase.from('point_transactions').select('fcfa_value, type'),
      supabase.from('point_transfer_requests').select('points_amount, status'),
      supabase.from('loyalty_reward_redemptions').select('points_spent')
    ])

    const pointsTotalBalance = (lpErr ? [] : (lpRows ?? [])).reduce((s: number, r: any) => s + Number(r.points_balance || 0), 0)
    const pointsTotalFcfaValue = (lpErr ? [] : (lpRows ?? [])).reduce((s: number, r: any) => s + Number(r.fcfa_value || 0), 0)

    const approvedWithdrawals = (wErr ? [] : (wRows ?? [])).filter((r: any) => r.status === 'approved')
    const pointsWithdrawalsApproved = approvedWithdrawals.reduce((s: number, r: any) => s + Number(r.payout_amount || 0), 0)

    const pointsExchangesTotal = (exErr ? [] : (exRows ?? [])).reduce((s: number, r: any) => s + Number(r.converted_amount || 0), 0)
    const pointsExchangeFees = (exErr ? [] : (exRows ?? [])).reduce((s: number, r: any) => s + Number(r.fee_amount || 0), 0)

    const pointsFeesFromTransactions = (ptErr ? [] : (ptRows ?? [])).filter((r: any) => typeof r.type === 'string' && r.type.includes('fee'))
      .reduce((s: number, r: any) => s + Number(r.fcfa_value || 0), 0)

    const pointsTransfersVolume = (trErr ? [] : (trRows ?? [])).reduce((s: number, r: any) => s + Number(r.points_amount || 0), 0)
    const pointsRedemptionsTotal = (rdErr ? [] : (rdRows ?? [])).reduce((s: number, r: any) => s + Number(r.points_spent || 0), 0)

    // ── SOURCE UNIQUE DE VÉRITÉ : CA depuis `vendor_revenue_snapshot` (Σ par vendeur) ──
    // Le CA du super-admin (total + par vendeur) DOIT égaler la somme des CA vendeurs
    // (mêmes règles : ventes payées − retours), et non diverger de finance_transactions.
    let revGrossFinal = revenueGross
    let revRefundsFinal = revenueRefunds
    let revNetFinal = revenueNet
    let totalRevenueFinal = totalRevenue
    let vendorRevenue: Array<{
      vendorId: string
      totalRevenue: number
      returnsAmount: number
      netRevenue: number
      totalSales: number
      ordersCount: number
    }> = []

    const { data: snapRows, error: snapErr } = await supabase
      .from('vendor_revenue_snapshot')
      .select('vendor_id, total_revenue, returns_amount, net_revenue, total_sales, orders_count')

    if (!snapErr && Array.isArray(snapRows) && snapRows.length > 0) {
      let sumGross = 0
      let sumReturns = 0
      let sumNet = 0
      for (const r of snapRows) {
        sumGross += Number(r?.total_revenue || 0)
        sumReturns += Number(r?.returns_amount || 0)
        sumNet += Number(r?.net_revenue || 0)
      }
      // N'écrase le CA transactionnel que si le snapshot contient des ventes (sinon on
      // garde le fallback existant, ex. snapshot non encore backfillé / table vide).
      if (sumGross > 0) {
        revGrossFinal = Math.round(sumGross)
        revRefundsFinal = Math.round(sumReturns)
        revNetFinal = Math.round(sumNet)
        totalRevenueFinal = revNetFinal
      }
      vendorRevenue = (snapRows ?? [])
        .map((r) => ({
          vendorId: String(r?.vendor_id ?? ''),
          totalRevenue: Math.round(Number(r?.total_revenue || 0)),
          returnsAmount: Math.round(Number(r?.returns_amount || 0)),
          netRevenue: Math.round(Number(r?.net_revenue || 0)),
          totalSales: Math.round(Number(r?.total_sales || 0)),
          ordersCount: Math.round(Number(r?.orders_count || 0))
        }))
        .sort((a, b) => b.netRevenue - a.netRevenue)
    }

    return NextResponse.json({
      totalRevenue: totalRevenueFinal,
      revenueGross: revGrossFinal,
      revenueRefunds: revRefundsFinal,
      revenueNet: revNetFinal,
      totalCommission,
      totalPayouts,
      pendingPayouts,
      monthlyGrowth,
      averageOrderValue,
      approvalRate,
      vendorRevenue,
      points: {
        totalBalance: pointsTotalBalance,
        totalFcfaValue: pointsTotalFcfaValue,
        withdrawalsApproved: pointsWithdrawalsApproved,
        exchangesTotal: pointsExchangesTotal,
        exchangeFees: pointsExchangeFees,
        feesTotal: pointsFeesFromTransactions,
        transfersVolume: pointsTransfersVolume,
        redemptionsTotal: pointsRedemptionsTotal
      }
    })
  } catch (_) {
    return NextResponse.json({})
  }
}
