import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'

/**
 * Retourne les transactions financières (ventes) depuis la base.
 */
export async function GET(request: NextRequest) {
  try {
    await assertSuperAdmin(request)
    const supabase = getSupabaseAdmin()

    const { searchParams } = new URL(request.url)
    const q = (searchParams.get('q') ?? '').trim().toLowerCase()
    const status = (searchParams.get('status') ?? '').trim()
    const pageRaw = searchParams.get('page')
    const pageSizeRaw = searchParams.get('pageSize')
    const withCount = searchParams.get('withCount') === 'true'

    const page = pageRaw ? Math.max(1, Number(pageRaw)) : null
    const pageSize = pageSizeRaw ? Math.min(1000, Math.max(1, Number(pageSizeRaw))) : null

    let query = supabase
      .from('finance_transactions')
      .select('*')
      .order('occurred_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    if (q) {
      query = query.or(`vendor_name.ilike.%${q}%,order_id.ilike.%${q}%`)
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
      vendorId: r.vendor_id,
      vendorName: (r.vendor_name ?? r.vendor_id ?? 'Vendeur inconnu') as string,
      orderId: r.order_id,
      grossAmount: Number(r.gross_amount || 0),
      commissionTaken: Number(r.commission_taken || 0),
      netAmount: Number(r.net_amount || 0),
      status: r.status,
      occurredAt: r.occurred_at
    }))

    if (withCount) {
      let countQuery = supabase
        .from('finance_transactions')
        .select('*', { count: 'exact', head: true })

      if (status) {
        countQuery = countQuery.eq('status', status)
      }
      if (q) {
        countQuery = countQuery.or(`vendor_name.ilike.%${q}%,order_id.ilike.%${q}%`)
      }

      const { count } = await countQuery
      return NextResponse.json({ rows, total: count ?? rows.length })
    }

    return NextResponse.json(rows)
  } catch (_) {
    return NextResponse.json([])
  }
}
