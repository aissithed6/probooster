import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'

/**
 * Métriques par vendeur (agrégations sur demandes, transactions et remboursements).
 */
export async function GET(request: NextRequest) {
  try {
    await assertSuperAdmin(request)
    const supabase = getSupabaseAdmin()

    // Récupère demandes et transactions et remboursements en une passe
    const [{ data: reqs, error: reqErr }, { data: txs, error: txErr }, { data: rfs, error: rfErr }] = await Promise.all([
      supabase.from('finance_payment_requests').select('vendor_id, vendor_name, status, net_amount, processed_at'),
      supabase.from('finance_transactions').select('vendor_id, vendor_name, occurred_at'),
      supabase.from('finance_refunds').select('vendor_id, amount, opened_at')
    ])

    if (reqErr || txErr || rfErr) return NextResponse.json([])

    const vendors = new Map<string, { vendorId: string; vendorName: string }>()
    const sums = new Map<string, { pending: number; paid: number; lastPayout?: string }>()
    const txCount = new Map<string, number>()
    const rfCount30 = new Map<string, number>()

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 3600 * 1000)

    ;(reqs ?? []).forEach((r: any) => {
      if (!r.vendor_id) return
      vendors.set(r.vendor_id, { vendorId: r.vendor_id, vendorName: r.vendor_name || '' })
      const cur = sums.get(r.vendor_id) || { pending: 0, paid: 0, lastPayout: undefined as string | undefined }
      if (r.status === 'pending') cur.pending += Number(r.net_amount || 0)
      if (r.status === 'approved') {
        cur.paid += Number(r.net_amount || 0)
        if (r.processed_at && (!cur.lastPayout || new Date(r.processed_at) > new Date(cur.lastPayout))) {
          cur.lastPayout = r.processed_at
        }
      }
      sums.set(r.vendor_id, cur)
    })

    ;(txs ?? []).forEach((t: any) => {
      if (!t.vendor_id) return
      vendors.set(t.vendor_id, { vendorId: t.vendor_id, vendorName: t.vendor_name || '' })
      txCount.set(t.vendor_id, (txCount.get(t.vendor_id) || 0) + 1)
    })

    ;(rfs ?? []).forEach((rf: any) => {
      if (!rf.vendor_id) return
      vendors.set(rf.vendor_id, { vendorId: rf.vendor_id, vendorName: '' })
      if (rf.opened_at && new Date(rf.opened_at) >= thirtyDaysAgo) {
        rfCount30.set(rf.vendor_id, (rfCount30.get(rf.vendor_id) || 0) + 1)
      }
    })

    const rows = Array.from(vendors.values()).map((v) => {
      const sum = sums.get(v.vendorId) || { pending: 0, paid: 0, lastPayout: undefined as string | undefined }
      const tx = txCount.get(v.vendorId) || 0
      const rf = rfCount30.get(v.vendorId) || 0
      const ratio = tx > 0 ? (rf / tx) * 100 : 0
      const riskScore = Math.max(0, Math.min(100, Math.round(ratio)))
      return {
        id: v.vendorId,
        vendorName: v.vendorName,
        pendingAmount: Math.round(sum.pending),
        paidAmount: Math.round(sum.paid),
        riskScore,
        lastPayout: sum.lastPayout ?? null
      }
    })

    return NextResponse.json(rows)
  } catch (_) {
    return NextResponse.json([])
  }
}
