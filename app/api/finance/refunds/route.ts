import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'

/**
 * Liste des remboursements depuis la base.
 */
export async function GET(request: NextRequest) {
  try {
    await assertSuperAdmin(request)
    const supabase = getSupabaseAdmin()

    const { searchParams } = new URL(request.url)
    const status = (searchParams.get('status') ?? '').trim()
    const q = (searchParams.get('q') ?? '').trim().toLowerCase()
    const pageRaw = searchParams.get('page')
    const pageSizeRaw = searchParams.get('pageSize')
    const withCount = searchParams.get('withCount') === 'true'

    const page = pageRaw ? Math.max(1, Number(pageRaw)) : null
    const pageSize = pageSizeRaw ? Math.min(1000, Math.max(1, Number(pageSizeRaw))) : null

    let query = supabase
      .from('finance_refunds')
      .select('*')
      .order('opened_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    if (q) {
      query = query.or(`vendor_name.ilike.%${q}%,order_id.ilike.%${q}%,customer_email.ilike.%${q}%`)
    }

    if (page && pageSize) {
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)
    }

    const { data, error } = await query

    if (error) return NextResponse.json([])

    const rows = (data ?? []).map((r: any) => ({
      id: r.id,
      orderId: r.order_id,
      vendorId: r.vendor_id,
      vendorName: (r.vendor_name ?? r.vendor_id ?? 'Vendeur inconnu') as string,
      customerEmail: (r.customer_email ?? '') as string,
      amount: Number(r.amount || 0),
      commissionAdjustment: Number(r.commission_adjustment || 0),
      status: r.status,
      openedAt: r.opened_at,
      updatedAt: r.updated_at ?? undefined,
      reason: r.reason ?? undefined,
      resolutionNotes: r.resolution_notes ?? undefined
    }))

    if (withCount) {
      let countQuery = supabase
        .from('finance_refunds')
        .select('*', { count: 'exact', head: true })

      if (status) {
        countQuery = countQuery.eq('status', status)
      }

      if (q) {
        countQuery = countQuery.or(`vendor_name.ilike.%${q}%,order_id.ilike.%${q}%,customer_email.ilike.%${q}%`)
      }

      const { count } = await countQuery
      return NextResponse.json({ rows, total: count ?? rows.length })
    }

    return NextResponse.json(rows)
  } catch (_) {
    return NextResponse.json([])
  }
}
