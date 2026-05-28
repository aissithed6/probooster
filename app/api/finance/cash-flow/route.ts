import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'

/**
 * Flux de trésorerie (in/out) depuis la base.
 */
export async function GET(request: NextRequest) {
  try {
    await assertSuperAdmin(request)
    const supabase = getSupabaseAdmin()

    const { searchParams } = new URL(request.url)
    const from = (searchParams.get('from') ?? '').trim()
    const to = (searchParams.get('to') ?? '').trim()
    const direction = (searchParams.get('direction') ?? '').trim()
    const category = (searchParams.get('category') ?? '').trim()
    const pageRaw = searchParams.get('page')
    const pageSizeRaw = searchParams.get('pageSize')
    const withCount = searchParams.get('withCount') === 'true'

    const page = pageRaw ? Math.max(1, Number(pageRaw)) : null
    const pageSize = pageSizeRaw ? Math.min(1000, Math.max(1, Number(pageSizeRaw))) : null

    let query = supabase
      .from('finance_cash_flow')
      .select('*')
      .order('occurred_at', { ascending: false })

    if (from) {
      query = query.gte('occurred_at', from)
    }
    if (to) {
      query = query.lte('occurred_at', to)
    }
    if (direction) {
      query = query.eq('direction', direction)
    }
    if (category) {
      query = query.eq('category', category)
    }

    if (page && pageSize) {
      const fromIndex = (page - 1) * pageSize
      const toIndex = fromIndex + pageSize - 1
      query = query.range(fromIndex, toIndex)
    }

    const { data, error } = await query
    if (error) return NextResponse.json([])

    const rows = (data ?? []).map((r: any) => ({
      id: r.id,
      direction: r.direction,
      category: r.category,
      label: r.label,
      amount: Number(r.amount || 0),
      occurredAt: r.occurred_at
    }))
    if (withCount) {
      let countQuery = supabase
        .from('finance_cash_flow')
        .select('*', { count: 'exact', head: true })

      if (from) {
        countQuery = countQuery.gte('occurred_at', from)
      }
      if (to) {
        countQuery = countQuery.lte('occurred_at', to)
      }
      if (direction) {
        countQuery = countQuery.eq('direction', direction)
      }
      if (category) {
        countQuery = countQuery.eq('category', category)
      }

      const { count } = await countQuery
      return NextResponse.json({ rows, total: count ?? rows.length })
    }

    return NextResponse.json(rows)
  } catch (_) {
    return NextResponse.json([])
  }
}

/**
 * Crée un flux de trésorerie (in/out) opérationnel.
 */
export async function POST(req: NextRequest) {
  try {
    await assertSuperAdmin(req)
    const body = (await req.json().catch(() => null)) as {
      direction?: 'in' | 'out'
      category?: string
      label?: string
      amount?: number
      occurredAt?: string | null
    } | null

    const direction = body?.direction
    const category = (body?.category ?? '').trim()
    const label = (body?.label ?? '').trim()
    const amount = Number(body?.amount ?? 0)
    const occurredAt = body?.occurredAt || new Date().toISOString()

    if (!direction || (direction !== 'in' && direction !== 'out')) {
      return NextResponse.json({ error: "Champ 'direction' invalide (in|out)" }, { status: 400 })
    }
    if (!category) {
      return NextResponse.json({ error: "Champ 'category' requis" }, { status: 400 })
    }
    if (!label) {
      return NextResponse.json({ error: "Champ 'label' requis" }, { status: 400 })
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Champ 'amount' doit être un nombre positif" }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('finance_cash_flow')
      .insert({ direction, category, label, amount, occurred_at: occurredAt })
      .select('*')
      .single()

    if (error || !data) {
      throw error || new Error('Insertion cash_flow échouée')
    }

    const created = {
      id: data.id,
      direction: data.direction,
      category: data.category,
      label: data.label,
      amount: Number(data.amount || 0),
      occurredAt: data.occurred_at
    }

    return NextResponse.json(created, { status: 201 })
  } catch (e) {
    console.error('POST /api/finance/cash-flow failed:', e)
    return NextResponse.json({ error: 'Erreur lors de la création du flux de trésorerie.' }, { status: 500 })
  }
}
