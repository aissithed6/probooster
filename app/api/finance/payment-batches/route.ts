import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

/**
 * Liste des lots de paiement avec leurs demandes (sans timeline pour perf).
 */
export async function GET() {
  try {
    const supabase = getSupabaseAdmin()

    const { data: batches, error } = await supabase
      .from('finance_payment_batches')
      .select('*')
      .order('executed_at', { ascending: false })

    if (error) return NextResponse.json([])

    const ids = (batches ?? []).map((b: any) => b.id)
    const { data: reqs } = ids.length
      ? await supabase
          .from('finance_payment_requests')
          .select('*')
          .in('batch_id', ids)
      : { data: [] as any[] }

    const reqByBatch = new Map<string, any[]>()
    ;(reqs ?? []).forEach((r: any) => {
      const arr = reqByBatch.get(r.batch_id) ?? []
      arr.push(r)
      reqByBatch.set(r.batch_id, arr)
    })

    const mapped = (batches ?? []).map((b: any) => {
      const list = (reqByBatch.get(b.id) ?? []).map((r: any) => ({
        id: r.id,
        vendorId: r.vendor_id,
        vendorName: r.vendor_name,
        ordersCount: r.orders_count,
        totalAmount: Number(r.total_amount || 0),
        commissionAmount: Number(r.commission_amount || 0),
        netAmount: Number(r.net_amount || 0),
        status: r.status,
        paymentMethod: r.payment_method,
        bankDetails: r.bank_details ?? undefined,
        mobileNumber: r.mobile_number ?? undefined,
        createdAt: r.created_at,
        processedAt: r.processed_at ?? undefined,
        notes: r.notes ?? undefined,
        executionType: r.execution_type ?? undefined,
        scheduleDate: r.schedule_date ?? undefined,
        batchId: r.batch_id ?? undefined,
        payoutWindow: r.payout_window ?? undefined
      }))
      const totalAmount = list.reduce((s, r) => s + Number(r.netAmount || 0), 0)
      return {
        id: b.id,
        label: b.label,
        status: b.status,
        scheduledAt: b.scheduled_at ?? undefined,
        executedAt: b.executed_at ?? undefined,
        requests: list,
        totalAmount: Number(b.total_amount ?? totalAmount)
      }
    })

    return NextResponse.json(mapped)
  } catch (_) {
    return NextResponse.json([])
  }
}
