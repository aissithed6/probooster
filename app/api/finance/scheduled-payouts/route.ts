import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'

/**
 * Liste des demandes planifiées (scheduled) depuis la base.
 */
export async function GET(req: NextRequest) {
  await assertSuperAdmin(req)
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('finance_payment_requests')
      .select('*')
      .eq('execution_type', 'scheduled')
      .order('schedule_date', { ascending: true })

    if (error) return NextResponse.json([])

    const rows = (data ?? []).map((r: any) => ({
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

    return NextResponse.json(rows)
  } catch (_) {
    return NextResponse.json([])
  }
}
